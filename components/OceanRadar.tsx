import { OceanScores } from "@/lib/types";
import { TRAIT_META, TRAIT_ORDER, traitBand } from "@/lib/ocean";

const RINGS = [25, 50, 75, 100];

function vertex(cx: number, cy: number, radius: number, index: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / TRAIT_ORDER.length;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function pentagon(cx: number, cy: number, radius: number): string {
  return TRAIT_ORDER.map((_, i) => vertex(cx, cy, radius, i).join(",")).join(" ");
}

function summary(percentiles: OceanScores): string {
  return TRAIT_ORDER.map((t) => `${TRAIT_META[t].name} ${percentiles[t]}th percentile`).join(", ");
}

// Full size: each axis is a percentile (centre 0, edge 100) with direct labels
// and a hover target per trait.
export default function OceanRadar({ percentiles }: { percentiles: OceanScores }) {
  const width = 500;
  const height = 300;
  const cx = 250;
  const cy = 156;
  const r = 112;
  const scale = (p: number) => (Math.max(p, 2) / 100) * r; // keeps a 0th percentile vertex visible
  const points = TRAIT_ORDER.map((t, i) => vertex(cx, cy, scale(percentiles[t]), i));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg mx-auto" role="img" aria-label={`OCEAN profile: ${summary(percentiles)}`}>
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={pentagon(cx, cy, (ring / 100) * r)}
          fill="none"
          strokeWidth={1}
          strokeDasharray={ring === 50 ? "4 4" : undefined}
          className={ring === 50 ? "stroke-slate-400/60" : "stroke-hairline/10"}
        />
      ))}
      {TRAIT_ORDER.map((t, i) => {
        const [x, y] = vertex(cx, cy, r, i);
        return <line key={t} x1={cx} y1={cy} x2={x} y2={y} strokeWidth={1} className="stroke-hairline/10" />;
      })}

      <polygon
        points={points.map((p) => p.join(",")).join(" ")}
        strokeWidth={2}
        strokeLinejoin="round"
        className="fill-brass/25 stroke-brass"
      />

      {TRAIT_ORDER.map((t, i) => {
        const [x, y] = points[i];
        const [lx, ly] = vertex(cx, cy, r + 12, i);
        const anchor = Math.abs(lx - cx) < 1 ? "middle" : lx > cx ? "start" : "end";
        const labelY = i === 0 ? ly - 18 : ly;
        return (
          <g key={t}>
            <circle cx={x} cy={y} r={4} strokeWidth={2} className="fill-brass stroke-ink-800" />
            <circle cx={x} cy={y} r={14} fill="transparent">
              <title>{`${TRAIT_META[t].name}: ${percentiles[t]}th percentile (${traitBand(percentiles[t])})`}</title>
            </circle>
            <text x={lx} y={labelY} textAnchor={anchor} className="fill-slate-400 text-[12px]">{TRAIT_META[t].name}</text>
            <text x={lx} y={labelY + 15} textAnchor={anchor} className="fill-slate-50 text-[13px] font-medium">{percentiles[t]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Compact pentagon for table rows: shape only, the row carries the labels.
export function OceanRadarMini({ percentiles }: { percentiles: OceanScores }) {
  const size = 52;
  const c = size / 2;
  const r = 23;
  const points = TRAIT_ORDER.map((t, i) => vertex(c, c + 1, (Math.max(percentiles[t], 2) / 100) * r, i).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-12 w-12 shrink-0" role="img" aria-label={`OCEAN profile: ${summary(percentiles)}`}>
      <title>{TRAIT_ORDER.map((t) => `${t} ${percentiles[t]}`).join(" · ")}</title>
      <polygon points={pentagon(c, c + 1, r)} fill="none" strokeWidth={1} className="stroke-hairline/15" />
      <polygon points={points} strokeWidth={1.5} strokeLinejoin="round" className="fill-brass/25 stroke-brass" />
    </svg>
  );
}
