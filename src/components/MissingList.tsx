import { useMemo, useState } from "react";
import type { StickerWithState } from "../types";
import { compareByAlbumGroupOrder, formatAlbumOrderExport, formatCountryHeading } from "../lib/worldCupGroups";
import { StickerCard } from "./StickerCard";

interface MissingListProps {
  stickers: StickerWithState[];
  photoCodes: Set<string>;
}

export function MissingList({ stickers, photoCodes }: MissingListProps) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const missing = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stickers
      .filter((s) => s.owned === 0)
      .filter((s) => {
        if (!q) return true;
        return (
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q)
        );
      });
  }, [stickers, query]);

  const byCountry = useMemo(() => {
    const map = new Map<string, StickerWithState[]>();
    for (const s of missing) {
      const list = map.get(s.country) ?? [];
      list.push(s);
      map.set(s.country, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.albumOrder - b.albumOrder);
    }
    return [...map.entries()].sort(([, listA], [, listB]) =>
      compareByAlbumGroupOrder(listA[0], listB[0]),
    );
  }, [missing]);

  const exportText = useMemo(() => formatAlbumOrderExport(missing), [missing]);

  const copyList = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search missing…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white"
        />
        <button
          type="button"
          onClick={copyList}
          disabled={missing.length === 0}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy list"}
        </button>
      </div>
      <p className="text-sm text-slate-400">
        {missing.length} missing · all other stickers are marked owned
      </p>

      {missing.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-4xl">🎉</p>
          <p className="mt-2">Album complete!</p>
        </div>
      ) : (
        byCountry.map(([country, list]) => (
          <section key={country}>
            <h3 className="mb-2 text-sm font-semibold text-slate-300">
              {formatCountryHeading(list[0])} ({list.length})
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {list.map((s) => (
                <div key={s.code} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-2 ring-1 ring-red-500/30">
                  <StickerCard sticker={s} hasUserPhoto={photoCodes.has(s.code)} compact />
                  <div className="min-w-0">
                    <p className="font-bold text-white">{s.code}</p>
                    <p className="truncate text-sm text-slate-300">{s.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
