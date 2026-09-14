import type { BackgroundToPageMessage, PageToBackgroundMessage } from "@/9-shared/messages";
import { isExtensionMessage } from "@/9-shared/messages";
import { PAGE_CLIENT_FILE } from "./page-iife-files";

//---------------------------------------------------------------------------
// Isolated-world content script (compiled to an IIFE).
// 1. Inject the MAIN-world page client
// 2. Connect to the service worker
// 3. Relay window.postMessage ↔ chrome.runtime.Port("client")

if (!window.__MOTION_BRIDGE_HAS_LOADED) {
    window.__MOTION_BRIDGE_HAS_LOADED = true;
    boot();
}

function boot() {
    injectPageClient();

    let backgroundPort: chrome.runtime.Port | undefined;

    connect();
    chrome.runtime.onConnect.addListener(bindPortListeners);

    window.addEventListener("message", handleMessagesFromWebPage, false);
    window.postMessage({ type: "requestclientready" }, "*");

    function handleMessagesFromWebPage(event: MessageEvent) {
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
    }

    function connect() {
        bindPortListeners(chrome.runtime.connect({ name: "client" }));
    }

    function bindPortListeners(port: chrome.runtime.Port) {
        backgroundPort = port;

        port.onMessage.addListener((backgroundMessage: BackgroundToPageMessage) => {
            switch (backgroundMessage.type) {
                case "tabId": return;
                case "isrecording":
                case "inspectanimation":
                case "scrubanimation": window.postMessage(backgroundMessage, "*");
            }
        });

        port.onDisconnect.addListener(() => {
            backgroundPort = undefined;
            console.log("%c backgroundPort disconnected", "color: red; font-weight: bold;");
        });
    }
}

function injectPageClient() {
    const url = chrome.runtime.getURL(PAGE_CLIENT_FILE);
    const script = document.createElement("script");
    script.src = url;
    script.async = false;
    (document.head ?? document.documentElement).appendChild(script);
    script.addEventListener("load", () => script.remove());
}
