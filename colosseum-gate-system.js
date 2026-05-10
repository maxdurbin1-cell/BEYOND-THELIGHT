(function () {
  function ensureState() {
    if (typeof window === 'undefined' || typeof S === 'undefined' || !S) return null;
    if (!S.endgameArena || typeof S.endgameArena !== 'object') {
      S.endgameArena = {
        dayStamp: '',
        portalsByScope: {},
        gatesClosed: 0,
        lastBoss: ''
      };
    }
    if (!S.endgameArena.portalsByScope || typeof S.endgameArena.portalsByScope !== 'object') {
      S.endgameArena.portalsByScope = {};
    }
    S.endgameArena.gatesClosed = Math.max(0, Number(S.endgameArena.gatesClosed || 0));
    return S.endgameArena;
  }

  function getDayStamp() {
    var d = new Date();
    return String(d.getUTCFullYear()) + '-' + String(d.getUTCMonth() + 1) + '-' + String(d.getUTCDate());
  }

  function hashString(value) {
    var str = String(value || '');
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function pickPortalGateType(scope, key, idx) {
    var roll = hashString(String(scope || '') + '|' + String(key || '') + '|' + String(idx || 0)) % 2;
    return roll === 0 ? 'hellscape' : 'celestial';
  }

  function buildPortalSet(scope, allKeys) {
    var state = ensureState();
    if (!state) return [];
    var keys = Array.isArray(allKeys) ? allKeys.map(function (k) { return String(k || ''); }).filter(Boolean) : [];
    if (!keys.length) return [];

    var dayStamp = getDayStamp();
    var scopeKey = String(scope || 'province');
    var cache = state.portalsByScope[scopeKey];
    var signature = keys.slice().sort().join('|');
    if (cache && cache.dayStamp === dayStamp && cache.signature === signature && Array.isArray(cache.portals)) {
      return cache.portals;
    }

    var count = keys.length >= 40 ? 2 : 1;
    var used = {};
    var portals = [];
    for (var i = 0; i < count; i++) {
      var offset = hashString(dayStamp + '|' + scopeKey + '|' + signature + '|' + i);
      var key = keys[offset % keys.length];
      var guard = 0;
      while (used[key] && guard < keys.length) {
        offset += 7;
        key = keys[offset % keys.length];
        guard += 1;
      }
      if (used[key]) continue;
      used[key] = true;
      portals.push({
        key: key,
        gateType: pickPortalGateType(scopeKey, key, i),
        closed: false,
        puzzleAttempts: 0
      });
    }

    state.dayStamp = dayStamp;
    state.portalsByScope[scopeKey] = {
      dayStamp: dayStamp,
      signature: signature,
      portals: portals
    };
    return portals;
  }

  function getPortalMarker(scope, key, allKeys) {
    var portals = buildPortalSet(scope, allKeys);
    var markerKey = String(key || '');
    for (var i = 0; i < portals.length; i++) {
      if (String(portals[i].key) === markerKey && !portals[i].closed) return portals[i];
    }
    return null;
  }

  function enemySpecForGateType(type) {
    if (String(type || '') === 'celestial') {
      return {
        label: 'Celestial Gate',
        summary: '1 Seraphim (d12, 24 HP)',
        enemies: [{ name: 'Seraphim Gatekeeper', dread: 12, hp: 24 }]
      };
    }
    var cnt = 2 + Math.floor(Math.random() * 3);
    var enemies = [];
    var names = ['Abyss Imp', 'Hellchain Fiend', 'Rift Demon', 'Cinder Maw'];
    for (var i = 0; i < cnt; i++) {
      enemies.push({
        name: names[i % names.length] + ' #' + String(i + 1),
        dread: 4,
        hp: 8
      });
    }
    return {
      label: 'Hellscape Gate',
      summary: String(cnt) + ' Demons (d4, 8 HP each)',
      enemies: enemies
    };
  }

  function seedGateEnemies(gateType, flow) {
    var spec = enemySpecForGateType(gateType);
    if (!Array.isArray(S.enemies)) S.enemies = [];
    S.enemies = S.enemies.filter(function (enemy) { return enemy && enemy.ally; });
    spec.enemies.forEach(function (enemy, idx) {
      S.enemies.push({
        id: 'gate-' + String(gateType) + '-' + String(idx + 1) + '-' + String(Date.now()),
        name: enemy.name,
        dread: enemy.dread,
        stress: 0,
        maxStress: enemy.hp,
        health: enemy.hp,
        arena: true,
        arenaMode: 'gate',
        specialAction: {
          name: String(gateType === 'celestial' ? 'Radiant Burst' : 'Hellfire Lunge'),
          text: String(gateType === 'celestial' ? 'The seraphim flashes forward with a radiant cut.' : 'A demon lunges with chain-fire and ash.')
        }
      });
    });
    S.combat = S.combat || {};
    S.combat.enemyDread = spec.enemies.length ? Number(spec.enemies[0].dread || 4) : 4;
    if (flow) {
      flow.mode = 'gate';
      flow.queue = [Number(spec.enemies[0] && spec.enemies[0].dread || 4)];
      flow.index = 0;
      flow.enemy = spec.enemies[0] ? {
        id: 'gate-primary',
        name: spec.enemies[0].name,
        dread: spec.enemies[0].dread,
        maxStress: spec.enemies[0].hp,
        stress: 0,
        specialAction: {
          name: String(gateType === 'celestial' ? 'Radiant Burst' : 'Hellfire Lunge'),
          text: String(gateType === 'celestial' ? 'The seraphim flashes forward with a radiant cut.' : 'A demon lunges with chain-fire and ash.')
        }
      } : null;
      flow.gatePortal = flow.gatePortal || {};
      flow.gatePortal.type = String(gateType || 'hellscape');
      flow.gatePortal.spec = spec;
      flow.gatePortal.puzzleReady = false;
      flow.gatePortal.puzzleAttempts = Math.max(0, Number(flow.gatePortal.puzzleAttempts || 0));
    }
    if (typeof updateCombatUI === 'function') updateCombatUI();
    if (typeof renderEnemies === 'function') renderEnemies();
    return spec;
  }

  function livingHostiles() {
    if (!Array.isArray(S.enemies)) return 0;
    return S.enemies.filter(function (enemy) {
      return enemy && !enemy.ally && Number(enemy.stress || 0) < Number(enemy.maxStress || 0);
    }).length;
  }

  function openSeaColosseumArena(mode, hexKey) {
    if (typeof window.seedArenaCombat !== 'function' || typeof window.openArenaCombatPopup !== 'function') return false;
    var arenaMode = String(mode || 'challenge');
    var title = arenaMode === 'endless' ? 'Sea Colosseum - Endless Mode' : 'Sea Colosseum - Challenge Mode';
    window.seedArenaCombat(arenaMode, { hexKey: String(hexKey || ''), title: title });
    window.openArenaCombatPopup({ mode: arenaMode, hexKey: String(hexKey || ''), title: title });
    if (typeof showNotif === 'function') {
      showNotif('Arena opened: ' + (arenaMode === 'endless' ? 'Endless Mode' : 'Challenge Mode') + '.', 'good');
    }
    return true;
  }

  function openEndgameGatePortal(scope, key, allKeys) {
    if (typeof window.seedArenaCombat !== 'function' || typeof window.openArenaCombatPopup !== 'function') return false;
    var portal = getPortalMarker(scope, key, allKeys);
    if (!portal) {
      if (typeof showNotif === 'function') showNotif('No active endgame gate at this hex today.', 'info');
      return false;
    }

    var flow = window.seedArenaCombat('challenge', {
      hexKey: String(key || ''),
      title: String(portal.gateType === 'celestial' ? 'Celestial Gate Breach' : 'Hellscape Gate Breach')
    });
    flow.gatePortal = flow.gatePortal || {};
    flow.gatePortal.scope = String(scope || 'province');
    flow.gatePortal.key = String(key || '');
    flow.gatePortal.type = String(portal.gateType || 'hellscape');
    flow.gatePortal.puzzleAttempts = Number(portal.puzzleAttempts || 0);
    flow.gatePortal.closed = false;
    seedGateEnemies(portal.gateType, flow);

    window.openArenaCombatPopup({
      mode: 'gate',
      hexKey: String(key || ''),
      title: String(portal.gateType === 'celestial' ? 'Celestial Gate Breach' : 'Hellscape Gate Breach')
    });
    if (typeof showNotif === 'function') showNotif('Gate portal opened. Defeat hostiles, then solve the seal puzzle.', 'warn');
    return true;
  }

  function resolveEndgameGatePuzzle() {
    var flow = S && S.combat && S.combat.arenaFlow ? S.combat.arenaFlow : null;
    if (!flow || !flow.gatePortal) return false;
    if (livingHostiles() > 0) {
      if (typeof showNotif === 'function') showNotif('Defeat all hostiles before attempting the gate seal puzzle.', 'warn');
      return false;
    }

    var state = ensureState();
    var portal = getPortalMarker(flow.gatePortal.scope, flow.gatePortal.key, []);
    var actionDie = typeof getEffectiveDie === 'function' ? Math.max(4, Number(getEffectiveDie('mind') || 4)) : 4;
    var ad = typeof explodingRoll === 'function' ? explodingRoll(actionDie) : { total: 1 + Math.floor(Math.random() * actionDie) };
    var dd = typeof explodingRoll === 'function' ? explodingRoll(8) : { total: 1 + Math.floor(Math.random() * 8) };
    var success = Number(ad.total || 0) >= Number(dd.total || 0);

    if (success) {
      state.gatesClosed = Math.max(0, Number(state.gatesClosed || 0) + 1);
      var scopeCache = state.portalsByScope[String(flow.gatePortal.scope || 'province')];
      if (scopeCache && Array.isArray(scopeCache.portals)) {
        for (var i = 0; i < scopeCache.portals.length; i++) {
          if (String(scopeCache.portals[i].key) === String(flow.gatePortal.key || '')) {
            scopeCache.portals[i].closed = true;
          }
        }
      }
      var credits = 80;
      var renown = 1;
      S.credits = Math.max(0, Number(S.credits || 0) + credits);
      S.renown = Math.max(0, Number(S.renown || 0) + renown);
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
      if (typeof updateRenown === 'function') updateRenown();
      if (typeof showNotif === 'function') showNotif('Portal sealed. +' + credits + ' Credits, +' + renown + ' Renown. Gates sealed: ' + state.gatesClosed + '/10.', 'good');
      if (state.gatesClosed >= 10) {
        openPinnacleMegadungeonPopup();
      } else if (typeof window.renderArenaCombatPopup === 'function') {
        window.renderArenaCombatPopup();
      }
      return true;
    }

    flow.gatePortal.puzzleAttempts = Math.max(0, Number(flow.gatePortal.puzzleAttempts || 0) + 1);
    seedGateEnemies(flow.gatePortal.type, flow);
    if (typeof showNotif === 'function') showNotif('Puzzle failed: two more enemies breach the gate.', 'warn');
    if (typeof window.renderArenaCombatPopup === 'function') window.renderArenaCombatPopup();
    return false;
  }

  function openPinnacleMegadungeonPopup() {
    if (typeof window.seedArenaCombat !== 'function' || typeof window.openArenaCombatPopup !== 'function') return false;
    var boss = Math.random() < 0.5 ? 'Azrael' : 'Mephisto';
    var state = ensureState();
    if (state) state.lastBoss = boss;
    window.seedArenaCombat('pinnacle', { hexKey: 'megadungeon', bossName: boss, title: 'Pinnacle Megadungeon - ' + boss });
    window.openArenaCombatPopup({ mode: 'pinnacle', hexKey: 'megadungeon', title: 'Pinnacle Megadungeon - ' + boss });
    if (typeof showNotif === 'function') showNotif('Pinnacle Megadungeon unlocked: final encounter with ' + boss + '.', 'warn');
    return true;
  }

  window.getEndgamePortalMarker = function (scope, key, allKeys) {
    return getPortalMarker(scope, key, allKeys);
  };
  window.openSeaColosseumArena = openSeaColosseumArena;
  window.openEndgameGatePortal = openEndgameGatePortal;
  window.resolveEndgameGatePuzzle = resolveEndgameGatePuzzle;
  window.openPinnacleMegadungeonPopup = openPinnacleMegadungeonPopup;
})();
