import { isExtensionMessage } from "@/shared/messages";
import { store } from "./store";

export function handleMessages() {
  window.addEventListener("message", ({ source, data }) => {
    if (source !== window) return;
    if (!isExtensionMessage(data)) return;

    const state = store.getState();
    switch (data.type) {
      case "isrecording": {
        if (data.isRecording) {
          state.startRecording();
        } else {
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
