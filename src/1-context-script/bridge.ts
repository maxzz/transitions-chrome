import type { BackgroundToPageMessage, PageToBackgroundMessage } from "@/9-shared/messages";
import { isExtensionMessage } from "@/9-shared/messages";
import { getPageClientFile } from "./page-client-file";

window.__MOTION_BRIDGE_HAS_LOADED = true;

function injectPageClient() {
    const url = chrome.runtime.getURL(getPageClientFile());

    try {
        const request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send();
        if (request.status === 200 && request.responseText) {
            const script = document.createElement("script");
            script.textContent = request.responseText;
            (document.head ?? document.documentElement).appendChild(script);
            script.remove();
            return;
        }
    } catch {
        // Page CSP can block inline scripts; fall back to a file URL.
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = false;
    (document.head ?? document.documentElement).appendChild(script);
    script.addEventListener("load", () => script.remove());
}

injectPageClient();

let backgroundPort: chrome.runtime.Port | undefined;

function bindPortListeners(port: chrome.runtime.Port) {
    backgroundPort = port;

    port.onMessage.addListener((backgroundMessage: BackgroundToPageMessage) => {
        switch (backgroundMessage.type) {
            case "tabId": {
                return;
            }
            case "isrecording":
            case "inspectanimation":
            case "scrubanimation": {
                window.postMessage(backgroundMessage, "*");
            }
        }
    });

    port.onDisconnect.addListener(() => {
        backgroundPort = undefined;
    });
}

function connect() {
    bindPortListeners(chrome.runtime.connect({ name: "client" }));
}

connect();
chrome.runtime.onConnect.addListener(bindPortListeners);

const handleMessagesFromWebPage = (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!isExtensionMessage(event.data)) return;

    if (!backgroundPort) {
        connect();
    }

    switch (event.data.type) {
        case "animationstart":
        case "clientready": {
            backgroundPort?.postMessage(event.data as PageToBackgroundMessage);
        }
    }
};

window.addEventListener("message", handleMessagesFromWebPage, false);
window.postMessage({ type: "requestclientready" }, "*");
