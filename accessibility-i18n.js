(function () {
  var STORAGE_KEY = 'beyond-light-language';
  var FALLBACK_LANGUAGE = 'en';
  var dictionaries = {
    en: {
      'common.on': 'On',
      'common.off': 'Off',
      'settings.accessibility.title': 'Accessibility',
      'settings.accessibility.language.label': 'Language',
      'settings.accessibility.language.helper': 'Choose a language for accessibility labels and guidance.',
      'settings.accessibility.language.aria': 'Accessibility language',
      'settings.accessibility.palette.label': 'Color Blind Friendly Palette',
      'settings.accessibility.palette.help': 'Uses higher-contrast, color-blind-safe accents.',
      'settings.accessibility.palette.preview': 'Preview 10s',
      'settings.accessibility.monochrome.label': 'All-Color Difficulty Mode',
      'settings.accessibility.monochrome.help': 'Forces a strict black-and-white palette with shape/text cues (no color reliance).',
      'settings.accessibility.phoneLayout.label': 'Phone Layout',
      'settings.accessibility.phoneLayout.help': 'Reflows navigation, settings, and campaign tools into a tighter single-column phone layout.',
      'settings.accessibility.textSize.label': 'Text Size',
      'settings.accessibility.textSize.help': 'Scales all text across the app.',
      'settings.accessibility.textSize.small': 'Small',
      'settings.accessibility.textSize.medium': 'Medium',
      'settings.accessibility.textSize.large': 'Large',
      'settings.accessibility.preview.enabled': 'Color-blind mode is enabled and saved.',
      'settings.accessibility.preview.active': 'Preview active ({seconds}s remaining).',
      'settings.accessibility.preview.ready': 'Preview applies temporarily for 10 seconds.',
      'settings.accessibility.preview.running': 'Previewing...',
      'settings.accessibility.notif.previewAlreadyEnabled': 'Color-blind mode is already enabled.'
    },
    es: {
      'common.on': 'Activado',
      'common.off': 'Desactivado',
      'settings.accessibility.title': 'Accesibilidad',
      'settings.accessibility.language.label': 'Idioma',
      'settings.accessibility.language.helper': 'Elige un idioma para etiquetas y guias de accesibilidad.',
      'settings.accessibility.language.aria': 'Idioma de accesibilidad',
      'settings.accessibility.palette.label': 'Paleta amigable para daltonismo',
      'settings.accessibility.palette.help': 'Usa acentos de mayor contraste compatibles con daltonismo.',
      'settings.accessibility.palette.preview': 'Vista previa 10 s',
      'settings.accessibility.monochrome.label': 'Modo de dificultad sin color',
      'settings.accessibility.monochrome.help': 'Fuerza una paleta estricta en blanco y negro con pistas de forma/texto (sin depender del color).',
      'settings.accessibility.phoneLayout.label': 'Diseno para telefono',
      'settings.accessibility.phoneLayout.help': 'Reorganiza navegacion, ajustes y herramientas de campana en una columna para telefono.',
      'settings.accessibility.textSize.label': 'Tamano de texto',
      'settings.accessibility.textSize.help': 'Escala todo el texto en la aplicacion.',
      'settings.accessibility.textSize.small': 'Pequeno',
      'settings.accessibility.textSize.medium': 'Mediano',
      'settings.accessibility.textSize.large': 'Grande',
      'settings.accessibility.preview.enabled': 'El modo para daltonismo esta activado y guardado.',
      'settings.accessibility.preview.active': 'Vista previa activa ({seconds}s restantes).',
      'settings.accessibility.preview.ready': 'La vista previa se aplica temporalmente por 10 segundos.',
      'settings.accessibility.preview.running': 'Mostrando vista previa...',
      'settings.accessibility.notif.previewAlreadyEnabled': 'El modo para daltonismo ya esta activado.'
    },
    pt: {
      'common.on': 'Ligado',
      'common.off': 'Desligado',
      'settings.accessibility.title': 'Acessibilidade',
      'settings.accessibility.language.label': 'Idioma',
      'settings.accessibility.language.helper': 'Escolha um idioma para rotulos e orientacoes de acessibilidade.',
      'settings.accessibility.language.aria': 'Idioma de acessibilidade',
      'settings.accessibility.palette.label': 'Paleta amigavel para daltonismo',
      'settings.accessibility.palette.help': 'Usa acentos de alto contraste seguros para daltonismo.',
      'settings.accessibility.palette.preview': 'Previa 10 s',
      'settings.accessibility.monochrome.label': 'Modo de dificuldade sem cor',
      'settings.accessibility.monochrome.help': 'Forca uma paleta estrita em preto e branco com pistas de forma/texto (sem depender de cor).',
      'settings.accessibility.phoneLayout.label': 'Layout para celular',
      'settings.accessibility.phoneLayout.help': 'Reorganiza navegacao, configuracoes e ferramentas de campanha em uma coluna mais compacta.',
      'settings.accessibility.textSize.label': 'Tamanho do texto',
      'settings.accessibility.textSize.help': 'Escala todo o texto no app.',
      'settings.accessibility.textSize.small': 'Pequeno',
      'settings.accessibility.textSize.medium': 'Medio',
      'settings.accessibility.textSize.large': 'Grande',
      'settings.accessibility.preview.enabled': 'O modo para daltonismo esta ativado e salvo.',
      'settings.accessibility.preview.active': 'Previa ativa ({seconds}s restantes).',
      'settings.accessibility.preview.ready': 'A previa e aplicada temporariamente por 10 segundos.',
      'settings.accessibility.preview.running': 'Mostrando previa...',
      'settings.accessibility.notif.previewAlreadyEnabled': 'O modo para daltonismo ja esta ativado.'
    }
  };

  var currentLanguage = FALLBACK_LANGUAGE;

  function normalizeLanguage(value) {
    var base = String(value || '').trim().toLowerCase();
    if (!base) return FALLBACK_LANGUAGE;
    var shortCode = base.split('-')[0];
    if (Object.prototype.hasOwnProperty.call(dictionaries, shortCode)) return shortCode;
    return FALLBACK_LANGUAGE;
  }

  function applyDocumentLanguage(lang) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', lang);
    }
  }

  function getStoredLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || '');
    } catch (_err) {
      return FALLBACK_LANGUAGE;
    }
  }

  function getBrowserLanguage() {
    if (typeof navigator === 'undefined') return FALLBACK_LANGUAGE;
    return normalizeLanguage(navigator.language || navigator.userLanguage || '');
  }

  function interpolate(template, params) {
    var values = params && typeof params === 'object' ? params : {};
    return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, function (_full, key) {
      if (!Object.prototype.hasOwnProperty.call(values, key)) return '';
      return String(values[key]);
    });
  }

  function t(key, fallback, params) {
    var langDict = dictionaries[currentLanguage] || {};
    var fallbackDict = dictionaries[FALLBACK_LANGUAGE] || {};
    var value = Object.prototype.hasOwnProperty.call(langDict, key) ? langDict[key] : undefined;
    if (typeof value === 'undefined') value = fallbackDict[key];
    if (typeof value === 'undefined') value = typeof fallback === 'string' ? fallback : key;
    return interpolate(value, params);
  }

  function setLanguage(lang, options) {
    var opts = options || {};
    var normalized = normalizeLanguage(lang);
    currentLanguage = normalized;
    applyDocumentLanguage(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch (_err) {}
    if (!opts.silent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beyond:accessibility-language-changed', {
        detail: { language: normalized }
      }));
    }
    return normalized;
  }

  function getSupportedLanguages() {
    return [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Espanol' },
      { code: 'pt', label: 'Portugues' }
    ];
  }

  function init() {
    var stored = getStoredLanguage();
    if (stored && stored !== FALLBACK_LANGUAGE) {
      setLanguage(stored, { silent: true });
      return;
    }
    setLanguage(getBrowserLanguage(), { silent: true });
  }

  init();

  window.accessibilityI18n = {
    t: t,
    setLanguage: setLanguage,
    getLanguage: function () { return currentLanguage; },
    getSupportedLanguages: getSupportedLanguages,
    hasLanguage: function (lang) {
      var code = normalizeLanguage(lang);
      return Object.prototype.hasOwnProperty.call(dictionaries, code);
    }
  };
})();
