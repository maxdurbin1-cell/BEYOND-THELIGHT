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
  var DREAD_DICE = [4, 6, 8, 10, 12, 20];

  function isGMModeActive() {
    return !!(window.settingsSystem && typeof window.settingsSystem.isGMMode === 'function' && window.settingsSystem.isGMMode());
  }

  function shouldRevealDC() {
    if (!window.settingsSystem || typeof window.settingsSystem.shouldRevealDC !== 'function') return true;
    return !!window.settingsSystem.shouldRevealDC();
  }

  function shouldRevealHiddenInfo() {
    if (!window.settingsSystem || typeof window.settingsSystem.shouldRevealHiddenInfo !== 'function') return true;
    return !!window.settingsSystem.shouldRevealHiddenInfo();
  }

  function isMissionManualRollMode() {
    return !!(window.settingsSystem && typeof window.settingsSystem.isManualRollMode === 'function' && window.settingsSystem.isManualRollMode());
  }

  function stepMissionDreadDie(current, dir) {
    var die = Number(current || 8);
    var idx = DREAD_DICE.indexOf(die);
    if (idx < 0) idx = 2;
    var next = idx + (dir > 0 ? 1 : -1);
    if (next < 0) next = 0;
    if (next >= DREAD_DICE.length) next = DREAD_DICE.length - 1;
    return DREAD_DICE[next];
  }

  function stepMissionDreadDieBy(current, steps) {
    var out = Number(current || 8);
    var count = Math.max(0, Number(steps || 0));
    for (var i = 0; i < count; i++) out = stepMissionDreadDie(out, 1);
    return out;
  }

  function normalizeMissionDreadDie(value) {
    var raw = Math.max(4, Number(value || 4));
    var best = DREAD_DICE[0];
    var bestGap = Math.abs(best - raw);
    for (var i = 1; i < DREAD_DICE.length; i++) {
      var die = DREAD_DICE[i];
      var gap = Math.abs(die - raw);
      if (gap < bestGap) {
        best = die;
        bestGap = gap;
      }
    }
    return best;
  }

  function getLegacyRaidRoomCheckLine(roomType, dd) {
    var die = normalizeMissionDreadDie(dd);
    var type = String(roomType || '').toLowerCase();
    var stat = 'Adventure';
    if (type === 'lorereading' || type === 'puzzle') stat = 'Mind';
    else if (type === 'trap') stat = 'Control';
    else if (type === 'peril') stat = 'Spirit';
    else if (type === 'hazard' || type === 'approach') stat = 'Body';
    return stat + ' vs Dread d' + die;
  }

  var LOOT_COUNT_DIVISOR      = 6;
  var MAX_COMPLETED_MISSIONS  = 10;
  var MISSION_DEADLINE_DAYS   = 30;
  var _missionExpiryGuard      = false;
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

  var SITE_PUZZLE_SPECS = [
    { mode:'code', title:'Site Puzzle: Security Cipher', prompt:'The panel flashes ROUTE-KEY. Enter the reverse key phrase.', answer:'yek-etuor' },
    { mode:'rearrange', title:'Site Puzzle: Access Phrase', prompt:'Rebuild the phrase that unlocks the blast door.', bank:['OPEN','THE','INNER','GATE'], answer:'open the inner gate' },
    { mode:'memory', title:'Site Puzzle: Light Sequence', prompt:'Memorize then repeat the light sequence.', sequence:['RED','BLUE','GREEN','RED'], bank:['RED','BLUE','GREEN','WHITE'] }
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

  var MISSION_TEMPLATES = [
    { id:'standard',             label:'Standard Contract',   missionType:'standard',              stepNames:{1:'Gather Information',2:'Go to Site',3:'Confrontation'},     verbs:['Hunt','Retrieve','Rescue','Escort'] },
    { id:'diplomacy',            label:'Diplomacy',           missionType:'diplomacy',             stepNames:{1:'Secure Audience',2:'Negotiate Terms',3:'Broker Outcome'},   verbs:['Negotiate','Mediate','Appeal','Broker'] },
    { id:'survival',             label:'Survival Run',        missionType:'survival',              stepNames:{1:'Scout Conditions',2:'Endure Passage',3:'Extraction'},        verbs:['Survive','Endure','Recover','Traverse'] },
    { id:'mystery',              label:'Mystery',             missionType:'mystery',               stepNames:{1:'Collect Clues',2:'Follow Trail',3:'Reveal Truth'},           verbs:['Investigate','Trace','Decode','Unmask'] },
    { id:'infiltration',         label:'Infiltration',        missionType:'infiltration',          stepNames:{1:'Acquire Access',2:'Infiltrate Site',3:'Exfiltrate'},          verbs:['Infiltrate','Sabotage','Steal','Bypass'] },
    { id:'settlement',           label:'Settlement Support',  missionType:'settlement_management', stepNames:{1:'Assess Settlement',2:'Secure Supplies',3:'Stabilize Zone'},   verbs:['Rebuild','Supply','Stabilize','Fortify'] },
    { id:'escort_chain',         label:'Escort Chain',        missionType:'escort_chain',          stepNames:{1:'Prepare Convoy',2:'Escort Route',3:'Safe Delivery'},          verbs:['Escort','Guard','Deliver','Protect'] },
    { id:'faction_politics',     label:'Faction Politics',    missionType:'faction_politics',      stepNames:{1:'Map Allegiances',2:'Apply Leverage',3:'Settle Power Shift'}, verbs:['Leverage','Influence','Arbitrate','Pressure'] },
    { id:'soul_mission',         label:'Soul Mission',        missionType:'soul_mission',          stepNames:{1:'Track Soul Echo',2:'Breach the Hollow Site',3:'Take the Soul'}, verbs:['Track','Hunt','Purge','Sever'] }
  ];

  var SOUL_MISSION_BOSSES = ['The Hollow Saint', 'The Cinder Warden', 'The Bone Regent', 'The Echo Maw', 'The Pale Engine', 'The Wailing Herald', 'The Starved Oracle', 'The Ash Crown', 'The Gilded Parasite', 'The Grave Choir', 'The Rift Shepherd', 'The Blackened Throne'];
  var SOUL_MISSION_LOCS = ['Shattered Reliquary', 'Catacomb Blacksite', 'Fallen Temple Vault', 'Hollow Observatory', 'Cinder Crypt', 'Ruin Gate Sanctum', 'Ashen Ossuary', 'Silent Sepulcher', 'Warden Crypt', 'Echo Vault'];
  var SOUL_MISSION_ICONS = ['⚒'];

  var REGIONAL_ARC_TEMPLATES = {
    escalation: {
      id: 'escalation',
      label: 'Escalation Arc',
      steps: [
        { title: 'Escalation Arc I: Track Flashpoint', templateLabel: 'Arc Chain · Escalation I', missionType: 'arc_escalation', verbs: ['Investigate','Track','Expose'], stepNames: {1:'Trace Flashpoint',2:'Enter Pressure Zone',3:'Contain First Breach'}, reward: 60 },
        { title: 'Escalation Arc II: Break Supply Surge', templateLabel: 'Arc Chain · Escalation II', missionType: 'arc_escalation', verbs: ['Disrupt','Intercept','Contain'], stepNames: {1:'Map Surge Route',2:'Cut Supply Relay',3:'Hold Against Counterstrike'}, reward: 75 },
        { title: 'Escalation Arc III: Decide Regional Outcome', templateLabel: 'Arc Chain · Escalation III', missionType: 'arc_escalation', verbs: ['Stabilize','Purge','Reclaim'], stepNames: {1:'Pick Doctrine',2:'Execute Regional Push',3:'Lock New Order'}, reward: 95 }
      ]
    },
    reconciliation: {
      id: 'reconciliation',
      label: 'Reconciliation Arc',
      steps: [
        { title: 'Reconciliation Arc I: Broker Initial Truce', templateLabel: 'Arc Chain · Reconciliation I', missionType: 'arc_reconciliation', verbs: ['Negotiate','Mediate','Broker'], stepNames: {1:'Secure Delegates',2:'Open Neutral Ground',3:'Draft Truce Terms'}, reward: 55 },
        { title: 'Reconciliation Arc II: Prove Mutual Good Faith', templateLabel: 'Arc Chain · Reconciliation II', missionType: 'arc_reconciliation', verbs: ['Deliver','Protect','Escort'], stepNames: {1:'Deliver Guarantees',2:'Protect Convoy',3:'Confirm Exchanges'}, reward: 70 },
        { title: 'Reconciliation Arc III: Ratify Compact', templateLabel: 'Arc Chain · Reconciliation III', missionType: 'arc_reconciliation', verbs: ['Ratify','Stabilize','Rebuild'], stepNames: {1:'Assemble Signatories',2:'Defend Summit',3:'Seal Compact'}, reward: 90 }
      ]
    },
    occupation: {
      id: 'occupation',
      label: 'Occupation Arc',
      steps: [
        { title: 'Occupation Arc I: Survey Occupied Zone', templateLabel: 'Arc Chain · Occupation I', missionType: 'arc_occupation', verbs: ['Survey','Infiltrate','Observe'], stepNames: {1:'Map Occupier Pattern',2:'Probe Checkpoints',3:'Exfiltrate Findings'}, reward: 60 },
        { title: 'Occupation Arc II: Crack Control Grid', templateLabel: 'Arc Chain · Occupation II', missionType: 'arc_occupation', verbs: ['Sabotage','Resist','Bypass'], stepNames: {1:'Disable Grid Nodes',2:'Evade Sweep Teams',3:'Open Civil Corridor'}, reward: 80 },
        { title: 'Occupation Arc III: Force Withdrawal Terms', templateLabel: 'Arc Chain · Occupation III', missionType: 'arc_occupation', verbs: ['Pressure','Liberate','Secure'], stepNames: {1:'Assemble Local Cells',2:'Break Occupier Strongpoint',3:'Set Withdrawal Terms'}, reward: 100 }
      ]
    },
    collapse: {
      id: 'collapse',
      label: 'Collapse Arc',
      steps: [
        { title: 'Collapse Arc I: Identify Failing Systems', templateLabel: 'Arc Chain · Collapse I', missionType: 'arc_collapse', verbs: ['Diagnose','Trace','Survey'], stepNames: {1:'Read Failure Signals',2:'Tag Critical Nodes',3:'Prioritize Rescue'}, reward: 55 },
        { title: 'Collapse Arc II: Prevent Cascading Failure', templateLabel: 'Arc Chain · Collapse II', missionType: 'arc_collapse', verbs: ['Repair','Stabilize','Defend'], stepNames: {1:'Secure Repair Team',2:'Protect Infrastructure',3:'Reboot Core Path'}, reward: 75 },
        { title: 'Collapse Arc III: Rebuild Command Spine', templateLabel: 'Arc Chain · Collapse III', missionType: 'arc_collapse', verbs: ['Rebuild','Fortify','Recover'], stepNames: {1:'Draft Recovery Plan',2:'Deploy Regional Teams',3:'Anchor Governance Backbone'}, reward: 95 }
      ]
    },
    reconstruction: {
      id: 'reconstruction',
      label: 'Reconstruction Arc',
      steps: [
        { title: 'Reconstruction Arc I: Audit What Survived', templateLabel: 'Arc Chain · Reconstruction I', missionType: 'arc_reconstruction', verbs: ['Audit','Assess','Recover'], stepNames: {1:'Catalog Assets',2:'Verify Civil Capacity',3:'Set Recovery Targets'}, reward: 55 },
        { title: 'Reconstruction Arc II: Restore Core Services', templateLabel: 'Arc Chain · Reconstruction II', missionType: 'arc_reconstruction', verbs: ['Restore','Supply','Rebuild'], stepNames: {1:'Reopen Route Pair',2:'Deliver Civic Cargo',3:'Activate Local Services'}, reward: 75 },
        { title: 'Reconstruction Arc III: Seed Long-Term Stability', templateLabel: 'Arc Chain · Reconstruction III', missionType: 'arc_reconstruction', verbs: ['Stabilize','Institutionalize','Secure'], stepNames: {1:'Install Regional Custodians',2:'Negotiate Last Blockers',3:'Ratify Recovery Charter'}, reward: 95 }
      ]
    }
  };

  function ensureMissionDirectorState() {
    ensureState();
    S.missionDirector = S.missionDirector || {};
    if (!S.missionDirector.arcState || typeof S.missionDirector.arcState !== 'object') {
      S.missionDirector.arcState = {
        activeArcId: '',
        stageIndex: 0,
        momentum: 0,
        history: []
      };
    }
    if (!Array.isArray(S.missionDirector.arcState.history)) S.missionDirector.arcState.history = [];
    return S.missionDirector.arcState;
  }

  function shouldOfferSoulMission() {
    ensureState();
    var renown = Math.max(0, Number(S.renown || 0));
    var completed = Array.isArray(S.completedMissions) ? S.completedMissions.length : 0;
    var raidProfile = null;
    try {
      if (typeof ensureLegacyRaidProfile === 'function') raidProfile = ensureLegacyRaidProfile();
    } catch (_err) {
      raidProfile = null;
    }
    var raidPower = raidProfile ? (Number(raidProfile.raidMedals || 0) + Number(raidProfile.raidPoints || 0)) : 0;
    return renown >= 6 || completed >= 8 || raidPower >= 1;
  }

  function isStorylinePostEnding() {
    ensureState();
    var story = S.storyline || {};
    var sceneId = String(story.sceneId || '');
    return sceneId.indexOf('ending_') === 0;
  }

  function ensureEndgameDirectorState() {
    ensureState();
    S.missionDirector = S.missionDirector || {};
    if (!S.missionDirector.endgame || typeof S.missionDirector.endgame !== 'object') {
      S.missionDirector.endgame = {
        colosseum: { lastRollDayStamp: -1, nextEligibleDayStamp: 0, counter: 0 },
        gateWar: {
          lastRollDayStamp: -1,
          nextEligibleDayStamp: 0,
          counter: 0,
          closedHellscape: 0,
          closedCelestial: 0,
          pinnacleUnlocked: false,
          pinnacleBoss: ''
        }
      };
    }
    if (!S.missionDirector.endgame.colosseum || typeof S.missionDirector.endgame.colosseum !== 'object') {
      S.missionDirector.endgame.colosseum = { lastRollDayStamp: -1, nextEligibleDayStamp: 0, counter: 0, history: [], bestClearDie: 0, clears: 0 };
    }
    if (!S.missionDirector.endgame.gateWar || typeof S.missionDirector.endgame.gateWar !== 'object') {
      S.missionDirector.endgame.gateWar = {
        lastRollDayStamp: -1,
        nextEligibleDayStamp: 0,
        counter: 0,
        closedHellscape: 0,
        closedCelestial: 0,
        pinnacleUnlocked: false,
        pinnacleBoss: '',
        pinnacleRetries: 0,
        kickoutPending: false,
        pinnacleCleared: false,
        lastKickoutAt: '',
        portalAttempts: 0
      };
    }
    if (!Array.isArray(S.missionDirector.endgame.colosseum.history)) S.missionDirector.endgame.colosseum.history = [];
    if (typeof S.missionDirector.endgame.colosseum.bestClearDie !== 'number') S.missionDirector.endgame.colosseum.bestClearDie = 0;
    if (typeof S.missionDirector.endgame.colosseum.clears !== 'number') S.missionDirector.endgame.colosseum.clears = 0;
    if (typeof S.missionDirector.endgame.gateWar.pinnacleRetries !== 'number') S.missionDirector.endgame.gateWar.pinnacleRetries = 0;
    if (typeof S.missionDirector.endgame.gateWar.kickoutPending !== 'boolean') S.missionDirector.endgame.gateWar.kickoutPending = false;
    if (typeof S.missionDirector.endgame.gateWar.pinnacleCleared !== 'boolean') S.missionDirector.endgame.gateWar.pinnacleCleared = false;
    if (typeof S.missionDirector.endgame.gateWar.lastKickoutAt !== 'string') S.missionDirector.endgame.gateWar.lastKickoutAt = '';
    if (typeof S.missionDirector.endgame.gateWar.portalAttempts !== 'number') S.missionDirector.endgame.gateWar.portalAttempts = 0;
    return S.missionDirector.endgame;
  }

  function getEndgamePortalMissionActive() {
    if (!Array.isArray(S.activeMissions)) return false;
    return S.activeMissions.some(function (mission) {
      return mission && mission.missionType === 'pinnacle_megadungeon' && mission.steps && mission.steps[3] && !mission.steps[3].completed;
    });
  }

  function canShowEndgameDebugControls() {
    try {
      if (typeof window === 'undefined' || !window.campaignSystem || typeof window.campaignSystem.getState !== 'function') return true;
      var state = window.campaignSystem.getState() || {};
      if (state && state.code && String(state.role || '') !== 'gm') return false;
      return true;
    } catch (_err) {
      return true;
    }
  }

  function removeActivePinnacleMissionsForDebug() {
    if (!Array.isArray(S.activeMissions)) return 0;
    var removed = 0;
    for (var i = S.activeMissions.length - 1; i >= 0; i--) {
      var mission = S.activeMissions[i];
      if (!mission || mission.missionType !== 'pinnacle_megadungeon') continue;
      try { removeMissionToken(mission); } catch (_err) {}
      S.activeMissions.splice(i, 1);
      removed += 1;
    }
    return removed;
  }

  function endgameDebugAdjustGates(hellDelta, celestialDelta) {
    ensureState();
    var endgame = ensureEndgameDirectorState();
    var gate = endgame.gateWar;
    gate.closedHellscape = Math.max(0, Math.min(10, Number(gate.closedHellscape || 0) + Number(hellDelta || 0)));
    gate.closedCelestial = Math.max(0, Math.min(10, Number(gate.closedCelestial || 0) + Number(celestialDelta || 0)));
    if (gate.closedHellscape < 10 && gate.closedCelestial < 10) {
      gate.pinnacleUnlocked = false;
      gate.pinnacleBoss = '';
    }
    if ((gate.closedHellscape >= 10 || gate.closedCelestial >= 10) && !gate.pinnacleUnlocked) {
      maybeUnlockPinnacleMegadungeonFromGateWar(gate, gate.closedCelestial >= 10 ? 'celestial' : 'hellscape');
    }
    renderMissionTracker();
    if (typeof showNotif === 'function') showNotif('Endgame debug: gate counters updated.', 'info');
    return true;
  }

  function endgameDebugSetPortalState(mode) {
    ensureState();
    var endgame = ensureEndgameDirectorState();
    var gate = endgame.gateWar;
    var key = String(mode || '').toLowerCase();
    if (key === 'ready') {
      gate.closedHellscape = 10;
      gate.closedCelestial = 0;
      gate.pinnacleCleared = false;
      gate.kickoutPending = false;
      if (!gate.pinnacleUnlocked) maybeUnlockPinnacleMegadungeonFromGateWar(gate, 'hellscape');
    } else if (key === 'kickout') {
      removeActivePinnacleMissionsForDebug();
      gate.pinnacleRetries = Math.max(0, Number(gate.pinnacleRetries || 0) + 1);
      gate.kickoutPending = true;
      gate.pinnacleUnlocked = false;
      gate.pinnacleBoss = '';
      gate.closedHellscape = 0;
      gate.closedCelestial = 0;
      gate.pinnacleCleared = false;
      gate.lastKickoutAt = new Date().toISOString();
    } else if (key === 'clear') {
      gate.closedHellscape = 0;
      gate.closedCelestial = 10;
      gate.pinnacleUnlocked = true;
      if (!gate.pinnacleBoss) gate.pinnacleBoss = 'Azrael';
      gate.pinnacleCleared = true;
      gate.kickoutPending = false;
    } else if (key === 'reset') {
      removeActivePinnacleMissionsForDebug();
      gate.closedHellscape = 0;
      gate.closedCelestial = 0;
      gate.pinnacleUnlocked = false;
      gate.pinnacleBoss = '';
      gate.pinnacleRetries = 0;
      gate.kickoutPending = false;
      gate.pinnacleCleared = false;
      gate.lastKickoutAt = '';
      gate.portalAttempts = 0;
    }
    renderMissionTracker();
    if (typeof showNotif === 'function') showNotif('Endgame debug: portal state set to ' + key + '.', 'info');
    return true;
  }

  function endgameDebugAddColosseumRecord(tierDie, success) {
    ensureState();
    var col = ensureEndgameDirectorState().colosseum;
    var die = Math.max(4, Number(tierDie || 4));
    var ok = !!success;
    if (ok) {
      col.clears = Math.max(0, Number(col.clears || 0) + 1);
      col.bestClearDie = Math.max(Number(col.bestClearDie || 0), die);
    }
    col.history.unshift({ at: new Date().toISOString(), tierDie: die, enemy: 'Debug Arena Echo', success: ok });
    col.history = col.history.slice(0, 12);
    renderMissionTracker();
    if (typeof showNotif === 'function') showNotif('Endgame debug: colosseum record added (d' + die + ', ' + (ok ? 'success' : 'fail') + ').', 'info');
    return true;
  }

  function endgameDebugResetColosseum() {
    ensureState();
    var col = ensureEndgameDirectorState().colosseum;
    col.history = [];
    col.bestClearDie = 0;
    col.clears = 0;
    renderMissionTracker();
    if (typeof showNotif === 'function') showNotif('Endgame debug: colosseum history reset.', 'info');
    return true;
  }

  function buildEndgameTrackerCardHtml() {
    var postStory = isStorylinePostEnding();
    var endgame = ensureEndgameDirectorState();
    var col = endgame.colosseum || { history: [], bestClearDie: 0, clears: 0 };
    var gate = endgame.gateWar || { closedHellscape: 0, closedCelestial: 0, pinnacleUnlocked: false, pinnacleBoss: '', pinnacleRetries: 0, kickoutPending: false, pinnacleCleared: false, lastKickoutAt: '', portalAttempts: 0 };
    var touched = Number(col.counter || 0) > 0 || Number(gate.counter || 0) > 0 || Number(gate.closedHellscape || 0) > 0 || Number(gate.closedCelestial || 0) > 0 || Number(gate.pinnacleRetries || 0) > 0 || !!gate.pinnacleUnlocked;
    if (!postStory && !touched) return '';

    var hClosed = Math.max(0, Number(gate.closedHellscape || 0));
    var cClosed = Math.max(0, Number(gate.closedCelestial || 0));
    var portalProgress = Math.min(100, Math.floor((Math.max(Math.min(10, hClosed), Math.min(10, cClosed)) / 10) * 100));
    var activePortal = getEndgamePortalMissionActive();
    var portalReady = hClosed >= 10 || cClosed >= 10;
    var portalStatus = gate.pinnacleCleared
      ? 'Cleared'
      : (activePortal ? 'Active' : (portalReady || gate.pinnacleUnlocked ? 'Ready' : 'Locked'));
    var retryText = gate.kickoutPending
      ? ('Kickout pending reset • retries: ' + Number(gate.pinnacleRetries || 0))
      : ('Retries: ' + Number(gate.pinnacleRetries || 0));
    var bestDie = Math.max(0, Number(col.bestClearDie || 0));
    var history = Array.isArray(col.history) ? col.history.slice(0, 4) : [];
    var historyHtml = history.length
      ? history.map(function (entry) {
          var ok = !!entry.success;
          return '<div style="font-size:.68rem;color:' + (ok ? 'var(--green2)' : 'var(--red2)') + ';line-height:1.4;">'
            + (ok ? '✓ ' : '✗ ') + 'd' + Number(entry.tierDie || 4) + ' · ' + String(entry.enemy || 'Arena Enemy')
          + '</div>';
        }).join('')
      : '<div style="font-size:.68rem;color:var(--muted2);line-height:1.4;">No colosseum records yet.</div>';
    var debugHtml = canShowEndgameDebugControls()
      ? '<div style="margin-top:.35rem;border-top:1px solid var(--border2);padding-top:.28rem;">'
        + '<div style="font-size:.65rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.16rem;">GM Debug Controls</div>'
        + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAdjustGates(1,0)">+1 Hell</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAdjustGates(0,1)">+1 Celestial</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAdjustGates(-1,0)">-1 Hell</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAdjustGates(0,-1)">-1 Celestial</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugSetPortalState(\'ready\')">Portal Ready</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugSetPortalState(\'kickout\')">Sim Kickout</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugSetPortalState(\'clear\')">Mark Cleared</button>'
          + '<button class="btn btn-xs btn-red" onclick="window.endgameDebugSetPortalState(\'reset\')">Reset Portal</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAddColosseumRecord(20,true)">Add d20 Clear</button>'
          + '<button class="btn btn-xs" onclick="window.endgameDebugAddColosseumRecord(12,false)">Add d12 Fail</button>'
          + '<button class="btn btn-xs btn-red" onclick="window.endgameDebugResetColosseum()">Reset Colosseum</button>'
        + '</div>'
      + '</div>'
      : '';

    return '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid var(--gold2);padding:.55rem .6rem;margin-bottom:.5rem;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.74rem;color:var(--gold2);margin-bottom:.15rem;">Endgame Operations</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.24rem;">'
      + (postStory ? 'Storyline complete. Endgame systems active.' : 'Endgame systems discovered before final storyline lock.')
      + '</div>'

      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.4rem;align-items:start;">'
      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);">'
      + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Gate Closures</div>'
      + '<div style="font-size:.68rem;color:var(--text2);line-height:1.45;">Hellscape: <strong style="color:var(--red2);">' + hClosed + '/10</strong> · Celestial: <strong style="color:var(--gold2);">' + cClosed + '/10</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.12rem;">Portal readiness (best side): ' + portalProgress + '%</div>'
      + '</div>'

      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);">'
      + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Colosseum Record</div>'
      + '<div style="font-size:.68rem;color:var(--text2);line-height:1.45;">Best clear: <strong style="color:var(--gold2);">' + (bestDie ? ('d' + bestDie) : 'none') + '</strong> · Total clears: <strong style="color:var(--teal);">' + Number(col.clears || 0) + '</strong></div>'
      + '<div style="margin-top:.12rem;">' + historyHtml + '</div>'
      + '</div>'

      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);">'
      + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Pinnacle Portal</div>'
      + '<div style="font-size:.68rem;color:var(--text2);line-height:1.45;">Status: <strong style="color:' + (portalStatus === 'Cleared' ? 'var(--green2)' : (portalStatus === 'Ready' || portalStatus === 'Active' ? 'var(--gold2)' : 'var(--muted2)')) + ';">' + portalStatus + '</strong>' + (gate.pinnacleBoss ? (' · Boss: ' + gate.pinnacleBoss) : '') + '</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.12rem;line-height:1.4;">' + retryText + (gate.lastKickoutAt ? (' · last: ' + gate.lastKickoutAt.slice(0, 10)) : '') + '</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.08rem;line-height:1.4;">Attempts: ' + Number(gate.portalAttempts || 0) + ' · Rule: fail/death kicks you out and resets gate closures.</div>'
      + '</div>'
      + '</div>'
      + debugHtml
    + '</div>';
  }

  function renderEndgameTabPanel() {
    var container = document.getElementById('endgameTrackerTabContainer');
    if (!container) return;
    ensureState();
    var endgame = ensureEndgameDirectorState();
    var col = endgame.colosseum || { clears: 0, bestClearDie: 0 };
    var gate = endgame.gateWar || { closedHellscape: 0, closedCelestial: 0, pinnacleUnlocked: false, pinnacleCleared: false };
    var crucible = (S.holding && S.holding.crucible) ? S.holding.crucible : { wins: 0, losses: 0, bestWinStreak: 0, currentWinStreak: 0 };
    var soulForge = (typeof ensureSoulForgeState === 'function')
      ? ensureSoulForgeState()
      : (S.soulForge = S.soulForge || { unlocked: false, inventory: [] });
    if (!Array.isArray(soulForge.inventory)) soulForge.inventory = [];

    var soulActive = Array.isArray(S.activeMissions)
      ? S.activeMissions.filter(function (mission) {
          return mission && mission.missionType === 'soul_mission' && mission.steps && mission.steps[3] && !mission.steps[3].completed;
        }).length
      : 0;

    var topSummary = '<div style="margin-bottom:.45rem;font-size:.74rem;color:var(--muted2);line-height:1.45;">'
      + 'Track all endgame progression here: Crucible 6v6, Gate War seals, Colosseum clears, and Soul Forge hunts.'
      + '</div>';

    var grid = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.42rem;margin-bottom:.5rem;">'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.4rem .45rem;">'
        + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Crucible 6v6</div>'
        + '<div style="font-size:.7rem;color:var(--text2);line-height:1.45;">Wins: <strong style="color:var(--green2);">' + Number(crucible.wins || 0) + '</strong> · Losses: <strong style="color:var(--red2);">' + Number(crucible.losses || 0) + '</strong></div>'
        + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.1rem;">Best streak: ' + Number(crucible.bestWinStreak || 0) + ' · Current: ' + Number(crucible.currentWinStreak || 0) + '</div>'
      + '</div>'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.4rem .45rem;">'
        + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Gate War</div>'
        + '<div style="font-size:.7rem;color:var(--text2);line-height:1.45;">Hellscape seals: <strong style="color:var(--red2);">' + Number(gate.closedHellscape || 0) + '/10</strong></div>'
        + '<div style="font-size:.7rem;color:var(--text2);line-height:1.45;">Celestial seals: <strong style="color:var(--gold2);">' + Number(gate.closedCelestial || 0) + '/10</strong></div>'
      + '</div>'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.4rem .45rem;">'
        + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Colosseum</div>'
        + '<div style="font-size:.7rem;color:var(--text2);line-height:1.45;">Clears: <strong style="color:var(--gold2);">' + Number(col.clears || 0) + '</strong></div>'
        + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.1rem;">Best clear die: ' + (Number(col.bestClearDie || 0) > 0 ? ('d' + Number(col.bestClearDie || 0)) : 'none') + '</div>'
      + '</div>'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.4rem .45rem;">'
        + '<div style="font-size:.69rem;color:var(--teal);margin-bottom:.12rem;">Soul Forge</div>'
        + '<div style="font-size:.7rem;color:var(--text2);line-height:1.45;">Forge: <strong style="color:' + (soulForge.unlocked ? 'var(--green2)' : 'var(--muted2)') + ';">' + (soulForge.unlocked ? 'Unlocked' : 'Locked') + '</strong></div>'
        + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.1rem;">Affixes stored: ' + soulForge.inventory.length + ' · Active hunts: ' + soulActive + '</div>'
      + '</div>'
    + '</div>';

    var operationsCard = buildEndgameTrackerCardHtml() || '<div style="background:var(--surface);border:1px solid var(--border2);padding:.55rem .6rem;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.74rem;color:var(--gold2);margin-bottom:.15rem;">Endgame Operations</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);line-height:1.45;">No endgame progression recorded yet. Defeat endgame encounters to populate this board.</div>'
    + '</div>';

    container.innerHTML = topSummary + grid + operationsCard;
  }

  function spawnRandomSoulForgeMissionEvent(seedHint, force) {
    ensureState();
    var isForced = !!force;
    if (!isForced && !shouldOfferSoulMission()) return null;
    if (Array.isArray(S.activeMissions) && S.activeMissions.some(function (mission) {
      return mission && mission.missionType === 'soul_mission' && mission.steps && mission.steps[3] && !mission.steps[3].completed;
    })) return null;

    S.missionDirector = S.missionDirector || {};
    if (!S.missionDirector.soulForgeSpawner || typeof S.missionDirector.soulForgeSpawner !== 'object') {
      S.missionDirector.soulForgeSpawner = {
        lastRollDayStamp: -1,
        nextEligibleDayStamp: 0,
        counter: 0
      };
    }

    var spawner = S.missionDirector.soulForgeSpawner;
    var dayStamp = getCurrentGameDayStamp();
    if (!isForced && dayStamp <= Number(spawner.lastRollDayStamp || -1)) return null;
    spawner.lastRollDayStamp = dayStamp;
    if (!isForced && dayStamp < Number(spawner.nextEligibleDayStamp || 0)) return null;

    var seed = Number(seedHint || 0) + dayStamp + (Number(spawner.counter || 0) * 37) + (Math.max(0, Number(S.renown || 0)) * 11);
    var chanceRoll = Math.abs(seed) % 100;
    if (!isForced && chanceRoll > 65) return null;

    var boss = SOUL_MISSION_BOSSES[Math.abs(seed + 29) % SOUL_MISSION_BOSSES.length] || 'The Hollow Saint';
    var soulIcon = SOUL_MISSION_ICONS[Math.abs(seed + 17) % SOUL_MISSION_ICONS.length] || '⚒';
    var regionPool = getAvailableMissionRegions();
    var soulRegionPool = regionPool.filter(function (entry) {
      var key = String(entry || '').toLowerCase();
      return key === 'province' || key === 'sea';
    });
    var regionSource = soulRegionPool.length ? soulRegionPool : regionPool;
    var region = regionSource[Math.abs(seed + 13) % Math.max(1, regionSource.length)] || 'province';
    var planetTarget = region === 'galaxy' ? getGalaxyPlanetMissionTarget() : null;
    var location = planetTarget ? planetTarget.location : getMissionLocationForRegion(region);
    var conflict = pickFactionConflict(getMissionConsequenceBias());
    var mission = createMission(
      'Soul Echo',
      'Soul Mission: ' + boss,
      'very_hard',
      location,
      region,
      {
        gain: conflict.gain,
        lose: conflict.lose,
        gainName: conflict.gainName,
        loseName: conflict.loseName
      },
      {
        missionType: 'soul_mission',
        templateId: 'soul_mission',
        templateLabel: 'Soul Mission',
        stepNames: { 1: 'Track Soul Echo', 2: 'Breach the Hollow Site', 3: 'Take the Soul' },
        lore: 'Endgame hunt for ' + boss + '. Taking its soul unlocks the Soul Forge.',
        soulBoss: boss,
        soulIcon: soulIcon,
        soulMission: true,
        planetHexId: planetTarget ? planetTarget.planetHexId : null,
        planetName: planetTarget ? planetTarget.planetName : ''
      }
    );
    if (!mission) return null;

    spawner.counter = Number(spawner.counter || 0) + 1;
    spawner.nextEligibleDayStamp = dayStamp + 1;
    if (typeof showNotif === 'function') {
      var regionLabelMap = {
        province: 'Province Map',
        sea: 'Sea Region',
        galaxy: 'Galaxy Routes',
        planet: 'Planet Surface',
        wtw: 'World That Was'
      };
      var missionRegion = String(mission.region || region || 'province').toLowerCase();
      var missionRegionLabel = regionLabelMap[missionRegion] || missionRegion;
      var missionSite = String(mission.location || location || 'Unknown location');
      showNotif('Soul Forge mission detected: ' + mission.title + ' at ' + missionSite + ' (' + missionRegionLabel + ').', 'warn');
    }
    recordMissionConsequence({
      system: 'missions',
      title: 'Soul mission surfaced',
      detail: String(mission.title || 'Soul Mission') + ' in ' + String(region || 'province') + '.',
      region: String(region || 'province'),
      locationKey: getMissionLocationKey(mission),
      severity: 'medium',
      deltas: { rumor: 1, witness: 1, factionHeat: 1 },
      tags: ['soul-mission', 'endgame', 'mission-spawn']
    });
    return mission;
  }

  function spawnRandomColosseumMissionEvent(seedHint, force) {
    ensureState();
    if (!isStorylinePostEnding() && !force) return null;
    if (Array.isArray(S.activeMissions) && S.activeMissions.some(function (mission) {
      return mission && mission.missionType === 'colosseum_endless' && mission.steps && mission.steps[3] && !mission.steps[3].completed;
    })) return null;

    var endgame = ensureEndgameDirectorState();
    var state = endgame.colosseum;
    var dayStamp = getCurrentGameDayStamp();
    var isForced = !!force;
    if (!isForced && dayStamp <= Number(state.lastRollDayStamp || -1)) return null;
    state.lastRollDayStamp = dayStamp;
    if (!isForced && dayStamp < Number(state.nextEligibleDayStamp || 0)) return null;

    var seed = Number(seedHint || 0) + dayStamp + (Number(state.counter || 0) * 43);
    if (!isForced && (Math.abs(seed) % 100) > 30) return null;

    var tiers = [4, 6, 8, 10, 12, 20];
    var tierDie = tiers[Math.abs(seed + 7) % tiers.length] || 4;
    var difficultyByDie = { 4: 'easy', 6: 'medium', 8: 'hard', 10: 'hard', 12: 'very_hard', 20: 'impossible' };
    var rankByDie = { 4: 'Easy', 6: 'Rising', 8: 'Veteran', 10: 'Brutal', 12: 'Apex', 20: 'Mythic' };
    var enemyNames = ['Saltbrand Duelist', 'Abyss Marauder', 'Iron Harpoon Saint', 'Red Wake Matron', 'Oathless Leviathan', 'Mirror Gladiator'];
    var enemySkills = ['Riptide Lunge', 'Crowdbreaker Shout', 'Bloodwake Parry', 'Abyssal Coil', 'Tideglass Counter', 'Bone Arena Sigil'];
    var rewardAffixes = ['Stormbound', 'Sea-Reaver', 'Lionheart', 'Kingsbane', 'Astral', 'Relentless', 'Ruinforged'];
    var enemyName = enemyNames[Math.abs(seed + 19) % enemyNames.length] || 'Arena Champion';
    var enemySkill = enemySkills[Math.abs(seed + 31) % enemySkills.length] || 'Arena Technique';
    var affix = rewardAffixes[Math.abs(seed + 47) % rewardAffixes.length] || 'Stormbound';
    var uniqueReward = rankByDie[tierDie] + ' Colosseum Relic of ' + affix;
    var regionPool = getAvailableMissionRegions();
    var region = regionPool.indexOf('sea') >= 0 ? 'sea' : (regionPool[Math.abs(seed + 13) % Math.max(1, regionPool.length)] || 'province');

    var mission = createMission(
      'Arena Herald',
      'Colosseum Trial [' + rankByDie[tierDie] + '] - d' + tierDie + ' Enemy',
      difficultyByDie[tierDie] || 'hard',
      'Endless Sea Colosseum Ring',
      region,
      { gain: 'military', lose: 'underworld', gainName: 'Military Orders', loseName: 'The Underworld' },
      {
        missionType: 'colosseum_endless',
        templateId: 'colosseum_endless',
        templateLabel: 'Endgame · Colosseum',
        stepNames: { 1: 'Accept Arena Contract', 2: 'Survive Wave Bracket', 3: 'Defeat Arena Champion' },
        checkpoints: [
          'Bracket tier starts at d' + tierDie + '.',
          enemyName + ' enters with signature move: ' + enemySkill + '.',
          'Claim unique reward: ' + uniqueReward + '.'
        ],
        lore: 'Endless mode escalation in the sea colosseum. Enemy tier: d' + tierDie + '. Champion: ' + enemyName + ' (' + enemySkill + ').'
      }
    );
    if (!mission) return null;

    mission.colosseumTierDie = tierDie;
    mission.colosseumEnemyName = enemyName;
    mission.colosseumEnemySkill = enemySkill;
    mission.colosseumUniqueReward = uniqueReward;
    state.counter = Number(state.counter || 0) + 1;
    state.nextEligibleDayStamp = dayStamp + 3;
    if (typeof showNotif === 'function') showNotif('Endgame signal: Colosseum Trial posted in the Endless Sea.', 'warn');
    return mission;
  }

  function getSeaColosseumTierDie() {
    var endgame = ensureEndgameDirectorState();
    var col = endgame.colosseum || { clears: 0, bestClearDie: 0 };
    var clears = Math.max(0, Number(col.clears || 0));
    var best = Math.max(0, Number(col.bestClearDie || 0));
    if (best >= 20 || clears >= 12) return 20;
    if (best >= 12 || clears >= 8) return 12;
    if (best >= 10 || clears >= 5) return 10;
    if (best >= 8 || clears >= 3) return 8;
    return 6;
  }

  function openSeaColosseumFromHex(hexKey) {
    ensureState();
    if (!S.lastSea || !Array.isArray(S.lastSea.map) || !S.lastSea.map.length) return null;

    if (typeof window.openSeaColosseumArena === 'function') {
      try {
        window.openSeaColosseumArena('challenge', String(hexKey || ''));
      } catch (_arenaErr) {}
    }

    var dayStamp = getCurrentGameDayStamp();
    var seed = Number(dayStamp || 0) + Number(Date.now() % 100000);
    var mission = spawnRandomColosseumMissionEvent(seed, true);
    if (!mission) {
      mission = Array.isArray(S.activeMissions)
        ? S.activeMissions.find(function (m) {
            return m && m.missionType === 'colosseum_endless' && m.steps && m.steps[3] && !m.steps[3].completed;
          })
        : null;
    }

    if (mission && S.lastSea && S.lastSea.missionTokens && hexKey) {
      var key = String(hexKey || '');
      mission.region = 'sea';
      mission.seaSiteKey = key;
      S.lastSea.missionTokens[key] = {
        missionId: mission.id,
        title: mission.title || 'Colosseum Trial',
        type: 'site',
        missionType: mission.missionType || 'colosseum_endless'
      };
      if (typeof renderLastSeaMap === 'function') {
        try { renderLastSeaMap(); } catch (_seaMapErr) {}
      }
    }

    if (typeof switchTab === 'function') {
      var btn = document.querySelector(".tab-btn[onclick*=\"switchTab('missions'\"]");
      switchTab('missions', btn || null);
    }
    if (typeof showNotif === 'function') {
      showNotif('Colosseum contract routed through this sea hex.', 'good');
    }
    return mission;
  }

  function resolveSeaColosseumBout(hexKey) {
    ensureState();
    var tierDie = getSeaColosseumTierDie();
    var actionDie = Math.max(4, Number((S && S.adventure) || 6));
    var a = (typeof explodingRoll === 'function') ? explodingRoll(actionDie) : { total: roll(actionDie), exploded: false };
    var d = (typeof explodingRoll === 'function') ? explodingRoll(tierDie) : { total: roll(tierDie), exploded: false };
    var success = Number(a.total || 0) >= Number(d.total || 0);
    var endgame = ensureEndgameDirectorState();
    var col = endgame.colosseum;

    var rewardCredits = 0;
    var rewardLoot = null;
    if (success) {
      rewardCredits = 50 + (tierDie * 15);
      S.credits = Math.max(0, Number(S.credits || 0) + rewardCredits);
      col.clears = Math.max(0, Number(col.clears || 0) + 1);
      col.bestClearDie = Math.max(Number(col.bestClearDie || 0), tierDie);
      var diff = tierDie >= 20 ? 'impossible' : tierDie >= 12 ? 'very_hard' : tierDie >= 10 ? 'hard' : 'medium';
      var rolled = rollShopLoot(diff) || [];
      if (rolled.length) {
        rewardLoot = String(rolled[0]);
        if (typeof addToBackpack === 'function') {
          try { addToBackpack(rewardLoot); } catch (_bpErr) {}
        }
      }
    }

    col.history.unshift({
      at: new Date().toISOString(),
      tierDie: tierDie,
      enemy: 'Sea Colosseum Bracket',
      success: success,
      hexKey: String(hexKey || '')
    });
    col.history = col.history.slice(0, 12);

    if (typeof updateCreditsUI === 'function') {
      try { updateCreditsUI(); } catch (_cErr) {}
    }

    if (typeof showNotif === 'function') {
      if (success) {
        showNotif('Colosseum win: +' + rewardCredits + ' Credits' + (rewardLoot ? ' and ' + rewardLoot + '.' : '.'), 'good');
      } else {
        showNotif('Colosseum loss: AD d' + actionDie + ' (' + a.total + ') vs d' + tierDie + ' (' + d.total + ').', 'warn');
      }
    }
    return { success: success, tierDie: tierDie, actionTotal: Number(a.total || 0), dreadTotal: Number(d.total || 0), credits: rewardCredits, loot: rewardLoot };
  }

  function spawnRandomGateWarMissionEvent(seedHint, force) {
    ensureState();
    if (!isStorylinePostEnding() && !force) return null;
    if (Array.isArray(S.activeMissions) && S.activeMissions.some(function (mission) {
      return mission && mission.missionType === 'gate_war' && mission.steps && mission.steps[3] && !mission.steps[3].completed;
    })) return null;

    var endgame = ensureEndgameDirectorState();
    var state = endgame.gateWar;
    var dayStamp = getCurrentGameDayStamp();
    var isForced = !!force;
    if (!isForced && dayStamp <= Number(state.lastRollDayStamp || -1)) return null;
    state.lastRollDayStamp = dayStamp;
    if (!isForced && dayStamp < Number(state.nextEligibleDayStamp || 0)) return null;

    var seed = Number(seedHint || 0) + dayStamp + (Number(state.counter || 0) * 53);
    if (!isForced && (Math.abs(seed) % 100) > 24) return null;

    var remainingHell = Math.max(0, 10 - Number(state.closedHellscape || 0));
    var remainingCelestial = Math.max(0, 10 - Number(state.closedCelestial || 0));
    var gateType = (remainingHell > remainingCelestial)
      ? 'hellscape'
      : (remainingCelestial > remainingHell ? 'celestial' : ((Math.abs(seed + 9) % 2) ? 'hellscape' : 'celestial'));

    var enemyBrief = gateType === 'celestial'
      ? 'Celestial Gate defense: 1 Angel (DD12, 24 HP)'
      : 'Hellscape Gate defense: 3 Demons (DD4, 8 HP each)';
    var puzzle = gateType === 'celestial'
      ? 'Seal the Celestial sigil lattice before Heaven reinforcements break through.'
      : 'Collapse the Hellscape chain-runes before abyssal fire overruns the route.';
    var regionPool = getAvailableMissionRegions();
    var region = regionPool[Math.abs(seed + 13) % Math.max(1, regionPool.length)] || 'province';
    var title = (gateType === 'celestial' ? 'Celestial Gate Breach' : 'Hellscape Gate Breach');

    var mission = createMission(
      'Warfront Watcher',
      title,
      gateType === 'celestial' ? 'very_hard' : 'hard',
      (gateType === 'celestial' ? 'Skyward Rift' : 'Abyssal Rift') + ' - ' + getMissionLocationForRegion(region),
      region,
      { gain: 'rebels', lose: 'underworld', gainName: 'Rebel Faction', loseName: 'The Underworld' },
      {
        missionType: 'gate_war',
        templateId: 'gate_war',
        templateLabel: 'Endgame · War of Gods',
        stepNames: { 1: 'Locate Warring Gate', 2: 'Defeat Gate Hostiles', 3: 'Solve Gate Seal Puzzle' },
        checkpoints: [enemyBrief, puzzle, 'Close 10 gates of either side (Heaven or Hell) to open a themed Pinnacle Megadungeon portal.'],
        lore: 'After storyline completion, Heaven and Hell spill into the Beyond. ' + enemyBrief + '. '
      }
    );
    if (!mission) return null;

    mission.gateWarType = gateType;
    mission.gateWarEnemyBrief = enemyBrief;
    mission.gateWarPuzzle = puzzle;
    state.counter = Number(state.counter || 0) + 1;
    state.nextEligibleDayStamp = dayStamp + 2;
    if (typeof showNotif === 'function') showNotif('Gate War alert: ' + title + ' has appeared.', 'warn');
    return mission;
  }

  function maybeUnlockPinnacleMegadungeonFromGateWar(state, sourceGateType) {
    if (!state || state.pinnacleUnlocked) return null;
    var closedHell = Math.max(0, Number(state.closedHellscape || 0));
    var closedCel = Math.max(0, Number(state.closedCelestial || 0));
    if (closedHell < 10 && closedCel < 10) return null;
    var normalized = String(sourceGateType || '').toLowerCase();
    var gateType = (normalized === 'hellscape' || normalized === 'celestial')
      ? normalized
      : (closedCel >= 10 ? 'celestial' : 'hellscape');
    var boss = gateType === 'hellscape' ? 'Mephisto' : 'Azrael';
    var dungeonTitle = gateType === 'celestial' ? 'Heaven Megadungeon' : 'Hell Megadungeon';
    var mission = createMission(
      'Pinnacle Portal',
      dungeonTitle + ': ' + boss,
      'impossible',
      'Pinnacle Gate Nexus',
      'province',
      { gain: 'religious', lose: 'underworld', gainName: 'Religious Entities', loseName: 'The Underworld' },
      {
        missionType: 'pinnacle_megadungeon',
        templateId: 'pinnacle_megadungeon',
        templateLabel: 'Endgame · Pinnacle Dungeon',
        stepNames: { 1: 'Enter Mega-Dungeon', 2: 'Survive Deep Wing', 3: 'Defeat ' + boss },
        checkpoints: [
          'Portal opened by sealing 10 ' + (gateType === 'celestial' ? 'Celestial' : 'Hellscape') + ' gates.',
          'Failure ejects you from the dungeon and requires gate sealing to return.',
          'Pinnacle boss: ' + boss + '.'
        ],
        lore: 'A themed mega-dungeon opens after one side of the warfront reaches 10 sealed gates. Failures eject you until the warfront is stabilized again.'
      }
    );
    if (!mission) return null;
    state.pinnacleUnlocked = true;
    state.pinnacleBoss = boss;
    state.kickoutPending = false;
    state.portalAttempts = Math.max(0, Number(state.portalAttempts || 0) + 1);
    if (typeof showNotif === 'function') {
      showNotif('Portal opened: Pinnacle Megadungeon against ' + boss + ' is now active.', 'good');
    }
    return mission;
  }

  function pickRegionalArcId(bias) {
    var b = bias || {};
    var verbs = Array.isArray(b.preferredVerbs) ? b.preferredVerbs.join('|').toLowerCase() : '';
    if (verbs.indexOf('escort') >= 0 || verbs.indexOf('deliver') >= 0 || verbs.indexOf('rebuild') >= 0) return 'reconstruction';
    if (verbs.indexOf('resist') >= 0 || verbs.indexOf('suppress') >= 0 || verbs.indexOf('patrol') >= 0) return 'occupation';
    if (verbs.indexOf('negotiate') >= 0 || verbs.indexOf('broker') >= 0 || verbs.indexOf('mediate') >= 0) return 'reconciliation';
    if (verbs.indexOf('stabilize') >= 0 || verbs.indexOf('repair') >= 0 || verbs.indexOf('recover') >= 0) return 'collapse';
    if (verbs.indexOf('investigate') >= 0 || verbs.indexOf('expose') >= 0 || verbs.indexOf('track') >= 0) return 'escalation';
    return pick(Object.keys(REGIONAL_ARC_TEMPLATES)) || 'escalation';
  }

  function getArcStageConfig(arcId, index) {
    var arc = REGIONAL_ARC_TEMPLATES[String(arcId || '')];
    if (!arc || !Array.isArray(arc.steps)) return null;
    var idx = Math.max(0, Math.min(arc.steps.length - 1, Number(index || 0)));
    return arc.steps[idx] || null;
  }

  function buildArcJobFromState(state, bias, region, factionData, seedBase, idx) {
    var arcId = String(state.activeArcId || pickRegionalArcId(bias));
    state.activeArcId = arcId;
    var stageCfg = getArcStageConfig(arcId, state.stageIndex || 0);
    if (!stageCfg) return null;
    var diffKey = (state.stageIndex || 0) >= 2 ? 'hard' : ((state.stageIndex || 0) === 1 ? 'medium' : 'easy');
    var diff = DIFFICULTIES[diffKey] || DIFFICULTIES.medium;
    return {
      id: seedBase + idx + 1,
      title: stageCfg.title,
      difficulty: diffKey,
      dread: diff.dread,
      location: getMissionLocationForRegion(region),
      planetHexId: null,
      planetName: '',
      reward: Math.max(40, Number(stageCfg.reward || 50) + Number(bias && bias.rewardBonus || 0)),
      region: region,
      missionType: String(stageCfg.missionType || 'arc_chain'),
      templateId: 'arc_chain_' + arcId,
      templateLabel: String(stageCfg.templateLabel || 'Arc Chain Contract'),
      stepNames: stageCfg.stepNames || null,
      factionGain: factionData.gain,
      factionLose: factionData.lose,
      factionGainName: factionData.gainName,
      factionLoseName: factionData.loseName,
      lore: 'Arc progression: ' + (REGIONAL_ARC_TEMPLATES[arcId] ? REGIONAL_ARC_TEMPLATES[arcId].label : arcId) + ' · Stage ' + (Number(state.stageIndex || 0) + 1) + '/3',
      arcChain: {
        arcId: arcId,
        stageIndex: Number(state.stageIndex || 0),
        stageCount: 3
      }
    };
  }

  function pushNextArcJob(currentMission, success) {
    ensureState();
    var chain = currentMission && currentMission.arcChain && typeof currentMission.arcChain === 'object' ? currentMission.arcChain : null;
    if (!chain) return;
    var arcId = String(chain.arcId || '');
    if (!arcId || !REGIONAL_ARC_TEMPLATES[arcId]) return;
    var nextStage = Number(chain.stageIndex || 0) + 1;
    if (nextStage >= 3) {
      var arcStateDone = ensureMissionDirectorState();
      arcStateDone.history.unshift({
        arcId: arcId,
        completedAt: new Date().toISOString(),
        outcome: success ? 'completed' : 'fractured'
      });
      if (arcStateDone.history.length > 12) arcStateDone.history.length = 12;
      arcStateDone.activeArcId = '';
      arcStateDone.stageIndex = 0;
      arcStateDone.momentum = success ? Number(arcStateDone.momentum || 0) + 1 : Math.max(0, Number(arcStateDone.momentum || 0) - 1);
      return;
    }
    var cfg = getArcStageConfig(arcId, nextStage);
    if (!cfg) return;
    var diffKey = nextStage >= 2 ? 'hard' : 'medium';
    var diff = DIFFICULTIES[diffKey] || DIFFICULTIES.medium;
    var f = {
      gain: currentMission.factionGain || 'political',
      lose: currentMission.factionLose || 'underworld',
      gainName: currentMission.factionGainName || 'Political Groups',
      loseName: currentMission.factionLoseName || 'The Underworld'
    };
    var arcState = ensureMissionDirectorState();
    arcState.activeArcId = arcId;
    arcState.stageIndex = nextStage;
    arcState.momentum = success ? Number(arcState.momentum || 0) + 1 : Math.max(0, Number(arcState.momentum || 0) - 1);

    S.availableJobs = S.availableJobs || [];
    S.availableJobs.push({
      id: Date.now() + Math.floor(Math.random() * 9000),
      title: cfg.title,
      difficulty: diffKey,
      dread: diff.dread,
      location: currentMission.location || getMissionLocationForRegion(currentMission.region || 'province'),
      planetHexId: currentMission.planetHexId || null,
      planetName: currentMission.planetName || '',
      reward: Math.max(45, Number(cfg.reward || 60) + (success ? 15 : 0)),
      region: currentMission.region || 'province',
      missionType: String(cfg.missionType || 'arc_chain'),
      templateId: 'arc_chain_' + arcId,
      templateLabel: String(cfg.templateLabel || 'Arc Chain Contract'),
      stepNames: cfg.stepNames || null,
      factionGain: f.gain,
      factionLose: f.lose,
      factionGainName: f.gainName,
      factionLoseName: f.loseName,
      lore: 'Arc progression: ' + (REGIONAL_ARC_TEMPLATES[arcId] ? REGIONAL_ARC_TEMPLATES[arcId].label : arcId) + ' · Stage ' + (nextStage + 1) + '/3',
      arcChain: {
        arcId: arcId,
        stageIndex: nextStage,
        stageCount: 3
      }
    });
    if (typeof showNotif === 'function') {
      showNotif('Arc advanced: ' + (REGIONAL_ARC_TEMPLATES[arcId] ? REGIONAL_ARC_TEMPLATES[arcId].label : arcId) + ' Stage ' + (nextStage + 1) + ' posted.', success ? 'good' : 'warn');
    }
  }

  var DEITY_PACT_PATHWAYS = {
    mercy: {
      id: 'mercy',
      label: 'Mercy Tithe',
      opening: 'Spare what can be spared and pay your debt in service, not blood.',
      stages: [
        { title: 'Tithe of Ash Bread', location: 'Pilgrim Road Shrine', difficulty: 'medium', rewardFavor: 2, failDebt: 2, debtEase: 1 },
        { title: 'Candle Court Arbitration', location: 'Shuttered Temple Court', difficulty: 'hard', rewardFavor: 2, failDebt: 2, debtEase: 1 },
        { title: 'Release the Bound Procession', location: 'Flooded Reliquary Steps', difficulty: 'challenging', rewardFavor: 3, failDebt: 3, debtEase: 1 }
      ]
    },
    dominion: {
      id: 'dominion',
      label: 'Dominion Oath',
      opening: 'Rule through fear, collect what is owed, and make the city kneel.',
      stages: [
        { title: 'Collect the Brass Tithe', location: 'Debt-keeper Barricade', difficulty: 'hard', rewardFavor: 2, failDebt: 3, debtEase: 0 },
        { title: 'Silence the Heretic Choir', location: 'Split Bell Chapel', difficulty: 'challenging', rewardFavor: 3, failDebt: 3, debtEase: 0 },
        { title: 'Seat the Patron in Iron', location: 'Burned Registry Hall', difficulty: 'very_hard', rewardFavor: 3, failDebt: 4, debtEase: 0 }
      ]
    },
    veil: {
      id: 'veil',
      label: 'Veil Covenant',
      opening: 'Keep the pact hidden. Truth is leverage, not confession.',
      stages: [
        { title: 'Whisper Ledger Recovery', location: 'Midnight Archive Cellar', difficulty: 'medium', rewardFavor: 2, failDebt: 2, debtEase: 0 },
        { title: 'Break the Witness Chain', location: 'Glass Market Catacombs', difficulty: 'hard', rewardFavor: 2, failDebt: 3, debtEase: 0 },
        { title: 'Erase the Patron Record', location: 'Submerged Court Vault', difficulty: 'very_hard', rewardFavor: 4, failDebt: 4, debtEase: 0 }
      ]
    }
  };

  function ensureState() {
    if (typeof S === 'undefined') return;
    S.activeMissions    = S.activeMissions    || [];
    S.completedMissions = S.completedMissions || [];
    S.missionTokens     = S.missionTokens     || {};
    S.availableJobs     = S.availableJobs     || [];
    if (S.lastSea && !S.lastSea.missionTokens) { S.lastSea.missionTokens = {}; }
    S.deityPact = S.deityPact || {
      activePathway: '',
      stageCompleted: 0,
      favor: 0,
      debt: 0,
      failedStages: 0,
      endingKey: '',
      endingApplied: false,
      endingText: '',
      history: []
    };
    if (!Array.isArray(S.deityPact.history)) { S.deityPact.history = []; }
    S.solarCycleLegacy = S.solarCycleLegacy || {
      raidMedals: 0,
      raidPoints: 0,
      raidTreeRanks: {},
      raidKeys: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
      raidTrophies: []
    };
    if (!S.solarCycleLegacy.raidTreeRanks || typeof S.solarCycleLegacy.raidTreeRanks !== 'object') {
      S.solarCycleLegacy.raidTreeRanks = {};
    }
    if (!S.solarCycleLegacy.raidKeys || typeof S.solarCycleLegacy.raidKeys !== 'object') {
      S.solarCycleLegacy.raidKeys = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    }
    if (!Array.isArray(S.solarCycleLegacy.raidTrophies)) S.solarCycleLegacy.raidTrophies = [];
    S.solarCycleLegacy.raidMedals = Math.max(0, Number(S.solarCycleLegacy.raidMedals || 0));
    S.solarCycleLegacy.raidPoints = Math.max(0, Number(S.solarCycleLegacy.raidPoints || 0));

    // Backfill older mission objects so resolve buttons work for legacy saves.
    S.activeMissions.forEach(function(m) {
      if (!m || typeof m !== 'object') { return; }
      if (!m.steps || typeof m.steps !== 'object') { m.steps = {}; }
      if (!m.steps[1]) { m.steps[1] = { name:'Gather Information', required:false, completed:false, skipped:false }; }
      if (!m.steps[2]) { m.steps[2] = { name:'Go to Site', required:true, completed:false }; }
      if (!m.steps[3]) { m.steps[3] = { name:'Confrontation', required:true, completed:false }; }
      if (!m.steps[1].name) { m.steps[1].name = 'Gather Information'; }
      if (!m.steps[2].name) { m.steps[2].name = 'Go to Site'; }
      if (!m.steps[3].name) { m.steps[3].name = 'Confrontation'; }
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

  function hasDeityPactFlavor() {
    var flavor = String((S && S.flavor) || '').toLowerCase();
    return flavor.indexOf('deity pact') >= 0 || flavor.indexOf('holy') >= 0 || flavor.indexOf('infernal') >= 0;
  }

  function ensureDeityPactState() {
    ensureState();
    S.deityPact = S.deityPact || {};
    if (typeof S.deityPact.activePathway !== 'string') { S.deityPact.activePathway = ''; }
    if (typeof S.deityPact.stageCompleted !== 'number') { S.deityPact.stageCompleted = 0; }
    if (typeof S.deityPact.favor !== 'number') { S.deityPact.favor = 0; }
    if (typeof S.deityPact.debt !== 'number') { S.deityPact.debt = 0; }
    if (typeof S.deityPact.failedStages !== 'number') { S.deityPact.failedStages = 0; }
    if (typeof S.deityPact.endingKey !== 'string') { S.deityPact.endingKey = ''; }
    if (typeof S.deityPact.endingText !== 'string') { S.deityPact.endingText = ''; }
    if (typeof S.deityPact.endingApplied !== 'boolean') { S.deityPact.endingApplied = false; }
    if (!Array.isArray(S.deityPact.history)) { S.deityPact.history = []; }
    return S.deityPact;
  }

  function getDeityPathway(id) {
    var key = String(id || '').toLowerCase();
    return DEITY_PACT_PATHWAYS[key] || DEITY_PACT_PATHWAYS.mercy;
  }

  function hasActiveDeityMission() {
    return (S.activeMissions || []).some(function(m) { return m && m.missionType === 'deity_pact'; });
  }

  function pickDeityPathwayByState(pact) {
    if (pact.activePathway && DEITY_PACT_PATHWAYS[pact.activePathway]) return pact.activePathway;
    if ((pact.debt || 0) >= 5 && (pact.favor || 0) <= 4) return 'veil';
    if ((pact.favor || 0) >= 5 && (pact.debt || 0) <= 3) return 'mercy';
    return 'dominion';
  }

  function createDeityPactMission(pathwayId) {
    if (!hasDeityPactFlavor()) {
      if (typeof showNotif === 'function') showNotif('You need the Deity Pact flavor to begin pact contracts.', 'warn');
      return null;
    }
    ensureState();
    var pact = ensureDeityPactState();
    if (pact.endingKey) {
      if (typeof showNotif === 'function') showNotif('Your deity pact arc already reached an ending: ' + pact.endingKey + '.', 'info');
      return null;
    }
    if (hasActiveDeityMission()) {
      if (typeof showNotif === 'function') showNotif('A deity pact contract is already active.', 'warn');
      return null;
    }

    var chosenPath = String(pathwayId || pickDeityPathwayByState(pact)).toLowerCase();
    var pathway = getDeityPathway(chosenPath);
    pact.activePathway = pathway.id;

    var stageIndex = Math.max(0, Math.min(pathway.stages.length - 1, Number(pact.stageCompleted || 0)));
    var stage = pathway.stages[stageIndex];
    var missionTitle = pathway.label + ': ' + stage.title;
    var opts = {
      missionType: 'deity_pact',
      storyTheme: 'deity_pact',
      noFactionDelta: true,
      stepNames: {
        1: 'Read the Omen',
        2: 'Perform the Rite',
        3: 'Deliver the Oath'
      },
      checkpoints: [
        'Interpret the patron sign in hostile territory',
        'Carry out the rite at ' + stage.location,
        'Return with proof before dawn witnesses'
      ],
      step1Intro: pathway.opening,
      deityPact: {
        pathway: pathway.id,
        stageNumber: stageIndex + 1,
        rewardFavor: Number(stage.rewardFavor || 0),
        failDebt: Number(stage.failDebt || 0),
        debtEase: Number(stage.debtEase || 0)
      }
    };

    var mission = createMission('Patron Voice', missionTitle, stage.difficulty, stage.location, 'province', {
      gain: 'religious',
      lose: 'underworld',
      gainName: 'Sacred Choir',
      loseName: 'Underworld'
    }, opts);
    if (!mission) return null;
    if (typeof showNotif === 'function') showNotif('Deity pact contract accepted: ' + missionTitle, 'good');
    return mission;
  }

  function applyDeityPactEnding(pact) {
    if (!pact || pact.endingApplied || !pact.endingKey) return;
    var key = pact.endingKey;
    var txt = '';
    if (key === 'lantern_herald') {
      S.renown = (S.renown || 0) + 2;
      S.credits = (S.credits || 0) + 220;
      if (typeof changeFactionRenown === 'function') {
        changeFactionRenown('religious', 2);
      }
      txt = 'Ending: Lantern Herald. Your pact matures into public authority. +2 Renown, +220₵, Sacred Choir +2.';
    } else if (key === 'chain_bound') {
      S.renown = Math.max(0, (S.renown || 0) - 2);
      if (typeof changeCounter === 'function') { changeCounter('tmw', 2); }
      if (typeof changeFactionRenown === 'function') { changeFactionRenown('underworld', 1); }
      txt = 'Ending: Chain-Bound Collector. Debt eclipses favor. -2 Renown, +2 Teamwork, Underworld +1.';
    } else if (key === 'oathbreaker') {
      S.renown = Math.max(0, (S.renown || 0) - 1);
      S.credits = Math.max(0, (S.credits || 0) - 120);
      if (typeof changeFactionRenown === 'function') { changeFactionRenown('religious', -2); }
      txt = 'Ending: Oathbreaker Exile. Your patron marks you faithless. -1 Renown, -120₵, Sacred Choir -2.';
    }
    if (typeof updateRenown === 'function') { try { updateRenown(); } catch (err) {} }
    if (typeof updateCreditsUI === 'function') { try { updateCreditsUI(); } catch (err) {} }
    pact.endingText = txt;
    pact.endingApplied = true;

    if (S.storyline && typeof S.storyline === 'object') {
      S.storyline.flags = S.storyline.flags || {};
      S.storyline.flags.deityPactEnding = key;
      S.storyline.flags.deityPactFavor = pact.favor;
      S.storyline.flags.deityPactDebt = pact.debt;
      if (S.storyline.storyMemory && S.storyline.storyMemory.tags) {
        S.storyline.storyMemory.tags['tag:deity_pact_' + key] = (S.storyline.storyMemory.tags['tag:deity_pact_' + key] || 0) + 1;
      }
    }

    if (typeof showNotif === 'function') showNotif(txt, key === 'lantern_herald' ? 'good' : 'warn');
    if (typeof openModal === 'function') {
      openModal('Deity Pact Consequence', '<div style="font-size:.9rem;color:var(--text2);line-height:1.6;">'+txt+'</div>');
    }
  }

  function evaluateDeityPactEnding(pact) {
    if (!pact || pact.endingKey) return;
    var complete = Number(pact.stageCompleted || 0);
    if (complete < 3) return;
    if ((pact.favor || 0) >= 8 && (pact.debt || 0) <= 3) pact.endingKey = 'lantern_herald';
    else if ((pact.debt || 0) >= 8) pact.endingKey = 'chain_bound';
    else pact.endingKey = 'oathbreaker';
    applyDeityPactEnding(pact);
  }

  function onDeityPactMissionResolved(mission, success) {
    if (!mission || mission.missionType !== 'deity_pact' || !mission.deityPact) return;
    var pact = ensureDeityPactState();
    var data = mission.deityPact;
    var wasComplete = Number(pact.stageCompleted || 0);
    if (success) {
      pact.stageCompleted = Math.max(wasComplete, Number(data.stageNumber || 1));
      pact.favor = Number(pact.favor || 0) + Number(data.rewardFavor || 1);
      if (data.debtEase) pact.debt = Math.max(0, Number(pact.debt || 0) - Number(data.debtEase || 0));
      if (typeof changeFactionRenown === 'function') { changeFactionRenown('religious', 1); }
    } else {
      pact.failedStages = Number(pact.failedStages || 0) + 1;
      pact.debt = Number(pact.debt || 0) + Number(data.failDebt || 2);
      pact.favor = Math.max(0, Number(pact.favor || 0) - 1);
      if (typeof changeFactionRenown === 'function') { changeFactionRenown('religious', -1); }
    }
    pact.history.push({
      missionId: mission.id,
      title: mission.title,
      stage: Number(data.stageNumber || 1),
      pathway: data.pathway || '',
      success: !!success,
      favor: pact.favor,
      debt: pact.debt,
      at: new Date().toISOString()
    });
    if (pact.history.length > 20) pact.history.shift();
    if (typeof window.wtwRefreshPactSkirmishDensity === 'function') {
      try { window.wtwRefreshPactSkirmishDensity(); } catch (_err) {}
    }
    evaluateDeityPactEnding(pact);
  }

  function chooseOriginRegion() {
    var regions = ['province'];
    if (S && S.starSystem && Array.isArray(S.starSystem.hexes) && S.starSystem.hexes.length) { regions.push('galaxy'); }
    if (S && S.worldThatWas && Array.isArray(S.worldThatWas.hexes) && S.worldThatWas.hexes.length) { regions.push('wtw'); }
    return pick(regions);
  }

  function originLocationForRegion(region) {
    if (region === 'galaxy') {
      var gTarget = getGalaxyPlanetMissionTarget();
      return gTarget ? gTarget.location : pick(GALAXY_MISSION_LOCS);
    }
    if (region === 'wtw') {
      return 'World That Was district: ' + pick(['Ashline Ward', 'Glass Market', 'Drowned Courtyard', 'Split Basilica']);
    }
    return pick(MISSION_LOCS);
  }

  function focusOriginRegion(region) {
    if (typeof setContext === 'function') {
      if (region === 'galaxy' || region === 'wtw') { setContext('space'); }
      else { setContext('holding'); }
    }
    if (typeof switchTab !== 'function') return;
    if (region === 'galaxy') {
      var gBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('galaxy'\"]");
      switchTab('galaxy', gBtn || null);
    } else if (region === 'wtw') {
      var wBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('worldthatwas'\"]");
      switchTab('worldthatwas', wBtn || null);
    } else {
      var pBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('map'\"]");
      switchTab('map', pBtn || null);
    }
  }

  function createOriginMissionFromReason(forceCreate) {
    ensureState();
    if (!S || !forceCreate && S.originMissionInitialized) return null;

    var existingActive = (S.activeMissions || []).some(function(m){ return m && m.missionType === 'origin_story'; });
    var existingDone = (S.completedMissions || []).some(function(m){ return m && m.missionType === 'origin_story'; });
    if (existingActive || existingDone) {
      S.originMissionInitialized = true;
      return null;
    }

    var reason = String((S && S.reason) || '').trim();
    var reasonLine = reason || 'find a reason worth bleeding for';
    var region = chooseOriginRegion();
    var location = originLocationForRegion(region);
    var title = 'First Road: ' + reasonLine;
    
    // Build narrative lore that ties reason to journey structure
    var loreLine = 'Your reason echoes from countless nights to this moment. Three steps lie ahead: question those who know, reach the marked location, and accept the stranger\'s proposal to enter the main arc.';
    
    var opts = {
      missionType: 'origin_story',
      stepNames: {
        1: 'Follow the Whisper',
        2: 'Reach the First Lead',
        3: 'Meet the Stranger'
      },
      storyTheme: 'origin',
      templateLabel: 'First Road · Your Origin',
      lore: loreLine,
      checkpoints: [
        'Question locals tied to your reason',
        'Travel to the marked lead in ' + (region === 'wtw' ? 'World That Was' : (region === 'galaxy' ? 'the Galaxy' : 'the Province')),
        'Accept the stranger\'s offer to enter the main arc'
      ],
      step1Intro: 'This is your origin contract. Your reason for traveling is now a live lead. Success means a cleaner handoff into the main arc.',
      noFactionDelta: true
    };
    var mission = createMission('Origin', title, 'medium', location, region, {
      gain: null,
      lose: null,
      gainName: 'Storyline',
      loseName: 'Storyline'
    }, opts);

    if (!mission) return null;
    mission.originReason = reasonLine;
    mission.templateLabel = opts.templateLabel;
    mission.lore = opts.lore;
    S.originMissionInitialized = true;
    focusOriginRegion(region);
    if (typeof showNotif === 'function') {
      showNotif('Your first mission has begun: ' + title, 'good');
    }
    return mission;
  }

  function getAvailableMissionRegions() {
    var regions = ['province'];
    if (S.lastSea && Array.isArray(S.lastSea.map) && S.lastSea.map.length) { regions.push('sea'); }
    if (S.starSystem && Array.isArray(S.starSystem.hexes) && S.starSystem.hexes.length) { regions.push('galaxy'); }
    return regions;
  }

  function getMissionLocationForRegion(region) {
    if (region === 'sea') { return pick(SEA_MISSION_LOCS); }
    if (region === 'galaxy') {
      var target = getGalaxyPlanetMissionTarget();
      return target ? target.location : pick(GALAXY_MISSION_LOCS);
    }
    return pick(MISSION_LOCS);
  }

  function getGalaxyPlanetMissionTarget() {
    if (!S.starSystem || !Array.isArray(S.starSystem.hexes) || !S.starSystem.hexes.length) { return null; }
    var planets = S.starSystem.hexes.filter(function(hex) { return hex && hex.type === 'planet'; });
    if (!planets.length) { return null; }

    // Bias planet selection toward Theos province DNA — prefer planets whose
    // environment tag matches the active province's climateBand/terrain/enemies.
    var theosDNA = (typeof window.getActiveTheosProvinceDNA === 'function') ? window.getActiveTheosProvinceDNA() : null;
    var chosen;
    if (theosDNA) {
      var climate = (theosDNA.climateBand || '').toLowerCase();
      var THEOS_GALAXY_PLANET_TAGS = {
        cold:      ['ice','frost','frozen','tundra','cryo'],
        arid:      ['desert','dune','arid','sand','wasteland'],
        tropical:  ['jungle','lush','verdant','bio'],
        storm:     ['storm','gas','tempest','cyclone'],
        marsh:     ['swamp','bog','humid','wetland'],
        coastal:   ['ocean','aqua','water','tidal'],
        highland:  ['mountain','rock','ridge','crater'],
        forest:    ['forest','arboreal','garden','canopy'],
        temperate: [] // no strong preference — random
      };
      var preferred = THEOS_GALAXY_PLANET_TAGS[climate] || [];
      var biased = preferred.length ? planets.filter(function(p) {
        var tags = ((p.envTag || '') + ' ' + (p.name || '') + ' ' + (p.type2 || '')).toLowerCase();
        return preferred.some(function(t) { return tags.indexOf(t) >= 0; });
      }) : [];
      chosen = (biased.length && Math.random() < 0.6) ? biased[Math.floor(Math.random() * biased.length)] : planets[Math.floor(Math.random() * planets.length)];
    } else {
      chosen = planets[Math.floor(Math.random() * planets.length)];
    }

    var profile = null;
    if (typeof ensurePlanetProfile === 'function') {
      try {
        profile = ensurePlanetProfile(chosen);
      } catch (err) {
        profile = null;
      }
    }
    var planetName = (profile && profile.planetName) || chosen.name || ('Planet Hex ' + chosen.id);
    var locationSuffix = theosDNA ? (' – ' + (theosDNA.terrain || 'surface corridor')) : ' surface corridor';
    return {
      location: planetName + locationSuffix,
      planetHexId: chosen.id,
      planetName: planetName
    };
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
    if (mission.region === 'wtw' && S.worldThatWas && Array.isArray(S.worldThatWas.hexes) && S.worldThatWas.hexes.length) {
      var pool = S.worldThatWas.hexes.slice();
      var byId = function(id) {
        return S.worldThatWas.hexes.find(function(hex) { return hex && String(hex.id) === String(id); }) || null;
      };
      var takeRandom = function(excludeId) {
        var candidates = pool.filter(function(hex) {
          return hex && String(hex.id) !== String(excludeId || '');
        });
        if (!candidates.length) return null;
        return candidates[Math.floor(Math.random() * candidates.length)] || null;
      };

      var informerHex = byId(mission.wtwInformerHexId);
      var siteHex = byId(mission.wtwSiteHexId || mission.wtwHexId);

      if (!siteHex) siteHex = takeRandom('');
      if (!informerHex) informerHex = takeRandom(siteHex ? siteHex.id : '');
      if (!informerHex) informerHex = siteHex;

      if (siteHex) {
        mission.wtwSiteHexId = siteHex.id;
        mission.wtwHexId = siteHex.id;
        mission.wtwZone = siteHex.zone || mission.wtwZone || '';
        mission.wtwDistrict = siteHex.district || mission.wtwDistrict || '';
      }
      if (informerHex) {
        mission.wtwInformerHexId = informerHex.id;
      }

      if (typeof window.wtwSyncMarkers === 'function') {
        try { window.wtwSyncMarkers(); } catch (err) {}
      } else if (typeof renderWorldThatWas === 'function') {
        try { renderWorldThatWas(); } catch (err) {}
      }
      return;
    }
    if (mission.region === 'galaxy' && typeof createGalaxyTask === 'function') {
      // Mirror province flow with two markers: informer lead + site objective.
      var planetLabel = mission.planetName || mission.location;
      var informerGlyph = mission.missionType === 'legacy_raid' ? '🐉' : '👁';
      var informerColor = mission.missionType === 'legacy_raid' ? '#ff8450' : '#e8c050';
      var siteGlyph = mission.missionType === 'legacy_raid' ? '🐉' : '⚔';
      var siteColor = mission.missionType === 'legacy_raid' ? '#ff8450' : '#e05050';
      var informerTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Informer)',
        text: 'Track local informants for mission intel on ' + planetLabel + '.',
        missionId: mission.id,
        missionStep: 'informer',
        interaction: 'mission-step',
        markerGlyph: informerGlyph,
        markerColor: informerColor,
        reward: { credits: 0 },
        preferredHexId: mission.planetHexId
      });
      var siteTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Site)',
        text: 'Mission board contract on ' + planetLabel + '.',
        missionId: mission.id,
        missionStep: 'site',
        interaction: 'mission-step',
        markerGlyph: siteGlyph,
        markerColor: siteColor,
        reward: { credits: mission.reward, globalRenown: 1 },
        preferredHexId: mission.planetHexId
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
        S.lastSea.missionTokens[siteHex.key] = {
          missionId: mission.id,
          title: mission.title,
          type: 'site',
          missionType: mission.missionType || 'standard',
          icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
        };
        mission.seaSiteKey = siteHex.key;
        if (informerHex) {
          S.lastSea.missionTokens[informerHex.key] = {
            missionId: mission.id,
            title: mission.title,
            type: 'informer',
            missionType: mission.missionType || 'standard',
            icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
          };
          mission.seaInformerKey = informerHex.key;
        }
        if (typeof renderLastSeaMap === 'function') renderLastSeaMap();
      }
      return;
    }
    if (typeof mapData !== 'undefined' && (!Array.isArray(mapData) || !mapData.length)) {
      if (typeof generateMap === 'function') {
        try { generateMap(); } catch (_err) {}
      }
    }
    if (typeof mapData !== 'undefined' && mapData.length) {
      var candidates = mapData.filter(function(h) { return h.type === 'wilderness'; });
      if (candidates.length >= 2) {
        // Pick two distinct hexes: one for the Informer (step 1), one for the Site (steps 2-3)
        var shuffled = candidates.slice().sort(function(){ return Math.random()-0.5; });
        var informerHex = shuffled[0];
        var siteHex = shuffled[1];
        S.missionTokens[informerHex.col + ',' + informerHex.row] = {
          missionId: mission.id,
          title: mission.title,
          type: 'informer',
          missionType: mission.missionType || 'standard',
          icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
        };
        mission.informerHex = { col: informerHex.col, row: informerHex.row };
        mission.siteHex     = { col: siteHex.col,     row: siteHex.row };
        if (mission.missionType === 'legacy_raid') {
          var mapPrompt = ensureLegacyRaidMapPromptState(mission);
          if (mapPrompt && mapPrompt.siteRevealed) {
            S.missionTokens[siteHex.col + ',' + siteHex.row] = {
              missionId: mission.id,
              title: mission.title,
              type: 'site',
              missionType: mission.missionType || 'legacy_raid',
              icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
            };
          } else {
            delete S.missionTokens[siteHex.col + ',' + siteHex.row];
          }
        } else {
            S.missionTokens[siteHex.col + ',' + siteHex.row] = {
              missionId: mission.id,
              title: mission.title,
              type: 'site',
              missionType: mission.missionType || 'standard',
              icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
            };
        }
        // Keep mapHex pointing to site for backwards compatibility
        mission.mapHex = mission.siteHex;
      } else if (candidates.length === 1) {
        var hex = candidates[0];
        S.missionTokens[hex.col + ',' + hex.row] = {
          missionId: mission.id,
          title: mission.title,
          type: 'site',
          missionType: mission.missionType || 'standard',
          icon: mission.missionType === 'soul_mission' ? String(mission.soulIcon || '⚒') : undefined
        };
        mission.siteHex = { col: hex.col, row: hex.row };
        mission.mapHex  = mission.siteHex;
      }
      if (typeof renderHexMap === 'function') renderHexMap();
    }
  }

  function removeMissionToken(mission) {
    if (!mission) return;
    if (mission.region === 'wtw') {
      mission.wtwInformerHexId = null;
      mission.wtwSiteHexId = null;
      mission.wtwHexId = null;
      if (typeof window.wtwSyncMarkers === 'function') {
        try { window.wtwSyncMarkers(); } catch (err) {}
      } else if (typeof renderWorldThatWas === 'function') {
        try { renderWorldThatWas(); } catch (err) {}
      }
      return;
    }
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
    if (mission && mission.region === 'wtw') {
      mission.wtwInformerHexId = null;
      if (typeof window.wtwSyncMarkers === 'function') {
        try { window.wtwSyncMarkers(); } catch (err) {}
      } else if (typeof renderWorldThatWas === 'function') {
        try { renderWorldThatWas(); } catch (err) {}
      }
      return;
    }
    if (mission && mission.region === 'galaxy' && mission.galaxyInformerTaskId && S.starSystem && Array.isArray(S.starSystem.taskMarkers)) {
      S.starSystem.taskMarkers.forEach(function(task) {
        if (task.id === mission.galaxyInformerTaskId) {
          task.resolved = true;
          var hex = (S.starSystem.hexes || []).find(function(h) { return h.id === task.hexId; });
          if (hex && hex.taskMarker && hex.taskMarker.id === task.id) {
            hex.taskMarker.resolved = true;
          }
        }
      });
      if (typeof renderStarSystemMap === 'function') renderStarSystemMap();
      if (typeof updateStarSystemReadouts === 'function') updateStarSystemReadouts();
      return;
    }
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

  function pickFactionConflict(bias) {
    var b = bias || {};
    if (b.factionConflictOverride && typeof b.factionConflictOverride === 'object') {
      return {
        gain: String(b.factionConflictOverride.gain || 'political'),
        lose: String(b.factionConflictOverride.lose || 'underworld'),
        gainName: String(b.factionConflictOverride.gainName || 'Political Groups'),
        loseName: String(b.factionConflictOverride.loseName || 'The Underworld')
      };
    }
    return pick(MISSION_FACTION_CONFLICTS);
  }

  function mergeMissionBias(baseBias, addonBias) {
    var base = baseBias || { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    var addon = addonBias || {};
    var merged = {
      focusRegion: String(base.focusRegion || ''),
      difficultyShift: Number(base.difficultyShift || 0),
      rewardBonus: Number(base.rewardBonus || 0),
      preferredVerbs: Array.isArray(base.preferredVerbs) ? base.preferredVerbs.slice() : [],
      factionConflictOverride: base.factionConflictOverride || null
    };
    if (addon.focusRegion) merged.focusRegion = String(addon.focusRegion);
    merged.difficultyShift += Number(addon.difficultyShift || 0);
    merged.rewardBonus += Number(addon.rewardBonus || 0);
    if (Array.isArray(addon.preferredVerbs) && addon.preferredVerbs.length) {
      merged.preferredVerbs = merged.preferredVerbs.concat(addon.preferredVerbs);
    }
    if (addon.factionConflictOverride && typeof addon.factionConflictOverride === 'object') {
      merged.factionConflictOverride = addon.factionConflictOverride;
    }
    return merged;
  }

  function getMissionConsequenceBias() {
    var base = { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    if (typeof window === 'undefined' || typeof window.getConsequenceMissionBias !== 'function') {
      if (typeof window !== 'undefined' && typeof window.getTheosMissionBias === 'function') {
        try {
          return mergeMissionBias(base, window.getTheosMissionBias() || {});
        } catch (_theosErr0) {
          return base;
        }
      }
      return base;
    }
    try {
      var consequence = window.getConsequenceMissionBias() || base;
      var theosBias = (typeof window.getTheosMissionBias === 'function') ? (window.getTheosMissionBias() || {}) : {};
      return mergeMissionBias(consequence, theosBias);
    } catch (_err) {
      return base;
    }
  }

  function chooseMissionTemplate(bias) {
    var b = bias || {};

    // Collect rumor tags from the current selected hex and its stored rumors
    var rumorTags = [];
    try {
      if (typeof window !== 'undefined' && typeof window.getHexRumors === 'function') {
        var selectedKey = '';
        if (typeof window.getProvinceSelectedKey === 'function') selectedKey = String(window.getProvinceSelectedKey() || '');
        if (!selectedKey && window.selectedHex && typeof window.selectedHex.col === 'number') {
          selectedKey = window.selectedHex.col + ',' + window.selectedHex.row;
        }
        if (selectedKey) {
          var hexRumors = window.getHexRumors(selectedKey) || [];
          hexRumors.forEach(function(r){ if (Array.isArray(r.tags)) rumorTags = rumorTags.concat(r.tags); });
        }
      }
    } catch (_re) {}

    // Bias template from rumors before checking consequence feed
    if (rumorTags.indexOf('crackdown-escalated') >= 0 || rumorTags.indexOf('instability-ripple') >= 0) {
      return MISSION_TEMPLATES.find(function(t){ return t.id === 'survival'; }) || MISSION_TEMPLATES[0];
    }
    if (rumorTags.indexOf('backchannel-opened') >= 0 || rumorTags.indexOf('contract-signed') >= 0 || rumorTags.indexOf('bribe-paid') >= 0) {
      return MISSION_TEMPLATES.find(function(t){ return t.id === 'faction_politics'; }) || MISSION_TEMPLATES[0];
    }
    if (rumorTags.indexOf('smuggler-route') >= 0 || rumorTags.indexOf('discovered-route') >= 0 || rumorTags.indexOf('contract-ripple') >= 0) {
      return MISSION_TEMPLATES.find(function(t){ return t.id === 'escort_chain'; }) || MISSION_TEMPLATES[0];
    }
    if (rumorTags.indexOf('intel-gathered') >= 0) {
      return MISSION_TEMPLATES.find(function(t){ return t.id === 'recon' || t.id === 'escort_chain'; }) || MISSION_TEMPLATES[0];
    }

    var crises = (typeof window !== 'undefined' && typeof window.getWorldConsequenceFeed === 'function')
      ? (window.getWorldConsequenceFeed() || [])
      : [];
    if (Array.isArray(crises) && crises.length) {
      var hot = String((crises[0] && crises[0].title) || '').toLowerCase();
      if (hot.indexOf('route') >= 0 || hot.indexOf('escort') >= 0) {
        return MISSION_TEMPLATES.find(function(t){ return t.id === 'escort_chain'; }) || MISSION_TEMPLATES[0];
      }
      if (hot.indexOf('faction') >= 0 || hot.indexOf('border') >= 0) {
        return MISSION_TEMPLATES.find(function(t){ return t.id === 'faction_politics'; }) || MISSION_TEMPLATES[0];
      }
      if (hot.indexOf('crisis') >= 0 || hot.indexOf('danger') >= 0) {
        return MISSION_TEMPLATES.find(function(t){ return t.id === 'survival'; }) || MISSION_TEMPLATES[0];
      }
    }
    var templates = shouldOfferSoulMission()
      ? MISSION_TEMPLATES.slice()
      : MISSION_TEMPLATES.filter(function (template) { return template && template.id !== 'soul_mission'; });
    return pick(templates);
  }

  function getMissionLocationKey(mission) {
    if (!mission || typeof mission !== 'object') return '';
    if (mission.siteHex && typeof mission.siteHex.col === 'number' && typeof mission.siteHex.row === 'number') {
      return mission.siteHex.col + ',' + mission.siteHex.row;
    }
    if (mission.mapHex && typeof mission.mapHex.col === 'number' && typeof mission.mapHex.row === 'number') {
      return mission.mapHex.col + ',' + mission.mapHex.row;
    }
    if (mission.seaSiteKey) return String(mission.seaSiteKey);
    if (mission.wtwSiteHexId) return String(mission.wtwSiteHexId);
    if (mission.galaxyHexId) return String(mission.galaxyHexId);
    return '';
  }

  function recordMissionConsequence(entry) {
    if (typeof window === 'undefined' || typeof window.recordWorldConsequence !== 'function') return;
    try { window.recordWorldConsequence(entry || {}); } catch (_err) {}
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
    if (typeof updateFactionRenownUI === 'function') {
      try { updateFactionRenownUI(); } catch (err) {}
    }
  }

  function applyFactionStandingFailureDelta(gainKey, loseKey) {
    if (!gainKey || !loseKey) { return; }
    if (typeof changeFactionRenown === 'function') {
      changeFactionRenown(gainKey, -1);
      changeFactionRenown(loseKey, 1);
      return;
    }
    S.factionRenown = S.factionRenown || { corporations:0, religious:0, political:0, military:0, underworld:0 };
    S.factionRenown[gainKey] = Math.max(-10, Math.min(12, (S.factionRenown[gainKey] || 0) - 1));
    S.factionRenown[loseKey] = Math.max(-10, Math.min(12, (S.factionRenown[loseKey] || 0) + 1));
    if (typeof updateFactionRenownUI === 'function') {
      try { updateFactionRenownUI(); } catch (err) {}
    }
  }

  function makeMission(title, difficulty, location, region, factionData, missionOptions) {
    var diff = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var f = factionData || pickFactionConflict(getMissionConsequenceBias());
    var opts = missionOptions || {};
    var stepNames = opts.stepNames || {};
    var currentDayStamp = getCurrentGameDayStamp();
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
      wtwHexId: opts.wtwHexId || null,
      wtwInformerHexId: opts.wtwInformerHexId || null,
      wtwSiteHexId: opts.wtwSiteHexId || null,
      wtwZone: opts.wtwZone || '',
      wtwDistrict: opts.wtwDistrict || '',
      missionType: opts.missionType || 'standard',
      contractPathway: opts.contractPathway || null,
      storyTheme: opts.storyTheme || '',
      templateId: opts.templateId || '',
      templateLabel: opts.templateLabel || '',
      lore: opts.lore || '',
      arcChain: opts.arcChain || null,
      soulBoss: opts.soulBoss || '',
      soulMission: !!opts.soulMission,
      factionContract: opts.factionContract || null,
      checkpoints: Array.isArray(opts.checkpoints) ? opts.checkpoints.slice() : [],
      step1Intro: opts.step1Intro || '',
      noFactionDelta: !!opts.noFactionDelta,
      deityPact: opts.deityPact || null,
      steps:{
        1:{name:stepNames[1] || 'Gather Information',required:false,completed:false,skipped:false},
        2:{name:stepNames[2] || 'Go to Site',        required:true, completed:false},
        3:{name:stepNames[3] || 'Confrontation',     required:true, completed:false}
      },
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      acceptedDayStamp: currentDayStamp,
      deadlineDayStamp: currentDayStamp + MISSION_DEADLINE_DAYS
    };
  }

  function getCurrentGameDayStamp() {
    var gd = (typeof S !== 'undefined' && S && S.gameDate && typeof S.gameDate === 'object') ? S.gameDate : null;
    if (!gd) return 0;
    var year = Math.max(1, Number(gd.year || 1));
    var month = Math.max(1, Number(gd.month || 1));
    var day = Math.max(1, Number(gd.day || 1));
    return ((year - 1) * 360) + ((month - 1) * 30) + day;
  }

  function ensureMissionDeadline(mission) {
    if (!mission || typeof mission !== 'object') return;
    var acceptedStamp = Number(mission.acceptedDayStamp || mission.createdDayStamp || 0);
    if (!acceptedStamp) acceptedStamp = getCurrentGameDayStamp();
    mission.acceptedDayStamp = acceptedStamp;
    if (!mission.acceptedAt) mission.acceptedAt = mission.createdAt || new Date().toISOString();
    if (!Number(mission.deadlineDayStamp || 0)) mission.deadlineDayStamp = acceptedStamp + MISSION_DEADLINE_DAYS;
  }

  function getMissionDaysRemaining(mission) {
    ensureMissionDeadline(mission);
    return Number(mission.deadlineDayStamp || 0) - getCurrentGameDayStamp();
  }

  function autoFailExpiredMissions(reason) {
    ensureState();
    if (_missionExpiryGuard) return 0;
    var expired = (S.activeMissions || []).filter(function(mission) {
      ensureMissionDeadline(mission);
      return getMissionDaysRemaining(mission) < 0;
    });
    if (!expired.length) return 0;
    _missionExpiryGuard = true;
    try {
      expired.forEach(function(mission) {
        resolveMission(mission.id, false, { expired: true, reason: reason || 'deadline-expired' });
      });
    } finally {
      _missionExpiryGuard = false;
    }
    return expired.length;
  }

  function generateMissions() {
    ensureState();
    S.availableJobs = [];
    var seed = Date.now();
    var count = Math.max(1, Math.min(4, roll(4)));
    var activePanel = document.querySelector('.tab-panel.active');
    var activeTabId = activePanel ? activePanel.id : '';
    var forceRegion = null;
    var bias = getMissionConsequenceBias();
    var arcState = ensureMissionDirectorState();
    // Collect rumors from selected hex and inject verb bias
    var rumorVerbBonus = [];
    try {
      if (typeof window !== 'undefined' && typeof window.getHexRumors === 'function') {
        var _selKey = '';
        if (typeof window.getProvinceSelectedKey === 'function') _selKey = String(window.getProvinceSelectedKey() || '');
        if (!_selKey && window.selectedHex && typeof window.selectedHex.col === 'number') {
          _selKey = window.selectedHex.col + ',' + window.selectedHex.row;
        }
        if (_selKey) {
          var _rumors = window.getHexRumors(_selKey) || [];
          _rumors.forEach(function(r) {
            var rt = Array.isArray(r.tags) ? r.tags : [];
            if (rt.indexOf('crackdown-escalated') >= 0 || rt.indexOf('instability-ripple') >= 0) {
              rumorVerbBonus.push('Resist','Survive','Evacuate','Shield');
            }
            if (rt.indexOf('smuggler-route') >= 0 || rt.indexOf('discovered-route') >= 0) {
              rumorVerbBonus.push('Escort','Move','Guide','Transport');
            }
            if (rt.indexOf('intel-gathered') >= 0 || rt.indexOf('intel-blowback') >= 0) {
              rumorVerbBonus.push('Investigate','Surveil','Expose','Track');
            }
            if (rt.indexOf('backchannel-opened') >= 0 || rt.indexOf('bribe-paid') >= 0 || rt.indexOf('contract-signed') >= 0) {
              rumorVerbBonus.push('Negotiate','Broker','Infiltrate','Secure');
            }
            if (rt.indexOf('civic-aid') >= 0) {
              rumorVerbBonus.push('Protect','Deliver','Rescue','Aid');
            }
          });
        }
      }
    } catch (_rve) {}
    if (rumorVerbBonus.length && Array.isArray(bias.preferredVerbs)) {
      bias.preferredVerbs = bias.preferredVerbs.concat(rumorVerbBonus);
    } else if (rumorVerbBonus.length) {
      bias.preferredVerbs = rumorVerbBonus;
    }
    if (activeTabId === 'tab-galaxy') forceRegion = 'galaxy';
    else if (activeTabId === 'tab-lastsea') forceRegion = 'sea';
    else if (activeTabId === 'tab-map') forceRegion = 'province';
    for (var i = 0; i < count; i++) {
      var tpl = chooseMissionTemplate(bias);
      var diffKey = pick(DIFF_KEYS);
      var diffIdx = Math.max(0, DIFF_KEYS.indexOf(diffKey));
      diffIdx = Math.max(0, Math.min(DIFF_KEYS.length - 1, diffIdx + Number(bias.difficultyShift || 0)));
      diffKey = DIFF_KEYS[diffIdx] || diffKey;
      var diff    = DIFFICULTIES[diffKey];
      var f = pickFactionConflict(bias);
      var regionPool = getAvailableMissionRegions();
      var region = forceRegion || pick(regionPool);
      if (!forceRegion && bias.focusRegion && regionPool.indexOf(bias.focusRegion) >= 0 && Math.random() < 0.45) {
        region = bias.focusRegion;
      }
      var planetTarget = region === 'galaxy' ? getGalaxyPlanetMissionTarget() : null;
      var templateVerbs = (tpl && Array.isArray(tpl.verbs) && tpl.verbs.length) ? tpl.verbs : MISSION_VERBS;
      var verbPool = Array.isArray(bias.preferredVerbs) && bias.preferredVerbs.length ? bias.preferredVerbs.concat(templateVerbs) : templateVerbs;
      var useArcSlot = (tpl && tpl.id === 'soul_mission') ? false : (i === 0 || (Math.random() < 0.35));
      if (useArcSlot) {
        if (!arcState.activeArcId) {
          arcState.activeArcId = pickRegionalArcId(bias);
          arcState.stageIndex = 0;
        }
        var arcJob = buildArcJobFromState(arcState, bias, region, f, seed, i);
        if (arcJob) {
          S.availableJobs.push(arcJob);
          continue;
        }
      }
      if (tpl && tpl.id === 'soul_mission') {
        var soulBoss = pick(SOUL_MISSION_BOSSES);
        var soulLocation = pick(SOUL_MISSION_LOCS);
        S.availableJobs.push({
          id:seed + i + 1,
          title:'Soul Mission: ' + soulBoss,
          difficulty:'very_hard',
          dread:(DIFFICULTIES.very_hard || DIFFICULTIES.hard).dread,
          location:soulLocation,
          planetHexId:planetTarget ? planetTarget.planetHexId : null,
          planetName:planetTarget ? planetTarget.planetName : '',
          reward:Math.max(350, Number(DIFFICULTIES.very_hard.credits || 400) + Number(bias.rewardBonus || 0)),
          region:region,
          missionType:'soul_mission',
          templateId:'soul_mission',
          templateLabel:'Soul Mission',
          stepNames:(tpl && tpl.stepNames) || null,
          factionGain:f.gain,
          factionLose:f.lose,
          factionGainName:f.gainName,
          factionLoseName:f.loseName,
          lore:'Endgame hunt for ' + soulBoss + '. Taking its soul unlocks the Soul Forge.',
          soulBoss:soulBoss
        });
        continue;
      }
      S.availableJobs.push({
        id:seed + i + 1,
        title:pick(verbPool)+' '+pick(MISSION_TARGETS),
        difficulty:diffKey,
        dread:diff.dread,
        location:planetTarget ? planetTarget.location : getMissionLocationForRegion(region),
        planetHexId:planetTarget ? planetTarget.planetHexId : null,
        planetName:planetTarget ? planetTarget.planetName : '',
        reward:Math.max(25, Number(diff.credits || 0) + Number(bias.rewardBonus || 0)),
        region:region,
        missionType: (tpl && tpl.missionType) || 'standard',
        templateId: (tpl && tpl.id) || 'standard',
        templateLabel: (tpl && tpl.label) || 'Standard Contract',
        stepNames: (tpl && tpl.stepNames) || null,
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
    }, {
      missionType: job.missionType || 'standard',
      templateId: job.templateId || 'standard',
      stepNames: job.stepNames || null,
      lore: job.lore || '',
      arcChain: job.arcChain || null,
      soulBoss: job.soulBoss || '',
      soulMission: job.missionType === 'soul_mission' ? true : false
    });
    if (job.region === 'galaxy') {
      mission.planetHexId = job.planetHexId || null;
      mission.planetName = job.planetName || '';
    }
    mission.acceptedAt = new Date().toISOString();
    mission.acceptedDayStamp = getCurrentGameDayStamp();
    mission.deadlineDayStamp = mission.acceptedDayStamp + MISSION_DEADLINE_DAYS;
    S.activeMissions.push(mission);
    S.availableJobs = S.availableJobs.filter(function(j){return String(j.id)!==String(jobId);});
    assignMissionToken(mission);
    renderMissionBoard();
    renderMissionTracker();
    showNotif('Mission accepted: '+mission.title,'good');
    recordMissionConsequence({
      system: 'missions',
      title: 'Mission accepted: ' + String(mission.title || 'Contract'),
      detail: String(mission.location || '') + ' [' + String(mission.region || 'province').toUpperCase() + ']',
      region: String(mission.region || 'province'),
      locationKey: getMissionLocationKey(mission),
      severity: 'info',
      deltas: { rumor: 1, witness: 1 },
      tags: ['mission-board', 'discovered-route', String(mission.missionType || 'standard')]
    });
  }

  function refreshMissionSurfaces() {
    try { renderMissionTracker(); } catch (_err) {}
    try {
      if (typeof window.refreshQuickPanelSection === 'function') {
        window.refreshQuickPanelSection('missions');
      }
    } catch (_err2) {}
  }

  var _missionAutoAdvanceGuard = { key: '', at: 0 };
  function canAutoAdvanceMission(missionId, tokenType, regionTag) {
    var now = Date.now();
    var mode = (typeof window.getMissionMapAutoAdvanceMode === 'function') ? window.getMissionMapAutoAdvanceMode() : 'click';
    var travelToken = 'click';
    if (mode === 'day') {
      var gd = (typeof S !== 'undefined' && S && S.gameDate) ? S.gameDate : null;
      travelToken = gd
        ? [gd.year || 1, gd.month || 1, gd.day || 1].join('|')
        : 'day-unknown';
    }
    var key = String(regionTag || 'region') + '|' + String(missionId || '') + '|' + String(tokenType || '') + '|' + travelToken;
    var dedupeWindow = mode === 'day' ? 60000 : 500;
    if (_missionAutoAdvanceGuard.key === key && (now - Number(_missionAutoAdvanceGuard.at || 0)) < dedupeWindow) {
      return false;
    }
    _missionAutoAdvanceGuard = { key: key, at: now };
    return true;
  }

  function openSoulForgeTokenEncounter(missionId, regionTag) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'soul_mission') return false;
    if (!mission.steps || !mission.steps[2] || !mission.steps[2].completed) {
      startMissionStep2(mission.id);
      return true;
    }
    if (mission.steps[3] && mission.steps[3].completed) {
      if (typeof showNotif === 'function') showNotif('This Soul Forge target has already been defeated.', 'info');
      return false;
    }

    var boss = String(mission.soulBoss || 'Soul Creature');
    var regionLabel = String(regionTag || mission.region || 'province').toLowerCase();
    openModal(
      'Soul Forge Encounter',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.9rem;color:var(--gold2);margin-bottom:.14rem;">⚒ ' + boss + '</div>'
        + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.26rem;">'
          + 'Region: ' + regionLabel + ' · Profile: d12 | 24 HP · Unique abilities enabled.'
        + '</div>'
        + '<div style="border:1px solid rgba(255,255,255,.12);padding:.3rem .38rem;background:rgba(255,255,255,.03);margin-bottom:.28rem;">'
          + '<div style="font-size:.72rem;color:var(--teal);margin-bottom:.12rem;">Fight Rules</div>'
          + '<div style="font-size:.72rem;color:var(--text2);line-height:1.45;">'
            + 'Win the popup battle to take the creature\'s affix and complete Step 3. '
            + 'The fight remains in the 🌌 Stars Combat hex map popup.'
          + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
          + '<button class="btn btn-sm" onclick="closeModal()">Not Now</button>'
          + '<button class="btn btn-sm btn-primary" onclick="window.startSoulForgeEncounterFromToken(' + mission.id + ',\'' + regionLabel + '\')">Fight</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  function startSoulForgeEncounterFromToken(missionId, regionTag) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'soul_mission') return false;
    if (!mission.steps || !mission.steps[2] || !mission.steps[2].completed) {
      startMissionStep2(mission.id);
      return true;
    }
    if (typeof closeModal === 'function') closeModal();
    var title = 'Soul Forge Mission - ' + String(mission.soulBoss || 'Soul Creature');
    var hexKey = String(regionTag || mission.region || 'province') + '-soul-' + String(mission.id || '0');
    var flow = null;
    if (typeof window.seedArenaCombat === 'function') {
      flow = window.seedArenaCombat('soul', {
        hexKey: hexKey,
        title: title,
        bossName: String(mission.soulBoss || 'Soul Creature')
      });
    }
    if (flow && typeof flow === 'object') {
      flow.mode = 'soul';
      flow.soulMissionId = mission.id;
      if (flow.enemy) {
        flow.enemy.dread = 12;
        flow.enemy.maxStress = 24;
        flow.enemy.stress = 0;
      }
    }
    if (S && Array.isArray(S.enemies)) {
      for (var i = 0; i < S.enemies.length; i++) {
        var enemy = S.enemies[i];
        if (!enemy || enemy.ally) continue;
        enemy.name = String(mission.soulBoss || enemy.name || 'Soul Creature');
        enemy.dread = 12;
        enemy.maxStress = 24;
        enemy.health = 24;
        enemy.stress = Math.max(0, Number(enemy.stress || 0));
        enemy.specialAction = {
          name: 'Soul Rend',
          text: 'The creature tears through your aura and tries to bind an affix brand.'
        };
      }
    }
    if (typeof window.openArenaCombatPopup === 'function') {
      window.openArenaCombatPopup({ mode: 'soul', hexKey: hexKey, title: title });
      if (typeof showNotif === 'function') showNotif('Soul Forge combat opened in popup mode.', 'good');
      return true;
    }
    if (typeof showNotif === 'function') showNotif('Unable to open Soul Forge popup combat.', 'warn');
    return false;
  }

  function resolveSoulForgeEncounter() {
    var flow = S && S.combat && S.combat.arenaFlow ? S.combat.arenaFlow : null;
    if (!flow || String(flow.mode || '') !== 'soul') return false;
    var hasHostiles = Array.isArray(S.enemies) && S.enemies.some(function (enemy) {
      return enemy && !enemy.ally && Number(enemy.stress || 0) < Number(enemy.maxStress || 0);
    });
    if (hasHostiles) {
      if (typeof showNotif === 'function') showNotif('Defeat the Soul Creature before claiming its affix.', 'warn');
      return false;
    }
    var mission = getMission(flow.soulMissionId || flow.missionId);
    if (!mission || mission.missionType !== 'soul_mission') {
      if (typeof showNotif === 'function') showNotif('Soul mission record was not found.', 'warn');
      return false;
    }
    if (typeof closeModal === 'function') closeModal();
    resolveMission(mission.id, true, { soulPopup: true });
    if (S && S.combat && S.combat.arenaFlow) {
      S.combat.arenaFlow.active = false;
      S.combat.arenaFlow.completed = true;
    }
    if (typeof showNotif === 'function') showNotif('Soul Creature defeated. Affix claimed.', 'good');
    return true;
  }

  function autoAdvanceMissionByToken(missionId, tokenType, regionTag) {
    var mission = getMission(missionId);
    if (!mission) return false;
    if (mission.missionType === 'legacy_raid') {
      return handleLegacyRaidMarkerInteraction(mission.id, tokenType, regionTag || mission.region || 'region');
    }
    var type = String(tokenType || '').toLowerCase();
    if (!canAutoAdvanceMission(mission.id, type, regionTag || mission.region || 'region')) return false;
    if ((type === 'informer' || type === 'holding_info') && mission.steps[1] && !mission.steps[1].completed) {
      startMissionStep1(mission.id);
      return true;
    }
    if ((type === 'site' || type === 'holding_site') && mission.steps[2] && !mission.steps[2].completed) {
      startMissionStep2(mission.id);
      return true;
    }
    if ((type === 'site' || type === 'holding_site') && mission.missionType === 'soul_mission' && mission.steps[2] && mission.steps[2].completed && mission.steps[3] && !mission.steps[3].completed) {
      return openSoulForgeTokenEncounter(mission.id, regionTag || mission.region || 'region');
    }
    if ((type === 'site' || type === 'holding_site') && mission.steps[2] && mission.steps[2].completed && mission.steps[3] && !mission.steps[3].completed) {
      startMissionStep3(mission.id);
      return true;
    }
    return false;
  }

  function autoAdvanceMissionFromProvinceHex(hex) {
    if (!hex || typeof hex.col !== 'number' || typeof hex.row !== 'number' || !S || !S.missionTokens) return false;
    var key = String(hex.col) + ',' + String(hex.row);
    var token = S.missionTokens[key];
    if (!token || !token.missionId) return false;
    if (token.missionId === 'solar_cycle_story' && typeof window.resolveSolarCycleProvinceStoryMarker === 'function') {
      return !!window.resolveSolarCycleProvinceStoryMarker(hex, token);
    }
    if (token.missionId === 'solar_cycle' && typeof window.resolveSolarCycleProvinceMarker === 'function') {
      return !!window.resolveSolarCycleProvinceMarker(hex, token);
    }
    return autoAdvanceMissionByToken(token.missionId, token.type, 'province');
  }

  function autoAdvanceMissionFromSeaHex(hexKey) {
    if (!S || !S.lastSea || !S.lastSea.missionTokens) return false;
    var token = S.lastSea.missionTokens[String(hexKey || '')];
    if (!token || !token.missionId) return false;
    if (token.missionId === 'solar_cycle_story' && typeof window.resolveSolarCycleSeaMarker === 'function') {
      return !!window.resolveSolarCycleSeaMarker(hexKey, token);
    }
    return autoAdvanceMissionByToken(token.missionId, token.type, 'sea');
  }

  function ensureLegacyRaidRunState(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidRun || typeof mission.legacyRaidRun !== 'object') {
      mission.legacyRaidRun = {
        currentWing: 1,
        checkpointWing: 1,
        wipes: 0,
        revivesUsed: 0,
        reviveCreditsSpent: 0,
        wingFailures: { 1: 0, 2: 0, 3: 0 },
        wingClean: { 1: false, 2: false, 3: false },
        abilityUses: 0,
        pendingReviveCost: 0,
        pendingWing: 0,
        clockRemaining: 0
      };
    }
    if (!mission.legacyRaidRun.wingEntryReset || typeof mission.legacyRaidRun.wingEntryReset !== 'object') {
      mission.legacyRaidRun.wingEntryReset = { 1: false, 2: false, 3: false };
    }
    return mission.legacyRaidRun;
  }

  function ensureLegacyRaidPerks(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return {};
    if (!mission.legacyRaidPerks || typeof mission.legacyRaidPerks !== 'object') {
      mission.legacyRaidPerks = {
        interruptWindow: 0,
        freeRecoverPerWing: 0,
        gamblingChipBonus: 0,
        wayfarerAssistBonus: 0
      };
    }
    return mission.legacyRaidPerks;
  }

  function ensureLegacyRaidResourcePools(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return null;
    if (!run.raidResources || typeof run.raidResources !== 'object') {
      run.raidResources = { focus: 3, momentum: 3, guard: 2 };
    }
    return run.raidResources;
  }

  function resetLegacyRaidResourcePools(mission) {
    var resources = ensureLegacyRaidResourcePools(mission);
    if (!resources) return null;
    resources.focus = 3;
    resources.momentum = 3;
    resources.guard = 2;
    return resources;
  }

  function getLegacyRaidWayfarerActionDie() {
    try {
      var armorText = '';
      if (typeof S !== 'undefined' && S && S.equipment && S.equipment.armor) {
        armorText = String(S.equipment.armor || '');
      }
      if (!armorText) {
        var armorInput = document.getElementById('eqArmor');
        if (armorInput && armorInput.value) armorText = String(armorInput.value || '');
      }
      var m = armorText.match(/ad\s*(4|6|8|10|12|20)/i);
      if (m && m[1]) return stepMissionDreadDieBy(Number(m[1]), getLegacyRaidTalentRank('action_die_training'));
    } catch (_err) {}
    var base = typeof getStat === 'function' ? Number(getStat('adventure') || 8) : 8;
    return stepMissionDreadDieBy(base, getLegacyRaidTalentRank('action_die_training'));
  }

  function getLegacyRaidTalentRank(nodeId) {
    if (typeof S === 'undefined' || !S || !S.solarCycleLegacy || !S.solarCycleLegacy.raidTreeRanks) return 0;
    return Math.max(0, Number(S.solarCycleLegacy.raidTreeRanks[String(nodeId || '')] || 0));
  }

  function ensureLegacyRaidProfile() {
    ensureState();
    if (typeof S === 'undefined' || !S) return null;
    if (!S.solarCycleLegacy || typeof S.solarCycleLegacy !== 'object') {
      S.solarCycleLegacy = {
        raidMedals: 0,
        raidPoints: 0,
        raidTreeRanks: {},
        raidKeys: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        raidTrophies: [],
        raidOverflowLoot: []
      };
    }
    if (!S.solarCycleLegacy.raidTreeRanks || typeof S.solarCycleLegacy.raidTreeRanks !== 'object') {
      S.solarCycleLegacy.raidTreeRanks = {};
    }
    if (!S.solarCycleLegacy.raidKeys || typeof S.solarCycleLegacy.raidKeys !== 'object') {
      S.solarCycleLegacy.raidKeys = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    }
    if (!Array.isArray(S.solarCycleLegacy.raidTrophies)) S.solarCycleLegacy.raidTrophies = [];
    if (!Array.isArray(S.solarCycleLegacy.raidOverflowLoot)) S.solarCycleLegacy.raidOverflowLoot = [];
    S.solarCycleLegacy.raidMedals = Math.max(0, Number(S.solarCycleLegacy.raidMedals || 0));
    S.solarCycleLegacy.raidPoints = Math.max(0, Number(S.solarCycleLegacy.raidPoints || 0));
    ['bronze', 'silver', 'gold', 'platinum'].forEach(function (tier) {
      S.solarCycleLegacy.raidKeys[tier] = Math.max(0, Number(S.solarCycleLegacy.raidKeys[tier] || 0));
    });
    return S.solarCycleLegacy;
  }

  var LEGACY_RAID_TREE_NODES = [
    {
      id: 'action_die_training',
      label: 'Action Die Training',
      maxRank: 3,
      costs: [{ points: 2, medals: 1 }, { points: 4, medals: 2 }, { points: 6, medals: 3 }],
      detail: 'Upgrade all action dice by one step per rank (d4→d6→d8→d10→d12→d20).'
    },
    {
      id: 'strike_mastery',
      label: 'Strike Mastery',
      maxRank: 2,
      costs: [{ points: 2, medals: 1 }, { points: 3, medals: 2 }],
      detail: 'Gain +1 Strike pressure at rank 1, +3 at rank 2.'
    },
    {
      id: 'raid_tick_overclock',
      label: 'Raid Tick Overclock',
      maxRank: 3,
      costs: [{ points: 2, medals: 1 }, { points: 4, medals: 2 }, { points: 6, medals: 3 }],
      detail: 'Gain +10 max ticks in raids at rank 1, +20 at rank 2, +30 at rank 3.'
    },
    {
      id: 'teamwork_feedback',
      label: 'Teamwork Feedback',
      maxRank: 1,
      costs: [{ points: 3, medals: 2 }],
      detail: 'Unlock allied teamwork feedback during pressure windows and halve Teamwork burst costs in raids.'
    },
    {
      id: 'flavor_boss_personal',
      label: 'Boss Personal Flavors',
      maxRank: 1,
      costs: [{ points: 4, medals: 2 }],
      detail: 'Unlock raid boss personal flavor branches tied to active boss themes.'
    },
    {
      id: 'flavor_glacial_tell',
      label: 'Glacial Tell Branch',
      maxRank: 1,
      costs: [{ points: 3, medals: 1 }],
      detail: 'Unlock Glacial Tell raid flavor branch.'
    },
    {
      id: 'flavor_null_veil',
      label: 'Null Veil Branch',
      maxRank: 1,
      costs: [{ points: 3, medals: 1 }],
      detail: 'Unlock Null Veil raid flavor branch.'
    }
  ];

  function getLegacyRaidTreeNode(nodeId) {
    var key = String(nodeId || '');
    for (var i = 0; i < LEGACY_RAID_TREE_NODES.length; i++) {
      if (LEGACY_RAID_TREE_NODES[i].id === key) return LEGACY_RAID_TREE_NODES[i];
    }
    return null;
  }

  function getLegacyRaidTreeNodeCost(node, currentRank) {
    if (!node) return null;
    var idx = Math.max(0, Number(currentRank || 0));
    var costs = Array.isArray(node.costs) ? node.costs : [];
    if (!costs.length) return { points: 0, medals: 0 };
    return costs[Math.min(costs.length - 1, idx)] || { points: 0, medals: 0 };
  }

  function addLegacyRaidKeys(keys) {
    var profile = ensureLegacyRaidProfile();
    if (!profile || !keys) return { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    var gained = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    ['bronze', 'silver', 'gold', 'platinum'].forEach(function (tier) {
      var n = Math.max(0, Number(keys[tier] || 0));
      if (!n) return;
      profile.raidKeys[tier] = Math.max(0, Number(profile.raidKeys[tier] || 0) + n);
      gained[tier] = n;
    });
    return gained;
  }

  function getLegacyRaidWaypointMazePreset(cellId, wingNum) {
    // Deterministically seed a hash from cellId + wingNum, then procedurally generate a 5x5 maze.
    var seed = String(cellId || '') + ':' + String(wingNum || 1);
    var h = 0;
    for (var i = 0; i < seed.length; i++) { h = (Math.imul ? Math.imul(31, h) : h * 31) + seed.charCodeAt(i) | 0; }
    h = Math.abs(h);
    var ROWS = 5, COLS = 6;
    var grid = [];
    var r, c;
    for (r = 0; r < ROWS; r++) {
      var row = [];
      for (c = 0; c < COLS; c++) row.push('.');
      grid.push(row);
    }
    // Start top-left, Exit bottom-right
    grid[0][0] = 'S';
    grid[ROWS - 1][COLS - 1] = 'E';
    // Carve a guaranteed path using the seed
    var pathR = 0, pathC = 0;
    var visited = {};
    visited['0:0'] = true;
    var pathMoves = [];
    var attempts = 0;
    while (pathR !== ROWS - 1 || pathC !== COLS - 1) {
      attempts++;
      if (attempts > 200) break;
      var needRight = COLS - 1 - pathC;
      var needDown = ROWS - 1 - pathR;
      var total = needRight + needDown + 1;
      var rval = (h % total + total) % total;
      h = (h * 1664525 + 1013904223) & 0x7fffffff;
      var moved = false;
      if (rval < needRight + 1 && pathC < COLS - 1 && !visited[pathR + ':' + (pathC + 1)]) {
        pathC++; pathMoves.push('R'); visited[pathR + ':' + pathC] = true; moved = true;
      } else if (pathR < ROWS - 1 && !visited[(pathR + 1) + ':' + pathC]) {
        pathR++; pathMoves.push('D'); visited[pathR + ':' + pathC] = true; moved = true;
      } else if (pathC < COLS - 1) {
        pathC++; pathMoves.push('R'); visited[pathR + ':' + pathC] = true; moved = true;
      } else if (pathR < ROWS - 1) {
        pathR++; pathMoves.push('D'); visited[pathR + ':' + pathC] = true; moved = true;
      } else { break; }
    }
    // Mark path in grid
    var pr = 0, pc = 0;
    pathMoves.forEach(function (m) {
      if (m === 'R') pc++; else pr++;
      if (!(pr === ROWS - 1 && pc === COLS - 1) && grid[pr][pc] === '.') grid[pr][pc] = '.';
    });
    // Seed walls on non-path cells
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (grid[r][c] !== '.' && grid[r][c] !== 'E' && grid[r][c] !== 'S') continue;
        if (r === 0 && c === 0) continue;
        if (r === ROWS - 1 && c === COLS - 1) continue;
        if (visited[r + ':' + c]) continue;
        h = (h * 1664525 + 1013904223) & 0x7fffffff;
        if (h % 3 === 0) grid[r][c] = '#';
      }
    }
    // Build layout strings
    var layout = grid.map(function (row) { return row.join(''); });
    return { layout: layout, answer: pathMoves.join('-') };
  }

  function getLegacyRaidChallengeMazePreset(cellId, wingNum) {
    var seed = String(cellId || '') + ':raid:' + String(wingNum || 1);
    var h = 0;
    for (var i = 0; i < seed.length; i++) { h = (Math.imul ? Math.imul(37, h) : h * 37) + seed.charCodeAt(i) | 0; }
    h = Math.abs(h);
    var ROWS = 6, COLS = 6;
    var grid = [];
    var r, c;
    for (r = 0; r < ROWS; r++) {
      var row = [];
      for (c = 0; c < COLS; c++) row.push('.');
      grid.push(row);
    }
    grid[0][0] = 'S';
    grid[ROWS - 1][COLS - 1] = 'E';
    var pathR = 0, pathC = 0;
    var pathMoves = [];
    var attempts = 0;
    while (pathR !== ROWS - 1 || pathC !== COLS - 1) {
      attempts++;
      if (attempts > 500) break;
      var canRight = pathC < COLS - 1;
      var canDown = pathR < ROWS - 1;
      if (!canRight && !canDown) break;
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      var chooseRight = canRight && (!canDown || (h % 3 !== 0));
      if (chooseRight) {
        pathC++;
        pathMoves.push('R');
      } else {
        pathR++;
        pathMoves.push('D');
      }
    }
    var pr = 0, pc = 0;
    var pathMap = { '0:0': true };
    for (var pi = 0; pi < pathMoves.length; pi++) {
      if (pathMoves[pi] === 'R') pc++; else pr++;
      pathMap[String(pr) + ':' + String(pc)] = true;
    }
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (r === 0 && c === 0) continue;
        if (r === ROWS - 1 && c === COLS - 1) continue;
        if (pathMap[String(r) + ':' + String(c)]) continue;
        h = (h * 1664525 + 1013904223) & 0x7fffffff;
        if (h % 4 === 0) grid[r][c] = '#';
      }
    }
    return {
      layout: grid.map(function (line) { return line.join(''); }),
      answer: pathMoves.join('-')
    };
  }

  function renderLegacyRaidTreePanel() {
    var panel = typeof document !== 'undefined' ? document.getElementById('raidTreePanel') : null;
    if (!panel) return false;
    var profile = ensureLegacyRaidProfile();
    if (!profile) {
      panel.innerHTML = '<div style="font-size:.78rem;color:var(--muted2);">Create or load a character to initialize raid progression.</div>';
      return false;
    }
    var medalCount = Math.max(0, Number(profile.raidMedals || 0));
    var pointCount = Math.max(0, Number(profile.raidPoints || 0));
    var keyState = profile.raidKeys || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    var iconApi = typeof window !== 'undefined' ? window.SharedIconSystem : null;
    var overflow = Array.isArray(profile.raidOverflowLoot) ? profile.raidOverflowLoot : [];
    var overflowStart = Math.max(0, overflow.length - 48);
    var overflowRows = overflow.length
      ? overflow.slice(overflowStart).map(function (item, idx) {
          var absoluteIndex = overflowStart + idx;
          return '<div style="padding:.06rem 0;border-bottom:1px solid rgba(255,255,255,.06);display:grid;grid-template-columns:1fr auto auto;gap:.16rem;align-items:center;">'
            + '<div>' + String(item || 'Unknown Loot') + '</div>'
            + '<button class="btn btn-xs" onclick="claimLegacyRaidOverflowLootAt(' + absoluteIndex + ')">Backpack</button>'
            + '<button class="btn btn-xs" onclick="sellLegacyRaidOverflowLootAt(' + absoluteIndex + ')">Sell</button>'
            + '</div>';
        }).reverse().join('')
      : '';
    var keyRow = ['bronze', 'silver', 'gold', 'platinum'].map(function (tier) {
      return '<span style="font-size:.68rem;color:var(--gold2);">' + tier.charAt(0).toUpperCase() + tier.slice(1) + ' Key x' + Math.max(0, Number(keyState[tier] || 0)) + '</span>';
    }).join(' · ');
    var medalSummaryHtml = iconApi && typeof iconApi.getRaidMedalStripHtml === 'function'
      ? iconApi.getRaidMedalStripHtml(medalCount, { size: 20, label: 'Raid Medals' })
      : ('Medals: ' + medalCount);
    function chestLabelHtml(tier, label) {
      return iconApi && typeof iconApi.getRaidChestLabelHtml === 'function'
        ? iconApi.getRaidChestLabelHtml(tier, label, { size: 20 })
        : label;
    }
    var raidNodeAccents = {
      action_die_training: '#7ed7ff',
      strike_mastery: '#f08b6c',
      raid_tick_overclock: '#ffd56a',
      teamwork_feedback: '#67d6b3',
      flavor_boss_personal: '#c39cff',
      flavor_glacial_tell: '#9be9ff',
      flavor_null_veil: '#b18dff'
    };
    var raidNodeLane = {
      action_die_training: 'Core',
      strike_mastery: 'Combat',
      raid_tick_overclock: 'Tempo',
      teamwork_feedback: 'Teamwork',
      flavor_boss_personal: 'Lore',
      flavor_glacial_tell: 'Lore',
      flavor_null_veil: 'Lore'
    };
    var nodeHtml = LEGACY_RAID_TREE_NODES.map(function (node) {
      var rank = getLegacyRaidTalentRank(node.id);
      var maxRank = Math.max(1, Number(node.maxRank || 1));
      var capped = rank >= maxRank;
      var cost = getLegacyRaidTreeNodeCost(node, rank);
      var affordable = !capped && pointCount >= Number(cost.points || 0) && medalCount >= Number(cost.medals || 0);
      var fillPct = Math.max(0, Math.min(100, Math.round((rank / maxRank) * 100)));
      var accent = raidNodeAccents[node.id] || '#7ed7ff';
      var lane = raidNodeLane[node.id] || 'Core';
      var rankText = 'Rank ' + rank + '/' + maxRank;
      var costText = capped ? 'Maxed' : ('Cost: ' + Number(cost.points || 0) + ' RP · ' + Number(cost.medals || 0) + ' Medals');
      return '<div style="position:relative;border:1px solid rgba(255,255,255,.16);background:linear-gradient(160deg, rgba(14,20,28,.92), rgba(10,14,20,.86));padding:.46rem .52rem .5rem .66rem;overflow:hidden;">'
        + '<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:' + accent + ';opacity:.9;"></div>'
        + '<div style="position:absolute;right:.45rem;top:.28rem;color:' + accent + ';font-size:.56rem;letter-spacing:.16em;text-transform:uppercase;opacity:.75;">' + lane + '</div>'
        + '<div style="display:flex;justify-content:space-between;gap:.35rem;align-items:center;">'
        + '<div style="font-size:.75rem;color:var(--text2);"><strong>' + node.label + '</strong></div>'
        + '<div style="font-size:.66rem;color:' + (capped ? 'var(--green2)' : 'var(--gold2)') + ';">' + rankText + '</div>'
        + '</div>'
        + '<div style="margin:.2rem 0 .22rem;height:5px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);">'
        + '<div style="height:100%;width:' + fillPct + '%;background:linear-gradient(90deg,' + accent + ', rgba(255,255,255,.85));"></div>'
        + '</div>'
        + '<div style="font-size:.68rem;color:var(--muted2);line-height:1.45;margin:.12rem 0;">' + node.detail + '</div>'
        + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.2rem;">' + costText + '</div>'
        + '<button class="btn btn-xs ' + (affordable ? 'btn-primary' : '') + '" ' + (capped ? 'disabled' : '')
        + ' onclick="buyLegacyRaidTreeNode(\'' + node.id + '\')">' + (capped ? 'Unlocked' : 'Buy Rank') + '</button>'
        + '</div>';
    }).join('');

    panel.innerHTML = '<div style="font-size:.84rem;color:var(--text2);line-height:1.56;max-width:980px;padding:.35rem;border:1px solid rgba(201,162,39,.22);background:radial-gradient(120% 100% at 0% 0%, rgba(126,215,255,.08), rgba(10,12,18,.95));">'
      + '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:.45rem;">'
      + '<div style="display:grid;gap:.35rem;">'
      + '<div style="border:1px solid rgba(201,162,39,.28);background:linear-gradient(165deg, rgba(201,162,39,.12), rgba(14,18,26,.92));padding:.5rem .55rem;">'
      + '<div style="font-size:.86rem;color:var(--gold2);margin-bottom:.14rem;"><strong>Raid Progression</strong></div>'
      + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Medals and Raid Points from boss clears can be spent on persistent raid talents, then revisited through replay and lore logs.</div>'
      + '<div style="font-size:.64rem;color:rgba(255,255,255,.52);line-height:1.45;margin-top:.12rem;">Lane colors hint at focus: combat pressure, raid tempo, and flavor branches.</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.2rem;">'
      + '<span style="font-size:.58rem;padding:.08rem .18rem;border:1px solid rgba(126,215,255,.35);color:#7ed7ff;">Core</span>'
      + '<span style="font-size:.58rem;padding:.08rem .18rem;border:1px solid rgba(240,139,108,.35);color:#f08b6c;">Combat</span>'
      + '<span style="font-size:.58rem;padding:.08rem .18rem;border:1px solid rgba(255,213,106,.35);color:#ffd56a;">Tempo</span>'
      + '<span style="font-size:.58rem;padding:.08rem .18rem;border:1px solid rgba(103,214,179,.35);color:#67d6b3;">Teamwork</span>'
      + '<span style="font-size:.58rem;padding:.08rem .18rem;border:1px solid rgba(195,156,255,.35);color:#c39cff;">Lore</span>'
      + '</div>'
      + '<div style="font-size:.7rem;color:var(--teal);line-height:1.45;margin-top:.2rem;display:flex;gap:.45rem;flex-wrap:wrap;align-items:center;">' + medalSummaryHtml + '<span>Raid Points: ' + pointCount + '</span></div>'
      + '</div>'
      + '<div style="border:1px dashed rgba(126,215,255,.25);padding:.28rem;background:rgba(10,14,20,.55);display:grid;grid-template-columns:repeat(2,minmax(210px,1fr));gap:.3rem;">' + nodeHtml + '</div>'
      + '</div>'
      + '<div style="display:grid;gap:.35rem;">'
      + '<div style="border:1px solid rgba(201,162,39,.2);background:linear-gradient(150deg, rgba(18,24,32,.95), rgba(10,14,20,.9));padding:.5rem .55rem;">'
      + '<div style="font-size:.78rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Vault Keys</strong></div>'
      + '<div style="font-size:.68rem;color:var(--muted2);line-height:1.45;margin-bottom:.18rem;">' + keyRow + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:.24rem;">'
      + '<button class="btn btn-xs" onclick="openLegacyRaidChest(\'bronze\')">' + chestLabelHtml('bronze', 'Open Bronze Chest') + '</button>'
      + '<button class="btn btn-xs" onclick="openLegacyRaidChest(\'silver\')">' + chestLabelHtml('silver', 'Open Silver Chest') + '</button>'
      + '<button class="btn btn-xs" onclick="openLegacyRaidChest(\'gold\')">' + chestLabelHtml('gold', 'Open Gold Chest') + '</button>'
      + '<button class="btn btn-xs btn-teal" onclick="openLegacyRaidChest(\'platinum\')">' + chestLabelHtml('platinum', 'Open Platinum Chest') + '</button>'
      + '</div>'
      + '</div>'
      + '<div style="border:1px solid rgba(126,215,255,.22);background:linear-gradient(150deg, rgba(14,22,30,.95), rgba(10,14,20,.9));padding:.5rem .55rem;">'
      + '<div style="font-size:.78rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Trophy Shelf</strong></div>'
      + '<div style="font-size:.67rem;color:var(--muted2);line-height:1.42;max-height:180px;overflow:auto;">'
      + (profile.raidTrophies.length
        ? profile.raidTrophies.slice(-12).reverse().map(function (trophy) {
            return iconApi && typeof iconApi.getTrophyEntryHtml === 'function'
              ? iconApi.getTrophyEntryHtml(String(trophy || 'Unknown Trophy'), { size: 22 })
              : ('<div style="padding:.06rem 0;border-bottom:1px solid rgba(255,255,255,.06);">' + String(trophy || 'Unknown Trophy') + '</div>');
          }).join('')
        : 'No raid trophies recorded yet. Clear legacy raids to fill this wall.')
      + '</div>'
      + '</div>'
      + '<div style="border:1px solid rgba(126,215,255,.22);background:linear-gradient(150deg, rgba(14,22,30,.95), rgba(10,14,20,.9));padding:.5rem .55rem;">'
      + '<div style="font-size:.78rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Raid Storage Overflow</strong></div>'
      + '<div style="font-size:.69rem;color:var(--muted2);line-height:1.46;max-height:260px;overflow:auto;padding-right:.15rem;">'
      + (overflow.length ? overflowRows : 'No overflow loot.')
      + '</div>'
      + '<div style="margin-top:.16rem;">'
      + '<button class="btn btn-xs btn-primary" onclick="claimLegacyRaidOverflowLoot()">Claim Overflow To Backpack</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
    return true;
  }

  function renderSoulForgeTabPanel() {
    var hosts = [];
    if (typeof document !== 'undefined') {
      var soulPanel = document.getElementById('soulForgeTabPanel');
      var shopPanel = document.getElementById('shopSoulForgePanel');
      if (soulPanel) hosts.push(soulPanel);
      if (shopPanel) hosts.push(shopPanel);
    }
    if (!hosts.length) return false;
    var forge = null;
    try {
      forge = typeof ensureSoulForgeState === 'function' ? ensureSoulForgeState() : (S.soulForge = S.soulForge || { unlocked:false, inventory:[] });
    } catch (_err) {
      forge = S.soulForge = S.soulForge || { unlocked:false, inventory:[] };
    }
    if (!Array.isArray(forge.inventory)) forge.inventory = [];
    if (!forge.unlocked && !forge.inventory.length) {
      var lockedHtml = '<div class="card"><div class="section-title">Soul Forge</div><div style="font-size:.82rem;color:var(--muted2);line-height:1.5;">Complete a Soul Mission to unlock the forge. Once opened, this page lets you remove, move, and sell affixes.</div></div>';
      hosts.forEach(function (panel) { panel.innerHTML = lockedHtml; });
      return true;
    }
    var openHtml = typeof buildSoulForgeVendorHtml === 'function'
      ? buildSoulForgeVendorHtml()
      : '<div class="card"><div class="section-title">Soul Forge</div><div style="font-size:.82rem;color:var(--muted2);">Forge content unavailable.</div></div>';
    hosts.forEach(function (panel) { panel.innerHTML = openHtml; });
    return true;
  }

  window.buyLegacyRaidTreeNode = function (nodeId) {
    var profile = ensureLegacyRaidProfile();
    var node = getLegacyRaidTreeNode(nodeId);
    if (!profile || !node) return false;
    var rank = getLegacyRaidTalentRank(node.id);
    var cap = Math.max(1, Number(node.maxRank || 1));
    if (rank >= cap) {
      if (typeof showNotif === 'function') showNotif('This raid node is already maxed.', 'info');
      return false;
    }
    var cost = getLegacyRaidTreeNodeCost(node, rank);
    var needPoints = Math.max(0, Number(cost.points || 0));
    var needMedals = Math.max(0, Number(cost.medals || 0));
    if (Number(profile.raidPoints || 0) < needPoints || Number(profile.raidMedals || 0) < needMedals) {
      if (typeof showNotif === 'function') showNotif('Need ' + needPoints + ' Raid Points and ' + needMedals + ' Medals.', 'warn');
      return false;
    }
    profile.raidPoints = Math.max(0, Number(profile.raidPoints || 0) - needPoints);
    profile.raidMedals = Math.max(0, Number(profile.raidMedals || 0) - needMedals);
    profile.raidTreeRanks[node.id] = rank + 1;
    if (typeof showNotif === 'function') showNotif('Unlocked ' + node.label + ' rank ' + (rank + 1) + '.', 'good');
    renderLegacyRaidTreePanel();
    return true;
  };

  function rollLegacyRaidSignatureLoot(tier) {
    var tierKey = String(tier || 'gold').toLowerCase();
    var weaponNames = ['Limbsplit', 'Dyadus', 'Ashpiercer', 'Nullbrand', 'Ruinwake', 'Stormsunder', 'Godsbite', 'Widowlane', 'Hexspike', 'Starrender', 'Emberlash', 'Voidharrow', 'Cinderlaw', 'Relicfang', 'Mooncleaver', 'Nightlance', 'Dreadshard', 'Aegisbreaker', 'Skylacer', 'Gravequill'];
    var armorNames = ['Axiom Plate', 'Riftguard Harness', 'Emberward Bastion', 'Nullweave Carapace', 'Oathshell Cuirass', 'Iron Psalm Mail', 'Skydread Mantle', 'Ash Covenant Suit', 'Vaultbone Plate', 'Stormglass Frame', 'Leviathan Aegis', 'Sunforged Ward', 'Thornbound Shell', 'Dawnkeeper Plate', 'Nightwarden Mail', 'Gilded Exuvia', 'Frostwall Harness', 'Wyrmproof Plate', 'Starbound Bulwark', 'Obsidian Promise'];
    var itemNames = ['Heartcoil Injector', 'Aether Compass', 'Crown of Echoes', 'Chrono Lantern', 'Warden Sigil', 'Mirror Key', 'Abyss Beacon', 'Soul Relay', 'Void Map', 'Oracle Thread', 'Rune Battery', 'Titan Lens', 'Phoenix Flask', 'Gorgon Prism', 'Sphinx Coin', 'Hydra Capsule', 'Thunder Seal', 'Basilisk Ampoule', 'Griffin Banner', 'Minotaur Totem'];

    var regularAffixes = ['Keen', 'Swift', 'Sturdy', 'Brutal', 'Agile', 'Reinforce', 'Fierce', 'Nimble', 'Resilient', 'Balanced', 'Accuracy', 'Range', 'Stealth', 'Piercing', 'Lethal', 'Vicious', 'Silent', 'Distance'];
    var legendaryAffixes = ['Dragon\'s Breath', 'Stormcaller', 'Frostheart', 'Lifedrinker', 'Doombringer', 'Griffin', 'Valkyrie', 'Leviathan', 'Basilisk', 'Djinn', 'Phoenix\'s Resurgence', 'Gorgon\'s Glare', 'Thunderbird\'s Squall', 'Gryphon\'s Roar', 'Behemoth\'s Rage', 'Sphinx\'s Riddle', 'Minotaur\'s Strength', 'Basilisk\'s Venom', 'Pegasus\' Flight', 'Hydra\'s Growth'];
    var uniqueAffixes = ['Eternity\'s Edge', 'Void', 'Celestial', 'Abyssal', 'Primal', 'Ancestral', 'Ghost', 'Soul Eater', 'Arachnid\'s Web', 'Beholder\'s Gaze', 'Unicorn\'s Grace', 'Golem\'s Fist', 'Salamander\'s Flame', 'Roc\'s Wind', 'Basilisk\'s Stare', 'Chimera\'s Chaos', 'Phoenix\'s Ashes', 'Yeti\'s Cold', 'Siren\'s Song', 'Wendigo\'s Hunger'];

    function pickOne(list) {
      if (!Array.isArray(list) || !list.length) return '';
      return String(list[Math.floor(Math.random() * list.length)] || '');
    }

    function drawAffix(pool, used) {
      if (!Array.isArray(pool) || !pool.length) return '';
      var list = pool.slice();
      if (Array.isArray(used)) {
        list = list.filter(function (entry) { return used.indexOf(entry) < 0; });
      }
      if (!list.length) list = pool.slice();
      return pickOne(list);
    }

    function drawAffixBundle(count, allowUnique) {
      var available = regularAffixes.slice().concat(legendaryAffixes.slice());
      if (allowUnique) available = available.concat(uniqueAffixes.slice());
      var bundle = [];
      while (bundle.length < count && available.length) {
        var picked = drawAffix(available, bundle);
        if (!picked) break;
        bundle.push(picked);
        available = available.filter(function (entry) { return entry !== picked; });
      }
      return bundle;
    }

    var weaponName = pickOne(weaponNames);
    var armorName = pickOne(armorNames);
    var itemName = pickOne(itemNames);
    var weaponAffixes = drawAffixBundle(tierKey === 'platinum' ? 2 : 1, tierKey === 'platinum');
    var armorAffixes = drawAffixBundle(1, tierKey === 'platinum');
    var utilityAffix = drawAffixBundle(1, true)[0] || drawAffixBundle(1, false)[0];

    var loot = [
      weaponName + ' [' + (tierKey === 'platinum' ? 'Platinum' : 'Gold') + ' Weapon] ' + (tierKey === 'platinum' ? '+4 Strike' : '+3 Strike') + ' | Engaged · Affixes: ' + weaponAffixes.join(', '),
      armorName + ' [' + (tierKey === 'platinum' ? 'Platinum' : 'Gold') + ' Armor] ' + (tierKey === 'platinum' ? 'Ad10 Defend | 1 Action' : 'Ad8 Defend | 1 Action') + ' · Affixes: ' + armorAffixes.join(', ')
    ];

    if (tierKey === 'platinum') {
      loot.push(itemName + ' [Platinum Item] Utility Relic · Affix: ' + utilityAffix);
    }

    return loot;
  }

  function rollLegacyRaidGoldSignatureLoot() {
    return rollLegacyRaidSignatureLoot('gold');
  }

  function rollLegacyRaidPlatinumSignatureLoot() {
    return rollLegacyRaidSignatureLoot('platinum');
  }

  window.openLegacyRaidChest = function (tier) {
    var keyTier = String(tier || 'bronze').toLowerCase();
    var profile = ensureLegacyRaidProfile();
    if (!profile) return false;
    if (!profile.raidKeys || Number(profile.raidKeys[keyTier] || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('No ' + keyTier + ' keys available.', 'warn');
      return false;
    }
    profile.raidKeys[keyTier] = Math.max(0, Number(profile.raidKeys[keyTier] || 0) - 1);

    var rewardByTier = {
      bronze: { minCredits: 80, maxCredits: 140, medals: 0, points: 0, lootTier: 'easy', lootRolls: 1, keyRefundChance: 8 },
      silver: { minCredits: 170, maxCredits: 260, medals: 0, points: 1, lootTier: 'medium', lootRolls: 2, keyRefundChance: 14 },
      gold: { minCredits: 300, maxCredits: 440, medals: 1, points: 1, lootTier: 'hard', lootRolls: 3, keyRefundChance: 20 },
      platinum: { minCredits: 500, maxCredits: 700, medals: 2, points: 2, lootTier: 'very_hard', lootRolls: 4, keyRefundChance: 28 }
    };
    var spec = rewardByTier[keyTier] || rewardByTier.bronze;
    var creditRange = Math.max(0, Number(spec.maxCredits || 0) - Number(spec.minCredits || 0));
    var creditGain = Number(spec.minCredits || 0) + (creditRange > 0 ? ((typeof roll === 'function' ? roll(creditRange + 1) : (Math.floor(Math.random() * (creditRange + 1)) + 1)) - 1) : 0);
    var medalGain = Math.max(0, Number(spec.medals || 0));
    var pointGain = Math.max(0, Number(spec.points || 0));
    var lootTier = String(spec.lootTier || 'easy');
    var lootRolls = Math.max(1, Number(spec.lootRolls || 1));
    var keyRefundChance = Math.max(0, Number(spec.keyRefundChance || 0));

    if (typeof changeCredits === 'function') changeCredits(creditGain);
    else if (typeof S !== 'undefined' && S) S.credits = Number(S.credits || 0) + creditGain;
    profile.raidMedals = Math.max(0, Number(profile.raidMedals || 0) + medalGain);
    profile.raidPoints = Math.max(0, Number(profile.raidPoints || 0) + pointGain);

    var chestLoot = [];
    for (var draw = 0; draw < lootRolls; draw++) {
      try {
        var rolled = rollShopLoot(lootTier) || [];
        rolled.forEach(function (item) { if (item) chestLoot.push(String(item)); });
      } catch (_err) {}
    }
    if (keyTier === 'gold') {
      chestLoot = chestLoot.concat(rollLegacyRaidGoldSignatureLoot());
    }
    if (keyTier === 'platinum') {
      chestLoot = chestLoot.concat(rollLegacyRaidPlatinumSignatureLoot());
    }
    var overflowLoot = [];
    if (typeof addToBackpack === 'function') {
      chestLoot.forEach(function (item) {
        try {
          if (!item) return;
          if (!addToBackpack(item)) overflowLoot.push(String(item));
        } catch (_err) {
          overflowLoot.push(String(item || ''));
        }
      });
    } else {
      overflowLoot = chestLoot.slice();
    }
    if (overflowLoot.length) {
      profile.raidOverflowLoot = Array.isArray(profile.raidOverflowLoot) ? profile.raidOverflowLoot : [];
      profile.raidOverflowLoot = profile.raidOverflowLoot.concat(overflowLoot).slice(-120);
    }
    var keyRefunded = false;
    if (keyRefundChance > 0) {
      var refundRoll = typeof roll === 'function' ? roll(100) : (Math.floor(Math.random() * 100) + 1);
      if (refundRoll <= keyRefundChance) {
        profile.raidKeys[keyTier] = Math.max(0, Number(profile.raidKeys[keyTier] || 0) + 1);
        keyRefunded = true;
      }
    }
    if (keyTier === 'platinum' && chestLoot.length) {
      profile.raidTrophies.push('Platinum Cache: ' + String(chestLoot[0] || 'Mythic Trophy'));
    }
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    if (typeof renderBackpackUI === 'function') renderBackpackUI();
    if (typeof showNotif === 'function') {
      showNotif('Opened ' + keyTier + ' chest: +' + creditGain + ' credits, +' + pointGain + ' RP, +' + medalGain + ' medals'
        + (keyRefunded ? (' · Key reclaimed!') : '')
        + (chestLoot.length ? (' · Loot: ' + chestLoot.join(', ')) : '')
        + (overflowLoot.length ? (' · Overflow stored: ' + overflowLoot.length) : ''), 'good');
    }
    renderLegacyRaidTreePanel();
    return true;
  };

  window.claimLegacyRaidOverflowLoot = function () {
    var profile = ensureLegacyRaidProfile();
    if (!profile) return false;
    profile.raidOverflowLoot = Array.isArray(profile.raidOverflowLoot) ? profile.raidOverflowLoot : [];
    if (!profile.raidOverflowLoot.length) {
      if (typeof showNotif === 'function') showNotif('No overflow loot waiting.', 'info');
      return false;
    }
    if (typeof addToBackpack !== 'function') {
      if (typeof showNotif === 'function') showNotif('Backpack handler unavailable right now.', 'warn');
      return false;
    }
    var kept = [];
    var moved = 0;
    profile.raidOverflowLoot.forEach(function (item) {
      if (!item) return;
      try {
        if (addToBackpack(item)) moved += 1;
        else kept.push(String(item));
      } catch (_err) {
        kept.push(String(item));
      }
    });
    profile.raidOverflowLoot = kept;
    if (typeof renderBackpackUI === 'function') renderBackpackUI();
    if (typeof showNotif === 'function') {
      showNotif('Moved ' + moved + ' overflow item(s) to backpack.' + (kept.length ? (' ' + kept.length + ' still waiting.') : ''), moved ? 'good' : 'warn');
    }
    renderLegacyRaidTreePanel();
    return true;
  };

  window.claimLegacyRaidOverflowLootAt = function (idx) {
    var profile = ensureLegacyRaidProfile();
    if (!profile) return false;
    profile.raidOverflowLoot = Array.isArray(profile.raidOverflowLoot) ? profile.raidOverflowLoot : [];
    var at = Number(idx || 0);
    if (at < 0 || at >= profile.raidOverflowLoot.length) return false;
    if (typeof addToBackpack !== 'function') {
      if (typeof showNotif === 'function') showNotif('Backpack handler unavailable right now.', 'warn');
      return false;
    }
    var item = String(profile.raidOverflowLoot[at] || '');
    if (!item) return false;
    try {
      if (addToBackpack(item)) {
        profile.raidOverflowLoot.splice(at, 1);
        if (typeof renderBackpackUI === 'function') renderBackpackUI();
        if (typeof showNotif === 'function') showNotif('Moved to backpack: ' + item, 'good');
      } else if (typeof showNotif === 'function') {
        showNotif('Backpack full. Item remains in overflow.', 'warn');
      }
    } catch (_err) {
      if (typeof showNotif === 'function') showNotif('Could not move overflow item right now.', 'warn');
    }
    renderLegacyRaidTreePanel();
    return true;
  };

  window.sellLegacyRaidOverflowLootAt = function (idx) {
    var profile = ensureLegacyRaidProfile();
    if (!profile) return false;
    profile.raidOverflowLoot = Array.isArray(profile.raidOverflowLoot) ? profile.raidOverflowLoot : [];
    var at = Number(idx || 0);
    if (at < 0 || at >= profile.raidOverflowLoot.length) return false;
    var item = String(profile.raidOverflowLoot[at] || '');
    if (!item) return false;
    var sale = Math.max(20, Math.min(180, 30 + Math.floor(item.length * 2.5)));
    profile.raidOverflowLoot.splice(at, 1);
    if (typeof changeCredits === 'function') changeCredits(sale);
    else if (typeof S !== 'undefined' && S) S.credits = Number(S.credits || 0) + sale;
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    if (typeof showNotif === 'function') showNotif('Sold overflow item: ' + item + ' (+' + sale + '₵).', 'good');
    renderLegacyRaidTreePanel();
    return true;
  };

  function getLegacyRaidStrikeTalentBonus() {
    var rank = getLegacyRaidTalentRank('strike_mastery');
    if (rank <= 0) return 0;
    if (rank === 1) return 1;
    return 3;
  }

  function getLegacyRaidUnlockedFlavorBranches() {
    var out = [];
    var playerFlavor = typeof S !== 'undefined' && S && String(S.flavor || '').toLowerCase();
    if (playerFlavor) out.push(String(S.flavor || 'Wayfarer'));
    if (getLegacyRaidTalentRank('flavor_glacial_tell') > 0) out.push('Glacial Tell');
    if (getLegacyRaidTalentRank('flavor_null_veil') > 0) out.push('Null Veil');
    var active = typeof S !== 'undefined' && S && Array.isArray(S.activeMissions)
      ? S.activeMissions.find(function (m) { return m && m.missionType === 'legacy_raid' && m.steps && m.steps[3] && !m.steps[3].completed; })
      : null;
    var bossFlavor = getLegacyRaidBossPersonalFlavorBranch(active || null);
    if (bossFlavor) out.push(bossFlavor);
    return out;
  }

  function getLegacyRaidBossPersonalFlavorBranch(mission) {
    if (getLegacyRaidTalentRank('flavor_boss_personal') <= 0) return '';
    var boss = String(mission && mission.legacyRaidBoss || '').toLowerCase();
    if (boss.indexOf('ember') >= 0 || boss.indexOf('pyre') >= 0 || boss.indexOf('flame') >= 0) return 'Pyre Litany';
    if (boss.indexOf('void') >= 0 || boss.indexOf('null') >= 0) return 'Null Cant';
    if (boss.indexOf('frost') >= 0 || boss.indexOf('glacial') >= 0) return 'Winter Oath';
    if (boss.indexOf('sea') >= 0 || boss.indexOf('tide') >= 0 || boss.indexOf('abyss') >= 0) return 'Brine Psalm';
    return 'Boss Imprint';
  }

  function getLegacyRaidCombatActionDie(actionType) {
    var req = String(actionType || 'strike').toLowerCase();
    var key = req === 'shoot' ? 'shoot'
      : (req === 'defend' ? 'defend'
        : (req === 'mind' ? 'mind'
          : (req === 'control' ? 'control'
            : (req === 'lead' ? 'lead'
              : (req === 'body' ? 'body'
                : (req === 'spirit' ? 'spirit' : 'strike'))))));
    var base = 8;
    if (typeof getEffectiveDie === 'function') {
      base = Math.max(4, Number(getEffectiveDie(key) || 0) || Number(getStat(key) || 8));
    } else {
      base = Math.max(4, Number(typeof getStat === 'function' ? getStat(key) : 8) || 8);
    }
    return stepMissionDreadDieBy(base, getLegacyRaidTalentRank('action_die_training'));
  }

  function getLegacyRaidBestCombatDie() {
    return Math.max(
      getLegacyRaidCombatActionDie('strike'),
      getLegacyRaidCombatActionDie('shoot'),
      getLegacyRaidCombatActionDie('defend'),
      getLegacyRaidCombatActionDie('mind'),
      getLegacyRaidCombatActionDie('lead'),
      getLegacyRaidCombatActionDie('body'),
      getLegacyRaidCombatActionDie('spirit')
    );
  }

  function getLegacyRaidTickCap() {
    var rank = getLegacyRaidTalentRank('raid_tick_overclock');
    return 20 + (Math.max(0, rank) * 10);
  }

  function buildLegacyRaidCombatDieSummary() {
    var strikeDie = getLegacyRaidCombatActionDie('strike');
    var shootDie = getLegacyRaidCombatActionDie('shoot');
    return 'Strike d' + strikeDie + ' · Shoot d' + shootDie + ' · Best d' + Math.max(strikeDie, shootDie);
  }

  function isLegacyRaidCampaignMode() {
    return !!(typeof window !== 'undefined'
      && window.campaignSystem
      && window.campaignSystem.state
      && window.campaignSystem.state.code);
  }

  function getLegacyRaidTeamworkPool() {
    if (typeof S === 'undefined' || !S) return 0;
    return Math.max(0, Number(S.tmw || 0));
  }

  function spendLegacyRaidTeamwork(cost, reason) {
    var need = Math.max(0, Number(cost || 0));
    if (!need) return true;
    var have = getLegacyRaidTeamworkPool();
    if (have < need) {
      if (typeof showNotif === 'function') showNotif('Need ' + need + ' TMW. Current: ' + have + '.', 'warn');
      return false;
    }
    if (typeof changeCounter === 'function') changeCounter('tmw', -need);
    else if (typeof S !== 'undefined' && S) S.tmw = Math.max(0, have - need);
    if (typeof showNotif === 'function') showNotif('Spent ' + need + ' TMW' + (reason ? (': ' + reason) : '.') , 'good');
    return true;
  }

  function getLegacyRaidTeamworkBurstCosts(mission) {
    var half = getLegacyRaidTalentRank('teamwork_feedback') > 0;
    var scale = half ? 0.5 : 1;
    return {
      prevent: Math.max(1, Math.floor(10 * scale)),
      puzzle: Math.max(1, Math.floor(25 * scale)),
      revive: Math.max(1, Math.floor(50 * scale)),
      cinematic: Math.max(1, Math.floor(100 * scale))
    };
  }

  function getLegacyRaidArmorActionCount() {
    if (typeof getMaxActions === 'function') return Math.max(1, Number(getMaxActions() || 1));
    try {
      var armorText = String(typeof S !== 'undefined' && S && S.equipment && S.equipment.armor || '');
      var match = armorText.match(/(\d+)\s+Action/i);
      if (match) return Math.max(1, Number(match[1] || 1));
    } catch (_err) {}
    return 3;
  }

  function getLegacyRaidCombatActionLabels() {
    if (typeof document !== 'undefined') {
      var select = document.getElementById('wayfarerActionSel');
      if (select && select.options && select.options.length) {
        return Array.prototype.slice.call(select.options).map(function (opt) {
          return String(opt.textContent || opt.value || '').trim();
        }).filter(Boolean).slice(0, 6);
      }
    }
    return ['Strike', 'Shoot', 'Defend', 'Move', 'Support', 'Control'];
  }

  function normalizeLegacyRaidRange(range) {
    var r = String(range || 'Close').toLowerCase();
    if (r === 'engaged') return 'Engaged';
    if (r === 'nearby') return 'Nearby';
    if (r === 'far') return 'Far';
    return 'Close';
  }

  function getLegacyRaidHexDistance(q, r) {
    return (Math.abs(Number(q || 0)) + Math.abs(Number(r || 0)) + Math.abs(Number(q || 0) + Number(r || 0))) / 2;
  }

  function getLegacyRaidHexSlotsByRange() {
    return {
      Engaged: [{ q: 0, r: 0 }],
      Close: [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
      ],
      Nearby: [
        { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 2, r: -2 },
        { q: 1, r: -2 }, { q: 0, r: -2 }, { q: -1, r: -1 },
        { q: -2, r: 0 }, { q: -2, r: 1 }, { q: -2, r: 2 },
        { q: -1, r: 2 }, { q: 0, r: 2 }, { q: 1, r: 1 }
      ],
      Far: [
        { q: 3, r: 0 }, { q: 3, r: -1 }, { q: 3, r: -2 }, { q: 3, r: -3 },
        { q: 2, r: -3 }, { q: 1, r: -3 }, { q: 0, r: -3 }, { q: -1, r: -2 },
        { q: -2, r: -1 }, { q: -3, r: 0 }, { q: -3, r: 1 }, { q: -3, r: 2 },
        { q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 3 }, { q: 0, r: 3 },
        { q: 1, r: 2 }, { q: 2, r: 1 }
      ]
    };
  }

  function buildLegacyRaidHexCombatBoard(units, options) {
    var opts = options || {};
    var title = String(opts.title || 'STARS COMBAT - HEX ZONE MAP');
    var subtitle = String(opts.subtitle || 'Combat positions, range bands, and cover terrain');
    var width = 560;
    var height = 350;
    var hexSize = 22;
    var centerX = width / 2;
    var centerY = height / 2 + 4;
    var slotsByRange = getLegacyRaidHexSlotsByRange();
    var grid = [].concat(slotsByRange.Engaged, slotsByRange.Close, slotsByRange.Nearby, slotsByRange.Far);
    var ringStyles = {
      0: { fill: 'rgba(201,64,64,.14)', stroke: 'rgba(201,64,64,.35)' },
      1: { fill: 'rgba(201,162,39,.1)', stroke: 'rgba(201,162,39,.3)' },
      2: { fill: 'rgba(46,196,182,.09)', stroke: 'rgba(46,196,182,.3)' },
      3: { fill: 'rgba(122,120,152,.08)', stroke: 'rgba(122,120,152,.25)' }
    };
    var toPixel = function (q, r) {
      var x = centerX + hexSize * Math.sqrt(3) * (Number(q || 0) + Number(r || 0) / 2);
      var y = centerY + hexSize * 1.5 * Number(r || 0);
      return { x: x, y: y };
    };
    var hexPoints = function (cx, cy) {
      var pts = [];
      for (var i = 0; i < 6; i++) {
        var angle = ((60 * i) - 30) * Math.PI / 180;
        pts.push((cx + hexSize * Math.cos(angle)).toFixed(2) + ',' + (cy + hexSize * Math.sin(angle)).toFixed(2));
      }
      return pts.join(' ');
    };

    var occupied = {};
    var rangeCounts = { Engaged: 0, Close: 0, Nearby: 0, Far: 0 };
    var placedUnits = (Array.isArray(units) ? units : []).map(function (u) {
      var unit = u || {};
      var range = normalizeLegacyRaidRange(unit.range || unit.zone || 'Close');
      var slots = slotsByRange[range] || slotsByRange.Close;
      var idx = Number(rangeCounts[range] || 0);
      rangeCounts[range] = idx + 1;
      var slot = slots[idx % Math.max(1, slots.length)] || { q: 0, r: 0 };
      var key = String(slot.q) + ',' + String(slot.r);
      if (occupied[key]) {
        var alt = slots[(idx + 1) % Math.max(1, slots.length)] || slot;
        slot = { q: Number(alt.q || 0), r: Number(alt.r || 0) };
      }
      occupied[String(slot.q) + ',' + String(slot.r)] = true;
      var p = toPixel(slot.q, slot.r);
      return {
        id: Number(unit.id || 0),
        name: String(unit.name || 'Unit'),
        side: String(unit.side || 'ally'),
        isPlayer: !!unit.isPlayer,
        hp: Math.max(0, Number(unit.hp || 0)),
        dread: Math.max(0, Number(unit.dread || 0)),
        range: range,
        x: p.x,
        y: p.y
      };
    });

    var terrainSeed = getLegacyRaidStableIndex(String(opts.seed || 'raid-hex-terrain'), 9999);
    var terrainCoords = [
      { q: 2, r: -1, icon: 'x' },
      { q: -1, r: -2, icon: '^' },
      { q: -2, r: 2, icon: '#' },
      { q: 1, r: 2, icon: '~' }
    ];
    var terrain = terrainCoords.filter(function (_c, i) {
      return ((terrainSeed + i) % 2) === 0;
    }).map(function (c) {
      var p = toPixel(c.q, c.r);
      return '<text x="' + p.x.toFixed(2) + '" y="' + (p.y + 4).toFixed(2) + '" text-anchor="middle" font-size="11" opacity=".82" fill="var(--muted2)">' + c.icon + '</text>';
    }).join('');

    var gridSvg = grid.map(function (hex) {
      var p = toPixel(hex.q, hex.r);
      var ring = getLegacyRaidHexDistance(hex.q, hex.r);
      var style = ringStyles[ring] || ringStyles[3];
      return '<polygon points="' + hexPoints(p.x, p.y) + '" fill="' + style.fill + '" stroke="' + style.stroke + '" stroke-width="1.1"/>';
    }).join('');
    var clickHandler = (typeof opts.clickHandler === 'string' && opts.clickHandler) ? opts.clickHandler : '';
    var modeArg = String(opts.mode || 'wing').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var missionArg = Number(opts.missionId || 0);
    var wingArg = Number(opts.wingNum || 0);
    var isSelected = typeof opts.isSelected === 'function' ? opts.isSelected : function () { return false; };
    var unitSvg = placedUnits.map(function (u) {
      var fill = u.side === 'enemy' ? 'rgba(201,64,64,.9)' : 'rgba(46,196,182,.9)';
      var stroke = u.isPlayer ? 'var(--gold2)' : (u.side === 'enemy' ? 'rgba(255,180,180,.8)' : 'rgba(170,255,245,.8)');
      if (isSelected(u)) stroke = 'var(--gold2)';
      var hpText = u.hp > 0 ? ('HP ' + u.hp) : 'DOWN';
      var detailText = u.dread > 0 ? (' · Dread d' + u.dread) : '';
      var nameArg = String(u.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      var clickAttr = '';
      if (clickHandler) {
        clickAttr = ' style="cursor:pointer;" onclick="' + clickHandler + '(\'' + modeArg + '\',' + missionArg + ',' + wingArg + ',\'' + String(u.side || 'ally') + '\',' + Number(u.id || 0) + ',\'' + nameArg + '\',' + (u.isPlayer ? 'true' : 'false') + ')"';
      }
      return '<g>'
        + '<title>' + u.name + ' · ' + u.range + ' · ' + hpText + detailText + '</title>'
        + '<circle cx="' + u.x.toFixed(2) + '" cy="' + u.y.toFixed(2) + '" r="10.2" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6"' + clickAttr + '/>'
        + '<text x="' + u.x.toFixed(2) + '" y="' + (u.y + 3.4).toFixed(2) + '" text-anchor="middle" font-size="8" fill="#fff">' + String(u.name || 'U').slice(0, 2).toUpperCase() + '</text>'
        + '</g>';
    }).join('');
    var legend = '<div style="display:flex;gap:.28rem;flex-wrap:wrap;font-size:.6rem;color:var(--muted2);margin-top:.12rem;">'
      + '<span><strong style="color:var(--red2);">Engaged</strong> ring 0</span>'
      + '<span><strong style="color:var(--gold2);">Close</strong> ring 1</span>'
      + '<span><strong style="color:var(--teal);">Nearby</strong> ring 2</span>'
      + '<span><strong style="color:var(--muted3);">Far</strong> ring 3</span>'
      + '<span>Terrain creates movement pressure.</span>'
      + '</div>';

    return '<div style="margin:.15rem 0;border:1px solid var(--border2);padding:.28rem .3rem;background:rgba(255,255,255,.02);">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.2rem;">' + title + '</div>'
      + '<div style="font-size:.62rem;color:var(--muted2);margin-bottom:.16rem;">' + subtitle + '</div>'
      + '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:640px;height:auto;display:block;margin:0 auto;">'
      + gridSvg + terrain + unitSvg
      + '</svg>'
      + legend
      + '</div>';
  }

  function buildLegacyRaidBossZoneMap(mission) {
    var zones = ['Engaged', 'Close', 'Nearby', 'Far'];
    var units = [];
    if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.units) && S.combatMap.units.length) {
      units = S.combatMap.units.slice();
    } else {
      var playerName = String(typeof S !== 'undefined' && S && S.name || 'Wayfarer');
      units = [{ name: playerName, side: 'ally', zone: 'Engaged', isPlayer: true }];
      if (!isLegacyRaidCampaignMode()) {
        getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; }).forEach(function (wf, idx) {
          units.push({ name: String(wf.name || ('Ally ' + (idx + 1))), side: 'ally', zone: idx === 0 ? 'Close' : 'Nearby' });
        });
      }
      units.push({ name: String(mission && mission.legacyRaidBoss || 'Boss'), side: 'enemy', zone: 'Engaged' });
    }
    var seenUnits = {};
    units = units.filter(function (u) {
      if (!u) return false;
      var key = (u.isPlayer ? 'player:' : String(u.side || 'ally') + ':') + String(u.name || 'unit');
      if (seenUnits[key]) return false;
      seenUnits[key] = true;
      return true;
    });
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (encounter && (!encounter.partyHp || typeof encounter.partyHp !== 'object')) encounter.partyHp = { allies: {} };
    if (encounter && encounter.partyHp && !encounter.partyHp.allies) encounter.partyHp.allies = {};
    var boardUnits = units.map(function (u) {
      var name = String(u && u.name || 'Unit');
      var isPlayer = !!(u && u.isPlayer);
      var hp = 12;
      if (u && u.side === 'enemy') {
        hp = encounter ? Math.max(0, Number(encounter.phaseHp || 0)) : 0;
      } else if (isPlayer || name === String(typeof S !== 'undefined' && S && S.name || '')) {
        hp = Math.max(0, Number(typeof S !== 'undefined' && S && S.health || 0));
      } else if (encounter && encounter.partyHp && encounter.partyHp.allies && typeof encounter.partyHp.allies[name] === 'number') {
        hp = Math.max(0, Number(encounter.partyHp.allies[name]));
      }
      return {
        name: name,
        side: String(u && u.side || 'ally'),
        isPlayer: isPlayer,
        hp: hp,
        range: normalizeLegacyRaidRange(u && (u.zone || u.range) || 'Close')
      };
    });
    return buildLegacyRaidHexCombatBoard(boardUnits, {
      title: 'STARS COMBAT - HEX ZONE MAP',
      subtitle: 'Boss in red, allies in blue. Positioning governs valid actions.',
      seed: String(mission && mission.id || 'raid') + '-boss',
      mode: 'boss',
      missionId: mission && mission.id || 0,
      wingNum: 3,
      clickHandler: 'window.selectLegacyRaidHexBoardTarget',
      isSelected: function (unit) {
        var flow = (typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow) ? S.combat.raidFlow : null;
        if (!flow || !unit) return false;
        if (unit.side === 'enemy') return String(flow.selectedHostileName || '').toLowerCase() === String(unit.name || '').toLowerCase();
        if (unit.isPlayer) return String(flow.selectedEnemyTargetType || '') === 'player';
        return String(flow.selectedEnemyTargetType || '') === 'ally' && String(flow.selectedAllyName || '') === String(unit.name || '');
      }
    });
  }

  function buildLegacyRaidBossPlayerPanel(mission, encounter) {
    var actions = getLegacyRaidCombatActionLabels();
    var actionCount = getLegacyRaidArmorActionCount();
    var tmw = getLegacyRaidTeamworkPool();
    var hp = Math.max(0, Number(typeof S !== 'undefined' && S && S.health || 0));
    var name = String(typeof S !== 'undefined' && S && S.name || 'Wayfarer');
    return '<div style="border:1px solid var(--border2);background:rgba(20,90,120,.12);padding:.32rem .36rem;">'
      + '<div style="font-size:.72rem;color:var(--teal);margin-bottom:.12rem;"><strong>' + name + '</strong> · Player Panel</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;">HP ' + hp + ' · Actions ' + actionCount + '/' + actionCount + ' · TMW ' + tmw + '</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;margin-top:.08rem;">Action Dice: ' + buildLegacyRaidCombatDieSummary() + '</div>'
      + '<div style="display:flex;gap:.16rem;flex-wrap:wrap;margin-top:.16rem;">'
      + actions.map(function (label) { return '<span style="font-size:.62rem;color:var(--text2);padding:.08rem .14rem;border:1px solid var(--border2);background:rgba(255,255,255,.04);">' + label + '</span>'; }).join('')
      + '</div>'
      + '</div>';
  }

  function getLegacyRaidAllyFlavorProfile(allyName) {
    var name = String(allyName || '').toLowerCase();
    if (name.indexOf('sel the wayfinder') >= 0) return { name: 'Bulwark', attack: 0, support: 1, defend: 2, move: 1 };
    if (name.indexOf('korvus pale') >= 0) return { name: 'Vanguard', attack: 2, support: 1, defend: 1, move: 0 };
    if (name.indexOf('tinden ashmark') >= 0) return { name: 'Tactician', attack: 1, support: 2, defend: 1, move: 0 };
    var pool = [
      { name: 'Vanguard', attack: 2, support: 1, defend: 1, move: 0 },
      { name: 'Tactician', attack: 1, support: 2, defend: 1, move: 0 },
      { name: 'Bulwark', attack: 0, support: 1, defend: 2, move: 1 },
      { name: 'Ranger', attack: 1, support: 1, defend: 0, move: 2 }
    ];
    var idx = getLegacyRaidStableIndex(String(allyName || 'ally'), pool.length);
    return pool[idx] || pool[0];
  }

  function resetLegacyRaidAllyActionBudget(mission, encounter) {
    if (!encounter) return;
    var allies = getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; }).map(function (wf) { return String(wf.name || 'Wayfarer'); });
    encounter.allyActionBudget = { total: allies.length * 2, used: 0, byAlly: {} };
    allies.forEach(function (name) { encounter.allyActionBudget.byAlly[name] = 2; });
  }

  function buildLegacyRaidBossAlliesPanel(mission, encounter) {
    var allies = getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; }).map(function (wf) { return String(wf.name || 'Wayfarer'); });
    if (!encounter || !encounter.allyActionBudget || !encounter.allyActionBudget.byAlly) {
      resetLegacyRaidAllyActionBudget(mission, encounter);
    }
    var allyHp = encounter && encounter.partyHp && encounter.partyHp.allies ? encounter.partyHp.allies : {};
    var body = allies.length
      ? allies.map(function (ally) {
          var left = Math.max(0, Number(encounter.allyActionBudget && encounter.allyActionBudget.byAlly && encounter.allyActionBudget.byAlly[ally] || 0));
          var hp = typeof allyHp[ally] === 'number' ? Math.max(0, Number(allyHp[ally])) : 12;
          var flavor = getLegacyRaidAllyFlavorProfile(ally);
          return '<div style="font-size:.63rem;color:var(--text2);padding:.08rem .14rem;border:1px solid var(--border2);background:rgba(255,255,255,.04);margin-bottom:.08rem;">'
            + ally + ' · HP ' + hp + ' · Actions ' + left + '/2 · Flavor ' + flavor.name
            + '</div>';
        }).join('')
      : '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;">No active allies remain.</div>';
    var totalLeft = Math.max(0, Number(encounter && encounter.allyActionBudget ? (encounter.allyActionBudget.total - encounter.allyActionBudget.used) : 0));
    return '<div style="border:1px solid var(--border2);background:rgba(40,90,60,.12);padding:.32rem .36rem;">'
      + '<div style="font-size:.72rem;color:var(--green2);margin-bottom:.12rem;"><strong>Allies</strong> · Remaining Actions ' + totalLeft + '</div>'
      + body
      + '</div>';
  }

  function createLegacyRaidPipeFlowState() {
    var templates = [
      [
        { type: 'source', rotation: 0, locked: true },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'elbow', rotation: 2, locked: false },
        { type: 'block', rotation: 0, locked: true },
        { type: 'elbow', rotation: 0, locked: false },
        { type: 'straight', rotation: 1, locked: false },
        { type: 'block', rotation: 0, locked: true },
        { type: 'elbow', rotation: 1, locked: false },
        { type: 'sink', rotation: 0, locked: true }
      ],
      [
        { type: 'source', rotation: 0, locked: true },
        { type: 'elbow', rotation: 2, locked: false },
        { type: 'block', rotation: 0, locked: true },
        { type: 'tee', rotation: 1, locked: false },
        { type: 'elbow', rotation: 3, locked: false },
        { type: 'straight', rotation: 1, locked: false },
        { type: 'block', rotation: 0, locked: true },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'sink', rotation: 0, locked: true }
      ],
      [
        { type: 'source', rotation: 0, locked: true },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'elbow', rotation: 1, locked: false },
        { type: 'block', rotation: 0, locked: true },
        { type: 'elbow', rotation: 3, locked: false },
        { type: 'elbow', rotation: 0, locked: false },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'sink', rotation: 0, locked: true }
      ]
    ];
    var solved = templates[Math.floor(Math.random() * templates.length)] || templates[0];
    return {
      tiles: solved.map(function (tile) {
        var next = { type: tile.type, rotation: tile.rotation, locked: tile.locked };
        if (!next.locked) {
          var tries = 0;
          do {
            next.rotation = Math.floor(Math.random() * 4);
            tries += 1;
          } while (next.rotation === tile.rotation && tries < 6);
        }
        return next;
      })
    };
  }

  function getLegacyRaidPipeOppositeDir(dir) {
    if (dir === 'left') return 'right';
    if (dir === 'right') return 'left';
    if (dir === 'up') return 'down';
    return 'up';
  }

  function getLegacyRaidPipeNeighborIndex(idx, dir) {
    var row = Math.floor(Number(idx || 0) / 3);
    var col = Number(idx || 0) % 3;
    if (dir === 'left') col -= 1;
    else if (dir === 'right') col += 1;
    else if (dir === 'up') row -= 1;
    else if (dir === 'down') row += 1;
    if (row < 0 || row >= 3 || col < 0 || col >= 3) return -1;
    return row * 3 + col;
  }

  function getLegacyRaidPipeTileExits(tile) {
    if (!tile) return [];
    var rot = Math.max(0, Number(tile.rotation || 0)) % 4;
    if (tile.type === 'source') return ['right'];
    if (tile.type === 'sink') return ['up'];
    if (tile.type === 'straight') return rot % 2 === 0 ? ['left', 'right'] : ['up', 'down'];
    if (tile.type === 'elbow') {
      if (rot === 0) return ['up', 'right'];
      if (rot === 1) return ['right', 'down'];
      if (rot === 2) return ['down', 'left'];
      return ['left', 'up'];
    }
    return [];
  }

  function isLegacyRaidPipeFlowSolved(puzzle) {
    var tiles = puzzle && puzzle.state && Array.isArray(puzzle.state.tiles) ? puzzle.state.tiles : [];
    if (tiles.length < 9) return false;
    var queue = [0];
    var seen = { 0: true };
    while (queue.length) {
      var idx = Number(queue.shift());
      if (idx === 8) return true;
      var exits = getLegacyRaidPipeTileExits(tiles[idx]);
      for (var i = 0; i < exits.length; i++) {
        var dir = exits[i];
        var ni = getLegacyRaidPipeNeighborIndex(idx, dir);
        if (ni < 0) continue;
        var nTile = tiles[ni] || {};
        if (nTile.type === 'block') continue;
        var back = getLegacyRaidPipeOppositeDir(dir);
        var nExits = getLegacyRaidPipeTileExits(nTile);
        if (nExits.indexOf(back) < 0) continue;
        if (!seen[ni]) {
          seen[ni] = true;
          queue.push(ni);
        }
      }
    }
    return false;
  }

  function renderLegacyRaidPipeFlowControls(missionId, wingNum, roomIdx, puzzle) {
    var glyph = function (tile) {
      var rot = Math.max(0, Number(tile.rotation || 0)) % 4;
      if (tile.type === 'source') return '▶';
      if (tile.type === 'sink') return '▼';
      if (tile.type === 'straight') return rot % 2 === 0 ? '═' : '║';
      if (tile.type === 'elbow') return ['╚', '╔', '╗', '╝'][rot];
      return '·';
    };
    var tiles = puzzle && puzzle.state && Array.isArray(puzzle.state.tiles) ? puzzle.state.tiles : [];
    return '<div style="margin-bottom:.22rem;">'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Rotate each pipe tile until the source feeds the sink.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,64px);gap:.16rem;justify-content:center;">'
      + tiles.map(function (tile, idx) {
          var locked = !!(tile && tile.locked);
          return '<button class="btn btn-xs' + (locked ? '' : ' btn-primary') + '" ' + (locked ? 'disabled' : '')
            + ' style="height:64px;font-size:1.5rem;line-height:1;background:' + (tile.type === 'source' ? 'rgba(40,180,220,.18)' : tile.type === 'sink' ? 'rgba(255,190,70,.18)' : 'rgba(255,255,255,.05)') + ';"'
            + ' onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'pipe_rotate\',\'' + idx + '\')">' + glyph(tile) + '</button>';
        }).join('')
      + '</div>'
      + '</div>';
  }

  function createLegacyRaidWeightBalanceState() {
    return {
      target: 4,
      pool: [1, 1, 2, 2, 3, 3],
      left: [],
      right: []
    };
  }

  function getLegacyRaidBossPuzzleMode(mission, wingNum) {
    var boss = String(mission && mission.legacyRaidBoss || '').toLowerCase();
    if (Number(wingNum || 1) === 1) {
      if (/dragon|leviathan|kraken|hydra|wyrm|basilisk|behemoth/.test(boss)) return 'food_chain';
      if (/executor|null|rail|harvester|vault|oracle/.test(boss)) return 'constellation';
      return 'symbol_match';
    }
    if (/rail|maze|vault|oracle/.test(boss)) return 'pipe_flow';
    if (/tide|brine|sea|undertow/.test(boss)) return 'weight_balance';
    return 'lock_dials';
  }

  function createLegacyRaidFoodChainState(mission) {
    var boss = String(mission && mission.legacyRaidBoss || 'boss').toLowerCase();
    var species = /sea|leviathan|kraken|tide|brine/.test(boss)
      ? ['Plankton', 'Shrimp', 'Fish', 'Eel', 'Shark', 'Leviathan']
      : ['Moss', 'Insect', 'Lizard', 'Wolf', 'Hunter', 'Dragon'];
    var targetCells = ['0:0', '1:1', '2:2', '3:3', '4:4', '5:5', '2:3', '3:2'];
    return {
      species: species,
      targetCells: targetCells,
      selected: []
    };
  }

  function renderLegacyRaidFoodChainControls(missionId, wingNum, roomIdx, puzzle) {
    var state = puzzle && puzzle.state ? puzzle.state : {};
    var species = Array.isArray(state.species) ? state.species : ['A', 'B', 'C', 'D', 'E', 'F'];
    var selected = Array.isArray(state.selected) ? state.selected : [];
    var grid = '';
    for (var r = 0; r < 6; r++) {
      for (var c = 0; c < 6; c++) {
        var key = r + ':' + c;
        var on = selected.indexOf(key) >= 0;
        grid += '<button class="btn btn-xs' + (on ? ' btn-primary' : '') + '" style="min-height:28px;" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'food_cell\',\'' + key + '\')">' + (on ? '✓' : '·') + '</button>';
      }
    }
    return '<div style="margin-bottom:.22rem;">'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Food Chain Grid (6x6): mark predator-prey progression cells that match this boss ecosystem.</div>'
      + '<div style="font-size:.66rem;color:var(--gold2);margin-bottom:.12rem;">Chain: ' + species.join(' → ') + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(6,minmax(28px,1fr));gap:.08rem;max-width:280px;">' + grid + '</div>'
      + '</div>';
  }

  function renderLegacyRaidWeightBalanceControls(missionId, wingNum, roomIdx, puzzle) {
    var state = puzzle && puzzle.state ? puzzle.state : {};
    var leftSum = (state.left || []).reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
    var rightSum = (state.right || []).reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
    var pool = Array.isArray(state.pool) ? state.pool : [];
    var renderPan = function (label, values, total) {
      return '<div style="border:1px solid var(--border2);padding:.22rem .26rem;background:rgba(255,255,255,.03);">'
        + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.12rem;">' + label + ' · ' + total + '</div>'
        + ((values && values.length)
          ? values.map(function (value, idx) {
              return '<button class="btn btn-xs" style="margin:.06rem;" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'weight_remove\',\'' + label.toLowerCase() + ':' + idx + '\')">' + value + '</button>';
            }).join('')
          : '<div style="font-size:.63rem;color:var(--muted2);">No weights placed.</div>')
        + '</div>';
    };
    return '<div style="margin-bottom:.22rem;">'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Balance both pans to target load ' + Number(state.target || 4) + '. Click a weight to place it, or click placed weights to remove them.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.18rem;margin-bottom:.18rem;">'
      + renderPan('Left', state.left || [], leftSum)
      + renderPan('Right', state.right || [], rightSum)
      + '</div>'
      + '<div style="display:flex;gap:.14rem;flex-wrap:wrap;justify-content:center;">'
      + pool.map(function (value, idx) {
          return '<div style="display:flex;gap:.08rem;align-items:center;border:1px solid var(--border2);padding:.08rem .1rem;background:rgba(255,255,255,.04);">'
            + '<span style="font-size:.68rem;color:var(--text2);min-width:14px;text-align:center;">' + value + '</span>'
            + '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'weight_place\',\'' + idx + ':left\')">L</button>'
            + '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'weight_place\',\'' + idx + ':right\')">R</button>'
            + '</div>';
        }).join('')
      + '</div>'
      + '</div>';
  }

  // ─── Tumbler Lockpick Puzzle ──────────────────────────────────────────────
  //  5 pins, each with 5 positions.  Player clicks a pin to push it up by one;
  //  clicking the top position wraps back to 1.  All 5 must reach their secret
  //  target heights (seeded from mission id) to open the lock.

  function createLegacyRaidTumblerState(mission) {
    // Deterministic targets derived from mission id so they're stable across renders.
    var seed = mission && mission.id ? Number(mission.id) : Date.now();
    var targets = [];
    for (var i = 0; i < 5; i++) {
      seed = ((seed * 1664525) + 1013904223) >>> 0;
      targets.push((seed % 5) + 1);   // 1-5
    }
    return {
      pins: [1, 1, 1, 1, 1],   // current heights (1 = lowest, 5 = highest)
      targets: targets,
      code: [targets[0], targets[1], targets[2]],
      revealed: []              // indices where the player has "felt" the correct height
    };
  }

  function getLegacyRaidBossRequiredWeapon(region, bossName) {
    var key = String(region || 'province').toLowerCase();
    var lower = String(bossName || '').toLowerCase();
    if (key === 'wtw') {
      if (/violet|vault/.test(lower)) return 'Vault-Breaker Spike';
      if (/warden|rail/.test(lower)) return 'Rail-Spike Disruptor';
      if (/ashcourt|colossus/.test(lower)) return 'Court-Seal Hammer';
    }
    if (key === 'sea' && /deepwake|dragon/.test(lower)) return 'Depth-Iron Harpoon';
    if (key === 'galaxy' && /blackstar|colossus/.test(lower)) return 'Null-Field Detonator';
    if (key === 'planet' && /mycelial|titan/.test(lower)) return 'Anti-Spore Filter Mask';
    if (key === 'province' && /thornstag|basilisk/.test(lower)) return 'Hollow-Iron Antler Spike';
    return '';
  }

  function isLegacyRaidTumblerSolved(puzzle) {
    var s = puzzle && puzzle.state;
    if (!s || !Array.isArray(s.pins) || !Array.isArray(s.targets)) return false;
    for (var i = 0; i < 5; i++) {
      if (Number(s.pins[i] || 1) !== Number(s.targets[i] || 1)) return false;
    }
    return true;
  }

  function renderLegacyRaidTumblerControls(missionId, wingNum, roomIdx, puzzle) {
    var s = puzzle && puzzle.state ? puzzle.state : {};
    var pins    = Array.isArray(s.pins)     ? s.pins     : [1,1,1,1,1];
    var targets = Array.isArray(s.targets)  ? s.targets  : [3,2,4,1,5];
    var revealed = Array.isArray(s.revealed) ? s.revealed : [];
    var MAX = 5;
    // Render each pin as a vertical stack of 5 cells.
    // Current height cell is highlighted; a subtle indicator if it's the target.
    var pinCols = pins.map(function (height, idx) {
      var isTarget = Number(height) === Number(targets[idx]);
      var isRevealed = revealed.indexOf(idx) >= 0;
      var borderColor = isTarget ? 'rgba(46,196,182,.7)' : 'rgba(255,255,255,.18)';
      var cells = '';
      for (var pos = MAX; pos >= 1; pos--) {
        var active = pos === Number(height);
        var bg = active
          ? (isTarget ? 'rgba(46,196,182,.5)' : 'rgba(220,160,40,.5)')
          : 'rgba(255,255,255,.03)';
        var tick = active && isRevealed && isTarget ? '✓' : (active ? '▌' : '');
        cells += '<div style="width:42px;height:22px;background:' + bg + ';border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:.65rem;color:' + (active ? 'var(--gold2)' : 'var(--muted2)') + ';">' + tick + '</div>';
      }
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:.06rem;">'
        + cells
        + '<button class="btn btn-xs btn-primary" style="width:42px;margin-top:.1rem;border-color:' + borderColor + ';" '
        + 'onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'tumbler_push\',' + idx + ')">&uarr;</button>'
        + '<div style="font-size:.6rem;color:var(--muted2);margin-top:.06rem;">Pin ' + (idx+1) + '</div>'
        + '</div>';
    }).join('');
    var feedbackRow = '';
    var atTarget = pins.filter(function (h, i) { return Number(h) === Number(targets[i]); }).length;
    if (atTarget > 0) {
      feedbackRow = '<div style="font-size:.68rem;color:var(--teal);margin-top:.14rem;">'
        + atTarget + '/5 pins feel set. Listen for the binding click.</div>';
    }
    return '<div style="margin-bottom:.22rem;">'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Push each pin up until you feel it set. A teal border means the pin clicked into place. Press <strong style="color:var(--gold2);">Try Lock</strong> when all five are set.</div>'
      + '<div style="display:flex;gap:.2rem;justify-content:center;margin-bottom:.1rem;">' + pinCols + '</div>'
      + feedbackRow
      + '<div style="margin-top:.2rem;display:flex;gap:.18rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-primary" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'tumbler_try\',0)">🔓 Try Lock</button>'
      + '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'tumbler_probe\',0)" title="Feel for binding pins — reveals which pins are currently at their target height (without telling you the target number)">🖐 Feel Binding</button>'
      + '</div>'
      + '</div>';
  }

  function getLegacyRaidSeed(mission) {
    var text = String(mission && mission.title || '') + '|' + String(mission && mission.region || '') + '|' + String(mission && mission.id || '0');
    var hash = 0;
    for (var i = 0; i < text.length; i++) {
      hash = ((hash * 31) + text.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function pickLegacyRaidEntry(catalog, seed, fallback) {
    if (!Array.isArray(catalog) || !catalog.length) return fallback;
    return catalog[Math.abs(Number(seed || 0)) % catalog.length] || fallback;
  }

  function ensureLegacyRaidModalButtonSafety() {
    if (typeof document === 'undefined' || window.__legacyRaidModalButtonSafetyInstalled) return;
    var modal = document.getElementById('rollModal');
    if (!modal) return;
    window.__legacyRaidModalButtonSafetyInstalled = true;
    modal.addEventListener('click', function (evt) {
      var btn = evt && evt.target && evt.target.closest ? evt.target.closest('button') : null;
      if (!btn) return;
      if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
      evt.preventDefault();
    }, true);
  }

  function ensureLegacyRaidMissionConfig(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return mission;
    ensureLegacyRaidCombatEndHook();
    ensureLegacyRaidModalButtonSafety();
    mission.steps = mission.steps || {};
    mission.steps[1] = mission.steps[1] || { completed: false, skipped: false };
    mission.steps[2] = mission.steps[2] || { completed: false };
    mission.steps[3] = mission.steps[3] || { completed: false };

    var region = String(mission.legacyRaidRegion || mission.region || 'province').toLowerCase();
    var seed = getLegacyRaidSeed(mission);
    var bossCatalog = {
      province: [
        {
          name: 'Quarry Maw Regent',
          puzzle: 'Cryptogram seals describe which caravans were sacrificed to keep the tunnels open.',
          lore: 'Lore Fragment: The Quarry Maw Regent decides which province caravans disappear beneath the old trade roads. Merchant houses keep feeding it captives so they can tax every surviving route.',
          cinematic: {
            opener: 'Lantern light drags across stone ribs the size of siege towers.',
            setup: 'The chamber opens under the old province roadbed. Wagon bells ring from inside the rock as if the boss has eaten the road itself.',
            challenge: 'If the Regent survives, inland caravans stop moving without paying tribute through the maw-road.'
          },
          actions: [
            'Roadshear Crash: Province lanes collapse in sequence from left to right.',
            'Tithe Bell: A raidwide toll pulse punishes any lane not covered by Support.',
            'Burrow Verdict: Mechanics must read the false road before the chamber loops.',
            'Excavation Claim: The front lane loses 1 Action unless an ally braces the collapse.',
            'Debtor\'s Mark: The highest-pressure role takes +2 damage and gains Shaken.',
            'Maw Lantern: Summons burrow-thralls into any lane left uncovered twice in a row.'
          ]
        },
        {
          name: 'Ashen Toll King',
          puzzle: 'A logic maze routes furnace pressure through false tollgates before the vault door opens.',
          lore: 'Lore Fragment: The Ashen Toll King turned the province foundries into a toll empire. Every siege engine and caravan axle passed through its furnaces, and every failure meant a town starved.',
          cinematic: {
            opener: 'Furnace doors yawn open as sparks whirl like court attendants.',
            setup: 'The boss rises from an iron throne chained into the vault floor. Burn marks trace old tribute routes across the chamber.',
            challenge: 'If the King stands, province holds lose their artillery routes and submit to the ash tithe.'
          },
          actions: [
            'Foundry Verdict: Heat bands sweep every lane and leave the center unstable.',
            'Cinder Census: A raidwide flame-count punishes missing role coverage.',
            'Tax Furnace: Front must hold the blast gate while Mechanics decodes the release order.',
            'Ash Writ: Burns 1 AP from every exposed target in the active lane.',
            'King\'s Reprisal: Revives a slag guard unless Support interrupts the furnace hymn.',
            'Molten Audit: Every uncovered role gains Weakened until the next successful beat.'
          ]
        }
      ],
      galaxy: [
        {
          name: 'Eclipse Harvester',
          puzzle: 'A cryptogram star-lattice identifies which mirrored jump lanes are real and which are bait.',
          lore: 'Lore Fragment: The Eclipse Harvester is a lane-breaker wired into abandoned jump lattices. When it feeds, civilian ships vanish between stars and the surviving routes become tribute corridors for raider fleets.',
          cinematic: {
            opener: 'The star-lane ahead goes black, then starts harvesting light back into a single mechanical iris.',
            setup: 'Wreckage drifts in a perfect ring around the chamber. Each shard still holds a frozen map of the last convoy that tried to cross.',
            challenge: 'If the Harvester survives, the galaxy loses a civilian star lane and every convoy near this sector starts paying blood tolls.'
          },
          actions: [
            'Lane Reap: The left and right lanes blink out, then return in the wrong order.',
            'Gravitic Audit: A raidwide pull drags every role toward the dead lane unless Support stabilizes.',
            'Event Horizon Ledger: Mechanics must decode the surviving route before the chamber harvests a second time.',
            'Blackout Tax: The farthest target loses its next turn to null-light shock.',
            'Convoy Ghosts: Summons wreck echoes that must be cleared before damage can stick again.',
            'Orbit Collapse: All lanes take pressure damage unless the team splits correctly.'
          ]
        },
        {
          name: 'Null Rail Executor',
          puzzle: 'A maze of rail-state switches must be solved in five exact moves before the lockout cycle ends.',
          lore: 'Lore Fragment: The Null Rail Executor was built to erase bad freight routes from the old star network. Raiders turned it into an executioner that deletes entire civilian convoys from the map.',
          cinematic: {
            opener: 'Void-static crawls over the bulkheads as dead rail-lines reignite one by one.',
            setup: 'A crown of broken transit rings rotates above the arena. Each ring shows a star lane the Province once depended on.',
            challenge: 'If the Executor stands, nearby sectors lose safe passage and relief fleets start disappearing from charts.'
          },
          actions: [
            'Rail Sever: A branch beat cuts the center lane and spikes Dread.',
            'Vacuum Census: Raidwide pressure strips momentum from uncovered roles.',
            'Deletion Stamp: Front must hold the surviving ring while Mechanics chooses the true rail.',
            'Erasure Pulse: One random ally is removed from the next action step unless revived or shielded.',
            'Static Sentence: Applies Distracted to the current player lane and doubles hazard pressure there.',
            'Null Invoice: Each failed response feeds the Executor 4 phase HP.'
          ]
        }
      ],
      sea: [
        {
          name: 'Undertow Archivist',
          puzzle: 'A pressure-balance puzzle routes brine through coral locks while the tide clock keeps moving.',
          lore: 'Lore Fragment: The Undertow Archivist remembers every sea route ever drowned. Raider flotillas worship it because it can collapse convoy currents and reopen pirate channels at will.',
          cinematic: {
            opener: 'Brine rises up the chamber walls and starts spelling old port names in foam.',
            setup: 'Broken mastheads hang from the ceiling like relics. Each one belonged to a route the sea once promised was safe.',
            challenge: 'If the Archivist survives, the coast loses another sea route and nearby ports fall back under raider tolls.'
          },
          actions: [
            'Tide Audit: Current-shear crosses two lanes and floods the third.',
            'Brine Broadcast: A raidwide pulse soaks every uncovered lane in static pressure.',
            'Drowned Index: Mechanics must read the true channel before the tide closes again.',
            'Undertow Sentence: Drags the closest target out of position and strips 1 AP.',
            'Foam Revenants: Raises drowned deckhands unless the team cleanses the channel.',
            'Pressure Archive: Any lane left unresolved gains +1 permanent Dread for the fight.'
          ]
        }
      ]
    };
    var minimumBossPools = {
      province: ['Quarry Maw Regent', 'Ashen Toll King', 'Mire Crown Behemoth', 'Vault Maw Patriarch', 'Red Harvest Horror'],
      sea: ['Undertow Archivist', 'Tideglass Leviathan', 'Blackwake Kraken Lord', 'Corsair Eel Sovereign', 'Whalebone Regent'],
      galaxy: ['Eclipse Harvester', 'Null Rail Executor', 'Voidwing Dragon', 'Plasma Hydra Prime', 'Blackstar Colossus'],
      planet: ['Dustspine Dragon', 'Crater Widow Empress', 'Sunslag Gorgon', 'Cinder Bloom Hydra', 'Archive Devourer'],
      wtw: ['Violet Vault Dragon', 'District Hydra Mneme', 'Cathedral Rail Warden', 'Ashcourt Colossus', 'Mirror Docket Oracle']
    };
    var defaultPuzzleByRegion = {
      province: 'Solve an old-road cryptogram lock where mirrored clues hide false exits.',
      sea: 'Balance tide valves through a rotating maze before the chamber floods.',
      galaxy: 'Stabilize relay logic using branching node equations under vacuum pressure.',
      planet: 'Clear a colony logic-grid where each wrong move rewrites the bunker route.',
      wtw: 'Resolve district tribunal puzzles (cryptogram, maze, logic grid, and symbol-sudoku chains).'
    };
    Object.keys(minimumBossPools).forEach(function (catalogRegion) {
      if (!Array.isArray(bossCatalog[catalogRegion])) bossCatalog[catalogRegion] = [];
      while (bossCatalog[catalogRegion].length < 5) {
        var poolName = minimumBossPools[catalogRegion][bossCatalog[catalogRegion].length] || ('Regional Tyrant ' + (bossCatalog[catalogRegion].length + 1));
        bossCatalog[catalogRegion].push({
          name: poolName,
          puzzle: defaultPuzzleByRegion[catalogRegion] || defaultPuzzleByRegion.province,
          lore: 'Lore Fragment: ' + poolName + ' controls the pressure routes in the ' + catalogRegion + ' theater. If it survives, safe passage collapses into tribute corridors.',
          cinematic: {
            opener: poolName + ' answers your breach with a chamber-wide warning pulse.',
            setup: 'The room telegraphs collapse one beat early. Zone calls decide whether the team survives.',
            challenge: 'Defeat ' + poolName + ' before repeated failures trigger escalation mechanics.'
          },
          actions: [
            'Telegraphed wipe: warning appears one round early, then the zone turns lethal.',
            'Escalation chain: two failed turns in a row raise boss pressure and Dread.',
            'Immunity gate: boss ignores damage unless three distinct prep actions succeed.',
            'AP Break: One exposed target loses its next action.',
            'Summon Pressure: Calls in adds or revives a broken mechanic unless interrupted.',
            'Darkened Chamber: Applies Shaken or Vulnerable to every uncovered lane.'
          ]
        });
      }
    });
    var fallbackBoss = {
      name: 'Shard Sovereign',
      puzzle: 'A logic lock must be solved before the false chamber seals become permanent.',
      lore: 'Lore Fragment: The Shard Sovereign rules a broken route network by turning every surviving passage into tribute.',
      cinematic: {
        opener: 'The last safe path narrows until only the boss chamber remains lit.',
        setup: 'Every wall is carved with failed routes and the names of the people who tried them.',
        challenge: 'If the Sovereign survives, this region loses another critical road, port, or lane.'
      },
      actions: [
        'Shatter Pulse: Raidwide pressure breaks across every lane.',
        'Pattern Debt: Mechanics must answer the shift before the room loops.',
        'Overrun Ledger: Front and Support must cover the same beat or lose the line.',
        'Black Seal: Removes 1 AP from the nearest target.',
        'Soul Recall: Revives a fallen add at half Health.',
        'Night Tax: Uncovered targets gain Vulnerable until the next successful round.'
      ]
    };
    var chosenBoss = pickLegacyRaidEntry(bossCatalog[region], seed, fallbackBoss);
    mission.legacyRaidRegion = region;
    if (!mission.legacyRaidBoss) mission.legacyRaidBoss = String(chosenBoss.name || fallbackBoss.name);
    if (!mission.legacyRaidPuzzle) mission.legacyRaidPuzzle = String(chosenBoss.puzzle || fallbackBoss.puzzle);
    if (!mission.legacyRaidBossActions || !mission.legacyRaidBossActions.length) {
      mission.legacyRaidBossActions = (chosenBoss.actions || fallbackBoss.actions || []).slice();
    }
    if (!mission.legacyRaidBossCinematic || typeof mission.legacyRaidBossCinematic !== 'object') {
      mission.legacyRaidBossCinematic = {
        opener: String(chosenBoss.cinematic && chosenBoss.cinematic.opener || fallbackBoss.cinematic.opener),
        setup: String(chosenBoss.cinematic && chosenBoss.cinematic.setup || fallbackBoss.cinematic.setup),
        challenge: String(chosenBoss.cinematic && chosenBoss.cinematic.challenge || fallbackBoss.cinematic.challenge)
      };
    }
    if (!mission.legacyRaidBossRequiredWeapon) {
      mission.legacyRaidBossRequiredWeapon = String(chosenBoss.requiresWeapon || getLegacyRaidBossRequiredWeapon(region, mission.legacyRaidBoss) || '');
    }
    if (typeof mission.legacyRaidBossWeaponAcquired !== 'boolean') {
      mission.legacyRaidBossWeaponAcquired = !mission.legacyRaidBossRequiredWeapon;
    }
    if (!mission.step1Intro) {
      mission.step1Intro = 'Wing 1 is the lore breach. Recover the fragment that explains why ' + mission.legacyRaidBoss + ' matters to this route network before the timer collapses.';
    }
    if (!mission.lore) {
      mission.lore = String(chosenBoss.lore || fallbackBoss.lore);
    }
    if (!Array.isArray(mission.checkpoints) || !mission.checkpoints.length) {
      mission.checkpoints = [
        'Wing 1 checkpoint: recover the lore fragment and reset the raid timer.',
        'Wing 2 checkpoint: solve the door logic and reopen the route under pressure.',
        'Wing 3 checkpoint: breach the chamber, play the cinematic, then defeat ' + mission.legacyRaidBoss + '.'
      ];
    }
    mission.steps[1].name = 'Recover the Lore Fragment';
    mission.steps[2].name = 'Open the Dungeon Door';
    mission.steps[3].name = 'Reach and Defeat ' + mission.legacyRaidBoss;
    if (!mission.legacyRaidProfile || typeof mission.legacyRaidProfile !== 'object') {
      mission.legacyRaidProfile = {
        clockSegments: 14,
        roomDdBonus: 1,
        roomProgressBonus: 0,
        approachDdBonus: 2,
        bossHpPhases: 3,
        bossStrikesAllowed: 3,
        bossActionCadence: 1,
        actionPressureBonus: region === 'galaxy' ? 2 : 1
      };
    }
    return mission;
  }

  function resetLegacyRaidClockAtWingEntry(mission, wingNum) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return 0;
    if (!run.wingEntryReset || typeof run.wingEntryReset !== 'object') {
      run.wingEntryReset = { 1: false, 2: false, 3: false };
    }
    var wing = Math.max(1, Math.min(3, Number(wingNum || run.currentWing || 1)));
    if (run.wingEntryReset[wing]) return Number(run.clockRemaining || ensureLegacyRaidClock(mission));
    run.wingEntryReset[wing] = true;
    return resetLegacyRaidClockAtCheckpoint(mission);
  }

  function ensureLegacyRaidLorePieces(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidLorePieces || typeof mission.legacyRaidLorePieces !== 'object') {
      mission.legacyRaidLorePieces = { collected: 0, required: 3 };
    }
    mission.legacyRaidLorePieces.collected = Math.max(0, Number(mission.legacyRaidLorePieces.collected || 0));
    mission.legacyRaidLorePieces.required = Math.max(1, Number(mission.legacyRaidLorePieces.required || 3));
    return mission.legacyRaidLorePieces;
  }

  function openLegacyRaidBossCinematic(missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    ensureLegacyRaidMissionConfig(mission);
    if (mission.legacyRaidBossCinematicSeen) return false;
    mission.legacyRaidBossCinematicSeen = true;
    var scene = mission.legacyRaidBossCinematic || {};
    var encounter = mission.legacyRaidBossEncounter || {};
    var skipHappened = mission.legacyRaidSkipPhase2 === false && Number(encounter.phase || 1) === 3;
    var phase3Profile = encounter.phaseProfiles && encounter.phaseProfiles[2] || null;
    var phase3Hp = Number(phase3Profile && phase3Profile.hp || encounter.maxPhaseHp || 20);
    var phase3Dread = Number(phase3Profile && phase3Profile.dread || encounter.dreadDie || 12);
    var phase3Flavor = String(phase3Profile && phase3Profile.text || encounter.phaseFlavor || 'Final confrontation — the boss has abandoned all restraint.');
    var skipBannerHtml = skipHappened
      ? '<div style="margin:.2rem 0 .3rem;padding:.2rem .32rem;background:rgba(126,215,255,.08);border-left:3px solid var(--teal);font-size:.74rem;color:var(--teal);">'
        + '<strong>\u26a1 Breach Override Active</strong> — Lockpick exploit succeeded. Phase 2 systems were bypassed; the boss surges directly to Phase 3 in a destabilized state.'
        + '</div>'
      : '';
    var phase3StatsHtml = '<div style="margin-top:.22rem;padding:.16rem .28rem;background:rgba(255,255,255,.04);border:1px solid var(--border2);font-size:.68rem;color:var(--muted2);line-height:1.55;">'
      + '<div style="color:var(--gold2);font-size:.7rem;margin-bottom:.08rem;"><strong>\u2620 Phase 3 — Final Form</strong></div>'
      + '<div>\u2665 Boss HP: <span style="color:var(--text2);">' + phase3Hp + '</span></div>'
      + '<div>\ud83c\udfb2 Dread Die: <span style="color:var(--text2);">d' + phase3Dread + '</span></div>'
      + '<div style="color:var(--muted3);font-style:italic;margin-top:.06rem;">' + phase3Flavor + '</div>'
      + '</div>';
    openModal(
      '\ud83c\udfac Boss Cinematic \u2014 ' + String(mission.legacyRaidBoss || 'Raid Boss'),
      '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
        + '<div style="font-size:.88rem;color:var(--gold2);margin-bottom:.18rem;"><strong>' + String(scene.opener || 'The chamber shudders. Something is wrong.') + '</strong></div>'
        + '<div style="margin-bottom:.22rem;">' + String(scene.setup || 'The boss absorbs the lockpick shock, circuits sparking — normal phase protocols have collapsed.') + '</div>'
        + '<div style="margin-bottom:.14rem;color:var(--muted2);">' + String(scene.challenge || 'What happens next was never supposed to happen.') + '</div>'
        + skipBannerHtml
        + phase3StatsHtml
        + '<div style="display:flex;justify-content:flex-end;margin-top:.36rem;">'
        + '<button class="btn btn-sm btn-primary" onclick="closeModal();openWing3BossCombatModal(' + mission.id + ');">\u2694 Face Phase 3</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  function openLegacyRaidBossPhaseTransitionCinematic(mission, fromPhase, toPhase) {
    if (!mission) return false;
    var encounter = mission.legacyRaidBossEncounter || {};
    var profile = encounter.phaseProfiles && encounter.phaseProfiles[Math.max(0, Number(toPhase || 1) - 1)] || null;
    var hp = Math.max(1, Number(profile && profile.hp || encounter.maxPhaseHp || 20));
    var dread = Math.max(4, Number(profile && profile.dread || encounter.dreadDie || 10));
    var flavor = String(profile && profile.text || encounter.phaseFlavor || 'The boss mutates into a deadlier pattern.');
    openModal(
      '🎬 Phase Transition — ' + String(mission.legacyRaidBoss || 'Raid Boss'),
      '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
        + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.2rem;"><strong>Phase ' + Number(fromPhase || 1) + ' → Phase ' + Number(toPhase || 2) + '</strong></div>'
        + '<div style="margin-bottom:.24rem;color:var(--muted2);">The chamber fractures as the boss adapts. New behavior patterns detected.</div>'
        + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.03);padding:.2rem .28rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Incoming Phase ' + Number(toPhase || 2) + '</strong></div>'
        + '<div style="font-size:.7rem;color:var(--text2);">Boss HP: ' + hp + '</div>'
        + '<div style="font-size:.7rem;color:var(--text2);">Dread Die: d' + dread + '</div>'
        + '<div style="font-size:.68rem;color:var(--muted3);font-style:italic;margin-top:.08rem;">' + flavor + '</div>'
        + '</div>'
        + '<div style="display:flex;justify-content:flex-end;margin-top:.34rem;">'
        + '<button class="btn btn-sm btn-primary" onclick="closeModal();openWing3BossCombatModal(' + mission.id + ');">Continue Battle</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  function normalizeLegacyRaidBossPhaseState(mission, encounter, options) {
    if (!mission || !encounter) return '';
    if (Number(encounter.phaseHp || 0) > 0) return '';
    var phase = Math.max(1, Number(encounter.phase || 1));
    if (phase >= 3) {
      window.resolveRaidBossRoom(mission.id, true);
      return 'victory';
    }
    var skipPhaseTwo = phase === 1 && (encounter.skipPhaseTwoPending || mission.legacyRaidSkipPhase2 || (options && options.forceSkipPhaseTwo));
    if (skipPhaseTwo) {
      encounter.phase = 3;
      encounter.skipPhaseTwoPending = false;
      mission.legacyRaidSkipPhase2 = false;
      encounter.log = encounter.log || [];
      encounter.log.push('Breach override engaged: Phase 2 skipped. Jumping directly to Phase 3.');
    } else {
      encounter.phase = phase + 1;
    }
    var nextProfile = encounter.phaseProfiles && encounter.phaseProfiles[Math.max(0, Number(encounter.phase || 1) - 1)] || null;
    encounter.phaseHp = Math.max(1, Number(nextProfile && nextProfile.hp || 20));
    encounter.maxPhaseHp = Math.max(1, Number(nextProfile && nextProfile.hp || encounter.maxPhaseHp || 20));
    encounter.dreadDie = Math.max(4, Number(nextProfile && nextProfile.dread || encounter.dreadDie || 10));
    encounter.phaseFlavor = String(nextProfile && nextProfile.text || encounter.phaseFlavor || 'Boss pattern escalating.');
    encounter.turnStage = 'player';
    encounter.allyActionsUsed = 0;
    resetLegacyRaidAllyActionBudget(mission, encounter);
    encounter.log = encounter.log || [];
    encounter.log.push('Boss phase shifted to Phase ' + Number(encounter.phase || 1) + '.');
    if (skipPhaseTwo && (!options || options.openCinematic !== false) && !mission.legacyRaidBossCinematicSeen) {
      openLegacyRaidBossCinematic(mission.id);
      return 'cinematic';
    }
    if (!skipPhaseTwo && options && options.openCinematic) {
      openLegacyRaidBossPhaseTransitionCinematic(mission, phase, encounter.phase);
      return 'cinematic';
    }
    return 'phase';
  }

  function buildLegacyRaidRecommendedCallouts(mission, encounter) {
    if (!encounter) return '';
    var turnNode = getLegacyRaidTimelineTurn(encounter) || { turn: Number(encounter.turn || 1), beat: 'Unknown Beat' };
    var hazard = String(encounter.hazardLane || 'center');
    var lines = [];
    lines.push('Front: ' + (hazard === 'left' ? 'Guard now and shift off left lane hazard.' : 'Anchor and prep Breach for this beat.'));
    lines.push('Mechanics: ' + (turnNode.branch ? 'Decode now; branch beat can spike Dread.' : 'Stabilize if strikes are rising, otherwise Decode.'));
    lines.push('Support: ' + (Number(encounter.raidwideHits || 0) >= 1 ? 'Cleanse now; Rally after pressure resolves.' : 'Rally now; hold Cleanse for raidwide pulse.'));
    if (Number(turnNode.turn || 0) >= 6) {
      lines.push('Wayfarers: Command support before final pressure window closes.');
    }
    return '<div style="margin:.14rem 0 .2rem;padding:.2rem .24rem;border:1px dashed var(--border2);background:rgba(90,140,220,.08);">'
      + '<div style="font-size:.65rem;color:var(--gold2);margin-bottom:.08rem;">Recommended Callouts · Turn ' + Number(turnNode.turn || 1) + '</div>'
      + lines.map(function (line) { return '<div style="font-size:.64rem;color:var(--muted2);line-height:1.4;">• ' + line + '</div>'; }).join('')
      + '</div>';
  }

  function ensureLegacyRaidTeamUtilities(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return null;
    if (!run.raidUtilities || typeof run.raidUtilities !== 'object') {
      run.raidUtilities = {
        team_barrier: { cd: 0, baseCd: 4 },
        emergency_rez: { cd: 0, baseCd: 5 },
        time_extension: { cd: 0, baseCd: 4 },
        cleanse_pulse: { cd: 0, baseCd: 4 }
      };
    }
    return run.raidUtilities;
  }

  function tickLegacyRaidTeamUtilityCooldowns(mission) {
    var utilities = ensureLegacyRaidTeamUtilities(mission);
    if (!utilities) return;
    Object.keys(utilities).forEach(function (key) {
      var item = utilities[key];
      if (!item) return;
      item.cd = Math.max(0, Number(item.cd || 0) - 1);
    });
  }

  function pushLegacyRaidReplayEvent(mission, event) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return;
    if (!Array.isArray(run.raidReplay)) run.raidReplay = [];
    run.raidReplay.push({
      wing: Number(run.currentWing || 1),
      turn: Number(event && event.turn || 0),
      cause: String(event && event.cause || 'Unknown failure'),
      detail: String(event && event.detail || ''),
      hint: String(event && event.hint || '')
    });
    if (run.raidReplay.length > 20) run.raidReplay = run.raidReplay.slice(-20);
  }

  function buildLegacyRaidReplaySummary(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run || !Array.isArray(run.raidReplay) || !run.raidReplay.length) return '';
    var recent = run.raidReplay.slice(-5);
    return '<div style="margin-top:.3rem;padding:.35rem .4rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);">'
      + '<div style="font-size:.69rem;color:var(--gold2);margin-bottom:.14rem;">Wipe Replay Coaching</div>'
      + recent.map(function (entry) {
        return '<div style="font-size:.67rem;color:var(--muted2);line-height:1.4;margin-bottom:.1rem;">• <strong style="color:var(--text2);">' + String(entry.cause || 'Failure') + '</strong>'
          + (entry.detail ? (' — ' + String(entry.detail)) : '')
          + (entry.hint ? (' <span style="color:var(--teal);">Hint: ' + String(entry.hint) + '</span>') : '')
          + '</div>';
      }).join('')
      + '</div>';
  }

  function ensureLegacyRaidLeadInState(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidLeadIn || typeof mission.legacyRaidLeadIn !== 'object') {
      mission.legacyRaidLeadIn = {
        1: { completed: false, result: '', attempts: 0 },
        2: { completed: false, result: '', attempts: 0 }
      };
    }
    return mission.legacyRaidLeadIn;
  }

  function getLegacyRaidLeadInObjective(mission, wingNum) {
    var boss = String(mission && mission.legacyRaidBoss || 'the boss');
    if (Number(wingNum || 1) === 1) {
      return {
        title: 'Lead-In Mission: Lore Breach',
        text: 'Scout allies and recover the first fragment explaining why ' + boss + ' matters to this region before committing the raid team to Wing 1.',
        success: 'Lore route secured. Wing 1 tactical readiness +1.',
        failure: 'Intel partial. Wing 1 starts strained (+1 wing failure marker).'
      };
    }
    return {
      title: 'Lead-In Mission: Gate Setup',
      text: 'Establish room assignments and decode preliminary mechanism traces before entering Wing 2.',
      success: 'Mechanism route stabilized. Wing 2 starts with +1 room bonus.',
      failure: 'Setup incomplete. Wing 2 room pressure increases.'
    };
  }

  function openLegacyRaidLeadInMissionModal(missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var lead = ensureLegacyRaidLeadInState(mission);
    if (!lead) return false;
    var wing = Math.max(1, Math.min(2, Number(wingNum || 1)));
    if (lead[wing] && lead[wing].completed) {
      return openRaidWingPopup(mission.id, wing);
    }
    var objective = getLegacyRaidLeadInObjective(mission, wing);
    openModal(
      objective.title,
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="margin-bottom:.35rem;">' + objective.text + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);margin-bottom:.28rem;">Resolve this lead-in mission, then launch Wing ' + wing + '.</div>'
        + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-red" onclick="resolveLegacyRaidLeadIn(' + mission.id + ',' + wing + ',false)">Lead-In Failed</button>'
        + '<button class="btn btn-sm btn-primary" onclick="resolveLegacyRaidLeadIn(' + mission.id + ',' + wing + ',true)">Lead-In Success</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }
  window.openLegacyRaidLeadInMissionModal = openLegacyRaidLeadInMissionModal;

  window.resolveLegacyRaidLeadIn = function (missionId, wingNum, success) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var lead = ensureLegacyRaidLeadInState(mission);
    var wing = Math.max(1, Math.min(2, Number(wingNum || 1)));
    var objective = getLegacyRaidLeadInObjective(mission, wing);
    lead[wing] = lead[wing] || { completed: false, result: '', attempts: 0 };
    lead[wing].attempts = Number(lead[wing].attempts || 0) + 1;
    lead[wing].completed = true;
    lead[wing].result = success ? objective.success : objective.failure;

    if (success) {
      if (wing === 1) {
        mission.bonus = Math.min(20, Number(mission.bonus || 0) + 1);
      } else {
        if (!mission.legacyRaidRoomAssist || typeof mission.legacyRaidRoomAssist !== 'object') mission.legacyRaidRoomAssist = {};
        mission.legacyRaidRoomAssist['2:0'] = Number(mission.legacyRaidRoomAssist['2:0'] || 0) + 1;
      }
      if (typeof showNotif === 'function') showNotif('Lead-in mission complete: Wing ' + wing + ' unlocked with tactical bonus.', 'good');
    } else {
      var run = ensureLegacyRaidRunState(mission);
      if (run) markLegacyRaidWingOutcome(mission, wing, false);
      if (typeof showNotif === 'function') showNotif('Lead-in mission failed. Wing ' + wing + ' can still proceed, but under pressure.', 'warn');
    }
    if (typeof closeModal === 'function') closeModal();
    return openRaidWingPopup(mission.id, wing);
  };

  function ensureLegacyRaidClock(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return 0;
    var profile = getLegacyRaidProfile(mission);
    var baseClock = Math.max(10, Number(profile.clockSegments || 14));
    if (!Number.isFinite(Number(run.clockRemaining || 0)) || Number(run.clockRemaining || 0) <= 0) {
      run.clockRemaining = baseClock;
    }
    return Number(run.clockRemaining || baseClock);
  }

  function resetLegacyRaidClockAtCheckpoint(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return 0;
    var profile = getLegacyRaidProfile(mission);
    var baseClock = Math.max(10, Number(profile.clockSegments || 14));
    run.clockRemaining = baseClock;
    resetLegacyRaidResourcePools(mission);
    return baseClock;
  }

  function consumeLegacyRaidClock(mission, wingNum, reasonLabel) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    ensureLegacyRaidClock(mission);
    run.clockRemaining = Math.max(0, Number(run.clockRemaining || 0) - 1);
    if (run.clockRemaining > 0) return false;
    run.pendingWing = Math.max(1, Math.min(3, Number(wingNum || run.currentWing || 3)));
    run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, run.pendingWing);
    run.wipes = Number(run.wipes || 0) + 1;
    markLegacyRaidWingOutcome(mission, run.pendingWing, false);
    pushLegacyRaidReplayEvent(mission, {
      turn: 0,
      cause: 'Timer expired',
      detail: 'Raid clock hit zero during ' + String(reasonLabel || 'encounter') + '.',
      hint: 'Use Time Extension utility or choose safer routes before high-pressure beats.'
    });
    if (typeof showNotif === 'function') {
      showNotif('Raid timer expired during ' + String(reasonLabel || 'encounter') + '. Forced wipe.', 'warn');
    }
    openLegacyRaidWipeDecision(mission.id);
    return true;
  }

  function ensureLegacyRaidWingLootState(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidWingLoot || typeof mission.legacyRaidWingLoot !== 'object') {
      mission.legacyRaidWingLoot = { 1: null, 2: null, 3: null };
    }
    return mission.legacyRaidWingLoot;
  }

  function getLegacyRaidChestStyle(rarity) {
    var key = String(rarity || 'bronze').toLowerCase();
    if (key === 'mythic') {
      return {
        label: 'Mythic',
        border: 'rgba(163,120,255,.8)',
        bg: 'linear-gradient(135deg, rgba(44,22,68,.48), rgba(22,18,48,.58))',
        glow: '0 0 14px rgba(163,120,255,.32), inset 0 0 10px rgba(163,120,255,.18)',
        text: '#d8c6ff'
      };
    }
    if (key === 'gold') {
      return {
        label: 'Gold',
        border: 'rgba(240,208,112,.75)',
        bg: 'linear-gradient(135deg, rgba(66,52,18,.4), rgba(32,26,10,.55))',
        glow: '0 0 12px rgba(240,208,112,.28), inset 0 0 8px rgba(240,208,112,.16)',
        text: '#f0d070'
      };
    }
    if (key === 'silver') {
      return {
        label: 'Silver',
        border: 'rgba(192,202,214,.72)',
        bg: 'linear-gradient(135deg, rgba(46,52,60,.38), rgba(24,28,34,.52))',
        glow: '0 0 10px rgba(192,202,214,.24), inset 0 0 7px rgba(192,202,214,.14)',
        text: '#c8d4df'
      };
    }
    return {
      label: 'Bronze',
      border: 'rgba(198,136,95,.72)',
      bg: 'linear-gradient(135deg, rgba(74,42,24,.38), rgba(34,22,14,.5))',
      glow: '0 0 8px rgba(198,136,95,.22), inset 0 0 6px rgba(198,136,95,.12)',
      text: '#cf9c75'
    };
  }

  function buildLegacyRaidWingLootOptions(mission, wingNum) {
    var bossName = String(mission && mission.legacyRaidBoss || 'Raid Boss');
    if (Number(wingNum || 1) === 1) {
      return [
        {
          id: 'wing1-cartography',
          rarity: 'bronze',
          line: bossName + ' Surveyor Cache',
          detail: '+1 Raid Clock tick, +1 tactical bonus, and +1 interrupt progress during boss pressure windows.',
          apply: function (m) {
            var run = ensureLegacyRaidRunState(m);
            ensureLegacyRaidClock(m);
            if (run) run.clockRemaining = Number(run.clockRemaining || 0) + 1;
            m.bonus = Math.min(20, Number(m.bonus || 0) + 1);
            var p = ensureLegacyRaidPerks(m);
            p.interruptWindow = Number(p.interruptWindow || 0) + 1;
          }
        },
        {
          id: 'wing1-intel',
          rarity: 'silver',
          line: bossName + ' Lore Decoder Slate',
          detail: '+1 raid point reward and +1 extra Gambling chip for wager rooms.',
          apply: function (m) {
            m.legacyRaidPointReward = Number(m.legacyRaidPointReward || 1) + 1;
            m.bonus = Math.min(20, Number(m.bonus || 0) + 1);
            var p = ensureLegacyRaidPerks(m);
            p.gamblingChipBonus = Number(p.gamblingChipBonus || 0) + 1;
          }
        }
      ];
    }
    if (Number(wingNum || 1) === 2) {
      return [
        {
          id: 'wing2-armory',
          rarity: 'silver',
          line: bossName + ' Armory Spoils Chest',
          detail: (mission && mission.legacyRaidBossRequiredWeapon
            ? ('Acquire required weapon: ' + String(mission.legacyRaidBossRequiredWeapon) + ' · ')
            : '') + '+1 medal reward, +2 raid power bonus, and one free Recover per combat room.',
          apply: function (m) {
            m.legacyRaidMedalReward = Number(m.legacyRaidMedalReward || 1) + 1;
            m.legacyRaidPowerBonus = Number(m.legacyRaidPowerBonus || 0) + 2;
            m.bonus = Math.min(20, Number(m.bonus || 0) + 2);
            var p = ensureLegacyRaidPerks(m);
            p.freeRecoverPerWing = Number(p.freeRecoverPerWing || 0) + 1;
            if (m.legacyRaidBossRequiredWeapon) {
              m.legacyRaidBossWeaponAcquired = true;
            }
          }
        },
        {
          id: 'wing2-wayfarer',
          rarity: 'gold',
          line: bossName + ' Wayfarer Contract Chest',
          detail: 'Restore one fallen Traveling Wayfarer, gain one free checkpoint revive token, and improve Wayfarer assist potency.',
          apply: function (m) {
            var wayfarers = getRaidWayfarersForWing(m, 2);
            var restored = false;
            for (var i = 0; i < wayfarers.length; i++) {
              if (wayfarers[i].status === 'failed') {
                wayfarers[i].status = 'ready';
                wayfarers[i].wing = null;
                restored = true;
                break;
              }
            }
            var run = ensureLegacyRaidRunState(m);
            if (run) run.freeReviveTokens = Number(run.freeReviveTokens || 0) + 1;
            if (!restored && run) run.clockRemaining = Number(run.clockRemaining || 0) + 1;
            var p = ensureLegacyRaidPerks(m);
            p.wayfarerAssistBonus = Number(p.wayfarerAssistBonus || 0) + 1;
          }
        }
      ];
    }
    return [
      {
        id: 'wing3-triumph',
        rarity: 'gold',
        line: bossName + ' Triumph Reliquary',
        detail: '+1 medal and +1 raid point added to end-of-raid payout.',
        apply: function (m) {
          m.legacyRaidMedalReward = Number(m.legacyRaidMedalReward || 1) + 1;
          m.legacyRaidPointReward = Number(m.legacyRaidPointReward || 1) + 1;
        }
      },
      {
        id: 'wing3-imprint',
        rarity: 'mythic',
        line: bossName + ' Trophy Imprint',
        detail: '+3 raid power bonus and trophy imprint logged on completion.',
        apply: function (m) {
          m.legacyRaidPowerBonus = Number(m.legacyRaidPowerBonus || 0) + 3;
          m.bonus = Math.min(20, Number(m.bonus || 0) + 3);
          m.legacyRaidTrophyImprint = bossName;
        }
      }
    ];
  }

  function openLegacyRaidWingLootChoice(missionId, wingNum, completionStage) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var lootState = ensureLegacyRaidWingLootState(mission);
    var w = Math.max(1, Math.min(3, Number(wingNum || 1)));
    if (lootState && lootState[w]) {
      return completeLegacyRaidWingAfterLoot(mission.id, w, completionStage || 'advance');
    }
    var options = buildLegacyRaidWingLootOptions(mission, w);
    if (!options.length) return completeLegacyRaidWingAfterLoot(mission.id, w, completionStage || 'advance');
    openModal(
      'Wing ' + w + ' Chest Reveal',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="margin-bottom:.35rem;color:var(--gold2);"><strong>Raid Chest Revealed</strong> — choose one reward line before advancing.</div>'
        + options.map(function (opt) {
            var style = getLegacyRaidChestStyle(opt.rarity);
            return '<div style="background:' + style.bg + ';border:1px solid ' + style.border + ';box-shadow:' + style.glow + ';padding:.45rem .5rem;margin-bottom:.28rem;border-radius:6px;">'
              + '<div style="display:flex;justify-content:space-between;align-items:center;gap:.3rem;margin-bottom:.08rem;">'
              + '<div style="font-size:.75rem;color:var(--text2);"><strong>' + opt.line + '</strong></div>'
              + '<div style="font-size:.62rem;color:' + style.text + ';text-transform:uppercase;letter-spacing:.08em;">' + style.label + '</div>'
              + '</div>'
              + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;margin-bottom:.22rem;">' + opt.detail + '</div>'
              + '<button class="btn btn-xs btn-primary" onclick="claimLegacyRaidWingLoot(' + mission.id + ',' + w + ',\'' + String(opt.id) + '\',\'' + String(completionStage || 'advance') + '\')">Choose Reward Line</button>'
              + '</div>';
          }).join('')
      + '</div>'
    );
    return true;
  }

  window.claimLegacyRaidWingLoot = function (missionId, wingNum, optionId, completionStage) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var w = Math.max(1, Math.min(3, Number(wingNum || 1)));
    var lootState = ensureLegacyRaidWingLootState(mission);
    if (lootState && lootState[w]) {
      return completeLegacyRaidWingAfterLoot(mission.id, w, completionStage || 'advance');
    }
    var options = buildLegacyRaidWingLootOptions(mission, w);
    var choice = null;
    for (var i = 0; i < options.length; i++) {
      if (String(options[i].id) === String(optionId || '')) {
        choice = options[i];
        break;
      }
    }
    if (!choice) return false;
    if (typeof choice.apply === 'function') choice.apply(mission);
    if (lootState) {
      var chosenStyle = getLegacyRaidChestStyle(choice.rarity);
      lootState[w] = {
        id: String(choice.id || ''),
        rarity: String(choice.rarity || ''),
        rarityLabel: String(chosenStyle.label || ''),
        line: String(choice.line || 'Wing Reward'),
        detail: String(choice.detail || '')
      };
    }
    if (typeof showNotif === 'function') showNotif('Wing ' + w + ' reward claimed: ' + String(choice.line || 'Reward'), 'good');
    return completeLegacyRaidWingAfterLoot(mission.id, w, completionStage || 'advance');
  };

  function completeLegacyRaidWingAfterLoot(missionId, wingNum, completionStage) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    var w = Math.max(1, Math.min(3, Number(wingNum || 1)));
    var stage = String(completionStage || 'advance');
    if (w === 1) {
      mission.steps[1] = mission.steps[1] || {};
      mission.steps[1].completed = true;
      if (run) markLegacyRaidWingOutcome(mission, 1, true);
      if (run) run.checkpointWing = 2;
      resetLegacyRaidClockAtCheckpoint(mission);
      if (typeof removeInformerToken === 'function') removeInformerToken(mission);
      if (typeof showNotif === 'function') showNotif('Wing 1 clear confirmed. Wing 2 unlocked. Raid timer reset at checkpoint.', 'good');
    } else if (w === 2) {
      mission.steps[2] = mission.steps[2] || {};
      mission.steps[2].completed = true;
      if (run) markLegacyRaidWingOutcome(mission, 2, true);
      if (run) run.checkpointWing = 3;
      resetLegacyRaidClockAtCheckpoint(mission);
      if (typeof removeSiteToken === 'function') removeSiteToken(mission);
      if (typeof showNotif === 'function') showNotif('Wing 2 clear confirmed. Boss chamber unlocked. Raid timer reset at checkpoint.', 'good');
    } else {
      mission.steps[3] = mission.steps[3] || {};
      mission.steps[3].completed = true;
      if (run) markLegacyRaidWingOutcome(mission, 3, true);
    }

    if (typeof refreshMissionSurfaces === 'function') refreshMissionSurfaces();
    if (typeof closeModal === 'function') closeModal();

    if (w === 1) {
      if (typeof openRaidWingPopup === 'function') {
        setTimeout(function () {
          try { openRaidWingPopup(mission.id, 2); } catch (_err) {}
        }, 0);
      }
      return true;
    }

    if (w === 2) {
      if (typeof openRaidWingPopup === 'function') {
        setTimeout(function () {
          try { openRaidWingPopup(mission.id, 3); } catch (_err) {}
        }, 0);
      }
      return true;
    }
    if (w === 3 && stage === 'raid-clear') {
      var clearSummary = buildLegacyRaidClearSummary(mission);
      return finalizeLegacyRaidClear(mission.id, Number(clearSummary && clearSummary.bonusMedals || 0));
    }
    return true;
  }

  function getLegacyRaidRoomRoleKey(wingNum, roomIdx) {
    return String(wingNum) + ':' + String(roomIdx);
  }

  function openLegacyRaidLootRecoveryModal(mission) {
    if (!mission) return false;
    var vault = ensureLegacyRaidLootVault(mission);
    if (!vault) return false;
    var loot = Array.isArray(vault.loot) ? vault.loot : [];
    var keys = vault.keys || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    var lootHtml = loot.length
      ? loot.map(function (item, idx) {
          return '<div style="font-size:.65rem;color:var(--text2);line-height:1.42;padding:.06rem 0;border-bottom:1px solid rgba(255,255,255,.05);">'
            + (idx + 1) + '. ' + String(item || 'Unknown Item') + '</div>';
        }).join('')
      : '<div style="font-size:.65rem;color:var(--muted3);">No loot items collected.</div>';
    var keysList = [];
    if (Number(keys.bronze || 0) > 0) keysList.push('Bronze × ' + Number(keys.bronze));
    if (Number(keys.silver || 0) > 0) keysList.push('Silver × ' + Number(keys.silver));
    if (Number(keys.gold || 0) > 0) keysList.push('Gold × ' + Number(keys.gold));
    if (Number(keys.platinum || 0) > 0) keysList.push('Platinum × ' + Number(keys.platinum));
    var keysHtml = keysList.length
      ? keysList.map(function (k) { return '<div style="font-size:.65rem;color:var(--gold2);padding:.04rem 0;">🔑 ' + k + '</div>'; }).join('')
      : '<div style="font-size:.65rem;color:var(--muted3);">No keys collected.</div>';
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-bottom:.32rem;">'
      + '<div style="border:1px solid var(--border2);padding:.28rem;background:rgba(255,255,255,.03);">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Collected Loot</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.12rem;">' + loot.length + ' item(s) secured</div>'
      + '<div style="max-height:160px;overflow-y:auto;padding-right:.12rem;">' + lootHtml + '</div>'
      + '</div>'
      + '<div style="border:1px solid var(--border2);padding:.28rem;background:rgba(255,255,255,.03);">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Vault Keys</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.12rem;">Keys to boss loot</div>'
      + keysHtml
      + '</div>'
      + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);line-height:1.5;margin-bottom:.24rem;">'
      + '<strong>Raid Complete.</strong> Choose to claim your spoils into your backpack, or sell them to a fence for immediate credits.'
      + '</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.claimRaidLootToBackpack(' + mission.id + ')">📦 Claim to Backpack</button>'
      + '<button class="btn btn-xs btn-warn" onclick="window.sellRaidLootForCredits(' + mission.id + ')">💰 Sell for Credits</button>'
      + '</div>'
      + '</div>';
    openModal('Raid Complete — Loot Recovery', html);
    return true;
  }

  window.claimRaidLootToBackpack = function (missionId) {
    var mission = getMission(missionId);
    if (!mission) return;
    var vault = ensureLegacyRaidLootVault(mission);
    if (!vault || !vault.loot.length) {
      if (typeof showNotif === 'function') showNotif('No loot to claim.', 'info');
      closeModal();
      if (typeof resolveMissionOutcome === 'function') resolveMissionOutcome(mission.id, true);
      return;
    }
    var total = 0;
    if (typeof S !== 'undefined' && S && S.backpack && Array.isArray(S.backpack)) {
      vault.loot.forEach(function (item) {
        if (item) {
          S.backpack.push(String(item));
          total++;
        }
      });
    }
    closeModal();
    if (typeof showNotif === 'function') showNotif('Claimed ' + total + ' items to your backpack.', 'good');
    if (typeof resolveMissionOutcome === 'function') resolveMissionOutcome(mission.id, true);
  };

  window.sellRaidLootForCredits = function (missionId) {
    var mission = getMission(missionId);
    if (!mission) return;
    var vault = ensureLegacyRaidLootVault(mission);
    if (!vault || !vault.loot.length) {
      if (typeof showNotif === 'function') showNotif('No loot to sell.', 'info');
      closeModal();
      if (typeof resolveMissionOutcome === 'function') resolveMissionOutcome(mission.id, true);
      return;
    }
    var creditsPerItem = 100;
    var totalCredits = vault.loot.length * creditsPerItem;
    if (typeof S !== 'undefined' && S) {
      S.credits = Math.max(0, Number(S.credits || 0) + totalCredits);
    }
    closeModal();
    if (typeof showNotif === 'function') showNotif('Sold ' + vault.loot.length + ' items for ' + totalCredits + ' credits.', 'good');
    if (typeof resolveMissionOutcome === 'function') resolveMissionOutcome(mission.id, true);
  };

  function initializeRaidCombatIfNeeded() {
    var pendingCtx = getLegacyRaidPendingHexCombat();
    if (!pendingCtx || !pendingCtx.mission || !pendingCtx.state) return;
    var mission = pendingCtx.mission;
    var state = pendingCtx.state;
    var wingNum = pendingCtx.pending.wing || 1;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) {
      encounter = {
        active: true,
        wing: wingNum,
        phase: 1,
        phaseHp: 20,
        maxPhaseHp: 20,
        dreadDie: wingNum === 1 ? 6 : (wingNum === 2 ? 10 : 10),
        allyActionBudget: { total: 6, used: 0, byAlly: {} },
        allyActionsUsed: 0,
        playerActionsLeft: 3,
        bossActionsLeft: 2,
        turnStage: 'player',
        log: [],
        partyHp: { player: 999, allies: {} }
      };
      mission.legacyRaidBossEncounter = encounter;
    }

    if (!encounter.partyHp) encounter.partyHp = { player: 999, allies: {} };
    if (!encounter.partyHp.allies) encounter.partyHp.allies = {};
    var allies = getRaidWayfarersForWing(mission, wingNum).filter(function (w) { return w && w.status !== 'failed'; });
    allies.forEach(function (ally) {
      if (typeof encounter.partyHp.allies[ally.name] !== 'number') {
        encounter.partyHp.allies[ally.name] = 12;
      }
    });
    if (!encounter.allyActionBudget.byAlly) encounter.allyActionBudget.byAlly = {};
    allies.forEach(function (ally) {
      if (typeof encounter.allyActionBudget.byAlly[ally.name] !== 'number') {
        encounter.allyActionBudget.byAlly[ally.name] = 2;
      }
    });
    return encounter;
  }

  function ensureLegacyRaidCombatHostiles(mission, wingNum, encounter) {
    if (typeof S === 'undefined' || !S) return;
    if (!Array.isArray(S.enemies)) S.enemies = [];
    var activeHostiles = S.enemies.filter(function (enemy) { return enemy && !enemy.ally; });
    if (activeHostiles.length) return;
    var bossName = String(mission && mission.legacyRaidBoss || 'Raid Hostile');
    var primaryDread = Math.max(4, Number(encounter && encounter.dreadDie || 6));
    var hostileCount = Math.max(1, Number(wingNum || 1));
    for (var i = 0; i < hostileCount; i++) {
      var hostileName = (i === 0) ? bossName : (bossName + ' Add ' + i);
      S.enemies.push({
        id: Date.now() + i + 1,
        name: hostileName,
        dread: Math.max(4, primaryDread - (i > 0 ? 1 : 0)),
        stress: 0,
        maxStress: Math.max(8, Number(encounter && encounter.maxPhaseHp || 16) - (i > 0 ? 4 : 0)),
        ally: false,
        temporarySceneAlly: false,
        faction: 'Raid Hostile'
      });
    }
  }

  function openRaidCombatModal(missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') {
      if (typeof startCombat === 'function') startCombat();
      return;
    }
    var encounter = initializeRaidCombatIfNeeded();
    if (!encounter) {
      if (typeof startCombat === 'function') startCombat();
      return;
    }
    var allies = getRaidWayfarersForWing(mission, wingNum).filter(function (w) { return w && w.status !== 'failed'; });
    if (typeof S !== 'undefined' && S) {
      if (!Array.isArray(S.enemies)) S.enemies = [];
      S.enemies = S.enemies.filter(function (enemy) { return enemy && !enemy.temporarySceneAlly; });
      var playerName = String(S.name || 'Wayfarer');
      allies.forEach(function (ally) {
        var allyName = String(ally && ally.name || 'Wayfarer');
        var exists = S.enemies.some(function (enemy) {
          return enemy && enemy.ally && String(enemy.name || '') === allyName;
        });
        if (!exists) {
          S.enemies.push({
            id: 'raid-ally-' + allyName,
            name: allyName,
            dread: Number(ally.dd || 6),
            stress: Math.max(0, 12 - Number(encounter.partyHp && encounter.partyHp.allies ? encounter.partyHp.allies[allyName] : 12)),
            maxStress: 12,
            ally: true,
            temporarySceneAlly: true,
            faction: 'Raid Ally'
          });
        }
      });
      S.combat = S.combat || {};
      ensureLegacyRaidCombatHostiles(mission, wingNum, encounter);
      S.combat.enemyDread = Math.max(4, Number(encounter.dreadDie || S.combat.enemyDread || 6));
      var armorActionCap = (typeof getMaxActions === 'function')
        ? Math.max(1, Number(getMaxActions() || 3))
        : Math.max(1, Number(S.combat.actionsLeft || 3));
      S.combat.actionsLeft = Math.max(armorActionCap, Number(S.combat.actionsLeft || 0));
      if (typeof startCombat === 'function') startCombat();
      setLegacyRaidCombatFlowActive(true, missionId, wingNum);
      if (S.combat && S.combat.raidFlow) {
        S.combat.raidFlow.hostileRangeById = S.combat.raidFlow.hostileRangeById || {};
        var firstHostile = Array.isArray(S.enemies) ? S.enemies.find(function (enemy) { return enemy && !enemy.ally; }) : null;
        if (Array.isArray(S.enemies)) {
          S.enemies.filter(function (enemy) { return enemy && !enemy.ally; }).forEach(function (enemy) {
            var key = String(Number(enemy && enemy.id || 0));
            if (!S.combat.raidFlow.hostileRangeById[key]) S.combat.raidFlow.hostileRangeById[key] = 'Engaged';
          });
        }
        if (firstHostile) {
          S.combat.raidFlow.selectedHostileId = Number(firstHostile.id || 0);
          S.combat.raidFlow.selectedHostileName = String(firstHostile.name || 'Hostile');
          if (typeof window.setCombatFocusEnemy === 'function') window.setCombatFocusEnemy(Number(firstHostile.id || 0));
        }
        S.combat.raidFlow.selectedEnemyTargetType = allies.length ? 'ally' : 'player';
        S.combat.raidFlow.selectedAllyName = allies.length ? String(allies[0].name || 'Wayfarer') : '';
      }
      if (typeof updateCombatUI === 'function') updateCombatUI();
      if (typeof renderEnemies === 'function') renderEnemies();
      if (typeof renderCombatOptions === 'function') renderCombatOptions();
      if (typeof window.refreshQuickPanelSection === 'function') {
        try { window.refreshQuickPanelSection('combat'); } catch (_err) {}
      }
      renderLegacyRaidCombatModal(missionId, wingNum);
    }
  }
  window.openRaidCombatModal = openRaidCombatModal;

  function renderLegacyRaidCombatModal(missionId, wingNum) {
    if (typeof S === 'undefined' || !S || typeof openModal !== 'function') return false;
    var prevScrollTop = 0;
    if (typeof document !== 'undefined') {
      var prevContentEl = document.getElementById('modalContent');
      if (prevContentEl) prevScrollTop = Number(prevContentEl.scrollTop || 0);
    }
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var allies = Array.isArray(S.enemies)
      ? S.enemies.filter(function (e) { return e && e.ally && e.temporarySceneAlly; })
      : [];
    var hostiles = Array.isArray(S.enemies)
      ? S.enemies.filter(function (e) { return e && !e.ally; })
      : [];
    var flow = S.combat && S.combat.raidFlow ? S.combat.raidFlow : null;
    var stage = flow && flow.active ? String(flow.stage || 'player') : 'player';
    var sceneStarted = !!(flow && flow.sceneStarted);
    var stageLabel = !sceneStarted
      ? 'Scene Not Started'
      : (stage === 'player' ? 'Player Actions' : (stage === 'ally' ? 'Ally Turn' : 'Enemy Turn'));
    var actionsLeft = Math.max(0, Number(S.combat && S.combat.actionsLeft || 0));
    var flowAllyName = flow && Array.isArray(flow.allyOrder) ? String(flow.allyOrder[Number(flow.currentAllyIndex || 0)] || '') : '';
    var flowAllyActs = flow ? Math.max(0, Number(flow.currentAllyActionsLeft || 0)) : 0;
    var enemyBudget = flow ? Math.max(0, Number(flow.enemyActionBudget || 0)) : 0;
    var playerRange = flow && flow.playerRange ? String(flow.playerRange) : 'Close';
    var selectedHostileTxt = flow && flow.selectedHostileName ? String(flow.selectedHostileName) : 'Closest hostile';
    var selectedEnemyTargetTxt = (flow && String(flow.selectedEnemyTargetType || '') === 'player')
      ? 'Wayfarer'
      : ((flow && flow.selectedAllyName) ? String(flow.selectedAllyName) : 'First alive ally');
    var moveAdjacency = {
      Engaged: ['Close'],
      Close: ['Engaged', 'Far'],
      Nearby: ['Close', 'Far'],
      Far: ['Close']
    };
    var moveTargets = moveAdjacency[String(playerRange || 'Close')] || ['Close'];
    var moveButtons = moveTargets.map(function (zone) {
      return '<button class="btn btn-sm" ' + (stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.setLegacyRaidPlayerRange(\'' + zone + '\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Move to ' + zone + '</button>';
    }).join('');
    var enemyTargetButtons = '<button class="btn btn-xs" ' + (stage === 'enemy' ? '' : 'disabled') + ' onclick="window.executeLegacyRaidSceneEnemyAction(\'player\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Target: You</button>'
      + allies.map(function (ally) {
          var allyName = String(ally && ally.name || 'Wayfarer');
          var allyArg = allyName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          return '<button class="btn btn-xs" ' + (stage === 'enemy' ? '' : 'disabled') + ' onclick="window.executeLegacyRaidSceneEnemyAction(\'ally\',\'' + allyArg + '\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Target: ' + allyName + '</button>';
        }).join('');
    var allyTargetOptions = '<option value="self">Self</option>'
      + '<option value="player">' + String((typeof S !== 'undefined' && S && S.name) || 'Wayfarer') + '</option>'
      + allies.map(function (ally) {
          var allyName = String(ally && ally.name || 'Wayfarer').replace(/"/g, '&quot;');
          return '<option value="' + allyName + '">' + allyName + '</option>';
        }).join('');

    var allyRows = allies.map(function (e) {
      var hp = Math.max(0, Number(e.maxStress || 12) - Number(e.stress || 0));
      return '<div style="font-size:.64rem;color:var(--text2);">● ' + String(e.name || 'Wayfarer') + ' (Ally) · ' + hp + ' HP</div>';
    }).join('');
    var enemyRows = hostiles.map(function (e) {
      var hp = Math.max(0, Number(e.maxStress || 8) - Number(e.stress || 0));
      var eId = Number(e && e.id || 0);
      var eRange = getLegacyRaidHostileRange(flow, eId);
      return '<div style="font-size:.64rem;color:var(--red2);padding:.08rem 0;border-bottom:1px solid rgba(255,255,255,.06);">'
        + '✕ ' + String(e.name || 'Hostile') + ' · Dread d' + Number(e.dread || 6) + ' · ' + hp + ' HP'
        + '<div style="font-size:.6rem;color:var(--muted2);margin-top:.05rem;">Relative band: <strong style="color:var(--gold2);">' + eRange + '</strong></div>'
        + '<div style="display:flex;gap:.14rem;flex-wrap:wrap;margin-top:.08rem;">'
        + '<button class="btn btn-xs" onclick="window.selectLegacyRaidHexBoardTarget(\'wing\',' + missionId + ',' + wingNum + ',\'enemy\',' + eId + ',\'' + String(e.name || 'Hostile').replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\',false);window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Target</button>'
        + '<button class="btn btn-xs" onclick="window.setLegacyRaidHostileRange(' + eId + ',\'Engaged\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Engaged</button>'
        + '<button class="btn btn-xs" onclick="window.setLegacyRaidHostileRange(' + eId + ',\'Close\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Close</button>'
        + '<button class="btn btn-xs" onclick="window.setLegacyRaidHostileRange(' + eId + ',\'Nearby\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Nearby</button>'
        + '<button class="btn btn-xs" onclick="window.setLegacyRaidHostileRange(' + eId + ',\'Far\');window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Far</button>'
        + '</div>'
        + '</div>';
    }).join('');
    var boardUnits = [];
    boardUnits.push({
      name: String((typeof S !== 'undefined' && S && S.name) || 'Wayfarer'),
      side: 'ally',
      isPlayer: true,
      hp: Math.max(0, Number(typeof S !== 'undefined' && S && S.health || 0)),
      range: normalizeLegacyRaidRange(playerRange)
    });
    allies.forEach(function (ally) {
      var allyName = String(ally && ally.name || 'Wayfarer');
      var allyRange = flow && flow.allyRange && flow.allyRange[allyName] ? flow.allyRange[allyName] : 'Close';
      boardUnits.push({
        name: allyName,
        side: 'ally',
        hp: Math.max(0, Number(ally.maxStress || 12) - Number(ally.stress || 0)),
        range: normalizeLegacyRaidRange(allyRange)
      });
    });
    hostiles.forEach(function (enemy) {
      var enemyId = Number(enemy && enemy.id || 0);
      boardUnits.push({
        id: enemyId,
        name: String(enemy && enemy.name || 'Hostile'),
        side: 'enemy',
        hp: Math.max(0, Number(enemy && enemy.maxStress || 8) - Number(enemy && enemy.stress || 0)),
        dread: Number(enemy && enemy.dread || 6),
        range: getLegacyRaidHostileRange(flow, enemyId)
      });
    });
    var hexBoardHtml = buildLegacyRaidHexCombatBoard(boardUnits, {
      title: 'STARS COMBAT - HEX ZONE MAP',
      subtitle: 'Wing ' + wingNum + ' encounter board with live turn positions.',
      seed: String(missionId) + '-wing-' + String(wingNum || 1),
      mode: 'wing',
      missionId: missionId,
      wingNum: wingNum,
      clickHandler: 'window.selectLegacyRaidHexBoardTarget',
      isSelected: function (unit) {
        if (!flow || !unit) return false;
        if (unit.side === 'enemy') return Number(unit.id || 0) > 0 && Number(unit.id || 0) === Number(flow.selectedHostileId || 0);
        if (unit.isPlayer) return String(flow.selectedEnemyTargetType || '') === 'player';
        return String(flow.selectedEnemyTargetType || '') === 'ally' && String(flow.selectedAllyName || '') === String(unit.name || '');
      }
    });

    var compactWingMode = Number(wingNum || 1) <= 2;
    if (compactWingMode) {
      var compactEnemyRows = hostiles.map(function (e) {
        return '<div style="display:flex;justify-content:space-between;gap:.3rem;padding:.16rem 0;border-bottom:1px solid rgba(255,255,255,.05);">'
          + '<span style="font-size:.76rem;color:var(--text2);">' + String(e.name || 'Hostile') + '</span>'
          + '<span style="font-size:.74rem;color:var(--red2);">d' + Number(e.dread || 6) + ' • ' + Math.max(0, Number(e.maxStress || 8) - Number(e.stress || 0)) + ' HP</span>'
        + '</div>';
      }).join('') || '<div style="font-size:.74rem;color:var(--muted2);">No hostiles active.</div>';
      var compactAllies = allies.map(function (e) {
        return '<div style="font-size:.72rem;color:var(--teal);padding:.08rem 0;">• ' + String(e.name || 'Wayfarer') + ' (' + Math.max(0, Number(e.maxStress || 12) - Number(e.stress || 0)) + ' HP)</div>';
      }).join('') || '<div style="font-size:.72rem;color:var(--muted2);">No temporary allies.</div>';
      var compactHtml = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="font-family:Cinzel,serif;font-size:.86rem;color:var(--gold2);margin-bottom:.12rem;">Raid Combat - Wing ' + wingNum + ' (Quick Panel)</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.18rem;">Refined combat flow: use the same action rhythm as the Combat Quick Panel.</div>'
        + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;margin-bottom:.24rem;">'
          + '<div style="background:var(--surface);border:1px solid var(--border);padding:.28rem .42rem;font-size:.74rem;">Stage: <strong style="color:var(--gold2);">' + stageLabel + '</strong></div>'
          + '<div style="background:var(--surface);border:1px solid var(--border);padding:.28rem .42rem;font-size:.74rem;">Actions Left: <strong style="color:var(--gold2);">' + actionsLeft + '</strong></div>'
          + '<div style="background:var(--surface);border:1px solid var(--border);padding:.28rem .42rem;font-size:.74rem;">Range: <strong style="color:var(--teal);">' + playerRange + '</strong></div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.3rem;margin-bottom:.24rem;">'
          + '<div style="border:1px solid var(--border2);padding:.3rem .36rem;background:rgba(255,255,255,.02);"><div style="font-size:.7rem;color:var(--teal);margin-bottom:.08rem;">Allies</div>' + compactAllies + '</div>'
          + '<div style="border:1px solid var(--border2);padding:.3rem .36rem;background:rgba(255,255,255,.02);"><div style="font-size:.7rem;color:var(--red2);margin-bottom:.08rem;">Hostiles</div>' + compactEnemyRows + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.14rem;">'
          + '<button class="btn btn-sm btn-primary" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'strike\',' + missionId + ',' + wingNum + ')">Strike</button>'
          + '<button class="btn btn-sm btn-primary" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'shoot\',' + missionId + ',' + wingNum + ')">Shoot</button>'
          + '<button class="btn btn-sm" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'defend\',' + missionId + ',' + wingNum + ')">Defend</button>'
          + '<button class="btn btn-sm" onclick="if(typeof switchTab===\'function\'){var b=document.getElementById(\'tabnav-combat\');switchTab(\'combat\',b||null);}">Open Combat Tab</button>'
        + '</div>'
        + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.14rem;">'
          + '<button class="btn btn-sm btn-teal" onclick="if(typeof closeModal===\'function\')closeModal();if(typeof openRaidWingPopup===\'function\')openRaidWingPopup(' + missionId + ',' + wingNum + ');">Return to Wing</button>'
          + '<button class="btn btn-sm" onclick="window.finishLegacyRaidCombatScene(' + missionId + ',' + wingNum + ')">End Scene</button>'
          + (sceneStarted ? '' : ('<button class="btn btn-sm btn-primary" onclick="window.startLegacyRaidCombatScene(' + missionId + ',' + wingNum + ')">Start Scene</button>'))
        + '</div>'
        + '<div style="background:var(--surface);border:1px solid var(--border);padding:.35rem .45rem;font-size:.78rem;line-height:1.4;min-height:2rem;">'
          + String((S.quickPanel && S.quickPanel.lastCombatRoll) || 'No combat roll yet.')
        + '</div>'
      + '</div>';
      openModal('Raid Combat — Wing ' + wingNum, compactHtml);
      return true;
    }

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="font-size:.86rem;color:var(--red2);font-family:\'Cinzel\',serif;margin-bottom:.14rem;"><strong>⚔ Combat Engaged — Wing ' + wingNum + '</strong></div>'
      + '<div style="font-size:.7rem;color:var(--muted2);margin-bottom:.14rem;">Turn order: You (Wayfarer options from Combat tab) → Allies (2 actions each) → Enemies (2 actions each enemy).</div>'
      + '<div style="font-size:.7rem;color:var(--gold2);margin-bottom:.16rem;">Stage: <strong>' + stageLabel + '</strong> · Turn ' + Number(flow && flow.turn || 1) + ' · Rounds: ' + Number(flow && flow.turn || 1) + ' · Player Actions Left (Armor): ' + actionsLeft + ' · Range: ' + playerRange + '</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.12rem;">Selected hostile: <strong style="color:var(--red2);">' + selectedHostileTxt + '</strong> · Enemy target: <strong style="color:var(--teal);">' + selectedEnemyTargetTxt + '</strong> · Click tokens on the board to retarget.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-bottom:.18rem;">'
      + '<div style="border:1px solid rgba(70,196,182,.22);padding:.22rem .28rem;background:rgba(70,196,182,.06);">'
      + '<div style="font-size:.68rem;color:var(--teal);margin-bottom:.08rem;"><strong>Allies</strong></div>'
      + (allyRows || '<div style="font-size:.63rem;color:var(--muted2);">None present.</div>')
      + '</div>'
      + '<div style="border:1px solid rgba(200,80,80,.22);padding:.22rem .28rem;background:rgba(200,80,80,.06);">'
      + '<div style="font-size:.68rem;color:var(--red2);margin-bottom:.08rem;"><strong>Hostiles</strong></div>'
      + (enemyRows || '<div style="font-size:.63rem;color:var(--muted2);">None found.</div>')
      + '</div>'
      + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.08rem;">Player Actions (Wayfarer)</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.08rem;">'
      + '<button class="btn btn-sm btn-primary" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'strike\',' + missionId + ',' + wingNum + ')">Strike</button>'
      + '<button class="btn btn-sm btn-primary" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'shoot\',' + missionId + ',' + wingNum + ')">Shoot</button>'
      + '<button class="btn btn-sm" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidPlayerActionFromPanel(\'defend\',' + missionId + ',' + wingNum + ')">Defend</button>'
      + moveButtons
      + '<button class="btn btn-sm" onclick="window.finishLegacyRaidCombatScene(' + missionId + ',' + wingNum + ')">End Scene</button>'
      + '<button class="btn btn-sm btn-teal" onclick="if(typeof closeModal===\'function\')closeModal();if(typeof openRaidWingPopup===\'function\')openRaidWingPopup(' + missionId + ',' + wingNum + ');">Return to Wing</button>'
      + (sceneStarted ? '' : ('<button class="btn btn-sm btn-primary" onclick="window.startLegacyRaidCombatScene(' + missionId + ',' + wingNum + ')">Start Scene</button>'))
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr auto;gap:.2rem;align-items:end;margin-bottom:.1rem;">'
      + '<label style="font-size:.63rem;color:var(--muted2);">Wayfarer Action'
      + '<select id="raidPlayerActionSelect" style="width:100%;margin-top:.08rem;">'
      + '<option value="strike">Strike</option>'
      + '<option value="shoot">Shoot</option>'
      + '<option value="defend">Defend</option>'
      + moveTargets.map(function (zone) { return '<option value="move:' + zone + '">Move to ' + zone + '</option>'; }).join('')
      + '</select></label>'
      + '<button class="btn btn-xs btn-primary" ' + (sceneStarted && stage === 'player' && actionsLeft > 0 ? '' : 'disabled') + ' onclick="var sel=document.getElementById(\'raidPlayerActionSelect\');if(sel)window.executeLegacyRaidPlayerActionFromPanel(sel.value,' + missionId + ',' + wingNum + ');">Do Action</button>'
      + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.08rem;">Ally Phase ' + (flowAllyName ? ('· Current: ' + flowAllyName + ' (' + flowAllyActs + ' actions left)') : '') + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:.2rem;align-items:end;margin-bottom:.08rem;">'
      + '<label style="font-size:.63rem;color:var(--muted2);">Action'
      + '<select id="raidAllyActionSelect" style="width:100%;margin-top:.08rem;">'
      + '<option value="attack">Attack (enemy only)</option>'
      + '<option value="defend">Defend (+3)</option>'
      + '<option value="support">Support (+3 Strike/Shoot)</option>'
      + '<option value="move">Move</option>'
      + '</select></label>'
      + '<label style="font-size:.63rem;color:var(--muted2);">Move Band'
      + '<select id="raidAllyMoveBandSelect" style="width:100%;margin-top:.08rem;">'
      + '<option value="Engaged">Engaged</option>'
      + '<option value="Close" selected>Close</option>'
      + '<option value="Nearby">Nearby</option>'
      + '<option value="Far">Far</option>'
      + '</select></label>'
      + '<label style="font-size:.63rem;color:var(--muted2);">Defend/Support Target'
      + '<select id="raidAllyTargetSelect" style="width:100%;margin-top:.08rem;">' + allyTargetOptions + '</select></label>'
      + '<button class="btn btn-xs btn-primary" ' + (stage === 'ally' ? '' : 'disabled') + ' onclick="window.executeLegacyRaidSceneAllyQueuedAction();window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Execute Ally Action</button>'
      + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.08rem;">Enemy Phase · Remaining Actions: ' + enemyBudget + '</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.12rem;">'
      + '<button class="btn btn-xs btn-warn" ' + (stage === 'enemy' ? '' : 'disabled') + ' onclick="window.executeLegacyRaidSceneEnemyAction();window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Enemy Action</button>'
      + '</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.14rem;">' + enemyTargetButtons + '</div>'
      + '<div style="font-size:.68rem;color:var(--gold2);margin:.08rem 0;">Rounds: ' + Number(flow && flow.turn || 1) + '</div>'
      + hexBoardHtml
      + '<div style="display:flex;gap:.24rem;justify-content:space-between;flex-wrap:wrap;">'
      + '<button class="btn btn-xs" onclick="window.refreshLegacyRaidCombatModal(' + missionId + ',' + wingNum + ')">Refresh</button>'
      + '<button class="btn btn-xs" onclick="if(typeof closeModal===\'function\')closeModal();if(typeof switchTab===\'function\'){var b=document.querySelector(\'.tab-btn[onclick*=\\\"combat\\\"]\');switchTab(\'combat\',b||null);}">Open Full Combat Tab</button>'
      + '</div>'
      + '</div>';
    openModal('Raid Combat — Wing ' + wingNum, html);
    if (typeof setTimeout === 'function') {
      setTimeout(function () {
        if (typeof document === 'undefined') return;
        var contentEl = document.getElementById('modalContent');
        if (contentEl) contentEl.scrollTop = prevScrollTop;
      }, 0);
    }
    return true;
  }

  window.refreshLegacyRaidCombatModal = function (missionId, wingNum) {
    return renderLegacyRaidCombatModal(missionId, wingNum);
  };

  function setLegacyRaidCombatFlowActive(active, missionId, wingNum) {
    if (typeof S === 'undefined' || !S) return;
    S.combat = S.combat || {};
    if (!active) {
      S.combat.raidFlow = null;
      return;
    }
    var allyCount = Array.isArray(S.enemies)
      ? S.enemies.filter(function (enemy) { return enemy && enemy.ally && enemy.temporarySceneAlly; }).length
      : 0;
    S.combat.raidFlow = {
      active: true,
      missionId: Number(missionId || 0),
      wingNum: Number(wingNum || 1),
      sceneStarted: false,
      stage: 'player',
      turn: 1,
      allyCount: allyCount,
      allyActionsPerTurn: 2,
      enemyActionsPerTurn: 2,
      playerRange: 'Close',
      allyOrder: [],
      currentAllyIndex: 0,
      currentAllyActionsLeft: 0,
      enemyActionBudget: 0,
      allyDefendBonus: {},
      allyAttackBonus: 0,
      supportBonusByName: {},
      allyTacticalFlags: {},
      enemyRecentTargets: {},
      lastEnemyFocusTarget: '',
      hostileRangeById: {}
    };
  }

  function getLegacyRaidHostileRange(flow, hostileId) {
    if (!flow || !flow.hostileRangeById) return 'Engaged';
    var key = String(hostileId || '0');
    var val = String(flow.hostileRangeById[key] || 'Engaged');
    return normalizeLegacyRaidRange(val);
  }

  window.setLegacyRaidHostileRange = function (hostileId, range) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow) return false;
    var flow = S.combat.raidFlow;
    flow.hostileRangeById = flow.hostileRangeById || {};
    flow.hostileRangeById[String(hostileId || '0')] = normalizeLegacyRaidRange(range || 'Engaged');
    return true;
  };

  window.startLegacyRaidCombatScene = function (missionId, wingNum) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow) return false;
    var flow = S.combat.raidFlow;
    flow.sceneStarted = true;
    flow.stage = 'player';
    flow.turn = Math.max(1, Number(flow.turn || 1));
    S.combat.actionsLeft = (typeof getMaxActions === 'function')
      ? Math.max(1, Number(getMaxActions() || 3))
      : Math.max(1, Number(S.combat.actionsLeft || 3));
    if (typeof showNotif === 'function') showNotif('Scene started. Your turn is active.', 'good');
    if (typeof window.refreshLegacyRaidCombatModal === 'function') window.refreshLegacyRaidCombatModal(missionId, wingNum);
    return true;
  };

  window.executeLegacyRaidPlayerActionFromPanel = function (action, missionId, wingNum) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow) return false;
    var flow = S.combat.raidFlow;
    if (!flow.sceneStarted) {
      if (typeof showNotif === 'function') showNotif('Press Start Scene first.', 'warn');
      return false;
    }
    if (String(flow.stage || '') !== 'player') {
      if (typeof showNotif === 'function') showNotif('It is not your turn.', 'warn');
      return false;
    }
    var act = String(action || '').toLowerCase();
    if (!act) return false;
    var hostiles = getLegacyRaidSceneHostiles();
    var selected = hostiles.find(function (h) { return Number(h && h.id || 0) === Number(flow.selectedHostileId || 0); }) || hostiles[0] || null;
    var selectedRange = selected ? getLegacyRaidHostileRange(flow, selected.id) : 'Engaged';
    if (act === 'strike') {
      if (!(selectedRange === 'Engaged' || selectedRange === 'Close')) {
        if (typeof showNotif === 'function') showNotif('Strike requires Engaged or Close range to the selected enemy.', 'warn');
        return false;
      }
      if (typeof rollAttack === 'function') rollAttack('strike');
    } else if (act === 'shoot') {
      if (!(selectedRange === 'Close' || selectedRange === 'Nearby' || selectedRange === 'Far' || selectedRange === 'Engaged')) {
        if (typeof showNotif === 'function') showNotif('Selected target is out of shooting range.', 'warn');
        return false;
      }
      if (typeof rollAttack === 'function') rollAttack('shoot');
    } else if (act === 'defend') {
      if (typeof rollDefend === 'function') rollDefend();
    } else if (act.indexOf('move:') === 0) {
      var zone = act.split(':')[1] || 'Close';
      window.setLegacyRaidPlayerRange(zone);
    }
    if (typeof window.refreshLegacyRaidCombatModal === 'function') window.refreshLegacyRaidCombatModal(missionId, wingNum);
    return true;
  };

  function getLegacyRaidBossPersonalityProfile(name) {
    var n = String(name || '').toLowerCase();
    if (/oracle|sphinx|null|void|harvester|executor|warden|architect|seer|crypt/.test(n)) {
      return { id: 'strategist', label: 'Strategist', preferPlayer: 0.35, focusFire: 0.85, healerHunt: 1.2, antiSupport: 1.15, spreadBias: 0.2 };
    }
    if (/leviathan|behemoth|titan|colossus|golem|juggernaut|kraken/.test(n)) {
      return { id: 'juggernaut', label: 'Juggernaut', preferPlayer: 0.55, focusFire: 0.65, healerHunt: 0.45, antiSupport: 0.5, spreadBias: 0.55 };
    }
    if (/wyrm|serpent|hydra|stalker|hunter|fang|razor|assassin|shade|phantom/.test(n)) {
      return { id: 'hunter', label: 'Hunter', preferPlayer: 0.75, focusFire: 1.05, healerHunt: 0.85, antiSupport: 0.7, spreadBias: 0.15 };
    }
    return { id: 'executioner', label: 'Executioner', preferPlayer: 0.5, focusFire: 0.9, healerHunt: 0.75, antiSupport: 0.8, spreadBias: 0.3 };
  }

  function getLegacyRaidEnemyPersonalityFromContext(mission, enemy) {
    var key = String(
      (mission && mission.legacyRaidBoss) ||
      (mission && mission.title) ||
      (enemy && enemy.name) ||
      'Raid Hostile'
    );
    return getLegacyRaidBossPersonalityProfile(key);
  }

  function isLegacyRaidHealerLikeTarget(name, flow) {
    var nm = String(name || '');
    if (/healer|medic|saint|doc|surgeon|support|anchor|oracle/i.test(nm)) return true;
    var flags = flow && flow.allyTacticalFlags && flow.allyTacticalFlags[nm];
    if (!flags) return false;
    return Number(flags.supports || 0) >= 1 || Number(flags.defends || 0) >= 2;
  }

  function getLegacyRaidTargetScore(candidate, personality, flow) {
    if (!candidate) return -999;
    var hp = Math.max(0, Number(candidate.hp || 0));
    var maxHp = Math.max(1, Number(candidate.maxHp || 1));
    var ratio = hp / maxHp;
    var score = 10;
    if (ratio <= 0.25) score += 7 * Number(personality.focusFire || 1);
    else if (ratio <= 0.5) score += 4.5 * Number(personality.focusFire || 1);
    if (candidate.type === 'player') score += 6 * Number(personality.preferPlayer || 0.5);
    if (candidate.type === 'ally' && candidate.isHealerLike) score += 5 * Number(personality.healerHunt || 0.75);
    if (candidate.defendBonus > 0) score -= Math.min(4, 1 + (candidate.defendBonus / 3));
    if (flow && String(flow.lastEnemyFocusTarget || '') === String(candidate.name || '')) score += 4.5 * Number(personality.focusFire || 1);
    var recentHits = flow && flow.enemyRecentTargets ? Number(flow.enemyRecentTargets[candidate.name] || 0) : 0;
    score += recentHits * (1.8 * Number(personality.focusFire || 1) - Number(personality.spreadBias || 0.25));
    score += (Math.random() * 0.5);
    return score;
  }

  function chooseLegacyRaidEnemyTarget(hostiles, aliveAllies, flow, encounter, mission, actingEnemy, forcedType, forcedName) {
    var playerName = String((typeof S !== 'undefined' && S && S.name) || 'Wayfarer');
    var personality = getLegacyRaidEnemyPersonalityFromContext(mission, actingEnemy);
    if (forcedType === 'player') {
      return { type: 'player', name: playerName, personality: personality };
    }
    if (forcedType === 'ally' && forcedName) {
      var namedAlly = (aliveAllies || []).find(function (ally) { return String(ally && ally.name || '') === String(forcedName || ''); });
      if (namedAlly) return { type: 'ally', name: String(namedAlly.name || 'Wayfarer'), ref: namedAlly, personality: personality };
    }

    var playerHp = Math.max(0, Number(typeof S !== 'undefined' && S && S.health || 0));
    var defendMap = flow && flow.allyDefendBonus ? flow.allyDefendBonus : {};
    var candidates = [];
    if (playerHp > 0) {
      candidates.push({
        type: 'player',
        name: playerName,
        hp: playerHp,
        maxHp: Math.max(1, Number(typeof S !== 'undefined' && S && S.maxHealth || playerHp || 12)),
        defendBonus: Number(defendMap[playerName] || 0),
        isHealerLike: false
      });
    }
    (aliveAllies || []).forEach(function (ally) {
      if (!ally) return;
      var name = String(ally.name || 'Wayfarer');
      var hp = Math.max(0, Number(ally.maxStress || 12) - Number(ally.stress || 0));
      if (hp <= 0) return;
      candidates.push({
        type: 'ally',
        name: name,
        ref: ally,
        hp: hp,
        maxHp: Math.max(1, Number(ally.maxStress || 12)),
        defendBonus: Number(defendMap[name] || 0),
        isHealerLike: isLegacyRaidHealerLikeTarget(name, flow)
      });
    });
    if (!candidates.length) return null;
    var best = candidates[0];
    var bestScore = getLegacyRaidTargetScore(best, personality, flow);
    for (var i = 1; i < candidates.length; i++) {
      var score = getLegacyRaidTargetScore(candidates[i], personality, flow);
      if (score > bestScore) {
        best = candidates[i];
        bestScore = score;
      }
    }
    best.personality = personality;
    return best;
  }

  function runLegacyRaidAutoAllyPhase() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.enemies)) return;
    var allies = S.enemies.filter(function (enemy) { return enemy && enemy.ally && enemy.temporarySceneAlly; });
    var hostiles = S.enemies.filter(function (enemy) { return enemy && !enemy.ally; });
    if (!allies.length || !hostiles.length) return;
    var focusHostile = hostiles.slice().sort(function (a, b) {
      var aHp = Math.max(0, Number(a && a.maxStress || 8) - Number(a && a.stress || 0));
      var bHp = Math.max(0, Number(b && b.maxStress || 8) - Number(b && b.stress || 0));
      return aHp - bHp;
    })[0] || hostiles[0];
    allies.forEach(function (ally) {
      var allyHp = Math.max(0, Number(ally && ally.maxStress || 12) - Number(ally && ally.stress || 0));
      for (var i = 0; i < 2; i++) {
        var target = focusHostile || hostiles.find(function (enemy) {
          return enemy && Number(enemy.stress || 0) < Number(enemy.maxStress || 8);
        });
        if (!target) return;
        if (allyHp <= 4 && i === 0) continue;
        var allyRoll = typeof roll === 'function' ? roll(6) : (Math.floor(Math.random() * 6) + 1);
        var targetDd = Math.max(4, Number(target.dread || 6));
        var enemyRoll = typeof roll === 'function' ? roll(targetDd) : (Math.floor(Math.random() * targetDd) + 1);
        if (allyRoll >= enemyRoll) {
          var dmg = Math.max(1, allyRoll - enemyRoll + 1);
          target.stress = Math.min(Number(target.maxStress || 8), Number(target.stress || 0) + dmg);
          focusHostile = target;
        }
      }
    });
  }

  function runLegacyRaidAutoEnemyPhase() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.enemies)) return;
    var hostiles = S.enemies.filter(function (enemy) {
      return enemy && !enemy.ally && Number(enemy.stress || 0) < Number(enemy.maxStress || 8);
    });
    if (!hostiles.length) return;
    var allies = S.enemies.filter(function (enemy) {
      return enemy && enemy.ally && enemy.temporarySceneAlly;
    });
    hostiles.forEach(function (enemy) {
      var dreadDie = Math.max(4, Number(enemy.dread || (S.combat && S.combat.enemyDread) || 6));
      for (var i = 0; i < 2; i++) {
        var allyTarget = allies.find(function (ally) {
          return ally && Number(ally.stress || 0) < Number(ally.maxStress || 12);
        });
        var hit = typeof roll === 'function' ? roll(dreadDie) : (Math.floor(Math.random() * dreadDie) + 1);
        var defend = typeof roll === 'function' ? roll(6) : (Math.floor(Math.random() * 6) + 1);
        var dmg = Math.max(1, hit - defend);
        if (allyTarget) {
          allyTarget.stress = Math.min(Number(allyTarget.maxStress || 12), Number(allyTarget.stress || 0) + dmg);
        } else if (typeof changeStress === 'function') {
          changeStress(dmg);
        }
      }
    });
  }

  function getLegacyRaidSceneAllies() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.enemies)) return [];
    return S.enemies.filter(function (enemy) {
      return enemy && enemy.ally && enemy.temporarySceneAlly && Number(enemy.stress || 0) < Number(enemy.maxStress || 12);
    });
  }

  function getLegacyRaidSceneHostiles() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.enemies)) return [];
    return S.enemies.filter(function (enemy) {
      return enemy && !enemy.ally && Number(enemy.stress || 0) < Number(enemy.maxStress || 8);
    });
  }

  function markLegacyRaidSceneAllyDown(allyName) {
    var ctx = getLegacyRaidPendingHexCombat();
    if (!ctx || !ctx.mission) return;
    var mission = ctx.mission;
    var wingNum = Number(ctx.pending && ctx.pending.wing || 1);
    var encounter = initializeRaidCombatIfNeeded();
    if (encounter && encounter.partyHp && encounter.partyHp.allies) {
      encounter.partyHp.allies[String(allyName || '')] = 0;
    }
    var wingAllies = getRaidWayfarersForWing(mission, wingNum);
    wingAllies.forEach(function (wf) {
      if (wf && String(wf.name || '') === String(allyName || '')) wf.status = 'failed';
    });
    if (typeof S !== 'undefined' && S && Array.isArray(S.enemies)) {
      S.enemies = S.enemies.filter(function (enemy) {
        return !(enemy && enemy.ally && enemy.temporarySceneAlly && String(enemy.name || '') === String(allyName || ''));
      });
    }
  }

  window.selectLegacyRaidHexBoardTarget = function (mode, missionId, wingNum, side, unitId, unitName, isPlayer) {
    if (typeof S === 'undefined' || !S) return false;
    var flow = S.combat && S.combat.raidFlow ? S.combat.raidFlow : null;
    var role = String(side || 'ally');
    var name = String(unitName || '');
    var id = Number(unitId || 0);
    var playerToken = !!isPlayer;

    if (role === 'enemy') {
      if (typeof window.setCombatFocusEnemy === 'function') window.setCombatFocusEnemy(id);
      if (flow) {
        flow.selectedHostileId = id;
        flow.selectedHostileName = name;
      }
      if (typeof showNotif === 'function') showNotif('Target locked: ' + name + '.', 'good');
    } else if (playerToken) {
      if (flow) {
        flow.selectedEnemyTargetType = 'player';
        delete flow.selectedAllyName;
      }
      if (typeof showNotif === 'function') showNotif('Enemy target set to Wayfarer.', 'info');
    } else {
      if (flow) {
        flow.selectedEnemyTargetType = 'ally';
        flow.selectedAllyName = name;
      }
      if (typeof showNotif === 'function') showNotif('Enemy target set to ally: ' + name + '.', 'info');
    }

    if (String(mode || '') === 'wing' && typeof window.refreshLegacyRaidCombatModal === 'function') {
      window.refreshLegacyRaidCombatModal(Number(missionId || 0), Number(wingNum || 1));
    } else if (String(mode || '') === 'boss') {
      if (typeof openRaidWingPopup === 'function') openRaidWingPopup(Number(missionId || 0), Number(wingNum || 3));
    }
    return true;
  };

  function prepareLegacyRaidAllyStage() {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow) return;
    var flow = S.combat.raidFlow;
    var allies = getLegacyRaidSceneAllies().map(function (ally) { return String(ally.name || 'Wayfarer'); });
    flow.allyOrder = allies;
    flow.currentAllyIndex = 0;
    flow.currentAllyActionsLeft = allies.length ? 2 : 0;
    flow.stage = allies.length ? 'ally' : 'enemy';
    var hostiles = getLegacyRaidSceneHostiles();
    flow.enemyActionBudget = Math.max(0, hostiles.length * Math.max(1, Number(flow.enemyActionsPerTurn || 2)));
  }

  window.setLegacyRaidPlayerRange = function (range) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow || !S.combat.raidFlow.active) return false;
    var flow = S.combat.raidFlow;
    if (String(flow.stage || '') !== 'player') {
      if (typeof showNotif === 'function') showNotif('Player movement is only available during your turn.', 'warn');
      return false;
    }
    var nextRange = String(range || 'Close');
    if (String(flow.playerRange || 'Close') === nextRange) {
      if (typeof showNotif === 'function') showNotif('Already at ' + nextRange + ' range.', 'info');
      return false;
    }
    if (typeof window.consumeCombatAction === 'function') {
      if (!window.consumeCombatAction()) return false;
    } else {
      var left = Math.max(0, Number(S.combat.actionsLeft || 0));
      if (left <= 0) {
        if (typeof showNotif === 'function') showNotif('No actions left to move.', 'warn');
        return false;
      }
      S.combat.actionsLeft = left - 1;
    }
    flow.playerRange = nextRange;
    if (typeof showNotif === 'function') showNotif('Repositioned to ' + flow.playerRange + '.', 'info');
    if (typeof updateCombatUI === 'function') updateCombatUI();
    if (typeof renderEnemies === 'function') renderEnemies();
    return true;
  };

  window.executeLegacyRaidSceneAllyAction = function (action, targetName) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow || !S.combat.raidFlow.active) return false;
    var flow = S.combat.raidFlow;
    if (String(flow.stage || '') !== 'ally') {
      if (typeof showNotif === 'function') showNotif('It is not the ally phase.', 'warn');
      return false;
    }
    var allies = Array.isArray(flow.allyOrder) ? flow.allyOrder : [];
    var allyName = allies[Number(flow.currentAllyIndex || 0)] || '';
    if (!allyName) {
      flow.stage = 'enemy';
      return false;
    }
    var encounter = initializeRaidCombatIfNeeded();
    var act = String(action || 'attack').toLowerCase();
    var target = String(targetName || '');
    flow.allyTacticalFlags = flow.allyTacticalFlags || {};
    if (!flow.allyTacticalFlags[allyName]) flow.allyTacticalFlags[allyName] = { attacks: 0, supports: 0, defends: 0, moves: 0 };
    var hostiles = getLegacyRaidSceneHostiles();
    if (act === 'attack') {
      var preferredHostile = flow && Number(flow.selectedHostileId || 0) > 0
        ? hostiles.find(function (h) { return Number(h && h.id || 0) === Number(flow.selectedHostileId || 0); })
        : null;
      var hostile = preferredHostile || hostiles[0];
      if (hostile) {
        var allyRoll = typeof roll === 'function' ? roll(6) : (Math.floor(Math.random() * 6) + 1);
        var enemyRoll = typeof roll === 'function' ? roll(Math.max(4, Number(hostile.dread || 6))) : (Math.floor(Math.random() * Math.max(4, Number(hostile.dread || 6))) + 1);
        flow.supportBonusByName = flow.supportBonusByName || {};
        var supportBonus = Math.max(0, Number(flow.supportBonusByName[allyName] || 0));
        var bonus = Math.max(0, Number(flow.allyAttackBonus || 0)) + supportBonus;
        var dmg = Math.max(1, allyRoll + bonus - enemyRoll);
        hostile.stress = Math.min(Number(hostile.maxStress || 8), Number(hostile.stress || 0) + dmg);
        flow.allyAttackBonus = 0;
        flow.supportBonusByName[allyName] = 0;
        flow.allyTacticalFlags[allyName].attacks = Number(flow.allyTacticalFlags[allyName].attacks || 0) + 1;
      }
    } else if (act === 'defend') {
      flow.allyDefendBonus = flow.allyDefendBonus || {};
      var defendTarget = target || allyName;
      flow.allyDefendBonus[defendTarget] = Number(flow.allyDefendBonus[defendTarget] || 0) + 3;
      flow.allyTacticalFlags[allyName].defends = Number(flow.allyTacticalFlags[allyName].defends || 0) + 1;
    } else if (act === 'support') {
      flow.supportBonusByName = flow.supportBonusByName || {};
      var supportTarget = target || allyName;
      flow.supportBonusByName[supportTarget] = Number(flow.supportBonusByName[supportTarget] || 0) + 3;
      flow.allyTacticalFlags[allyName].supports = Number(flow.allyTacticalFlags[allyName].supports || 0) + 1;
    } else if (act === 'move') {
      flow.allyRange = flow.allyRange || {};
      flow.allyRange[allyName] = target || 'Close';
      flow.allyTacticalFlags[allyName].moves = Number(flow.allyTacticalFlags[allyName].moves || 0) + 1;
    }
    flow.currentAllyActionsLeft = Math.max(0, Number(flow.currentAllyActionsLeft || 0) - 1);
    if (flow.currentAllyActionsLeft <= 0) {
      flow.currentAllyIndex = Number(flow.currentAllyIndex || 0) + 1;
      flow.currentAllyActionsLeft = (flow.currentAllyIndex < allies.length) ? 2 : 0;
    }
    if (flow.currentAllyIndex >= allies.length) {
      flow.stage = 'enemy';
      flow.enemyActionBudget = Math.max(0, hostiles.length * Math.max(1, Number(flow.enemyActionsPerTurn || 2)));
    }
    if (typeof renderEnemies === 'function') renderEnemies();
    if (typeof updateCombatUI === 'function') updateCombatUI();
    if (encounter && encounter.partyHp && encounter.partyHp.allies && Number(encounter.partyHp.allies[allyName] || 0) <= 0) {
      markLegacyRaidSceneAllyDown(allyName);
    }
    return true;
  };

  window.executeLegacyRaidSceneAllyQueuedAction = function () {
    if (typeof document === 'undefined') return false;
    var actEl = document.getElementById('raidAllyActionSelect');
    var targetEl = document.getElementById('raidAllyTargetSelect');
    var moveEl = document.getElementById('raidAllyMoveBandSelect');
    var action = actEl ? String(actEl.value || 'attack') : 'attack';
    var target = targetEl ? String(targetEl.value || '') : '';
    if (target === 'self') target = '';
    if (target === 'player' && typeof S !== 'undefined' && S) target = String(S.name || 'Wayfarer');
    if (action === 'move') target = moveEl ? String(moveEl.value || 'Close') : 'Close';
    return window.executeLegacyRaidSceneAllyAction(action, target);
  };

  window.executeLegacyRaidSceneEnemyAction = function (targetType, targetName) {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow || !S.combat.raidFlow.active) return false;
    var flow = S.combat.raidFlow;
    if (String(flow.stage || '') !== 'enemy') {
      if (typeof showNotif === 'function') showNotif('It is not the enemy phase.', 'warn');
      return false;
    }
    var encounter = initializeRaidCombatIfNeeded();
    if (!encounter) return false;
    var hostiles = getLegacyRaidSceneHostiles();
    if (!hostiles.length) {
      flow.stage = 'player';
      S.combat.actionsLeft = (typeof getMaxActions === 'function')
        ? Math.max(1, Number(getMaxActions() || 3))
        : Math.max(1, Number(S.combat.actionsLeft || 3));
      return true;
    }
    var requestedType = String(targetType || (flow && flow.selectedEnemyTargetType) || 'ally').toLowerCase();
    var requestedName = String(targetName || (flow && flow.selectedAllyName) || '');
    var manualTarget = arguments.length > 0;
    var aliveAllies = getLegacyRaidSceneAllies();
    var cursor = Math.max(0, Number(flow.enemyActionCursor || 0));
    var enemy = hostiles[cursor % hostiles.length];
    flow.enemyActionCursor = cursor + 1;
    var dreadDie = Math.max(4, Number(enemy && enemy.dread || 6));
    var pendingCtx = getLegacyRaidPendingHexCombat();
    var mission = pendingCtx && pendingCtx.mission ? pendingCtx.mission : null;
    var forcedType = manualTarget ? requestedType : '';
    var forcedName = manualTarget ? requestedName : '';
    var target = chooseLegacyRaidEnemyTarget(hostiles, aliveAllies, flow, encounter, mission, enemy, forcedType, forcedName);
    if (!target) return false;
    flow.selectedEnemyTargetType = target.type;
    flow.selectedAllyName = target.type === 'ally' ? String(target.name || '') : '';
    flow.lastEnemyFocusTarget = String(target.name || '');
    flow.enemyRecentTargets = flow.enemyRecentTargets || {};
    flow.enemyRecentTargets[flow.lastEnemyFocusTarget] = Number(flow.enemyRecentTargets[flow.lastEnemyFocusTarget] || 0) + 1;
    var hit = typeof roll === 'function' ? roll(dreadDie) : (Math.floor(Math.random() * dreadDie) + 1);
    var defendDie = target.type === 'player' ? getLegacyRaidCombatActionDie('defend') : 6;
    var defend = typeof roll === 'function' ? roll(defendDie) : (Math.floor(Math.random() * defendDie) + 1);
    var defendBonusTarget = target.type === 'player'
      ? String((typeof S !== 'undefined' && S && S.name) || 'Wayfarer')
      : String(target.name || '');
    var defendBonus = 0;
    if (flow.allyDefendBonus && Number(flow.allyDefendBonus[defendBonusTarget] || 0) > 0) {
      defendBonus = Number(flow.allyDefendBonus[defendBonusTarget] || 0);
      flow.allyDefendBonus[defendBonusTarget] = 0;
    }
    defend = defend + defendBonus;
    var dmg = Math.max(0, hit - defend);
    if (target.type === 'player') {
      if (typeof S !== 'undefined' && S) S.health = Math.max(0, Number(S.health || 0) - dmg);
    } else {
      if (!encounter.partyHp) encounter.partyHp = { allies: {} };
      if (!encounter.partyHp.allies) encounter.partyHp.allies = {};
      if (typeof encounter.partyHp.allies[target.name] !== 'number') encounter.partyHp.allies[target.name] = 12;
      encounter.partyHp.allies[target.name] = Math.max(0, Number(encounter.partyHp.allies[target.name]) - dmg);
      var allyRef = aliveAllies.find(function (a) { return String(a.name || '') === target.name; });
      if (allyRef) {
        allyRef.stress = Math.min(Number(allyRef.maxStress || 12), Number(allyRef.stress || 0) + dmg);
        if (Number(allyRef.stress || 0) >= Number(allyRef.maxStress || 12)) markLegacyRaidSceneAllyDown(target.name);
      }
    }
    if (encounter && Array.isArray(encounter.log)) {
      var persona = target.personality && target.personality.label ? String(target.personality.label) : 'Hostile';
      encounter.log.push('Enemy action [' + persona + ']: ' + String(enemy && enemy.name || 'Hostile') + ' rolled ' + hit + ' vs ' + target.name + ' defend ' + defend + ' for ' + dmg + ' damage.');
    }
    if (typeof showNotif === 'function') {
      if (dmg > 0) {
        showNotif('Enemy action: ' + String(enemy && enemy.name || 'Hostile') + ' hit ' + target.name + ' for ' + dmg + ' (' + hit + ' vs ' + defend + ').', 'warn');
      } else {
        showNotif('Enemy action defended: ' + target.name + ' held (' + hit + ' vs ' + defend + ').', 'good');
      }
    }
    flow.enemyActionBudget = Math.max(0, Number(flow.enemyActionBudget || 0) - 1);
    if (Number(S.health || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Wayfarer down. Raid encounter failed.', 'warn');
      window.finalizeLegacyRaidHexCombatOutcome('wipe');
      return true;
    }
    if (flow.enemyActionBudget <= 0) {
      flow.stage = 'player';
      flow.turn = Number(flow.turn || 1) + 1;
      S.combat.actionsLeft = (typeof getMaxActions === 'function')
        ? Math.max(1, Number(getMaxActions() || 3))
        : Math.max(1, Number(S.combat.actionsLeft || 3));
      flow.allyDefendBonus = {};
      flow.allyAttackBonus = 0;
      flow.enemyActionCursor = 0;
      flow.enemyRecentTargets = {};
      if (typeof showNotif === 'function') showNotif('Enemy turn complete. Your actions are refreshed.', 'good');
    }
    if (typeof renderEnemies === 'function') renderEnemies();
    if (typeof updateCombatUI === 'function') updateCombatUI();
    return true;
  };

  function completeLegacyRaidCombatCycle() {
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.raidFlow || !S.combat.raidFlow.active) return;
    if (!getLegacyRaidPendingHexCombat()) {
      S.combat.raidFlow = null;
      return;
    }
    prepareLegacyRaidAllyStage();
    if (typeof renderEnemies === 'function') renderEnemies();
    if (typeof updateCombatUI === 'function') updateCombatUI();
  }

  function patchLegacyRaidCombatStageHooks() {
    if (typeof window === 'undefined' || window._legacyRaidCombatHooksPatched) return;
    if (typeof window.consumeCombatAction !== 'function') return;
    window._legacyRaidCombatHooksPatched = true;

    var baseConsume = window.consumeCombatAction;
    window.consumeCombatAction = function () {
      if (typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow && S.combat.raidFlow.active && !getLegacyRaidPendingHexCombat()) {
        S.combat.raidFlow = null;
      }
      if (typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow && S.combat.raidFlow.active
        && S.combat.raidFlow.stage !== 'player') {
        if (typeof showNotif === 'function') showNotif('Raid flow: wait for ally/enemy phase.', 'warn');
        return false;
      }
      var out = baseConsume.apply(this, arguments);
      if (out && typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow && S.combat.raidFlow.active) {
        if (Number(S.combat.actionsLeft || 0) <= 0) completeLegacyRaidCombatCycle();
      }
      return out;
    };

    if (typeof window.rollDefend === 'function') {
      var baseDefend = window.rollDefend;
      window.rollDefend = function () {
        if (typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow && S.combat.raidFlow.active && !getLegacyRaidPendingHexCombat()) {
          S.combat.raidFlow = null;
        }
        if (typeof S !== 'undefined' && S && S.combat && S.combat.raidFlow && S.combat.raidFlow.active
          && S.combat.raidFlow.stage !== 'player') {
          if (typeof showNotif === 'function') showNotif('Raid flow: Defend is only available in player stage.', 'warn');
          return false;
        }
        return baseDefend.apply(this, arguments);
      };
    }
  }

  window.executeRaidCombatRound = function (missionId, wingNum) {
    // Compatibility shim: execution happens in Combat tab actions now.
    if (typeof showNotif === 'function') showNotif('Use Combat tab actions (Strike/Shoot/Defend). Raid combat no longer resolves from this popup.', 'info');
    openRaidCombatModal(missionId, wingNum);
  };

  window.finishLegacyRaidCombatScene = function (missionId, wingNum) {
    var mId = Number(missionId || 0);
    var wNum = Number(wingNum || 1);
    if (typeof endCombat === 'function') endCombat();
    // If finalize hook did not route to a destination, offer explicit return control.
    if (getLegacyRaidPendingHexCombat()) {
      if (typeof window.finalizeLegacyRaidHexCombatOutcome === 'function') {
        try { window.finalizeLegacyRaidHexCombatOutcome('retreat'); } catch (_err) {}
      } else if (typeof openRaidWingPopup === 'function') {
        openRaidWingPopup(mId, wNum);
      }
      return true;
    }
    return true;
  };

  window.retreatRaidCombat = function (missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission) return;
    if (typeof showNotif === 'function') showNotif('Combat retreat. Hexes regain enemies next visit.', 'warn');
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (state) {
      state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
      state.lastLog = 'Combat entered but retreated (-1 tick).';
    }
    if (typeof S !== 'undefined' && S) {
      S.enemies = [];
      if (S.combat) S.combat.raidFlow = null;
    }
    window.finalizeLegacyRaidHexCombatOutcome('retreat');
  };

  window.surrenderRaidCombat = function (missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission) return;
    if (typeof showNotif === 'function') showNotif('Combat wipe. Raid failed.', 'warn');
    if (typeof S !== 'undefined' && S) {
      S.enemies = [];
      if (S.combat) S.combat.raidFlow = null;
    }
    window.finalizeLegacyRaidHexCombatOutcome('wipe');
  };

  function initializeBossPhases(mission, wingNum) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return null;
    var phases = {
      1: { dread: 10, hp: 20, flavor: 'The boss emerges from the shadows, muscles tensing in preparation.' },
      2: { dread: 12, hp: 24, flavor: 'Wounded, the boss unleashes a more ferocious assault. Second wind!' },
      3: { dread: 20, hp: 40, flavor: 'Desperate and enraged, the boss achieves its true form. Final stand!' }
    };
    encounter.phase = Number(encounter.phase || 1);
    encounter.phaseHp = Number(encounter.phaseHp || phases[encounter.phase].hp);
    encounter.maxPhaseHp = phases[encounter.phase].hp;
    encounter.dreadDie = phases[encounter.phase].dread;
    encounter.phaseFlavor = phases[encounter.phase].flavor;
    return encounter;
  }

  function openWing3BossCombatModal(missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') {
      if (typeof showNotif === 'function') showNotif('Invalid raid mission.', 'warn');
      return;
    }
    var encounter = initializeBossPhases(mission, 3) || ensureLegacyRaidBossEncounter(mission);
    var bossName = String(mission.legacyRaidBoss || 'The Boss');
    var personality = getLegacyRaidBossPersonalityProfile(bossName);
    var phase = Number(encounter.phase || 1);
    var phaseHp = Number(encounter.phaseHp || 20);
    var maxPhaseHp = Number(encounter.maxPhaseHp || 20);
    var dreadDie = Number(encounter.dreadDie || 10);
    var allies = getRaidWayfarersForWing(mission, 3).filter(function (w) { return w && w.status !== 'failed'; });
    var playerName = (typeof S !== 'undefined' && S && S.name) || 'Wayfarer';
    var playerHp = typeof S !== 'undefined' && S ? Number(S.health || 12) : 12;
    var maxActions = typeof getMaxActions === 'function' ? getMaxActions() : 3;
    var tmw = typeof getLegacyRaidTeamworkPool === 'function' ? getLegacyRaidTeamworkPool() : 0;
    
    var phaseBar = '<div style="display:flex;gap:.2rem;align-items:center;">'
      + '<div style="flex:1;height:12px;background:rgba(0,0,0,.3);border-radius:4px;overflow:hidden;">'
      + '<div style="width:' + Math.max(5, (phaseHp / maxPhaseHp) * 100) + '%;height:100%;background:linear-gradient(90deg,var(--red2),var(--gold2));transition:width .3s;"></div>'
      + '</div>'
      + '<span style="font-size:.64rem;color:var(--text2);min-width:60px;">' + phaseHp + '/' + maxPhaseHp + ' HP</span>'
      + '</div>';
    
    var allyRows = allies.map(function (ally) {
      var hp = (encounter.partyHp && encounter.partyHp.allies && typeof encounter.partyHp.allies[ally.name] === 'number')
        ? Number(encounter.partyHp.allies[ally.name])
        : 12;
      var acts = Number(encounter.allyActionBudget.byAlly && encounter.allyActionBudget.byAlly[ally.name] || 2);
      var status = hp > 0 ? '<span style="color:var(--green2);">●</span>' : '<span style="color:var(--red2);">●</span>';
      return '<div style="font-size:.63rem;color:var(--text2);line-height:1.36;padding:.06rem .1rem;border-bottom:1px solid rgba(255,255,255,.04);">'
        + status + ' <strong>' + ally.name + '</strong> · ' + hp + '/12 · ' + acts + '/2 acts'
        + '</div>';
    }).join('');
    
    var phaseProfile = encounter.phaseProfiles && encounter.phaseProfiles[phase - 1];
    var phaseFlavor = phaseProfile ? phaseProfile.text : 'Boss Phase ' + phase;
    
    var html = '<div style="font-size:.8rem;color:var(--text2);line-height:1.52;">'
      + '<div style="background:rgba(200,50,50,.08);border:1px solid rgba(200,50,50,.24);padding:.28rem .32rem;margin-bottom:.24rem;border-radius:4px;">'
      + '<div style="font-size:.72rem;color:var(--red2);margin-bottom:.08rem;"><strong>⚔ ' + bossName + ' · Phase ' + phase + '/3</strong></div>'
      + '<div style="font-size:.63rem;color:var(--muted2);line-height:1.42;margin-bottom:.12rem;font-style:italic;">' + phaseFlavor + '</div>'
      + '<div style="font-size:.64rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Dread Die: d' + dreadDie + '</strong> · <strong>Boss AI: ' + String(personality.label || 'Executioner') + '</strong></div>'
      + phaseBar
      + '</div>'
      
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.2rem;margin-bottom:.24rem;">'
      + '<div style="border:1px solid var(--border2);padding:.2rem;background:rgba(20,90,120,.08);">'
      + '<div style="font-size:.66rem;color:var(--teal);margin-bottom:.08rem;"><strong>YOU</strong></div>'
      + '<div style="font-size:.62rem;color:var(--text2);">◆ ' + playerName + ' · ' + playerHp + ' HP · ' + maxActions + ' Actions</div>'
      + '</div>'
      + '<div style="border:1px solid var(--border2);padding:.2rem;background:rgba(0,150,120,.08);">'
      + '<div style="font-size:.66rem;color:var(--teal);margin-bottom:.08rem;"><strong>ALLIES (' + allies.length + ')</strong></div>'
      + allyRows
      + '</div>'
      + '</div>'
      
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.2rem;margin-bottom:.2rem;">'
      + '<div style="font-size:.66rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Turn Order:</strong></div>'
      + '<div style="font-size:.62rem;color:var(--muted2);">Fast Auto-Round: You attack → Allies attack → Boss takes 2 actions.</div>'
      + (encounter.lastRoundSummary ? ('<div style="font-size:.62rem;color:var(--text2);margin-top:.12rem;padding:.14rem .16rem;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);">'+String(encounter.lastRoundSummary)+'</div>') : '')
      + '</div>'
      
      + '<div style="display:flex;gap:.15rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.executeBossRound(' + mission.id + ')">⚔ Execute Round</button>'
      + '<button class="btn btn-xs' + (tmw >= 10 ? '' : ' disabled') + '" onclick="window.useLegacyRaidTeamworkBurst(' + mission.id + ',\'nullify\')" title="10 TMW: Block boss attack">🛡️ Nullify (10)</button>'
      + '<button class="btn btn-xs' + (tmw >= 50 ? '' : ' disabled') + '" onclick="window.useLegacyRaidTeamworkBurst(' + mission.id + ',\'revive\')" title="50 TMW: Revive ally">💚 Revive (50)</button>'
      + '<button class="btn btn-xs' + (tmw >= 100 ? '' : ' disabled') + '" onclick="window.useLegacyRaidTeamworkBurst(' + mission.id + ',\'cinematic_success\')" title="100 TMW: Skip phase">⚡ Skip (100)</button>'
      + '</div>'
      + '<div style="font-size:.62rem;color:var(--gold2);margin-top:.12rem;">Teamwork: ' + tmw + ' TMW</div>'
      + '</div>';
    
    openModal('Wing 3: Boss Battle', html);
  }
  window.openWing3BossCombatModal = openWing3BossCombatModal;

  window.executeBossRound = function (missionId) {
    var mission = getMission(missionId);
    if (!mission) return;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return;
    
    var phase = Number(encounter.phase || 1);
    var phaseProfile = encounter.phaseProfiles && encounter.phaseProfiles[phase - 1];
    var maxPhaseHp = phaseProfile ? phaseProfile.hp : 20;
    
    var rollFn = function (die) {
      var d = Math.max(1, Number(die || 1));
      return (typeof explodingRoll === 'function') ? explodingRoll(d).total : ((typeof roll === 'function') ? roll(d) : (1 + Math.floor(Math.random() * d)));
    };

    var playerDie = getLegacyRaidBestCombatDie();
    var bossDie = Math.max(6, Number(encounter.dreadDie || 10));
    var playerRoll = rollFn(playerDie);
    var bossDefend = rollFn(bossDie);
    var damageDealt = Math.max(0, playerRoll - bossDefend);

    if (damageDealt > 0) {
      encounter.phaseHp = Math.max(0, Number(encounter.phaseHp || 0) - damageDealt);
    }
    encounter.log = encounter.log || [];
    encounter.log.push('Round: You rolled ' + playerRoll + ' vs Boss Defend ' + bossDefend + '. ' + (damageDealt > 0 ? ('Dealt ' + damageDealt + ' HP.') : 'No damage.'));

    // Allies phase: each alive ally contributes one attack in this quick-battle resolver.
    var allyNames = Object.keys(encounter.partyHp && encounter.partyHp.allies || {});
    var allyDamage = 0;
    allyNames.forEach(function (allyName) {
      var hp = Math.max(0, Number(encounter.partyHp.allies[allyName] || 0));
      if (hp <= 0) return;
      var aRoll = rollFn(6);
      var aDefend = rollFn(bossDie);
      allyDamage += Math.max(0, aRoll - aDefend);
    });
    if (allyDamage > 0) {
      encounter.phaseHp = Math.max(0, Number(encounter.phaseHp || 0) - allyDamage);
      encounter.log.push('Allies dealt ' + allyDamage + ' total HP this round.');
    }
    var modalPhaseState = normalizeLegacyRaidBossPhaseState(mission, encounter, { openCinematic: true });
    if (modalPhaseState === 'victory' || modalPhaseState === 'cinematic') return;
    if (modalPhaseState === 'phase') {
      if (typeof showNotif === 'function') showNotif('☆ Boss Phase ' + Number(encounter.phase || 2) + ' begins! The boss transforms!', 'good');
      closeModal();
      openWing3BossCombatModal(missionId);
      return;
    }
    
    if (encounter.log.length > 5) encounter.log.shift();
    
    if (Number(encounter.phaseHp || 0) <= 0 && phase < 3) {
      transitionBossPhase(encounter);
      if (typeof showNotif === 'function') showNotif('Phase ' + Number(encounter.phase || phase + 1) + ' begins! Boss transforms!', 'good');
    } else if (Number(encounter.phaseHp || 0) <= 0 && phase >= 3) {
      closeModal();
      if (typeof showNotif === 'function') showNotif('🐉 Boss defeated! Raid clear!', 'good');
      window.resolveRaidBossRoom(mission.id, true);
      return;
    } else {
      // Boss phase: boss takes 2 actions and can damage player and allies.
      var targets = [];
      var playerHp = typeof S !== 'undefined' && S ? Math.max(0, Number(S.health || 0)) : 0;
      if (playerHp > 0) targets.push({ kind: 'player', name: String((typeof S !== 'undefined' && S && S.name) || 'You') });
      allyNames.forEach(function (allyName) {
        if (Math.max(0, Number(encounter.partyHp.allies[allyName] || 0)) > 0) {
          targets.push({ kind: 'ally', name: allyName });
        }
      });
      var bossPersonality = getLegacyRaidBossPersonalityProfile(String(mission && mission.legacyRaidBoss || 'Raid Boss'));
      var bossFocusTarget = String(encounter.bossFocusTarget || '');
      for (var ai = 0; ai < 2; ai++) {
        if (!targets.length) break;
        var scored = targets.map(function (entry) {
          var hp = entry.kind === 'player'
            ? Math.max(0, Number(typeof S !== 'undefined' && S && S.health || 0))
            : Math.max(0, Number(encounter.partyHp && encounter.partyHp.allies ? encounter.partyHp.allies[entry.name] : 0));
          var maxHp = entry.kind === 'player'
            ? Math.max(1, Number(typeof S !== 'undefined' && S && S.maxHealth || 12))
            : 12;
          var ratio = hp / Math.max(1, maxHp);
          var score = 10;
          if (ratio <= 0.25) score += 6 * Number(bossPersonality.focusFire || 1);
          else if (ratio <= 0.5) score += 3.5 * Number(bossPersonality.focusFire || 1);
          if (entry.kind === 'player') score += 5 * Number(bossPersonality.preferPlayer || 0.5);
          if (entry.kind === 'ally' && isLegacyRaidHealerLikeTarget(entry.name, S && S.combat ? S.combat.raidFlow : null)) {
            score += 4 * Number(bossPersonality.healerHunt || 0.75);
          }
          if (bossFocusTarget && String(entry.name || '') === bossFocusTarget) {
            score += 3 * Number(bossPersonality.focusFire || 1);
          }
          score += Math.random() * 0.5;
          return { target: entry, score: score };
        }).sort(function (a, b) { return Number(b.score || 0) - Number(a.score || 0); });
        var target = scored.length ? scored[0].target : targets[Math.floor(Math.random() * targets.length)];
        bossFocusTarget = String(target.name || '');
        encounter.bossFocusTarget = bossFocusTarget;
        var bossHit = rollFn(bossDie);
        var defendDie = target.kind === 'player' ? getLegacyRaidCombatActionDie('defend') : 6;
        var targetDefend = rollFn(defendDie);
        var incoming = Math.max(0, bossHit - targetDefend);
        if (incoming <= 0) {
          encounter.log.push('Boss attack on ' + target.name + ' was defended.');
          continue;
        }
        if (target.kind === 'player') {
          if (typeof S !== 'undefined' && S) {
            S.health = Math.max(0, Number(S.health || 0) - incoming);
          }
          encounter.log.push('Boss hit ' + target.name + ' for ' + incoming + ' damage.');
        } else {
          encounter.partyHp.allies[target.name] = Math.max(0, Number(encounter.partyHp.allies[target.name] || 0) - incoming);
          encounter.log.push('Boss hit ally ' + target.name + ' for ' + incoming + ' damage.');
        }
      }
    }

    var playerAfter = (typeof S !== 'undefined' && S) ? Math.max(0, Number(S.health || 0)) : 0;
    encounter.lastRoundSummary = 'You dealt ' + damageDealt + ', allies dealt ' + allyDamage + ', phase HP now ' + Number(encounter.phaseHp || 0) + '/' + maxPhaseHp + ', your HP ' + playerAfter + '.';
    if (typeof showNotif === 'function') showNotif('Boss round resolved: ' + encounter.lastRoundSummary, 'info');
    
    closeModal();
    openWing3BossCombatModal(missionId);
  };

  function shouldTransitionBossPhase(encounter) {
    if (!encounter) return false;
    if (Number(encounter.phaseHp || 0) <= 0 && Number(encounter.phase || 1) < 3) {
      return true;
    }
    return false;
  }

  function transitionBossPhase(encounter) {
    if (!encounter || shouldTransitionBossPhase(encounter) === false) return false;
    if (Number(encounter.phase || 1) === 1 && encounter.skipPhaseTwoPending) {
      encounter.phase = 3;
      encounter.skipPhaseTwoPending = false;
    } else {
      encounter.phase = Math.min(3, Number(encounter.phase || 1) + 1);
    }
    var phases = {
      1: { dread: 10, hp: 20, flavor: 'The boss emerges from the shadows, muscles tensing in preparation.' },
      2: { dread: 12, hp: 24, flavor: 'Wounded, the boss unleashes a more ferocious assault. Second wind!' },
      3: { dread: 20, hp: 40, flavor: 'Desperate and enraged, the boss achieves its true form. Final stand!' }
    };
    var phaseData = phases[encounter.phase];
    encounter.phaseHp = phaseData.hp;
    encounter.maxPhaseHp = phaseData.hp;
    encounter.dreadDie = phaseData.dread;
    encounter.phaseFlavor = phaseData.flavor;
    encounter.log = encounter.log || [];
    encounter.log.push('☆ Boss Phase ' + encounter.phase + ' begins! ' + phaseData.flavor);
    return true;
  }

  window.getLegacyRaidTeamworkBurstCosts = function (mission) {
    var half = getLegacyRaidTalentRank('teamwork_feedback') > 0;
    var scale = half ? 0.5 : 1;
    return {
      nullify: Math.max(1, Math.floor(10 * scale)),
      revive: Math.max(1, Math.floor(50 * scale)),
      cinematic_success: Math.max(1, Math.floor(100 * scale))
    };
  };

  window.useLegacyRaidTeamworkBurst = function (missionId, burstType) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var costs = window.getLegacyRaidTeamworkBurstCosts(mission);
    var cost = costs[String(burstType || 'nullify').toLowerCase()] || 100;
    var tmw = typeof getLegacyRaidTeamworkPool === 'function' ? getLegacyRaidTeamworkPool() : 0;
    if (tmw < cost) {
      if (typeof showNotif === 'function') showNotif('Not enough Teamwork. Need ' + cost + ', have ' + tmw + '.', 'warn');
      return false;
    }
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return false;
    var burstAction = String(burstType || 'nullify').toLowerCase();
    if (burstAction === 'nullify') {
      if (typeof showNotif === 'function') showNotif('💫 Nullified incoming attack with Teamwork burst!', 'good');
      encounter.log = encounter.log || [];
      encounter.log.push('💫 Teamwork: Nullified enemy action (-' + cost + ' TMW)');
    } else if (burstAction === 'revive') {
      if (typeof showNotif === 'function') showNotif('💚 Revived fallen ally with Teamwork burst!', 'good');
      encounter.log = encounter.log || [];
      encounter.log.push('💚 Teamwork: Revived ally (-' + cost + ' TMW)');
      var allyNames = Object.keys(encounter.partyHp && encounter.partyHp.allies || {});
      if (allyNames.length) {
        var allyToRevive = allyNames[0];
        encounter.partyHp.allies[allyToRevive] = 6;
      }
    } else if (burstAction === 'cinematic_success') {
      if (typeof showNotif === 'function') showNotif('⚡ Cinematic success with Teamwork burst!', 'good');
      encounter.log = encounter.log || [];
      encounter.log.push('⚡ Teamwork: Cinematic Success! (-' + cost + ' TMW)');
      if (encounter && encounter.phase < 3) {
        transitionBossPhase(encounter);
      }
    }
    return true;
  };

  function ensureLegacyRaidRoomRoleState(mission, wingNum, roomIdx) {
    if (!mission) return null;
    if (!mission.legacyRaidRoomRoles || typeof mission.legacyRaidRoomRoles !== 'object') {
      mission.legacyRaidRoomRoles = {};
    }
    var key = getLegacyRaidRoomRoleKey(wingNum, roomIdx);
    if (!mission.legacyRaidRoomRoles[key] || typeof mission.legacyRaidRoomRoles[key] !== 'object') {
      mission.legacyRaidRoomRoles[key] = { front: false, mechanics: false, support: false, activeRequiredIndex: 0 };
    }
    if (typeof mission.legacyRaidRoomRoles[key].activeRequiredIndex !== 'number') {
      mission.legacyRaidRoomRoles[key].activeRequiredIndex = 0;
    }
    return mission.legacyRaidRoomRoles[key];
  }

  function getLegacyRaidRequiredRolesForRoom(room) {
    if (!room) return [];
    return [];
  }

  function getLegacyRaidRoomRiskLabels(room) {
    var type = String(room && room.type || 'Hazard');
    var labels = {
      LoreReading: { front: 'High Risk Front', mechanics: 'Info Safe Mechanics', support: 'Recovery Support' },
      Puzzle: { front: 'Pressure Front', mechanics: 'Info Safe Mechanics', support: 'Recovery Support' },
      Peril: { front: 'Hazard Front', mechanics: 'Pattern Mechanics', support: 'Recovery Support' },
      Trap: { front: 'Breach Front', mechanics: 'Trap Mechanics', support: 'Recovery Support' },
      Approach: { front: 'Commit Front', mechanics: 'Read Mechanics', support: 'Stabilize Support' },
      Confrontation: { front: 'Boss Front', mechanics: 'Telegraph Mechanics', support: 'Raid Support' },
      Combat: { front: 'Killbox Front', mechanics: 'Sightline Mechanics', support: 'Recovery Support' },
      Hazard: { front: 'Hazard Front', mechanics: 'Route Mechanics', support: 'Recovery Support' }
    };
    return labels[type] || { front: 'Front', mechanics: 'Mechanics', support: 'Support' };
  }

  function evaluateLegacyRaidRoomRoleReadiness(mission, wingNum, roomIdx, room) {
    var required = getLegacyRaidRequiredRolesForRoom(room);
    if (!required.length) return { ready: true, bonus: 0, missing: [] };
    var state = ensureLegacyRaidRoomRoleState(mission, wingNum, roomIdx);
    var missing = required.filter(function (key) { return !state[key]; });
    var ready = !missing.length;
    var bonus = ready ? 1 : 0;
    return { ready: ready, bonus: bonus, missing: missing, required: required, state: state };
  }

  function getLegacyRaidCurrentWing(mission) {
    if (!mission || !mission.steps) return 3;
    if (!mission.steps[1] || !mission.steps[1].completed) return 1;
    if (!mission.steps[2] || !mission.steps[2].completed) return 2;
    return 3;
  }

  function setLegacyRaidCurrentWing(mission, wing) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return;
    run.currentWing = Math.max(1, Math.min(3, Number(wing || getLegacyRaidCurrentWing(mission) || 1)));
  }

  function markLegacyRaidWingOutcome(mission, wing, clean) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return;
    var w = Math.max(1, Math.min(3, Number(wing || 1)));
    if (clean) {
      if (Number(run.wingFailures[w] || 0) <= 0) run.wingClean[w] = true;
      return;
    }
    run.wingFailures[w] = Number(run.wingFailures[w] || 0) + 1;
    run.wingClean[w] = false;
  }

  function ensureLegacyRaidMapPromptState(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidMapPrompt || typeof mission.legacyRaidMapPrompt !== 'object') {
      mission.legacyRaidMapPrompt = {
        warningAccepted: false,
        siteRevealed: false
      };
    }
    mission.legacyRaidMapPrompt.warningAccepted = !!mission.legacyRaidMapPrompt.warningAccepted;
    mission.legacyRaidMapPrompt.siteRevealed = !!mission.legacyRaidMapPrompt.siteRevealed;
    return mission.legacyRaidMapPrompt;
  }

  function syncLegacyRaidMapMarkerViews() {
    if (typeof renderHexMap === 'function') {
      try { renderHexMap(); } catch (_err) {}
    }
    if (typeof renderHexInfo === 'function' && typeof selectedHex !== 'undefined' && selectedHex) {
      try { renderHexInfo(selectedHex); } catch (_err2) {}
    }
    if (typeof refreshMissionSurfaces === 'function') {
      try { refreshMissionSurfaces(); } catch (_err3) {}
    }
  }

  function revealLegacyRaidSiteMarker(mission) {
    if (!mission || mission.missionType !== 'legacy_raid' || !mission.siteHex) return false;
    ensureState();
    var state = ensureLegacyRaidMapPromptState(mission);
    if (!state) return false;
    var key = String(mission.siteHex.col) + ',' + String(mission.siteHex.row);
    S.missionTokens[key] = { missionId: mission.id, title: mission.title, type: 'site', missionType: mission.missionType || 'legacy_raid' };
    state.siteRevealed = true;
    syncLegacyRaidMapMarkerViews();
    return true;
  }

  function openLegacyRaidEntryPrompt(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var bossName = String(mission.legacyRaidBoss || 'Raid Boss');
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;max-width:600px;">'
      + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.2rem;"><strong>Raid Location Found</strong></div>'
      + '<div style="margin-bottom:.28rem;">The raid gate to <strong style="color:var(--gold2);">' + bossName + '</strong> hums with unstable energy.</div>'
      + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.34rem;">Enter to open the Raid overview, or leave and return when ready.</div>'
      + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Leave</button>'
      + '<button class="btn btn-sm btn-primary" onclick="openLegacyRaidMissionPopup(' + mission.id + ',{tokenType:\'raid\',regionTag:\'' + String(mission.region || 'region') + '\'});">Enter Raid</button>'
      + '</div>'
      + '</div>';
    openModal('Raid Gate', html);
    return true;
  }

  function handleLegacyRaidMarkerInteraction(missionId, tokenType, regionTag) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var mapPrompt = ensureLegacyRaidMapPromptState(mission);
    var type = String(tokenType || '').toLowerCase();
    if (!canAutoAdvanceMission(mission.id, type || 'raid', regionTag || mission.region || 'region')) return false;

    if ((type === 'informer' || type === 'holding_info') && mission.steps[1] && !mission.steps[1].completed) {
      openModal(
        'Endgame Raid Warning',
        '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;max-width:620px;">'
          + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.2rem;"><strong>This is an endgame raid. Be wary.</strong></div>'
          + '<div style="margin-bottom:.26rem;">Your contact can expose the raid gate hex, but this route expects late-campaign readiness.</div>'
          + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.34rem;">Accepting reveals the Raid location marker on another hex.</div>'
          + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
          + '<button class="btn btn-sm" onclick="closeModal()">Leave</button>'
          + '<button class="btn btn-sm btn-primary" onclick="acceptLegacyRaidWarning(' + mission.id + ')">Accept</button>'
          + '</div>'
          + '</div>'
      );
      return true;
    }

    if ((type === 'site' || type === 'holding_site')) {
      if (!mapPrompt || !mapPrompt.warningAccepted) {
        if (typeof showNotif === 'function') showNotif('Talk to the raid contact first before the gate can be approached.', 'warn');
        return true;
      }
      if (!mapPrompt.siteRevealed) revealLegacyRaidSiteMarker(mission);
      setLegacyRaidCurrentWing(mission, getLegacyRaidCurrentWing(mission));
      return openLegacyRaidEntryPrompt(mission);
    }

    if (mission.steps && mission.steps[2] && mission.steps[2].completed && mission.steps[3] && !mission.steps[3].completed) {
      setLegacyRaidCurrentWing(mission, 3);
      return openLegacyRaidEntryPrompt(mission);
    }
    if (typeof window.openLegacyRaidMissionPopup === 'function') {
      return !!window.openLegacyRaidMissionPopup(mission.id, { tokenType: type || 'raid', regionTag: regionTag || mission.region || 'region' });
    }
    return false;
  }

  window.acceptLegacyRaidWarning = function (missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var state = ensureLegacyRaidMapPromptState(mission);
    if (!state) return false;
    state.warningAccepted = true;
    state.siteRevealed = true;
    revealLegacyRaidSiteMarker(mission);
    if (typeof showNotif === 'function') {
      var hexLabel = mission.siteHex ? ('Hex ' + String(Number(mission.siteHex.col || 0) + 1) + ',' + String(Number(mission.siteHex.row || 0) + 1)) : 'a nearby hex';
      showNotif('Raid location revealed at ' + hexLabel + '.', 'good');
    }
    if (typeof closeModal === 'function') closeModal();
    return true;
  };

  function openLegacyRaidPreludeModal(missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    var bossName = String(mission.legacyRaidBoss || 'the Sovereign');
    var region = String(mission.region || mission.legacyRaidRegion || 'province');
    openModal(
      'Raid Prelude - ' + mission.title,
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;max-width:640px;">'
        + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.18rem;"><strong>NPC Briefing</strong></div>'
        + '<div style="margin-bottom:.22rem;">An allied informer intercepts you before the raid gate and warns that Wing 1 cannot be breached directly.</div>'
        + '<div style="margin-bottom:.22rem;color:var(--muted2);">Objective: meet the informant in a staging hex, secure route intel, then move to the breach hex to enter Wing 1 against ' + bossName + '.</div>'
        + '<div style="margin-bottom:.22rem;color:var(--teal);">Region: ' + region + ' · Status: ' + (run.preludeWing1Ready ? 'Breach hex ready' : 'Need staging run') + '</div>'
        + '<div style="display:flex;gap:.28rem;justify-content:flex-end;">'
        + '<button class="btn btn-xs" onclick="openLegacyRaidMissionPopup(' + mission.id + ',null)">Back</button>'
        + '<button class="btn btn-xs btn-primary" onclick="confirmLegacyRaidPrelude(' + mission.id + ')">Set Breach Hex Objective</button>'
        + '</div>'
      + '</div>'
    );
      return true;
    }

  window.confirmLegacyRaidPrelude = function (missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    run.preludeWing1Ready = true;
    if (typeof showNotif === 'function') showNotif('Raid prelude complete. Travel to the breach hex to enter Wing 1.', 'good');
    return openLegacyRaidMissionPopup(mission.id, { tokenType: 'site', regionTag: mission.region || mission.legacyRaidRegion || 'region' });
  };

  function getLegacyRaidTelegraphLines(mission) {
    var boss = String(mission && mission.legacyRaidBoss || 'World Boss');
    var telegraphs = [
      boss + ' signals major attacks before they resolve: watch lane pressure, room collapse hints, and puzzle-state shifts.',
      'Warning language matters: "The sky turns violet" or "The ship groans" means a wipe-level mechanic is coming next round.',
      'Every wing expects a different answer. Standing still and trading damage should fall behind the encounter quickly.',
      'Allies cover one lane only if your group commits the right role to it.',
      'If two players fail in a row, escalation triggers and boss pressure spikes until the team breaks the chain.'
    ];
    if (mission && mission.legacyRaidPuzzle) {
      telegraphs.push('Puzzle telegraph: ' + String(mission.legacyRaidPuzzle || 'Unknown mechanism'));
    }
    return telegraphs;
  }

  function sanitizeLegacyRaidAbilityKey(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function ensureLegacyRaidAbilities(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return [];
    if (Array.isArray(mission.legacyRaidAbilities) && mission.legacyRaidAbilities.length) return mission.legacyRaidAbilities;
    var relics = Array.isArray(mission.legacyRaidRelics) ? mission.legacyRaidRelics.slice(0, 3) : [];
    var templates = [
      {
        effect: 'battle_read',
        actionLabel: 'Predict Pattern',
        detail: 'Gain +4 raid bonus for this mission and stabilize one wing failure.',
        apply: function (m) {
          m.bonus = Number(m.bonus || 0) + 4;
          var run = ensureLegacyRaidRunState(m);
          if (!run) return;
          [3, 2, 1].forEach(function (wing) {
            if (Number(run.wingFailures[wing] || 0) > 0) {
              run.wingFailures[wing] = Math.max(0, Number(run.wingFailures[wing] || 0) - 1);
              if (Number(run.wingFailures[wing] || 0) <= 0) run.wingClean[wing] = true;
            }
          });
        }
      },
      {
        effect: 'revive_anchor',
        actionLabel: 'Anchor Checkpoint',
        detail: 'Waive the next checkpoint revive cost after a wipe.',
        apply: function (m) {
          var run = ensureLegacyRaidRunState(m);
          if (!run) return;
          run.freeReviveTokens = Number(run.freeReviveTokens || 0) + 1;
        }
      },
      {
        effect: 'wayfarer_surge',
        actionLabel: 'Wayfarer Surge',
        detail: 'Gain +1 clean wing credit and erase one wipe from this run.',
        apply: function (m) {
          var run = ensureLegacyRaidRunState(m);
          if (!run) return;
          run.wipes = Math.max(0, Number(run.wipes || 0) - 1);
          var wing = Number(run.currentWing || getLegacyRaidCurrentWing(m) || 3);
          run.wingClean[wing] = true;
        }
      }
    ];
    mission.legacyRaidAbilities = relics.map(function (relic, idx) {
      var tpl = templates[idx % templates.length];
      var idBase = sanitizeLegacyRaidAbilityKey((relic && (relic.id || relic.name)) || ('relic-' + idx));
      return {
        id: 'raid-ability-' + idBase,
        relicName: String(relic && relic.name || ('Bound Trophy ' + (idx + 1))),
        effect: tpl.effect,
        actionLabel: tpl.actionLabel,
        detail: tpl.detail,
        used: false
      };
    });
    return mission.legacyRaidAbilities;
  }

  function useLegacyRaidAbility(missionId, abilityId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var abilities = ensureLegacyRaidAbilities(mission);
    var ability = abilities.find(function (item) { return item && String(item.id || '') === String(abilityId || ''); });
    if (!ability || ability.used) return false;
    var templates = {
      battle_read: function (m) {
        m.bonus = Number(m.bonus || 0) + 4;
        var run = ensureLegacyRaidRunState(m);
        if (!run) return;
        [3, 2, 1].forEach(function (wing) {
          if (Number(run.wingFailures[wing] || 0) > 0) {
            run.wingFailures[wing] = Math.max(0, Number(run.wingFailures[wing] || 0) - 1);
            if (Number(run.wingFailures[wing] || 0) <= 0) run.wingClean[wing] = true;
          }
        });
      },
      revive_anchor: function (m) {
        var run = ensureLegacyRaidRunState(m);
        if (!run) return;
        run.freeReviveTokens = Number(run.freeReviveTokens || 0) + 1;
      },
      wayfarer_surge: function (m) {
        var run = ensureLegacyRaidRunState(m);
        if (!run) return;
        run.wipes = Math.max(0, Number(run.wipes || 0) - 1);
        var wing = Number(run.currentWing || getLegacyRaidCurrentWing(m) || 3);
        run.wingClean[wing] = true;
      }
    };
    if (templates[ability.effect]) templates[ability.effect](mission);
    ability.used = true;
    var run = ensureLegacyRaidRunState(mission);
    if (run) run.abilityUses = Number(run.abilityUses || 0) + 1;
    if (typeof showNotif === 'function') {
      showNotif('Raid ability activated: ' + String(ability.actionLabel || ability.relicName) + '.', 'good');
    }
    openLegacyRaidMissionPopup(mission.id, { tokenType: 'raid', regionTag: mission.region || 'region' });
    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     PLAYABLE RAID HEX MAP SYSTEM
     Each Wing renders as a fog-of-war hex dungeon. Players click
     rooms to explore them, Traveling Wayfarers are clickable NPCs,
     and the boss Confrontation lives in its own final hex.
  ═══════════════════════════════════════════════════════════════ */

  var RAID_THEMES = [
    { key: 'serpent',  matches: /serpent|snake|wyrm|crawler|worm/i,       name: 'Quarry Undercrawl',  bg: 'rgba(14,26,12,.92)', hexFill: '#182e1a', hexStroke: '#3d7040', fogFill: '#0d1a0e', fogStroke: '#1e3a21', tc: '#7ecf88', ac: '#a3d98c', muted: '#3d6b42', desc: ['Mildew-slicked quarry stone', 'collapsed tunnel props', 'the distant scraping of carapace on rock'] },
    { key: 'fire',     matches: /ember|tyrant|flame|inferno|pyre|ash|brand|cinder/i, name: 'Ember Lair', bg: 'rgba(28,10,4,.92)', hexFill: '#3a1008', hexStroke: '#8b3a1a', fogFill: '#180602', fogStroke: '#5a220a', tc: '#ff8c50', ac: '#ffb87a', muted: '#8b3a1a', desc: ['Char-black walls radiating residual heat', 'pools of cooled slag', 'the bitter scent of burning resin'] },
    { key: 'sea',      matches: /whale|tide|deep|abyss|kraken|leviathan|coral|brine/i, name: 'Submerged Vault', bg: 'rgba(6,16,28,.92)', hexFill: '#0a1c2e', hexStroke: '#1a5070', fogFill: '#040c18', fogStroke: '#0e3550', tc: '#4dd0e1', ac: '#80deea', muted: '#1a5070', desc: ['Brine-stained stonework dripping into darkness', 'half-flooded side passages', 'the weight of deep water pressing from above'] },
    { key: 'void',     matches: /void|null|absence|shade|hollow|unlight/i, name: 'Null Hollow',       bg: 'rgba(8,8,18,.95)',  hexFill: '#0e0e22', hexStroke: '#3a3a80', fogFill: '#050510', fogStroke: '#222260', tc: '#8888ff', ac: '#aaaaff', muted: '#3a3a80', desc: ['Dimensional static crackling between fractured masonry', 'gravity feels optional', 'light bends at the wrong angles'] },
    { key: 'stone',    matches: /ruin|stone|construct|golem|colossus|ancient|iron/i, name: 'Crumbling Complex', bg: 'rgba(18,15,10,.92)', hexFill: '#28231a', hexStroke: '#6b5e3e', fogFill: '#100d08', fogStroke: '#3e3526', tc: '#c9b47a', ac: '#e0ccaa', muted: '#6b5e3e', desc: ['Ancient dressed stone buckling under centuries of load', 'rusted iron fixtures', 'the groan of settling arches'] }
  ];
  var RAID_THEME_DEFAULT = { key: 'default', name: 'Shattered Complex', bg: 'rgba(14,14,18,.92)', hexFill: '#1a1a24', hexStroke: '#484860', fogFill: '#0a0a12', fogStroke: '#2a2a40', tc: '#c0c0e0', ac: '#d8d8f0', muted: '#484860', desc: ['Cracked flagstones', 'failing supports', 'the distant sound of shifting rubble'] };

  var RAID_ROOM_VARIANTS = {
    Hazard: [
      { icon: '⛰', label: 'Collapsed Passage', dd: 7 },
      { icon: '🌋', label: 'Magma Breach', dd: 8 },
      { icon: '🌊', label: 'Flooded Causeway', dd: 7 }
    ],
    Peril: [
      { icon: '☠', label: 'Deathzone Gallery', dd: 8 },
      { icon: '🧪', label: 'Volatile Spore Drift', dd: 8 },
      { icon: '🕳', label: 'Gravity Sink Hall', dd: 9 }
    ],
    Combat: [
      { icon: '⚔', label: 'Raider Killbox', dd: 7 },
      { icon: '🛡', label: 'Holdout Barricade', dd: 8 },
      { icon: '💥', label: 'Ambush Junction', dd: 8 }
    ],
    Trap: [
      { icon: '⚠', label: 'Trap Corridor', dd: 7 },
      { icon: '🕸', label: 'Snare Lattice', dd: 8 },
      { icon: '🔒', label: 'Pressure Lock Hall', dd: 8 }
    ],
    Gambling: [
      { icon: '🂡', label: 'Contraband Card Den', dd: 8 },
      { icon: '🎲', label: 'Loaded Dice Pit', dd: 8 },
      { icon: '♠', label: 'Shadow Wager Hall', dd: 9 }
    ],
    Loot: [
      { icon: '📦', label: 'Smuggler Cache', dd: 7 },
      { icon: '💰', label: 'Merchant Vault Spill', dd: 8 },
      { icon: '🎒', label: 'Supply Seizure Bay', dd: 7 }
    ]
  };

  var RAID_WING_ROOM_BLUEPRINTS = {
    1: ['Entry', 'RANDOM', 'Puzzle', 'RANDOM', 'LoreReading', 'RANDOM', 'Puzzle', 'RANDOM', 'Puzzle', 'RANDOM', 'WayfarerPost', 'Approach'],
    2: ['Entry', 'RANDOM', 'Puzzle', 'Combat', 'RANDOM', 'Puzzle', 'RANDOM', 'Combat', 'RANDOM', 'Puzzle', 'WayfarerPost', 'Approach'],
    3: ['Entry', 'Approach', 'Confrontation']
  };

  var RAID_RANDOM_ROOM_TYPES = ['Hazard', 'Peril', 'Combat', 'Trap', 'Gambling', 'Loot'];

  function shuffleRaidArray(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pickRaidVariant(type) {
    var pool = RAID_ROOM_VARIANTS[type] || [];
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function drawRaidRandomRoomTypes(count, forceCombat) {
    var pool = shuffleRaidArray(RAID_RANDOM_ROOM_TYPES);
    var picks = [];
    for (var i = 0; i < count; i++) {
      picks.push(pool[i % pool.length]);
    }
    if (forceCombat && picks.indexOf('Combat') < 0 && picks.length) {
      picks[0] = 'Combat';
    }
    return shuffleRaidArray(picks);
  }

  function buildRaidWingTemplateByType(type, wingNum, idx) {
    if (type === 'Entry') {
      var entryLabel = wingNum === 1 ? 'Entry Threshold' : wingNum === 2 ? 'Mechanism Threshold' : 'Confrontation Approach';
      return { type: 'Entry', icon: '🚪', label: entryLabel, dd: 0, hasWayfarer: false };
    }
    if (type === 'WayfarerPost') {
      var postLabel = wingNum === 3 ? 'Final Staging Post' : 'Wayfarer Staging Post';
      return { type: 'WayfarerPost', icon: '⚑', label: postLabel, dd: 0, hasWayfarer: true };
    }
    if (type === 'Puzzle') {
      return { type: 'Puzzle', icon: '🧩', label: 'Gate Mechanism Room', dd: 9, hasWayfarer: false };
    }
    if (type === 'LoreReading') {
      return { type: 'LoreReading', icon: '📜', label: 'Lore Fragment Vault', dd: 8, hasWayfarer: false };
    }
    if (type === 'Approach') {
      return { type: 'Approach', icon: '🌀', label: 'Chamber Breach', dd: 10, hasWayfarer: false };
    }
    if (type === 'Confrontation') {
      return { type: 'Confrontation', icon: '🐉', label: 'Boss Chamber', dd: 11, hasWayfarer: false, isBoss: true };
    }
    var variant = pickRaidVariant(type) || { icon: '⚄', label: 'Unknown Room', dd: 7 };
    var tpl = {
      type: type,
      icon: variant.icon,
      label: variant.label,
      dd: Number(variant.dd || 7),
      hasWayfarer: false
    };
    if (type === 'Combat') {
      tpl.enemyCount = Math.max(1, Math.min(4, 1 + Math.floor(Math.random() * 4)));
      tpl.label += ' (' + tpl.enemyCount + ' hostiles)';
      tpl.dd += Math.max(0, tpl.enemyCount - 2);
    }
    if (type === 'Loot') {
      tpl.label += ' (Merchant-linked loot)';
    }
    if (type === 'Gambling') {
      tpl.label += ' (High-risk wager)';
    }
    tpl.slot = idx;
    return tpl;
  }

  function buildRaidWingTemplates(wingNum) {
    var blueprint = RAID_WING_ROOM_BLUEPRINTS[wingNum] || RAID_WING_ROOM_BLUEPRINTS[1];
    var randomSlots = blueprint.filter(function (t) { return t === 'RANDOM'; }).length;
    var randomTypes = drawRaidRandomRoomTypes(randomSlots, true);
    var randomIdx = 0;
    var templates = [];
    for (var i = 0; i < blueprint.length; i++) {
      var type = blueprint[i];
      if (type === 'RANDOM') {
        type = randomTypes[randomIdx++] || 'Hazard';
      }
      templates.push(buildRaidWingTemplateByType(type, wingNum, i));
    }
    return templates;
  }

  function getRaidTheme(mission) {
    var bossName = String(mission && mission.legacyRaidBoss || mission && mission.title || '');
    for (var i = 0; i < RAID_THEMES.length; i++) {
      if (RAID_THEMES[i].matches.test(bossName)) return RAID_THEMES[i];
    }
    return RAID_THEME_DEFAULT;
  }

  function getRaidRoomProgressNeeded(roomType) {
    var mission = arguments.length > 1 ? arguments[1] : null;
    var profile = mission && mission.legacyRaidProfile && typeof mission.legacyRaidProfile === 'object' ? mission.legacyRaidProfile : {};
    var bonus = Math.max(0, Number(profile.roomProgressBonus || 0));
    if (roomType === 'Puzzle') return 3;
    if (roomType === 'Combat') return 1;
    if (roomType === 'Gambling') return 1;
    if (roomType === 'LoreReading' || roomType === 'Hazard' || roomType === 'Peril' || roomType === 'Trap' || roomType === 'Loot' || roomType === 'Approach' || roomType === 'TrophyCache') return 2 + bonus;
    return 1 + Math.min(1, bonus);
  }

  function getLegacyRaidProfile(mission) {
    if (!mission || typeof mission !== 'object') return {};
    return mission.legacyRaidProfile && typeof mission.legacyRaidProfile === 'object' ? mission.legacyRaidProfile : {};
  }

  function getLegacyRaidRoomDd(mission, roomType, baseDd) {
    var profile = getLegacyRaidProfile(mission);
    var dd = Math.max(0, Number(baseDd || 0));
    dd += Math.max(0, Number(profile.roomDdBonus || 0));
    if (roomType === 'Peril') dd += 1;
    if (roomType === 'Approach' || roomType === 'Confrontation') dd += Math.max(0, Number(profile.approachDdBonus || 0));
    return normalizeMissionDreadDie(dd);
  }

  function buildLegacyRaidLoreFragment(mission) {
    var bossName = String(mission && mission.legacyRaidBoss || 'this boss');
    var region = String(mission && (mission.legacyRaidRegion || mission.region) || '').toLowerCase();
    if (region === 'sea') {
      return 'Lore Fragment: The ' + bossName + ' is worshipped by raider flotillas because it can collapse convoy currents and open hidden brine channels. If left alive, sea routes lose three ports each cycle to extortion and sink raids.';
    }
    if (region === 'galaxy') {
      return 'Lore Fragment: ' + bossName + ' is not just a beast but a lane-breaker linked to old jump-lattice scars. Every reappearance distorts nearby star lanes and strands civilian fleets, forcing tribute runs to survive transit.';
    }
    if (region === 'planet') {
      return 'Lore Fragment: ' + bossName + ' controls buried colony routes by forcing bunker sectors to rotate into dead ends. Each failed pass costs settlements power, med supply, and evacuation corridors.';
    }
    if (region === 'wtw') {
      return 'Lore Fragment: ' + bossName + ' writes district-level fear events into surviving infrastructure. When it rises, entire blocks desync and movement corridors become lethal one round after warning.';
    }
    return 'Lore Fragment: ' + bossName + ' controls the old road tunnels beneath province quarries. Raider houses protect it because it decides which caravans pass safely and which vanish underground, letting them tax every land route.';
  }

  function getLegacyRaidBossActionSet(mission) {
    if (mission && Array.isArray(mission.legacyRaidBossActions) && mission.legacyRaidBossActions.length) {
      return mission.legacyRaidBossActions.map(function (line, idx) {
        if (line && typeof line === 'object') {
          var objectAction = Object.assign({}, line);
          objectAction.name = String(objectAction.name || ('Boss Pattern ' + (idx + 1)));
          objectAction.text = String(objectAction.text || objectAction.name);
          if (!Array.isArray(objectAction.ranges) || !objectAction.ranges.length) objectAction.ranges = ['Engaged', 'Close', 'Nearby', 'Far'];
          if (typeof objectAction.dreadDie !== 'number') objectAction.dreadDie = 10;
          if (!objectAction.stat) objectAction.stat = 'Strike';
          if (typeof objectAction.tmwDefend !== 'number') objectAction.tmwDefend = 4;
          if (!objectAction.effect) objectAction.effect = objectAction.raidwide ? 'stress' : 'health';
          if (!objectAction.damage) objectAction.damage = 'dd';
          objectAction.kind = objectAction.kind || (objectAction.effect === 'stress' || objectAction.effect === 'condition' ? 'directStress' : 'defendCheck');
          return objectAction;
        }
        var text = String(line || 'Boss pressure action');
        var lower = text.toLowerCase();
        var raidwide = /all|raid|everyone|chain|wave|broadcast|shock|flood/.test(lower);
        var effect = /stress|panic|fear|mind/.test(lower)
          ? 'stress'
          : (/hazard|fire|collapse|zone|lane|flood/.test(lower) ? 'zone_hazard' : 'health');
        var stat = /lore|decode|pattern|signal/.test(lower)
          ? 'Lore'
          : (/spirit|faith|morale/.test(lower) ? 'Spirit' : (/craft|tech|mechanic/.test(lower) ? 'Craft' : 'Body'));
        var condition = /panic|fear/.test(lower)
          ? 'Panicked'
          : (/stun|stagger|freeze/.test(lower) ? 'Stunned' : (/burn|fire/.test(lower) ? 'Burned' : (/irradiat|radiation/.test(lower) ? 'Irradiated' : '')));
        var hazard = effect === 'zone_hazard'
          ? { zone: /far/.test(lower) ? 'Far' : (/near/.test(lower) ? 'Nearby' : 'Close'), type: /collapse|seal|lock/.test(lower) ? 'disabled' : 'fire', rounds: /2|double/.test(lower) ? 2 : 1, desc: text }
          : null;
        return {
          name: text.split(':')[0] || ('Boss Pattern ' + (idx + 1)),
          text: text,
          raidwide: raidwide,
          kind: /hack|signal|psychic/.test(lower) ? 'hack' : (/health|crush|slam|impact/.test(lower) ? 'healthStrike' : (/radiation|toxic|brine|shock|lash/.test(lower) ? 'directStress' : 'defendCheck')),
          dreadDie: raidwide ? 12 : 10,
          stat: stat,
          vsDefend: /strike|shoot|hit|slam|crush/.test(lower),
          effect: effect,
          damage: /\+d6/.test(lower) ? 'dd+d6' : (/\+d4/.test(lower) ? 'dd+d4' : 'dd'),
          condition: condition,
          injures: /injur|cripple|disable personal flavor/.test(lower),
          zoneHazard: hazard,
          ranges: raidwide ? ['Engaged', 'Close', 'Nearby', 'Far'] : ['Engaged', 'Close'],
          tmwDefend: raidwide ? 6 : 4
        };
      });
    }
    var bossName = String(mission && mission.legacyRaidBoss || 'World Boss');
    var lower = bossName.toLowerCase();
    if (/eel|tide|whale|leviathan|brine|sea/.test(lower)) {
      return [
        { name: 'Static Flood', text: 'Raidwide surge: everyone takes 2 Stress unless Support is assigned this phase.', raidwide: true },
        { name: 'Current Shear', text: 'Frontline is displaced; Front role must stabilize or the next check is +2 DD.', raidwide: false },
        { name: 'Capacitor Maw', text: 'Mechanics must decode the charge lattice or the eel unleashes a second raidwide pulse.', raidwide: true }
      ];
    }
    if (/serpent|wyrm|worm|crawler/.test(lower)) {
      return [
        { name: 'Subterranean Collapse', text: 'Raidwide cave-in pressure: everyone takes 2 Stress unless Front is assigned.', raidwide: true },
        { name: 'Tail Bore', text: 'A tunnel-lunge targets rear lines. Support must anchor pathing or roles desync.', raidwide: false },
        { name: 'Dust Blind', text: 'Mechanics must read silhouettes through dust or the next phase gains +2 DD.', raidwide: false }
      ];
    }
    return [
      { name: 'Cataclysm Pulse', text: 'Raidwide pulse: everyone takes 2 Stress unless Support is assigned. Boss spends 4 AP.', raidwide: true, dreadDie: 12, stat: 'Spirit', effect: 'stress', kind: 'directStress' },
      { name: 'Pattern Break', text: 'Mechanics must decode a signal shift (DD 6) or the next boss action gains +2 DD.', raidwide: false, dreadDie: 6, stat: 'Craft', effect: 'health', kind: 'hack' },
      { name: 'Overrun Lane', text: 'Boss floods two lanes — Front must anchor (Defend DD 5) or the party takes 3 damage.', raidwide: true, dreadDie: 10, stat: 'Body', effect: 'health', kind: 'defendCheck' },
      { name: 'Crushing Advance', text: 'Boss slams the front line (Engaged/Close). Front target defends with Body DD 4 or takes +2 damage.', raidwide: false, dreadDie: 10, stat: 'Body', effect: 'health', kind: 'healthStrike', ranges: ['Engaged', 'Close'] },
      { name: 'Void Lash', text: 'A sweeping void tendril strikes everyone at Close range (DD 5) and may cause Staggered.', raidwide: false, condition: 'Stunned', dreadDie: 10, stat: 'Body', effect: 'health', kind: 'defendCheck', ranges: ['Engaged', 'Close', 'Nearby'] },
      { name: 'Neural Barrage', text: 'Psychic blast targets all — Mind roll (DD 6) or lose 2 AP next round.', raidwide: true, dreadDie: 12, stat: 'Mind', effect: 'stress', kind: 'directStress' },
      { name: 'Phase Rend', text: 'Boss tears phase energy across the room — Mechanics decode (DD 7) or party HP ceiling drops by 2 this round.', raidwide: true, dreadDie: 12, stat: 'Craft', effect: 'health', kind: 'hack' },
      { name: 'Predator Lockdown', text: 'Boss marks 1 target — that character cannot spend AP for defense this round.', raidwide: false, dreadDie: 8, stat: 'Lead', effect: 'condition', kind: 'directStress', condition: 'Exposed' },
      { name: 'Rend the Veil', text: 'Forces a Lore check (DD 7) vs. psychic imprint — fail: 3 Stress and vision impairment next round.', raidwide: false, dreadDie: 10, stat: 'Lore', effect: 'stress', kind: 'directStress' },
      { name: 'Seismic Slam', text: 'Ground shockwave hits everyone at Nearby or closer; Defend DD 5 or fall Prone (lose 2 AP next round).', raidwide: true, dreadDie: 10, stat: 'Body', effect: 'health', kind: 'defendCheck', ranges: ['Engaged', 'Close', 'Nearby'] },
      { name: 'Siege Roar', text: 'Morale disruption: whole raid rolls Spirit DD 5 or takes 1 Stress and -1 Action next round.', raidwide: true, dreadDie: 8, stat: 'Spirit', effect: 'stress', kind: 'directStress' },
      { name: 'Shadowstep', text: 'Boss repositions instantly — all zone assignments are cleared and must be re-assigned next round.', raidwide: true, dreadDie: 6, stat: 'Lead', effect: 'condition', kind: 'directStress' }
    ];
  }

  function buildLegacyRaidBossTimeline(actions) {
    var a = Array.isArray(actions) && actions.length ? actions : [{ name: 'Boss Pattern', text: 'Unknown pattern.', raidwide: false }];
    var altA = Math.floor(Math.random() * a.length);
    var altB = Math.floor(Math.random() * a.length);
    return [
      { turn: 1, beat: 'Opening Pattern', actionIndex: 0, laneShift: 'left' },
      { turn: 2, beat: 'Pressure Check A Start', actionIndex: 1 % a.length, pressureWindow: 'A', laneShift: 'right' },
      { turn: 3, beat: 'Branch Pattern α/β', actionIndex: altA, branch: true, laneShift: 'center' },
      { turn: 4, beat: 'Pressure Check A End', actionIndex: 2 % a.length, pressureWindow: 'A', laneShift: 'left' },
      { turn: 5, beat: 'Recovery Breaker', actionIndex: 1 % a.length, laneShift: 'right' },
      { turn: 6, beat: 'Branch Pattern γ/δ', actionIndex: altB, branch: true, laneShift: 'center' },
      { turn: 7, beat: 'Final Pressure Start', actionIndex: 0, pressureWindow: 'B', laneShift: 'left' },
      { turn: 8, beat: 'Final Pressure End', actionIndex: 2 % a.length, pressureWindow: 'B', laneShift: 'right' }
    ];
  }

  function getLegacyRaidRoleActionCatalog() {
    return {
      front: [
        { key: 'guard', label: 'Guard', cd: 2, text: 'Spend Guard to blunt lane hazards and reduce Dread this turn.' },
        { key: 'anchor', label: 'Anchor', cd: 3, text: 'Engineer anchor stance: gain +2 Defend pressure and +1 Action bonus this turn.' },
        { key: 'breach', label: 'Breach', cd: 2, text: 'Aggressive push for +2 Action bonus this turn.' }
      ],
      mechanics: [
        { key: 'decode', label: 'Decode', cd: 2, text: 'Decode telegraph to gain +2 Action bonus.' },
        { key: 'stabilize', label: 'Stabilize', cd: 3, text: 'Cancel one pending strike from failed pressure windows.' },
        { key: 'disrupt', label: 'Disrupt', cd: 3, text: 'Reduce this turn\'s Dread roll by 2.' }
      ],
      support: [
        { key: 'cleanse', label: 'Cleanse', cd: 2, text: 'Remove raidwide pressure residue and grant +1 Action bonus.' },
        { key: 'rally', label: 'Rally', cd: 2, text: 'Restore 1 Focus and 1 Momentum to the team pool.' },
        { key: 'command', label: 'Coordinate', cd: 3, text: 'Captain coordination: buff all active rolls this turn and call allied reinforcement.' }
      ]
    };
  }

  function ensureLegacyRaidBossRoleCooldowns(encounter) {
    if (!encounter) return null;
    if (!encounter.roleActionCooldowns || typeof encounter.roleActionCooldowns !== 'object') {
      encounter.roleActionCooldowns = { front: {}, mechanics: {}, support: {} };
    }
    if (!encounter.roleActionState || typeof encounter.roleActionState !== 'object') {
      encounter.roleActionState = { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 };
    }
    if (!encounter.roleLanes || typeof encounter.roleLanes !== 'object') {
      encounter.roleLanes = { front: 'left', mechanics: 'center', support: 'right' };
    }
    if (!encounter.hazardLane) encounter.hazardLane = 'center';
    if (!encounter.prepTags || typeof encounter.prepTags !== 'object') encounter.prepTags = {};
    if (typeof encounter.failedChain !== 'number') encounter.failedChain = 0;
    if (typeof encounter.wipeShield !== 'number') encounter.wipeShield = 0;
    if (!encounter.turnStage) encounter.turnStage = 'player';
    if (typeof encounter.allyActionsUsed !== 'number') encounter.allyActionsUsed = 0;
    if (!encounter.allyActionBudget || typeof encounter.allyActionBudget !== 'object') {
      encounter.allyActionBudget = { total: 0, used: 0, byAlly: {} };
    }
    if (typeof encounter.playerActionLabel !== 'string') encounter.playerActionLabel = '';
    if (typeof encounter.lastTelegraph !== 'string') encounter.lastTelegraph = 'No active telegraph.';
    if (typeof encounter.bossReaction !== 'string') encounter.bossReaction = '';
    return encounter.roleActionCooldowns;
  }

  function tickLegacyRaidBossRoleCooldowns(encounter) {
    if (!encounter || !encounter.roleActionCooldowns) return;
    ['front', 'mechanics', 'support'].forEach(function (role) {
      var group = encounter.roleActionCooldowns[role] || {};
      Object.keys(group).forEach(function (key) {
        group[key] = Math.max(0, Number(group[key] || 0) - 1);
      });
    });
    encounter.roleActionState = { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 };
    encounter.prepTags = {};
  }

  function getLegacyRaidBossDreadDie(encounter) {
    var phase = Math.max(1, Number(encounter && encounter.phase || 1));
    var profiles = encounter && Array.isArray(encounter.phaseProfiles) ? encounter.phaseProfiles : [];
    if (profiles.length && profiles[phase - 1]) return Math.max(4, Number(profiles[phase - 1].dread || 10));
    if (phase >= 3) return 20;
    if (phase >= 2) return 12;
    return 10;
  }

  function getLegacyRaidTimelineTurn(encounter) {
    if (!encounter) return null;
    var timeline = Array.isArray(encounter.timeline) ? encounter.timeline : [];
    var idx = Math.max(0, Math.min(timeline.length - 1, Number(encounter.turn || 1) - 1));
    return timeline[idx] || null;
  }

  function advanceLegacyRaidBossToNextPlayerTurn(mission, encounter) {
    if (!mission || !encounter) return false;
    var maxPlayActions = typeof getMaxActions === 'function' ? getMaxActions() : 3;
    encounter.turnStage = 'player';
    encounter.allyActionsUsed = 0;
    encounter.bossActionsLeft = 0;
    resetLegacyRaidAllyActionBudget(mission, encounter);
    encounter.turn = Math.min(8, Number(encounter.turn || 1) + 1);
    var nextNode = getLegacyRaidTimelineTurn(encounter);
    if (nextNode) {
      nextNode.playerActionsLeft = maxPlayActions;
      if (Array.isArray(encounter.actions) && encounter.actions.length) {
        encounter.currentAction = encounter.actions[Math.max(0, Number(nextNode.actionIndex || 0)) % encounter.actions.length];
      }
    }
    updateLegacyRaidBossHazardLane(encounter);
    return true;
  }

  function updateLegacyRaidBossHazardLane(encounter) {
    var turnNode = getLegacyRaidTimelineTurn(encounter);
    var lane = turnNode && turnNode.laneShift ? String(turnNode.laneShift) : 'center';
    encounter.hazardLane = lane;
  }

  function applyLegacyRaidPressureWindow(encounter, turnNum, success, bonusProgress) {
    if (!encounter || !Array.isArray(encounter.pressureWindows)) return { failedWindow: false, note: '' };
    var failed = false;
    var note = '';
    encounter.pressureWindows.forEach(function (window) {
      if (!window) return;
      if (turnNum >= Number(window.start || 0) && turnNum <= Number(window.end || 0) && success) {
        window.progress = Number(window.progress || 0) + 1 + Math.max(0, Number(bonusProgress || 0));
      }
      if (turnNum === Number(window.end || 0) && Number(window.progress || 0) < Number(window.target || 1)) {
        failed = true;
        note = String(window.label || 'Pressure window') + ' failed (' + Number(window.progress || 0) + '/' + Number(window.target || 1) + ').';
      }
    });
    return { failedWindow: failed, note: note };
  }

  window.useLegacyRaidRoleAction = function (missionId, roleKey, actionKey) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.active) return false;
    var catalog = getLegacyRaidRoleActionCatalog();
    var role = String(roleKey || '').toLowerCase();
    var action = String(actionKey || '').toLowerCase();
    if (!catalog[role]) return false;
    var entry = catalog[role].find(function (item) { return String(item.key || '') === action; });
    if (!entry) return false;
    ensureLegacyRaidBossRoleCooldowns(encounter);
    if (Number((encounter.roleActionCooldowns[role] || {})[action] || 0) > 0) {
      if (typeof showNotif === 'function') showNotif(entry.label + ' is on cooldown.', 'warn');
      return false;
    }
    var resources = ensureLegacyRaidResourcePools(mission);
    var state = encounter.roleActionState || { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 };
    var prepTags = encounter.prepTags || {};
    if (action === 'guard') {
      if (Number(resources.guard || 0) <= 0) {
        if (typeof showNotif === 'function') showNotif('No Guard resource remaining.', 'warn');
        return false;
      }
      resources.guard = Math.max(0, Number(resources.guard || 0) - 1);
      state.hazardGuard = true;
      state.dreadReduction += 1;
      prepTags['engineer-guard'] = true;
    } else if (action === 'anchor') {
      state.actionBonus += 1;
      state.dreadReduction += 2;
      prepTags['engineer-anchor'] = true;
    } else if (action === 'breach') {
      if (Number(resources.momentum || 0) <= 0) {
        if (typeof showNotif === 'function') showNotif('No Momentum resource remaining.', 'warn');
        return false;
      }
      resources.momentum = Math.max(0, Number(resources.momentum || 0) - 1);
      state.actionBonus += 2;
      prepTags['gunner-breach'] = true;
    } else if (action === 'decode') {
      if (Number(resources.focus || 0) <= 0) {
        if (typeof showNotif === 'function') showNotif('No Focus resource remaining.', 'warn');
        return false;
      }
      resources.focus = Math.max(0, Number(resources.focus || 0) - 1);
      state.actionBonus += 2;
      state.pressureBonus += 1;
      prepTags['navigator-decode'] = true;
    } else if (action === 'stabilize') {
      encounter.strikes = Math.max(0, Number(encounter.strikes || 0) - 1);
      prepTags['navigator-stabilize'] = true;
    } else if (action === 'disrupt') {
      state.dreadReduction += 2;
      prepTags['navigator-disrupt'] = true;
    } else if (action === 'cleanse') {
      encounter.raidwideHits = Math.max(0, Number(encounter.raidwideHits || 0) - 1);
      state.actionBonus += 1;
      prepTags['captain-cleanse'] = true;
    } else if (action === 'rally') {
      resources.focus = Math.min(5, Number(resources.focus || 0) + 1);
      resources.momentum = Math.min(5, Number(resources.momentum || 0) + 1);
      prepTags['captain-rally'] = true;
    } else if (action === 'command') {
      var wayfarers = getRaidWayfarersForWing(mission, 3);
      var ready = wayfarers.find(function (wf) { return wf && wf.status === 'ready'; });
      if (!ready) {
        if (typeof showNotif === 'function') showNotif('No ready Traveling Wayfarer to command.', 'warn');
        return false;
      }
      ready.status = 'deployed';
      ready.wing = 3;
      state.actionBonus += 2;
      state.pressureBonus += 1;
      prepTags['captain-coordinate'] = true;
    }
    encounter.roleActionState = state;
    encounter.prepTags = prepTags;
    encounter.roleActionCooldowns[role][action] = Number(entry.cd || 2);
    encounter.log.push(role.toUpperCase() + ' action: ' + entry.label + '.');
    openRaidWingPopup(mission.id, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  window.useLegacyRaidTeamUtility = function (missionId, utilityKey) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var run = ensureLegacyRaidRunState(mission);
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!run || !encounter || !encounter.active) return false;
    var utilities = ensureLegacyRaidTeamUtilities(mission);
    var key = String(utilityKey || '').toLowerCase();
    var slot = utilities[key];
    if (!slot) return false;
    if (Number(slot.cd || 0) > 0) {
      if (typeof showNotif === 'function') showNotif('Utility on cooldown.', 'warn');
      return false;
    }
    if (key === 'team_barrier') {
      encounter.roleActionState.hazardGuard = true;
      encounter.roleActionState.dreadReduction += 1;
      encounter.log.push('Team Utility: Barrier deployed.');
      encounter.prepTags['utility-barrier'] = true;
    } else if (key === 'emergency_rez') {
      var wayfarers = getRaidWayfarersForWing(mission, 3);
      var fallen = wayfarers.find(function (wf) { return wf && wf.status === 'failed'; });
      if (fallen) {
        fallen.status = 'ready';
        fallen.wing = null;
      }
      encounter.log.push('Team Utility: Emergency Rez restored allied support.');
      encounter.prepTags['utility-rez'] = true;
    } else if (key === 'time_extension') {
      ensureLegacyRaidClock(mission);
      run.clockRemaining = Number(run.clockRemaining || 0) + 2;
      encounter.log.push('Team Utility: Time Extension granted +2 ticks.');
      encounter.prepTags['utility-time'] = true;
    } else if (key === 'cleanse_pulse') {
      encounter.raidwideHits = Math.max(0, Number(encounter.raidwideHits || 0) - 2);
      encounter.strikes = Math.max(0, Number(encounter.strikes || 0) - 1);
      encounter.log.push('Team Utility: Cleanse Pulse reduced raid pressure.');
      encounter.prepTags['utility-cleanse'] = true;
    }
    slot.cd = Number(slot.baseCd || 4);
    openRaidWingPopup(mission.id, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  window.useLegacyRaidTeamworkBurst = function (missionId, mode) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.active) return false;
    var key = String(mode || '').toLowerCase();
    var costs = getLegacyRaidTeamworkBurstCosts(mission);
    if (key === 'prevent_action' || key === 'cancel_mechanic') {
      if (!spendLegacyRaidTeamwork(costs.prevent, 'Raid attack prevention')) return false;
      encounter.bossReaction = 'Boss reacts: hidden attack unlocked next cycle.';
      encounter.log.push('Teamwork burst: ' + costs.prevent + ' TMW canceled the incoming mechanic.');
      return window.resolveRaidBossPhase(mission.id, true, { preventedByTeamwork: true });
    }
    if (key === 'auto_success_puzzle') {
      if (!spendLegacyRaidTeamwork(costs.puzzle, 'Raid puzzle override')) return false;
      mission.legacyRaidPuzzleAutoSuccess = Number(mission.legacyRaidPuzzleAutoSuccess || 0) + 1;
      encounter.log.push('Teamwork burst: ' + costs.puzzle + ' TMW banked for one auto-success puzzle.');
      if (typeof openModal === 'function') {
        openModal('Teamwork Cinematic', '<div style="font-size:.83rem;color:var(--text2);line-height:1.55;">'
          + 'The team threads the mechanism perfectly. One future puzzle can be bypassed instantly.'
          + '</div>');
      }
      openRaidWingPopup(mission.id, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
      return true;
    }
    if (key === 'revive_ally') {
      if (!spendLegacyRaidTeamwork(costs.revive, 'Raid emergency revive')) return false;
      var wayfarers = getRaidWayfarersForWing(mission, 3);
      var fallen = wayfarers.find(function (wf) { return wf && wf.status === 'failed'; });
      if (fallen) {
        fallen.status = 'ready';
        fallen.wing = null;
      }
      encounter.log.push('Teamwork burst: ' + costs.revive + ' TMW revived an ally.');
      openRaidWingPopup(mission.id, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
      return true;
    }
    if (key === 'cinematic_success') {
      if (!spendLegacyRaidTeamwork(costs.cinematic, 'Cinematic raid finish')) return false;
      encounter.log.push('Cinematic surge triggered with ' + costs.cinematic + ' TMW. Current boss phase is broken instantly.');
      encounter.phaseHp = 0;
      if (Number(encounter.phase || 1) >= 3) return window.resolveRaidBossRoom(mission.id, true);
      encounter.phase = Number(encounter.phase || 1) + 1;
      var next = encounter.phaseProfiles && encounter.phaseProfiles[encounter.phase - 1];
      encounter.phaseHp = Math.max(1, Number(next && next.hp || 20));
      encounter.turnStage = 'player';
      encounter.allyActionsUsed = 0;
      resetLegacyRaidAllyActionBudget(mission, encounter);
      openRaidWingPopup(mission.id, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
      return true;
    }
    return false;
  };

  function ensureLegacyRaidBossEncounter(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidBossEncounter || typeof mission.legacyRaidBossEncounter !== 'object') {
      var profile = getLegacyRaidProfile(mission);
      var actions = getLegacyRaidBossActionSet(mission);
      mission.legacyRaidBossEncounter = {
        active: false,
        phase: 1,
        turn: 1,
        phaseProfiles: [
          { dread: 10, hp: 20, text: 'Phase 1: The boss tests your formation with direct pressure.' },
          { dread: 12, hp: 24, text: 'Phase 2: The boss twists mechanics and inflicts status control.' },
          { dread: 20, hp: 40, text: 'Phase 3: The boss fractures the map and unleashes catastrophic actions.' }
        ],
        phaseHp: 20,
        strikes: 0,
        strikesAllowed: Math.max(1, Number(profile.bossStrikesAllowed || 2)),
        actionCadence: Math.max(1, Number(profile.bossActionCadence || 1)),
        currentAction: actions[0],
        actions: actions,
        timeline: buildLegacyRaidBossTimeline(actions),
        pressureWindows: [
          { id: 'A', label: 'Pressure Window A', start: 2, end: 4, target: 2, progress: 0 },
          { id: 'B', label: 'Pressure Window B', start: 7, end: 8, target: 2, progress: 0 }
        ],
        turnStage: 'player',
        allyActionsUsed: 0,
        playerActionLabel: '',
        lastTelegraph: 'No active telegraph.',
        bossReaction: '',
        roles: { front: false, mechanics: false, support: false },
        raidwideHits: 0,
        roleActionCooldowns: { front: {}, mechanics: {}, support: {} },
        roleActionState: { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 },
        roleLanes: { front: 'left', mechanics: 'center', support: 'right' },
        skipPhaseTwoPending: !!mission.legacyRaidSkipPhase2,
        hazardLane: 'center',
        bossActionsLeft: 0,
        log: []
      };
    }
    if (typeof mission.legacyRaidBossEncounter.bossActionsLeft !== 'number') {
      mission.legacyRaidBossEncounter.bossActionsLeft = 0;
    }
    ensureLegacyRaidBossRoleCooldowns(mission.legacyRaidBossEncounter);
    updateLegacyRaidBossHazardLane(mission.legacyRaidBossEncounter);
    return mission.legacyRaidBossEncounter;
  }

  function setLegacyRaidBossEncounterActive(mission, active) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return;
    encounter.active = !!active;
  }
  // ─── Zone Hazard State ────────────────────────────────────────────────────
  function ensureLegacyRaidZoneHazards(mission) {
    if (!mission.legacyRaidZoneHazards || typeof mission.legacyRaidZoneHazards !== 'object') mission.legacyRaidZoneHazards = {};
    return mission.legacyRaidZoneHazards;
  }
  function tickLegacyRaidZoneHazards(mission) {
    var haz = ensureLegacyRaidZoneHazards(mission);
    Object.keys(haz).forEach(function (zone) {
      var h = haz[zone];
      if (h && Number(h.rounds || 0) > 0) {
        h.rounds = Number(h.rounds) - 1;
        if (h.rounds <= 0) {
          delete haz[zone];
          if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.hazards))
            S.combatMap.hazards = S.combatMap.hazards.filter(function (h2) { return h2.zone !== zone; });
        }
      }
    });
    if (typeof renderCombatMap === 'function') renderCombatMap();
  }
  function applyLegacyRaidZoneHazard(mission, zoneHazard) {
    if (!zoneHazard || !zoneHazard.zone) return;
    var haz = ensureLegacyRaidZoneHazards(mission);
    haz[String(zoneHazard.zone)] = { type: String(zoneHazard.type || 'fire'), rounds: Math.max(1, Number(zoneHazard.rounds || 1)), desc: String(zoneHazard.desc || '') };
    if (typeof S !== 'undefined' && S && S.combatMap) {
      if (!Array.isArray(S.combatMap.hazards)) S.combatMap.hazards = [];
      S.combatMap.hazards = S.combatMap.hazards.filter(function (h) { return h.zone !== zoneHazard.zone; });
      S.combatMap.hazards.push({ zone: zoneHazard.zone, type: String(zoneHazard.type || 'fire'), rounds: Math.max(1, Number(zoneHazard.rounds || 1)), desc: String(zoneHazard.desc || '') });
      if (typeof renderCombatMap === 'function') renderCombatMap();
    }
  }

  // ─── Boss Action Resolution ──────────────────────────────────────────────
  function buildLegacyRaidCombatEnemyEvents(mission) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    var actions = encounter && Array.isArray(encounter.actions) ? encounter.actions : [];
    if (!actions.length) return [];
    return actions.map(function (action) {
      var effect = String(action && action.effect || 'health');
      var kind = (effect === 'stress' || effect === 'condition') ? 'directStress' : 'defendCheck';
      var dd = Number(action && action.dreadDie || 8);
      return {
        name: String(action && action.name || 'Boss Pattern'),
        desc: String(action && action.text || ''),
        kind: kind,
        dreadDie: dd,
        stat: String(action && action.stat || 'Strike'),
        vsDefend: !!(action && action.vsDefend),
        damage: String(action && action.damage || 'dd'),
        condition: String(action && action.condition || ''),
        injures: !!(action && action.injures),
        zoneHazard: (action && action.zoneHazard) ? action.zoneHazard : null,
        selfHeal: Number(action && action.selfHeal || 0),
        tmwDefend: Number(action && action.tmwDefend || 3),
        ranges: Array.isArray(action && action.ranges) ? action.ranges.map(function (r) { return r.toLowerCase(); }) : ['engaged'],
        raidBoss: true
      };
    });
  }

  function pickLegacyRaidBossActionForZone(mission, encounter) {
    var actions = Array.isArray(encounter && encounter.actions) ? encounter.actions : [];
    if (!actions.length) return null;
    var zoneOrder = ['Engaged', 'Close', 'Nearby', 'Far'];
    var closestZone = 'Engaged';
    if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.units)) {
      for (var zi = 0; zi < zoneOrder.length; zi++) {
        var zc = zoneOrder[zi];
        if (S.combatMap.units.some(function (u) { return u.side === 'ally' && u.zone === zc; })) { closestZone = zc; break; }
      }
    }
    var suited = actions.filter(function (a) {
      return !Array.isArray(a.ranges) || a.ranges.length === 4 || a.ranges.indexOf(closestZone) >= 0;
    });
    if (!suited.length) suited = actions;
    return suited[Math.floor(Math.random() * suited.length)];
  }

  function buildBossActionPromptHtml(mission, action, targetZone) {
    var dd = Number(action && action.dreadDie || 8);
    var stat = String(action && action.stat || 'Strike');
    var vsDefend = !!(action && action.vsDefend);
    var bonusStr = String(action && action.damage || 'dd').replace('dd', 'd' + dd);
    var rollLabel = vsDefend
      ? '<strong>' + stat + ' d6</strong> vs Dread <strong>d' + dd + '</strong>'
      : '<strong>Save:</strong> ' + stat + ' d6 must exceed Dread d' + dd;
    var effect = String(action && action.effect || 'health');
    var effectStr = effect === 'health' ? 'HP damage (' + bonusStr + ')' : effect === 'stress' ? 'Mental Stress (' + bonusStr + ')' : effect === 'condition' ? (action.condition || 'Status') + ' condition' : effect === 'zone_hazard' ? 'Zone hazard + damage' : effect === 'self_heal' ? 'Boss heals ' + Number(action.selfHeal || 0) + ' HP' : 'Damage + status';
    var hazardNote = action && action.zoneHazard ? '<div style="margin-top:.1rem;font-size:.67rem;color:var(--red2);"><strong>⚠ Zone Effect:</strong> ' + String(action.zoneHazard.desc || '') + ' (' + Number(action.zoneHazard.rounds || 1) + ' round' + (Number(action.zoneHazard.rounds || 1) !== 1 ? 's' : '') + ')</div>' : '';
    var condNote = (action && action.condition) ? '<div style="font-size:.67rem;color:var(--gold2);">Condition on hit: <strong>' + action.condition + '</strong>' + (action.injures ? ' · Personal Flavor disabled' : '') + '</div>' : (action && action.injures ? '<div style="font-size:.67rem;color:var(--gold2);">Injury → Personal Flavor disabled</div>' : '');
    var tmwCost = Number(action && action.tmwDefend || 3);
    var tmwPool = getLegacyRaidTeamworkPool();
    var canPrevent = tmwPool >= tmwCost;
    var bossName = String(mission.legacyRaidBoss || 'Boss');
    return '<div style="border:1px solid rgba(200,50,50,.40);background:rgba(200,50,50,.08);padding:.4rem .46rem;border-radius:4px;">'
      + '<div style="font-size:.78rem;color:var(--red2);font-weight:700;margin-bottom:.1rem;">&#x2694; ' + bossName + ' \u2192 ' + String(action.name || 'Action') + '</div>'
      + '<div style="font-size:.69rem;color:var(--text2);line-height:1.5;margin-bottom:.14rem;">' + String(action.text || '') + '</div>'
      + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Roll:</strong> ' + rollLabel + ' \u00b7 Effect: ' + effectStr + '</div>'
      + '<div style="font-size:.67rem;color:var(--muted2);margin-bottom:.06rem;">Target zone(s): <strong>' + (Array.isArray(action.ranges) ? action.ranges.join(' / ') : 'All') + '</strong> \u00b7 Closest ally: <strong>' + targetZone + '</strong></div>'
      + hazardNote + condNote
      + '<div style="margin-top:.16rem;display:flex;gap:.2rem;flex-wrap:wrap;align-items:center;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.resolveLegacyRaidBossActionEffect(' + mission.id + ',' + tmwCost + ',false)">Resolve Attack</button>'
      + '<button class="btn btn-xs btn-warn" ' + (canPrevent ? '' : 'disabled') + ' onclick="window.resolveLegacyRaidBossActionEffect(' + mission.id + ',' + tmwCost + ',true)">Spend ' + tmwCost + ' TMW: Prevent</button>'
      + '<span style="font-size:.62rem;color:var(--muted2);">Pool: ' + tmwPool + ' TMW</span>'
      + '</div>'
      + '</div>';
  }

  window.triggerLegacyRaidBossAction = function (missionId) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.active) return false;
    if (encounter.turnStage !== 'boss') {
      if (typeof showNotif === 'function') showNotif('Boss can only act after your action and ally actions.', 'warn');
      return false;
    }
    if (Number(encounter.bossActionsLeft || 0) <= 0) encounter.bossActionsLeft = 2;
    if (Number(encounter.bossActionsLeft || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Boss has no actions left this turn.', 'warn');
      return false;
    }
    var action = pickLegacyRaidBossActionForZone(mission, encounter);
    if (!action) return false;
    encounter.currentAction = action;
    encounter.pendingAction = action;
    encounter.lastTelegraph = 'Telegraph: ' + String(action.name || 'Unknown') + ' is winding up.';
    encounter.log.push('Boss triggers: ' + String(action.name || '?') + ' [' + String(action.stat || '?') + ' d' + Number(action.dreadDie || 8) + ' vs Dread]');
    var targetZone = 'Engaged';
    if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.units)) {
      var zoneOrder = ['Engaged','Close','Nearby','Far'];
      for (var zi = 0; zi < zoneOrder.length; zi++) {
        var zc = zoneOrder[zi];
        if (S.combatMap.units.some(function (u) { return u.side === 'ally' && u.zone === zc; })) { targetZone = zc; break; }
      }
    }
    var tmwCost = Number(action && action.tmwDefend || 10);
    var promptHtml = '<div style="font-size:.84rem;color:var(--text2);line-height:1.55;">'
      + '<div style="font-size:.88rem;color:var(--red2);margin-bottom:.16rem;"><strong>The Monster did ' + String(action.name || 'something terrible') + '.</strong></div>'
      + '<div style="margin-bottom:.18rem;">' + String(action.text || '') + '</div>'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.2rem;">Spend ' + tmwCost + ' TMW points to prevent.</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.resolveLegacyRaidBossActionEffect(' + mission.id + ',' + tmwCost + ',false)">Resolve Enemy Action</button>'
      + '<button class="btn btn-xs btn-warn" onclick="window.resolveLegacyRaidBossActionEffect(' + mission.id + ',' + tmwCost + ',true)">Spend ' + tmwCost + ' TMW to Prevent</button>'
      + '</div></div>';
    if (typeof openModal === 'function') openModal('Enemy Action \u2014 ' + String(action.name || 'Boss Strike'), promptHtml);
    else if (typeof showNotif === 'function') showNotif(String(action.name || '') + ': ' + String(action.text || ''), 'warn');
    return true;
  };

  window.resolveLegacyRaidBossActionEffect = function (missionId, tmwCost, spend) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return false;
    var action = encounter.pendingAction || encounter.currentAction;
    if (!action) return false;
    if (typeof closeModal === 'function') closeModal();
    if (spend) {
      var spent = spendLegacyRaidTeamwork(Number(tmwCost || 0), 'Prevent: ' + String(action.name || ''));
      if (!spent) { encounter.log.push('Not enough TMW to prevent ' + String(action.name || '') + '.'); }
      else {
        encounter.prepTags = encounter.prepTags || {};
        encounter.prepTags['tmw-prevent'] = Number(encounter.prepTags['tmw-prevent'] || 0) + 1;
        encounter.bossReaction = 'Boss reacts: hidden attack unlocked next cycle.';
        if (typeof openModal === 'function') {
          openModal('Teamwork Cinematic', '<div style="font-size:.84rem;color:var(--text2);line-height:1.55;">'
            + '<div style="font-size:.88rem;color:var(--teal);margin-bottom:.16rem;"><strong>You prevented ' + String(action.name || 'the action') + '.</strong></div>'
            + '<div>The team pivots in unison, weapon arcs crossing as support calls the beat. The mechanic fails, but the boss mutates its pattern in response.</div>'
            + '<div style="margin-top:.14rem;color:var(--gold2);">Boss reacts: hidden attack unlocked.</div>'
            + '</div>');
        }
        encounter.pendingAction = null;
        encounter.log.push('TMW burst: ' + tmwCost + ' spent \u2014 ' + String(action.name || '') + ' prevented.');
        encounter.bossActionsLeft = Math.max(0, Number(encounter.bossActionsLeft || 0) - 1);
        if (Number(encounter.bossActionsLeft || 0) > 0) {
          encounter.turnStage = 'boss';
          if (typeof showNotif === 'function') showNotif('Boss pressure persists. One action remains.', 'warn');
        } else {
          advanceLegacyRaidBossToNextPlayerTurn(mission, encounter);
          encounter.log.push('Boss turn ended. New player round begins.');
          if (typeof showNotif === 'function') showNotif('Boss turn ended. Your next round is ready.', 'good');
        }
        openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
        return true;
      }
    }
    var roll = function (sides) { return Math.floor(Math.random() * Math.max(1, Number(sides || 6))) + 1; };
    var dd = Number(action.dreadDie || 8);
    var bonusRoll = 0;
    var dmgStr = String(action.damage || 'dd');
    if (dmgStr.indexOf('+d') >= 0) { bonusRoll = roll(parseInt(dmgStr.split('+d')[1] || '4', 10)); }
    var effect = String(action.effect || 'health');
    var getPlayerDefendDie = function () {
      return Math.max(4, Number(typeof getEffectiveDie === 'function' ? (getEffectiveDie('defend') || getEffectiveDie('adventure') || 8) : 8));
    };
    var allyTargets = [];
    if (!encounter.partyHp || typeof encounter.partyHp !== 'object') encounter.partyHp = { allies: {} };
    if (!encounter.partyHp.allies || typeof encounter.partyHp.allies !== 'object') encounter.partyHp.allies = {};
    if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.units)) {
      allyTargets = S.combatMap.units.filter(function (u) { return u && u.side === 'ally' && !u.isPlayer; }).map(function (u) {
        return String(u.name || 'Ally');
      });
    }
    if (!allyTargets.length) {
      allyTargets = getRaidWayfarersForWing(mission, 3)
        .filter(function (wf) { return wf && wf.status !== 'failed'; })
        .map(function (wf) { return String(wf.name || 'Wayfarer'); });
    }
    var targets = [];
    if (action.raidwide) {
      targets.push({ type: 'player', name: String(typeof S !== 'undefined' && S && S.name || 'Wayfarer') });
      allyTargets.forEach(function (name) { targets.push({ type: 'ally', name: name }); });
    } else if (allyTargets.length) {
      targets.push({ type: 'ally', name: allyTargets[0] });
    } else {
      targets.push({ type: 'player', name: String(typeof S !== 'undefined' && S && S.name || 'Wayfarer') });
    }
    encounter.log.push(String(action.name || '') + ': resolving against ' + (action.raidwide ? 'all combatants' : (targets[0] && targets[0].name || 'closest target')) + '.');
    if (action.zoneHazard) applyLegacyRaidZoneHazard(mission, action.zoneHazard);
    if (action.condition) encounter.log.push('Condition: ' + action.condition + ' applied.');
    if (action.injures) encounter.log.push('Injury: Personal Flavor actions disabled until cleansed.');
    if (effect === 'self_heal' && action.selfHeal) {
      encounter.phaseHp = Number(encounter.phaseHp || 0) + Number(action.selfHeal || 0);
      if (typeof S !== 'undefined' && S && Array.isArray(S.enemies) && S.enemies[0]) S.enemies[0].health = Math.max(0, Number(S.enemies[0].health || 0) + Number(action.selfHeal || 0));
      encounter.log.push('Boss healed ' + action.selfHeal + ' HP.');
    }
    targets.forEach(function (target) {
      var dreadRoll = roll(dd);
      var defendRoll = target.type === 'player' ? roll(getPlayerDefendDie()) : roll(6);
      var diff = Math.max(0, dreadRoll - defendRoll);
      var totalDmg = (dmgStr === '0' || effect === 'self_heal') ? 0 : (diff + bonusRoll);
      if ((effect === 'health' || effect === 'multi') && totalDmg > 0) {
        if (target.type === 'player') {
          if (typeof S !== 'undefined' && S) S.health = Math.max(0, Number(S.health || 0) - totalDmg);
        } else {
          if (typeof encounter.partyHp.allies[target.name] !== 'number') encounter.partyHp.allies[target.name] = 12;
          encounter.partyHp.allies[target.name] = Math.max(0, Number(encounter.partyHp.allies[target.name]) - totalDmg);
        }
        encounter.log.push(target.name + ' defend ' + defendRoll + ' vs dread ' + dreadRoll + ': takes ' + totalDmg + ' HP.');
      }
      if ((effect === 'stress' || effect === 'multi') && diff > 0) {
        if (target.type === 'player' && typeof S !== 'undefined' && S) {
          S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + diff);
        }
        encounter.log.push(target.name + ' suffers ' + diff + ' mental pressure.');
      }
    });
    encounter.pendingAction = null;
    encounter.bossActionsLeft = Math.max(0, Number(encounter.bossActionsLeft || 0) - 1);
    if (Number(encounter.bossActionsLeft || 0) > 0) {
      encounter.turnStage = 'boss';
      if (typeof showNotif === 'function') showNotif('Boss prepares a second action.', 'warn');
    } else {
      advanceLegacyRaidBossToNextPlayerTurn(mission, encounter);
      encounter.log.push('Boss turn resolved. New player round begins.');
      if (typeof showNotif === 'function') showNotif('Boss turn resolved. Your next round is ready.', 'good');
    }
    tickLegacyRaidZoneHazards(mission);
    if (typeof renderEnemies === 'function') renderEnemies();
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };
  function seedLegacyRaidBossCombatScene(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    if (mission.legacyRaidCombatSeeded) return true;
    if (typeof S === 'undefined' || !S) return false;
    var profile = getLegacyRaidProfile(mission);
    var pressure = Math.max(0, Number(profile.actionPressureBonus || 0));
    var bossName = String(mission.legacyRaidBoss || 'Raid Boss');
    var dd = Math.max(4, Math.min(20, Number(mission.dread || 8) + pressure));
    var hp = Math.max(12, dd * 3 + Math.max(0, Number(profile.bossHpPhases || 3)) * 2);

    S.combat = S.combat || {};
    S.combat.enemyDread = dd;
    S.combat.customEnemyActionEvents = buildLegacyRaidCombatEnemyEvents(mission);
    S.combat.customEnemyActionSource = 'Raid Boss: ' + bossName;
    S.combat.customEnemyActionCadence = Math.max(1, Number(profile.bossActionCadence || 1));
    S.enemies = [
      {
        id: Date.now(),
        name: bossName,
        dread: dd,
        stress: 0,
        maxStress: hp,
        health: hp,
        conditions: []
      }
    ];
    // Seed the shared combatMap so Combat Tab and Raid boss panel show the same zone layout.
    // Boss starts Engaged; player and traveling allies start Close/Nearby so spacing matters.
    if (!S.combatMap || typeof S.combatMap !== 'object') S.combatMap = { units: [] };
    if (!Array.isArray(S.combatMap.units)) S.combatMap.units = [];
    var playerName = String(S.name || 'Wayfarer');
    // Clear previous raid-seeded units and any pre-existing player/boss duplicates.
    S.combatMap.units = S.combatMap.units.filter(function (u) {
      if (!u) return false;
      if (u.raidSeed) return false;
      if (u.isPlayer) return false;
      if (String(u.name || '') === playerName) return false;
      if (u.side === 'enemy' && String(u.name || '') === bossName) return false;
      return true;
    });
    var unitId = Date.now();
    S.combatMap.units.push({ id: unitId++, name: playerName, side: 'ally', zone: 'Engaged', isPlayer: true, raidSeed: true });
    var allies = getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; });
    var allyZones = ['Close', 'Close', 'Nearby'];
    allies.slice(0, 3).forEach(function (wf, i) {
      S.combatMap.units.push({ id: unitId++, name: String(wf.name || ('Ally ' + (i + 1))), side: 'ally', zone: allyZones[i] || 'Nearby', raidSeed: true });
    });
    S.combatMap.units.push({ id: unitId++, name: bossName, side: 'enemy', zone: 'Engaged', raidSeed: true });
    if (typeof renderCombatMap === 'function') renderCombatMap();
    mission.legacyRaidCombatSeeded = true;
    if (typeof startCombat === 'function') startCombat();
    if (typeof renderEnemies === 'function') renderEnemies();
    if (typeof showNotif === 'function') showNotif('Boss combat seeded in Combat tab with raid-specific enemy actions.', 'warn');
    return true;
  }

  function rotateLegacyRaidBossAction(mission) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !Array.isArray(encounter.actions) || !encounter.actions.length) return;
    var next = Math.floor(Math.random() * encounter.actions.length);
    encounter.currentAction = encounter.actions[next];
  }

  function buildRaidRoomDescription(theme, wingNum, room, bossName) {
    var roomType = room && room.type ? room.type : 'Hazard';
    var enemyCount = Math.max(1, Number(room && room.enemyCount || 1));
    var descFrag = theme.desc[Math.floor(Math.random() * theme.desc.length)];
    var wingCtx = wingNum === 1 ? 'The lore wing reeks of' : wingNum === 2 ? 'Mechanisms hum behind walls of' : 'The air thickens before the chamber of';
    var mission = arguments.length > 4 ? arguments[4] : null;
    var loreFragment = mission ? buildLegacyRaidLoreFragment(mission) : 'A fragment explaining why the boss matters to the route.';
    var puzzleHook = mission && mission.legacyRaidPuzzle ? String(mission.legacyRaidPuzzle) : 'A hard logic gate blocks the route.';
    var byType = {
      Entry:        wingCtx + ' ' + descFrag + '. The entrance threshold is passable but nothing beyond is mapped.',
      Hazard:       'A collapsed section blocks the direct path. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + ' create shifting footholds — patience and coordination are required to cross.',
      Peril:        'A lethal pressure field saturates this room. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + '. One misread movement causes raidwide strain spikes.',
      Combat:       'Enemy contact confirmed: ' + enemyCount + ' hostiles are entrenched in defensive angles. Break them before they call reinforcements into adjacent rooms.',
      Trap:         'Mechanical killswitch lanes are active across this chamber. You must disable triggers while maintaining forward pressure.',
      Gambling:     'The gatekeepers demand a wager game: win the table to gain passage. Lose too many hands and the raid takes pressure damage before being thrown back.',
      Loot:         'Merchant contraband is buried in this sector. Cracking this stash rolls direct loot from the Merchant tables and can swing the whole raid economy.',
      LoreReading:  'A fragment archive is embedded in the far wall. Assign one player to read the telegraphs while the rest hold against pressure. Preview: ' + loreFragment,
      Puzzle:       'Three interlocked mechanisms control the passage seals. Expect cryptograms, mazes, constellation logic, or balance puzzles. Door hook: ' + puzzleHook,
      WayfarerPost: 'Three Traveling Wayfarers hold this staging area. They can deploy ahead into the next room, covering a pressure lane or absorbing a hazard. If any Wayfarer fails, they\'re lost for the raid.',
      TrophyCache:  'A sealed alcove holds pre-raid spoils. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + '. Clearing this room does not automatically unlock the next wing — it grants advantage.',
      Approach:     bossName + '\'s influence already warps the space here. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + '. Positioning and role assignments must be confirmed before moving to the Chamber.',
      Confrontation:'The boss chamber. ' + (bossName || 'The boss') + ' fills the space with pattern, movement, and pressure. Each phase shift requires repositioning. The Wayfarers hold the flanks — if they fall, you hold alone.'
    };
    return byType[roomType] || (wingCtx + ' ' + descFrag + '.');
  }

  function generateRaidHexMapWing(mission, wingNum) {
    var theme = getRaidTheme(mission);
    var templates = buildRaidWingTemplates(wingNum);
    var bossName = String(mission.legacyRaidBoss || 'the Boss');
    return templates.map(function (tpl, idx) {
      var needed = getRaidRoomProgressNeeded(tpl.type, mission);
      var wingDdBase = Number(tpl.dd || 0) + (wingNum === 2 ? 2 : 0);
      return {
        idx:         idx,
        type:        tpl.type,
        icon:        tpl.icon,
        label:       tpl.label,
        dd:          getLegacyRaidRoomDd(mission, tpl.type, wingDdBase),
        progress:    0,
        progressNeeded: needed,
        failures:    0,
        isBoss:      !!tpl.isBoss,
        hasWayfarer: !!tpl.hasWayfarer,
        discovered:  idx === 0,
        frontier:    idx === 1,
        cleared:     false,
        enemyCount:  Math.max(1, Number(tpl.enemyCount || 1)),
        description: buildRaidRoomDescription(theme, wingNum, tpl, bossName, mission),
        result:      ''
      };
    });
  }

  function reconcileLegacyRaidWingStepProgress(mission) {
    if (!mission || mission.missionType !== 'legacy_raid' || !mission.steps || !mission.raidHexMap || !mission.raidHexMap.wings) return;
    var wing1 = mission.raidHexMap.wings[1] || [];
    var wing2 = mission.raidHexMap.wings[2] || [];
    var wing1Done = wing1.length > 0 && wing1.every(function (r) { return !!r.cleared; });
    var wing2Done = wing2.length > 0 && wing2.every(function (r) { return !!r.cleared; });
    var grid = mission.legacyRaidWingGrid || {};
    var wing1Grid = grid['1'];
    var wing2Grid = grid['2'];
    var wing1Obj = wing1Grid && wing1Grid.objectives ? wing1Grid.objectives : null;
    var wing2Obj = wing2Grid && wing2Grid.objectives ? wing2Grid.objectives : null;
    var wing1GridDone = !!(wing1Obj && Number(wing1Obj.loreCollected || 0) >= Number(wing1Obj.loreRequired || 3));
    var wing2GridDone = !!(wing2Obj && Number(wing2Obj.waypointsActivated || 0) >= Number(wing2Obj.waypointsRequired || 3));
    mission.steps[1] = mission.steps[1] || {};
    mission.steps[2] = mission.steps[2] || {};
    mission.steps[3] = mission.steps[3] || {};
    mission.steps[1].completed = !!(mission.steps[1].completed || wing1Done || wing1GridDone);
    mission.steps[2].completed = !!(mission.steps[2].completed || wing2Done || wing2GridDone);
    if (!(mission.steps[2].completed || wing2Done || wing2GridDone)) mission.steps[3].completed = false;
  }

  function ensureRaidHexMap(mission) {
    if (!mission) return null;
    if (!mission.raidHexMap) mission.raidHexMap = { wings: {} };
    var map = mission.raidHexMap;
    if (!map.wings) map.wings = {};
    for (var w = 1; w <= 3; w++) {
      if (!Array.isArray(map.wings[w])) {
        map.wings[w] = generateRaidHexMapWing(mission, w);
      }
    }
    reconcileLegacyRaidWingStepProgress(mission);
    return map;
  }

  function ensureLegacyRaidLootVault(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return null;
    if (!run.raidVault || typeof run.raidVault !== 'object') {
      run.raidVault = {
        loot: [],
        keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      };
    }
    if (!Array.isArray(run.raidVault.loot)) run.raidVault.loot = [];
    if (!run.raidVault.keys || typeof run.raidVault.keys !== 'object') {
      run.raidVault.keys = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    }
    ['bronze', 'silver', 'gold', 'platinum'].forEach(function (k) {
      run.raidVault.keys[k] = Math.max(0, Number(run.raidVault.keys[k] || 0));
    });
    return run.raidVault;
  }

  function getLegacyRaidTeleportTheme(mission) {
    var boss = String(mission && mission.legacyRaidBoss || '').toLowerCase();
    if (/sea|tide|leviathan|kraken|brine|undertow/.test(boss)) return { label: 'Tide Rift', icon: '🌀' };
    if (/void|null|rail|executor|harvester|oracle|vault/.test(boss)) return { label: 'Void Gate', icon: '✶' };
    if (/dragon|wyrm|hydra|basilisk|behemoth|ash/.test(boss)) return { label: 'Rift Flame', icon: '🔥' };
    return { label: 'Ancient Gate', icon: '◇' };
  }

  function getLegacyRaidWingEncounterPool(wingNum) {
    if (Number(wingNum || 1) === 1) {
      return ['puzzle', 'puzzle', 'hazard', 'peril', 'barrier', 'enemy', 'loot', 'teleport', 'rest'];
    }
    return ['enemy', 'enemy', 'puzzle', 'hazard', 'peril', 'barrier', 'loot', 'teleport', 'rest'];
  }

  function getLegacyRaidPendingHexCombat() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.activeMissions)) return null;
    for (var i = 0; i < S.activeMissions.length; i++) {
      var mission = S.activeMissions[i];
      if (!mission || mission.missionType !== 'legacy_raid' || !mission.legacyRaidWingGrid) continue;
      var keys = Object.keys(mission.legacyRaidWingGrid);
      for (var j = 0; j < keys.length; j++) {
        var wing = mission.legacyRaidWingGrid[keys[j]];
        if (wing && wing.pendingCombat && wing.pendingCombat.active) {
          return { mission: mission, wingKey: keys[j], state: wing, pending: wing.pendingCombat };
        }
      }
    }
    return null;
  }

  function ensureLegacyRaidCombatEndHook() {
    if (typeof window === 'undefined' || window.__legacyRaidCombatEndHookInstalled) return;
    if (typeof window.endCombat !== 'function') return;
    window.__legacyRaidCombatEndHookInstalled = true;
    var baseEndCombat = window.endCombat;
    window.endCombat = function () {
      var pendingCtxBeforeEnd = getLegacyRaidPendingHexCombat();
      var preEnemies = 0;
      if (typeof S !== 'undefined' && S && Array.isArray(S.enemies)) {
        preEnemies = S.enemies.filter(function (e) { return e && !e.ally; }).length;
      }
      var out = baseEndCombat.apply(this, arguments);
      var pendingCtx = getLegacyRaidPendingHexCombat() || pendingCtxBeforeEnd;
      if (pendingCtx && typeof window.finalizeLegacyRaidHexCombatOutcome === 'function') {
        var remaining = 0;
        if (typeof S !== 'undefined' && S && Array.isArray(S.enemies)) {
          remaining = S.enemies.filter(function (e) { return e && !e.ally; }).length;
        }
        var health = typeof S !== 'undefined' && S ? Number(S.health || 0) : 1;
        var outcome = remaining <= 0 ? 'win' : (health <= 0 ? 'wipe' : 'retreat');
        try { window.finalizeLegacyRaidHexCombatOutcome(outcome); } catch (_err) {}
      }
      return out;
    };
  }

  function getLegacyRaidHexDreadDie(wingNum, eventType) {
    var wing = Math.max(1, Number(wingNum || 1));
    if (eventType === 'enemy') {
      if (wing <= 1) return 4;
      if (wing === 2) return 6;
      return 8;
    }
    if (wing <= 1) return 6;
    if (wing === 2) return 8;
    return 10;
  }

  function getLegacyRaidHexMechanicSummary(wingNum, cell) {
    if (!cell) return '';
    var w = Math.max(1, Number(wingNum || 1));
    var et = String(cell.eventType || '');
    var dd = getLegacyRaidHexDreadDie(w, et);
    var cleared = cell.cleared ? ' <span style="color:var(--green2);">[Cleared]</span>' : '';
    var rested = cell.rested ? ' <span style="color:var(--green2);">[Rested]</span>' : '';
    var loreDone = cell.loreCollected ? ' <span style="color:var(--gold2);">[Fragment Secured]</span>' : '';
    if (cell.isStart) return '<span style="color:var(--muted2);">Entrance hex — no encounter. Begin from here.</span>';
    if (cell.isExit) return '<span style="color:var(--muted2);">Exit hex — complete objectives then pass through to advance.</span>';
    var rows = {
      puzzle:  '🔏 <b>Puzzle:</b> Shared puzzle challenge (sudoku / maze / crossword / lock sequence families) · fail = +1 Teamwork, Mental Stress by roll difference, −1 Tick' + loreDone,
      peril:   '⚡ <b>Peril:</b> Defend vs Dread d' + dd + ' · fail = +1 Teamwork, HP damage by difference, −1 Tick' + cleared,
      hazard:  '🌫 <b>Hazard:</b> Mind vs Dread d' + dd + ' · fail = +1 Teamwork, Mental Stress by difference, −1 Tick' + cleared,
      barrier: '🚧 <b>Barrier:</b> Body vs Dread d' + dd + ' · fail = +1 Teamwork, random Condition, −1 Tick' + cleared,
      enemy:   '⚔️ <b>Enemy:</b> Combat (' + (w === 1 ? '1–4' : '2–8') + ' hostiles) · win = hex cleared' + cleared,
      loot:    '💰 <b>Loot:</b> Adventure vs Dread d' + dd + ' · success = Merchant loot + random key (Bronze/Silver/Gold/Platinum) vaulted until boss kill' + cleared,
      teleport:'🌀 <b>Teleport:</b> Instant warp to linked hex on entry · no roll required',
      rest:    '🛌 <b>Rest:</b> Enter to restore <b>+2 Ticks</b> (once per wing)' + rested
    };
    var summary = rows[et] || ('<i style="color:var(--muted3);">Empty corridor — no encounter.</i>');
    if (cell.lorePiece && et !== 'puzzle') summary += ' <span style="color:var(--gold2);">· Lore Fragment here' + loreDone + '</span>';
    if (cell.waypoint) summary += ' <span style="color:#8be;">· Door Waypoint</span>';
    return summary;
  }

  function buildLegacyRaidVaultCardHtml(mission) {
    var vault = ensureLegacyRaidLootVault(mission);
    if (!vault) return '';
    var loot = Array.isArray(vault.loot) ? vault.loot : [];
    if (loot.length === 0) return '';
    var displayCount = Math.min(20, loot.length);
    var lootRows = loot.slice(-displayCount).map(function (item, idx) {
          return '<div style="font-size:.62rem;color:var(--text2);line-height:1.42;padding:.04rem 0;">'
            + (loot.length - displayCount + idx + 1) + '.' + (loot.length > 99 ? '' : '')
            + ' ' + String(item || 'Unknown Loot') + '</div>';
        }).join('');
    var moreText = loot.length > displayCount ? ' <span style="color:var(--muted3);">(+' + (loot.length - displayCount) + ' more)</span>' : '';
    return '<div style="border:1px solid var(--border2);padding:.24rem .28rem;background:rgba(255,255,255,.03);font-size:.66rem;color:var(--muted2);">'
      + '<div style="font-size:.69rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Vaulted Items</strong></div>'
      + '<div style="margin-bottom:.08rem;font-size:.62rem;">Recent: ' + displayCount + ' / ' + loot.length + moreText + '</div>'
      + lootRows
      + '</div>';
  }

  function getLegacyRaidKeyDrop() {
    var r = Math.random();
    if (r < 0.35) return 'bronze';
    if (r < 0.55) return 'silver';
    if (r < 0.67) return 'gold';
    return 'platinum';
  }

  function getLegacyRaidKeyItemLabel(tier, count) {
    var title = String(tier || 'bronze').charAt(0).toUpperCase() + String(tier || 'bronze').slice(1);
    return title + ' Key ' + Math.max(1, Number(count || 1));
  }

  function getLegacyRaidHexPuzzleSource(mission, wingNum, cell) {
    var region = String(mission && (mission.region || mission.legacyRaidRegion) || 'province').toLowerCase();
    var allowed = ['province', 'sea', 'galaxy', 'planet', 'wtw', 'task', 'event'];
    var pool = allowed.slice();
    if (pool.indexOf(region) >= 0) {
      pool.splice(pool.indexOf(region), 1);
      pool.unshift(region);
    }
    var seed = String(mission && mission.id || 0) + '|' + String(wingNum || 1) + '|' + String(cell && cell.id || '0');
    var idx = getLegacyRaidStableIndex(seed, pool.length);
    return pool[idx] || 'event';
  }

  function getLegacyRaidStableIndex(seedText, max) {
    var str = String(seedText || 'raid');
    var n = Math.max(1, Number(max || 1));
    var h = 0;
    for (var i = 0; i < str.length; i++) h = ((h * 33) + str.charCodeAt(i)) >>> 0;
    return Math.abs(h) % n;
  }

  function pickUniqueLegacyRaidLoreTemplate(mission, type, list, seedText) {
    if (!mission) return list[0] || null;
    mission.legacyRaidLorePuzzleUsed = mission.legacyRaidLorePuzzleUsed || { crossword: {}, sudoku: {} };
    mission.legacyRaidLorePuzzleUsed[type] = mission.legacyRaidLorePuzzleUsed[type] || {};
    var used = mission.legacyRaidLorePuzzleUsed[type];
    var available = [];
    for (var i = 0; i < list.length; i++) {
      if (!used[i]) available.push(i);
    }
    if (!available.length) {
      mission.legacyRaidLorePuzzleUsed[type] = {};
      used = mission.legacyRaidLorePuzzleUsed[type];
      for (var j = 0; j < list.length; j++) available.push(j);
    }
    var idx = available[getLegacyRaidStableIndex(seedText, available.length)] || 0;
    used[idx] = true;
    return list[idx] || list[0] || null;
  }

  function createLegacyRaidLoreCrosswordConfig(mission, wingNum, cell) {
    var sets = [
      {
        clues: [
          { clue: 'Across: Undead wizard villain (4)', answer: 'lich', direction: 'across' },
          { clue: 'Across: Ancient magical artifact (5)', answer: 'relic', direction: 'across' },
          { clue: 'Across: Magic cast by a wizard (5)', answer: 'spell', direction: 'across' },
          { clue: 'Across: Sneaky dagger-user (5)', answer: 'rogue', direction: 'across' },
          { clue: 'Down: Person running the campaign (2)', answer: 'dm', direction: 'down' },
          { clue: 'Down: Adventure setting location (4)', answer: 'lore', direction: 'down' },
          { clue: 'Down: Character morality system (5)', answer: 'align', direction: 'down' },
          { clue: 'Down: Arcane casting class (3)', answer: 'arc', direction: 'down' }
        ]
      }
    ];
    var seed = String(mission && mission.id || 0) + '|cw|' + String(wingNum || 1) + '|' + String(cell && cell.id || '0');
    var picked = pickUniqueLegacyRaidLoreTemplate(mission, 'crossword', sets, seed) || sets[0];
    return { clues: Array.isArray(picked.clues) ? picked.clues.slice() : [] };
  }

  function createLegacyRaidLoreSudokuConfig(mission, wingNum, cell) {
    var sets = [
      {
        puzzle: [['1', '', '3', '4'], ['3', '4', '1', '2'], ['2', '1', '4', '3'], ['4', '3', '2', '1']],
        solution: [['1', '2', '3', '4'], ['3', '4', '1', '2'], ['2', '1', '4', '3'], ['4', '3', '2', '1']]
      },
      {
        puzzle: [['', '2', '3', '4'], ['3', '', '1', '2'], ['2', '1', '', '3'], ['4', '3', '2', '']],
        solution: [['1', '2', '3', '4'], ['3', '4', '1', '2'], ['2', '1', '4', '3'], ['4', '3', '2', '1']]
      },
      {
        puzzle: [['1', '2', '', '4'], ['', '4', '1', '2'], ['2', '', '4', '3'], ['4', '3', '2', '1']],
        solution: [['1', '2', '3', '4'], ['3', '4', '1', '2'], ['2', '1', '4', '3'], ['4', '3', '2', '1']]
      },
      {
        puzzle: [['1', '2', '3', ''], ['3', '4', '', '2'], ['', '1', '4', '3'], ['4', '', '2', '1']],
        solution: [['1', '2', '3', '4'], ['3', '4', '1', '2'], ['2', '1', '4', '3'], ['4', '3', '2', '1']]
      }
    ];
    var seed = String(mission && mission.id || 0) + '|sdk|' + String(wingNum || 1) + '|' + String(cell && cell.id || '0');
    var picked = pickUniqueLegacyRaidLoreTemplate(mission, 'sudoku', sets, seed) || sets[0];
    return {
      sudokuPuzzle: Array.isArray(picked.puzzle) ? picked.puzzle.map(function (row) { return row.slice(); }) : [],
      sudokuSolution: Array.isArray(picked.solution) ? picked.solution.map(function (row) { return row.slice(); }) : []
    };
  }

  function getLegacyRaidHexEncounterLabel(mission, wingNum, eventType, cellId) {
    var theme = getRaidTheme(mission);
    var key = String(theme && theme.key || 'default');
    var catalog = {
      puzzle: ['Cipher Lock', 'Rune Lattice', 'Signal Equation', 'Mirror Dial'],
      peril: ['Kill Corridor', 'Pressure Sink', 'Collapse Sweep', 'Death Drift'],
      hazard: ['Broken Causeway', 'Shard Field', 'Flooded Trench', 'Ash Channel'],
      barrier: ['Seal Gate', 'Breach Door', 'Ward Wall', 'Titan Portcullis'],
      enemy: ['Raid Patrol', 'Boss Vanguard', 'Sentinel Pack', 'Kill Team'],
      loot: ['Hidden Cache', 'Merchant Spill', 'Smuggler Vault', 'Relic Lockbox'],
      teleport: ['Phase Gate', 'Rift Step', 'Anchor Portal', 'Transit Sigil'],
      rest: ['Forward Camp', 'Safe Room', 'Watch Post', 'Recovery Alcove']
    };
    if (key === 'sea' && eventType === 'teleport') catalog.teleport = ['Tide Rift', 'Brine Gate', 'Current Leap', 'Abyss Hop'];
    if (key === 'fire' && eventType === 'teleport') catalog.teleport = ['Cinder Gate', 'Ember Rift', 'Pyre Step', 'Ash Leap'];
    if (key === 'void' && eventType === 'teleport') catalog.teleport = ['Null Gate', 'Void Cut', 'Phase Tear', 'Static Rift'];
    var list = catalog[eventType] || ['Unknown Chamber'];
    return list[getLegacyRaidStableIndex(String(mission && mission.id || 0) + '|' + String(wingNum || 1) + '|' + String(cellId || '') + '|' + String(eventType || ''), list.length)];
  }

  function applyLegacyRaidHexIdentity(mission, wingNum, state) {
    if (!state || !state.cells) return;
    Object.keys(state.cells).forEach(function (id) {
      var cell = state.cells[id];
      if (!cell) return;
      if (cell.isStart) {
        cell.encounterLabel = 'Entrance';
        cell.roomDescription = 'Raid entrance point. Press Deeper to push into the wing.';
        return;
      }
      if (cell.isExit) {
        cell.encounterLabel = 'Exit';
        cell.roomDescription = 'Wing exit. Reach this point with objectives complete to advance.';
        return;
      }
      cell.encounterLabel = getLegacyRaidHexEncounterLabel(mission, wingNum, cell.eventType, cell.id);
      if (!cell.roomDescription) {
        cell.roomDescription = buildLegacyRaidHexDescription(mission, wingNum, cell.eventType, null);
      }
    });
  }

  function ensureLegacyRaidWingGridState(mission, wingNum) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (Number(wingNum || 1) >= 3) return null;
    if (!mission.legacyRaidWingGrid || typeof mission.legacyRaidWingGrid !== 'object') mission.legacyRaidWingGrid = {};
    var key = String(wingNum);
    if (mission.legacyRaidWingGrid[key] && mission.legacyRaidWingGrid[key].size === 12) {
      var existing = mission.legacyRaidWingGrid[key];
      var cap = getLegacyRaidTickCap();
      existing.ticks = Math.max(0, Math.min(cap, Number(existing.ticks || cap)));
      return existing;
    }

    var size = 12;
    var start = { x: 0, y: wingNum === 1 ? 5 : 6 };
    var exit = { x: 11, y: wingNum === 1 ? 6 : 5 };
    var cells = {};
    var route = [];
    var x = start.x;
    var y = start.y;
    route.push(x + ',' + y);
    while (x < exit.x) {
      var move = Math.random();
      if (move < 0.18 && y > 1) y -= 1;
      else if (move > 0.82 && y < size - 2) y += 1;
      else x += 1;
      route.push(x + ',' + y);
    }
    while (y !== exit.y) {
      y += y < exit.y ? 1 : -1;
      route.push(x + ',' + y);
    }

    var pathSet = {};
    route.forEach(function (id) { pathSet[id] = true; });

    var branchNodes = [];
    route.forEach(function (id) {
      var parts = id.split(',');
      var bx = Number(parts[0]);
      var by = Number(parts[1]);
      var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      dirs.forEach(function (d) {
        var nx = bx + d[0];
        var ny = by + d[1];
        var nid = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
        if (pathSet[nid]) return;
        if (Math.random() < 0.28) branchNodes.push(nid);
      });
    });

    var pool = getLegacyRaidWingEncounterPool(wingNum);
    var loreNeeded = wingNum === 1 ? 3 : 0;
    var waypointNeeded = wingNum === 2 ? 3 : 0;
    var loreAssigned = 0;
    var waypointAssigned = 0;

    Object.keys(pathSet).concat(branchNodes).forEach(function (id) {
      if (cells[id]) return;
      var parts = id.split(',');
      var cx = Number(parts[0]);
      var cy = Number(parts[1]);
      var isStart = cx === start.x && cy === start.y;
      var isExit = cx === exit.x && cy === exit.y;
      var eventType = 'empty';
      if (!isStart && !isExit) eventType = pool[Math.floor(Math.random() * pool.length)] || 'hazard';
      cells[id] = {
        id: id,
        x: cx,
        y: cy,
        eventType: eventType,
        strictEventType: true,
        isStart: isStart,
        isExit: isExit,
        revealed: !!isStart,
        visited: false,
        cleared: isStart,
        lorePiece: false,
        waypoint: false,
        teleportTo: '',
        lootSeeded: false
      };
    });

    var allIds = Object.keys(cells);
    allIds.forEach(function (id) {
      var cell = cells[id];
      if (!cell || cell.isStart || cell.isExit) return;
      if (wingNum === 1 && cell.eventType === 'puzzle' && loreAssigned < loreNeeded) {
        cell.lorePiece = true;
        loreAssigned += 1;
      }
      if (wingNum === 2 && (cell.eventType === 'barrier' || cell.eventType === 'puzzle') && waypointAssigned < waypointNeeded) {
        cell.waypoint = true;
        waypointAssigned += 1;
      }
    });

    while (loreAssigned < loreNeeded) {
      var lid = allIds[Math.floor(Math.random() * allIds.length)];
      var lcell = cells[lid];
      if (!lcell || lcell.isStart || lcell.isExit || lcell.lorePiece) continue;
      lcell.eventType = 'puzzle';
      lcell.lorePiece = true;
      loreAssigned += 1;
    }
    while (waypointAssigned < waypointNeeded) {
      var wid = allIds[Math.floor(Math.random() * allIds.length)];
      var wcell = cells[wid];
      if (!wcell || wcell.isStart || wcell.isExit || wcell.waypoint) continue;
      wcell.eventType = 'barrier';
      wcell.waypoint = true;
      waypointAssigned += 1;
    }

    var teleports = allIds.map(function (id) { return cells[id]; }).filter(function (cell) {
      return cell && !cell.isStart && !cell.isExit && cell.eventType === 'teleport';
    });
    if (teleports.length < 2) {
      var candidates = allIds.map(function (id) { return cells[id]; }).filter(function (cell) {
        return cell && !cell.isStart && !cell.isExit && cell.eventType !== 'teleport';
      });
      while (teleports.length < 2 && candidates.length) {
        var pickIdx = Math.floor(Math.random() * candidates.length);
        var picked = candidates.splice(pickIdx, 1)[0];
        picked.eventType = 'teleport';
        teleports.push(picked);
      }
    }
    var nonTeleportIds = allIds.filter(function (id) {
      var cell = cells[id];
      return cell && !cell.isStart && !cell.isExit && cell.eventType !== 'teleport';
    });
    for (var ti = 0; ti < teleports.length; ti++) {
      var from = teleports[ti];
      if (!from) continue;
      if (nonTeleportIds.length) {
        from.teleportTo = String(nonTeleportIds[Math.floor(Math.random() * nonTeleportIds.length)] || from.id);
      } else {
        var options = teleports.filter(function (t) { return t && t.id !== from.id; });
        if (!options.length) {
          from.teleportTo = from.id;
          continue;
        }
        var pick = options[Math.floor(Math.random() * options.length)];
        from.teleportTo = pick.id;
      }
    }

    var state = {
      size: size,
      wing: Number(wingNum || 1),
      startId: start.x + ',' + start.y,
      exitId: exit.x + ',' + exit.y,
      currentId: start.x + ',' + start.y,
      selectedId: start.x + ',' + start.y,
      ticks: getLegacyRaidTickCap(),
      cells: cells,
      pathIds: Object.keys(pathSet),
      objectives: {
        loreCollected: 0,
        loreRequired: loreNeeded,
        waypointsActivated: 0,
        waypointsRequired: waypointNeeded
      },
      teleportTheme: getLegacyRaidTeleportTheme(mission),
      lastLog: 'Wing map initialized.',
      pendingCombat: null
    };

    applyLegacyRaidHexIdentity(mission, wingNum, state);

    var startCell = state.cells[state.startId];
    if (startCell && Number(wingNum || 1) > 2) {
      var neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
      neighbors.forEach(function (d) {
        var nid = (startCell.x + d[0]) + ',' + (startCell.y + d[1]);
        if (state.cells[nid]) state.cells[nid].revealed = true;
      });
    }

    mission.legacyRaidWingGrid[key] = state;
    return state;
  }

  function getLegacyRaidGridNeighbors(state, cellId) {
    if (!state || !state.cells || !state.cells[cellId]) return [];
    var cell = state.cells[cellId];
    var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    return dirs.map(function (d) {
      return (cell.x + d[0]) + ',' + (cell.y + d[1]);
    }).filter(function (id) { return !!state.cells[id]; });
  }

  function revealLegacyRaidGridAround(state, cellId) {
    if (!state || !state.cells || !state.cells[cellId]) return;
    state.cells[cellId].revealed = true;
    getLegacyRaidGridNeighbors(state, cellId).forEach(function (nid) {
      state.cells[nid].revealed = true;
    });
  }

  function getLegacyRaidCheckDieForStat(statKey) {
    var key = String(statKey || 'adventure').toLowerCase();
    if (typeof getEffectiveDie === 'function') {
      if (key === 'mind') return Math.max(4, Number(getEffectiveDie('mind') || getEffectiveDie('adventure') || 8));
      if (key === 'body') return Math.max(4, Number(getEffectiveDie('body') || getEffectiveDie('adventure') || 8));
      if (key === 'defend') return Math.max(4, Number(getEffectiveDie('defend') || getEffectiveDie('adventure') || 8));
      return Math.max(4, Number(getEffectiveDie('adventure') || 8));
    }
    return Math.max(4, Number(typeof getStat === 'function' ? getStat('adventure') : 8) || 8);
  }

  function resolveLegacyRaidHexContest(statKey, dreadDie) {
    var ad = getLegacyRaidCheckDieForStat(statKey);
    var dd = Math.max(4, Number(dreadDie || 6));
    var aRoll = typeof roll === 'function' ? roll(ad) : (Math.floor(Math.random() * ad) + 1);
    var dRoll = typeof roll === 'function' ? roll(dd) : (Math.floor(Math.random() * dd) + 1);
    return {
      success: Number(aRoll || 0) >= Number(dRoll || 0),
      diff: Math.max(0, Number(dRoll || 0) - Number(aRoll || 0)),
      actionDie: ad,
      dreadDie: dd,
      actionRoll: Number(aRoll || 0),
      dreadRoll: Number(dRoll || 0)
    };
  }

  function buildLegacyRaidWingGridHtml(mission, wingNum, state) {
    if (!state || !state.cells) return '';
    var size = Math.max(1, Number(state.size || 12));
    var gridCells = [];
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var id = x + ',' + y;
        var cell = state.cells[id];
        if (!cell) {
          gridCells.push('<div style="min-height:22px;border:1px solid transparent;"></div>');
          continue;
        }
        var isCurrent = String(state.currentId || '') === id;
        var isSelected = String(state.selectedId || '') === id;
        var reveal = !!cell.revealed;
        var icon = '?';
        if (cell.isStart) icon = 'S';
        else if (cell.isExit) icon = 'E';
        else if (!reveal) icon = '?';
        else if (cell.cleared) {
          if (cell.eventType === 'puzzle') icon = '🧩';
          else if (cell.eventType === 'peril') icon = '☠';
          else if (cell.eventType === 'hazard') icon = '⚠';
          else if (cell.eventType === 'barrier') icon = '⛔';
          else if (cell.eventType === 'enemy') icon = '⚔';
          else if (cell.eventType === 'loot') icon = '📦';
          else if (cell.eventType === 'teleport') icon = (state.teleportTheme && state.teleportTheme.icon) || '◇';
          else if (cell.eventType === 'rest') icon = '🛌';
        }
        var border = isCurrent ? '2px solid var(--teal)' : (isSelected ? '2px solid var(--gold2)' : '1px solid var(--border2)');
        var bg = !reveal ? 'rgba(20,20,26,.6)' : (cell.cleared ? 'rgba(50,180,90,.18)' : 'rgba(255,255,255,.04)');
        var badge = '';
        if (reveal && cell.lorePiece) badge += '📜';
        if (reveal && cell.waypoint) badge += '🧭';
        if (!badge) badge = '&nbsp;';
        gridCells.push('<button type="button" class="btn btn-xs" style="min-height:32px;padding:.1rem;font-size:.7rem;border:' + border + ';background:' + bg + ';" onclick="window.selectLegacyRaidHex(' + mission.id + ',' + wingNum + ',\'' + id + '\')">'
          + '<div style="line-height:1;">' + icon + '</div>'
          + '<div style="line-height:1;font-size:.5rem;color:var(--gold2);">' + badge + '</div>'
          + '</button>');
      }
    }
    return '<div style="display:grid;grid-template-columns:repeat(' + size + ',minmax(32px,1fr));gap:.1rem;">' + gridCells.join('') + '</div>';
  }

  function getLegacyRaidBossEnemyPool(bossTheme) {
    var themeKey = bossTheme && bossTheme.key ? bossTheme.key : 'default';
    var pools = {
      serpent: ['Tunnel Crawler', 'Venom Fang', 'Stone Wyrm', 'Burrower Swarm', 'Carapace Guard'],
      fire: ['Cinder Sentinel', 'Ash Wraith', 'Molten Beast', 'Pyre Guardian', 'Heat Specter'],
      sea: ['Brine Reaver', 'Glasswave Herald', 'Tidecaller', 'Abyssal Scout', 'Siren Thrall'],
      void: ['Static Shade', 'Null Whisper', 'Void Echo', 'Dimensional Rift', 'Absence Wraith'],
      stone: ['Ruin Guardian', 'Stone Colossus', 'Ancient Construct', 'Ironbound Sentry', 'Debris Giant'],
      default: ['Raider Assassin', 'Corrupted Sentinel', 'Cursed Hollow One', 'Shadow Beast', 'Lost Guardian']
    };
    return pools[themeKey] || pools.default;
  }

  function buildLegacyRaidHexDescription(mission, wingNum, hexType, bossTheme) {
    if (!bossTheme) bossTheme = getRaidTheme(mission);
    var themeKey = bossTheme && bossTheme.key ? bossTheme.key : 'default';
    var bossName = String(mission && mission.legacyRaidBoss || 'The Boss');
    var descPool = {
      puzzle: {
        serpent: ['Ornate lock mechanism carved in spiraling patterns.', 'Ancient stone seal covered in cryptic runes.', 'Puzzle requiring knowledge of the underground routes.'],
        fire: ['Charred mechanism with ember channels running through it.', 'Lock sealed with solidified slag that must be properly heated.', 'Puzzle requiring control of the raging heat.'],
        sea: ['Corroded valve mechanism with tide-lock mechanisms.', 'Underwater stone seal glowing faintly with bioluminescence.', 'Puzzle needing navigation of false currents.'],
        void: ['Lock that seems to phase between existence and void.', 'Mechanism that responds to silence rather than force.', 'Puzzle revealing hidden paths through dimensional folds.'],
        stone: ['Massive stone door with interlocking mechanisms.', 'Ancient lock covered in dust from fallen civilizations.', 'Puzzle requiring weight distribution across stone platforms.'],
        default: ['Ornate lock mechanism.', 'A rolling-sphere maze lock blocks the route forward. Reach the exit channel to disengage it.', 'Puzzle blocking passage deeper into the vault.']
      },
      peril: {
        serpent: ['A cracked stairwell drops beneath the province bedrock — every step threatens collapse.', 'The tunnel ahead drips with caustic slime from passing predators.', 'Walls shift with the movement of unseen creatures pressing outward from the stone.', 'Toxic venom pools bubble and hiss across the floor — one wrong step and you are slow and burning.'],
        fire: ['Waves of heat shimmer from cracked stone — breath from a pyre that never died.', 'Slag rivers flow lazily, still radiating dangerous warmth on every surface.', 'Cinders drift through air thick with ash and sulfur; breathing anything deep here is a gamble.', 'The floor is warm underfoot. Somewhere below, something still burns.'],
        sea: ['Pressure fluctuations suggest something vast moves nearby, just beyond the stone.', 'Brine stings your eyes and fills your lungs; depths press from all directions.', 'This post once controlled traffic deeper below. Murder holes and arrow slits still stare into the passage.', 'Water sits still but somehow threatens to surge at any moment — the tide reads you.'],
        void: ['Reality bends in ways your eyes struggle to register, like looking through warped glass.', 'Silence carries a weight that threatens to pull you into it permanently.', 'The air itself feels like it might shatter into fractured space if pressed too hard.', 'The corridor ahead exists in two states at once — and your body cannot choose between them.'],
        stone: ['Ancient supports groan and creak — collapse is imminent unless you move precisely.', 'Stone paths crumble to dust where something enormous has passed before you.', 'The walls pulse with something that might be a heartbeat of the deep. It is not a machine.', 'A section of ceiling has already fallen. You can see sky — or something pretending to be it.'],
        default: ['Danger permeates every shadow here. Nothing moves, but everything waits.', 'The hazard reeks of primal hunger. Something old marked this place as a feeding ground.', 'Something ancient and furious left its mark on this chamber. The walls remember it.', 'An edge-case corridor — the kind that kills the distracted, not the unprepared.']
      },
      hazard: {
        serpent: ['Rocks and debris form maze-like obstacles carved by something that tunnels without care.', 'Narrow passages force careful navigation between stone fangs that jut from every surface.', 'Ground unstable — sections drop into darkness below, and the floor gives no warning.', 'Shed carapace litters the route; beneath it, the stone has been dissolved and re-hardened into treacherous footing.'],
        fire: ['Cracked stone reflects dancing firelight from internal vents that breathe out like living lungs.', 'Ash drifts like snow; breathing too deep means breathing in what was once alive.', 'The stone itself is still warm — not dangerously so, but unnaturally, persistently, patient.', 'A collapsed vent has re-routed ember flood through the only clear passage forward.'],
        sea: ['Flooded sections create treacherous footing and hidden depths that hide worse things below.', 'Saltwater pools corrode anything metal left too long — and everything rusts faster here than it should.', 'Currents suggest channels cutting through the stone unexpectedly; standing water is never just standing.', 'Brine-stained archways mark where something once moved freely through this space. The floods were not always here.'],
        void: ['Gravity shifts subtly in certain corners of this space; your body learns this the hard way.', 'Shadows seem to have corners where they should not — geometry is broken in here.', 'The path feels less solid than it appears. Each step is a small act of faith.', 'A buzzing fills the inner ear that has no source. The static is the hazard.'],
        stone: ['Collapsed sections block obvious routes — you must think spatially, laterally, and quickly.', 'Cracks spider-web the floor in warning patterns that suggest imminent failure.', 'Dust storms choke the air where tectonic settling continues deep in the rock.', 'A load-bearing pillar has been broken — by what, you cannot say, but recently.'],
        default: ['Treacherous terrain requires careful movement and absolute focus.', 'Natural hazards bar the way forward. Nothing here is designed to kill — it just will.', 'The environment itself seems hostile to passage, like it learned from whatever lives here.', 'A route that looks navigable is not. The danger is the assumption of safety.']
      },
      barrier: {
        serpent: ['A wall of crystallized venom seals the passage — it has set hard over many years.', 'Stone door sealed by ancient worshippers; the lock mechanism is biological in design.', 'Webbing strong as steel blocks further passage — it still vibrates, faintly, from something living.', 'A resin barrier, secreted and dried. It was not built. It was grown to keep things out.'],
        fire: ['Slag wall still cooling and shifting — the timing of a crossing is everything.', 'Obsidian barrier dark as the pyre\'s heart; the surface is smooth and offers no grip.', 'Volcanic glass wall sealed by heat and compression. It rings when struck. It does not give.', 'The passage is choked by hardened flow — navigating through means going underneath.'],
        sea: ['Current-locked stone barrier — the pressure holds it sealed from the wrong side.', 'Coral growth binds the passage with living stone that still breathes at low tide.', 'Brine-corroded lock mechanism that demands patience and steady hands.', 'A rusted iron gate, swollen in its frame, and the mechanism is on a side you cannot reach yet.'],
        void: ['A barrier that exists in negative space — difficult to perceive directly, impossible to ignore.', 'Dimensional seal that pushes back against physical force with equal and rising resistance.', 'A wall of absence. The block is not the stone — it is the space where stone should be.', 'The lock is not keyed to any metal. It only opens for something it recognizes.'],
        stone: ['Ancient stone door massive enough that the whole team must brace and shift together.', 'Barrier carved with warnings in dead languages. Several of the glyphs are warnings about the others.', 'Gate locked since before the fall of civilizations — the mechanism still turns, just not easily.', 'A portcullis sealed from above. The winch is on the far side. There must be another way.'],
        default: ['A substantial barrier blocks further progress. It was not placed to be ornamental.', 'Stone wall sealed by magic or time — the seam is visible but the gap is not.', 'Locked gate requiring careful approach, steady hands, and the right tool for the mechanism.', 'A sealed passage. The air on the other side feels different — cooler, older, quieter.']
      },
      enemy: {
        serpent: ['Echoing hisses announce worm-things hunting in darkness here.', 'The tunnel vibrates with the approach of something large.', 'Shadows move wrong—predators of the deep stalk this chamber.'],
        fire: ['Heat distortion precedes the arrival of burning things.', 'Embers swirl in animated patterns—something intelligent stokes the flames.', 'Screams of creatures born of ash and ember echo ahead.'],
        sea: ['Sudden cold suggests things from the abyss stirring.', 'The water itself seems to coalesce into shapes.', 'Bioluminescent shapes dart in organized patrol patterns.'],
        void: ['The air cracks with static before manifesting as beings.', 'Whispering voices that shouldn\'t exist converge here.', 'Absence takes form—something emerges from non-being.'],
        stone: ['Armored footsteps echo from guardians of the deep vault.', 'Ancient constructs grind to life as you approach.', bossName + '\'s servants stir, unwilling to let anyone pass.'],
        default: ['Hostile forces converge on your position.', 'Creatures of malice bar the path.', 'Combat cannot be avoided here.']
      },
      loot: {
        serpent: ['Treasure pile guarded by skeletal remains and shed carapace.', 'Glints of valuable material caught in ancient webbing.', 'Cache left behind when something was dragged deeper.'],
        fire: ['Charred coins and melted jewels glow faintly with residual heat.', 'Refuse of burned travelers and ' + bossName + '\'s hoard mixed together.', 'Valuable materials half-buried in warm ash.'],
        sea: ['Merchant goods from wrecked vessels, preserved by the deep.', 'Treasures of sunken fleets, encrusted with salt and time.', 'Brine-stained riches from drowned kingdoms.'],
        void: ['Artifacts that seem to exist only partially in this realm.', 'Treasures from places outside normal space.', 'Loot that glimmers with otherworldly light.'],
        stone: ['Imperial treasures left in this vault before civilization fell.', 'Ancient wealth accumulated across forgotten centuries.', 'Pre-collapse artifacts worth more than provinces.'],
        default: ['Valuable materials lie within reach.', 'Merchant cache waiting for careful retrieval.', 'Treasures of the old world remain unclaimed.']
      },
      teleport: {
        serpent: ['Spiral of amber stone marks a tunneling waypoint of ' + bossName + '.', 'Portal surrounded by crystallized venom and bone.', 'Gate that pulses with predator-like intent.'],
        fire: ['Obsidian circle burns with ember-light--a flame-forged waypoint.', 'Portal that radiates heat and smells of ritual burning.', 'Gate wreathed in harmless fire, thrumming with power.'],
        sea: ['Bioluminescent circle marking a brine-tide waypoint.', 'Portal deep-blue and cold, drawing energy from the abyss.', 'Gate that hums with current-song.'],
        void: ['Circle of absolute stillness and negative potential.', 'Portal that seems to pull inward rather than outward.', 'Gate existing between moments and spaces.'],
        stone: ['Ancient teleportation gate still marked by elder runes.', 'Portal carved from a single piece of pre-fall marble.', 'Gate powered by forces nobody modern understands.'],
        default: ['Teleport waypoint glowing with mysterious energy.', 'Portal humming with otherworldly power.', 'Gate promising swift passage to safety.']
      },
      rest: {
        serpent: ['A hollowed chamber lined with shed carapace offers a rare safe pause.', 'Stone roots muffle the tunnel vibrations—good enough for a field rest.'],
        fire: ['A cooled alcove between slag veins gives brief shelter from the heat.', 'The pyre wind calms here, letting the team steady breath and focus.'],
        sea: ['A dry pocket above the floodline makes a temporary forward camp.', 'Low tide exposes an old watch ledge where the team can regroup.'],
        void: ['A still-point where static quiets allows a careful reset.', 'The chamber edges hold reality long enough for a controlled long rest.'],
        stone: ['An intact guard post survives here—perfect for a quick long rest.', 'The old vault barracks remain defensible for one careful pause.'],
        default: ['A defensible room gives the team a brief chance to recover.', 'A quiet chamber allows a tactical long rest before pushing on.']
      }
    };
    var typePool = descPool[hexType] || descPool.default;
    var regionPool = typePool[themeKey] || typePool.default;
    var picks = Array.isArray(regionPool) ? regionPool : [regionPool];
    return picks.length ? picks[Math.floor(Math.random() * picks.length)] : 'A chamber awaiting your exploration.';
  }

  function buildLegacyRaidWingGridCellDetail(mission, wingNum, state) {
    if (!state || !state.cells) return '';
    var cell = state.cells[String(state.selectedId || state.currentId || '')];
    if (!cell) return '<div style="font-size:.67rem;color:var(--muted2);">Select a hex.</div>';
    var typeLabel = cell.isStart ? 'Entrance' : cell.isExit ? 'Exit' : String(cell.eventType || 'empty').replace(/_/g, ' ');
    var objectiveLine = '';
    if (cell.lorePiece) objectiveLine = 'Contains Lore Fragment.';
    if (cell.waypoint) objectiveLine = 'Contains Door Waypoint.';
    var hexDesc = String(cell.roomDescription || buildLegacyRaidHexDescription(mission, wingNum, cell.eventType, null) || '');
    var showEncounter = cell.isStart || cell.isExit || cell.cleared;
    var displayTypeLabel = showEncounter ? typeLabel : '? Unknown';
    var encounterLabel = showEncounter ? String(cell.encounterLabel || typeLabel) : '';
    var hexTitlePart = displayTypeLabel + (encounterLabel ? ' · ' + encounterLabel : '');
    var moveAllowed = String(state.currentId || '') === cell.id || getLegacyRaidGridNeighbors(state, String(state.currentId || '')).indexOf(cell.id) >= 0;
    var isCurrent = String(state.currentId || '') === cell.id;
    var noTicks = Number(state.ticks || 0) <= 0;
    var et = String(cell.eventType || '').toLowerCase();
    var exploreLabel = et === 'empty' ? 'Search Empty Room (-1 Tick)' : 'Search Room (-1 Tick)';
    var actionHint = isCurrent
      ? ''
      : '<div style="font-size:.7rem;color:var(--muted2);margin:.08rem 0 .12rem;">Select this hex and press <strong>Press Deeper</strong> first, then search.</div>';
    var teleportButton = '';
    if (isCurrent && showEncounter && String(cell.eventType || '') === 'teleport' && cell.teleportTo) {
      teleportButton = '<button class="btn btn-xs btn-teal" onclick="window.useLegacyRaidTeleport(' + mission.id + ',' + wingNum + ')">Use Teleport → ' + String(cell.teleportTo) + '</button>';
    }
    var roomLabel = cell.isStart ? 'Entrance' : (cell.isExit ? 'Exit' : (showEncounter ? (encounterLabel || typeLabel) : '? Unexplored'));
    return '<div style="border:1px solid var(--border2);padding:.28rem .32rem;background:rgba(255,255,255,.03);">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.08rem;">' + roomLabel + (isCurrent ? ' <span style="color:var(--teal);font-size:.62rem;">◆ Here</span>' : '') + '</div>'
      + (hexDesc ? '<div style="font-size:.74rem;color:var(--text2);line-height:1.56;margin-bottom:.12rem;">' + hexDesc + '</div>' : '')
      + '<div style="font-size:.72rem;line-height:1.58;background:rgba(0,0,0,.22);border-radius:.2rem;padding:.2rem .28rem;margin-bottom:.12rem;color:var(--text2);">' + (showEncounter ? getLegacyRaidHexMechanicSummary(wingNum, cell) : 'Unexplored. Move here and search to reveal.') + '</div>'
      + '<div style="font-size:.66rem;color:var(--teal);line-height:1.45;margin-bottom:.08rem;">' + (objectiveLine || '') + '</div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.1rem;">⏱ ' + Number(state.ticks || 0) + ' ticks remaining</div>'
      + actionHint
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
      + (!isCurrent ? '<button class="btn btn-xs" ' + (moveAllowed && !noTicks ? '' : 'disabled') + ' onclick="window.moveLegacyRaidHex(' + mission.id + ',' + wingNum + ')">Press Deeper (-1 Tick)</button>' : '')
      + '<button class="btn btn-xs btn-primary" ' + (isCurrent && !noTicks ? '' : 'disabled') + ' onclick="window.resolveLegacyRaidHexEncounter(' + mission.id + ',' + wingNum + ')">' + exploreLabel + '</button>'
      + teleportButton
      + '</div>'
      + '</div>';
  }

  window.useLegacyRaidTeleport = function (missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (!state || !state.cells) return false;
    var current = state.cells[String(state.currentId || '')];
    if (!current || String(current.eventType || '') !== 'teleport' || !current.teleportTo || !state.cells[current.teleportTo]) {
      if (typeof showNotif === 'function') showNotif('No valid teleport link in this hex.', 'warn');
      return false;
    }
    state.currentId = String(current.teleportTo);
    state.selectedId = String(current.teleportTo);
    revealLegacyRaidGridAround(state, state.currentId);
    state.lastLog = 'Teleport engaged from ' + String(current.id || '?') + ' to ' + String(current.teleportTo || '?') + '.';
    if (typeof showNotif === 'function') showNotif('Teleport engaged.', 'good');
    return openRaidWingPopup(mission.id, wingNum, String(state.currentId || ''));
  };

  function openLegacyRaidHexRiskCheckModal(missionId, wingNum, cell, eventType) {
    if (!cell) return false;
    var mission = getMission(missionId);
    if (!mission) return false;
    var statByType = { peril: 'defend', hazard: 'mind', barrier: 'body' };
    var statKey = statByType[eventType] || 'adventure';
    var statLabel = statKey === 'defend' ? 'Defend' : (statKey === 'mind' ? 'Mind' : (statKey === 'body' ? 'Body' : 'Adventure'));
    var dd = getLegacyRaidHexDreadDie(wingNum, eventType);
    var et = String(eventType || '').toLowerCase();
    var failureDesc = et === 'peril'
      ? 'Failure: +1 Teamwork · Physical damage = roll difference'
      : (et === 'hazard'
        ? 'Failure: +1 Teamwork · Mental stress = roll difference'
        : 'Failure: +1 Teamwork · Random condition applied (Weakened / Distracted / Vulnerable / Shaken)');
    var body = '<div style="font-size:.82rem;color:var(--text2);line-height:1.55;">'
      + '<div style="font-size:.86rem;color:var(--gold2);margin-bottom:.14rem;"><strong>' + String(cell.encounterLabel || 'Room Encounter') + '</strong></div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.16rem;font-style:italic;">' + String(cell.roomDescription || '') + '</div>'
      + '<div style="font-size:.74rem;color:var(--text2);margin-bottom:.1rem;">Roll <strong>' + statLabel + ' Action Die</strong> vs <strong>Dread d' + dd + '</strong>.</div>'
      + '<div style="font-size:.67rem;color:var(--teal);margin-bottom:.18rem;">' + failureDesc + '</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.resolveLegacyRaidHexRiskCheck(' + missionId + ',' + wingNum + ',\'' + String(cell.id || '') + '\',\'' + String(eventType || '') + '\')">Roll Check</button>'
      + '<button class="btn btn-xs" onclick="openRaidWingPopup(' + missionId + ',' + wingNum + ',\'' + String(cell.id || '') + '\')">Back</button>'
      + '</div>'
      + '</div>';
    openModal('Raid Encounter', body);
    return true;
  }

  window.resolveLegacyRaidHexRiskCheck = function (missionId, wingNum, cellId, eventType) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (!state || !state.cells) return false;
    var cell = state.cells[String(cellId || '')];
    if (!cell) return false;
    var et = String(eventType || '').toLowerCase();
    var statByType = { peril: 'defend', hazard: 'mind', barrier: 'body' };
    var result = resolveLegacyRaidHexContest(statByType[et] || 'adventure', getLegacyRaidHexDreadDie(wingNum, et));
    if (typeof closeModal === 'function') closeModal();
    if (!result.success) {
      if (typeof addTMWOnFail === 'function') addTMWOnFail();
      if (et === 'peril' && typeof S !== 'undefined' && S) S.health = Math.max(0, Number(S.health || 0) - Math.max(1, result.diff));
      if (et === 'hazard' && typeof S !== 'undefined' && S) S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + Math.max(1, result.diff));
      if (et === 'barrier' && typeof S !== 'undefined' && S) {
        var barrierConds = ['weakened', 'distracted', 'vulnerable', 'shaken'];
        var applyCond = barrierConds[Math.floor(Math.random() * barrierConds.length)];
        S.conditions = S.conditions || {};
        S.conditions[applyCond] = true;
        if (typeof showNotif === 'function') showNotif('Barrier failure — ' + applyCond.charAt(0).toUpperCase() + applyCond.slice(1) + ' condition applied.', 'warn');
      }
      state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
      state.lastLog = 'Hex ' + cell.id + ' failed (' + et + '). Roll ' + result.actionRoll + ' vs ' + result.dreadRoll + '. Extra tick lost.';
    } else {
      cell.cleared = true;
      state.ticks = Math.min(getLegacyRaidTickCap(), Number(state.ticks || 0) + 2);
      if (cell.waypoint) state.objectives.waypointsActivated = Math.min(Number(state.objectives.waypointsRequired || 3), Number(state.objectives.waypointsActivated || 0) + 1);
      if (cell.lorePiece) state.objectives.loreCollected = Math.min(Number(state.objectives.loreRequired || 3), Number(state.objectives.loreCollected || 0) + 1);
      state.lastLog = 'Hex ' + cell.id + ' cleared (' + et + '). Roll ' + result.actionRoll + ' vs ' + result.dreadRoll + '. +2 ticks.';
    }
    if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
    if (checkLegacyRaidWingGridCompletion(mission, wingNum, state)) return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
    return openRaidWingPopup(mission.id, wingNum, String(cell.id || ''));
  };

  function checkLegacyRaidWingGridCompletion(mission, wingNum, state) {
    if (!mission || !state) return false;
    if (Number(wingNum || 1) === 1) {
      return Number(state.objectives.loreCollected || 0) >= Number(state.objectives.loreRequired || 3)
        && String(state.currentId || '') === String(state.exitId || '');
    }
    return Number(state.objectives.waypointsActivated || 0) >= Number(state.objectives.waypointsRequired || 3)
      && String(state.currentId || '') === String(state.exitId || '');
  }

  window.selectLegacyRaidHex = function (missionId, wingNum, cellId) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (!state || !state.cells || !state.cells[cellId]) return false;
    if (!state.cells[cellId].revealed) return false;
    state.selectedId = String(cellId || state.selectedId || state.currentId);
    // Clicking an adjacent hex is equivalent to "Press Deeper".
    if (String(state.currentId || '') !== String(cellId || '')) {
      var adjacent = getLegacyRaidGridNeighbors(state, String(state.currentId || '')).indexOf(String(cellId || '')) >= 0;
      if (adjacent) return window.moveLegacyRaidHex(missionId, wingNum);
    }
    return openRaidWingPopup(missionId, wingNum);
  };

  window.moveLegacyRaidHex = function (missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (!state || !state.cells) return false;
    var target = state.cells[String(state.selectedId || '')];
    if (!target) return false;
    if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
    var currentId = String(state.currentId || '');
    if (target.id === currentId) {
      if (typeof showNotif === 'function') showNotif('Already in this hex.', 'info');
      return false;
    }
    var adjacent = getLegacyRaidGridNeighbors(state, currentId).indexOf(target.id) >= 0;
    if (!adjacent) {
      if (typeof showNotif === 'function') showNotif('Press Deeper requires an adjacent revealed hex.', 'warn');
      return false;
    }
    state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
    state.currentId = target.id;
    state.selectedId = target.id;
    target.visited = true;
    revealLegacyRaidGridAround(state, target.id);
    state.lastLog = 'Moved to hex ' + target.id + ' (-1 tick).';

    if (target.eventType === 'teleport' && target.teleportTo && state.cells[target.teleportTo]) {
      state.lastLog = 'Moved into ' + String(target.encounterLabel || 'teleport') + '. Teleport link discovered to ' + target.teleportTo + ' (manual use).';
    }

    if (String(target.eventType || '') === 'enemy' && !target.cleared) {
      if (typeof showNotif === 'function') showNotif('Enemy contact detected. Opening combat scene.', 'warn');
      return window.resolveLegacyRaidHexEncounter(mission.id, wingNum);
    }

    if (Number(state.ticks || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Wing timer expired. Wipe state triggered.', 'warn');
      return openLegacyRaidWipeDecision(mission.id);
    }

    if (String(state.currentId || '') === String(state.exitId || '') && checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
      var runMove = ensureLegacyRaidRunState(mission);
      if (runMove) markLegacyRaidWingOutcome(mission, wingNum, true);
      return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
    }

    if (String(state.currentId || '') === String(state.exitId || '') && !checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
      state.lastLog = 'Exit reached, but wing objectives are incomplete.';
    }
    return openRaidWingPopup(mission.id, wingNum);
  };

  window.resolveLegacyRaidHexEncounter = function (missionId, wingNum) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var state = ensureLegacyRaidWingGridState(mission, wingNum);
    if (!state || !state.cells) return false;
    var cell = state.cells[String(state.selectedId || state.currentId || '')];
    if (!cell) return false;
    if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
    if (String(cell.id || '') !== String(state.currentId || '')) {
      if (typeof showNotif === 'function') showNotif('Use Press Deeper first to move into that hex.', 'warn');
      return false;
    }
    state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
    cell.visited = true;
    revealLegacyRaidGridAround(state, cell.id);
    var vault = ensureLegacyRaidLootVault(mission);

    var waypointNeedsActivation = !!(cell.waypoint && !cell.waypointActivated);
    if (waypointNeedsActivation && typeof window.openSharedPuzzleChallenge === 'function') {
      var doorChessMode = Number(wingNum || 1) === 2 && Number(state.objectives.waypointsActivated || 0) === 1;
      return window.openSharedPuzzleChallenge({
        source: getLegacyRaidHexPuzzleSource(mission, wingNum, cell),
        title: doorChessMode ? 'Unlock the Door: Chess Puzzle' : 'Waypoint Repair: Pipe Flow',
        prompt: doorChessMode
          ? ('Room 2 lock in hex ' + cell.id + ': capture all marked pieces with legal rook moves to unlock the door.')
          : ('Repair the waypoint conduit in hex ' + cell.id + '. Rotate pipes until flow reaches the terminal to fix the waypoint.'),
        mode: doorChessMode ? 'chess_puzzle' : 'pipe_flow',
        reward: { credits: 60, renown: 1, item: 'Waypoint Key' },
        onSuccess: function () {
          cell.waypointActivated = true;
          cell.cleared = true;
          state.objectives.waypointsActivated = Math.min(Number(state.objectives.waypointsRequired || 3), Number(state.objectives.waypointsActivated || 0) + 1);
          state.ticks = Math.min(getLegacyRaidTickCap(), Number(state.ticks || 0) + 2);
          state.lastLog = 'Waypoint in hex ' + cell.id + ' repaired via pipe flow. +2 ticks earned.';
          if (checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
            var runWaypoint = ensureLegacyRaidRunState(mission);
            if (runWaypoint) markLegacyRaidWingOutcome(mission, wingNum, true);
            return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
          }
          return openRaidWingPopup(mission.id, wingNum);
        },
        onFail: function () {
          if (typeof addTMWOnFail === 'function') addTMWOnFail();
          state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
          state.lastLog = 'Waypoint repair failed in hex ' + cell.id + '. Extra tick lost.';
          if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
          return openRaidWingPopup(mission.id, wingNum);
        }
      });
    }

    if (!cell.cleared) {
      var eventType = String(cell.eventType || 'empty');
      var result = { success: true, diff: 0, note: '' };
      var bossTheme = getRaidTheme(mission);
      if (eventType === 'puzzle') {
        if (typeof window.openSharedPuzzleChallenge === 'function') {
          var puzzleSource = getLegacyRaidHexPuzzleSource(mission, wingNum, cell);
          var puzzleTitle = cell.lorePiece
            ? 'Lore Puzzle: Crossword or Sudoku'
            : (cell.waypoint ? 'Waypoint Puzzle: Lockpick or Pipe Flow' : 'Raid Maze Lock: Gravity Sphere');
          var loreMode = null;
          var loreConfig = {};
          var waypointPreset = null;
          if (cell.lorePiece) {
            var loreRoll = Math.random();
            loreMode = loreRoll < 0.4 ? 'crossword' : (loreRoll < 0.75 ? 'sudoku' : 'wordle_arcane');
            if (loreMode === 'crossword') {
              var cwConfig = createLegacyRaidLoreCrosswordConfig(mission, wingNum, cell);
              loreConfig.clues = cwConfig.clues;
            } else {
              if (loreMode === 'sudoku') {
                var sdkConfig = createLegacyRaidLoreSudokuConfig(mission, wingNum, cell);
                loreConfig.sudokuPuzzle = sdkConfig.sudokuPuzzle;
                loreConfig.sudokuSolution = sdkConfig.sudokuSolution;
              }
            }
          } else if (cell.waypoint) {
            loreMode = 'maze';
            waypointPreset = getLegacyRaidWaypointMazePreset(cell.id, wingNum);
            loreConfig.mazeLayout = waypointPreset.layout;
            loreConfig.answer = waypointPreset.answer;
          } else {
            var varietyModes = ['maze', 'sliding_tile', 'math_grid', 'rotating_image', 'chess_puzzle'];
            loreMode = varietyModes[getLegacyRaidStableIndex(String(cell.id || '') + '|variety|' + String(wingNum || 1), varietyModes.length)];
            if (loreMode === 'maze') {
              var raidMazePreset = getLegacyRaidChallengeMazePreset(cell.id, wingNum);
              loreConfig.mazeLayout = raidMazePreset.layout;
              loreConfig.answer = raidMazePreset.answer;
            }
          }
          return window.openSharedPuzzleChallenge({
            source: puzzleSource,
            title: puzzleTitle,
            prompt: cell.waypoint
              ? ('Rewire the waypoint conduit in hex ' + cell.id + '. Route from S to E before the lock resets.')
              : (loreMode === 'maze'
                ? ('Roll the guidance sphere through the lock maze in hex ' + cell.id + '. Reach E from S before the pressure seals.')
                : buildLegacyRaidHexDescription(mission, wingNum, 'puzzle', bossTheme)),
            mode: loreMode,
            answer: loreConfig.answer,
            gridTemplate: loreConfig.gridTemplate,
            mazeLayout: loreConfig.mazeLayout,
            clues: loreConfig.clues,
            sudokuPuzzle: loreConfig.sudokuPuzzle,
            sudokuSolution: loreConfig.sudokuSolution,
            reward: { credits: 50, renown: 1, item: cell.lorePiece ? 'Lore Fragment' : 'Waypoint Key' },
            onSuccess: function () {
              cell.cleared = true;
              state.ticks = Math.min(getLegacyRaidTickCap(), Number(state.ticks || 0) + 2);
              if (cell.lorePiece) {
                state.objectives.loreCollected = Math.min(Number(state.objectives.loreRequired || 3), Number(state.objectives.loreCollected || 0) + 1);
                if (Number(state.objectives.loreCollected || 0) >= Number(state.objectives.loreRequired || 3) && Number(wingNum || 1) === 1 && typeof showNotif === 'function') {
                  showNotif('All lore fragments recovered. Proceed to the wing exit to unlock Wing 2.', 'good');
                }
              }
              if (cell.waypoint && !cell.waypointActivated) {
                cell.waypointActivated = true;
                state.objectives.waypointsActivated = Math.min(Number(state.objectives.waypointsRequired || 3), Number(state.objectives.waypointsActivated || 0) + 1);
              }
              state.lastLog = 'Hex ' + cell.id + ' puzzle solved. +2 ticks earned.';
              if (checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
                var runSolved = ensureLegacyRaidRunState(mission);
                if (runSolved) markLegacyRaidWingOutcome(mission, wingNum, true);
                return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
              }
              return openRaidWingPopup(mission.id, wingNum);
            },
            onFail: function () {
              var failRoll = resolveLegacyRaidHexContest('mind', getLegacyRaidHexDreadDie(wingNum, eventType));
              state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
              if (typeof addTMWOnFail === 'function') addTMWOnFail();
              if (typeof S !== 'undefined' && S) S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + Math.max(1, failRoll.diff));
              state.lastLog = 'Hex ' + cell.id + ' puzzle failed. Extra tick lost while deciphering.';
              if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
              return openRaidWingPopup(mission.id, wingNum);
            }
          });
        }
        result = resolveLegacyRaidHexContest('mind', getLegacyRaidHexDreadDie(wingNum, eventType));
        if (!result.success) {
          if (typeof addTMWOnFail === 'function') addTMWOnFail();
          if (typeof S !== 'undefined' && S) S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + Math.max(1, result.diff));
        }
      } else if (eventType === 'peril') {
        return openLegacyRaidHexRiskCheckModal(mission.id, wingNum, cell, eventType);
      } else if (eventType === 'hazard') {
        return openLegacyRaidHexRiskCheckModal(mission.id, wingNum, cell, eventType);
      } else if (eventType === 'barrier') {
        return openLegacyRaidHexRiskCheckModal(mission.id, wingNum, cell, eventType);
      } else if (eventType === 'enemy') {
        var enemyCount = Number(wingNum || 1) === 1
          ? (1 + Math.floor(Math.random() * 4))
          : (2 + Math.floor(Math.random() * 7));
        var enemyPool = getLegacyRaidBossEnemyPool(bossTheme);
        if (typeof S !== 'undefined' && S) {
          if (!Array.isArray(S.enemies)) S.enemies = [];
          S.enemies = [];
          for (var ei = 0; ei < enemyCount; ei++) {
            var enemyDd = getLegacyRaidHexDreadDie(wingNum, 'enemy');
            S.enemies.push({
              id: Date.now() + Math.floor(Math.random() * 100000) + ei,
              name: enemyPool[ei % enemyPool.length] || 'Raid Hostile',
              dread: enemyDd,
              stress: 0,
              maxStress: 8 + (Number(wingNum || 1) === 2 ? 4 : 0)
            });
          }
        }
        state.pendingCombat = {
          active: true,
          wing: Number(wingNum || 1),
          cellId: String(cell.id || ''),
          enemyCount: Number(enemyCount || 1),
          startedAt: Date.now()
        };
        state.lastLog = 'Hex ' + cell.id + ' combat engaged. Resolve combat to finalize this hex.';
        if (typeof showNotif === 'function') showNotif('Enemy encounter in hex ' + cell.id + '. Combat opened.', 'warn');

        var isRaid = mission && mission.missionType === 'legacy_raid';
        if (isRaid && typeof window.openRaidCombatModal === 'function') {
          window.openRaidCombatModal(mission.id, wingNum);
          return true;
        }
        if (typeof startCombat === 'function') {
          startCombat();
          return true;
        }
        result = resolveLegacyRaidHexContest('adventure', getLegacyRaidHexDreadDie(wingNum, eventType));
        if (!result.success) {
          if (typeof addTMWOnFail === 'function') addTMWOnFail();
          if (typeof S !== 'undefined' && S) S.health = Math.max(0, Number(S.health || 0) - Math.max(1, result.diff));
        }
      }

      if (!result.success) {
        state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
        state.lastLog = 'Hex ' + cell.id + ' failed (' + eventType + '). Extra tick lost.';
      } else {
        cell.cleared = true;
        state.ticks = Math.min(getLegacyRaidTickCap(), Number(state.ticks || 0) + 2);
        state.lastLog = eventType === 'empty'
          ? ('Hex ' + cell.id + ' is empty. No encounter present. +2 ticks earned for a fast sweep.')
          : ('Hex ' + cell.id + ' cleared (' + eventType + '). +2 ticks earned.');
        if (eventType === 'empty' && typeof showNotif === 'function') showNotif('Hex ' + cell.id + ' is empty.', 'info');
        if (cell.lorePiece) state.objectives.loreCollected = Math.min(Number(state.objectives.loreRequired || 3), Number(state.objectives.loreCollected || 0) + 1);
        if (cell.waypoint && !cell.waypointActivated) {
          cell.waypointActivated = true;
          state.objectives.waypointsActivated = Math.min(Number(state.objectives.waypointsRequired || 3), Number(state.objectives.waypointsActivated || 0) + 1);
        }
        if (eventType === 'loot' && vault && !cell.lootSeeded) {
          var lootDrops = rollShopLoot(mission.difficulty) || [];
          lootDrops.forEach(function (item) { if (item) vault.loot.push(String(item)); });
          var keyTier = getLegacyRaidKeyDrop();
          vault.keys[keyTier] = Math.max(0, Number(vault.keys[keyTier] || 0) + 1);
          var keyLabel = getLegacyRaidKeyItemLabel(keyTier, vault.keys[keyTier]);
          state.lastLog = 'Hex ' + cell.id + ' loot secured: '
            + (lootDrops.length ? lootDrops.join(', ') : 'No merchant salvage')
            + ' · ' + keyLabel + '.';
          cell.lootSeeded = true;
        }
        if (eventType === 'teleport' && cell.teleportTo && state.cells[cell.teleportTo]) {
          state.lastLog = 'Hex ' + cell.id + ' teleport calibrated. Use the teleport action to warp to ' + cell.teleportTo + '.';
        }
        if (eventType === 'rest') {
          var bonusTicks = Number(cell.rested ? 0 : 2);
          if (!cell.rested) {
            state.ticks = Math.min(getLegacyRaidTickCap(), Number(state.ticks || 0) + bonusTicks);
            cell.rested = true;
            state.lastLog = 'Long Rest complete at hex ' + cell.id + '. +2 ticks restored.';
          } else {
            state.lastLog = 'Rest chamber ' + cell.id + ' has already been used this run.';
          }
        }
      }
    } else {
      state.lastLog = 'Traversed cleared hex ' + cell.id + '. Movement costs 1 tick.';
    }

    if (Number(state.ticks || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Wing timer expired. Wipe state triggered.', 'warn');
      return openLegacyRaidWipeDecision(mission.id);
    }

    if (checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
      var run = ensureLegacyRaidRunState(mission);
      if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
      return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
    }
    return openRaidWingPopup(mission.id, wingNum);
  };

  function openLegacyRaidCombatReturnPrompt(missionId, wingNum, outcome, detail) {
    var mId = Number(missionId || 0);
    var wNum = Number(wingNum || 1);
    var label = String(outcome || 'resolved').toLowerCase();
    var title = label === 'win' ? 'Combat Won' : (label === 'retreat' ? 'Combat Ended' : 'Combat Resolved');
    var detailText = String(detail || (label === 'win'
      ? 'The enemy squad is broken. Return to the wing route.'
      : 'You disengaged from the encounter. Return to the wing route to continue.'));
    if (typeof openModal !== 'function') {
      if (typeof openRaidWingPopup === 'function') return openRaidWingPopup(mId, wNum);
      return false;
    }
    openModal(
      'Raid Combat Complete',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="font-size:.84rem;color:var(--gold2);font-family:\'Cinzel\',serif;margin-bottom:.2rem;"><strong>' + title + '</strong></div>'
        + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.34rem;">' + detailText + '</div>'
        + '<div style="display:flex;gap:.22rem;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-teal" onclick="if(typeof closeModal===\'function\')closeModal();if(typeof openRaidWingPopup===\'function\')openRaidWingPopup(' + mId + ',' + wNum + ');">Return to Wing ' + wNum + '</button>'
        + '<button class="btn btn-sm" onclick="if(typeof closeModal===\'function\')closeModal();">Stay Here</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  window.finalizeLegacyRaidHexCombatOutcome = function (outcome) {
    var ctx = getLegacyRaidPendingHexCombat();
    if (!ctx || !ctx.mission || !ctx.state || !ctx.pending) return false;
    var mission = ctx.mission;
    var state = ctx.state;
    var wingNum = Number(ctx.pending.wing || state.wing || 1);
    var cellId = String(ctx.pending.cellId || state.currentId || '');
    var cell = state.cells && state.cells[cellId] ? state.cells[cellId] : null;
    if (typeof S !== 'undefined' && S && S.combat) S.combat.raidFlow = null;
    state.pendingCombat = null;
    if (!cell) return openRaidWingPopup(mission.id, wingNum);
    var result = String(outcome || 'retreat').toLowerCase();
    if (result === 'win') {
      cell.cleared = true;
      var encounter = initializeRaidCombatIfNeeded();
      var wingAllies = getRaidWayfarersForWing(mission, wingNum);
      wingAllies.forEach(function (wf) {
        var allyName = String(wf && wf.name || '');
        var hp = encounter && encounter.partyHp && encounter.partyHp.allies ? Number(encounter.partyHp.allies[allyName] || 0) : 0;
        if (allyName && hp <= 0) wf.status = 'failed';
      });
      // Explicit cleanup: remove temporary raid allies from the scene enemy list on victory
      if (typeof S !== 'undefined' && S && Array.isArray(S.enemies)) {
        S.enemies = S.enemies.filter(function (e) { return e && !e.temporarySceneAlly; });
      }
      if (cell.waypoint && !cell.waypointActivated) {
        cell.waypointActivated = true;
        state.objectives.waypointsActivated = Math.min(Number(state.objectives.waypointsRequired || 3), Number(state.objectives.waypointsActivated || 0) + 1);
      }
      state.lastLog = 'Hex ' + cell.id + ' combat won. Path secured.';
    } else if (result === 'wipe') {
      if (typeof addTMWOnFail === 'function') addTMWOnFail();
      state.lastLog = 'Hex ' + cell.id + ' combat wipe. Retreating to checkpoint protocol.';
      return openLegacyRaidWipeDecision(mission.id);
    } else {
      if (typeof addTMWOnFail === 'function') addTMWOnFail();
      state.ticks = Math.max(0, Number(state.ticks || 0) - 1);
      state.lastLog = 'Hex ' + cell.id + ' combat unresolved (retreat). Extra tick lost.';
    }
    if (Number(state.ticks || 0) <= 0) return openLegacyRaidWipeDecision(mission.id);
    if (checkLegacyRaidWingGridCompletion(mission, wingNum, state)) {
      var run = ensureLegacyRaidRunState(mission);
      if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
      return openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance');
    }
    return openLegacyRaidCombatReturnPrompt(
      mission.id,
      wingNum,
      result,
      result === 'win'
        ? ('Hex ' + cell.id + ' secured. You can return to Wing ' + wingNum + ' and continue the route.')
        : ('Hex ' + cell.id + ' unresolved. Return to Wing ' + wingNum + ' to choose your next move.')
    );
  };

  function buildRaidHexMapSvg(mission, wingNum) {
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var theme = getRaidTheme(mission);
    if (!Array.isArray(rooms) || !rooms.length) return '';

    var R = 34;
    var dx = R * 1.72;
    var startX = R + 8;
    var W = Math.max(320, Math.round(startX * 2 + Math.max(0, rooms.length - 1) * dx + R * 2));
    var H = Math.max(150, Math.round(R * 3.4));
    var svgParts = [];
    var bossName = String(mission && mission.legacyRaidBoss || 'Raid Boss');
    var bossSeed = getLegacyRaidStableIndex(bossName + '|' + String(wingNum || 1), 1000);
    var bgHue = (bossSeed % 360);
    var bgHueAlt = (bgHue + 38) % 360;
    var bgGradientId = 'raidWingBg_' + String(mission && mission.id || 0) + '_' + String(wingNum || 1);
    var fogPatternId = 'raidWingFog_' + String(mission && mission.id || 0) + '_' + String(wingNum || 1);
    var bgDefs = '<defs>'
      + '<linearGradient id="' + bgGradientId + '" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0%" stop-color="hsla(' + bgHue + ',48%,18%,0.75)"/>'
      + '<stop offset="100%" stop-color="hsla(' + bgHueAlt + ',44%,10%,0.92)"/>'
      + '</linearGradient>'
      + '<pattern id="' + fogPatternId + '" width="36" height="36" patternUnits="userSpaceOnUse">'
      + '<circle cx="7" cy="7" r="1.4" fill="rgba(255,255,255,.12)"/>'
      + '<circle cx="24" cy="18" r="1" fill="rgba(255,255,255,.08)"/>'
      + '<circle cx="13" cy="27" r="1.1" fill="rgba(255,255,255,.09)"/>'
      + '</pattern>'
      + '</defs>';
    var bgLayer = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + bgGradientId + ')"/>'
      + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + fogPatternId + ')" opacity=".35"/>'
      + '<text x="' + Math.round(W / 2) + '" y="' + Math.round(H - 8) + '" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.35)">Wing ' + wingNum + ' · ' + bossName + '</text>';

    rooms.forEach(function (room, i) {
      var cx = startX + i * dx;
      var cy = H / 2;
      if (!room.discovered && !room.frontier) return;

      var pts = [];
      for (var a = 0; a < 6; a++) {
        var angle = (Math.PI / 180) * (60 * a - 30);
        pts.push((cx + R * Math.cos(angle)).toFixed(1) + ',' + (cy + R * Math.sin(angle)).toFixed(1));
      }
      var polygon = pts.join(' ');
      var isFrontier = room.frontier && !room.discovered;
      var isCleared = room.cleared;
      var fill = isFrontier ? theme.fogFill : (isCleared ? 'rgba(50,180,90,.18)' : theme.hexFill);
      var stroke = isFrontier ? theme.fogStroke : (isCleared ? '#3a9e60' : theme.hexStroke);
      var textFill = isFrontier ? 'rgba(200,200,200,.25)' : (isCleared ? '#60d090' : theme.ac);
      var opacity = isFrontier ? 0.45 : 1;
      var clickAttr = (room.discovered && !room.cleared) ? ' style="cursor:pointer;" onclick="window.openRaidRoomDetail(' + mission.id + ',' + wingNum + ',' + i + ')"' : '';

      svgParts.push(
        '<g' + clickAttr + ' opacity="' + opacity + '">'
          + '<polygon points="' + polygon + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>'
          + '<text x="' + cx.toFixed(1) + '" y="' + (cy - 4).toFixed(1) + '" text-anchor="middle" font-size="14" fill="' + textFill + '">' + (isFrontier ? '?' : (isCleared ? '✓' : room.icon)) + '</text>'
          + '<text x="' + cx.toFixed(1) + '" y="' + (cy + 13).toFixed(1) + '" text-anchor="middle" font-size="6" fill="' + textFill + '">' + (isFrontier ? 'Frontier' : (room.cleared ? 'Cleared' : 'Room ' + (i + 1))) + '</text>'
        + '</g>'
      );

      // connector line to next
      if (i < rooms.length - 1) {
        var nextRoom = rooms[i + 1];
        if (nextRoom && (nextRoom.discovered || nextRoom.frontier)) {
          var x2 = startX + (i + 1) * dx;
          svgParts.push('<line x1="' + (cx + R).toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + (x2 - R).toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="' + (isFrontier ? theme.fogStroke : theme.hexStroke) + '" stroke-width="1" opacity="0.5"/>');
        }
      }
    });

    return '<div style="background:' + theme.bg + ';border:1px solid ' + theme.hexStroke + ';padding:.3rem;border-radius:4px;margin-bottom:.4rem;">'
      + '<div style="font-size:.62rem;color:' + theme.tc + ';text-transform:uppercase;letter-spacing:.08em;margin-bottom:.2rem;">Wing ' + wingNum + ' Map — ' + theme.name + ' · click a room to explore</div>'
      + '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:560px;aspect-ratio:' + W + '/' + H + ';height:auto;display:block;margin:0 auto;">' + bgDefs + bgLayer + svgParts.join('') + '</svg>'
      + '<div style="font-size:.6rem;color:' + theme.muted + ';margin-top:.15rem;">Planning view active. Entrance, exit, lore, and waypoint routes are visible.</div>'
    + '</div>';
  }

  function getRaidWayfarersForWing(mission, wingNum) {
    if (!mission.raidWayfarers) {
      if (isLegacyRaidCampaignMode()) {
        mission.raidWayfarers = [];
        return mission.raidWayfarers;
      }
      var picked = ['Sel the Wayfinder', 'Korvus Pale', 'Tinden Ashmark'];
      mission.raidWayfarers = picked.map(function (name, i) {
        return { idx: i, name: name, dd: 6, hp: 12, status: 'ready', wing: null };
      });
    }
    return mission.raidWayfarers;
  }

  function buildRaidWayfarerCard(mission, wayfarer, wingNum, roomIdx) {
    var statusColor = wayfarer.status === 'failed' ? 'var(--red2)' : wayfarer.status === 'deployed' ? 'var(--teal)' : 'var(--gold2)';
    var statusLabel = wayfarer.status === 'failed' ? '✗ Lost' : wayfarer.status === 'deployed' ? '⚑ Deployed (W' + (wayfarer.wing || '?') + ')' : '● Ready';
    var actionHtml = '';
    if (wayfarer.status === 'ready') {
      actionHtml = '<button class="btn btn-xs btn-teal" onclick="window.deployRaidWayfarer(' + mission.id + ',' + wingNum + ',' + roomIdx + ',' + wayfarer.idx + ')">Deploy to Next Room</button>';
    } else if (wayfarer.status === 'deployed') {
      actionHtml = '<span style="font-size:.68rem;color:var(--teal);">Holding position — provides hazard absorption in Wing ' + (wayfarer.wing || wingNum) + '</span>';
    } else {
      actionHtml = '<span style="font-size:.68rem;color:var(--red2);">This Wayfarer was lost. Only remaining wayfarers can assist.</span>';
    }
    return '<div style="padding:.28rem .35rem;border:1px solid var(--border2);margin-bottom:.2rem;background:var(--surface);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="font-size:.72rem;color:var(--text2);"><strong>' + wayfarer.name + '</strong></div>'
      + '<div style="font-size:.65rem;color:' + statusColor + ';">' + statusLabel + '</div>'
      + '</div>'
      + '<div style="font-size:.67rem;color:var(--muted2);margin:.06rem 0 .22rem;">Traveling Wayfarer · DD' + wayfarer.dd + ' · ' + wayfarer.hp + ' Stress Pool</div>'
      + actionHtml
    + '</div>';
  }

  function buildLegacyRaidRoomRoleHtml(mission, wingNum, roomIdx, room) {
    var required = getLegacyRaidRequiredRolesForRoom(room);
    if (!required.length) return '';
    var roles = ensureLegacyRaidRoomRoleState(mission, wingNum, roomIdx);
    var riskLabels = getLegacyRaidRoomRiskLabels(room);
    var roleButtons = ['front', 'mechanics', 'support'].map(function (role) {
      var on = !!roles[role];
      var requiredRole = required.indexOf(role) >= 0;
      var activeRequired = requiredRole && required.length && required.indexOf(role) === (Number(roles.activeRequiredIndex || 0) % required.length);
      var label = role === 'front' ? 'Front' : (role === 'mechanics' ? 'Mechanics' : 'Support');
      return '<button class="btn btn-xs ' + (on ? 'btn-primary' : '') + '" onclick="toggleRaidRoomRole(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'' + role + '\')">'
        + label + (requiredRole ? (activeRequired ? ' *' : ' ·') : '') + (on ? ' ✓' : '')
        + '</button>';
    }).join('');
    var riskHtml = ['front', 'mechanics', 'support'].map(function (role) {
      var label = role === 'front' ? 'Front' : (role === 'mechanics' ? 'Mechanics' : 'Support');
      return '<div style="font-size:.63rem;color:var(--muted2);padding:.12rem .18rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);">'
        + '<strong style="color:var(--text2);">' + label + ':</strong> ' + String(riskLabels[role] || label)
        + '</div>';
    }).join('');
    return '<div style="margin-bottom:.2rem;">'
      + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.12rem;">Role Assignment (required roles marked with *)</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:.16rem;margin-bottom:.16rem;">' + riskHtml + '</div>'
      + '<div style="display:flex;gap:.22rem;flex-wrap:wrap;">' + roleButtons + '</div>'
      + '<div style="font-size:.64rem;color:var(--muted2);margin-top:.12rem;">Balanced roles grant +1 to room checks and prevent coordination failures.</div>'
      + '</div>';
  }

  function getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx) {
    if (!mission || !mission.legacyRaidRoomAssist || typeof mission.legacyRaidRoomAssist !== 'object') return 0;
    var key = String(wingNum) + ':' + String(roomIdx);
    return Math.max(0, Number(mission.legacyRaidRoomAssist[key] || 0));
  }

  function addLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx, amount) {
    if (!mission) return;
    if (!mission.legacyRaidRoomAssist || typeof mission.legacyRaidRoomAssist !== 'object') {
      mission.legacyRaidRoomAssist = {};
    }
    var key = String(wingNum) + ':' + String(roomIdx);
    mission.legacyRaidRoomAssist[key] = Math.max(0, Number(mission.legacyRaidRoomAssist[key] || 0) + Number(amount || 0));
  }

  function buildRaidFailedRoomRecoveryHtml(mission, wingNum, roomIdx, room) {
    if (!room || room.type === 'WayfarerPost' || room.isBoss || Number(room.failures || 0) <= 0) return '';
    var wayfarers = getRaidWayfarersForWing(mission, wingNum).filter(function (wf) { return wf && wf.status === 'ready'; });
    if (!wayfarers.length) {
      return '<div style="margin-top:.18rem;font-size:.66rem;color:var(--red2);">No ready Wayfarers available for recovery deploy.</div>';
    }
    return '<div style="margin-top:.2rem;padding:.25rem .3rem;border:1px dashed var(--border2);background:rgba(240,208,112,.06);">'
      + '<div style="font-size:.66rem;color:var(--gold2);margin-bottom:.12rem;">Recovery Deploy (after failure): choose one Wayfarer to reinforce this room (+2 room bonus).</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
      + wayfarers.map(function (wf) {
          return '<button class="btn btn-xs btn-warn" onclick="deployRaidWayfarerToRoom(' + mission.id + ',' + wingNum + ',' + roomIdx + ',' + wf.idx + ')">⚑ ' + String(wf.name || 'Wayfarer') + '</button>';
        }).join('')
      + '</div>'
      + '</div>';
  }

  window.toggleRaidRoomRole = function (missionId, wingNum, roomIdx, roleKey) {
    var mission = getMission(missionId);
    if (!mission) return;
    var roles = ensureLegacyRaidRoomRoleState(mission, wingNum, roomIdx);
    if (!roles || !roles.hasOwnProperty(roleKey)) return;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    var required = getLegacyRaidRequiredRolesForRoom(room);
    var wasActiveRequired = required.length && required.indexOf(roleKey) === (Number(roles.activeRequiredIndex || 0) % required.length);
    var nextValue = !roles[roleKey];
    roles[roleKey] = nextValue;
    if (nextValue && wasActiveRequired && required.length) {
      roles.activeRequiredIndex = (Number(roles.activeRequiredIndex || 0) + 1) % required.length;
    }
    openRaidWingPopup(missionId, wingNum, roomIdx);
  };

  function buildRaidRoomDetail(mission, wingNum, roomIdx) {
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var room = rooms && rooms[roomIdx];
    if (!room) return '';
    var theme = getRaidTheme(mission);
    var bossName = String(mission.legacyRaidBoss || 'the Boss');
    var run = ensureLegacyRaidRunState(mission);

    var typeColor = room.isBoss ? 'var(--red2)'
      : room.type === 'LoreReading' ? theme.tc
      : room.type === 'Puzzle' ? 'var(--teal)'
      : room.type === 'Loot' ? 'var(--gold)'
      : room.type === 'Combat' ? 'var(--red2)'
      : room.type === 'Trap' ? 'var(--gold2)'
      : room.type === 'Gambling' ? 'var(--gold2)'
      : room.type === 'Peril' ? 'var(--red3)'
      : room.type === 'TrophyCache' ? 'var(--gold)'
      : room.type === 'WayfarerPost' ? 'var(--gold2)'
      : 'var(--text2)';

    var briefByType = {
      Entry: 'Move in and establish position.',
      Puzzle: 'Solve the mechanism to open the route.',
      Combat: 'Enemy contact in this room.',
      Hazard: 'Environmental danger, keep formation tight.',
      Peril: 'High pressure lane; survive the push.',
      Trap: 'Disarm before the lane punishes movement.',
      Loot: 'Secure supplies and move on.',
      LoreReading: 'Recover lore clues for later wings.',
      WayfarerPost: 'Staging post: support and assignments.',
      Approach: 'Final approach lane to the chamber.',
      TrophyCache: 'Claim tactical reserve rewards.'
    };
    var roomType = String(room.type || 'Room');
    var brief = briefByType[roomType] || 'Resolve this room and advance.';
    var html = '<div id="raidRoom-' + mission.id + '-' + wingNum + '-' + roomIdx + '" class="room-block" style="border-left:3px solid ' + typeColor + ';padding-left:.5rem;margin-bottom:.4rem;">'
      + '<div class="rb-title" style="color:' + typeColor + ';">' + room.icon + ' Room ' + (roomIdx + 1) + ' — ' + room.label + '</div>'
      + '<div class="rb-text" style="font-size:.84rem;line-height:1.6;margin-bottom:.18rem;"><strong style="color:var(--text2);">Brief:</strong> ' + brief + '</div>'
      + '<div class="rb-text" style="font-size:.76rem;line-height:1.55;margin-bottom:.28rem;color:var(--muted2);">' + room.description + '</div>';

    if (room.result) {
      html += '<div style="padding:.22rem .35rem;background:rgba(255,255,255,.04);border-radius:3px;font-size:.76rem;color:var(--gold2);margin-bottom:.28rem;">' + room.result + '</div>';
    }

    if (!room.isBoss && room.discovered && !room.cleared && Number(room.progressNeeded || 1) > 1) {
      html += '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.2rem;">Progress: ' + Number(room.progress || 0) + '/' + Number(room.progressNeeded || 1) + ' successes · Failures: ' + Number(room.failures || 0) + '</div>';
    }
    if (!room.isBoss && room.discovered && !room.cleared) {
      html += buildLegacyRaidRoomRoleHtml(mission, wingNum, roomIdx, room);
      html += buildRaidFailedRoomRecoveryHtml(mission, wingNum, roomIdx, room);
    }

    if (room.cleared) {
      html += '<div style="font-size:.7rem;color:var(--green2);">✓ Cleared</div>';
    } else if (!room.discovered) {
      html += '<div style="font-size:.7rem;color:var(--muted2);">🔒 Not yet revealed.</div>';
    } else {

      // WayfarerPost: show wayfarer cards
      if (room.type === 'WayfarerPost') {
        var wayfarers = getRaidWayfarersForWing(mission, wingNum);
        html += '<div style="margin-bottom:.22rem;font-size:.68rem;color:var(--gold2);text-transform:uppercase;letter-spacing:.06em;">Traveling Wayfarers</div>';
        wayfarers.forEach(function (wf) {
          html += buildRaidWayfarerCard(mission, wf, wingNum, roomIdx);
        });
        html += '<div style="margin-top:.25rem;">'
          + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidRoom(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Continue Past Staging Post</button>'
          + '</div>';

      // Confrontation (Boss Room)
      } else if (room.isBoss) {
        var advDie = getLegacyRaidWayfarerActionDie();
        var encounter = ensureLegacyRaidBossEncounter(mission);
        if (encounter && !encounter.active) setLegacyRaidBossEncounterActive(mission, true);
        encounter = ensureLegacyRaidBossEncounter(mission);
        var runState = ensureLegacyRaidRunState(mission);
        var currentTurnNode = getLegacyRaidTimelineTurn(encounter);
        var dreadDieNow = getLegacyRaidBossDreadDie(encounter);
        var teamworkPool = getLegacyRaidTeamworkPool();
        var teamworkCosts = getLegacyRaidTeamworkBurstCosts(mission);
        var playerName = String(typeof S !== 'undefined' && S && S.name || 'Wayfarer');
        var playerActions = getLegacyRaidCombatActionLabels();
        if (!Array.isArray(playerActions) || !playerActions.length) {
          playerActions = ['Strike', 'Shoot', 'Defend', 'Move', 'Support', 'Control'];
        }
        var allies = getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; });
        var savedAlly = String(encounter.uiAllySelection || (allies[0] && allies[0].name) || 'Ally');
        var savedAllyAction = String(encounter.uiAllyAction || 'Defend');
        var allyOptionHtml = allies.length
          ? allies.map(function (wf) {
              var allyName = String(wf.name || 'Wayfarer');
              return '<option value="' + allyName + '"' + (allyName === savedAlly ? ' selected' : '') + '>' + allyName + '</option>';
            }).join('')
          : '<option value="Ally">Ally</option>';
        var turnStage = String(encounter.turnStage || 'player');
        var turnStageLabel = turnStage === 'player' ? 'Player Turn' : (turnStage === 'ally' ? 'Ally Turn' : 'Boss Turn');
        var maxPlayActions = typeof getMaxActions === 'function' ? getMaxActions() : 3;
        var currentPlayActions = Number(currentTurnNode && currentTurnNode.playerActionsLeft || maxPlayActions);
        var nextStepText = turnStage === 'player'
          ? ('Use your remaining actions, then allies will take over. Current beat: ' + String(currentTurnNode && currentTurnNode.beat || 'Unknown') + '.')
          : (turnStage === 'ally'
            ? 'Spend ally actions, then press Proceed To Boss Turn to hand control over.'
            : 'Resolve all boss actions. When the boss finishes, a fresh player round starts automatically.');
        var playerActionSelectHtml = '<div style="display:flex;gap:.2rem;flex-wrap:wrap;align-items:center;">'
          + '<select class="input" id="raidPlayerAct-' + mission.id + '" style="max-width:220px;">'
          + playerActions.map(function (label) { return '<option value="' + String(label).replace(/"/g, '&quot;') + '">' + label + '</option>'; }).join('')
          + '</select>'
          + '<span style="font-size:.64rem;color:var(--gold2);">Actions: ' + currentPlayActions + '/' + maxPlayActions + '</span>'
          + '<button class="btn btn-xs btn-primary" ' + (turnStage === 'player' && currentPlayActions > 0 ? '' : 'disabled') + ' onclick="window.executeLegacyRaidBossPlayerAction(' + mission.id + ',document.getElementById(\'raidPlayerAct-' + mission.id + '\').value)">Execute</button>'
          + '</div>';
        var playerRange = 'Engaged';
        if (typeof S !== 'undefined' && S && S.combatMap && Array.isArray(S.combatMap.units)) {
          var playerUnit = S.combatMap.units.find(function (u) { return !!u && (u.isPlayer || (u.side === 'ally' && String(u.name || '') === playerName)); });
          if (playerUnit && playerUnit.zone) playerRange = String(playerUnit.zone);
        }
        var bossMoveAdjacency = {
          Engaged: ['Close'],
          Close: ['Engaged', 'Nearby'],
          Nearby: ['Close', 'Far'],
          Far: ['Nearby']
        };
        var rangeButtons = (bossMoveAdjacency[playerRange] || ['Close']).map(function (zone) {
          return '<button class="btn btn-xs' + (playerRange === zone ? ' btn-primary' : '') + '" onclick="window.setLegacyRaidBossPlayerRange(' + mission.id + ',\'' + zone + '\')">' + zone + '</button>';
        }).join(' ');
        var flavorBranches = getLegacyRaidUnlockedFlavorBranches();
        var weaponStatusText = mission.legacyRaidBossRequiredWeapon
          ? ('Required finisher weapon: <strong>' + String(mission.legacyRaidBossRequiredWeapon) + '</strong> · '
            + (mission.legacyRaidBossWeaponAcquired
              ? '<span style="color:var(--green2);">Acquired</span>'
              : '<span style="color:var(--red2);">Missing (check Wing 2 armory loot)</span>'))
          : 'No special finisher weapon required.';
        var teamworkRow = '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin:.1rem 0 .14rem;">'
          + '<button class="btn btn-xs" ' + (teamworkPool >= teamworkCosts.prevent ? '' : 'disabled') + ' onclick="useLegacyRaidTeamworkBurst(' + mission.id + ',\'cancel_mechanic\')">10 TMW → cancel mechanic</button>'
          + '<button class="btn btn-xs" ' + (teamworkPool >= teamworkCosts.revive ? '' : 'disabled') + ' onclick="useLegacyRaidTeamworkBurst(' + mission.id + ',\'revive_ally\')">50 TMW → revive ally</button>'
          + '</div>';
        var telegraphText = String(encounter.lastTelegraph || 'No active telegraph.');
        var phaseProfile = encounter.phaseProfiles && encounter.phaseProfiles[Math.max(0, Number(encounter.phase || 1) - 1)] || null;
        var phaseFlavor = String(phaseProfile && phaseProfile.text || 'Boss pattern escalating.');
        if (!encounter.allyActionBudget || !encounter.allyActionBudget.byAlly) resetLegacyRaidAllyActionBudget(mission, encounter);
        var allyTurnButton = '<button class="btn btn-xs btn-teal" ' + (turnStage === 'ally' ? '' : 'disabled') + ' onclick="window.advanceLegacyRaidToBossTurn(' + mission.id + ')">Proceed To Boss Turn</button>';
        var allyLeftTotal = Math.max(0, Number(encounter.allyActionBudget.total || 0) - Number(encounter.allyActionBudget.used || 0));
        var allyStatusRows = allies.map(function (wf) {
          var allyNameRow = String(wf.name || 'Wayfarer');
          var allyHpRow = (encounter.partyHp && encounter.partyHp.allies && typeof encounter.partyHp.allies[allyNameRow] === 'number')
            ? Math.max(0, Number(encounter.partyHp.allies[allyNameRow]))
            : 12;
          var allyActsRow = Math.max(0, Number(encounter.allyActionBudget.byAlly && encounter.allyActionBudget.byAlly[allyNameRow] || 0));
          var allyFlavor = getLegacyRaidAllyFlavorProfile(allyNameRow);
          var allyStatus = allyHpRow > 0 ? '<span style="color:var(--green2);">●</span>' : '<span style="color:var(--red2);">●</span>';
          return '<div style="font-size:.61rem;color:var(--text2);line-height:1.36;padding:.04rem .08rem;border-bottom:1px solid rgba(255,255,255,.04);">'
            + allyStatus + ' <strong>' + allyNameRow + '</strong> · ' + allyHpRow + 'HP · ' + allyActsRow + '/2 · ' + allyFlavor.name
            + '</div>';
        }).join('');
        var allyActionPanel = '<div style="font-size:.66rem;color:var(--muted2);line-height:1.4;margin-bottom:.1rem;">'
          + '<strong>Defend:</strong> +3 Defend · <strong>Support:</strong> +3 Attack · <strong>Attack:</strong> d6 vs Boss Dread · <strong>Move:</strong> shift range'
          + '</div>'
          + '<div style="margin-bottom:.1rem;">' + allyStatusRows + '</div>'
          + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;align-items:center;margin-bottom:.08rem;">'
          + '<select class="input" id="raidAllySel-' + mission.id + '" style="max-width:140px;">' + allyOptionHtml + '</select>'
          + '<select class="input" id="raidAllyAct-' + mission.id + '" style="max-width:130px;" onchange="window.updateLegacyRaidAllyTargetOptions(' + mission.id + ')">'
          + '<option value="Defend"' + (savedAllyAction === 'Defend' ? ' selected' : '') + '>Defend</option>'
          + '<option value="Support"' + (savedAllyAction === 'Support' ? ' selected' : '') + '>Support</option>'
          + '<option value="Attack"' + (savedAllyAction === 'Attack' ? ' selected' : '') + '>Attack</option>'
          + '<option value="Move"' + (savedAllyAction === 'Move' ? ' selected' : '') + '>Move</option>'
          + '</select>'
          + '<select class="input" id="raidAllyTarget-' + mission.id + '" style="max-width:180px;">'
          + '<option value="' + playerName + '"' + (String(encounter.uiAllyTarget || '') === playerName ? ' selected' : '') + '>' + playerName + ' (You)</option>'
          + '</select>'
          + '<button class="btn btn-xs btn-primary" ' + (turnStage === 'ally' ? '' : 'disabled') + ' onclick="window.executeLegacyRaidBossAllyAction(' + mission.id + ',document.getElementById(\'raidAllySel-' + mission.id + '\').value,document.getElementById(\'raidAllyAct-' + mission.id + '\').value,document.getElementById(\'raidAllyTarget-' + mission.id + '\').value)">Execute Ally Action</button>'
          + '</div>'
          + '<div style="font-size:.63rem;color:var(--gold2);">Ally actions used this turn: ' + Number(encounter.allyActionsUsed || 0) + '/6 · Remaining: ' + allyLeftTotal + '</div>';
        var logHtml = Array.isArray(encounter.log) && encounter.log.length
          ? encounter.log.slice(-4).map(function (entry) { return '<div style="font-size:.67rem;color:var(--muted2);padding:.08rem 0;border-bottom:1px solid var(--border2);">' + entry + '</div>'; }).join('')
          : '<div style="font-size:.67rem;color:var(--muted2);">No boss phases resolved yet.</div>';
        var gmControls = isGMModeActive && isGMModeActive()
          ? '<div style="margin-top:.22rem;display:flex;gap:.22rem;flex-wrap:wrap;">'
            + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidBossRoom(' + mission.id + ',true)">GM: Boss Cleared</button>'
            + '<button class="btn btn-xs btn-red" onclick="window.resolveRaidBossRoom(' + mission.id + ',false)">GM: Boss Wipe</button>'
            + '</div>'
          : '';
        html += '<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.28);padding:.4rem .45rem;margin-bottom:.25rem;overflow:hidden;">'
          + '<div style="font-size:.72rem;color:var(--red2);font-family:\'Cinzel\',serif;margin-bottom:.12rem;">⚔ Confrontation Engaged — ' + bossName + '</div>'
          + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.5;margin-bottom:.15rem;">Turn flow: Player action → Allies (2 actions each, max 6 total) → Boss action.</div>'
          + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;align-items:center;margin-bottom:.2rem;">'
          + '<button class="btn btn-xs btn-warn" onclick="if(typeof switchTab===\'function\'){var b=document.querySelector(\'.tab-btn[onclick*=\\\"combat\\\"]\');switchTab(\'combat\',b||null);}">⚔ Open Combat Tab</button>'
          + '<button class="btn btn-xs btn-primary" onclick="if(typeof openWing3BossCombatModal===\'function\'){openWing3BossCombatModal(' + mission.id + ');}">🐉 Open Boss Modal</button>'
          + '<span style="font-size:.64rem;color:var(--muted2);">Boss + allies are seeded in the Combat Tab zone map automatically on entry.</span>'
          + '</div>'
          + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.24rem;margin-bottom:.18rem;">'
          + '<div style="border:1px solid var(--border2);background:rgba(20,90,120,.12);padding:.32rem .36rem;">'
          + '<div style="font-size:.72rem;color:var(--teal);margin-bottom:.12rem;"><strong>' + playerName + '</strong> · Player Panel</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;margin-bottom:.1rem;">Current Range: <strong style="color:var(--gold2);">' + playerRange + '</strong></div>'
          + '<div style="font-size:.66rem;color:var(--gold2);line-height:1.45;margin-bottom:.12rem;">Actions Available: ' + currentPlayActions + '/' + maxPlayActions + '</div>'
          + '<div style="font-size:.65rem;color:var(--teal);line-height:1.45;margin-bottom:.12rem;">Next Step: ' + nextStepText + '</div>'
          + '<div style="font-size:.64rem;color:var(--gold2);line-height:1.4;margin-bottom:.1rem;">Personal Flavor: ' + (flavorBranches.length ? flavorBranches.join(' · ') : 'None') + '</div>'
          + '<div style="margin-bottom:.12rem;">' + rangeButtons + '</div>'
          + '<div style="font-size:.64rem;color:var(--muted2);margin-bottom:.08rem;">Range guidance: Engaged uses Strike. Close supports some weapons, hacks, spells, and items. Nearby/Far support ranged options.</div>'
          + playerActionSelectHtml
          + '</div>'
          + '<div style="border:1px solid var(--border2);background:rgba(40,90,60,.12);padding:.32rem .36rem;">'
          + '<div style="font-size:.72rem;color:var(--green2);margin-bottom:.12rem;"><strong>Allies</strong> · Actions after your turn</div>'
          + allyActionPanel
          + '<div style="margin-top:.12rem;">' + allyTurnButton + '</div>'
          + '</div>'
          + '<div style="border:1px solid var(--border2);background:rgba(110,20,35,.14);padding:.32rem .36rem;">'
          + '<div style="font-size:.72rem;color:var(--red2);margin-bottom:.12rem;"><strong>' + bossName + '</strong> · Boss Panel</div>'
          + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.08rem;">Current Phase: ' + Number(encounter.phase || 1) + ' · Dread Die: d' + dreadDieNow + ' · HP ' + Number(encounter.phaseHp || 0) + '/' + Number(phaseProfile && phaseProfile.hp || 0) + '</div>'
          + '<div style="font-size:.64rem;color:var(--muted2);line-height:1.42;margin-bottom:.08rem;">' + phaseFlavor + '</div>'
          + '<div style="font-size:.67rem;color:var(--muted2);line-height:1.45;margin-bottom:.08rem;">Telegraph: ' + telegraphText + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;margin-bottom:.1rem;">Turn Stage: <strong style="color:var(--text2);">' + turnStageLabel + '</strong> · Boss actions left: ' + Math.max(0, Number(encounter.bossActionsLeft || 0)) + '/2</div>'
          + '<button class="btn btn-xs btn-red" ' + (turnStage === 'boss' ? '' : 'disabled') + ' onclick="window.triggerLegacyRaidBossAction(' + mission.id + ')">☠ Enemy Action</button>'
          + (encounter.bossReaction ? ('<div style="font-size:.63rem;color:var(--gold2);margin-top:.1rem;">' + encounter.bossReaction + '</div>') : '')
          + '</div>'
          + '</div>'
          + '<div style="margin-bottom:.14rem;">' + buildLegacyRaidBossZoneMap(mission) + '</div>'
          + '<div style="font-size:.66rem;color:var(--teal);margin-bottom:.1rem;">Current Beat: ' + String(currentTurnNode && currentTurnNode.beat || 'Unknown') + ' · Raid Timer: ' + Number(runState && runState.clockRemaining || 0) + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.08rem;">' + weaponStatusText + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.08rem;">Teamwork Pool: ' + teamworkPool + ' TMW</div>'
          + teamworkRow
          + '<div style="font-size:.69rem;color:var(--gold2);margin-bottom:.14rem;">Spend 100 TMW: Cinematic Success</div>'
          + '<button class="btn btn-xs btn-warn" ' + (teamworkPool >= teamworkCosts.cinematic ? '' : 'disabled') + ' onclick="useLegacyRaidTeamworkBurst(' + mission.id + ',\'cinematic_success\')">Spend 100 TMW: Cinematic Success</button>'
          + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.06rem;">Encounter Log</div>'
          + '<div style="max-height:96px;overflow:auto;border:1px solid var(--border2);padding:.2rem .28rem;background:rgba(0,0,0,.18);">' + logHtml + '</div>'
          + gmControls
          + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);">Use Teamwork spends to change outcomes, but expect the boss to react when mechanics are canceled.</div>';

      // Combat rooms: inline encounter card in wing view (same behavior style as boss confrontation panel)
      } else if (room.type === 'Combat') {
        var card = room.combatCard || null;
        if (!card) {
          var ddCombat = normalizeMissionDreadDie(room.dd || 6);
          var bonusCombat = Number(mission.bonus || 0) + getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx);
          card = ensureLegacyRaidCombatCardState(mission, wingNum, roomIdx, room, bonusCombat, ddCombat);
        }
        html += '<div style="margin-top:.22rem;padding:.32rem .36rem;border:1px solid rgba(200,50,50,.28);background:rgba(200,50,50,.06);">'
          + '<div style="font-size:.72rem;color:var(--red2);font-family:\'Cinzel\',serif;margin-bottom:.12rem;">⚔ Enemy Combat Engaged</div>'
          + buildLegacyRaidCombatCardContentHtml(mission, wingNum, roomIdx, room, card, true)
          + '</div>';
      // Standard rooms: action button
      } else {
        var btnLabel = room.type === 'Entry' ? '→ Enter Wing'
          : room.type === 'Hazard' ? '⛰ Push Through Hazard (' + getLegacyRaidRoomCheckLine('Hazard', room.dd) + ')'
          : room.type === 'Peril' ? '☠ Survive Peril Zone (' + getLegacyRaidRoomCheckLine('Peril', room.dd) + ')'
          : room.type === 'Trap' ? '⚠ Disarm Trap Lanes (' + getLegacyRaidRoomCheckLine('Trap', room.dd) + ')'
          : room.type === 'Gambling' ? '🂡 Play Wager Puzzle'
          : room.type === 'Loot' ? '📦 Breach Loot Stash (' + getLegacyRaidRoomCheckLine('Loot', room.dd) + ')'
          : room.type === 'LoreReading' ? '📜 Read Lore Fragment (' + getLegacyRaidRoomCheckLine('LoreReading', room.dd) + ')'
          : room.type === 'Puzzle' ? '🧩 Open Lock-Dial Puzzle'
          : room.type === 'Approach' ? (wingNum === 3 && roomIdx === 1
            ? '🌀 Room 2 — Chamber Breach Lockpick Minigame (clear to skip Phase 2)'
            : '🌀 Advance to Chamber (' + getLegacyRaidRoomCheckLine('Approach', room.dd) + ')')
          : room.type === 'TrophyCache' ? '💠 Claim Cache (' + getLegacyRaidRoomCheckLine('TrophyCache', room.dd) + ')'
          : '⚄ Explore (' + getLegacyRaidRoomCheckLine(room.type, room.dd) + ')';
        html += '<div style="margin-top:.22rem;">'
          + '<button class="btn btn-xs btn-teal" onclick="window.resolveRaidRoom(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">' + btnLabel + '</button>'
          + '</div>';
      }
    }
    html += '</div>';
    return html;
  }

  window.openRaidRoomDetail = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission) return;
    openRaidWingPopup(missionId, wingNum, roomIdx);
  };

  function openRaidWingPopup(missionId, wingNum, selectedRoomIdx) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    if (typeof openModal !== 'function') return false;
    var prevScrollTop = 0;
    if (typeof document !== 'undefined') {
      var prevContentEl = document.getElementById('modalContent');
      if (prevContentEl) prevScrollTop = Number(prevContentEl.scrollTop || 0);
    }
    function openWingModal(title, body) {
      openModal(title, body);
      if (typeof setTimeout === 'function') {
        setTimeout(function () {
          if (typeof document === 'undefined') return;
          var contentEl = document.getElementById('modalContent');
          if (contentEl) contentEl.scrollTop = prevScrollTop;
        }, 0);
      }
    }

    ensureLegacyRaidMissionConfig(mission);
    if (Number(wingNum || 0) === 3) {
      var openPhaseState = normalizeLegacyRaidBossPhaseState(mission, ensureLegacyRaidBossEncounter(mission), { openCinematic: true });
      if (openPhaseState === 'victory' || openPhaseState === 'cinematic') return true;
    }

    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var theme = getRaidTheme(mission);
    var run = ensureLegacyRaidRunState(mission);
    if (Number(wingNum || 1) === 2 && !(mission.steps && mission.steps[1] && mission.steps[1].completed)) {
      if (typeof showNotif === 'function') showNotif('Wing 2 is locked. Clear Wing 1 first.', 'warn');
      return openLegacyRaidMissionPopup(mission.id, null);
    }
    if (Number(wingNum || 1) === 3 && !(mission.steps && mission.steps[2] && mission.steps[2].completed)) {
      if (typeof showNotif === 'function') showNotif('Wing 3 is locked. Clear Wing 2 first.', 'warn');
      return openLegacyRaidMissionPopup(mission.id, null);
    }
    if (Number(wingNum || 1) === 1 && run && !run.preludeWing1Ready && !(mission.steps && mission.steps[1] && mission.steps[1].completed)) {
      if (typeof showNotif === 'function') showNotif('Wing 1 is locked until the raid prelude objective is completed.', 'warn');
      return openLegacyRaidPreludeModal(mission.id);
    }
    if (run) run.currentWing = wingNum;
    ensureLegacyRaidClock(mission);

    if (wingNum === 1 || wingNum === 2) {
      var scrollY = (typeof window !== 'undefined' && typeof window.scrollY === 'number') ? window.scrollY : 0;
      var gridState = ensureLegacyRaidWingGridState(mission, wingNum);
      if (!gridState) return false;

      // If wing is already completed, show a compact summary instead of the interactive grid
      var wingAlreadyDone = mission.steps && mission.steps[wingNum] && mission.steps[wingNum].completed;
      if (wingAlreadyDone) {
        var wingTitlesComp = ['', (mission.steps[1] && mission.steps[1].name) || 'Lore Wing', (mission.steps[2] && mission.steps[2].name) || 'Mechanic Wing'];
        var backBtnComp = '<button class="btn btn-xs" onclick="openLegacyRaidMissionPopup(' + missionId + ',null)">← Raid Overview</button>';
        var wingNavComp = [1, 2, 3].map(function (w) {
          var done = mission.steps && mission.steps[w] && mission.steps[w].completed;
          return '<button class="btn btn-xs' + (w === wingNum ? ' btn-teal' : '') + '" onclick="openRaidWingPopup(' + missionId + ',' + w + ')" ' + (w > 1 && !(mission.steps[w - 1] && mission.steps[w - 1].completed) && w !== wingNum ? 'disabled' : '') + '>Wing ' + w + (done ? ' ✓' : '') + '</button>';
        }).join('');
        var objComp = wingNum === 1
          ? 'Lore Fragments: ' + Number(gridState.objectives.loreCollected || 0) + '/' + Number(gridState.objectives.loreRequired || 3) + ' — All recovered.'
          : 'Door Waypoints: ' + Number(gridState.objectives.waypointsActivated || 0) + '/' + Number(gridState.objectives.waypointsRequired || 3) + ' — All activated.';
        var compHtml = '<div style="font-size:.9rem;color:var(--text);line-height:1.62;max-width:640px;">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.3rem;margin-bottom:.32rem;">'
          + '<div style="font-size:.98rem;color:var(--green2);font-family:\'Cinzel\',serif;"><strong>Wing ' + wingNum + ': ' + wingTitlesComp[wingNum] + ' — Completed ✓</strong></div>'
          + '<div style="display:flex;gap:.2rem;">' + wingNavComp + '</div>'
          + '</div>'
          + '<div style="border:1px solid rgba(60,180,90,.24);background:rgba(60,180,90,.06);padding:.42rem .5rem;margin-bottom:.28rem;border-radius:.2rem;">'
          + '<div style="font-size:.8rem;color:var(--green2);margin-bottom:.1rem;"><strong>' + objComp + '</strong></div>'
          + '<div style="font-size:.74rem;color:var(--text2);">This wing has been cleared. Loot was collected at the wing exit. Advance to the next wing from the Raid Overview.</div>'
          + '</div>'
          + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;justify-content:flex-end;">'
          + backBtnComp
          + (wingNum < 3 && !(mission.steps[wingNum + 1] && mission.steps[wingNum + 1].completed) ? '<button class="btn btn-xs btn-primary" onclick="openRaidWingPopup(' + missionId + ',' + (wingNum + 1) + ')">Enter Wing ' + (wingNum + 1) + ' →</button>' : '')
          + '</div>'
          + '</div>';
        openWingModal('Wing ' + wingNum + ': ' + wingTitlesComp[wingNum] + ' — ' + mission.title, compHtml);
        return true;
      }
      var objectives = gridState.objectives || {};
      var w1State = mission.legacyRaidWingGrid && mission.legacyRaidWingGrid['1'];
      var w2State = mission.legacyRaidWingGrid && mission.legacyRaidWingGrid['2'];
      var w1Obj = w1State && w1State.objectives ? w1State.objectives : null;
      var w2Obj = w2State && w2State.objectives ? w2State.objectives : null;
      var objectiveLine = wingNum === 1
        ? ('Lore Fragments: ' + Number(objectives.loreCollected || 0) + '/' + Number(objectives.loreRequired || 3))
        : ('Door Waypoints: ' + Number(objectives.waypointsActivated || 0) + '/' + Number(objectives.waypointsRequired || 3));
      var wingTitlesGrid = ['', (mission.steps[1] && mission.steps[1].name) || 'Lore Wing', (mission.steps[2] && mission.steps[2].name) || 'Mechanic Wing', (mission.steps[3] && mission.steps[3].name) || 'Boss Chamber'];
      var wingThemesGrid = ['', 'Story Gate', 'Mechanic Gate', 'Execution Gate'];
      if (typeof selectedRoomIdx === 'string' && gridState.cells && gridState.cells[selectedRoomIdx]) {
        gridState.selectedId = selectedRoomIdx;
      }
      if (!gridState.selectedId || !gridState.cells[gridState.selectedId]) gridState.selectedId = gridState.currentId;

      var backBtnGrid = '<button class="btn btn-xs" onclick="openLegacyRaidMissionPopup(' + missionId + ',null)">← Raid Overview</button>';
      var wingNavGrid = [1, 2, 3].map(function (w) {
        var done = mission.steps && mission.steps[w] && mission.steps[w].completed;
        return '<button class="btn btn-xs' + (w === wingNum ? ' btn-teal' : '') + '" onclick="openRaidWingPopup(' + missionId + ',' + w + ')" ' + (w > 1 && !(mission.steps[w - 1] && mission.steps[w - 1].completed) && w !== wingNum ? 'disabled' : '') + '>Wing ' + w + (done ? ' ✓' : '') + '</button>';
      }).join('');

      var wingGridHtml = buildLegacyRaidWingGridHtml(mission, wingNum, gridState);
      var detailHtml = buildLegacyRaidWingGridCellDetail(mission, wingNum, gridState);
      var vault = ensureLegacyRaidLootVault(mission);
      var vaultLootCount = vault && Array.isArray(vault.loot) ? vault.loot.length : 0;
      var keyLine = vault ? ('Keys B/S/G/P: ' + Number(vault.keys.bronze || 0) + '/' + Number(vault.keys.silver || 0) + '/' + Number(vault.keys.gold || 0) + '/' + Number(vault.keys.platinum || 0)) : '';
      var vaultCardHtml = buildLegacyRaidVaultCardHtml(mission);

      var htmlGrid = '<div style="font-size:.9rem;color:var(--text);line-height:1.62;max-width:1100px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.3rem;margin-bottom:.32rem;">'
        + '<div><div style="font-size:1rem;color:' + theme.tc + ';font-family:\'Cinzel\',serif;"><strong>Wing ' + wingNum + ': ' + wingTitlesGrid[wingNum] + '</strong></div>'
        + '<div style="font-size:.75rem;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;">' + wingThemesGrid[wingNum] + ' · 12x12 Tactical Branch Grid · Time ' + Number(gridState.ticks || 0) + ' ticks</div></div>'
        + '<div style="display:flex;gap:.2rem;">' + wingNavGrid + '</div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:.35rem;align-items:start;">'
        + '<div style="border:1px solid var(--border2);padding:.28rem;background:rgba(255,255,255,.02);overflow:auto;max-width:100%;">'
        + wingGridHtml
        + '</div>'
        + '<div style="display:flex;flex-direction:column;gap:.24rem;">'
        + '<div style="border:1px solid var(--border2);padding:.32rem;background:rgba(255,255,255,.03);font-size:.74rem;color:var(--text2);">'
        + '<div style="font-size:.8rem;color:var(--gold2);margin-bottom:.1rem;"><strong>Wing Objective</strong></div>'
        + '<div style="margin-bottom:.1rem;font-size:.78rem;color:var(--text);"><strong>' + objectiveLine + '</strong></div>'
        + '<div style="margin-bottom:.08rem;">Legend: S = Entrance · E = Exit · 📜 = Lore · 🧭 = Waypoint</div>'
        + '<div style="font-size:.68rem;color:var(--muted2);margin-top:.12rem;padding-top:.12rem;border-top:1px solid rgba(255,255,255,.05);">Other wings: W1 ' + (w1Obj ? (Number(w1Obj.loreCollected || 0) + '/' + Number(w1Obj.loreRequired || 3)) : '0/3') + ' · W2 ' + (w2Obj ? (Number(w2Obj.waypointsActivated || 0) + '/' + Number(w2Obj.waypointsRequired || 3)) : '0/3') + '</div>'
        + '</div>'
        + '<div style="border:1px solid var(--border2);padding:.32rem;background:rgba(255,255,255,.03);font-size:.74rem;color:var(--text2);">'
        + '<div style="font-size:.8rem;color:var(--gold2);margin-bottom:.1rem;"><strong>Vault Status</strong></div>'
        + '<div style="margin-bottom:.06rem;">Loot: ' + vaultLootCount + ' item(s)</div>'
        + '<div style="margin-bottom:.06rem;">Keys: B=' + Number(vault?.keys?.bronze || 0) + ' · S=' + Number(vault?.keys?.silver || 0) + ' · G=' + Number(vault?.keys?.gold || 0) + ' · P=' + Number(vault?.keys?.platinum || 0) + '</div>'
        + '<div style="font-size:.68rem;color:var(--muted2);">Resolved at raid end.</div>'
        + '</div>'
        + vaultCardHtml
        + detailHtml
        + '<div style="border:1px solid var(--border2);padding:.24rem .3rem;background:rgba(0,0,0,.18);font-size:.72rem;color:var(--teal);">'
        + String(gridState.lastLog || 'Select a revealed adjacent hex to act.')
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.28rem;">'
        + backBtnGrid
        + '</div>'
        + '</div>';
      openWingModal('Wing ' + wingNum + ': ' + wingTitlesGrid[wingNum] + ' — ' + mission.title, htmlGrid);
      return true;
    }

    if (wingNum === 3) {
      var bossRooms = rooms.filter(function (r) { return !!(r && r.isBoss); });
      if (bossRooms.length && bossRooms[0].discovered) {
        setLegacyRaidBossEncounterActive(mission, true);
        seedLegacyRaidBossCombatScene(mission);
      }
    }

    var scrollY = (typeof window !== 'undefined' && typeof window.scrollY === 'number') ? window.scrollY : 0;
    var cleared = rooms.filter(function (r) { return r.cleared; }).length;
    var total = rooms.length;
    var progressPct = Math.round(cleared / total * 100);
    var progressBar = '<div style="background:' + theme.hexFill + ';border:1px solid ' + theme.hexStroke + ';border-radius:4px;height:5px;margin-bottom:.35rem;">'
      + '<div style="background:' + theme.tc + ';height:100%;width:' + progressPct + '%;border-radius:4px;transition:width .3s;"></div>'
    + '</div>';

    var svgMap = buildRaidHexMapSvg(mission, wingNum);
    var wingTitles = ['', (mission.steps[1] && mission.steps[1].name) || 'Lore Wing', (mission.steps[2] && mission.steps[2].name) || 'Mechanic Wing', (mission.steps[3] && mission.steps[3].name) || 'Boss Chamber'];
    var wingThemes = ['', 'Story Gate', 'Mechanic Gate', 'Execution Gate'];
    var loreState = ensureLegacyRaidLorePieces(mission);
    var loreSummary = wingNum === 1 && loreState
      ? (' · Lore ' + Number(loreState.collected || 0) + '/' + Number(loreState.required || 3))
      : '';

    var roomDetailHtml = '';
    if (typeof selectedRoomIdx === 'number') {
      roomDetailHtml = buildRaidRoomDetail(mission, wingNum, selectedRoomIdx);
    } else {
      // Show all discovered rooms
      rooms.forEach(function (room, i) {
        if (room.discovered || room.frontier) {
          roomDetailHtml += buildRaidRoomDetail(mission, wingNum, i);
        }
      });
    }

    var backBtn = '<button class="btn btn-xs" onclick="openLegacyRaidMissionPopup(' + missionId + ',null)">← Raid Overview</button>';
    var wingNav = [1, 2, 3].map(function (w) {
      var done = mission.steps && mission.steps[w] && mission.steps[w].completed;
      return '<button class="btn btn-xs' + (w === wingNum ? ' btn-teal' : '') + '" onclick="openRaidWingPopup(' + missionId + ',' + w + ')" ' + (w > 1 && !(mission.steps[w - 1] && mission.steps[w - 1].completed) && w !== wingNum ? 'disabled' : '') + '>Wing ' + w + (done ? ' ✓' : '') + '</button>';
    }).join('');

    var html = '<div style="font-size:.9rem;color:var(--text);line-height:1.62;max-width:780px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.3rem;margin-bottom:.35rem;">'
      + '<div><div style="font-size:1rem;color:' + theme.tc + ';font-family:\'Cinzel\',serif;"><strong>Wing ' + wingNum + ': ' + wingTitles[wingNum] + '</strong></div>'
      + '<div style="font-size:.75rem;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;">' + wingThemes[wingNum] + ' · ' + cleared + '/' + total + ' rooms cleared · Time ' + Number(run && run.clockRemaining || 0) + ' ticks' + loreSummary + '</div></div>'
      + '<div style="display:flex;gap:.2rem;">' + wingNav + '</div>'
      + '</div>'
      + progressBar
      + svgMap
      + '<div style="margin-bottom:.25rem;">' + roomDetailHtml + '</div>'
      + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.3rem;">'
      + backBtn
      + '</div>'
    + '</div>';

    openWingModal('Wing ' + wingNum + ': ' + wingTitles[wingNum] + ' — ' + mission.title, html);
    if (wingNum === 3 && typeof window.updateLegacyRaidAllyTargetOptions === 'function') {
      setTimeout(function () {
        try { window.updateLegacyRaidAllyTargetOptions(missionId); } catch (_err) {}
      }, 0);
    }
    return true;
  }

  function ensureLegacyRaidCombatCardState(mission, wingNum, roomIdx, room, totalBonus, dd) {
    if (!mission || !room || room.type !== 'Combat') return null;
    if (!room.combatCard || typeof room.combatCard !== 'object' || Number(room.combatCard.version || 0) !== 1) {
      var enemyCount = Math.max(1, Math.min(4, Number(room.enemyCount || 1)));
      var enemies = [];
      var hpBase = Math.max(4, Number(dd || room.dd || 7));
      for (var i = 0; i < enemyCount; i++) {
        enemies.push({
          id: i + 1,
          name: 'Hostile ' + (i + 1),
          hp: hpBase,
          maxHp: hpBase
        });
      }
      room.combatCard = {
        version: 1,
        active: true,
        round: 1,
        actionsPerRound: 4,
        actionsLeft: 4,
        allyPending: true,
        suppressStacks: 0,
        playerHp: Math.max(10, hpBase * 2 + 4),
        playerMaxHp: Math.max(10, hpBase * 2 + 4),
        strikeDie: getLegacyRaidCombatActionDie('strike'),
        shootDie: getLegacyRaidCombatActionDie('shoot'),
        actionDie: getLegacyRaidBestCombatDie(),
        roomDd: Math.max(4, Number(dd || room.dd || 7)),
        roomBonus: Math.max(0, Number(totalBonus || 0)),
        enemies: enemies,
        log: []
      };
    }
    room.combatCard.strikeDie = getLegacyRaidCombatActionDie('strike');
    room.combatCard.shootDie = getLegacyRaidCombatActionDie('shoot');
    room.combatCard.actionDie = getLegacyRaidBestCombatDie();
    return room.combatCard;
  }

  function resolveLegacyRaidContest(actionDie, dreadDie, bonus) {
    var ad = Math.max(4, Number(actionDie || 8));
    var dd = Math.max(4, Number(dreadDie || 6));
    var actionRoll = typeof explodingRoll === 'function' ? explodingRoll(ad) : { total: (Math.floor(Math.random() * ad) + 1), exploded: false };
    var dreadRoll = typeof roll === 'function' ? roll(dd) : (Math.floor(Math.random() * dd) + 1);
    var total = Number(actionRoll.total || 0) + Math.max(0, Number(bonus || 0));
    return {
      success: total >= dreadRoll,
      actionDie: ad,
      dreadDie: dd,
      actionRoll: Number(actionRoll.total || 0),
      dreadRoll: Number(dreadRoll || 0),
      total: total
    };
  }

  function runLegacyRaidWayfarerOpening(mission, card) {
    if (!mission || !card || !card.allyPending) return;
    card.allyPending = false;
    var wayfarers = Array.isArray(mission.raidWayfarers) ? mission.raidWayfarers.filter(function (wf) {
      return wf && (wf.status === 'ready' || wf.status === 'deployed');
    }) : [];
    if (!wayfarers.length) {
      card.log.push('No allied Wayfarers survived to act this round.');
      return;
    }
    var alive = card.enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
    if (!alive.length) return;
    wayfarers.slice(0, 3).forEach(function (wf) {
      var targetAlive = card.enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
      if (!targetAlive.length) return;
      var target = targetAlive[0];
      var contest = resolveLegacyRaidContest(Number(wf.dd || 6), Number(card.roomDd || 6), 0);
      if (contest.success) {
        target.hp = Math.max(0, Number(target.hp || 0) - 1);
        card.log.push(String(wf.name || 'Wayfarer') + ' acts after you and hits ' + target.name + ' (DD6=' + contest.actionRoll + ' vs d' + contest.dreadDie + '=' + contest.dreadRoll + ').');
      } else {
        card.log.push(String(wf.name || 'Wayfarer') + ' acts after you but misses (DD6=' + contest.actionRoll + ' vs d' + contest.dreadDie + '=' + contest.dreadRoll + ').');
      }
    });
  }

  function buildLegacyRaidCombatZoneSummary() {
    if (typeof S === 'undefined' || !S || !S.combatMap || !Array.isArray(S.combatMap.units) || !S.combatMap.units.length) return '';
    var zones = ['Engaged', 'Close', 'Nearby', 'Far'];
    return '<div style="display:grid;grid-template-columns:repeat(4,minmax(70px,1fr));gap:.16rem;margin:.18rem 0;">'
      + zones.map(function (zone) {
          var units = S.combatMap.units.filter(function (unit) { return unit && String(unit.zone || '') === zone; });
          var allies = units.filter(function (unit) { return unit.side === 'ally'; }).length;
          var enemies = units.filter(function (unit) { return unit.side === 'enemy'; }).length;
          return '<div style="border:1px solid var(--border2);padding:.16rem .2rem;background:rgba(255,255,255,.03);">'
            + '<div style="font-size:.62rem;color:var(--gold2);text-transform:uppercase;letter-spacing:.06em;">' + zone + '</div>'
            + '<div style="font-size:.65rem;color:var(--muted2);">Allies ' + allies + ' · Enemies ' + enemies + '</div>'
            + '</div>';
        }).join('')
      + '</div>';
  }

  function runLegacyRaidEnemyTurn(card) {
    if (!card) return;
    var alive = card.enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
    if (!alive.length) return;
    var defendDie = Math.max(4, Number(card.actionDie || 8));
    alive.forEach(function (enemy) {
      for (var n = 0; n < 2; n++) {
        var contest = resolveLegacyRaidContest(defendDie, Number(card.roomDd || 6), 0);
        var blocked = contest.success;
        if (Number(card.suppressStacks || 0) > 0) {
          blocked = true;
          card.suppressStacks = Math.max(0, Number(card.suppressStacks || 0) - 1);
        }
        if (blocked) {
          card.log.push(enemy.name + ' action blocked (d' + contest.actionDie + '=' + contest.actionRoll + ' vs d' + contest.dreadDie + '=' + contest.dreadRoll + ').');
        } else {
          card.playerHp = Math.max(0, Number(card.playerHp || 0) - 1);
          card.log.push(enemy.name + ' lands a hit for 1 damage (d' + contest.actionDie + '=' + contest.actionRoll + ' vs d' + contest.dreadDie + '=' + contest.dreadRoll + ').');
        }
      }
    });
  }

  function buildLegacyRaidCombatCardContentHtml(mission, wingNum, roomIdx, room, card, inlineMode) {
    if (!mission || !room || !card) return '';
    var enemies = Array.isArray(card.enemies) ? card.enemies : [];
    var alive = enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
    var enemyHtml = enemies.map(function (enemy) {
      var hp = Math.max(0, Number(enemy.hp || 0));
      var maxHp = Math.max(1, Number(enemy.maxHp || hp || 1));
      var pct = Math.max(0, Math.min(100, Math.round(hp / maxHp * 100)));
      return '<div style="padding:.24rem .28rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);margin-bottom:.18rem;">'
        + '<div style="display:flex;justify-content:space-between;gap:.3rem;align-items:center;">'
        + '<span style="font-size:.72rem;color:var(--text2);">' + String(enemy.name || 'Hostile') + '</span>'
        + '<span style="font-size:.68rem;color:' + (hp > 0 ? 'var(--red2)' : 'var(--green2)') + ';">' + (hp > 0 ? ('HP ' + hp + '/' + maxHp) : 'Defeated') + '</span>'
        + '</div>'
        + '<div style="margin-top:.12rem;height:4px;background:var(--surface);border:1px solid var(--border2);">'
        + '<div style="height:100%;width:' + pct + '%;background:' + (hp > 0 ? 'var(--red2)' : 'var(--green2)') + ';"></div>'
        + '</div>'
      + '</div>';
    }).join('');
    var logHtml = Array.isArray(card.log) && card.log.length
      ? card.log.slice(-6).map(function (line) { return '<div style="font-size:.67rem;color:var(--muted2);padding:.08rem 0;border-bottom:1px solid var(--border2);">' + line + '</div>'; }).join('')
      : '<div style="font-size:.67rem;color:var(--muted2);">No combat actions yet.</div>';
    var livingWayfarers = (Array.isArray(mission.raidWayfarers) ? mission.raidWayfarers : []).filter(function (wf) {
      return wf && wf.status !== 'failed';
    }).length;
    var turnOrder = '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.18rem;">Turn Order: <strong style="color:var(--text2);">You</strong> → <strong style="color:var(--teal);">Allies</strong> (DD6 | 12 Stress survivors: ' + livingWayfarers + ') → <strong style="color:var(--red2);">Enemies</strong></div>';
    var footer = inlineMode
      ? ''
      : ('<div style="display:flex;justify-content:flex-end;">'
          + '<button class="btn btn-xs" onclick="openRaidWingPopup(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Back To Room</button>'
          + '</div>');
    return '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="margin-bottom:.2rem;">Turn-based raid combat card. Your combat dice are pulled from the Combat tab, allies act second, then enemy phases resolve.</div>'
      + turnOrder
      + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.2rem;">Round ' + Number(card.round || 1) + ' · Actions Left ' + Number(card.actionsLeft || 0) + '/' + Number(card.actionsPerRound || 4) + ' · ' + buildLegacyRaidCombatDieSummary() + ' · Dread d' + Number(card.roomDd || room.dd || 7) + '</div>'
      + '<div style="margin-bottom:.22rem;padding:.22rem .28rem;border:1px solid var(--border2);background:rgba(70,120,220,.08);">'
      + '<div style="font-size:.7rem;color:var(--text2);">Raid Team HP: <strong style="color:var(--teal);">' + Math.max(0, Number(card.playerHp || 0)) + '/' + Math.max(1, Number(card.playerMaxHp || 1)) + '</strong> · Enemies Remaining: <strong style="color:var(--red2);">' + alive.length + '</strong></div>'
      + '</div>'
      + buildLegacyRaidCombatZoneSummary()
      + '<div style="margin-bottom:.22rem;">' + enemyHtml + '</div>'
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.22rem;">'
      + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidCombatCardAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'strike\')">Strike (target first alive)</button>'
      + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidCombatCardAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'shoot\')">Shoot (target first alive)</button>'
      + '<button class="btn btn-xs btn-teal" onclick="window.resolveRaidCombatCardAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'suppress\')">Suppress</button>'
      + '<button class="btn btn-xs" onclick="window.resolveRaidCombatCardAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'recover\')">Recover</button>'
      + '<button class="btn btn-xs btn-warn" onclick="window.resolveRaidCombatCardAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'end\')">End Player Turn</button>'
      + '</div>'
      + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.08rem;">Combat Log</div>'
      + '<div style="max-height:92px;overflow:auto;border:1px solid var(--border2);padding:.2rem .26rem;background:rgba(0,0,0,.16);margin-bottom:.22rem;">' + logHtml + '</div>'
      + footer
      + '</div>';
  }

  function renderLegacyRaidCombatCard(mission, wingNum, roomIdx, room, card) {
    if (!mission || !room || !card) return false;
    openModal('Combat Room — ' + room.label, buildLegacyRaidCombatCardContentHtml(mission, wingNum, roomIdx, room, card, false));
    return true;
  }

  window.resolveRaidCombatCardAction = function (missionId, wingNum, roomIdx, actionKey) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var rooms = map && map.wings ? map.wings[wingNum] : null;
    var room = rooms && rooms[roomIdx];
    if (!room || room.type !== 'Combat') return false;
    var card = room.combatCard;
    if (!card) return false;
    card.strikeDie = getLegacyRaidCombatActionDie('strike');
    card.shootDie = getLegacyRaidCombatActionDie('shoot');
    card.actionDie = getLegacyRaidBestCombatDie();
    var enemies = Array.isArray(card.enemies) ? card.enemies : [];
    var perks = ensureLegacyRaidPerks(mission);
    var playerHitBonus = Math.max(0, Number(card.roomBonus || 0) + Number(perks.assaultBonus || 0));
    var strikeTalentBonus = getLegacyRaidStrikeTalentBonus();
    var teamworkFeedback = getLegacyRaidTalentRank('teamwork_feedback') > 0;

    var alive = enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
    if (!alive.length) {
      room.combatCard = null;
      if (typeof closeModal === 'function') closeModal();
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }

    if (actionKey === 'end') {
      card.actionsLeft = 0;
    } else if (Number(card.actionsLeft || 0) > 0) {
      if (actionKey === 'strike') {
        var target = enemies.filter(function (e) { return Number(e.hp || 0) > 0; })[0];
        if (target) {
          var strikeContest = resolveLegacyRaidContest(Number(card.strikeDie || card.actionDie || 8), Number(card.roomDd || room.dd || 7), playerHitBonus + strikeTalentBonus);
          if (strikeContest.success) {
            var dmg = 1 + (strikeContest.total - strikeContest.dreadRoll >= 4 ? 1 : 0);
            target.hp = Math.max(0, Number(target.hp || 0) - dmg);
            card.log.push('Strike success on ' + target.name + ': d' + strikeContest.actionDie + '=' + strikeContest.actionRoll + ' +' + (playerHitBonus + strikeTalentBonus) + ' vs d' + strikeContest.dreadDie + '=' + strikeContest.dreadRoll + ' (' + dmg + ' dmg).');
            if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
          } else {
            card.log.push('Strike failed: d' + strikeContest.actionDie + '=' + strikeContest.actionRoll + ' +' + (playerHitBonus + strikeTalentBonus) + ' vs d' + strikeContest.dreadDie + '=' + strikeContest.dreadRoll + '.');
            if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
          }
        }
      } else if (actionKey === 'shoot') {
        var rangedTarget = enemies.filter(function (e) { return Number(e.hp || 0) > 0; })[0];
        if (rangedTarget) {
          var shootContest = resolveLegacyRaidContest(Number(card.shootDie || card.actionDie || 8), Number(card.roomDd || room.dd || 7), playerHitBonus);
          if (shootContest.success) {
            var rangedDmg = 1 + (shootContest.total - shootContest.dreadRoll >= 4 ? 1 : 0);
            rangedTarget.hp = Math.max(0, Number(rangedTarget.hp || 0) - rangedDmg);
            card.log.push('Shoot success on ' + rangedTarget.name + ': d' + shootContest.actionDie + '=' + shootContest.actionRoll + ' +' + playerHitBonus + ' vs d' + shootContest.dreadDie + '=' + shootContest.dreadRoll + ' (' + rangedDmg + ' dmg).');
            if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
          } else {
            card.log.push('Shoot failed: d' + shootContest.actionDie + '=' + shootContest.actionRoll + ' +' + playerHitBonus + ' vs d' + shootContest.dreadDie + '=' + shootContest.dreadRoll + '.');
            if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
          }
        }
      } else if (actionKey === 'suppress') {
        var supContest = resolveLegacyRaidContest(Number(card.actionDie || 8), Number(card.roomDd || room.dd || 7), playerHitBonus);
        if (supContest.success) {
          card.suppressStacks = Number(card.suppressStacks || 0) + 2;
          card.log.push('Suppress success: next 2 enemy actions are blocked.');
        } else {
          card.log.push('Suppress failed: no block generated this action.');
        }
      } else if (actionKey === 'recover') {
        var recContest = resolveLegacyRaidContest(Number(card.actionDie || 8), Number(card.roomDd || room.dd || 7), playerHitBonus);
        if (recContest.success) {
          var healAmount = 1 + (recContest.total - recContest.dreadRoll >= 4 ? 1 : 0);
          if (Number(perks.freeRecoverPerWing || 0) > 0 && !card.freeRecoverUsed) {
            healAmount += 1;
            card.freeRecoverUsed = true;
          }
          card.playerHp = Math.min(Number(card.playerMaxHp || 12), Number(card.playerHp || 0) + healAmount);
          card.log.push('Recover success: +' + healAmount + ' HP.');
        } else {
          card.log.push('Recover failed: no HP restored.');
        }
      }
      card.actionsLeft = Math.max(0, Number(card.actionsLeft || 0) - 1);
    }

    alive = enemies.filter(function (e) { return Number(e.hp || 0) > 0; });
    if (!alive.length) {
      room.combatCard = null;
      if (typeof closeModal === 'function') closeModal();
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }

    if (Number(card.actionsLeft || 0) <= 0) {
      runLegacyRaidWayfarerOpening(mission, card);
      runLegacyRaidEnemyTurn(card);
      if (Number(card.playerHp || 0) <= 0) {
        room.combatCard = null;
        if (typeof closeModal === 'function') closeModal();
        return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
      }
      card.round = Number(card.round || 1) + 1;
      card.actionsLeft = Number(card.actionsPerRound || 4);
      card.allyPending = true;
    }

    return openRaidWingPopup(missionId, wingNum, roomIdx);
  };

  function ensureLegacyRaidGamblingState(mission, wingNum, roomIdx) {
    var map = ensureRaidHexMap(mission);
    var rooms = map && map.wings ? map.wings[wingNum] : null;
    var room = rooms && rooms[roomIdx];
    if (!room || room.type !== 'Gambling') return null;
    if (!room.gambleState || typeof room.gambleState !== 'object') {
      var perks = ensureLegacyRaidPerks(mission);
      room.gambleState = {
        wins: 0,
        losses: 0,
        chips: 3 + Math.max(0, Number(perks.gamblingChipBonus || 0)),
        targetWins: 2,
        handsPlayed: 0,
        lastHand: null,
        log: []
      };
    }
    return room.gambleState;
  }

  function openLegacyRaidGamblingPuzzle(missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Gambling') return false;
    var gamble = ensureLegacyRaidGamblingState(mission, wingNum, roomIdx);
    if (!gamble) return false;
    var logHtml = Array.isArray(gamble.log) && gamble.log.length
      ? gamble.log.slice(-5).map(function (line) { return '<div style="font-size:.67rem;color:var(--muted2);padding:.08rem 0;border-bottom:1px solid var(--border2);">' + line + '</div>'; }).join('')
      : '<div style="font-size:.67rem;color:var(--muted2);">No hands played yet.</div>';
    var lastHandHtml = gamble.lastHand
      ? '<div style="margin-bottom:.22rem;padding:.22rem .28rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);font-size:.68rem;color:var(--muted2);">'
        + 'Last Hand: ' + gamble.lastHand
        + '</div>'
      : '';
    var guessRow = function (mode, die, label, tone) {
      return '<div style="margin-bottom:.18rem;padding:.22rem .28rem;border:1px solid var(--border2);background:rgba(255,255,255,.03);">'
        + '<div style="font-size:.69rem;color:' + tone + ';margin-bottom:.1rem;">' + label + ' · Gatekeeper d' + die + '</div>'
        + '<div style="font-size:.66rem;color:var(--muted2);margin-bottom:.14rem;">Roll two gatekeeper dice, then roll your Wayfarer Adventure Die and guess whether it lands under, middle, or over. Matching either gatekeeper die still counts as middle.</div>'
        + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;">'
        + '<button class="btn btn-xs" onclick="window.submitLegacyRaidGambleHand(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'' + mode + '\',\'under\')">Guess Under</button>'
        + '<button class="btn btn-xs btn-primary" onclick="window.submitLegacyRaidGambleHand(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'' + mode + '\',\'middle\')">Guess Middle</button>'
        + '<button class="btn btn-xs btn-warn" onclick="window.submitLegacyRaidGambleHand(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'' + mode + '\',\'over\')">Guess Over</button>'
        + '</div>'
        + '</div>';
    };
    openModal(
      'Gambling Table — ' + room.label,
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="margin-bottom:.24rem;">Win <strong style="color:var(--gold2);">' + Number(gamble.targetWins || 2) + '</strong> hands before taking 2 losses. Low stakes uses gatekeeper d20. High stakes uses gatekeeper d4 and awards 2 wins on a hit.</div>'
      + '<div style="font-size:.7rem;color:var(--gold2);margin-bottom:.18rem;">Wins: ' + Number(gamble.wins || 0) + ' · Losses: ' + Number(gamble.losses || 0) + ' · Chips: ' + Number(gamble.chips || 0) + '</div>'
      + lastHandHtml
      + guessRow('safe', 20, 'Low Stakes', 'var(--teal)')
      + guessRow('high', 4, 'High Stakes', 'var(--red2)')
      + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.08rem;">Table Log</div>'
      + '<div style="max-height:96px;overflow:auto;border:1px solid var(--border2);padding:.2rem .26rem;background:rgba(0,0,0,.16);margin-bottom:.22rem;">' + logHtml + '</div>'
      + '<div style="display:flex;justify-content:flex-end;">'
      + '<button class="btn btn-xs" onclick="openRaidWingPopup(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Back To Room</button>'
      + '</div>'
      + '</div>'
    );
    return true;
  }

  window.submitLegacyRaidGambleHand = function (missionId, wingNum, roomIdx, mode, guess) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Gambling') return false;
    var gamble = ensureLegacyRaidGamblingState(mission, wingNum, roomIdx);
    if (!gamble) return false;

    var assist = getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx);
    var stakeDie = String(mode || 'safe') === 'high' ? 4 : 20;
    var lowHouse = typeof roll === 'function' ? roll(stakeDie) : (Math.floor(Math.random() * stakeDie) + 1);
    var highHouse = typeof roll === 'function' ? roll(stakeDie) : (Math.floor(Math.random() * stakeDie) + 1);
    var sortedLow = Math.min(lowHouse, highHouse);
    var sortedHigh = Math.max(lowHouse, highHouse);
    var advDie = getLegacyRaidWayfarerActionDie();
    var playerRoll = typeof roll === 'function' ? roll(advDie) : (Math.floor(Math.random() * advDie) + 1);
    if (assist > 0 && String(mode || 'safe') === 'safe') playerRoll = Math.min(advDie, playerRoll + 1);
    var outcome = playerRoll < sortedLow ? 'under' : (playerRoll > sortedHigh ? 'over' : 'middle');
    var success = String(guess || '') === outcome;
    var winValue = String(mode || 'safe') === 'high' ? 2 : 1;
    gamble.handsPlayed = Number(gamble.handsPlayed || 0) + 1;
    gamble.chips = Math.max(0, Number(gamble.chips || 0) - (String(mode || 'safe') === 'high' ? 1 : 0));

    gamble.lastHand = 'Gatekeeper d' + stakeDie + ': [' + sortedLow + ', ' + sortedHigh + '] · Adventure d' + advDie + ': ' + playerRoll + ' · guessed ' + String(guess || 'unknown') + ' · actual ' + outcome + '.';
    if (success) {
      gamble.wins = Number(gamble.wins || 0) + winValue;
      gamble.log.push('Hand ' + gamble.handsPlayed + ': win (' + gamble.lastHand + ')');
    } else {
      gamble.losses = Number(gamble.losses || 0) + 1;
      gamble.log.push('Hand ' + gamble.handsPlayed + ': loss (' + gamble.lastHand + ')');
    }

    if (Number(gamble.wins || 0) >= Number(gamble.targetWins || 2)) {
      if (typeof closeModal === 'function') closeModal();
      room.gambleState = null;
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }
    if (Number(gamble.losses || 0) >= 2 || Number(gamble.chips || 0) <= 0) {
      if (typeof closeModal === 'function') closeModal();
      room.gambleState = null;
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
    }
    return openLegacyRaidGamblingPuzzle(missionId, wingNum, roomIdx);
  };

  window.resolveRaidRoom = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission) return;
    ensureLegacyRaidMissionConfig(mission);
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var room = rooms && rooms[roomIdx];
    if (!room || room.cleared) return;

    var theme = getRaidTheme(mission);
    var run = ensureLegacyRaidRunState(mission);
    var manualMode = typeof isMissionManualRollMode === 'function' && isMissionManualRollMode();

    // Entry room: free pass, just reveal next
    if (room.type === 'Entry' || room.dd === 0) {
      var wingReset = resetLegacyRaidClockAtWingEntry(mission, wingNum);
      room.cleared = true;
      room.result = '→ Threshold crossed. Raid timer reset to ' + Number(wingReset || ensureLegacyRaidClock(mission)) + ' ticks for Wing ' + wingNum + '.';
      _raidRevealNextRoom(rooms, roomIdx);
      openRaidWingPopup(missionId, wingNum);
      return;
    }

    // WayfarerPost with no action needed other than pass-through
    if (room.type === 'WayfarerPost') {
      if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
      room.cleared = true;
      room.result = '⚑ Staging post secured. Wayfarers hold the flanks.';
      _raidRevealNextRoom(rooms, roomIdx);
      _checkRaidWingComplete(mission, wingNum, rooms);
      openRaidWingPopup(missionId, wingNum);
      return;
    }

    if (wingNum === 3 && room.type === 'Approach' && roomIdx === 1 && !room.breachPuzzleResolved && typeof window.openSharedPuzzleChallenge === 'function') {
      room.breachPuzzleResolved = true;
      return window.openSharedPuzzleChallenge({
        source: 'puzzle',
        title: 'Room 2 — Chamber Breach Lockpick Maze',
        prompt: 'Optional puzzle: reroute the chamber lockflow. Success will skip the raid boss Phase 2 escalation.',
        mode: 'pipe_flow',
        reward: { credits: 20, renown: 0, item: 'Breach Override Key' },
        onSuccess: function () {
          mission.legacyRaidSkipPhase2 = true;
          var enc = ensureLegacyRaidBossEncounter(mission);
          if (enc) enc.skipPhaseTwoPending = true;
          room.result = 'Optional breach puzzle solved. Boss Phase 2 will be skipped.';
          if (typeof showNotif === 'function') showNotif('Breach override secured: boss Phase 2 skip armed.', 'good');
          if (openLegacyRaidBossCinematic(mission.id)) return true;
          return openRaidWingPopup(mission.id, wingNum, roomIdx);
        },
        onFail: function () {
          room.result = 'Optional breach puzzle skipped or failed. Boss fight proceeds through all phases.';
          if (typeof showNotif === 'function') showNotif('Breach override not secured. Phase 2 remains active.', 'warn');
          return openRaidWingPopup(mission.id, wingNum, roomIdx);
        }
      });
    }

    if (room.type === 'Puzzle') {
      if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
      openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
      return;
    }

    if (room.type === 'Gambling') {
      if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
      openLegacyRaidGamblingPuzzle(missionId, wingNum, roomIdx);
      return;
    }

    var advDie = getLegacyRaidBestCombatDie();
    var bonus = Number(mission.bonus || 0);
    // Deployed wayfarers give a bonus in this wing
    var wayfarerBonus = 0;
    if (Array.isArray(mission.raidWayfarers)) {
      mission.raidWayfarers.forEach(function (wf) {
        if (wf.status === 'deployed' && Number(wf.wing || 0) === wingNum) wayfarerBonus += 2;
      });
    }
    var cleanBonus = (run && run.wingClean && run.wingClean[wingNum - 1]) ? 2 : 0;
    var assistBonus = getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx);
    var roleGate = evaluateLegacyRaidRoomRoleReadiness(mission, wingNum, roomIdx, room);
    if (!roleGate.ready) {
      if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
      room.failures = Number(room.failures || 0) + 1;
      room.result = '✗ Coordination failure. Missing roles: ' + roleGate.missing.join(', ') + '. Re-assign before retrying.';
      pushLegacyRaidReplayEvent(mission, {
        cause: 'Room coordination failure',
        detail: room.label + ' missing roles: ' + roleGate.missing.join(', ') + '.',
        hint: 'Assign required roles before taking the room action.'
      });
      if (run) markLegacyRaidWingOutcome(mission, wingNum, false);
      if (typeof showNotif === 'function') showNotif('Missing required roles for ' + room.label + ': ' + roleGate.missing.join(', '), 'warn');
      openRaidWingPopup(missionId, wingNum, roomIdx);
      return;
    }
    var totalBonus = bonus + wayfarerBonus + cleanBonus + assistBonus + Number(roleGate.bonus || 0);
    var dd = normalizeMissionDreadDie(room.dd || 6);

    if (room.type === 'Combat') {
      if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
      ensureLegacyRaidCombatCardState(mission, wingNum, roomIdx, room, totalBonus, dd);
      return openRaidWingPopup(missionId, wingNum, roomIdx);
    }

    var success, advR, dreadR;
    if (manualMode) {
      // In manual mode: show result popup with Pass/Fail buttons similar to existing system
      openModal('Room Roll — ' + room.label,
        '<div style="font-size:.84rem;color:var(--muted3);line-height:1.55;margin-bottom:.4rem;">'
        + room.description
        + '</div>'
        + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.45rem .55rem;margin-bottom:.4rem;">'
        + '<div style="font-size:.8rem;color:var(--text2);">Roll Combat Die (' + buildLegacyRaidCombatDieSummary() + ')' + (totalBonus ? ' + ' + totalBonus : '') + ' vs Dread d' + dd + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);">Wayfarers: +' + wayfarerBonus + ' · Room assist: +' + assistBonus + ' · Prior wing clean: +' + cleanBonus + ' · Roles: +' + Number(roleGate.bonus || 0) + ' · Bonus: +' + bonus + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-red" onclick="window._resolveRaidRoomOutcome(' + missionId + ',' + wingNum + ',' + roomIdx + ',false);closeModal();">✗ Failure</button>'
        + '<button class="btn btn-sm btn-primary" onclick="window._resolveRaidRoomOutcome(' + missionId + ',' + wingNum + ',' + roomIdx + ',true);closeModal();">✓ Success</button>'
        + '</div>'
      );
      return;
    }

    if (consumeLegacyRaidClock(mission, wingNum, room.label)) return;
    advR = typeof explodingRoll === 'function' ? explodingRoll(advDie) : { total: Math.floor(Math.random() * advDie) + 1 + totalBonus, exploded: false };
    var dreadVal = typeof roll === 'function' ? roll(dd) : Math.floor(Math.random() * dd) + 1;
    success = (advR.total + totalBonus) >= dreadVal;
    room.lastFailureDelta = Math.max(0, Number(dreadVal || 0) - Number((advR.total || 0) + totalBonus));
    window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, success);
  };

  window._resolveRaidRoomOutcome = function (missionId, wingNum, roomIdx, success) {
    var mission = getMission(missionId);
    if (!mission) return;
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var room = rooms && rooms[roomIdx];
    if (!room) return;
    var run = ensureLegacyRaidRunState(mission);
    var bossName = String(mission.legacyRaidBoss || 'the Boss');

    if (success) {
      room.progress = Math.max(1, Number(room.progressNeeded || 1));
      room.cleared = true;
      if (run) run.clockRemaining = Math.max(0, Number(run.clockRemaining || 0) + 2);
      if (room.type === 'LoreReading') {
        mission.legacyRaidLoreFragment = buildLegacyRaidLoreFragment(mission);
        mission.bonus = Math.min(20, Number(mission.bonus || 0) + 1);
        addLegacyRaidRoomAssistBonus(mission, 2, 1, 1);
        room.result = '✓ Success · +2 ticks. 📜 ' + mission.legacyRaidLoreFragment + ' The decoded route changes Wing 2: the dungeon door opens on the true channel and the gate room gains +1 assist.';
        if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
      } else if (room.type === 'Loot') {
        var raidLoot = rollShopLoot(mission.difficulty) || [];
        if (!Array.isArray(mission.loot)) mission.loot = [];
        mission.loot = mission.loot.concat(raidLoot);
        room.result = '✓ Success · +2 ticks. 📦 Merchant-linked cache cracked. Loot acquired: ' + (raidLoot.length ? raidLoot.join(', ') : 'No salvage.') + '.';
        if (typeof showNotif === 'function') showNotif('Raid loot cache: ' + (raidLoot.length ? raidLoot.join(', ') : 'No salvage.'), raidLoot.length ? 'good' : 'info');
      } else if (room.type === 'Combat') {
        room.combatCard = null;
        room.result = '✓ Success · +2 ticks. ⚔ Enemy pack neutralized (' + Math.max(1, Number(room.enemyCount || 1)) + ' hostiles). Route secured.';
      } else if (room.type === 'Gambling') {
        room.result = '✓ Success · +2 ticks. 🂡 Wager won. Gatekeepers stand down and open passage.';
      } else if (room.type === 'Puzzle') {
        var loreState = ensureLegacyRaidLorePieces(mission);
        if (Number(wingNum || 1) === 1 && loreState) {
          loreState.collected = Math.min(Number(loreState.required || 3), Number(loreState.collected || 0) + 1);
          room.result = '✓ Success · +2 ticks. 🧩 Mechanism solved. Lore fragment secured (' + loreState.collected + '/' + loreState.required + ').';
        } else {
          room.result = '✓ Success · +2 ticks. 🧩 Mechanism solved. Gate seals open and the raid path advances.';
        }
      } else if (room.type === 'Approach') {
        room.result = '✓ Success · +2 ticks. 🌀 Pressure lane cleared. Confrontation chamber opens.';
      } else if (room.type === 'Hazard') {
        room.result = '✓ Success · +2 ticks. ⛰ Passage forced. The route is open.';
      } else if (room.type === 'Peril') {
        room.result = '✓ Success · +2 ticks. ☠ Peril zone survived. Raid cohesion holds.';
      } else if (room.type === 'Trap') {
        room.result = '✓ Success · +2 ticks. ⚠ Trap grid disabled. Forward lane unlocked.';
      } else if (room.type === 'TrophyCache') {
        room.result = '✓ Success · +2 ticks. 💠 Cache secured. Raid receives tactical reserve.';
      } else {
        room.result = '✓ Success · +2 ticks. Room cleared.';
      }
      _raidRevealNextRoom(rooms, roomIdx);
      _checkRaidWingComplete(mission, wingNum, rooms);
      if (typeof showNotif === 'function') showNotif('Room cleared: ' + room.label, 'good');
      var nextRoom = rooms[roomIdx + 1];
      if (nextRoom && nextRoom.isBoss) {
        setLegacyRaidBossEncounterActive(mission, true);
        if (typeof showNotif === 'function') showNotif('Boss chamber breached. Confrontation is now live.', 'warn');
        if (openLegacyRaidBossCinematic(missionId)) return;
        openRaidWingPopup(missionId, wingNum, roomIdx + 1);
        return;
      }

    } else {
      if (room.type === 'Combat') room.combatCard = null;
      if (room.type === 'Gambling') room.gambleState = null;
      var penaltyDelta = Math.max(1, Number(room.lastFailureDelta || 1));
      if (run) run.clockRemaining = Math.max(0, Number(run.clockRemaining || 0) - 1);
      if (typeof addTMWOnFail === 'function') addTMWOnFail();
      if (room.type === 'Puzzle' || room.type === 'Hazard') {
        if (typeof S !== 'undefined' && S) S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + penaltyDelta);
      }
      if (room.type === 'Peril') {
        if (typeof S !== 'undefined' && S) S.health = Math.max(0, Number(S.health || 0) - penaltyDelta);
      }
      if (room.type === 'Trap') {
        if (typeof S !== 'undefined' && S && S.conditions && typeof S.conditions === 'object') {
          var keys = Object.keys(S.conditions);
          if (keys.length) {
            var randomKey = keys[Math.floor(Math.random() * keys.length)];
            S.conditions[randomKey] = true;
          }
        }
      }
      room.failures = Number(room.failures || 0) + 1;
      room.progress = Math.max(1, Number(room.progressNeeded || 1));
      room.cleared = true;
      room.result = '✗ Failed · room still cleared · -1 extra tick. Penalties applied: +1 TMW and type-specific damage/stress.';
      pushLegacyRaidReplayEvent(mission, {
        cause: 'Room failed under pressure',
        detail: room.label + ' failed but was forced through under pressure.',
        hint: 'Use role actions/resources before resolving to avoid penalty damage and extra tick loss.'
      });
      _raidRevealNextRoom(rooms, roomIdx);
      _checkRaidWingComplete(mission, wingNum, rooms);
      if (run) markLegacyRaidWingOutcome(mission, wingNum, false);
      if (typeof showNotif === 'function') showNotif('Room failed and cleared with penalties (-1 extra tick).', 'warn');
    }
    openRaidWingPopup(missionId, wingNum);
  };

  window.toggleRaidBossRole = function (missionId, roleKey) {
    var mission = getMission(missionId);
    if (!mission) return;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.roles || !encounter.roles.hasOwnProperty(roleKey)) return;
    encounter.roles[roleKey] = !encounter.roles[roleKey];
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
  };

  window.setLegacyRaidBossRoleLane = function (missionId, roleKey, laneKey) {
    var mission = getMission(missionId);
    if (!mission) return;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return;
    ensureLegacyRaidBossRoleCooldowns(encounter);
    var role = String(roleKey || '').toLowerCase();
    var lane = String(laneKey || '').toLowerCase();
    if (!encounter.roleLanes || !encounter.roleLanes.hasOwnProperty(role)) return;
    if (['left', 'center', 'right'].indexOf(lane) < 0) return;
    encounter.roleLanes[role] = lane;
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
  };

  window.setLegacyRaidBossPlayerRange = function (missionId, zoneKey) {
    var mission = getMission(missionId);
    if (!mission || !S || !S.combatMap || !Array.isArray(S.combatMap.units)) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || String(encounter.turnStage || 'player') !== 'player') {
      if (typeof showNotif === 'function') showNotif('You can only move during your player turn.', 'warn');
      return false;
    }
    var zone = String(zoneKey || 'Engaged');
    if (['Engaged', 'Close', 'Nearby', 'Far'].indexOf(zone) < 0) return false;
    var playerName = String(S.name || 'Wayfarer');
    var player = S.combatMap.units.find(function (u) {
      return !!u && (u.isPlayer || (u.side === 'ally' && String(u.name || '') === playerName));
    });
    if (!player) return false;
    var currentZone = String(player.zone || 'Engaged');
    var adjacency = {
      Engaged: ['Close'],
      Close: ['Engaged', 'Nearby'],
      Nearby: ['Close', 'Far'],
      Far: ['Nearby']
    };
    if ((adjacency[currentZone] || []).indexOf(zone) < 0) {
      if (typeof showNotif === 'function') showNotif('Invalid move: from ' + currentZone + ' you can move to ' + (adjacency[currentZone] || ['Close']).join(' or ') + '.', 'warn');
      return false;
    }
    var turnNode = getLegacyRaidTimelineTurn(encounter);
    if (!turnNode) return false;
    var actionsLeft = Math.max(0, Number(turnNode.playerActionsLeft || 0));
    if (actionsLeft <= 0) {
      if (typeof showNotif === 'function') showNotif('No player actions left this turn.', 'warn');
      return false;
    }
    turnNode.playerActionsLeft = actionsLeft - 1;
    player.zone = zone;
    encounter.log.push('Wayfarer moved from ' + currentZone + ' to ' + zone + ' (1 action).');
    if (typeof renderCombatMap === 'function') renderCombatMap();
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  function getLegacyRaidBossPlayerActionCost(actionLabel) {
    var text = String(actionLabel || '').toLowerCase();
    if (/heavy/.test(text)) return 2;
    if (/fast|free/.test(text)) return 0;
    return 1;
  }

  function getLegacyRaidWeaponFlatBonusForAction(actionLabel) {
    if (typeof S === 'undefined' || !S || !S.equipment) return 0;
    var text = String(actionLabel || '').toLowerCase();
    var wantsShoot = /shoot|ranged/.test(text);
    var wantsStrike = /strike|attack|melee/.test(text) || !wantsShoot;
    var entries = [S.equipment.weapon1, S.equipment.weapon2, S.equipment.readied];
    var best = 0;
    entries.forEach(function (entry) {
      var raw = String(entry || '');
      if (!raw) return;
      var strikeMatch = raw.match(/\+\s*(\d+)\s*Strike/i);
      var shootMatch = raw.match(/\+\s*(\d+)\s*Shoot/i);
      if (wantsStrike && strikeMatch) best = Math.max(best, Number(strikeMatch[1] || 0));
      if (wantsShoot && shootMatch) best = Math.max(best, Number(shootMatch[1] || 0));
    });
    return Math.max(0, best);
  }

  function resolveLegacyRaidBossPlayerActionRoll(encounter, mission, actionLabel) {
    var label = String(actionLabel || 'Strike');
    var lower = label.toLowerCase();
    var actionType = /shoot/.test(lower) ? 'shoot' : (/defend/.test(lower) ? 'defend' : 'strike');
    var actionDie = getLegacyRaidCombatActionDie(actionType);
    var actionRoll = (typeof explodingRoll === 'function')
      ? explodingRoll(actionDie)
      : { total: (typeof roll === 'function' ? roll(actionDie) : (Math.floor(Math.random() * actionDie) + 1)) };
    var dreadDie = getLegacyRaidBossDreadDie(encounter);
    var dreadRoll = (typeof roll === 'function') ? roll(dreadDie) : (Math.floor(Math.random() * dreadDie) + 1);
    var strikeBonus = /strike|attack|heavy|fast/.test(lower) ? getLegacyRaidStrikeTalentBonus() : 0;
    var weaponBonus = getLegacyRaidWeaponFlatBonusForAction(label);
    var total = Number(actionRoll.total || 0) + Number(strikeBonus || 0) + Number(weaponBonus || 0);
    var hit = total >= Number(dreadRoll || 0);
    var damage = 0;
    if (hit) {
      damage = Math.max(1, Number(total || 0) - Number(dreadRoll || 0));
      if (/heavy/.test(lower)) damage += 2;
      encounter.phaseHp = Math.max(0, Number(encounter.phaseHp || 0) - damage);
    }
    encounter.log.push('Execute ' + label + ': d' + actionDie + '=' + Number(actionRoll.total || 0)
      + (weaponBonus ? (' + Weapon ' + weaponBonus) : '')
      + (strikeBonus ? (' + RaidStrike ' + strikeBonus) : '')
      + ' => ' + total + ' vs Boss Dread d' + dreadDie + '=' + Number(dreadRoll || 0)
      + (hit ? (' | HIT for ' + damage + ' phase HP.') : ' | MISS.'));
    if (typeof showNotif === 'function') {
      showNotif('Execute: ' + total + ' vs d' + dreadDie + ' (' + Number(dreadRoll || 0) + ')' + (hit ? (' -> ' + damage + ' damage') : ' -> miss'), hit ? 'good' : 'warn');
    }
  }

  window.executeLegacyRaidBossPlayerAction = function (missionId, actionLabel) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || encounter.turnStage !== 'player') {
      if (typeof showNotif === 'function') showNotif('Complete boss turn reset before acting again.', 'warn');
      return false;
    }
    var turnNode = getLegacyRaidTimelineTurn(encounter);
    var maxPlayActions = typeof getMaxActions === 'function' ? getMaxActions() : 3;
    var label = String(actionLabel || 'Strike');
    var actionCost = getLegacyRaidBossPlayerActionCost(label);
    if (turnNode) {
      if (!Number.isFinite(Number(turnNode.playerActionsLeft))) turnNode.playerActionsLeft = maxPlayActions;
      if (Number(turnNode.playerActionsLeft || 0) < actionCost) {
        if (typeof showNotif === 'function') showNotif('Need ' + actionCost + ' action(s). Remaining: ' + Number(turnNode.playerActionsLeft || 0) + '.', 'warn');
        return false;
      }
      if (actionCost > 0) {
        turnNode.playerActionsLeft = Math.max(0, Number(turnNode.playerActionsLeft || 0) - actionCost);
      }
    }
    encounter.playerActionLabel = label;
    resolveLegacyRaidBossPlayerActionRoll(encounter, mission, label);
    var playerPhaseState = normalizeLegacyRaidBossPhaseState(mission, encounter, { openCinematic: true });
    if (playerPhaseState === 'victory' || playerPhaseState === 'cinematic') return true;
    var playerActionsRemaining = 0;
    if (turnNode && Number(turnNode.playerActionsLeft || 0) > 0) {
      encounter.turnStage = 'player';
      playerActionsRemaining = Number(turnNode.playerActionsLeft || 0);
      encounter.log.push('Wayfarer action: ' + label + ' (' + actionCost + ' action cost). ' + playerActionsRemaining + ' player action(s) remain this turn.');
      if (typeof showNotif === 'function') showNotif('⚔ ' + label + ' executed (' + actionCost + ' action cost). ' + playerActionsRemaining + ' left.', 'good');
    } else {
      encounter.turnStage = 'ally';
      encounter.allyActionsUsed = 0;
      resetLegacyRaidAllyActionBudget(mission, encounter);
      encounter.log.push('Wayfarer action: ' + label + ' (' + actionCost + ' action cost). Player actions spent; allies now have 2 actions each this turn.');
      if (typeof showNotif === 'function') showNotif('⚔ ' + label + ' executed. Advancing to Ally phase.', 'good');
    }
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  window.executeLegacyRaidBossAllyAction = function (missionId, allyName, allyAction, targetValue) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || encounter.turnStage !== 'ally') {
      if (typeof showNotif === 'function') showNotif('Use a Wayfarer action first.', 'warn');
      return false;
    }
    if (!encounter.allyActionBudget || !encounter.allyActionBudget.byAlly) {
      resetLegacyRaidAllyActionBudget(mission, encounter);
    }
    var ally = String(allyName || 'Ally');
    var act = String(allyAction || 'Defend');
    var target = String(targetValue || 'self');
    encounter.uiAllySelection = ally;
    encounter.uiAllyAction = act;
    encounter.uiAllyTarget = target;
    var remainingForAlly = Math.max(0, Number(encounter.allyActionBudget.byAlly[ally] || 0));
    var remainingTotal = Math.max(0, Number(encounter.allyActionBudget.total || 0) - Number(encounter.allyActionBudget.used || 0));
    if (remainingTotal <= 0) {
      if (typeof showNotif === 'function') showNotif('All ally actions are spent this turn.', 'warn');
      encounter.turnStage = 'boss';
      return false;
    }
    if (remainingForAlly <= 0) {
      if (typeof showNotif === 'function') showNotif(ally + ' has no actions left this turn.', 'warn');
      return false;
    }

    encounter.roleActionState = encounter.roleActionState || { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 };
    if (!encounter.partyHp || typeof encounter.partyHp !== 'object') encounter.partyHp = { allies: {} };
    if (!encounter.partyHp.allies || typeof encounter.partyHp.allies !== 'object') encounter.partyHp.allies = {};
    if (typeof encounter.partyHp.allies[ally] !== 'number') encounter.partyHp.allies[ally] = 12;

    var flavor = getLegacyRaidAllyFlavorProfile(ally);
    var summary = '';
    if (act === 'Defend') {
      var defendBonus = 3;
      encounter.roleActionState.dreadReduction = Number(encounter.roleActionState.dreadReduction || 0) + 2;
      summary = ally + ' defends ' + target + ' (+' + defendBonus + ' defend pressure, flavor ' + flavor.name + ').';
      if (typeof showNotif === 'function') showNotif(ally + ' defends: +' + defendBonus + ' pressure.', 'info');
    } else if (act === 'Support') {
      var supportBonus = 3;
      encounter.roleActionState.actionBonus = Number(encounter.roleActionState.actionBonus || 0) + 2;
      summary = ally + ' supports ' + target + ' (+' + supportBonus + ' support bonus, flavor ' + flavor.name + ').';
      if (typeof showNotif === 'function') showNotif(ally + ' supports: +' + supportBonus + ' action bonus.', 'info');
    } else if (act === 'Attack') {
      var bossDread = getLegacyRaidBossDreadDie(encounter);
      var allyRoll = (typeof roll === 'function') ? roll(6) : (Math.floor(Math.random() * 6) + 1);
      var bossRoll = (typeof roll === 'function') ? roll(bossDread) : (Math.floor(Math.random() * bossDread) + 1);
      var attackBonus = Math.max(1, allyRoll - bossRoll);
      encounter.phaseHp = Math.max(0, Number(encounter.phaseHp || 0) - attackBonus);
      summary = ally + ' attacks (d6=' + allyRoll + ' vs d' + bossDread + '=' + bossRoll + ') for ' + attackBonus + ' phase damage (flavor ' + flavor.name + ').';
      if (typeof showNotif === 'function') showNotif(ally + ' attacks: ' + allyRoll + ' vs Boss (' + bossDread + ') rolled ' + bossRoll + '. ✓ ' + attackBonus + ' damage!', 'good');
    } else {
      var moveBonus = Number(flavor.move || 0);
      summary = ally + ' repositions to ' + target + ' range band (mobility bonus ' + moveBonus + ', flavor ' + flavor.name + ').';
      encounter.roleActionState.pressureBonus = Number(encounter.roleActionState.pressureBonus || 0) + (moveBonus > 1 ? 1 : 0);
      if (typeof showNotif === 'function') showNotif(ally + ' moves to ' + target + ' (mobility +' + moveBonus + ').', 'info');
    }

    encounter.allyActionBudget.byAlly[ally] = Math.max(0, remainingForAlly - 1);
    encounter.allyActionBudget.used = Number(encounter.allyActionBudget.used || 0) + 1;
    encounter.allyActionsUsed = Number(encounter.allyActionsUsed || 0) + 1;
    var allyPhaseState = normalizeLegacyRaidBossPhaseState(mission, encounter, { openCinematic: true });
    if (allyPhaseState === 'victory' || allyPhaseState === 'cinematic') return true;
    var leftTotal = Math.max(0, Number(encounter.allyActionBudget.total || 0) - Number(encounter.allyActionBudget.used || 0));
    encounter.log.push('Ally action ' + encounter.allyActionsUsed + '/6: ' + summary + ' Remaining ally actions: ' + leftTotal + '.');
    if (leftTotal <= 0) {
      encounter.turnStage = 'boss';
      encounter.bossActionsLeft = 2;
    }
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  window.updateLegacyRaidAllyTargetOptions = function (missionId) {
    var allySel = document.getElementById('raidAllySel-' + missionId);
    var actionSel = document.getElementById('raidAllyAct-' + missionId);
    var targetSel = document.getElementById('raidAllyTarget-' + missionId);
    if (!actionSel || !targetSel) return false;
    var mission = getMission(missionId);
    var playerName = String(typeof S !== 'undefined' && S && S.name || 'Wayfarer');
    var allies = mission ? getRaidWayfarersForWing(mission, 3).filter(function (wf) { return wf && wf.status !== 'failed'; }).map(function (wf) { return String(wf.name || 'Wayfarer'); }) : [];
    var action = String(actionSel.value || 'Defend');
    var options = [];
    var seen = {};
    var pushOpt = function (value, label) {
      var v = String(value || '');
      if (!v || seen[v]) return;
      seen[v] = true;
      options.push({ value: v, label: String(label || v) });
    };
    if (action === 'Attack') {
      pushOpt('raid_boss', 'Raid Boss');
    } else if (action === 'Move') {
      ['Engaged', 'Close', 'Nearby', 'Far'].forEach(function (zone) { pushOpt(zone, zone); });
    } else {
      pushOpt(playerName, playerName + ' (You)');
      allies.forEach(function (name) { pushOpt(name, name); });
      if (allySel && allySel.value) pushOpt(allySel.value, String(allySel.value) + ' (Self)');
    }
    var mission = getMission(missionId);
    var encounter = mission ? ensureLegacyRaidBossEncounter(mission) : null;
    var desired = (targetSel && targetSel.value) ? String(targetSel.value) : String(encounter && encounter.uiAllyTarget || '');
    targetSel.innerHTML = options.map(function (opt) {
      return '<option value="' + String(opt.value || '') + '">' + String(opt.label || opt.value || '') + '</option>';
    }).join('');
    if (desired) {
      var hasDesired = options.some(function (opt) { return String(opt.value || '') === desired; });
      if (hasDesired) targetSel.value = desired;
    }
    return true;
  };

  window.advanceLegacyRaidToBossTurn = function (missionId) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || encounter.turnStage !== 'ally') return false;
    if (Number(encounter.allyActionsUsed || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Use at least one ally action before boss turn.', 'warn');
      return false;
    }
    encounter.turnStage = 'boss';
    encounter.bossActionsLeft = 2;
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
    return true;
  };

  window.resolveRaidBossPhase = function (missionId, forcedOutcome) {
    var mission = getMission(missionId);
    if (!mission) return;
    var run = ensureLegacyRaidRunState(mission);
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.active) setLegacyRaidBossEncounterActive(mission, true);
    encounter = ensureLegacyRaidBossEncounter(mission);
    ensureLegacyRaidBossRoleCooldowns(encounter);

    var rolesReady = encounter.roles && encounter.roles.front && encounter.roles.mechanics && encounter.roles.support;
    var actionName = encounter.currentAction && encounter.currentAction.name ? encounter.currentAction.name : 'Unknown Action';
    var cadence = Math.max(1, Number(encounter.actionCadence || 1));
    var strikeCap = Math.max(1, Number(encounter.strikesAllowed || 2));
    var perks = ensureLegacyRaidPerks(mission);
    var resources = ensureLegacyRaidResourcePools(mission) || { focus: 0, momentum: 0, guard: 0 };
    var teamworkPool = getLegacyRaidTeamworkPool();
    var turnNode = getLegacyRaidTimelineTurn(encounter) || { turn: encounter.turn || 1, beat: 'Unknown Beat' };
    var actionState = encounter.roleActionState || { actionBonus: 0, dreadReduction: 0, hazardGuard: false, pressureBonus: 0 };
    var strikeTalentBonus = getLegacyRaidStrikeTalentBonus();
    var teamworkFeedback = getLegacyRaidTalentRank('teamwork_feedback') > 0;
    var hazardLane = String(encounter.hazardLane || 'center');
    var hazardPenalty = 0;
    if (!actionState.hazardGuard) {
      if ((encounter.roleLanes && encounter.roleLanes.front === hazardLane) || (encounter.roleLanes && encounter.roleLanes.mechanics === hazardLane) || (encounter.roleLanes && encounter.roleLanes.support === hazardLane)) {
        hazardPenalty = 1;
      }
    }
    if (consumeLegacyRaidClock(mission, 3, 'Boss Phase')) return;

    var success = false;
    var actionDie = getLegacyRaidBestCombatDie();
    var actionRoll = typeof explodingRoll === 'function' ? explodingRoll(actionDie) : { total: Math.floor(Math.random() * actionDie) + 1, exploded: false };
    var totalAction = Number(actionRoll.total || 0)
      + Number(mission.bonus || 0)
      + Number(actionState.actionBonus || 0)
      + ((/attack|strike|heavy|fast/i.test(String(encounter.playerActionLabel || ''))) ? strikeTalentBonus : 0);
    var tmwBossPressure = teamworkPool >= 100 ? 2 : (teamworkPool >= 50 ? 1 : 0);
    var failedChainPressure = Number(encounter.failedChain || 0) >= 2 ? 2 : 0;
    var dreadDie = Math.max(4, getLegacyRaidBossDreadDie(encounter) + (turnNode.branch ? 1 : 0) + hazardPenalty + tmwBossPressure + failedChainPressure);
    var dreadRoll = typeof roll === 'function' ? roll(dreadDie) : (Math.floor(Math.random() * dreadDie) + 1);
    dreadRoll = Math.max(1, Number(dreadRoll || 0) - Number(actionState.dreadReduction || 0));

    if (typeof forcedOutcome === 'boolean') success = !!forcedOutcome;
    else success = rolesReady && totalAction >= dreadRoll;

    if (!rolesReady && typeof forcedOutcome !== 'boolean') {
      success = false;
      encounter.log.push('Phase ' + Number(encounter.phase || 1) + ': role balance failed before resolving action.');
      pushLegacyRaidReplayEvent(mission, {
        turn: Number(encounter.turn || 1),
        cause: 'Missing role coverage',
        detail: 'Front/Mechanics/Support were not all assigned on beat ' + String(turnNode.beat || 'Unknown') + '.',
        hint: 'Assign all three roles before resolving turn-critical beats.'
      });
    }

    if (success) {
      if (typeof addSuccessRoll === 'function') addSuccessRoll();
      if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
      encounter.failedChain = 0;
      var prepCount = Object.keys(encounter.prepTags || {}).length;
      var bossImmune = prepCount < 3;
      if (!bossImmune) {
        var phaseDamage = Math.max(1, Number(totalAction || 0) - Number(dreadRoll || 0));
        encounter.phaseHp = Math.max(0, Number(encounter.phaseHp || 0) - phaseDamage);
      }
      var pressureState = applyLegacyRaidPressureWindow(encounter, Number(encounter.turn || 1), true, Number(actionState.pressureBonus || 0) + Number(perks.interruptWindow || 0));
      encounter.log.push('Turn ' + Number(encounter.turn || 1) + ' (' + String(turnNode.beat || 'Beat') + '): Action ' + totalAction + ' vs Dread ' + dreadRoll + ' succeeded against ' + actionName + '.');
      if (bossImmune) {
        encounter.log.push('Boss immunity active: fewer than 3 distinct prep actions this turn (' + prepCount + '/3). No HP damage dealt.');
      } else {
        encounter.log.push('Boss phase HP now ' + Number(encounter.phaseHp || 0) + '.');
      }
      encounter.roles = { front: false, mechanics: false, support: false };
      if (pressureState.failedWindow) {
        encounter.strikes = Number(encounter.strikes || 0) + 1;
        encounter.log.push(pressureState.note + ' Strike +1.');
      }
      var resolvedPhase = normalizeLegacyRaidBossPhaseState(mission, encounter, { openCinematic: true });
      if (resolvedPhase === 'victory' || resolvedPhase === 'cinematic') return;
      if (typeof showNotif === 'function') showNotif('Boss turn cleared. Prepare next assignment.', 'good');
      tickLegacyRaidBossRoleCooldowns(encounter);
      tickLegacyRaidTeamUtilityCooldowns(mission);
      encounter.turnStage = 'player';
      encounter.allyActionsUsed = 0;
      resetLegacyRaidAllyActionBudget(mission, encounter);
      encounter.turn = Number(encounter.turn || 1) + 1;
      if (encounter.turn > 8) encounter.turn = 8;
      var nextNode = getLegacyRaidTimelineTurn(encounter);
      if (nextNode && Array.isArray(encounter.actions)) {
        encounter.currentAction = encounter.actions[Math.max(0, Number(nextNode.actionIndex || 0)) % encounter.actions.length];
      }
      updateLegacyRaidBossHazardLane(encounter);
      openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
      return;
    }

    if (typeof addTMWOnFail === 'function') addTMWOnFail();
    if (teamworkFeedback && typeof changeCounter === 'function') changeCounter('tmw', 1);
    encounter.strikes = Number(encounter.strikes || 0) + 1;
    encounter.failedChain = Number(encounter.failedChain || 0) + 1;
    applyLegacyRaidPressureWindow(encounter, Number(encounter.turn || 1), false, 0);
    if (encounter.currentAction && encounter.currentAction.raidwide) {
      encounter.raidwideHits = Number(encounter.raidwideHits || 0) + cadence;
      encounter.log.push('Turn ' + Number(encounter.turn || 1) + ' failed: ' + actionName + ' landed raidwide pressure (cadence x' + cadence + '). Strike ' + encounter.strikes + '/' + strikeCap + '.');
    } else {
      encounter.log.push('Turn ' + Number(encounter.turn || 1) + ' failed: action ' + totalAction + ' vs dread ' + dreadRoll + ' against ' + actionName + '. Strike ' + encounter.strikes + '/' + strikeCap + '.');
    }
    pushLegacyRaidReplayEvent(mission, {
      turn: Number(encounter.turn || 1),
      cause: 'Boss beat failed',
      detail: String(turnNode.beat || 'Unknown beat') + ' · Action ' + totalAction + ' vs Dread ' + dreadRoll + '.',
      hint: hazardPenalty > 0 ? 'Move off the hazard lane or use Guard/Barrier before resolving.' : 'Spend role actions (Decode/Breach/Cleanse) before resolving the next turn.'
    });
    encounter.roles = { front: false, mechanics: false, support: false };
    if (run) markLegacyRaidWingOutcome(mission, 3, false);
    tickLegacyRaidBossRoleCooldowns(encounter);
    tickLegacyRaidTeamUtilityCooldowns(mission);
    encounter.turnStage = 'player';
    encounter.allyActionsUsed = 0;
    resetLegacyRaidAllyActionBudget(mission, encounter);
    encounter.turn = Number(encounter.turn || 1) + 1;
    if (encounter.turn > 8) encounter.turn = 8;
    var nextTurnNode = getLegacyRaidTimelineTurn(encounter);
    if (nextTurnNode && Array.isArray(encounter.actions)) {
      encounter.currentAction = encounter.actions[Math.max(0, Number(nextTurnNode.actionIndex || 0)) % encounter.actions.length];
    }
    updateLegacyRaidBossHazardLane(encounter);

    if (encounter.strikes >= strikeCap) {
      if (Number(encounter.wipeShield || 0) > 0) {
        encounter.wipeShield = Math.max(0, Number(encounter.wipeShield || 0) - 1);
        encounter.strikes = Math.max(0, strikeCap - 1);
        encounter.log.push('Wipe negated by stored 10 TMW burst. Shield consumed.');
        if (typeof showNotif === 'function') showNotif('Wipe negated by Teamwork Burst.', 'good');
        openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
        return;
      }
      if (run) {
        run.pendingWing = 3;
        run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, 3);
        run.wipes = Number(run.wipes || 0) + 1;
      }
      openLegacyRaidWipeDecision(missionId);
      return;
    }
    if (typeof showNotif === 'function') showNotif('Boss phase failed. One more strike triggers a wipe.', 'warn');
    openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
  };

  window.resolveRaidBossRoom = function (missionId, success) {
    var mission = getMission(missionId);
    if (!mission) return;
    ensureLegacyRaidMissionConfig(mission);
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[3];
    var bossRoom = rooms && rooms[rooms.length - 1];
    var run = ensureLegacyRaidRunState(mission);

    if (success) {
      if (mission.legacyRaidBossRequiredWeapon && !mission.legacyRaidBossWeaponAcquired) {
        if (bossRoom) {
          bossRoom.result = '⚠ ' + String(mission.legacyRaidBoss || 'Boss') + ' is vulnerable but cannot be finished without ' + String(mission.legacyRaidBossRequiredWeapon) + '.';
        }
        if (typeof showNotif === 'function') {
          showNotif('Boss is not finishable yet. Acquire ' + String(mission.legacyRaidBossRequiredWeapon) + ' from Wing 2 armory loot.', 'warn');
        }
        openRaidWingPopup(missionId, 3, (rooms || []).length - 1);
        return false;
      }
      if (bossRoom) { bossRoom.cleared = true; bossRoom.result = '🐉 ' + String(mission.legacyRaidBoss || 'Boss') + ' defeated. Raid clear.'; }
      var encounter = ensureLegacyRaidBossEncounter(mission);
      if (encounter) encounter.active = false;
      if (S && S.combat) {
        S.combat.customEnemyActionEvents = null;
        S.combat.customEnemyActionSource = '';
        S.combat.customEnemyActionCadence = 1;
      }
      // mark wing 3 complete, then fire overall clear
      if (typeof mission.steps !== 'undefined') mission.steps[3] = mission.steps[3] || {};
      if (run) markLegacyRaidWingOutcome(mission, 3, true);
      openLegacyRaidWingLootChoice(mission.id, 3, 'raid-clear');
      return true;
    } else {
      if (run) {
        run.pendingWing = 3;
        run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, 3);
        run.wipes = Number(run.wipes || 0) + 1;
        markLegacyRaidWingOutcome(mission, 3, false);
      }
      if (S && S.combat) {
        S.combat.customEnemyActionEvents = null;
        S.combat.customEnemyActionSource = '';
        S.combat.customEnemyActionCadence = 1;
      }
      openLegacyRaidWipeDecision(missionId);
    }
  };

  window.deployRaidWayfarer = function (missionId, wingNum, roomIdx, wayfarerIdx) {
    var mission = getMission(missionId);
    if (!mission) return;
    var wayfarers = getRaidWayfarersForWing(mission, wingNum);
    var wf = wayfarers[wayfarerIdx];
    if (!wf || wf.status !== 'ready') {
      if (typeof showNotif === 'function') showNotif('Wayfarer is not available.', 'warn');
      return;
    }

    var dd = 6;
    var advDie = typeof getStat === 'function' ? getStat('adventure') : 8;
    var manualMode = typeof isMissionManualRollMode === 'function' && isMissionManualRollMode();

    if (manualMode) {
      openModal('Deploy ' + wf.name,
        '<div style="font-size:.84rem;color:var(--muted3);line-height:1.55;margin-bottom:.4rem;">'
        + wf.name + ' advances into the next room, covering pressure and absorbing a hazard. Roll Adventure d' + advDie + ' vs DD' + dd + '.'
        + '</div><div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.28);padding:.3rem .4rem;font-size:.73rem;color:var(--red2);margin-bottom:.35rem;">'
        + '⚠ On failure, ' + wf.name + ' is lost for this raid. If all Wayfarers fall, the next wing begins with no allied support.'
        + '</div>'
        + '<div style="display:flex;gap:.3rem;justify-content:flex-end;">'
        + '<button class="btn btn-xs btn-red" onclick="window._resolveWayfarerDeploy(' + missionId + ',' + wingNum + ',' + roomIdx + ',' + wayfarerIdx + ',false);closeModal();">✗ Wayfarer Falls</button>'
        + '<button class="btn btn-xs btn-primary" onclick="window._resolveWayfarerDeploy(' + missionId + ',' + wingNum + ',' + roomIdx + ',' + wayfarerIdx + ',true);closeModal();">✓ Deployment Succeeds</button>'
        + '</div>'
      );
      return;
    }

    var advR = typeof explodingRoll === 'function' ? explodingRoll(advDie) : { total: Math.floor(Math.random() * advDie) + 1 };
    var dreadVal = typeof roll === 'function' ? roll(dd) : Math.floor(Math.random() * dd) + 1;
    var success = advR.total >= dreadVal;
    window._resolveWayfarerDeploy(missionId, wingNum, roomIdx, wayfarerIdx, success);
  };

  window.deployRaidWayfarerToRoom = function (missionId, wingNum, roomIdx, wayfarerIdx) {
    var mission = getMission(missionId);
    if (!mission) return;
    var wayfarers = getRaidWayfarersForWing(mission, wingNum);
    var wf = wayfarers[wayfarerIdx];
    if (!wf || wf.status !== 'ready') {
      if (typeof showNotif === 'function') showNotif('Selected Wayfarer is not ready.', 'warn');
      return;
    }
    wf.status = 'deployed';
    wf.wing = wingNum;
    var perks = ensureLegacyRaidPerks(mission);
    var assist = 2 + Math.max(0, Number(perks.wayfarerAssistBonus || 0));
    addLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx, assist);
    if (typeof showNotif === 'function') showNotif(wf.name + ' deployed to this room. +' + assist + ' room bonus granted.', 'good');
    openRaidWingPopup(missionId, wingNum, roomIdx);
  };

  window._resolveWayfarerDeploy = function (missionId, wingNum, roomIdx, wayfarerIdx, success) {
    var mission = getMission(missionId);
    if (!mission) return;
    var wayfarers = getRaidWayfarersForWing(mission, wingNum);
    var wf = wayfarers[wayfarerIdx];
    if (!wf) return;

    if (success) {
      wf.status = 'deployed';
      wf.wing = wingNum;
      if (typeof showNotif === 'function') showNotif(wf.name + ' deployed — holding the next room flank.', 'good');
    } else {
      wf.status = 'failed';
      if (typeof showNotif === 'function') showNotif(wf.name + ' has fallen. Check remaining Wayfarer count.', 'warn');
      // If ALL wayfarers lost, they can continue but note it
      var allLost = wayfarers.every(function (w) { return w.status === 'failed'; });
      if (allLost && typeof showNotif === 'function') {
        showNotif('All Wayfarers lost — the raid continues unassisted. Wing 3 DD raised by +2.', 'warn');
        // Penalty: raise boss dread
        if (mission.dread && mission.dread < 12) mission.dread = Math.min(12, Number(mission.dread) + 2);
      }
    }
    openRaidWingPopup(missionId, wingNum, roomIdx);
  };

  function ensureLegacyRaidLockDialState(mission, wingNum, roomIdx) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room) return null;
    if (!room.raidPuzzle || typeof room.raidPuzzle !== 'object') {
      var mode = getLegacyRaidBossPuzzleMode(mission, wingNum);
      var attemptBudget = 6;
      if (mode === 'pipe_flow') attemptBudget = 16;
      else if (mode === 'weight_balance') attemptBudget = 14;
      else if (mode === 'food_chain') attemptBudget = 10;
      else if (mode === 'constellation') attemptBudget = 8;
      else if (mode === 'limited_move') attemptBudget = 10;
      else if (mode === 'shape_route') attemptBudget = 8;
      else if (mode === 'symbol_match') attemptBudget = 6;
      room.raidPuzzle = {
        mode: mode,
        attemptsLeft: attemptBudget,
        solved: false,
        log: [],
        state: {}
      };
      if (mode === 'lock_dials') room.raidPuzzle.state = createLegacyRaidTumblerState(mission);
      else if (mode === 'symbol_match') room.raidPuzzle.state.target = ['☀', '☾', '✶', '⬡'][Math.floor(Math.random() * 4)];
      else if (mode === 'constellation') room.raidPuzzle.state.target = '135';
      else if (mode === 'pipe_flow')      room.raidPuzzle.state = createLegacyRaidPipeFlowState();
      else if (mode === 'weight_balance') room.raidPuzzle.state = createLegacyRaidWeightBalanceState();
      else if (mode === 'food_chain') room.raidPuzzle.state = createLegacyRaidFoodChainState(mission);
      else if (mode === 'limited_move') room.raidPuzzle.state.path = 'LURRD';
      else if (mode === 'shape_route') room.raidPuzzle.state.target = 'ABCD';
    }
    return room.raidPuzzle;
  }

  function reseedLegacyRaidPuzzleState(mission, puzzle) {
    if (!puzzle || typeof puzzle !== 'object') return;
    var mode = String(puzzle.mode || 'lock_dials');
    puzzle.solved = false;
    puzzle.log = ['Puzzle matrix reconfigured.'];
    puzzle.state = {};
    if (mode === 'lock_dials') puzzle.state = createLegacyRaidTumblerState(mission);
    else if (mode === 'symbol_match') puzzle.state.target = ['☀', '☾', '✶', '⬡'][Math.floor(Math.random() * 4)];
    else if (mode === 'constellation') puzzle.state.target = '135';
    else if (mode === 'pipe_flow') puzzle.state = createLegacyRaidPipeFlowState();
    else if (mode === 'weight_balance') puzzle.state = createLegacyRaidWeightBalanceState();
    else if (mode === 'food_chain') puzzle.state = createLegacyRaidFoodChainState(mission);
    else if (mode === 'limited_move') puzzle.state.path = 'LURRD';
    else if (mode === 'shape_route') puzzle.state.target = 'ABCD';
  }

  function buildLegacyRaidPuzzleHints(mission, wingNum, roomIdx) {
    var map = ensureRaidHexMap(mission);
    var rooms = map && map.wings ? map.wings[wingNum] : [];
    var room = rooms && rooms[roomIdx];
    if (!room) return [];
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle) return [];
    var hints = [];
    var assist = getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx);
    var prev = roomIdx > 0 ? rooms[roomIdx - 1] : null;
    if (prev && prev.cleared) {
      hints.push('Previous room clue: ' + (prev.type === 'LoreReading' ? 'The archive emphasized parity and mirrored routes.' : 'Recovered logs marked left-to-right traversal priority.'));
    }
    if (puzzle.mode === 'lock_dials') {
      var targets = Array.isArray(puzzle.state.targets) ? puzzle.state.targets : [1, 1, 1, 1, 1];
      var highPins = targets.filter(function (n) { return Number(n || 0) >= 4; }).length;
      hints.push('Tumbler clue: ' + highPins + ' pin(s) are set in high positions (4-5).');
      hints.push('Tumbler clue: the leftmost pin prefers a ' + (Number(targets[0] || 1) % 2 === 0 ? 'quiet even click.' : 'sharp odd click.'));
      if (assist > 0) hints.push('Wayfarer support can stabilize one tumbler alignment this attempt.');
    } else if (puzzle.mode === 'symbol_match') {
      hints.push('Symbol clue: match dominant icon family revealed in prior telemetry.');
    } else if (puzzle.mode === 'constellation') {
      hints.push('Constellation clue: align stars in a single unbroken sweep path.');
    } else if (puzzle.mode === 'pipe_flow') {
      hints.push('Pipe clue: the source must feed the sink through one continuous route.');
    } else if (puzzle.mode === 'weight_balance') {
      hints.push('Weight clue: both pans must match the target load exactly.');
    } else if (puzzle.mode === 'food_chain') {
      hints.push('Food-chain clue: mark predator-prey progression cells that fit this boss ecosystem.');
    } else if (puzzle.mode === 'limited_move') {
      hints.push('Maze clue: shortest safe path uses exactly 5 steps.');
    } else if (puzzle.mode === 'shape_route') {
      hints.push('Shape clue: segments must be arranged into coherent sequence ABCD.');
    }
    if (!hints.length) hints.push('No clue fragments available yet.');
    return hints;
  }

  function ensureLegacyRaidPuzzleRoleState(puzzle) {
    if (!puzzle || typeof puzzle !== 'object') return null;
    if (!puzzle.state || typeof puzzle.state !== 'object') puzzle.state = {};
    if (!puzzle.state.roleCooldowns || typeof puzzle.state.roleCooldowns !== 'object') {
      puzzle.state.roleCooldowns = { front: 0, mechanics: 0, support: 0 };
    }
    if (typeof puzzle.state.frontlineMomentum !== 'number') puzzle.state.frontlineMomentum = 0;
    if (typeof puzzle.state.mechanicsInsight !== 'number') puzzle.state.mechanicsInsight = 0;
    if (typeof puzzle.state.supportHarmony !== 'number') puzzle.state.supportHarmony = 0;
    if (typeof puzzle.state.stability !== 'number') puzzle.state.stability = 0;
    return puzzle.state;
  }

  function tickLegacyRaidPuzzleRoleCooldowns(puzzle) {
    var state = ensureLegacyRaidPuzzleRoleState(puzzle);
    if (!state) return;
    ['front', 'mechanics', 'support'].forEach(function (role) {
      state.roleCooldowns[role] = Math.max(0, Number(state.roleCooldowns[role] || 0) - 1);
    });
  }

  function setLegacyRaidPuzzleRoleCooldown(puzzle, role, turns) {
    var state = ensureLegacyRaidPuzzleRoleState(puzzle);
    if (!state) return;
    state.roleCooldowns[role] = Math.max(Number(state.roleCooldowns[role] || 0), Math.max(1, Number(turns || 1)));
  }

  function renderLegacyRaidPuzzleRoleStatus(puzzle) {
    var state = ensureLegacyRaidPuzzleRoleState(puzzle);
    if (!state) return '';
    return '<div style="display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:.2rem;margin-bottom:.2rem;">'
      + '<div style="font-size:.68rem;color:var(--muted2);border:1px solid var(--border2);padding:.16rem .2rem;">Front CD: <strong style="color:' + (state.roleCooldowns.front > 0 ? 'var(--red2)' : 'var(--green2)') + ';">' + Number(state.roleCooldowns.front || 0) + '</strong> · Momentum ' + Number(state.frontlineMomentum || 0) + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);border:1px solid var(--border2);padding:.16rem .2rem;">Mechanics CD: <strong style="color:' + (state.roleCooldowns.mechanics > 0 ? 'var(--red2)' : 'var(--green2)') + ';">' + Number(state.roleCooldowns.mechanics || 0) + '</strong> · Insight ' + Number(state.mechanicsInsight || 0) + '</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);border:1px solid var(--border2);padding:.16rem .2rem;">Support CD: <strong style="color:' + (state.roleCooldowns.support > 0 ? 'var(--red2)' : 'var(--green2)') + ';">' + Number(state.roleCooldowns.support || 0) + '</strong> · Harmony ' + Number(state.supportHarmony || 0) + '</div>'
      + '</div>';
  }

  function renderLegacyRaidPuzzleRoleActions(missionId, wingNum, roomIdx, puzzle) {
    var state = ensureLegacyRaidPuzzleRoleState(puzzle);
    if (!state) return '';
    var roleButtons = function (role, buttons) {
      var cd = Number(state.roleCooldowns[role] || 0);
      var style = cd > 0 ? 'opacity:.55;filter:grayscale(.35);' : '';
      return '<div style="border:1px solid var(--border2);padding:.2rem .24rem;background:rgba(255,255,255,.02);">'
        + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.12rem;text-transform:uppercase;letter-spacing:.05em;">' + role + (cd > 0 ? ' · locked ' + cd + ' turn' + (cd > 1 ? 's' : '') : ' · ready') + '</div>'
        + '<div style="display:flex;gap:.18rem;flex-wrap:wrap;' + style + '">'
        + buttons.map(function (btn) {
          return '<button class="btn btn-xs" ' + (cd > 0 ? 'disabled' : '') + ' onclick="submitLegacyRaidPuzzleRoleAction(' + missionId + ',' + wingNum + ',' + roomIdx + ',\'' + role + '\',\'' + btn.move + '\')">' + btn.label + '</button>';
        }).join('')
        + '</div></div>';
    };

    var mode = String(puzzle.mode || 'lock_dials');
    var front = [];
    var mechanics = [];
    var support = [];
    if (mode === 'lock_dials') {
      front = [{ move: 'front_stabilize', label: 'Stabilize Tumblers' }];
      mechanics = [{ move: 'mech_probe', label: 'Probe Dial Signature' }];
      support = [{ move: 'support_echo', label: 'Echo Alignment' }];
    } else if (mode === 'symbol_match') {
      front = [{ move: 'front_mark_family', label: 'Mark Dominant Family' }];
      mechanics = [{ move: 'mech_decode_symbol', label: 'Decode Sigil' }];
      support = [{ move: 'support_harmony_symbol', label: 'Harmonic Echo' }];
    } else if (mode === 'constellation') {
      front = [{ move: 'front_trace_path', label: 'Trace Safe Arc' }];
      mechanics = [{ move: 'mech_calibrate_star', label: 'Calibrate Node' }];
      support = [{ move: 'support_sync_stars', label: 'Sync Pattern' }];
    } else if (mode === 'pipe_flow') {
      front = [{ move: 'front_force_valve', label: 'Force Mainline' }];
      mechanics = [{ move: 'mech_route_pressure', label: 'Route Precision' }];
      support = [{ move: 'support_bleed_pressure', label: 'Recover Attempt' }];
    } else if (mode === 'weight_balance') {
      front = [{ move: 'front_shift_mass', label: 'Set Heavy Pair' }];
      mechanics = [{ move: 'mech_trim_mass', label: 'Fine Trim' }];
      support = [{ move: 'support_counterweight', label: 'True Center' }];
    } else if (mode === 'food_chain') {
      front = [{ move: 'front_mark_predator', label: 'Mark Predator Path' }];
      mechanics = [{ move: 'mech_map_chain', label: 'Map Chain Logic' }];
      support = [{ move: 'support_context_chain', label: 'Context Echo' }];
    } else if (mode === 'limited_move') {
      front = [{ move: 'front_dash_step', label: 'Dash Next Step' }];
      mechanics = [{ move: 'mech_reveal_path', label: 'Reveal Next Move' }];
      support = [{ move: 'support_rewind_step', label: 'Rewind Mistake' }];
    } else {
      front = [{ move: 'front_anchor_shape', label: 'Anchor Segment' }];
      mechanics = [{ move: 'mech_rotate_shape', label: 'Rotate Segment' }];
      support = [{ move: 'support_link_shape', label: 'Link Sequence' }];
    }

    return '<div style="display:grid;grid-template-columns:1fr;gap:.2rem;margin-bottom:.2rem;">'
      + roleButtons('front', front)
      + roleButtons('mechanics', mechanics)
      + roleButtons('support', support)
      + '</div>';
  }

  function openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle) return false;
    ensureLegacyRaidPuzzleRoleState(puzzle);
    if (puzzle.solved) return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    var hints = buildLegacyRaidPuzzleHints(mission, wingNum, roomIdx);
    var controls = '';
    if (puzzle.mode === 'lock_dials') {
      controls = renderLegacyRaidTumblerControls(mission.id, wingNum, roomIdx, puzzle);
    } else if (puzzle.mode === 'symbol_match') {
      controls = '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.12rem;">Match the sigil family shown by the mechanism trace.</div>'
        + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.2rem;">'
        + ['☀','☾','✶','⬡'].map(function (sym) {
            return '<button class="btn btn-xs" style="min-width:40px;font-size:.9rem;" onclick="submitLegacyRaidPuzzleAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'symbol\',\'' + sym + '\')">' + sym + '</button>';
          }).join('')
        + '</div>';
    } else if (puzzle.mode === 'constellation') {
      controls = '<div style="margin-bottom:.2rem;font-size:.7rem;color:var(--muted2);">Constellation Grid: pick 3 stars in order.</div>'
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.2rem;max-width:180px;">'
        + [1,2,3,4,5,6,7,8,9].map(function (n) { return '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'constellation\',\'' + n + '\')">✦' + n + '</button>'; }).join('')
        + '</div>';
    } else if (puzzle.mode === 'pipe_flow') {
      controls = renderLegacyRaidPipeFlowControls(mission.id, wingNum, roomIdx, puzzle);
    } else if (puzzle.mode === 'weight_balance') {
      controls = renderLegacyRaidWeightBalanceControls(mission.id, wingNum, roomIdx, puzzle);
    } else if (puzzle.mode === 'food_chain') {
      controls = renderLegacyRaidFoodChainControls(mission.id, wingNum, roomIdx, puzzle);
    } else if (puzzle.mode === 'limited_move') {
      controls = '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.2rem;">'
        + ['L','U','R','D'].map(function (m) { return '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'maze\',\'' + m + '\')">' + m + '</button>'; }).join('')
        + '</div>';
    } else {
      controls = '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.2rem;">'
        + ['A','B','C','D'].map(function (s) { return '<button class="btn btn-xs" onclick="submitLegacyRaidPuzzleAction(' + mission.id + ',' + wingNum + ',' + roomIdx + ',\'shape\',\'' + s + '\')">' + s + '</button>'; }).join('')
        + '</div>';
    }
    var roleStatus = renderLegacyRaidPuzzleRoleStatus(puzzle);
    var roleControls = renderLegacyRaidPuzzleRoleActions(mission.id, wingNum, roomIdx, puzzle);
    var logHtml = Array.isArray(puzzle.log) && puzzle.log.length
      ? puzzle.log.slice(-4).map(function (line) { return '<div style="font-size:.67rem;color:var(--muted2);padding:.08rem 0;border-bottom:1px solid var(--border2);">' + line + '</div>'; }).join('')
      : '<div style="font-size:.67rem;color:var(--muted2);">No attempts yet.</div>';
    openModal('Puzzle Room — ' + room.label,
      '<div style="font-size:.9rem;color:var(--text);line-height:1.62;">'
      + '<div style="margin-bottom:.24rem;"><strong style="color:var(--gold2);">Puzzle Type:</strong> ' + (puzzle.mode === 'symbol_match' ? 'symbol match' : String(puzzle.mode).replace(/_/g, ' ')) + ' · Attempts left: <strong style="color:var(--teal2);">' + Number(puzzle.attemptsLeft || 0) + '</strong></div>'
      + '<div style="margin-bottom:.24rem;padding:.24rem .3rem;border:1px solid rgba(232,192,80,.28);background:rgba(255,255,255,.04);">'
      + hints.map(function (h) { return '<div style="font-size:.76rem;color:var(--text2);margin-bottom:.08rem;">• ' + h + '</div>'; }).join('') + '</div>'
      + roleStatus
      + roleControls
      + controls
      + '<div style="font-size:.74rem;color:var(--gold2);margin-bottom:.1rem;">Attempt Log</div>'
      + '<div style="max-height:120px;overflow:auto;border:1px solid var(--border2);padding:.24rem .28rem;background:rgba(0,0,0,.16);margin-bottom:.24rem;">' + logHtml + '</div>'
      + '<div style="display:flex;justify-content:space-between;gap:.24rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-warn" onclick="resolveLegacyRaidPuzzleBypass(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Bypass Puzzle (AD vs DD6)</button>'
      + '<button class="btn btn-xs" onclick="resetLegacyRaidPuzzleRoom(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Reconfigure Puzzle</button>'
      + '<button class="btn btn-xs" onclick="openRaidWingPopup(' + mission.id + ',' + wingNum + ',' + roomIdx + ')">Back To Room</button>'
      + '</div>'
      + '</div>');
    return true;
  }

  window.resetLegacyRaidPuzzleRoom = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle || puzzle.solved) return false;
    puzzle.attemptsLeft = Math.max(1, Number(puzzle.attemptsLeft || 0) - 1);
    reseedLegacyRaidPuzzleState(mission, puzzle);
    if (typeof showNotif === 'function') showNotif('Puzzle matrix reconfigured (-1 attempt).', 'info');
    if (Number(puzzle.attemptsLeft || 0) <= 0) {
      room.result = '🧩 Puzzle lockout triggered after too many resets.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
    }
    return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
  };

  window.consumeLegacyRaidPuzzleAutoSuccess = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission || Number(mission.legacyRaidPuzzleAutoSuccess || 0) <= 0) return false;
    mission.legacyRaidPuzzleAutoSuccess = Math.max(0, Number(mission.legacyRaidPuzzleAutoSuccess || 0) - 1);
    return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
  };

  window.submitLegacyRaidPuzzleAction = function (missionId, wingNum, roomIdx, action, payload) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle || puzzle.solved) return false;

    var mode = String(puzzle.mode || 'lock_dials');
    var ok = false;
    var consumeAttempt = false;
    if (mode === 'symbol_match' && action === 'symbol') {
      ok = String(payload || '') === String(puzzle.state.target || '☀');
      consumeAttempt = !ok;
      puzzle.log.push('Symbol pick: ' + String(payload || '?') + (ok ? ' ✓' : ' ✗'));
    } else if (mode === 'constellation' && action === 'constellation') {
      puzzle.state.seq = String((puzzle.state.seq || '') + String(payload || '')).split(',').join('');
      if (String(puzzle.state.seq || '').length >= 3) {
        ok = String(puzzle.state.seq || '').slice(-3) === '135';
        consumeAttempt = !ok;
        if (!ok) puzzle.state.seq = '';
      }
      puzzle.log.push('Constellation sequence: ' + String(puzzle.state.seq || ''));
    } else if (mode === 'pipe_flow' && action === 'pipe_rotate') {
      var tileIndex = Math.max(0, Number(payload || 0));
      if (puzzle.state.tiles && puzzle.state.tiles[tileIndex] && !puzzle.state.tiles[tileIndex].locked) {
        puzzle.state.tiles[tileIndex].rotation = (Number(puzzle.state.tiles[tileIndex].rotation || 0) + 1) % 4;
      }
      ok = isLegacyRaidPipeFlowSolved(puzzle);
      puzzle.log.push(ok ? 'Pipe route completed from source to sink.' : 'Pipe tile rotated. Flow path still incomplete.');
    } else if (mode === 'weight_balance' && (action === 'weight_place' || action === 'weight_remove')) {
      puzzle.state.pool = Array.isArray(puzzle.state.pool) ? puzzle.state.pool : [];
      puzzle.state.left = Array.isArray(puzzle.state.left) ? puzzle.state.left : [];
      puzzle.state.right = Array.isArray(puzzle.state.right) ? puzzle.state.right : [];
      if (action === 'weight_place') {
        var placeParts = String(payload || '').split(':');
        var poolIndex = Math.max(0, Number(placeParts[0] || 0));
        var side = placeParts[1] === 'right' ? 'right' : 'left';
        if (poolIndex < puzzle.state.pool.length) {
          var placedWeight = puzzle.state.pool.splice(poolIndex, 1)[0];
          puzzle.state[side].push(placedWeight);
        }
      } else {
        var removeParts = String(payload || '').split(':');
        var fromSide = removeParts[0] === 'right' ? 'right' : 'left';
        var removeIndex = Math.max(0, Number(removeParts[1] || 0));
        if (removeIndex < puzzle.state[fromSide].length) {
          var removedWeight = puzzle.state[fromSide].splice(removeIndex, 1)[0];
          puzzle.state.pool.push(removedWeight);
        }
      }
      var leftSum = puzzle.state.left.reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
      var rightSum = puzzle.state.right.reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
      ok = leftSum === rightSum && leftSum === Number(puzzle.state.target || 4);
      puzzle.log.push(ok ? 'Both pans balanced on the true center line.' : ('Loads now left ' + leftSum + ' / right ' + rightSum + '.'));
    } else if (mode === 'food_chain' && action === 'food_cell') {
      if (!Array.isArray(puzzle.state.selected)) puzzle.state.selected = [];
      var cell = String(payload || '');
      var idxSelected = puzzle.state.selected.indexOf(cell);
      if (idxSelected >= 0) puzzle.state.selected.splice(idxSelected, 1);
      else puzzle.state.selected.push(cell);
      var selectedSorted = puzzle.state.selected.slice().sort().join('|');
      var targetSorted = (Array.isArray(puzzle.state.targetCells) ? puzzle.state.targetCells.slice() : []).sort().join('|');
      ok = selectedSorted === targetSorted;
      puzzle.log.push(ok ? 'Food-chain topology locked. Predator loop resolved.' : ('Marked ' + puzzle.state.selected.length + '/' + (Array.isArray(puzzle.state.targetCells) ? puzzle.state.targetCells.length : 0) + ' required cells.'));
    } else if (mode === 'limited_move' && action === 'maze') {
      puzzle.state.pathTaken = String((puzzle.state.pathTaken || '') + String(payload || ''));
      var targetPath = String(puzzle.state.path || 'LURRD');
      if (String(puzzle.state.pathTaken || '').length >= targetPath.length) {
        ok = String(puzzle.state.pathTaken || '') === targetPath;
        consumeAttempt = !ok;
        if (!ok) puzzle.state.pathTaken = '';
      }
      puzzle.log.push('Path: ' + String(puzzle.state.pathTaken || ''));
    } else if (mode === 'shape_route' && action === 'shape') {
      puzzle.state.route = String((puzzle.state.route || '') + String(payload || ''));
      var targetRoute = String(puzzle.state.target || 'ABCD');
      if (String(puzzle.state.route || '').length >= targetRoute.length) {
        ok = String(puzzle.state.route || '') === targetRoute;
        consumeAttempt = !ok;
        if (!ok) puzzle.state.route = '';
      }
      puzzle.log.push('Shape route: ' + String(puzzle.state.route || ''));
    } else if (mode === 'lock_dials' && action === 'tumbler_push') {
      // Push pin at index up by 1 (wraps 5→1)
      var pinIdx = Math.max(0, Math.min(4, Number(payload || 0)));
      if (!Array.isArray(puzzle.state.pins)) puzzle.state.pins = [1,1,1,1,1];
      puzzle.state.pins[pinIdx] = (Number(puzzle.state.pins[pinIdx] || 1) % 5) + 1;
      puzzle.log.push('Pin ' + (pinIdx+1) + ' pushed to height ' + puzzle.state.pins[pinIdx] + '.');
      ok = false; // pushing alone doesn't solve — must press Try Lock
    } else if (mode === 'lock_dials' && action === 'tumbler_probe') {
      // Reveal which pins are currently at their target heights
      if (!Array.isArray(puzzle.state.pins))    puzzle.state.pins    = [1,1,1,1,1];
      if (!Array.isArray(puzzle.state.targets)) puzzle.state.targets = [1,1,1,1,1];
      if (!Array.isArray(puzzle.state.revealed)) puzzle.state.revealed = [];
      puzzle.state.revealed = [];
      var feelCount = 0;
      for (var pi = 0; pi < 5; pi++) {
        if (Number(puzzle.state.pins[pi] || 1) === Number(puzzle.state.targets[pi] || 1)) {
          puzzle.state.revealed.push(pi);
          feelCount++;
        }
      }
      puzzle.log.push('You feel ' + feelCount + ' binding pin(s) at the correct height.');
      ok = isLegacyRaidTumblerSolved(puzzle);
    } else if (mode === 'lock_dials' && action === 'tumbler_try') {
      ok = isLegacyRaidTumblerSolved(puzzle);
      if (!ok) {
        puzzle.attemptsLeft = Math.max(0, Number(puzzle.attemptsLeft || 0) - 1);
        puzzle.log.push('Lock won\'t turn — pins not all set. Attempts left: ' + Number(puzzle.attemptsLeft || 0) + '.');
        if (Number(puzzle.attemptsLeft || 0) <= 0) {
          if (typeof closeModal === 'function') closeModal();
          room.result = '🧩 Lock seized — tumblers jammed after too many failed attempts.';
          return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
        }
        return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
      }
      puzzle.log.push('All five tumblers clicked into place. The lock opens.');
    }

    puzzle.state.moves = Number(puzzle.state.moves || 0) + 1;
    if (ok) {
      puzzle.solved = true;
      room.progress = Math.max(0, Number(room.progressNeeded || 1) - 1);
      if (typeof closeModal === 'function') closeModal();
      room.result = '🧩 Puzzle solved: route unlocked with coherent patterning.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }
    if (consumeAttempt) {
      puzzle.attemptsLeft = Math.max(0, Number(puzzle.attemptsLeft || 0) - 1);
      if (Number(puzzle.attemptsLeft || 0) <= 0) {
        if (typeof closeModal === 'function') closeModal();
        room.result = '🧩 Puzzle lockout triggered after failed sequence.';
        return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
      }
    }
    return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
  };

  window.resolveLegacyRaidPuzzleBypass = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var check = resolveLegacyRaidContest(6, 6, 0);
    if (check.success) {
      room.result = '🧩 Bypass success (AD d' + check.actionDie + ' ' + check.actionRoll + ' vs DD6 ' + check.dreadRoll + '). Route forced open.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }
    room.result = '🧩 Bypass failed (AD d' + check.actionDie + ' ' + check.actionRoll + ' vs DD6 ' + check.dreadRoll + '). Pressure spikes.';
    return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
  };

  window.submitLegacyRaidPuzzleRoleAction = function (missionId, wingNum, roomIdx, role, move) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle || puzzle.solved) return false;

    var state = ensureLegacyRaidPuzzleRoleState(puzzle);
    role = String(role || '').toLowerCase();
    move = String(move || '');
    if (!state.roleCooldowns.hasOwnProperty(role)) return false;
    if (Number(state.roleCooldowns[role] || 0) > 0) {
      puzzle.log.push(role + ' is on cooldown for ' + Number(state.roleCooldowns[role] || 0) + ' turn(s).');
      return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
    }

    var mode = String(puzzle.mode || 'lock_dials');
    var solved = false;
    var consumedAttempts = 0;
    var refundedAttempts = 0;

    if (mode === 'lock_dials') {
      var code = puzzle.state.code || [1, 1, 1];
      if (move === 'front_stabilize') {
        state.stability = Math.min(2, Number(state.stability || 0) + 1);
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        puzzle.log.push('Front stabilizes tumblers. Stability +' + 1 + '.');
        if (Number(state.stability || 0) >= 2 && Math.random() < 0.25) {
          consumedAttempts += 1;
          puzzle.log.push('Over-bracing jams a tumbler. Attempt pressure +1.');
        }
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_probe') {
        var idx = Math.floor(Math.random() * 3);
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        puzzle.log.push('Mechanics probe: dial ' + (idx + 1) + ' reads ' + Number(code[idx] || 0) + '.');
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_echo') {
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        state.stability = Math.min(3, Number(state.stability || 0) + 1);
        puzzle.log.push('Support echo refines lock resonance. Stability increased.');
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
    } else if (mode === 'symbol_match') {
      var target = String(puzzle.state.target || '☀');
      var symbolFamily = { '☀': 'solar crest', '☾': 'lunar seal', '✶': 'star sigil', '⬡': 'vault glyph' };
      if (move === 'front_mark_family') {
        puzzle.log.push('Front marks probable family: ' + String(symbolFamily[target] || 'unknown sigil') + '.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        if (Math.random() < 0.2) {
          consumedAttempts += 1;
          puzzle.log.push('Front callout overcommitted the room to a false tell. Attempt pressure +1.');
        }
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_decode_symbol') {
        puzzle.log.push('Mechanics decode: correct icon is ' + target + '.');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_harmony_symbol') {
        puzzle.log.push('Support harmonizes sigils. Next symbol mismatch will not consume an attempt.');
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        state.symbolShield = true;
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
    } else if (mode === 'constellation') {
      if (move === 'front_trace_path') {
        puzzle.state.seq = String((puzzle.state.seq || '') + '1');
        puzzle.log.push('Front traces opening arc through star 1.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_calibrate_star') {
        var nextMap = { '': '1', '1': '3', '13': '5' };
        var key = String(puzzle.state.seq || '').slice(-2);
        var next = nextMap.hasOwnProperty(key) ? nextMap[key] : '3';
        puzzle.log.push('Mechanics calibration suggests next safe node: ' + next + ' (safe scan, no penalty risk).');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        puzzle.state.seqHint = next;
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 0);
      } else if (move === 'support_sync_stars') {
        puzzle.state.seq = String(puzzle.state.seq || '').replace(/[^135]/g, '');
        puzzle.log.push('Support sync purges noisy star links from the chain.');
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
      solved = String(puzzle.state.seq || '').slice(-3) === '135';
    } else if (mode === 'pipe_flow') {
      if (move === 'front_force_valve') {
        if (puzzle.state.tiles && puzzle.state.tiles[1]) puzzle.state.tiles[1].rotation = 0;
        puzzle.log.push('Front forces the mainline straight into place.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 3);
      } else if (move === 'mech_route_pressure') {
        if (puzzle.state.tiles) {
          if (puzzle.state.tiles[2]) puzzle.state.tiles[2].rotation = 2;
          if (puzzle.state.tiles[5]) puzzle.state.tiles[5].rotation = 1;
        }
        puzzle.log.push('Mechanics routes the remaining path with precision.');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_bleed_pressure') {
        puzzle.attemptsLeft = Math.min(3, Number(puzzle.attemptsLeft || 0) + 1);
        puzzle.log.push('Support recovers a failed attempt and steadies the pressure rhythm.');
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 1);
      }
      solved = isLegacyRaidPipeFlowSolved(puzzle);
    } else if (mode === 'weight_balance') {
      if (move === 'front_shift_mass') {
        puzzle.state.left = [2, 2];
        puzzle.state.right = [1, 3];
        puzzle.state.pool = [1, 3];
        puzzle.log.push('Front locks the heavy pair into the left pan.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_trim_mass') {
        puzzle.state.left = [1, 3];
        puzzle.state.right = [2, 2];
        puzzle.state.pool = [1, 3];
        puzzle.log.push('Mechanics fine-trim the pans into a near-even state.');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_counterweight') {
        puzzle.state.left = [1, 3];
        puzzle.state.right = [1, 3];
        puzzle.state.pool = [2, 2];
        puzzle.log.push('Support marks the true center and equalizes both pans.');
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
      var roleLeft = (puzzle.state.left || []).reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
      var roleRight = (puzzle.state.right || []).reduce(function (sum, value) { return sum + Number(value || 0); }, 0);
      solved = roleLeft === roleRight && roleLeft === Number(puzzle.state.target || 4);
    } else if (mode === 'food_chain') {
      if (!Array.isArray(puzzle.state.selected)) puzzle.state.selected = [];
      if (!Array.isArray(puzzle.state.targetCells)) puzzle.state.targetCells = [];
      if (move === 'front_mark_predator') {
        puzzle.state.selected = ['0:0', '1:1', '2:2'];
        puzzle.log.push('Front marks apex sequence cells.');
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_map_chain') {
        puzzle.state.selected = ['0:0', '1:1', '2:2', '3:3', '2:3'];
        puzzle.log.push('Mechanics maps prey transitions through the grid.');
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_context_chain') {
        puzzle.state.selected = puzzle.state.targetCells.slice();
        puzzle.log.push('Support anchors the complete ecological chain.');
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
      solved = puzzle.state.selected.slice().sort().join('|') === puzzle.state.targetCells.slice().sort().join('|');
    } else if (mode === 'limited_move') {
      var targetPath = String(puzzle.state.path || 'LURRD');
      if (move === 'front_dash_step') {
        var nextFrontStep = targetPath.charAt(String(puzzle.state.pathTaken || '').length) || 'L';
        puzzle.state.pathTaken = String((puzzle.state.pathTaken || '') + nextFrontStep);
        puzzle.log.push('Front dashes through lane: ' + nextFrontStep + '. Path now ' + puzzle.state.pathTaken + '.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_reveal_path') {
        var nextStep = targetPath.charAt(String(puzzle.state.pathTaken || '').length) || '-';
        puzzle.log.push('Mechanics reveal: next optimal move is ' + nextStep + '.');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_rewind_step') {
        var currentPath = String(puzzle.state.pathTaken || '');
        var nextLen = currentPath.length;
        var safePrefix = targetPath.slice(0, nextLen);
        if (currentPath !== safePrefix) {
          puzzle.state.pathTaken = targetPath.slice(0, Math.max(0, nextLen - 1));
          puzzle.log.push('Support recovers route to safe prefix. Path now ' + String(puzzle.state.pathTaken || '') + '.');
          if (Number(puzzle.attemptsLeft || 0) < 3) refundedAttempts = 1;
        } else {
          puzzle.state.pathTaken = currentPath.slice(0, -1);
          puzzle.log.push('Support rewind removes last step safely. Path now ' + String(puzzle.state.pathTaken || '') + '.');
        }
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 1);
      }
      if (String(puzzle.state.pathTaken || '').length > targetPath.length) {
        consumedAttempts += 1;
        puzzle.state.pathTaken = '';
        puzzle.log.push('Path overflow triggered reset.');
      }
      solved = String(puzzle.state.pathTaken || '') === targetPath;
    } else if (mode === 'shape_route') {
      var shapeTarget = String(puzzle.state.target || 'ABCD');
      if (move === 'front_anchor_shape') {
        var nextShape = shapeTarget.charAt(String(puzzle.state.route || '').length) || 'A';
        puzzle.state.route = String((puzzle.state.route || '') + nextShape);
        puzzle.log.push('Front anchors shape ' + nextShape + '. Route now ' + puzzle.state.route + '.');
        state.frontlineMomentum = Math.min(3, Number(state.frontlineMomentum || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'front', 2);
      } else if (move === 'mech_rotate_shape') {
        puzzle.log.push('Mechanics rotation confirms ordering: ' + shapeTarget.split('').join('→') + '.');
        state.mechanicsInsight = Math.min(3, Number(state.mechanicsInsight || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'mechanics', 1);
      } else if (move === 'support_link_shape') {
        var remaining = shapeTarget.slice(String(puzzle.state.route || '').length);
        if (remaining.length >= 2) {
          puzzle.state.route = String((puzzle.state.route || '') + remaining.slice(0, 2));
          puzzle.log.push('Support links two compatible segments. Route now ' + puzzle.state.route + '.');
        } else {
          puzzle.log.push('Support link attempted, but no compatible pair remained.');
          consumedAttempts += 1;
        }
        state.supportHarmony = Math.min(3, Number(state.supportHarmony || 0) + 1);
        setLegacyRaidPuzzleRoleCooldown(puzzle, 'support', 2);
      }
      solved = String(puzzle.state.route || '') === shapeTarget;
    }

    tickLegacyRaidPuzzleRoleCooldowns(puzzle);
    if (solved) {
      puzzle.solved = true;
      room.progress = Math.max(0, Number(room.progressNeeded || 1) - 1);
      if (typeof closeModal === 'function') closeModal();
      room.result = '🧩 Puzzle solved via coordinated role actions.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }

    if (refundedAttempts > 0) {
      puzzle.attemptsLeft = Math.min(3, Number(puzzle.attemptsLeft || 0) + refundedAttempts);
      puzzle.log.push('Support recovery restored ' + refundedAttempts + ' attempt. Attempts left: ' + Number(puzzle.attemptsLeft || 0) + '.');
    }

    if (consumedAttempts > 0) {
      puzzle.attemptsLeft = Math.max(0, Number(puzzle.attemptsLeft || 0) - consumedAttempts);
      puzzle.log.push('Failure pressure consumed ' + consumedAttempts + ' attempt' + (consumedAttempts > 1 ? 's' : '') + '. Attempts left: ' + Number(puzzle.attemptsLeft || 0) + '.');
    }
    if (Number(puzzle.attemptsLeft || 0) <= 0) {
      if (typeof closeModal === 'function') closeModal();
      room.result = '🧩 Puzzle lockout after repeated failed role sequences.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
    }
    return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
  };

  window.submitLegacyRaidLockDialGuess = function (missionId, wingNum, roomIdx, a, b, c) {
    var mission = getMission(missionId);
    if (!mission) return false;
    var map = ensureRaidHexMap(mission);
    var room = map && map.wings && map.wings[wingNum] ? map.wings[wingNum][roomIdx] : null;
    if (!room || room.type !== 'Puzzle') return false;
    var puzzle = ensureLegacyRaidLockDialState(mission, wingNum, roomIdx);
    if (!puzzle || puzzle.solved) return false;
    var code = puzzle.state.code || [1, 1, 1];
    var guess = [Number(a || 0), Number(b || 0), Number(c || 0)];
    var matches = 0;
    for (var i = 0; i < 3; i++) if (guess[i] === Number(code[i] || 0)) matches += 1;
    var assist = getLegacyRaidRoomAssistBonus(mission, wingNum, roomIdx);
    if (assist > 0 && matches === 2) matches = 3;
    puzzle.log.push('Dial guess [' + guess.join('-') + '] → ' + matches + '/3 aligned.');
    if (matches >= 3) {
      puzzle.solved = true;
      room.progress = Math.max(0, Number(room.progressNeeded || 1) - 1);
      if (typeof closeModal === 'function') closeModal();
      room.result = '🧩 Lock dials fully aligned.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, true);
    }
    puzzle.attemptsLeft = Math.max(0, Number(puzzle.attemptsLeft || 0) - 1);
    if (Number(puzzle.attemptsLeft || 0) <= 0) {
      if (typeof closeModal === 'function') closeModal();
      room.result = '🧩 Lockout triggered after 3 failed attempts.';
      return window._resolveRaidRoomOutcome(missionId, wingNum, roomIdx, false);
    }
    return openLegacyRaidLockDialPuzzle(missionId, wingNum, roomIdx);
  };

  function _raidRevealNextRoom(rooms, clearedIdx) {
    var nextIdx = clearedIdx + 1;
    if (nextIdx < rooms.length) {
      rooms[nextIdx].discovered = true;
      rooms[nextIdx].frontier = false;
      if (nextIdx + 1 < rooms.length) {
        rooms[nextIdx + 1].discovered = true;
        rooms[nextIdx + 1].frontier = false;
      }
      if (nextIdx + 2 < rooms.length) rooms[nextIdx + 2].frontier = true;
      if (nextIdx + 3 < rooms.length) rooms[nextIdx + 3].frontier = true;
    }
  }

  function _checkRaidWingComplete(mission, wingNum, rooms) {
    if (!rooms) return;
    // Boss wing variant: completion is handled by resolveRaidBossRoom
    if (wingNum === 3) return;
    var allClear = rooms.every(function (r) { return r.cleared; });
    if (!allClear) return;
    if (wingNum === 1) {
      var loreState = ensureLegacyRaidLorePieces(mission);
      if (loreState && Number(loreState.collected || 0) < Number(loreState.required || 3)) {
        if (typeof showNotif === 'function') {
          showNotif('Wing 1 needs lore fragments: ' + Number(loreState.collected || 0) + '/' + Number(loreState.required || 3) + '.', 'warn');
        }
        return;
      }
    }
    var run = ensureLegacyRaidRunState(mission);
    if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
    if (openLegacyRaidWingLootChoice(mission.id, wingNum, 'advance')) return;
    // Mark step complete and advance
    if (wingNum === 1) {
      mission.steps[1] = mission.steps[1] || {};
      mission.steps[1].completed = true;
      if (typeof removeInformerToken === 'function') removeInformerToken(mission);
      if (typeof showNotif === 'function') showNotif('Wing 1 cleared — Lore fragment secured. Wing 2 is now unlocked.', 'good');
    } else if (wingNum === 2) {
      mission.steps[2] = mission.steps[2] || {};
      mission.steps[2].completed = true;
      if (typeof removeSiteToken === 'function') removeSiteToken(mission);
      if (typeof showNotif === 'function') showNotif('Wing 2 cleared — Gate mechanism solved. Boss Chamber is now accessible.', 'good');
      if (typeof openRaidWingPopup === 'function') {
        setTimeout(function () {
          try { openRaidWingPopup(mission.id, 3); } catch (_err) {}
        }, 0);
      }
    }
    if (typeof refreshMissionSurfaces === 'function') refreshMissionSurfaces();
  }

  /* expose for inline onclick use */
  window.openRaidWingPopup = openRaidWingPopup;

  function buildLegacyRaidWingData(mission) {
    var loreTitle = (mission && mission.steps && mission.steps[1] && mission.steps[1].name) || 'Breach the Lore Wing';
    var puzzleTitle = (mission && mission.steps && mission.steps[2] && mission.steps[2].name) || 'Solve the Intricate Gate Puzzle';
    var bossTitle = (mission && mission.steps && mission.steps[3] && mission.steps[3].name) || ('Defeat ' + String(mission && mission.legacyRaidBoss || 'the Boss'));
    var bossName = String(mission && mission.legacyRaidBoss || 'World Boss');
    var puzzleText = String(mission && mission.legacyRaidPuzzle || 'Intricate multi-room mechanism');
    var loreText = String(mission && mission.step1Intro || mission && mission.lore || 'The raid opens only after the group secures the first story lead.');
    var recoveredLore = String(mission && mission.legacyRaidLoreFragment || '');
    var alliedLine = isLegacyRaidCampaignMode()
      ? 'Campaign Mode: your player team fills ally turns, with lane roles and zone coverage deciding survival.'
      : 'Solo Mode: three Traveling Wayfarers (DD6 | 12 Stress) support the raid as allied specialists.';
    return [
      {
        key: 1,
        title: loreTitle,
        theme: 'Story gate',
        detail: recoveredLore ? (loreText + ' ' + recoveredLore) : loreText,
        actions: [
          'Recover the lore fragment that explains why this boss matters to the Province, sea route, or star lane.',
          'Assign one player to reading telegraphs while others hold the room and manage hazards.',
          'Success should change what opens next instead of only granting damage.'
        ]
      },
      {
        key: 2,
        title: puzzleTitle,
        theme: 'Mechanic gate',
        detail: puzzleText,
        actions: [
          'Split responsibilities so not every player is solving the same problem at once.',
          'The mechanic should punish repeating the same answer; use the room state and boss tells.',
          'Clearing this wing opens the true confrontation path.'
        ]
      },
      {
        key: 3,
        title: bossTitle,
        theme: 'Execution gate',
        detail: bossName + ' changes patterns as the fight progresses. Learn the telegraph, react, wipe, and adapt.',
        actions: [
          alliedLine,
          'Boss mechanics should force movement, positioning, and role swaps instead of tank-and-spank play.',
          'The kill grants medals, raid points, and a unique trophy drop.'
        ]
      }
    ];
  }

  function openLegacyRaidMissionPopup(missionId, context) {
        var campaignMode = isLegacyRaidCampaignMode();
        var allySummaryText = campaignMode
          ? 'Campaign Mode: Ally turns are handled by your team roster and role coverage.'
          : 'Solo Mode: Allied support includes 3 Traveling Wayfarers (DD6 | 12 Stress).';
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    if (typeof openModal !== 'function') return false;
    ensureLegacyRaidMissionConfig(mission);
    var run = ensureLegacyRaidRunState(mission);
    if (run) {
      run.currentWing = getLegacyRaidCurrentWing(mission);
      if (Number(run.checkpointWing || 0) < 1) run.checkpointWing = run.currentWing;
    }

    var steps = mission.steps || {};
    var s1 = steps[1] || { completed: false };
    var s2 = steps[2] || { completed: false };
    var s3 = steps[3] || { completed: false };
    var bossName = String(mission.legacyRaidBoss || 'World Boss');
    var loreText = String(mission.step1Intro || mission.lore || 'A mythic threat has forced open a raid route.');
    var checkpoints = Array.isArray(mission.checkpoints) ? mission.checkpoints.slice() : [];
    var tokenType = String(context && context.tokenType || '').toLowerCase();
    var powerBonus = Number(mission.legacyRaidPowerBonus || mission.bonus || 0);
    var treeBonus = Number(mission.legacyRaidTreeBonus || 0);
    var relicBonus = Number(mission.legacyRaidRelicBonus || 0);
    var openDays = Math.max(1, Number(mission.legacyRaidOpenDays || 3));
    var stepButtons = '';
    var recommendedAction = 'Use the raid window to stage the next wing.';
    var abilities = ensureLegacyRaidAbilities(mission);
    var firstTryBadge = buildLegacyRaidFirstTryBadge(run, !!(s1.completed && s2.completed && s3.completed));
    var timelineCard = buildLegacyRaidTimelineCard(run);
    var wingStateHtml = run
      ? ('<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Wing State</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Current wing: ' + Number(run.currentWing || 1) + ' · Checkpoint: Wing ' + Number(run.checkpointWing || 1) + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Wipes: ' + Number(run.wipes || 0) + ' · Revives: ' + Number(run.revivesUsed || 0) + ' · Credits spent: ' + Number(run.reviveCreditsSpent || 0) + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Wing failures: W1=' + Number(run.wingFailures && run.wingFailures[1] || 0) + ', W2=' + Number(run.wingFailures && run.wingFailures[2] || 0) + ', W3=' + Number(run.wingFailures && run.wingFailures[3] || 0) + '</div>'
        + '</div>')
      : '';

    var abilityHtml = '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Bound Trophy Abilities (1 use each)</div>'
      + (abilities.length
        ? abilities.map(function (ability) {
            var isUsed = !!ability.used;
            return '<div style="padding:.18rem 0;border-bottom:1px solid var(--border2);">'
              + '<div style="font-size:.7rem;color:var(--text2);"><strong>' + String(ability.actionLabel || 'Ability') + '</strong> · ' + String(ability.relicName || 'Bound Trophy') + '</div>'
              + '<div style="font-size:.68rem;color:var(--muted2);line-height:1.45;margin:.08rem 0 .14rem;">' + String(ability.detail || '') + '</div>'
              + (isUsed
                ? '<button class="btn btn-xs" disabled>Used</button>'
                : '<button class="btn btn-xs btn-primary" onclick="useLegacyRaidAbility(' + mission.id + ',\'' + String(ability.id || '') + '\')">Use Once</button>')
              + '</div>';
          }).join('')
        : '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">No bound trophy actives yet. Clear more unique raids to expand this panel.</div>')
      + '</div>';
    var raidCoordinationHtml = run
      ? ('<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Raid Ops Brief</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Time management: ' + Number(run.clockRemaining || ensureLegacyRaidClock(mission)) + ' ticks remaining before forced wipe pressure.</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Role distribution: Front, Mechanics, and Support must be assigned per critical room.</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">' + allySummaryText + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Loot loop: Medals mark completions, Raid Points feed personal raid flavor growth, and trophy unlocks unique power lines.</div>'
        + '</div>')
      : '';

    // Ensure raid hex map is initialized now so room counts are ready
    ensureRaidHexMap(mission);
    var raidMapRoomProgress = function (w) {
      var wMap = mission.raidHexMap && mission.raidHexMap.wings && mission.raidHexMap.wings[w];
      if (!Array.isArray(wMap)) return '';
      var cl = wMap.filter(function (r) { return r.cleared; }).length;
      return cl + '/' + wMap.length + ' rooms';
    };

    if (!s1.completed) {
      if (run && !run.preludeWing1Ready) {
        recommendedAction = 'Prelude required — get NPC intel and set the breach hex before Wing 1.';
        stepButtons = '<button class="btn btn-sm btn-teal" onclick="openLegacyRaidPreludeModal(' + mission.id + ')">→ Start Raid Prelude</button>';
      } else {
        recommendedAction = 'Story gate open — enter Wing 1 to breach the lore and understand the boss.';
        stepButtons = '<button class="btn btn-sm btn-teal" onclick="openRaidWingPopup(' + mission.id + ',1);closeModal();">→ Open Wing Map: Wing 1 <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(1) + ')</span></button>';
      }
    } else if (!s2.completed) {
      recommendedAction = 'Mechanic gate open — Wing 2 puzzle must be solved before the boss chamber stabilises.';
      stepButtons = '<button class="btn btn-sm btn-primary" onclick="openRaidWingPopup(' + mission.id + ',2);closeModal();">→ Open Wing Map: Wing 2 <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(2) + ')</span></button>';
    } else if (!s3.completed) {
      recommendedAction = 'Boss wing open — every telegraph learned. Enter the Confrontation Chamber.';
      stepButtons = '<button class="btn btn-sm btn-warn" onclick="openRaidWingPopup(' + mission.id + ',3);closeModal();">→ Open Wing Map: Wing 3 Boss <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(3) + ')</span></button>';
    } else {
      recommendedAction = 'Raid contract already resolved.';
      stepButtons = '<button class="btn btn-sm" disabled>Raid Cleared</button>';
    }

    var wingHtml = buildLegacyRaidWingData(mission).map(function (wing) {
      var step = steps[wing.key] || {};
      var done = !!step.completed;
      var wingLockedByPrelude = (wing.key === 1 && !done && run && !run.preludeWing1Ready);
      var wingLockedByProgress = (wing.key === 2 && !done && !s1.completed) || (wing.key === 3 && !done && !s2.completed);
      var lockNote = wing.key === 2
        ? 'Locked until Wing 1 lore breach is complete.'
        : (wing.key === 3 ? 'Locked until Wing 2 waypoint mechanics are complete.' : '');
      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="display:flex;justify-content:space-between;gap:.35rem;margin-bottom:.18rem;">'
        + '<div style="font-size:.77rem;color:var(--text2);"><strong>Wing ' + wing.key + ': ' + wing.title + '</strong></div>'
        + '<div style="font-size:.67rem;color:' + (done ? 'var(--green2)' : 'var(--gold2)') + ';text-transform:uppercase;letter-spacing:.08em;">' + (done ? 'Cleared' : wing.theme) + '</div>'
        + '</div>'
        + '<div style="font-size:.71rem;color:var(--muted2);line-height:1.5;margin-bottom:.18rem;">' + wing.detail + '</div>'
        + '<div style="font-size:.69rem;color:var(--teal);line-height:1.45;margin-bottom:.22rem;">' + wing.actions.join(' ') + '</div>'
        + (!done
          ? (wingLockedByPrelude
            ? '<button class="btn btn-xs btn-teal" onclick="openLegacyRaidPreludeModal(' + mission.id + ')">→ Start Prelude</button>'
            : wingLockedByProgress
              ? '<button class="btn btn-xs" disabled>Locked</button><div style="font-size:.64rem;color:var(--muted2);margin-top:.16rem;">' + lockNote + '</div>'
            : '<button class="btn btn-xs btn-teal" onclick="openRaidWingPopup(' + mission.id + ',' + wing.key + ')">→ Open Wing Map</button>')
          : '<span style="font-size:.67rem;color:var(--green2);">✓ Wing complete</span>')
        + '</div>';
    }).join('');

    var telegraphHtml = getLegacyRaidTelegraphLines(mission).map(function (line) {
      return '<div style="padding:.12rem 0;border-bottom:1px solid var(--border2);font-size:.7rem;color:var(--muted2);line-height:1.45;">' + line + '</div>';
    }).join('');

    var checkpointHtml = checkpoints.length
      ? checkpoints.map(function (line) {
          return '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;padding:.1rem 0;">• ' + line + '</div>';
        }).join('')
      : '<div style="font-size:.7rem;color:var(--muted2);">No checkpoints recorded.</div>';

    var roleHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.28rem;margin-bottom:.35rem;">'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.42rem .45rem;"><div style="font-size:.66rem;color:var(--gold2);text-transform:uppercase;letter-spacing:.08em;">Front Line</div><div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Hold the boss, reposition telegraphs, and protect puzzle solvers.</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.42rem .45rem;"><div style="font-size:.66rem;color:var(--teal);text-transform:uppercase;letter-spacing:.08em;">Mechanics</div><div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Read tells, solve room logic, and call swaps before the wipe mechanic lands.</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.42rem .45rem;"><div style="font-size:.66rem;color:var(--red2);text-transform:uppercase;letter-spacing:.08em;">Support</div><div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Use the allied Wayfarers to cover pressure lanes and rescue failed positioning.</div></div>'
      + '</div>';

    openModal(
      'Raid Window - ' + mission.title,
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;max-width:960px;">'
        + '<div style="margin-bottom:.45rem;">'
        + '<div style="font-size:.93rem;color:var(--gold2);margin-bottom:.18rem;"><strong>' + mission.title + '</strong></div>'
        + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.18rem;">' + loreText + '</div>'
        + '<div style="font-size:.72rem;color:var(--teal);">Boss: ' + bossName + ' | Marker: ' + (tokenType || 'raid') + ' | Open window: ' + openDays + ' in-game days | Recommended: ' + recommendedAction + '</div>'
        + '<div style="margin-top:.22rem;">' + firstTryBadge + '</div>'
        + '</div>'
        + roleHtml
        + '<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:.45rem;margin-bottom:.42rem;">'
        + '<div style="display:grid;gap:.35rem;">' + wingHtml + '</div>'
        + '<div style="display:grid;gap:.35rem;">'
        + wingStateHtml
        + raidCoordinationHtml
        + timelineCard
        + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Telegraphs and Readability</div>'
        + telegraphHtml
        + '</div>'
        + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Raid Rewards</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">+' + Number(mission.legacyRaidMedalReward || 1) + ' Medal · +' + Number(mission.legacyRaidPointReward || 1) + ' Raid Point</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Unique trophy: ' + String(mission.legacyRaidBoss || bossName) + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Raid power bonus: +' + powerBonus + ' (Tree +' + treeBonus + ', Trophy +' + relicBonus + ')</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">' + allySummaryText + '</div>'
        + '</div>'
        + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Checkpoint Flow</div>'
        + checkpointHtml
        + '</div>'
        + abilityHtml
        + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;">'
        + stepButtons
        + '</div>'
        + '</div>'
    );
    return true;
  }

  /* ── STEP 1 ── */
  function buildMissionStepDialogue(mission, stepKey) {
    if (!mission || mission.missionType === 'legacy_raid') return '';
    var title = String(mission.title || 'Contract');
    var target = String(mission.target || 'the objective');
    var location = String(mission.location || 'the route');
    var district = String(mission.wtwDistrict || mission.wtwZone || location || 'the district');
    if (String(stepKey) === 'informer') {
      return '<div style="background:rgba(201,162,39,.08);border:1px solid rgba(201,162,39,.35);padding:.45rem .55rem;margin-bottom:.45rem;font-size:.76rem;line-height:1.5;color:var(--text2);">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.6rem;letter-spacing:.08em;color:var(--gold2);text-transform:uppercase;margin-bottom:.16rem;">Informer Dialogue</div>'
        + '<div style="margin-bottom:.12rem;"><strong style="color:var(--teal);">Informer:</strong> "You are the one on <em>' + title + '</em>? Then listen carefully. ' + target + ' is tied to ' + district + ', and someone is trying to bury the trail."</div>'
        + '<div><strong style="color:var(--gold2);">You:</strong> "Give me one lead that matters." <strong style="color:var(--teal);">Informer:</strong> "Find the site first. Do not start loud. If the wrong eyes spot you, the confrontation becomes a trap."</div>'
      + '</div>';
    }
    if (String(stepKey) === 'site') {
      return '<div style="background:rgba(46,196,182,.08);border:1px solid rgba(46,196,182,.35);padding:.45rem .55rem;margin-bottom:.45rem;font-size:.76rem;line-height:1.5;color:var(--text2);">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.6rem;letter-spacing:.08em;color:var(--teal);text-transform:uppercase;margin-bottom:.16rem;">Site Dialogue</div>'
        + '<div style="margin-bottom:.12rem;"><strong style="color:var(--gold2);">Field Comms:</strong> "This is the ' + location + '. Signs of a rushed operation everywhere. Whoever staged this expected company."</div>'
        + '<div><strong style="color:var(--teal);">Scout:</strong> "I can map a safer lane, but we only get one clean attempt. If we miss, they know we are here before confrontation starts."</div>'
      + '</div>';
    }
    if (String(stepKey) === 'confrontation') {
      return '<div style="background:rgba(224,80,80,.08);border:1px solid rgba(224,80,80,.35);padding:.45rem .55rem;margin-bottom:.45rem;font-size:.76rem;line-height:1.5;color:var(--text2);">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.6rem;letter-spacing:.08em;color:var(--red2);text-transform:uppercase;margin-bottom:.16rem;">Confrontation Dialogue</div>'
        + '<div style="margin-bottom:.12rem;"><strong style="color:var(--gold2);">Target Channel:</strong> "So the board sent you. You should have stayed in the briefing room."</div>'
        + '<div><strong style="color:var(--teal);">You:</strong> "This ends now. ' + title + ' is done when you stand down or fall."</div>'
      + '</div>';
    }
    return '';
  }

  function rollInfoFeature() { return INFO_FEATURES[roll(6)-1]; }
  function rollInfoDanger() {
    return roll(6)<=3 ? {type:'mercenary',data:{name:'Mercenary',dread:10,hp:20}} : {type:'complication',data:pick(LOCATION_COMPLICATIONS)};
  }

  function startMissionStep1(missionId) {
    ensureState();
    var mission = getMission(missionId);
    if (!mission) return;
    if (mission.missionType === 'legacy_raid') {
      setLegacyRaidCurrentWing(mission, 1);
      if (typeof window.openRaidWingPopup === 'function') {
        window.openRaidWingPopup(mission.id, 1);
        return;
      }
    }
    var advDie=getStat('adventure'), dreadDie=mission.dread;
    var manualMode=isMissionManualRollMode();
    var advR=manualMode?null:explodingRoll(advDie), dreadR=manualMode?null:explodingRoll(dreadDie);
    var success=manualMode?null:(advR.total>=dreadR.total);
    var successFod=rollInfoFeature();
    var failureFod=rollInfoDanger();

    var rollBlock = manualMode
      ? '<div style="background:var(--surface);border:1px solid var(--border2);padding:.55rem .65rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Roll Adventure d'+advDie+' vs Dread d'+dreadDie+' using the Dice tab or physical dice, then choose the outcome.</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);">Success reveals a Hidden Feature and grants +5 bonus. Failure adds Additional Danger.</div>'
      + '</div>'
      : '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .6rem;margin-bottom:.45rem;">'
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
    if (!manualMode && success) {
      var f=successFod;
      resultBlock='<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.5rem .6rem;margin-bottom:.45rem;">'
        +'<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--teal);text-transform:uppercase;margin-bottom:.25rem;">\u2b62 Hidden Feature Revealed (d6 = '+f.id+')</div>'
        +'<div style="font-size:.85rem;color:var(--text);margin-bottom:.15rem;"><strong>'+f.icon+' '+f.name+'</strong></div>'
        +'<div style="font-size:.78rem;color:var(--muted3);line-height:1.5;">'+f.effectDesc+'</div>'
      +'</div>';
    } else if (!manualMode) {
      var d=failureFod;
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

    var successEncoded=encodeURIComponent(JSON.stringify(successFod));
    var failureEncoded=encodeURIComponent(JSON.stringify(failureFod));
    var introLine = mission.step1Intro || ('<strong style="color:var(--gold2);">' + (mission.steps[1].name || 'Gather Information') + '</strong> - optional. Success grants <strong style="color:var(--teal);">+5 bonus</strong> and reveals a hidden feature. Failure introduces <strong style="color:var(--red2);">Additional Danger</strong>. You may also skip.');
    var html=buildMissionStepDialogue(mission, 'informer')
      +'<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'+introLine+'</div>'
      +rollBlock+resultBlock
      +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        +'<button class="btn btn-sm" onclick="skipMissionStep1('+missionId+');closeModal();">Skip This Step</button>'
        +(manualMode
          ? '<button class="btn btn-sm btn-red" onclick="completeMissionInfoStep('+missionId+',false,decodeURIComponent(\''+failureEncoded+'\'));closeModal();">Failure</button>'
            +'<button class="btn btn-sm btn-primary" onclick="completeMissionInfoStep('+missionId+',true,decodeURIComponent(\''+successEncoded+'\'));closeModal();">Success</button>'
          : '<button class="btn btn-sm btn-teal" onclick="completeMissionInfoStep('+missionId+','+success+',decodeURIComponent(\''+(success ? successEncoded : failureEncoded)+'\'));closeModal();">Confirm</button>')
      +'</div>';
    openModal('Step 1 - ' + (mission.steps[1].name || 'Gather Information'),html);
  }

  function completeMissionInfoStep(missionId, success, encodedResult) {
    var mission = getMission(missionId);
    if (!mission) return;
    mission.steps[1].completed=true; mission.steps[1].skipped=false;
    removeInformerToken(mission);
    if (success) {
      if (mission.missionType === 'legacy_raid') markLegacyRaidWingOutcome(mission, 1, true);
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
      if (mission.missionType === 'legacy_raid') markLegacyRaidWingOutcome(mission, 1, false);
      var dan=typeof encodedResult==='string'?JSON.parse(encodedResult):encodedResult;
      mission.additionalDanger=dan;
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
    refreshMissionSurfaces();
  }

  function skipMissionStep1(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    mission.steps[1].completed=true; mission.steps[1].skipped=true;
    removeInformerToken(mission);
    refreshMissionSurfaces();
  }

  /* ── STEP 2: INTERACTIVE SITE EXPLORATION ── */
  function startMissionStep2(missionId) {
    ensureState();
    var mission=getMission(missionId); if (!mission) return;
    if (!mission.steps[1].completed) { showNotif('Complete or skip Step 1 first.','warn'); return; }
    if (mission.missionType === 'legacy_raid') {
      setLegacyRaidCurrentWing(mission, 2);
      if (typeof window.openRaidWingPopup === 'function') {
        window.openRaidWingPopup(mission.id, 2);
        return;
      }
    }
    if (!mission.siteRoll) {
      var advDie=getStat('adventure'), bonus=mission.bonus||0;
      if (isMissionManualRollMode()) {
        mission.siteRoll={ advDie:advDie, dreadDie:mission.dread, adv:null, bonus:bonus, dread:null, total:null, success:null, exploded:false, manual:true, pending:true };
      } else {
        var aR=explodingRoll(advDie), dR=explodingRoll(mission.dread);
        var tot=aR.total+bonus;
        mission.siteRoll={ advDie:advDie, dreadDie:mission.dread, adv:aR.total, bonus:bonus, dread:dR.total, total:tot, success:tot>=dR.total, exploded:aR.exploded };
      }
    }
    renderSiteModal(missionId);
  }

  function renderSiteModal(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    var sr=mission.siteRoll, bonus=sr.bonus||0;
    var featureBadge='';
    if (mission.infoFeature) {
      featureBadge='<div style="font-size:.7rem;color:var(--teal);margin-bottom:.35rem;padding:.2rem .4rem;border:1px solid rgba(46,196,182,.3);display:inline-block;">'+mission.infoFeature.icon+' '+mission.infoFeature.name+' \u2014 '+mission.infoFeature.effectDesc+'</div><br>';
    }

    // Complication banner
    var compBanner='';
    if (mission.additionalDanger&&mission.additionalDanger.type==='complication') {
      var comp=mission.additionalDanger.data;
      compBanner='<div style="background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.35);padding:.3rem .5rem;margin-bottom:.4rem;font-size:.74rem;"><strong style="color:var(--red2);">\u26a0 '+comp.name+'</strong> <span style="color:var(--muted3);">\u2014 '+comp.desc+'</span></div>';
    }

    if (sr && sr.pending) {
      var titleElPending=document.getElementById('modalTitle');
      var contentElPending=document.getElementById('modalContent');
      if (titleElPending) titleElPending.textContent='Step 2 - '+((mission.steps[2] && mission.steps[2].name) || 'Go to Site');
      if (contentElPending) contentElPending.innerHTML=buildMissionStepDialogue(mission, 'site')+compBanner+featureBadge
        +'<div style="background:var(--surface);border:1px solid var(--border2);padding:.55rem .65rem;margin-bottom:.45rem;">'
          +'<div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Roll Adventure d'+sr.advDie+(bonus?' + '+bonus:'')+' vs Dread d'+sr.dreadDie+' to approach the site, then choose the outcome.</div>'
          +'<div style="font-size:.7rem;color:var(--muted2);">Success means you arrive undetected. Failure means you lose time and the site is alerted.</div>'
        +'</div>'
        +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
          +'<button class="btn btn-sm btn-red" onclick="resolveMissionSiteApproach('+missionId+',false)">Failure</button>'
          +'<button class="btn btn-sm btn-primary" onclick="resolveMissionSiteApproach('+missionId+',true)">Success</button>'
        +'</div>';
      var pendingModal=document.getElementById('rollModal');
      if (pendingModal&&!pendingModal.classList.contains('open')) pendingModal.classList.add('open');
      return;
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

    var irradiated=mission.additionalDanger&&mission.additionalDanger.type==='complication'&&mission.additionalDanger.data.name==='Irradiated';
    function isRoomVisible(room,idx){
      if(!room||!room.secretRoute)return true;
      var originIdx=Number(room.fromPuzzleRoom);
      if(!Number.isFinite(originIdx)||originIdx<0||originIdx>=mission.rooms.length)return false;
      var origin=mission.rooms[originIdx];
      return !!(origin&&origin.explored&&origin.find&&origin.find.resolved&&origin.find.secretRouteOpened);
    }
    var visibleRooms=[];
    mission.rooms.forEach(function(room,idx){if(isRoomVisible(room,idx))visibleRooms.push({room:room,idx:idx});});
    var roomsHTML='<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.25rem;">Site Layout \u2014 '+visibleRooms.length+' Room'+(visibleRooms.length!==1?'s':'')+'</div>';

    visibleRooms.forEach(function(entry) {
      var room=entry.room;
      var idx=entry.idx;
      var explored=room.explored, confrontActive=room.confrontTriggered&&!room.confrontResolved;
      var isBranch=!!room.secretRoute;
      var branchFrom=(typeof room.fromPuzzleRoom==='number')?('Room '+(room.fromPuzzleRoom+1)):'the solved puzzle room';
      var findHTML='';
      if (explored&&room.find) {
        var fc=room.find.type==='trap'?'var(--red2)':room.find.type==='puzzle'?'var(--gold2)':room.find.type==='cache'?'var(--green2)':'var(--muted3)';
        findHTML='<div style="font-size:.7rem;color:'+fc+';margin-top:.2rem;padding-top:.2rem;border-top:1px dashed var(--border);">'+room.find.text+'</div>';
        if (irradiated) findHTML+='<div style="font-size:.66rem;color:var(--red2);">\u2622 Irradiated: +1 Stress for entering this room.</div>';
      }
      var actionBtn='';
      if (!explored) {
        actionBtn='<button class="btn btn-xs btn-teal" onclick="exploreRoom('+missionId+','+idx+')" style="margin-top:.2rem;">Investigate</button>';
      } else if (room.find&&room.find.type==='enemy'&&!room.find.resolved) {
        actionBtn='<div style="margin-top:.2rem;display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;"><div style="font-size:.7rem;color:var(--red2);font-weight:700;">\u2694 '+room.find.count+' enemies \u00b7 DD'+room.find.dd+' \u00b7 '+room.find.hp+' HP each</div><button class="btn btn-xs" onclick="openMissionRoomCombat('+missionId+','+idx+')">Open Combat</button><button class="btn btn-xs btn-red" onclick="resolveMissionRoomEnemy('+missionId+','+idx+',false)">Failure</button><button class="btn btn-xs btn-primary" onclick="resolveMissionRoomEnemy('+missionId+','+idx+',true)">Success</button></div>';
      } else if (room.find&&room.find.type==='trap'&&!room.find.resolved) {
        actionBtn='<div style="margin-top:.2rem;"><button class="btn btn-xs btn-teal" onclick="resolveMissionRoomTrap('+missionId+','+idx+')">'+(isMissionManualRollMode()?'Resolve Trap (Success/Failure)':'Resolve Trap (Action vs DD'+(room.find.dd||6)+')')+'</button></div>';
      } else if (room.find&&room.find.type==='puzzle'&&!room.find.resolved) {
        actionBtn='<div style="margin-top:.2rem;"><button class="btn btn-xs btn-teal" onclick="startMissionRoomPuzzle('+missionId+','+idx+')">Solve Puzzle</button></div>';
      } else if (confrontActive) {
        actionBtn='<div style="margin-top:.2rem;display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;"><div style="font-size:.7rem;color:var(--red2);font-weight:700;">\u26a1 Confrontation triggered!</div><button class="btn btn-xs btn-red" onclick="resolveRoomConfrontation('+missionId+','+idx+',false)">Fail</button><button class="btn btn-xs btn-primary" onclick="resolveRoomConfrontation('+missionId+','+idx+',true)">Succeed</button></div>';
      }
      roomsHTML+='<div style="padding:.3rem .4rem;margin-bottom:.25rem;'+(isBranch?'margin-left:1rem;border-left:3px solid rgba(201,162,39,.45);':'')+'border:1px solid '+(confrontActive?'var(--red2)':explored?'var(--border)':'var(--border2)')+';background:'+(confrontActive?'rgba(200,50,50,.05)':'var(--surface)')+';">'
        +'<div style="font-size:.75rem;color:'+(explored?'var(--muted2)':'var(--text)')+';">'+(explored?'\u2713 ':'')+(isBranch?'\u21b3 ':'')+room.label+'</div>'
        +(isBranch?'<div style="font-size:.66rem;color:var(--gold2);margin-top:.08rem;">Branch path from '+branchFrom+'</div>':'')
        +findHTML+actionBtn
      +'</div>';
    });

    var allExplored=visibleRooms.every(function(entry){return entry.room.explored;});
    var hasActive=visibleRooms.some(function(entry){var r=entry.room;return r.confrontTriggered&&!r.confrontResolved;});
    var proceedBtn='';
    if (!hasActive) {
      if (allExplored) {
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm btn-teal" onclick="completeMissionSiteStep('+missionId+');">Proceed to Confrontation</button></div>';
      } else {
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm" onclick="completeMissionSiteStep('+missionId+');" style="opacity:.75;">Skip Remaining Rooms \u2192 Confrontation</button></div>';
      }
    }

    var titleEl=document.getElementById('modalTitle');
    var contentEl=document.getElementById('modalContent');
    if (titleEl) titleEl.textContent='Step 2 - '+((mission.steps[2] && mission.steps[2].name) || 'Go to Site');
    if (contentEl) contentEl.innerHTML=buildMissionStepDialogue(mission, 'site')+compBanner+featureBadge+rollBlock+roomsHTML+proceedBtn;
    var modal=document.getElementById('rollModal');
    if (modal&&!modal.classList.contains('open')) modal.classList.add('open');
  }

  function exploreRoom(missionId,roomIdx) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||room.explored) return;
    room.explored=true;
    var r=roll(6);
    if (r===1) {
      var ddPool=[4,6,8,10,12,20];
      var dd=ddPool[roll(ddPool.length)-1];
      var enemyCount=Math.max(1,roll(4));
      room.find={type:'enemy',count:enemyCount,dd:dd,hp:dd*2,resolved:false,text:'ENEMY PRESENCE \u2014 '+enemyCount+' hostiles are entrenched in this room.'};
    } else if (r<=3) {
      room.find={type:'trap',dd:6,resolved:false,text:pick(ROOM_TRAPS)};
    } else if (r===4) {
      room.find={type:'puzzle',resolved:false,puzzle:JSON.parse(JSON.stringify(pick(SITE_PUZZLE_SPECS))),text:pick(ROOM_PUZZLES)};
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

  function resolveMissionRoomTrap(missionId,roomIdx) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||!room.find||room.find.type!=='trap'||room.find.resolved) return;
    if (isMissionManualRollMode()) {
      openModal('Room Trap','<div style="font-size:.84rem;color:var(--muted3);line-height:1.55;margin-bottom:.5rem;">'
        +room.find.text+'<br><br>Roll Adventure d'+getStat('adventure')+' vs Dread d'+(room.find.dd||6)+' and choose the outcome.</div>'
        +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
          +'<button class="btn btn-sm btn-red" onclick="resolveMissionRoomTrapOutcome('+missionId+','+roomIdx+',false)">Failure</button>'
          +'<button class="btn btn-sm btn-primary" onclick="resolveMissionRoomTrapOutcome('+missionId+','+roomIdx+',true)">Success</button>'
        +'</div>');
      return;
    }
    var statDie=getStat('adventure');
    var a=explodingRoll(statDie), d=explodingRoll(room.find.dd||6);
    room.find.resolved=true;
    if (a.total>=d.total) {
      room.find.text='TRAP DISARMED \u2014 AD d'+statDie+'='+a.total+' vs DD'+(room.find.dd||6)+'='+d.total+'.';
      if (typeof addSuccessRoll==='function') addSuccessRoll();
    } else {
      if (typeof changeStress==='function') changeStress(1);
      if (typeof addTMWOnFail==='function') addTMWOnFail();
      room.find.text='TRAP TRIGGERED \u2014 AD d'+statDie+'='+a.total+' vs DD'+(room.find.dd||6)+'='+d.total+'. +1 Stress.';
    }
    renderSiteModal(missionId);
  }

  function resolveMissionRoomTrapOutcome(missionId,roomIdx,success) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||!room.find||room.find.type!=='trap'||room.find.resolved) return;
    room.find.resolved=true;
    if (success) {
      room.find.text='TRAP DISARMED — manual success against DD'+(room.find.dd||6)+'.';
      if (typeof addSuccessRoll==='function') addSuccessRoll();
    } else {
      if (typeof changeStress==='function') changeStress(1);
      if (typeof addTMWOnFail==='function') addTMWOnFail();
      room.find.text='TRAP TRIGGERED — manual failure against DD'+(room.find.dd||6)+'. +1 Stress.';
    }
    renderSiteModal(missionId);
  }

  function resolveMissionSiteApproach(missionId, success) {
    var mission=getMission(missionId); if (!mission) return;
    var sr=mission.siteRoll; if (!sr) return;
    var bonus=sr.bonus||0;
    sr.manual=true;
    sr.pending=false;
    sr.success=!!success;
    sr.adv='Manual';
    sr.dread='Manual';
    sr.total=success?('Success'+(bonus?' (+'+bonus+')':'')):'Failure';
    sr.exploded=false;
    if (mission.missionType === 'legacy_raid') {
      markLegacyRaidWingOutcome(mission, 2, !!success);
    }
    renderSiteModal(missionId);
  }

  function addMissionSecretRoom(mission, roomIdx, resultType) {
    if (!mission || !Array.isArray(mission.rooms)) return false;
    var origin = mission.rooms[roomIdx];
    if (!origin || !origin.find || origin.find.type !== 'puzzle') return false;
    if (origin.find.secretRouteOpened) return false;

    var secretRoom = {
      label: resultType === 'success' ? 'Secret Room (Unlocked Route)' : 'Secret Annex (Strained Route)',
      explored: false,
      fromPuzzleRoom: roomIdx,
      secretRoute: true,
      find: {
        type: 'cache',
        text: resultType === 'success'
          ? 'SECRET CHAMBER \u2014 hidden cache and route intel revealed by the solved puzzle.'
          : 'SECRET ANNEX \u2014 unstable route opens to salvage and partial intel.'
      }
    };

    origin.find.secretRouteOpened = true;
    origin.find.secretRoomIndex = mission.rooms.length;
    mission.rooms.push(secretRoom);
    return true;
  }

  function startMissionRoomPuzzle(missionId,roomIdx) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||!room.find||room.find.type!=='puzzle'||room.find.resolved) return;
    var puzzle=room.find.puzzle||pick(SITE_PUZZLE_SPECS);
    if (typeof openStandaloneStoryPuzzle!=='function') {
      room.find.resolved=true;
      room.find.text='Puzzle tools unavailable. Marked as unresolved obstacle.';
      renderSiteModal(missionId);
      return;
    }
    openStandaloneStoryPuzzle({
      mode:puzzle.mode,
      title:puzzle.title,
      prompt:puzzle.prompt,
      answer:puzzle.answer,
      sequence:puzzle.sequence,
      bank:puzzle.bank,
      thresholdLabel:'Mission Puzzle',
      successThreshold:0.7,
      partialThreshold:0.45,
      onResolve:function(result){
        room.find.resolved=true;
        if (result==='success'||result==='partial') {
          if (result==='partial'&&typeof changeMentalStress==='function') changeMentalStress(1);
          if (typeof addSuccessRoll==='function') addSuccessRoll();
          var opened=addMissionSecretRoom(mission,roomIdx,result);
          room.find.text=result==='success'?'PUZZLE SOLVED \u2014 route opened.':'PUZZLE PARTIAL \u2014 route opened with strain (+1 Mental Stress).';
          if (opened) room.find.text+=' Secret room added to site layout.';
        } else {
          if (typeof changeMentalStress==='function') changeMentalStress(1);
          if (typeof addTMWOnFail==='function') addTMWOnFail();
          room.find.text='PUZZLE FAILED \u2014 alarm cascade triggered (+1 Mental Stress).';
        }
        renderSiteModal(missionId);
      }
    });
  }

  function openMissionRoomCombat(missionId, roomIdx) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx];
    if (!room || !room.find || room.find.type!=='enemy' || room.find.resolved) return;
    if (typeof S === 'undefined' || !S) return;
    if (!Array.isArray(S.enemies)) S.enemies = [];
    S.enemies = [];
    var count = Math.max(1, Number(room.find.count || 1));
    var dd = Math.max(4, Number(room.find.dd || 6));
    var hp = Math.max(4, Number(room.find.hp || (dd * 2)));
    for (var i = 0; i < count; i++) {
      S.enemies.push({
        id: Date.now() + i,
        name: 'Site Hostile ' + (i + 1),
        dread: dd,
        stress: 0,
        maxStress: hp,
        ally: false
      });
    }
    S.combat = S.combat || {};
    S.combat.enemyDread = dd;
    if (typeof switchTab === 'function') {
      var combatBtn = document.querySelector(".tab-btn[onclick*=\"combat\"]");
      switchTab('combat', combatBtn || null);
    }
    if (typeof updateCombatUI === 'function') updateCombatUI();
    if (typeof renderEnemies === 'function') renderEnemies();
    if (typeof showNotif === 'function') showNotif('Combat loaded: ' + count + ' hostiles (DD' + dd + ', ' + hp + ' HP each).', 'warn');
  }

  function resolveMissionRoomEnemy(missionId,roomIdx,success) {
    var mission=getMission(missionId); if (!mission) return;
    var room=mission.rooms[roomIdx]; if (!room||!room.find||room.find.type!=='enemy'||room.find.resolved) return;
    room.find.resolved=true;
    if (success) {
      if (typeof addSuccessRoll==='function') addSuccessRoll();
      room.find.text='ENEMY ENCOUNTER WON \u2014 room secured and route pressure reduced.';
    } else {
      if (typeof changeStress==='function') changeStress(1);
      if (typeof addTMWOnFail==='function') addTMWOnFail();
      room.find.text='ENEMY ENCOUNTER LOST \u2014 forced retreat (+1 Stress).';
    }
    renderSiteModal(missionId);
  }

  function completeMissionSiteStep(missionId) {
    var mission=getMission(missionId); if (!mission) return;
    mission.steps[2].completed=true;
    if (mission.missionType === 'legacy_raid') {
      setLegacyRaidCurrentWing(mission, 3);
      var run = ensureLegacyRaidRunState(mission);
      if (run && Number(run.wingFailures && run.wingFailures[2] || 0) <= 0) {
        markLegacyRaidWingOutcome(mission, 2, true);
      }
    }
    if (mission.region === 'galaxy' && mission.galaxyTaskId && S.starSystem && Array.isArray(S.starSystem.taskMarkers)) {
      var gTask = S.starSystem.taskMarkers.find(function(t){ return t.id === mission.galaxyTaskId; });
      if (gTask) {
        gTask.missionStep = 'confront';
        gTask.interaction = 'mission-step';
        gTask.title = mission.title + ' (Confrontation)';
        gTask.text = 'Return to this marker to run Step 3 and resolve the mission confrontation.';
      }
      var gHex = (S.starSystem.hexes || []).find(function(h){ return h && h.taskMarker && h.taskMarker.id === mission.galaxyTaskId; });
      if (gHex && gHex.taskMarker) {
        gHex.taskMarker.title = mission.title + ' (Confrontation)';
      }
      if (typeof renderStarSystemMap === 'function') renderStarSystemMap();
      if (typeof updateStarSystemReadouts === 'function') updateStarSystemReadouts();
    }
    refreshMissionSurfaces();
    // Enter confrontation immediately so players do not need to re-click the site marker.
    startMissionStep3(missionId);
  }

  function adjustMissionDread(missionId, dir) {
    if (!isGMModeActive()) {
      showNotif('GM controls are only available in GM mode.','warn');
      return;
    }
    var mission = getMission(missionId);
    if (!mission) return;
    var base = Number(mission.gmDreadOverride || mission.dread || 8);
    mission.gmDreadOverride = stepMissionDreadDie(base, dir > 0 ? 1 : -1);
    if (typeof showNotif === 'function') {
      showNotif('GM Dread set to d' + mission.gmDreadOverride + ' for this mission scene.','good');
    }
    startMissionStep3(missionId);
  }

  /* ── STEP 3: CONFRONTATION ── */
  function startMissionStep3(missionId) {
    ensureState();
    var mission=getMission(missionId); if (!mission) return;
    if (!mission.steps[2].completed) { showNotif('Complete Step 2 first.','warn'); return; }
    if (mission.missionType === 'legacy_raid') {
      setLegacyRaidCurrentWing(mission, 3);
      if (typeof window.openRaidWingPopup === 'function') {
        window.openRaidWingPopup(mission.id, 3);
        return;
      }
    }
    var advDie=getStat('adventure'), dreadDie=Number(mission.gmDreadOverride || mission.dread || 8), bonus=mission.bonus||0;
    var gmMode = isGMModeActive();
    var revealDC = shouldRevealDC();
    var revealHidden = shouldRevealHiddenInfo();

    var compBanner='';
    if (mission.additionalDanger&&mission.additionalDanger.type==='complication') {
      var comp=mission.additionalDanger.data;
      compBanner='<div style="background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.35);padding:.3rem .5rem;margin-bottom:.45rem;font-size:.74rem;"><strong style="color:var(--red2);">\u26a0 '+comp.name+'</strong> <span style="color:var(--muted3);">\u2014 '+comp.desc+'</span></div>';
    }

    var featureBadge='';
    if (mission.infoFeature && revealHidden) {
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
    if (mission.additionalDanger&&mission.additionalDanger.type==='mercenary' && revealHidden) {
      var aRows=MERCENARY_ACTIONS.map(function(a){return '<div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted3);padding:.1rem 0;border-bottom:1px solid var(--border);"><span style="color:var(--muted2);width:1.4rem;">'+a.range[0]+(a.range[1]!==a.range[0]?'\u2013'+a.range[1]:'')+'</span><span style="color:var(--text2);flex:1;padding:0 .3rem;">'+a.name+'</span><span style="color:var(--muted);font-size:.65rem;">'+a.desc+'</span></div>';}).join('');
      mercSection='<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.3);padding:.35rem .5rem;margin-bottom:.4rem;"><div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.15rem;">\u26a0 Additional Danger</div><div style="font-size:.78rem;color:var(--text);font-weight:700;margin-bottom:.15rem;">Mercenary <span style="font-family:\'Rajdhani\',sans-serif;color:var(--red2);">DD10 | 20 HP | 2 Actions</span></div>'+aRows+'</div>';
    }

    var targetRow='<div style="font-size:.78rem;margin-bottom:.45rem;padding:.25rem .35rem;border:1px solid var(--border2);"><strong style="color:var(--gold2);">Target:</strong> <span style="color:var(--text);">'+mission.target+'</span></div>';
    var rollInstr='<div style="background:var(--surface);border:1px solid var(--border2);padding:.4rem .55rem;margin-bottom:.45rem;"><div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Roll Adventure d'+advDie+(bonus?' + '+bonus:'')+' vs '+(revealDC?('Dread d'+dreadDie):'scene Dread')+' \u2014 then click your outcome:</div><div style="font-size:.7rem;color:var(--muted);">Use the Dice tab or physical dice. Add the +'+(bonus||0)+' bonus to your roll before comparing.</div></div>';
    var isLegacyRaidMission = mission && mission.missionType === 'legacy_raid';
    var successAction = isLegacyRaidMission
      ? ('openLegacyRaidCompletionSummary(' + missionId + ')')
      : ('resolveMissionOutcome(' + missionId + ',true)');
    var gmControls='';
    if (gmMode) {
      gmControls='<div style="background:rgba(128,96,192,.08);border:1px solid rgba(128,96,192,.35);padding:.35rem .45rem;margin-bottom:.45rem;">'
        +'<div style="font-family:\'Cinzel\',serif;font-size:.55rem;letter-spacing:.1em;color:var(--purple);text-transform:uppercase;margin-bottom:.2rem;">GM Controls</div>'
        +'<div style="display:flex;gap:.3rem;flex-wrap:wrap;">'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="window.adjustMissionDread('+missionId+',-1)">Dread -</button>'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="window.adjustMissionDread('+missionId+',1)">Dread +</button>'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="if(window.settingsSystem&&window.settingsSystem.showGMPrompt){window.settingsSystem.showGMPrompt(\'Mission Confrontation\',\'Frame the fiction, then choose the outcome based on the scene.\',[{label:\'Mark Success\',action:\''+successAction+';closeModal();\'},{label:\'Mark Failure\',action:\'resolveMissionOutcome('+missionId+',false);closeModal();\'}]);}">Open GM Prompt</button>'
          +'<button class="btn btn-xs btn-primary" onclick="'+successAction+'">GM: Force Success</button>'
          +'<button class="btn btn-xs btn-red" onclick="resolveMissionOutcome('+missionId+',false)">GM: Force Failure</button>'
        +'</div>'
        +'<div style="font-size:.66rem;color:var(--muted2);margin-top:.22rem;">Scene Dread: d'+dreadDie+'</div>'
      +'</div>';
    }

    var html=buildMissionStepDialogue(mission, 'confrontation')+compBanner+featureBadge+guardsSection+mercSection+targetRow+rollInstr+gmControls
      +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        +'<button class="btn btn-sm btn-red" onclick="resolveMissionOutcome('+missionId+',false)">\u2717 Failure \u2014 Roll Failed</button>'
        +'<button class="btn btn-sm btn-primary" onclick="'+successAction+'">\u2713 Success \u2014 Roll Succeeded</button>'
      +'</div>';
    openModal('Step 3 - '+((mission.steps[3] && mission.steps[3].name) || 'Confrontation'),html);
  }

  function triggerOriginStorylineHandoff(mission) {
    if (!mission || mission.missionType !== 'origin_story') return;
    var reason = mission.originReason || (S && S.reason) || 'your purpose';
    S.storyline = S.storyline || {};
    var st = S.storyline;
    st.flags = st.flags || {};
    st.flags.originMissionComplete = true;
    st.flags.originReason = reason;
    if (!st.sceneId || st.sceneId === 'intro') {
      st.sceneId = 'intro';
      st.lastResult = 'A weather-beaten stranger finds you after your first road contract and says: "If that reason still burns, come hear the Gallows Orchard story."';
    }

    if (typeof openModal === 'function') {
      openModal('A Stranger Approaches',
        '<div style="font-size:.9rem;color:var(--text2);line-height:1.6;">'
          + 'You complete your first road mission tied to <strong style="color:var(--gold2);">' + reason + '</strong>. '
          + 'A stranger steps out of the crowd and presses a branded note into your hand.'
          + '<div style="margin-top:.45rem;color:var(--muted2);font-style:italic;">"If you want the truth behind the roads, meet me at the Gallows Orchard."</div>'
          + '<div style="margin-top:.55rem;display:flex;justify-content:flex-end;">'
            + '<button class="btn btn-sm btn-primary" onclick="if(typeof closeModal===\'function\')closeModal();if(typeof openStorylineTab===\'function\')openStorylineTab();">Begin Main Storyline</button>'
          + '</div>'
        + '</div>'
      );
    }
    if (typeof showNotif === 'function') showNotif('Main storyline unlocked: Someone seeks you out.', 'good');
    if (typeof renderStorylinePanel === 'function') {
      try { renderStorylinePanel(); } catch (err) {}
    }
  }

  function getLegacyRaidFailureReviveCost(mission, wing) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return 0;
    var base = 120 + (Number(run.wipes || 0) * 40);
    var w = Math.max(1, Math.min(3, Number(wing || 3)));
    var wingFailures = Number(run.wingFailures && run.wingFailures[w] || 0);
    if (w === 1) {
      base += wingFailures * 35 + Math.max(0, wingFailures - 1) * 20;
    } else if (w === 2) {
      base += wingFailures * 45 + Math.max(0, wingFailures - 1) * 25;
    } else {
      base += wingFailures * 25;
    }
    if (Number(run.checkpointWing || 1) >= 2) base += 25;
    if (Number(run.checkpointWing || 1) >= 3) base += 45;
    if (w === 3) base += 60;
    else if (w === 2) base += 20;
    return Math.max(80, base);
  }

  function openLegacyRaidWipeDecision(missionId) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    var wing = Number(run.pendingWing || run.currentWing || 3);
    var reviveCost = Number(run.pendingReviveCost || 0);
    var freeTokens = Number(run.freeReviveTokens || 0);
    var canFreeRevive = freeTokens > 0;
    var effectiveCost = canFreeRevive ? 0 : reviveCost;
    var replaySummaryHtml = buildLegacyRaidReplaySummary(mission);

    openModal(
      'Raid Wipe - Checkpoint Breach',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="margin-bottom:.35rem;color:var(--red2);"><strong>Wing ' + wing + ' failed.</strong> The encounter did not hold and the team is forced back to a checkpoint.</div>'
        + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.24rem;">Checkpoint revive cost: ' + (canFreeRevive ? 'Free (trophy charge)' : (effectiveCost + ' ₵')) + ' · Wipes this run: ' + Number(run.wipes || 0) + '</div>'
        + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.4rem;">Choose whether to revive at Wing ' + Number(run.checkpointWing || wing) + ' and continue, or accept mission failure.</div>'
        + replaySummaryHtml
        + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-primary" onclick="resolveLegacyRaidReviveChoice(' + mission.id + ',true)">Revive At Checkpoint</button>'
        + '<button class="btn btn-sm btn-red" onclick="resolveLegacyRaidReviveChoice(' + mission.id + ',false)">Fail Raid Contract</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  function resolveLegacyRaidReviveChoice(missionId, revive) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    var reviveCost = Number(run.pendingReviveCost || 0);
    var freeTokens = Number(run.freeReviveTokens || 0);
    var canUseFree = freeTokens > 0;
    var effectiveCost = canUseFree ? 0 : reviveCost;
    if (revive) {
      if (effectiveCost > 0 && Number(S && S.credits || 0) < effectiveCost) {
        if (typeof showNotif === 'function') showNotif('Not enough credits for checkpoint revive.', 'warn');
        return false;
      }
      if (canUseFree) {
        run.freeReviveTokens = Math.max(0, freeTokens - 1);
      } else if (effectiveCost > 0) {
        if (typeof changeCredits === 'function') changeCredits(-effectiveCost);
        else S.credits = Math.max(0, Number(S.credits || 0) - effectiveCost);
      }
      run.revivesUsed = Number(run.revivesUsed || 0) + 1;
      run.reviveCreditsSpent = Number(run.reviveCreditsSpent || 0) + effectiveCost;
      run.pendingReviveCost = 0;
      run.pendingWing = 0;
      resetLegacyRaidClockAtCheckpoint(mission);
      if (typeof closeModal === 'function') closeModal();
      if (typeof showNotif === 'function') showNotif('Raid revived at checkpoint. Timer reset. Re-enter the wing when ready.', 'good');
      return openLegacyRaidMissionPopup(mission.id, { tokenType: 'confront', regionTag: mission.region || 'region' });
    }
    if (typeof closeModal === 'function') closeModal();
    return resolveMissionOutcome(mission.id, false);
  }

  function isLegacyRaidFirstTryClear(run) {
    if (!run) return false;
    var wingFailTotal = Number(run.wingFailures && run.wingFailures[1] || 0)
      + Number(run.wingFailures && run.wingFailures[2] || 0)
      + Number(run.wingFailures && run.wingFailures[3] || 0);
    return Number(run.wipes || 0) === 0 && Number(run.revivesUsed || 0) === 0 && wingFailTotal === 0;
  }

  function buildLegacyRaidFirstTryBadge(run, completed) {
    if (!run) return '';
    var clear = isLegacyRaidFirstTryClear(run);
    if (clear && completed) {
      return '<span style="display:inline-block;padding:.14rem .45rem;border:1px solid #6fe0a8;background:rgba(90,214,138,.14);color:#9af0bf;font-family:\'Cinzel\',serif;font-size:.63rem;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;">First-Try Clear</span>';
    }
    if (clear && !completed) {
      return '<span style="display:inline-block;padding:.14rem .45rem;border:1px solid #f0d070;background:rgba(240,208,112,.12);color:#f0d070;font-family:\'Cinzel\',serif;font-size:.63rem;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;">First-Try Track Intact</span>';
    }
    return '<span style="display:inline-block;padding:.14rem .45rem;border:1px solid rgba(220,120,120,.55);background:rgba(220,120,120,.12);color:#e09090;font-family:\'Cinzel\',serif;font-size:.63rem;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;">First-Try Clear Broken</span>';
  }

  function buildLegacyRaidTimelineCard(run) {
    if (!run) return '';
    var rows = [1, 2, 3].map(function (wing) {
      var fails = Number(run.wingFailures && run.wingFailures[wing] || 0);
      var clean = fails <= 0;
      var statusText = clean ? 'Clean' : ('Strained x' + fails);
      var statusColor = clean ? 'var(--green2)' : 'var(--red2)';
      var checkpoint = Number(run.checkpointWing || 0) === wing ? ' · Checkpoint' : '';
      var current = Number(run.currentWing || 0) === wing ? ' · Current' : '';
      return '<div style="display:grid;grid-template-columns:auto 1fr auto;gap:.28rem;align-items:center;padding:.15rem 0;border-bottom:1px solid var(--border2);">'
        + '<div style="font-size:.66rem;color:var(--gold2);">Wing ' + wing + '</div>'
        + '<div style="font-size:.68rem;color:var(--muted2);">Timeline state' + checkpoint + current + '</div>'
        + '<div style="font-size:.67rem;color:' + statusColor + ';text-transform:uppercase;letter-spacing:.07em;">' + statusText + '</div>'
        + '</div>';
    }).join('');
    return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;">Wing Timeline</div>'
      + rows
      + '</div>';
  }

  function buildLegacyRaidClearSummary(mission) {
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return { bonusMedals: 0, html: '' };
    var wingFailTotal = Number(run.wingFailures[1] || 0) + Number(run.wingFailures[2] || 0) + Number(run.wingFailures[3] || 0);
    if (Number(run.wingFailures[3] || 0) <= 0) run.wingClean[3] = true;
    var mechanicsClean = Math.max(0, 3 - wingFailTotal);
    var bonusMedals = 0;
    if (Number(run.wipes || 0) === 0) bonusMedals += 1;
    if (wingFailTotal === 0) bonusMedals += 1;
    var firstTryBadge = buildLegacyRaidFirstTryBadge(run, true);
    var timelineCard = buildLegacyRaidTimelineCard(run);
    var wingLoot = ensureLegacyRaidWingLootState(mission) || {};
    var lootRows = [1, 2, 3].map(function (w) {
      var picked = wingLoot[w];
      return '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Wing ' + w + ': '
        + (picked ? ('<span style="color:var(--gold2);">' + String(picked.line || 'Reward') + '</span>' + (picked.rarityLabel ? (' <span style="font-size:.62rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.06em;">[' + String(picked.rarityLabel || '') + ']</span>') : '')) : '<span style="color:var(--muted2);">No chest reward selected</span>')
        + '</div>';
    }).join('');
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:.35rem;flex-wrap:wrap;margin-bottom:.25rem;">'
      + '<div style="font-size:.9rem;color:var(--gold2);"><strong>Raid Summary</strong></div>'
      + firstTryBadge
      + '</div>'
      + '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.3rem;">Mechanics solved cleanly: ' + mechanicsClean + '/3 · Wipes: ' + Number(run.wipes || 0) + ' · Revives: ' + Number(run.revivesUsed || 0) + '</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.16rem;">Wing results: W1 ' + (run.wingClean[1] ? 'clean' : ('strained (' + Number(run.wingFailures[1] || 0) + ' failures)')) + ' · W2 ' + (run.wingClean[2] ? 'clean' : ('strained (' + Number(run.wingFailures[2] || 0) + ' failures)')) + ' · W3 ' + (run.wingClean[3] ? 'clean' : ('strained (' + Number(run.wingFailures[3] || 0) + ' failures)')) + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.35rem .45rem;margin-bottom:.24rem;">'
      + '<div style="font-size:.69rem;color:var(--gold2);margin-bottom:.12rem;">Wing Chest Picks</div>'
      + lootRows
      + '</div>'
      + '<div style="margin-bottom:.3rem;">' + timelineCard + '</div>'
      + '<div style="font-size:.74rem;color:var(--teal);margin-bottom:.38rem;">Bonus medals for clean execution: +' + bonusMedals + '</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:.3rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-primary" onclick="finalizeLegacyRaidClear(' + mission.id + ',' + bonusMedals + ')">Claim Raid Rewards</button>'
      + '</div>'
      + '</div>';
    return { bonusMedals: bonusMedals, html: html };
  }

  function getLegacyRaidVaultSaleValue(vaultPayout) {
    var payout = vaultPayout || {};
    var loot = Array.isArray(payout.loot) ? payout.loot : [];
    var keys = payout.keys || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    return (loot.length * 60)
      + (Number(keys.bronze || 0) * 30)
      + (Number(keys.silver || 0) * 60)
      + (Number(keys.gold || 0) * 120)
      + (Number(keys.platinum || 0) * 220);
  }

  function flattenLegacyRaidVaultPayoutItems(vaultPayout) {
    var payout = vaultPayout || {};
    var loot = Array.isArray(payout.loot) ? payout.loot.slice() : [];
    var keys = payout.keys || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    var keyItems = [];
    ['bronze', 'silver', 'gold', 'platinum'].forEach(function (tier) {
      var n = Math.max(0, Number(keys[tier] || 0));
      for (var i = 1; i <= n; i++) keyItems.push(getLegacyRaidKeyItemLabel(tier, i));
    });
    return loot.concat(keyItems);
  }

  function openLegacyRaidVaultPayoutDecision(missionId, successPath) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var payout = mission.legacyRaidVaultPayout || { loot: [], keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 } };
    var saleValue = getLegacyRaidVaultSaleValue(payout);
    var itemized = flattenLegacyRaidVaultPayoutItems(payout);
    var itemRows = itemized.length
      ? itemized.map(function (item) { return '<div style="font-size:.68rem;color:var(--text2);line-height:1.4;">• ' + String(item || 'Loot') + '</div>'; }).join('')
      : '<div style="font-size:.68rem;color:var(--muted2);">No raid vault items recovered.</div>';
    openModal(
      successPath ? 'Raid Vault Decision' : 'Raid Failure Vault Decision',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="margin-bottom:.22rem;">Choose how to resolve your raid vault rewards.</div>'
        + '<div style="margin-bottom:.2rem;border:1px solid var(--border2);padding:.24rem .3rem;background:rgba(255,255,255,.03);">'
        + itemRows
        + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);margin-bottom:.22rem;">Sell value now: ' + saleValue + ' ₵</div>'
        + '<div style="display:flex;gap:.28rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm" onclick="finalizeLegacyRaidVaultPayoutChoice(' + mission.id + ',\'sell\',' + (successPath ? 'true' : 'false') + ')">Sell Vault</button>'
        + '<button class="btn btn-sm btn-primary" onclick="finalizeLegacyRaidVaultPayoutChoice(' + mission.id + ',\'keep\',' + (successPath ? 'true' : 'false') + ')">Keep Vault (Backpack)</button>'
        + '</div>'
      + '</div>'
    );
    return true;
  }

  window.finalizeLegacyRaidVaultPayoutChoice = function (missionId, mode, successPath) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var payout = mission.legacyRaidVaultPayout || { loot: [], keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 } };
    var choice = String(mode || 'keep').toLowerCase();
    if (choice === 'sell') {
      var credits = getLegacyRaidVaultSaleValue(payout);
      if (credits > 0) {
        if (typeof changeCredits === 'function') changeCredits(credits);
        else if (typeof S !== 'undefined' && S) S.credits = Number(S.credits || 0) + credits;
      }
      mission.legacyRaidVaultPayout = { loot: [], keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 } };
      mission.legacyRaidVaultChoice = { mode: 'sell', credits: credits };
      if (typeof showNotif === 'function') showNotif('Sold raid vault for ' + credits + ' ₵.', 'good');
    } else {
      var movedKeys = addLegacyRaidKeys(payout.keys || {});
      mission.legacyRaidVaultPayout = {
        loot: Array.isArray(payout.loot) ? payout.loot.slice() : [],
        keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      };
      mission.legacyRaidVaultChoice = { mode: 'keep', credits: 0 };
      if (typeof showNotif === 'function') {
        showNotif('Raid vault kept. Keys moved to Raid Tree: '
          + 'B+' + Number(movedKeys.bronze || 0)
          + ', S+' + Number(movedKeys.silver || 0)
          + ', G+' + Number(movedKeys.gold || 0)
          + ', P+' + Number(movedKeys.platinum || 0) + '.', 'good');
      }
    }
    if (typeof closeModal === 'function') closeModal();
    resolveMission(mission.id, !!successPath, { preserveVaultOnFail: true });
    return true;
  };

  function finalizeLegacyRaidClear(missionId, bonusMedals) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
    var vault = ensureLegacyRaidLootVault(mission);
    var vaultedLoot = vault && Array.isArray(vault.loot) ? vault.loot.slice() : [];
    var vaultedKeys = vault && vault.keys ? {
      bronze: Number(vault.keys.bronze || 0),
      silver: Number(vault.keys.silver || 0),
      gold: Number(vault.keys.gold || 0),
      platinum: Number(vault.keys.platinum || 0)
    } : { bronze: 0, silver: 0, gold: 0, platinum: 0 };

    mission.legacyRaidBonusMedals = Math.max(0, Number(bonusMedals || 0));
    mission.legacyRaidSummary = {
      wipes: Number(run.wipes || 0),
      revivesUsed: Number(run.revivesUsed || 0),
      reviveCreditsSpent: Number(run.reviveCreditsSpent || 0),
      wingFailures: {
        1: Number(run.wingFailures[1] || 0),
        2: Number(run.wingFailures[2] || 0),
        3: Number(run.wingFailures[3] || 0)
      },
      abilityUses: Number(run.abilityUses || 0),
      vaultedLootCount: vaultedLoot.length,
      vaultedKeys: vaultedKeys
    };
    mission.legacyRaidVaultPayout = {
      loot: vaultedLoot,
      keys: vaultedKeys
    };
    if (vault) {
      vault.loot = [];
      vault.keys = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    }
    if (typeof closeModal === 'function') closeModal();
    return openLegacyRaidVaultPayoutDecision(mission.id, true);
  }

  /* ── RESOLVE MISSION ── */
  function resolveMission(missionId,success,opts) {
    ensureState();
    var options = opts || {};
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
      if (mission.missionType === 'legacy_raid' && mission.legacyRaidVaultPayout && Array.isArray(mission.legacyRaidVaultPayout.loot)) {
        newLoot = newLoot.concat(mission.legacyRaidVaultPayout.loot.slice());
      }
      mission.loot=mission.loot.concat(newLoot);
      if (mission.missionType === 'soul_mission' && typeof window.awardSoulMissionAffixReward === 'function') {
        try {
          var soulReward = window.awardSoulMissionAffixReward(mission);
          if (soulReward) mission.loot.push(soulReward);
        } catch (_soulRewardErr) {}
      }
      S.credits=(S.credits||0)+(mission.reward||100); S.renown=(S.renown||0)+1;

      if (typeof getWayfarerHomeBonuses === 'function') {
        var homeBonus = getWayfarerHomeBonuses() || {};
        var marketBonus = Math.max(0, Number(homeBonus.market || 0)) * 25;
        var decorBonus = Math.max(0, Number(homeBonus.decor || 0)) >= 2 ? 1 : 0;
        var workshopLoot = Math.max(0, Number(homeBonus.workshop || 0)) >= 1 ? 'Workshop Supply Crate' : '';

        if (marketBonus) {
          S.credits = (S.credits || 0) + marketBonus;
          mission.homeBonusCredits = marketBonus;
        }
        if (decorBonus) {
          S.renown = (S.renown || 0) + decorBonus;
          mission.homeBonusRenown = decorBonus;
        }
        if (workshopLoot) {
          mission.loot.push(workshopLoot);
          newLoot.push(workshopLoot);
        }
      }

      if (!mission.noFactionDelta) applyFactionStandingDelta(mission.factionGain, mission.factionLose);
      try { if (typeof updateCreditsUI==='function') updateCreditsUI(); } catch (err) {}
      try { if (typeof updateRenown==='function') updateRenown(); } catch (err) {}

      if (mission.missionType === 'legacy_raid') {
        var raidProfile = ensureLegacyRaidProfile();
        if (raidProfile) {
          var raidMedalGain = Math.max(0, Number(mission.legacyRaidMedalReward || 1))
            + Math.max(0, Number(mission.legacyRaidBonusMedals || 0));
          var raidPointGain = Math.max(0, Number(mission.legacyRaidPointReward || 1));
          raidProfile.raidMedals = Math.max(0, Number(raidProfile.raidMedals || 0) + raidMedalGain);
          raidProfile.raidPoints = Math.max(0, Number(raidProfile.raidPoints || 0) + raidPointGain);
          if (mission.legacyRaidBoss) raidProfile.raidTrophies.push(String(mission.legacyRaidBoss));
          mission.legacyRaidRewarded = { medals: raidMedalGain, points: raidPointGain };
        }
      }
      if (mission.missionType === 'gate_war') {
        var endgame = ensureEndgameDirectorState();
        var gateState = endgame.gateWar;
        var gateType = String(mission.gateWarType || '').toLowerCase();
        if (gateType === 'hellscape') gateState.closedHellscape = Math.max(0, Number(gateState.closedHellscape || 0) + 1);
        else gateState.closedCelestial = Math.max(0, Number(gateState.closedCelestial || 0) + 1);
        var unlockMission = maybeUnlockPinnacleMegadungeonFromGateWar(gateState, gateType);
        if (unlockMission && typeof renderMissionTracker === 'function') renderMissionTracker();
      }
      if (mission.missionType === 'colosseum_endless') {
        var cState = ensureEndgameDirectorState().colosseum;
        var tier = Math.max(4, Number(mission.colosseumTierDie || 4));
        cState.clears = Math.max(0, Number(cState.clears || 0) + 1);
        cState.bestClearDie = Math.max(Number(cState.bestClearDie || 0), tier);
        cState.history.unshift({
          at: new Date().toISOString(),
          tierDie: tier,
          enemy: String(mission.colosseumEnemyName || 'Arena Enemy'),
          success: true
        });
        cState.history = cState.history.slice(0, 12);
      }
      if (mission.missionType === 'pinnacle_megadungeon') {
        var pState = ensureEndgameDirectorState().gateWar;
        pState.pinnacleCleared = true;
        pState.kickoutPending = false;
      }
      if (mission.missionType === 'colosseum_endless' && mission.colosseumUniqueReward) {
        mission.loot.push(String(mission.colosseumUniqueReward));
        newLoot.push(String(mission.colosseumUniqueReward));
      }
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
      if (mission.missionType === 'colosseum_endless') {
        var cFailState = ensureEndgameDirectorState().colosseum;
        cFailState.history.unshift({
          at: new Date().toISOString(),
          tierDie: Math.max(4, Number(mission.colosseumTierDie || 4)),
          enemy: String(mission.colosseumEnemyName || 'Arena Enemy'),
          success: false
        });
        cFailState.history = cFailState.history.slice(0, 12);
      }
      if (mission.missionType === 'pinnacle_megadungeon') {
        var gFailState = ensureEndgameDirectorState().gateWar;
        gFailState.pinnacleRetries = Math.max(0, Number(gFailState.pinnacleRetries || 0) + 1);
        gFailState.kickoutPending = true;
        gFailState.pinnacleUnlocked = false;
        gFailState.pinnacleBoss = '';
        gFailState.closedHellscape = 0;
        gFailState.closedCelestial = 0;
        gFailState.lastKickoutAt = new Date().toISOString();
        gFailState.pinnacleCleared = false;
        if (typeof showNotif === 'function') {
          showNotif('Pinnacle run failed: kicked out. Gate closures reset and a side must be rebuilt to 10/10.', 'warn');
        }
      }
      if (mission.missionType === 'legacy_raid' && !options.preserveVaultOnFail) {
        var runState = ensureLegacyRaidRunState(mission);
        if (runState && runState.raidVault) {
          runState.raidVault.loot = [];
          runState.raidVault.keys = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
        }
      }
      S.renown=Math.max(0,(S.renown||0)-1);
      if (!mission.noFactionDelta) applyFactionStandingFailureDelta(mission.factionGain, mission.factionLose);
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
      contractPathway: mission.contractPathway || null,
      templateId: mission.templateId || null,
      checkpoints: Array.isArray(mission.checkpoints) ? mission.checkpoints.slice() : [],
      completedAt: mission.completedAt,
      missionType: mission.missionType || 'standard'
    };
    if (mission.missionType === 'legacy_raid') {
      completedEntry.legacyRaidBonusMedals = Math.max(0, Number(mission.legacyRaidBonusMedals || 0));
      completedEntry.legacyRaidSummary = mission.legacyRaidSummary || null;
      completedEntry.legacyRaidBoss = mission.legacyRaidBoss || null;
      completedEntry.legacyRaidPowerBonus = Number(mission.legacyRaidPowerBonus || 0);
      completedEntry.legacyRaidVaultPayout = mission.legacyRaidVaultPayout || null;
    }
    if (S.completedMissions.length>=MAX_COMPLETED_MISSIONS) S.completedMissions.shift();
    S.completedMissions.push(completedEntry);
    S.activeMissions.splice(idx,1);
    try { renderMissionBoard(); } catch (err) {}
    try { renderMissionTracker(); } catch (err) {}
    try { renderCompletedMissions(); } catch (err) {}
    try { if (typeof renderBackpackUI === 'function') renderBackpackUI(); } catch (err) {}
    try { if (typeof window.refreshQuickPanelSection === 'function') window.refreshQuickPanelSection('missions'); } catch (err) {}
    if (mission.missionType === 'holding_crisis' && mission.holdingCrisis) {
      try { applyHoldingCrisisMissionOutcome(mission, !!success); } catch (err) {}
    }
    if (success) {
      // AUDIO: Mission complete
      if (typeof window.AudioManager !== 'undefined') {
        window.AudioManager.missionComplete();
      }
      var homeText = '';
      if (mission.homeBonusCredits || mission.homeBonusRenown) {
        homeText = ' \u00B7 Home Bonus:'
          + (mission.homeBonusCredits ? (' +' + mission.homeBonusCredits + '\u20B5') : '')
          + (mission.homeBonusRenown ? (' +' + mission.homeBonusRenown + ' Renown') : '');
      }
      var raidMedalText = mission.missionType === 'legacy_raid' && mission.legacyRaidRewarded
        ? (' \u00B7 Raid Ledger: +' + Number(mission.legacyRaidRewarded.medals || 0) + ' medals / +' + Number(mission.legacyRaidRewarded.points || 0) + ' RP')
        : '';
      try { showNotif('Mission complete! +1 Renown \u00B7 +'+mission.reward+'\u20B5 \u00B7 '+(mission.factionGainName||'Faction')+' +1 / '+(mission.factionLoseName||'Faction')+' -1' + homeText + raidMedalText + ' \u00B7 Loot: '+mission.loot.join(', '),'good'); } catch (err) {}
      if (stored.length) {
        try { showNotif('Added to backpack: ' + stored.join(', '), 'good'); } catch (err) {}
      }
      if (dropped.length && mission.missionType === 'legacy_raid') {
        var raidProfileOverflow = ensureLegacyRaidProfile();
        if (raidProfileOverflow && Array.isArray(raidProfileOverflow.raidOverflowLoot)) {
          raidProfileOverflow.raidOverflowLoot = raidProfileOverflow.raidOverflowLoot.concat(dropped.map(function (item) { return String(item || ''); }).filter(Boolean)).slice(-120);
          try { showNotif('Backpack full. Stored raid overflow in Raid Storage: ' + dropped.join(', '), 'warn'); } catch (err) {}
          dropped = [];
        }
      }
      if (dropped.length) {
        try { showNotif('Backpack full. Unstored loot: ' + dropped.join(', '), 'warn'); } catch (err) {}
      }
      triggerOriginStorylineHandoff(mission);
      recordMissionConsequence({
        system: 'missions',
        title: 'Mission resolved: success',
        detail: String(mission.title || 'Contract') + ' completed.',
        region: String(mission.region || 'province'),
        locationKey: getMissionLocationKey(mission),
        severity: 'medium',
        deltas: { stability: 1, scarcity: -1, witness: 1, factionHeat: -1 },
        tags: ['threat-cleared', 'discovery', 'infrastructure', String(mission.missionType || 'standard')]
      });
    } else {
      if (options.expired) {
        try { showNotif('Mission expired (1 month elapsed): ' + mission.title + '.', 'warn'); } catch (err) {}
        recordMissionConsequence({
          system: 'missions',
          title: 'Mission expired',
          detail: String(mission.title || 'Contract') + ' timed out.',
          region: String(mission.region || 'province'),
          locationKey: getMissionLocationKey(mission),
          severity: 'high',
          deltas: { stability: -1, scarcity: 1, corruption: 1, rumor: 1, factionHeat: 1 },
          tags: ['failed-expedition', 'active-crisis', 'dangerous-road', 'exhausted-site', String(mission.missionType || 'standard')]
        });
      } else {
        try { showNotif('Mission failed. \u22121 Renown \u00B7 ' + (mission.factionGainName||'Faction') + ' -1 / ' + (mission.factionLoseName||'Faction') + ' +1','warn'); } catch (err) {}
        recordMissionConsequence({
          system: 'missions',
          title: 'Mission failed',
          detail: String(mission.title || 'Contract') + ' collapsed under pressure.',
          region: String(mission.region || 'province'),
          locationKey: getMissionLocationKey(mission),
          severity: 'high',
          deltas: { stability: -1, scarcity: 1, rumor: 1, witness: -1, factionHeat: 1 },
          tags: ['failed-expedition', 'dangerous-road', 'active-crisis', String(mission.missionType || 'standard')]
        });
      }
    }
    if (typeof window !== 'undefined' && window.factionSystem && typeof window.factionSystem.onMissionResolved === 'function') {
      try { window.factionSystem.onMissionResolved(mission, success); } catch (err) {}
    }
    onDeityPactMissionResolved(mission, success);
    pushNextArcJob(mission, success);
  }

  function applyHoldingCrisisMissionOutcome(mission, success) {
    var crisis = mission && mission.holdingCrisis;
    if (!crisis || typeof window.getProvinceHexByKey !== 'function') return;
    var key = String(crisis.key || '');
    var hex = window.getProvinceHexByKey(key);
    if (!hex) return;
    if (!hex.data) hex.data = {};
    var mood = hex.data.mood = hex.data.mood || {};
    var factionId = String(crisis.control || '');
    if (success) {
      mood.crisis = 'No Crisis';
      mood.resolution = String(crisis.successResolution || 'Wayfarer support restored confidence and defensive readiness.');
      if (typeof window.clearWorldStatePressureAtKey === 'function') {
        window.clearWorldStatePressureAtKey(key, { crisis: true, routeSafe: true });
      }
      var renownFaction = typeof window.resolveFactionRenownKeyFromControl === 'function'
        ? window.resolveFactionRenownKeyFromControl(factionId)
        : '';
      if (renownFaction && typeof window.changeFactionRenown === 'function') {
        try { window.changeFactionRenown(renownFaction, 1); } catch (_err) {}
      }
      if (typeof window.applyWorldConsequence === 'function') {
        window.applyWorldConsequence({
          system: 'holding-crisis',
          title: 'Holding crisis resolved',
          detail: String(mission.title || 'Holding crisis') + ' stabilized at ' + key + '.',
          region: 'province',
          locationKey: key,
          severity: 'info',
          factionId: factionId,
          deltas: { stability: 2, tension: -2, scarcity: -1 },
          tags: ['holding-secured', 'quest-resolved', 'crisis-stabilized']
        });
      }
    } else {
      mood.resolution = String(crisis.failureResolution || 'The holding remains shaken and asks for renewed aid.');
      if (typeof window.applyWorldConsequence === 'function') {
        window.applyWorldConsequence({
          system: 'holding-crisis',
          title: 'Holding crisis unresolved',
          detail: String(mission.title || 'Holding crisis') + ' failed at ' + key + '.',
          region: 'province',
          locationKey: key,
          severity: 'high',
          factionId: factionId,
          deltas: { stability: -1, factionHeat: 1, tension: 1, scarcity: 1 },
          tags: ['active-crisis', 'quest-failed', 'dangerous-road']
        });
      }
    }
    if (typeof window.renderHexMap === 'function') {
      try { window.renderHexMap(); } catch (_err2) {}
    }
    if (typeof window.renderHexInfo === 'function') {
      try { window.renderHexInfo(hex); } catch (_err3) {}
    }
  }

  function resolveMissionOutcome(missionId, success) {
    var mission = getMission(missionId);
    if (mission && mission.missionType === 'legacy_raid') {
      var run = ensureLegacyRaidRunState(mission);
      if (run) run.currentWing = getLegacyRaidCurrentWing(mission);
      if (!success) {
        var failSummary = {
          wipes: Number(run && run.wipes || 0),
          revivesUsed: Number(run && run.revivesUsed || 0),
          reviveCreditsSpent: Number(run && run.reviveCreditsSpent || 0)
        };
        mission.legacyRaidSummary = mission.legacyRaidSummary || failSummary;
        var failVault = ensureLegacyRaidLootVault(mission);
        mission.legacyRaidVaultPayout = {
          loot: failVault && Array.isArray(failVault.loot) ? failVault.loot.slice() : [],
          keys: failVault && failVault.keys ? {
            bronze: Number(failVault.keys.bronze || 0),
            silver: Number(failVault.keys.silver || 0),
            gold: Number(failVault.keys.gold || 0),
            platinum: Number(failVault.keys.platinum || 0)
          } : { bronze: 0, silver: 0, gold: 0, platinum: 0 }
        };
        if (typeof S !== 'undefined' && S && Number(S.health || 1) <= 0) {
          mission.legacyRaidVaultPayout = { loot: [], keys: { bronze: 0, silver: 0, gold: 0, platinum: 0 } };
          if (typeof showNotif === 'function') showNotif('Raid death detected: vaulted loot/keys were lost.', 'warn');
        }
        return openLegacyRaidVaultPayoutDecision(mission.id, false);
      }
      markLegacyRaidWingOutcome(mission, 3, true);
      try { if (typeof closeModal === 'function') closeModal(); } catch (_err) {}
      var summary = buildLegacyRaidClearSummary(mission);
      if (summary && summary.html && typeof openModal === 'function') {
        openModal('Raid Clear - Performance Summary', summary.html);
        return;
      }
    }
    try { if (typeof closeModal === 'function') closeModal(); } catch (err) {}
    resolveMission(missionId, success);
  }

  function abandonMission(missionId) { resolveMission(missionId,false); }

  /* ── LEGACY COMPAT ── */
  function createMission(npcName,title,difficulty,location,region,factionData,options) {
    ensureState();
    var cfg = options || {};
    var mission=makeMission(title,difficulty,location,region,factionData,cfg);
    if (region === 'galaxy' && cfg && cfg.planetHexId) {
      mission.planetHexId = Number(cfg.planetHexId);
      mission.planetName = cfg.planetName || mission.planetName || '';
    }
    mission.acceptedAt = new Date().toISOString();
    mission.acceptedDayStamp = getCurrentGameDayStamp();
    mission.deadlineDayStamp = mission.acceptedDayStamp + MISSION_DEADLINE_DAYS;
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
    autoFailExpiredMissions('mission-board-render');

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
      var dcLabel = shouldRevealDC()
        ? ('<span style="font-family:\'Cinzel\',serif;font-size:.55rem;color:'+dc+';">DD d'+diff.dread+'</span>')
        : '<span style="font-family:\'Cinzel\',serif;font-size:.55rem;color:var(--muted2);">DD hidden</span>';
      return '<div class="shop-card" style="display:flex;flex-direction:column;">'
        +'<div class="s-name" style="color:var(--gold2);">'+job.title+'</div>'
        +(job.templateLabel?'<div style="font-size:.62rem;color:var(--teal);text-transform:uppercase;letter-spacing:.08em;margin:.1rem 0;">'+job.templateLabel+'</div>':'')
        +(job.lore?'<div style="font-size:.72rem;color:var(--text2);line-height:1.4;margin:.1rem 0 .2rem;font-style:italic;border-left:2px solid var(--border2);padding-left:.4rem;">'+job.lore+'</div>':'')
        +'<div style="display:flex;gap:.35rem;align-items:center;font-family:\'Rajdhani\',sans-serif;font-size:.72rem;font-weight:700;margin:.15rem 0;">'
          +'<span style="color:'+dc+';text-transform:uppercase;">'+diff.name+'</span>'
          +'<span style="color:var(--muted2);">\u00B7</span>'
          +dcLabel
        +'</div>'
        +'<div style="font-size:.68rem;color:var(--teal);margin:.08rem 0;">'+(job.factionGainName||'Faction')+' +1 \u00B7 '+(job.factionLoseName||'Faction')+' -1</div>'
        +'<div style="font-size:.78rem;color:var(--muted3);flex:1;margin:.2rem 0;line-height:1.45;">'+job.location+'</div>'
        +'<div style="font-size:.68rem;color:var(--muted3);margin-bottom:.1rem;">'+(job.region==='sea'?'⛵ Sea Region':job.region==='galaxy'?'🌌 Planet Route':'🏕 Province')+'</div>'
        +(job.region==='galaxy'&&job.planetName?'<div style="font-size:.66rem;color:var(--gold2);margin-bottom:.1rem;">🌍 '+job.planetName+'</div>':'')
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
    autoFailExpiredMissions('mission-tracker-render');
    var holdingTrackerHtml = '';
    if (typeof window.getHoldingQuestTrackerCardHtml === 'function') {
      holdingTrackerHtml = window.getHoldingQuestTrackerCardHtml() || '';
    }
    var pact = ensureDeityPactState();
    var showPactCard = hasDeityPactFlavor() || pact.stageCompleted > 0 || pact.debt > 0 || pact.favor > 0 || !!pact.endingKey;
    var pactCardHtml = '';
    if (showPactCard) {
      var pathway = getDeityPathway(pact.activePathway || 'mercy');
      var tone = pact.endingKey === 'lantern_herald' ? 'var(--green2)' : (pact.endingKey ? 'var(--red2)' : 'var(--gold2)');
      var status = pact.endingKey
        ? ('Ending sealed: ' + pact.endingKey.replace(/_/g, ' '))
        : ('Path: ' + pathway.label + ' · Stage ' + (Math.min(3, Number(pact.stageCompleted || 0) + 1)) + '/3');
      pactCardHtml = '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid '+tone+';padding:.55rem .6rem;margin-bottom:.5rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.74rem;color:'+tone+';margin-bottom:.15rem;">Deity Pact Arc</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.15rem;">'+status+'</div>'
        + '<div style="font-size:.72rem;color:var(--text2);">Favor: <strong style="color:var(--teal);">'+(pact.favor||0)+'</strong> · Debt: <strong style="color:var(--red2);">'+(pact.debt||0)+'</strong> · Failures: '+(pact.failedStages||0)+'</div>'
        + (pact.endingText ? '<div style="font-size:.68rem;color:var(--muted2);margin-top:.18rem;line-height:1.45;">'+pact.endingText+'</div>' : '')
      + '</div>';
    }
    var soulForgeState = null;
    try {
      soulForgeState = typeof ensureSoulForgeState === 'function' ? ensureSoulForgeState() : (S.soulForge = S.soulForge || { unlocked:false, inventory:[] });
    } catch (_forgeErr) {
      soulForgeState = S.soulForge = S.soulForge || { unlocked:false, inventory:[] };
    }
    if (!Array.isArray(soulForgeState.inventory)) soulForgeState.inventory = [];
    var soulForgeCardHtml = (soulForgeState.unlocked || soulForgeState.inventory.length)
      ? '<div style="background:var(--surface);border:1px solid var(--border2);border-left:2px solid var(--teal);padding:.55rem .6rem;margin-bottom:.5rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.74rem;color:var(--teal);margin-bottom:.15rem;">Soul Forge</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.15rem;">Stored affixes: <strong style="color:var(--gold2);">' + soulForgeState.inventory.length + '</strong> · ' + (soulForgeState.unlocked ? 'Unlocked' : 'Locked') + '</div>'
        + '<div style="font-size:.72rem;color:var(--text2);line-height:1.45;">Soul Missions capture affixes from endgame bosses. Open the forge to remove, move, or sell them.</div>'
        + '<div style="margin-top:.3rem;"><button class="btn btn-xs btn-primary" onclick="openSoulForgeVendor()">Open Soul Forge</button></div>'
      + '</div>'
      : '';
    var endgameCardHtml = buildEndgameTrackerCardHtml();
    if (!S.activeMissions.length && !holdingTrackerHtml && !pactCardHtml && !soulForgeCardHtml && !endgameCardHtml) {
      container.innerHTML='<div style="font-size:.9rem;color:var(--text2);padding:.35rem 0;line-height:1.5;">No active missions. Accept a mission from the board above.</div>';
      return;
    }
    container.innerHTML=holdingTrackerHtml + pactCardHtml + soulForgeCardHtml + endgameCardHtml + S.activeMissions.map(function(mission){
      if (mission && mission.missionType === 'legacy_raid') ensureLegacyRaidMissionConfig(mission);
      ensureMissionDeadline(mission);
      var diff=DIFFICULTIES[mission.difficulty]||DIFFICULTIES.easy, dc=dreadColor(diff.dread);
      var daysLeft = getMissionDaysRemaining(mission);
      var deadlineTone = daysLeft <= 3 ? 'var(--red2)' : (daysLeft <= 7 ? 'var(--gold2)' : 'var(--muted2)');
      var s1=mission.steps[1],s2=mission.steps[2],s3=mission.steps[3];
      var stepLabels={
        1:(mission.steps[1]&&mission.steps[1].name)||'Gather Information',
        2:(mission.steps[2]&&mission.steps[2].name)||'Go to Site',
        3:(mission.steps[3]&&mission.steps[3].name)||'Confrontation'
      };
      var stepsHTML=[1,2,3].map(function(n){
        var step=mission.steps[n];
        var isActive=(n===1&&!s1.completed)||(n===2&&s1.completed&&!s2.completed)||(n===3&&s2.completed&&!s3.completed);
        var color=step.completed?'var(--green2)':isActive?'var(--teal)':'var(--border2)';
        var textCol=step.completed?'var(--text2)':isActive?'var(--text)':'var(--muted2)';
        var strike=step.completed?'text-decoration:line-through;':'';
        var marker=step.completed?(step.skipped?'\u2014':'\u2713'):String(n);
        return '<div style="display:flex;align-items:center;gap:.34rem;padding:.18rem .24rem;">'
          +'<div style="width:1.45rem;height:1.45rem;border-radius:50%;border:1.5px solid '+color+';display:flex;align-items:center;justify-content:center;font-size:.72rem;color:'+color+';flex-shrink:0;">'+marker+'</div>'
          +'<div style="font-size:.82rem;color:'+textCol+';line-height:1.45;'+strike+'">'+stepLabels[n]+(n===1?' <span style="color:var(--muted2);font-size:.68rem;">[optional]</span>':'')+'</div>'
        +'</div>';
      }).join('');

      var badges='';
      if (mission.infoFeature && shouldRevealHiddenInfo()) badges+='<span style="font-size:.62rem;color:var(--teal);background:rgba(46,196,182,.1);padding:.05rem .3rem;border:1px solid rgba(46,196,182,.25);margin-right:.25rem;">'+mission.infoFeature.icon+' '+mission.infoFeature.name+'</span>';
      if (mission.additionalDanger && shouldRevealHiddenInfo()) { var dl=mission.additionalDanger.type==='mercenary'?'\u26a0 Mercenary':'\u26a0 '+mission.additionalDanger.data.name; badges+='<span style="font-size:.62rem;color:var(--red2);background:rgba(200,50,50,.1);padding:.05rem .3rem;border:1px solid rgba(200,50,50,.25);">'+dl+'</span>'; }
      if (mission.bonus) badges+='<span style="font-size:.62rem;color:var(--teal);margin-left:.15rem;">+5 bonus</span>';
      var ddSummary = shouldRevealDC() ? ('DD d'+diff.dread) : 'DD hidden';

      var raidBtn = mission.missionType === 'legacy_raid'
        ? '<button class="btn btn-xs btn-gold" onclick="openLegacyRaidMissionPopup(' + mission.id + ',null)">Open Raid</button>'
        : '';
      var btn1=s1.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Info</button>':'<button class="btn btn-xs btn-teal" onclick="startMissionStep1('+mission.id+')">\u25B6 Info</button><button class="btn btn-xs" onclick="skipMissionStep1('+mission.id+')" style="font-size:.62rem;">Skip</button>';
      var btn2=s2.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Site</button>':'<button class="btn btn-xs btn-teal" onclick="startMissionStep2('+mission.id+')"'+(!s1.completed?' disabled style="opacity:.45;"':'')+'>\u25B6 Site</button>';
      var btn3=s3.completed?'<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Confront</button>':'<button class="btn btn-xs btn-primary" onclick="startMissionStep3('+mission.id+')"'+(!s2.completed?' disabled style="opacity:.45;"':'')+'>\u25B6 Confront</button>';

      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.7rem .72rem;margin-bottom:.56rem;">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.38rem;">'
          +'<div>'
            +'<div style="font-family:\'Cinzel\',serif;font-size:.92rem;color:var(--gold2);margin-bottom:.12rem;line-height:1.35;">'+mission.title+'</div>'
            +'<div style="font-size:.78rem;color:'+dc+';line-height:1.45;">'+diff.name+' \u00B7 '+ddSummary+' \u00B7 '+mission.location+'</div>'
            +(mission.region==='galaxy'&&mission.planetName?'<div style="font-size:.74rem;color:var(--gold2);margin-top:.1rem;line-height:1.45;">🌍 Planet Route: '+mission.planetName+'</div>':'')
            +'<div style="font-size:.74rem;color:var(--teal);margin-top:.14rem;line-height:1.45;">'+(mission.factionGainName||'Faction')+' +1 \u00B7 '+(mission.factionLoseName||'Faction')+' -1</div>'
            +'<div style="font-size:.74rem;color:'+deadlineTone+';margin-top:.1rem;line-height:1.45;">Deadline: '+(daysLeft >= 0 ? (daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left') : 'Expired')+'</div>'
            +(badges?'<div style="margin-top:.24rem;">'+badges+'</div>':'')
            +(Array.isArray(mission.checkpoints)&&mission.checkpoints.length&&shouldRevealHiddenInfo()?('<div style="margin-top:.2rem;font-size:.72rem;color:var(--text2);line-height:1.5;">Checkpoints: '+mission.checkpoints.join(' \u00B7 ')+'</div>'):'')
          +'</div>'
          +'<button class="btn btn-xs btn-red" onclick="abandonMission('+mission.id+')">Abandon</button>'
        +'</div>'
        +'<div style="border:1px solid var(--border);padding:.24rem .34rem;margin-bottom:.35rem;background:rgba(255,255,255,.02);">'+stepsHTML+'</div>'
        +'<div style="display:flex;gap:.3rem;flex-wrap:wrap;">'+raidBtn+btn1+btn2+btn3+'</div>'
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
        var lootLabel = loot.map(function(item){
          if (typeof weaponLabelHtml === 'function') {
            return weaponLabelHtml(item, 16);
          }
          return String(item || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }).join(', ');
        var factionLine = mission.success
          ? '<div style="font-size:.68rem;color:var(--teal);margin-top:.08rem;">'+(mission.factionGainName||'Faction')+' +1 \u00B7 '+(mission.factionLoseName||'Faction')+' -1</div>'
          : '';
        var lootLine=(mission.success&&loot.length)
          ?'<div style="font-size:.7rem;color:var(--gold2);margin-top:.1rem;">Loot: '+lootLabel+' \u00B7 +'+reward+'\u20B5 \u00B7 +1 Renown</div>'
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
    renderLegacyRaidTreePanel();
    renderSoulForgeTabPanel();
    renderEndgameTabPanel();
  }

  function patchRaidTreeTabRefresh() {
    if (typeof window === 'undefined' || typeof window.switchTab !== 'function' || window._raidTreeTabRefreshPatched) return;
    window._raidTreeTabRefreshPatched = true;
    var baseSwitch = window.switchTab;
    window.switchTab = function (tabId, btn) {
      var out = baseSwitch.apply(this, arguments);
      if (String(tabId || '') === 'raidtree') renderLegacyRaidTreePanel();
      if (String(tabId || '') === 'shop') {
        renderSoulForgeTabPanel();
      }
      return out;
    };
  }

  window.renderSoulForgeTabPanel = renderSoulForgeTabPanel;
  window.endgameDebugAdjustGates = endgameDebugAdjustGates;
  window.endgameDebugSetPortalState = endgameDebugSetPortalState;
  window.endgameDebugAddColosseumRecord = endgameDebugAddColosseumRecord;
  window.endgameDebugResetColosseum = endgameDebugResetColosseum;

  // Initialize on page ready
  function initMissions() {
    // Ensure origin mission exists for characters with a reason (covers loaded characters)
    if (typeof S !== 'undefined' && S && S.reason && !S.originMissionInitialized) {
      if (typeof createOriginMissionFromReason === 'function') {
        try {
          createOriginMissionFromReason(true);
        } catch (err) {
          console.warn('Error creating origin mission on page load:', err);
        }
      }
    }
    patchLegacyRaidCombatStageHooks();
    patchRaidTreeTabRefresh();
    syncMissionUIs();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMissions);
  } else {
    initMissions();
  }

  var _missionBaseLoad = typeof loadCharacter === 'function' ? loadCharacter : null;
  if (_missionBaseLoad) {
    loadCharacter = function() {
      _missionBaseLoad();
      // Ensure origin mission exists for loaded characters with a reason
      if (typeof S !== 'undefined' && S && S.reason && !S.originMissionInitialized && typeof createOriginMissionFromReason === 'function') {
        try {
          createOriginMissionFromReason(true);
        } catch (err) {
          console.warn('Error creating origin mission on load:', err);
        }
      }
      syncMissionUIs();
    };
  }

  var _missionBaseClear = typeof clearCharacter === 'function' ? clearCharacter : null;
  if (_missionBaseClear) {
    clearCharacter = function() {
      _missionBaseClear.apply(this, arguments);
      ensureState();
      syncMissionUIs();
    };
  }

  var _missionBaseGenerate = typeof generateCharacter === 'function' ? generateCharacter : null;
  if (_missionBaseGenerate && !window._originMissionGeneratePatched) {
    window._originMissionGeneratePatched = true;
    generateCharacter = function() {
      _missionBaseGenerate.apply(this, arguments);
      createOriginMissionFromReason(true);
      syncMissionUIs();
    };
  }

  window.generateMissions=generateMissions; window.acceptJob=acceptJob; window.abandonMission=abandonMission;
  window.startMissionStep1=startMissionStep1; window.skipMissionStep1=skipMissionStep1; window.completeMissionInfoStep=completeMissionInfoStep;
  window.startMissionStep2=startMissionStep2; window.renderSiteModal=renderSiteModal; window.exploreRoom=exploreRoom;
  window.resolveRoomConfrontation=resolveRoomConfrontation; window.completeMissionSiteStep=completeMissionSiteStep;
  window.resolveMissionRoomTrap=resolveMissionRoomTrap; window.startMissionRoomPuzzle=startMissionRoomPuzzle; window.resolveMissionRoomEnemy=resolveMissionRoomEnemy; window.openMissionRoomCombat=openMissionRoomCombat;
  window.startMissionStep3=startMissionStep3; window.resolveMission=resolveMission;
  window.resolveMissionOutcome=resolveMissionOutcome;
  window.renderMissionBoard=renderMissionBoard; window.renderMissionTracker=renderMissionTracker; window.renderCompletedMissions=renderCompletedMissions;
  window.createMission=createMission;
  window.spawnRandomSoulForgeMissionEvent=spawnRandomSoulForgeMissionEvent;
  window.spawnRandomColosseumMissionEvent=spawnRandomColosseumMissionEvent;
  window.spawnRandomGateWarMissionEvent=spawnRandomGateWarMissionEvent;
  window.openSeaColosseumFromHex=openSeaColosseumFromHex;
  window.resolveSeaColosseumBout=resolveSeaColosseumBout;
  window.autoFailExpiredMissions=autoFailExpiredMissions;
  window.adjustMissionDread=adjustMissionDread;
  window.createOriginMissionFromReason=createOriginMissionFromReason;
  window.createDeityPactMission=createDeityPactMission;
  window.autoAdvanceMissionFromProvinceHex=autoAdvanceMissionFromProvinceHex;
  window.autoAdvanceMissionFromSeaHex=autoAdvanceMissionFromSeaHex;
  window.openSoulForgeTokenEncounter=openSoulForgeTokenEncounter;
  window.startSoulForgeEncounterFromToken=startSoulForgeEncounterFromToken;
  window.resolveSoulForgeEncounter=resolveSoulForgeEncounter;
  window.renderEndgameTabPanel=renderEndgameTabPanel;
  window.handleLegacyRaidMarkerInteraction=handleLegacyRaidMarkerInteraction;
  window.openLegacyRaidMissionPopup=openLegacyRaidMissionPopup;
  window.openLegacyRaidPreludeModal=openLegacyRaidPreludeModal;
  window.useLegacyRaidAbility=useLegacyRaidAbility;
  window.resolveLegacyRaidReviveChoice=resolveLegacyRaidReviveChoice;
  window.finalizeLegacyRaidClear=finalizeLegacyRaidClear;
  window.renderLegacyRaidTreePanel=renderLegacyRaidTreePanel;
  window.completeMissionStep=function(missionId,stepId){
    if(stepId===1) completeMissionInfoStep(missionId,true,JSON.stringify(rollInfoFeature()));
    else if(stepId===2) completeMissionSiteStep(missionId);
    else if(stepId===3) resolveMission(missionId,true);
  };
  window.rollForLoot=rollShopLoot; window.generateRandomJobs=generateMissions;

}());
