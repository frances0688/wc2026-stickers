import { useRef, useState, useEffect } from "react";
import type { Sticker } from "../types";
import { setOwned, saveUserPhoto, deleteUserPhoto } from "../db";
import { StickerImage } from "./StickerImage";
import { compressImage } from "../lib/imageCompress";
import { revokeUserPhotoUrl } from "../lib/stickerImage";

interface StickerDetailProps {
  sticker: Sticker;
  owned: number;
  hasUserPhoto: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  player: "Player",
  team_logo: "Team Logo",
  team_photo: "Team Photo",
  fwc: "FWC Special",
  museum: "FIFA Museum",
  host: "Host / Tournament",
  brand: "Brand / Emblem",
};

export function StickerDetail({ sticker, owned, hasUserPhoto, onClose, onUpdated }: StickerDetailProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const [ownedLocal, setOwnedLocal] = useState(owned);

  useEffect(() => {
    setOwnedLocal(owned);
  }, [owned]);

  const adjust = async (delta: number) => {
    setBusy(true);
    const next = Math.max(0, ownedLocal + delta);
    await setOwned(sticker.code, next);
    setOwnedLocal(next);
    await onUpdated();
    setBusy(false);
  };

  const handlePhoto = async (file: File) => {
    setBusy(true);
    const compressed = await compressImage(file);
    await saveUserPhoto(sticker.code, compressed);
    await onUpdated();
    setBusy(false);
  };

  const removePhoto = async () => {
    setBusy(true);
    await deleteUserPhoto(sticker.code);
    revokeUserPhotoUrl(sticker.code);
    await onUpdated();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-slate-900 p-4 pb-safe sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <StickerImage sticker={sticker} hasUserPhoto={hasUserPhoto} className="mx-auto mb-4 aspect-[2/3] w-48 rounded-xl" />
        <h2 className="text-lg font-bold text-white">{sticker.name}</h2>
        <p className="text-sm text-slate-400">
          {sticker.code} · {sticker.country} · {CATEGORY_LABELS[sticker.category] ?? sticker.category}
          {sticker.rarity === "foil" ? " · Foil" : ""}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={busy || ownedLocal === 0}
            onClick={() => adjust(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-2xl text-white disabled:opacity-40"
          >
            −
          </button>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{ownedLocal}</p>
            <p className="text-xs text-slate-400">owned {ownedLocal > 1 ? `(${ownedLocal - 1} extra)` : ""}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => adjust(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white"
          >
            +
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-white"
          >
            {hasUserPhoto ? "Replace my photo" : "Add my photo"}
          </button>
          {hasUserPhoto && (
            <button
              type="button"
              disabled={busy}
              onClick={removePhoto}
              className="rounded-xl bg-red-900/50 px-4 py-3 text-sm text-red-300"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhoto(f);
            e.target.value = "";
          }}
        />

        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-slate-800 py-3 text-white">
          Close
        </button>
      </div>
    </div>
  );
}
