// solo-gm-system.js
(function () {
  var GENRE_ARCS = [
    {
      id: 'cosmic-noir-cooking-show',
      title: 'Cosmic Noir Cooking Show',
      beats: [
        'A trench-coat squid host says your alibi tastes under-seasoned.',
        'The judges are three ghosts and a tax auditor from tomorrow.',
        'A tiny dragon insists your recipe is evidence in a cold case.'
      ],
      choices: [
        { id: 'plate', label: 'Plate your alibi with dramatic garnish', stat: 'lead', risky: false },
        { id: 'interrogate', label: 'Interrogate the dragon sous-chef', stat: 'mind', risky: true },
        { id: 'flambe', label: 'Flambe the evidence cart', stat: 'control', risky: true }
      ]
    },
    {
      id: 'mecha-romcom-heist',
      title: 'Mecha Rom-Com Heist',
      beats: [
        'Your ex arrives piloting a tiny mech shaped like a wedding cake.',
        'The vault asks for emotional honesty before it opens.',
        'A brass quartet follows your crew and keeps playing romantic battle music.'
      ],
      choices: [
        { id: 'charm', label: 'Flirt at tactical velocity', stat: 'spirit', risky: false },
        { id: 'breach', label: 'Breach the vault with improvised poetry', stat: 'adventure', risky: true },
        { id: 'duel', label: 'Challenge the wedding-cake mech', stat: 'strike', risky: true }
      ]
    },
    {
      id: 'haunted-workplace-sitcom',
      title: 'Haunted Workplace Sitcom',
      beats: [
        'A spectral manager schedules your crisis between coffee break and apocalypse.',
        'Every stapler in the office is mildly cursed and very judgmental.',
        'Someone keeps saying \"synergy\" and each time a chandelier screams.'
      ],
      choices: [
        { id: 'memo', label: 'Write a memo that banishes at least one ghost', stat: 'mind', risky: false },
        { id: 'hr', label: 'File an HR complaint against the chandelier', stat: 'lead', risky: true },
        { id: 'wrestle', label: 'Wrestle the cursed copier', stat: 'body', risky: true }
      ]
    }
  ];

  var OBJECTIVE_POOL = [
    {
      id: 'select-wilderness',
      title: 'Go to Province and stand on a Wilderness hex',
      hint: 'Use Map tab. Select any Wilderness tile to scout absurd clues.',
      tab: 'map'
    },
    {
      id: 'trade-encounter',
      title: 'Roll one Trade Route encounter',
      hint: 'Select a Trade Route hex in Province and roll Trade Encounter.',
      tab: 'map'
    },
    {
      id: 'open-combat-tab',
      title: 'Visit Combat tab and stare menacingly at initiative',
      hint: 'No fighting required. Presence alone changes the timeline.',
      tab: 'combat'
    },
    {
      id: 'open-library-hex',
      title: 'Find the Infinite Library hex and enter it',
      hint: 'Use Map tab. Look for the library hex icon and join its area.',
      tab: 'map'
    },
    {
      id: 'visit-faction-tab',
      title: 'Visit Factions and collect one dramatic rumor',
      hint: 'Open Faction tab to let politics become your side quest.',
      tab: 'factions'
    },
    {
      id: 'visit-galaxy-tab',
      title: 'Visit Galaxy and verify the stars still exist',
      hint: 'Open Galaxy tab. This counts even if space is rude today.',
      tab: 'galaxy'
    }
  ];

  function rollDie(max) {
    if (typeof roll === 'function') return roll(max);
    return 1 + Math.floor(Math.random() * max);
  }

  function statDie(stat) {
    if (typeof getEffectiveDie === 'function') return Math.max(4, Number(getEffectiveDie(stat) || 4));
    if (typeof getStat === 'function') return Math.max(4, Number(getStat(stat) || 4));
    return 6;
  }

  function pick(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)] || arr[0];
  }

  function isTabActive(tabId) {
    var el = document.getElementById('tab-' + String(tabId || ''));
    return !!(el && el.classList && el.classList.contains('active'));
  }

  function ensureSoloGMState() {
    if (typeof S === 'undefined' || !S) return null;
    if (!S.soloGM || typeof S.soloGM !== 'object') {
      S.soloGM = {
        active: false,
        arcId: GENRE_ARCS[0].id,
        beatIndex: 0,
        interactions: 0,
        sinceRoll: 0,
        weirdness: 1,
        rumor: 0,
        heat: 0,
        currentObjectiveId: '',
        objectiveCompleted: false,
        lastLine: '',
        lastResolution: '',
        tabVisits: {},
        websiteCounters: {
          tradeRolls: 0,
          libraryDelves: 0,
          taskGenerations: 0
        }
      };
    }
    var st = S.soloGM;
    if (!st.tabVisits || typeof st.tabVisits !== 'object') st.tabVisits = {};
    if (!st.websiteCounters || typeof st.websiteCounters !== 'object') {
      st.websiteCounters = { tradeRolls: 0, libraryDelves: 0, taskGenerations: 0 };
    }
    if (typeof st.websiteCounters.tradeRolls !== 'number') st.websiteCounters.tradeRolls = 0;
    if (typeof st.websiteCounters.libraryDelves !== 'number') st.websiteCounters.libraryDelves = 0;
    if (typeof st.websiteCounters.taskGenerations !== 'number') st.websiteCounters.taskGenerations = 0;
    if (!st.currentObjectiveId) {
      var obj = pick(OBJECTIVE_POOL);
      st.currentObjectiveId = obj ? obj.id : '';
      st.objectiveCompleted = false;
    }
    return st;
  }

  function getArcById(id) {
    var key = String(id || '');
    for (var i = 0; i < GENRE_ARCS.length; i++) {
      if (String(GENRE_ARCS[i].id) === key) return GENRE_ARCS[i];
    }
    return GENRE_ARCS[0];
  }

  function getObjectiveById(id) {
    var key = String(id || '');
    for (var i = 0; i < OBJECTIVE_POOL.length; i++) {
      if (String(OBJECTIVE_POOL[i].id) === key) return OBJECTIVE_POOL[i];
    }
    return OBJECTIVE_POOL[0];
  }

  function selectProvinceHexByType(hexType) {
    if (!Array.isArray(window.mapData) || !window.mapData.length) return false;
    var target = window.mapData.find(function (h) {
      return h && String(h.type || '').toLowerCase() === String(hexType || '').toLowerCase();
    });
    if (!target) return false;
    if (typeof window.setProvinceSelectedKey === 'function') {
      return !!window.setProvinceSelectedKey(target.col + ',' + target.row);
    }
    window.selectedHex = target;
    if (typeof window.renderHexMap === 'function') window.renderHexMap();
    if (typeof window.renderHexInfo === 'function') window.renderHexInfo(target);
    return true;
  }

  function objectiveDone(st, objectiveId) {
    var oid = String(objectiveId || '');
    if (oid === 'select-wilderness') {
      return !!(window.selectedHex && String(window.selectedHex.type || '').toLowerCase() === 'wilderness');
    }
    if (oid === 'trade-encounter') {
      return Number(st.websiteCounters.tradeRolls || 0) >= 1;
    }
    if (oid === 'open-combat-tab') {
      return !!(st.tabVisits.combat || isTabActive('combat'));
    }
    if (oid === 'open-library-hex') {
      return Number(st.websiteCounters.libraryDelves || 0) >= 1;
    }
    if (oid === 'visit-faction-tab') {
      return !!(st.tabVisits.factions || st.tabVisits.faction || isTabActive('factions'));
    }
    if (oid === 'visit-galaxy-tab') {
      return !!(st.tabVisits.galaxy || isTabActive('galaxy'));
    }
    return false;
  }

  function rotateObjective(st) {
    var available = OBJECTIVE_POOL.filter(function (o) {
      return String(o.id) !== String(st.currentObjectiveId || '');
    });
    var next = pick(available.length ? available : OBJECTIVE_POOL);
    st.currentObjectiveId = next ? next.id : '';
    st.objectiveCompleted = false;
  }

  function rotateArc(st) {
    var options = GENRE_ARCS.filter(function (arc) {
      return String(arc.id) !== String(st.arcId || '');
    });
    var next = pick(options.length ? options : GENRE_ARCS);
    st.arcId = next ? next.id : GENRE_ARCS[0].id;
    st.beatIndex = 0;
  }

  function applyFailureConsequence(statKey) {
    if (typeof S === 'undefined' || !S) return;
    var prevHealth = Number(S.health || 0);
    var prevMental = Number(S.mentalStress || 0);
    if (String(statKey || '') === 'mind' || String(statKey || '') === 'spirit') {
      S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + 2);
    } else {
      S.health = Math.max(0, Number(S.health || 0) - 1);
    }
    if (typeof addTMWOnFail === 'function') {
      addTMWOnFail('solo-gm-failure', {
        onConvert: function () {
          S.health = Math.max(0, prevHealth);
          S.mentalStress = Math.max(0, prevMental);
          if (typeof updateHealthUI === 'function') updateHealthUI();
          if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
          if (typeof updateStressUI === 'function') updateStressUI();
          var st = ensureSoloGMState();
          if (st) {
            st.lastResolution = 'Teamwork converted the failed check into a success. Failure penalties removed.';
            openSoloGMConsole();
          }
          return true;
        }
      });
    }
  }

  function updateTabVisitCounters(st) {
    if (!st || !st.tabVisits) return;
    ['map', 'combat', 'galaxy', 'factions', 'storyline', 'missions'].forEach(function (tab) {
      if (isTabActive(tab)) st.tabVisits[tab] = true;
    });
  }

  function maybeRewardObjective(st) {
    if (!st.objectiveCompleted) return;
    S.credits = Math.max(0, Number(S.credits || 0) + 25 + (st.weirdness * 5));
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    if (typeof changeCounter === 'function') {
      try { changeCounter('renown', 1); } catch (_err) {}
    } else {
      S.renown = Math.max(0, Number(S.renown || 0) + 1);
      if (typeof updateRenown === 'function') updateRenown();
    }
    st.lastResolution = 'Objective complete. You gain credits and renown, and the timeline gets weirder.';
    rotateObjective(st);
    if (st.interactions > 0 && st.interactions % 4 === 0) rotateArc(st);
  }

  function openSoloGMConsole() {
    var st = ensureSoloGMState();
    if (!st || typeof openModal !== 'function') return false;
    st.active = true;
    updateTabVisitCounters(st);

    var arc = getArcById(st.arcId);
    var beat = arc.beats[Math.max(0, Math.min(arc.beats.length - 1, Number(st.beatIndex || 0)))] || arc.beats[0];
    var objective = getObjectiveById(st.currentObjectiveId);
    st.objectiveCompleted = objectiveDone(st, objective.id);

    var choiceHtml = arc.choices.map(function (c) {
      return '<button class="btn btn-sm ' + (c.risky ? 'btn-warn' : 'btn-primary') + '" onclick="soloGMChoose(\'' + c.id + '\')">' + c.label + '</button>';
    }).join('');

    var objectiveStatus = st.objectiveCompleted
      ? '<span style="color:var(--green2);">Complete</span>'
      : '<span style="color:var(--gold2);">In Progress</span>';

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.58;">'
      + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Solo-GM: Weird Mode · ' + arc.title + '</strong></div>'
      + '<div style="margin-bottom:.14rem;">' + beat + '</div>'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Loop: Narrate -> Choose -> Roll every 2-3 beats -> Resolve -> Website objective -> World update</div>'
      + '<div style="padding:.32rem .42rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);margin-bottom:.12rem;">'
      + '<div style="font-size:.72rem;color:var(--teal);"><strong>Current Website Objective:</strong> ' + objective.title + ' (' + objectiveStatus + ')</div>'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-top:.08rem;">' + objective.hint + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.14rem;">'
      + '<button class="btn btn-xs btn-teal" onclick="soloGMNudgeObjective()">Point Me There</button>'
      + '<button class="btn btn-xs" onclick="soloGMCheckObjective()">Check Objective</button>'
      + '</div>'
      + '<div style="margin-bottom:.14rem;display:flex;gap:.24rem;flex-wrap:wrap;">' + choiceHtml + '</div>'
      + '<div style="margin-bottom:.12rem;">'
      + '<input id="soloGMInput" class="input" placeholder="Say your ridiculous in-character line..." style="width:100%;" />'
      + '</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm" onclick="soloGMSpeak()">Speak</button>'
      + '<button class="btn btn-sm btn-primary" onclick="soloGMAdvanceArc()">Advance Arc</button>'
      + '</div>'
      + (st.lastResolution ? '<div style="margin-top:.14rem;font-size:.68rem;color:var(--teal);">Last: ' + st.lastResolution + '</div>' : '')
      + '<div style="margin-top:.08rem;font-size:.66rem;color:var(--muted2);">Weirdness: ' + Number(st.weirdness || 0) + ' · Heat: ' + Number(st.heat || 0) + ' · Rumor: ' + Number(st.rumor || 0) + '</div>'
      + '</div>';

    openModal('Solo-GM Console', html);
    return true;
  }

  function chooseById(arc, id) {
    var opts = arc && arc.choices ? arc.choices : [];
    for (var i = 0; i < opts.length; i++) {
      if (String(opts[i].id) === String(id)) return opts[i];
    }
    return opts[0] || null;
  }

  function soloGMChoose(choiceId) {
    var st = ensureSoloGMState();
    if (!st) return false;

    var arc = getArcById(st.arcId);
    var choice = chooseById(arc, choiceId);
    if (!choice) return false;

    var risky = !!choice.risky;
    if (!risky && st.sinceRoll >= 2) risky = true;

    var success = true;
    var detail = 'Narrative beat advanced.';
    if (risky) {
      var aDie = statDie(choice.stat || 'adventure');
      var dd = 6 + Math.min(8, Math.floor(Number(st.weirdness || 1) / 2));
      var a = rollDie(aDie);
      var d = rollDie(dd);
      success = a >= d;
      detail = String(choice.stat || 'adventure').toUpperCase() + ' d' + aDie + '=' + a + ' vs DD' + dd + '=' + d;
      st.sinceRoll = 0;
      if (!success) applyFailureConsequence(choice.stat);
    } else {
      st.sinceRoll += 1;
    }

    st.interactions += 1;
    st.beatIndex = (Number(st.beatIndex || 0) + 1) % arc.beats.length;

    if (success) {
      st.rumor = Math.max(0, Number(st.rumor || 0) + 1);
      st.weirdness = Math.max(1, Number(st.weirdness || 1) + 1);
      st.lastResolution = 'Success: ' + detail;
    } else {
      st.heat = Math.max(0, Number(st.heat || 0) + 1);
      st.lastResolution = 'Failure: ' + detail + '. Consequence applied.';
    }

    if (st.interactions > 0 && st.interactions % 5 === 0) {
      st.lastResolution += ' Scene tone mutates into a new genre arc.';
      rotateArc(st);
    }

    return openSoloGMConsole();
  }

  function soloGMSpeak() {
    var st = ensureSoloGMState();
    if (!st) return false;
    var input = document.getElementById('soloGMInput');
    var line = input && typeof input.value === 'string' ? input.value.trim() : '';
    if (!line) {
      st.lastResolution = 'No line delivered. The audience boos politely.';
      return openSoloGMConsole();
    }
    st.lastLine = line;
    st.rumor = Math.max(0, Number(st.rumor || 0) + 1);
    st.lastResolution = 'You declare: "' + line + '". The world immediately makes this everyone\'s problem.';
    return openSoloGMConsole();
  }

  function soloGMAdvanceArc() {
    var st = ensureSoloGMState();
    if (!st) return false;
    rotateArc(st);
    st.lastResolution = 'Arc advanced. Genre collision now at unsafe levels.';
    return openSoloGMConsole();
  }

  function soloGMCheckObjective() {
    var st = ensureSoloGMState();
    if (!st) return false;
    updateTabVisitCounters(st);
    st.objectiveCompleted = objectiveDone(st, st.currentObjectiveId);
    if (st.objectiveCompleted) {
      maybeRewardObjective(st);
    } else {
      st.lastResolution = 'Objective still in progress. Keep using the site as your play table.';
    }
    return openSoloGMConsole();
  }

  function soloGMNudgeObjective() {
    var st = ensureSoloGMState();
    if (!st) return false;
    var objective = getObjectiveById(st.currentObjectiveId);
    var oid = String(objective.id || '');

    if (oid === 'select-wilderness') {
      if (typeof switchTab === 'function') switchTab('map', null);
      if (!selectProvinceHexByType('wilderness')) {
        if (typeof window.generateMap === 'function') window.generateMap();
        selectProvinceHexByType('wilderness');
      }
      st.lastResolution = 'Province route highlighted. Select and explore a wilderness hex.';
      return openSoloGMConsole();
    }
    if (oid === 'trade-encounter') {
      if (typeof switchTab === 'function') switchTab('map', null);
      if (!selectProvinceHexByType('trade')) {
        if (typeof window.generateMap === 'function') window.generateMap();
        selectProvinceHexByType('trade');
      }
      st.lastResolution = 'Trade route selected. Roll one Trade Encounter from this hex.';
      return openSoloGMConsole();
    }
    if (oid === 'open-combat-tab') {
      if (typeof switchTab === 'function') switchTab('combat', null);
      st.lastResolution = 'Combat tab opened. Menacing posture registered.';
      return openSoloGMConsole();
    }
    if (oid === 'open-library-hex') {
      if (typeof switchTab === 'function') switchTab('map', null);
      if (!selectProvinceHexByType('library')) {
        if (typeof window.generateMap === 'function') window.generateMap();
        selectProvinceHexByType('library');
      }
      st.lastResolution = 'Infinite Library hex selected. Join area to delve the stacks.';
      return openSoloGMConsole();
    }
    if (oid === 'visit-faction-tab') {
      if (typeof switchTab === 'function') switchTab('factions', null);
      st.lastResolution = 'Faction tab opened. Political nonsense acquired.';
      return openSoloGMConsole();
    }
    if (oid === 'visit-galaxy-tab') {
      if (typeof switchTab === 'function') switchTab('galaxy', null);
      st.lastResolution = 'Galaxy tab opened. Stars observed. Existential dread nominal.';
      return openSoloGMConsole();
    }

    st.lastResolution = 'Objective nudge unavailable. Proceed by instinct and chaos.';
    return openSoloGMConsole();
  }

  function patchSoloGMHooks() {
    if (typeof window === 'undefined' || window._soloGMHooksPatched) return;
    window._soloGMHooksPatched = true;

    if (typeof window.switchTab === 'function') {
      var baseSwitchTab = window.switchTab;
      window.switchTab = function () {
        var out = baseSwitchTab.apply(this, arguments);
        var st = ensureSoloGMState();
        if (st && st.tabVisits) {
          var tab = String(arguments[0] || '').toLowerCase();
          if (tab) st.tabVisits[tab] = true;
        }
        return out;
      };
    }

    if (typeof window.rollTradeRouteEncounter === 'function') {
      var baseTradeRoll = window.rollTradeRouteEncounter;
      window.rollTradeRouteEncounter = function () {
        var st = ensureSoloGMState();
        if (st && st.websiteCounters) st.websiteCounters.tradeRolls = Number(st.websiteCounters.tradeRolls || 0) + 1;
        return baseTradeRoll.apply(this, arguments);
      };
    }

    if (typeof window.openInfiniteLibrary === 'function') {
      var baseOpenLibrary = window.openInfiniteLibrary;
      window.openInfiniteLibrary = function () {
        var st = ensureSoloGMState();
        if (st && st.websiteCounters) st.websiteCounters.libraryDelves = Number(st.websiteCounters.libraryDelves || 0) + 1;
        return baseOpenLibrary.apply(this, arguments);
      };
    }

    if (typeof window.generateTask === 'function') {
      var baseGenerateTask = window.generateTask;
      window.generateTask = function () {
        var st = ensureSoloGMState();
        if (st && st.websiteCounters) st.websiteCounters.taskGenerations = Number(st.websiteCounters.taskGenerations || 0) + 1;
        return baseGenerateTask.apply(this, arguments);
      };
    }

    if (typeof window.generateTaskForHex === 'function') {
      var baseGenerateTaskForHex = window.generateTaskForHex;
      window.generateTaskForHex = function () {
        var st = ensureSoloGMState();
        if (st && st.websiteCounters) st.websiteCounters.taskGenerations = Number(st.websiteCounters.taskGenerations || 0) + 1;
        return baseGenerateTaskForHex.apply(this, arguments);
      };
    }
  }

  window.openSoloGMConsole = openSoloGMConsole;
  window.soloGMChoose = soloGMChoose;
  window.soloGMSpeak = soloGMSpeak;
  window.soloGMAdvanceArc = soloGMAdvanceArc;
  window.soloGMAdvanceScene = soloGMAdvanceArc;
  window.soloGMCheckObjective = soloGMCheckObjective;
  window.soloGMNudgeObjective = soloGMNudgeObjective;

  patchSoloGMHooks();
})();
