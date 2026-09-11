import { AnimatePresence } from "framer-motion";
import { useKeyboardShortcuts } from "../chrome/keyboard";
import { usePort } from "../chrome/port";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";
import { Instructions } from "./instructions";
import { KeyframeEditPanel } from "./keyframe-edit-panel";
import { TabBar } from "./tab-bar";
import { Timeline } from "./timeline";

const getHasAnimations = (state: EditorStore) => state.animations && Object.keys(state.animations).length;

export function Editor() {
  usePort();
  useKeyboardShortcuts();
  const hasAnimations = useEditorState(getHasAnimations);

  return (
    <>
      <TabBar />
      <AnimatePresence exitBeforeEnter>
        {hasAnimations ? <Timeline key="timeline" /> : <Instructions key="instructions" />}
      </AnimatePresence>
      <KeyframeEditPanel />
    </>
  );
}
