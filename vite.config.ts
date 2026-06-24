import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "WC 2026 Stickers",
        short_name: "WC26",
        description: "Track Panini FIFA World Cup 2026 sticker duplicates and exchanges",
        theme_color: "#1B3FA0",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["index.html", "assets/**/*", "pwa-*.png", "favicon.svg", "registerSW.js"],
        runtimeCaching: [
          {
            urlPattern: /^\/stickers\/.+\.webp$/,
            handler: "CacheFirst",
            options: {
              cacheName: "sticker-images",
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
