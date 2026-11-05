import { OceanScores } from "@/lib/types";
import { percentiles, TRAIT_META, TRAIT_ORDER, traitBand } from "@/lib/ocean";
import OceanRadar from "./OceanRadar";

// The pentagon plus its table view: same numbers, readable without the chart.
export default function OceanPanel({ scores }: { scores: OceanScores }) {
  const pct = percentiles(scores);
  return (
    <div>
      <OceanRadar percentiles={pct} />
      <p className="text-xs text-slate-500 text-center mt-1 mb-5">
        Percentile against 592,204 IPIP-50 respondents. The dashed ring is the 50th percentile, the population average.
        A higher score is not always better: high Neuroticism means feeling stress more strongly.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-hairline/10">
            <th className="py-2 font-normal">Trait</th>
            <th className="py-2 font-normal text-right pr-4">Percentile</th>
            <th className="py-2 pr-4 font-normal">Level</th>
            <th className="py-2 font-normal hidden sm:table-cell">What it suggests</th>
          </tr>
        </thead>
        <tbody>
          {TRAIT_ORDER.map((t) => {
            const band = traitBand(pct[t]);
            return (
              <tr key={t} className="border-b border-hairline/5 last:border-0">
                <td className="py-2 text-slate-50">{TRAIT_META[t].name}</td>
                <td className="py-2 text-right pr-4 text-slate-50 tabular-nums">{pct[t]}</td>
                <td className="py-2 pr-4 text-slate-300 [html.light_&]:text-black">{band}</td>
                <td className="py-2 text-slate-400 hidden sm:table-cell">
                  {band === "Moderate" ? "Between the two poles" : band === "High" ? TRAIT_META[t].high : TRAIT_META[t].low}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
