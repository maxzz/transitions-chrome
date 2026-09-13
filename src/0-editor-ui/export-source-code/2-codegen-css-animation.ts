import { camelToPipe, sortKeyframesByOffset } from "../state/8-keyframe-utils";
import type { AnimationMetadata } from "../9-types-ui";
import { asTransformCssVar, easingToCss, generateCSSProperties, generateCSSTransform, isCssVar, isTransform, newLine } from "./4-codegen-shared";

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
