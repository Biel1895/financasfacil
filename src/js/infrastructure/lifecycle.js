const listeners = new Map();
function onLifecycle(event, listener) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(listener);
  return () => listeners.get(event)?.delete(listener);
}
function publish(event, payload) {
  for (const listener of listeners.get(event) || []) {
    listener(payload);
  }
}

export { onLifecycle, publish };
