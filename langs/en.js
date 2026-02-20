// langs/en.js — English language pack
(function () {
  'use strict';

  AAC.Lang.register('en', {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    voiceFilter: 'en',

    ui: {
      // Strip
      stripPlaceholder: 'Tap cards to build a sentence',

      // Settings
      settingsTitle: 'Settings',
      sectionGeneral: 'General',
      sectionLanguage: 'Language',
      sectionVoice: 'Voice',
      sectionAi: 'AI Assist',
      labelSound: 'Sound on tap',
      labelShowLabels: 'Show labels',
      labelAnimations: 'Animations',
      labelLanguage: 'Language',
      labelVoiceEngine: 'Voice engine',
      voiceEngineBrowser: 'Browser',
      labelVoice: 'Voice',
      labelSpeed: 'Speed',
      testVoice: 'Test voice',
      testVoicePhrase: 'Hello, this is my voice',
      labelSmartSentences: 'Smart sentences',
      labelWordHints: 'Word hints',
      voiceDefault: 'Default',

      // Search
      searchPlaceholder: 'Search...',
      searchNoMatches: 'No matches',

      // Modal
      newCard: 'New Card',
      editCard: 'Edit Card',
      newDeck: 'New Deck',
      editDeck: 'Edit Deck',
      newBinder: 'New Binder',
      editBinder: 'Edit Binder',
      editProfile: 'Edit Profile',
      modalLabel: 'Label',
      modalDecksToInclude: 'Decks to include',
      modalPlaceholderBinder: 'e.g. school',
      modalPlaceholderDeck: 'e.g. animals',
      modalPlaceholderCard: 'e.g. dog',
      modalPlaceholderProfile: 'e.g. david',
      btnCancel: 'Cancel',
      btnSave: 'Save',
      btnDelete: 'Delete',
      btnEmoji: 'Emoji',
      btnCamera: 'Camera',
      btnGallery: 'Gallery',
      btnSymbols: 'Symbols',
      emojiPlaceholder: 'Type or paste an emoji...',
      symbolPlaceholder: 'Search symbols...',
      symbolSearching: 'Searching...',
      symbolNoResults: 'No symbols found',
      symbolSearchFailed: 'Search failed',

      // Misc
      cardCount: function (n) { return n + ' cards'; },
      profilePlaceholder: 'New profile...',
      confirmDeleteProfile: function (name) { return 'Delete profile "' + name + '"?'; },
      modeUser: 'User',
      modeCaretaker: 'Caretaker',
      profileDefault: 'Default',
      cameraError: 'Could not access camera.',

      // Reports
      sectionReports: 'Reports',
      labelViewReports: 'Usage reports',
      btnViewReports: 'View',
      reportsTitle: 'Reports',
      reportToday: 'Today',
      reportWeek: 'This Week',
      reportMonth: 'This Month',
      reportWordsUsed: 'Words used',
      reportSentences: 'Sentences',
      reportTopWord: 'Top word',
      reportSessionTime: 'Session time',
      reportTopWords: 'Top Words',
      reportTopDecks: 'Top Decks',
      reportAiUsage: 'AI Assist',
      reportSmartSentences: 'Smart sentences used',
      reportSuggestionsUsed: 'Suggestions tapped',
      reportNoData: 'No data yet',

      // Help
      sectionHelp: 'Help',
      labelTutorial: 'App tutorial',
      btnShowTutorial: 'Show',

      // Tutorial
      tutStep1: 'These are your card decks. Tap a deck to see the cards inside.',
      tutStep2: 'Cards you tap appear here to build a sentence.',
      tutStep3: 'Press this button to speak your sentence out loud.',
      tutStep4: 'Word suggestions appear here to help you build sentences faster.',
      tutStep5: 'Switch profiles and toggle between User and Caretaker mode here.',
      tutStep6: 'Use binders to organize your decks into groups.',
      tutNext: 'Next',
      tutDone: 'Got it!',

      // Update toast
      updateAvailable: 'New version available — tap to update'
    },

    aiPrompt: 'You are an AAC communication assistant. The user built this sequence of words by tapping picture cards: [WORDS]. Suggest ONE short, natural sentence that captures their intent. Reply with ONLY the sentence, nothing else.',

    suggestions: {
      // Sentence starters
      '': ['I', 'want', 'go', 'help'],
      // People / Pronouns
      'i': ['want', 'go', 'like', 'see'],
      'you': ['want', 'go', 'help', 'like'],
      'mom': ['help', 'want', 'go', 'please'],
      'dad': ['help', 'want', 'go', 'please'],
      'friend': ['want', 'play', 'go', 'help'],
      'teacher': ['help', 'please', 'want', 'see'],
      'doctor': ['help', 'please', 'pain', 'medicine'],
      'everyone': ['hi', 'bye', 'help', 'please'],
      // Actions
      'want': ['eat', 'drink', 'play', 'go'],
      'go': ['here', 'there', 'please', 'bathroom'],
      'do': ['more', 'good', 'help', 'please'],
      'eat': ['food', 'more', 'please', 'want'],
      'drink': ['water', 'more', 'please', 'want'],
      'help': ['please', 'mom', 'dad', 'teacher'],
      'stop': ['please', 'no', 'wait'],
      'play': ['more', 'toy', 'please', 'want'],
      'sleep': ['tired', 'please', 'want'],
      'see': ['here', 'there', 'doctor', 'please'],
      // Feelings / States
      'happy': ['play', 'more', 'thank you', 'yes'],
      'sad': ['help', 'want', 'mom', 'dad'],
      'angry': ['stop', 'help', 'want', 'no'],
      'scared': ['help', 'mom', 'dad', 'want'],
      'tired': ['sleep', 'help', 'want', 'please'],
      'pain': ['help', 'medicine', 'doctor', 'mom'],
      'like': ['food', 'play', 'more', 'want'],
      "don't like": ['stop', 'no', 'help', 'want'],
      // Descriptors
      'more': ['please', 'want', 'food', 'water'],
      'less': ['please', 'want', 'good'],
      'a lot': ['more', 'want', 'good'],
      'a little': ['more', 'want', 'please'],
      'good': ['more', 'yes', 'thank you', 'happy'],
      'bad': ['help', 'stop', 'no', 'want'],
      'here': ['please', 'want', 'help', 'see'],
      'there': ['go', 'want', 'see', 'please'],
      // Things / Needs
      'water': ['please', 'more', 'drink', 'want'],
      'food': ['please', 'more', 'eat', 'want'],
      'bathroom': ['please', 'go', 'help'],
      'toy': ['please', 'play', 'want', 'more'],
      'phone': ['please', 'want', 'more', 'help'],
      'medicine': ['please', 'help', 'want', 'pain'],
      'clothes': ['please', 'help', 'want'],
      // Social / Pragmatic
      'hi': ['mom', 'dad', 'friend', 'everyone'],
      'bye': ['mom', 'dad', 'friend', 'everyone'],
      'please': ['help', 'more', 'thank you'],
      'thank you': ['bye', 'more', 'yes', 'happy'],
      'yes': ['please', 'want', 'more', 'go'],
      'no': ['stop', 'want', "don't like", 'help'],
      'wait': ['please', 'help', 'want'],
      "let's": ['go', 'play', 'eat', 'do'],
      // Multi-word sequences
      'i want': ['eat', 'drink', 'play', 'go'],
      'i go': ['here', 'there', 'bathroom', 'please'],
      'i like': ['food', 'play', 'toy', 'water'],
      'you want': ['play', 'eat', 'go', 'help'],
      'want eat': ['food', 'please', 'more'],
      'want drink': ['water', 'please', 'more'],
      'want play': ['toy', 'more', 'please'],
      'want go': ['here', 'there', 'bathroom', 'please'],
      'want help': ['please', 'mom', 'dad']
    },

    defaults: {
      decks: {
        people: { hex: '#F5C518', i: '👤', w: [{ e: '🙋', l: 'I' }, { e: '👤', l: 'you' }, { e: '👩', l: 'mom' }, { e: '👨', l: 'dad' }, { e: '👫', l: 'friend' }, { e: '🧑‍🏫', l: 'teacher' }, { e: '👨‍⚕️', l: 'doctor' }, { e: '👥', l: 'everyone' }] },
        actions: { hex: '#6BAF7B', i: '🏃', w: [{ e: '🤲', l: 'want' }, { e: '🚶', l: 'go' }, { e: '✊', l: 'do' }, { e: '🍽️', l: 'eat' }, { e: '🥤', l: 'drink' }, { e: '🤝', l: 'help' }, { e: '🛑', l: 'stop' }, { e: '🎮', l: 'play' }, { e: '💤', l: 'sleep' }, { e: '👀', l: 'see' }] },
        feelings: { hex: '#6B9DC7', i: '❤️', w: [{ e: '😊', l: 'happy' }, { e: '😢', l: 'sad' }, { e: '😠', l: 'angry' }, { e: '😰', l: 'scared' }, { e: '😴', l: 'tired' }, { e: '🤕', l: 'pain' }, { e: '😍', l: 'like' }, { e: '😤', l: "don't like" }] },
        descriptors: { hex: '#6B9DC7', i: '📏', w: [{ e: '➕', l: 'more' }, { e: '➖', l: 'less' }, { e: '💯', l: 'a lot' }, { e: '🤏', l: 'a little' }, { e: '👍', l: 'good' }, { e: '👎', l: 'bad' }, { e: '📍', l: 'here' }, { e: '👉', l: 'there' }] },
        things: { hex: '#E47A20', i: '⭐', w: [{ e: '💧', l: 'water' }, { e: '🍎', l: 'food' }, { e: '🚽', l: 'bathroom' }, { e: '🧸', l: 'toy' }, { e: '📱', l: 'phone' }, { e: '💊', l: 'medicine' }, { e: '👕', l: 'clothes' }] },
        social: { hex: '#C78DA3', i: '💬', w: [{ e: '👋', l: 'hi' }, { e: '🫡', l: 'bye' }, { e: '🙏', l: 'please' }, { e: '🫶', l: 'thank you' }, { e: '✅', l: 'yes' }, { e: '❌', l: 'no' }, { e: '⏳', l: 'wait' }, { e: '🎉', l: "let's" }] },
        phrases: { hex: '#9B7DC7', i: '💜', w: [] }
      },
      binders: {
        all: { icon: '📋', decks: null },
        school: { icon: '🎓', decks: ['people', 'actions', 'social'] },
        home: { icon: '🏠', decks: ['people', 'feelings', 'things', 'descriptors'] }
      }
    }
  });
})();
