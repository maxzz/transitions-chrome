import { useMemo, useState } from "react";
import styled from "styled-components";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import { generateCSSAnimationCode, generateCSSTransitionCode, generateMotionOneCode } from "../export/codegen";
import { getSelectedAnimation, getSetIsExportOpen, useEditorState } from "../state/store";
import type { AnimationMetadata, AnimationSource } from "../types";
import { CloseIcon } from "./icons";
import { Tabs } from "./tabs";

hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
`;

const Modal = styled(motion.div)`
  background: var(--feint-solid);
  border-radius: 15px;
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 80%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > div {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  h1 {
    font-size: 24px;
    line-height: 24px;
    letter-spacing: -1px;
    font-weight: bold;
    flex-grow: 0;
    margin-bottom: 30px;
    padding: 7px 0 0 7px;

    span {
      background: var(--background);
      color: rgba(255, 255, 255, 0.6);
      border-radius: 2px;
      font-size: 12px;
      line-height: 12px;
      padding: 2px 4px;
      font-weight: normal;
      margin-left: 10px;
      letter-spacing: 0;
      display: inline-block;
      transform: translateY(-2px);
    }
  }

  pre {
    flex: 1;
    padding: 10px;
    position: relative;
  }

  code {
    display: block;
    user-select: text;
    color: #f5f09d;

    * {
      user-select: text;
    }

    .hljs-title,
    .hljs-built_in {
      color: #fff757;
    }

    .hljs-string,
    .hljs-number {
      color: #aef5eb;
    }

    .hljs-attr,
    .hljs-attribute {
      color: #69ffeb;
    }
  }
`;

const CodeContainer = styled(motion.div)`
  background: var(--background);
  display: block;
  border-radius: 0 0 8px 8px;
  overflow: auto;
`;

const CloseButton = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 24px;
  height: 24px;
  padding: 0;
  cursor: pointer;

  svg {
    width: 24px;
    height: 24px;
  }

  path {
    stroke: var(--white);
  }
`;

function getSource(animation?: AnimationMetadata): AnimationSource {
  if (!animation) return "motion-one";
  const firstAnimation = Object.values(animation.elements)[0]?.[0];
  return firstAnimation?.source || "motion-one";
}

const tabs = [
  { id: "motion-one", label: "Motion One" },
  { id: "css-animation", label: "CSS animation" },
  { id: "css-transition", label: "CSS transition" },
];

const codeGenerators: Record<string, (animation: AnimationMetadata) => string> = {
  "motion-one": generateMotionOneCode,
  "css-transition": generateCSSTransitionCode,
  "css-animation": generateCSSAnimationCode,
};

export function CodeExport() {
  const setIsEditorOpen = useEditorState(getSetIsExportOpen);
  const selectedAnimation = useEditorState(getSelectedAnimation);
  const [exportType, setExportType] = useState(getSource(selectedAnimation));
  const code = useMemo(
    () => (selectedAnimation ? (codeGenerators[exportType]?.(selectedAnimation) ?? "") : ""),
    [selectedAnimation, exportType],
  );

  return (
    <LayoutGroup>
      <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
        <Modal
          initial={{ scale: 0.85 }}
          animate={{
            scale: 1,
            transition: { type: "spring", duration: 0.5, bounce: 0.2 },
          }}
          exit={{ scale: 0.95, transition: { duration: 0.2 } }}
          layout
        >
          <motion.div layout="position">
            <h1>
              Export <span>Beta</span>
            </h1>
            <LayoutGroup id="code-export">
              <Tabs values={tabs} selected={exportType} onChange={(id) => setExportType(id as AnimationSource)} />
            </LayoutGroup>
            <CodeContainer layout layoutScroll>
              <motion.pre layout="position">
                <AnimatePresence initial={false} exitBeforeEnter>
                  <motion.code
                    key={code}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.3, ease: "linear" },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.1, ease: "linear" },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight(code, {
                        language: exportType.startsWith("css") ? "css" : "javascript",
                      }).value,
                    }}
                  />
                </AnimatePresence>
              </motion.pre>
            </CodeContainer>
          </motion.div>
          <CloseButton layout onClick={() => setIsEditorOpen(false)}>
            <CloseIcon />
          </CloseButton>
        </Modal>
      </Overlay>
    </LayoutGroup>
  );
}
