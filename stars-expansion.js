/**
 * BEYOND: THE LIGHT — "The Stars" Expansion (Part I)
 * Adds: Health/Stress rework, Radiation, Vacuum, Injuries, Combat overhaul,
 *       Oracle, Faction Renown, Cosmic shop items, Starship, Date/Time tracking
 */

// ── TABLES ──────────────────────────────────────────────────────────────────

const INJURIES_D20 = [
  'Grazed — Minor cut. No mechanical effect.',
  'Bruised Ribs — −1 to all Body checks this scene.',
  'Sprained Wrist — −1 Strike/Shoot for the scene.',
  'Shallow Stab — Lose 1 Health at the start of each round until treated.',
  'Concussion — Roll Distracted condition.',
  'Ear Rupture — Cannot benefit from teammate bonus this scene.',
  'Fractured Finger — −1 to all Fine Control checks.',
  'Torn Muscle — Step down one Action Die (Body/Strike) for this scene.',
  'Dislocated Shoulder — Cannot use two-handed weapons until treated.',
  'Deep Laceration — Lose d4 Health; treat with Medicine/Doctor.',
  'Cracked Rib — Actions reduced by 1 for the scene.',
  'Partial Blindness (temp) — Step down Shoot die for the scene.',
  'Concussive Blast — Stunned: lose your next Turn.',
  'Punctured Side — At 0 Health after this, roll d6: 1–2 = dead immediately.',
  'Damaged Leg — Movement halved; −1 Action per Turn.',
  'Internal Bleeding — Lose 1 Health per Phase until treated (Doctor).',
  'Fractured Arm — Take the Weakened condition until fully healed.',
  'Nerve Damage — Distracted condition persists until a Long Rest.',
  'Severed Tendon — Permanent: −1 to Strike or Shoot (player\'s choice) until surgically repaired.',
  'Critical — Roll on the Critical Injuries table (d10).',
];

const CRITICAL_INJURIES_D10 = [
  'Crushed Hand — Lose use of one hand permanently unless surgically repaired.',
  'Eye Gouged Out — Permanently −1 to all Shoot rolls.',
  'Broken Spine — Incapacitated; cannot act without aid until treated at a medical facility.',
  'Pierced Lung — Lose 1 Health per Round; death in d4 Rounds without emergency surgery.',
  'Shattered Knee — Speed and Actions permanently halved until repaired.',
  'Traumatic Brain Injury — Roll d4 each scene: 1 = Distracted, 2 = Shaken, 3–4 = Fine.',
  'Severe Burns — All social checks at disadvantage; Body checks for heat resistance at advantage.',
  'Paralyzed Limb — Dominant limb non-functional; −2 to Strike/Shoot until healed.',
  'Organ Damage — Require surgery within 24hrs or die. Doctor check DD12 to stabilize.',
  'Lethal Wound — Unconscious immediately. Dead in d4 Rounds unless allies stabilize (Doctor check DD10).',
];

const STRESS_BUILDUP = [
  { threshold: 3,  label: 'Stressed',      effect: 'Roll a Nervous Tic check when entering social scenes.' },
  { threshold: 10, label: 'Fraying',       effect: 'Take the Shaken condition. Lose 1 TMW per scene start.' },
  { threshold: 15, label: 'Breaking',      effect: 'GM may introduce an involuntary Obsession reaction once per scene.' },
  { threshold: 20, label: 'Breakdown',     effect: 'Incapacitated with dread. Cannot act until calmed (Spirit check DD10 or full Rest).' },
];

const STRESS_REACTIONS = [
  'Freeze — cannot act for 1 Round.',
  'Flee — move to Nearby or further from threat, use 1 Action.',
  'Lash Out — make an uncontrolled Strike against closest target (friend or foe).',
  'Babble — lose ability to communicate clearly for the scene.',
  'Weep — Shaken condition applied.',
  'Dissociate — Distracted condition and lose 1 TMW.',
  'Hallucinate — GM describes a false threat in an adjacent zone.',
  'Catatonic — lose next 2 Turns.',
  'Obsessive Focus — must spend 1 Action each Turn on Obsession topic.',
  'Resilient Surge — recover 2 Stress, then take the Focused condition.',
];

const OBSESSIONS = [
  'Hoarding supplies — must attempt to acquire any item you see.',
  'Constant vigilance — cannot sleep in unfamiliar places without a Spirit check DD8.',
  'Talking to the dead — speak aloud to fallen companions regularly.',
  'Ritual cleanliness — require 1 hour of grooming/cleaning after each scene.',
  'Counting everything — must count objects; distracted if interrupted.',
  'Superstitious behavior — refuse to act on unlucky omens (GM decides what triggers this).',
  'Reckless bravery — always volunteer to go first into danger.',
  'Conspiracy theories — suspect all authority figures of hidden motives.',
  'Seeking oblivion — spend credits on substances; save vs Spirit DD8 or waste d4×10 per scene.',
  'Protection obsession — cannot leave allies behind; refuse to retreat unless all are safe.',
];

const NERVOUS_TICS = [
  'Blinks rapidly when nervous.',
  'Taps fingers in a rhythmic pattern.',
  'Repeats the last word of sentences twice.',
  'Clears throat before making important statements.',
  'Twists a ring or item of jewelry constantly.',
  'Avoids eye contact when lying.',
  'Whistles tunelessly during tense situations.',
  'Cracks knuckles before combat.',
  'Unconsciously mirrors others\' gestures.',
  'Mutters calculations or counts under breath.',
  'Picks at a scar or wound site.',
  'Sniffs the air when uncertain.',
  'Drums feet when sitting.',
  'Abruptly changes subject when uncomfortable.',
  'Laughs at inappropriate moments.',
  'Goes very still and quiet when afraid.',
  'Over-explains things when stressed.',
  'Chews on lip until it bleeds.',
  'Reflexively reaches for a weapon when startled.',
  'Always faces the door in any room.',
];

const ENCOUNTER_REACTIONS_D10 = [
  'Hostile — attacks immediately.',
  'Hostile — demands tribute (if refused, attacks).',
  'Aggressive — threatens and postures; attacks if not backed down (Spirit check DD8).',
  'Suspicious — watches and follows; mood can shift with interaction.',
  'Neutral — ignores you unless provoked.',
  'Neutral — observes from distance; won\'t interfere.',
  'Cautious Friendly — will trade information for safe passage.',
  'Friendly — greets you; willing to talk and trade.',
  'Eager — actively seeks help with a task or problem.',
  'Allied — joins your side for the scene (if circumstances allow).',
];

const ENEMY_ACTIVITY_D6 = [
  'Patrol — moving through the area; will notice you on a Notice check failure.',
  'Ambush — already aware of you; +2 to their first attack this Scene.',
  'Foraging — distracted; you have Surprise if you act first (see below).',
  'Guard Post — stationary; alert. They called for reinforcements 2 rounds ago.',
  'Retreating — fleeing something else. May ignore you or beg for help.',
  'Interrogating — holding an NPC. Distracted; you have Surprise this Scene.',
];

const RADIATION_TIERS = [
  { min: 0,   max: 99,  label: 'Clean',       effect: 'No effect.' },
  { min: 100, max: 199, label: 'Low',          effect: 'Mild nausea. −1 to Body checks.' },
  { min: 200, max: 399, label: 'Moderate',     effect: 'Weakened condition. Lose 1 Health per Phase without treatment.' },
  { min: 400, max: 599, label: 'High',         effect: 'Weakened + Shaken. Lose d4 Health per Phase. Mutations possible.' },
  { min: 600, max: 699, label: 'Severe',       effect: 'Incapacitated outside shelter. Lose d6 Health per Phase.' },
  { min: 700, max: Infinity, label: 'Lethal',  effect: 'Dead in d4 Phases without immediate anti-rad treatment and Doctor.' },
];

const RAD_PENALTY_STATS = ['body', 'strike', 'shoot', 'mind', 'spirit', 'defend', 'control', 'lead'];

const RAD_MUTATION_CHANCE = {
  Clean: 0,
  Low: 5,
  Moderate: 12,
  High: 25,
  Severe: 40,
  Lethal: 60,
};

const RAD_INJURY_CHANCE = {
  Clean: 0,
  Low: 3,
  Moderate: 8,
  High: 18,
  Severe: 30,
  Lethal: 45,
};

const RAD_STAT_PENALTY_CHANCE = {
  Clean: 0,
  Low: 10,
  Moderate: 20,
  High: 35,
  Severe: 50,
  Lethal: 70,
};

const TEAMWORK_EVENTS_D10 = [
  { cost: 2, text: 'Boost — spend 2 TMW to give an ally +1 Action this Turn.' },
  { cost: 2, text: 'Cover Fire — spend 2 TMW to force all enemies to use 1 Action defensively.' },
  { cost: 3, text: 'First Aid — spend 3 TMW to restore d4 Health to one ally.' },
  { cost: 2, text: 'Distract — spend 2 TMW; target enemy uses next Action on decoy.' },
  { cost: 3, text: 'Rally — spend 3 TMW; remove one Negative Condition from an ally.' },
  { cost: 4, text: 'Suppression — spend 4 TMW; all enemy ranged attacks have Disadvantage this Round.' },
  { cost: 3, text: 'Overwatch — spend 3 TMW; react to one enemy move with a free Shoot attack.' },
  { cost: 2, text: 'Coordinate — spend 2 TMW; your next Attack roll uses an Advantage Die.' },
  { cost: 4, text: 'Emergency Shield — spend 4 TMW; reduce incoming damage by 2 Stress (once).' },
  { cost: 5, text: 'All Out Assault — spend 5 TMW; the entire party gains +1 Action this Round.' },
];

const ORACLE_YES_NO = [
  { roll: 1, result: 'No, and…',     detail: 'The answer is No — and something additional goes wrong.' },
  { roll: 2, result: 'No',           detail: 'The answer is No.' },
  { roll: 3, result: 'No, but…',     detail: 'The answer is No — but there is a silver lining.' },
  { roll: 4, result: 'Yes, but…',    detail: 'The answer is Yes — but with a complication.' },
  { roll: 5, result: 'Yes',          detail: 'The answer is Yes.' },
  { roll: 6, result: 'Yes, and…',    detail: 'The answer is Yes — and something extra goes right.' },
];

const ORACLE_OPEN_WORDS = [
  ['Abandon','Accept','Accuse','Achieve','Advance'],       // 1
  ['Bargain','Battle','Betray','Block','Break'],           // 2
  ['Capture','Change','Chase','Claim','Conceal'],          // 3
  ['Damage','Deceive','Defend','Deliver','Destroy'],       // 4
  ['Escape','Examine','Expose','Extract','Endure'],        // 5
  ['Follow','Force','Forget','Fortify','Find'],            // 6
];
const ORACLE_OPEN_SUBJECTS = [
  ['Ally','Artifact','Authority','Archive','Agent'],       // 1
  ['Bargain','Body','Border','Bond','Blueprint'],          // 2
  ['Clan','Cargo','Cipher','Conflict','Channel'],          // 3
  ['Data','Deal','Door','Dread','Domain'],                 // 4
  ['Enemy','Event','Entry','Engine','Evidence'],           // 5
  ['Faction','Frontier','Fragment','Force','Face'],        // 6
];

const FACTION_NAMES = {
  corporations: 'Corporations',
  religious:    'Religious Entities',
  political:    'Political Groups',
  military:     'Military Orders',
  underworld:   'The Underworld',
};

const FACTION_RENOWN_TITLES = [
  { min: -999, max: -6, label: 'Enemy',          desc: 'Kill-on-sight orders from this faction.' },
  { min: -5,   max: -3, label: 'Hostile',         desc: 'Members refuse to deal or cooperate.' },
  { min: -2,   max: -1, label: 'Distrusted',      desc: 'Surly at best; prices doubled.' },
  { min:  0,   max:  0, label: 'Unknown',          desc: 'No standing; neutral interactions.' },
  { min:  1,   max:  2, label: 'Recognized',       desc: 'Acknowledged; basic hospitality.' },
  { min:  3,   max:  5, label: 'Trusted',          desc: 'Access to faction resources and jobs.' },
  { min:  6,   max:  8, label: 'Valued Ally',      desc: 'Discounts, safe houses, information.' },
  { min:  9,   max: 11, label: 'Honored Operative',desc: 'Faction missions, safe extraction, quarter kept.' },
  { min: 12,   max: 999,label: 'Legend',            desc: 'Commands respect; faction leaders seek audience.' },
];

const COSMIC_ESSENTIALS = [
  { name: 'Communicator',    stat: 'Size 1', desc: 'Personal short-range radio. Contact allies within 1 Hex.',          cost: 50  },
  { name: 'Voyager Supplies',stat: 'Size 2', desc: 'Compressed rations and purification tabs. 7 days.',                  cost: 30  },
  { name: 'Oxygen Pellet',   stat: 'Size 1', desc: 'Provides 1 hour of breathable air in vacuum. Single use.',           cost: 40  },
  { name: 'E-Picks',         stat: 'Size 1', desc: 'Electronic lock-picks. Advantage to Control vs electronic locks.',   cost: 80  },
  { name: 'Anti-Rad',        stat: 'Size 1', desc: 'Reduces current Rads by 200. Doctor reduces to zero.',               cost: 120 },
  { name: 'Battery Pack',    stat: 'Size 1', desc: 'Powers energy weapons or devices for 1 scene. Recharge at ports.',   cost: 60  },
  { name: 'Depressant',      stat: 'Size 1', desc: 'Reduces 1 Stress immediately.',                                       cost: 40  },
  { name: 'Stimulant',       stat: 'Size 1', desc: 'Restores 1d4 Health when consumed.',                                  cost: 30  },
  { name: 'Magnetic Boots',  stat: 'Passive',desc: 'Prevents drift in Zero-G. No Action penalty in Zero-G environment.', cost: 200 },
  { name: 'Air Filtration',  stat: 'Passive',desc: 'Helmet filter. Halves Rad gain per Phase in toxic atmospheres.',     cost: 150 },
];

const SPACE_ARMOR = [
  { name: 'RadSuit (Light)',   stat: 'Ad4 | 3 Actions',  desc: 'Lightweight radiation-resistant suit. Halves Rad gain per Phase.', cost: 300 },
  { name: 'RadSuit (Heavy)',   stat: 'Ad8 | 1 Action',   desc: 'Full hazmat protection. Reduces Rad gain to 0 in normal zones.',    cost: 600 },
  { name: 'VaccSuit',          stat: 'Ad6 | 2 Actions',  desc: 'Vacuum-sealed suit. Survive vacuum exposure for up to 1 hour.',     cost: 500 },
  { name: 'Exoskeleton Layer', stat: '+Ad6 Bonus Def',   desc: 'Worn over armor. +Ad6 to Defend rolls. Step-up Advantage.',        cost: 800 },
  { name: 'Thermal Layer',     stat: 'Passive',          desc: 'Worn under armor. Immune to extreme cold; +2 Body in heat.',        cost: 250 },
  { name: 'Coolant Layer',     stat: 'Passive',          desc: 'Worn under armor. Immune to extreme heat; halve fire-damage Stress.',cost: 250 },
  { name: 'HydroSuit',         stat: 'Ad6 | 2 Actions',  desc: 'Sealed suit for toxic or corrosive liquid environments.',           cost: 400 },
];

const EXOCRAFTS = [
  { name: 'Nomad',     logo: '🏕', power: 'Solar/Fuel Cell',   mounts: 2, desc: 'A compact, fast-moving Scout craft. Ideal for planetary surface exploration. Fits 2 crew. Lightly armored.' },
  { name: 'Roamer',    logo: '🌄', power: 'Fuel Cell/Battery', mounts: 3, desc: 'All-terrain medium Exocraft. Reliable workhorse for hostile landscapes. Fits 4 crew. Moderate armor.' },
  { name: 'Colossus',  logo: '🏗', power: 'Fusion Core',       mounts: 6, desc: 'Heavy siege Exocraft. Slow but near-impervious. Fits 6 crew. Full weapon mount suite.' },
  { name: 'Minotaur',  logo: '⚙', power: 'Plasma Core',       mounts: 4, desc: 'Combat Exocraft. Fast and aggressive. Fits 2 crew. Equipped with auto-targeting arrays.' },
  { name: 'Nautilon',  logo: '🌊', power: 'Tidal/Fusion',      mounts: 3, desc: 'Amphibious Exocraft. Excellent in water and light vacuum. Fits 3 crew. Pressurized cabin.' },
];

const STARSHIP_FUEL = [
  { name: 'Standard Fuel',   stat: '1 depleted/week',    desc: 'Standard propulsion fuel. Depletes 1 unit per week of travel. Sold at most Space Hubs.',           cost: 200 },
  { name: 'Hub Jump Fuel',   stat: '+3 weeks travel',    desc: 'Warps the ship to the nearest Space Hub. Adds ~3 weeks of travel time equivalent.',                cost: 500 },
  { name: 'Hyperdrive Core', stat: '1 Hex = 1 Week',     desc: 'Allows Hyperdrive jump. Each Hex of distance = 1 Week of travel. Expensive and rare.',             cost: 1000 },
];

const COMBAT_ZONES_PRESETS = [
  {
    id: 1, name: 'Open Field',
    desc: 'Flat terrain. No natural cover. Favors ranged attackers.',
    hexes: [
      // rows 0-3, cols 0-4. Each entry: {row, col, cover: null|"partial"|"full"}
      {row:0,col:0},{row:0,col:1},{row:0,col:2},{row:0,col:3},{row:0,col:4},
      {row:1,col:0},{row:1,col:1},{row:1,col:2},{row:1,col:3},{row:1,col:4},
      {row:2,col:0},{row:2,col:1},{row:2,col:2},{row:2,col:3},{row:2,col:4},
      {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3},{row:3,col:4},
    ]
  },
  {
    id: 2, name: 'Urban Ruins',
    desc: 'Scattered rubble. Partial cover available in most zones.',
    hexes: [
      {row:0,col:0},{row:0,col:1},{row:0,col:2,cover:'partial'},{row:0,col:3},{row:0,col:4,cover:'partial'},
      {row:1,col:0,cover:'full'},{row:1,col:1},{row:1,col:2},{row:1,col:3,cover:'partial'},{row:1,col:4},
      {row:2,col:0},{row:2,col:1,cover:'partial'},{row:2,col:2,cover:'full'},{row:2,col:3},{row:2,col:4},
      {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3,cover:'partial'},{row:3,col:4,cover:'full'},
    ]
  },
  {
    id: 3, name: 'Forest Clearing',
    desc: 'Dense tree clusters provide full cover. Central clearing is exposed.',
    hexes: [
      {row:0,col:0,cover:'full'},{row:0,col:1,cover:'full'},{row:0,col:2},{row:0,col:3,cover:'full'},{row:0,col:4,cover:'full'},
      {row:1,col:0,cover:'full'},{row:1,col:1,cover:'partial'},{row:1,col:2},{row:1,col:3,cover:'partial'},{row:1,col:4,cover:'full'},
      {row:2,col:0,cover:'full'},{row:2,col:1,cover:'partial'},{row:2,col:2},{row:2,col:3,cover:'partial'},{row:2,col:4,cover:'full'},
      {row:3,col:0,cover:'full'},{row:3,col:1,cover:'full'},{row:3,col:2},{row:3,col:3,cover:'full'},{row:3,col:4,cover:'full'},
    ]
  },
  {
    id: 4, name: 'Starship Corridor',
    desc: 'Narrow cramped passages. Full cover at intersections.',
    hexes: [
      {row:0,col:0,cover:'full'},{row:0,col:1},{row:0,col:2,cover:'full'},{row:0,col:3},{row:0,col:4,cover:'full'},
      {row:1,col:0},{row:1,col:1},{row:1,col:2},{row:1,col:3},{row:1,col:4},
      {row:2,col:0,cover:'full'},{row:2,col:1},{row:2,col:2,cover:'partial'},{row:2,col:3},{row:2,col:4,cover:'full'},
      {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3},{row:3,col:4},
    ]
  },
  {
    id: 5, name: 'Crashed Vessel Hull',
    desc: 'Wreckage provides partial cover almost everywhere.',
    hexes: [
      {row:0,col:0,cover:'partial'},{row:0,col:1},{row:0,col:2,cover:'partial'},{row:0,col:3},{row:0,col:4,cover:'partial'},
      {row:1,col:0},{row:1,col:1,cover:'partial'},{row:1,col:2},{row:1,col:3,cover:'partial'},{row:1,col:4},
      {row:2,col:0,cover:'partial'},{row:2,col:1},{row:2,col:2,cover:'full'},{row:2,col:3},{row:2,col:4,cover:'partial'},
      {row:3,col:0},{row:3,col:1,cover:'partial'},{row:3,col:2},{row:3,col:3,cover:'partial'},{row:3,col:4},
    ]
  },
  {
    id: 6, name: 'Zero-G Debris Field',
    desc: 'Floating debris. Moving costs +1 Action. No stable cover.',
    special: 'zerog',
    hexes: [
      {row:0,col:0},{row:0,col:1,cover:'partial'},{row:0,col:2},{row:0,col:3,cover:'partial'},{row:0,col:4},
      {row:1,col:0,cover:'partial'},{row:1,col:1},{row:1,col:2},{row:1,col:3},{row:1,col:4,cover:'partial'},
      {row:2,col:0},{row:2,col:1},{row:2,col:2,cover:'partial'},{row:2,col:3},{row:2,col:4},
      {row:3,col:0,cover:'partial'},{row:3,col:1},{row:3,col:2},{row:3,col:3,cover:'partial'},{row:3,col:4},
    ]
  },
  {
    id: 7, name: 'Radiation Hot Zone',
    desc: 'Center hexes irradiated. Spending a Turn there costs +d100 Rads.',
    special: 'radiation',
    hexes: [
      {row:0,col:0},{row:0,col:1},{row:0,col:2},{row:0,col:3},{row:0,col:4},
      {row:1,col:0},{row:1,col:1,special:'rad'},{row:1,col:2,special:'rad'},{row:1,col:3,special:'rad'},{row:1,col:4},
      {row:2,col:0},{row:2,col:1,special:'rad'},{row:2,col:2,special:'rad'},{row:2,col:3,special:'rad'},{row:2,col:4},
      {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3},{row:3,col:4},
    ]
  },
  {
    id: 8, name: 'Fortified Bunker',
    desc: 'Heavily fortified. Attackers have almost no cover; defenders have full cover.',
    hexes: [
      {row:0,col:0,cover:'full'},{row:0,col:1,cover:'full'},{row:0,col:2,cover:'full'},{row:0,col:3,cover:'full'},{row:0,col:4,cover:'full'},
      {row:1,col:0,cover:'partial'},{row:1,col:1,cover:'partial'},{row:1,col:2,cover:'partial'},{row:1,col:3,cover:'partial'},{row:1,col:4,cover:'partial'},
      {row:2,col:0},{row:2,col:1},{row:2,col:2},{row:2,col:3},{row:2,col:4},
      {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3},{row:3,col:4},
    ]
  },
];

// ── STATE EXTENSION ──────────────────────────────────────────────────────────

function ensureStarsState() {
  if (!S.health && S.health !== 0) S.health = S.stress || 0;
  if (!S.mentalStress && S.mentalStress !== 0) S.mentalStress = 0;
  if (!S.rads && S.rads !== 0) S.rads = 0;
  S.injuries = S.injuries || [];
  S.nervousTic = S.nervousTic || '';
  S.obsession  = S.obsession  || '';
  S.factionRenown = S.factionRenown || {
    corporations: 0,
    religious:    0,
    political:    0,
    military:     0,
    underworld:   0,
  };
  S.starship = S.starship || {
    fuel:    { standard: 0, hubJump: 0, hyperdrive: 0 },
    shields: 0,
    defendDie: 6,
  };
  S.starSystem = S.starSystem || {
    galaxyType: 'cluster',
    mainStar: 'Smoldering Red Star',
    hexes: [],
    currentHexId: null,
    selectedRing: 'middle',
    tradeRoutes: [],
    majorPowers: [],
    factions: [],
    worldThatWasHexId: null,
    starshipTravelDays: 0,
    radioEventsSeen: {},
    lastRadioEvent: '',
  };
  S.gameDate = S.gameDate || { day: 1, month: 1, year: 1, phase: 0, provinceHexClicks: 0, lastSeaIslandClicks: 0, seededRandom: false, ageEpochYear: null, ageEpochIndex: null };
  if (!S.gameDate.seededRandom) {
    S.gameDate.day = roll(DAYS_PER_MONTH - 1) + 1;
    S.gameDate.month = roll(MONTHS_PER_YEAR - 1) + 1;
    S.gameDate.year = roll(998) + 1;
    S.gameDate.phase = roll(DAY_PHASES.length) - 1;
    S.gameDate.seededRandom = true;
  }
  if (typeof S.gameDate.phase !== 'number') S.gameDate.phase = 0;
  if (typeof S.gameDate.provinceHexClicks !== 'number') S.gameDate.provinceHexClicks = 0;
  if (typeof S.gameDate.lastSeaIslandClicks !== 'number') S.gameDate.lastSeaIslandClicks = 0;
  if (typeof S.gameDate.seededRandom !== 'boolean') S.gameDate.seededRandom = true;
  if (typeof S.gameDate.ageEpochYear !== 'number') S.gameDate.ageEpochYear = S.gameDate.year || 1;
  if (typeof S.gameDate.ageEpochIndex !== 'number') {
    const startAge = S.currentAge || 'green';
    const idx = WORLD_AGE_ORDER.indexOf(startAge);
    S.gameDate.ageEpochIndex = idx >= 0 ? idx : 0;
  }
  if (typeof S.characterYears !== 'number') S.characterYears = getCharacterYearsFromBand(S.age);
  if (!Array.isArray(S.starSystem.hexes)) S.starSystem.hexes = [];
  if (!Array.isArray(S.starSystem.tradeRoutes)) S.starSystem.tradeRoutes = [];
  if (!Array.isArray(S.starSystem.majorPowers)) S.starSystem.majorPowers = [];
  if (!Array.isArray(S.starSystem.factions)) S.starSystem.factions = [];
  if (!S.starSystem.radioEventsSeen || typeof S.starSystem.radioEventsSeen !== 'object') S.starSystem.radioEventsSeen = {};

  if (!S.radiationState) {
    S.radiationState = {
      gainTicks: 0,
      statPenalty: {},
      mutations: [],
    };
  }
  if (typeof S.radiationState.gainTicks !== 'number') S.radiationState.gainTicks = 0;
  if (!S.radiationState.statPenalty || typeof S.radiationState.statPenalty !== 'object') S.radiationState.statPenalty = {};
  if (!Array.isArray(S.radiationState.mutations)) S.radiationState.mutations = [];
  RAD_PENALTY_STATS.forEach((k) => {
    if (typeof S.radiationState.statPenalty[k] !== 'number') S.radiationState.statPenalty[k] = 0;
  });
}

// ── STAR SYSTEM MAP SCAFFOLD ────────────────────────────────────────────────

const STAR_RING_TABLES = {
  inner: ['Peril', 'Space Encounter', 'Locations', 'Dead Moon', 'Uneventful Voyage'],
  middle: ['Mystery', 'Galactic Facility', 'Skirmish', 'Space Encounter', 'Locations', 'Uneventful Voyage'],
  outer: ['Peril', 'Space Encounter', 'Locations', 'Derelict Ship', 'Uneventful Voyage'],
};

const STAR_SIGHTING_COLORS = {
  peril:            { label: 'PERIL', color: '#7f7f7f' },      // Grey
  dead_moon:        { label: 'DEAD MOON', color: '#8b5a2b' },  // Brown
  derelict_ship:    { label: 'DERELICT SHIP', color: '#4a90e2' },
  mystery:          { label: 'MYSTERY', color: '#ff6fb5' },
  facility:         { label: 'GALACTIC FACILITY', color: '#d24c4c' },
  skirmish:         { label: 'SKIRMISH', color: '#8f63d9' },
  encounter:        { label: 'ENCOUNTER', color: '#d8b75a' },
  location:         { label: 'LOCATION', color: '#3f88c5' },
  nothing:          { label: 'NOTHING', color: '#4caf7a' },
  hub:              { label: 'SPACE HUB', color: '#f1f1f1' },
  planet:           { label: 'PLANET', color: '#f2d75a' },
  world_that_was:   { label: 'THE WORLD THAT WAS', color: '#00d0d8' },
  star:             { label: 'MAIN STAR', color: '#ff9a3c' },
};

const STAR_WEATHER = {
  weather: ['ion storms', 'solar static', 'dust tides', 'gravitic waves', 'frozen glare', 'dark-matter squalls'],
  environment: ['void corridors', 'asteroid alleys', 'plasma belts', 'shattered orbits', 'collapsed lanes'],
  wind: ['drifts', 'surges', 'howls', 'rips', 'pulses', 'roars'],
  phenomena: ['magnetic veils', 'charged debris', 'aurora arcs', 'cosmic foam', 'radiant fractures'],
  color: ['emerald', 'violet', 'amber', 'silver', 'crimson', 'azure'],
  wonder: ['a ghost satellite', 'an ancient beacon', 'a living comet', 'a mirrored moon', 'a fractured gate'],
};

const STAR_RADIO_EVENTS = [
  'Distress ping from an abandoned relay station.',
  'Corporate interdiction request at a disputed orbit.',
  'Pirate raid warning on an outer trade lane.',
  'Temple convoy requests armed escort.',
  'Black-market signal offers illegal navigation data.',
  'Colony outbreak alert: quarantine requested.',
  'Wreck recovery contract posted by salvagers.',
  'Skirmish flashpoint brewing near a fuel depot.',
  'Derelict cruiser broadcasts looping code phrase.',
  'Helios farm reports reactor instability.',
  'Smuggler corridor discovered through dead moon cluster.',
  'Faction diplomat requests extraction from hostile station.',
  'Pirate syndicate announces bounty on a corporate captain.',
  'Research habitat goes silent after anomaly spike.',
  'Religious pilgrimage route blocked by raiders.',
  'Unknown signal mapped to The World That Was coordinates.',
  'Military patrol seeks volunteer scouts for perimeter sweep.',
  'Data courier lost in a cosmic weather front.',
  'Civilian transport stranded with failing shields.',
  'Ancient gate signature appears briefly in inner ring.',
];

function starHexDistance(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function starHexRingLabel(dist) {
  if (dist <= 1) return 'inner';
  if (dist === 2) return 'middle';
  return 'outer';
}

function pickStarOutcomeForRing(ring) {
  const table = STAR_RING_TABLES[ring] || STAR_RING_TABLES.middle;
  return table[roll(table.length) - 1];
}

function convertOutcomeToHexType(outcome) {
  const map = {
    'Peril': 'peril',
    'Space Encounter': 'encounter',
    'Locations': 'location',
    'Dead Moon': 'dead_moon',
    'Uneventful Voyage': 'nothing',
    'Mystery': 'mystery',
    'Galactic Facility': 'facility',
    'Skirmish': 'skirmish',
    'Derelict Ship': 'derelict_ship',
  };
  return map[outcome] || 'nothing';
}

function generateStarSystemName() {
  const prefix = ['Star', 'Nova', 'Iron', 'Aether', 'Void', 'Helio', 'Eclipse', 'Starlight'];
  const suffix = ['Frontier', 'Basin', 'Reach', 'Corridor', 'Expanse', 'March', 'Sector', 'Drift'];
  return `${pick(prefix)} ${pick(suffix)}`;
}

function generateMajorPowersAndFactions() {
  const corpNames = ['Axiom Dynamics', 'Crown Meridian', 'Helix Forge', 'Orion Reach Trust'];
  const political = ['Free Orbit Assembly', 'Iron Banner Compact', 'Frontier Civic Bloc'];
  const religious = ['Sunward Covenant', 'Order of the Last Choir', 'Radiant Witness'];
  const factions = ['Dustline Pirates', 'Black Keel Syndicate', 'Vanta Runners', 'Null Saints'];

  return {
    majorPowers: [pick(corpNames), pick(political), pick(religious)],
    factions: [pick(factions), pick(factions.filter(n => n !== factions[0])) || pick(factions)],
  };
}

function generateStarSystemMap(galaxyType) {
  ensureStarsState();
  const type = galaxyType || S.starSystem.galaxyType || 'cluster';
  const center = { q: 0, r: 0 };
  const cells = [];
  let idx = 0;

  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > 3) continue;
      const dist = starHexDistance({ q, r }, center);
      const ring = dist === 0 ? 'core' : starHexRingLabel(dist);
      cells.push({
        id: idx++, q, r, dist, ring,
        type: dist === 0 ? 'star' : 'nothing',
        explored: dist === 0,
        detail: dist === 0 ? 'Central star anchor.' : '',
      });
    }
  }

  const byRing = {
    inner: cells.filter(c => c.ring === 'inner'),
    middle: cells.filter(c => c.ring === 'middle'),
    outer: cells.filter(c => c.ring === 'outer'),
  };

  ['inner', 'middle', 'outer'].forEach((ring) => {
    const pool = [...byRing[ring]];
    if (!pool.length) return;

    const hub = pool.splice(roll(pool.length) - 1, 1)[0];
    hub.type = 'hub';
    hub.detail = `${ring} ring hub controlled by major powers.`;

    for (let i = 0; i < 4 && pool.length; i++) {
      const planet = pool.splice(roll(pool.length) - 1, 1)[0];
      planet.type = 'planet';
      planet.detail = `${ring} ring planet.`;
    }

    pool.forEach((hex) => {
      const outcome = pickStarOutcomeForRing(ring);
      hex.type = convertOutcomeToHexType(outcome);
      hex.detail = `${outcome} detected in ${ring} ring.`;
    });
  });

  const worldPool = [...byRing.middle, ...byRing.outer].filter(h => h.type !== 'hub');
  if (worldPool.length) {
    const target = worldPool[roll(worldPool.length) - 1];
    target.type = 'world_that_was';
    target.detail = 'The World That Was: cyberpunk remnant zone.';
    S.starSystem.worldThatWasHexId = target.id;
  }

  const planetsByRing = ['inner', 'middle', 'outer'].flatMap((ring) => {
    const items = byRing[ring].filter(h => h.type === 'planet').sort((a, b) => Math.atan2(a.r, a.q) - Math.atan2(b.r, b.q));
    const edges = [];
    for (let i = 0; i < items.length - 1; i++) edges.push([items[i].id, items[i + 1].id]);
    return edges;
  });

  const powerSet = generateMajorPowersAndFactions();
  S.starSystem.galaxyType = type;
  S.starSystem.mainStar = pick(['Smoldering Red Star', 'Glowering Orange Star', 'White Dwarf Halo Star']);
  S.starSystem.hexes = cells;
  S.starSystem.tradeRoutes = planetsByRing;
  S.starSystem.currentHexId = S.starSystem.currentHexId == null ? 0 : S.starSystem.currentHexId;
  S.starSystem.majorPowers = powerSet.majorPowers;
  S.starSystem.factions = powerSet.factions;

  renderStarSystemMap();
  updateStarSystemReadouts();
  showNotif(`Generated ${generateStarSystemName()} (${type}) with 37 hexes.`, 'good');
}

function renderStarSystemMap() {
  const host = document.getElementById('starSystemMap');
  if (!host) return;
  ensureStarsState();

  if (!S.starSystem.hexes.length) {
    host.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);">No star system generated yet.</div>';
    return;
  }

  const size = 23;
  const cx = 340;
  const cy = 250;
  const scaleX = size * 1.7;
  const scaleY = size * 1.45;

  const svgHexes = S.starSystem.hexes.map((hex) => {
    const x = cx + hex.q * scaleX + hex.r * (scaleX * 0.5);
    const y = cy + hex.r * scaleY;
    const pts = hexPointsSVG(x, y, size - 2);
    const key = STAR_SIGHTING_COLORS[hex.type] ? hex.type : 'nothing';
    const fill = STAR_SIGHTING_COLORS[key].color;
    const border = hex.id === S.starSystem.currentHexId ? '#ffffff' : '#2d3142';
    const opacity = hex.explored ? 0.9 : 0.55;
    const label = hex.ring === 'core' ? '★' : String(hex.id);
    return `
      <g onclick="selectStarSystemHex(${hex.id})" style="cursor:pointer;">
        <polygon points="${pts}" fill="${fill}" fill-opacity="${opacity}" stroke="${border}" stroke-width="${hex.id === S.starSystem.currentHexId ? 2 : 1}" />
        <text x="${x}" y="${y + 3}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="9" fill="#0f111a">${label}</text>
      </g>`;
  }).join('');

  const routeLines = (S.starSystem.tradeRoutes || []).map(([aId, bId]) => {
    const a = S.starSystem.hexes.find(h => h.id === aId);
    const b = S.starSystem.hexes.find(h => h.id === bId);
    if (!a || !b) return '';
    const ax = cx + a.q * scaleX + a.r * (scaleX * 0.5);
    const ay = cy + a.r * scaleY;
    const bx = cx + b.q * scaleX + b.r * (scaleX * 0.5);
    const by = cy + b.r * scaleY;
    return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="rgba(214,176,70,.45)" stroke-width="1.3" />`;
  }).join('');

  host.innerHTML = `
    <svg width="680" height="500" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:rgba(6,8,16,.55);border:1px solid var(--border);">
      ${routeLines}
      ${svgHexes}
    </svg>`;
}

function selectStarSystemHex(hexId) {
  ensureStarsState();
  S.starSystem.currentHexId = hexId;
  renderStarSystemMap();
  updateStarSystemReadouts();
}

function getCurrentStarHex() {
  ensureStarsState();
  return S.starSystem.hexes.find(h => h.id === S.starSystem.currentHexId) || S.starSystem.hexes[0] || null;
}

function updateStarSystemReadouts() {
  const detail = document.getElementById('starSystemHexDetail');
  const powers = document.getElementById('starSystemPowers');
  const radio = document.getElementById('starSystemRadioLog');
  const current = getCurrentStarHex();

  if (detail) {
    if (!current) detail.textContent = 'No hex selected.';
    else {
      const sig = STAR_SIGHTING_COLORS[current.type] || STAR_SIGHTING_COLORS.nothing;
      detail.innerHTML = `Hex ${current.id} · ${current.ring.toUpperCase()} RING · <span style="color:${sig.color};">${sig.label}</span><br><span style="color:var(--muted2);">${current.detail || 'No detail yet.'}</span>`;
    }
  }
  if (powers) {
    powers.innerHTML = `
      <div style="font-size:.72rem;color:var(--muted2);">Major Powers: ${(S.starSystem.majorPowers || []).join(' · ') || 'TBD'}</div>
      <div style="font-size:.72rem;color:var(--muted2);margin-top:.15rem;">Factions: ${(S.starSystem.factions || []).join(' · ') || 'TBD'}</div>`;
  }
  if (radio) {
    radio.textContent = S.starSystem.lastRadioEvent || 'No monthly radio events yet.';
  }
}

function rollStarSystemExploration() {
  ensureStarsState();
  const ringSel = document.getElementById('starRingSelect');
  const ring = ringSel ? ringSel.value : (S.starSystem.selectedRing || 'middle');
  S.starSystem.selectedRing = ring;

  const table = STAR_RING_TABLES[ring] || STAR_RING_TABLES.middle;
  const d10 = roll(10);
  const idx = (d10 - 1) % table.length;
  const outcome = table[idx];
  const type = convertOutcomeToHexType(outcome);

  const candidates = S.starSystem.hexes.filter(h => h.ring === ring && h.type !== 'hub' && h.type !== 'planet' && h.type !== 'star');
  if (candidates.length) {
    const target = candidates[roll(candidates.length) - 1];
    target.type = type;
    target.detail = `${outcome} generated by exploration roll.`;
    target.explored = true;
    S.starSystem.currentHexId = target.id;
  }

  const out = document.getElementById('starExplorationResult');
  if (out) out.innerHTML = `<span style="color:var(--gold2);">d10=${d10}</span> -> ${ring.toUpperCase()} ring: <strong>${outcome}</strong>`;
  renderStarSystemMap();
  updateStarSystemReadouts();
}

function runSystemAnalysisCheck() {
  ensureStarsState();
  const hex = getCurrentStarHex();
  if (!hex) return;

  const mindDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('mind') : ((S.stats && S.stats.mind) || 4);
  const techDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('control') : ((S.stats && S.stats.control) || 4);
  const die = Math.max(mindDie, techDie);
  const action = explodingRoll(die);
  const dread = explodingRoll(8);
  const success = action.total >= dread.total;

  const el = document.getElementById('starAnalysisResult');
  if (success) {
    hex.explored = true;
    if (!hex.detail) hex.detail = 'System Analysis confirms an unresolved anomaly.';
    if (el) el.innerHTML = `<span style="color:var(--green2);">Success</span>: d${die}=${action.total} vs DD8=${dread.total}. Hex ${hex.id} fully scanned.`;
    if (typeof addSuccessRoll === 'function') addSuccessRoll();
  } else {
    if (el) el.innerHTML = `<span style="color:var(--red2);">Failure</span>: d${die}=${action.total} vs DD8=${dread.total}. Data remains noisy.`;
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
  }
  updateStarSystemReadouts();
  renderStarSystemMap();
}

function rollStarSystemWeather() {
  const weather = pick(STAR_WEATHER.weather);
  const env = pick(STAR_WEATHER.environment);
  const wind = pick(STAR_WEATHER.wind);
  const phenomenon = pick(STAR_WEATHER.phenomena);
  const hue = pick(STAR_WEATHER.color);
  const wonder = pick(STAR_WEATHER.wonder);
  const intensity = roll(6);
  const bold = intensity >= 5;
  const sentence = `Cosmic conditions are marked by ${weather} ${env}. The cosmic winds ${wind} through ${phenomenon} of ${hue} hues. Additionally, while traveling, one can observe ${wonder}.`;

  const el = document.getElementById('starWeatherResult');
  if (el) {
    el.innerHTML = `${sentence}<br><span style="color:${bold ? 'var(--red2)' : 'var(--muted2)'};">Intensity d6=${intensity}${bold ? ' — Control/Drive vs DD6 or +2 Stress.' : ''}</span>`;
  }
}

function rollMonthlyStarRadioEvent() {
  ensureStarsState();
  let d20 = roll(20);
  const seen = S.starSystem.radioEventsSeen || {};
  if (seen[d20]) {
    d20 = d20 % 2 === 0 ? Math.max(1, d20 - 1) : Math.min(20, d20 + 1);
  }
  if (seen[d20]) {
    S.starSystem.lastRadioEvent = `Month is quiet. Event ${d20} already resolved.`;
  } else {
    seen[d20] = true;
    S.starSystem.radioEventsSeen = seen;
    S.starSystem.lastRadioEvent = `Radio Event ${d20}: ${STAR_RADIO_EVENTS[d20 - 1]} (Deadline: 10 Days)`;
  }
  updateStarSystemReadouts();
}

function registerStarshipTravelDays(days) {
  ensureStarsState();
  const n = Math.max(1, parseInt(days, 10) || 1);
  S.starSystem.starshipTravelDays = (S.starSystem.starshipTravelDays || 0) + n;
  advanceDay(n);
  while (S.starSystem.starshipTravelDays >= DAYS_PER_MONTH) {
    S.starSystem.starshipTravelDays -= DAYS_PER_MONTH;
    rollMonthlyStarRadioEvent();
  }
  updateStarSystemReadouts();
}

function getRadPenaltyForStat(statKey) {
  ensureStarsState();
  return Math.max(0, (S.radiationState && S.radiationState.statPenalty && S.radiationState.statPenalty[statKey]) || 0);
}

function clearRadiationStatPenalties() {
  ensureStarsState();
  RAD_PENALTY_STATS.forEach((k) => {
    S.radiationState.statPenalty[k] = 0;
  });
}

function addRadiationMutation() {
  ensureStarsState();
  let mutation = 'Radiation Scarring — strange tissue changes under stress.';
  if (typeof MUTATIONS !== 'undefined' && Array.isArray(MUTATIONS) && MUTATIONS.length) {
    mutation = MUTATIONS[roll(MUTATIONS.length) - 1];
  }

  S.mutation = mutation;
  const fullLabel = '☢ Mutation: ' + mutation;
  S.radiationState.mutations.push(fullLabel);

  if (!Array.isArray(S.extraTraits)) S.extraTraits = [];
  S.extraTraits.push(fullLabel);

  const mutInput = document.getElementById('charMutation');
  if (mutInput) mutInput.value = S.mutation;
  if (typeof renderExtraTraits === 'function') renderExtraTraits();

  showNotif('Radiation surge: new mutation gained.', 'warn');
}

function addRadiationStatPenalty() {
  ensureStarsState();
  const key = RAD_PENALTY_STATS[roll(RAD_PENALTY_STATS.length) - 1];
  S.radiationState.statPenalty[key] = (S.radiationState.statPenalty[key] || 0) + 1;
  if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  showNotif('Radiation penalty: −1 to ' + label + ' rolls.', 'warn');
}

function applyRadiationProgression(beforeRads, afterRads, gain) {
  ensureStarsState();
  if (gain <= 0) return;

  // Every +50 Rads increases immediate strain.
  S.radiationState.gainTicks += gain;
  while (S.radiationState.gainTicks >= 50) {
    S.radiationState.gainTicks -= 50;
    if (typeof changeMentalStress === 'function') changeMentalStress(1);
    if (typeof changeHealth === 'function') changeHealth(1);
    else if (typeof changeStress === 'function') changeStress(1);

    const tier = getRadTier(afterRads);
    if (roll(100) <= (RAD_STAT_PENALTY_CHANCE[tier.label] || 0)) addRadiationStatPenalty();
    if (roll(100) <= (RAD_MUTATION_CHANCE[tier.label] || 0)) addRadiationMutation();
    if (roll(100) <= (RAD_INJURY_CHANCE[tier.label] || 0)) rollInjury();
  }

  // Tier pressure applies negative conditions as exposure climbs.
  if (S.conditions) {
    if (afterRads >= 100) S.conditions.weakened = true;
    if (afterRads >= 200) S.conditions.vulnerable = true;
    if (afterRads >= 300) S.conditions.distracted = true;
    if (afterRads >= 400) S.conditions.shaken = true;
    if (typeof updateConditionButtons === 'function') updateConditionButtons();
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  }

  if (Math.floor(beforeRads / 100) !== Math.floor(afterRads / 100)) {
    showNotif('Radiation tier worsened: exposure side effects intensify.', 'warn');
  }
}

// ── HEALTH FUNCTIONS (renamed from Stress) ────────────────────────────────

function changeHealth(delta) {
  ensureStarsState();
  const defendDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('defend') : (S.stats && S.stats.defend ? S.stats.defend : 4);
  const maxHealth = defendDie * 2;
  S.health = Math.max(0, Math.min(maxHealth, (S.health || 0) + delta));
  S.stress = S.health;
  updateHealthUI();
  if (S.health >= maxHealth) {
    showNotif('Health at maximum — you are incapacitated!', 'warn');
  }
}

function halfHealth() {
  ensureStarsState();
  S.health = Math.floor((S.health || 0) / 2);
  S.stress = S.health;
  updateHealthUI();
  showNotif('Recovery: Health halved.', 'good');
}

function clearHealth() {
  ensureStarsState();
  S.health = 0;
  S.stress = S.health;
  updateHealthUI();
  showNotif('Long Rest: Health fully recovered.', 'good');
}

function updateHealthUI() {
  ensureStarsState();
  const defendDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('defend') : (S.stats && S.stats.defend ? S.stats.defend : 4);
  const maxHealth = defendDie * 2;
  const val = document.getElementById('healthVal');
  const maxVal = document.getElementById('maxHealthVal');
  const pips = document.getElementById('healthPips');
  const coreVal = document.getElementById('stressVal');
  const coreMaxVal = document.getElementById('maxStressVal');
  const corePips = document.getElementById('stressPips');
  S.stress = S.health || 0;
  if (val)    val.textContent    = S.health || 0;
  if (maxVal) maxVal.textContent = maxHealth;
  if (coreVal) coreVal.textContent = S.health || 0;
  if (coreMaxVal) coreMaxVal.textContent = maxHealth;
  if (pips) {
    let html = '';
    for (let i = 0; i < maxHealth; i++) {
      const filled = i < (S.health || 0);
      html += `<div class="pip ${filled ? 'pip-health' : ''}"></div>`;
    }
    pips.innerHTML = html;
  }
  if (corePips) {
    corePips.innerHTML = Array.from({ length: maxHealth }, (_, index) => {
      const filled = index < (S.health || 0) ? ' filled' : '';
      return '<div class="s-pip' + filled + '" onclick="setStress(' + (index + 1) + ')"></div>';
    }).join('');
  }
}

// ── MENTAL STRESS FUNCTIONS ──────────────────────────────────────────────────

function changeMentalStress(delta) {
  ensureStarsState();
  const before = S.mentalStress || 0;
  S.mentalStress = Math.max(0, Math.min(20, before + delta));
  updateMentalStressUI();
  checkStressThreshold();
}

function clearMentalStress() {
  ensureStarsState();
  S.mentalStress = 0;
  updateMentalStressUI();
  showNotif('Stress cleared.', 'good');
}

function checkStressThreshold() {
  let s = S.mentalStress || 0;
  if (!S.mentalStressState) S.mentalStressState = { breakdownLatch: false, breakingObsessionApplied: false };

  if (s >= 10 && S.conditions) {
    S.conditions.shaken = true;
    if (typeof updateConditionButtons === 'function') updateConditionButtons();
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  }

  if (s >= 15 && !S.mentalStressState.breakingObsessionApplied) {
    rollObsession();
    S.mentalStressState.breakingObsessionApplied = true;
    showNotif('Breaking: Obsession takes hold.', 'warn');
  }
  if (s < 15) {
    S.mentalStressState.breakingObsessionApplied = false;
  }

  if (s >= 20 && !S.mentalStressState.breakdownLatch) {
    if (typeof changeTrauma === 'function') changeTrauma(1);
    else {
      S.trauma = Math.max(0, (S.trauma || 0) + 1);
      if (typeof updateTrauma === 'function') updateTrauma();
    }
    S.mentalStress = 3;
    S.mentalStressState.breakdownLatch = true;
    showNotif('Breakdown: +1 Trauma, Mental Stress reset to 3.', 'warn');
    updateMentalStressUI();
    s = S.mentalStress || 0;
  }
  if (s < 20) {
    S.mentalStressState.breakdownLatch = false;
  }

  let tier = null;
  for (let i = STRESS_BUILDUP.length - 1; i >= 0; i--) {
    if (s >= STRESS_BUILDUP[i].threshold) { tier = STRESS_BUILDUP[i]; break; }
  }

  const el = document.getElementById('stressTierDisplay');
  if (el) {
    if (tier) {
      el.innerHTML = `<span style="color:var(--red);font-weight:700;">${tier.label}</span> — ${tier.effect}`;
    } else {
      el.innerHTML = '<span style="color:var(--muted2);">Stable</span>';
    }
  }
}

function updateMentalStressUI() {
  ensureStarsState();
  const s = S.mentalStress || 0;
  const val = document.getElementById('mentalStressVal');
  const pips = document.getElementById('mentalStressPips');
  if (val) val.textContent = s;
  if (pips) {
    let html = '';
    for (let i = 0; i < 20; i++) {
      const filled = i < s;
      let cls = 'pip';
      if (filled) {
        if (s >= 20) cls += ' pip-stress-max';
        else if (s >= 15) cls += ' pip-stress-high';
        else if (s >= 10) cls += ' pip-stress-mid';
        else cls += ' pip-stress-low';
      }
      html += `<div class="${cls}"></div>`;
    }
    pips.innerHTML = html;
  }
  checkStressThreshold();
}

// ── RADIATION FUNCTIONS ───────────────────────────────────────────────────────

function changeRads(delta) {
  ensureStarsState();
  const before = S.rads || 0;
  S.rads = Math.max(0, before + delta);
  const gain = Math.max(0, S.rads - before);
  applyRadiationProgression(before, S.rads, gain);
  if (S.rads === 0) {
    clearRadiationStatPenalties();
    S.radiationState.gainTicks = 0;
    showNotif('Radiation cured: stat roll penalties removed.', 'good');
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  }
  updateRadsUI();
}

function rollRads() {
  ensureStarsState();
  const wearing   = (S.equipment && S.equipment.armor && S.equipment.armor.toLowerCase().includes('radsuit'));
  const airFilter = S.backpack && S.backpack.some && S.backpack.some(b => b && b.toLowerCase().includes('air filtration'));
  if (wearing) {
    showNotif('RadSuit equipped — no Rad gain.', 'good');
    return;
  }
  let gain = roll(100);
  if (airFilter) {
    gain = Math.floor(gain / 2);
    showNotif(`Rad gain: ${gain} (halved by Air Filtration).`, 'warn');
  } else {
    showNotif(`Rad gain: ${gain}.`, 'warn');
  }
  changeRads(gain);
}

function clearRads() {
  ensureStarsState();
  S.rads = 0;
  clearRadiationStatPenalties();
  S.radiationState.gainTicks = 0;
  updateRadsUI();
  showNotif('Radiation cleared to zero. Penalties removed.', 'good');
}

function getRadTier(rads) {
  return RADIATION_TIERS.find(t => rads >= t.min && rads <= t.max) || RADIATION_TIERS[0];
}

function updateRadsUI() {
  ensureStarsState();
  const rads = S.rads || 0;
  const tier = getRadTier(rads);
  const val  = document.getElementById('radsVal');
  const tierEl = document.getElementById('radTierDisplay');
  if (val) val.textContent = rads;
  if (tierEl) {
    const color = rads >= 700 ? 'var(--red)' : rads >= 400 ? 'var(--red2)' : rads >= 200 ? 'var(--gold)' : 'var(--teal)';
    const penalties = RAD_PENALTY_STATS
      .filter((k) => (S.radiationState.statPenalty[k] || 0) > 0)
      .map((k) => `${k}:${S.radiationState.statPenalty[k]}`)
      .join(', ');
    const penaltyLine = penalties
      ? `<div style="font-size:.7rem;color:var(--red2);margin-top:.2rem;">Roll penalties: ${penalties}</div>`
      : '';
    const mutationCount = (S.radiationState.mutations || []).length;
    const mutationLine = mutationCount
      ? `<div style="font-size:.7rem;color:var(--gold2);margin-top:.15rem;">Rad mutations gained: ${mutationCount}</div>`
      : '';
    tierEl.innerHTML = `<span style="color:${color};font-weight:700;">${tier.label}</span> — ${tier.effect}${penaltyLine}${mutationLine}`;
  }
}

// ── INJURY FUNCTIONS ──────────────────────────────────────────────────────────

function rollInjury() {
  ensureStarsState();
  const result = INJURIES_D20[roll(20) - 1];
  let finalResult = result;
  if (result.indexOf('Critical') === 0) {
    finalResult = 'CRITICAL: ' + CRITICAL_INJURIES_D10[roll(10) - 1];
    showNotif(`Critical Injury: ${finalResult.replace('CRITICAL: ', '')}`, 'warn');
  } else {
    showNotif(`Injury: ${finalResult}`, 'warn');
  }
  if (S.injuries.length < 3) {
    S.injuries.push(finalResult);
    updateInjuriesUI();
  } else {
    showNotif('3 Injuries reached — character is DEAD.', 'warn');
  }
  return finalResult;
}

function rollCriticalInjury() {
  ensureStarsState();
  const result = CRITICAL_INJURIES_D10[roll(10) - 1];
  showNotif(`Critical Injury: ${result}`, 'warn');
  if (S.injuries.length < 3) {
    S.injuries.push('CRITICAL: ' + result);
    updateInjuriesUI();
  } else {
    showNotif('3 Injuries reached — character is DEAD.', 'warn');
  }
  return result;
}

function registerIncomingCritical(sourceLabel) {
  const source = sourceLabel || 'Dread Crit';
  showNotif(`${source}: rolling Injury (d20).`, 'warn');
  return rollInjury();
}

function clearInjury(idx) {
  ensureStarsState();
  S.injuries.splice(idx, 1);
  updateInjuriesUI();
}

function updateInjuriesUI() {
  ensureStarsState();
  const el = document.getElementById('injuriesDisplay');
  if (!el) return;
  const injuries = S.injuries || [];
  if (!injuries.length) {
    el.innerHTML = '<div style="font-size:.77rem;color:var(--muted2);">No injuries.</div>';
    return;
  }
  el.innerHTML = injuries.map((inj, i) => `
    <div class="injury-slot ${inj.startsWith('CRITICAL') ? 'injury-critical' : ''}">
      <span>${inj.startsWith('CRITICAL') ? '💀 ' : '🩸 '}</span>
      <span style="flex:1;font-size:.77rem;line-height:1.4;">${inj}</span>
      <button class="btn btn-xs btn-green" onclick="clearInjury(${i})" title="Treat/remove injury">Treat</button>
    </div>
  `).join('');
}

// ── ORACLE FUNCTIONS ──────────────────────────────────────────────────────────

function rollOracleYesNo() {
  const r = roll(6);
  const entry = ORACLE_YES_NO[r - 1];
  const el  = document.getElementById('oracleYesNoResult');
  if (el) {
    el.innerHTML = `
      <div class="oracle-result">
        <div class="oracle-roll">d6 = ${r}</div>
        <div class="oracle-outcome" style="color:${r >= 4 ? 'var(--green2)' : r === 3 ? 'var(--gold)' : 'var(--red2)'};">${entry.result}</div>
        <div class="oracle-detail">${entry.detail}</div>
      </div>`;
  }
}

function rollOracleOpenEnded() {
  const d1 = roll(6);
  const d2 = roll(6);
  const verb    = ORACLE_OPEN_WORDS[d1 - 1][Math.floor(Math.random() * 5)];
  const subject = ORACLE_OPEN_SUBJECTS[d2 - 1][Math.floor(Math.random() * 5)];
  const el = document.getElementById('oracleOpenResult');
  if (el) {
    el.innerHTML = `
      <div class="oracle-result">
        <div class="oracle-roll">d6 = ${d1} &amp; ${d2}</div>
        <div class="oracle-outcome" style="color:var(--gold);">${verb} the ${subject}</div>
        <div class="oracle-detail">Interpret freely — what does this mean for your current scene?</div>
      </div>`;
  }
}

// ── FACTION RENOWN FUNCTIONS ─────────────────────────────────────────────────

function changeFactionRenown(faction, delta) {
  ensureStarsState();
  if (!S.factionRenown[faction] && S.factionRenown[faction] !== 0) return;
  S.factionRenown[faction] = Math.max(-10, Math.min(12, S.factionRenown[faction] + delta));
  updateFactionRenownUI();
}

function getFactionTitle(val) {
  return FACTION_RENOWN_TITLES.find(t => val >= t.min && val <= t.max) || FACTION_RENOWN_TITLES[3];
}

function updateFactionRenownUI() {
  ensureStarsState();
  const el = document.getElementById('factionRenownDisplay');
  if (!el) return;
  el.innerHTML = Object.entries(FACTION_NAMES).map(([key, name]) => {
    const val = S.factionRenown[key] || 0;
    const titleEntry = getFactionTitle(val);
    const color = val > 0 ? 'var(--teal)' : val < 0 ? 'var(--red2)' : 'var(--muted2)';
    return `
      <div class="faction-row">
        <span class="faction-name">${name}</span>
        <div class="faction-controls">
          <button class="step-btn" onclick="changeFactionRenown('${key}', -1)">−</button>
          <span class="counter-val" style="color:${color};min-width:2rem;text-align:center;">${val}</span>
          <button class="step-btn" onclick="changeFactionRenown('${key}', 1)">+</button>
        </div>
        <span class="faction-title" style="color:${color};">${titleEntry.label}</span>
      </div>`;
  }).join('');
}

// ── DATE / TIME FUNCTIONS ────────────────────────────────────────────────────

const DATE_TRAVEL = {
  foot:     { hexPerDay: 3, label: 'Foot' },
  horse:    { hexPerDay: 6, label: 'Horse' },
  boat:     { hexPerDay: 9, label: 'Boat' },
  starship: { hexPerWeek: 1, label: 'Starship' },
};
const DAYS_PER_WEEK  = 5;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAY_PHASES = ['Morning', 'Afternoon', 'Night'];
const SEASON_ORDER = ['spring', 'harvest', 'winter'];
const WORLD_AGE_ORDER = ['green', 'golden', 'grey'];

function getCharacterYearsFromBand(label) {
  const text = String(label || '').toLowerCase();
  if (text.indexOf('twilight') >= 0) return 60;
  if (text.indexOf('endeavor') >= 0) return 30;
  if (text.indexOf('youth') >= 0) return 18;
  return 25;
}

function getCharacterAgeBandFromYears(years) {
  const y = Math.max(0, Number(years) || 0);
  if (y >= 60) return 'Twilight (60-100)';
  if (y >= 30) return 'Endeavor (30-59)';
  return 'Youth (0-29)';
}

function updateCharacterAgeProgressUI() {
  const years = Math.max(0, Number(S.characterYears) || 0);
  const ageText = document.getElementById('charAgeProgress');
  if (ageText) ageText.textContent = `Chronological Age: ${years}`;
}

function syncCharacterAgeFromSelection() {
  ensureStarsState();
  S.characterYears = getCharacterYearsFromBand(S.age);
  updateCharacterAgeProgressUI();
}

function applyYearProgression(yearsPassed) {
  ensureStarsState();
  const years = Math.max(0, parseInt(yearsPassed, 10) || 0);
  if (!years) return;

  const oldSeason = S.currentSeason || 'spring';
  const oldAge = S.currentAge || 'green';

  const currentSeasonIndex = Math.max(0, SEASON_ORDER.indexOf(oldSeason));
  const newSeason = SEASON_ORDER[(currentSeasonIndex + years) % SEASON_ORDER.length];
  S.currentSeason = newSeason;
  if (typeof setSeason === 'function') setSeason(newSeason);

  const yearsSinceEpoch = Math.max(0, (S.gameDate.year || 1) - (S.gameDate.ageEpochYear || 1));
  const worldAgeStep = Math.floor(yearsSinceEpoch / 30);
  const baseIndex = Math.max(0, Math.min(WORLD_AGE_ORDER.length - 1, S.gameDate.ageEpochIndex || 0));
  const nextWorldAge = WORLD_AGE_ORDER[Math.min(WORLD_AGE_ORDER.length - 1, baseIndex + worldAgeStep)] || 'grey';
  S.currentAge = nextWorldAge;
  if (typeof setAge === 'function') setAge(nextWorldAge);

  if (typeof S.characterYears !== 'number') S.characterYears = getCharacterYearsFromBand(S.age);
  const beforeBand = getCharacterAgeBandFromYears(S.characterYears);
  S.characterYears += years;
  const afterBand = getCharacterAgeBandFromYears(S.characterYears);
  S.age = afterBand;
  const ageSelect = document.getElementById('charAge');
  if (ageSelect) ageSelect.value = afterBand;
  updateCharacterAgeProgressUI();

  if (oldSeason !== newSeason) {
    showNotif(`Year advanced: Season is now ${newSeason}.`, 'good');
  }
  if (oldAge !== nextWorldAge) {
    showNotif(`30-year threshold reached: World Age is now ${nextWorldAge}.`, 'warn');
  }
  if (beforeBand !== afterBand) {
    showNotif(`You have aged into ${afterBand}.`, 'warn');
  }
}

function clampPhase(value) {
  const max = DAY_PHASES.length - 1;
  return Math.max(0, Math.min(max, value));
}

function getCurrentPhaseLabel() {
  ensureStarsState();
  return DAY_PHASES[clampPhase(S.gameDate.phase || 0)];
}

function getProvinceTravelClicksPerDay() {
  ensureStarsState();
  return 3;
}

function refreshPhaseFromProvinceClicks() {
  const clicksPerDay = Math.max(3, getProvinceTravelClicksPerDay());
  const clicksPerPhase = Math.max(1, Math.floor(clicksPerDay / DAY_PHASES.length));
  const phase = Math.floor((S.gameDate.provinceHexClicks || 0) / clicksPerPhase);
  S.gameDate.phase = clampPhase(phase);
}

function advanceDay(days, preserveTravelState) {
  ensureStarsState();
  const startYear = S.gameDate.year || 1;
  S.gameDate.day += days;

  while (S.gameDate.day > DAYS_PER_MONTH) {
    S.gameDate.day -= DAYS_PER_MONTH;
    S.gameDate.month++;
  }
  while (S.gameDate.day < 1) {
    S.gameDate.month--;
    S.gameDate.day += DAYS_PER_MONTH;
  }
  while (S.gameDate.month > MONTHS_PER_YEAR) {
    S.gameDate.month -= MONTHS_PER_YEAR;
    S.gameDate.year++;
  }
  while (S.gameDate.month < 1) {
    S.gameDate.year = Math.max(1, (S.gameDate.year || 1) - 1);
    S.gameDate.month += MONTHS_PER_YEAR;
  }

  if (days !== 0 && !preserveTravelState) {
    S.gameDate.phase = 0;
    S.gameDate.provinceHexClicks = 0;
  }

  const endYear = S.gameDate.year || 1;
  if (endYear > startYear) applyYearProgression(endYear - startYear);
  updateDateUI();
}

function registerProvinceHexTravel(hexClicks) {
  ensureStarsState();
  const clicks = Math.max(1, parseInt(hexClicks, 10) || 1);
  const clicksPerDay = Math.max(3, getProvinceTravelClicksPerDay());

  S.gameDate.provinceHexClicks = (S.gameDate.provinceHexClicks || 0) + clicks;

  while (S.gameDate.provinceHexClicks >= clicksPerDay) {
    S.gameDate.provinceHexClicks -= clicksPerDay;
    advanceDay(1, true);
  }

  refreshPhaseFromProvinceClicks();
  updateDateUI();
}

function registerLastSeaHexTravel(hexClicks) {
  ensureStarsState();
  const clicks = Math.max(1, parseInt(hexClicks, 10) || 1);
  advanceDay(clicks * DAYS_PER_WEEK);
}

function registerLastSeaIslandTravel(hexClicks) {
  ensureStarsState();
  const clicks = Math.max(1, parseInt(hexClicks, 10) || 1);
  advanceDay(clicks);
}

function getGameDatePhaseText() {
  ensureStarsState();
  const d = S.gameDate;
  return `Month ${d.month}, Day ${d.day}, Year ${d.year} — ${getCurrentPhaseLabel()}`;
}

function updateDateUI() {
  ensureStarsState();
  updateCharacterAgeProgressUI();
  const el = document.getElementById('gameDateDisplay');
  if (el) {
    const d = S.gameDate;
    el.textContent = `Month ${d.month}, Day ${d.day}, Year ${d.year} — ${getCurrentPhaseLabel()}`;
  }
  const mapEl = document.getElementById('mapTimeDisplay');
  if (mapEl) {
    mapEl.textContent = getGameDatePhaseText();
  }
  const seaEl = document.getElementById('lastSeaTimeDisplay');
  if (seaEl) {
    seaEl.textContent = getGameDatePhaseText();
  }
}

function removeLegacyHealthLabel() {
  const badLabel = 'Health (was Stress)';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    if (current.nodeValue && current.nodeValue.indexOf(badLabel) >= 0) {
      nodes.push(current);
    }
    current = walker.nextNode();
  }
  nodes.forEach(node => {
    node.nodeValue = node.nodeValue.replaceAll(badLabel, 'Health');
  });
}

// ── STARSHIP FUNCTIONS ────────────────────────────────────────────────────────

function changeStarshipFuel(type, delta) {
  ensureStarsState();
  S.starship.fuel[type] = Math.max(0, (S.starship.fuel[type] || 0) + delta);
  updateStarshipUI();
}

function changeShields(delta) {
  ensureStarsState();
  const def = S.starship.defendDie || 6;
  const maxShields = def * 2;
  S.starship.shields = Math.max(0, Math.min(maxShields, (S.starship.shields || 0) + delta));
  updateStarshipUI();
}

function restoreShields() {
  ensureStarsState();
  const def = S.starship.defendDie || 6;
  S.starship.shields = 0;
  updateStarshipUI();
  showNotif('Shields restored at Landing Dock (−100₵).', 'good');
  changeCredits(-100);
}

function updateStarshipUI() {
  ensureStarsState();
  const ship = S.starship;
  const def  = ship.defendDie || 6;
  const maxShields = def * 2;

  const standardEl    = document.getElementById('fuelStandard');
  const hubEl         = document.getElementById('fuelHubJump');
  const hyperEl       = document.getElementById('fuelHyperdrive');
  const shieldsEl     = document.getElementById('shieldsVal');
  const maxShieldsEl  = document.getElementById('maxShieldsVal');
  const shieldDefEl   = document.getElementById('shipDefendDie');

  if (standardEl)   standardEl.textContent   = ship.fuel.standard   || 0;
  if (hubEl)        hubEl.textContent         = ship.fuel.hubJump    || 0;
  if (hyperEl)      hyperEl.textContent       = ship.fuel.hyperdrive || 0;
  if (shieldsEl)    shieldsEl.textContent     = ship.shields         || 0;
  if (maxShieldsEl) maxShieldsEl.textContent  = maxShields;
  if (shieldDefEl)  shieldDefEl.textContent   = `d${def}`;

  const mainStarEl = document.getElementById('starMainStar');
  if (mainStarEl) mainStarEl.textContent = (S.starSystem && S.starSystem.mainStar) ? S.starSystem.mainStar : 'Uncharted';
  updateStarSystemReadouts();
}

function stepShipDefend(dir) {
  ensureStarsState();
  const cur = S.starship.defendDie || 6;
  S.starship.defendDie = dir > 0 ? stepUp(cur) : stepDown(cur);
  updateStarshipUI();
}

// ── COMBAT ZONE HEX MAP ───────────────────────────────────────────────────────

let starsZoneUnits = [];
let starsZoneLayout = null;

function renderStarsCombatZone(layoutId) {
  const container = document.getElementById('starsCombatZoneContainer');
  if (!container) return;
  const layout = COMBAT_ZONES_PRESETS.find(z => z.id === layoutId) || COMBAT_ZONES_PRESETS[0];
  starsZoneLayout = layout;

  const HSIZE = 34;
  const rows  = 4;
  const cols  = 5;
  const W = cols * HSIZE * 1.55 + HSIZE + 10;
  const H = rows * Math.sqrt(3) * HSIZE + HSIZE + 10;

  let svgContent = '';
  layout.hexes.forEach(h => {
    const x = h.col * HSIZE * 1.55 + (h.row % 2 === 1 ? HSIZE * 0.78 : 0) + HSIZE + 5;
    const y = h.row * Math.sqrt(3) * HSIZE * 0.75 + HSIZE * 0.87 + 5;
    const pts = hexPointsSVG(x, y, HSIZE - 2);

    let fill   = '#1a1c2e';
    let stroke = '#2a2c4e';
    let sLabel = '';

    if (h.cover === 'full') {
      fill = '#111111'; stroke = '#444'; sLabel = '⬛';
    } else if (h.cover === 'partial') {
      fill = '#1a2040'; stroke = '#3a5080'; sLabel = '—';
    } else if (h.special === 'rad') {
      fill = '#1a2a10'; stroke = '#4a8020'; sLabel = '☢';
    }

    const unitHere = starsZoneUnits.filter(u => u.row === h.row && u.col === h.col);
    const unitMarks = unitHere.map(u =>
      `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" fill="${u.type === 'ally' ? 'var(--teal)' : 'var(--red2)'}">${u.icon || (u.type === 'ally' ? '◉' : '✕')}</text>`
    ).join('');

    svgContent += `
      <g onclick="starsZoneHexClick(${h.row},${h.col},event)" style="cursor:pointer;">
        <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        ${sLabel ? `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" fill="${stroke}" pointer-events="none">${sLabel}</text>` : ''}
        ${unitMarks}
      </g>`;
  });

  container.innerHTML = `
    <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.35rem;">
      <strong style="color:var(--text);">${layout.name}</strong> — ${layout.desc}
      ${layout.special === 'zerog' ? '<span style="color:var(--teal);"> ⚠ Zero-G: Moving costs +1 Action</span>' : ''}
      ${layout.special === 'radiation' ? '<span style="color:var(--green2);"> ⚠ Rad Zone: +d100 Rads per Turn spent here</span>' : ''}
    </div>
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">
      ${svgContent}
    </svg>
    <div style="font-size:.7rem;color:var(--muted2);margin-top:.3rem;">
      ⬛ Full Cover (cannot be targeted) &nbsp;|&nbsp; — Partial Cover (+1 Defend) &nbsp;|&nbsp; ☢ Rad Zone
    </div>`;
}

function starsZoneHexClick(row, col, evt) {
  // Show a mini menu to place/move a unit
  const existing = starsZoneUnits.findIndex(u => u.row === row && u.col === col);
  if (existing >= 0) {
    starsZoneUnits.splice(existing, 1);
  } else {
    const unitType = document.getElementById('starsUnitType') ? document.getElementById('starsUnitType').value : 'ally';
    const unitName = document.getElementById('starsUnitName') ? document.getElementById('starsUnitName').value : '';
    starsZoneUnits.push({ row, col, type: unitType, name: unitName, icon: unitType === 'ally' ? '◉' : '✕' });
  }
  if (starsZoneLayout) renderStarsCombatZone(starsZoneLayout.id);
}

function hexPointsSVG(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function rollCombatZone() {
  const d10 = roll(10);
  const layoutId = Math.min(d10, 8);
  document.getElementById('zoneRollResult') && (document.getElementById('zoneRollResult').textContent = `d10 = ${d10} → Zone: ${COMBAT_ZONES_PRESETS[layoutId - 1].name}`);
  renderStarsCombatZone(layoutId);
  const sel = document.getElementById('zonePresetSelect');
  if (sel) sel.value = layoutId;
}

function rollCoverPlacement() {
  const d4 = roll(4); // 1-2 = partial, 3-4 = full
  const d20 = roll(20) - 1; // pick a hex index
  const type = d4 <= 2 ? 'partial' : 'full';
  showNotif(`Cover roll: d4=${d4} → ${type} cover at hex index ${d20 + 1}`, 'good');
}

// ── ENCOUNTER HELPERS ─────────────────────────────────────────────────────────

function rollEncounterReaction() {
  const r = roll(10);
  const entry = ENCOUNTER_REACTIONS_D10[r - 1];
  const el = document.getElementById('encounterReactionResult');
  if (el) {
    el.innerHTML = `<div class="roll-badge">d10 = ${r}</div> <strong>${entry}</strong>`;
  }
  showNotif(`Encounter Reaction: ${entry}`, 'good');
}

function rollEnemyActivity() {
  const r = roll(6);
  const entry = ENEMY_ACTIVITY_D6[r - 1];
  const el = document.getElementById('enemyActivityResult');
  if (el) {
    el.innerHTML = `<div class="roll-badge">d6 = ${r}</div> ${entry}`;
  }
}

function rollTeamworkEvent() {
  ensureStarsState();
  const currentTmw = Number(S.tmw || 0);
  const eligible = TEAMWORK_EVENTS_D10.filter((item) => currentTmw >= item.cost);
  const el = document.getElementById('teamworkEventResult');

  if (!eligible.length) {
    if (el) {
      el.innerHTML = '<span style="color:var(--red2);">No Teamwork Events available. You need at least 2 TMW.</span>';
    }
    showNotif('Not enough TMW for any Teamwork Event.', 'warn');
    return;
  }

  const r = roll(eligible.length);
  const entry = eligible[r - 1];
  if (el) {
    el.innerHTML = `<div class="roll-badge">d${eligible.length} = ${r}</div> ${entry.text}<div style="font-size:.72rem;color:var(--muted2);margin-top:.15rem;">Available at your current TMW: ${currentTmw}</div>`;
  }
}

// ── NERVOUS TIC & OBSESSION ───────────────────────────────────────────────────

function rollNervousTic() {
  const tic = NERVOUS_TICS[roll(20) - 1];
  S.nervousTic = tic;
  const el = document.getElementById('nervousTicDisplay');
  if (el) el.textContent = tic;
  // also update character sheet input if present
  const inp = document.getElementById('charNervousTic');
  if (inp) inp.value = tic;
}

function rollObsession() {
  const obs = OBSESSIONS[roll(10) - 1];
  S.obsession = obs;
  const el = document.getElementById('obsessionDisplay');
  if (el) el.textContent = obs;
  const inp = document.getElementById('charObsession');
  if (inp) inp.value = obs;
}

// ── HTML PANEL BUILDERS ───────────────────────────────────────────────────────

function buildStarsCharacterPanels() {
  const resourceTarget = document.getElementById('starsResourceVitalityPanels');
  if (resourceTarget) {
    resourceTarget.innerHTML = `
<div class="card">
  <div class="section-title">Mental Stress &amp; Vitality</div>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">
      <span class="sub-label" style="margin-bottom:0;">Mental Stress <span style="font-size:.62rem;color:var(--muted2);">/ 20</span></span>
      <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1.1rem;">
        <span id="mentalStressVal" style="color:var(--purple);">0</span>
        <span style="color:var(--muted);font-size:.85rem;"> / 20</span>
      </span>
    </div>
    <div style="display:flex;gap:.3rem;margin-bottom:.3rem;">
      <button class="btn btn-sm" style="background:rgba(120,60,160,.15);border-color:var(--purple);" onclick="changeMentalStress(1)">+ Stress</button>
      <button class="btn btn-sm btn-green" onclick="changeMentalStress(-1)">− Stress</button>
      <button class="btn btn-sm btn-teal" onclick="clearMentalStress()">Clear</button>
      <button class="btn btn-sm" onclick="rollStressReaction()">⚄ Reaction</button>
    </div>
    <div class="stress-track" id="mentalStressPips"></div>
    <div style="font-size:.75rem;margin-top:.3rem;" id="stressTierDisplay"><span style="color:var(--muted2);">Stable</span></div>
  </div>

  <div style="margin-top:.55rem;padding-top:.45rem;border-top:1px solid var(--border);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">
      <span class="sub-label" style="margin-bottom:0;">Radiation ☢</span>
      <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1.1rem;color:var(--green2);" id="radsVal">0</span>
    </div>
    <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem;">
      <button class="btn btn-sm" style="background:rgba(40,120,20,.15);border-color:var(--green);" onclick="rollRads()">⚄ Phase Rad Roll (d100)</button>
      <button class="btn btn-sm" onclick="changeRads(50)">+50</button>
      <button class="btn btn-sm btn-teal" onclick="changeRads(-200)" title="Anti-Rad removes 200 Rads">Anti-Rad −200</button>
      <button class="btn btn-sm btn-green" onclick="clearRads()">Doctor Clears</button>
    </div>
    <div style="font-size:.75rem;line-height:1.5;" id="radTierDisplay"><span style="color:var(--muted2);">Clean</span></div>
    <div style="font-size:.7rem;color:var(--muted2);margin-top:.15rem;">Without RadSuit: d100 Rads per Phase in irradiated areas.</div>
  </div>

  <div style="margin-top:.55rem;padding-top:.45rem;border-top:1px solid var(--border);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;">
      <span class="sub-label" style="margin-bottom:0;">Injuries <span style="font-size:.62rem;color:var(--muted2);">(max 3 before death)</span></span>
      <div style="display:flex;gap:.25rem;">
        <button class="btn btn-sm btn-red" onclick="registerIncomingCritical('Incoming Critical')">Apply Incoming Crit</button>
      </div>
    </div>
    <div style="font-size:.72rem;color:var(--muted2);margin-bottom:.25rem;line-height:1.5;">Injuries roll when a Critical hits the Wayfarer (Combat Dread Crit).</div>
    <div id="injuriesDisplay"><div style="font-size:.77rem;color:var(--muted2);">No injuries.</div></div>
  </div>
</div>`;
  }

  const psycheTarget = document.getElementById('starsPsycheProfileAnchor');
  const factionTarget = document.getElementById('starsFactionStandingsAnchor');
  const target = document.getElementById('starsCharPanels');
  if (target) target.innerHTML = '';

  if (psycheTarget) {
    psycheTarget.innerHTML = `
<div style="margin-top:.4rem;padding:.4rem;background:var(--surface);border:1px solid var(--border);">
  <div style="font-family:Cinzel,serif;font-size:.56rem;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin-bottom:.35rem;">Psyche Profile</div>
  <div style="margin-bottom:.35rem;">
    <span class="sub-label">Nervous Tic (d20)</span>
    <div style="display:flex;gap:.3rem;align-items:center;">
      <input type="text" id="charNervousTic" placeholder="Roll your nervous tic…" style="flex:1;" onchange="S.nervousTic=this.value">
      <button class="btn btn-icon btn-sm" onclick="rollNervousTic()">⚄</button>
    </div>
    <div style="font-size:.73rem;color:var(--muted2);margin-top:.2rem;" id="nervousTicDisplay">${S.nervousTic||''}</div>
  </div>
  <div>
    <span class="sub-label">Obsession (d10)</span>
    <div style="display:flex;gap:.3rem;align-items:center;">
      <input type="text" id="charObsession" placeholder="Roll your obsession…" style="flex:1;" onchange="S.obsession=this.value">
      <button class="btn btn-icon btn-sm" onclick="rollObsession()">⚄</button>
    </div>
    <div style="font-size:.73rem;color:var(--muted2);margin-top:.2rem;" id="obsessionDisplay">${S.obsession||''}</div>
  </div>
  <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.35rem;display:flex;justify-content:space-between;align-items:center;gap:.3rem;">
    <span class="sub-label" style="margin-bottom:0;">Stress Reaction</span>
    <button class="btn btn-xs" onclick="rollStressReaction()">⚄ d10</button>
  </div>
  <div id="stressReactionResult" style="font-size:.75rem;color:var(--muted3);margin-top:.25rem;min-height:.9rem;"></div>
</div>`;
  }

  if (factionTarget) {
    factionTarget.innerHTML = `
<div style="font-family:Cinzel,serif;font-size:.56rem;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin-bottom:.35rem;">Faction Standings</div>
<div style="font-size:.73rem;color:var(--muted2);margin-bottom:.4rem;">Completing quests grants +1 with one faction and −1 with another. Range: −10 to +12.</div>
<div id="factionRenownDisplay"></div>`;
  }

  if (!psycheTarget && !factionTarget && target) target.innerHTML = '';
}

function getHighestFactionRenown() {
  ensureStarsState();
  return Object.values(S.factionRenown || {}).reduce((mx, val) => Math.max(mx, Number(val) || 0), 0);
}

function hasHoldingFactionThreshold() {
  return getHighestFactionRenown() >= 9;
}

function tryUnlockHoldingFromFaction() {
  if (!hasHoldingFactionThreshold()) return;
  if (typeof renderHoldingUI === 'function') {
    try { renderHoldingUI(); } catch (err) {}
  }
  if (typeof renderMissionBoard === 'function') {
    try { renderMissionBoard(); } catch (err) {}
  }
}

function patchStarsCrossSystemHooks() {
  const baseSetStress = typeof setStress === 'function' ? setStress : null;
  if (baseSetStress && !window._starsSetStressPatched) {
    window._starsSetStressPatched = true;
    setStress = function(value) {
      const out = baseSetStress.apply(this, arguments);
      S.health = S.stress || 0;
      updateHealthUI();
      return out;
    };
  }

  const baseStartCombat = typeof startCombat === 'function' ? startCombat : null;
  if (baseStartCombat && !window._starsStartCombatPatched) {
    window._starsStartCombatPatched = true;
    startCombat = function() {
      const out = baseStartCombat.apply(this, arguments);
      if ((S.mentalStress || 0) >= 10) {
        S.tmw = Math.max(0, (S.tmw || 0) - 1);
        if (typeof updateTMWPool === 'function') updateTMWPool();
        showNotif('Fraying: -1 TMW at scene start.', 'warn');
      }
      return out;
    };
  }

  const baseRollCheck = typeof rollCheck === 'function' ? rollCheck : null;
  if (baseRollCheck && !window._starsRollCheckPatched) {
    window._starsRollCheckPatched = true;
    rollCheck = function() {
      const beforeCount = (S && Array.isArray(S.injuries)) ? S.injuries.length : 0;
      const out = baseRollCheck.apply(this, arguments);
      const noteEl = document.getElementById('resNote');
      const noteText = noteEl ? String(noteEl.textContent || '') : '';
      if (noteText.indexOf('Dread die exploded') >= 0) {
        registerIncomingCritical('Dread Critical');
      }
      const afterCount = (S && Array.isArray(S.injuries)) ? S.injuries.length : beforeCount;
      if (afterCount > beforeCount) updateInjuriesUI();
      return out;
    };
  }

  const baseResolveMission = typeof resolveMission === 'function' ? resolveMission : null;
  if (baseResolveMission && !window._starsResolveMissionPatched) {
    window._starsResolveMissionPatched = true;
    resolveMission = function(missionId, success) {
      const out = baseResolveMission.apply(this, arguments);
      if (success) tryUnlockHoldingFromFaction();
      return out;
    };
  }
}

function rollStressReaction() {
  const r = roll(10);
  const entry = STRESS_REACTIONS[r - 1];
  const el = document.getElementById('stressReactionResult');
  if (el) el.innerHTML = `<div class="roll-badge">d10 = ${r}</div> ${entry}`;
  showNotif(`Stress Reaction: ${entry}`, 'warn');
}

function buildOraclePanel() {
  const target = document.getElementById('tab-oracle');
  if (!target) return;
  target.innerHTML = `
<div style="max-width:800px;">
  <div class="ship-banner">
    <h3>☽ Oracle</h3>
    <p>Ask the Oracle a direct question (Yes/No) or an open-ended question to find narrative inspiration.</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;margin-top:.85rem;">
    <div class="card">
      <div class="section-title">Yes / No (d6)</div>
      <div style="font-size:.82rem;color:var(--muted3);margin-bottom:.55rem;line-height:1.6;">
        Ask a clear Yes/No question, then roll d6.
      </div>
      <div style="margin-bottom:.5rem;">
        <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.3rem;">Outcomes:</div>
        <div style="font-size:.77rem;color:var(--muted3);line-height:1.7;">
          1 — <strong style="color:var(--red2);">No, and…</strong><br>
          2 — <strong style="color:var(--red);">No</strong><br>
          3 — <strong style="color:var(--gold);">No, but…</strong><br>
          4 — <strong style="color:var(--gold2);">Yes, but…</strong><br>
          5 — <strong style="color:var(--green);">Yes</strong><br>
          6 — <strong style="color:var(--green2);">Yes, and…</strong>
        </div>
      </div>
      <button class="btn btn-primary" onclick="rollOracleYesNo()">⚄ Ask the Oracle</button>
      <div id="oracleYesNoResult" style="margin-top:.5rem;min-height:2rem;"></div>
    </div>
    <div class="card">
      <div class="section-title">Open-Ended (2d6)</div>
      <div style="font-size:.82rem;color:var(--muted3);margin-bottom:.55rem;line-height:1.6;">
        Ask an open question. The Oracle provides a <strong>Verb + Subject</strong> prompt for interpretation.
      </div>
      <div style="margin-bottom:.5rem;">
        <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.2rem;">First d6 = Action Word. Second d6 = Subject.</div>
        <div style="font-size:.7rem;color:var(--muted2);line-height:1.6;">
          1:Abandon/Agency&nbsp; 2:Battle/Bond&nbsp; 3:Chase/Cipher&nbsp;<br>
          4:Damage/Domain&nbsp; 5:Escape/Entry&nbsp; 6:Force/Faction
        </div>
      </div>
      <button class="btn btn-primary" onclick="rollOracleOpenEnded()">⚄ Ask the Oracle</button>
      <div id="oracleOpenResult" style="margin-top:.5rem;min-height:2rem;"></div>
    </div>
  </div>
</div>`;
}

function buildStarshipPanel() {
  const target = document.getElementById('starsStarshipPanel');
  if (!target) return;
  target.innerHTML = `
<div class="card" style="max-width:700px;">
  <div class="section-title">⚡ Starship Systems</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;">
    <div>
      <div class="sub-label">Ship Shields</div>
      <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.25rem;">Threshold = 2× Defend Die. Each hit stepping reduces die.</div>
      <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-bottom:.3rem;">
        <button class="step-btn" onclick="changeShields(-1)">−</button>
        <span style="font-family:'Rajdhani',sans-serif;font-size:1.5rem;font-weight:700;color:var(--teal);" id="shieldsVal">0</span>
        <span style="color:var(--muted);"> / </span>
        <span id="maxShieldsVal" style="color:var(--muted2);">12</span>
        <button class="step-btn" onclick="changeShields(1)">+</button>
      </div>
      <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.25rem;">Ship Defend Die: <span id="shipDefendDie" style="color:var(--teal);">d6</span></div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;">
        <button class="btn btn-xs" onclick="stepShipDefend(-1)">Die ↓</button>
        <button class="btn btn-xs" onclick="stepShipDefend(1)">Die ↑</button>
        <button class="btn btn-xs btn-green" onclick="restoreShields()">Restore (−100₵)</button>
      </div>
      <div style="font-size:.7rem;color:var(--muted2);margin-top:.3rem;">When shields hit threshold: die steps down, +10 Crew Stress. Below d4 = Ship destroyed.</div>
    </div>
    <div>
      <div class="sub-label">Fuel Reserves</div>
      <div style="margin-bottom:.35rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
          <span style="font-size:.78rem;color:var(--text2);">⛽ Standard</span>
          <div style="display:flex;align-items:center;gap:.25rem;">
            <button class="step-btn" onclick="changeStarshipFuel('standard',-1)">−</button>
            <span id="fuelStandard" style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--gold);">0</span>
            <button class="step-btn" onclick="changeStarshipFuel('standard',1)">+</button>
          </div>
        </div>
        <div style="font-size:.7rem;color:var(--muted2);margin-bottom:.4rem;">Depletes 1/week of travel.</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
          <span style="font-size:.78rem;color:var(--text2);">🌐 Hub Jump</span>
          <div style="display:flex;align-items:center;gap:.25rem;">
            <button class="step-btn" onclick="changeStarshipFuel('hubJump',-1)">−</button>
            <span id="fuelHubJump" style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--teal);">0</span>
            <button class="step-btn" onclick="changeStarshipFuel('hubJump',1)">+</button>
          </div>
        </div>
        <div style="font-size:.7rem;color:var(--muted2);margin-bottom:.4rem;">Warps to nearest Space Hub (+3 weeks travel).</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
          <span style="font-size:.78rem;color:var(--text2);">⚡ Hyperdrive</span>
          <div style="display:flex;align-items:center;gap:.25rem;">
            <button class="step-btn" onclick="changeStarshipFuel('hyperdrive',-1)">−</button>
            <span id="fuelHyperdrive" style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--purple);">0</span>
            <button class="step-btn" onclick="changeStarshipFuel('hyperdrive',1)">+</button>
          </div>
        </div>
        <div style="font-size:.7rem;color:var(--muted2);">Immediate jump: 1 Hex = 1 Week.</div>
      </div>
    </div>
  </div>
</div>`;

  target.innerHTML += `
<div class="card" style="max-width:900px;margin-top:.75rem;">
  <div class="section-title">🛰 Star System Map (Scaffold)</div>
  <div style="font-size:.76rem;color:var(--muted2);line-height:1.6;margin-bottom:.45rem;">
    Rings: Inner (6), Middle (12), Outer (18). This scaffold supports ring exploration rolls, system analysis, sightings, trade routes, and monthly starship radio events.
  </div>
  <div style="display:flex;gap:.35rem;flex-wrap:wrap;align-items:center;margin-bottom:.45rem;">
    <select id="starGalaxyType" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.18rem .3rem;font-size:.74rem;">
      <option value="cluster">Cluster</option>
      <option value="spiral">Spiral</option>
      <option value="elliptical">Elliptical</option>
    </select>
    <button class="btn btn-sm btn-teal" onclick="generateStarSystemMap((document.getElementById('starGalaxyType')||{}).value)">Generate Star System</button>
    <span style="font-size:.72rem;color:var(--muted2);">Main Star: <strong id="starMainStar" style="color:var(--gold2);"></strong></span>
  </div>

  <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:.55rem;">
    <div>
      <div id="starSystemMap"></div>
      <div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.4rem;">
        ${Object.entries(STAR_SIGHTING_COLORS).filter(([k]) => k !== 'star').map(([k, v]) => `<span style="font-size:.64rem;padding:.08rem .3rem;border:1px solid var(--border2);color:${v.color};">${v.label}</span>`).join('')}
      </div>
    </div>

    <div>
      <div class="sub-label">Exploration Roll (Ring Table)</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.25rem;">
        <select id="starRingSelect" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.18rem .3rem;font-size:.74rem;">
          <option value="inner">Inner Ring</option>
          <option value="middle" selected>Middle Ring</option>
          <option value="outer">Outer Ring</option>
        </select>
        <button class="btn btn-xs btn-teal" onclick="rollStarSystemExploration()">⚄ Explore (d10)</button>
      </div>
      <div id="starExplorationResult" style="font-size:.75rem;color:var(--muted2);min-height:1rem;margin-bottom:.35rem;"></div>

      <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.25rem;">
        <div class="sub-label">System Analysis (Mind/Control vs DD8)</div>
        <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin:.2rem 0 .25rem 0;">
          <button class="btn btn-xs" onclick="runSystemAnalysisCheck()">Analyze Selected Hex</button>
          <button class="btn btn-xs" onclick="registerStarshipTravelDays(1)">+1 Starship Travel Day</button>
          <button class="btn btn-xs" onclick="registerStarshipTravelDays(5)">+1 Starship Week</button>
        </div>
        <div id="starAnalysisResult" style="font-size:.74rem;color:var(--muted2);min-height:1rem;"></div>
      </div>

      <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.35rem;">
        <div class="sub-label">Cosmic Weather</div>
        <button class="btn btn-xs" onclick="rollStarSystemWeather()">⚄ Roll Cosmic Weather</button>
        <div id="starWeatherResult" style="font-size:.74rem;color:var(--muted2);line-height:1.45;min-height:1rem;margin-top:.2rem;"></div>
      </div>

      <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.35rem;">
        <div class="sub-label">Selected Hex</div>
        <div id="starSystemHexDetail" style="font-size:.74rem;color:var(--muted2);line-height:1.45;min-height:1.6rem;"></div>
      </div>

      <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.35rem;">
        <div class="sub-label">Major Powers & Factions</div>
        <div id="starSystemPowers" style="font-size:.74rem;color:var(--muted2);line-height:1.45;"></div>
      </div>

      <div style="padding-top:.35rem;border-top:1px solid var(--border);margin-top:.35rem;">
        <div class="sub-label">Isolated Travelers Radio</div>
        <button class="btn btn-xs btn-teal" onclick="rollMonthlyStarRadioEvent()">⚄ Force Monthly Radio Roll</button>
        <div id="starSystemRadioLog" style="font-size:.74rem;color:var(--muted2);line-height:1.45;min-height:1rem;margin-top:.2rem;"></div>
      </div>
    </div>
  </div>
</div>`;

  const mainStarEl = document.getElementById('starMainStar');
  if (mainStarEl) mainStarEl.textContent = S.starSystem && S.starSystem.mainStar ? S.starSystem.mainStar : 'Uncharted';
  renderStarSystemMap();
  updateStarSystemReadouts();
}

function buildStarsCombatPanel() {
  const target = document.getElementById('starsZonePanel');
  if (!target) return;
  target.innerHTML = `
<div class="card" style="grid-column:1/-1;">
  <div class="section-title">🌌 Stars Combat — Hex Zone Map</div>
  <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.55rem;align-items:center;">
    <select id="zonePresetSelect" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.2rem .35rem;font-size:.82rem;" onchange="renderStarsCombatZone(parseInt(this.value))">
      ${COMBAT_ZONES_PRESETS.map(z => `<option value="${z.id}">${z.id}. ${z.name}</option>`).join('')}
    </select>
    <button class="btn btn-sm btn-teal" onclick="rollCombatZone()">⚄ Roll Zone (d10)</button>
    <button class="btn btn-sm" onclick="rollCoverPlacement()">⚄ Roll Cover (d4+d20)</button>
    <button class="btn btn-sm btn-red" onclick="starsZoneUnits=[];if(starsZoneLayout)renderStarsCombatZone(starsZoneLayout.id)">Clear Units</button>
    <span id="zoneRollResult" style="font-size:.75rem;color:var(--muted2);"></span>
  </div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap;align-items:center;margin-bottom:.4rem;">
    <select id="starsUnitType" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.15rem .3rem;font-size:.78rem;">
      <option value="ally">Ally / Self</option>
      <option value="enemy">Enemy</option>
    </select>
    <input type="text" id="starsUnitName" placeholder="Unit name (optional)" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.15rem .3rem;font-size:.78rem;width:9rem;">
    <span style="font-size:.72rem;color:var(--muted2);">Click a hex to place/remove unit.</span>
  </div>
  <div id="starsCombatZoneContainer"></div>
</div>

<div class="card">
  <div class="section-title">Encounter Reaction &amp; Activity</div>
  <div style="margin-bottom:.5rem;">
    <span class="sub-label">Encounter Reaction (d10)</span>
    <button class="btn btn-sm btn-teal" onclick="rollEncounterReaction()">⚄ Roll Reaction</button>
    <div id="encounterReactionResult" style="font-size:.82rem;color:var(--muted3);margin-top:.3rem;min-height:1rem;line-height:1.4;"></div>
  </div>
  <div style="margin-bottom:.5rem;padding-top:.4rem;border-top:1px solid var(--border);">
    <span class="sub-label">Enemy Activity (d6)</span>
    <button class="btn btn-sm" onclick="rollEnemyActivity()">⚄ Roll Activity</button>
    <div id="enemyActivityResult" style="font-size:.82rem;color:var(--muted3);margin-top:.3rem;min-height:1rem;line-height:1.4;"></div>
  </div>
  <div style="padding-top:.4rem;border-top:1px solid var(--border);">
    <span class="sub-label">Teamwork Event (d10)</span>
    <button class="btn btn-sm btn-teal" onclick="rollTeamworkEvent()">⚄ Roll TMW Event</button>
    <div id="teamworkEventResult" style="font-size:.82rem;color:var(--muted3);margin-top:.3rem;min-height:1rem;line-height:1.4;"></div>
  </div>
</div>

<div class="card">
  <div class="section-title">Combat Options Reference</div>
  <div style="font-size:.8rem;color:var(--muted3);line-height:1.7;">
    <strong style="color:var(--text);">Standard Attack:</strong> Roll Strike or Shoot vs Dread. Hit = difference in Health (min 1).<br>
    <strong style="color:var(--text);">Heavy Attack:</strong> Costs 2 Actions. Deal +2 Health on hit.<br>
    <strong style="color:var(--text);">Fast Attack:</strong> Costs 1 Action but die steps down.<br>
    <strong style="color:var(--text);">Stance:</strong> Spend 1 Action. Choose Aggressive (+1 Strike, −1 Defend) or Defensive (vice versa).<br>
    <strong style="color:var(--text);">Switch:</strong> Change weapons or spacing for 1 Action.<br>
    <strong style="color:var(--text);">Use Item:</strong> Spend 1 Action to use a readied item.<br>
    <strong style="color:var(--text);">Stand/Help:</strong> Spend 1 Action to help ally (they gain Advantage Die).<br>
    <strong style="color:var(--text);">Moving:</strong> Change zone for 1 Action (Zero-G costs +1 Action).<br>
    <strong style="color:var(--text);">Surprise:</strong> +2 to first round attacks for acting party.<br>
    <strong style="color:var(--text);">Cover:</strong> Partial = +1 Defend. Full = cannot be targeted by ranged.<br>
    <strong style="color:var(--text);">Underwater/Zero-G:</strong> −1 Action per Turn.
  </div>
</div>`;
  // Render default zone
  renderStarsCombatZone(1);
}

function buildDateTimePanel() {
  const target = document.getElementById('starsDatePanel');
  if (!target) return;
  target.innerHTML = `
<div class="card">
  <div class="section-title">📅 Date &amp; Time</div>
  <div style="font-size:.82rem;color:var(--muted3);margin-bottom:.5rem;" id="gameDateDisplay">Day 1, Month 1, Year 1</div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.45rem;">
    <button class="btn btn-sm btn-teal" onclick="advanceDay(1)">+1 Day</button>
    <button class="btn btn-sm" onclick="advanceDay(5)">+1 Week (5 days)</button>
    <button class="btn btn-sm" onclick="advanceDay(30)">+1 Month</button>
    <button class="btn btn-sm btn-red" onclick="advanceDay(-1)">−1 Day</button>
  </div>
  <div style="padding-top:.4rem;border-top:1px solid var(--border);">
    <div class="sub-label">Travel Distances</div>
    <div style="font-size:.77rem;color:var(--muted3);line-height:1.7;">
      🗺 Province: 3 Hex Clicks = 1 Day<br>
      🏝 Last Sea Island: 1 Hex Click = 1 Day<br>
      🚢 Last Sea Open Sea: 1 Hex Click = 1 Week<br>
      📅 1 Week = 5 Days · 1 Month = 30 Days
    </div>
  </div>
</div>`;
}

// ── ADD SHOP DATA ─────────────────────────────────────────────────────────────

function injectStarsShopData() {
  if (typeof SHOP_DATA === 'undefined') return;
  if (!SHOP_DATA.cosmic)      SHOP_DATA.cosmic      = COSMIC_ESSENTIALS;
  if (!SHOP_DATA.space_armor) SHOP_DATA.space_armor = SPACE_ARMOR;
  if (!SHOP_DATA.exocrafts)   SHOP_DATA.exocrafts   = EXOCRAFTS.map(e => ({
    name: e.logo + ' ' + e.name,
    stat: `${e.mounts} Mounts | ${e.power}`,
    desc: e.desc,
    cost: [8000, 12000, 25000, 18000, 15000][EXOCRAFTS.indexOf(e)] || 10000,
  }));
  if (!SHOP_DATA.starship_fuel) SHOP_DATA.starship_fuel = STARSHIP_FUEL;
}

// ── LOAD / SAVE HOOKS ─────────────────────────────────────────────────────────

(function patchStarsLoadSave() {
  const baseLoad = typeof loadCharacter === 'function' ? loadCharacter : null;
  loadCharacter = function() {
    if (baseLoad) baseLoad();
    ensureStarsState();
    updateHealthUI();
    updateMentalStressUI();
    updateRadsUI();
    updateInjuriesUI();
    updateFactionRenownUI();
    updateStarshipUI();
    updateDateUI();
    // sync nervous tic input
    const ticInp = document.getElementById('charNervousTic');
    if (ticInp && S.nervousTic) ticInp.value = S.nervousTic;
    const obsInp = document.getElementById('charObsession');
    if (obsInp && S.obsession) obsInp.value = S.obsession;
  };
})();

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  ensureStarsState();
  injectStarsShopData();
  patchStarsCrossSystemHooks();

  // Build panels
  buildStarsCharacterPanels();
  buildOraclePanel();
  buildStarshipPanel();
  buildStarsCombatPanel();
  buildDateTimePanel();

  // Initial UI sync
  updateHealthUI();
  updateMentalStressUI();
  updateRadsUI();
  updateInjuriesUI();
  updateFactionRenownUI();
  updateStarshipUI();
  updateDateUI();
  removeLegacyHealthLabel();
  if (!S.starSystem || !Array.isArray(S.starSystem.hexes) || !S.starSystem.hexes.length) {
    generateStarSystemMap('cluster');
  } else {
    renderStarSystemMap();
    updateStarSystemReadouts();
  }

  // Add cosmic shop category buttons if shop tabs are present
  const shopCats = document.querySelector('.shop-cats');
  if (shopCats) {
    const categories = [
      { id: 'cosmic',       icon: '🌌', label: 'Cosmic' },
      { id: 'space_armor',  icon: '🧑‍🚀', label: 'Space Armor' },
      { id: 'exocrafts',    icon: '🤖', label: 'Exocrafts' },
      { id: 'starship_fuel',icon: '⛽', label: 'Starship Fuel' },
    ];
    categories.forEach(cat => {
      if (!document.querySelector(`.scat[onclick*="${cat.id}"]`)) {
        const btn = document.createElement('button');
        btn.className = 'scat';
        btn.innerHTML = `${cat.icon} ${cat.label}`;
        btn.setAttribute('onclick', `showShopCat('${cat.id}',this)`);
        shopCats.appendChild(btn);
      }
    });
  }

  // Add Space context button if not present
  const ctxBar = document.querySelector('.ctx-bar');
  if (ctxBar && !document.querySelector('.ctx-btn[onclick*="space"]')) {
    const spaceBtn = document.createElement('button');
    spaceBtn.className = 'ctx-btn';
    spaceBtn.innerHTML = '🚀 Space';
    spaceBtn.setAttribute('onclick', "setContext('space',this)");
    ctxBar.appendChild(spaceBtn);
  }

  // Add Oracle nav tab if not present
  const nav = document.querySelector('nav');
  if (nav && !document.querySelector('.tab-btn[onclick*="oracle"]')) {
    const oracleBtn = document.createElement('button');
    oracleBtn.className = 'tab-btn';
    oracleBtn.innerHTML = '☽ Oracle';
    oracleBtn.setAttribute('onclick', "switchTab('oracle',this)");
    nav.appendChild(oracleBtn);
  }

  renderStarsCombatZone(1);
});

window.getHighestFactionRenown = getHighestFactionRenown;
window.hasHoldingFactionThreshold = hasHoldingFactionThreshold;
window.getProvinceTravelClicksPerDay = getProvinceTravelClicksPerDay;
window.registerProvinceHexTravel = registerProvinceHexTravel;
window.registerLastSeaHexTravel = registerLastSeaHexTravel;
window.registerLastSeaIslandTravel = registerLastSeaIslandTravel;
window.getGameDatePhaseText = getGameDatePhaseText;
