import clientScript from "../../1-context-script/0-all/0-client-entry?script&iife";
import { isExtensionContextValid } from "./runtime-context";

/**
 * Run the page-world IIFE in the inspected tab via the DevTools protocol.
 * This bypasses page CSP, which blocks inline <script> injection.
 */
export function injectClientIntoInspectedPage() {
    const inspectedWindow = chrome?.devtools?.inspectedWindow;
    if (!inspectedWindow?.eval || !isExtensionContextValid() || typeof chrome.runtime?.getURL !== "function") {
        return;
    }

    let url: string;
    try {
        url = chrome.runtime.getURL(pageClientFile());
    } catch {
        return;
    }

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(String(response.status));
            }
            return response.text();
        })
        .then((code) => {
            if (!isExtensionContextValid()) {
                return;
            }
            inspectedWindow.eval(`${code}\n//# sourceURL=transitions-chrome-client.js`);
        })
        .catch(() => {
            if (!isExtensionContextValid()) {
                return;
            }
            try {
                inspectedWindow.eval(
                    `(function(){if(window.__MOTION_DEV_TOOLS)return;var s=document.createElement("script");s.src=${JSON.stringify(url)};(document.head||document.documentElement).appendChild(s);})()`,
                );
            } catch {
                // Inspected tab or extension context is gone.
            }
        });
}

function pageClientFile() {
    return String(clientScript).replace(/^\//, ""); // Remove leading slash from the script path
}
