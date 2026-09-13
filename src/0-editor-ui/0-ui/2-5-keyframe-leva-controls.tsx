import { useEffect } from "react";
import { Leva, LevaInputs, useControls } from "leva";
import { bezier } from "@leva-ui/plugin-bezier";
import { shallow } from "../utils/shallow";
import { sortKeyframesByOffset, toBezierHandles } from "../state/8-keyframe-utils";
import {
    getDeleteKeyframe,
    getHistory,
    getSelectedAnimation,
    getUpdateKeyframe,
    getUpdateKeyframeEasing,
    useEditorState,
} from "../state/0-ui-store";
import type { EditorStore, KeyframeData, KeyframeMetadata } from "../9-types-ui";
import { TrashIcon } from "./8-icons";

export function KeyframeEditPanel() {
    const selectedKeyframes = useEditorState(getSelectedKeyframes);
    return (<>
        {/* Container */}
        <section
            className="fixed top-(--tab-bar-height) right-0 bottom-0 z-10 w-75 border-0 border-l border-feint bg-transparent bg-[radial-gradient(rgba(0,0,0,0)_1px,var(--background)_1px)] bg-size-[4px_4px] px-2.5 py-1.25 backdrop-blur-[3px]"
            style={{ display: selectedKeyframes ? "block" : "none" }}
        >
            <h2 className="mb-5 text-xs">

                {/* ValueMarker */}
                <div className="mr-1.5 inline-block size-4 translate-y-0.75 rotate-45 rounded-[5px] border-[3px] border-(--black) bg-strong-blue" />
                Edit keyframe
            </h2>

            <Leva fill theme={theme} flat titleBar={false} hideCopyButton />

            {selectedKeyframes ? <KeyframeEditControls selectedKeyframes={selectedKeyframes} /> : null}
        </section>
    </>);
}

const getSelectedKeyframes = (state: EditorStore) => state.selectedKeyframes;

//---------------------------------------------------------------------------

function getControlDefinition(name: string, value: unknown) {
    const factory = controlDefinitions[name];
    const config = factory ? factory(value) : { value };
    return { ...config, label: name, transient: true };
}

const opacity = (initialValue: unknown) => ({
    value: parseFloat(String(initialValue)),
    min: 0,
    max: 1,
    step: 0.05,
});

const controlDefinitions: Record<string, (value: unknown) => Record<string, unknown>> = {
    opacity,
};

function KeyframeEditControls({ selectedKeyframes }: { selectedKeyframes: KeyframeMetadata[]; }) {
    const selectedAnimation = useEditorState(getSelectedAnimation);
    if (!selectedAnimation) return null;

    const controls = selectedKeyframes.map(
        (keyframeMetadata) => {
            const { elementName, valueId, id } = keyframeMetadata;
            const elementAnimation = selectedAnimation.elements[elementName];
            if (!elementAnimation) return null;
            const valueAnimation = elementAnimation.find((animation) => animation.id === valueId);
            if (!valueAnimation) return null;
            const orderedKeyframes = sortKeyframesByOffset(valueAnimation.keyframes);
            const index = orderedKeyframes.findIndex((item) => item.id === id);
            const keyframe = valueAnimation.keyframes[id];
            return keyframe ? (
                <KeyframeSettings key={id + index} keyframe={keyframe} keyframeMetadata={keyframeMetadata} index={index} />
            ) : null;
        }
    );

    return <>{controls}</>;
}

const theme = {
    colors: {
        elevation1: "transparent",
        elevation2: "transparent",
        elevation3: "var(--feint)",
        accent1: "var(--strong-blue)",
        accent2: "var(--strong-blue)",
        accent3: "var(--strong-blue)",
        highlight1: "var(--feint)",
        highlight2: "var(--white)",
        highlight3: "var(--white)",
        vivid1: "var(--pink)",
    },
    space: {
        rowGap: "20px",
    },
    fonts: {
        mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, 'Roboto Mono', monospace",
        sans: "'Inter', system-ui, sans-serif",
    },
};

function KeyframeSettings({ keyframe, keyframeMetadata, index }: { keyframe: KeyframeData; keyframeMetadata: KeyframeMetadata; index: number; }) {
    const controls: Record<string, unknown> = {};
    const updateKeyframe = useEditorState(getUpdateKeyframe);
    const updateKeyframeEasing = useEditorState(getUpdateKeyframeEasing);
    const deleteKeyframe = useEditorState(getDeleteKeyframe);
    const { valueName, id: keyframeId } = keyframeMetadata;
    const { value, easing, isUserCreated } = keyframe;
    
    const { enableHistory } = useEditorState(getHistory, shallow);
    const historyCallbacks = {
        onEditStart: () => enableHistory?.(false),
        onEditEnd: () => enableHistory?.(true),
    };

    controls[keyframeId] = {
        type: isUserCreated ? LevaInputs.STRING : undefined,
        ...getControlDefinition(valueName, value),
        onChange: (newValue: unknown) => updateKeyframe(keyframeMetadata, newValue),
        ...historyCallbacks,
    };

    if (index !== 0) {
        const handles = toBezierHandles(easing);
        if (handles) {
            controls[`${keyframeId} easing`] = {
                ...bezier([handles[0], handles[1], handles[2], handles[3]]),
                label: "Easing",
                onChange: (points: number[]) => {
                    updateKeyframeEasing(keyframeMetadata, Array.from(points).slice(0, 4));
                },
                ...historyCallbacks,
            };
        } else {
            controls[`${keyframeId} easing freeform`] = {
                value: typeof easing === "string" ? easing : String(easing ?? ""),
                label: "Easing",
                onChange: (newValue: unknown) => {
                    updateKeyframeEasing(keyframeMetadata, newValue);
                },
                ...historyCallbacks,
            };
        }
    }

    const [data, set] = useControls(() => controls as never) as unknown as [
        Record<string, unknown>,
        (value: Record<string, unknown>) => void,
    ];

    useEffect
        (() => {
            if (data[keyframeId] !== value) set({ [keyframeId]: value });
        },
            [data, keyframeId, set, value]);

    useEffect(
        () => {
            if (index === 0) return;
            try {
                const handles = toBezierHandles(easing);
                if (handles) {
                    set({ [`${keyframeId} easing`]: handles });
                } else if (easing !== undefined) {
                    set({ [`${keyframeId} easing freeform`]: typeof easing === "string" ? easing : String(easing) });
                }
            } catch {
                // Leva throws if a control was not registered for this easing shape.
            }
        },
        [easing, index, keyframeId, set]);

    return (<>
        {/* ActionsContainer */}
        <div className="flex flex-col py-5">

            {/* DeleteButton */}
            <button
                type="button"
                className="flex items-center justify-center rounded-[5px] border border-feint px-3.75 py-2.5 text-(--white) [&_svg]:mr-1.25 [&_svg]:size-4 [&_svg]:text-(--red)"
                onClick={() => deleteKeyframe(keyframeMetadata)}
            >
                <TrashIcon />
                Delete keyframe
            </button>
        </div>
    </>);
}
