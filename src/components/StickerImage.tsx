import { useEffect, useState } from "react";
import type { Sticker } from "../types";
import { getBundledImageUrl, resolveUserPhotoUrl } from "../lib/stickerImage";

interface StickerImageProps {
  sticker: Sticker;
  hasUserPhoto?: boolean;
  className?: string;
  dimmed?: boolean;
  alt?: string;
}

export function StickerImage({
  sticker,
  hasUserPhoto = false,
  className = "",
  dimmed = false,
  alt,
}: StickerImageProps) {
  const [src, setSrc] = useState(getBundledImageUrl(sticker.imagePath));
  const [loading, setLoading] = useState(hasUserPhoto);

  useEffect(() => {
    let cancelled = false;
    if (hasUserPhoto) {
      setLoading(true);
      resolveUserPhotoUrl(sticker.code).then((url) => {
        if (!cancelled) {
          setSrc(url ?? getBundledImageUrl(sticker.imagePath));
          setLoading(false);
        }
      });
    } else {
      setSrc(getBundledImageUrl(sticker.imagePath));
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [sticker.code, sticker.imagePath, hasUserPhoto]);

  return (
    <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
      {loading && <div className="absolute inset-0 animate-pulse bg-slate-700" />}
      <img
        src={src}
        alt={alt ?? `${sticker.name} (${sticker.code})`}
        loading="lazy"
        className={`h-full w-full object-cover transition-opacity ${dimmed ? "opacity-40" : "opacity-100"}`}
        onError={() => setSrc(getBundledImageUrl(sticker.imagePath))}
      />
    </div>
  );
}
