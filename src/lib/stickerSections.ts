import type { Sticker } from "../types";

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
