import { render } from "react-dom";
import { Editor } from "./0-ui/0-editor";

const rootNode = document.getElementById("app");
if (rootNode) {
    render(<Editor />, rootNode);
}
