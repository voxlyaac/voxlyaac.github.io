// stats.js — Usage statistics collection (ES module)

const PREFIX = 'aac-stats:';
const CLOUD_DELAY = 5000;
const SAVE_DELAY = 2000;
const MAX_AGE_DAYS = 90;

const cloudTimers = {};
let saveTimer = null;
let cache = null;
let currentProfile = null;
let sessionStart = null;

// --- HELPERS ---

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function emptyDay() {
  return {
    cardTaps: {},
    deckOpens: {},
    nextWord: {},
    sentencesSpoken: 0,
    aiAssistUsed: 0,
    suggestionsUsed: 0,
    wordsPerSentence: [],
    sessionMinutes: 0
  };
}

function emptyStats() {
  return { days: {} };
}

function ensureDay(stats, key) {
  if (!stats.days[key]) stats.days[key] = emptyDay();
  return stats.days[key];
}

// --- STORAGE ---

function storageKey(profileName) {
  return PREFIX + profileName;
}

function loadFromStorage(profileName) {
  try {
    const raw = localStorage.getItem(storageKey(profileName));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveToStorage(profileName, data) {
  try {
    localStorage.setItem(storageKey(profileName), JSON.stringify(data));
  } catch (e) {}
  cloudPush(storageKey(profileName), data);
}

function cloudPush(key, data) {
  clearTimeout(cloudTimers[key]);
  cloudTimers[key] = setTimeout(function () {
    if (typeof puter !== 'undefined' && puter.kv) {
      puter.kv.set(key, JSON.stringify(data)).catch(function () {});
    }
  }, CLOUD_DELAY);
}

// --- DEBOUNCED SAVE ---

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    if (currentProfile && cache) {
      saveToStorage(currentProfile, cache);
    }
  }, SAVE_DELAY);
}

// --- PRUNE OLD DATA ---

function prune(stats) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const keys = Object.keys(stats.days);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] < cutoffKey) delete stats.days[keys[i]];
  }
}

// --- PUBLIC API ---

export function init(profileName) {
  if (saveTimer && currentProfile && cache) {
    clearTimeout(saveTimer);
    saveToStorage(currentProfile, cache);
  }
  currentProfile = profileName;
  cache = loadFromStorage(profileName) || emptyStats();
  prune(cache);
  sessionStart = Date.now();
}

export function track(event, data) {
  if (!cache) return;
  const day = ensureDay(cache, todayKey());
  switch (event) {
    case 'cardTap':
      var label = (data && data.label) ? data.label.toLowerCase() : 'unknown';
      day.cardTaps[label] = (day.cardTaps[label] || 0) + 1;
      break;
    case 'deckOpen':
      var deck = (data && data.deck) ? data.deck : 'unknown';
      day.deckOpens[deck] = (day.deckOpens[deck] || 0) + 1;
      break;
    case 'sentenceSpoken':
      day.sentencesSpoken++;
      if (data && typeof data.wordCount === 'number') {
        day.wordsPerSentence.push(data.wordCount);
      }
      break;
    case 'aiAssist':
      day.aiAssistUsed++;
      break;
    case 'suggestionUsed':
      day.suggestionsUsed++;
      break;
    case 'nextWord':
      var ctx = (data && data.context) ? data.context : '';
      var word = (data && data.word) ? data.word.toLowerCase() : '';
      if (word) {
        if (!day.nextWord) day.nextWord = {};
        if (!day.nextWord[ctx]) day.nextWord[ctx] = {};
        day.nextWord[ctx][word] = (day.nextWord[ctx][word] || 0) + 1;
      }
      break;
  }
  scheduleSave();
}

export function flushSession() {
  if (!cache || !sessionStart) return;
  const minutes = Math.round((Date.now() - sessionStart) / 60000);
  if (minutes > 0) {
    const day = ensureDay(cache, todayKey());
    day.sessionMinutes += minutes;
  }
  sessionStart = Date.now();
  scheduleSave();
}

// --- REPORT ACCESSORS ---

export function getRange(startDate, endDate) {
  if (!cache) return emptyDay();
  const result = emptyDay();
  const keys = Object.keys(cache.days).sort();
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] >= startDate && keys[i] <= endDate) {
      const d = cache.days[keys[i]];
      for (const w in d.cardTaps) {
        result.cardTaps[w] = (result.cardTaps[w] || 0) + d.cardTaps[w];
      }
      for (const dk in d.deckOpens) {
        result.deckOpens[dk] = (result.deckOpens[dk] || 0) + d.deckOpens[dk];
      }
      for (const ctx in (d.nextWord || {})) {
        if (!result.nextWord[ctx]) result.nextWord[ctx] = {};
        for (const w in d.nextWord[ctx]) {
          result.nextWord[ctx][w] = (result.nextWord[ctx][w] || 0) + d.nextWord[ctx][w];
        }
      }
      result.sentencesSpoken += d.sentencesSpoken;
      result.aiAssistUsed += d.aiAssistUsed;
      result.suggestionsUsed += d.suggestionsUsed;
      result.wordsPerSentence = result.wordsPerSentence.concat(d.wordsPerSentence || []);
      result.sessionMinutes += d.sessionMinutes;
    }
  }
  return result;
}

export function getToday() {
  const t = todayKey();
  return getRange(t, t);
}

export function getWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return getRange(start.toISOString().slice(0, 10), todayKey());
}

export function getMonth() {
  const now = new Date();
  const start = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-01';
  return getRange(start, todayKey());
}

export function getNextWordCounts() {
  if (!cache) return {};
  var result = {};
  var keys = Object.keys(cache.days);
  for (var i = 0; i < keys.length; i++) {
    var nw = cache.days[keys[i]].nextWord;
    if (!nw) continue;
    for (var ctx in nw) {
      if (!result[ctx]) result[ctx] = {};
      for (var w in nw[ctx]) {
        result[ctx][w] = (result[ctx][w] || 0) + nw[ctx][w];
      }
    }
  }
  return result;
}

export function deleteForProfile(profileName) {
  localStorage.removeItem(storageKey(profileName));
  if (typeof puter !== 'undefined' && puter.kv) {
    puter.kv.del(storageKey(profileName)).catch(function () {});
  }
}
