import { useMemo, useState } from "react";
import type { StickerWithState } from "../types";
import { logExchange } from "../db";
import { StickerImage } from "./StickerImage";

interface ExchangeModalProps {
  gave: StickerWithState;
  missingStickers: StickerWithState[];
  photoCodes: Set<string>;
  onClose: () => void;
  onComplete: () => void;
}

export function ExchangeModal({ gave, missingStickers, photoCodes, onClose, onComplete }: ExchangeModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StickerWithState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return missingStickers.filter((s) => {
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
      );
    });
  }, [missingStickers, query]);

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await logExchange(gave.code, selected.code);
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exchange failed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-700 p-4">
          <h2 className="text-lg font-bold text-white">Exchange for…</h2>
          <p className="text-sm text-slate-400">
            Trading away <span className="text-amber-400">{gave.code}</span> ({gave.name})
          </p>
          <input
            type="search"
            placeholder="Search missing stickers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No matching missing stickers</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSelected(s)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl p-2 text-left ${
                  selected?.code === s.code ? "bg-blue-600/30 ring-2 ring-blue-500" : "bg-slate-800/50"
                }`}
              >
                <StickerImage sticker={s} hasUserPhoto={photoCodes.has(s.code)} className="h-16 w-11 shrink-0 rounded-lg" dimmed />
                <div>
                  <p className="font-bold text-white">{s.code}</p>
                  <p className="text-sm text-slate-300">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.country}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {error && <p className="px-4 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 border-t border-slate-700 p-4 pb-safe">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-700 py-3 text-white">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || busy}
            onClick={confirm}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Confirm exchange"}
          </button>
        </div>
      </div>
    </div>
  );
}
