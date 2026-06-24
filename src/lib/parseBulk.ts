import { normalizeCode, parseStickerCode } from "./stickerLookup";

/** Parse a pasted block into unique valid sticker codes. */
export function parseBulkCodes(text: string): string[] {
  const found = new Set<string>();
  const parts = text.split(/[\s,;|\n]+/).filter(Boolean);

  for (const part of parts) {
    const cleaned = part.replace(/[^A-Za-z0-9]/g, "");
    const code = parseStickerCode(cleaned);
    if (code) found.add(code);

    // "ARG 17" style when split oddly — try team + number
    const spaced = part.trim().match(/^([A-Z]{3})\s*(\d{1,2})$/i);
    if (spaced) {
      const c = parseStickerCode(`${spaced[1]}${spaced[2]}`);
      if (c) found.add(c);
    }
  }

  return [...found];
}

/**
 * Parse duplicate lines. Each entry is extras beyond the one in the album.
 * Examples: ARG17, ARG17 x2, ARG17:3, ARG17 (2)
 */
export function parseDuplicateInput(text: string): Map<string, number> {
  const extras = new Map<string, number>();
  const lines = text.split(/[\n,;]+/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const withCount = line.match(/^([A-Za-z0-9]+)\s*(?:[x×:*(]\s*(\d+)\)?)?$/i);
    const token = withCount?.[1] ?? line.split(/\s+/)[0];
    const code = parseStickerCode(token ?? line);
    if (!code) continue;

    const count = withCount?.[2] ? Math.max(1, parseInt(withCount[2], 10)) : 1;
    extras.set(code, (extras.get(code) ?? 0) + count);
  }

  return extras;
}

export function formatCodesForExport(codes: string[]): string {
  return codes.map((c) => c.replace(/([A-Z]{3})(\d+)/, "$1 $2")).join(", ");
}

export { normalizeCode };
