// lang.js — Language manager (ES module)

import { pack as enPack } from './langs/en.js';

const packs = {};
let current = null;
const fallback = 'en';

export function register(code, pack) {
  packs[code] = pack;
  if (!current) current = code;
}

export function list() {
  const result = [];
  for (const code in packs) {
    if (packs.hasOwnProperty(code)) {
      result.push({ code: code, name: packs[code].name, nativeName: packs[code].nativeName });
    }
  }
  return result;
}

export function get(code) {
  return packs[code] || packs[fallback] || null;
}

export function set(code) {
  if (!packs[code]) code = fallback;
  current = code;
  const pack = packs[code];
  if (!pack) return;
  document.documentElement.dir = pack.dir || 'ltr';
  document.documentElement.lang = code;
  applyUI(pack.ui);
}

function applyUI(ui) {
  if (!ui) return;
  const els = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < els.length; i++) {
    const key = els[i].getAttribute('data-i18n');
    if (ui[key] !== undefined) {
      els[i].textContent = typeof ui[key] === 'function' ? ui[key]() : ui[key];
    }
  }
  const phEls = document.querySelectorAll('[data-i18n-ph]');
  for (let j = 0; j < phEls.length; j++) {
    const phKey = phEls[j].getAttribute('data-i18n-ph');
    if (ui[phKey] !== undefined) {
      phEls[j].placeholder = ui[phKey];
    }
  }
}

function p() { return packs[current] || packs[fallback]; }

export function t(key) {
  const pk = p();
  return pk && pk.ui[key] !== undefined ? pk.ui[key] : key;
}

export function getCurrent() { return current || fallback; }
export function suggestions() { const pk = p(); return pk ? pk.suggestions : {}; }
export function aiPrompt() { const pk = p(); return pk ? pk.aiPrompt : ''; }
export function defaults() { const pk = p(); return pk ? pk.defaults : { decks: {}, binders: {} }; }
export function voiceFilter() { const pk = p(); return pk ? pk.voiceFilter : ''; }
export function dir() { const pk = p(); return pk ? (pk.dir || 'ltr') : 'ltr'; }

// Eagerly register English
register('en', enPack);

// Dynamic loader for other languages
const LANG_MAP = {
  he: () => import('./langs/he.js'),
  uk: () => import('./langs/uk.js'),
  pt: () => import('./langs/pt.js'),
};

export async function loadLang(code) {
  if (packs[code]) return;
  if (LANG_MAP[code]) {
    const mod = await LANG_MAP[code]();
    register(code, mod.pack);
  }
}

export async function loadAllLangs() {
  await Promise.all(Object.keys(LANG_MAP).map(loadLang));
}
