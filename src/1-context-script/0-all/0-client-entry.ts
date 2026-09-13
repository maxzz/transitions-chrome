import { handleInspectedAnimation } from "../inspect";
import { handleMessages } from "../messages";
import { handleRecordedAnimations } from "../recording";

/**
 * Page-world client. This file is bundled as a classic IIFE and injected into
 * the inspected page (MAIN world) so it can see CSS/Motion animations and set
 * __MOTION_DEV_TOOLS_RECORD. Do not use chrome.* here.
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
