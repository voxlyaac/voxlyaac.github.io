// components/modal.js — Card/deck/binder/profile editor modal (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Lang from '../lang.js';
import * as Profiles from '../profiles.js';
import * as Camera from '../services/camera.js';
import * as Symbols from '../services/symbols.js';

const PALETTE = ['#F5C518', '#6BAF7B', '#6B9DC7', '#D4944A', '#C78DA3', '#9B7DC7', '#CC4444', '#6db5a0', '#c9976b', '#8a8ec7', '#a08abb'];

let mOverlay, mTitle, mPreview, mEmoji, mLabel, mColors, mSave, mCancel, mDelete, mFile;
let mCameraBtn, mClearImg, camView, camVideo, camCanvas, camSnap, camSwitch;
let mSymbolBtn, symSearch, symInput, symGrid, emojiPick, mEmojiBtn;
let binderDeckField, binderDeckList;
let symDebounce = null;
let modalOpts = null;
let modalImg = null;

// Lazy imports to break circular deps
let _renderShelf, _renderBinderTabs, _openDeck, _notifyDeckChange, _profileRefreshCb;

export function setRenderCallbacks(renderShelf, renderBinderTabs, openDeck, notifyDeckChange) {
  _renderShelf = renderShelf;
  _renderBinderTabs = renderBinderTabs;
  _openDeck = openDeck;
  _notifyDeckChange = notifyDeckChange;
}

export function setProfileRefreshCallback(cb) {
  _profileRefreshCb = cb;
}

function setModalPreview() {
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

export function openModal(opts) {
  if (document.body.classList.contains('mode-user')) return;
  modalOpts = opts;
  modalImg = opts.img || null;
  mFile.value = ''; camView.classList.remove('vis'); symSearch.classList.remove('vis'); emojiPick.classList.remove('vis');
  const isDeck = opts.mode.includes('deck');
  const isBinder = opts.mode.includes('binder');
  const isProfile = opts.mode === 'edit-profile';
  const isEdit = opts.mode.includes('edit');
  let titleKey;
  if (isProfile) titleKey = 'editProfile';
  else if (isBinder) titleKey = isEdit ? 'editBinder' : 'newBinder';
  else if (isDeck) titleKey = isEdit ? 'editDeck' : 'newDeck';
  else titleKey = isEdit ? 'editCard' : 'newCard';
  mTitle.textContent = Lang.t(titleKey);
  mEmoji.value = opts.emoji || '';
  mLabel.value = opts.label || '';
  setModalPreview();
  mDelete.style.display = (isEdit && !isProfile) ? '' : 'none';
  mColors.style.display = (isDeck || isProfile) ? '' : 'none';
  binderDeckField.style.display = isBinder ? '' : 'none';
  if (isProfile) {
    mLabel.placeholder = Lang.t('modalPlaceholderProfile');
  } else {
    mLabel.placeholder = isBinder ? Lang.t('modalPlaceholderBinder') : (isDeck ? Lang.t('modalPlaceholderDeck') : Lang.t('modalPlaceholderCard'));
  }
  if (isDeck || isProfile) {
    mColors.innerHTML = '';
    const sel = opts.hex || PALETTE[Object.keys(state.DECKS).length % PALETTE.length];
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
    Object.entries(state.DECKS).forEach(([dk, d]) => {
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

function closeModal() {
  Camera.stop(camVideo);
  camView.classList.remove('vis');
  symSearch.classList.remove('vis');
  emojiPick.classList.remove('vis');
  mOverlay.classList.remove('vis');
  modalOpts = null;
}

function handleSave() {
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
    state.DECKS[deckKey] = deck;
    const cb = state.BINDERS[state.currentBinder];
    if (cb.decks) cb.decks.push(deckKey);
    closeModal(); _renderShelf(); _renderBinderTabs();
  } else if (o.mode === 'edit-deck') {
    const activeSw = mColors.querySelector('.modal-swatch.active');
    const hex = activeSw ? activeSw.style.background : o.hex;
    const d = state.DECKS[o.deckKey];
    d.i = emoji || d.i; d.hex = hex;
    d.img = img;
    if (label && label.toLowerCase() !== o.deckKey) {
      const newKey = label.toLowerCase();
      state.DECKS[newKey] = d;
      delete state.DECKS[o.deckKey];
      Object.values(state.BINDERS).forEach(b => {
        if (b.decks) { const idx = b.decks.indexOf(o.deckKey); if (idx !== -1) b.decks[idx] = newKey; }
      });
    }
    closeModal(); _renderShelf(); _renderBinderTabs();
  } else if (o.mode === 'add-card') {
    if (!emoji && !img) return;
    const card = { e: emoji || '', l: label };
    if (img) card.img = img;
    state.DECKS[o.deckKey].w.push(card);
    closeModal(); _openDeck(o.deckKey);
  } else if (o.mode === 'edit-card') {
    const w = state.DECKS[o.deckKey].w[o.cardIndex];
    w.e = emoji || w.e; w.l = label;
    w.img = img;
    closeModal(); _openDeck(o.deckKey);
  } else if (o.mode === 'add-binder') {
    if (!label) return;
    const name = label.toLowerCase();
    if (state.BINDERS[name]) return;
    const selected = [...binderDeckList.querySelectorAll('.binder-deck-item.checked')].map(el => el.dataset.deck);
    const binder = { icon: emoji || '📋', decks: selected };
    if (img) binder.img = img;
    state.BINDERS[name] = binder;
    state.currentBinder = name;
    closeModal(); _renderBinderTabs(); _renderShelf();
  } else if (o.mode === 'edit-binder') {
    const b = state.BINDERS[o.binderKey];
    b.icon = emoji || b.icon;
    b.img = img;
    const selected = [...binderDeckList.querySelectorAll('.binder-deck-item.checked')].map(el => el.dataset.deck);
    b.decks = selected;
    if (label && label.toLowerCase() !== o.binderKey) {
      const newKey = label.toLowerCase();
      state.BINDERS[newKey] = b;
      delete state.BINDERS[o.binderKey];
      if (state.currentBinder === o.binderKey) state.currentBinder = newKey;
    }
    closeModal(); _renderBinderTabs(); _renderShelf();
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
    if (_profileRefreshCb) _profileRefreshCb();
    _notifyDeckChange();
    return;
  }
  _notifyDeckChange();
}

function handleDelete() {
  const o = modalOpts; if (!o) return;
  if (o.mode === 'edit-deck') {
    delete state.DECKS[o.deckKey];
    Object.values(state.BINDERS).forEach(b => {
      if (b.decks) { const idx = b.decks.indexOf(o.deckKey); if (idx !== -1) b.decks.splice(idx, 1); }
    });
    closeModal(); _renderShelf(); _renderBinderTabs();
  } else if (o.mode === 'edit-card') {
    state.DECKS[o.deckKey].w.splice(o.cardIndex, 1);
    closeModal(); _openDeck(o.deckKey);
  } else if (o.mode === 'edit-binder') {
    if (o.binderKey === 'all') return;
    delete state.BINDERS[o.binderKey];
    if (state.currentBinder === o.binderKey) state.currentBinder = 'all';
    closeModal(); _renderBinderTabs(); _renderShelf();
  }
  _notifyDeckChange();
}

async function fetchSymbols(q) {
  symGrid.innerHTML = '<div class="symbol-no">' + Lang.t('symbolSearching') + '</div>';
  try {
    const data = await Symbols.search(q);
    symGrid.innerHTML = '';
    if (!data.length) { symGrid.innerHTML = '<div class="symbol-no">' + Lang.t('symbolNoResults') + '</div>'; return; }
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
    symGrid.innerHTML = '<div class="symbol-no">' + Lang.t('symbolSearchFailed') + '</div>';
  }
}

export function init() {
  mOverlay = document.getElementById('modalOverlay');
  mTitle = document.getElementById('modalTitle');
  mPreview = document.getElementById('modalPreview');
  mEmoji = document.getElementById('modalEmoji');
  mLabel = document.getElementById('modalLabel');
  mColors = document.getElementById('modalColors');
  mSave = document.getElementById('modalSave');
  mCancel = document.getElementById('modalCancel');
  mDelete = document.getElementById('modalDelete');
  mFile = document.getElementById('modalFile');
  mCameraBtn = document.getElementById('modalCameraBtn');
  mClearImg = document.getElementById('modalClearImg');
  camView = document.getElementById('cameraView');
  camVideo = document.getElementById('cameraVideo');
  camCanvas = document.getElementById('cameraCanvas');
  camSnap = document.getElementById('cameraSnap');
  camSwitch = document.getElementById('cameraSwitch');
  mSymbolBtn = document.getElementById('modalSymbolBtn');
  symSearch = document.getElementById('symbolSearch');
  symInput = document.getElementById('symbolInput');
  symGrid = document.getElementById('symbolGrid');
  emojiPick = document.getElementById('emojiPick');
  mEmojiBtn = document.getElementById('modalEmojiBtn');
  binderDeckField = document.getElementById('binderDeckField');
  binderDeckList = document.getElementById('binderDeckList');

  mEmojiBtn.onclick = () => {
    if (emojiPick.classList.contains('vis')) { emojiPick.classList.remove('vis'); return; }
    Camera.stop(camVideo); camView.classList.remove('vis'); symSearch.classList.remove('vis');
    emojiPick.classList.add('vis');
    setTimeout(() => mEmoji.focus(), 100);
  };

  mEmoji.addEventListener('input', () => { if (mEmoji.value.trim()) modalImg = null; setModalPreview(); });

  mFile.addEventListener('change', () => {
    const f = mFile.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { modalImg = reader.result; mEmoji.value = ''; setModalPreview(); };
    reader.readAsDataURL(f);
  });

  mCameraBtn.onclick = async () => {
    if (Camera.isActive()) { Camera.stop(camVideo); camView.classList.remove('vis'); return; }
    emojiPick.classList.remove('vis'); symSearch.classList.remove('vis');
    try {
      const stream = await Camera.start();
      camVideo.srcObject = stream;
      camSwitch.classList.toggle('vis', Camera.getDevices().length > 1);
      camView.classList.add('vis');
    } catch (e) {
      alert(Lang.t('cameraError'));
    }
  };

  camSwitch.onclick = async () => {
    try {
      const stream = await Camera.switchCamera();
      if (stream) camVideo.srcObject = stream;
    } catch (e) { /* keep current */ }
  };

  camSnap.onclick = () => {
    modalImg = Camera.snap(camVideo, camCanvas);
    mEmoji.value = '';
    setModalPreview();
    Camera.stop(camVideo);
    camView.classList.remove('vis');
  };

  mClearImg.onclick = () => {
    modalImg = null; mEmoji.value = ''; mFile.value = '';
    Camera.stop(camVideo); camView.classList.remove('vis');
    symSearch.classList.remove('vis'); emojiPick.classList.remove('vis');
    setModalPreview();
  };

  mSymbolBtn.onclick = () => {
    if (symSearch.classList.contains('vis')) { symSearch.classList.remove('vis'); return; }
    Camera.stop(camVideo); camView.classList.remove('vis'); emojiPick.classList.remove('vis');
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

  mCancel.onclick = closeModal;
  mOverlay.addEventListener('pointerdown', e => { if (e.target === mOverlay) closeModal(); });
  mSave.onclick = handleSave;
  mDelete.onclick = handleDelete;
}
