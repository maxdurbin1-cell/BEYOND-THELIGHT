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
    if (!Array.isArray(S.holding.landmarks))      { S.holding.landmarks = []; }
    if (!Array.isArray(S.holding.extraLandmarks)) { S.holding.extraLandmarks = []; }
    if (!Array.isArray(S.holding.crises))         { S.holding.crises = []; }
      if (!Array.isArray(S.holding.vault))          { S.holding.vault = []; }
    if (!Array.isArray(S.holding.councilTasks))    { S.holding.councilTasks = []; }
    if (!Array.isArray(S.holding.taxLog))         { S.holding.taxLog = []; }

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
    if (!panel || panel.dataset.mounted) { return; }
    panel.dataset.mounted = "1";
    panel.innerHTML = buildHoldingHTML();
    renderHoldingUI();
  }

  function updateHoldingTabVisibility() {
    if (typeof document === "undefined") { return; }
    var holdingBtn = document.querySelector("button.tab-btn.ctx-holding[onclick*=\"switchTab('holding'\"]");
    if (!holdingBtn) { return; }
    // Only show Holding tab once the special quest is completed and a Holding exists.
    if (S && S.holding && S.holding.name) {
      holdingBtn.style.display = "";
    } else {
      holdingBtn.style.display = "none";
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
          '<div style="font-size:.75rem;color:var(--muted2);margin-bottom:.4rem;">Assign tasks. Roll Adventure Die vs Dread d6 for outcomes. Tasks take a Phase to a Season. Councils typically have 3–6 Retainers.</div>',
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
          + '<div style="font-size:.68rem;color:var(--muted2);margin-bottom:.2rem;">Task Capacity: <span style="color:var(--gold2);">' + activeTasks + '/' + retainers + '</span></div>'
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
        return '<input class="bp-input" placeholder="Slot ' + (i + 1) + '" value="' + (item || "").replace(/"/g, "&quot;") + '" onchange="updateCaravanCargo(' + i + ',this.value)">';
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
    ensureNewFeatureState();
    var h = S.holding;
    var el;

    // Holding gate — locked if Renown < 9 and no quest active and no holding yet
    var gateEl = document.getElementById("holdingGate");
    var bodyEl = document.getElementById("holdingBody");
    var renown = S.renown || 0;
    var questActive = (S.holdingQuest || {}).active;
    var holdingEstablished = !!h.name;
    if (gateEl) {
      if (!holdingEstablished && !questActive) {
        if (renown < 9) {
          gateEl.innerHTML = '<div class="card" style="max-width:540px;margin-top:.6rem;">'
            + '<div class="section-title">Holding Locked</div>'
            + '<div style="font-size:.8rem;color:var(--muted2);">You require <strong style="color:var(--gold2);">Renown 9</strong> to establish a Holding. Your current Renown: <strong style="color:var(--teal);">' + renown + '</strong>.</div>'
            + '</div>';
          if (bodyEl) { bodyEl.style.display = "none"; }
          return;
        } else {
          gateEl.innerHTML = '<div class="card" style="max-width:540px;margin-top:.6rem;">'
            + '<div class="section-title">Establish Your Holding</div>'
            + '<div style="font-size:.8rem;color:var(--text2);margin-bottom:.5rem;">You have achieved the Renown of a Lord. Begin the Establishment Quest to claim your domain. This quest will also mark your Province on the map.</div>'
            + '<button class="btn btn-primary" onclick="startHoldingQuest()">Begin Establishment Quest</button>'
            + '</div>';
          if (bodyEl) { bodyEl.style.display = "none"; }
          return;
        }
      } else {
        gateEl.innerHTML = '';
        if (bodyEl) { bodyEl.style.display = ""; }
      }
    }

    el = document.getElementById("holdingRenownReadout");    if (el) { el.textContent = S.renown || 0; }
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
      } else if (!h.name) {
        if ((S.renown || 0) < 9) {
          questEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted2);">You need <strong style="color:var(--gold2);">Renown 9</strong> to establish a Holding. Currently: ' + (S.renown || 0) + '</div>';
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
    if ((S.renown || 0) < 9) {
      showNotif("Need Renown 9 to begin the Holding quest.", "warn");
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
      + '<button class="btn btn-sm btn-red" onclick="resolveHoldingQuestStep3(false);closeModal();">\u2717 Failure — Roll Failed</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveHoldingQuestStep3(true);closeModal();">\u2713 Success — Roll Succeeded</button>'
      + '</div>';
    openModal('Step 3 — Confrontation', html);
  }

  function resolveHoldingQuestStep3(success) {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }

    if (!success) {
      q.active = false;
      q.failed = true;
      q.step3Completed = true;
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
    if (typeof updateRenown === 'function') { updateRenown(); }
    S.credits = (S.credits || 0) + (q.rewardCredits || 250);
    if (typeof updateCreditsUI === 'function') { updateCreditsUI(); }

    var loot = [];
    if (typeof rollForLoot === 'function') {
      loot = rollForLoot('challenging') || [];
    }
    q.rewardLoot = loot.slice();
    if (typeof addToBackpack === 'function') {
      for (var li = 0; li < loot.length; li++) { addToBackpack(loot[li]); }
    }

    if (!S.holding.name) {
      rollHoldingName();
    }
    if (!S.holding.name) {
      S.holding.name = 'New Holding';
    }
    q.holdingHex = q.holdingHex || q.siteHex || q.infoHex || null;
    placeHoldingQuestTokens();
    updateHoldingTabVisibility();
    renderHoldingUI();
    if (typeof renderMissionBoard === 'function') { renderMissionBoard(); }
    if (typeof renderMissionTracker === 'function') { renderMissionTracker(); }
    if (typeof renderCompletedMissions === 'function') { renderCompletedMissions(); }
    if (typeof renderQP === 'function') { renderQP('missions'); }

    showNotif('Holding established! +1 Renown · +' + (q.rewardCredits || 250) + '₵' + (loot.length ? ' · Loot: ' + loot.join(', ') : ''), 'good');

    if (typeof setContext === 'function') {
      var holdingCtxBtn = document.querySelector('.ctx-btn[onclick*="setContext(\'holding\'"]');
      setContext('holding', holdingCtxBtn || null);
    }
    var holdingBtn = document.querySelector("button.tab-btn.ctx-holding[onclick*=\"switchTab('holding'\"]");
    if (typeof switchTab === 'function') {
      switchTab('holding', holdingBtn || null);
    }
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
    var renown = S.renown || 0;
    var holdingEstablished = S.holding && S.holding.name;
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
    var holdingEstablished = S.holding && S.holding.name;
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
          showNotif("Regent failures caused your Holding marker to disappear from the Province map!", "warn");
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
        tasks[0].status = "resolved";
        removeCouncilTaskSite(tasks[0].id);
        showNotif(capFirst(role) + " completed task: " + tasks[0].verb + " " + tasks[0].target, "good");
        renderHoldingUI();
      } else {
        showNotif(capFirst(role) + " failed assigned task.", "warn");
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

  function renderCombatMap() {
    var el = document.getElementById("combatMapZones");
    if (!el) { return; }
    ensureNewFeatureState();
    var zones = ["Engaged", "Close", "Nearby", "Far"];
    var zoneInfo = {
      Engaged: { color: "rgba(201,64,64,.07)",    border: "rgba(201,64,64,.35)",    range: "Melee / Strike" },
      Close:   { color: "rgba(201,162,39,.06)",   border: "rgba(201,162,39,.3)",    range: "Spells / Items" },
      Nearby:  { color: "rgba(46,196,182,.06)",   border: "rgba(46,196,182,.3)",    range: "Ranged / Shoot" },
      Far:     { color: "rgba(122,120,152,.06)",  border: "rgba(122,120,152,.25)",  range: "Out of Range" }
    };
    el.innerHTML = zones.map(function(zone) {
      var info = zoneInfo[zone];
      var units = S.combatMap.units.filter(function(u){ return u.zone === zone; });
      var allies  = units.filter(function(u){ return u.side === "ally"; });
      var enemies = units.filter(function(u){ return u.side === "enemy"; });
      var zoneOptions = zones.map(function(z){ return '<option value="' + z + '"' + (z === zone ? ' selected' : '') + '>' + z + '</option>'; }).join("");
      var allyTags = allies.map(function(u) {
        return '<div style="background:rgba(46,196,182,.13);border:1px solid var(--teal);padding:.14rem .32rem;font-size:.7rem;color:var(--teal);display:inline-flex;align-items:center;gap:.2rem;margin:.1rem;">'
          + '<span>\uD83D\uDFE6 ' + u.name + '</span>'
          + '<select style="background:transparent;border:none;color:var(--teal);font-size:.62rem;cursor:pointer;" onchange="moveCombatUnit(' + u.id + ',this.value)">' + zoneOptions + '</select>'
          + '<button style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:0;font-size:.68rem;line-height:1;" onclick="removeCombatUnit(' + u.id + ')">✕</button>'
          + '</div>';
      }).join("");
      var enemyTags = enemies.map(function(u) {
        return '<div style="background:rgba(201,64,64,.13);border:1px solid var(--red);padding:.14rem .32rem;font-size:.7rem;color:var(--red2);display:inline-flex;align-items:center;gap:.2rem;margin:.1rem;">'
          + '<span>\uD83D\uDD34 ' + u.name + '</span>'
          + '<select style="background:transparent;border:none;color:var(--red2);font-size:.62rem;cursor:pointer;" onchange="moveCombatUnit(' + u.id + ',this.value)">' + zoneOptions + '</select>'
          + '<button style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:0;font-size:.68rem;line-height:1;" onclick="removeCombatUnit(' + u.id + ')">✕</button>'
          + '</div>';
      }).join("");
      return '<div style="border:1px solid ' + info.border + ';background:' + info.color + ';padding:.45rem .55rem;margin-bottom:.3rem;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">'
        + '<div style="font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:' + info.border + ';">' + zone + '</div>'
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
    S.combatMap.units.push({ id: combatMapUnitId++, name: name.trim(), side: side, zone: side === "ally" ? "Nearby" : "Nearby" });
    renderCombatMap();
  }

  function moveCombatUnit(id, zone) {
    var unit = S.combatMap.units.filter(function(u){ return u.id === id; })[0];
    if (unit) { unit.zone = zone; renderCombatMap(); }
  }

  function removeCombatUnit(id) {
    S.combatMap.units = S.combatMap.units.filter(function(u){ return u.id !== id; });
    renderCombatMap();
  }

  function clearCombatMap() {
    ensureNewFeatureState();
    S.combatMap.units = [];
    renderCombatMap();
  }

  // ── SYNC HOOKS ────────────────────────────────────────────────────────────────
  function syncNewFeatureUIs() {
    ensureNewFeatureState();
    mountNewFeaturePanels();
    renderCaravanUI();
    renderHoldingUI();
    renderExtraTraits();
    renderCombatMap();
  }

  document.addEventListener("DOMContentLoaded", function() {
    ensureNewFeatureState();
    mountNewFeaturePanels();
    renderExtraTraits();
    renderCombatMap();
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
      _baseClear();
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
  window.moveVaultItemToBackpack = moveVaultItemToBackpack;
  window.moveBackpackToVault  = moveBackpackToVault;
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

  window.buyItem = function(cost, name, cat) {
    ensureNewFeatureState();
    cat = cat || 'other';

    if (name === 'Retainer Contract') {
      if ((S.credits || 0) < 200) {
        showNotif('Need 200₵ to buy a Retainer Contract!', 'warn'); return;
      }
      S.credits -= 200;
      updateCreditsUI();
      S.holding.retainerContracts = (S.holding.retainerContracts || 0) + 1;
      showNotif('Retainer Contract purchased (−200₵). Use in Holding Council.', 'good');
      if (typeof renderHoldingUI === 'function') { renderHoldingUI(); }
      return;
    }

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
      S.credits   -= cost;
      S.pathTokens = Math.max(0, (S.pathTokens || 0) - 5);
      updateCreditsUI();
      var ptEl = document.getElementById('pathTokensVal');
      if (ptEl) { ptEl.textContent = S.pathTokens; }
      S.augmentations.push(name);
      var augData = (SHOP_DATA.augmentations || []).find(function(a) { return a.name === name; });
      var traitLabel = '\ud83e\uddb6 ' + name + (augData ? ' \u2014 ' + augData.stat : ' \u2014 Augmentation');
      S.extraTraits.push(traitLabel);
      if (typeof renderExtraTraits === 'function') { renderExtraTraits(); }
      renderOSHacksPanel();
      if (typeof renderAugmentationsPanel === 'function') { renderAugmentationsPanel(); }
      // Refresh shop display to show installed status
      var shopCatBtn = document.querySelector('.shop-cats .scat.on');
      if (typeof showShopCat === 'function') { showShopCat('augmentations', shopCatBtn); }
      showNotif('Augmentation installed: ' + name + ' (\u22125 Path Tokens, \u2212' + cost + '\u20b5)', 'good');
      return;
    }

    if (cat === 'os_hacks') {
      if (S.augmentations.indexOf('OPERATING SYSTEM') < 0) {
        showNotif('OPERATING SYSTEM augmentation required to buy Hacks!', 'warn'); return;
      }
      if ((S.credits || 0) < cost) {
        showNotif('Not enough credits!', 'warn'); return;
      }
      S.credits -= cost;
      updateCreditsUI();
      S.ownedHacks.push(name);
      renderOSHacksPanel();
      showNotif('Hack acquired: ' + name + ' (\u2212' + cost + '\u20b5)', 'good');
      return;
    }

    if (cat === 'weapon_mods') {
      if ((S.credits || 0) < cost) {
        showNotif('Not enough credits!', 'warn'); return;
      }
      var available = getAvailableWeaponModSlots();
      if (S.weaponMods.length >= available) {
        showNotif('No mod slots available! Equip a +# weapon first.', 'warn'); return;
      }
      S.credits -= cost;
      updateCreditsUI();
      S.weaponMods.push(name);
      renderWeaponModsPanel();
      showNotif('Weapon Mod acquired: ' + name + ' (\u2212' + cost + '\u20b5)', 'good');
      return;
    }

    // Default purchases: equip weapons/armor when slots are open, else backpack.
    if ((S.credits || 0) < cost) {
      showNotif('Not enough credits!', 'warn'); return;
    }
    var foundItem = null;
    if (typeof findShopItem === 'function') {
      foundItem = findShopItem(name);
    }
    var weaponCats = ['weapons', 'melee_exp', 'ranged_exp'];
    var armorCats  = ['armor', 'armor_exp'];
    var backpackText = name;
    if (foundItem && foundItem.item && foundItem.item.stat && (weaponCats.indexOf(cat) >= 0 || armorCats.indexOf(cat) >= 0)) {
      backpackText = name + ' (' + foundItem.item.stat + ')';
    }

    if (weaponCats.indexOf(cat) >= 0) {
      S.credits -= cost;
      updateCreditsUI();
      if (!S.equipment.weapon1) {
        S.equipment.weapon1 = backpackText;
        setInputValue('eqWeapon1', backpackText);
        showNotif('Bought: ' + name + ' → Equipped to Weapon 1 (−' + cost + '₵)', 'good');
      } else if (!S.equipment.weapon2) {
        S.equipment.weapon2 = backpackText;
        setInputValue('eqWeapon2', backpackText);
        showNotif('Bought: ' + name + ' → Equipped to Weapon 2 (−' + cost + '₵)', 'good');
      } else {
        var wSlot = -1;
        for (var wi = 0; wi < S.backpack.length; wi++) {
          if (!S.backpack[wi]) { wSlot = wi; break; }
        }
        if (wSlot >= 0) {
          S.backpack[wSlot] = backpackText;
          var wEl = document.getElementById('bp' + wSlot);
          if (wEl) { wEl.value = backpackText; }
          showNotif('Bought: ' + name + ' → Backpack Slot ' + (wSlot + 1) + ' (−' + cost + '₵)', 'good');
        } else {
          showNotif('Bought: ' + name + ' (−' + cost + '₵) — Backpack full!', 'warn');
        }
      }
      if (typeof updateAllStatDisplays === 'function') { updateAllStatDisplays(); }
      if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
      return;
    }

    if (armorCats.indexOf(cat) >= 0) {
      S.credits -= cost;
      updateCreditsUI();
      if (!S.equipment.armor) {
        S.equipment.armor = backpackText;
        setInputValue('eqArmor', backpackText);
        showNotif('Bought: ' + name + ' → Equipped to Armor (−' + cost + '₵)', 'good');
      } else {
        var aSlot = -1;
        for (var ai = 0; ai < S.backpack.length; ai++) {
          if (!S.backpack[ai]) { aSlot = ai; break; }
        }
        if (aSlot >= 0) {
          S.backpack[aSlot] = backpackText;
          var aEl = document.getElementById('bp' + aSlot);
          if (aEl) { aEl.value = backpackText; }
          showNotif('Bought: ' + name + ' → Backpack Slot ' + (aSlot + 1) + ' (−' + cost + '₵)', 'good');
        } else {
          showNotif('Bought: ' + name + ' (−' + cost + '₵) — Backpack full!', 'warn');
        }
      }
      if (typeof updateAllStatDisplays === 'function') { updateAllStatDisplays(); }
      if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
      return;
    }

    S.credits -= cost;
    updateCreditsUI();
    var emptyIdx = -1;
    for (var i = 0; i < S.backpack.length; i++) {
      if (!S.backpack[i]) { emptyIdx = i; break; }
    }
    if (emptyIdx >= 0) {
      S.backpack[emptyIdx] = backpackText;
      var bpEl = document.getElementById('bp' + emptyIdx);
      if (bpEl) { bpEl.value = backpackText; }
      showNotif('Bought: ' + name + ' \u2192 Backpack Slot ' + (emptyIdx + 1) + ' (\u2212' + cost + '\u20b5)', 'good');
    } else {
      showNotif('Bought: ' + name + ' (\u2212' + cost + '\u20b5) \u2014 Backpack full! Add manually.', 'warn');
    }
  };

  // ── WEAPON MODS PANEL ─────────────────────────────────────────────────────────
  function renderWeaponModsPanel() {
    var el = document.getElementById('weaponModsDisplay');
    if (!el) { return; }
    ensureNewFeatureState();

    var weaponEntries = [
      { label: 'Slot 1', name: S.equipment.weapon1 || '' },
      { label: 'Slot 2', name: S.equipment.weapon2 || '' }
    ].filter(function(w) { return w.name.trim(); });

    if (!weaponEntries.length) {
      el.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">No weapons equipped.</div>';
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
    if (tmwCost > 0 && (S.tmw || 0) < tmwCost) {
      showNotif('Need ' + tmwCost + ' TMW to cast ' + hackName + '! (have ' + (S.tmw || 0) + ')', 'warn'); return;
    }

    // Deduct TMW (spent to activate)
    if (tmwCost > 0) {
      S.tmw = Math.max(0, (S.tmw || 0) - tmwCost);
      updateTMWPool();
    }

    var dreadDie = S.hackRoller.dreadDie || 6;
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
      effectHtml = '<br><span style="color:var(--teal);">' + hackData.effect() + '</span>';
    }

    // Malware on failure: lose 1 TMW + take d6 Stress + Distracted
    var malwareHtml = '';
    if (!success) {
      var malwareDmg = roll(6);
      S.tmw = Math.max(0, (S.tmw || 0) - 1);
      updateTMWPool();
      changeStress(malwareDmg);
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
