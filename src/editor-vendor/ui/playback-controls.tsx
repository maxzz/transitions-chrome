import { useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { framesyncCancel, framesyncUpdate } from "../lib/framesync";
import { getPlayback, getSelectedAnimation, useEditorState } from "../state/store";
import { PauseIcon, PlayIcon, SkipBackIcon } from "./icons";

const Container = styled.div`
  background-color: var(--feint);
  position: fixed;
  bottom: 10px;
  left: calc(var(--sidebar-width) + 10px);
  border-radius: 20px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  z-index: 4;
  backdrop-filter: blur(4px);

  span {
    display: block;
    font-weight: bold;
  }
`;

const ActionButtonContainer = styled(motion.button)`
  padding: 0;
  margin-right: 8px;

  svg {
    width: 16px;
    height: 16px;
    fill: var(--white);
  }
`;

export function PlaybackControls() {
  const { playbackOrigin, startPlaying, stopPlaying, scrubTo } = useEditorState(getPlayback);

  useEffect(() => {
    if (!playbackOrigin) return;
    const onFrame = ({ timestamp }: { timestamp: number }) => {
      const delta = timestamp - playbackOrigin.startedAt;
      scrubTo((playbackOrigin.originTime + delta) / 1000);
    };
    framesyncUpdate(onFrame, true);
    return () => framesyncCancel(onFrame);
  }, [playbackOrigin, scrubTo]);

  return (
    <Container onClick={(event) => event.stopPropagation()}>
      <ActionButtonContainer
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          scrubTo(0);
          if (playbackOrigin) startPlaying();
        }}
      >
        <SkipBackIcon />
      </ActionButtonContainer>
      <ActionButtonContainer whileTap={{ scale: 0.85 }} onClick={playbackOrigin ? stopPlaying : startPlaying}>
        {playbackOrigin ? <PauseIcon /> : <PlayIcon />}
      </ActionButtonContainer>
      <CurrentTime />
    </Container>
  );
}

function CurrentTime() {
  const currentAnimation = useEditorState(getSelectedAnimation);
  if (!currentAnimation) return null;
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{currentAnimation.currentTime.toFixed(2)}</span>;
}
