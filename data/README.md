# Meridian OCEAN + HR dataset

| File | What it is |
|---|---|
| `employees_ocean_hr.csv` | 17,414 employees, one row each: HR record, OCEAN scores, 9-box placement |
| `ocean_norms.csv` | Raw score (10–50) to percentile lookup for each trait |
| `build_ocean_dataset.py` | Rebuilds both files and `lib/oceanNorms.ts` (fixed seed, reproducible) |

## Read this first: the OCEAN columns are a synthetic link

The personality data and the HR data come from different people and share no key.
**Nobody in this file actually took this personality test as this employee.** Each
row pairs a real employee record with a real, anonymous test respondent, chosen so
the combined data behaves the way published research says it should.

So this data is fine for building and demonstrating the DSS. It is **not** evidence:
- The trait-performance correlations were put in on purpose. Finding them in this
  file does not show that personality predicts performance, because the result is
  circular.
- Department differences in personality are assumptions (see below), not findings.
- Personality was matched only on department and performance, so any pattern
  between personality and age, gender, region or education is meaningless.
- Do not use it for real decisions about real people.

The HR columns are not affected: they are the source values, cleaned.

## How the three sources fit together

| Source | Rows | Used for |
|---|---|---|
| [Big Five Personality Test](https://www.kaggle.com/datasets/tunguz/big-five-personality-test) (IPIP-50) | 1,015,341 | OCEAN scores and percentile norms |
| [Employee's Performance for HR Analytics](https://www.kaggle.com/datasets/sanjanchaudhari/employees-performance-for-hr-analytics) | 17,417 | The employees, including their KPI flag |
| [hr-ana](https://www.kaggle.com/datasets/arashnic/hr-ana) `test.csv` | 23,490 | Cross-check of the same employees |
| [hr-ana](https://www.kaggle.com/datasets/arashnic/hr-ana) `train.csv` | 54,808 | Training the potential model (`is_promoted`) |

**The two HR sources are one population, and that link is real.** All 17,414 distinct
employees in the performance file are in `test.csv`, and every shared column agrees.
It is effectively `test.csv` with a KPI column added. `train.csv` is a separate group
with no overlap, and it is the only file with `is_promoted`, so no employee has both
a KPI flag and a promotion outcome. That is why promotion is modelled, not joined.

### Steps

1. **Clean IPIP-50.** Keep respondents with every item answered, one record per IP
   (`IPC == 1`, as the codebook advises), 100–3,600 seconds on the test, and no
   straight-lining. 592,204 remain. Cronbach's α is .80–.90 per trait.
2. **Norms.** Percentiles come from those 592,204 people. They are a global online
   sample, not Thai bankers.
3. **Clean HR.** Drop 3 surplus rows from the performance file: two are exact
   duplicates, and one contradicts `test.csv`, which is treated as correct. Standardise education; blanks become
   `Unknown`.
4. **Performance axis.** Weighted mean of rating (50%), KPI (40%) and awards (10%),
   as a percentile. 1,363 employees, all in their first year, have no rating, so they
   are `Not rated` and get no 9-box placement.
5. **Potential axis.** A logistic regression trained on `train.csv` predicts promotion
   from peer-relative training score, trainings attended, age, tenure, education and
   recruitment channel. Performance inputs are left out so the two axes stay distinct
   (their correlation is .07). Cross-validated AUC is .714. Nearly all of that signal
   comes from scoring above +1 SD on training, so differences lower down are weak.
6. **Statistical matching.** Each department draws its own respondents without
   replacement, tilted towards the assumptions below. Respondents are then paired with
   employees by rank, on a latent score built to hit the target correlations. Scores
   are never edited, so each profile is a real person's.

### Assumptions you may want to change

All are constants at the top of `build_ocean_dataset.py`.

**Target trait-performance correlations,** from Sackett et al. (2022):

| Trait | Target | Achieved (within department) |
|---|---|---|
| Openness | .05 | .042 |
| Conscientiousness | .19 | .186 |
| Extraversion | .10 | .090 |
| Agreeableness | .10 | .086 |
| Neuroticism | −.09 | −.088 |

**Department mapping** (a judgement call; the original is kept in `source_department`):

| Source | Meridian department | Rows |
|---|---|---|
| Sales & Marketing | Retail Banking | 5,458 |
| Operations | Customer Service | 3,524 |
| Procurement, Legal | Corporate Banking | 2,572 |
| Technology, R&D | IT Support | 2,531 |
| Finance, Analytics | Finance & Accounting | 2,499 |
| HR | Human Resources | 830 |

**Department personality tilts, in SD.** These are my assumptions, not measurements:

| Department | Tilt |
|---|---|
| Retail Banking | E +.30, A +.10 |
| Corporate Banking | E +.20, C +.20 |
| Customer Service | A +.30, N −.10 |
| Finance & Accounting | C +.30, E −.10 |
| IT Support | O +.30, E −.20 |
| Human Resources | A +.20, E +.20 |

## Columns in `employees_ocean_hr.csv`

| Column | Meaning | Origin |
|---|---|---|
| `employee_id` | Source employee ID | Source |
| `department` | Meridian department | Mapped |
| `source_department` | Original department | Source |
| `region`, `gender`, `recruitment_channel`, `age`, `length_of_service`, `no_of_trainings`, `avg_training_score` | As in the source | Source |
| `education` | Standardised; blanks are `Unknown` | Cleaned |
| `previous_year_rating` | 1–5; blank in the first year of service | Source |
| `kpis_met_more_than_80` | 1 if more than 80% of KPIs were met | Source |
| `awards_won` | 1 if an award was won | Source |
| `O_raw` … `N_raw` | Trait total, 10–50 | Synthetic link |
| `O_pct` … `N_pct` | Percentile, 0–100. These draw the pentagon | Synthetic link |
| `decision_profile` | Strongest trait's profile (see `lib/ocean.ts`) | Derived |
| `leadership_index` | Percentiles weighted by Judge et al. (2002), N inverted | Derived |
| `executive_fit` | `Yes` if `leadership_index` ≥ 70 (14.5% of rows) | Derived |
| `performance_index` | Percentile; blank if unrated | Derived |
| `performance_band` | Low / Medium / High / Not rated | Derived |
| `promotion_propensity` | Model score. Class-balanced, so it ranks people and is **not** a probability | Modelled |
| `potential_index` | Percentile of the score above | Modelled |
| `potential_band` | Low / Medium / High | Modelled |
| `nine_box`, `nine_box_label` | 9-box cell, 1–9, and its name; blank and `Not rated` if unrated | Derived |
| `rating_available` | 0 for first-year employees | Derived |
| `ocean_source_row` | Row of `data-final.csv` the scores came from | Traceability |

Bands split the percentile into thirds. Performance inputs are coarse, so many people
tie: the bands hold 6,987 Low, 3,765 Medium and 5,299 High rather than equal counts.

## Rebuilding

Download the three datasets into `big5/`, `hrana/` and `empperf/`, then:

```bash
pip install pandas numpy scikit-learn
python data/build_ocean_dataset.py --raw <folder with the three datasets> --repo .
```

## References

- Sackett, Zhang, Berry & Lievens (2022), *Journal of Applied Psychology* 107(11), 2040–2068.
- Judge, Bono, Ilies & Gerhardt (2002), *Journal of Applied Psychology* 87(4), 765–780.
- Goldberg, IPIP Big-Five Factor Markers: https://ipip.ori.org/newBigFive5broadKey.htm
