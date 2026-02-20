// tutorial.js — First-run guided tour
(function () {
  'use strict';

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
    var t = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.t : function (k) { return k; };
    return [
      { target: '#shelf',        text: t('tutStep1'), pos: 'below' },
      { target: '#strip',        text: t('tutStep2'), pos: 'below' },
      { target: '#bSpeak',       text: t('tutStep3'), pos: 'above' },
      { target: '#suggestBar',   text: t('tutStep4'), pos: 'below' },
      { target: '#profileArea',  text: t('tutStep5'), pos: 'below' },
      { target: '.binder-bar',   text: t('tutStep6'), pos: 'above' }
    ];
  }

  function positionStep(step) {
    var el = document.querySelector(step.target);
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var pad = 8;

    // Spotlight
    spotlight.style.top = (r.top - pad) + 'px';
    spotlight.style.left = (r.left - pad) + 'px';
    spotlight.style.width = (r.width + pad * 2) + 'px';
    spotlight.style.height = (r.height + pad * 2) + 'px';

    // Bubble position
    var bw = Math.min(300, window.innerWidth - 32);
    bubble.style.maxWidth = bw + 'px';

    // Measure bubble height
    bubble.style.visibility = 'hidden';
    bubble.style.top = '0'; bubble.style.bottom = 'auto';
    var bh = bubble.offsetHeight;
    bubble.style.visibility = '';

    // Auto-pick above or below based on available space
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

    // Horizontally center on the target, clamped to screen
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
    if (current >= steps.length) {
      end();
      return;
    }
    var step = steps[current];
    textEl.textContent = step.text;
    renderDots();

    var isLast = current === steps.length - 1;
    var t = (typeof AAC !== 'undefined' && AAC.Lang) ? AAC.Lang.t : function (k) { return k; };
    nextBtn.textContent = isLast ? t('tutDone') : t('tutNext');

    if (!positionStep(step)) {
      // Target not visible, skip
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

  function start() {
    steps = getSteps();
    current = 0;
    overlay.classList.add('active');
    showStep();
  }

  // Wire button
  nextBtn.onclick = next;

  // Tap overlay background to dismiss
  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay || e.target === overlay.querySelector('::before')) {
      end();
    }
  });

  // Settings button
  var tutBtn = document.getElementById('tutorialBtn');
  if (tutBtn) {
    tutBtn.onclick = function () {
      // Close settings panel
      var optionsPage = document.getElementById('optionsPage');
      if (optionsPage) optionsPage.classList.remove('open');
      setTimeout(start, 300);
    };
  }

  // Auto-start on first visit
  if (!localStorage.getItem(STORAGE_KEY)) {
    // Delay so the app finishes rendering
    setTimeout(start, 800);
  }

  // Expose for external use
  window.startTutorial = start;
})();
