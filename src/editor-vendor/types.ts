import type { AnimationMetadata, AnimationSource, KeyframeData, RecordedAnimations, ValueAnimationRecord } from "@/shared/types";

export type { AnimationMetadata, AnimationSource, KeyframeData, RecordedAnimations, ValueAnimationRecord };

export interface TimestampedKeyframe extends KeyframeData {
  time: number;
  isUserCreated?: boolean;
}

export interface KeyframeMetadata {
  id: string;
  elementName: string;
  valueId: string;
  valueName: string;
}

export interface PlaybackOrigin {
  startedAt: number;
  originTime: number;
}

export interface EditorUser {
  isPro: boolean;
}

export interface DragOrigin {
  pointerX: number;
  time: number;
  keyframeId?: string;
}

export interface EditorStore {
  animations: RecordedAnimations;
  selectedAnimationName?: string;
  selectedKeyframes?: KeyframeMetadata[];
  isRecording: boolean;
  isExportOpen: boolean;
  user: EditorUser;
  scale: number;
  playbackOrigin?: PlaybackOrigin;
  undo?: () => void;
  redo?: () => void;
  enableHistory?: (enabled: boolean) => void;
  clear: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  selectKeyframe: (keyframe: KeyframeMetadata) => void;
  deselectKeyframes: () => void;
  selectAnimation: (name: string) => void;
  scrubTo: (time: number) => void;
  addAnimations: (animations: RecordedAnimations) => void;
  setScale: (scale: number) => void;
  startPlaying: () => void;
  stopPlaying: () => void;
  addValue: (elementName: string, id: string) => void;
  renameValue: (elementName: string, valueId: string, name: string) => void;
  updateKeyframe: (keyframe: KeyframeMetadata, newValue: unknown) => void;
  updateKeyframeEasing: (keyframe: KeyframeMetadata, newValue: unknown) => void;
  deleteKeyframe: (keyframe: KeyframeMetadata) => void;
  addKeyframe: (elementName: string, valueId: string, keyframeId: string, time: number) => void;
  moveKeyframe: (elementName: string, valueId: string, keyframeId: string, time: number) => void;
  setIsExportOpen: (isExportOpen: boolean) => void;
}
