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
    { id: "merchant",    name: "Merchant Stall",     base: "Modifies buying/selling prices by ±50%." },
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
      taxLog: []
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
    return [
      '<div class="ship-banner">',
        '<h3>Caravan Management</h3>',
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
        return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.28rem .35rem;border-radius:4px;cursor:pointer;" onclick="openCaravanCargoItem(' + i + ')">'
          + '<div style="font-size:.72rem;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + String(item).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>'
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
    if (!Array.isArray(S.backpack)) { S.backpack = Array(10).fill(''); }
    var slotIdx = S.backpack.indexOf('');
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
    var html = '<div style="font-size:.9rem;color:var(--text2);line-height:1.6;">'
      + '<div style="margin-bottom:.45rem;">' + item + '</div>'
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
    var a = explodingRoll(actionDie);
    var d = explodingRoll(dread);
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
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
      if (typeof addTMWOnFail === 'function') { addTMWOnFail(); }
    }
  }

  function rollChaseEnemyAttack() {
    var dread = S.caravan.chase.enemyDread;
    var caravanDread = getCaravanDread();
    var a = explodingRoll(dread);
    var d = explodingRoll(caravanDread);
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
          if (q.infoHex && q.step <= 0) {
            gateLoc += '<div style="font-size:.72rem;color:var(--gold2);margin-top:.18rem;">👁 Gather Information: Hex [' + (q.infoHex.col + 1) + ',' + (q.infoHex.row + 1) + ']</div>';
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

    renderHoldingCrises();

    // Holding Vault
    var vaultEl = document.getElementById("holdingVault");
    if (vaultEl) {
      if (!h.vault || h.vault.length === 0) {
        vaultEl.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">Vault is empty.</div>';
      } else {
        vaultEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:.4rem;">'
          + h.vault.map(function(item, i) {
            return '<div style="background:var(--surface);border:1px solid var(--border2);padding:.3rem;text-align:center;border-radius:3px;font-size:.75rem;color:var(--text2);cursor:pointer;" onclick="moveVaultItemToBackpack(' + i + ');">'
              + '<div style="word-wrap:break-word;overflow:hidden;text-overflow:ellipsis;">' + item + '</div>'
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
      var microCount = 2 + Math.floor(Math.random() * 4);
      var micro = [];
      for (var mi = 0; mi < microCount; mi++) micro.push(pickLocal(archetype.microPool));
      return {
        id: id,
        label: label,
        kind: inferKind(label),
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
        activity: pickLocal(archetype.activities),
        mood: pickLocal(archetype.moods),
        rumor: pickLocal(archetype.rumors),
        interactable: pickLocal(archetype.interactables),
        hiddenThing: pickLocal(archetype.hiddenThings),
        microLocations: micro
      };
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
        stats: buildStats(archetype),
        history: []
      };
    }

    var crawl = S.holding.settlementHexcrawl;
    crawl.nodes.forEach(function (n) { n.revealed = true; });
    return crawl;
  }

  function rollHoldingAmbientState(crawl) {
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
    var size = 40;
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
    return '<svg viewBox="0 0 760 500" style="width:100%;max-width:1080px;height:auto;display:block;margin:0 auto;">' + edgeSvg + nodeSvg + '</svg>';
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
    var actionButton = active && !active.explored
      ? '<button class="btn btn-xs btn-primary" onclick="resolveHoldingSettlementHexNode(\'' + String(active.id) + '\')">Explore (Action vs DD' + Number(active.dd || 6) + ')</button>'
      : '<span style="font-size:.68rem;color:var(--green2);">District already resolved this visit.</span>';
    var districtButtons = '';
    if (active) {
      if (active.kind === 'inn') districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'rest\')">Rest At Inn</button>';
      if (active.kind === 'lord') districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'audience\')">Audience With Lord</button>';
      if (active.kind === 'merchant_items') {
        districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'buy_item\')">Buy Rations (50₵)</button>';
        districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'buy_tools\')">Buy Tools (65₵)</button>';
        districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'buy_medicine\')">Buy Medicine (85₵)</button>';
      }
      if (active.kind === 'merchant_weapons') districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'buy_weapon\')">Buy Weapon+ (120₵)</button>';
      if (active.kind === 'mission') districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'mission\')">Generate Task/Mission</button>';
      if (active.kind === 'downtime') districtButtons += '<button class="btn btn-xs" onclick="runHoldingDistrictAction(\'' + String(active.id) + '\',\'downtime\')">Province Downtime</button>';
    }

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.55;display:grid;gap:.4rem;">'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.04);padding:.45rem;">'
      + '<div style="font-size:.74rem;color:var(--gold2);letter-spacing:.05em;text-transform:uppercase;"><strong>Overview Of The Holding</strong></div>'
      + '<div style="margin-top:.16rem;font-size:.78rem;color:var(--text2);"><strong style="color:var(--gold2);">' + String(crawl.holdingType || S.holding.type || 'Holding') + ' District Hexcrawl</strong> · Visit #' + Number(crawl.visitCount || 1) + ' · Time: ' + String(crawl.timeOfDay || 'morning').toUpperCase() + '</div>'
      + '<div style="margin-top:.12rem;font-size:.72rem;color:var(--muted2);">Type: ' + String(crawl.holdingType || 'Settlement') + ' · Terrain: ' + String((S.holding && S.holding.terrain) || 'Glades') + ' · Weather: ' + String((S.currentSeason || 'spring').toUpperCase()) + '</div>'
      + '<div style="margin-top:.12rem;font-size:.72rem;color:var(--teal);">Style: ' + String(crawl.vibe || 'Living settlement pressure ecosystem') + '</div>'
      + '<div style="margin-top:.16rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:.2rem;">' + statsHtml + '</div>'
      + '</div>'

      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.03);padding:.42rem;">'
      + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.2rem;"><strong>Big Screen Of The Hex</strong></div>'
      + buildHoldingHexMapHtml(crawl)
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.2rem;">'
      + '<button class="btn btn-xs" onclick="advanceHoldingSettlementTime(1)">+1 Hour</button>'
      + '<button class="btn btn-xs" onclick="advanceHoldingSettlementTime(6)">+6 Hours</button>'
      + '<button class="btn btn-xs btn-teal" onclick="openHoldingSettlementHexcrawl()">Refresh Scene</button>'
      + '</div>'
      + '</div>'

      + (active ? ('<div style="border:1px solid var(--border2);background:rgba(0,0,0,.14);padding:.42rem;">'
        + '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Per Hex Information</strong></div>'
        + '<div style="font-size:.84rem;color:var(--text);"><strong>' + active.label + '</strong> <span style="font-size:.72rem;color:var(--muted2);">(' + (active.explored ? 'Visited' : 'Unexplored') + ')</span></div>'
        + '<div style="font-size:.72rem;color:var(--text2);margin-top:.12rem;line-height:1.55;">' + active.atmosphere + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);margin-top:.12rem;">Activity: ' + active.activity + ' · Crowd: ' + active.npcDensity + ' · Mood: ' + active.mood + '</div>'
        + '<div style="font-size:.7rem;color:var(--muted2);">Interactable: ' + active.interactable + ' · Hidden: ' + active.hiddenThing + '</div>'
        + '<div style="font-size:.7rem;color:var(--teal);margin-top:.12rem;">Micro-Locations</div>'
        + microHtml
        + '<div style="margin-top:.18rem;display:flex;gap:.2rem;flex-wrap:wrap;">' + actionButton + '</div>'
        + '<div style="margin-top:.16rem;display:flex;gap:.2rem;flex-wrap:wrap;">' + districtButtons + '</div>'
        + '<div style="margin-top:.16rem;display:flex;gap:.2rem;flex-wrap:wrap;">'
        + '<button class="btn btn-xs" onclick="rollHoldingDowntimeActivity(\'talk\')">Walk Streets</button>'
        + '<button class="btn btn-xs" onclick="rollHoldingDowntimeActivity(\'task\')">Do Local Work</button>'
        + '<button class="btn btn-xs" onclick="runHoldingDistrictActionByKind(\'merchant_items\',\'buy_item\')">Market Purchase</button>'
        + '<button class="btn btn-xs" onclick="runHoldingDistrictActionByKind(\'merchant_weapons\',\'buy_weapon\')">Visit Smith</button>'
        + '</div>'
        + (active.result ? '<div style="font-size:.7rem;color:var(--gold2);margin-top:.14rem;line-height:1.5;">' + active.result + '</div>' : '')
        + '</div>') : '')

      + '<div style="border:1px solid var(--border2);background:rgba(46,196,182,.08);padding:.36rem;">'
      + '<div style="font-size:.71rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Settlement Life</strong></div>'
      + '<div style="font-size:.7rem;color:var(--muted2);line-height:1.55;">' + String(ambient.scene || 'The holding stirs.') + '<br>Rumor: ' + String(ambient.rumor || 'No rumor yet.') + '<br>Opportunity: ' + String(ambient.opportunity || 'No opportunity yet.') + '<br>Mystery: ' + String(ambient.mysterySignal || 'No anomaly yet.') + '</div>'
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
      S.holding.councilTasks.push('Lord mission: secure outlying district route.');
      crawl.stats.security = Math.min(10, Number((crawl.stats && crawl.stats.security) || 0) + 1);
      msg = 'Audience complete. +1 Renown and a new mission directive.';
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
      if (typeof generateTask === 'function') generateTask();
      msg = 'A mission lead was generated from district intel.';
    } else if (action === 'downtime') {
      rollHoldingDowntimeActivity('explore');
      msg = 'Province holding downtime initiated.';
    }
    node.result = msg || node.result;
    crawl.history = Array.isArray(crawl.history) ? crawl.history : [];
    if (msg) {
      crawl.history.unshift(String(node.label || 'District') + ': ' + msg);
      crawl.history = crawl.history.slice(0, 12);
    }
    if (typeof showNotif === 'function' && msg) showNotif(msg, msg.toLowerCase().indexOf('not enough') >= 0 ? 'warn' : 'good');
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal({ advanceVisit: false }));
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

  function openHoldingSettlementHexcrawl() {
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal({ advanceVisit: true }));
  }

  function selectHoldingSettlementDistrict(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id || '') === String(nodeId || ''); });
    if (!node) { return; }
    crawl.activeNodeId = node.id;
    var eventPool = crawl.ambientTables && Array.isArray(crawl.ambientTables.scenes) ? crawl.ambientTables.scenes : [];
    if (eventPool.length) {
      var ev = eventPool[Math.floor(Math.random() * eventPool.length)];
      if (!node.result || Math.random() < 0.35) node.result = 'District event: ' + ev;
      if (typeof showNotif === 'function') showNotif(node.label + ': ' + ev, 'info');
    }
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal({ advanceVisit: false }));
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
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal({ advanceVisit: false }));
  }

  function resolveHoldingSettlementHexNode(nodeId) {
    var crawl = ensureHoldingSettlementHexcrawl();
    var node = crawl.nodes.find(function (entry) { return String(entry.id) === String(nodeId); });
    if (!node || node.explored || !node.revealed) { return; }
    node.explored = true;
    var die = (typeof getEffectiveDie === 'function') ? getEffectiveDie('lead') : ((S.stats && S.stats.lead) || 4);
    var action = explodingRoll(die);
    var dread = explodingRoll(Number(node.dd || 6));
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
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
      line += 'District stabilized. +' + cGain + ' Credits, +1 Teamwork, Fear reduced.';
    } else {
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
    openModal('Holding Settlement Hexcrawl', buildHoldingSettlementHexcrawlModal({ advanceVisit: false }));
    renderHoldingUI();
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
    var a = explodingRoll(die);
    var d = explodingRoll(evt.dd || 6);
    var success = a.total >= d.total;
    if (success) {
      applyHoldingDowntimeEffect(evt.successEffect);
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
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
    if (!out) { return; }
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
    if (!out) { return; }
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
    var a = explodingRoll(advDie);
    var d = explodingRoll(dreadDie);
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
      + '<button class="btn btn-sm btn-red" onclick="resolveHoldingQuestOutcome(false)">\u2717 Failure — Roll Failed</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveHoldingQuestOutcome(true)">\u2713 Success — Roll Succeeded</button>'
      + '</div>';
    openModal('Step 3 — Confrontation', html);
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
    var a = explodingRoll(advDie);
    var d = explodingRoll(dreadTarget);
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
      if (typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    } else {
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
      }
      return out;
    };
  }

  function syncNewFeatureUIs() {
    ensureNewFeatureState();
    mountNewFeaturePanels();
    renderCaravanUI();
    renderHoldingUI();
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
  window.runHoldingDistrictAction = runHoldingDistrictAction;
  window.runHoldingDistrictActionByKind = runHoldingDistrictActionByKind;
  window.selectHoldingSettlementDistrict = selectHoldingSettlementDistrict;
  window.advanceHoldingSettlementTime = advanceHoldingSettlementTime;
  window.resolveHoldingSettlementHexNode = resolveHoldingSettlementHexNode;
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
      return;
    }

    if (cat === 'os_hacks' && S.augmentations.indexOf('OPERATING SYSTEM') < 0) {
      showNotif('OPERATING SYSTEM augmentation required to buy Hacks!', 'warn');
      return;
    }

    if (_baseBuyItem) {
      _baseBuyItem(cost, name, cat);
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

  function castHack() {
    ensureNewFeatureState();

    // Sync selected hack from dropdown
    var sel = document.getElementById('hackSelect');
    if (sel && sel.value) { S.hackRoller.selectedHack = sel.value; }

    var hackName = S.hackRoller.selectedHack;
    if (!hackName && S.ownedHacks.length) { hackName = S.ownedHacks[0]; S.hackRoller.selectedHack = hackName; }

    if (!hackName) {
      showNotif('Select a Hack to cast first!', 'warn'); return;
    }
    if (!S.hackRoller.guess) {
      showNotif('Select a guess first: Below, Between, or Above!', 'warn'); return;
    }

    // Get TMW cost
    var hackData = HACK_EFFECTS[hackName];
    var tmwCost = hackData ? hackData.tmw : 0;
    if (tmwCost > 0 && typeof getScarTmwCostPenalty === 'function') {
      tmwCost += Math.max(0, Number(getScarTmwCostPenalty() || 0));
    }
    if (tmwCost > 0 && (S.tmw || 0) < tmwCost) {
      showNotif('Need ' + tmwCost + ' TMW to cast ' + hackName + '! (have ' + (S.tmw || 0) + ')', 'warn'); return;
    }

    // Deduct TMW (spent to activate)
    if (tmwCost > 0) {
      S.tmw = Math.max(0, (S.tmw || 0) - tmwCost);
      updateTMWPool();
    }

    var combatEnemy = (typeof getPrimaryCombatEnemy === 'function') ? getPrimaryCombatEnemy() : null;
    var dreadDie = (S.combat && S.combat.active && combatEnemy && typeof getEnemyEffectiveDread === 'function')
      ? getEnemyEffectiveDread(combatEnemy)
      : (S.hackRoller.dreadDie || 6);
    S.hackRoller.dreadDie = dreadDie;
    var d1 = roll(dreadDie);
    var d2 = roll(dreadDie);
    var low  = Math.min(d1, d2);
    var high = Math.max(d1, d2);

    // Control roll + optional NIGHTGUARD bonus (+d4)
    var ctrlDie  = (typeof getAugBonus === 'function') ? null : null; // resolve below
    ctrlDie = S.stats.control || 4;
    var ctrlRoll = explodingRoll(ctrlDie);
    var augBonusDie = (typeof getAugBonus === 'function') ? getAugBonus('control') : 0;
    var augRoll  = augBonusDie > 0 ? explodingRoll(augBonusDie) : null;
    var ctrlVal  = ctrlRoll.total + (augRoll ? augRoll.total : 0);

    var actual;
    if      (ctrlVal < low)  { actual = 'below'; }
    else if (ctrlVal > high) { actual = 'above'; }
    else                     { actual = 'between'; }

    var success = actual === S.hackRoller.guess;
    var augNote = augRoll ? ' <span style="color:var(--gold2);font-size:.72rem;">(+d'+augBonusDie+'='+augRoll.total+')</span>' : '';

    var effectHtml = '';
    if (success && hackData && hackData.effect) {
      var effectText = (S.combat && S.combat.active && combatEnemy && typeof applyCombatHackEffect === 'function')
        ? (applyCombatHackEffect(hackName) || hackData.effect())
        : hackData.effect();
      effectHtml = '<br><span style="color:var(--teal);">' + effectText + '</span>';
    }

    // Malware on failure: lose 1 TMW + take d6 Stress + Distracted
    var malwareHtml = '';
    if (!success) {
      var malwareDmg = roll(6);
      S.tmw = Math.max(0, (S.tmw || 0) - 1);
      updateTMWPool();
      changeHealth(malwareDmg);
      malwareHtml = '<br><span style="color:var(--red2);">⚠ Malware! Lost 1 TMW &amp; took <strong>' + malwareDmg + ' Stress</strong> (1d6). Distracted applied.</span>';
      if (typeof updateConditionButtons === 'function') {
        S.conditions.distracted = true;
        updateConditionButtons();
        if (typeof updateAllStatDisplays === 'function') { updateAllStatDisplays(); }
      }
    }

    var resultEl = document.getElementById('hackRollResult');
    if (resultEl) {
      resultEl.innerHTML =
        '<div class="gamble-rolls">'
        + '<div class="gamble-die"><div class="gd-label">Dread Low</div><div class="gd-value" style="color:var(--red);">' + low + '</div></div>'
        + '<div class="gamble-die"><div class="gd-label">Control d' + ctrlDie + (ctrlRoll.exploded ? '*' : '') + '</div><div class="gd-value" style="color:var(--teal);">' + ctrlVal + '</div></div>'
        + '<div class="gamble-die"><div class="gd-label">Dread High</div><div class="gd-value" style="color:var(--red);">' + high + '</div></div>'
        + '</div>'
        + (tmwCost > 0 ? '<div style="font-size:.72rem;color:var(--muted2);margin:.25rem 0;">−' + tmwCost + ' TMW spent · ' + (S.tmw || 0) + ' remaining</div>' : '')
        + augNote
        + '<div class="gamble-outcome ' + (success ? 'good' : 'warn') + '" style="margin-top:.4rem;">'
        + '<strong style="color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">' + (success ? '✔ Hack Succeeded!' : '✘ Hack Failed — Malware!') + '</strong><br>'
        + 'Dread d' + dreadDie + ': ' + low + '–' + high
        + ' &nbsp;|&nbsp; Guess: <strong>' + capFirst(S.hackRoller.guess) + '</strong>'
        + ' &nbsp;|&nbsp; Control: ' + ctrlVal + ' (<em>' + capFirst(actual) + '</em>)'
        + effectHtml
        + malwareHtml
        + '</div>';
    }
    if (success && typeof addSuccessRoll === 'function') { addSuccessRoll(); }
    if (typeof renderQP === 'function' && S.quickPanel) {
      S.quickPanel.lastCombatRoll = (resultEl && resultEl.innerHTML) ? resultEl.innerHTML : S.quickPanel.lastCombatRoll;
      renderQP('combat');
    }
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
  window.getAvailableWeaponModSlots = getAvailableWeaponModSlots;
}());
