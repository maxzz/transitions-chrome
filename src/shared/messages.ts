import type { AnimationMetadata, RecordedAnimations } from "./types";

export type ClientReadyMessage = {
    type: "clientready";
};

export type TabIdMessage = {
    type: "tabId";
    tabId: number;
};

export type IsRecordingMessage = {
    type: "isrecording";
    tabId: number;
    isRecording: boolean;
};

export type AnimationStartMessage = {
    type: "animationstart";
    animations: RecordedAnimations;
};

export type InspectAnimationMessage = {
    type: "inspectanimation";
    tabId: number;
    animation: AnimationMetadata;
};

export type ScrubAnimationMessage = {
    type: "scrubanimation";
    tabId: number;
    time: number;
};

export type ClearMessage = {
    type: "clear";
};

export type InitMessage = {
    type: "init";
    tabId: number;
};

export type PageToBackgroundMessage = ClientReadyMessage | AnimationStartMessage;

export type BackgroundToPageMessage =
    | TabIdMessage
    | IsRecordingMessage
    | InspectAnimationMessage
    | ScrubAnimationMessage;

export type DevToolsToBackgroundMessage =
    | InitMessage
    | IsRecordingMessage
    | InspectAnimationMessage
    | ScrubAnimationMessage;

export type ClientToDevToolsMessage = AnimationStartMessage | ClearMessage;

export type ExtensionMessage =
    | PageToBackgroundMessage
    | BackgroundToPageMessage
    | DevToolsToBackgroundMessage
    | ClientToDevToolsMessage;

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
    return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        typeof (value as { type: unknown; }).type === "string"
    );
}
