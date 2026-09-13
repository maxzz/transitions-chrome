import { type MutableRefObject, Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { v4 as uuid } from "uuid";
import { shallow } from "../utils/shallow";
import { RepeatIcon } from "./8-icons";

import { type AnimationMetadata, type DragOrigin, type EditorStore, type KeyframeMetadata, type ValueAnimationRecord } from "../9-types-ui";
import { sortKeyframesByOffset } from "../state/8-keyframe-utils";
import { getHistory, getMoveKeyframe, getTimeScale, useEditorState } from "../state/0-ui-store";
import { sidebarWidth, ValueMarker } from "./8-shared-components";

export function Keyframes({ animation, containerRef }: { animation: AnimationMetadata; containerRef: MutableRefObject<HTMLElement | null>; }) {
    const { elements } = animation;
    const elementAnimations = [];
    const scale = useEditorState(getTimeScale);

    for (const elementName in elements) {
        const valueAnimations = [];
        
        for (const valueAnimation of elements[elementName] ?? []) {
            valueAnimations.push(
                <ValueKeyframes key={valueAnimation.id} containerRef={containerRef} scale={scale} animation={valueAnimation} />,
            );
        }

        elementAnimations.push(
            <Fragment key={elementName}>
                {/* ElementAnimationContainer */}
                <ul className="pt-(--row-height) pl-2.5 first:pt-[calc(var(--row-height)+10px)]">{valueAnimations}</ul>
            </Fragment>,
        );
    }

    return <div>{elementAnimations}</div>;
}

function ValueKeyframes({ scale, animation, containerRef }: { scale: number; animation: ValueAnimationRecord; containerRef: MutableRefObject<HTMLElement | null>; }) {
    const [dragOrigin, setDragOrigin] = useState<DragOrigin | undefined>();
    const [isDragging, setIsDragging] = useState(false);
    const selectKeyframe = useEditorState(getSelectKeyframe);
    const selectedKeyframes = useEditorState(getSelectedKeyframes);
    const addKeyframe = useEditorState(getAddKeyframe);
    const moveKeyframe = useEditorState(getMoveKeyframe);
    const { enableHistory } = useEditorState(getHistory, shallow);
    const { id, elementId, valueName, keyframes, options } = animation;
    const { delay = 0, duration = 0.3, repeat } = options;
    const markers = [];
    let prevTime: number | undefined;
    const orderedKeyframes = sortKeyframesByOffset(keyframes);

    useEffect(
        () => {
            document.body.style.cursor = isDragging ? "ew-resize" : "";
        },
        [isDragging]);

    useEffect(
        () => {
            if (!dragOrigin?.keyframeId) return;

            const handleDrag = (event: PointerEvent) => {
                const deltaX = event.pageX + (containerRef.current?.scrollLeft ?? 0) - dragOrigin.pointerX;
                const newTime = Math.max(0, dragOrigin.time + deltaX / scale);
                moveKeyframe(elementId, id, dragOrigin.keyframeId ?? "", newTime);
                setIsDragging(true);
            };
            const stopDrag = () => {
                enableHistory?.(true);
                setIsDragging(false);
                setDragOrigin(undefined);
            };
            window.addEventListener("pointermove", handleDrag);
            window.addEventListener("pointerup", stopDrag);
            return () => {
                window.removeEventListener("pointermove", handleDrag);
                window.removeEventListener("pointerup", stopDrag);
            };
        },
        [containerRef, dragOrigin, elementId, enableHistory, id, moveKeyframe, scale]);

    for (const { offset, id: keyframeId } of orderedKeyframes) {
        const time = delay + offset * duration;
        const keyframeIsSelected = isKeyframeSelected(selectedKeyframes, keyframeId);
        markers.push(
            <div key={keyframeId}>
                {prevTime !== undefined
                    ? (<>
                        {/* TransitionMarker */}
                        <motion.div
                            className="absolute top-[calc(50%-1px)] left-0 h-0.5 rounded-xs bg-feint"
                            style={{ width: (time - prevTime) * scale, transform: `translateX(${(prevTime ?? 0) * scale}px)` }}
                            initial={false}
                            animate={{ backgroundColor: keyframeIsSelected ? "var(--strong-blue)" : "var(--feint)" }}
                            transition={{ duration: 0.1 }}
                        />
                    </>)
                    : null
                }

                {/* ValueMarkerContainer */}
                <div
                    className="absolute top-0 bottom-0 left-0 z-1 flex cursor-pointer items-center"
                    onClick={(event) => { event.stopPropagation(); }}
                    onPointerDown={(event) => {
                        event.stopPropagation();
                        selectKeyframe({
                            elementName: elementId,
                            valueName,
                            valueId: id,
                            id: keyframeId,
                        });
                        enableHistory?.(false);
                        setDragOrigin({
                            keyframeId,
                            pointerX: event.pageX + (containerRef.current?.scrollLeft ?? 0),
                            time,
                        });
                    }}
                    style={{ cursor: isDragging ? "ew-resize" : "pointer", transform: `translateX(${time * scale}px)` }}
                >
                    <ValueMarker
                        initial={false}
                        animate={{ backgroundColor: keyframeIsSelected ? "var(--strong-blue)" : "var(--white)" }}
                        transition={{ duration: 0.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ rotate: 45 }}
                    />
                </div>
            </div>,
        );
        prevTime = time;
    }

    return (<>
        {/* ValueAnimationContainer */}
        <li
            className="relative flex h-(--row-height)"
            style={{ width: (delay + duration + bufferTime) * scale }}
            onClick={(event) => {
                event.stopPropagation();
                addKeyframe(elementId, id, uuid(), (event.pageX + (containerRef.current?.scrollLeft ?? 0) - sidebarWidth - 20) / scale);
            }}
        >
            {markers}
            {repeat ? <RepeatMarker repeat={repeat} time={prevTime || 0} scale={scale} /> : null}
        </li>
    </>);
}

const bufferTime = 1;

function RepeatMarker({ scale, time, repeat }: { scale: number; time: number; repeat: number | string; }) {
    return (
        <div className="absolute top-0 bottom-0 w-50" style={{ transform: `translateX(${time * scale}px)` }}>

            {/* TransitionMarker */}
            <motion.div className="absolute top-[calc(50%-1px)] left-0 h-0.5 w-full rounded-xs bg-feint" />

            {/* GradientMask */}
            <div className="absolute inset-0 bg-[linear-gradient(to_left,var(--background),var(--background-transparent))]" />

            {/* RepeatCount */}
            <code className="absolute top-1/2 left-12.5 flex -translate-y-1/2 items-center rounded-[5px] bg-feint-solid px-1.25 py-0.5 text-xs font-bold text-white/40 [&_svg]:mr-1 [&_svg]:fill-white/40">
                <RepeatIcon style={{ width: 20, height: 20 }} />
                {repeat}
            </code>
        </div>
    );
}

const getSelectedKeyframes = (state: EditorStore) => state.selectedKeyframes;
const getSelectKeyframe = (state: EditorStore) => state.selectKeyframe;
const getAddKeyframe = (state: EditorStore) => state.addKeyframe;

function isKeyframeSelected(selectedKeyframes: KeyframeMetadata[] | undefined, keyframeId: string) {
    return selectedKeyframes?.some((keyframe) => keyframe.id === keyframeId) ?? false;
}
