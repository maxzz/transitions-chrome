import { useEffect, useRef, useState } from "react";
import type { ExtensionMessage } from "@/shared/messages";
import {
    getAddAnimations,
    getClear,
    getIsRecording,
    getSelectedAnimation,
    getSelectedAnimationName,
    useEditorState,
} from "../state/store";

function useEditAnimation(port?: chrome.runtime.Port) {
    const selectedAnimationName = useEditorState(getSelectedAnimationName);
    const selectedAnimation = useEditorState(getSelectedAnimation);
    const time = selectedAnimation?.currentTime;
    const prevSelectedAnimation = useRef(selectedAnimation);

    useEffect(() => {
        if (!port) return;
        let message: ExtensionMessage | undefined;
        if (selectedAnimationName && selectedAnimation && prevSelectedAnimation.current !== selectedAnimation) {
            message = {
                type: "inspectanimation",
                animation: selectedAnimation,
                tabId: chrome.devtools.inspectedWindow.tabId,
            };
        } else if (time !== undefined && prevSelectedAnimation.current) {
            message = {
                type: "scrubanimation",
                time,
                tabId: chrome.devtools.inspectedWindow.tabId,
            };
        }
        if (message) port.postMessage(message);
        prevSelectedAnimation.current = selectedAnimation;
    }, [port, selectedAnimationName, selectedAnimation?.elements, time, selectedAnimation]);
}

function useIncomingMessages(port?: chrome.runtime.Port) {
    const addAnimations = useEditorState(getAddAnimations);
    const clear = useEditorState(getClear);

    useEffect(() => {
        if (!port) return;
        const listener = (message: ExtensionMessage) => {
            switch (message.type) {
                case "animationstart":
                    addAnimations(message.animations);
                    return;
                case "clear":
                    clear();
                    return;
                case "clientready":
                    port.postMessage({
                        type: "isrecording",
                        isRecording: getIsRecording(useEditorState.getState()),
                        tabId: chrome.devtools.inspectedWindow.tabId,
                    });
            }
        };
        port.onMessage.addListener(listener);
        return () => port.onMessage.removeListener(listener);
    }, [port, addAnimations, clear]);
}

function useIsRecording(port?: chrome.runtime.Port) {
    const isRecording = useEditorState(getIsRecording);
    useEffect(() => {
        port?.postMessage({
            type: "isrecording",
            isRecording,
            tabId: chrome.devtools.inspectedWindow.tabId,
        });
    }, [port, isRecording]);
}

export function usePort() {
    const [port, setPort] = useState<chrome.runtime.Port>();
    useEffect(() => {
        if (port) return;
        const tabId = chrome?.devtools?.inspectedWindow?.tabId;
        if (typeof chrome?.runtime?.connect !== "function" || typeof tabId !== "number") {
            return;
        }
        const nextPort = chrome.runtime.connect({ name: "devtools-page" });
        nextPort.postMessage({
            type: "init",
            tabId,
        });
        nextPort.onDisconnect.addListener(() => setPort(undefined));
        setPort(nextPort);
    }, [port]);
    useIncomingMessages(port);
    useIsRecording(port);
    useEditAnimation(port);
    return port;
}
