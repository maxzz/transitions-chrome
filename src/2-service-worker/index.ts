import type { DevToolsToBackgroundMessage, ExtensionMessage } from "@/9-shared/messages";
import { getPageBridgeFile, getPageClientFile } from "@/1-context-script/page-client-file";

const PAGE_CLIENT_SCRIPT_ID = "transitions-chrome-page-client";
const devToolsConnections = new Map<number, chrome.runtime.Port>();
const clientConnections = new Map<number, Map<number, chrome.runtime.Port>>();

function pageClientFile() {
    return getPageClientFile();
}

async function registerPageClient() {
    if (!chrome.scripting?.registerContentScripts) return;
    try {
        await chrome.scripting.unregisterContentScripts({
            ids: [PAGE_CLIENT_SCRIPT_ID, "transitions-chrome-page-bridge"],
        });
    } catch {
        // Not registered yet.
    }
    const scripts: chrome.scripting.RegisteredContentScript[] = [
        {
            id: PAGE_CLIENT_SCRIPT_ID,
            js: [pageClientFile()],
            matches: ["http://*/*", "https://*/*", "file:///*"],
            allFrames: true,
            runAt: "document_start",
            world: "MAIN",
            persistAcrossSessions: true,
        },
        {
            id: "transitions-chrome-page-bridge",
            js: [getPageBridgeFile()],
            matches: ["http://*/*", "https://*/*", "file:///*"],
            allFrames: true,
            runAt: "document_start",
            world: "ISOLATED",
            persistAcrossSessions: true,
        },
    ];
    for (const script of scripts) {
        try {
            await chrome.scripting.registerContentScripts([script]);
        } catch (error) {
            console.error("Failed to register page client", error);
        }
    }
}

function injectIntoTab(
    tabId: number,
    file: string,
    world: "MAIN" | "ISOLATED",
    frameId?: number,
) {
    if (!chrome.scripting?.executeScript) return;
    const target: chrome.scripting.InjectionTarget =
        typeof frameId === "number"
            ? { tabId, frameIds: [frameId] }
            : { tabId, allFrames: true };
    return chrome.scripting
        .executeScript({
            target,
            files: [file],
            world,
            injectImmediately: true,
        })
        .catch(() => {
            // chrome://, Web Store, and other restricted pages reject injection.
        });
}

function injectPageClient(tabId: number, frameId?: number) {
    return Promise.all([
        injectIntoTab(tabId, pageClientFile(), "MAIN", frameId),
        injectIntoTab(tabId, getPageBridgeFile(), "ISOLATED", frameId),
    ]);
}

registerPageClient();

function getClientConnections(tabId: number) {
    let connections = clientConnections.get(tabId);
    if (!connections) {
        connections = new Map();
        clientConnections.set(tabId, connections);
    }
    return connections;
}

function sendMessageToClient(message: ExtensionMessage & { tabId: number; }, retry = true) {
    const tabConnections = getClientConnections(message.tabId);
    if (!tabConnections.size) {
        if (retry) {
            setTimeout(() => sendMessageToClient(message, false), 50);
        }
        return;
    }
    try {
        tabConnections.forEach((connection) => {
            connection.postMessage(message);
        });
    } catch {
        clientConnections.delete(message.tabId);
        if (retry) sendMessageToClient(message, false);
    }
}

function handleClientPort(port: chrome.runtime.Port, manualTabId?: number) {
    const listener = (message: ExtensionMessage, { sender }: chrome.runtime.Port) => {
        const tabId = sender?.tab?.id ?? manualTabId;
        const frameId = sender?.frameId ?? 0;

        if (typeof tabId === "undefined") {
            console.error("No tabId defined");
            return;
        }

        if (message.type === "clientready") {
            port.postMessage({
                type: "tabId",
                tabId: sender?.tab?.id ?? tabId,
            });
            const tabConnections = clientConnections.get(tabId) ?? new Map();
            clientConnections.set(tabId, tabConnections);
            tabConnections.set(frameId, port);

            const devToolsPort = devToolsConnections.get(tabId);
            if (devToolsPort) {
                // The open panel is the source of truth; it re-sends isrecording.
                // Do not apply stale storage here — that turns recording off while
                // the UI still shows it on, and wipes in-flight load animations.
                devToolsPort.postMessage({ type: "clientready" });
                return;
            }

            chrome.storage.sync.get("recordingTabs", ({ recordingTabs = {} }) => {
                sendMessageToClient({
                    type: "isrecording",
                    tabId,
                    isRecording: Boolean((recordingTabs as Record<number, boolean>)[tabId]),
                });
            });
            return;
        }

        const devToolsPort = devToolsConnections.get(tabId);
        if (devToolsPort) devToolsPort.postMessage(message);
    };

    port.onMessage.addListener(listener);
}

function handleDevToolsPort(port: chrome.runtime.Port) {
    const listener = (message: DevToolsToBackgroundMessage) => {
        switch (message.type) {
            case "init": {
                devToolsConnections.set(message.tabId, port);
                injectPageClient(message.tabId);
                return;
            }
            case "isrecording": {
                chrome.storage.sync.get("recordingTabs", ({ recordingTabs = {} }) => {
                    const nextRecordingTabs = { ...(recordingTabs as Record<number, boolean>) };
                    if (message.isRecording) {
                        nextRecordingTabs[message.tabId] = true;
                    } else {
                        delete nextRecordingTabs[message.tabId];
                    }
                    chrome.storage.sync.set({ recordingTabs: nextRecordingTabs });
                });
                sendMessageToClient(message);
                return;
            }
            case "inspectanimation":
            case "scrubanimation": {
                sendMessageToClient(message);
                return;
            }
        }
    };

    port.onMessage.addListener(listener);
    port.onDisconnect.addListener(() => {
        port.onMessage.removeListener(listener);
        devToolsConnections.forEach((connection, id) => {
            if (connection === port) devToolsConnections.delete(id);
        });
    });
}

function handleNewConnections(port: chrome.runtime.Port, manualTabId?: number) {
    switch (port.name) {
        case "client": {
            handleClientPort(port, manualTabId);
            return;
        }
        case "devtools-page": {
            handleDevToolsPort(port);
        }
    }
}

function clearTimelineOnReload(event: chrome.webNavigation.WebNavigationTransitionCallbackDetails) {
    if (event.frameId !== 0) return;
    const devToolsPort = devToolsConnections.get(event.tabId);
    if (devToolsPort) {
        devToolsPort.postMessage({ type: "clear" });
        injectPageClient(event.tabId, event.frameId);
    }
}

function forwardClientMessagesToDevTools(
    request: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: boolean) => void,
) {
    sendResponse(true);
    if (!sender.tab) return;
    const { id } = sender.tab;
    if (typeof id !== "number") return;
    const connection = devToolsConnections.get(id);
    connection?.postMessage(request);
}

chrome.runtime.onConnect.addListener(handleNewConnections);
chrome.runtime.onMessage.addListener(forwardClientMessagesToDevTools);
chrome.webNavigation.onCommitted.addListener(clearTimelineOnReload, {
    url: [{ urlPrefix: "http" }, { urlPrefix: "localhost" }],
});
