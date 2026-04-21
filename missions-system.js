// missions-system.js — Full Missions System (rewrite)
// 3-step modal process · 6 difficulty levels · SHOP_DATA loot · Province map tokens
(function () {

  // ── DIFFICULTY CONFIG ─────────────────────────────────────────────────────────
  var DIFFICULTIES = {
    easy:        { name: 'Easy',        dread: 4,  lootCat: 'items',      credits: 50  },
    medium:      { name: 'Medium',      dread: 6,  lootCat: 'essentials', credits: 100 },
    hard:        { name: 'Hard',        dread: 8,  lootCat: 'scrolls',    credits: 150 },
    challenging: { name: 'Challenging', dread: 10, lootCat: 'toolkits',   credits: 250 },
    very_hard:   { name: 'Very Hard',   dread: 12, lootCat: 'melee_exp',  credits: 400 },
    impossible:  { name: 'Impossible',  dread: 20, lootCat: 'ranged_exp', credits: 700 }
  };

  var DIFF_KEYS = Object.keys(DIFFICULTIES);

  // ── FLAVOR DATA ───────────────────────────────────────────────────────────────
  var MISSION_VERBS   = ['Hunt', 'Guard', 'Rescue', 'Deliver', 'Investigate', 'Eliminate', 'Retrieve', 'Escort', 'Sabotage', 'Recover'];
  var MISSION_TARGETS = ['Bandits', 'Beasts', 'Refugees', 'Cargo', 'Mutineers', 'Threats', 'Artifacts', 'a VIP', 'Deserters', 'a Rival'];
  var MISSION_LOCS    = ['Forest Outpost', 'Mountain Pass', 'Ancient Ruins', 'Riverside Town', 'Hidden Camp', 'Abandoned Temple', 'Deep Cave', 'Border Shrine', 'Trade Road', 'Iron Mine'];

  var GUARD_NAMES = [
    'Warden Skell', 'Captain Mira', 'Enforcer Bonn', 'Sentinel Garr',
    'Guard Voss', 'Warden Thane', 'Blade-for-hire Coll', 'Sentinel Ruk',
    'Agent Sera', 'Watcher Drev', 'Constable Fenn', 'Marksman Ord'
  ];
  var TARGET_NAMES = [
    'Lord Kastian', 'The Grey Merchant', 'Warden Cress', 'Elder Vorn',
    'Captain Halved', 'The Iron Buyer', 'Countess Daela', 'Agent Zero',
    'Baron Fell', 'Treasurer Olin', 'The Pale Architect', 'Commander Dusk'
  ];
  var ROOM_TYPES = [
    'Empty corridor', 'Guard post (2 sentries)', 'Storage room', 'Locked vault',
    'Watch room', 'Hidden passage', 'Armory', 'Workshop',
    'Meeting hall', 'Supply depot', 'Infirmary', 'Command room',
    'Trophy room', 'Server alcove', 'Sewage passage', 'Old chapel'
  ];

  // ── STATE ─────────────────────────────────────────────────────────────────────
  function ensureState() {
    if (typeof S === 'undefined') return;
    S.activeMissions    = S.activeMissions    || [];
    S.completedMissions = S.completedMissions || [];
    S.missionTokens     = S.missionTokens     || {};
    S.availableJobs     = S.availableJobs     || [];
  }

  // ── LOOT FROM SHOP_DATA ───────────────────────────────────────────────────────
  function rollShopLoot(difficulty) {
    var diff  = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var cat   = diff.lootCat;
    var table = (typeof SHOP_DATA !== 'undefined' && SHOP_DATA[cat]) || [];
    if (!table.length) {
      // fallback simple loot
      var fallback = { easy:['Healing Salve'], medium:['Rope','Torch'], hard:['Scroll','Iron Tools'], challenging:['Enchanted Dagger'], very_hard:['Rare Weapon'], impossible:['Legendary Item'] };
      return (fallback[difficulty] || ['Unknown reward']);
    }
    var dread = diff.dread;
    var count = Math.max(1, Math.ceil(dread / 6));
    var loot = [];
    for (var i = 0; i < count; i++) {
      loot.push(pick(table).name);
    }
    return loot;
  }

  // ── MAP TOKENS ────────────────────────────────────────────────────────────────
  function assignMissionToken(mission) {
    ensureState();
    // Province map token
    if (typeof mapData !== 'undefined' && mapData.length) {
      var candidates = mapData.filter(function(h) { return h.type === 'wilderness'; });
      if (candidates.length) {
        var hex = pick(candidates);
        S.missionTokens[hex.col + ',' + hex.row] = { missionId: mission.id, title: mission.title };
        mission.mapHex = { col: hex.col, row: hex.row };
        if (typeof renderHexMap === 'function') renderHexMap();
      }
    }
  }

  function removeMissionToken(mission) {
    if (!mission || !mission.mapHex) return;
    var key = mission.mapHex.col + ',' + mission.mapHex.row;
    delete S.missionTokens[key];
    if (typeof renderHexMap === 'function') renderHexMap();
  }

  // ── GENERATE ROOM LAYOUT ──────────────────────────────────────────────────────
  function generateRooms(difficulty) {
    var counts = { easy:2, medium:3, hard:4, challenging:6, very_hard:9, impossible:12 };
    var n = counts[difficulty] || 2;
    var rooms = [];
    for (var i = 0; i < n; i++) {
      rooms.push((i === 0 ? 'Entrance: ' : 'Room ' + (i + 1) + ': ') + pick(ROOM_TYPES));
    }
    return rooms;
  }

  // ── GENERATE GUARDS ───────────────────────────────────────────────────────────
  function generateGuards(dread) {
    var n = Math.min(4, Math.max(2, Math.floor(dread / 4) + 1));
    var guards = [];
    var usedNames = [];
    for (var i = 0; i < n; i++) {
      var name = pick(GUARD_NAMES);
      while (usedNames.indexOf(name) >= 0) { name = pick(GUARD_NAMES); }
      usedNames.push(name);
      guards.push({ name: name, dread: dread, hp: dread * 2 });
    }
    return guards;
  }

  // ── GENERATE MISSION BOARD ────────────────────────────────────────────────────
  function generateMissions() {
    ensureState();
    S.availableJobs = [];
    var count = Math.max(1, Math.min(4, roll(4)));
    for (var i = 0; i < count; i++) {
      var diffKey = pick(DIFF_KEYS);
      var diff    = DIFFICULTIES[diffKey];
      S.availableJobs.push({
        id:         Date.now() + Math.random(),
        title:      pick(MISSION_VERBS) + ' ' + pick(MISSION_TARGETS),
        difficulty: diffKey,
        dread:      diff.dread,
        location:   pick(MISSION_LOCS),
        reward:     diff.credits,
        region:     'province'
      });
    }
    renderMissionBoard();
    showNotif('Posted ' + count + ' mission' + (count !== 1 ? 's' : '') + ' on the board!', 'good');
  }

  // ── ACCEPT JOB ────────────────────────────────────────────────────────────────
  function acceptJob(jobId) {
    ensureState();
    var jobs = S.availableJobs || [];
    var job  = null;
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].id === jobId) { job = jobs[i]; break; }
    }
    if (!job) return;

    var diff = DIFFICULTIES[job.difficulty] || DIFFICULTIES.easy;
    var mission = {
      id:         Date.now() + Math.random(),
      title:      job.title,
      difficulty: job.difficulty,
      dread:      diff.dread,
      location:   job.location,
      region:     job.region || 'province',
      reward:     job.reward,
      bonus:      0,
      steps: {
        1: { name: 'Gather Information', required: false, completed: false, skipped: false },
        2: { name: 'Go to Site',         required: true,  completed: false },
        3: { name: 'Confrontation',      required: true,  completed: false }
      },
      rooms:     generateRooms(job.difficulty),
      guards:    generateGuards(diff.dread),
      target:    pick(TARGET_NAMES),
      loot:      [],
      mapHex:    null,
      createdAt: new Date().toISOString()
    };

    S.activeMissions.push(mission);
    S.availableJobs = S.availableJobs.filter(function(j) { return j.id !== jobId; });
    assignMissionToken(mission);
    renderMissionBoard();
    renderMissionTracker();
    showNotif('Mission accepted: ' + mission.title, 'good');
  }

  // ── STEP 1: GATHER INFORMATION (optional) ────────────────────────────────────
  function startMissionStep1(missionId) {
    ensureState();
    var mission = getMission(missionId);
    if (!mission) return;

    var advDie    = (S.stats && S.stats.adventure) || 4;
    var dreadDie  = mission.dread;
    var advRoll   = explodingRoll(advDie);
    var dreadRoll = explodingRoll(dreadDie);
    var success   = advRoll.total >= dreadRoll.total;

    var html = '<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'
      + '<strong style="color:var(--gold2);">Gather Information</strong> — optional.<br>'
      + 'Success grants <strong style="color:var(--teal);">+5 bonus</strong> to Steps 2 and 3. You may also skip this step.'
      + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .6rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.3rem;">Adventure d' + advDie + ' vs Dread d' + dreadDie + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.3rem;">'
          + '<div style="text-align:center;">'
            + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--teal);text-transform:uppercase;margin-bottom:.1rem;">Your Roll</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">' + advRoll.total + '</div>'
            + (advRoll.exploded ? '<div style="font-size:.62rem;color:var(--gold2);">✦ Crit!</div>' : '')
          + '</div>'
          + '<div style="text-align:center;">'
            + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.1rem;">Dread Roll</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">' + dreadRoll.total + '</div>'
          + '</div>'
        + '</div>'
        + '<div style="text-align:center;font-family:\'Cinzel\',serif;font-size:.78rem;color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">'
          + (success ? '✓ Information gathered — +5 bonus secured' : '✗ Nothing useful found')
        + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm" onclick="skipMissionStep1(' + missionId + ');closeModal();">Skip This Step</button>'
        + '<button class="btn btn-sm btn-teal" onclick="completeMissionInfoStep(' + missionId + ',' + success + ');closeModal();">Confirm</button>'
      + '</div>';

    openModal('Step 1 — Gather Information', html);
  }

  function completeMissionInfoStep(missionId, success) {
    var mission = getMission(missionId);
    if (!mission) return;
    mission.steps[1].completed = true;
    mission.steps[1].skipped   = false;
    if (success) mission.bonus = 5;
    renderMissionTracker();
  }

  function skipMissionStep1(missionId) {
    var mission = getMission(missionId);
    if (!mission) return;
    mission.steps[1].completed = true;
    mission.steps[1].skipped   = true;
    renderMissionTracker();
  }

  // ── STEP 2: GO TO SITE ────────────────────────────────────────────────────────
  function startMissionStep2(missionId) {
    ensureState();
    var mission = getMission(missionId);
    if (!mission) return;
    if (!mission.steps[1].completed) { showNotif('Complete or skip Step 1 first.', 'warn'); return; }

    var advDie     = (S.stats && S.stats.adventure) || 4;
    var dreadDie   = mission.dread;
    var bonus      = mission.bonus || 0;
    var advRoll    = explodingRoll(advDie);
    var dreadRoll  = explodingRoll(dreadDie);
    var playerTot  = advRoll.total + bonus;
    var success    = playerTot >= dreadRoll.total;

    var roomList = (mission.rooms || []).map(function(r) {
      return '<div style="font-size:.74rem;color:var(--muted3);padding:.15rem 0;border-bottom:1px solid var(--border);">' + r + '</div>';
    }).join('');

    var html = '<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'
      + '<strong style="color:var(--gold2);">Go to Site</strong> — travel to ' + mission.location + '.'
      + (bonus ? ' <span style="color:var(--teal);">+' + bonus + ' bonus active.</span>' : '')
      + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .6rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.3rem;">Adventure d' + advDie + (bonus ? '+' + bonus : '') + ' vs Dread d' + dreadDie + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.3rem;">'
          + '<div style="text-align:center;">'
            + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--teal);text-transform:uppercase;margin-bottom:.1rem;">Your Roll</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">' + playerTot + (bonus ? '<span style="font-size:.75rem;color:var(--muted2);"> (' + advRoll.total + '+' + bonus + ')</span>' : '') + '</div>'
            + (advRoll.exploded ? '<div style="font-size:.62rem;color:var(--gold2);">✦ Crit!</div>' : '')
          + '</div>'
          + '<div style="text-align:center;">'
            + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.1rem;">Dread Roll</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">' + dreadRoll.total + '</div>'
          + '</div>'
        + '</div>'
        + '<div style="text-align:center;font-family:\'Cinzel\',serif;font-size:.78rem;color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">'
          + (success ? '✓ Arrived at the site undetected' : '✗ Setback — lost time and exposed')
        + '</div>'
      + '</div>'
      + '<div style="margin-bottom:.45rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.2rem;">Site Layout — ' + (mission.rooms || []).length + ' Room' + ((mission.rooms || []).length !== 1 ? 's' : '') + '</div>'
        + roomList
      + '</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;">'
        + '<button class="btn btn-sm btn-teal" onclick="completeMissionSiteStep(' + missionId + ');closeModal();">Proceed to Confrontation</button>'
      + '</div>';

    openModal('Step 2 — Go to Site', html);
  }

  function completeMissionSiteStep(missionId) {
    var mission = getMission(missionId);
    if (!mission) return;
    mission.steps[2].completed = true;
    renderMissionTracker();
  }

  // ── STEP 3: CONFRONTATION ─────────────────────────────────────────────────────
  function startMissionStep3(missionId) {
    ensureState();
    var mission = getMission(missionId);
    if (!mission) return;
    if (!mission.steps[2].completed) { showNotif('Complete Step 2 first.', 'warn'); return; }

    var advDie  = (S.stats && S.stats.adventure) || 4;
    var dreadDie = mission.dread;
    var bonus   = mission.bonus || 0;

    var guardList = (mission.guards || []).map(function(g) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.74rem;color:var(--muted3);padding:.15rem 0;border-bottom:1px solid var(--border);">'
        + '<span>' + g.name + '</span>'
        + '<span style="color:var(--red2);font-family:\'Rajdhani\',sans-serif;font-weight:700;">DD' + g.dread + ' | ' + g.hp + ' HP</span>'
        + '</div>';
    }).join('');

    var html = '<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'
      + '<strong style="color:var(--gold2);">Confrontation</strong> — face the target: <strong style="color:var(--text);">' + mission.target + '</strong>.'
      + (bonus ? ' <span style="color:var(--teal);">+' + bonus + ' bonus active.</span>' : '')
      + '</div>'
      + '<div style="margin-bottom:.45rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.2rem;">Security (' + (mission.guards || []).length + ' Guards)</div>'
        + guardList
        + '<div style="margin-top:.3rem;font-size:.76rem;"><strong style="color:var(--gold2);">Target:</strong> <span style="color:var(--text);">' + mission.target + '</span></div>'
      + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.45rem .55rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.8rem;color:var(--text2);margin-bottom:.25rem;">Roll Adventure d' + advDie + (bonus ? ' + ' + bonus : '') + ' vs Dread d' + dreadDie + ' — then click your outcome below:</div>'
        + '<div style="font-size:.7rem;color:var(--muted);">Use the Dice tab or your own dice. Add your bonus to the roll before comparing.</div>'
      + '</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-red" onclick="resolveMission(' + missionId + ',false);closeModal();">✗ Failure — Roll Failed</button>'
        + '<button class="btn btn-sm btn-primary" onclick="resolveMission(' + missionId + ',true);closeModal();">✓ Success — Roll Succeeded</button>'
      + '</div>';

    openModal('Step 3 — Confrontation', html);
  }

  // ── RESOLVE MISSION ───────────────────────────────────────────────────────────
  function resolveMission(missionId, success) {
    ensureState();
    var idx = -1;
    for (var i = 0; i < S.activeMissions.length; i++) {
      if (S.activeMissions[i].id === missionId) { idx = i; break; }
    }
    if (idx === -1) return;

    var mission = S.activeMissions[idx];
    mission.steps[3].completed = true;
    mission.completedAt = new Date().toISOString();
    mission.success     = success;

    if (success) {
      mission.loot = rollShopLoot(mission.difficulty);
      S.credits    = (S.credits || 0) + (mission.reward || 100);
      S.renown     = (S.renown  || 0) + 1;
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
      if (typeof updateRenown   === 'function') updateRenown();
      showNotif('Mission complete! +1 Renown · +' + mission.reward + '\u20B5 · Loot: ' + mission.loot.join(', '), 'good');
    } else {
      S.renown = Math.max(0, (S.renown || 0) - 1);
      if (typeof updateRenown === 'function') updateRenown();
      showNotif('Mission failed. \u22121 Renown.', 'warn');
    }

    removeMissionToken(mission);
    if (S.completedMissions.length >= 10) S.completedMissions.shift();
    S.completedMissions.push(mission);
    S.activeMissions.splice(idx, 1);
    renderMissionTracker();
    renderCompletedMissions();
  }

  function abandonMission(missionId) {
    resolveMission(missionId, false);
  }

  // ── LEGACY COMPAT: createMission ─────────────────────────────────────────────
  function createMission(npcName, title, difficulty, location, region) {
    ensureState();
    var diff = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var mission = {
      id:         Date.now() + Math.random(),
      title:      title,
      difficulty: difficulty,
      dread:      diff.dread,
      location:   location || 'Unknown',
      region:     region || 'province',
      reward:     diff.credits,
      bonus:      0,
      steps: {
        1: { name: 'Gather Information', required: false, completed: false, skipped: false },
        2: { name: 'Go to Site',         required: true,  completed: false },
        3: { name: 'Confrontation',      required: true,  completed: false }
      },
      rooms:     generateRooms(difficulty),
      guards:    generateGuards(diff.dread),
      target:    pick(TARGET_NAMES),
      loot:      [],
      mapHex:    null,
      createdAt: new Date().toISOString()
    };
    S.activeMissions.push(mission);
    assignMissionToken(mission);
    renderMissionTracker();
    return mission;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────
  function getMission(missionId) {
    var missions = (typeof S !== 'undefined' && S.activeMissions) || [];
    for (var i = 0; i < missions.length; i++) {
      if (missions[i].id === missionId) return missions[i];
    }
    return null;
  }

  function dreadColor(dread) {
    if (dread <= 4)  return 'var(--green2)';
    if (dread <= 6)  return 'var(--teal)';
    if (dread <= 8)  return 'var(--gold2)';
    if (dread <= 10) return 'var(--gold)';
    if (dread <= 12) return 'var(--red2)';
    return 'var(--purple)';
  }

  // ── RENDER: MISSION BOARD ─────────────────────────────────────────────────────
  function renderMissionBoard() {
    var container = document.getElementById('jobsGrid');
    if (!container) return;
    ensureState();
    if (!S.availableJobs.length) {
      container.innerHTML = '<div style="grid-column:1/-1;font-size:.83rem;color:var(--muted2);padding:.75rem;text-align:center;">No missions available. Click \u201cGenerate Missions\u201d to post new missions.</div>';
      return;
    }
    container.innerHTML = S.availableJobs.map(function(job) {
      var diff = DIFFICULTIES[job.difficulty] || DIFFICULTIES.easy;
      var dc   = dreadColor(diff.dread);
      return '<div class="shop-card" style="display:flex;flex-direction:column;">'
        + '<div class="s-name" style="color:var(--gold2);">' + job.title + '</div>'
        + '<div style="display:flex;gap:.35rem;align-items:center;font-family:\'Rajdhani\',sans-serif;font-size:.72rem;font-weight:700;margin:.15rem 0;">'
          + '<span style="color:' + dc + ';text-transform:uppercase;">' + diff.name + '</span>'
          + '<span style="color:var(--muted2);">·</span>'
          + '<span style="font-family:\'Cinzel\',serif;font-size:.55rem;color:' + dc + ';">DD d' + diff.dread + '</span>'
        + '</div>'
        + '<div style="font-size:.78rem;color:var(--muted3);flex:1;margin:.2rem 0;line-height:1.45;">' + job.location + '</div>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.4rem;padding-top:.3rem;border-top:1px solid var(--border);">'
          + '<span style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:.95rem;color:var(--gold);">' + job.reward + ' \u20B5</span>'
          + '<button class="btn btn-xs btn-primary" onclick="acceptJob(' + job.id + ')">Accept</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  // ── RENDER: ACTIVE MISSIONS ───────────────────────────────────────────────────
  function renderMissionTracker() {
    var container = document.getElementById('missionTrackerContainer');
    if (!container) return;
    ensureState();

    if (!S.activeMissions.length) {
      container.innerHTML = '<div style="font-size:.83rem;color:var(--muted2);padding:.3rem 0;">No active missions. Accept a mission from the board above.</div>';
      return;
    }

    container.innerHTML = S.activeMissions.map(function(mission) {
      var diff = DIFFICULTIES[mission.difficulty] || DIFFICULTIES.easy;
      var dc   = dreadColor(diff.dread);
      var s1   = mission.steps[1];
      var s2   = mission.steps[2];
      var s3   = mission.steps[3];

      // Step indicators
      var stepLabels = { 1: 'Gather Info', 2: 'Go to Site', 3: 'Confrontation' };
      var stepsHTML = [1, 2, 3].map(function(n) {
        var step = mission.steps[n];
        var isActive = (n === 1 && !s1.completed) || (n === 2 && s1.completed && !s2.completed) || (n === 3 && s2.completed && !s3.completed);
        var color    = step.completed ? 'var(--green2)' : isActive ? 'var(--teal)' : 'var(--border2)';
        var textCol  = step.completed ? 'var(--muted2)' : isActive ? 'var(--text)' : 'var(--muted)';
        var strikethrough = step.completed ? 'text-decoration:line-through;' : '';
        var marker   = step.completed ? (step.skipped ? '\u2014' : '\u2713') : String(n);
        return '<div style="display:flex;align-items:center;gap:.3rem;padding:.15rem .2rem;">'
          + '<div style="width:1.3rem;height:1.3rem;border-radius:50%;border:1.5px solid ' + color + ';display:flex;align-items:center;justify-content:center;font-size:.65rem;color:' + color + ';flex-shrink:0;">' + marker + '</div>'
          + '<div style="font-size:.75rem;color:' + textCol + ';' + strikethrough + '">' + stepLabels[n] + (n === 1 ? ' <span style="color:var(--muted);font-size:.62rem;">[optional]</span>' : '') + '</div>'
          + '</div>';
      }).join('');

      // Action buttons
      var btn1 = s1.completed
        ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Info</button>'
        : '<button class="btn btn-xs btn-teal" onclick="startMissionStep1(' + mission.id + ')">\u25B6 Info</button>'
          + '<button class="btn btn-xs" onclick="skipMissionStep1(' + mission.id + ')" style="font-size:.62rem;">Skip</button>';
      var btn2 = s2.completed
        ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Site</button>'
        : '<button class="btn btn-xs btn-teal" onclick="startMissionStep2(' + mission.id + ')"' + (!s1.completed ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Site</button>';
      var btn3 = s3.completed
        ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Confront</button>'
        : '<button class="btn btn-xs btn-primary" onclick="startMissionStep3(' + mission.id + ')"' + (!s2.completed ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Confront</button>';

      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.6rem;margin-bottom:.5rem;">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;">'
          + '<div>'
            + '<div style="font-family:\'Cinzel\',serif;font-size:.8rem;color:var(--gold2);margin-bottom:.1rem;">' + mission.title + '</div>'
            + '<div style="font-size:.7rem;color:' + dc + ';">' + diff.name + ' \u00B7 DD d' + diff.dread + ' \u00B7 ' + mission.location + '</div>'
            + (mission.bonus ? '<div style="font-size:.66rem;color:var(--teal);margin-top:.05rem;">+5 info bonus active</div>' : '')
          + '</div>'
          + '<button class="btn btn-xs btn-red" onclick="abandonMission(' + mission.id + ')">Abandon</button>'
        + '</div>'
        + '<div style="border:1px solid var(--border);padding:.2rem .3rem;margin-bottom:.3rem;">' + stepsHTML + '</div>'
        + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">' + btn1 + btn2 + btn3 + '</div>'
        + '</div>';
    }).join('');
  }

  // ── RENDER: COMPLETED MISSIONS ────────────────────────────────────────────────
  function renderCompletedMissions() {
    var container = document.getElementById('completedMissionsContainer');
    if (!container) return;
    ensureState();
    var recent = (S.completedMissions || []).slice().reverse().slice(0, 10);
    if (!recent.length) {
      container.innerHTML = '<div style="font-size:.8rem;color:var(--muted2);">No completed missions yet.</div>';
      return;
    }
    container.innerHTML = recent.map(function(mission) {
      var diff        = DIFFICULTIES[mission.difficulty] || DIFFICULTIES.easy;
      var outcomeCol  = mission.success ? 'var(--green2)' : 'var(--red2)';
      var outcome     = mission.success ? '\u2713 SUCCESS' : '\u2717 FAILED';
      var lootLine    = (mission.success && mission.loot && mission.loot.length)
        ? '<div style="font-size:.7rem;color:var(--gold2);margin-top:.1rem;">Loot: ' + mission.loot.join(', ') + ' \u00B7 +' + mission.reward + '\u20B5 \u00B7 +1 Renown</div>'
        : '<div style="font-size:.7rem;color:var(--red2);margin-top:.1rem;">\u22121 Renown</div>';
      return '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid ' + outcomeCol + ';padding:.4rem .5rem;margin-bottom:.3rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.75rem;color:' + outcomeCol + ';margin-bottom:.08rem;">' + outcome + ' \u2014 ' + mission.title + '</div>'
        + '<div style="font-size:.68rem;color:var(--muted2);">' + diff.name + ' \u00B7 ' + mission.location + '</div>'
        + lootLine
        + '</div>';
    }).join('');
  }

  // ── SYNC ON LOAD ──────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    ensureState();
    renderMissionBoard();
    renderMissionTracker();
    renderCompletedMissions();
  });

  // ── EXPOSE TO WINDOW ──────────────────────────────────────────────────────────
  window.generateMissions         = generateMissions;
  window.acceptJob                = acceptJob;
  window.abandonMission           = abandonMission;
  window.startMissionStep1        = startMissionStep1;
  window.skipMissionStep1         = skipMissionStep1;
  window.completeMissionInfoStep  = completeMissionInfoStep;
  window.startMissionStep2        = startMissionStep2;
  window.completeMissionSiteStep  = completeMissionSiteStep;
  window.startMissionStep3        = startMissionStep3;
  window.resolveMission           = resolveMission;
  window.renderMissionBoard       = renderMissionBoard;
  window.renderMissionTracker     = renderMissionTracker;
  window.renderCompletedMissions  = renderCompletedMissions;
  window.createMission            = createMission;
  // legacy
  window.completeMissionStep      = function(missionId, stepId) {
    if (stepId === 1) completeMissionInfoStep(missionId, true);
    else if (stepId === 2) completeMissionSiteStep(missionId);
    else if (stepId === 3) resolveMission(missionId, true);
  };
  window.rollForLoot = rollShopLoot;
  window.generateRandomJobs = generateMissions;

}());
