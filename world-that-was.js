// world-that-was.js
(function () {
  const WTW_SCHEMA_VERSION = 2;
  const WTW_HEX = 24;
  const MAP_COLS = 12;
  const MAP_ROWS = 12;

  const ZONE_NAMES = [
    "Cyber Hub",
    "Green House",
    "Industrial Sector",
    "Neon City",
    "Outskirts",
    "Residential Blocks",
    "The Undercity",
    "The Wastes",
    "The Ports"
  ];

  const ZONE_COLORS = {
    "Cyber Hub": "#8fadb8",
    "Green House": "#72c987",
    "Industrial Sector": "#4f4f54",
    "Neon City": "#db72b2",
    "Outskirts": "#f1f1f1",
    "Residential Blocks": "#b0a9a1",
    "The Undercity": "#aa2f3b",
    "The Wastes": "#e2b55d",
    "The Ports": "#4f58a6"
  };

  const MAJOR_POWERS = ["Axiom Cartel", "Helix Union", "Titan Crown"];
  const FACTIONS = ["Veil Runners", "Dust Saints"];
  const HOLDERS = MAJOR_POWERS.concat(FACTIONS);

  const ZONE_FLAVOR = {
    "Cyber Hub": {
      locations: ["beneath data towers", "inside a quantum exchange", "in the neon relay quarter"],
      sights: ["The Nexus Point", "The Pixel Promenade", "The Simulation Sphere"],
      descriptions: ["code rain drips across every wall", "AI murals rewrite themselves every minute", "the district hums like a live processor"],
      features: ["hackers and brokers", "aug-tech pilgrims", "corporate runners"],
      flora: ["neon ivy", "circuit moss", "synthetic orchid"],
      fauna: ["holographic pigeons", "drone swarms", "memory eels"],
      land: ["glass catwalks", "server vault alleys", "fiber trenches"],
      weather: ["signal haze", "coolant mist", "acid drizzle"],
      events: [
        { title: "Corporate Data Heist", text: "A rival vault is exposed for six minutes.", action: "Breach the vault", reward: "+1 Axiom Cartel, random data loot" },
        { title: "Rogue AI Lockdown", text: "Security grids close without warning.", action: "Stabilize the AI core", reward: "+1 Helix Union, random augment" }
      ]
    },
    "Green House": {
      locations: ["beneath engineered canopies", "inside mist gardens", "along bio-lum streams"],
      sights: ["The Orchid Pavilion", "The Glow Trail", "The Cascade Overlook"],
      descriptions: ["the dome breathes with humid green light", "gene labs pulse behind glass", "pollinator drones patrol in quiet loops"],
      features: ["botanists and medics", "eco-tour pilgrims", "gene-smith apprentices"],
      flora: ["DNA-helix trees", "heritage fern", "spice-bloom vine"],
      fauna: ["engineered avians", "eco-drones", "holo deer"],
      land: ["glass terraces", "root-bridge lanes", "waterfall decks"],
      weather: ["soft mist", "warm dew", "controlled rain"],
      events: [
        { title: "Invasive Bloom", text: "A predatory vine overruns a lab perimeter.", action: "Contain the spread", reward: "+1 Dust Saints, random med loot" },
        { title: "Genome Theft", text: "A rare gene-seed shipment vanishes.", action: "Track the smugglers", reward: "+1 Helix Union, random biotech" }
      ]
    },
    "Industrial Sector": {
      locations: ["inside foundry lines", "along the rail yards", "under steam stacks"],
      sights: ["The Iron Citadel", "The Vent Core", "The Junk Throne"],
      descriptions: ["smelters paint the sky amber", "cargo cranes scrape through smog", "factory sirens echo in shifts"],
      features: ["forge crews", "scrap barons", "militia contractors"],
      flora: ["slag moss", "rust-vine", "filter fern"],
      fauna: ["gear hounds", "iron rats", "soot bats"],
      land: ["slag fields", "catwalk grids", "sealed tunnels"],
      weather: ["smog", "ashfall", "heat haze"],
      events: [
        { title: "Foundry Strike", text: "Workers block a central melt line.", action: "Broker or break the strike", reward: "+1 Titan Crown, 200 credits" },
        { title: "Blueprint Leak", text: "Weapon blueprints hit black channels.", action: "Recover the files", reward: "+1 Veil Runners, random weapon mod" }
      ]
    },
    "Neon City": {
      locations: ["under neon arches", "through VR corridors", "above the skyline clubs"],
      sights: ["The Circuit Cafe", "The Mirage Market", "The Skyline Club"],
      descriptions: ["holo ads flood every street", "music leaks from underground venues", "street racers own midnight"],
      features: ["performers and fixers", "club syndicates", "brand agents"],
      flora: ["pixel-bloom", "chrome leaf", "led-fiber vine"],
      fauna: ["tag cats", "neon ferrets", "holo sparrows"],
      land: ["vertical skyways", "metro relics", "club rooftops"],
      weather: ["neon drizzle", "static wind", "light haze"],
      events: [
        { title: "Arena Broadcast Hijack", text: "A live event feed is seized mid-show.", action: "Retake the broadcast", reward: "+1 Axiom Cartel, random luxury loot" },
        { title: "Race Route Ambush", text: "A gang rigs a race corridor with traps.", action: "Clear the route", reward: "+1 Veil Runners, 250 credits" }
      ]
    },
    "Outskirts": {
      locations: ["on broken overpasses", "across dry lake beds", "inside scrap mazes"],
      sights: ["The Echo Tower", "The Iron Garden", "The Last Depot"],
      descriptions: ["wind whips through rust skeletons", "nomad caravans trade under tarps", "old rail maps still guide survivors"],
      features: ["scavenger camps", "water traders", "route scouts"],
      flora: ["dust scrub", "irradiated bloom", "solar moss"],
      fauna: ["outlaw raptors", "sand crawlers", "scrap dogs"],
      land: ["dry flats", "junk hills", "open roads"],
      weather: ["dust storms", "hard heat", "cold nights"],
      events: [
        { title: "Caravan Distress", text: "A convoy goes dark beyond checkpoint seven.", action: "Escort recovery", reward: "+1 Dust Saints, random trade loot" },
        { title: "Silo Raiders", text: "Raiders breach a refugee silo node.", action: "Hold the line", reward: "+1 Titan Crown, 180 credits" }
      ]
    },
    "Residential Blocks": {
      locations: ["inside tower stacks", "over hanging markets", "through waterworks halls"],
      sights: ["The Skyline Garden", "The Community Hall", "The Cascade"],
      descriptions: ["families crowd skybridges", "market lights glow through rain", "maintenance drones hum all night"],
      features: ["tenant councils", "local traders", "block wardens"],
      flora: ["rooftop herbs", "hydro lettuce", "skybridge fern"],
      fauna: ["community cats", "tower sparrows", "balcony lizards"],
      land: ["stacked blocks", "courtyard plazas", "service shafts"],
      weather: ["urban warmth", "tower winds", "short rain"],
      events: [
        { title: "Grid Blackout", text: "Three blocks lose power and panic rises.", action: "Restore the node", reward: "+1 Axiom Cartel, random utility loot" },
        { title: "Festival Flashpoint", text: "Two crews clash during a district celebration.", action: "Defuse or dominate", reward: "+1 Helix Union, 150 credits" }
      ]
    },
    "The Undercity": {
      locations: ["inside metro ruins", "through flood tunnels", "beneath iron bunkers"],
      sights: ["The Phantom Platform", "The Gearworks", "The Iron Sanctuary"],
      descriptions: ["wet concrete reflects red light", "old tracks split into forbidden sectors", "voices carry too far in the dark"],
      features: ["black market cells", "cult enclaves", "tunnel guides"],
      flora: ["glow algae", "shadow bloom", "rust roots"],
      fauna: ["ghost rats", "tunnel eels", "iron spiders"],
      land: ["drain channels", "vault chambers", "collapsed rails"],
      weather: ["cold damp", "condensation fog", "stale air"],
      events: [
        { title: "Market Riot", text: "A weapons deal goes violent.", action: "Seize control", reward: "+1 Veil Runners, random contraband" },
        { title: "Cache Rumor", text: "An old war cache is pinged on outlaw channels.", action: "Recover first", reward: "+1 Titan Crown, random armor" }
      ]
    },
    "The Wastes": {
      locations: ["around ruined towers", "inside petrified groves", "near radioactive craters"],
      sights: ["The Sunken Ship", "The Crystal Grove", "The Shield Dome"],
      descriptions: ["sand swallows old roads", "wind reveals and buries ruins hourly", "nomad beacons pulse on distant ridges"],
      features: ["desert clans", "relic hunters", "radiation medics"],
      flora: ["dune grass", "radio bloom", "fossil vine"],
      fauna: ["dust devils", "waste wolves", "irradiated lizards"],
      land: ["salt flats", "dune corridors", "impact basins"],
      weather: ["sandstorm", "dry heat", "ash dust"],
      events: [
        { title: "Storm Wall", text: "A storm front cuts off three routes.", action: "Chart a safe path", reward: "+1 Dust Saints, random survival gear" },
        { title: "Relic Surge", text: "Scanners detect a pre-fall cache opening.", action: "Secure the site", reward: "+1 Helix Union, random relic" }
      ]
    },
    "The Ports": {
      locations: ["under cargo cranes", "inside drydock lanes", "along contraband piers"],
      sights: ["The Spire", "The Silver Galleon", "The Neon Bazaar"],
      descriptions: ["ship horns blend with coded broadcasts", "dock crews move goods at all hours", "smuggler lights pulse beneath boardwalks"],
      features: ["harbor syndicates", "shipwright crews", "broker cells"],
      flora: ["dock algae", "salt vine", "anchor bloom"],
      fauna: ["mechanical crabs", "sea hawks", "manta-drakes"],
      land: ["dock walls", "floating decks", "warehouse lots"],
      weather: ["salt fog", "coastal gale", "humid rain"],
      events: [
        { title: "Auction Breach", text: "A black market auction is compromised.", action: "Raid or protect", reward: "+1 Veil Runners, random rare good" },
        { title: "Harbor Lockdown", text: "Port authority seals all exits.", action: "Smuggle a route open", reward: "+1 Axiom Cartel, 220 credits" }
      ]
    }
  };

  const ZONE_SERVICES = {
    "Cyber Hub": [
      { name: "Data Forge", cost: 40, desc: "Purchase tactical intel packets." },
      { name: "Augment Tune-Up", cost: 60, desc: "Calibrate cyberware for your next scene." }
    ],
    "Green House": [
      { name: "Botanical Therapy", cost: 30, desc: "Recover from stress in a bio-dome clinic." },
      { name: "Gene Med Pack", cost: 45, desc: "Acquire high-grade healing compounds." }
    ],
    "Industrial Sector": [
      { name: "Forge Rental", cost: 50, desc: "Craft or repair heavy equipment." },
      { name: "Convoy Routing", cost: 35, desc: "Secure safer freight pathways." }
    ],
    "Neon City": [
      { name: "VR Drill Suite", cost: 35, desc: "Sim-run combat and infiltration practice." },
      { name: "Holo Venue Access", cost: 25, desc: "Gain social leverage and rumors." }
    ],
    "Outskirts": [
      { name: "Water Purification", cost: 10, desc: "Refill and detox travel supplies." },
      { name: "Salvage Repair", cost: 20, desc: "Patch armor and field devices." }
    ],
    "Residential Blocks": [
      { name: "Community Med Bay", cost: 25, desc: "Stabilize conditions and recover." },
      { name: "Utility Override", cost: 30, desc: "Grant temporary district advantages." }
    ],
    "The Undercity": [
      { name: "Safehouse Access", cost: 20, desc: "Acquire hidden shelter and contacts." },
      { name: "Blackline Cybernetics", cost: 70, desc: "Install illicit combat mods." }
    ],
    "The Wastes": [
      { name: "Expedition Guide", cost: 35, desc: "Reduce travel risk in dead zones." },
      { name: "Rad Clinic", cost: 20, desc: "Treat burns and radiation sickness." }
    ],
    "The Ports": [
      { name: "Dock Maintenance", cost: 25, desc: "Service vessels and cargo rigs." },
      { name: "Night Market Access", cost: 15, desc: "Enter smuggler-only trade channels." }
    ]
  };

  const POWER_SERVICES = {
    "Axiom Cartel": [
      { name: "Corporate Blackline", cost: 90, desc: "Temporary clearance and legal cover." }
    ],
    "Helix Union": [
      { name: "Bio-Loop Recovery", cost: 80, desc: "Remove one harmful condition." }
    ],
    "Titan Crown": [
      { name: "Militia Contract", cost: 75, desc: "Call district security reinforcement." }
    ],
    "Veil Runners": [
      { name: "Ghost Courier", cost: 45, desc: "Fast covert delivery and route intel." }
    ],
    "Dust Saints": [
      { name: "Ash Ward", cost: 35, desc: "Protect against one hazard this day." }
    ]
  };

  const HOLDING_NAMES = {
    "Axiom Cartel": ["Axiom Data Spire", "Cipher Court"],
    "Helix Union": ["Helix Gene Vault", "Verdant Coil Lab"],
    "Titan Crown": ["Titan Bastion", "Iron Marshal Keep"],
    "Veil Runners": ["Veil Relay", "Silent Circuit Den"],
    "Dust Saints": ["Ash Reliquary", "Dustward Shrine"]
  };

  const POWER_TASKS = {
    "Axiom Cartel": ["Extract encrypted executive ledger", "Deploy a spoof beacon in rival district", "Escort a data courier through hostile blocks"],
    "Helix Union": ["Recover stolen biotech vials", "Stabilize a failing genome reactor", "Audit a corrupted med node"],
    "Titan Crown": ["Hold perimeter during civic unrest", "Retake a seized logistics hub", "Lead militia convoy to safe quarter"],
    "Veil Runners": ["Deliver contraband through scanners", "Intercept rival whisper channel", "Plant a false route packet"],
    "Dust Saints": ["Recover relic from storm trench", "Protect pilgrims crossing dead zone", "Sanctify an irradiated water source"]
  };

  function safePick(list, fallback) {
    if (!Array.isArray(list) || !list.length) return fallback;
    if (typeof pick === "function") return pick(list);
    return list[Math.floor(Math.random() * list.length)];
  }

  function safeRoll(max) {
    if (typeof roll === "function") return roll(max);
    return Math.floor(Math.random() * max) + 1;
  }

  function getCredits() {
    if (typeof S === "undefined") return 0;
    return typeof S.credits === "number" ? S.credits : 0;
  }

  function setCredits(v) {
    if (typeof S === "undefined") return;
    S.credits = Math.max(0, v);
    if (typeof renderUI === "function") renderUI();
  }

  function canAfford(cost) {
    return getCredits() >= cost;
  }

  function spendCredits(cost, reason) {
    if (!canAfford(cost)) {
      if (typeof showNotif === "function") showNotif("Not enough Credits for " + reason + ".", "warn");
      return false;
    }
    setCredits(getCredits() - cost);
    return true;
  }

  function ensurePowerRenown() {
    if (typeof S === "undefined") return;
    S.powerRenown = S.powerRenown || {};
    HOLDERS.forEach(function (name) {
      if (typeof S.powerRenown[name] !== "number") S.powerRenown[name] = 0;
    });
  }

  function addPowerRenown(power, amount) {
    ensurePowerRenown();
    if (typeof S === "undefined") return;
    S.powerRenown[power] = (S.powerRenown[power] || 0) + (amount || 1);
    if (typeof showNotif === "function") showNotif("+" + (amount || 1) + " renown with " + power + ".", "good");
  }

  function grantRandomLoot(tier) {
    if (typeof rollForLoot === "function") {
      const loot = rollForLoot(tier || "medium");
      if (loot && loot.length && typeof showNotif === "function") {
        showNotif("Loot: " + loot.join(", "), "good");
      }
      return;
    }
    if (typeof showNotif === "function") showNotif("Loot granted.", "good");
  }

  function advanceWorldTime(reason) {
    if (typeof S === "undefined") return;
    S.day = (typeof S.day === "number" ? S.day : 1) + 1;
    if (typeof S.phase === "number") {
      S.phase = (S.phase + 1) % 4;
    }
    if (typeof showNotif === "function") showNotif("Time advanced: " + reason + ".", "good");
    if (typeof renderUI === "function") renderUI();
  }

  function ensureWorldState() {
    if (typeof S === "undefined") return null;
    ensurePowerRenown();

    S.worldThatWas = S.worldThatWas || {};
    const w = S.worldThatWas;

    w.controllers = w.controllers || HOLDERS.slice();
    w.majorPowers = w.majorPowers || MAJOR_POWERS.slice();
    w.factions = w.factions || FACTIONS.slice();
    w.playerAlignedPower = w.playerAlignedPower || MAJOR_POWERS[0];

    w.hexes = Array.isArray(w.hexes) ? w.hexes : [];
    w.zones = Array.isArray(w.zones) ? w.zones : [];
    w.markers = w.markers || {};
    w.selectedHexId = w.selectedHexId || null;
    w.tick = typeof w.tick === "number" ? w.tick : 0;
    w.generated = !!w.generated;
    w.schemaVersion = typeof w.schemaVersion === "number" ? w.schemaVersion : 1;

    w.trainZones = Array.isArray(w.trainZones) ? w.trainZones : [];
    w.currentZone = w.currentZone || "Cyber Hub";

    w.holdings = Array.isArray(w.holdings) ? w.holdings : [];
    w.activeTasks = Array.isArray(w.activeTasks) ? w.activeTasks : [];

    w.skirmishState = w.skirmishState || {
      activeHexId: null,
      round: 1,
      armyAStress: null,
      armyBStress: null,
      armyAActions: 2,
      armyBActions: 2,
      armyADread: null,
      armyBDread: null
    };

    // Migrate legacy world data (old 45-hex map) to the new 12x12 schema.
    if (w.schemaVersion < WTW_SCHEMA_VERSION || (Array.isArray(w.hexes) && w.hexes.length && w.hexes.length !== MAP_COLS * MAP_ROWS)) {
      w.hexes = [];
      w.zones = [];
      w.markers = {};
      w.generated = false;
      w.selectedHexId = null;
      w.trainZones = [];
      w.currentZone = "Cyber Hub";
      w.holdings = [];
      w.activeTasks = [];
      w.skirmishState = {
        activeHexId: null,
        round: 1,
        armyAStress: null,
        armyBStress: null,
        armyAActions: 2,
        armyBActions: 2,
        armyADread: null,
        armyBDread: null
      };
    }
    w.schemaVersion = WTW_SCHEMA_VERSION;

    return w;
  }

  function buildDistrictNarrative(zoneName) {
    const zf = ZONE_FLAVOR[zoneName] || ZONE_FLAVOR["Cyber Hub"];
    return {
      location: safePick(zf.locations, "a contested district"),
      sight: safePick(zf.sights, "flickering lights"),
      description: safePick(zf.descriptions, "the district is unstable"),
      feature: safePick(zf.features, "survivors"),
      flora: safePick(zf.flora, "steel moss"),
      fauna: safePick(zf.fauna, "scrap hounds"),
      land: safePick(zf.land, "broken roads"),
      weather: safePick(zf.weather, "cold rain"),
      event: Object.assign({}, safePick(zf.events, zf.events[0]))
    };
  }

  function mapZoneFromCoord(col, row) {
    const c = Math.floor(col / 4);
    const r = Math.floor(row / 4);
    const zoneIndex = r * 3 + c;
    return ZONE_NAMES[Math.max(0, Math.min(zoneIndex, ZONE_NAMES.length - 1))];
  }

  function districtName(zoneName, idx) {
    return zoneName + " District " + (idx + 1);
  }

  function generateHoldings(w) {
    w.holdings = [];
    HOLDERS.forEach(function (power) {
      const names = HOLDING_NAMES[power] || [power + " Holding"];
      const zoneName = safePick(ZONE_NAMES, ZONE_NAMES[0]);
      const zoneHexes = w.hexes.filter(function (h) { return h.zone === zoneName; });
      const homeHex = safePick(zoneHexes, zoneHexes[0]);
      if (!homeHex) return;
      w.holdings.push({
        id: "holding-" + power.replace(/\s+/g, "-").toLowerCase(),
        power: power,
        name: safePick(names, names[0]),
        zone: zoneName,
        hexId: homeHex.id,
        mood: safePick(["Under pressure", "Prosperous", "Mobilizing", "Covert", "Defensive"], "Stable"),
        crisis: safePick(["Supply line interference", "Insider sabotage", "Skirmish spillover", "Power deficit", "Intel blackout"], "No crisis")
      });
    });
  }

  function generateWorldThatWasMap() {
    const w = ensureWorldState();
    if (!w) return;

    w.hexes = [];
    w.zones = [];

    const zoneBucket = {};
    ZONE_NAMES.forEach(function (z) {
      zoneBucket[z] = [];
      w.zones.push({
        name: z,
        color: ZONE_COLORS[z] || "#888",
        hexIds: [],
        controlBreakdown: {},
        leader: HOLDERS[0],
        stationHexId: null
      });
    });

    let idxByZone = {};
    ZONE_NAMES.forEach(function (z) { idxByZone[z] = 0; });

    for (let row = 0; row < MAP_ROWS; row += 1) {
      for (let col = 0; col < MAP_COLS; col += 1) {
        const zoneName = mapZoneFromCoord(col, row);
        const n = buildDistrictNarrative(zoneName);
        const hexId = "wtw-" + col + "-" + row;
        const hex = {
          id: hexId,
          zone: zoneName,
          district: districtName(zoneName, idxByZone[zoneName]),
          districtIndex: idxByZone[zoneName],
          col: col,
          row: row,
          controller: safePick(HOLDERS, HOLDERS[0]),
          skirmish: safeRoll(100) <= 16,
          narrative: n,
          station: false,
          markerType: null,
          serviceRefresh: safeRoll(100) <= 55
        };
        idxByZone[zoneName] += 1;
        w.hexes.push(hex);
        zoneBucket[zoneName].push(hexId);
      }
    }

    w.zones.forEach(function (z) {
      z.hexIds = zoneBucket[z.name] || [];
    });

    assignTrainStations();
    generateHoldings(w);
    syncWorldMarkers();
    updateZoneControl();

    w.tick = 1;
    w.generated = true;
    w.currentZone = "Cyber Hub";
    const startHex = w.hexes.find(function (h) { return h.zone === w.currentZone; });
    w.selectedHexId = startHex ? startHex.id : (w.hexes[0] && w.hexes[0].id);

    renderWorldThatWas();
  }

  function assignTrainStations() {
    const w = ensureWorldState();
    if (!w) return;
    w.trainZones = [];

    w.hexes.forEach(function (h) { h.station = false; });

    w.zones.forEach(function (zone) {
      const zoneHexes = w.hexes.filter(function (h) { return h.zone === zone.name; });
      const stationHex = safePick(zoneHexes, zoneHexes[0]);
      if (stationHex) {
        stationHex.station = true;
        zone.stationHexId = stationHex.id;
        w.trainZones.push(zone.name);
      }
    });
  }

  function updateZoneControl() {
    const w = ensureWorldState();
    if (!w) return;

    w.zones.forEach(function (zone) {
      const counts = {};
      zone.hexIds.forEach(function (hexId) {
        const hex = w.hexes.find(function (h) { return h.id === hexId; });
        if (!hex) return;
        counts[hex.controller] = (counts[hex.controller] || 0) + 1;
      });
      zone.controlBreakdown = counts;

      let leader = HOLDERS[0];
      let top = -1;
      Object.keys(counts).forEach(function (name) {
        if (counts[name] > top) {
          top = counts[name];
          leader = name;
        }
      });
      zone.leader = leader;
    });
  }

  function syncWorldMarkers() {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;

    w.markers = {};

    const missionPool = w.hexes.slice();
    function takeHex() {
      if (!missionPool.length) return null;
      const ix = safeRoll(missionPool.length) - 1;
      return missionPool.splice(ix, 1)[0];
    }

    (S.activeMissions || []).slice(0, 8).forEach(function (m) {
      const hex = takeHex();
      if (!hex) return;
      w.markers[hex.id] = { type: "mission", title: m.title || "Mission", subtitle: "Live mission marker" };
      hex.markerType = "mission";
    });

    w.activeTasks.slice(0, 8).forEach(function (t) {
      const hex = takeHex();
      if (!hex) return;
      w.markers[hex.id] = { type: "task", title: t.title, subtitle: "Holding task" };
      hex.markerType = "task";
    });

    w.hexes.forEach(function (hex) {
      if (!w.markers[hex.id]) {
        hex.markerType = safeRoll(100) <= 12 ? "job" : null;
        if (hex.markerType === "job") {
          w.markers[hex.id] = { type: "job", title: "District Job", subtitle: "Quick contract available" };
        }
      }
    });
  }

  function controllerColor(name) {
    const majorIdx = MAJOR_POWERS.indexOf(name);
    if (majorIdx === 0) return "#6dc7ff";
    if (majorIdx === 1) return "#70d96f";
    if (majorIdx === 2) return "#f8bb57";
    const factionIdx = FACTIONS.indexOf(name);
    if (factionIdx === 0) return "#d870c5";
    if (factionIdx === 1) return "#d85a5a";
    return "#999";
  }

  function hexToPixel(col, row) {
    const width = WTW_HEX * 2;
    const height = Math.sqrt(3) * WTW_HEX;
    return {
      x: col * width * 0.75 + WTW_HEX + 20,
      y: row * height + (col % 2) * height / 2 + WTW_HEX + 16
    };
  }

  function hexPoints(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i += 1) {
      const a = Math.PI / 180 * (60 * i - 30);
      pts.push((cx + (WTW_HEX - 1) * Math.cos(a)) + "," + (cy + (WTW_HEX - 1) * Math.sin(a)));
    }
    return pts.join(" ");
  }

  function renderWorldThatWasMap() {
    const w = ensureWorldState();
    const svg = document.getElementById("wtwMapSvg");
    if (!svg || !w) return;

    if (!w.generated || !w.hexes.length) {
      svg.setAttribute("width", "900");
      svg.setAttribute("height", "740");
      svg.innerHTML = "<text x='400' y='240' text-anchor='middle' font-family='Cinzel,serif' font-size='14' fill='#2f4457'>Generate The World That Was to begin</text>";
      return;
    }

    const svgW = 980;
    const svgH = 760;
    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(svgH));
    svg.innerHTML = "";

    w.hexes.forEach(function (hex) {
      const p = hexToPixel(hex.col, hex.row);
      const zone = w.zones.find(function (z) { return z.name === hex.zone; });
      const marker = w.markers[hex.id];

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "svg-hex" + (w.selectedHexId === hex.id ? " sel" : ""));

      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", hexPoints(p.x, p.y));
      poly.setAttribute("fill", "rgba(20,28,34,.85)");
      poly.setAttribute("stroke", zone ? zone.color : "#8e8e8e");
      poly.setAttribute("stroke-width", w.selectedHexId === hex.id ? "2.8" : "1.2");
      g.appendChild(poly);

      const owner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      owner.setAttribute("cx", String(p.x));
      owner.setAttribute("cy", String(p.y));
      owner.setAttribute("r", "5.5");
      owner.setAttribute("fill", controllerColor(hex.controller));
      owner.setAttribute("stroke", "#111");
      owner.setAttribute("stroke-width", "1");
      owner.setAttribute("pointer-events", "none");
      g.appendChild(owner);

      if (hex.skirmish) {
        const sk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sk.setAttribute("x", String(p.x - 12));
        sk.setAttribute("y", String(p.y - 7));
        sk.setAttribute("font-size", "11");
        sk.setAttribute("fill", "#e05050");
        sk.setAttribute("pointer-events", "none");
        sk.textContent = "X";
        g.appendChild(sk);
      }

      if (hex.station) {
        const st = document.createElementNS("http://www.w3.org/2000/svg", "text");
        st.setAttribute("x", String(p.x - 4));
        st.setAttribute("y", String(p.y + 15));
        st.setAttribute("font-size", "9");
        st.setAttribute("fill", "#7ed7ff");
        st.setAttribute("pointer-events", "none");
        st.textContent = "T";
        g.appendChild(st);
      }

      if (marker) {
        const mk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        mk.setAttribute("x", String(p.x + 8));
        mk.setAttribute("y", String(p.y - 8));
        mk.setAttribute("font-size", "10");
        mk.setAttribute("fill", marker.type === "mission" ? "#e8c050" : marker.type === "task" ? "#46c4b6" : "#bbbbbb");
        mk.setAttribute("pointer-events", "none");
        mk.textContent = marker.type === "mission" ? "!" : marker.type === "task" ? "T" : "$";
        g.appendChild(mk);
      }

      g.addEventListener("click", function () {
        w.selectedHexId = hex.id;
        renderWorldThatWas();
      });

      svg.appendChild(g);
    });
  }

  function getSelectedHex() {
    const w = ensureWorldState();
    if (!w) return null;
    return w.hexes.find(function (hex) { return hex.id === w.selectedHexId; }) || null;
  }

  function zoneForHex(hex) {
    const w = ensureWorldState();
    return w.zones.find(function (z) { return z.name === hex.zone; });
  }

  function zoneServicesForHex(hex) {
    const z = zoneForHex(hex);
    if (!z) return [];
    const total = z.hexIds.length || 1;
    const owned = z.controlBreakdown[z.leader] || 0;
    const dominance = owned / total;

    const base = (ZONE_SERVICES[z.name] || []).slice();
    const power = (POWER_SERVICES[z.leader] || []).slice();

    return dominance >= 0.5 ? base.concat(power) : base.concat(power.slice(0, 1));
  }

  function spendService(hexId, serviceIdx) {
    const w = ensureWorldState();
    if (!w) return;
    const hex = w.hexes.find(function (h) { return h.id === hexId; });
    if (!hex) return;
    const services = zoneServicesForHex(hex);
    const svc = services[serviceIdx];
    if (!svc) return;
    if (!spendCredits(svc.cost, svc.name)) return;

    const resultRoll = safeRoll(100);
    if (resultRoll <= 35) {
      grantRandomLoot("easy");
    } else if (resultRoll <= 70) {
      if (typeof changeCounter === "function") changeCounter("renown", 1);
      if (typeof showNotif === "function") showNotif("Service success: +1 Renown.", "good");
    } else {
      if (typeof showNotif === "function") showNotif("Service complete: utility benefit applied.", "good");
    }

    if (hex.serviceRefresh && safeRoll(100) <= 25) {
      hex.narrative.event = Object.assign({}, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));
      if (typeof showNotif === "function") showNotif("District activity changed after service interaction.", "good");
    }

    advanceWorldTime("service action");
    renderWorldThatWas();
  }

  function resolveZoneEvent(hexId) {
    const w = ensureWorldState();
    if (!w) return;
    const hex = w.hexes.find(function (h) { return h.id === hexId; });
    if (!hex) return;

    const advDie = (S.stats && S.stats.adventure) ? S.stats.adventure : 6;
    const dreadDie = 8;
    const a = (typeof explodingRoll === "function") ? explodingRoll(advDie) : { total: safeRoll(advDie) };
    const d = (typeof explodingRoll === "function") ? explodingRoll(dreadDie) : { total: safeRoll(dreadDie) };
    const success = a.total >= d.total;

    if (success) {
      const zone = zoneForHex(hex);
      addPowerRenown(zone ? zone.leader : MAJOR_POWERS[0], 1);
      grantRandomLoot("medium");
      if (typeof showNotif === "function") showNotif("Event resolved: " + hex.narrative.event.title + ".", "good");
    } else if (typeof showNotif === "function") {
      showNotif("Event failed: pressure in district rises.", "warn");
      hex.skirmish = true;
    }

    advanceWorldTime("event resolution");
    updateZoneControl();
    syncWorldMarkers();
    renderWorldThatWas();
  }

  function collectMarkerJob(hexId) {
    const w = ensureWorldState();
    if (!w) return;
    const marker = w.markers[hexId];
    if (!marker) return;

    const hex = w.hexes.find(function (h) { return h.id === hexId; });
    if (!hex) return;

    if (marker.type === "mission") {
      if (typeof showNotif === "function") showNotif("Mission marker reviewed. See Missions tab for full objective.", "good");
    } else if (marker.type === "task") {
      const task = w.activeTasks.find(function (t) { return t.hexId === hexId; }) || w.activeTasks[0];
      if (task) {
        completeHoldingTask(task.id);
        return;
      }
    } else {
      if (typeof showNotif === "function") showNotif("District job completed. +80 Credits.", "good");
      setCredits(getCredits() + 80);
      delete w.markers[hexId];
    }

    advanceWorldTime("district marker");
    renderWorldThatWas();
  }

  function setupSkirmishForHex(hexId) {
    const w = ensureWorldState();
    if (!w) return;
    const hex = w.hexes.find(function (h) { return h.id === hexId; });
    if (!hex || !hex.skirmish) return;

    const st = w.skirmishState;
    st.activeHexId = hexId;
    st.round = 1;
    st.armyAActions = 2;
    st.armyBActions = 2;
    st.armyAStress = safeRoll(12) + safeRoll(12);
    st.armyBStress = safeRoll(12) + safeRoll(12);
    st.armyADread = st.armyAStress >= 13 ? 6 : 4;
    st.armyBDread = st.armyBStress >= 13 ? 6 : 4;

    renderWorldThatWas();
  }

  function skirmishActionInInfo(side, action) {
    const w = ensureWorldState();
    if (!w) return;
    const st = w.skirmishState;
    if (!st.activeHexId) return;

    const isA = side === "A";
    const myActions = isA ? "armyAActions" : "armyBActions";
    const oppStress = isA ? "armyBStress" : "armyAStress";
    const myDread = isA ? "armyADread" : "armyBDread";

    if (st[myActions] <= 0) {
      if (typeof showNotif === "function") showNotif("No actions left for that side.", "warn");
      return;
    }

    st[myActions] -= 1;
    const rollVal = safeRoll(12);
    const dread = st[myDread] || 6;

    if (action === "strike" && rollVal >= dread) {
      st[oppStress] = Math.max(0, st[oppStress] - Math.max(1, rollVal - dread));
    } else if (action === "frighten" && safeRoll(12) >= dread) {
      st[oppStress] = Math.max(0, st[oppStress] - 1);
    }

    if (st.armyAActions === 0 && st.armyBActions === 0) {
      st.round += 1;
      st.armyAActions = 2;
      st.armyBActions = 2;
    }

    if (st.armyAStress <= 0 || st.armyBStress <= 0) {
      finishSkirmishOutcome(st.armyBStress <= 0);
      return;
    }

    renderWorldThatWas();
  }

  function finishSkirmishOutcome(playerWin) {
    const w = ensureWorldState();
    if (!w) return;
    const st = w.skirmishState;
    const hex = w.hexes.find(function (h) { return h.id === st.activeHexId; });
    if (!hex) return;

    if (playerWin) {
      hex.controller = w.playerAlignedPower;
      hex.skirmish = false;
      if (typeof changeCounter === "function") changeCounter("renown", 1);
      addPowerRenown(w.playerAlignedPower, 1);
      grantRandomLoot("medium");
      if (typeof showNotif === "function") showNotif("Skirmish won in " + hex.zone + ".", "good");
    } else if (typeof showNotif === "function") {
      showNotif("Skirmish unresolved. Enemy holds.", "warn");
    }

    st.activeHexId = null;
    updateZoneControl();
    advanceWorldTime("skirmish");
    renderWorldThatWas();
  }

  function quickResolveWorldSkirmish() {
    const w = ensureWorldState();
    const hex = getSelectedHex();
    if (!w || !hex || !hex.skirmish) return;

    const adv = (S.stats && S.stats.adventure) ? S.stats.adventure : 6;
    const a = safeRoll(adv);
    const d = safeRoll(8);
    finishSkirmishOutcome(a >= d);
  }

  function openWorldSkirmishCombat() {
    const hex = getSelectedHex();
    if (!hex) return;
    if (typeof setEnemyDread === "function") setEnemyDread(hex.skirmish ? 8 : 6);
    if (typeof startCombat === "function") startCombat();
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('combat'\"]");
    if (typeof switchTab === "function") switchTab("combat", btn || null);
  }

  function createHoldingTask(holdingId) {
    const w = ensureWorldState();
    if (!w) return;
    const h = w.holdings.find(function (x) { return x.id === holdingId; });
    if (!h) return;

    const taskId = "task-" + Date.now() + "-" + safeRoll(9999);
    const title = safePick(POWER_TASKS[h.power], "Run district operation");
    const zoneHexes = w.hexes.filter(function (hex) { return hex.zone === h.zone; });
    const taskHex = safePick(zoneHexes, zoneHexes[0]);

    const t = {
      id: taskId,
      holdingId: holdingId,
      power: h.power,
      title: title,
      hexId: taskHex ? taskHex.id : null,
      status: "active"
    };

    w.activeTasks.unshift(t);
    syncWorldMarkers();
    if (typeof showNotif === "function") showNotif("Task accepted: " + title + ".", "good");
    renderWorldThatWas();
  }

  function completeHoldingTask(taskId) {
    const w = ensureWorldState();
    if (!w) return;
    const t = w.activeTasks.find(function (x) { return x.id === taskId; });
    if (!t) return;

    t.status = "done";
    addPowerRenown(t.power, 1);
    grantRandomLoot("medium");

    if (typeof showNotif === "function") {
      showNotif("Holding task completed for " + t.power + ".", "good");
    }

    w.activeTasks = w.activeTasks.filter(function (x) { return x.id !== taskId; });
    syncWorldMarkers();
    advanceWorldTime("holding task");
    renderWorldThatWas();
  }

  function travelByTrainTo(zoneName) {
    const w = ensureWorldState();
    if (!w) return;
    if (w.currentZone === zoneName) {
      if (typeof showNotif === "function") showNotif("Already in " + zoneName + ".", "warn");
      return;
    }

    if (!spendCredits(30, "train travel")) return;

    w.currentZone = zoneName;
    const zone = w.zones.find(function (z) { return z.name === zoneName; });
    if (zone && zone.stationHexId) {
      w.selectedHexId = zone.stationHexId;
    }

    advanceWorldTime("train travel");
    if (typeof showNotif === "function") showNotif("Traveled by rail to " + zoneName + " for 30 Credits.", "good");
    renderWorldThatWas();
  }

  function advanceWorldThatWas() {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;

    w.tick += 1;

    const shifts = Math.max(2, safeRoll(5));
    for (let i = 0; i < shifts; i += 1) {
      const target = safePick(w.hexes, null);
      if (!target) break;
      target.controller = safePick(HOLDERS, target.controller);
      if (safeRoll(100) <= 33) target.skirmish = true;
    }

    w.hexes.forEach(function (hex) {
      if (!hex.skirmish && safeRoll(100) <= 9) hex.skirmish = true;
      if (hex.skirmish && safeRoll(100) <= 18) hex.skirmish = false;
      if (safeRoll(100) <= 10) {
        hex.narrative.event = Object.assign({}, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));
      }
    });

    updateZoneControl();
    syncWorldMarkers();
    advanceWorldTime("control cycle");
    renderWorldThatWas();
  }

  function renderPowerReadout() {
    const w = ensureWorldState();
    const wrap = document.getElementById("wtwPowerReadout");
    if (!wrap || !w) return;

    const chips = HOLDERS.map(function (name) {
      let count = 0;
      w.hexes.forEach(function (hex) { if (hex.controller === name) count += 1; });
      return "<span class='sea-chip' style='border-color:" + controllerColor(name) + ";color:" + controllerColor(name) + ";'>" + name + ": " + count + "</span>";
    }).join(" ");

    wrap.innerHTML = chips;
  }

  function renderHoldingsPanel(hex) {
    const w = ensureWorldState();
    if (!w || !hex) return "";

    const holdings = w.holdings.filter(function (h) { return h.zone === hex.zone; });
    if (!holdings.length) return "<div style='font-size:.74rem;color:var(--muted2);'>No power holdings registered in this zone.</div>";

    return holdings.map(function (h) {
      return ""
        + "<div class='npc-block' style='margin-bottom:.35rem;'>"
        + "<div class='nb-label'>" + h.name + " · " + h.power + "</div>"
        + "<div style='font-size:.77rem;color:var(--muted3);line-height:1.45;'>"
        + "Mood: " + h.mood + "<br>Crisis: " + h.crisis + ""
        + "</div>"
        + "<div style='margin-top:.3rem;display:flex;gap:.25rem;flex-wrap:wrap;'>"
        + "<button class='btn btn-xs btn-primary' onclick='wtwTakeHoldingTask(\"" + h.id + "\")'>Take Task</button>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderActiveTasksPanel() {
    const w = ensureWorldState();
    if (!w) return "";

    if (!w.activeTasks.length) {
      return "<div style='font-size:.74rem;color:var(--muted2);'>No active holding tasks.</div>";
    }

    return w.activeTasks.slice(0, 5).map(function (t) {
      return ""
        + "<div class='npc-block' style='margin-bottom:.3rem;'>"
        + "<div class='nb-label'>" + t.title + "</div>"
        + "<div style='font-size:.76rem;color:var(--muted3);'>Power: " + t.power + "</div>"
        + "<div style='margin-top:.25rem;display:flex;gap:.25rem;flex-wrap:wrap;'>"
        + "<button class='btn btn-xs btn-teal' onclick='wtwCompleteTask(\"" + t.id + "\")'>Complete</button>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderSkirmishWidget(hex) {
    const w = ensureWorldState();
    if (!w || !hex || !hex.skirmish) {
      return "<div style='font-size:.74rem;color:var(--muted2);margin-bottom:.4rem;'>No active skirmish in this district.</div>";
    }

    const st = w.skirmishState || {};
    const ready = st.activeHexId === hex.id;

    if (!ready) {
      return ""
        + "<div class='npc-block' style='margin-bottom:.45rem;border-color:rgba(224,80,80,.45);background:rgba(224,80,80,.08);'>"
        + "<div class='nb-label' style='color:#e05050;'>Active Skirmish</div>"
        + "<div style='font-size:.78rem;color:var(--muted3);margin-bottom:.3rem;'>Initialize skirmish controls in this panel, or open full Combat tab.</div>"
        + "<div style='display:flex;gap:.3rem;flex-wrap:wrap;'>"
        + "<button class='btn btn-xs btn-red' onclick='wtwInitSkirmish()'>Init Skirmish Controls</button>"
        + "<button class='btn btn-xs btn-teal' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button>"
        + "<button class='btn btn-xs' onclick='resolveWorldSkirmish()'>Quick Resolve</button>"
        + "</div>"
        + "</div>";
    }

    return ""
      + "<div class='npc-block' style='margin-bottom:.45rem;border-color:rgba(224,80,80,.45);background:rgba(224,80,80,.08);'>"
      + "<div class='nb-label' style='color:#e05050;'>Skirmish Controls (Info Panel)</div>"
      + "<div style='font-size:.74rem;color:var(--muted3);margin-bottom:.28rem;'>Round " + st.round + " · Actions reset together at 0/0.</div>"
      + "<div style='display:grid;grid-template-columns:1fr 1fr;gap:.4rem;'>"
      + "<div>"
      + "<div style='font-size:.74rem;color:var(--text2);'>Your Army Stress: <strong style='color:var(--teal);'>" + st.armyAStress + "</strong></div>"
      + "<div style='font-size:.72rem;color:var(--muted2);margin-bottom:.2rem;'>Actions: " + st.armyAActions + " · Dread: d" + st.armyADread + "</div>"
      + "<div style='display:flex;gap:.2rem;flex-wrap:wrap;'>"
      + "<button class='btn btn-xs btn-primary' onclick='wtwSkAction(\"A\",\"strike\")'>Strike</button>"
      + "<button class='btn btn-xs btn-teal' onclick='wtwSkAction(\"A\",\"parry\")'>Parry</button>"
      + "<button class='btn btn-xs' onclick='wtwSkAction(\"A\",\"frighten\")'>Frighten</button>"
      + "</div>"
      + "</div>"
      + "<div>"
      + "<div style='font-size:.74rem;color:var(--text2);'>Enemy Army Stress: <strong style='color:var(--red);'>" + st.armyBStress + "</strong></div>"
      + "<div style='font-size:.72rem;color:var(--muted2);margin-bottom:.2rem;'>Actions: " + st.armyBActions + " · Dread: d" + st.armyBDread + "</div>"
      + "<div style='display:flex;gap:.2rem;flex-wrap:wrap;'>"
      + "<button class='btn btn-xs btn-red' onclick='wtwSkAction(\"B\",\"strike\")'>Strike</button>"
      + "<button class='btn btn-xs' onclick='wtwSkAction(\"B\",\"parry\")'>Parry</button>"
      + "<button class='btn btn-xs' onclick='wtwSkAction(\"B\",\"frighten\")'>Frighten</button>"
      + "</div>"
      + "</div>"
      + "</div>"
      + "<div style='margin-top:.3rem;display:flex;gap:.25rem;flex-wrap:wrap;'>"
      + "<button class='btn btn-xs btn-red' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button>"
      + "<button class='btn btn-xs' onclick='resolveWorldSkirmish()'>Quick Resolve</button>"
      + "</div>"
      + "</div>";
  }

  function renderWorldThatWasInfo() {
    const w = ensureWorldState();
    const panel = document.getElementById("wtwInfo");
    if (!panel || !w) return;

    const hex = getSelectedHex();
    if (!hex) {
      panel.innerHTML = "<div class='hex-info-inner'><div style='font-size:.84rem;color:var(--muted2);line-height:1.6;'>Generate the map and select a district hex.</div></div>";
      return;
    }

    const marker = w.markers[hex.id];
    const zone = zoneForHex(hex);
    const services = zoneServicesForHex(hex);
    const n = hex.narrative;

    const servicesHtml = services.map(function (svc, idx) {
      return ""
        + "<div class='npc-block' style='margin-bottom:.25rem;'>"
        + "<div class='nb-label'>" + svc.name + "</div>"
        + "<div style='font-size:.78rem;color:var(--muted3);line-height:1.4;'>Cost: " + svc.cost + " Credits<br>" + svc.desc + "</div>"
        + "<div style='margin-top:.25rem;'><button class='btn btn-xs btn-teal' onclick='wtwBuyService(\"" + hex.id + "\"," + idx + ")'>Use Service</button></div>"
        + "</div>";
    }).join("");

    const controlRows = Object.keys((zone && zone.controlBreakdown) || {}).map(function (name) {
      return "<span style='display:inline-block;margin-right:.4rem;color:" + controllerColor(name) + ";'>" + name + ": " + zone.controlBreakdown[name] + "</span>";
    }).join(" ");

    panel.innerHTML = ""
      + "<div class='hex-info-inner'>"
      + "<div class='hex-type-tag wilderness'>District Hex</div>"
      + "<div class='hex-name'>" + hex.zone + " - " + hex.district + "</div>"
      + "<div class='hex-desc' style='margin-bottom:.45rem;'>Amidst " + n.location + ", the " + n.sight + ", " + n.description + ", serves as a beacon for " + n.feature + ".</div>"
      + "<div class='info-row'><div class='info-cell'><span class='ic-label'>Controller</span>" + hex.controller + "</div><div class='info-cell'><span class='ic-label'>Zone Leader</span>" + ((zone && zone.leader) || "Unknown") + "</div></div>"
      + "<div class='info-row'><div class='info-cell'><span class='ic-label'>Fauna / Flora</span>" + n.fauna + " / " + n.flora + "</div><div class='info-cell'><span class='ic-label'>Land / Weather</span>" + n.land + " / " + n.weather + "</div></div>"
      + "<div class='mystery-card' style='margin:.45rem 0;'><strong>Random Event:</strong> " + n.event.title + "<br>" + n.event.text + "<br><br><strong>Action:</strong> " + n.event.action + "<br><strong>Reward:</strong> " + n.event.reward + "<div style='margin-top:.3rem;'><button class='btn btn-xs btn-primary' onclick='wtwResolveEvent(\"" + hex.id + "\")'>Resolve Event</button></div></div>"
      + (marker ? "<div class='npc-block' style='margin-bottom:.45rem;border-color:rgba(201,162,39,.45);background:rgba(201,162,39,.06);'><div class='nb-label'>Marker - " + marker.title + "</div><div style='font-size:.78rem;color:var(--muted3);'>" + marker.subtitle + "</div><div style='margin-top:.28rem;'><button class='btn btn-xs btn-primary' onclick='wtwCollectMarker(\"" + hex.id + "\")'>Resolve Marker</button></div></div>" : "")
      + renderSkirmishWidget(hex)
      + "<div class='sub-label'>District Services</div>"
      + servicesHtml
      + "<div style='margin-top:.5rem;border-top:1px solid var(--border);padding-top:.45rem;font-size:.74rem;color:var(--muted2);'>"
      + "<strong style='color:var(--gold2);'>Control Breakdown:</strong><br>" + controlRows
      + "</div>"
      + "<div style='margin-top:.5rem;border-top:1px solid var(--border);padding-top:.45rem;'>"
      + "<div class='section-title' style='margin-bottom:.4rem;'>Zone Holdings</div>"
      + renderHoldingsPanel(hex)
      + "</div>"
      + "<div style='margin-top:.5rem;border-top:1px solid var(--border);padding-top:.45rem;'>"
      + "<div class='section-title' style='margin-bottom:.4rem;'>Active Tasks</div>"
      + renderActiveTasksPanel()
      + "</div>"
      + "</div>";
  }

  function chooseZone(zoneName) {
    const w = ensureWorldState();
    if (!w) return;
    w.currentZone = zoneName;
    const zone = w.zones.find(function (z) { return z.name === zoneName; });
    if (zone && zone.stationHexId) w.selectedHexId = zone.stationHexId;
    renderWorldThatWas();
  }

  function renderZoneRailControls() {
    const w = ensureWorldState();
    if (!w) return "";

    return ZONE_NAMES.map(function (z) {
      const on = w.currentZone === z;
      return "<button class='btn btn-xs " + (on ? "btn-primary" : "") + "' onclick='wtwTravelRail(\"" + z + "\")'>" + z + (on ? " (Here)" : "") + "</button>";
    }).join(" ");
  }

  function renderWorldThatWas() {
    const w = ensureWorldState();
    if (!w) return;

    const tickEl = document.getElementById("wtwTick");
    const zoneEl = document.getElementById("wtwCurrentZone");
    const railEl = document.getElementById("wtwRailControls");
    if (tickEl) tickEl.textContent = "Cycle " + (w.tick || 0);
    if (zoneEl) zoneEl.textContent = w.currentZone || "Unknown";
    if (railEl) railEl.innerHTML = renderZoneRailControls();

    renderWorldThatWasMap();
    renderWorldThatWasInfo();
    renderPowerReadout();
  }

  function mountWorldThatWasPanel() {
    const panel = document.getElementById("tab-worldthatwas");
    if (!panel) return;

    panel.dataset.mounted = "1";
    panel.innerHTML = ""
      + "<div class='map-controls'>"
      + "<button class='btn btn-primary' onclick='generateWorldThatWasMap()'>Generate World That Was</button>"
      + "<button class='btn' onclick='advanceWorldThatWas()'>Advance Control Cycle</button>"
      + "<button class='btn btn-sm btn-teal' onclick='wtwSyncMarkers()'>Refresh Markers</button>"
      + "<button class='btn btn-sm' onclick='returnWorldToGalaxy()'>Return to Galaxy</button>"
      + "<span style='color:var(--muted2);font-size:.75rem;margin-left:.3rem;'>Current Zone: <strong id='wtwCurrentZone' style='color:var(--gold2);'>-</strong></span>"
      + "<span style='color:var(--muted2);font-size:.75rem;margin-left:.5rem;' id='wtwTick'>Cycle 0</span>"
      + "</div>"
      + "<div class='sea-summary' style='margin-bottom:.5rem;'>"
      + "<div class='info-cell'><span class='ic-label'>Map Rules</span>12x12 districts, 9 mega-zones, dynamic control shifts, train-linked travel.</div>"
      + "<div class='info-cell'><span class='ic-label'>Dynamic Layer</span>Events, services, skirmishes, holdings tasks, mission and job markers.</div>"
      + "<div class='info-cell'><span class='ic-label'>Train Network</span>Travel to any zone station for 30 Credits and +1 time step.</div>"
      + "<div class='info-cell'><span class='ic-label'>Renown</span>Holding tasks and event wins grant +1 power renown and loot.</div>"
      + "</div>"
      + "<div id='wtwRailControls' style='display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.45rem;'></div>"
      + "<div id='wtwPowerReadout' class='sea-group-list' style='margin-bottom:.45rem;'></div>"
      + "<div class='map-layout'>"
      + "<div class='map-scroll'><svg id='wtwMapSvg' width='900' height='740' xmlns='http://www.w3.org/2000/svg'></svg></div>"
      + "<div class='hex-info' id='wtwInfo'></div>"
      + "</div>";
  }

  function returnToGalaxy() {
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('galaxy'\"]");
    if (typeof switchTab === "function") switchTab("galaxy", btn || null);
  }

  function openWorldThatWasFromGalaxy() {
    const w = ensureWorldState();
    if (!w) return;
    mountWorldThatWasPanel();
    if (!w.generated || !w.hexes.length) {
      generateWorldThatWasMap();
    } else {
      renderWorldThatWas();
    }
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('worldthatwas'\"]");
    if (typeof switchTab === "function") switchTab("worldthatwas", btn || null);
  }

  function patchTabSwitch() {
    if (typeof window.switchTab !== "function" || window._wtwSwitchPatched) return;
    window._wtwSwitchPatched = true;
    const base = window.switchTab;
    window.switchTab = function (tabId, btn) {
      const out = base.apply(this, arguments);
      if (tabId === "worldthatwas") {
        mountWorldThatWasPanel();
        const w = ensureWorldState();
        if (w && !w.generated) {
          generateWorldThatWasMap();
        } else {
          renderWorldThatWas();
        }
      }
      return out;
    };
  }

  function patchStarSelection() {
    if (typeof window.selectStarSystemHex !== "function" || window._wtwStarPatched) return;
    window._wtwStarPatched = true;
    const base = window.selectStarSystemHex;
    window.selectStarSystemHex = function (hexId) {
      const out = base.apply(this, arguments);
      if (S && S.starSystem && Array.isArray(S.starSystem.hexes)) {
        const hex = S.starSystem.hexes.find(function (h) { return h.id === hexId; });
        if (hex && hex.kind === "world_that_was") {
          openWorldThatWasFromGalaxy();
        }
      }
      return out;
    };
  }

  function initWorldThatWas() {
    ensureWorldState();
    mountWorldThatWasPanel();
    patchTabSwitch();
    patchStarSelection();
  }

  window.generateWorldThatWasMap = generateWorldThatWasMap;
  window.advanceWorldThatWas = advanceWorldThatWas;
  window.resolveWorldSkirmish = quickResolveWorldSkirmish;
  window.openWorldSkirmishCombat = openWorldSkirmishCombat;
  window.chooseWorldLandingPad = function () {};
  window.returnWorldToGalaxy = returnToGalaxy;

  window.wtwBuyService = spendService;
  window.wtwResolveEvent = resolveZoneEvent;
  window.wtwCollectMarker = collectMarkerJob;
  window.wtwInitSkirmish = function () {
    const hex = getSelectedHex();
    if (hex) setupSkirmishForHex(hex.id);
  };
  window.wtwSkAction = skirmishActionInInfo;
  window.wtwTakeHoldingTask = createHoldingTask;
  window.wtwCompleteTask = completeHoldingTask;
  window.wtwTravelRail = travelByTrainTo;
  window.wtwSyncMarkers = function () {
    syncWorldMarkers();
    renderWorldThatWas();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWorldThatWas);
  } else {
    initWorldThatWas();
  }
})();
