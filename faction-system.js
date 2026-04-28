// faction-system.js — Advanced Faction System with Multiple Story Pathways
// Features: Faction Lore, Relations, Missions, Trust/Betrayal, Multiple Endings
(function () {
  const FACTION_TAB_ID = "factions";

  // ============================================================================
  // FACTION DEFINITIONS — Each faction has lore, beliefs, missions, and dynamics
  // ============================================================================

  const FACTIONS = {
    corporations: {
      id: "corporations",
      name: "The Syndicate Corporations",
      emoji: "💼",
      color: "#c9a227",
      essence: "Profit, Order, Control",
      motto: "Everything has a price. Everything has a buyer.",
      lore: `The Syndicate Corporations rule the golden cities through wealth and infrastructure. They own the ports, the power grids, the communication networks. Their executives are shadowy; their reach is absolute. They believe the world needs hierarchy—a ladder of value where the strong climb and the weak serve. To them, power is economic power, and loyalty is for sale.`,
      philosophy: "The greatest sin is inefficiency. The greatest virtue is profit.",
      idealEnding: "golden",
      betrayalCost: { credits: -500, reputation: -3, trust: -2 },
      trustReward: { credits: 1000, power: 2 },
      factionMissions: [
        {
          id: "corp_m1",
          title: "Audit the Rebels",
          desc: "Infiltrate rebel holdings and report asset inventories.",
          reward: 200,
          difficulty: "hard",
          alignment: "corporate",
          pathways: {
            heroic: "You could warn the rebels instead.",
            evil: "Burn everything so there's nothing left to steal.",
            sacrificial: "Stay behind to cover their escape.",
          }
        },
        {
          id: "corp_m2",
          title: "Broker a Peace Deal",
          desc: "Negotiate between warring subsidiaries for 15% commission.",
          reward: 300,
          difficulty: "medium",
          alignment: "political",
          pathways: {
            evil: "Deliberately extend the conflict for interest payments.",
            heroic: "Broker genuine peace at no cost.",
            sacrificial: "Take a fatal wound to seal the agreement.",
          }
        },
        {
          id: "corp_m3",
          title: "Secure a Monopoly",
          desc: "Purchase exclusive rights to a rare resource.",
          reward: 150,
          difficulty: "medium",
          alignment: "corporate",
          pathways: {
            heroic: "Leave enough for locals to survive.",
            evil: "Buy it all. Let them starve.",
            sacrificial: "Give your share to the poor.",
          }
        }
      ]
    },

    religious: {
      id: "religious",
      name: "The Sacred Choir",
      emoji: "⛪",
      color: "#b060d0",
      essence: "Faith, Transcendence, Purpose",
      motto: "Beyond flesh lies truth. Beyond truth lies the Light.",
      lore: `The Sacred Choir believes the universe is woven with divine purpose. They maintain temples in every city, healing shrines in every hamlet. Their priesthood claims direct communion with something beyond—whether god, cosmic consciousness, or ancient AI awakened is a matter of doctrine. They seek to elevate humanity beyond its broken state, though the methods are... debated.`,
      philosophy: "Suffering purifies. Truth liberates. The flesh is temporary; the spirit is eternal.",
      idealEnding: "transcendent",
      betrayalCost: { curse: 1, reputation: -2, stress: 2 },
      trustReward: { blessing: 1, clarity: 1 },
      factionMissions: [
        {
          id: "rel_m1",
          title: "Purge the Heretics",
          desc: "Eliminate scholars spreading 'false doctrine' about the Light.",
          reward: 250,
          difficulty: "very_hard",
          alignment: "zealous",
          pathways: {
            evil: "Kill them all. No mercy.",
            heroic: "Warn them and let them flee.",
            sacrificial: "Take their curses upon yourself to save them.",
          }
        },
        {
          id: "rel_m2",
          title: "Pilgrimage of the Broken",
          desc: "Guide suffering pilgrims to a shrine. Heal what you can.",
          reward: 100,
          difficulty: "easy",
          alignment: "blessed",
          pathways: {
            heroic: "Truly heal them. Use your own resources.",
            evil: "Rob them and leave them at the shrine's steps.",
            sacrificial: "Absorb their illnesses into yourself.",
          }
        },
        {
          id: "rel_m3",
          title: "Recover the Relic",
          desc: "Retrieve a sacred artifact from pagan hands.",
          reward: 350,
          difficulty: "challenging",
          alignment: "religious",
          pathways: {
            heroic: "Learn why they hold it. Negotiate its return.",
            evil: "Massacre the village. Take the relic.",
            sacrificial: "Destroy it to prevent its misuse.",
          }
        }
      ]
    },

    military: {
      id: "military",
      name: "The Iron Cohort",
      emoji: "⚔️",
      color: "#e05050",
      essence: "Strength, Discipline, Victory",
      motto: "The strongest survive. The disciplined thrive. The weak are lessons.",
      lore: `The Iron Cohort is the military machine that holds the fragmented world together—or so they claim. They coordinate fortifications, maintain supply lines, and execute campaigns against "threats to stability." They are merit-based, organized, and absolutely committed to their vision of order through martial force. Betrayal within the ranks is punished swiftly.`,
      philosophy: "Discipline creates strength. Weakness is contagion. Victory justifies all methods.",
      idealEnding: "triumphant",
      betrayalCost: { court_martial: 1, reputation: -3, honor: -2 },
      trustReward: { rank: 1, honor: 2 },
      factionMissions: [
        {
          id: "mil_m1",
          title: "Execute the Deserters",
          desc: "Hunt down soldiers who fled the latest campaign.",
          reward: 200,
          difficulty: "hard",
          alignment: "martial",
          pathways: {
            evil: "Make an example. Display the bodies.",
            heroic: "Let them escape. Report them dead.",
            sacrificial: "Take their place. Flee yourself.",
          }
        },
        {
          id: "mil_m2",
          title: "Secure the Supply Line",
          desc: "Clear bandits and saboteurs from the Pass.",
          reward: 150,
          difficulty: "medium",
          alignment: "martial",
          pathways: {
            heroic: "Use minimal violence. Negotiate where possible.",
            evil: "Kill everything that moves.",
            sacrificial: "Fall in battle so allies can escape.",
          }
        },
        {
          id: "mil_m3",
          title: "Assault the Rebel Stronghold",
          desc: "Lead a raid against the Uprising's primary base.",
          reward: 500,
          difficulty: "impossible",
          alignment: "martial",
          pathways: {
            evil: "Burn it all. Kill the wounded.",
            heroic: "Minimize casualties on both sides.",
            sacrificial: "Die taking the objective.",
          }
        }
      ]
    },

    underworld: {
      id: "underworld",
      name: "The Underground Crown",
      emoji: "👑",
      color: "#1a3a2c",
      essence: "Shadow, Survival, Freedom",
      motto: "The law is for the safe. We are the survivors.",
      lore: `The Underground Crown exists in the spaces between official laws. They are thieves, smugglers, fences, and assassins—but also the network that helps refugees, hides the hunted, and remembers when the powerful try to rewrite history. They operate on trust and blood-oaths. Their code is simple: loyalty to the Crown, silence to outsiders, death to informants.`,
      philosophy: "Loyalty is everything. Silence is sacred. The strong take; the smart survive.",
      idealEnding: "shadowed",
      betrayalCost: { bounty: 1, reputation: -4, safety: -3 },
      trustReward: { protection: 2, secrets: 1 },
      factionMissions: [
        {
          id: "under_m1",
          title: "Steal from the Temples",
          desc: "Liberate 'donation funds' from the Sacred Choir.",
          reward: 180,
          difficulty: "challenging",
          alignment: "criminal",
          pathways: {
            evil: "Burn the temple. Kill the monks.",
            heroic: "Return the money to the poor.",
            sacrificial: "Get caught. Let your crew escape.",
          }
        },
        {
          id: "under_m2",
          title: "Eliminate an Informant",
          desc: "Erase a corporate spy who's been bleeding secrets.",
          reward: 250,
          difficulty: "hard",
          alignment: "shadowed",
          pathways: {
            evil: "Make it slow. Make it terrible.",
            heroic: "Just make it quick.",
            sacrificial: "Sacrifice yourself in their place.",
          }
        },
        {
          id: "under_m3",
          title: "Run Contraband Through the Blockade",
          desc: "Smuggle medicine, weapons, or refugees past military lines.",
          reward: 200,
          difficulty: "hard",
          alignment: "survival",
          pathways: {
            heroic: "Protect the cargo at all costs.",
            evil: "Sell half to the highest bidder.",
            sacrificial: "Go down with the ship so others escape.",
          }
        }
      ]
    },

    rebels: {
      id: "rebels",
      name: "The Uprising",
      emoji: "✊",
      color: "#e8c050",
      essence: "Justice, Freedom, Revolution",
      motto: "The world can be remade. We are the hammer.",
      lore: `The Uprising believes the current order is corrupt beyond repair. They fight for the dispossessed, the forgotten, the ones left behind by corporate and military hierarchies. They are fractious, idealistic, and willing to sacrifice everything for a better world—but cannot agree on what that world should look like. Factions within factions. Hope and doubt, equally matched.`,
      philosophy: "The system cannot be reformed; it must be broken. Freedom requires sacrifice.",
      idealEnding: "liberated",
      betrayalCost: { reputation: -3, allies: -2 },
      trustReward: { allies: 2, hope: 1 },
      factionMissions: [
        {
          id: "reb_m1",
          title: "Sabotage the Power Grid",
          desc: "Disable power distribution to weaken corporate control.",
          reward: 200,
          difficulty: "challenging",
          alignment: "revolutionary",
          pathways: {
            evil: "Leave it destroyed. Let the hospitals go dark.",
            heroic: "Restore power after making your point.",
            sacrificial: "Detonate yourself in the central hub.",
          }
        },
        {
          id: "reb_m2",
          title: "Recruit from the Desperate",
          desc: "Find and train new fighters among the starving.",
          reward: 100,
          difficulty: "easy",
          alignment: "revolutionary",
          pathways: {
            heroic: "Give them real choice. Real hope.",
            evil: "Lie. Promise what you can't deliver.",
            sacrificial: "Take their place if too many will die.",
          }
        },
        {
          id: "reb_m3",
          title: "Assassinate the Council Speaker",
          desc: "Remove the face of corporate tyranny.",
          reward: 400,
          difficulty: "very_hard",
          alignment: "revolutionary",
          pathways: {
            evil: "Kill their entire family too.",
            heroic: "Kill only the Speaker. Let the family live.",
            sacrificial: "Take the blame. Go to your execution.",
          }
        }
      ]
    },

    scholars: {
      id: "scholars",
      name: "The Archive Keepers",
      emoji: "📚",
      color: "#6ed090",
      essence: "Knowledge, Truth, Understanding",
      motto: "Truth is the only power that cannot be seized.",
      lore: `The Archive Keepers are scattered across the ruins of the old world, preserving knowledge in hidden libraries and clandestine universities. They believe that understanding the past is the only way to forge a better future. They're neutral in most conflicts—but neutrality, they insist, is a choice, and some truths are too dangerous to suppress.`,
      philosophy: "Knowledge should be free. Some truths are worth dying for. Understanding is the path to wisdom.",
      idealEnding: "enlightened",
      betrayalCost: { knowledge: -2, reputation: -2 },
      trustReward: { knowledge: 2, clarity: 1 },
      factionMissions: [
        {
          id: "sch_m1",
          title: "Recover the Forbidden Texts",
          desc: "Find pre-collapse technical archives before they're destroyed.",
          reward: 150,
          difficulty: "hard",
          alignment: "scholarly",
          pathways: {
            heroic: "Preserve and share the knowledge.",
            evil: "Sell to the highest bidder.",
            sacrificial: "Die protecting the archives from fire.",
          }
        },
        {
          id: "sch_m2",
          title: "Teach the Illiterate",
          desc: "Establish a school in a remote village despite opposition.",
          reward: 80,
          difficulty: "medium",
          alignment: "noble",
          pathways: {
            heroic: "Build it strong. Mentor them truly.",
            evil: "Teach false doctrine. Control their minds.",
            sacrificial: "Stay behind when the military comes.",
          }
        },
        {
          id: "sch_m3",
          title: "Expose the Conspiracy",
          desc: "Publish evidence that government agencies created the Plague.",
          reward: 300,
          difficulty: "impossible",
          alignment: "truth",
          pathways: {
            heroic: "Release it. Accept the consequences.",
            evil: "Use it to extort the government.",
            sacrificial: "Die taking the evidence to press.",
          }
        }
      ]
    }
  };

  const FACTION_ACTION_DIE_MAP = {
    corporations: "control",
    religious: "spirit",
    military: "strike",
    underworld: "control",
    rebels: "lead",
    scholars: "mind",
    political: "lead",
  };

  const FACTION_LORE_ROLE_MAP = {
    corporations: "Brokers",
    religious: "Mages",
    military: "Warriors",
    underworld: "Rogues",
    rebels: "Vanguards",
    scholars: "Sages",
    political: "Envoys",
  };

  const BASE_REGION_TYPES = [
    "Sea Region Hex Map",
    "Province Map",
    "Galaxy Map",
    "Random Planet",
    "World That Was",
  ];

  const BASE_FLAVOR = {
    corporations: {
      names: ["Ledger Bastion", "Golden Audit Spire", "Dividend Vault", "Mercantile Spine"],
      details: ["armed accountants", "sealed transaction courts", "private drone docks", "writ-enforced checkpoints"],
      taskVerbs: ["audit", "secure", "broker", "extract"],
      taskTargets: ["shadow contracts", "shipping ledgers", "proxy directors", "fuel futures"],
      missionHooks: ["buy out a rival route", "silence an embezzlement ring", "recover a vanished escrow AI", "enforce a debt embargo"],
    },
    religious: {
      names: ["Choir Reliquary", "Sanctum of the Last Hymn", "Ashen Cathedral", "Pilgrim Spiral"],
      details: ["candlelit surgical bays", "trial chapels", "choirs under vow", "penitent processions"],
      taskVerbs: ["sanctify", "escort", "investigate", "recover"],
      taskTargets: ["a broken relic", "a missing cantor", "a blasphemous codex", "a cursed hospice wing"],
      missionHooks: ["judge a miracle as fraud or truth", "cleanse a shrine seized by raiders", "guard a midnight pilgrimage", "trace false prophecy broadcasts"],
    },
    military: {
      names: ["Iron Redoubt", "Cohort Citadel", "Siege Registry", "Bastion Nine"],
      details: ["drill yards", "munitions depots", "war councils", "strict curfews"],
      taskVerbs: ["fortify", "recon", "intercept", "drill"],
      taskTargets: ["a breached wall", "hostile scouts", "stolen munitions", "a mutinous platoon"],
      missionHooks: ["hold a chokepoint until dawn", "rescue a trapped convoy", "retake a silent watchtower", "break a siege beacon network"],
    },
    underworld: {
      names: ["Crown Hollow", "Black Lantern Den", "Ratline Court", "Whisper Forge"],
      details: ["hidden tunnels", "coded taverns", "smuggler shrines", "lookouts on every rooftop"],
      taskVerbs: ["smuggle", "tail", "blackmail", "stash"],
      taskTargets: ["a marked witness", "a sealed cargo canister", "a double agent", "a vanished fence"],
      missionHooks: ["run medicine through a military cordon", "steal a priest's confession archive", "extract a turncoat alive", "replace bounty posters with forgeries"],
    },
    rebels: {
      names: ["People's Switchyard", "The Red Assembly", "Freewire Camp", "Hammerfall Commune"],
      details: ["crowded planning tents", "jury-rigged comm towers", "public debate pits", "shared kitchens"],
      taskVerbs: ["recruit", "sabotage", "evacuate", "broadcast"],
      taskTargets: ["a captured cell", "a power relay", "a ration convoy", "a hidden press node"],
      missionHooks: ["spark a synchronized strike", "escort families out of a kill-zone", "hijack propaganda feeds", "trade hostages for ceasefire hours"],
    },
    scholars: {
      names: ["Archive Vault 7", "The Lantern Athenaeum", "Dustglass Institute", "Quiet Stack Citadel"],
      details: ["sealed stacks", "field laboratories", "cipher circles", "forbidden reading rooms"],
      taskVerbs: ["catalog", "decode", "preserve", "cross-examine"],
      taskTargets: ["a fractured star-chart", "court transcripts", "contaminated samples", "a pre-collapse core"],
      missionHooks: ["recover a lost thesis from raider hands", "verify plague-origin evidence", "escort novice archivists", "negotiate for restricted manuscripts"],
    },
  };

  function pick(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)] || "";
  }

  function toTitle(text) {
    return String(text || "").charAt(0).toUpperCase() + String(text || "").slice(1);
  }

  function getFactionRenown(factionId) {
    if (typeof S === "undefined" || !S || !S.factionRenown || typeof S.factionRenown !== "object") return 0;
    return Number(S.factionRenown[factionId] || 0);
  }

  function ensureFactionState() {
    if (typeof S === "undefined" || !S) return;
    if (!S.factionRenown || typeof S.factionRenown !== "object") S.factionRenown = {};
    if (!S.factionBases || typeof S.factionBases !== "object") S.factionBases = {};

    Object.keys(FACTIONS).forEach((id) => {
      if (typeof S.factionRenown[id] !== "number") S.factionRenown[id] = 0;
      if (!S.factionBases[id]) {
        const theme = BASE_FLAVOR[id] || BASE_FLAVOR.scholars;
        const regionType = pick(BASE_REGION_TYPES);
        S.factionBases[id] = {
          regionType,
          baseName: pick(theme.names),
          ambientDetail: pick(theme.details),
          rumorClock: 0,
          marker: {},
          activeTask: null,
          activeMission: null,
          activeEvents: [],
          npcs: [],
          merchantStock: [],
          generatedRooms: [],
        };
      }
    });
  }

  function generateFactionBaseTask(factionId) {
    const theme = BASE_FLAVOR[factionId] || BASE_FLAVOR.scholars;
    return {
      title: toTitle(pick(theme.taskVerbs)) + " " + pick(theme.taskTargets),
      check: toTitle(FACTION_ACTION_DIE_MAP[factionId] || "mind") + " check recommended",
      reward: "+1 " + toTitle(factionId) + " Renown on success",
    };
  }

  function generateFactionBaseMission(factionId) {
    const theme = BASE_FLAVOR[factionId] || BASE_FLAVOR.scholars;
    const renown = getFactionRenown(factionId);
    const tier = renown >= 6 ? "High Stakes" : renown >= 3 ? "Trusted Operative" : "Initiate";
    return {
      title: toTitle(tier) + ": " + toTitle(pick(theme.missionHooks)),
      difficulty: renown >= 6 ? "very_hard" : renown >= 3 ? "hard" : "medium",
      payout: (120 + Math.max(0, renown) * 45) + " Credits",
    };
  }

  function generateFactionBaseEvents(factionId) {
    const factionName = FACTIONS[factionId] ? FACTIONS[factionId].name : "the faction";
    const pool = [
      "A Wayfarer arrives with rumors about a forgotten route tied to " + factionName + ".",
      "A hazard alarm blares: toxic seepage floods one corridor and everyone scrambles.",
      "A peril unfolds as a trusted quartermaster is accused of selling access codes.",
      "Monsters probe the perimeter and the base is forced into emergency defense drills.",
      "A hidden cache is discovered behind old masonry, packed with pre-collapse records.",
      "Two operatives argue over doctrine, and the dispute spills into the command floor.",
      "A courier returns from the frontier carrying contradictory reports of an incoming raid.",
      "A secret chamber is found under the base, containing names no one wants spoken aloud.",
    ];
    const events = [];
    while (events.length < 3 && pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      events.push(pool.splice(idx, 1)[0]);
    }
    return events;
  }

  function isProvinceKeyValid(key) {
    if (!key || typeof mapData === "undefined" || !Array.isArray(mapData)) return false;
    const parts = String(key).split(",");
    if (parts.length !== 2) return false;
    const c = Number(parts[0]);
    const r = Number(parts[1]);
    return mapData.some((h) => h && h.col === c && h.row === r);
  }

  function assignProvinceMarker(base) {
    if (typeof mapData === "undefined" || !Array.isArray(mapData) || !mapData.length) return false;
    const hex = mapData[Math.floor(Math.random() * mapData.length)];
    base.marker = { system: "province", provinceKey: hex.col + "," + hex.row };
    return true;
  }

  function assignSeaMarker(base) {
    if (!S || !S.lastSea || !Array.isArray(S.lastSea.map) || !S.lastSea.map.length) return false;
    const hex = S.lastSea.map[Math.floor(Math.random() * S.lastSea.map.length)];
    base.marker = { system: "sea", seaKey: hex.key };
    return true;
  }

  function assignGalaxyMarker(base) {
    if (!S || !S.starSystem || !Array.isArray(S.starSystem.hexes) || !S.starSystem.hexes.length) return false;
    const candidates = S.starSystem.hexes.filter((h) => h && h.ring !== "core");
    if (!candidates.length) return false;
    const hex = candidates[Math.floor(Math.random() * candidates.length)];
    base.marker = { system: "galaxy", galaxyHexId: Number(hex.id) };
    return true;
  }

  function assignWTWMarker(base) {
    if (!S || !S.worldThatWas || !Array.isArray(S.worldThatWas.hexes) || !S.worldThatWas.hexes.length) return false;
    const hex = S.worldThatWas.hexes[Math.floor(Math.random() * S.worldThatWas.hexes.length)];
    base.marker = { system: "wtw", wtwHexId: String(hex.id) };
    return true;
  }

  function assignPlanetMarker(base) {
    if (!S || !S.starSystem || !S.starSystem.planetExplorationByHex) return false;
    const hexKeys = Object.keys(S.starSystem.planetExplorationByHex);
    if (!hexKeys.length) return false;
    const pickedHex = hexKeys[Math.floor(Math.random() * hexKeys.length)];
    const state = S.starSystem.planetExplorationByHex[pickedHex];
    if (!state || !Array.isArray(state.cells) || !state.cells.length) return false;
    const cell = state.cells[Math.floor(Math.random() * state.cells.length)];
    base.marker = { system: "planet", planetHexId: Number(pickedHex), planetCellId: Number(cell.id) };
    return true;
  }

  function ensureFactionBaseMarker(factionId) {
    ensureFactionState();
    const base = S && S.factionBases ? S.factionBases[factionId] : null;
    if (!base) return null;
    const m = base.marker || {};

    if (base.regionType === "Province Map") {
      if (!m.provinceKey || !isProvinceKeyValid(m.provinceKey)) assignProvinceMarker(base);
    } else if (base.regionType === "Sea Region Hex Map") {
      const ok = !!(m.seaKey && S && S.lastSea && Array.isArray(S.lastSea.map) && S.lastSea.map.some((h) => h && h.key === m.seaKey));
      if (!ok) assignSeaMarker(base);
    } else if (base.regionType === "Galaxy Map") {
      const ok = !!(typeof m.galaxyHexId === "number" && S && S.starSystem && Array.isArray(S.starSystem.hexes) && S.starSystem.hexes.some((h) => h && Number(h.id) === Number(m.galaxyHexId)));
      if (!ok) assignGalaxyMarker(base);
    } else if (base.regionType === "World That Was") {
      const ok = !!(m.wtwHexId && S && S.worldThatWas && Array.isArray(S.worldThatWas.hexes) && S.worldThatWas.hexes.some((h) => h && String(h.id) === String(m.wtwHexId)));
      if (!ok) assignWTWMarker(base);
    } else if (base.regionType === "Random Planet") {
      const state = S && S.starSystem && S.starSystem.planetExplorationByHex
        ? S.starSystem.planetExplorationByHex[String(m.planetHexId)]
        : null;
      const ok = !!(state && Array.isArray(state.cells) && state.cells.some((cell) => Number(cell.id) === Number(m.planetCellId)));
      if (!ok) assignPlanetMarker(base);
    }

    return base;
  }

  function syncFactionBaseMarkers() {
    ensureFactionState();
    Object.keys(FACTIONS).forEach((id) => ensureFactionBaseMarker(id));
  }

  function findBaseByMarker(region, key, secondary) {
    ensureFactionState();
    const ids = Object.keys(FACTIONS);
    for (let i = 0; i < ids.length; i++) {
      const factionId = ids[i];
      const base = ensureFactionBaseMarker(factionId);
      if (!base || !base.marker) continue;
      const m = base.marker;
      if (region === "province" && String(m.provinceKey || "") === String(key || "")) return { factionId, base };
      if (region === "sea" && String(m.seaKey || "") === String(key || "")) return { factionId, base };
      if (region === "galaxy" && Number(m.galaxyHexId) === Number(key)) return { factionId, base };
      if (region === "wtw" && String(m.wtwHexId || "") === String(key || "")) return { factionId, base };
      if (region === "planet" && Number(m.planetHexId) === Number(key) && Number(m.planetCellId) === Number(secondary)) return { factionId, base };
    }
    return null;
  }

  function getFactionBaseMarkerAtProvince(key) {
    const found = findBaseByMarker("province", key);
    return found ? { factionId: found.factionId, baseName: found.base.baseName } : null;
  }

  function getFactionBaseMarkerAtSea(key) {
    const found = findBaseByMarker("sea", key);
    return found ? { factionId: found.factionId, baseName: found.base.baseName } : null;
  }

  function getFactionBaseMarkerAtGalaxy(hexId) {
    const found = findBaseByMarker("galaxy", hexId);
    return found ? { factionId: found.factionId, baseName: found.base.baseName } : null;
  }

  function getFactionBaseMarkerAtWTW(hexId) {
    const found = findBaseByMarker("wtw", hexId);
    return found ? { factionId: found.factionId, baseName: found.base.baseName } : null;
  }

  function getFactionBaseMarkerAtPlanet(hexId, cellId) {
    const found = findBaseByMarker("planet", hexId, cellId);
    return found ? { factionId: found.factionId, baseName: found.base.baseName } : null;
  }

  // ============================================================================
  // STORY PATHWAYS — The Five Philosophical Ends
  // ============================================================================

  const STORY_PATHWAYS = {
    heroic: {
      id: "heroic",
      name: "The Heroic Path",
      emoji: "⚡",
      description: "Always sacrifice for others. Choose redemption over power.",
      keyChoices: [
        "Protect the innocent at cost to yourself",
        "Oppose tyranny even when outmatched",
        "Speak truth even when it destroys you",
        "Give mercy to enemies"
      ],
      idealFactions: ["rebels", "scholars", "religious"],
      ending: {
        title: "The Light Behind You",
        text: "Your name becomes legend—not for what you conquered, but for what you saved. The world doesn't change overnight, but because you chose sacrifice, others find the courage to do the same. You don't see the peace you fought for, but you know it was planted in better soil.",
        vibe: "Bittersweet triumph. Legacy matters more than life."
      }
    },

    evil: {
      id: "evil",
      name: "The Tyrant's Path",
      emoji: "👿",
      description: "Accumulate power. Dominate those weaker than you.",
      keyChoices: [
        "Betray allies for personal gain",
        "Rule through fear and cruelty",
        "Take everything that isn't nailed down",
        "Treat mercy as weakness"
      ],
      idealFactions: ["corporations", "military"],
      ending: {
        title: "The Empty Throne",
        text: "You won. You control cities, command armies, own fortunes. You sit upon a throne built from the bones of those you crushed. Every shadow might be an assassin. Every ally smiles with a hidden knife. You have everything except the one thing you can never buy back: the capacity to trust anyone. You died at the top of the hill, alone.",
        vibe: "Hollow victory. Power without meaning."
      }
    },

    sacrificial: {
      id: "sacrificial",
      name: "The Martyr's Path",
      emoji: "❤️",
      description: "Give everything, including your life, to a cause greater than yourself.",
      keyChoices: [
        "Shoulder others' burdens repeatedly",
        "Seek redemption through suffering",
        "Die for what you believe",
        "Leave nothing behind but memory"
      ],
      idealFactions: ["religious", "rebels", "underworld"],
      ending: {
        title: "The Last Prayer",
        text: "In your final moments, you understand: you were never meant to survive. Your death becomes the fulcrum upon which the world turns. Movements rise in your name. The oppressed take courage from your sacrifice. You become myth—and myths, you discover from beyond the veil, are more powerful than any living hero.",
        vibe: "Tragic grace. Your death births change."
      }
    },

    sad: {
      id: "sad",
      name: "The Broken Path",
      emoji: "💔",
      description: "Make the hard choices. Accept that you can't save everyone.",
      keyChoices: [
        "Choose between two evils",
        "Let people die to save others",
        "Sacrifice your hopes for others' survival",
        "Live with unbearable guilt"
      ],
      idealFactions: ["military", "underworld", "corporations"],
      ending: {
        title: "The Long Forgetting",
        text: "The world stabilizes. It's not better—it's just... different. You survived when better people didn't. You made the calls that saved thousands but condemned hundreds. You're remembered, but with an undertone of sadness. You live long enough to see what you fought for become twisted in new ways. In the end, you pour yourself into whiskey and regret, knowing some choices can never be unmade.",
        vibe: "Quiet despair. You paid the price and still owe a debt."
      }
    },

    happy: {
      id: "happy",
      name: "The Fortunate Path",
      emoji: "🌟",
      description: "Build connections. Create win-wins. Find the overlapping interests.",
      keyChoices: [
        "Find common ground between enemies",
        "Build alliances through understanding",
        "Protect both yourself and others",
        "Leave the world better without breaking yourself"
      ],
      idealFactions: ["scholars", "corporations", "religious"],
      ending: {
        title: "The Sunrise",
        text: "Against impossible odds, you actually did it. The factions found common cause. The war ended not in annihilation but in treaty, understanding, and mutual benefit. You built a network of trust so strong that each faction realized they needed each other more than they needed dominance. You take a lover. You build a home. You plant orchards and watch them grow. This ending is so rare, so seemingly impossible, that historians will spend centuries debating whether you were brilliant or just impossibly lucky.",
        vibe: "Rare joy. The ending nobody believes is possible."
      }
    }
  };

  // ============================================================================
  // FACTION DYNAMICS — Trust, Betrayal, Rival Factions
  // ============================================================================

  const FACTION_DYNAMICS = {
    allies: [
      { f1: "rebels", f2: "underworld" },
      { f1: "rebels", f2: "scholars" },
      { f1: "religious", f2: "scholars" },
      { f1: "corporations", f2: "military" },
      { f1: "scholars", f2: "religious" }
    ],
    enemies: [
      { f1: "rebels", f2: "corporations" },
      { f1: "rebels", f2: "military" },
      { f1: "underworld", f2: "military" },
      { f1: "religious", f2: "underworld" },
      { f1: "corporations", f2: "rebels" }
    ],
    neutral: [
      { f1: "scholars", f2: "corporations" },
      { f1: "scholars", f2: "military" },
      { f1: "underworld", f2: "corporations" }
    ]
  };

  // ============================================================================
  // CONSEQUENCES SYSTEM — Choices Have Cascading Effects
  // ============================================================================

  const CHOICE_CONSEQUENCES = {
    // When you make a choice, it affects multiple factions
    // Example structure:
    "rescue_rebel_leader": {
      immediate: { reputation: { rebels: 3 } },
      delayed_turn_5: { reputation: { military: -2 }, alert: "Military is hunting you" },
      delayed_turn_10: { reputation: { underworld: 1 }, text: "The Underground Crown notices your loyalty" }
    },

    "cooperate_with_military": {
      immediate: { reputation: { military: 2 } },
      delayed_turn_3: { reputation: { rebels: -2, underworld: -1 }, alert: "Rebels consider you a traitor" }
    },

    "steal_corporate_secrets": {
      immediate: { reputation: { underworld: 2, scholars: 1 } },
      delayed_turn_4: { reputation: { corporations: -3, military: -1 }, bounty: 500 }
    },

    "help_religious_pilgrims": {
      immediate: { reputation: { religious: 2, scholars: 1 } },
      delayed_turn_6: { reputation: { underworld: -1 }, text: "Underworld views you as weak" }
    }
  };

  // ============================================================================
  // TRUST SYSTEM — Build Deep Relationships
  // ============================================================================

  const TRUST_LEVELS = [
    { level: 0, name: "Unknown", effect: "Limited missions available" },
    { level: 1, name: "Acquainted", effect: "Minor missions open. Basic discounts." },
    { level: 2, name: "Trusted", effect: "Medium missions open. Better discounts. Allies will help in crisis." },
    { level: 3, name: "Bonded", effect: "Major missions open. Faction leader meets you personally. Access to secret locations." },
    { level: 4, name: "Blood-Sworn", effect: "Exclusive missions. Faction will go to war for you. Access to legendary items." },
  ];

  // ============================================================================
  // BETRAYAL MECHANICS
  // ============================================================================

  const BETRAYAL_SCENARIOS = [
    {
      id: "double_agent",
      title: "The Double Agent",
      desc: "A faction learns you've been accepting missions from their enemies",
      severity: "high",
      consequence: "Reputation loss, possible contract on your head",
      recoveryOptions: [
        { text: "Confession and penance — take a dangerous redemption mission", cost: "time + risk" },
        { text: "Deny everything — they're not sure, but trust is fractured", cost: "reputation -2 per faction" },
        { text: "Prove your loyalty by eliminating a greater threat", cost: "potentially killing innocents" }
      ]
    },

    {
      id: "divided_loyalty",
      title: "Divided Loyalty",
      desc: "Two allied factions ask you to do conflicting missions",
      severity: "medium",
      consequence: "Betraying one faction no matter what you do",
      recoveryOptions: [
        { text: "Come clean to both factions about the contradiction", cost: "temporary distrust" },
        { text: "Play them against each other (dangerous)", cost: "both might turn on you" },
        { text: "Somehow complete both missions (nearly impossible)", cost: "extreme risk" }
      ]
    },

    {
      id: "faction_betrays_you",
      title: "The Faction Betrays You",
      desc: "Your trusted faction sells you out or sets a deadly trap",
      severity: "critical",
      consequence: "Lose that faction entirely, risk death",
      recoveryOptions: [
        { text: "Disappear and join a rival faction", cost: "all progress with old faction lost" },
        { text: "War — take revenge", cost: "enemies unite against you" },
        { text: "Redemption arc — prove that faction wrong", cost: "longest most dangerous path" }
      ]
    }
  ];

  // ============================================================================
  // DYNAMIC CHOICE GENERATION — Every Decision Feels Unique
  // ============================================================================

  function generateAdaptiveChoices(currentContext) {
    // Player's choices ALWAYS matter and lead to new situations
    // This system ensures no two playthroughs are identical
    const factionStates = currentContext.factionReputation;
    const moralAlignment = currentContext.pathwayAlignment;
    const pastChoices = currentContext.choiceHistory;

    const choices = [];

    // Every choice has 3+ options aligned to different philosophies
    // Every choice has unseen consequences that ripple through the world

    return choices;
  }

  // ============================================================================
  // SETUP — Initialize Faction System
  // ============================================================================

  function setupFactionTab() {
    ensureFactionState();
    syncFactionBaseMarkers();
    const factionPanel = document.getElementById(FACTION_TAB_ID);
    if (!factionPanel) return;

    let html = `
      <div class="faction-container">
        <div class="faction-intro">
          <h2>FACTION SYSTEM</h2>
          <p>The world is divided. Six factions compete, cooperate, and conspire. Your loyalty shapes endings, and each Renown rank grants a roll bonus to that faction's signature Action Die during its story pressure.</p>
          <p style="margin-top:.45rem;color:var(--muted2);font-size:.82rem;line-height:1.6;">
            Lore Focus Mapping:
            <strong style="color:var(--gold2);">Mages = Mind</strong>,
            <strong style="color:var(--gold2);">Warriors = Strike</strong>,
            <strong style="color:var(--gold2);">Rogues/Brokers = Control</strong>,
            <strong style="color:var(--gold2);">Vanguards/Envoys = Lead</strong>,
            <strong style="color:var(--gold2);">Sages = Mind</strong>.
          </p>
        </div>

        <div class="faction-grid">
    `;

    Object.values(FACTIONS).forEach((faction) => {
      const renown = getFactionRenown(faction.id);
      const actionDie = FACTION_ACTION_DIE_MAP[faction.id] || "mind";
      const loreRole = FACTION_LORE_ROLE_MAP[faction.id] || "Specialists";
      const base = (S && S.factionBases && S.factionBases[faction.id]) ? S.factionBases[faction.id] : null;
      html += `
        <div class="faction-card" data-faction="${faction.id}">
          <div class="faction-header">
            <span class="faction-emoji">${faction.emoji}</span>
            <h3>${faction.name}</h3>
          </div>
          <div class="faction-essence">${faction.essence}</div>
          <p class="faction-lore">${faction.lore}</p>
          <p class="faction-motto"><em>"${faction.motto}"</em></p>
          <div class="faction-stats">
            <div class="stat">
              <label>Philosophy:</label>
              <span>${faction.philosophy}</span>
            </div>
            <div class="stat">
              <label>Ideal Ending:</label>
              <span>${faction.idealEnding}</span>
            </div>
            <div class="stat">
              <label>Renown:</label>
              <span>${renown}</span>
            </div>
            <div class="stat">
              <label>Lore Focus:</label>
              <span>${loreRole} = ${toTitle(actionDie)}</span>
            </div>
            <div class="stat">
              <label>Action Die Bonus:</label>
              <span>+${Math.max(0, renown)} ${toTitle(actionDie)} (${loreRole} story)</span>
            </div>
            <div class="stat">
              <label>Faction Base:</label>
              <span>${base ? base.regionType : "Uncharted"}</span>
            </div>
          </div>
          <button class="btn btn-sm" onclick="factionSystem.visitBase('${faction.id}')" style="margin-bottom:.4rem;">
            Visit Faction Base
          </button>
          <button class="btn btn-primary faction-expand" onclick="factionSystem.expandFaction('${faction.id}')">
            View Missions & Pathways
          </button>
        </div>
      `;
    });

    html += `
        </div>

        <div class="faction-pathways">
          <h2>YOUR STORY PATHWAY</h2>
          <p>The choices you make determine not just which faction wins, but what kind of ending you receive.</p>
          <div class="pathway-grid">
    `;

    Object.values(STORY_PATHWAYS).forEach((pathway) => {
      html += `
        <div class="pathway-card">
          <span class="pathway-emoji">${pathway.emoji}</span>
          <h3>${pathway.name}</h3>
          <p class="pathway-desc">${pathway.description}</p>
          <div class="key-choices">
            <strong>Key Choices:</strong>
            <ul>
              ${pathway.keyChoices.map(choice => `<li>${choice}</li>`).join('')}
            </ul>
          </div>
          <div class="pathway-ending">
            <strong>${pathway.ending.title}</strong>
            <p>${pathway.ending.text}</p>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <div class="faction-dynamics">
          <h2>FACTION DYNAMICS</h2>
          <div class="dynamics-section">
            <h3>Natural Allies</h3>
            <p>These factions work together:</p>
            ${FACTION_DYNAMICS.allies.map(pair => `
              <div class="dynamic-pair">
                <span>${FACTIONS[pair.f1].emoji} ${FACTIONS[pair.f1].name}</span>
                <span>↔</span>
                <span>${FACTIONS[pair.f2].emoji} ${FACTIONS[pair.f2].name}</span>
              </div>
            `).join('')}
          </div>
          <div class="dynamics-section">
            <h3>Natural Enemies</h3>
            <p>These factions fight each other:</p>
            ${FACTION_DYNAMICS.enemies.map(pair => `
              <div class="dynamic-pair enemy">
                <span>${FACTIONS[pair.f1].emoji} ${FACTIONS[pair.f1].name}</span>
                <span>⚔️</span>
                <span>${FACTIONS[pair.f2].emoji} ${FACTIONS[pair.f2].name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="faction-trust">
          <h2>TRUST & BETRAYAL</h2>
          <p>Building trust with a faction opens exclusive missions and deep relationships. But trust can be shattered.</p>
          <div class="trust-levels">
    `;

    TRUST_LEVELS.forEach((level) => {
      html += `
        <div class="trust-level">
          <strong>${level.name}</strong> (Level ${level.level})
          <p>${level.effect}</p>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    factionPanel.innerHTML = html;
  }

  function getFactionStoryRollBonus(factionId, statKey) {
    const mapped = FACTION_ACTION_DIE_MAP[factionId] || "";
    if (!mapped || mapped !== statKey) return 0;
    return Math.max(0, getFactionRenown(factionId));
  }

  function resolveFactionBaseAnchor(base) {
    if (!base || !base.regionType) return "Unknown location";
    const m = base.marker || {};
    if (base.regionType === "Province Map") {
      const parts = String(m.provinceKey || "").split(",");
      if (parts.length === 2) return "Province Hex [" + (Number(parts[0]) + 1) + "," + (Number(parts[1]) + 1) + "]";
      return "Province frontier outpost";
    }
    if (base.regionType === "Sea Region Hex Map") return m.seaKey ? ("Sea Hex " + m.seaKey) : "A storm-lashed sea fort";
    if (base.regionType === "Galaxy Map") return (typeof m.galaxyHexId === "number") ? ("Galaxy Hex #" + m.galaxyHexId) : "A drifting orbital station";
    if (base.regionType === "Random Planet") {
      if (typeof m.planetHexId === "number" && typeof m.planetCellId === "number") return "Planet Hex #" + m.planetHexId + " / Cell #" + m.planetCellId;
      return "An unlisted colony world";
    }
    if (base.regionType === "World That Was") return m.wtwHexId ? ("World District " + m.wtwHexId) : "A ruined district in the World That Was";
    return base.regionType;
  }

  function safeFactionRenownDelta(factionId, amount) {
    if (typeof changeFactionRenown === "function") {
      changeFactionRenown(factionId, amount);
      return;
    }
    if (!S || !S.factionRenown) return;
    S.factionRenown[factionId] = Math.max(-10, Math.min(20, Number(S.factionRenown[factionId] || 0) + Number(amount || 0)));
  }

  function rollBaseCheck(statKey, dread) {
    const die = (typeof getEffectiveDie === "function") ? getEffectiveDie(statKey) : ((S && S.stats && S.stats[statKey]) || 4);
    const a = (typeof explodingRoll === "function") ? explodingRoll(die) : { total: Math.floor(Math.random() * die) + 1 };
    const d = (typeof explodingRoll === "function") ? explodingRoll(dread) : { total: Math.floor(Math.random() * dread) + 1 };
    return { success: a.total >= d.total, action: a.total, dread: d.total, die };
  }

  function missionDreadByDifficulty(diff) {
    if (diff === "very_hard") return 12;
    if (diff === "hard") return 10;
    return 8;
  }

  function buildMerchantStock() {
    if (typeof buildGalaxyMerchantOffers === "function") {
      const offers = buildGalaxyMerchantOffers("Faction Base Merchant");
      return Array.isArray(offers) ? offers.slice(0, 6) : [];
    }
    const out = [];
    const cats = (typeof SHOP_DATA === "object" && SHOP_DATA) ? ["items", "toolkits", "tradegoods", "weapons", "armor"] : [];
    cats.forEach((cat) => {
      const list = SHOP_DATA[cat] || [];
      if (list.length) out.push(list[Math.floor(Math.random() * list.length)]);
    });
    return out.slice(0, 6);
  }

  function generateBaseNPCs(factionId) {
    const names = ["Quartermaster Nera", "Scout Voss", "Archivist Pell", "Captain Ilya", "Broker Tamsin", "Wayfarer Dren"]; 
    const rumors = generateFactionBaseEvents(factionId);
    const npcs = [];
    while (npcs.length < 3 && names.length) {
      const idx = Math.floor(Math.random() * names.length);
      const name = names.splice(idx, 1)[0];
      npcs.push({ name, rumor: pick(rumors), mood: pick(["guarded", "friendly", "hurried", "suspicious"]) });
    }
    return npcs;
  }

  function generateBaseRooms(factionId) {
    const theme = BASE_FLAVOR[factionId] || BASE_FLAVOR.scholars;
    const rooms = [
      "Command Wing - " + pick(theme.details),
      "Mess Hall - operatives trade rumors over stale ration tea.",
      "Armory Vault - quartermasters log every missing crate.",
      "Service Corridor - old conduits hide side chambers.",
      "Archive Chamber - sealed ledgers and half-burned maps.",
      "Sublevel Access - a locked hatch leads to forgotten rooms.",
    ];
    const out = [];
    while (out.length < 4 && rooms.length) {
      const idx = Math.floor(Math.random() * rooms.length);
      out.push(rooms.splice(idx, 1)[0]);
    }
    return out;
  }

  function ensureBaseActivity(factionId) {
    const base = ensureFactionBaseMarker(factionId);
    if (!base) return null;
    if (!base.activeTask) {
      const t = generateFactionBaseTask(factionId);
      base.activeTask = { title: t.title, check: t.check, reward: t.reward, accepted: false, resolved: false };
    }
    if (!base.activeMission) {
      const m = generateFactionBaseMission(factionId);
      base.activeMission = { title: m.title, difficulty: m.difficulty, payout: m.payout, accepted: false, resolved: false };
    }
    if (!Array.isArray(base.activeEvents) || !base.activeEvents.length) {
      base.activeEvents = generateFactionBaseEvents(factionId).map((text) => ({ text, resolved: false }));
    }
    if (!Array.isArray(base.npcs) || !base.npcs.length) {
      base.npcs = generateBaseNPCs(factionId);
    }
    if (!Array.isArray(base.merchantStock) || !base.merchantStock.length) {
      base.merchantStock = buildMerchantStock();
    }
    if (!Array.isArray(base.generatedRooms) || !base.generatedRooms.length) {
      base.generatedRooms = generateBaseRooms(factionId);
    }
    return base;
  }

  function openFactionBaseHub(factionId) {
    const faction = FACTIONS[factionId];
    const base = ensureBaseActivity(factionId);
    if (!faction || !base) return;
    const anchor = resolveFactionBaseAnchor(base);
    const task = base.activeTask;
    const mission = base.activeMission;

    const html = `
      <div style="font-size:.83rem;color:var(--text2);line-height:1.65;">
        <div style="font-family:'Cinzel',serif;color:var(--gold2);font-size:.92rem;letter-spacing:.08em;margin-bottom:.35rem;">${faction.emoji} ${base.baseName}</div>
        <div style="margin-bottom:.45rem;"><strong>Region:</strong> ${base.regionType} · <strong>Anchor:</strong> ${anchor}</div>
        <div style="margin-bottom:.5rem;">Base status feels alive: ${base.ambientDetail}. Rumor pulse: <strong>${base.rumorClock}</strong>.</div>

        <div style="border:1px solid var(--border2);padding:.5rem;margin-bottom:.45rem;">
          <div style="font-family:'Cinzel',serif;color:var(--teal);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;">Faction Task</div>
          <div><strong>${task.title}</strong></div>
          <div style="color:var(--muted2);">${task.check}</div>
          <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.35rem;">
            ${task.accepted ? `<button class="btn btn-xs" disabled>Accepted</button>` : `<button class="btn btn-xs btn-teal" onclick="factionSystem.acceptTask('${factionId}')">Accept Task</button>`}
            ${task.accepted && !task.resolved ? `<button class="btn btn-xs btn-primary" onclick="factionSystem.resolveTask('${factionId}')">Resolve Task</button>` : ""}
            ${task.resolved ? `<span style="color:var(--green2);font-size:.78rem;">Resolved</span>` : ""}
          </div>
        </div>

        <div style="border:1px solid var(--border2);padding:.5rem;margin-bottom:.45rem;">
          <div style="font-family:'Cinzel',serif;color:var(--teal);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;">Faction Mission</div>
          <div><strong>${mission.title}</strong></div>
          <div style="color:var(--muted2);">Difficulty: ${mission.difficulty} · Payout: ${mission.payout}</div>
          <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.35rem;">
            ${mission.accepted ? `<button class="btn btn-xs" disabled>Accepted</button>` : `<button class="btn btn-xs btn-teal" onclick="factionSystem.acceptMission('${factionId}')">Accept Mission</button>`}
            ${mission.accepted && !mission.resolved ? `<button class="btn btn-xs btn-primary" onclick="factionSystem.resolveMission('${factionId}')">Resolve Mission</button>` : ""}
            ${mission.resolved ? `<span style="color:var(--green2);font-size:.78rem;">Resolved</span>` : ""}
          </div>
        </div>

        <div style="border:1px solid var(--border2);padding:.5rem;margin-bottom:.45rem;">
          <div style="font-family:'Cinzel',serif;color:var(--teal);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;">Random Events</div>
          <ul style="margin:.3rem 0 0 1rem;">${base.activeEvents.map((ev, idx) => `<li>${ev.text} ${ev.resolved ? `<span style='color:var(--green2);'>(resolved)</span>` : `<button class='btn btn-xs' style='margin-left:.35rem;' onclick="factionSystem.resolveEvent('${factionId}',${idx})">Interact</button>`}</li>`).join("")}</ul>
        </div>

        <div style="border:1px solid var(--border2);padding:.5rem;margin-bottom:.45rem;">
          <div style="font-family:'Cinzel',serif;color:var(--teal);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;">People To Talk To</div>
          ${base.npcs.map((npc, idx) => `<div style='margin-top:.25rem;'><strong>${npc.name}</strong> (${npc.mood}) - ${npc.rumor}<div><button class='btn btn-xs btn-teal' onclick="factionSystem.talkNpc('${factionId}',${idx})">Talk</button></div></div>`).join("")}
        </div>

        <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.45rem;">
          <button class="btn btn-xs btn-primary" onclick="factionSystem.openMerchant('${factionId}')">Open Base Merchant</button>
          <button class="btn btn-xs" onclick="factionSystem.generateRooms('${factionId}')">Generate Rooms</button>
          <button class="btn btn-xs" onclick="factionSystem.rollEvents('${factionId}')">Roll New Events</button>
        </div>

        <div style="border:1px solid var(--border2);padding:.5rem;">
          <div style="font-family:'Cinzel',serif;color:var(--teal);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;">Base Interior Rooms</div>
          ${base.generatedRooms.map((room, idx) => `<div style='margin-top:.22rem;'>Room ${idx + 1}: ${room}</div>`).join("")}
        </div>
      </div>
    `;

    openFactionModal("Faction Base: " + faction.name, html);
  }

  function acceptFactionTask(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base || !base.activeTask || base.activeTask.accepted) return;
    base.activeTask.accepted = true;
    if (typeof showNotif === "function") showNotif("Faction task accepted.", "good");
    openFactionBaseHub(factionId);
  }

  function resolveFactionTask(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base || !base.activeTask || !base.activeTask.accepted || base.activeTask.resolved) return;
    const stat = FACTION_ACTION_DIE_MAP[factionId] || "mind";
    const check = rollBaseCheck(stat, 8);
    if (check.success) {
      base.activeTask.resolved = true;
      safeFactionRenownDelta(factionId, 1);
      if (typeof changeCredits === "function") changeCredits(80);
      else if (S) S.credits = Math.max(0, Number(S.credits || 0) + 80);
      if (typeof showNotif === "function") showNotif("Task success: +1 faction Renown, +80 credits.", "good");
      base.activeTask = null;
    } else {
      if (typeof changeStress === "function") changeStress(1);
      if (typeof showNotif === "function") showNotif("Task failed: " + stat.toUpperCase() + " d" + check.die + "=" + check.action + " vs DD8=" + check.dread + ".", "warn");
    }
    openFactionBaseHub(factionId);
  }

  function resolveFactionMission(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base || !base.activeMission || !base.activeMission.accepted || base.activeMission.resolved) return;
    const stat = FACTION_ACTION_DIE_MAP[factionId] || "mind";
    const dd = missionDreadByDifficulty(base.activeMission.difficulty);
    const check = rollBaseCheck(stat, dd);
    if (check.success) {
      base.activeMission.resolved = true;
      safeFactionRenownDelta(factionId, 1);
      const pay = Number(String(base.activeMission.payout).replace(/[^0-9]/g, "") || 120);
      if (typeof changeCredits === "function") changeCredits(pay);
      else if (S) S.credits = Math.max(0, Number(S.credits || 0) + pay);
      if (typeof showNotif === "function") showNotif("Mission success: +1 faction Renown, +" + pay + " credits.", "good");
      base.activeMission = null;
    } else {
      if (typeof changeMentalStress === "function") changeMentalStress(1);
      else if (typeof changeStress === "function") changeStress(1);
      if (typeof showNotif === "function") showNotif("Mission failed: " + stat.toUpperCase() + " d" + check.die + "=" + check.action + " vs DD" + dd + "=" + check.dread + ".", "warn");
    }
    openFactionBaseHub(factionId);
  }

  function acceptFactionMission(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base || !base.activeMission || base.activeMission.accepted) return;
    base.activeMission.accepted = true;
    if (typeof showNotif === "function") showNotif("Faction mission accepted.", "good");
    openFactionBaseHub(factionId);
  }

  function resolveFactionEvent(factionId, idx) {
    const base = ensureBaseActivity(factionId);
    const ev = base && Array.isArray(base.activeEvents) ? base.activeEvents[Number(idx)] : null;
    if (!ev || ev.resolved) return;
    const check = rollBaseCheck("adventure", 6);
    ev.resolved = true;
    if (check.success) {
      if (typeof changeCounter === "function") changeCounter("tmw", 1);
      if (typeof showNotif === "function") showNotif("Event interaction succeeded: +1 Teamwork.", "good");
    } else {
      if (typeof changeStress === "function") changeStress(1);
      if (typeof showNotif === "function") showNotif("Event interaction failed: +1 Stress.", "warn");
    }
    openFactionBaseHub(factionId);
  }

  function talkFactionNpc(factionId, idx) {
    const base = ensureBaseActivity(factionId);
    const npc = base && Array.isArray(base.npcs) ? base.npcs[Number(idx)] : null;
    if (!npc) return;
    if (typeof showNotif === "function") showNotif(npc.name + " shares: " + npc.rumor, "good");
    const check = rollBaseCheck("lead", 6);
    if (check.success) safeFactionRenownDelta(factionId, 1);
    openFactionBaseHub(factionId);
  }

  function openFactionMerchant(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base) return;
    const html = `<div style='font-size:.83rem;color:var(--text2);line-height:1.6;'>${(base.merchantStock || []).map((offer, idx) => {
      const name = offer && offer.name ? offer.name : "Trade Item";
      const cost = Number(offer && offer.cost ? offer.cost : 120);
      const cat = offer && offer.cat ? offer.cat : "items";
      const desc = offer && offer.desc ? offer.desc : "Faction quartermaster stock.";
      return `<div style='padding:.25rem .35rem;border:1px solid var(--border2);margin-bottom:.24rem;'><strong style='color:var(--gold2);'>${name}</strong> (${cat})<br>${desc}<br><button class='btn btn-xs btn-teal' onclick="factionSystem.buyMerchantItem('${factionId}',${idx})">Buy ${cost}₵</button></div>`;
    }).join("")}</div>`;
    openFactionModal("Faction Merchant", html);
  }

  function buyFactionMerchantItem(factionId, idx) {
    const base = ensureBaseActivity(factionId);
    const offer = base && Array.isArray(base.merchantStock) ? base.merchantStock[Number(idx)] : null;
    if (!offer) return;
    const name = offer.name || "Trade Item";
    const cost = Number(offer.cost || 120);
    const cat = offer.cat || "items";
    if (typeof buyItem === "function") buyItem(cost, name, cat);
    else if (S && Number(S.credits || 0) >= cost) S.credits -= cost;
    if (typeof showNotif === "function") showNotif("Purchased " + name + " from faction merchant.", "good");
    openFactionMerchant(factionId);
  }

  function regenerateFactionBaseRooms(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base) return;
    base.generatedRooms = generateBaseRooms(factionId);
    openFactionBaseHub(factionId);
  }

  function rerollFactionBaseEvents(factionId) {
    const base = ensureBaseActivity(factionId);
    if (!base) return;
    base.activeEvents = generateFactionBaseEvents(factionId).map((text) => ({ text, resolved: false }));
    base.rumorClock = Number(base.rumorClock || 0) + 1;
    openFactionBaseHub(factionId);
  }

  function openFactionBaseFromMarker(region, key, secondary) {
    const found = findBaseByMarker(region, key, secondary);
    if (!found) {
      if (typeof showNotif === "function") showNotif("No faction base marker in this location.", "warn");
      return;
    }
    openFactionBaseHub(found.factionId);
  }

  function openFactionModal(title, html) {
    if (typeof openModal === "function") {
      openModal(title, html);
      return;
    }
    alert(title + "\n\n" + String(html || "").replace(/<[^>]+>/g, " "));
  }

  function expandFaction(factionId) {
    ensureFactionState();
    const faction = FACTIONS[factionId];
    if (!faction) return;

    const renown = getFactionRenown(factionId);
    const actionDie = FACTION_ACTION_DIE_MAP[factionId] || "mind";
    const loreRole = FACTION_LORE_ROLE_MAP[factionId] || "Specialists";
    let html = `
      <div class="faction-detail">
        <h3>${faction.emoji} ${faction.name}</h3>
        <div style="font-size:.82rem;color:var(--text2);margin-bottom:.55rem;">
          Lore Focus: <strong style="color:var(--gold2);">${loreRole} = ${toTitle(actionDie)}</strong> · Storyline Bonus: <strong style="color:var(--teal);">+${Math.max(0, renown)}</strong>
        </div>
        <h4>Faction Missions</h4>
    `;

    faction.factionMissions.forEach((mission) => {
      html += `
        <div class="mission-detail" style="border:1px solid var(--border2);padding:.55rem;margin-bottom:.45rem;">
          <h5>${mission.title}</h5>
          <p>${mission.desc}</p>
          <div class="mission-stats">Difficulty: ${mission.difficulty} — Reward: ${mission.reward}⚜</div>
          <div class="mission-pathways">
            <strong>Your decisions:</strong>
            <ul>
              <li><strong>Heroic:</strong> ${mission.pathways.heroic}</li>
              <li><strong>Evil:</strong> ${mission.pathways.evil}</li>
              <li><strong>Sacrificial:</strong> ${mission.pathways.sacrificial}</li>
            </ul>
          </div>
        </div>
      `;
    });

    html += `<div style="margin-top:.6rem;"><button class="btn btn-sm btn-primary" onclick="factionSystem.visitBase('${factionId}')">Visit ${faction.name} Base</button></div></div>`;
    openFactionModal(faction.name, html);
  }

  function visitFactionBase(factionId) {
    ensureFactionState();
    const faction = FACTIONS[factionId];
    const base = ensureBaseActivity(factionId);
    if (!faction || !base) return;
    base.rumorClock = Number(base.rumorClock || 0) + 1;
    openFactionBaseHub(factionId);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.factionSystem = {
    FACTIONS,
    FACTION_ACTION_DIE_MAP,
    STORY_PATHWAYS,
    FACTION_DYNAMICS,
    TRUST_LEVELS,
    BETRAYAL_SCENARIOS,
    setupFactionTab,
    expandFaction,
    visitBase: visitFactionBase,
    syncBaseMarkers: syncFactionBaseMarkers,
    getProvinceMarker: getFactionBaseMarkerAtProvince,
    getSeaMarker: getFactionBaseMarkerAtSea,
    getGalaxyMarker: getFactionBaseMarkerAtGalaxy,
    getWTWMarker: getFactionBaseMarkerAtWTW,
    getPlanetMarker: getFactionBaseMarkerAtPlanet,
    openBaseFromMarker: openFactionBaseFromMarker,
    acceptTask: acceptFactionTask,
    resolveTask: resolveFactionTask,
    acceptMission: acceptFactionMission,
    resolveMission: resolveFactionMission,
    resolveEvent: resolveFactionEvent,
    talkNpc: talkFactionNpc,
    openMerchant: openFactionMerchant,
    buyMerchantItem: buyFactionMerchantItem,
    generateRooms: regenerateFactionBaseRooms,
    rollEvents: rerollFactionBaseEvents,
    getFactionStoryRollBonus,
    generateAdaptiveChoices
  };

  window.getFactionStoryRollBonus = getFactionStoryRollBonus;

  // Auto-setup when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupFactionTab);
  } else {
    setupFactionTab();
  }
})();
