import { pipeToCamel } from "../state/8-keyframe-utils";

//---------------------------------------------------------------------------
// Shared functions

const noopReturn = <T>(value: T) => value;
const indent = 2;

export function newLine(depth = 0, string = "") {
    return `\n${" ".repeat(depth * indent)}${string}`;
}

//---------------------------------------------------------------------------
// Transform axes

const axes = ["", "x", "y", "z"];
const order = ["translate", "scale", "rotate", "skew"] as const;

export const asTransformCssVar = (name: string) => `--motion-${name}`;

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

//---------------------------------------------------------------------------
// Transform properties

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

//---------------------------------------------------------------------------
// Transform lookup

const transformLookup = new Set(transforms);

export const isTransform = (name: string) => transformLookup.has(name);

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

export const isCssVar = (name: string) => name.startsWith("--");

//---------------------------------------------------------------------------

export function generateCSSTransform(valueTransforms: Set<string>) {
    let code = "";
    code += newLine(1, `transform:`);
    Array.from(valueTransforms).forEach((transform) => {
        code += ` ${asTransformFunction(transform)}(var(${asTransformCssVar(transform)}))`;
    });
    code += `;`;
    return code;
}

export function generateCSSProperties(props: Set<string>) {
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

export function easingToCss(easing: unknown) {
    if (Array.isArray(easing)) {
        return `cubic-bezier(${easing[0]}, ${easing[1]}, ${easing[2]}, ${easing[3]})`;
    }
    return typeof easing === "string" ? easing : undefined;
}
