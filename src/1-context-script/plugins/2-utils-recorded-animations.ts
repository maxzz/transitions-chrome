const recorded = new WeakSet<Animation>();

export function markAnimationRecorded(animation: Animation) {
    recorded.add(animation);
}

export function isAnimationRecorded(animation: Animation) {
    return recorded.has(animation);
}
