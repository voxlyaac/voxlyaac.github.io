let DECKS = {
  people: { hex: '#F5C518', i: '👤', w: [{ e: '🙋', l: 'I' }, { e: '👤', l: 'you' }, { e: '👩', l: 'mom' }, { e: '👨', l: 'dad' }, { e: '👫', l: 'friend' }, { e: '🧑‍🏫', l: 'teacher' }, { e: '👨‍⚕️', l: 'doctor' }, { e: '👥', l: 'everyone' }] },
  actions: { hex: '#6BAF7B', i: '🏃', w: [{ e: '🤲', l: 'want' }, { e: '🚶', l: 'go' }, { e: '✊', l: 'do' }, { e: '🍽️', l: 'eat' }, { e: '🥤', l: 'drink' }, { e: '🤝', l: 'help' }, { e: '🛑', l: 'stop' }, { e: '🎮', l: 'play' }, { e: '💤', l: 'sleep' }, { e: '👀', l: 'see' }] },
  feelings: { hex: '#6B9DC7', i: '❤️', w: [{ e: '😊', l: 'happy' }, { e: '😢', l: 'sad' }, { e: '😠', l: 'angry' }, { e: '😰', l: 'scared' }, { e: '😴', l: 'tired' }, { e: '🤕', l: 'pain' }, { e: '😍', l: 'like' }, { e: '😤', l: "don't like" }] },
  descriptors: { hex: '#6B9DC7', i: '📏', w: [{ e: '➕', l: 'more' }, { e: '➖', l: 'less' }, { e: '💯', l: 'a lot' }, { e: '🤏', l: 'a little' }, { e: '👍', l: 'good' }, { e: '👎', l: 'bad' }, { e: '📍', l: 'here' }, { e: '👉', l: 'there' }] },
  things: { hex: '#D4944A', i: '⭐', w: [{ e: '💧', l: 'water' }, { e: '🍎', l: 'food' }, { e: '🚽', l: 'bathroom' }, { e: '🧸', l: 'toy' }, { e: '📱', l: 'phone' }, { e: '💊', l: 'medicine' }, { e: '👕', l: 'clothes' }] },
  social: { hex: '#C78DA3', i: '💬', w: [{ e: '👋', l: 'hi' }, { e: '🫡', l: 'bye' }, { e: '🙏', l: 'please' }, { e: '🫶', l: 'thank you' }, { e: '✅', l: 'yes' }, { e: '❌', l: 'no' }, { e: '⏳', l: 'wait' }, { e: '🎉', l: "let's" }] },
  phrases: { hex: '#9B7DC7', i: '💜', w: [] }
};

let BINDERS = {
  all:    { icon: '📋', decks: null },
  school: { icon: '🎓', decks: ['people', 'actions', 'social'] },
  home:   { icon: '🏠', decks: ['people', 'feelings', 'things', 'descriptors'] }
};
let currentBinder = 'all';

let sentence = [], ghost = null, ghostSrc = null, isDrag = false;
let settings = { sound: true, labels: true, anim: true };
Profiles.load();
if (typeof AAC !== 'undefined' && AAC.Stats) {
  AAC.Stats.init(Profiles.listProfiles().active);
}

// Settings (options page)
const optionsPage = document.getElementById('optionsPage');
document.getElementById('settingsBtn').onclick = () => optionsPage.classList.add('open');
document.getElementById('optionsBack').onclick = () => optionsPage.classList.remove('open');
document.getElementById('togSound').onclick = function () { settings.sound = !settings.sound; this.classList.toggle('on', settings.sound); Profiles.save(); };
document.getElementById('togLabels').onclick = function () {
  settings.labels = !settings.labels; this.classList.toggle('on', settings.labels);
  document.querySelectorAll('.card-l, .cl, .pill-l').forEach(el => el.style.display = settings.labels ? '' : 'none');
  Profiles.save();
};
document.getElementById('togAnim').onclick = function () {
  settings.anim = !settings.anim; this.classList.toggle('on', settings.anim);
  document.documentElement.style.setProperty('--dur', settings.anim ? '0.22s' : '0s');
  Profiles.save();
};

// Voice selection
const voiceEngineSelect = document.getElementById('voiceEngineSelect');
const voiceSelect = document.getElementById('voiceSelect');
const voiceSelectRow = document.getElementById('voiceSelectRow');
const voiceSpeedRow = document.getElementById('voiceSpeedRow');
const voiceSpeed = document.getElementById('voiceSpeed');
let voiceList = [];
let selectedEngine = localStorage.getItem('aac-voice-engine') || 'browser';
let selectedVoiceURI = localStorage.getItem('aac-voice') || '';
let selectedRate = parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85;
voiceSpeed.value = selectedRate;

// Puter AI voice definitions
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
    // Hebrew — Polly has no Hebrew voices
    // Ukrainian — Polly has no Ukrainian voices
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

function getPollyVoices() {
  var filter = AAC.Lang.voiceFilter();
  var all = PUTER_VOICES.polly;
  var filtered = all.filter(function (v) {
    return v.lang.toLowerCase().startsWith(filter);
  });
  return filtered.length ? filtered : all;
}

function hasPuter() {
  return typeof puter !== 'undefined' && puter.ai && typeof puter.ai.txt2speech === 'function';
}

// Languages each Puter TTS engine supports (ISO 639-1 codes)
// Polly: only languages with available voices
// ElevenLabs: multilingual v2 but Puter doesn't forward language_code,
//   so it relies on auto-detection which fails for Hebrew & Ukrainian
var ENGINE_LANGS = {
  polly: ['en', 'pt', 'ar', 'ca', 'zh', 'cs', 'da', 'nl', 'fi', 'fr', 'hi', 'de', 'is', 'it', 'ja', 'ko', 'nb', 'pl', 'ro', 'ru', 'es', 'sv', 'tr', 'cy'],
  openai: null,      // multilingual — supports all languages via instructions param
  elevenlabs: ['en', 'pt', 'es', 'fr', 'de', 'it', 'pl', 'ja', 'ko', 'zh', 'nl', 'ru', 'sv', 'da', 'fi', 'nb', 'tr', 'ro', 'cs', 'hi', 'ar']
};

function engineSupportsLang(engineId) {
  if (engineId === 'browser') return true;
  var supported = ENGINE_LANGS[engineId];
  if (!supported) return true; // null = all languages
  var lang = AAC.Lang.getCurrent();
  return supported.indexOf(lang) !== -1;
}

function populateEngines() {
  voiceEngineSelect.innerHTML = '';
  var engines = [{ id: 'browser', label: AAC.Lang.t('voiceEngineBrowser') }];
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
    voiceEngineSelect.appendChild(opt);
  });
  // If saved engine not available, fall back to browser
  if (!engines.some(function (e) { return e.id === selectedEngine; })) {
    selectedEngine = 'browser';
    voiceEngineSelect.value = 'browser';
  }
}

function populateVoices() {
  voiceSelect.innerHTML = '';
  if (selectedEngine === 'browser') {
    voiceSpeedRow.style.display = '';
    voiceList = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
    var filter = AAC.Lang.voiceFilter();
    var def = document.createElement('option');
    def.value = '';
    def.textContent = AAC.Lang.t('voiceDefault');
    voiceSelect.appendChild(def);
    voiceList.forEach(function (v) {
      if (filter && v.lang && !v.lang.toLowerCase().startsWith(filter) && v.voiceURI !== selectedVoiceURI) return;
      var opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = v.name + (v.lang ? ' (' + v.lang + ')' : '');
      if (v.voiceURI === selectedVoiceURI) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  } else {
    voiceSpeedRow.style.display = 'none';
    var voices = selectedEngine === 'polly' ? getPollyVoices() : (PUTER_VOICES[selectedEngine] || []);
    voices.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      if (v.id === selectedVoiceURI) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
    // Auto-select first if no match
    if (!voices.some(function (v) { return v.id === selectedVoiceURI; }) && voices.length) {
      selectedVoiceURI = voices[0].id;
      voiceSelect.value = selectedVoiceURI;
      localStorage.setItem('aac-voice', selectedVoiceURI);
    }
  }
}

function updateVoiceUI() {
  populateEngines();
  populateVoices();
}

if ('speechSynthesis' in window) {
  speechSynthesis.addEventListener('voiceschanged', function () {
    if (selectedEngine === 'browser') populateVoices();
  });
}
// Delay initial population to let puter.js load
setTimeout(updateVoiceUI, 500);

voiceEngineSelect.onchange = function () {
  selectedEngine = this.value;
  localStorage.setItem('aac-voice-engine', selectedEngine);
  selectedVoiceURI = '';
  localStorage.setItem('aac-voice', '');
  populateVoices();
  Profiles.save();
};
voiceSelect.onchange = function () {
  selectedVoiceURI = this.value;
  localStorage.setItem('aac-voice', selectedVoiceURI);
  Profiles.save();
};
voiceSpeed.oninput = function () {
  selectedRate = parseFloat(this.value);
  localStorage.setItem('aac-voice-speed', String(selectedRate));
  Profiles.save();
};
document.getElementById('voiceTest').onclick = function () {
  aacSpeak(AAC.Lang.t('testVoicePhrase'));
};

// Language selection
var langSelect = document.getElementById('langSelect');
function populateLangs() {
  var langs = AAC.Lang.list();
  var cur = AAC.Lang.getCurrent();
  langSelect.innerHTML = '';
  for (var i = 0; i < langs.length; i++) {
    var opt = document.createElement('option');
    opt.value = langs[i].code;
    opt.textContent = langs[i].nativeName + ' (' + langs[i].name + ')';
    if (langs[i].code === cur) opt.selected = true;
    langSelect.appendChild(opt);
  }
}
langSelect.onchange = function () {
  AAC.Lang.set(this.value);
  // Reload decks & binders from the new language defaults
  var defaults = AAC.Lang.defaults();
  DECKS = JSON.parse(JSON.stringify(defaults.decks));
  BINDERS = JSON.parse(JSON.stringify(defaults.binders));
  currentBinder = Object.keys(BINDERS)[0] || 'all';
  // Reset voice and refresh engine list for new language
  selectedVoiceURI = '';
  localStorage.setItem('aac-voice', '');
  voiceSelect.value = '';
  updateVoiceUI();
  renderShelf();
  renderBinderTabs();
  if (typeof aacFriendReinit === 'function') aacFriendReinit();
  Profiles.save();
};
populateLangs();

var _puterAudioPlaying = null;
var _ttsCache = {};
var _TTS_CACHE_MAX = 100;

function ttsCacheKey(text) {
  return selectedEngine + ':' + (selectedVoiceURI || '') + ':' + AAC.Lang.getCurrent() + ':' + text;
}

function ttsCacheStore(key, audio) {
  var keys = Object.keys(_ttsCache);
  if (keys.length >= _TTS_CACHE_MAX) delete _ttsCache[keys[0]];
  _ttsCache[key] = audio;
}

function aacSpeakBrowser(text) {
  if (!('speechSynthesis' in window)) return null;
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.rate = selectedRate;
  u.lang = AAC.Lang.getCurrent();
  if (selectedVoiceURI) {
    var v = voiceList.find(function (v) { return v.voiceURI === selectedVoiceURI; });
    if (v) u.voice = v;
  }
  speechSynthesis.speak(u);
  return u;
}

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

function aacSpeakPuter(text, skipCache) {
  if (!hasPuter()) return aacSpeakBrowser(text);
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
  var langPack = AAC.Lang.get(AAC.Lang.getCurrent());
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
    else aacSpeakBrowser(text);
  });
  return null;
}

function aacSpeak(text, skipCache) {
  if (selectedEngine !== 'browser' && hasPuter()) {
    return aacSpeakPuter(text, skipCache);
  }
  return aacSpeakBrowser(text);
}

// Shelf
const shelf = document.getElementById('shelf');
const shelfWrap = document.getElementById('shelfWrap');
const shelfScroll = document.getElementById('shelfScroll');
const shelfUp = document.getElementById('shelfUp'), shelfDown = document.getElementById('shelfDown');

function updateShelfArrows() {
  const st = shelfScroll.scrollTop, sh = shelfScroll.scrollHeight, ch = shelfScroll.clientHeight;
  shelfUp.classList.toggle('vis', st > 4);
  shelfDown.classList.toggle('vis', st < sh - ch - 4);
}
shelfScroll.addEventListener('scroll', updateShelfArrows);
shelfUp.onclick = () => shelfScroll.scrollBy({ top: -160, behavior: 'smooth' });
shelfDown.onclick = () => shelfScroll.scrollBy({ top: 160, behavior: 'smooth' });

let currentDeck = null;

// Central deck/binder change notification — single place for UI sync
function notifyDeckChange(deckKey) {
  // Persist
  Profiles.save();
  // Update shelf card count without re-render
  if (!currentDeck) {
    if (deckKey && DECKS[deckKey]) {
      const nameEls = shelf.querySelectorAll('.deck-name');
      for (let i = 0; i < nameEls.length; i++) {
        if (nameEls[i].textContent === deckKey) {
          const countEl = nameEls[i].parentElement.querySelector('.deck-count');
          if (countEl) countEl.textContent = AAC.Lang.t('cardCount')(DECKS[deckKey].w.length);
          break;
        }
      }
    } else {
      renderShelf();
    }
  }
  // Refresh suggestions async to avoid blocking UI
  if (typeof aacFriendRefresh === 'function') setTimeout(aacFriendRefresh, 0);
}

function renderShelf() {
  shelf.innerHTML = '';
  const b = BINDERS[currentBinder];
  const entries = Object.entries(DECKS).filter(([k]) => !b.decks || b.decks.includes(k));
  entries.forEach(([k, d], di) => {
    const el = document.createElement('div');
    el.className = 'deck'; el.style.setProperty('--dc', d.hex);
    el.style.animationDelay = `${di * 50}ms`;
    const dIcon = d.img ? `<img class="deck-img" src="${d.img}" alt="${k}">` : d.i;
    el.innerHTML = `<div class="sl" style="--dc:${d.hex}"></div><div class="sl" style="--dc:${d.hex}"></div>
      <div class="deck-face" style="--dc:${d.hex}"><span class="deck-icon">${dIcon}</span><span class="deck-name">${k}</span><span class="deck-count">${AAC.Lang.t('cardCount')(d.w.length)}</span></div>
      <div class="edit-btn">✎</div>`;
    el.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openModal({ mode: 'edit-deck', deckKey: k, emoji: d.i, label: k, hex: d.hex, img: d.img }); };
    el.onclick = () => openDeck(k);
    shelf.appendChild(el);
  });
  const add = document.createElement('div');
  add.className = 'add-deck';
  add.innerHTML = '<span class="add-icon">+</span>';
  add.onclick = () => addDeck();
  shelf.appendChild(add);
  setTimeout(updateShelfArrows, 100);
}
let binderDragClone = null, binderDragKey = null, binderDragInsert = null, binderDidDrag = false;

function reorderBinders(fromKey, toIdx) {
  const entries = Object.entries(BINDERS);
  const fromIdx = entries.findIndex(([k]) => k === fromKey);
  if (fromIdx < 0 || fromIdx === toIdx) return;
  const item = entries.splice(fromIdx, 1)[0];
  if (toIdx > fromIdx) toIdx--;
  entries.splice(toIdx, 0, item);
  const newObj = {};
  entries.forEach(([k, v]) => { newObj[k] = v; });
  BINDERS = newObj;
  Profiles.save();
}

function renderBinderTabs() {
  const tabs = document.getElementById('binderTabs');
  tabs.innerHTML = '';
  Object.entries(BINDERS).forEach(([k, b], idx) => {
    const tab = document.createElement('button');
    tab.className = 'binder-tab' + (k === currentBinder ? ' active' : '');
    tab.type = 'button';
    tab.dataset.key = k;
    tab.dataset.idx = idx;
    const bIcon = b.img ? `<img src="${b.img}" alt="${k}">` : b.icon;
    const editHtml = k !== 'all' ? '<div class="edit-btn binder-edit">✎</div>' : '';
    tab.innerHTML = `<span class="binder-tab-icon">${bIcon}</span><span class="binder-tab-label">${k}</span>${editHtml}`;

    // Tap to switch
    tab.addEventListener('click', () => {
      if (binderDidDrag) { binderDidDrag = false; return; }
      if (currentBinder === k) return;
      currentBinder = k;
      Profiles.save();
      if (currentDeck) {
        currentDeck = null;
        searchArea.classList.remove('open');
        searchInput.value = '';
        openView.classList.remove('vis');
        shelfWrap.classList.remove('out');
      }
      renderShelf();
      renderBinderTabs();
    });

    // Edit button
    if (k !== 'all') {
      const editBtn = tab.querySelector('.binder-edit');
      editBtn.addEventListener('pointerdown', e => e.stopPropagation());
      editBtn.addEventListener('pointerup', e => e.stopPropagation());
      editBtn.onclick = e => { e.stopPropagation(); openBinderModal(k); };
    }

    // Drag to reorder (not for "all")
    if (k !== 'all') {
      let down = false, moved = false, sx, sy, cachedW, cachedH;
      tab.addEventListener('pointerdown', e => {
        if (e.target.closest('.binder-edit')) return;
        e.preventDefault(); tab.setPointerCapture(e.pointerId);
        down = true; moved = false; sx = e.clientX; sy = e.clientY;
        cachedW = tab.offsetWidth; cachedH = tab.offsetHeight;
      });
      tab.addEventListener('pointermove', e => {
        if (!down) return;
        if (!moved && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) {
          moved = true;
          binderDragKey = k;
          const otherTabs = [...tabs.querySelectorAll('.binder-tab')].filter(t => t.dataset.key !== k);
          // Initial gap position = where this tab was among otherTabs
          let initialGap = 0;
          for (const t of otherTabs) { if (parseInt(t.dataset.idx) < idx) initialGap++; else break; }
          if (initialGap < 1) initialGap = 1;
          binderDragInsert = initialGap;
          // Collapse tab AND place gap at same position, all with no transition
          tab.style.overflow = 'hidden';
          tab.style.transition = 'none';
          tab.style.width = '0'; tab.style.minWidth = '0'; tab.style.padding = '0';
          tab.style.borderWidth = '0'; tab.style.opacity = '0'; tab.style.flexBasis = '0';
          otherTabs.forEach((t, j) => {
            t.style.transition = 'none';
            t.style.marginLeft = (j === initialGap) ? `${cachedW + 8}px` : '';
          });
          // Create floating clone
          binderDragClone = tab.cloneNode(true);
          binderDragClone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.9;width:${cachedW}px;height:${cachedH}px;box-shadow:0 6px 18px rgba(0,0,0,0.15);transition:none;`;
          binderDragClone.className = 'binder-tab active';
          document.body.appendChild(binderDragClone);
          // Enable smooth transitions for subsequent gap moves (after this frame)
          requestAnimationFrame(() => {
            otherTabs.forEach(t => { t.style.transition = 'margin 0.15s ease'; });
          });
        }
        if (moved && binderDragClone) {
          binderDragClone.style.left = `${e.clientX - cachedW / 2}px`;
          binderDragClone.style.top = `${e.clientY - cachedH / 2}px`;
          // Find insert position among visible (non-dragged) tabs
          const otherTabs = [...tabs.querySelectorAll('.binder-tab')].filter(t => t.dataset.key !== k);
          let insertIdx = otherTabs.length;
          for (let j = 0; j < otherTabs.length; j++) {
            const r = otherTabs[j].getBoundingClientRect();
            if (e.clientX < r.left + r.width / 2) { insertIdx = j; break; }
          }
          // Don't allow before "all" (index 0)
          if (insertIdx < 1) insertIdx = 1;
          binderDragInsert = insertIdx;
          otherTabs.forEach((t, j) => {
            t.style.marginLeft = (j === insertIdx) ? `${cachedW + 8}px` : '';
          });
        }
      });
      tab.addEventListener('pointerup', () => {
        down = false;
        if (binderDragClone) { binderDragClone.remove(); binderDragClone = null; }
        if (moved) {
          binderDidDrag = true;
          if (binderDragInsert !== null) reorderBinders(binderDragKey, binderDragInsert);
          binderDragKey = null; binderDragInsert = null;
          renderBinderTabs();
        } else {
          binderDragKey = null; binderDragInsert = null;
        }
      });
      tab.addEventListener('pointercancel', () => {
        down = false;
        if (binderDragClone) { binderDragClone.remove(); binderDragClone = null; }
        binderDragKey = null; binderDragInsert = null;
        renderBinderTabs();
      });
      tab.addEventListener('lostpointercapture', () => {
        if (down && moved) {
          down = false;
          if (binderDragClone) { binderDragClone.remove(); binderDragClone = null; }
          if (binderDragInsert !== null) reorderBinders(binderDragKey, binderDragInsert);
          binderDragKey = null; binderDragInsert = null;
          binderDidDrag = true;
          renderBinderTabs();
        }
      });
    }

    tabs.appendChild(tab);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'binder-tab-add';
  addBtn.type = 'button';
  addBtn.textContent = '+';
  addBtn.onclick = () => openBinderModal(null);
  tabs.appendChild(addBtn);
  setTimeout(updateBinderArrows, 100);
}

const binderTabsEl = document.getElementById('binderTabs');
const binderL = document.getElementById('binderL');
const binderR = document.getElementById('binderR');

function updateBinderArrows() {
  const sl = binderTabsEl.scrollLeft, sw = binderTabsEl.scrollWidth, cw = binderTabsEl.clientWidth;
  binderL.classList.toggle('vis', sl > 4);
  binderR.classList.toggle('vis', sl < sw - cw - 4);
}
binderTabsEl.addEventListener('scroll', updateBinderArrows);
function binderTabWidth() {
  const tab = binderTabsEl.querySelector('.binder-tab');
  if (!tab) return 120;
  const style = getComputedStyle(binderTabsEl);
  return tab.offsetWidth + parseFloat(style.gap || 0);
}
binderL.onclick = () => binderTabsEl.scrollBy({ left: -binderTabWidth(), behavior: 'smooth' });
binderR.onclick = () => binderTabsEl.scrollBy({ left: binderTabWidth(), behavior: 'smooth' });

renderShelf();
renderBinderTabs();

const openView = document.getElementById('openView');
const fanScroll = document.getElementById('fanScroll');
const fanUp = document.getElementById('fanUp'), fanDown = document.getElementById('fanDown');

function updateFanArrows() {
  const st = fanScroll.scrollTop, sh = fanScroll.scrollHeight, ch = fanScroll.clientHeight;
  fanUp.classList.toggle('vis', st > 4);
  fanDown.classList.toggle('vis', st < sh - ch - 4);
}
fanScroll.addEventListener('scroll', updateFanArrows);
fanUp.onclick = () => fanScroll.scrollBy({ top: -160, behavior: 'smooth' });
fanDown.onclick = () => fanScroll.scrollBy({ top: 160, behavior: 'smooth' });

function openDeck(k) {
  if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.track('deckOpen', { deck: k });
  currentDeck = k;
  const d = DECKS[k];
  const oIcon = document.getElementById('oIcon');
  if (d.img) { oIcon.innerHTML = `<img class="deck-img" src="${d.img}" alt="${k}">`; } else { oIcon.textContent = d.i; }
  document.getElementById('oTitle').textContent = k;
  shelfWrap.classList.add('out'); openView.classList.add('vis');
  const g = document.getElementById('fan'); g.innerHTML = '';
  d.w.forEach((w, i) => {
    const c = document.createElement('div');
    c.className = 'card'; c.style.setProperty('--c', d.hex);
    c.dataset.emoji = w.e; c.dataset.label = w.l; c.dataset.color = d.hex;
    if (w.img) c.dataset.img = w.img;
    const ld = settings.labels ? '' : 'style="display:none"';
    const cIcon = w.img ? `<img class="card-img" src="${w.img}" alt="${w.l}">` : `<span class="card-e">${w.e}</span>`;
    c.innerHTML = `${cIcon}<span class="card-l" ${ld}>${w.l}</span><div class="edit-btn">✎</div>`;
    c.querySelector('.edit-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    c.querySelector('.edit-btn').addEventListener('pointerup', (e) => { e.stopPropagation(); });
    c.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openModal({ mode: 'edit-card', deckKey: k, cardIndex: i, emoji: w.e, label: w.l, img: w.img }); };
    setTimeout(() => c.classList.add('dealt'), i * 30);
    bindCard(c); g.appendChild(c);
  });
  const ac = document.createElement('div');
  ac.className = 'add-card';
  ac.innerHTML = '<span class="add-icon">+</span>';
  ac.onclick = () => addCard(k);
  g.appendChild(ac);
  setTimeout(updateFanArrows, 100);
}
document.getElementById('backBtn').onclick = () => { currentDeck = null; searchArea.classList.remove('open'); searchInput.value = ''; openView.classList.remove('vis'); setTimeout(() => shelfWrap.classList.remove('out'), 30); renderShelf(); };

// Search
const searchArea = document.getElementById('searchArea');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

function closeSearch() {
  searchArea.classList.remove('open');
  searchInput.value = '';
  if (currentDeck) { openDeck(currentDeck); } else { openView.classList.remove('vis'); shelfWrap.classList.remove('out'); }
}

searchBtn.onclick = () => {
  const open = searchArea.classList.toggle('open');
  if (open) { searchInput.focus(); } else { closeSearch(); }
};

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) {
      const first = document.querySelector('#fan .card');
      if (first) {
        addWord(first.dataset.emoji, first.dataset.label, first.dataset.color, first.dataset.img);
      }
    }
    closeSearch();
  }
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { closeSearch(); return; }
  const g = document.getElementById('fan'); g.innerHTML = '';
  shelfWrap.classList.add('out'); openView.classList.add('vis');
  document.getElementById('oIcon').textContent = '🔍';
  document.getElementById('oTitle').textContent = 'search';
  Object.entries(DECKS).forEach(([dk, d]) => {
    d.w.forEach(w => {
      if (!w.l.toLowerCase().includes(q) && !w.e.includes(q)) return;
      const c = document.createElement('div');
      c.className = 'card dealt'; c.style.setProperty('--c', d.hex);
      c.dataset.emoji = w.e; c.dataset.label = w.l; c.dataset.color = d.hex;
      if (w.img) c.dataset.img = w.img;
      const ld = settings.labels ? '' : 'style="display:none"';
      const cIcon = w.img ? `<img class="card-img" src="${w.img}" alt="${w.l}">` : `<span class="card-e">${w.e}</span>`;
      c.innerHTML = `${cIcon}<span class="card-l" ${ld}>${w.l}</span>`;
      bindCard(c); g.appendChild(c);
    });
  });
  if (!g.children.length) g.innerHTML = '<div class="search-no">' + AAC.Lang.t('searchNoMatches') + '</div>';
});

const PALETTE = ['#F5C518', '#6BAF7B', '#6B9DC7', '#D4944A', '#C78DA3', '#9B7DC7', '#CC4444', '#6db5a0', '#c9976b', '#8a8ec7', '#a08abb'];
const mOverlay = document.getElementById('modalOverlay');
const mTitle = document.getElementById('modalTitle');
const mPreview = document.getElementById('modalPreview');
const mEmoji = document.getElementById('modalEmoji');
const mLabel = document.getElementById('modalLabel');
const mColors = document.getElementById('modalColors');
const mSave = document.getElementById('modalSave');
const mCancel = document.getElementById('modalCancel');
const mDelete = document.getElementById('modalDelete');
const mFile = document.getElementById('modalFile');
const mCameraBtn = document.getElementById('modalCameraBtn');
const mClearImg = document.getElementById('modalClearImg');
const camView = document.getElementById('cameraView');
const camVideo = document.getElementById('cameraVideo');
const camCanvas = document.getElementById('cameraCanvas');
const camSnap = document.getElementById('cameraSnap');
const camSwitch = document.getElementById('cameraSwitch');
const mSymbolBtn = document.getElementById('modalSymbolBtn');
const symSearch = document.getElementById('symbolSearch');
const symInput = document.getElementById('symbolInput');
const symGrid = document.getElementById('symbolGrid');
let symDebounce = null;
const emojiPick = document.getElementById('emojiPick');
const mEmojiBtn = document.getElementById('modalEmojiBtn');
let modalOpts = null;
let modalImg = null;
let camStream = null;
let camDevices = [];
let camIdx = 0;

const binderDeckField = document.getElementById('binderDeckField');
const binderDeckList = document.getElementById('binderDeckList');

function setModalPreview() {
  // Remove all children except the clear button
  [...mPreview.childNodes].forEach(n => { if (n !== mClearImg) mPreview.removeChild(n); });
  if (modalImg) {
    const img = document.createElement('img');
    img.src = modalImg; img.alt = 'preview';
    mPreview.insertBefore(img, mClearImg);
  } else {
    const fallback = modalOpts && modalOpts.mode.includes('binder') ? '📋' : (modalOpts && modalOpts.mode.includes('deck') ? '📁' : '🃏');
    mPreview.insertBefore(document.createTextNode(mEmoji.value || fallback), mClearImg);
  }
  mClearImg.classList.toggle('vis', !!(modalImg || mEmoji.value.trim()));
}
function openModal(opts) {
  if (document.body.classList.contains('mode-user')) return;
  modalOpts = opts;
  modalImg = opts.img || null;
  mFile.value = ''; camView.classList.remove('vis'); symSearch.classList.remove('vis'); emojiPick.classList.remove('vis');
  const isDeck = opts.mode.includes('deck');
  const isBinder = opts.mode.includes('binder');
  const isProfile = opts.mode === 'edit-profile';
  const isEdit = opts.mode.includes('edit');
  var titleKey;
  if (isProfile) titleKey = 'editProfile';
  else if (isBinder) titleKey = isEdit ? 'editBinder' : 'newBinder';
  else if (isDeck) titleKey = isEdit ? 'editDeck' : 'newDeck';
  else titleKey = isEdit ? 'editCard' : 'newCard';
  mTitle.textContent = AAC.Lang.t(titleKey);
  mEmoji.value = opts.emoji || '';
  mLabel.value = opts.label || '';
  setModalPreview();
  mDelete.style.display = (isEdit && !isProfile) ? '' : 'none';
  mColors.style.display = (isDeck || isProfile) ? '' : 'none';
  binderDeckField.style.display = isBinder ? '' : 'none';
  if (isProfile) {
    mLabel.placeholder = AAC.Lang.t('modalPlaceholderProfile');
  } else {
    mLabel.placeholder = isBinder ? AAC.Lang.t('modalPlaceholderBinder') : (isDeck ? AAC.Lang.t('modalPlaceholderDeck') : AAC.Lang.t('modalPlaceholderCard'));
  }
  if (isDeck || isProfile) {
    mColors.innerHTML = '';
    const sel = opts.hex || PALETTE[Object.keys(DECKS).length % PALETTE.length];
    PALETTE.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'modal-swatch' + (c === sel ? ' active' : '');
      sw.style.background = c;
      sw.onclick = () => { mColors.querySelectorAll('.modal-swatch').forEach(s => s.classList.remove('active')); sw.classList.add('active'); };
      mColors.appendChild(sw);
    });
  }
  if (isBinder) {
    binderDeckList.innerHTML = '';
    const selected = isEdit && opts.decks ? opts.decks : [];
    Object.entries(DECKS).forEach(([dk, d]) => {
      const item = document.createElement('div');
      item.className = 'binder-deck-item' + (selected.includes(dk) ? ' checked' : '');
      const dIcon = d.img ? `<img class="binder-deck-icon-img" src="${d.img}" alt="${dk}">` : d.i;
      item.innerHTML = `<div class="binder-check">✓</div><span class="binder-deck-icon">${dIcon}</span><span class="binder-deck-name">${dk}</span>`;
      item.dataset.deck = dk;
      item.onclick = () => item.classList.toggle('checked');
      binderDeckList.appendChild(item);
    });
  }
  mOverlay.classList.add('vis');
}

function closeModal() { stopCamera(); symSearch.classList.remove('vis'); emojiPick.classList.remove('vis'); mOverlay.classList.remove('vis'); modalOpts = null; }

mEmojiBtn.onclick = () => {
  if (emojiPick.classList.contains('vis')) { emojiPick.classList.remove('vis'); return; }
  stopCamera(); symSearch.classList.remove('vis');
  emojiPick.classList.add('vis');
  setTimeout(() => mEmoji.focus(), 100);
};

mEmoji.addEventListener('input', () => { if (mEmoji.value.trim()) modalImg = null; setModalPreview(); });
function handleImgInput(input) {
  const f = input.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = () => { modalImg = reader.result; mEmoji.value = ''; setModalPreview(); };
  reader.readAsDataURL(f);
}
mFile.addEventListener('change', () => handleImgInput(mFile));

function stopCamera() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  camVideo.srcObject = null;
  camView.classList.remove('vis');
}

async function startCamera(deviceId) {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  const constraints = deviceId ? { video: { deviceId: { exact: deviceId } } } : { video: { facingMode: 'environment' } };
  camStream = await navigator.mediaDevices.getUserMedia(constraints);
  camVideo.srcObject = camStream;
  // refresh device list (labels available only after permission granted)
  const devices = await navigator.mediaDevices.enumerateDevices();
  camDevices = devices.filter(d => d.kind === 'videoinput');
  camSwitch.classList.toggle('vis', camDevices.length > 1);
}

mCameraBtn.onclick = async () => {
  if (camStream) { stopCamera(); return; }
  emojiPick.classList.remove('vis'); symSearch.classList.remove('vis');
  try {
    await startCamera();
    camView.classList.add('vis');
  } catch (e) {
    alert(AAC.Lang.t('cameraError'));
  }
};

camSwitch.onclick = async () => {
  if (camDevices.length < 2) return;
  camIdx = (camIdx + 1) % camDevices.length;
  try { await startCamera(camDevices[camIdx].deviceId); } catch (e) { /* keep current */ }
};

camSnap.onclick = () => {
  const w = camVideo.videoWidth, h = camVideo.videoHeight;
  camCanvas.width = w; camCanvas.height = h;
  camCanvas.getContext('2d').drawImage(camVideo, 0, 0, w, h);
  modalImg = camCanvas.toDataURL('image/jpeg', 0.85);
  mEmoji.value = '';
  setModalPreview();
  stopCamera();
};

mClearImg.onclick = () => { modalImg = null; mEmoji.value = ''; mFile.value = ''; stopCamera(); symSearch.classList.remove('vis'); emojiPick.classList.remove('vis'); setModalPreview(); };

mSymbolBtn.onclick = () => {
  if (symSearch.classList.contains('vis')) { symSearch.classList.remove('vis'); return; }
  stopCamera(); emojiPick.classList.remove('vis');
  symSearch.classList.add('vis');
  symInput.value = '';
  symGrid.innerHTML = '';
  setTimeout(() => symInput.focus(), 100);
};

symInput.addEventListener('input', () => {
  clearTimeout(symDebounce);
  const q = symInput.value.trim();
  if (!q) { symGrid.innerHTML = ''; return; }
  symDebounce = setTimeout(() => fetchSymbols(q), 300);
});

async function fetchSymbols(q) {
  symGrid.innerHTML = '<div class="symbol-no">' + AAC.Lang.t('symbolSearching') + '</div>';
  try {
    const res = await fetch(`https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    symGrid.innerHTML = '';
    if (!data.length) { symGrid.innerHTML = '<div class="symbol-no">' + AAC.Lang.t('symbolNoResults') + '</div>'; return; }
    data.slice(0, 20).forEach(s => {
      const el = document.createElement('div');
      el.className = 'symbol-item';
      el.innerHTML = `<img src="${s.image_url}" alt="${s.name}" loading="lazy">`;
      el.onclick = () => {
        modalImg = s.image_url;
        mEmoji.value = '';
        setModalPreview();
        symSearch.classList.remove('vis');
      };
      symGrid.appendChild(el);
    });
  } catch (e) {
    symGrid.innerHTML = '<div class="symbol-no">' + AAC.Lang.t('symbolSearchFailed') + '</div>';
  }
}

mCancel.onclick = closeModal;
mOverlay.addEventListener('pointerdown', e => { if (e.target === mOverlay) closeModal(); });

mSave.onclick = () => {
  const o = modalOpts; if (!o) return;
  const emoji = mEmoji.value.trim();
  const label = mLabel.value.trim();
  const img = modalImg || null;
  if (!emoji && !label && !img) return;
  if (o.mode === 'add-deck') {
    if (!label) return;
    const activeSw = mColors.querySelector('.modal-swatch.active');
    const hex = activeSw ? activeSw.style.background : PALETTE[0];
    const deck = { hex, i: emoji || '📁', w: [] };
    if (img) deck.img = img;
    const deckKey = label.toLowerCase();
    DECKS[deckKey] = deck;
    const cb = BINDERS[currentBinder];
    if (cb.decks) cb.decks.push(deckKey);
    closeModal(); renderShelf(); renderBinderTabs();
  } else if (o.mode === 'edit-deck') {
    const activeSw = mColors.querySelector('.modal-swatch.active');
    const hex = activeSw ? activeSw.style.background : o.hex;
    const d = DECKS[o.deckKey];
    d.i = emoji || d.i; d.hex = hex;
    d.img = img;
    if (label && label.toLowerCase() !== o.deckKey) {
      const newKey = label.toLowerCase();
      DECKS[newKey] = d;
      delete DECKS[o.deckKey];
      Object.values(BINDERS).forEach(b => {
        if (b.decks) { const idx = b.decks.indexOf(o.deckKey); if (idx !== -1) b.decks[idx] = newKey; }
      });
    }
    closeModal(); renderShelf(); renderBinderTabs();
  } else if (o.mode === 'add-card') {
    if (!emoji && !img) return;
    const card = { e: emoji || '', l: label };
    if (img) card.img = img;
    DECKS[o.deckKey].w.push(card);
    closeModal(); openDeck(o.deckKey);
  } else if (o.mode === 'edit-card') {
    const w = DECKS[o.deckKey].w[o.cardIndex];
    w.e = emoji || w.e; w.l = label;
    w.img = img;
    closeModal(); openDeck(o.deckKey);
  } else if (o.mode === 'add-binder') {
    if (!label) return;
    const name = label.toLowerCase();
    if (BINDERS[name]) return;
    const selected = [...binderDeckList.querySelectorAll('.binder-deck-item.checked')].map(el => el.dataset.deck);
    const binder = { icon: emoji || '📋', decks: selected };
    if (img) binder.img = img;
    BINDERS[name] = binder;
    currentBinder = name;
    closeModal(); renderBinderTabs(); renderShelf();
  } else if (o.mode === 'edit-binder') {
    const b = BINDERS[o.binderKey];
    b.icon = emoji || b.icon;
    b.img = img;
    const selected = [...binderDeckList.querySelectorAll('.binder-deck-item.checked')].map(el => el.dataset.deck);
    b.decks = selected;
    if (label && label.toLowerCase() !== o.binderKey) {
      const newKey = label.toLowerCase();
      BINDERS[newKey] = b;
      delete BINDERS[o.binderKey];
      if (currentBinder === o.binderKey) currentBinder = newKey;
    }
    closeModal(); renderBinderTabs(); renderShelf();
  } else if (o.mode === 'edit-profile') {
    const activeSw = mColors.querySelector('.modal-swatch.active');
    const hex = activeSw ? activeSw.style.background : o.hex;
    var avatar = { color: hex };
    if (img) avatar.img = img;
    else if (emoji) avatar.emoji = emoji;
    Profiles.setAvatar(o.profileKey, avatar);
    if (label && o.profileKey !== 'default' && label.toLowerCase() !== o.profileKey) {
      Profiles.renameProfile(o.profileKey, label);
    }
    closeModal();
    if (typeof profileRefresh === 'function') profileRefresh();
    notifyDeckChange();
    return;
  }
  notifyDeckChange();
};

mDelete.onclick = () => {
  const o = modalOpts; if (!o) return;
  if (o.mode === 'edit-deck') {
    delete DECKS[o.deckKey];
    Object.values(BINDERS).forEach(b => {
      if (b.decks) { const idx = b.decks.indexOf(o.deckKey); if (idx !== -1) b.decks.splice(idx, 1); }
    });
    closeModal(); renderShelf(); renderBinderTabs();
  } else if (o.mode === 'edit-card') {
    DECKS[o.deckKey].w.splice(o.cardIndex, 1);
    closeModal(); openDeck(o.deckKey);
  } else if (o.mode === 'edit-binder') {
    if (o.binderKey === 'all') return;
    delete BINDERS[o.binderKey];
    if (currentBinder === o.binderKey) currentBinder = 'all';
    closeModal(); renderBinderTabs(); renderShelf();
  }
  notifyDeckChange();
};

function addDeck() { openModal({ mode: 'add-deck' }); }
function addCard(deckKey) { openModal({ mode: 'add-card', deckKey }); }

function openBinderModal(key) {
  const isEdit = key !== null;
  const b = isEdit ? BINDERS[key] : null;
  openModal({
    mode: isEdit ? 'edit-binder' : 'add-binder',
    binderKey: key,
    emoji: isEdit ? b.icon : '',
    label: isEdit ? key : '',
    img: isEdit ? b.img : null,
    decks: isEdit && b.decks ? [...b.decks] : []
  });
}

// Card interaction
function bindCard(card) {
  let sx, sy, mv, down;
  card.addEventListener('pointerdown', e => {
    e.preventDefault(); card.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; mv = false; down = true;
  });
  card.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!mv && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      mv = true;
      beginDrag(card, e.clientX, e.clientY);
    }
    if (ghost) {
      ghost.style.left = `${e.clientX - 52}px`;
      ghost.style.top = `${e.clientY - 62}px`;
      const sr = document.getElementById('strip').getBoundingClientRect();
      document.getElementById('strip').classList.toggle('ready', e.clientY >= sr.top - 15 && e.clientY <= sr.bottom + 15);
    }
  });
  card.addEventListener('pointerup', e => {
    down = false;
    if (ghost) {
      const sr = document.getElementById('strip').getBoundingClientRect();
      if (e.clientY >= sr.top - 15 && e.clientY <= sr.bottom + 15) {
        addWord(card.dataset.emoji, card.dataset.label, card.dataset.color, card.dataset.img);
        openView.classList.remove('vis');
        setTimeout(() => shelfWrap.classList.remove('out'), 30);
      }
      endDrag();
    } else if (!mv) {
      addWord(card.dataset.emoji, card.dataset.label, card.dataset.color, card.dataset.img);
      openView.classList.remove('vis');
      setTimeout(() => shelfWrap.classList.remove('out'), 30);
    }
  });
  card.addEventListener('pointercancel', () => { down = false; endDrag(); });
}

function beginDrag(el, cx, cy) {
  if (ghost) return; isDrag = true; ghostSrc = el;
  ghost = document.createElement('div'); ghost.className = 'drag-clone';
  ghost.style.setProperty('--c', el.dataset.color);
  const ld = settings.labels ? '' : 'style="display:none"';
  const gIcon = el.dataset.img ? `<img class="card-img" src="${el.dataset.img}" alt="${el.dataset.label}">` : `<span class="card-e">${el.dataset.emoji}</span>`;
  ghost.innerHTML = `${gIcon}<span class="card-l" ${ld}>${el.dataset.label}</span>`;
  ghost.style.left = `${cx - 52}px`; ghost.style.top = `${cy - 62}px`;
  document.body.appendChild(ghost);
}
function endDrag() {
  if (ghost) { ghost.remove(); ghost = null; }
  if (ghostSrc) { ghostSrc = null; }
  isDrag = false; document.getElementById('strip').classList.remove('ready');
}

// Sentence
const wordsEl = document.getElementById('words'), phEl = document.getElementById('ph'), btnsEl = document.getElementById('btns');
const stripL = document.getElementById('stripL'), stripR = document.getElementById('stripR');
let chipDrag = null, chipDragIdx = -1, chipClone = null;

function updateStripArrows() {
  const sl = wordsEl.scrollLeft, sw = wordsEl.scrollWidth, cw = wordsEl.clientWidth;
  stripL.classList.toggle('vis', sl > 4);
  stripR.classList.toggle('vis', sl < sw - cw - 4);
}
wordsEl.addEventListener('scroll', updateStripArrows);
stripL.onclick = () => wordsEl.scrollBy({ left: -120, behavior: 'smooth' });
stripR.onclick = () => wordsEl.scrollBy({ left: 120, behavior: 'smooth' });

function addWord(emoji, label, color, img) {
  sentence.push({ emoji, label, color, img });
  renderStrip();
  if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.track('cardTap', { label: label });
}

function makeChip(w, i, entering) {
  const c = document.createElement('div');
  c.className = 'chip' + (entering ? ' entering' : '');
  c.style.setProperty('--cc', w.color); c.style.borderTopColor = w.color;
  const ld = settings.labels ? '' : 'style="display:none"';
  const chipIcon = w.img ? `<img class="chip-img" src="${w.img}" alt="${w.label}">` : `<span class="ce">${w.emoji}</span>`;
  c.innerHTML = `${chipIcon}<span class="cl" ${ld}>${w.label}</span>`;
  c.dataset.idx = i;
  c.style.touchAction = 'none';
  if (entering) c.addEventListener('animationend', () => c.classList.remove('entering'), { once: true });

  // Drag-to-reorder + tap-to-remove
  let down = false, moved = false, sx, sy;
  c.addEventListener('pointerdown', e => {
    e.preventDefault(); c.setPointerCapture(e.pointerId);
    down = true; moved = false; sx = e.clientX; sy = e.clientY;
  });
  c.addEventListener('pointermove', e => {
    if (!down) return;
    if (!moved && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) {
      moved = true;
      chipDragIdx = parseInt(c.dataset.idx);
      c.style.opacity = '0';
      c.style.overflow = 'hidden';
      c.style.transition = 'width 0.15s ease, min-width 0.15s ease, padding 0.15s ease, border-width 0.15s ease, margin 0.15s ease, gap 0.15s ease';
      requestAnimationFrame(() => {
        c.style.width = '0';
        c.style.minWidth = '0';
        c.style.padding = '0';
        c.style.borderWidth = '0';
        c.style.margin = '0';
      });
      // Create floating clone
      chipClone = document.createElement('div');
      chipClone.className = 'chip';
      chipClone.style.setProperty('--cc', w.color); chipClone.style.borderLeftColor = w.color;
      chipClone.style.cssText += `;position:fixed;z-index:9999;pointer-events:none;margin:0;
        box-shadow:0 6px 18px rgba(0,0,0,0.12);opacity:0.92;`;
      chipClone.innerHTML = c.innerHTML;
      document.body.appendChild(chipClone);
    }
    if (moved) {
      // Move clone
      if (chipClone) {
        chipClone.style.left = `${e.clientX - 33}px`;
        chipClone.style.top = `${e.clientY - 33}px`;
      }
      // Find drop position based on pointer X
      const chips = [...wordsEl.querySelectorAll('.chip')];
      let insertIdx = chips.length;
      for (let j = 0; j < chips.length; j++) {
        const r = chips[j].getBoundingClientRect();
        if (e.clientX < r.left + r.width / 2) { insertIdx = j; break; }
      }
      // Show drop indicator by adjusting margins
      chips.forEach((ch, j) => {
        ch.style.marginLeft = (j === insertIdx && insertIdx !== chipDragIdx) ? '28px' : '';
      });
      chipDrag = { insertIdx };
    }
  });
  c.addEventListener('pointerup', e => {
    down = false;
    if (chipClone) { chipClone.remove(); chipClone = null; }
    if (moved) {
      const sr = document.getElementById('strip').getBoundingClientRect();
      const outside = e.clientY < sr.top - 20 || e.clientY > sr.bottom + 20 || e.clientX < sr.left - 20 || e.clientX > sr.right + 20;
      if (outside) {
        // Dragged outside strip — delete the word
        sentence.splice(chipDragIdx, 1);
      } else if (chipDrag) {
        // Dragged within strip — reorder
        let from = chipDragIdx;
        let to = chipDrag.insertIdx;
        if (to > from) to--;
        if (from !== to && from >= 0 && from < sentence.length) {
          const item = sentence.splice(from, 1)[0];
          sentence.splice(to, 0, item);
        }
      }
      chipDrag = null; chipDragIdx = -1;
      rebuild();
    } else {
      // Tap — speak the word
      aacSpeak(w.label);
    }
  });
  c.addEventListener('pointercancel', () => {
    down = false;
    if (chipClone) { chipClone.remove(); chipClone = null; }
    chipDrag = null; chipDragIdx = -1;
    rebuild();
  });

  return c;
}

function renderStrip() {
  phEl.style.display = sentence.length ? 'none' : '';
  btnsEl.classList.add('vis');
  wordsEl.style.display = sentence.length ? 'flex' : 'none';
  while (wordsEl.children.length > sentence.length) wordsEl.lastChild.remove();
  for (let i = wordsEl.children.length; i < sentence.length; i++) {
    wordsEl.appendChild(makeChip(sentence[i], i, true));
    requestAnimationFrame(() => { wordsEl.scrollTo({ left: wordsEl.scrollWidth, behavior: 'smooth' }); updateStripArrows(); });
  }
  updateStripArrows();
}

function rebuild() {
  wordsEl.innerHTML = '';
  phEl.style.display = sentence.length ? 'none' : '';
  btnsEl.classList.add('vis');
  wordsEl.style.display = sentence.length ? 'flex' : 'none';
  sentence.forEach((w, i) => wordsEl.appendChild(makeChip(w, i, false)));
  updateStripArrows();
}

document.getElementById('bClear').onclick = () => {
  if (!sentence.length) return;
  [...wordsEl.children].forEach((c, i) => setTimeout(() => c.classList.add('leaving'), i * 40));
  setTimeout(() => { sentence = []; rebuild(); }, wordsEl.children.length * 40 + 220);
};
function findPhrasesDeck() {
  for (const [k, d] of Object.entries(DECKS)) {
    if (d.hex === '#9B7DC7') return { key: k, deck: d };
  }
  return null;
}

document.getElementById('bSave').onclick = () => {
  if (!sentence.length) return;
  // Prefer AI-polished text; fall back to raw labels
  const aiEl = document.getElementById('stripAiText');
  const aiText = aiEl ? aiEl.textContent.trim() : '';
  const phraseText = (aiText && aiText !== '...') ? aiText : sentence.map(w => w.label).join(' ');
  // Don't save duplicates
  const found = findPhrasesDeck();
  if (!found) return;
  if (found.deck.w.some(w => w.l === phraseText)) return;
  found.deck.w.push({ e: '💬', l: phraseText });
  // Append card to open deck view if viewing phrases
  if (currentDeck === found.key) {
    const g = document.getElementById('fan');
    const addBtn = g.querySelector('.add-card');
    const w = found.deck.w[found.deck.w.length - 1];
    const idx = found.deck.w.length - 1;
    const c = document.createElement('div');
    c.className = 'card dealt'; c.style.setProperty('--c', found.deck.hex);
    c.dataset.emoji = w.e; c.dataset.label = w.l; c.dataset.color = found.deck.hex;
    if (w.img) c.dataset.img = w.img;
    const ld = settings.labels ? '' : 'style="display:none"';
    const cIcon = w.img ? `<img class="card-img" src="${w.img}" alt="${w.l}">` : `<span class="card-e">${w.e}</span>`;
    c.innerHTML = `${cIcon}<span class="card-l" ${ld}>${w.l}</span><div class="edit-btn">✎</div>`;
    c.querySelector('.edit-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    c.querySelector('.edit-btn').addEventListener('pointerup', (e) => { e.stopPropagation(); });
    c.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openModal({ mode: 'edit-card', deckKey: found.key, cardIndex: idx, emoji: w.e, label: w.l, img: w.img }); };
    bindCard(c);
    g.insertBefore(c, addBtn);
  }
  notifyDeckChange(found.key);
  // Visual feedback
  const btn = document.getElementById('bSave');
  btn.classList.remove('saved');
  void btn.offsetWidth;
  btn.classList.add('saved');
};
document.getElementById('bSpeak').onclick = () => {
  if (!sentence.length) return;
  if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.track('sentenceSpoken', { wordCount: sentence.length });
  const text = sentence.map(w => w.label).join(' ');
  const u = aacSpeak(text);
  if (!u) return;
  let wi = 0;
  const chips = wordsEl.querySelectorAll('.chip');
  u.onboundary = e => { if (e.name === 'word' && wi < chips.length) { chips.forEach(c => c.classList.remove('active-word')); chips[wi].classList.add('active-word'); wi++; } };
  u.onend = () => chips.forEach(c => c.classList.remove('active-word'));
};

document.addEventListener('touchmove', e => { if (isDrag || chipDragIdx >= 0) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', e => e.preventDefault());

// Session tracking
window.addEventListener('beforeunload', function () {
  if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.flushSession();
});
setInterval(function () {
  if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.flushSession();
}, 60000);

// Service Worker Registration + update toast
if ('serviceWorker' in navigator) {
  var updateToast = document.getElementById('updateToast');
  function showUpdateToast() {
    updateToast.textContent = AAC.Lang.t('updateAvailable') || 'New version available — tap to update';
    updateToast.classList.add('visible');
  }
  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    if (reg.waiting) showUpdateToast();
    reg.addEventListener('updatefound', function () {
      var newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', function () {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    });
  });
  updateToast.addEventListener('click', function () {
    updateToast.classList.remove('visible');
    location.reload();
  });
}

// === PROFILE SWITCHER ===
(function () {
  var profileBtn = document.getElementById('profileBtn');
  var profileAvatar = document.getElementById('profileAvatar');
  var profileNameEl = document.getElementById('profileName');
  var profileLock = document.getElementById('profileLock');
  var profilePanel = document.getElementById('profilePanel');
  var profileList = document.getElementById('profileList');
  var profileAddInput = document.getElementById('profileAddInput');
  var profileAddBtn = document.getElementById('profileAddBtn');
  var modeToggle = document.getElementById('modeToggle');

  // --- MODE (user / caretaker) ---
  var MODE_KEY = 'aac-mode';
  function getMode() { return localStorage.getItem(MODE_KEY) || 'user'; }
  function applyMode(mode) {
    document.body.classList.toggle('mode-user', mode === 'user');
    profileLock.style.display = mode === 'user' ? '' : 'none';
    var opts = modeToggle.querySelectorAll('.mode-toggle-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('active', opts[i].dataset.mode === mode);
    }
  }
  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    applyMode(mode);
  }
  modeToggle.onclick = function (e) {
    var opt = e.target.closest('.mode-toggle-opt');
    if (!opt) return;
    setMode(opt.dataset.mode);
  };
  // Apply on init
  applyMode(getMode());

  // Stable avatar colors derived from profile name
  var AVATAR_COLORS = ['#6BAF7B', '#6B9DC7', '#E47A20', '#C78DA3', '#9B7DC7', '#CC4444', '#F5C518', '#6db5a0', '#8a8ec7', '#c9976b'];
  function defaultAvatarColor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  function displayName(name) {
    if (name === 'default') return (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.t('profileDefault') : 'Default';
    return name;
  }
  function getAvatarData(name) {
    var info = Profiles.listProfiles();
    var av = info.avatars[name];
    return {
      color: (av && av.color) || defaultAvatarColor(name),
      emoji: (av && av.emoji) || null,
      img: (av && av.img) || null
    };
  }
  function renderAvatarEl(el, name) {
    var av = getAvatarData(name);
    el.style.background = av.color;
    el.innerHTML = '';
    if (av.img) {
      var imgEl = document.createElement('img');
      imgEl.src = av.img;
      imgEl.alt = name;
      imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
      el.appendChild(imgEl);
    } else if (av.emoji) {
      el.textContent = av.emoji;
    } else {
      el.textContent = (displayName(name) || '?')[0].toUpperCase();
    }
  }

  function updateProfileBtn(name) {
    profileNameEl.textContent = displayName(name);
    renderAvatarEl(profileAvatar, name);
  }

  function refreshUI() {
    var info = Profiles.listProfiles();
    updateProfileBtn(info.active);
    document.getElementById('togSound').classList.toggle('on', settings.sound);
    document.getElementById('togLabels').classList.toggle('on', settings.labels);
    document.getElementById('togAnim').classList.toggle('on', settings.anim);
    document.documentElement.style.setProperty('--dur', settings.anim ? '0.22s' : '0s');
    document.querySelectorAll('.card-l, .cl, .pill-l').forEach(function (el) {
      el.style.display = settings.labels ? '' : 'none';
    });
    var aiOn = localStorage.getItem('aac-friend-enabled') !== 'false';
    var sugOn = localStorage.getItem('aac-friend-suggestions') !== 'false';
    document.getElementById('togCompanion').classList.toggle('on', aiOn);
    document.getElementById('togSuggestions').classList.toggle('on', sugOn);
    var stripAi = document.getElementById('stripAi');
    if (stripAi) stripAi.style.display = aiOn ? '' : 'none';
    selectedEngine = localStorage.getItem('aac-voice-engine') || 'browser';
    selectedVoiceURI = localStorage.getItem('aac-voice') || '';
    selectedRate = parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85;
    voiceSpeed.value = selectedRate;
    populateLangs();
    updateVoiceUI();
    renderShelf();
    renderBinderTabs();
    if (typeof aacFriendReinit === 'function') aacFriendReinit();
  }

  function renderList() {
    var info = Profiles.listProfiles();
    updateProfileBtn(info.active);
    profileList.innerHTML = '';
    for (var i = 0; i < info.profiles.length; i++) {
      (function (name) {
        var row = document.createElement('div');
        row.className = 'profile-item' + (name === info.active ? ' active' : '');

        var av = document.createElement('span');
        av.className = 'profile-item-avatar';
        renderAvatarEl(av, name);
        row.appendChild(av);

        var nameSpan = document.createElement('span');
        nameSpan.className = 'profile-item-name';
        nameSpan.textContent = displayName(name);
        row.appendChild(nameSpan);

        var edit = document.createElement('button');
        edit.className = 'profile-item-edit';
        edit.type = 'button';
        edit.textContent = '✎';
        edit.onclick = function (e) {
          e.stopPropagation();
          var avData = getAvatarData(name);
          profilePanel.classList.remove('open');
          openModal({
            mode: 'edit-profile',
            profileKey: name,
            emoji: avData.emoji || '',
            label: name === 'default' ? '' : name,
            hex: avData.color,
            img: avData.img
          });
        };
        row.appendChild(edit);

        if (name !== 'default') {
          var del = document.createElement('button');
          del.className = 'profile-item-del';
          del.type = 'button';
          del.textContent = '\u2715';
          del.onclick = function (e) {
            e.stopPropagation();
            if (!confirm(AAC.Lang.t('confirmDeleteProfile')(name))) return;
            Profiles.deleteProfile(name);
            if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.deleteForProfile(name);
            if (info.active === name) {
              Profiles.load();
              refreshUI();
            }
            renderList();
          };
          row.appendChild(del);
        }

        row.onclick = function () {
          if (name === info.active) { profilePanel.classList.remove('open'); return; }
          Profiles.switchProfile(name);
          if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.init(name);
          refreshUI();
          profilePanel.classList.remove('open');
        };

        profileList.appendChild(row);
      })(info.profiles[i]);
    }
  }

  // Expose for modal callback
  window.profileRefresh = function () {
    var info = Profiles.listProfiles();
    updateProfileBtn(info.active);
    renderList();
  };

  profileBtn.onclick = function () {
    renderList();
    profilePanel.classList.toggle('open');
  };

  document.addEventListener('pointerdown', function (e) {
    if (!profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
      profilePanel.classList.remove('open');
    }
  });

  function addProfile() {
    var name = profileAddInput.value.trim().toLowerCase();
    if (!name) return;
    if (Profiles.createProfile(name)) {
      profileAddInput.value = '';
      Profiles.switchProfile(name);
      if (typeof AAC !== 'undefined' && AAC.Stats) AAC.Stats.init(name);
      refreshUI();
      renderList();
    }
  }

  profileAddBtn.onclick = addProfile;
  profileAddInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addProfile();
  });

  // Initial display
  updateProfileBtn(Profiles.listProfiles().active);

  // Cloud pull (background)
  Profiles.pullFromCloud();
})();
