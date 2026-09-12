import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
    manifest_version: 3,
    name: "transitions-chrome",
    version: "2.0.0",
    description: "Inspect, edit and export animations made with CSS and Motion One.",
    permissions: ["storage", "webNavigation", "scripting"],
    host_permissions: ["file:///*", "http://*/*", "https://*/*"],
    background: {
        service_worker: "src/2-service-worker/index.ts",
        type: "module",
    },
    devtools_page: "src/8-2-entry-devtools/index.html",
    externally_connectable: {
        matches: ["https://*.motion.dev/*", "*://localhost/*"],
    },
    icons: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png",
    },
    web_accessible_resources: [
        {
            matches: ["https://*/*", "http://*/*", "file:///*"],
            resources: ["src/8-1-entry-editor/index.html"],
        },
    ],
});
