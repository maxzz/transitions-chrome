import { useEffect } from "react";
import styled from "styled-components";
import { Leva, LevaInputs, useControls } from "leva";
import { bezier } from "@leva-ui/plugin-bezier";
import { shallow } from "../lib/shallow";
import { sortKeyframesByOffset } from "../state/keyframe-utils";
import {
    getDeleteKeyframe,
    getHistory,
    getSelectedAnimation,
    getUpdateKeyframe,
    getUpdateKeyframeEasing,
    useEditorState,
} from "../state/store";
import type { EditorStore, KeyframeData, KeyframeMetadata } from "../types";
import { TrashIcon } from "./8-icons";
import { ActionButton, SidebarContainer, ValueMarker } from "./shared-styles";

const opacity = (initialValue: unknown) => ({
    value: parseFloat(String(initialValue)),
    min: 0,
    max: 1,
    step: 0.05,
});

const controlDefinitions: Record<string, (value: unknown) => Record<string, unknown>> = {
    opacity,
};

function getControlDefinition(name: string, value: unknown) {
    const factory = controlDefinitions[name];
    const config = factory ? factory(value) : { value };
    return { ...config, label: name, transient: true };
}

const ActionsContainer = styled.div`
  padding: 20px 0px;
  display: flex;
  flex-direction: column;
`;

const DeleteButton = styled(ActionButton)``;

function KeyframeSettings({
    keyframe,
    keyframeMetadata,
    index,
}: {
    keyframe: KeyframeData;
    keyframeMetadata: KeyframeMetadata;
    index: number;
}) {
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
        if (typeof easing === "string" && easing.startsWith("steps")) {
            controls[`${keyframeId} easing freeform`] = {
                value: easing,
                label: "Easing",
                onChange: (newValue: unknown) => {
                    updateKeyframeEasing(keyframeMetadata, newValue);
                },
                ...historyCallbacks,
            };
        } else {
            controls[`${keyframeId} easing`] = {
                ...bezier((Array.isArray(easing) ? [...(easing as number[])] : easing) as never),
                label: "Easing",
                onChange: (points: number[]) => {
                    updateKeyframeEasing(keyframeMetadata, [...points]);
                },
                ...historyCallbacks,
            };
        }
    }

    const [data, set] = useControls(() => controls as never) as unknown as [
        Record<string, unknown>,
        (value: Record<string, unknown>) => void,
    ];

    useEffect(() => {
        if (data[keyframeId] !== value) set({ [keyframeId]: value });
    }, [data, keyframeId, set, value]);

    useEffect(() => {
        if (index === 0) return;
        try {
            if (typeof easing === "string" && easing.startsWith("steps")) {
                set({ [`${keyframeId} easing freeform`]: easing });
            } else if (easing !== undefined) {
                set({
                    [`${keyframeId} easing`]: Array.isArray(easing) ? [...easing] : easing,
                });
            }
        } catch {
            // Leva throws if a control was not registered for this easing shape.
        }
    }, [easing, index, keyframeId, set]);

    return (
        <ActionsContainer>
            <DeleteButton type="button" onClick={() => deleteKeyframe(keyframeMetadata)}>
                <TrashIcon />
                Delete keyframe
            </DeleteButton>
        </ActionsContainer>
    );
}

function KeyframeEditControls({ selectedKeyframes }: { selectedKeyframes: KeyframeMetadata[]; }) {
    const selectedAnimation = useEditorState(getSelectedAnimation);
    if (!selectedAnimation) return null;

    const controls = selectedKeyframes.map((keyframeMetadata) => {
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
    });

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

const Container = styled(SidebarContainer)`
  position: fixed;
  top: var(--tab-bar-height);
  right: 0;
  bottom: 0;
  width: 300px;
  padding: 5px 10px;
  z-index: 10;
  border: none;
  border-left: 1px solid var(--feint);

  h2 {
    margin-bottom: 20px;
    font-size: 12px;
  }

  ${ValueMarker} {
    display: inline-block;
    position: static;
    margin-right: 6px;
    background-color: var(--strong-blue);
    transform: translateY(3px) rotate(45deg);
  }
`;

const getSelectedKeyframes = (state: EditorStore) => state.selectedKeyframes;

export function KeyframeEditPanel() {
    const selectedKeyframes = useEditorState(getSelectedKeyframes);
    return (
        <Container style={{ display: selectedKeyframes ? "block" : "none" }}>
            <h2>
                <ValueMarker style={{ background: "var(--strong-blue)" }} />
                Edit keyframe
            </h2>
            <Leva fill theme={theme} flat titleBar={false} hideCopyButton />
            {selectedKeyframes ? <KeyframeEditControls selectedKeyframes={selectedKeyframes} /> : null}
        </Container>
    );
}
