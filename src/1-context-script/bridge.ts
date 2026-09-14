import type { BackgroundToPageMessage, PageToBackgroundMessage } from "@/9-shared/messages";
import { isExtensionMessage } from "@/9-shared/messages";
import { PAGE_CLIENT_FILE } from "./page-iife-files";
import {
    INVALID_CTX_MESSAGE_TYPE,
    isContextInvalidatedError,
    isExtensionContextValid,
    showInvalidCtx,
} from "./runtime/port-disconnected-report";

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

    window.addEventListener("error", handleIsolatedWorldError);
    window.addEventListener("unhandledrejection", handleIsolatedWorldRejection);
    connect();
    try {
        chrome.runtime.onConnect.addListener(bindPortListeners);
    } catch (error) {
        reportPageContextLost(error);
    }

    window.addEventListener("message", handleMessagesFromWebPage, false);
    window.postMessage({ type: "requestclientready" }, "*");

    function handleMessagesFromWebPage(event: MessageEvent) {
        if (event.source !== window) return;
        if (event.data?.type === INVALID_CTX_MESSAGE_TYPE) return;
        if (!isExtensionMessage(event.data)) return;

        if (!backgroundPort) {
            connect();
            if (!backgroundPort) {
                return;
            }
        }

        switch (event.data.type) {
            case "animationstart":
            case "clientready": {
                try {
                    backgroundPort.postMessage(event.data as PageToBackgroundMessage);
                } catch (error) {
                    reportPageContextLost(error);
                }
            }
        }
    }

    function connect() {
        if (!isExtensionContextValid()) {
            reportPageContextLost();
            return;
        }
        try {
            bindPortListeners(chrome.runtime.connect({ name: "client" }));
        } catch (error) {
            reportPageContextLost(error);
        }
    }

    function bindPortListeners(port: chrome.runtime.Port) {
        backgroundPort = port;

        try {
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
                if (!isExtensionContextValid()) {
                    reportPageContextLost();
                }
            });
        } catch (error) {
            reportPageContextLost(error);
        }
    }
}

function injectPageClient() {
    if (!isExtensionContextValid()) {
        reportPageContextLost();
        return;
    }
    try {
        const url = chrome.runtime.getURL(PAGE_CLIENT_FILE);
        const script = document.createElement("script");
        script.src = url;
        script.async = false;
        (document.head ?? document.documentElement).appendChild(script);
        script.addEventListener("load", () => script.remove());
    } catch (error) {
        reportPageContextLost(error);
    }
}

function handleIsolatedWorldError(event: ErrorEvent) {
    if (!isContextInvalidatedError(event.error) && !isContextInvalidatedError(event.message)) {
        return;
    }
    event.preventDefault();
    reportPageContextLost(event.error ?? event.message);
}

function handleIsolatedWorldRejection(event: PromiseRejectionEvent) {
    if (!isContextInvalidatedError(event.reason)) {
        return;
    }
    event.preventDefault();
    reportPageContextLost(event.reason);
}

function reportPageContextLost(error?: unknown) {
    if (isContextInvalidatedError(error) || !isExtensionContextValid()) {
        showInvalidCtx("reload-page");
        return;
    }
    showInvalidCtx("reload-extension");
}
