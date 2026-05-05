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
    { id:'faction_politics',     label:'Faction Politics',    missionType:'faction_politics',      stepNames:{1:'Map Allegiances',2:'Apply Leverage',3:'Settle Power Shift'}, verbs:['Leverage','Influence','Arbitrate','Pressure'] }
  ];

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
    var chosen = planets[Math.floor(Math.random() * planets.length)];
    var profile = null;
    if (typeof ensurePlanetProfile === 'function') {
      try {
        profile = ensurePlanetProfile(chosen);
      } catch (err) {
        profile = null;
      }
    }
    var planetName = (profile && profile.planetName) || chosen.name || ('Planet Hex ' + chosen.id);
    return {
      location: planetName + ' surface corridor',
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
      var raidMarkerGlyph = mission.missionType === 'legacy_raid' ? '🐉' : '';
      var raidMarkerColor = mission.missionType === 'legacy_raid' ? '#ff8450' : '';
      var informerTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Informer)',
        text: 'Track local informants for mission intel on ' + planetLabel + '.',
        missionId: mission.id,
        missionStep: 'informer',
        interaction: 'mission-step',
        markerGlyph: raidMarkerGlyph,
        markerColor: raidMarkerColor,
        reward: { credits: 0 },
        preferredHexId: mission.planetHexId
      });
      var siteTask = createGalaxyTask('Mission Board', {
        title: mission.title + ' (Site)',
        text: 'Mission board contract on ' + planetLabel + '.',
        missionId: mission.id,
        missionStep: 'site',
        interaction: 'mission-step',
        markerGlyph: raidMarkerGlyph,
        markerColor: raidMarkerColor,
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
        S.lastSea.missionTokens[siteHex.key] = { missionId: mission.id, title: mission.title, type: 'site', missionType: mission.missionType || 'standard' };
        mission.seaSiteKey = siteHex.key;
        if (informerHex) {
          S.lastSea.missionTokens[informerHex.key] = { missionId: mission.id, title: mission.title, type: 'informer', missionType: mission.missionType || 'standard' };
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
        S.missionTokens[informerHex.col + ',' + informerHex.row] = { missionId: mission.id, title: mission.title, type: 'informer', missionType: mission.missionType || 'standard' };
        S.missionTokens[siteHex.col + ',' + siteHex.row]      = { missionId: mission.id, title: mission.title, type: 'site', missionType: mission.missionType || 'standard' };
        mission.informerHex = { col: informerHex.col, row: informerHex.row };
        mission.siteHex     = { col: siteHex.col,     row: siteHex.row };
        // Keep mapHex pointing to site for backwards compatibility
        mission.mapHex = mission.siteHex;
      } else if (candidates.length === 1) {
        var hex = candidates[0];
        S.missionTokens[hex.col + ',' + hex.row] = { missionId: mission.id, title: mission.title, type: 'site', missionType: mission.missionType || 'standard' };
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

  function pickFactionConflict() {
    return pick(MISSION_FACTION_CONFLICTS);
  }

  function getMissionConsequenceBias() {
    if (typeof window === 'undefined' || typeof window.getConsequenceMissionBias !== 'function') {
      return { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    }
    try {
      return window.getConsequenceMissionBias() || { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
    } catch (_err) {
      return { focusRegion: '', difficultyShift: 0, rewardBonus: 0, preferredVerbs: [] };
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
    return pick(MISSION_TEMPLATES);
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
    var f = factionData || pickFactionConflict();
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
      var f = pickFactionConflict();
      var regionPool = getAvailableMissionRegions();
      var region = forceRegion || pick(regionPool);
      if (!forceRegion && bias.focusRegion && regionPool.indexOf(bias.focusRegion) >= 0 && Math.random() < 0.45) {
        region = bias.focusRegion;
      }
      var planetTarget = region === 'galaxy' ? getGalaxyPlanetMissionTarget() : null;
      var templateVerbs = (tpl && Array.isArray(tpl.verbs) && tpl.verbs.length) ? tpl.verbs : MISSION_VERBS;
      var verbPool = Array.isArray(bias.preferredVerbs) && bias.preferredVerbs.length ? bias.preferredVerbs.concat(templateVerbs) : templateVerbs;
      var useArcSlot = i === 0 || (Math.random() < 0.35);
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
      arcChain: job.arcChain || null
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
        pendingWing: 0
      };
    }
    return mission.legacyRaidRun;
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

  function handleLegacyRaidMarkerInteraction(missionId, tokenType, regionTag) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var type = String(tokenType || '').toLowerCase();
    if (!canAutoAdvanceMission(mission.id, type || 'raid', regionTag || mission.region || 'region')) return false;

    if ((type === 'informer' || type === 'holding_info') && mission.steps[1] && !mission.steps[1].completed) {
      setLegacyRaidCurrentWing(mission, 1);
      if (typeof window.openRaidWingPopup === 'function') return !!window.openRaidWingPopup(mission.id, 1);
      startMissionStep1(mission.id);
      return true;
    }
    if ((type === 'site' || type === 'holding_site') && mission.steps[2] && !mission.steps[2].completed) {
      setLegacyRaidCurrentWing(mission, 2);
      if (typeof window.openRaidWingPopup === 'function') return !!window.openRaidWingPopup(mission.id, 2);
      startMissionStep2(mission.id);
      return true;
    }

    if (mission.steps && mission.steps[2] && mission.steps[2].completed && mission.steps[3] && !mission.steps[3].completed) {
      setLegacyRaidCurrentWing(mission, 3);
      if (typeof window.openRaidWingPopup === 'function') return !!window.openRaidWingPopup(mission.id, 3);
    }
    if (typeof window.openLegacyRaidMissionPopup === 'function') {
      return !!window.openLegacyRaidMissionPopup(mission.id, { tokenType: type || 'site', regionTag: regionTag || mission.region || 'region' });
    }
    return false;
  }

  function getLegacyRaidTelegraphLines(mission) {
    var boss = String(mission && mission.legacyRaidBoss || 'World Boss');
    var telegraphs = [
      boss + ' signals major attacks before they resolve: watch lane pressure, room collapse hints, and puzzle-state shifts.',
      'Every wing expects a different answer. Standing still and trading damage should fall behind the encounter quickly.',
      'Allies cover one lane only if your group commits the right role to it.'
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

  var RAID_WING_ROOM_SETS = {
    1: [ // Lore Wing
      { type: 'Entry',        icon: '🚪', label: 'Entry Threshold',      dd: 0,  hasWayfarer: false },
      { type: 'Hazard',       icon: '⛰',  label: 'Collapsed Passage',    dd: 6,  hasWayfarer: false },
      { type: 'LoreReading',  icon: '📜', label: 'Fragment Chamber',      dd: 8,  hasWayfarer: false },
      { type: 'WayfarerPost', icon: '⚑',  label: 'Wayfarer Staging Post', dd: 0,  hasWayfarer: true }
    ],
    2: [ // Mechanic/Puzzle Wing
      { type: 'Entry',        icon: '🚪', label: 'Mechanism Threshold',   dd: 0,  hasWayfarer: false },
      { type: 'Hazard',       icon: '⚠',  label: 'Trap Corridor',         dd: 6,  hasWayfarer: false },
      { type: 'Puzzle',       icon: '🧩', label: 'Gate Mechanism Room',   dd: 8,  hasWayfarer: false },
      { type: 'WayfarerPost', icon: '⚑',  label: 'Wayfarer Staging Post', dd: 0,  hasWayfarer: true },
      { type: 'TrophyCache',  icon: '💠', label: 'Trophy Cache',          dd: 6,  hasWayfarer: false }
    ],
    3: [ // Boss Wing
      { type: 'Entry',        icon: '🚪', label: 'Confrontation Approach', dd: 0,  hasWayfarer: false },
      { type: 'Approach',     icon: '🌀', label: 'Pressure Lane',          dd: 6,  hasWayfarer: false },
      { type: 'WayfarerPost', icon: '⚑',  label: 'Final Staging Post',     dd: 0,  hasWayfarer: true },
      { type: 'Confrontation',icon: '🐉', label: 'Boss Chamber',           dd: 10, hasWayfarer: false, isBoss: true }
    ]
  };

  function getRaidTheme(mission) {
    var bossName = String(mission && mission.legacyRaidBoss || mission && mission.title || '');
    for (var i = 0; i < RAID_THEMES.length; i++) {
      if (RAID_THEMES[i].matches.test(bossName)) return RAID_THEMES[i];
    }
    return RAID_THEME_DEFAULT;
  }

  function getRaidRoomProgressNeeded(roomType) {
    if (roomType === 'Puzzle') return 3;
    if (roomType === 'LoreReading' || roomType === 'Hazard' || roomType === 'Approach' || roomType === 'TrophyCache') return 2;
    return 1;
  }

  function buildLegacyRaidLoreFragment(mission) {
    var bossName = String(mission && mission.legacyRaidBoss || 'this boss');
    var region = String(mission && mission.region || '').toLowerCase();
    if (region === 'sea') {
      return 'Lore Fragment: The ' + bossName + ' is worshipped by raider flotillas because it can collapse convoy currents and open hidden brine channels. If left alive, sea routes lose three ports each cycle to extortion and sink raids.';
    }
    if (region === 'galaxy') {
      return 'Lore Fragment: ' + bossName + ' is not just a beast but a lane-breaker linked to old jump-lattice scars. Every reappearance distorts nearby star lanes and strands civilian fleets, forcing tribute runs to survive transit.';
    }
    return 'Lore Fragment: ' + bossName + ' controls the old road tunnels beneath province quarries. Raider houses protect it because it decides which caravans pass safely and which vanish underground, letting them tax every land route.';
  }

  function getLegacyRaidBossActionSet(mission) {
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
      { name: 'Cataclysm Pulse', text: 'Raidwide pulse pressure. Support and Front must both be present to blunt it.', raidwide: true },
      { name: 'Pattern Break', text: 'Mechanics role must decode the pattern shift before it loops.', raidwide: false },
      { name: 'Overrun Lane', text: 'Boss floods two lanes at once; role balance is mandatory this phase.', raidwide: true }
    ];
  }

  function ensureLegacyRaidBossEncounter(mission) {
    if (!mission || mission.missionType !== 'legacy_raid') return null;
    if (!mission.legacyRaidBossEncounter || typeof mission.legacyRaidBossEncounter !== 'object') {
      var actions = getLegacyRaidBossActionSet(mission);
      mission.legacyRaidBossEncounter = {
        active: false,
        phase: 1,
        hp: 3,
        strikes: 0,
        currentAction: actions[0],
        actions: actions,
        roles: { front: false, mechanics: false, support: false },
        raidwideHits: 0,
        log: []
      };
    }
    return mission.legacyRaidBossEncounter;
  }

  function setLegacyRaidBossEncounterActive(mission, active) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter) return;
    encounter.active = !!active;
  }

  function rotateLegacyRaidBossAction(mission) {
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !Array.isArray(encounter.actions) || !encounter.actions.length) return;
    var next = Math.floor(Math.random() * encounter.actions.length);
    encounter.currentAction = encounter.actions[next];
  }

  function buildRaidRoomDescription(theme, wingNum, roomType, bossName) {
    var descFrag = theme.desc[Math.floor(Math.random() * theme.desc.length)];
    var wingCtx = wingNum === 1 ? 'The lore wing reeks of' : wingNum === 2 ? 'Mechanisms hum behind walls of' : 'The air thickens before the chamber of';
    var byType = {
      Entry:        wingCtx + ' ' + descFrag + '. The entrance threshold is passable but nothing beyond is mapped.',
      Hazard:       'A collapsed section blocks the direct path. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + ' create shifting footholds — patience and coordination are required to cross.',
      LoreReading:  'A fragment archive is embedded in the far wall. Assign one player to read the telegraphs while the rest hold against pressure. Success reveals why ' + (bossName || 'the boss') + ' matters to this region.',
      Puzzle:       'Three interlocked mechanisms control the passage seals. Each wrong answer resets the furthest. Use the room state and boss tells — repeating the first answer will lock the doors permanently.',
      WayfarerPost: 'Three Traveling Wayfarers hold this staging area. They can deploy ahead into the next room, covering a pressure lane or absorbing a hazard. If any Wayfarer fails, they\'re lost for the raid.',
      TrophyCache:  'A sealed alcove holds pre-raid spoils. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + '. Clearing this room does not automatically unlock the next wing — it grants advantage.',
      Approach:     bossName + '\'s influence already warps the space here. ' + descFrag.charAt(0).toUpperCase() + descFrag.slice(1) + '. Positioning and role assignments must be confirmed before moving to the Chamber.',
      Confrontation:'The boss chamber. ' + (bossName || 'The boss') + ' fills the space with pattern, movement, and pressure. Each phase shift requires repositioning. The Wayfarers hold the flanks — if they fall, you hold alone.'
    };
    return byType[roomType] || (wingCtx + ' ' + descFrag + '.');
  }

  function generateRaidHexMapWing(mission, wingNum) {
    var theme = getRaidTheme(mission);
    var templates = RAID_WING_ROOM_SETS[wingNum] || RAID_WING_ROOM_SETS[1];
    var bossName = String(mission.legacyRaidBoss || 'the Boss');
    return templates.map(function (tpl, idx) {
      var needed = getRaidRoomProgressNeeded(tpl.type);
      return {
        idx:         idx,
        type:        tpl.type,
        icon:        tpl.icon,
        label:       tpl.label,
        dd:          tpl.dd,
        progress:    0,
        progressNeeded: needed,
        failures:    0,
        isBoss:      !!tpl.isBoss,
        hasWayfarer: !!tpl.hasWayfarer,
        discovered:  idx === 0,
        frontier:    idx === 1,
        cleared:     false,
        description: buildRaidRoomDescription(theme, wingNum, tpl.type, bossName),
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
    mission.steps[1] = mission.steps[1] || {};
    mission.steps[2] = mission.steps[2] || {};
    mission.steps[3] = mission.steps[3] || {};
    mission.steps[1].completed = !!wing1Done;
    mission.steps[2].completed = !!wing2Done;
    if (!wing2Done) mission.steps[3].completed = false;
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

  function buildRaidHexMapSvg(mission, wingNum) {
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var theme = getRaidTheme(mission);
    if (!Array.isArray(rooms) || !rooms.length) return '';

    var W = 280, H = 110;
    var R = 26, dx = R * 1.72, startX = 30;
    var svgParts = [];

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
      + '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;">' + svgParts.join('') + '</svg>'
      + '<div style="font-size:.6rem;color:' + theme.muted + ';margin-top:.15rem;">Fog of war active. Cleared rooms reveal frontier nodes.</div>'
    + '</div>';
  }

  function getRaidWayfarersForWing(mission, wingNum) {
    if (!mission.raidWayfarers) {
      var allNames = ['Sable Orin', 'Maren of the Third Road', 'Korvus Pale', 'Tinden Ashmark', 'Sel the Wayfinder', 'Breck Two-Roads'];
      var picked = allNames.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 3);
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

  function buildRaidRoomDetail(mission, wingNum, roomIdx) {
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var room = rooms && rooms[roomIdx];
    if (!room) return '';
    var theme = getRaidTheme(mission);
    var bossName = String(mission.legacyRaidBoss || 'the Boss');
    var run = ensureLegacyRaidRunState(mission);

    var typeColor = room.isBoss ? 'var(--red2)' : room.type === 'LoreReading' ? theme.tc : room.type === 'Puzzle' ? 'var(--teal)' : room.type === 'TrophyCache' ? 'var(--gold)' : room.type === 'WayfarerPost' ? 'var(--gold2)' : 'var(--text2)';

    var html = '<div id="raidRoom-' + mission.id + '-' + wingNum + '-' + roomIdx + '" class="room-block" style="border-left:3px solid ' + typeColor + ';padding-left:.5rem;margin-bottom:.4rem;">'
      + '<div class="rb-title" style="color:' + typeColor + ';">' + room.icon + ' Room ' + (roomIdx + 1) + ' — ' + room.label + '</div>'
      + '<div class="rb-text" style="font-size:.8rem;line-height:1.55;margin-bottom:.28rem;">' + room.description + '</div>';

    if (room.result) {
      html += '<div style="padding:.22rem .35rem;background:rgba(255,255,255,.04);border-radius:3px;font-size:.76rem;color:var(--gold2);margin-bottom:.28rem;">' + room.result + '</div>';
    }

    if (!room.isBoss && room.discovered && !room.cleared && Number(room.progressNeeded || 1) > 1) {
      html += '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.2rem;">Progress: ' + Number(room.progress || 0) + '/' + Number(room.progressNeeded || 1) + ' successes · Failures: ' + Number(room.failures || 0) + '</div>';
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
        var advDie = getStat ? getStat('adventure') : 8;
        var encounter = ensureLegacyRaidBossEncounter(mission);
        if (encounter && !encounter.active) setLegacyRaidBossEncounterActive(mission, true);
        encounter = ensureLegacyRaidBossEncounter(mission);
        var roleStatusOk = encounter && encounter.roles && encounter.roles.front && encounter.roles.mechanics && encounter.roles.support;
        var roleStatusText = roleStatusOk
          ? '<span style="color:var(--green2);">Role Balance Ready: Front + Mechanics + Support assigned.</span>'
          : '<span style="color:var(--red2);">Role Balance Missing: assign Front, Mechanics, and Support before resolving phase.</span>';
        var actionText = encounter && encounter.currentAction
          ? ('<strong style="color:var(--red2);">Current Boss Action:</strong> ' + encounter.currentAction.name + ' — ' + encounter.currentAction.text)
          : '<strong style="color:var(--red2);">Current Boss Action:</strong> Unknown.';
        var roleButtons = '<div style="display:flex;gap:.22rem;flex-wrap:wrap;margin:.2rem 0 .18rem;">'
          + '<button class="btn btn-xs ' + (encounter.roles.front ? 'btn-primary' : '') + '" onclick="window.toggleRaidBossRole(' + mission.id + ',\'front\')">Front ' + (encounter.roles.front ? '✓' : '') + '</button>'
          + '<button class="btn btn-xs ' + (encounter.roles.mechanics ? 'btn-primary' : '') + '" onclick="window.toggleRaidBossRole(' + mission.id + ',\'mechanics\')">Mechanics ' + (encounter.roles.mechanics ? '✓' : '') + '</button>'
          + '<button class="btn btn-xs ' + (encounter.roles.support ? 'btn-primary' : '') + '" onclick="window.toggleRaidBossRole(' + mission.id + ',\'support\')">Support ' + (encounter.roles.support ? '✓' : '') + '</button>'
          + '</div>';
        var logHtml = Array.isArray(encounter.log) && encounter.log.length
          ? encounter.log.slice(-4).map(function (entry) { return '<div style="font-size:.67rem;color:var(--muted2);padding:.08rem 0;border-bottom:1px solid var(--border2);">' + entry + '</div>'; }).join('')
          : '<div style="font-size:.67rem;color:var(--muted2);">No boss phases resolved yet.</div>';
        var gmControls = isGMModeActive && isGMModeActive()
          ? '<div style="margin-top:.22rem;display:flex;gap:.22rem;flex-wrap:wrap;">'
            + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidBossRoom(' + mission.id + ',true)">GM: Boss Cleared</button>'
            + '<button class="btn btn-xs btn-red" onclick="window.resolveRaidBossRoom(' + mission.id + ',false)">GM: Boss Wipe</button>'
            + '</div>'
          : '';
        html += '<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.28);padding:.4rem .45rem;margin-bottom:.25rem;">'
          + '<div style="font-size:.72rem;color:var(--red2);font-family:\'Cinzel\',serif;margin-bottom:.12rem;">⚔ Confrontation Engaged — ' + bossName + '</div>'
          + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.5;margin-bottom:.15rem;">This fight starts automatically when the chamber hex is revealed. Complete three hard phases to kill the boss. Roll Adventure d' + advDie + ' vs Dread d' + Number(mission.dread || 8) + '.</div>'
          + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.12rem;">Boss HP: ' + Number(encounter.hp || 0) + '/3 · Strikes: ' + Number(encounter.strikes || 0) + '/2 · Phase: ' + Number(encounter.phase || 1) + '</div>'
          + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.12rem;line-height:1.45;">' + actionText + '</div>'
          + roleButtons
          + '<div style="font-size:.66rem;margin-bottom:.14rem;">' + roleStatusText + '</div>'
          + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;margin-bottom:.18rem;">'
          + '<button class="btn btn-xs btn-red" onclick="window.resolveRaidBossPhase(' + mission.id + ',false)">✗ Phase Failed</button>'
          + '<button class="btn btn-xs btn-primary" onclick="window.resolveRaidBossPhase(' + mission.id + ',true)">✓ Phase Cleared</button>'
          + '</div>'
          + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.06rem;">Encounter Log</div>'
          + '<div style="max-height:96px;overflow:auto;border:1px solid var(--border2);padding:.2rem .28rem;background:rgba(0,0,0,.18);">' + logHtml + '</div>'
          + gmControls
          + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted2);">Raid mechanic intent: high coordination, role balance, and repeatable mastery over action patterns.</div>';

      // Standard rooms: action button
      } else {
        var btnLabel = room.type === 'Entry' ? '→ Enter Wing' : room.type === 'Hazard' ? '⛰ Force Passage (DD' + room.dd + ')' : room.type === 'LoreReading' ? '📜 Read Lore Fragment (DD' + room.dd + ')' : room.type === 'Puzzle' ? '🧩 Solve Mechanism (DD' + room.dd + ')' : room.type === 'Approach' ? '🌀 Advance to Chamber (DD' + room.dd + ')' : room.type === 'TrophyCache' ? '💠 Claim Cache (DD' + room.dd + ')' : '⚄ Explore (DD' + room.dd + ')';
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

    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var theme = getRaidTheme(mission);
    var run = ensureLegacyRaidRunState(mission);
    if (run) run.currentWing = wingNum;

    var cleared = rooms.filter(function (r) { return r.cleared; }).length;
    var total = rooms.length;
    var progressPct = Math.round(cleared / total * 100);
    var progressBar = '<div style="background:' + theme.hexFill + ';border:1px solid ' + theme.hexStroke + ';border-radius:4px;height:5px;margin-bottom:.35rem;">'
      + '<div style="background:' + theme.tc + ';height:100%;width:' + progressPct + '%;border-radius:4px;transition:width .3s;"></div>'
    + '</div>';

    var svgMap = buildRaidHexMapSvg(mission, wingNum);
    var wingTitles = ['', (mission.steps[1] && mission.steps[1].name) || 'Lore Wing', (mission.steps[2] && mission.steps[2].name) || 'Mechanic Wing', (mission.steps[3] && mission.steps[3].name) || 'Boss Chamber'];
    var wingThemes = ['', 'Story Gate', 'Mechanic Gate', 'Execution Gate'];

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

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;max-width:760px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.3rem;margin-bottom:.35rem;">'
      + '<div><div style="font-size:.88rem;color:' + theme.tc + ';font-family:\'Cinzel\',serif;"><strong>Wing ' + wingNum + ': ' + wingTitles[wingNum] + '</strong></div>'
      + '<div style="font-size:.68rem;color:' + theme.muted + ';text-transform:uppercase;letter-spacing:.07em;">' + wingThemes[wingNum] + ' · ' + cleared + '/' + total + ' rooms cleared</div></div>'
      + '<div style="display:flex;gap:.2rem;">' + wingNav + '</div>'
      + '</div>'
      + progressBar
      + svgMap
      + '<div style="margin-bottom:.25rem;">' + roomDetailHtml + '</div>'
      + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.3rem;">'
      + backBtn
      + '</div>'
    + '</div>';

    openModal('Wing ' + wingNum + ': ' + wingTitles[wingNum] + ' — ' + mission.title, html);
    return true;
  }

  window.resolveRaidRoom = function (missionId, wingNum, roomIdx) {
    var mission = getMission(missionId);
    if (!mission) return;
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[wingNum];
    var room = rooms && rooms[roomIdx];
    if (!room || room.cleared) return;

    var theme = getRaidTheme(mission);
    var run = ensureLegacyRaidRunState(mission);
    var manualMode = typeof isMissionManualRollMode === 'function' && isMissionManualRollMode();

    // Entry room: free pass, just reveal next
    if (room.type === 'Entry' || room.dd === 0) {
      room.cleared = true;
      room.result = '→ Threshold crossed.';
      _raidRevealNextRoom(rooms, roomIdx);
      openRaidWingPopup(missionId, wingNum);
      return;
    }

    // WayfarerPost with no action needed other than pass-through
    if (room.type === 'WayfarerPost') {
      room.cleared = true;
      room.result = '⚑ Staging post secured. Wayfarers hold the flanks.';
      _raidRevealNextRoom(rooms, roomIdx);
      _checkRaidWingComplete(mission, wingNum, rooms);
      openRaidWingPopup(missionId, wingNum);
      return;
    }

    var advDie = typeof getStat === 'function' ? getStat('adventure') : 8;
    var bonus = Number(mission.bonus || 0);
    // Deployed wayfarers give a bonus in this wing
    var wayfarerBonus = 0;
    if (Array.isArray(mission.raidWayfarers)) {
      mission.raidWayfarers.forEach(function (wf) {
        if (wf.status === 'deployed' && Number(wf.wing || 0) === wingNum) wayfarerBonus += 2;
      });
    }
    var cleanBonus = (run && run.wingClean && run.wingClean[wingNum - 1]) ? 2 : 0;
    var totalBonus = bonus + wayfarerBonus + cleanBonus;
    var dd = Number(room.dd || 6);

    var success, advR, dreadR;
    if (manualMode) {
      // In manual mode: show result popup with Pass/Fail buttons similar to existing system
      openModal('Room Roll — ' + room.label,
        '<div style="font-size:.84rem;color:var(--muted3);line-height:1.55;margin-bottom:.4rem;">'
        + room.description
        + '</div>'
        + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.45rem .55rem;margin-bottom:.4rem;">'
        + '<div style="font-size:.8rem;color:var(--text2);">Roll Adventure d' + advDie + (totalBonus ? ' + ' + totalBonus : '') + ' vs DD' + dd + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);">Wayfarers: +' + wayfarerBonus + ' · Prior wing clean: +' + cleanBonus + ' · Bonus: +' + bonus + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:.3rem;justify-content:flex-end;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-red" onclick="window._resolveRaidRoomOutcome(' + missionId + ',' + wingNum + ',' + roomIdx + ',false);closeModal();">✗ Failure</button>'
        + '<button class="btn btn-sm btn-primary" onclick="window._resolveRaidRoomOutcome(' + missionId + ',' + wingNum + ',' + roomIdx + ',true);closeModal();">✓ Success</button>'
        + '</div>'
      );
      return;
    }

    advR = typeof explodingRoll === 'function' ? explodingRoll(advDie) : { total: Math.floor(Math.random() * advDie) + 1 + totalBonus, exploded: false };
    var dreadVal = typeof roll === 'function' ? roll(dd) : Math.floor(Math.random() * dd) + 1;
    success = (advR.total + totalBonus) >= dreadVal;
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
      room.progress = Number(room.progress || 0) + 1;
      var needed = Math.max(1, Number(room.progressNeeded || 1));
      var resultByType = {
        Hazard:      '⛰ Pressure reduced. Keep forcing the lane.',
        LoreReading: '📜 Fragment partially decoded. Hold while telegraphs are read.',
        Puzzle:      '🧩 One mechanism aligned. The gate still resists.',
        Approach:    '🌀 Formation advance successful. Keep pressure.',
        TrophyCache: '💠 Cache lock weakened. One more coordinated push needed.',
        Entry:       '→ Crossed.',
        WayfarerPost:'⚑ Staging secured.'
      };
      if (Number(room.progress || 0) < needed) {
        room.result = (resultByType[room.type] || 'Progress made.') + ' (' + Number(room.progress || 0) + '/' + needed + ')';
        if (typeof showNotif === 'function') showNotif('Progress: ' + room.label + ' (' + Number(room.progress || 0) + '/' + needed + ')', 'info');
        openRaidWingPopup(missionId, wingNum, roomIdx);
        return;
      }

      room.cleared = true;
      if (room.type === 'LoreReading') {
        mission.legacyRaidLoreFragment = buildLegacyRaidLoreFragment(mission);
        mission.bonus = Math.min(20, Number(mission.bonus || 0) + 1);
        room.result = '📜 ' + mission.legacyRaidLoreFragment + ' Wing 3 gains +1 tactical bonus from telegraph reads.';
        if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
      } else if (room.type === 'Puzzle') {
        room.result = '🧩 Mechanism solved. Gate seals open and the raid path advances.';
      } else if (room.type === 'Approach') {
        room.result = '🌀 Pressure lane cleared. Confrontation chamber opens.';
      } else if (room.type === 'Hazard') {
        room.result = '⛰ Passage forced. The route is open.';
      } else if (room.type === 'TrophyCache') {
        room.result = '💠 Cache secured. Raid receives tactical reserve.';
      } else {
        room.result = '✓ Room cleared.';
      }
      _raidRevealNextRoom(rooms, roomIdx);
      _checkRaidWingComplete(mission, wingNum, rooms);
      if (typeof showNotif === 'function') showNotif('Room cleared: ' + room.label, 'good');
      var nextRoom = rooms[roomIdx + 1];
      if (nextRoom && nextRoom.isBoss) {
        setLegacyRaidBossEncounterActive(mission, true);
        if (typeof showNotif === 'function') showNotif('Boss chamber breached. Confrontation is now live.', 'warn');
        openRaidWingPopup(missionId, wingNum, roomIdx + 1);
        return;
      }

    } else {
      room.failures = Number(room.failures || 0) + 1;
      room.progress = Math.max(0, Number(room.progress || 0) - 1);
      room.result = '✗ Failed. The room holds. Progress reduced to ' + Number(room.progress || 0) + '/' + Math.max(1, Number(room.progressNeeded || 1)) + '. Regroup or deploy a Wayfarer.';
      // Hazard/Approach failure in wing 3 → trigger wipe system
      if (wingNum === 3 && (room.type === 'Hazard' || room.type === 'Approach')) {
        run.pendingWing = wingNum;
        run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, wingNum);
        run.wipes = Number(run.wipes || 0) + 1;
        markLegacyRaidWingOutcome(mission, wingNum, false);
        // kick to wipe decision
        openLegacyRaidWipeDecision(missionId);
        return;
      }
      if (run) markLegacyRaidWingOutcome(mission, wingNum, false);
      if (typeof showNotif === 'function') showNotif('Room failed — regroup and try again, or deploy a Wayfarer.', 'warn');
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

  window.resolveRaidBossPhase = function (missionId, success) {
    var mission = getMission(missionId);
    if (!mission) return;
    var run = ensureLegacyRaidRunState(mission);
    var encounter = ensureLegacyRaidBossEncounter(mission);
    if (!encounter || !encounter.active) setLegacyRaidBossEncounterActive(mission, true);
    encounter = ensureLegacyRaidBossEncounter(mission);

    var rolesReady = encounter.roles && encounter.roles.front && encounter.roles.mechanics && encounter.roles.support;
    var actionName = encounter.currentAction && encounter.currentAction.name ? encounter.currentAction.name : 'Unknown Action';
    if (!rolesReady) {
      success = false;
      encounter.log.push('Phase ' + Number(encounter.phase || 1) + ': role balance failed before resolving action.');
    }

    if (success) {
      encounter.hp = Math.max(0, Number(encounter.hp || 0) - 1);
      encounter.log.push('Phase ' + Number(encounter.phase || 1) + ': cleared against ' + actionName + '. Boss HP now ' + encounter.hp + '/3.');
      encounter.phase = Number(encounter.phase || 1) + 1;
      encounter.roles = { front: false, mechanics: false, support: false };
      rotateLegacyRaidBossAction(mission);
      if (encounter.hp <= 0) {
        window.resolveRaidBossRoom(missionId, true);
        return;
      }
      if (typeof showNotif === 'function') showNotif('Boss phase cleared. Prepare next assignment.', 'good');
      openRaidWingPopup(missionId, 3, (ensureRaidHexMap(mission).wings[3] || []).length - 1);
      return;
    }

    encounter.strikes = Number(encounter.strikes || 0) + 1;
    if (encounter.currentAction && encounter.currentAction.raidwide) {
      encounter.raidwideHits = Number(encounter.raidwideHits || 0) + 1;
      encounter.log.push('Phase ' + Number(encounter.phase || 1) + ': ' + actionName + ' landed raidwide pressure. Strike ' + encounter.strikes + '/2.');
    } else {
      encounter.log.push('Phase ' + Number(encounter.phase || 1) + ': failed to answer ' + actionName + '. Strike ' + encounter.strikes + '/2.');
    }
    encounter.roles = { front: false, mechanics: false, support: false };
    rotateLegacyRaidBossAction(mission);
    if (run) markLegacyRaidWingOutcome(mission, 3, false);

    if (encounter.strikes >= 2) {
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
    var map = ensureRaidHexMap(mission);
    var rooms = map.wings[3];
    var bossRoom = rooms && rooms[rooms.length - 1];
    var run = ensureLegacyRaidRunState(mission);

    if (success) {
      if (bossRoom) { bossRoom.cleared = true; bossRoom.result = '🐉 ' + String(mission.legacyRaidBoss || 'Boss') + ' defeated. Raid clear.'; }
      var encounter = ensureLegacyRaidBossEncounter(mission);
      if (encounter) encounter.active = false;
      // mark wing 3 complete, then fire overall clear
      if (typeof mission.steps !== 'undefined') mission.steps[3] = mission.steps[3] || {};
      if (run) markLegacyRaidWingOutcome(mission, 3, true);
      if (typeof closeModal === 'function') closeModal();
      // Wire into existing outcome system
      if (typeof resolveMissionOutcome === 'function') resolveMissionOutcome(missionId, true);
    } else {
      if (run) {
        run.pendingWing = 3;
        run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, 3);
        run.wipes = Number(run.wipes || 0) + 1;
        markLegacyRaidWingOutcome(mission, 3, false);
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

  function _raidRevealNextRoom(rooms, clearedIdx) {
    var nextIdx = clearedIdx + 1;
    if (nextIdx < rooms.length) {
      rooms[nextIdx].discovered = true;
      rooms[nextIdx].frontier = false;
      // Mark the one after that as frontier (visible but not enterable)
      if (nextIdx + 1 < rooms.length) {
        rooms[nextIdx + 1].frontier = true;
      }
    }
  }

  function _checkRaidWingComplete(mission, wingNum, rooms) {
    if (!rooms) return;
    // Boss wing variant: completion is handled by resolveRaidBossRoom
    if (wingNum === 3) return;
    var allClear = rooms.every(function (r) { return r.cleared; });
    if (!allClear) return;
    var run = ensureLegacyRaidRunState(mission);
    if (run) markLegacyRaidWingOutcome(mission, wingNum, true);
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
          'Three Traveling Wayfarers (DD6 | 12 Stress) support the raid as allied specialists.',
          'Boss mechanics should force movement, positioning, and role swaps instead of tank-and-spank play.',
          'The kill grants medals, raid points, and a unique trophy drop.'
        ]
      }
    ];
  }

  function openLegacyRaidMissionPopup(missionId, context) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    if (typeof openModal !== 'function') return false;
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

    // Ensure raid hex map is initialized now so room counts are ready
    ensureRaidHexMap(mission);
    var raidMapRoomProgress = function (w) {
      var wMap = mission.raidHexMap && mission.raidHexMap.wings && mission.raidHexMap.wings[w];
      if (!Array.isArray(wMap)) return '';
      var cl = wMap.filter(function (r) { return r.cleared; }).length;
      return cl + '/' + wMap.length + ' rooms';
    };

    if (!s1.completed) {
      recommendedAction = 'Story gate open — enter Wing 1 to breach the lore and understand the boss.';
      stepButtons = '<button class="btn btn-sm btn-teal" onclick="openRaidWingPopup(' + mission.id + ',1);closeModal();">🐉 Enter Wing 1 <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(1) + ')</span></button>';
    } else if (!s2.completed) {
      recommendedAction = 'Mechanic gate open — Wing 2 puzzle must be solved before the boss chamber stabilises.';
      stepButtons = '<button class="btn btn-sm btn-primary" onclick="openRaidWingPopup(' + mission.id + ',2);closeModal();">🧩 Enter Wing 2 <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(2) + ')</span></button>';
    } else if (!s3.completed) {
      recommendedAction = 'Boss wing open — every telegraph learned. Enter the Confrontation Chamber.';
      stepButtons = '<button class="btn btn-sm btn-warn" onclick="openRaidWingPopup(' + mission.id + ',3);closeModal();">⚔ Enter Wing 3 — Boss <span style="font-size:.65rem;opacity:.7;">(' + raidMapRoomProgress(3) + ')</span></button>';
    } else {
      recommendedAction = 'Raid contract already resolved.';
      stepButtons = '<button class="btn btn-sm" disabled>Raid Cleared</button>';
    }

    var wingHtml = buildLegacyRaidWingData(mission).map(function (wing) {
      var step = steps[wing.key] || {};
      var done = !!step.completed;
      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .55rem;">'
        + '<div style="display:flex;justify-content:space-between;gap:.35rem;margin-bottom:.18rem;">'
        + '<div style="font-size:.77rem;color:var(--text2);"><strong>Wing ' + wing.key + ': ' + wing.title + '</strong></div>'
        + '<div style="font-size:.67rem;color:' + (done ? 'var(--green2)' : 'var(--gold2)') + ';text-transform:uppercase;letter-spacing:.08em;">' + (done ? 'Cleared' : wing.theme) + '</div>'
        + '</div>'
        + '<div style="font-size:.71rem;color:var(--muted2);line-height:1.5;margin-bottom:.18rem;">' + wing.detail + '</div>'
        + '<div style="font-size:.69rem;color:var(--teal);line-height:1.45;margin-bottom:.22rem;">' + wing.actions.join(' ') + '</div>'
        + (!done ? '<button class="btn btn-xs btn-teal" onclick="openRaidWingPopup(' + mission.id + ',' + wing.key + ')">→ Open Wing Map</button>' : '<span style="font-size:.67rem;color:var(--green2);">✓ Wing complete</span>')
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
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.42rem .45rem;"><div style="font-size:.66rem;color:var(--gold2);text-transform:uppercase;letter-spacing:.08em;">Front</div><div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Hold the boss, reposition telegraphs, and protect puzzle solvers.</div></div>'
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
        + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.45;">Allied support: 3 Traveling Wayfarers (DD6 | 12 Stress)</div>'
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
        + '<button class="btn btn-sm" onclick="if(typeof renderMissionTracker===\'function\'){renderMissionTracker();}">Refresh Mission Tracker</button>'
        + '</div>'
        + '</div>'
    );
    return true;
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
    var html='<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'+introLine+'</div>'
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
      if (contentElPending) contentElPending.innerHTML=compBanner+featureBadge
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
        actionBtn='<div style="margin-top:.2rem;display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;"><div style="font-size:.7rem;color:var(--red2);font-weight:700;">\u2694 '+room.find.count+' enemies \u00b7 DD'+room.find.dd+' \u00b7 '+room.find.hp+' HP each</div><button class="btn btn-xs" onclick="switchTab(\'combat\',document.querySelector(\".tab-btn[onclick*=\\\"combat\\\"]\"))">Open Combat</button><button class="btn btn-xs btn-red" onclick="resolveMissionRoomEnemy('+missionId+','+idx+',false)">Failure</button><button class="btn btn-xs btn-primary" onclick="resolveMissionRoomEnemy('+missionId+','+idx+',true)">Success</button></div>';
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
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm btn-teal" onclick="completeMissionSiteStep('+missionId+');closeModal();">Proceed to Confrontation</button></div>';
      } else {
        proceedBtn='<div style="display:flex;justify-content:flex-end;margin-top:.4rem;"><button class="btn btn-sm" onclick="completeMissionSiteStep('+missionId+');closeModal();" style="opacity:.75;">Skip Remaining Rooms \u2192 Confrontation</button></div>';
      }
    }

    var titleEl=document.getElementById('modalTitle');
    var contentEl=document.getElementById('modalContent');
    if (titleEl) titleEl.textContent='Step 2 - '+((mission.steps[2] && mission.steps[2].name) || 'Go to Site');
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
    var gmControls='';
    if (gmMode) {
      gmControls='<div style="background:rgba(128,96,192,.08);border:1px solid rgba(128,96,192,.35);padding:.35rem .45rem;margin-bottom:.45rem;">'
        +'<div style="font-family:\'Cinzel\',serif;font-size:.55rem;letter-spacing:.1em;color:var(--purple);text-transform:uppercase;margin-bottom:.2rem;">GM Controls</div>'
        +'<div style="display:flex;gap:.3rem;flex-wrap:wrap;">'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="window.adjustMissionDread('+missionId+',-1)">Dread -</button>'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="window.adjustMissionDread('+missionId+',1)">Dread +</button>'
          +'<button class="btn btn-xs" style="border-color:var(--purple);color:var(--purple);" onclick="if(window.settingsSystem&&window.settingsSystem.showGMPrompt){window.settingsSystem.showGMPrompt(\'Mission Confrontation\',\'Frame the fiction, then choose the outcome based on the scene.\',[{label:\'Mark Success\',action:\'resolveMissionOutcome('+missionId+',true);closeModal();\'},{label:\'Mark Failure\',action:\'resolveMissionOutcome('+missionId+',false);closeModal();\'}]);}">Open GM Prompt</button>'
          +'<button class="btn btn-xs btn-primary" onclick="resolveMissionOutcome('+missionId+',true)">GM: Force Success</button>'
          +'<button class="btn btn-xs btn-red" onclick="resolveMissionOutcome('+missionId+',false)">GM: Force Failure</button>'
        +'</div>'
        +'<div style="font-size:.66rem;color:var(--muted2);margin-top:.22rem;">Scene Dread: d'+dreadDie+'</div>'
      +'</div>';
    }

    var html=compBanner+featureBadge+guardsSection+mercSection+targetRow+rollInstr+gmControls
      +'<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
        +'<button class="btn btn-sm btn-red" onclick="resolveMissionOutcome('+missionId+',false)">\u2717 Failure \u2014 Roll Failed</button>'
        +'<button class="btn btn-sm btn-primary" onclick="resolveMissionOutcome('+missionId+',true)">\u2713 Success \u2014 Roll Succeeded</button>'
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
    if (Number(wing || 3) === 3) base += 40;
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

    openModal(
      'Raid Wipe - Checkpoint Breach',
      '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
        + '<div style="margin-bottom:.35rem;color:var(--red2);"><strong>Wing ' + wing + ' failed.</strong> The encounter did not hold and the team is forced back to a checkpoint.</div>'
        + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.24rem;">Checkpoint revive cost: ' + (canFreeRevive ? 'Free (trophy charge)' : (effectiveCost + ' ₵')) + ' · Wipes this run: ' + Number(run.wipes || 0) + '</div>'
        + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.4rem;">Choose whether to revive at Wing ' + Number(run.checkpointWing || wing) + ' and continue, or accept mission failure.</div>'
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
      if (typeof closeModal === 'function') closeModal();
      if (typeof showNotif === 'function') showNotif('Raid revived at checkpoint. Re-enter the wing when ready.', 'good');
      return openLegacyRaidMissionPopup(mission.id, { tokenType: 'confront', regionTag: mission.region || 'region' });
    }
    if (typeof closeModal === 'function') closeModal();
    resolveMission(mission.id, false, {
      legacyRaid: {
        wipes: Number(run.wipes || 0),
        revivesUsed: Number(run.revivesUsed || 0),
        reviveCreditsSpent: Number(run.reviveCreditsSpent || 0)
      }
    });
    return true;
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
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.56;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:.35rem;flex-wrap:wrap;margin-bottom:.25rem;">'
      + '<div style="font-size:.9rem;color:var(--gold2);"><strong>Raid Summary</strong></div>'
      + firstTryBadge
      + '</div>'
      + '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.3rem;">Mechanics solved cleanly: ' + mechanicsClean + '/3 · Wipes: ' + Number(run.wipes || 0) + ' · Revives: ' + Number(run.revivesUsed || 0) + '</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.16rem;">Wing results: W1 ' + (run.wingClean[1] ? 'clean' : ('strained (' + Number(run.wingFailures[1] || 0) + ' failures)')) + ' · W2 ' + (run.wingClean[2] ? 'clean' : ('strained (' + Number(run.wingFailures[2] || 0) + ' failures)')) + ' · W3 ' + (run.wingClean[3] ? 'clean' : ('strained (' + Number(run.wingFailures[3] || 0) + ' failures)')) + '</div>'
      + '<div style="margin-bottom:.3rem;">' + timelineCard + '</div>'
      + '<div style="font-size:.74rem;color:var(--teal);margin-bottom:.38rem;">Bonus medals for clean execution: +' + bonusMedals + '</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:.3rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-primary" onclick="finalizeLegacyRaidClear(' + mission.id + ',' + bonusMedals + ')">Claim Raid Rewards</button>'
      + '</div>'
      + '</div>';
    return { bonusMedals: bonusMedals, html: html };
  }

  function finalizeLegacyRaidClear(missionId, bonusMedals) {
    var mission = getMission(missionId);
    if (!mission || mission.missionType !== 'legacy_raid') return false;
    var run = ensureLegacyRaidRunState(mission);
    if (!run) return false;
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
      abilityUses: Number(run.abilityUses || 0)
    };
    if (typeof closeModal === 'function') closeModal();
    resolveMission(mission.id, true, { legacyRaid: mission.legacyRaidSummary });
    return true;
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
      mission.loot=mission.loot.concat(newLoot);
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
    }
    if (S.completedMissions.length>=MAX_COMPLETED_MISSIONS) S.completedMissions.shift();
    S.completedMissions.push(completedEntry);
    S.activeMissions.splice(idx,1);
    try { renderMissionBoard(); } catch (err) {}
    try { renderMissionTracker(); } catch (err) {}
    try { renderCompletedMissions(); } catch (err) {}
    try { if (typeof renderBackpackUI === 'function') renderBackpackUI(); } catch (err) {}
    try { if (typeof window.refreshQuickPanelSection === 'function') window.refreshQuickPanelSection('missions'); } catch (err) {}
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
      var raidMedalText = mission.missionType === 'legacy_raid' && Number(mission.legacyRaidBonusMedals || 0) > 0
        ? (' \u00B7 Raid Clean Bonus: +' + Number(mission.legacyRaidBonusMedals || 0) + ' medal(s)')
        : '';
      try { showNotif('Mission complete! +1 Renown \u00B7 +'+mission.reward+'\u20B5 \u00B7 '+(mission.factionGainName||'Faction')+' +1 / '+(mission.factionLoseName||'Faction')+' -1' + homeText + raidMedalText + ' \u00B7 Loot: '+mission.loot.join(', '),'good'); } catch (err) {}
      if (stored.length) {
        try { showNotif('Added to backpack: ' + stored.join(', '), 'good'); } catch (err) {}
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

  function resolveMissionOutcome(missionId, success) {
    var mission = getMission(missionId);
    if (mission && mission.missionType === 'legacy_raid') {
      var run = ensureLegacyRaidRunState(mission);
      if (run) run.currentWing = getLegacyRaidCurrentWing(mission);
      if (!success) {
        var wing = Number(run && run.currentWing || 3);
        markLegacyRaidWingOutcome(mission, wing, false);
        if (run) {
          run.wipes = Number(run.wipes || 0) + 1;
          run.pendingWing = wing;
          run.checkpointWing = Math.max(1, Math.min(3, wing));
          run.pendingReviveCost = getLegacyRaidFailureReviveCost(mission, wing);
        }
        return openLegacyRaidWipeDecision(mission.id);
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
    if (!S.activeMissions.length && !holdingTrackerHtml && !pactCardHtml) {
      container.innerHTML='<div style="font-size:.83rem;color:var(--muted2);padding:.3rem 0;">No active missions. Accept a mission from the board above.</div>';
      return;
    }
    container.innerHTML=holdingTrackerHtml + pactCardHtml + S.activeMissions.map(function(mission){
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
        var textCol=step.completed?'var(--muted2)':isActive?'var(--text)':'var(--muted)';
        var strike=step.completed?'text-decoration:line-through;':'';
        var marker=step.completed?(step.skipped?'\u2014':'\u2713'):String(n);
        return '<div style="display:flex;align-items:center;gap:.3rem;padding:.15rem .2rem;">'
          +'<div style="width:1.3rem;height:1.3rem;border-radius:50%;border:1.5px solid '+color+';display:flex;align-items:center;justify-content:center;font-size:.65rem;color:'+color+';flex-shrink:0;">'+marker+'</div>'
          +'<div style="font-size:.75rem;color:'+textCol+';'+strike+'">'+stepLabels[n]+(n===1?' <span style="color:var(--muted);font-size:.62rem;">[optional]</span>':'')+'</div>'
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

      return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.6rem;margin-bottom:.5rem;">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;">'
          +'<div>'
            +'<div style="font-family:\'Cinzel\',serif;font-size:.8rem;color:var(--gold2);margin-bottom:.1rem;">'+mission.title+'</div>'
            +'<div style="font-size:.7rem;color:'+dc+';">'+diff.name+' \u00B7 '+ddSummary+' \u00B7 '+mission.location+'</div>'
            +(mission.region==='galaxy'&&mission.planetName?'<div style="font-size:.66rem;color:var(--gold2);margin-top:.08rem;">🌍 Planet Route: '+mission.planetName+'</div>':'')
            +'<div style="font-size:.66rem;color:var(--teal);margin-top:.12rem;">'+(mission.factionGainName||'Faction')+' +1 \u00B7 '+(mission.factionLoseName||'Faction')+' -1</div>'
            +'<div style="font-size:.66rem;color:'+deadlineTone+';margin-top:.08rem;">Deadline: '+(daysLeft >= 0 ? (daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left') : 'Expired')+'</div>'
            +(badges?'<div style="margin-top:.2rem;">'+badges+'</div>':'')
            +(Array.isArray(mission.checkpoints)&&mission.checkpoints.length&&shouldRevealHiddenInfo()?('<div style="margin-top:.18rem;font-size:.66rem;color:var(--muted2);">Checkpoints: '+mission.checkpoints.join(' \u00B7 ')+'</div>'):'')
          +'</div>'
          +'<button class="btn btn-xs btn-red" onclick="abandonMission('+mission.id+')">Abandon</button>'
        +'</div>'
        +'<div style="border:1px solid var(--border);padding:.2rem .3rem;margin-bottom:.3rem;">'+stepsHTML+'</div>'
        +'<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'+raidBtn+btn1+btn2+btn3+'</div>'
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
  window.resolveMissionRoomTrap=resolveMissionRoomTrap; window.startMissionRoomPuzzle=startMissionRoomPuzzle; window.resolveMissionRoomEnemy=resolveMissionRoomEnemy;
  window.startMissionStep3=startMissionStep3; window.resolveMission=resolveMission;
  window.resolveMissionOutcome=resolveMissionOutcome;
  window.renderMissionBoard=renderMissionBoard; window.renderMissionTracker=renderMissionTracker; window.renderCompletedMissions=renderCompletedMissions;
  window.createMission=createMission;
  window.autoFailExpiredMissions=autoFailExpiredMissions;
  window.adjustMissionDread=adjustMissionDread;
  window.createOriginMissionFromReason=createOriginMissionFromReason;
  window.createDeityPactMission=createDeityPactMission;
  window.autoAdvanceMissionFromProvinceHex=autoAdvanceMissionFromProvinceHex;
  window.autoAdvanceMissionFromSeaHex=autoAdvanceMissionFromSeaHex;
  window.handleLegacyRaidMarkerInteraction=handleLegacyRaidMarkerInteraction;
  window.openLegacyRaidMissionPopup=openLegacyRaidMissionPopup;
  window.useLegacyRaidAbility=useLegacyRaidAbility;
  window.resolveLegacyRaidReviveChoice=resolveLegacyRaidReviveChoice;
  window.finalizeLegacyRaidClear=finalizeLegacyRaidClear;
  window.completeMissionStep=function(missionId,stepId){
    if(stepId===1) completeMissionInfoStep(missionId,true,JSON.stringify(rollInfoFeature()));
    else if(stepId===2) completeMissionSiteStep(missionId);
    else if(stepId===3) resolveMission(missionId,true);
  };
  window.rollForLoot=rollShopLoot; window.generateRandomJobs=generateMissions;

}());
