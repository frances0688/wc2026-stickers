import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = readFileSync(join(__dirname, "checklist-source.txt"), "utf-8");
const cocaCola = JSON.parse(readFileSync(join(__dirname, "coca-cola-stickers.json"), "utf-8"));

const CATEGORY_MAP = {
  "Team Badge": "team_logo",
  "Team Photo": "team_photo",
  Player: "player",
  "Brand / Emblem": "brand",
  "Host / Tournament": "host",
  "FIFA Museum": "museum",
};

function parseCode(raw) {
  if (raw === "00") return { code: "00", teamCode: "PANINI", slot: null };
  const fwc = raw.match(/^FWC(\d{1,2})$/);
  if (fwc) return { code: raw, teamCode: "FWC", slot: Number(fwc[1]) };
  const cc = raw.match(/^CC(\d{1,2})$/);
  if (cc) return { code: raw, teamCode: "CC", slot: Number(cc[1]) };
  const team = raw.match(/^([A-Z]{3})(\d{1,2})$/);
  if (team) return { code: raw, teamCode: team[1], slot: Number(team[2]) };
  return { code: raw, teamCode: raw.replace(/\d+$/, ""), slot: null };
}

function inferSection(code, teamCode) {
  if (teamCode === "FWC" || code === "00") return "fwc";
  if (teamCode === "CC") return "coca_cola";
  return "teams";
}

function inferCategory(categoryLabel, title, teamCode) {
  if (teamCode === "CC") return "coca_cola";
  if (CATEGORY_MAP[categoryLabel]) return CATEGORY_MAP[categoryLabel];
  const lower = title.toLowerCase();
  if (lower.includes("team logo") || lower.includes("emblem")) return "team_logo";
  if (lower.includes("team photo")) return "team_photo";
  if (lower.includes("museum")) return "museum";
  if (lower.includes("mascot") || lower.includes("host") || lower.includes("ball") || lower.includes("slogan"))
    return "host";
  if (lower.includes("panini") || lower.includes("official emblem")) return "brand";
  return "player";
}

function extractCountry(title, teamHeader) {
  const dash = title.match(/\s-\s([^·]+)$/);
  if (dash) return dash[1].trim();
  if (teamHeader) return teamHeader.replace(/Group [A-L].*$/, "").trim();
  return "Special";
}

const lineRe =
  /^\d+\.\s+(\S+)\s+(.+?)\s+·\s+([^·]+?)\s+·\s+(Foil|Base)(?:\s+·\s+Player:\s+.+)?$/;

let currentCountry = "Special";
let currentGroup = null;
const stickers = [];
const seen = new Set();

for (const line of source.split("\n")) {
  const header = line.match(/^([A-Za-zÀ-ÿ' .]+)Group ([A-L])/);
  if (header) {
    currentCountry = header[1].trim();
    currentGroup = header[2];
    continue;
  }
  if (line.startsWith("CollectionOther")) {
    currentCountry = "Panini";
    continue;
  }
  if (line.startsWith("FIFA World Cup 2026Other")) {
    currentCountry = "FIFA World Cup 2026";
    continue;
  }

  const m = line.match(lineRe);
  if (!m) continue;

  const [, codeRaw, title, categoryLabel, rarityLabel] = m;
  if (seen.has(codeRaw)) continue;
  seen.add(codeRaw);

  const { code, teamCode, slot } = parseCode(codeRaw);
  const category = inferCategory(categoryLabel.trim(), title, teamCode);
  const country = extractCountry(title, currentCountry);
  const name = title.includes(" - ") ? title.split(" - ")[0].trim() : title.trim();

  stickers.push({
    code,
    teamCode,
    slot,
    name: name === code ? title.split(" - ")[0] : name,
    country,
    group: inferSection(code, teamCode) === "teams" ? currentGroup : null,
    category,
    section: inferSection(code, teamCode),
    rarity: rarityLabel.toLowerCase() === "foil" ? "foil" : "base",
    albumOrder: stickers.length,
    imagePath: `/stickers/${code}.webp`,
  });
}

if (stickers.length < 900) {
  console.error(`Only parsed ${stickers.length} stickers — expected ~980`);
  process.exit(1);
}

for (const entry of cocaCola) {
  if (seen.has(entry.code)) continue;
  seen.add(entry.code);
  const regionalNote = [entry.usVariant, entry.note].filter(Boolean).join(" · ") || undefined;
  stickers.push({
    code: entry.code,
    teamCode: "CC",
    slot: Number(entry.code.replace("CC", "")),
    name: entry.name,
    country: entry.country,
    group: null,
    category: "coca_cola",
    section: "coca_cola",
    rarity: "base",
    albumOrder: stickers.length,
    imagePath: `/stickers/${entry.code}.webp`,
    ...(regionalNote ? { regionalNote } : {}),
  });
}

const outPath = join(root, "src/data/stickers.json");
writeFileSync(outPath, JSON.stringify({ count: stickers.length, stickers }, null, 2));
console.log(`Wrote ${stickers.length} stickers → ${outPath}`);
