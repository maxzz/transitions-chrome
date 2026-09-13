import { type AnimationOptions, type AnimationSource } from "@/9-shared/types";
import { convertEasing, getEasingForSegment, getEasingFunction } from "./3-easing";
import { addTransformToElement, getAnimationData, getMotionValue, getStyleName, isCssVar, isTransform, registerCssVariable, stopAnimation, styleAccess, transformCssDefinitions, type AnimationLike } from "./2-style";
import { defaultTransitionOptions, hydrateKeyframes, isEasingGenerator, isEasingList, isNumber, keyframesList, mix, noop, noopReturn, progress, timeConvert, defaultOffset, fillOffset } from "./4-utils";

export { type JSAnimation };

export function animateStyle(element: HTMLElement, key: string, keyframesDefinition: unknown, options: AnimationOptions = {}) {
    const record = getDevToolsRecord();
    const isRecording = options.record !== false && record;
    let animation: AnimationLike | JSAnimation | undefined;
    let {
        duration = defaultTransitionOptions.duration,
        delay = defaultTransitionOptions.delay,
        endDelay = defaultTransitionOptions.endDelay,
        repeat = defaultTransitionOptions.repeat,
        easing = defaultTransitionOptions.easing,
        direction,
        offset,
        allowWebkitAcceleration = false,
    } = options;

    const data = getAnimationData(element);
    let canAnimateNatively = supports.waapi();
    const valueIsTransform = isTransform(key);
    if (valueIsTransform) {
        addTransformToElement(element, key);
    }

    const name = getStyleName(key);
    const motionValue = getMotionValue(data.values, name);
    const definition = transformCssDefinitions.get(name);

    stopAnimation(motionValue.animation, !(isEasingGenerator(easing) && motionValue.generator) && options.record !== false);

    return () => {
        const readInitialValue = () => styleAccess.get(element, name) ?? definition?.initialValue ?? 0;

        let keyframes = hydrateKeyframes(keyframesList(keyframesDefinition), readInitialValue);

        if (isEasingGenerator(easing)) {
            const custom = (easing as EasingGenerator).createAnimation(keyframes, readInitialValue, valueIsTransform, name, motionValue);
            easing = custom.easing;
            if (custom.keyframes !== undefined) keyframes = custom.keyframes;
            if (custom.duration !== undefined) duration = custom.duration;
        }

        if (isCssVar(name)) {
            if (supports.cssRegisterProperty()) {
                registerCssVariable(name);
            } else {
                canAnimateNatively = false;
            }
        }

        if (canAnimateNatively) {
            if (definition) {
                keyframes = keyframes.map((value) => isNumber(value) ? definition.toDefaultUnit(value) : value);
            }
            const needsToReadInitialKeyframe = !supports.partialKeyframes() && keyframes.length === 1;
            if (isRecording || needsToReadInitialKeyframe) {
                keyframes.unshift(readInitialValue());
            }

            const animationOptions: KeyframeAnimationOptions = {
                delay: timeConvert.ms(delay),
                duration: timeConvert.ms(duration),
                endDelay: timeConvert.ms(endDelay),
                easing: !isEasingList(easing) ? (convertEasing(easing) as string) : undefined,
                direction,
                iterations: (typeof repeat === "number" ? repeat : 0) + 1,
                fill: "both",
            };

            const nativeAnimation = element.animate(
                {
                    [name]: keyframes,
                    offset,
                    easing: isEasingList(easing) ? easing.map((value) => convertEasing(value) as string) : undefined,
                } as PropertyIndexedKeyframes,
                animationOptions,
            );
            animation = nativeAnimation;

            if (!nativeAnimation.finished) {
                Object.assign(nativeAnimation, {
                    finished: new Promise((resolve, reject) => {
                        nativeAnimation.onfinish = () => resolve(undefined);
                        nativeAnimation.oncancel = () => reject();
                    }),
                });
            }

            const target = keyframes[keyframes.length - 1];
            animation.finished
                .then(() => {
                    styleAccess.set(element, name, target as string | number);
                    animation?.cancel();
                })
                .catch(noop);

            if (!allowWebkitAcceleration) animation.playbackRate = 1.000001;
        } else if (valueIsTransform && keyframes.every(isNumber)) {
            if (keyframes.length === 1) {
                keyframes.unshift(parseFloat(String(readInitialValue())));
            }
            const render = (latest: number) => {
                const next = definition ? definition.toDefaultUnit(latest) : latest;
                styleAccess.set(element, name, next);
            };
            animation = new JSAnimation(render, keyframes as number[], { ...options, duration, easing });
        } else {
            const target = keyframes[keyframes.length - 1];
            styleAccess.set(element, name, definition && isNumber(target) ? definition.toDefaultUnit(target) : (target as string | number));
        }

        if (isRecording && record) {
            record(element, key, keyframes, { duration, delay, easing, repeat, offset }, "motion-one" satisfies AnimationSource);
        }

        motionValue.setAnimation(animation as AnimationLike);
        return animation;
    };
}

type EasingGenerator<TKeyframe = unknown> = {
    createAnimation: (
        frames: TKeyframe[],
        read: () => unknown,
        isTransformValue: boolean,
        valueName?: string,
        value?: unknown,
    ) => { easing: unknown; keyframes?: TKeyframe[]; duration?: number; };
};

function getDevToolsRecord() {
    return window.__MOTION_DEV_TOOLS_RECORD;
}

//---------------------------------------------------------------------------

class JSAnimation {
    startTime: number | null = null;
    rate = 1;
    t = 0;
    cancelTimestamp: number | null = null;
    playState: AnimationPlayState = "idle";
    pauseTime?: number;
    frameRequestId?: number;
    resolve?: (value: number) => void;
    reject?: (reason?: unknown) => void;
    finished: Promise<number>;
    tick: (timestamp: number) => void;

    constructor(
        output: (latest: number) => void,
        keyframes: number[] = [0, 1],
        {
            easing = defaultTransitionOptions.easing,
            duration = defaultTransitionOptions.duration,
            delay = defaultTransitionOptions.delay,
            endDelay = defaultTransitionOptions.endDelay,
            repeat = defaultTransitionOptions.repeat,
            offset,
            direction = "normal",
        }: AnimationOptions = {},
    ) {
        this.finished = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });

        let nextEasing = easing;
        let nextKeyframes = keyframes;
        let nextDuration = duration;

        if (isEasingGenerator(nextEasing)) {
            const custom = (nextEasing as EasingGenerator<number>).createAnimation(nextKeyframes, () => "0", true);
            nextEasing = custom.easing;
            if (custom.keyframes !== undefined) nextKeyframes = custom.keyframes;
            if (custom.duration !== undefined) nextDuration = custom.duration;
        }

        const totalDuration = nextDuration * ((typeof repeat === "number" ? repeat : 0) + 1);
        const interpolateFn = interpolate(
            nextKeyframes,
            offset,
            isEasingList(nextEasing) ? nextEasing.map(getEasingFunction) : getEasingFunction(nextEasing),
        );

        this.tick = (timestamp: number) => {
            if (this.pauseTime) timestamp = this.pauseTime;
            let current = (timestamp - (this.startTime ?? 0)) * this.rate;
            this.t = current;
            current /= 1000;
            current = Math.max(current - delay, 0);
            if (this.playState === "finished") current = totalDuration;

            const progressValue = current / nextDuration;
            let currentIteration = Math.floor(progressValue);
            let iterationProgress = progressValue % 1.0;
            if (!iterationProgress && progressValue >= 1) iterationProgress = 1;
            if (iterationProgress === 1) currentIteration -= 1;

            const iterationIsOdd = currentIteration % 2;
            if (
                direction === "reverse" ||
                (direction === "alternate" && iterationIsOdd) ||
                (direction === "alternate-reverse" && !iterationIsOdd)
            ) {
                iterationProgress = 1 - iterationProgress;
            }

            const latest = interpolateFn(current >= totalDuration ? 1 : Math.min(iterationProgress, 1));
            output(latest);
            const isAnimationFinished = this.playState === "finished" || current >= totalDuration + endDelay;
            if (isAnimationFinished) {
                this.playState = "finished";
                this.resolve?.(latest);
            } else if (this.playState !== "idle") {
                this.frameRequestId = requestAnimationFrame(this.tick);
            }
        };

        this.play();
    }

    play() {
        const now = performance.now();
        this.playState = "running";
        if (this.pauseTime) {
            this.startTime = now - (this.pauseTime - (this.startTime ?? 0));
        } else if (!this.startTime) {
            this.startTime = now;
        }
        this.cancelTimestamp = this.startTime;
        this.pauseTime = undefined;
        requestAnimationFrame(this.tick);
    }

    pause() {
        this.playState = "paused";
        this.pauseTime = performance.now();
    }

    finish() {
        this.playState = "finished";
        this.tick(0);
    }

    stop() {
        this.playState = "idle";
        if (this.frameRequestId !== undefined) cancelAnimationFrame(this.frameRequestId);
        this.reject?.(false);
    }

    cancel() {
        this.stop();
        this.tick(this.cancelTimestamp ?? 0);
    }

    reverse() {
        this.rate *= -1;
    }

    commitStyles() { }

    get currentTime() {
        return this.t;
    }

    set currentTime(t: number) {
        if (this.pauseTime || this.rate === 0) {
            this.pauseTime = t;
        } else {
            this.startTime = performance.now() - t / this.rate;
        }
    }

    get playbackRate() {
        return this.rate;
    }

    set playbackRate(rate: number) {
        this.rate = rate;
    }
}

//---------------------------------------------------------------------------

function interpolate(output: number[], input = defaultOffset(output.length), easing: unknown = noopReturn) {
    const length = output.length;
    const remainder = length - input.length;
    if (remainder > 0) fillOffset(input, remainder);

    return (t: number) => {
        let i = 0;
        for (; i < length - 2; i += 1) {
            if (t < (input[i + 1] ?? 1)) {
                break;
            }
        }
        let progressInRange = clampProgress(progress(input[i] ?? 0, input[i + 1] ?? 1, t));
        const segmentEasing = getEasingForSegment(easing, i);
        progressInRange = getEasingFunction(segmentEasing)(progressInRange);
        return mix(output[i] ?? 0, output[i + 1] ?? 1, progressInRange);
    };
}

const clampProgress = (p: number) => Math.min(1, Math.max(p, 0));

const featureTests = {
    cssRegisterProperty: () => typeof CSS !== "undefined" && Object.hasOwn(CSS, "registerProperty"),
    waapi: () => Object.hasOwn(Element.prototype, "animate"),
    partialKeyframes: () => {
        try {
            testAnimation({ opacity: [1] });
        } catch {
            return false;
        }
        return true;
    },
    finished: () => Boolean(testAnimation({ opacity: [0, 1] }).finished),
};

function testAnimation(keyframes: PropertyIndexedKeyframes) {
    return document.createElement("div").animate(keyframes, { duration: 0.001 });
}

const results: Record<string, boolean> = {};
const supports: Record<keyof typeof featureTests, () => boolean> = {
    cssRegisterProperty: () => {
        results.cssRegisterProperty ??= featureTests.cssRegisterProperty();
        return results.cssRegisterProperty;
    },
    waapi: () => {
        results.waapi ??= featureTests.waapi();
        return results.waapi;
    },
    partialKeyframes: () => {
        results.partialKeyframes ??= featureTests.partialKeyframes();
        return results.partialKeyframes;
    },
    finished: () => {
        results.finished ??= featureTests.finished();
        return results.finished;
    },
};
