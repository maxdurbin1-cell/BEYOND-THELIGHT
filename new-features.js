/* ============================================================
   new-features.js — Caravan, Holding, Combat Map, Path Token
   Upgrades for BEYOND: The Light
   ============================================================ */
(function () {
  // ── DATA ─────────────────────────────────────────────────────────────────────
  var CARAVAN_SIZES = {
    Small:  { crew: 2, cargo: 12, dread: 6,  stress: 12, modSlots: 1, cost: 1000 },
    Medium: { crew: 4, cargo: 16, dread: 8,  stress: 16, modSlots: 2, cost: 2000 },
    Large:  { crew: 6, cargo: 20, dread: 10, stress: 20, modSlots: 3, cost: 3000 }
  };

  var CARAVAN_NAME_FIRST = ["Iron","Ash","Dust","Red","Grey","Black","Sand","Salt","Broken","Rusty","Wild","Old","Long","Hard","Pale"];
  var CARAVAN_NAME_LAST  = ["Runner","Hauler","Wheel","Drifter","Walker","Mover","Pilgrim","Cart","Rig","Crawler","Nomad","Road","Serpent","Fort","Wagon"];
  var CARAVAN_POWER_SOURCES = [
    "Steam-driven boiler engine — fed by salvaged coal, scorching and unreliable.",
    "Six armored draft horses in heavy harness.",
    "Arcane drive crystals pulled from a Lost City, humming faintly.",
    "Biodiesel engine cobbled from salvaged pre-collapse parts.",
    "Clockwork spring mechanism, wound manually each morning before departure.",
    "Repurposed diesel engine, leaks oil and leaves a black trail.",
    "Plasma coil array, looted from a transport depot — fragile but fast.",
    "Solar collector panels on the roof, sluggish at night or under cloud.",
    "Ethanol furnace burning fermented waste grain.",
    "Wind sail rigged above the flatbed — works only on open terrain.",
    "Hybrid: beast-drawn by day, small salvaged generator by night.",
    "Magnetic levitation array — silent but delicate."
  ];

  var HOLDING_NAME_FIRST = ["Iron","Stone","Ash","Grey","Black","Red","Old","High","Far","Last","Dark","Cold","Storm","Salt","Ember"];
  var HOLDING_NAME_LAST  = ["Keep","Hold","Gate","Reach","Watch","Bastion","Spire","Haven","Seat","Citadel","Tower","Wall","Fort","Mire","End"];

  var CHASE_ZONES = ["Engaged", "Close", "Nearby", "Far"];

  var CARAVAN_MODS = [
    { id: "defense",     name: "Defense Module",    base: "Adds +d4 to Defend Rolls made against the Transporter." },
    { id: "wheelspikes", name: "Wheel Spikes",       base: "When Engaged with another Transporter, roll Strike +d4." },
    { id: "medroom",     name: "Med Room",           base: "Heals +1 Trauma when used during a rest." },
    { id: "expandable",  name: "Expandable Room",    base: "Increases item carrying capacity by +5 Items." },
    { id: "crossbolts",  name: "Mounted Crossbolts", base: "Add +1d4 to Shoot Rolls made from the Transporter." },
    { id: "chains",      name: "Chains",             base: "Draw an enemy Transporter from Close to Engaged during combat." },
    { id: "techroom",    name: "Tech Room",          base: "With a Control, Tinker check, craft items worth 100₵ of resources." },
    { id: "browse",      name: "Browse",             base: "Compares local stock, prices, and settlement supplies." },
    { id: "stealth",     name: "Stealth Coating",    base: "Grants +d4 to Control, Stealth Rolls to avoid detection." },
    { id: "jammer",      name: "Signal Jammer",      base: "Interferes with enemy communications within a Zone." }
  ];

  var CARAVAN_DAMAGE_TABLE = [
    "Lose d6 Items from your Transporter's Storage.",
    "Lose d4 Wheels — Disadvantage to all Checks until repaired.",
    "Decrease Dread Die (DD) by one Step.",
    "Control Save or be overturned — the Transporter is disabled."
  ];

  var CRISIS_TYPES = [
    { name: "Anarchy",     desc: "Rising disorder and lawlessness.",     resolution: "Restore order and uphold justice." },
    { name: "Insolvency",  desc: "A dire shortage of resources.",         resolution: "Replenish the Realm's wealth." },
    { name: "Drought",     desc: "Scarcity of food and water.",           resolution: "Secure food for the populace." },
    { name: "Despondency", desc: "Widespread disillusionment.",           resolution: "Uplift morale and instill hope." },
    { name: "Fear",        desc: "A pervasive sense of insecurity.",       resolution: "Strengthen defenses and reassure the populace." },
    { name: "Treachery",   desc: "Growing distrust and disloyalty.",      resolution: "Reinforce loyalty and unity within the council." }
  ];

  var COUNCIL_ROLES = [
    { key: "regent",    name: "Regent",    desc: "Acts as your voice, executing your will and overseeing day-to-day affairs." },
    { key: "commander", name: "Commander", desc: "Trains and equips Wardens, readying forces against threats." },
    { key: "diplomat",  name: "Diplomat",  desc: "Manages alliances and negotiations amongst other Holdings." },
    { key: "elder",     name: "The Elder", desc: "A Sage who takes residence in your Holding, offering wisdom and judgment." }
  ];

  var COURT_COMMONER_TASKS = [
    "A commoner seeks justice for stolen livestock — someone in the Realm is responsible.",
    "A family petitions for land rights to an unclaimed parcel in the east.",
    "A merchant disputes taxes levied on their caravan at the north road.",
    "A group of farmers claims the river has been diverted, drying their fields.",
    "A widow asks that her son, imprisoned last season, be granted clemency.",
    "Three neighbors cannot agree on a property boundary. All three are partially wrong.",
    "A blacksmith wants the Realm's exclusive contract for ironwork.",
    "An entire village reports strange illness and asks for a healer and answers."
  ];

  var COURT_ACOLYTE_TASKS = [
    "An acolyte bears a decree from the Temple of Ash — tithes are overdue.",
    "A Sage requests a waystone be erected on the road to the eastern shrine.",
    "The Circle of Elders demands the Realm cease mining near sacred ground.",
    "An acolyte warns that a traveling curse was last seen heading for your Holding.",
    "A Sage offers blessing in exchange for use of your Commander's forces.",
    "The Elder's council requests access to the Realm's archives — their own were destroyed.",
    "A young acolyte delivers a sealed letter marked with the Sovereign's seal.",
    "The Sages have sent a representative to evaluate your Realm's spiritual standing."
  ];

  // ── STATE ─────────────────────────────────────────────────────────────────────
  function ensureNewFeatureState() {
    if (typeof S === "undefined") { return; }

    var prevCaravan = S.caravan || {};
    S.caravan = Object.assign({
      owned: false,
      name: "",
      powerSource: "",
      size: "Small",
      crew: 0,
      cargo: Array(12).fill(""),
      stress: 0,
      wheelsLost: 0,
      dreadReduced: 0,
      mods: [],
      chase: {
        active: false,
        zone: "Close",
        round: 1,
        enemyDread: 6,
        driverStat: "control",
        log: []
      }
    }, prevCaravan);

    if (!Array.isArray(S.caravan.cargo)) { S.caravan.cargo = Array(12).fill(""); }
    if (!Array.isArray(S.caravan.mods)) { S.caravan.mods = []; }
    S.caravan.chase = Object.assign(
      { active: false, zone: "Close", round: 1, enemyDread: 6, driverStat: "control", log: [] },
      S.caravan.chase || {}
    );
    if (!Array.isArray(S.caravan.chase.log)) { S.caravan.chase.log = []; }

    var prevHolding = S.holding || {};
    S.holding = Object.assign({
      name: "",
      established: false,
      type: "Citadel",
      landmarks: [
        { type: "Dwelling", name: "Riverside Shelter", notes: "" },
        { type: "Dwelling", name: "Nomad Camp",        notes: "" },
        { type: "Temple",   name: "Temple of the Forgotten", notes: "" }
      ],
       extraLandmarks: [], 
       vault: [],
      council: {
        regent:    { name: "", retainers: 3, task: "", status: "Idle" },
        commander: { name: "", retainers: 3, task: "", status: "Idle" },
        diplomat:  { name: "", retainers: 3, task: "", status: "Idle" },
        elder:     { name: "", retainers: 3, task: "", status: "Idle" }
      },
      councilTasks: [],
      pendingCourtType: "commoner",
      retainerContracts: 0,
      regentFailures: 0,
      crises: [],
      taxLog: [],
      bank: {
        invested: 0,
        accrued: 0,
        risk: 'low',
        lastTickAt: 0,
        history: []
      },
      crucible: {
        wins: 0,
        losses: 0,
        roundsPlayed: 0,
        lastResult: '',
        bestWinStreak: 0,
        currentWinStreak: 0,
        lastAt: 0,
        preferredMode: 'control',
        match: null
      }
    }, prevHolding);
    S.holding.wayfarerHome = Object.assign({
      decorLevel: 0,
      securityLevel: 0,
      workshopLevel: 0,
      marketLevel: 0,
      decorTheme: "Frontier",
      log: []
    }, S.holding.wayfarerHome || {});
    if (!Array.isArray(S.holding.wayfarerHome.log)) { S.holding.wayfarerHome.log = []; }
    if (!Array.isArray(S.holding.landmarks))      { S.holding.landmarks = []; }
    if (!Array.isArray(S.holding.extraLandmarks)) { S.holding.extraLandmarks = []; }
    if (!Array.isArray(S.holding.crises))         { S.holding.crises = []; }
      if (!Array.isArray(S.holding.vault))          { S.holding.vault = []; }
    if (!Array.isArray(S.holding.councilTasks))    { S.holding.councilTasks = []; }
    if (!Array.isArray(S.holding.taxLog))         { S.holding.taxLog = []; }
    if (!S.holding.bank || typeof S.holding.bank !== 'object') {
      S.holding.bank = {
        invested: 0,
        accrued: 0,
        risk: 'low',
        lastTickAt: 0,
        history: []
      };
    }
    S.holding.bank.invested = Math.max(0, Number(S.holding.bank.invested || 0));
    S.holding.bank.accrued = Math.max(0, Number(S.holding.bank.accrued || 0));
    S.holding.bank.risk = String(S.holding.bank.risk || 'low');
    if (!Array.isArray(S.holding.bank.history)) { S.holding.bank.history = []; }
    if (!S.holding.crucible || typeof S.holding.crucible !== 'object') {
      S.holding.crucible = {
        wins: 0,
        losses: 0,
        roundsPlayed: 0,
        lastResult: '',
        bestWinStreak: 0,
        currentWinStreak: 0,
        lastAt: 0,
        preferredMode: 'control',
        match: null
      };
    }
    if (!S.holding.crucible.preferredMode) S.holding.crucible.preferredMode = 'control';
    if (!S.holding.governance || typeof S.holding.governance !== 'object') {
      S.holding.governance = {
        patrolStance: 'balanced',
        tariffStance: 'balanced',
        routePriority: 'trade',
        updatedAt: 0
      };
    }
    // Ownership is established by successful quest completion, not by entering a name.

    if (!S.holding.council || typeof S.holding.council !== "object") {
      S.holding.council = {
        regent:    { name: "", retainers: 3, task: "" },
        commander: { name: "", retainers: 3, task: "" },
        diplomat:  { name: "", retainers: 3, task: "" },
        elder:     { name: "", retainers: 3, task: "" }
      };
    }

    S.extraTraits = Array.isArray(S.extraTraits) ? S.extraTraits : [];

    S.augmentations = Array.isArray(S.augmentations) ? S.augmentations : [];
    S.ownedHacks    = Array.isArray(S.ownedHacks)    ? S.ownedHacks    : [];
    S.weaponMods    = Array.isArray(S.weaponMods)    ? S.weaponMods    : [];
    S.hackRoller    = Object.assign(
      { dreadDie: 6, guess: null, selectedHack: null },
      S.hackRoller || {}
    );
    S.holdingQuest  = Object.assign(
      {
        active: false,
        step: 0,
        hexId: null,
        infoHex: null,
        siteHex: null,
        holdingHex: null,
        failed: false,
        attempts: 0,
        step1Completed: false,
        step1Skipped: false,
        step2Completed: false,
        step3Completed: false,
        bonus: 0,
        infoFeature: null,
        additionalDanger: null,
        siteRooms: null,
        securityCount: 0,
        rewardCredits: 250,
        rewardLoot: []
      },
      S.holdingQuest || {}
    );
    // Backfill ownership for saves where quest was completed before established flag existed.
    if (S.holdingQuest.step3Completed && !S.holdingQuest.failed) { S.holding.established = true; }

    var prevMap = S.combatMap || {};
    S.combatMap = Object.assign({ units: [] }, prevMap);
    if (!Array.isArray(S.combatMap.units)) { S.combatMap.units = []; }
  }

  // ── MOUNT ─────────────────────────────────────────────────────────────────────
  function mountNewFeaturePanels() {
    mountCaravanPanel();
    mountHoldingPanel();
  }

  function mountCaravanPanel() {
    var panel = document.getElementById("tab-caravan");
    if (!panel || panel.dataset.mounted) { return; }
    panel.dataset.mounted = "1";
    panel.innerHTML = buildCaravanHTML();
    renderCaravanUI();
  }

  function mountHoldingPanel() {
    var panel = document.getElementById("tab-holding");
    if (!panel) { return; }
    if (panel.dataset.mounted && panel.querySelector("#holdingGate") && panel.querySelector("#holdingBody")) { return; }
    panel.dataset.mounted = "1";
    panel.innerHTML = buildHoldingHTML();
    renderHoldingUI();
  }

  function updateHoldingTabVisibility() {
    // Holdings tab is always visible; gate is handled inside the panel.
  }

  function getHoldingGovernanceState() {
    ensureNewFeatureState();
    var local = S.holding && S.holding.governance ? S.holding.governance : {};
    var world = (typeof window !== 'undefined' && typeof window.getProvinceGovernancePolicyState === 'function')
      ? (window.getProvinceGovernancePolicyState() || {})
      : {};
    return {
      patrolStance: String(world.patrolStance || local.patrolStance || 'balanced'),
      tariffStance: String(world.tariffStance || local.tariffStance || 'balanced'),
      routePriority: String(world.routePriority || local.routePriority || 'trade'),
      updatedAt: Number(world.updatedAt || local.updatedAt || 0)
    };
  }

  function syncHoldingGovernanceToWorldState() {
    ensureNewFeatureState();
    var state = getHoldingGovernanceState();
    S.holding.governance = Object.assign({}, state);
    if (typeof window !== 'undefined' && typeof window.setProvinceGovernancePolicyState === 'function') {
      try { window.setProvinceGovernancePolicyState(state); } catch (_err) {}
    }
  }

  function setHoldingGovernancePolicy(field, value) {
    ensureNewFeatureState();
    var policy = getHoldingGovernanceState();
    var key = String(field || '').toLowerCase();
    var val = String(value || '').toLowerCase();
    if (key === 'patrol') {
      policy.patrolStance = (val === 'strict' || val === 'open') ? val : 'balanced';
    } else if (key === 'tariff') {
      policy.tariffStance = (val === 'extractive' || val === 'relief') ? val : 'balanced';
    } else if (key === 'route') {
      policy.routePriority = (val === 'military' || val === 'civic') ? val : 'trade';
    } else {
      return;
    }
    policy.updatedAt = Date.now();
    S.holding.governance = Object.assign({}, policy);
    if (typeof window !== 'undefined' && typeof window.setProvinceGovernancePolicyState === 'function') {
      try { window.setProvinceGovernancePolicyState(policy); } catch (_err) {}
    }
    if (typeof showNotif === 'function') {
      showNotif('Governance policy updated: ' + key + ' → ' + val + '.', 'good');
    }
    renderHoldingUI();
    if (typeof renderHexMap === 'function') { try { renderHexMap(); } catch (_e0) {} }
    if (typeof selectedHex !== 'undefined' && selectedHex && typeof renderHexInfo === 'function') {
      try { renderHexInfo(selectedHex); } catch (_e1) {}
    }
  }

  // ── CARAVAN HTML ──────────────────────────────────────────────────────────────
  function buildCaravanHTML() {
    var caravanTitle = (window.SharedIconSystem && typeof window.SharedIconSystem.iconVehicle === 'function')
      ? (window.SharedIconSystem.iconVehicle('caravan', { size: 24, title: 'Caravan' }) + '<span style="margin-left:.42rem;vertical-align:middle;">Caravan Management</span>')
      : 'Caravan Management';
    return [
      '<div class="ship-banner">',
        '<h3>' + caravanTitle + '</h3>',
        '<p>Your Transporter — vehicle, crew, cargo, and chase combat. The Driver rolls Control vs Enemy Dread to shift zones during a chase. Other Wayfarers act on their own turns.</p>',
      '</div>',
      '<div id="caravanGate"></div>',
      '<div id="caravanBody">',
      '<div class="sea-summary">',
        '<div class="info-cell"><span class="ic-label">Credits</span><span id="caravanCredits">0 ₵</span></div>',
        '<div class="info-cell"><span class="ic-label">Chase Zone</span><span id="caravanZoneReadout">Close</span></div>',
        '<div class="info-cell"><span class="ic-label">Stress</span><span id="caravanStressReadout">0 / 12</span></div>',
        '<div class="info-cell"><span class="ic-label">Mods Installed</span><span id="caravanModSlotsReadout">0 / 1</span></div>',
      '</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;max-width:1100px;">',
        // Identity + Stats card
        '<div class="card">',
          '<div class="section-title">Transporter Identity</div>',
          '<div class="form-row"><span class="sub-label">Name</span>',
            '<div style="display:flex;gap:.3rem;align-items:center;">',
              '<input type="text" id="caravanName" placeholder="Your Transporter\'s name…" style="flex:1;" onchange="S.caravan.name=this.value">',
              '<button class="btn btn-xs btn-teal" onclick="rollCaravanName()" title="Roll random name">⚄</button>',
              '<button class="btn btn-xs" onclick="clearCaravanName()" title="Clear name">✕</button>',
            '</div>',
          '</div>',
          '<div class="form-row"><span class="sub-label">Power Source / Description</span>',
            '<textarea id="caravanPowerSource" rows="2" placeholder="Steam engine, beast-drawn, arcane drive…" style="resize:none;width:100%;background:var(--surface);border:1px solid var(--border2);color:var(--text);padding:.35rem .45rem;font-family:\'Crimson Pro\',serif;font-size:.9rem;" onchange="S.caravan.powerSource=this.value"></textarea>',
            '<div style="display:flex;gap:.3rem;margin-top:.25rem;">',
              '<button class="btn btn-xs btn-teal" onclick="rollCaravanPowerSource()">⚄ Roll Power Source</button>',
              '<button class="btn btn-xs" onclick="clearCaravanPowerSource()">✕ Clear</button>',
            '</div>',
          '</div>',
          '<div class="section-title" style="margin-top:.5rem;">Size</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.35rem;margin-bottom:.6rem;" id="caravanSizeGrid"></div>',
          '<div class="section-title">Transport Stats</div>',
          '<div id="caravanStatBlock"></div>',
          '<div class="section-title" style="margin-top:.5rem;">Stress Track</div>',
          '<div class="stress-track" id="caravanStressPips"></div>',
          '<div style="display:flex;gap:.3rem;margin-top:.4rem;flex-wrap:wrap;">',
            '<button class="btn btn-sm btn-red" onclick="changeCaravanStress(1)">+ Stress</button>',
            '<button class="btn btn-sm btn-green" onclick="changeCaravanStress(-1)">− Stress</button>',
            '<button class="btn btn-sm btn-red" onclick="rollHeavyDamage()">⚄ Heavy Hit (d4)</button>',
            '<button class="btn btn-sm btn-teal" onclick="repairCaravan()">Full Repair</button>',
          '</div>',
          '<div id="heavyDamageResult" style="margin-top:.4rem;font-size:.83rem;"></div>',
        '</div>',
        // Cargo + Crew card
        '<div class="card">',
          '<div class="section-title">Crew</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.55rem;">',
            '<div><span class="sub-label">Crew Aboard</span>',
              '<div class="counter-row">',
                '<button class="step-btn" onclick="changeCaravanCrew(-1)">−</button>',
                '<span class="counter-val teal-val" id="caravanCrewVal">0</span>',
                '<button class="step-btn" onclick="changeCaravanCrew(1)">+</button>',
                '<span style="font-family:\'Rajdhani\',sans-serif;font-size:.78rem;color:var(--muted2);margin-left:.3rem;">/ <span id="caravanMaxCrew">2</span></span>',
              '</div>',
            '</div>',
            '<div><span class="sub-label">Wheels Lost</span>',
              '<div class="counter-row">',
                '<button class="step-btn" onclick="changeCaravanWheels(-1)">−</button>',
                '<span class="counter-val red-val" id="caravanWheelsVal">0</span>',
                '<button class="step-btn" onclick="changeCaravanWheels(1)">+</button>',
              '</div>',
              '<div id="wheelsWarning" style="font-size:.72rem;color:var(--red);margin-top:.1rem;display:none;">⚠ Disadvantage to all Checks</div>',
            '</div>',
          '</div>',
          '<div class="section-title">Storage</div>',
          '<div id="caravanCargoGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:.25rem;"></div>',
          '<div class="section-title" style="margin-top:.6rem;">Mods Installed</div>',
          '<div id="caravanInstalledMods" style="margin-bottom:.4rem;"></div>',
          '<div class="section-title">Available Mods</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.3rem;">Cost: 5 Path Tokens + 2d20×10 Credits per installation. Purchased at a Holding.</div>',
          '<div id="caravanModsList"></div>',
        '</div>',
        // Chase Combat — full width
        '<div class="card" style="grid-column:1/-1;">',
          '<div class="section-title">Chase Combat</div>',
          '<div style="font-size:.8rem;color:var(--muted3);margin-bottom:.55rem;">The Driver rolls Control vs Enemy Dread to shift zone. Engaged = melee/Strike · Close = spells/items · Nearby = ranged/Shoot · Far = out of range. Other Wayfarers act on their own turns.</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;">',
            '<div>',
              '<div class="section-title">Zone Track</div>',
              '<div class="zone-track" id="caravanZoneTrack" style="margin-bottom:.55rem;flex-wrap:wrap;"></div>',
              '<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.55rem;">',
                '<button class="btn btn-sm btn-teal" onclick="startChase()">Start / Reset</button>',
                '<button class="btn btn-sm" onclick="nextChaseRound()">Next Round</button>',
                '<button class="btn btn-sm btn-red" onclick="endChase()">End Chase</button>',
              '</div>',
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.55rem;">',
                '<div><span class="sub-label">Driver Stat</span>',
                  '<select id="chaseDriverStat" onchange="S.caravan.chase.driverStat=this.value">',
                    '<option value="control">Control</option>',
                    '<option value="body">Body</option>',
                    '<option value="mind">Mind</option>',
                    '<option value="spirit">Spirit</option>',
                  '</select>',
                '</div>',
                '<div><span class="sub-label">Enemy Dread</span>',
                  '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.25rem;">',
                    [4,6,8,10,12].map(function(d){ return '<button class="btn btn-xs" onclick="setChaseEnemyDread('+d+')">d'+d+'</button>'; }).join(""),
                  '</div>',
                  '<div style="font-family:\'Rajdhani\',sans-serif;font-size:.82rem;color:var(--red);margin-top:.2rem;">Current: <span id="chaseEnemyDreadDisplay">d6</span></div>',
                '</div>',
              '</div>',
              '<div style="display:flex;gap:.35rem;flex-wrap:wrap;">',
                '<button class="btn btn-primary" onclick="rollChaseControl()">⚄ Roll Control (Drive)</button>',
                '<button class="btn btn-sm" onclick="adjustChaseZone(-1)">← Closer</button>',
                '<button class="btn btn-sm" onclick="adjustChaseZone(1)">Farther →</button>',
                '<button class="btn btn-sm btn-red" onclick="rollChaseEnemyAttack()">Enemy Attack</button>',
              '</div>',
              '<div id="chaseCombatStatus" style="font-family:\'Rajdhani\',sans-serif;font-size:.82rem;color:var(--muted2);margin-top:.4rem;"></div>',
            '</div>',
            '<div>',
              '<div class="section-title">Chase Log</div>',
              '<div class="combat-log" id="chaseLog" style="max-height:200px;overflow:auto;"></div>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '</div>' // end caravanBody
    ].join("");
  }
  function buildHoldingHTML() {
    return [
      '<div class="ship-banner">',
        '<h3>Holding Management — Lordship</h3>',
        '<p>Requires Renown 9 (Lord). Govern your Realm — manage Landmarks, the Council, the Court, and seasonal Crises. A Realm constitutes the adjacent Hex Zones around your Holding.</p>',
      '</div>',
      '<div id="holdingGate"></div>',
      '<div id="holdingBody">',
      '<div class="sea-summary">',
        '<div class="info-cell"><span class="ic-label">Renown</span><span id="holdingRenownReadout">0</span></div>',
        '<div class="info-cell"><span class="ic-label">Credits</span><span id="holdingCreditsReadout">0 ₵</span></div>',
        '<div class="info-cell"><span class="ic-label">Total Landmarks</span><span id="holdingLandmarkCount">3</span></div>',
        '<div class="info-cell"><span class="ic-label">Active Crises</span><span id="holdingCrisisCount">0</span></div>',
      '</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;max-width:1100px;">',
        // Realm Identity + Landmarks
        '<div class="card">',
          '<div class="section-title">Realm Identity</div>',
          '<div class="form-row"><span class="sub-label">Holding Name</span>',
            '<div style="display:flex;gap:.3rem;align-items:center;">',
              '<input type="text" id="holdingName" placeholder="Name your domain…" style="flex:1;" onchange="S.holding.name=this.value">',
              '<button class="btn btn-xs btn-teal" onclick="rollHoldingName()" title="Roll random name">⚄</button>',
              '<button class="btn btn-xs" onclick="clearHoldingName()" title="Clear name">✕</button>',
            '</div>',
          '</div>',
          '<div class="form-row"><span class="sub-label">Holding Type</span>',
            '<select id="holdingType" onchange="S.holding.type=this.value">',
              '<option>Citadel</option><option>Fortress</option><option>Tower</option><option>Settlement</option>',
            '</select>',
          '</div>',
          '<div class="section-title" style="margin-top:.55rem;">Landmarks</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.4rem;">You are responsible for 3 Landmarks: 2 Dwellings + 1 Temple. Earn 1d4×10₵ per Landmark each Season. Additional Landmarks cost 5,000₵.</div>',
          '<div id="holdingLandmarks"></div>',
          '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.5rem;">',
            '<button class="btn btn-sm btn-primary" onclick="collectTax()">⚄ Collect Tax (End of Season)</button>',
            '<button class="btn btn-sm" onclick="buyLandmark()">Buy Landmark (5,000₵)</button>',
          '</div>',
          '<div id="holdingTaxResult" style="margin-top:.35rem;font-size:.83rem;"></div>',
        '</div>',
        // Council
        '<div class="card">',
          '<div class="section-title">The Council</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.4rem;">Assign tasks. Roll Adventure Die vs Dread d8 for outcomes. Tasks take a Phase to a Season. Councils typically have 3–6 Retainers.</div>',
          '<div id="holdingCouncil"></div>',
        '</div>',
        // The Court
        '<div class="card">',
          '<div class="section-title">The Court</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Those who seek your service and counsel. Hear their case and issue a Task.</div>',
          '<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.55rem;">',
            '<button class="btn btn-primary" onclick="generateCourtEvent(\'commoner\')">👥 Hear a Commoner</button>',
            '<button class="btn btn-teal" onclick="generateCourtEvent(\'acolyte\')">📿 Hear an Acolyte</button>',
            '<button class="btn btn-sm" onclick="generateCourtEvent(\'military\')">⚔ Hear a Commander Request</button>',
          '</div>',
          '<div id="holdingCourtResult"></div>',
        '</div>',
        '<div class="card">',
          '<div class="section-title">Holding Downtime</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Roll celebration events or pick focused activities to talk, accomplish local tasks, and explore your realm.</div>',
          '<div style="display:flex;gap:.3rem;flex-wrap:wrap;">',
            '<button class="btn btn-primary" onclick="rollHoldingDowntimeEvent()">⚄ Roll Celebration Event</button>',
            '<button class="btn btn-teal" onclick="rollHoldingDowntimeActivity(\'talk\')">💬 Talk To People</button>',
            '<button class="btn btn-sm" onclick="rollHoldingDowntimeActivity(\'task\')">🧾 Accomplish Task</button>',
            '<button class="btn btn-warn" onclick="rollHoldingDowntimeActivity(\'explore\')">🧭 Explore Holdings</button>',
          '</div>',
          '<div id="holdingDowntimeResult" style="margin-top:.45rem;font-size:.82rem;"></div>',
        '</div>',
        '<div class="card">',
          '<div class="section-title">Regional Governance</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Late-game policy loop (Renown 12+). Set patrol, tariff, and route priorities to shape consequence spread, mission bias, and market pressure.</div>',
          '<div id="holdingGovernancePanel"></div>',
        '</div>',
        '<div class="card">',
          '<div class="section-title">Crucible 6v6 Tactical Simulator</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Training scenario launched from Holdings. Test your Wayfarer against a full 6v6 tactical engagement with hex-zone positioning and round-by-round combat pressure.</div>',
          '<div id="holdingCruciblePanel"></div>',
        '</div>',
        '<div class="card">',
          '<div class="section-title">Holding Treasury</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Prompt an amount, pick a care tier, and let the bank handle the credits.</div>',
          '<div id="holdingBankPanel"></div>',
          '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.4rem;">',
            '<button class="btn btn-sm btn-teal" onclick="openHoldingBankingModal();">Open Treasury</button>',
          '</div>',
        '</div>',
        // Perils of Leadership — full width
        '<div class="card">',
          '<div class="section-title">Perils of Leadership</div>',
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">At the onset of each Season or upon your return from extended travels, roll d6 for your Realm\'s fate.</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-bottom:.6rem;">',
            '<div style="background:rgba(201,64,64,.06);border:1px solid rgba(201,64,64,.22);padding:.45rem .55rem;">',
              '<div style="font-family:\'Cinzel\',serif;font-size:.55rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.2rem;">1–2: Catastrophe</div>',
              '<div style="font-size:.78rem;color:var(--text2);">The Realm faces 2 immediate Crises.</div>',
            '</div>',
            '<div style="background:rgba(201,162,39,.06);border:1px solid rgba(201,162,39,.22);padding:.45rem .55rem;">',
              '<div style="font-family:\'Cinzel\',serif;font-size:.55rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.2rem;">3–4: Conundrum</div>',
              '<div style="font-size:.78rem;color:var(--text2);">A choice between 2 Crises presents itself.</div>',
            '</div>',
            '<div style="background:rgba(76,175,116,.06);border:1px solid rgba(76,175,116,.22);padding:.45rem .55rem;">',
              '<div style="font-family:\'Cinzel\',serif;font-size:.55rem;letter-spacing:.1em;color:var(--green2);text-transform:uppercase;margin-bottom:.2rem;">5–6: Tranquility</div>',
              '<div style="font-size:.78rem;color:var(--text2);">A period of relative peace and prosperity.</div>',
            '</div>',
          '</div>',
          '<button class="btn btn-primary" onclick="rollLeadershipPeril()">⚄ Roll Seasonal Peril (d6)</button>',
          '<div id="holdingPerilResult" style="margin-top:.45rem;font-size:.83rem;"></div>',
          '<div class="section-title" style="margin-top:.65rem;">Active Crises</div>',
          '<div id="holdingActiveCrises"></div>',
          '<div style="display:flex;gap:.3rem;margin-top:.4rem;flex-wrap:wrap;">',
            '<button class="btn btn-sm" onclick="addManualCrisis()">+ Add Crisis</button>',
            '<button class="btn btn-sm btn-red" onclick="clearAllCrises()">Clear All</button>',
          '</div>',
        '</div>',
        // Holding Vault + Quest row
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;max-width:1100px;margin-top:.85rem;">',
          '<div class="card">',
            '<div class="section-title">Holding Vault</div>',
            '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.4rem;">Secure Storage — move items here from your Backpack.</div>',
            '<div id="holdingVault" style="min-height:2rem;"></div>',
            '<div style="display:flex;gap:.3rem;margin-top:.4rem;flex-wrap:wrap;">',
              '<button class="btn btn-xs btn-primary" onclick="moveBackpackToVault()">Stow from Backpack</button>',
            '</div>',
          '</div>',
          '<div class="card">',
            '<div class="section-title">Holding Acquisition</div>',
            '<div id="holdingQuestStatus"></div>',
          '</div>',
          '<div class="card">',
            '<div class="section-title">Wayfarer Home</div>',
            '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.4rem;">Upgrade your home with decor, security, workshop, and market amenities. Bonuses feed mission and district economy outcomes.</div>',
            '<div id="wayfarerHomePanel"></div>',
          '</div>',
        '</div>',
      '</div>',
      '</div>' // end holdingBody
    ].join("");
  }

  // ── CARAVAN RENDER ─────────────────────────────────────────────────────────────
  function renderCaravanUI() {
    var panel = document.getElementById("tab-caravan");
    if (!panel || !panel.dataset.mounted) { return; }
    ensureNewFeatureState();
    var c = S.caravan;
    var sz = CARAVAN_SIZES[c.size] || CARAVAN_SIZES.Small;

    // Purchase gate
    var gate = document.getElementById("caravanGate");
    var body = document.getElementById("caravanBody");
    if (gate) {
      if (!c.owned) {
        gate.innerHTML = '<div class="card" style="max-width:540px;margin-top:.6rem;">'
          + '<div class="section-title">Acquire a Transporter</div>'
          + '<div style="font-size:.8rem;color:var(--muted2);margin-bottom:.6rem;">You do not own a Transporter yet. Purchase one to begin managing your caravan.</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;">'
          + Object.keys(CARAVAN_SIZES).map(function(size) {
              var s = CARAVAN_SIZES[size];
              return '<div style="border:1px solid var(--border2);padding:.6rem;text-align:center;">'
                + '<div style="font-family:\'Cinzel\',serif;font-size:.65rem;color:var(--gold2);text-transform:uppercase;">' + size + '</div>'
                + '<div style="font-size:.75rem;color:var(--muted2);margin:.2rem 0;">DD' + s.dread + ' | ' + s.stress + ' Stress</div>'
                + '<div style="font-size:.74rem;color:var(--muted2);">' + s.crew + ' Crew · ' + s.cargo + ' Cargo</div>'
                + '<div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;color:var(--gold);margin:.3rem 0;">' + s.cost.toLocaleString() + '\u20B5</div>'
                + '<button class="btn btn-sm btn-primary" onclick="buyCaravan(\'' + size + '\')">Purchase</button>'
                + '</div>';
            }).join('')
          + '</div></div>';
        if (body) { body.style.display = "none"; }
        return;
      } else {
        gate.innerHTML = '';
        if (body) { body.style.display = ""; }
      }
    }

    // Header readouts
    var el;
    el = document.getElementById("caravanCredits");      if (el) { el.textContent = (S.credits || 0) + " \u20B5"; }
    el = document.getElementById("caravanZoneReadout");   if (el) { el.textContent = c.chase.zone; }
    el = document.getElementById("caravanStressReadout"); if (el) { el.textContent = c.stress + " / " + sz.stress; }
    el = document.getElementById("caravanModSlotsReadout"); if (el) { el.textContent = c.mods.length + " / " + sz.modSlots; }

    // Name / power source (set once, allow re-render when changed)
    var nameEl = document.getElementById("caravanName");
    if (nameEl) { nameEl.value = c.name || ""; }
    var psEl = document.getElementById("caravanPowerSource");
    if (psEl) { psEl.value = c.powerSource || ""; }

    // Size grid
    var sg = document.getElementById("caravanSizeGrid");
    if (sg) {
      sg.innerHTML = Object.keys(CARAVAN_SIZES).map(function(size) {
        var s = CARAVAN_SIZES[size];
        var active = c.size === size;
        return '<div onclick="selectCaravanSize(\'' + size + '\')" style="cursor:pointer;border:1px solid ' + (active ? 'var(--gold)' : 'var(--border)') + ';background:' + (active ? 'rgba(201,162,39,.08)' : 'var(--surface)') + ';padding:.5rem .4rem;text-align:center;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.6rem;letter-spacing:.1em;color:' + (active ? 'var(--gold)' : 'var(--muted2)') + ';text-transform:uppercase;">' + size + '</div>'
          + '<div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:.82rem;color:' + (active ? 'var(--gold2)' : 'var(--text2)') + ';">DD' + s.dread + ' | ' + s.stress + ' Stress</div>'
          + '<div style="font-size:.7rem;color:var(--muted2);">' + s.crew + ' Crew · ' + s.cargo + ' Cargo · ' + s.modSlots + ' Mod' + (s.modSlots > 1 ? 's' : '') + '</div>'
          + '<div style="font-size:.66rem;color:var(--muted);">' + s.cost.toLocaleString() + '\u20B5</div>'
          + '</div>';
      }).join("");
    }

    // Stat block
    var effectiveDread = getCaravanDread();
    var sb = document.getElementById("caravanStatBlock");
    if (sb) {
      sb.innerHTML = '<div class="stat-row"><div><div class="stat-label">Dread Die</div>'
        + (c.dreadReduced ? '<div class="stat-sub" style="color:var(--red2);">Reduced ' + c.dreadReduced + ' step' + (c.dreadReduced > 1 ? 's' : '') + '</div>' : '')
        + '</div><div class="stat-die d' + effectiveDread + '" style="font-size:1rem;font-weight:700;">d' + effectiveDread + '</div></div>'
        + '<div class="stat-row"><div><div class="stat-label">Max Crew</div></div><div style="font-family:\'Rajdhani\',sans-serif;font-size:1rem;font-weight:700;color:var(--teal);">' + sz.crew + '</div></div>'
        + '<div class="stat-row"><div><div class="stat-label">Cargo Slots</div></div><div style="font-family:\'Rajdhani\',sans-serif;font-size:1rem;font-weight:700;color:var(--teal);">' + getCaravanCargoMax() + '</div></div>'
        + '<div class="stat-row"><div><div class="stat-label">Mod Slots</div></div><div style="font-family:\'Rajdhani\',sans-serif;font-size:1rem;font-weight:700;color:var(--gold);">' + sz.modSlots + '</div></div>'
        + (c.wheelsLost > 0 ? '<div style="background:rgba(201,64,64,.07);border:1px solid rgba(201,64,64,.25);padding:.3rem .5rem;margin-top:.3rem;font-size:.76rem;color:var(--red2);">⚠ ' + c.wheelsLost + ' Wheel' + (c.wheelsLost > 1 ? 's' : '') + ' Lost — Disadvantage to all Checks</div>' : '');
    }

    // Stress pips
    var sp = document.getElementById("caravanStressPips");
    if (sp) {
      sp.innerHTML = Array.from({ length: sz.stress }, function(_, i) {
        return '<div class="s-pip' + (i < c.stress ? ' filled' : '') + '" onclick="toggleCaravanStress(' + i + ')"></div>';
      }).join("");
    }

    // Crew counter
    el = document.getElementById("caravanCrewVal"); if (el) { el.textContent = c.crew; }
    el = document.getElementById("caravanMaxCrew"); if (el) { el.textContent = sz.crew; }
    el = document.getElementById("caravanWheelsVal"); if (el) { el.textContent = c.wheelsLost; }
    el = document.getElementById("wheelsWarning"); if (el) { el.style.display = c.wheelsLost > 0 ? "block" : "none"; }

    // Cargo grid
    var cg = document.getElementById("caravanCargoGrid");
    if (cg) {
      var maxCargo = getCaravanCargoMax();
      var cargo = c.cargo.slice(0, maxCargo);
      while (cargo.length < maxCargo) { cargo.push(""); }
      cg.innerHTML = cargo.map(function(item, i) {
        if (!item) {
          return '<input class="bp-input" placeholder="Slot ' + (i + 1) + '" value="" onchange="updateCaravanCargo(' + i + ',this.value)">';
        }
        var itemLabel = (typeof weaponLabelHtml === 'function')
          ? weaponLabelHtml(item, 18)
          : String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.28rem .35rem;border-radius:4px;cursor:pointer;" onclick="openCaravanCargoItem(' + i + ')">'
          + '<div style="font-size:.72rem;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + itemLabel + '</div>'
          + '<div style="font-size:.62rem;color:var(--muted2);margin-top:.12rem;">Click: use / equip / move</div>'
          + '</div>';
      }).join("");
    }

    // Installed mods
    var im = document.getElementById("caravanInstalledMods");
    if (im) {
      if (!c.mods.length) {
        im.innerHTML = '<div style="font-size:.78rem;color:var(--muted2);">No mods installed. (' + sz.modSlots + ' slot' + (sz.modSlots > 1 ? 's' : '') + ' available)</div>';
      } else {
        im.innerHTML = c.mods.map(function(modId, i) {
          var mod = CARAVAN_MODS.filter(function(m){ return m.id === modId; })[0];
          if (!mod) { return ""; }
          return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.35rem .5rem;margin-bottom:.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.4rem;">'
            + '<div><div style="font-family:\'Cinzel\',serif;font-size:.63rem;color:var(--gold2);">' + mod.name + '</div><div style="font-size:.72rem;color:var(--muted3);">' + mod.base + '</div></div>'
            + '<button class="btn btn-xs btn-red" onclick="removeMod(' + i + ')">✕</button>'
            + '</div>';
        }).join("");
      }
    }

    // Available mods
    var ml = document.getElementById("caravanModsList");
    if (ml) {
      var full = c.mods.length >= sz.modSlots;
      ml.innerHTML = CARAVAN_MODS.map(function(mod) {
        var installed = c.mods.indexOf(mod.id) >= 0;
        return '<div style="background:var(--surface);border:1px solid var(--border);padding:.3rem .45rem;margin-bottom:.18rem;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;color:' + (installed ? 'var(--muted2)' : 'var(--gold2)') + ';">' + mod.name + (installed ? ' ✓' : '') + '</div>'
          + (!installed ? '<button class="btn btn-xs btn-primary" onclick="installMod(\'' + mod.id + '\')" ' + (full ? 'disabled style="opacity:.4;"' : '') + '>+5 PT + 2d20×10₵</button>' : '')
          + '</div>'
          + '<div style="font-size:.7rem;color:var(--muted3);">' + mod.base + '</div>'
          + '</div>';
      }).join("");
    }

    // Zone track
    renderChaseZoneTrack();

    // Chase status
    el = document.getElementById("chaseCombatStatus");
    if (el) { el.textContent = c.chase.active ? "Round " + c.chase.round + " — Chase Active" : "No chase in progress."; }

    // Chase log
    var cl = document.getElementById("chaseLog");
    if (cl) {
      var log = c.chase.log.slice(-12).reverse();
      cl.innerHTML = log.map(function(entry) {
        return '<div style="font-size:.76rem;color:var(--text2);padding:.18rem 0;border-bottom:1px solid var(--border);">' + entry + '</div>';
      }).join("");
    }

    // Enemy dread display
    el = document.getElementById("chaseEnemyDreadDisplay");
    if (el) { el.textContent = "d" + c.chase.enemyDread; }
  }

  function renderChaseZoneTrack() {
    var el = document.getElementById("caravanZoneTrack");
    if (!el) { return; }
    var current = S.caravan.chase.zone;
    el.innerHTML = CHASE_ZONES.map(function(z) {
      var on = z === current;
      return '<div onclick="S.caravan.chase.zone=\'' + z + '\';renderCaravanUI();" class="zone-pill' + (on ? ' on' : '') + '" style="cursor:pointer;flex:1;text-align:center;">'
        + z + '<div style="font-size:.55rem;color:' + (on ? 'var(--gold2)' : 'var(--muted)') + ';margin-top:.1rem;">'
        + (z === "Engaged" ? "Strike" : z === "Close" ? "Spells" : z === "Nearby" ? "Shoot" : "Out of Range")
        + '</div></div>';
    }).join("");
  }

  // ── CARAVAN FUNCTIONS ─────────────────────────────────────────────────────────
  function selectCaravanSize(size) {
    S.caravan.size = size;
    var sz = CARAVAN_SIZES[size];
    var newCargo = Array(sz.cargo).fill("");
    var old = S.caravan.cargo || [];
    for (var i = 0; i < Math.min(old.length, sz.cargo); i++) { newCargo[i] = old[i]; }
    S.caravan.cargo = newCargo;
    if (S.caravan.stress > sz.stress) { S.caravan.stress = sz.stress; }
    while (S.caravan.mods.length > sz.modSlots) { S.caravan.mods.pop(); }
    S.caravan.dreadReduced = 0;
    renderCaravanUI();
    showNotif("Transporter size set to " + size, "good");
  }

  function getCaravanDread() {
    var base = (CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small).dread;
    var reduced = S.caravan.dreadReduced || 0;
    var current = base;
    for (var i = 0; i < reduced; i++) { current = stepDown(current); }
    return current;
  }

  function getCaravanCargoMax() {
    var base = (CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small).cargo;
    return base + (S.caravan.mods.indexOf("expandable") >= 0 ? 5 : 0);
  }

  function changeCaravanStress(delta) {
    var max = (CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small).stress;
    S.caravan.stress = Math.max(0, Math.min(max, S.caravan.stress + delta));
    renderCaravanUI();
  }

  function toggleCaravanStress(i) {
    S.caravan.stress = i < S.caravan.stress ? i : i + 1;
    renderCaravanUI();
  }

  function rollHeavyDamage() {
    var r = roll(4);
    var result = CARAVAN_DAMAGE_TABLE[r - 1];
    var el = document.getElementById("heavyDamageResult");
    if (el) {
      el.innerHTML = '<div style="background:rgba(201,64,64,.08);border:1px solid rgba(201,64,64,.3);padding:.4rem .5rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.15rem;">Heavy Damage — d4 = ' + r + '</div>'
        + '<div style="font-size:.83rem;color:var(--text2);">' + result + '</div>'
        + '</div>';
    }
    if (r === 3) {
      S.caravan.dreadReduced = (S.caravan.dreadReduced || 0) + 1;
      showNotif("Dread Die stepped down!", "warn");
    }
    renderCaravanUI();
  }

  function repairCaravan() {
    S.caravan.stress = 0;
    S.caravan.wheelsLost = 0;
    S.caravan.dreadReduced = 0;
    var el = document.getElementById("heavyDamageResult");
    if (el) { el.innerHTML = ""; }
    renderCaravanUI();
    showNotif("Transporter fully repaired!", "good");
  }

  function buyCaravan(size) {
    var s = CARAVAN_SIZES[size];
    if (!s) { return; }
    if ((S.credits || 0) < s.cost) {
      showNotif("Need " + s.cost.toLocaleString() + "\u20B5 to purchase a " + size + " Transporter!", "warn"); return;
    }
    S.credits -= s.cost;
    S.caravan.owned = true;
    S.caravan.size = size;
    S.caravan.cargo = Array(s.cargo).fill("");
    updateCreditsUI();
    // Reset mounted so HTML rebuilds fresh
    var panel = document.getElementById("tab-caravan");
    if (panel) { delete panel.dataset.mounted; }
    mountCaravanPanel();
    showNotif(size + " Transporter purchased!", "good");
  }

  function rollCaravanName() {
    var name = pick(CARAVAN_NAME_FIRST) + " " + pick(CARAVAN_NAME_LAST);
    S.caravan.name = name;
    var el = document.getElementById("caravanName");
    if (el) { el.value = name; }
    showNotif("Transporter named: " + name, "good");
  }

  function clearCaravanName() {
    S.caravan.name = "";
    var el = document.getElementById("caravanName");
    if (el) { el.value = ""; }
  }

  function rollCaravanPowerSource() {
    var src = pick(CARAVAN_POWER_SOURCES);
    S.caravan.powerSource = src;
    var el = document.getElementById("caravanPowerSource");
    if (el) { el.value = src; }
  }

  function clearCaravanPowerSource() {
    S.caravan.powerSource = "";
    var el = document.getElementById("caravanPowerSource");
    if (el) { el.value = ""; }
  }

  function rollHoldingName() {
    var name = pick(HOLDING_NAME_FIRST) + " " + pick(HOLDING_NAME_LAST);
    S.holding.name = name;
    var el = document.getElementById("holdingName");
    if (el) { el.value = name; }
    renderHoldingUI();
    showNotif("Holding named: " + name, "good");
  }

  function clearHoldingName() {
    S.holding.name = "";
    var el = document.getElementById("holdingName");
    if (el) { el.value = ""; }
    renderHoldingUI();
  }

  function changeCaravanCrew(delta) {
    var max = (CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small).crew;
    S.caravan.crew = Math.max(0, Math.min(max, S.caravan.crew + delta));
    renderCaravanUI();
  }

  function changeCaravanWheels(delta) {
    S.caravan.wheelsLost = Math.max(0, (S.caravan.wheelsLost || 0) + delta);
    renderCaravanUI();
  }

  function updateCaravanCargo(i, value) {
    S.caravan.cargo[i] = value;
  }

  function moveCaravanCargoToBackpack(i) {
    ensureNewFeatureState();
    var item = (S.caravan.cargo || [])[i] || "";
    if (!item) { showNotif("No cargo item in that slot.", "warn"); return; }
    if (!Array.isArray(S.backpack)) { S.backpack = Array(10).fill(""); }
    var slotIdx = S.backpack.indexOf("");
    if (slotIdx < 0) {
      showNotif("Backpack full.", "warn"); return;
    }
    S.backpack[slotIdx] = item;
    S.caravan.cargo[i] = "";
    if (typeof renderBackpackUI === 'function') { renderBackpackUI(); }
    renderCaravanUI();
    showNotif("Moved to Backpack: " + item, "good");
  }

  function equipCaravanCargoItem(i, slot) {
    ensureNewFeatureState();
    var item = (S.caravan.cargo || [])[i] || "";
    if (!item) { return; }
    var found = (typeof findShopItem === 'function') ? findShopItem(item) : null;
    var cat = found ? found.cat : null;
    var itemLc = String(item).toLowerCase();
    var isWeapon = (cat === 'weapons' || cat === 'melee_exp' || cat === 'ranged_exp');
    var isArmor = (cat === 'armor' || cat === 'armor_exp' || cat === 'space_armor');
    // Fallback when shop lookup is unavailable: still allow recognizable armor names.
    if (!isArmor) {
      isArmor = /armor|armour|suit|radsuit|vaccsuit|hydrosuit|coolant layer/.test(itemLc);
    }
    if ((slot === 'weapon1' || slot === 'weapon2') && !isWeapon) {
      showNotif('Only weapons can be equipped in weapon slots!', 'warn'); return;
    }
    if (slot === 'armor' && !isArmor) {
      showNotif('Only armor can be equipped in the armor slot!', 'warn'); return;
    }

    var equipStr = item;
    if (found && found.item && found.item.stat && (isWeapon || isArmor) && String(item).indexOf(found.item.stat) === -1) {
      equipStr = item + ' (' + found.item.stat + ')';
    }

    var displaced = S.equipment[slot] || '';
    if (displaced) {
      if (!Array.isArray(S.backpack)) { S.backpack = Array(10).fill(''); }
      var bpSlot = S.backpack.indexOf('');
      if (bpSlot < 0) {
        showNotif('Backpack full. Unequip or free one slot first.', 'warn'); return;
      }
      S.backpack[bpSlot] = displaced;
      if (typeof renderBackpackUI === 'function') { renderBackpackUI(); }
    }

    S.equipment[slot] = equipStr;
    S.caravan.cargo[i] = '';
    var inputId = slot === 'weapon1' ? 'eqWeapon1' : slot === 'weapon2' ? 'eqWeapon2' : slot === 'armor' ? 'eqArmor' : 'eqReadied';
    var el = document.getElementById(inputId);
    if (el) { el.value = equipStr; }
    if (typeof updateAllStatDisplays === 'function') { updateAllStatDisplays(); }
    if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
    renderCaravanUI();
    showNotif('Equipped from Caravan: ' + equipStr, 'good');
  }

  function useCaravanCargoItem(i) {
    ensureNewFeatureState();
    var item = (S.caravan.cargo || [])[i] || '';
    if (!item) { return; }
    var itemLabel = (typeof weaponLabelHtml === 'function')
      ? weaponLabelHtml(item, 22)
      : String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!Array.isArray(S.backpack)) { S.backpack = Array(10).fill(''); }
      + '<div style="margin-bottom:.45rem;">' + itemLabel + '</div>'
    if (slotIdx < 0) {
      showNotif('Backpack full! Free one slot to use cargo item.', 'warn'); return;
    }

    S.backpack[slotIdx] = item;
    S.caravan.cargo[i] = '';
    var found = (typeof findShopItem === 'function') ? findShopItem(item) : null;

    if (found) {
      useBackpackItem(slotIdx);
    } else if (/^Scroll:/i.test(String(item).trim())) {
      castScrollFromBackpack(slotIdx);
    } else if (/A\.D\.|Ad\d|d\d/i.test(String(item))) {
      useCustomItem(item, slotIdx);
    } else {
      // No direct use path, put it back.
      S.caravan.cargo[i] = S.backpack[slotIdx];
      S.backpack[slotIdx] = '';
      if (typeof renderBackpackUI === 'function') { renderBackpackUI(); }
      renderCaravanUI();
      showNotif('This cargo item has no direct use action.', 'warn');
      return;
    }

    if (S.backpack[slotIdx]) {
      // Item was not consumed; return to original cargo slot.
      S.caravan.cargo[i] = S.backpack[slotIdx];
      S.backpack[slotIdx] = '';
    }
    if (typeof renderBackpackUI === 'function') { renderBackpackUI(); }
    renderCaravanUI();
  }

  function openCaravanCargoItem(i) {
    ensureNewFeatureState();
    var item = (S.caravan.cargo || [])[i] || '';
    if (!item) { return; }
    var itemLabel = (typeof weaponLabelHtml === 'function')
      ? weaponLabelHtml(item, 22)
      : String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var html = '<div style="font-size:.9rem;color:var(--text2);line-height:1.6;">'
      + '<div style="margin-bottom:.45rem;">' + itemLabel + '</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs btn-teal" onclick="useCaravanCargoItem(' + i + ');closeModal();">⚑ Use</button>'
      + '<button class="btn btn-xs" onclick="moveCaravanCargoToBackpack(' + i + ');closeModal();">↙ Backpack</button>'
      + '<button class="btn btn-xs btn-primary" onclick="equipCaravanCargoItem(' + i + ',\'weapon1\');closeModal();">⚔ W1</button>'
      + '<button class="btn btn-xs btn-primary" onclick="equipCaravanCargoItem(' + i + ',\'weapon2\');closeModal();">⚔ W2</button>'
      + '<button class="btn btn-xs btn-primary" onclick="equipCaravanCargoItem(' + i + ',\'armor\');closeModal();">⚔ Armor</button>'
      + '<button class="btn btn-xs btn-primary" onclick="equipCaravanCargoItem(' + i + ',\'readied\');closeModal();">⚔ Readied</button>'
      + '</div></div>';
    openModal('Caravan Cargo Item', html);
  }

  function installMod(modId) {
    var sz = CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small;
    if (S.caravan.mods.length >= sz.modSlots) {
      showNotif("No mod slots available!", "warn"); return;
    }
    if (S.caravan.mods.indexOf(modId) >= 0) {
      showNotif("Mod already installed!", "warn"); return;
    }
    var pathCost = 5;
    var creditCost = rollMulti(20, 2) * 10;
    if ((S.pathTokens || 0) < pathCost) {
      showNotif("Need " + pathCost + " Path Tokens!", "warn"); return;
    }
    if ((S.credits || 0) < creditCost) {
      showNotif("Need " + creditCost + "\u20B5 for this installation!", "warn"); return;
    }
    S.pathTokens -= pathCost;
    S.credits -= creditCost;
    S.caravan.mods.push(modId);
    updateCreditsUI();
    var ptEl = document.getElementById("pathTokensVal");
    if (ptEl) { ptEl.textContent = S.pathTokens; }
    var mod = CARAVAN_MODS.filter(function(m){ return m.id === modId; })[0];
    showNotif("Installed: " + mod.name + " (\u22125 PT, \u2212" + creditCost + "\u20B5)", "good");
    renderCaravanUI();
  }

  function removeMod(index) {
    S.caravan.mods.splice(index, 1);
    renderCaravanUI();
  }

  function setChaseEnemyDread(n) {
    S.caravan.chase.enemyDread = n;
    var el = document.getElementById("chaseEnemyDreadDisplay");
    if (el) { el.textContent = "d" + n; }
  }

  function startChase() {
    S.caravan.chase.active = true;
    S.caravan.chase.round = 1;
    S.caravan.chase.log = [];
    renderCaravanUI();
    showNotif("Chase begun!", "good");
  }

  function nextChaseRound() {
    S.caravan.chase.round++;
    renderCaravanUI();
  }

  function endChase() {
    S.caravan.chase.active = false;
    renderCaravanUI();
    showNotif("Chase ended.", "");
  }

  function getHoldingGateRenown() {
    var base = S.renown || 0;
    var fr = S.factionRenown || null;
    if (!fr || typeof fr !== 'object') { return base; }
    var maxFaction = base;
    Object.keys(fr).forEach(function(key) {
      var val = Number(fr[key] || 0);
      if (val > maxFaction) { maxFaction = val; }
    });
    return maxFaction;
  }

  function adjustChaseZone(dir) {
    var idx = CHASE_ZONES.indexOf(S.caravan.chase.zone);
    var newIdx = Math.max(0, Math.min(CHASE_ZONES.length - 1, idx + dir));
    S.caravan.chase.zone = CHASE_ZONES[newIdx];
    S.caravan.chase.log.push("R" + S.caravan.chase.round + ": Zone adjusted to " + S.caravan.chase.zone);
    renderCaravanUI();
  }

  function rollChaseControl() {
    var driverStat = S.caravan.chase.driverStat || "control";
    var actionDie = (S.stats && S.stats[driverStat]) || 4;
    var dread = S.caravan.chase.enemyDread;
    var a = explodingRoll(actionDie, { type: 'action', major: true, label: 'Caravan Chase ' + driverStat.toUpperCase() + ' d' + actionDie });
    var d = explodingRoll(dread, { type: 'dread', major: true, label: 'Caravan Chase DD' + dread });
    var success = a.total >= d.total;
    var diff = a.total - d.total;
    var zoneShift = 0;
    if (success && diff >= 3)       { zoneShift = -2; }
    else if (success)                { zoneShift = -1; }
    else if (diff <= -3)             { zoneShift =  2; }
    else                             { zoneShift =  1; }
    var oldZone = S.caravan.chase.zone;
    var idx = CHASE_ZONES.indexOf(oldZone);
    var newIdx = Math.max(0, Math.min(CHASE_ZONES.length - 1, idx + zoneShift));
    S.caravan.chase.zone = CHASE_ZONES[newIdx];
    var zoneMsg = zoneShift < 0 ? "Advanced to " + S.caravan.chase.zone : (zoneShift > 0 ? "Fell back to " + S.caravan.chase.zone : "Held at " + S.caravan.chase.zone);
    var entry = "R" + S.caravan.chase.round + ": " + driverStat.charAt(0).toUpperCase() + driverStat.slice(1) + " d" + actionDie + "=" + a.total + " vs DD" + dread + "=" + d.total + " \u2014 " + (success ? "\u2713" : "\u2717") + " " + zoneMsg;
    if (a.exploded) { entry += " \u2726 Crit!"; }
    S.caravan.chase.log.push(entry);
    renderCaravanUI();
    showNotif(success ? "Drive success! " + zoneMsg : "Drive failed — " + zoneMsg, success ? "good" : "warn");
    if (success) {
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome(driverStat, Math.max(1, a.total - d.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Caravan chase control'
        });
      }
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome(driverStat, Math.max(1, d.total - a.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Caravan chase control'
        });
      }
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
  }

  function rollChaseEnemyAttack() {
    var dread = S.caravan.chase.enemyDread;
    var caravanDread = getCaravanDread();
    var a = explodingRoll(dread, { type: 'action', major: true, label: 'Enemy Attack d' + dread });
    var d = explodingRoll(caravanDread, { type: 'dread', major: true, label: 'Caravan Defense DD' + caravanDread });
    var hit = a.total > d.total;
    var damage = Math.max(1, a.total - d.total);
    var max = (CARAVAN_SIZES[S.caravan.size] || CARAVAN_SIZES.Small).stress;
    var entry = "R" + S.caravan.chase.round + ": Enemy d" + dread + "=" + a.total + " vs Caravan DD" + caravanDread + "=" + d.total + " \u2014 " + (hit ? "Hit! " + damage + " Stress" : "Defended!");
    S.caravan.chase.log.push(entry);
    if (hit) {
      S.caravan.stress = Math.min(max, S.caravan.stress + damage);
      if (damage > Math.floor(max / 2)) {
        S.caravan.chase.log.push("\u26A0 Heavy hit threshold exceeded! Roll d4 for damage complication.");
        showNotif("Heavy hit! Roll d4 for damage complication.", "warn");
      }
    }
    renderCaravanUI();
    if (!hit) { showNotif("Transporter held firm!", "good"); }
  }

  // ── HOLDING RENDER ─────────────────────────────────────────────────────────────
  function renderHoldingUI() {
    var panel = document.getElementById("tab-holding");
    if (!panel || !panel.dataset.mounted) { return; }
    if (!panel.querySelector("#holdingGate") || !panel.querySelector("#holdingBody")) {
      panel.innerHTML = buildHoldingHTML();
    }
    ensureNewFeatureState();
    var h = S.holding;
    var el;

    // Holding gate — locked if Renown < 9 and no quest active and no holding yet
    var gateEl = document.getElementById("holdingGate");
    var bodyEl = document.getElementById("holdingBody");
    var renown = getHoldingGateRenown();
    var q = S.holdingQuest || {};
    var questActive = q.active;
    var questDone = !!(q.step3Completed && !q.failed);
    var holdingEstablished = !!(h.established || questDone);
    if (gateEl) {
      if (!holdingEstablished) {
        var gateProgress = '';
        if (questActive) {
          var gateSteps = ['Gather Information', 'Go To Site', 'Establish Holding'];
          var gateLoc = '';
            var itemLabel = (typeof weaponLabelHtml === 'function')
              ? weaponLabelHtml(item, 18)
              : String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (q.infoHex && q.step <= 0) {
              + '<div style="word-wrap:break-word;overflow:hidden;text-overflow:ellipsis;">' + itemLabel + '</div>'
          }
          if (q.siteHex && q.step <= 1) {
            gateLoc += '<div style="font-size:.72rem;color:var(--red2);margin-top:.12rem;">⚔ Go To Site: Hex [' + (q.siteHex.col + 1) + ',' + (q.siteHex.row + 1) + ']</div>';
          }
          if (q.holdingHex && q.step >= 2) {
            gateLoc += '<div style="font-size:.72rem;color:var(--teal);margin-top:.12rem;">🏛 Proposed Holding: Hex [' + (q.holdingHex.col + 1) + ',' + (q.holdingHex.row + 1) + ']</div>';
          }
          gateProgress = '<div style="margin-top:.55rem;padding-top:.45rem;border-top:1px solid var(--border2);">'
            + '<div style="font-size:.72rem;color:var(--gold2);font-family:\'Cinzel\',serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.18rem;">Quest In Progress</div>'
            + '<div style="font-size:.78rem;color:var(--text2);">Current Step: <strong style="color:var(--teal);">' + (gateSteps[q.step] || 'Establish Holding') + '</strong></div>'
            + gateLoc
            + '</div>';
        }
        var gateMsg = '<div class="card" style="max-width:580px;margin-top:.6rem;border:1px solid rgba(201,162,39,.35);">'
          + '<div class="section-title" style="color:var(--gold2);">⚔ Holding Not Yet Established</div>'
          + '<div style="font-size:.85rem;color:var(--text2);line-height:1.6;margin-bottom:.6rem;">'
          + 'You must complete the <strong style="color:var(--gold);">Establishment Quest</strong> — including a successful <strong>Confrontation Stage</strong> — to unlock your Holding.'
          + '</div>'
          + '<div style="font-size:.78rem;color:var(--muted2);margin-bottom:.5rem;">'
          + (questActive
              ? '📋 Quest is <strong style="color:var(--teal);">in progress</strong>. Return to the <strong>Missions</strong> tab to continue.'
                : (renown >= 9
                  ? '✅ You have sufficient Renown. Start the quest from the <strong>Missions</strong> tab.'
                  : '🔒 Requires <strong style="color:var(--gold2);">Renown 9</strong> in any Faction Standing. Current highest: <strong style="color:var(--teal);">' + renown + '</strong>.'))
          + '</div>'
          + gateProgress
          + '</div>';
        gateEl.innerHTML = gateMsg;
        if (bodyEl) { bodyEl.style.display = "none"; }
        return;
      } else {
        gateEl.innerHTML = '';
        if (bodyEl) { bodyEl.style.display = ""; }
      }
    }

    el = document.getElementById("holdingRenownReadout");    if (el) { el.textContent = getHoldingGateRenown(); }
    el = document.getElementById("holdingCreditsReadout");   if (el) { el.textContent = (S.credits || 0) + " \u20B5"; }
    el = document.getElementById("holdingLandmarkCount");    if (el) { el.textContent = h.landmarks.length + h.extraLandmarks.length; }
    el = document.getElementById("holdingCrisisCount");      if (el) { el.textContent = h.crises.length; }

    var hn = document.getElementById("holdingName");
    if (hn) { hn.value = h.name || ""; }
    var ht = document.getElementById("holdingType");
    if (ht) { ht.value = h.type || "Citadel"; }

    // Landmarks
    var ll = document.getElementById("holdingLandmarks");
    if (ll) {
      var allLandmarks = h.landmarks.concat(h.extraLandmarks);
      var baseLen = h.landmarks.length;
      ll.innerHTML = allLandmarks.map(function(lm, i) {
        var isExtra = i >= baseLen;
        var typeColor = lm.type === "Temple" ? "var(--purple)" : lm.type === "Dwelling" ? "var(--green2)" : "var(--gold2)";
        return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.35rem .5rem;margin-bottom:.22rem;display:flex;justify-content:space-between;align-items:center;gap:.4rem;">'
          + '<div style="flex:1;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.58rem;letter-spacing:.08em;color:' + typeColor + ';text-transform:uppercase;">' + lm.type + (isExtra ? ' (Purchased)' : '') + '</div>'
          + '<input type="text" style="background:transparent;border:none;outline:none;color:var(--text);font-family:\'Crimson Pro\',serif;font-size:.85rem;width:100%;" value="' + (lm.name || "").replace(/"/g, "&quot;") + '" placeholder="Landmark name\u2026" onchange="updateLandmarkName(' + i + ',this.value)">'
          + '</div>'
          + '<div style="font-size:.7rem;color:var(--gold);white-space:nowrap;">+1d4\xD710\u20B5</div>'
          + (isExtra ? '<button class="btn btn-xs btn-red" onclick="removeExtraLandmark(' + (i - baseLen) + ')">✕</button>' : '')
          + '</div>';
      }).join("");
    }

    // Council
    var councilEl = document.getElementById("holdingCouncil");
    if (councilEl) {
      councilEl.innerHTML = COUNCIL_ROLES.map(function(role) {
        var mem = (h.council && h.council[role.key]) || {};
        var retainers = mem.retainers !== undefined ? mem.retainers : 3;
        var activeTasks = (h.councilTasks || []).filter(function(t) { return t.role === role.key && t.status === 'assigned'; }).length;
        var taskValue = mem.task || "";
        if (role.key === 'regent' && (h.crises || []).length) {
          taskValue = 'Resolve Active Crises (' + h.crises.length + ')';
        }
        return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.45rem .5rem;margin-bottom:.3rem;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.68rem;color:var(--gold2);margin-bottom:.15rem;">' + role.name + '</div>'
          + '<div style="font-size:.7rem;color:var(--muted3);margin-bottom:.28rem;">' + role.desc + '</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-bottom:.28rem;">'
          + '<div><span class="sub-label">Name</span><input type="text" style="width:100%;" value="' + (mem.name || "").replace(/"/g, "&quot;") + '" placeholder="Council member\u2026" onchange="updateCouncilMember(\'' + role.key + '\',\'name\',this.value)"></div>'
          + '<div><span class="sub-label">Retainers</span><div class="counter-row" style="padding:0;">'
          + '<button class="step-btn" onclick="adjustRetainers(\'' + role.key + '\',-1)">−</button>'
          + '<span style="font-family:\'Rajdhani\',sans-serif;font-size:.95rem;font-weight:700;min-width:1.5rem;text-align:center;color:var(--teal);" id="retainersVal-' + role.key + '">' + retainers + '</span>'
          + '<button class="step-btn" onclick="adjustRetainers(\'' + role.key + '\',1)">+</button>'
          + '</div></div>'
          + '</div>'
          + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.2rem;">Task Capacity: <span style="color:var(--gold2);">' + activeTasks + '/' + retainers + '</span></div>'
          + '<div style="margin-bottom:.28rem;"><span class="sub-label">Current Task</span><input type="text" style="width:100%;" value="' + taskValue.replace(/"/g, "&quot;") + '" placeholder="Assigned task\u2026" onchange="updateCouncilMember(\'' + role.key + '\',\'task\',this.value)"></div>'
          + '<div style="display:flex;align-items:center;gap:.4rem;">'
          + '<button class="btn btn-xs btn-teal" onclick="rollCouncilTask(\'' + role.key + '\')">⚄ Roll Task (Ad vs d6)</button>'
          + '<button class="btn btn-xs" onclick="hireRetainer(\'' + role.key + '\')">+ Retainer (200₵)</button>'
          + '<span id="councilResult-' + role.key + '" style="font-size:.76rem;color:var(--muted3);"></span>'
          + '</div>'
          + '</div>';
      }).join("");
    }

    var governanceEl = document.getElementById('holdingGovernancePanel');
    if (governanceEl) {
      var maxRenown = getHoldingGateRenown();
      var govUnlocked = maxRenown >= 12;
      var gov = getHoldingGovernanceState();
      syncHoldingGovernanceToWorldState();
      var lockHtml = govUnlocked
        ? ''
        : '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.45rem;">🔒 Unlocks at Renown 12. Current highest standing: <strong style="color:var(--gold2);">' + maxRenown + '</strong>.</div>';
      function btn(field, value, label, tone) {
        var active = (field === 'patrol' && gov.patrolStance === value)
          || (field === 'tariff' && gov.tariffStance === value)
          || (field === 'route' && gov.routePriority === value);
        var cls = active ? (tone || 'btn-primary') : 'btn';
        var disabled = govUnlocked ? '' : ' disabled style="opacity:.45;cursor:default;"';
        return '<button class="btn btn-xs ' + cls + '" onclick="setHoldingGovernancePolicy(\'' + field + '\',\'' + value + '\')"' + disabled + '>' + label + '</button>';
      }
      governanceEl.innerHTML = lockHtml
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.2rem;">Patrol Doctrine</div>'
        + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.35rem;">'
          + btn('patrol','strict','Strict Patrols','btn-warn')
          + btn('patrol','balanced','Balanced Patrols','btn-teal')
          + btn('patrol','open','Open Streets','btn-primary')
        + '</div>'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.2rem;">Tariff Stance</div>'
        + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.35rem;">'
          + btn('tariff','extractive','Extractive Tariffs','btn-red')
          + btn('tariff','balanced','Balanced Tariffs','btn-teal')
          + btn('tariff','relief','Relief Tariffs','btn-primary')
        + '</div>'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.2rem;">Route Priority</div>'
        + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.35rem;">'
          + btn('route','military','Military Routes','btn-red')
          + btn('route','trade','Trade Routes','btn-gold')
          + btn('route','civic','Civic Corridors','btn-teal')
        + '</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);line-height:1.5;">Current Policy: Patrol <strong>' + gov.patrolStance + '</strong> · Tariff <strong>' + gov.tariffStance + '</strong> · Route <strong>' + gov.routePriority + '</strong></div>';
    }

    var crucibleEl = document.getElementById('holdingCruciblePanel');
    if (crucibleEl) {
      crucibleEl.innerHTML = buildHoldingCruciblePanelHtml();
    }

    var bankEl = document.getElementById('holdingBankPanel');
    if (bankEl) {
      bankEl.innerHTML = buildHoldingBankPanelHtml();
    }

    renderHoldingCrises();

    // Holding Vault
    var vaultEl = document.getElementById("holdingVault");
    if (vaultEl) {
      if (!h.vault || h.vault.length === 0) {
        vaultEl.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">Vault is empty.</div>';
      } else {
        vaultEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:.4rem;">'
          + h.vault.map(function(item, i) {
            var itemLabel = (typeof weaponLabelHtml === 'function')
              ? weaponLabelHtml(item, 18)
              : String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.3rem;text-align:center;border-radius:3px;font-size:.75rem;color:var(--text2);cursor:pointer;" onclick="moveVaultItemToBackpack(' + i + ');">'
              + '<div style="word-wrap:break-word;overflow:hidden;text-overflow:ellipsis;">' + itemLabel + '</div>'
              + '<div style="font-size:.65rem;color:var(--muted);margin-top:.15rem;">Click → Backpack</div>'
              + '</div>';
          }).join('') + '</div>';
      }
    }

    // Holding Acquisition Quest
    var questEl = document.getElementById("holdingQuestStatus");
    if (questEl) {
      var qh = S.holdingQuest || {};
      if (qh.active) {
        var steps = ['Gather Information', 'Go To Site', 'Establish Holding'];
        var progressHtml = '';
        for (var si = 0; si < 3; si++) {
          var isDone = qh.step > si;
          var isCurrent = qh.step === si;
          progressHtml += '<div style="flex:1;text-align:center;padding:.3rem;background:' + (isDone ? 'var(--green2)' : isCurrent ? 'var(--teal)' : 'var(--surface)') + ';border:1px solid ' + (isDone ? 'rgba(46,196,182,.5)' : isCurrent ? 'var(--teal)' : 'var(--border2)') + ';border-radius:3px;">'
            + '<div style="font-size:.65rem;color:' + (isDone || isCurrent ? 'var(--text)' : 'var(--muted2)') + ';">' + steps[si] + '</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:.9rem;font-weight:700;color:' + (isDone || isCurrent ? 'var(--text)' : 'var(--muted)') + ';">Step ' + (si + 1) + '</div>'
            + '</div>';
        }

        var locHtml = '';
        if (qh.infoHex && qh.step <= 0) {
          locHtml += '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.12rem;">👁 Gather Information: Hex [' + (qh.infoHex.col + 1) + ',' + (qh.infoHex.row + 1) + ']</div>';
        }
        if (qh.siteHex && qh.step <= 1) {
          locHtml += '<div style="font-size:.72rem;color:var(--red2);margin-bottom:.12rem;">⚔ Go To Site: Hex [' + (qh.siteHex.col + 1) + ',' + (qh.siteHex.row + 1) + ']</div>';
        }
        if (qh.holdingHex && qh.step >= 2) {
          locHtml += '<div style="font-size:.72rem;color:var(--teal);margin-bottom:.12rem;">🏛 Proposed Holding: Hex [' + (qh.holdingHex.col + 1) + ',' + (qh.holdingHex.row + 1) + ']</div>';
        }

        questEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.3rem;margin-bottom:.4rem;">' + progressHtml + '</div>'
          + (locHtml ? '<div style="margin-bottom:.3rem;">' + locHtml + '</div>' : '')
          + '<button class="btn btn-sm btn-primary" onclick="advanceHoldingQuest();" style="width:100%;">⚄ Roll Current Step</button>';
      } else if (!(h.established || questDone)) {
        if (renown < 9) {
          questEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted2);">You need <strong style="color:var(--gold2);">Renown 9</strong> in any Faction Standing to establish a Holding. Current highest: ' + renown + '</div>';
        } else {
          questEl.innerHTML = '<div style="display:flex;gap:.3rem;align-items:center;">'
            + '<div style="flex:1;font-size:.75rem;color:var(--text2);">You are ready to establish your own Holding!' + (qh.failed ? ' Previous attempt failed — you can retry.' : '') + '</div>'
            + '<button class="btn btn-sm btn-teal" onclick="startHoldingQuest();">Begin Quest →</button>'
            + '</div>';
        }
      } else {
        questEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted2);">Holding established: <strong style="color:var(--gold)">' + h.name + '</strong></div>';
      }
    }

    var homeEl = document.getElementById("wayfarerHomePanel");
    if (homeEl) {
      var home = h.wayfarerHome || {};
      var levels = [
        { key: "decorLevel", name: "Decor", desc: "Adds social prestige and narrative flair." },
        { key: "securityLevel", name: "Security", desc: "Improves defensive readiness and crisis resilience." },
        { key: "workshopLevel", name: "Workshop", desc: "Improves technical salvage and mission support." },
        { key: "marketLevel", name: "Market", desc: "Improves mission and district economy payouts." }
      ];
      homeEl.innerHTML = levels.map(function (entry) {
        var lvl = Number(home[entry.key] || 0);
        var nextCost = getWayfarerHomeUpgradeCost(entry.key, lvl);
        var cap = lvl >= 3;
        return '<div style="border:1px solid var(--border2);background:var(--surface);padding:.38rem .45rem;margin-bottom:.3rem;">'
          + '<div style="font-family:\'Cinzel\',serif;font-size:.6rem;letter-spacing:.08em;color:var(--gold2);text-transform:uppercase;">' + entry.name + ' Lv.' + lvl + '</div>'
          + '<div style="font-size:.74rem;color:var(--muted3);margin:.15rem 0 .25rem 0;line-height:1.45;">' + entry.desc + '</div>'
          + '<button class="btn btn-xs ' + (cap ? '' : 'btn-teal') + '" ' + (cap ? 'disabled' : ('onclick="buyWayfarerHomeUpgrade(\'' + entry.key + '\')"')) + '>' + (cap ? 'Max Level' : ('Upgrade (' + nextCost + '₵)')) + '</button>'
          + '</div>';
      }).join('')
      + '<div style="margin-top:.35rem;padding-top:.35rem;border-top:1px solid var(--border);">'
      + '<div style="font-size:.7rem;color:var(--muted2);margin-bottom:.22rem;">Decor Theme</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'
      + '<button class="btn btn-xs" onclick="setWayfarerHomeDecorTheme(\'Frontier\')">Frontier</button>'
      + '<button class="btn btn-xs" onclick="setWayfarerHomeDecorTheme(\'Noir\')">Noir</button>'
      + '<button class="btn btn-xs" onclick="setWayfarerHomeDecorTheme(\'Neon\')">Neon</button>'
      + '<button class="btn btn-xs" onclick="setWayfarerHomeDecorTheme(\'Industrial\')">Industrial</button>'
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-top:.25rem;">Current Theme: ' + (home.decorTheme || 'Frontier') + '</div>'
      + '</div>';
    }
  }

  function getWayfarerHomeUpgradeCost(key, level) {
    var base = {
      decorLevel: 350,
      securityLevel: 500,
      workshopLevel: 450,
      marketLevel: 600
    };
    var start = base[key] || 400;
    return start + (Number(level || 0) * 250);
  }

  function getCrucibleStatDie(key, fallback) {
    if (typeof getEffectiveDie === 'function') {
      try {
        return Math.max(4, Number(getEffectiveDie(String(key || '')) || fallback || 6));
      } catch (_err) {}
    }
    return Math.max(4, Number((S && S.stats && S.stats[key]) || fallback || 6));
  }

  var CRUCIBLE_MODE_SPECS = {
    control: {
      id: 'control',
      label: 'Control',
      objective: 'Three zones (A/B/C). Holding zones gives 1 point each round; kills give 1 point. First to 20 wins.',
      scoreToWin: 20,
      killPoints: 1,
      zonePoints: 1
    },
    clash: {
      id: 'clash',
      label: 'Clash',
      objective: 'Team deathmatch. First to 25 kills wins.',
      scoreToWin: 25,
      killPoints: 1,
      zonePoints: 0
    },
    elimination: {
      id: 'elimination',
      label: 'Elimination',
      objective: '3v3, no respawns. First to 5 rounds wins.',
      scoreToWin: 5,
      killPoints: 1,
      zonePoints: 0
    },
    rumble: {
      id: 'rumble',
      label: 'Rumble',
      objective: 'Free-for-all inspired brawl pacing. First side to 15 kills wins in this simulation.',
      scoreToWin: 15,
      killPoints: 1,
      zonePoints: 0,
      playerKillBonus: 1
    }
  };

  function getCrucibleModeSpec(mode) {
    var key = String(mode || '').toLowerCase();
    return CRUCIBLE_MODE_SPECS[key] || CRUCIBLE_MODE_SPECS.control;
  }

  function getHoldingPreferredCrucibleMode() {
    ensureNewFeatureState();
    var preferred = S && S.holding && S.holding.crucible ? S.holding.crucible.preferredMode : 'control';
    return getCrucibleModeSpec(preferred).id;
  }

  function buildCrucibleTacticalLayout(mode, seedRound) {
    var spec = getCrucibleModeSpec(mode);
    var rollSeed = Math.max(1, Number(seedRound || 1));
    var centerLane = (rollSeed % 2 === 0) ? 'Close' : 'Nearby';
    var highGroundLane = (rollSeed % 3 === 0) ? 'Far' : 'Nearby';
    var flankA = (rollSeed % 2 === 0) ? 'Engaged' : 'Far';
    var flankB = flankA === 'Engaged' ? 'Far' : 'Engaged';
    var lootLane = (rollSeed % 4 === 0) ? 'Engaged' : 'Close';
    var ammoLane = (rollSeed % 5 === 0) ? 'Far' : 'Nearby';
    var puzzleLane = (rollSeed % 3 === 0) ? 'Close' : 'Far';
    return {
      footprint: '60x60 ft',
      lanes: {
        short: 'Engaged',
        mid: 'Close',
        long: 'Nearby',
        deep: 'Far'
      },
      controlZones: {
        A: 'Engaged',
        B: centerLane,
        C: 'Far'
      },
      centerZone: centerLane,
      highGround: highGroundLane,
      flanks: [flankA, flankB],
      coverByRange: {
        Engaged: 1,
        Close: 2,
        Nearby: 2,
        Far: 1
      },
      pickups: {
        loot: { lane: lootLane, available: true, type: 'loot' },
        ammo: { lane: ammoLane, available: true, type: 'power-ammo' },
        puzzle: { lane: puzzleLane, available: true, type: 'puzzle' }
      },
      brief: spec.label + ': lanes short/mid/long + vertical platforms, cover objects, and power-ammo spawns.'
    };
  }

  function getCrucibleSpecialForUnit(unit) {
    if (!unit) return { name: 'Pressure Strike', saveStat: 'defend', effects: {} };
    var role = String(unit.role || '').toLowerCase();
    if (role === 'sniper') return { name: 'Suppressive Beam', saveStat: 'control', effects: { actionDrain: 1, condition: 'distracted' } };
    if (role === 'support') return { name: 'Null Hymn', saveStat: 'spirit', effects: { suppressFlavorRounds: 1, mentalStress: 1 } };
    if (role === 'tank') return { name: 'Shock Ram', saveStat: 'body', effects: { condition: 'shaken' } };
    if (role === 'assault') return { name: 'Hemorrhage Dash', saveStat: 'defend', effects: { condition: 'vulnerable' } };
    if (role === 'player') return { name: 'Wayfarer Gambit', saveStat: 'lead', effects: { actionDrain: 1 } };
    return { name: 'Pressure Strike', saveStat: 'defend', effects: {} };
  }

  function applyCrucibleSpecialEffectsToPlayer(special, log) {
    if (!special || !special.effects || !S) return [];
    var effects = special.effects;
    var applied = [];
    if (effects.condition && S.conditions && Object.prototype.hasOwnProperty.call(S.conditions, String(effects.condition))) {
      S.conditions[String(effects.condition)] = true;
      if (typeof updateConditionButtons === 'function') updateConditionButtons();
      if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
      applied.push('Condition ' + String(effects.condition));
    }
    if (Number(effects.mentalStress || 0) > 0) {
      var ms = Math.max(1, Number(effects.mentalStress || 0));
      if (typeof changeMentalStress === 'function') changeMentalStress(ms);
      else S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + ms);
      applied.push('Mental Stress +' + ms);
    }
    if (Number(effects.radiation || 0) > 0) {
      var rad = Math.max(1, Number(effects.radiation || 0));
      if (typeof changeRads === 'function') changeRads(rad);
      else S.rads = Math.max(0, Number(S.rads || 0) + rad);
      applied.push('Radiation +' + rad);
    }
    if (Number(effects.actionDrain || 0) > 0) {
      var drain = Math.max(1, Number(effects.actionDrain || 0));
      if (!S.combat || typeof S.combat !== 'object') S.combat = {};
      S.combat.actionsLeft = Math.max(0, Number(S.combat.actionsLeft || 0) - drain);
      if (typeof updateCombatUI === 'function') updateCombatUI();
      applied.push('Actions -' + drain);
    }
    if (Number(effects.suppressFlavorRounds || 0) > 0) {
      var rounds = Math.max(1, Number(effects.suppressFlavorRounds || 0));
      if (!S.combat || typeof S.combat !== 'object') S.combat = {};
      S.combat.personalFlavorSuppressedRounds = Math.max(Number(S.combat.personalFlavorSuppressedRounds || 0), rounds);
      applied.push('Personal Flavor suppressed');
    }
    if (applied.length && log) log.push('Special effects on Wayfarer: ' + applied.join(', ') + '.');
    return applied;
  }

  function resolveCrucibleMapPickup(match, unit, log) {
    if (!match || !unit || !match.tacticalLayout || !match.tacticalLayout.pickups) return false;
    var pickups = match.tacticalLayout.pickups;
    var lane = String(unit.range || 'Close');
    var hit = false;
    Object.keys(pickups).forEach(function (key) {
      var node = pickups[key];
      if (!node || !node.available || String(node.lane || '') !== lane) return;
      node.available = false;
      hit = true;
      if (node.type === 'loot') {
        unit.attackDie = Math.max(4, Number(unit.attackDie || 6) + 2);
        log.push(unit.name + ' looted a weapon cache (+2 attack die).');
      } else if (node.type === 'power-ammo') {
        unit.powerAmmoBonus = Math.max(0, Number(unit.powerAmmoBonus || 0) + 2);
        log.push(unit.name + ' grabbed power ammo (+2 damage on next hit).');
      } else if (node.type === 'puzzle') {
        unit.defendBuff = Math.max(0, Number(unit.defendBuff || 0) + 2);
        if (unit.isPlayer && S.conditions && !S.conditions.focused) {
          S.conditions.focused = true;
          if (typeof updateConditionButtons === 'function') updateConditionButtons();
        }
        log.push(unit.name + ' solved a tactical puzzle (+2 defend, Focused if player).');
      }
    });
    return hit;
  }

  function buildCrucibleUnit(name, side, role, idx, hexPosition) {
    var safeRole = String(role || 'assault').toLowerCase();
    var baseAttack = safeRole === 'sniper' ? 10 : (safeRole === 'support' ? 8 : 8);
    var baseDefend = safeRole === 'tank' ? 10 : 8;
    var hp = safeRole === 'tank' ? 8 : 6;
    return {
      id: String(side) + '-' + String(idx + 1) + '-' + String(Date.now()),
      name: String(name || 'Unit'),
      side: String(side || 'ally'),
      role: safeRole,
      position: hexPosition || { q: 0, r: 0 },
      hp: hp,
      maxHp: hp,
      attackDie: baseAttack,
      defendDie: baseDefend,
      ap: 2,
      isPlayer: false,
      personalFlavor: null,
      conditions: {},
      equipment: { weapon: null, armor: null }
    };
  }

  function createHoldingCrucibleMatch() {
    ensureNewFeatureState();
    var crucible = S.holding.crucible;
    var modeSpec = getCrucibleModeSpec(crucible.preferredMode || 'control');
    var squadSize = modeSpec.id === 'elimination' ? 3 : 6;
    var playerName = String((S && S.name) || 'Wayfarer');

    // Generate hex map
    var hexMap = (typeof generateCrucibleHexMap === 'function')
      ? generateCrucibleHexMap(Date.now(), 9)
      : { seed: 1, size: 9, hexes: {}, objectives: [], spawns: { ally: { q: -1, r: -1 }, enemy: { q: 1, r: 1 } } };

    // Generate environmental interactables and stamp them onto the map
    var _interactablesSeed = Date.now() + 1;
    var _interactables = (typeof generateCombatInteractables === 'function')
      ? generateCombatInteractables(_interactablesSeed, 9, 2 + (Math.random() < 0.5 ? 1 : 0))
      : [];
    if (typeof installInteractablesOnMap === 'function') installInteractablesOnMap(hexMap, _interactables);

    // Place units in spawn zones with staggered positions
    var allySpawn = hexMap.spawns && hexMap.spawns.ally || { q: -1, r: -1 };
    var enemySpawn = hexMap.spawns && hexMap.spawns.enemy || { q: 1, r: 1 };

    var allyOffsets = [
      { q: 0, r: 0 }, { q: -1, r: 0 }, { q: 1, r: -1 },
      { q: -1, r: 1 }, { q: 0, r: 1 }, { q: -1, r: -1 }
    ];
    var enemyOffsets = [
      { q: 0, r: 0 }, { q: 1, r: 0 }, { q: -1, r: 1 },
      { q: 1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: 1 }
    ];

    var allies = [];
    allies.push({
      id: 'ally-player-' + String(Date.now()),
      name: playerName,
      side: 'ally',
      role: 'player',
      position: { q: allySpawn.q + allyOffsets[0].q, r: allySpawn.r + allyOffsets[0].r },
      hp: Math.max(8, Number((S && S.health) || 12)),
      maxHp: Math.max(8, Number((S && S.health) || 12)),
      attackDie: Math.max(getCrucibleStatDie('strike', 8), getCrucibleStatDie('shoot', 8)),
      defendDie: getCrucibleStatDie('defend', 8),
      ap: 2,
      isPlayer: true,
      personalFlavor: null,
      conditions: {},
      equipment: { weapon: null, armor: null }
    });

    var enemyNames = ['Vanguard Sel', 'Scout Arix', 'Binder Kori', 'Ravager Nyx', 'Sentry Vale'];
    var allRoles = ['tank', 'sniper', 'support', 'assault', 'tank'];

    for (var i = 1; i < squadSize; i++) {
      var allyHex = { q: allySpawn.q + allyOffsets[i].q, r: allySpawn.r + allyOffsets[i].r };
      var unit = buildCrucibleUnit(enemyNames[i - 1], 'ally', allRoles[i - 1], i, allyHex);
      if (typeof assignRandomPersonalFlavor === 'function') assignRandomPersonalFlavor(unit);
      allies.push(unit);
    }

    var enemies = [];
    var redNames = ['Red Team Captain', 'Red Team Lancer', 'Red Team Marksman', 'Red Team Warden', 'Red Team Hexer', 'Red Team Stalker'];
    var redRoles = ['tank', 'assault', 'sniper', 'tank', 'support', 'assault'];

    for (var j = 0; j < squadSize; j++) {
      var enemyHex = { q: enemySpawn.q + enemyOffsets[j].q, r: enemySpawn.r + enemyOffsets[j].r };
      var enemy = buildCrucibleUnit(redNames[j], 'enemy', redRoles[j], j, enemyHex);
      if (typeof assignRandomPersonalFlavor === 'function') assignRandomPersonalFlavor(enemy);
      enemies.push(enemy);
    }

    resetCrucibleTeamForTurn(allies);
    enemies.forEach(function (u) {
      if (!u) return;
      u.ap = 0;
    });

    crucible.match = {
      active: true,
      mode: modeSpec.id,
      round: 1,
      turnSide: 'ally',
      allies: allies,
      enemies: enemies,
      selectedAllyId: allies[0] ? allies[0].id : '',
      selectedEnemyId: enemies[0] ? enemies[0].id : '',
      selectedTargetId: enemies[0] ? enemies[0].id : '',
      selectedAllyTargetId: allies[0] ? allies[0].id : '',
      score: { ally: 0, enemy: 0 },
      hexMap: hexMap,
      interactables: _interactables,
      roundWins: { ally: 0, enemy: 0 },
      log: ['Crucible match opened: 6v6 hex tactical simulation (' + modeSpec.label + '). Allies spawned at [' + allySpawn.q + ',' + allySpawn.r + '].'],
      startedAt: Date.now(),
      finishedAt: 0,
      winner: ''
    };
    return crucible.match;
  }

  function getHoldingCrucibleMatch() {
    ensureNewFeatureState();
    var c = S.holding.crucible;
    return c && c.match && c.match.active ? c.match : null;
  }

  function getLivingTeamUnits(units) {
    return (Array.isArray(units) ? units : []).filter(function (u) { return u && Number(u.hp || 0) > 0; });
  }

  function getCrucibleRangeOrder() {
    return ['Engaged', 'Close', 'Nearby', 'Far'];
  }

  function normalizeCrucibleRange(value) {
    var wanted = String(value || '').toLowerCase();
    var order = getCrucibleRangeOrder();
    for (var i = 0; i < order.length; i++) {
      if (String(order[i]).toLowerCase() === wanted) return order[i];
    }
    return 'Close';
  }

  function getCrucibleRangeIndex(value) {
    var normalized = normalizeCrucibleRange(value);
    var order = getCrucibleRangeOrder();
    var idx = order.indexOf(normalized);
    return idx >= 0 ? idx : 1;
  }

  function canCrucibleUnitAttack(attacker, defender) {
    if (!attacker || !defender || !attacker.position || !defender.position) return false;
    if (typeof canUnitReach === 'function') return canUnitReach(attacker, defender);
    if (typeof getUnitDistance === 'function') {
      var dist = Number(getUnitDistance(attacker, defender) || 0);
      return dist > 0 && dist <= 2;
    }
    return false;
  }

  function canCrucibleUnitCastActionOnTarget(attacker, defender, kind) {
    if (!attacker || !defender || !attacker.position || !defender.position) return false;
    var actionKind = String(kind || 'spell').toLowerCase();
    if (typeof getUnitDistance !== 'function') return canCrucibleUnitAttack(attacker, defender);
    var dist = Number(getUnitDistance(attacker, defender) || 99);
    if (!Number.isFinite(dist) || dist <= 0) return false;
    if (actionKind === 'hack') return dist <= 2;
    return dist <= 3;
  }

  function resolveCrucibleSpellHackAction(actor, target, kind, match, logs, manualTotals) {
    if (!actor || !target || !match) return false;
    var actionKind = String(kind || 'spell').toLowerCase();
    var actionDie = actionKind === 'hack' ? getCrucibleStatDie('control', 8) : getCrucibleStatDie('spirit', 8);
    var dreadDie = Math.max(4, Number(target.attackDie || target.defendDie || 8));
    var actionTotal = 0;
    var dreadTotal = 0;

    if (manualTotals && Number.isFinite(manualTotals.action) && Number.isFinite(manualTotals.dread)) {
      actionTotal = Math.max(1, Number(manualTotals.action));
      dreadTotal = Math.max(1, Number(manualTotals.dread));
    } else {
      var actionRoll = (typeof explodingRoll === 'function') ? explodingRoll(actionDie, { type: 'action', major: true, label: 'Crucible ' + actionKind.toUpperCase() + ' d' + actionDie }) : { total: (Math.floor(Math.random() * actionDie) + 1) };
      var dreadRoll = (typeof explodingRoll === 'function') ? explodingRoll(dreadDie, { type: 'dread', major: true, label: 'Crucible Defense DD' + dreadDie }) : { total: (Math.floor(Math.random() * dreadDie) + 1) };
      actionTotal = Math.max(1, Number(actionRoll.total || 1));
      dreadTotal = Math.max(1, Number(dreadRoll.total || 1));
    }

    var success = actionTotal >= dreadTotal;
    var margin = Math.max(1, Math.abs(actionTotal - dreadTotal));
    if (success) {
      var dmg = Math.max(1, margin + (actionKind === 'spell' ? 1 : 0));
      target.hp = Math.max(0, Number(target.hp || 0) - dmg);
      logs.push(actor.name + ' ' + (actionKind === 'hack' ? 'hacked' : 'cast a spell on') + ' ' + target.name + ': ' + actionTotal + ' vs ' + dreadTotal + ' for ' + dmg + ' dmg.');
      if (target.hp <= 0) {
        logs.push('☠ ' + target.name + ' is down.');
        var mode = getCrucibleModeSpec(match.mode);
        awardCruciblePoints(match, String(actor.side || 'ally'), Number(mode.killPoints || 1), 'Takedown');
      }
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('spell', margin, {
          actionTotal: actionTotal,
          dreadTotal: dreadTotal,
          context: (actionKind === 'hack' ? 'Hack' : 'Spell') + ' vs ' + target.name + ' (Crucible)'
        });
      }
      if (typeof addSuccessRoll === 'function') addSuccessRoll();
    } else {
      logs.push(actor.name + ' ' + (actionKind === 'hack' ? 'hack attempt' : 'spell') + ' failed against ' + target.name + ': ' + actionTotal + ' vs ' + dreadTotal + '.');
      if (typeof addTMWOnFail === 'function') addTMWOnFail('crucible-' + actionKind + '-fail', { skipPrompt: true });
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome('spell', margin, {
          actionTotal: actionTotal,
          dreadTotal: dreadTotal,
          context: (actionKind === 'hack' ? 'Hack' : 'Spell') + ' vs ' + target.name + ' (Crucible)'
        });
      }
    }
    return true;
  }

  function openCrucibleManualSpellHackPrompt(actor, target, kind) {
    if (typeof openModal !== 'function') return false;
    ensureNewFeatureState();
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    S.holding.crucible.manualActionPending = {
      actorId: String(actor && actor.id || ''),
      targetId: String(target && target.id || ''),
      kind: String(kind || 'spell').toLowerCase()
    };
    var pendingKind = String(kind || 'spell').toLowerCase();
    var actionDie = pendingKind === 'hack' ? getCrucibleStatDie('control', 8) : getCrucibleStatDie('spirit', 8);
    var dreadDie = Math.max(4, Number(target && (target.attackDie || target.defendDie || 8)));
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.5;">'
      + '<div style="margin-bottom:.2rem;">Manual ' + (pendingKind === 'hack' ? 'Hack' : 'Spell') + ': enter Action and Dread roll totals.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:.3rem;">'
      + '<label style="font-size:.7rem;color:var(--muted2);">Action d' + actionDie + '<input id="crucibleManualAction" type="number" min="1" max="99" style="width:100%;margin-top:.08rem;"></label>'
      + '<label style="font-size:.7rem;color:var(--muted2);">Dread d' + dreadDie + '<input id="crucibleManualDread" type="number" min="1" max="99" style="width:100%;margin-top:.08rem;"></label>'
      + '</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:.3rem;margin-top:.26rem;">'
      + '<button class="btn btn-sm" onclick="cancelCrucibleManualActionRoll()">Cancel</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveCrucibleManualActionRoll()">Resolve</button>'
      + '</div>'
      + '</div>';
    openModal('Manual ' + (pendingKind === 'hack' ? 'Hack' : 'Spell') + ' Roll', html);
    return true;
  }

  window.cancelCrucibleManualActionRoll = function () {
    ensureNewFeatureState();
    if (S && S.holding && S.holding.crucible) S.holding.crucible.manualActionPending = null;
    if (typeof closeModal === 'function') closeModal();
    return true;
  };

  window.resolveCrucibleManualActionRoll = function () {
    ensureNewFeatureState();
    var match = getHoldingCrucibleMatch();
    var pending = S && S.holding && S.holding.crucible ? S.holding.crucible.manualActionPending : null;
    if (!match || !pending) {
      if (typeof showNotif === 'function') showNotif('No pending manual action.', 'warn');
      return false;
    }
    var actionInput = document.getElementById('crucibleManualAction');
    var dreadInput = document.getElementById('crucibleManualDread');
    var actionValue = Number(actionInput && actionInput.value);
    var dreadValue = Number(dreadInput && dreadInput.value);
    if (!Number.isFinite(actionValue) || !Number.isFinite(dreadValue)) {
      if (typeof showNotif === 'function') showNotif('Enter valid action and dread totals first.', 'warn');
      return false;
    }
    var actor = findCrucibleUnit(match, 'ally', pending.actorId);
    var target = findCrucibleUnit(match, 'enemy', pending.targetId);
    if (!actor || !target || Number(actor.hp || 0) <= 0 || Number(target.hp || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif('Actor or target is no longer valid.', 'warn');
      return false;
    }
    if (!spendCrucibleUnitAp(actor, 1)) {
      if (typeof showNotif === 'function') showNotif(actor.name + ' has no AP left.', 'warn');
      return false;
    }
    var logs = [];
    resolveCrucibleSpellHackAction(actor, target, pending.kind, match, logs, {
      action: actionValue,
      dread: dreadValue
    });
    match.log = (match.log || []).concat(logs).slice(-120);
    S.holding.crucible.manualActionPending = null;
    if (typeof closeModal === 'function') closeModal();
    maybeSyncCrucibleSelection(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  };

  function findCrucibleUnit(match, side, id) {
    if (!match || !id) return null;
    var pool = String(side || '') === 'enemy' ? match.enemies : match.allies;
    for (var i = 0; i < (pool || []).length; i++) {
      if (String(pool[i] && pool[i].id || '') === String(id)) return pool[i];
    }
    return null;
  }

  function getSelectedCrucibleAlly(match) {
    var ally = match ? findCrucibleUnit(match, 'ally', match.selectedAllyId) : null;
    if (ally && Number(ally.hp || 0) > 0) return ally;
    var livingAllies = getLivingTeamUnits(match && match.allies);
    return livingAllies.length ? livingAllies[0] : null;
  }

  function getSelectedCrucibleTarget(match) {
    var target = match ? findCrucibleUnit(match, 'enemy', match.selectedTargetId) : null;
    if (target && Number(target.hp || 0) > 0) return target;
    var livingEnemies = getLivingTeamUnits(match && match.enemies);
    return livingEnemies.length ? livingEnemies[0] : null;
  }

  function getSelectedCrucibleEnemy(match) {
    var enemy = match ? findCrucibleUnit(match, 'enemy', match.selectedEnemyId) : null;
    if (enemy && Number(enemy.hp || 0) > 0) return enemy;
    var livingEnemies = getLivingTeamUnits(match && match.enemies);
    return livingEnemies.length ? livingEnemies[0] : null;
  }

  function getSelectedCrucibleAllyTarget(match) {
    var ally = match ? findCrucibleUnit(match, 'ally', match.selectedAllyTargetId) : null;
    if (ally && Number(ally.hp || 0) > 0) return ally;
    var livingAllies = getLivingTeamUnits(match && match.allies);
    return livingAllies.length ? livingAllies[0] : null;
  }

  function getSelectedCrucibleActiveUnit(match) {
    return String(match && match.turnSide || 'ally') === 'enemy'
      ? getSelectedCrucibleEnemy(match)
      : getSelectedCrucibleAlly(match);
  }

  function resetCrucibleTeamForTurn(units) {
    (units || []).forEach(function (u) {
      if (!u) return;
      u.ap = Number(u.hp || 0) > 0 ? 2 : 0;
      u.defendBuff = 0;
    });
  }

  function maybeSyncCrucibleSelection(match) {
    if (!match) return;
    var ally = getSelectedCrucibleAlly(match);
    var enemy = getSelectedCrucibleEnemy(match);
    var target = getSelectedCrucibleTarget(match);
    var allyTarget = getSelectedCrucibleAllyTarget(match);
    match.selectedAllyId = ally ? ally.id : '';
    match.selectedEnemyId = enemy ? enemy.id : '';
    match.selectedTargetId = target ? target.id : '';
    match.selectedAllyTargetId = allyTarget ? allyTarget.id : '';
  }

  function spendCrucibleUnitAp(unit, amount) {
    if (!unit) return false;
    var cost = Math.max(0, Number(amount || 0));
    if (Number(unit.ap || 0) < cost) return false;
    unit.ap = Math.max(0, Number(unit.ap || 0) - cost);
    return true;
  }

  function awardCruciblePoints(match, side, points, reason) {
    if (!match || !match.score || (side !== 'ally' && side !== 'enemy')) return;
    var gain = Math.max(0, Number(points || 0));
    if (!gain) return;
    match.score[side] = Math.max(0, Number(match.score[side] || 0) + gain);
    if (reason) {
      var label = side === 'ally' ? 'Blue Team' : 'Red Team';
      match.log = (match.log || []).concat([label + ' +' + gain + ' score (' + reason + ').']).slice(-120);
    }
  }

  function evaluateCrucibleControlLane(match) {
    if (!match || !match.active) return;
    var mode = getCrucibleModeSpec(match.mode);
    if (mode.id !== 'control') return;
    var zones = (match.tacticalLayout && match.tacticalLayout.controlZones) || { A: 'Engaged', B: 'Close', C: 'Far' };
    Object.keys(zones).forEach(function (zoneKey) {
      var lane = String(zones[zoneKey] || 'Close');
      var allyOnLane = getLivingTeamUnits(match.allies).filter(function (u) { return String(u.range || '') === lane; }).length;
      var enemyOnLane = getLivingTeamUnits(match.enemies).filter(function (u) { return String(u.range || '') === lane; }).length;
      if (allyOnLane > enemyOnLane) {
        awardCruciblePoints(match, 'ally', mode.zonePoints, 'Zone ' + zoneKey + ' secured');
      } else if (enemyOnLane > allyOnLane) {
        awardCruciblePoints(match, 'enemy', mode.zonePoints, 'Zone ' + zoneKey + ' secured');
      }
    });
  }

  function determineCrucibleWinner(match) {
    if (!match || !match.active) return '';
    var mode = getCrucibleModeSpec(match.mode);
    var alliesAlive = getLivingTeamUnits(match.allies).length;
    var enemiesAlive = getLivingTeamUnits(match.enemies).length;
    if (alliesAlive <= 0 && enemiesAlive <= 0) return 'enemies';
    if (mode.id === 'elimination') {
      if (enemiesAlive <= 0) {
        match.roundWins = match.roundWins || { ally: 0, enemy: 0 };
        match.roundWins.ally = Math.max(0, Number(match.roundWins.ally || 0) + 1);
        if (match.roundWins.ally >= Number(mode.scoreToWin || 5)) return 'allies';
        return '';
      }
      if (alliesAlive <= 0) {
        match.roundWins = match.roundWins || { ally: 0, enemy: 0 };
        match.roundWins.enemy = Math.max(0, Number(match.roundWins.enemy || 0) + 1);
        if (match.roundWins.enemy >= Number(mode.scoreToWin || 5)) return 'enemies';
        return '';
      }
    } else {
      if (enemiesAlive <= 0) return 'allies';
      if (alliesAlive <= 0) return 'enemies';
    }
    var allyScore = Math.max(0, Number(match.score && match.score.ally || 0));
    var enemyScore = Math.max(0, Number(match.score && match.score.enemy || 0));
    if (allyScore >= Number(mode.scoreToWin || 0)) return 'allies';
    if (enemyScore >= Number(mode.scoreToWin || 0)) return 'enemies';
    return '';
  }

  function getRandomTeamTarget(units) {
    var living = getLivingTeamUnits(units);
    if (!living.length) return null;
    return living[Math.floor(Math.random() * living.length)] || null;
  }

  function runCrucibleAttack(attacker, defender, log, match) {
    if (!attacker || !defender || Number(attacker.hp || 0) <= 0 || Number(defender.hp || 0) <= 0) return false;
    var defenderHpBefore = Math.max(0, Number(defender.hp || 0));
    var hit = (typeof executeAttackAction === 'function')
      ? executeAttackAction(attacker, defender, match && match.hexMap, log)
      : false;
    var damage = Math.max(0, defenderHpBefore - Math.max(0, Number(defender.hp || 0)));
    if (!hit && typeof executeAttackAction !== 'function') return false;
    if (damage > 0) {
      var lastIndex = Array.isArray(log) ? (log.length - 1) : -1;
      if (lastIndex >= 0) {
        log[lastIndex] = String(log[lastIndex] || '').replace(' attacked ', ' hit ').replace(' damage.', ' dmg.');
      }
      if (defender.hp <= 0) {
        if (log) log.push('☠ ' + defender.name + ' is down.');
        var mode = getCrucibleModeSpec(match && match.mode);
        var bonus = (mode.id === 'rumble' && attacker.isPlayer) ? Number(mode.playerKillBonus || 0) : 0;
        awardCruciblePoints(match, String(attacker.side || 'ally'), Number(mode.killPoints || 1) + bonus, 'Takedown');
      }
    } else if (log && log.length) {
      var noDamageIndex = log.length - 1;
      log[noDamageIndex] = String(log[noDamageIndex] || '').replace(' attacked but ', ' attacked ').replace(' defended.', ' but dealt no damage.');
    }
    return damage > 0;
  }

  function beginCrucibleEnemyTurn(match) {
    if (!match || !match.active || String(match.turnSide || 'ally') === 'enemy') return false;
    resetCrucibleTeamForTurn(match.enemies);
    match.turnSide = 'enemy';
    maybeSyncCrucibleSelection(match);
    match.log = (match.log || []).concat(['Enemy phase begins. Command Red Team or hand it to Enemy AI.']).slice(-120);
    return true;
  }

  function finishCrucibleEnemyTurn(match, logs, fallbackLine) {
    if (!match || !match.active) return false;
    var entries = Array.isArray(logs) ? logs.filter(Boolean) : [];
    evaluateCrucibleControlLane(match);
    if (!entries.length && fallbackLine) entries.push(fallbackLine);
    if (entries.length) match.log = (match.log || []).concat(entries).slice(-120);
    (match.enemies || []).forEach(function (unit) {
      if (!unit) return;
      unit.ap = 0;
    });
    match.round = Math.max(1, Number(match.round || 1) + 1);
    if (typeof processInteractableRoundStart === 'function' && Array.isArray(match.interactables)) {
      processInteractableRoundStart(match.interactables, match.allies.concat(match.enemies), match.hexMap, match.log);
    }
    resetCrucibleTeamForTurn(match.allies);
    match.turnSide = 'ally';
    maybeSyncCrucibleSelection(match);
    return true;
  }

  function runCrucibleEnemyTurn(match) {
    if (!match || !match.active) return false;
    if (String(match.turnSide || 'ally') !== 'enemy') beginCrucibleEnemyTurn(match);
    var logs = [];
    var enemies = getLivingTeamUnits(match.enemies);
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      while (Number(enemy.ap || 0) > 0) {
        var allyTarget = getRandomTeamTarget(match.allies);
        if (!allyTarget) break;
        var special = getCrucibleSpecialForUnit(enemy);
        var useSpecial = Number(enemy.ap || 0) > 0 && Math.random() < 0.35;
        if (useSpecial && canCrucibleUnitAttack(enemy, allyTarget)) {
          spendCrucibleUnitAp(enemy, 1);
          var saveDie = Math.max(4, Number((typeof getEffectiveDie === 'function' && allyTarget.isPlayer)
            ? getEffectiveDie(String(special.saveStat || 'defend'))
            : (special.saveStat === 'body' ? 8 : 6)));
          var enemyRoll = (typeof explodingRoll === 'function') ? explodingRoll(Math.max(4, Number(enemy.attackDie || enemy.dread || 6))) : { total: (Math.floor(Math.random() * Math.max(4, Number(enemy.attackDie || enemy.dread || 6))) + 1) };
          var saveRoll = (typeof explodingRoll === 'function') ? explodingRoll(saveDie) : { total: (Math.floor(Math.random() * saveDie) + 1) };
          var dmgSpecial = Math.max(0, Number(enemyRoll.total || 0) - Number(saveRoll.total || 0));
          if (dmgSpecial > 0) {
            allyTarget.hp = Math.max(0, Number(allyTarget.hp || 0) - dmgSpecial);
            if (allyTarget.isPlayer) {
              S.health = Math.max(0, Number(S.health || 0) - dmgSpecial);
              applyCrucibleSpecialEffectsToPlayer(special, logs);
            }
          }
          logs.push(enemy.name + ' used ' + special.name + ' (' + String(special.saveStat || 'defend') + ' save): ' + Number(enemyRoll.total || 0) + ' vs ' + Number(saveRoll.total || 0) + (dmgSpecial > 0 ? (' for ' + dmgSpecial + ' dmg.') : ' blocked.'));
          continue;
        }
        if (canCrucibleUnitAttack(enemy, allyTarget)) {
          if (!spendCrucibleUnitAp(enemy, 1)) break;
          runCrucibleAttack(enemy, allyTarget, logs, match);
        } else {
          var eIdx = getCrucibleRangeIndex(enemy.range);
          var tIdx = getCrucibleRangeIndex(allyTarget.range);
          var nextIdx = eIdx > tIdx ? (eIdx - 1) : (eIdx + 1);
          nextIdx = Math.max(0, Math.min(getCrucibleRangeOrder().length - 1, nextIdx));
          if (!spendCrucibleUnitAp(enemy, 1)) break;
          enemy.range = getCrucibleRangeOrder()[nextIdx];
          logs.push(enemy.name + ' repositioned to ' + enemy.range + '.');
          resolveCrucibleMapPickup(match, enemy, logs);
        }
      }
    }
    finishCrucibleEnemyTurn(match, logs, 'Enemy turn ended with no effective actions.');
    return true;
  }

  function autoPlayCrucibleAllyTurn(match) {
    if (!match || !match.active) return false;
    var logs = [];
    var allies = getLivingTeamUnits(match.allies);
    for (var i = 0; i < allies.length; i++) {
      var ally = allies[i];
      while (Number(ally.ap || 0) > 0) {
        var target = getRandomTeamTarget(match.enemies);
        if (!target) break;
        if (canCrucibleUnitAttack(ally, target)) {
          spendCrucibleUnitAp(ally, 1);
          runCrucibleAttack(ally, target, logs, match);
        } else {
          var aIdx = getCrucibleRangeIndex(ally.range);
          var tIdx = getCrucibleRangeIndex(target.range);
          var step = aIdx > tIdx ? -1 : 1;
          var next = Math.max(0, Math.min(getCrucibleRangeOrder().length - 1, aIdx + step));
          spendCrucibleUnitAp(ally, 1);
          ally.range = getCrucibleRangeOrder()[next];
          logs.push(ally.name + ' moved to ' + ally.range + '.');
        }
      }
    }
    if (logs.length) match.log = (match.log || []).concat(logs).slice(-120);
    return true;
  }

  function finalizeHoldingCrucibleMatch(match) {
    if (!match || !match.active) return false;
    var mode = getCrucibleModeSpec(match.mode);
    var winner = determineCrucibleWinner(match);
    if (!winner && mode.id === 'elimination') {
      var alliesAlive = getLivingTeamUnits(match.allies).length;
      var enemiesAlive = getLivingTeamUnits(match.enemies).length;
      if (alliesAlive <= 0 || enemiesAlive <= 0) {
        match.round = Math.max(1, Number(match.round || 1) + 1);
        match.log = (match.log || []).concat([
          'Elimination round reset. Score ' + Number(match.roundWins && match.roundWins.ally || 0) + ' - ' + Number(match.roundWins && match.roundWins.enemy || 0) + '.'
        ]).slice(-120);
        match.allies = (match.allies || []).map(function (unit) {
          if (!unit) return unit;
          unit.hp = Number(unit.maxHp || unit.hp || 10);
          unit.ap = 2;
          unit.defendBuff = 0;
          return unit;
        });
        match.enemies = (match.enemies || []).map(function (unit) {
          if (!unit) return unit;
          unit.hp = Number(unit.maxHp || unit.hp || 10);
          unit.ap = 2;
          unit.defendBuff = 0;
          return unit;
        });
        match.turnSide = 'ally';
        maybeSyncCrucibleSelection(match);
      }
      return false;
    }
    if (!winner) return false;
    var crucible = S.holding.crucible;
    match.active = false;
    match.finishedAt = Date.now();
    match.winner = winner;
    crucible.roundsPlayed = Math.max(0, Number(crucible.roundsPlayed || 0) + Number(match.round || 1));
    crucible.lastAt = Date.now();
    if (winner === 'allies') {
      crucible.wins = Math.max(0, Number(crucible.wins || 0) + 1);
      crucible.currentWinStreak = Math.max(0, Number(crucible.currentWinStreak || 0) + 1);
      crucible.bestWinStreak = Math.max(Number(crucible.bestWinStreak || 0), Number(crucible.currentWinStreak || 0));
      crucible.lastResult = 'Victory in ' + Number(match.round || 1) + ' rounds';
      if (typeof showNotif === 'function') showNotif('Crucible victory. Your 6v6 squad held the tactical map.', 'good');
    } else {
      crucible.losses = Math.max(0, Number(crucible.losses || 0) + 1);
      crucible.currentWinStreak = 0;
      crucible.lastResult = 'Defeat in ' + Number(match.round || 1) + ' rounds';
      if (typeof showNotif === 'function') showNotif('Crucible defeat. Tune build and try another 6v6 run.', 'warn');
    }
    return true;
  }

  function buildHoldingCrucibleBoardHtml(match) {
    if (!match || !match.hexMap) return '<div style="font-size:.74rem;color:var(--muted2);">No tactical map.</div>';
    var selectedUnit = getSelectedCrucibleActiveUnit(match);
    var selectedTarget = String(match.turnSide || 'ally') === 'enemy'
      ? getSelectedCrucibleAllyTarget(match)
      : getSelectedCrucibleTarget(match);
    var allUnits = (match.allies || []).concat(match.enemies || []);
    var reachableHexes = [];
    if (selectedUnit && Number(selectedUnit.ap || 0) > 0 && typeof getCrucibleOpenHexes === 'function') {
      reachableHexes = getCrucibleOpenHexes(selectedUnit, match, Number(selectedUnit.ap || 0)).filter(function (hex) {
        return !selectedUnit.position || hex.q !== selectedUnit.position.q || hex.r !== selectedUnit.position.r;
      });
    }
    var reachableKeys = reachableHexes.map(function (hex) { return String(hex.q) + ',' + String(hex.r); });
    var guidance = '<div style="margin-bottom:.22rem;padding:.22rem .3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.7rem;color:var(--muted2);line-height:1.45;">'
      + 'Click a token to select it. Click a highlighted hex to move the selected ' + (String(match.turnSide || 'ally') === 'enemy' ? 'enemy' : 'unit') + '. '
      + 'Opponent tokens set your current target.'
      + '</div>';
    var details = (selectedUnit && typeof getHexUnitDetailsHtml === 'function')
      ? ('<div style="margin-top:.22rem;padding:.22rem .3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">' + getHexUnitDetailsHtml(selectedUnit) + '</div>')
      : '';
    
    if (typeof renderCrucibleHexMap === 'function') {
      var svgBoard = renderCrucibleHexMap(match.hexMap, allUnits, selectedUnit ? selectedUnit.id : '', {
        selectedTargetId: selectedTarget ? selectedTarget.id : '',
        reachableHexKeys: reachableKeys,
        turnSide: String(match.turnSide || 'ally')
      });
      var interactables = Array.isArray(match.interactables) ? match.interactables : [];
      if (interactables.length && typeof injectInteractablesIntoSvg === 'function') {
        svgBoard = injectInteractablesIntoSvg(svgBoard, interactables, null, 28);
      }
      var interactablesPanel = (interactables.length && typeof buildInteractablePanelHtml === 'function')
        ? buildInteractablePanelHtml(interactables, selectedUnit)
        : '';
      return '<div style="margin-bottom:.25rem;">'
        + guidance
        + svgBoard
        + interactablesPanel
        + details
        + '</div>';
    }
    
    // Fallback board placeholder
    var mode = getCrucibleModeSpec(match.mode);
    var layout = match.tacticalLayout || buildCrucibleTacticalLayout(mode.id, match.round);
    match.tacticalLayout = layout;
    var units = [];
    getLivingTeamUnits(match.allies).forEach(function (u) {
      units.push({ name: u.name, side: 'ally', isPlayer: !!u.isPlayer, hp: Number(u.hp || 0), range: String(u.range || 'Engaged') });
    });
    getLivingTeamUnits(match.enemies).forEach(function (u) {
      units.push({ name: u.name, side: 'enemy', isPlayer: false, hp: Number(u.hp || 0), range: String(u.range || 'Engaged') });
    });
    var boardRenderer = (typeof window !== 'undefined' && typeof window.buildLegacyRaidHexCombatBoard === 'function')
      ? window.buildLegacyRaidHexCombatBoard
      : null;
    if (boardRenderer) {
      try {
        var board = boardRenderer(units, {
          title: 'CRUCIBLE 6V6 - TACTICAL MAP (' + mode.label.toUpperCase() + ')',
          subtitle: String(match.mapBrief || layout.brief || '3 lanes, platforms, cover, power ammo, and center high ground.'),
          seed: 'holding-crucible-' + String(match.round || 1),
          mode: String(mode.id || 'control'),
          missionId: 0,
          wingNum: 0
        });
        var mapMeta = '<div style="margin-bottom:.25rem;padding:.24rem .3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.7rem;color:var(--muted2);line-height:1.45;">'
          + '<strong style="color:var(--gold2);">Map:</strong> ' + String(layout.footprint || '60x60 ft') + ' · '
          + '<strong style="color:var(--teal);">Lanes:</strong> short/mid/long + deep flank · '
          + '<strong style="color:var(--teal);">High Ground:</strong> ' + String(layout.highGround || 'Nearby') + ' · '
          + '<strong style="color:var(--teal);">Center:</strong> ' + String(layout.centerZone || 'Close') + '<br>'
          + '<strong style="color:var(--gold2);">Cover:</strong> objects in every lane · '
          + '<strong style="color:var(--gold2);">Power Ammo:</strong> ' + String(layout.pickups && layout.pickups.ammo ? layout.pickups.ammo.lane : 'Nearby') + ' · '
          + '<strong style="color:var(--gold2);">Loot:</strong> ' + String(layout.pickups && layout.pickups.loot ? layout.pickups.loot.lane : 'Close') + ' · '
          + '<strong style="color:var(--gold2);">Puzzle:</strong> ' + String(layout.pickups && layout.pickups.puzzle ? layout.pickups.puzzle.lane : 'Far')
          + '</div>';
        return mapMeta + board;
      } catch (_err) {}
    }
    return '<div style="font-size:.74rem;color:var(--muted2);">Tactical map helper unavailable in this runtime.</div>';
  }

  function buildHoldingCruciblePopupHtml() {
    var match = getHoldingCrucibleMatch();
    if (!match) {
      return '<div style="font-size:.82rem;color:var(--text2);line-height:1.55;">'
        + '<div style="font-family:Cinzel,serif;font-size:.88rem;color:var(--gold2);margin-bottom:.2rem;">Crucible 6v6 Tactical Simulator</div>'
        + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.35rem;">No active match. Start one from Holdings.</div>'
      + '</div>';
    }
    var alliesAlive = getLivingTeamUnits(match.allies).length;
    var enemiesAlive = getLivingTeamUnits(match.enemies).length;
    var mode = getCrucibleModeSpec(match.mode);
    maybeSyncCrucibleSelection(match);
    var isEnemyTurn = String(match.turnSide || 'ally') === 'enemy';
    var selectedAlly = getSelectedCrucibleAlly(match);
    var selectedEnemy = getSelectedCrucibleEnemy(match);
    var selectedTarget = getSelectedCrucibleTarget(match);
    var selectedAllyTarget = getSelectedCrucibleAllyTarget(match);
    var selectedActiveUnit = isEnemyTurn ? selectedEnemy : selectedAlly;
    var allyRows = getLivingTeamUnits(match.allies).map(function (u) {
      var on = isEnemyTurn
        ? (selectedAllyTarget && String(selectedAllyTarget.id) === String(u.id))
        : (selectedAlly && String(selectedAlly.id) === String(u.id));
      var flavor = (u.personalFlavor && u.personalFlavor.name) ? (' · PF:' + String(u.personalFlavor.name)) : '';
      var handler = isEnemyTurn ? 'selectHoldingCrucibleAllyTarget' : 'selectHoldingCrucibleUnit';
      return '<button class="btn btn-xs ' + (on ? 'btn-teal' : '') + '" onclick="' + handler + '(\'' + String(u.id).replace(/'/g, '&#39;') + '\')">'
        + u.name + ' [' + (u.position ? (u.position.q + ',' + u.position.r) : 'PA') + '] AP' + Number(u.ap || 0) + ' HP' + Number(u.hp || 0) + flavor
      + '</button>';
    }).join('');
    var targetRows = getLivingTeamUnits(match.enemies).map(function (u) {
      var on = isEnemyTurn
        ? (selectedEnemy && String(selectedEnemy.id) === String(u.id))
        : (selectedTarget && String(selectedTarget.id) === String(u.id));
      var dist = selectedActiveUnit ? (typeof getUnitDistance === 'function' ? getUnitDistance(selectedActiveUnit, u) : 0) : 0;
      var handler = isEnemyTurn ? 'selectHoldingCrucibleEnemy' : 'selectHoldingCrucibleTarget';
      return '<button class="btn btn-xs ' + (on ? 'btn-red' : '') + '" onclick="' + handler + '(\'' + String(u.id).replace(/'/g, '&#39;') + '\')">'
        + u.name + ' [' + (u.position ? (u.position.q + ',' + u.position.r) : 'PA') + '] d:' + dist + ' HP' + Number(u.hp || 0)
      + '</button>';
    }).join('');
    var canAct = !!(!isEnemyTurn && selectedAlly && Number(selectedAlly.hp || 0) > 0 && Number(selectedAlly.ap || 0) > 0);
    var canEnemyAct = !!(isEnemyTurn && selectedEnemy && Number(selectedEnemy.hp || 0) > 0 && Number(selectedEnemy.ap || 0) > 0);
    var canMoveActive = !!(selectedActiveUnit && Number(selectedActiveUnit.hp || 0) > 0 && Number(selectedActiveUnit.ap || 0) > 0);
    var currentTurn = !isEnemyTurn ? 'Your Team Turn' : 'Enemy Turn';
    var scoreLine = mode.id === 'elimination'
      ? ('Round Wins ' + Number(match.roundWins && match.roundWins.ally || 0) + ' - ' + Number(match.roundWins && match.roundWins.enemy || 0) + ' (target ' + Number(mode.scoreToWin || 5) + ')')
      : ('Score ' + Number(match.score && match.score.ally || 0) + ' - ' + Number(match.score && match.score.enemy || 0) + ' (target ' + Number(mode.scoreToWin || 0) + ')');
    var wayfarerOptions = getCrucibleWayfarerActionOptionsHtml();
    var wayfarerTargetOptions = buildCrucibleEnemyTargetOptions(match, 'attack', selectedAlly);
    var teamTargetOptions = buildCrucibleTeamTargetOptions(match, 'attack', selectedAlly);
    var enemyTargetOptions = buildCrucibleEnemyTargetOptions(match, 'attack', selectedEnemy);
    var railMine = !isEnemyTurn;
    var turnRail = '<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:.16rem;align-items:center;margin-bottom:.3rem;">'
      + '<div style="text-align:center;padding:.16rem .2rem;border:1px solid ' + (railMine ? 'rgba(70,196,182,.45)' : 'var(--border2)') + ';background:' + (railMine ? 'rgba(70,196,182,.12)' : 'rgba(255,255,255,.02)') + ';font-size:.68rem;color:' + (railMine ? 'var(--teal)' : 'var(--muted2)') + ';">Your Team</div>'
      + '<div style="font-size:.78rem;color:var(--muted2);text-align:center;">→</div>'
      + '<div style="text-align:center;padding:.16rem .2rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.68rem;color:var(--gold2);">Execute</div>'
      + '<div style="font-size:.78rem;color:var(--muted2);text-align:center;">→</div>'
      + '<div style="text-align:center;padding:.16rem .2rem;border:1px solid ' + (!railMine ? 'rgba(200,80,80,.45)' : 'var(--border2)') + ';background:' + (!railMine ? 'rgba(200,80,80,.12)' : 'rgba(255,255,255,.02)') + ';font-size:.68rem;color:' + (!railMine ? 'var(--red2)' : 'var(--muted2)') + ';">Enemy Team</div>'
    + '</div>';
    var turnControlsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:.2rem;align-items:end;margin-bottom:.22rem;">'
      + '<label style="font-size:.66rem;color:var(--muted2);">Wayfarer Actions'
      + '<select id="crucibleWayfarerActionSelect" onchange="refreshCrucibleWayfarerActionOptions();" style="width:100%;margin-top:.08rem;" ' + (isEnemyTurn ? 'disabled' : '') + '>' + wayfarerOptions + '</select></label>'
      + '<label style="font-size:.66rem;color:var(--muted2);">Target'
      + '<select id="crucibleWayfarerTargetSelect" style="width:100%;margin-top:.08rem;" ' + (isEnemyTurn ? 'disabled' : '') + '>' + wayfarerTargetOptions + '</select></label>'
      + '<button class="btn btn-sm btn-primary" onclick="holdingCrucibleExecuteWayfarerAction();" ' + (canAct ? '' : 'disabled style="opacity:.45;cursor:default;"') + '>Execute</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:.2rem;align-items:end;margin-bottom:.22rem;">'
      + '<label style="font-size:.66rem;color:var(--muted2);">Team Action'
      + '<select id="crucibleTeamActionSelect" onchange="refreshCrucibleTeamActionOptions();" style="width:100%;margin-top:.08rem;" ' + (isEnemyTurn ? 'disabled' : '') + '>'
      + '<option value="personal-flavor">Personal Flavor</option>'
      + '<option value="defend">Defend (+3 next defend)</option>'
      + '<option value="attack" selected>Attack (Engaged/Close)</option>'
      + '<option value="support">Support (+3 next attack)</option>'
      + '</select></label>'
      + '<label style="font-size:.66rem;color:var(--muted2);">Target'
      + '<select id="crucibleTeamTargetSelect" style="width:100%;margin-top:.08rem;" ' + (isEnemyTurn ? 'disabled' : '') + '>' + teamTargetOptions + '</select></label>'
      + '<button class="btn btn-sm btn-primary" onclick="holdingCrucibleExecuteTeamAction();" ' + (canAct ? '' : 'disabled style="opacity:.45;cursor:default;"') + '>Execute</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:.2rem;align-items:end;margin-bottom:.3rem;">'
      + '<label style="font-size:.66rem;color:var(--muted2);">Enemy Action'
      + '<select id="crucibleEnemyActionSelect" onchange="refreshCrucibleEnemyActionOptions();" style="width:100%;margin-top:.08rem;" ' + (!isEnemyTurn ? 'disabled' : '') + '>'
      + '<option value="personal-flavor">Personal Flavor</option>'
      + '<option value="defend">Defend (+3 next defend)</option>'
      + '<option value="attack" selected>Attack (Engaged/Close)</option>'
      + '<option value="support">Support (+3 next attack)</option>'
      + '</select></label>'
      + '<label style="font-size:.66rem;color:var(--muted2);">Target'
      + '<select id="crucibleEnemyTargetSelect" style="width:100%;margin-top:.08rem;" ' + (!isEnemyTurn ? 'disabled' : '') + '>' + enemyTargetOptions + '</select></label>'
      + '<button class="btn btn-sm btn-red" onclick="holdingCrucibleExecuteEnemyAction();" ' + (canEnemyAct ? '' : 'disabled style="opacity:.45;cursor:default;"') + '>Execute</button>'
      + '</div>'
      + (!isEnemyTurn
        ? '<div style="font-size:.68rem;color:var(--muted2);margin-top:-.1rem;margin-bottom:.2rem;">Enemy Action controls unlock on Enemy Turn. Use <strong>Begin Enemy Turn</strong> when ready.</div>'
        : '');
    var phaseButtonsHtml = '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.35rem;">'
      + '<button class="btn btn-sm" onclick="holdingCrucibleEndSelectedUnit();" ' + ((isEnemyTurn ? canEnemyAct : canAct) ? '' : 'disabled style="opacity:.45;cursor:default;"') + '>End Unit</button>'
      + '<button class="btn btn-sm btn-teal" onclick="holdingCrucibleAdvanceRound();">' + (isEnemyTurn ? 'End Enemy Turn' : 'Begin Enemy Turn') + '</button>'
      + (isEnemyTurn ? '<button class="btn btn-sm btn-red" onclick="holdingCrucibleRunEnemyAI();">Enemy AI Turn</button>' : '')
      + '<button class="btn btn-sm btn-teal" onclick="holdingCrucibleAutoResolve();">Auto Resolve</button>'
      + '<button class="btn btn-sm" onclick="holdingCrucibleResetMatch();">Reset Match</button>'
      + '<button class="btn btn-sm" onclick="closeModal();">Close</button>'
      + '</div>';
    var movementHtml = '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.35rem;">'
      + (canMoveActive && typeof getHexMovementButtonsHtml === 'function'
        ? ('<div style="width:100%;margin-bottom:.15rem;font-size:.7rem;"><strong style="color:var(--gold);">Movement:</strong></div>' + getHexMovementButtonsHtml(selectedActiveUnit, match) + '<button class="btn btn-sm btn-teal" style="margin-top:.2rem;" onclick="holdingCrucibleTeleportSelected();">Teleport Random Hex</button>')
        : '<div style="font-size:.7rem;color:var(--muted2);">No movement available.</div>')
      + '</div>';
    var logLines = (match.log || []).slice(-8).reverse().map(function (line) {
      return '<div style="font-size:.72rem;color:var(--text2);line-height:1.45;border-bottom:1px solid var(--border2);padding:.12rem 0;">' + String(line || '') + '</div>';
    }).join('');
    return '<div style="font-size:.82rem;color:var(--text2);line-height:1.55;">'
      + '<div style="font-family:Cinzel,serif;font-size:.88rem;color:var(--gold2);margin-bottom:.2rem;">Crucible 6v6 Tactical Simulator</div>'
      + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.15rem;">Round ' + Number(match.round || 1) + ' · ' + currentTurn + ' · Allies ' + alliesAlive + '/' + Number((match.allies||[]).length || 0) + ' · Enemies ' + enemiesAlive + '/' + Number((match.enemies||[]).length || 0) + '</div>'
      + '<div style="font-size:.74rem;color:var(--teal);margin-bottom:.28rem;">Mode: ' + mode.label + ' · Objective: ' + mode.objective + ' · ' + scoreLine + '</div>'
      + turnRail
      + turnControlsHtml
      + phaseButtonsHtml
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-bottom:.35rem;">'
      + '<div style="border:1px solid rgba(70,196,182,.35);padding:.28rem .34rem;background:linear-gradient(180deg,rgba(70,196,182,.08),rgba(255,255,255,.02));">'
      + '<div style="display:flex;justify-content:space-between;gap:.2rem;align-items:center;margin-bottom:.2rem;">'
      + '<div style="font-size:.7rem;color:var(--teal);">Blue Side</div>'
      + '<div style="font-size:.64rem;color:var(--muted2);">' + (isEnemyTurn ? 'Target / HP / PF' : 'AP / HP / PF') + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.18rem;flex-wrap:wrap;max-height:7.5rem;overflow:auto;">' + (allyRows || '<div style="font-size:.72rem;color:var(--muted2);">No allies standing.</div>') + '</div>'
      + '</div>'
      + '<div style="border:1px solid rgba(200,80,80,.35);padding:.28rem .34rem;background:linear-gradient(180deg,rgba(200,80,80,.08),rgba(255,255,255,.02));">'
      + '<div style="display:flex;justify-content:space-between;gap:.2rem;align-items:center;margin-bottom:.2rem;">'
      + '<div style="font-size:.7rem;color:var(--red2);">Red Side</div>'
      + '<div style="font-size:.64rem;color:var(--muted2);">' + (isEnemyTurn ? 'AP / HP' : 'Distance / HP') + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.18rem;flex-wrap:wrap;max-height:7.5rem;overflow:auto;">' + (targetRows || '<div style="font-size:.72rem;color:var(--muted2);">No enemies standing.</div>') + '</div>'
      + '</div>'
      + '</div>'
      + movementHtml
      + buildHoldingCrucibleBoardHtml(match)
      + '<div style="margin-top:.35rem;border:1px solid var(--border2);padding:.28rem .34rem;max-height:180px;overflow:auto;background:rgba(255,255,255,.02);">' + (logLines || '<div style="font-size:.72rem;color:var(--muted2);">No events yet.</div>') + '</div>'
    + '</div>';
  }

  function renderHoldingCruciblePopup() {
    var content = document.getElementById('modalContent');
    if (!content) return false;
    content.innerHTML = buildHoldingCruciblePopupHtml();
    return true;
  }

  function openHoldingCrucibleModePrompt() {
    ensureNewFeatureState();
    var specs = ['control', 'clash', 'elimination', 'rumble'].map(function (key) { return getCrucibleModeSpec(key); });
    var html = '<div style="font-size:.84rem;color:var(--text2);line-height:1.55;">'
      + '<div style="font-family:Cinzel,serif;font-size:.86rem;color:var(--gold2);margin-bottom:.2rem;">Select Crucible Game Mode</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.35rem;">Arena footprint 60x60 ft · three lanes · vertical platforms · cover objects · power ammo spawns · central contested zone + two flanking routes.</div>'
      + specs.map(function (spec) {
        return '<div style="border:1px solid var(--border2);padding:.32rem .38rem;margin-bottom:.22rem;background:rgba(255,255,255,.02);">'
          + '<div style="font-size:.76rem;color:var(--gold2);"><strong>' + spec.label + '</strong></div>'
          + '<div style="font-size:.7rem;color:var(--muted2);margin:.1rem 0 .2rem;">' + spec.objective + '</div>'
          + '<button class="btn btn-xs btn-primary" onclick="holdingCrucibleSetMode(\'' + spec.id + '\');openHoldingCrucibleMatch(\'' + spec.id + '\');">Enter ' + spec.label + '</button>'
          + '</div>';
      }).join('')
      + '</div>';
    if (typeof openModal === 'function') openModal('Crucible Mode Select', html);
    return true;
  }

  function openHoldingCrucibleMatch(modeOverride) {
    ensureNewFeatureState();
    if (!modeOverride && !getHoldingCrucibleMatch()) {
      return openHoldingCrucibleModePrompt();
    }
    if (modeOverride) {
      var modeSpec = getCrucibleModeSpec(modeOverride);
      S.holding.crucible.preferredMode = modeSpec.id;
      S.holding.crucible.match = null;
    }
    var match = getHoldingCrucibleMatch() || createHoldingCrucibleMatch();
    if (typeof openModal === 'function') {
      openModal('Crucible 6v6 Tactical Simulator', buildHoldingCruciblePopupHtml());
    }
    if (typeof showNotif === 'function' && match && Number(match.round || 1) === 1) {
      showNotif('Crucible opened: 6v6 tactical training scenario ready.', 'good');
    }
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleSetMode(mode) {
    ensureNewFeatureState();
    var spec = getCrucibleModeSpec(mode);
    S.holding.crucible.preferredMode = spec.id;
    S.holding.crucible.match = null;
    createHoldingCrucibleMatch();
    renderHoldingCruciblePopup();
    renderHoldingUI();
    if (typeof showNotif === 'function') {
      showNotif('Crucible mode set: ' + spec.label + '. New map seeded.', 'good');
    }
    return true;
  }

  function selectHoldingCrucibleUnit(unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var unit = findCrucibleUnit(match, 'ally', unitId);
    if (!unit || Number(unit.hp || 0) <= 0) return false;
    match.selectedAllyId = String(unit.id);
    renderHoldingCruciblePopup();
    return true;
  }

  function selectHoldingCrucibleEnemy(unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var unit = findCrucibleUnit(match, 'enemy', unitId);
    if (!unit || Number(unit.hp || 0) <= 0) return false;
    match.selectedEnemyId = String(unit.id);
    renderHoldingCruciblePopup();
    return true;
  }

  function selectHoldingCrucibleTarget(unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var unit = findCrucibleUnit(match, 'enemy', unitId);
    if (!unit || Number(unit.hp || 0) <= 0) return false;
    match.selectedTargetId = String(unit.id);
    renderHoldingCruciblePopup();
    return true;
  }

  function selectHoldingCrucibleAllyTarget(unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var unit = findCrucibleUnit(match, 'ally', unitId);
    if (!unit || Number(unit.hp || 0) <= 0) return false;
    match.selectedAllyTargetId = String(unit.id);
    renderHoldingCruciblePopup();
    return true;
  }

  function getCrucibleWayfarerActionOptionsHtml() {
    if (typeof document !== 'undefined') {
      var select = document.getElementById('wayfarerActionSel');
      if (select && select.options && select.options.length) {
        var options = Array.prototype.map.call(select.options, function (opt) {
          if (!opt || !opt.value) return '';
          return '<option value="' + String(opt.value).replace(/"/g, '&quot;') + '">' + String(opt.textContent || opt.value) + '</option>';
        }).filter(Boolean);
        var lowerJoined = options.join(' ').toLowerCase();
        if (lowerJoined.indexOf('value="spell"') < 0) options.push('<option value="spell">Spell</option>');
        if (lowerJoined.indexOf('value="hack"') < 0) options.push('<option value="hack">Hack</option>');
        return options.join('');
      }
    }
    return '<option value="strike">Strike</option>'
      + '<option value="shoot">Shoot</option>'
      + '<option value="spell">Spell</option>'
      + '<option value="hack">Hack</option>'
      + '<option value="defend">Defend</option>'
      + '<option value="support">Support</option>'
      + '<option value="personal-flavor">Personal Flavor</option>';
  }

  function buildCrucibleTeamTargetOptions(match, action, actor) {
    return buildCrucibleActionTargetOptions(match, action, actor, 'ally');
  }

  function buildCrucibleEnemyTargetOptions(match, action, actor) {
    return buildCrucibleActionTargetOptions(match, action, actor, 'enemy');
  }

  function buildCrucibleActionTargetOptions(match, action, actor, actorSide) {
    if (!match) return '';
    var act = String(action || 'attack').toLowerCase();
    var friendlySide = String(actorSide || 'ally') === 'enemy' ? 'enemy' : 'ally';
    var opposingSide = friendlySide === 'enemy' ? 'ally' : 'enemy';
    var livingAllies = getLivingTeamUnits(match.allies || []);
    var livingEnemies = getLivingTeamUnits(match.enemies || []);
    var friendlyUnits = friendlySide === 'enemy' ? livingEnemies : livingAllies;
    var opposingUnits = opposingSide === 'enemy' ? livingEnemies : livingAllies;
    if (act === 'defend' || act === 'support') {
      return friendlyUnits.map(function (unit) {
        return '<option value="' + friendlySide + ':' + String(unit.id).replace(/"/g, '&quot;') + '">' + String(unit.name || 'Unit') + '</option>';
      }).join('');
    }
    if (act === 'attack' || act === 'strike' || act === 'shoot') {
      var targets = opposingUnits.filter(function (enemy) {
        return !!(actor && enemy && canCrucibleUnitAttack(actor, enemy));
      });
      return targets.map(function (unit) {
        var distTxt = (actor && typeof getUnitDistance === 'function') ? (' d:' + Number(getUnitDistance(actor, unit) || 0)) : '';
        return '<option value="' + opposingSide + ':' + String(unit.id).replace(/"/g, '&quot;') + '">' + String(unit.name || 'Enemy') + distTxt + '</option>';
      }).join('') || '<option value="">No engaged/close targets</option>';
    }
    if (act === 'spell' || act === 'hack') {
      var castTargets = opposingUnits.filter(function (enemy) {
        return !!(actor && enemy && canCrucibleUnitCastActionOnTarget(actor, enemy, act));
      });
      return castTargets.map(function (unit) {
        var distTxt = (actor && typeof getUnitDistance === 'function') ? (' d:' + Number(getUnitDistance(actor, unit) || 0)) : '';
        return '<option value="' + opposingSide + ':' + String(unit.id).replace(/"/g, '&quot;') + '">' + String(unit.name || 'Enemy') + distTxt + '</option>';
      }).join('') || '<option value="">No valid targets for ' + (act === 'hack' ? 'Hack' : 'Spell') + '</option>';
    }
    if (act === 'personal-flavor') {
      var closeEnemies = opposingUnits.filter(function (enemy) {
        if (!actor || !enemy || !actor.position || !enemy.position || typeof getUnitDistance !== 'function') return false;
        var dist = Number(getUnitDistance(actor, enemy) || 99);
        if (typeof canUseCruciblePersonalFlavorRange === 'function') return canUseCruciblePersonalFlavorRange(dist);
        return dist > 0 && dist <= 2;
      });
      return closeEnemies.map(function (unit) {
        var distTxt = (actor && typeof getUnitDistance === 'function') ? (' d:' + Number(getUnitDistance(actor, unit) || 0)) : '';
        return '<option value="' + opposingSide + ':' + String(unit.id).replace(/"/g, '&quot;') + '">' + String(unit.name || 'Enemy') + distTxt + '</option>';
      }).join('') || '<option value="">No close target for Personal Flavor</option>';
    }
    return '<option value="">Select action first</option>';
  }

  function refreshCrucibleTeamActionOptions() {
    var match = getHoldingCrucibleMatch();
    if (!match || typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleTeamActionSelect');
    var targetEl = document.getElementById('crucibleTeamTargetSelect');
    if (!actionEl || !targetEl) return false;
    var actor = getSelectedCrucibleAlly(match);
    targetEl.innerHTML = buildCrucibleTeamTargetOptions(match, String(actionEl.value || 'attack'), actor);
    return true;
  }

  function refreshCrucibleWayfarerActionOptions() {
    var match = getHoldingCrucibleMatch();
    if (!match || typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleWayfarerActionSelect');
    var targetEl = document.getElementById('crucibleWayfarerTargetSelect');
    if (!actionEl || !targetEl) return false;
    var actor = getSelectedCrucibleAlly(match);
    targetEl.innerHTML = buildCrucibleEnemyTargetOptions(match, String(actionEl.value || 'attack'), actor);
    return true;
  }

  function refreshCrucibleEnemyActionOptions() {
    var match = getHoldingCrucibleMatch();
    if (!match || typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleEnemyActionSelect');
    var targetEl = document.getElementById('crucibleEnemyTargetSelect');
    if (!actionEl || !targetEl) return false;
    var actor = getSelectedCrucibleEnemy(match);
    targetEl.innerHTML = buildCrucibleEnemyTargetOptions(match, String(actionEl.value || 'attack'), actor);
    return true;
  }

  function holdingCrucibleHandleBoardUnitClick(side, unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    if (String(match.turnSide || 'ally') === 'enemy') {
      return String(side || '') === 'enemy'
        ? selectHoldingCrucibleEnemy(unitId)
        : selectHoldingCrucibleAllyTarget(unitId);
    }
    return String(side || '') === 'enemy'
      ? selectHoldingCrucibleTarget(unitId)
      : selectHoldingCrucibleUnit(unitId);
  }

  function holdingCrucibleHandleBoardHexClick(q, r) {
    return holdingCrucibleMoveSelected(q, r);
  }

  function holdingCrucibleStartDrag(side, unitId) {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var activeSide = String(match.turnSide || 'ally');
    var tokenSide = String(side || 'ally');
    if (tokenSide !== activeSide) {
      if (typeof showNotif === 'function') showNotif('Only the active side can be moved this turn.', 'warn');
      return false;
    }
    var picker = tokenSide === 'enemy' ? selectHoldingCrucibleEnemy : selectHoldingCrucibleUnit;
    if (typeof picker === 'function') picker(unitId);
    var unit = findCrucibleUnit(match, tokenSide, unitId);
    if (!unit || Number(unit.hp || 0) <= 0 || Number(unit.ap || 0) <= 0) return false;
    window._holdingCrucibleDrag = { side: tokenSide, id: String(unitId || '') };
    return true;
  }

  function holdingCrucibleEndDrag() {
    window._holdingCrucibleDrag = null;
    return true;
  }

  function holdingCrucibleHandleHexDragOver(evt, q, r) {
    if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
    return false;
  }

  function holdingCrucibleDropOnHex(q, r) {
    var drag = window._holdingCrucibleDrag || null;
    if (!drag) return false;
    var match = getHoldingCrucibleMatch();
    if (!match) {
      window._holdingCrucibleDrag = null;
      return false;
    }
    var activeSide = String(match.turnSide || 'ally');
    if (String(drag.side || 'ally') !== activeSide) {
      window._holdingCrucibleDrag = null;
      return false;
    }
    var picker = activeSide === 'enemy' ? selectHoldingCrucibleEnemy : selectHoldingCrucibleUnit;
    if (typeof picker === 'function') picker(String(drag.id || ''));
    var moved = holdingCrucibleMoveSelected(q, r);
    window._holdingCrucibleDrag = null;
    return moved;
  }

  function holdingCrucibleExecuteWayfarerAction() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'ally') return false;
    if (typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleWayfarerActionSelect');
    var targetEl = document.getElementById('crucibleWayfarerTargetSelect');
    if (!actionEl) return false;
    var action = String(actionEl.value || '').toLowerCase();
    var actor = (match.allies || []).find(function (u) { return u && u.isPlayer && Number(u.hp || 0) > 0; }) || null;
    if (!actor) {
      if (typeof showNotif === 'function') showNotif('Wayfarer is down and cannot act.', 'warn');
      return false;
    }
    match.selectedAllyId = String(actor.id || '');
    if (Number(actor.ap || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif(actor.name + ' has no AP left.', 'warn');
      return false;
    }

    var targetRef = targetEl ? String(targetEl.value || '') : '';
    var target = null;
    if (targetRef.indexOf('enemy:') === 0) {
      target = findCrucibleUnit(match, 'enemy', targetRef.split(':')[1]);
    }
    if (!target || Number(target.hp || 0) <= 0) {
      target = getSelectedCrucibleTarget(match);
    }
    var logs = [];
    if (action.indexOf('move') === 0) {
      if (typeof showNotif === 'function') showNotif('Use the movement chips below the board to move one hex at a time.', 'info');
      return false;
    }
    if (action.indexOf('defend') >= 0) {
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      actor.defendBuff = Math.max(0, Number(actor.defendBuff || 0) + 3);
      logs.push(actor.name + ' defended (+3 to next Defend roll).');
    } else if (action.indexOf('support') >= 0) {
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      actor.strikeBonus = Math.max(0, Number(actor.strikeBonus || 0) + 3);
      logs.push(actor.name + ' prepared a support setup (+3 to next attack).');
    } else if (action.indexOf('flavor') >= 0) {
      var flavorDist = (target && typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, target) || 99) : 99;
      var flavorInRange = (typeof canUseCruciblePersonalFlavorRange === 'function')
        ? canUseCruciblePersonalFlavorRange(flavorDist)
        : (flavorDist > 0 && flavorDist <= 2);
      if (!target || !flavorInRange) {
        if (typeof showNotif === 'function') showNotif('Personal Flavor needs a close target (Engaged or Close).', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      if (typeof executePersonalFlavor === 'function') {
        executePersonalFlavor(actor, 'crucible-' + Number(match.round || 1), match.hexMap, logs);
      } else {
        logs.push(actor.name + ' used Personal Flavor.');
      }
    } else if (action === 'spell' || action === 'hack') {
      if (!target || !canCrucibleUnitCastActionOnTarget(actor, target, action)) {
        if (typeof showNotif === 'function') showNotif('Select a valid target in spell/hack range first.', 'warn');
        return false;
      }
      if (isNewFeaturesManualRollMode()) {
        return openCrucibleManualSpellHackPrompt(actor, target, action);
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      resolveCrucibleSpellHackAction(actor, target, action, match, logs, null);
    } else {
      if (!target || !canCrucibleUnitAttack(actor, target)) {
        if (typeof showNotif === 'function') showNotif('Select an engaged/close enemy target first.', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      var dist = (typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, target) || 0) : 0;
      logs.push(actor.name + ' used ' + (dist <= 1 ? 'Strike' : 'Shoot') + '.');
      runCrucibleAttack(actor, target, logs, match);
    }

    match.log = (match.log || []).concat(logs).slice(-120);
    maybeSyncCrucibleSelection(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleExecuteTeamAction() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'ally') return false;
    if (typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleTeamActionSelect');
    var targetEl = document.getElementById('crucibleTeamTargetSelect');
    if (!actionEl || !targetEl) return false;

    var actor = getSelectedCrucibleAlly(match);
    if (!actor || Number(actor.hp || 0) <= 0) return false;
    if (actor.isPlayer) {
      if (typeof showNotif === 'function') showNotif('Select a teammate for Team Action, or use Wayfarer Action for yourself.', 'warn');
      return false;
    }
    if (Number(actor.ap || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif(actor.name + ' has no AP left.', 'warn');
      return false;
    }

    var action = String(actionEl.value || 'attack').toLowerCase();
    var targetRef = String(targetEl.value || '');
    var logs = [];

    if (action === 'attack') {
      if (!targetRef || targetRef.indexOf('enemy:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an engaged/close enemy target.', 'warn');
        return false;
      }
      var targetEnemy = findCrucibleUnit(match, 'enemy', targetRef.split(':')[1]);
      if (!targetEnemy || !canCrucibleUnitAttack(actor, targetEnemy)) {
        if (typeof showNotif === 'function') showNotif('Target out of range for Attack.', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      var dist = (typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, targetEnemy) || 0) : 0;
      logs.push(actor.name + ' used ' + (dist <= 1 ? 'Strike' : 'Shoot') + '.');
      runCrucibleAttack(actor, targetEnemy, logs, match);
    } else if (action === 'defend') {
      if (!targetRef || targetRef.indexOf('ally:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an ally to defend.', 'warn');
        return false;
      }
      var defendTarget = findCrucibleUnit(match, 'ally', targetRef.split(':')[1]);
      if (!defendTarget) return false;
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      executeDefendAction(actor, defendTarget, logs);
    } else if (action === 'support') {
      if (!targetRef || targetRef.indexOf('ally:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an ally to support.', 'warn');
        return false;
      }
      var supportTarget = findCrucibleUnit(match, 'ally', targetRef.split(':')[1]);
      if (!supportTarget) return false;
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      executeSupportAction(actor, supportTarget, logs);
    } else if (action === 'personal-flavor') {
      if (!targetRef || targetRef.indexOf('enemy:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Personal Flavor requires a close enemy target.', 'warn');
        return false;
      }
      var flavorTarget = findCrucibleUnit(match, 'enemy', targetRef.split(':')[1]);
      var teamFlavorDist = (flavorTarget && typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, flavorTarget) || 99) : 99;
      var teamFlavorInRange = (typeof canUseCruciblePersonalFlavorRange === 'function')
        ? canUseCruciblePersonalFlavorRange(teamFlavorDist)
        : (teamFlavorDist > 0 && teamFlavorDist <= 2);
      if (!flavorTarget || !teamFlavorInRange) {
        if (typeof showNotif === 'function') showNotif('Personal Flavor only works at Close range or Engaged.', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      if (typeof executePersonalFlavor === 'function') executePersonalFlavor(actor, 'crucible-' + Number(match.round || 1), match.hexMap, logs);
      else logs.push(actor.name + ' used Personal Flavor.');
    }

    match.log = (match.log || []).concat(logs).slice(-120);
    maybeSyncCrucibleSelection(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleExecuteEnemyAction() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'enemy') return false;
    if (typeof document === 'undefined') return false;
    var actionEl = document.getElementById('crucibleEnemyActionSelect');
    var targetEl = document.getElementById('crucibleEnemyTargetSelect');
    if (!actionEl || !targetEl) return false;

    var actor = getSelectedCrucibleEnemy(match);
    if (!actor || Number(actor.hp || 0) <= 0) return false;
    if (Number(actor.ap || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif(actor.name + ' has no AP left.', 'warn');
      return false;
    }

    var action = String(actionEl.value || 'attack').toLowerCase();
    var targetRef = String(targetEl.value || '');
    var logs = [];

    if (action === 'attack') {
      if (!targetRef || targetRef.indexOf('ally:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an engaged/close ally target.', 'warn');
        return false;
      }
      var attackTarget = findCrucibleUnit(match, 'ally', targetRef.split(':')[1]);
      if (!attackTarget || !canCrucibleUnitAttack(actor, attackTarget)) {
        if (typeof showNotif === 'function') showNotif('Target out of range for Attack.', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      var dist = (typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, attackTarget) || 0) : 0;
      logs.push(actor.name + ' used ' + (dist <= 1 ? 'Strike' : 'Shoot') + '.');
      runCrucibleAttack(actor, attackTarget, logs, match);
      match.selectedAllyTargetId = String(attackTarget.id || '');
    } else if (action === 'defend') {
      if (!targetRef || targetRef.indexOf('enemy:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an enemy ally to defend.', 'warn');
        return false;
      }
      var defendTarget = findCrucibleUnit(match, 'enemy', targetRef.split(':')[1]);
      if (!defendTarget) return false;
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      executeDefendAction(actor, defendTarget, logs);
    } else if (action === 'support') {
      if (!targetRef || targetRef.indexOf('enemy:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Pick an enemy ally to support.', 'warn');
        return false;
      }
      var supportTarget = findCrucibleUnit(match, 'enemy', targetRef.split(':')[1]);
      if (!supportTarget) return false;
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      executeSupportAction(actor, supportTarget, logs);
    } else if (action === 'personal-flavor') {
      if (!targetRef || targetRef.indexOf('ally:') !== 0) {
        if (typeof showNotif === 'function') showNotif('Personal Flavor requires a close ally target.', 'warn');
        return false;
      }
      var flavorTarget = findCrucibleUnit(match, 'ally', targetRef.split(':')[1]);
      var teamFlavorDist = (flavorTarget && typeof getUnitDistance === 'function') ? Number(getUnitDistance(actor, flavorTarget) || 99) : 99;
      var teamFlavorInRange = (typeof canUseCruciblePersonalFlavorRange === 'function')
        ? canUseCruciblePersonalFlavorRange(teamFlavorDist)
        : (teamFlavorDist > 0 && teamFlavorDist <= 2);
      if (!flavorTarget || !teamFlavorInRange) {
        if (typeof showNotif === 'function') showNotif('Personal Flavor only works at Close range or Engaged.', 'warn');
        return false;
      }
      if (!spendCrucibleUnitAp(actor, 1)) return false;
      if (typeof executePersonalFlavor === 'function') executePersonalFlavor(actor, 'crucible-' + Number(match.round || 1), match.hexMap, logs);
      else logs.push(actor.name + ' used Personal Flavor.');
      match.selectedAllyTargetId = String(flavorTarget.id || '');
    }

    match.log = (match.log || []).concat(logs).slice(-120);
    maybeSyncCrucibleSelection(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleMoveSelected(nextQ, nextR) {
    var match = getHoldingCrucibleMatch();
    if (!match || !match.hexMap) return false;
    var ally = getSelectedCrucibleActiveUnit(match);
    if (!ally || Number(ally.hp || 0) <= 0 || Number(ally.ap || 0) <= 0) return false;
    
    var targetHex = { q: Number(nextQ), r: Number(nextR) };
    if (typeof moveUnitToHex === 'function') {
      if (moveUnitToHex(ally, targetHex, match.hexMap, match.log)) {
        renderHoldingCruciblePopup();
        return true;
      }
    } else {
      // Fallback: simple 1-hex movement
      if (ally.position) {
        var dx = Math.abs(ally.position.q - nextQ);
        var dr = Math.abs(ally.position.r - nextR);
        if ((dx + dr + Math.abs(ally.position.q + ally.position.r - nextQ - nextR)) / 2 === 1) {
          if (getUnitsInHex(match.allies.concat(match.enemies), targetHex).length === 0) {
            ally.ap = Math.max(0, Number(ally.ap) - 1);
            ally.position = { q: Number(nextQ), r: Number(nextR) };
            match.log = (match.log || []).concat([ally.name + ' moved to [' + nextQ + ',' + nextR + '].']).slice(-120);
            renderHoldingCruciblePopup();
            return true;
          }
        }
      }
    }
    return false;
  }

  function holdingCrucibleTeleportSelected() {
    var match = getHoldingCrucibleMatch();
    if (!match || !match.hexMap) return false;
    var ally = getSelectedCrucibleActiveUnit(match);
    if (!ally || Number(ally.hp || 0) <= 0 || Number(ally.ap || 0) <= 0) return false;
    var target = null;
    if (typeof getCrucibleRandomOpenHex === 'function') {
      target = getCrucibleRandomOpenHex(ally, match, 999);
    }
    if (!target) {
      if (typeof showNotif === 'function') showNotif('No open hexes are available to teleport to.', 'warn');
      return false;
    }
    ally.ap = Math.max(0, Number(ally.ap || 0) - 1);
    ally.position = { q: Number(target.q), r: Number(target.r) };
    if (typeof triggerHexTerrainEffects === 'function') {
      triggerHexTerrainEffects(ally, target, match.hexMap, match.log || []);
    }
    match.log = (match.log || []).concat([ally.name + ' teleported to [' + target.q + ',' + target.r + '].']).slice(-120);
    maybeSyncCrucibleSelection(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    if (typeof showNotif === 'function') showNotif(ally.name + ' teleported to [' + target.q + ',' + target.r + '].', 'good');
    return true;
  }

  function holdingCrucibleAttackSelected() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'ally') return false;
    var ally = getSelectedCrucibleAlly(match);
    var target = getSelectedCrucibleTarget(match);
    if (!ally || !target || Number(ally.hp || 0) <= 0 || Number(target.hp || 0) <= 0) return false;
    if (Number(ally.ap || 0) <= 0) {
      if (typeof showNotif === 'function') showNotif(ally.name + ' has no AP left.', 'warn');
      return false;
    }
    if (!canCrucibleUnitAttack(ally, target)) {
      if (typeof showNotif === 'function') showNotif('Target out of range. Reposition first.', 'warn');
      return false;
    }
    spendCrucibleUnitAp(ally, 1);
    var logs = [];
    runCrucibleAttack(ally, target, logs, match);
    match.log = (match.log || []).concat(logs).slice(-120);
    maybeSyncCrucibleSelection(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleGuardSelected() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'ally') return false;
    var ally = getSelectedCrucibleAlly(match);
    if (!ally || Number(ally.hp || 0) <= 0 || Number(ally.ap || 0) <= 0) return false;
    spendCrucibleUnitAp(ally, 1);
    ally.defendBuff = Math.max(0, Number(ally.defendBuff || 0) + 2);
    match.log = (match.log || []).concat([ally.name + ' took a guarded stance (+2 defend).']).slice(-120);
    renderHoldingCruciblePopup();
    return true;
  }

  function holdingCrucibleEndSelectedUnit() {
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    var ally = getSelectedCrucibleActiveUnit(match);
    if (!ally) return false;
    ally.ap = 0;
    match.log = (match.log || []).concat([ally.name + ' ended their turn.']).slice(-120);
    renderHoldingCruciblePopup();
    return true;
  }

  function holdingCrucibleAdvanceRound() {
    ensureNewFeatureState();
    var match = getHoldingCrucibleMatch();
    if (!match) return false;
    if (String(match.turnSide || 'ally') === 'ally') {
      beginCrucibleEnemyTurn(match);
    } else {
      finishCrucibleEnemyTurn(match, [], 'Enemy phase ended under manual control.');
    }
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleRunEnemyAI() {
    var match = getHoldingCrucibleMatch();
    if (!match || String(match.turnSide || 'ally') !== 'enemy') return false;
    runCrucibleEnemyTurn(match);
    finalizeHoldingCrucibleMatch(match);
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleAutoResolve() {
    var safety = 0;
    while (getHoldingCrucibleMatch() && safety < 24) {
      var match = getHoldingCrucibleMatch();
      if (!match || !match.active) break;
      if (String(match.turnSide || 'ally') === 'ally') {
        autoPlayCrucibleAllyTurn(match);
        beginCrucibleEnemyTurn(match);
      }
      if (String(match.turnSide || 'ally') === 'enemy') runCrucibleEnemyTurn(match);
      safety += 1;
      match = getHoldingCrucibleMatch();
      if (!match || !match.active) break;
    }
    renderHoldingCruciblePopup();
    renderHoldingUI();
    return true;
  }

  function holdingCrucibleResetMatch() {
    ensureNewFeatureState();
    S.holding.crucible.match = null;
    createHoldingCrucibleMatch();
    renderHoldingCruciblePopup();
    renderHoldingUI();
    if (typeof showNotif === 'function') showNotif('Crucible match reset. New 6v6 scenario generated.', 'info');
    return true;
  }

  function buildHoldingCruciblePanelHtml() {
    ensureNewFeatureState();
    var c = S.holding.crucible || {};
    var mode = getCrucibleModeSpec(c.preferredMode || 'control');
    var match = getHoldingCrucibleMatch();
    var total = Math.max(1, Number(c.wins || 0) + Number(c.losses || 0));
    var winRate = Math.round((Math.max(0, Number(c.wins || 0)) / total) * 100);
    var status = match
      ? ('Active match · Round ' + Number(match.round || 1) + ' · ' + (String(match.turnSide || 'ally') === 'ally' ? 'Your Turn' : 'Enemy Turn'))
      : (c.lastResult ? ('Last: ' + String(c.lastResult)) : 'No simulation run yet.');
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.35rem;margin-bottom:.4rem;">'
      + '<div style="border:1px solid var(--border2);padding:.3rem .38rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Wins</div><div style="font-size:.92rem;color:var(--green2);">' + Number(c.wins || 0) + '</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.3rem .38rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Losses</div><div style="font-size:.92rem;color:var(--red2);">' + Number(c.losses || 0) + '</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.3rem .38rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Win Rate</div><div style="font-size:.92rem;color:var(--gold2);">' + winRate + '%</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.3rem .38rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Best Streak</div><div style="font-size:.92rem;color:var(--teal);">' + Number(c.bestWinStreak || 0) + '</div></div>'
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.35rem;">' + status + '</div>'
      + '<div style="font-size:.7rem;color:var(--teal);margin-bottom:.3rem;">Preferred Mode: ' + mode.label + ' · ' + mode.objective + '</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.3rem;">'
      + '<button class="btn btn-xs ' + (mode.id === 'control' ? 'btn-primary' : '') + '" onclick="holdingCrucibleSetMode(\'control\');">Control</button>'
      + '<button class="btn btn-xs ' + (mode.id === 'clash' ? 'btn-primary' : '') + '" onclick="holdingCrucibleSetMode(\'clash\');">Clash</button>'
      + '<button class="btn btn-xs ' + (mode.id === 'elimination' ? 'btn-primary' : '') + '" onclick="holdingCrucibleSetMode(\'elimination\');">Elimination</button>'
      + '<button class="btn btn-xs ' + (mode.id === 'rumble' ? 'btn-primary' : '') + '" onclick="holdingCrucibleSetMode(\'rumble\');">Rumble</button>'
      + '</div>'
      + '<div style="display:flex;gap:.28rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-primary" onclick="openHoldingCrucibleMatch();">Enter Crucible 6v6</button>'
        + (match ? '<button class="btn btn-sm btn-teal" onclick="holdingCrucibleAttackSelected();">Attack (Selected)</button>' : '')
        + (match ? '<button class="btn btn-sm" onclick="holdingCrucibleAdvanceRound();">End Team Turn</button>' : '')
      + (match ? '<button class="btn btn-sm" onclick="holdingCrucibleAutoResolve();">Auto Resolve</button>' : '')
      + '</div>';
  }

  function buyWayfarerHomeUpgrade(key) {
    ensureNewFeatureState();
    var home = S.holding.wayfarerHome || {};
    var lvl = Number(home[key] || 0);
    if (lvl >= 3) {
      showNotif('This home upgrade is already maxed.', 'warn');
      return;
    }
    var cost = getWayfarerHomeUpgradeCost(key, lvl);
    if ((S.credits || 0) < cost) {
      showNotif('Not enough Credits for this home upgrade.', 'warn');
      return;
    }
    S.credits = Math.max(0, (S.credits || 0) - cost);
    updateCreditsUI();
    home[key] = lvl + 1;
    home.log.unshift(capFirst(key.replace('Level', '')) + ' upgraded to Lv.' + home[key] + ' (-' + cost + '₵)');
    home.log = home.log.slice(0, 10);
    S.holding.wayfarerHome = home;
    renderHoldingUI();
    showNotif('Wayfarer Home upgraded: ' + key.replace('Level', '') + ' Lv.' + home[key], 'good');
  }

  function setWayfarerHomeDecorTheme(theme) {
    ensureNewFeatureState();
    S.holding.wayfarerHome.decorTheme = String(theme || 'Frontier');
    renderHoldingUI();
    showNotif('Wayfarer Home theme set: ' + S.holding.wayfarerHome.decorTheme, 'good');
  }

  function getWayfarerHomeBonuses() {
    ensureNewFeatureState();
    var home = S.holding.wayfarerHome || {};
    return {
      decor: Number(home.decorLevel || 0),
      security: Number(home.securityLevel || 0),
      workshop: Number(home.workshopLevel || 0),
      market: Number(home.marketLevel || 0)
    };
  }

  function renderHoldingCrises() {
    var el = document.getElementById("holdingActiveCrises");
    if (!el) { return; }
    if (!S.holding.crises.length) {
      el.innerHTML = '<div style="font-size:.8rem;color:var(--green2);padding:.3rem 0;">No active crises — the Realm is stable.</div>';
      return;
    }
    el.innerHTML = S.holding.crises.map(function(crisis, i) {
      return '<div style="background:rgba(201,64,64,.06);border:1px solid rgba(201,64,64,.25);padding:.4rem .55rem;margin-bottom:.28rem;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.12rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;">' + crisis.name + '</div>'
        + '<button class="btn btn-xs" onclick="resolveCrisis(' + i + ')">✓ Resolved</button>'
        + '</div>'
        + '<div style="font-size:.78rem;color:var(--text2);">' + crisis.desc + '</div>'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-top:.12rem;">Resolution: ' + crisis.resolution + '</div>'
        + '</div>';
    }).join("");
    var cc = document.getElementById("holdingCrisisCount");
    if (cc) { cc.textContent = S.holding.crises.length; }
  }

  function holdingDowntimeEvents() {
    return [
      { name: 'Wayfarer Rumor Circle', dd: 6, success: 'You secure a fresh rumor marker. +1 Teamwork.', failure: 'Rumors conflict and morale dips. +1 Mental Stress.', successEffect: { tmw: 1 }, failEffect: { mentalStress: 1 } },
      { name: 'Hex Festival Games', dd: 8, success: 'You win local games. +40 credits.', failure: 'You are outmatched in the pits. +1 Health damage.', successEffect: { credits: 40 }, failEffect: { health: 1 } },
      { name: 'Lorehall Research Night', dd: 6, success: 'Research succeeds. Gain Focused.', failure: 'Records are incoherent. +1 Mental Stress.', successEffect: { focused: 1 }, failEffect: { mentalStress: 1 } },
      { name: 'Masked Court Joust', dd: 10, success: 'The court applauds your prowess. +1 Renown.', failure: 'A heavy fall leaves bruises. +1 Health damage.', successEffect: { renown: 1 }, failEffect: { health: 1 } }
    ];
  }

  function holdingDowntimeActivityPool(activity) {
    var pools = {
      talk: [
        { name: 'Village Listening Walk', dd: 6, success: 'You resolve three disputes before sunset. +1 Teamwork.', failure: 'Conflicting accounts wear you down. +1 Mental Stress.', successEffect: { tmw: 1 }, failEffect: { mentalStress: 1 } },
        { name: 'Guildhall Negotiation', dd: 8, success: 'You broker a fair charter. +1 Renown.', failure: 'Talks stall into accusations. +1 Mental Stress.', successEffect: { renown: 1 }, failEffect: { mentalStress: 1 } }
      ],
      task: [
        { name: 'Supply Caravan Oversight', dd: 8, success: 'The route clears and taxes flow. +60 credits.', failure: 'Bandits cut into deliveries. +1 Health damage.', successEffect: { credits: 60 }, failEffect: { health: 1 } },
        { name: 'Militia Drill Cycle', dd: 6, success: 'Defenses tighten around the holding. +1 Renown.', failure: 'Training accidents spread tension. +1 Mental Stress.', successEffect: { renown: 1 }, failEffect: { mentalStress: 1 } }
      ],
      explore: [
        { name: 'Border Survey Expedition', dd: 8, success: 'You map hidden paths and caches. +40 credits.', failure: 'Hostile terrain takes its toll. +1 Health damage.', successEffect: { credits: 40 }, failEffect: { health: 1 } },
        { name: 'Ancient Waystone Recon', dd: 6, success: 'You recover useful wayfinding lore. Gain Focused.', failure: 'The site is disorienting. +1 Mental Stress.', successEffect: { focused: 1 }, failEffect: { mentalStress: 1 } }
      ]
    };
    return pools[String(activity || 'talk').toLowerCase()] || pools.talk;
  }

  function ensureHoldingSettlementHexcrawl() {
    ensureNewFeatureState();
    if (!S.holding || typeof S.holding !== 'object') { S.holding = {}; }
    var archetypes = {
      Fortress: {
        vibe: 'Militarized quarry-fort under constant watch rotations.',
        districts: ['Gate Ward', 'Market Square', 'Quarry Row', 'Old Shrine', 'Barracks', 'Lord\'s Hall', 'River Docks', 'Lower Tunnels'],
        moods: ['Wary', 'Defiant', 'Exhausted', 'Proud'],
        crowds: ['Guards', 'Laborers', 'Masons', 'Militia'],
        activities: ['Stone hauling', 'Militia drills', 'Watch rotations', 'Armor repairs'],
        rumors: ['Tunnel wall was breached then sealed overnight.', 'A watch captain is selling patrol routes.', 'A missing caravan sent no distress flare.'],
        interactables: ['Aid defenders', 'Hire laborers', 'Inspect gate watch', 'Buy ironworks'],
        hiddenThings: ['Bribed watch post', 'Smuggled relic shards', 'Unauthorized tunnel breach map'],
        microPool: ['Barracks Mess', 'Armory', 'Guard Chapel', 'Siege Shed', 'Tunnel Hatch', 'Lift Yard'],
        scenes: ['Militia formations block a full lane.', 'A funeral march for tunnel casualties passes.', 'A gate alarm rings and then abruptly stops.'],
        opportunities: ['Join a paid patrol sweep.', 'Win ration vouchers in a lifting contest.', 'Secure discount armor plates.'],
        mysteries: ['Helmet visors are found lined in chalk symbols.', 'No one speaks about the sealed third tunnel.', 'A bell rings from stone with no clapper.'],
        statsBase: { security: 8, food: 5, wealth: 5, faith: 4, fear: 4, mystery: 4, health: 6 },
        npcPool: [
          { name: 'Captain Helvek', role: 'Gate Watch Commander', need: 'More defenders', secret: 'Taking bribes', faction: 'Wardens' },
          { name: 'Foreman Tarek', role: 'Quarry Foreman', need: 'Safe blasting crews', secret: 'Hides relic fragments', faction: 'Labor Guild' },
          { name: 'Sister Vael', role: 'Shrine Keeper', need: 'Night escorts', secret: 'Tracks tunnel omens', faction: 'Temple' }
        ]
      },
      Citadel: {
        vibe: 'Bureaucratic power-core of scribes, tribunals, and command halls.',
        districts: ['High Gate', 'Scholars Court', 'Outer Market', 'Stone Ward', 'Temple Steps', 'Foundry Yard', 'Steward Hall'],
        moods: ['Disciplined', 'Suspicious', 'Measured', 'Ambitious'],
        crowds: ['Clerks', 'Magistrates', 'Merchants', 'Honor Guard'],
        activities: ['Ledger audits', 'Court hearings', 'Policy decrees', 'Artifact cataloging'],
        rumors: ['A decree was issued under a forged seal.', 'Steward Hall erased three names from records.', 'The northern archive moved cursed texts at dusk.'],
        interactables: ['Review records', 'Petition magistrate', 'Hire a legal fixer', 'Purchase rare maps'],
        hiddenThings: ['Altered tax ledger', 'Hidden tribunal chamber', 'Encrypted courier route'],
        microPool: ['Archive Annex', 'Tribunal Hall', 'Record Vault', 'Codex Shop', 'Scribe Bath', 'Magistrate Office'],
        scenes: ['A public sentencing halts all market noise.', 'Scribes race sealed tubes between towers.', 'A decree board is stripped clean at noon.'],
        opportunities: ['Purchase privileged route permits.', 'Bribe for fast-tracked cargo papers.', 'Acquire archived star-survey copies.'],
        mysteries: ['A courtroom door opens to different rooms nightly.', 'Every fourth decree vanishes by dawn.', 'A witness appears in records but never in person.'],
        statsBase: { security: 7, food: 5, wealth: 7, faith: 5, fear: 4, mystery: 5, health: 6 },
        npcPool: [
          { name: 'Archivist Noll', role: 'Senior Archivist', need: 'Recovered codices', secret: 'Hides redacted pages', faction: 'Scholars' },
          { name: 'Magistrate Ruen', role: 'Tribunal Judge', need: 'Reliable testimony', secret: 'Blackmails officials', faction: 'Steward Office' },
          { name: 'Broker Ines', role: 'Permit Broker', need: 'Stable trade flow', secret: 'Sells forged seals', faction: 'Merchants' }
        ]
      },
      Haven: {
        vibe: 'Trade-port shelter driven by tides, cargo, and transient strangers.',
        districts: ['Harbor Front', 'Salt Market', 'Pilgrim Row', 'Lantern Docks', 'Old Chapel', 'Warehouse Ring'],
        moods: ['Restless', 'Hopeful', 'Greedy', 'Tired'],
        crowds: ['Dockers', 'Pilgrims', 'Sailors', 'Porters'],
        activities: ['Cargo loading', 'Boat repair', 'Open-air barter', 'Pilgrim processions'],
        rumors: ['A silent ship arrived with no crew.', 'Warehouse Nine floods only at moonrise.', 'Dock fees doubled after an unmarked convoy.'],
        interactables: ['Book passage', 'Hire dock hands', 'Buy salvaged gear', 'Track cargo manifests'],
        hiddenThings: ['Smuggler tide code', 'Counterfeit cargo stamps', 'Sealed chapel crypt hatch'],
        microPool: ['Dock Tavern', 'Net Menders', 'Harbor Shrine', 'Whale-oil Bath', 'Manifest Office', 'Flood Cellar'],
        scenes: ['A dock crane snaps and spills crates.', 'A preacher denounces an incoming vessel.', 'Fog swallows the entire outer pier.'],
        opportunities: ['Win contraband maps in dockside dice.', 'Buy spoiled cargo cheap for salvage.', 'Secure fast transport through reef channels.'],
        mysteries: ['Lanterns relight themselves after midnight.', 'No footprints remain on one pier lane.', 'Harbor dogs refuse the chapel stairs.'],
        statsBase: { security: 5, food: 7, wealth: 8, faith: 4, fear: 5, mystery: 5, health: 5 },
        npcPool: [
          { name: 'Dockmaster Breth', role: 'Dock Overseer', need: 'Reliable crews', secret: 'Skims cargo fees', faction: 'Harbor Guild' },
          { name: 'Pilgrim-Marshal Oth', role: 'Pilgrim Escort Lead', need: 'Safe route markers', secret: 'Protects a fugitive', faction: 'Pilgrim Ward' },
          { name: 'Quartermistress Venn', role: 'Warehouse Clerk', need: 'Dry storage', secret: 'Keeps ghost manifests', faction: 'Merchants' }
        ]
      },
      Keep: {
        vibe: 'Compact frontier redoubt where every hand is overworked.',
        districts: ['South Gate', 'Craft Lane', 'Well Square', 'Watch Barracks', 'Hall Quarter'],
        moods: ['Strained', 'Stubborn', 'Protective', 'Tense'],
        crowds: ['Farmhands', 'Guards', 'Crafters', 'Messengers'],
        activities: ['Well maintenance', 'Fence repairs', 'Watch drills', 'Ration sorting'],
        rumors: ['The outer farm burned with no ash trail.', 'Night patrol hears knocking beneath the well.', 'A courier route now skips three hamlets.'],
        interactables: ['Repair barricades', 'Train watch', 'Gather locals', 'Buy basic tools'],
        hiddenThings: ['Hidden ration cache', 'Buried signal post', 'Unmarked grave ledger'],
        microPool: ['Ration Hall', 'Well House', 'Fence Workshop', 'Scout Loft', 'Field Shrine', 'Watch Cupboard'],
        scenes: ['A ration dispute erupts in Well Square.', 'A field alarm sends everyone to the gate.', 'Children repaint warning signs at dusk.'],
        opportunities: ['Earn credits fixing defenses.', 'Recruit local scouts.', 'Trade spare tools for grain vouchers.'],
        mysteries: ['A well bucket returns with black water only at noon.', 'The gate shadow points wrong at sunset.', 'A horn sounds from an abandoned tower.'],
        statsBase: { security: 6, food: 6, wealth: 4, faith: 4, fear: 5, mystery: 4, health: 6 },
        npcPool: [
          { name: 'Warden Sera', role: 'Watch Captain', need: 'Fresh patrols', secret: 'Fakes casualty numbers', faction: 'Wardens' },
          { name: 'Reeve Maln', role: 'Quartermaster', need: 'Stable stores', secret: 'Hides missing grain', faction: 'Provisioners' },
          { name: 'Scout Eris', role: 'Pathfinder', need: 'Road support', secret: 'Guides smugglers by night', faction: 'Free Scouts' }
        ]
      },
      Spire: {
        vibe: 'Vertical mystic-city where research and omen cults overlap.',
        districts: ['Spire Base', 'Archive Ring', 'Skybridge Market', 'Watcher Terrace', 'Bell District'],
        moods: ['Obsessive', 'Detached', 'Inspired', 'Uneasy'],
        crowds: ['Acolytes', 'Researchers', 'Sky traders', 'Bell wardens'],
        activities: ['Astral readings', 'Archive indexing', 'Bridge tolling', 'Bell calibration'],
        rumors: ['Watcher Terrace predicts storms before cloud rise.', 'A sealed codex writes in new ink at night.', 'Bell District counts an extra chime.'],
        interactables: ['Read omen charts', 'Purchase relic diagrams', 'Hire ascenders', 'Decode inscriptions'],
        hiddenThings: ['Forbidden codex leaf', 'Mirror chamber key', 'Cult route cipher'],
        microPool: ['Observatory Cell', 'Bell Loft', 'Codex Vault', 'Skybridge Tea Hall', 'Rune Bath', 'Hidden Reliquary'],
        scenes: ['A crowd pauses as all bells ring at once.', 'An acolyte collapses after a vision.', 'Skybridge traffic halts for an omen reading.'],
        opportunities: ['Buy predictive route charts.', 'Win relic fragments in logic games.', 'Sell survey data to archivists.'],
        mysteries: ['No shadows are cast in one archive aisle.', 'A bell toll is heard with no vibration.', 'Names spoken in the reliquary vanish from memory.'],
        statsBase: { security: 5, food: 4, wealth: 6, faith: 7, fear: 5, mystery: 8, health: 5 },
        npcPool: [
          { name: 'Acolyte Maer', role: 'Omen Reader', need: 'Quiet observatory hours', secret: 'Edits prophecies', faction: 'Temple' },
          { name: 'Curator Seln', role: 'Codex Curator', need: 'Recovered tablets', secret: 'Smuggles forbidden pages', faction: 'Archivists' },
          { name: 'Bellwarden Korr', role: 'Bell District Keeper', need: 'Stable ring schedule', secret: 'Signals a hidden cell', faction: 'Bell Ward' }
        ]
      }
    };

    function pickLocal(list) {
      if (!Array.isArray(list) || !list.length) return '';
      return list[Math.floor(Math.random() * list.length)] || list[0];
    }

    function shuffleLocal(list) {
      var out = Array.isArray(list) ? list.slice() : [];
      for (var i = out.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = out[i]; out[i] = out[j]; out[j] = t;
      }
      return out;
    }

    function buildDistrict(archetype, id, label, idx) {
      function inferKind(text) {
        var t = String(text || '').toLowerCase();
        if (t.indexOf('inn') >= 0 || t.indexOf('tavern') >= 0 || t.indexOf('pilgrim') >= 0) return 'inn';
        if (t.indexOf('hall') >= 0 || t.indexOf('steward') >= 0 || t.indexOf('lord') >= 0) return 'lord';
        if (t.indexOf('market') >= 0 || t.indexOf('harbor') >= 0 || t.indexOf('dock') >= 0) return 'merchant_items';
        if (t.indexOf('foundry') >= 0 || t.indexOf('barracks') >= 0 || t.indexOf('watch') >= 0 || t.indexOf('armory') >= 0) return 'merchant_weapons';
        if (t.indexOf('archive') >= 0 || t.indexOf('court') >= 0 || t.indexOf('shrine') >= 0 || t.indexOf('bell') >= 0) return 'mission';
        if (t.indexOf('gate') >= 0 || t.indexOf('ward') >= 0 || t.indexOf('square') >= 0 || t.indexOf('lane') >= 0) return 'downtime';
        return 'district';
      }
      var labelText = String(label || '').toLowerCase();
      var kind = inferKind(label);
      var services = {
        merchant: kind === 'merchant_items' || kind === 'merchant_weapons' || /market|harbor|dock|ring|trade|bazaar/.test(labelText),
        merchantCategory: kind === 'merchant_weapons' ? 'weapons' : 'items',
        missionBoard: kind === 'mission' || /archive|court|hall|chapel|shrine|watch|gate|ward/.test(labelText) || (idx % 3 === 1),
        gamblingDen: /market|harbor|dock|square|lane|ring|front|yard/.test(labelText) || (idx % 4 === 0),
        inn: /inn|tavern|pilgrim|hostel|chapel/.test(labelText) || (idx % 5 === 0),
        bar: /dock|market|square|lane|yard|front/.test(labelText) || (idx % 4 === 1),
        banking: /market|court|hall|steward|ledger|custom/.test(labelText) || (idx % 4 === 2),
        legal: /court|hall|steward|gate|ward|tribunal/.test(labelText) || (idx % 4 === 3),
        hospital: /shrine|chapel|barracks|ward|archive|well/.test(labelText) || (idx % 3 === 0),
        localWork: true
      };
      var microCount = 2 + Math.floor(Math.random() * 4);
      var micro = [];
      for (var mi = 0; mi < microCount; mi++) micro.push(pickLocal(archetype.microPool));
      var economicProfiles = ['salvage-heavy', 'agrarian', 'artisan', 'black-market', 'ritual', 'industrial'];
      var scarcityTiers = ['surplus', 'balanced', 'strained', 'scarce'];
      var districtEconomy = economicProfiles[(idx + Math.floor(Math.random() * economicProfiles.length)) % economicProfiles.length];
      var scarcity = scarcityTiers[Math.floor(Math.random() * scarcityTiers.length)] || 'balanced';
      return {
        id: id,
        label: label,
        kind: kind,
        services: services,
        dd: 6 + (idx % 3 === 0 ? 2 : 0) + (String(archetype.key || '') === 'Spire' ? 1 : 0),
        explored: false,
        revealed: idx === 0,
        result: '',
        atmosphere: pickLocal([
          'Dust hangs in the air like incense.',
          'Lantern light catches damp stone and iron rivets.',
          'Voices echo between narrow walls and shuttered stalls.',
          'The district hums with tired but stubborn life.'
        ]),
        npcDensity: pickLocal(archetype.crowds),
        dangerLevel: pickLocal(['Low', 'Moderate', 'High']),
        districtLandmark: pickLocal(archetype.scenes),
        factionHeadline: pickLocal(archetype.rumors),
        interactable: pickLocal(archetype.interactables),
        hiddenThing: pickLocal(archetype.hiddenThings),
        microLocations: micro,
        npcRoster: []
      };
    }

    function buildDistrictNpcRoster(archetype, label, idx) {
      var base = shuffleLocal(archetype.npcPool || []).slice(0, 2 + (idx % 2));
      return base.map(function (npc, ii) {
        return {
          id: 'npc-' + String(idx) + '-' + String(ii),
          name: String(npc.name || ('District Figure ' + (ii + 1))),
          role: String(npc.role || 'Local Notable'),
          faction: String(npc.faction || 'Locals'),
          relation: 0,
          memory: 'First impression pending in ' + String(label || 'district') + '.'
        };
      });
    }

    function buildNpcWeb(archetype) {
      var schedule = ['Morning: walls', 'Midday: market', 'Dusk: council lane', 'Night: tavern cellar'];
      var seed = shuffleLocal(archetype.npcPool || []);
      return seed.map(function (npc, idx) {
        return {
          name: String(npc.name || ('District Figure ' + (idx + 1))),
          role: String(npc.role || 'Local Notable'),
          need: String(npc.need || 'Stability'),
          secret: String(npc.secret || 'Keeps personal leverage'),
          faction: String(npc.faction || 'Locals'),
          schedule: [schedule[idx % schedule.length], schedule[(idx + 1) % schedule.length]],
          relationship: 'Knows: missing caravan, silent stranger'
        };
      });
    }

    function buildStats(archetype) {
      var base = archetype.statsBase || { security: 5, food: 5, wealth: 5, faith: 5, fear: 5, mystery: 5, health: 5 };
      var jitter = function (v) { return Math.max(0, Math.min(10, Number(v || 0) + Math.floor(Math.random() * 3) - 1)); };
      return {
        security: jitter(base.security),
        food: jitter(base.food),
        wealth: jitter(base.wealth),
        faith: jitter(base.faith),
        fear: jitter(base.fear),
        mystery: jitter(base.mystery),
        health: jitter(base.health)
      };
    }

    if (!S.holding.settlementHexcrawl || !Array.isArray(S.holding.settlementHexcrawl.nodes) || !S.holding.settlementHexcrawl.nodes.length || Number(S.holding.settlementHexcrawl.version || 0) < 2) {
      var type = String(S.holding.type || 'Fortress');
      var archetype = archetypes[type] || archetypes.Fortress;
      archetype.key = type;
      var districts = (archetype.districts || archetypes.Fortress.districts).slice();
      var count = Math.max(3, Math.min(8, districts.length - Math.floor(Math.random() * 2)));
      districts = districts.slice(0, count);
      var topoByType = {
        Fortress: {
          coords: [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: 0 }],
          edges: [['d0', 'd1'], ['d0', 'd2'], ['d0', 'd3'], ['d0', 'd4'], ['d0', 'd5'], ['d0', 'd6'], ['d1', 'd7']]
        },
        Haven: {
          coords: [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 0, r: 1 }, { q: 0, r: -1 }, { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 1, r: 1 }],
          edges: [['d0', 'd1'], ['d1', 'd2'], ['d0', 'd3'], ['d0', 'd4'], ['d0', 'd5'], ['d0', 'd6'], ['d3', 'd7']]
        },
        Spire: {
          coords: [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }, { q: 0, r: 4 }, { q: 1, r: 1 }, { q: 1, r: 2 }, { q: -1, r: 2 }],
          edges: [['d0', 'd1'], ['d1', 'd2'], ['d2', 'd3'], ['d3', 'd4'], ['d1', 'd5'], ['d2', 'd6'], ['d2', 'd7']]
        },
        Citadel: {
          coords: [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: 0 }],
          edges: [['d0', 'd1'], ['d0', 'd2'], ['d0', 'd3'], ['d0', 'd4'], ['d0', 'd5'], ['d0', 'd6'], ['d1', 'd7']]
        },
        Keep: {
          coords: [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 4, r: 0 }, { q: 1, r: 1 }, { q: 3, r: -1 }, { q: 2, r: 1 }],
          edges: [['d0', 'd1'], ['d1', 'd2'], ['d2', 'd3'], ['d3', 'd4'], ['d1', 'd5'], ['d3', 'd6'], ['d2', 'd7']]
        }
      };
      var topo = topoByType[type] || topoByType.Fortress;
      var coords = topo.coords;
      var nodes = districts.map(function (label, idx) {
        var node = buildDistrict(archetype, 'd' + String(idx), label, idx);
        node.q = (coords[idx] || { q: idx, r: 0 }).q;
        node.r = (coords[idx] || { q: idx, r: 0 }).r;
        node.revealed = true;
        node.npcRoster = buildDistrictNpcRoster(archetype, label, idx);
        return node;
      });
      var edges = (topo.edges || []).filter(function (e) {
        var a = Number(String(e[0] || '').replace('d', ''));
        var b = Number(String(e[1] || '').replace('d', ''));
        return a < nodes.length && b < nodes.length;
      });
      S.holding.settlementHexcrawl = {
        version: 2,
        holdingType: type,
        archetype: type,
        vibe: String(archetype.vibe || ''),
        timeOfDay: 'morning',
        visitCount: 0,
        activeNodeId: nodes.length ? nodes[0].id : null,
        nodes: nodes,
        edges: edges,
        ambient: {},
        ambientTables: {
          scenes: (archetype.scenes || []).slice(),
          opportunities: (archetype.opportunities || []).slice(),
          mysteries: (archetype.mysteries || []).slice()
        },
        npcWeb: buildNpcWeb(archetype),
        relationshipMemory: {},
        storylets: [],
        lastDailyTick: '',
        stats: buildStats(archetype),
        history: []
      };
    }

    var crawl = S.holding.settlementHexcrawl;
    crawl.nodes.forEach(function (n) { n.revealed = true; });
    return crawl;
  }

  function rollHoldingAmbientState(crawl) {
    var regionMode = String(crawl.regionMode || 'province').toLowerCase();
    var regionalFlavor = {
      province: {
        landmarks: ['Bell Bastion overlook', 'Salt aqueduct gatehouse', 'Old tribunal arch', 'Red quarry crane'],
        scenic: ['Rain catches on banner cords across the district roofs.', 'A candle parade winds through lane shrines at dusk.', 'Scouts return through fog with cracked lanterns.'],
        headlines: ['Faction pressure: Wardens accuse Merchants of route theft.', 'Council bulletin: emergency grain levies approved.', 'Street gossip: watch rotations quietly reduced tonight.']
      },
      sea: {
        landmarks: ['Broken lighthouse platform', 'Moon-tide drydock', 'Chain buoy gate', 'Flood chapel stairs'],
        scenic: ['Harbor bells ring under rolling fog.', 'Salt spray coats every lantern and sign.', 'A black-hulled ship cuts in without flags.'],
        headlines: ['Faction pressure: Dock guilds threaten strike at dawn.', 'Harbor bulletin: convoy lanes now permit-only.', 'Pier gossip: customs ledgers were altered overnight.']
      },
      space: {
        landmarks: ['Docking ring A-12', 'Pressure garden spindle', 'Relay mast cathedral', 'Zero-g customs node'],
        scenic: ['Cargo drones arc past the viewport in silent lines.', 'Mag boots spark along grated catwalks.', 'A shuttle burns retro-thrusters across the observation dome.'],
        headlines: ['Faction pressure: station syndicates contest fuel taxes.', 'Hub bulletin: quarantine lanes expanded to outer berths.', 'Crew gossip: one docking bay has no camera feed.']
      },
      planet: {
        landmarks: ['Dustwall transit gate', 'Orbital elevator spur', 'Survey beacon field', 'Coolant cistern ring'],
        scenic: ['Ion haze turns the skyline metallic blue.', 'Rover caravans queue beneath floodlights.', 'Ash squalls drag long shadows across the colony lanes.'],
        headlines: ['Faction pressure: colony guards and brokers split command.', 'Settlement bulletin: med supplies restricted by ration tier.', 'Worker gossip: tunnel maps no longer match reality.']
      },
      ruins: {
        landmarks: ['Collapsed observatory nave', 'Amber-sealed stairwell', 'Rune kiln court', 'Bonewire archive gate'],
        scenic: ['Dust motes drift through broken stained glass.', 'Echoes carry farther than they should.', 'Ancient mechanisms click behind sealed walls.'],
        headlines: ['Faction pressure: relic hunters clash with shrine wardens.', 'Expedition bulletin: lower vault access revoked.', 'Camp gossip: someone entered the sealed floor and returned mute.']
      }
    };
    var regionPack = regionalFlavor[regionMode] || regionalFlavor.province;
    var ambientTables = crawl.ambientTables || {};
    var scenes = Array.isArray(ambientTables.scenes) && ambientTables.scenes.length
      ? ambientTables.scenes
      : [
          'Funeral procession passes through a narrow lane.',
          'A child steals bread and vanishes into the crowd.',
          'Militia drills spill into the market square.',
          'A drunk miner collapses near a shrine.'
        ];
    var opportunities = Array.isArray(ambientTables.opportunities) && ambientTables.opportunities.length
      ? ambientTables.opportunities
      : [
          'Win a district map in a dice game.',
          'Buy discounted tools from a nervous smith.',
          'Hire a temporary scout for the next expedition.'
        ];
    var mysteries = Array.isArray(ambientTables.mysteries) && ambientTables.mysteries.length
      ? ambientTables.mysteries
      : [
          'No one enters one alley after dusk.',
          'Dogs refuse to cross a shrine threshold.',
          'A child keeps drawing the same symbol.'
        ];
    var rumorPool = crawl.nodes.map(function (n) { return n.rumor; }).filter(Boolean);
    var npc = (crawl.npcWeb || [])[Math.floor(Math.random() * Math.max(1, (crawl.npcWeb || []).length))] || { name: 'Patrol Captain' };
    var activeDistrict = crawl.nodes[Math.floor(Math.random() * Math.max(1, crawl.nodes.length))] || null;
    crawl.ambient = {
      scene: scenes[Math.floor(Math.random() * scenes.length)],
      scenicEncounter: regionPack.scenic[Math.floor(Math.random() * regionPack.scenic.length)],
      districtLandmark: regionPack.landmarks[Math.floor(Math.random() * regionPack.landmarks.length)],
      factionHeadline: regionPack.headlines[Math.floor(Math.random() * regionPack.headlines.length)],
      rumor: rumorPool[Math.floor(Math.random() * Math.max(1, rumorPool.length))] || 'People whisper about sealed tunnels.',
      activeDistrict: activeDistrict ? activeDistrict.label : 'Unknown District',
      npcMovement: 'NPC movement: ' + String(npc.name) + ' changed route this watch.',
      threatEscalation: Math.random() < 0.35 ? 'Threat escalates: crisis pressure worsened.' : 'Threat steady: no escalation this watch.',
      opportunity: opportunities[Math.floor(Math.random() * opportunities.length)],
      mysterySignal: mysteries[Math.floor(Math.random() * mysteries.length)]
    };
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    crawl.history.unshift(String(crawl.ambient.activeDistrict || 'District') + ': ' + String(crawl.ambient.scene || ''));
    crawl.history = crawl.history.slice(0, 10);
  }

  function buildHoldingHexMapHtml(crawl) {
    var nodeById = {};
    crawl.nodes.forEach(function (n) { if (n && n.id) nodeById[n.id] = n; });
    var size = 38;
    var ox = 380;
    var oy = 250;
    var toXY = function (q, r) {
      return {
        x: ox + (Math.sqrt(3) * size * (q + r / 2)),
        y: oy + ((3 / 2) * size * r)
      };
    };
    var hexPoints = function (cx, cy) {
      var pts = [];
      for (var i = 0; i < 6; i++) {
        var ang = (Math.PI / 180) * (60 * i - 30);
        pts.push((cx + size * Math.cos(ang)).toFixed(1) + ',' + (cy + size * Math.sin(ang)).toFixed(1));
      }
      return pts.join(' ');
    };
    var edgeSvg = (crawl.edges || []).map(function (e) {
      var a = nodeById[e[0]], b = nodeById[e[1]];
      if (!a || !b) return '';
      var pa = toXY(Number(a.q || 0), Number(a.r || 0));
      var pb = toXY(Number(b.q || 0), Number(b.r || 0));
      return '<line x1="' + pa.x.toFixed(1) + '" y1="' + pa.y.toFixed(1) + '" x2="' + pb.x.toFixed(1) + '" y2="' + pb.y.toFixed(1) + '" stroke="rgba(126,215,255,.35)" stroke-width="2" />';
    }).join('');
    var nodeSvg = crawl.nodes.map(function (n) {
      var p = toXY(Number(n.q || 0), Number(n.r || 0));
      var selected = String(crawl.activeNodeId || '') === String(n.id);
      var stroke = selected ? 'rgba(240,208,112,.95)' : (n.explored ? 'rgba(76,175,116,.9)' : 'rgba(126,215,255,.75)');
      var fill = n.explored ? 'rgba(76,175,116,.2)' : 'rgba(20,30,44,.88)';
      return '<g>'
        + '<polygon points="' + hexPoints(p.x, p.y) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" style="cursor:pointer;" onclick="selectHoldingSettlementDistrict(\'' + String(n.id) + '\')" />'
        + '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 3).toFixed(1) + '" text-anchor="middle" font-size="12" fill="var(--gold2)">' + String(n.label || 'District').slice(0, 12) + '</text>'
        + '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 15).toFixed(1) + '" text-anchor="middle" font-size="10" fill="var(--muted2)">' + (n.explored ? 'Visited' : 'New') + '</text>'
        + '</g>';
    }).join('');
    var glyphs = [];
    for (var i = 0; i < 14; i++) {
      var gx = 28 + ((i * 53) % 700);
      var gy = 24 + ((i * 67) % 440);
      var glyph = (i % 4 === 0) ? '✶' : (i % 4 === 1 ? '◌' : (i % 4 === 2 ? '⟡' : 'ᚠ'));
      glyphs.push('<text x="' + gx + '" y="' + gy + '" text-anchor="middle" font-size="7" fill="rgba(126,215,255,.35)">' + glyph + '</text>');
    }
    var shelfFar = [];
    var shelfNear = [];
    for (var sy = 0; sy < 8; sy++) shelfFar.push('<line x1="-20" y1="' + (40 + sy * 58) + '" x2="820" y2="' + (24 + sy * 58) + '" stroke="rgba(126,215,255,.12)" stroke-width="1" />');
    for (var sz = 0; sz < 6; sz++) shelfNear.push('<line x1="-30" y1="' + (56 + sz * 74) + '" x2="830" y2="' + (76 + sz * 74) + '" stroke="rgba(201,162,39,.12)" stroke-width="1.1" />');
    return '<div style="border:1px solid rgba(126,215,255,.24);background:linear-gradient(180deg,rgba(14,22,34,.92) 0%, rgba(8,13,22,.98) 100%);padding:.32rem;border-radius:4px;box-shadow:inset 0 0 26px rgba(126,215,255,.08);">'
      + '<svg viewBox="0 0 760 500" style="width:100%;max-width:1080px;height:auto;display:block;margin:0 auto;">'
      + '<g>' + shelfFar.join('') + '</g>'
      + '<g>' + shelfNear.join('') + '</g>'
      + '<g>' + glyphs.join('') + '</g>'
      + edgeSvg + nodeSvg + '</svg>'
      + '</div>';
  }

  function rerenderHoldingSettlementHexcrawl(opts) {
    var prevScrollTop = 0;
    var prevPageScrollTop = 0;
    if (typeof document !== 'undefined') {
      var contentEl = document.getElementById('modalContent');
      if (contentEl) prevScrollTop = Number(contentEl.scrollTop || 0);
      var rootEl = document.scrollingElement || document.documentElement || document.body;
      if (rootEl) prevPageScrollTop = Number(rootEl.scrollTop || 0);
    }
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal(opts || { advanceVisit: false }));
    if (typeof setTimeout === 'function') {
      setTimeout(function () {
        if (typeof document === 'undefined') return;
        var contentEl = document.getElementById('modalContent');
        if (contentEl) contentEl.scrollTop = prevScrollTop;
        var rootEl = document.scrollingElement || document.documentElement || document.body;
        if (rootEl && Number(rootEl.scrollTop || 0) < prevPageScrollTop) rootEl.scrollTop = prevPageScrollTop;
      }, 0);
    }
  }

  function buildHoldingPendingEventHtml() {
    var evt = S.holding && S.holding.pendingDowntimeEvent;
    if (!evt) {
      return '<div style="font-size:.68rem;color:var(--muted2);line-height:1.55;">Use district actions to surface work, rumors, local games, and mission leads. Results will appear here.</div>';
    }
    var stats = ['lead', 'mind', 'body', 'spirit', 'control', 'strike', 'shoot', 'defend'];
    return '<div style="padding:.34rem .4rem;border:1px solid rgba(126,215,255,.22);background:rgba(126,215,255,.05);">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.08em;color:var(--teal);">' + evt.name + '</div>'
      + '<div style="font-size:.74rem;color:var(--muted2);margin-top:.12rem;line-height:1.52;">Choose an Action Die vs DD' + evt.dd + '.</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.24rem;">'
      + stats.map(function (key) { return '<button class="btn btn-xs btn-teal" onclick="resolveHoldingDowntimeEvent(\'' + key + '\')">' + key.charAt(0).toUpperCase() + key.slice(1) + '</button>'; }).join('')
      + '</div>'
      + '</div>';
  }

  function openHoldingGamblingDen(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); }) || crawl.nodes[0];
    if (node) {
      node.result = 'The local gambling den is open tonight. Dice crews are loud, the table is hot, and wagers are moving fast.';
      crawl.activeNodeId = node.id;
      crawl.gamblingActiveNodeId = node.id;
    }
    if (typeof showNotif === 'function') showNotif('Gambling den is now open in this district.', 'info');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function getHoldingBankState() {
    ensureNewFeatureState();
    if (!S.holding.bank || typeof S.holding.bank !== 'object') {
      S.holding.bank = {
        invested: 0,
        accrued: 0,
        risk: 'low',
        lastTickAt: 0,
        history: []
      };
    }
    if (!Array.isArray(S.holding.bank.history)) { S.holding.bank.history = []; }
    return S.holding.bank;
  }

  function getHoldingBankRiskText(risk) {
    if (risk === 'medium') return 'Medium Risk';
    if (risk === 'high') return 'High Risk';
    return 'Low Risk';
  }

  function getHoldingBankRiskDetails(risk) {
    if (risk === 'medium') {
      return '15-20% risk · Moderate · Consistent growth can gain 20-50 Credits, but can also lose 10 Credits.';
    }
    if (risk === 'high') {
      return '50-55% risk · Aggressive · Can swing +/− about half the deposit each day.';
    }
    return '0-2% risk · Minimal · Passive income with 20 Credits per in-game day, no management needed.';
  }

  function tickHoldingBankInvestments(days) {
    var bank = getHoldingBankState();
    var stepCount = Math.max(1, Number(days || 1));
    if (Number(bank.invested || 0) <= 0 && Number(bank.accrued || 0) <= 0) { return false; }
    for (var i = 0; i < stepCount; i++) {
      var risk = String(bank.risk || 'low');
      var note = '';
      if (risk === 'medium') {
        if (Math.random() < 0.2) {
          bank.invested = Math.max(0, Number(bank.invested || 0) - 10);
          note = 'Medium Risk drift: -10 Credits.';
        } else {
          var gain = 20 + (Math.floor(Math.random() * 4) * 10);
          bank.invested = Number(bank.invested || 0) + gain;
          note = 'Medium Risk growth: +' + gain + ' Credits.';
        }
      } else if (risk === 'high') {
        var base = Math.max(0, Number(bank.invested || 0));
        if (base > 0 && Math.random() < 0.55) {
          var highGain = Math.max(1, Math.round(base * (0.50 + (Math.random() * 0.05))));
          bank.invested = base + highGain;
          note = 'High Risk surge: +' + highGain + ' Credits.';
        } else {
          var highLoss = Math.max(1, Math.round(base * (0.50 + (Math.random() * 0.05))));
          bank.invested = Math.max(0, base - highLoss);
          note = 'High Risk loss: -' + highLoss + ' Credits.';
        }
      } else {
        bank.accrued = Number(bank.accrued || 0) + 20;
        note = 'Low Risk care payment: +20 Credits.';
      }
      bank.history.unshift(note);
    }
    bank.history = bank.history.slice(0, 8);
    bank.lastTickAt = Date.now();
    return true;
  }

  function buildHoldingBankPanelHtml() {
    var bank = getHoldingBankState();
    var total = Math.max(0, Number(bank.invested || 0) + Number(bank.accrued || 0));
    var note = bank.history && bank.history.length ? String(bank.history[0]) : 'No active treasury position.';
    return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;margin-bottom:.35rem;">'
      + '<div style="border:1px solid var(--border2);padding:.3rem .35rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);">Invested</div><div style="font-size:.9rem;color:var(--gold2);">' + Number(bank.invested || 0) + '₵</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.3rem .35rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);">Accrued</div><div style="font-size:.9rem;color:var(--teal);">' + Number(bank.accrued || 0) + '₵</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.3rem .35rem;background:rgba(255,255,255,.02);"><div style="font-size:.62rem;color:var(--muted2);">Total</div><div style="font-size:.9rem;color:var(--green2);">' + total + '₵</div></div>'
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.2rem;">Risk: <strong style="color:var(--gold2);">' + getHoldingBankRiskText(bank.risk) + '</strong></div>'
      + '<div style="font-size:.68rem;color:var(--muted2);line-height:1.45;">' + getHoldingBankRiskDetails(bank.risk) + '</div>'
      + '<div style="font-size:.68rem;color:var(--text2);margin-top:.25rem;">Latest: ' + String(note || 'No active treasury position.') + '</div>';
  }

  function openHoldingBankingModal() {
    ensureNewFeatureState();
    var bank = getHoldingBankState();
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.55;">'
      + '<div style="margin-bottom:.3rem;">Deposit credits into the Holdings Treasury, then pick how carefully the bank should manage them.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;margin-bottom:.35rem;">'
      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);"><div style="font-size:.66rem;color:var(--muted2);">Invested</div><div style="font-size:.92rem;color:var(--gold2);">' + Number(bank.invested || 0) + '₵</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);"><div style="font-size:.66rem;color:var(--muted2);">Accrued</div><div style="font-size:.92rem;color:var(--teal);">' + Number(bank.accrued || 0) + '₵</div></div>'
      + '<div style="border:1px solid var(--border2);padding:.35rem .4rem;background:rgba(255,255,255,.02);"><div style="font-size:.66rem;color:var(--muted2);">Total</div><div style="font-size:.92rem;color:var(--green2);">' + (Number(bank.invested || 0) + Number(bank.accrued || 0)) + '₵</div></div>'
      + '</div>'
      + '<div style="margin-bottom:.25rem;font-size:.72rem;color:var(--muted2);">Current care tier: <strong style="color:var(--gold2);">' + getHoldingBankRiskText(bank.risk) + '</strong></div>'
      + '<div style="margin-bottom:.25rem;font-size:.7rem;color:var(--muted2);">' + getHoldingBankRiskDetails(bank.risk) + '</div>'
      + '<div style="margin-bottom:.35rem;display:flex;gap:.3rem;align-items:center;flex-wrap:wrap;">'
      + '<input id="holdingBankAmount" class="bp-input" type="number" min="1" step="1" value="100" placeholder="Amount to deposit" style="max-width:180px;">'
      + '<span style="font-size:.7rem;color:var(--muted2);">Choose a risk tier to commit the deposit.</span>'
      + '</div>'
      + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.35rem;">'
      + '<button class="btn btn-sm btn-teal" onclick="commitHoldingBankInvestmentFromModal(\'low\');">Low Risk</button>'
      + '<button class="btn btn-sm btn-primary" onclick="commitHoldingBankInvestmentFromModal(\'medium\');">Medium Risk</button>'
      + '<button class="btn btn-sm btn-red" onclick="commitHoldingBankInvestmentFromModal(\'high\');">High Risk</button>'
      + '</div>'
      + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm" onclick="withdrawHoldingBankInvestment();">Withdraw All</button>'
      + '<button class="btn btn-sm" onclick="closeModal();">Close</button>'
      + '</div>'
      + '<div style="margin-top:.35rem;font-size:.68rem;color:var(--muted2);">Recent ledger</div>'
      + ((Array.isArray(bank.history) && bank.history.length) ? bank.history.slice(0, 5).map(function (entry) {
          return '<div style="font-size:.7rem;color:var(--text2);margin-top:.12rem;">• ' + String(entry) + '</div>';
        }).join('') : '<div style="font-size:.7rem;color:var(--muted2);margin-top:.12rem;">No deposits yet.</div>')
      + '</div>';
    if (typeof openModal === 'function') openModal('Holdings Treasury', html);
    return true;
  }

  function commitHoldingBankInvestmentFromModal(risk) {
    var amountInput = document.getElementById('holdingBankAmount');
    var amount = Math.max(1, Math.floor(Number(amountInput ? amountInput.value : 0) || 0));
    return commitHoldingBankInvestment(amount, risk);
  }

  function commitHoldingBankInvestment(amount, risk) {
    ensureNewFeatureState();
    var bank = getHoldingBankState();
    var value = Math.max(1, Math.floor(Number(amount || 0)));
    if ((S.credits || 0) < value) {
      if (typeof showNotif === 'function') showNotif('Not enough Credits to deposit that amount.', 'warn');
      return false;
    }
    S.credits = Math.max(0, Number(S.credits || 0) - value);
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    bank.invested = Number(bank.invested || 0) + value;
    bank.risk = String(risk || bank.risk || 'low');
    bank.history.unshift('Deposited ' + value + ' Credits into ' + getHoldingBankRiskText(bank.risk) + '.');
    bank.history = bank.history.slice(0, 8);
    renderHoldingUI();
    if (typeof showNotif === 'function') showNotif('Deposited ' + value + ' Credits into the Holdings Treasury.', 'good');
    return true;
  }

  function withdrawHoldingBankInvestment() {
    var bank = getHoldingBankState();
    var total = Math.max(0, Number(bank.invested || 0) + Number(bank.accrued || 0));
    if (total <= 0) {
      if (typeof showNotif === 'function') showNotif('Nothing is currently in the treasury.', 'warn');
      return false;
    }
    S.credits = Number(S.credits || 0) + total;
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    bank.invested = 0;
    bank.accrued = 0;
    bank.risk = 'low';
    bank.history.unshift('Withdrew ' + total + ' Credits from the treasury.');
    bank.history = bank.history.slice(0, 8);
    renderHoldingUI();
    if (typeof showNotif === 'function') showNotif('Withdrawn ' + total + ' Credits from the Holdings Treasury.', 'good');
    return true;
  }

  function advanceHoldingOneDay() {
    if (typeof tickHoldingBankInvestments === 'function') {
      try { tickHoldingBankInvestments(1); } catch (_bankErr) {}
    }
    if (typeof advanceDay === 'function') {
      advanceDay(1);
      return;
    }
    if (typeof advanceProvincePhasePenalty === 'function') {
      advanceProvincePhasePenalty(3);
    }
  }

  function clearHoldingMedicalState() {
    if (typeof clearStress === 'function') clearStress();
    else if (typeof changeStress === 'function') changeStress(-999);
    if (typeof clearMentalStress === 'function') clearMentalStress();
    else if (typeof changeMentalStress === 'function') changeMentalStress(-999);
    if (typeof clearAllConditions === 'function') clearAllConditions();
    if (typeof S !== 'undefined' && S) {
      S.trauma = 0;
      if (S.radiationState && typeof S.radiationState === 'object') {
        S.radiationState.gainTicks = 0;
        S.radiationState.mutations = [];
        if (S.radiationState.statPenalty && typeof S.radiationState.statPenalty === 'object') {
          Object.keys(S.radiationState.statPenalty).forEach(function (key) {
            S.radiationState.statPenalty[key] = 0;
          });
        }
      }
      if (Array.isArray(S.injuries)) S.injuries = [];
      S.scarState = {
        avoidedDeaths: 0,
        results: [],
        tmwCostPenalty: 0,
        rollPenalty: 0,
        cannotEscapeCombat: false,
        loseHealthOnFailedRoll: false,
        baseTeamwork: Number(S.tmw || 0),
        inProgress: false
      };
    }
    if (typeof updateTrauma === 'function') updateTrauma();
    if (typeof updateInjuryUI === 'function') updateInjuryUI();
    if (typeof updateScarUI === 'function') updateScarUI();
    if (typeof renderBackpackUI === 'function') renderBackpackUI();
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  }

  function runHoldingLocalWork(node) {
    if (!node) { return; }
    var bodyDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('body') : ((S.stats && S.stats.body) || 4);
    var actionRoll = explodingRoll(bodyDie, { type: 'action', major: true, label: 'Holding Local Work BODY d' + bodyDie });
    var dreadRoll = explodingRoll(6, { type: 'dread', major: true, label: 'Holding Local Work DD6' });
    var success = Number(actionRoll.total || 0) >= Number(dreadRoll.total || 0);
    var msg = 'Local shift (Body vs Dread d6): Body d' + bodyDie + ' ' + actionRoll.total + ' vs DD6 ' + dreadRoll.total + '. ';
    advanceHoldingOneDay();
    if (success) {
      S.credits = Number(S.credits || 0) + 100;
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
      msg += 'Shift complete. +100 Credits and +1 day advanced.';
    } else {
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      msg += 'Rough shift. +1 day advanced and +1 Mental Stress from overwork.';
    }
    node.result = msg;
    var crawl = ensureHoldingSettlementHexcrawl();
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    crawl.history.unshift(String(node.label || 'District') + ': ' + msg);
    crawl.history = crawl.history.slice(0, 12);
    if (typeof showNotif === 'function') showNotif(msg, success ? 'good' : 'warn');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function openHoldingMerchantDistrict(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var services = node.services || {};
    if (!services.merchant) {
      if (typeof showNotif === 'function') showNotif('No active merchant stalls in this district right now.', 'warn');
      return;
    }
    var cat = String(services.merchantCategory || 'items');
    if (cat === 'weapons') cat = 'weapon_mods';
    node.result = 'Merchant stalls are active. Redirecting to Merchants (' + cat + ').';
    if (typeof switchTab === 'function') {
      var btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('shop'\"]");
      switchTab('shop', btn || null);
    }
    if (typeof showShopCat === 'function') {
      try { showShopCat(cat, null); } catch (_err) {}
    }
    if (typeof showNotif === 'function') showNotif('Merchants access opened in ' + node.label + ' (' + cat + ').', 'info');
  }

  var HOLDING_TRADE_GOODS = [
    { name: 'Trade Goods: Grain Bales', baseValue: 40 },
    { name: 'Trade Goods: Medicine Crates', baseValue: 60 },
    { name: 'Trade Goods: Machine Parts', baseValue: 75 },
    { name: 'Trade Goods: Textiles', baseValue: 45 },
    { name: 'Trade Goods: Preserved Food', baseValue: 50 },
    { name: 'Trade Goods: Fuel Cells', baseValue: 80 }
  ];

  var HOLDING_MARKET_STATE_TABLE = {
    oversupplied: { label: 'Oversupplied', multiplier: 0.5 },
    normal: { label: 'Normal', multiplier: 1 },
    desired: { label: 'Desired', multiplier: 2 },
    desperate: { label: 'Desperate', multiplier: 3 }
  };

  function normalizeTradeGoodName(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isHoldingTradeGood(name) {
    var norm = normalizeTradeGoodName(name);
    return HOLDING_TRADE_GOODS.some(function (entry) {
      return normalizeTradeGoodName(entry.name) === norm;
    });
  }

  function getHoldingTradeGoodBaseValue(name) {
    var norm = normalizeTradeGoodName(name);
    for (var i = 0; i < HOLDING_TRADE_GOODS.length; i++) {
      if (normalizeTradeGoodName(HOLDING_TRADE_GOODS[i].name) === norm) {
        return Math.max(10, Number(HOLDING_TRADE_GOODS[i].baseValue || 40));
      }
    }
    return 40;
  }

  function rollHoldingMarketState() {
    var r = Math.max(1, Math.min(100, Number(roll(100) || 1)));
    if (r <= 20) return 'oversupplied';
    if (r <= 70) return 'normal';
    if (r <= 90) return 'desired';
    return 'desperate';
  }

  function ensureHoldingDistrictMarket(node) {
    if (!node || typeof node !== 'object') {
      return { state: 'normal', desiredItem: HOLDING_TRADE_GOODS[0].name };
    }
    var today = getCurrentGameDayStampLocal() || String(Date.now());
    var trade = node.tradeMarket && typeof node.tradeMarket === 'object' ? node.tradeMarket : null;
    if (!trade || String(trade.dayStamp || '') !== String(today)) {
      var state = rollHoldingMarketState();
      var desired = pick(HOLDING_TRADE_GOODS).name;
      node.tradeMarket = {
        dayStamp: String(today),
        state: state,
        desiredItem: desired,
        salesToday: 0
      };
      trade = node.tradeMarket;
    }
    if (!trade.state || !HOLDING_MARKET_STATE_TABLE[trade.state]) trade.state = 'normal';
    if (!trade.desiredItem) trade.desiredItem = pick(HOLDING_TRADE_GOODS).name;
    return trade;
  }

  function buildHoldingMerchantBrowsePreview(market) {
    var offers = [
      'Ration Kit', 'Tool Kit', 'Medicine Satchel', 'Scrap Rifle',
      'Stimulant', 'Wound Salve', 'Signal Flare', 'Scope Lens',
      'Portable Shield Emitter', 'Adrenal Injector', 'Spoolwire', 'Field Battery'
    ];
    var categories = ['weapon_mods', 'supplies', 'curios', 'combat_kits'];
    var picked = [];
    var pool = offers.slice();
    while (pool.length && picked.length < 3) {
      var idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    var tradeGoodA = pick(HOLDING_TRADE_GOODS).name;
    var tradeGoodB = market && market.desiredItem ? String(market.desiredItem) : pick(HOLDING_TRADE_GOODS).name;
    if (picked.indexOf(tradeGoodA) < 0) picked.push(tradeGoodA);
    if (picked.indexOf(tradeGoodB) < 0) picked.push(tradeGoodB);
    return {
      category: categories[Math.floor(Math.random() * categories.length)],
      offers: picked,
      marketState: market && market.state ? String(market.state) : 'normal',
      desiredItem: market && market.desiredItem ? String(market.desiredItem) : tradeGoodB
    };
  }

  function getHoldingBrowseOfferCost(offerName) {
    var name = String(offerName || '').trim();
    if (!name) return 50;
    if (isHoldingTradeGood(name)) {
      return getHoldingTradeGoodBaseValue(name);
    }
    var catalog = [
      (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && SHOP_DATA.items) ? SHOP_DATA.items : [],
      (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && SHOP_DATA.essentials) ? SHOP_DATA.essentials : [],
      (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && SHOP_DATA.weapons) ? SHOP_DATA.weapons : [],
      (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && SHOP_DATA.weapon_mods) ? SHOP_DATA.weapon_mods : [],
      (typeof SHOP_DATA !== 'undefined' && SHOP_DATA && SHOP_DATA.armor) ? SHOP_DATA.armor : []
    ];
    for (var c = 0; c < catalog.length; c++) {
      var list = catalog[c] || [];
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it || !it.name) continue;
        if (String(it.name).toLowerCase() === name.toLowerCase()) return Math.max(10, Number(it.cost || 50));
      }
    }
    return 50;
  }

  function buyHoldingBrowseOffer(nodeId, offerName) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node || !node.browsePreview || !Array.isArray(node.browsePreview.offers)) return;
    var offer = String(offerName || '').trim();
    if (!offer || node.browsePreview.offers.indexOf(offer) < 0) return;
    var cost = getHoldingBrowseOfferCost(offer);
    if (Number(S.credits || 0) < cost) {
      node.result = 'Not enough credits to buy ' + offer + ' (' + cost + '₵).';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    S.credits = Math.max(0, Number(S.credits || 0) - cost);
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    if (typeof addToBackpack === 'function' && !addToBackpack(offer)) {
      node.result = 'Backpack full. Could not buy ' + offer + '.';
      S.credits = Number(S.credits || 0) + cost;
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    node.result = 'Purchased ' + offer + ' for ' + cost + '₵.';
    if (window.TrophySystem) window.TrophySystem.check('first_shop_purchase');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function sellHoldingBrowseBackpackItem(nodeId, slotIdx) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    if (!Array.isArray(S.backpack)) {
      node.result = 'Backpack unavailable.';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    var idx = Number(slotIdx || 0);
    var entry = String(S.backpack[idx] || '').trim();
    if (!entry) {
      node.result = 'That backpack slot is empty.';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    var unit = parseBackpackStack(entry);
    var itemName = String(unit.name || entry);
    var sale = Math.max(10, Math.floor(getHoldingBrowseOfferCost(itemName) * 0.5));
    var market = ensureHoldingDistrictMarket(node);
    var marketMeta = HOLDING_MARKET_STATE_TABLE[String(market.state || 'normal')] || HOLDING_MARKET_STATE_TABLE.normal;
    var desiredMatch = normalizeTradeGoodName(itemName) === normalizeTradeGoodName(market.desiredItem);
    var renownAwarded = false;
    if (isHoldingTradeGood(itemName)) {
      var multiplier = Number(marketMeta.multiplier || 1);
      if (!S.caravan || !S.caravan.owned) multiplier *= 0.75;
      sale = Math.max(10, Math.floor(getHoldingTradeGoodBaseValue(itemName) * multiplier));
      if (desiredMatch && (market.state === 'desired' || market.state === 'desperate')) {
        renownAwarded = true;
      }
      market.salesToday = Number(market.salesToday || 0) + 1;
    }
    if (typeof removeBackpackItem === 'function') removeBackpackItem(idx);
    else S.backpack[idx] = '';
    S.credits = Number(S.credits || 0) + sale;
    if (renownAwarded) {
      if (typeof changeCounter === 'function') changeCounter('renown', 1);
      else S.renown = Math.max(0, Number(S.renown || 0) + 1);
      market.desiredItem = pick(HOLDING_TRADE_GOODS).name;
    }
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    if (typeof renderBackpackUI === 'function') renderBackpackUI();
    node.result = 'Sold ' + itemName + ' for ' + sale + '₵. Market: ' + marketMeta.label + ' x' + marketMeta.multiplier + '.'
      + (renownAwarded ? ' Delivery stabilized demand: +1 Renown.' : '');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function getCurrentGameDayStampLocal() {
    if (typeof getCurrentGameDayStamp === 'function') return String(getCurrentGameDayStamp() || '');
    if (S && S.gameDate && typeof S.gameDate === 'object') {
      return [Number(S.gameDate.year || 1), Number(S.gameDate.month || 1), Number(S.gameDate.day || 1)].join('-');
    }
    return '';
  }

  function ensureHoldingStorylets(crawl) {
    crawl.storylets = Array.isArray(crawl.storylets) ? crawl.storylets : [];
    if (crawl.storylets.length) return;
    var nodes = Array.isArray(crawl.nodes) ? crawl.nodes : [];
    var picks = nodes.slice(0, 3);
    picks.forEach(function (node, idx) {
      crawl.storylets.push({
        id: 'storylet-' + String(idx + 1),
        districtId: node && node.id ? node.id : '',
        title: pick(['Missing Courier Chain', 'Market Sabotage Ring', 'Quiet Shrine Omen', 'Barracks Debt Spiral']),
        stage: 1,
        ignoredDays: 0,
        resolved: false
      });
    });
  }

  function tickHoldingSettlementDaily(days) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var d = Math.max(1, Number(days || 1));
    ensureHoldingStorylets(crawl);
    crawl.storylets.forEach(function (s) {
      if (!s || s.resolved) return;
      s.ignoredDays = Number(s.ignoredDays || 0) + d;
      if (s.ignoredDays >= 2 && Number(s.stage || 1) < 3) {
        s.stage = Number(s.stage || 1) + 1;
        s.ignoredDays = 0;
      }
    });
  }

  function updateHoldingDailyProgress() {
    var crawl = ensureHoldingSettlementHexcrawl();
    var stamp = getCurrentGameDayStampLocal();
    if (!stamp) return;
    if (!crawl.lastDailyTick) {
      crawl.lastDailyTick = stamp;
      return;
    }
    if (crawl.lastDailyTick !== stamp) {
      tickHoldingSettlementDaily(1);
      crawl.lastDailyTick = stamp;
    }
  }

  function recordHoldingNpcInteraction(node, mood, note) {
    var crawl = ensureHoldingSettlementHexcrawl();
    if (!node || !Array.isArray(node.npcRoster) || !node.npcRoster.length) return;
    crawl.relationshipMemory = crawl.relationshipMemory || {};
    var target = node.npcRoster[Math.floor(Math.random() * node.npcRoster.length)] || null;
    if (!target) return;
    var k = String(target.id || target.name || 'npc');
    var rel = crawl.relationshipMemory[k] || { score: 0, notes: [] };
    rel.score += (mood === 'positive' ? 1 : (mood === 'negative' ? -1 : 0));
    rel.notes.unshift(String(note || 'Conversation logged.') + ' (' + String(node.label || 'District') + ')');
    rel.notes = rel.notes.slice(0, 4);
    crawl.relationshipMemory[k] = rel;
    target.relation = rel.score;
    target.memory = rel.notes[0];
  }

  function openHoldingDistrictSideTask(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var die = (typeof getEffectiveDie === 'function') ? getEffectiveDie('lead') : ((S.stats && S.stats.lead) || 4);
    var a = explodingRoll(die, { type: 'action', major: true, label: 'District Side Task LEAD d' + die });
    var d = explodingRoll(6, { type: 'dread', major: true, label: 'District Side Task DD6' });
    var success = Number(a.total || 0) >= Number(d.total || 0);
    if (success) {
      S.credits = Number(S.credits || 0) + 45;
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
      if (typeof changeCounter === 'function') changeCounter('tmw', 1);
    } else {
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      if (typeof addTMWOnFail === 'function') addTMWOnFail();
    }
    node.result = 'Side task (' + String(node.label || 'District') + '): Lead d' + die + '=' + a.total + ' vs DD6=' + d.total + '. '
      + (success ? 'Task closed locally. +45 Credits, +1 Teamwork.' : 'Complication triggered. +1 Mental Stress.');
    recordHoldingNpcInteraction(node, success ? 'positive' : 'negative', success ? 'Closed a side task quickly.' : 'A side task spiraled.');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function openHoldingDistrictMissionPickup(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var services = node.services || {};
    if (!services.missionBoard) {
      node.result = 'No active mission board in this district. Ask for rumors or try another district.';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    var missionTitle = pick([
      'Settlement Contract: ' + String(node.label || 'District') + ' Stabilization',
      'Settlement Contract: Secure ' + String(node.label || 'District') + ' Route',
      'Settlement Contract: Civic Relief Sweep'
    ]);
    var posted = false;
    if (typeof createMission === 'function') {
      var created = createMission(
        'Settlement Board',
        missionTitle,
        pick(['easy', 'medium', 'hard']),
        String(node.label || 'Holding District'),
        'province',
        { gain: 'Grey Kingdom', lose: 'Nomad Clans' },
        { missionType: 'settlement_management', source: 'holding_settlement_board' }
      );
      posted = !!created;
    }
    if (!posted && typeof generateTask === 'function') generateTask();
    node.result = posted
      ? 'Mission board posted a live contract in Missions.'
      : 'Mission board refreshed. New contracts are ready to review.';
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    crawl.history.unshift(String(node.label || 'District') + ': Mission board refreshed.');
    crawl.history = crawl.history.slice(0, 12);
    if (typeof switchTab === 'function') {
      var missionBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('missions'\"]");
      switchTab('missions', missionBtn || null);
    }
    if (typeof showNotif === 'function') showNotif((posted ? 'Contract posted to Missions: ' : 'New mission posted in ') + node.label + '.', 'good');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function openHoldingSettlementSewerRoute(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    var depthHex = (typeof mapData !== 'undefined' && Array.isArray(mapData))
      ? mapData.find(function (hex) { return hex && String(hex.type || '') === 'depths'; })
      : null;
    if (!depthHex || typeof openProvinceDepthsPopup !== 'function') {
      if (node) node.result = 'Sewer grates are mapped, but no megadungeon entrance is active in this province yet.';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    if (node) node.result = 'You route through the sewer culverts toward ' + String(depthHex.name || 'the Lantern Below') + '.';
    if (typeof showNotif === 'function') showNotif('Sewer route opened to the megadungeon entrance.', 'info');
    openProvinceDepthsPopup(depthHex.col, depthHex.row);
  }

  function runHoldingDistrictFlavorAction(nodeId, action) {
    updateHoldingDailyProgress();
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) {
      if (typeof showNotif === 'function') showNotif('Select a district first.', 'warn');
      return;
    }
    crawl.activeNodeId = node.id;
    var ambient = crawl.ambient || {};
    var msg = '';
    if (action === 'rumor') {
      msg = 'Rumor sweep: ' + String(node.rumor || ambient.rumor || 'The district is quiet for now.') + ' Opportunity: ' + String(ambient.opportunity || 'Nothing immediate.');
      recordHoldingNpcInteraction(node, 'neutral', 'Collected district rumors.');
    } else if (action === 'browse') {
      var market = ensureHoldingDistrictMarket(node);
      node.browsePreview = buildHoldingMerchantBrowsePreview(market);
      var marketMeta = HOLDING_MARKET_STATE_TABLE[String(market.state || 'normal')] || HOLDING_MARKET_STATE_TABLE.normal;
      msg = 'Merchants loaded local stock (' + String(node.browsePreview.category || 'mixed') + '). Market: '
        + marketMeta.label + ' x' + marketMeta.multiplier + '. Desired: ' + String(market.desiredItem || 'Trade Goods');
    } else if (action === 'event') {
      msg = 'Random encounter: ' + String(ambient.scene || 'People surge through the lanes.') + ' ' + String(ambient.npcMovement || '');
      recordHoldingNpcInteraction(node, 'neutral', 'Handled a district random encounter.');
    } else if (action === 'downtime_talk') {
      rollHoldingDowntimeActivity('talk');
      recordHoldingNpcInteraction(node, 'positive', 'Spent time talking with locals.');
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    } else if (action === 'downtime_task') {
      runHoldingLocalWork(node);
      return;
    } else if (action === 'downtime_explore') {
      rollHoldingDowntimeActivity('explore');
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    } else if (action === 'gamble') {
      if (!node.services || !node.services.gamblingDen) {
        node.result = 'No gambling den is running in this district tonight.';
        rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
        return;
      }
      openHoldingGamblingDen(node.id);
      return;
    }
    node.result = msg || node.result;
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    if (msg) {
      crawl.history.unshift(String(node.label || 'District') + ': ' + msg);
      crawl.history = crawl.history.slice(0, 12);
      if (typeof showNotif === 'function') showNotif(msg, 'info');
    }
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function ensureHoldingGamblingState(crawl, node) {
    crawl.gambling = crawl.gambling || {};
    var key = String((node && node.id) || crawl.activeNodeId || 'district');
    if (!crawl.gambling[key] || typeof crawl.gambling[key] !== 'object') {
      crawl.gambling[key] = {
        level: 1,
        guess: '',
        dieOne: '-',
        dieTwo: '-',
        adventure: '-',
        outcome: 'Pick a difficulty and guess, then play a hand.',
        history: []
      };
    }
    return crawl.gambling[key];
  }

  function toggleHoldingGamblingNode(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var key = String(nodeId || '');
    if (!key) {
      crawl.gamblingActiveNodeId = '';
    } else {
      crawl.gamblingActiveNodeId = String(crawl.gamblingActiveNodeId || '') === key ? '' : key;
      crawl.activeNodeId = key;
    }
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function holdingGambleAdventureDie(level) {
    var map = { 1: 20, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4 };
    var key = Math.max(1, Math.min(6, Number(level || 1)));
    return map[key] || 20;
  }

  function buildHoldingGamblingEmbedHtml(node, crawl) {
    if (!node || !crawl) return '';
    var state = ensureHoldingGamblingState(crawl, node);
    var level = Math.max(1, Math.min(6, Number(state.level || 1)));
    var buyIn = level * 10;
    var advDie = holdingGambleAdventureDie(level);
    var historyHtml = (state.history || []).slice(0, 6).map(function (line) {
      return '<div style="font-size:.68rem;color:var(--muted2);line-height:1.45;">• ' + String(line || '') + '</div>';
    }).join('');
    var levelButtons = [1, 2, 3, 4, 5, 6].map(function (lv) {
      var on = lv === level;
      return '<button type="button" class="btn btn-xs' + (on ? ' btn-teal' : '') + '" onclick="setHoldingGamblingDifficulty(\'' + String(node.id) + '\',' + lv + ')">L' + lv + ' (' + (lv * 10) + '₵)</button>';
    }).join('');
    var guessBtn = function (key, label) {
      var on = String(state.guess || '') === key;
      return '<button type="button" class="btn btn-xs' + (on ? ' btn-teal' : '') + '" onclick="setHoldingGamblingGuess(\'' + String(node.id) + '\',\'' + key + '\')">' + label + '</button>';
    };
    return '<div style="margin-top:.14rem;padding:.34rem .38rem;border:1px solid rgba(201,162,39,.35);background:rgba(201,162,39,.06);">'
      + '<div style="font-size:.68rem;color:var(--gold2);text-transform:uppercase;letter-spacing:.08em;">Embedded Gambling Den</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-top:.12rem;line-height:1.5;">House rules: pay buy-in, roll two Dread d6 and one Adventure die, then call Under / Middle / Over. Matching either Dread die counts as Middle.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(4,minmax(72px,1fr));gap:.18rem;margin-top:.22rem;">'
      + '<div style="font-size:.66rem;color:var(--muted2);">Credits<br><strong style="color:var(--gold2);font-size:.8rem;">' + Number(S.credits || 0) + '₵</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">Buy In<br><strong style="color:var(--text2);font-size:.8rem;">' + buyIn + '₵</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">Difficulty<br><strong style="color:var(--text2);font-size:.8rem;">Level ' + level + '</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">Adventure Die<br><strong style="color:var(--text2);font-size:.8rem;">d' + advDie + '</strong></div>'
      + '</div>'
      + '<div style="display:flex;gap:.16rem;flex-wrap:wrap;margin-top:.22rem;">' + levelButtons + '</div>'
      + '<div style="display:flex;gap:.16rem;flex-wrap:wrap;margin-top:.16rem;">'
      + guessBtn('under', 'Under') + guessBtn('middle', 'Middle') + guessBtn('over', 'Over')
      + '</div>'
      + '<div style="font-size:.7rem;color:var(--gold2);margin-top:.12rem;">Current Call: <strong>' + (state.guess ? String(state.guess).toUpperCase() : 'NONE') + '</strong></div>'
      + '<div style="display:flex;gap:.16rem;flex-wrap:wrap;margin-top:.2rem;">'
      + '<button type="button" class="btn btn-xs btn-primary" onclick="playHoldingGamblingRound(\'' + String(node.id) + '\')">Play Round</button>'
      + '<button type="button" class="btn btn-xs" onclick="clearHoldingGamblingHistory(\'' + String(node.id) + '\')">Clear Ledger</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,minmax(64px,1fr));gap:.16rem;margin-top:.2rem;">'
      + '<div style="font-size:.66rem;color:var(--muted2);">Dread 1<br><strong style="color:var(--red2);font-size:.84rem;">' + state.dieOne + '</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">Adventure<br><strong style="color:var(--teal);font-size:.84rem;">' + state.adventure + '</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">Dread 2<br><strong style="color:var(--red2);font-size:.84rem;">' + state.dieTwo + '</strong></div>'
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--text2);margin-top:.2rem;">' + String(state.outcome || '') + '</div>'
      + (historyHtml ? ('<div style="margin-top:.2rem;border-top:1px solid rgba(255,255,255,.08);padding-top:.14rem;">' + historyHtml + '</div>') : '')
      + '</div>';
  }

  function setHoldingGamblingDifficulty(nodeId, level) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var state = ensureHoldingGamblingState(crawl, node);
    state.level = Math.max(1, Math.min(6, Number(level || 1)));
    crawl.activeNodeId = node.id;
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function setHoldingGamblingGuess(nodeId, guess) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var state = ensureHoldingGamblingState(crawl, node);
    state.guess = String(guess || '');
    crawl.activeNodeId = node.id;
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function clearHoldingGamblingHistory(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var state = ensureHoldingGamblingState(crawl, node);
    state.history = [];
    state.outcome = 'Ledger cleared. Pick a guess and play a round.';
    crawl.activeNodeId = node.id;
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function playHoldingGamblingRound(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) return;
    var state = ensureHoldingGamblingState(crawl, node);
    var level = Math.max(1, Math.min(6, Number(state.level || 1)));
    var buyIn = level * 10;
    var payout = level * 10;
    if (!state.guess) {
      state.outcome = 'Select Under / Middle / Over before you play.';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    if (Number(S.credits || 0) < buyIn) {
      state.outcome = 'Not enough credits for buy-in (' + buyIn + '₵ needed).';
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    S.credits = Math.max(0, Number(S.credits || 0) - buyIn);
    var dreadA = roll(6);
    var dreadB = roll(6);
    var low = Math.min(dreadA, dreadB);
    var high = Math.max(dreadA, dreadB);
    var adventure = roll(holdingGambleAdventureDie(level));
    var actual = adventure < low ? 'under' : (adventure > high ? 'over' : 'middle');
    var win = String(actual) === String(state.guess);
    if (win) {
      S.credits = Number(S.credits || 0) + buyIn + payout;
      state.outcome = 'Win. Call ' + String(state.guess).toUpperCase() + ' landed. Profit +' + payout + '₵.';
    } else {
      state.outcome = 'Loss. Adventure landed ' + String(actual).toUpperCase() + '. Buy-in lost.';
    }
    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    state.dieOne = low;
    state.dieTwo = high;
    state.adventure = adventure;
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.unshift('L' + level + ' · ' + low + '/' + high + ' vs Ad' + holdingGambleAdventureDie(level) + '=' + adventure + ' · called ' + String(state.guess).toUpperCase() + ' · ' + (win ? 'WIN' : 'LOSS'));
    state.history = state.history.slice(0, 10);
    node.result = 'Gambling round: ' + state.outcome;
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    crawl.history.unshift(String(node.label || 'District') + ': ' + state.outcome);
    crawl.history = crawl.history.slice(0, 12);
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function buildHoldingSettlementHexcrawlModal(opts) {
    opts = opts || {};
    var crawl = ensureHoldingSettlementHexcrawl();
    if (opts.advanceVisit !== false) {
      crawl.visitCount = Number(crawl.visitCount || 0) + 1;
      rollHoldingAmbientState(crawl);
    } else if (!crawl.ambient || !crawl.ambient.scene) {
      rollHoldingAmbientState(crawl);
    }
    var active = crawl.nodes.find(function (n) { return String(n.id || '') === String(crawl.activeNodeId || ''); }) || crawl.nodes[0];
    var stats = crawl.stats || {};
    var statsHtml = ['security', 'food', 'wealth', 'faith', 'fear', 'mystery', 'health'].map(function (k) {
      var v = Math.max(0, Math.min(10, Number(stats[k] || 0)));
      return '<div style="font-size:.68rem;color:var(--muted2);padding:.1rem .25rem;border:1px solid rgba(255,255,255,.06);">' + k.toUpperCase() + ': <strong style="color:var(--text2);">' + v + '/10</strong></div>';
    }).join('');
    var ambient = crawl.ambient || {};
    var historyHtml = (Array.isArray(crawl.history) ? crawl.history : []).slice(0, 4).map(function (line) {
      return '<div style="font-size:.68rem;color:var(--muted2);">• ' + String(line || '') + '</div>';
    }).join('');
    var micro = active && Array.isArray(active.microLocations) ? active.microLocations : [];
    var microHtml = micro.map(function (m) { return '<div style="font-size:.7rem;color:var(--text2);">- ' + m + '</div>'; }).join('');
    ensureHoldingStorylets(crawl);
    var storyletHtml = (crawl.storylets || []).filter(function (s) { return s && !s.resolved; }).slice(0, 3).map(function (s) {
      return '<div style="font-size:.66rem;color:var(--muted2);">• ' + String(s.title || 'Local chain') + ' — Stage ' + Number(s.stage || 1) + '/3</div>';
    }).join('');
    var actionButton = active && !active.explored
      ? '<button type="button" class="btn btn-xs btn-primary" onclick="resolveHoldingSettlementHexNode(\'' + String(active.id) + '\')">Scout District (DD' + Number(active.dd || 6) + ')</button>'
      : '<span style="font-size:.68rem;color:var(--green2);">Scouted this visit.</span>';
    var districtButtons = '';
    if (active) {
      var services = active.services || {};
      if (services.missionBoard) districtButtons += '<button type="button" class="btn btn-xs" onclick="openHoldingDistrictMissionPickup(\'' + String(active.id) + '\')">Mission Board</button>';
      if (services.localWork) districtButtons += '<button type="button" class="btn btn-xs btn-teal" onclick="runHoldingDistrictFlavorAction(\'' + String(active.id) + '\',\'downtime_task\')">Local Shift</button>';
      if (services.merchant) districtButtons += '<button type="button" class="btn btn-xs" onclick="openHoldingMerchantDistrict(\'' + String(active.id) + '\')">Merchants</button>';
      if (typeof window.openHoldingCrucibleMatch === 'function') districtButtons += '<button type="button" class="btn btn-xs btn-primary" onclick="window.openHoldingCrucibleMatch()">Crucible</button>';
      if (active.kind === 'inn') districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'rest\')">Rest</button>';
      if (active.kind === 'lord') districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'audience\')">Audience</button>';
      if (services.inn) districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'inn_service\')">Inn Loop</button>';
      if (services.bar) districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'bar\')">Bar Loop</button>';
      if (services.banking) districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'banking\')">Banking</button>';
      if (services.legal) districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'legal\')">Legal Desk</button>';
      if (services.hospital) districtButtons += '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'hospital\')">Hospital</button>';
      districtButtons += '<button type="button" class="btn btn-xs" onclick="openHoldingSettlementSewerRoute(\'' + String(active.id) + '\')">Sewer Route</button>';
    }

    var html = '<div style="font-size:.77rem;color:var(--text2);line-height:1.46;display:grid;gap:.24rem;">'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.04);padding:.3rem .34rem;">'
      + '<div style="font-size:.74rem;color:var(--gold2);letter-spacing:.05em;text-transform:uppercase;"><strong>Holding Overview</strong></div>'
      + '<div style="margin-top:.08rem;font-size:.73rem;color:var(--text2);"><strong style="color:var(--gold2);">District Hexcrawl</strong> · Visit #' + Number(crawl.visitCount || 1) + ' · ' + String(crawl.timeOfDay || 'morning').toUpperCase() + '</div>'
      + '<details style="margin-top:.1rem;">'
      + '<summary style="cursor:pointer;font-size:.66rem;color:var(--muted2);">Settlement Metadata</summary>'
      + '<div style="margin-top:.08rem;font-size:.68rem;color:var(--muted2);">Type: ' + String(crawl.holdingType || 'Settlement') + ' · Terrain: ' + String((S.holding && S.holding.terrain) || 'Glades') + ' · Weather: ' + String((S.currentSeason || 'spring').toUpperCase()) + '</div>'
      + '<div style="margin-top:.08rem;font-size:.68rem;color:var(--teal);">Style: ' + String(crawl.vibe || 'Living settlement pressure ecosystem') + '</div>'
      + '<div style="margin-top:.1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:.14rem;">' + statsHtml + '</div>'
      + '</details>'
      + '</div>'

      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.03);padding:.3rem .34rem;">'
      + '<div style="font-size:.71rem;color:var(--gold2);margin-bottom:.14rem;"><strong>District Hex Map</strong></div>'
      + buildHoldingHexMapHtml(crawl)
      + '<div style="display:flex;gap:.14rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.14rem;">'
      + '<button type="button" class="btn btn-xs" onclick="advanceHoldingSettlementTime(1)">+1 Hour</button>'
      + '<button type="button" class="btn btn-xs" onclick="advanceHoldingSettlementTime(6)">+6 Hours</button>'
      + '<button type="button" class="btn btn-xs btn-teal" onclick="openHoldingSettlementHexcrawl()">Refresh Scene</button>'
      + '</div>'
      + '</div>'

      + (active ? ('<div style="border:1px solid var(--border2);background:rgba(0,0,0,.14);padding:.3rem .34rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.08rem;"><strong>District Details</strong></div>'
        + '<div style="font-size:.79rem;color:var(--text);"><strong>' + active.label + '</strong> <span style="font-size:.66rem;color:var(--muted2);">(' + (active.explored ? 'Visited' : 'Unexplored') + ')</span></div>'
        + '<div style="font-size:.68rem;color:var(--text2);margin-top:.08rem;line-height:1.46;">' + active.atmosphere + '</div>'
        + '<details style="margin-top:.1rem;">'
        + '<summary style="cursor:pointer;font-size:.65rem;color:var(--muted2);">District Metadata</summary>'
        + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.08rem;">Activity: ' + active.activity + ' · Crowd: ' + active.npcDensity + ' · Mood: ' + active.mood + '</div>'
        + '<div style="font-size:.66rem;color:var(--muted2);">Economy: ' + String(active.economy || 'mixed') + ' · Scarcity: ' + String(active.scarcity || 'balanced') + '</div>'
        + '<div style="font-size:.66rem;color:var(--muted2);">Interactable: ' + active.interactable + ' · Hidden: ' + active.hiddenThing + '</div>'
        + '<div style="font-size:.66rem;color:var(--text2);margin-top:.06rem;">District Landmark: <strong style="color:var(--gold2);">' + String(active.districtLandmark || 'Ward landmark pending') + '</strong></div>'
        + '<div style="font-size:.66rem;color:var(--muted2);">Faction Headline: ' + String(active.factionHeadline || 'No headline filed') + '</div>'
        + (Array.isArray(active.npcRoster) && active.npcRoster.length ? ('<div style="font-size:.66rem;color:var(--teal);margin-top:.08rem;">District NPC Roster</div>' + active.npcRoster.map(function (npc) {
          return '<div style="font-size:.66rem;color:var(--muted2);">• ' + String(npc.name || 'Local') + ' (' + String(npc.role || 'Resident') + ') · Relation ' + (Number(npc.relation || 0) >= 0 ? '+' : '') + Number(npc.relation || 0) + '</div>';
        }).join('')) : '')
        + (microHtml ? ('<div style="font-size:.66rem;color:var(--teal);margin-top:.08rem;">Micro-Locations</div>' + microHtml) : '')
        + '</details>'
        + '<div style="margin-top:.12rem;font-size:.64rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Core Action</div>'
        + '<div style="margin-top:.06rem;display:flex;gap:.14rem;flex-wrap:wrap;">' + actionButton + '</div>'
        + (districtButtons ? '<div style="margin-top:.08rem;font-size:.64rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">District Services</div>' : '')
        + '<div style="margin-top:.06rem;display:flex;gap:.14rem;flex-wrap:wrap;">' + districtButtons + '</div>'
        + '<div style="margin-top:.08rem;font-size:.64rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;">Local Flavor</div>'
        + '<div style="margin-top:.06rem;display:flex;gap:.14rem;flex-wrap:wrap;">'
        + '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictFlavorAction(\'' + String(active.id) + '\',\'downtime_talk\')">Talk to Locals</button>'
        + '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictFlavorAction(\'' + String(active.id) + '\',\'rumor\')">Hear Rumors</button>'
        + '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictFlavorAction(\'' + String(active.id) + '\',\'browse\')">Merchants</button>'
        + '<button type="button" class="btn btn-xs" onclick="runHoldingDistrictFlavorAction(\'' + String(active.id) + '\',\'event\')">Random Encounter</button>'
        + '</div>'
        + '<div id="holdingDowntimeResult" style="margin-top:.12rem;">' + buildHoldingPendingEventHtml() + '</div>'
        + (active && active.services && active.services.gamblingDen
          ? ('<div style="margin-top:.1rem;padding:.2rem .28rem;border:1px solid rgba(201,162,39,.28);background:rgba(201,162,39,.05);">'
            + '<div style="font-size:.67rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Gambling Den</strong></div>'
            + (String(crawl.gamblingActiveNodeId || '') === String(active.id || '')
              ? ('<div style="display:flex;gap:.16rem;flex-wrap:wrap;margin-bottom:.18rem;">'
                + '<button type="button" class="btn btn-xs btn-gold" onclick="toggleHoldingGamblingNode(\'' + String(active.id) + '\')">Hide Gambling Table</button>'
                + '</div>'
                + buildHoldingGamblingEmbedHtml(active, crawl))
              : '<button type="button" class="btn btn-xs btn-gold" onclick="toggleHoldingGamblingNode(\'' + String(active.id) + '\')">Open Gambling Table</button>')
            + '</div>')
          : '')
        + (active && active.browsePreview && Array.isArray(active.browsePreview.offers)
          ? ('<div style="margin-top:.1rem;padding:.2rem .28rem;border:1px solid rgba(126,215,255,.28);background:rgba(126,215,255,.06);">'
            + '<div style="font-size:.67rem;color:var(--teal);margin-bottom:.08rem;"><strong>Merchants Offers</strong> · ' + String(active.browsePreview.category || 'mixed') + '</div>'
            + (function () {
                var market = ensureHoldingDistrictMarket(active);
                var marketMeta = HOLDING_MARKET_STATE_TABLE[String(market.state || 'normal')] || HOLDING_MARKET_STATE_TABLE.normal;
                return '<div style="font-size:.66rem;color:var(--gold2);line-height:1.45;margin-bottom:.12rem;">'
                  + 'Market State: <strong>' + marketMeta.label + '</strong> (x' + marketMeta.multiplier + ')'
                  + '<br>Desired Trade Item: <strong>' + String(market.desiredItem || 'Trade Goods') + '</strong>'
                  + '</div>';
              })()
            + '<div style="font-size:.64rem;color:var(--muted2);line-height:1.4;margin-bottom:.12rem;">'
            + 'Sell Modifier Table: Oversupplied x0.5 · Normal x1 · Desired x2 · Desperate x3'
            + '</div>'
            + active.browsePreview.offers.map(function (offer) {
                var itemName = String(offer || 'Item');
                var itemCost = getHoldingBrowseOfferCost(itemName);
                return '<div style="font-size:.68rem;color:var(--text2);line-height:1.4;display:flex;gap:.14rem;align-items:center;justify-content:space-between;">'
                  + '<span>• ' + itemName + ' <span style="color:var(--gold2);">(' + itemCost + '₵)</span></span>'
                  + '<button type="button" class="btn btn-xs btn-teal" onclick="buyHoldingBrowseOffer(\'' + String(active.id) + '\',\'' + itemName.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')">Buy</button>'
                  + '</div>';
              }).join('')
            + '<div style="margin-top:.16rem;padding-top:.12rem;border-top:1px solid rgba(255,255,255,.1);font-size:.66rem;color:var(--muted2);">'
            + '<strong style="color:var(--gold2);">Sell From Backpack</strong>'
            + ((Array.isArray(S.backpack) ? S.backpack : []).map(function (bp, bIdx) {
                if (!bp) return '';
                return '<div style="margin-top:.08rem;display:flex;gap:.12rem;justify-content:space-between;align-items:center;">'
                  + '<span>BP' + (bIdx + 1) + ': ' + String(bp) + '</span>'
                  + '<button type="button" class="btn btn-xs" onclick="sellHoldingBrowseBackpackItem(\'' + String(active.id) + '\',' + bIdx + ')">Sell</button>'
                  + '</div>';
              }).join('') || '<div style="margin-top:.08rem;">Backpack empty.</div>')
            + '</div>'
            + '</div>')
          : '')
        + (active.result ? '<div style="font-size:.67rem;color:var(--gold2);margin-top:.1rem;line-height:1.46;">' + active.result + '</div>' : '')
        + '</div>') : '')

      + '<div style="border:1px solid var(--border2);background:rgba(46,196,182,.08);padding:.26rem .32rem;">'
      + '<div style="font-size:.71rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Random Encounters And World Pulse</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.44;">' + String(ambient.scene || 'The holding stirs.') + '</div>'
      + '<details style="margin-top:.1rem;">'
      + '<summary style="cursor:pointer;font-size:.65rem;color:var(--muted2);">Rumors And Signals</summary>'
      + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.44;margin-top:.06rem;">'
      + 'Headline: <strong style="color:var(--gold2);">' + String(ambient.factionHeadline || 'No faction headline.') + '</strong><br>'
      + 'District Landmark: ' + String(ambient.districtLandmark || 'No landmark surfaced.') + '<br>'
      + 'Scenic Encounter: ' + String(ambient.scenicEncounter || 'No scenic encounter.') + '<br>'
      + 'Rumor: ' + String(ambient.rumor || 'No rumor yet.') + '<br>'
      + 'Opportunity: ' + String(ambient.opportunity || 'No opportunity yet.') + '<br>'
      + 'Mystery: ' + String(ambient.mysterySignal || 'No anomaly yet.')
      + '</div>'
      + '</details>'
      + (storyletHtml ? ('<div style="margin-top:.1rem;border-top:1px solid rgba(255,255,255,.08);padding-top:.1rem;"><div style="font-size:.66rem;color:var(--teal);">Escalating Storylets</div>' + storyletHtml + '</div>') : '')
      + (historyHtml ? ('<div style="margin-top:.14rem;border-top:1px solid rgba(255,255,255,.08);padding-top:.12rem;">'
        + '<div style="font-size:.68rem;color:var(--teal);margin-bottom:.06rem;">Recent District Activity</div>'
        + historyHtml
        + '</div>') : '')
      + '</div>'
      + '</div>';
    return html;
  }

  function runHoldingDistrictAction(nodeId, action) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) {
      if (typeof showNotif === 'function') showNotif('District action unavailable here. Enter the holding map and choose a district first.', 'warn');
      return;
    }
    var msg = '';
    if (action === 'rest') {
      if (typeof toggleCond === 'function' && S.conditions && !S.conditions.protected) toggleCond('protected');
      if (typeof changeMentalStress === 'function') changeMentalStress(-1);
      crawl.stats.health = Math.min(10, Number((crawl.stats && crawl.stats.health) || 0) + 1);
      msg = 'You rest at the inn. Protected applied and stress eased.';
    } else if (action === 'audience') {
      if (typeof changeCounter === 'function') changeCounter('renown', 1);
      S.holding.councilTasks = Array.isArray(S.holding.councilTasks) ? S.holding.councilTasks : [];
      var rulerName = '';
      if (Array.isArray(node.npcRoster) && node.npcRoster.length) {
        var lordNpc = node.npcRoster.find(function (npc) {
          return npc && /lord|regent|steward|magistrate|commander/i.test(String(npc.role || ''));
        });
        rulerName = lordNpc ? String(lordNpc.name || '') : '';
      }
      if (!rulerName) rulerName = String((S.holding && S.holding.name) ? ('Ruler of ' + S.holding.name) : 'Settlement Ruler');
      S.holding.councilTasks.push('Ruler mission: secure outlying district route and keep civic pressure stable.');
      var postedMission = null;
      if (typeof createMission === 'function') {
        postedMission = createMission(
          rulerName,
          'Audience Directive: ' + String(node.label || 'Settlement') + ' Stability Charter',
          pick(['medium', 'hard']),
          String(node.label || 'Holding District'),
          'province',
          { gain: 'Grey Kingdom', lose: 'Nomad Clans', gainName: 'Grey Kingdom', loseName: 'Nomad Clans' },
          {
            missionType: 'settlement_management',
            source: 'holding_audience',
            locationKey: String(node.id || ''),
            lore: rulerName + ' asks you to restore order between district factions, secure supply lanes, and settle escalating civil disputes.'
          }
        );
      }
      if (!postedMission && typeof generateTask === 'function') {
        try { generateTask(); } catch (_err) {}
      }
      crawl.stats.security = Math.min(10, Number((crawl.stats && crawl.stats.security) || 0) + 1);
      if (typeof switchTab === 'function') {
        var missionBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('missions'\"]");
        switchTab('missions', missionBtn || null);
      }
      msg = 'Audience complete. +1 Renown and a ruler-issued mission is now active in Missions.';
    } else if (action === 'inn_service') {
      var innCost = 10;
      if (Number(S.credits || 0) < innCost) {
        msg = 'Inn Loop costs 10₵. Not enough credits.';
      } else {
        S.credits = Math.max(0, Number(S.credits || 0) - innCost);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        clearHoldingMedicalState();
        advanceHoldingOneDay();
        crawl.stats.health = Math.min(10, Number((crawl.stats && crawl.stats.health) || 0) + 1);
        crawl.stats.fear = Math.max(0, Number((crawl.stats && crawl.stats.fear) || 0) - 1);
        msg = 'Inn Loop complete: Long Rest applied for 10₵ and +1 day advanced.';
      }
    } else if (action === 'bar') {
      if (typeof changeCounter === 'function') changeCounter('tmw', 1);
      crawl.stats.wealth = Math.min(10, Number((crawl.stats && crawl.stats.wealth) || 0) + 1);
      crawl.gamblingActiveNodeId = String(node.id || '');
      crawl.activeNodeId = String(node.id || crawl.activeNodeId || '');
      var rumorLine = String(node.rumor || (crawl.ambient && crawl.ambient.rumor) || 'No clear rumor tonight.');
      msg = 'Bar loop complete: +1 Teamwork. Rumor: ' + rumorLine + ' Gambling table opened.';
    } else if (action === 'banking') {
      crawl.stats.wealth = Math.min(10, Number((crawl.stats && crawl.stats.wealth) || 0) + 1);
      if (typeof openHoldingBankingModal === 'function') {
        openHoldingBankingModal();
      }
      msg = 'Banking loop opened the treasury management prompt.';
    } else if (action === 'legal') {
      var legalCost = 20;
      if (Number(S.credits || 0) < legalCost) {
        msg = 'Legal Desk costs 20₵. Not enough credits.';
      } else {
        S.credits = Math.max(0, Number(S.credits || 0) - legalCost);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        S.renown = Math.max(0, Number(S.renown || 0));
        if (!S.factionRenown || typeof S.factionRenown !== 'object') {
          S.factionRenown = { corporations: 0, religious: 0, political: 0, military: 0, underworld: 0 };
        }
        Object.keys(S.factionRenown).forEach(function (key) {
          S.factionRenown[key] = Math.max(0, Number(S.factionRenown[key] || 0));
        });
        if (S.powerRenown && typeof S.powerRenown === 'object') {
          Object.keys(S.powerRenown).forEach(function (key) {
            S.powerRenown[key] = Math.max(0, Number(S.powerRenown[key] || 0));
          });
        }
        if (typeof updateRenown === 'function') updateRenown();
        if (typeof updateFactionRenownUI === 'function') updateFactionRenownUI();
        crawl.stats.security = Math.min(10, Number((crawl.stats && crawl.stats.security) || 0) + 1);
        msg = 'Legal Desk complete: all renown tracks floored to 0 for 20₵ and district security improved.';
      }
    } else if (action === 'hospital') {
      var hospitalCost = 50;
      if (Number(S.credits || 0) < hospitalCost) {
        msg = 'Hospital costs 50₵. Not enough credits.';
      } else {
        S.credits = Math.max(0, Number(S.credits || 0) - hospitalCost);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        clearHoldingMedicalState();
        crawl.stats.health = Math.min(10, Number((crawl.stats && crawl.stats.health) || 0) + 2);
        msg = 'Hospital complete: Stress, Radiation, Trauma, Injuries, and Scars cleared for 50₵.';
      }
    } else if (action === 'buy_item') {
      if (Number(S.credits || 0) < 50) msg = 'Not enough credits.';
      else {
        S.credits = Math.max(0, Number(S.credits || 0) - 50);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        if (typeof addToBackpack === 'function') addToBackpack('Ration Kit');
        crawl.stats.food = Math.min(10, Number((crawl.stats && crawl.stats.food) || 0) + 1);
        msg = 'Purchased item: Ration Kit (-50 Credits).';
      }
    } else if (action === 'buy_tools') {
      if (Number(S.credits || 0) < 65) msg = 'Not enough credits.';
      else {
        S.credits = Math.max(0, Number(S.credits || 0) - 65);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        if (typeof addToBackpack === 'function') addToBackpack('Tool Kit');
        crawl.stats.wealth = Math.min(10, Number((crawl.stats && crawl.stats.wealth) || 0) + 1);
        msg = 'Purchased item: Tool Kit (-65 Credits).';
      }
    } else if (action === 'buy_medicine') {
      if (Number(S.credits || 0) < 85) msg = 'Not enough credits.';
      else {
        S.credits = Math.max(0, Number(S.credits || 0) - 85);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        if (typeof addToBackpack === 'function') addToBackpack('Medicine Satchel');
        crawl.stats.health = Math.min(10, Number((crawl.stats && crawl.stats.health) || 0) + 1);
        msg = 'Purchased item: Medicine Satchel (-85 Credits).';
      }
    } else if (action === 'buy_weapon') {
      if (Number(S.credits || 0) < 120) msg = 'Not enough credits.';
      else {
        S.credits = Math.max(0, Number(S.credits || 0) - 120);
        if (typeof updateCreditsUI === 'function') updateCreditsUI();
        if (typeof addToBackpack === 'function') addToBackpack('Weapon+ Voucher');
        crawl.stats.security = Math.min(10, Number((crawl.stats && crawl.stats.security) || 0) + 1);
        msg = 'Purchased Weapon+ voucher (-120 Credits).';
      }
    } else if (action === 'mission') {
      openHoldingDistrictMissionPickup(node.id);
      return;
    }
    node.result = msg || node.result;
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    if (msg) {
      crawl.history.unshift(String(node.label || 'District') + ': ' + msg);
      crawl.history = crawl.history.slice(0, 12);
    }
    if (typeof showNotif === 'function' && msg) showNotif(msg, msg.toLowerCase().indexOf('not enough') >= 0 ? 'warn' : 'good');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function runHoldingDistrictActionByKind(kind, action) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var target = crawl.nodes.find(function (entry) { return String(entry.kind || '') === String(kind || ''); })
      || crawl.nodes.find(function (entry) { return !!entry; });
    if (!target) {
      if (typeof showNotif === 'function') showNotif('No active district is available in this holding.', 'warn');
      return;
    }
    crawl.activeNodeId = target.id;
    runHoldingDistrictAction(target.id, action);
  }

  function openHoldingSettlementHexcrawl(holdingType) {
    if (holdingType) {
      var crawl = ensureHoldingSettlementHexcrawl();
      var t = String(holdingType).trim();
      if (t && crawl.holdingType !== t) {
        // New holding type — reset crawl so districts regenerate for this type
        crawl.holdingType = t;
        S.holding.type = t;
        delete S.holding.settlementHexcrawl;
      }
    }
    rerenderHoldingSettlementHexcrawl({ advanceVisit: true });
  }

  function openRegionalSettlementHexcrawl(mode, label) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var regionMode = String(mode || 'holding').toLowerCase();
    var settlementLabel = String(label || '').trim();
    if (regionMode === 'sea') {
      crawl.holdingType = settlementLabel || 'Sea Settlement';
      crawl.vibe = 'A tide-cut settlement of docks, taverns, brokers, and rumor routes under contested harbor control.';
    } else if (regionMode === 'space' || regionMode === 'planet') {
      crawl.holdingType = settlementLabel || 'Space Hub';
      crawl.vibe = 'A pressure-sealed orbital hub where factions bargain, pilots refuel, and covert contracts trade hands.';
      if (regionMode === 'planet') {
        crawl.holdingType = settlementLabel || 'Planet Settlement';
        crawl.vibe = 'A frontier planet settlement balancing colony logistics, survey pressure, and faction contracts.';
      }
    } else if (regionMode === 'ruins') {
      crawl.holdingType = settlementLabel || 'Ruin Encampment';
      crawl.vibe = 'An expedition camp threaded through unstable ruins, salvage claims, and contested shrine law.';
    } else {
      crawl.holdingType = settlementLabel || String(crawl.holdingType || 'Settlement');
    }
    crawl.regionMode = regionMode;
    if (!crawl.timeOfDay) crawl.timeOfDay = 'morning';
    rollHoldingAmbientState(crawl);
    var title = regionMode === 'sea'
      ? 'Sea Settlement Hexcrawl'
      : (regionMode === 'space' ? 'Space Hub Hexcrawl' : (regionMode === 'ruins' ? 'Ruin Encampment Hexcrawl' : 'Holding Settlement Hexcrawl'));
    openModal(title, buildHoldingSettlementHexcrawlModal({ advanceVisit: true }));
  }

  function openRuinEncampmentHexcrawl(label) {
    openRegionalSettlementHexcrawl('ruins', label);
  }

  function openRuinEncampmentFromProvince(col, row) {
    var ruinLabel = 'Ruin Encampment';
    if (typeof mapData !== 'undefined' && Array.isArray(mapData)) {
      var ruinHex = mapData.find(function (hex) {
        return hex && Number(hex.col) === Number(col) && Number(hex.row) === Number(row) && String(hex.type || '') === 'ruins';
      });
      if (ruinHex && ruinHex.name) ruinLabel = String(ruinHex.name) + ' Encampment';
    }
    openRuinEncampmentHexcrawl(ruinLabel);
  }

  function openSeaSettlementHexcrawl(label) {
    openRegionalSettlementHexcrawl('sea', label);
  }

  function openSpaceHubHexcrawl(label) {
    openRegionalSettlementHexcrawl('space', label);
  }

  function selectHoldingSettlementDistrict(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) { return; }
    (crawl.nodes || []).forEach(function (entry) {
      if (entry && String(entry.id || '') !== String(node.id || '')) entry.browsePreview = null;
    });
    crawl.activeNodeId = node.id;
    var eventPool = crawl.ambientTables && Array.isArray(crawl.ambientTables.scenes) ? crawl.ambientTables.scenes : [];
    var ev = eventPool.length ? eventPool[Math.floor(Math.random() * eventPool.length)] : 'The district rotates through ordinary traffic and watch shifts.';
    node.result = 'Selected district: ' + String(node.label || 'District') + '. Current scene: ' + ev
      + ' Activity focus: ' + String(node.activity || 'Local movement')
      + '. Rumor focus: ' + String(node.rumor || 'No rumor currently surfaced') + '.';
    if (typeof showNotif === 'function') showNotif(node.label + ': ' + ev, 'info');
    crawl.gamblingActiveNodeId = '';
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function advanceHoldingSettlementTime(hours) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var h = Math.max(1, Number(hours || 1));
    var order = ['morning', 'dusk', 'night'];
    var idx = order.indexOf(String(crawl.timeOfDay || 'morning'));
    if (idx < 0) idx = 0;
    idx = (idx + (h >= 6 ? 2 : 1)) % order.length;
    crawl.timeOfDay = order[idx];
    crawl.stats = crawl.stats || {};
    crawl.stats.fear = Math.max(0, Math.min(10, Number(crawl.stats.fear || 0) + (crawl.timeOfDay === 'night' ? 1 : 0)));
    crawl.stats.security = Math.max(0, Math.min(10, Number(crawl.stats.security || 0) + (crawl.timeOfDay === 'night' ? -1 : 0)));
    rollHoldingAmbientState(crawl);
    if (typeof showNotif === 'function') showNotif('Time advanced to ' + String(crawl.timeOfDay).toUpperCase() + '.', 'info');
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function resolveHoldingSettlementHexNode(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id) === String(nodeId); });
    if (!node || node.explored || !node.revealed) { return; }
    node.explored = true;
    var die = (typeof getEffectiveDie === 'function') ? getEffectiveDie('lead') : ((S.stats && S.stats.lead) || 4);
    var action = explodingRoll(die, { type: 'action', major: true, label: 'Settlement Node LEAD d' + die });
    var dread = explodingRoll(Number(node.dd || 6), { type: 'dread', major: true, label: 'Settlement Node DD' + Number(node.dd || 6) });
    var success = action.total >= dread.total;
    var line = 'Lead d' + die + ' ' + action.total + ' vs DD' + Number(node.dd || 6) + ' ' + dread.total + '. ';
    crawl.stats = crawl.stats || {};
    var holdingType = String(crawl.holdingType || S.holding.type || 'Fortress');
    if (success) {
      var cGain = 20 + Math.floor(Math.random() * 41);
      S.credits = (S.credits || 0) + cGain;
      if (typeof updateCreditsUI === 'function') { updateCreditsUI(); }
      if (typeof changeCounter === 'function') { changeCounter('tmw', 1); }
      if (holdingType === 'Fortress' || holdingType === 'Keep') {
        crawl.stats.security = Math.min(10, Number(crawl.stats.security || 0) + 2);
        crawl.stats.fear = Math.max(0, Number(crawl.stats.fear || 0) - 1);
        crawl.stats.wealth = Math.min(10, Number(crawl.stats.wealth || 0) + 1);
      } else if (holdingType === 'Haven') {
        crawl.stats.wealth = Math.min(10, Number(crawl.stats.wealth || 0) + 2);
        crawl.stats.food = Math.min(10, Number(crawl.stats.food || 0) + 1);
        crawl.stats.security = Math.min(10, Number(crawl.stats.security || 0) + 1);
      } else if (holdingType === 'Citadel') {
        crawl.stats.wealth = Math.min(10, Number(crawl.stats.wealth || 0) + 1);
        crawl.stats.faith = Math.min(10, Number(crawl.stats.faith || 0) + 1);
        crawl.stats.mystery = Math.min(10, Number(crawl.stats.mystery || 0) + 1);
      } else if (holdingType === 'Spire') {
        crawl.stats.mystery = Math.min(10, Number(crawl.stats.mystery || 0) + 2);
        crawl.stats.faith = Math.min(10, Number(crawl.stats.faith || 0) + 1);
        crawl.stats.fear = Math.max(0, Number(crawl.stats.fear || 0) - 1);
      } else {
        crawl.stats.wealth = Math.min(10, Number(crawl.stats.wealth || 0) + 1);
        crawl.stats.security = Math.min(10, Number(crawl.stats.security || 0) + 1);
      }
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('lead', Math.max(1, action.total - dread.total), {
          actionTotal: action.total,
          dreadTotal: dread.total,
          context: 'Holding district stabilization'
        });
      }
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
      line += 'District stabilized. +' + cGain + ' Credits, +1 Teamwork, Fear reduced.';
    } else {
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome('lead', Math.max(1, dread.total - action.total), {
          actionTotal: action.total,
          dreadTotal: dread.total,
          context: 'Holding district stabilization'
        });
      }
      if (typeof changeMentalStress === 'function') { changeMentalStress(1); }
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
      crawl.stats.fear = Math.min(10, Number(crawl.stats.fear || 0) + 1 + (holdingType === 'Spire' ? 1 : 0));
      if (holdingType === 'Haven') {
        crawl.stats.wealth = Math.max(0, Number(crawl.stats.wealth || 0) - 1);
        crawl.stats.food = Math.max(0, Number(crawl.stats.food || 0) - 1);
      } else if (holdingType === 'Citadel') {
        crawl.stats.faith = Math.max(0, Number(crawl.stats.faith || 0) - 1);
        crawl.stats.security = Math.max(0, Number(crawl.stats.security || 0) - 1);
      } else {
        crawl.stats.security = Math.max(0, Number(crawl.stats.security || 0) - 1);
      }
      line += 'District setback. +1 Mental Stress, Fear rises, Security drops.';
      S.holding.crises = Array.isArray(S.holding.crises) ? S.holding.crises : [];
      if (Math.random() < 0.4) {
        S.holding.crises.push({
          name: 'District Escalation',
          desc: 'Local pressure rises after a failed district action.',
          resolution: 'Resolve talk/task actions and revisit districts to stabilize the holding.'
        });
      }
    }
    (crawl.edges || []).forEach(function (e) {
      if (e[0] === node.id) {
        var n1 = crawl.nodes.find(function (x) { return x.id === e[1]; });
        if (n1) n1.revealed = true;
      }
      if (e[1] === node.id) {
        var n2 = crawl.nodes.find(function (x) { return x.id === e[0]; });
        if (n2) n2.revealed = true;
      }
    });
    node.result = line;
    if (typeof showNotif === 'function') { showNotif(line, success ? 'good' : 'warn'); }
    rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
  }

  function applyHoldingDowntimeEffect(effect) {
    if (!effect) { return; }
    if (effect.tmw && typeof changeCounter === 'function') { changeCounter('tmw', effect.tmw); }
    if (effect.renown && typeof changeCounter === 'function') { changeCounter('renown', effect.renown); }
    if (effect.credits) {
      S.credits = (S.credits || 0) + effect.credits;
      if (typeof updateCreditsUI === 'function') { updateCreditsUI(); }
    }
    if (effect.health && typeof changeHealth === 'function') { changeHealth(effect.health); }
    if (effect.mentalStress && typeof changeMentalStress === 'function') { changeMentalStress(effect.mentalStress); }
    if (effect.focused && typeof toggleCond === 'function' && S.conditions && !S.conditions.focused) { toggleCond('focused'); }
  }

  function resolveHoldingDowntimeEvent(statKey) {
    var evt = S.holding && S.holding.pendingDowntimeEvent;
    if (!evt) { return; }
    var key = String(statKey || 'lead').toLowerCase();
    var die = (typeof getEffectiveDie === 'function') ? getEffectiveDie(key) : ((S.stats && S.stats[key]) || 4);
    var a = explodingRoll(die, { type: 'action', major: true, label: 'Downtime ' + key.toUpperCase() + ' d' + die });
    var d = explodingRoll(evt.dd || 6, { type: 'dread', major: true, label: 'Downtime DD' + Number(evt.dd || 6) });
    var success = a.total >= d.total;
    if (success) {
      applyHoldingDowntimeEffect(evt.successEffect);
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome(key, Math.max(1, a.total - d.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Holding downtime: ' + evt.name
        });
      }
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome(key, Math.max(1, d.total - a.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Holding downtime: ' + evt.name
        });
      }
      applyHoldingDowntimeEffect(evt.failEffect);
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
    var out = document.getElementById('holdingDowntimeResult');
    if (out) {
      out.innerHTML = '<div style="padding:.35rem .45rem;border:1px solid '+(success?'rgba(76,175,116,.35)':'rgba(201,64,64,.35)')+';background:'+(success?'rgba(76,175,116,.08)':'rgba(201,64,64,.08)')+';">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.08em;color:'+(success?'var(--green2)':'var(--red2)')+';">'+evt.name+'</div>'
        + '<div style="font-size:.76rem;color:var(--text2);margin-top:.15rem;">'+key.toUpperCase()+' d'+die+'='+a.total+' vs DD'+evt.dd+'='+d.total+'</div>'
        + '<div style="font-size:.76rem;color:var(--gold2);margin-top:.15rem;">'+(success?evt.success:evt.failure)+'</div>'
        + '</div>';
    }
    S.holding.pendingDowntimeEvent = null;
  }

  function rollHoldingDowntimeActivity(activity) {
    ensureNewFeatureState();
    var pool = holdingDowntimeActivityPool(activity);
    var evt = pool[roll(pool.length) - 1];
    S.holding.pendingDowntimeEvent = evt;
    var out = document.getElementById('holdingDowntimeResult');
    if (!out) {
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    var stats = ['lead', 'mind', 'body', 'spirit', 'control', 'strike', 'shoot', 'defend'];
    var mode = String(activity || '').toLowerCase();
    out.innerHTML = '<div style="padding:.35rem .45rem;border:1px solid var(--border2);background:var(--surface);">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.08em;color:var(--teal);">' + evt.name + '</div>'
      + '<div style="font-size:.76rem;color:var(--muted2);margin-top:.15rem;">Activity roll: choose Action Die vs DD' + evt.dd + '</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.3rem;">'
      + stats.map(function(key){ return '<button class="btn btn-xs btn-teal" onclick="resolveHoldingDowntimeEvent(\'' + key + '\')">' + key.charAt(0).toUpperCase() + key.slice(1) + '</button>'; }).join('')
      + '</div>'
      + (mode === 'explore' ? '<div style="margin-top:.32rem;"><button class="btn btn-xs btn-primary" onclick="openHoldingSettlementHexcrawl()">Open Settlement Hexcrawl</button></div>' : '')
      + '</div>';
  }

  function rollHoldingDowntimeEvent() {
    ensureNewFeatureState();
    var pool = holdingDowntimeEvents();
    var evt = pool[roll(pool.length)-1];
    S.holding.pendingDowntimeEvent = evt;
    var out = document.getElementById('holdingDowntimeResult');
    if (!out) {
      rerenderHoldingSettlementHexcrawl({ advanceVisit: false });
      return;
    }
    var stats = ['lead','mind','body','spirit','control','strike','shoot','defend'];
    out.innerHTML = '<div style="padding:.35rem .45rem;border:1px solid var(--border2);background:var(--surface);">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.08em;color:var(--gold2);">'+evt.name+'</div>'
      + '<div style="font-size:.76rem;color:var(--muted2);margin-top:.15rem;">Choose Action Die vs DD'+evt.dd+'</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.3rem;">'
      + stats.map(function(key){ return '<button class="btn btn-xs btn-teal" onclick="resolveHoldingDowntimeEvent(\''+key+'\')">'+key.charAt(0).toUpperCase()+key.slice(1)+'</button>'; }).join('')
      + '</div>'
      + '</div>';
  }

  // ── HOLDING FUNCTIONS ─────────────────────────────────────────────────────────
  function getRandomWildernessHexes(count) {
    if (typeof mapData === 'undefined' || !Array.isArray(mapData) || !mapData.length) {
      return [];
    }
    var wild = mapData.filter(function(h) { return h.type === 'wilderness'; });
    if (!wild.length) { return []; }
    var shuffled = wild.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(function(h) {
      return { col: h.col, row: h.row };
    });
  }

  function clearHoldingQuestTokens() {
    if (!S.missionTokens) { return; }
    Object.keys(S.missionTokens).forEach(function(k) {
      var t = S.missionTokens[k];
      if (t && (t.missionId === 'holding_quest' || (t.type && t.type.indexOf('holding_') === 0))) {
        delete S.missionTokens[k];
      }
    });
  }

  function placeHoldingQuestTokens() {
    S.missionTokens = S.missionTokens || {};
    clearHoldingQuestTokens();
    var q = S.holdingQuest || {};
    if (!q.active) {
      if (q.holdingHex) {
        S.missionTokens[q.holdingHex.col + ',' + q.holdingHex.row] = { missionId: 'holding_quest', title: 'Establish Your Holding', type: 'holding_home' };
      }
      if (typeof renderHexMap === 'function') { renderHexMap(); }
      return;
    }
    if (q.step <= 0 && q.infoHex) {
      S.missionTokens[q.infoHex.col + ',' + q.infoHex.row] = { missionId: 'holding_quest', title: 'Gather Information', type: 'informer' };
    }
    if (q.step <= 1 && q.siteHex) {
      S.missionTokens[q.siteHex.col + ',' + q.siteHex.row] = { missionId: 'holding_quest', title: 'Go To Site', type: 'site' };
    }
    if (q.step >= 2 && q.holdingHex) {
      S.missionTokens[q.holdingHex.col + ',' + q.holdingHex.row] = { missionId: 'holding_quest', title: 'Your Holding', type: 'holding_home' };
    }
    if (typeof renderHexMap === 'function') { renderHexMap(); }
  }

  function startHoldingQuest() {
    ensureNewFeatureState();
    if (getHoldingGateRenown() < 9) {
      showNotif("Need Renown 9 in any Faction Standing to begin the Holding quest.", "warn");
      return;
    }
    var spots = getRandomWildernessHexes(2);
    var infoHex = spots[0] || null;
    var siteHex = spots[1] || spots[0] || null;
    S.holdingQuest = {
      active: true,
      step: 0,
      hexId: null,
      infoHex: infoHex,
      siteHex: siteHex,
      holdingHex: null,
      failed: false,
      attempts: ((S.holdingQuest && S.holdingQuest.attempts) || 0) + 1,
      step1Completed: false,
      step1Skipped: false,
      step2Completed: false,
      step3Completed: false,
      bonus: 0,
      infoFeature: null,
      additionalDanger: null,
      siteRooms: null,
      securityCount: 0,
      rewardCredits: 250,
      rewardLoot: []
    };
    placeHoldingQuestTokens();
    updateHoldingTabVisibility();
    renderHoldingUI();
    if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
    if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
    if (typeof renderQP === 'function') { renderQP('missions'); }
    showNotif("Holding Establishment Quest begun!", "good");
  }

  function holdingQuestRollFeature() {
    var table = [
      { icon: '\ud83d\udce6', name: 'Hidden Cache', effectDesc: 'Gain bonus loot when the Holding is secured.' },
      { icon: '\ud83d\udeaa', name: 'Back Entrance', effectDesc: 'Security is easier to bypass during setup.' },
      { icon: '\u2728', name: 'Local Support', effectDesc: 'Your retainers gain confidence in your claim.' },
      { icon: '\u2697', name: 'Recovered Records', effectDesc: 'Old deeds validate your Holding claim.' },
      { icon: '\ud83d\udcbb', name: 'Survey Data', effectDesc: 'You identify the safest foundation points.' },
      { icon: '\ud83d\udee1', name: 'Defensible Terrain', effectDesc: 'Your claim starts with stronger perimeter control.' }
    ];
    return table[roll(6) - 1];
  }

  function holdingQuestRollDanger() {
    var table = [
      { name: 'Mercenary Patrol', desc: 'A roaming patrol contests your claim.' },
      { name: 'Rival Claimant', desc: 'Another faction challenges your right to settle.' },
      { name: 'Hostile Terrain', desc: 'Collapse zones and hidden hazards slow setup.' },
      { name: 'Supply Shortage', desc: 'Establishment costs and pressure increase.' },
      { name: 'Raider Scouts', desc: 'Scouts map your camp before confrontation.' },
      { name: 'Warden Scrutiny', desc: 'Authorities demand proof and military readiness.' }
    ];
    return table[roll(6) - 1];
  }

  function holdingQuestStartStep1() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    if (q.step1Completed) { showNotif('Step 1 already completed.', 'warn'); return; }

    var advDie = 8;
    var dreadDie = 8;
    var a = explodingRoll(advDie, { type: 'action', major: true, label: 'Holding Step 1 AD' + advDie });
    var d = explodingRoll(dreadDie, { type: 'dread', major: true, label: 'Holding Step 1 DD' + dreadDie });
    var success = a.total >= d.total;
    var rolled = success ? holdingQuestRollFeature() : holdingQuestRollDanger();
    var encoded = encodeURIComponent(JSON.stringify(rolled));

    var resultHtml = success
      ? '<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.45rem .55rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.74rem;color:var(--teal);font-family:\'Cinzel\',serif;letter-spacing:.08em;text-transform:uppercase;">Hidden Feature Revealed</div>'
        + '<div style="font-size:.82rem;color:var(--text2);margin-top:.15rem;">' + rolled.icon + ' ' + rolled.name + ' — ' + rolled.effectDesc + '</div>'
        + '</div>'
      : '<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.45rem .55rem;margin-bottom:.45rem;">'
        + '<div style="font-size:.74rem;color:var(--red2);font-family:\'Cinzel\',serif;letter-spacing:.08em;text-transform:uppercase;">Additional Danger</div>'
        + '<div style="font-size:.82rem;color:var(--text2);margin-top:.15rem;">' + rolled.name + ' — ' + rolled.desc + '</div>'
        + '</div>';

    var html = '<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.5rem;line-height:1.5;">'
      + '<strong style="color:var(--gold2);">Step 1: Gather Information</strong> — optional. Success grants +5 bonus and reveals a hidden feature. Failure introduces Additional Danger. You may also skip.'
      + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem .6rem;margin-bottom:.45rem;">'
      + '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.3rem;">Adventure d' + advDie + ' vs Dread d' + dreadDie + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.3rem;">'
      + '<div style="text-align:center;"><div style="font-size:.7rem;color:var(--teal);text-transform:uppercase;">Your Roll</div><div style="font-family:\'Rajdhani\',sans-serif;font-size:1.8rem;font-weight:700;color:var(--teal);">' + a.total + '</div></div>'
      + '<div style="text-align:center;"><div style="font-size:.7rem;color:var(--red2);text-transform:uppercase;">Dread Roll</div><div style="font-family:\'Rajdhani\',sans-serif;font-size:1.8rem;font-weight:700;color:var(--red);">' + d.total + '</div></div>'
      + '</div>'
      + '<div style="text-align:center;font-family:\'Cinzel\',serif;font-size:.76rem;color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">'
      + (success ? '\u2713 Information gathered — +5 bonus secured' : '\u2717 Contacts run dry — Additional Danger incoming')
      + '</div></div>'
      + resultHtml
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
      + '<button class="btn btn-sm" onclick="skipHoldingQuestStep1();closeModal();">Skip This Step</button>'
      + '<button class="btn btn-sm btn-teal" onclick="completeHoldingQuestStep1(' + success + ',decodeURIComponent(\'' + encoded + '\'));closeModal();">Confirm</button>'
      + '</div>';
    openModal('Step 1 — Gather Information', html);
  }

  function completeHoldingQuestStep1(success, encodedResult) {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }

    q.step1Completed = true;
    q.step1Skipped = false;
    q.step = 1;
    if (success) {
      q.bonus = 5;
      q.infoFeature = typeof encodedResult === 'string' ? JSON.parse(encodedResult) : encodedResult;
      showNotif('Step 1 complete: +5 Holding quest bonus.', 'good');
    } else {
      q.additionalDanger = typeof encodedResult === 'string' ? JSON.parse(encodedResult) : encodedResult;
      q.bonus = 0;
      showNotif('Step 1 complete: Additional Danger added.', 'warn');
    }
    placeHoldingQuestTokens();
    renderHoldingUI();
    if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
    if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
  }

  function skipHoldingQuestStep1() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    q.step1Completed = true;
    q.step1Skipped = true;
    q.bonus = 0;
    q.step = 1;
    placeHoldingQuestTokens();
    renderHoldingUI();
    if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
    if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
  }

  function holdingQuestStartStep2() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    if (!q.step1Completed) { showNotif('Complete or skip Step 1 first.', 'warn'); return; }
    if (q.step2Completed) { showNotif('Step 2 already completed.', 'warn'); return; }

    if (!Array.isArray(q.siteRooms) || !q.siteRooms.length) {
      var roomCount = roll(5) + 1;
      q.siteRooms = [];
      for (var i = 0; i < roomCount; i++) {
        q.siteRooms.push({
          label: 'Room ' + (i + 1) + ': ' + pick(['Collapsed Hall', 'Guard Post', 'Storage Vault', 'Barracks', 'Watch Deck', 'Foundation Chamber', 'Ruined Entrance', 'Supply Hall']),
          explored: false,
          find: null,
          confrontTriggered: false,
          confrontResolved: false
        });
      }
    } else if (typeof q.siteRooms[0] === 'string') {
      q.siteRooms = q.siteRooms.map(function(label) {
        return {
          label: label,
          explored: false,
          find: null,
          confrontTriggered: false,
          confrontResolved: false
        };
      });
    }

    holdingQuestRenderSiteModal();
  }

  function holdingQuestRenderSiteModal() {
    var q = S.holdingQuest;
    if (!q || !q.active || !Array.isArray(q.siteRooms)) { return; }

    var dangerHtml = q.additionalDanger
      ? '<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.35rem .5rem;margin-bottom:.4rem;font-size:.76rem;color:var(--muted3);"><strong style="color:var(--red2);">\u26A0 Additional Danger:</strong> ' + q.additionalDanger.name + ' — ' + q.additionalDanger.desc + '</div>'
      : '';

    var roomsHtml = '<div style="font-family:\'Cinzel\',serif;font-size:.58rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.3rem;">Site Layout — ' + q.siteRooms.length + ' Rooms</div>';
    q.siteRooms.forEach(function(room, idx) {
      var explored = !!room.explored;
      var confrontActive = !!(room.confrontTriggered && !room.confrontResolved);
      var findHtml = '';
      if (explored && room.find) {
        var findColor = room.find.type === 'trap' ? 'var(--red2)' : room.find.type === 'cache' ? 'var(--green2)' : 'var(--muted3)';
        findHtml = '<div style="font-size:.7rem;color:' + findColor + ';margin-top:.2rem;padding-top:.2rem;border-top:1px dashed var(--border);">' + room.find.text + '</div>';
      }
      var actionBtn = '';
      if (!explored) {
        actionBtn = '<button class="btn btn-xs btn-teal" onclick="holdingQuestExploreRoom(' + idx + ')" style="margin-top:.2rem;">Investigate</button>';
      } else if (confrontActive) {
        actionBtn = '<div style="margin-top:.2rem;display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;"><div style="font-size:.7rem;color:var(--red2);font-weight:700;">\u26A1 Confrontation triggered!</div><button class="btn btn-xs btn-red" onclick="holdingQuestResolveRoomConfrontation(' + idx + ',false)">Fail</button><button class="btn btn-xs btn-primary" onclick="holdingQuestResolveRoomConfrontation(' + idx + ',true)">Succeed</button></div>';
      }
      roomsHtml += '<div style="padding:.3rem .4rem;margin-bottom:.25rem;border:1px solid ' + (confrontActive ? 'var(--red2)' : explored ? 'var(--border)' : 'var(--border2)') + ';background:' + (confrontActive ? 'rgba(200,50,50,.05)' : 'var(--surface)') + ';">'
        + '<div style="font-size:.75rem;color:' + (explored ? 'var(--muted2)' : 'var(--text)') + ';">' + (explored ? '\u2713 ' : '') + room.label + '</div>'
        + findHtml + actionBtn
        + '</div>';
    });

    var allExplored = q.siteRooms.every(function(r){ return !!r.explored; });
    var hasActive = q.siteRooms.some(function(r){ return !!(r.confrontTriggered && !r.confrontResolved); });
    var proceedBtn = '';
    if (!hasActive) {
      proceedBtn = '<div style="display:flex;justify-content:flex-end;margin-top:.45rem;">'
        + '<button class="btn btn-sm ' + (allExplored ? 'btn-teal' : '') + '" onclick="completeHoldingQuestStep2();closeModal();">' + (allExplored ? 'Proceed to Confrontation' : 'Skip Remaining Rooms → Confrontation') + '</button>'
        + '</div>';
    }

    var html = dangerHtml
      + '<div style="font-size:.84rem;color:var(--muted3);margin-bottom:.45rem;">Step 2 — Site Layout — 2-6 Rooms</div>'
      + roomsHtml
      + proceedBtn;
    openModal('Step 2 — Go to Site', html);
  }

  function holdingQuestExploreRoom(roomIdx) {
    var q = S.holdingQuest;
    if (!q || !q.active || !q.siteRooms || !q.siteRooms[roomIdx]) { return; }
    var room = q.siteRooms[roomIdx];
    if (room.explored) { return; }
    room.explored = true;
    var r = roll(6);
    if (r === 1) {
      room.confrontTriggered = true;
      room.find = { type: 'confront', text: '\u26A1 Security squad spotted you in this room! Resolve below.' };
    } else if (r <= 3) {
      room.find = { type: 'trap', text: pick(['TRAP — Unstable flooring: take +1 Stress if you linger.', 'TRAP — Alarm tripline: security gets ready for final stand.', 'TRAP — Toxic burst: Body test later or start wounded.']) };
    } else if (r === 4) {
      room.find = { type: 'puzzle', text: pick(['PUZZLE — Broken lock mechanism conceals a route.', 'PUZZLE — Ciphered route notes hint at a weak flank.', 'PUZZLE — Foundation diagram reveals hidden support paths.']) };
    } else if (r === 5) {
      room.find = { type: 'cache', text: 'CACHE — ' + pick(['Emergency rations and maps.', 'Old claim records proving ownership.', 'Unused construction supplies and coin pouches.']) };
    } else {
      room.find = { type: 'flavor', text: pick(['Quiet corridor with old banners.', 'A ruined chamber once used as barracks.', 'A half-collapsed hall overlooking the valley.']) };
    }
    holdingQuestRenderSiteModal();
  }

  function holdingQuestResolveRoomConfrontation(roomIdx, success) {
    var q = S.holdingQuest;
    if (!q || !q.active || !q.siteRooms || !q.siteRooms[roomIdx]) { return; }
    var room = q.siteRooms[roomIdx];
    room.confrontResolved = true;
    if (!success) {
      S.renown = Math.max(0, (S.renown || 0) - 1);
      if (typeof updateRenown === 'function') { updateRenown(); }
      showNotif('Room confrontation failed. −1 Renown.', 'warn');
    } else {
      showNotif('Room confrontation succeeded!', 'good');
    }
    holdingQuestRenderSiteModal();
  }

  function completeHoldingQuestStep2() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    q.step2Completed = true;
    q.step = 2;
    q.holdingHex = q.siteHex || q.holdingHex || q.infoHex || null;
    placeHoldingQuestTokens();
    renderHoldingUI();
    if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
    if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
  }

  function holdingQuestStartStep3() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    if (!q.step2Completed) { showNotif('Complete Step 2 first.', 'warn'); return; }

    if (!q.securityCount) {
      q.securityCount = 2;
    }

    var dangerBanner = q.additionalDanger
      ? '<div style="background:rgba(200,50,50,.07);border:1px solid rgba(200,50,50,.35);padding:.3rem .5rem;margin-bottom:.45rem;font-size:.74rem;"><strong style="color:var(--red2);">\u26A0 ' + q.additionalDanger.name + '</strong> <span style="color:var(--muted3);">— ' + q.additionalDanger.desc + '</span></div>'
      : '';
    var featureBadge = q.infoFeature
      ? '<div style="font-size:.7rem;color:var(--teal);margin-bottom:.35rem;padding:.2rem .4rem;border:1px solid rgba(46,196,182,.3);">' + q.infoFeature.icon + ' ' + q.infoFeature.name + ' — ' + q.infoFeature.effectDesc + '</div>'
      : '';
    var securityRows = '';
    for (var si = 0; si < q.securityCount; si++) {
      securityRows += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.74rem;color:var(--muted3);padding:.15rem 0;border-bottom:1px solid var(--border);"><span>Security Unit ' + (si + 1) + '</span><span style="color:var(--red2);font-family:\'Rajdhani\',sans-serif;font-weight:700;">DD8 | 16 HP</span></div>';
    }
    var securitySection = '<div style="margin-bottom:.4rem;"><div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.15rem;">Security (' + q.securityCount + ' Units)</div>' + securityRows + '</div>';
    var rollInstr = '<div style="background:var(--surface);border:1px solid var(--border2);padding:.4rem .55rem;margin-bottom:.45rem;"><div style="font-size:.8rem;color:var(--text2);margin-bottom:.2rem;">Confrontation: 2 Security + Roll Adventure d8 + 5 vs Dread d8 — then click your outcome Success or Failure.</div><div style="font-size:.7rem;color:var(--muted);">Use the Dice tab or physical dice, then choose Success/Failure below.</div></div>';

    var html = dangerBanner + featureBadge + securitySection + rollInstr
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-red" onclick="openHoldingQuestFailureOutcomeModal()">\u2717 Failure — Roll Failed</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveHoldingQuestOutcome(true)">\u2713 Success — Roll Succeeded</button>'
      + '</div>';
    openModal('Step 3 — Confrontation', html);
  }

  function stepHoldingQuestDreadDie(current, dir) {
    var dice = [4, 6, 8, 10, 12, 20];
    var die = Number(current || 8);
    var idx = dice.indexOf(die);
    if (idx < 0) idx = 2;
    var next = idx + (dir > 0 ? 1 : -1);
    if (next < 0) next = 0;
    if (next >= dice.length) next = dice.length - 1;
    return dice[next];
  }

  function normalizeHoldingQuestConditionByStat(statKey, positive) {
    var key = String(statKey || 'adventure').toLowerCase();
    if (positive) {
      if (key === 'body' || key === 'strike' || key === 'shoot') return 'empowered';
      if (key === 'defend' || key === 'control') return 'protected';
      if (key === 'lead' || key === 'spirit') return 'bolstered';
      return 'focused';
    }
    if (key === 'body' || key === 'strike' || key === 'shoot') return 'weakened';
    if (key === 'defend') return 'vulnerable';
    if (key === 'lead' || key === 'spirit') return 'shaken';
    return 'distracted';
  }

  function applyHoldingQuestCondition(condKey) {
    if (!condKey || typeof S === 'undefined') return;
    if (typeof toggleCond === 'function' && S.conditions && !S.conditions[condKey]) {
      try { toggleCond(condKey); return; } catch (_err) {}
    }
    if (typeof applyNegativeCondition === 'function' && (condKey === 'weakened' || condKey === 'vulnerable' || condKey === 'shaken' || condKey === 'distracted')) {
      try { applyNegativeCondition(condKey); return; } catch (_err2) {}
    }
    if (typeof applyPositiveCondition === 'function') {
      try { applyPositiveCondition(condKey); return; } catch (_err3) {}
    }
    S.conditions = S.conditions || {};
    S.conditions[condKey] = true;
  }

  function addHoldingQuestRadiation(amount) {
    var ticks = Math.max(1, Number(amount || 1));
    if (typeof S === 'undefined') return;
    if (S.radiationState && typeof S.radiationState === 'object') {
      S.radiationState.gainTicks = Math.max(0, Number(S.radiationState.gainTicks || 0) + ticks);
      return;
    }
    S.radiationExposure = Math.max(0, Number(S.radiationExposure || 0) + ticks);
  }

  function getHoldingQuestManualRollPair(defaultDread) {
    var actionEl = document.getElementById('manualActionValue');
    var dreadEl = document.getElementById('manualDreadValue');
    var action = Number(actionEl && actionEl.value);
    var dread = Number(dreadEl && dreadEl.value);
    if (!Number.isFinite(action) || !Number.isFinite(dread)) {
      return { action: 0, dread: Math.max(4, Number(defaultDread || 8)), inferred: true };
    }
    return { action: action, dread: Math.max(4, dread), inferred: false };
  }

  function applyHoldingQuestFailureConsequences(check, options) {
    var cfg = options || {};
    var actionTotal = Number(check && check.actionTotal || 0);
    var dreadTotal = Number(check && check.dreadTotal || 8);
    var margin = Math.max(1, dreadTotal - actionTotal);
    var applyChanges = !cfg.preview;
    var notes = [];
    if (applyChanges) {
      if (typeof changeHealth === 'function') changeHealth(margin);
      else if (typeof changeStress === 'function') changeStress(margin);
    }
    notes.push((typeof changeHealth === 'function' ? 'Damage +' : 'Stress +') + margin + ' (difference)');

    if (applyChanges) {
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      else if (typeof changeStress === 'function') changeStress(1);
    }
    notes.push('Mental Stress +1');

    if (applyChanges) addHoldingQuestRadiation(1);
    notes.push('Radiation +1');

    var negCond = normalizeHoldingQuestConditionByStat('adventure', false);
    if (applyChanges) applyHoldingQuestCondition(negCond);
    notes.push('Condition ' + negCond);

    if (applyChanges) {
      if (typeof changeCounter === 'function') changeCounter('tmw', 1);
      else S.tmw = Math.max(0, Number(S.tmw || 0) + 1);
    }
    notes.push('+1 Teamwork');

    return {
      margin: margin,
      notes: notes,
      summary: notes.join(', ')
    };
  }

  function openHoldingQuestFailureOutcomeModal() {
    if (typeof openModal !== 'function') return false;
    var check = getHoldingQuestManualRollPair(8);
    var consequence = applyHoldingQuestFailureConsequences({ actionTotal: check.action, dreadTotal: check.dread }, { preview: true });
    var pushDread = stepHoldingQuestDreadDie(check.dread || 8, 1);
    var tmw = Number((S && S.tmw) || 0);
    window._pendingHoldingQuestFailure = {
      actionTotal: Number(check.action || 0),
      dreadTotal: Number(check.dread || 8),
      pushDread: pushDread
    };
    var html = ''
      + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
      + '<div style="font-family:Cinzel,serif;font-size:.9rem;color:#ff8a72;margin-bottom:.2rem;">Confrontation Failure</div>'
      + '<div style="margin-bottom:.3rem;"><strong>Consequence Preview:</strong> ' + consequence.summary + '</div>'
      + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.35rem;">'
      + (check.inferred ? 'No manual dice values detected; difference defaults to at least 1.' : ('Manual roll seen: Action ' + check.action + ' vs Dread ' + check.dread + '.'))
      + '</div>'
      + '<div style="font-size:.77rem;color:var(--text2);margin-bottom:.4rem;"><strong>Push Luck:</strong> spend <strong>2 Teamwork</strong>, reroll at higher dread <strong>d' + pushDread + '</strong>. Success grants a positive condition; failure applies the consequence line above.</div>'
      + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:flex-end;">'
      + '<button class="btn btn-sm btn-warn" onclick="acceptHoldingQuestFailureOutcome()">Accept Failure</button>'
      + '<button class="btn btn-sm btn-teal" ' + (tmw >= 2 ? '' : "disabled title='Need 2 Teamwork'") + ' onclick="pushHoldingQuestLuckOutcome()">Push Luck (2 Teamwork)</button>'
      + '</div>'
      + '</div>';
    openModal('Holding Confrontation Failure', html);
    return true;
  }

  function acceptHoldingQuestFailureOutcome() {
    var pending = window._pendingHoldingQuestFailure || {};
    applyHoldingQuestFailureConsequences({
      actionTotal: Number(pending.actionTotal || 0),
      dreadTotal: Number(pending.dreadTotal || 8)
    }, { preview: false });
    window._pendingHoldingQuestFailure = null;
    resolveHoldingQuestOutcome(false);
  }

  function pushHoldingQuestLuckOutcome() {
    if (typeof S === 'undefined') return;
    var tmw = Number(S.tmw || 0);
    if (tmw < 2) {
      if (typeof showNotif === 'function') showNotif('Need 2 Teamwork to Push Luck.', 'warn');
      return;
    }
    if (typeof changeCounter === 'function') changeCounter('tmw', -2);
    else S.tmw = Math.max(0, tmw - 2);

    var pending = window._pendingHoldingQuestFailure || {};
    var pushDread = Number(pending.pushDread || stepHoldingQuestDreadDie(pending.dreadTotal || 8, 1));
    if (typeof openModal === 'function') {
      openModal('Push Luck — Holding Confrontation',
        '<div style="font-size:.82rem;color:var(--text2);line-height:1.58;">'
          + '<div style="margin-bottom:.28rem;"><strong>Reroll now:</strong> Adventure vs <strong>Dread d' + pushDread + '</strong>.</div>'
          + '<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.4rem;">Use your reroll result, then choose the matching outcome below.</div>'
          + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:flex-end;">'
            + '<button class="btn btn-sm btn-red" onclick="resolveHoldingQuestPushLuck(false)">Push Luck Failed</button>'
            + '<button class="btn btn-sm btn-primary" onclick="resolveHoldingQuestPushLuck(true)">Push Luck Succeeded</button>'
          + '</div>'
        + '</div>'
      );
    }
  }

  function resolveHoldingQuestPushLuck(success) {
    var pending = window._pendingHoldingQuestFailure || {};
    var reroll = getHoldingQuestManualRollPair(Number(pending.pushDread || 10));
    window._pendingHoldingQuestFailure = null;
    if (success) {
      var posCond = normalizeHoldingQuestConditionByStat('adventure', true);
      applyHoldingQuestCondition(posCond);
      if (typeof showNotif === 'function') showNotif('Push Luck succeeded. Condition gained: ' + posCond + '.', 'good');
      resolveHoldingQuestOutcome(true);
      return;
    }
    applyHoldingQuestFailureConsequences({ actionTotal: reroll.action, dreadTotal: reroll.dread }, { preview: false });
    if (typeof showNotif === 'function') showNotif('Push Luck failed at higher dread. Failure consequences applied.', 'warn');
    resolveHoldingQuestOutcome(false);
  }

  function resolveHoldingQuestOutcome(success) {
    try { if (typeof closeModal === 'function') closeModal(); } catch (err) {}
    resolveHoldingQuestStep3(success);
  }

  function resolveHoldingQuestStep3(success) {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }

    if (!success) {
      q.active = false;
      q.failed = true;
      q.step3Completed = false;
      q.step2Completed = false;
      q.step = 0;
      clearHoldingQuestTokens();
      if (typeof renderHexMap === 'function') { renderHexMap(); }
      showNotif('Holding quest failed. Retry from Available Quests.', 'warn');
      renderHoldingUI();
      if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
      if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
      if (typeof renderQP === 'function') { renderQP('missions'); }
      return;
    }

    q.step3Completed = true;
    q.step = 3;
    q.active = false;
    q.failed = false;

    S.renown = (S.renown || 0) + 1;
    try { if (typeof updateRenown === 'function') { updateRenown(); } } catch (err) {}
    S.credits = (S.credits || 0) + (q.rewardCredits || 250);
    try { if (typeof updateCreditsUI === 'function') { updateCreditsUI(); } } catch (err) {}

    var loot = [];
    try {
      if (typeof rollForLoot === 'function') {
        loot = rollForLoot('challenging') || [];
      }
    } catch (err) {
      loot = [];
    }
    q.rewardLoot = loot.slice();
    if (typeof addToBackpack === 'function') {
      for (var li = 0; li < loot.length; li++) {
        try { addToBackpack(loot[li]); } catch (err) {}
      }
    }

    if (!Array.isArray(S.completedMissions)) { S.completedMissions = []; }
    if (S.completedMissions.length >= 10) { S.completedMissions.shift(); }
    S.completedMissions.push({
      id: 'holding-quest-' + Date.now(),
      title: 'Establish Your Holding',
      difficulty: 'special',
      location: 'Province',
      success: true,
      reward: (q.rewardCredits || 250),
      loot: loot.slice(),
      infoFeature: q.infoFeature || null,
      additionalDanger: q.additionalDanger || null,
      completedAt: new Date().toISOString(),
      isHoldingQuest: true
    });
    
    // AUDIO: Mission complete
    if (typeof window.AudioManager !== 'undefined') {
      window.AudioManager.missionComplete();
    }
    if (window.TrophySystem) window.TrophySystem.check('first_mission');

    if (!S.holding.name) {
      rollHoldingName();
    }
    if (!S.holding.name) {
      S.holding.name = 'New Holding';
    }
    S.holding.established = true;
    q.holdingHex = q.holdingHex || q.siteHex || q.infoHex || null;
    try { placeHoldingQuestTokens(); } catch (err) {}
    try { updateHoldingTabVisibility(); } catch (err) {}
    try { renderHoldingUI(); } catch (err) {}
    try { if (typeof renderMissionBoard === 'function') { renderMissionBoard(); } } catch (err) {}
    try { if (typeof renderMissionTracker === 'function') { renderMissionTracker(); } } catch (err) {}
    try { if (typeof renderCompletedMissions === 'function') { renderCompletedMissions(); } } catch (err) {}
    try { if (typeof renderQP === 'function') { renderQP('missions'); } } catch (err) {}

    try { showNotif('Holding established! +1 Renown · +' + (q.rewardCredits || 250) + '₵' + (loot.length ? ' · Loot: ' + loot.join(', ') : ''), 'good'); } catch (err) {}

    try {
      if (typeof setContext === 'function') {
        var holdingCtxBtn = document.querySelector('.ctx-btn[onclick*="setContext(\'holding\'"]');
        setContext('holding', holdingCtxBtn || null);
      }
    } catch (err) {}
    try {
      if (typeof switchTab === 'function') {
        var holdingTabBtn = document.querySelector("button.tab-btn[onclick*=\"switchTab('holding'\"]");
        switchTab('holding', holdingTabBtn || null);
      }
    } catch (err) {}
  }

  function advanceHoldingQuest() {
    var q = S.holdingQuest || {};
    if (!q.active) { return; }
    if (!q.step1Completed) { holdingQuestStartStep1(); return; }
    if (!q.step2Completed) { holdingQuestStartStep2(); return; }
    holdingQuestStartStep3();
  }

  function getHoldingQuestBoardCardHtml() {
    ensureNewFeatureState();
    var q = S.holdingQuest || {};
    var renown = getHoldingGateRenown();
    var questDone = !!(q.step3Completed && !q.failed);
    var holdingEstablished = S.holding && (S.holding.established || questDone);
    if (renown < 9 || holdingEstablished) { return ''; }

    if (!q.active) {
      return '<div class="shop-card" style="display:flex;flex-direction:column;border-color:var(--gold);background:rgba(201,162,39,.05);">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.5rem;letter-spacing:.12em;color:var(--gold2);text-transform:uppercase;margin-bottom:.18rem;">LORD\'S CALLING</div>'
        + '<div class="s-name" style="color:var(--gold);">Establish Your Holding</div>'
        + '<div style="font-size:.78rem;color:var(--muted3);flex:1;margin:.2rem 0;line-height:1.45;">Complete a mission-style 3-step quest to claim your domain in the Province.</div>'
        + (q.failed ? '<div style="font-size:.74rem;color:var(--red2);margin:.15rem 0;">Previous attempt failed. You can retry now.</div>' : '')
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.4rem;padding-top:.3rem;border-top:1px solid var(--border);">'
        + '<span style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:.78rem;color:var(--gold2);">Special Quest</span>'
        + '<button class="btn btn-xs btn-teal" onclick="startHoldingQuest()">Begin \u2192</button>'
        + '</div>'
        + '</div>';
    }

    var s1Done = !!q.step1Completed;
    var s2Done = !!q.step2Completed;
    var s3Done = !!q.step3Completed;
    var btn1 = s1Done
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Info</button>'
      : '<button class="btn btn-xs btn-teal" onclick="holdingQuestStartStep1()">\u25B6 Info</button><button class="btn btn-xs" onclick="skipHoldingQuestStep1()" style="font-size:.62rem;">Skip</button>';
    var btn2 = s2Done
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Site</button>'
      : '<button class="btn btn-xs btn-teal" onclick="holdingQuestStartStep2()"' + (!s1Done ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Site</button>';
    var btn3 = s3Done
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Confront</button>'
      : '<button class="btn btn-xs btn-primary" onclick="holdingQuestStartStep3()"' + (!s2Done ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Confront</button>';

    return '<div class="shop-card" style="display:flex;flex-direction:column;border-color:var(--teal);background:rgba(46,196,182,.05);">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.5rem;letter-spacing:.12em;color:var(--teal);text-transform:uppercase;margin-bottom:.18rem;">IN PROGRESS</div>'
      + '<div class="s-name" style="color:var(--teal);">Establish Your Holding</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);margin:.15rem 0;">Step 1-3 flow matches Missions tab progression.</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">' + btn1 + btn2 + btn3 + '</div>'
      + '</div>';
  }

  function getHoldingQuestTrackerCardHtml() {
    ensureNewFeatureState();
    var q = S.holdingQuest || {};
    var questDone = !!(q.step3Completed && !q.failed);
    var holdingEstablished = S.holding && (S.holding.established || questDone);
    if (!q.active || holdingEstablished) { return ''; }

    var s1 = { completed: !!q.step1Completed, skipped: !!q.step1Skipped };
    var s2 = { completed: !!q.step2Completed };
    var s3 = { completed: !!q.step3Completed };
    var steps = [s1, s2, s3];
    var labels = {1:'Gather Info',2:'Go to Site',3:'Confrontation'};
    var stepsHtml = [1,2,3].map(function(n) {
      var step = steps[n - 1];
      var isActive = (n === 1 && !s1.completed) || (n === 2 && s1.completed && !s2.completed) || (n === 3 && s2.completed && !s3.completed);
      var color = step.completed ? 'var(--green2)' : isActive ? 'var(--teal)' : 'var(--border2)';
      var textCol = step.completed ? 'var(--muted2)' : isActive ? 'var(--text)' : 'var(--muted)';
      var marker = step.completed ? (step.skipped ? '\u2014' : '\u2713') : String(n);
      return '<div style="display:flex;align-items:center;gap:.3rem;padding:.15rem .2rem;">'
        + '<div style="width:1.3rem;height:1.3rem;border-radius:50%;border:1.5px solid ' + color + ';display:flex;align-items:center;justify-content:center;font-size:.65rem;color:' + color + ';flex-shrink:0;">' + marker + '</div>'
        + '<div style="font-size:.75rem;color:' + textCol + ';">' + labels[n] + (n === 1 ? ' <span style="color:var(--muted);font-size:.62rem;">[optional]</span>' : '') + '</div>'
        + '</div>';
    }).join('');

    var btn1 = s1.completed
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Info</button>'
      : '<button class="btn btn-xs btn-teal" onclick="holdingQuestStartStep1()">\u25B6 Info</button><button class="btn btn-xs" onclick="skipHoldingQuestStep1()" style="font-size:.62rem;">Skip</button>';
    var btn2 = s2.completed
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Site</button>'
      : '<button class="btn btn-xs btn-teal" onclick="holdingQuestStartStep2()"' + (!s1.completed ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Site</button>';
    var btn3 = s3.completed
      ? '<button class="btn btn-xs" style="opacity:.45;cursor:default;" disabled>\u2713 Confront</button>'
      : '<button class="btn btn-xs btn-primary" onclick="holdingQuestStartStep3()"' + (!s2.completed ? ' disabled style="opacity:.45;"' : '') + '>\u25B6 Confront</button>';

    return '<div style="background:var(--surface);border:1px solid rgba(46,196,182,.5);padding:.6rem;margin-bottom:.5rem;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;">'
      + '<div><div style="font-family:\'Cinzel\',serif;font-size:.8rem;color:var(--teal);margin-bottom:.1rem;">Establish Your Holding</div>'
      + '<div style="font-size:.7rem;color:var(--muted2);">Special Quest · DD d8 · Province</div></div>'
      + '</div>'
      + '<div style="border:1px solid var(--border);padding:.2rem .3rem;margin-bottom:.3rem;">' + stepsHtml + '</div>'
      + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">' + btn1 + btn2 + btn3 + '</div>'
      + '</div>';
  }

  function moveVaultItemToBackpack(i) {
    ensureNewFeatureState();
    var h = S.holding;
    if (!h.vault || !h.vault[i]) { return; }
    var item = h.vault[i];
    h.vault.splice(i, 1);
    if (!Array.isArray(S.backpack)) { S.backpack = Array(10).fill(""); }
    var slotIdx = S.backpack.indexOf("");
    if (slotIdx >= 0) {
      S.backpack[slotIdx] = item;
    } else {
      S.backpack.push(item);
    }
    renderHoldingUI();
    if (typeof renderBackpackUI === "function") { renderBackpackUI(); }
    showNotif("Moved to Backpack: " + item, "good");
  }

  function moveBackpackToVault() {
    ensureNewFeatureState();
    var bp = S.backpack || [];
    var lastIdx = -1;
    for (var i = bp.length - 1; i >= 0; i--) {
      if (bp[i] && bp[i].trim()) { lastIdx = i; break; }
    }
    if (lastIdx < 0) { showNotif("Backpack is empty!", "warn"); return; }
    if (!Array.isArray(S.holding.vault)) { S.holding.vault = []; }
    var item = bp[lastIdx];
    S.holding.vault.push(item);
    S.backpack[lastIdx] = "";
    renderHoldingUI();
    if (typeof renderBackpackUI === "function") { renderBackpackUI(); }
    showNotif("Moved to Vault: " + item, "good");
  }

  function collectTax() {
    var allLandmarks = S.holding.landmarks.concat(S.holding.extraLandmarks);
    var total = 0;
    var breakdown = [];
    allLandmarks.forEach(function(lm) {
      var earned = roll(4) * 10;
      total += earned;
      breakdown.push((lm.type || "Landmark") + " (" + (lm.name || "Unnamed") + "): +" + earned + "\u20B5");
    });
    S.credits = (S.credits || 0) + total;
    S.holding.taxLog.push("Season tax: +" + total + "\u20B5");
    updateCreditsUI();
    var el = document.getElementById("holdingTaxResult");
    if (el) {
      el.innerHTML = '<div style="background:rgba(201,162,39,.08);border:1px solid rgba(201,162,39,.3);padding:.4rem .55rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.2rem;">Tax Collected — End of Season</div>'
        + breakdown.map(function(b){ return '<div style="font-size:.78rem;color:var(--text2);">' + b + '</div>'; }).join("")
        + '<div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:1rem;color:var(--gold);margin-top:.25rem;">Total: +' + total + '\u20B5</div>'
        + '</div>';
    }
    renderHoldingUI();
    showNotif("Tax collected: +" + total + "\u20B5", "good");
  }

  function buyLandmark() {
    var cost = 5000;
    if ((S.credits || 0) < cost) {
      showNotif("Need " + cost + "\u20B5 to purchase a Landmark!", "warn"); return;
    }
    S.credits -= cost;
    var types = ["Dwelling", "Dwelling", "Temple", "Monument"];
    var names = ["Eastern Outpost", "River Crossing", "Hilltop Shrine", "Roadside Waystation", "Southern Farm", "Trade Post"];
    var newLandmark = { type: pick(types), name: pick(names), notes: "" };
    S.holding.extraLandmarks.push(newLandmark);
    updateCreditsUI();
    renderHoldingUI();
    showNotif("New Landmark purchased: " + newLandmark.type, "good");
  }

  function updateLandmarkName(i, value) {
    var baseLen = S.holding.landmarks.length;
    if (i < baseLen) { S.holding.landmarks[i].name = value; }
    else { S.holding.extraLandmarks[i - baseLen].name = value; }
  }

  function removeExtraLandmark(i) {
    S.holding.extraLandmarks.splice(i, 1);
    renderHoldingUI();
  }

  function updateCouncilMember(role, field, value) {
    if (!S.holding.council[role]) { S.holding.council[role] = {}; }
    S.holding.council[role][field] = value;
  }

  function adjustRetainers(role, delta) {
    if (!S.holding.council[role]) { S.holding.council[role] = { retainers: 3 }; }
    var mem = S.holding.council[role];
    mem.retainers = Math.max(0, ((mem.retainers !== undefined ? mem.retainers : 3) + delta));
    var el = document.getElementById("retainersVal-" + role);
    if (el) { el.textContent = mem.retainers; }
  }

  function activeCouncilTaskCount(role) {
    return (S.holding.councilTasks || []).filter(function(t) { return t.role === role && t.status === "assigned"; }).length;
  }

  function hireRetainer(role) {
    ensureNewFeatureState();
    if (!S.holding.council[role]) { return; }
    if ((S.holding.retainerContracts || 0) > 0) {
      S.holding.retainerContracts--;
      S.holding.council[role].retainers = (S.holding.council[role].retainers || 0) + 1;
      renderHoldingUI();
      showNotif("Retainer assigned to " + capFirst(role) + " (contract used)", "good");
      return;
    }
    if ((S.credits || 0) < 200) { showNotif("Need 200₵ to hire a Retainer.", "warn"); return; }
    S.credits -= 200;
    updateCreditsUI();
    S.holding.council[role].retainers = (S.holding.council[role].retainers || 0) + 1;
    renderHoldingUI();
    showNotif("Retainer hired for " + capFirst(role) + " (−200₵)", "good");
  }

  function removeCouncilTaskSite(taskId) {
    if (typeof mapData === "undefined" || !Array.isArray(mapData)) { return; }
    mapData.forEach(function(hex) {
      var d = hex.data || {};
      if (d.taskSite && d.taskSite.councilTaskId === taskId) {
        delete d.taskSite;
      }
    });
    if (typeof renderHexMap === "function") { renderHexMap(); }
  }

  function assignCourtTaskToMapAndCouncil(taskObj) {
    if (typeof mapData === "undefined" || !Array.isArray(mapData) || !mapData.length) {
      return false;
    }
    var candidates = mapData.filter(function(h) { return h.type === "wilderness"; });
    if (!candidates.length) { return false; }
    var dest = candidates[Math.floor(Math.random() * candidates.length)];
    dest.data = dest.data || {};
    dest.data.taskSite = {
      verb: taskObj.verb,
      target: taskObj.target,
      originCol: taskObj.originCol,
      originRow: taskObj.originRow,
      councilTaskId: taskObj.id
    };
    taskObj.destCol = dest.col;
    taskObj.destRow = dest.row;
    S.holding.councilTasks.push(taskObj);
    var roleTasks = S.holding.councilTasks.filter(function(t) { return t.role === taskObj.role && t.status === "assigned"; });
    if (S.holding.council[taskObj.role]) {
      S.holding.council[taskObj.role].task = roleTasks.length + " active task" + (roleTasks.length === 1 ? "" : "s");
      S.holding.council[taskObj.role].status = "Assigned";
    }
    if (typeof renderHexMap === "function") { renderHexMap(); }
    return true;
  }

  function rollCouncilTask(role) {
    var advDie = (S.stats && S.stats.adventure) || 4;
    var dreadTarget = (role === "regent" && (S.holding.crises || []).length > 0) ? 8 : 6;
    var a = explodingRoll(advDie, { type: 'action', major: true, label: 'Council Task AD' + advDie });
    var d = explodingRoll(dreadTarget, { type: 'dread', major: true, label: 'Council Task DD' + dreadTarget });
    var success = a.total >= d.total;
    var el = document.getElementById("councilResult-" + role);
    if (el) {
      el.innerHTML = '<span style="color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">'
        + a.total + ' vs ' + d.total + ' \u2014 ' + (success ? '\u2713 Success' : '\u2717 Failed') + '</span>';
    }

    if (role === "regent") {
      if (!(S.holding.crises || []).length) {
        showNotif("No active crises for the Regent to handle.", "neutral");
      } else if (success) {
        S.holding.regentFailures = 0;
        resolveCrisis(0);
        showNotif("Regent resolved one active Crisis.", "good");
      } else {
        S.holding.regentFailures = (S.holding.regentFailures || 0) + 1;
        if (S.holding.regentFailures >= 3 && roll(6) <= 3) {
          if (S.holdingQuest) { S.holdingQuest.holdingHex = null; }
          clearHoldingQuestTokens();
          if (typeof renderHexMap === "function") { renderHexMap(); }
          showNotif("Regent failures caused your Holding marker to disappear from the Planetary Expedition Map!", "warn");
        } else {
          showNotif("Regent failed to resolve the Crisis.", "warn");
        }
      }
      renderHoldingUI();
    } else {
      var tasks = (S.holding.councilTasks || []).filter(function(t) { return t.role === role && t.status === "assigned"; });
      if (!tasks.length) {
        showNotif(capFirst(role) + " has no assigned tasks.", "neutral");
      } else if (success) {
        onHoldingCouncilTaskResolved(tasks[0].id, true);
      } else {
        onHoldingCouncilTaskResolved(tasks[0].id, false);
      }
    }

    if (success) {
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('spell', Math.max(1, a.total - d.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Council task: ' + role
        });
      }
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome('spell', Math.max(1, d.total - a.total), {
          actionTotal: a.total,
          dreadTotal: d.total,
          context: 'Council task: ' + role
        });
      }
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
  }

  function generateCourtEvent(type) {
    var el = document.getElementById("holdingCourtResult");
    if (!el) { return; }
    S.holding.pendingCourtType = type;
    var events = type === "commoner" ? COURT_COMMONER_TASKS : (type === "military" ? [
      "Scouts report hostile movement near the border roads.",
      "A fortified raider camp threatens nearby villages.",
      "Supply lines are being cut by organized ambushers.",
      "A garrison requests reinforcements before nightfall.",
      "An old watchtower has gone silent and must be reclaimed."
    ] : COURT_ACOLYTE_TASKS);
    var event = pick(events);
    var borderColor = type === "commoner" ? "var(--teal)" : (type === "military" ? "var(--red2)" : "var(--purple)");
    var labelColor  = borderColor;
    var label = type === "commoner" ? "\uD83D\uDC65 Commoner Petition" : (type === "military" ? "⚔ Commander Request" : "\uD83D\uDCFF Acolyte Decree");
    el.innerHTML = '<div style="background:var(--surface);border-left:2px solid ' + borderColor + ';padding:.5rem .65rem;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.12em;color:' + labelColor + ';text-transform:uppercase;margin-bottom:.18rem;">' + label + '</div>'
      + '<div style="font-size:.83rem;color:var(--text2);line-height:1.6;">' + event + '</div>'
      + '<div style="margin-top:.4rem;"><button class="btn btn-xs btn-primary" onclick="generateCourtTask()">⚄ Generate Task</button></div>'
      + '<div id="courtTaskResult" style="margin-top:.3rem;font-size:.8rem;color:var(--gold2);"></div>'
      + '</div>';
  }

  function generateCourtTask() {
    ensureNewFeatureState();
    var pType = S.holding.pendingCourtType || "commoner";
    var role = pType === "commoner" ? "diplomat" : (pType === "acolyte" ? "elder" : "commander");
    var retainers = ((S.holding.council[role] || {}).retainers) || 0;
    if (activeCouncilTaskCount(role) >= retainers) {
      showNotif(capFirst(role) + " is at capacity. Hire more Retainers.", "warn");
      return;
    }

    var verb = pick(TASK_VERBS);
    var target = pick(TASK_TARGETS);
    var task = verb + " " + target + ", " + (roll(4) + 1) + " hexes " + pick(TASK_DIRS) + ".";
    var taskObj = {
      id: Date.now() + Math.random(),
      type: pType,
      role: role,
      verb: verb,
      target: target,
      summary: verb + " " + target,
      status: "assigned",
      createdAt: new Date().toISOString(),
      originCol: null,
      originRow: null
    };
    if (!assignCourtTaskToMapAndCouncil(taskObj)) {
      showNotif("No valid wilderness hex available for this task.", "warn");
      return;
    }

    var el = document.getElementById("courtTaskResult");
    if (el) { el.innerHTML = "Task: " + task + " Assigned to <strong>" + capFirst(role) + "</strong> at Hex [" + (taskObj.destCol + 1) + "," + (taskObj.destRow + 1) + "]"; }
    showNotif("Court task assigned to " + capFirst(role) + ".", "good");
    renderHoldingUI();
  }

  function onHoldingCouncilTaskResolved(taskId, success) {
    ensureNewFeatureState();
    var tasks = S.holding.councilTasks || [];
    var t = tasks.filter(function(x) { return x.id === taskId; })[0];
    if (!t) { return; }
    t.status = success ? "resolved" : "failed";
    removeCouncilTaskSite(taskId);
    S.holding.councilTasks = tasks.filter(function(x) { return x.id !== taskId; });
    var roleTasks = S.holding.councilTasks.filter(function(x) { return x.role === t.role && x.status === "assigned"; });
    if (S.holding.council[t.role]) {
      S.holding.council[t.role].task = roleTasks.length ? (roleTasks.length + " active task" + (roleTasks.length === 1 ? "" : "s")) : "";
      S.holding.council[t.role].status = roleTasks.length ? "Assigned" : "Idle";
    }
    if (success) {
      showNotif("Council task resolved: " + t.summary, "good");
    } else {
      showNotif("Council task failed: " + t.summary, "warn");
    }
    renderHoldingUI();
  }

  function rollLeadershipPeril() {
    var r = roll(6);
    var html = "";
    if (r <= 2) {
      var c1 = CRISIS_TYPES[roll(6) - 1];
      var c2 = CRISIS_TYPES[roll(6) - 1];
      addCrisis(c1);
      addCrisis(c2);
      html = '<div style="background:rgba(201,64,64,.08);border:1px solid rgba(201,64,64,.3);padding:.5rem .6rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.58rem;letter-spacing:.1em;color:var(--red2);text-transform:uppercase;margin-bottom:.2rem;">d6=' + r + ' \u2014 Catastrophe</div>'
        + '<div style="font-size:.82rem;color:var(--text2);">Two crises erupt: <strong>' + c1.name + '</strong> and <strong>' + c2.name + '</strong>.</div>'
        + '</div>';
    } else if (r <= 4) {
      var idx1 = roll(6) - 1;
      var idx2 = roll(6) - 1;
      var cr1 = CRISIS_TYPES[idx1];
      var cr2 = CRISIS_TYPES[idx2];
      html = '<div style="background:rgba(201,162,39,.07);border:1px solid rgba(201,162,39,.3);padding:.5rem .6rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.58rem;letter-spacing:.1em;color:var(--gold2);text-transform:uppercase;margin-bottom:.2rem;">d6=' + r + ' \u2014 Conundrum</div>'
        + '<div style="font-size:.82rem;color:var(--text2);margin-bottom:.35rem;">Choose one crisis to face:</div>'
        + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;">'
        + '<button class="btn btn-sm btn-red" onclick="addCrisisByIndex(' + idx1 + ')">Face ' + cr1.name + '</button>'
        + '<button class="btn btn-sm btn-red" onclick="addCrisisByIndex(' + idx2 + ')">Face ' + cr2.name + '</button>'
        + '</div>'
        + '</div>';
    } else {
      html = '<div style="background:rgba(76,175,116,.07);border:1px solid rgba(76,175,116,.3);padding:.5rem .6rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.58rem;letter-spacing:.1em;color:var(--green2);text-transform:uppercase;margin-bottom:.2rem;">d6=' + r + ' \u2014 Tranquility</div>'
        + '<div style="font-size:.82rem;color:var(--text2);">A period of relative peace. No crises arise this Season.</div>'
        + '</div>';
    }
    var el = document.getElementById("holdingPerilResult");
    if (el) { el.innerHTML = html; }
    renderHoldingUI();
  }

  function addCrisisByIndex(idx) {
    addCrisis(CRISIS_TYPES[idx]);
    renderHoldingUI();
  }

  function addCrisis(crisis) {
    var already = S.holding.crises.filter(function(c){ return c.name === crisis.name; }).length > 0;
    if (already) { return; }
    S.holding.crises.push({ name: crisis.name, desc: crisis.desc, resolution: crisis.resolution });
    renderHoldingCrises();
  }

  function addManualCrisis() {
    var crisis = CRISIS_TYPES[roll(6) - 1];
    addCrisis(crisis);
    renderHoldingUI();
    showNotif("Crisis added: " + crisis.name, "warn");
  }

  function resolveCrisis(i) {
    S.holding.crises.splice(i, 1);
    renderHoldingCrises();
    showNotif("Crisis resolved!", "good");
  }

  function clearAllCrises() {
    S.holding.crises = [];
    renderHoldingCrises();
  }

  // ── PATH TOKEN UPGRADES ────────────────────────────────────────────────────────
  function spendPathTokensUpgrade15() {
    ensureNewFeatureState();
    if ((S.pathTokens || 0) < 15) {
      showNotif("Need 15 Path Tokens to step up an Action Die!", "warn"); return;
    }
    var statKeys = ["body", "strike", "shoot", "mind", "spirit", "defend", "control", "lead", "adventure"];
    var opts = statKeys.map(function(s) {
      var val = (S.stats && S.stats[s]) || 4;
      var canUp = val < 20;
      return '<button class="btn btn-sm btn-teal" style="margin:.2rem;" onclick="doPathUpgrade15(\'' + s + '\')" '
        + (!canUp ? 'disabled style="opacity:.4;"' : '') + '>'
        + s.charAt(0).toUpperCase() + s.slice(1) + ' (d' + val + (canUp ? '' : ' \u2014 max') + ')</button>';
    }).join("");
    openModal("Step Up Action Die — 15 Path Tokens",
      '<div style="font-size:.85rem;color:var(--muted3);margin-bottom:.6rem;">Choose which Action Die to step up. Current tokens: <strong style="color:var(--teal);">' + S.pathTokens + '</strong></div>'
      + '<div style="display:flex;flex-wrap:wrap;">' + opts + '</div>'
    );
  }

  function doPathUpgrade15(stat) {
    if ((S.pathTokens || 0) < 15) { closeModal(); showNotif("Not enough Path Tokens!", "warn"); return; }
    var current = (S.stats && S.stats[stat]) || 4;
    var next = stepUp(current);
    if (next === current) { showNotif(stat + " is already at maximum (d20)!", "warn"); closeModal(); return; }
    S.stats[stat] = next;
    S.pathTokens -= 15;
    var ptEl = document.getElementById("pathTokensVal");
    if (ptEl) { ptEl.textContent = S.pathTokens; }
    if (typeof updateDieDisplay === "function") { updateDieDisplay(stat); }
    if (typeof updateMaxStressDisplay === "function") { updateMaxStressDisplay(); }
    showNotif(stat.charAt(0).toUpperCase() + stat.slice(1) + " stepped up to d" + next + "! (\u221215 Path Tokens)", "good");
    closeModal();
  }

  function spendPathTokensUpgrade20() {
    ensureNewFeatureState();
    if ((S.pathTokens || 0) < 20) {
      showNotif("Need 20 Path Tokens to gain a new Personal Trait!", "warn"); return;
    }
    var newTrait = pick(PERSONAL_FLAVORS);
    S.pathTokens -= 20;
    S.extraTraits.push(newTrait);
    var ptEl = document.getElementById("pathTokensVal");
    if (ptEl) { ptEl.textContent = S.pathTokens; }
    renderExtraTraits();
    showNotif("New Personal Trait unlocked!", "good");
    openModal("New Personal Trait — 20 Path Tokens",
      '<div style="font-size:.85rem;color:var(--muted3);margin-bottom:.4rem;">You have gained a new Personal Trait:</div>'
      + '<div style="background:var(--surface);border:1px solid var(--gold);padding:.6rem .8rem;font-family:\'Cinzel\',serif;font-size:.85rem;color:var(--gold2);">' + newTrait + '</div>'
      + '<div style="font-size:.76rem;color:var(--muted2);margin-top:.4rem;">Remaining Path Tokens: ' + S.pathTokens + '</div>'
    );
  }

  function renderExtraTraits() {
    var el = document.getElementById("extraTraitsDisplay");
    if (!el) { return; }
    ensureNewFeatureState();
    if (!S.extraTraits.length) {
      el.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">No extra traits yet. Spend 20 Path Tokens to unlock one.</div>';
      return;
    }
    el.innerHTML = S.extraTraits.map(function(t, i) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.22rem .4rem;background:var(--surface);border:1px solid var(--border2);margin-bottom:.2rem;">'
        + '<span style="font-size:.8rem;color:var(--gold2);">' + t + '</span>'
        + '<button class="btn btn-xs btn-red" onclick="removeExtraTrait(' + i + ')">✕</button>'
        + '</div>';
    }).join("");
  }

  function removeExtraTrait(i) {
    ensureNewFeatureState();
    S.extraTraits.splice(i, 1);
    renderExtraTraits();
  }

  // ── COMBAT MAP ────────────────────────────────────────────────────────────────
  var combatMapUnitId = 100;

  function syncMapFromTrackers() {
    ensureNewFeatureState();
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.active) { return; }
    function spacingToZone(spacingVal) {
      var txt = String(spacingVal || '');
      if (txt.indexOf('Engaged') >= 0) { return 'Engaged'; }
      if (txt.indexOf('Close') >= 0) { return 'Close'; }
      if (txt.indexOf('Far') >= 0) { return 'Far'; }
      return 'Nearby';
    }
    // Auto-add player as ally if not on the map yet
    var playerName = (typeof S !== 'undefined' && S.name && S.name.trim()) ? S.name : 'You';
    var hasPlayer = S.combatMap.units.some(function(u){ return u.side === 'ally' && u.name === playerName; });
    var spacingEl = document.getElementById('spacingSelect');
    var relativeEnemyZone = spacingToZone(spacingEl ? spacingEl.value : 'Nearby (Shoot)');
    var spacingChanged = S.combatMap.lastRelativeZone !== relativeEnemyZone;
    S.combatMap.lastRelativeZone = relativeEnemyZone;
    if (!hasPlayer) {
      S.combatMap.units.push({ id: combatMapUnitId++, name: playerName, side: 'ally', zone: 'Engaged', isPlayer: true });
    } else if (hasPlayer) {
      S.combatMap.units.forEach(function(u) {
        if (u.side === 'ally' && (u.name === playerName || u.isPlayer)) { u.zone = 'Engaged'; u.isPlayer = true; }
      });
    }

    // Auto-sync enemies/companions from the combat tracker into map markers.
    if (!Array.isArray(S.enemies)) { return; }
    var desired = {};
    S.enemies.forEach(function(enemy, idx) {
      if (!enemy) { return; }
      var baseName = String(enemy.name || ((enemy.ally ? 'Ally' : 'Enemy') + ' ' + (idx + 1)));
      var faction = enemy.faction ? (' [' + String(enemy.faction) + ']') : '';
      var side = enemy.ally ? 'ally' : 'enemy';
      var key = side + ':' + String(enemy.id != null ? enemy.id : baseName);
      desired[key] = { key: key, name: baseName + faction, side: side };
    });
    // Auto-add campaign allies from shared state (multiplayer)
    try {
      if (typeof window.campaignSystem !== 'undefined' && typeof window.campaignSystem.getSharedState === 'function') {
        var shared = window.campaignSystem.getSharedState();
        if (shared && Array.isArray(shared.participants)) {
          var myToken = null;
          if (typeof window.campaignSystem.getState === 'function') {
            var myState = window.campaignSystem.getState();
            if (myState) myToken = myState.token;
          }
          shared.participants.forEach(function(p) {
            if (!p || !p.token || !p.name || p.isEnemy || p.token === myToken) return;
            var allyKey = 'ally:' + String(p.token);
            if (!desired[allyKey]) {
              desired[allyKey] = { key: allyKey, name: String(p.name || 'Ally'), side: 'ally' };
            }
          });
        }
      }
    } catch(_err) {}

    S.combatMap.units.forEach(function(unit) {
      if (!unit || !unit.fromTracker || !unit.trackerKey) { return; }
      var data = desired[unit.trackerKey];
      if (!data) { return; }
      unit.name = data.name;
      unit.side = data.side;
      if (unit.side === 'enemy' && spacingChanged) { unit.zone = relativeEnemyZone; }
    });

    Object.keys(desired).forEach(function(key) {
      var found = S.combatMap.units.some(function(u){ return !!u && u.fromTracker && u.trackerKey === key; });
      if (found) { return; }
      var existingMatch = S.combatMap.units.find(function(u) {
        if (!u) { return false; }
        if (u.isPlayer) { return false; }
        return u.side === desired[key].side && String(u.name || '') === String(desired[key].name || '');
      });
      if (existingMatch) {
        existingMatch.fromTracker = true;
        existingMatch.trackerKey = key;
        existingMatch.side = desired[key].side;
        existingMatch.name = desired[key].name;
        if (existingMatch.side === 'enemy' && spacingChanged) { existingMatch.zone = relativeEnemyZone; }
        return;
      }
      S.combatMap.units.push({
        id: combatMapUnitId++,
        name: desired[key].name,
        side: desired[key].side,
        zone: desired[key].side === 'enemy' ? relativeEnemyZone : 'Engaged',
        fromTracker: true,
        trackerKey: key
      });
    });

    S.combatMap.units = S.combatMap.units.filter(function(unit) {
      if (!unit || !unit.fromTracker || !unit.trackerKey) { return true; }
      return !!desired[unit.trackerKey];
    });

    var seenTracker = {};
    S.combatMap.units = S.combatMap.units.filter(function(unit) {
      if (!unit || !unit.fromTracker || !unit.trackerKey) { return true; }
      if (seenTracker[unit.trackerKey]) { return false; }
      seenTracker[unit.trackerKey] = true;
      return true;
    });
  }

  function getSceneCoverOverlays(zones) {
    var overlays = {};
    if (typeof S === 'undefined' || !S || !S.combat || !S.combat.sceneOpener) { return overlays; }
    var opener = S.combat.sceneOpener;
    var tier = String(opener.coverTier || '');
    if (!tier || tier === 'none') { return overlays; }
    var terrain = String(opener.zoneTerrain || '');
    var targets = [];
    if (/far zone/i.test(terrain)) { targets = ['Far']; }
    else if (/close\/nearby/i.test(terrain)) { targets = ['Close', 'Nearby']; }
    else if (/engaged only/i.test(terrain)) { targets = ['Engaged']; }
    else if (/no far zone/i.test(terrain)) { targets = ['Engaged', 'Close', 'Nearby']; }
    else { targets = zones.slice(); }

    var terrainLabel = 'Mixed Terrain';
    var terrainIcon = '🧱';
    if (/dense jungle|forest/i.test(terrain)) { terrainLabel = 'Dense Jungle / Forest'; terrainIcon = '🌿'; }
    else if (/ruined structure|urban alley|shipwreck|debris/i.test(terrain)) { terrainLabel = 'Urban Ruins'; terrainIcon = '🏚'; }
    else if (/cavern|tunnel/i.test(terrain)) { terrainLabel = 'Cavern / Tunnel'; terrainIcon = '🕳'; }
    else if (/crater/i.test(terrain)) { terrainLabel = 'Crater Field'; terrainIcon = '🪨'; }
    else if (/storm/i.test(terrain)) { terrainLabel = 'Storm Zone'; terrainIcon = '⛈'; }
    else if (/open field/i.test(terrain)) { terrainLabel = 'Open Field'; terrainIcon = '🌾'; }

    var coverLabel = tier === 'partial' ? 'Partial Cover (+1 Defend)'
      : tier === 'heavy' ? 'Heavy Cover (+2 Defend)'
      : 'Full Cover (immune to ranged)';
    var coverIcon = tier === 'partial' ? '🛡' : tier === 'heavy' ? '🛡🛡' : '🏰';
    var badgeBg = tier === 'partial' ? 'rgba(201,162,39,.14)'
      : tier === 'heavy' ? 'rgba(201,100,39,.16)'
      : 'rgba(201,64,64,.14)';
    var badgeBorder = tier === 'partial' ? 'rgba(201,162,39,.55)'
      : tier === 'heavy' ? 'rgba(201,100,39,.55)'
      : 'rgba(201,64,64,.55)';
    var stripe = tier === 'partial'
      ? 'repeating-linear-gradient(135deg,rgba(201,162,39,.12),rgba(201,162,39,.12) 6px,rgba(255,255,255,0) 6px,rgba(255,255,255,0) 12px)'
      : tier === 'heavy'
      ? 'repeating-linear-gradient(135deg,rgba(201,100,39,.13),rgba(201,100,39,.13) 6px,rgba(255,255,255,0) 6px,rgba(255,255,255,0) 12px)'
      : 'repeating-linear-gradient(135deg,rgba(201,64,64,.14),rgba(201,64,64,.14) 6px,rgba(255,255,255,0) 6px,rgba(255,255,255,0) 12px)';

    targets.forEach(function(zone) {
      overlays[zone] = (overlays[zone] || '')
        + '<div style="margin-top:.22rem;padding:.2rem .34rem;background:'+badgeBg+';background-image:'+stripe+';border:1px solid '+badgeBorder+';border-radius:4px;font-size:.62rem;color:var(--text2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 0 6px rgba(0,0,0,.15);">'
        + '<div style="display:flex;justify-content:space-between;gap:.3rem;align-items:center;">'
        + '<span style="font-weight:700;letter-spacing:.02em;">'+coverIcon+' ' + coverLabel + '</span>'
        + '<span style="font-size:.56rem;color:var(--muted2);">COVER</span>'
        + '</div>'
        + '<div style="margin-top:.1rem;font-size:.58rem;color:var(--muted2);">'+terrainIcon+' ' + terrainLabel + '</div>'
        + '</div>';
    });
    return overlays;
  }

  function getFlavorOverlays() {
    // Returns an object keyed by zone with overlay HTML for any active Personal Flavor effects
    var overlays = {};
    if (typeof S === 'undefined' || !S.flavor) { return overlays; }
    var flavor = String(S.flavor).toLowerCase();
    var domeActive = typeof isFlavorRoundEffectActive === 'function' && isFlavorRoundEffectActive('psychicDome');
    if (domeActive && (flavor.indexOf('psychic dome') >= 0 || flavor.indexOf('dome') >= 0)) {
      // Find zone where the player is
      var playerName = S.name && S.name.trim() ? S.name : 'You';
      var playerUnit = S.combatMap.units.filter(function(u){ return u.side === 'ally' && u.name === playerName; })[0];
      var domeZone = playerUnit ? playerUnit.zone : 'Nearby';
      overlays[domeZone] = (overlays[domeZone] || '')
        + '<div style="margin-top:.2rem;padding:.18rem .35rem;background:rgba(147,112,219,.18);border:1px solid rgba(147,112,219,.6);border-radius:4px;font-size:.63rem;color:#b39ddb;display:flex;align-items:center;gap:.25rem;">'
        + '<span style="font-size:.8rem;">🔮</span><span><strong>Psychic Dome</strong> — up to 4 people, cannot be attacked within. Full Cover active in this zone.</span></div>';
    }
    // Torchbearer / Cinder Skin — light hazard in zone
    if (flavor.indexOf('torchbearer') >= 0 || flavor.indexOf('cinder') >= 0) {
      overlays['Engaged'] = (overlays['Engaged'] || '')
        + '<div style="margin-top:.2rem;padding:.15rem .3rem;background:rgba(201,100,39,.15);border:1px solid rgba(201,100,39,.5);border-radius:4px;font-size:.63rem;color:var(--orange);">🔥 Heat Aura — enemies in Engaged zone take −1 to all rolls.</div>';
    }
    // Frost / Cold Ward
    if (flavor.indexOf('frost') >= 0 || flavor.indexOf('cold ward') >= 0) {
      overlays['Engaged'] = (overlays['Engaged'] || '')
        + '<div style="margin-top:.2rem;padding:.15rem .3rem;background:rgba(100,180,220,.12);border:1px solid rgba(100,180,220,.45);border-radius:4px;font-size:.63rem;color:#90caf9;">❄ Frost Ward — Cold immunity active · Nearby zone count as Close.</div>';
    }
    return overlays;
  }

  function renderCombatMap() {
    var el = document.getElementById("combatMapZones");
    if (!el) { return; }
    ensureNewFeatureState();
    syncMapFromTrackers();
    var zones = ["Engaged", "Close", "Nearby", "Far"];
    var zoneInfo = {
      Engaged: { color: "rgba(201,64,64,.07)",    border: "rgba(201,64,64,.35)",    range: "Melee / Strike" },
      Close:   { color: "rgba(201,162,39,.06)",   border: "rgba(201,162,39,.3)",    range: "Spells / Items" },
      Nearby:  { color: "rgba(46,196,182,.06)",   border: "rgba(46,196,182,.3)",    range: "Ranged / Shoot" },
      Far:     { color: "rgba(122,120,152,.06)",  border: "rgba(122,120,152,.25)",  range: "Out of Range" }
    };
    var flavOverlays = {};
    var coverOverlays = {};
    // Determine player zone for distance indicator
    var playerName2 = (typeof S !== 'undefined' && S.name && S.name.trim()) ? S.name : 'You';
    var playerUnit2 = S.combatMap.units.filter(function(u){ return u.side === 'ally' && u.name === playerName2; })[0];
    var playerZoneIdx = playerUnit2 ? zones.indexOf(playerUnit2.zone) : -1;
    var ZONE_DIST_NAMES = ['Adjacent Hex','Two Hexes away','Three Hexes away','Four Hexes away'];
    el.innerHTML = zones.map(function(zone) {
      var info = zoneInfo[zone];
      var units = S.combatMap.units.filter(function(u){ return u.zone === zone; });
      var allies  = units.filter(function(u){ return u.side === "ally"; });
      var enemies = units.filter(function(u){ return u.side === "enemy"; });
      var zoneOptions = zones.map(function(z){ return '<option value="' + z + '"' + (z === zone ? ' selected' : '') + '>' + z + '</option>'; }).join("");
      var zoneIdx = zones.indexOf(zone);
      var distBadge = '';
      if (playerZoneIdx >= 0 && playerUnit2) {
        var dist = Math.abs(zoneIdx - playerZoneIdx);
        var distLabel = ['You are here',''+ZONE_DIST_NAMES[dist-1]||'','',''][Math.min(dist,3)];
        if (dist === 0) distLabel = '📍 You';
        else distLabel = ZONE_DIST_NAMES[dist - 1] || '';
        distBadge = '<span style="font-size:.58rem;color:var(--muted);margin-left:.35rem;">'+distLabel+'</span>';
      }
      var allyTags = allies.map(function(u) {
        var isPlayer = !!u.isPlayer || u.name === playerName2;
        return '<div style="background:rgba(46,196,182,.13);border:1px solid var(--teal);padding:.14rem .32rem;font-size:.7rem;color:var(--teal);display:inline-flex;align-items:center;gap:.2rem;margin:.1rem;">'
          + '<span>\uD83D\uDFE6 ' + u.name + '</span>'
          + (isPlayer
            ? '<span style="font-size:.62rem;color:var(--gold2);">(You)</span>'
            : '<select style="background:transparent;border:none;color:var(--teal);font-size:.62rem;cursor:pointer;" onchange="moveCombatUnit(' + u.id + ',this.value)">' + zoneOptions + '</select>'
          )
          + (isPlayer
            ? ''
            : '<button style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:0;font-size:.68rem;line-height:1;" onclick="removeCombatUnit(' + u.id + ')">✕</button>'
          )
          + '</div>';
      }).join("");
      var enemyTags = enemies.map(function(u) {
        return '<div style="background:rgba(201,64,64,.13);border:1px solid var(--red);padding:.14rem .32rem;font-size:.7rem;color:var(--red2);display:inline-flex;align-items:center;gap:.2rem;margin:.1rem;">'
          + '<span>\uD83D\uDD34 ' + u.name + '</span>'
          + '<select style="background:transparent;border:none;color:var(--red2);font-size:.62rem;cursor:pointer;" onchange="moveCombatUnit(' + u.id + ',this.value)">' + zoneOptions + '</select>'
          + '<button style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:0;font-size:.68rem;line-height:1;" onclick="removeCombatUnit(' + u.id + ')">✕</button>'
          + '</div>';
      }).join("");
      var overlay = (coverOverlays[zone] || '') + (flavOverlays[zone] || '');
      return '<div style="border:2px solid ' + info.border + ';background:' + info.color + ';padding:.45rem .55rem;margin-bottom:.3rem;' + (overlay ? 'box-shadow:0 0 6px '+info.border+';' : '') + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:' + info.border + ';">' + zone + distBadge + '</div>'
        + '<div style="font-size:.62rem;color:var(--muted2);">' + info.range + '</div>'
        + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;min-height:1.4rem;">'
        + allyTags + enemyTags
        + (!units.length ? '<div style="font-size:.66rem;color:var(--muted);font-style:italic;">empty</div>' : '')
        + '</div>'
        + '</div>';
    }).join("");
  }

  function addCombatUnit(side) {
    ensureNewFeatureState();
    var enemyCount = 0;
    for (var i = 0; i < S.combatMap.units.length; i++) {
      if (S.combatMap.units[i].side === "enemy") { enemyCount++; }
    }
    var defaultName = side === "ally"
      ? (S.name && S.name.trim() ? S.name : "Self")
      : "Enemy " + (enemyCount + 1);
    var name = prompt((side === "ally" ? "Add ally name:" : "Add enemy name:"), defaultName);
    if (!name) { return; }
    if (typeof addTrackedCombatantFromMap === 'function') {
      addTrackedCombatantFromMap(side, name.trim(), 'Nearby');
      return;
    }
    S.combatMap.units.push({ id: combatMapUnitId++, name: name.trim(), side: side, zone: 'Nearby' });
    renderCombatMap();
    renderCombatOptions();
    if (typeof syncStarsUnitsFromCombatMap === 'function') { syncStarsUnitsFromCombatMap(); }
  }

  function moveCombatUnit(id, zone) {
    var unit = S.combatMap.units.filter(function(u){ return u.id === id; })[0];
    if (unit) {
      var prevZone = unit.zone;
      unit.zone = zone;
      if (unit.side === 'enemy' && prevZone !== zone && typeof maybeResetActionsAfterDefend === 'function') {
        maybeResetActionsAfterDefend();
        if (typeof showNotif === 'function') {
          showNotif('Enemy repositioned (counts as 1 enemy action).', 'warn');
        }
      }
      renderCombatMap();
      renderCombatOptions();
      if (typeof updateCombatUI === 'function') { updateCombatUI(); }
      if (typeof syncCombatSpacingToPrimaryEnemy === 'function') { syncCombatSpacingToPrimaryEnemy(); }
      if (typeof syncStarsUnitsFromCombatMap === 'function') { syncStarsUnitsFromCombatMap(); }
    }
  }

  function removeCombatUnit(id) {
    var unit = S.combatMap.units.filter(function(u){ return u.id === id; })[0];
    if (unit && typeof removeTrackedCombatantByMapUnit === 'function' && removeTrackedCombatantByMapUnit(unit)) {
      return;
    }
    S.combatMap.units = S.combatMap.units.filter(function(u){ return u.id !== id; });
    renderCombatMap();
    renderCombatOptions();
    if (typeof syncStarsUnitsFromCombatMap === 'function') { syncStarsUnitsFromCombatMap(); }
  }

  function clearCombatMap() {
    ensureNewFeatureState();
    S.combatMap.units = [];
    renderCombatMap();
    renderCombatOptions();
    if (typeof syncStarsUnitsFromCombatMap === 'function') { syncStarsUnitsFromCombatMap(); }
  }

  // ── COMBAT OPTIONS (distance-aware) ──────────────────────────────────────────
  var ZONE_ORDER = ["Engaged", "Close", "Nearby", "Far"];
  var ZONE_DIST = { Engaged: 0, Close: 1, Nearby: 2, Far: 3 };

  var ALL_COMBAT_OPTIONS = [
    { id: "standard",  label: "Standard Attack",  cost: "1 Action",  zones: ["Engaged","Close","Nearby"],  desc: "Roll Strike or Shoot vs Dread. Hit = difference in Health (min 1).", tags: ["Engaged","Close","Nearby"] },
    { id: "heavy",     label: "Heavy Attack",      cost: "2 Actions", zones: ["Engaged","Close","Nearby"],  desc: "Deal +2 Health on hit.", tags: ["Engaged","Close","Nearby"] },
    { id: "fast",      label: "Fast Attack",       cost: "1 Action",  zones: ["Engaged","Close","Nearby"],  desc: "Die steps down by one. Quick but weaker.", tags: ["Engaged","Close","Nearby"] },
    { id: "stance",    label: "Stance",            cost: "1 Action",  zones: ["Engaged","Close","Nearby","Far"], desc: "Aggressive (+1 Strike, −1 Defend) or Defensive (vice versa).", tags: [] },
    { id: "switch",    label: "Switch",            cost: "1 Action",  zones: ["Engaged","Close","Nearby","Far"], desc: "Change weapons or adjust spacing.", tags: [] },
    { id: "item",      label: "Use Item",          cost: "1 Action",  zones: ["Engaged","Close","Nearby","Far"], desc: "Use a readied item from your gear.", tags: [] },
    { id: "help",      label: "Help / Stand",      cost: "1 Action",  zones: ["Engaged","Close","Nearby"],  desc: "Spend 1 Action to help an ally — they gain an Advantage Die.", tags: ["Close","Nearby"] },
    { id: "move",      label: "Move Zone",         cost: "1 Action",  zones: ["Engaged","Close","Nearby","Far"], desc: "Change zone for 1 Action. Zero-G or Underwater costs +1.", tags: [] },
    { id: "cover",     label: "Take Cover",        cost: "1 Action",  zones: ["Nearby","Far"],              desc: "Partial: +1 Defend. Full: cannot be targeted by ranged attacks.", tags: ["Nearby","Far"] },
    { id: "surprise",  label: "Surprise Round",    cost: "Setup",     zones: ["Engaged","Close","Nearby","Far"], desc: "+2 to first round attacks for the acting party.", tags: [] }
  ];

  function renderCombatOptions() {
    var el = document.getElementById("combatOptionsPanel");
    if (!el) { return; }
    ensureNewFeatureState();
    // Determine player (first ally unit) zone
    var allies  = S.combatMap.units.filter(function(u){ return u.side === "ally"; });
    var enemies = S.combatMap.units.filter(function(u){ return u.side === "enemy"; });
    if (!allies.length && !enemies.length) { el.innerHTML = ""; return; }

    var playerZone = allies.length ? allies[0].zone : null;

    // Closest enemy zone
    var closestEnemyDist = 99;
    enemies.forEach(function(u) {
      var d = ZONE_DIST[u.zone];
      if (d !== undefined && d < closestEnemyDist) { closestEnemyDist = d; }
    });
    var playerDist = playerZone !== null ? ZONE_DIST[playerZone] : 99;

    var rows = ALL_COMBAT_OPTIONS.map(function(opt) {
      var available = playerZone === null || opt.zones.indexOf(playerZone) >= 0;
      // Ranged/melee logic: if no enemies within range, grey out attack options
      var inRange = true;
      if (["standard","heavy","fast","help"].indexOf(opt.id) >= 0) {
        inRange = playerZone === null || (enemies.length === 0) || (closestEnemyDist <= playerDist + 1);
        if (opt.id === "help") { inRange = true; } // help is always possible near ally
      }
      var avail = available && inRange;
      return '<tr style="opacity:' + (avail ? "1" : ".38") + ';' + (avail ? "background:rgba(46,196,182,.04);" : "") + '">'
        + '<td style="padding:.22rem .4rem;font-size:.72rem;font-weight:600;color:' + (avail ? "var(--text)" : "var(--muted2)") + ';white-space:nowrap;">' + opt.label + '</td>'
        + '<td style="padding:.22rem .4rem;font-size:.7rem;color:var(--gold2);white-space:nowrap;">' + opt.cost + '</td>'
        + '<td style="padding:.22rem .4rem;font-size:.68rem;color:var(--muted2);">' + opt.desc + '</td>'
        + '<td style="padding:.22rem .4rem;font-size:.64rem;color:var(--muted);white-space:nowrap;">' + opt.zones.join(", ") + '</td>'
        + '</tr>';
    }).join("");

    var zoneInfo = playerZone
      ? '<span style="color:var(--teal);">' + playerZone + '</span>'
      : '<span style="color:var(--muted2);">unknown (add yourself to map)</span>';
    var enemyZoneInfo = enemies.length
      ? enemies.map(function(u){ return '<span style="color:var(--red2);">' + u.name + '</span> @ ' + u.zone; }).join(", ")
      : '<span style="color:var(--muted2);">none</span>';

    el.innerHTML = '<div style="margin-top:.5rem;border-top:1px solid var(--border2);padding-top:.5rem;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:.3rem;">⚔ Combat Options Available</div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.3rem;">Your zone: ' + zoneInfo + ' · Enemies: ' + enemyZoneInfo + '</div>'
      + '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.72rem;">'
      + '<thead><tr style="border-bottom:1px solid var(--border2);">'
      + '<th style="padding:.18rem .4rem;text-align:left;font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Action</th>'
      + '<th style="padding:.18rem .4rem;text-align:left;font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Cost</th>'
      + '<th style="padding:.18rem .4rem;text-align:left;font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Effect</th>'
      + '<th style="padding:.18rem .4rem;text-align:left;font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Valid Zones</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table></div>'
      + '<div style="font-size:.62rem;color:var(--muted);margin-top:.3rem;font-style:italic;">Greyed options are unavailable from your current zone. Move to unlock them.</div>'
      + '</div>';
  }

  // ── SYNC HOOKS ────────────────────────────────────────────────────────────────
  function runWhenIdle(fn, timeoutMs) {
    if (typeof fn !== "function") { return; }
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(fn, { timeout: timeoutMs || 900 });
      return;
    }
    setTimeout(fn, Math.min(250, Math.max(0, timeoutMs || 120)));
  }

  function patchTabSwitchForNewFeatures() {
    if (typeof window.switchTab !== "function" || window._newFeaturesSwitchPatched) { return; }
    window._newFeaturesSwitchPatched = true;
    var baseSwitch = window.switchTab;
    window.switchTab = function(tabId, btn) {
      var out = baseSwitch.apply(this, arguments);
      if (tabId === "caravan") {
        mountCaravanPanel();
        renderCaravanUI();
      } else if (tabId === "holding") {
        mountHoldingPanel();
        renderHoldingUI();
      } else if (tabId === "trophies") {
        if (window.TrophySystem && typeof window.TrophySystem.renderTab === 'function') {
          window.TrophySystem.renderTab();
        }
      }
      return out;
    };
  }

  function syncNewFeatureUIs() {
    ensureNewFeatureState();
    mountNewFeaturePanels();
    renderCaravanUI();
    renderHoldingUI();
    if (window.TrophySystem && typeof window.TrophySystem.renderTab === 'function') {
      window.TrophySystem.renderTab();
    }
    renderExtraTraits();
    renderCombatMap();
    renderCombatOptions();
  }

  document.addEventListener("DOMContentLoaded", function() {
    ensureNewFeatureState();
    patchTabSwitchForNewFeatures();
    runWhenIdle(function() {
      renderExtraTraits();
      renderCombatMap();
    }, 1200);
  });

  // Chain onto updateCreditsUI so caravan/holding credits readouts stay current
  var _baseUpdateCreditsUI = typeof updateCreditsUI === "function" ? updateCreditsUI : null;
  if (_baseUpdateCreditsUI) {
    updateCreditsUI = function() {
      _baseUpdateCreditsUI();
      renderCaravanUI();
      renderHoldingUI();
    };
  }

  // Chain onto loadCharacter / clearCharacter
  var _baseLoad = typeof loadCharacter === "function" ? loadCharacter : null;
  if (_baseLoad) {
    loadCharacter = function() {
      _baseLoad();
      syncNewFeatureUIs();
    };
  }

  var _baseClear = typeof clearCharacter === "function" ? clearCharacter : null;
  if (_baseClear) {
    clearCharacter = function() {
      _baseClear.apply(this, arguments);
      ensureNewFeatureState();
      syncNewFeatureUIs();
    };
  }

  // Expose globals
  window.selectCaravanSize    = selectCaravanSize;
  window.changeCaravanStress  = changeCaravanStress;
  window.toggleCaravanStress  = toggleCaravanStress;
  window.rollHeavyDamage      = rollHeavyDamage;
  window.repairCaravan        = repairCaravan;
  window.changeCaravanCrew    = changeCaravanCrew;
  window.changeCaravanWheels  = changeCaravanWheels;
  window.updateCaravanCargo   = updateCaravanCargo;
  window.getCaravanCargoMax   = getCaravanCargoMax;
  window.moveCaravanCargoToBackpack = moveCaravanCargoToBackpack;
  window.equipCaravanCargoItem = equipCaravanCargoItem;
  window.useCaravanCargoItem = useCaravanCargoItem;
  window.openCaravanCargoItem = openCaravanCargoItem;
  window.installMod           = installMod;
  window.removeMod            = removeMod;
  window.setChaseEnemyDread   = setChaseEnemyDread;
  window.startChase           = startChase;
  window.nextChaseRound       = nextChaseRound;
  window.endChase             = endChase;
  window.adjustChaseZone      = adjustChaseZone;
  window.rollChaseControl     = rollChaseControl;
  window.rollChaseEnemyAttack = rollChaseEnemyAttack;
  window.renderCaravanUI      = renderCaravanUI;
  window.mountCaravanPanel    = mountCaravanPanel;
  window.mountHoldingPanel    = mountHoldingPanel;
  window.mountNewFeaturePanels = mountNewFeaturePanels;
  window.renderHoldingUI      = renderHoldingUI;
  window.collectTax           = collectTax;
  window.buyLandmark          = buyLandmark;
  window.updateLandmarkName   = updateLandmarkName;
  window.removeExtraLandmark  = removeExtraLandmark;
  window.updateCouncilMember  = updateCouncilMember;
  window.adjustRetainers      = adjustRetainers;
  window.hireRetainer         = hireRetainer;
  window.rollCouncilTask      = rollCouncilTask;
  window.generateCourtEvent   = generateCourtEvent;
  window.generateCourtTask    = generateCourtTask;
  window.rollLeadershipPeril  = rollLeadershipPeril;
  window.addCrisisByIndex     = addCrisisByIndex;
  window.addManualCrisis      = addManualCrisis;
  window.resolveCrisis        = resolveCrisis;
  window.clearAllCrises       = clearAllCrises;
  window.setHoldingGovernancePolicy = setHoldingGovernancePolicy;
  window.startHoldingQuest    = startHoldingQuest;
  window.advanceHoldingQuest  = advanceHoldingQuest;
  window.holdingQuestStartStep1 = holdingQuestStartStep1;
  window.completeHoldingQuestStep1 = completeHoldingQuestStep1;
  window.skipHoldingQuestStep1 = skipHoldingQuestStep1;
  window.holdingQuestStartStep2 = holdingQuestStartStep2;
  window.holdingQuestExploreRoom = holdingQuestExploreRoom;
  window.holdingQuestResolveRoomConfrontation = holdingQuestResolveRoomConfrontation;
  window.completeHoldingQuestStep2 = completeHoldingQuestStep2;
  window.holdingQuestStartStep3 = holdingQuestStartStep3;
  window.openHoldingQuestFailureOutcomeModal = openHoldingQuestFailureOutcomeModal;
  window.acceptHoldingQuestFailureOutcome = acceptHoldingQuestFailureOutcome;
  window.pushHoldingQuestLuckOutcome = pushHoldingQuestLuckOutcome;
  window.resolveHoldingQuestPushLuck = resolveHoldingQuestPushLuck;
  window.resolveHoldingQuestOutcome = resolveHoldingQuestOutcome;
  window.resolveHoldingQuestStep3 = resolveHoldingQuestStep3;
  window.getHoldingQuestBoardCardHtml = getHoldingQuestBoardCardHtml;
  window.getHoldingQuestTrackerCardHtml = getHoldingQuestTrackerCardHtml;
  window.onHoldingCouncilTaskResolved = onHoldingCouncilTaskResolved;
  window.buyWayfarerHomeUpgrade = buyWayfarerHomeUpgrade;
  window.setWayfarerHomeDecorTheme = setWayfarerHomeDecorTheme;
  window.getWayfarerHomeBonuses = getWayfarerHomeBonuses;
  window.moveVaultItemToBackpack = moveVaultItemToBackpack;
  window.moveBackpackToVault  = moveBackpackToVault;
  window.rollHoldingDowntimeEvent = rollHoldingDowntimeEvent;
  window.rollHoldingDowntimeActivity = rollHoldingDowntimeActivity;
  window.resolveHoldingDowntimeEvent = resolveHoldingDowntimeEvent;
  window.openHoldingSettlementHexcrawl = openHoldingSettlementHexcrawl;
  window.openRegionalSettlementHexcrawl = openRegionalSettlementHexcrawl;
  window.openSeaSettlementHexcrawl = openSeaSettlementHexcrawl;
  window.openSpaceHubHexcrawl = openSpaceHubHexcrawl;
  window.openRuinEncampmentHexcrawl = openRuinEncampmentHexcrawl;
  window.openRuinEncampmentFromProvince = openRuinEncampmentFromProvince;
  window.runHoldingDistrictAction = runHoldingDistrictAction;
  window.runHoldingDistrictActionByKind = runHoldingDistrictActionByKind;
  window.runHoldingDistrictFlavorAction = runHoldingDistrictFlavorAction;
  window.openHoldingGamblingDen = openHoldingGamblingDen;
  window.openHoldingMerchantDistrict = openHoldingMerchantDistrict;
  window.openHoldingDistrictMissionPickup = openHoldingDistrictMissionPickup;
  window.tickHoldingSettlementDaily = tickHoldingSettlementDaily;
  window.toggleHoldingGamblingNode = toggleHoldingGamblingNode;
  window.setHoldingGamblingDifficulty = setHoldingGamblingDifficulty;
  window.setHoldingGamblingGuess = setHoldingGamblingGuess;
  window.playHoldingGamblingRound = playHoldingGamblingRound;
  window.clearHoldingGamblingHistory = clearHoldingGamblingHistory;
  window.selectHoldingSettlementDistrict = selectHoldingSettlementDistrict;
  window.advanceHoldingSettlementTime = advanceHoldingSettlementTime;
  window.resolveHoldingSettlementHexNode = resolveHoldingSettlementHexNode;
  window.openHoldingSettlementSewerRoute = openHoldingSettlementSewerRoute;
  window.openHoldingCrucibleMatch = openHoldingCrucibleMatch;
  window.holdingCrucibleSetMode = holdingCrucibleSetMode;
  window.selectHoldingCrucibleUnit = selectHoldingCrucibleUnit;
  window.selectHoldingCrucibleEnemy = selectHoldingCrucibleEnemy;
  window.selectHoldingCrucibleTarget = selectHoldingCrucibleTarget;
  window.selectHoldingCrucibleAllyTarget = selectHoldingCrucibleAllyTarget;
  window.holdingCrucibleMoveSelected = holdingCrucibleMoveSelected;
  window.holdingCrucibleTeleportSelected = holdingCrucibleTeleportSelected;
  window.refreshCrucibleWayfarerActionOptions = refreshCrucibleWayfarerActionOptions;
  window.refreshCrucibleTeamActionOptions = refreshCrucibleTeamActionOptions;
  window.refreshCrucibleEnemyActionOptions = refreshCrucibleEnemyActionOptions;
  window.holdingCrucibleExecuteWayfarerAction = holdingCrucibleExecuteWayfarerAction;
  window.holdingCrucibleExecuteTeamAction = holdingCrucibleExecuteTeamAction;
  window.holdingCrucibleExecuteEnemyAction = holdingCrucibleExecuteEnemyAction;
  window.holdingCrucibleAttackSelected = holdingCrucibleAttackSelected;
  window.holdingCrucibleGuardSelected = holdingCrucibleGuardSelected;
  window.holdingCrucibleEndSelectedUnit = holdingCrucibleEndSelectedUnit;
  window.holdingCrucibleAdvanceRound = holdingCrucibleAdvanceRound;
  window.holdingCrucibleAutoResolve = holdingCrucibleAutoResolve;
  window.holdingCrucibleRunEnemyAI = holdingCrucibleRunEnemyAI;
  window.holdingCrucibleHandleBoardUnitClick = holdingCrucibleHandleBoardUnitClick;
  window.holdingCrucibleHandleBoardHexClick = holdingCrucibleHandleBoardHexClick;
  window.holdingCrucibleStartDrag = holdingCrucibleStartDrag;
  window.holdingCrucibleEndDrag = holdingCrucibleEndDrag;
  window.holdingCrucibleHandleHexDragOver = holdingCrucibleHandleHexDragOver;
  window.holdingCrucibleDropOnHex = holdingCrucibleDropOnHex;
  window.holdingCrucibleResetMatch = holdingCrucibleResetMatch;
  window.openHoldingBankingModal = openHoldingBankingModal;
  window.commitHoldingBankInvestment = commitHoldingBankInvestment;
  window.commitHoldingBankInvestmentFromModal = commitHoldingBankInvestmentFromModal;
  window.withdrawHoldingBankInvestment = withdrawHoldingBankInvestment;
  window.tickHoldingBankInvestments = tickHoldingBankInvestments;
  window.buildHoldingBankPanelHtml = buildHoldingBankPanelHtml;
  window.buyCaravan           = buyCaravan;
  window.rollCaravanName      = rollCaravanName;
  window.clearCaravanName     = clearCaravanName;
  window.rollCaravanPowerSource = rollCaravanPowerSource;
  window.clearCaravanPowerSource = clearCaravanPowerSource;
  window.rollHoldingName      = rollHoldingName;
  window.clearHoldingName     = clearHoldingName;
  window.spendPathTokensUpgrade15 = spendPathTokensUpgrade15;
  window.doPathUpgrade15          = doPathUpgrade15;
  window.spendPathTokensUpgrade20 = spendPathTokensUpgrade20;
  window.renderExtraTraits        = renderExtraTraits;
  window.removeExtraTrait         = removeExtraTrait;
  window.addCombatUnit            = addCombatUnit;
  window.moveCombatUnit           = moveCombatUnit;
  window.removeCombatUnit         = removeCombatUnit;
  window.clearCombatMap           = clearCombatMap;
  window.renderCombatMap          = renderCombatMap;
  window.renderCombatOptions      = renderCombatOptions;

  // ── SHOP: SMART BUY ───────────────────────────────────────────────────────────
  function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function getAvailableWeaponModSlots() {
    ensureNewFeatureState();
    var total = 0;
    [S.equipment.weapon1, S.equipment.weapon2].forEach(function(w) {
      if (!w) { return; }
      var m = w.match(/\+(\d)/);
      if (m) {
        var b = parseInt(m[1], 10);
        if (b >= 1 && b <= 4) { total += b; }
      }
    });
    return total;
  }

  var _baseBuyItem = typeof window.buyItem === 'function' ? window.buyItem : null;

  window.buyItem = function(cost, name, cat) {
    ensureNewFeatureState();
    cat = cat || 'other';

    if (cat === 'augmentations') {
      if ((S.renown || 0) < 3) {
        showNotif('Renown +3 required to install Augmentations!', 'warn'); return;
      }
      if ((S.pathTokens || 0) < 5) {
        showNotif('Need 5 Path Tokens to install an Augmentation!', 'warn'); return;
      }
      if ((S.credits || 0) < cost) {
        showNotif('Not enough credits!', 'warn'); return;
      }
      var maxAugs = Math.floor((S.stats.body || 4) / 2);
      if (S.augmentations.length >= maxAugs) {
        showNotif('No Augmentation slots available (Body ÷ 2 = ' + maxAugs + ')!', 'warn'); return;
      }
      if (S.augmentations.indexOf(name) >= 0) {
        showNotif(name + ' is already installed!', 'warn'); return;
      }
      S.credits = Math.max(0, (S.credits || 0) - cost);
      S.pathTokens = Math.max(0, (S.pathTokens || 0) - 5);
      updateCreditsUI();
      var ptEl = document.getElementById('pathTokensVal');
      if (ptEl) { ptEl.textContent = S.pathTokens; }
      S.augmentations.push(name);
      var augData = (SHOP_DATA.augmentations || []).find(function(a) { return a.name === name; });
      var traitLabel = '🦶 ' + name + (augData ? ' — ' + augData.stat : ' — Augmentation');
      if (S.extraTraits.indexOf(traitLabel) < 0) S.extraTraits.push(traitLabel);
      if (typeof renderExtraTraits === 'function') { renderExtraTraits(); }
      if (typeof renderOSHacksPanel === 'function') renderOSHacksPanel();
      if (typeof renderAugmentationsPanel === 'function') { renderAugmentationsPanel(); }
      var shopCatBtn = document.querySelector('.shop-cats .scat.on');
      if (typeof showShopCat === 'function') { showShopCat('augmentations', shopCatBtn); }
      showNotif('Augmentation installed: ' + name + ' (−5 Path Tokens, −' + cost + '₵)', 'good');
      if (window.TrophySystem) window.TrophySystem.check('first_shop_purchase');
      return;
    }

    if (cat === 'os_hacks' && S.augmentations.indexOf('OPERATING SYSTEM') < 0) {
      showNotif('OPERATING SYSTEM augmentation required to buy Hacks!', 'warn');
      return;
    }

    if (_baseBuyItem) {
      var beforeCredits = Number(S.credits || 0);
      _baseBuyItem(cost, name, cat);
      if (Number(S.credits || 0) < beforeCredits && window.TrophySystem) {
        window.TrophySystem.check('first_shop_purchase');
      }
      return;
    }

    showNotif('Buy flow unavailable.', 'warn');
  };

  // ── WEAPON MODS PANEL ─────────────────────────────────────────────────────────
  function renderWeaponModsPanel() {
    var el = document.getElementById('weaponModsDisplay');
    if (!el) { return; }
    ensureNewFeatureState();
    var mods = Array.isArray(S.weaponMods) ? S.weaponMods : [];

    var weaponEntries = [
      { label: 'Slot 1', name: S.equipment.weapon1 || '' },
      { label: 'Slot 2', name: S.equipment.weapon2 || '' }
    ].filter(function(w) { return w.name.trim(); });

    if (!weaponEntries.length) {
      if (!mods.length) {
        el.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">No weapons equipped.</div>';
        return;
      }
      el.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.3rem;">No weapons equipped. Purchased mods are held until a weapon with slots is equipped.</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);">'
        + '<strong style="color:var(--text2);">Unassigned:</strong> '
        + mods.map(function(mod, i) {
            return mod
              + ' <button class="bp-info-btn" title="Mod info" onclick="showWeaponModInfo(\'' + mod.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">?</button>'
              + ' <button class="btn btn-xs btn-red" style="padding:.02rem .22rem;font-size:.56rem;" onclick="removeWeaponMod(' + i + ')">✕</button>';
          }).join(' · ')
        + '</div>';
      return;
    }

    var html = '';
    var modIdx = 0;

    weaponEntries.forEach(function(w) {
      var m = w.name.match(/\+(\d)/);
      var bonus = m ? parseInt(m[1], 10) : 0;
      if (bonus < 1 || bonus > 4) {
        html += '<div style="font-size:.76rem;color:var(--muted2);padding:.2rem 0;">'
          + '<strong style="color:var(--text2);">' + w.label + ':</strong> ' + w.name
          + ' — No mod slots (Ad# or no bonus)</div>';
        return;
      }
      var isRanged = /shoot/i.test(w.name);
      var typeLabel = isRanged ? 'Ranged' : 'Melee';
      html += '<div style="background:var(--surface);border:1px solid var(--border2);padding:.4rem .6rem;margin-bottom:.3rem;">'
        + '<div style="font-size:.75rem;font-family:\'Cinzel\',serif;color:var(--gold2);margin-bottom:.2rem;">'
        + w.label + ': ' + w.name
        + ' <span style="color:var(--muted2);font-size:.62rem;">(' + bonus + ' ' + typeLabel + ' Mod Slot' + (bonus > 1 ? 's' : '') + ')</span></div>';
      for (var i = 0; i < bonus; i++) {
        var mod = S.weaponMods[modIdx] || null;
        var slotIdx = modIdx;
        html += '<div style="display:flex;align-items:center;gap:.4rem;font-size:.74rem;padding:.08rem 0;">'
          + '<span style="color:var(--muted2);font-size:.58rem;font-family:\'Cinzel\',serif;white-space:nowrap;">Slot ' + (i + 1) + ':</span>'
          + '<span style="color:' + (mod ? 'var(--teal)' : 'var(--muted)') + ';flex:1;">' + (mod || '\u2014 Empty \u2014') + '</span>'
          + (mod ? '<button class="bp-info-btn" title="Mod info" onclick="showWeaponModInfo(\'' + mod.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">?</button>' : '')
          + (mod ? '<button class="btn btn-xs btn-red" style="padding:.04rem .28rem;font-size:.58rem;" onclick="removeWeaponMod(' + slotIdx + ')">✕</button>' : '')
          + '</div>';
        if (mod) { modIdx++; }
      }
      html += '</div>';
    });

    // Unassigned mods overflow
    var unassigned = S.weaponMods.slice(modIdx);
    if (unassigned.length) {
      html += '<div style="font-size:.72rem;color:var(--muted2);margin-top:.3rem;padding-top:.3rem;border-top:1px solid var(--border);">'
        + '<strong style="color:var(--text2);">Unassigned:</strong> '
        + unassigned.map(function(mod, i) {
            return mod
              + ' <button class="bp-info-btn" title="Mod info" onclick="showWeaponModInfo(\'' + mod.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">?</button>'
              + ' <button class="btn btn-xs btn-red" style="padding:.02rem .22rem;font-size:.56rem;" onclick="removeWeaponMod(' + (modIdx + i) + ')">✕</button>';
          }).join(' · ')
        + '</div>';
    }

    el.innerHTML = html;
  }

  function removeWeaponMod(idx) {
    ensureNewFeatureState();
    S.weaponMods.splice(idx, 1);
    renderWeaponModsPanel();
    showNotif('Weapon Mod removed.', '');
  }

  function showWeaponModInfo(modName) {
    var mods = (typeof SHOP_DATA !== 'undefined' && SHOP_DATA.weapon_mods) ? SHOP_DATA.weapon_mods : [];
    var item = null;
    for (var i = 0; i < mods.length; i++) { if (mods[i].name === modName) { item = mods[i]; break; } }
    if (!item) { openModal('Weapon Mod', '<div style="font-size:.9rem;color:var(--text2);">' + modName + '</div>'); return; }
    var html = '<div style="font-size:.9rem;color:var(--text2);line-height:1.7;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.75rem;letter-spacing:.1em;color:var(--gold);margin-bottom:.3rem;">🔩 ' + item.name + '</div>'
      + '<div style="font-size:.78rem;color:var(--teal);margin-bottom:.4rem;">' + item.stat + '</div>'
      + '<div>' + item.desc + '</div>'
      + '</div>';
    openModal(item.name, html);
  }

  // ── AUGMENTATIONS PANEL ───────────────────────────────────────────────────────
  function renderAugmentationsPanel() {
    var el = document.getElementById('augmentationsDisplay');
    if (!el) { return; }
    ensureNewFeatureState();
    var augs = Array.isArray(S.augmentations) ? S.augmentations : [];
    if (!augs.length) {
      el.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">No augmentations installed.</div>';
      return;
    }
    var html = augs.map(function(name, i) {
      var aug = null;
      var list = (typeof SHOP_DATA !== 'undefined' && SHOP_DATA.augmentations) ? SHOP_DATA.augmentations : [];
      for (var j = 0; j < list.length; j++) { if (list[j].name === name) { aug = list[j]; break; } }
      return '<div style="display:flex;align-items:center;gap:.35rem;background:var(--surface);border:1px solid var(--border2);padding:.25rem .45rem;margin-bottom:.2rem;border-radius:3px;">'
        + '<span style="font-size:.75rem;color:var(--gold2);flex:1;font-family:\'Cinzel\',serif;">' + name + '</span>'
        + (aug ? '<span style="font-size:.64rem;color:var(--muted2);">' + aug.stat.replace('Augmentation | ','') + '</span>' : '')
        + '<button class="bp-info-btn" title="Augmentation info" onclick="showAugmentationInfo(\'' + name.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">?</button>'
        + '<button class="btn btn-xs btn-red" style="padding:.03rem .28rem;font-size:.58rem;" onclick="removeAugmentation(' + i + ')">✕</button>'
        + '</div>';
    }).join('');
    el.innerHTML = html;
  }

  function showAugmentationInfo(augName) {
    var list = (typeof SHOP_DATA !== 'undefined' && SHOP_DATA.augmentations) ? SHOP_DATA.augmentations : [];
    var item = null;
    for (var i = 0; i < list.length; i++) { if (list[i].name === augName) { item = list[i]; break; } }
    if (!item) { openModal('Augmentation', '<div style="font-size:.9rem;color:var(--text2);">' + augName + '</div>'); return; }
    var html = '<div style="font-size:.9rem;color:var(--text2);line-height:1.7;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.75rem;letter-spacing:.1em;color:var(--gold);margin-bottom:.3rem;">🦾 ' + item.name + '</div>'
      + '<div style="font-size:.78rem;color:var(--teal);margin-bottom:.4rem;">' + item.stat + '</div>'
      + '<div>' + item.desc + '</div>'
      + '</div>';
    openModal(item.name, html);
  }

  function removeAugmentation(idx) {
    ensureNewFeatureState();
    if (!Array.isArray(S.augmentations)) { return; }
    S.augmentations.splice(idx, 1);
    renderAugmentationsPanel();
    if (typeof renderOSHacksPanel === 'function') { renderOSHacksPanel(); }
    if (typeof updateAllStatDisplays === 'function') { updateAllStatDisplays(); }
    showNotif('Augmentation removed.', '');
  }

  // ── CHAR TAB DREAD DIE ROLLER ─────────────────────────────────────────────────
  var charDreadDieSize = 8;

  function initCharDreadDiceOpts() {
    var el = document.getElementById('charDreadDiceOpts');
    if (!el) { return; }
    el.innerHTML = [4, 6, 8, 10, 12, 20].map(function(d) {
      return '<div class="d-opt' + (d === charDreadDieSize ? ' dread-sel' : '') + '" data-v="' + d + '" '
        + 'onclick="selectCharDreadDie(' + d + ')">d' + d + '</div>';
    }).join('');
  }

  function selectCharDreadDie(d) {
    charDreadDieSize = d;
    var opts = document.querySelectorAll('#charDreadDiceOpts .d-opt');
    opts.forEach(function(opt) { opt.classList.toggle('dread-sel', parseInt(opt.dataset.v, 10) === d); });
  }

  function rollCharDreadDie() {
    var result = explodingRoll(charDreadDieSize);
    var el = document.getElementById('charDreadResult');
    if (!el) { return; }
    el.innerHTML = '<span style="color:var(--red);font-size:1.1rem;font-weight:700;">' + result.total + '</span>'
      + ' <span style="font-size:.75rem;color:var(--muted2);">Dread d' + charDreadDieSize + (result.exploded ? ' ✦ Exploded!' : '') + '</span>'
      + '<div style="font-size:.73rem;color:var(--muted2);margin-top:.15rem;">Beat this with your stat die to succeed. (GM decides if failure costs Stress)</div>';
  }

  // ── HACK EFFECTS TABLE ────────────────────────────────────────────────────────
  var HACK_EFFECTS = {
    'Javelin':              { tmw: 1,  effect: function() { var d=roll(10); return 'Deals <strong>'+d+' Stress</strong> to the target. (1d10)'; } },
    'Ember':                { tmw: 2,  effect: function() { return 'Target is <strong>Vulnerable</strong>.'; } },
    'Short Circuit':        { tmw: 4,  effect: function() { return 'Target <strong>loses 2 Rounds</strong>.'; } },
    'Reboot Optics':        { tmw: 3,  effect: function() { return 'Enemy rolls with <strong>Step Up Disadvantage</strong> for 3 Rounds (rolls higher die, takes lowest).'; } },
    'Weapon Glitch':        { tmw: 2,  effect: function() { return "Target's <strong>weapons don't work</strong> for 2 Rounds."; } },
    'Ping':                 { tmw: 1,  effect: function() { return 'Enemy <strong>Dread reduced by one Step</strong>.'; } },
    'Sonic Shock':          { tmw: 2,  effect: function() { var d=roll(4); return 'Gain <strong>+'+d+'</strong> to Attack rolls against that enemy. (d4 rolled)'; } },
    'Take Control':         { tmw: 1,  effect: function() { return 'You <strong>remotely operate</strong> a small electronic device.'; } },
    'Counterspell':         { tmw: 2,  effect: function() { return '<strong>Enemy Hack countered!</strong>'; } },
    'Brake':                { tmw: 5,  effect: function() { return 'Vehicle is <strong>forced to stop</strong>.'; } },
    'LASHOUT (Master)':     { tmw: 10, effect: function() { return 'Enemy <strong>forced to attack</strong> nearest ally/hostile (or commits suicide if alone).'; } },
    'SUICIDE (Master)':     { tmw: 15, effect: function() { return 'Enemy <strong>forced to kill themselves</strong>.'; } },
    'COLLAPSE (Master)':    { tmw: 12, effect: function() { return 'Enemy <strong>crippled for the day</strong> — cannot act.'; } },
    'DETONATE GRENADE (Master)': { tmw: 10, effect: function() { var d=roll(10)+roll(10); return 'Explosion deals <strong>'+d+' Stress</strong>. (2d10)'; } },
    'AEGIES (Master)':      { tmw: 10, effect: function() { return 'You gain <strong>+10 to Defend Rolls</strong> for this Combat Scene.'; } },
    'PARASYTE (Master)':    { tmw: 12, effect: function() { var ad=S.stats&&S.stats.adventure?S.stats.adventure:4; var d=roll(ad); return 'Enemy takes <strong>'+d+' Stress per Round</strong> for 12 Rounds. (Adventure d'+ad+' rolled)'; } }
  };

  // ── OS HACKS PANEL ────────────────────────────────────────────────────────────
  function renderOSHacksPanel() {
    var panel = document.getElementById('osHacksPanel');
    if (!panel) { return; }
    ensureNewFeatureState();

    var hasOS = S.augmentations.indexOf('OPERATING SYSTEM') >= 0;
    panel.style.display = hasOS ? '' : 'none';
    if (!hasOS) { return; }

    // Owned Hacks list
    var listEl = document.getElementById('ownedHacksList');
    if (listEl) {
      if (!S.ownedHacks.length) {
        listEl.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.35rem;">No Hacks acquired yet. Buy them in the Merchants tab.</div>';
      } else {
        listEl.innerHTML = S.ownedHacks.map(function(hackName, i) {
          var hackData = (SHOP_DATA.os_hacks || []).find(function(h) { return h.name === hackName; });
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.22rem .4rem;background:var(--surface);border:1px solid var(--border2);margin-bottom:.18rem;">'
            + '<div>'
            + '<span style="font-size:.78rem;color:var(--teal);">' + hackName + '</span>'
            + (hackData ? '<span style="font-size:.66rem;color:var(--muted2);margin-left:.4rem;">' + hackData.stat + '</span>' : '')
            + '</div>'
            + '<button class="btn btn-xs btn-red" onclick="removeOwnedHack(' + i + ')">✕</button>'
            + '</div>';
        }).join('');
      }
    }

    // Hack selector
    var sel = document.getElementById('hackSelect');
    if (sel) {
      var prev = S.hackRoller.selectedHack;
      sel.innerHTML = '<option value="">— Select Hack —</option>'
        + S.ownedHacks.map(function(h) {
          return '<option value="' + h + '"' + (h === prev ? ' selected' : '') + '>' + h + '</option>';
        }).join('');
    }

    // Dread die options
    var dreadOpts = document.getElementById('hackDreadOpts');
    if (dreadOpts) {
      dreadOpts.innerHTML = [4, 6, 8, 10, 12, 20].map(function(d) {
        return '<div class="d-opt' + (S.hackRoller.dreadDie === d ? ' dread-sel' : '') + '" '
          + 'data-v="' + d + '" onclick="setHackDreadDie(' + d + ')">'
          + 'd' + d + '</div>';
      }).join('');
    }

    // Guess buttons
    ['below', 'between', 'above'].forEach(function(g) {
      var btn = document.getElementById('hack-guess-' + g);
      if (btn) { btn.classList.toggle('sel', S.hackRoller.guess === g); }
    });
  }

  function removeOwnedHack(idx) {
    ensureNewFeatureState();
    S.ownedHacks.splice(idx, 1);
    if (S.hackRoller.selectedHack && S.ownedHacks.indexOf(S.hackRoller.selectedHack) < 0) {
      S.hackRoller.selectedHack = null;
    }
    renderOSHacksPanel();
  }

  function setHackGuess(guess) {
    ensureNewFeatureState();
    S.hackRoller.guess = guess;
    ['below', 'between', 'above'].forEach(function(g) {
      var btn = document.getElementById('hack-guess-' + g);
      if (btn) { btn.classList.toggle('sel', g === guess); }
    });
  }

  function setHackDreadDie(die) {
    ensureNewFeatureState();
    S.hackRoller.dreadDie = die;
    var opts = document.querySelectorAll('#hackDreadOpts .d-opt');
    opts.forEach(function(opt) {
      opt.classList.toggle('dread-sel', parseInt(opt.dataset.v, 10) === die);
    });
  }

  function isNewFeaturesManualRollMode() {
    return !!(window.settingsSystem && typeof window.settingsSystem.isManualRollMode === 'function' && window.settingsSystem.isManualRollMode());
  }

  function applyHackCastOutcome(payload) {
    var data = payload || {};
    var hackName = String(data.hackName || 'Unknown Hack');
    var hackData = data.hackData || HACK_EFFECTS[hackName] || null;
    var dreadDie = Math.max(4, Number(data.dreadDie || 6));
    var low = Math.max(1, Number(data.low || 1));
    var high = Math.max(low, Number(data.high || low));
    var ctrlDie = Math.max(4, Number(data.ctrlDie || 4));
    var ctrlVal = Math.max(1, Number(data.ctrlVal || 1));
    var guess = String(data.guess || S.hackRoller.guess || 'between');
    var tmwCost = Math.max(0, Number(data.tmwCost || 0));
    var manual = !!data.manual;
    var combatEnemy = data.combatEnemy || ((typeof getPrimaryCombatEnemy === 'function') ? getPrimaryCombatEnemy() : null);

    var actual;
    if (ctrlVal < low) actual = 'below';
    else if (ctrlVal > high) actual = 'above';
    else actual = 'between';

    var success = actual === guess;
    var effectHtml = '';
    if (success && hackData && hackData.effect) {
      var effectText = (S.combat && S.combat.active && combatEnemy && typeof applyCombatHackEffect === 'function')
        ? (applyCombatHackEffect(hackName) || hackData.effect())
        : hackData.effect();
      effectHtml = '<br><span style="color:var(--teal);">' + effectText + '</span>';
    }

    var malwareHtml = '';
    var malwareBy = Math.max(1, (high - low) || 1);
    if (!success) {
      var malwareDmg = roll(6);
      malwareBy = Math.max(1, malwareBy + malwareDmg);
      S.tmw = Math.max(0, (S.tmw || 0) - 1);
      if (typeof updateTMWPool === 'function') updateTMWPool();
      if (typeof changeHealth === 'function') changeHealth(malwareDmg);
      malwareHtml = '<br><span style="color:var(--red2);">Malware! Lost 1 TMW and took <strong>' + malwareDmg + ' Stress</strong> (1d6). Distracted applied.</span>';
      S.conditions = S.conditions || {};
      S.conditions.distracted = true;
      if (typeof updateConditionButtons === 'function') updateConditionButtons();
      if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
    }

    var resultEl = document.getElementById('hackRollResult');
    if (resultEl) {
      resultEl.innerHTML = '<div class="gamble-rolls">'
        + '<div class="gamble-die"><div class="gd-label">Dread Low</div><div class="gd-value" style="color:var(--red);">' + low + '</div></div>'
        + '<div class="gamble-die"><div class="gd-label">Control d' + ctrlDie + '</div><div class="gd-value" style="color:var(--teal);">' + ctrlVal + '</div></div>'
        + '<div class="gamble-die"><div class="gd-label">Dread High</div><div class="gd-value" style="color:var(--red);">' + high + '</div></div>'
        + '</div>'
        + (tmwCost > 0 ? '<div style="font-size:.72rem;color:var(--muted2);margin:.25rem 0;">-' + tmwCost + ' TMW spent · ' + (S.tmw || 0) + ' remaining</div>' : '')
        + '<div class="gamble-outcome ' + (success ? 'good' : 'warn') + '" style="margin-top:.4rem;">'
        + '<strong style="color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">' + (success ? 'Hack Succeeded!' : 'Hack Failed - Malware!') + '</strong><br>'
        + 'Dread d' + dreadDie + ': ' + low + '-' + high
        + ' | Guess: <strong>' + capFirst(guess) + '</strong>'
        + ' | Control: ' + ctrlVal + ' (<em>' + capFirst(actual) + (manual ? ', manual' : '') + '</em>)'
        + effectHtml
        + malwareHtml
        + '</div>';
    }

    if (success) {
      var hackMargin = 1;
      if (actual === 'below') hackMargin = Math.max(1, low - ctrlVal);
      else if (actual === 'above') hackMargin = Math.max(1, ctrlVal - high);
      else hackMargin = Math.max(1, Math.min(ctrlVal - low, high - ctrlVal) + 1);
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('spell', hackMargin, {
          actionTotal: ctrlVal,
          dreadTotal: actual === 'below' ? low : (actual === 'above' ? high : Math.round((low + high) / 2)),
          context: 'Hack cast: ' + hackName
        });
      }
      if (typeof addSuccessRoll === 'function') addSuccessRoll();
    } else if (typeof showDccFailureOutcome === 'function') {
      showDccFailureOutcome('spell', Math.max(1, malwareBy), {
        actionTotal: ctrlVal,
        dreadTotal: actual === 'below' ? low : (actual === 'above' ? high : Math.round((low + high) / 2)),
        context: 'Hack cast: ' + hackName
      });
    }

    if (typeof renderQP === 'function' && S.quickPanel) {
      S.quickPanel.lastCombatRoll = (resultEl && resultEl.innerHTML) ? resultEl.innerHTML : S.quickPanel.lastCombatRoll;
      renderQP('combat');
    }
    return success;
  }

  function openManualHackCastModal(payload) {
    var data = payload || {};
    S.hackRoller.pendingManual = {
      hackName: String(data.hackName || ''),
      tmwCost: Math.max(0, Number(data.tmwCost || 0)),
      dreadDie: Math.max(4, Number(data.dreadDie || 6)),
      combatEnemyId: String(data.combatEnemy && data.combatEnemy.id || '')
    };
    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.54;">'
      + '<div style="margin-bottom:.22rem;">Manual Hack Roll: enter your rolled values and resolve against your guess <strong>' + capFirst(S.hackRoller.guess || 'between') + '</strong>.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,minmax(100px,1fr));gap:.3rem;">'
      + '<label style="font-size:.7rem;color:var(--muted2);">Dread Low<input id="manualHackLow" type="number" min="1" max="' + Number(data.dreadDie || 6) + '" style="width:100%;margin-top:.08rem;"></label>'
      + '<label style="font-size:.7rem;color:var(--muted2);">Dread High<input id="manualHackHigh" type="number" min="1" max="' + Number(data.dreadDie || 6) + '" style="width:100%;margin-top:.08rem;"></label>'
      + '<label style="font-size:.7rem;color:var(--muted2);">Control Total<input id="manualHackControl" type="number" min="1" max="999" style="width:100%;margin-top:.08rem;"></label>'
      + '</div>'
      + '<div style="font-size:.7rem;color:var(--muted2);margin-top:.2rem;">Cost on resolve: ' + Number(data.tmwCost || 0) + ' TMW.</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:.3rem;margin-top:.28rem;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveManualHackCast()">Resolve Manual Hack</button>'
      + '</div>'
      + '</div>';
    if (typeof openModal === 'function') openModal('Manual Hack Cast', html);
  }

  function resolveManualHackCast() {
    ensureNewFeatureState();
    var pending = (S.hackRoller && S.hackRoller.pendingManual) ? S.hackRoller.pendingManual : null;
    if (!pending) {
      if (typeof showNotif === 'function') showNotif('No pending manual hack cast.', 'warn');
      return false;
    }
    var lowEl = document.getElementById('manualHackLow');
    var highEl = document.getElementById('manualHackHigh');
    var controlEl = document.getElementById('manualHackControl');
    var low = Number(lowEl && lowEl.value);
    var high = Number(highEl && highEl.value);
    var ctrl = Number(controlEl && controlEl.value);
    if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(ctrl)) {
      if (typeof showNotif === 'function') showNotif('Enter valid manual dice values first.', 'warn');
      return false;
    }
    var tmwCost = Math.max(0, Number(pending.tmwCost || 0));
    if (tmwCost > 0 && Number(S.tmw || 0) < tmwCost) {
      if (typeof showNotif === 'function') showNotif('Need ' + tmwCost + ' TMW to resolve this hack.', 'warn');
      return false;
    }
    if (tmwCost > 0) {
      S.tmw = Math.max(0, Number(S.tmw || 0) - tmwCost);
      if (typeof updateTMWPool === 'function') updateTMWPool();
    }
    var combatEnemy = (typeof getPrimaryCombatEnemy === 'function') ? getPrimaryCombatEnemy() : null;
    applyHackCastOutcome({
      hackName: pending.hackName,
      tmwCost: tmwCost,
      dreadDie: pending.dreadDie,
      low: Math.min(low, high),
      high: Math.max(low, high),
      ctrlDie: Number(S.stats && S.stats.control || 4),
      ctrlVal: ctrl,
      guess: String(S.hackRoller.guess || 'between'),
      combatEnemy: combatEnemy,
      manual: true
    });
    S.hackRoller.pendingManual = null;
    if (typeof closeModal === 'function') closeModal();
    return true;
  }

  function castHack() {
    ensureNewFeatureState();

    var sel = document.getElementById('hackSelect');
    if (sel && sel.value) S.hackRoller.selectedHack = sel.value;

    var hackName = S.hackRoller.selectedHack;
    if (!hackName && S.ownedHacks.length) {
      hackName = S.ownedHacks[0];
      S.hackRoller.selectedHack = hackName;
    }

    if (!hackName) {
      showNotif('Select a Hack to cast first!', 'warn');
      return;
    }
    if (!S.hackRoller.guess) {
      showNotif('Select a guess first: Below, Between, or Above!', 'warn');
      return;
    }

    var hackData = HACK_EFFECTS[hackName];
    var tmwCost = hackData ? Number(hackData.tmw || 0) : 0;
    if (tmwCost > 0 && typeof getScarTmwCostPenalty === 'function') {
      tmwCost += Math.max(0, Number(getScarTmwCostPenalty() || 0));
    }
    if (tmwCost > 0 && Number(S.tmw || 0) < tmwCost) {
      showNotif('Need ' + tmwCost + ' TMW to cast ' + hackName + '! (have ' + (S.tmw || 0) + ')', 'warn');
      return;
    }

    var combatEnemy = (typeof getPrimaryCombatEnemy === 'function') ? getPrimaryCombatEnemy() : null;
    var dreadDie = (S.combat && S.combat.active && combatEnemy && typeof getEnemyEffectiveDread === 'function')
      ? getEnemyEffectiveDread(combatEnemy)
      : (S.hackRoller.dreadDie || 6);
    S.hackRoller.dreadDie = dreadDie;

    if (isNewFeaturesManualRollMode()) {
      openManualHackCastModal({
        hackName: hackName,
        tmwCost: tmwCost,
        dreadDie: dreadDie,
        combatEnemy: combatEnemy
      });
      return;
    }

    if (tmwCost > 0) {
      S.tmw = Math.max(0, Number(S.tmw || 0) - tmwCost);
      if (typeof updateTMWPool === 'function') updateTMWPool();
    }

    var d1 = roll(dreadDie);
    var d2 = roll(dreadDie);
    var low = Math.min(d1, d2);
    var high = Math.max(d1, d2);
    var ctrlDie = Math.max(4, Number(S.stats && S.stats.control || 4));
    var ctrlRoll = explodingRoll(ctrlDie);
    var augBonusDie = (typeof getAugBonus === 'function') ? getAugBonus('control') : 0;
    var augRoll = augBonusDie > 0 ? explodingRoll(augBonusDie) : null;
    var ctrlVal = Number(ctrlRoll.total || 0) + Number(augRoll ? augRoll.total : 0);

    applyHackCastOutcome({
      hackName: hackName,
      hackData: hackData,
      tmwCost: tmwCost,
      dreadDie: dreadDie,
      low: low,
      high: high,
      ctrlDie: ctrlDie,
      ctrlVal: ctrlVal,
      guess: String(S.hackRoller.guess || 'between'),
      combatEnemy: combatEnemy,
      manual: false
    });
  }

  window.renderWeaponModsPanel  = renderWeaponModsPanel;
  window.removeWeaponMod        = removeWeaponMod;
  window.showWeaponModInfo      = showWeaponModInfo;
  window.renderAugmentationsPanel = renderAugmentationsPanel;
  window.showAugmentationInfo   = showAugmentationInfo;
  window.removeAugmentation     = removeAugmentation;
  window.initCharDreadDiceOpts  = initCharDreadDiceOpts;
  window.selectCharDreadDie     = selectCharDreadDie;
  window.rollCharDreadDie       = rollCharDreadDie;
  window.renderOSHacksPanel     = renderOSHacksPanel;
  window.removeOwnedHack        = removeOwnedHack;
  window.setHackGuess           = setHackGuess;
  window.setHackDreadDie        = setHackDreadDie;
  window.castHack               = castHack;
  window.resolveManualHackCast  = resolveManualHackCast;
  window.getAvailableWeaponModSlots = getAvailableWeaponModSlots;
  window.buyHoldingBrowseOffer = buyHoldingBrowseOffer;
  window.sellHoldingBrowseBackpackItem = sellHoldingBrowseBackpackItem;

  // ── ENHANCED MANUAL ROLL SYSTEM ──────────────────────────────────────────────
  // Comprehensive manual roll with prompt showing modifiers, conditions, skills, bonuses/advantages
  // Success = +1 Path Token | Failure = +1 Teamwork Point (with option to spend TMW to increase roll)

  function buildManualRollModifiersHtml() {
    if (typeof S === 'undefined') { return ''; }
    var modifiers = [];
    var penalty = [];

    // Check active conditions
    if (S.conditions) {
      if (S.conditions.focused) modifiers.push('🎯 Focused (+advantage)');
      if (S.conditions.protected) modifiers.push('🛡️ Protected (+defense)');
      if (S.conditions.inspired) modifiers.push('✨ Inspired (+rolls)');
      if (S.conditions.distracted) penalty.push('⚠️ Distracted (−rolls)');
      if (S.conditions.wounded) penalty.push('🩸 Wounded (−actions)');
      if (S.conditions.afraid) penalty.push('😨 Afraid (−rolls)');
    }

    // Check equipped items/weapons for bonuses
    if (S.equipment && S.equipment.weapon1) {
      var w1 = String(S.equipment.weapon1).trim();
      if (w1) modifiers.push('⚔️ ' + w1);
    }
    if (S.equipment && S.equipment.weapon2) {
      var w2 = String(S.equipment.weapon2).trim();
      if (w2 && w2 !== S.equipment.weapon1) modifiers.push('⚔️ ' + w2);
    }

    // Check for advantage die or flat bonus from roll modifiers
    if (S.rollMod && typeof S.rollMod === 'object') {
      if (Array.isArray(S.rollMod.advDice) && S.rollMod.advDice.length > 0) {
        var advDice = S.rollMod.advDice.map(function(d) { return '+d' + d; }).join(', ');
        modifiers.push('📈 Advantage: ' + advDice);
      }
      if (typeof S.rollMod.flat === 'number' && S.rollMod.flat > 0) {
        modifiers.push('➕ Bonus: +' + S.rollMod.flat);
      } else if (typeof S.rollMod.flat === 'number' && S.rollMod.flat < 0) {
        penalty.push('➖ Penalty: ' + S.rollMod.flat);
      }
    }

    // Check for skill/trait bonuses
    if (S.personalFlavors && Array.isArray(S.personalFlavors) && S.personalFlavors.length > 0) {
      var flavorStr = S.personalFlavors.slice(0, 2).join(' · ');
      if (flavorStr) modifiers.push('✦ Flavor: ' + flavorStr.substring(0, 45));
    }

    var html = '<div style="margin-top:.4rem;font-size:.74rem;color:var(--text2);line-height:1.6;">';
    if (modifiers.length > 0) {
      html += '<div style="color:var(--teal);margin-bottom:.25rem;"><strong>Bonuses & Advantages:</strong></div>';
      html += modifiers.map(function(m) { return '<div style="margin-left:.4rem;">• ' + m + '</div>'; }).join('');
    }
    if (penalty.length > 0) {
      html += '<div style="color:var(--red2);margin-top:.25rem;"><strong>Penalties & Conditions:</strong></div>';
      html += penalty.map(function(p) { return '<div style="margin-left:.4rem;">• ' + p + '</div>'; }).join('');
    }
    if (modifiers.length === 0 && penalty.length === 0) {
      html += '<div style="color:var(--muted2);font-style:italic;">No active modifiers or conditions.</div>';
    }
    html += '</div>';
    return html;
  }

  function showEnhancedManualRollPrompt(skillName, actionDie, dreadDie) {
    if (typeof openModal !== 'function' || typeof S === 'undefined') { return; }

    var skillLabel = String(skillName || 'Unknown').trim();
    var actionDieNum = Math.max(4, Number(actionDie || 6));
    var dreadDieNum = Math.max(4, Number(dreadDie || 6));
    var currentTMW = Math.max(0, Number(S.tmw || 0));
    var actionInput = document.getElementById('manualActionValue');
    var dreadInput = document.getElementById('manualDreadValue');
    var currentAction = Number(actionInput && actionInput.value);
    var currentDread = Number(dreadInput && dreadInput.value);

    var modifiersHtml = buildManualRollModifiersHtml();
    var pushDread = stepEnhancedManualDreadDie(dreadDieNum);

    var html = '<div style="font-size:.85rem;color:var(--text2);line-height:1.7;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);margin-bottom:.4rem;">'
      + skillLabel + ' vs Dread d' + dreadDieNum
      + '</div>'
      + '<div style="background:rgba(46,196,182,.05);border:1px solid rgba(46,196,182,.25);padding:.35rem .45rem;margin-bottom:.4rem;border-radius:3px;">'
      + '<div style="font-size:.75rem;color:var(--teal);margin-bottom:.15rem;"><strong>Roll Against:</strong></div>'
      + '<div><strong style="color:var(--text2);">' + skillLabel + ' d' + actionDieNum + '</strong> <span style="color:var(--muted2);">vs</span> <strong style="color:var(--red);">Dread d' + dreadDieNum + '</strong></div>'
      + '<div style="font-size:.68rem;color:var(--muted2);margin-top:.1rem;">Beat the Dread die result to succeed.</div>'
      + '</div>'
      + modifiersHtml
      + '<div style="background:rgba(232,192,80,.04);border:1px solid rgba(232,192,80,.3);padding:.35rem .45rem;margin-top:.4rem;border-radius:3px;">'
      + '<div style="font-size:.75rem;color:var(--gold2);margin-bottom:.2rem;"><strong>Teamwork Points:</strong> <span style="color:var(--teal);font-size:.82rem;">' + currentTMW + ' TMW</span></div>'
      + '<div style="font-size:.68rem;color:var(--muted2);">Push Luck costs 2 TMW and raises Dread to d' + pushDread + '.</div>'
      + '</div>'
      + '<div style="background:rgba(126,215,255,.06);border:1px solid rgba(126,215,255,.28);padding:.35rem .45rem;margin-top:.4rem;border-radius:3px;">'
      + '<div style="font-size:.75rem;color:var(--teal);margin-bottom:.15rem;"><strong>Current Manual Dice Entry</strong></div>'
      + '<div style="font-size:.7rem;color:var(--muted2);">Action: <strong style="color:var(--text2);">' + (Number.isFinite(currentAction) ? currentAction : '-') + '</strong> | Dread: <strong style="color:var(--text2);">' + (Number.isFinite(currentDread) ? currentDread : '-') + '</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);margin-top:.12rem;">Use the Manual Check panel values, then choose the narrative outcome below.</div>'
      + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.6rem;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
      + '<button class="btn btn-sm btn-primary" onclick="manualRollOutcomeFailure(' + actionDieNum + ',' + dreadDieNum + ',\'' + skillLabel.replace(/'/g, "\\'") + '\',true,false)">Success</button>'
      + '<button class="btn btn-sm btn-red" onclick="manualRollOutcomeFailure(' + actionDieNum + ',' + dreadDieNum + ',\'' + skillLabel.replace(/'/g, "\\'") + '\',false,false)">Failure</button>'
      + '<button class="btn btn-sm btn-teal" ' + (currentTMW >= 2 ? '' : 'disabled') + ' onclick="manualRollOutcomeFailure(' + actionDieNum + ',' + dreadDieNum + ',\'' + skillLabel.replace(/'/g, "\\'") + '\',true,true)">Push Luck + Success</button>'
      + '<button class="btn btn-sm btn-warn" ' + (currentTMW >= 2 ? '' : 'disabled') + ' onclick="manualRollOutcomeFailure(' + actionDieNum + ',' + dreadDieNum + ',\'' + skillLabel.replace(/'/g, "\\'") + '\',false,true)">Push Luck + Failure</button>'
      + '</div>';

    openModal('Manual Roll: ' + skillLabel + ' Check', html);
  }

  function stepEnhancedManualDreadDie(current) {
    var dice = [4, 6, 8, 10, 12, 20];
    var die = Number(current || 6);
    var idx = dice.indexOf(die);
    if (idx < 0) idx = 1;
    return dice[Math.min(dice.length - 1, idx + 1)];
  }

  function normalizeEnhancedManualStat(skillLabel) {
    var key = String(skillLabel || '').toLowerCase();
    if (key.indexOf('body') >= 0 || key.indexOf('strike') >= 0 || key.indexOf('shoot') >= 0) return 'body';
    if (key.indexOf('defend') >= 0) return 'defend';
    if (key.indexOf('lead') >= 0 || key.indexOf('spirit') >= 0) return 'spirit';
    if (key.indexOf('mind') >= 0 || key.indexOf('control') >= 0) return 'mind';
    return 'adventure';
  }

  function applyEnhancedManualCondition(statKey, positive) {
    var cond = normalizeHoldingQuestConditionByStat(statKey, !!positive);
    if (typeof applyHoldingQuestCondition === 'function') {
      applyHoldingQuestCondition(cond);
      return cond;
    }
    S.conditions = S.conditions || {};
    S.conditions[cond] = true;
    if (typeof updateConditionButtons === 'function') updateConditionButtons();
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
    return cond;
  }

  function applyEnhancedManualFailureConsequence(statKey, margin, skillLabel) {
    var m = Math.max(1, Number(margin || 1));
    if (statKey === 'mind') {
      if (typeof changeMentalStress === 'function') changeMentalStress(m);
      else if (typeof changeStress === 'function') changeStress(m);
    } else if (statKey === 'defend') {
      if (typeof changeStress === 'function') changeStress(m);
      else if (typeof changeHealth === 'function') changeHealth(m);
    } else {
      if (typeof changeHealth === 'function') changeHealth(m);
      else if (typeof changeStress === 'function') changeStress(m);
    }
    if (typeof addTMWOnFail === 'function') addTMWOnFail('manual-roll-failure', { skipPrompt: true });
    else S.tmw = Math.max(0, Number(S.tmw || 0) + 1);
    if (typeof showDccFailureOutcome === 'function') {
      showDccFailureOutcome('spell', m, {
        actionTotal: 0,
        dreadTotal: m,
        context: String(skillLabel || 'Manual check') + ' (declared failure)'
      });
    }
  }

  function awardPathToken(reason) {
    if (typeof S === 'undefined') { return; }
    if (!S.pathTokens) S.pathTokens = 0;
    S.pathTokens = (S.pathTokens || 0) + 1;
    var ptEl = document.getElementById('pathTokensVal');
    if (ptEl) { ptEl.textContent = S.pathTokens; }
    var msg = 'Success! +1 Path Token (now ' + S.pathTokens + ')';
    if (typeof showNotif === 'function') showNotif(msg, 'good');
    return 1;
  }

  function manualRollOutcomeFailure(actionDie, dreadDie, skillLabel, declaredSuccess, pushLuck) {
    if (typeof S === 'undefined') { return; }
    var actionInput = document.getElementById('manualActionValue');
    var dreadInput = document.getElementById('manualDreadValue');

    if (!actionInput || !dreadInput) {
      if (typeof showNotif === 'function') showNotif('Enter Action and Dread dice values first!', 'warn');
      return;
    }

    var actionRoll = parseInt(actionInput.value, 10);
    var dreadRoll = parseInt(dreadInput.value, 10);

    if (!Number.isFinite(actionRoll) || !Number.isFinite(dreadRoll)) {
      if (typeof showNotif === 'function') showNotif('Invalid dice entry. Please enter numeric values.', 'warn');
      return;
    }

    var usePushLuck = !!pushLuck;
    var effectiveDreadDie = Math.max(4, Number(dreadDie || 6));
    if (usePushLuck) {
      var tmw = Math.max(0, Number(S.tmw || 0));
      if (tmw < 2) {
        if (typeof showNotif === 'function') showNotif('Need 2 Teamwork to Push Luck.', 'warn');
        return;
      }
      if (typeof changeCounter === 'function') changeCounter('tmw', -2);
      else S.tmw = Math.max(0, tmw - 2);
      effectiveDreadDie = stepEnhancedManualDreadDie(dreadDie);
    }

    var statKey = normalizeEnhancedManualStat(skillLabel);
    var effectiveDreadRoll = usePushLuck ? Math.max(dreadRoll, Number(roll(effectiveDreadDie) || dreadRoll)) : dreadRoll;
    var margin = Math.max(1, Math.abs(actionRoll - effectiveDreadRoll));
    var success = !!declaredSuccess;

    if (success) {
      awardPathToken('manual-roll-success');
      if (typeof addSuccessRoll === 'function') addSuccessRoll();
      if (usePushLuck) {
        var pos = applyEnhancedManualCondition(statKey, true);
        if (typeof showNotif === 'function') showNotif('Push Luck success: gained ' + pos + '.', 'good');
      }
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('spell', margin, {
          actionTotal: actionRoll,
          dreadTotal: effectiveDreadRoll,
          context: skillLabel + ' check (manual roll)'
        });
      }
    } else {
      if (usePushLuck) {
        var neg = applyEnhancedManualCondition(statKey, false);
        if (typeof showNotif === 'function') showNotif('Push Luck failure: gained ' + neg + '.', 'warn');
      }
      applyEnhancedManualFailureConsequence(statKey, margin, skillLabel);
      if (typeof showNotif === 'function') {
        showNotif('Failure consequences applied to character sheet.', 'warn');
      }
    }

    actionInput.value = '';
    dreadInput.value = '';
    if (typeof closeModal === 'function') closeModal();
  }

  function handleManualRollFailure(actionDie, dreadDie, skillLabel, actionRoll, dreadRoll) {
    if (typeof openModal !== 'function' || typeof S === 'undefined') { return; }

    var currentTMW = Math.max(0, Number(S.tmw || 0));
    var failedBy = Math.max(1, dreadRoll - actionRoll);
    var needForSuccess = failedBy; // Need this much TMW to convert to success

    var html = '<div style="font-size:.85rem;color:var(--text2);line-height:1.7;">'
      + '<div style="background:rgba(201,64,64,.1);border:1px solid rgba(201,64,64,.35);padding:.4rem .55rem;margin-bottom:.4rem;border-radius:3px;">'
      + '<div style="font-size:.82rem;color:var(--red2);margin-bottom:.15rem;"><strong>❌ Failed Roll</strong></div>'
      + '<div style="font-size:.75rem;color:var(--red2);">'
      + skillLabel + ' <strong style="color:var(--text2);">' + actionRoll + '</strong> vs Dread <strong style="color:var(--text2);">' + dreadRoll + '</strong>'
      + '</div>'
      + '<div style="font-size:.74rem;color:var(--muted2);margin-top:.1rem;font-weight:700;">Failed by: <span style="color:var(--red);">' + failedBy + '</span></div>'
      + '</div>'
      + '<div style="background:rgba(46,196,182,.05);border:1px solid rgba(46,196,182,.25);padding:.4rem .55rem;margin-bottom:.4rem;border-radius:3px;">'
      + '<div style="font-size:.82rem;color:var(--teal);margin-bottom:.2rem;"><strong>+1 Teamwork Point Awarded</strong></div>'
      + '<div style="font-size:.75rem;color:var(--muted2);">Failure grants experience in the form of Teamwork Points.</div>'
      + '</div>'
      + '<div style="background:rgba(232,192,80,.04);border:1px solid rgba(232,192,80,.3);padding:.4rem .55rem;margin-bottom:.4rem;border-radius:3px;">'
      + '<div style="font-size:.82rem;color:var(--gold2);margin-bottom:.2rem;"><strong>Spend Teamwork Points?</strong></div>'
      + '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.3rem;">You have <strong style="color:var(--teal);">' + currentTMW + ' TMW</strong> available.</div>'
      + '<div style="font-size:.75rem;color:var(--muted2);">Spend <strong style="color:var(--text2);">' + needForSuccess + ' TMW</strong> to convert this failure to a success.</div>';

    // Input field to specify how much TMW to spend
    html += '<label style="display:block;margin-top:.3rem;">'
      + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.15rem;">TMW to Spend:</div>'
      + '<input type="number" id="manualRollTMWSpend" min="0" max="' + currentTMW + '" value="0" style="width:100%;background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.3rem .4rem;font-size:.85rem;border-radius:3px;">'
      + '</label>'
      + '</div>'
      + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.6rem;">'
      + '<button class="btn btn-sm" onclick="closeModal(); awardFailureTeamwork()">Keep Failure (+1 TMW)</button>'
      + '<button class="btn btn-sm btn-teal" onclick="applyManualRollTMWSpend(' + actionRoll + ',' + dreadRoll + ',' + needForSuccess + ',\'' + skillLabel.replace(/'/g, "\\'") + '\')">Spend TMW to Succeed</button>'
      + '</div>';

    html += '</div>';
    openModal('Failed Roll: ' + skillLabel + ' Check', html);
  }

  function awardFailureTeamwork() {
    if (typeof S === 'undefined') { return; }
    if (typeof addTMWOnFail === 'function') {
      addTMWOnFail('manual-roll-failure', { skipPrompt: true });
    } else {
      if (!S.tmw) S.tmw = 0;
      S.tmw = (S.tmw || 0) + 1;
      if (typeof updateTMWPool === 'function') { updateTMWPool(); }
    }
    if (typeof showNotif === 'function') showNotif('Failure noted. +1 Teamwork Point awarded.', 'info');
  }

  function applyManualRollTMWSpend(originalRoll, dreadRoll, needed, skillLabel) {
    if (typeof S === 'undefined' || typeof getCounter !== 'function') { return; }

    var spendInput = document.getElementById('manualRollTMWSpend');
    if (!spendInput) { return; }

    var spent = Math.max(0, parseInt(spendInput.value, 10) || 0);
    var currentTMW = Math.max(0, Number(S.tmw || 0));

    if (spent > currentTMW) {
      if (typeof showNotif === 'function') showNotif('Not enough Teamwork Points!', 'warn');
      return;
    }

    var newRoll = originalRoll + spent;
    var success = newRoll >= dreadRoll;

    // Deduct TMW
    if (spent > 0) {
      if (typeof changeCounter === 'function') {
        changeCounter('tmw', -spent);
      } else {
        S.tmw = Math.max(0, (S.tmw || 0) - spent);
      }
    }

    if (spent > 0 && typeof showNotif === 'function') {
      showNotif('Spent ' + spent + ' Teamwork: roll increased from ' + originalRoll + ' to ' + newRoll, 'info');
    }

    if (typeof closeModal === 'function') closeModal();

    // Award failure teamwork if still failed, or award success path token if now succeeded
    if (success) {
      if (typeof showNotif === 'function') showNotif('After spending TMW, you now succeed! +1 Path Token', 'good');
      awardPathToken('manual-roll-tmw-convert');
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome('spell', Math.max(1, newRoll - dreadRoll), {
          actionTotal: newRoll,
          dreadTotal: dreadRoll,
          context: skillLabel + ' check (TMW converted)'
        });
      }
    } else {
      // Still failed even with TMW
      awardFailureTeamwork();
      if (typeof showNotif === 'function') {
        showNotif('After spending ' + spent + ' TMW, you still fail (need ' + (needed - spent) + ' more). But you earned +1 Teamwork!', 'warn');
      }
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome('spell', Math.max(1, dreadRoll - newRoll), {
          actionTotal: newRoll,
          dreadTotal: dreadRoll,
          context: skillLabel + ' check (TMW partial)'
        });
      }
    }

    // Clear the manual inputs
    var actionInput = document.getElementById('manualActionValue');
    var dreadInput = document.getElementById('manualDreadValue');
    if (actionInput) actionInput.value = '';
    if (dreadInput) dreadInput.value = '';
  }

  window.showEnhancedManualRollPrompt = showEnhancedManualRollPrompt;
  window.awardPathToken = awardPathToken;
  
  // ── COMBAT MANUAL ROLL HANDLER ──────────────────────────────────────────────
  window.performCombatActionManualRoll = function(type) {
    if (!type || ['strike', 'shoot', 'spell', 'hack'].indexOf(type) < 0) return;

    var selected = (window.selectedDice && typeof window.selectedDice === 'object') ? window.selectedDice : { action: 4, dread: 6 };
    var actionDie = Number(selected.action || 4);
    var dreadDie = Number(selected.dread || 6);
    var skillLabel = type === 'strike' ? 'Strike' : (type === 'shoot' ? 'Shoot' : (type === 'hack' ? 'Hack' : 'Spell'));
    
    var html = '<div style="font-size:.85rem;color:var(--text2);line-height:1.7;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);margin-bottom:.4rem;">'
      + skillLabel + ' vs Dread d' + dreadDie
      + '</div>'
      + '<div style="background:rgba(46,196,182,.05);border:1px solid rgba(46,196,182,.25);padding:.35rem .45rem;margin-bottom:.4rem;border-radius:3px;">'
      + '<div style="font-size:.75rem;color:var(--teal);margin-bottom:.15rem;"><strong>Roll Against:</strong></div>'
      + '<div><strong style="color:var(--text2);">' + skillLabel + ' d' + actionDie + '</strong> <span style="color:var(--muted2);">vs</span> <strong style="color:var(--red);">Dread d' + dreadDie + '</strong></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-bottom:.4rem;">'
      + '<div><label style="font-size:.7rem;color:var(--muted2);display:block;margin-bottom:.15rem;">' + skillLabel + ' d' + actionDie + '</label><input type="number" id="combatManualActionValue" min="1" max="' + actionDie + '" placeholder="1-' + actionDie + '" style="width:100%;background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.3rem .4rem;font-size:.85rem;border-radius:3px;"></div>'
      + '<div><label style="font-size:.7rem;color:var(--muted2);display:block;margin-bottom:.15rem;">Dread d' + dreadDie + '</label><input type="number" id="combatManualDreadValue" min="1" max="' + dreadDie + '" placeholder="1-' + dreadDie + '" style="width:100%;background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.3rem .4rem;font-size:.85rem;border-radius:3px;"></div>'
      + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
      + '<button class="btn btn-sm btn-teal" onclick="finalizeCombatManualRoll(\'' + type + '\')">⚄ Resolve</button>'
      + '</div>';
    
    openModal('Manual ' + skillLabel + ' Roll', html);
  };
  
  window.finalizeCombatManualRoll = function(type) {
    var actionInput = document.getElementById('combatManualActionValue');
    var dreadInput = document.getElementById('combatManualDreadValue');

    if (!actionInput || !dreadInput) {
      if (typeof showNotif === 'function') showNotif('Inputs not found', 'warn');
      return;
    }

    var actionValue = parseInt(actionInput.value, 10);
    var dreadValue = parseInt(dreadInput.value, 10);

    if (!Number.isFinite(actionValue) || !Number.isFinite(dreadValue)) {
      if (typeof showNotif === 'function') showNotif('Invalid dice entry', 'warn');
      return;
    }

    var selected = (window.selectedDice && typeof window.selectedDice === 'object') ? window.selectedDice : { action: 4, dread: 6 };
    var actionDie = Number(selected.action || 4);
    var dreadDie = Number(selected.dread || 6);

    if (actionValue < 1 || actionValue > actionDie || dreadValue < 1 || dreadValue > dreadDie) {
      if (typeof showNotif === 'function') showNotif('Dice values out of range', 'warn');
      return;
    }

    if (typeof closeModal === 'function') closeModal();

    var mode = 'standard';
    if (window.heavyAttackData && window.heavyAttackData.type === type) mode = 'heavy';
    else if (window.fastAttackData && window.fastAttackData.type === type) mode = 'fast';

    var success = actionValue > dreadValue;
    var diff = Math.max(1, success ? actionValue - dreadValue : dreadValue - actionValue);
    var targetEnemy = (typeof getPrimaryCombatEnemy === 'function') ? getPrimaryCombatEnemy() : null;
    var resultEl = (typeof document !== 'undefined') ? document.getElementById('wayfarerActionResult') : null;
    var label = mode === 'heavy' ? 'Heavy Attack' : (mode === 'fast' ? 'Fast Attack' : (type === 'strike' ? 'Strike' : (type === 'shoot' ? 'Shoot' : (type === 'hack' ? 'Hack' : 'Spell'))));
    var dccType = (type === 'hack' || type === 'spell') ? 'spell' : type;

    if (success) {
      var dmg = Math.max(1, diff) + (mode === 'heavy' ? 2 : 0) + ((type === 'spell') ? 1 : 0);
      if (targetEnemy && typeof applyStressToEnemy === 'function') {
        applyStressToEnemy(targetEnemy, dmg, label + ' (Manual)');
      }
      if (mode === 'fast' && S && S.combat) {
        S.combat.fastAttackVulnerable = 1;
        S.combat.fastAttackUsedEncounter = true;
      }
      if (typeof addSuccessRoll === 'function') addSuccessRoll();
      if (typeof showDccSuccessOutcome === 'function') {
        showDccSuccessOutcome(dccType, diff, {
          actionTotal: actionValue,
          dreadTotal: dreadValue,
          context: label + ' vs Enemy Dread (manual roll)'
        });
      }
      if (resultEl) {
        resultEl.innerHTML = '<span style="color:var(--teal);">' + label + ': ' + actionValue + ' vs Dread ' + dreadValue + ' - HIT! ' + dmg + ' Health damage.</span>';
      }
    } else {
      if (typeof addTMWOnFail === 'function') addTMWOnFail('manual-combat-failure');
      if (typeof showDccFailureOutcome === 'function') {
        showDccFailureOutcome(dccType, diff, {
          actionTotal: actionValue,
          dreadTotal: dreadValue,
          context: label + ' vs Enemy Dread (manual roll)'
        });
      }
      if (resultEl) {
        resultEl.innerHTML = '<span style="color:var(--red2);">' + label + ': ' + actionValue + ' vs Dread ' + dreadValue + ' - MISS.</span>';
      }
    }

    if (typeof clearConditionOnUse === 'function') clearConditionOnUse(type);
    if (typeof updateWayfarerActionBtn === 'function') updateWayfarerActionBtn();
    if (typeof renderCombatOptions === 'function') renderCombatOptions();

    window.manualRollData = null;
    window.heavyAttackData = null;
    window.fastAttackData = null;
  };
  window.manualRollOutcomeFailure = manualRollOutcomeFailure;
  window.handleManualRollFailure = handleManualRollFailure;
  window.awardFailureTeamwork = awardFailureTeamwork;
  window.applyManualRollTMWSpend = applyManualRollTMWSpend;
}());

// ── TROPHY SYSTEM ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var TROPHY_DEFS = [
    { id: 'first_combat',        icon: '⚔',  title: 'Bloodied Hands',      desc: 'Win your first combat.' },
    { id: 'first_mission',       icon: '✦',  title: 'Sworn In',            desc: 'Complete your first mission.' },
    { id: 'first_galaxy_hex',    icon: '🌌', title: 'Star Walker',         desc: 'Explore your first Galaxy hex.' },
    { id: 'first_planet',        icon: '🪐', title: 'Planetfall',          desc: 'Land on and scan your first planet.' },
    { id: 'first_faction_renown',icon: '🤝', title: 'Faction Favor',       desc: 'Earn your first point of faction renown.' },
    { id: 'first_shop_purchase', icon: '🛒', title: 'Market Runner',       desc: 'Make your first purchase from the shop.' },
    { id: 'first_service',       icon: '🔧', title: 'District Regular',    desc: 'Use a district service for the first time.' },
    { id: 'first_wayfarer',      icon: '🧭', title: 'Fellow Traveler',     desc: 'Encounter your first Wayfarer.' },
    { id: 'first_raid',          icon: '💀', title: 'Raid Ready',          desc: 'Complete a raid.' },
    { id: 'first_derelict',      icon: '🛸', title: 'Ghost Diver',         desc: 'Board and explore a derelict ship.' },
    { id: 'first_planet_task',   icon: '📍', title: 'Boots On Ground',     desc: 'Complete a task on a planet surface.' },
    { id: 'reach_1000_credits',  icon: '💰', title: 'Flush',               desc: 'Accumulate 1,000 Credits at once.' },
    { id: 'survive_max_stress',  icon: '🧠', title: 'Edge of Breaking',    desc: 'Reach maximum Stress and survive the scene.' },
    { id: 'first_space_encounter',icon:'🚀', title: 'Open Skies',          desc: 'Resolve your first Space Encounter.' },
    { id: 'first_hack',          icon: '💻', title: 'The Code Speaks',     desc: 'Successfully cast an OS Hack.' },
    { id: 'explore_all_zones',   icon: '🗺', title: 'Cartographer',        desc: 'Reveal all district zones in the World map.' },
    { id: 'first_starship_upgrade',icon:'⚙', title: 'Shipwright',          desc: 'Install your first starship upgrade.' },
    { id: 'first_dead_moon',     icon: '🌑', title: 'Void Walker',         desc: 'Explore a Dead Moon.' },
    { id: 'first_mystery_contact',icon:'❓', title: 'Hail Stranger',       desc: 'Make first contact with a Mystery vessel.' },
    { id: 'complete_storyline',  icon: '📖', title: 'The Path Walked',     desc: 'Complete your first storyline arc.' },
  ];

  function ensureTrophyState() {
    if (typeof S === 'undefined') return;
    if (!S.trophies || typeof S.trophies !== 'object') S.trophies = {};
  }

  function awardTrophy(id) {
    if (typeof S === 'undefined') return;
    ensureTrophyState();
    if (S.trophies[id]) return;
    var def = TROPHY_DEFS.find(function (t) { return t.id === id; });
    if (!def) return;
    S.trophies[id] = { earned: true, timestamp: Date.now() };
    var msg = def.icon + ' Trophy Unlocked: \u201c' + def.title + '\u201d \u2014 ' + def.desc;
    if (typeof showNotif === 'function') showNotif(msg, 'good');
    // Render a persistent banner for 4 seconds
    var banner = document.getElementById('trophyBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'trophyBanner';
      banner.style.cssText = 'position:fixed;bottom:4.5rem;left:50%;transform:translateX(-50%);background:rgba(30,26,18,.96);border:1px solid rgba(232,192,80,.65);border-radius:.5rem;padding:.55rem 1.1rem;font-family:Rajdhani,sans-serif;font-size:.96rem;color:#f0d070;z-index:9999;pointer-events:none;transition:opacity .4s;max-width:90vw;text-align:center;';
      document.body.appendChild(banner);
    }
    banner.innerHTML = def.icon + ' <strong>Trophy Unlocked</strong> &mdash; &ldquo;' + def.title + '&rdquo;';
    banner.style.opacity = '1';
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(function () { banner.style.opacity = '0'; }, 3800);
    renderTrophyTab();
  }

  function checkTrophy(id) {
    if (typeof S === 'undefined') return;
    ensureTrophyState();
    if (S.trophies[id]) return;
    // Dynamic check conditions for trophies that depend on current state
    if (id === 'reach_1000_credits') {
      if (typeof getCredits === 'function' && getCredits() < 1000) return;
    }
    if (id === 'explore_all_zones') {
      var w = S && S.worldThatWas;
      if (!w || !Array.isArray(w.zones)) return;
      var allExplored = w.zones.every(function (z) { return z.explored || z.hexIds && z.hexIds.some(function (hid) { return (w.hexes || []).find(function (h) { return h.id === hid && h.explored; }); }); });
      if (!allExplored) return;
    }
    awardTrophy(id);
  }

  function buildTrophyPanelHtml() {
    ensureTrophyState();
    var trophies = (typeof S !== 'undefined' && S.trophies) ? S.trophies : {};
    var iconApi = (typeof window !== 'undefined') ? window.SharedIconSystem : null;
    var earned = TROPHY_DEFS.filter(function (t) { return trophies[t.id]; });
    var locked = TROPHY_DEFS.filter(function (t) { return !trophies[t.id]; });
    var html = '<div class="card"><div class="section-title">Trophies &mdash; ' + earned.length + ' / ' + TROPHY_DEFS.length + '</div>';
    html += '<div style="font-size:.82rem;color:var(--muted2);margin-bottom:.65rem;">Unlock trophies by completing milestones. Aim for 100%.</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.4rem;">';
    TROPHY_DEFS.forEach(function (def) {
      var isEarned = !!trophies[def.id];
      var trophyIcon = iconApi && typeof iconApi.iconTrophy === 'function'
        ? iconApi.iconTrophy({ size: 24, accent: isEarned ? iconApi.resolveAccent(def.id) : '#6f7d8f', title: def.title })
        : def.icon;
      html += '<div style="padding:.45rem .55rem;border:1px solid ' + (isEarned ? 'rgba(232,192,80,.55)' : 'var(--border2)') + ';background:' + (isEarned ? 'rgba(232,192,80,.07)' : 'rgba(255,255,255,.02)') + ';border-radius:.35rem;">';
      html += '<div style="font-size:1.35rem;line-height:1;">' + trophyIcon + '</div>';
      html += '<div style="font-size:.88rem;font-weight:700;color:' + (isEarned ? 'var(--gold2)' : 'var(--muted2)') + ';margin-top:.18rem;">' + def.title + '</div>';
      html += '<div style="font-size:.76rem;color:var(--muted2);margin-top:.1rem;">' + (isEarned ? def.desc : '???') + '</div>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderTrophyTab() {
    var host = document.getElementById('trophyTabPanel');
    if (!host) return;
    host.innerHTML = buildTrophyPanelHtml();
  }

  // Public interface
  window.TrophySystem = {
    award: awardTrophy,
    check: checkTrophy,
    buildPanelHtml: buildTrophyPanelHtml,
    renderTab: renderTrophyTab,
    defs: TROPHY_DEFS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTrophyTab);
  } else {
    renderTrophyTab();
  }
}());
