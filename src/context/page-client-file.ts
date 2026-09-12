import clientScript from "./client?script&iife";

/** Extension-relative path to the bundled page-world IIFE. */
export function getPageClientFile() {
    return String(clientScript).replace(/^\//, "");
}
