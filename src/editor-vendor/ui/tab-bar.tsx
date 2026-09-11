import styled from "styled-components";
import { motion } from "framer-motion";
import { shallow } from "../lib/shallow";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";
import { RecordIcon } from "./icons";
import { tabBarHeight } from "./shared-styles";

const Button = styled(motion.button)`
  height: ${tabBarHeight}px;
  flex: 0 0 ${tabBarHeight}px;
  position: relative;
  text-indent: -1000px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function RecordButton({
  isRecording,
  startRecording,
  stopRecording,
}: {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}) {
  return (
    <Button onClick={isRecording ? stopRecording : startRecording} whileTap="pressed">
      <RecordIcon
        variants={{ pressed: { scale: 0.8 } }}
        style={{
          backgroundColor: isRecording ? "var(--red)" : "rgba(255,255,255,0.5)",
        }}
      />
      {isRecording ? "Stop recording" : "Start recording"}
    </Button>
  );
}

const Container = styled.section`
  flex: 0 0 var(--tab-bar-height);
  border-bottom: 1px solid var(--feint);
  display: flex;
`;

const Tabs = styled(motion.ul)`
  display: flex;
  justify-content: flex-start;
  overflow-x: overlay;
  overflow-y: hidden;
  flex: 1;
`;

const Tab = styled(motion.li)`
  position: relative;
  cursor: pointer;
  padding: 0 12px 2px;
  font-weight: bold;
  display: flex;
  align-items: center;

  span {
    color: var(--white);
    white-space: nowrap;
  }
`;

const Underline = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--strong-blue);
`;

const duration = 0.8;
const transition = { type: "spring" as const, duration, bounce: 0 };

const getTabBarState = (state: EditorStore) => ({
  isRecording: state.isRecording,
  startRecording: state.startRecording,
  stopRecording: state.stopRecording,
  animations: state.animations,
  selectAnimation: state.selectAnimation,
  selected: state.selectedAnimationName,
});

export function TabBar() {
  const { isRecording, startRecording, stopRecording, animations, selectAnimation, selected } =
    useEditorState(getTabBarState, shallow);

  return (
    <Container>
      <RecordButton isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording} />
      <Tabs layoutScroll>
        {Object.keys(animations).map((animationName) => (
          <Tab
            key={animationName}
            onClick={() => selectAnimation(animationName)}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
          >
            <motion.span
              initial={false}
              animate={{ opacity: animationName === selected ? 1 : 0.65 }}
              transition={{ duration }}
            >
              {animationName}
            </motion.span>
            {animationName === selected ? (
              <Underline layoutId="tab-underline" layoutDependency={animationName === selected} transition={transition} />
            ) : null}
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
}
