// components/deck-area.js — Shelf grid, open view, quick access (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Lang from '../lang.js';
import * as Stats from '../stats.js';
import * as Profiles from '../profiles.js';
import { addWord } from './strip.js';
import { openModal } from './modal.js';
import { render as renderQuickAccess } from './quick-access.js';

let currentDeck = null;

let shelf, shelfWrap, shelfScroll, shelfUp, shelfDown;
let openView, fanScroll, fanUp, fanDown;
let searchArea, searchInput;

function updateShelfArrows() {
  const st = shelfScroll.scrollTop, sh = shelfScroll.scrollHeight, ch = shelfScroll.clientHeight;
  shelfUp.classList.toggle('vis', st > 4);
  shelfDown.classList.toggle('vis', st < sh - ch - 4);
}

function updateFanArrows() {
  const st = fanScroll.scrollTop, sh = fanScroll.scrollHeight, ch = fanScroll.clientHeight;
  fanUp.classList.toggle('vis', st > 4);
  fanDown.classList.toggle('vis', st < sh - ch - 4);
}

export function getCurrentDeck() { return currentDeck; }

export function renderShelf() {
  shelf.innerHTML = '';
  const b = state.BINDERS[state.currentBinder];
  if (!b) return;
  const entries = Object.entries(state.DECKS).filter(([k]) => !b.decks || b.decks.includes(k));
  entries.forEach(([k, d], di) => {
    const el = document.createElement('div');
    el.className = 'deck'; el.style.setProperty('--dc', d.hex);
    el.style.animationDelay = `${di * 50}ms`;
    const dIcon = d.img ? `<img class="deck-img" src="${d.img}" alt="${k}">` : d.i;
    el.innerHTML = `<div class="sl" style="--dc:${d.hex}"></div><div class="sl" style="--dc:${d.hex}"></div>
      <div class="deck-face" style="--dc:${d.hex}"><span class="deck-icon">${dIcon}</span><span class="deck-name">${k}</span><span class="deck-count">${Lang.t('cardCount')(d.w.length)}</span></div>
      <div class="edit-btn">✎</div>`;
    el.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openModal({ mode: 'edit-deck', deckKey: k, emoji: d.i, label: k, hex: d.hex, img: d.img }); };
    el.onclick = () => openDeck(k);
    shelf.appendChild(el);
  });
  const add = document.createElement('div');
  add.className = 'add-deck';
  add.innerHTML = '<span class="add-icon">+</span>';
  add.onclick = () => openModal({ mode: 'add-deck' });
  shelf.appendChild(add);
  setTimeout(updateShelfArrows, 100);
  renderQuickAccess();
}

export function openDeck(k) {
  Stats.track('deckOpen', { deck: k });
  currentDeck = k;
  const d = state.DECKS[k];
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
    const ld = state.settings.labels ? '' : 'style="display:none"';
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
  ac.onclick = () => openModal({ mode: 'add-card', deckKey: k });
  g.appendChild(ac);
  setTimeout(updateFanArrows, 100);
}

export function closeDeck() {
  currentDeck = null;
  searchArea.classList.remove('open');
  searchInput.value = '';
  openView.classList.remove('vis');
  setTimeout(() => shelfWrap.classList.remove('out'), 30);
  renderShelf();
}

// Card interaction (drag to strip + tap)
export function bindCard(card) {
  let sx, sy, mv, down;
  let ghost = null, ghostSrc = null;
  card.addEventListener('pointerdown', e => {
    e.preventDefault(); card.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; mv = false; down = true;
  });
  card.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!mv && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      mv = true;
      ghost = document.createElement('div'); ghost.className = 'drag-clone';
      ghost.style.setProperty('--c', card.dataset.color);
      const ld = state.settings.labels ? '' : 'style="display:none"';
      const gIcon = card.dataset.img ? `<img class="card-img" src="${card.dataset.img}" alt="${card.dataset.label}">` : `<span class="card-e">${card.dataset.emoji}</span>`;
      ghost.innerHTML = `${gIcon}<span class="card-l" ${ld}>${card.dataset.label}</span>`;
      ghost.style.left = `${e.clientX - 52}px`; ghost.style.top = `${e.clientY - 62}px`;
      document.body.appendChild(ghost);
      state.isDrag = true;
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
      ghost.remove(); ghost = null;
      state.isDrag = false;
      document.getElementById('strip').classList.remove('ready');
    } else if (!mv) {
      addWord(card.dataset.emoji, card.dataset.label, card.dataset.color, card.dataset.img);
      openView.classList.remove('vis');
      setTimeout(() => shelfWrap.classList.remove('out'), 30);
    }
  });
  card.addEventListener('pointercancel', () => {
    down = false;
    if (ghost) { ghost.remove(); ghost = null; }
    state.isDrag = false;
    document.getElementById('strip').classList.remove('ready');
  });
}

export function notifyDeckChange(deckKey) {
  Profiles.save();
  if (!currentDeck) {
    if (deckKey && state.DECKS[deckKey]) {
      const nameEls = shelf.querySelectorAll('.deck-name');
      for (let i = 0; i < nameEls.length; i++) {
        if (nameEls[i].textContent === deckKey) {
          const countEl = nameEls[i].parentElement.querySelector('.deck-count');
          if (countEl) countEl.textContent = Lang.t('cardCount')(state.DECKS[deckKey].w.length);
          break;
        }
      }
    } else {
      renderShelf();
    }
  }
  emit('deck:change', deckKey);
}

export function init() {
  shelf = document.getElementById('shelf');
  shelfWrap = document.getElementById('shelfWrap');
  shelfScroll = document.getElementById('shelfScroll');
  shelfUp = document.getElementById('shelfUp');
  shelfDown = document.getElementById('shelfDown');
  openView = document.getElementById('openView');
  fanScroll = document.getElementById('fanScroll');
  fanUp = document.getElementById('fanUp');
  fanDown = document.getElementById('fanDown');
  searchArea = document.getElementById('searchArea');
  searchInput = document.getElementById('searchInput');

  shelfScroll.addEventListener('scroll', updateShelfArrows);
  shelfUp.onclick = () => shelfScroll.scrollBy({ top: -160, behavior: 'smooth' });
  shelfDown.onclick = () => shelfScroll.scrollBy({ top: 160, behavior: 'smooth' });

  fanScroll.addEventListener('scroll', updateFanArrows);
  fanUp.onclick = () => fanScroll.scrollBy({ top: -160, behavior: 'smooth' });
  fanDown.onclick = () => fanScroll.scrollBy({ top: 160, behavior: 'smooth' });

  document.getElementById('backBtn').onclick = closeDeck;

  renderShelf();
}
