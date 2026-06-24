import type { StickerWithState } from "../types";
import { StickerImage } from "./StickerImage";

interface StickerCardProps {
  sticker: StickerWithState;
  hasUserPhoto?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function StickerCard({ sticker, hasUserPhoto, onClick, compact }: StickerCardProps) {
  const missing = sticker.owned === 0;
  const hasDupes = sticker.extras > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl text-left shadow-md transition-transform active:scale-[0.98] ${
        missing ? "ring-2 ring-red-500/70" : hasDupes ? "ring-2 ring-amber-400" : sticker.owned > 0 ? "ring-2 ring-emerald-500/50" : ""
      }`}
    >
      <StickerImage
        sticker={sticker}
        hasUserPhoto={hasUserPhoto}
        dimmed={missing}
        className={compact ? "aspect-[2/3] w-16 shrink-0" : "aspect-[2/3] w-full"}
      />
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
          <p className="truncate text-xs font-bold text-white">{sticker.code}</p>
          <p className="truncate text-[10px] text-white/80">{sticker.name}</p>
        </div>
      )}
      {sticker.owned > 0 && !missing && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
          ✓
        </span>
      )}
      {hasDupes && (
        <span className="absolute left-1 top-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow">
          +{sticker.extras}
        </span>
      )}
    </button>
  );
}
