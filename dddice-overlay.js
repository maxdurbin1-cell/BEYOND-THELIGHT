import { ThreeDDice, ThreeDDiceAPI } from './node_modules/dddice-js/dddice-latest.web.mjs';

const DEFAULT_SETTINGS = {
  enabled: false,
  apiKey: '',
  theme: 'dddice-bees'
};

class BtlDddiceOverlay {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
    this.lastApiKey = '';
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  normalizeSettings(settings) {
    const merged = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    merged.enabled = !!merged.enabled;
    merged.apiKey = String(merged.apiKey || '').trim();
    merged.theme = String(merged.theme || DEFAULT_SETTINGS.theme).trim() || DEFAULT_SETTINGS.theme;
    return merged;
  }

  isAvailable() {
    return typeof ThreeDDice === 'function' && typeof document !== 'undefined' && !!ThreeDDice.isWebGLAvailable();
  }

  ensureCanvas() {
    if (this.canvas && this.canvas.isConnected) return this.canvas;
    const canvas = document.createElement('canvas');
    canvas.id = 'dddiceOverlayCanvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1346';
    canvas.style.background = 'transparent';
    document.body.appendChild(canvas);
    this.canvas = canvas;
    return canvas;
  }

  handleResize() {
    if (!this.renderer) return;
    try {
      this.renderer.resize(window.innerWidth, window.innerHeight);
    } catch (_err) {}
  }

  async configure(settings) {
    this.settings = this.normalizeSettings(settings);
    if (!this.settings.enabled) {
      this.stop();
      return { ready: false, reason: 'disabled' };
    }
    if (!this.isAvailable()) {
      return { ready: false, reason: 'unavailable' };
    }

    const canvas = this.ensureCanvas();
    const needsRenderer = !this.renderer || this.lastApiKey !== this.settings.apiKey;
    if (needsRenderer) {
      this.stop();
      this.lastApiKey = this.settings.apiKey;
      this.renderer = new ThreeDDice(canvas, this.settings.apiKey || undefined, {
        bgColor: 0x000000,
        bgOpacity: 0,
        autoClear: 1800,
        dice: {
          limit: 24,
          size: 1
        }
      });
      this.renderer.start();
      this.handleResize();
    }

    return { ready: !!this.renderer };
  }

  stop() {
    if (!this.renderer) return;
    try {
      this.renderer.stop();
    } catch (_err) {}
    try {
      this.renderer.disconnect();
    } catch (_err) {}
    this.renderer = null;
  }

  async rollDie(payload) {
    const die = payload && typeof payload === 'object' ? payload : {};
    const sides = Math.max(2, Number(die.sides || 20));
    const value = Math.max(1, Math.min(sides, Number(die.value || 1)));
    const label = String(die.label || 'Roll');
    const meta = die.meta && typeof die.meta === 'object' ? die.meta : {};
    const state = await this.configure(this.settings);
    if (!state.ready || !this.renderer) throw new Error('dddice overlay is not ready.');

    return this.renderer.rollLocal([
      {
        type: 'd' + sides,
        theme: this.settings.theme,
        label,
        value,
        value_to_display: value,
        meta
      }
    ], {
      label
    });
  }

  async fetchThemes(apiKey) {
    const key = String(apiKey || '').trim();
    if (!key) return [];
    const api = new ThreeDDiceAPI(key, 'BEYOND: The Light');
    const response = await api.diceBox.list();
    const themes = response && Array.isArray(response.data) ? response.data : [];
    return themes.map((theme) => ({
      id: String(theme && theme.id || ''),
      name: String(theme && (theme.name || theme.id) || '')
    })).filter((theme) => theme.id);
  }
}

window.BTLDddiceOverlay = new BtlDddiceOverlay();
window.dispatchEvent(new CustomEvent('btl:dddice-ready'));
