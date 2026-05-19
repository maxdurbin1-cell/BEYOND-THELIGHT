(function () {
  var KEY = 'btl-combat-scene-editor-v1';
  var RECOVERY_KEY = KEY + '-recovery';
  var RECOVERY_MAX = 3;
  var RECOVERY_MIN_INTERVAL_MS = 4000;
  var SQRT3 = Math.sqrt(3);
  var lastRecoveryPersistAt = 0;
  var lastRecoveryHash = '';
  var campaignSceneSyncTimer = null;
  var lastCampaignSceneSyncHash = '';

  function safeNotif(msg, tone) {
    if (typeof window.showNotif === 'function') window.showNotif(msg, tone || 'info');
  }

  function formatClockTime(value) {
    var t = Number(value || 0);
    if (!t) return '--:--';
    try {
      return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_err) {
      return '--:--';
    }
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

  function layerTextValue(state, layerName, q, r) {
    return String(state && state.layers && state.layers[layerName] && state.layers[layerName][toKey(q, r)] || '').toLowerCase();
  }

  function getLayerGameplayProfile(state, q, r) {
    var terrain = layerTextValue(state, 'terrain', q, r);
    var object = layerTextValue(state, 'objects', q, r);
    var hazard = layerTextValue(state, 'hazards', q, r);
    var lighting = layerTextValue(state, 'lighting', q, r);
    var weather = layerTextValue(state, 'weather', q, r);
    var foreground = layerTextValue(state, 'foreground', q, r);
    var interactive = layerTextValue(state, 'interactives', q, r);
    var spawn = layerTextValue(state, 'spawns', q, r);

    var moveTax = 0;
    var cover = 0;
    var rangedMod = 0;
    var meleeMod = 0;
    var defendMod = 0;
    var blockMove = false;
    var blockLos = false;
    var hazardDamage = 0;

    if (/obstacle|wall|vision-blocker|collapsed|barrier/.test(object + ' ' + lighting + ' ' + foreground)) blockMove = true;
    if (/lava|chasm|void|pit/.test(terrain)) blockMove = true;

    if (/difficult|marsh|water|mud|snow|rubble|ash/.test(terrain + ' ' + weather)) moveTax += 1;
    if (/web|tangle|wreckage|debris/.test(object + ' ' + foreground)) moveTax += 1;

    if (/forest|ruins|crags|marsh|balcony|tree-canopy|high-ledge/.test(terrain + ' ' + object + ' ' + foreground)) cover += 1;
    if (/obstacle|door|turret|crate|pillar|barrier/.test(object)) cover += 1;

    if (/vision-blocker|wall|smoke|fog/.test(lighting + ' ' + weather + ' ' + foreground)) blockLos = true;
    if (/smoke|fog|ash|storm/.test(weather + ' ' + foreground)) rangedMod -= 1;

    if (/water|mud|marsh/.test(terrain)) meleeMod -= 1;
    if (/shrine|relay|cover-node/.test(interactive)) defendMod += 1;

    if (/trap|fire|acid|radiation|shock|lava/.test(hazard + ' ' + terrain)) hazardDamage = Math.max(1, /lava|fire|acid/.test(hazard + ' ' + terrain) ? 2 : 1);
    if (/spawn|ambush/.test(spawn) && /trap|mine/.test(hazard)) hazardDamage = Math.max(hazardDamage, 2);

    return {
      moveTax: Math.max(0, moveTax),
      cover: cover,
      rangedMod: rangedMod,
      meleeMod: meleeMod,
      defendMod: defendMod,
      blockMove: blockMove,
      blockLos: blockLos,
      hazardDamage: hazardDamage,
      interactive: interactive
    };
  }

  function isHexRevealed(state, q, r) {
    if (!state.fog || !state.fog.enabled) return true;
    var key = toKey(q, r);
    var visible = !!(state.fog.revealed && state.fog.revealed[key]);
    if (String(state.fog.revealMode || 'manual') === 'ordered') {
      var order = Number(state.fog.revealOrder && state.fog.revealOrder[key] || 0);
      var step = Math.max(0, Number(state.fog.revealStep || 0));
      if (order > 0 && order <= step) visible = true;
    }
    var selected = byId(state.selectedTokenId);
    if (!selected) return visible;
    var radius = Math.max(0, Number(state.fog.visionRadius || 0));
    if (!radius) return visible;
    var inVision = hexDistance({ q: q, r: r }, { q: selected.q, r: selected.r }) <= radius;
    if (inVision && String(state.fog.revealMode || 'manual') === 'los') {
      return !isSightBlocked(state, { q: Number(selected.q || 0), r: Number(selected.r || 0) }, { q: q, r: r }) || visible;
    }
    if (inVision && String(state.fog.revealMode || 'manual') !== 'ordered') return true;
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

  function WALL_DIRECTIONS() {
    return [
      { key: 'e', dq: 1, dr: 0, edge: [0, 1] },
      { key: 'ne', dq: 1, dr: -1, edge: [5, 0] },
      { key: 'nw', dq: 0, dr: -1, edge: [4, 5] },
      { key: 'w', dq: -1, dr: 0, edge: [3, 4] },
      { key: 'sw', dq: -1, dr: 1, edge: [2, 3] },
      { key: 'se', dq: 0, dr: 1, edge: [1, 2] }
    ];
  }

  function oppositeWallDirection(key) {
    var map = { e: 'w', ne: 'sw', nw: 'se', w: 'e', sw: 'ne', se: 'nw' };
    return map[String(key || '')] || '';
  }

  function wallDirectionBetween(a, b) {
    var dq = Number(b && b.q || 0) - Number(a && a.q || 0);
    var dr = Number(b && b.r || 0) - Number(a && a.r || 0);
    var dirs = WALL_DIRECTIONS();
    for (var i = 0; i < dirs.length; i++) {
      if (dirs[i].dq === dq && dirs[i].dr === dr) return dirs[i].key;
    }
    return '';
  }

  function axialLerp(a, b, t) {
    return {
      q: Number(a.q || 0) + (Number(b.q || 0) - Number(a.q || 0)) * t,
      r: Number(a.r || 0) + (Number(b.r || 0) - Number(a.r || 0)) * t
    };
  }

  function axialLine(a, b) {
    var dist = Math.max(1, hexDistance(a, b));
    var out = [];
    for (var i = 0; i <= dist; i++) {
      var t = i / dist;
      var lerped = axialLerp(a, b, t);
      out.push(cubeRound(lerped.q, lerped.r));
    }
    return out;
  }

  function hasSegmentWallBetween(state, fromHex, toHex) {
    var dir = wallDirectionBetween(fromHex, toHex);
    if (!dir) return false;
    var segs = state && state.layers && state.layers.wallSegments ? state.layers.wallSegments : {};
    var aKey = toKey(fromHex.q, fromHex.r);
    var bKey = toKey(toHex.q, toHex.r);
    var aSeg = segs[aKey] || {};
    var bSeg = segs[bKey] || {};
    if (aSeg[dir]) return true;
    var opp = oppositeWallDirection(dir);
    if (opp && bSeg[opp]) return true;
    return false;
  }

  function isSightBlocked(state, fromHex, toHex) {
    if (!state || !state.layers) return false;
    var line = axialLine(fromHex, toHex);
    for (var i = 1; i < line.length; i++) {
      var prev = line[i - 1];
      var cur = line[i];
      if (hasSegmentWallBetween(state, prev, cur)) return true;
      if (i < line.length - 1) {
        var key = toKey(cur.q, cur.r);
        var mark = String(state.layers.lighting && state.layers.lighting[key] || '').toLowerCase();
        if (mark === 'wall' || mark === 'vision-blocker' || mark === 'opaque') return true;
      }
    }
    return false;
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return loadLatestRecoverySnapshot();
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
      return loadLatestRecoverySnapshot();
    } catch (_err) {
      return loadLatestRecoverySnapshot();
    }
  }

  function loadRecoveryStack() {
    try {
      var raw = localStorage.getItem(RECOVERY_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function loadLatestRecoverySnapshot() {
    var stack = loadRecoveryStack();
    if (!stack.length) return null;
    var latest = stack[stack.length - 1];
    if (!latest || !latest.data || typeof latest.data !== 'object') return null;
    return latest.data;
  }

  function writeRecoverySnapshot(slim) {
    if (!slim || typeof slim !== 'object') return;
    var now = Date.now();
    if (now - lastRecoveryPersistAt < RECOVERY_MIN_INTERVAL_MS) return;
    var hash = '';
    try {
      hash = JSON.stringify(slim);
    } catch (_err) {
      return;
    }
    if (!hash || hash === lastRecoveryHash) return;
    var stack = loadRecoveryStack();
    stack.push({ at: now, data: slim });
    while (stack.length > RECOVERY_MAX) stack.shift();
    try {
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(stack));
      lastRecoveryPersistAt = now;
      lastRecoveryHash = hash;
    } catch (_err) {}
  }

  function queueCampaignCombatSceneSync(reason) {
    if (!window || !window.campaignSystem) return;
    if (typeof window.campaignSystem.getState !== 'function') return;
    if (typeof window.campaignSystem.syncSharedPatch !== 'function') return;
    if (campaignSceneSyncTimer) clearTimeout(campaignSceneSyncTimer);
    campaignSceneSyncTimer = setTimeout(function () {
      campaignSceneSyncTimer = null;
      var cs = null;
      try {
        cs = window.campaignSystem.getState();
      } catch (_err) {
        return;
      }
      if (!cs || cs.role !== 'gm' || !cs.connected || !cs.code) return;
      var scene = {
        syncMeta: {
          by: String(window.S && window.S.name || 'GM'),
          at: Date.now()
        },
        combat: deepCloneJson(window.S && window.S.combat || {}) || {},
        enemies: Array.isArray(window.S && window.S.enemies) ? (deepCloneJson(window.S.enemies) || []) : [],
        naval: (window.S && window.S.naval && typeof window.S.naval === 'object') ? (deepCloneJson(window.S.naval) || null) : null,
        caravan: (window.S && window.S.caravan && typeof window.S.caravan === 'object') ? (deepCloneJson(window.S.caravan) || null) : null,
        combatMap: (window.S && window.S.combatMap && typeof window.S.combatMap === 'object') ? (deepCloneJson(window.S.combatMap) || null) : null,
        combatAugState: (window.S && window.S.combatAugState && typeof window.S.combatAugState === 'object') ? (deepCloneJson(window.S.combatAugState) || null) : null,
        sceneEditor: (window.S && window.S.combat && window.S.combat.sceneEditor && typeof window.S.combat.sceneEditor === 'object')
          ? (deepCloneJson(window.S.combat.sceneEditor) || null)
          : null
      };
      var hash = '';
      try {
        hash = JSON.stringify(scene);
      } catch (_err2) {
        return;
      }
      if (!hash || hash === lastCampaignSceneSyncHash) return;
      lastCampaignSceneSyncHash = hash;
      var out = window.campaignSystem.syncSharedPatch({ combatScene: scene }, String(reason || 'combat-scene-editor-sync'));
      if (out && typeof out.catch === 'function') out.catch(function () {});
    }, 220);
  }

  function normalizeBoard(board) {
    var source = board && typeof board === 'object' ? board : {}
    ;
    return {
      cols: Math.max(1, Math.min(60, Number(source.cols || 22))),
      rows: Math.max(1, Math.min(60, Number(source.rows || 16))),
      size: Math.max(24, Math.min(80, Number(source.size || 42))),
      zoom: Math.max(0.4, Math.min(3, Number(source.zoom || 1))),
      panX: Number.isFinite(Number(source.panX)) ? Number(source.panX) : 640,
      panY: Number.isFinite(Number(source.panY)) ? Number(source.panY) : 340,
      background: String(source.background || ''),
      weatherOverlay: String(source.weatherOverlay || 'none'),
      weatherIntensity: Math.max(0, Math.min(10, Number(source.weatherIntensity || 1)))
    };
  }

  function normalizeCombatSceneState(state) {
    var next = Object.assign({}, state || {});
    next.board = normalizeBoard(next.board);
    next.layers = Object.assign({
      terrain: {},
      objects: {},
      hazards: {},
      elevation: {},
      lighting: {},
      wallSegments: {},
      weather: {},
      foreground: {},
      interactives: {},
      spawns: {},
      labels: {}
    }, next.layers && typeof next.layers === 'object' ? next.layers : {});
    next.layers.terrain = Object.assign({}, next.layers.terrain || {});
    next.layers.objects = Object.assign({}, next.layers.objects || {});
    next.layers.hazards = Object.assign({}, next.layers.hazards || {});
    next.layers.elevation = Object.assign({}, next.layers.elevation || {});
    next.layers.lighting = Object.assign({}, next.layers.lighting || {});
    next.layers.wallSegments = Object.assign({}, next.layers.wallSegments || {});
    next.layers.weather = Object.assign({}, next.layers.weather || {});
    next.layers.foreground = Object.assign({}, next.layers.foreground || {});
    next.layers.interactives = Object.assign({}, next.layers.interactives || {});
    next.layers.spawns = Object.assign({}, next.layers.spawns || {});
    next.layers.labels = Object.assign({}, next.layers.labels || {});
    next.fog = Object.assign({
      enabled: false,
      showMask: true,
      revealMode: 'manual',
      visionRadius: 3,
      revealed: {},
      revealOrder: {},
      revealSeq: 0,
      revealStep: 0
    }, next.fog && typeof next.fog === 'object' ? next.fog : {});
    next.fog.revealed = Object.assign({}, next.fog.revealed || {});
    next.fog.revealOrder = Object.assign({}, next.fog.revealOrder || {});
    next.sceneRules = Object.assign({ rollMode: 'auto', defaultActionType: 'ranged' }, next.sceneRules && typeof next.sceneRules === 'object' ? next.sceneRules : {});
    next.rulerOptions = Object.assign({ shape: 'line', fadeDelay: 'linger', snapToGrid: true }, next.rulerOptions && typeof next.rulerOptions === 'object' ? next.rulerOptions : {});
    next.assetBrowser = Object.assign({ category: 'heroes', query: '' }, next.assetBrowser && typeof next.assetBrowser === 'object' ? next.assetBrowser : {});
    next.tokens = Array.isArray(next.tokens) ? next.tokens : [];
    next.tokenRoundEffects = Array.isArray(next.tokenRoundEffects) ? next.tokenRoundEffects : [];
    var roundNum = Math.max(1, Number(next.round || 1));
    var appliedNum = Number(next.lastConditionRoundApplied);
    if (!Number.isFinite(appliedNum) || appliedNum <= 0) appliedNum = roundNum;
    next.lastConditionRoundApplied = Math.max(1, appliedNum);
    next.initiative = Array.isArray(next.initiative) ? next.initiative : [];
    next.actionHistory = Array.isArray(next.actionHistory) ? next.actionHistory : [];
    next.collapsedPanels = Object.assign({}, next.collapsedPanels || {});
    next.panelPos = Object.assign({
      tools: { x: 14, y: 58 },
      feed: { x: 980, y: 58 },
      actions: { x: 290, y: 560 }
    }, next.panelPos && typeof next.panelPos === 'object' ? next.panelPos : {});
    return next;
  }

  function makeSceneSnapshot(state) {
    return {
      board: clone(state.board || {}),
      layers: clone(state.layers || {}),
      fog: clone(state.fog || {}),
      sceneRules: clone(state.sceneRules || {}),
      tokens: clone(state.tokens || []),
      tokenRoundEffects: clone(state.tokenRoundEffects || []),
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
    var slim = {
      board: synced.board,
      layers: synced.layers,
      fog: synced.fog,
      sceneRules: synced.sceneRules,
      tokens: synced.tokens,
      tokenRoundEffects: synced.tokenRoundEffects,
      initiative: synced.initiative,
      actionHistory: synced.actionHistory,
      panelPos: synced.panelPos,
      autoRoll: synced.autoRoll,
      round: synced.round,
      lastConditionRoundApplied: synced.lastConditionRoundApplied,
      initiativeIndex: synced.initiativeIndex,
      currentTurnIndex: synced.currentTurnIndex,
      collapsedPanels: synced.collapsedPanels,
      scenes: synced.scenes,
      activeSceneId: synced.activeSceneId,
      rulerOptions: synced.rulerOptions,
      assetBrowser: synced.assetBrowser
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch (_err) {}
    writeRecoverySnapshot(slim);
    if (window.S) {
      if (!window.S.combat || typeof window.S.combat !== 'object') window.S.combat = {};
      window.S.combat.sceneEditor = clone(synced);
      queueCampaignCombatSceneSync('combat-scene-editor-persist');
    }
  }

  function actionModeFor(action) {
    var value = String(action || '').toLowerCase();
    if (value === 'strike' || value === 'melee') return 'melee';
    if (value === 'shoot' || value === 'ranged') return 'ranged';
    return 'utility';
  }

  function coverOverridePenaltyForTarget(state, targetId) {
    if (!state || !targetId) return 0;
    var map = state.sceneRules && state.sceneRules.targetCoverOverrides && typeof state.sceneRules.targetCoverOverrides === 'object'
      ? state.sceneRules.targetCoverOverrides
      : {};
    var mode = String(map[targetId] || 'auto').toLowerCase();
    if (mode === 'none') return 0;
    if (mode === 'light') return -1;
    if (mode === 'heavy') return -2;
    return 0;
  }

  function coverPenaltyForTarget(state, actor, target, action) {
    if (!state || !actor || !target) return 0;
    if (actionModeFor(action) === 'melee') return 0;
    var key = toKey(target.q, target.r);
    var profile = getLayerGameplayProfile(state, target.q, target.r);
    var cover = Math.max(0, Number(profile.cover || 0));
    var actorElev = Number(state.layers && state.layers.elevation && state.layers.elevation[toKey(actor.q, actor.r)] || 0);
    var targetElev = Number(state.layers && state.layers.elevation && state.layers.elevation[key] || 0);
    if (actorElev > targetElev && cover > 0) cover -= 1;
    var range = hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r });
    if (range <= 1 && cover > 0) cover -= 1;
    var terrainCover = -Math.max(0, cover);
    return terrainCover + coverOverridePenaltyForTarget(state, String(target.id || ''));
  }

  function losModifierForAction(state, actor, target, action) {
    if (!state || !actor || !target) return { blocked: false, mod: 0 };
    if (actionModeFor(action) !== 'ranged') return { blocked: false, mod: 0 };
    var targetProfile = getLayerGameplayProfile(state, target.q, target.r);
    var blocked = targetProfile.blockLos || isSightBlocked(state, { q: Number(actor.q || 0), r: Number(actor.r || 0) }, { q: Number(target.q || 0), r: Number(target.r || 0) });
    var mod = blocked ? -4 : Number(targetProfile.rangedMod || 0);
    return { blocked: blocked, mod: mod };
  }

  function defaultTokens() {
    var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';
    var name = (window.S && window.S.name) || 'Wayfarer';
    var defendDie = Math.max(4, Number(window.S && window.S.stats && window.S.stats.defend || 6));
    var hpFromDefend = Math.max(1, defendDie * 2);
    return [
      { id: uid('pc'), name: String(name), faction: 'player', hp: hpFromDefend, maxHp: hpFromDefend, status: [], q: 0, r: 0, image: portrait, size: 1, isPlayer: true },
      { id: uid('mob'), name: 'Ghoul Ravager', faction: 'monster', hp: 10, maxHp: 10, status: [], q: 3, r: 0, image: '', size: 1 }
    ];
  }

  function canonicalWayfarerName() {
    return String(window.S && window.S.name || 'Wayfarer').trim() || 'Wayfarer';
  }

  function getWayfarerMaxHpByRules() {
    var defendDie = Math.max(4, Number(window.S && window.S.stats && window.S.stats.defend || 6));
    return Math.max(1, defendDie * 2);
  }

  function getWayfarerHealthSnapshot() {
    var maxHp = getWayfarerMaxHpByRules();
    var damageTaken = Math.max(0, Number(window.S && window.S.health || 0));
    var remaining = Math.max(0, maxHp - damageTaken);
    return { remaining: remaining, max: maxHp, damage: damageTaken };
  }

  function syncWayfarerTokenHealthFromSheet() {
    var state = store.getState();
    var snap = getWayfarerHealthSnapshot();
    var changed = false;
    store.setState(function (inner) {
      var next = Object.assign({}, inner);
      next.tokens = (inner.tokens || []).map(function (token) {
        if (!token || !token.isPlayer) return token;
        var hpNow = Math.max(0, Number(token.hp || 0));
        var maxNow = Math.max(1, Number(token.maxHp || hpNow || 1));
        if (hpNow === snap.remaining && maxNow === snap.max) return token;
        changed = true;
        return Object.assign({}, token, { hp: snap.remaining, maxHp: snap.max, dead: snap.remaining <= 0 });
      });
      if (changed) persist(next);
      return changed ? next : inner;
    });
  }

  function normalizeTokenActionBudgetToken(token) {
    return !!(token && !token.isPlayer && (String(token.faction) === 'player' || String(token.faction) === 'monster'));
  }

  function buildTurnOrder(tokens) {
    var list = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    var wayfarers = list.filter(function (t) { return !!t.isPlayer; });
    var allies = list.filter(function (t) { return !t.isPlayer && String(t.faction) === 'player'; });
    var enemies = list.filter(function (t) { return String(t.faction) === 'monster'; });
    var merged = wayfarers.concat(allies).concat(enemies);
    return merged.map(function (token, idx) {
      return { tokenId: token.id, name: token.name, init: Math.max(1, 100 - idx) };
    });
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
          isPlayer: false,
          dread: dread,
          deathNumber: dread,
          sourceEnemyId: Number(enemy.id || 0)
        };
      });
    }

    return tokens.length ? tokens : defaultTokens();
  }

  var persisted = normalizeCombatSceneState(loadPersisted());
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
    rulerOptions: { shape: 'line', fadeDelay: 'linger', snapToGrid: true },
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
      revealed: {},
      revealOrder: {},
      revealSeq: 0,
      revealStep: 0
    },
    sceneRules: {
      rollMode: 'auto',
      defaultActionType: 'ranged',
      targetCoverOverrides: {},
      lootDrops: {}
    },
    layers: {
      terrain: {},
      objects: {},
      hazards: {},
      elevation: {},
      lighting: {},
      wallSegments: {},
      weather: {},
      foreground: {},
      interactives: {},
      spawns: {},
      labels: {}
    },
    codexBestiary: flattenCodexBestiary(),
    tokens: seedFromCurrentCombat(),
    tokenRoundEffects: [],
    lastConditionRoundApplied: 1,
    initiative: [],
    teamActions: {},
    actionHistory: ['Combat mode initialized.'],
    panelPos: {
      tools: { x: 14, y: 58 },
      feed: { x: 980, y: 58 },
      actions: { x: 290, y: 560 }
    },
    mouse: { panning: false, lastX: 0, lastY: 0 },
    ping: null
  }, persisted || {}));

  store.setState(function (state) {
    var next = Object.assign({}, state);
    if (!next.assetBrowser || typeof next.assetBrowser !== 'object') {
      next.assetBrowser = { category: 'heroes', query: '' };
    } else {
      next.assetBrowser = Object.assign({ category: 'heroes', query: '' }, next.assetBrowser);
    }
    return next;
  });

  function ensureInitiative(state) {
    var expected = buildTurnOrder(state.tokens || []);
    var current = Array.isArray(state.initiative) ? state.initiative : [];
    var sameSize = current.length === expected.length;
    var sameOrder = sameSize && current.every(function (row, idx) {
      return row && String(row.tokenId || '') === String(expected[idx] && expected[idx].tokenId || '');
    });
    if (!sameOrder) state.initiative = expected;
    if (Number(state.initiativeIndex || 0) >= state.initiative.length) state.initiativeIndex = 0;
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
    (state.tokens || []).forEach(function (token) {
      if (!normalizeTokenActionBudgetToken(token)) return;
      if (typeof map[token.id] !== 'number') map[token.id] = 2;
    });
    next.teamActions = map;
    return next;
  }

  function spendUnitAction(tokenId) {
    var state = store.getState();
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

  function isTokenDead(token) {
    return !!(token && (token.dead || Number(token.hp || 0) <= 0));
  }

  function isSceneActive() {
    return !!(window.S && window.S.combat && window.S.combat.active);
  }

  function isGmController() {
    try {
      if (window.campaignSystem && typeof window.campaignSystem.getState === 'function') {
        var cs = window.campaignSystem.getState();
        if (cs && cs.code) return String(cs.role || '') === 'gm';
      }
    } catch (_err) {}
    return true;
  }

  function ensureLootDrops(state) {
    var rules = Object.assign({}, state.sceneRules || {});
    rules.lootDrops = Object.assign({}, rules.lootDrops || {});
    return rules;
  }

  function getLootDropForToken(state, tokenId) {
    if (!state || !state.sceneRules || !state.sceneRules.lootDrops) return null;
    var drop = state.sceneRules.lootDrops[String(tokenId)];
    return drop && typeof drop === 'object' ? drop : null;
  }

  function isTokenTurnActive(state, tokenId) {
    if (!state || !Array.isArray(state.initiative) || !state.initiative.length) return false;
    var active = state.initiative[Math.max(0, Number(state.initiativeIndex || 0))] || null;
    return !!(active && String(active.tokenId || '') === String(tokenId || ''));
  }

  function getMovementActionsAvailable(state, token) {
    if (!state || !token) return 0;
    if (!isSceneActive() || !state.playMode) return 0;
    var isPlayerSide = !!token.isPlayer || String(token.faction || '') === 'player';
    var tokenTurnActive = isTokenTurnActive(state, token.id);
    if (!tokenTurnActive) {
      var hasInitiative = !!(Array.isArray(state.initiative) && state.initiative.length);
      var playerActions = Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0));
      // Keep reachable hexes visible for Wayfarer when initiative has not synced yet.
      if (!(isPlayerSide && (!hasInitiative || playerActions > 0))) return 0;
    }
    if (isTokenDead(token)) return 0;
    if (isPlayerSide) {
      return Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0));
    }
    return Math.max(0, Number(state.teamActions && state.teamActions[token.id] || 0));
  }

  function getEnemyProfileByName(name) {
    if (!name || typeof window.NAMED_ENEMY_BESTIARY === 'undefined' || !window.NAMED_ENEMY_BESTIARY) return null;
    var bestiary = window.NAMED_ENEMY_BESTIARY;
    var needle = String(name || '').toLowerCase();
    var found = null;
    Object.keys(bestiary).some(function (region) {
      var list = Array.isArray(bestiary[region]) ? bestiary[region] : [];
      var row = list.find(function (entry) { return entry && String(entry.name || '').toLowerCase() === needle; });
      if (row) {
        found = row;
        return true;
      }
      return false;
    });
    return found;
  }

  function getEnemyProfileForToken(token) {
    if (!token) return null;
    var canonical = String(token.enemyProfileName || '').trim();
    if (canonical) {
      var byCanonical = getEnemyProfileByName(canonical);
      if (byCanonical) return byCanonical;
    }
    return getEnemyProfileByName(token.name);
  }

  function parseSkillRangeMax(skill) {
    var rangeMap = { engaged: 1, close: 2, nearby: 4, far: 99 };
    var ranges = Array.isArray(skill && skill.range) ? skill.range : [];
    return ranges.reduce(function (mx, r) {
      return Math.max(mx, rangeMap[String(r || '').toLowerCase()] || 1);
    }, 1);
  }

  function getEnemySkillOptionsForToken(actor, target) {
    var profile = actor ? getEnemyProfileForToken(actor) : null;
    if (!profile || !Array.isArray(profile.skills)) return [];
    var dist = (actor && target) ? hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r }) : null;
    return profile.skills.map(function (skill, idx) {
      var maxR = parseSkillRangeMax(skill);
      var inRange = dist === null ? true : dist <= maxR;
      return {
        idx: idx,
        id: 'enemy_skill:' + idx,
        name: String(skill && skill.name || ('Skill ' + (idx + 1))),
        skill: skill,
        maxRange: maxR,
        inRange: inRange,
        rangeLabel: Array.isArray(skill && skill.range) && skill.range.length ? skill.range.join('/') : 'engaged'
      };
    });
  }

  function parseDefendAdvantageCount() {
    var count = 0;
    var armor = String(window.S && window.S.equipment && window.S.equipment.armor || '').toLowerCase();
    if (armor && armor.indexOf('advantage') >= 0 && armor.indexOf('defend') >= 0) count += 1;
    var affix = (typeof window.getEquippedAffixCombatBonuses === 'function') ? window.getEquippedAffixCombatBonuses() : null;
    if (affix) {
      if (Number(affix.defendAdv || 0) > 0) count += Number(affix.defendAdv || 0);
      if (Array.isArray(affix.defendAdvDice) && affix.defendAdvDice.length) count += affix.defendAdvDice.length;
    }
    return Math.max(0, Math.floor(count));
  }

  function parseArmorDefendAdvDice() {
    var armor = String(window.S && window.S.equipment && window.S.equipment.armor || '');
    var dice = [];
    var rx = /ad\s*(\d+)/ig;
    var m;
    while ((m = rx.exec(armor))) {
      var d = Math.max(4, Number(m[1] || 0));
      if (d > 0) dice.push(d);
    }
    return dice;
  }

  function getWayfarerMaxActionsByRules() {
    var armor = String(window.S && window.S.equipment && window.S.equipment.armor || '');
    var m = armor.match(/(\d+)\s*actions?/i);
    if (m) {
      var parsed = Math.max(1, Number(m[1] || 0));
      if (parsed > 0) return parsed;
    }
    return Math.max(1, Number(window.S && window.S.combat && window.S.combat.maxActions || 3));
  }

  function syncWayfarerCombatActionBudget(resetCurrent) {
    if (!window.S || !window.S.combat) return;
    var maxByRules = getWayfarerMaxActionsByRules();
    window.S.combat.maxActions = maxByRules;
    if (resetCurrent) {
      window.S.combat.actionsLeft = maxByRules;
    } else {
      var current = Number(window.S.combat.actionsLeft);
      if (!Number.isFinite(current)) current = maxByRules;
      window.S.combat.actionsLeft = Math.min(maxByRules, Math.max(0, current));
    }
    if (typeof window.updateCombatUI === 'function') {
      try { window.updateCombatUI(); } catch (_err) {}
    }
  }

  function maybeAdvanceRoundAfterEnemyActions(actorTokenId) {
    var state = store.getState();
    var actor = byId(actorTokenId);
    if (!actor || String(actor.faction) !== 'monster') return false;
    var livingEnemies = (state.tokens || []).filter(function (t) {
      return t && String(t.faction) === 'monster' && !isTokenDead(t);
    });
    if (!livingEnemies.length) return false;
    var depleted = livingEnemies.every(function (t) {
      return Math.max(0, Number(state.teamActions && state.teamActions[t.id] || 0)) <= 0;
    });
    if (!depleted) return false;

    store.setState(function (inner) {
      var next = Object.assign({}, inner);
      var init = Array.isArray(inner.initiative) ? inner.initiative.slice() : [];
      var wayfarerRowIndex = init.findIndex(function (row) {
        var token = row ? byId(row.tokenId) : null;
        return !!(token && token.isPlayer);
      });
      if (wayfarerRowIndex < 0) wayfarerRowIndex = 0;
      next.round = Math.max(1, Number(inner.round || 1) + 1);
      next.initiativeIndex = wayfarerRowIndex;
      next.currentTurnIndex = wayfarerRowIndex;
      next.teamActions = {};
      (inner.tokens || []).forEach(function (t) {
        if (!normalizeTokenActionBudgetToken(t)) return;
        next.teamActions[t.id] = 2;
      });
      persist(next);
      return next;
    });

    syncWayfarerCombatActionBudget(true);
    addHistory('Enemy actions exhausted. New round begins. Wayfarer actions reset.');
    safeNotif('New round started: Wayfarer actions reset.', 'good');
    processRoundEffectsForCurrentRound();
    updateUiPanels();
    drawBoard();
    return true;
  }

  function rollDie(sides) {
    var s = Math.max(2, Number(sides || 6));
    return 1 + Math.floor(Math.random() * s);
  }

  function rollCombatDieTotal(sides, type, label) {
    var die = Math.max(2, Number(sides || 6));
    if (typeof window.explodingRoll === 'function') {
      var rolled = window.explodingRoll(die, {
        type: type || 'action',
        major: true,
        label: String(label || ('Combat d' + die))
      });
      return Math.max(1, Number(rolled && rolled.total || 1));
    }
    return rollDie(die);
  }

  function promptManualDieTotal(message, defaultValue, min, max) {
    var raw = window.prompt(String(message || 'Enter roll total:'), String(defaultValue || 1));
    if (raw === null) return null;
    var n = Number(raw);
    if (!Number.isFinite(n)) return null;
    var low = Math.max(1, Number(min || 1));
    var high = Math.max(low, Number(max || 20));
    return Math.max(low, Math.min(high, Math.round(n)));
  }

  function parseArmorDefendFlatBonus() {
    var armor = String(window.S && window.S.equipment && window.S.equipment.armor || '');
    if (!armor) return 0;
    var total = 0;
    var m;
    var rxLeading = /([+-]\d+)\s*defend/ig;
    while ((m = rxLeading.exec(armor))) {
      total += Number(m[1] || 0);
    }
    var rxTrailing = /defend\s*([+-]\d+)/ig;
    while ((m = rxTrailing.exec(armor))) {
      total += Number(m[1] || 0);
    }
    return Number.isFinite(total) ? total : 0;
  }

  function parseAffixDefendFlatBonus() {
    var affix = (typeof window.getEquippedAffixCombatBonuses === 'function') ? window.getEquippedAffixCombatBonuses() : null;
    if (!affix || typeof affix !== 'object') return 0;
    var total = 0;
    total += Number(affix.defendFlat || 0);
    total += Number(affix.defendBonus || 0);
    return Number.isFinite(total) ? total : 0;
  }

  function initializeSceneRoundState() {
    store.setState(function (state) {
      var next = Object.assign({}, state);
      var ordered = buildTurnOrder(state.tokens || []);
      var wayfarerIndex = ordered.findIndex(function (row) {
        var token = row ? byId(row.tokenId) : null;
        return !!(token && token.isPlayer);
      });
      if (wayfarerIndex < 0) wayfarerIndex = 0;
      next.round = 1;
      next.initiative = ordered;
      next.initiativeIndex = wayfarerIndex;
      next.currentTurnIndex = wayfarerIndex;
      next.teamActions = {};
      (state.tokens || []).forEach(function (token) {
        if (!normalizeTokenActionBudgetToken(token)) return;
        next.teamActions[token.id] = 2;
      });
      persist(next);
      return next;
    });
    if (window.S && window.S.combat) {
      window.S.combat.round = 1;
      syncWayfarerCombatActionBudget(true);
    }
  }

  function isManualRollModeActive() {
    return !!(window.settingsSystem && typeof window.settingsSystem.isManualRollMode === 'function' && window.settingsSystem.isManualRollMode());
  }

  function skillRangeVerbatim(skill) {
    if (!skill) return 'Engaged';
    if (Array.isArray(skill.range) && skill.range.length) {
      return skill.range.map(function (r) {
        var raw = String(r || '').trim();
        if (!raw) return '';
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      }).filter(Boolean).join(' / ');
    }
    return 'Engaged';
  }

  function skillSourceVerbatim(skill) {
    if (!skill) return 'Combat Tab';
    var src = String(skill.source || 'Combat Tab').trim();
    var rangeTxt = skillRangeVerbatim(skill);
    var kind = String(skill.kind || 'special').trim();
    return src + ' · ' + kind + ' · Range: ' + rangeTxt.toLowerCase();
  }

  function getEnemySkillSaveLabel(skill) {
    var raw = String((skill && (skill.save || skill.saveStat || skill.stat)) || 'defend').toLowerCase();
    var map = {
      defend: 'Defend',
      body: 'Body',
      mind: 'Mind',
      spirit: 'Spirit',
      strike: 'Strike',
      shoot: 'Shoot',
      control: 'Control',
      lead: 'Lead'
    };
    if (map[raw]) return map[raw];
    if (raw === 'healthstrike' || raw === 'defendcheck') return 'Defend';
    if (raw === 'forcetrauma') return 'Mind';
    if (raw === 'radiation') return 'Spirit';
    if (raw === 'hack') return 'Control';
    return 'Defend';
  }

  function getEnemySkillSaveKey(skill) {
    return String(getEnemySkillSaveLabel(skill) || 'Defend').toLowerCase();
  }

  function getEnemySkillDreadDie(skill, fallback) {
    var fromSkill = Math.max(0, Number(skill && skill.dreadDie || 0));
    if (fromSkill > 0) return Math.max(4, fromSkill);
    return Math.max(4, Number(fallback || 6));
  }

  function getTargetSaveDieForSkill(target, skill) {
    var key = getEnemySkillSaveKey(skill);
    if (target && target.isPlayer) {
      var s = window.S && window.S.stats ? window.S.stats : {};
      return Math.max(4, Number(s[key] || s.defend || 6));
    }
    if (target) {
      if (key === 'defend') return Math.max(4, Number(target.defend || target.dread || target.codexDread || 6));
      return Math.max(4, Number(target[key] || target.defend || target.dread || target.codexDread || 6));
    }
    return 6;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function enemySkillCardHtml(entry, actorName, dreadDie, targetName, tacticText) {
    if (!entry || !entry.skill) return '';
    var skill = entry.skill;
    var title = escapeHtml(String(skill.name || 'Enemy Skill'));
    var saveTxt = escapeHtml(getEnemySkillSaveLabel(skill));
    var rangeTxt = escapeHtml(skillRangeVerbatim(skill));
    var rollTxt = escapeHtml(saveTxt + ' vs Dread d' + Number(getEnemySkillDreadDie(skill, dreadDie || 6)));
    var failTxt = escapeHtml(String(skill.onFail || 'Apply effect.'));
    var successTxt = escapeHtml(String(skill.onSuccess || 'Resist the effect.'));
    var sourceTxt = escapeHtml(skillSourceVerbatim(skill));
    var actorTxt = escapeHtml(String(actorName || 'Enemy'));
    var targetTxt = escapeHtml(String(targetName || 'Target'));
    var stateBadge = entry.inRange
      ? '<span style="font-size:.68rem;color:#57d69b;">In Range</span>'
      : '<span style="font-size:.68rem;color:#e59b73;">Out of Range</span>';
    var tacticRow = tacticText
      ? ('<div style="margin-top:.22rem;font-size:.72rem;color:var(--muted2);"><strong style="color:var(--combat-accent-2);">Tactic:</strong> ' + escapeHtml(String(tacticText || '')) + '</div>')
      : '';
    return ''
      + '<div style="margin-top:.18rem;border:1px solid rgba(227,188,94,.35);background:rgba(9,13,24,.92);padding:.38rem .44rem;border-radius:8px;">'
      + '<div style="display:flex;justify-content:space-between;gap:.35rem;align-items:baseline;">'
      + '<div style="font-size:.84rem;font-weight:700;color:var(--combat-accent-2);">' + title + '</div>'
      + stateBadge
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--text2);margin-top:.2rem;">'
      + '<div><strong>Save:</strong> ' + saveTxt + '</div>'
      + '<div><strong>Range:</strong> ' + rangeTxt + '</div>'
      + '<div><strong>Roll:</strong> ' + rollTxt + '</div>'
      + '<div><strong>On Fail:</strong> ' + failTxt + '</div>'
      + '<div><strong>On Success:</strong> ' + successTxt + '</div>'
      + '<div><strong>Source:</strong> ' + sourceTxt + '</div>'
      + '</div>'
      + tacticRow
      + '<div style="margin-top:.18rem;font-size:.68rem;color:var(--muted2);">' + actorTxt + ' targeting ' + targetTxt + '</div>'
      + '</div>';
  }

  function pushEnemySkillNarration(actor, skill, dreadDie) {
    if (!actor || !skill) return;
    addHistory(String(actor.name || 'Enemy') + ' uses ' + String(skill.name || 'Enemy Skill'));
    addHistory('Save: ' + getEnemySkillSaveLabel(skill));
    addHistory('Range: ' + skillRangeVerbatim(skill));
    addHistory('Roll: ' + getEnemySkillSaveLabel(skill) + ' vs Dread d' + Number(getEnemySkillDreadDie(skill, dreadDie || 6)));
    addHistory('On Fail: ' + String(skill.onFail || 'Apply effect.'));
    addHistory('On Success: ' + String(skill.onSuccess || 'Resist the effect.'));
    addHistory('Source: ' + skillSourceVerbatim(skill));
  }

  function extractTimedConditionText(onFail) {
    var txt = String(onFail || '');
    var m = txt.match(/apply\s+([^\.]+?)(?:\.|$)/i);
    if (!m) return '';
    return String(m[1] || '').trim();
  }

  function parseStressFromText(text, fallback) {
    var src = String(text || '');
    var m = src.match(/take\s*(\d+)\s*stress/i) || src.match(/(\d+)\s*stress/i);
    if (!m) return Math.max(1, Number(fallback || 1));
    return Math.max(1, Number(m[1] || fallback || 1));
  }

  function pickMerchantLootItemsForToken(dread) {
    var loot = [];
    var shopData = null;
    try {
      if (window && window.SHOP_DATA && typeof window.SHOP_DATA === 'object') shopData = window.SHOP_DATA;
      else if (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && typeof SHOP_DATA === 'object') shopData = SHOP_DATA;
    } catch (_err) {
      shopData = null;
    }
    if (!shopData) return loot;

    var categories = ['items', 'essentials', 'toolkits', 'remedies', 'scrolls', 'tradegoods'];
    var pool = [];
    categories.forEach(function (cat) {
      var list = Array.isArray(shopData[cat]) ? shopData[cat] : [];
      list.forEach(function (entry) {
        if (!entry) return;
        var label = String((entry.name || entry) || '').trim();
        if (label) pool.push(label);
      });
    });
    if (!pool.length) return loot;

    var rolls = Math.max(1, Math.min(3, Math.ceil(Math.max(1, Number(dread || 4)) / 4)));
    for (var i = 0; i < rolls; i++) {
      var pick = pool[Math.floor(Math.random() * pool.length)] || '';
      if (pick) loot.push(pick);
    }
    return loot;
  }

  function ensureLootDropForToken(token, reason) {
    if (!token) return;
    store.setState(function (state) {
      var next = Object.assign({}, state);
      var rules = ensureLootDrops(state);
      var key = String(token.id || '');
      if (!rules.lootDrops[key]) {
        var dread = Math.max(1, Number(token.dread || token.codexDread || 4));
        var items = [];
        if (String(token.faction || '') === 'monster') {
          items.push('Credits x' + String(10 * dread));
          var merchantItems = pickMerchantLootItemsForToken(dread);
          if (merchantItems.length) {
            merchantItems.forEach(function (entry) { items.push(entry); });
          } else {
            items.push(String(token.name || 'Enemy') + ' Salvage');
          }
        } else {
          items.push(String(token.name || 'Wayfarer') + ' Kit');
        }
        rules.lootDrops[key] = {
          id: uid('loot'),
          tokenId: key,
          tokenName: String(token.name || 'Token'),
          q: Number(token.q || 0),
          r: Number(token.r || 0),
          items: items,
          claimed: false,
          droppedAt: Date.now(),
          reason: String(reason || 'defeated')
        };
      }
      next.sceneRules = rules;
      persist(next);
      return next;
    });
  }

  function markTokenAsDead(tokenId, reason) {
    var token = byId(tokenId);
    if (!token) return;
    if (isTokenDead(token) && getLootDropForToken(store.getState(), tokenId)) return;
    store.setState(function (state) {
      var next = Object.assign({}, state);
      next.tokens = (state.tokens || []).map(function (row) {
        if (!row || String(row.id) !== String(tokenId)) return row;
        return Object.assign({}, row, { hp: 0, dead: true });
      });
      persist(next);
      return next;
    });
    ensureLootDropForToken(Object.assign({}, token, { hp: 0, dead: true }), reason || 'defeated');
    addHistory(String(token.name || 'Token') + ' was defeated. Loot dropped on the body.');
  }

  function applyDamageToToken(tokenId, damage, sourceLabel) {
    var target = byId(tokenId);
    if (!target || isTokenDead(target)) return 0;
    var amount = Math.max(0, Number(damage || 0));
    if (!amount) return Math.max(0, Number(target.hp || 0));
    var newHp = Math.max(0, Number(target.hp || 0) - amount);
    
    // Create floating damage number
    var state = store.getState();
    var board = state.board;
    var size = Number(board.size || 42) * Number(board.zoom || 1);
    var p = axialToPixel(Number(target.q || 0), Number(target.r || 0), size, board.panX, board.panY);
    createFloatingNumber(p.x, p.y - 10, '-' + amount, 'damage');
    
    store.setState(function (state) {
      var next = Object.assign({}, state);
      next.tokens = (state.tokens || []).map(function (row) {
        if (!row || String(row.id) !== String(tokenId)) return row;
        return Object.assign({}, row, { hp: newHp, dead: newHp <= 0 });
      });
      persist(next);
      return next;
    });
    if (target.isPlayer && window.S) {
      // Core sheet health is tracked as damage taken, so incoming damage increments it.
      if (typeof window.setHealth === 'function') {
        window.setHealth(Number(window.S.health || 0) + amount);
      } else {
        window.S.health = Math.max(0, Number(window.S.health || 0) + amount);
      }
      if (typeof window.updateCombatUI === 'function') {
        try { window.updateCombatUI(); } catch (_err) {}
      }
    }
    addHistory((sourceLabel ? String(sourceLabel) + ' hits ' : '') + String(target.name || 'Target') + ' for ' + amount + ' damage (' + newHp + ' HP left).');
    if (newHp <= 0) markTokenAsDead(tokenId, sourceLabel || 'damage');
    drawBoard();
    return newHp;
  }

  function addTokenRoundEffect(targetTokenId, label, stressPerRound, rounds, color) {
    var target = byId(targetTokenId);
    if (!target) return false;
    var safeStress = Math.max(0, Number(stressPerRound || 0));
    var safeRounds = Math.max(1, Number(rounds || 1));
    var safeLabel = String(label || 'Condition').trim() || 'Condition';
    var tone = String(color || '#e3bc5e').trim() || '#e3bc5e';
    store.setState(function (state) {
      var next = Object.assign({}, state);
      var list = Array.isArray(state.tokenRoundEffects) ? state.tokenRoundEffects.slice() : [];
      list.push({
        id: uid('cond'),
        targetTokenId: String(targetTokenId),
        label: safeLabel,
        stressPerRound: safeStress,
        roundsLeft: safeRounds,
        color: tone,
        sourceRound: Math.max(1, Number(state.round || 1))
      });
      next.tokenRoundEffects = list;
      persist(next);
      return next;
    });
    addHistory('Condition applied: ' + safeLabel + ' to ' + String(target.name || 'Token') + ' (' + safeStress + '/round for ' + safeRounds + ' rounds).');
    return true;
  }

  function processRoundEffectsForCurrentRound() {
    var st = store.getState();
    var currentRound = Math.max(1, Number(st.round || 1));
    var alreadyApplied = Math.max(0, Number(st.lastConditionRoundApplied || 0));
    if (currentRound <= alreadyApplied) return;

    var fallen = [];
    store.setState(function (state) {
      var roundNow = Math.max(1, Number(state.round || 1));
      var roundApplied = Math.max(0, Number(state.lastConditionRoundApplied || 0));
      if (roundNow <= roundApplied) return state;

      var next = Object.assign({}, state);
      var tokenIndex = {};
      var tokenCopies = (state.tokens || []).map(function (token) {
        var copy = Object.assign({}, token);
        tokenIndex[String(copy.id || '')] = copy;
        return copy;
      });
      var lines = [];
      var effects = (state.tokenRoundEffects || []).map(function (effect) {
        return Object.assign({}, effect);
      });

      effects.forEach(function (effect) {
        if (!effect || Number(effect.roundsLeft || 0) <= 0) return;
        var target = tokenIndex[String(effect.targetTokenId || '')];
        if (!target || isTokenDead(target)) {
          effect.roundsLeft = 0;
          return;
        }
        var tickDamage = Math.max(0, Number(effect.stressPerRound || 0));
        if (tickDamage > 0) {
          var before = Math.max(0, Number(target.hp || 0));
          var after = Math.max(0, before - tickDamage);
          target.hp = after;
          target.dead = after <= 0;
          if (target.isPlayer && window.S) {
            if (typeof window.setHealth === 'function') window.setHealth(Number(window.S.health || 0) + tickDamage);
            else window.S.health = Math.max(0, Number(window.S.health || 0) + tickDamage);
          }
          lines.push(String(effect.label || 'Condition') + ' deals ' + tickDamage + ' to ' + String(target.name || 'Token') + ' (' + after + ' HP).');
          if (after <= 0) {
            fallen.push(Object.assign({}, target));
          }
        }
        effect.roundsLeft = Math.max(0, Number(effect.roundsLeft || 0) - 1);
      });

      next.tokens = tokenCopies;
      next.tokenRoundEffects = effects.filter(function (effect) {
        return effect && Number(effect.roundsLeft || 0) > 0;
      });
      next.lastConditionRoundApplied = roundNow;
      if (lines.length) {
        var baseHistory = Array.isArray(state.actionHistory) ? state.actionHistory.slice() : [];
        next.actionHistory = lines.concat(baseHistory).slice(0, 80);
      }
      persist(next);
      return next;
    });

    if (fallen.length) {
      fallen.forEach(function (token) {
        ensureLootDropForToken(token, 'condition');
      });
    }
    if (typeof window.updateCombatUI === 'function') {
      try { window.updateCombatUI(); } catch (_err) {}
    }
    syncWayfarerTokenHealthFromSheet();
    drawBoard();
    updateUiPanels();
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
    var profile = getLayerGameplayProfile(state, q, r);
    return !!profile.blockMove;
  }

  function paintAt(q, r) {
    store.setState(function (state) {
      var layer = String(state.activeLayer || 'terrain');
      var tool = String(state.activeTool || 'select');
      if (!state.layers[layer]) return state;
      var next = Object.assign({}, state);
      next.layers = Object.assign({}, state.layers);
      next.layers[layer] = Object.assign({}, state.layers[layer]);
      next.layers.wallSegments = Object.assign({}, state.layers.wallSegments || {});
      var key = toKey(q, r);
      var paint = String(state.paintValue || 'forest');
      if (tool === 'erase') {
        if (layer === 'lighting' && /^wall-seg-/.test(paint)) {
          var segKey = paint.replace('wall-seg-', '');
          var wallMap = Object.assign({}, next.layers.wallSegments[key] || {});
          delete wallMap[segKey];
          if (Object.keys(wallMap).length) next.layers.wallSegments[key] = wallMap;
          else delete next.layers.wallSegments[key];
          addHistory('Removed wall segment ' + segKey + ' at ' + key + '.');
        } else {
          delete next.layers[layer][key];
          if (layer === 'lighting') delete next.layers.wallSegments[key];
          addHistory('Cleared ' + layer + ' at ' + key + '.');
        }
      } else if (tool === 'paint') {
        if (layer === 'elevation') {
          next.layers[layer][key] = Number(state.paintValue || 1);
        } else if (layer === 'lighting' && /^wall-seg-/.test(paint)) {
          var seg = paint.replace('wall-seg-', '');
          var map = Object.assign({}, next.layers.wallSegments[key] || {});
          map[seg] = true;
          next.layers.wallSegments[key] = map;
        } else {
          next.layers[layer][key] = paint;
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
      next.fog.revealOrder = Object.assign({}, state.fog.revealOrder || {});
      var key = toKey(q, r);
      if (String(brush || state.fogBrush) === 'hide') {
        delete next.fog.revealed[key];
        delete next.fog.revealOrder[key];
      } else {
        next.fog.revealed[key] = true;
        if (String(next.fog.revealMode || 'manual') === 'ordered') {
          next.fog.revealSeq = Math.max(0, Number(state.fog.revealSeq || 0)) + 1;
          next.fog.revealOrder[key] = next.fog.revealSeq;
          if (Number(next.fog.revealStep || 0) < next.fog.revealSeq) {
            next.fog.revealStep = next.fog.revealSeq;
          }
        }
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
    var manualMode = !state.autoRoll || isManualRollModeActive();
    var base = 0;
    if (manualMode) {
      var manualBase = promptManualDieTotal('Manual action roll total (1-20):', 10, 1, 20);
      if (manualBase === null) {
        safeNotif('Manual action roll cancelled.', 'info');
        return;
      }
      base = manualBase;
    } else {
      base = Math.floor(Math.random() * 20) + 1;
    }
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
    var actorProfile = getLayerGameplayProfile(state, actor.q, actor.r);
    var terrain = String(state.layers.terrain[toKey(actor.q, actor.r)] || '');
    if (terrain === 'difficult terrain') terrainMod = -1;
    if (terrain === 'water' && actionType === 'melee') terrainMod -= 1;
    if (actionType === 'melee' || actionType === 'strike') terrainMod += Number(actorProfile.meleeMod || 0);
    if (actionType === 'ranged' || actionType === 'shoot') terrainMod += Number(actorProfile.rangedMod || 0);
    if (actionType === 'defend') terrainMod += Number(actorProfile.defendMod || 0);
    var coverMod = target ? coverPenaltyForTarget(state, actor, target, actionType) : 0;
    var los = target ? losModifierForAction(state, actor, target, actionType) : { blocked: false, mod: 0 };
    var losMod = Number(los.mod || 0);
    var supportBonus = Math.max(0, Number(state.sceneRules && state.sceneRules.supportBonus || 0));
    var total = base + elevationMod + weatherMod + terrainMod + coverMod + losMod + supportBonus;
    var summary = (actor.name || 'Token') + ' action [' + actionType + '] base ' + base + ' + elevation ' + elevationMod + ' + weather ' + weatherMod + ' + terrain ' + terrainMod + ' + cover ' + coverMod + ' + los ' + losMod + ' + support ' + supportBonus + ' = ' + total;
    addHistory(summary);
    if (target) {
      var cin = hexLabel(range);
      var targetDread = Math.max(4, Number(target.dread || target.codexDread || 6));
      if (los.blocked && actionModeFor(actionType) === 'ranged') {
        addHistory((actor.name || 'Token') + ' cannot land a ranged hit on ' + (target.name || 'Target') + ': line of sight blocked.');
        updateUiPanels();
        return;
      }
      var hit = total >= targetDread;
      if (hit) {
        var damage = Math.max(1, total - targetDread);
        var deathNumber = Math.max(1, Number(target.deathNumber || targetDread));
        var autoKill = damage >= deathNumber;
        applyDamageToToken(target.id, autoKill ? Math.max(0, Number(target.hp || 0)) : damage, actor.name || 'Action');
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
    var actorProfile = getLayerGameplayProfile(state, actor.q, actor.r);
    var terrain = String(state.layers.terrain[toKey(actor.q, actor.r)] || '');
    if (terrain === 'difficult terrain') terrainMod -= 1;
    if (terrain === 'water' && (action === 'strike' || action === 'melee' || action === 'defend')) terrainMod -= 1;
    if (terrain === 'lava' && action === 'defend') terrainMod -= 1;
    if (action === 'shoot' || action === 'ranged') terrainMod += Number(actorProfile.rangedMod || 0);
    if (action === 'strike' || action === 'melee') terrainMod += Number(actorProfile.meleeMod || 0);
    if (action === 'defend') terrainMod += Number(actorProfile.defendMod || 0);
    var coverMod = target ? coverPenaltyForTarget(state, actor, target, action) : 0;
    var los = target ? losModifierForAction(state, actor, target, action) : { blocked: false, mod: 0 };
    var losMod = Number(los.mod || 0);

    var range = target ? hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r }) : 0;
    var total = elevationMod + weatherMod + terrainMod + coverMod + losMod;
    var summary = 'Scene mods: elevation ' + elevationMod + ', weather ' + weatherMod + ', terrain ' + terrainMod + ', cover ' + coverMod + ', los ' + losMod + ' => ' + total;
    return {
      total: total,
      elevation: elevationMod,
      weather: weatherMod,
      terrain: terrainMod,
      cover: coverMod,
      los: losMod,
      losBlocked: !!los.blocked,
      range: range,
      cinematic: hexLabel(range),
      targetName: target ? String(target.name || 'Target') : '',
      actorName: String(actor.name || 'Actor'),
      summary: summary
    };
  }

  function buildCharacterSheetCombatSummary(targetTokenId) {
    var token = byId(targetTokenId);
    var stats = window.S && window.S.stats ? window.S.stats : {};
    var strikeDie = Number(stats.strike || 4);
    var shootDie = Number(stats.shoot || 4);
    var defendDie = Number(stats.defend || 4);
    var controlDie = Number(stats.control || 4);
    var tmw = Math.max(0, Number(window.S && window.S.tmw || 0));
    var hpSnap = getWayfarerHealthSnapshot();
    var health = hpSnap.remaining;
    var maxHealth = hpSnap.max;
    var flavor = String(window.S && window.S.flavor || '').trim();

    var affix = (typeof window.getEquippedAffixCombatBonuses === 'function') ? window.getEquippedAffixCombatBonuses() : {};
    var wpStrike = (typeof window.parseWeaponBonuses === 'function') ? window.parseWeaponBonuses('strike') : { flat: 0, advDie: 0 };
    var wpShoot = (typeof window.parseWeaponBonuses === 'function') ? window.parseWeaponBonuses('shoot') : { flat: 0, advDie: 0 };
    var flStrike = (typeof window.getFlavorBonus === 'function') ? window.getFlavorBonus('strike') : { flat: 0, advDice: [] };
    var flShoot = (typeof window.getFlavorBonus === 'function') ? window.getFlavorBonus('shoot') : { flat: 0, advDice: [] };
    var mtStrike = (typeof window.getMutationBonus === 'function') ? window.getMutationBonus('strike') : { flat: 0, advDice: [] };
    var mtShoot = (typeof window.getMutationBonus === 'function') ? window.getMutationBonus('shoot') : { flat: 0, advDice: [] };
    var rollMod = window.S && window.S.rollMod ? window.S.rollMod : { flat: 0, advDice: [] };

    var strikeFlat = Number(wpStrike.flat || 0) + Number(flStrike.flat || 0) + Number(mtStrike.flat || 0) + Number(rollMod.flat || 0);
    var shootFlat = Number(wpShoot.flat || 0) + Number(flShoot.flat || 0) + Number(mtShoot.flat || 0) + Number(rollMod.flat || 0);
    if (Number(affix && affix.strikeFlat || 0)) strikeFlat += Number(affix.strikeFlat || 0);
    if (Number(affix && affix.shootFlat || 0)) shootFlat += Number(affix.shootFlat || 0);

    var strikeAdv = [];
    var shootAdv = [];
    strikeAdv = strikeAdv.concat((flStrike && flStrike.advDice) || []).concat((mtStrike && mtStrike.advDice) || []);
    shootAdv = shootAdv.concat((flShoot && flShoot.advDice) || []).concat((mtShoot && mtShoot.advDice) || []);
    if (Number(wpStrike && wpStrike.advDie || 0) > 0) strikeAdv.push(Number(wpStrike.advDie));
    if (Number(wpShoot && wpShoot.advDie || 0) > 0) shootAdv.push(Number(wpShoot.advDie));
    if (Array.isArray(rollMod && rollMod.advDice)) {
      strikeAdv = strikeAdv.concat(rollMod.advDice);
      shootAdv = shootAdv.concat(rollMod.advDice);
    }

    var lines = [];
    lines.push('Your Actions: ' + Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0)) + '/' + Math.max(1, Number(window.S && window.S.combat && window.S.combat.maxActions || 3)) + ' · Health: ' + health + '/' + maxHealth + ' · TMW: ' + tmw);
    lines.push('Dice: Strike d' + strikeDie + ' · Shoot d' + shootDie + ' · Defend d' + defendDie + ' · Control d' + controlDie);
    lines.push('Strike math: ' + (strikeFlat >= 0 ? '+' : '') + strikeFlat + ' flat' + (strikeAdv.length ? (' · Advantage ' + strikeAdv.map(function (v) { return 'd' + v; }).join(', ')) : ''));
    lines.push('Shoot math: ' + (shootFlat >= 0 ? '+' : '') + shootFlat + ' flat' + (shootAdv.length ? (' · Advantage ' + shootAdv.map(function (v) { return 'd' + v; }).join(', ')) : ''));
    lines.push('Flavor: ' + (flavor || 'None selected') + (token ? (' · Token: ' + String(token.name || 'Token')) : ''));
    var equip = window.S && window.S.equipment ? window.S.equipment : {};
    var w1 = String(equip.weapon1 || '').trim();
    var w2 = String(equip.weapon2 || '').trim();
    var armor = String(equip.armor || '').trim();
    lines.push('Weapon: ' + (w1 || 'None') + (w2 ? (' · Off-hand: ' + w2) : '') + ' · Armor: ' + (armor || 'None'));
    return lines;
  }

  function buildEnemyTokenQuickActions(token) {
    if (!token || token.isPlayer || String(token.faction || '') !== 'monster') return '';
    var state = store.getState();
    var target = (state.tokens || []).find(function (t) {
      return t && t.isPlayer && !isTokenDead(t);
    });
    if (!target || isTokenDead(token)) return '';
    var dist = hexDistance({ q: Number(token.q || 0), r: Number(token.r || 0) }, { q: Number(target.q || 0), r: Number(target.r || 0) });
    var html = '<div style="margin-top:.28rem;border-top:1px solid rgba(227,188,94,.2);padding-top:.22rem;">';
    html += '<div style="font-size:.72rem;font-weight:700;color:var(--combat-accent-2);margin-bottom:.12rem;">Quick Actions</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.16rem;">';
    
    var skills = getEnemySkillOptionsForToken(token, target);
    if (skills.length) {
      var inRangeSkills = skills.filter(function (s) { return !!s.inRange; });
      if (inRangeSkills.length) {
        var firstSkill = inRangeSkills[0];
        var btnText = firstSkill.name.length > 12 ? firstSkill.name.substring(0, 11) + '…' : firstSkill.name;
        html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)executeEnemyTokenAction(token,null,\'' + String(firstSkill.id) + '\');updateUiPanels();drawBoard();})();">' + escapeHtml(btnText) + '</button>';
      }
    }
    
    var nearbyTarget = dist <= 1;
    if (nearbyTarget) {
      html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)addHistory(token.name+\' attempts melee engagement\');})();">Melee</button>';
    } else if (dist >= 2 && dist <= 3) {
      html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)addHistory(token.name+\' maintains ranged pressure\');})();">Range</button>';
    }
    
    if (!nearbyTarget && dist > 1) {
      var adjQr = [(token.q + 1, token.r), (token.q - 1, token.r), (token.q, token.r + 1), (token.q, token.r - 1)][Math.floor(Math.random() * 4)];
      html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)moveToken(token.id,' + (adjQr[0] || token.q) + ',' + (adjQr[1] || token.r) + ');updateUiPanels();drawBoard();})();">Advance</button>';
    }
    
    html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)spendUnitAction(token.id);updateUiPanels();drawBoard();})();">Pass</button>';
    html += '</div></div>';
    return html;
  }

  function buildEnemySkillInspector(token) {
    if (!token || token.isPlayer || String(token.faction || '') !== 'monster') return '';
    var state = store.getState();
    var target = (state.tokens || []).find(function (t) {
      return t && t.isPlayer && !isTokenDead(t);
    });
    if (!target || isTokenDead(token)) return '';
    var skills = getEnemySkillOptionsForToken(token, target);
    if (!skills.length) return '';
    
    var dreadDie = Math.max(4, Number(token.dread || token.codexDread || 6));
    var html = '<div style="margin-top:.28rem;border-top:1px solid rgba(227,188,94,.2);padding-top:.22rem;">';
    html += '<div style="font-size:.72rem;font-weight:700;color:var(--combat-accent-2);margin-bottom:.12rem;">Available Skills</div>';
    
    skills.forEach(function (entry) {
      if (!entry || !entry.skill) return;
      var skill = entry.skill;
      var title = escapeHtml(String(skill.name || 'Skill'));
      var stateBadge = entry.inRange
        ? '<span style="font-size:.65rem;color:#57d69b;">✓ In Range</span>'
        : '<span style="font-size:.65rem;color:#d9534f;">✗ Out of Range</span>';
      var saveLabel = escapeHtml(getEnemySkillSaveLabel(skill));
      var saveKey = getEnemySkillSaveKey(skill);
      var skillRoll = escapeHtml(saveLabel + ' vs Dread d' + Number(getEnemySkillDreadDie(skill, dreadDie)));
      
      html += '<div style="margin-top:.16rem;border:1px solid rgba(227,188,94,.25);background:rgba(9,13,24,.88);padding:.22rem .28rem;border-radius:6px;font-size:.7rem;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:.2rem;">';
      html += '<strong style="color:var(--combat-accent-2);">' + title + '</strong>';
      html += stateBadge;
      html += '</div>';
      html += '<div style="margin-top:.12rem;color:var(--text2);">';
      html += '<div><strong>Save:</strong> ' + saveLabel + '</div>';
      html += '<div><strong>Range:</strong> ' + escapeHtml(Array.isArray(skill.range) ? skill.range.join('/') : 'engaged') + '</div>';
      html += '<div><strong>Roll:</strong> ' + skillRoll + '</div>';
      html += '</div>';
      
      if (entry.inRange) {
        html += '<button class="btn btn-xs" style="margin-top:.12rem;width:100%;font-size:.65rem;padding:.08rem;" onclick="(function(){var token=store.getState().tokens.find(t=>t&&t.id===\'' + String(token.id) + '\');if(token)executeEnemyTokenAction(token,null,\'' + String(entry.id) + '\');updateUiPanels();drawBoard();})();">Execute Skill</button>';
      }
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  function buildLootShortcuts(token) {
    if (!token || isTokenDead(token)) return '';
    var state = store.getState();
    var loot = getLootDropForToken(state, token.id);
    if (!loot) return '';
    
    var html = '<div style="margin-top:.28rem;border-top:1px solid rgba(227,188,94,.2);padding-top:.22rem;">';
    html += '<div style="font-size:.72rem;font-weight:700;color:var(--combat-accent-2);margin-bottom:.12rem;">Loot Available</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.16rem;">';
    html += '<button class="btn btn-xs" style="font-size:.68rem;background:#2a5c3d;" onclick="(function(){var card=document.getElementById(\'combatLootPopupCard\');if(card){card.style.display=\'block\';card.style.left=\'50%\';card.style.top=\'50%\';card.style.transform=\'translate(-50%,-50%)\';var buttons=card.querySelectorAll(\'#combatLootTakeAllBtn\');if(buttons.length)buttons[0].click();}})();">Take All</button>';
    html += '<button class="btn btn-xs" style="font-size:.68rem;" onclick="(function(){var card=document.getElementById(\'combatLootPopupCard\');if(card)card.style.display=(card.style.display===\'none\'?\'block\':\'none\');})();">Inspect</button>';
    html += '</div></div>';
    return html;
  }

  function openTokenSheetQuickView(tokenId) {
    var token = byId(tokenId);
    if (!token) return;
    var body = '';
    if (token.isPlayer || String(token.faction || '') === 'player') {
      body = buildCharacterSheetCombatSummary(token.id).map(function (line) {
        return '<div class="combat-feed-line">' + String(line) + '</div>';
      }).join('');
    } else {
      body = ''
        + '<div class="combat-feed-line"><strong>' + String(token.name || 'Enemy') + '</strong></div>'
        + '<div class="combat-feed-line">Faction: ' + String(token.faction || 'monster') + '</div>'
        + '<div class="combat-feed-line">HP: ' + Math.max(0, Number(token.hp || 0)) + '/' + Math.max(1, Number(token.maxHp || token.hp || 1)) + '</div>'
        + '<div class="combat-feed-line">Dread Die: d' + Math.max(4, Number(token.dread || token.codexDread || 6)) + '</div>'
        + '<div class="combat-feed-line">Death Number: ' + Math.max(1, Number(token.deathNumber || token.dread || token.codexDread || 6)) + '</div>'
        + buildEnemySkillInspector(token)
        + buildEnemyTokenQuickActions(token)
        + buildLootShortcuts(token);
    }
    if (typeof window.openModal === 'function') {
      window.openModal('Combat Sheet · ' + String(token.name || 'Token'), '<div style="display:grid;gap:.2rem;max-height:58vh;overflow:auto;">' + body + '</div>', null, { preventScroll: true, focusTrap: true });
    } else {
      safeNotif('Token Sheet: ' + String(token.name || 'Token'), 'info');
    }
  }

  function canActionReachTarget(actionValue, range) {
    var v = String(actionValue || '').toLowerCase();
    if (!v) return true;
    if (v.indexOf('strike') >= 0) return Number(range || 0) <= 1;
    if (v.indexOf('shoot') >= 0) {
      var r = Number(range || 0);
      // Shooting can pressure close through far bands in the scene editor.
      return r >= 1 && r <= 3;
    }
    return true;
  }

  function spawnBestiaryToken(profile, q, r) {
    if (!profile) return;
    store.setState(function (state) {
      var next = Object.assign({}, state);
      var token = {
        id: uid('bst'),
        name: String(profile.name || 'Beast'),
        enemyProfileName: String(profile.name || ''),
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
    if (!isSceneActive()) return true;
    var isPlayerSide = !!actor.isPlayer || String(actor.faction || '') === 'player';
    var required = Math.max(1, Number(distance || 1));
    if (isPlayerSide) {
      if (!window.S || !window.S.combat) return true;
      var available = Math.max(0, Number(window.S.combat.actionsLeft || 0));
      if (available < required) {
        safeNotif('Not enough Actions to move. Movement cost includes terrain/layer tax.', 'warn');
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
    var state = store.getState();
    var availableEnemy = Math.max(0, Number(state.teamActions && state.teamActions[actor.id] || 0));
    if (availableEnemy < required) {
      safeNotif('Enemy token is out of actions for movement this turn.', 'warn');
      return false;
    }
    for (var j = 0; j < required; j++) {
      if (!spendUnitAction(actor.id)) return false;
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
    if (isTokenDead(actor)) return;
    var distance = hexDistance({ q: Number(actor.q || 0), r: Number(actor.r || 0) }, { q: Number(q), r: Number(r) });
    if (distance <= 0) return;
    var activeMovement = !!(state.playMode && isSceneActive());
    if (activeMovement && distance > 1) {
      addHistory('Movement limited to 1 hex per action in active scenes.');
      return;
    }
    var destinationProfile = getLayerGameplayProfile(state, q, r);
    var movementCost = Math.max(1, distance + Math.max(0, Number(destinationProfile.moveTax || 0)));
    if (activeMovement && !consumeMovementAction(actor, movementCost)) {
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
    if (token) {
      addHistory(String(token.name || 'Token') + ' moved to ' + toKey(q, r) + ' (cost ' + movementCost + ' action' + (movementCost === 1 ? '' : 's') + ').');
      if (Number(destinationProfile.hazardDamage || 0) > 0) {
        var hz = Math.max(1, Number(destinationProfile.hazardDamage || 0));
        applyDamageToToken(token.id, hz, 'Hazard');
        addHistory(String(token.name || 'Token') + ' takes ' + hz + ' hazard damage from tile effects.');
      }
    }
    if (activeMovement && actor && String(actor.faction || '') === 'monster') {
      maybeAdvanceRoundAfterEnemyActions(actor.id);
    }
  }

  function ensureOverlayDom() {
    var existing = document.getElementById('combatModeOverlay');
    if (existing) return existing;
    var root = document.createElement('section');
    root.id = 'combatModeOverlay';
    root.className = 'combat-mode-overlay';
    root.setAttribute('tabindex', '-1');
    setTimeout(function() {
      try { root.focus({ preventScroll: true }); } catch (e) { root.focus(); }
    }, 0);
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
      + '<div class="combat-mini" id="combatTopMeta">No active scene. | Turn: <span id="combatTurnDisplay">Awaiting start</span> &middot; <span id="combatSharedSyncBadge">Sync --</span></div>'
      + '</div>'
      + '<div style="display:flex;gap:.28rem;align-items:center;">'
      + '<button class="btn btn-xs btn-primary" id="combatStartSceneBtn">Start Scene</button>'
      + '<button class="btn btn-xs" id="combatPlayModeBtn">Play View</button>'
      + '<button class="btn btn-xs" id="combatAddWayfarerBtn" title="Add Wayfarer to board">+ Wayfarer</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatUploadMapBtn">Upload Battlemap</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatClearMapBtn">Remove Battlemap</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatAddTokenBtn">+ Add Enemy</button>'
      + '<button class="btn btn-xs btn-red" id="combatCloseBtn">End Scene</button>'
      + '<div style="display:flex;gap:.28rem;align-items:center;margin-left:.4rem;border-left:1px solid rgba(227,188,94,.2);padding-left:.4rem;">'
      + '<button class="btn btn-xs" id="combatRulesReferenceBtn" title="Combat Rules Reference">Rules</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatSaveSceneCardBtn" title="Save current scene as card">Save Scene</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatLoadSceneCardBtn" title="Load a saved scene card">Load Scene</button>'
      + '<button class="btn btn-xs combat-editor-only" id="combatNewSceneTemplateBtn" title="Create new scene from template">New Scene</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<input id="combatMapImageInput" type="file" accept="image/*" style="display:none;">'
      + '<input id="combatTokenImageInput" type="file" accept="image/*" style="display:none;">'
      + '<input id="combatImportSceneInput" type="file" accept="application/json,.json" style="display:none;">'
      + '<div class="combat-canvas-wrap" id="combatCanvasWrap"><canvas id="combatSceneCanvas"></canvas><input id="combatBubbleInlineInput" type="text" style="display:none;position:absolute;z-index:8;min-width:54px;height:20px;padding:0 .25rem;border:1px solid rgba(227,188,94,.8);background:rgba(4,6,12,.96);color:#fff;font-size:.72rem;"><div id="combatLootPopupCard" style="display:none;position:absolute;z-index:9;min-width:240px;max-width:300px;border:1px solid rgba(227,188,94,.65);background:rgba(5,8,16,.98);box-shadow:0 12px 28px rgba(0,0,0,.45);padding:.45rem .5rem;border-radius:10px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:.35rem;"><div id="combatLootPopupTitle" style="font:600 .83rem Rajdhani,sans-serif;color:var(--combat-accent-2);">Body Loot</div><button class="btn btn-xs" id="combatLootCloseBtn" style="padding:.08rem .3rem;">X</button></div><div id="combatLootPopupMeta" class="combat-mini" style="margin:.18rem 0 .28rem 0;"></div><div id="combatLootPopupList" style="display:grid;gap:.2rem;max-height:180px;overflow:auto;padding-right:.1rem;"></div><div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-top:.34rem;"><button class="btn btn-xs" id="combatLootTakeSelectedBtn">Take Selected</button><button class="btn btn-xs" id="combatLootTakeAllBtn">Take All</button></div></div></div>'
      + '<aside class="combat-icon-rail" id="combatIconRail">'
      + '<button class="combat-icon-btn" id="combatRailSelectBtn" title="Select Tool (V)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Select Tool"><path d="M12 2l4 8h-3v8h-2v-8H8z" fill="currentColor"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailPanBtn" title="Pan Tool (Space)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Pan Tool"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailDrawBtn" title="Draw Tool (D)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Draw Tool"><path d="M4 20l16-16M14 4h6v6" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailTextBtn" title="Text Tool (T)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Text Tool"><path d="M4 6V4h16v2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 6v14" stroke="currentColor" stroke-width="2"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailMeasureBtn" title="Measure Tool (M)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Measure Tool"><rect x="4" y="10" width="16" height="4" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 10v4M16 10v4" stroke="currentColor" stroke-width="2"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailFogBtn" title="Fog Tool (F)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Fog Tool"><ellipse cx="12" cy="12" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="14" rx="6" ry="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailEffectsBtn" title="Effects Tool (E)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Effects Tool"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2"/></svg>'
      + '</span></button>'
      + '<button class="combat-icon-btn" id="combatRailDiceBtn" title="Dice Roller (R)"><span class="combat-svg-icon">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Dice Roller"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>'
      + '</span></button>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-left-tools combat-editor-only" id="combatToolsPanel">'
      + '<div class="combat-panel-header" data-drag="tools" onclick="togglePanel(\'combatToolsPanel\')">Combat Scene <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
      + '<div class="combat-panel-body">'
      + '<div class="combat-label">Layer</div>'
      + '<div class="combat-chip-row" id="combatLayerRow"></div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Tool</div>'
      + '<div class="combat-chip-row" id="combatToolRow"></div>'
      + '<div class="combat-label" style="margin-top:.35rem;">VTT Toolbar</div>'
      + '<div class="combat-chip-row">'
      + '<button class="combat-chip" id="combatToolbarSelectBtn" title="Select Tool (V)">Select</button>'
      + '<button class="combat-chip" id="combatToolbarDrawBtn" title="Draw Tool (D)">Draw</button>'
      + '<button class="combat-chip" id="combatToolbarTextBtn" title="Text Tool (T)">Text</button>'
      + '<button class="combat-chip" id="combatToolbarMeasureBtn" title="Measure Tool (M)">Measure</button>'
      + '<button class="combat-chip" id="combatToolbarRulerBtn" title="Ruler Tool (R)">Ruler</button>'
      + '<button class="combat-chip" id="combatToolbarPanBtn" title="Pan Tool (Space)">Pan</button>'
      + '<button class="combat-chip" id="combatToolbarPingBtn" title="Ping Tool (P)">Ping</button>'
      + '<button class="combat-chip" id="combatToolbarEffectsBtn" title="Effects Tool (E)">Effects</button>'
      + '<button class="combat-chip" id="combatToolbarDiceBtn" title="Dice Roller">Dice</button>'
      + '<button class="combat-chip" id="combatToolbarTurnOrderBtn" title="Turn Order">Turn</button>'
      + '<button class="combat-chip" id="combatToolbarZoomInBtn" title="Zoom In">Zoom+</button>'
      + '<button class="combat-chip" id="combatToolbarZoomOutBtn" title="Zoom Out">Zoom-</button>'
      + '<button class="combat-chip" id="combatToolbarZoomResetBtn" title="Reset Zoom">100%</button>'
      + '</div>'
      + '<div class="combat-mini" style="margin-top:.15rem;">Zoom</div>'
      + '<input id="combatZoomSlider" type="range" min="50" max="230" step="5" value="100" style="width:100%;">'
      + '<div class="combat-label" style="margin-top:.35rem;">Measurement</div>'
      + '<div class="combat-chip-row">'
      + '<button class="combat-chip" id="combatMeasureShapeLineBtn" title="Line Measure Mode">Line</button>'
      + '<button class="combat-chip" id="combatMeasureShapeConeBtn" title="Cone Measure Mode">Cone</button>'
      + '<button class="combat-chip" id="combatMeasureShapeRadiusBtn" title="Radius Measure Mode">Radius</button>'
      + '</div>'
      + '<div class="combat-chip-row" style="margin-top:.2rem;">'
      + '<button class="combat-chip" id="combatMeasureSnapBtn" title="Snap to grid">Snap: On</button>'
      + '<button class="combat-chip" id="combatMeasureFadeBtn" title="Fade style">Fade: Linger</button>'
      + '</div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Fog of War</div>'
      + '<div class="combat-chip-row"><button class="combat-chip" id="combatFogToggleBtn" title="Toggle Fog of War">Fog Off</button><button class="combat-chip" id="combatFogBrushBtn" title="Brush Reveal">Brush Reveal</button><button class="combat-chip" id="combatFogClearBtn" title="Clear All Fog">Clear Fog</button></div>'
      + '<div class="combat-chip-row" style="margin-top:.2rem;"><button class="combat-chip" id="combatFogModeBtn" title="Fog Mode">Mode: Manual</button><button class="combat-chip" id="combatFogAdvanceBtn" title="Advance Reveal">Advance Reveal</button><button class="combat-chip" id="combatFogResetOrderBtn" title="Reset Reveal Order">Reset Order</button></div>'
      + '<div class="combat-mini" id="combatFogMeta">Revealed 0 hexes · Vision 3</div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Terrain / Object</div>'
      + '<select class="combat-select" id="combatPaintValue">'
      + '<option value="forest">forest</option><option value="marsh">marsh</option><option value="crags">crags</option><option value="lava">lava</option><option value="ruins">ruins</option><option value="water">water</option><option value="difficult terrain">difficult terrain</option><option value="obstacle">obstacle</option><option value="trap">trap</option><option value="shrine">shrine</option><option value="turret">turret</option><option value="door">door</option><option value="spawn">spawn</option><option value="wall">wall</option><option value="vision-blocker">vision-blocker</option><option value="wall-seg-e">wall-seg-e</option><option value="wall-seg-ne">wall-seg-ne</option><option value="wall-seg-nw">wall-seg-nw</option><option value="wall-seg-w">wall-seg-w</option><option value="wall-seg-sw">wall-seg-sw</option><option value="wall-seg-se">wall-seg-se</option><option value="1">elevation +1</option><option value="2">elevation +2</option><option value="3">elevation +3</option>'
      + '</select>'
      + '<div class="combat-mini">Hex editing modes: terrain, objects, hazards, lighting, weather, interactives, spawn points.</div>'
      + '<div class="combat-label" style="margin-top:.35rem;">Bestiary Drawer</div>'
      + '<div class="combat-feed" id="combatBestiaryDrawer"></div>'
      + '</div>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-right-rail" id="combatFeedPanel">'
      + '<div class="combat-panel-header" data-drag="feed" onclick="togglePanel(\'combatFeedPanel\')">Roll Checks <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
      + '<div class="combat-panel-body">'
      + '<div class="combat-chip-row" style="margin-bottom:.24rem;">'
      + '<button class="combat-chip" id="combatAssetsBtn" title="Open Asset Browser">Assets</button>'
      + '<button class="combat-chip" id="combatRailRulesBtn" title="Rules Reference">Rules</button>'
      + '<button class="combat-chip" id="combatSettingsBtn" title="Settings">Settings</button>'
      + '</div>'
      + '<div class="combat-action-block" style="margin-top:0;">'
      + '<div class="combat-label">Asset Browser</div>'
      + '<div class="combat-chip-row" id="combatAssetCategoryRow"></div>'
      + '<input class="combat-input" id="combatAssetSearch" placeholder="Search assets..." style="margin-top:.24rem;">'
      + '<div class="combat-feed" id="combatAssetBrowserFeed"></div>'
      + '</div>'
      + '<div id="combatInitiativeList"></div>'
      + '<div style="display:flex;gap:.24rem;margin-top:.26rem;"><button class="btn btn-xs" id="combatNextTurnBtn">Next Turn</button><button class="btn btn-xs" id="combatRollModeBtn">Auto Roll</button></div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Scene Opener</div>'
      + '<div id="combatSceneOpenerSummary" class="combat-mini">No opener active.</div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Last Roll</div>'
      + '<div id="combatLegacyResultMirror" class="combat-result-mirror" style="font-size:.82rem;line-height:1.5;">Roll results appear here.</div>'
      + '<div id="combatLastNotification" class="combat-result-mirror" style="margin-top:.2rem;font-size:.78rem;color:var(--teal);"></div>'
      + '</div>'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Roll Context</div>'
      + '<div id="combatLegacyStatusMirror" class="combat-result-mirror">Status bridge idle.</div>'
      + '<div id="combatLegacyRollModMirror" class="combat-result-mirror">Roll modifiers: none.</div>'
      + '<div id="combatLegacyActionInfoMirror" class="combat-result-mirror">Action details appear here.</div>'
      + '<div id="combatLegacyFlavorMirror" class="combat-result-mirror"></div>'
      + '<div class="combat-feed" id="combatLegacyRowsMirror"></div>'
      + '<div class="combat-feed" id="combatFeedLog" style="margin-top:.3rem;"></div>'
      + '</div>'
      + '</aside>'
      + '<aside class="combat-floating-panel combat-bottom-actions" id="combatActionsPanel">'
      + '<div class="combat-panel-header" data-drag="actions" onclick="togglePanel(\'combatActionsPanel\')">Token Actions <span style="float:right;font-size:.7rem;cursor:pointer;">◀</span></div>'
      + '<div class="combat-panel-body">'
      + '<div class="combat-action-block">'
      + '<div class="combat-label">Scene Snapshot</div>'
      + '<div id="combatSceneStatusGrid" class="combat-feed"></div>'
      + '</div>'
      + '<div id="combatSelectedSummary" class="combat-mini">Select a token.</div>'
      + '<div class="combat-action-block" style="margin-top:.2rem;">'
      + '<div class="combat-label">Token Strategy</div>'
      + '<div id="combatTokenSheetMirror" class="combat-result-mirror">Select a token to load Character Sheet context.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.24rem;margin-top:.2rem;">'
      + '<div><div class="combat-label">Target Enemy</div><select class="combat-select" id="combatTokenTargetSel"><option value="">Closest hostile</option></select></div>'
      + '<div><div class="combat-label">Token Action</div><select class="combat-select" id="combatTokenActionSel"><option value="">Choose action</option></select></div>'
      + '</div>'
      + '<div style="margin-top:.2rem;"><div class="combat-label">Cover Override</div><select class="combat-select" id="combatTargetCoverOverrideSel"><option value="auto">Auto (terrain/object)</option><option value="none">None (+0)</option><option value="light">Light (-1)</option><option value="heavy">Heavy (-2)</option></select></div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-top:.2rem;">'
      + '<button class="btn btn-xs" id="combatTokenExecuteActionBtn">Execute</button>'
      + '<button class="btn btn-xs" id="combatTokenEnemyActionBtn">Enemy Action</button>'
      + '<button class="btn btn-xs" id="combatLootBodyBtn">Loot Body</button>'
      + '</div>'
      + '<div id="combatTokenActionHelp" class="combat-mini" style="margin-top:.2rem;">No combat roll yet.</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:.24rem;align-items:end;margin-top:.2rem;">'
      + '<div><div class="combat-label">Token Name</div><input class="combat-input" id="combatSelectedName" type="text" maxlength="64" placeholder="Token name"></div>'
      + '<div><div class="combat-label">Dread</div><input class="combat-input" id="combatSelectedDread" type="number" min="1" max="20"></div>'
      + '<button class="btn btn-xs" id="combatSaveTokenBtn">Save</button>'
      + '<div><div class="combat-label">HP</div><input class="combat-input" id="combatSelectedHp" type="number" min="0"></div>'
      + '<div><div class="combat-label">Elevation</div><input class="combat-input" id="combatSelectedElevation" type="number" min="0" max="9"></div>'
      + '<button class="btn btn-xs" id="combatUploadTokenBtn">Portrait</button>'
      + '<button class="btn btn-xs btn-red" id="combatDeleteTokenBtn">Delete Selected</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:.24rem;align-items:end;margin-top:.28rem;">'
      + '<div><div class="combat-label">Condition</div><input class="combat-input" id="combatRoundEffectName" type="text" maxlength="30" placeholder="Burning"></div>'
      + '<div><div class="combat-label">Stress/Round</div><input class="combat-input" id="combatRoundEffectStress" type="number" min="0" max="20" value="1"></div>'
      + '<div><div class="combat-label">Rounds</div><input class="combat-input" id="combatRoundEffectRounds" type="number" min="1" max="20" value="2"></div>'
      + '<button class="btn btn-xs" id="combatApplyRoundEffectBtn">Apply Condition</button>'
      + '</div>'
      + '<div id="combatTokenRoundEffectsList" class="combat-feed" style="margin-top:.24rem;"></div>'
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

  function parseQuickEditValue(current, raw) {
    var txt = String(raw || '').trim();
    if (!txt) return null;
    if (/^[+-]\d+$/.test(txt)) return Math.max(0, Number(current || 0) + Number(txt));
    if (/^\d+$/.test(txt)) return Math.max(0, Number(txt));
    return null;
  }

  function applyTokenQuickEdit(tokenId, statKey, rawValue) {
    var state = store.getState();
    var token = (state.tokens || []).find(function (entry) { return entry && String(entry.id) === String(tokenId); }) || null;
    if (!token) return false;
    var current = Number(token[statKey] || 0);
    var nextVal = parseQuickEditValue(current, rawValue);
    if (nextVal === null) {
      safeNotif('Invalid value. Use a number like 12 or delta like -5.', 'warn');
      return false;
    }
    store.setState(function (inner) {
      var next = Object.assign({}, inner);
      next.tokens = (inner.tokens || []).map(function (entry) {
        if (!entry || String(entry.id) !== String(tokenId)) return entry;
        var updated = Object.assign({}, entry);
        updated[statKey] = nextVal;
        if (statKey === 'hp') updated.maxHp = Math.max(Number(updated.maxHp || 0), nextVal);
        if (statKey === 'dread' && Number(updated.deathNumber || 0) < nextVal) updated.deathNumber = nextVal;
        return updated;
      });
      persist(next);
      return next;
    });
    addHistory((token.name || 'Token') + ' ' + statKey.toUpperCase() + ' set to ' + nextVal + '.');
    drawBoard();
    updateUiPanels();
    return true;
  }

  function currentPingIdentity() {
    return String(window.S && window.S.name || 'Wayfarer').trim() || 'Wayfarer';
  }

  function colorForPingIdentity(identity) {
    var palette = ['#49c9bb', '#e3bc5e', '#d05353', '#6aa8ff', '#9bdb5a', '#ff8a5b', '#c690ff'];
    var src = String(identity || 'table');
    var h = 0;
    for (var i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  function hexToRgb(hex) {
    var clean = String(hex || '').replace('#', '');
    if (clean.length !== 6) return { r: 73, g: 201, b: 187 };
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function placeTablePing(q, r, sourceLabel) {
    var identity = String(sourceLabel || currentPingIdentity());
    var color = colorForPingIdentity(identity);
    store.setState(function (state) {
      var next = Object.assign({}, state, {
        ping: {
          q: Number(q || 0),
          r: Number(r || 0),
          at: Date.now(),
          source: identity,
          color: color
        }
      });
      persist(next);
      return next;
    });
    addHistory('Ping placed at ' + toKey(q, r) + ' by ' + identity + '.');
    safeNotif(identity + ' pinged tabletop.', 'info');
    (function animatePing() {
      var st = store.getState();
      var ping = st && st.ping;
      if (!ping) return;
      var age = Date.now() - Number(ping.at || 0);
      if (age > 1200) {
        store.setState(function (state) {
          var next = Object.assign({}, state, { ping: null });
          persist(next);
          return next;
        });
        drawBoard();
        return;
      }
      drawBoard();
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(animatePing);
    })();
  }

  function showInlineBubbleEditor(hit, token, canvas) {
    var input = document.getElementById('combatBubbleInlineInput');
    if (!input || !hit || !token) return;
    input.dataset.tokenId = String(hit.tokenId);
    input.dataset.statKey = String(hit.statKey);
    input.dataset.current = String(token[hit.statKey] || 0);
    input.style.display = 'block';
    input.style.left = Math.round(hit.cx - (hit.w / 2)) + 'px';
    input.style.top = Math.round(hit.cy - 10) + 'px';
    input.value = String(token[hit.statKey] || 0);
    input.select();
    input.focus();
  }

  function hideInlineBubbleEditor(commit) {
    var input = document.getElementById('combatBubbleInlineInput');
    if (!input || input.style.display === 'none') return;
    if (commit) {
      var tokenId = String(input.dataset.tokenId || '');
      var statKey = String(input.dataset.statKey || '');
      var raw = String(input.value || '');
      if (tokenId && statKey) applyTokenQuickEdit(tokenId, statKey, raw);
    }
    input.style.display = 'none';
    input.value = '';
    input.dataset.tokenId = '';
    input.dataset.statKey = '';
    input.dataset.current = '';
  }

  function formatLootItemLabel(item) {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return String(item || 'Unknown Item');
    if (item.name) return String(item.name);
    if (item.id) return String(item.id);
    return String(item.label || 'Unknown Item');
  }

  function closeLootPopup() {
    var card = document.getElementById('combatLootPopupCard');
    if (!card) return;
    card.style.display = 'none';
    card.dataset.tokenId = '';
  }

  function renderLootPopupForToken(tokenId) {
    var card = document.getElementById('combatLootPopupCard');
    var title = document.getElementById('combatLootPopupTitle');
    var meta = document.getElementById('combatLootPopupMeta');
    var listEl = document.getElementById('combatLootPopupList');
    var takeAllBtn = document.getElementById('combatLootTakeAllBtn');
    var takeSelectedBtn = document.getElementById('combatLootTakeSelectedBtn');
    if (!card || !title || !meta || !listEl || !takeAllBtn || !takeSelectedBtn) return false;
    var state = store.getState();
    var token = byId(tokenId);
    var drop = getLootDropForToken(state, tokenId);
    var items = drop && Array.isArray(drop.items) ? drop.items : [];
    if (!token || !drop || drop.claimed || !items.length) {
      closeLootPopup();
      return false;
    }
    title.textContent = String(token.name || 'Body') + ' Loot';
    meta.textContent = 'Hex ' + toKey(token.q, token.r) + ' \u00b7 ' + items.length + ' item' + (items.length === 1 ? '' : 's') + ' remaining';
    listEl.innerHTML = items.map(function (item, idx) {
      var label = formatLootItemLabel(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<label style="display:flex;align-items:center;gap:.35rem;padding:.12rem .14rem;border:1px solid rgba(255,255,255,.08);border-radius:6px;">'
        + '<input type="checkbox" data-loot-idx="' + idx + '">'
        + '<span style="font:.8rem Rajdhani,sans-serif;color:#f7f7f7;">' + label + '</span>'
        + '</label>';
    }).join('');
    takeAllBtn.disabled = !items.length;
    takeSelectedBtn.disabled = !items.length;
    card.dataset.tokenId = String(tokenId || '');
    return true;
  }

  function openLootPopupForToken(tokenId, anchorX, anchorY) {
    var card = document.getElementById('combatLootPopupCard');
    var wrap = document.getElementById('combatCanvasWrap');
    if (!card || !wrap) return;
    if (!renderLootPopupForToken(tokenId)) return;
    card.style.display = 'block';
    card.style.position = 'fixed'; // Ensure overlay is fixed to viewport
    // Calculate viewport-relative position
    var rect = wrap.getBoundingClientRect();
    var fallbackX = Math.round(rect.left + rect.width / 2);
    var fallbackY = Math.round(rect.top + rect.height / 2);
    var x = typeof anchorX === 'number' ? anchorX + rect.left : fallbackX;
    var y = typeof anchorY === 'number' ? anchorY + rect.top : fallbackY;
    var cw = Math.max(220, Number(card.offsetWidth || 260));
    var ch = Math.max(120, Number(card.offsetHeight || 220));
    var left = Math.min(Math.max(8, x + 14), window.innerWidth - cw - 8);
    var top = Math.min(Math.max(8, y + 14), window.innerHeight - ch - 8);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.setAttribute('tabindex', '-1');
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    // Prevent scroll jumps on open
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  function takeLootFromTokenDrop(tokenId, selectedIndexes, sourceLabel) {
    var state = store.getState();
    var token = byId(tokenId);
    var drop = token ? getLootDropForToken(state, tokenId) : null;
    if (!token || !drop || drop.claimed) {
      safeNotif('No loot available on this body.', 'warn');
      closeLootPopup();
      return 0;
    }
    var items = Array.isArray(drop.items) ? drop.items.slice() : [];
    if (!items.length) {
      safeNotif('No loot available on this body.', 'warn');
      closeLootPopup();
      return 0;
    }
    var rawIndexes = Array.isArray(selectedIndexes) ? selectedIndexes.slice() : items.map(function (_row, idx) { return idx; });
    var unique = {};
    var indexes = rawIndexes.map(function (idx) { return Number(idx); }).filter(function (idx) {
      return Number.isFinite(idx) && idx >= 0 && idx < items.length && !unique[idx] && (unique[idx] = true);
    }).sort(function (a, b) { return a - b; });
    if (!indexes.length) {
      safeNotif('Pick at least one loot item.', 'warn');
      return 0;
    }
    var selectedItems = indexes.map(function (idx) { return items[idx]; });
    selectedItems.forEach(function (item) {
      if (typeof window.addToBackpack === 'function') {
        try { window.addToBackpack(item); } catch (_err) {}
      }
    });
    var kept = items.filter(function (_item, idx) { return indexes.indexOf(idx) < 0; });
    store.setState(function (inner) {
      var next = Object.assign({}, inner);
      var rules = ensureLootDrops(inner);
      var key = String(tokenId);
      var row = rules.lootDrops[key] || null;
      if (row) {
        row.items = kept;
        row.claimed = !kept.length;
        rules.lootDrops[key] = row;
      }
      next.sceneRules = rules;
      persist(next);
      return next;
    });
    var pulledLabels = selectedItems.map(formatLootItemLabel);
    addHistory((sourceLabel || 'Loot') + ': ' + String(token.name || 'body') + ' -> ' + pulledLabels.join(', ') + '.');
    safeNotif('Collected ' + selectedItems.length + ' loot item' + (selectedItems.length === 1 ? '' : 's') + '.', 'good');
    drawBoard();
    updateUiPanels();
    if (kept.length) renderLootPopupForToken(tokenId);
    else closeLootPopup();
    return selectedItems.length;
  }

  var backgroundCache = { src: '', img: null };
  var bubbleHotspots = [];
  var floatingNumbers = [];

  function createFloatingNumber(x, y, text, type) {
    var id = uid('float');
    var num = {
      id: id,
      x: x,
      y: y,
      text: String(text || ''),
      type: String(type || 'damage'),
      createdAt: Date.now(),
      lifetime: 1200
    };
    floatingNumbers.push(num);
    return id;
  }

  function updateFloatingNumbers() {
    var now = Date.now();
    floatingNumbers = floatingNumbers.filter(function (num) {
      return (now - num.createdAt) < num.lifetime;
    });
  }

  function getConditionTypeForLabel(label) {
    var lower = String(label || '').toLowerCase();
    if (lower.indexOf('burn') >= 0) return 'burn';
    if (lower.indexOf('chill') >= 0 || lower.indexOf('freeze') >= 0 || lower.indexOf('cold') >= 0) return 'chill';
    if (lower.indexOf('stun') >= 0) return 'stun';
    if (lower.indexOf('poison') >= 0) return 'poison';
    if (lower.indexOf('fear') >= 0 || lower.indexOf('terrif') >= 0) return 'fear';
    if (lower.indexOf('bleed') >= 0) return 'bleed';
    return 'burn';
  }

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
    var board = normalizeBoard(state.board);

    ctx.clearRect(0, 0, rect.width, rect.height);

    drawBackground(ctx, board);
    drawGridAndTokens(ctx, state, rect.width, rect.height);
  }

  function drawGridAndTokens(ctx, state, w, h) {
    var board = state.board;
    var size = Number(board.size || 42) * Number(board.zoom || 1);
    bubbleHotspots = [];
    for (var r = -board.rows; r <= board.rows; r++) {
      for (var q = -board.cols; q <= board.cols; q++) {
        var p = axialToPixel(q, r, size, board.panX, board.panY);
        if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80) continue;

        var key = toKey(q, r);
        var terrain = state.layers.terrain[key] || '';
        var object = state.layers.objects[key] || '';
        var hazard = state.layers.hazards[key] || '';
        var lighting = String(state.layers.lighting[key] || '');
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

        if (lighting === 'wall' || lighting === 'vision-blocker') {
          ctx.save();
          ctx.strokeStyle = lighting === 'wall' ? 'rgba(255,94,94,.95)' : 'rgba(122,88,210,.95)';
          ctx.lineWidth = 2.4;
          drawHex(ctx, p.x, p.y, size - 5.5);
          ctx.stroke();
          ctx.fillStyle = 'rgba(0,0,0,.65)';
          ctx.fillRect(p.x - 10, p.y - 8, 20, 16);
          ctx.fillStyle = '#fff';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(lighting === 'wall' ? 'W' : 'VB', p.x, p.y + 3);
          ctx.restore();
        }

        var segMap = state.layers.wallSegments && state.layers.wallSegments[key] || null;
        if (segMap && typeof segMap === 'object') {
          var corners = [];
          for (var ci = 0; ci < 6; ci++) {
            var angle = Math.PI / 180 * (60 * ci - 30);
            corners.push({ x: p.x + (size - 3) * Math.cos(angle), y: p.y + (size - 3) * Math.sin(angle) });
          }
          var edgeMap = {
            e: [0, 1], se: [1, 2], sw: [2, 3], w: [3, 4], nw: [4, 5], ne: [5, 0]
          };
          Object.keys(segMap).forEach(function (k) {
            if (!segMap[k] || !edgeMap[k]) return;
            var pair = edgeMap[k];
            var a = corners[pair[0]];
            var b = corners[pair[1]];
            ctx.save();
            ctx.strokeStyle = 'rgba(255,94,94,.98)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
          });
        }

        if (state.fog && String(state.fog.revealMode || 'manual') === 'ordered' && state.fog.revealOrder && state.fog.revealOrder[key]) {
          ctx.save();
          ctx.fillStyle = 'rgba(73,201,187,.95)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(state.fog.revealOrder[key]), p.x, p.y - 10);
          ctx.restore();
        }

        if (state.fog && state.fog.enabled && state.fog.showMask && !isHexRevealed(state, q, r)) {
          drawHex(ctx, p.x, p.y, size - 1.6);
          ctx.fillStyle = 'rgba(2,3,7,.74)';
          ctx.fill();
        }

        var labelText = String(state.layers && state.layers.labels && state.layers.labels[key] || '').trim();
        if (labelText) {
          ctx.save();
          ctx.fillStyle = 'rgba(235,239,249,.96)';
          ctx.font = '11px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labelText.slice(0, 28), p.x, p.y + 4);
          ctx.restore();
        }
      }
    }

    var selectedForMove = byId(state.selectedTokenId);
    var moveBudget = getMovementActionsAvailable(state, selectedForMove);
    if (selectedForMove && moveBudget > 0) {
      for (var mr = -moveBudget; mr <= moveBudget; mr++) {
        for (var mq = -moveBudget; mq <= moveBudget; mq++) {
          var targetQ = Number(selectedForMove.q || 0) + mq;
          var targetR = Number(selectedForMove.r || 0) + mr;
          var dist = hexDistance({ q: Number(selectedForMove.q || 0), r: Number(selectedForMove.r || 0) }, { q: targetQ, r: targetR });
          if (dist <= 0 || dist > moveBudget) continue;
          if (isBlocked(targetQ, targetR)) continue;
          if (nearestTokenAt(targetQ, targetR)) continue;
          var mp = axialToPixel(targetQ, targetR, size, board.panX, board.panY);
          ctx.save();
          drawHex(ctx, mp.x, mp.y, size - 4);
          ctx.fillStyle = String(selectedForMove.faction) === 'monster' ? 'rgba(208,83,83,.18)' : 'rgba(73,201,187,.2)';
          ctx.fill();
          ctx.strokeStyle = String(selectedForMove.faction) === 'monster' ? 'rgba(208,83,83,.55)' : 'rgba(73,201,187,.62)';
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    (state.tokens || []).forEach(function (token) {
      var p = axialToPixel(Number(token.q || 0), Number(token.r || 0), size, board.panX, board.panY);
      var radius = Math.max(14, (size * 0.32) * Math.max(1, Number(token.size || 1)));
      var dead = isTokenDead(token);
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = String(token.faction) === 'monster' ? 'rgba(160,58,58,.92)' : 'rgba(47,154,144,.92)';
      if (dead) ctx.fillStyle = 'rgba(94,98,110,.7)';
      ctx.fill();
      if (token.image && !dead) {
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
      ctx.fillText(String(token.name || 'Token') + (dead ? ' [DEAD]' : ''), p.x, p.y - radius - 8);
      ctx.fillStyle = 'rgba(230,230,230,.95)';
      ctx.fillText('HP ' + Number(token.hp || 0) + '/' + Number(token.maxHp || token.hp || 0), p.x, p.y + radius + 12);

      if (dead) {
        ctx.strokeStyle = 'rgba(255,96,96,.92)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - radius + 4, p.y - radius + 4);
        ctx.lineTo(p.x + radius - 4, p.y + radius - 4);
        ctx.moveTo(p.x + radius - 4, p.y - radius + 4);
        ctx.lineTo(p.x - radius + 4, p.y + radius - 4);
        ctx.stroke();
      }

      var drop = getLootDropForToken(state, token.id);
      if (drop && !drop.claimed) {
        ctx.fillStyle = 'rgba(227,188,94,.96)';
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.fillText('LOOT', p.x, p.y + radius + 24);
      }

      // ===== HEALTH BAR =====
      var maxHp = Math.max(1, Number(token.maxHp || token.hp || 1));
      var currentHp = Math.max(0, Number(token.hp || 0));
      var hpPercent = maxHp > 0 ? currentHp / maxHp : 0;
      var healthBarWidth = radius * 2;
      var healthBarHeight = 5;
      var healthBarX = p.x - (healthBarWidth / 2);
      var healthBarY = p.y + radius + 4;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      var hpColor = hpPercent > 0.5 ? 'rgba(45, 154, 123, 0.9)' : (hpPercent > 0.25 ? 'rgba(196, 97, 58, 0.9)' : 'rgba(208, 83, 83, 0.95)');
      ctx.fillStyle = hpColor;
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * hpPercent, healthBarHeight);
      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      ctx.restore();

      // ===== CONDITION ICONS =====
      var activeEffects = (state.tokenRoundEffects || []).filter(function (effect) {
        return effect && String(effect.targetTokenId || '') === String(token.id || '') && Number(effect.roundsLeft || 0) > 0;
      });
      if (activeEffects.length) {
        ctx.save();
        var iconSize = 14;
        var iconSpacing = 2;
        var totalIconWidth = (iconSize + iconSpacing) * activeEffects.length - iconSpacing;
        var iconStartX = p.x - (totalIconWidth / 2);
        var iconY = p.y + radius + 14;
        activeEffects.forEach(function (effect, idx) {
          var iconX = iconStartX + idx * (iconSize + iconSpacing);
          var condType = getConditionTypeForLabel(String(effect.label || ''));
          var colorMap = {
            'burn': '#ff9b5c',
            'chill': '#7dd3ff',
            'stun': '#ffd688',
            'poison': '#9bdb5a',
            'fear': '#c690ff',
            'bleed': '#ff6b6b'
          };
          var color = colorMap[condType] || '#e3bc5e';
          ctx.beginPath();
          ctx.arc(iconX + (iconSize / 2), iconY, iconSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.3)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var iconLabel = String(effect.label || '').charAt(0).toUpperCase();
          ctx.fillText(iconLabel, iconX + (iconSize / 2), iconY);
          if (Number(effect.roundsLeft || 0) > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px Rajdhani, sans-serif';
            ctx.fillText(String(Math.max(0, Number(effect.roundsLeft || 0))), iconX + (iconSize / 2), iconY + 8);
          }
        });
        ctx.restore();
      }

      // Quick-edit bubbles above token. Click bubble to edit with absolute or +/- delta.
      var bubbleY = p.y - radius - 34;
      var bubbles = [
        { key: 'hp', label: 'HP ' + Number(token.hp || 0), color: 'rgba(47,154,144,.88)' }
      ];
      if (!dead && String(token.faction) === 'monster') {
        bubbles.push({ key: 'dread', label: 'DD ' + Math.max(4, Number(token.dread || token.codexDread || 6)), color: 'rgba(208,83,83,.88)' });
        bubbles.push({ key: 'deathNumber', label: 'DN ' + Math.max(1, Number(token.deathNumber || token.dread || 6)), color: 'rgba(227,188,94,.88)' });
      }
      var bw = 52;
      var bh = 16;
      var gap = 4;
      var totalW = bubbles.length * bw + (bubbles.length - 1) * gap;
      var sx = p.x - totalW / 2;
      bubbles.forEach(function (b, idx) {
        var bx = sx + idx * (bw + gap);
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.strokeStyle = 'rgba(255,255,255,.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, bubbleY, bw, bh, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, bx + bw / 2, bubbleY + bh - 5);
        ctx.restore();
        bubbleHotspots.push({ tokenId: String(token.id), statKey: String(b.key), x: bx, y: bubbleY, w: bw, h: bh, cx: bx + (bw / 2), cy: bubbleY + (bh / 2) });
      });

      ctx.restore();
    });

    for (var fr = -board.rows; fr <= board.rows; fr++) {
      for (var fq = -board.cols; fq <= board.cols; fq++) {
        var fgKey = toKey(fq, fr);
        var fg = String(state.layers.foreground && state.layers.foreground[fgKey] || '').toLowerCase();
        if (!fg) continue;
        var fp = axialToPixel(fq, fr, size, board.panX, board.panY);
        if (fp.x < -80 || fp.y < -80 || fp.x > w + 80 || fp.y > h + 80) continue;
        ctx.save();
        if (fg.indexOf('canopy') >= 0 || fg.indexOf('tree') >= 0) {
          drawHex(ctx, fp.x, fp.y, size - 5.5);
          ctx.fillStyle = 'rgba(57,130,88,.34)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(134,219,171,.44)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.fillStyle = 'rgba(214,243,220,.95)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CANOPY', fp.x, fp.y + 3);
        } else if (fg.indexOf('balcony') >= 0 || fg.indexOf('walkway') >= 0) {
          drawHex(ctx, fp.x, fp.y, size - 6.5);
          ctx.fillStyle = 'rgba(120,140,196,.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(175,196,255,.62)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.fillStyle = 'rgba(226,234,255,.95)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('BAL', fp.x, fp.y + 3);
        } else if (fg.indexOf('weather') >= 0 || fg.indexOf('fog') >= 0 || fg.indexOf('ash') >= 0 || fg.indexOf('storm') >= 0 || fg.indexOf('rain') >= 0) {
          drawHex(ctx, fp.x, fp.y, size - 3.8);
          ctx.fillStyle = 'rgba(206,223,245,.22)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(206,223,245,.38)';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(226,236,250,.92)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('WX', fp.x, fp.y + 3);
        } else if (fg.indexOf('elev') >= 0 || fg.indexOf('ledge') >= 0 || fg.indexOf('high') >= 0) {
          drawHex(ctx, fp.x, fp.y, size - 6);
          ctx.strokeStyle = 'rgba(227,188,94,.78)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(245,225,164,.94)';
          ctx.font = '10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HIGH', fp.x, fp.y + 3);
        } else {
          drawHex(ctx, fp.x, fp.y, size - 5);
          ctx.fillStyle = 'rgba(200,200,200,.2)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(240,240,240,.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (state.ruler && state.ruler.active && state.ruler.start && state.ruler.end) {
      var opts = Object.assign({ shape: 'line' }, state.rulerOptions || {});
      var s = state.ruler.startPx && typeof state.ruler.startPx.x === 'number'
        ? { x: Number(state.ruler.startPx.x), y: Number(state.ruler.startPx.y) }
        : axialToPixel(state.ruler.start.q, state.ruler.start.r, size, board.panX, board.panY);
      var e = state.ruler.endPx && typeof state.ruler.endPx.x === 'number'
        ? { x: Number(state.ruler.endPx.x), y: Number(state.ruler.endPx.y) }
        : axialToPixel(state.ruler.end.q, state.ruler.end.r, size, board.panX, board.panY);
      ctx.strokeStyle = 'rgba(73,201,187,.95)';
      ctx.fillStyle = 'rgba(73,201,187,.16)';
      ctx.lineWidth = 2.2;
      if (String(opts.shape || 'line') === 'radius') {
        var radiusPx = Math.max(4, Math.hypot(e.x - s.x, e.y - s.y));
        ctx.beginPath();
        ctx.arc(s.x, s.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (String(opts.shape || 'line') === 'cone') {
        var ang = Math.atan2(e.y - s.y, e.x - s.x);
        var len = Math.max(8, Math.hypot(e.x - s.x, e.y - s.y));
        var spread = Math.PI / 6;
        var l = { x: s.x + Math.cos(ang - spread) * len, y: s.y + Math.sin(ang - spread) * len };
        var r = { x: s.x + Math.cos(ang + spread) * len, y: s.y + Math.sin(ang + spread) * len };
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(73,201,187,.96)';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.fillText(String(state.ruler.distance) + ' hexes · ' + state.ruler.label, (s.x + e.x) / 2, (s.y + e.y) / 2 - 8);
    }

    if (state.ping && typeof state.ping === 'object') {
      var pingAge = Date.now() - Number(state.ping.at || 0);
      if (pingAge <= 1200) {
        var center = axialToPixel(Number(state.ping.q || 0), Number(state.ping.r || 0), size, board.panX, board.panY);
        var t = pingAge / 1200;
        var radiusPulse = 8 + t * 60;
        ctx.save();
        var rgb = hexToRgb(state.ping.color || '#49c9bb');
        ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (1 - t) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radiusPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (1 - t) + ')';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ===== FLOATING NUMBERS OVERLAY =====
    updateFloatingNumbers();
    floatingNumbers.forEach(function (num) {
      var age = Date.now() - num.createdAt;
      var progress = age / num.lifetime;
      var offsetY = -60 * progress;
      var opacity = 1 - progress;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = 'bold 16px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      var color = '#ff6b6b';
      if (num.type === 'heal') color = '#7dd3ff';
      else if (num.type === 'crit') color = '#ffd688';
      else if (num.type === 'miss') color = '#9fa7bc';
      ctx.fillStyle = color;
      ctx.fillText(num.text, num.x, num.y + offsetY);
      ctx.restore();
    });
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
    syncWayfarerTokenHealthFromSheet();
    var state = ensureActionBudgetMap(ensureInitiative(normalizeCombatSceneState(store.getState())));
    syncWayfarerCombatActionBudget(false);
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
      playModeBtn.textContent = state.playMode ? 'Build View' : 'Play View';
      playModeBtn.className = state.playMode ? 'btn btn-xs' : 'btn btn-xs btn-teal';
    }

    var layers = ['terrain', 'objects', 'hazards', 'elevation', 'lighting', 'weather', 'foreground', 'interactives', 'spawns'];
    var tools = ['select', 'paint', 'erase', 'text', 'fog', 'ruler', 'pan', 'ping'];

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
      var options = getExpandedPaintOptions(state);
      var hash = options.join('|');
      if (paintSel.getAttribute('data-options-hash') !== hash) {
        paintSel.innerHTML = options.map(function (opt) {
          return '<option value="' + String(opt).replace(/"/g, '&quot;') + '">' + String(opt) + '</option>';
        }).join('');
        paintSel.setAttribute('data-options-hash', hash);
      }
      paintSel.value = String(state.paintValue || 'forest');
      paintSel.onchange = function () { store.setState({ paintValue: String(paintSel.value || 'forest') }); };
    }

    var fogMeta = document.getElementById('combatFogMeta');
    if (fogMeta) {
      var revealedCount = Object.keys(state.fog && state.fog.revealed || {}).length;
      var mode = String(state.fog && state.fog.revealMode || 'manual');
      var step = Math.max(0, Number(state.fog && state.fog.revealStep || 0));
      fogMeta.textContent = 'Revealed ' + revealedCount + ' hexes · Vision ' + Number(state.fog && state.fog.visionRadius || 0) + ' · Mode ' + mode + (mode === 'ordered' ? (' · Step ' + step) : '');
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
    var fogModeBtn = document.getElementById('combatFogModeBtn');
    if (fogModeBtn) {
      var modeLabel = String(state.fog && state.fog.revealMode || 'manual');
      fogModeBtn.textContent = 'Mode: ' + modeLabel.charAt(0).toUpperCase() + modeLabel.slice(1);
    }

    var zoomSlider = document.getElementById('combatZoomSlider');
    if (zoomSlider) {
      zoomSlider.value = String(Math.round(Math.max(0.5, Math.min(2.3, Number(state.board && state.board.zoom || 1))) * 100));
    }

    var measureShapeLineBtn = document.getElementById('combatMeasureShapeLineBtn');
    var measureShapeConeBtn = document.getElementById('combatMeasureShapeConeBtn');
    var measureShapeRadiusBtn = document.getElementById('combatMeasureShapeRadiusBtn');
    var measureSnapBtn = document.getElementById('combatMeasureSnapBtn');
    var measureFadeBtn = document.getElementById('combatMeasureFadeBtn');
    var ro = Object.assign({ shape: 'line', fadeDelay: 'linger', snapToGrid: true }, state.rulerOptions || {});
    if (measureShapeLineBtn) measureShapeLineBtn.className = 'combat-chip ' + (ro.shape === 'line' ? 'on' : '');
    if (measureShapeConeBtn) measureShapeConeBtn.className = 'combat-chip ' + (ro.shape === 'cone' ? 'on' : '');
    if (measureShapeRadiusBtn) measureShapeRadiusBtn.className = 'combat-chip ' + (ro.shape === 'radius' ? 'on' : '');
    if (measureSnapBtn) {
      measureSnapBtn.className = 'combat-chip ' + (ro.snapToGrid ? 'on' : '');
      measureSnapBtn.textContent = 'Snap: ' + (ro.snapToGrid ? 'On' : 'Off');
    }
    if (measureFadeBtn) {
      measureFadeBtn.className = 'combat-chip ' + (ro.fadeDelay === 'linger' ? 'on' : '');
      measureFadeBtn.textContent = 'Fade: ' + (ro.fadeDelay === 'linger' ? 'Linger' : 'Instant');
    }

    var railToolMap = {
      select: 'combatRailSelectBtn',
      pan: 'combatRailPanBtn',
      paint: 'combatRailDrawBtn',
      text: 'combatRailTextBtn',
      ruler: 'combatRailMeasureBtn',
      fog: 'combatRailFogBtn'
    };
    Object.keys(railToolMap).forEach(function (toolKey) {
      var node = document.getElementById(railToolMap[toolKey]);
      if (!node) return;
      node.classList.toggle('active', String(state.activeTool || '') === toolKey);
    });

    var assetCategoryRow = document.getElementById('combatAssetCategoryRow');
    var assetSearch = document.getElementById('combatAssetSearch');
    var assetFeed = document.getElementById('combatAssetBrowserFeed');
    if (assetCategoryRow && assetSearch && assetFeed) {
      var cats = ['heroes', 'villains', 'townsfolk', 'battlemaps', 'objects'];
      var ab = Object.assign({ category: 'heroes', query: '' }, state.assetBrowser || {});
      assetCategoryRow.innerHTML = cats.map(function (c) {
        return '<button class="combat-chip ' + (ab.category === c ? 'on' : '') + '" data-asset-cat="' + c + '">' + c + '</button>';
      }).join('');
      Array.prototype.slice.call(assetCategoryRow.querySelectorAll('[data-asset-cat]')).forEach(function (btn) {
        btn.onclick = function () {
          var c = String(btn.getAttribute('data-asset-cat') || 'heroes');
          store.setState(function (inner) {
            var next = Object.assign({}, inner);
            next.assetBrowser = Object.assign({}, inner.assetBrowser || {}, { category: c });
            persist(next);
            return next;
          });
          updateUiPanels();
        };
      });

      assetSearch.value = String(ab.query || '');
      if (!assetSearch._boundAssetSearch) {
        assetSearch._boundAssetSearch = true;
        assetSearch.oninput = function () {
          var q = String(assetSearch.value || '');
          store.setState(function (inner) {
            var next = Object.assign({}, inner);
            next.assetBrowser = Object.assign({}, inner.assetBrowser || {}, { query: q });
            persist(next);
            return next;
          });
          updateUiPanels();
        };
      }

      var codex = Array.isArray(state.codexBestiary) ? state.codexBestiary : [];
      var heroAssets = [
        { id: 'hero-wayfarer', name: canonicalWayfarerName(), action: 'add-wayfarer' },
        { id: 'hero-ally-scout', name: 'Ally Scout', action: 'spawn-ally' },
        { id: 'hero-ally-warden', name: 'Ally Warden', action: 'spawn-ally' }
      ];
      var villainAssets = codex.slice(0, 32).map(function (entry) {
        return { id: String(entry.id || uid('vill')), name: String(entry.name || 'Enemy'), action: 'spawn-villain', payload: entry };
      });
      var townsfolkAssets = [
        { id: 'town-guide', name: 'Guide', action: 'spawn-npc' },
        { id: 'town-merchant', name: 'Merchant', action: 'spawn-npc' },
        { id: 'town-guard', name: 'Town Guard', action: 'spawn-npc' },
        { id: 'town-healer', name: 'Field Healer', action: 'spawn-npc' }
      ];
      var battlemapsAssets = [
        { id: 'map-blank', name: 'Blank Arena 15x15', action: 'map-preset', payload: { cols: 15, rows: 15, weather: 'none' } },
        { id: 'map-urban', name: 'Urban Grid 20x20', action: 'map-preset', payload: { cols: 20, rows: 20, weather: 'none' } },
        { id: 'map-fog', name: 'Fog Valley 18x12', action: 'map-preset', payload: { cols: 18, rows: 12, weather: 'fog' } },
        { id: 'map-storm', name: 'Storm Deck 18x10', action: 'map-preset', payload: { cols: 18, rows: 10, weather: 'storm' } }
      ];
      var objectAssets = ['obstacle', 'door', 'turret', 'trap', 'shrine', 'spawn', 'wall', 'vision-blocker'].map(function (name) {
        return { id: 'obj-' + name, name: name, action: 'paint-object', payload: name };
      });

      var pool = heroAssets;
      if (ab.category === 'villains') pool = villainAssets;
      else if (ab.category === 'townsfolk') pool = townsfolkAssets;
      else if (ab.category === 'battlemaps') pool = battlemapsAssets;
      else if (ab.category === 'objects') pool = objectAssets;

      var qLower = String(ab.query || '').toLowerCase();
      var filtered = pool.filter(function (item) {
        return !qLower || String(item.name || '').toLowerCase().indexOf(qLower) >= 0;
      }).slice(0, 48);

      assetFeed.innerHTML = filtered.length
        ? filtered.map(function (item) {
          return '<div class="combat-feed-line" style="display:flex;align-items:center;justify-content:space-between;gap:.3rem;">'
            + '<span>' + String(item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>'
            + '<button class="btn btn-xs" data-asset-action="' + String(item.action || '') + '" data-asset-id="' + String(item.id || '') + '">Use</button>'
            + '</div>';
        }).join('')
        : '<div class="combat-feed-line">No assets found.</div>';

      Array.prototype.slice.call(assetFeed.querySelectorAll('[data-asset-action]')).forEach(function (btn) {
        btn.onclick = function () {
          var action = String(btn.getAttribute('data-asset-action') || '');
          var id = String(btn.getAttribute('data-asset-id') || '');
          var actor = byId(store.getState().selectedTokenId);
          var baseQ = actor ? Number(actor.q || 0) : 0;
          var baseR = actor ? Number(actor.r || 0) : 0;
          var chosen = filtered.find(function (item) { return String(item.id || '') === id; }) || null;
          if (!chosen) return;
          if (action === 'add-wayfarer') {
            var addWayfarerBtn = document.getElementById('combatAddWayfarerBtn');
            if (addWayfarerBtn) addWayfarerBtn.click();
          } else if (action === 'spawn-ally') {
            store.setState(function (inner) {
              var next = Object.assign({}, inner);
              var t = { id: uid('ally'), name: String(chosen.name || 'Ally'), faction: 'player', hp: 10, maxHp: 10, status: [], q: baseQ + 1, r: baseR + 1, image: '', size: 1, isPlayer: false };
              next.tokens = (inner.tokens || []).concat([t]);
              next.selectedTokenId = t.id;
              persist(next);
              return next;
            });
            addHistory('Asset placed: ' + chosen.name + '.');
          } else if (action === 'spawn-villain' && chosen.payload) {
            spawnBestiaryToken(chosen.payload, baseQ + 2, baseR);
          } else if (action === 'spawn-npc') {
            store.setState(function (inner2) {
              var next2 = Object.assign({}, inner2);
              var n = { id: uid('npc'), name: String(chosen.name || 'NPC'), faction: 'npc', hp: 8, maxHp: 8, status: [], q: baseQ + 1, r: baseR, image: '', size: 1 };
              next2.tokens = (inner2.tokens || []).concat([n]);
              next2.selectedTokenId = n.id;
              persist(next2);
              return next2;
            });
            addHistory('Asset placed: ' + chosen.name + '.');
          } else if (action === 'map-preset' && chosen.payload) {
            store.setState(function (inner3) {
              var next3 = Object.assign({}, inner3);
              next3.board = Object.assign({}, inner3.board || {}, { cols: Number(chosen.payload.cols || 15), rows: Number(chosen.payload.rows || 15), weatherOverlay: String(chosen.payload.weather || 'none') });
              persist(next3);
              return next3;
            });
            addHistory('Battlemap preset applied: ' + chosen.name + '.');
          } else if (action === 'paint-object') {
            store.setState(function (inner4) {
              var next4 = Object.assign({}, inner4, { activeLayer: 'objects', activeTool: 'paint', paintValue: String(chosen.payload || 'obstacle') });
              persist(next4);
              return next4;
            });
            safeNotif('Object painter ready: ' + String(chosen.payload || 'object') + '.', 'good');
          }
          drawBoard();
          updateUiPanels();
        };
      });
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
      var activeRowInit = state.initiative && state.initiative[state.initiativeIndex] || null;
      var activeIdInit = String(activeRowInit && activeRowInit.tokenId || '');
      function tokenActionsLeft(token) {
        if (!token) return 0;
        if (token.isPlayer) return Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0));
        return Math.max(0, Number(state.teamActions && state.teamActions[token.id] || 0));
      }
      function cardForToken(token, laneLabel, color) {
        var isTurn = String(token && token.id || '') === activeIdInit;
        var cls = 'combat-turn-card' + (isTurn ? ' active' : '');
        var actionsLeft = tokenActionsLeft(token);
        var maxActions = 3;
        if (token && token.isPlayer && window.S && window.S.combat) {
          maxActions = Math.max(1, Number(window.S.combat.maxActions || 3));
        }
        var actionDots = '';
        for (var adx = 0; adx < maxActions; adx++) {
          var dotClass = adx < actionsLeft ? '' : ' spent';
          actionDots += '<span class="combat-turn-action-dot-small' + dotClass + '"></span>';
        }
        return '<button class="' + cls + '" data-turn-token="' + String(token.id || '') + '">'
          + '<span class="combat-turn-lane" style="color:' + color + ';">' + laneLabel + '</span>'
          + '<span class="combat-turn-name">' + String(token.name || 'Unit') + '</span>'
          + '<span class="combat-turn-meta">'
          + '<span class="combat-turn-action-indicator">' + actionDots + '</span>'
          + ' · hex ' + toKey(token.q, token.r) + (isTurn ? ' · TURN' : '') 
          + '</span>'
          + '</button>';
      }
      initList.innerHTML = ''
        + '<div class="combat-initiative-round-marker">Round ' + Math.max(1, Number(state.round || 1)) + '</div>'
        + wayfarers.map(function (token) { return cardForToken(token, 'Wayfarer', 'var(--combat-accent-2)'); }).join('')
        + allies.map(function (token) { return cardForToken(token, 'Ally', 'var(--combat-text)'); }).join('')
        + enemies.map(function (token) { return cardForToken(token, 'Enemy', 'var(--combat-danger)'); }).join('');
      if (!String(initList.innerHTML || '').trim()) {
        initList.innerHTML = '<div class="combat-feed-line">No combatants tracked.</div>';
      } else {
        Array.prototype.slice.call(initList.querySelectorAll('[data-turn-token]')).forEach(function (btn) {
          btn.onclick = function () {
            var tokenId = String(btn.getAttribute('data-turn-token') || '');
            if (!tokenId) return;
            store.setState({ selectedTokenId: tokenId });
            drawBoard();
            updateUiPanels();
          };
        });
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
    var selectedName = document.getElementById('combatSelectedName');
    var selectedDreadInput = document.getElementById('combatSelectedDread');
    var selectedHp = document.getElementById('combatSelectedHp');
    var selectedElevation = document.getElementById('combatSelectedElevation');
    var effectList = document.getElementById('combatTokenRoundEffectsList');
    if (selectedSummary) {
      var selectedDread = selected ? Math.max(4, Number(selected.dread || selected.codexDread || 0)) : 0;
      var selectedDeath = selected ? Math.max(1, Number(selected.deathNumber || selectedDread || 0)) : 0;
      var selectedActions = selected
        ? (selected.isPlayer
          ? Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0))
          : Math.max(0, Number(state.teamActions && state.teamActions[selected.id] || 0)))
        : 0;
      var selectedThreat = selected && !selected.isPlayer && String(selected.faction || '') === 'monster' && selectedDread
        ? (' · DD d' + selectedDread + ' · DN ' + selectedDeath)
        : '';
      selectedSummary.textContent = selected
        ? (selected.name + ' · ' + selected.faction + ' · ' + selectedActions + 'A · hex ' + toKey(selected.q, selected.r) + selectedThreat)
        : 'Select a token.';
    }
    if (selectedHp) {
      selectedHp.value = selected ? Number(selected.hp || 0) : '';
    }
    if (selectedName) {
      selectedName.value = selected ? String(selected.name || '') : '';
    }
    if (selectedDreadInput) {
      selectedDreadInput.value = selected ? Math.max(1, Number(selected.dread || selected.codexDread || selected.deathNumber || 1)) : '';
    }
    if (selectedElevation) {
      selectedElevation.value = selected ? Number(state.layers.elevation[toKey(selected.q, selected.r)] || 0) : 0;
    }
    if (effectList) {
      var effects = (state.tokenRoundEffects || []).filter(function (effect) {
        return effect && selected && String(effect.targetTokenId || '') === String(selected.id || '');
      });
      effectList.innerHTML = effects.length
        ? effects.map(function (effect) {
          return '<div class="combat-feed-line">'
            + '<strong>' + String(effect.label || 'Condition') + '</strong>'
            + ' · ' + Math.max(0, Number(effect.stressPerRound || 0)) + '/round'
            + ' · ' + Math.max(0, Number(effect.roundsLeft || 0)) + ' rounds left'
            + '</div>';
        }).join('')
        : '<div class="combat-feed-line">No active round conditions on selected token.</div>';
    }

    var weatherSelect = document.getElementById('combatWeatherSelect');
    var weatherIntensity = document.getElementById('combatWeatherIntensity');
    if (weatherSelect) weatherSelect.value = String(state.board.weatherOverlay || 'none');
    if (weatherIntensity) weatherIntensity.value = Number(state.board.weatherIntensity || 0);

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

    var syncBadge = document.getElementById('combatSharedSyncBadge');
    if (syncBadge) {
      var badgeText = 'Sync Local';
      var badgeClass = 'sync-aging';
      if (window.campaignSystem && typeof window.campaignSystem.getSyncStatus === 'function') {
        var syncStatus = null;
        var sharedState = null;
        try { syncStatus = window.campaignSystem.getSyncStatus(); } catch (_err) { syncStatus = null; }
        try { sharedState = typeof window.campaignSystem.getSharedState === 'function' ? window.campaignSystem.getSharedState() : null; } catch (_err2) { sharedState = null; }
        var version = Math.max(0, Number(syncStatus && syncStatus.sharedVersion || 0));
        var sceneMeta = sharedState && sharedState.combatScene && sharedState.combatScene.syncMeta && typeof sharedState.combatScene.syncMeta === 'object'
          ? sharedState.combatScene.syncMeta
          : (window.S && window.S.combat && window.S.combat.sceneSyncMeta && typeof window.S.combat.sceneSyncMeta === 'object' ? window.S.combat.sceneSyncMeta : null);
        var by = sceneMeta && sceneMeta.by ? String(sceneMeta.by) : '-';
        var at = Number(sceneMeta && sceneMeta.at || 0);
        var ageSec = at ? Math.max(0, Math.floor((Date.now() - at) / 1000)) : 0;
        var freshness = at ? (ageSec <= 12 ? 'fresh' : (ageSec <= 30 ? 'aging' : 'stale')) : 'unknown';
        badgeText = 'Sync v' + version + ' · ' + by + ' · ' + formatClockTime(at) + ' · ' + freshness;
        badgeClass = freshness === 'fresh' ? 'sync-fresh' : (freshness === 'stale' ? 'sync-stale' : 'sync-aging');
      } else {
        badgeClass = 'sync-aging';
      }
      syncBadge.textContent = badgeText;
      syncBadge.className = badgeClass;
    }

    var startSceneBtn = document.getElementById('combatStartSceneBtn');
    if (startSceneBtn) {
      var sceneActive = !!(window.S && window.S.combat && window.S.combat.active);
      startSceneBtn.textContent = sceneActive ? 'Scene Active' : 'Start Scene';
      startSceneBtn.disabled = sceneActive;
      startSceneBtn.style.opacity = sceneActive ? '0.55' : '1';
    }

    var statusGrid = document.getElementById('combatSceneStatusGrid');
    if (statusGrid) {
      var playerActionsNow = Math.max(0, Number(window.S && window.S.combat && window.S.combat.actionsLeft || 0));
      var playerActionsMax = Math.max(playerActionsNow, Number(window.S && window.S.combat && window.S.combat.maxActions || 3));
      var hpSnap = getWayfarerHealthSnapshot();
      var hpNow = hpSnap.remaining;
      var hpMax = hpSnap.max;
      var tmwNow = Math.max(0, Number(window.S && window.S.tmw || 0));
      var alliesCount = (state.tokens || []).filter(function (token) { return token && String(token.faction) === 'player' && !token.isPlayer; }).length;
      var enemiesCount = (state.tokens || []).filter(function (token) { return token && String(token.faction) === 'monster'; }).length;
      var activeEntryNow = state.initiative && state.initiative[state.initiativeIndex] || null;
      var activeTokenNow = activeEntryNow ? byId(activeEntryNow.tokenId) : null;
      var enemyPool = activeTokenNow && String(activeTokenNow.faction) === 'monster'
        ? Math.max(0, Number(state.teamActions && state.teamActions[activeTokenNow.id] || 0))
        : Math.max(0, enemiesCount ? 1 : 0);
      var dreadDie = Math.max(4, Number(window.S && window.S.combat && window.S.combat.enemyDread || 8));
      var sceneLabel = (window.S && window.S.combat && window.S.combat.active) ? ('Round ' + Math.max(1, Number(window.S.combat.round || state.round || 1))) : 'Scene Not Started';
      statusGrid.innerHTML = ''
        + '<div class="combat-feed-line">Your Actions: <strong style="color:var(--combat-accent-2);">' + playerActionsNow + '/' + playerActionsMax + '</strong></div>'
        + '<div class="combat-feed-line">Health: <strong style="color:var(--combat-accent-2);">' + hpNow + '/' + hpMax + '</strong></div>'
        + '<div class="combat-feed-line">TMW: <strong style="color:var(--combat-accent-2);">' + tmwNow + '</strong></div>'
        + '<div class="combat-feed-line">Ally Actions: <strong style="color:var(--combat-accent-2);">' + alliesCount + '</strong></div>'
        + '<div class="combat-feed-line">Enemy Actions: <strong style="color:var(--combat-accent-2);">' + enemyPool + '/' + Math.max(enemyPool, enemiesCount ? 1 : 0) + '</strong></div>'
        + '<div class="combat-feed-line">Dread: <strong style="color:var(--combat-accent-2);">d' + dreadDie + '</strong></div>'
        + '<div class="combat-feed-line">' + sceneLabel + '</div>';
    }

    var tokenSheetMirror = document.getElementById('combatTokenSheetMirror');
    if (tokenSheetMirror) {
      if (!selected) {
        tokenSheetMirror.textContent = 'Select a token to load Character Sheet context.';
      } else if (selected.isPlayer || String(selected.faction) === 'player') {
        tokenSheetMirror.innerHTML = buildCharacterSheetCombatSummary(selected.id).map(function (line) {
          return '<div class="combat-feed-line">' + String(line) + '</div>';
        }).join('');
      } else {
        tokenSheetMirror.innerHTML = ''
          + '<div class="combat-feed-line">Combatant Name: ' + String(selected.name || 'Enemy') + '</div>'
          + '<div class="combat-feed-line">Dread Die: d' + Math.max(4, Number(selected.dread || selected.codexDread || 6)) + '</div>'
          + '<div class="combat-feed-line">Health: ' + Math.max(0, Number(selected.hp || 0)) + '/' + Math.max(1, Number(selected.maxHp || selected.hp || 1)) + '</div>';
      }
      // Append unique monster skills if available
      var enemyProfile = getEnemyProfileForToken(selected);
      if (!enemyProfile && selected && selected.name) {
        // fallback: search NAMED_ENEMY_BESTIARY directly
        var allBest = typeof window.NAMED_ENEMY_BESTIARY !== 'undefined' ? window.NAMED_ENEMY_BESTIARY : null;
        if (allBest) {
          Object.keys(allBest).some(function (k) {
            var found = (allBest[k] || []).find(function (e) { return e && String(e.name).toLowerCase() === String(selected.name).toLowerCase(); });
            if (found) { enemyProfile = found; return true; }
            return false;
          });
        }
      }
      if (!selected.isPlayer && String(selected.faction) !== 'player' && enemyProfile && Array.isArray(enemyProfile.skills) && enemyProfile.skills.length) {
        var tknSheetState = store.getState();
        var actorForDist = byId(tknSheetState.selectedTokenId) || (tknSheetState.tokens || []).find(function (t) { return t && (t.isPlayer || String(t.faction) === 'player'); });
        var distToActor = actorForDist ? hexDistance({ q: selected.q, r: selected.r }, { q: actorForDist.q, r: actorForDist.r }) : 999;
        var HEX_RANGE_MAP = { 'engaged': 1, 'close': 2, 'nearby': 4, 'far': 99 };
        var skillLines = enemyProfile.skills.map(function (sk) {
          var maxSkillRange = (sk.range || []).reduce(function (max, r) { return Math.max(max, HEX_RANGE_MAP[r] || 1); }, 0);
          var inRange = distToActor <= maxSkillRange;
          return '<div class="combat-feed-line" style="color:' + (inRange ? 'var(--accent-2)' : 'var(--muted2)') + ';">'
            + '⚡ ' + String(sk.name) + ' [' + (sk.range || []).join('/') + '] — ' + (inRange ? '✓ In Range' : '✗ Out of range → defaults to Strike/Shoot')
            + '</div>'
            + '<div class="combat-feed-line" style="font-size:.72rem;color:var(--muted2);padding-left:.5rem;">' + String(sk.desc) + ' · On fail: ' + String(sk.onFail) + '</div>';
        }).join('');
        tokenSheetMirror.innerHTML += '<div style="margin-top:.3rem;border-top:1px solid var(--border2);padding-top:.25rem;">' + skillLines + '</div>';
      }
    }

    var tokenTargetSel = document.getElementById('combatTokenTargetSel');
    var tokenActionSel = document.getElementById('combatTokenActionSel');
    var tokenEnemyBtn = document.getElementById('combatTokenEnemyActionBtn');
    var tokenCoverSel = document.getElementById('combatTargetCoverOverrideSel');
    var lootBodyBtn = document.getElementById('combatLootBodyBtn');
    var tokenActionHelp = document.getElementById('combatTokenActionHelp');
    if (tokenTargetSel) {
      var actorToken = byId(state.selectedTokenId);
      var hostiles = actorToken ? (state.tokens || []).filter(function (token) {
        return token && String(token.id) !== String(actorToken.id) && String(token.faction) !== String(actorToken.faction);
      }) : [];
      hostiles.sort(function (a, b) {
        return hexDistance({ q: actorToken && actorToken.q || 0, r: actorToken && actorToken.r || 0 }, { q: a.q, r: a.r }) - hexDistance({ q: actorToken && actorToken.q || 0, r: actorToken && actorToken.r || 0 }, { q: b.q, r: b.r });
      });
      var prevTarget = String(tokenTargetSel.value || '');
      tokenTargetSel.innerHTML = hostiles.length
        ? hostiles.map(function (t) {
          var dist = actorToken ? hexDistance({ q: actorToken.q, r: actorToken.r }, { q: t.q, r: t.r }) : 0;
          return '<option value="' + String(t.id) + '">' + String(t.name || 'Hostile') + ' · ' + hexLabel(dist) + ' (' + dist + 'h)</option>';
        }).join('')
        : '<option value="">Closest hostile</option>';
      var exists = Array.prototype.slice.call(tokenTargetSel.options || []).some(function (opt) { return String(opt.value || '') === prevTarget; });
      if (exists) tokenTargetSel.value = prevTarget;
    }
    if (tokenCoverSel) {
      var targetId = String(tokenTargetSel && tokenTargetSel.value || '');
      var overrides = state.sceneRules && state.sceneRules.targetCoverOverrides && typeof state.sceneRules.targetCoverOverrides === 'object'
        ? state.sceneRules.targetCoverOverrides
        : {};
      tokenCoverSel.value = targetId ? String(overrides[targetId] || 'auto') : 'auto';
      tokenCoverSel.disabled = !targetId;
    }
    if (tokenActionSel) {
      var mirroredSel = document.getElementById('wayfarerActionSel');
      var actor = byId(state.selectedTokenId);
      var previous = String(tokenActionSel.value || '');
      if (actor && (actor.isPlayer || String(actor.faction) === 'player') && mirroredSel) {
        tokenActionSel.innerHTML = Array.prototype.slice.call(mirroredSel.options || []).map(function (opt) {
          var val = String(opt.value || '');
          return '<option value="' + val + '">' + String(opt.textContent || '') + '</option>';
        }).join('');
      } else if (actor && String(actor.faction) === 'monster') {
        var targetForSkills = String(tokenTargetSel && tokenTargetSel.value || '') ? byId(String(tokenTargetSel.value || '')) : null;
        var skillOpts = getEnemySkillOptionsForToken(actor, targetForSkills);
        var baseOpt = '<option value="enemy_action">Basic Enemy Action</option>';
        var extra = skillOpts.map(function (entry) {
          var suffix = entry.inRange ? ' \u00b7 In Range' : ' \u00b7 Out of Range';
          return '<option value="' + entry.id + '">' + entry.name + ' [' + entry.rangeLabel + ']' + suffix + '</option>';
        }).join('');
        tokenActionSel.innerHTML = baseOpt + extra;
      } else {
        tokenActionSel.innerHTML = '<option value="">Choose action</option>';
      }
      var stillExists = Array.prototype.slice.call(tokenActionSel.options || []).some(function (opt) { return String(opt.value || '') === previous; });
      if (stillExists) tokenActionSel.value = previous;
    }
    var tokenEnemyBtnVis = document.getElementById('combatTokenEnemyActionBtn');
    if (tokenEnemyBtnVis) {
      var actorForEnemyBtn = byId(state.selectedTokenId);
      tokenEnemyBtnVis.style.display = (actorForEnemyBtn && String(actorForEnemyBtn.faction) === 'monster') ? '' : 'none';
    }
    if (tokenActionHelp) {
      var selectedTargetId = String(tokenTargetSel && tokenTargetSel.value || '');
      var actorNow = byId(state.selectedTokenId);
      var targetNow = selectedTargetId ? byId(selectedTargetId) : null;
      var selectedAction = String(tokenActionSel && tokenActionSel.value || '');
      var selectedCoverOverride = String(tokenCoverSel && tokenCoverSel.value || 'auto');
      if (actorNow && String(actorNow.faction) === 'monster') {
        var targetForEnemy = selectedTargetId ? byId(selectedTargetId) : null;
        var skillState = getEnemySkillOptionsForToken(actorNow, targetForEnemy);
        var enemyProfileForHelp = getEnemyProfileForToken(actorNow);
        var tacticText = enemyProfileForHelp && enemyProfileForHelp.tactic ? String(enemyProfileForHelp.tactic) : '';
        var chosen = null;
        if (selectedAction.indexOf('enemy_skill:') === 0) {
          var chosenIdx = Number(selectedAction.split(':')[1]);
          chosen = skillState.find(function (s) { return Number(s.idx) === chosenIdx; }) || null;
        }
        if (chosen && chosen.skill) {
          tokenActionHelp.innerHTML = enemySkillCardHtml(
            chosen,
            actorNow.name,
            Math.max(4, Number(actorNow.dread || actorNow.codexDread || 6)),
            targetForEnemy && targetForEnemy.name || 'Target',
            tacticText
          );
        } else if (skillState.length) {
          var inRangeCount = skillState.filter(function (s) { return s.inRange; }).length;
          var preview = skillState.slice(0, 3).map(function (entry) {
            return enemySkillCardHtml(
              entry,
              actorNow.name,
              Math.max(4, Number(actorNow.dread || actorNow.codexDread || 6)),
              targetForEnemy && targetForEnemy.name || 'Target',
              ''
            );
          }).join('');
          tokenActionHelp.innerHTML = '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.15rem;">Enemy skills in range: ' + inRangeCount + '/' + skillState.length + ' (select one in Token Action).</div>' + preview;
        } else {
          tokenActionHelp.textContent = 'No unique enemy skills found. Uses Basic Enemy Action (Dread vs Defend).';
        }
      } else if (actorNow && targetNow && selectedAction) {
        var distNow = hexDistance({ q: actorNow.q, r: actorNow.r }, { q: targetNow.q, r: targetNow.r });
        var reachable = canActionReachTarget(selectedAction, distNow);
        tokenActionHelp.textContent = 'Target ' + String(targetNow.name || 'Enemy') + ' · ' + hexLabel(distNow) + ' (' + distNow + 'h) · Cover override: ' + selectedCoverOverride + ' · ' + (reachable ? 'In range' : 'Out of range for this action') + '.';
      } else if (actorNow && (actorNow.isPlayer || String(actorNow.faction) === 'player')) {
        var actionCtxLines = [];
        var selAct = String(tokenActionSel && tokenActionSel.value || '');
        var equip2 = window.S && window.S.equipment ? window.S.equipment : {};
        if (selAct.indexOf('personal_flavor') >= 0 || selAct.indexOf('flavor') >= 0) {
          var fl2 = String(window.S && window.S.flavor || 'None selected');
          actionCtxLines.push('Personal Flavor: ' + fl2);
        } else if (selAct.indexOf('use_item') >= 0 || selAct.indexOf('item') >= 0 || selAct.indexOf('hack') >= 0 || selAct.indexOf('spell') >= 0) {
          var w1c = String(equip2.weapon1 || '').trim();
          var w2c = String(equip2.weapon2 || '').trim();
          var arc = String(equip2.armor || '').trim();
          actionCtxLines.push('Equipped — Weapon: ' + (w1c || 'None') + (w2c ? ' · Off-hand: ' + w2c : '') + ' · Armor: ' + (arc || 'None'));
          var items2 = window.S && window.S.items ? window.S.items : (window.S && window.S.backpack ? window.S.backpack : null);
          if (items2 && Array.isArray(items2) && items2.length) {
            actionCtxLines.push('Backpack: ' + items2.slice(0, 3).map(function (it) { return String(it && (it.name || it) || ''); }).filter(Boolean).join(', ') + (items2.length > 3 ? ' +more' : ''));
          }
        } else {
          actionCtxLines.push('Quick Actions: choose target + action, then Execute.');
        }
        tokenActionHelp.textContent = actionCtxLines.join(' | ');
      } else {
        tokenActionHelp.textContent = 'No combat roll yet.';
      }
    }

    if (tokenEnemyBtn) {
      var selectedTokenForButton = byId(state.selectedTokenId);
      var showEnemyBtn = !!(selectedTokenForButton && String(selectedTokenForButton.faction) === 'monster');
      tokenEnemyBtn.style.display = showEnemyBtn ? '' : 'none';
    }

    if (lootBodyBtn) {
      var selToken = byId(state.selectedTokenId);
      var selDrop = selToken ? getLootDropForToken(state, selToken.id) : null;
      lootBodyBtn.disabled = !(selToken && isTokenDead(selToken) && selDrop && !selDrop.claimed);
      lootBodyBtn.style.opacity = lootBodyBtn.disabled ? '0.45' : '1';
    }
    var recoverySlotSel = document.getElementById('combatRecoverySlotSel');
    if (recoverySlotSel) {
      var stack = loadRecoveryStack();
      var prevVal = String(recoverySlotSel.value || '');
      if (!stack.length) {
        recoverySlotSel.innerHTML = '<option value="">No autosaves</option>';
        recoverySlotSel.disabled = true;
      } else {
        recoverySlotSel.disabled = false;
        recoverySlotSel.innerHTML = stack.map(function (entry, idx) {
          var slotNumber = idx + 1;
          var stamp = formatClockTime(Number(entry && entry.at || 0));
          return '<option value="' + idx + '">Snapshot #' + slotNumber + ' · ' + stamp + '</option>';
        }).join('');
        var stillExists2 = Array.prototype.slice.call(recoverySlotSel.options || []).some(function (opt) { return String(opt.value || '') === prevVal; });
        recoverySlotSel.value = stillExists2 ? prevVal : String(Math.max(0, stack.length - 1));
      }
    }

    var opener = document.getElementById('combatSceneOpenerSummary');
    if (opener) {
      var so = window.S && window.S.combat && window.S.combat.sceneOpener ? window.S.combat.sceneOpener : null;
      if (!so) {
        var csState = store.getState();
        var activeScId = csState && csState.activeSceneId;
        var activeScn = activeScId && Array.isArray(csState.scenes) ? csState.scenes.find(function (sc) { return sc && sc.id === activeScId; }) : null;
        if (activeScn && activeScn.sceneOpener) so = activeScn.sceneOpener;
      }
      if (so) {
        var zone = String(so.zone || so.zoneTerrain || so.terrain || 'Unknown');
        var cover = String(so.cover || so.coverDesc || so.coverTier || 'none');
        var react = String(so.enemyReaction || so.reaction || so.enemyIntent || 'Unknown');
        var activity = String(so.enemyActivity || so.activity || so.enemyMove || 'Unknown');
        opener.textContent = '🎬 ' + zone + ' · ' + cover + ' · ' + react + ' · ' + activity;
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
      var ledgerBlock = enemyLedgerMeta.parentElement;
      if (ledgerBlock) ledgerBlock.style.display = 'none';
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
      var alliesWithActions = (state.tokens || []).filter(function (t) {
        return t && !t.isPlayer && String(t.faction) === 'player';
      }).map(function (t) {
        return String(t.name || 'Ally') + ' ' + Math.max(0, Number(state.teamActions && state.teamActions[t.id] || 0)) + 'A';
      });
      var enemiesWithActions = (state.tokens || []).filter(function (t) {
        return t && String(t.faction) === 'monster';
      }).map(function (t) {
        return String(t.name || 'Enemy') + ' ' + Math.max(0, Number(state.teamActions && state.teamActions[t.id] || 0)) + 'A';
      });
      enemyLedgerMeta.textContent = 'Turn Actions · Allies: ' + (alliesWithActions.join(', ') || 'none') + ' · Enemies: ' + (enemiesWithActions.join(', ') || 'none') + ' · ledger events ' + spendRows.length + ' (cycle ' + activeCycle + ': ' + activeCount + ')';
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
      var allies = (state.tokens || []).filter(function (token) { return token && !token.isPlayer && String(token.faction) === 'player'; });
      allySel.innerHTML = allies.map(function (ally) {
        var left = Math.max(0, Number(state.teamActions && state.teamActions[ally.id] || 0));
        return '<option value="' + String(ally.id) + '">' + String(ally.name || 'Ally') + ' · actions ' + left + '</option>';
      }).join('');
    }

    var allyBudget = document.getElementById('combatAllyBudgetMeta');
    if (allyBudget) {
      allyBudget.textContent = 'Turn order: Wayfarer -> Allies -> Enemy. Allies and enemies have 2 actions per token each turn.';
    }
  }

  function bindCanvas() {
    var canvas = document.getElementById('combatSceneCanvas');
    if (!canvas || canvas._boundCombatEditor) return;
    canvas._boundCombatEditor = true;
    var pingHoldTimer = null;

    function clearPingHold() {
      if (pingHoldTimer) {
        clearTimeout(pingHoldTimer);
        pingHoldTimer = null;
      }
    }

    var inlineInput = document.getElementById('combatBubbleInlineInput');
    if (inlineInput && !inlineInput._bound) {
      inlineInput._bound = true;
      inlineInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          hideInlineBubbleEditor(true);
          ev.preventDefault();
        } else if (ev.key === 'Escape') {
          hideInlineBubbleEditor(false);
          ev.preventDefault();
        }
      });
      inlineInput.addEventListener('blur', function () {
        hideInlineBubbleEditor(true);
      });
    }

    canvas.addEventListener('mousedown', function (ev) {
      var state = store.getState();
      var rect = canvas.getBoundingClientRect();
      var board = state.board;
      var size = Number(board.size || 42) * Number(board.zoom || 1);
      var canvasX = ev.clientX - rect.left;
      var canvasY = ev.clientY - rect.top;
      var ax = pixelToAxial(canvasX, canvasY, size, board.panX, board.panY);
      var lootCard = document.getElementById('combatLootPopupCard');
      if (lootCard && lootCard.style.display !== 'none') {
        var cardRect = lootCard.getBoundingClientRect();
        var inCard = ev.clientX >= cardRect.left && ev.clientX <= cardRect.right && ev.clientY >= cardRect.top && ev.clientY <= cardRect.bottom;
        if (!inCard) closeLootPopup();
      }
      var bubbleHit = bubbleHotspots.find(function (spot) {
        return canvasX >= spot.x && canvasX <= spot.x + spot.w && canvasY >= spot.y && canvasY <= spot.y + spot.h;
      }) || null;
      if (bubbleHit) {
        var token = byId(bubbleHit.tokenId);
        if (!token) return;
        showInlineBubbleEditor(bubbleHit, token, canvas);
        return;
      }

      clearPingHold();

      if (state.activeTool === 'ping') {
        placeTablePing(ax.q, ax.r, currentPingIdentity());
        return;
      }
      var clickedToken = nearestTokenAt(ax.q, ax.r);

      if (clickedToken && isTokenDead(clickedToken) && state.activeTool === 'select') {
        var corpseDrop = getLootDropForToken(state, clickedToken.id);
        if (corpseDrop && !corpseDrop.claimed && Array.isArray(corpseDrop.items) && corpseDrop.items.length) {
          store.setState({ selectedTokenId: clickedToken.id, draggingTokenId: '' });
          openLootPopupForToken(clickedToken.id, canvasX, canvasY);
          updateUiPanels();
          drawBoard();
          return;
        }
      }

      if (state.activeTool === 'pan' || ev.button === 1) {
        store.setState({ mouse: { panning: true, lastX: ev.clientX, lastY: ev.clientY } });
        return;
      }

      if (clickedToken && state.activeTool !== 'paint' && state.activeTool !== 'erase') {
        store.setState({ selectedTokenId: clickedToken.id, draggingTokenId: clickedToken.id });
        closeLootPopup();
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

      if (state.activeTool === 'text') {
        var existingLabel = String(state.layers && state.layers.labels && state.layers.labels[toKey(ax.q, ax.r)] || '');
        var entered = window.prompt('Text label for this hex (blank clears):', existingLabel);
        if (entered === null) return;
        store.setState(function (inner) {
          var next = Object.assign({}, inner);
          next.layers = Object.assign({}, inner.layers || {});
          next.layers.labels = Object.assign({}, (inner.layers && inner.layers.labels) || {});
          var key = toKey(ax.q, ax.r);
          var clean = String(entered || '').trim();
          if (!clean) delete next.layers.labels[key];
          else next.layers.labels[key] = clean;
          persist(next);
          return next;
        });
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
        var ro = Object.assign({ snapToGrid: true }, state.rulerOptions || {});
        var selected = byId(state.selectedTokenId);
        var start = selected ? { q: Number(selected.q), r: Number(selected.r) } : { q: ax.q, r: ax.r };
        var dist = Math.max(Math.abs(start.q - ax.q), Math.abs(start.r - ax.r));
        var rulerState = { active: true, start: start, end: { q: ax.q, r: ax.r }, distance: dist, label: hexLabel(dist) };
        if (!ro.snapToGrid) {
          rulerState.startPx = selected
            ? axialToPixel(start.q, start.r, size, board.panX, board.panY)
            : { x: canvasX, y: canvasY };
          rulerState.endPx = { x: canvasX, y: canvasY };
          rulerState.distance = Math.max(0, Number((Math.hypot(0, 0) / Math.max(1, size)).toFixed(2)));
          rulerState.label = 'Free';
        }
        store.setState({ ruler: rulerState });
        drawBoard();
        updateUiPanels();
        return;
      }

      if (ev.button === 0) {
        pingHoldTimer = setTimeout(function () {
          placeTablePing(ax.q, ax.r, currentPingIdentity());
        }, 360);
      }
    });

    canvas.addEventListener('mousemove', function (ev) {
      var state = store.getState();
      if (state.mouse && state.mouse.panning) {
        clearPingHold();
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
        clearPingHold();
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
        var ro2 = Object.assign({ snapToGrid: true }, state.rulerOptions || {});
        if (ro2.snapToGrid) {
          var dist2 = Math.max(Math.abs(start.q - ax2.q), Math.abs(start.r - ax2.r));
          store.setState({ ruler: { active: true, start: start, end: { q: ax2.q, r: ax2.r }, distance: dist2, label: hexLabel(dist2) } });
        } else {
          var sx = state.ruler.startPx && typeof state.ruler.startPx.x === 'number' ? state.ruler.startPx.x : (ev.clientX - rect2.left);
          var sy = state.ruler.startPx && typeof state.ruler.startPx.y === 'number' ? state.ruler.startPx.y : (ev.clientY - rect2.top);
          var ex = ev.clientX - rect2.left;
          var ey = ev.clientY - rect2.top;
          var distPx = Math.hypot(ex - sx, ey - sy);
          var hexApprox = Math.max(0, Number((distPx / Math.max(1, size2)).toFixed(2)));
          store.setState({
            ruler: {
              active: true,
              start: start,
              end: { q: ax2.q, r: ax2.r },
              startPx: { x: sx, y: sy },
              endPx: { x: ex, y: ey },
              distance: hexApprox,
              label: 'Free'
            }
          });
        }
        drawBoard();
        updateUiPanels();
      }
    });

    function stopDrag() {
      clearPingHold();
      hideInlineBubbleEditor(false);
      var state = store.getState();
      if (state.mouse && state.mouse.panning) {
        store.setState({ mouse: { panning: false, lastX: 0, lastY: 0 } });
      }
      if (state.draggingTokenId) {
        store.setState({ draggingTokenId: '' });
      }
      if (state.activeTool === 'ruler' && state.ruler && state.ruler.active) {
        var ro3 = Object.assign({ fadeDelay: 'linger' }, state.rulerOptions || {});
        if (String(ro3.fadeDelay || 'linger') === 'instant') {
          store.setState({ ruler: { active: false, start: null, end: null, distance: 0, label: 'Engaged' } });
          drawBoard();
        }
      }
    }

    canvas.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('mouseleave', stopDrag);

    canvas.addEventListener('dblclick', function (ev) {
      var state = store.getState();
      var rect = canvas.getBoundingClientRect();
      var board = state.board;
      var size = Number(board.size || 42) * Number(board.zoom || 1);
      var ax = pixelToAxial(ev.clientX - rect.left, ev.clientY - rect.top, size, board.panX, board.panY);
      var clickedToken = nearestTokenAt(ax.q, ax.r);
      if (!clickedToken) return;
      openTokenSheetQuickView(clickedToken.id);
      ev.preventDefault();
    });

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

  function getExpandedPaintOptions(state) {
    var base = [
      'forest', 'marsh', 'crags', 'lava', 'ruins', 'water', 'difficult terrain',
      'obstacle', 'trap', 'shrine', 'turret', 'door', 'spawn',
      'wall', 'vision-blocker', 'wall-seg-e', 'wall-seg-ne', 'wall-seg-nw', 'wall-seg-w', 'wall-seg-sw', 'wall-seg-se',
      '1', '2', '3',
      'tree-canopy', 'balcony', 'weather-overlay', 'high-ledge'
    ];
    var set = {};
    base.forEach(function (v) { set[v] = true; });
    var scenes = Array.isArray(state && state.scenes) ? state.scenes : [];
    scenes.forEach(function (scene) {
      if (!scene || !scene.layers || !scene.layers.terrain) return;
      Object.keys(scene.layers.terrain).forEach(function (k) {
        var val = String(scene.layers.terrain[k] || '').trim();
        if (val) set[val] = true;
      });
    });
    var terrainMap = state && state.layers && state.layers.terrain ? state.layers.terrain : {};
    Object.keys(terrainMap || {}).forEach(function (k2) {
      var val2 = String(terrainMap[k2] || '').trim();
      if (val2) set[val2] = true;
    });
    var customAssets = (window.S && (window.S.customTerrainAssets || window.S.terrainAssets || window.S.customAssets)) || null;
    if (Array.isArray(customAssets)) {
      customAssets.forEach(function (entry) {
        var label = typeof entry === 'string' ? entry : (entry && (entry.name || entry.id || entry.label));
        if (label) set[String(label)] = true;
      });
    } else if (customAssets && typeof customAssets === 'object') {
      Object.keys(customAssets).forEach(function (key) { set[String(key)] = true; });
    }
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b); });
  }

  function executeEnemyTokenAction(actor, target, actionId) {
    if (!actor || isTokenDead(actor)) {
      safeNotif('No valid enemy token selected.', 'warn');
      return false;
    }
    var state = store.getState();
    if (!isSceneActive()) {
      safeNotif('Start Scene before running enemy actions.', 'warn');
      return false;
    }
    if (!isTokenTurnActive(state, actor.id)) {
      safeNotif('It is not this enemy token\'s turn.', 'warn');
      return false;
    }
    var foe = target || null;
    if (!foe || isTokenDead(foe) || String(foe.faction) === String(actor.faction)) {
      var foes = (state.tokens || []).filter(function (row) {
        return row && !isTokenDead(row) && String(row.faction) !== String(actor.faction);
      });
      foes.sort(function (a, b) {
        return hexDistance({ q: actor.q, r: actor.r }, { q: a.q, r: a.r }) - hexDistance({ q: actor.q, r: actor.r }, { q: b.q, r: b.r });
      });
      foe = foes[0] || null;
    }
    if (!foe) {
      addHistory((actor.name || 'Enemy') + ' has no living target.');
      return false;
    }
    var dist = hexDistance({ q: actor.q, r: actor.r }, { q: foe.q, r: foe.r });
    var skills = getEnemySkillOptionsForToken(actor, foe);
    var selected = null;
    if (actionId && String(actionId).indexOf('enemy_skill:') === 0) {
      var idx = Number(String(actionId).split(':')[1]);
      selected = skills.find(function (row) { return Number(row.idx) === idx; }) || null;
      if (selected && !selected.inRange) {
        var inRangeFallback = skills.filter(function (row) { return !!row.inRange; });
        if (inRangeFallback.length) {
          selected = inRangeFallback[0];
          addHistory((actor.name || 'Enemy') + ' swapped to in-range action: ' + selected.name + '.');
          safeNotif('Selected skill was out of range. Using an in-range skill instead.', 'warn');
        } else {
          addHistory((actor.name || 'Enemy') + ' tried ' + selected.name + ' but target is out of range.');
          safeNotif('Selected enemy skill is out of range.', 'warn');
          updateUiPanels();
          return false;
        }
      }
    }
    if (!selected) {
      var inRange = skills.filter(function (row) { return !!row.inRange; });
      selected = inRange[0] || null;
    }
    var actionName = selected ? selected.name : 'Basic Enemy Action';
    var skillRef = selected && selected.skill ? selected.skill : null;
    var saveLabel = getEnemySkillSaveLabel(skillRef);
    var saveKey = getEnemySkillSaveKey(skillRef);
    var dreadDie = getEnemySkillDreadDie(skillRef, Math.max(4, Number(actor.dread || actor.codexDread || 6)));
    var defendDie = Math.max(4, Number(getTargetSaveDieForSkill(foe, skillRef) || 6));

    function finalizeEnemyAction(resolution) {
      if (!spendUnitAction(actor.id)) {
        safeNotif(String(actor.name || 'Enemy') + ' has no actions remaining this turn.', 'warn');
        return false;
      }
      var enemyRoll = Math.max(1, Number(resolution && resolution.enemyRoll || 1));
      var defendRoll = Math.max(1, Number(resolution && resolution.defendRoll || 1));
      var defendBonus = Number(resolution && resolution.defendBonus || 0);
      var margin = enemyRoll - defendRoll;
      var hit = margin > 0;
      var stress = 0;
      if (hit) {
        if (selected && selected.skill) {
          var onFail = String(selected.skill.onFail || selected.skill.desc || '');
          if (/difference\s*\+\s*1/i.test(onFail)) stress = Math.max(1, margin + 1);
          else stress = Math.max(1, parseStressFromText(onFail, margin));
        } else {
          stress = Math.max(1, margin);
        }
        applyDamageToToken(foe.id, stress, actor.name || 'Enemy');
        if (selected && selected.skill) {
          var cond = extractTimedConditionText(selected.skill.onFail || '');
          if (cond) {
            store.setState(function (inner) {
              var next = Object.assign({}, inner);
              next.tokens = (inner.tokens || []).map(function (row) {
                if (!row || String(row.id) !== String(foe.id)) return row;
                var statuses = Array.isArray(row.status) ? row.status.slice() : [];
                if (statuses.indexOf(cond) < 0) statuses.push(cond);
                return Object.assign({}, row, { status: statuses });
              });
              persist(next);
              return next;
            });
          }
        }
      }

      if (selected && selected.skill) pushEnemySkillNarration(actor, selected.skill, dreadDie);
      addHistory((actor.name || 'Enemy') + ' action result at ' + hexLabel(dist)
        + ' · Dread d' + dreadDie + ' = ' + enemyRoll
        + ' vs ' + String(foe.name || 'target') + ' ' + saveLabel + ' d' + defendDie + ' = ' + defendRoll
        + (defendBonus ? (' (includes +' + defendBonus + ' defend bonuses)') : '')
        + (hit ? (' · On Fail: ' + String(selected && selected.skill && selected.skill.onFail || ('Take ' + stress + ' Stress.'))) : (' · On Success: ' + String(selected && selected.skill && selected.skill.onSuccess || 'Resist the effect.'))));

      var notifEl = document.getElementById('combatLastNotification');
      if (notifEl) {
        notifEl.textContent = (actor.name || 'Enemy') + ' used ' + actionName + (hit ? (' · hit for ' + stress + ' stress') : ' · resisted') + ' · actions left ' + Math.max(0, Number(store.getState().teamActions && store.getState().teamActions[actor.id] || 0));
      }
      maybeAdvanceRoundAfterEnemyActions(actor.id);
      drawBoard();
      updateUiPanels();
      return true;
    }

    if (isManualRollModeActive()) {
      if (typeof window.openWtwManualActionDreadPrompt === 'function') {
        window.openWtwManualActionDreadPrompt({
          title: 'Manual Roll — Enemy Action',
          context: (actor.name || 'Enemy') + ' using ' + actionName + ' on ' + String(foe.name || 'target'),
          statKey: saveKey,
          statLabel: saveLabel,
          actionDie: defendDie,
          dreadDie: dreadDie,
          onResolve: function (outcome) {
            if (!outcome) return;
            finalizeEnemyAction({
              defendRoll: Number(outcome.actionTotal || 1),
              enemyRoll: Number(outcome.dreadTotal || 1),
              defendBonus: 0
            });
          }
        });
        return true;
      }
      var fallbackDefend = promptManualDieTotal('Manual Defend total for ' + String(foe.name || 'target') + ' (1-40):', 8, 1, 40);
      if (fallbackDefend === null) {
        safeNotif('Manual enemy action cancelled.', 'info');
        return false;
      }
      var fallbackEnemy = promptManualDieTotal('Manual Dread total for ' + String(actor.name || 'Enemy') + ' (1-40):', 8, 1, 40);
      if (fallbackEnemy === null) {
        safeNotif('Manual enemy action cancelled.', 'info');
        return false;
      }
      return finalizeEnemyAction({ defendRoll: fallbackDefend, enemyRoll: fallbackEnemy, defendBonus: 0 });
    }

    var enemyRoll = rollCombatDieTotal(dreadDie, 'dread', String(actor.name || 'Enemy') + ' Dread d' + dreadDie);
    var defendRolls = [rollCombatDieTotal(defendDie, 'action', String(foe.name || 'Target') + ' Defend d' + defendDie)];
    var defendBonus = 0;
    if (foe && foe.isPlayer && saveKey === 'defend') {
      var defendAdv = parseDefendAdvantageCount();
      for (var advIdx = 0; advIdx < defendAdv; advIdx++) {
        defendRolls.push(rollCombatDieTotal(defendDie, 'action', 'Defend Advantage d' + defendDie));
      }
      var armorAdvDice = parseArmorDefendAdvDice();
      armorAdvDice.forEach(function (die) {
        defendRolls.push(rollCombatDieTotal(die, 'action', 'Armor Defend AD' + die));
      });
      defendBonus = parseArmorDefendFlatBonus() + parseAffixDefendFlatBonus();
    }
    var defendRoll = defendRolls.reduce(function (mx, val) { return Math.max(mx, val); }, 0) + defendBonus;
    return finalizeEnemyAction({ defendRoll: defendRoll, enemyRoll: enemyRoll, defendBonus: defendBonus });
  }

  function bindStaticControls() {
    bindSceneLibraryControls();

    function applyImportedSceneSnapshot(payload) {
      var source = payload && typeof payload === 'object' ? payload : {};
      var imported = source.schema && source.state && typeof source.state === 'object' ? source.state : source;
      store.setState(function (state) {
        var next = normalizeCombatSceneState(Object.assign({}, state, imported));
        persist(next);
        return next;
      });
      addHistory('Scene snapshot imported.');
      drawBoard();
      updateUiPanels();
    }

    var exportSceneBtn = document.getElementById('combatExportSceneBtn');
    if (exportSceneBtn && !exportSceneBtn._bound) {
      exportSceneBtn._bound = true;
      exportSceneBtn.onclick = function () {
        var state = store.getState();
        var payload = {
          schema: 'btl-combat-scene-v1',
          exportedAt: Date.now(),
          state: {
            board: clone(state.board || {}),
            layers: clone(state.layers || {}),
            fog: clone(state.fog || {}),
            sceneRules: clone(state.sceneRules || {}),
            tokens: clone(state.tokens || []),
            tokenRoundEffects: clone(state.tokenRoundEffects || []),
            initiative: clone(state.initiative || []),
            actionHistory: clone((state.actionHistory || []).slice(0, 200)),
            scenes: clone(state.scenes || []),
            activeSceneId: String(state.activeSceneId || ''),
            panelPos: clone(state.panelPos || {}),
            collapsedPanels: clone(state.collapsedPanels || {}),
            round: Number(state.round || 1),
            initiativeIndex: Number(state.initiativeIndex || 0),
            currentTurnIndex: Number(state.currentTurnIndex || 0),
            lastConditionRoundApplied: Number(state.lastConditionRoundApplied || state.round || 1),
            autoRoll: !!state.autoRoll
          }
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'combat-scene-' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        safeNotif('Combat scene exported.', 'good');
      };
    }

    var importSceneBtn = document.getElementById('combatImportSceneBtn');
    var importSceneInput = document.getElementById('combatImportSceneInput');
    if (importSceneBtn && importSceneInput && !importSceneBtn._bound) {
      importSceneBtn._bound = true;
      importSceneBtn.onclick = function () { importSceneInput.click(); };
      importSceneInput.onchange = function () {
        var file = importSceneInput.files && importSceneInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var parsed = JSON.parse(String(reader.result || '{}'));
            applyImportedSceneSnapshot(parsed);
            safeNotif('Combat scene import complete.', 'good');
          } catch (_err) {
            safeNotif('Combat scene import failed: invalid JSON.', 'warn');
          }
        };
        reader.readAsText(file);
        importSceneInput.value = '';
      };
    }

    var recoverSceneBtn = document.getElementById('combatRecoverSceneBtn');
    if (recoverSceneBtn && !recoverSceneBtn._bound) {
      recoverSceneBtn._bound = true;
      recoverSceneBtn.onclick = function () {
        var sel = document.getElementById('combatRecoverySlotSel');
        var idx = Math.max(0, Number(sel && sel.value || 0));
        var stack = loadRecoveryStack();
        var chosen = stack[idx] || null;
        var chosenData = chosen && chosen.data && typeof chosen.data === 'object' ? chosen.data : null;
        if (!chosenData) {
          safeNotif('No autosave recovery snapshot available yet.', 'warn');
          return;
        }
        applyImportedSceneSnapshot(chosenData);
        safeNotif('Recovered combat scene from snapshot #' + String(idx + 1) + '.', 'good');
      };
    }

    var tokenTargetSel = document.getElementById('combatTokenTargetSel');
    var tokenCoverSel = document.getElementById('combatTargetCoverOverrideSel');
    if (tokenTargetSel && tokenCoverSel && !tokenCoverSel._bound) {
      tokenCoverSel._bound = true;
      tokenCoverSel.onchange = function () {
        var targetId = String(tokenTargetSel.value || '');
        if (!targetId) return;
        var mode = String(tokenCoverSel.value || 'auto');
        store.setState(function (state) {
          var next = Object.assign({}, state);
          var sceneRules = Object.assign({}, state.sceneRules || {});
          var overrides = Object.assign({}, sceneRules.targetCoverOverrides || {});
          if (mode === 'auto') delete overrides[targetId];
          else overrides[targetId] = mode;
          sceneRules.targetCoverOverrides = overrides;
          next.sceneRules = sceneRules;
          persist(next);
          return next;
        });
        updateUiPanels();
      };
    }

    var startSceneBtn = document.getElementById('combatStartSceneBtn');
    if (startSceneBtn && !startSceneBtn._bound) {
      startSceneBtn._bound = true;
      startSceneBtn.onclick = function () {
        var wasActive = !!(window.S && window.S.combat && window.S.combat.active);
        var state = store.getState();
        if ((!state.scenes || !state.scenes.length) && typeof window.createNewCombatScene === 'function') {
          try { window.createNewCombatScene(); } catch (_sceneErr) {}
        }
        store.setState(function (inner) {
          var hasWayfarer = (inner.tokens || []).some(function (t) { return t && t.isPlayer; });
          if (hasWayfarer) return inner;
          var next = Object.assign({}, inner);
          var maxHpByRules = getWayfarerMaxHpByRules();
          var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';
          var wayfarer = {
            id: uid('player'),
            name: canonicalWayfarerName(),
            faction: 'player',
            hp: maxHpByRules,
            maxHp: maxHpByRules,
            status: [],
            q: 0,
            r: 0,
            image: portrait,
            size: 1,
            isPlayer: true
          };
          next.tokens = (inner.tokens || []).concat([wayfarer]);
          next.selectedTokenId = String(wayfarer.id || '');
          next.initiative = [];
          persist(next);
          return next;
        });
        initializeSceneRoundState();
        if (typeof window.startCombat === 'function') {
          if (!wasActive) {
            try { window.startCombat(); } catch (_err) {}
          }
          if (window.S && window.S.combat) window.S.combat.round = 1;
          addHistory((wasActive ? 'Scene restarted' : 'Scene started') + ' from Combat Mode at Round 1.');
          safeNotif(wasActive ? 'Scene restarted at Round 1.' : 'Scene started at Round 1.', 'good');
          updateUiPanels();
          drawBoard();
          return;
        }
        safeNotif('Start Scene is unavailable right now.', 'warn');
      };
    }

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
          next.teamActions = {};
          (state.tokens || []).forEach(function (token) {
            if (!normalizeTokenActionBudgetToken(token)) return;
            next.teamActions[token.id] = 2;
          });
          persist(next);
          return next;
        });
        var st = store.getState();
        var active = st.initiative[st.initiativeIndex] || null;
        if (active) addHistory('Turn: ' + active.name + '.');
        processRoundEffectsForCurrentRound();
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
        var nameInput = document.getElementById('combatSelectedName');
        var dreadInput = document.getElementById('combatSelectedDread');
        var hpInput = document.getElementById('combatSelectedHp');
        var elevationInput = document.getElementById('combatSelectedElevation');
        var tokenName = String(nameInput && nameInput.value || '').trim();
        var dread = Math.max(1, Number(dreadInput && dreadInput.value || 0));
        var hp = Math.max(0, Number(hpInput && hpInput.value || 0));
        var elevation = Math.max(0, Number(elevationInput && elevationInput.value || 0));
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.tokens = (state.tokens || []).map(function (token) {
            if (!token || String(token.id) !== String(state.selectedTokenId || '')) return token;
            var updated = Object.assign({}, token, { hp: hp, maxHp: Math.max(hp, Number(token.maxHp || hp)) });
            if (tokenName) updated.name = tokenName;
            if (dread > 0) {
              updated.dread = dread;
              if (!updated.isPlayer && String(updated.faction || '') === 'monster') {
                updated.deathNumber = Math.max(1, dread);
              }
            }
            return updated;
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
        addHistory('Updated selected token details.');
        drawBoard();
      };
    }

    var applyRoundEffectBtn = document.getElementById('combatApplyRoundEffectBtn');
    if (applyRoundEffectBtn && !applyRoundEffectBtn._bound) {
      applyRoundEffectBtn._bound = true;
      applyRoundEffectBtn.onclick = function () {
        var state = store.getState();
        var selectedToken = byId(state.selectedTokenId);
        var targetSel = document.getElementById('combatTokenTargetSel');
        var targetId = String(targetSel && targetSel.value || '') || String(selectedToken && selectedToken.id || '');
        if (!targetId) {
          safeNotif('Select a token or target first.', 'warn');
          return;
        }
        var effectNameInput = document.getElementById('combatRoundEffectName');
        var effectStressInput = document.getElementById('combatRoundEffectStress');
        var effectRoundsInput = document.getElementById('combatRoundEffectRounds');
        var label = String(effectNameInput && effectNameInput.value || 'Condition').trim() || 'Condition';
        var stress = Math.max(0, Number(effectStressInput && effectStressInput.value || 0));
        var rounds = Math.max(1, Number(effectRoundsInput && effectRoundsInput.value || 1));
        var applied = addTokenRoundEffect(targetId, label, stress, rounds, '#e3bc5e');
        if (applied) {
          if (effectNameInput) effectNameInput.value = '';
          updateUiPanels();
          drawBoard();
        }
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
          next.tokenRoundEffects = (inner.tokenRoundEffects || []).filter(function (effect) {
            return effect && String(effect.targetTokenId || '') !== String(token.id || '');
          });
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
        updateUiPanels();
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
        updateUiPanels();
      };
    }

    function setToolMode(mode) {
      store.setState({ activeTool: String(mode || 'select') });
      updateUiPanels();
    }

    function changeZoom(delta) {
      store.setState(function (state) {
        var z = Math.max(0.5, Math.min(2.3, Number(state.board.zoom || 1) + Number(delta || 0)));
        var next = Object.assign({}, state);
        next.board = Object.assign({}, state.board, { zoom: z });
        persist(next);
        return next;
      });
      drawBoard();
      updateUiPanels();
    }

    function openQuickEffectsModal() {
      var st = store.getState();
      var token = byId(st.selectedTokenId);
      if (!token) {
        safeNotif('Select a token first.', 'warn');
        return;
      }
      var html = '<div style="display:grid;gap:.28rem;">'
        + '<div style="font-size:.78rem;color:var(--text2);">Apply a timed effect to ' + String(token.name || 'token').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '.</div>'
        + '<input id="combatFxName" class="combat-input" placeholder="Condition name (Burning)">'
        + '<input id="combatFxStress" class="combat-input" type="number" min="0" max="20" value="1">'
        + '<input id="combatFxRounds" class="combat-input" type="number" min="1" max="20" value="2">'
        + '<button class="btn btn-xs btn-primary" onclick="(function(){var n=document.getElementById(\'combatFxName\');var s=document.getElementById(\'combatFxStress\');var r=document.getElementById(\'combatFxRounds\');if(window.applyCombatQuickEffect){window.applyCombatQuickEffect(String(n&&n.value||\'Condition\'),Number(s&&s.value||1),Number(r&&r.value||2));}if(typeof window.closeModal===\'function\')window.closeModal();})();">Apply</button>'
        + '</div>';
      if (typeof window.openModal === 'function') {
        window.openModal('Combat Effects', html, null, { preventScroll: true, focusTrap: true });
        // Focus modal overlay for accessibility and scroll stability
        setTimeout(function() {
          var modal = document.getElementById('rollModal') || document.querySelector('.modal, .overlay, [role="dialog"]');
          if (modal) {
            modal.setAttribute('tabindex', '-1');
            try { modal.focus({ preventScroll: true }); } catch (e) { modal.focus(); }
          }
        }, 0);
      } else safeNotif('Effects modal requires modal support.', 'warn');
    }

    var toolbarSelectBtn = document.getElementById('combatToolbarSelectBtn');
    if (toolbarSelectBtn && !toolbarSelectBtn._bound) {
      toolbarSelectBtn._bound = true;
      toolbarSelectBtn.onclick = function () { setToolMode('select'); };
    }

    var toolbarDrawBtn = document.getElementById('combatToolbarDrawBtn');
    if (toolbarDrawBtn && !toolbarDrawBtn._bound) {
      toolbarDrawBtn._bound = true;
      toolbarDrawBtn.onclick = function () { setToolMode('paint'); };
    }

    var toolbarTextBtn = document.getElementById('combatToolbarTextBtn');
    if (toolbarTextBtn && !toolbarTextBtn._bound) {
      toolbarTextBtn._bound = true;
      toolbarTextBtn.onclick = function () { setToolMode('text'); };
    }

    var toolbarMeasureBtn = document.getElementById('combatToolbarMeasureBtn');
    if (toolbarMeasureBtn && !toolbarMeasureBtn._bound) {
      toolbarMeasureBtn._bound = true;
      toolbarMeasureBtn.onclick = function () { setToolMode('ruler'); };
    }

    var toolbarRulerBtn = document.getElementById('combatToolbarRulerBtn');
    if (toolbarRulerBtn && !toolbarRulerBtn._bound) {
      toolbarRulerBtn._bound = true;
      toolbarRulerBtn.onclick = function () { setToolMode('ruler'); };
    }

    var toolbarPanBtn = document.getElementById('combatToolbarPanBtn');
    if (toolbarPanBtn && !toolbarPanBtn._bound) {
      toolbarPanBtn._bound = true;
      toolbarPanBtn.onclick = function () { setToolMode('pan'); };
    }

    var toolbarPingBtn = document.getElementById('combatToolbarPingBtn');
    if (toolbarPingBtn && !toolbarPingBtn._bound) {
      toolbarPingBtn._bound = true;
      toolbarPingBtn.onclick = function () { setToolMode('ping'); };
    }

    var toolbarZoomInBtn = document.getElementById('combatToolbarZoomInBtn');
    if (toolbarZoomInBtn && !toolbarZoomInBtn._bound) {
      toolbarZoomInBtn._bound = true;
      toolbarZoomInBtn.onclick = function () { changeZoom(0.1); };
    }

    var toolbarZoomOutBtn = document.getElementById('combatToolbarZoomOutBtn');
    if (toolbarZoomOutBtn && !toolbarZoomOutBtn._bound) {
      toolbarZoomOutBtn._bound = true;
      toolbarZoomOutBtn.onclick = function () { changeZoom(-0.1); };
    }

    var toolbarZoomResetBtn = document.getElementById('combatToolbarZoomResetBtn');
    if (toolbarZoomResetBtn && !toolbarZoomResetBtn._bound) {
      toolbarZoomResetBtn._bound = true;
      toolbarZoomResetBtn.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { zoom: 1 });
          persist(next);
          return next;
        });
        drawBoard();
        updateUiPanels();
      };
    }

    var zoomSlider = document.getElementById('combatZoomSlider');
    if (zoomSlider && !zoomSlider._bound) {
      zoomSlider._bound = true;
      zoomSlider.value = String(Math.round(Number(store.getState().board && store.getState().board.zoom || 1) * 100));
      zoomSlider.oninput = function () {
        var pct = Math.max(50, Math.min(230, Number(zoomSlider.value || 100)));
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { zoom: pct / 100 });
          persist(next);
          return next;
        });
        drawBoard();
      };
    }

    var toolbarEffectsBtn = document.getElementById('combatToolbarEffectsBtn');
    if (toolbarEffectsBtn && !toolbarEffectsBtn._bound) {
      toolbarEffectsBtn._bound = true;
      toolbarEffectsBtn.onclick = function () { openQuickEffectsModal(); };
    }

    var toolbarDiceBtn = document.getElementById('combatToolbarDiceBtn');
    if (toolbarDiceBtn && !toolbarDiceBtn._bound) {
      toolbarDiceBtn._bound = true;
      toolbarDiceBtn.onclick = function () {
        var expr = window.prompt('Dice roll (e.g. 1d20+4, 2d6!+1 for exploding):', '1d20');
        if (!expr) return;
        var m = String(expr).trim().match(/^(\d+)d(\d+)(!)?\s*([+-]\s*\d+)?$/i);
        if (!m) {
          safeNotif('Invalid dice format.', 'warn');
          return;
        }
        var count = Math.max(1, Math.min(20, Number(m[1] || 1)));
        var die = Math.max(2, Math.min(100, Number(m[2] || 20)));
        var exploding = !!m[3];
        var mod = Number(String(m[4] || '0').replace(/\s+/g, '')) || 0;
        var rolls = [];
        var total = mod;
        for (var i = 0; i < count; i++) {
          var roll = rollDie(die);
          rolls.push(roll);
          total += roll;
          if (exploding) {
            while (roll === die) {
              roll = rollDie(die);
              rolls.push(roll);
              total += roll;
            }
          }
        }
        addHistory('Dice: ' + expr + ' => [' + rolls.join(', ') + '] ' + (mod ? ((mod > 0 ? '+' : '') + mod + ' ') : '') + '= ' + total + '.');
        safeNotif('Rolled ' + expr + ' = ' + total + '.', 'good');
        updateUiPanels();
      };
    }

    var toolbarTurnOrderBtn = document.getElementById('combatToolbarTurnOrderBtn');
    if (toolbarTurnOrderBtn && !toolbarTurnOrderBtn._bound) {
      toolbarTurnOrderBtn._bound = true;
      toolbarTurnOrderBtn.onclick = function () {
        var panel = document.getElementById('combatFeedPanel');
        if (panel && panel.classList.contains('collapsed')) panel.classList.remove('collapsed');
        var list = document.getElementById('combatInitiativeList');
        if (list && typeof list.scrollIntoView === 'function') list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    }

    var railSelectBtn = document.getElementById('combatRailSelectBtn');
    if (railSelectBtn && !railSelectBtn._bound) {
      railSelectBtn._bound = true;
      railSelectBtn.onclick = function () { setToolMode('select'); };
    }

    var railPanBtn = document.getElementById('combatRailPanBtn');
    if (railPanBtn && !railPanBtn._bound) {
      railPanBtn._bound = true;
      railPanBtn.onclick = function () { setToolMode('pan'); };
    }

    var railDrawBtn = document.getElementById('combatRailDrawBtn');
    if (railDrawBtn && !railDrawBtn._bound) {
      railDrawBtn._bound = true;
      railDrawBtn.onclick = function () { setToolMode('paint'); };
    }

    var railTextBtn = document.getElementById('combatRailTextBtn');
    if (railTextBtn && !railTextBtn._bound) {
      railTextBtn._bound = true;
      railTextBtn.onclick = function () { setToolMode('text'); };
    }

    var railMeasureBtn = document.getElementById('combatRailMeasureBtn');
    if (railMeasureBtn && !railMeasureBtn._bound) {
      railMeasureBtn._bound = true;
      railMeasureBtn.onclick = function () { setToolMode('ruler'); };
    }

    var railFogBtn = document.getElementById('combatRailFogBtn');
    if (railFogBtn && !railFogBtn._bound) {
      railFogBtn._bound = true;
      railFogBtn.onclick = function () { setToolMode('fog'); };
    }

    var railEffectsBtn = document.getElementById('combatRailEffectsBtn');
    if (railEffectsBtn && !railEffectsBtn._bound) {
      railEffectsBtn._bound = true;
      railEffectsBtn.onclick = function () { openQuickEffectsModal(); };
    }

    var railDiceBtn = document.getElementById('combatRailDiceBtn');
    if (railDiceBtn && !railDiceBtn._bound) {
      railDiceBtn._bound = true;
      railDiceBtn.onclick = function () {
        var toolbarDiceBtn = document.getElementById('combatToolbarDiceBtn');
        if (toolbarDiceBtn) toolbarDiceBtn.click();
      };
    }

    function patchRulerOptions(patch) {
      store.setState(function (state) {
        var next = Object.assign({}, state);
        next.rulerOptions = Object.assign({ shape: 'line', fadeDelay: 'linger', snapToGrid: true }, state.rulerOptions || {}, patch || {});
        persist(next);
        return next;
      });
      drawBoard();
      updateUiPanels();
    }

    var measureShapeLineBtn = document.getElementById('combatMeasureShapeLineBtn');
    if (measureShapeLineBtn && !measureShapeLineBtn._bound) {
      measureShapeLineBtn._bound = true;
      measureShapeLineBtn.onclick = function () { patchRulerOptions({ shape: 'line' }); };
    }

    var measureShapeConeBtn = document.getElementById('combatMeasureShapeConeBtn');
    if (measureShapeConeBtn && !measureShapeConeBtn._bound) {
      measureShapeConeBtn._bound = true;
      measureShapeConeBtn.onclick = function () { patchRulerOptions({ shape: 'cone' }); };
    }

    var measureShapeRadiusBtn = document.getElementById('combatMeasureShapeRadiusBtn');
    if (measureShapeRadiusBtn && !measureShapeRadiusBtn._bound) {
      measureShapeRadiusBtn._bound = true;
      measureShapeRadiusBtn.onclick = function () { patchRulerOptions({ shape: 'radius' }); };
    }

    var measureSnapBtn = document.getElementById('combatMeasureSnapBtn');
    if (measureSnapBtn && !measureSnapBtn._bound) {
      measureSnapBtn._bound = true;
      measureSnapBtn.onclick = function () {
        var st = store.getState();
        var current = !!(st.rulerOptions && st.rulerOptions.snapToGrid);
        patchRulerOptions({ snapToGrid: !current });
      };
    }

    var measureFadeBtn = document.getElementById('combatMeasureFadeBtn');
    if (measureFadeBtn && !measureFadeBtn._bound) {
      measureFadeBtn._bound = true;
      measureFadeBtn.onclick = function () {
        var st2 = store.getState();
        var current2 = String(st2.rulerOptions && st2.rulerOptions.fadeDelay || 'linger');
        patchRulerOptions({ fadeDelay: current2 === 'linger' ? 'instant' : 'linger' });
      };
    }

    var assetsBtn = document.getElementById('combatAssetsBtn');
    if (assetsBtn && !assetsBtn._bound) {
      assetsBtn._bound = true;
      assetsBtn.onclick = function () {
        var drawer = document.getElementById('combatBestiaryDrawer');
        if (drawer && typeof drawer.scrollIntoView === 'function') drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        safeNotif('Assets ready: use Bestiary Drawer and map upload to place content.', 'info');
      };
    }

    var railRulesBtn = document.getElementById('combatRailRulesBtn');
    if (railRulesBtn && !railRulesBtn._bound) {
      railRulesBtn._bound = true;
      railRulesBtn.onclick = function () { showCombatRulesReference(); };
    }

    var settingsBtn = document.getElementById('combatSettingsBtn');
    if (settingsBtn && !settingsBtn._bound) {
      settingsBtn._bound = true;
      settingsBtn.onclick = function () {
        var state = store.getState();
        var html = '<div style="display:grid;gap:.28rem;">'
          + '<label style="display:flex;align-items:center;gap:.4rem;"><input id="combatSettingsFogEnabled" type="checkbox" ' + ((state.fog && state.fog.enabled) ? 'checked' : '') + '> Fog of War enabled</label>'
          + '<label style="display:flex;align-items:center;gap:.4rem;"><input id="combatSettingsAutoRoll" type="checkbox" ' + (state.autoRoll ? 'checked' : '') + '> Auto roll mode</label>'
          + '<button class="btn btn-xs btn-primary" onclick="(function(){if(window.applyCombatSettingsFromModal)window.applyCombatSettingsFromModal();if(typeof window.closeModal===\'function\')window.closeModal();})();">Apply</button>'
          + '</div>';
        if (typeof window.openModal === 'function') window.openModal('Combat Settings', html, null, { preventScroll: true, focusTrap: true });
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
        var interactive = String(state.layers.interactives && state.layers.interactives[key] || '').toLowerCase();
        if (!interactive) {
          addHistory('No interactive object on current hex.');
          updateUiPanels();
          return;
        }
        var label = interactive;
        var used = false;
        if (/chest|cache|loot/.test(interactive)) {
          addHistory((token.name || 'Token') + ' opens ' + label + ' and secures supplies.');
          if (token.isPlayer && typeof window.changeCounter === 'function') {
            window.changeCounter('tmw', 1);
            if (typeof window.showNotif === 'function') window.showNotif('Loot cache: +1 Teamwork.', 'good');
          }
          used = true;
        } else if (/shrine|relay|beacon/.test(interactive)) {
          addHistory((token.name || 'Token') + ' channels ' + label + ' for battlefield stability.');
          if (token.isPlayer && typeof window.setHealth === 'function') {
            window.setHealth(Math.max(0, Number(window.S && window.S.health || 0) - 1));
            if (typeof window.showNotif === 'function') window.showNotif('Shrine effect: healed 1 damage.', 'good');
          }
          used = true;
        } else if (/switch|door|console/.test(interactive)) {
          addHistory((token.name || 'Token') + ' triggers ' + label + ' and changes map state.');
          store.setState(function (inner) {
            var next = Object.assign({}, inner);
            next.layers = Object.assign({}, inner.layers);
            next.layers.objects = Object.assign({}, inner.layers.objects);
            if (next.layers.objects[key] === 'door') delete next.layers.objects[key];
            else next.layers.objects[key] = 'door';
            persist(next);
            return next;
          });
          used = true;
        }
        if (!used) addHistory((token.name || 'Token') + ' activates ' + label + ' at ' + key + '.');
        updateUiPanels();
        drawBoard();
      };
    }

    var fogToggle = document.getElementById('combatFogToggleBtn');
    if (fogToggle && !fogToggle._bound) {
      fogToggle._bound = true;
      fogToggle.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          var fog = Object.assign({
            enabled: false,
            showMask: true,
            revealMode: 'manual',
            visionRadius: 3,
            revealed: {},
            revealOrder: {},
            revealSeq: 0,
            revealStep: 0
          }, state.fog || {});
          next.fog = Object.assign({}, fog, {
            enabled: !fog.enabled,
            revealed: Object.assign({}, fog.revealed || {}),
            revealOrder: Object.assign({}, fog.revealOrder || {})
          });
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
          next.fog = Object.assign({}, state.fog, { revealed: {}, revealOrder: {}, revealSeq: 0, revealStep: 0 });
          persist(next);
          return next;
        });
        addHistory('Fog reveal map cleared.');
        drawBoard();
        updateUiPanels();
      };
    }

    var fogModeBtn = document.getElementById('combatFogModeBtn');
    if (fogModeBtn && !fogModeBtn._bound) {
      fogModeBtn._bound = true;
      fogModeBtn.onclick = function () {
        store.setState(function (state) {
          var modes = ['manual', 'los', 'ordered'];
          var current = String(state.fog && state.fog.revealMode || 'manual');
          var idx = modes.indexOf(current);
          var nextMode = modes[(idx + 1) % modes.length];
          var next = Object.assign({}, state);
          next.fog = Object.assign({}, state.fog, { revealMode: nextMode });
          persist(next);
          return next;
        });
        drawBoard();
        updateUiPanels();
      };
    }

    var fogAdvanceBtn = document.getElementById('combatFogAdvanceBtn');
    if (fogAdvanceBtn && !fogAdvanceBtn._bound) {
      fogAdvanceBtn._bound = true;
      fogAdvanceBtn.onclick = function () {
        store.setState(function (state) {
          if (String(state.fog && state.fog.revealMode || 'manual') !== 'ordered') return state;
          var maxSeq = Math.max(0, Number(state.fog && state.fog.revealSeq || 0));
          var step = Math.max(0, Number(state.fog && state.fog.revealStep || 0));
          var next = Object.assign({}, state);
          next.fog = Object.assign({}, state.fog, { revealStep: Math.min(maxSeq, step + 1) });
          persist(next);
          return next;
        });
        drawBoard();
        updateUiPanels();
      };
    }

    var fogResetOrderBtn = document.getElementById('combatFogResetOrderBtn');
    if (fogResetOrderBtn && !fogResetOrderBtn._bound) {
      fogResetOrderBtn._bound = true;
      fogResetOrderBtn.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.fog = Object.assign({}, state.fog, { revealOrder: {}, revealSeq: 0, revealStep: 0 });
          persist(next);
          return next;
        });
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
      var stateBefore = store.getState();
      var selectedActor = byId(stateBefore.selectedTokenId);
      if (kind === 'enemy' && selectedActor && String(selectedActor.faction) === 'monster') {
        var tokenTargetSelEnemy = document.getElementById('combatTokenTargetSel');
        var tIdEnemy = String(tokenTargetSelEnemy && tokenTargetSelEnemy.value || '');
        var targetEnemy = tIdEnemy ? byId(tIdEnemy) : null;
        var tokenActionSelEnemy = document.getElementById('combatTokenActionSel');
        var selectedEnemyAction = String(tokenActionSelEnemy && tokenActionSelEnemy.value || 'enemy_action');
        executeEnemyTokenAction(selectedActor, targetEnemy, selectedEnemyAction);
        return;
      }
      if (kind === 'enemy') {
        var activeRow = stateBefore.initiative && stateBefore.initiative[stateBefore.initiativeIndex] || null;
        var activeActor = activeRow ? byId(activeRow.tokenId) : null;
        if (activeActor && String(activeActor.faction) === 'monster') {
          executeEnemyTokenAction(activeActor, null, 'enemy_action');
          return;
        }
        var firstEnemy = (stateBefore.tokens || []).find(function (row) {
          return row && String(row.faction) === 'monster' && !isTokenDead(row);
        }) || null;
        if (firstEnemy) {
          safeNotif('Not enemy turn yet. Advance initiative to Enemy lane.', 'warn');
          return;
        }
      }
      try {
        if (kind === 'strike' && typeof window.rollAttack === 'function') window.rollAttack('strike');
        else if (kind === 'shoot' && typeof window.rollAttack === 'function') window.rollAttack('shoot');
        else if (kind === 'defend' && typeof window.rollDefend === 'function') window.rollDefend();
        else if (kind === 'trauma' && typeof window.rollTraumaCheck === 'function') window.rollTraumaCheck();
        else if (kind === 'enemy' && typeof window.doEnemyTurn === 'function') window.doEnemyTurn();
      } catch (_err) {}
      tryApplyLegacyDamageToTokens(kind);
      updateUiPanels();
    }

    function tryApplyLegacyDamageToTokens(kind) {
      var el = null;
      if (kind === 'enemy') el = document.getElementById('enemyActionResult');
      else if (kind === 'wayfarer') el = document.getElementById('wayfarerActionResult') || document.getElementById('attackResult');
      else el = document.getElementById('attackResult');
      if (!el) return;
      var text = el.textContent || el.innerText || '';
      var match = text.match(/HIT!\s*(\d+)\s*(Stress|Health\s*damage)/i)
        || text.match(/(\d+)\s*(Stress|Health\s*damage)/i)
        || text.match(/deals?\s*(\d+)\s*(Stress|Health\s*damage)/i);
      if (!match) return;
      var damage = Math.max(1, parseInt(match[1], 10));
      var isCrit = /crit/i.test(text);
      var state = store.getState();
      var tokenTargetSel = document.getElementById('combatTokenTargetSel');
      var targetId = String(tokenTargetSel && tokenTargetSel.value || '');
      var target = targetId ? byId(targetId) : null;
      if (!target) {
        if (kind === 'enemy') {
          var players = (state.tokens || []).filter(function (t) { return t && !isTokenDead(t) && String(t.faction) === 'player'; });
          players.sort(function (a, b) { return Number(a.hp || 0) - Number(b.hp || 0); });
          target = players[0] || null;
        } else {
          var actor = byId(state.selectedTokenId) || (state.tokens || []).find(function (t) { return t && t.isPlayer; });
          var enemies = (state.tokens || []).filter(function (t) { return t && String(t.faction) === 'monster' && Number(t.hp || 0) > 0; });
          if (actor && enemies.length) {
            enemies.sort(function (a, b) { return hexDistance({ q: actor.q, r: actor.r }, { q: a.q, r: a.r }) - hexDistance({ q: actor.q, r: actor.r }, { q: b.q, r: b.r }); });
            target = enemies[0];
          }
        }
      }
      if (!target) return;
      var deathNumber = Math.max(1, Number(target.deathNumber || target.dread || target.codexDread || 6));
      var lethal = isCrit || damage >= deathNumber;
      var dealt = lethal ? Math.max(0, Number(target.hp || 0)) : damage;
      var newHp = applyDamageToToken(target.id, dealt, kind === 'enemy' ? 'Enemy Action' : 'Player Action');
      var notifEl = document.getElementById('combatLastNotification');
      if (notifEl) notifEl.textContent = String(target.name || 'Enemy') + ' takes ' + dealt + ' stress' + (lethal ? ' · Instant kill' : '') + ' · HP: ' + newHp;
      drawBoard();
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

    var tokenExecuteBtn = document.getElementById('combatTokenExecuteActionBtn');
    if (tokenExecuteBtn && !tokenExecuteBtn._bound) {
      tokenExecuteBtn._bound = true;
      tokenExecuteBtn.onclick = function () {
        var tokenActionSel = document.getElementById('combatTokenActionSel');
        var tokenTargetSel = document.getElementById('combatTokenTargetSel');
        var actionVal = String(tokenActionSel && tokenActionSel.value || '');
        var targetVal = String(tokenTargetSel && tokenTargetSel.value || '');
        var actor = byId(store.getState().selectedTokenId);
        if (!actor) {
          safeNotif('Select a token first.', 'warn');
          return;
        }
        if (String(actor.faction) === 'monster') {
          var directTarget = targetVal ? byId(targetVal) : null;
          executeEnemyTokenAction(actor, directTarget, actionVal || 'enemy_action');
          return;
        }
        if (!actionVal) {
          safeNotif('Choose a token action first.', 'warn');
          return;
        }
        var lowerAction = actionVal.toLowerCase();
        var utilityLike = /use_item|utility|backpack|hack|flavor|personal_flavor/.test(lowerAction);
        if (utilityLike) {
          if (/flavor|personal_flavor/.test(lowerAction) && typeof window.usePersonalFlavorAction === 'function') {
            try { window.usePersonalFlavorAction(); } catch (_flavorErr) {}
            addHistory('Wayfarer utility executed: Personal Flavor.');
          } else if (typeof window.openCombatUtilityChooser === 'function') {
            try { window.openCombatUtilityChooser(); } catch (_chooserErr) {}
            addHistory('Wayfarer utility chooser opened from Combat Scene.');
          } else if (typeof window.promptWayfarerBackpackOrFlavor === 'function') {
            try { window.promptWayfarerBackpackOrFlavor(); } catch (_promptErr) {}
            addHistory('Wayfarer utility menu opened from Combat Scene.');
          } else {
            safeNotif('Utility actions are unavailable right now.', 'warn');
          }
          tryApplyLegacyDamageToTokens('wayfarer');
          updateUiPanels();
          return;
        }
        if (targetVal) {
          var target = byId(targetVal);
          if (target && actor) {
            var dist = hexDistance({ q: actor.q, r: actor.r }, { q: target.q, r: target.r });
            if (dist <= 1 && /shoot/i.test(actionVal)) {
              safeNotif('Target is engaged. Use Strike instead of Shoot.', 'warn');
              return;
            }
            if (!canActionReachTarget(actionVal, dist)) {
              safeNotif('Target is out of range for this action.', 'warn');
              return;
            }
          }
        }
        var legacySel = document.getElementById('wayfarerActionSel');
        if (legacySel) legacySel.value = actionVal;
        try {
          if (typeof window.updateWayfarerActionBtn === 'function') window.updateWayfarerActionBtn();
        } catch (_err) {}
        if (typeof window.executeWayfarerAction === 'function') {
          try { window.executeWayfarerAction(); } catch (_err2) {}
        }
        tryApplyLegacyDamageToTokens('wayfarer');
        var selectedOpt = legacySel && legacySel.options ? legacySel.options[legacySel.selectedIndex] : null;
        var actionLabel = selectedOpt ? String(selectedOpt.textContent || actionVal) : actionVal;
        addHistory('Wayfarer action executed (Combat Tab rules): ' + actionLabel + '.');
        updateUiPanels();
      };
    }

    var tokenEnemyBtn = document.getElementById('combatTokenEnemyActionBtn');
    if (tokenEnemyBtn && !tokenEnemyBtn._bound) {
      tokenEnemyBtn._bound = true;
      tokenEnemyBtn.onclick = function () {
        var tokenActionSel = document.getElementById('combatTokenActionSel');
        var tokenTargetSel = document.getElementById('combatTokenTargetSel');
        var actor = byId(store.getState().selectedTokenId);
        if (!actor || String(actor.faction) !== 'monster') {
          safeNotif('Select an enemy token to use enemy actions.', 'warn');
          return;
        }
        var actionVal = String(tokenActionSel && tokenActionSel.value || 'enemy_action');
        var targetId = String(tokenTargetSel && tokenTargetSel.value || '');
        var target = targetId ? byId(targetId) : null;
        executeEnemyTokenAction(actor, target, actionVal || 'enemy_action');
      };
    }

    var lootBodyBtn = document.getElementById('combatLootBodyBtn');
    if (lootBodyBtn && !lootBodyBtn._bound) {
      lootBodyBtn._bound = true;
      lootBodyBtn.onclick = function () {
        var st = store.getState();
        var token = byId(st.selectedTokenId);
        if (!token || !isTokenDead(token)) {
          safeNotif('Select a defeated token to loot the body.', 'warn');
          return;
        }
        var drop = getLootDropForToken(st, token.id);
        if (!drop || drop.claimed) {
          safeNotif('No loot available on this body.', 'warn');
          return;
        }
        var board = st.board || {};
        var size = Number(board.size || 42) * Number(board.zoom || 1);
        var pos = axialToPixel(Number(token.q || 0), Number(token.r || 0), size, Number(board.panX || 0), Number(board.panY || 0));
        openLootPopupForToken(token.id, pos.x, pos.y);
      };
    }

    var lootCloseBtn = document.getElementById('combatLootCloseBtn');
    if (lootCloseBtn && !lootCloseBtn._bound) {
      lootCloseBtn._bound = true;
      lootCloseBtn.onclick = function () { closeLootPopup(); };
    }

    var lootTakeAllBtn = document.getElementById('combatLootTakeAllBtn');
    if (lootTakeAllBtn && !lootTakeAllBtn._bound) {
      lootTakeAllBtn._bound = true;
      lootTakeAllBtn.onclick = function () {
        var card = document.getElementById('combatLootPopupCard');
        var tokenId = String(card && card.dataset.tokenId || '');
        if (!tokenId) {
          safeNotif('Open a body loot card first.', 'warn');
          return;
        }
        takeLootFromTokenDrop(tokenId, null, 'Take All');
      };
    }

    var lootTakeSelectedBtn = document.getElementById('combatLootTakeSelectedBtn');
    if (lootTakeSelectedBtn && !lootTakeSelectedBtn._bound) {
      lootTakeSelectedBtn._bound = true;
      lootTakeSelectedBtn.onclick = function () {
        var card = document.getElementById('combatLootPopupCard');
        var tokenId = String(card && card.dataset.tokenId || '');
        if (!tokenId) {
          safeNotif('Open a body loot card first.', 'warn');
          return;
        }
        var checks = card ? Array.prototype.slice.call(card.querySelectorAll('input[data-loot-idx]:checked')) : [];
        var indexes = checks.map(function (node) { return Number(node.getAttribute('data-loot-idx')); });
        takeLootFromTokenDrop(tokenId, indexes, 'Take Selected');
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
            applyDamageToToken(target.id, kill ? Math.max(0, Number(target.hp || 0)) : dmg, ally.name || 'Ally');
            store.setState(function (inner) {
              var next = Object.assign({}, inner);
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
    var clearMapBtn = document.getElementById('combatClearMapBtn');
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

    if (clearMapBtn && !clearMapBtn._bound) {
      clearMapBtn._bound = true;
      clearMapBtn.onclick = function () {
        store.setState(function (state) {
          var next = Object.assign({}, state);
          next.board = Object.assign({}, state.board, { background: '' });
          persist(next);
          return next;
        });
        backgroundCache.src = '';
        backgroundCache.img = null;
        addHistory('Battlemap removed.');
        safeNotif('Battlemap removed.', 'good');
        drawBoard();
        updateUiPanels();
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
          var wayfarerName = canonicalWayfarerName();
          var maxHpByRules = getWayfarerMaxHpByRules();
          var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';
          var t = {
            id: uid('player'),
            name: wayfarerName,
            faction: 'player',
            hp: maxHpByRules,
            maxHp: maxHpByRules,
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

  function showCombatRulesReference() {
    var html = ''
      + '<div style="font-size:.82rem;line-height:1.55;color:var(--text2);">'
      + '<div><strong>Core Check:</strong> roll Action vs enemy Dread. Beat to succeed.</div>'
      + '<div><strong>Turns:</strong> each token acts once per round by initiative order.</div>'
      + '<div><strong>Movement:</strong> terrain and hazards can increase action cost.</div>'
      + '<div><strong>Fog:</strong> use Fog tools to reveal tactical visibility.</div>'
      + '<div><strong>Cover:</strong> use terrain and object layers to reduce incoming damage.</div>'
      + '</div>';
    if (typeof window.openModal === 'function') {
      window.openModal('Combat Rules Reference', html, null, { preventScroll: true, focusTrap: true });
    } else {
      safeNotif('Combat rules reference is available in modal-enabled views.', 'info');
    }
  }

  function buildSceneSnapshotFromState(state, sceneId, sceneName) {
    var id = String(sceneId || uid('scene'));
    return {
      id: id,
      name: String(sceneName || ('Scene ' + id.slice(-4))),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      board: clone(state.board || { cols: 15, rows: 15, zoom: 1, panX: 0, panY: 0 }),
      layers: clone(state.layers || {}),
      fog: clone(state.fog || {}),
      sceneRules: clone(state.sceneRules || {}),
      tokens: clone(state.tokens || []),
      initiative: clone(state.initiative || []),
      actionHistory: clone((state.actionHistory || []).slice(0, 200)),
      sceneOpener: clone(state.sceneOpener || null)
    };
  }

  function saveSceneCard(sceneName) {
    var savedId = '';
    store.setState(function (state) {
      var next = normalizeCombatSceneState(Object.assign({}, state));
      var scenes = Array.isArray(next.scenes) ? next.scenes.slice() : [];
      var activeId = String(next.activeSceneId || '');
      var existingIdx = activeId
        ? scenes.findIndex(function (scene) { return scene && String(scene.id) === activeId; })
        : -1;
      var targetName = String(sceneName || '').trim();
      var snapshot;

      if (existingIdx >= 0) {
        var existing = scenes[existingIdx] || {};
        snapshot = buildSceneSnapshotFromState(next, existing.id, targetName || existing.name || 'Scene');
        snapshot.createdAt = Number(existing.createdAt || snapshot.createdAt || Date.now());
        scenes[existingIdx] = snapshot;
      } else {
        snapshot = buildSceneSnapshotFromState(next, uid('scene'), targetName || ('Scene ' + (scenes.length + 1)));
        scenes.push(snapshot);
      }

      savedId = String(snapshot.id || '');
      next.scenes = scenes;
      next.activeSceneId = savedId;
      persist(next);
      return next;
    });
    safeNotif('Scene saved.', 'good');
  }

  function loadSceneCard(sceneId) {
    var targetId = String(sceneId || '');
    if (!targetId) return;
    var loaded = false;
    store.setState(function (state) {
      var next = normalizeCombatSceneState(Object.assign({}, state));
      var scenes = Array.isArray(next.scenes) ? next.scenes.slice() : [];
      var scene = scenes.find(function (entry) { return entry && String(entry.id) === targetId; }) || null;
      if (!scene) return next;

      next.activeSceneId = String(scene.id || '');
      next.board = normalizeBoard(Object.assign({}, next.board || {}, clone(scene.board || {})));
      next.layers = clone(scene.layers || {});
      next.fog = clone(scene.fog || {});
      next.sceneRules = clone(scene.sceneRules || {});
      next.tokens = clone(scene.tokens || []);
      next.initiative = clone(scene.initiative || []);
      next.actionHistory = clone(scene.actionHistory || []);
      next.selectedTokenId = next.tokens.length ? String((next.tokens[0] && next.tokens[0].id) || '') : '';
      next.currentTurnIndex = 0;
      next.initiativeIndex = 0;
      persist(next);
      loaded = true;
      return next;
    });

    if (!loaded) {
      safeNotif('Scene not found.', 'warn');
      return;
    }
    addHistory('Scene loaded from card library.');
    updateUiPanels();
    drawBoard();
    safeNotif('Scene loaded.', 'good');
  }

  function createSceneFromTemplate(templateKey) {
    var key = String(templateKey || 'blank').toLowerCase();
    var templates = {
      blank: {
        board: { cols: 15, rows: 15, zoom: 1, panX: 0, panY: 0 },
        layers: { terrain: {}, objects: {}, hazards: {}, elevation: {}, lighting: {}, weather: {}, foreground: {}, interactives: {}, spawns: {} },
        fog: {},
        name: 'Blank Scene'
      },
      dungeon: {
        board: { cols: 15, rows: 15, zoom: 1, panX: 0, panY: 0 },
        layers: {
          terrain: { '6,6': 'ruins', '7,6': 'ruins', '8,6': 'ruins', '8,7': 'ruins' },
          objects: { '7,7': 'obstacle', '9,6': 'door' },
          hazards: { '10,6': 'trap' },
          elevation: {}, lighting: {}, weather: {}, foreground: {},
          interactives: { '9,7': 'chest' },
          spawns: { '11,6': 'spawn' }
        },
        fog: { enabled: true, revealed: {} },
        name: 'Dungeon Scene'
      },
      spaceship: {
        board: { cols: 16, rows: 12, zoom: 1, panX: 0, panY: 0 },
        layers: {
          terrain: { '4,4': 'ruins', '5,4': 'ruins', '6,4': 'ruins' },
          objects: { '7,4': 'door', '8,4': 'wall' },
          hazards: { '10,5': 'trap' },
          elevation: {}, lighting: {}, weather: {}, foreground: {},
          interactives: { '6,5': 'console' },
          spawns: { '3,5': 'spawn', '12,5': 'spawn' }
        },
        fog: { enabled: true, revealed: {} },
        name: 'Space Ship Interior'
      },
      navalship: {
        board: { cols: 18, rows: 10, zoom: 1, panX: 0, panY: 0 },
        layers: {
          terrain: { '5,4': 'water', '6,4': 'water', '7,4': 'water' },
          objects: { '4,3': 'door', '9,3': 'obstacle' },
          hazards: { '11,5': 'trap' },
          elevation: {}, lighting: {}, weather: { '0,0': 'storm' }, foreground: {},
          interactives: { '8,3': 'turret' },
          spawns: { '2,5': 'spawn', '14,5': 'spawn' }
        },
        fog: { enabled: true, revealed: {} },
        name: 'Naval Vessel Deck'
      }
    };

    var tpl = templates[key] || templates.blank;
    store.setState(function (state) {
      var next = normalizeCombatSceneState(Object.assign({}, state));
      next.board = normalizeBoard(Object.assign({}, next.board || {}, tpl.board || {}));
      next.layers = clone(tpl.layers || {});
      next.fog = clone(tpl.fog || {});
      next.tokens = [];
      next.initiative = [];
      next.actionHistory = [];
      next.selectedTokenId = '';
      var newSceneId = uid('scene');
      var newScene = {
        id: newSceneId,
        name: String(tpl.name || 'Scene Template'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        board: clone(next.board),
        layers: clone(next.layers),
        fog: clone(next.fog),
        sceneRules: clone(next.sceneRules || {}),
        tokens: clone(next.tokens),
        initiative: clone(next.initiative),
        actionHistory: clone(next.actionHistory)
      };
      next.scenes = (next.scenes || []).concat([newScene]);
      next.activeSceneId = newSceneId;
      window._currentSceneEditId = newSceneId;
      persist(next);
      return next;
    });
    addHistory('Scene template applied: ' + String(tpl.name || key) + '.');
    updateUiPanels();
    drawBoard();
    safeNotif('Template scene created: ' + String(tpl.name || key) + '.', 'good');
  }

  function bindSceneLibraryControls() {
    var rulesBtn = document.getElementById('combatRulesReferenceBtn');
    if (rulesBtn && !rulesBtn._bound) {
      rulesBtn._bound = true;
      rulesBtn.onclick = function () {
        showCombatRulesReference();
      };
    }

    var saveSceneBtn = document.getElementById('combatSaveSceneCardBtn');
    if (saveSceneBtn && !saveSceneBtn._bound) {
      saveSceneBtn._bound = true;
      saveSceneBtn.onclick = function () {
        saveSceneCard();
      };
    }

    var loadSceneBtn = document.getElementById('combatLoadSceneCardBtn');
    if (loadSceneBtn && !loadSceneBtn._bound) {
      loadSceneBtn._bound = true;
      loadSceneBtn.onclick = function () {
        var state = store.getState();
        var scenes = Array.isArray(state.scenes) ? state.scenes : [];
        if (!scenes.length) {
          safeNotif('No saved scenes yet. Create and save one first.', 'warn');
          return;
        }
        var options = scenes.map(function (scene, idx) {
          var updated = formatClockTime(Number(scene.updatedAt || scene.createdAt || 0));
          var name = String(scene.name || ('Scene ' + (idx + 1))).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return '<option value="' + String(scene.id) + '">' + name + ' · ' + updated + '</option>';
        }).join('');
        var modal = '<div style="font-size:.78rem;"><select id="sceneLoadSelect" style="width:100%;padding:.3rem;margin:.2rem 0;border:1px solid rgba(227,188,94,.5);background:rgba(9,13,24,.95);color:#fff;">' + options + '</select><div style="margin-top:.3rem;display:flex;gap:.2rem;"><button class="btn btn-xs btn-primary" onclick="(function(){var sel=document.getElementById(\'sceneLoadSelect\');if(sel&&window.loadSceneCard)window.loadSceneCard(sel.value);if(typeof window.closeModal===\'function\')window.closeModal();})();">Load</button><button class="btn btn-xs" onclick="if(typeof window.closeModal===\'function\')window.closeModal();">Cancel</button></div></div>';
        if (typeof window.openModal === 'function') {
          window.openModal('Load Scene Card', modal, null, { preventScroll: true, focusTrap: true });
        }
      };
    }

    var newSceneBtn = document.getElementById('combatNewSceneTemplateBtn');
    if (newSceneBtn && !newSceneBtn._bound) {
      newSceneBtn._bound = true;
      newSceneBtn.onclick = function () {
        var modal = '<div style="font-size:.78rem;display:grid;gap:.3rem;"><div style="margin-bottom:.15rem;">Choose a scene template:</div><button class="btn btn-xs btn-primary" style="width:100%;" onclick="if(window.createSceneFromTemplate)window.createSceneFromTemplate(\'blank\');if(typeof window.closeModal===\'function\')window.closeModal();">Blank Canvas</button><button class="btn btn-xs" style="width:100%;" onclick="if(window.createSceneFromTemplate)window.createSceneFromTemplate(\'dungeon\');if(typeof window.closeModal===\'function\')window.closeModal();">Dungeon Chamber</button><button class="btn btn-xs" style="width:100%;" onclick="if(window.createSceneFromTemplate)window.createSceneFromTemplate(\'spaceship\');if(typeof window.closeModal===\'function\')window.closeModal();">Space Ship Interior</button><button class="btn btn-xs" style="width:100%;" onclick="if(window.createSceneFromTemplate)window.createSceneFromTemplate(\'navalship\');if(typeof window.closeModal===\'function\')window.closeModal();">Naval Vessel Deck</button><button class="btn btn-xs" style="width:100%;" onclick="if(typeof window.closeModal===\'function\')window.closeModal();">Cancel</button></div>';
        if (typeof window.openModal === 'function') {
          window.openModal('New Scene from Template', modal, null, { preventScroll: true, focusTrap: true });
        } else {
          createSceneFromTemplate('blank');
        }
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
        var next = normalizeCombatSceneState(Object.assign({}, state));
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
          next.board = normalizeBoard(Object.assign({}, next.board, seed.board));
        }
        persist(next);
        return next;
      });
    } else {
      store.setState(function (state) {
        var next = Object.assign({}, state);
        next.tokens = clone(state.tokens || []);
        next.initiative = clone(state.initiative || []);
        next.actionHistory = clone(state.actionHistory || []);
        next.tokenRoundEffects = [];
        next.board = normalizeBoard(Object.assign({}, state.board || {}, { cols: 15, rows: 15, zoom: 1, panX: 640, panY: 340 }));
        next.layers = Object.assign({
          terrain: {},
          objects: {},
          hazards: {},
          elevation: {},
          lighting: {},
          wallSegments: {},
          weather: {},
          foreground: {},
          interactives: {},
          spawns: {},
          labels: {}
        }, clone(state.layers || {}));
        next.fog = Object.assign({
          enabled: false,
          showMask: true,
          revealMode: 'manual',
          visionRadius: 3,
          revealed: {},
          revealOrder: {},
          revealSeq: 0,
          revealStep: 0
        }, clone(state.fog || {}));
        next.sceneRules = Object.assign({ rollMode: 'auto', defaultActionType: 'ranged', targetCoverOverrides: {}, lootDrops: {} }, clone(state.sceneRules || {}));
        next.selectedTokenId = '';
        if (!next.activeSceneId && Array.isArray(next.scenes) && next.scenes.length) next.activeSceneId = String(next.scenes[0].id || '');
        persist(next);
        return next;
      });
    }

    store.setState({ open: true, entering: true });
    var splash = document.getElementById('combatEntrySplash');
    if (splash) {
      splash.classList.remove('hidden');
      setTimeout(function () {
        splash.classList.add('hidden');
        store.setState({ entering: false });
      }, 900);
    }
    store.setState(function (state) {
      var activeCombat = !!(window.S && window.S.combat && window.S.combat.active);
      var next = Object.assign({}, state, { playMode: activeCombat ? true : !!state.playMode });
      persist(next);
      return next;
    });
    root.classList.add('open');
    setPanelPositions();
    try {
      updateUiPanels();
      drawBoard();
    } catch (_err) {
      store.setState({ entering: false });
      safeNotif('Combat scene opened with a fallback state because the saved scene data was invalid.', 'warn');
    }

    var hasExistingScene = !!(seed && typeof seed === 'object' && seed.id);
    addHistory('Entering encounter. Combat mode online.' + (hasExistingScene ? ' Scene loaded.' : ' Fresh canvas ready.'));
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

  function zoneToSeedHex(zoneName, laneIndex) {
    var z = String(zoneName || 'Nearby').toLowerCase();
    var lane = Math.max(0, Number(laneIndex || 0));
    var row = lane - 1;
    if (z.indexOf('engaged') >= 0) return { q: 0, r: row };
    if (z.indexOf('close') >= 0) return { q: 2, r: row };
    if (z.indexOf('nearby') >= 0) return { q: 4, r: row };
    if (z.indexOf('far') >= 0) return { q: 6, r: row };
    return { q: 4, r: row };
  }

  function getEnemyTrackerByName(name) {
    var needle = String(name || '').trim().toLowerCase();
    if (!needle || !window.S || !Array.isArray(window.S.enemies)) return null;
    return window.S.enemies.find(function (entry) {
      if (!entry || entry.ally) return false;
      return String(entry.name || '').trim().toLowerCase() === needle;
    }) || null;
  }

  function buildSeedFromCombatMapState() {
    if (!window.S || !window.S.combatMap || !Array.isArray(window.S.combatMap.units) || !window.S.combatMap.units.length) return null;
    var units = window.S.combatMap.units.slice();
    var zoneLane = {};
    var playerName = String(window.S && window.S.name || 'Wayfarer').trim() || 'Wayfarer';
    var maxHpByRules = getWayfarerMaxHpByRules();
    var portrait = (window.S && window.S.identityForge && window.S.identityForge.media && window.S.identityForge.media.portrait) || '';

    var tokens = units.map(function (unit, idx) {
      if (!unit) return null;
      var zone = String(unit.zone || 'Nearby');
      var laneKey = String(unit.side || 'enemy') + ':' + zone;
      zoneLane[laneKey] = Math.max(0, Number(zoneLane[laneKey] || 0)) + 1;
      var pos = zoneToSeedHex(zone, zoneLane[laneKey]);
      var isAlly = String(unit.side || 'enemy') !== 'enemy';
      var isPlayer = !!unit.isPlayer || String(unit.name || '').trim().toLowerCase() === playerName.toLowerCase();

      if (isAlly) {
        return {
          id: String(unit.id || uid('ally-' + idx)),
          name: String(unit.name || (isPlayer ? playerName : ('Ally ' + (idx + 1)))),
          faction: 'player',
          hp: isPlayer ? maxHpByRules : 10,
          maxHp: isPlayer ? maxHpByRules : 10,
          status: [],
          q: Number(pos.q || 0),
          r: Number(pos.r || 0),
          image: isPlayer ? String(portrait || '') : '',
          size: 1,
          isPlayer: !!isPlayer
        };
      }

      var trackerEnemy = getEnemyTrackerByName(unit.name);
      var dread = Math.max(4, Number((trackerEnemy && trackerEnemy.dread) || unit.dread || 6));
      var maxStress = Math.max(1, Number((trackerEnemy && trackerEnemy.maxStress) || (dread * 2)));
      var curStress = Math.max(0, Number((trackerEnemy && trackerEnemy.stress) || 0));
      return {
        id: String(unit.id || uid('enm-' + idx)),
        name: String(unit.name || ('Enemy ' + (idx + 1))),
        faction: 'monster',
        hp: Math.max(1, maxStress - curStress),
        maxHp: maxStress,
        status: [],
        q: Number(pos.q || 0),
        r: Number(pos.r || 0),
        image: '',
        size: 1,
        dread: dread,
        deathNumber: dread
      };
    }).filter(Boolean);

    if (!tokens.length) return null;
    return {
      name: 'Live Combat Map',
      tokens: tokens,
      history: ['Loaded from current Combat tab units and zone map layout.']
    };
  }

  function buildLiveCombatSeed() {
    var mapSeed = buildSeedFromCombatMapState();
    if (mapSeed) return mapSeed;
    var tokens = seedFromCurrentCombat();
    if (Array.isArray(tokens) && tokens.length) {
      return {
        name: 'Live Combat State',
        tokens: tokens,
        history: ['Loaded from current combat tracker state.']
      };
    }
    return null;
  }

  window.openCombatSceneEditor = function (seed) {
    openOverlay(seed || null);
  };
  
  window.closeCombatSceneEditor = function () {
    closeOverlay();
  };

  window.closeCombatSceneEditor = function () {
    closeOverlay();
  };

  window.openCombatSceneEditorFromExpedition = function () {
    var seed = expeditionSeed() || buildLiveCombatSeed();
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
    
    var ZONE_TABLE = ['Clear Ground','Debris Field','Urban Alley','Dark Interior','Elevated Position','Flooded Zone','Trench Line','Open Field','Fortified Cover','Storm Zone'];
    var REACTION_TABLE = ['Aggressive','Aggressive','Aggressive','Cautious','Cautious','Fearful','Fearful','Neutral','Flanking','Ambush'];
    var ACTIVITY_TABLE = ['Patrolling','Holding Position','Pursuing','Retreating','Looting or scavenging','Setting Trap'];
    var zoneRoll = Math.floor(Math.random() * 10);
    var coverRoll = Math.floor(Math.random() * 4 + 1) + Math.floor(Math.random() * 20 + 1);
    var reactionRoll = Math.floor(Math.random() * 10);
    var activityRoll = Math.floor(Math.random() * 6);
    var coverLabel = coverRoll <= 9 ? 'No Cover' : coverRoll <= 14 ? 'Light Cover (+1 Defend)' : coverRoll <= 19 ? 'Medium Cover (+2 Defend)' : coverRoll <= 24 ? 'Heavy Cover (+2 Defend, Blocked Sight)' : 'Full Cover';
    var sceneOpener = {
      zone: ZONE_TABLE[zoneRoll],
      zoneDie: zoneRoll + 1,
      cover: coverLabel,
      coverDie: coverRoll,
      enemyReaction: REACTION_TABLE[reactionRoll],
      reactionDie: reactionRoll + 1,
      enemyActivity: ACTIVITY_TABLE[activityRoll],
      activityDie: activityRoll + 1
    };

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
      actionHistory: [],
      sceneOpener: sceneOpener
    };
    
    scenes.push(newScene);
    store.setState({
      scenes: scenes,
      activeSceneId: sceneId
    });
    
    window._currentSceneEditId = sceneId;
    renderScenesList();
    showSceneBuilder(sceneId);
    var openerSummary = '🎬 ' + sceneOpener.zone + ' · ' + sceneOpener.cover + ' · ' + sceneOpener.enemyReaction + ' · ' + sceneOpener.enemyActivity;
    safeNotif('Scene created: ' + newScene.name + ' — ' + openerSummary);
    var openerEl = document.getElementById('combatSceneOpenerSummary');
    if (openerEl) openerEl.textContent = openerSummary;
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
    if (!window.__combatScenesTabSubscribed) {
      window.__combatScenesTabSubscribed = true;
      store.subscribe(function () {
        renderScenesList();
      });
    }
  };

  window.applyCombatQuickEffect = function (label, stress, rounds) {
    var st = store.getState();
    var token = byId(st.selectedTokenId);
    if (!token) {
      safeNotif('Select a token first.', 'warn');
      return;
    }
    addTokenRoundEffect(String(token.id), String(label || 'Condition'), Number(stress || 1), Number(rounds || 2), '#e3bc5e');
    updateUiPanels();
    drawBoard();
  };

  window.applyCombatSettingsFromModal = function () {
    var fogEnabled = !!(document.getElementById('combatSettingsFogEnabled') && document.getElementById('combatSettingsFogEnabled').checked);
    var autoRoll = !!(document.getElementById('combatSettingsAutoRoll') && document.getElementById('combatSettingsAutoRoll').checked);
    store.setState(function (state) {
      var next = Object.assign({}, state, { autoRoll: autoRoll });
      next.fog = Object.assign({
        enabled: false,
        showMask: true,
        revealMode: 'manual',
        visionRadius: 3,
        revealed: {},
        revealOrder: {},
        revealSeq: 0,
        revealStep: 0
      }, state.fog || {}, { enabled: fogEnabled });
      persist(next);
      return next;
    });
    drawBoard();
    updateUiPanels();
  };

  window.showCombatRulesReference = showCombatRulesReference;
  window.saveSceneCard = saveSceneCard;
  window.loadSceneCard = loadSceneCard;
  window.createSceneFromTemplate = createSceneFromTemplate;

  window.CombatSceneStore = {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    addHistory: addHistory
  };

  window.getCombatSceneSharedModifier = function (actionKey, options) {
    return resolveSharedSceneModifiers(actionKey, options);
  };

  window.sendCombatTablePing = function (identity, q, r) {
    var qq = Number(q || 0);
    var rr = Number(r || 0);
    placeTablePing(qq, rr, String(identity || currentPingIdentity()));
  };
})();
