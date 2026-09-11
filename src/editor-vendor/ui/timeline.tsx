import { useRef } from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import useMeasure from "react-use-measure";
import { shallow } from "../lib/shallow";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";
import { CodeExport } from "./code-export";
import { Keyframes } from "./keyframes";
import { PlaybackControls } from "./playback-controls";
import { Sidebar } from "./sidebar";
import { sidebarWidth } from "./shared-styles";
import { TimeMarkers } from "./time-markers";

const Container = styled(motion.main)`
  display: flex;
  overflow: overlay;
  position: relative;
  flex: 1;
  --row-height: 28px;
  --sidebar-width: ${sidebarWidth}px;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
`;

const Visualisation = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1;
`;

const Curtain = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--background);
  pointer-events: none;
  z-index: 1000;
`;

const getTimelineState = ({
    animations,
    selectedAnimationName,
    deselectKeyframes,
    isExportOpen,
}: EditorStore) => ({
    animations,
    selectedAnimationName,
    deselectKeyframes,
    isExportOpen,
});

export function Timeline() {
    const ref = useRef<HTMLDivElement | null>(null);
    const [measureRef, rect] = useMeasure();
    const { animations, selectedAnimationName, deselectKeyframes, isExportOpen } = useEditorState(
        getTimelineState,
        shallow,
    );

    if (!selectedAnimationName) return null;
    const selectedAnimation = animations[selectedAnimationName];
    if (!selectedAnimation) return null;

    return (
        <Container ref={ref}>
            <Content ref={measureRef} key={selectedAnimationName}>
                <Sidebar animation={selectedAnimation} />
                <Visualisation onClick={deselectKeyframes}>
                    <TimeMarkers containerRef={ref} timelineRect={rect} currentTime={selectedAnimation.currentTime} />
                    <Keyframes containerRef={ref} animation={selectedAnimation} />
                    <PlaybackControls />
                </Visualisation>
            </Content>
            <AnimatePresence>{isExportOpen ? <CodeExport /> : null}</AnimatePresence>
            <Curtain
                initial={{ opacity: 1 }}
                animate={{
                    opacity: 0,
                    transition: { ease: "linear", duration: 0.5 },
                    transitionEnd: { display: "none" },
                }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
            />
        </Container>
    );
}
