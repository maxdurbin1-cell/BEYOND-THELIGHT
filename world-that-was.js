// world-that-was.js
(function () {
  const WTW_HEX = 26;
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

  const DISTRICT_NAMES = {
    "Cyber Hub": ["The Clinic", "The Studio", "The Arcade", "The Shop", "The Hub"],
    "Green House": ["The Garden", "The Forest", "The Zoo", "The Lab", "The Dome"],
    "Industrial Sector": ["The Factory", "The Power Plant", "The Depot", "The Warehouse", "The Forge"],
    "Neon City": ["Central Plaza", "The Strip", "The Grid", "The Slums", "The Zone"],
    "Outskirts": ["The Camp", "The Junkyard", "The Farm", "The Quarry", "The Road"],
    "Residential Blocks": ["The Tower", "The Block", "The Park", "The Market", "The School"],
    "The Undercity": ["The District", "The Sewers", "The Subway", "The Vault", "The Bunker"],
    "The Wastes": ["The Oasis", "The Mine", "The Camp", "The Monument", "The Crater"],
    "The Ports": ["Dockside", "Breakwater", "Shipyard", "Marina", "Reef"]
  };

  const MAJOR_POWERS = ["Axiom Cartel", "Helix Union", "Titan Crown"]; 
  const FACTIONS = ["Veil Runners", "Dust Saints"];

  const LANDING_ZONE_NAMES = ["Cyber Hub", "Neon City", "The Ports", "Outskirts"];

  // Per-zone flavor tables — each key matches a ZONE_NAMES entry
  const ZONE_FLAVOR = {
    "Cyber Hub": {
      locations: [
        "beneath the data towers",
        "along the digital art corridor",
        "inside the virtual reality complex",
        "across the computing center",
        "through the gadget bazaar"
      ],
      sights: [
        "The Nexus Point",
        "The Pixel Promenade",
        "The Simulation Sphere",
        "The Quantum Viewpoint",
        "The Circuit Maze"
      ],
      descriptions: [
        "a central hub glowing with data streams visible as cascading lights",
        "a gallery displaying ever-AI digital murals",
        "a massive dome where visitors experience hyper-realistic alternate realities",
        "a dynamic sculpture where water and light patterns are controlled by real-time coding",
        "an observation deck that overlooks quantum processors at work"
      ],
      features: [
        "convergence of digital pioneers",
        "cultural hotspot for art lovers",
        "ultimate escapism and adventure",
        "interactive art and programming",
        "popular educational and tour spot"
      ],
      flora: ["neon ivy", "bio-luminescent wire-fern", "synthetic orchid", "circuit moss", "data-bloom"],
      fauna: ["holographic pigeons", "AI companion units", "circuit crows", "drone swarms", "memory eels"],
      land: ["server stack corridors", "suspended data bridges", "glass observation platforms", "underground fiber channels", "rooftop antenna fields"],
      weather: ["digital static haze", "cooling system mist", "neon-lit smog", "signal interference fog", "blue-tinted acid drizzle"],
      events: [
        { title: "Corporate Data Heist", text: "A corporation hires you to infiltrate a rival's data vault and steal crucial information. Guards patrol every floor.", action: "Infiltrate the vault", fight: "Roll 2 Dread (d8). Control needs to roll above both dice. Success: Gain random Hack Data Drive.", reward: "+1 Corporation" },
        { title: "Elite Hacker Ring", text: "A group of elite hackers is attempting a major data heist within the Cyber Hub, aiming to steal corporate secrets.", action: "Assist the heist or stop it", fight: "Fight Elite Hackers (DD8 | 16 HP). Success: Gain random Master Hack.", reward: "+2 Pirates" },
        { title: "Rogue AI Takeover", text: "An AI has gone rogue, taking control of the Cyber Hub's systems and threatening to wreak havoc across all terminals.", action: "Fight the AI", fight: "Fight 3 AI Constructs (DD8 | 16 HP). Gain random Augmentation.", reward: "+1 Corporation" },
        { title: "Cyber Duel Challenge", text: "A digital gladiator challenges you to a cyber showdown in the heart of Neon City, with valuable data as the prize.", action: "Accept or Sabotage the duel", fight: "Sabotage: Fight Gladiator's 2 Bodyguards (DD6 | 12 HP). Gain 300 Credits.", reward: "+1 Political Group" }
      ]
    },
    "Green House": {
      locations: [
        "beneath the towering canopies",
        "along the bio-luminescent stream",
        "inside the ancient grove",
        "across the misty expanse",
        "over the engineered waterfall",
        "through the spice corridors"
      ],
      sights: [
        "The Orchid Pavilion",
        "The Glow Trail",
        "The Heritage Tree",
        "The Mist Gardens",
        "The Cascade Overlook",
        "The Aroma Market"
      ],
      descriptions: [
        "a floating platform surrounded by rare, vibrant orchids",
        "a path that lights up underfoot with bio-luminescent algae",
        "an ancient tree wired with interactive history displays",
        "gardens that use fine mists to sustain delicate ferns",
        "a suspended bridge offering views of artificial waterfalls",
        "market stalls featuring spices and herbs from across galaxies"
      ],
      features: [
        "retreat for artists and thinkers",
        "favorite for nighttime strolls",
        "educational landmark",
        "relaxation and meditation zone",
        "popular proposal and photography spot",
        "culinary hotspot for chefs and foodies"
      ],
      flora: ["rare bioluminescent orchids", "heritage ferns", "mist-garden moss", "spice-bloom vine", "DNA-helix trees"],
      fauna: ["engineered megafauna", "fluttering avians", "eco-drones", "gene-modded insects", "holographic deer"],
      land: ["sculpted walkways", "engineered waterfall terraces", "dense bio-canopy", "glass-walled lab corridors", "dome apex platforms"],
      weather: ["fine mist", "warm humid air", "engineered rainfall", "solar-filtered light", "climate-controlled dew"],
      events: [
        { title: "Invasive Species Crisis", text: "Scientists are conducting botanical research here, but their work is threatened by invasive species rapidly spreading.", action: "Protect the research", fight: "Fight Invasive Species (DD6 | 12 HP). Gain random Trade Good.", reward: "+1 Religious Group" },
        { title: "Stolen Rare Plant", text: "A rare and valuable plant has been stolen from the Greenhouse, and the botanists are desperate to get it back.", action: "Recover the plant or Investigate the theft", fight: "Fight 2 Thieves (DD6 | 12 HP). Success: Gain random Cosmic Essential.", reward: "+1 Religious Group" },
        { title: "Eco-Terrorist Plot", text: "A group of eco-terrorists has infiltrated the Greenhouse, planning to sabotage its operations and burn the dome.", action: "Stop the terrorists", fight: "Fight 2 Eco-Terrorists (DD8 | 16 HP). Gain random Augmentation.", reward: "+1 Corporation" },
        { title: "Strange Mutation", text: "A strange mutation has affected some of the plants in the Greenhouse, causing them to become hostile to all carbon life.", action: "Contain the mutation", fight: "Fight Mutated Plant (DD6 | 12 HP). Gain random Armor.", reward: "+1 Corporation" }
      ]
    },
    "Industrial Sector": {
      locations: [
        "sprawling foundry complexes",
        "a dense network of steam tunnels",
        "top of the largest smokestack",
        "edge of the recycling yards",
        "inside the machine hall",
        "outskirts of the Depot"
      ],
      sights: [
        "The Iron Citadel",
        "The Vent Core",
        "The Skyline Perch",
        "The Junk Throne",
        "The Gear Loft",
        "The Steel Gardens"
      ],
      descriptions: [
        "a fortified structure lined with scrap metal serving as stronghold for the sector's overseers",
        "a hub pulsating with geothermal energy acting as central power source for underground activities",
        "an observation deck with panoramic industrial views favored for secretive exchanges",
        "a palace built from discarded mechanical parts — territory ruled by the junk barons",
        "a secluded lot surrounded by spinning cogs and wheels, refuge for thinkers and inventors",
        "a lush garden cultivated from bio-engineered plants in an experimental eco-zone"
      ],
      features: [
        "stronghold for the sector's overseers",
        "central power source for underground activities",
        "favored spot for secretive exchanges",
        "territory ruled by the junk barons",
        "refuge for thinkers and inventors",
        "experimental eco-zone in an urban wasteland"
      ],
      flora: ["oil-bloom fern", "rust-vine creeper", "smog fern", "slag moss", "carbon-filter plant"],
      fauna: ["scrap beetles", "iron rats", "factory sparrows", "gear hounds", "soot bats"],
      land: ["smoking foundry floors", "rail freight yards", "slag heaps", "smog-choked catwalks", "deep mine shafts"],
      weather: ["heavy smog", "acid drizzle", "heat haze from smelters", "steam clouds", "ashfall"],
      events: [
        { title: "Factory Fire", text: "A fire breaks out in one of the factories, threatening to spread and cause widespread damage across the district.", action: "Help extinguish the fire", fight: "Roll 2 Dread (d6). Your Body needs to roll above both dice. Gain random Trade Good.", reward: "+1 Corporation" },
        { title: "Stolen Blueprints", text: "A set of highly classified blueprints has been stolen from a factory, and the thieves are trying to escape with them.", action: "Recover the blueprints or steal them yourself", fight: "Fight 3 Thieves (DD8 | 16 HP). Control: Gain 300 Credits.", reward: "+2 Pirates" },
        { title: "Worker Uprising", text: "Factory workers have gone on strike, demanding better conditions and wages. The situation is tense and could turn violent.", action: "Mediate the dispute", fight: "Roll 2 Dread (d6). Spirit needs to roll above both dice. Gain 220 Credits.", reward: "+1 Corporation" },
        { title: "Smuggler Hideout", text: "A smuggler's hideout is discovered within the sector, filled with contraband and illegal bio-mods.", action: "Negotiate with smugglers or raid them", fight: "Negotiate: Roll 2 Dread (d8). Your Mind needs to roll above both dice. Gain random Ranged Weapon.", reward: "+2 Pirates" }
      ]
    },
    "Neon City": {
      locations: [
        "beneath the neon arches",
        "over the old metro lines",
        "atop the highest skyscraper",
        "within the forgotten tunnels",
        "along the virtual reality row",
        "at the city's edge"
      ],
      sights: [
        "The Circuit Café",
        "The Echo Chamber",
        "The Skyline Club",
        "The Vault",
        "The Mirage Market",
        "The Frontier Outpost"
      ],
      descriptions: [
        "a digital diner streaming live-coded visuals",
        "an abandoned station turned into an echo hall",
        "a luxury sky bar with panoramic city views",
        "a hidden repository of forbidden archives",
        "a market selling hyper-realistic VR experiences",
        "a rough-and-tumble bar at the limits of city law"
      ],
      features: [
        "a hub for tech enthusiasts and digital artists",
        "secret concerts and underground events",
        "elite networking and high-stakes deals",
        "a treasure trove for historians and thieves",
        "escapes into alternate realities",
        "a haven for bounty hunters and outlaws"
      ],
      flora: ["neon-glow cactus", "chrome-leaf plant", "pixel-bloom", "LED-fiber vine", "synthetic bonsai"],
      fauna: ["Velocity Vultures", "neon ferrets", "chrome tag cats", "circuit beetles", "holographic sparrows"],
      land: ["neon-lit skyways", "underground transit lines", "vertical slum stacks", "rooftop race circuits", "forgotten tunnel networks"],
      weather: ["perpetual neon twilight", "smog-filtered rain", "electric static wind", "light-pollution haze", "cold neon drizzle"],
      events: [
        { title: "Neon Sign Failure", text: "A series of neon signs are malfunctioning, causing chaos in the streets. The sign owners suspect foul play.", action: "Investigate or Sabotage further", fight: "Lead Save vs DD8. Success: Gain 200 Credits.", reward: "+1 Political Group" },
        { title: "Trapped in VR", text: "A new virtual reality experience is sweeping through Neon City, but some users are getting trapped inside the simulation.", action: "Fix the glitch", fight: "Mind Save vs DD6. Success: Gain random Toolkit.", reward: "+1 Political Group" },
        { title: "Celebrity Concert Chaos", text: "A major celebrity is hosting a concert in the heart of Neon City, attracting massive crowds and potential trouble.", action: "Provide security or Sell bootleg merchandise", fight: "Sell bootleg: Roll 2 Dread (d8). Control needs to roll above both. Gain random Trade Good.", reward: "+1 Corporation" },
        { title: "Massive Holo-Ad Glitch", text: "A massive holo-advertisement is glitching, causing disruptions and attracting hackers looking to exploit the situation.", action: "Stop the heist", fight: "Fight 3 Thieves (DD8 | 16 HP). Gain random Exocraft.", reward: "+1 Corporation" }
      ]
    },
    "Outskirts": {
      locations: [
        "beyond the crumbling overpass",
        "within the derelict vehicle yard",
        "at the edge of the dried lakebed",
        "among the abandoned silos",
        "under the vast scrap canopy",
        "beside the forgotten rail tracks"
      ],
      sights: [
        "The Echo Tower",
        "The Iron Garden",
        "The Mirror Field",
        "The Refuge",
        "The Market of Memories",
        "The Last Depot"
      ],
      descriptions: [
        "a towering structure made from repurposed radio equipment that broadcasts old-world music and messages",
        "a carefully cultivated garden growing amidst rusted hulks, a community hub for trading seeds and plants",
        "a field of solar mirrors repurposed into a dazzling art installation that attracts artists and wanderers",
        "a network of interconnected silos turned into a safe haven, shelter for refugees and outcasts",
        "an open-air market selling items from before the fall, a trading center for historical artifacts",
        "an old train depot now serving as a makeshift hostel, rest stop for travelers and nomads"
      ],
      features: [
        "broadcasts old-world music and messages",
        "community hub for trading seeds and plants",
        "attracts artists and wanderers",
        "shelter for refugees and outcasts",
        "trading center for historical artifacts",
        "rest stop for travelers and nomads"
      ],
      flora: ["dust-hardy scrub", "irradiated bloom", "salvage-vine", "solar-panel moss", "cracked-earth succulent"],
      fauna: ["Outlaw Raptors", "dust jackals", "salvage dogs", "feral wind-hawks", "sand crawlers"],
      land: ["crumbling overpasses", "dried riverbeds", "scrap junkyard fields", "quarry cliff edges", "open road flats"],
      weather: ["dust storms", "blistering heat", "cold desert nights", "static wind", "occasional acid rain"],
      events: [
        { title: "Runaway Teenagers", text: "A group of runaway teenagers have set up a makeshift camp in the Outskirts, but they're being hunted by bounty hunters.", action: "Protect the runaways", fight: "Fight 3 Bounty Hunters (DD8 | 16 HP). Gain random Cosmic Essential.", reward: "+1 Rebel Faction" },
        { title: "Scrap Dealer Territory", text: "A scrap dealer offers valuable parts and components, but rival scavengers are trying to muscle in on their territory.", action: "Defend the dealer", fight: "Fight 3 Rival Scavengers (DD6 | 12 HP). Gain random Toolkit.", reward: "+1 Political Group" },
        { title: "Nomad Oasis", text: "A hidden oasis within the Outskirts offers a rare reprieve, but it's guarded by a group of nomadic warriors.", action: "Gain their trust", fight: "Roll 2 Dread (d8). Spirit needs to roll above both dice. Gain random Exocraft.", reward: "+1 Political Group" },
        { title: "Renegade Base", text: "A group of renegades is using the Outskirts as a base for their operations, planning a major attack on the city.", action: "Stop the attack", fight: "Fight 4 Renegades (DD8 | 18 HP). Gain random Weapon Mod.", reward: "+1 Corporation" }
      ]
    },
    "Residential Blocks": {
      locations: [
        "towering apartment complexes",
        "a bustling lobby",
        "a neon-lit junction",
        "network of pedestrian skybridges",
        "a recycled water facility",
        "a quiet residential alley"
      ],
      sights: [
        "The Skyline Garden",
        "The Community Hall",
        "The Panorama Point",
        "The Hanging Markets",
        "The Cascade",
        "The Old Clock Tower"
      ],
      descriptions: [
        "a lush rooftop park soaring above the city, escape for nature lovers and urban gardeners",
        "a vibrant, mural-adorned space hosting local gatherings, hub for civic engagement and social events",
        "an observation deck with sprawling views of the district, favored rendezvous spot for romantics and dreamers",
        "a series of floating platforms with vendors selling handmade goods, marketplace for local artisans and collectors",
        "a water purification plant turned public aquarium, educational center for sustainability practices",
        "a restored relic that now serves as a community cinema, cultural venue for movie buffs and historians"
      ],
      features: [
        "escape for nature lovers and urban gardeners",
        "hub for civic engagement and social events",
        "favored rendezvous spot for romantics and dreamers",
        "marketplace for local artisans and collectors",
        "educational center for sustainability practices",
        "cultural venue for movie buffs and historians"
      ],
      flora: ["community garden herbs", "rooftop tomato vine", "skybridge fern", "potted bamboo groves", "hydroponic lettuce walls"],
      fauna: ["rooftop sparrows", "community cats", "maintenance drones", "sky pigeons", "balcony lizards"],
      land: ["stacked tower residences", "communal courtyard plazas", "pedestrian skybridges", "basement markets", "rooftop gardens"],
      weather: ["urban heat sink warmth", "smog-filtered sunlight", "cool tower-shadow wind", "infrequent clean rain", "perpetual ambient hum"],
      events: [
        { title: "Collapsed Tower", text: "One of the towering residential blocks has partially collapsed, trapping residents inside under twisted steel.", action: "Rescue the trapped", fight: "Roll 2 Dread (d6). Body needs to roll above both dice. Gain random Trade Good.", reward: "+1 Corporation" },
        { title: "Power Surge Blackout", text: "A massive power surge has caused widespread blackouts in the Residential Blocks. Technicians are working to restore power.", action: "Assist the technicians", fight: "Solve a Riddle (Mind Save vs DD8). Gain random Hack Data Drive.", reward: "+1 Corporation" },
        { title: "Festival Disruption", text: "A local street festival is in full swing, but tensions between rival gangs threaten to disrupt the celebrations.", action: "Mediate the tensions or Intercede", fight: "Roll 2 Dread (d6). Spirit needs to roll above both dice. Gain 200 Credits.", reward: "+1 Political Group" },
        { title: "Missing Residents", text: "Several residents have gone missing under mysterious circumstances, and their families are desperate for answers.", action: "Investigate or Find the missing", fight: "Find the missing: Fight Kidnappers (DD6 | 12 HP). Gain 300 Credits.", reward: "+1 Corporation" }
      ]
    },
    "The Undercity": {
      locations: [
        "twisting underground passages",
        "an abandoned metro station",
        "a dilapidated high-rise",
        "a subterranean riverbank",
        "old maintenance corridors",
        "a forgotten war bunker"
      ],
      sights: [
        "The Echo Chamber",
        "The Phantom Platform",
        "The Vertigo Towers",
        "The Shimmering Falls",
        "The Gearworks",
        "The Iron Sanctuary"
      ],
      descriptions: [
        "a cavernous space where whispers amplify secrets, gathering spot for conspirators and spies",
        "a disused station where spectral trains are said to pass, haunt for urban explorers and ghost hunters",
        "crumbling towers with precarious bridges between them, refuge for thrill seekers and squatters",
        "a hidden waterfall glowing with bioluminescent algae, source of rare medicinal herbs",
        "a maze of steam pipes and rusty machinery, hideout for mechanics and outlaw techs",
        "an iron-clad bunker now home to a secretive cult, center for occult practices and rituals"
      ],
      features: [
        "gathering spot for conspirators and spies",
        "haunt for urban explorers and ghost hunters",
        "refuge for thrill seekers and squatters",
        "source of rare medicinal herbs",
        "hideout for mechanics and outlaw techs",
        "center for occult practices and rituals"
      ],
      flora: ["bioluminescent algae", "sewer mushroom colony", "underground fern", "rust-root creeper", "shadow-bloom"],
      fauna: ["ghost rats", "tunnel eels", "undercity bats", "blind cave fish", "iron spiders"],
      land: ["flooded sewer tunnels", "abandoned metro tracks", "crumbling underbridge walkways", "cavernous vault chambers", "sealed war bunker rooms"],
      weather: ["dripping condensation", "stale underground air", "cold damp fog", "bioluminescent haze", "echoing silence"],
      events: [
        { title: "Black Market Riot", text: "A brawl breaks out in the Undercity's black market, threatening to escalate into a full-blown riot. The rubble and danger lurk in the shadows.", action: "Break up the brawl", fight: "Fight 2 Brawlers (DD6 | 12 HP). Gain random Trade Good.", reward: "+1 Political Group" },
        { title: "Hidden Stash Rumor", text: "A hidden stash of valuable items is rumored to be hidden in the Undercity, guarded by traps and deadly creatures.", action: "Retrieve the stash or Guard it", fight: "Guard: Fight Guardians (DD8 | 16 HP). Gain random Cosmic Essential.", reward: "+1 Pirates" },
        { title: "Eavesdrop on Influencers", text: "A secret meeting between influential figures is taking place in the Undercity, away from prying eyes.", action: "Eavesdrop", fight: "Roll 2 Dread (d8). Spirit needs to roll above both dice — gain Hook and Mystery.", reward: "+1 Corporation" },
        { title: "Ancient Tech Cache", text: "Ancient technology lies forgotten in the depths of the Undercity, waiting to be rediscovered by whoever finds it first.", action: "Retrieve the tech", fight: "Lead Save vs DD10. Gain random Hack Data Drive.", reward: "+1 Pirates" }
      ]
    },
    "The Wastes": {
      locations: [
        "amidst the ruins of old towers",
        "at the base of a giant dune",
        "within a petrified forest",
        "across the cracked earth",
        "near a forgotten battlefield",
        "adjacent to a radioactive crater"
      ],
      sights: [
        "The Echo Plaza",
        "The Sunken Ship",
        "The Crystal Grove",
        "The Iron Serpent",
        "The Shield Dome",
        "The Glow Mire"
      ],
      descriptions: [
        "a crumbling plaza echoing the whispers of the past, gathering point for nomads and traders",
        "a starship half-buried in sand, turned into a hideout for scavengers and exiles",
        "trees turned to stone and crystal, shimmering under sun, source of rare minerals and mystical lore",
        "an ancient, rusted pipeline snaking through the land, landmark for navigation and shelter",
        "a semi-active defense dome housing lost technologies, relic site protected by old security drones",
        "a bog that emits a haunting, luminescent glow, hotspot for rare bio-specimens"
      ],
      features: [
        "gathering point for nomads and traders",
        "hideout for scavengers and exiles",
        "source of rare minerals and mystical lore",
        "landmark for navigation and shelter",
        "relic site protected by old security drones",
        "hotspot for rare bio-specimens"
      ],
      flora: ["petrified crystal-tree", "radio-bloom cactus", "toxic spore plant", "fossilized vine", "dune-grass"],
      fauna: ["Dust Devils", "sand crawlers", "scavenger birds", "irradiated lizards", "wasteland wolves"],
      land: ["cracked salt flats", "buried city ruins", "dune fields", "radioactive craters", "fossilized forests"],
      weather: ["sandstorms", "blistering midday heat", "cold irradiated nights", "eerie dead calm", "acid dust haze"],
      events: [
        { title: "Abandoned Research Facility", text: "An abandoned research facility in the Wastes holds valuable technology, but it's overrun by hostile creatures.", action: "Clear the facility", fight: "Fight 2 Hostile Creatures (DD8 | 16 HP). Gain random Augmentation.", reward: "+1 Corporation" },
        { title: "Desert Nomad Protection", text: "A tribe of desert nomads sells rare goods and services in exchange for protection from raiders closing in.", action: "Protect the nomads", fight: "Fight 3 Raiders (DD8 | 18 HP). Gain random Trade Good.", reward: "+1 Political Group" },
        { title: "Sandstorm Emergency", text: "A massive sandstorm engulfs the Wastes, creating both hazards and opportunities for those caught in it.", action: "Weather the storm", fight: "Roll 2 Dread (d8). Control needs to roll above both dice. Gain random Armor.", reward: "+1 Political Group" },
        { title: "Old Ruins Scavengers", text: "The ruins of an old city hold secrets and dangers alike, with scavengers picking through the remains for valuables.", action: "Explore the ruins", fight: "Mind Save vs DD10. Gain random Scroll.", reward: "+1 Religious Group" }
      ]
    },
    "The Ports": {
      locations: [
        "shadow of cranes",
        "edge of the docks",
        "a bustling market",
        "a misty pier",
        "a dilapidated warehouse district",
        "under the boardwalk"
      ],
      sights: [
        "The Spire",
        "The Silver Galleon",
        "The Glasshouse Café",
        "The Leviathan Monument",
        "The Neon Bazaar",
        "The Grotto"
      ],
      descriptions: [
        "a neon-lit tower pulsing with illegal data streams, refuge for hackers and outlaws",
        "an antiquated starship turned opulent nightclub, hotspot for black market dealings",
        "a transparent dome filled with exotic, oxygen-producing plants, popular meeting spot for smugglers",
        "a towering sculpture made from scrapped starship parts, cultural landmark and gang hideout",
        "an endless maze of stalls under flickering lights, trading hub for rare goods",
        "an underground club known for its raucous music and secretive clientele, a safe haven for information brokers"
      ],
      features: [
        "refuge for hackers and outlaws",
        "hotspot for black market dealings",
        "popular meeting spot for smugglers",
        "cultural landmark and gang hideout",
        "trading hub for rare goods",
        "a safe haven for information brokers"
      ],
      flora: ["salt-crusted sea-vine", "dock barnacle bloom", "harbor algae mat", "oil-slick fern", "deep-anchor plant"],
      fauna: ["dock rats", "sea hawks", "manta-drakes", "bio-luminescent eels", "mechanical crabs"],
      land: ["crowded docksides", "drydock bays", "floating restaurant platforms", "breakwater walls", "subaquatic reef markets"],
      weather: ["salt fog", "coastal gale", "warm trade-wind breeze", "heavy rain squalls", "humid sea air"],
      events: [
        { title: "Contraband Warehouse", text: "A group of smugglers operates out of a dilapidated warehouse, dealing in contraband from distant lands. They seek protection muscle.", action: "Protect the shipment or Expose them", fight: "Protect: Fight 2 Goons (DD8 | 16 HP). Gain random Trade Good.", reward: "+1 Pirates" },
        { title: "Underground Club Shakedown", text: "In the heart of the Ports, an underground club offers illicit substances and forbidden pleasures. A powerful mob boss threatens the owner.", action: "Question the protection or Fight the mob", fight: "Fight the Mob Enforcer (DD8 | 12 HP). Gain random Augmentation.", reward: "+1 Political Group" },
        { title: "Black Market Auction", text: "A secret auction is being held somewhere in the Ports, offering rare and illegal goods to the highest bidder.", action: "Bid for goods or Infiltrate and steal", fight: "Infiltrate: Control vs Dread d8. Gain random Hack Data Drive.", reward: "+2 Pirates" },
        { title: "Drug Deal Gone Wrong", text: "A major drug deal has gone awry, and the involved parties are now in a violent standoff spilling into the docks.", action: "Mediate the situation", fight: "Roll 2 Dread (d6). Mind needs to roll above both dice. Gain 200 Credits.", reward: "+1 Political Group" }
      ]
    }
  };

  const ZONE_SERVICES = {
    "Cyber Hub": [
      { name: "Virtual Reality Arcade", cost: "20 Credits / hour", desc: "Immerse in alternate realities and simulation runs." },
      { name: "AI Consultation", cost: "60 Credits / session", desc: "Get tactical, social, or business guidance from adaptive models." },
      { name: "Data Recovery", cost: "25 Credits", desc: "Recover corrupted files and encrypted drives." }
    ],
    "Green House": [
      { name: "Eco-Tour Guided Walk", cost: "25 Credits", desc: "Learn rare flora and engineered wildlife patterns." },
      { name: "Botanical Therapy", cost: "40 Credits", desc: "Restore stress with controlled greenhouse treatment." },
      { name: "Sustainable Garden Workshop", cost: "30 Credits", desc: "Craft reusable planting systems and filters." }
    ],
    "Industrial Sector": [
      { name: "Machine Bay Rental", cost: "100 Credits / day", desc: "Lease industrial equipment for fabrication jobs." },
      { name: "Recycling and Disposal", cost: "30 Credits", desc: "Process salvage and hazardous material safely." },
      { name: "Logistics Routing", cost: "50 Credits", desc: "Plan heavy transport lines through unstable sectors." }
    ],
    "Neon City": [
      { name: "Virtual Experience Zone", cost: "30 Credits", desc: "Immersive simulations from noir dreamscapes to combat drills." },
      { name: "Neon Art Installations", cost: "Free / donation", desc: "Interactive city-light galleries and coded performances." },
      { name: "Holographic Concert Hall", cost: "50-500 Credits", desc: "Attend live-shift holo acts and celebrity projections." }
    ],
    "Outskirts": [
      { name: "Salvage and Repair", cost: "10-50 Credits", desc: "Patch armor, tune engines, and rebuild broken tools." },
      { name: "Water Purification", cost: "2 Credits / refill", desc: "Secure clean water for long route travel." },
      { name: "Drone Surveillance Rental", cost: "5 Credits / day", desc: "Lease scouts for route checks and perimeter watch." }
    ],
    "Residential Blocks": [
      { name: "Maintenance Subscription", cost: "20 Credits / month", desc: "Routine support for housing systems and utilities." },
      { name: "Community Access Pass", cost: "75 Credits", desc: "Unlock parks, recreation halls, and district pools." },
      { name: "Tech Upgrades", cost: "20-300 Credits", desc: "Install comfort and security automation packages." }
    ],
    "The Undercity": [
      { name: "Black Market Cybernetics", cost: "100-800 Credits", desc: "Obtain unauthorized cybernetic enhancements and combat augmentations." },
      { name: "Safehouse Rental", cost: "30 Credits / night", desc: "Secure hidden shelter with off-grid amenities." },
      { name: "Contraband Trading Posts", cost: "Entry fee: 10 Credits", desc: "Broker illicit goods through deniable intermediaries." }
    ],
    "The Wastes": [
      { name: "Salvage and Recovery", cost: "30 Credits", desc: "Hire crews to retrieve high-value debris from dead zones." },
      { name: "Guided Expedition", cost: "75 Credits / day", desc: "Traverse dangerous sectors with local route experts." },
      { name: "Makeshift Medical Clinic", cost: "10-200 Credits", desc: "Emergency treatment for trauma, radiation, and burns." }
    ],
    "The Ports": [
      { name: "Ship Dock and Maintenance", cost: "20 Credits / day", desc: "Dock and maintain vessels with harbor-grade tech." },
      { name: "Cyber Augmentation Clinic", cost: "50-500 Credits", desc: "Install neural interfaces and biomech tuning." },
      { name: "Smuggler Night Market", cost: "Entry fee: 5 Credits", desc: "Acquire hard-to-find goods and forbidden parts." }
    ]
  };

  const POWER_SERVICES = {
    "Axiom Cartel": [
      { name: "Corporate Blackline Contract", cost: "120 Credits", desc: "Gain temporary legal immunity and escort clearance." },
      { name: "Executive Defense Package", cost: "200 Credits", desc: "Issue district defense drones for one operation." }
    ],
    "Helix Union": [
      { name: "Genome Forge Suite", cost: "180 Credits", desc: "Biotech enhancements tuned for resilience and speed." },
      { name: "Bio-Loop Recovery", cost: "90 Credits", desc: "Advanced med support that removes one trauma effect." }
    ],
    "Titan Crown": [
      { name: "Iron Militia Draft", cost: "80 Credits", desc: "Hire combat squads to support a skirmish hex." },
      { name: "Siege Logistics", cost: "140 Credits", desc: "Rapid heavy lift and armored transport deployment." }
    ],
    "Veil Runners": [
      { name: "Shadow Courier Net", cost: "60 Credits", desc: "Silent delivery across contested district lines." },
      { name: "Ghost Signal Broker", cost: "40 Credits", desc: "Buy rumors, routes, and skirmish forecasts." }
    ],
    "Dust Saints": [
      { name: "Relic Oracle", cost: "45 Credits", desc: "Trade offerings for hidden event and weather insight." },
      { name: "Ash Ward Rite", cost: "35 Credits", desc: "Gain resistance against one hazardous encounter." }
    ]
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

  function ensureWorldState() {
    if (typeof S === "undefined") return null;
    S.worldThatWas = S.worldThatWas || {};
    const w = S.worldThatWas;
    w.majorPowers = w.majorPowers || MAJOR_POWERS.slice();
    w.factions = w.factions || FACTIONS.slice();
    w.controllers = w.controllers || w.majorPowers.concat(w.factions);
    w.playerAlignedPower = w.playerAlignedPower || safePick(w.majorPowers, MAJOR_POWERS[0]);
    w.hexes = Array.isArray(w.hexes) ? w.hexes : [];
    w.selectedHexId = w.selectedHexId || null;
    w.tick = typeof w.tick === "number" ? w.tick : 0;
    w.markers = w.markers || {};
    w.zones = w.zones || [];
    w.generated = !!w.generated;
    w.landingPads = w.landingPads || [];
    w.currentLandingHexId = w.currentLandingHexId || null;
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

  function zoneAnchors() {
    return [
      { col: 2, row: 2 }, { col: 7, row: 2 }, { col: 12, row: 2 },
      { col: 2, row: 7 }, { col: 7, row: 7 }, { col: 12, row: 7 },
      { col: 2, row: 12 }, { col: 7, row: 12 }, { col: 12, row: 12 }
    ];
  }

  function districtOffsets() {
    return [
      { dc: 0, dr: 0 },
      { dc: 1, dr: 0 },
      { dc: -1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: 0, dr: -1 }
    ];
  }

  function generateWorldThatWasMap() {
    const w = ensureWorldState();
    if (!w) return;

    const anchors = zoneAnchors();
    const offsets = districtOffsets();
    w.hexes = [];
    w.zones = [];

    ZONE_NAMES.forEach((zoneName, zoneIndex) => {
      const districts = DISTRICT_NAMES[zoneName] || ["Core", "North", "South", "East", "West"];
      const anchor = anchors[zoneIndex];
      const zoneHexIds = [];

      offsets.forEach((off, idx) => {
        const narrative = buildDistrictNarrative(zoneName);
        const controller = safePick(w.controllers, w.controllers[0]);
        const hexId = "wtw-" + zoneIndex + "-" + idx;
        const hex = {
          id: hexId,
          zone: zoneName,
          district: districts[idx] || ("District " + (idx + 1)),
          col: anchor.col + off.dc,
          row: anchor.row + off.dr,
          controller: controller,
          skirmish: safeRoll(100) <= 26,
          landingPad: false,
          narrative: narrative
        };
        w.hexes.push(hex);
        zoneHexIds.push(hexId);
      });

      w.zones.push({
        name: zoneName,
        color: ZONE_COLORS[zoneName] || "#8d8d8d",
        hexIds: zoneHexIds,
        baseServices: (ZONE_SERVICES[zoneName] || []).slice(),
        leader: null,
        controlBreakdown: {}
      });
    });

    assignLandingPads();
    updateZoneControl();
    syncWorldMarkers();
    w.generated = true;
    w.tick = 1;
    if (!w.selectedHexId && w.hexes.length) {
      w.selectedHexId = w.hexes[0].id;
    }
    renderWorldThatWas();
  }

  function assignLandingPads() {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;
    w.landingPads = [];
    w.hexes.forEach((hex) => {
      hex.landingPad = false;
    });

    LANDING_ZONE_NAMES.forEach((name, index) => {
      const candidate = w.hexes.find((hex) => hex.zone === name && (hex.district === (DISTRICT_NAMES[name] || [])[0])) || w.hexes[index];
      if (candidate) {
        candidate.landingPad = true;
        w.landingPads.push(candidate.id);
      }
    });

    if (w.landingPads.length) {
      w.currentLandingHexId = safePick(w.landingPads, w.landingPads[0]);
      w.selectedHexId = w.currentLandingHexId;
    }
  }

  function updateZoneControl() {
    const w = ensureWorldState();
    if (!w) return;

    w.zones.forEach((zone) => {
      const counts = {};
      zone.hexIds.forEach((hexId) => {
        const hex = w.hexes.find((h) => h.id === hexId);
        if (!hex) return;
        counts[hex.controller] = (counts[hex.controller] || 0) + 1;
      });
      zone.controlBreakdown = counts;
      let leader = null;
      let topCount = -1;
      Object.keys(counts).forEach((name) => {
        if (counts[name] > topCount) {
          topCount = counts[name];
          leader = name;
        }
      });
      zone.leader = leader || safePick(w.controllers, w.controllers[0]);
    });
  }

  function syncWorldMarkers() {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;
    w.markers = {};

    const pool = w.hexes.slice();
    function takeHex() {
      if (!pool.length) return null;
      const idx = safeRoll(pool.length) - 1;
      return pool.splice(idx, 1)[0];
    }

    const missions = (S.activeMissions || []).slice(0, 6);
    missions.forEach((mission) => {
      const hex = takeHex();
      if (!hex) return;
      w.markers[hex.id] = {
        type: "mission",
        title: mission.title || "Mission",
        subtitle: "Mission marker"
      };
    });

    const holdingQuest = S.holdingQuest || {};
    if (holdingQuest.active || holdingQuest.holdingHex) {
      const stepHex = takeHex();
      if (stepHex) {
        w.markers[stepHex.id] = {
          type: "task",
          title: "Holdings Task",
          subtitle: holdingQuest.active ? "Quest in progress" : "Holdings objective"
        };
      }
    }

    const holding = S.holding || {};
    const crises = Array.isArray(holding.crises) ? holding.crises.slice(0, 3) : [];
    crises.forEach((crisis) => {
      const hex = takeHex();
      if (!hex) return;
      w.markers[hex.id] = {
        type: "task",
        title: "Crisis Task",
        subtitle: (crisis && crisis.title) || "Resolve district crisis"
      };
    });
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

  function renderWorldThatWasMap() {
    const w = ensureWorldState();
    const svg = document.getElementById("wtwMapSvg");
    if (!svg || !w) return;

    if (!w.generated || !w.hexes.length) {
      svg.setAttribute("width", "760");
      svg.setAttribute("height", "560");
      svg.innerHTML = "<text x='380' y='260' text-anchor='middle' font-family='Cinzel,serif' font-size='14' fill='#2f4457'>Generate The World That Was to begin</text>";
      return;
    }

    const svgW = 900;
    const svgH = 760;
    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(svgH));
    svg.innerHTML = "";

    w.hexes.forEach((hex) => {
      const p = hexToPixel(hex.col, hex.row);
      const zone = w.zones.find((z) => z.name === hex.zone);
      const marker = w.markers[hex.id];

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "svg-hex" + (w.selectedHexId === hex.id ? " sel" : ""));

      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", hexPoints(p.x, p.y));
      poly.setAttribute("fill", "rgba(20,28,34,.85)");
      poly.setAttribute("stroke", zone ? zone.color : "#8e8e8e");
      poly.setAttribute("stroke-width", w.selectedHexId === hex.id ? "2.8" : "1.4");
      g.appendChild(poly);

      const owner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      owner.setAttribute("cx", String(p.x));
      owner.setAttribute("cy", String(p.y));
      owner.setAttribute("r", "7");
      owner.setAttribute("fill", controllerColor(hex.controller));
      owner.setAttribute("stroke", "#111");
      owner.setAttribute("stroke-width", "1");
      owner.setAttribute("pointer-events", "none");
      g.appendChild(owner);

      if (hex.skirmish) {
        const sk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sk.setAttribute("x", String(p.x - 14));
        sk.setAttribute("y", String(p.y - 10));
        sk.setAttribute("font-size", "12");
        sk.setAttribute("fill", "#e05050");
        sk.setAttribute("pointer-events", "none");
        sk.textContent = "X";
        g.appendChild(sk);
      }

      if (marker) {
        const mk = document.createElementNS("http://www.w3.org/2000/svg", "text");
        mk.setAttribute("x", String(p.x + 10));
        mk.setAttribute("y", String(p.y - 10));
        mk.setAttribute("font-size", "12");
        mk.setAttribute("fill", marker.type === "mission" ? "#e8c050" : "#46c4b6");
        mk.setAttribute("pointer-events", "none");
        mk.textContent = marker.type === "mission" ? "!" : "T";
        g.appendChild(mk);
      }

      if (hex.landingPad) {
        const lp = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lp.setAttribute("x", String(p.x - 3));
        lp.setAttribute("y", String(p.y + 20));
        lp.setAttribute("font-size", "9");
        lp.setAttribute("fill", "#7ed7ff");
        lp.setAttribute("pointer-events", "none");
        lp.textContent = "LP";
        g.appendChild(lp);
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
    return w.hexes.find((hex) => hex.id === w.selectedHexId) || null;
  }

  function zoneServicesForHex(hex) {
    const w = ensureWorldState();
    const zone = w.zones.find((z) => z.name === hex.zone);
    if (!zone) return [];
    const total = zone.hexIds.length || 1;
    const owned = zone.controlBreakdown[zone.leader] || 0;
    const dominance = owned / total;

    const baseServices = zone.baseServices.slice();
    const powerServices = (POWER_SERVICES[zone.leader] || []).slice();

    if (dominance >= 0.6) {
      return powerServices.concat(baseServices.slice(0, 1));
    }
    return baseServices.concat(powerServices.slice(0, 1));
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
    const zone = w.zones.find((z) => z.name === hex.zone);
    const services = zoneServicesForHex(hex);
    const n = hex.narrative;

    const servicesHtml = services.map((svc) => {
      return "<div class='npc-block' style='margin-bottom:.25rem;'><div class='nb-label'>" + svc.name + "</div><div style='font-size:.78rem;color:var(--muted3);'>Cost: " + svc.cost + "<br>" + svc.desc + "</div></div>";
    }).join("");

    const controlRows = Object.keys(zone.controlBreakdown || {}).map((name) => {
      return "<span style='display:inline-block;margin-right:.4rem;color:" + controllerColor(name) + ";'>" + name + ": " + zone.controlBreakdown[name] + "</span>";
    }).join(" ");

    panel.innerHTML = ""
      + "<div class='hex-info-inner'>"
      + "<div class='hex-type-tag wilderness'>District Hex</div>"
      + "<div class='hex-name'>" + hex.zone + " - " + hex.district + "</div>"
      + "<div class='hex-desc' style='margin-bottom:.45rem;'>Amidst " + n.location + ", the " + n.sight + ", " + n.description + ", serves as a beacon for " + n.feature + ".</div>"
      + "<div class='info-row'><div class='info-cell'><span class='ic-label'>Controller</span>" + hex.controller + "</div><div class='info-cell'><span class='ic-label'>Zone Leader</span>" + (zone.leader || "Unknown") + "</div></div>"
      + "<div class='info-row'><div class='info-cell'><span class='ic-label'>Fauna / Flora</span>" + n.fauna + " / " + n.flora + "</div><div class='info-cell'><span class='ic-label'>Land / Weather</span>" + n.land + " / " + n.weather + "</div></div>"
      + "<div class='mystery-card' style='margin:.45rem 0;'><strong>Random Event:</strong> " + n.event.title + "<br>" + n.event.text + "<br><br><strong>Action:</strong> " + n.event.action + "<br><strong>SERVICES Reward:</strong> " + n.event.fight + " -> " + n.event.reward + "</div>"
      + (marker ? "<div class='npc-block' style='margin-bottom:.45rem;border-color:rgba(201,162,39,.45);background:rgba(201,162,39,.06);'><div class='nb-label'>Marker - " + marker.title + "</div><div style='font-size:.78rem;color:var(--muted3);'>" + marker.subtitle + "</div></div>" : "")
      + (hex.skirmish ? "<div class='npc-block' style='margin-bottom:.45rem;border-color:rgba(224,80,80,.45);background:rgba(224,80,80,.08);'><div class='nb-label' style='color:#e05050;'>Active Skirmish</div><div style='font-size:.78rem;color:var(--muted3);'>Combat rules apply in this district.</div><div style='margin-top:.32rem;display:flex;gap:.3rem;flex-wrap:wrap;'><button class='btn btn-xs btn-red' onclick='openWorldSkirmishCombat()'>Open Combat Tab</button><button class='btn btn-xs btn-teal' onclick='resolveWorldSkirmish()'>Quick Resolve</button></div></div>" : "<div style='font-size:.74rem;color:var(--muted2);margin-bottom:.4rem;'>No active skirmish in this district.</div>")
      + "<div class='sub-label'>District Services</div>"
      + servicesHtml
      + "<div style='margin-top:.5rem;border-top:1px solid var(--border);padding-top:.45rem;font-size:.74rem;color:var(--muted2);'>"
      + "<strong style='color:var(--gold2);'>Control Breakdown:</strong><br>" + controlRows
      + "</div>"
      + "</div>";
  }

  function advanceWorldThatWas() {
    const w = ensureWorldState();
    if (!w || !w.hexes.length) return;

    w.tick += 1;
    const shifts = Math.max(1, safeRoll(3));
    for (let i = 0; i < shifts; i += 1) {
      const target = safePick(w.hexes, null);
      if (!target) break;
      const oldController = target.controller;
      let newController = safePick(w.controllers, oldController);
      let guard = 0;
      while (newController === oldController && guard < 6) {
        newController = safePick(w.controllers, oldController);
        guard += 1;
      }
      target.controller = newController;
      if (safeRoll(100) <= 45) {
        target.skirmish = true;
      }
    }

    w.hexes.forEach((hex) => {
      if (!hex.skirmish && safeRoll(100) <= 8) hex.skirmish = true;
      if (hex.skirmish && safeRoll(100) <= 22) hex.skirmish = false;
    });

    syncWorldMarkers();
    updateZoneControl();
    renderWorldThatWas();
    if (typeof showNotif === "function") {
      showNotif("World control shifted. New skirmishes have erupted.", "good");
    }
  }

  function resolveWorldSkirmish() {
    const w = ensureWorldState();
    const hex = getSelectedHex();
    if (!w || !hex || !hex.skirmish) return;

    const advDie = (S.stats && S.stats.adventure) ? S.stats.adventure : 4;
    const dreadDie = safePick([6, 8, 10], 8);
    const a = (typeof explodingRoll === "function") ? explodingRoll(advDie) : { total: safeRoll(advDie) };
    const d = (typeof explodingRoll === "function") ? explodingRoll(dreadDie) : { total: safeRoll(dreadDie) };
    const success = a.total >= d.total;

    if (success) {
      hex.controller = w.playerAlignedPower;
      hex.skirmish = false;
      if (typeof changeCounter === "function") changeCounter("renown", 1);
      if (typeof rollForLoot === "function") {
        const loot = rollForLoot("medium");
        if (loot && loot.length && typeof showNotif === "function") {
          showNotif("Skirmish won. Loot: " + loot.join(", "), "good");
        }
      } else if (typeof showNotif === "function") {
        showNotif("Skirmish won. Hex control captured.", "good");
      }
    } else if (typeof showNotif === "function") {
      showNotif("Skirmish failed. Enemy control holds.", "warn");
    }

    updateZoneControl();
    renderWorldThatWas();
  }

  function openWorldSkirmishCombat() {
    const hex = getSelectedHex();
    if (!hex) return;
    if (typeof setEnemyDread === "function") {
      setEnemyDread(hex.skirmish ? 8 : 6);
    }
    if (typeof startCombat === "function") {
      startCombat();
    }
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('combat'\"]");
    if (typeof switchTab === "function") {
      switchTab("combat", btn || null);
    }
  }

  function chooseLandingPad() {
    const w = ensureWorldState();
    if (!w || !w.landingPads.length) return;
    w.currentLandingHexId = safePick(w.landingPads, w.landingPads[0]);
    w.selectedHexId = w.currentLandingHexId;
    renderWorldThatWas();
  }

  function returnToGalaxy() {
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('galaxy'\"]");
    if (typeof switchTab === "function") {
      switchTab("galaxy", btn || null);
    }
  }

  function renderWorldThatWas() {
    const w = ensureWorldState();
    if (!w) return;

    const tickEl = document.getElementById("wtwTick");
    const landingEl = document.getElementById("wtwLandingPad");
    if (tickEl) tickEl.textContent = "Cycle " + (w.tick || 0);

    const landingHex = w.hexes.find((hex) => hex.id === w.currentLandingHexId);
    if (landingEl) {
      landingEl.textContent = landingHex ? (landingHex.zone + " - " + landingHex.district) : "Unknown";
    }

    renderWorldThatWasMap();
    renderWorldThatWasInfo();
    renderPowerReadout();
  }

  function renderPowerReadout() {
    const w = ensureWorldState();
    const wrap = document.getElementById("wtwPowerReadout");
    if (!wrap || !w) return;

    const chips = w.controllers.map((name) => {
      let count = 0;
      w.hexes.forEach((hex) => {
        if (hex.controller === name) count += 1;
      });
      return "<span class='sea-chip' style='border-color:" + controllerColor(name) + ";color:" + controllerColor(name) + ";'>" + name + ": " + count + "</span>";
    }).join(" ");

    wrap.innerHTML = chips;
  }

  function mountWorldThatWasPanel() {
    const panel = document.getElementById("tab-worldthatwas");
    if (!panel || panel.dataset.mounted === "1") return;

    panel.dataset.mounted = "1";
    panel.innerHTML = ""
      + "<div class='map-controls'>"
      + "<button class='btn btn-primary' onclick='generateWorldThatWasMap()'>Generate World That Was</button>"
      + "<button class='btn' onclick='advanceWorldThatWas()'>Advance Control Cycle</button>"
      + "<button class='btn btn-sm btn-teal' onclick='chooseWorldLandingPad()'>Random Landing Pad</button>"
      + "<button class='btn btn-sm' onclick='returnWorldToGalaxy()'>Return to Galaxy</button>"
      + "<span style='color:var(--muted2);font-size:.75rem;margin-left:.3rem;'>Current Landing: <strong id='wtwLandingPad' style='color:var(--gold2);'>-</strong></span>"
      + "<span style='color:var(--muted2);font-size:.75rem;margin-left:.5rem;' id='wtwTick'>Cycle 0</span>"
      + "</div>"
      + "<div class='sea-summary' style='margin-bottom:.5rem;'>"
      + "<div class='info-cell'><span class='ic-label'>Major Powers</span>" + MAJOR_POWERS.join(" | ") + "</div>"
      + "<div class='info-cell'><span class='ic-label'>Factions</span>" + FACTIONS.join(" | ") + "</div>"
      + "<div class='info-cell'><span class='ic-label'>Map Rules</span>9 Zones, 5 District Hexes each, dynamic control and skirmishes.</div>"
      + "<div class='info-cell'><span class='ic-label'>Markers</span>Missions and holdings tasks are projected onto district hexes.</div>"
      + "</div>"
      + "<div id='wtwPowerReadout' class='sea-group-list' style='margin-bottom:.45rem;'></div>"
      + "<div class='map-layout'>"
      + "<div class='map-scroll'><svg id='wtwMapSvg' width='760' height='560' xmlns='http://www.w3.org/2000/svg'></svg></div>"
      + "<div class='hex-info' id='wtwInfo'></div>"
      + "</div>";
  }

  function openWorldThatWasFromGalaxy() {
    const w = ensureWorldState();
    if (!w) return;
    mountWorldThatWasPanel();
    if (!w.generated || !w.hexes.length) {
      generateWorldThatWasMap();
    } else {
      chooseLandingPad();
      renderWorldThatWas();
    }
    const btn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('worldthatwas'\"]");
    if (typeof switchTab === "function") {
      switchTab("worldthatwas", btn || null);
    }
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
        const current = S.starSystem.hexes.find((h) => h.id === S.starSystem.currentHexId);
        if (current && current.type === "world_that_was") {
          openWorldThatWasFromGalaxy();
        }
      }
      return out;
    };
  }

  window.generateWorldThatWasMap = generateWorldThatWasMap;
  window.advanceWorldThatWas = advanceWorldThatWas;
  window.resolveWorldSkirmish = resolveWorldSkirmish;
  window.openWorldSkirmishCombat = openWorldSkirmishCombat;
  window.chooseWorldLandingPad = chooseLandingPad;
  window.returnWorldToGalaxy = returnToGalaxy;
  window.mountWorldThatWasPanel = mountWorldThatWasPanel;
  window.openWorldThatWasFromGalaxy = openWorldThatWasFromGalaxy;

  patchTabSwitch();
  patchStarSelection();
})();
