/**
 * world-consequence.js
 * Phase 1 — Normalize and Persist Consequences
 *
 * Provides:
 *   window.recordWorldConsequence(event)  — fulfilled stub expected by all existing callers
 *   window.applyWorldConsequence(event)   — alias; the single consequence pipeline
 *   window.getWorldStateHexOverlay(key)   — province map overlay data per hex key "col,row"
 *   window.getConsequenceMissionBias()    — mission generation bias from current world state
 *   window.triggerFactionTurn()           — lightweight faction simulation tick
 *   window.getWorldConsequenceFeed()      — last N consequence entries for the feed panel
 *   window.ensureWorldState()             — lazy initialiser (safe to call anywhere)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var MAX_FEED = 20;
  var MAX_CRISES = 5;
  var MAX_HEX_HISTORY = 10;
  var RECENT_CHANGE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes — "recently changed" glow

  var FACTION_IDS = ['rebels', 'guilds', 'church', 'empire', 'syndicate', 'scholars'];

  var FACTION_OPERATIONS = [
    { op: 'expand',      label: 'expanded influence',  deltas: { stability: -1, factionHeat: 1  }, severity: 'medium', posture: 'expanding'    },
    { op: 'retaliate',   label: 'retaliated',           deltas: { stability: -2, factionHeat: 2  }, severity: 'high',   posture: 'retaliating'  },
    { op: 'secure',      label: 'secured a route',      deltas: { stability: 1,  factionHeat: -1 }, severity: 'info',   posture: 'entrenched'   },
    { op: 'destabilize', label: 'destabilized a rival', deltas: { stability: -1, rumor: 1        }, severity: 'medium', posture: 'expanding'    },
    { op: 'negotiate',   label: 'opened negotiations',  deltas: { stability: 1,  witness: 1      }, severity: 'info',   posture: 'negotiating'  },
    { op: 'weaken',      label: 'suffered losses',      deltas: { stability: -1, factionHeat: -1 }, severity: 'medium', posture: 'weakened'     }
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getS() {
    return (typeof window !== 'undefined' && window.S && typeof window.S === 'object') ? window.S : null;
  }

  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (_e) { return obj; }
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v || 0)); }

  // ---------------------------------------------------------------------------
  // World-state initialiser
  // ---------------------------------------------------------------------------
  function ensureWorldState() {
    var S = getS();
    if (!S) return null;
    if (!S.worldState || typeof S.worldState !== 'object') {
      S.worldState = {
        version: 1,
        regions: {
          province: { hexes: {}, routes: {}, settlements: {} },
          sea:      { hexes: {}, routes: {}, settlements: {} },
          galaxy:   { hexes: {}, routes: {}, settlements: {} },
          wtw:      { hexes: {}, districts: {}               },
          planet:   { cells: {}                               }
        },
        factions: {},
        activeCrises: [],
        consequenceFeed: []
      };
    }
    // Lazily ensure sub-keys so old saves don't break
    var ws = S.worldState;
    ws.regions     = ws.regions     || {};
    ws.factions    = ws.factions    || {};
    ws.activeCrises     = Array.isArray(ws.activeCrises) ? ws.activeCrises : [];
    ws.consequenceFeed  = Array.isArray(ws.consequenceFeed) ? ws.consequenceFeed : [];
    ['province','sea','galaxy','wtw','planet'].forEach(function (r) {
      ws.regions[r] = ws.regions[r] || {};
      ws.regions[r].hexes = ws.regions[r].hexes || {};
    });
    return ws;
  }

  function ensureFactionWorldEntry(ws, factionId) {
    if (!factionId) return null;
    var id = String(factionId).toLowerCase();
    if (!ws.factions[id] || typeof ws.factions[id] !== 'object') {
      ws.factions[id] = {
        heatByRegion: {},
        controlByRegion: {},
        activeOperations: [],
        posture: 'entrenched'
      };
    }
    return ws.factions[id];
  }

  function ensureHexEntry(ws, region, key) {
    var r = String(region || 'province');
    ws.regions[r] = ws.regions[r] || { hexes: {}, routes: {}, settlements: {} };
    ws.regions[r].hexes = ws.regions[r].hexes || {};
    var k = String(key || '');
    if (!k) return null;
    if (!ws.regions[r].hexes[k] || typeof ws.regions[r].hexes[k] !== 'object') {
      ws.regions[r].hexes[k] = {
        control: '',
        tension: 0,
        prosperity: 0,
        safety: 0,
        tags: [],
        lastChange: 0,
        history: []
      };
    }
    return ws.regions[r].hexes[k];
  }

  // ---------------------------------------------------------------------------
  // Core consequence applicator
  // ---------------------------------------------------------------------------
  function applyWorldConsequence(rawEvent) {
    if (!rawEvent || typeof rawEvent !== 'object') return;
    var ws = ensureWorldState();
    if (!ws) return; // S not ready yet

    var now = Date.now();
    var event = {
      system:      String(rawEvent.system      || 'unknown'),
      title:       String(rawEvent.title       || 'World event'),
      detail:      String(rawEvent.detail      || ''),
      region:      String(rawEvent.region      || 'province').toLowerCase(),
      locationKey: String(rawEvent.locationKey || ''),
      severity:    String(rawEvent.severity    || 'info'),  // info | medium | high
      factionId:   String(rawEvent.factionId   || ''),
      deltas:      (rawEvent.deltas && typeof rawEvent.deltas === 'object') ? rawEvent.deltas : {},
      tags:        Array.isArray(rawEvent.tags) ? rawEvent.tags : [],
      at:          now
    };

    // If callers omit a province location, project onto current selected hex.
    if (!event.locationKey && event.region === 'province') {
      try {
        if (typeof window.getProvinceSelectedKey === 'function') {
          event.locationKey = String(window.getProvinceSelectedKey() || '');
        }
      } catch (_e0) {}
      if (!event.locationKey) {
        try {
          var sh = window.selectedHex;
          if (sh && typeof sh.col === 'number' && typeof sh.row === 'number') {
            event.locationKey = String(sh.col) + ',' + String(sh.row);
          }
        } catch (_e1) {}
      }
    }

    // ---- 1. Update hex state ------------------------------------------------
    if (event.locationKey) {
      var hexEntry = ensureHexEntry(ws, event.region, event.locationKey);
      if (hexEntry) {
        if (event.factionId) hexEntry.control = event.factionId;

        // Clamp numeric deltas
        var d = event.deltas;
        if (typeof d.tension    === 'number') hexEntry.tension    = clamp(hexEntry.tension    + d.tension,    -5, 10);
        if (typeof d.safety     === 'number') hexEntry.safety     = clamp(hexEntry.safety     + d.safety,      -5, 5);
        if (typeof d.prosperity === 'number') hexEntry.prosperity = clamp(hexEntry.prosperity + d.prosperity, -5, 5);

        // Translate generic deltas to hex fields
        if (typeof d.stability === 'number') hexEntry.safety     = clamp(hexEntry.safety + d.stability,     -5, 5);
        if (typeof d.factionHeat === 'number') hexEntry.tension  = clamp(hexEntry.tension + d.factionHeat,  -5, 10);

        // Tags
        event.tags.forEach(function (t) {
          if (hexEntry.tags.indexOf(t) < 0) hexEntry.tags.push(t);
        });
        if (hexEntry.tags.indexOf('recent-conflict') < 0 && event.severity === 'high') {
          hexEntry.tags.push('recent-conflict');
        }

        hexEntry.lastChange = now;
        hexEntry.history.unshift({ at: now, title: event.title, detail: event.detail, severity: event.severity });
        if (hexEntry.history.length > MAX_HEX_HISTORY) hexEntry.history.length = MAX_HEX_HISTORY;
      }
    }

    // ---- 2. Update faction world entry -------------------------------------
    if (event.factionId) {
      var fe = ensureFactionWorldEntry(ws, event.factionId);
      if (fe) {
        var r = event.region;
        fe.heatByRegion[r]    = clamp((fe.heatByRegion[r]    || 0) + (event.deltas.factionHeat || 0), 0, 10);
        fe.controlByRegion[r] = clamp((fe.controlByRegion[r] || 0) + (event.deltas.stability   || 0), 0, 10);
        // posture already set by faction turn; don't overwrite here unless entry is neutral
      }
    }

    // ---- 3. Consequence feed -----------------------------------------------
    ws.consequenceFeed.unshift({ at: now, system: event.system, title: event.title, detail: event.detail, severity: event.severity, region: event.region, locationKey: event.locationKey });
    if (ws.consequenceFeed.length > MAX_FEED) ws.consequenceFeed.length = MAX_FEED;

    // ---- 4. Active crises ---------------------------------------------------
    if (event.severity === 'high') {
      ws.activeCrises.unshift({ at: now, title: event.title, region: event.region, locationKey: event.locationKey });
      if (ws.activeCrises.length > MAX_CRISES) ws.activeCrises.length = MAX_CRISES;
    }

    // ---- 5. Refresh province map overlay if Province tab is visible ---------
    if (event.region === 'province') {
      try {
        if (typeof window.renderHexMap === 'function') window.renderHexMap();
      } catch (_e) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Map overlay accessor  (called from renderHexMap per hex)
  // ---------------------------------------------------------------------------
  function getWorldStateHexOverlay(key) {
    var S = getS();
    if (!S || !S.worldState) return null;
    var hexes = (S.worldState.regions && S.worldState.regions.province && S.worldState.regions.province.hexes) || {};
    var h = hexes[String(key || '')];
    if (!h) return null;
    return {
      control:      h.control     || '',
      tension:      h.tension     || 0,
      safety:       h.safety      || 0,
      prosperity:   h.prosperity  || 0,
      tags:         Array.isArray(h.tags) ? h.tags : [],
      recentChange: h.lastChange  ? (Date.now() - h.lastChange < RECENT_CHANGE_WINDOW_MS) : false,
      lastChange:   h.lastChange  || 0
    };
  }

  // ---------------------------------------------------------------------------
  // Mission generation bias
  // ---------------------------------------------------------------------------
  function getConsequenceMissionBias() {
    var S = getS();
    if (!S || !S.worldState) return { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    var crises = S.worldState.activeCrises || [];
    if (!crises.length) return { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    var latest = crises[0];
    return {
      focusRegion:    String(latest.region || 'province'),
      difficultyShift: crises.length >= 3 ? 1 : 0,
      rewardBonus:     crises.length >= 2 ? 50 : 0,
      preferredVerbs:  ['Stabilize', 'Investigate', 'Reclaim', 'Escort']
    };
  }

  // ---------------------------------------------------------------------------
  // Faction turn simulator
  // ---------------------------------------------------------------------------
  var _factionTurnBusy = false;
  var _lastFactionTurnAt = 0;
  var FACTION_TURN_COOLDOWN_MS = 2000; // debounce rapid calls

  function triggerFactionTurn() {
    if (_factionTurnBusy) return;
    var now = Date.now();
    if (now - _lastFactionTurnAt < FACTION_TURN_COOLDOWN_MS) return;
    _lastFactionTurnAt = now;
    _factionTurnBusy = true;
    try {
      runFactionTurn();
    } catch (_e) {}
    _factionTurnBusy = false;
  }

  function runFactionTurn() {
    var ws = ensureWorldState();
    if (!ws) return;

    // Gather live faction IDs from S.factionBases if available, fall back to built-in set
    var S = getS();
    var liveFactions = FACTION_IDS.slice();
    if (S && S.factionBases && typeof S.factionBases === 'object') {
      var bkeys = Object.keys(S.factionBases);
      if (bkeys.length) liveFactions = bkeys;
    }

    // Pick a faction to act
    var factionId = pickRandom(liveFactions);
    if (!factionId) return;

    // Determine faction posture: heat drives aggression
    var fe = ensureFactionWorldEntry(ws, factionId);
    var heat = (fe.heatByRegion && fe.heatByRegion.province) || 0;

    // Higher heat → more aggressive operations
    var pool;
    if (heat >= 5) {
      pool = FACTION_OPERATIONS.filter(function (o) { return o.op === 'retaliate' || o.op === 'destabilize'; });
    } else if (heat >= 3) {
      pool = FACTION_OPERATIONS.filter(function (o) { return o.op === 'expand' || o.op === 'retaliate' || o.op === 'secure'; });
    } else {
      pool = FACTION_OPERATIONS.filter(function (o) { return o.op === 'secure' || o.op === 'negotiate' || o.op === 'expand'; });
    }
    if (!pool.length) pool = FACTION_OPERATIONS;

    var operation = pickRandom(pool);
    if (!operation) return;

    // Update faction posture
    fe.posture = operation.posture;

    // Pick a region hex for the operation (random from province mapData if available)
    var locationKey = '';
    var regionLabel = 'province';
    if (typeof window !== 'undefined' && Array.isArray(window.mapData) && window.mapData.length) {
      var hex = pickRandom(window.mapData);
      if (hex) {
        locationKey = hex.col + ',' + hex.row;
        regionLabel  = 'province';
      }
    }

    // Record faction operation log
    fe.activeOperations = fe.activeOperations || [];
    fe.activeOperations.unshift({ at: Date.now(), op: operation.op, locationKey: locationKey });
    if (fe.activeOperations.length > 5) fe.activeOperations.length = 5;

    // Emit the consequence
    applyWorldConsequence({
      system:      'faction-turn',
      title:       toTitle(factionId) + ' faction ' + operation.label,
      detail:      'Autonomous faction operation: ' + operation.op + (locationKey ? ' at ' + locationKey : '') + '.',
      region:      regionLabel,
      locationKey: locationKey,
      severity:    operation.severity,
      factionId:   factionId,
      deltas:      operation.deltas,
      tags:        ['faction-operation', operation.op]
    });

    // Optionally show a subtle notification only for high-severity turns
    if (operation.severity === 'high' && typeof window.showNotif === 'function') {
      try {
        window.showNotif('[World] ' + toTitle(factionId) + ' ' + operation.label + ' in ' + regionLabel + '.', 'warn');
      } catch (_e) {}
    }
  }

  function toTitle(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ---------------------------------------------------------------------------
  // Consequence feed accessor
  // ---------------------------------------------------------------------------
  function getWorldConsequenceFeed() {
    var S = getS();
    if (!S || !S.worldState) return [];
    return Array.isArray(S.worldState.consequenceFeed) ? S.worldState.consequenceFeed : [];
  }

  // ---------------------------------------------------------------------------
  // Bootstrap: ensure worldState when S is ready
  // ---------------------------------------------------------------------------
  function tryBootstrap() {
    var S = getS();
    if (S) { ensureWorldState(); return; }
    // S may not be initialised yet; retry briefly
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (getS()) { ensureWorldState(); clearInterval(timer); return; }
      if (attempts > 20) clearInterval(timer);
    }, 250);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryBootstrap);
    } else {
      tryBootstrap();
    }
  }

  // ---------------------------------------------------------------------------
  // Expose globals
  // ---------------------------------------------------------------------------
  window.ensureWorldState          = ensureWorldState;
  window.applyWorldConsequence     = applyWorldConsequence;
  window.recordWorldConsequence    = applyWorldConsequence; // satisfy existing callers
  window.getWorldStateHexOverlay   = getWorldStateHexOverlay;
  window.getConsequenceMissionBias = getConsequenceMissionBias;
  window.triggerFactionTurn        = triggerFactionTurn;
  window.getWorldConsequenceFeed   = getWorldConsequenceFeed;

})();
