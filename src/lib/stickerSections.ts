import type { Sticker, StickerSection } from "../types";

export const SECTION_OPTIONS: { id: StickerSection | "all"; label: string }[] = [
  { id: "all", label: "All sections" },
  { id: "fwc", label: "FWC & intro (00, FWC1–19)" },
  { id: "coca_cola", label: "Coca-Cola promos" },
  { id: "teams", label: "National teams" },
];

/** Logical order for FWC / intro stickers in the gallery section filter. */
export const FWC_DISPLAY_ORDER = [
  "00",
  "FWC1",
  "FWC2",
  "FWC3",
  "FWC4",
  "FWC5",
  "FWC6",
  "FWC7",
  "FWC8",
  "FWC9",
  "FWC10",
  "FWC11",
  "FWC12",
  "FWC13",
  "FWC14",
  "FWC15",
  "FWC16",
  "FWC17",
  "FWC18",
  "FWC19",
] as const;

const fwcOrder = new Map<string, number>(FWC_DISPLAY_ORDER.map((code, index) => [code, index]));

export function fwcSortIndex(code: string): number {
  return fwcOrder.get(code) ?? 999;
}

export function isFwcSticker(sticker: Sticker): boolean {
  return sticker.section === "fwc";
}

export function sortForSection<T extends Sticker>(stickers: T[], section: StickerSection | "all"): T[] {
  if (section === "fwc") {
    return [...stickers].sort((a, b) => fwcSortIndex(a.code) - fwcSortIndex(b.code));
  }
  if (section === "coca_cola") {
    return [...stickers].sort((a, b) => a.slot! - b.slot!);
  }
  return stickers;
}
