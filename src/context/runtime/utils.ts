export const defaults = {
  duration: 0.3,
  delay: 0,
  endDelay: 0,
  repeat: 0,
  easing: "ease",
};

export const isNumber = (value: unknown): value is number => typeof value === "number";

export const isEasingGenerator = (
  easing: unknown,
): easing is { createAnimation: (...args: never[]) => unknown } =>
  typeof easing === "object" && Boolean(easing && "createAnimation" in easing);

export const isCubicBezier = (easing: unknown): easing is number[] =>
  Array.isArray(easing) && isNumber(easing[0]);

export const isEasingList = (easing: unknown): easing is unknown[] =>
  Array.isArray(easing) && !isNumber(easing[0]);

export const mix = (min: number, max: number, progressValue: number) =>
  -progressValue * min + progressValue * max + min;

export const noop = () => {};
export const noopReturn = <T>(value: T) => value;

export const progress = (min: number, max: number, value: number) =>
  max - min === 0 ? 1 : (value - min) / (max - min);

export function fillOffset(offset: number[], remaining: number) {
  const min = offset[offset.length - 1] ?? 0;
  for (let i = 1; i <= remaining; i += 1) {
    const offsetProgress = progress(0, remaining, i);
    offset.push(mix(min, 1, offsetProgress));
  }
}

export function defaultOffset(length: number) {
  const offset = [0];
  fillOffset(offset, length - 1);
  return offset;
}

export const time = {
  ms: (seconds: number) => seconds * 1000,
  s: (milliseconds: number) => milliseconds / 1000,
};

export const wrap = (min: number, max: number, value: number) => {
  const rangeSize = max - min;
  return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export const clamp = (min: number, max: number, value: number) =>
  Math.min(Math.max(value, min), max);

export function addUniqueItem<T>(array: T[], item: T) {
  if (array.indexOf(item) === -1) array.push(item);
}

export function hydrateKeyframes<T>(keyframes: T[], readInitialValue: () => T) {
  for (let i = 0; i < keyframes.length; i += 1) {
    if (keyframes[i] === null) {
      keyframes[i] = i ? (keyframes[i - 1] as T) : readInitialValue();
    }
  }
  return keyframes;
}

export const keyframesList = <T>(keyframes: T | T[]) =>
  Array.isArray(keyframes) ? keyframes : [keyframes];

export const pipeToCamel = (str: string) =>
  str.replace(/-([a-z])/g, (match) => match[1].toUpperCase());

export const getEasingPoints = (easing: string) =>
  easing.replace("cubic-bezier(", "").replace(")", "").split(",").map(parseFloat);

export function compareKeyframeByOffset(
  a: { offset: number },
  b: { offset: number },
) {
  return a.offset > b.offset ? 1 : -1;
}

export function sortKeyframesByOffset<T extends { offset: number }>(
  keyframes: Record<string, T>,
) {
  return Object.values(keyframes).sort(compareKeyframeByOffset);
}
