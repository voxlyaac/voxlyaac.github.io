// main.js — App entry point (ES module)

import state from './state.js';
import * as Lang from './lang.js';
import * as Stats from './stats.js';
import * as Profiles from './profiles.js';

// Components
import * as Strip from './components/strip.js';
import * as StripOps from './components/strip-ops.js';
import * as DeckArea from './components/deck-area.js';
import * as BinderBar from './components/binder-bar.js';
import * as Modal from './components/modal.js';
import * as Settings from './components/settings.js';
import * as Search from './components/search.js';
import * as ProfileSwitcher from './components/profile-switcher.js';
import * as SuggestBar from './components/suggest-bar.js';
import * as Chat from './components/chat.js';
import * as Reports from './components/reports.js';
import * as QuickAccess from './components/quick-access.js';
import * as Tutorial from './components/tutorial.js';

// Load all language packs
await Lang.loadAllLangs();

// Load saved profile (populates state.DECKS, BINDERS, settings, etc.)
Profiles.load();
Stats.init(Profiles.listProfiles().active);

// Wire cross-component callbacks (breaks circular deps)
Modal.setRenderCallbacks(DeckArea.renderShelf, BinderBar.renderBinderTabs, DeckArea.openDeck, DeckArea.notifyDeckChange);
Modal.setProfileRefreshCallback(function () {
  DeckArea.renderShelf();
  BinderBar.renderBinderTabs();
  Settings.refreshSettingsUI();
  Settings.refreshVoiceAndLang();
  SuggestBar.reinit();
});

// Init components in correct order
Strip.init();
StripOps.init();
QuickAccess.init();
DeckArea.init();
BinderBar.init();
Modal.init();
Settings.init();
Search.init();
ProfileSwitcher.init();
SuggestBar.init();
Chat.init();
Reports.init();
Tutorial.init();

// Initial render
DeckArea.renderShelf();
BinderBar.renderBinderTabs();
Settings.refreshSettingsUI();
Settings.refreshVoiceAndLang();

// Global event handlers
document.addEventListener('touchmove', function (e) {
  if (state.isDrag || Strip.getChipDragIdx() >= 0) e.preventDefault();
}, { passive: false });
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

// Session tracking
window.addEventListener('beforeunload', function () {
  Stats.flushSession();
});
setInterval(function () {
  Stats.flushSession();
}, 60000);

// Service Worker Registration + update toast
if ('serviceWorker' in navigator) {
  var updateToast = document.getElementById('updateToast');
  function showUpdateToast() {
    updateToast.textContent = Lang.t('updateAvailable') || 'New version available — tap to update';
    updateToast.classList.add('visible');
  }
  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    if (reg.waiting) showUpdateToast();
    reg.addEventListener('updatefound', function () {
      var newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', function () {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    });
  });
  updateToast.addEventListener('click', function () {
    updateToast.classList.remove('visible');
    location.reload();
  });
}
