import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import type { CrxPlugin } from "@crxjs/vite-plugin";

const PAGE_BRIDGE = "page-bridge.js";
const PAGE_CLIENT = "page-client.js";
const BANNER = "/* generated from TypeScript - do not edit */\n";

const BRIDGE_SOURCES = [
    "src/1-context-script/bridge.ts.iife.js",
    "src/1-context-script/bridge.js",
];
const CLIENT_SOURCES = [
    "src/1-context-script/0-all/0-client-entry.ts.iife.js",
    "src/1-context-script/0-all/0-client-entry.js",
];

async function copyNamed(outDir: string, sources: string[], destName: string) {
    for (const rel of sources) {
        const src = path.join(outDir, rel);
        const dest = path.join(outDir, destName);
        try {
            const srcStat = await fsPromises.stat(src);
            try {
                const destStat = await fsPromises.stat(dest);
                if (destStat.mtimeMs >= srcStat.mtimeMs) {
                    return;
                }
            } catch {
                // Destination does not exist yet.
            }
            const code = await fsPromises.readFile(src, "utf8");
            await fsPromises.writeFile(dest, BANNER + code);
            return;
        } catch {
            // CRXJS uses a different filename in dev vs production.
        }
    }
}

export function emitStablePageScripts(): CrxPlugin {
    let outDir = "";

    const copyAll = () => Promise.all([
        copyNamed(outDir, BRIDGE_SOURCES, PAGE_BRIDGE),
        copyNamed(outDir, CLIENT_SOURCES, PAGE_CLIENT),
    ]);

    return {
        name: "emit-stable-page-scripts",
        enforce: "post",
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir);
        },
        async writeBundle() {
            await copyAll();
        },
        configureServer(server) {
            const copy = () => {
                copyAll().catch(() => undefined);
            };
            const watchers: fs.FSWatcher[] = [];
            for (const relDir of ["src/1-context-script", "src/1-context-script/0-all"]) {
                const dir = path.join(outDir, relDir);
                fs.mkdirSync(dir, { recursive: true });
                watchers.push(fs.watch(dir, copy));
            }
            const retry = setInterval(copy, 1000);
            server.httpServer?.once("close", () => {
                clearInterval(retry);
                for (const watcher of watchers) {
                    watcher.close();
                }
            });
            copy();
        },
        renderCrxManifest(manifest) {
            manifest.web_accessible_resources ??= [];
            manifest.web_accessible_resources.push({
                matches: ["http://*/*", "https://*/*", "file:///*"],
                resources: [PAGE_BRIDGE, PAGE_CLIENT],
            });
            return manifest;
        },
    };
}
