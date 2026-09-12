import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.config.ts";

const rootDir = import.meta.dirname;

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(rootDir, "src"),
        },
    },
    plugins: [tailwindcss(), react(), crx({ manifest })],
    server: {
        cors: {
            origin: [/chrome-extension:\/\//],
        },
        strictPort: true,
        port: 5173,
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                editor: path.resolve(rootDir, "src/editor/index.html"),
            },
        },
    },
});
