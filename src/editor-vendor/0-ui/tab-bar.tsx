import { Fragment } from "react";
import { motion } from "framer-motion";
import { shallow } from "../utils/shallow";
import { useEditorState } from "../state/store";
import type { EditorStore } from "../types";
import { RecordIcon } from "./8-icons";

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
        <>
            {/* Button */}
            <motion.button
                className="relative flex h-(--tab-bar-height) w-(--tab-bar-height) shrink-0 items-center justify-center -indent-250"
                onClick={isRecording ? stopRecording : startRecording}
                whileTap="pressed"
            >
                <RecordIcon
                    variants={{ pressed: { scale: 0.8 } }}
                    style={{
                        backgroundColor: isRecording ? "var(--red)" : "rgba(255,255,255,0.5)",
                    }}
                />
                {isRecording ? "Stop recording" : "Start recording"}
            </motion.button>
        </>
    );
}

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
        <>
            {/* Container */}
            <section className="flex h-(--tab-bar-height) shrink-0 border-b border-feint">
                <RecordButton isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording} />
                {/* Tabs */}
                <motion.ul className="flex flex-1 justify-start overflow-y-hidden [overflow-x:overlay]" layoutScroll>
                    {Object.keys(animations).map((animationName) => (
                        <Fragment key={animationName}>
                            {/* Tab */}
                            <motion.li
                                className="relative flex cursor-pointer items-center px-3 pb-0.5 font-bold"
                                onClick={() => selectAnimation(animationName)}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={transition}
                            >
                                <motion.span
                                    className="whitespace-nowrap text-(--white)"
                                    initial={false}
                                    animate={{ opacity: animationName === selected ? 1 : 0.65 }}
                                    transition={{ duration }}
                                >
                                    {animationName}
                                </motion.span>
                                {animationName === selected ? (
                                    <>
                                        {/* Underline */}
                                        <motion.div
                                            className="absolute right-0 bottom-0 left-0 h-0.5 bg-strong-blue"
                                            layoutId="tab-underline"
                                            layoutDependency={animationName === selected}
                                            transition={transition}
                                        />
                                    </>
                                ) : null}
                            </motion.li>
                        </Fragment>
                    ))}
                </motion.ul>
            </section>
        </>
    );
}
