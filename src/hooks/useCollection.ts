import { useCallback, useEffect, useMemo, useState } from "react";
import { db, getAllOwned } from "../db";
import { getAllStickers } from "../lib/stickerLookup";
import type { Exchange, StickerWithState } from "../types";

export function useCollection() {
  const [ownedMap, setOwnedMap] = useState<Map<string, number>>(new Map());
  const [photoCodes, setPhotoCodes] = useState<Set<string>>(new Set());
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [owned, photos, ex] = await Promise.all([
      getAllOwned(),
      db.userPhotos.toArray(),
      db.exchanges.orderBy("createdAt").reverse().toArray(),
    ]);
    setOwnedMap(owned);
    setPhotoCodes(new Set(photos.map((p) => p.code)));
    setExchanges(ex);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stickersWithState = useMemo((): StickerWithState[] => {
    return getAllStickers().map((s) => {
      const owned = ownedMap.has(s.code) ? ownedMap.get(s.code)! : 1;
      return { ...s, owned, extras: Math.max(0, owned - 1) };
    });
  }, [ownedMap]);

  const stats = useMemo(() => {
    const total = stickersWithState.length;
    const ownedCount = stickersWithState.filter((s) => s.owned > 0).length;
    const duplicateCount = stickersWithState.reduce((sum, s) => sum + s.extras, 0);
    const missingCount = total - ownedCount;
    return { total, ownedCount, duplicateCount, missingCount };
  }, [stickersWithState]);

  return {
    ready,
    ownedMap,
    photoCodes,
    exchanges,
    stickersWithState,
    stats,
    refresh,
  };
}
