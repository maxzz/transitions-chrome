import type { DevToolsToBackgroundMessage, ExtensionMessage } from "@/shared/messages";

const devToolsConnections = new Map<number, chrome.runtime.Port>();
const clientConnections = new Map<number, Map<number, chrome.runtime.Port>>();

function getClientConnections(tabId: number) {
  let connections = clientConnections.get(tabId);
  if (!connections || !connections.size) {
    connections = new Map();
    const port = chrome.tabs.connect(tabId, { name: "client" });
    handleNewConnections(port, tabId);
    port.onDisconnect.addListener(() => console.log("port disconnected"));
    connections.set(0, port);
    clientConnections.set(tabId, connections);
  }
  return connections;
}

function sendMessageToClient(message: ExtensionMessage & { tabId: number }, retry = true) {
  const tabConnections = getClientConnections(message.tabId);
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
  const devToolsPort = devToolsConnections.get(event.tabId);
  if (devToolsPort) {
    devToolsPort.postMessage({ type: "clear" });
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
