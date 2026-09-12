import type { BackgroundToPageMessage, PageToBackgroundMessage } from "@/shared/messages";
import { isExtensionMessage } from "@/shared/messages";

window.__MOTION_BRIDGE_HAS_LOADED = true;

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
