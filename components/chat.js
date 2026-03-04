// components/chat.js — AI sentence polishing via LLM (ES module)

import state from '../state.js';
import { on } from '../events.js';
import * as Lang from '../lang.js';
import * as Speech from '../services/speech.js';
import * as Stats from '../stats.js';

var CACHE_KEY = 'aac-ai-cache';

function getPrompt() {
  return Lang.aiPrompt() ||
    'You are an AAC communication assistant. The user built this sequence of words by tapping picture cards: [WORDS]. Suggest ONE short, natural sentence that captures their intent. Reply with ONLY the sentence, nothing else.';
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveToCache(lang, rawKey, text) {
  var cache = loadCache();
  if (!cache[lang]) cache[lang] = {};
  cache[lang][rawKey] = text;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function lookupCache(lang, rawKey) {
  var cache = loadCache();
  return cache[lang] && cache[lang][rawKey] || null;
}

var speakBtn = document.getElementById('bSpeak');
var aiBar = document.getElementById('stripAi');
var aiText = document.getElementById('stripAiText');
var aiRetry = document.getElementById('stripAiRetry');
var originalSpeak = null;
var busy = false;
var lastAiText = '';
var lastRawLabels = '';
var skipTtsCache = false;

function updateAiBarState() {
  var has = aiText.textContent.trim() && aiText.textContent.trim() !== '...';
  aiBar.classList.toggle('has-text', has);
}

function callLLM(labels, rawKey, lang, andSpeak) {
  busy = true;
  var prevText = lastAiText;
  aiText.textContent = '...';
  aiBar.classList.add('loading');
  updateAiBarState();

  var prompt = getPrompt().replace('[WORDS]', labels.join(', '));
  if (typeof puter === 'undefined' || !puter.ai || typeof puter.ai.chat !== 'function') {
    aiText.textContent = prevText || '';
    aiBar.classList.remove('loading');
    updateAiBarState();
    if (andSpeak) doSpeak(prevText || labels.join(' '));
    busy = false;
    return;
  }
  puter.ai.chat(prompt).then(function (reply) {
    var text = reply.message.content.trim();
    Stats.track('aiAssist');
    lastAiText = text;
    lastRawLabels = rawKey;
    saveToCache(lang, rawKey, text);
    aiText.textContent = text;
    aiBar.classList.remove('loading');
    updateAiBarState();
    if (andSpeak) doSpeak(text);
  }).catch(function () {
    aiText.textContent = prevText || '';
    aiBar.classList.remove('loading');
    updateAiBarState();
    if (andSpeak) {
      if (prevText) doSpeak(prevText);
      else speakRaw();
    }
  }).finally(function () {
    busy = false;
    skipTtsCache = false;
  });
}

function doSpeak(text) {
  Speech.speak(text, skipTtsCache);
}

function speakRaw() {
  var words = state.sentence;
  if (words.length === 0) return;
  var text = words.map(function (w) { return w.label; }).join(' ');
  Speech.speak(text);
}

function aiEnabled() {
  return localStorage.getItem('aac-friend-enabled') !== 'false';
}

export function init() {
  // Save original speak handler set by strip-ops
  originalSpeak = speakBtn.onclick;

  speakBtn.onclick = function () {
    if (busy) return;
    if (!aiEnabled()) { speakRaw(); return; }

    var words = state.sentence;
    if (words.length < 2) { speakRaw(); return; }

    var labels = words.map(function (w) { return w.label; });
    var rawKey = labels.join('|');
    var lang = Lang.getCurrent();

    if (lastAiText && rawKey === lastRawLabels) {
      doSpeak(lastAiText);
      return;
    }

    var cached = lookupCache(lang, rawKey);
    if (cached) {
      lastAiText = cached;
      lastRawLabels = rawKey;
      aiText.textContent = cached;
      updateAiBarState();
      doSpeak(cached);
      return;
    }

    callLLM(labels, rawKey, lang, true);
  };

  aiRetry.onclick = function (e) {
    e.stopPropagation();
    if (busy) return;
    var words = state.sentence;
    if (words.length < 2) return;
    var labels = words.map(function (w) { return w.label; });
    var rawKey = labels.join('|');
    var lang = Lang.getCurrent();
    skipTtsCache = true;
    callLLM(labels, rawKey, lang, true);
  };

  aiText.addEventListener('click', function () {
    var text = aiText.textContent.trim();
    if (text && text !== '...') doSpeak(text);
  });
  aiText.style.cursor = 'pointer';

  // Clear AI text when sentence is cleared
  on('sentence:clear', function () {
    aiText.textContent = '';
    lastAiText = '';
    lastRawLabels = '';
    aiBar.classList.remove('loading');
    updateAiBarState();
  });
}
