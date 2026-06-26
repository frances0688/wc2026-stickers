import { useMemo, useState } from "react";
import type { StickerWithState } from "../types";
import { exportGroupLabel, formatCountryHeading, formatDuplicatesExport, sortByAlbumGroupOrder } from "../lib/worldCupGroups";
import { StickerCard } from "./StickerCard";
import { ExchangeModal } from "./ExchangeModal";

interface DuplicatesProps {
  stickers: StickerWithState[];
  photoCodes: Set<string>;
  missingStickers: StickerWithState[];
  onUpdated: () => void;
}

export function Duplicates({ stickers, photoCodes, missingStickers, onUpdated }: DuplicatesProps) {
  const [query, setQuery] = useState("");
  const [exchangeFrom, setExchangeFrom] = useState<StickerWithState | null>(null);
  const [copied, setCopied] = useState(false);

  const allDupes = useMemo(() => stickers.filter((s) => s.extras > 0), [stickers]);

  const dupes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allDupes.filter((s) => {
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        exportGroupLabel(s).toLowerCase().includes(q)
      );
    });
    return sortByAlbumGroupOrder(filtered);
  }, [allDupes, query]);

  const exportText = useMemo(() => formatDuplicatesExport(dupes), [dupes]);

  const copyList = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (allDupes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <p className="text-4xl">⊕</p>
        <p className="mt-2">No duplicates yet</p>
        <p className="text-sm">Scan or add stickers you have extra copies of</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search duplicates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white"
        />
        <button
          type="button"
          onClick={copyList}
          disabled={dupes.length === 0}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy list"}
        </button>
      </div>
      <p className="text-sm text-slate-400">
        {dupes.length} shown · {allDupes.reduce((sum, s) => sum + s.extras, 0)} extras total
      </p>

      {dupes.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No duplicates match your search.</p>
      ) : (
        dupes.map((s) => (
          <div key={s.code} className="flex items-center gap-3 rounded-xl bg-slate-800/80 p-2">
            <StickerCard sticker={s} hasUserPhoto={photoCodes.has(s.code)} compact />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white">{s.code}</p>
              <p className="truncate text-sm text-slate-300">{s.name}</p>
              <p className="text-xs text-slate-500">{formatCountryHeading(s)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-sm font-bold text-slate-900">
                +{s.extras}
              </span>
              <button
                type="button"
                onClick={() => setExchangeFrom(s)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Exchange
              </button>
            </div>
          </div>
        ))
      )}

      {exchangeFrom && (
        <ExchangeModal
          gave={exchangeFrom}
          missingStickers={missingStickers}
          photoCodes={photoCodes}
          onClose={() => setExchangeFrom(null)}
          onComplete={async () => {
            await onUpdated();
            setExchangeFrom(null);
          }}
        />
      )}
    </div>
  );
}
