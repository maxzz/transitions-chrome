type FrameCallback = (frame: { timestamp: number }) => void;

const callbacks = new Set<FrameCallback>();
let frameId = 0;

function tick(timestamp: number) {
  callbacks.forEach((callback) => callback({ timestamp }));
  if (callbacks.size) frameId = requestAnimationFrame(tick);
}

export function framesyncUpdate(callback: FrameCallback, keepAlive = false) {
  callbacks.add(callback);
  if (callbacks.size === 1) frameId = requestAnimationFrame(tick);
  if (!keepAlive) {
    const once: FrameCallback = (frame) => {
      callback(frame);
      framesyncCancel(once);
    };
    callbacks.delete(callback);
    callbacks.add(once);
  }
}

export function framesyncCancel(callback: FrameCallback) {
  callbacks.delete(callback);
  if (!callbacks.size) cancelAnimationFrame(frameId);
}
