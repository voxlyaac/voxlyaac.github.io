// components/binder-bar.js — Binder tab navigation (ES module)

import state from '../state.js';
import * as Profiles from '../profiles.js';
import { renderShelf, closeDeck, getCurrentDeck } from './deck-area.js';
import { openModal } from './modal.js';

let binderDragClone = null, binderDragKey = null, binderDragInsert = null, binderDidDrag = false;
let binderTabsEl, binderL, binderR;

function reorderBinders(fromKey, toIdx) {
  const entries = Object.entries(state.BINDERS);
  const fromIdx = entries.findIndex(([k]) => k === fromKey);
  if (fromIdx < 0 || fromIdx === toIdx) return;
  const item = entries.splice(fromIdx, 1)[0];
  if (toIdx > fromIdx) toIdx--;
  entries.splice(toIdx, 0, item);
  const newObj = {};
  entries.forEach(([k, v]) => { newObj[k] = v; });
  state.BINDERS = newObj;
  Profiles.save();
}

function updateBinderArrows() {
  const sl = binderTabsEl.scrollLeft, sw = binderTabsEl.scrollWidth, cw = binderTabsEl.clientWidth;
  binderL.classList.toggle('vis', sl > 4);
  binderR.classList.toggle('vis', sl < sw - cw - 4);
}

function binderTabWidth() {
  const tab = binderTabsEl.querySelector('.binder-tab');
  if (!tab) return 120;
  const style = getComputedStyle(binderTabsEl);
  return tab.offsetWidth + parseFloat(style.gap || 0);
}

function openBinderModal(key) {
  const isEdit = key !== null;
  const b = isEdit ? state.BINDERS[key] : null;
  openModal({
    mode: isEdit ? 'edit-binder' : 'add-binder',
    binderKey: key,
    emoji: isEdit ? b.icon : '',
    label: isEdit ? key : '',
    img: isEdit ? b.img : null,
    decks: isEdit && b.decks ? [...b.decks] : []
  });
}

export function renderBinderTabs() {
  binderTabsEl.innerHTML = '';
  Object.entries(state.BINDERS).forEach(([k, b], idx) => {
    const tab = document.createElement('button');
    tab.className = 'binder-tab' + (k === state.currentBinder ? ' active' : '');
    tab.type = 'button';
    tab.dataset.key = k;
    tab.dataset.idx = idx;
    const bIcon = b.img ? `<img src="${b.img}" alt="${k}">` : b.icon;
    const editHtml = k !== 'all' ? '<div class="edit-btn binder-edit">✎</div>' : '';
    tab.innerHTML = `<span class="binder-tab-icon">${bIcon}</span><span class="binder-tab-label">${k}</span>${editHtml}`;

    tab.addEventListener('click', () => {
      if (binderDidDrag) { binderDidDrag = false; return; }
      if (state.currentBinder === k) return;
      state.currentBinder = k;
      Profiles.save();
      if (getCurrentDeck()) {
        closeDeck();
      } else {
        renderShelf();
      }
      renderBinderTabs();
    });

    if (k !== 'all') {
      const editBtn = tab.querySelector('.binder-edit');
      editBtn.addEventListener('pointerdown', e => e.stopPropagation());
      editBtn.addEventListener('pointerup', e => e.stopPropagation());
      editBtn.onclick = e => { e.stopPropagation(); openBinderModal(k); };
    }

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
          const otherTabs = [...binderTabsEl.querySelectorAll('.binder-tab')].filter(t => t.dataset.key !== k);
          let initialGap = 0;
          for (const t of otherTabs) { if (parseInt(t.dataset.idx) < idx) initialGap++; else break; }
          if (initialGap < 1) initialGap = 1;
          binderDragInsert = initialGap;
          tab.style.overflow = 'hidden';
          tab.style.transition = 'none';
          tab.style.width = '0'; tab.style.minWidth = '0'; tab.style.padding = '0';
          tab.style.borderWidth = '0'; tab.style.opacity = '0'; tab.style.flexBasis = '0';
          otherTabs.forEach((t, j) => {
            t.style.transition = 'none';
            t.style.marginLeft = (j === initialGap) ? `${cachedW + 8}px` : '';
          });
          binderDragClone = tab.cloneNode(true);
          binderDragClone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.9;width:${cachedW}px;height:${cachedH}px;box-shadow:0 6px 18px rgba(0,0,0,0.15);transition:none;`;
          binderDragClone.className = 'binder-tab active';
          document.body.appendChild(binderDragClone);
          requestAnimationFrame(() => {
            otherTabs.forEach(t => { t.style.transition = 'margin 0.15s ease'; });
          });
        }
        if (moved && binderDragClone) {
          binderDragClone.style.left = `${e.clientX - cachedW / 2}px`;
          binderDragClone.style.top = `${e.clientY - cachedH / 2}px`;
          const otherTabs = [...binderTabsEl.querySelectorAll('.binder-tab')].filter(t => t.dataset.key !== k);
          let insertIdx = otherTabs.length;
          for (let j = 0; j < otherTabs.length; j++) {
            const r = otherTabs[j].getBoundingClientRect();
            if (e.clientX < r.left + r.width / 2) { insertIdx = j; break; }
          }
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

    binderTabsEl.appendChild(tab);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'binder-tab-add';
  addBtn.type = 'button';
  addBtn.textContent = '+';
  addBtn.onclick = () => openBinderModal(null);
  binderTabsEl.appendChild(addBtn);
  setTimeout(updateBinderArrows, 100);
}

export function init() {
  binderTabsEl = document.getElementById('binderTabs');
  binderL = document.getElementById('binderL');
  binderR = document.getElementById('binderR');

  binderTabsEl.addEventListener('scroll', updateBinderArrows);
  binderL.onclick = () => binderTabsEl.scrollBy({ left: -binderTabWidth(), behavior: 'smooth' });
  binderR.onclick = () => binderTabsEl.scrollBy({ left: binderTabWidth(), behavior: 'smooth' });

  renderBinderTabs();
}
