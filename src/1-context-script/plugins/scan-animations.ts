import { store } from "../8-0-store";
import { recordCssAnimation } from "./css-animation";
import { recordCssTransition } from "./css-transition";
import { isAnimationRecorded, markAnimationRecorded } from "./recorded-animations";

function isCssAnimation(animation: Animation): animation is CSSAnimation {
    return "animationName" in animation && typeof (animation as CSSAnimation).animationName === "string";
}

function isCssTransition(animation: Animation): animation is CSSTransition {
    return "transitionProperty" in animation && typeof (animation as CSSTransition).transitionProperty === "string";
}

export function scanDocumentAnimations() {
    if (!store.getState().isRecording) return;
    if (typeof document.getAnimations !== "function") return;

    for (const animation of document.getAnimations()) {
        if (isAnimationRecorded(animation)) continue;
        const effect = animation.effect;
        if (!effect || !("target" in effect) || !effect.target) continue;
        const target = effect.target;
        if (!(target instanceof Element)) continue;

        if (isCssAnimation(animation)) {
            if (recordCssAnimation(animation, target)) markAnimationRecorded(animation);
            continue;
        }
        if (isCssTransition(animation)) {
            if (recordCssTransition(animation, target, animation.transitionProperty)) {
                markAnimationRecorded(animation);
            }
        }
    }
}

export function startAnimationScan() {
    const run = () => scanDocumentAnimations();
    run();
    requestAnimationFrame(run);
    document.addEventListener("DOMContentLoaded", run, { once: true });
    window.addEventListener("load", run, { once: true });
    setTimeout(run, 0);
    setTimeout(run, 50);
    setTimeout(run, 250);
}
