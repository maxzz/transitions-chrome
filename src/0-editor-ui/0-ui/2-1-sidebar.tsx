import { v4 as uuid } from "uuid";
import type { AnimationMetadata, EditorStore } from "../9-types-ui";
import { AddIcon, CodeExportIcon, InspectIcon } from "./8-icons";
import { getSetIsExportOpen, useEditorState } from "../state/0-ui-store";

function inspect(motionId: string) {
    try {
        chrome.devtools.inspectedWindow.eval(`inspect($("[data-motion-id='${motionId}']"))`, () => { });
    } catch {
        // DevTools page outlived a reload.
    }
}

const getAddValue = (state: EditorStore) => state.addValue;

function ElementDetails({ name }: { name: string; }) {
    const addValue = useEditorState(getAddValue);
    return (
        <header className="flex h-(--row-height) items-center justify-between">
            <h2>
                <code className="text-xs leading-[1.4] font-bold">{name}</code>
            </h2>

            {/* ActionContainer */}
            <div className="flex items-center">
                <button type="button" className="ml-1.25 p-0" onClick={() => addValue(name, uuid())}>
                    <AddIcon style={{ opacity: 0.7, width: 16, height: 16, stroke: "var(--white)" }} />
                </button>
                <button type="button" className="ml-1.25 p-0" onClick={() => inspect(name)}>
                    <InspectIcon style={{ opacity: 0.7, width: 13, height: 13, fill: "var(--white)" }} />
                </button>
            </div>
        </header>
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
                <li key={id} className={valueRowClasses}>
                    {/* ValueName */}
                    <input
                        className="code appearance-none border-0 border-b border-transparent bg-transparent text-(--white) focus:border-strong-blue focus:outline-none focus-visible:border-strong-blue focus-visible:outline-none"
                        value={valueName}
                        placeholder="Enter value name"
                        autoFocus={valueName === ""}
                        onChange={(event) => { renameValue(elementName, id, event.currentTarget.value); }}
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
        <section className="sticky top-0 bottom-0 left-0 z-5 w-(--sidebar-width) shrink-0 border-r border-feint bg-transparent bg-[radial-gradient(rgba(0,0,0,0)_1px,var(--background)_1px)] bg-size-[4px_4px] pt-[calc(10px+var(--row-height))] pr-2.5 pb-12.5 pl-5 backdrop-blur-[3px]">
            {children}
            <ExportButton />
        </section>
    );
}

const valueRowClasses = "relative \
flex \
h-(--row-height) \
items-center \
pl-6.25 \
before:absolute \
before:bottom-3.25 \
before:left-1.25 \
before:block \
before:h-(--row-height) \
before:w-2.5 \
before:border-2 \
before:border-feint \
before:border-t-0 \
before:border-r-0 \
before:content-[''] \
nth-2:before:h-3 \
";

const getRenameValue = (state: EditorStore) => state.renameValue;

function ExportButton() {
    const setIsExportOpen = useEditorState(getSetIsExportOpen);
    return (
        <button
            className={exportButtonClasses}
            onClick={() => setIsExportOpen(true)}
            type="button"
        >
            <CodeExportIcon /> Export
        </button>
    );
}

const exportButtonClasses = "absolute \
right-2.5 \
bottom-2.5 \
left-2.5 \
flex \
items-center \
justify-center \
rounded-[5px] \
border \
border-feint \
px-3.75 \
py-2.5 \
text-(--white) \
[&_path]:fill-(--white) \
[&_svg]:mr-1.25 \
[&_svg]:size-4 \
[&_svg]:text-(--red) \
";