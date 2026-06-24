import catalog from "../data/stickers.json";
import type { Sticker } from "../types";

const stickers = catalog.stickers as Sticker[];
const byCode = new Map(stickers.map((s) => [s.code, s]));

export function getAllStickers(): Sticker[] {
  return stickers;
}

export function getSticker(code: string): Sticker | undefined {
  return byCode.get(normalizeCode(code));
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function parseStickerCode(raw: string): string | null {
  const n = normalizeCode(raw);
  if (n === "00") return "00";
  if (/^FWC\d{1,2}$/.test(n)) return n;
  if (/^[A-Z]{3}\d{1,2}$/.test(n)) return n;
  return null;
}

export function lookupByTeamSlot(teamCode: string, slot: number): Sticker | undefined {
  const code = `${teamCode.toUpperCase()}${slot}`;
  return byCode.get(code);
}

export function getCountries(): string[] {
  const set = new Set(stickers.map((s) => s.country));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function searchStickers(
  query: string,
  country?: string,
): Sticker[] {
  const q = query.trim().toLowerCase();
  return stickers.filter((s) => {
    if (country && country !== "all" && s.country !== country) return false;
    if (!q) return true;
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.teamCode.toLowerCase().includes(q)
    );
  });
}

export const TEAM_CODES = [...new Set(stickers.filter((s) => s.slot !== null).map((s) => s.teamCode))].sort();
