import clientScript from "./client?script&iife";
import bridgeScript from "./page-bridge.js?script&iife";

function toExtensionFile(id: string) {
    return String(id).replace(/^\//, "");
}

/** Extension-relative path to the bundled page-world IIFE. */
export function getPageClientFile() {
    return toExtensionFile(clientScript);
}

/** Extension-relative path to the isolated-world bridge IIFE. */
export function getPageBridgeFile() {
    return toExtensionFile(bridgeScript);
}
