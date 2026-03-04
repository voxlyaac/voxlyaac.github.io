// components/strip-ops.js — Clear/back/save/speak buttons (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Speech from '../services/speech.js';
import * as Stats from '../stats.js';
import * as Profiles from '../profiles.js';
import { rebuild } from './strip.js';
import { openDeck, getCurrentDeck } from './deck-area.js';
import { openModal } from './modal.js';
import { bindCard } from './deck-area.js';

function findPhrasesDeck() {
  for (const [k, d] of Object.entries(state.DECKS)) {
    if (d.hex === '#9B7DC7') return { key: k, deck: d };
  }
  return null;
}

export function init() {
  const wordsEl = document.getElementById('words');

  document.getElementById('bClear').onclick = () => {
    if (!state.sentence.length) return;
    [...wordsEl.children].forEach((c, i) => setTimeout(() => c.classList.add('leaving'), i * 40));
    setTimeout(() => {
      state.sentence = [];
      rebuild();
      emit('sentence:clear');
      emit('sentence:change', state.sentence);
    }, wordsEl.children.length * 40 + 220);
  };

  document.getElementById('bBack').onclick = () => {
    if (!state.sentence.length) return;
    var last = wordsEl.lastChild;
    if (last) { last.classList.add('leaving'); }
    setTimeout(() => {
      state.sentence.pop();
      rebuild();
      emit('sentence:change', state.sentence);
    }, 220);
  };

  document.getElementById('bSave').onclick = () => {
    if (!state.sentence.length) return;
    const aiEl = document.getElementById('stripAiText');
    const aiText = aiEl ? aiEl.textContent.trim() : '';
    const phraseText = (aiText && aiText !== '...') ? aiText : state.sentence.map(w => w.label).join(' ');
    const found = findPhrasesDeck();
    if (!found) return;
    if (found.deck.w.some(w => w.l === phraseText)) return;
    found.deck.w.push({ e: '💬', l: phraseText });
    if (getCurrentDeck() === found.key) {
      const g = document.getElementById('fan');
      const addBtn = g.querySelector('.add-card');
      const w = found.deck.w[found.deck.w.length - 1];
      const idx = found.deck.w.length - 1;
      const c = document.createElement('div');
      c.className = 'card dealt'; c.style.setProperty('--c', found.deck.hex);
      c.dataset.emoji = w.e; c.dataset.label = w.l; c.dataset.color = found.deck.hex;
      if (w.img) c.dataset.img = w.img;
      const ld = state.settings.labels ? '' : 'style="display:none"';
      const cIcon = w.img ? `<img class="card-img" src="${w.img}" alt="${w.l}">` : `<span class="card-e">${w.e}</span>`;
      c.innerHTML = `${cIcon}<span class="card-l" ${ld}>${w.l}</span><div class="edit-btn">✎</div>`;
      c.querySelector('.edit-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); });
      c.querySelector('.edit-btn').addEventListener('pointerup', (e) => { e.stopPropagation(); });
      c.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openModal({ mode: 'edit-card', deckKey: found.key, cardIndex: idx, emoji: w.e, label: w.l, img: w.img }); };
      bindCard(c);
      g.insertBefore(c, addBtn);
    }
    emit('deck:change', found.key);
    Profiles.save();
    const btn = document.getElementById('bSave');
    btn.classList.remove('saved');
    void btn.offsetWidth;
    btn.classList.add('saved');
  };

  document.getElementById('bSpeak').onclick = () => {
    if (!state.sentence.length) return;
    Stats.track('sentenceSpoken', { wordCount: state.sentence.length });
    const text = state.sentence.map(w => w.label).join(' ');
    emit('sentence:speak', { text, sentence: state.sentence });
    const u = Speech.speak(text);
    if (!u) return;
    let wi = 0;
    const chips = wordsEl.querySelectorAll('.chip');
    u.onboundary = e => { if (e.name === 'word' && wi < chips.length) { chips.forEach(c => c.classList.remove('active-word')); chips[wi].classList.add('active-word'); wi++; } };
    u.onend = () => chips.forEach(c => c.classList.remove('active-word'));
  };
}
