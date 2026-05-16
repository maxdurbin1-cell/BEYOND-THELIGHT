(function () {
  var CHANNELS = [
    { id: 'ic', label: 'IC', prefix: '[IC]' },
    { id: 'ooc', label: 'OOC', prefix: '[OOC]' },
    { id: 'whisper', label: 'Whisper', prefix: '[Whisper]' },
    { id: 'gm', label: 'GM', prefix: '[GM]' },
    { id: 'system', label: 'System', prefix: '[System]' }
  ];

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureState() {
    if (typeof window.S === 'undefined' || !window.S || typeof window.S !== 'object') return null;
    if (!window.S.identityForge || typeof window.S.identityForge !== 'object') {
      window.S.identityForge = {};
    }
    var i = window.S.identityForge;
    if (!i.appearance || typeof i.appearance !== 'object') i.appearance = {};
    if (!i.media || typeof i.media !== 'object') i.media = {};
    if (!i.social || typeof i.social !== 'object') i.social = {};
    if (!Array.isArray(i.social.messages)) i.social.messages = [];
    if (typeof i.social.activeChannel !== 'string') i.social.activeChannel = 'ic';
    if (typeof i.social.open !== 'boolean') i.social.open = true;
    i.appearance.hair = i.appearance.hair || 'Ranger Sweep';
    i.appearance.skinTone = i.appearance.skinTone || '#d2ad89';
    i.appearance.eyeColor = i.appearance.eyeColor || '#66c4f8';
    i.appearance.tattoo = i.appearance.tattoo || '#4eb3f0';
    i.appearance.scar = i.appearance.scar || '#a74545';
    i.appearance.dyePrimary = i.appearance.dyePrimary || '#7b8caf';
    i.appearance.dyeSecondary = i.appearance.dyeSecondary || '#4aaea1';
    i.appearance.transmog = i.appearance.transmog || '';
    i.media.portrait = i.media.portrait || '';
    i.media.token = i.media.token || '';
    return i;
  }

  function readFileAsDataUrl(file, done) {
    if (!file || typeof FileReader === 'undefined') return;
    var reader = new FileReader();
    reader.onload = function () { done(String(reader.result || '')); };
    reader.readAsDataURL(file);
  }

  function applyCosmeticToState(id, value) {
    var forge = ensureState();
    if (!forge) return;
    if (id in forge.appearance) forge.appearance[id] = value;
    if (id === 'dyePrimary') forge.appearance.dyePrimary = value;
    if (id === 'dyeSecondary') forge.appearance.dyeSecondary = value;
    renderIdentityForge();
  }

  function narrativeRangeFromDistance(distance) {
    var d = Math.max(0, Number(distance || 0));
    if (d <= 3) return 'Engaged';
    if (d <= 12) return 'Close';
    if (d <= 24) return 'Nearby';
    return 'Far';
  }

  function rangeFlavor(range) {
    if (range === 'Engaged') return 'Blades clash, breathing distance, immediate danger.';
    if (range === 'Close') return 'Short surge and strike; voices carry clearly.';
    if (range === 'Nearby') return 'Tactical repositioning space with ranged pressure.';
    return 'Long lane with dramatic movement and cover play.';
  }

  function ensureCombatHud() {
    var tab = document.getElementById('tab-combat');
    if (!tab) return;
    var anchor = document.getElementById('combatCinematicHud');
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.id = 'combatCinematicHud';
      anchor.className = 'combat-cinematic-hud';
      tab.insertBefore(anchor, tab.firstChild);
    }
    if (!window.S.combat || typeof window.S.combat !== 'object') window.S.combat = {};
    if (typeof window.S.combat.cinematicDistance !== 'number') window.S.combat.cinematicDistance = 6;
    if (typeof window.S.combat.showRawDistance !== 'boolean') window.S.combat.showRawDistance = false;

    var dist = Math.max(0, Number(window.S.combat.cinematicDistance || 0));
    var range = narrativeRangeFromDistance(dist);
    window.S.combat.spacing = range;

    anchor.innerHTML = ''
      + '<div class="label">Cinematic Range Translator</div>'
      + '<div class="range-readout">' + range + (window.S.combat.showRawDistance ? (' · ' + dist + 'u') : '') + '</div>'
      + '<div class="range-help">' + esc(rangeFlavor(range)) + '</div>'
      + '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.4rem;align-items:center;margin-top:.34rem;">'
      + '<input id="cinematicDistanceInput" type="range" min="0" max="40" step="1" value="' + dist + '">'
      + '<button class="btn btn-xs" id="cinematicDistanceToggle">' + (window.S.combat.showRawDistance ? 'Hide Raw' : 'Show Raw') + '</button>'
      + '</div>';

    var slider = document.getElementById('cinematicDistanceInput');
    if (slider) {
      slider.oninput = function () {
        window.S.combat.cinematicDistance = Number(this.value || 0);
        ensureCombatHud();
      };
    }
    var toggle = document.getElementById('cinematicDistanceToggle');
    if (toggle) {
      toggle.onclick = function () {
        window.S.combat.showRawDistance = !window.S.combat.showRawDistance;
        ensureCombatHud();
      };
    }
  }

  function sendRoleplayMessage() {
    var forge = ensureState();
    if (!forge) return;
    var input = document.getElementById('roleplayDockInput');
    if (!input) return;
    var txt = String(input.value || '').trim();
    if (!txt) return;
    var active = forge.social.activeChannel || 'ic';
    var channelMeta = CHANNELS.find(function (c) { return c.id === active; }) || CHANNELS[0];
    var author = String((window.S && window.S.name) || 'Wayfarer').trim() || 'Wayfarer';
    var payload = {
      channel: channelMeta.id,
      author: author,
      text: txt,
      stamp: Date.now()
    };
    forge.social.messages.push(payload);
    if (forge.social.messages.length > 80) {
      forge.social.messages = forge.social.messages.slice(-80);
    }

    if (window.campaignSystem && typeof window.campaignSystem.sendChatMessage === 'function') {
      var dockInput = document.getElementById('campaignDockChatInput');
      if (dockInput) {
        dockInput.value = channelMeta.prefix + ' ' + author + ': ' + txt;
        window.campaignSystem.sendChatMessage();
      }
    }

    if (typeof window.showNotif === 'function') {
      window.showNotif('Sent ' + channelMeta.label + ' message.', 'good');
    }
    input.value = '';
    renderRoleplayDock();
  }

  function renderRoleplayDock() {
    var forge = ensureState();
    if (!forge) return;
    var node = document.getElementById('roleplayDock');
    if (!node) {
      node = document.createElement('section');
      node.id = 'roleplayDock';
      node.className = 'roleplay-dock';
      document.body.appendChild(node);
    }

    var active = forge.social.activeChannel || 'ic';
    var open = forge.social.open !== false;

    var visibleMessages = forge.social.messages.filter(function (m) {
      if (active === 'system') return true;
      return String(m.channel || '') === active;
    });

    node.innerHTML = ''
      + '<div class="rd-head">'
      + '<div class="rd-title">Roleplay Comms</div>'
      + '<button class="btn btn-xs" id="roleplayDockToggleBtn">' + (open ? 'Minimize' : 'Open') + '</button>'
      + '</div>'
      + (open ? ('<div class="rd-channels">' + CHANNELS.map(function (c) {
        var on = c.id === active;
        return '<button class="rd-chip ' + (on ? 'on' : '') + '" data-channel="' + c.id + '">' + esc(c.label) + '</button>';
      }).join('') + '</div>') : '')
      + (open ? ('<div class="rd-log">' + (visibleMessages.length ? visibleMessages.slice(-16).map(function (m) {
        var stamp = new Date(Number(m.stamp || Date.now())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return '<div class="rd-line">'
          + '<div class="rd-meta">' + esc(String(m.channel || '').toUpperCase()) + ' · ' + esc(m.author || 'Wayfarer') + ' · ' + esc(stamp) + '</div>'
          + '<div>' + esc(m.text || '') + '</div>'
          + '</div>';
      }).join('') : '<div class="rd-line"><div class="rd-meta">No messages yet</div><div>Start with an in-character opener or tactical whisper.</div></div>') + '</div>') : '')
      + (open ? '<div class="rd-send"><input id="roleplayDockInput" type="text" maxlength="260" placeholder="Speak into the scene..."><button class="btn btn-xs btn-teal" id="roleplayDockSendBtn">Send</button></div>' : '');

    var toggleBtn = document.getElementById('roleplayDockToggleBtn');
    if (toggleBtn) {
      toggleBtn.onclick = function () {
        forge.social.open = !forge.social.open;
        renderRoleplayDock();
      };
    }

    var chips = node.querySelectorAll('[data-channel]');
    chips.forEach(function (chip) {
      chip.onclick = function () {
        forge.social.activeChannel = String(chip.getAttribute('data-channel') || 'ic');
        renderRoleplayDock();
      };
    });

    var sendBtn = document.getElementById('roleplayDockSendBtn');
    if (sendBtn) sendBtn.onclick = sendRoleplayMessage;
    var input = document.getElementById('roleplayDockInput');
    if (input) {
      input.onkeydown = function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          sendRoleplayMessage();
        }
      };
    }
  }

  function layerLabel(value, fallback) {
    var text = String(value || '').trim();
    return text || fallback;
  }

  function renderIdentityForge() {
    var panel = document.getElementById('wayfarerVisualPanel');
    if (!panel) return;
    var forge = ensureState();
    if (!forge) return;

    if (!window.S.equipmentLayers || typeof window.S.equipmentLayers !== 'object') {
      window.S.equipmentLayers = { under: '', over: '', suit: '' };
    }

    var appearance = forge.appearance;
    var media = forge.media;
    var portraitSrc = media.portrait || '';
    var tokenSrc = media.token || '';
    var under = layerLabel(window.S.equipmentLayers.under, 'Base Layer');
    var over = layerLabel(window.S.equipmentLayers.over, 'Outer Layer');
    var suit = layerLabel(window.S.equipmentLayers.suit || appearance.transmog, 'No Transmog');

    panel.innerHTML = ''
      + '<div class="companion-overhaul">'
      + '<div class="co-title">Identity Forge</div>'
      + '<div class="co-sub">Layered visuals, dye channels, portrait and token art. Gear updates reflect immediately so attachment stays high during campaign play.</div>'
      + '<div class="co-grid">'
      + '<div class="co-card">'
      + '<div class="co-avatar" style="--co-skin:' + esc(appearance.skinTone) + ';--co-hair:' + esc(appearance.hairColor || '#1a1d25') + ';--co-eye:' + esc(appearance.eyeColor) + ';--co-tattoo:' + esc(appearance.tattoo) + ';--co-scar:' + esc(appearance.scar) + ';--co-dye-primary:' + esc(appearance.dyePrimary) + ';--co-dye-secondary:' + esc(appearance.dyeSecondary) + ';">'
      + '<div class="co-layer skin"></div>'
      + '<div class="co-layer hair"></div>'
      + '<div class="co-layer eyes"></div>'
      + '<div class="co-layer tattoo"></div>'
      + '<div class="co-layer scar"></div>'
      + '<div class="co-layer under" title="' + esc(under) + '"></div>'
      + '<div class="co-layer over" title="' + esc(over) + '"></div>'
      + '<div class="co-layer suit" title="' + esc(suit) + '"></div>'
      + '<div class="co-avatar-caption"><span>' + esc(under) + ' / ' + esc(over) + '</span><span>' + esc(suit) + '</span></div>'
      + '</div>'
      + '</div>'
      + '<div class="co-card">'
      + '<div class="co-controls">'
      + '<label><span class="sub-label">Skin Tone</span><input type="color" id="coSkinTone" value="' + esc(appearance.skinTone) + '"></label>'
      + '<label><span class="sub-label">Eye Color</span><input type="color" id="coEyeColor" value="' + esc(appearance.eyeColor) + '"></label>'
      + '<label><span class="sub-label">Tattoo Tone</span><input type="color" id="coTattoo" value="' + esc(appearance.tattoo) + '"></label>'
      + '<label><span class="sub-label">Scar Tone</span><input type="color" id="coScar" value="' + esc(appearance.scar) + '"></label>'
      + '<label><span class="sub-label">Dye Primary</span><input type="color" id="coDyePrimary" value="' + esc(appearance.dyePrimary) + '"></label>'
      + '<label><span class="sub-label">Dye Secondary</span><input type="color" id="coDyeSecondary" value="' + esc(appearance.dyeSecondary) + '"></label>'
      + '</div>'
      + '<div style="margin-top:.35rem;display:grid;gap:.35rem;">'
      + '<label><span class="sub-label">Hair Profile</span><input id="coHairProfile" type="text" value="' + esc(appearance.hair) + '" placeholder="Braided Hawk, Nomad Sweep..."></label>'
      + '<label><span class="sub-label">Transmog Override</span><input id="coTransmog" type="text" value="' + esc(appearance.transmog || '') + '" placeholder="Void Regent Mantle..."></label>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="co-card">'
      + '<div class="co-upload-grid">'
      + '<div>'
      + '<span class="sub-label">Portrait Art</span>'
      + '<img class="co-media-preview" src="' + esc(portraitSrc || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%230b1020\'/%3E%3Ctext x=\'50%25\' y=\'54%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23c2c9de\' font-size=\'14\' font-family=\'serif\'%3EUpload Portrait%3C/text%3E%3C/svg%3E') + '" alt="Portrait art">'
      + '<div style="display:flex;gap:.3rem;margin-top:.3rem;"><button class="btn btn-xs" id="coPortraitUploadBtn">Upload</button><button class="btn btn-xs" id="coPortraitUseAiBtn">AI</button></div>'
      + '<input id="coPortraitUploadInput" type="file" accept="image/*" style="display:none;">'
      + '</div>'
      + '<div>'
      + '<span class="sub-label">Token Art</span>'
      + '<img class="co-media-preview" src="' + esc(tokenSrc || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%230f1424\'/%3E%3Ctext x=\'50%25\' y=\'54%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23c2c9de\' font-size=\'14\' font-family=\'serif\'%3EUpload Token%3C/text%3E%3C/svg%3E') + '" alt="Token art">'
      + '<div style="display:flex;gap:.3rem;margin-top:.3rem;"><button class="btn btn-xs" id="coTokenUploadBtn">Upload</button><button class="btn btn-xs btn-teal" id="coTokenSyncBtn">Sync Token</button></div>'
      + '<input id="coTokenUploadInput" type="file" accept="image/*" style="display:none;">'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';

    var binds = [
      ['coSkinTone', 'skinTone'],
      ['coEyeColor', 'eyeColor'],
      ['coTattoo', 'tattoo'],
      ['coScar', 'scar'],
      ['coDyePrimary', 'dyePrimary'],
      ['coDyeSecondary', 'dyeSecondary']
    ];
    binds.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) {
        el.oninput = function () { applyCosmeticToState(pair[1], this.value); };
      }
    });

    var hairInput = document.getElementById('coHairProfile');
    if (hairInput) {
      hairInput.onchange = function () {
        forge.appearance.hair = String(this.value || '').trim();
      };
    }

    var transmogInput = document.getElementById('coTransmog');
    if (transmogInput) {
      transmogInput.onchange = function () {
        forge.appearance.transmog = String(this.value || '').trim();
        if (window.S && window.S.equipmentLayers) window.S.equipmentLayers.suit = forge.appearance.transmog;
        renderIdentityForge();
      };
    }

    var portraitBtn = document.getElementById('coPortraitUploadBtn');
    var portraitInput = document.getElementById('coPortraitUploadInput');
    if (portraitBtn && portraitInput) {
      portraitBtn.onclick = function () { portraitInput.click(); };
      portraitInput.onchange = function () {
        var file = portraitInput.files && portraitInput.files[0];
        readFileAsDataUrl(file, function (data) {
          forge.media.portrait = data;
          renderIdentityForge();
          if (typeof window.showNotif === 'function') window.showNotif('Portrait art updated.', 'good');
        });
      };
    }

    var portraitAiBtn = document.getElementById('coPortraitUseAiBtn');
    if (portraitAiBtn) {
      portraitAiBtn.onclick = function () {
        if (window.PortraitGenerator && typeof window.PortraitGenerator.generatePortrait === 'function') {
          window.PortraitGenerator.generatePortrait(window.S || {}).then(function (url) {
            forge.media.portrait = String(url || '');
            renderIdentityForge();
            if (typeof window.showNotif === 'function') window.showNotif('AI portrait generated.', 'good');
          }).catch(function () {
            if (typeof window.showNotif === 'function') window.showNotif('Portrait generation failed.', 'warn');
          });
        }
      };
    }

    var tokenBtn = document.getElementById('coTokenUploadBtn');
    var tokenInput = document.getElementById('coTokenUploadInput');
    if (tokenBtn && tokenInput) {
      tokenBtn.onclick = function () { tokenInput.click(); };
      tokenInput.onchange = function () {
        var file = tokenInput.files && tokenInput.files[0];
        readFileAsDataUrl(file, function (data) {
          forge.media.token = data;
          renderIdentityForge();
          if (typeof window.showNotif === 'function') window.showNotif('Token art updated.', 'good');
        });
      };
    }

    var tokenSyncBtn = document.getElementById('coTokenSyncBtn');
    if (tokenSyncBtn) {
      tokenSyncBtn.onclick = function () {
        if (!forge.media.portrait) {
          if (typeof window.showNotif === 'function') window.showNotif('Upload portrait first.', 'warn');
          return;
        }
        forge.media.token = forge.media.portrait;
        renderIdentityForge();
        if (typeof window.showNotif === 'function') window.showNotif('Token synced from portrait.', 'good');
      };
    }
  }

  function boot() {
    ensureState();
    renderIdentityForge();
    ensureCombatHud();
    renderRoleplayDock();

    window.renderCompanionOverhaul = function () {
      renderIdentityForge();
      ensureCombatHud();
      renderRoleplayDock();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
