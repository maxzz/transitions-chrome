import type { AnimationStartMessage } from "@/9-shared/messages";
import { cssAnimation } from "../plugins/1-1-plugin-css-animation";
import { cssTransition } from "../plugins/1-2-plugin-css-transition";
import { motionOne } from "../plugins/1-3-plugin-motion-one";
import { startAnimationScan } from "../plugins/1-0-scan-animations";
import { store } from "../8-0-store";

const plugins = [cssTransition, cssAnimation, motionOne];

export function handleRecordedAnimations() {
    let scheduledFlush: number | undefined;

    function flushAnimations() {
        scheduledFlush = undefined;
        const { recordedAnimations, flushRecordedAnimations } = store.getState();
        if (!recordedAnimations) return;
        const message: AnimationStartMessage = {
            type: "animationstart",
            animations: recordedAnimations,
        };
        window.postMessage(message, "*");
        flushRecordedAnimations();
    }

    store.subscribe(
        (state) => state.recordedAnimations,
        (recordedAnimations) => {
            if (!recordedAnimations) return;
            if (scheduledFlush === undefined) {
                scheduledFlush = requestAnimationFrame(flushAnimations);
            }
        },
    );

    const setIsRecording = (isRecording: boolean) => {
        plugins.forEach((plugin) => {
            if (isRecording) {
                plugin.onRecordStart();
            } else {
                plugin.onRecordEnd();
            }
        });
    };

    store.subscribe((state) => state.isRecording, setIsRecording);
    setIsRecording(true);
    startAnimationScan();
}
