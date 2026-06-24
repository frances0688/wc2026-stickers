export type StickerCategory =
  | "player"
  | "team_logo"
  | "team_photo"
  | "fwc"
  | "museum"
  | "host"
  | "brand";

export interface Sticker {
  code: string;
  teamCode: string;
  slot: number | null;
  name: string;
  country: string;
  category: StickerCategory;
  rarity: "foil" | "base";
  albumOrder: number;
  imagePath: string;
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
