import Image from "next/image";
import { Archetype } from "@/lib/types";
import { GROUP_META } from "@/lib/groups";

const SIZES = {
  sm: { wrap: "h-[72px] w-[72px]", icon: 52 },
  md: { wrap: "h-28 w-28", icon: 84 },
  lg: { wrap: "h-40 w-40", icon: 124 },
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
      <Image src={archetype.icon} alt="" width={icon} height={icon} unoptimized />
    </span>
  );
}
