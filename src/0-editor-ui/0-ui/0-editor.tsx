import { AnimatePresence } from "framer-motion";
import { useKeyboardShortcuts } from "../chrome/keyboard";
import { usePort } from "../chrome/port";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";
import { Instructions } from "./1-instructions";
import { KeyframeEditPanel } from "./keyframe-edit-panel";
import { TabBar } from "./tab-bar";
import { Timeline } from "./2-0-timeline";

export function Editor() {
    usePort();
    useKeyboardShortcuts();

    const hasAnimations = useEditorState(getHasAnimations);

    return (<>
        <TabBar />

        <AnimatePresence exitBeforeEnter>
            {hasAnimations
                ? <Timeline key="timeline" />
                : <Instructions key="instructions" />
            }
        </AnimatePresence>

        <KeyframeEditPanel />
    </>);
}

function getHasAnimations(state: EditorStore) {
    return state.animations && Object.keys(state.animations).length;
}
