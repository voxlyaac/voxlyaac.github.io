// profiles.js — Multi-profile persistence (ES module)

import state from './state.js';
import * as Lang from './lang.js';

const INDEX_KEY = 'aac-profiles-index';
const PREFIX = 'aac-profile:';
const SAVE_DELAY = 800;
const CLOUD_DELAY = 5000;

let saveTimer = null;
const cloudTimers = {};

// --- INDEX ---

function getIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function setIndex(idx) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  cloudPush(INDEX_KEY, idx);
}

function ensureIndex() {
  let idx = getIndex();
  if (!idx) {
    idx = { profiles: ['default'], active: 'default' };
    setIndex(idx);
  }
  return idx;
}

// --- SNAPSHOT / APPLY ---

function snapshot() {
  return {
    version: 1,
    decks: state.DECKS,
    binders: state.BINDERS,
    currentBinder: state.currentBinder,
    settings: state.settings,
    aiSettings: {
      enabled: localStorage.getItem('aac-friend-enabled') !== 'false',
      suggestions: localStorage.getItem('aac-friend-suggestions') !== 'false'
    },
    voice: localStorage.getItem('aac-voice') || '',
    voiceEngine: localStorage.getItem('aac-voice-engine') || 'browser',
    voiceSpeed: parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85,
    lang: Lang.getCurrent()
  };
}

function apply(data) {
  state.DECKS = data.decks || {};
  state.BINDERS = data.binders || {};
  state.currentBinder = data.currentBinder || 'all';
  const s = data.settings || {};
  state.settings = {
    sound: s.sound !== false,
    labels: s.labels !== false,
    anim: s.anim !== false
  };
  if (data.aiSettings) {
    localStorage.setItem('aac-friend-enabled', String(data.aiSettings.enabled !== false));
    localStorage.setItem('aac-friend-suggestions', String(data.aiSettings.suggestions !== false));
  }
  localStorage.setItem('aac-voice', data.voice || '');
  localStorage.setItem('aac-voice-engine', data.voiceEngine || 'browser');
  localStorage.setItem('aac-voice-speed', String(data.voiceSpeed || 0.85));
  Lang.set(data.lang || 'en');
  migrateDecks();
}

function migrateDecks() {
  const langDefaults = Lang.defaults();
  if (!langDefaults) return;
  const defaultDecks = langDefaults.decks;
  for (const key in defaultDecks) {
    if (!defaultDecks.hasOwnProperty(key)) continue;
    if (!state.DECKS[key]) {
      state.DECKS[key] = JSON.parse(JSON.stringify(defaultDecks[key]));
    }
  }
}

// --- PROFILE CRUD ---

function saveToStorage(name, data) {
  const key = PREFIX + name;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
  cloudPush(key, data);
}

function loadFromStorage(name) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function load() {
  const idx = ensureIndex();
  let data = loadFromStorage(idx.active);
  if (!data) {
    data = snapshot();
    saveToStorage(idx.active, data);
  }
  apply(data);
  return idx.active;
}

export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    const idx = getIndex();
    if (!idx) return;
    saveToStorage(idx.active, snapshot());
  }, SAVE_DELAY);
}

export function switchProfile(name) {
  let idx = getIndex();
  if (idx) saveToStorage(idx.active, snapshot());
  idx.active = name;
  setIndex(idx);
  let data = loadFromStorage(name);
  if (!data) {
    data = getDefaults();
    saveToStorage(name, data);
  }
  apply(data);
}

export function createProfile(name) {
  const idx = ensureIndex();
  const key = name.toLowerCase().trim();
  if (!key || idx.profiles.indexOf(key) !== -1) return false;
  idx.profiles.push(key);
  setIndex(idx);
  saveToStorage(key, getDefaults());
  return true;
}

export function deleteProfile(name) {
  if (name === 'default') return false;
  const idx = getIndex();
  if (!idx) return false;
  const i = idx.profiles.indexOf(name);
  if (i === -1) return false;
  idx.profiles.splice(i, 1);
  if (idx.active === name) idx.active = 'default';
  setIndex(idx);
  localStorage.removeItem(PREFIX + name);
  localStorage.removeItem('aac-stats:' + name);
  if (typeof puter !== 'undefined' && puter.kv) {
    puter.kv.del(PREFIX + name).catch(function () {});
    puter.kv.del('aac-stats:' + name).catch(function () {});
  }
  return true;
}

export function listProfiles() {
  const idx = ensureIndex();
  return { profiles: idx.profiles.slice(), active: idx.active, avatars: idx.avatars || {} };
}

export function setAvatar(name, avatar) {
  const idx = ensureIndex();
  if (!idx.avatars) idx.avatars = {};
  idx.avatars[name] = avatar;
  setIndex(idx);
}

export function renameProfile(oldName, newName) {
  if (oldName === 'default') return false;
  const key = newName.toLowerCase().trim();
  if (!key || key === oldName) return false;
  const idx = ensureIndex();
  if (idx.profiles.indexOf(key) !== -1) return false;
  const i = idx.profiles.indexOf(oldName);
  if (i === -1) return false;
  idx.profiles[i] = key;
  if (idx.active === oldName) idx.active = key;
  if (idx.avatars && idx.avatars[oldName]) {
    idx.avatars[key] = idx.avatars[oldName];
    delete idx.avatars[oldName];
  }
  setIndex(idx);
  const data = loadFromStorage(oldName);
  if (data) {
    saveToStorage(key, data);
    localStorage.removeItem(PREFIX + oldName);
  }
  const stats = localStorage.getItem('aac-stats:' + oldName);
  if (stats) {
    localStorage.setItem('aac-stats:' + key, stats);
    localStorage.removeItem('aac-stats:' + oldName);
  }
  return true;
}

function getDefaults() {
  const langDefaults = Lang.defaults();
  const decks = langDefaults ? langDefaults.decks : {};
  const binders = langDefaults ? langDefaults.binders : {};
  return {
    version: 1,
    decks: JSON.parse(JSON.stringify(decks)),
    binders: JSON.parse(JSON.stringify(binders)),
    currentBinder: Object.keys(binders)[0] || 'all',
    settings: { sound: true, labels: true, anim: true },
    aiSettings: { enabled: true, suggestions: true },
    voiceEngine: 'browser',
    lang: Lang.getCurrent()
  };
}

// --- CLOUD SYNC ---

function cloudPush(key, data) {
  clearTimeout(cloudTimers[key]);
  cloudTimers[key] = setTimeout(function () {
    if (typeof puter !== 'undefined' && puter.kv) {
      puter.kv.set(key, JSON.stringify(data)).catch(function () {});
    }
  }, CLOUD_DELAY);
}

export function pullFromCloud() {
  if (typeof puter === 'undefined' || !puter.kv) return Promise.resolve();
  return puter.kv.get(INDEX_KEY).then(function (raw) {
    if (!raw) return;
    let cloudIdx;
    try { cloudIdx = JSON.parse(raw); } catch (e) { return; }
    const localIdx = ensureIndex();
    let changed = false;
    for (let i = 0; i < cloudIdx.profiles.length; i++) {
      if (localIdx.profiles.indexOf(cloudIdx.profiles[i]) === -1) {
        localIdx.profiles.push(cloudIdx.profiles[i]);
        changed = true;
      }
    }
    if (changed) setIndex(localIdx);
    const pulls = [];
    for (let j = 0; j < localIdx.profiles.length; j++) {
      (function (p) {
        const key = PREFIX + p;
        if (!localStorage.getItem(key)) {
          pulls.push(puter.kv.get(key).then(function (val) {
            if (val) localStorage.setItem(key, val);
          }).catch(function () {}));
        }
        const statsKey = 'aac-stats:' + p;
        if (!localStorage.getItem(statsKey)) {
          pulls.push(puter.kv.get(statsKey).then(function (val) {
            if (val) localStorage.setItem(statsKey, val);
          }).catch(function () {}));
        }
      })(localIdx.profiles[j]);
    }
    return Promise.all(pulls);
  }).catch(function () {});
}
