// components/settings.js — Settings page controls (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Lang from '../lang.js';
import * as Speech from '../services/speech.js';
import * as Profiles from '../profiles.js';
import { renderShelf } from './deck-area.js';
import { renderBinderTabs } from './binder-bar.js';

let highContrast = false;

export function getHighContrast() { return highContrast; }

export function refreshSettingsUI() {
  document.getElementById('togSound').classList.toggle('on', state.settings.sound);
  document.getElementById('togLabels').classList.toggle('on', state.settings.labels);
  document.getElementById('togAnim').classList.toggle('on', state.settings.anim);
  document.documentElement.style.setProperty('--dur', state.settings.anim ? '0.22s' : '0s');
  highContrast = localStorage.getItem('aac-high-contrast') === 'true';
  document.getElementById('togContrast').classList.toggle('on', highContrast);
  document.body.classList.toggle('high-contrast', highContrast);
  document.querySelectorAll('.card-l, .cl, .pill-l').forEach(function (el) {
    el.style.display = state.settings.labels ? '' : 'none';
  });
  var aiOn = localStorage.getItem('aac-friend-enabled') !== 'false';
  var sugOn = localStorage.getItem('aac-friend-suggestions') !== 'false';
  document.getElementById('togCompanion').classList.toggle('on', aiOn);
  document.getElementById('togSuggestions').classList.toggle('on', sugOn);
  var stripAi = document.getElementById('stripAi');
  if (stripAi) stripAi.style.display = aiOn ? '' : 'none';
}

export function init() {
  const optionsPage = document.getElementById('optionsPage');
  document.getElementById('settingsBtn').onclick = () => optionsPage.classList.add('open');
  document.getElementById('optionsBack').onclick = () => optionsPage.classList.remove('open');

  // Sound toggle
  document.getElementById('togSound').onclick = function () {
    state.settings.sound = !state.settings.sound;
    this.classList.toggle('on', state.settings.sound);
    Profiles.save();
  };

  // Labels toggle
  document.getElementById('togLabels').onclick = function () {
    state.settings.labels = !state.settings.labels;
    this.classList.toggle('on', state.settings.labels);
    document.querySelectorAll('.card-l, .cl, .pill-l').forEach(el => el.style.display = state.settings.labels ? '' : 'none');
    Profiles.save();
  };

  // Animations toggle
  document.getElementById('togAnim').onclick = function () {
    state.settings.anim = !state.settings.anim;
    this.classList.toggle('on', state.settings.anim);
    document.documentElement.style.setProperty('--dur', state.settings.anim ? '0.22s' : '0s');
    Profiles.save();
  };

  // High contrast toggle
  highContrast = localStorage.getItem('aac-high-contrast') === 'true';
  document.getElementById('togContrast').classList.toggle('on', highContrast);
  document.body.classList.toggle('high-contrast', highContrast);
  document.getElementById('togContrast').onclick = function () {
    highContrast = !highContrast;
    this.classList.toggle('on', highContrast);
    document.body.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('aac-high-contrast', String(highContrast));
    Profiles.save();
  };

  // Grid size
  const gridSizeSelect = document.getElementById('gridSizeSelect');
  const savedGridSize = localStorage.getItem('aac-grid-size') || 'medium';
  gridSizeSelect.value = savedGridSize;
  function applyGridSize(size) {
    document.getElementById('app').classList.remove('grid-large', 'grid-medium', 'grid-small');
    if (size !== 'medium') document.getElementById('app').classList.add('grid-' + size);
  }
  applyGridSize(savedGridSize);
  gridSizeSelect.onchange = function () {
    const size = this.value;
    localStorage.setItem('aac-grid-size', size);
    applyGridSize(size);
    Profiles.save();
  };

  // Voice engine
  const voiceEngineSelect = document.getElementById('voiceEngineSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceSelectRow = document.getElementById('voiceSelectRow');
  const voiceSpeedRow = document.getElementById('voiceSpeedRow');
  const voiceSpeedEl = document.getElementById('voiceSpeed');
  voiceSpeedEl.value = Speech.getRate();

  // Delay initial voice UI to let puter.js load
  setTimeout(() => Speech.updateVoiceUI(voiceEngineSelect, voiceSelect), 500);

  voiceEngineSelect.onchange = function () {
    Speech.setEngine(this.value);
    Speech.setVoiceURI('');
    const isBrowser = Speech.populateVoices(voiceSelect);
    voiceSpeedRow.style.display = isBrowser ? '' : 'none';
    Profiles.save();
  };
  voiceSelect.onchange = function () {
    Speech.setVoiceURI(this.value);
    Profiles.save();
  };
  voiceSpeedEl.oninput = function () {
    Speech.setRate(parseFloat(this.value));
    Profiles.save();
  };
  document.getElementById('voiceTest').onclick = function () {
    Speech.speak(Lang.t('testVoicePhrase'));
  };

  // Language selection
  const langSelect = document.getElementById('langSelect');
  populateLangs(langSelect);
  langSelect.onchange = function () {
    Lang.set(this.value);
    const defaults = Lang.defaults();
    state.DECKS = JSON.parse(JSON.stringify(defaults.decks));
    state.BINDERS = JSON.parse(JSON.stringify(defaults.binders));
    state.currentBinder = Object.keys(state.BINDERS)[0] || 'all';
    Speech.setVoiceURI('');
    Speech.updateVoiceUI(voiceEngineSelect, voiceSelect);
    voiceSpeedRow.style.display = Speech.getEngine() === 'browser' ? '' : 'none';
    renderShelf();
    renderBinderTabs();
    emit('lang:change', this.value);
    Profiles.save();
  };

  // AI toggles
  document.getElementById('togCompanion').onclick = function () {
    const on = localStorage.getItem('aac-friend-enabled') === 'false';
    localStorage.setItem('aac-friend-enabled', String(on));
    this.classList.toggle('on', on);
    const stripAi = document.getElementById('stripAi');
    if (stripAi) stripAi.style.display = on ? '' : 'none';
    emit('settings:change', { key: 'companion', value: on });
    Profiles.save();
  };
  document.getElementById('togSuggestions').onclick = function () {
    const on = localStorage.getItem('aac-friend-suggestions') === 'false';
    localStorage.setItem('aac-friend-suggestions', String(on));
    this.classList.toggle('on', on);
    emit('settings:change', { key: 'suggestions', value: on });
    Profiles.save();
  };

  refreshSettingsUI();
}

function populateLangs(langSelect) {
  const langs = Lang.list();
  const cur = Lang.getCurrent();
  langSelect.innerHTML = '';
  for (let i = 0; i < langs.length; i++) {
    const opt = document.createElement('option');
    opt.value = langs[i].code;
    opt.textContent = langs[i].nativeName + ' (' + langs[i].name + ')';
    if (langs[i].code === cur) opt.selected = true;
    langSelect.appendChild(opt);
  }
}

export function refreshVoiceAndLang() {
  const voiceEngineSelect = document.getElementById('voiceEngineSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceSpeedRow = document.getElementById('voiceSpeedRow');
  const voiceSpeedEl = document.getElementById('voiceSpeed');
  voiceSpeedEl.value = Speech.getRate();
  Speech.updateVoiceUI(voiceEngineSelect, voiceSelect);
  voiceSpeedRow.style.display = Speech.getEngine() === 'browser' ? '' : 'none';
  populateLangs(document.getElementById('langSelect'));
}
