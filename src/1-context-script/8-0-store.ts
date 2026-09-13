import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { type AnimationMetadata, type AnimationOptions, type AnimationSource, type KeyframeData, type RecordedAnimations } from "@/9-shared/types";
import { defaultOffset, defaultTransitionOptions, fillOffset, isEasingGenerator, isEasingList } from "./runtime/4-utils";

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
    recordAnimation: (element: Element, valueName: string, keyframes: unknown[], options: AnimationOptions, source: AnimationSource) => void;
}

export const store = createStore(
    subscribeWithSelector<ClientState>(
        (set, get) => ({
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
                if (!isRecording) {
                    return;
                }

                if (options.repeat === Infinity) {
                    options.repeat = "Infinity";
                }

                const animationName = `Animation ${recordedAnimationCount}`;
                const elementId = getElementId(element);
                const newRecordedAnimations = { ...recordedAnimations };
                newRecordedAnimations[animationName] = { ...(newRecordedAnimations[animationName] ?? createAnimationMetadata()) };
                newRecordedAnimations[animationName].elements[elementId] = [...(newRecordedAnimations[animationName].elements[elementId] ?? [])];

                const offsets = [...(options.offset ?? defaultOffset(keyframes.length))];
                const remainder = keyframes.length - offsets.length;
                if (remainder > 0) {
                    fillOffset(offsets, remainder);
                }

                newRecordedAnimations[animationName].elements[elementId].push({
                    id: uuid(),
                    elementId,
                    animationName,
                    valueName,
                    keyframes: keyframes.reduce<Record<string, Omit<KeyframeData, "isUserCreated">>>(
                        (acc, keyframe, index) => {
                            const id = uuid();
                            acc[id] = {
                                id,
                                value: keyframe,
                                easing: getKeyframeEasing(options.easing, index),
                                offset: offsets[index] ?? 0,
                                isEdited: false,
                            };
                            return acc;
                        }, {}
                    ),
                    options,
                    source,
                });

                set({ recordedAnimations: newRecordedAnimations });
            },
        })
    ),
);

function createAnimationMetadata(): AnimationMetadata {
    return ({
        elements: {},
        currentTime: 0,
    });
}

function getKeyframeEasing(easing: unknown, index: number) {
    if (!easing || !index || isEasingGenerator(easing)) {
        return defaultTransitionOptions.easing;
    }
    const easingDefinition = isEasingList(easing) ? easing[index - 1] : easing;
    return Array.isArray(easingDefinition) ? [...easingDefinition] : easingDefinition;
}

//---------------------------------------------------------------------------
// Stable data-motion-id on recorded elements

function getElementId(element: Element) {
    const htmlElement = element as HTMLElement;
    let motionId = htmlElement.dataset.motionId;
    if (!motionId) {
        htmlElement.dataset.motionId = motionId = generateElementId(htmlElement);
    }
    return motionId;
}

let counter = 0;

function generateElementId(element: HTMLElement) {
    if (element.id) return `#${element.id}`;
    counter += 1;
    return `${element.tagName.toLowerCase()} ${counter}`;
}
