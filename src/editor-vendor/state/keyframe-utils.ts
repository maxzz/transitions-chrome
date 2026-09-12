import type { KeyframeData, RecordedAnimations, TimestampedKeyframe, ValueAnimationRecord } from "../types";
import { omitKeys } from "../utils/omit-keys";

export const defaults = {
    duration: 0.3,
    delay: 0,
    endDelay: 0,
    repeat: 0,
    easing: "ease",
};

type BezierHandles = [number, number, number, number];

const namedBezierHandles: Record<string, BezierHandles> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
};

/** Convert a recorded CSS / WAAPI easing into Leva bezier handles, or undefined for freeform. */
export function toBezierHandles(easing: unknown): BezierHandles | undefined {
    if (Array.isArray(easing) && easing.length >= 4 && easing.slice(0, 4).every((value) => typeof value === "number" && !Number.isNaN(value))) {
        return [Number(easing[0]), Number(easing[1]), Number(easing[2]), Number(easing[3])];
    }
    if (typeof easing !== "string") return undefined;
    const named = namedBezierHandles[easing];
    if (named) return [named[0], named[1], named[2], named[3]];
    const cubic = easing.match(/^cubic-bezier\(\s*([^)]+)\s*\)$/i);
    if (!cubic) return undefined;
    const points = cubic[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (points.length !== 4 || points.some((value) => Number.isNaN(value))) return undefined;
    return [points[0], points[1], points[2], points[3]];
}

export function compareKeyframeByOffset(a: { offset: number; }, b: { offset: number; }) {
    return a.offset > b.offset ? 1 : -1;
}

export function compareKeyframeByTime(a: { time: number; }, b: { time: number; }) {
    return a.time > b.time ? 1 : -1;
}

export function sortKeyframesByOffset(keyframes: Record<string, KeyframeData>) {
    return Object.values(keyframes).sort(compareKeyframeByOffset);
}

export const camelToPipe = (str: string) => str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
export const pipeToCamel = (str: string) => str.replace(/-([a-z])/g, (match) => match[1].toUpperCase());

const scale = { defaultValue: "1" };
const opacity = { defaultValue: "1" };
const color = { defaultValue: "#000" };
const valueTypes: Record<string, { defaultValue: string; }> = {
    scale,
    scaleX: scale,
    scaleY: scale,
    opacity,
    transform: { defaultValue: "none" },
    color,
    backgroundColor: color,
};

export function getDefaultValue(name: string) {
    const key = pipeToCamel(name);
    return valueTypes[key]?.defaultValue ?? "";
}

export function snapNumberToNearest(value: number, interval: number) {
    return Math.round(value / interval) * interval;
}

export function defaultOffset(length: number) {
    if (length <= 1) return [0];
    const offset = [0];
    const remaining = length - 1;
    for (let i = 1; i <= remaining; i += 1) {
        offset.push(i / remaining);
    }
    return offset;
}

export function getValueAnimation(
    animations: RecordedAnimations,
    animationName: string,
    elementName: string,
    valueId: string,
) {
    return animations[animationName]?.elements[elementName]?.find((value) => value.id === valueId);
}

export function getTimestampedKeyframes(valueAnimation: ValueAnimationRecord): TimestampedKeyframe[] {
    const orderedKeyframes = sortKeyframesByOffset(valueAnimation.keyframes);
    const { delay = 0, duration = defaults.duration } = valueAnimation.options;
    return orderedKeyframes.map((keyframe) => ({
        ...keyframe,
        time: delay + (duration ?? defaults.duration) * keyframe.offset,
    }));
}

export function updateValueAnimation(
    valueAnimation: ValueAnimationRecord,
    timestampedKeyframes: TimestampedKeyframe[],
) {
    const firstKeyframeTime = timestampedKeyframes[0]?.time ?? 0;
    const lastKeyframeTime = timestampedKeyframes[timestampedKeyframes.length - 1]?.time ?? firstKeyframeTime;
    const newDelay = firstKeyframeTime;
    const newDuration = lastKeyframeTime - firstKeyframeTime;
    valueAnimation.options.delay = newDelay;
    valueAnimation.options.duration = newDuration;
    for (const timestamped of timestampedKeyframes) {
        const keyframe = omitKeys(timestamped, ["time"]);
        const offset = (timestamped.time - newDelay) / newDuration;
        valueAnimation.keyframes[keyframe.id] = {
            ...keyframe,
            offset: Number.isNaN(offset) || offset === Infinity ? 0 : offset,
        };
    }
}

export function isNearlyEqual(a: number, b: number) {
    return Math.abs(a - b) < 0.0001;
}

export function isExistingTime(keyframes: TimestampedKeyframe[], time: number) {
    return keyframes.find((keyframe) => isNearlyEqual(keyframe.time, time));
}

export function shallowCompare(next: unknown[], prev: unknown) {
    if (!Array.isArray(prev)) return false;
    if (prev.length !== next.length) return false;
    return prev.every((value, index) => value === next[index]);
}
