import { addUniqueItem, noopReturn } from "./4-utils";

export class MotionValue {
    animation?: AnimationLike;
    generator?: unknown;

    setAnimation(animation?: AnimationLike) {
        this.animation = animation;
        animation?.finished?.then(() => this.clearAnimation()).catch(() => { });
    }

    clearAnimation() {
        this.animation = this.generator = undefined;
    }
}

export type AnimationLike = Animation & {
    stop?: () => void;
};

interface ElementAnimationData {
    transforms: string[];
    values: Map<string, MotionValue>;
}

const data = new WeakMap<Element, ElementAnimationData>();

export function getAnimationData(element: Element) {
    if (!data.has(element)) {
        data.set(element, { transforms: [], values: new Map() });
    }
    return data.get(element) as ElementAnimationData;
}

export function getMotionValue(motionValues: Map<string, MotionValue>, name: string) {
    if (!motionValues.has(name)) {
        motionValues.set(name, new MotionValue());
    }
    return motionValues.get(name) as MotionValue;
}

//---------------------------------------------------------------------------

const axes = ["", "X", "Y", "Z"];
const order = ["translate", "scale", "rotate", "skew"] as const;

const transformAlias: Record<string, string> = {
    x: "translateX",
    y: "translateY",
    z: "translateZ",
};

type TransformCssDefinition = {
    syntax: string;
    initialValue: string | number;
    toDefaultUnit: (value: number) => string | number;
};

const rotation: TransformCssDefinition = {
    syntax: "<angle>",
    initialValue: "0deg",
    toDefaultUnit: (v) => `${v}deg`,
};

const baseTransformProperties: Record<string, TransformCssDefinition> = {
    translate: {
        syntax: "<length-percentage>",
        initialValue: "0px",
        toDefaultUnit: (v) => `${v}px`,
    },
    rotate: rotation,
    scale: {
        syntax: "<number>",
        initialValue: 1,
        toDefaultUnit: noopReturn,
    },
    skew: rotation,
};

export const transformCssDefinitions = new Map<string, TransformCssDefinition>();
export const asTransformCssVar = (name: string) => `--motion-${name}`;

const transforms = ["x", "y", "z"];
order.forEach(
    (name) => {
        axes.forEach(
            (axis) => {
                transforms.push(name + axis);
                transformCssDefinitions.set(asTransformCssVar(name + axis), baseTransformProperties[name]);
            }
        );
    }
);

//---------------------------------------------------------------------------

export function registerCssVariable(name: string) {
    if (registeredProperties.has(name)) {
        return;
    }
    registeredProperties.add(name);
    try {
        const definition = transformCssDefinitions.has(name) ? transformCssDefinitions.get(name) : undefined;
        CSS.registerProperty({
            name,
            inherits: false,
            syntax: definition?.syntax,
            initialValue: definition?.initialValue !== undefined ? String(definition.initialValue) : undefined,
        });
    } catch {
        // Ignore browsers that reject the registration.
    }
}

const registeredProperties = new Set<string>();

export function addTransformToElement(element: HTMLElement, name: string) {
    let transformName = name;
    if (transformAlias[transformName]) {
        transformName = transformAlias[transformName];
    }
    const { transforms: elementTransforms } = getAnimationData(element);
    addUniqueItem(elementTransforms, transformName);
    element.style.transform = buildTransformTemplate(elementTransforms);
}

export function buildTransformTemplate(elementTransforms: string[]) {
    return elementTransforms.sort(compareTransformOrder).reduce(transformListToString, "").trim();
}

function compareTransformOrder(a: string, b: string) {
    return transforms.indexOf(a) - transforms.indexOf(b);
}

function transformListToString(template: string, name: string) {
    return `${template} ${name}(var(${asTransformCssVar(name)}))`;
}

export const transformNames = new Set([
    "x",
    "y",
    "z",
    "scale",
    "scaleX",
    "scaleY",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "skew",
    "skewX",
    "skewY",
]);

//---------------------------------------------------------------------------

export function getStyleName(key: string) {
    let name = key;
    if (transformAlias[name]) {
        name = transformAlias[name];
    }
    return isTransform(name) ? asTransformCssVar(name) : name;
}

const transformLookup = new Set(transforms);
export const isTransform = (name: string) => transformLookup.has(name);

//---------------------------------------------------------------------------

export const styleAccess = {
    get: (element: HTMLElement, name: string) => {
        const styleName = getStyleName(name);
        const raw = isCssVar(styleName)
            ? element.style.getPropertyValue(styleName)
            : (getComputedStyle(element)[styleName as keyof CSSStyleDeclaration] as string);
        let value: string | number | undefined = raw;
        if (value === "" || value === undefined) {
            const definition = transformCssDefinitions.get(styleName);
            if (definition) value = definition.initialValue;
        }
        return value;
    },
    set: (element: HTMLElement, name: string, value: string | number) => {
        const styleName = getStyleName(name);
        if (isCssVar(styleName)) {
            element.style.setProperty(styleName, String(value));
        } else {
            element.style[styleName as unknown as number] = value as never;
        }
    },
};

export function isCssVar(name: string) {
    return name.startsWith("--");
}

//---------------------------------------------------------------------------

export function stopAnimation(animation?: AnimationLike, needsCommit = true) {
    if (!animation || animation.playState === "finished") {
        return;
    }
    try {
        if (animation.stop) {
            animation.stop();
        } else {
            if (needsCommit) {
                animation.commitStyles();
            }
            animation.cancel();
        }
    } catch {
        // WAAPI can throw when cancelling already-finished animations.
    }
}
