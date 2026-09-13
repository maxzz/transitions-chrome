import { camelToPipe, defaultOffset, defaultTransitionOptionsUi, pipeToCamel, sortKeyframesByOffset } from "../state/8-keyframe-utils";
import type { AnimationMetadata } from "../types";

const noopReturn = <T>(value: T) => value;
const indent = 2;

function newLine(depth = 0, string = "") {
    return `\n${" ".repeat(depth * indent)}${string}`;
}

const axes = ["", "x", "y", "z"];
const order = ["translate", "scale", "rotate", "skew"] as const;

const asTransformCssVar = (name: string) => `--motion-${name}`;
const asTransformFunction = (name: string) => {
    switch (name) {
        case "x":
        case "y":
        case "z":
            return `translate${name.toUpperCase()}`;
        default:
            return pipeToCamel(name);
    }
};

const rotation = {
    syntax: "<angle>",
    initialValue: "0deg",
    toDefaultUnit: (value: number) => `${value}deg`,
};

const baseTransformProperties = {
    translate: {
        syntax: "<length-percentage>",
        initialValue: "0px",
        toDefaultUnit: (value: number) => `${value}px`,
    },
    rotate: rotation,
    scale: {
        syntax: "<number>",
        initialValue: 1,
        toDefaultUnit: noopReturn,
    },
    skew: rotation,
};

const transformDefinitions = new Map<string, (typeof baseTransformProperties)[keyof typeof baseTransformProperties]>();
const transforms = ["x", "y", "z"];
order.forEach((name) => {
    axes.forEach((axis) => {
        transforms.push(name + (axis ? `-${axis}` : ""));
        transformDefinitions.set(asTransformCssVar(name + axis), baseTransformProperties[name]);
    });
});

const transformLookup = new Set(transforms);
const isTransform = (name: string) => transformLookup.has(name);
const getCssVarDefinition = (name: string) => {
    switch (name) {
        case "x":
        case "y":
        case "z":
            return baseTransformProperties.translate;
        default:
            return baseTransformProperties[name.split("-")[0] as keyof typeof baseTransformProperties];
    }
};
const isCssVar = (name: string) => name.startsWith("--");

function generateCSSTransform(valueTransforms: Set<string>) {
    let code = "";
    code += newLine(1, `transform:`);
    Array.from(valueTransforms).forEach((transform) => {
        code += ` ${asTransformFunction(transform)}(var(${asTransformCssVar(transform)}))`;
    });
    code += `;`;
    return code;
}

function generateCSSProperties(props: Set<string>) {
    let defs = "";
    props.forEach((prop) => {
        const definition = getCssVarDefinition(prop);
        if (!definition) return;
        defs += `@property ${asTransformCssVar(prop)} {`;
        defs += newLine(1, `syntax: '${definition.syntax}';`);
        defs += newLine(1, `initial-value: ${definition.initialValue};`);
        defs += newLine(1, `inherits: false;`);
        defs += newLine(0, `}`);
        defs += newLine(0, ``);
        defs += newLine(0, ``);
    });
    return defs;
}

interface CssKeyframeDefinition {
    name: string;
    offset: number;
    easing?: string;
    value: unknown;
}

const generateCSSKeyframes = (allKeyframes: Map<string, CssKeyframeDefinition[]>) => {
    let css = "";
    allKeyframes.forEach((keyframes, name) => {
        css += `@keyframes ${name} {`;
        for (const { offset, value, easing, name: propertyName } of keyframes) {
            css += newLine(1, `${offset * 100}% {`);
            css += newLine(2, `${propertyName}: ${value};`);
            if (easing) css += newLine(2, `animation-timing-function: ${easing};`);
            css += newLine(1, `}`);
            css += newLine(0, ``);
        }
        css = css.trim();
        css += newLine(0, "}");
        css += newLine(0, "");
        css += newLine(0, "");
    });
    return css;
};

function easingToCss(easing: unknown) {
    if (Array.isArray(easing)) {
        return `cubic-bezier(${easing[0]}, ${easing[1]}, ${easing[2]}, ${easing[3]})`;
    }
    return typeof easing === "string" ? easing : undefined;
}

export function generateCSSAnimationCode({ elements }: AnimationMetadata) {
    const allKeyframes = new Map<string, CssKeyframeDefinition[]>();
    let elementStyles = "";
    const transformVarsToDefine = new Set<string>();

    for (const elementName in elements) {
        const elementAnimation = elements[elementName] ?? [];
        const valueTransforms = new Set<string>();
        if (!elementAnimation.length) continue;

        elementStyles += elementName.startsWith("#") ? elementName : `[GENERATED-ID="${elementName}"]`;
        elementStyles += ` {`;
        elementStyles += newLine(1, `animation: `);

        for (let i = 0; i < elementAnimation.length; i += 1) {
            const { valueName, keyframes, options, source } = elementAnimation[i];
            const { duration, delay = 0, repeat = 0 } = options;
            let name = isCssVar(valueName) ? valueName : camelToPipe(valueName);
            const keyframesName = `${elementName.replace("#", "").replace(" ", "-")}-${name}`;

            if (source.startsWith("motion-one") && isTransform(name)) {
                transformVarsToDefine.add(name);
                valueTransforms.add(name);
                name = asTransformCssVar(name);
            }

            const cssKeyframeDefinitions = sortKeyframesByOffset(keyframes).map(({ offset, value }, index, array) => {
                const { easing } = array[index + 1] || {};
                return { name, offset, easing: easingToCss(easing), value };
            });
            allKeyframes.set(keyframesName, cssKeyframeDefinitions);

            const iterations = repeat === Infinity || repeat === "Infinity" ? "infinite" : Number(repeat) + 1;
            elementStyles += `${duration}s linear ${delay}s ${iterations} both ${keyframesName}`;
            if (i < elementAnimation.length - 1) elementStyles += `, `;
        }

        elementStyles += `;`;
        if (valueTransforms.size) elementStyles += generateCSSTransform(valueTransforms);
        elementStyles += newLine(0, `}`);
        elementStyles += newLine(0, "");
        elementStyles += newLine(0, "");
    }

    let code = "";
    if (transformVarsToDefine.size) {
        code = generateCSSProperties(transformVarsToDefine) + code;
    }
    code += (generateCSSKeyframes(allKeyframes) + elementStyles).trim();
    return code;
}

export function generateCSSTransitionCode({ elements }: AnimationMetadata) {
    let code = "";
    const transformVarsToDefine = new Set<string>();

    for (const elementName in elements) {
        const elementAnimation = elements[elementName] ?? [];
        code += elementName.startsWith("#") ? elementName : `[GENERATED-ID="${elementName}"]`;
        code += ` {`;
        let transition = "";
        const valueTransforms = new Set<string>();

        for (let i = 0; i < elementAnimation.length; i += 1) {
            const { valueName, keyframes, options, source } = elementAnimation[i];
            let name = isCssVar(valueName) ? valueName : camelToPipe(valueName);
            const { duration, delay } = options;
            const orderedKeyframes = sortKeyframesByOffset(keyframes);
            const finalKeyframe = orderedKeyframes[orderedKeyframes.length - 1];
            if (!finalKeyframe) continue;

            const { easing, value } = finalKeyframe;
            if (source.startsWith("motion-one") && isTransform(name)) {
                transformVarsToDefine.add(name);
                valueTransforms.add(name);
                name = asTransformCssVar(name);
            }

            code += newLine(1, `${name}: ${value};`);
            const easingString = easingToCss(easing) ?? defaultTransitionOptionsUi.easing;
            transition += `${name} ${duration}s ${easingString}`;
            if (delay) transition += ` ${delay}s`;
            if (i < elementAnimation.length - 1) transition += `, `;
        }

        if (valueTransforms.size) code += generateCSSTransform(valueTransforms);
        code += newLine(1, `transition: ${transition};`);
        code += newLine(0, `}`);
        code += newLine(0, "");
        code += newLine(0, "");
    }

    if (transformVarsToDefine.size) {
        code = generateCSSProperties(transformVarsToDefine) + code;
    }
    return code.trim();
}

const round = (num: number) => Math.round(num * 100) / 100;

function easingAsString(easing: unknown) {
    if (typeof easing === "string") return `"${easing}"`;
    if (Array.isArray(easing)) {
        return `[${round(Number(easing[0]))}, ${round(Number(easing[1]))}, ${round(Number(easing[2]))}, ${round(Number(easing[3]))}]`;
    }
    return `"${defaultTransitionOptionsUi.easing}"`;
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
    if (offsets.every((offset, index) => offset === defaultOffsets[index])) return undefined;
    return `[${offsets.join(", ")}]`;
}

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
                if (i) easings.push(easing || defaultTransitionOptionsUi.easing);
            }
            reducedOptions[valueName].easing = generateEasingString(easings);
            const offsetString = generateOffsetString(offsets);
            if (offsetString) reducedOptions[valueName].offset = offsetString;
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
            if (!counts.has(optionName)) counts.set(optionName, new Map());
            const valueCounts = counts.get(optionName);
            if (!valueCounts) continue;
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
