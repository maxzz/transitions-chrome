import { handleInspectedAnimation } from "./inspect";
import { handleMessages } from "./messages";
import { handleRecordedAnimations } from "./recording";

/**
 * Page-world client. Chrome injects this as a MAIN-world content script at
 * document_start so it can see CSS/Motion animations and set
 * __MOTION_DEV_TOOLS_RECORD. Do not use chrome.* here — MAIN world has no
 * extension APIs; the isolated bridge relays window.postMessage.
 */

function announceReady() {
    window.postMessage({ type: "clientready" }, "*");
}

function createDevToolsClient() {
    handleRecordedAnimations();
    handleInspectedAnimation();
    handleMessages(announceReady);
    announceReady();
}

if (!window.__MOTION_DEV_TOOLS) {
    window.__MOTION_DEV_TOOLS = true;
    createDevToolsClient();
}
