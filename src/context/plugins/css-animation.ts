import type { RecordPlugin, ValueAnimationDraft } from "@/shared/types";
import { store } from "../store";
import { time } from "../runtime/utils";

function getAnimationsFromAnimationEvent({
  target,
  animationName,
}: AnimationEvent): ValueAnimationDraft[] | undefined {
  if (!target) return;
  const element = target as Element;
  const elementAnimations = element.getAnimations();
  const cssAnimation = elementAnimations.find(
    (animation): animation is CSSAnimation =>
      "animationName" in animation && animation.animationName === animationName,
  );
  if (!cssAnimation?.effect || !("getComputedTiming" in cssAnimation.effect)) return;

  const animationTiming = (cssAnimation.effect as KeyframeEffect).getComputedTiming();
  const duration = time.s(Number(animationTiming.duration) || 0);
  const iterations = animationTiming.iterations;
  const repeat = iterations === Infinity ? "Infinity" : Math.max(0, (iterations ?? 1) - 1);
  const animationKeyframes = (cssAnimation.effect as KeyframeEffect).getKeyframes();
  const valueAnimations: Record<string, ValueAnimationDraft> = {};

  for (const keyframe of animationKeyframes) {
    const { composite: _composite, computedOffset: _computedOffset, easing, offset, ...values } =
      keyframe;
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
        options.easing.push(easing);
      }
      options.offset?.push(offset ?? 0);
      keyframes.push(values[valueName as keyof typeof values]);
    }
  }

  return Object.values(valueAnimations);
}

function record(event: AnimationEvent) {
  const animations = getAnimationsFromAnimationEvent(event);
  if (!animations) return;
  animations.forEach(({ valueName, keyframes, options }) => {
    store.getState().recordAnimation(event.target as Element, valueName, keyframes, options, "css-animation");
  });
}

export const cssAnimation: RecordPlugin = {
  id: "css-animation",
  onRecordStart: () => {
    window.addEventListener("animationstart", record);
  },
  onRecordEnd: () => {
    window.removeEventListener("animationstart", record);
  },
};
