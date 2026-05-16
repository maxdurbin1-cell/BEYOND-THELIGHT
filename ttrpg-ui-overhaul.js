(function () {
  var CHANNELS = [
    { id: 'ic', label: 'IC' },
    { id: 'ooc', label: 'OOC' },
    { id: 'whisper', label: 'Whisper' },
    { id: 'gm', label: 'GM' },
    { id: 'system', label: 'System' }
  ];

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeNotif(text, tone) {
    if (typeof window.showNotif === 'function') window.showNotif(text, tone || 'info');
  }

  function ensureState() {
    if (typeof window.S === 'undefined' || !window.S || typeof window.S !== 'object') return null;
    if (!window.S.identityForge || typeof window.S.identityForge !== 'object') window.S.identityForge = {};
    var i = window.S.identityForge;
    if (!i.appearance || typeof i.appearance !== 'object') i.appearance = {};
    if (!i.media || typeof i.media !== 'object') i.media = {};
    if (!i.social || typeof i.social !== 'object') i.social = {};
    if (!i.inventory || typeof i.inventory !== 'object') i.inventory = {};
    if (!i.mapTools || typeof i.mapTools !== 'object') i.mapTools = {};
    if (!Array.isArray(i.social.messages)) i.social.messages = [];
    if (typeof i.social.activeChannel !== 'string') i.social.activeChannel = 'ic';
    if (typeof i.social.open !== 'boolean') i.social.open = true;
    if (typeof i.social.whisperTarget !== 'string') i.social.whisperTarget = '';

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

    if (typeof i.inventory.dragEnabled !== 'boolean') i.inventory.dragEnabled = true;

    if (!Array.isArray(i.mapTools.pings)) i.mapTools.pings = [];
    if (!i.mapTools.statusByHex || typeof i.mapTools.statusByHex !== 'object') i.mapTools.statusByHex = {};
    if (!Array.isArray(i.mapTools.trails)) i.mapTools.trails = [];
    if (!i.mapTools.manualFogHidden || typeof i.mapTools.manualFogHidden !== 'object') i.mapTools.manualFogHidden = {};
    if (typeof i.mapTools.manualFogMode !== 'boolean') i.mapTools.manualFogMode = false;
    if (typeof i.mapTools.lastTrailKey !== 'string') i.mapTools.lastTrailKey = '';
    return i;
  }

  function readFileAsDataUrl(file, done) {
    if (!file || typeof FileReader === 'undefined') return;
    var reader = new FileReader();
    reader.onload = function () { done(String(reader.result || '')); };
    reader.readAsDataURL(file);
  }

  function parseSlotWeight(name) {
    var text = String(name || '').trim();
    if (!text) return 0;
    var stack = (typeof window.parseBackpackStack === 'function') ? window.parseBackpackStack(text) : { name: text, count: 1 };
    var count = Math.max(1, Number(stack.count || 1));
    var root = String(stack.name || text);
    var found = (typeof window.findShopItem === 'function') ? window.findShopItem(root) : null;
    var stat = found && found.item ? String(found.item.stat || '') : '';
    var desc = found && found.item ? String(found.item.desc || '') : '';
    var source = (stat + ' ' + desc + ' ' + root).toLowerCase();
    var sizeMatch = source.match(/size\s*(\d+)/i) || source.match(/(\d+)\s*slots?/i);
    var unit = sizeMatch ? Math.max(1, Number(sizeMatch[1] || 1)) : 1;
    return unit * count;
  }

  function getCarryCapacity() {
    if (typeof window.getBackpackCapacity === 'function') {
      return Math.max(6, Number(window.getBackpackCapacity() || 0) * 3);
    }
    var body = Number((window.S && window.S.stats && window.S.stats.body) || 4);
    return Math.max(6, body * 6);
  }

  function getTotalCarryWeight() {
    if (!window.S) return 0;
    var total = 0;
    if (Array.isArray(window.S.backpack)) {
      window.S.backpack.forEach(function (item) { total += parseSlotWeight(item); });
    }
    if (window.S.equipment && typeof window.S.equipment === 'object') {
      ['weapon1', 'weapon2', 'armor', 'readied'].forEach(function (k) { total += parseSlotWeight(window.S.equipment[k]); });
    }
    if (window.S.equipmentLayers && typeof window.S.equipmentLayers === 'object') {
      ['under', 'over', 'suit'].forEach(function (k) { total += parseSlotWeight(window.S.equipmentLayers[k]); });
    }
    return total;
  }

  function isWeaponLike(itemName) {
    var text = String(itemName || '').toLowerCase();
    var found = (typeof window.findShopItem === 'function') ? window.findShopItem(itemName) : null;
    if (found && ['weapons', 'melee_exp', 'ranged_exp'].indexOf(String(found.cat || '')) >= 0) return true;
    return /weapon|sword|axe|mace|spear|bow|rifle|pistol|gun|strike|shoot/.test(text);
  }

  function isArmorLike(itemName) {
    var text = String(itemName || '').toLowerCase();
    var found = (typeof window.findShopItem === 'function') ? window.findShopItem(itemName) : null;
    if (found && ['armor', 'armor_exp', 'space_armor'].indexOf(String(found.cat || '')) >= 0) return true;
    return /armor|armour|cloak|mantle|suit|radsuit|vaccsuit|hydrosuit|defend/.test(text);
  }

  function getCosmeticSlotForItem(itemName) {
    var text = String(itemName || '');
    if (typeof window.getLayerSlotForItem === 'function') {
      var slot = window.getLayerSlotForItem(text);
      if (slot) return slot;
    }
    var lower = text.toLowerCase();
    if (/thermal|coolant|under/.test(lower)) return 'under';
    if (/exo|over/.test(lower)) return 'over';
    if (/suit|vacc|rad|hydro|transmog|mantle|cloak/.test(lower)) return 'suit';
    return '';
  }

  function ensureInventoryWeightHud() {
    var grid = document.getElementById('backpackGrid');
    if (!grid || !grid.parentElement) return;
    var host = document.getElementById('inventoryWeightHud');
    if (!host) {
      host = document.createElement('div');
      host.id = 'inventoryWeightHud';
      host.className = 'co-inventory-hud';
      grid.parentElement.insertBefore(host, grid);
    }
    var total = getTotalCarryWeight();
    var cap = getCarryCapacity();
    var pct = Math.min(100, Math.round((total / Math.max(1, cap)) * 100));
    var warn = total > cap;
    host.innerHTML = ''
      + '<div class="co-inv-top">'
      + '<span class="sub-label" style="margin-bottom:0;">Carry Weight</span>'
      + '<span style="font-size:.74rem;color:' + (warn ? 'var(--red2)' : 'var(--teal)') + ';">' + total + ' / ' + cap + '</span>'
      + '</div>'
      + '<div class="co-weight-bar"><div class="co-weight-fill ' + (warn ? 'warn' : '') + '" style="width:' + pct + '%;"></div></div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-top:.16rem;">Drag items between backpack, equipment, and cosmetic slots. Slot rules are enforced.</div>';
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
    if (!window.S || typeof window.S !== 'object') return;
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

  function getWhisperCandidates() {
    if (!window.campaignSystem || typeof window.campaignSystem.getState !== 'function') return [];
    var cs = window.campaignSystem.getState();
    if (!cs || !cs.campaign || !Array.isArray(cs.campaign.roster)) return [];
    var me = String(cs.token || '');
    return cs.campaign.roster.filter(function (row) {
      return row && row.token && String(row.token) !== me;
    }).map(function (row) {
      return { token: String(row.token), name: String(row.name || 'Wayfarer') };
    });
  }

  function sendRoleplayMessage() {
    var forge = ensureState();
    if (!forge) return;
    var input = document.getElementById('roleplayDockInput');
    if (!input) return;
    var txt = String(input.value || '').trim();
    if (!txt) return;
    var active = forge.social.activeChannel || 'ic';
    var author = String((window.S && window.S.name) || 'Wayfarer').trim() || 'Wayfarer';
    var payload = {
      channel: active,
      author: author,
      text: txt,
      stamp: Date.now(),
      targetToken: active === 'whisper' ? String(forge.social.whisperTarget || '') : ''
    };

    if (active === 'whisper' && !payload.targetToken) {
      safeNotif('Choose a whisper target first.', 'warn');
      return;
    }

    forge.social.messages.push(payload);
    if (forge.social.messages.length > 80) forge.social.messages = forge.social.messages.slice(-80);

    if (window.campaignSystem && typeof window.campaignSystem.sendChatMessage === 'function') {
      window.campaignSystem.sendChatMessage({
        message: txt,
        channel: active,
        targetToken: payload.targetToken
      });
    }

    safeNotif('Sent ' + active.toUpperCase() + ' message.', 'good');
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
    var whispers = getWhisperCandidates();
    if (active === 'whisper' && !forge.social.whisperTarget && whispers.length) forge.social.whisperTarget = whispers[0].token;

    var visibleMessages = forge.social.messages.filter(function (m) {
      if (active === 'system') return true;
      if (String(m.channel || '') !== active) return false;
      if (active !== 'whisper') return true;
      var me = String(window.campaignSystem && window.campaignSystem.getState ? (window.campaignSystem.getState().token || '') : '');
      var target = String(m.targetToken || '');
      return !target || target === forge.social.whisperTarget || m.author === (window.S && window.S.name) || target === me;
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
      + (open && active === 'whisper' ? ('<div class="rd-send" style="grid-template-columns:minmax(0,1fr);border-top:none;padding-top:0;">'
        + '<select id="roleplayWhisperTarget" class="campaign-dock-input">'
        + whispers.map(function (w) {
          var on = String(w.token) === String(forge.social.whisperTarget || '');
          return '<option value="' + esc(w.token) + '" ' + (on ? 'selected' : '') + '>To: ' + esc(w.name) + '</option>';
        }).join('')
        + '</select>'
        + '</div>') : '')
      + (open ? ('<div class="rd-log">' + (visibleMessages.length ? visibleMessages.slice(-16).map(function (m) {
        var stamp = new Date(Number(m.stamp || Date.now())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var whisperBit = (m.channel === 'whisper' && m.targetToken) ? (' -> ' + esc(m.targetToken.slice(-4))) : '';
        return '<div class="rd-line">'
          + '<div class="rd-meta">' + esc(String(m.channel || '').toUpperCase()) + whisperBit + ' · ' + esc(m.author || 'Wayfarer') + ' · ' + esc(stamp) + '</div>'
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

    var targetSel = document.getElementById('roleplayWhisperTarget');
    if (targetSel) {
      targetSel.onchange = function () {
        forge.social.whisperTarget = String(targetSel.value || '');
      };
    }

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
      + '<label><span class="sub-label">Transmog Override</span><input id="coTransmog" type="text" value="' + esc(appearance.transmog || '') + '" placeholder="Void Regent Mantle..." data-drop-target="equip:suit"></label>'
      + '</div>'
      + '<div id="coCosmeticSlots" class="co-cosmetic-grid">'
      + '<div class="co-cos-slot" data-drop-target="equip:under"><span>Under</span><strong>' + esc(under) + '</strong></div>'
      + '<div class="co-cos-slot" data-drop-target="equip:over"><span>Over</span><strong>' + esc(over) + '</strong></div>'
      + '<div class="co-cos-slot" data-drop-target="equip:suit"><span>Suit</span><strong>' + esc(suit) + '</strong></div>'
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

    [
      ['coSkinTone', 'skinTone'], ['coEyeColor', 'eyeColor'], ['coTattoo', 'tattoo'],
      ['coScar', 'scar'], ['coDyePrimary', 'dyePrimary'], ['coDyeSecondary', 'dyeSecondary']
    ].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) el.oninput = function () { appearance[pair[1]] = this.value; renderIdentityForge(); };
    });

    var hairInput = document.getElementById('coHairProfile');
    if (hairInput) hairInput.onchange = function () { appearance.hair = String(this.value || '').trim(); };

    var transmogInput = document.getElementById('coTransmog');
    if (transmogInput) {
      transmogInput.onchange = function () {
        appearance.transmog = String(this.value || '').trim();
        if (window.S && window.S.equipmentLayers) window.S.equipmentLayers.suit = appearance.transmog;
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
          media.portrait = data;
          renderIdentityForge();
          safeNotif('Portrait art updated.', 'good');
        });
      };
    }

    var portraitAiBtn = document.getElementById('coPortraitUseAiBtn');
    if (portraitAiBtn) {
      portraitAiBtn.onclick = function () {
        if (window.PortraitGenerator && typeof window.PortraitGenerator.generatePortrait === 'function') {
          window.PortraitGenerator.generatePortrait(window.S || {}).then(function (url) {
            media.portrait = String(url || '');
            renderIdentityForge();
            safeNotif('AI portrait generated.', 'good');
          }).catch(function () {
            safeNotif('Portrait generation failed.', 'warn');
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
          media.token = data;
          renderIdentityForge();
          safeNotif('Token art updated.', 'good');
        });
      };
    }

    var tokenSyncBtn = document.getElementById('coTokenSyncBtn');
    if (tokenSyncBtn) {
      tokenSyncBtn.onclick = function () {
        if (!media.portrait) {
          safeNotif('Upload portrait first.', 'warn');
          return;
        }
        media.token = media.portrait;
        renderIdentityForge();
        safeNotif('Token synced from portrait.', 'good');
      };
    }
  }

  function currentDropPayload() {
    try {
      return JSON.parse(String(window.__coDragPayload || '{}'));
    } catch (_err) {
      return null;
    }
  }

  function setDropPayload(payload) {
    window.__coDragPayload = JSON.stringify(payload || {});
  }

  function clearDropPayload() {
    window.__coDragPayload = '';
  }

  function readSourceValue(source) {
    if (!window.S || !source || typeof source !== 'object') return '';
    if (source.kind === 'backpack') {
      return (Array.isArray(window.S.backpack) && window.S.backpack[source.index]) ? String(window.S.backpack[source.index]) : '';
    }
    if (source.kind === 'equip') {
      if (source.slot === 'under' || source.slot === 'over' || source.slot === 'suit') return String((window.S.equipmentLayers && window.S.equipmentLayers[source.slot]) || '');
      return String((window.S.equipment && window.S.equipment[source.slot]) || '');
    }
    return '';
  }

  function writeTargetValue(target, value) {
    if (!window.S || !target || typeof target !== 'object') return;
    if (target.kind === 'backpack') {
      if (!Array.isArray(window.S.backpack)) window.S.backpack = [];
      window.S.backpack[target.index] = String(value || '');
      return;
    }
    if (target.kind === 'equip') {
      if (target.slot === 'under' || target.slot === 'over' || target.slot === 'suit') {
        if (!window.S.equipmentLayers || typeof window.S.equipmentLayers !== 'object') window.S.equipmentLayers = { under: '', over: '', suit: '' };
        window.S.equipmentLayers[target.slot] = String(value || '');
        return;
      }
      if (!window.S.equipment || typeof window.S.equipment !== 'object') window.S.equipment = { weapon1: '', weapon2: '', armor: '', readied: '' };
      window.S.equipment[target.slot] = String(value || '');
    }
  }

  function parseTarget(raw) {
    var parts = String(raw || '').split(':');
    if (parts[0] === 'bp') return { kind: 'backpack', index: Number(parts[1] || 0) };
    if (parts[0] === 'equip') return { kind: 'equip', slot: String(parts[1] || '') };
    return null;
  }

  function canDropToTarget(itemText, target) {
    var raw = String(itemText || '').trim();
    if (!raw || !target) return false;
    if (target.kind === 'backpack') return true;
    if (target.kind !== 'equip') return false;
    var slot = target.slot;
    if (slot === 'weapon1' || slot === 'weapon2') return isWeaponLike(raw);
    if (slot === 'armor') return isArmorLike(raw);
    if (slot === 'under' || slot === 'over' || slot === 'suit') {
      return getCosmeticSlotForItem(raw) === slot;
    }
    return true;
  }

  function executeDrop(target, source) {
    var src = source || {};
    var tgt = target || {};
    var val = readSourceValue(src);
    if (!val) return;
    if (!canDropToTarget(val, tgt)) {
      safeNotif('Slot constraint blocks this item.', 'warn');
      return;
    }

    var sourceVal = val;
    var targetVal = readSourceValue(tgt);
    writeTargetValue(tgt, sourceVal);
    writeTargetValue(src, targetVal || '');

    if (getTotalCarryWeight() > getCarryCapacity()) {
      writeTargetValue(src, sourceVal);
      writeTargetValue(tgt, targetVal || '');
      safeNotif('Over capacity. Adjust load before moving this item.', 'warn');
      return;
    }

    if (typeof window.renderBackpackUI === 'function') window.renderBackpackUI();
    if (typeof window.renderWeaponModsPanel === 'function') window.renderWeaponModsPanel();
    if (typeof window.updateAllStatDisplays === 'function') window.updateAllStatDisplays();
    if (typeof window.refreshArmorSlotMeta === 'function') window.refreshArmorSlotMeta();
    renderIdentityForge();
    ensureInventoryWeightHud();
    safeNotif('Item moved.', 'good');
  }

  function decorateInventoryDnd() {
    if (!window.S || !window.S.backpack) return;
    ensureInventoryWeightHud();

    var bpInputs = document.querySelectorAll('#backpackGrid .bp-input');
    bpInputs.forEach(function (input, idx) {
      var value = String(input.value || '').trim();
      input.setAttribute('data-drop-target', 'bp:' + idx);
      input.classList.add('co-drop-target');
      input.draggable = !!value;
      input.ondragstart = value ? function (ev) {
        var payload = { kind: 'backpack', index: idx };
        setDropPayload(payload);
        ev.dataTransfer.setData('text/plain', 'bp:' + idx);
      } : null;
      input.ondragover = function (ev) { ev.preventDefault(); input.classList.add('co-drop-over'); };
      input.ondragleave = function () { input.classList.remove('co-drop-over'); };
      input.ondrop = function (ev) {
        ev.preventDefault();
        input.classList.remove('co-drop-over');
        var source = currentDropPayload();
        if (!source) return;
        executeDrop({ kind: 'backpack', index: idx }, source);
        clearDropPayload();
      };
    });

    ['weapon1', 'weapon2', 'armor', 'readied'].forEach(function (slot) {
      var id = slot === 'weapon1' ? 'eqWeapon1' : slot === 'weapon2' ? 'eqWeapon2' : slot === 'armor' ? 'eqArmor' : 'eqReadied';
      var el = document.getElementById(id);
      if (!el) return;
      var value = String(el.value || '').trim();
      el.setAttribute('data-drop-target', 'equip:' + slot);
      el.classList.add('co-drop-target');
      el.draggable = !!value;
      el.ondragstart = value ? function (ev) {
        setDropPayload({ kind: 'equip', slot: slot });
        ev.dataTransfer.setData('text/plain', 'equip:' + slot);
      } : null;
      el.ondragover = function (ev) { ev.preventDefault(); el.classList.add('co-drop-over'); };
      el.ondragleave = function () { el.classList.remove('co-drop-over'); };
      el.ondrop = function (ev) {
        ev.preventDefault();
        el.classList.remove('co-drop-over');
        var source = currentDropPayload();
        if (!source) return;
        executeDrop({ kind: 'equip', slot: slot }, source);
        clearDropPayload();
      };
    });

    var cosSlots = document.querySelectorAll('[data-drop-target="equip:under"],[data-drop-target="equip:over"],[data-drop-target="equip:suit"]');
    cosSlots.forEach(function (slotEl) {
      slotEl.ondragover = function (ev) { ev.preventDefault(); slotEl.classList.add('co-drop-over'); };
      slotEl.ondragleave = function () { slotEl.classList.remove('co-drop-over'); };
      slotEl.ondrop = function (ev) {
        ev.preventDefault();
        slotEl.classList.remove('co-drop-over');
        var source = currentDropPayload();
        if (!source) return;
        var target = parseTarget(slotEl.getAttribute('data-drop-target'));
        executeDrop(target, source);
        clearDropPayload();
      };
    });
  }

  function detectHexByPoint(svg, event) {
    if (!svg || typeof window.hexToPixel !== 'function' || !Array.isArray(window.mapData)) return null;
    var pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    var best = null;
    var bestDist = Infinity;
    var maxDist = Number(window.HEX_SIZE || 30) * 0.95;
    window.mapData.forEach(function (hex) {
      var p = window.hexToPixel(hex.col, hex.row);
      var dx = loc.x - p.x;
      var dy = loc.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        best = hex;
      }
    });
    if (best && bestDist <= maxDist) return best;
    return null;
  }

  function mapKey(hex) {
    return hex ? (String(hex.col) + ',' + String(hex.row)) : '';
  }

  function addPing(hex) {
    var state = ensureState();
    if (!state || !hex) return;
    var key = mapKey(hex);
    var who = String((window.S && window.S.name) || 'Wayfarer').trim() || 'Wayfarer';
    state.mapTools.pings.push({ key: key, at: Date.now(), by: who });
    state.mapTools.pings = state.mapTools.pings.slice(-24);
    safeNotif('Ping at hex ' + key + '.', 'info');
    if (typeof window.renderHexMap === 'function') window.renderHexMap();
  }

  function cycleStatus(hex) {
    var state = ensureState();
    if (!state || !hex) return;
    var key = mapKey(hex);
    var current = String(state.mapTools.statusByHex[key] || '');
    var statuses = ['', 'guard', 'poison', 'burn', 'stun', 'hidden'];
    var idx = statuses.indexOf(current);
    var next = statuses[(idx + 1) % statuses.length];
    if (!next) delete state.mapTools.statusByHex[key];
    else state.mapTools.statusByHex[key] = next;
    safeNotif(next ? ('Status: ' + next + ' @ ' + key) : ('Status cleared @ ' + key), 'good');
    if (typeof window.renderHexMap === 'function') window.renderHexMap();
  }

  function trackMovementTrail() {
    var state = ensureState();
    if (!state || !window.selectedHex) return;
    var key = mapKey(window.selectedHex);
    if (!key || key === state.mapTools.lastTrailKey) return;
    state.mapTools.lastTrailKey = key;
    state.mapTools.trails.push({ key: key, at: Date.now() });
    state.mapTools.trails = state.mapTools.trails.slice(-18);
  }

  function ensureMapInteractionControls() {
    var controls = document.querySelector('#tab-map .map-controls');
    if (!controls) return;
    var state = ensureState();
    if (!state) return;
    var row = document.getElementById('mapInteractionControls');
    if (!row) {
      row = document.createElement('span');
      row.id = 'mapInteractionControls';
      controls.appendChild(row);
    }
    row.innerHTML = ''
      + '<button class="btn btn-sm ' + (state.mapTools.manualFogMode ? 'btn-teal' : '') + '" id="coFogModeBtn">Fog Manual: ' + (state.mapTools.manualFogMode ? 'On' : 'Off') + '</button>'
      + '<button class="btn btn-sm" id="coFogHideBtn">Hide Selected</button>'
      + '<button class="btn btn-sm" id="coFogRevealBtn">Reveal Selected</button>'
      + '<button class="btn btn-sm" id="coTrailClearBtn">Clear Trail</button>';

    var modeBtn = document.getElementById('coFogModeBtn');
    if (modeBtn) {
      modeBtn.onclick = function () {
        state.mapTools.manualFogMode = !state.mapTools.manualFogMode;
        ensureMapInteractionControls();
      };
    }
    var hideBtn = document.getElementById('coFogHideBtn');
    if (hideBtn) {
      hideBtn.onclick = function () {
        if (!window.selectedHex) return;
        state.mapTools.manualFogHidden[mapKey(window.selectedHex)] = true;
        if (typeof window.renderHexMap === 'function') window.renderHexMap();
      };
    }
    var revealBtn = document.getElementById('coFogRevealBtn');
    if (revealBtn) {
      revealBtn.onclick = function () {
        if (!window.selectedHex) return;
        delete state.mapTools.manualFogHidden[mapKey(window.selectedHex)];
        if (typeof window.revealMapFogHex === 'function') window.revealMapFogHex('province', mapKey(window.selectedHex));
        if (typeof window.renderHexMap === 'function') window.renderHexMap();
      };
    }
    var clearBtn = document.getElementById('coTrailClearBtn');
    if (clearBtn) {
      clearBtn.onclick = function () {
        state.mapTools.trails = [];
        safeNotif('Movement trails cleared.', 'info');
        if (typeof window.renderHexMap === 'function') window.renderHexMap();
      };
    }
  }

  function renderMapOverlays() {
    var state = ensureState();
    if (!state) return;
    var svg = document.getElementById('hexMapSvg');
    if (!svg || typeof window.hexToPixel !== 'function') return;

    ensureMapInteractionControls();
    trackMovementTrail();

    var now = Date.now();
    state.mapTools.pings = state.mapTools.pings.filter(function (p) { return (now - Number(p.at || 0)) < 14000; });

    var old = document.getElementById('coMapOverlayLayer');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'coMapOverlayLayer');

    state.mapTools.pings.forEach(function (ping) {
      var parts = String(ping.key || '').split(',');
      var col = Number(parts[0]);
      var row = Number(parts[1]);
      if (!isFinite(col) || !isFinite(row)) return;
      var p = window.hexToPixel(col, row);
      var age = Math.max(0, now - Number(ping.at || now));
      var progress = Math.min(1, age / 14000);
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', String(p.x));
      ring.setAttribute('cy', String(p.y));
      ring.setAttribute('r', String(8 + Math.round(progress * 20)));
      ring.setAttribute('fill', 'rgba(126,215,255,0.06)');
      ring.setAttribute('stroke', 'rgba(126,215,255,' + String(0.9 - progress * 0.7) + ')');
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('pointer-events', 'none');
      g.appendChild(ring);
    });

    Object.keys(state.mapTools.statusByHex || {}).forEach(function (key) {
      var status = String(state.mapTools.statusByHex[key] || '');
      if (!status) return;
      var parts = key.split(',');
      var p = window.hexToPixel(Number(parts[0]), Number(parts[1]));
      var icon = status === 'guard' ? '🛡' : status === 'poison' ? '☣' : status === 'burn' ? '🔥' : status === 'stun' ? '💫' : '🕶';
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', String(p.x - Number(window.HEX_SIZE || 30) * 0.58));
      t.setAttribute('y', String(p.y - Number(window.HEX_SIZE || 30) * 0.55));
      t.setAttribute('font-size', '12');
      t.setAttribute('pointer-events', 'none');
      t.textContent = icon;
      g.appendChild(t);
    });

    if (state.mapTools.trails.length > 1) {
      var points = state.mapTools.trails.map(function (step) {
        var parts = String(step.key || '').split(',');
        var p = window.hexToPixel(Number(parts[0]), Number(parts[1]));
        return String(p.x) + ',' + String(p.y);
      }).join(' ');
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('points', points);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', 'rgba(232,192,80,0.7)');
      line.setAttribute('stroke-width', '2.4');
      line.setAttribute('stroke-dasharray', '4 3');
      line.setAttribute('pointer-events', 'none');
      g.appendChild(line);
    }

    if (state.mapTools.manualFogMode) {
      Object.keys(state.mapTools.manualFogHidden || {}).forEach(function (key) {
        if (!state.mapTools.manualFogHidden[key]) return;
        var parts = key.split(',');
        var col = Number(parts[0]);
        var row = Number(parts[1]);
        if (!isFinite(col) || !isFinite(row)) return;
        var p = window.hexToPixel(col, row);
        var r = Math.max(6, Number(window.HEX_SIZE || 30) - 1);
        var pts = [];
        for (var i = 0; i < 6; i += 1) {
          var ang = ((60 * i - 30) * Math.PI) / 180;
          pts.push((p.x + r * Math.cos(ang)) + ',' + (p.y + r * Math.sin(ang)));
        }
        var fog = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        fog.setAttribute('points', pts.join(' '));
        fog.setAttribute('fill', 'rgba(6,10,16,0.74)');
        fog.setAttribute('stroke', 'rgba(155,170,198,0.32)');
        fog.setAttribute('stroke-width', '1.2');
        fog.setAttribute('pointer-events', 'none');
        g.appendChild(fog);
      });
    }

    svg.appendChild(g);

    if (!svg.dataset.coBound) {
      svg.dataset.coBound = '1';
      svg.addEventListener('click', function (ev) {
        var hex = detectHexByPoint(svg, ev);
        if (!hex) return;
        if (ev.altKey) {
          ev.preventDefault();
          ev.stopPropagation();
          addPing(hex);
          return;
        }
        if (ev.shiftKey) {
          ev.preventDefault();
          ev.stopPropagation();
          cycleStatus(hex);
        }
      }, true);
    }
  }

  function patchGlobalRenders() {
    if (typeof window.renderBackpackUI === 'function' && !window.renderBackpackUI.__coWrapped) {
      var oldBackpack = window.renderBackpackUI;
      window.renderBackpackUI = function () {
        var out = oldBackpack.apply(this, arguments);
        decorateInventoryDnd();
        ensureInventoryWeightHud();
        return out;
      };
      window.renderBackpackUI.__coWrapped = true;
    }

    if (typeof window.renderHexMap === 'function' && !window.renderHexMap.__coWrapped) {
      var oldHex = window.renderHexMap;
      window.renderHexMap = function () {
        var out = oldHex.apply(this, arguments);
        renderMapOverlays();
        return out;
      };
      window.renderHexMap.__coWrapped = true;
    }
  }

  function boot() {
    ensureState();
    patchGlobalRenders();
    renderIdentityForge();
    ensureCombatHud();
    renderRoleplayDock();
    decorateInventoryDnd();
    ensureInventoryWeightHud();
    renderMapOverlays();

    window.renderCompanionOverhaul = function () {
      renderIdentityForge();
      ensureCombatHud();
      renderRoleplayDock();
      decorateInventoryDnd();
      ensureInventoryWeightHud();
      renderMapOverlays();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
