import { MbtiGroup } from "./types";

// The 4 major MBTI colour groups (the same grouping used across most MBTI
// tools): Analysts, Diplomats, Sentinels, Explorers. Colours are fixed
// (not theme-variable) so they stay recognisable in both light and dark mode.
export const GROUP_ORDER: MbtiGroup[] = ["Analyst", "Diplomat", "Sentinel", "Explorer"];

export const GROUP_META: Record<
  MbtiGroup,
  { text: string; bg: string; border: string; swatch: string; blurb: string }
> = {
  Analyst: {
    text: "text-group-analyst",
    bg: "bg-group-analyst/10",
    border: "border-group-analyst/40",
    swatch: "bg-group-analyst",
    blurb: "Strategic, rational — decides from logic, data, and long-range systems thinking.",
  },
  Diplomat: {
    text: "text-group-diplomat",
    bg: "bg-group-diplomat/10",
    border: "border-group-diplomat/40",
    swatch: "bg-group-diplomat",
    blurb: "Empathetic, values-driven — decides with people, culture, and purpose in mind.",
  },
  Sentinel: {
    text: "text-group-sentinel",
    bg: "bg-group-sentinel/10",
    border: "border-group-sentinel/40",
    swatch: "bg-group-sentinel",
    blurb: "Structured, dependable — decides from process, precedent, and control.",
  },
  Explorer: {
    text: "text-group-explorer",
    bg: "bg-group-explorer/10",
    border: "border-group-explorer/40",
    swatch: "bg-group-explorer",
    blurb: "Pragmatic, adaptable — decides fast from real-time, on-the-ground signal.",
  },
};
