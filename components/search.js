// components/search.js — Card search (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Lang from '../lang.js';
import { addWord } from './strip.js';
import { openDeck, getCurrentDeck, bindCard } from './deck-area.js';

let searchArea, searchBtn, searchInput;
let shelfWrap, openView;

function closeSearch() {
  searchArea.classList.remove('open');
  searchInput.value = '';
  searchInput.blur();
  if (getCurrentDeck()) { openDeck(getCurrentDeck()); } else { openView.classList.remove('vis'); shelfWrap.classList.remove('out'); emit('deck:close'); }
}

export function init() {
  searchArea = document.getElementById('searchArea');
  searchBtn = document.getElementById('searchBtn');
  searchInput = document.getElementById('searchInput');
  shelfWrap = document.getElementById('shelfWrap');
  openView = document.getElementById('openView');

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
    emit('deck:open');
    document.getElementById('oIcon').textContent = '🔍';
    document.getElementById('oTitle').textContent = 'search';
    Object.entries(state.DECKS).forEach(([dk, d]) => {
      d.w.forEach(w => {
        if (!w.l.toLowerCase().includes(q) && !w.e.includes(q)) return;
        const c = document.createElement('div');
        c.className = 'card dealt'; c.style.setProperty('--c', d.hex);
        c.dataset.emoji = w.e; c.dataset.label = w.l; c.dataset.color = d.hex;
        if (w.img) c.dataset.img = w.img;
        const ld = state.settings.labels ? '' : 'style="display:none"';
        const cIcon = w.img ? `<img class="card-img" src="${w.img}" alt="${w.l}">` : `<span class="card-e">${w.e}</span>`;
        c.innerHTML = `${cIcon}<span class="card-l" ${ld}>${w.l}</span>`;
        bindCard(c); g.appendChild(c);
      });
    });
    if (!g.children.length) g.innerHTML = '<div class="search-no">' + Lang.t('searchNoMatches') + '</div>';
  });
}
