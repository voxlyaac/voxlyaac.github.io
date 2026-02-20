// lang.js — Language manager for AAC app
// Load this BEFORE language packs and all other scripts.
window.AAC = window.AAC || {};
window.AAC.Lang = (function () {
  'use strict';

  var packs = {};
  var current = null;
  var fallback = 'en';

  function register(code, pack) {
    packs[code] = pack;
    if (!current) current = code;
  }

  function list() {
    var result = [];
    for (var code in packs) {
      if (packs.hasOwnProperty(code)) {
        result.push({ code: code, name: packs[code].name, nativeName: packs[code].nativeName });
      }
    }
    return result;
  }

  function get(code) {
    return packs[code] || packs[fallback] || null;
  }

  function set(code) {
    if (!packs[code]) code = fallback;
    current = code;
    var pack = packs[code];
    if (!pack) return;
    document.documentElement.dir = pack.dir || 'ltr';
    document.documentElement.lang = code;
    applyUI(pack.ui);
  }

  function applyUI(ui) {
    if (!ui) return;
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (ui[key] !== undefined) {
        els[i].textContent = typeof ui[key] === 'function' ? ui[key]() : ui[key];
      }
    }
    els = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < els.length; j++) {
      var phKey = els[j].getAttribute('data-i18n-ph');
      if (ui[phKey] !== undefined) {
        els[j].placeholder = ui[phKey];
      }
    }
  }

  function p() { return packs[current] || packs[fallback]; }

  function t(key) {
    var pk = p();
    return pk && pk.ui[key] !== undefined ? pk.ui[key] : key;
  }

  return {
    register: register,
    list: list,
    get: get,
    set: set,
    getCurrent: function () { return current || fallback; },
    t: t,
    suggestions: function () { var pk = p(); return pk ? pk.suggestions : {}; },
    aiPrompt: function () { var pk = p(); return pk ? pk.aiPrompt : ''; },
    defaults: function () { var pk = p(); return pk ? pk.defaults : { decks: {}, binders: {} }; },
    voiceFilter: function () { var pk = p(); return pk ? pk.voiceFilter : ''; },
    dir: function () { var pk = p(); return pk ? (pk.dir || 'ltr') : 'ltr'; }
  };
})();
