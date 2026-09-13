import { useEffect } from "react";
import { motion } from "framer-motion";
import { framesyncCancel, framesyncUpdate } from "../utils/framesync";
import { getPlayback, getSelectedAnimation, useEditorState } from "../state/0-ui-store";
import { PauseIcon, PlayIcon, SkipBackIcon } from "./8-icons";

export function PlaybackControls() {
    const { playbackOrigin, startPlaying, stopPlaying, scrubTo } = useEditorState(getPlayback);

    useEffect(
        () => {
            if (!playbackOrigin) return;
            const onFrame = ({ timestamp }: { timestamp: number; }) => {
                const delta = timestamp - playbackOrigin.startedAt;
                scrubTo((playbackOrigin.originTime + delta) / 1000);
            };
            framesyncUpdate(onFrame, true);
            return () => framesyncCancel(onFrame);
        },
        [playbackOrigin, scrubTo]);

    return (<>
        {/* Container */}
        <div
            className="fixed bottom-2.5 left-[calc(var(--sidebar-width)+10px)] z-4 flex items-center rounded-[20px] bg-feint px-3 py-2 backdrop-blur-xs [&_span]:block [&_span]:font-bold"
            onClick={(event) => event.stopPropagation()}
        >
            {/* ActionButtonContainer */}
            <motion.button
                className={actionButtonClasses}
                whileTap={{ scale: 0.85 }}
                onClick={() => { scrubTo(0); if (playbackOrigin) startPlaying(); }}
            >
                <SkipBackIcon />
            </motion.button>

            {/* ActionButtonContainer */}
            <motion.button className={actionButtonClasses} whileTap={{ scale: 0.85 }} onClick={playbackOrigin ? stopPlaying : startPlaying}>
                {playbackOrigin ? <PauseIcon /> : <PlayIcon />}
            </motion.button>

            <CurrentTime />
        </div>
    </>);
}

const actionButtonClasses = "mr-2 p-0 [&_svg]:size-4 [&_svg]:fill-(--white)";

function CurrentTime() {
    const currentAnimation = useEditorState(getSelectedAnimation);
    if (!currentAnimation) return null;
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>{currentAnimation.currentTime.toFixed(2)}</span>;
}

