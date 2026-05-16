(function () {
  var KEY = 'btl-combat-scene-editor-v1';
  var SQRT3 = Math.sqrt(3);

  function safeNotif(msg, tone) {
    if (typeof window.showNotif === 'function') window.showNotif(msg, tone || 'info');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uid(prefix) {
    return String(prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 9999).toString(36);
  }

  function createStore(initial) {
    var state = initial;
    var listeners = [];
    return {
      getState: function () { return state; },
      setState: function (patch) {
        var next = typeof patch === 'function' ? patch(state) : patch;
        state = Object.assign({}, state, next || {});
        listeners.slice().forEach(function (fn) { fn(state); });
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          listeners = listeners.filter(function (entry) { return entry !== fn; });
        };
      }
    };
  }

  function hexLabel(distance) {
    var d = Math.max(0, Number(distance || 0));
    if (d <= 1) return 'Engaged';
    if (d <= 2) return 'Close';
    if (d <= 3) return 'Near';
    if (d <= 4) return 'Far';
    return 'Distant';
  }

  function slug(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function flattenCodexBestiary() {
    var out = [];
    if (typeof NAMED_ENEMY_BESTIARY === 'object' && NAMED_ENEMY_BESTIARY) {
      Object.keys(NAMED_ENEMY_BESTIARY).forEach(function (region) {
        var list = NAMED_ENEMY_BESTIARY[region];
        if (!Array.isArray(list)) return;
        list.forEach(function (entry) {
          if (!entry) return;
          out.push({
            id: slug(region + '-' + (entry.name || 'beast')),
            region: String(region),
            name: String(entry.name || 'Unknown Beast'),
            desc: String(entry.desc || ''),
            dread: Math.max(4, Number(entry.dread || 4)),
            hp: Math.max(1, Number(entry.health || 8)),
            image: String(entry.image || '')
          });
        });
      });
    }
    return out;
  }

  function hexDistance(a, b) {
    var aq = Number(a && a.q || 0);
    var ar = Number(a && a.r || 0);
    var bq = Number(b && b.q || 0);
    var br = Number(b && b.r || 0);
    return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs((aq + ar) - (bq + br)));
  }

  function getWeatherModifier(state, mode) {
    var name = String(state && state.board && state.board.weatherOverlay || 'none');
    var intensity = Math.max(0, Number(state && state.board && state.board.weatherIntensity || 0));
    if (name === 'none' || !intensity) return 0;
    if (mode === 'movement') {
      if (name === 'rain' || name === 'ash') return -Math.ceil(intensity / 2);
      if (name === 'storm') return -intensity;
      if (name === 'fog') return -Math.ceil(intensity / 2);
    }
    if (mode === 'ranged') {
      if (name === 'fog') return -intensity;
      if (name === 'storm') return -Math.ceil(intensity / 2);
    }
    if (mode === 'melee') {
      if (name === 'rain') return -Math.floor(intensity / 2);
      if (name === 'ash') return -Math.floor(intensity / 2);
    }
    return 0;
  }

  function isHexRevealed(state, q, r) {
    if (!state.fog || !state.fog.enabled) return true;
    var key = toKey(q, r);
    var visible = !!(state.fog.revealed && state.fog.revealed[key]);
    var selected = byId(state.selectedTokenId);
    if (!selected) return visible;
    var radius = Math.max(0, Number(state.fog.visionRadius || 0));
    if (!radius) return visible;
    if (hexDistance({ q: q, r: r }, { q: selected.q, r: selected.r }) <= radius) return true;
    return visible;
  }

  function toKey(q, r) {
    return String(q) + ',' + String(r);
  }

  function axialToPixel(q, r, size, panX, panY) {
    return {
      x: size * (SQRT3 * q + (SQRT3 / 2) * r) + panX,
      y: size * (1.5 * r) + panY
    };
  }

  function pixelToAxial(x, y, size, panX, panY) {
    var px = x - panX;
    var py = y - panY;
    var q = (SQRT3 / 3 * px - 1 / 3 * py) / size;
    var r = (2 / 3 * py) / size;
    var rounded = cubeRound(q, r);
    return { q: rounded.q, r: rounded.r };
  }

  function cubeRound(q, r) {
    var x = q;
    var z = r;
    var y = -x - z;
    var rx = Math.round(x);
    var ry = Math.round(y);
    var rz = Math.round(z);
    var xDiff = Math.abs(rx - x);
    var yDiff = Math.abs(ry - y);
    var zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;

    return { q: rx, r: rz };
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_err) {
      return null;
    }
  }

  function persist(state) {
    try {
      var slim = {
        board: state.board,
        layers: state.layers,
        fog: state.fog,
        sceneRules: state.sceneRules,
        tokens: state.tokens,
        initiative: state.initiative,
        actionHistory: state.actionHistory,
        panelPos: state.panelPos,
        autoRoll: state.autoRoll
      };
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch (_err) {}
    if (window.S && window.S.combat) {
      window.S.combat.sceneEditor = clone(state);
    }
  }

  function defaultTokens() {
    var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';
    var name = (window.S && window.S.name) || 'Wayfarer';
    return [
      { id: uid('pc'), name: String(name), faction: 'player', hp: 12, maxHp: 12, status: [], q: 0, r: 0, image: portrait, size: 1, isPlayer: true },
      { id: uid('mob'), name: 'Ghoul Ravager', faction: 'monster', hp: 10, maxHp: 10, status: [], q: 3, r: 0, image: '', size: 1 }
    ];
  }

  function seedFromCurrentCombat() {
    var tokens = [];
    if (window.S && window.S.combat && window.S.combat.sceneWorkshop && Array.isArray(window.S.combat.sceneWorkshop.tokens)) {
      tokens = window.S.combat.sceneWorkshop.tokens.map(function (token, idx) {
        if (!token) return null;
        return {
          id: String(token.id || uid('ws')),
          name: String(token.name || ('Token ' + (idx + 1))),
          faction: String(token.side || 'neutral') === 'ally' ? 'player' : 'monster',
          hp: 10,
          maxHp: 10,
          status: [],
          q: Number(token.x || 0),
          r: Number(token.y || 0),
          image: String(token.image || ''),
          size: 1,
          isPlayer: !!token.isPlayer
        };
      }).filter(Boolean);
    }

    if (!tokens.length && window.S && Array.isArray(window.S.enemies) && window.S.enemies.length) {
      tokens = window.S.enemies.map(function (enemy, idx) {
        var allied = !!enemy.ally;
        return {
          id: uid(allied ? 'ally' : 'enm'),
          name: String(enemy.name || (allied ? 'Ally' : 'Enemy ' + (idx + 1))),
          faction: allied ? 'player' : 'monster',
          hp: Number(enemy.stress || 8),
          maxHp: Number(enemy.stress || 8),
          status: [],
          q: allied ? idx : idx + 3,
          r: allied ? 2 : 0,
          image: '',
          size: 1,
          isPlayer: allied && idx === 0
        };
      });
    }

    return tokens.length ? tokens : defaultTokens();
  }

  var persisted = loadPersisted();
  var store = createStore(Object.assign({
    open: false,
    entering: false,
    activeLayer: 'terrain',
    activeTool: 'select',
    fogBrush: 'reveal',
    paintValue: 'forest',
    selectedTokenId: '',
    draggingTokenId: '',
    autoRoll: true,
    initiativeIndex: 0,
    ruler: { active: false, start: null, end: null, distance: 0, label: 'Engaged' },
    board: {
      cols: 22,
      rows: 16,
      size: 42,
      zoom: 1,
      panX: 640,
      panY: 340,
      background: '',
      weatherOverlay: 'none',
      weatherIntensity: 1
    },
    fog: {
      enabled: false,
      showMask: true,
      revealMode: 'manual',
      visionRadius: 3,
      revealed: {}
    },
    sceneRules: {
      rollMode: 'auto',
      defaultActionType: 'ranged'
    },
    layers: {
      terrain: {},
      objects: {},
      hazards: {},
      elevation: {},
      lighting: {},
      weather: {},
      interactives: {},
      spawns: {}
    },
    codexBestiary: flattenCodexBestiary(),
    tokens: seedFromCurrentCombat(),
    initiative: [],
    actionHistory: ['Combat mode initialized.'],
    panelPos: {
      tools: { x: 14, y: 58 },
      feed: { x: 980, y: 58 },
      actions: { x: 290, y: 560 }
    },
    mouse: { panning: false, lastX: 0, lastY: 0 }
  }, persisted || {}));

  function ensureInitiative(state) {
    if (!Array.isArray(state.initiative) || !state.initiative.length) {
      state.initiative = state.tokens.map(function (token, idx) {
        return { tokenId: token.id, name: token.name, init: Math.max(1, 20 - idx) };
      }).sort(function (a, b) { return Number(b.init || 0) - Number(a.init || 0); });
    }
    return state;
  }

  function addHistory(line) {
    store.setState(function (state) {
      var next = Object.assign({}, state);
      next.actionHistory = [String(line)].concat((state.actionHistory || [])).slice(0, 80);
      persist(next);
      return next;
    });
  }

  function byId(id) {
    var state = store.getState();
    return (state.tokens || []).find(function (t) { return t && String(t.id) === String(id); }) || null;
  }

  function nearestTokenAt(q, r) {
    var state = store.getState();
    var list = state.tokens || [];
    for (var i = 0; i < list.length; i++) {
      var token = list[i];
      if (Number(token.q) === Number(q) && Number(token.r) === Number(r)) return token;
    }
    return null;
  }

  function isBlocked(q, r) {
    var state = store.getState();
    var key = toKey(q, r);
    var terrain = state.layers && state.layers.terrain && state.layers.terrain[key] || '';
    var object = state.layers && state.layers.objects && state.layers.objects[key] || '';
    if (String(object) === 'obstacle') return true;
    if (String(terrain) === 'lava') return true;
    return false;
  }

  function paintAt(q, r) {
    store.setState(function (state) {
      var layer = String(state.activeLayer || 'terrain');
      var tool = String(state.activeTool || 'select');
      if (!state.layers[layer]) return state;
      var next = Object.assign({}, state);
      next.layers = Object.assign({}, state.layers);
      next.layers[layer] = Object.assign({}, state.layers[layer]);
      var key = toKey(q, r);
      if (tool === 'erase') {
        delete next.layers[layer][key];
        addHistory('Cleared ' + layer + ' at ' + key + '.');
      } else if (tool === 'paint') {
        if (layer === 'elevation') {
          next.layers[layer][key] = Number(state.paintValue || 1);
        } else {
          next.layers[layer][key] = String(state.paintValue || 'forest');
        }
      }
      persist(next);
      return next;
    });
  }

  function applyFogAt(q, r, brush) {
    store.setState(function (state) {
      if (!state.fog) return state;
      var next = Object.assign({}, state);
      next.fog = Object.assign({}, state.fog);
      next.fog.revealed = Object.assign({}, state.fog.revealed || {});
      var key = toKey(q, r);
      if (String(brush || state.fogBrush) === 'hide') {
        delete next.fog.revealed[key];
      } else {
        next.fog.revealed[key] = true;
      }
      persist(next);
      return next;
    });
  }

  function resolveActionForSelectedToken() {
    var state = store.getState();
    var actor = byId(state.selectedTokenId);
    if (!actor) {
      safeNotif('Select a token first.', 'warn');
      return;
    }
    var actionType = String(state.sceneRules && state.sceneRules.defaultActionType || 'ranged');
    var base = state.autoRoll ? (Math.floor(Math.random() * 20) + 1) : Number(window.prompt('Manual action roll total (1-20):', '10') || 10);
    base = Math.max(1, Math.min(20, Number(base || 10)));

    var foes = (state.tokens || []).filter(function (token) {
      return token && String(token.id) !== String(actor.id) && String(token.faction) !== String(actor.faction);
    });
    var target = foes.length ? foes[0] : null;
    var range = target ? hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r }) : 0;

    var actorElev = Number(state.layers.elevation[toKey(actor.q, actor.r)] || 0);
    var targetElev = target ? Number(state.layers.elevation[toKey(target.q, target.r)] || 0) : 0;
    var elevationMod = 0;
    if (target) {
      if (actorElev > targetElev) elevationMod = 1;
      else if (actorElev < targetElev) elevationMod = -1;
    }

    var weatherMod = getWeatherModifier(state, actionType === 'melee' ? 'melee' : 'ranged');
    var terrainMod = 0;
    var terrain = String(state.layers.terrain[toKey(actor.q, actor.r)] || '');
    if (terrain === 'difficult terrain') terrainMod = -1;
    if (terrain === 'water' && actionType === 'melee') terrainMod -= 1;
    var total = base + elevationMod + weatherMod + terrainMod;

    var summary = (actor.name || 'Token')
      + ' action [' + actionType + ']'
      + ' base ' + base
      + ' + elevation ' + elevationMod
      + ' + weather ' + weatherMod
      + ' + terrain ' + terrainMod
      + ' = ' + total;
    addHistory(summary);
    if (target) {
      var cin = hexLabel(range);
      addHistory((actor.name || 'Token') + ' targets ' + (target.name || 'Target') + ' at ' + range + ' hexes (' + cin + ').');
    }
    updateUiPanels();
  }

  function resolveSharedSceneModifiers(actionKey, options) {
    var state = store.getState();
    var opts = options && typeof options === 'object' ? options : {};
    var action = String(actionKey || 'strike').toLowerCase();
    var actor = opts.actorTokenId ? byId(opts.actorTokenId) : null;
    if (!actor) {
      actor = byId(state.selectedTokenId)
        || (state.tokens || []).find(function (token) { return token && token.isPlayer; })
        || (state.tokens || []).find(function (token) { return token && String(token.faction) === 'player'; })
        || null;
    }
    if (!actor) {
      return { total: 0, elevation: 0, weather: 0, terrain: 0, summary: '', range: 0, cinematic: 'Engaged' };
    }

    var target = null;
    var targetId = opts.targetTokenId || '';
    if (targetId) target = byId(targetId);
    if (!target) {
      var foes = (state.tokens || []).filter(function (token) {
        return token && String(token.id) !== String(actor.id) && String(token.faction) !== String(actor.faction);
      });
      foes.sort(function (a, b) {
        return hexDistance({ q: actor.q, r: actor.r }, { q: a.q, r: a.r }) - hexDistance({ q: actor.q, r: actor.r }, { q: b.q, r: b.r });
      });
      target = foes[0] || null;
    }

    var actorElev = Number(state.layers.elevation[toKey(actor.q, actor.r)] || 0);
    var targetElev = target ? Number(state.layers.elevation[toKey(target.q, target.r)] || 0) : actorElev;
    var elevationMod = 0;
    if (target) {
      if (actorElev > targetElev) elevationMod = 1;
      else if (actorElev < targetElev) elevationMod = -1;
    }

    var weatherMode = 'movement';
    if (action === 'shoot' || action === 'ranged') weatherMode = 'ranged';
    else if (action === 'strike' || action === 'melee') weatherMode = 'melee';
    var weatherMod = getWeatherModifier(state, weatherMode);

    var terrainMod = 0;
    var terrain = String(state.layers.terrain[toKey(actor.q, actor.r)] || '');
    if (terrain === 'difficult terrain') terrainMod -= 1;
    if (terrain === 'water' && (action === 'strike' || action === 'melee' || action === 'defend')) terrainMod -= 1;
    if (terrain === 'lava' && action === 'defend') terrainMod -= 1;

    var range = target ? hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r }) : 0;
    var total = elevationMod + weatherMod + terrainMod;
    var summary = 'Scene mods: elevation ' + elevationMod + ', weather ' + weatherMod + ', terrain ' + terrainMod + ' => ' + total;
    return {
      total: total,
      elevation: elevationMod,
      weather: weatherMod,
      terrain: terrainMod,
      range: range,
      cinematic: hexLabel(range),
      targetName: target ? String(target.name || 'Target') : '',
      actorName: String(actor.name || 'Actor'),
      summary: summary
    };
  }

  function spawnBestiaryToken(profile, q, r) {
    if (!profile) return;
    store.setState(function (state) {
      var next = Object.assign({}, state);
      var token = {
        id: uid('bst'),
        name: String(profile.name || 'Beast'),
        faction: 'monster',
        hp: Math.max(1, Number(profile.hp || 8)),
        maxHp: Math.max(1, Number(profile.hp || 8)),
        status: [],
        q: Number(q || 0),
        r: Number(r || 0),
        image: String(profile.image || ''),
        size: Number(profile.size || 1),
        codexRegion: String(profile.region || 'province'),
        codexDread: Math.max(4, Number(profile.dread || 4))
      };
      next.tokens = (state.tokens || []).concat([token]);
      next.selectedTokenId = token.id;
      next.initiative = [];
      persist(next);
      return next;
    });
    addHistory('Spawned ' + String(profile.name || 'Beast') + ' from Codex bestiary preset.');
    drawBoard();
    updateUiPanels();
  }

  function moveToken(tokenId, q, r) {
    if (isBlocked(q, r)) {
      addHistory('Movement blocked by terrain collision at ' + toKey(q, r) + '.');
      return;
    }
    store.setState(function (state) {
      var next = Object.assign({}, state);
      next.tokens = (state.tokens || []).map(function (token) {
        if (!token || String(token.id) !== String(tokenId)) return token;
        return Object.assign({}, token, { q: Number(q), r: Number(r) });
      });
      next.ruler = Object.assign({}, state.ruler, { active: false });
      persist(next);
      return next;
    });
    var token = byId(tokenId);
    if (token) addHistory(String(token.name || 'Token') + ' moved to ' + toKey(q, r) + '.');
  }

  function ensureOverlayDom() {
    var existing = document.getElementById('combatModeOverlay');
    if (existing) return existing;
    var root = document.createElement('section');
    root.id = 'combatModeOverlay';
    root.className = 'combat-mode-overlay';
    root.innerHTML = ''
      + '<div class="combat-entry-splash" id="combatEntrySplash">'
      + '<div class="combat-entry-card">'
      + '<div class="combat-entry-title">Entering Encounter...</div>'
      + '<div class="combat-entry-mode">COMBAT MODE</div>'
      + '</div>'
      + '</div>'
      + '<div class="combat-topbar">'
      + '<div>'
      + '<div class="combat-topbar-title">Combat Scene Editor</div>'
      + '<div class="combat-mini" id="combatTopMeta">Hex Battlefield Active</div>'
      + '</div>'
      + '<div style="display:flex;gap:.28rem;align-items:center;">'
      + '<button class="btn btn-xs" id="combatUploadMapBtn">Upload Battlemap</button>'
      + '<button class="btn btn-xs" id="combatAddTokenBtn">+ Token</button>'
      + '<button class="btn btn-xs btn-red" id="combatCloseBtn">Exit Combat Mode</button>'
      + '</div>'
      + '</div>'
      + '<input id="combatMapImageInput" type="file" accept="image/*" style="display:none;">'
      + '<input id="combatTokenImageInput" type="file" accept="image/*" style="display:none;">'
      + '<div class="combat-canvas-wrap"><canvas id="combatSceneCanvas"></canvas></div>'
      + '<aside class="combat-floating-panel combat-left-tools" id="combatToolsPanel">'
      + '<div class="combat-panel-header" data-drag="tools">Terrain Tools</div>'
      + '<div class="combat-panel-body">'
      + '<div class="combat-label">Layer</div>'
      + '<div class="combat-chip-row" id="combatLayerRow"></div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Tool</div>'
      + '<div class="combat-chip-row" id="combatToolRow"></div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Fog of War</div>'
      + '<div class="combat-chip-row"><button class="combat-chip" id="combatFogToggleBtn">Fog Off</button><button class="combat-chip" id="combatFogBrushBtn">Brush Reveal</button><button class="combat-chip" id="combatFogClearBtn">Clear Fog</button></div>'
      + '<div class="combat-mini" id="combatFogMeta">Revealed 0 hexes · Vision 3</div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Terrain / Object</div>'
      + '<select class="combat-select" id="combatPaintValue">'
      + '<option value="forest">forest</option><option value="marsh">marsh</option><option value="crags">crags</option><option value="lava">lava</option><option value="ruins">ruins</option><option value="water">water</option><option value="difficult terrain">difficult terrain</option><option value="obstacle">obstacle</option><option value="trap">trap</option><option value="shrine">shrine</option><option value="turret">turret</option><option value="door">door</option><option value="spawn">spawn</option><option value="1">elevation +1</option><option value="2">elevation +2</option><option value="3">elevation +3</option>'
      + '</select>'
      + '<div class="combat-mini">Hex editing modes: terrain, objects, hazards, lighting, weather, interactives, spawn points.</div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Bestiary Drawer</div>'
      + '<div class="combat-feed" id="combatBestiaryDrawer"></div>'
      + '</div>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-right-rail" id="combatFeedPanel">'
      + '<div class="combat-panel-header" data-drag="feed">Initiative + Action Feed</div>'
      + '<div class="combat-panel-body">'
      + '<div id="combatInitiativeList"></div>'
      + '<div style="display:flex;gap:.24rem;margin-top:.26rem;"><button class="btn btn-xs" id="combatNextTurnBtn">Next Turn</button><button class="btn btn-xs" id="combatRollModeBtn">Auto Roll</button></div>'
      + '<div class="combat-feed" id="combatFeedLog"></div>'
      + '</div>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-bottom-actions" id="combatActionsPanel">'
      + '<div class="combat-panel-header" data-drag="actions">Action Panel + Distance Translator</div>'
      + '<div class="combat-panel-body">'
      + '<div id="combatSelectedSummary" class="combat-mini">Select a token.</div>'
      + '<div style="display:grid;grid-template-columns:1fr auto auto;gap:.24rem;align-items:end;margin-top:.2rem;">'
      + '<div><div class="combat-label">HP</div><input class="combat-input" id="combatSelectedHp" type="number" min="0"></div>'
      + '<div><div class="combat-label">Elevation</div><input class="combat-input" id="combatSelectedElevation" type="number" min="0" max="9"></div>'
      + '<button class="btn btn-xs" id="combatSaveTokenBtn">Save</button>'
      + '<button class="btn btn-xs" id="combatUploadTokenBtn">Portrait</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:.24rem;align-items:end;margin-top:.28rem;">'
      + '<div><div class="combat-label">Weather</div><select class="combat-select" id="combatWeatherSelect"><option value="none">none</option><option value="rain">rain</option><option value="storm">storm</option><option value="fog">fog</option><option value="ash">ash</option></select></div>'
      + '<div><div class="combat-label">Intensity</div><input class="combat-input" id="combatWeatherIntensity" type="number" min="0" max="5"></div>'
      + '<button class="btn btn-xs" id="combatApplyWeatherBtn">Apply Weather</button>'
      + '</div>'
      + '<div style="margin-top:.28rem;border:1px solid rgba(73,201,187,.35);padding:.28rem;background:rgba(73,201,187,.08);">'
      + '<div class="combat-label">Cinematic Distance</div>'
      + '<div id="combatRulerSummary" style="font-size:.84rem;color:var(--combat-accent-2);">Engaged</div>'
      + '</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-top:.28rem;">'
      + '<button class="btn btn-xs btn-teal" id="combatActivateCellBtn">Activate Mechanism</button>'
      + '<button class="btn btn-xs" id="combatResolveActionBtn">Resolve Action</button>'
      + '<button class="btn btn-xs" id="combatZoomInBtn">Zoom +</button>'
      + '<button class="btn btn-xs" id="combatZoomOutBtn">Zoom -</button>'
      + '</div>'
      + '</div>'
      + '</aside>';
    document.body.appendChild(root);
    return root;
  }

  function drawHex(ctx, x, y, size) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 180 * (60 * i - 30);
      var px = x + size * Math.cos(angle);
      var py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function colorForTerrain(name) {
    var n = String(name || '');
    var map = {
      forest: 'rgba(70,120,78,.35)',
      marsh: 'rgba(73,128,114,.35)',
      crags: 'rgba(122,122,132,.38)',
      lava: 'rgba(186,69,43,.46)',
      ruins: 'rgba(126,108,86,.35)',
      water: 'rgba(59,107,166,.38)',
      'difficult terrain': 'rgba(169,134,74,.35)'
    };
    return map[n] || 'rgba(255,255,255,.02)';
  }

  function drawBoard() {
    var canvas = document.getElementById('combatSceneCanvas');
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    var state = ensureInitiative(store.getState());
    var board = state.board;

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (board.background) {
      var image = new Image();
      image.onload = function () {
        ctx.globalAlpha = 0.34;
        ctx.drawImage(image, 0, 0, rect.width, rect.height);
        ctx.globalAlpha = 1;
        drawGridAndTokens(ctx, state, rect.width, rect.height);
      };
      image.src = board.background;
      drawGridAndTokens(ctx, state, rect.width, rect.height);
      return;
    }
    drawGridAndTokens(ctx, state, rect.width, rect.height);
  }

  function drawGridAndTokens(ctx, state, w, h) {
    var board = state.board;
    var size = Number(board.size || 42) * Number(board.zoom || 1);
    for (var r = -board.rows; r <= board.rows; r++) {
      for (var q = -board.cols; q <= board.cols; q++) {
        var p = axialToPixel(q, r, size, board.panX, board.panY);
        if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80) continue;

        var key = toKey(q, r);
        var terrain = state.layers.terrain[key] || '';
        var object = state.layers.objects[key] || '';
        var hazard = state.layers.hazards[key] || '';
        var elevation = Number(state.layers.elevation[key] || 0);

        drawHex(ctx, p.x, p.y, size - 1.6);
        ctx.fillStyle = colorForTerrain(terrain);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,.1)';
        ctx.stroke();

        if (object) {
          ctx.fillStyle = 'rgba(208,83,83,.82)';
          ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
        }
        if (hazard) {
          ctx.fillStyle = 'rgba(227,188,94,.92)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (elevation > 0) {
          ctx.fillStyle = 'rgba(201,162,39,.95)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+' + elevation, p.x, p.y + 4);
        }

        if (state.fog && state.fog.enabled && state.fog.showMask && !isHexRevealed(state, q, r)) {
          drawHex(ctx, p.x, p.y, size - 1.6);
          ctx.fillStyle = 'rgba(2,3,7,.74)';
          ctx.fill();
        }
      }
    }

    (state.tokens || []).forEach(function (token) {
      var p = axialToPixel(Number(token.q || 0), Number(token.r || 0), size, board.panX, board.panY);
      var radius = Math.max(14, (size * 0.32) * Math.max(1, Number(token.size || 1)));
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = String(token.faction) === 'monster' ? 'rgba(160,58,58,.92)' : 'rgba(47,154,144,.92)';
      ctx.fill();
      if (token.image) {
        var img = new Image();
        img.onload = function () {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius - 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, p.x - radius, p.y - radius, radius * 2, radius * 2);
          ctx.restore();
        };
        img.src = token.image;
      }
      if (String(state.selectedTokenId) === String(token.id)) {
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = 'rgba(227,188,94,.95)';
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(token.name || 'Token'), p.x, p.y - radius - 8);
      ctx.fillStyle = 'rgba(230,230,230,.95)';
      ctx.fillText('HP ' + Number(token.hp || 0) + '/' + Number(token.maxHp || token.hp || 0), p.x, p.y + radius + 12);
      ctx.restore();
    });

    if (state.ruler && state.ruler.active && state.ruler.start && state.ruler.end) {
      var s = axialToPixel(state.ruler.start.q, state.ruler.start.r, size, board.panX, board.panY);
      var e = axialToPixel(state.ruler.end.q, state.ruler.end.r, size, board.panX, board.panY);
      ctx.strokeStyle = 'rgba(73,201,187,.95)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(73,201,187,.96)';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.fillText(String(state.ruler.distance) + ' hexes · ' + state.ruler.label, (s.x + e.x) / 2, (s.y + e.y) / 2 - 8);
    }
  }

  function setPanelPositions() {
    var state = store.getState();
    var tools = document.getElementById('combatToolsPanel');
    var feed = document.getElementById('combatFeedPanel');
    var actions = document.getElementById('combatActionsPanel');
    if (tools) { tools.style.left = state.panelPos.tools.x + 'px'; tools.style.top = state.panelPos.tools.y + 'px'; }
    if (feed) { feed.style.left = state.panelPos.feed.x + 'px'; feed.style.top = state.panelPos.feed.y + 'px'; }
    if (actions) { actions.style.left = state.panelPos.actions.x + 'px'; actions.style.top = state.panelPos.actions.y + 'px'; actions.style.transform = 'none'; }
  }

  function updateUiPanels() {
    var state = ensureInitiative(store.getState());

    var layers = ['terrain', 'objects', 'hazards', 'elevation', 'lighting', 'weather', 'interactives', 'spawns'];
    var tools = ['select', 'paint', 'erase', 'fog', 'ruler', 'pan'];

    var layerRow = document.getElementById('combatLayerRow');
    if (layerRow) {
      layerRow.innerHTML = layers.map(function (layer) {
        var on = state.activeLayer === layer ? 'on' : '';
        return '<button class="combat-chip ' + on + '" data-layer="' + layer + '">' + layer + '</button>';
      }).join('');
      Array.prototype.slice.call(layerRow.querySelectorAll('[data-layer]')).forEach(function (btn) {
        btn.onclick = function () { store.setState({ activeLayer: String(btn.getAttribute('data-layer') || 'terrain') }); drawBoard(); updateUiPanels(); };
      });
    }

    var toolRow = document.getElementById('combatToolRow');
    if (toolRow) {
      toolRow.innerHTML = tools.map(function (tool) {
        var on = state.activeTool === tool ? 'on' : '';
        return '<button class="combat-chip ' + on + '" data-tool="' + tool + '">' + tool + '</button>';
      }).join('');
      Array.prototype.slice.call(toolRow.querySelectorAll('[data-tool]')).forEach(function (btn) {
        btn.onclick = function () { store.setState({ activeTool: String(btn.getAttribute('data-tool') || 'select') }); updateUiPanels(); };
      });
    }

    var paintSel = document.getElementById('combatPaintValue');
    if (paintSel) {
      paintSel.value = String(state.paintValue || 'forest');
      paintSel.onchange = function () { store.setState({ paintValue: String(paintSel.value || 'forest') }); };
    }

    var fogMeta = document.getElementById('combatFogMeta');
    if (fogMeta) {
      var revealedCount = Object.keys(state.fog && state.fog.revealed || {}).length;
      fogMeta.textContent = 'Revealed ' + revealedCount + ' hexes · Vision ' + Number(state.fog && state.fog.visionRadius || 0);
    }

    var fogToggleBtn = document.getElementById('combatFogToggleBtn');
    if (fogToggleBtn) {
      fogToggleBtn.textContent = state.fog && state.fog.enabled ? 'Fog On' : 'Fog Off';
      fogToggleBtn.className = 'combat-chip ' + (state.fog && state.fog.enabled ? 'on' : '');
    }
    var fogBrushBtn = document.getElementById('combatFogBrushBtn');
    if (fogBrushBtn) {
      fogBrushBtn.textContent = 'Brush ' + (state.fogBrush === 'hide' ? 'Hide' : 'Reveal');
      fogBrushBtn.className = 'combat-chip on';
    }

    var bestiary = document.getElementById('combatBestiaryDrawer');
    if (bestiary) {
      var cards = (state.codexBestiary || []).slice(0, 36).map(function (entry) {
        var shortDesc = String(entry.desc || '').slice(0, 86);
        return '<div class="combat-feed-line" draggable="true" data-bestiary-id="' + String(entry.id) + '">'
          + '<strong>' + String(entry.name) + '</strong> · DD' + Number(entry.dread || 4) + ' · HP ' + Number(entry.hp || 8)
          + '<div class="combat-mini">' + shortDesc + '</div>'
          + '<button class="btn btn-xs" data-spawn-id="' + String(entry.id) + '">Spawn</button>'
          + '</div>';
      }).join('');
      bestiary.innerHTML = cards || '<div class="combat-mini">No codex bestiary entries found.</div>';
      Array.prototype.slice.call(bestiary.querySelectorAll('[data-spawn-id]')).forEach(function (btn) {
        btn.onclick = function () {
          var id = String(btn.getAttribute('data-spawn-id') || '');
          var profile = (state.codexBestiary || []).find(function (entry) { return String(entry.id) === id; }) || null;
          if (!profile) return;
          var actor = byId(state.selectedTokenId);
          var q = actor ? Number(actor.q || 0) + 2 : 2;
          var r = actor ? Number(actor.r || 0) : 0;
          spawnBestiaryToken(profile, q, r);
        };
      });
      Array.prototype.slice.call(bestiary.querySelectorAll('[data-bestiary-id]')).forEach(function (card) {
        card.ondragstart = function (ev) {
          var id = String(card.getAttribute('data-bestiary-id') || '');
          ev.dataTransfer.setData('text/combat-bestiary-id', id);
        };
      });
    }

    var initList = document.getElementById('combatInitiativeList');
    if (initList) {
      initList.innerHTML = (state.initiative || []).map(function (entry, idx) {
        var active = idx === Number(state.initiativeIndex || 0) ? ' style="color:var(--combat-accent-2);"' : '';
        return '<div class="combat-feed-line"' + active + '>' + String(entry.name || 'Combatant') + ' · Init ' + Number(entry.init || 0) + '</div>';
      }).join('');
    }

    var log = document.getElementById('combatFeedLog');
    if (log) {
      log.innerHTML = (state.actionHistory || []).slice(0, 24).map(function (line) {
        return '<div class="combat-feed-line">' + String(line) + '</div>';
      }).join('');
    }

    var selected = byId(state.selectedTokenId);
    var selectedSummary = document.getElementById('combatSelectedSummary');
    var selectedHp = document.getElementById('combatSelectedHp');
    var selectedElevation = document.getElementById('combatSelectedElevation');
    if (selectedSummary) {
      selectedSummary.textContent = selected
        ? (selected.name + ' · ' + selected.faction + ' · hex ' + toKey(selected.q, selected.r))
        : 'Select a token.';
    }
    if (selectedHp) {
      selectedHp.value = selected ? Number(selected.hp || 0) : '';
    }
    if (selectedElevation) {
      selectedElevation.value = selected ? Number(state.layers.elevation[toKey(selected.q, selected.r)] || 0) : 0;
    }

    var weatherSelect = document.getElementById('combatWeatherSelect');
    var weatherIntensity = document.getElementById('combatWeatherIntensity');
    if (weatherSelect) weatherSelect.value = String(state.board.weatherOverlay || 'none');
    if (weatherIntensity) weatherIntensity.value = Number(state.board.weatherIntensity || 0);

    var ruler = document.getElementById('combatRulerSummary');
    if (ruler) {
      ruler.textContent = state.ruler && state.ruler.distance
        ? (state.ruler.distance + ' Hexes · ' + state.ruler.label)
        : 'Engaged';
    }

    var rollBtn = document.getElementById('combatRollModeBtn');
    if (rollBtn) rollBtn.textContent = state.autoRoll ? 'Auto Roll' : 'Manual Roll';

    var topMeta = document.getElementById('combatTopMeta');
    if (topMeta) {
      topMeta.textContent = 'Tokens ' + (state.tokens || []).length + ' · Hexes ' + (state.board.cols * 2) + 'x' + (state.board.rows * 2);
    }
  }

  function bindCanvas() {
    var canvas = document.getElementById('combatSceneCanvas');
    if (!canvas || canvas._boundCombatEditor) return;
    canvas._boundCombatEditor = true;

    canvas.addEventListener('mousedown', function (ev) {
      var state = store.getState();
      var rect = canvas.getBoundingClientRect();
      var board = state.board;
      var size = Number(board.size || 42) * Number(board.zoom || 1);
      var ax = pixelToAxial(ev.clientX - rect.left, ev.clientY - rect.top, size, board.panX, board.panY);
      var clickedToken = nearestTokenAt(ax.q, ax.r);

      if (state.activeTool === 'pan' || ev.button === 1) {
        store.setState({ mouse: { panning: true, lastX: ev.clientX, lastY: ev.clientY } });
        return;
      }

      if (clickedToken && state.activeTool !== 'paint' && state.activeTool !== 'erase') {
        store.setState({ selectedTokenId: clickedToken.id, draggingTokenId: clickedToken.id });
        updateUiPanels();
        drawBoard();
        return;
      }

      if (state.activeTool === 'paint' || state.activeTool === 'erase') {
        paintAt(ax.q, ax.r);
        drawBoard();
        updateUiPanels();
        return;
      }

      if (state.activeTool === 'fog') {
        applyFogAt(ax.q, ax.r, state.fogBrush);
        drawBoard();
        updateUiPanels();
        return;
      }

      if (state.activeTool === 'ruler') {
        var selected = byId(state.selectedTokenId);
        var start = selected ? { q: Number(selected.q), r: Number(selected.r) } : { q: ax.q, r: ax.r };
        var dist = Math.max(Math.abs(start.q - ax.q), Math.abs(start.r - ax.r));
        store.setState({ ruler: { active: true, start: start, end: { q: ax.q, r: ax.r }, distance: dist, label: hexLabel(dist) } });
        drawBoard();
        updateUiPanels();
      }
    });

    canvas.addEventListener('mousemove', function (ev) {
      var state = store.getState();
      if (state.mouse && state.mouse.panning) {
        var dx = ev.clientX - Number(state.mouse.lastX || 0);
        var dy = ev.clientY - Number(state.mouse.lastY || 0);
        store.setState(function (prev) {
          var next = Object.assign({}, prev);
          next.mouse = { panning: true, lastX: ev.clientX, lastY: ev.clientY };
          next.board = Object.assign({}, prev.board, { panX: Number(prev.board.panX || 0) + dx, panY: Number(prev.board.panY || 0) + dy });
          persist(next);
          return next;
        });
        drawBoard();
        return;
      }

      if (state.draggingTokenId) {
        var rect = canvas.getBoundingClientRect();
        var board = state.board;
        var size = Number(board.size || 42) * Number(board.zoom || 1);
        var ax = pixelToAxial(ev.clientX - rect.left, ev.clientY - rect.top, size, board.panX, board.panY);
        moveToken(state.draggingTokenId, ax.q, ax.r);
        drawBoard();
        updateUiPanels();
        return;
      }

      if (state.activeTool === 'ruler' && state.ruler && state.ruler.active) {
        var rect2 = canvas.getBoundingClientRect();
        var board2 = state.board;
        var size2 = Number(board2.size || 42) * Number(board2.zoom || 1);
        var ax2 = pixelToAxial(ev.clientX - rect2.left, ev.clientY - rect2.top, size2, board2.panX, board2.panY);
        var start = state.ruler.start || { q: 0, r: 0 };
        var dist2 = Math.max(Math.abs(start.q - ax2.q), Math.abs(start.r - ax2.r));
        store.setState({ ruler: { active: true, start: start, end: { q: ax2.q, r: ax2.r }, distance: dist2, label: hexLabel(dist2) } });
        drawBoard();
        updateUiPanels();
      }
    });

    function stopDrag() {
      var state = store.getState();
      if (state.mouse && state.mouse.panning) {
        store.setState({ mouse: { panning: false, lastX: 0, lastY: 0 } });
      }
      if (state.draggingTokenId) {
        store.setState({ draggingTokenId: '' });
      }
    }

    canvas.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('mouseleave', stopDrag);

    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      store.setState(function (state) {
        var nextZoom = Number(state.board.zoom || 1) + (ev.deltaY < 0 ? 0.06 : -0.06);
        nextZoom = Math.max(0.5, Math.min(2.3, nextZoom));
        var next = Object.assign({}, state);
        next.board = Object.assign({}, state.board, { zoom: nextZoom });
        persist(next);
        return next;
      });
      drawBoard();
      updateUiPanels();
    }, { passive: false });

    canvas.addEventListener('dragover', function (ev) {
      ev.preventDefault();
    });

    canvas.addEventListener('drop', function (ev) {
      ev.preventDefault();
      var id = String(ev.dataTransfer.getData('text/combat-bestiary-id') || '');
      if (!id) return;
      var state = store.getState();
      var profile = (state.codexBestiary || []).find(function (entry) { return String(entry.id) === id; }) || null;
      if (!profile) return;
      var rect = canvas.getBoundingClientRect();
      var size = Number(state.board.size || 42) * Number(state.board.zoom || 1);
      var ax = pixelToAxial(ev.clientX - rect.left, ev.clientY - rect.top, size, state.board.panX, state.board.panY);
      spawnBestiaryToken(profile, ax.q, ax.r);
    });
  }

  function bindDragPanels() {
    var root = document.getElementById('combatModeOverlay');
    if (!root || root._dragBound) return;
    root._dragBound = true;
    var dragging = null;

    root.addEventListener('mousedown', function (ev) {
      var handle = ev.target && ev.target.closest && ev.target.closest('[data-drag]');
      if (!handle) return;
      var key = String(handle.getAttribute('data-drag') || 'tools');
      var panel = handle.parentElement;
      if (!panel) return;
      var rect = panel.getBoundingClientRect();
      dragging = { key: key, dx: ev.clientX - rect.left, dy: ev.clientY - rect.top };
      ev.preventDefault();
    });

    window.addEventListener('mousemove', function (ev) {
      if (!dragging) return;
      var x = Math.max(0, ev.clientX - dragging.dx);
      var y = Math.max(0, ev.clientY - dragging.dy);
      store.setState(function (state) {
        var next = Object.assign({}, state);
        next.panelPos = Object.assign({}, state.panelPos);
        next.panelPos[dragging.key] = { x: x, y: y };
        persist(next);
        return next;
      });
      setPanelPositions();
    });

    window.addEventListener('mouseup', function () { dragging = null; });
  }

  function bindStaticControls() {
    var closeBtn = document.getElementById('combatCloseBtn');
    if (closeBtn && !closeBtn._bound) {
      closeBtn._bound = true;
      closeBtn.onclick = function () { closeOverlay(); };
    }

    var nextTurn = document.getElementById('combatNextTurnBtn');
    if (nextTurn && !nextTurn._bound) {
      nextTurn._bound = true;
      nextTurn.onclick = function () {
        store.setState(function (state) {
          var size = Math.max(1, (state.initiative || []).length);
          var idx = (Number(state.initiativeIndex || 0) + 1) % size;
          var next = Object.assign({}, state, { initiativeIndex: idx });
          persist(next);
          return next;
        });
        var st = store.getState();
        var active = st.initiative[st.initiativeIndex] || null;
        if (active) addHistory('Turn: ' + active.name + '.');
        updateUiPanels();
      };
    }

    var rollMode = document.getElementById('combatRollModeBtn');
    if (rollMode && !rollMode._bound) {
      rollMode._bound = true;
      rollMode.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state, { autoRoll: !state.autoRoll });
          persist(next);
          return next;
        });
        updateUiPanels();
      };
    }

    var saveToken = document.getElementById('combatSaveTokenBtn');
    if (saveToken && !saveToken._bound) {
      saveToken._bound = true;
      saveToken.onclick = function () {
        var hpInput = document.getElementById('combatSelectedHp');
        var elevationInput = document.getElementById('combatSelectedElevation');
        var hp = Math.max(0, Number(hpInput && hpInput.value || 0));
        var elevation = Math.max(0, Number(elevationInput && elevationInput.value || 0));
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.tokens = (state.tokens || []).map(function (token) {
            if (!token || String(token.id) !== String(state.selectedTokenId || '')) return token;
            return Object.assign({}, token, { hp: hp, maxHp: Math.max(hp, Number(token.maxHp || hp)) });
          });
          var selected = byId(state.selectedTokenId);
          if (selected) {
            next.layers = Object.assign({}, state.layers);
            next.layers.elevation = Object.assign({}, state.layers.elevation);
            next.layers.elevation[toKey(selected.q, selected.r)] = elevation;
          }
          persist(next);
          return next;
        });
        addHistory('Updated HP for selected token.');
        drawBoard();
      };
    }

    var zoomIn = document.getElementById('combatZoomInBtn');
    if (zoomIn && !zoomIn._bound) {
      zoomIn._bound = true;
      zoomIn.onclick = function () {
        store.setState(function (state) {
          var z = Math.min(2.3, Number(state.board.zoom || 1) + 0.1);
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { zoom: z });
          persist(next);
          return next;
        });
        drawBoard();
      };
    }

    var zoomOut = document.getElementById('combatZoomOutBtn');
    if (zoomOut && !zoomOut._bound) {
      zoomOut._bound = true;
      zoomOut.onclick = function () {
        store.setState(function (state) {
          var z = Math.max(0.5, Number(state.board.zoom || 1) - 0.1);
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { zoom: z });
          persist(next);
          return next;
        });
        drawBoard();
      };
    }

    var activate = document.getElementById('combatActivateCellBtn');
    if (activate && !activate._bound) {
      activate._bound = true;
      activate.onclick = function () {
        var state = store.getState();
        var token = byId(state.selectedTokenId);
        if (!token) return;
        var key = toKey(token.q, token.r);
        var interactive = state.layers.interactives && state.layers.interactives[key];
        if (interactive) addHistory((token.name || 'Token') + ' activates ' + interactive + ' at ' + key + '.');
        else addHistory('No interactive object on current hex.');
        updateUiPanels();
      };
    }

    var fogToggle = document.getElementById('combatFogToggleBtn');
    if (fogToggle && !fogToggle._bound) {
      fogToggle._bound = true;
      fogToggle.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.fog = Object.assign({}, state.fog, { enabled: !state.fog.enabled });
          persist(next);
          return next;
        });
        drawBoard();
        updateUiPanels();
      };
    }

    var fogBrush = document.getElementById('combatFogBrushBtn');
    if (fogBrush && !fogBrush._bound) {
      fogBrush._bound = true;
      fogBrush.onclick = function () {
        store.setState({ fogBrush: store.getState().fogBrush === 'hide' ? 'reveal' : 'hide' });
        updateUiPanels();
      };
    }

    var fogClear = document.getElementById('combatFogClearBtn');
    if (fogClear && !fogClear._bound) {
      fogClear._bound = true;
      fogClear.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.fog = Object.assign({}, state.fog, { revealed: {} });
          persist(next);
          return next;
        });
        addHistory('Fog reveal map cleared.');
        drawBoard();
        updateUiPanels();
      };
    }

    var applyWeather = document.getElementById('combatApplyWeatherBtn');
    if (applyWeather && !applyWeather._bound) {
      applyWeather._bound = true;
      applyWeather.onclick = function () {
        var weatherSelect = document.getElementById('combatWeatherSelect');
        var weatherIntensity = document.getElementById('combatWeatherIntensity');
        var weather = String(weatherSelect && weatherSelect.value || 'none');
        var intensity = Math.max(0, Math.min(5, Number(weatherIntensity && weatherIntensity.value || 0)));
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { weatherOverlay: weather, weatherIntensity: intensity });
          persist(next);
          return next;
        });
        addHistory('Weather set to ' + weather + ' (intensity ' + intensity + ').');
        drawBoard();
        updateUiPanels();
      };
    }

    var resolveAction = document.getElementById('combatResolveActionBtn');
    if (resolveAction && !resolveAction._bound) {
      resolveAction._bound = true;
      resolveAction.onclick = function () {
        resolveActionForSelectedToken();
      };
    }

    var uploadMapBtn = document.getElementById('combatUploadMapBtn');
    var uploadMapInput = document.getElementById('combatMapImageInput');
    if (uploadMapBtn && uploadMapInput && !uploadMapBtn._bound) {
      uploadMapBtn._bound = true;
      uploadMapBtn.onclick = function () { uploadMapInput.click(); };
      uploadMapInput.onchange = function () {
        var file = uploadMapInput.files && uploadMapInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var data = String(reader.result || '');
          store.setState(function (state) {
            var next = Object.assign({}, state);
            next.board = Object.assign({}, state.board, { background: data });
            persist(next);
            return next;
          });
          addHistory('Battlemap image applied.');
          drawBoard();
        };
        reader.readAsDataURL(file);
        uploadMapInput.value = '';
      };
    }

    var uploadTokenBtn = document.getElementById('combatUploadTokenBtn');
    var uploadTokenInput = document.getElementById('combatTokenImageInput');
    if (uploadTokenBtn && uploadTokenInput && !uploadTokenBtn._bound) {
      uploadTokenBtn._bound = true;
      uploadTokenBtn.onclick = function () { uploadTokenInput.click(); };
      uploadTokenInput.onchange = function () {
        var file = uploadTokenInput.files && uploadTokenInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var data = String(reader.result || '');
          store.setState(function (state) {
            var next = Object.assign({}, state);
            next.tokens = (state.tokens || []).map(function (token) {
              if (!token || String(token.id) !== String(state.selectedTokenId || '')) return token;
              return Object.assign({}, token, { image: data });
            });
            persist(next);
            return next;
          });
          addHistory('Token portrait updated from image upload.');
          drawBoard();
        };
        reader.readAsDataURL(file);
        uploadTokenInput.value = '';
      };
    }

    var addTokenBtn = document.getElementById('combatAddTokenBtn');
    if (addTokenBtn && !addTokenBtn._bound) {
      addTokenBtn._bound = true;
      addTokenBtn.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          var player = (state.tokens || []).find(function (token) { return token && token.isPlayer; }) || null;
          var spawnQ = player ? Number(player.q || 0) + 2 : 2;
          var spawnR = player ? Number(player.r || 0) : 0;
          var t = { id: uid('tok'), name: 'Summon', faction: 'npc', hp: 8, maxHp: 8, status: [], q: spawnQ, r: spawnR, image: '', size: 1 };
          next.tokens = (state.tokens || []).concat([t]);
          next.selectedTokenId = t.id;
          next.initiative = [];
          persist(next);
          return next;
        });
        addHistory('Summon token added to the scene.');
        updateUiPanels();
        drawBoard();
      };
    }
  }

  function openOverlay(seed) {
    var root = ensureOverlayDom();
    bindCanvas();
    bindDragPanels();
    bindStaticControls();

    if (seed && typeof seed === 'object') {
      store.setState(function (state) {
        var next = Object.assign({}, state);
        if (Array.isArray(seed.tokens) && seed.tokens.length) {
          next.tokens = seed.tokens.map(function (token, idx) {
            return Object.assign({ id: uid('seed-' + idx), faction: 'npc', hp: 8, maxHp: 8, status: [], q: idx, r: 0, size: 1, image: '' }, token || {});
          });
          next.initiative = [];
        }
        if (Array.isArray(seed.history) && seed.history.length) {
          next.actionHistory = seed.history.slice(0, 80);
        }
        if (seed.layers && typeof seed.layers === 'object') {
          next.layers = Object.assign({}, next.layers, seed.layers);
        }
        persist(next);
        return next;
      });
    }

    store.setState({ open: true, entering: true });
    root.classList.add('open');
    setPanelPositions();
    updateUiPanels();
    drawBoard();

    var splash = document.getElementById('combatEntrySplash');
    if (splash) {
      splash.classList.remove('hidden');
      setTimeout(function () {
        splash.classList.add('hidden');
        store.setState({ entering: false });
      }, 900);
    }

    addHistory('Entering encounter. Combat mode online.');
  }

  function closeOverlay() {
    var root = document.getElementById('combatModeOverlay');
    if (!root) return;
    root.classList.remove('open');
    store.setState({ open: false, entering: false, draggingTokenId: '' });
    persist(store.getState());
  }

  function expeditionSeed() {
    if (typeof window.getHoldingCrucibleMatch !== 'function') return null;
    var match = window.getHoldingCrucibleMatch();
    if (!match || !Array.isArray(match.allies) || !Array.isArray(match.enemies)) return null;

    var allies = match.allies.filter(function (u) { return u && Number(u.hp || 0) > 0; }).map(function (u, idx) {
      return {
        id: String(u.id || uid('ally')),
        name: String(u.name || ('Ally ' + (idx + 1))),
        faction: 'player',
        hp: Number(u.hp || 8),
        maxHp: Number(u.maxHp || u.hp || 8),
        status: [],
        q: Number(u.position && u.position.q || idx),
        r: Number(u.position && u.position.r || 2),
        image: '',
        size: 1,
        isPlayer: !!u.isPlayer
      };
    });

    var enemies = match.enemies.filter(function (u) { return u && Number(u.hp || 0) > 0; }).map(function (u, idx) {
      return {
        id: String(u.id || uid('enm')),
        name: String(u.name || ('Enemy ' + (idx + 1))),
        faction: 'monster',
        hp: Number(u.hp || 8),
        maxHp: Number(u.maxHp || u.hp || 8),
        status: [],
        q: Number(u.position && u.position.q || (idx + 3)),
        r: Number(u.position && u.position.r || 0),
        image: '',
        size: 1
      };
    });

    var history = Array.isArray(match.log) ? match.log.slice(-40).reverse() : [];
    return { tokens: allies.concat(enemies), history: history };
  }

  window.openCombatSceneEditor = function (seed) {
    openOverlay(seed || null);
  };

  window.closeCombatSceneEditor = function () {
    closeOverlay();
  };

  window.openCombatSceneEditorFromExpedition = function () {
    var seed = expeditionSeed();
    openOverlay(seed || null);
  };

  function wireStartCombatHook() {
    if (window.__combatSceneEditorHooked) return;
    if (typeof window.startCombat !== 'function') return;
    window.__combatSceneEditorHooked = true;
    var originalStartCombat = window.startCombat;
    window.startCombat = function () {
      var result = originalStartCombat.apply(this, arguments);
      try {
        window.openCombatSceneEditorFromExpedition();
      } catch (_err) {
        window.openCombatSceneEditor();
      }
      return result;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireStartCombatHook);
  } else {
    wireStartCombatHook();
  }

  window.CombatSceneStore = {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    addHistory: addHistory
  };

  window.getCombatSceneSharedModifier = function (actionKey, options) {
    return resolveSharedSceneModifiers(actionKey, options);
  };
})();
