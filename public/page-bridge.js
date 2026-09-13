/**
 * Isolated-world relay. Copied as a static extension file so Chrome can
 * register/inject it without a CRXJS IIFE virtual path (those break
 * chrome.scripting.registerContentScripts in dev).
 */
(function () {
    if (window.__MOTION_BRIDGE_HAS_LOADED) {
        return;
    }
    window.__MOTION_BRIDGE_HAS_LOADED = true;

    var backgroundPort;

    function bindPortListeners(port) {
        backgroundPort = port;

        port.onMessage.addListener(function (backgroundMessage) {
            switch (backgroundMessage.type) {
                case "tabId":
                    return;
                case "isrecording":
                case "inspectanimation":
                case "scrubanimation":
                    window.postMessage(backgroundMessage, "*");
            }
        });

        port.onDisconnect.addListener(function () {
            backgroundPort = undefined;
            console.log("%c backgroundPort disconnected", "color: red; font-weight: bold;");
        });
    }

    function connect() {
        bindPortListeners(chrome.runtime.connect({ name: "client" }));
    }

    connect();
    chrome.runtime.onConnect.addListener(bindPortListeners);

    window.addEventListener(
        "message",
        function (event) {
            if (event.source !== window) {
                return;
            }
            var data = event.data;
            if (!data || typeof data !== "object" || typeof data.type !== "string") {
                return;
            }

            if (!backgroundPort) {
                connect();
            }

            if (data.type === "animationstart" || data.type === "clientready") {
                if (backgroundPort) {
                    backgroundPort.postMessage(data);
                }
            }
        },
        false,
    );

    window.postMessage({ type: "requestclientready" }, "*");
})();
