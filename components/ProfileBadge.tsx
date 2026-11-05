import { OceanScores } from "@/lib/types";
import { getProfile, isExecutiveFit } from "@/lib/ocean";

export default function ProfileBadge({ scores, size = "md" }: { scores: OceanScores; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizes} ${
        isExecutiveFit(scores)
          ? "border-brass/60 bg-brass/10 text-brass-light"
          : "border-slate-400/30 bg-hairline/5 text-slate-200"
      }`}
    >
      {getProfile(scores).name}
    </span>
  );
}
