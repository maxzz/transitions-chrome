import { getPageClientFile } from "../../1-context-script/page-client-filenames";
import { isExtensionContextValid, showInvalidCtx } from "../../1-context-script/runtime/port-disconnected-report";

/**
 * Run the page-world IIFE in the inspected tab via the DevTools protocol.
 * This bypasses page CSP, which blocks inline <script> injection.
 */
export function injectClientIntoInspectedPage() {
    if (!isExtensionContextValid()) {
        return;
    }

    const inspectedWindow = chrome?.devtools?.inspectedWindow;
    if (!inspectedWindow?.eval || !chrome?.runtime?.getURL) {
        return;
    }

    let url: string;
    try {
        url = chrome.runtime.getURL(getPageClientFile());
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
            inspectedWindow.eval(`${code}\n//# sourceURL=transitions-chrome-client.js`, () => {});
        })
        .catch(() => {
            if (!isExtensionContextValid()) {
                return;
            }
            inspectedWindow.eval(
                `(function(){if(window.__MOTION_DEV_TOOLS)return;var s=document.createElement("script");s.src=${JSON.stringify(url)};(document.head||document.documentElement).appendChild(s);})()`,
                () => {},
            );
        });
}

/** Paint the page-reload chip on the inspected tab, not in this DevTools panel. */
export function showInvalidCtxOnInspectedPage() {
    const inspectedWindow = chrome?.devtools?.inspectedWindow;
    if (!inspectedWindow?.eval) {
        return;
    }
    try {
        inspectedWindow.eval(`void (${showInvalidCtx.toString()})("reload-page")`, () => {});
    } catch {
        // Panel or tab is already gone.
    }
}
