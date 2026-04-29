// settings-system.js — Game Settings & Game Modes (Solo/GM/Campaign)
// Manages audio volume, game mode selection, and mode-specific UI features
(function () {
  const SETTINGS_ID = "settingsPanel";
  
  const Settings = {
    // Audio settings
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.6,
    
    // Game mode
    gameMode: 'solo', // 'solo' | 'gm' | 'campaign'
    gmRevealDC: true,
    gmRevealHiddenInfo: true,
    
    // Load from localStorage
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem('beyond-light-settings') || '{}');
        this.masterVolume = saved.masterVolume !== undefined ? saved.masterVolume : 0.7;
        this.musicVolume = saved.musicVolume !== undefined ? saved.musicVolume : 0.5;
        this.sfxVolume = saved.sfxVolume !== undefined ? saved.sfxVolume : 0.6;
        this.gameMode = saved.gameMode || 'solo';
        this.gmRevealDC = saved.gmRevealDC !== undefined ? !!saved.gmRevealDC : true;
        this.gmRevealHiddenInfo = saved.gmRevealHiddenInfo !== undefined ? !!saved.gmRevealHiddenInfo : true;
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
          gameMode: this.gameMode,
          gmRevealDC: this.gmRevealDC,
          gmRevealHiddenInfo: this.gmRevealHiddenInfo
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
    setGameMode(mode, opts) {
      const options = opts || {};
      if (mode === 'solo' || mode === 'gm' || mode === 'campaign') {
        if (this.gameMode === mode) {
          this.applyGameMode();
          syncGameModeUI();
          return;
        }
        this.gameMode = mode;
        this.save();
        this.applyGameMode();
        syncGameModeUI();
        if (!options.silent && typeof showNotif === 'function') {
          const label = mode === 'gm' ? 'GM Mode' : (mode === 'campaign' ? 'Campaign Mode' : 'Solo Mode');
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
        body.classList.remove('campaign-mode');
      } else if (this.gameMode === 'campaign') {
        body.classList.add('campaign-mode');
        body.classList.remove('solo-mode');
        body.classList.remove('gm-mode');
      } else {
        body.classList.add('solo-mode');
        body.classList.remove('gm-mode');
        body.classList.remove('campaign-mode');
      }
    },
    
    // Check if we're in GM mode
    isGMMode() {
      return this.gameMode === 'gm';
    },

    shouldRevealDC() {
      return !this.isGMMode() || !!this.gmRevealDC;
    },

    shouldRevealHiddenInfo() {
      return !this.isGMMode() || !!this.gmRevealHiddenInfo;
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
            Current Mode: <span id="currentModeLabel">${Settings.gameMode === 'gm' ? 'GM' : (Settings.gameMode === 'campaign' ? 'Campaign' : 'Solo')}</span>
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
            <button class="mode-btn ${Settings.gameMode === 'campaign' ? 'active' : ''}" 
              onclick="window.settingsSystem.setGameMode('campaign')">
              <span class="mode-icon">🛰</span>
              <span class="mode-name">Campaign</span>
              <span class="mode-desc">Shared multiplayer world</span>
            </button>
          </div>

          <div id="gmToolsRow" style="margin-top:.55rem;display:${Settings.gameMode === 'gm' ? 'block' : 'none'};">
            <div style="font-family:'Cinzel',serif;font-size:.56rem;letter-spacing:.1em;color:var(--muted2);text-transform:uppercase;margin-bottom:.28rem;">GM Visibility</div>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
              <button id="gmRevealDCBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleGMReveal('dc')">Reveal DC: ${Settings.gmRevealDC ? 'On' : 'Off'}</button>
              <button id="gmRevealHiddenBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleGMReveal('hidden')">Reveal Hidden Info: ${Settings.gmRevealHiddenInfo ? 'On' : 'Off'}</button>
            </div>
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
    const isCampaign = Settings.gameMode === 'campaign';
    const modeButtons = document.querySelectorAll('#settingsPanel .mode-btn');
    if (modeButtons.length >= 3) {
      modeButtons[0].classList.toggle('active', !isGM && !isCampaign);
      modeButtons[1].classList.toggle('active', isGM);
      modeButtons[2].classList.toggle('active', isCampaign);
    }

    const modeLabel = document.getElementById('currentModeLabel');
    if (modeLabel) {
      modeLabel.textContent = isGM ? 'GM' : (isCampaign ? 'Campaign' : 'Solo');
    }

    const gmToolsRow = document.getElementById('gmToolsRow');
    if (gmToolsRow) {
      gmToolsRow.style.display = isGM ? 'block' : 'none';
    }

    const gmRevealDCBtn = document.getElementById('gmRevealDCBtn');
    if (gmRevealDCBtn) {
      gmRevealDCBtn.textContent = 'Reveal DC: ' + (Settings.gmRevealDC ? 'On' : 'Off');
      gmRevealDCBtn.style.borderColor = Settings.gmRevealDC ? 'var(--teal)' : 'var(--border2)';
      gmRevealDCBtn.style.color = Settings.gmRevealDC ? 'var(--teal)' : 'var(--muted2)';
    }

    const gmRevealHiddenBtn = document.getElementById('gmRevealHiddenBtn');
    if (gmRevealHiddenBtn) {
      gmRevealHiddenBtn.textContent = 'Reveal Hidden Info: ' + (Settings.gmRevealHiddenInfo ? 'On' : 'Off');
      gmRevealHiddenBtn.style.borderColor = Settings.gmRevealHiddenInfo ? 'var(--teal)' : 'var(--border2)';
      gmRevealHiddenBtn.style.color = Settings.gmRevealHiddenInfo ? 'var(--teal)' : 'var(--muted2)';
    }

    const settingsBtn = document.querySelector('nav .settings-tab-btn');
    if (settingsBtn) {
      settingsBtn.title = isGM
        ? 'Settings (GM Mode Active)'
        : (isCampaign ? 'Settings (Campaign Mode Active)' : 'Settings (Solo Mode Active)');
      settingsBtn.textContent = isGM ? '⚙ GM' : (isCampaign ? '⚙ C' : '⚙');
    }
  }

  function toggleGMReveal(kind) {
    if (kind === 'dc') {
      Settings.gmRevealDC = !Settings.gmRevealDC;
    } else if (kind === 'hidden') {
      Settings.gmRevealHiddenInfo = !Settings.gmRevealHiddenInfo;
    }
    Settings.save();
    syncGameModeUI();
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
    setGameMode: (mode, opts) => Settings.setGameMode(mode, opts),
    toggleGMReveal,
    showGMPrompt,
    isGMMode: () => Settings.isGMMode(),
    shouldRevealDC: () => Settings.shouldRevealDC(),
    shouldRevealHiddenInfo: () => Settings.shouldRevealHiddenInfo(),
    getSettings: () => ({
      masterVolume: Settings.masterVolume,
      musicVolume: Settings.musicVolume,
      sfxVolume: Settings.sfxVolume,
      gameMode: Settings.gameMode,
      gmRevealDC: Settings.gmRevealDC,
      gmRevealHiddenInfo: Settings.gmRevealHiddenInfo
    }),
    initSettings // Expose for manual initialization if needed
  };
  
  // Ensure it's initialized immediately
  if (document.readyState !== 'loading') {
    initSettings();
  }
})();
