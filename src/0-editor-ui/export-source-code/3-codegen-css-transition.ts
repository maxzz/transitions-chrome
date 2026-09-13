import type { AnimationMetadata } from "../9-types-ui";
import { camelToPipe, defaultTransitionOptionsUi, sortKeyframesByOffset } from "../state/8-keyframe-utils";
import { asTransformCssVar, easingToCss, generateCSSProperties, generateCSSTransform, isCssVar, isTransform, newLine } from "./4-codegen-shared";

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
            if (!finalKeyframe) {
                continue;
            }

            const { easing, value } = finalKeyframe;
            if (source.startsWith("motion-one") && isTransform(name)) {
                transformVarsToDefine.add(name);
                valueTransforms.add(name);
                name = asTransformCssVar(name);
            }

            code += newLine(1, `${name}: ${value};`);
            const easingString = easingToCss(easing) ?? defaultTransitionOptionsUi.easing;
            transition += `${name} ${duration}s ${easingString}`;
            if (delay) {
                transition += ` ${delay}s`;
            }
            if (i < elementAnimation.length - 1) {
                transition += `, `;
            }
        }

        if (valueTransforms.size) {
            code += generateCSSTransform(valueTransforms);
        }
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
