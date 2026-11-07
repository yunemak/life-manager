import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icons/icon.svg"],
            manifest: {
                name: "Life Manager",
                short_name: "Life Manager",
                description: "Kişisel yaşam yönetimi",
                lang: "tr",
                theme_color: "#438a67",
                background_color: "#f7f9f7",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/icons/icon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,woff2}"],
                navigateFallback: "index.html",
            },
            devOptions: { enabled: true, type: "module" },
        }),
    ],
});
