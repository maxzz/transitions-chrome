export function shallow<T>(objA: T, objB: T) {
    if (Object.is(objA, objB)) return true;
    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    if (keysA.length !== Object.keys(objB).length) return false;

    for (const key of keysA) {
        if (
            !Object.prototype.hasOwnProperty.call(objB, key) ||
            !Object.is((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])
        ) {
            return false;
        }
    }

    return true;
}
