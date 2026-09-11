import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = readFileSync(join(root, "public/vendor/editor.bundle.js"), "utf8").split(/\n/);

function slice(start, end) {
  return bundle.slice(start - 1, end).join("\n");
}

function convert(source) {
  return source
    .replace(/react\.exports\./g, "React.")
    .replace(/styled\$1/g, "styled")
    .replace(/Instructions\$1/g, "Instructions")
    .replace(/Overlay\$1/g, "Overlay")
    .replace(/getCurrentTime\$2/g, "getCurrentTime")
    .replace(/getOpenExport\$1/g, "getSetIsExportOpen")
    .replace(/__rest\$1\(/g, "omitKeys(")
    .replace(/HighlightJS\./g, "hljs.")
    .replace(/\be\$5\(/g, "current(")
    .replace(/sync\.update/g, "framesyncUpdate")
    .replace(/cancelSync\.update/g, "framesyncCancel");
}

function write(rel, header, start, end) {
  const out = join(root, "src/editor-vendor", rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${header.trim()}\n\n${convert(slice(start, end))}\n`);
}

write(
  "ui/studio.tsx",
  `/* Converted from the original Motion DevTools editor bundle (timeline chrome). */
import * as React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { v4 as uuid } from "uuid";
import {
  getPlayback,
  getSelectedAnimation,
  getSelectedAnimationName,
  getSetIsExportOpen,
  getTimeScale,
  useEditorState,
} from "../state/store";
import { omitKeys } from "../lib/omit-keys";
import { framesyncCancel, framesyncUpdate } from "../lib/framesync";
`,
  10658,
  11491,
);

write(
  "ui/tabs.tsx",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
`,
  11731,
  11760,
);

write(
  "export/codegen.ts",
  `/* Converted from the original Motion DevTools editor bundle. */
import { defaults, pipeToCamel, sortKeyframesByOffset } from "../state/keyframe-utils";
import type { AnimationMetadata } from "../types";

const noopReturn = <T>(value: T) => value;
`,
  11762,
  12149,
);

write(
  "ui/code-export.tsx",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import styled from "styled-components";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import { generateCSSAnimationCode, generateCSSTransitionCode, generateMotionOneCode } from "../export/codegen";
import { getSelectedAnimation, getSetIsExportOpen, useEditorState } from "../state/store";
import { Tabs } from "./tabs";

hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
`,
  16183,
  16353,
);

write(
  "ui/timeline.tsx",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import useMeasure from "react-use-measure";
import { shallow } from "zustand/shallow";
import { useEditorState } from "../state/store";
import { CodeExport } from "./code-export";
import { PlaybackControls, Sidebar, sidebarWidth } from "./studio";
`,
  16355,
  16415,
);

write(
  "ui/keyframe-edit-panel.tsx",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import styled from "styled-components";
import { Leva, LevaInputs, useControls } from "leva";
import { bezier } from "@leva-ui/plugin-bezier";
import { shallow } from "zustand/shallow";
import {
  getDeleteKeyframe,
  getHistory,
  getSelectedAnimation,
  getUpdateKeyframe,
  getUpdateKeyframeEasing,
  useEditorState,
} from "../state/store";
import { sortKeyframesByOffset } from "../state/keyframe-utils";
import { ActionButton, SidebarContainer, ValueMarker } from "./studio";
`,
  25833,
  25981,
);

write(
  "chrome/keyboard.ts",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import { useEditorState } from "../state/store";
`,
  25983,
  26026,
);

write(
  "ui/editor.tsx",
  `/* Converted from the original Motion DevTools editor bundle. */
import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { usePort } from "../chrome/port";
import { useKeyboardShortcuts } from "../chrome/keyboard";
import { useEditorState } from "../state/store";
import { Instructions, TabBar } from "./studio";
import { Timeline } from "./timeline";
import { KeyframeEditPanel } from "./keyframe-edit-panel";
`,
  26061,
  26070,
);

console.log("extracted editor-vendor modules");
