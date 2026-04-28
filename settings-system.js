// settings-system.js — Game Settings & Game Modes (Solo/GM)
// Manages audio volume, game mode selection, and GM mode features
(function () {
  const SETTINGS_ID = "settingsPanel";
  
  const Settings = {
    // Audio settings
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.6,
    
    // Game mode
    gameMode: 'solo', // 'solo' or 'gm'
    
    // Load from localStorage
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem('beyond-light-settings') || '{}');
        this.masterVolume = saved.masterVolume !== undefined ? saved.masterVolume : 0.7;
        this.musicVolume = saved.musicVolume !== undefined ? saved.musicVolume : 0.5;
        this.sfxVolume = saved.sfxVolume !== undefined ? saved.sfxVolume : 0.6;
        this.gameMode = saved.gameMode || 'solo';
        this.applyAudioSettings();
      } catch (e) {
        console.warn('Could not load settings:', e);
      }
    },
    
    // Save to localStorage
    save() {
      try {
        localStorage.setItem('beyond-light-settings', JSON.stringify({
          masterVolume: this.masterVolume,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          gameMode: this.gameMode
        }));
      } catch (e) {
        console.warn('Could not save settings:', e);
      }
    },
    
    // Apply audio settings to audio manager
    applyAudioSettings() {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.masterVolume = this.masterVolume;
        AudioManager.musicVolume = this.musicVolume;
        AudioManager.sfxVolume = this.sfxVolume;
      }
    },
    
    // Set game mode
    setGameMode(mode) {
      if (mode === 'solo' || mode === 'gm') {
        this.gameMode = mode;
        this.save();
        this.applyGameMode();
        syncGameModeUI();
        if (typeof showNotif === 'function') {
          const label = mode === 'gm' ? 'GM Mode' : 'Solo Mode';
          showNotif(`Switched to ${label}`, 'good');
        }
      }
    },
    
    // Apply game mode settings
    applyGameMode() {
      const body = document.body;
      if (this.gameMode === 'gm') {
        body.classList.add('gm-mode');
        body.classList.remove('solo-mode');
      } else {
        body.classList.add('solo-mode');
        body.classList.remove('gm-mode');
      }
    },
    
    // Check if we're in GM mode
    isGMMode() {
      return this.gameMode === 'gm';
    }
  };
  
  function createSettingsPanel() {
    const container = document.getElementById(SETTINGS_ID);
    if (!container) return;
    
    container.innerHTML = `
      <div class="settings-popup">
        <div class="settings-header">
          <h3>Settings</h3>
          <button class="btn btn-icon btn-sm" onclick="window.settingsSystem.closeSettings()">✕</button>
        </div>
        
        <div class="settings-section">
          <h4>Audio</h4>
          <div class="setting-row">
            <label>Master Volume</label>
            <div class="volume-control">
              <input type="range" id="masterVol" min="0" max="100" value="${Settings.masterVolume * 100}" 
                onchange="window.settingsSystem.setMasterVolume(this.value)" class="volume-slider">
              <span id="masterVolLabel">${Math.round(Settings.masterVolume * 100)}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label>Music Volume</label>
            <div class="volume-control">
              <input type="range" id="musicVol" min="0" max="100" value="${Settings.musicVolume * 100}" 
                onchange="window.settingsSystem.setMusicVolume(this.value)" class="volume-slider">
              <span id="musicVolLabel">${Math.round(Settings.musicVolume * 100)}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label>SFX Volume</label>
            <div class="volume-control">
              <input type="range" id="sfxVol" min="0" max="100" value="${Settings.sfxVolume * 100}" 
                onchange="window.settingsSystem.setSFXVolume(this.value)" class="volume-slider">
              <span id="sfxVolLabel">${Math.round(Settings.sfxVolume * 100)}%</span>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Game Mode</h4>
          <div class="mode-current">
            Current Mode: <span id="currentModeLabel">${Settings.gameMode === 'gm' ? 'GM' : 'Solo'}</span>
          </div>
          <div class="setting-row mode-selector">
            <button class="mode-btn ${Settings.gameMode === 'solo' ? 'active' : ''}" 
              onclick="window.settingsSystem.setGameMode('solo')">
              <span class="mode-icon">🎮</span>
              <span class="mode-name">Solo</span>
              <span class="mode-desc">Play as a character</span>
            </button>
            <button class="mode-btn ${Settings.gameMode === 'gm' ? 'active' : ''}" 
              onclick="window.settingsSystem.setGameMode('gm')">
              <span class="mode-icon">👥</span>
              <span class="mode-name">GM</span>
              <span class="mode-desc">Orchestrate the story</span>
            </button>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="btn btn-sm" onclick="window.settingsSystem.closeSettings()">Close</button>
        </div>
      </div>
    `;
  }

  function syncGameModeUI() {
    const isGM = Settings.gameMode === 'gm';
    const modeButtons = document.querySelectorAll('#settingsPanel .mode-btn');
    if (modeButtons.length >= 2) {
      modeButtons[0].classList.toggle('active', !isGM);
      modeButtons[1].classList.toggle('active', isGM);
    }

    const modeLabel = document.getElementById('currentModeLabel');
    if (modeLabel) {
      modeLabel.textContent = isGM ? 'GM' : 'Solo';
    }

    const settingsBtn = document.querySelector('nav .settings-tab-btn');
    if (settingsBtn) {
      settingsBtn.title = isGM ? 'Settings (GM Mode Active)' : 'Settings (Solo Mode Active)';
      settingsBtn.textContent = isGM ? '⚙ GM' : '⚙';
    }
  }
  
  function openSettings() {
    const container = document.getElementById(SETTINGS_ID);
    if (container) {
      syncGameModeUI();
      container.classList.add('open');
    }
  }
  
  function closeSettings() {
    const container = document.getElementById(SETTINGS_ID);
    if (container) {
      container.classList.remove('open');
    }
  }
  
  function toggleSettings() {
    const container = document.getElementById(SETTINGS_ID);
    if (container) {
      container.classList.toggle('open');
    }
  }
  
  function setMasterVolume(value) {
    const pct = value / 100;
    Settings.masterVolume = pct;
    Settings.applyAudioSettings();
    Settings.save();
    document.getElementById('masterVolLabel').textContent = value + '%';
  }
  
  function setMusicVolume(value) {
    const pct = value / 100;
    Settings.musicVolume = pct;
    Settings.applyAudioSettings();
    Settings.save();
    document.getElementById('musicVolLabel').textContent = value + '%';
  }
  
  function setSFXVolume(value) {
    const pct = value / 100;
    Settings.sfxVolume = pct;
    Settings.applyAudioSettings();
    Settings.save();
    document.getElementById('sfxVolLabel').textContent = value + '%';
  }
  
  // GM Mode prompts for specific story beats
  function showGMPrompt(title, content, options = []) {
    if (!Settings.isGMMode()) return;
    
    const modal = document.getElementById('rollModal');
    if (!modal) return;
    
    let html = `<div class="gm-prompt" style="border-left:4px solid var(--purple);padding:.5rem;">
      <h3 style="color:var(--purple);margin-bottom:.3rem;">👥 GM Prompt: ${title}</h3>
      <div style="color:var(--text);font-size:.85rem;line-height:1.5;margin-bottom:.5rem;">${content}</div>`;
    
    if (options.length > 0) {
      html += '<div style="display:flex;gap:.3rem;flex-wrap:wrap;">';
      options.forEach(opt => {
        html += `<button class="btn btn-xs" onclick="${opt.action}">${opt.label}</button>`;
      });
      html += '</div>';
    }
    
    html += '</div>';
    
    document.getElementById('modalTitle').innerHTML = '👥 GM Mode';
    document.getElementById('modalContent').innerHTML = html;
    modal.style.display = 'flex';
  }
  
  // Initialize immediately and on page load
  function initSettings() {
    Settings.load();
    createSettingsPanel();
    Settings.applyGameMode();
    syncGameModeUI();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
  
  // Also run on page load with slight delay to ensure all elements exist
  window.addEventListener('load', initSettings);
  
  // Expose API
  window.settingsSystem = {
    openSettings,
    closeSettings,
    toggleSettings,
    setMasterVolume,
    setMusicVolume,
    setSFXVolume,
    setGameMode: (mode) => Settings.setGameMode(mode),
    showGMPrompt,
    isGMMode: () => Settings.isGMMode(),
    getSettings: () => ({
      masterVolume: Settings.masterVolume,
      musicVolume: Settings.musicVolume,
      sfxVolume: Settings.sfxVolume,
      gameMode: Settings.gameMode
    }),
    initSettings // Expose for manual initialization if needed
  };
  
  // Ensure it's initialized immediately
  if (document.readyState !== 'loading') {
    initSettings();
  }
})();
