import { render } from "react-dom";
import { Editor } from "./ui/0-editor";

const rootNode = document.getElementById("app");
if (rootNode) {
    render(<Editor />, rootNode);
}
