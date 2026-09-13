import type { AnimationMetadata } from "@/9-shared/9-types-shared";
import { animateStyle } from "../runtime/1-animate-style";
import { pipeToCamel, sortKeyframesByOffset } from "../runtime/4-utils";
import { transformNames } from "../runtime/2-style";
import { store } from "../8-0-store";

type ScrubbableAnimation = {
    currentTime: CSSNumberish | number | null;
    pause: () => void;
    cancel: () => void;
};

export function handleInspectedAnimation() {
    const animations: ScrubbableAnimation[] = [];

    function scrubTo(timeValue: number) {
        for (const animation of animations) {
            animation.currentTime = timeValue * 1000;
        }
    }

    function cancelAllAnimations() {
        for (const animation of animations) animation.cancel();
        animations.length = 0;
    }

    function createAnimations(animation: AnimationMetadata) {
        cancelAllAnimations();
        for (const elementId in animation.elements) {
            const element = document.querySelector(`[data-motion-id="${elementId}"]`);
            if (!element) continue;

            for (const valueAnimation of animation.elements[elementId] ?? []) {
                const { valueName, keyframes: editedKeyframes, options } = valueAnimation;
                const offset: number[] = [];
                const easing: unknown[] = [];
                let keyframes: unknown[] = [];
                const orderedKeyframes = sortKeyframesByOffset(editedKeyframes);

                orderedKeyframes.forEach((keyframe, index) => {
                    keyframes.push(keyframe.value);
                    offset.push(keyframe.offset);
                    if (index && keyframe.easing) easing.push(keyframe.easing);
                });

                if (transformNames.has(valueName)) {
                    keyframes = keyframes.map((value) =>
                        typeof value === "string" ? parseFloat(value) : value,
                    );
                }

                const newAnimation = animateStyle(element as HTMLElement, pipeToCamel(valueName), keyframes, {
                    ...options,
                    easing,
                    offset,
                    repeat: options.repeat === "Infinity" ? Infinity : options.repeat,
                    record: false,
                })();

                newAnimation?.pause();
                if (newAnimation) animations.push(newAnimation);
            }
        }
        scrubTo(animation.currentTime);
    }

    store.subscribe(
        (state) => state.inspectedAnimation,
        (inspectedAnimation, prevInspectedAnimation) => {
            cancelAllAnimations();
            if (prevInspectedAnimation && inspectedAnimation) {
                createAnimations(inspectedAnimation);
            }
        },
    );

    store.subscribe(
        (state) => state.inspectedAnimation?.currentTime,
        (currentTime) => {
            if (currentTime === undefined) return;
            scrubTo(currentTime);
        },
    );

    store.subscribe(
        (state) => state.isRecording,
        (isRecording) => {
            if (isRecording) cancelAllAnimations();
        },
    );
}
