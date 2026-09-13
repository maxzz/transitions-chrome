import type { RecordPlugin, ValueAnimationDraft } from "@/9-shared/types";
import { store } from "../8-0-store";
import { getEasingPoints, timeConvert } from "../runtime/4-utils";
import { markAnimationRecorded } from "./2-utils-recorded-animations";

export const cssAnimation: RecordPlugin = {
    id: "css-animation",
    onRecordStart: () => {
        window.addEventListener("animationstart", record, true);
    },
    onRecordEnd: () => {
        window.removeEventListener("animationstart", record, true);
    },
};

function record(event: AnimationEvent) {
    const run = () => {
        const animation = getAnimationFromEvent(event);
        if (!animation || !event.target) return false;

        markAnimationRecorded(animation);
        return recordCssAnimation(animation, event.target as Element);
    };
    if (!run()) requestAnimationFrame(run);
}

//---------------------------------------------------------------------------

export function recordCssAnimation(cssAnimation: CSSAnimation, target: Element): boolean {
    if (!cssAnimation.effect || !("getComputedTiming" in cssAnimation.effect)) {
        return false;
    }

    const animationTiming = (cssAnimation.effect as KeyframeEffect).getComputedTiming();
    const duration = timeConvert.s(Number(animationTiming.duration) || 0);
    const iterations = animationTiming.iterations;
    const repeat = iterations === Infinity ? "Infinity" : Math.max(0, (iterations ?? 1) - 1);
    const animationKeyframes = (cssAnimation.effect as KeyframeEffect).getKeyframes();
    const valueAnimations: Record<string, ValueAnimationDraft> = {};

    for (const keyframe of animationKeyframes) {
        const { composite: _composite, computedOffset: _computedOffset, easing, offset, ...values } = keyframe;
        for (const valueName in values) {
            if (!valueAnimations[valueName]) {
                valueAnimations[valueName] = {
                    valueName,
                    keyframes: [],
                    options: {
                        duration,
                        repeat,
                        easing: [],
                        offset: [],
                    },
                };
            }
            const { keyframes, options } = valueAnimations[valueName];
            if (keyframes.length && Array.isArray(options.easing)) {
                options.easing.push(recordKeyframeEasing(easing));
            }
            options.offset?.push(offset ?? 0);
            keyframes.push(values[valueName as keyof typeof values]);
        }
    }

    const drafts = Object.values(valueAnimations);
    if (!drafts.length) {
        return false;
    }

    drafts.forEach(({ valueName, keyframes, options }) => {
        store.getState().recordAnimation(target, valueName, keyframes, options, "css-animation");
    });
    return true;
}

function recordKeyframeEasing(easing: string | undefined) {
    if (!easing) {
        return easing;
    }
    return easing.startsWith("cubic-bezier") ? getEasingPoints(easing) : easing;
}

function getAnimationFromEvent({ target, animationName }: AnimationEvent): CSSAnimation | undefined {
    if (!target) {
        return;
    }
    return (target as Element).getAnimations().find(
        (animation): animation is CSSAnimation => "animationName" in animation && animation.animationName === animationName,
    );
}
