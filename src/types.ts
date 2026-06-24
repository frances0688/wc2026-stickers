export type StickerCategory =
  | "player"
  | "team_logo"
  | "team_photo"
  | "fwc"
  | "museum"
  | "host"
  | "brand"
  | "coca_cola";

export type StickerSection = "teams" | "fwc" | "coca_cola";

export interface Sticker {
  code: string;
  teamCode: string;
  slot: number | null;
  name: string;
  country: string;
  group: string | null;
  category: StickerCategory;
  section: StickerSection;
  rarity: "foil" | "base";
  albumOrder: number;
  imagePath: string;
  regionalNote?: string;
}

export interface CollectionEntry {
  code: string;
  owned: number;
}

export interface Exchange {
  id: string;
  gaveCode: string;
  receivedCode: string;
  createdAt: number;
}

export interface UserPhoto {
  code: string;
  blob: Blob;
  capturedAt: number;
}

export type TabId = "gallery" | "setup" | "scan" | "duplicates" | "missing";

export interface StickerWithState extends Sticker {
  owned: number;
  extras: number;
}
