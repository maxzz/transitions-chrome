import type { RecordPlugin, ValueAnimationDraft } from "@/9-shared/9-types-shared";
import { getEasingPoints, pipeToCamel } from "../runtime/4-utils";
import { store } from "../8-0-store";
import { markAnimationRecorded } from "./2-utils-recorded-animations";

export const cssTransition: RecordPlugin = {
    id: "css-transition",
    onRecordStart: () => {
        window.addEventListener("transitionrun", record, true);
        window.addEventListener("transitionstart", record, true);
    },
    onRecordEnd: () => {
        window.removeEventListener("transitionrun", record, true);
        window.removeEventListener("transitionstart", record, true);
    },
};

function record(event: TransitionEvent) {
    const run = () => {
        if (!event.target) return false;

        const element = event.target as Element;
        const valueAnimation = element.getAnimations().find(
            (animation): animation is CSSTransition => "transitionProperty" in animation && animation.transitionProperty === event.propertyName,
        );
        if (!valueAnimation) return false;

        markAnimationRecorded(valueAnimation);
        return recordCssTransition(valueAnimation, element, event.propertyName);
    };

    if (!run()) {
        requestAnimationFrame(run);
    }
}

//---------------------------------------------------------------------------

export function recordCssTransition(valueAnimation: CSSTransition, target: Element, propertyName: string): boolean {

    const keyframes = valueAnimation.effect && "getKeyframes" in valueAnimation.effect
        ? (valueAnimation.effect as KeyframeEffect).getKeyframes()
        : undefined;
    if (!keyframes?.length) return false;

    const timing = getTransitionTiming(target, propertyName);
    const draft: ValueAnimationDraft = {
        valueName: propertyName,
        keyframes: keyframes.map((keyframe) => keyframe[pipeToCamel(propertyName) as keyof Keyframe]),
        options: timing,
    };
    store.getState().recordAnimation(target, draft.valueName, draft.keyframes, draft.options, "css-transition");
    return true;
}

function getTransitionTiming(element: Element, propertyName: string) {
    const { transition: transitionStyle } = window.getComputedStyle(element);
    const transitions = splitTransitions(transitionStyle);
    let valueTransition: string[] | undefined;

    for (const transitionDefinition of transitions) {
        const props = splitTransitionIntoProps(transitionDefinition);
        if (props[0] === "all") {
            valueTransition = props;
        }
        else if (props[0] === propertyName) {
            valueTransition = props;
            break;
        }
    }

    const [, duration, easing, delay] = valueTransition ?? [];
    return {
        delay: parseCssTime(delay),
        duration: parseCssTime(duration),
        easing: easing?.startsWith("cubic-bezier") ? getEasingPoints(easing) : easing,
    };
}

const splitTransitions = (transitions: string) => transitions.split(/,\s*(?!\s*\d)/);
const splitTransitionIntoProps = (transition: string) => transition.split(/ (?![^()]*\))/);

function parseCssTime(value?: string) {
    if (!value) return 0;
    const amount = parseFloat(value);
    if (Number.isNaN(amount)) return 0;
    return value.trim().endsWith("ms") ? amount / 1000 : amount;
}
