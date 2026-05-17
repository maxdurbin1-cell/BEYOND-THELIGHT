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

  function togglePanel(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.toggle('collapsed');
    store.setState(function (state) {
      var collapsed = state.collapsedPanels || {};
      collapsed[panelId] = !collapsed[panelId];
      return { collapsedPanels: collapsed };
    });
  }

  // Header onclick handlers are inline in overlay markup.
  if (typeof window !== 'undefined') {
    window.togglePanel = togglePanel;
  }

  function hexLabel(distance) {
    var d = Math.max(0, Number(distance || 0));
    if (d <= 1) return 'Engaged';
    if (d === 2) return 'Close';
    if (d === 3) return 'Nearby';
    if (d === 4) return 'Far';
    return 'Out of Range';
  }

  function slug(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function stripHtml(text) {
    return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

  function makeSceneSnapshot(state) {
    return {
      board: clone(state.board || {}),
      layers: clone(state.layers || {}),
      fog: clone(state.fog || {}),
      sceneRules: clone(state.sceneRules || {}),
      tokens: clone(state.tokens || []),
      initiative: clone(state.initiative || []),
      actionHistory: clone((state.actionHistory || []).slice(0, 80))
    };
  }

  function withActiveSceneSnapshot(state) {
    if (!state || !Array.isArray(state.scenes) || !state.activeSceneId) return state;
    var sceneIdx = state.scenes.findIndex(function (scene) {
      return scene && String(scene.id) === String(state.activeSceneId);
    });
    if (sceneIdx < 0) return state;

    var nextScenes = state.scenes.slice();
    var currentScene = nextScenes[sceneIdx] || {};
    nextScenes[sceneIdx] = Object.assign({}, currentScene, makeSceneSnapshot(state), {
      id: String(currentScene.id || state.activeSceneId),
      name: String(currentScene.name || ('Scene ' + String(sceneIdx + 1))),
      updatedAt: Date.now()
    });
    return Object.assign({}, state, { scenes: nextScenes });
  }

  function persist(state) {
    var synced = withActiveSceneSnapshot(state);
    try {
      var slim = {
        board: synced.board,
        layers: synced.layers,
        fog: synced.fog,
        sceneRules: synced.sceneRules,
        tokens: synced.tokens,
        initiative: synced.initiative,
        actionHistory: synced.actionHistory,
        panelPos: synced.panelPos,
        autoRoll: synced.autoRoll,
        round: synced.round,
        initiativeIndex: synced.initiativeIndex,
        currentTurnIndex: synced.currentTurnIndex,
        collapsedPanels: synced.collapsedPanels,
        scenes: synced.scenes,
        activeSceneId: synced.activeSceneId
      };
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch (_err) {}
    if (window.S && window.S.combat) {
      window.S.combat.sceneEditor = clone(synced);
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
        var dread = Math.max(4, Number(enemy.dread || 6));
        var hpByDread = dread * 2;
        return {
          id: uid(allied ? 'ally' : 'enm'),
          name: String(enemy.name || (allied ? 'Ally' : 'Enemy ' + (idx + 1))),
          faction: allied ? 'player' : 'monster',
          hp: allied ? Number(enemy.stress || hpByDread) : hpByDread,
          maxHp: allied ? Number(enemy.stress || hpByDread) : hpByDread,
          status: [],
          q: allied ? idx : idx + 3,
          r: allied ? 2 : 0,
          image: '',
          size: 1,
          isPlayer: allied && idx === 0,
          dread: dread,
          deathNumber: dread,
          sourceEnemyId: Number(enemy.id || 0)
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
    playMode: true,
    autoRoll: true,
    initiativeIndex: 0,
    round: 1,
    currentTurnIndex: 0,
    collapsedPanels: { 'combatActionsPanel': false, 'combatEnemyLedger': true, 'combatWayfarerRulesPanel': true },
    scenes: [{ id: 'scene-1', name: 'Main Scene', isActive: true }],
    activeSceneId: 'scene-1',
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
    teamActions: {},
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

  function isCampaignModeActive() {
    try {
      if (window.campaignSystem && typeof window.campaignSystem.getState === 'function') {
        var st = window.campaignSystem.getState();
        return !!(st && st.activeMissionId);
      }
    } catch (_err) {}
    return false;
  }

  function ensureActionBudgetMap(state) {
    var next = Object.assign({}, state);
    var map = Object.assign({}, state.teamActions || {});
    if (!isCampaignModeActive()) {
      (state.tokens || []).forEach(function (token) {
        if (!token) return;
        if (String(token.faction) === 'player' || String(token.faction) === 'monster') {
          if (typeof map[token.id] !== 'number') map[token.id] = 2;
        }
      });
    }
    next.teamActions = map;
    return next;
  }

  function spendUnitAction(tokenId) {
    var state = store.getState();
    if (isCampaignModeActive()) return true;
    var available = Number(state.teamActions && state.teamActions[tokenId] || 0);
    if (available <= 0) return false;
    store.setState(function (inner) {
      var next = Object.assign({}, inner);
      next.teamActions = Object.assign({}, inner.teamActions || {});
      next.teamActions[tokenId] = Math.max(0, Number(next.teamActions[tokenId] || 0) - 1);
      persist(next);
      return next;
    });
    return true;
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
    var supportBonus = Math.max(0, Number(state.sceneRules && state.sceneRules.supportBonus || 0));
    var total = base + elevationMod + weatherMod + terrainMod + supportBonus;
    var summary = (actor.name || 'Token') + ' action [' + actionType + '] base ' + base + ' + elevation ' + elevationMod + ' + weather ' + weatherMod + ' + terrain ' + terrainMod + ' + support ' + supportBonus + ' = ' + total;
    addHistory(summary);
    if (target) {
      var cin = hexLabel(range);
      var targetDread = Math.max(4, Number(target.dread || target.codexDread || 6));
      var hit = total >= targetDread;
      if (hit) {
        var damage = Math.max(1, total - targetDread);
        var deathNumber = Math.max(1, Number(target.deathNumber || targetDread));
        var autoKill = damage >= deathNumber;
        store.setState(function (inner) {
          var next = Object.assign({}, inner);
          next.tokens = (inner.tokens || []).map(function (token) {
            if (!token || String(token.id) !== String(target.id)) return token;
            var hpNow = Math.max(0, Number(token.hp || 0));
            var hpLoss = autoKill ? hpNow : damage;
            return Object.assign({}, token, { hp: Math.max(0, hpNow - hpLoss) });
          });
          persist(next);
          return next;
        });
        addHistory((actor.name || 'Token') + ' hits ' + (target.name || 'Target') + ' at ' + range + ' hexes (' + cin + ') for ' + damage + ' damage vs DD' + targetDread + '.' + (autoKill ? (' Death Number ' + deathNumber + ' reached: instant kill.') : ''));
      } else {
        addHistory((actor.name || 'Token') + ' misses ' + (target.name || 'Target') + ' at ' + range + ' hexes (' + cin + ') vs DD' + targetDread + '.');
      }
    }
    if (supportBonus > 0) {
      store.setState(function (inner) {
        var next = Object.assign({}, inner);
        next.sceneRules = Object.assign({}, inner.sceneRules, { supportBonus: 0 });
        persist(next);
        return next;
      });
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
        dread: Math.max(4, Number(profile.dread || 6)),
        deathNumber: Math.max(4, Number(profile.dread || 6)),
        hp: Math.max(1, Math.max(4, Number(profile.dread || 6)) * 2),
        maxHp: Math.max(1, Math.max(4, Number(profile.dread || 6)) * 2),
        status: [],
        q: Number(q || 0),
        r: Number(r || 0),
        image: String(profile.image || ''),
        size: Number(profile.size || 1),
        codexRegion: String(profile.region || 'province')
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

  function consumeMovementAction(actor, distance) {
    if (!actor) return true;
    var isPlayerSide = !!actor.isPlayer || String(actor.faction || '') === 'player';
    if (!isPlayerSide) return true;
    if (!window.S || !window.S.combat) return true;
    var required = Math.max(1, Number(distance || 1));
    var available = Math.max(0, Number(window.S.combat.actionsLeft || 0));
    if (available < required) {
      safeNotif('Not enough Actions to move. Movement costs 1 Action per hex.', 'warn');
      return false;
    }
    if (typeof window.consumeCombatAction === 'function') {
      for (var i = 0; i < required; i++) {
        if (!window.consumeCombatAction('Move 1 Hex')) return false;
      }
      return true;
    }
    window.S.combat.actionsLeft = Math.max(0, available - required);
    if (typeof window.updateCombatUI === 'function') {
      try { window.updateCombatUI(); } catch (_err) {}
    }
    return true;
  }

  function moveToken(tokenId, q, r) {
    if (isBlocked(q, r)) {
      addHistory('Movement blocked by terrain collision at ' + toKey(q, r) + '.');
      return;
    }
    var state = store.getState();
    var actor = (state.tokens || []).find(function (token) { return token && String(token.id) === String(tokenId); }) || null;
    if (!actor) return;
    var distance = hexDistance({ q: Number(actor.q || 0), r: Number(actor.r || 0) }, { q: Number(q), r: Number(r) });
    if (distance <= 0) return;
    if (state.playMode && distance > 1) {
      addHistory('Movement limited to 1 hex per action in active scenes.');
      return;
    }
    if (state.playMode && !consumeMovementAction(actor, distance)) {
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
      + '<div class="combat-topbar-title">Combat Scene · Round <span id="combatRoundDisplay">1</span></div>'
      + '<div class="combat-mini" id="combatTopMeta">No active scene. | Turn: <span id="combatTurnDisplay">Awaiting start</span></div>'
      + '</div>'
      + '<div style="display:flex;gap:.28rem;align-items:center;">'
      + '<button class="btn btn-xs" id="combatPlayModeBtn">Play View</button>'
      + '<button class="btn btn-xs" id="combatAddWayfarerBtn" title="Add Wayfarer to board">+ Wayfarer</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatUploadMapBtn">Upload Battlemap</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatAddTokenBtn">+ Add Enemy</button>'
      + '<button class="btn btn-xs btn-red" id="combatCloseBtn">End Scene</button>'
      + '</div>'
      + '</div>'
      + '<input id="combatMapImageInput" type="file" accept="image/*" style="display:none;">'
      + '<input id="combatTokenImageInput" type="file" accept="image/*" style="display:none;">'
      + '<div class="combat-canvas-wrap"><canvas id="combatSceneCanvas"></canvas></div>'
      + '<aside class="combat-floating-panel combat-left-tools combat-editor-only" id="combatToolsPanel">'
      + '<div class="combat-panel-header" data-drag="tools" onclick="togglePanel(\'combatToolsPanel\')">Combat Scene <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
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
      + '<div class="combat-panel-header" data-drag="feed" onclick="togglePanel(\'combatFeedPanel\')">Roll Checks <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
      + '<div class="combat-panel-body">'
      + '<div id="combatInitiativeList"></div>'
      + '<div style="display:flex;gap:.24rem;margin-top:.26rem;"><button class="btn btn-xs" id="combatNextTurnBtn">Next Turn</button><button class="btn btn-xs" id="combatRollModeBtn">Auto Roll</button></div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Scene Opener</div>'
      + '<div id="combatSceneOpenerSummary" class="combat-mini">No opener active.</div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Roll Checks</div>'
      + '<div id="combatLegacyStatusMirror" class="combat-result-mirror">Status bridge idle.</div>'
      + '<div id="combatLegacyRollModMirror" class="combat-result-mirror">Roll modifiers: none.</div>'
      + '<div id="combatLegacyActionInfoMirror" class="combat-result-mirror">Wayfarer action details appear here.</div>'
      + '<div id="combatLegacyFlavorMirror" class="combat-result-mirror"></div>'
      + '<div class="combat-feed" id="combatLegacyRowsMirror"></div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.2rem;">'
      + '<button class="btn btn-xs" id="combatOpenUtilityPromptBtn">Use Item / Hack / Spell / Flavor</button>'
      + '<button class="btn btn-xs" id="combatOpenFlavorActionBtn">Use Personal Flavor</button>'
      + '</div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Enemy Budget Ledger</div>'
      + '<div id="combatEnemyLedgerMeta" class="combat-result-mirror">Awaiting enemy actions...</div>'
      + '<div class="combat-feed" id="combatEnemyLedgerFeed"></div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Direct Roll (Strike / Shoot)</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.22rem;margin-top:.22rem;">'
      + '<button class="btn btn-xs" id="combatCmdStrikeBtn">⚄ Roll Strike</button>'
      + '<button class="btn btn-xs" id="combatCmdShootBtn">⚄ Roll Shoot</button>'
      + '<button class="btn btn-xs" id="combatCmdDefendBtn">⚄ Roll Defend</button>'
      + '<button class="btn btn-xs" id="combatCmdTraumaBtn">⚄ Trauma Check</button>'
      + '<button class="btn btn-xs" id="combatCmdEnemyBtn">☠ Enemy Action</button>'
      + '<button class="btn btn-xs" id="combatCmdFlowBtn">Enemy Flow</button>'
      + '</div>'
      + '<div style="margin-top:.22rem;">'
      + '<div class="combat-label">⚔ Wayfarer Action</div>'
      + '<select class="combat-select" id="combatWayfarerActionSel">'
      + '<option value="">— Choose Action —</option>'
      + '</select>'
      + '<div id="combatWayfarerContext" class="combat-mini" style="margin-top:.14rem;">Actions and wording mirror Combat Tab rules.</div>'
      + '<button class="btn btn-xs" id="combatCmdWayfarerBtn" style="margin-top:.18rem;">⚄ Execute</button>'
      + '</div>'
      + '<div id="combatLegacyResultMirror" class="combat-result-mirror">Legacy combat output mirrors here.</div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">⚔ Wayfarer Action</div>'
      + '<div id="combatWayfarerRulesTable" style="margin-top:.22rem;"></div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Ally Actions</div>'
      + '<div class="combat-mini" id="combatAllyBudgetMeta">2 actions each ally/enemy (non-campaign).</div>'
      + '<select class="combat-select" id="combatAllySelect" style="margin-top:.2rem;"></select>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.22rem;margin-top:.2rem;">'
      + '<button class="btn btn-xs" id="combatAllyDefendBtn">Defend Ally</button>'
      + '<button class="btn btn-xs" id="combatAllySupportBtn">Support Ally</button>'
      + '<button class="btn btn-xs" id="combatAllyAttackBtn">Attack Enemy</button>'
      + '<button class="btn btn-xs" id="combatAllyMoveBtn">Move</button>'
      + '</div>'
      + '</div>'
      + '<div class="combat-feed" id="combatFeedLog"></div>'
      + '</div>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-bottom-actions" id="combatActionsPanel">'
      + '<div class="combat-panel-header" data-drag="actions" onclick="togglePanel(\'combatActionsPanel\')">Token Actions <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
      + '<div class="combat-panel-body">'
      + '<div id="combatSelectedSummary" class="combat-mini">Select a token.</div>'
      + '<div style="display:grid;grid-template-columns:1fr auto auto;gap:.24rem;align-items:end;margin-top:.2rem;">'
      + '<div><div class="combat-label">HP</div><input class="combat-input" id="combatSelectedHp" type="number" min="0"></div>'
      + '<div><div class="combat-label">Elevation</div><input class="combat-input" id="combatSelectedElevation" type="number" min="0" max="9"></div>'
      + '<button class="btn btn-xs" id="combatSaveTokenBtn">Save</button>'
      + '<button class="btn btn-xs" id="combatUploadTokenBtn">Portrait</button>'
      + '<button class="btn btn-xs btn-red" id="combatDeleteTokenBtn">Delete Selected</button>'
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

  var backgroundCache = { src: '', img: null };

  function drawBackground(ctx, board) {
    var src = String(board && board.background || '');
    if (!src) return;
    if (backgroundCache.src !== src || !backgroundCache.img) {
      backgroundCache.src = src;
      backgroundCache.img = new Image();
      backgroundCache.img.src = src;
    }
    var img = backgroundCache.img;
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;

    var zoom = Number(board.zoom || 1);
    var drawW = img.naturalWidth * zoom;
    var drawH = img.naturalHeight * zoom;
    var originX = Number(board.panX || 0) - drawW / 2;
    var originY = Number(board.panY || 0) - drawH / 2;

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.drawImage(img, originX, originY, drawW, drawH);
    ctx.restore();
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

    drawBackground(ctx, board);
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
    var state = ensureActionBudgetMap(ensureInitiative(store.getState()));
    var root = document.getElementById('combatModeOverlay');
    if (root) {
      if (state.playMode) root.classList.add('play-mode');
      else root.classList.remove('play-mode');
    }

    ['combatToolsPanel', 'combatFeedPanel', 'combatActionsPanel'].forEach(function (panelId) {
      var panel = document.getElementById(panelId);
      if (!panel) return;
      var isCollapsed = !!(state.collapsedPanels && state.collapsedPanels[panelId]);
      if (isCollapsed) panel.classList.add('collapsed');
      else panel.classList.remove('collapsed');
    });

    // Update round and turn display
    var roundDisplay = document.getElementById('combatRoundDisplay');
    if (roundDisplay) roundDisplay.textContent = String(Math.max(1, Number(state.round || 1)));

    var turnDisplay = document.getElementById('combatTurnDisplay');
    if (turnDisplay) {
      var current = state.initiative && state.initiative[state.initiativeIndex] || null;
      if (current) {
        turnDisplay.textContent = current.name || 'Awaiting start';
      } else {
        turnDisplay.textContent = 'Awaiting start';
      }
    }

    var playModeBtn = document.getElementById('combatPlayModeBtn');
    if (playModeBtn) {
      playModeBtn.textContent = state.playMode ? 'Play View' : 'Build View';
      playModeBtn.className = state.playMode ? 'btn btn-xs btn-teal' : 'btn btn-xs';
    }

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
      var wayfarers = (state.tokens || []).filter(function (token) { return token && token.isPlayer; });
      var allies = (state.tokens || []).filter(function (token) { return token && String(token.faction) === 'player' && !token.isPlayer; });
      var enemies = (state.tokens || []).filter(function (token) { return token && String(token.faction) === 'monster'; });
      function lane(label, list, color) {
        if (!list.length) return '';
        return '<div class="combat-feed-line"><strong style="color:' + color + ';">' + label + ':</strong> '
          + list.map(function (t) { return String(t.name || 'Unit'); }).join(', ')
          + '</div>';
      }
      initList.innerHTML = ''
        + lane('Wayfarer', wayfarers, 'var(--combat-accent-2)')
        + lane('Ally', allies, 'var(--combat-text)')
        + lane('Enemy', enemies, 'var(--combat-danger)');
      if (!String(initList.innerHTML || '').trim()) {
        initList.innerHTML = '<div class="combat-feed-line">No combatants tracked.</div>';
      }
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
      var selectedDread = selected ? Math.max(4, Number(selected.dread || selected.codexDread || 0)) : 0;
      var selectedDeath = selected ? Math.max(1, Number(selected.deathNumber || selectedDread || 0)) : 0;
      selectedSummary.textContent = selected
        ? (selected.name + ' · ' + selected.faction + ' · hex ' + toKey(selected.q, selected.r) + (selectedDread ? (' · DD d' + selectedDread + ' · DN ' + selectedDeath) : ''))
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

    // Mirror Combat Tab action math/text so Combat Mode always follows game rules.
    var mirroredWayfarerSel = document.getElementById('combatWayfarerActionSel');
    var mirroredWayfarerContext = document.getElementById('combatWayfarerContext');
    var sourceWayfarerSel = document.getElementById('wayfarerActionSel');
    if (mirroredWayfarerSel && sourceWayfarerSel) {
      try {
        if (typeof window.updateWayfarerActionBtn === 'function') window.updateWayfarerActionBtn();
      } catch (_err) {}
      var priorVal = String(mirroredWayfarerSel.value || '');
      mirroredWayfarerSel.innerHTML = sourceWayfarerSel.innerHTML;
      var values = Array.prototype.slice.call(mirroredWayfarerSel.options || []).map(function (opt) { return String(opt.value || ''); });
      if (priorVal && values.indexOf(priorVal) >= 0) mirroredWayfarerSel.value = priorVal;
      else if (String(sourceWayfarerSel.value || '')) mirroredWayfarerSel.value = String(sourceWayfarerSel.value || '');
      else mirroredWayfarerSel.value = '';
      if (mirroredWayfarerContext) {
        var listed = Array.prototype.slice.call(mirroredWayfarerSel.options || []).filter(function (opt) {
          return String(opt.value || '') !== '';
        }).map(function (opt) {
          var text = String(opt.textContent || '');
          return text.split(' — ')[0];
        });
        mirroredWayfarerContext.textContent = listed.length
          ? ('Available now: ' + listed.join(' · '))
          : 'No Wayfarer actions available right now.';
      }
    }

    var ruler = document.getElementById('combatRulerSummary');
    if (ruler) {
      var focusEnemy = null;
      try {
        if (typeof window.getPrimaryCombatEnemy === 'function') focusEnemy = window.getPrimaryCombatEnemy();
      } catch (_err) {}
      var rel = '';
      try {
        if (typeof window.getPrimaryEnemyZoneRelative === 'function') rel = String(window.getPrimaryEnemyZoneRelative() || '');
      } catch (_err) {}
      var relLabel = rel ? (rel.charAt(0).toUpperCase() + rel.slice(1)) : 'Unknown';
      var actionsLeft = (window.S && window.S.combat) ? Math.max(0, Number(window.S.combat.actionsLeft || 0)) : 0;
      var selectedPlayer = (state.tokens || []).find(function (t) { return t && t.isPlayer; }) || (state.tokens || []).find(function (t) { return t && String(t.faction) === 'player'; }) || null;
      var focusedToken = null;
      if (focusEnemy) {
        focusedToken = (state.tokens || []).find(function (t) {
          return t && String(t.faction) === 'monster' && (
            Number(t.sourceEnemyId || 0) === Number(focusEnemy.id || 0)
            || String(t.name || '') === String(focusEnemy.name || '')
          );
        }) || null;
      }
      var hexBand = '';
      if (selectedPlayer && focusedToken) {
        var hexDist = hexDistance({ q: selectedPlayer.q, r: selectedPlayer.r }, { q: focusedToken.q, r: focusedToken.r });
        hexBand = hexLabel(hexDist) + ' (' + hexDist + ' hex' + (hexDist === 1 ? '' : 'es') + ')';
      }
      if (focusEnemy) {
        ruler.textContent = String(focusEnemy.name || 'Focused Enemy') + ' · ' + (hexBand || relLabel) + ' · Actions Left ' + actionsLeft;
      } else if (state.ruler && state.ruler.distance) {
        ruler.textContent = state.ruler.distance + ' Hexes · ' + state.ruler.label;
      } else {
        ruler.textContent = 'Select/focus an enemy to sync Cinematic Distance.';
      }
    }

    var rollBtn = document.getElementById('combatRollModeBtn');
    if (rollBtn) rollBtn.textContent = state.autoRoll ? 'Auto Roll' : 'Manual Roll';

    var activeEntry = state.initiative && state.initiative[state.initiativeIndex] || null;
    var activeTokenId = String(activeEntry && activeEntry.tokenId || '');
    var activeToken = activeTokenId ? (state.tokens || []).find(function (token) {
      return token && String(token.id) === activeTokenId;
    }) : null;
    var playerTurn = !!(activeToken && (activeToken.isPlayer || String(activeToken.faction) === 'player'));

    var playerActionIds = [
      'combatCmdStrikeBtn', 'combatCmdShootBtn', 'combatCmdDefendBtn', 'combatCmdTraumaBtn',
      'combatCmdWayfarerBtn', 'combatOpenUtilityPromptBtn', 'combatOpenFlavorActionBtn',
      'combatAllyDefendBtn', 'combatAllySupportBtn', 'combatAllyAttackBtn', 'combatAllyMoveBtn'
    ];
    playerActionIds.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.disabled = !playerTurn;
      btn.style.opacity = playerTurn ? '1' : '0.45';
      if (!playerTurn) btn.title = 'Wait for a player turn in initiative order.';
      else btn.title = '';
    });

    var enemyActionIds = ['combatCmdEnemyBtn', 'combatCmdFlowBtn'];
    enemyActionIds.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.disabled = playerTurn;
      btn.style.opacity = playerTurn ? '0.45' : '1';
      if (playerTurn) btn.title = 'Enemy actions are disabled during player turns.';
      else btn.title = '';
    });

    var topMeta = document.getElementById('combatTopMeta');
    if (topMeta) {
      var combatStatusText = stripHtml((document.getElementById('combatStatus') || {}).textContent || '');
      topMeta.textContent = combatStatusText || 'No active scene.';
    }

    var opener = document.getElementById('combatSceneOpenerSummary');
    if (opener) {
      var so = window.S && window.S.combat && window.S.combat.sceneOpener ? window.S.combat.sceneOpener : null;
      if (so) {
        var zone = String(so.zone || 'Unknown');
        var cover = String(so.cover || 'none');
        var react = String(so.enemyReaction || 'Unknown');
        var activity = String(so.enemyActivity || 'Unknown');
        opener.textContent = 'Zone: ' + zone + ' · Cover: ' + cover + ' · Enemy Reaction: ' + react + ' · Enemy Activity: ' + activity + ' · Rad zones +10 unless protected.';
      } else {
        opener.textContent = 'No opener active.';
      }
    }

    var rulesTable = document.getElementById('combatWayfarerRulesTable');
    if (rulesTable && !rulesTable._seeded) {
      rulesTable._seeded = true;
      rulesTable.innerHTML = ''
        + '<table class="combat-rule-table"><thead><tr><th>Action</th><th>Cost</th><th>Effect</th></tr></thead><tbody>'
        + '<tr><td>Flourish</td><td>1</td><td>+1 Strike this turn.</td></tr>'
        + '<tr><td>Bandage</td><td>1</td><td>-1 Stress from target ally.</td></tr>'
        + '<tr><td>Reposition</td><td>1</td><td>Move ally and grant +1 Defend until next turn.</td></tr>'
        + '<tr><td>Break Grapple</td><td>1</td><td>Auto-disengage from grappled state.</td></tr>'
        + '<tr><td>Improvise Tool</td><td>1</td><td>Single-use +2 on item/flavor prompt.</td></tr>'
        + '<tr><td>Patch Cover</td><td>1</td><td>Repair one local cover segment.</td></tr>'
        + '</tbody></table>';
    }

    var mirror = document.getElementById('combatLegacyResultMirror');
    if (mirror) {
      var ids = ['attackResult', 'defendResult', 'traumaResult', 'enemyActionResult', 'wayfarerActionResult'];
      var text = '';
      for (var ii = 0; ii < ids.length; ii++) {
        var node = document.getElementById(ids[ii]);
        var raw = node ? stripHtml(node.textContent || node.innerText || '') : '';
        if (raw) { text = raw; break; }
      }
      mirror.textContent = text || 'Legacy combat output mirrors here.';
    }

    var statusMirror = document.getElementById('combatLegacyStatusMirror');
    if (statusMirror) {
      var statusText = stripHtml((document.getElementById('combatStatus') || {}).textContent || '');
      var actionHint = stripHtml((document.getElementById('maxActionsHint') || {}).textContent || '');
      statusMirror.textContent = (statusText || 'Status bridge idle.') + (actionHint ? (' ' + actionHint) : '');
    }

    var rollMirror = document.getElementById('combatLegacyRollModMirror');
    if (rollMirror) {
      var rollText = stripHtml((document.getElementById('rollModDisplay-combat') || {}).textContent || '');
      rollMirror.textContent = rollText ? ('Roll modifiers: ' + rollText) : 'Roll modifiers: none.';
    }

    var actionInfoMirror = document.getElementById('combatLegacyActionInfoMirror');
    if (actionInfoMirror) {
      var actionInfo = stripHtml((document.getElementById('wayfarerActionInfo') || {}).textContent || '');
      var distanceInfo = '';
      try {
        if (typeof window.getPrimaryEnemyZoneRelative === 'function') {
          var d = String(window.getPrimaryEnemyZoneRelative() || '');
          if (d) distanceInfo = 'Distance: ' + d.charAt(0).toUpperCase() + d.slice(1) + '.';
        }
      } catch (_err) {}
      var strikeShootRule = 'Strike: Engaged unless modifiers. Shoot: Nearby unless weapon/modifier/flavor overrides.';
      actionInfoMirror.textContent = (distanceInfo ? (distanceInfo + ' ') : '') + (actionInfo || 'Wayfarer action details appear here.') + ' ' + strikeShootRule;
    }

    var flavorMirror = document.getElementById('combatLegacyFlavorMirror');
    if (flavorMirror) {
      var flavorSource = document.getElementById('flavorPassiveCombatIndicator');
      if (flavorSource && String(flavorSource.style.display || '') !== 'none' && String(flavorSource.innerHTML || '').trim()) {
        flavorMirror.innerHTML = String(flavorSource.innerHTML || '');
      } else {
        flavorMirror.textContent = '';
      }
    }

    var rowsMirror = document.getElementById('combatLegacyRowsMirror');
    if (rowsMirror) {
      var rowMap = [
        { id: 'attackResult', label: 'Strike/Shoot' },
        { id: 'defendResult', label: 'Defend' },
        { id: 'traumaResult', label: 'Trauma' },
        { id: 'enemyActionResult', label: 'Enemy Action' },
        { id: 'wayfarerActionResult', label: 'Wayfarer Action' },
        { id: 'fleeResult', label: 'Escape/Morale' }
      ];
      var rowsHtml = rowMap.map(function (entry) {
        var node = document.getElementById(entry.id);
        var value = stripHtml(node ? (node.textContent || node.innerText || '') : '');
        if (!value) return '';
        return '<div class="combat-feed-line"><strong style="color:var(--combat-accent);">' + entry.label + ':</strong> ' + value + '</div>';
      }).filter(Boolean).join('');
      rowsMirror.innerHTML = rowsHtml || '<div class="combat-feed-line">No recent roll outputs yet.</div>';
    }

    var enemyLedgerMeta = document.getElementById('combatEnemyLedgerMeta');
    var enemyLedgerFeed = document.getElementById('combatEnemyLedgerFeed');
    if (enemyLedgerMeta && enemyLedgerFeed) {
      var entries = [];
      if (typeof window.getEnemyBudgetLedger === 'function') {
        try { entries = window.getEnemyBudgetLedger() || []; } catch (_err) { entries = []; }
      }
      var spendRows = entries.filter(function (entry) {
        return entry && String(entry.kind || '') === 'spend';
      });
      var grouped = {};
      spendRows.forEach(function (entry) {
        var c = Math.max(1, Number(entry.cycle || 1));
        if (!grouped[c]) grouped[c] = 0;
        grouped[c] += 1;
      });
      var activeCycle = 1;
      Object.keys(grouped).forEach(function (k) {
        activeCycle = Math.max(activeCycle, Number(k || 1));
      });
      var activeCount = grouped[activeCycle] || 0;
      enemyLedgerMeta.textContent = 'Cycle ' + activeCycle + ' spend events: ' + activeCount + ' · total logged: ' + spendRows.length;
      var lines = entries.slice(-18).reverse().map(function (entry) {
        if (!entry) return '';
        var kind = String(entry.kind || 'event');
        var source = String(entry.source || 'enemy event');
        var cycle = Math.max(1, Number(entry.cycle || 1));
        var round = Math.max(1, Number(entry.round || 1));
        var remaining = Math.max(0, Number(entry.remaining || 0));
        var spent = Math.max(0, Number(entry.spent || 0));
        var note = stripHtml(String(entry.note || ''));
        var badgeColor = kind === 'blocked' ? 'var(--combat-danger)' : (kind === 'cycle-complete' ? 'var(--combat-accent-2)' : 'var(--combat-accent)');
        return '<div class="combat-feed-line">'
          + '<span style="color:' + badgeColor + ';font-weight:700;">' + kind.toUpperCase() + '</span>'
          + ' · src ' + source
          + ' · r' + round + ' c' + cycle
          + ' · spent ' + spent
          + ' · remaining ' + remaining
          + (note ? (' · ' + note) : '')
          + '</div>';
      }).filter(Boolean).join('');
      enemyLedgerFeed.innerHTML = lines || '<div class="combat-feed-line">No enemy budget events yet.</div>';
    }

    var allySel = document.getElementById('combatAllySelect');
    if (allySel) {
      var allies = (state.tokens || []).filter(function (token) { return token && String(token.faction) === 'player'; });
      allySel.innerHTML = allies.map(function (ally) {
        var left = Number(state.teamActions && state.teamActions[ally.id] || (isCampaignModeActive() ? 0 : 2));
        return '<option value="' + String(ally.id) + '">' + String(ally.name || 'Ally') + (isCampaignModeActive() ? '' : (' · actions ' + left)) + '</option>';
      }).join('');
    }

    var allyBudget = document.getElementById('combatAllyBudgetMeta');
    if (allyBudget) {
      allyBudget.textContent = isCampaignModeActive()
        ? 'Campaign mode active: standard campaign action economy.'
        : '2 actions each ally/enemy. Actions refresh on Next Turn.';
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
        if (String(clickedToken.faction || '') === 'monster' && typeof window.setCombatFocusEnemy === 'function') {
          var focusId = Number(clickedToken.sourceEnemyId || clickedToken.id || 0);
          if (focusId > 0) {
            try { window.setCombatFocusEnemy(focusId); } catch (_err) {}
          }
        }
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
      closeBtn.onclick = function () {
        try {
          if (window.S && window.S.combat && window.S.combat.active && typeof window.endCombat === 'function') {
            window.endCombat();
          }
        } catch (_err) {}
        closeOverlay();
      };
    }

    var playModeBtn = document.getElementById('combatPlayModeBtn');
    if (playModeBtn && !playModeBtn._bound) {
      playModeBtn._bound = true;
      playModeBtn.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state, { playMode: !state.playMode });
          persist(next);
          return next;
        });
        updateUiPanels();
      };
    }

    var nextTurn = document.getElementById('combatNextTurnBtn');
    if (nextTurn && !nextTurn._bound) {
      nextTurn._bound = true;
      nextTurn.onclick = function () {
        store.setState(function (state) {
          var size = Math.max(1, (state.initiative || []).length);
          var prevIdx = Number(state.initiativeIndex || 0);
          var idx = (prevIdx + 1) % size;
          var nextRound = Number(state.round || 1);
          if (idx === 0 && size > 0) nextRound += 1;
          var next = Object.assign({}, state, { initiativeIndex: idx, currentTurnIndex: idx, round: nextRound });
          if (!isCampaignModeActive()) {
            next.teamActions = {};
            (state.tokens || []).forEach(function (token) {
              if (!token) return;
              if (String(token.faction) === 'player' || String(token.faction) === 'monster') next.teamActions[token.id] = 2;
            });
          }
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

    var deleteTokenBtn = document.getElementById('combatDeleteTokenBtn');
    if (deleteTokenBtn && !deleteTokenBtn._bound) {
      deleteTokenBtn._bound = true;
      deleteTokenBtn.onclick = function () {
        var state = store.getState();
        var token = byId(state.selectedTokenId);
        if (!token) return;
        if (!window.confirm('Delete ' + String(token.name || 'selected token') + ' from this scene?')) return;
        store.setState(function (inner) {
          var next = Object.assign({}, inner);
          next.tokens = (inner.tokens || []).filter(function (t) { return t && String(t.id) !== String(token.id); });
          next.selectedTokenId = '';
          next.initiative = [];
          persist(next);
          return next;
        });
        if (window.S && Array.isArray(window.S.enemies)) {
          var sourceId = Number(token.sourceEnemyId || token.id || 0);
          if (sourceId > 0) {
            window.S.enemies = window.S.enemies.filter(function (e) { return !e || Number(e.id) !== sourceId; });
            if (typeof window.renderEnemies === 'function') {
              try { window.renderEnemies(); } catch (_err) {}
            }
            if (typeof window.updateCombatUI === 'function') {
              try { window.updateCombatUI(); } catch (_err2) {}
            }
          }
        }
        addHistory('Deleted token: ' + String(token.name || 'Token') + '.');
        drawBoard();
        updateUiPanels();
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

    function runLegacyAction(kind) {
      try {
        if (kind === 'strike' && typeof window.rollAttack === 'function') window.rollAttack('strike');
        else if (kind === 'shoot' && typeof window.rollAttack === 'function') window.rollAttack('shoot');
        else if (kind === 'defend' && typeof window.rollDefend === 'function') window.rollDefend();
        else if (kind === 'trauma' && typeof window.rollTraumaCheck === 'function') window.rollTraumaCheck();
        else if (kind === 'enemy' && typeof window.doEnemyTurn === 'function') window.doEnemyTurn();
        else if (kind === 'flow' && typeof window.triggerEnemyActionEvent === 'function') window.triggerEnemyActionEvent();
      } catch (_err) {}
      updateUiPanels();
    }

    var cmdStrike = document.getElementById('combatCmdStrikeBtn');
    if (cmdStrike && !cmdStrike._bound) {
      cmdStrike._bound = true;
      cmdStrike.onclick = function () { runLegacyAction('strike'); };
    }

    var cmdShoot = document.getElementById('combatCmdShootBtn');
    if (cmdShoot && !cmdShoot._bound) {
      cmdShoot._bound = true;
      cmdShoot.onclick = function () { runLegacyAction('shoot'); };
    }

    var cmdDefend = document.getElementById('combatCmdDefendBtn');
    if (cmdDefend && !cmdDefend._bound) {
      cmdDefend._bound = true;
      cmdDefend.onclick = function () { runLegacyAction('defend'); };
    }

    var cmdTrauma = document.getElementById('combatCmdTraumaBtn');
    if (cmdTrauma && !cmdTrauma._bound) {
      cmdTrauma._bound = true;
      cmdTrauma.onclick = function () { runLegacyAction('trauma'); };
    }

    var cmdEnemy = document.getElementById('combatCmdEnemyBtn');
    if (cmdEnemy && !cmdEnemy._bound) {
      cmdEnemy._bound = true;
      cmdEnemy.onclick = function () { runLegacyAction('enemy'); };
    }

    var cmdFlow = document.getElementById('combatCmdFlowBtn');
    if (cmdFlow && !cmdFlow._bound) {
      cmdFlow._bound = true;
      cmdFlow.onclick = function () { runLegacyAction('flow'); };
    }

    var cmdWayfarer = document.getElementById('combatCmdWayfarerBtn');
    if (cmdWayfarer && !cmdWayfarer._bound) {
      cmdWayfarer._bound = true;
      cmdWayfarer.onclick = function () {
        var sel = document.getElementById('combatWayfarerActionSel');
        var val = String(sel && sel.value || '');
        if (!val) return;
        var legacySel = document.getElementById('wayfarerActionSel');
        if (legacySel) legacySel.value = val;
        try {
          if (typeof window.updateWayfarerActionBtn === 'function') window.updateWayfarerActionBtn();
        } catch (_err) {}
        if (typeof window.executeWayfarerAction === 'function') {
          try { window.executeWayfarerAction(); } catch (_err) {}
        }
        var selectedOpt = legacySel && legacySel.options ? legacySel.options[legacySel.selectedIndex] : null;
        var actionLabel = selectedOpt ? String(selectedOpt.textContent || val) : val;
        addHistory('Wayfarer action executed (Combat Tab rules): ' + actionLabel + '.');
        updateUiPanels();
      };
    }

    var openUtilityPromptBtn = document.getElementById('combatOpenUtilityPromptBtn');
    if (openUtilityPromptBtn && !openUtilityPromptBtn._bound) {
      openUtilityPromptBtn._bound = true;
      openUtilityPromptBtn.onclick = function () {
        if (typeof window.openCombatUtilityChooser === 'function') {
          try { window.openCombatUtilityChooser(); } catch (_err) {}
        } else if (typeof window.promptCombatUtilityAction === 'function') {
          try { window.promptCombatUtilityAction(); } catch (_err2) {}
        }
        updateUiPanels();
      };
    }

    var openFlavorActionBtn = document.getElementById('combatOpenFlavorActionBtn');
    if (openFlavorActionBtn && !openFlavorActionBtn._bound) {
      openFlavorActionBtn._bound = true;
      openFlavorActionBtn.onclick = function () {
        if (typeof window.usePersonalFlavorAction === 'function') {
          try { window.usePersonalFlavorAction(); } catch (_err) {}
        }
        updateUiPanels();
      };
    }

    function allyAction(handlerLabel, applyFn) {
      var allySel = document.getElementById('combatAllySelect');
      var allyId = String(allySel && allySel.value || '');
      if (!allyId) return;
      if (!spendUnitAction(allyId)) {
        addHistory('No remaining actions for selected ally.');
        updateUiPanels();
        return;
      }
      applyFn(allyId);
      addHistory(handlerLabel);
      drawBoard();
      updateUiPanels();
    }

    var allyDefend = document.getElementById('combatAllyDefendBtn');
    if (allyDefend && !allyDefend._bound) {
      allyDefend._bound = true;
      allyDefend.onclick = function () {
        allyAction('Ally used Defend: +1 cover effect to active position.', function (allyId) {
          store.setState(function (state) {
            var next = Object.assign({}, state);
            var ally = (state.tokens || []).find(function (t) { return t && String(t.id) === allyId; }) || null;
            if (!ally) return state;
            var key = toKey(ally.q, ally.r);
            next.layers = Object.assign({}, state.layers);
            next.layers.objects = Object.assign({}, state.layers.objects);
            next.layers.objects[key] = 'obstacle';
            persist(next);
            return next;
          });
        });
      };
    }

    var allySupport = document.getElementById('combatAllySupportBtn');
    if (allySupport && !allySupport._bound) {
      allySupport._bound = true;
      allySupport.onclick = function () {
        allyAction('Ally used Support: next action gets +2 scene bonus.', function () {
          store.setState(function (state) {
            var next = Object.assign({}, state);
            next.sceneRules = Object.assign({}, state.sceneRules, { supportBonus: 2 });
            persist(next);
            return next;
          });
        });
      };
    }

    var allyAttack = document.getElementById('combatAllyAttackBtn');
    if (allyAttack && !allyAttack._bound) {
      allyAttack._bound = true;
      allyAttack.onclick = function () {
        allyAction('Ally attacked nearest enemy.', function (allyId) {
          var state = store.getState();
          var ally = (state.tokens || []).find(function (t) { return t && String(t.id) === allyId; }) || null;
          if (!ally) return;
          var enemies = (state.tokens || []).filter(function (t) { return t && String(t.faction) === 'monster' && Number(t.hp || 0) > 0; });
          if (!enemies.length) return;
          enemies.sort(function (a, b) {
            return hexDistance({ q: ally.q, r: ally.r }, { q: a.q, r: a.r }) - hexDistance({ q: ally.q, r: ally.r }, { q: b.q, r: b.r });
          });
          var target = enemies[0];
          var roll = Math.floor(Math.random() * 20) + 1;
          var dd = Math.max(4, Number(target.dread || target.codexDread || 6));
          var support = Number(state.sceneRules && state.sceneRules.supportBonus || 0);
          var total = roll + support;
          if (total >= dd) {
            var dmg = Math.max(1, total - dd);
            var dn = Math.max(1, Number(target.deathNumber || dd));
            var kill = dmg >= dn;
            store.setState(function (inner) {
              var next = Object.assign({}, inner);
              next.tokens = (inner.tokens || []).map(function (t) {
                if (!t || String(t.id) !== String(target.id)) return t;
                var hpNow = Math.max(0, Number(t.hp || 0));
                return Object.assign({}, t, { hp: kill ? 0 : Math.max(0, hpNow - dmg) });
              });
              next.sceneRules = Object.assign({}, inner.sceneRules, { supportBonus: 0 });
              persist(next);
              return next;
            });
            addHistory((ally.name || 'Ally') + ' hit ' + (target.name || 'Enemy') + ' for ' + dmg + ' (DD d' + dd + ', DN ' + dn + (kill ? ', instant kill).' : ').'));
          } else {
            addHistory((ally.name || 'Ally') + ' missed ' + (target.name || 'Enemy') + ' (roll ' + total + ' vs DD d' + dd + ').');
          }
        });
      };
    }

    var allyMove = document.getElementById('combatAllyMoveBtn');
    if (allyMove && !allyMove._bound) {
      allyMove._bound = true;
      allyMove.onclick = function () {
        allyAction('Ally moved one hex.', function (allyId) {
          store.setState(function (state) {
            var next = Object.assign({}, state);
            next.tokens = (state.tokens || []).map(function (token) {
              if (!token || String(token.id) !== allyId) return token;
              var nq = Number(token.q || 0) + 1;
              var nr = Number(token.r || 0);
              if (isBlocked(nq, nr)) return token;
              return Object.assign({}, token, { q: nq, r: nr });
            });
            persist(next);
            return next;
          });
        });
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

    var addWayfarerBtn = document.getElementById('combatAddWayfarerBtn');
    if (addWayfarerBtn && !addWayfarerBtn._bound) {
      addWayfarerBtn._bound = true;
      addWayfarerBtn.onclick = function () {
        var state = store.getState();
        var existing = (state.tokens || []).find(function (t) { return t && t.isPlayer; });
        if (existing) {
          safeNotif('Wayfarer already on board at ' + toKey(existing.q, existing.r) + '.', 'warn');
          return;
        }
        store.setState(function (state) {
          var next = Object.assign({}, state);
          var wayfarerName = (window.S && window.S.name) || 'Wayfarer';
          var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';
          var t = {
            id: uid('player'),
            name: wayfarerName,
            faction: 'player',
            hp: 12,
            maxHp: 12,
            status: [],
            q: 0,
            r: 0,
            image: portrait,
            size: 1,
            isPlayer: true
          };
          next.tokens = (state.tokens || []).concat([t]);
          next.selectedTokenId = t.id;
          next.initiative = [];
          persist(next);
          return next;
        });
        addHistory('Wayfarer placed on the board (Engaged zone).');
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
        if (seed.id) {
          next.activeSceneId = String(seed.id);
        }
        if (typeof seed.name === 'string' && Array.isArray(next.scenes) && next.activeSceneId) {
          next.scenes = (next.scenes || []).map(function (scene) {
            if (!scene || String(scene.id) !== String(next.activeSceneId)) return scene;
            return Object.assign({}, scene, { name: String(seed.name || scene.name || 'Scene') });
          });
        }
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
        if (seed.fog && typeof seed.fog === 'object') {
          next.fog = Object.assign({}, next.fog, seed.fog);
        }
        if (seed.sceneRules && typeof seed.sceneRules === 'object') {
          next.sceneRules = Object.assign({}, next.sceneRules, seed.sceneRules);
        }
        if (seed.board && typeof seed.board === 'object') {
          next.board = Object.assign({}, next.board, seed.board);
        }
        persist(next);
        return next;
      });
    }

    store.setState({ open: true, entering: true });
    store.setState(function (state) {
      var activeCombat = !!(window.S && window.S.combat && window.S.combat.active);
      var next = Object.assign({}, state, { playMode: activeCombat ? true : !!state.playMode });
      persist(next);
      return next;
    });
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
      var dread = Math.max(4, Number(u.dread || 6));
      return {
        id: String(u.id || uid('enm')),
        name: String(u.name || ('Enemy ' + (idx + 1))),
        faction: 'monster',
        hp: dread * 2,
        maxHp: dread * 2,
        status: [],
        q: Number(u.position && u.position.q || (idx + 3)),
        r: Number(u.position && u.position.r || 0),
        image: '',
        size: 1,
        dread: dread,
        deathNumber: dread
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

  // Scenes Tab Functions
  window._currentSceneEditId = null;

  window.createNewCombatScene = function () {
    var sceneId = uid('scene');
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes.slice() : [];
    
    var newScene = {
      id: sceneId,
      name: 'New Scene ' + (scenes.length + 1),
      isActive: scenes.length === 0,
      createdAt: Date.now(),
      board: clone((state && state.board) || { cols: 15, rows: 15 }),
      layers: clone((state && state.layers) || {}),
      fog: clone((state && state.fog) || {}),
      sceneRules: clone((state && state.sceneRules) || {}),
      tokens: clone((state && state.tokens) || []),
      initiative: clone((state && state.initiative) || []),
      actionHistory: []
    };
    
    scenes.push(newScene);
    store.setState({
      scenes: scenes,
      activeSceneId: sceneId
    });
    
    window._currentSceneEditId = sceneId;
    renderScenesList();
    showSceneBuilder(sceneId);
    safeNotif('Scene created: ' + newScene.name);
  };

  function renderScenesList() {
    var listEl = document.getElementById('scenesList');
    if (!listEl) return;
    
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes : [];
    
    if (scenes.length === 0) {
      listEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted2);text-align:center;padding:.8rem;">No scenes yet. Create one to begin.</div>';
      return;
    }
    
    listEl.innerHTML = scenes.map(function (scene) {
      var isActive = scene.id === window._currentSceneEditId;
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .5rem;background:' + (isActive ? 'rgba(73,201,187,.1);border:1px solid var(--accent-2)' : 'transparent;border:1px solid var(--border2)') + ';border-radius:3px;cursor:pointer;" onclick="window.selectScene(\'' + String(scene.id).replace(/'/g, "\\'") + '\')">'
        + '<div>'
        + '<div style="font-size:.78rem;color:var(--text);">' + (scene.name || 'Unnamed Scene') + '</div>'
        + '<div style="font-size:.65rem;color:var(--muted);margin-top:.1rem;">' + (scene.board && scene.board.cols ? (scene.board.cols + 'x' + scene.board.rows + ' board') : 'No board') + '</div>'
        + '</div>'
        + '<button class="btn btn-xs" style="margin-left:.3rem;" onclick="event.stopPropagation();window.deleteScene(\'' + String(scene.id).replace(/'/g, "\\'") + '\')" title="Delete scene">✕</button>'
        + '</div>';
    }).join('');
  }

  window.selectScene = function (sceneId) {
    window._currentSceneEditId = sceneId;
    renderScenesList();
    showSceneBuilder(sceneId);
  };

  function showSceneBuilder(sceneId) {
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes : [];
    var scene = scenes.find(function (s) { return s.id === sceneId; });
    
    if (!scene) return;
    
    var builderEl = document.getElementById('sceneBuilderPanel');
    if (!builderEl) return;
    
    builderEl.style.display = 'block';
    document.getElementById('sceneEditName').textContent = scene.name;
    document.getElementById('sceneEditNameInput').value = scene.name;
    
    if (scene.board) {
      var sizeStr = (scene.board.cols || 15) + 'x' + (scene.board.rows || 15);
      var sizeSelect = document.getElementById('sceneMapSize');
      if (sizeSelect) {
        if (sizeStr === '10x10') sizeSelect.value = '10x10';
        else if (sizeStr === '15x15') sizeSelect.value = '15x15';
        else if (sizeStr === '20x20') sizeSelect.value = '20x20';
        else sizeSelect.value = 'custom';
      }
      
      var fogEl = document.getElementById('sceneFogOfWar');
      if (fogEl) fogEl.checked = !!(scene.fog && scene.fog.enabled);
    }
  }

  window.closeSceneBuilder = function () {
    var builderEl = document.getElementById('sceneBuilderPanel');
    if (builderEl) builderEl.style.display = 'none';
    window._currentSceneEditId = null;
    renderScenesList();
  };

  window.setupSceneTemplate = function (template) {
    if (!window._currentSceneEditId) return;
    
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes.slice() : [];
    var sceneIdx = scenes.findIndex(function (s) { return s.id === window._currentSceneEditId; });
    
    if (sceneIdx < 0) return;
    
    var scene = clone(scenes[sceneIdx]);
    
    var templateConfigs = {
      'empty': {
        board: { cols: 10, rows: 10 },
        layers: { terrain: {}, objects: {}, hazards: {}, elevation: {}, lighting: {}, weather: {}, interactives: {}, spawns: {} },
        fog: { enabled: false, revealed: {} }
      },
      'urban': {
        board: { cols: 15, rows: 15 },
        layers: {
          terrain: { '5,5': 'ruins', '8,8': 'ruins', '9,8': 'ruins' },
          objects: { '6,5': 'obstacle', '8,7': 'obstacle' },
          hazards: {}, elevation: {}, lighting: {}, weather: {}, interactives: { '7,8': 'chest' }, spawns: { '3,5': 'spawn' }
        },
        fog: { enabled: true, revealed: {} }
      },
      'wilderness': {
        board: { cols: 15, rows: 15 },
        layers: {
          terrain: { '3,3': 'forest', '4,3': 'forest', '10,7': 'crags', '10,8': 'crags' },
          objects: {}, hazards: {}, elevation: { '10,7': 2 }, lighting: {}, weather: {}, interactives: { '2,4': 'loot-cache' }, spawns: { '12,6': 'spawn' }
        },
        fog: { enabled: true, revealed: {} }
      },
      'dungeon': {
        board: { cols: 15, rows: 15 },
        layers: {
          terrain: { '5,5': 'ruins', '6,5': 'ruins', '7,5': 'ruins' },
          objects: { '5,6': 'obstacle', '6,6': 'obstacle' },
          hazards: { '8,5': 'trap' }, elevation: {}, lighting: {}, weather: {}, interactives: { '4,5': 'chest' }, spawns: { '11,5': 'spawn' }
        },
        fog: { enabled: true, revealed: {} }
      }
    };
    
    var config = templateConfigs[template];
    if (!config) return;
    
    scene.board = Object.assign({}, scene.board || {}, config.board || {});
    scene.layers = clone(config.layers || scene.layers || {});
    scene.fog = Object.assign({}, scene.fog || {}, config.fog || {});
    
    scenes[sceneIdx] = scene;
    store.setState({ scenes: scenes });
    showSceneBuilder(window._currentSceneEditId);
    safeNotif('Scene template applied: ' + template, 'success');
  };

  window.launchCombatModeWithScene = function () {
    if (!window._currentSceneEditId) return;
    
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes : [];
    var scene = scenes.find(function (s) { return s.id === window._currentSceneEditId; });
    
    if (!scene) return;
    
    // Update scene name from input
    var nameInput = document.getElementById('sceneEditNameInput');
    var scenesNext = scenes.slice();
    var sceneIndex = scenesNext.findIndex(function (s) { return s && String(s.id) === String(scene.id); });
    if (nameInput && nameInput.value) {
      scene = Object.assign({}, scene, { name: String(nameInput.value || scene.name || 'Scene') });
      if (sceneIndex >= 0) scenesNext[sceneIndex] = scene;
    }

    var sizeSel = document.getElementById('sceneMapSize');
    if (sizeSel) {
      var raw = String(sizeSel.value || '15x15');
      var parts = raw.split('x');
      var cols = Math.max(6, Number(parts[0] || scene.board && scene.board.cols || 15));
      var rows = Math.max(6, Number(parts[1] || scene.board && scene.board.rows || 15));
      scene.board = Object.assign({}, scene.board || {}, { cols: cols, rows: rows });
      if (sceneIndex >= 0) scenesNext[sceneIndex] = scene;
    }

    var fogEl = document.getElementById('sceneFogOfWar');
    if (fogEl) {
      scene.fog = Object.assign({}, scene.fog || {}, { enabled: !!fogEl.checked });
      if (sceneIndex >= 0) scenesNext[sceneIndex] = scene;
    }

    store.setState(function (prev) {
      var next = Object.assign({}, prev, { scenes: scenesNext, activeSceneId: scene.id });
      persist(next);
      return next;
    });
    
    // Load scene board state and open combat mode
    if (typeof window.openCombatSceneEditor === 'function') {
      window.openCombatSceneEditor(scene);
      safeNotif('Loaded scene: ' + scene.name);
    }
  };

  window.deleteScene = function (sceneId) {
    if (!confirm('Delete this scene? This cannot be undone.')) return;
    
    var state = store.getState();
    var scenes = Array.isArray(state && state.scenes) ? state.scenes.slice() : [];
    var idx = scenes.findIndex(function (s) { return s.id === sceneId; });
    
    if (idx < 0) return;
    
    scenes.splice(idx, 1);
    
    var newActiveId = sceneId === state.activeSceneId && scenes.length > 0 ? scenes[0].id : (state.activeSceneId === sceneId ? null : state.activeSceneId);
    
    store.setState({
      scenes: scenes,
      activeSceneId: newActiveId
    });
    
    if (window._currentSceneEditId === sceneId) {
      window.closeSceneBuilder();
    } else {
      renderScenesList();
    }
    
    safeNotif('Scene deleted');
  };

  window.deleteCurrentScene = function () {
    if (window._currentSceneEditId) {
      window.deleteScene(window._currentSceneEditId);
    }
  };

  // Render scenes list on page load or tab switch
  window.renderScenesTabOnOpen = function () {
    renderScenesList();
    
    // Subscribe to store changes to keep UI in sync
    store.subscribe(function (state) {
      renderScenesList();
    });
  };

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
