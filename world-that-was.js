// world-that-was.js
(function () {
  const WTW_SCHEMA_VERSION = 4;
  const WTW_HEX = 34;
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
  const ACTION_STATS = ["body", "mind", "spirit", "control", "lead", "strike", "shoot", "defend"];
  const FALLBACK_LOOT = ["Trade Good", "Toolkit", "Remedy", "Scroll", "Weapon Mod", "Armor Plate", "Data Cache", "Relic Shard"];
  const ZONE_DANGER = {
    "Cyber Hub": { eventCombatChance: 30, eventDreadBias: 0, encounterChance: 26, skirmishChance: 14, cycleShiftBonus: 0 },
    "Green House": { eventCombatChance: 20, eventDreadBias: -1, encounterChance: 18, skirmishChance: 10, cycleShiftBonus: -1 },
    "Industrial Sector": { eventCombatChance: 42, eventDreadBias: 1, encounterChance: 35, skirmishChance: 22, cycleShiftBonus: 1 },
    "Neon City": { eventCombatChance: 36, eventDreadBias: 0, encounterChance: 30, skirmishChance: 18, cycleShiftBonus: 0 },
    "Outskirts": { eventCombatChance: 44, eventDreadBias: 1, encounterChance: 37, skirmishChance: 24, cycleShiftBonus: 1 },
    "Residential Blocks": { eventCombatChance: 24, eventDreadBias: -1, encounterChance: 20, skirmishChance: 12, cycleShiftBonus: -1 },
    "The Undercity": { eventCombatChance: 52, eventDreadBias: 2, encounterChance: 42, skirmishChance: 30, cycleShiftBonus: 2 },
    "The Wastes": { eventCombatChance: 58, eventDreadBias: 2, encounterChance: 48, skirmishChance: 34, cycleShiftBonus: 2 },
    "The Ports": { eventCombatChance: 38, eventDreadBias: 0, encounterChance: 32, skirmishChance: 20, cycleShiftBonus: 0 }
  };
  const WORLD_ITEMS = ["water", "meds", "dataDrives", "scrap", "fuelCells"];
  const WTW_CONDITION_KEYS = ["weakened", "distracted", "shaken", "vulnerable"];

  const WTW_MARKER_STYLE = {
    mission: { icon: "!", color: "#e8c050", priority: 100, title: "Mission Marker" },
    task: { icon: "T", color: "#46c4b6", priority: 90, title: "Holding Task" },
    landing: { icon: "L", color: "#7ed7ff", priority: 80, title: "Landing Pad" },
    station: { icon: "R", color: "#7ed7ff", priority: 75, title: "Rail Station" },
    service: { icon: "S", color: "#7ee0b2", priority: 70, title: "District Service" },
    structure: { icon: "B", color: "#c9a227", priority: 68, title: "Explorable Structure" },
    wayfarer: { icon: "W", color: "#d4b8ff", priority: 64, title: "Wayfarer" },
    hazard: { icon: "H", color: "#ff8a72", priority: 60, title: "Hazard" },
    peril: { icon: "P", color: "#ff8070", priority: 59, title: "Peril" },
    barrier: { icon: "B", color: "#ff9066", priority: 58, title: "Barrier" },
    job: { icon: "$", color: "#bbbbbb", priority: 40, title: "District Job" }
  };

  const WTW_STRUCTURE_TYPES = [
    {
      kind: "Watch Tower",
      names: ["Signal Watch", "Glass Relay Tower", "Crow's Lantern Tower", "Spinewatch Bastion"],
      rooms: [
        "Observation Deck - rangefinders sweep every route.",
        "Signal Room - blinking transmitters map district movement.",
        "Gear Loft - spare lenses, coils, and tower tools.",
        "Locked Command Nook - encoded logs and old duty rosters.",
        "Storm Anchor Ring - cables hum in crosswinds."
      ]
    },
    {
      kind: "Archive Building",
      names: ["Broken Civic Archive", "Ledger Vault", "Dustline Registry", "Old Union Hall"],
      rooms: [
        "Records Hall - cabinets toppled into maze-like rows.",
        "Map Room - route plans marked with obsolete borders.",
        "Clerk Station - stamped permits and sealed envelopes.",
        "Microfilm Niche - projector still warm.",
        "Basement Repository - flood marks and intact lockboxes."
      ]
    },
    {
      kind: "Industrial Building",
      names: ["Rivetworks Annex", "Refinery Annex", "Cargo Press House", "Blackline Foundry Wing"],
      rooms: [
        "Assembly Floor - unfinished machinery frozen mid-cycle.",
        "Boiler Gallery - pressure gauges jump without warning.",
        "Crane Control Bay - overhead rails cut through haze.",
        "Maintenance Shaft - narrow ladder into hot darkness.",
        "Dispatch Desk - manifests tagged with priority seals."
      ]
    }
  ];

  const WTW_HAZARDS = [
    { type: "hazard", name: "Toxic Vent Burst", stat: "body", dread: 8, condition: "weakened", desc: "A pressure vent floods the district with chemical steam." },
    { type: "hazard", name: "Signal Overload", stat: "mind", dread: 8, condition: "distracted", desc: "Interference storms fragment concentration and guidance systems." },
    { type: "peril", name: "Riot Swell", stat: "spirit", dread: 8, condition: "shaken", desc: "Panic cascades through alleys and escalates into violence." },
    { type: "barrier", name: "Collapsed Transit Wall", stat: "body", dread: 10, condition: "vulnerable", desc: "Route collapse blocks movement and exposes travelers." },
    { type: "barrier", name: "Checkpoint Blackout", stat: "control", dread: 9, condition: "distracted", desc: "Locked systems seal exits and scramble route data." },
    { type: "peril", name: "Drone Hunt Zone", stat: "defend", dread: 9, condition: "vulnerable", desc: "Hunter drones sweep for movement across open lines." }
  ];

  const WTW_WAYFARER_NAMES = [
    "Rhea Coil", "Jax Meridian", "Old Sable", "Mira Vale", "Korr Dune", "Len Blackwire", "Toma Relic", "Ena Drift"
  ];

  const WTW_WAYFARER_RUMORS = [
    "A hidden service cache opens for one hour after dusk alarms.",
    "Titan Crown patrol routes shifted toward the southern rail.",
    "A relic broker is paying double for pre-fall station maps.",
    "One landing pad is being watched by Veil Runner lookouts.",
    "An old tower keeps broadcasting district control changes.",
    "A sealed archive wing opens when the cycle siren fails."
  ];

  const WTW_WAYFARER_HISTORIES = [
    "Before the fracture, this zone fed the entire coastal ring.",
    "The first rail line here was built by refugee engineers.",
    "The district towers once mirrored a single civic command grid.",
    "The old ports funded half the city's reconstruction era.",
    "This quarter hid resistance cells during the blackout years.",
    "The undercity archives still track forgotten family claims."
  ];

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

  function dangerForZone(zoneName) {
    return ZONE_DANGER[zoneName] || { eventCombatChance: 35, eventDreadBias: 0, encounterChance: 25, skirmishChance: 16, cycleShiftBonus: 0 };
  }

  function ensureWorldInventory() {
    if (typeof S === "undefined") return;
    S.worldInventory = S.worldInventory || {};
    WORLD_ITEMS.forEach(function (k) {
      if (typeof S.worldInventory[k] !== "number") S.worldInventory[k] = 0;
    });
  }

  function addWorldItem(itemKey, amount) {
    ensureWorldInventory();
    if (!S || !S.worldInventory) return;
    const key = String(itemKey || "");
    const add = Math.max(0, amount || 0);
    S.worldInventory[key] = (S.worldInventory[key] || 0) + add;
  }

  function spendWorldItem(itemKey, amount) {
    ensureWorldInventory();
    if (!S || !S.worldInventory) return false;
    const key = String(itemKey || "");
    const need = Math.max(1, amount || 1);
    const have = S.worldInventory[key] || 0;
    if (have < need) return false;
    S.worldInventory[key] = have - need;
    return true;
  }

  function inventoryLabel(key) {
    if (key === "dataDrives") return "Data Drives";
    if (key === "fuelCells") return "Fuel Cells";
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function zoneRepTier(v) {
    if (v >= 10) return "Champion";
    if (v >= 7) return "Trusted";
    if (v >= 4) return "Known";
    if (v >= 1) return "Noted";
    return "Unknown";
  }

  function addZoneReputation(zoneName, amount) {
    const w = ensureWorldState();
    if (!w) return;
    const z = String(zoneName || "Unknown");
    w.zoneReputation = w.zoneReputation || {};
    w.zoneReputation[z] = (w.zoneReputation[z] || 0) + (amount || 1);
  }

  function getActionDie(statKey) {
    if (!S || !S.stats) return 4;
    const die = S.stats[String(statKey || "body").toLowerCase()];
    return typeof die === "number" ? die : 4;
  }

  function statLabel(statKey) {
    const k = String(statKey || "body");
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  function rollAgainstDread(statKey, dreadDie) {
    const ad = getActionDie(statKey);
    const dd = dreadDie || 8;
    const a = (typeof explodingRoll === "function") ? explodingRoll(ad) : { total: safeRoll(ad) };
    const d = (typeof explodingRoll === "function") ? explodingRoll(dd) : { total: safeRoll(dd) };
    return {
      ad: ad,
      dd: dd,
      actionTotal: a.total,
      dreadTotal: d.total,
      success: a.total >= d.total
    };
  }

  function putLootInBackpack(lootName) {
    const item = String(lootName || "Salvage Cache");
    if (typeof addItemToBackpack === "function") {
      try {
        if (addItemToBackpack(item)) return true;
      } catch (err) {}
    }
    if (typeof addToBackpack === "function") {
      try {
        if (addToBackpack(item)) return true;
      } catch (err) {}
    }
    if (!Array.isArray(S.backpack)) S.backpack = ["", "", "", "", "", ""];
    const slot = S.backpack.indexOf("");
    if (slot >= 0) {
      S.backpack[slot] = item;
      const el = document.getElementById("bp" + slot);
      if (el) el.value = item;
      return true;
    }
    return false;
  }

  function buildWorldEvent(zoneName, template) {
    const base = Object.assign({}, template || {});
    const danger = dangerForZone(zoneName);
    if (safeRoll(100) <= danger.eventCombatChance) {
      const dread = Math.max(4, safePick([6, 8, 8, 10], 8) + danger.eventDreadBias);
      const enemies = safePick([1, 2, 2, 3, 4], 2);
      return {
        title: base.title || "District Conflict",
        text: base.text || "Violence erupts across the district.",
        action: base.action || "Engage hostiles",
        reward: base.reward || "Loot and influence",
        mode: "combat",
        enemies: enemies,
        dread: dread,
        enemyHealth: 2 * dread
      };
    }
    return {
      title: base.title || "District Operation",
      text: base.text || "A high-risk operation needs action.",
      action: base.action || "Resolve the operation",
      reward: base.reward || "Loot and influence",
      mode: "skill",
      stat: safePick(ACTION_STATS, "body"),
      dread: Math.max(4, safePick([6, 8, 8, 10], 8) + danger.eventDreadBias)
    };
  }

  function buildDistrictEncounter(zoneName) {
    const zf = ZONE_FLAVOR[zoneName] || ZONE_FLAVOR["Cyber Hub"];
    const evt = safePick(zf.events, zf.events[0]);
    const danger = dangerForZone(zoneName);
    if (safeRoll(100) > danger.encounterChance) return null;
    return buildWorldEvent(zoneName, {
      title: "Encounter: " + (evt && evt.title ? evt.title : "District Surge"),
      text: evt && evt.text ? evt.text : "Unexpected district contact.",
      action: evt && evt.action ? evt.action : "Respond immediately",
      reward: "Immediate loot / control impact"
    });
  }

  function registerWorldAction(reason) {
    const w = ensureWorldState();
    if (!w) return false;
    w.activityClicks = (typeof w.activityClicks === "number" ? w.activityClicks : 0) + 1;
    if (w.activityClicks >= 10) {
      w.activityClicks = 0;
      advanceWorldThatWas(true);
      if (typeof showNotif === "function") {
        showNotif("World pressure built up. Control cycle advanced.", "good");
      }
      return true;
    }
    if (reason && typeof showNotif === "function") {
      showNotif("World activity: " + w.activityClicks + "/10", "good");
    }
    return false;
  }

  function getCredits() {
    if (typeof S === "undefined") return 0;
    return typeof S.credits === "number" ? S.credits : Number(S.credits || 0) || 0;
  }

  function syncCreditsUI() {
    if (typeof updateCreditsUI === "function") {
      updateCreditsUI();
      return;
    }
    if (typeof renderUI === "function") renderUI();
  }

  function setCredits(v) {
    if (typeof S === "undefined") return;
    const next = Math.max(0, Math.floor(Number(v) || 0));
    S.credits = next;
    syncCreditsUI();
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
    let granted = [];
    if (typeof rollForLoot === "function") {
      try {
        const loot = rollForLoot(tier || "medium");
        if (Array.isArray(loot) && loot.length) granted = loot.slice(0, 1);
      } catch (err) {}
    }
    if (!granted.length) {
      granted = [safePick(FALLBACK_LOOT, "Trade Good")];
    }
    const stored = granted.map(function (name) {
      const ok = putLootInBackpack(name);
      return ok ? name + " (Backpack)" : name + " (Backpack Full)";
    });
    if (typeof showNotif === "function") showNotif("Loot: " + stored.join(", "), "good");
    if (typeof renderUI === "function") renderUI();
    return granted;
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
    ensureWorldInventory();

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
    w.minimalMapMode = !!w.minimalMapMode;

    w.holdings = Array.isArray(w.holdings) ? w.holdings : [];
    w.activeTasks = Array.isArray(w.activeTasks) ? w.activeTasks : [];
    w.activityClicks = typeof w.activityClicks === "number" ? w.activityClicks : 0;
    w.zoneReputation = w.zoneReputation || {};
    ZONE_NAMES.forEach(function (z) {
      if (typeof w.zoneReputation[z] !== "number") w.zoneReputation[z] = 0;
    });

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
      w.activityClicks = 0;
      w.zoneReputation = {};
      ZONE_NAMES.forEach(function (z) {
        w.zoneReputation[z] = 0;
      });
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
    const baseEvent = Object.assign({}, safePick(zf.events, zf.events[0]));
    return {
      location: safePick(zf.locations, "a contested district"),
      sight: safePick(zf.sights, "flickering lights"),
      description: safePick(zf.descriptions, "the district is unstable"),
      feature: safePick(zf.features, "survivors"),
      flora: safePick(zf.flora, "steel moss"),
      fauna: safePick(zf.fauna, "scrap hounds"),
      land: safePick(zf.land, "broken roads"),
      weather: safePick(zf.weather, "cold rain"),
      event: buildWorldEvent(zoneName, baseEvent)
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

  function setMarker(w, hex, type, title, subtitle) {
    if (!w || !hex || !type) return;
    const style = WTW_MARKER_STYLE[type] || WTW_MARKER_STYLE.job;
    const current = w.markers[hex.id];
    if (current && (current.priority || 0) > style.priority) return;
    w.markers[hex.id] = {
      type: type,
      title: title || style.title,
      subtitle: subtitle || "",
      priority: style.priority
    };
    hex.markerType = type;
  }

  function pickHexes(zoneHexes, count, blockedIds) {
    const blocked = blockedIds || {};
    const pool = (zoneHexes || []).filter(function (h) { return !blocked[h.id]; });
    const out = [];
    const max = Math.max(0, count || 0);
    while (pool.length && out.length < max) {
      const ix = safeRoll(pool.length) - 1;
      const chosen = pool.splice(ix, 1)[0];
      blocked[chosen.id] = true;
      out.push(chosen);
    }
    return out;
  }

  function createStructureForHex() {
    const kind = safePick(WTW_STRUCTURE_TYPES, WTW_STRUCTURE_TYPES[0]);
    return {
      kind: kind.kind,
      name: safePick(kind.names, kind.kind),
      roomPool: kind.rooms.slice(),
      generatedRooms: []
    };
  }

  function assignDistrictFeatures(w) {
    if (!w) return;
    w.hexes.forEach(function (hex) {
      hex.serviceNode = false;
      hex.landingPad = false;
      hex.hazard = null;
      hex.wayfarer = null;
      hex.structure = null;
    });

    w.zones.forEach(function (zone) {
      const zoneHexes = w.hexes.filter(function (h) { return h.zone === zone.name; });
      const blocked = {};

      const stationHex = zone.stationHexId ? w.hexes.find(function (h) { return h.id === zone.stationHexId; }) : null;
      if (stationHex) blocked[stationHex.id] = true;

      const pads = pickHexes(zoneHexes, 1, blocked);
      if (pads[0]) pads[0].landingPad = true;

      pickHexes(zoneHexes, 2, blocked).forEach(function (hex) { hex.serviceNode = true; });
      pickHexes(zoneHexes, 2, blocked).forEach(function (hex) {
        hex.wayfarer = {
          name: safePick(WTW_WAYFARER_NAMES, "Unknown Wayfarer"),
          rumor: safePick(WTW_WAYFARER_RUMORS, "Routes are shifting tonight."),
          history: safePick(WTW_WAYFARER_HISTORIES, "This district remembers old wars.")
        };
      });
      pickHexes(zoneHexes, 2, blocked).forEach(function (hex) {
        hex.hazard = Object.assign({}, safePick(WTW_HAZARDS, WTW_HAZARDS[0]));
      });
      pickHexes(zoneHexes, 2, blocked).forEach(function (hex) {
        hex.structure = createStructureForHex();
      });
    });
  }

  function generateStructureRooms(hex) {
    if (!hex || !hex.structure) return [];
    const site = hex.structure;
    const roomPool = Array.isArray(site.roomPool) && site.roomPool.length ? site.roomPool : ["Abandoned chamber with mixed salvage and notes."];
    const roomCount = 2 + safeRoll(3);
    const rooms = [];
    for (let i = 0; i < roomCount; i += 1) {
      rooms.push(safePick(roomPool, roomPool[0]));
    }
    site.generatedRooms = rooms;
    return rooms;
  }

  function ensureConditionsState() {
    if (!S) return;
    S.conditions = S.conditions || {};
    WTW_CONDITION_KEYS.forEach(function (key) {
      if (typeof S.conditions[key] !== "boolean") S.conditions[key] = false;
    });
  }

  function applyNegativeCondition(condKey) {
    ensureConditionsState();
    if (!S || !S.conditions) return;
    const key = WTW_CONDITION_KEYS.indexOf(condKey) >= 0 ? condKey : "weakened";
    S.conditions[key] = true;
    if (typeof updateConditionButtons === "function") updateConditionButtons();
    if (typeof updateAllStatDisplays === "function") updateAllStatDisplays();
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
        const danger = dangerForZone(zoneName);
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
          skirmish: safeRoll(100) <= danger.skirmishChance,
          narrative: n,
          station: false,
          landingPad: false,
          serviceNode: false,
          hazard: null,
          wayfarer: null,
          structure: null,
          markerType: null,
          serviceRefresh: safeRoll(100) <= 55,
          encounter: null
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
  assignDistrictFeatures(w);
    generateHoldings(w);
    syncWorldMarkers();
    updateZoneControl();

    if (S && S.worldInventory) {
      if ((S.worldInventory.water || 0) === 0) S.worldInventory.water = 2;
      if ((S.worldInventory.meds || 0) === 0) S.worldInventory.meds = 1;
      if ((S.worldInventory.dataDrives || 0) === 0) S.worldInventory.dataDrives = 1;
      if ((S.worldInventory.scrap || 0) === 0) S.worldInventory.scrap = 2;
      if ((S.worldInventory.fuelCells || 0) === 0) S.worldInventory.fuelCells = 1;
    }

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
    w.hexes.forEach(function (hex) {
      hex.markerType = null;
      if (hex.station) setMarker(w, hex, "station", "Rail Station", "Travel quickly between zones.");
      if (hex.landingPad) setMarker(w, hex, "landing", "Landing Pad", "Launch back to space from this district.");
      if (hex.serviceNode) setMarker(w, hex, "service", "Service Hub", "District services available here.");
      if (hex.structure) setMarker(w, hex, "structure", hex.structure.name || "Explorable Structure", "Enter and generate interior rooms.");
      if (hex.wayfarer) setMarker(w, hex, "wayfarer", "Wayfarer", "Carries rumors and local history.");
      if (hex.hazard) {
        setMarker(
          w,
          hex,
          hex.hazard.type || "hazard",
          hex.hazard.name || "District Hazard",
          hex.hazard.desc || "Dangerous district condition"
        );
      }
    });

    const missionPool = w.hexes.slice();
    function takeHex() {
      if (!missionPool.length) return null;
      const ix = safeRoll(missionPool.length) - 1;
      return missionPool.splice(ix, 1)[0];
    }

    (S.activeMissions || []).slice(0, 8).forEach(function (m) {
      const hex = takeHex();
      if (!hex) return;
      setMarker(w, hex, "mission", m.title || "Mission", "Live mission marker");
    });

    w.activeTasks.slice(0, 8).forEach(function (t) {
      const hex = t.hexId ? hexById(t.hexId) : takeHex();
      if (!hex) return;
      setMarker(w, hex, "task", t.title, "Holding task");
    });

    w.hexes.forEach(function (hex) {
      const danger = dangerForZone(hex.zone);
      if (!w.markers[hex.id]) {
        hex.markerType = safeRoll(100) <= Math.max(8, Math.floor(danger.encounterChance / 2)) ? "job" : null;
        if (hex.markerType === "job") {
          setMarker(w, hex, "job", "District Job", "Quick contract available");
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
    const minimal = !!w.minimalMapMode;

    if (!w.generated || !w.hexes.length) {
      svg.setAttribute("width", "900");
      svg.setAttribute("height", "740");
      svg.innerHTML = "<text x='400' y='240' text-anchor='middle' font-family='Cinzel,serif' font-size='14' fill='#2f4457'>Generate The World That Was to begin</text>";
      return;
    }

    const svgW = 980;
    const svgH = 980;
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
      poly.setAttribute("fill", minimal ? "rgba(16,22,30,.92)" : "rgba(20,28,34,.85)");
      poly.setAttribute("stroke", zone ? zone.color : "#8e8e8e");
      poly.setAttribute("stroke-opacity", minimal ? (w.selectedHexId === hex.id ? "1" : ".58") : "1");
      poly.setAttribute("stroke-width", w.selectedHexId === hex.id ? "2.6" : (minimal ? "1" : "1.2"));
      g.appendChild(poly);

      const owner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      owner.setAttribute("cx", String(p.x));
      owner.setAttribute("cy", String(p.y));
      owner.setAttribute("r", minimal ? "4.6" : "5.5");
      owner.setAttribute("fill", controllerColor(hex.controller));
      owner.setAttribute("stroke", "#111");
      owner.setAttribute("stroke-width", "1");
      owner.setAttribute("pointer-events", "none");
      g.appendChild(owner);

      if (hex.skirmish && (!minimal || w.selectedHexId === hex.id)) {
        const sk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sk.setAttribute("x", String(p.x - 12));
        sk.setAttribute("y", String(p.y - 7));
        sk.setAttribute("font-size", "11");
        sk.setAttribute("fill", "#e05050");
        sk.setAttribute("pointer-events", "none");
        sk.textContent = "X";
        g.appendChild(sk);
      }

      if (hex.station && (!minimal || w.selectedHexId === hex.id)) {
        const st = document.createElementNS("http://www.w3.org/2000/svg", "text");
        st.setAttribute("x", String(p.x - 4));
        st.setAttribute("y", String(p.y + 15));
        st.setAttribute("font-size", "9");
        st.setAttribute("fill", "#7ed7ff");
        st.setAttribute("pointer-events", "none");
        st.textContent = "R";
        g.appendChild(st);
      }

      const showMarker = marker && (!minimal || w.selectedHexId === hex.id || marker.type === "mission" || marker.type === "task");
      if (showMarker) {
        const markerStyle = WTW_MARKER_STYLE[marker.type] || WTW_MARKER_STYLE.job;
        const mk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        mk.setAttribute("x", String(p.x + 8));
        mk.setAttribute("y", String(p.y - 8));
        mk.setAttribute("font-size", "10");
        mk.setAttribute("fill", markerStyle.color || "#bbbbbb");
        mk.setAttribute("pointer-events", "none");
        mk.textContent = markerStyle.icon || "$";
        g.appendChild(mk);
      }

      g.addEventListener("click", function () {
        w.selectedHexId = hex.id;
        renderWorldThatWas();
      });

      svg.appendChild(g);
    });
  }

  function toggleWorldMapMode() {
    const w = ensureWorldState();
    if (!w) return;
    w.minimalMapMode = !w.minimalMapMode;
    renderWorldThatWas();
    if (typeof showNotif === "function") {
      showNotif("World map mode: " + (w.minimalMapMode ? "Minimal" : "Detailed") + ".", "good");
    }
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

  function hexById(hexId) {
    const w = ensureWorldState();
    if (!w) return null;
    return w.hexes.find(function (h) { return h.id === hexId; }) || null;
  }

  function applyWorldServiceEffect(hex, svc) {
    const w = ensureWorldState();
    if (!w || !hex || !svc) return false;
    const name = String(svc.name || "").toLowerCase();

    if (name.indexOf("med") >= 0 || name.indexOf("therapy") >= 0 || name.indexOf("recovery") >= 0) {
      if (!spendWorldItem("water", 1)) {
        if (typeof showNotif === "function") showNotif("Need 1 Water for medical treatment.", "warn");
        return false;
      }
      if (typeof changeStress === "function") changeStress(-Math.max(2, safeRoll(4)));
      addWorldItem("meds", 1);
      addZoneReputation(hex.zone, 1);
      if (typeof showNotif === "function") showNotif("Service effect: recovered stress.", "good");
      return true;
    }

    if (name.indexOf("intel") >= 0 || name.indexOf("data") >= 0 || name.indexOf("courier") >= 0 || name.indexOf("signal") >= 0) {
      if (!spendWorldItem("dataDrives", 1)) {
        if (typeof showNotif === "function") showNotif("Need 1 Data Drive to run this service.", "warn");
        return false;
      }
      const target = safePick(w.hexes.filter(function (h) { return h.id !== hex.id; }), null);
      if (target) {
        setMarker(w, target, "job", "Intel Lead", "Service generated this lead");
      }
      addWorldItem("scrap", 1);
      addZoneReputation(hex.zone, 1);
      if (typeof showNotif === "function") showNotif("Service effect: spawned intel lead marker.", "good");
      return true;
    }

    if (name.indexOf("security") >= 0 || name.indexOf("militia") >= 0 || name.indexOf("ward") >= 0) {
      if (!spendWorldItem("fuelCells", 1)) {
        if (typeof showNotif === "function") showNotif("Need 1 Fuel Cell to power district security.", "warn");
        return false;
      }
      hex.skirmish = false;
      const zone = zoneForHex(hex);
      if (zone && zone.leader) hex.controller = zone.leader;
      addZoneReputation(hex.zone, 2);
      if (typeof showNotif === "function") showNotif("Service effect: district stabilized.", "good");
      return true;
    }

    if (name.indexOf("repair") >= 0 || name.indexOf("maintenance") >= 0 || name.indexOf("forge") >= 0 || name.indexOf("dock") >= 0) {
      if (!spendWorldItem("scrap", 1)) {
        if (typeof showNotif === "function") showNotif("Need 1 Scrap for maintenance work.", "warn");
        return false;
      }
      setCredits(getCredits() + 20);
      addWorldItem("fuelCells", 1);
      addZoneReputation(hex.zone, 1);
      if (typeof showNotif === "function") showNotif("Service effect: +20 Credits from repaired asset resale.", "good");
      return true;
    }

    addWorldItem("water", 1);
    addWorldItem("scrap", 1);
    addZoneReputation(hex.zone, 1);
    grantRandomLoot("easy");
    if (typeof showNotif === "function") showNotif("Service effect: recovered district salvage.", "good");
    return true;
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

    const ok = applyWorldServiceEffect(hex, svc);
    if (!ok) {
      setCredits(getCredits() + svc.cost);
      return;
    }

    if (hex.serviceRefresh && safeRoll(100) <= 25) {
      hex.narrative.event = buildWorldEvent(hex.zone, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));
      if (typeof showNotif === "function") showNotif("District activity changed after service interaction.", "good");
    }

    advanceWorldTime("service action");
    updateZoneControl();
    if (registerWorldAction("service")) return;
    renderWorldThatWas();
  }

  function resolveDistrictHazard(hexId) {
    const hex = hexById(hexId);
    if (!hex || !hex.hazard) return;

    const hz = hex.hazard;
    const check = rollAgainstDread(hz.stat || "body", hz.dread || 8);
    if (check.success) {
      addZoneReputation(hex.zone, 1);
      addWorldItem("scrap", 1);
      hex.hazard = null;
      if (typeof showNotif === "function") showNotif("Hazard cleared: " + (hz.name || "District hazard") + ".", "good");
    } else {
      applyNegativeCondition(hz.condition || "weakened");
      if (typeof changeStress === "function") {
        changeStress(Math.max(1, (check.dreadTotal || 1) - (check.actionTotal || 0)));
      }
      if (typeof showNotif === "function") showNotif("Hazard struck: gained " + (hz.condition || "weakened") + ".", "warn");
    }
    syncWorldMarkers();
    advanceWorldTime("hazard response");
    if (registerWorldAction("hazard")) return;
    renderWorldThatWas();
  }

  function talkToWayfarer(hexId) {
    const hex = hexById(hexId);
    if (!hex || !hex.wayfarer) return;
    const info = hex.wayfarer;
    const title = "Wayfarer: " + (info.name || "Unknown");
    const body = "<div style='font-size:.84rem;color:var(--text2);line-height:1.65;'>"
      + "<strong style='color:var(--gold2);'>Rumor:</strong> " + (info.rumor || "Routes are quiet tonight.")
      + "<br><strong style='color:var(--teal);'>History:</strong> " + (info.history || "Old routes still shape this district.")
      + "<br><br><span style='color:var(--muted2);'>You gain +1 Data Drive from shared route notes.</span>"
      + "</div>";
    if (typeof openModal === "function") openModal(title, body);
    addWorldItem("dataDrives", 1);
    addZoneReputation(hex.zone, 1);
    if (registerWorldAction("wayfarer talk")) return;
    renderWorldThatWas();
  }

  function exploreStructure(hexId) {
    const hex = hexById(hexId);
    if (!hex || !hex.structure) return;
    generateStructureRooms(hex);
    if (typeof showNotif === "function") {
      showNotif("Explored " + (hex.structure.name || hex.structure.kind) + ". Rooms generated.", "good");
    }
    grantRandomLoot("easy");
    addZoneReputation(hex.zone, 1);
    syncWorldMarkers();
    if (registerWorldAction("structure explore")) return;
    renderWorldThatWas();
  }

  function launchToSpace(hexId) {
    const hex = hexById(hexId);
    if (!hex || !hex.landingPad) {
      if (typeof showNotif === "function") showNotif("Launch requires a landing pad district.", "warn");
      return;
    }
    if (!spendCredits(40, "orbital launch")) return;
    advanceWorldTime("orbital launch");
    if (typeof showNotif === "function") showNotif("Launch cleared. Returning to space lane.", "good");
    returnToGalaxy();
  }

  function chooseLandingPad(zoneName) {
    const w = ensureWorldState();
    if (!w) return;
    const target = w.hexes.find(function (h) { return h.zone === zoneName && h.landingPad; });
    if (!target) {
      if (typeof showNotif === "function") showNotif("No landing pad available in " + zoneName + ".", "warn");
      return;
    }
    w.currentZone = zoneName;
    w.selectedHexId = target.id;
    renderWorldThatWas();
  }

  function resolveZoneEvent(hexId) {
    const w = ensureWorldState();
    if (!w) return;
    const hex = w.hexes.find(function (h) { return h.id === hexId; });
    if (!hex) return;

    const evt = hex.narrative && hex.narrative.event ? hex.narrative.event : null;
    if (!evt) return;

    if (evt.mode === "combat") {
      if (typeof showNotif === "function") {
        showNotif("Combat event: " + evt.enemies + " enemies (DD" + evt.dread + " | " + evt.enemyHealth + " HP each).", "warn");
      }
      openWorldSkirmishCombat();
      return;
    }

    const stat = evt.stat || "body";
    const check = rollAgainstDread(stat, evt.dread || 8);

    if (check.success) {
      const zone = zoneForHex(hex);
      addPowerRenown(zone ? zone.leader : MAJOR_POWERS[0], 1);
      addZoneReputation(hex.zone, 1);
      addWorldItem("dataDrives", 1);
      grantRandomLoot("medium");
      if (typeof showNotif === "function") {
        showNotif("Event success: " + statLabel(stat) + " d" + check.ad + " " + check.actionTotal + " vs DD" + check.dd + " " + check.dreadTotal + ".", "good");
      }
    } else if (typeof showNotif === "function") {
      showNotif("Event failed: " + statLabel(stat) + " d" + check.ad + " " + check.actionTotal + " vs DD" + check.dd + " " + check.dreadTotal + ".", "warn");
      hex.skirmish = true;
    }

    hex.narrative.event = buildWorldEvent(hex.zone, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));

    advanceWorldTime("event resolution");
    updateZoneControl();
    syncWorldMarkers();
    if (registerWorldAction("event")) return;
    renderWorldThatWas();
  }

  function completeCombatEventVictory(hexId) {
    const hex = hexById(hexId);
    if (!hex || !hex.narrative || !hex.narrative.event || hex.narrative.event.mode !== "combat") return;
    const zone = zoneForHex(hex);
    addPowerRenown(zone ? zone.leader : MAJOR_POWERS[0], 1);
    addZoneReputation(hex.zone, 2);
    addWorldItem("scrap", 2);
    grantRandomLoot("medium");
    setCredits(getCredits() + 90);
    hex.skirmish = false;
    hex.narrative.event = buildWorldEvent(hex.zone, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));
    advanceWorldTime("combat event victory");
    updateZoneControl();
    syncWorldMarkers();
    if (registerWorldAction("combat event")) return;
    renderWorldThatWas();
  }

  function rollDistrictEncounter() {
    const hex = getSelectedHex();
    if (!hex) return;
    hex.encounter = buildDistrictEncounter(hex.zone);
    if (!hex.encounter) {
      if (typeof showNotif === "function") showNotif("No active encounter in this district right now.", "good");
      renderWorldThatWas();
      return;
    }
    if (typeof showNotif === "function") showNotif("Encounter rolled in " + hex.zone + ".", "good");
    if (registerWorldAction("encounter roll")) return;
    renderWorldThatWas();
  }

  function resolveDistrictEncounter() {
    const hex = getSelectedHex();
    if (!hex || !hex.encounter) return;
    if (hex.encounter.mode === "combat") {
      if (typeof showNotif === "function") {
        showNotif("Encounter combat: " + hex.encounter.enemies + " enemies (DD" + hex.encounter.dread + " | " + hex.encounter.enemyHealth + " HP each).", "warn");
      }
      openWorldSkirmishCombat();
      return;
    }
    const check = rollAgainstDread(hex.encounter.stat || "body", hex.encounter.dread || 8);
    if (check.success) {
      addZoneReputation(hex.zone, 1);
      addWorldItem("water", 1);
      grantRandomLoot("easy");
      setCredits(getCredits() + 30);
      if (typeof showNotif === "function") showNotif("Encounter resolved successfully.", "good");
    } else {
      hex.skirmish = true;
      if (typeof showNotif === "function") showNotif("Encounter failed. Skirmish triggered.", "warn");
    }
    hex.encounter = null;
    advanceWorldTime("district encounter");
    if (registerWorldAction("encounter resolve")) return;
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
    } else if (marker.type === "service" || marker.type === "wayfarer" || marker.type === "structure" || marker.type === "hazard" || marker.type === "peril" || marker.type === "barrier" || marker.type === "landing" || marker.type === "station") {
      if (typeof showNotif === "function") showNotif("Visit this district and use the panel actions for this marker.", "good");
    } else {
      if (typeof showNotif === "function") showNotif("District job completed. +80 Credits.", "good");
      setCredits(getCredits() + 80);
      addWorldItem("scrap", 1);
      addZoneReputation(hex.zone, 1);
      delete w.markers[hexId];
    }

    advanceWorldTime("district marker");
    if (registerWorldAction("marker")) return;
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

    if (registerWorldAction("skirmish action")) return;
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

    w.skirmishState.activeHexId = hex.id;
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
    const selected = getSelectedHex();
    const zoneHexes = w.hexes.filter(function (hex) { return hex.zone === h.zone && (!selected || hex.id !== selected.id); });
    const taskHex = safePick(zoneHexes, zoneHexes[0]) || selected;
    const rewardCredits = 120 + safeRoll(8) * 20;
    const rollStat = safePick(ACTION_STATS, "body");

    const t = {
      id: taskId,
      holdingId: holdingId,
      power: h.power,
      title: title,
      hexId: taskHex ? taskHex.id : null,
      status: "active",
      rollStat: rollStat,
      dread: 8,
      rewardCredits: rewardCredits,
      rewardTier: safePick(["easy", "medium", "medium", "challenging"], "medium")
    };

    w.activeTasks.unshift(t);
    syncWorldMarkers();
    if (typeof showNotif === "function") showNotif("Task accepted: " + title + ". Travel to district and resolve.", "good");
    if (registerWorldAction("task accept")) return;
    renderWorldThatWas();
  }

  function completeHoldingTask(taskId) {
    const w = ensureWorldState();
    if (!w) return;
    const t = w.activeTasks.find(function (x) { return x.id === taskId; });
    if (!t) return;

    const selected = getSelectedHex();
    if (!selected || selected.id !== t.hexId) {
      if (typeof showNotif === "function") showNotif("Travel to the task district before completing.", "warn");
      return;
    }

    const check = rollAgainstDread(t.rollStat || "body", t.dread || 8);
    if (!check.success) {
      selected.skirmish = true;
      if (typeof showNotif === "function") showNotif("Task failed: " + statLabel(t.rollStat) + " check missed DD" + (t.dread || 8) + ".", "warn");
      advanceWorldTime("task failure");
      if (registerWorldAction("task fail")) return;
      renderWorldThatWas();
      return;
    }

    t.status = "done";
    addPowerRenown(t.power, 1);
    addZoneReputation(selected.zone, 2);
    addWorldItem("dataDrives", 1);
    addWorldItem("fuelCells", 1);
    grantRandomLoot(t.rewardTier || "medium");
    setCredits(getCredits() + (t.rewardCredits || 150));

    if (typeof showNotif === "function") {
      showNotif("Task complete: +" + (t.rewardCredits || 150) + " Credits, +1 " + t.power + " renown.", "good");
    }

    w.activeTasks = w.activeTasks.filter(function (x) { return x.id !== taskId; });
    delete w.markers[t.hexId];
    syncWorldMarkers();
    advanceWorldTime("holding task");
    if (registerWorldAction("task complete")) return;
    renderWorldThatWas();
  }

  function jumpToTaskHex(taskId) {
    const w = ensureWorldState();
    if (!w) return;
    const t = w.activeTasks.find(function (x) { return x.id === taskId; });
    if (!t || !t.hexId) return;
    w.selectedHexId = t.hexId;
    const hex = hexById(t.hexId);
    if (hex) w.currentZone = hex.zone;
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
    if (registerWorldAction("train")) return;
    if (typeof showNotif === "function") showNotif("Traveled by rail to " + zoneName + " for 30 Credits.", "good");
    renderWorldThatWas();
  }

  function advanceWorldThatWas(fromActivity) {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;

    w.tick += 1;

    const shifts = Math.max(2, safeRoll(5));
    for (let i = 0; i < shifts; i += 1) {
      const weighted = [];
      w.hexes.forEach(function (hex) {
        const weight = Math.max(1, 1 + dangerForZone(hex.zone).cycleShiftBonus);
        for (let wi = 0; wi < weight; wi += 1) weighted.push(hex);
      });
      const target = safePick(weighted, null);
      if (!target) break;
      target.controller = safePick(HOLDERS, target.controller);
      if (safeRoll(100) <= Math.min(55, 24 + dangerForZone(target.zone).skirmishChance)) target.skirmish = true;
    }

    w.hexes.forEach(function (hex) {
      const danger = dangerForZone(hex.zone);
      if (!hex.skirmish && safeRoll(100) <= Math.max(5, Math.floor(danger.skirmishChance / 2))) hex.skirmish = true;
      if (hex.skirmish && safeRoll(100) <= Math.max(10, 24 - danger.cycleShiftBonus * 3)) hex.skirmish = false;
      if (safeRoll(100) <= Math.max(8, Math.floor(danger.encounterChance / 3))) {
        hex.narrative.event = buildWorldEvent(hex.zone, safePick((ZONE_FLAVOR[hex.zone] || ZONE_FLAVOR["Cyber Hub"]).events, hex.narrative.event));
      }
    });

    updateZoneControl();
    syncWorldMarkers();
    advanceWorldTime("control cycle");
    if (typeof showNotif === "function" && !fromActivity) showNotif("Control cycle advanced manually.", "good");
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
    if (!holdings.length) return "<div class='wtw-muted'>No power holdings registered in this zone.</div>";

    return holdings.map(function (h) {
      return ""
        + "<div class='wtw-list-card'>"
        + "<div class='title'>" + h.name + " · " + h.power + "</div>"
        + "<div class='meta'>"
        + "Mood: " + h.mood + "<br>Crisis: " + h.crisis + ""
        + "</div>"
        + "<div class='actions'>"
        + "<button class='btn btn-xs btn-primary' onclick='wtwTakeHoldingTask(\"" + h.id + "\")'>Take Task</button>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderActiveTasksPanel() {
    const w = ensureWorldState();
    if (!w) return "";

    if (!w.activeTasks.length) {
      return "<div class='wtw-muted'>No active holding tasks.</div>";
    }

    return w.activeTasks.slice(0, 5).map(function (t) {
      const taskHex = hexById(t.hexId);
      const selected = getSelectedHex();
      const atLocation = !!selected && selected.id === t.hexId;
      return ""
        + "<div class='wtw-list-card'>"
        + "<div class='title'>" + t.title + "</div>"
        + "<div class='meta'>Power: " + t.power + " · Target: " + (taskHex ? (taskHex.zone + " / " + taskHex.district) : "Unknown") + "</div>"
        + "<div class='meta'>Roll: " + statLabel(t.rollStat || "body") + " vs DD" + (t.dread || 8) + " · Reward: " + (t.rewardCredits || 150) + " Credits + Loot</div>"
        + "<div class='actions'>"
        + "<button class='btn btn-xs' onclick='wtwTrackTask(\"" + t.id + "\")'>Track</button>"
        + "<button class='btn btn-xs btn-teal' onclick='wtwCompleteTask(\"" + t.id + "\")'" + (atLocation ? "" : " disabled") + ">Complete</button>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderSkirmishWidget(hex) {
    const w = ensureWorldState();
    if (!w || !hex || !hex.skirmish) {
      return "<div class='wtw-muted'>No active skirmish in this district.</div>";
    }

    const st = w.skirmishState || {};
    const ready = st.activeHexId === hex.id;

    if (!ready) {
      return ""
        + "<div class='wtw-card'>"
        + "<div class='wtw-card-title' style='color:#e05050;'>Active Skirmish</div>"
        + "<div class='wtw-card-text'>Initialize skirmish controls in this panel, or open full Combat tab.</div>"
        + "<div class='wtw-card-actions'>"
        + "<button class='btn btn-xs btn-red' onclick='wtwInitSkirmish()'>Init Skirmish Controls</button>"
        + "<button class='btn btn-xs btn-teal' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button>"
        + "<button class='btn btn-xs' onclick='resolveWorldSkirmish()'>Quick Resolve</button>"
        + "</div>"
        + "</div>";
    }

    return ""
      + "<div class='wtw-card'>"
      + "<div class='wtw-card-title' style='color:#e05050;'>Skirmish Controls</div>"
      + "<div class='wtw-card-text'>Round " + st.round + " · Actions reset together at 0/0.</div>"
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
      + "<div class='wtw-card-actions'>"
      + "<button class='btn btn-xs btn-red' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button>"
      + "<button class='btn btn-xs' onclick='resolveWorldSkirmish()'>Quick Resolve</button>"
      + "</div>"
      + "</div>";
  }

  function buildWtwAccordion(title, body, opened) {
    return ""
      + "<details class='wtw-accordion'" + (opened ? " open" : "") + ">"
      + "<summary>" + title + "</summary>"
      + "<div class='wtw-accordion-body'>" + body + "</div>"
      + "</details>";
  }

  function renderWorldThatWasInfo() {
    const w = ensureWorldState();
    const panel = document.getElementById("wtwInfo");
    if (!panel || !w) return;

    const hex = getSelectedHex();
    if (!hex) {
      panel.innerHTML = "<div class='hex-info-inner'><div class='wtw-muted'>Generate the map and select a district hex.</div></div>";
      return;
    }

    const marker = w.markers[hex.id];
    const zone = zoneForHex(hex);
    const zoneRep = w.zoneReputation && typeof w.zoneReputation[hex.zone] === "number" ? w.zoneReputation[hex.zone] : 0;
    const services = zoneServicesForHex(hex);
    const n = hex.narrative;
    const evt = n.event || {};
    const markerTypeLabel = marker && WTW_MARKER_STYLE[marker.type] ? WTW_MARKER_STYLE[marker.type].title : "District Marker";
    const eventCheck = evt.mode === "combat"
      ? ("<strong>Combat Encounter:</strong> " + (evt.enemies || 2) + " enemies (DD" + (evt.dread || 8) + " | " + (evt.enemyHealth || 16) + " HP each)")
      : ("<strong>Check:</strong> " + statLabel(evt.stat || "body") + " d" + getActionDie(evt.stat || "body") + " vs DD" + (evt.dread || 8));

    const encounterHtml = hex.encounter
      ? ("<div class='wtw-card'><div class='wtw-card-title'>Rolled Encounter</div><div class='wtw-card-text'><strong>" + hex.encounter.title + "</strong><br>" + hex.encounter.text + "<br>" + (hex.encounter.mode === "combat" ? (hex.encounter.enemies + " enemies (DD" + hex.encounter.dread + " | " + hex.encounter.enemyHealth + " HP each)") : (statLabel(hex.encounter.stat) + " vs DD" + hex.encounter.dread)) + "</div><div class='wtw-card-actions'><button class='btn btn-xs btn-teal' onclick='wtwResolveEncounter()'>Resolve Encounter</button>" + (hex.encounter.mode === "combat" ? "<button class='btn btn-xs btn-red' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button>" : "") + "</div></div>")
      : "<div class='wtw-muted'>No rolled encounter in this district.</div>";

    const servicesHtml = services.map(function (svc, idx) {
      return ""
        + "<div class='wtw-list-card'>"
        + "<div class='title'>" + svc.name + "</div>"
        + "<div class='meta'>Cost: " + svc.cost + " Credits<br>" + svc.desc + "</div>"
        + "<div class='actions'><button class='btn btn-xs btn-teal' onclick='wtwBuyService(\"" + hex.id + "\"," + idx + ")'>Use Service</button></div>"
        + "</div>";
    }).join("");

    const hazardHtml = hex.hazard
      ? ("<div class='wtw-card'><div class='wtw-card-title' style='color:#ff8a72;'>" + (hex.hazard.type || "hazard").toUpperCase() + ": " + hex.hazard.name + "</div><div class='wtw-card-text'><strong>Risk:</strong> " + hex.hazard.desc + "<br><strong>Check:</strong> " + statLabel(hex.hazard.stat || "body") + " vs DD" + (hex.hazard.dread || 8) + "<br><strong>On fail:</strong> gain " + (hex.hazard.condition || "weakened") + "</div><div class='wtw-card-actions'><button class='btn btn-xs btn-red' onclick='wtwResolveHazard(\"" + hex.id + "\")'>Face Hazard</button></div></div>")
      : "<div class='wtw-muted'>No active district hazard in this hex.</div>";

    const wayfarerHtml = hex.wayfarer
      ? ("<div class='wtw-card'><div class='wtw-card-title' style='color:#d4b8ff;'>Wayfarer: " + hex.wayfarer.name + "</div><div class='wtw-card-text'><strong>Rumor:</strong> " + hex.wayfarer.rumor + "<br><strong>History:</strong> " + hex.wayfarer.history + "</div><div class='wtw-card-actions'><button class='btn btn-xs btn-teal' onclick='wtwTalkWayfarer(\"" + hex.id + "\")'>Talk</button></div></div>")
      : "<div class='wtw-muted'>No wayfarer currently visible.</div>";

    const structureRooms = (hex.structure && Array.isArray(hex.structure.generatedRooms)) ? hex.structure.generatedRooms : [];
    const structureRoomHtml = structureRooms.length
      ? ("<div style='margin-top:.25rem;'>" + structureRooms.map(function (room, idx) {
          return "<div class='room-block'><div class='rb-title'>Room " + (idx + 1) + "</div><div class='rb-text'>" + room + "</div></div>";
        }).join("") + "</div>")
      : "<div class='wtw-muted' style='margin-top:.2rem;'>No rooms generated yet.</div>";

    const structureHtml = hex.structure
      ? ("<div class='wtw-card'><div class='wtw-card-title'>" + (hex.structure.kind || "Structure") + ": " + (hex.structure.name || "Unknown Site") + "</div><div class='wtw-card-text'>Enter and generate interior rooms for exploration.</div><div class='wtw-card-actions'><button class='btn btn-xs btn-primary' onclick='wtwExploreStructure(\"" + hex.id + "\")'>Generate Rooms</button></div>" + structureRoomHtml + "</div>")
      : "<div class='wtw-muted'>No explorable structure in this district.</div>";

    const travelHtml = "<div class='wtw-card'>"
      + "<div class='wtw-card-title' style='color:#7ed7ff;'>Travel Infrastructure</div>"
      + "<div class='wtw-card-text'>"
      + (hex.station ? "This district contains a rail station.<br>" : "No rail station in this district.<br>")
      + (hex.landingPad ? "Landing pad available: launch to space for 40 Credits." : "No landing pad in this district.")
      + "</div>"
      + (hex.landingPad ? "<div class='wtw-card-actions'><button class='btn btn-xs btn-teal' onclick='wtwLaunchToSpace(\"" + hex.id + "\")'>Launch To Space</button></div>" : "")
      + "</div>";

    const controlRows = Object.keys((zone && zone.controlBreakdown) || {}).map(function (name) {
      return "<span style='display:inline-block;margin-right:.4rem;color:" + controllerColor(name) + ";'>" + name + ": " + zone.controlBreakdown[name] + "</span>";
    }).join(" ");

    const summaryGrid = ""
      + "<div class='wtw-mini-grid'>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Controller</span>" + hex.controller + "</div>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Zone Leader</span>" + ((zone && zone.leader) || "Unknown") + "</div>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Zone Reputation</span>" + zoneRep + " (" + zoneRepTier(zoneRep) + ")</div>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Danger Profile</span>" + dangerForZone(hex.zone).encounterChance + "% encounter / " + dangerForZone(hex.zone).skirmishChance + "% skirmish</div>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Fauna / Flora</span>" + n.fauna + " / " + n.flora + "</div>"
      + "<div class='wtw-mini-cell'><span class='lbl'>Land / Weather</span>" + n.land + " / " + n.weather + "</div>"
      + "</div>";

    const eventCard = ""
      + "<div class='wtw-card'>"
      + "<div class='wtw-card-title'>Random Event</div>"
      + "<div class='wtw-card-text'><strong>" + evt.title + "</strong><br>" + evt.text + "<br><br><strong>Action:</strong> " + evt.action + "<br>" + eventCheck + "<br><strong>Reward:</strong> " + evt.reward + "</div>"
      + "<div class='wtw-card-actions'><button class='btn btn-xs btn-primary' onclick='wtwResolveEvent(\"" + hex.id + "\")'>Resolve Event</button>" + (evt.mode === "combat" ? "<button class='btn btn-xs btn-red' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button><button class='btn btn-xs btn-teal' onclick='wtwWinCombatEvent(\"" + hex.id + "\")'>Mark Combat Victory</button>" : "") + "<button class='btn btn-xs' onclick='wtwRollEncounter()'>Roll Encounter</button></div>"
      + "</div>";

    const markerHtml = marker
      ? ("<div class='wtw-card'><div class='wtw-card-title'>" + markerTypeLabel + "</div><div class='wtw-card-text'><strong>" + marker.title + "</strong><br>" + marker.subtitle + "</div><div class='wtw-card-actions'><button class='btn btn-xs btn-primary' onclick='wtwCollectMarker(\"" + hex.id + "\")'>Review Marker</button></div></div>")
      : "<div class='wtw-muted'>No marker in this district.</div>";

    const worldSystems = hazardHtml + wayfarerHtml + structureHtml + travelHtml + renderSkirmishWidget(hex);
    const powerSection = ""
      + "<div class='wtw-card-text' style='margin-bottom:.3rem;'><strong>Control Breakdown:</strong><br>" + controlRows + "</div>"
      + "<div class='wtw-card-title' style='margin-top:.3rem;'>Zone Holdings</div>"
      + renderHoldingsPanel(hex)
      + "<div class='wtw-card-title' style='margin-top:.3rem;'>Active Tasks</div>"
      + renderActiveTasksPanel();

    panel.innerHTML = ""
      + "<div class='hex-info-inner'>"
      + "<div class='wtw-header'>"
      + "<div class='hex-type-tag wilderness'>District Hex</div>"
      + "<div class='wtw-headline'>" + hex.zone + " - " + hex.district + "</div>"
      + "<div class='wtw-summary'>Amidst " + n.location + ", the " + n.sight + ", " + n.description + ", serves as a beacon for " + n.feature + ".</div>"
      + "</div>"
      + summaryGrid
      + eventCard
      + buildWtwAccordion("Encounter & Markers", encounterHtml + markerHtml, true)
      + buildWtwAccordion("Hazards, Wayfarers, Exploration & Travel", worldSystems, false)
      + buildWtwAccordion("District Services", servicesHtml || "<div class='wtw-muted'>No services available here.</div>", false)
      + buildWtwAccordion("Zone Power & Tasks", powerSection, false)
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

  function renderLandingPadControls() {
    const w = ensureWorldState();
    if (!w) return "";
    const pads = w.hexes.filter(function (h) { return h.landingPad; });
    if (!pads.length) return "<span style='font-size:.74rem;color:var(--muted2);'>No landing pads online.</span>";
    return pads.map(function (hex) {
      const on = w.selectedHexId === hex.id;
      return "<button class='btn btn-xs " + (on ? "btn-teal" : "") + "' onclick='chooseWorldLandingPad(\"" + hex.zone + "\")'>" + hex.zone + (on ? " (Pad)" : "") + "</button>";
    }).join(" ");
  }

  function renderWorldThatWas() {
    const w = ensureWorldState();
    if (!w) return;

    const tickEl = document.getElementById("wtwTick");
    const zoneEl = document.getElementById("wtwCurrentZone");
    const railEl = document.getElementById("wtwRailControls");
    const padsEl = document.getElementById("wtwLandingControls");
    const activityEl = document.getElementById("wtwActivity");
    const mapModeBtn = document.getElementById("wtwMapModeBtn");
    const invEl = document.getElementById("wtwInventoryReadout");
    if (tickEl) tickEl.textContent = "Cycle " + (w.tick || 0);
    if (zoneEl) zoneEl.textContent = w.currentZone || "Unknown";
    if (railEl) railEl.innerHTML = renderZoneRailControls();
    if (padsEl) padsEl.innerHTML = renderLandingPadControls();
    if (activityEl) activityEl.textContent = String(w.activityClicks || 0) + "/10";
    if (mapModeBtn) mapModeBtn.textContent = w.minimalMapMode ? "Map: Minimal" : "Map: Detailed";
    if (invEl && S && S.worldInventory) {
      invEl.innerHTML = WORLD_ITEMS.map(function (k) {
        return "<span class='sea-chip'>" + inventoryLabel(k) + ": " + (S.worldInventory[k] || 0) + "</span>";
      }).join(" ");
    }

    renderWorldThatWasMap();
    renderWorldThatWasInfo();
    renderPowerReadout();
  }

  function mountWorldThatWasPanel() {
    const panel = document.getElementById("tab-worldthatwas");
    if (!panel) return;

    panel.dataset.mounted = "1";
    panel.innerHTML = ""
      + "<div class='wtw-shell'>"
      + "<div class='wtw-toolbar'>"
      + "<div class='wtw-toolbar-actions'>"
      + "<button class='btn btn-primary' onclick='generateWorldThatWasMap()'>Generate</button>"
      + "<button class='btn btn-sm' onclick='advanceWorldThatWas()'>Advance Cycle</button>"
      + "<button class='btn btn-sm btn-teal' onclick='wtwSyncMarkers()'>Refresh Markers</button>"
      + "<button class='btn btn-sm' id='wtwMapModeBtn' onclick='toggleWorldMapMode()'>Map: Detailed</button>"
      + "<button class='btn btn-sm' onclick='wtwRollEncounter()'>Roll Encounter</button>"
      + "<button class='btn btn-sm' onclick='returnWorldToGalaxy()'>Return to Galaxy</button>"
      + "</div>"
      + "<div class='wtw-toolbar-meta'>"
      + "<span class='wtw-stat-pill'>Zone: <strong id='wtwCurrentZone' style='color:var(--gold2);'>-</strong></span>"
      + "<span class='wtw-stat-pill' id='wtwTick'>Cycle 0</span>"
      + "<span class='wtw-stat-pill'>Activity: <strong id='wtwActivity' style='color:var(--teal);'>0/10</strong></span>"
      + "</div>"
      + "</div>"
      + "<div class='wtw-quickstats'>"
      + "<div class='wtw-kv'><span class='k'>Map Rules</span><div class='v'>12x12 districts, 9 mega-zones, dynamic control shifts.</div></div>"
      + "<div class='wtw-kv'><span class='k'>Travel</span><div class='v'>Rail to any zone station for 30 Credits and +1 time step.</div></div>"
      + "<div class='wtw-kv'><span class='k'>Landing Pads</span><div class='v'>Each zone has a launch pad. Launch from selected pad for 40 Credits.</div></div>"
      + "<div class='wtw-kv'><span class='k'>Progress</span><div class='v'>Events, services, skirmishes, tasks, wayfarers, hazards, and structures.</div></div>"
      + "</div>"
      + "<div id='wtwRailControls' class='wtw-chip-wrap'></div>"
      + "<div id='wtwLandingControls' class='wtw-chip-wrap'></div>"
      + "<div class='wtw-strip'>"
      + "<div class='wtw-strip-card'><div class='wtw-strip-title'>World Inventory</div><div id='wtwInventoryReadout' class='wtw-chip-wrap'></div></div>"
      + "<div class='wtw-strip-card'><div class='wtw-strip-title'>Power Balance</div><div id='wtwPowerReadout' class='wtw-chip-wrap'></div></div>"
      + "</div>"
      + "<div class='map-layout'>"
      + "<div class='map-scroll'><svg id='wtwMapSvg' width='900' height='740' xmlns='http://www.w3.org/2000/svg'></svg></div>"
      + "<div class='hex-info' id='wtwInfo'></div>"
      + "</div>"
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
  window.chooseWorldLandingPad = chooseLandingPad;
  window.returnWorldToGalaxy = returnToGalaxy;
  window.toggleWorldMapMode = toggleWorldMapMode;

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
  window.wtwTrackTask = jumpToTaskHex;
  window.wtwTravelRail = travelByTrainTo;
  window.wtwRollEncounter = rollDistrictEncounter;
  window.wtwResolveEncounter = resolveDistrictEncounter;
  window.wtwWinCombatEvent = completeCombatEventVictory;
  window.wtwResolveHazard = resolveDistrictHazard;
  window.wtwTalkWayfarer = talkToWayfarer;
  window.wtwExploreStructure = exploreStructure;
  window.wtwLaunchToSpace = launchToSpace;
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
