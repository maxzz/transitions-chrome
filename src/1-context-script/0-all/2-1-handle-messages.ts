import { isExtensionMessage } from "@/9-shared/messages";
import { store } from "../8-0-store";
import { INVALID_CTX_MESSAGE_TYPE, showInvalidCtx } from "../runtime/port-disconnected-report";

export function handleMessages(onReadyRequest?: () => void) {
    window.addEventListener("message", ({ source, data }) => {
        if (source !== window) return;
        if (data?.type === "requestclientready") {
            onReadyRequest?.();
            return;
        }
        if (data?.type === INVALID_CTX_MESSAGE_TYPE) {
            showInvalidCtx();
            return;
        }
        if (!isExtensionMessage(data)) return;

        const state = store.getState();
        switch (data.type) {
            case "isrecording": {
                if (data.isRecording) {
                    if (!state.isRecording) state.startRecording();
                } else if (state.isRecording) {
                    state.stopRecording();
                }
                break;
            }
            case "scrubanimation": {
                state.scrubTo(data.time);
                break;
            }
            case "inspectanimation": {
                state.inspectAnimation(data.animation);
                break;
            }
        }
    });
}
