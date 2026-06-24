import { useMemo, useState } from "react";
import type { StickerWithState } from "../types";
import { getCountries } from "../lib/stickerLookup";
import { StickerCard } from "./StickerCard";
import { StickerDetail } from "./StickerDetail";

interface GalleryProps {
  stickers: StickerWithState[];
  photoCodes: Set<string>;
  onUpdated: () => void;
}

export function Gallery({ stickers, photoCodes, onUpdated }: GalleryProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState<"all" | "owned" | "missing" | "duplicates">("all");
  const [selected, setSelected] = useState<StickerWithState | null>(null);

  const countries = useMemo(() => getCountries(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stickers.filter((s) => {
      if (country !== "all" && s.country !== country) return false;
      if (status === "owned" && s.owned === 0) return false;
      if (status === "missing" && s.owned > 0) return false;
      if (status === "duplicates" && s.extras === 0) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
      );
    });
  }, [stickers, query, country, status]);

  const selectedLive = selected
    ? stickers.find((s) => s.code === selected.code) ?? selected
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <input
          type="search"
          placeholder="Search code, player, country…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500"
        />
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {(["all", "owned", "missing", "duplicates"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                status === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">{filtered.length} stickers</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {filtered.map((s) => (
          <StickerCard
            key={s.code}
            sticker={s}
            hasUserPhoto={photoCodes.has(s.code)}
            onClick={() => setSelected(s)}
          />
        ))}
      </div>

      {selectedLive && (
        <StickerDetail
          sticker={selectedLive}
          owned={selectedLive.owned}
          hasUserPhoto={photoCodes.has(selectedLive.code)}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
