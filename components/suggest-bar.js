// components/suggest-bar.js — Word suggestion engine (ES module)

import state from '../state.js';
import { on } from '../events.js';
import * as Lang from '../lang.js';
import * as Stats from '../stats.js';
import { addWord } from './strip.js';

var suggestBar = document.getElementById('suggestBar');
var suggestPills = document.getElementById('suggestPills');

var enabled = true;
var suggestionsEnabled = true;
var suggestDebounce = null;

var WORD_INDEX = {};

function buildWordIndex() {
  WORD_INDEX = {};
  var decks = state.DECKS;
  var categories = Object.keys(decks);
  for (var ci = 0; ci < categories.length; ci++) {
    var cat = categories[ci];
    var deck = decks[cat];
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

function getContextKey(sentenceArr) {
  if (!sentenceArr || sentenceArr.length === 0) return '';
  var labels = sentenceArr.map(function (w) { return w.label.toLowerCase(); });
  if (labels.length >= 2) return labels[labels.length - 2] + ' ' + labels[labels.length - 1];
  return labels[labels.length - 1];
}

function getStaticList(map, sentenceArr) {
  if (!sentenceArr || sentenceArr.length === 0) return map[''] || [];
  var labels = sentenceArr.map(function (w) { return w.label.toLowerCase(); });
  if (labels.length >= 2) {
    var twoKey = labels[labels.length - 2] + ' ' + labels[labels.length - 1];
    if (map[twoKey]) return map[twoKey];
  }
  var oneKey = labels[labels.length - 1];
  if (map[oneKey]) return map[oneKey];
  return map[''] || [];
}

function mergeLearnedSuggestions(staticList, contextKey, currentLabels) {
  var learned = Stats.getNextWordCounts();
  var learnedForCtx = learned[contextKey];
  // Fallback: if two-word context has no data, try one-word context
  if (!learnedForCtx && contextKey.indexOf(' ') !== -1) {
    var oneWord = contextKey.split(' ').pop();
    learnedForCtx = learned[oneWord];
  }

  var used = currentLabels || [];
  var seen = {};
  var all = [];

  // Add static words with their learned counts (or 0)
  for (var i = 0; i < staticList.length; i++) {
    var sw = staticList[i].toLowerCase();
    if (used.indexOf(sw) !== -1 || seen[sw]) continue;
    seen[sw] = true;
    all.push({ word: sw, count: learnedForCtx ? (learnedForCtx[sw] || 0) : 0 });
  }

  // Add learned words not already included
  if (learnedForCtx) {
    for (var w in learnedForCtx) {
      if (!seen[w] && used.indexOf(w) === -1 && WORD_INDEX[w]) {
        seen[w] = true;
        all.push({ word: w, count: learnedForCtx[w] });
      }
    }
  }

  // Sort by count descending — most used first (leftmost pill)
  all.sort(function (a, b) { return b.count - a.count; });

  // Return top words (resolveSuggestions caps at 4)
  var result = [];
  for (var j = 0; j < all.length; j++) {
    result.push(all[j].word);
  }
  return result;
}

function getSuggestions(sentenceArr) {
  var map = Lang.suggestions() || {};
  var currentLabels = (sentenceArr || []).map(function (w) { return w.label.toLowerCase(); });
  var staticList = getStaticList(map, sentenceArr);
  var contextKey = getContextKey(sentenceArr);
  var merged = mergeLearnedSuggestions(staticList, contextKey, currentLabels);
  return resolveSuggestions(merged, currentLabels);
}

function resolveSuggestions(labelList, currentLabels) {
  var results = [];
  var used = currentLabels || [];
  for (var i = 0; i < labelList.length && results.length < 4; i++) {
    var key = labelList[i].toLowerCase();
    if (used.indexOf(key) !== -1) continue;
    var data = WORD_INDEX[key];
    if (data) {
      results.push({ emoji: data.emoji, label: data.label, color: data.color, img: data.img });
    }
  }
  return results;
}

export function updateSuggestions() {
  if (!enabled || !suggestionsEnabled) { hideSuggestions(); return; }
  if (!suggestBar || !suggestPills) return;

  buildWordIndex();

  var suggestions = getSuggestions(state.sentence);
  if (suggestions.length === 0) { hideSuggestions(); return; }

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
    if (!state.settings.labels) lSpan.style.display = 'none';
    pill.appendChild(lSpan);

    pill.addEventListener('click', (function (emoji, label, color, img) {
      return function () {
        addWord(emoji, label, color, img);
        Stats.track('suggestionUsed');
      };
    })(s.emoji, s.label, s.color, s.img));

    suggestPills.appendChild(pill);
  }
  suggestBar.classList.add('vis');
}

function hideSuggestions() {
  if (suggestBar) suggestBar.classList.remove('vis');
}

function updateStripAi() {
  var el = document.getElementById('stripAi');
  if (el) el.style.display = enabled ? '' : 'none';
}

function syncFromStorage() {
  enabled = localStorage.getItem('aac-friend-enabled') !== 'false';
  suggestionsEnabled = localStorage.getItem('aac-friend-suggestions') !== 'false';
  updateStripAi();
  if (enabled && suggestionsEnabled) updateSuggestions();
  else hideSuggestions();
}

export function reinit() {
  enabled = localStorage.getItem('aac-friend-enabled') !== 'false';
  suggestionsEnabled = localStorage.getItem('aac-friend-suggestions') !== 'false';
  buildWordIndex();
  updateStripAi();
  updateSuggestions();
}

export function init() {
  enabled = localStorage.getItem('aac-friend-enabled') !== 'false';
  suggestionsEnabled = localStorage.getItem('aac-friend-suggestions') !== 'false';
  buildWordIndex();
  updateStripAi();

  // React to AI toggle changes from settings.js
  on('settings:change', function (d) {
    if (d.key === 'companion' || d.key === 'suggestions') syncFromStorage();
  });

  // Listen to events instead of MutationObserver
  on('sentence:change', function () {
    clearTimeout(suggestDebounce);
    suggestDebounce = setTimeout(updateSuggestions, 50);
  });
  on('sentence:clear', function () {
    clearTimeout(suggestDebounce);
    suggestDebounce = setTimeout(updateSuggestions, 50);
  });
  on('deck:open', function () {
    hideSuggestions();
  });
  on('deck:close', function () {
    updateSuggestions();
  });
  on('deck:change', function () {
    buildWordIndex();
    updateSuggestions();
  });

  updateSuggestions();
}
