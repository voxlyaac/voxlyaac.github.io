// profiles.js — Multi-profile persistence (localStorage + puter.kv cloud)
window.Profiles = (function () {
  'use strict';

  var INDEX_KEY = 'aac-profiles-index';
  var PREFIX = 'aac-profile:';
  var SAVE_DELAY = 800;
  var CLOUD_DELAY = 5000;

  var saveTimer = null;
  var cloudTimers = {};

  // --- INDEX ---

  function getIndex() {
    try {
      var raw = localStorage.getItem(INDEX_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function setIndex(idx) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    cloudPush(INDEX_KEY, idx);
  }

  function ensureIndex() {
    var idx = getIndex();
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
      decks: (typeof DECKS !== 'undefined') ? DECKS : {},
      binders: (typeof BINDERS !== 'undefined') ? BINDERS : {},
      currentBinder: (typeof currentBinder !== 'undefined') ? currentBinder : 'all',
      settings: (typeof settings !== 'undefined') ? settings : { sound: true, labels: true, anim: true },
      aiSettings: {
        enabled: localStorage.getItem('aac-friend-enabled') !== 'false',
        suggestions: localStorage.getItem('aac-friend-suggestions') !== 'false'
      },
      voice: localStorage.getItem('aac-voice') || '',
      voiceEngine: localStorage.getItem('aac-voice-engine') || 'browser',
      voiceSpeed: parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85,
      lang: (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.getCurrent() : 'en'
    };
  }

  function apply(data) {
    if (typeof DECKS !== 'undefined') DECKS = data.decks || {};
    if (typeof BINDERS !== 'undefined') BINDERS = data.binders || {};
    if (typeof currentBinder !== 'undefined') currentBinder = data.currentBinder || 'all';
    if (typeof settings !== 'undefined') {
      var s = data.settings || {};
      settings.sound = s.sound !== false;
      settings.labels = s.labels !== false;
      settings.anim = s.anim !== false;
    }
    if (data.aiSettings) {
      localStorage.setItem('aac-friend-enabled', String(data.aiSettings.enabled !== false));
      localStorage.setItem('aac-friend-suggestions', String(data.aiSettings.suggestions !== false));
    }
    localStorage.setItem('aac-voice', data.voice || '');
    localStorage.setItem('aac-voice-engine', data.voiceEngine || 'browser');
    localStorage.setItem('aac-voice-speed', String(data.voiceSpeed || 0.85));
    if (typeof AAC !== 'undefined' && AAC.Lang) {
      AAC.Lang.set(data.lang || 'en');
    }
    // Migrate: add any new default decks missing from saved profile
    migrateDecks();
  }

  function migrateDecks() {
    var langDefaults = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.defaults() : null;
    if (!langDefaults || typeof DECKS === 'undefined') return;
    var defaultDecks = langDefaults.decks;
    for (var key in defaultDecks) {
      if (!defaultDecks.hasOwnProperty(key)) continue;
      if (!DECKS[key]) {
        DECKS[key] = JSON.parse(JSON.stringify(defaultDecks[key]));
      }
    }
  }

  // --- PROFILE CRUD ---

  function saveToStorage(name, data) {
    var key = PREFIX + name;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // storage full
    }
    cloudPush(key, data);
  }

  function loadFromStorage(name) {
    try {
      var raw = localStorage.getItem(PREFIX + name);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function load() {
    var idx = ensureIndex();
    var data = loadFromStorage(idx.active);
    if (!data) {
      data = snapshot();
      saveToStorage(idx.active, data);
    }
    apply(data);
    return idx.active;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var idx = getIndex();
      if (!idx) return;
      saveToStorage(idx.active, snapshot());
    }, SAVE_DELAY);
  }

  function switchProfile(name) {
    var idx = getIndex();
    if (idx) saveToStorage(idx.active, snapshot());
    idx.active = name;
    setIndex(idx);
    var data = loadFromStorage(name);
    if (!data) {
      data = getDefaults();
      saveToStorage(name, data);
    }
    apply(data);
  }

  function createProfile(name) {
    var idx = ensureIndex();
    var key = name.toLowerCase().trim();
    if (!key || idx.profiles.indexOf(key) !== -1) return false;
    idx.profiles.push(key);
    setIndex(idx);
    saveToStorage(key, getDefaults());
    return true;
  }

  function deleteProfile(name) {
    if (name === 'default') return false;
    var idx = getIndex();
    if (!idx) return false;
    var i = idx.profiles.indexOf(name);
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

  function listProfiles() {
    var idx = ensureIndex();
    return { profiles: idx.profiles.slice(), active: idx.active, avatars: idx.avatars || {} };
  }

  function setAvatar(name, avatar) {
    var idx = ensureIndex();
    if (!idx.avatars) idx.avatars = {};
    idx.avatars[name] = avatar;
    setIndex(idx);
  }

  function renameProfile(oldName, newName) {
    if (oldName === 'default') return false;
    var key = newName.toLowerCase().trim();
    if (!key || key === oldName) return false;
    var idx = ensureIndex();
    if (idx.profiles.indexOf(key) !== -1) return false;
    var i = idx.profiles.indexOf(oldName);
    if (i === -1) return false;
    // Rename in profile list
    idx.profiles[i] = key;
    if (idx.active === oldName) idx.active = key;
    // Move avatar data
    if (idx.avatars && idx.avatars[oldName]) {
      if (!idx.avatars) idx.avatars = {};
      idx.avatars[key] = idx.avatars[oldName];
      delete idx.avatars[oldName];
    }
    setIndex(idx);
    // Move profile data in storage
    var data = loadFromStorage(oldName);
    if (data) {
      saveToStorage(key, data);
      localStorage.removeItem(PREFIX + oldName);
    }
    // Move stats
    var stats = localStorage.getItem('aac-stats:' + oldName);
    if (stats) {
      localStorage.setItem('aac-stats:' + key, stats);
      localStorage.removeItem('aac-stats:' + oldName);
    }
    return true;
  }

  function getDefaults() {
    var langDefaults = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.defaults() : null;
    var decks = langDefaults ? langDefaults.decks : {};
    var binders = langDefaults ? langDefaults.binders : {};
    return {
      version: 1,
      decks: JSON.parse(JSON.stringify(decks)),
      binders: JSON.parse(JSON.stringify(binders)),
      currentBinder: Object.keys(binders)[0] || 'all',
      settings: { sound: true, labels: true, anim: true },
      aiSettings: { enabled: true, suggestions: true },
      voiceEngine: 'browser',
      lang: (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.getCurrent() : 'en'
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

  function pullFromCloud() {
    if (typeof puter === 'undefined' || !puter.kv) return Promise.resolve();
    return puter.kv.get(INDEX_KEY).then(function (raw) {
      if (!raw) return;
      var cloudIdx;
      try { cloudIdx = JSON.parse(raw); } catch (e) { return; }
      var localIdx = ensureIndex();
      var changed = false;
      for (var i = 0; i < cloudIdx.profiles.length; i++) {
        if (localIdx.profiles.indexOf(cloudIdx.profiles[i]) === -1) {
          localIdx.profiles.push(cloudIdx.profiles[i]);
          changed = true;
        }
      }
      if (changed) setIndex(localIdx);
      var pulls = [];
      for (var j = 0; j < localIdx.profiles.length; j++) {
        (function (p) {
          var key = PREFIX + p;
          if (!localStorage.getItem(key)) {
            pulls.push(puter.kv.get(key).then(function (val) {
              if (val) localStorage.setItem(key, val);
            }).catch(function () {}));
          }
          var statsKey = 'aac-stats:' + p;
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

  return {
    load: load,
    save: save,
    switchProfile: switchProfile,
    createProfile: createProfile,
    deleteProfile: deleteProfile,
    listProfiles: listProfiles,
    setAvatar: setAvatar,
    renameProfile: renameProfile,
    pullFromCloud: pullFromCloud
  };
})();
