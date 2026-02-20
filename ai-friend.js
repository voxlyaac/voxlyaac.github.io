// ai-friend.js — Word Suggestion Engine for AAC
(function () {
  'use strict';

  // === CONFIG ===
  var CONFIG = {
    storageKeys: {
      enabled: 'aac-friend-enabled',
      suggestions: 'aac-friend-suggestions'
    }
  };

  // === SUGGESTION MAP (from language pack) ===
  function getSuggestionsMap() {
    return (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.suggestions() : {};
  }

  // === STATE ===
  var state = {
    enabled: true,
    suggestionsEnabled: true,
    suggestDebounce: null
  };

  // === WORD INDEX (built from DECKS at init) ===
  var WORD_INDEX = {};

  function buildWordIndex() {
    if (typeof DECKS === 'undefined') return;
    var categories = Object.keys(DECKS);
    for (var ci = 0; ci < categories.length; ci++) {
      var cat = categories[ci];
      var deck = DECKS[cat];
      for (var wi = 0; wi < deck.w.length; wi++) {
        var word = deck.w[wi];
        WORD_INDEX[word.l.toLowerCase()] = {
          emoji: word.e,
          label: word.l,
          color: deck.hex,
          img: word.img || null
        };
      }
    }
  }

  // === SUGGESTION ENGINE ===
  function getSuggestions(sentenceArr) {
    var map = getSuggestionsMap();
    if (!sentenceArr || sentenceArr.length === 0) {
      return resolveSuggestions(map[''] || []);
    }

    var labels = sentenceArr.map(function (w) { return w.label.toLowerCase(); });

    // Try two-word key first (last two words)
    if (labels.length >= 2) {
      var twoKey = labels[labels.length - 2] + ' ' + labels[labels.length - 1];
      if (map[twoKey]) {
        return resolveSuggestions(map[twoKey], labels);
      }
    }

    // Try single-word key (last word)
    var oneKey = labels[labels.length - 1];
    if (map[oneKey]) {
      return resolveSuggestions(map[oneKey], labels);
    }

    // Fallback: use the starter suggestions
    var fallback = map[''] || [];
    return resolveSuggestions(fallback, labels);
  }

  function resolveSuggestions(labelList, currentLabels) {
    var results = [];
    var used = currentLabels || [];
    for (var i = 0; i < labelList.length && results.length < 4; i++) {
      var key = labelList[i].toLowerCase();
      // Skip words already in the sentence (avoid "I I I")
      if (used.indexOf(key) !== -1) continue;
      var data = WORD_INDEX[key];
      if (data) {
        results.push({ emoji: data.emoji, label: data.label, color: data.color, img: data.img });
      }
    }
    return results;
  }

  // === SUGGESTION UI ===
  var suggestBar, suggestPills;
  function initSuggestions() {
    suggestBar = document.getElementById('suggestBar');
    suggestPills = document.getElementById('suggestPills');
    if (!suggestBar) return;
  }

  function updateSuggestions() {
    if (!state.enabled || !state.suggestionsEnabled) {
      hideSuggestions();
      return;
    }
    if (!suggestBar || !suggestPills) return;

    // Rebuild index so edits to cards are picked up immediately
    buildWordIndex();

    var currentSentence = (typeof sentence !== 'undefined') ? sentence : [];
    var suggestions = getSuggestions(currentSentence);

    if (suggestions.length === 0) {
      hideSuggestions();
      return;
    }

    suggestPills.innerHTML = '';
    for (var i = 0; i < suggestions.length; i++) {
      var s = suggestions[i];
      var pill = document.createElement('button');
      pill.className = 'suggest-pill';
      pill.style.setProperty('--pill-c', s.color);
      pill.style.animationDelay = (i * 40) + 'ms';
      pill.setAttribute('type', 'button');
      pill.dataset.emoji = s.emoji;
      pill.dataset.label = s.label;
      pill.dataset.color = s.color;
      if (s.img) pill.dataset.img = s.img;

      if (s.img) {
        var imgEl = document.createElement('img');
        imgEl.className = 'pill-img';
        imgEl.src = s.img;
        imgEl.alt = s.label;
        pill.appendChild(imgEl);
      } else {
        var eSpan = document.createElement('span');
        eSpan.className = 'pill-e';
        eSpan.textContent = s.emoji;
        pill.appendChild(eSpan);
      }

      var lSpan = document.createElement('span');
      lSpan.className = 'pill-l';
      lSpan.textContent = s.label;
      if (typeof settings !== 'undefined' && !settings.labels) {
        lSpan.style.display = 'none';
      }
      pill.appendChild(lSpan);

      pill.addEventListener('click', (function (emoji, label, color, img) {
        return function () {
          if (typeof addWord === 'function') {
            addWord(emoji, label, color, img);
          }
          if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.track('suggestionUsed');
        };
      })(s.emoji, s.label, s.color, s.img));

      suggestPills.appendChild(pill);
    }

    suggestBar.classList.add('vis');
  }

  function hideSuggestions() {
    if (suggestBar) suggestBar.classList.remove('vis');
  }

  // === SENTENCE CHANGE DETECTION ===
  function hookSentenceChanges() {
    var wordsEl = document.getElementById('words');
    if (!wordsEl) return;

    var observer = new MutationObserver(function () {
      clearTimeout(state.suggestDebounce);
      state.suggestDebounce = setTimeout(updateSuggestions, 50);
    });
    observer.observe(wordsEl, { childList: true });

    // Also watch the placeholder visibility to detect empty state
    var phEl = document.getElementById('ph');
    if (phEl) {
      var phObserver = new MutationObserver(function () {
        clearTimeout(state.suggestDebounce);
        state.suggestDebounce = setTimeout(updateSuggestions, 50);
      });
      phObserver.observe(phEl, { attributes: true, attributeFilter: ['style'] });
    }
  }

  // === SETTINGS ===
  function hookSettings() {
    // AI Friend toggle
    var tog = document.getElementById('togCompanion');
    if (tog) {
      tog.classList.toggle('on', state.enabled);
      tog.onclick = function () {
        state.enabled = !state.enabled;
        this.classList.toggle('on', state.enabled);
        localStorage.setItem(CONFIG.storageKeys.enabled, state.enabled);
        if (typeof Profiles !== 'undefined') Profiles.save();
        updateStripAi();
        if (!state.enabled) {
          hideSuggestions();
        } else {
          updateSuggestions();
        }
      };
    }

    // Word hints toggle
    var togSugg = document.getElementById('togSuggestions');
    if (togSugg) {
      togSugg.classList.toggle('on', state.suggestionsEnabled);
      togSugg.onclick = function () {
        state.suggestionsEnabled = !state.suggestionsEnabled;
        this.classList.toggle('on', state.suggestionsEnabled);
        localStorage.setItem(CONFIG.storageKeys.suggestions, state.suggestionsEnabled);
        if (typeof Profiles !== 'undefined') Profiles.save();
        if (state.suggestionsEnabled) updateSuggestions();
        else hideSuggestions();
      };
    }

  }

  // === STRIP-AI VISIBILITY ===
  function updateStripAi() {
    var el = document.getElementById('stripAi');
    if (el) el.style.display = state.enabled ? '' : 'none';
  }

  // === INIT ===
  function init() {
    // Load settings
    state.enabled = localStorage.getItem(CONFIG.storageKeys.enabled) !== 'false';
    state.suggestionsEnabled = localStorage.getItem(CONFIG.storageKeys.suggestions) !== 'false';

    // Build word lookup from DECKS
    buildWordIndex();

    // Init suggestion UI
    initSuggestions();

    // Watch for sentence changes to update suggestions
    hookSentenceChanges();

    // Wire settings
    hookSettings();

    // Show/hide strip-ai based on AI assist state
    updateStripAi();

    // Show initial suggestions (sentence starters)
    updateSuggestions();
  }

  // Expose reinit for profile switching
  window.aacFriendReinit = init;
  // Expose refresh for card/deck edits
  window.aacFriendRefresh = updateSuggestions;

  // === BOOT ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
