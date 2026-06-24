import { getUserPhoto } from "../db";

const photoUrlCache = new Map<string, string>();

export function getBundledImageUrl(imagePath: string): string {
  return imagePath;
}

export async function resolveUserPhotoUrl(code: string): Promise<string | null> {
  const blob = await getUserPhoto(code);
  if (!blob) return null;
  if (photoUrlCache.has(code)) return photoUrlCache.get(code)!;
  const url = URL.createObjectURL(blob);
  photoUrlCache.set(code, url);
  return url;
}

export function revokeUserPhotoUrl(code: string): void {
  const url = photoUrlCache.get(code);
  if (url) {
    URL.revokeObjectURL(url);
    photoUrlCache.delete(code);
  }
}
