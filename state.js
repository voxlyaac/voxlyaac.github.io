// state.js — Central reactive state store (ES module)

const listeners = new Map();

const state = {
  DECKS: {},
  BINDERS: {},
  sentence: [],
  settings: { sound: true, labels: true, anim: true },
  currentBinder: 'all',
  currentDeck: null,
  ghost: null,
  ghostSrc: null,
  isDrag: false,
};

export function getState() { return state; }

export function setState(key, value) {
  state[key] = value;
  notify(key, value);
}

export function mutateState(key, mutator) {
  mutator(state[key]);
  notify(key, state[key]);
}

function notify(key, value) {
  const subs = listeners.get(key);
  if (subs) subs.forEach(fn => fn(value, key));
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

export default state;
