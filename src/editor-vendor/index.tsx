import { render } from "react-dom";
import { Editor } from "./ui/editor";

const rootNode = document.getElementById("app");
if (rootNode) {
  render(<Editor />, rootNode);
}
