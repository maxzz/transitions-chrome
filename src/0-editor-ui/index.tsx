import { render } from "react-dom";
import { Editor } from "./0-ui/0-editor";

window.addEventListener("error", (event) => {
    if (event.message.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation();
        event.preventDefault();
    }
});

const rootNode = document.getElementById("app");
if (rootNode) {
    render(<Editor />, rootNode);
}
