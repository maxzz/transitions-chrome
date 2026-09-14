import clientScript from "./0-all/0-client-entry?script&iife";
import bridgeScript from "./bridge?script&iife";
import { PAGE_BRIDGE_FILE, PAGE_CLIENT_FILE } from "./page-iife-files";

export const crxClientIife = clientScript;
export const crxBridgeIife = bridgeScript;

/** Extension-relative path to the MAIN-world page client IIFE. */
export function getPageClientFile() {
    return PAGE_CLIENT_FILE;
}

/** Extension-relative path to the isolated-world bridge IIFE compiled from bridge.ts. */
export function getPageBridgeFile() {
    return PAGE_BRIDGE_FILE;
}
