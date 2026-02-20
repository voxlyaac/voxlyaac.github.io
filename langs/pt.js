// langs/pt.js — Brazilian Portuguese language pack
(function () {
  'use strict';

  AAC.Lang.register('pt', {
    name: 'Portuguese',
    nativeName: 'Português (Brasil)',
    dir: 'ltr',
    voiceFilter: 'pt',

    ui: {
      // Strip
      stripPlaceholder: 'Toque nos cartões para formar uma frase',

      // Settings
      settingsTitle: 'Configurações',
      sectionGeneral: 'Geral',
      sectionLanguage: 'Idioma',
      sectionVoice: 'Voz',
      sectionAi: 'Assistente IA',
      labelSound: 'Som ao tocar',
      labelShowLabels: 'Mostrar legendas',
      labelAnimations: 'Animações',
      labelLanguage: 'Idioma',
      labelVoiceEngine: 'Motor de voz',
      voiceEngineBrowser: 'Navegador',
      labelVoice: 'Voz',
      labelSpeed: 'Velocidade',
      testVoice: 'Testar voz',
      testVoicePhrase: 'Olá, esta é a minha voz',
      labelSmartSentences: 'Frases inteligentes',
      labelWordHints: 'Sugestões de palavras',
      voiceDefault: 'Padrão',

      // Search
      searchPlaceholder: 'Buscar...',
      searchNoMatches: 'Sem resultados',

      // Modal
      newCard: 'Novo Cartão',
      editCard: 'Editar Cartão',
      newDeck: 'Novo Baralho',
      editDeck: 'Editar Baralho',
      newBinder: 'Nova Pasta',
      editBinder: 'Editar Pasta',
      editProfile: 'Editar Perfil',
      modalLabel: 'Legenda',
      modalDecksToInclude: 'Baralhos para incluir',
      modalPlaceholderBinder: 'ex: escola',
      modalPlaceholderDeck: 'ex: animais',
      modalPlaceholderCard: 'ex: cachorro',
      modalPlaceholderProfile: 'ex: david',
      btnCancel: 'Cancelar',
      btnSave: 'Salvar',
      btnDelete: 'Excluir',
      btnEmoji: 'Emoji',
      btnCamera: 'Câmera',
      btnGallery: 'Galeria',
      btnSymbols: 'Símbolos',
      emojiPlaceholder: 'Digite ou cole um emoji...',
      symbolPlaceholder: 'Buscar símbolos...',
      symbolSearching: 'Buscando...',
      symbolNoResults: 'Nenhum símbolo encontrado',
      symbolSearchFailed: 'Busca falhou',

      // Misc
      cardCount: function (n) { return n + ' cartões'; },
      profilePlaceholder: 'Novo perfil...',
      confirmDeleteProfile: function (name) { return 'Excluir perfil "' + name + '"?'; },
      modeUser: 'Usuário',
      modeCaretaker: 'Cuidador',
      profileDefault: 'Padrão',
      cameraError: 'Não foi possível acessar a câmera.',

      // Reports
      sectionReports: 'Relatórios',
      labelViewReports: 'Relatórios de uso',
      btnViewReports: 'Ver',
      reportsTitle: 'Relatórios',
      reportToday: 'Hoje',
      reportWeek: 'Esta Semana',
      reportMonth: 'Este Mês',
      reportWordsUsed: 'Palavras usadas',
      reportSentences: 'Frases',
      reportTopWord: 'Palavra mais usada',
      reportSessionTime: 'Tempo de sessão',
      reportTopWords: 'Palavras Mais Usadas',
      reportTopDecks: 'Baralhos Mais Usados',
      reportAiUsage: 'Assistente IA',
      reportSmartSentences: 'Frases inteligentes usadas',
      reportSuggestionsUsed: 'Sugestões usadas',
      reportNoData: 'Sem dados ainda',

      // Help
      sectionHelp: 'Ajuda',
      labelTutorial: 'Tutorial do app',
      btnShowTutorial: 'Mostrar',

      // Tutorial
      tutStep1: 'Estes são seus baralhos de cartões. Toque em um baralho para ver os cartões dentro.',
      tutStep2: 'Os cartões que você toca aparecem aqui para formar uma frase.',
      tutStep3: 'Pressione este botão para falar sua frase em voz alta.',
      tutStep4: 'Sugestões de palavras aparecem aqui para ajudar a construir frases mais rápido.',
      tutStep5: 'Troque perfis e alterne entre modo Usuário e Cuidador aqui.',
      tutStep6: 'Use pastas para organizar seus baralhos em grupos.',
      tutNext: 'Próximo',
      tutDone: 'Entendi!',

      // Update toast
      updateAvailable: 'Nova versão disponível — toque para atualizar'
    },

    aiPrompt: 'Você é um assistente de comunicação AAC. O usuário formou esta sequência de palavras tocando em cartões de imagens: [WORDS]. Sugira UMA frase curta e natural em português que capture a intenção dele. Responda APENAS com a frase, nada mais.',

    suggestions: {
      // Início de frase
      '': ['eu', 'quero', 'ir', 'ajuda'],
      // Pessoas / Pronomes
      'eu': ['quero', 'ir', 'gosto', 'ver'],
      'você': ['quer', 'ir', 'ajuda', 'gosta'],
      'mamãe': ['ajuda', 'quero', 'ir', 'por favor'],
      'papai': ['ajuda', 'quero', 'ir', 'por favor'],
      'amigo': ['quero', 'brincar', 'ir', 'ajuda'],
      'professor': ['ajuda', 'por favor', 'quero', 'ver'],
      'médico': ['ajuda', 'por favor', 'dor', 'remédio'],
      'todos': ['oi', 'tchau', 'ajuda', 'por favor'],
      // Ações
      'quero': ['comer', 'beber', 'brincar', 'ir'],
      'ir': ['aqui', 'lá', 'por favor', 'banheiro'],
      'fazer': ['mais', 'bom', 'ajuda', 'por favor'],
      'comer': ['comida', 'mais', 'por favor', 'quero'],
      'beber': ['água', 'mais', 'por favor', 'quero'],
      'ajuda': ['por favor', 'mamãe', 'papai', 'professor'],
      'parar': ['por favor', 'não', 'esperar'],
      'brincar': ['mais', 'brinquedo', 'por favor', 'quero'],
      'dormir': ['cansado', 'por favor', 'quero'],
      'ver': ['aqui', 'lá', 'médico', 'por favor'],
      // Sentimentos / Estados
      'feliz': ['brincar', 'mais', 'obrigado', 'sim'],
      'triste': ['ajuda', 'quero', 'mamãe', 'papai'],
      'bravo': ['parar', 'ajuda', 'quero', 'não'],
      'com medo': ['ajuda', 'mamãe', 'papai', 'quero'],
      'cansado': ['dormir', 'ajuda', 'quero', 'por favor'],
      'dor': ['ajuda', 'remédio', 'médico', 'mamãe'],
      'gosto': ['comida', 'brincar', 'mais', 'quero'],
      'não gosto': ['parar', 'não', 'ajuda', 'quero'],
      // Descritores
      'mais': ['por favor', 'quero', 'comida', 'água'],
      'menos': ['por favor', 'quero', 'bom'],
      'muito': ['mais', 'quero', 'bom'],
      'um pouco': ['mais', 'quero', 'por favor'],
      'bom': ['mais', 'sim', 'obrigado', 'feliz'],
      'mau': ['ajuda', 'parar', 'não', 'quero'],
      'aqui': ['por favor', 'quero', 'ajuda', 'ver'],
      'lá': ['ir', 'quero', 'ver', 'por favor'],
      // Coisas / Necessidades
      'água': ['por favor', 'mais', 'beber', 'quero'],
      'comida': ['por favor', 'mais', 'comer', 'quero'],
      'banheiro': ['por favor', 'ir', 'ajuda'],
      'brinquedo': ['por favor', 'brincar', 'quero', 'mais'],
      'celular': ['por favor', 'quero', 'mais', 'ajuda'],
      'remédio': ['por favor', 'ajuda', 'quero', 'dor'],
      'roupa': ['por favor', 'ajuda', 'quero'],
      // Social / Pragmático
      'oi': ['mamãe', 'papai', 'amigo', 'todos'],
      'tchau': ['mamãe', 'papai', 'amigo', 'todos'],
      'por favor': ['ajuda', 'mais', 'obrigado'],
      'obrigado': ['tchau', 'mais', 'sim', 'feliz'],
      'sim': ['por favor', 'quero', 'mais', 'ir'],
      'não': ['parar', 'quero', 'não gosto', 'ajuda'],
      'esperar': ['por favor', 'ajuda', 'quero'],
      'vamos': ['ir', 'brincar', 'comer', 'fazer'],
      // Combinações
      'eu quero': ['comer', 'beber', 'brincar', 'ir'],
      'eu ir': ['aqui', 'lá', 'banheiro', 'por favor'],
      'eu gosto': ['comida', 'brincar', 'brinquedo', 'água'],
      'você quer': ['brincar', 'comer', 'ir', 'ajuda'],
      'quero comer': ['comida', 'por favor', 'mais'],
      'quero beber': ['água', 'por favor', 'mais'],
      'quero brincar': ['brinquedo', 'mais', 'por favor'],
      'quero ir': ['aqui', 'lá', 'banheiro', 'por favor'],
      'quero ajuda': ['por favor', 'mamãe', 'papai']
    },

    defaults: {
      decks: {
        pessoas: { hex: '#F5C518', i: '👤', w: [{ e: '🙋', l: 'eu' }, { e: '👤', l: 'você' }, { e: '👩', l: 'mamãe' }, { e: '👨', l: 'papai' }, { e: '👫', l: 'amigo' }, { e: '🧑‍🏫', l: 'professor' }, { e: '👨‍⚕️', l: 'médico' }, { e: '👥', l: 'todos' }] },
        ações: { hex: '#6BAF7B', i: '🏃', w: [{ e: '🤲', l: 'quero' }, { e: '🚶', l: 'ir' }, { e: '✊', l: 'fazer' }, { e: '🍽️', l: 'comer' }, { e: '🥤', l: 'beber' }, { e: '🤝', l: 'ajuda' }, { e: '🛑', l: 'parar' }, { e: '🎮', l: 'brincar' }, { e: '💤', l: 'dormir' }, { e: '👀', l: 'ver' }] },
        sentimentos: { hex: '#6B9DC7', i: '❤️', w: [{ e: '😊', l: 'feliz' }, { e: '😢', l: 'triste' }, { e: '😠', l: 'bravo' }, { e: '😰', l: 'com medo' }, { e: '😴', l: 'cansado' }, { e: '🤕', l: 'dor' }, { e: '😍', l: 'gosto' }, { e: '😤', l: 'não gosto' }] },
        descritores: { hex: '#6B9DC7', i: '📏', w: [{ e: '➕', l: 'mais' }, { e: '➖', l: 'menos' }, { e: '💯', l: 'muito' }, { e: '🤏', l: 'um pouco' }, { e: '👍', l: 'bom' }, { e: '👎', l: 'mau' }, { e: '📍', l: 'aqui' }, { e: '👉', l: 'lá' }] },
        coisas: { hex: '#E47A20', i: '⭐', w: [{ e: '💧', l: 'água' }, { e: '🍎', l: 'comida' }, { e: '🚽', l: 'banheiro' }, { e: '🧸', l: 'brinquedo' }, { e: '📱', l: 'celular' }, { e: '💊', l: 'remédio' }, { e: '👕', l: 'roupa' }] },
        social: { hex: '#C78DA3', i: '💬', w: [{ e: '👋', l: 'oi' }, { e: '🫡', l: 'tchau' }, { e: '🙏', l: 'por favor' }, { e: '🫶', l: 'obrigado' }, { e: '✅', l: 'sim' }, { e: '❌', l: 'não' }, { e: '⏳', l: 'esperar' }, { e: '🎉', l: 'vamos' }] },
        frases: { hex: '#9B7DC7', i: '💜', w: [] }
      },
      binders: {
        todos: { icon: '📋', decks: null },
        escola: { icon: '🎓', decks: ['pessoas', 'ações', 'social'] },
        casa: { icon: '🏠', decks: ['pessoas', 'sentimentos', 'coisas', 'descritores'] }
      }
    }
  });
})();
