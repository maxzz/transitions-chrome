export type AnimationSource = "css-animation" | "css-transition" | "motion-one";

export type EasingValue = string | number[];

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  endDelay?: number;
  repeat?: number | "Infinity";
  easing?: unknown;
  offset?: number[];
  direction?: PlaybackDirection;
  record?: boolean;
  allowWebkitAcceleration?: boolean;
  name?: string;
}

export interface KeyframeData {
  id: string;
  value: unknown;
  easing: unknown;
  offset: number;
  isEdited: boolean;
  isUserCreated?: boolean;
}

export interface ValueAnimationRecord {
  id: string;
  elementId: string;
  animationName: string;
  valueName: string;
  keyframes: Record<string, KeyframeData>;
  options: AnimationOptions;
  source: AnimationSource;
}

export interface AnimationMetadata {
  elements: Record<string, ValueAnimationRecord[]>;
  currentTime: number;
}

export type RecordedAnimations = Record<string, AnimationMetadata>;

export type RecordAnimationFn = (
  element: Element,
  valueName: string,
  keyframes: unknown[],
  options: AnimationOptions,
  source: AnimationSource,
) => void;

export interface RecordPlugin {
  id: string;
  onRecordStart: () => void;
  onRecordEnd: () => void;
}

export interface ValueAnimationDraft {
  valueName: string;
  keyframes: unknown[];
  options: AnimationOptions;
}

declare global {
  interface Window {
    __MOTION_BRIDGE_HAS_LOADED?: boolean;
    __MOTION_DEV_TOOLS?: boolean;
    __MOTION_DEV_TOOLS_RECORD?: RecordAnimationFn;
  }
}

export {};
