import { useEffect } from "react";
import { type EditorStore } from "../9-types-ui";
import { useEditorState } from "../state/0-ui-store";

export function useKeyboardShortcuts() {
    useEffect(
        () => {
            function handleKeyboardShortcuts(event: KeyboardEvent) {
                if (document.querySelector(":focus")) {
                    return;
                }
                const handler = handlers[event.key];
                if (handler) {
                    handler(useEditorState.getState(), event);
                }
            }

            const controller = new AbortController();
            document.addEventListener("keydown", handleKeyboardShortcuts, { signal: controller.signal });
            return () => controller.abort();
        },
        []);
}

const handlers: Record<string, (state: EditorStore, event: KeyboardEvent) => void> = {
    " ":
        (state, event) => {
            event.preventDefault();
            if (event.shiftKey) {
                state.scrubTo(0);
                state.startPlaying();
            } else if (state.playbackOrigin) {
                state.stopPlaying();
            } else {
                state.startPlaying();
            }
        },
    Escape:
        (state, event) => {
            if (state.isExportOpen) {
                event.preventDefault();
                event.stopPropagation();
                state.setIsExportOpen(false);
            }
        },
    r:
        (_state, event) => {
            if (event.ctrlKey) {
                event.preventDefault();
            }
        },
    z:
        (state, event) => {
            if (event.metaKey || event.ctrlKey) {
                event.preventDefault();
                if (event.shiftKey) {
                    state.redo?.();
                } else {
                    state.undo?.();
                }
            }
        },
};
