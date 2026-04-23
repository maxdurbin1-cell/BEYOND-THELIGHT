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
  S.gameDate = S.gameDate || { day: 1, month: 1, year: 1, phase: 0, provinceHexClicks: 0, lastSeaIslandClicks: 0, seededRandom: false };
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
  S.rads = Math.max(0, (S.rads || 0) + delta);
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
  updateRadsUI();
  showNotif('Radiation cleared to zero.', 'good');
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
    tierEl.innerHTML = `<span style="color:${color};font-weight:700;">${tier.label}</span> — ${tier.effect}`;
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

  const target = document.getElementById('starsCharPanels');
  if (!target) return;
  target.innerHTML = `
<div class="card">
  <div class="section-title">Psyche Profile</div>
  <div style="margin-bottom:.5rem;">
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
  <div style="padding-top:.45rem;border-top:1px solid var(--border);margin-top:.45rem;">
    <div class="sub-label">Stress Reaction (Roll When Needed)</div>
    <button class="btn btn-sm" onclick="rollStressReaction()">⚄ Roll d10 Reaction</button>
    <div id="stressReactionResult" style="font-size:.8rem;color:var(--muted3);margin-top:.3rem;min-height:1rem;"></div>
  </div>
</div>

<!-- FACTION RENOWN -->
<div class="card" style="grid-column:1/-1;">
  <div class="section-title">Faction Standings</div>
  <div style="font-size:.75rem;color:var(--muted2);margin-bottom:.5rem;">Completing quests grants +1 with one faction and −1 with another. Range: −10 to +12.</div>
  <div id="factionRenownDisplay"></div>
</div>`;
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
