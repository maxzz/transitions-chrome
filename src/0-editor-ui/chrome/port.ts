import { useEffect, useRef, useState } from "react";
import { type ExtensionMessage } from "@/9-shared/messages";
import { getAddAnimations, getClear, getIsRecording, getSelectedAnimation, getSelectedAnimationName, useEditorState } from "../state/0-ui-store";
import { injectClientIntoInspectedPage, showInvalidCtxOnInspectedPage } from "./inject-client";
import { isContextInvalidatedError, isExtensionContextValid, showInvalidCtx } from "../../1-context-script/runtime/port-disconnected-report";

export function usePort() {
    const [port, setPort] = useState<chrome.runtime.Port>();

    useEffect(
        () => {
            const tabId = getInspectedTabId();
            let canConnect = false;
            try {
                canConnect = typeof chrome?.runtime?.connect === "function";
            } catch {
                if (typeof tabId === "number") {
                    reportDeadDevTools();
                }
                return;
            }
            if (!canConnect || typeof tabId !== "number") {
                return;
            }

            let active = true;
            let currentPort: chrome.runtime.Port | undefined;
            let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
            let connectAttempts = 0;

            const connect = () => {
                if (!active) {
                    return;
                }
                if (!isExtensionContextValid()) {
                    reportDeadDevTools();
                    return;
                }
                try {
                    const nextPort = chrome.runtime.connect({ name: "devtools-page" });
                    currentPort = nextPort;
                    connectAttempts = 0;
                    nextPort.postMessage({ type: "init", tabId });

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
                                reportDeadDevTools();
                                return;
                            }
                            reconnectTimer = setTimeout(connect, 0);
                        }
                    );

                    setPort(nextPort);
                    injectClientIntoInspectedPage();
                } catch (error) {
                    currentPort = undefined;
                    setPort(undefined);
                    if (isContextInvalidatedError(error) || !isExtensionContextValid()) {
                        reportDeadDevTools();
                        return;
                    }
                    connectAttempts += 1;
                    if (connectAttempts >= 3) {
                        showInvalidCtx("reload-extension");
                        return;
                    }
                    reconnectTimer = setTimeout(connect, 50);
                }
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
                    case "clientready": {
                        const tabId = getInspectedTabId();
                        if (typeof tabId !== "number") {
                            return;
                        }
                        injectClientIntoInspectedPage();
                        postToBackground(port, { type: "isrecording", isRecording: getIsRecording(useEditorState.getState()), tabId });
                        return;
                    }
                }
            };

            try {
                port.onMessage.addListener(listener);
            } catch (error) {
                reportPortFailure(error);
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
            if (typeof tabId !== "number") {
                return;
            }
            postToBackground(port, { type: "isrecording", isRecording, tabId });
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
            if (typeof tabId !== "number") {
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

function getInspectedTabId() {
    try {
        const tabId = chrome?.devtools?.inspectedWindow?.tabId;
        return typeof tabId === "number" ? tabId : undefined;
    } catch {
        return undefined;
    }
}

function postToBackground(port: chrome.runtime.Port | undefined, message: unknown) {
    if (!port || !isExtensionContextValid()) {
        return;
    }
    try {
        port.postMessage(message);
    } catch (error) {
        reportPortFailure(error);
    }
}

function reportPortFailure(error: unknown) {
    if (isContextInvalidatedError(error) || !isExtensionContextValid()) {
        reportDeadDevTools();
        return;
    }
    showInvalidCtx("reload-extension");
}

function reportDeadDevTools() {
    showInvalidCtx("reopen-devtools");
    showInvalidCtxOnInspectedPage();
}
