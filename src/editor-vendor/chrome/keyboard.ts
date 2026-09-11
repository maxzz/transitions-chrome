import { useEffect } from "react";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";

const handlers: Record<string, (state: EditorStore, event: KeyboardEvent) => void> = {
  " ": (state, event) => {
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
  Escape: (state, event) => {
    if (state.isExportOpen) {
      event.preventDefault();
      event.stopPropagation();
      state.setIsExportOpen(false);
    }
  },
  r: (_state, event) => {
    if (event.ctrlKey) event.preventDefault();
  },
  z: (state, event) => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      if (event.shiftKey) state.redo?.();
      else state.undo?.();
    }
  },
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (document.querySelector(":focus")) return;
      const handler = handlers[event.key];
      if (handler) handler(useEditorState.getState(), event);
    };
    document.addEventListener("keydown", handleKeyboardShortcuts);
    return () => document.removeEventListener("keydown", handleKeyboardShortcuts);
  }, []);
}
