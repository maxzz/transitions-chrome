export function omitKeys<T extends object, K extends keyof T>(source: T, keys: K[]): Omit<T, K> {
    const next = { ...source };
    for (const key of keys) {
        delete next[key];
    }
    return next;
}
