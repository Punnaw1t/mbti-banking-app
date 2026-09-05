import { Archetype } from "@/lib/types";
import { GROUP_META } from "@/lib/groups";

const SIZES = {
  sm: { wrap: "h-9 w-9", emoji: "text-base" },
  md: { wrap: "h-14 w-14", emoji: "text-2xl" },
  lg: { wrap: "h-20 w-20", emoji: "text-4xl" },
} as const;

export default function ArchetypeAvatar({
  archetype,
  size = "md",
}: {
  archetype: Archetype;
  size?: keyof typeof SIZES;
}) {
  const meta = GROUP_META[archetype.group];
  const { wrap, emoji } = SIZES[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${meta.border} ${meta.bg} ${wrap}`}
      role="img"
      aria-label={`${archetype.name} (${archetype.group}) mascot`}
      title={`${archetype.name} — ${archetype.group}`}
    >
      <span className={emoji}>{archetype.icon}</span>
    </span>
  );
}
