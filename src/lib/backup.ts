import { applyCollectionLists, db } from "../db";
import type { Exchange } from "../types";

export const BACKUP_VERSION = 1;

export interface CollectionBackup {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  missing: string[];
  duplicates: Record<string, number>;
  exchanges: Exchange[];
}

export async function buildBackup(): Promise<CollectionBackup> {
  const entries = await db.collection.toArray();
  const missing: string[] = [];
  const duplicates: Record<string, number> = {};

  for (const { code, owned } of entries) {
    if (owned === 0) missing.push(code);
    else if (owned > 1) duplicates[code] = owned - 1;
  }

  const exchanges = await db.exchanges.orderBy("createdAt").toArray();

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    missing: missing.sort(),
    duplicates,
    exchanges,
  };
}

export function parseBackupJson(raw: string): CollectionBackup {
  const data = JSON.parse(raw) as CollectionBackup;
  if (data.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${data.version}`);
  }
  if (!Array.isArray(data.missing) || typeof data.duplicates !== "object") {
    throw new Error("Invalid backup file format");
  }
  return data;
}

export async function restoreBackup(backup: CollectionBackup): Promise<void> {
  const duplicateMap = new Map<string, number>(
    Object.entries(backup.duplicates).map(([code, extras]) => [code, Math.max(1, extras)]),
  );
  await applyCollectionLists(backup.missing, duplicateMap);

  await db.exchanges.clear();
  if (backup.exchanges.length > 0) {
    await db.exchanges.bulkPut(backup.exchanges);
  }
}

export function downloadBackup(backup: CollectionBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = backup.exportedAt.slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wc2026-stickers-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<CollectionBackup> {
  const text = await file.text();
  return parseBackupJson(text);
}
