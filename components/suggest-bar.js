// components/suggest-bar.js — Word suggestion engine (ES module)

import state from '../state.js';
import { on } from '../events.js';
import * as Lang from '../lang.js';
import * as Stats from '../stats.js';
import * as Profiles from '../profiles.js';
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

function getSuggestions(sentenceArr) {
  var map = Lang.suggestions() || {};
  if (!sentenceArr || sentenceArr.length === 0) {
    return resolveSuggestions(map[''] || []);
  }
  var labels = sentenceArr.map(function (w) { return w.label.toLowerCase(); });
  if (labels.length >= 2) {
    var twoKey = labels[labels.length - 2] + ' ' + labels[labels.length - 1];
    if (map[twoKey]) return resolveSuggestions(map[twoKey], labels);
  }
  var oneKey = labels[labels.length - 1];
  if (map[oneKey]) return resolveSuggestions(map[oneKey], labels);
  return resolveSuggestions(map[''] || [], labels);
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

function hookSettings() {
  var tog = document.getElementById('togCompanion');
  if (tog) {
    tog.classList.toggle('on', enabled);
    tog.onclick = function () {
      enabled = !enabled;
      this.classList.toggle('on', enabled);
      localStorage.setItem('aac-friend-enabled', enabled);
      Profiles.save();
      updateStripAi();
      if (!enabled) hideSuggestions();
      else updateSuggestions();
    };
  }

  var togSugg = document.getElementById('togSuggestions');
  if (togSugg) {
    togSugg.classList.toggle('on', suggestionsEnabled);
    togSugg.onclick = function () {
      suggestionsEnabled = !suggestionsEnabled;
      this.classList.toggle('on', suggestionsEnabled);
      localStorage.setItem('aac-friend-suggestions', suggestionsEnabled);
      Profiles.save();
      if (suggestionsEnabled) updateSuggestions();
      else hideSuggestions();
    };
  }
}

export function reinit() {
  enabled = localStorage.getItem('aac-friend-enabled') !== 'false';
  suggestionsEnabled = localStorage.getItem('aac-friend-suggestions') !== 'false';
  buildWordIndex();
  hookSettings();
  updateStripAi();
  updateSuggestions();
}

export function init() {
  enabled = localStorage.getItem('aac-friend-enabled') !== 'false';
  suggestionsEnabled = localStorage.getItem('aac-friend-suggestions') !== 'false';
  buildWordIndex();
  hookSettings();
  updateStripAi();

  // Listen to events instead of MutationObserver
  on('sentence:change', function () {
    clearTimeout(suggestDebounce);
    suggestDebounce = setTimeout(updateSuggestions, 50);
  });
  on('sentence:clear', function () {
    clearTimeout(suggestDebounce);
    suggestDebounce = setTimeout(updateSuggestions, 50);
  });
  on('deck:change', function () {
    buildWordIndex();
    updateSuggestions();
  });

  updateSuggestions();
}
