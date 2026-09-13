import clientScript from "./0-all/0-client-entry?script&iife";

/** Extension-relative path to the bundled page-world IIFE. */
export function getPageClientFile() {
    return toExtensionFile(clientScript);
}

function toExtensionFile(id: string) {
    return String(id).replace(/^\//, "");
}

/** Static isolated-world bridge copied from /public. */
export function getPageBridgeFile() {
    return "page-bridge.js";
}
