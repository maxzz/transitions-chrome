import { useRef } from "react";
import useMeasure from "react-use-measure";
import { AnimatePresence, motion } from "framer-motion";
import { shallow } from "../utils/shallow";

import { type EditorStore } from "../9-types-ui";
import { useEditorState } from "../state/0-ui-store";

import { Sidebar } from "./2-1-sidebar";
import { TimeMarkers } from "./2-2-time-markers";
import { Keyframes } from "./2-4-keyframes";
import { PlaybackControls } from "./2-3-playback-controls";
import { CodeExportPopover } from "./7-0-code-export-popover";

export function Timeline() {
    const scrollRef = useRef<HTMLElement | null>(null);
    const [viewportRef, viewport] = useMeasure({ debounce: 1 });
    const [contentRef, content] = useMeasure({ debounce: 1 });

    const { animations, selectedAnimationName, deselectKeyframes, isExportOpen } = useEditorState(getTimelineState, shallow);
    if (!selectedAnimationName) {
        return null;
    }
    const selectedAnimation = animations[selectedAnimationName];
    if (!selectedAnimation) {
        return null;
    }

    const timelineRect = {
        width: viewport.width,
        height: content.height || viewport.height,
    };

    return (
        <motion.main
            ref={(node) => {
                scrollRef.current = node;
                viewportRef(node);
            }}
            className="relative flex min-h-0 min-w-0 flex-1 overflow-auto scrollbar-gutter-stable [--row-height:28px] [--sidebar-width:220px]"
        >

            {/* Main content */}
            <div className="grid min-w-0 grid-cols-[var(--sidebar-width)_1fr]" ref={contentRef} key={selectedAnimationName}>
                <Sidebar animation={selectedAnimation} />

                {/* Visualization of the timeline */}
                <div className="relative flex min-w-0 flex-1 flex-col" onClick={deselectKeyframes}>
                    <TimeMarkers containerRef={scrollRef} timelineRect={timelineRect} currentTime={selectedAnimation.currentTime} />
                    <Keyframes containerRef={scrollRef} animation={selectedAnimation} />
                    <PlaybackControls />
                </div>
            </div>

            <AnimatePresence>{isExportOpen ? <CodeExportPopover /> : null}</AnimatePresence>

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
