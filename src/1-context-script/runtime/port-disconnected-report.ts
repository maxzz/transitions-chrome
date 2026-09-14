export const INVALID_CTX_MESSAGE_TYPE = "invalidctx";

export type InvalidCtxAction = "reload-page" | "reopen-devtools" | "reload-extension";

export function isExtensionContextValid() {
    try {
        return Boolean(chrome?.runtime?.id);
    } catch {
        return false;
    }
}

export function isContextInvalidatedError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /extension context invalidated/i.test(message);
}

/**
 * Self-contained so DevTools can eval this function onto the inspected page.
 * `reload-page` must be painted on that page, not in the panel.
 */
export function showInvalidCtx(action: InvalidCtxAction) {
    if (typeof document === "undefined") {
        return;
    }

    const paint = () => {
        const body = document.body;
        if (!body) {
            return;
        }

        const text =
            action === "reopen-devtools"
                ? "The extension has been reloaded: close and reopen DevTools."
                : action === "reload-extension"
                    ? "Reload the extension on chrome://extensions."
                    : "The extension has been reloaded: reload this page.";

        let div = document.getElementById("dpport-invalid-ctx");
        if (!div) {
            div = document.createElement("div");
            div.style.position = "absolute";
            div.style.padding = "1px 8px";
            div.style.right = "2px";
            div.style.top = "1px";
            div.style.fontSize = "0.65rem";
            div.style.textAlign = "center";
            div.style.color = "white";
            div.style.backgroundColor = "red";
            div.style.border = "1px dotted white";
            div.style.borderRadius = "3px";
            div.style.pointerEvents = "none";
            div.style.zIndex = "2147483646";
            div.id = "dpport-invalid-ctx";
            body.insertBefore(div, body.firstChild);
        }
        div.textContent = text;
    };

    if (!document.body) {
        document.addEventListener("DOMContentLoaded", paint, { once: true });
        return;
    }
    paint();
}
