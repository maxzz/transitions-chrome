import { useEffect, useRef, useState } from "react";
import { type ExtensionMessage } from "@/9-shared/messages";
import { getAddAnimations, getClear, getIsRecording, getSelectedAnimation, getSelectedAnimationName, useEditorState } from "../state/0-ui-store";
import { injectClientIntoInspectedPage } from "./inject-client";
import { getInspectedTabId, isExtensionContextValid, postToBackground } from "./runtime-context";

export function usePort() {
    const [port, setPort] = useState<chrome.runtime.Port>();

    useEffect(
        () => {
            const tabId = getInspectedTabId();
            if (!isExtensionContextValid() || typeof chrome?.runtime?.connect !== "function" || typeof tabId !== "number") {
                return;
            }

            let active = true;
            let currentPort: chrome.runtime.Port | undefined;
            let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

            const connect = () => {
                if (!active || !isExtensionContextValid()) {
                    return;
                }

                let nextPort: chrome.runtime.Port;
                try {
                    nextPort = chrome.runtime.connect({ name: "devtools-page" });
                } catch {
                    return;
                }

                currentPort = nextPort;
                if (!postToBackground(nextPort, { type: "init", tabId })) {
                    return;
                }

                nextPort.onDisconnect.addListener(
                    () => {
                        if (!active) {
                            return;
                        }
                        if (currentPort === nextPort) {
                            currentPort = undefined;
                        }
                        setPort(undefined);
                        console.log("%c currentPort disconnected", "color: red; font-weight: bold;");

                        if (!isExtensionContextValid()) {
                            return;
                        }
                        reconnectTimer = setTimeout(connect, 0);
                    }
                );

                setPort(nextPort);
                injectClientIntoInspectedPage();
            };

            connect();

            return () => {
                active = false;
                if (reconnectTimer !== undefined) {
                    clearTimeout(reconnectTimer);
                }
                try {
                    currentPort?.disconnect();
                } catch {
                    // Context already gone.
                }
            };
        },
        []);

    useEffect(
        () => {
            if (!isExtensionContextValid()) {
                return;
            }
            const onNavigated = chrome?.devtools?.network?.onNavigated;
            if (!onNavigated) return;
            const listener = () => injectClientIntoInspectedPage();
            try {
                onNavigated.addListener(listener);
            } catch {
                return;
            }
            return () => {
                try {
                    onNavigated.removeListener(listener);
                } catch {
                    // Context already gone.
                }
            };
        },
        []);

    useIncomingMessages(port);
    useIsRecording(port);
    useEditAnimation(port);
    return port;
}

function useIncomingMessages(port?: chrome.runtime.Port) {
    const addAnimations = useEditorState(getAddAnimations);
    const clear = useEditorState(getClear);

    useEffect(
        () => {
            if (!port) {
                return;
            }

            let active = true;
            const listener = (message: ExtensionMessage) => {
                if (!active) {
                    return;
                }
                switch (message.type) {
                    case "animationstart":
                        addAnimations(message.animations);
                        return;
                    case "clear":
                        clear();
                        return;
                    case "clientready":
                        injectClientIntoInspectedPage();
                        const tabId = getInspectedTabId();
                        if (tabId !== undefined) {
                            postToBackground(port, { type: "isrecording", isRecording: getIsRecording(useEditorState.getState()), tabId });
                        }
                }
            };

            try {
                port.onMessage.addListener(listener);
            } catch {
                return;
            }
            return () => {
                active = false;
                try {
                    port.onMessage.removeListener(listener);
                } catch {
                    // Context already gone.
                }
            };
        },
        [port, addAnimations, clear]);
}

function useIsRecording(port?: chrome.runtime.Port) {
    const isRecording = useEditorState(getIsRecording);
    useEffect(
        () => {
            const tabId = getInspectedTabId();
            if (tabId !== undefined) {
                postToBackground(port, { type: "isrecording", isRecording, tabId });
            }
        },
        [port, isRecording]);
}

function useEditAnimation(port?: chrome.runtime.Port) {
    const selectedAnimationName = useEditorState(getSelectedAnimationName);
    const selectedAnimation = useEditorState(getSelectedAnimation);
    const time = selectedAnimation?.currentTime;
    const prevSelectedAnimation = useRef(selectedAnimation);

    useEffect(
        () => {
            if (!port) {
                return;
            }

            const tabId = getInspectedTabId();
            if (tabId === undefined) {
                prevSelectedAnimation.current = selectedAnimation;
                return;
            }

            let message: ExtensionMessage | undefined;
            if (selectedAnimationName && selectedAnimation && prevSelectedAnimation.current !== selectedAnimation) {
                message = { type: "inspectanimation", animation: selectedAnimation, tabId };
            }
            else if (time !== undefined && prevSelectedAnimation.current) {
                message = { type: "scrubanimation", time, tabId };
            }

            if (message) {
                postToBackground(port, message);
            }
            prevSelectedAnimation.current = selectedAnimation;
        },
        [port, selectedAnimationName, selectedAnimation?.elements, time, selectedAnimation]);
}

