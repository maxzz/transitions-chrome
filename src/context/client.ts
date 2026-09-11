import { handleInspectedAnimation } from "./inspect";
import { handleMessages } from "./messages";
import { handleRecordedAnimations } from "./recording";

/**
 * Page-world client. The isolated bridge injects this file as an IIFE so it
 * can see CSS/Motion animations on the page and set __MOTION_DEV_TOOLS_RECORD.
 */

function createDevToolsClient() {
    handleRecordedAnimations();
    handleInspectedAnimation();
    handleMessages();
    window.postMessage({ type: "clientready" }, "*");
}

if (!window.__MOTION_DEV_TOOLS) {
    window.__MOTION_DEV_TOOLS = true;
    createDevToolsClient();
}
