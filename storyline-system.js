// storyline-system.js
(function () {
  const STORY_TAB_ID = "storyline";

  const STAT_LABELS = {
    adventure: "Adventure",
    body: "Body",
    mind: "Mind",
    spirit: "Spirit",
    control: "Control",
    lead: "Lead",
    strike: "Strike",
    shoot: "Shoot",
    defend: "Defend",
  };

  const FACTION_LABELS = {
    corporations: "Corporations",
    religious: "Religious Entities",
    political: "Political Groups",
    military: "Military Orders",
    underworld: "The Underworld",
    rebels: "Rebels",
  };

  const STORY_SYSTEMS = [
    { id: "province", name: "Province", context: "traveling", tab: "map" },
    { id: "lastsea", name: "Sea Region", context: "lastsea", tab: "lastsea" },
    { id: "space", name: "Space", context: "space", tab: "galaxy" },
    { id: "planets", name: "Planets", context: "space", tab: "planet" },
    { id: "wtw", name: "World That Was", context: "space", tab: "worldthatwas" },
    { id: "combat", name: "Combat", context: "traveling", tab: "combat" },
    { id: "missions", name: "Missions", context: "traveling", tab: "missions" },
    { id: "skirmish", name: "Skirmishes", context: "space", tab: "worldthatwas" },
    { id: "naval", name: "Starship/Naval", context: "space", tab: "naval" },
  ];

  const CHAPTERS = [
    {
      id: "c1",
      title: "Ashes Under Gold",
      subtitle: "Noir frontier in the Province",
      age: "green",
      season: "spring",
      region: "province",
      villainBeat: "A magistrate's seal appears at a massacre site.",
    },
    {
      id: "c2",
      title: "Storm-Ledgers",
      subtitle: "Sea debts and drowned saints",
      age: "green",
      season: "harvest",
      region: "lastsea",
      villainBeat: "Ships vanish along routes taxed by an unseen court.",
    },
    {
      id: "c3",
      title: "Neon Liturgies",
      subtitle: "Space corridors and corporate shrines",
      age: "golden",
      season: "winter",
      region: "space",
      villainBeat: "The villain brokers peace by manufacturing cosmic fear.",
    },
    {
      id: "c4",
      title: "The Rust Crown",
      subtitle: "World That Was reckoning",
      age: "grey",
      season: "winter",
      region: "wtw",
      villainBeat: "Final confrontation with Magistrate Voss Karr.",
    },
  ];

  const SCENES = {
    intro: {
      chapter: "c1",
      title: "The Gallows Orchard",
      location: "Province",
      mood: "Weird noir, frontier grit",
      text: "Dawn drags over dead orchards. Six bodies hang from ironwood limbs, each branded with a crimson judicial sigil. A letter is nailed into your shadow: 'Come collect your sentence, Wayfarer. -Voss Karr'. The sheriff, Lyra Keene, lights a cigarette with shaking hands. Beside her stands Brother Iosef, a priest with a revolver and a rosary made of shell casings.",
      lessons: ["province", "missions"],
      options: [
        {
          id: "o1",
          text: "Read the sigil as occult geometry",
          stat: "mind",
          baseDread: 8,
          success: {
            next: "intro_sigil",
            text: "The symbol is a routing cipher: province murders point to sea smuggling lanes.",
            effects: { credits: 50, npc: { lyra: 1 } },
          },
          fail: {
            next: "intro_failtrail",
            text: "You misread the script. Lyra calls it superstition and storms off.",
            effects: { mentalStress: 1, npc: { lyra: -1 } },
          },
        },
        {
          id: "o2",
          text: "Question Lyra through hard-boiled charm",
          stat: "lead",
          baseDread: 6,
          req: { careerIncludes: ["investigator", "merchant", "noble"] },
          success: {
            next: "lyra_arc_start",
            text: "Lyra admits she once loved Voss Karr before he became the Pale Magistrate.",
            effects: { renown: 1, npc: { lyra: 2 } },
          },
          fail: {
            next: "intro_failtrail",
            text: "She shuts down and tells you to solve it alone.",
            effects: { npc: { lyra: -1 } },
          },
        },
        {
          id: "o3",
          text: "Track the killers into the marsh roads",
          stat: "adventure",
          baseDread: 8,
          success: {
            next: "marshal_ambush",
            text: "Boot-prints and hoof marks converge on a mission token in the wetlands.",
            effects: { tmw: 1 },
          },
          fail: {
            next: "marshal_ambush",
            text: "You still find the route, but late. The ambush is prepared.",
            effects: { health: 1, tmw: 1 },
          },
        },
      ],
    },

    intro_sigil: {
      chapter: "c1",
      title: "Ink That Smells Like Salt",
      location: "Province to Sea",
      mood: "Occult procedural",
      text: "The sigil decodes into shipping tariffs and execution schedules. Someone is running a court-state across land and sea. Brother Iosef asks whether justice is a sword or a ledger.",
      lessons: ["lastsea"],
      options: [
        {
          id: "o1",
          text: "Take a mission board contract tied to the cipher",
          jump: { tab: "missions" },
          success: { next: "mission_bridge", text: "A contract appears with your encoded route as its target.", effects: { renown: 1 } },
        },
        {
          id: "o2",
          text: "Sail now and intercept the black-flag caravan",
          jump: { context: "lastsea", tab: "lastsea" },
          success: { next: "sea_court", text: "Your ship enters stormlight waters where judges wear diver helmets." },
        },
      ],
    },

    intro_failtrail: {
      chapter: "c1",
      title: "A Bad First Guess",
      location: "Province",
      mood: "Absurd dread",
      text: "You lose the clean lead, but a laughing scavenger child sells you a blood-wet map for a single bullet and a joke about God.",
      options: [
        {
          id: "o1",
          text: "Buy the map and press forward",
          success: { next: "mission_bridge", text: "Even bad leads point toward Voss Karr's machine.", effects: { credits: -25 } },
        },
      ],
    },

    lyra_arc_start: {
      chapter: "c1",
      title: "The Sheriff and the Ghost",
      location: "Province",
      mood: "Romance + betrayal",
      text: "Lyra confesses: she and Voss planned to rebuild the world together. He chose order through terror; she chose people. She asks you not to kill him unless there is no other path.",
      options: [
        {
          id: "o1",
          text: "Promise mercy if possible",
          stat: "spirit",
          baseDread: 8,
          success: { next: "mission_bridge", text: "Lyra softens. 'Then let me ride with you.'", effects: { npc: { lyra: 1 } } },
          fail: { next: "mission_bridge", text: "Your promise sounds hollow. She keeps emotional distance.", effects: { npc: { lyra: -1 } } },
        },
        {
          id: "o2",
          text: "Promise judgment over mercy",
          stat: "defend",
          baseDread: 8,
          success: { next: "mission_bridge", text: "She nods grimly. 'Then be harder than him.'", effects: { renown: 1 } },
          fail: { next: "mission_bridge", text: "The vow fractures your trust with her.", effects: { npc: { lyra: -1 } } },
        },
      ],
    },

    mission_bridge: {
      chapter: "c1",
      title: "Contract of Bones",
      location: "Missions and Combat",
      mood: "Action tutorial",
      text: "A contract appears in your tracker: 'Seize the Red Ledger.' Completing it unlocks routes through every region. Voss Karr wants you mobile, tested, and shaped.",
      lessons: ["missions", "combat"],
      options: [
        {
          id: "o1",
          text: "Open missions and run Step 1/2/3 now",
          jump: { tab: "missions" },
          success: { next: "marshal_ambush", text: "The mission pushes you into an engineered firefight." },
        },
        {
          id: "o2",
          text: "Skip to direct confrontation",
          jump: { tab: "combat" },
          success: { next: "marshal_ambush", text: "Steel answers before strategy does." },
        },
      ],
    },

    marshal_ambush: {
      chapter: "c1",
      title: "Gun-Smoke Psalm",
      location: "Province / Combat",
      mood: "Cowboy samurai fever",
      text: "Black-coated marshals ambush your camp under lantern rain. Their captain chants legal code like prayer while drawing a katana with an integrated rifle chamber.",
      lessons: ["combat", "skirmish"],
      options: [
        {
          id: "o1",
          text: "Duel the captain blade-to-blade",
          stat: "strike",
          baseDread: 10,
          success: { next: "sea_court", text: "You cut the marshal's contract seal in half and take his sea transit key.", effects: { renown: 1 } },
          fail: { next: "sea_court", text: "You win late and bleeding; the key is cracked but usable.", effects: { health: 2 } },
        },
        {
          id: "o2",
          text: "Counter-snipe through reeds and static",
          stat: "shoot",
          baseDread: 10,
          success: { next: "sea_court", text: "One precise shot breaks the ambush line.", effects: { tmw: 1 } },
          fail: { next: "sea_court", text: "You suppress them but take return fire.", effects: { health: 1, mentalStress: 1 } },
        },
      ],
    },

    sea_court: {
      chapter: "c2",
      title: "The Drowned Court",
      location: "Sea Region",
      mood: "Horror and absurd judiciary",
      text: "At sea, judges in brass diving masks convene trials on deck while eels coil around gavels. Every witness speaks in legal haiku. You must prove you're not the villain's willing agent.",
      lessons: ["lastsea", "naval"],
      options: [
        {
          id: "o1",
          text: "Argue jurisdiction by religious doctrine",
          stat: "spirit",
          baseDread: 8,
          req: { factionAtLeast: { key: "religious", min: 1 } },
          success: { next: "sea_chase", text: "The court grants temporary passage and a warrant chip.", effects: { faction: { religious: 1 } } },
          fail: { next: "sea_chase", text: "They call your faith counterfeit and mark your hull.", effects: { faction: { religious: -1 }, mentalStress: 1 } },
        },
        {
          id: "o2",
          text: "Bribe the bailiff with underworld script",
          stat: "control",
          baseDread: 10,
          req: { factionAtLeast: { key: "underworld", min: 1 } },
          success: { next: "sea_chase", text: "The bailiff reroutes patrols and whispers: 'Run now.'", effects: { faction: { underworld: 1 }, credits: -100 } },
          fail: { next: "sea_chase", text: "The bribe is fake; they fine you and open fire.", effects: { credits: -150, health: 1 } },
        },
        {
          id: "o3",
          text: "Accept trial by cannon and storm",
          stat: "defend",
          baseDread: 10,
          success: { next: "sea_chase", text: "You weather the barrage and earn fear-respect.", effects: { renown: 1 } },
          fail: { next: "sea_chase", text: "You survive but your ship limps toward open water.", effects: { health: 1, mentalStress: 1 } },
        },
      ],
    },

    sea_chase: {
      chapter: "c2",
      title: "Red Wake",
      location: "Sea to Space",
      mood: "High velocity dread",
      text: "A crimson frigate bearing Voss Karr's seal breaches fog and gives chase. Your only path is through a dead relay gate that opens onto space lanes.",
      options: [
        {
          id: "o1",
          text: "Use Naval tactics to outmaneuver and jump",
          jump: { context: "space", tab: "naval" },
          success: { next: "space_noir", text: "The jump tears reality and your conscience in equal measure." },
        },
        {
          id: "o2",
          text: "Hold and board for evidence",
          stat: "body",
          baseDread: 12,
          success: { next: "space_noir", text: "You seize Voss's planet ledger and coordinates.", effects: { credits: 200 } },
          fail: { next: "space_noir", text: "You take the ledger but lose crew to the surf.", effects: { mentalStress: 2 } },
        },
      ],
    },

    space_noir: {
      chapter: "c3",
      title: "Neon Relic Corridor",
      location: "Space / Galaxy",
      mood: "Cyberpunk noir",
      text: "In orbit above a dead moon, corporate chapels beam ads as prayer. Voss Karr is negotiating with major powers, promising 'peace through curated dread'. Mara Quill, an ex-assassin turned smuggler poet, offers to help if you trust her.",
      lessons: ["space", "planets"],
      options: [
        {
          id: "o1",
          text: "Trust Mara and share command codes",
          stat: "lead",
          baseDread: 10,
          success: { next: "mara_arc", text: "Mara smiles like a loaded gun. 'Now we can hurt him properly.'", effects: { npc: { mara: 2 } } },
          fail: { next: "mara_arc", text: "She takes partial control and vanishes for a chapter.", effects: { npc: { mara: -1 }, tmw: 1 } },
        },
        {
          id: "o2",
          text: "Keep Mara at arm's length and scan planets",
          jump: { context: "space", tab: "planet" },
          success: { next: "planet_descent", text: "You find a colony where Voss tests social control algorithms." },
        },
      ],
    },

    mara_arc: {
      chapter: "c3",
      title: "Mara Quill's Lullaby",
      location: "Space",
      mood: "Love, danger, betrayal",
      text: "Mara sings in a language half made of static. She admits she once killed for Voss, then fell in love with the people he made her disappear. She asks if your story allows redemption.",
      options: [
        {
          id: "o1",
          text: "Offer redemption",
          stat: "spirit",
          baseDread: 8,
          req: { backgroundIncludes: ["temple", "scholar", "physician"] },
          success: { next: "planet_descent", text: "Mara gives you a true name key to Voss's private channel.", effects: { npc: { mara: 2 } } },
          fail: { next: "planet_descent", text: "She hears judgment in your voice and goes cold.", effects: { npc: { mara: -1 } } },
        },
        {
          id: "o2",
          text: "Demand proof, not poetry",
          stat: "control",
          baseDread: 8,
          success: { next: "planet_descent", text: "She delivers hard intel: prison colonies by reputation score.", effects: { faction: { corporations: -1, rebels: 1 } } },
          fail: { next: "planet_descent", text: "She withholds key details; you descend half-blind.", effects: { mentalStress: 1 } },
        },
      ],
    },

    planet_descent: {
      chapter: "c3",
      title: "The Orchard of Mirrors",
      location: "Planets",
      mood: "Blood-soaked fantasy sci-fi",
      text: "On the colony planet, black glass trees reflect futures where you become Voss Karr. Citizens wear mood collars keyed to faction rank. Dialogue itself is a weapon.",
      lessons: ["planets", "missions"],
      options: [
        {
          id: "o1",
          text: "Rally citizens with anti-crown rhetoric",
          stat: "lead",
          baseDread: 12,
          req: { factionAtLeast: { key: "rebels", min: 1 } },
          success: { next: "age_shift", text: "The colony revolts and sends you into temporal slipstream.", effects: { faction: { rebels: 1, military: -1 } } },
          fail: { next: "age_shift", text: "The revolt fails but exposes Voss's archives.", effects: { health: 1, renown: 1 } },
        },
        {
          id: "o2",
          text: "Duel the Warden in ritual combat",
          stat: "strike",
          baseDread: 12,
          success: { next: "age_shift", text: "You win and claim a temporal seal from the Warden's spine-plate.", effects: { renown: 1 } },
          fail: { next: "age_shift", text: "You survive on grit; the seal cracks but works once.", effects: { health: 2 } },
        },
        {
          id: "o3",
          text: "Outshoot the turret choir at dusk",
          stat: "shoot",
          baseDread: 12,
          success: { next: "age_shift", text: "Every shot rewrites a route through the siege.", effects: { credits: 150 } },
          fail: { next: "age_shift", text: "You break through but lose ammo and calm.", effects: { tmw: 1, mentalStress: 1 } },
        },
      ],
    },

    age_shift: {
      chapter: "c4",
      title: "Thirty Years in One Blink",
      location: "Ages and Seasons",
      mood: "Cosmic absurd tragedy",
      text: "The temporal seal ruptures. You watch decades collapse into a breath. Spring burns into Harvest, Harvest freezes into Winter. The World That Was calls your true name.",
      options: [
        {
          id: "o1",
          text: "Enter the World That Was",
          jump: { context: "space", tab: "worldthatwas", setAge: "grey", setSeason: "winter", advanceDays: 30 },
          success: { next: "wtw_reckoning", text: "You arrive where every power keeps its dirtiest memory." },
        },
      ],
    },

    wtw_reckoning: {
      chapter: "c4",
      title: "City of Last Accounts",
      location: "World That Was",
      mood: "Urban mythic finale",
      text: "Districts pulse with active skirmishes. Voss Karr broadcasts verdicts through station speakers: every failure proves people need chains. You can break his machine by force, by testimony, or by making his allies abandon him.",
      lessons: ["wtw", "skirmish", "combat"],
      options: [
        {
          id: "o1",
          text: "Win district skirmishes to collapse his logistics",
          jump: { tab: "worldthatwas" },
          success: { next: "finale_gate", text: "Control shifts. His armies begin to starve." },
        },
        {
          id: "o2",
          text: "Face him in direct duel",
          stat: "defend",
          baseDread: 20,
          success: { next: "finale_choice", text: "You endure his terror field and close to speaking distance." },
          fail: { next: "finale_choice", text: "You are battered, but his mask cracks and reveals fear.", effects: { health: 2 } },
        },
        {
          id: "o3",
          text: "Turn major powers against him",
          stat: "control",
          baseDread: 12,
          req: { factionAtLeastAny: [{ key: "corporations", min: 4 }, { key: "political", min: 4 }, { key: "military", min: 4 }] },
          success: { next: "finale_choice", text: "His coalition fractures on live feed.", effects: { renown: 2 } },
          fail: { next: "finale_choice", text: "They stall, but your leaks still wound him.", effects: { mentalStress: 1 } },
        },
      ],
    },

    finale_gate: {
      chapter: "c4",
      title: "Threshold of Verdict",
      location: "World That Was",
      mood: "Noir cathedral",
      text: "At the courthouse-cathedral, Lyra and Mara both arrive. One asks for justice. The other asks for mercy. Voss Karr kneels before neither.",
      options: [
        {
          id: "o1",
          text: "Proceed to final judgment",
          success: { next: "finale_choice", text: "The city holds its breath." },
        },
      ],
    },

    finale_choice: {
      chapter: "c4",
      title: "The Pale Magistrate",
      location: "Finale",
      mood: "Operatic endgame",
      text: "Voss Karr: 'People do not want freedom. They want someone to blame.' The room waits for your answer.",
      options: [
        {
          id: "o1",
          text: "Execute Voss Karr and end his reign",
          stat: "strike",
          baseDread: 12,
          success: { next: "ending_iron", text: "You end him. Order shatters into contested freedom.", effects: { renown: 2, faction: { military: 1, religious: -1 } } },
          fail: { next: "ending_iron", text: "You still kill him, but at ruinous cost.", effects: { health: 2, mentalStress: 2 } },
        },
        {
          id: "o2",
          text: "Spare him and expose the system publicly",
          stat: "lead",
          baseDread: 12,
          success: { next: "ending_glass", text: "The city rejects him alive, which wounds him deeper than death.", effects: { renown: 2, faction: { political: 1, underworld: -1 } } },
          fail: { next: "ending_glass", text: "The speech fractures, but enough truth leaks out to unseat him.", effects: { mentalStress: 1 } },
        },
        {
          id: "o3",
          text: "Bind him to the same laws he forged",
          stat: "mind",
          baseDread: 12,
          req: { careerIncludes: ["priest", "investigator", "noble", "historian"] },
          success: { next: "ending_blacksun", text: "He becomes prisoner of his own doctrine.", effects: { faction: { corporations: -1, rebels: 1 }, renown: 3 } },
          fail: { next: "ending_blacksun", text: "The ritual is imperfect, but his authority breaks anyway.", effects: { tmw: 1 } },
        },
      ],
    },

    ending_iron: {
      chapter: "c4",
      title: "Ending: Iron Mercy",
      location: "Epilogue",
      mood: "Tragic western",
      text: "You chose final steel. The world survives without a magistrate but learns to fear heroes as much as villains. Lyra rides at dawn. Mara leaves a poem in your holster.",
      options: [{ id: "o1", text: "Restart from Chapter 1 with carried reputation", success: { restart: true, text: "A new Wayfarer steps into old blood." } }],
    },

    ending_glass: {
      chapter: "c4",
      title: "Ending: Glass Republic",
      location: "Epilogue",
      mood: "Noir hope",
      text: "You chose witness over execution. Courts become public, brutal, and honest. The city aches toward something like justice.",
      options: [{ id: "o1", text: "Restart from Chapter 1 with carried reputation", success: { restart: true, text: "The next life inherits your echoes." } }],
    },

    ending_blacksun: {
      chapter: "c4",
      title: "Ending: Black Sun Covenant",
      location: "Epilogue",
      mood: "Weird myth",
      text: "You made law itself your weapon. Voss Karr lives under the weight of every verdict he issued. The world is stranger, freer, and less certain.",
      options: [{ id: "o1", text: "Restart from Chapter 1 with carried reputation", success: { restart: true, text: "Cycle again, different this time." } }],
    },
  };

  function lc(value) {
    return String(value || "").trim().toLowerCase();
  }

  function ensureStoryState() {
    if (typeof S === "undefined") return null;
    S.storyline = S.storyline || {};
    const st = S.storyline;
    if (!st.sceneId || !SCENES[st.sceneId]) st.sceneId = "intro";
    if (!st.chapter) st.chapter = "c1";
    if (!st.flags || typeof st.flags !== "object") st.flags = {};
    if (!st.npc || typeof st.npc !== "object") st.npc = { lyra: 0, mara: 0, iosef: 0 };
    if (!st.optionDread || typeof st.optionDread !== "object") st.optionDread = {};
    if (!Array.isArray(st.log)) st.log = [];
    if (!Array.isArray(st.usedStats)) st.usedStats = [];
    if (!Array.isArray(st.completedSystems)) st.completedSystems = [];
    if (!st.seedTag) st.seedTag = "W-" + Math.floor(Math.random() * 9000 + 1000);
    if (!st.lastResult) st.lastResult = "";
    return st;
  }

  function getFactionValue(key) {
    if (!S || !S.factionRenown || typeof S.factionRenown !== "object") return 0;
    return Number(S.factionRenown[key] || 0);
  }

  function hasReq(req) {
    if (!req) return true;
    const career = lc(S.career);
    const background = lc(S.background);

    if (Array.isArray(req.careerIncludes) && req.careerIncludes.length) {
      const ok = req.careerIncludes.some(function (c) { return career.indexOf(lc(c)) >= 0; });
      if (!ok) return false;
    }
    if (Array.isArray(req.backgroundIncludes) && req.backgroundIncludes.length) {
      const ok = req.backgroundIncludes.some(function (b) { return background.indexOf(lc(b)) >= 0; });
      if (!ok) return false;
    }
    if (req.factionAtLeast && req.factionAtLeast.key) {
      if (getFactionValue(req.factionAtLeast.key) < Number(req.factionAtLeast.min || 0)) return false;
    }
    if (Array.isArray(req.factionAtLeastAny) && req.factionAtLeastAny.length) {
      const anyOk = req.factionAtLeastAny.some(function (entry) {
        return getFactionValue(entry.key) >= Number(entry.min || 0);
      });
      if (!anyOk) return false;
    }
    if (req.age && lc(S.currentAge) !== lc(req.age)) return false;
    if (req.season && lc(S.currentSeason) !== lc(req.season)) return false;
    if (req.npcAffinity && req.npcAffinity.npc) {
      const st = ensureStoryState();
      if (!st) return false;
      if ((st.npc[req.npcAffinity.npc] || 0) < Number(req.npcAffinity.min || 0)) return false;
    }
    return true;
  }

  function applyNumericEffect(key, delta) {
    const d = Number(delta || 0);
    if (!d) return;
    if (key === "renown" || key === "tmw" || key === "pathTokens") {
      if (typeof changeCounter === "function") {
        changeCounter(key, d);
      } else {
        S[key] = Math.max(0, Number(S[key] || 0) + d);
      }
      return;
    }
    if (key === "health") {
      if (typeof changeHealth === "function") changeHealth(d);
      return;
    }
    if (key === "mentalStress") {
      if (typeof changeMentalStress === "function") changeMentalStress(d);
      return;
    }
    if (key === "credits") {
      S.credits = Math.max(0, Number(S.credits || 0) + d);
      if (typeof updateCreditsUI === "function") updateCreditsUI();
      return;
    }
  }

  function applyEffects(effects) {
    if (!effects) return;
    ["renown", "tmw", "pathTokens", "health", "mentalStress", "credits"].forEach(function (k) {
      if (effects[k] || effects[k] === 0) applyNumericEffect(k, effects[k]);
    });

    if (effects.faction && typeof effects.faction === "object") {
      Object.keys(effects.faction).forEach(function (key) {
        const delta = Number(effects.faction[key] || 0);
        if (!delta) return;
        if (typeof changeFactionRenown === "function") changeFactionRenown(key, delta);
        else if (S.factionRenown) S.factionRenown[key] = Math.max(-10, Math.min(12, Number(S.factionRenown[key] || 0) + delta));
      });
      if (typeof updateFactionRenownUI === "function") updateFactionRenownUI();
    }

    if (effects.npc && typeof effects.npc === "object") {
      const st = ensureStoryState();
      Object.keys(effects.npc).forEach(function (npc) {
        st.npc[npc] = Number(st.npc[npc] || 0) + Number(effects.npc[npc] || 0);
      });
    }
  }

  function doJump(jump) {
    if (!jump) return;
    if (jump.setAge) {
      S.currentAge = jump.setAge;
      if (typeof setAge === "function") setAge(jump.setAge);
    }
    if (jump.setSeason) {
      S.currentSeason = jump.setSeason;
      if (typeof setSeason === "function") setSeason(jump.setSeason);
    }
    if (jump.advanceDays && typeof advanceDay === "function") {
      advanceDay(Number(jump.advanceDays || 0));
    }
    if (jump.context && typeof setContext === "function") {
      setContext(jump.context);
    }
    if (jump.tab && typeof switchTab === "function") {
      const btn = document.querySelector(".tab-btn[onclick*=\"switchTab('" + jump.tab + "'\"]");
      switchTab(jump.tab, btn || null);
    }
  }

  function getOptionDread(sceneId, option) {
    const st = ensureStoryState();
    const key = sceneId + ":" + option.id;
    const stored = Number(st.optionDread[key] || 0);
    const base = Number(option.baseDread || 0);
    return stored || base || 8;
  }

  function setOptionDread(sceneId, optionId, die) {
    const st = ensureStoryState();
    st.optionDread[sceneId + ":" + optionId] = die;
  }

  function rollStoryCheck(statKey, dreadDie) {
    const actionDie = (typeof getEffectiveDie === "function") ? getEffectiveDie(statKey) : Number((S.stats && S.stats[statKey]) || 4);
    const a = (typeof explodingRoll === "function") ? explodingRoll(actionDie) : { total: Math.floor(Math.random() * actionDie) + 1, exploded: false };
    const d = (typeof explodingRoll === "function") ? explodingRoll(dreadDie) : { total: Math.floor(Math.random() * dreadDie) + 1, exploded: false };
    return { success: a.total >= d.total, actionDie: actionDie, dreadDie: dreadDie, action: a, dread: d };
  }

  function markLessonProgress(scene) {
    const st = ensureStoryState();
    (scene.lessons || []).forEach(function (id) {
      if (st.completedSystems.indexOf(id) < 0) st.completedSystems.push(id);
    });
  }

  function pushLog(entry) {
    const st = ensureStoryState();
    st.log.unshift(entry);
    st.log = st.log.slice(0, 18);
  }

  function applyOutcome(sceneId, option, outcome, checkResult) {
    const st = ensureStoryState();

    if (checkResult && option.stat) {
      if (st.usedStats.indexOf(option.stat) < 0) st.usedStats.push(option.stat);
      const currentDread = getOptionDread(sceneId, option);
      const nextDread = checkResult.success ? stepDown(currentDread) : stepUp(currentDread);
      setOptionDread(sceneId, option.id, nextDread);
    }

    if (outcome && outcome.effects) applyEffects(outcome.effects);
    if (outcome && outcome.text) st.lastResult = outcome.text;
    if (outcome && outcome.next) {
      st.sceneId = outcome.next;
      const next = SCENES[st.sceneId];
      if (next) st.chapter = next.chapter;
    }
    if (outcome && outcome.restart) {
      st.sceneId = "intro";
      st.chapter = "c1";
      st.log = [];
      st.usedStats = [];
      st.completedSystems = [];
      st.lastResult = "Cycle reset. A new Wayfarer enters the same legend from a different angle.";
    }

    const msg = [
      option.text,
      outcome && outcome.text ? outcome.text : "",
      checkResult
        ? ("[" + STAT_LABELS[option.stat] + " d" + checkResult.actionDie + "=" + checkResult.action.total + " vs DD" + checkResult.dreadDie + "=" + checkResult.dread.total + "]")
        : "",
    ].filter(Boolean).join(" - ");

    pushLog(msg);

    if (typeof renderUI === "function") renderUI();
  }

  function runStoryOption(sceneId, optionId) {
    const st = ensureStoryState();
    const scene = SCENES[sceneId];
    if (!scene) return;

    const option = (scene.options || []).find(function (o) { return o.id === optionId; });
    if (!option) return;

    if (!hasReq(option.req)) {
      if (typeof showNotif === "function") showNotif("This dialogue path is locked by your history, rank, or season.", "warn");
      return;
    }

    doJump(option.jump);

    let checkResult = null;
    let outcome = option.success;

    if (option.stat) {
      const dd = getOptionDread(sceneId, option);
      checkResult = rollStoryCheck(option.stat, dd);
      outcome = checkResult.success ? option.success : (option.fail || option.success);
    }

    applyOutcome(sceneId, option, outcome, checkResult);
    renderStorylinePanel();
  }

  function renderRequirement(req) {
    if (!req) return "";
    const bits = [];
    if (Array.isArray(req.careerIncludes) && req.careerIncludes.length) bits.push("Career: " + req.careerIncludes.join(" / "));
    if (Array.isArray(req.backgroundIncludes) && req.backgroundIncludes.length) bits.push("Background: " + req.backgroundIncludes.join(" / "));
    if (req.factionAtLeast) bits.push((FACTION_LABELS[req.factionAtLeast.key] || req.factionAtLeast.key) + " ≥ " + req.factionAtLeast.min);
    if (Array.isArray(req.factionAtLeastAny) && req.factionAtLeastAny.length) {
      bits.push("Any rank: " + req.factionAtLeastAny.map(function (r) { return (FACTION_LABELS[r.key] || r.key) + " ≥ " + r.min; }).join(" or "));
    }
    if (req.age) bits.push("Age: " + req.age);
    if (req.season) bits.push("Season: " + req.season);
    return bits.join(" · ");
  }

  function getChapterMeta(chapterId) {
    return CHAPTERS.find(function (c) { return c.id === chapterId; }) || CHAPTERS[0];
  }

  function lessonProgressHtml() {
    const st = ensureStoryState();
    return STORY_SYSTEMS.map(function (sys) {
      const done = st.completedSystems.indexOf(sys.id) >= 0;
      return "<div class='story-lesson " + (done ? "done" : "") + "'>"
        + "<span>" + sys.name + "</span>"
        + "<button class='btn btn-xs " + (done ? "btn-green" : "") + "' onclick='storyJumpSystem(\"" + sys.id + "\")'>" + (done ? "Visited" : "Go") + "</button>"
      + "</div>";
    }).join("");
  }

  function chapterRailHtml() {
    const st = ensureStoryState();
    return CHAPTERS.map(function (c) {
      const on = st.chapter === c.id;
      return "<div class='story-chapter " + (on ? "on" : "") + "'>"
        + "<div class='story-ch-title'>" + c.title + "</div>"
        + "<div class='story-ch-meta'>" + c.subtitle + " · " + c.age + " / " + c.season + "</div>"
      + "</div>";
    }).join("");
  }

  function renderStorylinePanel() {
    const st = ensureStoryState();
    const host = document.getElementById("tab-" + STORY_TAB_ID);
    if (!host || !st) return;

    const scene = SCENES[st.sceneId] || SCENES.intro;
    const chapter = getChapterMeta(scene.chapter);

    const options = (scene.options || []).map(function (option) {
      const unlocked = hasReq(option.req);
      const reqText = renderRequirement(option.req);
      const dd = option.stat ? getOptionDread(st.sceneId, option) : 0;
      return "<div class='story-opt " + (unlocked ? "" : "locked") + "'>"
        + "<div class='story-opt-text'>" + option.text + "</div>"
        + (option.stat ? ("<div class='story-opt-roll'>" + (STAT_LABELS[option.stat] || option.stat) + " vs DD" + dd + "</div>") : "")
        + (reqText ? ("<div class='story-opt-req'>" + reqText + "</div>") : "")
        + "<button class='btn btn-sm " + (unlocked ? "btn-primary" : "") + "' " + (unlocked ? ("onclick='runStoryOption(\"" + st.sceneId + "\",\"" + option.id + "\")'") : "disabled") + ">Choose</button>"
      + "</div>";
    }).join("");

    const usedStats = Object.keys(STAT_LABELS).filter(function (k) {
      return st.usedStats.indexOf(k) >= 0;
    }).map(function (k) { return STAT_LABELS[k]; }).join(" · ") || "None yet";

    const affinity = Object.keys(st.npc).map(function (k) {
      return k.charAt(0).toUpperCase() + k.slice(1) + ": " + st.npc[k];
    }).join(" · ");

    const logHtml = st.log.length
      ? st.log.map(function (line) { return "<div class='story-log-item'>" + line + "</div>"; }).join("")
      : "<div class='story-log-item'>Your story choices will appear here.</div>";

    host.innerHTML = ""
      + "<div class='story-shell'>"
      + "<div class='story-column story-left'>"
      + "<div class='section-title'>Main Arc</div>"
      + chapterRailHtml()
      + "<div class='story-card'>"
      + "<div class='story-label'>Seed</div><div class='story-value'>" + st.seedTag + "</div>"
      + "<div class='story-label'>Current Age / Season</div><div class='story-value'>" + (S.currentAge || "green") + " / " + (S.currentSeason || "spring") + "</div>"
      + "<div class='story-label'>Systems Tutorial Progress</div>"
      + lessonProgressHtml()
      + "</div>"
      + "</div>"
      + "<div class='story-column story-main'>"
      + "<div class='story-header'>"
      + "<div class='story-title'>" + scene.title + "</div>"
      + "<div class='story-sub'>" + scene.location + " · " + scene.mood + "</div>"
      + "<div class='story-villain'>Villain Arc: " + chapter.villainBeat + "</div>"
      + "</div>"
      + "<div class='story-body'>" + scene.text + "</div>"
      + (st.lastResult ? ("<div class='story-result'><strong>Last Outcome:</strong> " + st.lastResult + "</div>") : "")
      + "<div class='story-options'>" + options + "</div>"
      + "</div>"
      + "<div class='story-column story-right'>"
      + "<div class='story-card'>"
      + "<div class='story-label'>All-Stat Usage</div><div class='story-value'>" + usedStats + "</div>"
      + "<div class='story-label'>NPC Arc Affinity</div><div class='story-value'>" + affinity + "</div>"
      + "<div class='story-label'>Career</div><div class='story-value'>" + (S.career || "Unset") + "</div>"
      + "<div class='story-label'>Background</div><div class='story-value'>" + (S.background || "Unset") + "</div>"
      + "<div class='story-label'>Faction Ranks</div>"
      + "<div class='story-factions'>"
      + Object.keys(FACTION_LABELS).map(function (k) {
          return "<span class='sea-chip'>" + FACTION_LABELS[k] + ": " + getFactionValue(k) + "</span>";
        }).join("")
      + "</div>"
      + "</div>"
      + "<div class='story-card'>"
      + "<div class='story-label'>Choice Log</div>"
      + "<div class='story-log'>" + logHtml + "</div>"
      + "</div>"
      + "</div>"
      + "</div>";
  }

  function jumpSystemById(systemId) {
    const entry = STORY_SYSTEMS.find(function (s) { return s.id === systemId; });
    if (!entry) return;
    if (entry.context && typeof setContext === "function") setContext(entry.context);
    if (entry.tab && typeof switchTab === "function") {
      const btn = document.querySelector(".tab-btn[onclick*=\"switchTab('" + entry.tab + "'\"]");
      switchTab(entry.tab, btn || null);
    }

    const st = ensureStoryState();
    if (st.completedSystems.indexOf(systemId) < 0) st.completedSystems.push(systemId);
  }

  function ensureStoryTab() {
    const nav = document.querySelector("nav");
    const panelHost = document.getElementById("tab-map") ? document.getElementById("tab-map").parentElement : null;
    if (!nav || !panelHost) return;

    if (!document.querySelector(".tab-btn[onclick*=\"switchTab('" + STORY_TAB_ID + "'\"]")) {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.setAttribute("onclick", "switchTab('" + STORY_TAB_ID + "',this)");
      btn.textContent = "Storyline";
      nav.appendChild(btn);
    }

    if (!document.getElementById("tab-" + STORY_TAB_ID)) {
      const panel = document.createElement("div");
      panel.className = "tab-panel";
      panel.id = "tab-" + STORY_TAB_ID;
      panelHost.appendChild(panel);
    }
  }

  function patchSwitchTabForStory() {
    if (typeof window.switchTab !== "function" || window._storylineSwitchPatched) return;
    window._storylineSwitchPatched = true;
    const base = window.switchTab;
    window.switchTab = function (tabId, btn) {
      const out = base.apply(this, arguments);
      if (tabId === STORY_TAB_ID) {
        renderStorylinePanel();
      }
      return out;
    };
  }

  function patchLoadForStory() {
    const baseLoad = typeof window.loadCharacter === "function" ? window.loadCharacter : null;
    if (!baseLoad || window._storylineLoadPatched) return;
    window._storylineLoadPatched = true;
    window.loadCharacter = function () {
      baseLoad.apply(this, arguments);
      ensureStoryState();
      renderStorylinePanel();
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureStoryState();
    ensureStoryTab();
    patchSwitchTabForStory();
    patchLoadForStory();
    renderStorylinePanel();
  });

  window.renderStorylinePanel = renderStorylinePanel;
  window.runStoryOption = runStoryOption;
  window.storyJumpSystem = jumpSystemById;
})();
