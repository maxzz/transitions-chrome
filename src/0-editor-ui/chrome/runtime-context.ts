/** False after Reload unpacked / HMR kills this DevTools page's extension context. */
export function isExtensionContextValid() {
    try {
        return Boolean(chrome.runtime?.id);
    } catch {
        return false;
    }
}

export function getInspectedTabId() {
    if (!isExtensionContextValid()) {
        return undefined;
    }
    try {
        const tabId = chrome.devtools?.inspectedWindow?.tabId;
        return typeof tabId === "number" ? tabId : undefined;
    } catch {
        return undefined;
    }
}

export function postToBackground(port: chrome.runtime.Port | undefined, message: unknown) {
    if (!port || !isExtensionContextValid()) {
        return false;
    }
    try {
        port.postMessage(message);
        return true;
    } catch {
        return false;
    }
}
