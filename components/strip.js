// components/strip.js — Sentence strip (ES module)

import state from '../state.js';
import { emit } from '../events.js';
import * as Speech from '../services/speech.js';
import * as Stats from '../stats.js';

const wordsEl = document.getElementById('words');
const phEl = document.getElementById('ph');
const btnsEl = document.getElementById('btns');
const stripL = document.getElementById('stripL');
const stripR = document.getElementById('stripR');
let chipDrag = null, chipDragIdx = -1, chipClone = null;

function updateStripArrows() {
  const sl = wordsEl.scrollLeft, sw = wordsEl.scrollWidth, cw = wordsEl.clientWidth;
  stripL.classList.toggle('vis', sl > 4);
  stripR.classList.toggle('vis', sl < sw - cw - 4);
}

export function addWord(emoji, label, color, img) {
  state.sentence.push({ emoji, label, color, img });
  renderStrip();
  Stats.track('cardTap', { label: label });
  emit('sentence:change', state.sentence);
}

function makeChip(w, i, entering) {
  const c = document.createElement('div');
  c.className = 'chip' + (entering ? ' entering' : '');
  c.style.setProperty('--cc', w.color); c.style.borderTopColor = w.color;
  const ld = state.settings.labels ? '' : 'style="display:none"';
  const chipIcon = w.img ? `<img class="chip-img" src="${w.img}" alt="${w.label}">` : `<span class="ce">${w.emoji}</span>`;
  c.innerHTML = `${chipIcon}<span class="cl" ${ld}>${w.label}</span>`;
  c.dataset.idx = i;
  c.style.touchAction = 'none';
  if (entering) c.addEventListener('animationend', () => c.classList.remove('entering'), { once: true });

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
      chipClone = document.createElement('div');
      chipClone.className = 'chip';
      chipClone.style.setProperty('--cc', w.color); chipClone.style.borderLeftColor = w.color;
      chipClone.style.cssText += `;position:fixed;z-index:9999;pointer-events:none;margin:0;
        box-shadow:0 6px 18px rgba(0,0,0,0.12);opacity:0.92;`;
      chipClone.innerHTML = c.innerHTML;
      document.body.appendChild(chipClone);
    }
    if (moved) {
      if (chipClone) {
        chipClone.style.left = `${e.clientX - 33}px`;
        chipClone.style.top = `${e.clientY - 33}px`;
      }
      const chips = [...wordsEl.querySelectorAll('.chip')];
      let insertIdx = chips.length;
      for (let j = 0; j < chips.length; j++) {
        const r = chips[j].getBoundingClientRect();
        if (e.clientX < r.left + r.width / 2) { insertIdx = j; break; }
      }
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
        state.sentence.splice(chipDragIdx, 1);
      } else if (chipDrag) {
        let from = chipDragIdx;
        let to = chipDrag.insertIdx;
        if (to > from) to--;
        if (from !== to && from >= 0 && from < state.sentence.length) {
          const item = state.sentence.splice(from, 1)[0];
          state.sentence.splice(to, 0, item);
        }
      }
      chipDrag = null; chipDragIdx = -1;
      rebuild();
      emit('sentence:change', state.sentence);
    } else {
      Speech.speak(w.label);
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
  phEl.style.display = state.sentence.length ? 'none' : '';
  btnsEl.classList.add('vis');
  wordsEl.style.display = state.sentence.length ? 'flex' : 'none';
  while (wordsEl.children.length > state.sentence.length) wordsEl.lastChild.remove();
  for (let i = wordsEl.children.length; i < state.sentence.length; i++) {
    wordsEl.appendChild(makeChip(state.sentence[i], i, true));
    requestAnimationFrame(() => { wordsEl.scrollTo({ left: wordsEl.scrollWidth, behavior: 'smooth' }); updateStripArrows(); });
  }
  updateStripArrows();
}

export function rebuild() {
  wordsEl.innerHTML = '';
  phEl.style.display = state.sentence.length ? 'none' : '';
  btnsEl.classList.add('vis');
  wordsEl.style.display = state.sentence.length ? 'flex' : 'none';
  state.sentence.forEach((w, i) => wordsEl.appendChild(makeChip(w, i, false)));
  updateStripArrows();
}

export function getChipDragIdx() { return chipDragIdx; }

export function init() {
  wordsEl.addEventListener('scroll', updateStripArrows);
  stripL.onclick = () => wordsEl.scrollBy({ left: -120, behavior: 'smooth' });
  stripR.onclick = () => wordsEl.scrollBy({ left: 120, behavior: 'smooth' });
}
