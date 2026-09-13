import type { AnimationMetadata } from "../9-types-ui";
import { defaultOffset, defaultTransitionOptionsUi, pipeToCamel, sortKeyframesByOffset } from "../state/8-keyframe-utils";
import { newLine } from "./4-codegen-shared";

export function generateMotionOneCode({ elements }: AnimationMetadata) {
    let code = "";
    const elementCode: Record<string, { keyframes: Record<string, string>; options: Record<string, unknown>; }> = {};

    for (const elementName in elements) {
        const reducedOptions: Record<string, Record<string, unknown>> = {};
        const reducedKeyframes: Record<string, string> = {};
        const elementAnimation = elements[elementName] ?? [];

        for (const { valueName, keyframes, options } of elementAnimation) {
            reducedOptions[valueName] = { ...options };
            const values: unknown[] = [];
            const offsets: number[] = [];
            const easings: unknown[] = [];
            const orderedKeyframes = sortKeyframesByOffset(keyframes);

            for (let i = 0; i < orderedKeyframes.length; i += 1) {
                const { value, offset, easing } = orderedKeyframes[i];
                values.push(value);
                offsets.push(offset);
                if (i) {
                    easings.push(easing || defaultTransitionOptionsUi.easing);
                }
            }
            reducedOptions[valueName].easing = generateEasingString(easings);
            const offsetString = generateOffsetString(offsets);
            if (offsetString) {
                reducedOptions[valueName].offset = offsetString;
            }
            reducedKeyframes[valueName] = values.reduce<string>(reduceValuesToString, `[`);
        }

        elementCode[elementName] = {
            keyframes: reducedKeyframes,
            options: reduceOptions(reducedOptions),
        };
    }

    for (const elementName in elements) {
        const { keyframes, options } = elementCode[elementName];
        code += `animate(`;
        const selector = elementName.includes("#") ? elementName : `GENERATED ID: ${elementName}`;
        code += newLine(1, `"${selector}",`);

        code += newLine(1, "{");
        for (const valueName in keyframes) {
            code += newLine(2, `${pipeToCamel(valueName)}: ${keyframes[valueName]},`);
        }
        code += newLine(1, "},");

        code += newLine(1, "{");
        for (const optionName in options) {
            const optionValue = options[optionName];
            if (optionValue && typeof optionValue === "object") {

                code += newLine(2, `${optionName}: {`);
                for (const valueOptionName in optionValue as Record<string, unknown>) {
                    code += newLine(3, `${valueOptionName}: ${(optionValue as Record<string, unknown>)[valueOptionName]},`);
                }
                code += newLine(2, `}`);

            } else {
                code += newLine(2, `${optionName}: ${optionValue},`);
            }
        }
        code += newLine(1, "}");
        code += newLine(0, ")");
        code += newLine(0, "");
        code += newLine(0, "");
    }

    return code.trim();
}

function easingAsString(easing: unknown) {
    if (typeof easing === "string") {
        return `"${easing}"`;
    }

    if (Array.isArray(easing)) {
        return `[${round(Number(easing[0]))}, ${round(Number(easing[1]))}, ${round(Number(easing[2]))}, ${round(Number(easing[3]))}]`;
    }

    return `"${defaultTransitionOptionsUi.easing}"`;
}

function round(num: number) {
    return Math.round(num * 100) / 100;
}

function generateEasingString(easings: unknown[]) {
    const easingStrings = easings.map(easingAsString);
    if (easingStrings.length === 1 || easingStrings.every((easing) => easing === easingStrings[0])) {
        return easingStrings[0];
    }
    return `[${easingStrings.join(", ")}]`;
}

function generateOffsetString(offsets: number[]) {
    const defaultOffsets = defaultOffset(offsets.length);
    if (offsets.every((offset, index) => offset === defaultOffsets[index])) {
        return undefined;
    }
    return `[${offsets.join(", ")}]`;
}

//---------------------------------------------------------------------------
// Reduce values to string

function reduceValuesToString(string: string, value: unknown, index: number, values: unknown[]) {
    const text = String(value);
    const isNum = parseFloat(text).toString() === text;
    string += isNum ? text : `"${text}"`;
    string += index < values.length - 1 ? `, ` : `]`;
    return string;
}

function reduceOptions(options: Record<string, Record<string, unknown>>) {
    const reduced: Record<string, unknown> = {};
    const counts = new Map<string, Map<unknown, number>>();
    const highestCount = new Map<string, unknown>();

    for (const valueName in options) {
        const valueOptions = options[valueName];

        for (const optionName in valueOptions) {
            const value = valueOptions[optionName];
            if (!counts.has(optionName)) {
                counts.set(optionName, new Map());
            }
            const valueCounts = counts.get(optionName);
            if (!valueCounts) {
                continue;
            }
            const valueCount = (valueCounts.get(value) ?? 0) + 1;
            valueCounts.set(value, valueCount);
            const highestValue = highestCount.get(optionName);
            if (highestValue === undefined || valueCount > (valueCounts.get(highestValue) ?? 0)) {
                highestCount.set(optionName, value);
            }
        }
    }

    for (const valueName in options) {
        const valueOptions = options[valueName];

        for (const optionName in valueOptions) {
            const value = valueOptions[optionName];

            if (highestCount.get(optionName) === value) {
                if (value !== (defaultTransitionOptionsUi as Record<string, unknown>)[optionName]) {
                    reduced[optionName] = value;
                }
            } else {
                const existing = (reduced[valueName] as Record<string, unknown> | undefined) ?? {};
                existing[optionName] = value;
                reduced[valueName] = existing;
            }
        }
    }

    return reduced;
}
