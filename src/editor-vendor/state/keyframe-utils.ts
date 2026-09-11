import type { KeyframeData, RecordedAnimations, TimestampedKeyframe, ValueAnimationRecord } from "../types";
import { omitKeys } from "../lib/omit-keys";

export const defaults = {
    duration: 0.3,
    delay: 0,
    endDelay: 0,
    repeat: 0,
    easing: "ease",
};

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
