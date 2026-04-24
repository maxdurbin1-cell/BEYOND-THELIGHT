// missions-system.js — Full Missions System (v2)
// 3-step modal · 6 difficulty levels · info features · site exploration · map tokens
(function () {

  var DIFFICULTIES = {
    easy:        { name: 'Easy',        dread: 4,  lootCat: 'items',      credits: 50  },
    medium:      { name: 'Medium',      dread: 6,  lootCat: 'essentials', credits: 100 },
    hard:        { name: 'Hard',        dread: 8,  lootCat: 'scrolls',    credits: 150 },
    challenging: { name: 'Challenging', dread: 10, lootCat: 'toolkits',   credits: 250 },
    very_hard:   { name: 'Very Hard',   dread: 12, lootCat: 'melee_exp',  credits: 400 },
    impossible:  { name: 'Impossible',  dread: 20, lootCat: 'ranged_exp', credits: 700 }
  };
  var DIFF_KEYS = Object.keys(DIFFICULTIES);

  var LOOT_COUNT_DIVISOR      = 6;
  var MAX_COMPLETED_MISSIONS  = 10;
  var LOOT_FALLBACK = {
    easy:        ['Healing Salve'],
    medium:      ['Rope', 'Torch'],
    hard:        ['Scroll', 'Iron Tools'],
    challenging: ['Enchanted Dagger'],
    very_hard:   ['Rare Weapon'],
    impossible:  ['Legendary Item']
  };

  var INFO_FEATURES = [
    { id: 1, name: 'Hidden Cache',      icon: '\u{1F4E6}', effect: 'loot',      effectDesc: 'Gain a free loot roll from the merchant tables.' },
    { id: 2, name: 'Back Entrance',     icon: '\u{1F6AA}', effect: 'bypass',    effectDesc: 'Secret route bypasses Security during Confrontation.' },
    { id: 3, name: 'Shrine',            icon: '\u2736',    effect: 'bolstered', effectDesc: 'Gain the Bolstered Condition (Spirit/Lead \u2191).' },
    { id: 4, name: 'Laboratory',        icon: '\u2697',    effect: 'protected', effectDesc: 'Gain the Protected Condition (Defend \u2191 one Step).' },
    { id: 5, name: 'Hack System',       icon: '\u{1F4BB}', effect: 'hack',      effectDesc: 'Confrontation Dread decreased by one step.' },
    { id: 6, name: 'Through the Vents', icon: '\u{1F4A8}', effect: 'empowered', effectDesc: 'Gain the Empowered Condition (Body/Strike/Shoot \u2191).' }
  ];

  var MERCENARY_ACTIONS = [
    { range: [1,2],   name: 'Stimulant',       desc: 'Recover 5 HP \u00B7 Self' },
    { range: [3,5],   name: 'Scrap Rifle',      desc: 'DD+2 Shoot vs Defend \u00B7 Nearby' },
    { range: [6,7],   name: 'Hack_Volt',        desc: 'Spirit Save vs DD or Lose Next Turn \u00B7 Close' },
    { range: [8,9],   name: 'Chromefist',       desc: 'DD + Ad4 Strike vs Defend \u00B7 Engaged' },
    { range: [10,10], name: 'Activates Shield', desc: 'Protected Condition (DD12) \u00B7 Self' }
  ];

  var LOCATION_COMPLICATIONS = [
    { name: 'Contact Killed', desc: '\u22122 to Attack/Defend Rolls within the Site.' },
    { name: 'Solar Flare',    desc: 'No Personal Flavors may be used within the Site.' },
    { name: 'Zero-Gravity',   desc: '\u22121 Action within the Site.' },
    { name: 'Irradiated',     desc: '+1 Stress per Room Investigated.' },
    { name: 'Army Invades',   desc: 'A Skirmish between Bandits and Wardens erupts. Use Skirmish rules from the Combat Tab.' }
  ];

  var ROOM_TRAPS = [
    'TRAP \u2014 Tripwire: Control vs DD6 or take 3 Stress.',
    'TRAP \u2014 Pressure Plate: Agility vs DD4 or take 4 Stress.',
    'TRAP \u2014 Poison Canister: Body vs DD6 or gain Distracted Condition.',
    'TRAP \u2014 Alarm Wire: Sneak vs DD6 or guards in adjacent rooms are alerted.',
    'TRAP \u2014 Electrified Floor Plate: Notice vs DD4 to spot it; failure = 5 Stress.',
    'TRAP \u2014 Collapsing Shelf: Lead vs DD6 to escape or take 3 Stress and lose 1 Action.'
  ];

  var ROOM_PUZZLES = [
    'PUZZLE \u2014 Locked Access Panel: Mind vs DD6 to bypass; failure costs 1 Action.',
    'PUZZLE \u2014 Encrypted Keypad: Control vs DD8 to crack, or find a key card elsewhere.',
    'PUZZLE \u2014 Jammed Mechanism: Body vs DD4 to force open; failure makes noise.',
    'PUZZLE \u2014 Coded Message: Mind vs DD6 to decode a clue about the target\'s escape route.',
    'PUZZLE \u2014 Biometric Lock: Requires an item from another room or Agility vs DD8.'
  ];

  var ROOM_CACHE_FINDS = [
    'Discarded medkit \u2014 restores d4 Stress.',
    'Scavenged tools \u2014 +1 to next Mind or Control roll in this Site.',
    'Abandoned credits \u2014 gain 25\u20B5.',
    'Datapad with partial guard patrol schedules.',
    'Rations and a concealed flask.',
    'Worn map of the facility with one room marked.'
  ];

  var ROOM_FLAVOR = [
    'Dust and old footprints \u2014 a guard passed through recently.',
    'Empty room. A flickering lamp casts odd shadows.',
    'Half-eaten meal on a table. Whoever left didn\'t plan to.',
    'Old trophies and personal effects. Unsettling.',
    'A side passage leads deeper in \u2014 probably nothing.',
    'Surveillance lens in the corner, but the feed looks looped.',
    'Faded graffiti on the walls. Someone was here a long time ago.',
    'Broken equipment \u2014 this room hasn\'t been used in weeks.',
    'A side door, welded shut from the outside.',
    'The smell of smoke. Something burned here not long ago.'
  ];

  var MISSION_VERBS   = ['Hunt','Guard','Rescue','Deliver','Investigate','Eliminate','Retrieve','Escort','Sabotage','Recover'];
  var MISSION_TARGETS = ['Bandits','Beasts','Refugees','Cargo','Mutineers','Threats','Artifacts','a VIP','Deserters','a Rival'];
  var MISSION_LOCS    = ['Forest Outpost','Mountain Pass','Ancient Ruins','Riverside Town','Hidden Camp','Abandoned Temple','Deep Cave','Border Shrine','Trade Road','Iron Mine'];
  var SEA_MISSION_LOCS = ['Storm-lashed Isle','Coral Shrine','Salt Ruin','Smuggler Anchorage','Drowned Watchpost','Reef Crossing'];
  var GALAXY_MISSION_LOCS = ['Inner Ring Relay','Trade Route Spur','Dead Moon Vault','Derelict Coordinates','Hub Corridor','Outer Signal Graveyard'];
  var MISSION_FACTION_CONFLICTS = [
    { gain:'corporations', lose:'underworld', gainName:'Corporations',       loseName:'The Underworld' },
    { gain:'religious',    lose:'corporations', gainName:'Religious Entities', loseName:'Corporations' },
    { gain:'political',    lose:'military', gainName:'Political Groups',     loseName:'Military Orders' },
    { gain:'military',     lose:'religious', gainName:'Military Orders',     loseName:'Religious Entities' },
    { gain:'underworld',   lose:'political', gainName:'The Underworld',      loseName:'Political Groups' }
  ];

  var GUARD_NAMES = ['Warden Skell','Captain Mira','Enforcer Bonn','Sentinel Garr','Guard Voss','Warden Thane','Blade-for-hire Coll','Sentinel Ruk','Agent Sera','Watcher Drev','Constable Fenn','Marksman Ord'];
  var TARGET_NAMES = ['Lord Kastian','The Grey Merchant','Warden Cress','Elder Vorn','Captain Halved','The Iron Buyer','Countess Daela','Agent Zero','Baron Fell','Treasurer Olin','The Pale Architect','Commander Dusk'];
  var ROOM_TYPES = ['Empty corridor','Guard post (2 sentries)','Storage room','Locked vault','Watch room','Hidden passage','Armory','Workshop','Meeting hall','Supply depot','Infirmary','Command room','Trophy room','Server alcove','Sewage passage','Old chapel'];

  function ensureState() {
    if (typeof S === 'undefined') return;
    S.activeMissions    = S.activeMissions    || [];
    S.completedMissions = S.completedMissions || [];
    S.missionTokens     = S.missionTokens     || {};
    S.availableJobs     = S.availableJobs     || [];
    if (S.lastSea && !S.lastSea.missionTokens) { S.lastSea.missionTokens = {}; }

    // Backfill older mission objects so resolve buttons work for legacy saves.
    S.activeMissions.forEach(function(m) {
      if (!m || typeof m !== 'object') { return; }
      if (!m.steps || typeof m.steps !== 'object') { m.steps = {}; }
      if (!m.steps[1]) { m.steps[1] = { name:'Gather Information', required:false, completed:false, skipped:false }; }
      if (!m.steps[2]) { m.steps[2] = { name:'Go to Site', required:true, completed:false }; }
      if (!m.steps[3]) { m.steps[3] = { name:'Confrontation', required:true, completed:false }; }
      if (!Array.isArray(m.loot)) { m.loot = []; }
      if (!Array.isArray(m.rooms)) { m.rooms = []; }
      if (!Array.isArray(m.guards)) { m.guards = []; }
      if (typeof m.reward !== 'number') {
        var d = DIFFICULTIES[m.difficulty] || DIFFICULTIES.easy;
        m.reward = d.credits;
      }
      if (typeof m.dread !== 'number') {
        var dd = DIFFICULTIES[m.difficulty] || DIFFICULTIES.easy;
        m.dread = dd.dread;
      }
      if (typeof m.bonus !== 'number') { m.bonus = 0; }
    });
  }

  function getAvailableMissionRegions() {
    var regions = ['province'];
    if (S.lastSea && Array.isArray(S.lastSea.map) && S.lastSea.map.length) { regions.push('sea'); }
    if (S.starSystem && Array.isArray(S.starSystem.hexes) && S.starSystem.hexes.length) { regions.push('galaxy'); }
    return regions;
  }

  function getMissionLocationForRegion(region) {
    if (region === 'sea') { return pick(SEA_MISSION_LOCS); }
    if (region === 'galaxy') { return pick(GALAXY_MISSION_LOCS); }
    return pick(MISSION_LOCS);
  }

  function rollShopLoot(difficulty) {
    var diff  = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var table = (typeof SHOP_DATA !== 'undefined' && SHOP_DATA[diff.lootCat]) || [];
    if (!table.length) {
      return (LOOT_FALLBACK[difficulty] || ['Unknown reward']);
    }
    var count = Math.max(1, Math.ceil(diff.dread / LOOT_COUNT_DIVISOR));
    var loot = [];
    for (var i = 0; i < count; i++) { loot.push(pick(table).name); }
    return loot;
  }

  function reduceDreadStep(dread) {
    var steps = {20:12,12:10,10:8,8:6,6:4,4:4};
    return steps[dread] || dread;
  }

  function assignMissionToken(mission) {
    ensureState();
    if (mission.region === 'galaxy' && typeof createGalaxyTask === 'function') {
      // Mirror province flow with two markers: informer lead + site objective.
      var informerTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Informer)',
        text: 'Track local informants for mission intel near ' + mission.location + '.',
        reward: { credits: 0 }
      });
      var siteTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Site)',
        text: 'Mission board contract: ' + mission.location + '.',
        reward: { credits: mission.reward, globalRenown: 1 }
      });
      if (informerTask) {
        mission.galaxyInformerTaskId = informerTask.id;
        mission.galaxyInformerHexId = informerTask.hexId;
      }
      if (siteTask) {
        mission.galaxyTaskId = siteTask.id;
        mission.galaxyHexId = siteTask.hexId;
      }
      return;
    }
    if (mission.region === 'sea' && S.lastSea && Array.isArray(S.lastSea.map) && S.lastSea.map.length) {
      S.lastSea.missionTokens = S.lastSea.missionTokens || {};
      var seaCandidates = S.lastSea.map.filter(function(hex) { return hex.type === 'island' || hex.siteType; });
      if (!seaCandidates.length) { seaCandidates = S.lastSea.map.slice(); }
      if (seaCandidates.length) {
        var siteHex = seaCandidates[Math.floor(Math.random() * seaCandidates.length)];
        var informerPool = seaCandidates.filter(function(hex) { return hex.key !== siteHex.key; });
        var informerHex = informerPool.length ? informerPool[Math.floor(Math.random() * informerPool.length)] : null;
        S.lastSea.missionTokens[siteHex.key] = { missionId: mission.id, title: mission.title, type: 'site' };
        mission.seaSiteKey = siteHex.key;
        if (informerHex) {
          S.lastSea.missionTokens[informerHex.key] = { missionId: mission.id, title: mission.title, type: 'informer' };
          mission.seaInformerKey = informerHex.key;
        }
        if (typeof renderLastSeaMap === 'function') renderLastSeaMap();
      }
      return;
    }
    if (typeof mapData !== 'undefined' && mapData.length) {
      var candidates = mapData.filter(function(h) { return h.type === 'wilderness'; });
      if (candidates.length >= 2) {
        // Pick two distinct hexes: one for the Informer (step 1), one for the Site (steps 2-3)
        var shuffled = candidates.slice().sort(function(){ return Math.random()-0.5; });
        var informerHex = shuffled[0];
        var siteHex = shuffled[1];
        S.missionTokens[informerHex.col + ',' + informerHex.row] = { missionId: mission.id, title: mission.title, type: 'informer' };
        S.missionTokens[siteHex.col + ',' + siteHex.row]      = { missionId: mission.id, title: mission.title, type: 'site' };
        mission.informerHex = { col: informerHex.col, row: informerHex.row };
        mission.siteHex     = { col: siteHex.col,     row: siteHex.row };
        // Keep mapHex pointing to site for backwards compatibility
        mission.mapHex = mission.siteHex;
      } else if (candidates.length === 1) {
        var hex = candidates[0];
        S.missionTokens[hex.col + ',' + hex.row] = { missionId: mission.id, title: mission.title, type: 'site' };
        mission.siteHex = { col: hex.col, row: hex.row };
        mission.mapHex  = mission.siteHex;
      }
      if (typeof renderHexMap === 'function') renderHexMap();
    }
  }

  function removeMissionToken(mission) {
    if (!mission) return;
    if (mission.region === 'sea' && S.lastSea && S.lastSea.missionTokens) {
      if (mission.seaInformerKey) { delete S.lastSea.missionTokens[mission.seaInformerKey]; }
      if (mission.seaSiteKey) { delete S.lastSea.missionTokens[mission.seaSiteKey]; }
      if (typeof renderLastSeaMap === 'function') renderLastSeaMap();
      return;
    }
    if (mission.region === 'galaxy') {
      var taskIds = [mission.galaxyInformerTaskId, mission.galaxyTaskId].filter(Boolean);
      if (taskIds.length && S.starSystem && Array.isArray(S.starSystem.taskMarkers)) {
        S.starSystem.taskMarkers.forEach(function(task) {
          if (taskIds.indexOf(task.id) >= 0) {
            task.resolved = true;
            var hex = (S.starSystem.hexes || []).find(function(h) { return h.id === task.hexId; });
            if (hex && hex.taskMarker && hex.taskMarker.id === task.id) {
              hex.taskMarker.resolved = true;
            }
          }
        });
      }
      if (typeof renderStarSystemMap === 'function') renderStarSystemMap();
      if (typeof updateStarSystemReadouts === 'function') updateStarSystemReadouts();
      return;
    }
    if (mission.informerHex) {
      delete S.missionTokens[mission.informerHex.col + ',' + mission.informerHex.row];
    }
    if (mission.siteHex) {
      delete S.missionTokens[mission.siteHex.col + ',' + mission.siteHex.row];
    }
    // Fallback for old missions that only have mapHex
    if (mission.mapHex && !mission.siteHex) {
      delete S.missionTokens[mission.mapHex.col + ',' + mission.mapHex.row];
    }
    if (typeof renderHexMap === 'function') renderHexMap();
  }

  function removeInformerToken(mission) {
    if (mission && mission.region === 'sea' && mission.seaInformerKey && S.lastSea && S.lastSea.missionTokens) {
      delete S.lastSea.missionTokens[mission.seaInformerKey];
      if (typeof renderLastSeaMap === 'function') renderLastSeaMap();
      return;
    }
    if (!mission || !mission.informerHex) return;
    delete S.missionTokens[mission.informerHex.col + ',' + mission.informerHex.row];
    if (typeof renderHexMap === 'function') renderHexMap();
  }

  function generateRoomObjects(difficulty) {
    var counts = { easy:2,medium:3,hard:4,challenging:6,very_hard:9,impossible:12 };
    var n = counts[difficulty] || 2;
    var rooms = [];
    for (var i = 0; i < n; i++) {
      rooms.push({ label:(i===0?'Entrance: ':'Room '+(i+1)+': ')+pick(ROOM_TYPES), explored:false, find:null, confrontTriggered:false, confrontResolved:false });
    }
    return rooms;
  }

  function generateGuards(dread) {
    var n = Math.min(4, Math.max(2, Math.floor(dread/4)+1));
    var guards = [], usedNames = [];
    for (var i = 0; i < n; i++) {
      var name = pick(GUARD_NAMES);
      while (usedNames.indexOf(name) >= 0) { name = pick(GUARD_NAMES); }
      usedNames.push(name);
      guards.push({ name:name, dread:dread, hp:dread*2 });
    }
    return guards;
  }

  function pickFactionConflict() {
    return pick(MISSION_FACTION_CONFLICTS);
  }

  function applyFactionStandingDelta(gainKey, loseKey) {
    if (!gainKey || !loseKey) { return; }
    if (typeof changeFactionRenown === 'function') {
      changeFactionRenown(gainKey, 1);
      changeFactionRenown(loseKey, -1);
      return;
    }
    S.factionRenown = S.factionRenown || { corporations:0, religious:0, political:0, military:0, underworld:0 };
    S.factionRenown[gainKey] = Math.max(-10, Math.min(12, (S.factionRenown[gainKey] || 0) + 1));
    S.factionRenown[loseKey] = Math.max(-10, Math.min(12, (S.factionRenown[loseKey] || 0) - 1));
  }

  function makeMission(title, difficulty, location, region, factionData) {
    var diff = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var f = factionData || pickFactionConflict();
    return {
      id: Date.now() + Math.floor(Math.random() * 10000), title:title, difficulty:difficulty, dread:diff.dread,
      location:location||'Unknown', region:region||'province', reward:diff.credits, bonus:0,
      factionGain: f.gain,
      factionLose: f.lose,
      factionGainName: f.gainName,
      factionLoseName: f.loseName,
      infoFeature:null, additionalDanger:null, bypassSecurity:false, hackSystem:false,
      siteRoll:null, rooms:generateRoomObjects(difficulty), guards:generateGuards(diff.dread),
      target:pick(TARGET_NAMES), loot:[],  mapHex:null,
      steps:{
        1:{name:'Gather Information',required:false,completed:false,skipped:false},
        2:{name:'Go to Site',        required:true, completed:false},
        3:{name:'Confrontation',     required:true, completed:false}
      },
      createdAt: new Date().toISOString()
    };
  }

  function generateMissions() {
    ensureState();
    S.availableJobs = [];
    var seed = Date.now();
    var count = Math.max(1, Math.min(4, roll(4)));
    for (var i = 0; i < count; i++) {
      var diffKey = pick(DIFF_KEYS);
      var diff    = DIFFICULTIES[diffKey];
      var f = pickFactionConflict();
      var region = pick(getAvailableMissionRegions());
      S.availableJobs.push({
        id:seed + i + 1,
        title:pick(MISSION_VERBS)+' '+pick(MISSION_TARGETS),
        difficulty:diffKey,
        dread:diff.dread,
        location:getMissionLocationForRegion(region),
        reward:diff.credits,
        region:region,
        factionGain:f.gain,
        factionLose:f.lose,
        factionGainName:f.gainName,
        factionLoseName:f.loseName
      });
    }
    renderMissionBoard();
    showNotif('Posted '+count+' mission'+(count!==1?'s':'')+' on the board!','good');
  }

  function acceptJob(jobId) {
    ensureState();
    var job = null;
    for (var i = 0; i < S.availableJobs.length; i++) { if (String(S.availableJobs[i].id) === String(jobId)) { job = S.availableJobs[i]; break; } }
    if (!job) return;
    var mission = makeMission(job.title, job.difficulty, job.location, job.region||'province', {
      gain:job.factionGain,
      lose:job.factionLose,
      gainName:job.factionGainName,
      loseName:job.factionLoseName
    });
    S.activeMissions.push(mission);
    S.availableJobs = S.availableJobs.filter(function(j){return String(j.id)!==String(jobId);});
    assignMissionToken(mission);
    renderMissionBoard();
    renderMissionTracker();
    showNotif('Mission accepted: '+mission.title,'good');
  }

  /* ── STEP 1 ── */
  function rollInfoFeature() { return INFO_FEATURES[roll(6)-1]; }
  function rollInfoDanger() {
    return roll(6)<=3 ? {type:'mercenary',data:{name:'Mercenary',dread:10,hp:20}} : {type:'complication',data:pick(LOCATION_COMPLICATIONS)};
  }

  function startMissionStep1(missionId) {
    ensureState();
    var mission = getMission(missionId);
    if (!mission) return;
    var advDie=getStat('adventure'), dreadDie=mission.dread;
    var advR=explodingRoll(advDie), dreadR=explodingRoll(dreadDie);
    var success=advR.total>=dreadR.total;
    var fod = success ? rollInfoFeature() : rollInfoDanger();

    var rollBlock = '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .6rem;margin-bottom:.45rem;">'
      + '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.3rem;">Adventure d'+advDie+' vs Dread d'+dreadDie+'</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.3rem;">'
        + '<div style="text-align:center;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--teal);text-transform:uppercase;margin-bottom:.1rem;">Your Roll</div>'
          + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">'+advR.total+'</div>'
          + (advR.exploded?'<div style="font-size:.62rem;color:var(--gold2);">\u2746 Crit!</div>':'')
        + '</div>'
        + '<div style="text-align:center;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.1rem;">Dread Roll</div>'
          + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">'+dreadR.total+'</div>'
        + '</div>'
      + '</div>'
      + '<div style="text-align:center;font-family:\'Cinzel\',serif;font-size:.78rem;color:'+(success?'var(--green2)':'var(--red2)')+';">'
        + (success?'\u2713 Information gathered \u2014 +5 bonus secured':'\u2717 Contacts run dry \u2014 Additional Danger incoming')
      + '</div>'
    + '</div>';

    var resultBlock='';
    if (success) {
      var f=fod;
      resultBlock='<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.5rem .6rem;margin-bottom:.45rem;">'
        +'<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--teal);text-transform:uppercase;margin-bottom:.25rem;">\u2b62 Hidden Feature Revealed (d6 = '+f.id+')</div>'
        +'<div style="font-size:.85rem;color:var(--text);margin-bottom:.15rem;"><strong>'+f.icon+' '+f.name+'</strong></div>'
        +'<div style="font-size:.78rem;color:var(--muted3);line-height:1.5;">'+f.effectDesc+'</div>'
      +'</div>';
    } else {
      var d=fod;
      if (d.type==='mercenary') {
        var actRows=MERCENARY_ACTIONS.map(function(a){ return '<div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted3);padding:.1rem 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted2);width:1.4rem;">'+a.range[0]+(a.range[1]!==a.range[0]?'\u2013'+a.range[1]:'')+'</span><span style="color:var(--text2);flex:1;padding:0 .3rem;">'+a.name+'</span><span style="color:var(--muted);font-size:.65rem;">'+a.desc+'</span></div>'; }).join('');
        resultBlock='<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.5rem .6rem;margin-bottom:.45rem;">'
          +'<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.2rem;">\u26a0 Additional Danger \u2014 Mercenary</div>'
          +'<div style="font-size:.8rem;color:var(--text);font-weight:700;margin-bottom:.15rem;">Mercenary <span style="font-family:\'Rajdhani\',sans-serif;color:var(--red2);font-size:.75rem;">DD10 | 20 HP | 2 Actions</span></div>'
          +actRows
          +'<div style="font-size:.68rem;color:var(--muted);margin-top:.25rem;">This Mercenary joins the confrontation during Step 3.</div>'
        +'</div>';
      } else {
        var comp=d.data;
        resultBlock='<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.5rem .6rem;margin-bottom:.45rem;">'
          +'<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.2rem;">\u26a0 Additional Danger \u2014 Location Complication</div>'
          +'<div style="font-size:.82rem;color:var(--text);font-weight:700;margin-bottom:.15rem;">'+comp.name+'</div>'
          +'<div style="font-size:.78rem;color:var(--muted3);line-height:1.5;">'+comp.desc+'</div>'
        +'</div>';
      }
    }

    var encoded=encodeURIComponent(JSON.stringify(fod));
    var html='<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;"><strong style="color:var(--gold2);">Gather Information</strong> \u2014 optional. Success grants <strong style="color:var(--teal);">+5 bonus</strong> and reveals a hidden feature. Failure introduces <strong style="color:var(--red2);">Additional Danger</strong>. You may also skip.</div>'
      +rollBlock+resultBlock
      +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        +'<button class="btn btn-sm" onclick="skipMissionStep1('+missionId+');closeModal();">Skip This Step</button>'
        +'<button class="btn btn-sm btn-teal" onclick="completeMissionInfoStep('+missionId+','+success+',decodeURIComponent(\''+encoded+'\'));closeModal();">Confirm</button>'
      +'</div>';
    openModal('Step 1 \u2014 Gather Information',html);
  }

  function completeMissionInfoStep(missionId, success, encodedResult) {
    var mission = getMission(missionId);
    if (!mission) return;
    mission.steps[1].completed=true; mission.steps[1].skipped=false;
    removeInformerToken(mission);
    if (success) {
      mission.bonus=5;
      var f=typeof encodedResult==='string'?JSON.parse(encodedResult):encodedResult;
      mission.infoFeature=f;
      switch(f.effect) {
        case 'loot':
          var lootItems=rollShopLoot(mission.difficulty); mission.loot=mission.loot.concat(lootItems);
          showNotif('\uD83D\uDCE6 Hidden Cache! Found: '+lootItems.join(', '),'good'); break;
        case 'bypass':
          mission.bypassSecurity=true;
          showNotif('\uD83D\uDEAA Back Entrance \u2014 Security bypassed!','good'); break;
        case 'bolstered':
          if (typeof toggleCond==='function') toggleCond('bolstered');
          showNotif('\u2728 Shrine \u2014 Bolstered Condition granted!','good'); break;
        case 'protected':
          if (typeof toggleCond==='function') toggleCond('protected');
          showNotif('\uD83D\uDEE1 Laboratory \u2014 Protected Condition granted!','good'); break;
        case 'hack':
          mission.hackSystem=true; mission.dread=reduceDreadStep(mission.dread);
          showNotif('\uD83D\uDCBB Hack System \u2014 Confrontation Dread reduced!','good'); break;
        case 'empowered':
          if (typeof toggleCond==='function') toggleCond('empowered');
          showNotif('\u26A1 Vents \u2014 Empowered Condition granted!','good'); break;
      }
    } else {
      var dan=typeof encodedResult==='string'?JSON.parse(encodedResult):encodedResult;
      mission.additionalDanger=dan;
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
    renderMissionTracker();
  }

  function skipMissionStep1(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    mission.steps[1].completed=true; mission.steps[1].skipped=true;
    removeInformerToken(mission);
    renderMissionTracker();
  }

  /* ── STEP 2: INTERACTIVE SITE EXPLORATION ── */
  function startMissionStep2(missionId) {
    ensureState();
    var mission=getMission(missionId); if (!mission) return;
    if (!mission.steps[1].completed) { showNotif('Complete or skip Step 1 first.','warn'); return; }
    if (!mission.siteRoll) {
      var advDie=getStat('adventure'), bonus=mission.bonus||0;
      var aR=explodingRoll(advDie), dR=explodingRoll(mission.dread);
      var tot=aR.total+bonus;
      mission.siteRoll={ advDie:advDie, dreadDie:mission.dread, adv:aR.total, bonus:bonus, dread:dR.total, total:tot, success:tot>=dR.total, exploded:aR.exploded };
    }
    renderSiteModal(missionId);
  }

  function renderSiteModal(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    var sr=mission.siteRoll, bonus=sr.bonus||0;

    // Complication banner
    var compBanner='';
    if (mission.additionalDanger&&mission.additionalDanger.type==='complication') {
      var comp=mission.additionalDanger.data;
      compBanner='<div style="background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.35);padding:.3rem .5rem;margin-bottom:.4rem;font-size:.74rem;"><strong style="color:var(--red2);">\u26a0 '+comp.name+'</strong> <span style="color:var(--muted3);">\u2014 '+comp.desc+'</span></div>';
    }

    var rollBlock='<div style="background:var(--surface);border:1px solid var(--border2);padding:.4rem .5rem;margin-bottom:.4rem;">'
      +'<div style="font-size:.7rem;color:var(--muted2);">Adventure d'+sr.advDie+(bonus?'+'+bonus:'')+' vs Dread d'+sr.dreadDie+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin:.25rem 0;">'
        +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.08em;color:var(--teal);text-transform:uppercase;">Your Roll</div>'
          +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:1.8rem;font-weight:700;color:var(--teal);">'+sr.total+(bonus?'<span style="font-size:.7rem;color:var(--muted2);"> ('+sr.adv+'+'+bonus+')</span>':'')+'</div>'
          +(sr.exploded?'<div style="font-size:.6rem;color:var(--gold2);">\u2746 Crit!</div>':'')
        +'</div>'
        +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.08em;color:var(--red2);text-transform:uppercase;">Dread Roll</div>'
          +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:1.8rem;font-weight:700;color:var(--red);">'+sr.dread+'</div>'
        +'</div>'
      +'</div>'
      +'<div style="text-align:center;font-family:\'Cinzel\',serif;font-size:.75rem;color:'+(sr.success?'var(--green2)':'var(--red2)')+';">'+(sr.success?'\u2713 Arrived undetected':'\u2717 Setback \u2014 lost time and exposed')+'</div>'
    +'</div>';

    var featureBadge='';
    if (mission.infoFeature) {
      featureBadge='<div style="font-size:.7rem;color:var(--teal);margin-bottom:.35rem;padding:.2rem .4rem;border:1px solid rgba(46,196,182,.3);display:inline-block;">'+mission.infoFeature.icon+' '+mission.infoFeature.name+' \u2014 '+mission.infoFeature.effectDesc+'</div><br>';
    }

    var irradiated=mission.additionalDanger&&mission.additionalDanger.type==='complication'&&mission.additionalDanger.data.name==='Irradiated';
    var roomsHTML='<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.25rem;">Site Layout \u2014 '+mission.rooms.length+' Room'+(mission.rooms.length!==1?'s':'')+'</div>';

    mission.rooms.forEach(function(room,idx) {
      var explored=room.explored, confrontActive=room.confrontTriggered&&!room.confrontResolved;
      var findHTML='';
      if (explored&&room.find) {
        var fc=room.find.type==='trap'?'var(--red2)':room.find.type==='puzzle'?'var(--gold2)':room.find.type==='cache'?'var(--green2)':'var(--muted3)';
        findHTML='<div style="font-size:.7rem;color:'+fc+';margin-top:.2rem;padding-top:.2rem;border-top:1px dashed var(--border);">'+room.find.text+'</div>';
        if (irradiated) findHTML+='<div style="font-size:.66rem;color:var(--red2);">\u2622 Irradiated: +1 Stress for entering this room.</div>';
      }
      var actionBtn='';
      if (!explored) {
        actionBtn='<button class="btn btn-xs btn-teal" onclick="exploreRoom('+missionId+','+idx+')" style="margin-top:.2rem;">Investigate</button>';
      } else if (confrontActive) {
        actionBtn='<div style="margin-top:.2rem;display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;"><div style="font-size:.7rem;color:var(--red2);font-weight:700;">\u26a1 Confrontation triggered!</div><button class="btn btn-xs btn-red" onclick="resolveRoomConfrontation('+missionId+','+idx+',false)">Fail</button><button class="btn btn-xs btn-primary" onclick="resolveRoomConfrontation('+missionId+','+idx+',true)">Succeed</button></div>';
      }
      roomsHTML+='<div style="padding:.3rem .4rem;margin-bottom:.25rem;border:1px solid '+(confrontActive?'var(--red2)':explored?'var(--border)':'var(--border2)')+';background:'+(confrontActive?'rgba(200,50,50,.05)':'var(--surface)')+';">'
        +'<div style="font-size:.75rem;color:'+(explored?'var(--muted2)':'var(--text)')+';">'+(explored?'\u2713 ':'')+room.label+'</div>'
        +findHTML+actionBtn
      +'</div>';
    });

    var allExplored=mission.rooms.every(function(r){return r.explored;});
    var hasActive=mission.rooms.some(function(r){return r.confrontTriggered&&!r.confrontResolved;});
    var proceedBtn='';
    if (!hasActive) {
      if (allExplored) {
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm btn-teal" onclick="completeMissionSiteStep('+missionId+');closeModal();">Proceed to Confrontation</button></div>';
      } else {
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm" onclick="completeMissionSiteStep('+missionId+');closeModal();" style="opacity:.75;">Skip Remaining Rooms \u2192 Confrontation</button></div>';
      }
    }

    var titleEl=document.getElementById('modalTitle');
    var contentEl=document.getElementById('modalContent');
    if (titleEl) titleEl.textContent='Step 2 \u2014 Go to Site';
    if (contentEl) contentEl.innerHTML=compBanner+featureBadge+rollBlock+roomsHTML+proceedBtn;
    var modal=document.getElementById('rollModal');
    if (modal&&!modal.classList.contains('open')) modal.classList.add('open');
  }

  function exploreRoom(missionId,roomIdx) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||room.explored) return;
    room.explored=true;
    var r=roll(6);
    if (r===1) {
      room.confrontTriggered=true;
      room.find={type:'confront',text:'\u26a1 Guards spotted you in this room! Resolve the confrontation below.'};
    } else if (r<=3) {
      room.find={type:'trap',text:pick(ROOM_TRAPS)};
    } else if (r===4) {
      room.find={type:'puzzle',text:pick(ROOM_PUZZLES)};
    } else if (r===5) {
      room.find={type:'cache',text:'CACHE \u2014 '+pick(ROOM_CACHE_FINDS)};
    } else {
      room.find={type:'flavor',text:pick(ROOM_FLAVOR)};
    }
    renderSiteModal(missionId);
  }

  function resolveRoomConfrontation(missionId,roomIdx,success) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room) return;
    room.confrontResolved=true;
    if (!success) {
      S.renown=Math.max(0,(S.renown||0)-1);
      if (typeof updateRenown==='function') updateRenown();
      showNotif('Room confrontation failed. \u22121 Renown.','warn');
    } else {
      showNotif('Room confrontation succeeded!','good');
    }
    renderSiteModal(missionId);
  }

  function completeMissionSiteStep(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    mission.steps[2].completed=true;
    renderMissionTracker();
  }

  /* ── STEP 3: CONFRONTATION ── */
  function startMissionStep3(missionId) {
    ensureState();
    var mission=getMission(missionId); if (!mission) return;
    if (!mission.steps[2].completed) { showNotif('Complete Step 2 first.','warn'); return; }
    var advDie=getStat('adventure'), dreadDie=mission.dread, bonus=mission.bonus||0;

    var compBanner='';
    if (mission.additionalDanger&&mission.additionalDanger.type==='complication') {
      var comp=mission.additionalDanger.data;
      compBanner='<div style="background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.35);padding:.3rem .5rem;margin-bottom:.45rem;font-size:.74rem;"><strong style="color:var(--red2);">\u26a0 '+comp.name+'</strong> <span style="color:var(--muted3);">\u2014 '+comp.desc+'</span></div>';
    }

    var featureBadge='';
    if (mission.infoFeature) {
      featureBadge='<div style="font-size:.7rem;color:var(--teal);margin-bottom:.35rem;padding:.2rem .4rem;border:1px solid rgba(46,196,182,.3);">'+mission.infoFeature.icon+' '+mission.infoFeature.name+(mission.bypassSecurity?' \u2014 Security bypassed!':(mission.hackSystem?' \u2014 Dread reduced to d'+dreadDie+'.':''))+'</div>';
    }

    var guardsSection='';
    if (!mission.bypassSecurity) {
      var gRows=(mission.guards||[]).map(function(g){return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.74rem;color:var(--muted3);padding:.15rem 0;border-bottom:1px solid var(--border);"><span>'+g.name+'</span><span style="color:var(--red2);font-family:\'Rajdhani\',sans-serif;font-weight:700;">DD'+g.dread+' | '+g.hp+' HP</span></div>';}).join('');
      guardsSection='<div style="margin-bottom:.4rem;"><div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.15rem;">Security ('+(mission.guards||[]).length+' Guards)</div>'+gRows+'</div>';
    } else {
      guardsSection='<div style="font-size:.76rem;color:var(--green2);margin-bottom:.4rem;padding:.25rem .4rem;border:1px solid rgba(0,200,100,.3);">\u2713 Back Entrance \u2014 Security bypassed. No guards to face.</div>';
    }

    var mercSection='';
    if (mission.additionalDanger&&mission.additionalDanger.type==='mercenary') {
      var aRows=MERCENARY_ACTIONS.map(function(a){return '<div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted3);padding:.1rem 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted2);width:1.4rem;">'+a.range[0]+(a.range[1]!==a.range[0]?'\u2013'+a.range[1]:'')+'</span><span style="color:var(--text2);flex:1;padding:0 .3rem;">'+a.name+'</span><span style="color:var(--muted);font-size:.65rem;">'+a.desc+'</span></div>';}).join('');
      mercSection='<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.3);padding:.35rem .5rem;margin-bottom:.4rem;"><div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.15rem;">\u26a0 Additional Danger</div><div style="font-size:.78rem;color:var(--text);font-weight:700;margin-bottom:.15rem;">Mercenary <span style="font-family:\'Rajdhani\',sans-serif;color:var(--red2);">DD10 | 20 HP | 2 Actions</span></div>'+aRows+'</div>';
    }

    var targetRow='<div style="font-size:.78rem;margin-bottom:.45rem;padding:.25rem .35rem;border:1px solid var(--border2);"><strong style="color:var(--gold2);">Target:</strong> <span style="color:var(--text);">'+mission.target+'</span></div>';
    var rollInstr='<div style="background:var(--surface);border:1px solid var(--border2);padding:.4rem .55rem;margin-bottom:.45rem;"><div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Roll Adventure d'+advDie+(bonus?' + '+bonus:'')+' vs Dread d'+dreadDie+' \u2014 then click your outcome:</div><div style="font-size:.7rem;color:var(--muted);">Use the Dice tab or physical dice. Add the +'+(bonus||0)+' bonus to your roll before comparing.</div></div>';

    var html=compBanner+featureBadge+guardsSection+mercSection+targetRow+rollInstr
      +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        +'<button class="btn btn-sm btn-red" onclick="resolveMissionOutcome('+missionId+',false)">\u2717 Failure \u2014 Roll Failed</button>'
        +'<button class="btn btn-sm btn-primary" onclick="resolveMissionOutcome('+missionId+',true)">\u2713 Success \u2014 Roll Succeeded</button>'
      +'</div>';
    openModal('Step 3 \u2014 Confrontation',html);
  }

  /* ── RESOLVE MISSION ── */
  function resolveMission(missionId,success) {
    ensureState();
    var idx=-1;
    for (var i=0;i<S.activeMissions.length;i++) { if (String(S.activeMissions[i].id)===String(missionId)){idx=i;break;} }
    if (idx===-1) return;
    var mission=S.activeMissions[idx];
    if (!Array.isArray(mission.loot)) mission.loot = [];
    if (!mission.steps || typeof mission.steps !== 'object') mission.steps = {};
    if (!mission.steps[3]) mission.steps[3] = { name:'Confrontation', required:true, completed:false };
    mission.steps[3].completed=true; mission.completedAt=new Date().toISOString(); mission.success=success;
    var stored=[]; var dropped=[]; var newLoot=[];
    if (success) {
      try {
        newLoot=rollShopLoot(mission.difficulty) || [];
      } catch (err) {
        newLoot=[];
      }
      mission.loot=mission.loot.concat(newLoot);
      S.credits=(S.credits||0)+(mission.reward||100); S.renown=(S.renown||0)+1;
      applyFactionStandingDelta(mission.factionGain, mission.factionLose);
      try { if (typeof updateCreditsUI==='function') updateCreditsUI(); } catch (err) {}
      try { if (typeof updateRenown==='function') updateRenown(); } catch (err) {}
      // Add mission loot directly to backpack slots when possible.
      if (typeof addToBackpack === 'function') {
        for (var li=0; li<newLoot.length; li++) {
          try {
            if (addToBackpack(newLoot[li])) stored.push(newLoot[li]);
            else dropped.push(newLoot[li]);
          } catch (err) {
            dropped.push(newLoot[li]);
          }
        }
      } else {
        dropped = newLoot.slice();
      }
    } else {
      S.renown=Math.max(0,(S.renown||0)-1);
      try { if (typeof updateRenown==='function') updateRenown(); } catch (err) {}
    }
    try { removeMissionToken(mission); } catch (err) {}
    var completedEntry = {
      id: mission.id,
      title: mission.title || 'Unknown Mission',
      difficulty: mission.difficulty || 'easy',
      location: mission.location || 'Unknown',
      success: !!success,
      reward: Number(mission.reward || 0),
      loot: Array.isArray(mission.loot) ? mission.loot.slice() : [],
      infoFeature: mission.infoFeature && mission.infoFeature.name ? {
        icon: mission.infoFeature.icon || '',
        name: mission.infoFeature.name || ''
      } : null,
      additionalDanger: mission.additionalDanger || null,
      factionGain: mission.factionGain || null,
      factionLose: mission.factionLose || null,
      factionGainName: mission.factionGainName || null,
      factionLoseName: mission.factionLoseName || null,
      completedAt: mission.completedAt,
      missionType: 'standard'
    };
    if (S.completedMissions.length>=MAX_COMPLETED_MISSIONS) S.completedMissions.shift();
    S.completedMissions.push(completedEntry);
    S.activeMissions.splice(idx,1);
    try { renderMissionBoard(); } catch (err) {}
    try { renderMissionTracker(); } catch (err) {}
    try { renderCompletedMissions(); } catch (err) {}
    try { if (typeof renderBackpackUI === 'function') renderBackpackUI(); } catch (err) {}
    try { if (typeof renderQP === 'function') renderQP('missions'); } catch (err) {}
    if (success) {
      // AUDIO: Mission complete
      if (typeof window.AudioManager !== 'undefined') {
        window.AudioManager.missionComplete();
      }
      try { showNotif('Mission complete! +1 Renown \u00B7 +'+mission.reward+'\u20B5 \u00B7 '+(mission.factionGainName||'Faction')+' +1 / '+(mission.factionLoseName||'Faction')+' -1 \u00B7 Loot: '+mission.loot.join(', '),'good'); } catch (err) {}
      if (stored.length) {
        try { showNotif('Added to backpack: ' + stored.join(', '), 'good'); } catch (err) {}
      }
      if (dropped.length) {
        try { showNotif('Backpack full. Unstored loot: ' + dropped.join(', '), 'warn'); } catch (err) {}
      }
    } else {
      try { showNotif('Mission failed. \u22121 Renown.','warn'); } catch (err) {}
    }
  }

  function resolveMissionOutcome(missionId, success) {
    try { if (typeof closeModal === 'function') closeModal(); } catch (err) {}
    resolveMission(missionId, success);
  }

  function abandonMission(missionId) { resolveMission(missionId,false); }

  /* ── LEGACY COMPAT ── */
  function createMission(npcName,title,difficulty,location,region) {
    ensureState();
    var mission=makeMission(title,difficulty,location,region);
    S.activeMissions.push(mission); assignMissionToken(mission); renderMissionTracker();
    return mission;
  }

  /* ── HELPERS ── */
  function getMission(missionId) {
    var missions=(typeof S!=='undefined'&&S.activeMissions)||[];
    for (var i=0;i<missions.length;i++) { if (String(missions[i].id)===String(missionId)) return missions[i]; }
    return null;
  }

  function getStat(name) {
    return (S&&S.stats&&S.stats[name]) ? S.stats[name] : 4;
  }

  function dreadColor(dread) {
    if (dread<=4) return 'var(--green2)';
    if (dread<=6) return 'var(--teal)';
    if (dread<=8) return 'var(--gold2)';
    if (dread<=10) return 'var(--gold)';
    if (dread<=12) return 'var(--red2)';
    return 'var(--purple)';
  }

  /* ── RENDER: MISSION BOARD ── */
  function renderMissionBoard() {
    var container=document.getElementById('jobsGrid'); if (!container) return;
    ensureState();

    // Special: Holding Establishment quest card.
    var holdingQuestHtml = '';
    if (typeof window.getHoldingQuestBoardCardHtml === 'function') {
      holdingQuestHtml = window.getHoldingQuestBoardCardHtml() || '';
    }

    if (!S.availableJobs.length && !holdingQuestHtml) {
      container.innerHTML='<div style="grid-column:1/-1;font-size:.83rem;color:var(--muted2);padding:.75rem;text-align:center;">No missions available. Click \u201cGenerate Missions\u201d to post new missions.</div>';
      return;
    }
    container.innerHTML = holdingQuestHtml + S.availableJobs.map(function(job){
      var diff=DIFFICULTIES[job.difficulty]||DIFFICULTIES.easy, dc=dreadColor(diff.dread);
      return '<div class="shop-card" style="display:flex;flex-direction:column;">'
        +'<div class="s-name" style="color:var(--gold2);">'+job.title+'</div>'
        +'<div style="display:flex;gap:.35rem;align-items:center;font-family:\'Rajdhani\',sans-serif;font-size:.72rem;font-weight:700;margin:.15rem 0;">'
          +'<span style="color:'+dc+';text-transform:uppercase;">'+diff.name+'</span>'
          +'<span style="color:var(--muted2);">\u00B7</span>'
          +'<span style="font-family:\'Cinzel\',serif;font-size:.55rem;color:'+dc+';">DD d'+diff.dread+'</span>'
        +'</div>'
        +'<div style="font-size:.68rem;color:var(--teal);margin:.08rem 0;">'+(job.factionGainName||'Faction')+' +1 \u00B7 '+(job.factionLoseName||'Faction')+' -1</div>'
        +'<div style="font-size:.78rem;color:var(--muted3);flex:1;margin:.2rem 0;line-height:1.45;">'+job.location+'</div>'
        +'<div style="font-size:.68rem;color:var(--muted3);margin-bottom:.1rem;">'+(job.region==='sea'?'⛵ Sea Region':job.region==='galaxy'?'🌌 Galaxy':'🏕 Province')+'</div>'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.4rem;padding-top:.3rem;border-top:1px solid var(--border);">'
          +'<span style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:.95rem;color:var(--gold);">'+job.reward+' \u20B5</span>'
          +'<button class="btn btn-xs btn-primary" onclick="acceptJob('+job.id+')">Accept</button>'
        +'</div>'
      +'</div>';
    }).join('');
  }

  /* ── RENDER: ACTIVE MISSIONS ── */
  function renderMissionTracker() {
    var container=document.getElementById('missionTrackerContainer'); if (!container) return;
    ensureState();
    var holdingTrackerHtml = '';
    if (typeof window.getHoldingQuestTrackerCardHtml === 'function') {
      holdingTrackerHtml = window.getHoldingQuestTrackerCardHtml() || '';
    }
    if (!S.activeMissions.length && !holdingTrackerHtml) {
      container.innerHTML='<div style="font-size:.83rem;color:var(--muted2);padding:.3rem 0;">No active missions. Accept a mission from the board above.</div>';
      return;
    }
    container.innerHTML=holdingTrackerHtml + S.activeMissions.map(function(mission){
      var diff=DIFFICULTIES[mission.difficulty]||DIFFICULTIES.easy, dc=dreadColor(diff.dread);
      var s1=mission.steps[1],s2=mission.steps[2],s3=mission.steps[3];
      var stepLabels={1:'Gather Info',2:'Go to Site',3:'Confrontation'};
      var stepsHTML=[1,2,3].map(function(n){
        var step=mission.steps[n];
        var isActive=(n===1&&!s1.completed)||(n===2&&s1.completed&&!s2.completed)||(n===3&&s2.completed&&!s3.completed);
        var color=step.completed?'var(--green2)':isActive?'var(--teal)':'var(--border2)';
        var textCol=step.completed?'var(--muted2)':isActive?'var(--text)':'var(--muted)';
        var strike=step.completed?'text-decoration:line-through;':'';
        var marker=step.completed?(step.skipped?'\u2014':'\u2713'):String(n);
        return '<div style="display:flex;align-items:center;gap:.3rem;padding:.15rem .2rem;">'
          +'<div style="width:1.3rem;height:1.3rem;border-radius:50%;border:1.5px solid '+color+';display:flex;align-items:center;justify-content:center;font-size:.65rem;color:'+color+';flex-shrink:0;">'+marker+'</div>'
          +'<div style="font-size:.75rem;color:'+textCol+';'+strike+'">'+stepLabels[n]+(n===1?' <span style="color:var(--muted);font-size:.62rem;">[optional]</span>':'')+'</div>'
        +'</div>';
      }).join('');

      var badges='';
      if (mission.infoFeature) badges+='<span style="font-size:.62rem;color:var(--teal);background:rgba(46,196,182,.1);padding:.05rem .3rem;border:1px solid rgba(46,196,182,.25);margin-right:.25rem;">'+mission.infoFeature.icon+' '+mission.infoFeature.name+'</span>';
      if (mission.additionalDanger) { var dl=mission.additionalDanger.type==='mercenary'?'\u26a0 Mercenary':'\u26a0 '+mission.additionalDanger.data.name; badges+='<span style="font-size:.62rem;color:var(--red2);background:rgba(200,50,50,.1);padding:.05rem .3rem;border:1px solid rgba(200,50,50,.25);">'+dl+'</span>'; }
      if (mission.bonus) badges+='<span style="font-size:.62rem;color:var(--teal);margin-left:.15rem;">+5 bonus</span>';

      var btn1=s1.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Info</button>':'<button class="btn btn-xs btn-teal" onclick="startMissionStep1('+mission.id+')">\u25B6 Info</button><button class="btn btn-xs" onclick="skipMissionStep1('+mission.id+')" style="font-size:.62rem;">Skip</button>';
      var btn2=s2.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Site</button>':'<button class="btn btn-xs btn-teal" onclick="startMissionStep2('+mission.id+')"'+(!s1.completed?' disabled style="opacity:.45;"':'')+'>\u25B6 Site</button>';
      var btn3=s3.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Confront</button>':'<button class="btn btn-xs btn-primary" onclick="startMissionStep3('+mission.id+')"'+(!s2.completed?' disabled style="opacity:.45;"':'')+'>\u25B6 Confront</button>';

      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.6rem;margin-bottom:.5rem;">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;">'
          +'<div>'
            +'<div style="font-family:\'Cinzel\',serif;font-size:.8rem;color:var(--gold2);margin-bottom:.1rem;">'+mission.title+'</div>'
            +'<div style="font-size:.7rem;color:'+dc+';">'+diff.name+' \u00B7 DD d'+diff.dread+' \u00B7 '+mission.location+'</div>'
            +'<div style="font-size:.66rem;color:var(--teal);margin-top:.12rem;">'+(mission.factionGainName||'Faction')+' +1 \u00B7 '+(mission.factionLoseName||'Faction')+' -1</div>'
            +(badges?'<div style="margin-top:.2rem;">'+badges+'</div>':'')
          +'</div>'
          +'<button class="btn btn-xs btn-red" onclick="abandonMission('+mission.id+')">Abandon</button>'
        +'</div>'
        +'<div style="border:1px solid var(--border);padding:.2rem .3rem;margin-bottom:.3rem;">'+stepsHTML+'</div>'
        +'<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'+btn1+btn2+btn3+'</div>'
      +'</div>';
    }).join('');
  }

  /* ── RENDER: COMPLETED MISSIONS ── */
  function renderCompletedMissions() {
    var container=document.getElementById('completedMissionsContainer'); if (!container) return;
    ensureState();
    var recent=(S.completedMissions||[]).slice().reverse().slice(0,MAX_COMPLETED_MISSIONS);
    if (!recent.length) { container.innerHTML='<div style="font-size:.8rem;color:var(--muted2);">No completed missions yet.</div>'; return; }
    container.innerHTML=recent.map(function(mission){
      try {
        var diff=DIFFICULTIES[mission.difficulty]||DIFFICULTIES.easy;
        var diffName = mission.isHoldingQuest ? 'Special Quest' : diff.name;
        var outCol=mission.success?'var(--green2)':'var(--red2)';
        var outcome=mission.success?'\u2713 SUCCESS':'\u2717 FAILED';
        var dangerLabel='';
        if (mission.additionalDanger) {
          if (mission.additionalDanger.type === 'mercenary') {
            dangerLabel = 'Mercenary';
          } else if (mission.additionalDanger.data && mission.additionalDanger.data.name) {
            dangerLabel = mission.additionalDanger.data.name;
          } else if (mission.additionalDanger.name) {
            dangerLabel = mission.additionalDanger.name;
          }
        }
        var loot = Array.isArray(mission.loot) ? mission.loot : [];
        var reward = Number(mission.reward || 0);
        var factionLine = mission.success
          ? '<div style="font-size:.68rem;color:var(--teal);margin-top:.08rem;">'+(mission.factionGainName||'Faction')+' +1 \u00B7 '+(mission.factionLoseName||'Faction')+' -1</div>'
          : '';
        var lootLine=(mission.success&&loot.length)
          ?'<div style="font-size:.7rem;color:var(--gold2);margin-top:.1rem;">Loot: '+loot.join(', ')+' \u00B7 +'+reward+'\u20B5 \u00B7 +1 Renown</div>'
          :'<div style="font-size:.7rem;color:var(--red2);margin-top:.1rem;">\u22121 Renown</div>';
        var featureBits=[];
        if (mission.infoFeature && mission.infoFeature.icon && mission.infoFeature.name) {
          featureBits.push(mission.infoFeature.icon+' '+mission.infoFeature.name);
        }
        if (dangerLabel) {
          featureBits.push('\u26a0 '+dangerLabel);
        }
        var featureLine=featureBits.length?'<div style="font-size:.66rem;color:var(--muted2);margin-top:.05rem;">'+featureBits.join(' \u00B7 ')+'</div>':'';
        return '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid '+outCol+';padding:.4rem .5rem;margin-bottom:.3rem;">'
          +'<div style="font-family:\'Cinzel\',serif;font-size:.75rem;color:'+outCol+';margin-bottom:.08rem;">'+outcome+' \u2014 '+(mission.title || 'Unknown Mission')+'</div>'
          +'<div style="font-size:.68rem;color:var(--muted2);">'+diffName+' \u00B7 '+(mission.location || 'Unknown')+'</div>'
          +featureLine+factionLine+lootLine
        +'</div>';
      } catch (err) {
        return '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid var(--red2);padding:.4rem .5rem;margin-bottom:.3rem;">'
          +'<div style="font-family:\'Cinzel\',serif;font-size:.75rem;color:var(--red2);margin-bottom:.08rem;">Mission Record Unavailable</div>'
          +'<div style="font-size:.68rem;color:var(--muted2);">A completed mission entry had invalid data.</div>'
        +'</div>';
      }
    }).join('');
  }

  function syncMissionUIs() {
    ensureState();
    renderMissionBoard();
    renderMissionTracker();
    renderCompletedMissions();
  }

  document.addEventListener('DOMContentLoaded',function(){
    syncMissionUIs();
  });

  var _missionBaseLoad = typeof loadCharacter === 'function' ? loadCharacter : null;
  if (_missionBaseLoad) {
    loadCharacter = function() {
      _missionBaseLoad();
      syncMissionUIs();
    };
  }

  var _missionBaseClear = typeof clearCharacter === 'function' ? clearCharacter : null;
  if (_missionBaseClear) {
    clearCharacter = function() {
      _missionBaseClear();
      ensureState();
      syncMissionUIs();
    };
  }

  window.generateMissions=generateMissions; window.acceptJob=acceptJob; window.abandonMission=abandonMission;
  window.startMissionStep1=startMissionStep1; window.skipMissionStep1=skipMissionStep1; window.completeMissionInfoStep=completeMissionInfoStep;
  window.startMissionStep2=startMissionStep2; window.renderSiteModal=renderSiteModal; window.exploreRoom=exploreRoom;
  window.resolveRoomConfrontation=resolveRoomConfrontation; window.completeMissionSiteStep=completeMissionSiteStep;
  window.startMissionStep3=startMissionStep3; window.resolveMission=resolveMission;
  window.resolveMissionOutcome=resolveMissionOutcome;
  window.renderMissionBoard=renderMissionBoard; window.renderMissionTracker=renderMissionTracker; window.renderCompletedMissions=renderCompletedMissions;
  window.createMission=createMission;
  window.completeMissionStep=function(missionId,stepId){
    if(stepId===1) completeMissionInfoStep(missionId,true,JSON.stringify(rollInfoFeature()));
    else if(stepId===2) completeMissionSiteStep(missionId);
    else if(stepId===3) resolveMission(missionId,true);
  };
  window.rollForLoot=rollShopLoot; window.generateRandomJobs=generateMissions;

}());
