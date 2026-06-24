import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { colorsFor } from "./team-colors.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public/stickers");
const force = process.argv.includes("--force");
const { stickers } = JSON.parse(readFileSync(join(root, "src/data/stickers.json"), "utf-8"));

mkdirSync(outDir, { recursive: true });

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svgFor(sticker) {
  const [c1, c2] = colorsFor(sticker.teamCode);
  const name = escapeXml(sticker.name.length > 22 ? sticker.name.slice(0, 20) + "…" : sticker.name);
  const country = escapeXml(sticker.country);
  const code = escapeXml(sticker.code);
  const foil = sticker.rarity === "foil";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <rect x="12" y="12" width="276" height="426" rx="8" fill="none" stroke="${foil ? "#FFD700" : "rgba(255,255,255,0.4)"}" stroke-width="${foil ? 4 : 2}"/>
  <text x="150" y="200" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${code}</text>
  <text x="150" y="250" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="system-ui,sans-serif" font-size="18" font-weight="600">${name}</text>
  <text x="150" y="285" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="system-ui,sans-serif" font-size="14">${country}</text>
  <text x="150" y="400" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="system-ui,sans-serif" font-size="11">FIFA WC 2026</text>
</svg>`;
}

let created = 0;
let skipped = 0;
for (const sticker of stickers) {
  const outPath = join(outDir, `${sticker.code}.webp`);
  if (!force && existsSync(outPath)) {
    skipped++;
    continue;
  }
  const svg = svgFor(sticker);
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(outPath);
  created++;
  if (created % 100 === 0) console.log(`Generated ${created}/${stickers.length}...`);
}

console.log(`Done: ${created} generated, ${skipped} skipped → ${outDir}`);
