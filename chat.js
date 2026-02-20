// chat.js — AI-assisted speak: polish sentence via LLM before speaking
(function () {
  'use strict';

  function getPrompt() {
    return (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.aiPrompt() :
      'You are an AAC communication assistant. The user built this sequence of words by tapping picture cards: [WORDS]. Suggest ONE short, natural sentence that captures their intent. Reply with ONLY the sentence, nothing else.';
  }

  var CACHE_KEY = 'aac-ai-cache';

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
  var aiBar    = document.getElementById('stripAi');
  var aiText   = document.getElementById('stripAiText');
  var aiRetry  = document.getElementById('stripAiRetry');
  var originalSpeak = speakBtn.onclick;
  var busy = false;
  var lastAiText = '';       // last AI-generated sentence
  var lastRawLabels = '';    // the raw labels that produced it
  var skipTtsCache = false;  // set true on retry to force fresh audio

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
      if (andSpeak && originalSpeak) originalSpeak();
      busy = false;
      return;
    }
    puter.ai.chat(prompt).then(function (reply) {
      var text = reply.message.content.trim();
      if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.track('aiAssist');
      lastAiText = text;
      lastRawLabels = rawKey;
      saveToCache(lang, rawKey, text);
      aiText.textContent = text;
      aiBar.classList.remove('loading');
      updateAiBarState();
      if (andSpeak) speak(text);
    }).catch(function () {
      // Restore previous AI text on failure
      aiText.textContent = prevText || '';
      aiBar.classList.remove('loading');
      updateAiBarState();
      if (andSpeak) {
        if (prevText) speak(prevText);
        else if (originalSpeak) originalSpeak();
      }
    }).finally(function () {
      busy = false;
      skipTtsCache = false;
    });
  }

  speakBtn.onclick = function () {
    if (busy) return;
    if (!aiEnabled()) return originalSpeak && originalSpeak();

    var words = (typeof sentence !== 'undefined') ? sentence : [];
    if (words.length < 2) return originalSpeak && originalSpeak();

    var labels = words.map(function (w) { return w.label; });
    var rawKey = labels.join('|');
    var lang = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.getCurrent() : 'en';

    // If sentence hasn't changed since last AI call, just replay
    if (lastAiText && rawKey === lastRawLabels) {
      speak(lastAiText);
      return;
    }

    // Check persistent cache before calling the LLM
    var cached = lookupCache(lang, rawKey);
    if (cached) {
      lastAiText = cached;
      lastRawLabels = rawKey;
      aiText.textContent = cached;
      updateAiBarState();
      speak(cached);
      return;
    }

    callLLM(labels, rawKey, lang, true);
  };

  // Retry: force a fresh LLM call and fresh TTS audio
  aiRetry.onclick = function (e) {
    e.stopPropagation();
    if (busy) return;
    var words = (typeof sentence !== 'undefined') ? sentence : [];
    if (words.length < 2) return;
    var labels = words.map(function (w) { return w.label; });
    var rawKey = labels.join('|');
    var lang = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.getCurrent() : 'en';
    skipTtsCache = true;
    callLLM(labels, rawKey, lang, true);
  };

  // Tap AI text to replay
  aiText.addEventListener('click', function () {
    var text = aiText.textContent.trim();
    if (text && text !== '...') speak(text);
  });
  aiText.style.cursor = 'pointer';

  function speak(text) {
    if (typeof aacSpeak === 'function') { aacSpeak(text, skipTtsCache); return; }
  }

  function aiEnabled() {
    return localStorage.getItem('aac-friend-enabled') !== 'false';
  }

  // clear AI text when strip is cleared
  new MutationObserver(function () {
    var words = (typeof sentence !== 'undefined') ? sentence : [];
    if (words.length === 0) {
      aiText.textContent = '';
      lastAiText = '';
      lastRawLabels = '';
      aiBar.classList.remove('loading');
      updateAiBarState();
    }
  }).observe(document.getElementById('words'), { childList: true });
})();
