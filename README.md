# WC 2026 Sticker Exchange Tracker

Mobile-first PWA to track your **Panini FIFA World Cup 2026** sticker album (980 stickers).

## Features

- **Gallery** — browse all stickers with images, search, country filter, owned/missing/duplicate states
- **Setup** — enter missing + duplicates; everything else is marked owned
- **Backup** — download/restore JSON so you never lose your collection
- **Scan** — photograph sticker code on the back (OCR) + optional front photo
- **Duplicates** — list extras and log exchanges against your missing stickers
- **Missing** — see what you still need; copy list for trade threads
- **Offline** — install as PWA; data in IndexedDB; sticker images cached on view

## Local development

```bash
npm install
npm run seed      # regenerate stickers.json from checklist source
npm run images    # generate bundled WebP placeholder images
npm run dev       # http://localhost:5174
```

## Deploy to Cloudflare Pages (recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "WC 2026 sticker tracker"
# Create a new public repo on GitHub named wc2026-stickers, then:
git remote add origin https://github.com/YOURUSER/wc2026-stickers.git
git branch -M main
git push -u origin main
```

### 2. Connect Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your `wc2026-stickers` repository
3. Build settings:

| Setting | Value |
|---------|--------|
| Production branch | `trunk` |
| Framework preset | Vite |
| Build command | `npm run build` |
| **Deploy command** | `npm run deploy:pages` |
| **Non-production branch deploy command** | `npm run deploy:pages:preview` |
| Node.js version | `22` |

> **Do not** use bare `npx wrangler deploy` without `[assets]` in `wrangler.toml`. Use `npm run deploy:pages`, which runs `wrangler deploy` with the static `dist` folder configured.

4. Click **Save and Deploy**

Your app will be live at your Cloudflare project URL.

### Troubleshooting: Missing entry-point / `npx wrangler deploy` failed

Your deploy command must be **`npm run deploy:pages`**, not `npx wrangler deploy` alone. The repo configures `wrangler.toml` to serve `./dist` as static assets.

### Troubleshooting: Authentication error [code: 10000] on deploy

If deploy still fails on auth, remove any custom `CLOUDFLARE_API_TOKEN` from project **Settings → Environment variables** and retry, or add **Account → Cloudflare Workers Scripts → Edit** permission to your API token.

### 3. Install on your phone

1. Open the `.pages.dev` URL in Safari (iPhone) or Chrome (Android)
2. **Add to Home Screen**
3. Use **Setup → Download backup** after changes to save your data to cloud storage

### Optional: deploy from CLI

```bash
npm run build
npm run deploy:pages
```

## Data & privacy

- Collection data stays **on your device** (IndexedDB) — Cloudflare only hosts the app files
- Use **Setup → Download backup** to save a JSON file to iCloud Drive / Google Drive
- Hosting does not sync your sticker inventory

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5174) |
| `npm run build` | Production build + PWA |
| `npm run preview` | Preview production build locally |
| `npm run seed` | Parse checklist → `src/data/stickers.json` |
| `npm run images` | Generate `public/stickers/*.webp` |
