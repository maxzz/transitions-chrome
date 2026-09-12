import clientScript from "../../context/client?script&iife";

function pageClientFile() {
    return String(clientScript).replace(/^\//, "");
}

/**
 * Run the page-world IIFE in the inspected tab via the DevTools protocol.
 * This bypasses page CSP, which blocks inline <script> injection.
 */
export function injectClientIntoInspectedPage() {
    const inspectedWindow = chrome?.devtools?.inspectedWindow;
    if (!inspectedWindow?.eval || !chrome?.runtime?.getURL) return;

    const url = chrome.runtime.getURL(pageClientFile());
    fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(String(response.status));
            return response.text();
        })
        .then((code) => {
            inspectedWindow.eval(`${code}\n//# sourceURL=transitions-chrome-client.js`);
        })
        .catch(() => {
            inspectedWindow.eval(
                `(function(){if(window.__MOTION_DEV_TOOLS)return;var s=document.createElement("script");s.src=${JSON.stringify(url)};(document.head||document.documentElement).appendChild(s);})()`,
            );
        });
}
