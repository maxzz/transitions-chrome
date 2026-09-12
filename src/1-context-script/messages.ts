import { isExtensionMessage } from "@/9-shared/messages";
import { store } from "./store";

export function handleMessages(onReadyRequest?: () => void) {
    window.addEventListener("message", ({ source, data }) => {
        if (source !== window) return;
        if (data?.type === "requestclientready") {
            onReadyRequest?.();
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
