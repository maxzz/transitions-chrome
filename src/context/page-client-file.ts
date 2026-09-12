import clientScript from "./client?script&iife";

function toExtensionFile(id: string) {
    return String(id).replace(/^\//, "");
}

/** Extension-relative path to the bundled page-world IIFE. */
export function getPageClientFile() {
    return toExtensionFile(clientScript);
}

/** Static isolated-world bridge copied from /public. */
export function getPageBridgeFile() {
    return "page-bridge.js";
}
