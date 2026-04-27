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
      variants: [
        { when: { factionAtLeast: { key: "military", min: 2 } }, text: "The hanging knots are regulation military style, too precise for random killers." },
        { when: { factionAtLeast: { key: "underworld", min: 2 } }, text: "Street whispers say the sigil was sold as a contract brand three nights ago." },
        { when: { backgroundIncludes: ["scholar", "historian"] }, text: "You have seen this exact emblem in a forbidden atlas of collapsed republics." },
      ],
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
        {
          id: "o2",
          text: "Offer a courtroom puppet show in exchange for better intel",
          stat: "spirit",
          baseDread: 10,
          success: { next: "mission_bridge", text: "The child laughs so hard they reveal an ambush route and a merchant pass-token.", effects: { merchantReward: { credits: 90, factionKey: "corporations", factionRenown: 1, item: "Trade Good" } } },
          fail: { next: "mission_bridge", text: "The joke bombs, but pity earns you a torn route anyway.", effects: { mentalStress: 1 } },
        },
        {
          id: "o3",
          text: "Play the scavenger's shell-whistle puzzle",
          puzzle: {
            mode: "tune",
            title: "Puzzle: Shell-Whistle Tune",
            prompt: "The child says: 'Play the road-song in this order: dawn, ash, tide, ash.' Translate it to notes and perform it.",
            sequence: ["DO", "MI", "SO", "MI"],
          },
          success: { next: "cipher_market", text: "You nail the tune. A hidden map margin reveals Voss Karr's coded buyer list.", effects: { flags: { tuneSolved: true }, renown: 1 } },
          fail: { next: "mission_bridge", text: "You miss the rhythm and the child vanishes into fog, but you keep the basic map.", effects: { tmw: 1 } },
        },
      ],
    },

    cipher_market: {
      chapter: "c1",
      title: "The Whisper Market",
      location: "Province",
      mood: "Noir puzzle bazaar",
      text: "Lantern merchants trade in encoded phrases and fake names. One broker offers a single sentence that can open sealed routes, but only if you reconstruct it correctly.",
      lessons: ["missions"],
      options: [
        {
          id: "o1",
          text: "Rearrange the broker phrase",
          puzzle: {
            mode: "rearrange",
            title: "Puzzle: Reassemble the Phrase",
            prompt: "Arrange the words into the passphrase that opens the Red Ledger route.",
            bank: ["LEDGER", "THE", "BURNS", "BEFORE", "DAWN"],
            answer: "the ledger burns before dawn",
          },
          success: { next: "mission_bridge", text: "The broker nods and hands you a stamped mission seal.", effects: { merchantReward: { credits: 120, item: "Retainer Contract", factionKey: "corporations", factionRenown: 1 } } },
          fail: { next: "mission_bridge", text: "Your phrase is wrong; prices spike and the broker blacklists your face.", effects: { credits: -40, faction: { corporations: -1 } } },
        },
        {
          id: "o2",
          text: "Talk your way in as a licensed merchant",
          stat: "lead",
          baseDread: 8,
          req: { careerIncludes: ["merchant", "noble", "investigator"] },
          success: { next: "mission_bridge", text: "Your credentials pass and you walk out with route discounts and introductions.", effects: { merchantReward: { credits: 140, factionKey: "corporations", factionRenown: 1, openShop: true } } },
          fail: { next: "mission_bridge", text: "Your cover slips under scrutiny, but a junior clerk still gives one useful waypoint.", effects: { mentalStress: 1 } },
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
          success: { next: "mission_bridge", text: "Lyra softens. 'Then let me ride with you.'", effects: { npc: { lyra: 1 }, dialogueQuote: { speaker: "Lyra", line: "Mercy is not weakness. It is discipline." } } },
          fail: { next: "mission_bridge", text: "Your promise sounds hollow. She keeps emotional distance.", effects: { npc: { lyra: -1 }, dialogueQuote: { speaker: "Lyra", line: "A clean shot beats a clean speech." } } },
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
        {
          id: "o3",
          text: "Consult dock scholar and decode a legal cipher",
          puzzle: {
            mode: "code",
            title: "Puzzle: Decode the Writ",
            prompt: "The scholar gives a substitution clue: 'KARR = CROWN'. Decode the final keyword from the writ: 'MERCATOR'. Enter the plain-language keyword.",
            answer: "merchant",
          },
          success: { next: "marshal_ambush", text: "Decoded correctly. The writ authorizes emergency market claims across two regions.", effects: { merchantReward: { credits: 160, factionKey: "political", factionRenown: 1, item: "Trade Good" } } },
          fail: { next: "marshal_ambush", text: "You misread the writ and trigger an audit notice on your routes.", effects: { credits: -60 } },
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
          success: { next: "storm_archive", text: "You weather the barrage and earn fear-respect.", effects: { renown: 1, flags: { seaTrialWon: true } } },
          fail: { next: "sea_chase", text: "You survive but your ship limps toward open water.", effects: { health: 1, mentalStress: 1 } },
        },
        {
          id: "o4",
          text: "Invoke old convoy law and request military witness",
          stat: "lead",
          baseDread: 10,
          req: { factionAtLeast: { key: "military", min: 2 } },
          success: { next: "storm_archive", text: "A convoy captain signs your temporary immunity writ.", effects: { faction: { military: 1 }, flags: { gotConvoyWrit: true } } },
          fail: { next: "sea_chase", text: "The captain refuses to stake rank on you.", effects: { faction: { military: -1 }, mentalStress: 1 } },
        },
      ],
    },

    storm_archive: {
      chapter: "c2",
      title: "Vault Beneath the Tide",
      location: "Sea Region",
      mood: "Paranoid heist",
      text: "You descend in a coffin-sub to a court archive buried in storm silt. Ledgers hum with names, verdicts, and hidden payment channels feeding Voss Karr's network.",
      lessons: ["naval", "missions"],
      variants: [
        { when: { flagEq: { key: "seaTrialWon", value: true } }, text: "Because you survived trial by cannon, archivists hesitate before raising alarms." },
        { when: { factionAtLeast: { key: "corporations", min: 2 } }, text: "Corporate account signatures flicker across multiple shell houses you recognize." },
      ],
      options: [
        {
          id: "o1",
          text: "Forge credentials and clone the payment tree",
          stat: "control",
          baseDread: 10,
          success: { next: "sea_mutiny", text: "You leave with a clean mirror of their revenue channels.", effects: { credits: 180, flags: { ledgerCloned: true } } },
          fail: { next: "sea_mutiny", text: "You copy partial data while alarms close in.", effects: { health: 1, tmw: 1 } },
        },
        {
          id: "o2",
          text: "Extract witness testimony from chained clerks",
          stat: "spirit",
          baseDread: 8,
          req: { backgroundIncludes: ["temple", "physician", "investigator"] },
          success: { next: "sea_mutiny", text: "A clerk gives sworn names linking sea judges to orbital financiers.", effects: { renown: 1, flags: { witnessChain: true } } },
          fail: { next: "sea_mutiny", text: "The clerks panic and burn part of the archive.", effects: { mentalStress: 1 } },
        },
        {
          id: "o3",
          text: "Steal a dripping glyph-slab and decode first symbols",
          puzzle: {
            mode: "code",
            title: "Puzzle: Drowned Glyph",
            prompt: "The slab reads SER next to a sunburst icon. Enter the plain meaning.",
            answer: "star",
          },
          success: { next: "sea_mutiny", text: "You decode SER and log it in your fieldbook as a core key for Voss's legal liturgy.", effects: { lexicon: { ser: "star" }, flags: { glyphTrailStarted: true }, merchantReward: { credits: 80, factionKey: "underworld", factionRenown: 1 } } },
          fail: { next: "sea_mutiny", text: "You cannot crack the slab under pressure, but the symbol sketch survives.", effects: { mentalStress: 1 } },
        },
      ],
    },

    sea_mutiny: {
      chapter: "c2",
      title: "Mutiny in Lantern Fog",
      location: "Sea to Space",
      mood: "Operatic mutiny",
      text: "Crew morale fractures as rumors spread that Voss Karr already owns your route. Officers argue over whether to run, revolt, or sell you out for pardon.",
      options: [
        {
          id: "o1",
          text: "Hold command with steel discipline",
          stat: "defend",
          baseDread: 10,
          success: { next: "sea_chase", text: "Order returns. Your jump prep runs on razor precision.", effects: { faction: { military: 1 } } },
          fail: { next: "sea_chase", text: "You keep command but lose trust in the lower decks.", effects: { mentalStress: 1, npc: { lyra: -1 } } },
        },
        {
          id: "o2",
          text: "Negotiate split command with trusted officers",
          stat: "lead",
          baseDread: 8,
          success: { next: "sea_chase", text: "Shared command steadies the ship and creates loyalty.", effects: { npc: { lyra: 1, mara: 1 }, flags: { splitCommand: true } } },
          fail: { next: "sea_chase", text: "Compromise reads as weakness during a storm watch.", effects: { faction: { underworld: 1 }, health: 1 } },
        },
        {
          id: "o3",
          text: "Stage a fake haunting trial to flush mutineers",
          stat: "control",
          baseDread: 10,
          success: { next: "sea_chase", text: "Half the conspirators confess to ghosts that are actually your disguised crew.", effects: { renown: 1, npc: { iosef: 1 } } },
          fail: { next: "sea_chase", text: "The stunt partly works, but panic breaks two launch rails.", effects: { health: 1, credits: -40 } },
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
      variants: [
        { when: { factionAtLeast: { key: "corporations", min: 3 } }, text: "Invitations to a private board-synod arrive with your name pre-approved." },
        { when: { factionAtLeast: { key: "rebels", min: 2 } }, text: "Graffiti on cargo hulls marks a rebel channel willing to leak Voss's summit agenda." },
      ],
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
        {
          id: "o3",
          text: "Infiltrate the corporate synod in orbit",
          stat: "control",
          baseDread: 10,
          req: { factionAtLeastAny: [{ key: "corporations", min: 2 }, { key: "political", min: 2 }] },
          success: { next: "corp_synod", text: "You pass biometric scrutiny and enter the synod chamber.", effects: { flags: { synodAccess: true } } },
          fail: { next: "corp_synod", text: "You get in disguised, but security flags your gait profile.", effects: { mentalStress: 1 } },
        },
        {
          id: "o4",
          text: "Interview the station oracle for out-of-box routes",
          stat: "mind",
          baseDread: 10,
          req: { backgroundIncludes: ["scholar", "temple", "outlaw", "drifter"] },
          success: { next: "oracle_parley", text: "The oracle speaks in contradictions that still map to real jump corridors.", effects: { flags: { oracleTrust: true }, npc: { iosef: 1 } } },
          fail: { next: "oracle_parley", text: "The oracle mocks your certainty but still leaves cryptic coordinates.", effects: { tmw: 1 } },
        },
        {
          id: "o5",
          text: "Debrief with Brother Iosef about legal scripture",
          stat: "spirit",
          baseDread: 8,
          req: { backgroundIncludes: ["temple", "scholar", "historian", "noble"] },
          success: { next: "iosef_colloquy", text: "Iosef opens a sealed notebook: half prayers, half battle orders.", effects: { npc: { iosef: 2 } } },
          fail: { next: "iosef_colloquy", text: "He still talks, but keeps the crucial pages hidden.", effects: { npc: { iosef: 1 } } },
        },
      ],
    },

    iosef_colloquy: {
      chapter: "c3",
      title: "Brother Iosef's Field Catechism",
      location: "Space / Chapel Dock",
      mood: "Confession and strategy",
      text: "Iosef admits he once served in Voss Karr's legal battalions. He offers to teach one passphrase that can unmask false verdicts, but only if your life path can carry it.",
      options: [
        {
          id: "o1",
          text: "Scholar's reading: parse doctrine as history",
          stat: "mind",
          baseDread: 8,
          req: { backgroundIncludes: ["scholar", "historian"] },
          success: { next: "planet_descent", text: "You extract the phrase anchor: 'Star binds oath' in archaic court tongue.", effects: { flags: { phraseKeyUnlocked: true }, lexicon: { va: "bind" }, npc: { iosef: 1 }, dialogueQuote: { speaker: "Iosef", line: "No verdict outranks witness." } } },
          fail: { next: "planet_descent", text: "You grasp only fragments and must infer the rest later.", effects: { mentalStress: 1 } },
        },
        {
          id: "o2",
          text: "Merchant's reading: treat doctrine as contract law",
          stat: "control",
          baseDread: 8,
          req: { careerIncludes: ["merchant", "noble", "investigator"] },
          success: { next: "planet_descent", text: "You catch the enforceable clause and turn it into legal leverage.", effects: { flags: { phraseKeyUnlocked: true }, merchantReward: { credits: 110, factionKey: "political", factionRenown: 1 }, lexicon: { va: "bind" }, dialogueQuote: { speaker: "Iosef", line: "Ledger first, sword second." } } },
          fail: { next: "planet_descent", text: "The clause slips past you, but Iosef still circles one glyph in red.", effects: { lexicon: { va: "bind" } } },
        },
      ],
    },

    oracle_parley: {
      chapter: "c3",
      title: "Oracle of Broken Frequencies",
      location: "Space Station",
      mood: "Absurd cosmic mystery",
      text: "The station oracle refuses plain speech. She offers three impossible bargains and claims one of them already happened in your future.",
      options: [
        {
          id: "o1",
          text: "Accept the bargain that costs your name for one day",
          stat: "spirit",
          baseDread: 10,
          success: { next: "planet_descent", text: "For one day, systems cannot index you. You move unseen through checkpoint nets.", effects: { merchantReward: { credits: 130, factionKey: "underworld", factionRenown: 1 }, flags: { namelessDay: true } } },
          fail: { next: "planet_descent", text: "The ritual backfires and half your records scramble.", effects: { mentalStress: 1, credits: -50 } },
        },
        {
          id: "o2",
          text: "Challenge the oracle to a logic-riddle",
          puzzle: {
            mode: "code",
            title: "Puzzle: Oracle Riddle",
            prompt: "'I am taken from a mine, and shut in a wooden case, from which I am never released, and yet I am used by almost every person.' Enter one word.",
            answer: "graphite",
          },
          success: { next: "planet_descent", text: "She laughs and grants a star-market voucher with anti-tax signatures.", effects: { merchantReward: { credits: 180, factionKey: "corporations", factionRenown: 1, item: "Retainer Contract", openShop: true } } },
          fail: { next: "planet_descent", text: "Wrong answer. She still gives a warning: 'Do not trust clean ledgers.'", effects: { flags: { oracleWarning: true } } },
        },
        {
          id: "o3",
          text: "Complete the oracle's crossword of dead languages",
          puzzle: {
            mode: "crossword_grid",
            title: "Puzzle: Dead-Language Grid",
            prompt: "Fill the intersecting letter grid from the clues.",
            gridRows: 5,
            gridCols: 5,
            gridTemplate: [
              "STAR#",
              "#A#O#",
              "VOW#T",
              "#N#H#",
              "LAWS#"
            ],
            clues: [
              { clue: "Across 1: Celestial witness in common tongue" },
              { clue: "Across 2: Promise spoken under legal pressure" },
              { clue: "Across 3: Systems that govern people" }
            ]
          },
          success: {
            next: "planet_descent",
            text: "You complete the dead-language grid and recover a legal canticle. You can now read tribunal inscriptions.",
            effects: {
              lexicon: { ser: "star", va: "bind", tor: "oath" },
              flags: { oracleCanticleSolved: true, phraseKeyUnlocked: true },
              merchantReward: { credits: 150, factionKey: "religious", factionRenown: 1 }
            }
          },
          partial: {
            next: "planet_descent",
            text: "You solve enough of the grid to infer partial meaning, but one clause remains uncertain.",
            effects: {
              lexicon: { ser: "star", va: "bind" },
              flags: { oracleCanticleSolved: false, phraseKeyUnlocked: true },
              credits: 60
            }
          },
          fail: { next: "planet_descent", text: "You misplace too many glyphs and the oracle cuts the session short.", effects: { mentalStress: 1 } },
        },
      ],
    },

    corp_synod: {
      chapter: "c3",
      title: "The Gilded Synod",
      location: "Space / Corporate Chapel",
      mood: "Political knife fight",
      text: "Board lords, military envoys, and temple auditors debate whether Voss Karr should become a permanent trans-regional magistrate. Your evidence can sway the room or burn every bridge.",
      lessons: ["space", "missions"],
      options: [
        {
          id: "o1",
          text: "Leak the tide-ledger transaction tree",
          stat: "mind",
          baseDread: 10,
          req: { flagEq: { key: "ledgerCloned", value: true } },
          success: { next: "mara_arc", text: "The synod fractures as payment routes implicate half the chamber.", effects: { faction: { corporations: -1, political: 1 }, flags: { powerCoalitionCracked: true } } },
          fail: { next: "mara_arc", text: "Your leak lands, but counter-spin paints you as a forger.", effects: { faction: { corporations: 1 }, mentalStress: 1 } },
        },
        {
          id: "o2",
          text: "Cut a temporary pact to isolate Voss",
          stat: "lead",
          baseDread: 8,
          success: { next: "planet_descent", text: "Three blocs quietly agree to starve his private fleets.", effects: { faction: { political: 1, military: 1 }, flags: { provisionalPact: true } } },
          fail: { next: "planet_descent", text: "No pact, but your terms spread through backchannels.", effects: { renown: 1 } },
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
      variants: [
        { when: { flagEq: { key: "provisionalPact", value: true } }, text: "Because of your synod pact, local garrisons hesitate to fire first." },
        { when: { flagEq: { key: "witnessChain", value: true } }, text: "Witnesses from the sea archive have already seeded resistance cells across the colony." },
      ],
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
        {
          id: "o4",
          text: "Infiltrate the undercity ration market",
          stat: "adventure",
          baseDread: 10,
          req: { backgroundIncludes: ["drifter", "merchant", "smuggler", "outlaw"] },
          success: { next: "undercity_market", text: "You slip under the city and find the loyalty-price algorithms.", effects: { flags: { undercityIntel: true }, credits: 120 } },
          fail: { next: "undercity_market", text: "You are spotted but still map two underground routes.", effects: { health: 1 } },
        },
        {
          id: "o5",
          text: "Read the black-glass inscription aloud",
          puzzle: {
            mode: "code",
            title: "Puzzle: Tribunal Canticle",
            prompt: "If SER=star, VA=bind, TOR=oath, translate and enter the phrase: SER VA TOR.",
            answer: "star bind oath",
          },
          req: { lexiconCountAtLeast: { count: 2 } },
          success: { next: "age_shift", text: "The trees answer in legal chorus, exposing hidden exits and sponsor caches.", effects: { renown: 1, merchantReward: { credits: 170, factionKey: "political", factionRenown: 1, item: "Trade Good" } } },
          partial: { next: "age_shift", text: "You recite most of the canticle correctly, opening only one of the hidden exits.", effects: { merchantReward: { credits: 90, factionKey: "political", factionRenown: 1 }, lexicon: { tor: "oath" } } },
          fail: { next: "age_shift", text: "Your pronunciation fractures the ritual, but the path still opens in panic.", effects: { mentalStress: 1, tmw: 1 } },
        },
      ],
    },

    undercity_market: {
      chapter: "c3",
      title: "Market of Borrowed Faces",
      location: "Planets / Undercity",
      mood: "Surreal criminal bazaar",
      text: "Brokers sell identities by the hour. A hidden broker offers Voss Karr's emergency exile route in exchange for one dangerous favor.",
      options: [
        {
          id: "o1",
          text: "Take the favor and run the smuggling strike",
          stat: "shoot",
          baseDread: 10,
          success: { next: "age_shift", text: "You complete the strike and gain an exile-route shard.", effects: { flags: { exileRouteKnown: true }, renown: 1 } },
          fail: { next: "age_shift", text: "The strike turns loud, but you still secure part of the route.", effects: { mentalStress: 1, tmw: 1 } },
        },
        {
          id: "o2",
          text: "Refuse and buy the route with leverage",
          stat: "control",
          baseDread: 8,
          success: { next: "age_shift", text: "You trade blackmail files for clean coordinates.", effects: { flags: { exileRouteKnown: true }, credits: -140 } },
          fail: { next: "age_shift", text: "The broker doubles the price and marks your profile.", effects: { credits: -180, faction: { underworld: -1 } } },
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
      variants: [
        { when: { flagEq: { key: "powerCoalitionCracked", value: true } }, text: "Half his allied banners are missing from the plaza; rumor says they withdrew overnight." },
        { when: { flagEq: { key: "exileRouteKnown", value: true } }, text: "A maintenance map reveals Voss's private escape corridor beneath District Twelve." },
      ],
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
        {
          id: "o4",
          text: "Call in your allies for a public reckoning",
          stat: "lead",
          baseDread: 10,
          req: { usedStatCountAtLeast: { count: 5 } },
          success: { next: "ally_reckoning", text: "Lyra, Mara, and city witnesses converge on the courthouse steps.", effects: { flags: { allySummit: true } } },
          fail: { next: "ally_reckoning", text: "Only some allies answer, but it is still enough to force a hearing.", effects: { mentalStress: 1 } },
        },
      ],
    },

    ally_reckoning: {
      chapter: "c4",
      title: "Witness Parliament",
      location: "World That Was",
      mood: "Defiant civic drama",
      text: "Survivors, defectors, and old rivals testify in a rolling tribunal. Voss Karr's certainty slips as every district narrates its own wounds.",
      options: [
        {
          id: "o1",
          text: "Let Lyra lead the testimony",
          stat: "spirit",
          baseDread: 8,
          req: { npcAffinity: { npc: "lyra", min: 1 } },
          success: { next: "finale_gate", text: "Lyra's testimony shifts neutral observers to your side.", effects: { faction: { political: 1 }, npc: { lyra: 1 } } },
          fail: { next: "finale_gate", text: "She falters under pressure, but the record still condemns Voss.", effects: { mentalStress: 1 } },
        },
        {
          id: "o2",
          text: "Let Mara broadcast the hidden ledgers",
          stat: "mind",
          baseDread: 8,
          req: { npcAffinity: { npc: "mara", min: 1 } },
          success: { next: "finale_gate", text: "Data storms break across every district screen.", effects: { faction: { corporations: -1, rebels: 1 }, npc: { mara: 1 } } },
          fail: { next: "finale_gate", text: "The stream drops repeatedly, but enough evidence survives.", effects: { tmw: 1 } },
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
        {
          id: "o2",
          text: "Invoke the decoded canticle before witnesses",
          req: { flagEq: { key: "phraseKeyUnlocked", value: true }, lexiconKnown: ["ser", "va", "tor"] },
          success: { next: "finale_canticle", text: "The courtroom wards unlock and Voss loses control of his legal machinery.", effects: { renown: 2, faction: { religious: 1, political: 1 } } },
        },
      ],
    },

    finale_canticle: {
      chapter: "c4",
      title: "The Third Tongue",
      location: "World That Was",
      mood: "Ritual courtroom duel",
      text: "You speak the reconstructed phrase. Statues crack. Archived verdicts replay in public. Voss Karr tries to counter with forged scripture.",
      options: [
        {
          id: "o1",
          text: "Let Iosef and Lyra co-deliver the final testimony",
          stat: "lead",
          baseDread: 10,
          req: { npcAffinity: { npc: "iosef", min: 2 }, quoteKnownAny: ["No verdict outranks witness", "Mercy is not weakness"] },
          success: { next: "ending_openhand", text: "Their testimony lands like thunder. The city chooses distributed justice.", effects: { faction: { political: 1, rebels: 1 }, renown: 2 } },
          fail: { next: "finale_choice", text: "The testimony splinters under counterclaims; you must choose direct judgment.", effects: { mentalStress: 1 } },
        },
        {
          id: "o2",
          text: "Recite remembered voices back at Voss",
          stat: "spirit",
          baseDread: 10,
          req: { quoteKnownAny: ["Mercy is not weakness", "Ledger first, sword second", "No verdict outranks witness"] },
          success: { next: "ending_openhand", text: "Your borrowed lines from allies turn the crowd. Voss is outnumbered by memory.", effects: { renown: 2, faction: { rebels: 1, political: 1 } } },
          fail: { next: "finale_choice", text: "You falter on the final line and Voss regains the room for a moment.", effects: { mentalStress: 1 } },
        },
        {
          id: "o3",
          text: "Challenge Voss to a last legal paradox",
          puzzle: {
            mode: "code",
            title: "Puzzle: Final Paradox",
            prompt: "Complete the paradox phrase with one word: 'No law is lawful unless it can be ____ by the powerless.'",
            answer: "challenged",
          },
          success: { next: "ending_openhand", text: "He fails to answer before the city. Authority disperses in real time.", effects: { renown: 3, merchantReward: { credits: 220, factionKey: "corporations", factionRenown: 1, openShop: true } } },
          partial: { next: "ending_openhand", text: "Your argument lands unevenly, but enough delegates break rank to pass the charter.", effects: { renown: 1, credits: 80 } },
          fail: { next: "finale_choice", text: "He twists the argument and the room demands a harsher verdict.", effects: { tmw: 1 } },
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
        {
          id: "o4",
          text: "Draft a distributed civic charter on live feed",
          stat: "control",
          baseDread: 10,
          req: { flagEq: { key: "allySummit", value: true } },
          success: { next: "ending_openhand", text: "District delegates sign in real time as Voss loses narrative control.", effects: { renown: 3, faction: { political: 2, rebels: 1 } } },
          fail: { next: "ending_openhand", text: "The charter launches amid chaos, but it still decentralizes power.", effects: { mentalStress: 2, renown: 1 } },
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

    ending_openhand: {
      chapter: "c4",
      title: "Ending: Open Hand Assembly",
      location: "Epilogue",
      mood: "Messy democratic sunrise",
      text: "You reject singular rule and spread authority across districts. Governance becomes louder, slower, and harder to corrupt in one stroke.",
      options: [{ id: "o1", text: "Restart from Chapter 1 with carried reputation", success: { restart: true, text: "The next cycle starts with more voices." } }],
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
    if (!st.history || typeof st.history !== "object") st.history = { sceneVisits: {}, optionsTaken: {} };
    if (!st.history.sceneVisits || typeof st.history.sceneVisits !== "object") st.history.sceneVisits = {};
    if (!st.history.optionsTaken || typeof st.history.optionsTaken !== "object") st.history.optionsTaken = {};
    if (!st.lexicon || typeof st.lexicon !== "object") st.lexicon = {};
    if (!Array.isArray(st.dialogueMemory)) st.dialogueMemory = [];
    return st;
  }

  function addDialogueMemory(speaker, line) {
    const st = ensureStoryState();
    if (!st) return;
    const s = String(speaker || "Unknown").trim();
    const l = String(line || "").trim();
    if (!l) return;
    const key = (s + "|" + l).toLowerCase();
    const exists = st.dialogueMemory.some(function (entry) {
      return ((entry.speaker || "") + "|" + (entry.line || "")).toLowerCase() === key;
    });
    if (exists) return;
    st.dialogueMemory.unshift({ speaker: s, line: l });
    st.dialogueMemory = st.dialogueMemory.slice(0, 10);
  }

  function hasRememberedQuote(fragment) {
    const st = ensureStoryState();
    if (!st) return false;
    const needle = lc(fragment);
    return (st.dialogueMemory || []).some(function (entry) {
      return lc(entry.line).indexOf(needle) >= 0 || lc(entry.speaker).indexOf(needle) >= 0;
    });
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
    if (req.flagEq && req.flagEq.key) {
      const st = ensureStoryState();
      if (!st) return false;
      if (st.flags[req.flagEq.key] !== req.flagEq.value) return false;
    }
    if (req.flagNot && req.flagNot.key) {
      const st = ensureStoryState();
      if (!st) return false;
      if (st.flags[req.flagNot.key] === req.flagNot.value) return false;
    }
    if (req.sceneSeenAtLeast && req.sceneSeenAtLeast.sceneId) {
      const st = ensureStoryState();
      if (!st) return false;
      const seen = Number((st.history && st.history.sceneVisits && st.history.sceneVisits[req.sceneSeenAtLeast.sceneId]) || 0);
      if (seen < Number(req.sceneSeenAtLeast.min || 1)) return false;
    }
    if (req.usedStatCountAtLeast && req.usedStatCountAtLeast.count) {
      const st = ensureStoryState();
      if (!st) return false;
      if ((st.usedStats || []).length < Number(req.usedStatCountAtLeast.count || 0)) return false;
    }
    if (Array.isArray(req.lexiconKnown) && req.lexiconKnown.length) {
      const st = ensureStoryState();
      if (!st) return false;
      const hasAll = req.lexiconKnown.every(function (token) {
        return !!st.lexicon[String(token || "").toLowerCase()];
      });
      if (!hasAll) return false;
    }
    if (req.lexiconCountAtLeast && req.lexiconCountAtLeast.count) {
      const st = ensureStoryState();
      if (!st) return false;
      if (Object.keys(st.lexicon || {}).length < Number(req.lexiconCountAtLeast.count || 0)) return false;
    }
    if (req.quoteKnown) {
      if (!hasRememberedQuote(req.quoteKnown)) return false;
    }
    if (Array.isArray(req.quoteKnownAny) && req.quoteKnownAny.length) {
      const okAny = req.quoteKnownAny.some(function (q) { return hasRememberedQuote(q); });
      if (!okAny) return false;
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

    if (effects.flags && typeof effects.flags === "object") {
      const st = ensureStoryState();
      Object.keys(effects.flags).forEach(function (key) {
        st.flags[key] = effects.flags[key];
      });
    }

    if (effects.lexicon && typeof effects.lexicon === "object") {
      const st = ensureStoryState();
      Object.keys(effects.lexicon).forEach(function (glyph) {
        st.lexicon[String(glyph || "").toLowerCase()] = String(effects.lexicon[glyph] || "").toLowerCase();
      });
    }

    if (effects.dialogueQuote) {
      const entries = Array.isArray(effects.dialogueQuote) ? effects.dialogueQuote : [effects.dialogueQuote];
      entries.forEach(function (entry) {
        if (!entry) return;
        addDialogueMemory(entry.speaker || "Unknown", entry.line || "");
      });
    }

    if (effects.merchantReward && typeof effects.merchantReward === "object") {
      grantMerchantReward(effects.merchantReward);
    }
  }

  function grantMerchantReward(reward) {
    const credits = Number(reward.credits || 0);
    const factionKey = reward.factionKey || "corporations";
    const renown = Number(reward.factionRenown || 0);
    const item = reward.item || "";

    if (credits) {
      S.credits = Math.max(0, Number(S.credits || 0) + credits);
      if (typeof updateCreditsUI === "function") updateCreditsUI();
    }

    if (renown) {
      if (typeof changeFactionRenown === "function") changeFactionRenown(factionKey, renown);
      else if (S.factionRenown && typeof S.factionRenown === "object") {
        S.factionRenown[factionKey] = Math.max(-10, Math.min(12, Number(S.factionRenown[factionKey] || 0) + renown));
      }
      if (typeof updateFactionRenownUI === "function") updateFactionRenownUI();
    }

    if (item && typeof addToBackpack === "function") {
      try { addToBackpack(item); } catch (err) {}
    }

    if (reward.openShop && typeof switchTab === "function") {
      const shopBtn = document.querySelector(".tab-btn[onclick*=\"switchTab('shop'\"]");
      switchTab("shop", shopBtn || null);
    }

    if (typeof showNotif === "function") {
      const bits = [];
      if (credits) bits.push((credits > 0 ? "+" : "") + credits + " Credits");
      if (renown) bits.push((renown > 0 ? "+" : "") + renown + " " + (FACTION_LABELS[factionKey] || factionKey));
      if (item) bits.push("Loot: " + item);
      if (bits.length) showNotif("Merchant reward: " + bits.join(" · "), "good");
    }
  }

  function ensurePuzzleSession() {
    window._storyPuzzle = window._storyPuzzle || {
      sceneId: "",
      optionId: "",
      mode: "code",
      title: "",
      prompt: "",
      answer: "",
      sequence: [],
      selected: [],
      bank: [],
      clues: [],
      gridTemplate: [],
      gridRows: 0,
      gridCols: 0,
      typed: "",
    };
    return window._storyPuzzle;
  }

  function resetPuzzleSession() {
    const p = ensurePuzzleSession();
    p.sceneId = "";
    p.optionId = "";
    p.mode = "code";
    p.title = "";
    p.prompt = "";
    p.answer = "";
    p.sequence = [];
    p.selected = [];
    p.bank = [];
    p.clues = [];
    p.gridTemplate = [];
    p.gridRows = 0;
    p.gridCols = 0;
    p.typed = "";
  }

  function puzzleTierForScene(sceneId) {
    const scene = SCENES[sceneId] || {};
    const chapter = scene.chapter || "c1";
    if (chapter === "c1") return { label: "Easy", success: 0.7, partial: 0.45 };
    if (chapter === "c2") return { label: "Standard", success: 0.78, partial: 0.52 };
    if (chapter === "c3") return { label: "Hard", success: 0.86, partial: 0.6 };
    return { label: "Brutal", success: 0.93, partial: 0.68 };
  }

  function scoreTokens(typed, expected) {
    const a = lc(typed).split(/\s+/).filter(Boolean);
    const b = lc(expected).split(/\s+/).filter(Boolean);
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    const maxLen = Math.max(a.length, b.length);
    let correct = 0;
    for (let i = 0; i < maxLen; i++) {
      if ((a[i] || "") === (b[i] || "")) correct += 1;
    }
    return correct / maxLen;
  }

  function scoreCrosswordGrid(p) {
    let total = 0;
    let correct = 0;
    for (let r = 0; r < p.gridRows; r++) {
      const row = p.gridTemplate[r] || "";
      for (let c = 0; c < p.gridCols; c++) {
        const expected = (row[c] || "#").toUpperCase();
        if (expected === "#") continue;
        total += 1;
        const el = document.getElementById("storyGrid_" + r + "_" + c);
        const typed = (el && typeof el.value === "string") ? el.value.trim().toUpperCase() : "";
        if (typed && typed === expected) correct += 1;
      }
    }
    return total ? (correct / total) : 0;
  }

  function puzzleAttemptScore() {
    const p = ensurePuzzleSession();
    if (p.mode === "tune") {
      const maxLen = Math.max(p.sequence.length, p.selected.length, 1);
      let correct = 0;
      for (let i = 0; i < maxLen; i++) {
        if (lc(p.sequence[i]) === lc(p.selected[i])) correct += 1;
      }
      return correct / maxLen;
    }
    if (p.mode === "rearrange") {
      return scoreTokens(p.selected.join(" "), p.answer);
    }
    if (p.mode === "crossword_grid") {
      return scoreCrosswordGrid(p);
    }
    if (p.mode === "crossword") {
      const maxLen = Math.max(p.clues.length, 1);
      let correct = 0;
      p.clues.forEach(function (c, i) {
        const el = document.getElementById("storyCross_" + i);
        const val = (el && typeof el.value === "string") ? el.value.trim().toLowerCase() : "";
        if (val === String(c.answer || "").trim().toLowerCase()) correct += 1;
      });
      return correct / maxLen;
    }

    const el = document.getElementById("storyPuzzleInput");
    const val = (el && typeof el.value === "string") ? el.value.trim().toLowerCase() : "";
    if (val === p.answer) return 1;
    return scoreTokens(val, p.answer);
  }

  function renderPuzzleModal() {
    const p = ensurePuzzleSession();
    let controls = "";

    if (p.mode === "tune") {
      const notes = ["DO", "RE", "MI", "FA", "SO", "LA", "TI"];
      controls = ""
        + "<div style='margin-bottom:.35rem;color:var(--muted2);font-size:.78rem;'>Current tune: <strong style='color:var(--teal);'>" + (p.selected.join("-") || "(empty)") + "</strong></div>"
        + "<div style='display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.45rem;'>"
        + notes.map(function (n) {
          return "<button class='btn btn-xs btn-teal' onclick='storyPuzzlePress(\"" + n + "\")'>" + n + "</button>";
        }).join("")
        + "</div>";
    } else if (p.mode === "rearrange") {
      controls = ""
        + "<div style='margin-bottom:.35rem;color:var(--muted2);font-size:.78rem;'>Arrange phrase: <strong style='color:var(--gold2);'>" + (p.selected.join(" ") || "(empty)") + "</strong></div>"
        + "<div style='display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.45rem;'>"
        + p.bank.map(function (word) {
          return "<button class='btn btn-xs' onclick='storyPuzzlePress(\"" + word.replace(/"/g, "") + "\")'>" + word + "</button>";
        }).join("")
        + "</div>";
    } else if (p.mode === "crossword") {
      controls = ""
        + "<div style='font-size:.74rem;color:var(--muted2);margin-bottom:.35rem;'>Crossword style clues: fill each answer, then submit.</div>"
        + p.clues.map(function (c, i) {
          return "<div style='margin-bottom:.3rem;'>"
            + "<div style='font-size:.76rem;color:var(--text2);margin-bottom:.12rem;'>" + (i + 1) + ". " + c.clue + "</div>"
            + "<input id='storyCross_" + i + "' class='input' placeholder='Answer " + (i + 1) + "' style='width:100%;'/>"
            + "</div>";
        }).join("");
    } else if (p.mode === "crossword_grid") {
      const cells = [];
      for (let r = 0; r < p.gridRows; r++) {
        for (let c = 0; c < p.gridCols; c++) {
          const ch = ((p.gridTemplate[r] || "")[c] || "#").toUpperCase();
          if (ch === "#") {
            cells.push("<div style='width:28px;height:28px;background:var(--surface2);border:1px solid var(--border2);'></div>");
          } else {
            cells.push("<input id='storyGrid_" + r + "_" + c + "' maxlength='1' class='input' style='width:28px;height:28px;text-align:center;padding:0;text-transform:uppercase;'/>"
            );
          }
        }
      }
      controls = ""
        + "<div style='font-size:.74rem;color:var(--muted2);margin-bottom:.35rem;'>Grid crossword: fill all open cells. # blocks are locked.</div>"
        + "<div style='display:grid;grid-template-columns:repeat(" + p.gridCols + ",28px);gap:2px;justify-content:start;margin-bottom:.45rem;'>" + cells.join("") + "</div>"
        + p.clues.map(function (c, i) {
          return "<div style='font-size:.74rem;color:var(--muted2);margin-bottom:.12rem;'>" + (i + 1) + ". " + c.clue + "</div>";
        }).join("");
    } else {
      controls = ""
        + "<input id='storyPuzzleInput' class='input' placeholder='Type your decoded answer' style='width:100%;margin-bottom:.45rem;'/>";
    }

    const tier = puzzleTierForScene(p.sceneId);

    const html = ""
      + "<div style='font-size:.84rem;color:var(--text2);line-height:1.6;margin-bottom:.4rem;'>" + p.prompt + "</div>"
      + "<div style='font-size:.72rem;color:var(--muted2);margin-bottom:.35rem;'>Difficulty: " + tier.label + " · Full success ≥ " + Math.round(tier.success * 100) + "% · Partial ≥ " + Math.round(tier.partial * 100) + "%</div>"
      + controls
      + "<div style='display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;'>"
      + "<button class='btn btn-sm' onclick='storyPuzzleClear()'>Reset</button>"
      + "<button class='btn btn-sm btn-red' onclick='storyPuzzleResolve(false)'>Force Through (Fail)</button>"
      + "<button class='btn btn-sm btn-primary' onclick='storyPuzzleResolve(true)'>Submit</button>"
      + "</div>";

    if (typeof openModal === "function") openModal(p.title || "Story Puzzle", html);
  }

  function startStoryPuzzle(sceneId, option) {
    const p = ensurePuzzleSession();
    const puzzle = option && option.puzzle ? option.puzzle : null;
    if (!puzzle) return;

    p.sceneId = sceneId;
    p.optionId = option.id;
    p.mode = puzzle.mode || "code";
    p.title = puzzle.title || "Story Puzzle";
    p.prompt = puzzle.prompt || "";
    p.answer = String(puzzle.answer || "").trim().toLowerCase();
    p.sequence = Array.isArray(puzzle.sequence) ? puzzle.sequence.slice() : [];
    p.selected = [];
    p.bank = Array.isArray(puzzle.bank) ? puzzle.bank.slice() : [];
    p.clues = Array.isArray(puzzle.clues) ? puzzle.clues.slice() : [];
    p.gridTemplate = Array.isArray(puzzle.gridTemplate) ? puzzle.gridTemplate.slice() : [];
    p.gridRows = Number(puzzle.gridRows || p.gridTemplate.length || 0);
    p.gridCols = Number(puzzle.gridCols || (p.gridTemplate[0] ? p.gridTemplate[0].length : 0));
    p.typed = "";

    renderPuzzleModal();
  }

  function puzzleSuccessByInput() {
    const p = ensurePuzzleSession();
    if (p.mode === "tune") {
      return p.selected.join("-").trim().toLowerCase() === p.sequence.join("-").trim().toLowerCase();
    }
    if (p.mode === "rearrange") {
      return p.selected.join(" ").trim().toLowerCase() === p.answer;
    }
    if (p.mode === "crossword") {
      return p.clues.every(function (c, i) {
        const el = document.getElementById("storyCross_" + i);
        const val = (el && typeof el.value === "string") ? el.value.trim().toLowerCase() : "";
        return val === String(c.answer || "").trim().toLowerCase();
      });
    }
    const el = document.getElementById("storyPuzzleInput");
    const val = (el && typeof el.value === "string") ? el.value.trim().toLowerCase() : "";
    return val === p.answer;
  }

  function resolveStoryOption(sceneId, option, forcedResult) {
    const st = ensureStoryState();
    if (!st || !option) return;

    if (!st.history.sceneVisits || typeof st.history.sceneVisits !== "object") st.history.sceneVisits = {};
    if (!st.history.optionsTaken || typeof st.history.optionsTaken !== "object") st.history.optionsTaken = {};
    st.history.sceneVisits[sceneId] = Number(st.history.sceneVisits[sceneId] || 0) + 1;
    st.history.optionsTaken[sceneId + ":" + option.id] = Number(st.history.optionsTaken[sceneId + ":" + option.id] || 0) + 1;

    if (!hasReq(option.req)) {
      if (typeof showNotif === "function") showNotif("This dialogue path is locked by your history, rank, or season.", "warn");
      return;
    }

    doJump(option.jump);

    let checkResult = null;
    let outcome = option.success;

    if (option.stat && forcedResult !== "success" && forcedResult !== "fail" && forcedResult !== "partial") {
      const dd = getOptionDread(sceneId, option);
      checkResult = rollStoryCheck(option.stat, dd);
      outcome = checkResult.success ? option.success : (option.fail || option.success);
    } else if (forcedResult === "fail") {
      outcome = option.fail || option.success;
    } else if (forcedResult === "partial") {
      outcome = option.partial || option.fail || option.success;
    } else if (forcedResult === "success") {
      outcome = option.success;
    }

    applyOutcome(sceneId, option, outcome, checkResult);
    renderStorylinePanel();
  }

  function seedNumber(seedTag) {
    const nums = String(seedTag || "").replace(/\D/g, "");
    return Number(nums || 0);
  }

  function sceneVariantText(scene, st) {
    if (!scene || !Array.isArray(scene.variants) || !scene.variants.length) return "";

    const eligible = scene.variants.filter(function (variant) {
      return hasReq(variant && variant.when ? variant.when : null);
    });
    if (!eligible.length) return "";

    const seed = seedNumber(st.seedTag);
    const lyra = Number(st.npc.lyra || 0);
    const mara = Number(st.npc.mara || 0);
    const iosef = Number(st.npc.iosef || 0);
    const bias = Math.max(0, lyra + mara + iosef);
    const index = (seed + bias + Number(st.log.length || 0)) % eligible.length;
    return String((eligible[index] && eligible[index].text) || "");
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
    const scene = SCENES[sceneId];

    if (scene) markLessonProgress(scene);

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
      st.flags = {};
      st.history = { sceneVisits: {}, optionsTaken: {} };
      st.lexicon = {};
      st.dialogueMemory = [];
      st.log = [];
      st.usedStats = [];
      st.completedSystems = [];
      st.seedTag = "W-" + Math.floor(Math.random() * 9000 + 1000);
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
    const scene = SCENES[sceneId];
    if (!scene) return;

    const option = (scene.options || []).find(function (o) { return o.id === optionId; });
    if (!option) return;

    if (option.puzzle) {
      startStoryPuzzle(sceneId, option);
      return;
    }

    resolveStoryOption(sceneId, option, null);
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
    if (req.npcAffinity && req.npcAffinity.npc) bits.push("Affinity " + req.npcAffinity.npc + " ≥ " + req.npcAffinity.min);
    if (req.flagEq && req.flagEq.key) bits.push("Flag " + req.flagEq.key + " = " + req.flagEq.value);
    if (req.sceneSeenAtLeast && req.sceneSeenAtLeast.sceneId) bits.push("Seen " + req.sceneSeenAtLeast.sceneId + " x" + req.sceneSeenAtLeast.min);
    if (req.usedStatCountAtLeast && req.usedStatCountAtLeast.count) bits.push("Used stats ≥ " + req.usedStatCountAtLeast.count);
    if (Array.isArray(req.lexiconKnown) && req.lexiconKnown.length) bits.push("Glyphs: " + req.lexiconKnown.join(", "));
    if (req.lexiconCountAtLeast && req.lexiconCountAtLeast.count) bits.push("Known glyphs ≥ " + req.lexiconCountAtLeast.count);
    if (req.quoteKnown) bits.push("Remembered quote: " + req.quoteKnown);
    if (Array.isArray(req.quoteKnownAny) && req.quoteKnownAny.length) bits.push("Any remembered: " + req.quoteKnownAny.join(" / "));
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
    const variantText = sceneVariantText(scene, st);

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

    const lexiconText = Object.keys(st.lexicon || {}).length
      ? Object.keys(st.lexicon).map(function (k) { return k + "=" + st.lexicon[k]; }).join(" · ")
      : "None decoded yet";

    const memoryText = (st.dialogueMemory && st.dialogueMemory.length)
      ? st.dialogueMemory.slice(0, 4).map(function (m) { return m.speaker + ": \"" + m.line + "\""; }).join("<br>")
      : "No remembered lines yet";

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
      + (variantText ? ("<div class='story-result'><strong>Variant:</strong> " + variantText + "</div>") : "")
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
      + "<div class='story-label'>Decoded Lexicon</div><div class='story-value'>" + lexiconText + "</div>"
      + "<div class='story-label'>Remembered Voices</div><div class='story-value'>" + memoryText + "</div>"
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
  window.storyPuzzlePress = function (value) {
    const p = ensurePuzzleSession();
    if (p.mode === "code" || p.mode === "crossword" || p.mode === "crossword_grid") return;
    p.selected.push(String(value || ""));
    renderPuzzleModal();
  };
  window.storyPuzzleClear = function () {
    const p = ensurePuzzleSession();
    p.selected = [];
    const el = document.getElementById("storyPuzzleInput");
    if (el) el.value = "";
    renderPuzzleModal();
  };
  window.storyPuzzleResolve = function (attemptSubmit) {
    const p = ensurePuzzleSession();
    const scene = SCENES[p.sceneId];
    if (!scene) return;
    const option = (scene.options || []).find(function (o) { return o.id === p.optionId; });
    if (!option) return;

    let result = "fail";
    if (attemptSubmit) {
      const score = puzzleAttemptScore();
      const tier = puzzleTierForScene(p.sceneId);
      if (score >= tier.success || puzzleSuccessByInput()) result = "success";
      else if (score >= tier.partial) result = "partial";
      else {
        if (typeof showNotif === "function") {
          showNotif("Puzzle attempt: " + Math.round(score * 100) + "% accuracy. Need " + Math.round(tier.partial * 100) + "% for partial progress.", "warn");
        }
        return;
      }
    }

    if (typeof closeModal === "function") closeModal();
    resolveStoryOption(p.sceneId, option, result);
    resetPuzzleSession();
  };
})();
