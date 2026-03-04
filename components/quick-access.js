// components/quick-access.js — Quick access word bar (ES module)

import state from '../state.js';
import { on } from '../events.js';
import { addWord } from './strip.js';

const DEFAULT_WORDS = ['I', 'want', 'go', 'help', 'yes', 'no', 'more', 'stop'];

let qaEl;

export function render() {
  if (!qaEl) return;
  qaEl.innerHTML = '';
  DEFAULT_WORDS.forEach(function (label) {
    let found = null;
    for (const dk in state.DECKS) {
      const d = state.DECKS[dk];
      for (let i = 0; i < d.w.length; i++) {
        if (d.w[i].l.toLowerCase() === label.toLowerCase()) {
          found = { e: d.w[i].e, l: d.w[i].l, hex: d.hex, img: d.w[i].img };
          break;
        }
      }
      if (found) break;
    }
    if (!found) return;
    const card = document.createElement('div');
    card.className = 'quick-card';
    card.style.setProperty('--qc', found.hex);
    const ld = state.settings.labels ? '' : 'style="display:none"';
    const icon = found.img
      ? '<img class="card-img" src="' + found.img + '" alt="' + found.l + '" style="max-width:28px;max-height:28px">'
      : '<span class="qc-e">' + found.e + '</span>';
    card.innerHTML = icon + '<span class="qc-l" ' + ld + '>' + found.l + '</span>';
    card.onclick = function () {
      addWord(found.e, found.l, found.hex, found.img);
    };
    qaEl.appendChild(card);
  });
}

export function init() {
  qaEl = document.getElementById('quickAccess');

  // Re-render when decks change (card edits, language switch, etc.)
  on('deck:change', render);
}
