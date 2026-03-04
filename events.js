// events.js — Decoupled pub/sub event bus (ES module)

const handlers = {};

export function on(event, fn) {
  if (!handlers[event]) handlers[event] = [];
  handlers[event].push(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  if (!handlers[event]) return;
  handlers[event] = handlers[event].filter(f => f !== fn);
}

export function emit(event, data) {
  if (handlers[event]) handlers[event].forEach(fn => fn(data));
}
