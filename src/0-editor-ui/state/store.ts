import { useEffect, useRef, useState } from "react";
import { current, produce } from "immer";
import { createStore } from "zustand/vanilla";
import type { AnimationMetadata, EditorStore, KeyframeMetadata, RecordedAnimations } from "../types";
import {
    compareKeyframeByTime,
    defaults,
    getDefaultValue,
    getTimestampedKeyframes,
    getValueAnimation,
    isExistingTime,
    shallowCompare,
    snapNumberToNearest,
    updateValueAnimation,
} from "./keyframe-utils";

export const getSelectedAnimationName = (state: EditorStore) => state.selectedAnimationName;
export const getSelectedAnimation = (state: EditorStore) => {
    const name = getSelectedAnimationName(state);
    if (name) return state.animations[name];
};
export const getPlayback = (state: EditorStore) => ({
    playbackOrigin: state.playbackOrigin,
    startPlaying: state.startPlaying,
    stopPlaying: state.stopPlaying,
    scrubTo: state.scrubTo,
});
export const getCurrentTime = (state: EditorStore) => getSelectedAnimation(state)?.currentTime;
export const getUpdateKeyframe = (state: EditorStore) => state.updateKeyframe;
export const getUpdateKeyframeEasing = (state: EditorStore) => state.updateKeyframeEasing;
export const getDeleteKeyframe = (state: EditorStore) => state.deleteKeyframe;
export const getMoveKeyframe = (state: EditorStore) => state.moveKeyframe;
export const getTimeScale = (state: EditorStore) => state.scale;
export const getHistory = (state: EditorStore) => ({
    undo: state.undo,
    redo: state.redo,
    enableHistory: state.enableHistory,
});
export const getSetIsExportOpen = (state: EditorStore) => state.setIsExportOpen;
export const getAddAnimations = (state: EditorStore) => state.addAnimations;
export const getClear = (state: EditorStore) => state.clear;
export const getIsRecording = (state: EditorStore) => state.isRecording;

type SetState = (partial: Partial<EditorStore> | ((state: EditorStore) => Partial<EditorStore>)) => void;
type GetState = () => EditorStore;

const withHistory =
    (createState: (set: SetState, get: GetState) => Omit<EditorStore, "undo" | "redo" | "enableHistory">) =>
        (set: SetState, get: GetState) => {
            let isEnabled = true;
            const prev: Record<string, unknown[]> = {};
            const next: Record<string, unknown[]> = {};

            const changeHistory =
                (
                    getHistoryItem: (prevBuffer: unknown[], nextBuffer: unknown[], currentAnimation: unknown) => unknown,
                    amendHistory: (prevBuffer: unknown[], nextBuffer: unknown[], currentAnimation: unknown) => void,
                ) =>
                    () => {
                        const { animations, selectedAnimationName = "" } = get();
                        const prevBuffer = prev[selectedAnimationName] || [];
                        const nextBuffer = next[selectedAnimationName] || [];
                        set({
                            animations: produce(animations, (draft) => {
                                const animation = draft[selectedAnimationName];
                                if (!animation) return;
                                const currentAnimation = current(animation.elements);
                                if (!currentAnimation) return;
                                const historyAnimation = getHistoryItem(prevBuffer, nextBuffer, currentAnimation);
                                if (historyAnimation) {
                                    animation.elements = historyAnimation as AnimationMetadata["elements"];
                                    amendHistory(prevBuffer, nextBuffer, currentAnimation);
                                }
                            }),
                        });
                    };

            const enableHistory = (newIsEnabled: boolean) => {
                if (newIsEnabled === isEnabled) return;
                isEnabled = newIsEnabled;
                if (!isEnabled) {
                    changeHistory(
                        (_prev, _next, currentAnimation) => currentAnimation,
                        (prevBuffer, nextBuffer, currentAnimation) => {
                            if (prevBuffer[prevBuffer.length - 1] !== currentAnimation) {
                                prevBuffer.push(currentAnimation);
                                nextBuffer.length = 0;
                            }
                        },
                    )();
                }
            };

            const undo = changeHistory(
                (prevBuffer) => prevBuffer[prevBuffer.length - 1],
                (prevBuffer, nextBuffer, currentAnimation) => {
                    prevBuffer.length -= 1;
                    nextBuffer.unshift(currentAnimation);
                },
            );
            const redo = changeHistory(
                (_prev, nextBuffer) => nextBuffer[0],
                (prevBuffer, nextBuffer, currentAnimation) => {
                    prevBuffer.push(currentAnimation);
                    nextBuffer.splice(0, 1);
                },
            );

            const wrappedSet: SetState = (args) => {
                const selectedAnimationName =
                    (typeof args === "function" ? args(get()) : args).selectedAnimationName || get().selectedAnimationName;
                const prevState = selectedAnimationName ? get().animations[selectedAnimationName]?.elements : undefined;
                set({ undo, redo, enableHistory });
                set(args);
                const currentState = selectedAnimationName ? get().animations[selectedAnimationName]?.elements : undefined;
                if (!isEnabled || !selectedAnimationName || prevState === currentState) return;
                if (prevState === undefined) prev[selectedAnimationName] = [];
                const prevBuffer = prev[selectedAnimationName] ?? [];
                prev[selectedAnimationName] = prevBuffer;
                if (prevState) prevBuffer.push(prevState);
                next[selectedAnimationName] = [];
            };

            return {
                ...createState(wrappedSet, get),
                undo,
                redo,
                enableHistory,
            };
        };

const makeKeyframeUpdater = (get: GetState, set: SetState, key: "value" | "easing") => {
    return (keyframeMeta: KeyframeMetadata, newValue: unknown) => {
        const { animations, selectedAnimationName } = get();
        const { elementName, valueId, id } = keyframeMeta;
        if (!selectedAnimationName) return;
        set({
            animations: produce(animations, (draft) => {
                const elementValues = draft[selectedAnimationName]?.elements[elementName];
                if (!elementValues) return;
                const valueIndex = elementValues.findIndex((value) => value.id === valueId);
                const target = elementValues[valueIndex]?.keyframes[id];
                if (!target) return;
                let hasChanged = target[key] !== newValue;
                if (hasChanged && Array.isArray(target[key]) && Array.isArray(newValue)) {
                    hasChanged = !shallowCompare(newValue, target[key]);
                }
                if (hasChanged) {
                    elementValues[valueIndex].keyframes[id] = { ...target, [key]: newValue };
                }
            }),
            selectedKeyframes: [{ ...keyframeMeta }],
        });
    };
};

export const editorStore = createStore<EditorStore>()(
    withHistory((set, get) => ({
        animations: {},
        isRecording: true,
        user: { isPro: false },
        scale: 320,
        playbackOrigin: undefined,
        isExportOpen: false,
        clear: () => {
            set({
                selectedAnimationName: undefined,
                animations: {},
                selectedKeyframes: undefined,
            });
            get().stopPlaying();
        },
        startRecording: () => {
            set({ isRecording: true });
            get().clear();
        },
        stopRecording: () => set({ isRecording: false }),
        selectKeyframe: (keyframe) => set({ selectedKeyframes: [{ ...keyframe }] }),
        deselectKeyframes: () => set({ selectedKeyframes: undefined }),
        selectAnimation: (selectedAnimationName) => {
            get().stopPlaying();
            get().deselectKeyframes();
            set({ selectedAnimationName });
        },
        scrubTo: (time) => {
            const { animations, selectedAnimationName } = get();
            if (selectedAnimationName && animations[selectedAnimationName]) {
                set({
                    isRecording: false,
                    animations: produce(animations, (draft) => {
                        if (draft[selectedAnimationName]) draft[selectedAnimationName].currentTime = time;
                    }),
                });
            }
        },
        addAnimations: (animations: RecordedAnimations) => {
            set({
                selectedAnimationName: get().selectedAnimationName ?? Object.keys(animations)[0],
                animations: { ...get().animations, ...animations },
            });
        },
        setScale: (scale) => set({ scale }),
        startPlaying: () => {
            const currentTime = getCurrentTime(get());
            if (currentTime !== undefined) {
                set({
                    isRecording: false,
                    playbackOrigin: {
                        startedAt: performance.now(),
                        originTime: currentTime * 1000,
                    },
                });
            }
        },
        stopPlaying: () => set({ playbackOrigin: undefined }),
        addValue: (elementName, id) => {
            const { animations, selectedAnimationName } = get();
            if (!selectedAnimationName) return;
            set({
                animations: produce(animations, (draft) => {
                    const elementValues = draft[selectedAnimationName]?.elements[elementName];
                    elementValues?.unshift({
                        id,
                        valueName: "",
                        animationName: selectedAnimationName,
                        elementId: elementName,
                        keyframes: {},
                        options: {},
                        source: "motion-one",
                    });
                }),
            });
        },
        renameValue: (elementName, valueId, name) => {
            const { animations, selectedAnimationName } = get();
            if (!selectedAnimationName) return;
            set({
                animations: produce(animations, (draft) => {
                    const valueAnimation = getValueAnimation(draft, selectedAnimationName, elementName, valueId);
                    if (valueAnimation) valueAnimation.valueName = name;
                }),
            });
        },
        updateKeyframe: makeKeyframeUpdater(get, set, "value"),
        updateKeyframeEasing: makeKeyframeUpdater(get, set, "easing"),
        deleteKeyframe: ({ elementName, valueId, id }) => {
            const { animations, selectedAnimationName } = get();
            if (!selectedAnimationName) return;
            set({
                animations: produce(animations, (draft) => {
                    const valueAnimation = getValueAnimation(draft, selectedAnimationName, elementName, valueId);
                    if (!valueAnimation) return;
                    updateValueAnimation(
                        valueAnimation,
                        getTimestampedKeyframes(valueAnimation).filter((keyframe) => keyframe.id !== id),
                    );
                    delete valueAnimation.keyframes[id];
                }),
                selectedKeyframes: undefined,
            });
        },
        addKeyframe: (elementName, valueId, keyframeId, time) => {
            const { animations, selectedAnimationName } = get();
            if (!selectedAnimationName) return;
            const snapped = snapNumberToNearest(time, 0.05);
            let selectedKeyframeMetadata: KeyframeMetadata | undefined;
            const newState: Partial<EditorStore> = {
                animations: produce(animations, (draft) => {
                    const valueAnimation = getValueAnimation(draft, selectedAnimationName, elementName, valueId);
                    if (!valueAnimation) return;
                    const timestampedKeyframes = getTimestampedKeyframes(valueAnimation);
                    if (isExistingTime(timestampedKeyframes, snapped)) return;
                    let insertionIndex = timestampedKeyframes.findIndex((keyframe) => keyframe.time > snapped);
                    if (insertionIndex === -1) insertionIndex = timestampedKeyframes.length;
                    const nearestKeyframe = timestampedKeyframes[insertionIndex] ?? timestampedKeyframes[insertionIndex - 1];
                    timestampedKeyframes.splice(insertionIndex, 0, {
                        id: keyframeId,
                        value: nearestKeyframe?.value ?? getDefaultValue(valueAnimation.valueName),
                        easing: nearestKeyframe?.easing ?? defaults.easing,
                        offset: 0,
                        time: snapped,
                        isEdited: true,
                        isUserCreated: true,
                    });
                    selectedKeyframeMetadata = {
                        id: keyframeId,
                        elementName,
                        valueId,
                        valueName: valueAnimation.valueName,
                    };
                    updateValueAnimation(valueAnimation, timestampedKeyframes);
                }),
            };
            if (selectedKeyframeMetadata) newState.selectedKeyframes = [selectedKeyframeMetadata];
            set(newState);
        },
        moveKeyframe: (elementName, valueId, keyframeId, time) => {
            const { animations, selectedAnimationName } = get();
            if (!selectedAnimationName) return;
            const snapped = snapNumberToNearest(time, 0.05);
            set({
                animations: produce(animations, (draft) => {
                    const valueAnimation = getValueAnimation(draft, selectedAnimationName, elementName, valueId);
                    if (!valueAnimation) return;
                    const timestampedKeyframes = getTimestampedKeyframes(valueAnimation);
                    if (isExistingTime(timestampedKeyframes, snapped)) return;
                    const timestampedKeyframe = timestampedKeyframes.find((keyframe) => keyframe.id === keyframeId);
                    if (timestampedKeyframe) timestampedKeyframe.time = snapped;
                    timestampedKeyframes.sort(compareKeyframeByTime);
                    updateValueAnimation(valueAnimation, timestampedKeyframes);
                }),
            });
        },
        setIsExportOpen: (isExportOpen) => set({ isExportOpen }),
    })) as never,
);

type Selector<T> = (state: EditorStore) => T;
type EqualityFn<T> = (a: T, b: T) => boolean;

function useEditorState<T>(selector: Selector<T>, equalityFn: EqualityFn<T> = Object.is): T {
    const selectorRef = useRef(selector);
    const equalityRef = useRef(equalityFn);
    selectorRef.current = selector;
    equalityRef.current = equalityFn;

    const [slice, setSlice] = useState(() => selector(editorStore.getState()));

    useEffect(() => {
        let active = true;
        const sync = (state: EditorStore) => {
            if (!active) return;
            const next = selectorRef.current(state);
            setSlice((prev) => (equalityRef.current(prev, next) ? prev : next));
        };
        sync(editorStore.getState());
        const unsubscribe = editorStore.subscribe(sync);
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return slice;
}

useEditorState.getState = () => editorStore.getState();

export { useEditorState };
