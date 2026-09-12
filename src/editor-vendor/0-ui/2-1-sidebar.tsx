import { v4 as uuid } from "uuid";
import styled from "styled-components";
import { getSetIsExportOpen, useEditorState } from "../state/store";
import type { AnimationMetadata, EditorStore } from "../types";
import { AddIcon, CodeExportIcon, InspectIcon } from "./8-icons";
import { ActionButton, SidebarContainer } from "./shared-styles";

function inspect(motionId: string) {
    chrome.devtools.inspectedWindow.eval(`inspect($("[data-motion-id='${motionId}']"))`, () => { });
}

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--row-height);

  h2 code {
    font-size: 12px;
    font-weight: bold;
    line-height: 1.4;
  }

  button {
    padding: 0;
    margin-left: 5px;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const getAddValue = (state: EditorStore) => state.addValue;

function ElementDetails({ name }: { name: string; }) {
    const addValue = useEditorState(getAddValue);
    return (
        <Header>
            <h2>
                <code>{name}</code>
            </h2>
            <ActionsContainer>
                <button type="button" onClick={() => addValue(name, uuid())}>
                    <AddIcon style={{ opacity: 0.7, width: 16, height: 16, stroke: "var(--white)" }} />
                </button>
                <button type="button" onClick={() => inspect(name)}>
                    <InspectIcon style={{ opacity: 0.7, width: 13, height: 13, fill: "var(--white)" }} />
                </button>
            </ActionsContainer>
        </Header>
    );
}

const Container = styled(SidebarContainer)`
  left: 0;
  border-right: 1px solid var(--feint);

  li {
    height: var(--row-height);
    padding-left: 25px;
    position: relative;
    display: flex;
    align-items: center;
  }

  li:before {
    position: absolute;
    content: "";
    display: block;
    bottom: 13px;
    left: 5px;
    width: 10px;
    height: var(--row-height);
    border: 2px solid var(--feint);
    border-top: none;
    border-right: none;
  }

  li:nth-child(2):before {
    height: 12px;
  }
`;

const ValueName = styled.input`
  appearance: none;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--white);

  &:focus,
  &:focus-visible {
    outline: none;
    border-color: var(--strong-blue);
  }
`;

const CodeExportButton = styled(ActionButton)`
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;

  path {
    fill: var(--white);
  }
`;

const getRenameValue = (state: EditorStore) => state.renameValue;

function ExportButton() {
    const setIsExportOpen = useEditorState(getSetIsExportOpen);
    return (
        <CodeExportButton type="button" onClick={() => setIsExportOpen(true)}>
            <CodeExportIcon /> Export
        </CodeExportButton>
    );
}

export function Sidebar({ animation }: { animation: AnimationMetadata; }) {
    const { elements } = animation;
    const children = [];
    const renameValue = useEditorState(getRenameValue);

    for (const elementName in elements) {
        const elementChildren = [];
        const elementAnimations = animation.elements[elementName] ?? [];
        for (const { valueName, id } of elementAnimations) {
            elementChildren.push(
                <li key={id}>
                    <ValueName
                        className="code"
                        value={valueName}
                        placeholder="Enter value name"
                        autoFocus={valueName === ""}
                        onChange={(event) => {
                            renameValue(elementName, id, event.currentTarget.value);
                        }}
                    />
                </li>,
            );
        }
        children.push(
            <ul key={elementName}>
                <ElementDetails name={elementName} />
                {elementChildren}
            </ul>,
        );
    }

    return (
        <Container>
            {children}
            <ExportButton />
        </Container>
    );
}
