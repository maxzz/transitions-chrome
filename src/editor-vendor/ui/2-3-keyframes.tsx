import { useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import { v4 as uuid } from "uuid";
import styled from "styled-components";
import { motion } from "framer-motion";
import { shallow } from "../lib/shallow";
import { sortKeyframesByOffset } from "../state/keyframe-utils";
import { getHistory, getMoveKeyframe, getTimeScale, useEditorState } from "../state/store";
import type { AnimationMetadata, DragOrigin, EditorStore, KeyframeMetadata, ValueAnimationRecord } from "../types";
import { RepeatIcon } from "./8-icons";
import { sidebarWidth, ValueMarker } from "./shared-styles";

const TransitionMarker = styled(motion.div)`
  position: absolute;
  top: calc(50% - 1px);
  left: 0;
  height: 2px;
  background-color: var(--feint);
  border-radius: 2px;
`;

const RepeatContainer = styled.div`
  width: 200px;
  position: absolute;
  top: 0;
  bottom: 0;
`;

const GradientMask = styled.div`
  background: linear-gradient(to left, var(--background), var(--background-transparent));
  position: absolute;
  inset: 0;
`;

const RepeatCount = styled.code`
  display: flex;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50px;
  transform: translateY(-50%);
  font-weight: bold;
  font-size: 12px;
  border-radius: 5px;
  padding: 2px 5px;
  background: var(--feint-solid);
  color: rgba(255, 255, 255, 0.4);

  svg {
    margin-right: 4px;
    fill: rgba(255, 255, 255, 0.4);
  }
`;

const ValueAnimationContainer = styled.li`
  display: flex;
  position: relative;
  height: var(--row-height);
`;

const ValueMarkerContainer = styled.div`
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  z-index: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const bufferTime = 1;

function RepeatMarker({ scale, time, repeat }: { scale: number; time: number; repeat: number | string; }) {
    return (
        <RepeatContainer style={{ transform: `translateX(${time * scale}px)` }}>
            <TransitionMarker style={{ width: "100%" }} />
            <GradientMask />
            <RepeatCount>
                <RepeatIcon style={{ width: 20, height: 20 }} />
                {repeat}
            </RepeatCount>
        </RepeatContainer>
    );
}

const getSelectedKeyframes = (state: EditorStore) => state.selectedKeyframes;
const getSelectKeyframe = (state: EditorStore) => state.selectKeyframe;
const getAddKeyframe = (state: EditorStore) => state.addKeyframe;

function isKeyframeSelected(selectedKeyframes: KeyframeMetadata[] | undefined, keyframeId: string) {
    return selectedKeyframes?.some((keyframe) => keyframe.id === keyframeId) ?? false;
}

function ValueKeyframes({
    scale,
    animation,
    containerRef,
}: {
    scale: number;
    animation: ValueAnimationRecord;
    containerRef: MutableRefObject<HTMLElement | null>;
}) {
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

    useEffect(() => {
        document.body.style.cursor = isDragging ? "ew-resize" : "";
    }, [isDragging]);

    useEffect(() => {
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
    }, [containerRef, dragOrigin, elementId, enableHistory, id, moveKeyframe, scale]);

    for (const { offset, id: keyframeId } of orderedKeyframes) {
        const time = delay + offset * duration;
        const keyframeIsSelected = isKeyframeSelected(selectedKeyframes, keyframeId);
        markers.push(
            <div key={keyframeId}>
                {prevTime !== undefined ? (
                    <TransitionMarker
                        initial={false}
                        animate={{
                            backgroundColor: keyframeIsSelected ? "var(--strong-blue)" : "var(--feint)",
                        }}
                        transition={{ duration: 0.1 }}
                        style={{
                            width: (time - prevTime) * scale,
                            transform: `translateX(${(prevTime ?? 0) * scale}px)`,
                        }}
                    />
                ) : null}
                <ValueMarkerContainer
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
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
                    style={{
                        cursor: isDragging ? "ew-resize" : "pointer",
                        transform: `translateX(${time * scale}px)`,
                    }}
                >
                    <ValueMarker
                        initial={false}
                        animate={{
                            backgroundColor: keyframeIsSelected ? "var(--strong-blue)" : "var(--white)",
                        }}
                        transition={{ duration: 0.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ rotate: 45 }}
                    />
                </ValueMarkerContainer>
            </div>,
        );
        prevTime = time;
    }

    return (
        <ValueAnimationContainer
            style={{ width: (delay + duration + bufferTime) * scale }}
            onClick={(event) => {
                event.stopPropagation();
                addKeyframe(
                    elementId,
                    id,
                    uuid(),
                    (event.pageX + (containerRef.current?.scrollLeft ?? 0) - sidebarWidth - 20) / scale,
                );
            }}
        >
            {markers}
            {repeat ? <RepeatMarker repeat={repeat} time={prevTime || 0} scale={scale} /> : null}
        </ValueAnimationContainer>
    );
}

const ElementAnimationContainer = styled.ul`
  padding-top: var(--row-height);
  padding-left: 10px;

  &:first-child {
    padding-top: calc(var(--row-height) + 10px);
  }
`;

export function Keyframes({
    animation,
    containerRef,
}: {
    animation: AnimationMetadata;
    containerRef: MutableRefObject<HTMLElement | null>;
}) {
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
            <ElementAnimationContainer key={elementName}>{valueAnimations}</ElementAnimationContainer>,
        );
    }

    return <div>{elementAnimations}</div>;
}
