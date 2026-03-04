// components/profile-switcher.js — Profile panel + mode toggle (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Lang from '../lang.js';
import * as Stats from '../stats.js';
import * as Profiles from '../profiles.js';
import * as Speech from '../services/speech.js';
import { openModal, setProfileRefreshCallback } from './modal.js';
import { renderShelf } from './deck-area.js';
import { renderBinderTabs } from './binder-bar.js';
import { refreshSettingsUI, refreshVoiceAndLang } from './settings.js';

const AVATAR_COLORS = ['#6BAF7B', '#6B9DC7', '#E47A20', '#C78DA3', '#9B7DC7', '#CC4444', '#F5C518', '#6db5a0', '#8a8ec7', '#c9976b'];

let profileBtn, profileAvatar, profileNameEl, profileLock, profilePanel, profileList;
let profileAddInput, profileAddBtn, modeToggle;

function defaultAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function displayName(name) {
  if (name === 'default') return Lang.t('profileDefault');
  return name;
}

function getAvatarData(name) {
  const info = Profiles.listProfiles();
  const av = info.avatars[name];
  return {
    color: (av && av.color) || defaultAvatarColor(name),
    emoji: (av && av.emoji) || null,
    img: (av && av.img) || null
  };
}

function renderAvatarEl(el, name) {
  const av = getAvatarData(name);
  el.style.background = av.color;
  el.innerHTML = '';
  if (av.img) {
    const imgEl = document.createElement('img');
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
  const info = Profiles.listProfiles();
  updateProfileBtn(info.active);
  refreshSettingsUI();
  // Reload voice settings from localStorage
  Speech.setEngine(localStorage.getItem('aac-voice-engine') || 'browser');
  Speech.setVoiceURI(localStorage.getItem('aac-voice') || '');
  Speech.setRate(parseFloat(localStorage.getItem('aac-voice-speed')) || 0.85);
  refreshVoiceAndLang();
  renderShelf();
  renderBinderTabs();
  emit('profile:switch', info.active);
}

function renderList() {
  const info = Profiles.listProfiles();
  updateProfileBtn(info.active);
  profileList.innerHTML = '';
  for (let i = 0; i < info.profiles.length; i++) {
    (function (name) {
      const row = document.createElement('div');
      row.className = 'profile-item' + (name === info.active ? ' active' : '');

      const av = document.createElement('span');
      av.className = 'profile-item-avatar';
      renderAvatarEl(av, name);
      row.appendChild(av);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'profile-item-name';
      nameSpan.textContent = displayName(name);
      row.appendChild(nameSpan);

      const edit = document.createElement('button');
      edit.className = 'profile-item-edit';
      edit.type = 'button';
      edit.textContent = '✎';
      edit.onclick = function (e) {
        e.stopPropagation();
        const avData = getAvatarData(name);
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
        const del = document.createElement('button');
        del.className = 'profile-item-del';
        del.type = 'button';
        del.textContent = '\u2715';
        del.onclick = function (e) {
          e.stopPropagation();
          if (!confirm(Lang.t('confirmDeleteProfile')(name))) return;
          Profiles.deleteProfile(name);
          Stats.deleteForProfile(name);
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
        Stats.init(name);
        refreshUI();
        profilePanel.classList.remove('open');
      };

      profileList.appendChild(row);
    })(info.profiles[i]);
  }
}

function profileRefresh() {
  const info = Profiles.listProfiles();
  updateProfileBtn(info.active);
  renderList();
}

function addProfile() {
  const name = profileAddInput.value.trim().toLowerCase();
  if (!name) return;
  if (Profiles.createProfile(name)) {
    profileAddInput.value = '';
    Profiles.switchProfile(name);
    Stats.init(name);
    refreshUI();
    renderList();
  }
}

export function init() {
  profileBtn = document.getElementById('profileBtn');
  profileAvatar = document.getElementById('profileAvatar');
  profileNameEl = document.getElementById('profileName');
  profileLock = document.getElementById('profileLock');
  profilePanel = document.getElementById('profilePanel');
  profileList = document.getElementById('profileList');
  profileAddInput = document.getElementById('profileAddInput');
  profileAddBtn = document.getElementById('profileAddBtn');
  modeToggle = document.getElementById('modeToggle');

  // Mode (user / caretaker)
  const MODE_KEY = 'aac-mode';
  function getMode() { return localStorage.getItem(MODE_KEY) || 'user'; }
  function applyMode(mode) {
    document.body.classList.toggle('mode-user', mode === 'user');
    profileLock.style.display = mode === 'user' ? '' : 'none';
    const opts = modeToggle.querySelectorAll('.mode-toggle-opt');
    for (let i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('active', opts[i].dataset.mode === mode);
    }
  }
  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    applyMode(mode);
    emit('mode:change', mode);
  }
  modeToggle.onclick = function (e) {
    const opt = e.target.closest('.mode-toggle-opt');
    if (!opt) return;
    setMode(opt.dataset.mode);
  };
  applyMode(getMode());

  // Register modal callback for profile edit
  setProfileRefreshCallback(profileRefresh);

  profileBtn.onclick = function () {
    renderList();
    profilePanel.classList.toggle('open');
  };

  document.addEventListener('pointerdown', function (e) {
    if (!profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
      profilePanel.classList.remove('open');
    }
  });

  profileAddBtn.onclick = addProfile;
  profileAddInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addProfile();
  });

  updateProfileBtn(Profiles.listProfiles().active);
  Profiles.pullFromCloud();
}
