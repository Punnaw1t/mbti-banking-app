#!/usr/bin/env python3
"""Build the Meridian OCEAN + HR dataset. See data/README.md for the method.

Usage:
    python build_ocean_dataset.py --raw <dir with big5/ hrana/ empperf/> --repo <repo root>

Inputs (Kaggle, not committed):
    big5/IPIP-FFM-data-8Nov2018/data-final.csv   tunguz/big-five-personality-test
    hrana/train.csv, hrana/test.csv              arashnic/hr-ana
    empperf/Uncleaned_employees_final_dataset (1).csv
                                                 sanjanchaudhari/employees-performance-for-hr-analytics
Outputs:
    data/employees_ocean_hr.csv   one row per employee
    data/ocean_norms.csv          raw score -> percentile lookup
    lib/oceanNorms.ts             the same lookup for the app (generated)
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
TRAITS = ["O", "C", "E", "A", "N"]
ITEM_PREFIX = {"O": "OPN", "C": "CSN", "E": "EXT", "A": "AGR", "N": "EST"}

# Reverse-keyed IPIP-50 items (ipip.ori.org/newBigFive5broadKey.htm). The EST
# items are keyed towards Neuroticism here, so a high N means less stable.
REVERSED = {
    "O": {2, 4, 6},
    "C": {2, 4, 6, 8},
    "E": {2, 4, 6, 8, 10},
    "A": {1, 3, 5, 7},
    "N": {2, 4},
}

# Operational validity of each trait for job performance. Sackett, Zhang, Berry
# & Lievens (2022), J. Applied Psychology 107(11), Table 2. N is negated
# emotional stability. These are the correlations the matching step imposes.
TARGET_PERF_CORR = {"O": 0.05, "C": 0.19, "E": 0.10, "A": 0.10, "N": -0.09}

# Trait-leadership correlations from Judge, Bono, Ilies & Gerhardt (2002), used
# as the weights of the leadership index. Mirrored in lib/ocean.ts.
LEADERSHIP_WEIGHTS = {"E": 0.31, "C": 0.28, "N": -0.24, "O": 0.24, "A": 0.08}
EXECUTIVE_FIT_THRESHOLD = 70  # roughly the top 15% of the workforce

# Source department -> Meridian department. `source_department` is kept in the
# CSV, so this mapping (a judgement call) can be changed or audited later.
DEPARTMENT_MAP = {
    "Sales & Marketing": "Retail Banking",
    "Procurement": "Corporate Banking",
    "Legal": "Corporate Banking",
    "Operations": "Customer Service",
    "Finance": "Finance & Accounting",
    "Analytics": "Finance & Accounting",
    "Technology": "IT Support",
    "R&D": "IT Support",
    "HR": "Human Resources",
}

# ASSUMPTION, not measured: how far (in SD) each department's mean sits from the
# general population. Deliberately small, in line with job-family differences.
DEPARTMENT_TILT = {
    "Retail Banking": {"E": 0.30, "A": 0.10},
    "Corporate Banking": {"E": 0.20, "C": 0.20},
    "Customer Service": {"A": 0.30, "N": -0.10},
    "Finance & Accounting": {"C": 0.30, "E": -0.10},
    "IT Support": {"O": 0.30, "E": -0.20},
    "Human Resources": {"A": 0.20, "E": 0.20},
}

EDUCATION = {
    "Bachelors": "Bachelor's", "Bachelor's": "Bachelor's",
    "Masters & above": "Master's & above", "Master's & above": "Master's & above",
    "Below Secondary": "Below Secondary",
}

NINE_BOX = {  # (performance band, potential band) -> (box number, label)
    ("Low", "High"): (1, "Enigma"), ("Medium", "High"): (2, "Growth Employee"), ("High", "High"): (3, "Star"),
    ("Low", "Medium"): (4, "Dilemma"), ("Medium", "Medium"): (5, "Core Player"), ("High", "Medium"): (6, "High Performer"),
    ("Low", "Low"): (7, "Underperformer"), ("Medium", "Low"): (8, "Average Performer"), ("High", "Low"): (9, "Solid Performer"),
}

PROFILES = {
    "E": "The Mobiliser", "C": "The Steward", "S": "The Steady Hand",
    "O": "The Visionary", "A": "The Consensus Builder", "B": "The Balanced Generalist",
}
BALANCED_BELOW = 60


def percentile_rank(s: pd.Series) -> pd.Series:
    return (s.rank(method="average") - 0.5) / len(s) * 100


def band(p: pd.Series) -> pd.Series:
    return pd.cut(p, [-1, 100 / 3, 200 / 3, 101], labels=["Low", "Medium", "High"], right=False).astype(object)


def cronbach_alpha(items: np.ndarray) -> float:
    k = items.shape[1]
    return k / (k - 1) * (1 - items.var(axis=0, ddof=1).sum() / items.sum(axis=1).var(ddof=1))


# --- Big Five --------------------------------------------------------------
def load_big5(raw: Path, report: dict) -> pd.DataFrame:
    item_cols = [f"{ITEM_PREFIX[t]}{i}" for t in TRAITS for i in range(1, 11)]
    df = pd.read_csv(raw / "big5/IPIP-FFM-data-8Nov2018/data-final.csv", sep="\t",
                     usecols=item_cols + ["IPC", "testelapse"], low_memory=False)
    report["big5_raw_rows"] = len(df)

    items = df[item_cols].apply(pd.to_numeric, errors="coerce")
    # 0 is how the source records an unanswered item.
    answered = ((items >= 1) & (items <= 5)).all(axis=1)
    unique_ip = df["IPC"] == 1
    timing = pd.to_numeric(df["testelapse"], errors="coerce").between(100, 3600)  # at least 2s an item
    varied = items.std(axis=1) >= 0.5  # drops straight-lining
    items = items[answered & unique_ip & timing & varied].astype(int)
    report["big5_clean_rows"] = len(items)
    report["big5_filters_removed"] = {
        "incomplete": int((~answered).sum()), "repeat_ip": int((~unique_ip).sum()),
        "implausible_time": int((~timing).sum()), "straight_lining": int((~varied).sum()),
    }

    scores = pd.DataFrame(index=items.index)
    report["cronbach_alpha"] = {}
    for t in TRAITS:
        keyed = np.column_stack([
            6 - items[f"{ITEM_PREFIX[t]}{i}"] if i in REVERSED[t] else items[f"{ITEM_PREFIX[t]}{i}"]
            for i in range(1, 11)
        ])
        scores[t] = keyed.sum(axis=1)
        report["cronbach_alpha"][t] = round(float(cronbach_alpha(keyed)), 3)
    return scores


def build_norms(scores: pd.DataFrame) -> pd.DataFrame:
    # Mid-rank percentile of each possible raw score (10-50).
    rows = {}
    for t in TRAITS:
        counts = scores[t].value_counts().reindex(range(10, 51), fill_value=0)
        below = counts.cumsum().shift(1, fill_value=0)
        rows[t] = (100 * (below + 0.5 * counts) / counts.sum()).round().astype(int)
    norms = pd.DataFrame(rows)
    norms.index.name = "raw_score"
    return norms


# --- HR --------------------------------------------------------------------
def load_hr(raw: Path, report: dict):
    train = pd.read_csv(raw / "hrana/train.csv").rename(columns={"awards_won?": "awards_won"})
    test = pd.read_csv(raw / "hrana/test.csv").rename(columns={"awards_won?": "awards_won"})
    kpi = pd.read_csv(raw / "empperf/Uncleaned_employees_final_dataset (1).csv")
    report["hr_rows"] = {"train": len(train), "test": len(test), "employee_performance": len(kpi)}

    # The performance file is a test.csv subset carrying one extra column. It has
    # 3 surplus rows; two conflict with test.csv, which is why only employee_id
    # and the KPI flag are taken from it.
    kpi = kpi[["employee_id", "KPIs_met_more_than_80"]].drop_duplicates("employee_id")
    hr = test.merge(kpi, on="employee_id", how="inner", validate="one_to_one")
    hr["education_filled"] = hr["education"].map(EDUCATION).fillna("Unknown")
    train["education_filled"] = train["education"].map(EDUCATION).fillna("Unknown")
    report["hr_employees"] = len(hr)
    return train, hr


def potential_features(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
    # Training score levels differ hugely by department, so it is compared to
    # peers. Rating, KPI and awards stay out: they are the performance axis, and
    # the two 9-box axes need to carry different information.
    stats = ref.groupby("department")["avg_training_score"].agg(["mean", "std"])
    z = (df["avg_training_score"] - df["department"].map(stats["mean"])) / df["department"].map(stats["std"])
    # Promotion rate is flat until about +1 SD and then climbs steeply, so the
    # curve is a hinge there. A plain z**2 would also reward the lowest scorers.
    over = (z - 1).clip(lower=0)
    x = pd.DataFrame({
        "training_z": z, "training_over": over, "training_over2": over ** 2,
        "no_of_trainings": df["no_of_trainings"],
        "age": df["age"], "length_of_service": df["length_of_service"],
    }, index=df.index)
    x["masters"] = (df["education_filled"] == "Master's & above").astype(int)
    x["referred"] = (df["recruitment_channel"] == "referred").astype(int)
    return x


def add_potential(train: pd.DataFrame, hr: pd.DataFrame, report: dict) -> pd.DataFrame:
    ref = pd.concat([train, hr], ignore_index=True)
    x_train, x_hr = potential_features(train, ref), potential_features(hr, ref)
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced"))
    report["potential_model_cv_auc"] = round(float(
        cross_val_score(model, x_train, train["is_promoted"], cv=5, scoring="roc_auc").mean()), 3)
    model.fit(x_train, train["is_promoted"])
    report["potential_model_coefficients"] = dict(zip(x_train.columns, model[-1].coef_[0].round(3).tolist()))

    hr["promotion_propensity"] = model.predict_proba(x_hr)[:, 1]
    hr["potential_index"] = percentile_rank(hr["promotion_propensity"]).round(1)
    hr["potential_band"] = band(hr["potential_index"])
    return hr


def add_performance(hr: pd.DataFrame) -> pd.DataFrame:
    rating = (hr["previous_year_rating"] - 1) / 4
    # Weighted mean of the components an employee actually has: employees in
    # their first year have no rating, so the rating weight drops out for them.
    weights = np.column_stack([rating.notna() * 0.5, np.full(len(hr), 0.4), np.full(len(hr), 0.1)])
    values = np.column_stack([rating.fillna(0), hr["KPIs_met_more_than_80"], hr["awards_won"]])
    hr["_performance_raw"] = (weights * values).sum(axis=1) / weights.sum(axis=1)

    rated = hr["previous_year_rating"].notna()
    hr["rating_available"] = rated.astype(int)
    hr["performance_index"] = percentile_rank(hr.loc[rated, "_performance_raw"]).round(1)
    hr["performance_band"] = band(hr["performance_index"]).fillna("Not rated")
    return hr


# --- Statistical matching ---------------------------------------------------
def match_ocean(hr: pd.DataFrame, scores: pd.DataFrame, rng: np.random.Generator, report: dict) -> pd.DataFrame:
    """Give each employee one real IPIP respondent's scores.

    The sources share no key, so this is a synthetic link, not a discovered one:
    1. draw each department's respondents with weights tilted to DEPARTMENT_TILT;
    2. score each respondent on a latent M = b'z + noise, with b chosen so that
       corr(trait, M) equals TARGET_PERF_CORR;
    3. pair the k-th highest M with the k-th best performer in the department.
    Scores are never edited, so every profile is a real respondent's, and the
    covariance between traits is preserved.
    """
    mu, sd = scores[TRAITS].mean(), scores[TRAITS].std()
    z_all = ((scores[TRAITS] - mu) / sd).to_numpy()
    sigma = np.corrcoef(z_all, rowvar=False)
    sigma_inv = np.linalg.inv(sigma)

    r = np.array([TARGET_PERF_CORR[t] for t in TRAITS])
    b = sigma_inv @ r
    noise_sd = np.sqrt(1 - r @ sigma_inv @ r)
    report["trait_correlation_matrix"] = pd.DataFrame(sigma, TRAITS, TRAITS).round(2).to_dict()

    available = np.ones(len(scores), dtype=bool)
    ids = scores.index.to_numpy()
    raw = scores[TRAITS].to_numpy()
    out = hr.copy()
    for t in TRAITS:
        out[t] = 0
    out["ocean_source_row"] = 0

    for dept, group in out.groupby("department"):
        tilt = np.array([DEPARTMENT_TILT[dept].get(t, 0.0) for t in TRAITS])
        logw = z_all[available] @ (sigma_inv @ tilt)  # exponential tilt moves the mean by `tilt`
        p = np.exp(logw - logw.max())
        pool = np.flatnonzero(available)
        chosen = rng.choice(pool, size=len(group), replace=False, p=p / p.sum())
        available[chosen] = False

        latent = z_all[chosen] @ b + rng.normal(0, noise_sd, len(chosen))
        perf_order = (group["_performance_raw"] + rng.uniform(0, 1e-6, len(group))).argsort().to_numpy()
        pair = chosen[np.argsort(latent)]
        idx = group.index.to_numpy()[perf_order]
        out.loc[idx, TRAITS] = raw[pair]
        out.loc[idx, "ocean_source_row"] = ids[pair]
    return out


def add_ocean_labels(df: pd.DataFrame, norms: pd.DataFrame) -> pd.DataFrame:
    for t in TRAITS:
        df[f"{t}_pct"] = df[t].map(norms[t])

    total = sum(abs(w) for w in LEADERSHIP_WEIGHTS.values())
    df["leadership_index"] = (sum(
        abs(w) * (df[f"{t}_pct"] if w > 0 else 100 - df[f"{t}_pct"]) for t, w in LEADERSHIP_WEIGHTS.items()
    ) / total).round(1)
    df["executive_fit"] = np.where(df["leadership_index"] >= EXECUTIVE_FIT_THRESHOLD, "Yes", "No")

    # Same rule as getProfile() in lib/ocean.ts: strongest trait, ties in
    # leadership-weight order, Balanced when nothing stands out.
    strengths = pd.DataFrame({"E": df["E_pct"], "C": df["C_pct"], "S": 100 - df["N_pct"],
                              "O": df["O_pct"], "A": df["A_pct"]})
    dominant = strengths.idxmax(axis=1)
    dominant[strengths.max(axis=1) < BALANCED_BELOW] = "B"
    df["decision_profile"] = dominant.map(PROFILES)
    return df


def add_nine_box(df: pd.DataFrame) -> pd.DataFrame:
    boxes = [NINE_BOX.get(k, ("", "Not rated")) for k in zip(df["performance_band"], df["potential_band"])]
    df["nine_box"] = [b[0] for b in boxes]
    df["nine_box_label"] = [b[1] for b in boxes]
    return df


def validate(df: pd.DataFrame, report: dict):
    rated = df[df["rating_available"] == 1]
    report["achieved_trait_perf_corr"] = {
        t: {"target": TARGET_PERF_CORR[t], "achieved_within_department": round(float(
            np.corrcoef(rated[t] - rated.groupby("department")[t].transform("mean"),
                        rated["_performance_raw"] - rated.groupby("department")["_performance_raw"].transform("mean"))[0, 1]), 3)}
        for t in TRAITS
    }
    report["perf_vs_potential_corr"] = round(float(rated["performance_index"].corr(rated["potential_index"])), 3)
    report["potential_auc_vs_kpi_in_employees"] = round(float(roc_auc_score(df["KPIs_met_more_than_80"], df["potential_index"])), 3)
    report["department_rows"] = df["department"].value_counts().to_dict()
    report["nine_box_rows"] = df["nine_box_label"].value_counts().to_dict()
    report["decision_profile_rows"] = df["decision_profile"].value_counts().to_dict()
    report["executive_fit_rate"] = round(float((df["executive_fit"] == "Yes").mean()), 3)
    report["duplicate_respondents"] = int(df["ocean_source_row"].duplicated().sum())


COLUMNS = [
    "employee_id", "department", "source_department", "region", "education", "gender", "recruitment_channel",
    "age", "length_of_service", "no_of_trainings", "avg_training_score", "previous_year_rating",
    "kpis_met_more_than_80", "awards_won",
    "O_raw", "C_raw", "E_raw", "A_raw", "N_raw", "O_pct", "C_pct", "E_pct", "A_pct", "N_pct",
    "decision_profile", "leadership_index", "executive_fit",
    "performance_index", "performance_band", "promotion_propensity", "potential_index", "potential_band",
    "nine_box", "nine_box_label", "rating_available", "ocean_source_row",
]


def write_outputs(df: pd.DataFrame, norms: pd.DataFrame, repo: Path):
    out = df.drop(columns=["education"]).rename(columns={
        "education_filled": "education",
        "KPIs_met_more_than_80": "kpis_met_more_than_80",
        **{t: f"{t}_raw" for t in TRAITS},
    })
    out["previous_year_rating"] = out["previous_year_rating"].astype("Int64")
    out["promotion_propensity"] = out["promotion_propensity"].round(4)
    out[COLUMNS].sort_values("employee_id").to_csv(repo / "data/employees_ocean_hr.csv", index=False)
    norms.to_csv(repo / "data/ocean_norms.csv")

    table = {t: norms[t].tolist() for t in TRAITS}
    body = ",\n".join(f"  {t}: {json.dumps(v, separators=(',', ':'))}" for t, v in table.items())
    (repo / "lib/oceanNorms.ts").write_text(
        "// GENERATED by data/build_ocean_dataset.py — do not edit by hand.\n"
        "// Percentile of each raw trait score, indexed by (raw score - 10), so raw 10 is\n"
        "// element 0 and raw 50 is element 40. Same table as data/ocean_norms.csv.\n"
        'import { OceanTrait } from "./types";\n\n'
        f"export const OCEAN_NORMS: Record<OceanTrait, number[]> = {{\n{body},\n}};\n"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", type=Path, required=True)
    ap.add_argument("--repo", type=Path, required=True)
    args = ap.parse_args()

    report: dict = {}
    rng = np.random.default_rng(SEED)
    scores = load_big5(args.raw, report)
    norms = build_norms(scores)
    report["big5_trait_means"] = scores.mean().round(2).to_dict()

    train, hr = load_hr(args.raw, report)
    hr = add_performance(add_potential(train, hr, report))
    hr["source_department"] = hr["department"]
    hr["department"] = hr["department"].map(DEPARTMENT_MAP)
    df = add_nine_box(add_ocean_labels(match_ocean(hr, scores, rng, report), norms))
    validate(df, report)

    pop_mu, pop_sd = scores[TRAITS].mean(), scores[TRAITS].std()
    report["department_trait_means_z"] = (
        ((df[TRAITS] - pop_mu) / pop_sd).groupby(df["department"]).mean().round(2).to_dict("index"))

    write_outputs(df, norms, args.repo)
    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    main()
