import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import { generateCSSAnimationCode, generateCSSTransitionCode, generateMotionOneCode } from "../export/codegen";
import { getSelectedAnimation, getSetIsExportOpen, useEditorState } from "../state/store";
import type { AnimationMetadata, AnimationSource } from "../types";
import { CloseIcon } from "./8-icons";
import { Tabs } from "./tabs";

hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);

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
            {/* Overlay */}
            <motion.div
                className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-12.5 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
                {/* Modal */}
                <motion.div
                    className="relative flex max-h-[80%] w-full max-w-150 flex-col overflow-hidden rounded-[15px] bg-feint-solid p-5"
                    layout
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1, transition: { type: "spring", duration: 0.5, bounce: 0.2 } }}
                    exit={{ scale: 0.95, transition: { duration: 0.2 } }}
                >
                    <motion.div className="flex flex-col overflow-hidden" layout="position">
                        <h1 className="mb-7.5 grow-0 pt-1.75 pl-1.75 text-[24px] leading-6 font-bold tracking-[-1px]">
                            Export{" "}
                            <span className="ml-2.5 inline-block -translate-y-0.5 rounded-xs bg-background px-1 py-0.5 text-xs leading-3 font-normal tracking-normal text-white/60">
                                Beta
                            </span>
                        </h1>

                        <LayoutGroup id="code-export">
                            <Tabs values={tabs} selected={exportType} onChange={(id) => setExportType(id as AnimationSource)} />
                        </LayoutGroup>

                        {/* CodeContainer */}
                        <motion.div className="block overflow-auto rounded-b-lg bg-background" layout layoutScroll>
                            <motion.pre className="relative flex-1 p-2.5" layout="position">
                                <AnimatePresence initial={false} exitBeforeEnter>
                                    <motion.code
                                        key={code}
                                        className="block text-[#f5f09d] select-text **:select-text [&_.hljs-attr]:text-[#69ffeb] [&_.hljs-attribute]:text-[#69ffeb] [&_.hljs-built_in]:text-[#fff757] [&_.hljs-number]:text-[#aef5eb] [&_.hljs-string]:text-[#aef5eb] [&_.hljs-title]:text-[#fff757]"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, transition: { duration: 0.3, ease: "linear" } }}
                                        exit={{ opacity: 0, transition: { duration: 0.1, ease: "linear" } }}
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight(code, {
                                                language: exportType.startsWith("css") ? "css" : "javascript",
                                            }).value,
                                        }}
                                    />
                                </AnimatePresence>
                            </motion.pre>
                        </motion.div>
                    </motion.div>

                    {/* CloseButton */}
                    <motion.div
                        className="absolute top-5 right-5 size-6 cursor-pointer p-0 [&_path]:stroke-(--white) [&_svg]:size-6"
                        layout
                        onClick={() => setIsEditorOpen(false)}
                    >
                        <CloseIcon />
                    </motion.div>
                </motion.div>
            </motion.div>
        </LayoutGroup>
    );
}
