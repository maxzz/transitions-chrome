import { clamp, isEasingList, noopReturn, wrap } from "./4-utils";

export function cubicBezier(mX1: number, mY1: number, mX2: number, mY2: number) {
    if (mX1 === mY1 && mX2 === mY2) {
        return noopReturn;
    }
    const getTForX = (aX: number) => binarySubdivide(aX, 0, 1, mX1, mX2);
    return (t: number) => (t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2));
}

function binarySubdivide(x: number, lowerBound: number, upperBound: number, mX1: number, mX2: number) {
    let currentX;
    let currentT = 0;
    let i = 0;
    do {
        currentT = lowerBound + (upperBound - lowerBound) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - x;
        if (currentX > 0.0) {
            upperBound = currentT;
        } else {
            lowerBound = currentT;
        }
    } while (Math.abs(currentX) > subdivisionPrecision && ++i < subdivisionMaxIterations);
    return currentT;
}

const subdivisionPrecision = 0.0000001;
const subdivisionMaxIterations = 12;

const calcBezier = (t: number, a1: number, a2: number) => (((1.0 - 3.0 * a2 + 3.0 * a1) * t + (3.0 * a2 - 6.0 * a1)) * t + 3.0 * a1) * t;

//---------------------------------------------------------------------------

export function steps(stepCount: number, direction: "end" | "start" = "end") {
    return (progressValue: number) => {
        const nextProgress = direction === "end" ? Math.min(progressValue, 0.999) : Math.max(progressValue, 0.001);
        const expanded = nextProgress * stepCount;
        const rounded = direction === "end" ? Math.floor(expanded) : Math.ceil(expanded);
        return clamp(0, 1, rounded / stepCount);
    };
}

const namedEasings: Record<string, (t: number) => number> = {
    "ease": cubicBezier(0.25, 0.1, 0.25, 1.0),
    "ease-in": cubicBezier(0.42, 0.0, 1.0, 1.0),
    "ease-in-out": cubicBezier(0.42, 0.0, 0.58, 1.0),
    "ease-out": cubicBezier(0.0, 0.0, 0.58, 1.0),
};

const functionArgsRegex = /\((.*?)\)/;

export function getEasingFunction(definition: unknown): (t: number) => number {
    if (typeof definition === "function") {
        return definition as (t: number) => number;
    }
    if (Array.isArray(definition)) {
        const [a, b, c, d] = definition as number[];
        return cubicBezier(a, b, c, d);
    }
    if (typeof definition === "string" && namedEasings[definition]) {
        return namedEasings[definition];
    }
    if (typeof definition === "string" && definition.startsWith("steps")) {
        const args = functionArgsRegex.exec(definition);
        if (args?.[1]) {
            const argsArray = args[1].split(",");
            return steps(parseFloat(argsArray[0] ?? "0"), argsArray[1]?.trim() as "end" | "start");
        }
    }
    return noopReturn;
}

export function getEasingForSegment(easing: unknown, i: number) {
    return isEasingList(easing) ? easing[wrap(0, easing.length, i)] : easing;
}

export function convertEasing(easing: unknown) {
    return (
        Array.isArray(easing) && typeof easing[0] === "number"
            ? cubicBezierAsString(easing as [number, number, number, number])
            : easing
    );
}

export function cubicBezierAsString([a, b, c, d]: [number, number, number, number]) {
    return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
}
