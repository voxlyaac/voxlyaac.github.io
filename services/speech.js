// speech.js — TTS / speech service (ES module)

import * as Lang from '../lang.js';

// ---------------------------------------------------------------------------
// Voice selection state
// ---------------------------------------------------------------------------
let voiceList = [];
let selectedEngine = localStorage.getItem('aac-voice-engine') || 'browser';
let selectedVoiceURI = localStorage.getItem('aac-voice') || '';
let selectedRate = parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85;

// ---------------------------------------------------------------------------
// Puter AI voice definitions
// ---------------------------------------------------------------------------
var PUTER_VOICES = {
  polly: [
    // English (US)
    { id: 'Joanna', label: 'Joanna', lang: 'en-US', engine: 'neural' },
    { id: 'Matthew', label: 'Matthew', lang: 'en-US', engine: 'neural' },
    { id: 'Salli', label: 'Salli', lang: 'en-US', engine: 'neural' },
    { id: 'Kendra', label: 'Kendra', lang: 'en-US', engine: 'neural' },
    { id: 'Ivy', label: 'Ivy (child)', lang: 'en-US', engine: 'standard' },
    { id: 'Kevin', label: 'Kevin (child)', lang: 'en-US', engine: 'standard' },
    // English (GB)
    { id: 'Amy', label: 'Amy (UK)', lang: 'en-GB', engine: 'neural' },
    { id: 'Brian', label: 'Brian (UK)', lang: 'en-GB', engine: 'neural' },
    { id: 'Emma', label: 'Emma (UK)', lang: 'en-GB', engine: 'neural' },
    // Portuguese (BR)
    { id: 'Camila', label: 'Camila', lang: 'pt-BR', engine: 'neural' },
    { id: 'Vitória', label: 'Vitória', lang: 'pt-BR', engine: 'neural' },
    { id: 'Ricardo', label: 'Ricardo', lang: 'pt-BR', engine: 'neural' },
    // Portuguese (PT)
    { id: 'Inês', label: 'Inês (PT)', lang: 'pt-PT', engine: 'neural' }
  ],
  openai: [
    { id: 'nova', label: 'Nova' },
    { id: 'coral', label: 'Coral' },
    { id: 'alloy', label: 'Alloy' },
    { id: 'shimmer', label: 'Shimmer' },
    { id: 'echo', label: 'Echo' },
    { id: 'fable', label: 'Fable' },
    { id: 'onyx', label: 'Onyx' },
    { id: 'sage', label: 'Sage' },
    { id: 'ash', label: 'Ash' },
    { id: 'ballad', label: 'Ballad' }
  ],
  elevenlabs: [
    { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel' },
    { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella' },
    { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh' },
    { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam' }
  ]
};

// ---------------------------------------------------------------------------
// Language support per engine
// ---------------------------------------------------------------------------
var ENGINE_LANGS = {
  polly: ['en', 'pt', 'ar', 'ca', 'zh', 'cs', 'da', 'nl', 'fi', 'fr', 'hi', 'de', 'is', 'it', 'ja', 'ko', 'nb', 'pl', 'ro', 'ru', 'es', 'sv', 'tr', 'cy'],
  openai: null,      // multilingual — supports all languages via instructions param
  elevenlabs: ['en', 'pt', 'es', 'fr', 'de', 'it', 'pl', 'ja', 'ko', 'zh', 'nl', 'ru', 'sv', 'da', 'fi', 'nb', 'tr', 'ro', 'cs', 'hi', 'ar']
};

function getPollyVoices() {
  var filter = Lang.voiceFilter();
  var all = PUTER_VOICES.polly;
  var filtered = all.filter(function (v) { return v.lang.toLowerCase().startsWith(filter); });
  return filtered.length ? filtered : all;
}

function hasPuter() {
  return typeof puter !== 'undefined' && puter.ai && typeof puter.ai.txt2speech === 'function';
}

function engineSupportsLang(engineId) {
  if (engineId === 'browser') return true;
  var supported = ENGINE_LANGS[engineId];
  if (!supported) return true; // null = all languages
  var lang = Lang.getCurrent();
  return supported.indexOf(lang) !== -1;
}

// ---------------------------------------------------------------------------
// TTS cache
// ---------------------------------------------------------------------------
var _puterAudioPlaying = null;
var _ttsCache = {};
var _TTS_CACHE_MAX = 100;

function ttsCacheKey(text) {
  return selectedEngine + ':' + (selectedVoiceURI || '') + ':' + Lang.getCurrent() + ':' + text;
}

function ttsCacheStore(key, audio) {
  var keys = Object.keys(_ttsCache);
  if (keys.length >= _TTS_CACHE_MAX) delete _ttsCache[keys[0]];
  _ttsCache[key] = audio;
}

// ---------------------------------------------------------------------------
// Playback helpers
// ---------------------------------------------------------------------------
function playPuterAudio(audio) {
  if (_puterAudioPlaying) {
    try { _puterAudioPlaying.pause(); _puterAudioPlaying.currentTime = 0; } catch (e) {}
    _puterAudioPlaying = null;
  }
  _puterAudioPlaying = audio;
  audio.currentTime = 0;
  audio.play();
  audio.onended = function () { _puterAudioPlaying = null; };
}

// ---------------------------------------------------------------------------
// TTS functions
// ---------------------------------------------------------------------------
export function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return null;
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.rate = selectedRate;
  u.lang = Lang.getCurrent();
  if (selectedVoiceURI) {
    var v = voiceList.find(function (v) { return v.voiceURI === selectedVoiceURI; });
    if (v) u.voice = v;
  }
  speechSynthesis.speak(u);
  return u;
}

export function speakPuter(text, skipCache) {
  if (!hasPuter()) return speakBrowser(text);
  var cKey = ttsCacheKey(text);
  // Serve from cache unless caller wants a fresh fetch
  if (!skipCache && _ttsCache[cKey]) {
    playPuterAudio(_ttsCache[cKey]);
    return null;
  }
  // Stop any currently playing Puter audio
  if (_puterAudioPlaying) {
    try { _puterAudioPlaying.pause(); _puterAudioPlaying.currentTime = 0; } catch (e) {}
    _puterAudioPlaying = null;
  }
  var opts = {};
  var langPack = Lang.get(Lang.getCurrent());
  var langName = langPack ? langPack.name : 'English';
  if (selectedEngine === 'polly') {
    var pollyVoice = selectedVoiceURI || 'Joanna';
    var pollyEntry = PUTER_VOICES.polly.find(function (v) { return v.id === pollyVoice; });
    opts.voice = pollyVoice;
    opts.engine = pollyEntry ? pollyEntry.engine : 'standard';
    opts.language = pollyEntry ? pollyEntry.lang : 'en-US';
  } else if (selectedEngine === 'openai') {
    opts.provider = 'openai';
    opts.model = 'gpt-4o-mini-tts';
    opts.voice = selectedVoiceURI || 'nova';
    opts.instructions = 'Speak clearly in ' + langName + '. This is an AAC communication aid.';
  } else if (selectedEngine === 'elevenlabs') {
    opts.provider = 'elevenlabs';
    opts.model = 'eleven_multilingual_v2';
    opts.voice = selectedVoiceURI || '21m00Tcm4TlvDq8ikWAM';
  }
  puter.ai.txt2speech(text, opts).then(function (audio) {
    ttsCacheStore(cKey, audio);
    playPuterAudio(audio);
  }).catch(function () {
    // On failure: try cached audio first, then browser TTS
    if (_ttsCache[cKey]) playPuterAudio(_ttsCache[cKey]);
    else speakBrowser(text);
  });
  return null;
}

export function speak(text, skipCache) {
  if (selectedEngine !== 'browser' && hasPuter()) {
    return speakPuter(text, skipCache);
  }
  return speakBrowser(text);
}

// ---------------------------------------------------------------------------
// UI population — engines & voices
// ---------------------------------------------------------------------------

/**
 * Populate a <select> element with available TTS engines.
 * @param {HTMLSelectElement} selectEl
 */
export function populateEngines(selectEl) {
  selectEl.innerHTML = '';
  var engines = [{ id: 'browser', label: Lang.t('voiceEngineBrowser') }];
  if (hasPuter()) {
    if (engineSupportsLang('polly')) engines.push({ id: 'polly', label: 'AWS Polly' });
    if (engineSupportsLang('openai')) engines.push({ id: 'openai', label: 'OpenAI' });
    if (engineSupportsLang('elevenlabs')) engines.push({ id: 'elevenlabs', label: 'ElevenLabs' });
  }
  engines.forEach(function (eng) {
    var opt = document.createElement('option');
    opt.value = eng.id;
    opt.textContent = eng.label;
    if (eng.id === selectedEngine) opt.selected = true;
    selectEl.appendChild(opt);
  });
  // If saved engine not available, fall back to browser
  if (!engines.some(function (e) { return e.id === selectedEngine; })) {
    selectedEngine = 'browser';
    selectEl.value = 'browser';
  }
}

/**
 * Populate a <select> element with voices for the current engine.
 * Returns whether the engine is 'browser' (so the caller can toggle speed-row
 * visibility if desired).
 * @param {HTMLSelectElement} selectEl
 * @returns {boolean} true when the current engine is 'browser'
 */
export function populateVoices(selectEl) {
  selectEl.innerHTML = '';
  if (selectedEngine === 'browser') {
    voiceList = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
    var filter = Lang.voiceFilter();
    var def = document.createElement('option');
    def.value = '';
    def.textContent = Lang.t('voiceDefault');
    selectEl.appendChild(def);
    voiceList.forEach(function (v) {
      if (filter && v.lang && !v.lang.toLowerCase().startsWith(filter) && v.voiceURI !== selectedVoiceURI) return;
      var opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = v.name + (v.lang ? ' (' + v.lang + ')' : '');
      if (v.voiceURI === selectedVoiceURI) opt.selected = true;
      selectEl.appendChild(opt);
    });
    return true;
  } else {
    var voices = selectedEngine === 'polly' ? getPollyVoices() : (PUTER_VOICES[selectedEngine] || []);
    voices.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      if (v.id === selectedVoiceURI) opt.selected = true;
      selectEl.appendChild(opt);
    });
    // Auto-select first if no match
    if (!voices.some(function (v) { return v.id === selectedVoiceURI; }) && voices.length) {
      selectedVoiceURI = voices[0].id;
      selectEl.value = selectedVoiceURI;
      localStorage.setItem('aac-voice', selectedVoiceURI);
    }
    return false;
  }
}

// Store references to the select elements so updateVoiceUI and the
// voiceschanged listener can call populateEngines / populateVoices without
// the caller passing elements every time.
let _engineSelectEl = null;
let _voiceSelectEl = null;

/**
 * Convenience wrapper: re-populates both engines and voices selects.
 * Must be called at least once with valid elements so that internal
 * references are stored for the voiceschanged listener.
 * @param {HTMLSelectElement} [engineSelectEl]
 * @param {HTMLSelectElement} [voiceSelectEl]
 */
export function updateVoiceUI(engineSelectEl, voiceSelectEl) {
  if (engineSelectEl) _engineSelectEl = engineSelectEl;
  if (voiceSelectEl) _voiceSelectEl = voiceSelectEl;
  if (_engineSelectEl) populateEngines(_engineSelectEl);
  if (_voiceSelectEl) populateVoices(_voiceSelectEl);
}

// ---------------------------------------------------------------------------
// speechSynthesis voiceschanged listener
// ---------------------------------------------------------------------------
if ('speechSynthesis' in window) {
  speechSynthesis.addEventListener('voiceschanged', function () {
    if (selectedEngine === 'browser' && _voiceSelectEl) {
      populateVoices(_voiceSelectEl);
    }
  });
}

// ---------------------------------------------------------------------------
// Getters / setters
// ---------------------------------------------------------------------------
export function getEngine() { return selectedEngine; }
export function setEngine(e) {
  selectedEngine = e;
  localStorage.setItem('aac-voice-engine', selectedEngine);
}

export function getVoiceURI() { return selectedVoiceURI; }
export function setVoiceURI(uri) {
  selectedVoiceURI = uri;
  localStorage.setItem('aac-voice', selectedVoiceURI);
}

export function getRate() { return selectedRate; }
export function setRate(r) {
  selectedRate = parseFloat(r);
  localStorage.setItem('aac-voice-speed', String(selectedRate));
}
