// components/tutorial.js — First-run guided tour (ES module)

import * as Lang from '../lang.js';

var STORAGE_KEY = 'aac-tutorial-done';
var overlay = document.getElementById('tutOverlay');
var spotlight = document.getElementById('tutSpotlight');
var bubble = document.getElementById('tutBubble');
var textEl = document.getElementById('tutText');
var dotsEl = document.getElementById('tutDots');
var nextBtn = document.getElementById('tutNext');
var current = 0;
var steps = [];

function getSteps() {
  return [
    { target: '#shelf',        text: Lang.t('tutStep1'), pos: 'below' },
    { target: '#strip',        text: Lang.t('tutStep2'), pos: 'below' },
    { target: '#bSpeak',       text: Lang.t('tutStep3'), pos: 'above' },
    { target: '#suggestBar',   text: Lang.t('tutStep4'), pos: 'below' },
    { target: '#profileArea',  text: Lang.t('tutStep5'), pos: 'below' },
    { target: '.binder-bar',   text: Lang.t('tutStep6'), pos: 'above' }
  ];
}

function positionStep(step) {
  var el = document.querySelector(step.target);
  if (!el) return false;
  var r = el.getBoundingClientRect();
  var pad = 8;

  spotlight.style.top = (r.top - pad) + 'px';
  spotlight.style.left = (r.left - pad) + 'px';
  spotlight.style.width = (r.width + pad * 2) + 'px';
  spotlight.style.height = (r.height + pad * 2) + 'px';

  var bw = Math.min(300, window.innerWidth - 32);
  bubble.style.maxWidth = bw + 'px';

  bubble.style.visibility = 'hidden';
  bubble.style.top = '0'; bubble.style.bottom = 'auto';
  var bh = bubble.offsetHeight;
  bubble.style.visibility = '';

  var spaceBelow = window.innerHeight - r.bottom - pad - 12;
  var spaceAbove = r.top - pad - 12;
  var placeAbove = step.pos === 'above' || (spaceBelow < bh && spaceAbove > spaceBelow);

  if (placeAbove) {
    bubble.style.bottom = (window.innerHeight - r.top + pad + 12) + 'px';
    bubble.style.top = 'auto';
  } else {
    bubble.style.top = (r.bottom + pad + 12) + 'px';
    bubble.style.bottom = 'auto';
  }

  var cx = r.left + r.width / 2 - bw / 2;
  cx = Math.max(16, Math.min(cx, window.innerWidth - bw - 16));
  bubble.style.left = cx + 'px';

  return true;
}

function renderDots() {
  dotsEl.innerHTML = '';
  for (var i = 0; i < steps.length; i++) {
    var dot = document.createElement('span');
    dot.className = 'tut-dot' + (i === current ? ' active' : '');
    dotsEl.appendChild(dot);
  }
}

function showStep() {
  if (current >= steps.length) { end(); return; }
  var step = steps[current];
  textEl.textContent = step.text;
  renderDots();

  var isLast = current === steps.length - 1;
  nextBtn.textContent = isLast ? Lang.t('tutDone') : Lang.t('tutNext');

  if (!positionStep(step)) {
    current++;
    showStep();
    return;
  }
}

function next() {
  current++;
  showStep();
}

function end() {
  overlay.classList.remove('active');
  localStorage.setItem(STORAGE_KEY, '1');
  current = 0;
}

export function start() {
  steps = getSteps();
  current = 0;
  overlay.classList.add('active');
  showStep();
}

export function init() {
  nextBtn.onclick = next;

  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay) end();
  });

  var tutBtn = document.getElementById('tutorialBtn');
  if (tutBtn) {
    tutBtn.onclick = function () {
      var optionsPage = document.getElementById('optionsPage');
      if (optionsPage) optionsPage.classList.remove('open');
      setTimeout(start, 300);
    };
  }

  // Auto-start on first visit
  if (!localStorage.getItem(STORAGE_KEY)) {
    setTimeout(start, 800);
  }
}
