(function () {
  const LAST_SEA_COLS = 12;
  const LAST_SEA_ROWS = 12;
  const LAST_SEA_HEX = 28;
  const NAVAL_ZONES = ["Engaged", "Close", "Nearby", "Far"];

  const LAST_SEA_TERRAINS = [
    {
      name: "Grassland",
      color: "#486734",
      coast: [
        "Low grass sweeps down to a bright salt shore.",
        "The coast opens into rolling green ground cut by old stone walls.",
        "Gentle land rises above the tide line in broad sunlit bands.",
        "Reclaimed farmland runs to the shore; rusted irrigation pipes protrude from the bluff.",
        "Coastal meadow, the grass unusually tall, hiding old survey stakes and boundary markers.",
        "The shoreline is a tangle of sea-grass and wind-turbine foundations, half-buried by drift sand.",
        "Agriculture domes, some cracked, some intact, hug the tideline. A crop of something green glows through the translucent panels at night."
      ]
    },
    {
      name: "Jungle",
      color: "#1f5c38",
      coast: [
        "Dense jungle presses almost into the surf.",
        "Vines hang over black sand and the air is wet with heat.",
        "Palm trunks and tangled roots crowd the shallows.",
        "The jungle has swallowed a port district; loading cranes stand in the surf like rusted herons.",
        "Bioluminescent canopy edges the shore. The light pulsing below the waterline suggests the phenomenon continues underwater.",
        "A processing facility, long-abandoned, disappears into the treeline. Its waste pipes still drain into the bay.",
        "Irradiated jungle — the leaves are enormous, the colors wrong, the animals unrecognizable. The shore itself steams slightly."
      ]
    },
    {
      name: "Forest",
      color: "#294a31",
      coast: [
        "Dark forest edges the shore in a wall of cedar and fern.",
        "Pine-shadowed bluffs rise above cold water.",
        "Tall trees lean over a pebbled strand full of driftwood.",
        "A logging road leads from the shore into the dark. The machinery is still here. No one is.",
        "The forest grows to the cliff edge and over it. Root systems hold the bluff, for now.",
        "Fog clings to the forest line. The trees are enormous, old-growth, their trunks wrapped in what appears to be communications cable.",
        "A research outpost in the tree canopy, its observation platform overlooking the sea. No one answers the radio."
      ]
    },
    {
      name: "Desert",
      color: "#7d6a2c",
      coast: [
        "Golden dunes tumble straight into the sea.",
        "Dry salt flats glitter behind the beach.",
        "Wind-carved stone and hard sand stretch inland from the shore.",
        "A solar array, partially buried, lines the coastal ridge. Some panels still track the sun.",
        "The desert comes to a sudden hard edge at the waterline — as if cut by something. The contrast is disorienting.",
        "Old pipeline infrastructure runs parallel to the shore. It carried water, once. Now it carries sand.",
        "Ruins of a desalination plant, its intake pipes destroyed, its processing chambers intact. Someone could restart it."
      ]
    },
    {
      name: "Mountainous",
      color: "#5a5661",
      coast: [
        "Cliffs rise almost vertically from the breakers.",
        "Jagged stone shelves force the sea into white spray.",
        "A steep volcanic spine dominates the island.",
        "Mining terrace scars the cliffside from waterline to summit. The ore lifts are frozen in position.",
        "Basalt columns, natural but impossibly regular, line the shore like a circuit board writ large.",
        "Geothermal vents in the shallows boil the surf. The rock above them is warm. The structures built on them are rust-eaten but standing.",
        "A missile silo, decommissioned, its blast doors open to the sea air. Something is nesting inside."
      ]
    }
  ];

  const LAST_SEA_ECOLOGY = [
    "Overgrown",
    "Decaying",
    "Floating Spores",
    "Scorched",
    "Sweet Fruits",
    "Unnaturally large fungi",
    "Surprisingly large animals wander",
    "Crops overrun by pests",
    "Hallucinogenic herbs",
    "Floating rocks"
  ];

  const LAST_SEA_WEATHER = {
    spring: [
      { label: "Salt Mist", rough: false, desc: "A cool marine haze softens the horizon but leaves the water workable." },
      { label: "Silver Rain", rough: false, desc: "Fine rain moves in sheets across open water. Visibility dips, but the sea stays even." },
      { label: "Crosswind Squall", rough: true, desc: "Short violent gusts kick the waves sideways and fight the helm." },
      { label: "Clear Current", rough: false, desc: "Cold bright light and a steady current make for excellent sailing." },
      { label: "Bloom Tide", rough: false, desc: "Pollen and sea-glow drift over the surface in strange pastel bands." },
      { label: "Stormfront", rough: true, desc: "Dark clouds stack low over the sea and every sail strains under the pressure." },
      { label: "Acid Fog", rough: true, desc: "A chemical haze drifts from the industrial coasts. Metal corrodes faster in this. Filter your breathing." },
      { label: "Neon Haze", rough: false, desc: "Refraction from surface pollutants creates low-lying light columns. Navigation is possible. Strange, but possible." },
      { label: "EMP Weather", rough: true, desc: "Ionized air interferes with electronic navigation. Run manual. Get where you are going before sundown." }
    ],
    harvest: [
      { label: "Golden Wind", rough: false, desc: "Warm dry winds fill every sail and push ships forward cleanly." },
      { label: "Fog Bank", rough: true, desc: "A wall of fog rolls over the water and swallows every landmark." },
      { label: "Boiling Heat", rough: false, desc: "The day is punishingly bright and the decks burn underfoot." },
      { label: "Ash Shower", rough: false, desc: "Soft black flakes drift from somewhere beyond the horizon." },
      { label: "Typhoon Edge", rough: true, desc: "You catch only the outer rim of a greater storm, but it is enough to batter the hull." },
      { label: "Trade Breeze", rough: false, desc: "Ideal winds and long gentle swells carry the ship with almost no resistance." },
      { label: "Bioluminescent Tide", rough: false, desc: "The wake glows blue-green. Navigation by compass is unreliable but the water is calm and the sight is extraordinary." },
      { label: "Thermal Inversion", rough: true, desc: "Heat layers trap exhaust near the surface. Visibility is poor, the air acrid, and the sea deceptively calm." },
      { label: "Static Surge", rough: false, desc: "Ball lightning rolls across the surface. Engines glow faintly blue. Nobody can explain it. Everything still works." }
    ],
    winter: [
      { label: "Ice Rain", rough: true, desc: "Freezing spray hardens on rope, rail, and skin." },
      { label: "Still Black Water", rough: false, desc: "The sea goes unnaturally calm and sound carries far." },
      { label: "Needle Wind", rough: true, desc: "Sharp bitter winds slice across the deck and shove the ship off line." },
      { label: "Grey Overcast", rough: false, desc: "A dim winter ceiling hangs low but leaves the route passable." },
      { label: "Moonlit Cold", rough: false, desc: "The night is frigid and clear. Every wave flashes silver." },
      { label: "Breaker Storm", rough: true, desc: "Hard waves hammer the hull in heavy repeating walls." },
      { label: "Drift Protocol", rough: false, desc: "Old automated distress signals activate in the cold, their source unknown. They are years old. Something adrift is still broadcasting." },
      { label: "Ice Channel", rough: false, desc: "Floating ice forms a navigable lane between drifts. The silence here is absolute. Move quietly." },
      { label: "Blood Sleet", rough: true, desc: "Red-tinged precipitation from an unknown source. It stains sails and exposed skin. Navigation is unaffected. Morale is not." }
    ]
  };

  const OPEN_SEA_PERILS = ["Whirlpool", "Fogged Tsunami", "Maelstrom", "Typhoon", "Cyclone"];
  const ISLAND_PERILS = ["Fog", "Earthquake", "Quicksand", "Flood", "Rockslide", "Storm", "Forest Fire", "Chasm"];
  const ARMADA_ACTIONS = ["Investigate", "Capture", "Hunt", "Transport", "Destroy", "Aid", "Guard"];
  const ARMADA_TARGETS = ["Pirate", "Beast", "Ruler", "Island", "Treasure", "Landmark", "Settlement"];

  const NAVAL_SHIPS = [
    { name: "Skiff", cost: 2500, defend: 4, strike: null, shoot: null, feature: "Swift Escape - +1 to Control rolls." },
    { name: "Transport", cost: 5500, defend: 6, strike: null, shoot: null, feature: "Cargo Hold - additional storage and crew space." },
    { name: "Frigate", cost: 10000, defend: 8, strike: 6, shoot: 6, feature: "Nimble - +1 action during naval combat." },
    { name: "Cruiser", cost: 15000, defend: 10, strike: 8, shoot: 8, feature: "Warship - built for sustained fighting." },
    { name: "Battleship", cost: 30000, defend: 12, strike: 10, shoot: 10, feature: "Armored Fortress - +1 to defensive checks." },
    { name: "Carrier", cost: 50000, defend: 20, strike: 12, shoot: 12, feature: "Command Authority - +1 to Lead checks." }
  ];

  const NAVAL_UPGRADES = [
    {
      id: "installed-weapons",
      name: "Installed Weapons",
      classes: ["Skiff", "Transport"],
      cost: 500,
      pathCost: 5,
      effect: "Ship gains Strike d4 and Shoot d4."
    },
    {
      id: "improved-navigation",
      name: "Improved Navigation",
      classes: ["Transport", "Frigate"],
      cost: 1000,
      pathCost: 10,
      effect: "Navigator gets +2 on range and maneuver checks."
    },
    {
      id: "improved-combat",
      name: "Improved Combat",
      classes: ["Frigate"],
      cost: 1500,
      pathCost: 15,
      effect: "Raise both Strike and Shoot to at least d8."
    },
    {
      id: "improved-defenses",
      name: "Improved Defenses",
      classes: ["Cruiser"],
      cost: 2000,
      pathCost: 20,
      effect: "Step the ship Hull / Defend die up once."
    },
    {
      id: "captains-hq",
      name: "Captain's HQ",
      classes: ["Carrier"],
      cost: 5000,
      pathCost: 25,
      effect: "Ship grants +1 Lead and +1 extra action."
    }
  ];

  const NAVAL_RANKS = [
    { name: "Rookie", train: 0, baseCost: 1000 },
    { name: "Experienced", train: 5, baseCost: 2000 },
    { name: "Veteran", train: 10, baseCost: 4000 },
    { name: "Elite", train: 15, baseCost: 8000 }
  ];

  const NAVAL_ROLE_META = {
    Gunner: {
      pair: "Strike / Shoot",
      summary: "Runs short-barrel cannons at Close range and crossbows at Nearby range."
    },
    Navigator: {
      pair: "Control / Mind",
      summary: "Moves between zones, threads hazards, and reads the sea."
    },
    Engineer: {
      pair: "Body / Defend",
      summary: "Repairs the ship, braces the hull, and handles incoming punishment."
    },
    Captain: {
      pair: "Lead / Spirit",
      summary: "Drives morale, tactics, diplomacy, and command under pressure."
    }
  };

  const NAVAL_ROLE_COSTS = {
    Rookie: { Gunner: 0, Navigator: 0, Engineer: 0, Captain: 0 },
    Experienced: { Gunner: 1000, Navigator: 1200, Engineer: 1400, Captain: 1600 },
    Veteran: { Gunner: 1800, Navigator: 2000, Engineer: 2200, Captain: 2400 },
    Elite: { Gunner: 2600, Navigator: 2800, Engineer: 3000, Captain: 3200 }
  };

  const NAVAL_ABILITIES = {
    Gunner: {
      Experienced: ["Trick Shot - reroll 1s on a Strike or Shoot roll once per combat."],
      Veteran: [
        "Ace Gunner - reroll one failed Strike or Shoot roll once per combat.",
        "Barrage Fire - grant Bolstered once per combat."
      ],
      Elite: ["Precision Shot - inflict one negative condition on an enemy ship once per combat."]
    },
    Navigator: {
      Experienced: ["Stellar Cartographer - reroll 1s on a Control or Mind check once per combat."],
      Veteran: [
        "Master Navigator - reroll one failed Control or Mind check once per combat.",
        "Warp Specialist - your ship can travel farther in a day phase."
      ],
      Elite: ["Evasive Manoeuvres - negate one enemy attack roll once per combat."]
    },
    Engineer: {
      Experienced: ["Rapid Repair - reroll 1s on a Body check once per combat."],
      Veteran: [
        "Master Engineer - reroll one failed Body check once per combat.",
        "Overclock - grant Protected once per combat."
      ],
      Elite: ["Crisis Management - grant Empowered once per combat."]
    },
    Captain: {
      Experienced: ["Inspiring Speech - reroll 1s on a Lead or Spirit check once per combat."],
      Veteran: [
        "Master Tactician - reroll one failed Lead or Spirit check once per combat.",
        "Charismatic Leader - grant Focused once per combat."
      ],
      Elite: ["Master Strategist - grant +2 actions during naval combat."]
    }
  };

  const SHIP_NAME_FIRST = [
    "Crimson", "Rust", "Raider", "Seer", "Leviathan", "Rebel", "Silver", "Cinder", "Phantom", "Whisper",
    "Solar", "Tempest", "Horizon", "Storm", "Marrow", "Black", "Night", "Star", "Ghost", "Sable"
  ];
  const SHIP_NAME_LAST = [
    "Rest", "Nomad", "Solar", "Wanderer", "Gale", "Drifter", "Surveyor", "Marauder", "Ghost", "Storm",
    "Harbinger", "Sentinel", "Crown", "Serpent", "Whale", "Runner", "Dawn", "Siren", "Star", "Revenant"
  ];
  const SHIP_LOOKS = [
    "Solar sails, patched hull, a relic reborn for the open sea.",
    "Rusted metal and jury-rigged propulsion, a survivor's refuge afloat.",
    "Hydrofoil lines and algae-fuel engines make it sleek and quiet.",
    "A low predatory profile with periscope eyes and a hunting prow.",
    "Twin catamaran hulls and wind turbines built for speed.",
    "An icebreaker nose and reinforced stem for brutal crossings.",
    "Salvaged tech and mismatched plates, ugly but reliable.",
    "Matte-black plating and ghostlike trim that vanish at dusk.",
    "Bioluminescent growth clings to the keel and glows at night.",
    "Kinetic mirrored sails flash with every shift in the wind.",
    "A floating greenhouse deck makes the whole vessel feel alive.",
    "Amphibious landing legs let it crawl onto shore when needed.",
    "Drone racks hang along the spine like metallic gulls.",
    "A magnet-skimming hull barely seems to touch the water.",
    "Self-healing seams knit small damage closed over time.",
    "No captain's wheel - the ship feels eerily sentient.",
    "Forged from battlefield salvage and obviously built for war.",
    "Inflatable camouflage bladders make it resemble a small island.",
    "Harpoon rigs and solar fins mark it as a hunter of monsters.",
    "An antique long hull rides high and somehow never seems to sink."
  ];

  const GAMBLING_LEVELS = [
    { level: 1, label: "Easy", die: 20, buyIn: 10 },
    { level: 2, label: "Steady", die: 12, buyIn: 20 },
    { level: 3, label: "Risky", die: 10, buyIn: 30 },
    { level: 4, label: "Sharp", die: 8, buyIn: 40 },
    { level: 5, label: "Dangerous", die: 6, buyIn: 50 },
    { level: 6, label: "Hard", die: 4, buyIn: 60 }
  ];

  function ensureExpansionState() {
    if (typeof S === "undefined") {
      return;
    }

    S.lastSea = {
      layout: "random",
      map: [],
      islands: [],
      notes: {},
      selectedKey: null,
      weather: null,
      ...(S.lastSea || {})
    };
    S.lastSea.map = Array.isArray(S.lastSea.map) ? S.lastSea.map : [];
    S.lastSea.islands = Array.isArray(S.lastSea.islands) ? S.lastSea.islands : [];
    S.lastSea.notes = { ...(S.lastSea.notes || {}) };

    S.naval = {
      ship: null,
      crew: [],
      selectedClass: "Skiff",
      pendingName: "",
      pendingLook: "",
      enemyClass: "Frigate",
      enemyShip: null,
      zone: "Close",
      round: 1,
      log: [],
      tacticsBonus: 0,
      powerShift: null,
      combatActive: false,
      crewTrauma: 0,
      ...(S.naval || {})
    };
    S.naval.crew = Array.isArray(S.naval.crew) ? S.naval.crew : [];
    S.naval.log = Array.isArray(S.naval.log) ? S.naval.log : [];

    S.gambling = {
      difficulty: 1,
      guess: "under",
      history: [],
      lastResult: null,
      ...(S.gambling || {})
    };
    S.gambling.history = Array.isArray(S.gambling.history) ? S.gambling.history : [];
  }

  function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function mountExpansionPanels() {
    const lastSeaPanel = document.getElementById("tab-lastsea");
    if (lastSeaPanel && !lastSeaPanel.dataset.mounted) {
      lastSeaPanel.dataset.mounted = "1";
      lastSeaPanel.innerHTML = `
        <div class="sea-control-bar">
          <div class="season-btn ${S.currentSeason === "spring" ? "on" : ""}" onclick="setLastSeaSeason('spring',this)">Spring</div>
          <div class="season-btn ${S.currentSeason === "harvest" ? "on" : ""}" onclick="setLastSeaSeason('harvest',this)">Harvest</div>
          <div class="season-btn ${S.currentSeason === "winter" ? "on" : ""}" onclick="setLastSeaSeason('winter',this)">Winter</div>
          <span style="color:var(--muted);font-size:.6rem;margin:0 .3rem;">|</span>
          <select id="lastSeaLayoutSelect" onchange="S.lastSea.layout=this.value">
            <option value="random">Random Generator</option>
            <option value="tiny">3 Hexes - 1 Day</option>
            <option value="broad">9 Hexes - 3 Days</option>
            <option value="archipelago">3x 6 Hexes - 2 Days Each</option>
          </select>
          <button class="btn btn-primary" onclick="generateLastSea()">Chart Last Sea</button>
          <button class="btn" onclick="clearLastSea()">Clear</button>
          <span id="lastSeaCoords" style="font-family:'Rajdhani',sans-serif;font-size:.78rem;color:var(--muted2);margin-left:.4rem;"></span>
        </div>
        <div class="sea-summary">
          <div class="info-cell"><span class="ic-label">Open Sea</span>Shift in Weather, Open Sea Encounter, Peril, or Uneventful Sailing.</div>
          <div class="info-cell"><span class="ic-label">Island Travel</span>Land Encounter, Peril, Exhaustion, Shift in Weather, or Uneventful travel.</div>
          <div class="info-cell"><span class="ic-label">Sea Peril</span>Control vs DD6 or take the difference in Stress.</div>
          <div class="info-cell"><span class="ic-label">Island Peril</span>Lead vs DD6 or take the difference in Stress.</div>
        </div>
        <div class="sea-legend">
          <div class="sea-item"><div class="sea-dot" style="background:#103247;border-color:#2ec4b6;"></div>Open Sea</div>
          <div class="sea-item"><div class="sea-dot" style="background:#486734;"></div>Island</div>
          <div class="sea-item"><div class="sea-dot" style="background:#6a5800;border-color:#e8c050;"></div>Landmark</div>
          <div class="sea-item"><div class="sea-dot" style="background:#7a4020;border-color:#f0a840;"></div>Settlement</div>
          <div class="sea-item"><div class="sea-dot" style="background:#403830;border-color:#a09870;"></div>Dungeon</div>
        </div>
        <div class="sea-group-list" id="lastSeaIslandGroups"></div>
        <div class="sea-layout">
          <div class="sea-scroll">
            <svg id="lastSeaSvg" width="620" height="560" xmlns="http://www.w3.org/2000/svg">
              <text x="310" y="270" text-anchor="middle" font-family="Cinzel,serif" font-size="13" fill="#254454">Generate the Last Sea to begin</text>
              <text x="310" y="294" text-anchor="middle" font-family="Cinzel,serif" font-size="10" fill="#1a2c38">Every hex carries a description and an exploration roll.</text>
            </svg>
          </div>
          <div class="sea-info" id="lastSeaInfo"></div>
        </div>
      `;
    }

    const navalPanel = document.getElementById("tab-naval");
    if (navalPanel && !navalPanel.dataset.mounted) {
      navalPanel.dataset.mounted = "1";
      navalPanel.innerHTML = `
        <div class="ship-banner">
          <h3>Naval System</h3>
          <p>Buy a ship, hire and train crew, then run ship combat with captain, gunner, navigator, and engineer actions. Hull Stress is always twice the ship's current Defend die.</p>
        </div>
        <div class="sea-summary">
              <div class="info-cell"><span class="ic-label">Credits</span><span id="navalCredits">0 ₵</span></div>
          <div class="info-cell"><span class="ic-label">Path Tokens</span><span id="navalPathTokens">0</span></div>
          <div class="info-cell"><span class="ic-label">Crew Trauma</span><span id="navalCrewTrauma">0</span></div>
          <div class="info-cell"><span class="ic-label">Zone</span><span id="navalZoneReadout">Close</span></div>
        </div>
        <div class="naval-grid">
          <div class="card">
            <div class="section-title">Shipyard</div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.65rem;">
              <button class="btn btn-primary" onclick="generateShipIdentity()">Roll Ship Identity</button>
              <button class="btn" onclick="repairPlayerShipToFull()">Full Drydock Repair</button>
            </div>
            <div id="navalShipSummary" class="combat-card" style="margin-bottom:.65rem;"></div>
            <div class="ship-class-grid" id="navalShipGrid"></div>
            <div class="section-title" style="margin-top:.75rem;">Upgrades</div>
            <div class="ship-upgrades" id="navalUpgradeList"></div>
          </div>
          <div class="card">
            <div class="section-title">Hire Crew</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-bottom:.55rem;">
              <div><span class="sub-label">Role</span><select id="navalCrewRole"><option>Captain</option><option>Gunner</option><option>Navigator</option><option>Engineer</option></select></div>
              <div><span class="sub-label">Rank</span><select id="navalCrewRank"><option>Rookie</option><option>Experienced</option><option>Veteran</option><option>Elite</option></select></div>
            </div>
            <div class="form-row"><span class="sub-label">Name</span><input type="text" id="navalCrewName" placeholder="Crew member name"></div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.7rem;">
              <button class="btn btn-primary" onclick="hireNavalCrew()">Hire Crew</button>
              <button class="btn" onclick="rollCrewName()">Roll Name</button>
            </div>
            <div class="sea-summary" style="margin-bottom:.65rem;">
              ${Object.entries(NAVAL_ROLE_META).map(([role, meta]) => `
                <div class="info-cell">
                  <span class="ic-label">${role}</span>
                  <strong style="color:var(--gold2);">${meta.pair}</strong><br>${meta.summary}
                </div>
              `).join("")}
            </div>
            <div class="crew-roster" id="navalCrewRoster"></div>
          </div>
          <div class="card">
            <div class="section-title">Ship Combat</div>
            <div style="display:grid;grid-template-columns:1fr auto;gap:.45rem;align-items:end;margin-bottom:.55rem;">
              <div>
                <span class="sub-label">Enemy Ship</span>
                <select id="navalEnemyClass" onchange="S.naval.enemyClass=this.value">${NAVAL_SHIPS.map(ship => `<option${ship.name === S.naval.enemyClass ? " selected" : ""}>${ship.name}</option>`).join("")}</select>
              </div>
              <button class="btn btn-primary" onclick="spawnEnemyShip()">Spawn Enemy</button>
            </div>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.55rem;">
              <button class="btn btn-sm btn-teal" onclick="startNavalCombat()">Start / Reset Combat</button>
              <button class="btn btn-sm" onclick="nextNavalRound()">Next Round</button>
              <button class="btn btn-sm btn-red" onclick="clearNavalLog()">Clear Log</button>
            </div>
            <div class="zone-track" id="navalZoneTrack" style="margin-bottom:.55rem;"></div>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.65rem;">
              <button class="btn btn-sm" onclick="adjustNavalZone(-1)">Move Closer</button>
              <button class="btn btn-sm" onclick="adjustNavalZone(1)">Move Wider</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-bottom:.65rem;">
              <div>
                <span class="sub-label">Divert From</span>
                <select id="navalPowerFrom"><option value="shoot">Shoot</option><option value="strike">Strike</option><option value="hull">Defend</option></select>
              </div>
              <div>
                <span class="sub-label">Divert To</span>
                <select id="navalPowerTo"><option value="hull">Defend</option><option value="strike">Strike</option><option value="shoot">Shoot</option></select>
              </div>
            </div>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.7rem;">
              <button class="btn btn-sm btn-primary" onclick="applyPowerShift()">Divert Power</button>
              <button class="btn btn-sm" onclick="clearPowerShift()">Clear Shift</button>
            </div>
            <div id="navalCombatSummary"></div>
            <div class="combat-actions" style="margin:.75rem 0;">
              <button class="btn btn-primary" onclick="navalAttack('strike')">Fire Cannons</button>
              <button class="btn btn-primary" onclick="navalAttack('shoot')">Loose Crossbows</button>
              <button class="btn btn-teal" onclick="navalRepair()">Engineer Repair</button>
              <button class="btn" onclick="navalTactics()">Captain Tactics</button>
              <button class="btn" onclick="navalMorale()">Captain Morale</button>
              <button class="btn" onclick="navalSurvey()">Navigator Survey</button>
              <button class="btn" onclick="enemyNavalAttack()">Enemy Attack</button>
              <button class="btn btn-red" onclick="wreckEnemyShip()">Wreck Enemy</button>
            </div>
            <div class="combat-log" id="navalCombatLog"></div>
          </div>
        </div>
      `;
    }

    const gamblingPanel = document.getElementById("tab-gambling");
    if (gamblingPanel && !gamblingPanel.dataset.mounted) {
      gamblingPanel.dataset.mounted = "1";
      gamblingPanel.innerHTML = `
        <div class="gambling-grid">
          <div class="card">
            <div class="section-title">Gambling Den</div>
            <div style="font-size:.85rem;color:var(--muted3);line-height:1.65;">
              Choose a difficulty, pay the buy-in, roll two Dread dice from low to high, then guess whether your Adventure Die lands <strong style="color:var(--gold2);">under</strong>, <strong style="color:var(--gold2);">middle</strong>, or <strong style="color:var(--gold2);">over</strong>.<br><br>
              If the Adventure Die matches the lower or upper Dread die exactly, that still counts as <strong style="color:var(--gold2);">middle</strong>.
            </div>
            <div class="sea-summary" style="margin-top:.65rem;">
              <div class="info-cell"><span class="ic-label">Credits</span><span id="gamblingCredits">0 ₵</span></div>
              <div class="info-cell"><span class="ic-label">Buy In</span><span id="gamblingBuyIn">10 ₵</span></div>
              <div class="info-cell"><span class="ic-label">Difficulty</span><span id="gamblingDifficultyReadout">Level 1 - Easy</span></div>
              <div class="info-cell"><span class="ic-label">Die</span><span id="gamblingDieReadout">d20</span></div>
            </div>
            <div class="difficulty-grid" id="gamblingDifficultyGrid"></div>
            <div class="sub-label" style="margin-top:.8rem;">Guess The Adventure Die</div>
            <div class="guess-grid">
              <button class="guess-btn" id="guess-under" onclick="setGamblingGuess('under')">Under</button>
              <button class="guess-btn" id="guess-middle" onclick="setGamblingGuess('middle')">Middle</button>
              <button class="guess-btn" id="guess-over" onclick="setGamblingGuess('over')">Over</button>
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="playGamblingRound()">Play Hand</button>
              <button class="btn" onclick="clearGamblingHistory()">Clear Ledger</button>
            </div>
            <div class="gamble-rolls">
              <div class="gamble-die"><div class="gd-label">Dread One</div><div class="gd-value" id="gambleDieOne">-</div></div>
              <div class="gamble-die"><div class="gd-label">Adventure</div><div class="gd-value" id="gambleAdventure">-</div></div>
              <div class="gamble-die"><div class="gd-label">Dread Two</div><div class="gd-value" id="gambleDieTwo">-</div></div>
            </div>
            <div id="gamblingOutcome" class="gamble-outcome" style="margin-top:.75rem;">
              Pick a difficulty and a guess, then let the house roll.
            </div>
          </div>
          <div class="card">
            <div class="section-title">House Ledger</div>
            <div style="font-size:.84rem;color:var(--muted3);line-height:1.6;margin-bottom:.55rem;">
              Payout equals the difficulty level times 10 Credits. Failure loses the buy-in.
            </div>
            <div class="gamble-history" id="gamblingHistory"></div>
          </div>
        </div>
      `;
    }
  }

  function appendRuleCards() {
    const rulesGrid = document.querySelector("#tab-rules > div");
    if (!rulesGrid || document.getElementById("lastSeaRulesCard")) {
      return;
    }

    rulesGrid.insertAdjacentHTML(
      "beforeend",
      `
        <div class="card" id="lastSeaRulesCard">
          <div class="section-title">Last Sea</div>
          <div style="font-size:.85rem;color:var(--muted3);line-height:1.7;">
            <strong style="color:var(--text);">Open Sea:</strong> Shift in Weather, Open Sea Encounter, Peril, or Uneventful Sailing.<br>
            <strong style="color:var(--text);">Sea Peril:</strong> Control vs DD6 or take the difference in Stress.<br>
            <strong style="color:var(--text);">Island Travel:</strong> Land Encounter, Peril, Exhaustion, Shift in Weather, or Uneventful travel.<br>
            <strong style="color:var(--text);">Island Peril:</strong> Lead vs DD6 or take the difference in Stress.
          </div>
        </div>
        <div class="card">
          <div class="section-title">Naval Combat</div>
          <div style="font-size:.85rem;color:var(--muted3);line-height:1.7;">
            <strong style="color:var(--text);">Hull Stress:</strong> equal to 2x current Defend die.<br>
            <strong style="color:var(--text);">Cannons:</strong> Strike at Close. <strong style="color:var(--text);">Crossbows:</strong> Shoot at Nearby.<br>
            <strong style="color:var(--text);">Hull Break:</strong> when Stress breaks the threshold, step Defend down and the crew take +1 Trauma.<br>
            <strong style="color:var(--text);">Wrecked:</strong> if a d4 hull breaks again, the ship is out of action.
          </div>
        </div>
        <div class="card">
          <div class="section-title">Gambling Den</div>
          <div style="font-size:.85rem;color:var(--muted3);line-height:1.7;">
            Buy in from <strong style="color:var(--text);">10 to 60 Credits</strong> based on difficulty.<br>
            Roll <strong style="color:var(--text);">2 Dread dice</strong>, order them low to high, then guess whether the Adventure Die lands under, middle, or over.<br>
            Matching either Dread die counts as <strong style="color:var(--gold2);">middle</strong>.<br>
            A win pays <strong style="color:var(--green2);">difficulty level x 10 Credits</strong>.
          </div>
        </div>
      `
    );
  }

  function getLastSeaLayout() {
    const mode = S.lastSea.layout || "random";
    if (mode === "tiny") {
      return [{ hexes: 3, days: 1, river: false }];
    }
    if (mode === "broad") {
      return [{ hexes: 9, days: 3, river: false }];
    }
    if (mode === "archipelago") {
      return [
        { hexes: 6, days: 2, river: true },
        { hexes: 6, days: 2, river: true },
        { hexes: 6, days: 2, river: true }
      ];
    }
    return pick([
      [{ hexes: 3, days: 1, river: false }],
      [{ hexes: 9, days: 3, river: false }],
      [
        { hexes: 6, days: 2, river: true },
        { hexes: 6, days: 2, river: true },
        { hexes: 6, days: 2, river: true }
      ]
    ]);
  }

  function seaNeighborCoords(col, row) {
    const even = col % 2 === 0;
    const deltas = even
      ? [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]]
      : [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    return deltas
      .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
      .filter((item) => item.col >= 0 && item.col < LAST_SEA_COLS && item.row >= 0 && item.row < LAST_SEA_ROWS);
  }

  function seaKey(col, row) {
    return `${col},${row}`;
  }

  function getSeaCell(col, row) {
    return S.lastSea.map.find((hex) => hex.col === col && hex.row === row);
  }

  function describeSeaHex() {
    return `${pick([
      "Deep blue water folds in long glassy swells.",
      "Dark open water shivers with crosscurrents.",
      "Foam-crowned waves roll under a wind-cut sky.",
      "The sea here is iron-grey and strangely cold."
    ])} ${pick([
      "Wreckage drifts somewhere beyond sight.",
      "A lone bird wheels overhead and then vanishes inland.",
      "The horizon looks too wide, as if the world has thinned.",
      "Salt hangs in the air like old memory."
    ])}`;
  }

  function describeIslandHex(terrain, ecology, siteType) {
    const siteNote =
      siteType === "landmark"
        ? "Something ceremonial stands inland."
        : siteType === "settlement"
          ? "Smoke, sound, or tool-work suggests habitation."
          : siteType === "dungeon"
            ? "Broken stone and shadow hint at buried chambers."
            : "The shoreline looks mostly untouched.";
    return `${pick(terrain.coast)} Ecology: ${ecology}. ${siteNote}`;
  }

  function rollLastSeaWeather() {
    const season = S.currentSeason || "spring";
    return { ...pick(LAST_SEA_WEATHER[season]) };
  }

  function makeSettlementData() {
    return {
      name: `${pick(SETTLEMENT_STYLES)} ${pick(SETTLEMENT_FEATURES)}`,
      lord: pick(HOLDING_LORDS),
      mood: pick(LOCAL_MOODS),
      style: pick(SETTLEMENT_STYLES),
      feature: pick(SETTLEMENT_FEATURES),
      cultural: pick(SETTLEMENT_CULTURAL),
      food: pick(SETTLEMENT_FOOD),
      goods: pick(SETTLEMENT_GOODS),
      news: pick(SETTLEMENT_NEWS)
    };
  }

  function makeLandmarkData() {
    return {
      name: pick(MONUMENT_FORMS),
      effect: pick(MONUMENT_EFFECTS),
      detail: pick([
        "Sea birds nest in its highest cracks.",
        "The stone hums softly whenever the tide rises.",
        "Old offerings still lie untouched around the base.",
        "Its shadow falls in the wrong direction at dusk."
      ])
    };
  }

  function makeDungeonData() {
    return {
      name: pick(["Flooded Vault", "Salt Ruin", "Coral Shrine", "Sunken Watchpost", "Storm Crypt", "Sea Cistern"]),
      builder: pick(RUIN_BUILDERS),
      builtFor: pick(RUIN_BUILT_FOR),
      novelty: pick(RUIN_NOVELTIES),
      construction: pick(RUIN_CONSTRUCTIONS),
      entrance: pick(RUIN_ENTRANCES),
      rooms: roll(4) + 2
    };
  }

  function createSeaSite(type) {
    if (type === "settlement") {
      return makeSettlementData();
    }
    if (type === "landmark") {
      return makeLandmarkData();
    }
    return makeDungeonData();
  }

  function createSeaCluster(hexCount, islandIndex) {
    for (let attempt = 0; attempt < 140; attempt += 1) {
      const startCol = roll(LAST_SEA_COLS - 2);
      const startRow = roll(LAST_SEA_ROWS - 2);
      const cluster = [seaKey(startCol, startRow)];
      const frontier = [seaKey(startCol, startRow)];

      while (cluster.length < hexCount && frontier.length) {
        const current = pick(frontier);
        const [col, row] = current.split(",").map(Number);
        const neighbors = seaNeighborCoords(col, row)
          .map((item) => seaKey(item.col, item.row))
          .filter((key) => !cluster.includes(key) && !S.lastSea.map.some((hex) => hex.key === key && hex.type === "island"));

        if (!neighbors.length) {
          frontier.splice(frontier.indexOf(current), 1);
          continue;
        }

        const next = pick(neighbors);
        cluster.push(next);
        frontier.push(next);
      }

      if (cluster.length === hexCount) {
        return cluster.map((key) => {
          const [col, row] = key.split(",").map(Number);
          return { col, row, islandIndex };
        });
      }
    }
    return [];
  }

  function updateLastSeaGroupList() {
    const container = document.getElementById("lastSeaIslandGroups");
    if (!container) {
      return;
    }

    if (!S.lastSea.islands.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = S.lastSea.islands
      .map((island) => `<span class="sea-chip">${island.name} - ${island.hexes} hexes - ${island.days} day${island.days > 1 ? "s" : ""}${island.river ? " - river-broken" : ""}</span>`)
      .join("");
  }

  function generateLastSea() {
    ensureExpansionState();
    const layoutSelect = document.getElementById("lastSeaLayoutSelect");
    if (layoutSelect) {
      S.lastSea.layout = layoutSelect.value;
    }

    S.lastSea.map = [];
    S.lastSea.selectedKey = null;
    S.lastSea.islands = [];
    S.lastSea.weather = rollLastSeaWeather();

    for (let col = 0; col < LAST_SEA_COLS; col += 1) {
      for (let row = 0; row < LAST_SEA_ROWS; row += 1) {
        S.lastSea.map.push({
          key: seaKey(col, row),
          col,
          row,
          type: "sea",
          icon: "",
          desc: describeSeaHex(),
          resultHtml: "",
          encounter: null
        });
      }
    }

    const layouts = getLastSeaLayout();
    layouts.forEach((layout, index) => {
      const terrain = pick(LAST_SEA_TERRAINS);
      const ecology = pick(LAST_SEA_ECOLOGY);
      const cluster = createSeaCluster(layout.hexes, index);
      const name = layouts.length === 1 ? "Island Prime" : `Island ${index + 1}`;

      const islandMeta = {
        id: `island-${index + 1}`,
        name,
        hexes: layout.hexes,
        days: layout.days,
        river: layout.river,
        terrain: terrain.name,
        ecology
      };
      S.lastSea.islands.push(islandMeta);

      const siteTypes = layout.hexes >= 9 ? ["settlement", "landmark", "dungeon"] : layout.hexes >= 6 ? pickN(["settlement", "landmark", "dungeon"], 2) : [pick(["settlement", "landmark", "dungeon"])];
      const siteCells = pickN(cluster, siteTypes.length);

      cluster.forEach((cell, position) => {
        const hex = getSeaCell(cell.col, cell.row);
        if (!hex) {
          return;
        }
        const siteIndex = siteCells.findIndex((item) => item.col === cell.col && item.row === cell.row);
        const siteType = siteIndex >= 0 ? siteTypes[siteIndex] : null;
        hex.type = "island";
        hex.islandId = islandMeta.id;
        hex.islandName = islandMeta.name;
        hex.terrain = terrain.name;
        hex.terrainColor = terrain.color;
        hex.ecology = ecology;
        hex.siteType = siteType;
        hex.siteData = siteType ? createSeaSite(siteType) : null;
        hex.icon = siteType === "settlement" ? "⌂" : siteType === "landmark" ? "◈" : siteType === "dungeon" ? "◫" : "•";
        hex.desc = describeIslandHex(terrain, ecology, siteType);
        hex.title = siteType && hex.siteData && hex.siteData.name ? hex.siteData.name : `${terrain.name} Shore ${position + 1}`;
      });
    });

    renderLastSeaMap();
    renderLastSeaInfo();
    updateLastSeaGroupList();
    showNotif("Last Sea charted.", "good");
  }

  function clearLastSea() {
    ensureExpansionState();
    S.lastSea.map = [];
    S.lastSea.islands = [];
    S.lastSea.selectedKey = null;
    S.lastSea.weather = null;
    updateLastSeaGroupList();
    renderLastSeaMap();
    renderLastSeaInfo();
  }

  function seaHexToPixel(col, row) {
    const width = LAST_SEA_HEX * 2;
    const height = Math.sqrt(3) * LAST_SEA_HEX;
    return {
      x: col * width * 0.75 + LAST_SEA_HEX + 12,
      y: row * height + (col % 2) * height / 2 + LAST_SEA_HEX + 12
    };
  }

  function seaHexPoints(cx, cy) {
    return Array.from({ length: 6 }, (_, index) => {
      const angle = Math.PI / 180 * (60 * index - 30);
      return `${cx + (LAST_SEA_HEX - 1) * Math.cos(angle)},${cy + (LAST_SEA_HEX - 1) * Math.sin(angle)}`;
    }).join(" ");
  }

  function renderLastSeaMap() {
    const svg = document.getElementById("lastSeaSvg");
    if (!svg) {
      return;
    }

    if (!S.lastSea.map.length) {
      svg.setAttribute("width", "620");
      svg.setAttribute("height", "560");
      svg.innerHTML = `
        <text x="310" y="270" text-anchor="middle" font-family="Cinzel,serif" font-size="13" fill="#254454">Generate the Last Sea to begin</text>
        <text x="310" y="294" text-anchor="middle" font-family="Cinzel,serif" font-size="10" fill="#1a2c38">Every hex carries a description and an exploration roll.</text>
      `;
      return;
    }

    const width = LAST_SEA_COLS * LAST_SEA_HEX * 1.52 + LAST_SEA_HEX + 24;
    const height = LAST_SEA_ROWS * Math.sqrt(3) * LAST_SEA_HEX + LAST_SEA_HEX + 24;
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.innerHTML = "";

    S.lastSea.map.forEach((hex) => {
      const { x, y } = seaHexToPixel(hex.col, hex.row);
      const fill = hex.type === "sea" ? "#103247" : hex.terrainColor || "#486734";
      const stroke = S.lastSea.selectedKey === hex.key ? "#e8c050" : hex.type === "sea" ? "#2ec4b6" : "#c9a227";

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "svg-hex");

      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", seaHexPoints(x, y));
      polygon.setAttribute("fill", fill);
      polygon.setAttribute("stroke", stroke);
      polygon.setAttribute("stroke-width", S.lastSea.selectedKey === hex.key ? "2.6" : "1.3");
      group.appendChild(polygon);

      if (hex.icon) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 4);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("fill", hex.type === "sea" ? "#8fe7df" : "#f6df95");
        text.setAttribute("pointer-events", "none");
        text.textContent = hex.icon;
        group.appendChild(text);
      }

      const note = S.lastSea.notes[hex.key];
      if (note) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", x + LAST_SEA_HEX * 0.55);
        dot.setAttribute("cy", y - LAST_SEA_HEX * 0.55);
        dot.setAttribute("r", "4");
        dot.setAttribute("fill", "#e8c050");
        dot.setAttribute("pointer-events", "none");
        group.appendChild(dot);
      }

      group.addEventListener("click", () => {
        S.lastSea.selectedKey = hex.key;
        renderLastSeaMap();
        renderLastSeaInfo(hex);
      });
      group.addEventListener("mousemove", () => {
        const coords = document.getElementById("lastSeaCoords");
        if (coords) {
          coords.textContent = `[${hex.col + 1},${hex.row + 1}] ${hex.type === "sea" ? "Open Sea" : hex.title || hex.islandName}`;
        }
      });
      svg.appendChild(group);
    });
  }

  function renderCurrentSeaWeather() {
    if (!S.lastSea.weather) {
      S.lastSea.weather = rollLastSeaWeather();
    }
    const weather = S.lastSea.weather;
    return `
      <div class="weather-block ${weather.rough ? "rough" : "clear"}">
        <div class="weather-label" style="color:${weather.rough ? "var(--red2)" : "var(--teal)"};">${capitalize(S.currentSeason || "spring")} Weather: ${weather.label}</div>
        <div style="font-size:.81rem;color:var(--text2);">${weather.desc}</div>
        ${weather.rough ? '<div style="font-size:.78rem;color:var(--red2);margin-top:.2rem;">Rough sea. Pilots will likely test Lead or Control before pressing on.</div>' : ""}
      </div>
    `;
  }

  function renderLastSeaInfo(cell) {
    const panel = document.getElementById("lastSeaInfo");
    if (!panel) {
      return;
    }

    const hex = cell || S.lastSea.map.find((item) => item.key === S.lastSea.selectedKey);
    if (!hex) {
      panel.innerHTML = `
        <div class="sea-info-inner">
          <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;">Last Sea</div>
          <div style="font-size:.83rem;color:var(--muted2);line-height:1.65;margin-top:.4rem;">
            Chart the Last Sea, then click a hex to inspect it.<br><br>
            <strong style="color:var(--text);">Generator sizes:</strong><br>
            3 Hexes (1 Day), 9 Hexes (3 Days), or 3x 6 Hexes broken by river (2 Days each).<br><br>
            <strong style="color:var(--gold2);">Open Sea:</strong> Shift in Weather, Open Sea Encounter, Peril, Uneventful Sailing.<br>
            <strong style="color:var(--gold2);">Island Travel:</strong> Land Encounter, Peril, Exhaustion, Shift in Weather, Uneventful.
          </div>
        </div>
      `;
      return;
    }

    const island = S.lastSea.islands.find((item) => item.id === hex.islandId);
    const note = S.lastSea.notes[hex.key] || "";
    panel.innerHTML = `
      <div class="sea-info-inner">
        <div class="hex-type-tag ${
          hex.type === "sea"
            ? "wilderness"
            : hex.siteType === "settlement"
              ? "holding"
              : hex.siteType === "landmark"
                ? "monument"
                : hex.siteType === "dungeon"
                  ? "ruins"
                  : "holding"
        }">${hex.type === "sea" ? "Open Sea" : "Island Hex"}</div>
        <div class="hex-name">${hex.type === "sea" ? "Open Water" : hex.title || hex.islandName}</div>
        <div class="hex-desc" style="margin-bottom:.45rem;">${hex.desc}</div>
        ${renderCurrentSeaWeather()}
        ${
          island
            ? `<div class="info-row">
                 <div class="info-cell"><span class="ic-label">Island</span>${island.name}</div>
                 <div class="info-cell"><span class="ic-label">Explore Time</span>${island.days} day${island.days > 1 ? "s" : ""}</div>
               </div>
               <div class="info-row">
                 <div class="info-cell"><span class="ic-label">Terrain</span>${island.terrain}</div>
                 <div class="info-cell"><span class="ic-label">Ecology</span>${island.ecology}</div>
               </div>`
            : ""
        }
        ${
          hex.siteType && hex.siteData
            ? `<div class="sea-site">
                 <div class="ss-title">${capitalize(hex.siteType)}</div>
                 <div class="ss-text">${describeSeaSite(hex.siteType, hex.siteData)}</div>
               </div>`
            : ""
        }
        <div style="margin-top:.55rem;">
          <button class="btn btn-primary" onclick="exploreLastSeaHex(${hex.col},${hex.row})">${hex.type === "sea" ? "Explore Waters" : "Explore Island"}</button>
        </div>
        ${hex.resultHtml ? `<div class="sea-result">${hex.resultHtml}</div>` : ""}
        <div style="margin-top:.55rem;border-top:1px solid var(--border);padding-top:.55rem;">
          <div class="sub-label">Hex Notes</div>
          <textarea class="notes-area" placeholder="Add notes for this sea hex..." onchange="setLastSeaNote(${hex.col},${hex.row},this.value)">${note}</textarea>
        </div>
      </div>
    `;
  }

  function describeSeaSite(type, data) {
    if (type === "settlement") {
      return `${data.style} settlement with a ${data.feature.toLowerCase()}. ${data.news}`;
    }
    if (type === "landmark") {
      return `${data.name}. Effect: ${data.effect}. ${data.detail}`;
    }
    return `${data.name}. Built by ${data.builder}. Entrance: ${data.entrance}. ${data.novelty}.`;
  }

  function buildRoyalArmadaText() {
    return `${pick(ARMADA_ACTIONS)} ${pick(ARMADA_TARGETS)}`;
  }

  function buildSeaEncounter() {
    const rolled = roll(6);
    if (rolled === 1) {
      const ships = roll(4);
      return `<div class="sea-result-title">Open Sea Encounter - Pirate Ships</div>${ships} pirate ship${ships > 1 ? "s" : ""} hunt the lane. DD8 | 16 Stress each.`;
    }
    if (rolled === 2) {
      return `<div class="sea-result-title">Open Sea Encounter - Trading Ship</div>A trading ship drifts nearby with ${rollMulti(6, 2) * 10} Credits in goods. Treat it like a Merchant Caravan for barter, rumor, or escort work.`;
    }
    if (rolled === 3) {
      return `<div class="sea-result-title">Open Sea Encounter - The Great Serpent</div>The Great Serpent rises with ruined ships lashed across its spiny back. DD12 | 24 Stress.`;
    }
    if (rolled === 4) {
      return `<div class="sea-result-title">Open Sea Encounter - Sinking Skiff</div>${roll(6)} crew cling to a sinking skiff and beg for passage to the next Province.`;
    }
    if (rolled === 5) {
      const loot = roll(6);
      const vampires = roll(3);
      const lootText = loot === 6 ? "1 Strange Item" : `${loot} random item${loot > 1 ? "s" : ""}`;
      return `<div class="sea-result-title">Open Sea Encounter - Empty Transport</div>An empty transport floats half-derelict. Salvage: ${lootText}. Hidden aboard: ${vampires} vampire${vampires > 1 ? "s" : ""} (DD6 | 12 Stress).`;
    }
    return `<div class="sea-result-title">Open Sea Encounter - Royal Armada</div>A Royal Armada patrol demands answers. Mission: <strong style="color:var(--gold2);">${buildRoyalArmadaText()}</strong>.`;
  }

  function buildSeaExploration(hex) {
    const option = pick(["weather", "encounter", "peril", "uneventful"]);
    if (option === "weather") {
      S.lastSea.weather = rollLastSeaWeather();
      return `<div class="sea-result-title">Shift in Weather</div>The sea turns under you. New weather: <strong style="color:var(--gold2);">${S.lastSea.weather.label}</strong> - ${S.lastSea.weather.desc}`;
    }
    if (option === "encounter") {
      return buildSeaEncounter();
    }
    if (option === "peril") {
      const peril = pick(OPEN_SEA_PERILS);
      return `<div class="sea-result-title">Peril - ${peril}</div>Control vs DD6 or take the difference in Stress.`;
    }
    return `<div class="sea-result-title">Uneventful Sailing</div>The ship cuts across open water without trouble.`;
  }

  function createLandEncounterResult(hex, type, data) {
    hex.encounter = { type, data };
    if (type === "landmark") {
      return `
        <div class="sea-result-title">Land Encounter - Landmark</div>
        <div class="sea-site">
          <div class="ss-title">${data.name}</div>
          <div class="ss-text">Effect: ${data.effect}. ${data.detail}</div>
        </div>
      `;
    }
    if (type === "settlement") {
      return `
        <div class="sea-result-title">Land Encounter - Settlement</div>
        <div class="sea-site">
          <div class="ss-title">${data.name}</div>
          <div class="ss-text">${data.style} settlement with ${data.cultural.toLowerCase()} roots. ${data.news}</div>
          <div style="margin-top:.35rem;"><button class="btn btn-xs btn-primary" onclick="generateTask()">Generate Task</button></div>
        </div>
      `;
    }
    return `
      <div class="sea-result-title">Land Encounter - Dungeon</div>
      <div class="sea-site">
        <div class="ss-title">${data.name}</div>
        <div class="ss-text">Built by ${data.builder}. Purpose: ${data.builtFor}. Entrance: ${data.entrance}. Rooms: ${data.rooms}.</div>
        <div style="margin-top:.35rem;"><button class="btn btn-xs btn-primary" onclick="openSeaDungeon(${hex.col},${hex.row})">Generate Rooms</button></div>
      </div>
    `;
  }

  function buildLandEncounter(hex) {
    if (hex.siteType && hex.siteData && Math.random() < 0.65) {
      return createLandEncounterResult(hex, hex.siteType, hex.siteData);
    }

    const rolled = roll(6);
    if (rolled === 1) {
      return createLandEncounterResult(hex, "dungeon", makeDungeonData());
    }
    if (rolled === 2) {
      return createLandEncounterResult(hex, "landmark", makeLandmarkData());
    }
    if (rolled === 3) {
      return createLandEncounterResult(hex, "settlement", makeSettlementData());
    }
    if (rolled === 4) {
      const beasts = roll(4);
      return `<div class="sea-result-title">Land Encounter - Hostile Beasts</div>${beasts} hostile beast${beasts > 1 ? "s" : ""} stalk the interior. DD4 | 8 Stress.`;
    }
    if (rolled === 5) {
      const treasure = pick([`${roll(6) * 10} Credits`, "1 Scroll", "1 Armor", "1 Weapon"]);
      return `<div class="sea-result-title">Land Encounter - Buried Treasure</div>You uncover ${treasure}.`;
    }
    const pirates = roll(6);
    return `<div class="sea-result-title">Land Encounter - Pirates</div>${pirates} pirate${pirates > 1 ? "s" : ""} haunt the path inland. DD4 | 8 Stress.`;
  }

  function buildIslandExploration(hex) {
    const option = pick(["land", "peril", "exhaustion", "weather", "uneventful"]);
    if (option === "land") {
      return buildLandEncounter(hex);
    }
    if (option === "peril") {
      return `<div class="sea-result-title">Island Peril - ${pick(ISLAND_PERILS)}</div>Lead vs DD6 or take the difference in Stress.`;
    }
    if (option === "exhaustion") {
      return `<div class="sea-result-title">Exhaustion</div>Make a Trauma Check before pressing farther inland.`;
    }
    if (option === "weather") {
      S.lastSea.weather = rollLastSeaWeather();
      return `<div class="sea-result-title">Shift in Weather</div>The air changes fast. New weather: <strong style="color:var(--gold2);">${S.lastSea.weather.label}</strong> - ${S.lastSea.weather.desc}`;
    }
    return `<div class="sea-result-title">Uneventful Travel</div>You cross the island without incident.`;
  }

  function exploreLastSeaHex(col, row) {
    ensureExpansionState();
    const hex = getSeaCell(col, row);
    if (!hex) {
      return;
    }
    hex.resultHtml = hex.type === "sea" ? buildSeaExploration(hex) : buildIslandExploration(hex);
    renderLastSeaInfo(hex);
  }

  function setLastSeaNote(col, row, value) {
    ensureExpansionState();
    S.lastSea.notes[seaKey(col, row)] = value;
    renderLastSeaMap();
  }

  function buildDungeonModal(data) {
    let html = `
      <div class="room-block">
        <div class="rb-title">Entrance</div>
        <div class="rb-text">${data.entrance}</div>
      </div>
    `;

    for (let index = 1; index <= data.rooms; index += 1) {
      const type = pick(RUIN_ROOM_TYPES);
      const text =
        type === "Lair"
          ? pick(RUIN_LAIR_DESC)
          : type === "Obstacle"
            ? pick(RUIN_OBSTACLE_DESC)
            : type === "Trap"
              ? pick(RUIN_TRAP_DESC)
              : type === "Puzzle"
                ? pick(RUIN_PUZZLE_DESC)
                : "A quiet chamber full of salt-stained debris.";
      html += `
        <div class="room-block">
          <div class="rb-title">Room ${index} - ${type}</div>
          <div class="rb-text">${text}</div>
        </div>
      `;
    }
    return html;
  }

  function openSeaDungeon(col, row) {
    const hex = getSeaCell(col, row);
    const data = hex && hex.encounter && hex.encounter.type === "dungeon" ? hex.encounter.data : hex && hex.siteType === "dungeon" ? hex.siteData : null;
    if (!data) {
      return;
    }
    openModal(data.name, buildDungeonModal(data));
  }

  function getRankData(rank) {
    return NAVAL_RANKS.find((item) => item.name === rank) || NAVAL_RANKS[0];
  }

  function getShipClass(name) {
    return NAVAL_SHIPS.find((ship) => ship.name === name) || NAVAL_SHIPS[0];
  }

  function rollCrewName() {
    const input = document.getElementById("navalCrewName");
    if (input) {
      input.value = `${pick(Math.random() < 0.5 ? NAMES.f : NAMES.m)} ${pick(NAMES.l)}`;
    }
  }

  function generateShipIdentity() {
    ensureExpansionState();
    const name = `${pick(SHIP_NAME_FIRST)} ${pick(SHIP_NAME_LAST)}`;
    const look = pick(SHIP_LOOKS);
    if (S.naval.ship) {
      S.naval.ship.name = name;
      S.naval.ship.look = look;
    } else {
      S.naval.pendingName = name;
      S.naval.pendingLook = look;
    }
    renderNaval();
  }

  function createShipFromClass(className) {
    const shipClass = getShipClass(className);
    return {
      className: shipClass.name,
      name: S.naval.pendingName || `${shipClass.name} ${pick(SHIP_NAME_LAST)}`,
      look: S.naval.pendingLook || pick(SHIP_LOOKS),
      hullDie: shipClass.defend,
      strikeDie: shipClass.strike,
      shootDie: shipClass.shoot,
      feature: shipClass.feature,
      upgrades: [],
      stress: 0,
      wrecked: false,
      navBonus: 0,
      extraActions: shipClass.name === "Frigate" ? 1 : 0,
      leadBonus: shipClass.name === "Carrier" ? 1 : 0
    };
  }

  function buyShip(className) {
    ensureExpansionState();
    const shipClass = getShipClass(className);
    if (S.credits < shipClass.cost) {
      showNotif("Not enough Credits for that ship.", "warn");
      return;
    }

    S.naval.selectedClass = className;
    S.credits -= shipClass.cost;
    S.naval.ship = createShipFromClass(className);
    S.naval.enemyShip = null;
    S.naval.combatActive = false;
    S.naval.log.unshift({ text: `Purchased ${className} for ${shipClass.cost} Credits.`, type: "good" });
    updateCreditsUI();
    renderNaval();
    showNotif(`${className} added to the fleet.`, "good");
  }

  function getNavalUpgrade(id) {
    return NAVAL_UPGRADES.find((upgrade) => upgrade.id === id);
  }

  function buyNavalUpgrade(id) {
    ensureExpansionState();
    const ship = S.naval.ship;
    const upgrade = getNavalUpgrade(id);
    if (!ship || !upgrade) {
      showNotif("Buy a ship before installing upgrades.", "warn");
      return;
    }
    if (!upgrade.classes.includes(ship.className)) {
      showNotif("That upgrade does not fit this class.", "warn");
      return;
    }
    if (ship.upgrades.includes(id)) {
      showNotif("Upgrade already installed.", "warn");
      return;
    }
    if (S.credits < upgrade.cost || S.pathTokens < upgrade.pathCost) {
      showNotif("Not enough Credits or Path Tokens.", "warn");
      return;
    }

    S.credits -= upgrade.cost;
    S.pathTokens -= upgrade.pathCost;
    ship.upgrades.push(id);

    if (id === "installed-weapons") {
      ship.strikeDie = ship.strikeDie || 4;
      ship.shootDie = ship.shootDie || 4;
    } else if (id === "improved-navigation") {
      ship.navBonus += 2;
    } else if (id === "improved-combat") {
      ship.strikeDie = Math.max(ship.strikeDie || 4, 8);
      ship.shootDie = Math.max(ship.shootDie || 4, 8);
    } else if (id === "improved-defenses") {
      ship.hullDie = stepUp(ship.hullDie);
    } else if (id === "captains-hq") {
      ship.leadBonus += 1;
      ship.extraActions += 1;
    }

    updateCreditsUI();
    renderNaval();
    showNotif(`${upgrade.name} installed.`, "good");
  }

  function getCrewCost(role, rank) {
    return getRankData(rank).baseCost + (NAVAL_ROLE_COSTS[rank][role] || 0);
  }

  function getCrewAbilities(role, rank) {
    const abilities = [];
    if (rank === "Experienced" || rank === "Veteran" || rank === "Elite") {
      abilities.push(...NAVAL_ABILITIES[role].Experienced);
    }
    if (rank === "Veteran" || rank === "Elite") {
      abilities.push(...NAVAL_ABILITIES[role].Veteran);
    }
    if (rank === "Elite") {
      abilities.push(...NAVAL_ABILITIES[role].Elite);
    }
    return abilities;
  }

  function hireNavalCrew() {
    ensureExpansionState();
    const role = document.getElementById("navalCrewRole")?.value || "Captain";
    const rank = document.getElementById("navalCrewRank")?.value || "Rookie";
    const input = document.getElementById("navalCrewName");
    const name = input && input.value.trim() ? input.value.trim() : `${pick(Math.random() < 0.5 ? NAMES.f : NAMES.m)} ${pick(NAMES.l)}`;
    const cost = getCrewCost(role, rank);
    if (S.credits < cost) {
      showNotif("Not enough Credits to hire that crew member.", "warn");
      return;
    }

    S.credits -= cost;
    S.naval.crew.push({
      id: Date.now() + Math.random(),
      name,
      role,
      rank
    });
    if (input) {
      input.value = "";
    }
    updateCreditsUI();
    renderNaval();
    showNotif(`${name} hired as ${rank} ${role}.`, "good");
  }

  function removeNavalCrew(id) {
    ensureExpansionState();
    S.naval.crew = S.naval.crew.filter((member) => member.id !== id);
    renderNaval();
  }

  function trainNavalCrew(id) {
    ensureExpansionState();
    const crew = S.naval.crew.find((member) => member.id === id);
    if (!crew) {
      return;
    }
    const currentIndex = NAVAL_RANKS.findIndex((rank) => rank.name === crew.rank);
    const nextRank = NAVAL_RANKS[currentIndex + 1];
    if (!nextRank) {
      showNotif("That crew member is already Elite.", "warn");
      return;
    }
    if (S.pathTokens < nextRank.train) {
      showNotif("Not enough Path Tokens to train that crew member.", "warn");
      return;
    }
    S.pathTokens -= nextRank.train;
    crew.rank = nextRank.name;
    renderNaval();
    showNotif(`${crew.name} trained to ${nextRank.name}.`, "good");
  }

  function getEffectiveShipDie(ship, stat, isPlayer) {
    if (!ship) {
      return null;
    }

    let value = stat === "hull" ? ship.hullDie : stat === "strike" ? ship.strikeDie : ship.shootDie;
    if (isPlayer && S.naval.powerShift) {
      if (S.naval.powerShift.from === stat && value) {
        value = stepDown(value);
      }
      if (S.naval.powerShift.to === stat) {
        value = value ? stepUp(value) : 4;
      }
    }
    return value;
  }

  function getShipThreshold(ship, isPlayer) {
    const hull = getEffectiveShipDie(ship, "hull", isPlayer) || 4;
    return hull * 2;
  }

  function countCrewRole(role, rank) {
    return S.naval.crew.filter((member) => member.role === role && (!rank || member.rank === rank)).length;
  }

  function getPlayerActionCount() {
    const ship = S.naval.ship;
    const crewCount = Math.max(1, S.naval.crew.length || 0);
    const eliteCaptainBonus = countCrewRole("Captain", "Elite") ? 2 : 0;
    return crewCount + (ship ? ship.extraActions || 0 : 0) + eliteCaptainBonus;
  }

  function renderShipSummary(ship, isPlayer) {
    if (!ship) {
      return `<div class="ship-copy">No ship purchased yet.</div>`;
    }
    const hull = getEffectiveShipDie(ship, "hull", isPlayer);
    const strike = getEffectiveShipDie(ship, "strike", isPlayer);
    const shoot = getEffectiveShipDie(ship, "shoot", isPlayer);
    const threshold = getShipThreshold(ship, isPlayer);
    return `
      <div class="ship-name">${ship.name}</div>
      <div class="ship-class">${ship.className}</div>
      <div class="ship-copy">${ship.look}</div>
      <div class="ship-stats">
        <div class="ship-stat"><span class="label">Hull</span><span class="value">d${hull}</span></div>
        <div class="ship-stat"><span class="label">Strike</span><span class="value">${strike ? `d${strike}` : "-"}</span></div>
        <div class="ship-stat"><span class="label">Shoot</span><span class="value">${shoot ? `d${shoot}` : "-"}</span></div>
      </div>
      <div class="ship-copy" style="margin-top:.35rem;">
        Stress: <strong style="color:var(--red2);">${ship.stress}</strong> / ${threshold}<br>
        ${ship.feature}<br>
        ${ship.upgrades.length ? `Upgrades: ${ship.upgrades.map((item) => getNavalUpgrade(item)?.name).filter(Boolean).join(", ")}` : "No installed upgrades."}
      </div>
    `;
  }

  function renderNavalZoneTrack() {
    const track = document.getElementById("navalZoneTrack");
    const readout = document.getElementById("navalZoneReadout");
    if (readout) {
      readout.textContent = S.naval.zone;
    }
    if (!track) {
      return;
    }
    track.innerHTML = NAVAL_ZONES.map((zone) => `<span class="zone-pill ${zone === S.naval.zone ? "on" : ""}">${zone}</span>`).join("");
  }

  function renderNaval() {
    ensureExpansionState();
    const shipSummary = document.getElementById("navalShipSummary");
    const shipGrid = document.getElementById("navalShipGrid");
    const upgradeList = document.getElementById("navalUpgradeList");
    const crewRoster = document.getElementById("navalCrewRoster");
    const combatSummary = document.getElementById("navalCombatSummary");
    const combatLog = document.getElementById("navalCombatLog");
    const credits = document.getElementById("navalCredits");
    const path = document.getElementById("navalPathTokens");
    const trauma = document.getElementById("navalCrewTrauma");

    if (credits) {
      credits.textContent = `${S.credits} ₵`;
    }
    if (path) {
      path.textContent = String(S.pathTokens || 0);
    }
    if (trauma) {
      trauma.textContent = String(S.naval.crewTrauma || 0);
    }

    if (shipSummary) {
      const identityLine = !S.naval.ship && (S.naval.pendingName || S.naval.pendingLook)
        ? `<div class="ship-copy" style="margin-bottom:.45rem;"><strong style="color:var(--gold2);">${S.naval.pendingName || "Unnamed hull"}</strong><br>${S.naval.pendingLook || ""}</div>`
        : "";
      shipSummary.innerHTML = `${identityLine}${renderShipSummary(S.naval.ship, true)}`;
    }

    if (shipGrid) {
      shipGrid.innerHTML = NAVAL_SHIPS.map((ship) => {
        const owned = S.naval.ship && S.naval.ship.className === ship.name;
        return `
          <div class="ship-card ${S.naval.selectedClass === ship.name ? "sel" : ""} ${owned ? "owned" : ""}">
            <div class="ship-name">${ship.name}</div>
            <div class="ship-class">${ship.cost.toLocaleString()} Credits</div>
            <div class="ship-stats">
              <div class="ship-stat"><span class="label">Hull</span><span class="value">d${ship.defend}</span></div>
              <div class="ship-stat"><span class="label">Strike</span><span class="value">${ship.strike ? `d${ship.strike}` : "-"}</span></div>
              <div class="ship-stat"><span class="label">Shoot</span><span class="value">${ship.shoot ? `d${ship.shoot}` : "-"}</span></div>
            </div>
            <div class="ship-copy">${ship.feature}</div>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap;">
              <button class="btn btn-xs" onclick="selectNavalClass('${ship.name}')">Select</button>
              <button class="btn btn-xs btn-primary" onclick="buyShip('${ship.name}')">${owned ? "Owned" : "Buy"}</button>
            </div>
          </div>
        `;
      }).join("");
    }

    if (upgradeList) {
      if (!S.naval.ship) {
        upgradeList.innerHTML = '<div class="upgrade-card"><div class="upgrade-copy">Buy a ship first to see compatible upgrades.</div></div>';
      } else {
        const relevant = NAVAL_UPGRADES.filter((upgrade) => upgrade.classes.includes(S.naval.ship.className));
        upgradeList.innerHTML = relevant.map((upgrade) => `
          <div class="upgrade-card">
            <div class="upgrade-copy">
              <strong style="color:var(--gold2);">${upgrade.name}</strong><br>
              ${upgrade.effect}<br>
              Cost: ${upgrade.cost} Credits + ${upgrade.pathCost} Path Tokens
            </div>
            <button class="btn btn-xs ${S.naval.ship.upgrades.includes(upgrade.id) ? "" : "btn-primary"}" onclick="buyNavalUpgrade('${upgrade.id}')">${S.naval.ship.upgrades.includes(upgrade.id) ? "Installed" : "Install"}</button>
          </div>
        `).join("");
      }
    }

    if (crewRoster) {
      if (!S.naval.crew.length) {
        crewRoster.innerHTML = '<div class="crew-card"><div class="ship-copy">No crew hired yet.</div></div>';
      } else {
        crewRoster.innerHTML = S.naval.crew.map((member) => `
          <div class="crew-card">
            <div class="crew-top">
              <div>
                <div class="crew-name">${member.name}</div>
                <div class="crew-role">${member.rank} ${member.role}</div>
                <div class="ship-copy">${NAVAL_ROLE_META[member.role].pair}</div>
              </div>
              <div class="ship-copy">Hire value: ${getCrewCost(member.role, member.rank)} C</div>
            </div>
            <div style="margin-top:.35rem;">
              ${getCrewAbilities(member.role, member.rank).length
                ? getCrewAbilities(member.role, member.rank).map((ability) => `<div class="crew-ability">${ability}</div>`).join("")
                : '<div class="crew-ability">No special abilities yet.</div>'}
            </div>
            <div class="crew-actions">
              <button class="btn btn-xs" onclick="trainNavalCrew(${member.id})">Train</button>
              <button class="btn btn-xs btn-red" onclick="removeNavalCrew(${member.id})">Dismiss</button>
            </div>
          </div>
        `).join("");
      }
    }

    if (combatSummary) {
      combatSummary.innerHTML = `
        <div class="combat-card" style="margin-bottom:.45rem;">${renderShipSummary(S.naval.ship, true)}</div>
        <div class="combat-card" style="margin-bottom:.45rem;">${renderShipSummary(S.naval.enemyShip, false)}</div>
        <div class="combat-card">
          <div class="ship-copy">
            Round: <strong style="color:var(--gold2);">${S.naval.round}</strong><br>
            Actions available this round: <strong style="color:var(--gold2);">${getPlayerActionCount()}</strong><br>
            Tactics bonus: <strong style="color:var(--teal);">+${S.naval.tacticsBonus || 0}</strong><br>
            ${S.naval.powerShift ? `Diverting power from ${S.naval.powerShift.from} to ${S.naval.powerShift.to}.` : "No current power shift."}
          </div>
        </div>
      `;
    }

    if (combatLog) {
      combatLog.innerHTML = S.naval.log.length
        ? S.naval.log.map((entry) => `<div class="log-entry ${entry.type || ""}">${entry.text}</div>`).join("")
        : '<div class="log-entry">Combat log is empty.</div>';
    }

    renderNavalZoneTrack();
  }

  function selectNavalClass(className) {
    ensureExpansionState();
    S.naval.selectedClass = className;
    renderNaval();
  }

  function spawnEnemyShip() {
    ensureExpansionState();
    const className = document.getElementById("navalEnemyClass")?.value || S.naval.enemyClass || "Frigate";
    S.naval.enemyClass = className;
    S.naval.enemyShip = createShipFromClass(className);
    S.naval.enemyShip.name = `${pick(SHIP_NAME_FIRST)} ${pick(SHIP_NAME_LAST)}`;
    renderNaval();
    showNotif(`Enemy ${className} sighted.`, "warn");
  }

  function startNavalCombat() {
    ensureExpansionState();
    if (!S.naval.ship) {
      showNotif("Buy a ship before starting naval combat.", "warn");
      return;
    }
    if (!S.naval.enemyShip) {
      spawnEnemyShip();
    }
    S.naval.combatActive = true;
    S.naval.round = 1;
    S.naval.tacticsBonus = 0;
    S.naval.powerShift = null;
    S.naval.crewTrauma = 0;
    S.naval.ship.stress = 0;
    S.naval.ship.wrecked = false;
    if (S.naval.enemyShip) {
      S.naval.enemyShip.stress = 0;
      S.naval.enemyShip.wrecked = false;
    }
    S.naval.log = [{ text: "Naval combat begins. Crew to stations.", type: "good" }];
    renderNaval();
  }

  function clearNavalLog() {
    ensureExpansionState();
    S.naval.log = [];
    renderNaval();
  }

  function navalLog(text, type) {
    S.naval.log.unshift({ text, type });
    S.naval.log = S.naval.log.slice(0, 30);
  }

  function shipBreakTest(ship, side) {
    while (!ship.wrecked) {
      const threshold = getShipThreshold(ship, side === "player");
      if (ship.stress < threshold) {
        break;
      }
      if (ship.hullDie === 4) {
        ship.wrecked = true;
        ship.stress = threshold;
        navalLog(`${side === "player" ? "Your" : "Enemy"} ship is wrecked and out of action.`, "warn");
        return;
      }
      ship.stress -= threshold;
      ship.hullDie = stepDown(ship.hullDie);
      if (side === "player") {
        S.naval.crewTrauma += 1;
      }
      navalLog(`${side === "player" ? "Your" : "Enemy"} hull breaks. Defend drops to d${ship.hullDie}.`, "warn");
    }
  }

  function damageShip(ship, amount, side) {
    ship.stress += amount;
    shipBreakTest(ship, side);
  }

  function repairPlayerShipToFull() {
    ensureExpansionState();
    if (!S.naval.ship) {
      return;
    }
    S.naval.ship.stress = 0;
    S.naval.ship.wrecked = false;
    renderNaval();
  }

  function currentZoneIndex() {
    const index = NAVAL_ZONES.indexOf(S.naval.zone);
    return index >= 0 ? index : 1;
  }

  function adjustNavalZone(direction) {
    ensureExpansionState();
    if (!S.naval.ship) {
      showNotif("Buy a ship first.", "warn");
      return;
    }
    const rollResult = explodingRoll(S.stats.control || 4);
    const controlTotal = rollResult.total + (S.naval.ship.navBonus || 0);
    const target = explodingRoll(6);
    const success = controlTotal >= target.total;
    if (success) {
      const nextIndex = Math.max(0, Math.min(NAVAL_ZONES.length - 1, currentZoneIndex() + direction));
      S.naval.zone = NAVAL_ZONES[nextIndex];
      navalLog(`Navigator shifts the range to ${S.naval.zone} (${controlTotal} vs ${target.total}).`, "good");
    } else {
      const stress = Math.max(1, target.total - controlTotal);
      damageShip(S.naval.ship, stress, "player");
      navalLog(`Navigator loses the line (${controlTotal} vs ${target.total}) and the ship takes ${stress} Stress.`, "warn");
    }
    renderNaval();
  }

  function applyPowerShift() {
    ensureExpansionState();
    const from = document.getElementById("navalPowerFrom")?.value || "shoot";
    const to = document.getElementById("navalPowerTo")?.value || "hull";
    if (from === to) {
      showNotif("Choose two different stats for power diversion.", "warn");
      return;
    }
    S.naval.powerShift = { from, to };
    navalLog(`Power diverted from ${from} to ${to} for this round.`, "good");
    renderNaval();
  }

  function clearPowerShift() {
    ensureExpansionState();
    S.naval.powerShift = null;
    renderNaval();
  }

  function nextNavalRound() {
    ensureExpansionState();
    S.naval.round += 1;
    S.naval.tacticsBonus = 0;
    S.naval.powerShift = null;
    navalLog(`Round ${S.naval.round} begins.`, "");
    renderNaval();
  }

  function navalAttack(mode) {
    ensureExpansionState();
    const ship = S.naval.ship;
    const enemy = S.naval.enemyShip;
    if (!ship || !enemy) {
      showNotif("You need both ships on the field.", "warn");
      return;
    }
    if (ship.wrecked || enemy.wrecked) {
      showNotif("One of the ships is already wrecked.", "warn");
      return;
    }

    if (mode === "strike" && S.naval.zone !== "Close") {
      showNotif("Cannons need Close range.", "warn");
      return;
    }
    if (mode === "shoot" && S.naval.zone !== "Nearby") {
      showNotif("Crossbows need Nearby range.", "warn");
      return;
    }
    if (S.naval.zone === "Engaged") {
      showNotif("Ships are engaged and boarding. No ship weapons.", "warn");
      return;
    }
    if (S.naval.zone === "Far") {
      showNotif("Target is too far for ship weapons.", "warn");
      return;
    }

    const die = getEffectiveShipDie(ship, mode, true);
    if (!die) {
      showNotif("This ship has no weapon die for that action.", "warn");
      return;
    }

    const attack = explodingRoll(die);
    attack.total += S.naval.tacticsBonus || 0;
    const defend = explodingRoll(getEffectiveShipDie(enemy, "hull", false) || 4);
    const success = attack.total >= defend.total;
    if (success) {
      const stress = Math.max(1, attack.total - defend.total);
      damageShip(enemy, stress, "enemy");
      navalLog(`${mode === "strike" ? "Cannons" : "Crossbows"} hit for ${stress} Stress (${attack.total} vs ${defend.total}).`, "good");
    } else {
      navalLog(`${mode === "strike" ? "Cannons" : "Crossbows"} miss (${attack.total} vs ${defend.total}).`, "warn");
    }
    S.naval.tacticsBonus = 0;
    renderNaval();
  }

  function enemyNavalAttack() {
    ensureExpansionState();
    const ship = S.naval.ship;
    const enemy = S.naval.enemyShip;
    if (!ship || !enemy || ship.wrecked || enemy.wrecked) {
      return;
    }

    let mode = null;
    if (S.naval.zone === "Close") {
      mode = "strike";
    } else if (S.naval.zone === "Nearby") {
      mode = "shoot";
    } else {
      navalLog("Enemy ship cannot line up a clear shot from this zone.", "");
      renderNaval();
      return;
    }

    const die = getEffectiveShipDie(enemy, mode, false);
    if (!die) {
      navalLog("Enemy ship lacks the weapon profile for that shot.", "");
      renderNaval();
      return;
    }

    const attack = explodingRoll(die);
    const defend = explodingRoll(getEffectiveShipDie(ship, "hull", true) || 4);
    const success = attack.total >= defend.total;
    if (success) {
      const stress = Math.max(1, attack.total - defend.total);
      damageShip(ship, stress, "player");
      navalLog(`Enemy ${mode === "strike" ? "cannons" : "crossbows"} hit for ${stress} Stress (${attack.total} vs ${defend.total}).`, "warn");
    } else {
      navalLog(`Enemy fire glances off the hull (${attack.total} vs ${defend.total}).`, "good");
    }
    renderNaval();
  }

  function navalRepair() {
    ensureExpansionState();
    if (!S.naval.ship) {
      return;
    }
    const body = explodingRoll(S.stats.body || 4);
    const target = explodingRoll(6);
    if (body.total >= target.total) {
      const repair = Math.max(1, body.total - target.total);
      S.naval.ship.stress = Math.max(0, S.naval.ship.stress - repair);
      navalLog(`Engineer removes ${repair} Stress (${body.total} vs ${target.total}).`, "good");
    } else {
      navalLog(`Repair fails (${body.total} vs ${target.total}).`, "warn");
    }
    renderNaval();
  }

  function navalTactics() {
    ensureExpansionState();
    const lead = explodingRoll(S.stats.lead || 4);
    const leadTotal = lead.total + (S.naval.ship ? S.naval.ship.leadBonus || 0 : 0);
    const target = explodingRoll(6);
    if (leadTotal >= target.total) {
      S.naval.tacticsBonus = Math.max(1, leadTotal - target.total);
      navalLog(`Captain sets the line. Next ship action gets +${S.naval.tacticsBonus}.`, "good");
    } else {
      S.naval.tacticsBonus = 0;
      navalLog(`Captain's tactics falter (${leadTotal} vs ${target.total}).`, "warn");
    }
    renderNaval();
  }

  function navalMorale() {
    ensureExpansionState();
    const spirit = explodingRoll(S.stats.spirit || 4);
    const target = explodingRoll(6);
    if (spirit.total >= target.total) {
      if (S.naval.crewTrauma > 0) {
        S.naval.crewTrauma -= 1;
      }
      navalLog(`Captain steadies the crew and keeps fear down (${spirit.total} vs ${target.total}).`, "good");
    } else {
      navalLog(`Morale speech fails to land (${spirit.total} vs ${target.total}).`, "warn");
    }
    renderNaval();
  }

  function navalSurvey() {
    ensureExpansionState();
    const mind = explodingRoll(S.stats.mind || 4);
    const mindTotal = mind.total + (S.naval.ship ? S.naval.ship.navBonus || 0 : 0);
    const target = explodingRoll(6);
    if (mindTotal >= target.total) {
      S.naval.tacticsBonus += 1;
      navalLog(`Navigator reads the sea and grants +1 tactical edge (${mindTotal} vs ${target.total}).`, "good");
    } else {
      navalLog(`Navigator misreads the water (${mindTotal} vs ${target.total}).`, "warn");
    }
    renderNaval();
  }

  function wreckEnemyShip() {
    ensureExpansionState();
    if (!S.naval.enemyShip) {
      return;
    }
    S.naval.enemyShip.wrecked = true;
    navalLog("Enemy ship is marked wrecked.", "good");
    renderNaval();
  }

  function renderGambling() {
    ensureExpansionState();
    const level = GAMBLING_LEVELS.find((item) => item.level === S.gambling.difficulty) || GAMBLING_LEVELS[0];
    const credits = document.getElementById("gamblingCredits");
    const buyIn = document.getElementById("gamblingBuyIn");
    const difficulty = document.getElementById("gamblingDifficultyReadout");
    const die = document.getElementById("gamblingDieReadout");
    const grid = document.getElementById("gamblingDifficultyGrid");
    const history = document.getElementById("gamblingHistory");

    if (credits) {
      credits.textContent = `${S.credits} ₵`;
    }
    if (buyIn) {
      buyIn.textContent = `${level.buyIn} ₵`;
    }
    if (difficulty) {
      difficulty.textContent = `Level ${level.level} - ${level.label}`;
    }
    if (die) {
      die.textContent = `d${level.die}`;
    }
    if (grid) {
      grid.innerHTML = GAMBLING_LEVELS.map((item) => `
        <div class="difficulty-card ${item.level === S.gambling.difficulty ? "sel" : ""}" onclick="setGamblingDifficulty(${item.level})">
          <div class="dc-rank">Level ${item.level}</div>
          <div class="dc-name">${item.label}</div>
          <div class="dc-meta">d${item.die} / ${item.buyIn} C</div>
        </div>
      `).join("");
    }
    ["under", "middle", "over"].forEach((guess) => {
      const button = document.getElementById(`guess-${guess}`);
      if (button) {
        button.classList.toggle("sel", S.gambling.guess === guess);
      }
    });
    if (history) {
      history.innerHTML = S.gambling.history.length
        ? S.gambling.history.map((entry) => `<div class="history-card">${entry}</div>`).join("")
        : '<div class="history-card">No games played yet.</div>';
    }
  }

  function setGamblingDifficulty(level) {
    ensureExpansionState();
    S.gambling.difficulty = level;
    renderGambling();
  }

  function setGamblingGuess(guess) {
    ensureExpansionState();
    S.gambling.guess = guess;
    renderGambling();
  }

  function getAdventurePosition(adventure, low, high) {
    if (adventure < low) {
      return "under";
    }
    if (adventure > high) {
      return "over";
    }
    return "middle";
  }

  function playGamblingRound() {
    ensureExpansionState();
    const level = GAMBLING_LEVELS.find((item) => item.level === S.gambling.difficulty) || GAMBLING_LEVELS[0];
    if (S.credits < level.buyIn) {
      showNotif("Not enough Credits for that buy-in.", "warn");
      return;
    }

    const dreadOne = roll(level.die);
    const dreadTwo = roll(level.die);
    const low = Math.min(dreadOne, dreadTwo);
    const high = Math.max(dreadOne, dreadTwo);
    const adventure = roll(level.die);
    const actual = getAdventurePosition(adventure, low, high);
    const success = actual === S.gambling.guess;

    if (success) {
      S.credits += level.buyIn;
    } else {
      S.credits -= level.buyIn;
    }

    document.getElementById("gambleDieOne").textContent = String(low);
    document.getElementById("gambleDieTwo").textContent = String(high);
    document.getElementById("gambleAdventure").textContent = String(adventure);

    const outcome = document.getElementById("gamblingOutcome");
    if (outcome) {
      outcome.className = `gamble-outcome ${success ? "good" : "warn"}`;
      outcome.innerHTML = `
        <strong style="color:${success ? "var(--green2)" : "var(--red2)"};">${success ? "Success" : "Failure"}</strong><br>
        Guess: ${capitalize(S.gambling.guess)}<br>
        Adventure Die landed in the <strong style="color:var(--gold2);">${capitalize(actual)}</strong> position.<br>
        ${success ? `You gain ${level.buyIn} Credits.` : `You lose ${level.buyIn} Credits.`}
      `;
    }

    S.gambling.history.unshift(
      `Level ${level.level} (${level.label}) - Dread ${low}/${high}, Adventure ${adventure}, guessed ${S.gambling.guess}, result ${actual}, ${success ? `won ${level.buyIn} C` : `lost ${level.buyIn} C`}.`
    );
    S.gambling.history = S.gambling.history.slice(0, 20);
    updateCreditsUI();
    renderGambling();
  }

  function clearGamblingHistory() {
    ensureExpansionState();
    S.gambling.history = [];
    const outcome = document.getElementById("gamblingOutcome");
    if (outcome) {
      outcome.className = "gamble-outcome";
      outcome.textContent = "Pick a difficulty and a guess, then let the house roll.";
    }
    ["gambleDieOne", "gambleDieTwo", "gambleAdventure"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = "-";
      }
    });
    renderGambling();
  }

  function syncExpansionUIs() {
    ensureExpansionState();
    mountExpansionPanels();
    updateLastSeaGroupList();
    renderLastSeaMap();
    renderLastSeaInfo();
    renderNaval();
    renderGambling();
    const layoutSelect = document.getElementById("lastSeaLayoutSelect");
    if (layoutSelect) {
      layoutSelect.value = S.lastSea.layout || "random";
    }
  }

  function setLastSeaSeason(season, button) {
    setSeason(season, button);
    ensureExpansionState();
    S.lastSea.weather = rollLastSeaWeather();
    renderLastSeaInfo();
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureExpansionState();
    mountExpansionPanels();
    appendRuleCards();
    renderLastSeaInfo();
    renderNaval();
    renderGambling();
  });

  const baseUpdateCreditsUI = updateCreditsUI;
  updateCreditsUI = function () {
    baseUpdateCreditsUI();
    renderNaval();
    renderGambling();
  };

  const baseLoadCharacter = loadCharacter;
  loadCharacter = function () {
    baseLoadCharacter();
    syncExpansionUIs();
  };

  const baseClearCharacter = clearCharacter;
  clearCharacter = function () {
    baseClearCharacter();
    ensureExpansionState();
    syncExpansionUIs();
  };

  const baseGenerateCharacter = generateCharacter;
  generateCharacter = function () {
    baseGenerateCharacter();
    ensureExpansionState();
    syncExpansionUIs();
  };

  window.setLastSeaSeason = setLastSeaSeason;
  window.generateLastSea = generateLastSea;
  window.clearLastSea = clearLastSea;
  window.exploreLastSeaHex = exploreLastSeaHex;
  window.setLastSeaNote = setLastSeaNote;
  window.openSeaDungeon = openSeaDungeon;
  window.generateShipIdentity = generateShipIdentity;
  window.buyShip = buyShip;
  window.buyNavalUpgrade = buyNavalUpgrade;
  window.rollCrewName = rollCrewName;
  window.hireNavalCrew = hireNavalCrew;
  window.removeNavalCrew = removeNavalCrew;
  window.trainNavalCrew = trainNavalCrew;
  window.selectNavalClass = selectNavalClass;
  window.spawnEnemyShip = spawnEnemyShip;
  window.startNavalCombat = startNavalCombat;
  window.nextNavalRound = nextNavalRound;
  window.clearNavalLog = clearNavalLog;
  window.adjustNavalZone = adjustNavalZone;
  window.applyPowerShift = applyPowerShift;
  window.clearPowerShift = clearPowerShift;
  window.navalAttack = navalAttack;
  window.enemyNavalAttack = enemyNavalAttack;
  window.navalRepair = navalRepair;
  window.navalTactics = navalTactics;
  window.navalMorale = navalMorale;
  window.navalSurvey = navalSurvey;
  window.wreckEnemyShip = wreckEnemyShip;
  window.repairPlayerShipToFull = repairPlayerShipToFull;
  window.setGamblingDifficulty = setGamblingDifficulty;
  window.setGamblingGuess = setGamblingGuess;
  window.playGamblingRound = playGamblingRound;
  window.clearGamblingHistory = clearGamblingHistory;
})();
