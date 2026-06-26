import catalog from "../data/stickers.json";
import { countryOrderInGroup, teamOrderInGroup } from "./albumGroupOrder";
import { countryFlag } from "./countryFlags";
import { fwcSortIndex } from "./stickerSections";
import type { Sticker } from "../types";

const catalogStickers = catalog.stickers as Sticker[];

export const GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export type WorldCupGroup = (typeof GROUP_ORDER)[number];

export interface CountryFilterGroup {
  id: string;
  label: string;
  countries: string[];
}

const SPECIAL_COUNTRIES = [
  "FIFA Museum",
  "FIFA World Cup 2026",
  "Host Countries & Cities",
  "Panini",
] as const;

/** Virtual country-filter value for Coca-Cola promos (not a real sticker.country). */
export const COCA_COLA_COUNTRY_FILTER = "Coca-Cola promos";

const EXPORT_SECTION_ORDER = [...GROUP_ORDER, "FWC", "Coca-Cola", "Special"] as const;

/** country name → team code for national teams */
const COUNTRY_TO_TEAM = new Map<string, string>();
for (const sticker of catalogStickers) {
  if (sticker.section === "teams" && sticker.group) {
    COUNTRY_TO_TEAM.set(sticker.country, sticker.teamCode);
  }
}

function exportSectionKey(sticker: Sticker): string {
  if (sticker.group) return sticker.group;
  if (sticker.section === "fwc") return "FWC";
  if (sticker.section === "coca_cola") return "Coca-Cola";
  return "Special";
}

function sectionSortIndex(sticker: Sticker): number {
  const key = exportSectionKey(sticker);
  const index = EXPORT_SECTION_ORDER.indexOf(key as (typeof EXPORT_SECTION_ORDER)[number]);
  return index === -1 ? EXPORT_SECTION_ORDER.length : index;
}

function countryStartOrder(sticker: Sticker): number {
  if (sticker.section === "fwc") {
    return fwcSortIndex(sticker.code);
  }
  if (sticker.group) {
    const byTeam = teamOrderInGroup(sticker.group, sticker.teamCode);
    if (byTeam !== undefined) return byTeam;
    const byCountry = countryOrderInGroup(sticker.group, sticker.country, COUNTRY_TO_TEAM);
    if (byCountry !== undefined) return byCountry;
  }
  return sticker.albumOrder;
}

/** Group → country (album index order) → sticker (album order). */
export function compareByAlbumGroupOrder(a: Sticker, b: Sticker): number {
  const sectionDiff = sectionSortIndex(a) - sectionSortIndex(b);
  if (sectionDiff !== 0) return sectionDiff;

  const countryDiff = countryStartOrder(a) - countryStartOrder(b);
  if (countryDiff !== 0) return countryDiff;

  return a.albumOrder - b.albumOrder;
}

/** @deprecated Use compareByAlbumGroupOrder */
export const compareByGroupThenCountry = compareByAlbumGroupOrder;

export function sortByAlbumGroupOrder<T extends Sticker>(stickers: T[]): T[] {
  return [...stickers].sort(compareByAlbumGroupOrder);
}

export function compareCountryLabels(
  a: string,
  b: string,
  stickers: Sticker[],
): number {
  const stickerA = stickers.find((s) => s.country === a);
  const stickerB = stickers.find((s) => s.country === b);
  if (stickerA && stickerB) return compareByAlbumGroupOrder(stickerA, stickerB);
  return a.localeCompare(b);
}

export function matchesCountryFilter(sticker: Sticker, filter: string): boolean {
  if (filter === COCA_COLA_COUNTRY_FILTER) return sticker.section === "coca_cola";
  return sticker.country === filter;
}

export function getCountryFilterOptions(stickers: Sticker[]): CountryFilterGroup[] {
  const byGroup = new Map<string, Set<string>>();
  for (const sticker of stickers) {
    if (sticker.section !== "teams" || !sticker.group) continue;
    const countries = byGroup.get(sticker.group) ?? new Set<string>();
    countries.add(sticker.country);
    byGroup.set(sticker.group, countries);
  }

  const groups: CountryFilterGroup[] = GROUP_ORDER.filter((group) => byGroup.has(group)).map((group) => {
    const countries = [...byGroup.get(group)!].sort((a, b) => {
      const orderA = countryOrderInGroup(group, a, COUNTRY_TO_TEAM) ?? 99;
      const orderB = countryOrderInGroup(group, b, COUNTRY_TO_TEAM) ?? 99;
      return orderA - orderB;
    });
    return { id: group, label: `Group ${group}`, countries };
  });

  const special: string[] = SPECIAL_COUNTRIES.filter((country) => stickers.some((s) => s.country === country)).sort(
    (a, b) => {
      const stickerA = stickers.find((s) => s.country === a);
      const stickerB = stickers.find((s) => s.country === b);
      if (stickerA && stickerB) return compareByAlbumGroupOrder(stickerA, stickerB);
      return a.localeCompare(b);
    },
  );
  if (stickers.some((s) => s.section === "coca_cola")) {
    special.push(COCA_COLA_COUNTRY_FILTER);
  }
  if (special.length > 0) {
    groups.push({ id: "special", label: "Special", countries: special });
  }

  return groups;
}

export function formatCountryHeading(sticker: Sticker): string {
  if (sticker.group) return `Group ${sticker.group} · ${sticker.country}`;
  return sticker.country;
}

function groupByCountryInOrder<T extends Sticker>(stickers: T[]): { country: string; items: T[] }[] {
  const groups: { country: string; items: T[] }[] = [];
  for (const sticker of sortByAlbumGroupOrder(stickers)) {
    const last = groups[groups.length - 1];
    if (last?.country === sticker.country) {
      last.items.push(sticker);
    } else {
      groups.push({ country: sticker.country, items: [sticker] });
    }
  }
  return groups;
}

function formatGroupedCountryExport<T extends Sticker>(
  stickers: T[],
  formatCode: (sticker: T) => string,
): string {
  return groupByCountryInOrder(stickers)
    .map(({ country, items }) => {
      const codes = items.map(formatCode).join(", ");
      return `${countryFlag(country)} ${country}: ${codes}`;
    })
    .join("\n");
}

/** Missing stickers: one line per country in group order, with flag prefix. */
export function formatAlbumOrderExport(stickers: Sticker[]): string {
  return formatGroupedCountryExport(stickers, (s) => s.code);
}

/** Duplicates: same layout, with xN only when more than one extra copy. */
export function formatDuplicatesExport(stickers: Array<Sticker & { extras: number }>): string {
  return formatGroupedCountryExport(stickers, (s) =>
    s.extras > 1 ? `${s.code} x${s.extras}` : s.code,
  );
}
