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

    injectPageClient();

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
            if (!isRuntimeAlive()) {
                reportInvalidCtx();
            }
        });
    }

    function findPageClientUrl() {
        try {
            var groups = (chrome.runtime.getManifest().web_accessible_resources || []);
            for (var i = 0; i < groups.length; i++) {
                var resources = groups[i].resources || [];
                for (var j = 0; j < resources.length; j++) {
                    if (String(resources[j]).indexOf("0-client-entry") !== -1) {
                        return chrome.runtime.getURL(resources[j]);
                    }
                }
            }
        } catch (e) {
            // Fall through to the CRXJS dev IIFE path.
        }
        return chrome.runtime.getURL("src/1-context-script/0-all/0-client-entry.ts.js");
    }

    function injectPageClient() {
        var url = findPageClientUrl();
        try {
            var request = new XMLHttpRequest();
            request.open("GET", url, false);
            request.send();
            if (request.status === 200 && request.responseText) {
                var script = document.createElement("script");
                script.textContent = request.responseText;
                (document.head || document.documentElement).appendChild(script);
                script.remove();
                return;
            }
        } catch (e) {
            // Page CSP can block inline scripts; fall back to a file URL.
        }
        var fallback = document.createElement("script");
        fallback.src = url;
        fallback.async = false;
        (document.head || document.documentElement).appendChild(fallback);
        fallback.addEventListener("load", function () {
            fallback.remove();
        });
    }

    function isRuntimeAlive() {
        try {
            return Boolean(chrome.runtime && chrome.runtime.id);
        } catch (e) {
            return false;
        }
    }

    function reportInvalidCtx() {
        window.postMessage({ type: "invalidctx" }, "*");
    }

    function connect() {
        if (!isRuntimeAlive()) {
            reportInvalidCtx();
            return;
        }
        try {
            bindPortListeners(chrome.runtime.connect({ name: "client" }));
        } catch (e) {
            reportInvalidCtx();
        }
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
