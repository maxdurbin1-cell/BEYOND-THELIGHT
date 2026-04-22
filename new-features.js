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
      crises: [],
      taxLog: []
    }, prevHolding);

    if (!Array.isArray(S.holding.landmarks))      { S.holding.landmarks = []; }
    if (!Array.isArray(S.holding.extraLandmarks)) { S.holding.extraLandmarks = []; }
    if (!Array.isArray(S.holding.crises))         { S.holding.crises = []; }
      if (!Array.isArray(S.holding.vault))          { S.holding.vault = []; }
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
    S.holdingQuest  = S.holdingQuest  || { active: false, step: 0, hexId: null };

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
          + '<div style="margin-bottom:.28rem;"><span class="sub-label">Current Task</span><input type="text" style="width:100%;" value="' + (mem.task || "").replace(/"/g, "&quot;") + '" placeholder="Assigned task\u2026" onchange="updateCouncilMember(\'' + role.key + '\',\'task\',this.value)"></div>'
          + '<div style="display:flex;align-items:center;gap:.4rem;">'
          + '<button class="btn btn-xs btn-teal" onclick="rollCouncilTask(\'' + role.key + '\')">⚄ Roll Task (Ad vs d6)</button>'
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
      if (!h.name) {
        if ((S.renown || 0) < 9) {
          questEl.innerHTML = '<div style="font-size:.75rem;color:var(--muted2);">You need <strong style="color:var(--gold2);">Renown 9</strong> to establish a Holding. Currently: ' + (S.renown || 0) + '</div>';
        } else {
          questEl.innerHTML = '<div style="display:flex;gap:.3rem;align-items:center;">'
            + '<div style="flex:1;font-size:.75rem;color:var(--text2);">You are ready to establish your own Holding!</div>'
            + '<button class="btn btn-sm btn-teal" onclick="startHoldingQuest();">Begin Quest →</button>'
            + '</div>';
        }
      } else if ((S.holdingQuest || {}).active) {
        var q = S.holdingQuest;
        var steps = ['Recruit Followers', 'Scout Location', 'Establish Holding'];
        var progressHtml = '';
        for (var si = 0; si < 3; si++) {
          var isDone = q.step > si;
          var isCurrent = q.step === si;
          progressHtml += '<div style="flex:1;text-align:center;padding:.3rem;background:' + (isDone ? 'var(--green2)' : isCurrent ? 'var(--teal)' : 'var(--surface)') + ';border:1px solid ' + (isDone ? 'rgba(46,196,182,.5)' : isCurrent ? 'var(--teal)' : 'var(--border2)') + ';border-radius:3px;">'
            + '<div style="font-size:.65rem;color:' + (isDone || isCurrent ? 'var(--text)' : 'var(--muted2)') + ';">' + steps[si] + '</div>'
            + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:.9rem;font-weight:700;color:' + (isDone || isCurrent ? 'var(--text)' : 'var(--muted)') + ';">Step ' + (si + 1) + '</div>'
            + '</div>';
        }
        questEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.3rem;margin-bottom:.4rem;">' + progressHtml + '</div>'
          + '<button class="btn btn-sm btn-primary" onclick="advanceHoldingQuest();" style="width:100%;">Advance Quest →</button>';
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
  function startHoldingQuest() {
    ensureNewFeatureState();
    S.holdingQuest = { active: true, step: 0, hexId: null };
    // Switch to Holding tab if not already there
    var holdingTab = document.querySelector('[data-panel="tab-holding"]') || document.querySelector('[onclick*="tab-holding"]');
    if (holdingTab) { holdingTab.click(); }
    renderHoldingUI();
    renderMissionBoard && renderMissionBoard();
    showNotif("Holding Establishment Quest begun!", "good");
  }

  function advanceHoldingQuest() {
    ensureNewFeatureState();
    var q = S.holdingQuest;
    if (!q || !q.active) { return; }
    q.step++;
    if (q.step >= 3) {
      q.active = false;
      // Prompt for holding name if not set
      if (!S.holding.name) {
        rollHoldingName();
        showNotif("Holding established! Name your domain.", "good");
      } else {
        showNotif("Holding established: " + S.holding.name + "!", "good");
      }
    } else {
      var steps = ['Recruit Followers', 'Scout Location', 'Establish Holding'];
      showNotif("Quest advanced → " + steps[q.step], "good");
    }
    renderHoldingUI();
    if (typeof renderMissionBoard === "function") { renderMissionBoard(); }
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

  function rollCouncilTask(role) {
    var advDie = (S.stats && S.stats.adventure) || 4;
    var a = explodingRoll(advDie);
    var d = explodingRoll(6);
    var success = a.total >= d.total;
    var el = document.getElementById("councilResult-" + role);
    if (el) {
      el.innerHTML = '<span style="color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">'
        + a.total + ' vs ' + d.total + ' \u2014 ' + (success ? '\u2713 Success' : '\u2717 Failed') + '</span>';
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
    var events = type === "commoner" ? COURT_COMMONER_TASKS : COURT_ACOLYTE_TASKS;
    var event = pick(events);
    var borderColor = type === "commoner" ? "var(--teal)" : "var(--purple)";
    var labelColor  = type === "commoner" ? "var(--teal)" : "var(--purple)";
    var label = type === "commoner" ? "\uD83D\uDC65 Commoner Petition" : "\uD83D\uDCFF Acolyte Decree";
    el.innerHTML = '<div style="background:var(--surface);border-left:2px solid ' + borderColor + ';padding:.5rem .65rem;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.56rem;letter-spacing:.12em;color:' + labelColor + ';text-transform:uppercase;margin-bottom:.18rem;">' + label + '</div>'
      + '<div style="font-size:.83rem;color:var(--text2);line-height:1.6;">' + event + '</div>'
      + '<div style="margin-top:.4rem;"><button class="btn btn-xs btn-primary" onclick="generateCourtTask()">⚄ Generate Task</button></div>'
      + '<div id="courtTaskResult" style="margin-top:.3rem;font-size:.8rem;color:var(--gold2);"></div>'
      + '</div>';
  }

  function generateCourtTask() {
    var task = pick(TASK_VERBS) + " " + pick(TASK_TARGETS) + ", " + (roll(4) + 1) + " hexes " + pick(TASK_DIRS) + ".";
    var el = document.getElementById("courtTaskResult");
    if (el) { el.textContent = "Task: " + task; }
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

    // Default: all other items → Backpack
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
