import { useRef } from "react";
import useMeasure from "react-use-measure";
import { AnimatePresence, motion } from "framer-motion";
import { shallow } from "../utils/shallow";

import { type EditorStore } from "../types";
import { useEditorState } from "../state/0-ui-store";

import { Sidebar } from "./2-1-sidebar";
import { TimeMarkers } from "./2-2-time-markers";
import { Keyframes } from "./2-3-keyframes";
import { PlaybackControls } from "./2-4-playback-controls";
import { CodeExport } from "./7-0-code-export";

export function Timeline() {
    const ref = useRef<HTMLDivElement | null>(null);
    const [measureRef, rect] = useMeasure();

    const { animations, selectedAnimationName, deselectKeyframes, isExportOpen } = useEditorState(getTimelineState, shallow);
    if (!selectedAnimationName) {
        return null;
    }
    const selectedAnimation = animations[selectedAnimationName];
    if (!selectedAnimation) {
        return null;
    }

    return (
        <motion.main ref={ref} className="relative flex flex-1 [overflow:overlay] [--row-height:28px] [--sidebar-width:220px]">

            {/* Main content */}
            <div className="grid grid-cols-[var(--sidebar-width)_1fr]" ref={measureRef} key={selectedAnimationName}>
                <Sidebar animation={selectedAnimation} />

                {/* Visualization of the timeline */}
                <div className="relative flex flex-1 flex-col" onClick={deselectKeyframes}>
                    <TimeMarkers containerRef={ref} timelineRect={rect} currentTime={selectedAnimation.currentTime} />
                    <Keyframes containerRef={ref} animation={selectedAnimation} />
                    <PlaybackControls />
                </div>
            </div>

            <AnimatePresence>{isExportOpen ? <CodeExport /> : null}</AnimatePresence>

            {/* Curtain */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-1000 bg-background"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, transition: { ease: "linear", duration: 0.5 }, transitionEnd: { display: "none" } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
            />
        </motion.main>
    );
}

function getTimelineState({ animations, selectedAnimationName, deselectKeyframes, isExportOpen, }: EditorStore) {
    return ({
        animations,
        selectedAnimationName,
        deselectKeyframes,
        isExportOpen,
    });
}
