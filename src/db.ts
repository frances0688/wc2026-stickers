import Dexie, { type Table } from "dexie";
import type { CollectionEntry, Exchange, UserPhoto } from "./types";

export class StickerDB extends Dexie {
  collection!: Table<CollectionEntry, string>;
  exchanges!: Table<Exchange, string>;
  userPhotos!: Table<UserPhoto, string>;

  constructor() {
    super("wc2026-stickers");
    this.version(1).stores({
      collection: "code",
      exchanges: "id, createdAt",
      userPhotos: "code",
    });
  }
}

export const db = new StickerDB();

const DEFAULT_OWNED = 1;

export async function getOwned(code: string): Promise<number> {
  const entry = await db.collection.get(code);
  if (entry === undefined) return DEFAULT_OWNED;
  return entry.owned;
}

export async function setOwned(code: string, owned: number): Promise<void> {
  const value = Math.max(0, owned);
  if (value === DEFAULT_OWNED) {
    await db.collection.delete(code);
  } else {
    await db.collection.put({ code, owned: value });
  }
}

export async function incrementOwned(code: string, by = 1): Promise<number> {
  const current = await getOwned(code);
  const next = current + by;
  await setOwned(code, next);
  return next;
}

export async function getAllOwned(): Promise<Map<string, number>> {
  const entries = await db.collection.toArray();
  return new Map(entries.map((e) => [e.code, e.owned]));
}

export async function logExchange(gaveCode: string, receivedCode: string): Promise<Exchange> {
  const gave = await getOwned(gaveCode);
  if (gave < 2) throw new Error("Not enough duplicates to exchange");

  const received = await getOwned(receivedCode);
  await setOwned(gaveCode, gave - 1);
  await setOwned(receivedCode, received + 1);

  const record: Exchange = {
    id: crypto.randomUUID(),
    gaveCode,
    receivedCode,
    createdAt: Date.now(),
  };
  await db.exchanges.add(record);
  return record;
}

export async function saveUserPhoto(code: string, blob: Blob): Promise<void> {
  await db.userPhotos.put({ code, blob, capturedAt: Date.now() });
}

export async function deleteUserPhoto(code: string): Promise<void> {
  await db.userPhotos.delete(code);
}

export async function getUserPhoto(code: string): Promise<Blob | null> {
  const row = await db.userPhotos.get(code);
  return row?.blob ?? null;
}

export async function getAllUserPhotoCodes(): Promise<Set<string>> {
  const rows = await db.userPhotos.toArray();
  return new Set(rows.map((r) => r.code));
}

/** Apply missing + duplicate lists; all other stickers become owned (count 1). */
export async function applyCollectionLists(
  missingCodes: string[],
  duplicateExtras: Map<string, number>,
): Promise<void> {
  await db.collection.clear();

  const missingSet = new Set(missingCodes);

  for (const code of missingSet) {
    await db.collection.put({ code, owned: 0 });
  }

  for (const [code, extraCount] of duplicateExtras) {
    if (missingSet.has(code)) continue;
    await db.collection.put({ code, owned: 1 + extraCount });
  }
}
