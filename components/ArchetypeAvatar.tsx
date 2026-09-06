import Image from "next/image";
import { Archetype } from "@/lib/types";
import { GROUP_META } from "@/lib/groups";

// Wrapper shrinks on narrow screens (full size only from `sm:` up) so the
// avatar never crowds out the text sitting next to it on a phone.
const SIZES = {
  sm: { wrap: "h-12 w-12 sm:h-[72px] sm:w-[72px] p-2", icon: 72 },
  md: { wrap: "h-16 w-16 sm:h-28 sm:w-28 p-2.5", icon: 112 },
  lg: { wrap: "h-20 w-20 sm:h-40 sm:w-40 p-3", icon: 160 },
} as const;

export default function ArchetypeAvatar({
  archetype,
  size = "md",
}: {
  archetype: Archetype;
  size?: keyof typeof SIZES;
}) {
  const meta = GROUP_META[archetype.group];
  const { wrap, icon } = SIZES[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${meta.border} ${meta.bg} ${wrap}`}
      role="img"
      aria-label={`${archetype.name} (${archetype.group}) mascot`}
      title={`${archetype.name} — ${archetype.group}`}
    >
      <Image
        src={archetype.icon}
        alt=""
        width={icon}
        height={icon}
        unoptimized
        className="h-full w-full object-contain"
      />
    </span>
  );
}
