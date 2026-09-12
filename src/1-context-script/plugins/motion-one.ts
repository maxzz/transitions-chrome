import type { RecordPlugin } from "@/9-shared/types";
import { store } from "../store";

export const motionOne: RecordPlugin = {
    id: "motion-one",
    onRecordStart: () => {
        window.__MOTION_DEV_TOOLS_RECORD = store.getState().recordAnimation;
    },
    onRecordEnd: () => {
        window.__MOTION_DEV_TOOLS_RECORD = undefined;
    },
};
