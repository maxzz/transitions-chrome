import type { RecordPlugin, ValueAnimationDraft } from "@/shared/types";
import { getEasingPoints, pipeToCamel } from "../runtime/utils";
import { store } from "../store";

const splitTransitions = (transitions: string) => transitions.split(/,\s*(?!\s*\d)/);
const splitTransitionIntoProps = (transition: string) => transition.split(/ (?![^()]*\))/);

function getRecordedAnimationFromTransitionEvent({
    target,
    propertyName,
}: TransitionEvent): ValueAnimationDraft | undefined {
    if (!target) return;
    const element = target as Element;
    const { transition: transitionStyle } = window.getComputedStyle(element);
    const transitions = splitTransitions(transitionStyle);
    let valueTransition: string[] | undefined;

    for (const transitionDefinition of transitions) {
        const props = splitTransitionIntoProps(transitionDefinition);
        if (props[0] === "all") {
            valueTransition = props;
        } else if (props[0] === propertyName) {
            valueTransition = props;
            break;
        }
    }

    if (!valueTransition) return;
    const [, duration, easing, delay] = valueTransition;
    const elementAnimations = element.getAnimations();
    const valueAnimation = elementAnimations.find(
        (animation): animation is CSSTransition =>
            "transitionProperty" in animation && animation.transitionProperty === propertyName,
    );
    if (!valueAnimation) return;

    const keyframes = valueAnimation.effect && "getKeyframes" in valueAnimation.effect
        ? (valueAnimation.effect as KeyframeEffect).getKeyframes()
        : undefined;
    if (!keyframes) return;

    return {
        valueName: propertyName,
        keyframes: keyframes.map((keyframe) => keyframe[pipeToCamel(propertyName) as keyof Keyframe]),
        options: {
            delay: parseFloat(delay ?? "0"),
            duration: parseFloat(duration ?? "0"),
            easing: easing?.startsWith("cubic-bezier") ? getEasingPoints(easing) : easing,
        },
    };
}

function record(event: TransitionEvent) {
    const animation = getRecordedAnimationFromTransitionEvent(event);
    if (!animation) return;
    store
        .getState()
        .recordAnimation(
            event.target as Element,
            animation.valueName,
            animation.keyframes,
            animation.options,
            "css-transition",
        );
}

export const cssTransition: RecordPlugin = {
    id: "css-transition",
    onRecordStart: () => {
        window.addEventListener("transitionrun", record);
    },
    onRecordEnd: () => {
        window.removeEventListener("transitionrun", record);
    },
};
