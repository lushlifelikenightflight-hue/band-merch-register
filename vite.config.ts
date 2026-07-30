import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "バンド物販レジ",
        short_name: "物販レジ",
        description: "ライブ会場でオフライン利用できる物販会計アプリ",
        theme_color: "#101218",
        background_color: "#101218",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        lang: "ja",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2,mp3}"],
        globIgnores: [
          "icons/icon_merch-app.png",
          "icons/icon.svg",
          "icons/apple-touch-icon.svg",
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
      devOptions: { enabled: true },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
