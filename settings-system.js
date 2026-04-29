// settings-system.js — Game Settings & Game Modes (Solo/GM/Campaign)
// Manages audio volume, game mode selection, and mode-specific UI features
(function () {
  const SETTINGS_ID = "settingsPanel";
  const COLORBLIND_PREVIEW_MS = 10000;
  let colorBlindPreviewTimer = null;
  let colorBlindPreviewActive = false;
  let colorBlindPreviewEndsAt = 0;
  
  const Settings = {
    // Audio settings
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.6,
    musicConsent: false,
    
    // Game mode
    gameMode: 'solo', // 'solo' | 'gm' | 'campaign'
    gmRevealDC: true,
    gmRevealHiddenInfo: true,
    colorBlindMode: false,
    monochromeMode: false,
    textSize: 'medium',
    activeTab: 'general',
    
    // Load from localStorage
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem('beyond-light-settings') || '{}');
        this.masterVolume = saved.masterVolume !== undefined ? saved.masterVolume : 0.7;
        this.musicVolume = saved.musicVolume !== undefined ? saved.musicVolume : 0.5;
        this.sfxVolume = saved.sfxVolume !== undefined ? saved.sfxVolume : 0.6;
        this.musicConsent = saved.musicConsent !== undefined ? !!saved.musicConsent : false;
        this.gameMode = 'solo'; // always default to Solo on load — not persisted
        this.gmRevealDC = saved.gmRevealDC !== undefined ? !!saved.gmRevealDC : true;
        this.gmRevealHiddenInfo = saved.gmRevealHiddenInfo !== undefined ? !!saved.gmRevealHiddenInfo : true;
        this.colorBlindMode = saved.colorBlindMode !== undefined ? !!saved.colorBlindMode : false;
        this.monochromeMode = saved.monochromeMode !== undefined ? !!saved.monochromeMode : false;
        this.textSize = saved.textSize || 'medium';
        this.applyAudioSettings();
        this.applyAccessibilitySettings();
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
          musicConsent: this.musicConsent,
          gmRevealDC: this.gmRevealDC,
          gmRevealHiddenInfo: this.gmRevealHiddenInfo,
          colorBlindMode: this.colorBlindMode,
          monochromeMode: this.monochromeMode,
          textSize: this.textSize
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
        if (typeof AudioManager.setMusicConsent === 'function') {
          AudioManager.setMusicConsent(this.musicConsent);
        }
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
    },

    applyAccessibilitySettings() {
      const body = document.body;
      if (!body) return;
      body.classList.toggle('colorblind-mode', !!this.colorBlindMode);
      body.classList.toggle('lowcolor-mode', !!this.monochromeMode);
      this.applyTextSize();
    },

    applyTextSize() {
      const sizes = { small: '14px', medium: '17px', large: '20px' };
      document.documentElement.style.fontSize = sizes[this.textSize] || '17px';
      ['text-size-small', 'text-size-medium', 'text-size-large'].forEach(cls => document.body.classList.remove(cls));
      document.body.classList.add('text-size-' + (this.textSize || 'medium'));
    }
  };

  function getModeQuickStartHtml() {
    if (Settings.gameMode === 'gm') {
      return ''
        + '<div class="mode-guidance-title">GM Flow</div>'
        + '<ol class="mode-guidance-list">'
        + '<li>Generate map layers and mission seeds, then open GM Dashboard for pacing tools.</li>'
        + '<li>Keep tension readable with Dread controls and Force Outcome only when pacing stalls.</li>'
        + '<li>Use Campaign tab to synchronize state and keep players on one shared timeline.</li>'
        + '</ol>';
    }
    if (Settings.gameMode === 'campaign') {
      return ''
        + '<div class="mode-guidance-title">Campaign Flow</div>'
        + '<ol class="mode-guidance-list">'
        + '<li>Open the Campaign tab to create or join a room before long sessions.</li>'
        + '<li>Confirm role, code, and sync status, then use Show Onboarding for team quickstart.</li>'
        + '<li>Use the Campaign dock for live rolls, chat, and timeline awareness during play.</li>'
        + '</ol>';
    }
    return ''
      + '<div class="mode-guidance-title">Solo Flow</div>'
      + '<ol class="mode-guidance-list">'
      + '<li>Pick a travel layer, then alternate Observe Adjacent, missions, and downtime choices.</li>'
      + '<li>Track progression through Missions, Factions, and Endings as your core loop.</li>'
      + '<li>Use Solo Reference anytime for quick reminders without breaking narrative momentum.</li>'
      + '</ol>';
  }
  
  function createSettingsPanel() {
    const container = document.getElementById(SETTINGS_ID);
    if (!container) return;
    
    container.innerHTML = `
      <div class="settings-popup">
        <div class="settings-header">
          <h3>Settings</h3>
          <button class="btn btn-icon btn-sm" onclick="window.settingsSystem.closeSettings()">✕</button>
        </div>

        <div class="settings-tabs">
          <button id="settingsTab-general" class="settings-tab-btn active" onclick="window.settingsSystem.setActiveTab('general')">General</button>
          <button id="settingsTab-audio" class="settings-tab-btn" onclick="window.settingsSystem.setActiveTab('audio')">Audio</button>
          <button id="settingsTab-accessibility" class="settings-tab-btn" onclick="window.settingsSystem.setActiveTab('accessibility')">Accessibility</button>
          <button id="settingsTab-recovery" class="settings-tab-btn" onclick="window.settingsSystem.setActiveTab('recovery')">Recovery</button>
          <button id="settingsTab-campaign" class="settings-tab-btn" onclick="window.settingsSystem.setActiveTab('campaign')">Campaign</button>
        </div>

        <div id="settingsTabPanel-general" class="settings-tab-panel active" data-settings-tab="general">
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

            <div id="modeQuickStart" class="mode-guidance">${getModeQuickStartHtml()}</div>

            <div id="gmToolsRow" style="margin-top:.55rem;display:${Settings.gameMode === 'gm' ? 'block' : 'none'};">
              <div style="font-family:'Cinzel',serif;font-size:.56rem;letter-spacing:.1em;color:var(--muted2);text-transform:uppercase;margin-bottom:.28rem;">GM Visibility</div>
              <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
                <button id="gmRevealDCBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleGMReveal('dc')">Reveal DC: ${Settings.gmRevealDC ? 'On' : 'Off'}</button>
                <button id="gmRevealHiddenBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleGMReveal('hidden')">Reveal Hidden Info: ${Settings.gmRevealHiddenInfo ? 'On' : 'Off'}</button>
              </div>
            </div>
          </div>
        </div>
        
        <div id="settingsTabPanel-audio" class="settings-tab-panel" data-settings-tab="audio">
          <div class="settings-section">
            <h4>Audio</h4>
            <div class="setting-row">
              <label>Background Music</label>
              <div class="campaign-actions" style="margin:0;">
                <button id="musicConsentBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleMusicConsent()">
                  ${Settings.musicConsent ? 'On' : 'Off'}
                </button>
                <span class="campaign-muted">Music stays off by default until you enable it.</span>
              </div>
            </div>
            <div class="setting-row">
              <label for="masterVol">Master Volume</label>
              <div class="volume-control">
                <input type="range" id="masterVol" min="0" max="100" value="${Settings.masterVolume * 100}" 
                  onchange="window.settingsSystem.setMasterVolume(this.value)" class="volume-slider">
                <span id="masterVolLabel">${Math.round(Settings.masterVolume * 100)}%</span>
              </div>
            </div>
            <div class="setting-row">
              <label for="musicVol">Music Volume</label>
              <div class="volume-control">
                <input type="range" id="musicVol" min="0" max="100" value="${Settings.musicVolume * 100}" 
                  onchange="window.settingsSystem.setMusicVolume(this.value)" class="volume-slider">
                <span id="musicVolLabel">${Math.round(Settings.musicVolume * 100)}%</span>
              </div>
            </div>
            <div class="setting-row">
              <label for="sfxVol">SFX Volume</label>
              <div class="volume-control">
                <input type="range" id="sfxVol" min="0" max="100" value="${Settings.sfxVolume * 100}" 
                  onchange="window.settingsSystem.setSFXVolume(this.value)" class="volume-slider">
                <span id="sfxVolLabel">${Math.round(Settings.sfxVolume * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div id="settingsTabPanel-accessibility" class="settings-tab-panel" data-settings-tab="accessibility">
          <div class="settings-section">
            <h4>Accessibility</h4>
            <div class="setting-row">
              <label>Color Blind Friendly Palette</label>
              <div class="campaign-actions" style="margin:0;">
                <button id="colorBlindModeBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleColorBlindMode()">
                  ${Settings.colorBlindMode ? 'On' : 'Off'}
                </button>
                <button id="colorBlindPreviewBtn" class="btn btn-xs" onclick="window.settingsSystem.previewColorBlindMode()">
                  Preview 10s
                </button>
                <span class="campaign-muted">Uses higher-contrast, color-blind-safe accents.</span>
              </div>
              <div id="colorBlindPreviewStatus" class="campaign-muted" style="margin-top:.25rem;"></div>
            </div>
            <div class="setting-row">
              <label>All-Color Difficulty Mode</label>
              <div class="campaign-actions" style="margin:0;">
                <button id="monochromeModeBtn" class="btn btn-xs" onclick="window.settingsSystem.toggleMonochromeMode()">
                  ${Settings.monochromeMode ? 'On' : 'Off'}
                </button>
                <span class="campaign-muted">Forces a strict black-and-white palette with shape/text cues (no color reliance).</span>
              </div>
            </div>
            <div class="setting-row">
              <label>Text Size</label>
              <div class="campaign-actions" style="margin:0;">
                <button id="textSizeSmBtn" class="btn btn-xs ${Settings.textSize === 'small' ? 'active' : ''}" onclick="window.settingsSystem.setTextSize('small')">Small</button>
                <button id="textSizeMdBtn" class="btn btn-xs ${Settings.textSize === 'medium' ? 'active' : ''}" onclick="window.settingsSystem.setTextSize('medium')">Medium</button>
                <button id="textSizeLgBtn" class="btn btn-xs ${Settings.textSize === 'large' ? 'active' : ''}" onclick="window.settingsSystem.setTextSize('large')">Large</button>
                <span class="campaign-muted">Scales all text across the app.</span>
              </div>
            </div>
          </div>
        </div>

        <div id="settingsTabPanel-recovery" class="settings-tab-panel" data-settings-tab="recovery">
          <div class="settings-section">
            <h4>Solo Recovery</h4>
            <div class="campaign-muted" style="margin-bottom:.45rem;">Discoverability shortcut for save/load safety tools.</div>
            <div id="settingsRecoverySummary" class="settings-recovery-summary">Loading recovery status…</div>
            <div class="settings-recovery-actions">
              <button class="btn btn-xs btn-teal" onclick="if(typeof loadCharacter==='function'){loadCharacter();} window.settingsSystem.refreshRecoveryPanel();">Load Best</button>
              <button class="btn btn-xs" onclick="if(typeof saveCharacter==='function'){saveCharacter();} window.settingsSystem.refreshRecoveryPanel();">Save + Checkpoint</button>
              <button class="btn btn-xs" onclick="if(typeof loadCharacterCheckpoint==='function'){loadCharacterCheckpoint();} window.settingsSystem.refreshRecoveryPanel();">Restore Latest Checkpoint</button>
              <button class="btn btn-xs" onclick="if(typeof restoreBackupAsPrimary==='function'){restoreBackupAsPrimary();} window.settingsSystem.refreshRecoveryPanel();">Promote Backup</button>
              <button class="btn btn-xs" onclick="if(typeof exportCharacterSave==='function'){exportCharacterSave();}">Export Save</button>
              <button class="btn btn-xs" onclick="if(typeof importCharacterSavePrompt==='function'){importCharacterSavePrompt();}">Import Save</button>
              <button class="btn btn-xs" onclick="if(typeof openSoloRecoveryCenter==='function'){openSoloRecoveryCenter();}">Open Recovery Center</button>
              <button class="btn btn-xs" onclick="if(typeof verifySoloSaveHealth==='function'){verifySoloSaveHealth();}">Run Save Health</button>
            </div>
          </div>
        </div>

        <div id="settingsTabPanel-campaign" class="settings-tab-panel" data-settings-tab="campaign">
          <div class="settings-section">
            <h4>Campaign</h4>
            <div class="campaign-muted">Campaign controls and multiplayer diagnostics live here.</div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="btn btn-sm" onclick="window.settingsSystem.closeSettings()">Close</button>
        </div>
      </div>
    `;

    applySettingsTabVisibility();
    bindSettingsTabKeyboardNav();
  }

  function readRecoveryEnvelope(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && typeof parsed.data === 'object') {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        return { data: parsed, savedAt: null, checksum: null, schema: 1 };
      }
      return null;
    } catch (_err) {
      return null;
    }
  }

  function formatRecoveryStamp(envelope) {
    if (!envelope || !envelope.savedAt) return '-';
    try {
      return new Date(envelope.savedAt).toLocaleString();
    } catch (_err) {
      return '-';
    }
  }

  function refreshRecoveryPanel() {
    const node = document.getElementById('settingsRecoverySummary');
    if (!node) return;

    const primary = readRecoveryEnvelope('beyond-light-character');
    const backup = readRecoveryEnvelope('beyond-light-character-backup');
    const cp1 = readRecoveryEnvelope('beyond-light-character-checkpoint-1') || readRecoveryEnvelope('beyond-light-character-checkpoint');
    const cp2 = readRecoveryEnvelope('beyond-light-character-checkpoint-2');
    const cp3 = readRecoveryEnvelope('beyond-light-character-checkpoint-3');

    node.innerHTML = ''
      + '<div class="settings-recovery-row"><strong>Primary</strong><span>' + (primary ? 'Ready' : 'Missing') + ' · ' + formatRecoveryStamp(primary) + '</span></div>'
      + '<div class="settings-recovery-row"><strong>Backup</strong><span>' + (backup ? 'Ready' : 'Missing') + ' · ' + formatRecoveryStamp(backup) + '</span></div>'
      + '<div class="settings-recovery-row"><strong>Checkpoint 1</strong><span>' + (cp1 ? 'Ready' : 'Empty') + ' · ' + formatRecoveryStamp(cp1) + '</span></div>'
      + '<div class="settings-recovery-row"><strong>Checkpoint 2</strong><span>' + (cp2 ? 'Ready' : 'Empty') + ' · ' + formatRecoveryStamp(cp2) + '</span></div>'
      + '<div class="settings-recovery-row"><strong>Checkpoint 3</strong><span>' + (cp3 ? 'Ready' : 'Empty') + ' · ' + formatRecoveryStamp(cp3) + '</span></div>';
  }

  function setActiveTab(tab) {
    const allowed = ['general', 'audio', 'accessibility', 'recovery', 'campaign'];
    if (allowed.indexOf(tab) === -1) return;
    Settings.activeTab = tab;
    applySettingsTabVisibility();
  }

  function applySettingsTabVisibility() {
    const active = Settings.activeTab || 'general';
    const tabs = document.querySelectorAll('#settingsPanel .settings-tab-btn');
    tabs.forEach((btn) => {
      const id = String(btn.id || '');
      const tabName = id.replace('settingsTab-', '');
      const isActive = tabName === active;
      btn.classList.toggle('active', tabName === active);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    const panels = document.querySelectorAll('#settingsPanel .settings-tab-panel');
    panels.forEach((panel) => {
      const tabName = String(panel.getAttribute('data-settings-tab') || '');
      const isActive = tabName === active;
      panel.classList.toggle('active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    const campaignSection = document.getElementById('campaignSettingsSection');
    if (campaignSection) {
      campaignSection.setAttribute('data-settings-tab', 'campaign');
      campaignSection.style.display = active === 'campaign' ? '' : 'none';
    }
  }

  function bindSettingsTabKeyboardNav() {
    const tabList = document.querySelector('#settingsPanel .settings-tabs');
    if (!tabList) return;
    tabList.setAttribute('role', 'tablist');
    const tabs = Array.from(document.querySelectorAll('#settingsPanel .settings-tab-btn'));
    tabs.forEach((btn, idx) => {
      btn.setAttribute('role', 'tab');
      btn.dataset.tabIndex = String(idx);
      if (btn.dataset.tabKeyBound === '1') return;
      btn.dataset.tabKeyBound = '1';
      btn.addEventListener('keydown', function (evt) {
        const key = evt.key;
        const currentIndex = Number(btn.dataset.tabIndex || idx);
        if (key === 'ArrowRight' || key === 'ArrowDown') {
          evt.preventDefault();
          const next = (currentIndex + 1) % tabs.length;
          tabs[next].focus();
          return;
        }
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
          evt.preventDefault();
          const prev = (currentIndex - 1 + tabs.length) % tabs.length;
          tabs[prev].focus();
          return;
        }
        if (key === 'Home') {
          evt.preventDefault();
          tabs[0].focus();
          return;
        }
        if (key === 'End') {
          evt.preventDefault();
          tabs[tabs.length - 1].focus();
          return;
        }
        if (key === 'Enter' || key === ' ') {
          evt.preventDefault();
          const id = String(btn.id || '');
          const tabName = id.replace('settingsTab-', '');
          setActiveTab(tabName);
        }
      });
    });
  }

  function stopColorBlindPreview(options) {
    const opts = options || {};
    if (colorBlindPreviewTimer) {
      clearTimeout(colorBlindPreviewTimer);
      colorBlindPreviewTimer = null;
    }
    const wasActive = colorBlindPreviewActive;
    colorBlindPreviewActive = false;
    colorBlindPreviewEndsAt = 0;
    if (wasActive && opts.revert !== false && !Settings.colorBlindMode) {
      Settings.applyAccessibilitySettings();
    }
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

    const modeQuickStart = document.getElementById('modeQuickStart');
    if (modeQuickStart) {
      modeQuickStart.innerHTML = getModeQuickStartHtml();
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

    const colorBlindBtn = document.getElementById('colorBlindModeBtn');
    if (colorBlindBtn) {
      colorBlindBtn.textContent = Settings.colorBlindMode ? 'On' : 'Off';
      colorBlindBtn.style.borderColor = Settings.colorBlindMode ? 'var(--teal)' : 'var(--border2)';
      colorBlindBtn.style.color = Settings.colorBlindMode ? 'var(--teal)' : 'var(--muted2)';
    }

    const previewBtn = document.getElementById('colorBlindPreviewBtn');
    const previewStatus = document.getElementById('colorBlindPreviewStatus');
    if (previewBtn) {
      previewBtn.disabled = !!Settings.colorBlindMode || colorBlindPreviewActive;
      previewBtn.style.opacity = previewBtn.disabled ? '0.6' : '1';
      previewBtn.textContent = colorBlindPreviewActive ? 'Previewing…' : 'Preview 10s';
    }
    if (previewStatus) {
      if (Settings.colorBlindMode) {
        previewStatus.textContent = 'Color-blind mode is enabled and saved.';
      } else if (colorBlindPreviewActive) {
        const secondsLeft = Math.max(1, Math.ceil((colorBlindPreviewEndsAt - Date.now()) / 1000));
        previewStatus.textContent = 'Preview active (' + secondsLeft + 's remaining).';
      } else {
        previewStatus.textContent = 'Preview applies temporarily for 10 seconds.';
      }
    }

    const monochromeBtn = document.getElementById('monochromeModeBtn');
    if (monochromeBtn) {
      monochromeBtn.textContent = Settings.monochromeMode ? 'On' : 'Off';
      monochromeBtn.style.borderColor = Settings.monochromeMode ? 'var(--teal)' : 'var(--border2)';
      monochromeBtn.style.color = Settings.monochromeMode ? 'var(--teal)' : 'var(--muted2)';
    }

    ['small','medium','large'].forEach(function(sz) {
      const btn = document.getElementById('textSize' + sz.charAt(0).toUpperCase() + sz.slice(1) + 'Btn');
      if (!btn) return;
      const active = Settings.textSize === sz;
      btn.classList.toggle('active', active);
      btn.style.borderColor = active ? 'var(--teal)' : 'var(--border2)';
      btn.style.color = active ? 'var(--teal)' : 'var(--muted2)';
    });

    const musicConsentBtn = document.getElementById('musicConsentBtn');
    if (musicConsentBtn) {
      musicConsentBtn.textContent = Settings.musicConsent ? 'On' : 'Off';
      musicConsentBtn.style.borderColor = Settings.musicConsent ? 'var(--teal)' : 'var(--border2)';
      musicConsentBtn.style.color = Settings.musicConsent ? 'var(--teal)' : 'var(--muted2)';
    }

    applySettingsTabVisibility();
    refreshRecoveryPanel();
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

  function toggleColorBlindMode() {
    if (colorBlindPreviewActive) {
      stopColorBlindPreview({ revert: false });
    }
    Settings.colorBlindMode = !Settings.colorBlindMode;
    Settings.applyAccessibilitySettings();
    Settings.save();
    syncGameModeUI();
  }

  function toggleMonochromeMode() {
    Settings.monochromeMode = !Settings.monochromeMode;
    Settings.applyAccessibilitySettings();
    Settings.save();
    syncGameModeUI();
  }

  function setTextSize(size) {
    if (size !== 'small' && size !== 'medium' && size !== 'large') return;
    Settings.textSize = size;
    Settings.applyTextSize();
    Settings.save();
    syncGameModeUI();
  }

  function toggleMusicConsent() {
    Settings.musicConsent = !Settings.musicConsent;
    Settings.applyAudioSettings();
    Settings.save();
    syncGameModeUI();
    if (typeof showNotif === 'function') {
      showNotif(
        Settings.musicConsent ? 'Background music enabled.' : 'Background music disabled.',
        Settings.musicConsent ? 'good' : 'info'
      );
    }
  }

  function previewColorBlindMode() {
    if (Settings.colorBlindMode) {
      if (typeof showNotif === 'function') showNotif('Color-blind mode is already enabled.', 'info');
      return;
    }
    stopColorBlindPreview();
    colorBlindPreviewActive = true;
    colorBlindPreviewEndsAt = Date.now() + COLORBLIND_PREVIEW_MS;
    document.body.classList.add('colorblind-mode');
    syncGameModeUI();
    colorBlindPreviewTimer = setTimeout(function () {
      colorBlindPreviewActive = false;
      colorBlindPreviewEndsAt = 0;
      Settings.applyAccessibilitySettings();
      syncGameModeUI();
    }, COLORBLIND_PREVIEW_MS);
  }
  
  function openSettings() {
    const container = document.getElementById(SETTINGS_ID);
    if (container) {
      syncGameModeUI();
      applySettingsTabVisibility();
      refreshRecoveryPanel();
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
    setActiveTab,
    toggleColorBlindMode,
    toggleMonochromeMode,
    previewColorBlindMode,
    setMasterVolume,
    setMusicVolume,
    setSFXVolume,
    toggleMusicConsent,
    setTextSize,
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
      musicConsent: Settings.musicConsent,
      gameMode: Settings.gameMode,
      gmRevealDC: Settings.gmRevealDC,
      gmRevealHiddenInfo: Settings.gmRevealHiddenInfo,
      colorBlindMode: Settings.colorBlindMode,
      monochromeMode: Settings.monochromeMode,
      textSize: Settings.textSize,
      activeTab: Settings.activeTab
    }),
    refreshRecoveryPanel,
    initSettings // Expose for manual initialization if needed
  };
  
  // Ensure it's initialized immediately
  if (document.readyState !== 'loading') {
    initSettings();
  }
})();
