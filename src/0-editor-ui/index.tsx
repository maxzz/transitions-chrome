import { render } from "react-dom";
import { isExtensionContextValid } from "./chrome/runtime-context";
import { Editor } from "./0-ui/0-editor";

function isIgnorablePanelError(message: string) {
    return (
        message.includes("ResizeObserver loop") ||
        message.includes("Extension context invalidated") ||
        message.includes("DevTools API encountered an error") ||
        message.includes("Failed to reload")
    );
}

window.addEventListener("error", (event) => {
    if (isIgnorablePanelError(event.message) || !isExtensionContextValid()) {
        event.stopImmediatePropagation();
        event.preventDefault();
    }
});

window.addEventListener("unhandledrejection", (event) => {
    const message = String((event.reason as { message?: string } | undefined)?.message ?? event.reason ?? "");
    if (isIgnorablePanelError(message) || !isExtensionContextValid()) {
        event.preventDefault();
    }
});

const nativeConsoleError = console.error;
console.error = (...args: unknown[]) => {
    if (!isExtensionContextValid()) {
        return;
    }
    nativeConsoleError.apply(console, args);
};

const rootNode = document.getElementById("app");
if (rootNode) {
    render(<Editor />, rootNode);
}
