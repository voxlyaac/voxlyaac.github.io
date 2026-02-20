// stats.js — Usage statistics collection for AAC app
window.AAC = window.AAC || {};
window.AAC.Stats = (function () {
  'use strict';

  var PREFIX = 'aac-stats:';
  var CLOUD_DELAY = 5000;
  var SAVE_DELAY = 2000;
  var MAX_AGE_DAYS = 90;

  var cloudTimers = {};
  var saveTimer = null;
  var cache = null;
  var currentProfile = null;
  var sessionStart = null;

  // --- HELPERS ---

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function emptyDay() {
    return {
      cardTaps: {},
      deckOpens: {},
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
      var raw = localStorage.getItem(storageKey(profileName));
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
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
    var cutoffKey = cutoff.toISOString().slice(0, 10);
    var keys = Object.keys(stats.days);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] < cutoffKey) delete stats.days[keys[i]];
    }
  }

  // --- PUBLIC API ---

  function init(profileName) {
    if (saveTimer && currentProfile && cache) {
      clearTimeout(saveTimer);
      saveToStorage(currentProfile, cache);
    }
    currentProfile = profileName;
    cache = loadFromStorage(profileName) || emptyStats();
    prune(cache);
    sessionStart = Date.now();
  }

  function track(event, data) {
    if (!cache) return;
    var day = ensureDay(cache, todayKey());
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
    }
    scheduleSave();
  }

  function flushSession() {
    if (!cache || !sessionStart) return;
    var minutes = Math.round((Date.now() - sessionStart) / 60000);
    if (minutes > 0) {
      var day = ensureDay(cache, todayKey());
      day.sessionMinutes += minutes;
    }
    sessionStart = Date.now();
    scheduleSave();
  }

  // --- REPORT ACCESSORS ---

  function getRange(startDate, endDate) {
    if (!cache) return emptyDay();
    var result = emptyDay();
    var keys = Object.keys(cache.days).sort();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] >= startDate && keys[i] <= endDate) {
        var d = cache.days[keys[i]];
        for (var w in d.cardTaps) {
          result.cardTaps[w] = (result.cardTaps[w] || 0) + d.cardTaps[w];
        }
        for (var dk in d.deckOpens) {
          result.deckOpens[dk] = (result.deckOpens[dk] || 0) + d.deckOpens[dk];
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

  function getToday() {
    var t = todayKey();
    return getRange(t, t);
  }

  function getWeek() {
    var now = new Date();
    var start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return getRange(start.toISOString().slice(0, 10), todayKey());
  }

  function getMonth() {
    var now = new Date();
    var start = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-01';
    return getRange(start, todayKey());
  }

  function deleteForProfile(profileName) {
    localStorage.removeItem(storageKey(profileName));
    if (typeof puter !== 'undefined' && puter.kv) {
      puter.kv.del(storageKey(profileName)).catch(function () {});
    }
  }

  return {
    init: init,
    track: track,
    flushSession: flushSession,
    getToday: getToday,
    getWeek: getWeek,
    getMonth: getMonth,
    getRange: getRange,
    deleteForProfile: deleteForProfile
  };
})();
