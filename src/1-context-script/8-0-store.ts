import { v4 as uuid } from "uuid";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import type {
    AnimationMetadata,
    AnimationOptions,
    AnimationSource,
    RecordedAnimations,
} from "@/9-shared/types";
import { getElementId } from "./8-1-element-id";
import { defaultOffset, defaults, fillOffset, isEasingGenerator, isEasingList } from "./runtime/utils";

export interface ClientState {
    inspectedAnimation: AnimationMetadata | undefined;
    isRecording: boolean;
    recordedAnimationCount: number;
    recordedAnimations: RecordedAnimations | undefined;
    startRecording: () => void;
    stopRecording: () => void;
    flushRecordedAnimations: () => void;
    inspectAnimation: (inspectedAnimation: AnimationMetadata) => void;
    scrubTo: (currentTime: number) => void;
    recordAnimation: (
        element: Element,
        valueName: string,
        keyframes: unknown[],
        options: AnimationOptions,
        source: AnimationSource,
    ) => void;
}

const createAnimationMetadata = (): AnimationMetadata => ({
    elements: {},
    currentTime: 0,
});

function getKeyframeEasing(easing: unknown, index: number) {
    if (!easing || !index || isEasingGenerator(easing)) return defaults.easing;
    const easingDefinition = isEasingList(easing) ? easing[index - 1] : easing;
    return Array.isArray(easingDefinition) ? [...easingDefinition] : easingDefinition;
}

export const store = createStore(
    subscribeWithSelector<ClientState>((set, get) => ({
        inspectedAnimation: undefined,
        isRecording: true,
        recordedAnimationCount: 0,
        recordedAnimations: undefined,
        startRecording: () => {
            set({
                isRecording: true,
                recordedAnimations: undefined,
                recordedAnimationCount: 1,
                inspectedAnimation: undefined,
            });
        },
        stopRecording: () => set({ isRecording: false }),
        flushRecordedAnimations: () => {
            set({
                recordedAnimations: undefined,
                recordedAnimationCount: get().recordedAnimationCount + 1,
            });
        },
        inspectAnimation: (inspectedAnimation) => set({ inspectedAnimation }),
        scrubTo: (currentTime) => {
            const existingAnimation = get().inspectedAnimation;
            if (existingAnimation) {
                set({ inspectedAnimation: { ...existingAnimation, currentTime } });
            }
        },
        recordAnimation: (element, valueName, keyframes, options, source) => {
            const { isRecording, recordedAnimationCount, recordedAnimations = {} } = get();
            if (!isRecording) return;

            if (options.repeat === Infinity) {
                options.repeat = "Infinity";
            }

            const animationName = `Animation ${recordedAnimationCount}`;
            const elementId = getElementId(element);
            const newRecordedAnimations = { ...recordedAnimations };
            newRecordedAnimations[animationName] = {
                ...(newRecordedAnimations[animationName] ?? createAnimationMetadata()),
            };
            newRecordedAnimations[animationName].elements[elementId] = [
                ...(newRecordedAnimations[animationName].elements[elementId] ?? []),
            ];

            const offsets = [...(options.offset ?? defaultOffset(keyframes.length))];
            const remainder = keyframes.length - offsets.length;
            if (remainder > 0) fillOffset(offsets, remainder);

            newRecordedAnimations[animationName].elements[elementId].push({
                id: uuid(),
                elementId,
                animationName,
                valueName,
                keyframes: keyframes.reduce<Record<string, {
                    id: string;
                    value: unknown;
                    easing: unknown;
                    offset: number;
                    isEdited: boolean;
                }>>((acc, keyframe, index) => {
                    const id = uuid();
                    acc[id] = {
                        id,
                        value: keyframe,
                        easing: getKeyframeEasing(options.easing, index),
                        offset: offsets[index] ?? 0,
                        isEdited: false,
                    };
                    return acc;
                }, {}),
                options,
                source,
            });

            set({ recordedAnimations: newRecordedAnimations });
        },
    })),
);
