import { render } from "react-dom";
import { Editor } from "./0-ui/0-editor";
import { showInvalidCtxOnInspectedPage } from "./chrome/inject-client";
import { isContextInvalidatedError, showInvalidCtx } from "../1-context-script/runtime/port-disconnected-report";

window.addEventListener("error", (event) => {
    if (event.message.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
    }
    if (isContextInvalidatedError(event.error) || isContextInvalidatedError(event.message)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        showInvalidCtx("reopen-devtools");
        showInvalidCtxOnInspectedPage();
    }
});

window.addEventListener("unhandledrejection", (event) => {
    if (isContextInvalidatedError(event.reason)) {
        event.preventDefault();
        showInvalidCtx("reopen-devtools");
        showInvalidCtxOnInspectedPage();
    }
});

const rootNode = document.getElementById("app");
if (rootNode) {
    render(<Editor />, rootNode);
}
