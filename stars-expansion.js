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

const ORACLE_SILVER_LININGS = [
  'However, an opportunity presents itself.',
  'But ultimately, fortune smiles on persistence.',
  'Yet a hidden path remains open.',
  'Still, a trusted ally offers assistance.',
  'Nevertheless, the worst is avoided.',
  'But a clue surfaces to guide you forward.',
  'Though the cost is higher than expected, success remains possible.',
  'Yet one unexpected advantage comes to light.',
  'But time remains to change course.',
  'Though difficult, a solution exists.',
  'Still, a powerful secret emerges.',
  'Yet old friends surface to help.',
  'But fate leaves one card unplayed.',
  'Though constrained, freedom exists in small choices.',
  'Still, wisdom can prevent greater harm.',
];

const ORACLE_POSITIVE_TURNS = [
  'It holds credits, supplies, or another immediate advantage.',
  'Someone helpful arrives with the right tool or rumor.',
  'The opening is real, and it leads to better leverage than expected.',
  'You also gain a clean escape route once the scene shifts.',
  'The answer comes with loot, salvage, or a paying opportunity attached.',
  'A rival stumbles at the same moment, giving you room to act first.',
  'The discovery includes a clue, cache, or contact worth keeping.',
  'The result improves your position with a faction or major power.',
  'The scene breaks in your favor and leaves behind something valuable.',
  'Momentum builds and the next obstacle looks weaker than it did before.',
];

const ORACLE_NEGATIVE_TURNS = [
  'It costs time, draws attention, or leaves you exposed.',
  'Something useful is lost, spent, or damaged in the process.',
  'A threat notices you and starts moving in.',
  'The answer closes one path and forces a harsher route.',
  'It leaves a stain on trust, reputation, or leverage.',
  'The failure creates pressure that will matter in the next scene.',
  'There is no safety in it, only a narrower margin for survival.',
  'Whoever benefits from this will ask for payment later.',
];

const ORACLE_COMPLICATIONS = [
  'However, an enemy grows impatient.',
  'But the cost is higher than anticipated.',
  'Yet time pressure increases.',
  'Still, unwanted attention draws near.',
  'However, a trusted ally becomes unreliable.',
  'But a new threat emerges.',
  'Yet resources dwindle faster than expected.',
  'Still, an old enemy reappears.',
  'However, collateral damage is unavoidable.',
  'But the victory is pyrrhic.',
  'Yet future troubles are seeded.',
  'Still, one price must be paid.',
  'However, trust is fractured.',
  'But the burden falls on unprepared shoulders.',
  'Yet the solution brings new problems.',
];

const ORACLE_OPEN_WORDS = [
  ['Abandon', 'Awaken', 'Alter', 'Assemble', 'Advance'],
  ['Battle', 'Bargain', 'Build', 'Break', 'Bind'],
  ['Chase', 'Chart', 'Cleanse', 'Conceal', 'Create'],
  ['Damage', 'Decode', 'Defend', 'Deliver', 'Discover'],
  ['Escape', 'Endure', 'Expose', 'Extract', 'Empower'],
  ['Force', 'Forge', 'Follow', 'Free', 'Fortify'],
];

const ORACLE_OPEN_SUBJECTS = [
  ['Agency', 'Ally', 'Artifact', 'Archive', 'Anomaly'],
  ['Bond', 'Beacon', 'Barrier', 'Broker', 'Blueprint'],
  ['Cipher', 'Caravan', 'Council', 'Core', 'Crew'],
  ['Domain', 'Derelict', 'Dock', 'Data', 'Debtor'],
  ['Entry', 'Engine', 'Envoy', 'Evidence', 'Expedition'],
  ['Faction', 'Fleet', 'Frontier', 'Fuel', 'Future'],
];


const FACTION_NAMES = {
  corporations: 'Corporations',
  religious:    'Religious Entities',
  political:    'Political Groups',
  military:     'Military Orders',
  rebels:       'Rebel Faction',
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
    rebels:       0,
    underworld:   0,
  };
  Object.keys(FACTION_NAMES).forEach((key) => {
    if (typeof S.factionRenown[key] !== 'number') S.factionRenown[key] = 0;
  });
  S.starship = S.starship || {
    fuel:    { standard: 0, hubJump: 0, hyperdrive: 0 },
    shields: 0,
    defendDie: 6,
  };
  S.exocraftBay = S.exocraftBay || {
    owned: [],
    active: '',
    cargo: ['', '', '', '', '', ''],
  };
  S.starSystem = S.starSystem || {
    galaxyType: 'cluster',
    mainStar: 'Smoldering Red Star',
    hexes: [],
    currentHexId: null,
    galaxyGenerated: false,
    selectedRing: 'middle',
    tradeRoutes: [],
    majorPowers: [],
    factions: [],
    worldThatWasHexId: null,
    starshipTravelDays: 0,
    radioEventsSeen: {},
    lastRadioEvent: '',
    generatedName: '',
    activeFacility: null,
    activeHub: null,
    activeMystery: null,
    activeDeadMoon: null,
    activeDeadMoonMap: null,
    activeDerelict: null,
    activeTask: null,
    royalShipLog: [],
    activePlanetHexId: null,
    planetExplorationByHex: {},
  };
  S.spaceNaval = S.spaceNaval || null;
  S.seaNaval = S.seaNaval || null;
  if (!Array.isArray(S.starship.cargo)) S.starship.cargo = [];
  if (!Array.isArray(S.exocraftBay.owned)) S.exocraftBay.owned = [];
  if (!Array.isArray(S.exocraftBay.cargo)) S.exocraftBay.cargo = ['', '', '', '', '', ''];
  if (typeof S.exocraftBay.active !== 'string') S.exocraftBay.active = '';
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
  if (!S.starSystem.activeFacility) S.starSystem.activeFacility = null;
  if (!S.starSystem.activeHub) S.starSystem.activeHub = null;
  if (!S.starSystem.activeMystery) S.starSystem.activeMystery = null;
  if (!S.starSystem.activeDeadMoon) S.starSystem.activeDeadMoon = null;
  if (!S.starSystem.activeDeadMoonMap) S.starSystem.activeDeadMoonMap = null;
  if (!S.starSystem.activeDerelict) S.starSystem.activeDerelict = null;
  if (!S.starSystem.activeSpaceEncounter) S.starSystem.activeSpaceEncounter = null;
  if (!S.starSystem.activeTask) S.starSystem.activeTask = null;
  if (!Array.isArray(S.starSystem.royalShipLog)) S.starSystem.royalShipLog = [];
  if (typeof S.starSystem.activePlanetHexId !== 'number') S.starSystem.activePlanetHexId = null;
  if (!S.starSystem.planetExplorationByHex || typeof S.starSystem.planetExplorationByHex !== 'object') S.starSystem.planetExplorationByHex = {};
  if (typeof S.starSystem.galaxyGenerated !== 'boolean') S.starSystem.galaxyGenerated = false;
  if (!S.starSystem.currentWeather || typeof S.starSystem.currentWeather !== 'object') S.starSystem.currentWeather = null;
  if (!Array.isArray(S.starSystem.radioTaskMarkers)) S.starSystem.radioTaskMarkers = [];
  if (!Array.isArray(S.starSystem.taskMarkers)) S.starSystem.taskMarkers = [];
  if (typeof S.starSystem.empoweredChecks !== 'number') S.starSystem.empoweredChecks = 0;

  if ((!S.starSystem.hexes || !S.starSystem.hexes.length) && window._lastGeneratedGalaxy && window._lastGeneratedGalaxy.hexes && window._lastGeneratedGalaxy.hexes.length) {
    S.starSystem = cloneStarsData(window._lastGeneratedGalaxy);
  }

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

function cloneStarsData(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function syncSpaceCombatStateFromNaval() {
  ensureStarsState();
  if ((window._activeContext || S._navalContext) !== 'space') return;
  if (!S.naval || !S.naval.ship) return;
  S.starship.defendDie = S.naval.ship.hullDie || S.starship.defendDie || 6;
  S.starship.shields = S.naval.ship.stress || 0;
  if (Array.isArray(S.naval.ship.cargo)) S.starship.cargo = S.naval.ship.cargo;
}

function syncNavalCombatStateFromStarship() {
  ensureStarsState();
  if ((window._activeContext || S._navalContext) !== 'space') return;
  if (!S.naval || !S.naval.ship) return;
  S.naval.ship.hullDie = S.starship.defendDie || S.naval.ship.hullDie || 6;
  S.naval.ship.stress = S.starship.shields || 0;
  if (Array.isArray(S.starship.cargo)) S.naval.ship.cargo = S.starship.cargo;
}

function applySpaceNavalPresentation() {
  const navalTab = document.getElementById('tab-naval');
  if (!navalTab) return;
  const inSpace = (window._activeContext || S._navalContext) === 'space';
  const tabBtn = document.querySelector('.tab-btn.ctx-space[onclick*="naval"]');
  if (tabBtn) tabBtn.textContent = inSpace ? 'Starship' : 'Ship';
  if (!inSpace) {
    const existing = document.getElementById('starsSpaceNavalCard');
    if (existing) existing.remove();
    return;
  }

  const bannerTitle = navalTab.querySelector('.ship-banner h3');
  const bannerBody = navalTab.querySelector('.ship-banner p');
  if (bannerTitle) bannerTitle.textContent = 'Starship System';
  if (bannerBody) {
    bannerBody.textContent = 'Acquire a starship, crew its bridge, and run void combat with captain, gunner, navigator, and engineer actions. Hull Stress matches the Starship shields track and fuel reserves stay synced to the Space panels.';
  }

  const sectionTitles = navalTab.querySelectorAll('.section-title');
  if (sectionTitles[0]) sectionTitles[0].textContent = 'Starport';
  if (sectionTitles[1]) sectionTitles[1].textContent = 'Hire Void Crew';
  if (sectionTitles[2]) sectionTitles[2].textContent = 'Starship Combat';
  if (sectionTitles[3]) sectionTitles[3].textContent = 'Starship Callsign';
  if (sectionTitles[4]) sectionTitles[4].textContent = 'Starship Cargo';

  navalTab.querySelectorAll('.info-cell .ic-label').forEach(label => {
    if (label.textContent === 'Zone') label.textContent = 'Range Band';
  });
  navalTab.querySelectorAll('.sub-label').forEach(label => {
    if (label.textContent === 'Enemy Ship') label.textContent = 'Hostile Vessel';
  });
  navalTab.querySelectorAll('button').forEach(button => {
    const text = button.textContent.trim();
    if (text === 'Roll Ship Identity') button.textContent = 'Roll Starship Identity';
    if (text === 'Full Drydock Repair') button.textContent = 'Full Dock Refit';
    if (text === 'Spawn Enemy') button.textContent = 'Spawn Hostile Vessel';
    if (text === 'Start / Reset Combat') button.textContent = 'Start / Reset Engagement';
    if (text === 'Fire Cannons') button.textContent = 'Fire Batteries';
    if (text === 'Loose Crossbows') button.textContent = 'Launch Volley';
    if (text === 'Engineer Repair') button.textContent = 'Patch Shields';
    if (text === 'Enemy Attack') button.textContent = 'Hostile Attack';
    if (text === 'Wreck Enemy') button.textContent = 'Disable Hostile';
    if (text === 'Stow from Backpack') button.textContent = 'Load from Backpack';
  });

  const shipNameInput = document.getElementById('shipNameInput');
  if (shipNameInput) shipNameInput.placeholder = 'Starship callsign…';
  const shipNameDisplay = document.getElementById('shipNameDisplay');
  if (shipNameDisplay) shipNameDisplay.textContent = shipNameDisplay.textContent.replace('Current name', 'Current callsign').replace('No ship name set.', 'No starship callsign set.');

  const cargoInfo = document.querySelector('#navalCargoList')?.previousElementSibling;
  if (cargoInfo && cargoInfo.textContent.indexOf('Stow items in the ship\'s hold.') >= 0) {
    cargoInfo.textContent = 'Stow items in the starship hold. Click an item to move it to your Backpack.';
  }

  let card = document.getElementById('starsSpaceNavalCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'starsSpaceNavalCard';
    card.className = 'combat-card';
    card.style.margin = '0 0 .65rem 0';
    const combatCard = document.getElementById('navalCombatSummary');
    if (combatCard) combatCard.parentNode.insertBefore(card, combatCard);
  }
  const currentHex = typeof getCurrentStarHex === 'function' ? getCurrentStarHex() : null;
  const currentLabel = currentHex ? (STAR_SIGHTING_COLORS[currentHex.type] || { label: currentHex.type }).label : 'Uncharted';
  card.innerHTML = `
    <div class="ship-copy">
      Current Sector: <strong style="color:var(--gold2);">${S.starSystem.mainStar || 'Uncharted'}</strong><br>
      Current Hex: <strong style="color:var(--teal);">${currentHex ? currentHex.label : 'No selection'}</strong> · ${currentLabel}<br>
      Fuel: <strong style="color:var(--gold2);">${S.starship.fuel.standard || 0}</strong> Standard · <strong style="color:var(--teal);">${S.starship.fuel.hubJump || 0}</strong> Hub · <strong style="color:var(--purple);">${S.starship.fuel.hyperdrive || 0}</strong> Hyperdrive<br>
      Shields / Hull Stress: <strong style="color:var(--red2);">${S.starship.shields || 0}</strong> / ${(S.starship.defendDie || 6) * 2}
    </div>
    <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.45rem;">
      <button class="btn btn-xs btn-teal" onclick="switchTab('galaxy',document.querySelector('.tab-btn[onclick*=\\\"galaxy\\\"]'))">Galaxy</button>
      <button class="btn btn-xs" onclick="changeStarshipFuel('standard',1)">+1 Standard Fuel</button>
      <button class="btn btn-xs" onclick="switchTab('combat',document.querySelector('.tab-btn[onclick*=\\\"combat\\\"]'))">Stars Combat</button>
    </div>`;
}

function syncNavalStateForContext(nextContext) {
  if (typeof S !== 'object' || !S) return;
  const targetCtx = nextContext || window._activeContext || 'traveling';
  const prevCtx = S._navalContext || 'sea';

  if (prevCtx === 'space') S.spaceNaval = cloneStarsData(S.naval);
  else S.seaNaval = cloneStarsData(S.naval);

  if (targetCtx === 'space') {
    S.naval = cloneStarsData(S.spaceNaval || S.naval || {});
    S._navalContext = 'space';
  } else {
    S.naval = cloneStarsData(S.seaNaval || S.naval || {});
    S._navalContext = 'sea';
  }

  if (typeof renderNaval === 'function') {
    try { renderNaval(); } catch (err) {}
  }
  if (targetCtx === 'space') syncSpaceCombatStateFromNaval();
  applySpaceNavalPresentation();
}

function ensureSpaceCargoTarget() {
  ensureStarsState();
  if (window._activeContext === 'space' && S.naval && S.naval.ship) {
    if (!Array.isArray(S.naval.ship.cargo)) S.naval.ship.cargo = [];
    return S.naval.ship.cargo;
  }
  if (!Array.isArray(S.starship.cargo)) S.starship.cargo = [];
  return S.starship.cargo;
}

function addItemToBackpack(item) {
  if (!item) return false;
  if (typeof addToBackpack === 'function') {
    const stored = addToBackpack(item);
    if (stored && typeof renderBackpackUI === 'function') renderBackpackUI();
    return !!stored;
  }
  if (!Array.isArray(S.backpack)) S.backpack = ['', '', '', '', '', ''];
  const slotIdx = S.backpack.indexOf('');
  if (slotIdx < 0) {
    showNotif('Backpack full!', 'warn');
    return false;
  }
  S.backpack[slotIdx] = item;
  if (typeof renderBackpackUI === 'function') renderBackpackUI();
  return true;
}

function addItemToSpaceShipCargo(item) {
  if (!item) return false;
  const cargo = ensureSpaceCargoTarget();
  cargo.push(item);
  if (typeof renderNaval === 'function' && window._activeContext === 'space') renderNaval();
  return true;
}

function takeGalaxyLoot(item, destination) {
  if (!item) return;
  // Handle object payloads, stringified JSON, and plain text labels.
  let itemName = item;
  if (typeof item === 'object' && item) {
    itemName = item.name || item.label || String(item);
  } else if (typeof item === 'string') {
    try {
      const parsed = JSON.parse(item);
      itemName = (parsed && (parsed.name || parsed.label)) || item;
    } catch (e) {
      itemName = item;
    }
  }
  const ok = destination === 'ship' ? addItemToSpaceShipCargo(itemName) : addItemToBackpack(itemName);
  if (ok) showNotif(`Loot secured: ${itemName}`, 'good');
}

function buildLootActions(item) {
  if (!item) return '';
  // For onclick attributes, we need to escape the item properly.
  // If it's a string, wrap it in quotes and use data attributes or pass as literal.
  // If it's an object, stringify it.
  const escaped = typeof item === 'string'
    ? `'${item.replace(/'/g, "\\'")}'`  // Escape single quotes
    : JSON.stringify(item);
  return `<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.25rem;">
    <button class="btn btn-xs btn-teal" onclick="takeGalaxyLoot(${escaped},'pack')">Take To Backpack</button>
    <button class="btn btn-xs" onclick="takeGalaxyLoot(${escaped},'ship')">Store In Ship</button>
  </div>`;
}

function applyGalaxyConditionText(text) {
  if (!text || typeof setPositiveGalaxyCondition !== 'function') return;
  const lower = String(text).toLowerCase();
  if (lower.includes('empowered')) setPositiveGalaxyCondition('empowered');
  if (lower.includes('focused')) setPositiveGalaxyCondition('focused');
  if (lower.includes('bolstered')) setPositiveGalaxyCondition('bolstered');
  if (lower.includes('protected')) setPositiveGalaxyCondition('protected');
  if (lower.includes('distracted') && S.conditions && ('distracted' in S.conditions)) {
    S.conditions.distracted = true;
  }
  if (typeof updateConditionButtons === 'function') updateConditionButtons();
  if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
}

function applyGalaxyFailureText(text) {
  if (!text) return;
  const lower = String(text).toLowerCase();
  if (lower.includes('health damage')) {
    if (typeof changeHealth === 'function') changeHealth(1);
    else if (typeof changeStress === 'function') changeStress(1);
  }
  if (lower.includes('+2 mental stress')) {
    if (typeof changeMentalStress === 'function') changeMentalStress(2);
  } else if (lower.includes('mental stress')) {
    if (typeof changeMentalStress === 'function') changeMentalStress(1);
  }
  if ((lower.includes('+1 stress') || lower.includes(' +1 stress')) && !lower.includes('mental stress')) {
    if (typeof changeStress === 'function') changeStress(1);
  }
  if (lower.includes('lose 1 phase')) {
    if (typeof loseGamePhases === 'function') loseGamePhases(1);
  }
  if (lower.includes('+50 radiation')) {
    if (typeof changeRads === 'function') changeRads(50);
  }
  applyGalaxyConditionText(text);
}

function getMerchantShopEntries(categories) {
  if (typeof SHOP_DATA === 'undefined' || !SHOP_DATA) return [];
  const seen = new Set();
  const entries = [];
  (categories || []).forEach((category) => {
    const list = SHOP_DATA[category];
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || !item.name || seen.has(item.name)) return;
      seen.add(item.name);
      entries.push({ name: item.name, cost: item.cost || 0, cat: category, stat: item.stat || '', desc: item.desc || '' });
    });
  });
  return entries;
}

function rollGalaxyMerchantLootFromCategories(categories, fallbackPool) {
  const pool = getMerchantShopEntries(categories);
  if (pool.length) return pick(pool).name;
  return rollGalaxyMerchantLoot(fallbackPool);
}

function buildGalaxyMerchantOffers(kind) {
  const categories = kind === 'Black Market Ship'
    ? ['weapon_mods', 'cosmic', 'space_armor', 'os_hacks', 'tradegoods', 'exocrafts', 'starship_fuel']
    : ['weapons', 'melee_exp', 'ranged_exp', 'armor', 'armor_exp', 'items', 'toolkits', 'essentials', 'remedies', 'scrolls', 'tradegoods', 'cosmic', 'space_armor', 'exocrafts', 'starship_fuel'];
  const pool = getMerchantShopEntries(categories);
  const offers = [];
  const used = new Set();
  while (pool.length && offers.length < 4) {
    const offer = pick(pool);
    if (!offer || used.has(offer.name)) continue;
    used.add(offer.name);
    offers.push(Object.assign({}, offer));
  }
  return offers;
}

function getOfferPrice(offer, discountRate) {
  const rate = typeof discountRate === 'number' ? discountRate : 0;
  return Math.max(0, Math.ceil((offer.cost || 0) * (1 - rate)));
}

function clearActiveGalaxyPanels() {
  ensureStarsState();
  S.starSystem.activeFacility = null;
  S.starSystem.activeHub = null;
  S.starSystem.activeMystery = null;
  S.starSystem.activeDeadMoon = null;
  S.starSystem.activeDeadMoonMap = null;
  S.starSystem.activeDerelict = null;
  S.starSystem.activeSpaceEncounter = null;
  S.starSystem.activeTask = null;
  const result = document.getElementById('starExplorationResult');
  const detail = document.getElementById('starExplorationDetail');
  const analysis = document.getElementById('starAnalysisResult');
  if (result) result.innerHTML = '';
  if (analysis) analysis.innerHTML = '';
  if (detail) detail.innerHTML = '<div style="font-size:.88rem;color:var(--muted2);line-height:1.55;">Hex selection updated. Click <strong style="color:var(--gold2);">Roll Encounter</strong> to inspect local activity.</div>';
}

function setPositiveGalaxyCondition(conditionKey) {
  if (!S.conditions || !(conditionKey in S.conditions)) return;
  S.conditions[conditionKey] = true;
  if (typeof updateConditionButtons === 'function') updateConditionButtons();
  if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
}

function pickGalaxyTaskHex(preferredHexId) {
  if (preferredHexId != null) {
    const preferredHex = (S.starSystem.hexes || []).find((hex) => {
      return hex && hex.id === Number(preferredHexId) && hex.ring !== 'core' && !hex.radioTaskId && !(hex.taskMarker && !hex.taskMarker.resolved);
    });
    if (preferredHex) return preferredHex;
  }
  const candidates = (S.starSystem.hexes || []).filter((hex) => hex && hex.ring !== 'core' && !hex.radioTaskId && !(hex.taskMarker && !hex.taskMarker.resolved));
  if (!candidates.length) return null;
  const preferred = candidates.filter((hex) => ['hub', 'planet', 'location', 'mystery', 'facility'].includes(hex.type));
  return pick(preferred.length ? preferred : candidates);
}

function createGalaxyTask(source, config) {
  ensureStarsState();
  config = config || {};
  const hex = pickGalaxyTaskHex(config.preferredHexId);
  if (!hex) return null;
  const task = {
    id: `gal-task-${Date.now()}-${roll(9999)}`,
    source: source || 'Galaxy',
    title: config.title || 'Galaxy Task',
    text: config.text || 'Complete the assigned objective in this sector.',
    reward: Object.assign({}, config.reward || {}),
    missionId: config.missionId || null,
    missionStep: config.missionStep || '',
    interaction: config.interaction || 'roll',
    hexId: hex.id,
    resolved: false,
  };
  hex.taskMarker = {
    id: task.id,
    title: task.title,
    source: task.source,
    resolved: false,
  };
  S.starSystem.taskMarkers.push(task);
  S.starSystem.lastRadioEvent = `${task.source}: ${task.title} marker placed at Hex ${hex.id}.`;
  renderStarSystemMap();
  updateStarSystemReadouts();
  return task;
}

function getGalaxyTaskById(taskId) {
  return (S.starSystem.taskMarkers || []).find((task) => task.id === taskId) || null;
}

function getCurrentGalaxyTask() {
  const hex = getCurrentStarHex();
  if (!hex || !hex.taskMarker || hex.taskMarker.resolved) return null;
  return getGalaxyTaskById(hex.taskMarker.id);
}

function applyGalaxyRewardPackage(reward) {
  if (!reward) return '';
  const notes = [];
  if (reward.renown) {
    changeFactionRenown(reward.renown, 1);
    notes.push(`+1 ${FACTION_NAMES[reward.renown] || reward.renown} Renown`);
  }
  if (reward.globalRenown && typeof changeCounter === 'function') {
    changeCounter('renown', reward.globalRenown);
    notes.push(`+${reward.globalRenown} Renown`);
  }
  if (reward.credits && typeof changeCredits === 'function') {
    changeCredits(reward.credits);
    notes.push(`+${reward.credits} credits`);
  }
  const lootDrops = [];
  if (Array.isArray(reward.loot)) lootDrops.push(...reward.loot);
  if (reward.lootCategory) lootDrops.push(rollGalaxyMerchantLootFromCategories([reward.lootCategory], reward.loot));
  if (Array.isArray(reward.lootCategories) && reward.lootCategories.length) lootDrops.push(rollGalaxyMerchantLootFromCategories(reward.lootCategories, reward.loot));
  if (reward.lootFromMerchant) lootDrops.push(rollGalaxyMerchantLoot());
  lootDrops.filter(Boolean).forEach((item) => takeGalaxyLoot(item, 'pack'));
  if (lootDrops.length) notes.push(`Loot: ${lootDrops.join(', ')}`);
  return notes.join(' · ');
}

function renderGalaxyTaskPanel(taskId) {
  ensureStarsState();
  const task = getGalaxyTaskById(taskId) || getCurrentGalaxyTask();
  const out = document.getElementById('starExplorationDetail');
  if (!task || !out) return;
  S.starSystem.activeTask = task;
  if (task.source === 'Mission Board' && task.missionId && task.interaction === 'mission-step') {
    const stepBtn = task.missionStep === 'informer'
      ? `<button class="btn btn-xs btn-teal" onclick="if(typeof startMissionStep1==='function'){startMissionStep1(${task.missionId});}">Run Step 1: Info</button>`
      : (task.missionStep === 'confront'
        ? `<button class="btn btn-xs btn-primary" onclick="if(typeof startMissionStep3==='function'){startMissionStep3(${task.missionId});}">Run Step 3: Confrontation</button>`
        : `<button class="btn btn-xs btn-teal" onclick="if(typeof startMissionStep2==='function'){startMissionStep2(${task.missionId});}">Run Step 2: Site</button>`);
    out.innerHTML = `
      <div style="font-size:.92rem;color:var(--gold2);margin-bottom:.25rem;">Mission Marker: ${task.title}</div>
      <div style="font-size:.86rem;color:var(--muted2);line-height:1.6;">
        <strong style="color:var(--text);">Source:</strong> ${task.source}<br>
        ${task.text}
      </div>
      <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.45rem;">
        ${stepBtn}
        <button class="btn btn-xs" onclick="if(typeof switchTab==='function'){switchTab('missions',document.querySelector(\".tab-btn[onclick*=\\\"switchTab('missions'\\\"]\"));} if(typeof renderMissionTracker==='function'){renderMissionTracker();}">Open Mission Tracker</button>
      </div>`;
    return;
  }
  out.innerHTML = `
    <div style="font-size:.92rem;color:var(--gold2);margin-bottom:.25rem;">Galaxy Task: ${task.title}</div>
    <div style="font-size:.86rem;color:var(--muted2);line-height:1.6;">
      <strong style="color:var(--text);">Source:</strong> ${task.source}<br>
      ${task.text}
    </div>
    <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.45rem;">
      <button class="btn btn-xs btn-teal" onclick="rollGalaxyTaskCheck('${task.id}',true)">Roll to Succeed</button>
      <button class="btn btn-xs" onclick="resolveGalaxyTaskOutcome('${task.id}',false)">Mark Failed</button>
    </div>`;
}

function rollGalaxyTaskCheck(taskId, attempt) {
  ensureStarsState();
  const task = getGalaxyTaskById(taskId);
  if (!task || task.resolved) return;
  const adventureDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('adventure') : ((S.stats && S.stats.adventure) || 6);
  const dreadRoll = roll(8);
  const playerRoll = roll(adventureDie);
  const success = playerRoll >= dreadRoll;
  const resultText = success 
    ? `Rolled d${adventureDie}: ${playerRoll} vs Dread d8: ${dreadRoll} — SUCCESS!` 
    : `Rolled d${adventureDie}: ${playerRoll} vs Dread d8: ${dreadRoll} — failure.`;
  const out = document.getElementById('starExplorationDetail');
  if (out) {
    out.innerHTML = `<div style="font-size:.88rem;color:var(--gold2);margin-bottom:.2rem;">${task.title}</div>
      <div style="font-size:.84rem;color:var(--muted2);line-height:1.6;">${resultText}</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
        <button class="btn btn-xs btn-teal" onclick="resolveGalaxyTaskOutcome('${task.id}',${success})">Accept Result</button>
      </div>`;
  }
}

function resolveGalaxyTaskOutcome(taskId, success) {
  ensureStarsState();
  const task = getGalaxyTaskById(taskId);
  const out = document.getElementById('starExplorationDetail');
  if (!task || task.resolved) return;
  const hex = (S.starSystem.hexes || []).find((entry) => entry.id === task.hexId);
  task.resolved = true;
  if (hex && hex.taskMarker) hex.taskMarker.resolved = true;
  let resultText = '';
  if (success) {
    resultText = applyGalaxyRewardPackage(task.reward) || 'Task completed.';
    showNotif(`Galaxy task completed: ${task.title}`, 'good');
  } else {
    if (typeof changeCounter === 'function') changeCounter('renown', -1);
    if (typeof changeStress === 'function') changeStress(1);
    if (typeof loseGamePhases === 'function') loseGamePhases(1);
    resultText = 'Task failed. -1 Renown, +1 Stress, -1 Phase';
    showNotif(`Galaxy task failed: ${task.title} — consequences applied`, 'warn');
  }
  if (out) {
    out.innerHTML = `<div style="font-size:.9rem;color:${success ? 'var(--green2)' : 'var(--red2)'};">${task.title}</div><div style="font-size:.84rem;color:var(--muted2);line-height:1.55;margin-top:.2rem;">${resultText}</div>`;
  }
  renderStarSystemMap();
  updateStarSystemReadouts();
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
  radio_task:       { label: 'RADIO TASK', color: '#50c8ff' },
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

const STAR_HEX_LAND = ['Dust belt', 'Broken orbit shelf', 'Comet wake corridor', 'Glass asteroid plain', 'Frozen shard lane', 'Ion reef', 'Debris graveyard'];
const STAR_HEX_FLORA = ['Bioluminescent spores', 'Void lichen webs', 'Crystal vines', 'Electroplankton cloud', 'Spore drift', 'Metal moss', 'Star bloom colony'];
const STAR_HEX_WONDER = ['Echo beacon', 'Split moon halo', 'Solar lace', 'Ancestral relay', 'Mirror tide', 'Gravity lens', 'Singing wreck'];

const PLANET_RING_TYPES = {
  inner: ['Furnace', 'Shattered', 'Tainted', 'Grave'],
  middle: ['Ocean', 'Jungle', 'Desert', 'Rocky', 'Vital'],
  outer: ['Ice', 'Jovian', 'Rocky', 'Tainted'],
};

const PLANET_TYPE_BIOMES = {
  Jovian: ['Exotic', 'Irradiated', 'Volcanic'],
  Rocky: ['Barren', 'Irradiated', 'Water'],
  Ice: ['Frozen', 'Barren', 'Water'],
  Ocean: ['Water', 'Lush', 'Exotic'],
  Jungle: ['Water', 'Lush', 'Exotic'],
  Desert: ['Barren', 'Water', 'Volcanic'],
  Grave: ['Irradiated', 'Urban Ruins', 'Barren'],
  Vital: ['Water', 'Lush', 'Exotic'],
  Furnace: ['Scorched', 'Volcanic', 'Barren'],
  Tainted: ['Toxic', 'Urban Ruins', 'Irradiated'],
  Shattered: ['Scorched', 'Volcanic', 'Barren'],
};

const PLANET_RING_ELEMENTS = {
  inner: ['Platinum', 'Silicon', 'Iridium', 'Cadmium', 'Sodium', 'Radium', 'Molten Glass'],
  middle: ['Salt', 'Magnesium', 'Cobalt', 'Aluminum', 'Sulfur', 'Titanium', 'Copper'],
  outer: ['Helium', 'Neon', 'Methane', 'Hydrogen', 'Ammonia', 'Ice Crystals', 'Rare Elements'],
};

const PLANET_SIZE_TABLE = ['Dwarf (500 km to 2,500 km)', 'Small (3,000 km to 5,000 km)', 'Midsized (6,000 km to 10,000 km)', 'Large (10,000 km to 15,000 km)', 'Giant (15,000 km to 50,000 km)'];
const PLANET_TEMPERATURE_TABLE = ['Frigid (< -100 C)', 'Cold (-50 C to 0 C)', 'Temperate (0 C to 30 C)', 'Hot (40 C to 60 C)', 'Scorched (60 C to 100 C)'];
const PLANET_GRAVITY_TABLE = ['Standard (0.8 g to 1.2 g)', 'Crushing (3 g)', 'Minimal (0.3 g)', 'High (1.3 g to 3 g)', 'Low (0.3 g to 0.8 g)'];
const PLANET_ATMOSPHERE_TABLE = ['Negligible Vacuum', 'Thick Atmosphere', 'Thin Atmosphere', 'Moderate Atmosphere', 'Dense Atmosphere'];

const PLANET_OBSERVED_FROM_SPACE = [
  'Complex weather system',
  'Unusual color banding',
  'Massive impact scar',
  'Floating cloud walls',
  'Persistent electrical storms',
  'Shimmering debris halo',
  'Orbital graveyard of wrecks',
  'Geometric storm fronts',
  'Sprawling canyon lattice',
  'Radiant aurora ring',
];

const PLANET_LANDING_PAD = [
  'On a fractured plateau surrounded by old sensor towers.',
  'Within a crater where the winds are calm but visibility is poor.',
  'Beside an ancient military outpost with intermittent power.',
  'On the edge of a dry riverbed lined with metallic stones.',
  'Near a broken dome settlement with sealed access gates.',
  'On a floating platform anchored to basalt columns.',
  'Inside a canyon shelf with narrow approach corridors.',
  'Atop a ridge that overlooks a field of shattered ruins.',
];

const PLANET_TONE_TABLE = ['Bleak', 'Ethereal', 'Glimmering', 'Ominous', 'Mysterious', 'Vibrant', 'Subdued', 'Stark', 'Soft', 'Fierce'];
const PLANET_WEATHER_TABLE = ['Dust storms', 'Clear skies', 'Metallic fog', 'Electric storms', 'Acid rain', 'Overcast', 'Sunlit day', 'Twilight dimness', 'Heatwaves', 'Rain'];
const PLANET_SIGHTS_TABLE = ['Broken cities', 'Comet tails', 'Nebula glow', 'Ancient monoliths', 'Strange cloud arches', 'Orbital ring ruins', 'Flickering starlight', 'Passing shuttles', 'Drifting satellites', 'Crystal towers'];

const PLANET_TERRAIN_TABLE = [
  { name: 'Hazardous', effect: 'Steep cliffs take +1 Phase of the Day. Pass Body+Agility vs DD20 or take the difference as damage.' },
  { name: 'Convoluted', effect: 'Unclear pathways slow movement. Crossing takes +1 Phase of Day.' },
  { name: 'Biome-Exotic', effect: 'A hazardous river blocks the way. Crossing or detouring costs +3 Phase of the Day.' },
  { name: 'Biome-Irradiated', effect: 'Radiation storm: all characters suffer 200 Rads unless shelter is found.' },
  { name: 'Biome-Volcanic', effect: 'Lava lake blocks this hex. Forced detour costs +3 Phase of the Day.' },
  { name: 'Inhabited', effect: 'Actively populated. d4: 1 Hunting Ground, 2 Nest, 3-4 Oasis.' },
  { name: 'Easy Going', effect: 'No major obstacle: a hidden or sheltered route.' },
];

const PLANET_NATURE_TABLE = ['vine-draped', 'mist-veiled', 'wind-scoured', 'salt-crowned', 'ember-lit', 'frost-carved', 'root-entwined', 'shard-strewn', 'storm-battered', 'crystal-lined'];
const PLANET_FORM_TABLE = ['valleys', 'plains', 'cliffs', 'canyons', 'ruins', 'ridges', 'groves', 'dunes', 'basins', 'plateaus'];
const PLANET_FAUNA_TABLE = ['iron hawks', 'glass serpents', 'reef striders', 'ash foxes', 'void eels', 'bone hounds', 'spore moths', 'cave bats', 'sand drakes', 'shard beetles'];
const PLANET_WONDER_TABLE = ['collapsed gate', 'singing obelisk', 'ancient relay', 'floating archive', 'burning ridge', 'crystal forest', 'blackwater basin', 'mirrored canyon', 'hollow moon fragment', 'sunken colony'];

const PLANET_POI_TABLE = [
  'Abandoned Purifier',
  'Sacred Grove',
  'Crashed Starship',
  'Hidden Laboratory',
  'Floating City',
  'Rebel Encampment',
];

const PLANET_MYSTERY_TABLE = [
  'Echoes of the Lost',
  'The Enigmatic Signal',
  'The Vanishing Colony',
  'The Monolith',
  'The Forgotten Shrine',
  'The Shattered Ruins',
];

const PLANETSIDE_EXPLORATION_TABLE = ['Find', 'Hazard', 'Beast', 'Close Encounter', 'Pirate', 'Empty Colony', 'Merchant Colony', 'Skirmish', 'Galactic Facility'];

function buildPlanetName(ring, planetType) {
  const ringTag = ring === 'inner' ? 'IR' : ring === 'outer' ? 'OR' : 'MR';
  const syllA = ['AX', 'VE', 'TO', 'KR', 'YU', 'NE', 'OM', 'ZA', 'QU', 'IL'];
  const syllB = ['rion', 'this', 'mora', 'vek', 'dara', 'lyx', 'nox', 'cair', 'sul', 'tera'];
  const code = `${ringTag}-${String(roll(9999)).padStart(4, '0')}`;
  return `${pick(syllA)}${pick(syllB)} (${planetType}) ${code}`;
}

function createPlanetProfile(hex) {
  const ring = (hex && hex.ring) || 'middle';
  const planetType = pick(PLANET_RING_TYPES[ring] || PLANET_RING_TYPES.middle);
  const biomeOptions = PLANET_TYPE_BIOMES[planetType] || ['Barren'];
  const biome = pick(biomeOptions);
  const singleBiome = roll(10) >= 9;
  const dayHours = roll(16) + 8;
  const nightHours = Math.max(4, 30 - dayHours);
  const terrain = pick(PLANET_TERRAIN_TABLE);
  return {
    planetName: buildPlanetName(ring, planetType),
    ring,
    planetType,
    biome,
    element: pick(PLANET_RING_ELEMENTS[ring] || PLANET_RING_ELEMENTS.middle),
    size: pick(PLANET_SIZE_TABLE),
    temperature: pick(PLANET_TEMPERATURE_TABLE),
    gravity: pick(PLANET_GRAVITY_TABLE),
    atmosphere: pick(PLANET_ATMOSPHERE_TABLE),
    hours: `Day ${dayHours}h / Night ${nightHours}h`,
    singleBiome,
    observedFromSpace: pick(PLANET_OBSERVED_FROM_SPACE),
    landingPad: pick(PLANET_LANDING_PAD),
    tone: pick(PLANET_TONE_TABLE),
    weather: pick(PLANET_WEATHER_TABLE),
    sights: pick(PLANET_SIGHTS_TABLE),
    terrain: terrain.name,
    terrainEffect: terrain.effect,
    nature: pick(PLANET_NATURE_TABLE),
    form: pick(PLANET_FORM_TABLE),
    fauna: pick(PLANET_FAUNA_TABLE),
    wonder: pick(PLANET_WONDER_TABLE),
    furtherAnalysis: null,
  };
}

function ensurePlanetProfile(hex) {
  if (!hex) return null;
  if (!hex.planetProfile) hex.planetProfile = createPlanetProfile(hex);
  return hex.planetProfile;
}

function rollPlanetFurtherAnalysis(hex) {
  const profile = ensurePlanetProfile(hex);
  if (!profile) return null;
  if (profile.furtherAnalysis) return profile.furtherAnalysis;
  const eventRoll = roll(4);
  if (eventRoll === 1) {
    const power = pick((S.starSystem && S.starSystem.majorPowers) || ['Unknown Authority']);
    profile.furtherAnalysis = { type: 'major_power', title: 'Major Power', text: `${power} currently runs this planet.` };
  } else if (eventRoll === 2) {
    const poi = pick(PLANET_POI_TABLE);
    profile.furtherAnalysis = { type: 'poi', title: 'Point of Interest', text: `${poi} detected at Planetary Hex #${roll(PLANET_SURFACE_ROWS * PLANET_SURFACE_COLS)}.` };
  } else if (eventRoll === 3) {
    const mystery = pick(PLANET_MYSTERY_TABLE);
    profile.furtherAnalysis = { type: 'mystery', title: 'Mystery', text: `${mystery} signal triangulated at Planetary Hex #${roll(PLANET_SURFACE_ROWS * PLANET_SURFACE_COLS)}.` };
  } else {
    profile.furtherAnalysis = { type: 'merchant_colony', title: 'Merchant Colony', text: `Merchant Colony located at Planetary Hex #${roll(PLANET_SURFACE_ROWS * PLANET_SURFACE_COLS)}.` };
  }
  return profile.furtherAnalysis;
}

function buildPlanetAnalysisHtml(profile) {
  if (!profile) return '';
  const exploreRows = PLANETSIDE_EXPLORATION_TABLE.map((label, idx) => `${idx + 1}${idx === PLANETSIDE_EXPLORATION_TABLE.length - 1 ? '-10' : ''} ${label}`).join(' · ');
  return `
    <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Planet Profile</div>
      <div style="font-size:.9rem;color:var(--text);line-height:1.65;margin-top:.08rem;">
        <strong>Planet Name:</strong> ${profile.planetName}<br>
        <strong>Biome:</strong> ${profile.biome}${profile.singleBiome ? ' (Single Biome)' : ' (Multi-Biome)'}<br>
        <strong>Element:</strong> ${profile.element}<br>
        <strong>Planet Type:</strong> ${profile.planetType}<br>
        <strong>Size:</strong> ${profile.size}<br>
        <strong>Temperature:</strong> ${profile.temperature}<br>
        <strong>Gravity:</strong> ${profile.gravity}<br>
        <strong>Atmosphere:</strong> ${profile.atmosphere}<br>
        <strong>Hours Per Day / Night:</strong> ${profile.hours}
      </div>
    </div>
    <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Observed Surface Data</div>
      <div style="font-size:.85rem;color:var(--muted2);line-height:1.6;margin-top:.08rem;">
        <strong>Observed From Space:</strong> ${profile.observedFromSpace}<br>
        <strong>Landing Pad:</strong> ${profile.landingPad}<br>
        The sky today shows a/an <strong>${profile.tone}</strong> tone amidst <strong>${profile.weather}</strong>.<br>
        Beyond the horizon, you see <strong>${profile.sights}</strong>.<br>
        As you travel, the terrain is <strong>${profile.terrain}</strong>.<br>
        <strong>Terrain Effect:</strong> ${profile.terrainEffect}<br>
        While here, you observe the <strong>${profile.nature}</strong> <strong>${profile.form}</strong>.<br>
        The area is home to <strong>${profile.fauna}</strong> often seen near a/an <strong>${profile.wonder}</strong>.
      </div>
    </div>
    <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Planet Side Exploration (d10)</div>
      <div style="font-size:.84rem;color:var(--muted2);line-height:1.6;margin-top:.08rem;">
        ${exploreRows}
      </div>
    </div>`;
}

function pickRingEncounterOutcome(ring) {
  const table = STAR_RING_TABLES[ring] || STAR_RING_TABLES.middle;
  return table[roll(table.length) - 1];
}

const STAR_MYSTERY_SNIPPETS = [
  'A nomad ship transmits a fragmented plea before vanishing behind static.',
  'Royal Armada signatures flood the scanner, but no ships are visible.',
  'A drifting transport reports a crew that does not remember boarding.',
  'A hostile frigate keeps perfect distance and never enters weapons range.',
  'A deep-space entity shadows your hull in silence.',
  'A damaged vessel asks for 2d6x10 credits in tax to pass safely.',
  'A friendly ship offers trade and refueling if you dock.',
  'A nearby moon reflects signals from a city that no longer exists.',
  'A ghostly flotilla circles a dead planet in synchronized motion.',
  'A sealed transmission repeats: "Do not approach the eye."',
];

const STAR_PERIL_SNIPPETS = [
  'Malfunction: Systems desynchronize and oxygen use spikes.',
  'Space anomaly: A gravitic fold pulls the crew through temporal lag.',
  'Onboard issue: panic spreads as visions and sickness emerge.',
  'Misjump: Arrival vector is wrong; navigation confidence collapses.',
  'Life-support sputters while cabin pressure slowly drops.',
  'A fuel recycler leaks volatile residue into ventilation.',
  'A hard reboot causes 3-second input lag across controls.',
  'The crew reports hearing voices through dead comm channels.',
  'A hull resonance causes stress fractures near the engine spine.',
  'Guidance logic loops and predicts impossible destinations.',
];

const STAR_PERIL_SITES = [
  {
    title: 'Storm Crater',
    text: 'A massive impact crater, still steaming faintly. The ground here is wrong.',
    check: ['lead', 'body'],
    dd: 6,
    success: 'Passage gained and crew momentum spikes. Empowered: Body/Strike/Shoot step up on your next relevant check.',
  },
  {
    title: 'Collapsed Beacon Spine',
    text: 'A dead relay tower lists across shattered regolith, emitting intermittent panic bursts.',
    check: ['control', 'mind'],
    dd: 8,
    success: 'You route around unstable debris and lock in a safe path through the lane.',
  },
  {
    title: 'Ion Grave Drift',
    text: 'Fields of charged wreckage scrape the hull whenever the winds surge.',
    check: ['lead', 'control'],
    dd: 8,
    success: 'Thruster timing is perfect. You cross before the drift closes.',
  },
  {
    title: 'Shatterglass Shelf',
    text: 'Crystalline planes refract scans and split every heading into false corridors.',
    check: ['mind', 'lead'],
    dd: 10,
    success: 'You identify the true lane and avoid the dead mirrors.',
  },
];

const STAR_PERIL_FAILURES = [
  { id: 'stress', label: 'Crew panic wave', apply: (diff) => { if (typeof changeMentalStress === 'function') changeMentalStress(Math.max(1, diff)); return `+${Math.max(1, diff)} Mental Stress.`; } },
  { id: 'rads', label: 'Irradiated surge', apply: (diff) => { if (typeof changeRads === 'function') changeRads(Math.max(50, diff * 50)); return `+${Math.max(50, diff * 50)} Radiation.`; } },
  { id: 'stress_damage', label: 'Hull shock to crew', apply: (diff) => { if (typeof changeStress === 'function') changeStress(Math.max(1, diff)); return `+${Math.max(1, diff)} Stress.`; } },
  { id: 'condition', label: 'Condition strain', apply: () => 'Condition inflicted: Distracted until end of current phase.' },
  { id: 'trauma', label: 'Trauma check trigger', apply: () => 'Trigger a Trauma Check before taking another traversal action.' },
];

const STAR_WEATHER_FRONTS = [
  {
    name: 'Solar Calm',
    desc: 'Stable lanes and low particulate drift. Pilots can take a clean reading here.',
    check: 'lead',
    dd: 0,
    failure: 'No weather hazard in this hex.',
  },
  {
    name: 'Aurora Drift',
    desc: 'Soft ion ribbons wash over the hull and sharpen long-range scans.',
    check: 'mind',
    dd: 0,
    failure: 'No weather hazard in this hex.',
  },
  {
    name: 'Static Front',
    desc: 'Charged vapor reduces visibility and fuzzes short-range telemetry.',
    check: 'lead',
    dd: 8,
    failure: 'Remain in this Hex and lose 1 Phase.',
  },
  {
    name: 'Ion Squall',
    desc: 'Blue lightning sheets across sensor arrays and scrambles lane markers.',
    check: 'control',
    dd: 8,
    failure: 'Navigation resets. Remain in Hex and lose 1 Phase.',
  },
  {
    name: 'Ash Drift',
    desc: 'Dark particulate haze clogs vents and drags on thruster output.',
    check: 'body',
    dd: 6,
    failure: 'Suffer +1 Health damage and lose 1 Phase.',
  },
  {
    name: 'Grav Tide',
    desc: 'Micro-gravity shears ripple through the lane and bend approach vectors.',
    check: 'mind',
    dd: 10,
    failure: 'Remain in Hex and take +1 Mental Stress.',
  },
];

const STAR_CONTACT_ARCHETYPES = [
  {
    kind: 'Royal Ship',
    summary: 'Command vessel carrying court envoys, strict tariffs, and political leverage.',
    options: [
      { id: 'pay', label: 'Pay Tariff', text: 'Pay 2d6x10 Credits to pass peacefully.', payout: 'creditsLoss' },
      { id: 'charter', label: 'Request Royal Task', text: 'Lead vs DD8. Success: place a Galaxy task marker and earn Political Renown on completion.', check: 'lead', dd: 8, taskConfig: { title: 'Royal Charter Run', text: 'Deliver sealed royal data and escort the envoy route to the marked hex.', reward: { renown: 'political', globalRenown: 1, lootCategory: 'armor' } } },
    ],
  },
  {
    kind: 'Merchant Ship',
    summary: 'Cargo flotilla with legal manifests, eager brokers, and distracted guards.',
    options: [
      { id: 'buy', label: 'Buy', text: 'Open merchant inventory pulled directly from the Merchant tab.', trade: true },
      { id: 'haggle', label: 'Haggle', text: 'Lead vs DD8. Success: current merchant offers are 20% cheaper.', check: 'lead', dd: 8, haggle: true },
      { id: 'thieve', label: 'Steal', text: 'Control vs DD8. Success: steal one merchant item. Failure: flagged and forced combat response.', check: 'control', dd: 8, steal: true },
    ],
  },
  {
    kind: 'Black Market Ship',
    summary: 'Masked signatures and encrypted channels. Contraband prices are brutal.',
    options: [
      { id: 'buy', label: 'Buy Contraband', text: 'Open contraband inventory pulled from the Merchant tab.', contraband: true },
      { id: 'haggle', label: 'Threaten Better Price', text: 'Lead vs DD8. Success: contraband offers are 20% cheaper.', check: 'lead', dd: 8, haggle: true },
      { id: 'intel', label: 'Steal Intel', text: 'Mind vs DD8. Success: reveal nearest hidden signature and place a Galaxy task marker.', check: 'mind', dd: 8, reveal: true, taskConfig: { title: 'Black Channel Lead', text: 'Follow the underworld route hidden in the stolen cipher packet.', reward: { renown: 'underworld', lootFromMerchant: true } } },
    ],
  },
  {
    kind: 'Bandit Ship',
    summary: 'Patchwork hull and hardpoint batteries. They want tribute now.',
    options: [
      { id: 'tribute', label: 'Pay Tribute', text: 'Pay 100 Credits and avoid combat.', payout: 'banditPay' },
      { id: 'defy', label: 'Defy Bandits', text: 'Lead vs DD10. Success: gain loot and +1 Underworld Renown. Failure: immediate combat cue.', check: 'lead', dd: 10, renown: 'underworld', steal: true },
    ],
  },
];

function getGalaxyMerchantLootPool() {
  if (typeof SHOP_DATA === 'undefined' || !SHOP_DATA) return [];
  const keys = ['weapons', 'melee_exp', 'ranged_exp', 'armor', 'armor_exp', 'items', 'toolkits', 'essentials', 'remedies', 'scrolls', 'weapon_mods', 'tradegoods', 'cosmic', 'space_armor', 'exocrafts', 'starship_fuel'];
  const pool = [];
  keys.forEach((k) => {
    const list = SHOP_DATA[k];
    if (Array.isArray(list)) {
      list.forEach((it) => {
        if (it && it.name) pool.push(it.name);
      });
    }
  });
  return pool;
}

function rollGalaxyMerchantLoot(fallbackPool) {
  let result = '';
  if (typeof rollForLoot === 'function') {
    try {
      const rolled = rollForLoot('easy');
      if (Array.isArray(rolled) && rolled.length) result = pick(rolled);
    } catch (err) {}
  }
  if (!result) {
    const pool = getGalaxyMerchantLootPool();
    if (pool.length) result = pick(pool);
  }
  if (!result) {
    const fallback = Array.isArray(fallbackPool) && fallbackPool.length ? fallbackPool : MYSTERY_TRADE;
    result = pick(fallback);
  }
  return result;
}

function loseGamePhases(count) {
  ensureStarsState();
  let n = Math.max(1, parseInt(count, 10) || 1);
  while (n > 0) {
    if ((S.gameDate.phase || 0) < DAY_PHASES.length - 1) {
      S.gameDate.phase = (S.gameDate.phase || 0) + 1;
    } else {
      S.gameDate.phase = 0;
      advanceDay(1, true);
    }
    n -= 1;
  }
  updateDateUI();
}

function resolveGalaxySkillCheck(primaryKey, secondaryKey, dd, label) {
  const p = (typeof getEffectiveDie === 'function') ? getEffectiveDie(primaryKey) : ((S.stats && S.stats[primaryKey]) || 4);
  const s = secondaryKey ? ((typeof getEffectiveDie === 'function') ? getEffectiveDie(secondaryKey) : ((S.stats && S.stats[secondaryKey]) || 4)) : 0;
  const die = Math.max(p || 4, s || 0, 4);
  const action = explodingRoll(die);
  const dread = explodingRoll(dd);
  const success = action.total >= dread.total;
  return {
    success,
    delta: Math.max(1, Math.abs(action.total - dread.total)),
    text: `${label}: d${die}=${action.total} vs DD${dd}=${dread.total}`,
  };
}

const STAR_SPACE_ENCOUNTERS = [
  {
    title: 'Weeping Willow',
    text: 'A colossal weeping willow grows in a Star Hub greenhouse. Terraforming Seeds could restore a nearby desert world.',
    options: [
      { id: 'deliver-seeds', label: 'Deliver Seeds', type: 'check', stat: 'lead', dd: 8, success: { renown: 'political', task: true, loot: ['Data Crystals worth 50 credits'] }, failure: { text: 'Seeds degrade in transit. Lose 1 Phase and +1 Mental Stress.' } },
    ],
  },
  {
    title: 'Unusual Radar Signal',
    text: 'A stationary Transporter has become an improvised corporate explosive foundry.',
    options: [
      { id: 'support-foundry', label: 'Support Mission', type: 'check', stat: 'control', dd: 6, success: { renown: 'corporations', lootFromMerchant: true }, failure: { text: 'The foundry rejects your protocol package. +1 Stress.' } },
      { id: 'infiltrate-foundry', label: 'Infiltrate', type: 'check-or-combat', stat: 'control', dd: 4, success: { lootFromMerchant: true }, failure: { combat: 'Fight 4 Corpos DD4|8 HP.' } },
    ],
  },
  {
    title: 'Derelict Space Station',
    text: 'A drifting station contains ancient data drives.',
    options: [
      { id: 'recover-data', label: 'Recover Data', type: 'check', stat: 'control', dd: 8, success: { renown: 'underworld', loot: ['Hack Data Drive'] }, failure: { text: 'Encrypted traps trigger. +50 Radiation.' } },
    ],
  },
  {
    title: 'Ghost Ship',
    text: 'A crewless vessel holds an advanced toolkit and destination marker.',
    options: [
      { id: 'retrieve-toolkit', label: 'Retrieve Toolkit', type: 'check', stat: 'mind', dd: 6, success: { renown: 'military', loot: ['Toolkit'] }, failure: { text: 'Phantom discharge jolts the crew. +1 Mental Stress.' } },
      { id: 'follow-message', label: 'Follow Message', type: 'check', stat: 'lead', dd: 8, success: { task: true, revealHex: true }, failure: { text: 'Trail goes cold. Lose 1 Phase.' } },
    ],
  },
  {
    title: 'Stranded Scientist',
    text: 'A scientist on a remote asteroid asks help finishing experiments.',
    options: [
      { id: 'assist-scientist', label: 'Assist Scientist', type: 'check', stat: 'mind', dd: 8, success: { renown: 'religious', loot: ['Operating System'] }, failure: { text: 'Experiment backlash causes +1 Health damage.' } },
      { id: 'secure-data', label: 'Secure Data', type: 'check-or-combat', stat: 'control', dd: 8, success: { loot: ['Cosmic Essential'] }, failure: { combat: 'Fight Experiment DD8|16 HP.' } },
    ],
  },
  {
    title: 'Space Anomaly',
    text: 'An alien artifact emits unknown energy and warps nearby instruments.',
    options: [
      { id: 'study-anomaly', label: 'Study', type: 'check', stat: 'mind', dd: 8, success: { renown: 'religious', loot: ['Exocraft'] }, failure: { text: 'Feedback wave: +2 Mental Stress.' } },
      { id: 'retrieve-anomaly', label: 'Retrieve Core', type: 'check-or-combat', stat: 'body', dd: 10, success: { lootFromMerchant: true }, failure: { combat: 'Fight Alien Guardian DD10|20 HP.' } },
    ],
  },
  {
    title: 'Pirate Ambush',
    text: 'Pirates demand tribute in open space.',
    options: [
      { id: 'pay-pirates', label: 'Pay Tribute', type: 'cost', credits: 200, success: { text: 'You avoid conflict.' } },
      { id: 'fight-pirates', label: 'Defy Pirates', type: 'check-or-combat', stat: 'lead', dd: 10, success: { renown: 'political', lootFromMerchant: true }, failure: { combat: 'Fight Pirate Leader DD10|20 HP.' } },
    ],
  },
  {
    title: 'Cosmic Distress Beacon',
    text: 'A crashed merchant vessel near a Dead Moon has survivors and scattered cargo.',
    options: [
      { id: 'aid-survivors', label: 'Aid Survivors', type: 'check', stat: 'lead', dd: 6, success: { renown: 'rebels', lootCategory: 'armor', task: true }, failure: { text: 'Evacuation is delayed. Lose 1 Phase.' } },
    ],
  },
  {
    title: 'Ancient Ruins',
    text: 'A barren planet reveals a temple full of traps and relics.',
    options: [
      { id: 'explore-ruins', label: 'Explore', type: 'check', stat: 'lead', dd: 10, success: { renown: 'religious', loot: ['Spell Scrolls'] }, failure: { text: 'Trap darts hit. +1 Health damage.' } },
      { id: 'avoid-traps-ruins', label: 'Avoid Traps', type: 'check-or-combat', stat: 'control', dd: 8, success: { renown: 'underworld', credits: 300 }, failure: { combat: 'Fight Guardians DD8|16 HP.' } },
    ],
  },
  {
    title: 'Black Market',
    text: 'A hidden asteroid market trades mods, intel, and contraband.',
    options: [
      { id: 'trade-black-market', label: 'Trade', type: 'cost', credits: 100, success: { renown: 'underworld', lootCategory: 'weapon_mods' } },
      { id: 'intel-black-market', label: 'Gather Intel', type: 'check-or-combat', stat: 'lead', dd: 6, success: { renown: 'corporations', revealHex: true, task: true }, failure: { combat: 'Fight 12 Pirates DD4|8 HP.' } },
    ],
  },
];

function applyEncounterRewards(reward) {
  if (!reward) return '';
  if (reward.task) {
    const task = createGalaxyTask('Galaxy Encounter', {
      title: reward.taskTitle || 'Generated Space Task',
      text: reward.taskText || 'Travel to the marked hex and resolve the assignment there.',
      reward: Object.assign({}, reward),
    });
    return task ? `Galaxy task marker placed at Hex ${task.hexId}. Rewards pay out on completion.` : 'No valid hex available for a Galaxy task marker.';
  }
  const notes = [];
  if (reward.text) notes.push(reward.text);
  if (reward.renown) {
    changeFactionRenown(reward.renown, 1);
    notes.push('+1 faction renown');
  }
  if (reward.revealHex) {
    const hidden = (S.starSystem.hexes || []).find(h => h.hiddenOutcome && !h.scanned);
    if (hidden) {
      hidden.scanned = true;
      hidden.explored = true;
      hidden.type = convertOutcomeToHexType(hidden.hiddenOutcome);
      hidden.detail = `${hidden.hiddenOutcome} signature revealed by encounter intel.`;
      notes.push(`Hex ${hidden.id} revealed`);
    }
  }
  if (reward.credits && typeof changeCredits === 'function') {
    changeCredits(reward.credits);
    notes.push(`+${reward.credits} credits`);
  }
  if (reward.creditsLoss && typeof changeCredits === 'function') {
    changeCredits(-reward.creditsLoss);
    notes.push(`-${reward.creditsLoss} credits`);
  }
  const lootDrops = [];
  if (Array.isArray(reward.loot)) lootDrops.push(...reward.loot);
  if (reward.lootFromMerchant) lootDrops.push(rollGalaxyMerchantLoot());
  lootDrops.forEach((item) => {
    if (item) takeGalaxyLoot(item, 'pack');
  });
  if (lootDrops.length) notes.push(`Loot: ${lootDrops.join(', ')}`);
  if (reward.text) applyGalaxyConditionText(reward.text);
  return notes.join(' · ');
}

const STAR_LOCATION_BY_RING = {
  inner: [
    'Helios Farm Relay',
    'Solar Mirror Foundry',
    'Sunline Data Shrine',
    'Thermal Crown Refinery',
  ],
  middle: [
    'Orbital Research Lattice',
    'Colony Ring Habitat',
    'Archive Habitat 7',
    'Merchant Halo Port',
  ],
  outer: [
    'Icebound Archive',
    'Graveyard Dock',
    'Drift Market Anchorage',
    'Warden Beacon Outpost',
  ],
};

const STAR_LOCATION_DETAILS = {
  inner: [
    { name: 'Helios Farm Relay', services: 'Fuel rationing, med-bay triage, seed vault contracts.', hook: 'The solar greenhouse is failing and needs escort parts from the middle ring.' },
    { name: 'Solar Mirror Foundry', services: 'Hull plating, reflective armor mods, precision tools.', hook: 'A mirror array now points at a forbidden moon colony at fixed dusk.' },
    { name: 'Sunline Data Shrine', services: 'Oracle archives, legal charter copies, encrypted comm access.', hook: 'A monk offers old collapse coordinates in exchange for recovering a stolen reliquary.' },
    { name: 'Thermal Crown Refinery', services: 'Standard fuel, reactor balancing, hazard pay missions.', hook: 'The refinery wants a team to clear raiders from a nearby processing spur.' },
  ],
  middle: [
    { name: 'Orbital Research Lattice', services: 'Prototype scanners, anomaly dossiers, science contracts.', hook: 'A lattice pod reports impossible life-sign loops from a sealed ring segment.' },
    { name: 'Colony Ring Habitat', services: 'Crew hiring hall, cargo swaps, social recovery downtime.', hook: 'A labor strike could become a skirmish unless both sides are escorted to talks.' },
    { name: 'Archive Habitat 7', services: 'Map libraries, old-world records, translation stations.', hook: 'An archive map points to a dead moon vault marked do-not-open.' },
    { name: 'Merchant Halo Port', services: 'Full trade post, ship repairs, cargo brokerage.', hook: 'A broker offers double pay if you carry disputed medicine through pirate space.' },
  ],
  outer: [
    { name: 'Icebound Archive', services: 'Cryo-storage vaults, emergency shelter, sparse intel.', hook: 'A frozen chamber contains a live distress capsule with a corporate kill order attached.' },
    { name: 'Graveyard Dock', services: 'Salvage market, black-ops buyers, recycled modules.', hook: 'A buyer requests proof from a derelict marked by your faction enemies.' },
    { name: 'Drift Market Anchorage', services: 'Contraband exchange, temporary docking, mercenary rumors.', hook: 'Three factions bid for the same artifact before sunset cycle.' },
    { name: 'Warden Beacon Outpost', services: 'Navigation relay, patrol logs, safe jump vectors.', hook: 'The beacon warns of an incoming militant convoy demanding inspections.' },
  ],
};

const STAR_SKIRMISH_CAUSES = [
  'territory dispute over fuel lanes',
  'religious blockade on pilgrim traffic',
  'salvage rights argument near a derelict belt',
  'retaliation after a broken escort contract',
  'spy extraction gone loud in open orbit',
  'debt enforcement by a pirate syndicate',
];

const STAR_SKIRMISH_STAKES = [
  'winner controls docking rights for 30 days',
  'loser pays 2d6x10 credits in reparations',
  'neutral colonies lose access to medicine',
  'trade route between two rings is cut',
  'hostages are executed if no deal is reached',
  'a major power will intervene if battle escalates',
];

const SPACE_HUB_STATIONS = ['Shuttle', 'Black Market', 'Moon Lab', 'Marshal Satellite', 'Small Port', 'Asteroid Bar'];
const SPACE_HUB_MODULES = ['Bridge', 'Engine Room', 'Cargo Hold', 'Crew Quarters', 'Medical Bay', 'Armory', 'Common Room', 'Observation Deck', 'Hangar', 'Hydroponics Garden', 'Communication Center', 'Navigation Room'];
const SPACE_HUB_ENGINE = ['Industrial Generator', 'Photovoltaic Solar Panel', 'Antimatter Dynamo', 'Fusion Reactor', 'Chemical Engine', 'Gravitational Wave Turbine'];
const SPACE_HUB_CREW = ['Mechanics', 'Scientists', 'Traders', 'Pirates', 'Marshals', 'Miners'];
const SPACE_HUB_FEATURES = ['cybernetic eye', 'silver vocalizer', 'scarred exo-arm', 'ritual tattoos', 'data veil', 'burned visor'];
const SPACE_HUB_JOBS = ['Escort pilgrims', 'Hunt pirates', 'Recover artifact', 'Break blockade', 'Map dead moon route', 'Deliver medicine'];
const SPACE_HUB_WANTS = ['New crew', 'Fuel', 'Way Parts', 'Credits', 'Data Crystals', 'Rumors'];

const MYSTERY_PROXIMITY = ['Far', 'Nearby', 'Close'];
const MYSTERY_DISPOSITION = ['Hostile', 'Indifferent', 'Friendly'];
const MYSTERY_SHIP_TYPES = ['Skiff', 'Transport', 'Frigate'];
const MYSTERY_CREWS = ['Nomad', 'Pirate', 'Merchant', 'Cultist', 'Corporate', 'Salvager'];
const MYSTERY_CREW_NAMES = ['Lian', 'Nora', 'Axe', 'Bell', 'Bink', 'Duni', 'Kasha', 'Suana', 'Huang', 'Miesha', 'Goran', 'Pae'];
const MYSTERY_QUIRKS = ['never swears', 'talks a lot', 'flirty', 'very polite', 'nosepicker', 'always eating'];
const MYSTERY_WANTS = ['Crew', 'Cargo', 'Credits', 'Fuel', 'Drugs', 'Women'];
const MYSTERY_JOBS = ['Holorum', 'Many Rings', 'War Paints', 'A lot of Piercings', 'Glowing Tattoos', 'Beastlike'];
const MYSTERY_TRADE = ['Cosmic Essential', 'Standard Fuel', 'Hub Jump Fuel', 'Hyperdrive Core', 'First-Aid Kit', 'Toolkit', 'Hack Data Drive', 'Spell Scrolls', 'Exocraft', 'Vehicle Mod', 'Ranged Weapon', 'Melee Weapon', 'Armor'];

const DEAD_MOON_MAP_MARKERS = {
  landing: { label: 'Landing Site', color: '#2ec4b6' },
  route: { label: 'Approach Route', color: '#6a6f86' },
  site: { label: 'Site of Interest', color: '#c9a227' },
  hazard: { label: 'Hazard', color: '#b05252' },
  loot: { label: 'Loot', color: '#e6d77a' },
  empty: { label: 'Dust', color: '#3b342f' },
};

const STAR_DOWNTIME_ACTIONS = {
  repairs: {
    label: 'Patch Ship Systems',
    check: 'Control vs DD6',
    success: () => {
      const maxShields = (S.starship.defendDie || 6) * 2;
      S.starship.shields = Math.max(0, Math.min(maxShields, (S.starship.shields || 0) - 2));
      updateStarshipUI();
      return 'Repairs hold. Reduce ship shield damage by 2.';
    },
    failure: () => {
      if (typeof changeStress === 'function') changeStress(1);
      return 'A coolant flare injures the team. +1 Health damage to the Wayfarer.';
    },
  },
  drill: {
    label: 'Run Crew Drill',
    check: 'Lead vs DD6',
    success: () => {
      if (typeof changeCounter === 'function') changeCounter('tmw', 1);
      return 'Crew cohesion improves. +1 Teamwork Point.';
    },
    failure: () => {
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      return 'Tempers flare during the drill. +1 Mental Stress.';
    },
  },
  salvage: {
    label: 'Sweep Nearby Debris',
    check: 'Mind vs DD8',
    success: () => {
      const credits = (roll(6) + 1) * 10;
      const fuelFound = roll(4) === 4;
      if (typeof changeCredits === 'function') changeCredits(credits);
      if (fuelFound) S.starship.fuel.standard = (S.starship.fuel.standard || 0) + 1;
      updateStarshipUI();
      return `Recovered caches worth ${credits} credits${fuelFound ? ' and 1 Standard Fuel.' : '.'}`;
    },
    failure: () => {
      if (typeof changeRads === 'function') changeRads(50);
      return 'Salvage team hits a hot pocket. +50 Radiation.';
    },
  },
  rest: {
    label: 'Quiet Rest Cycle',
    check: 'No roll',
    success: () => {
      if (typeof changeStress === 'function') changeStress(-1);
      if (typeof changeMentalStress === 'function') changeMentalStress(-2);
      return 'Crew decompresses. Recover 1 Health damage and 2 Mental Stress.';
    },
    failure: () => 'Rest completed without incident.',
  },
};

const DEAD_MOON_DIRECTIONS = {
  north: ['Tower', 'Wreckage', 'Forgotten Orchard', 'Collapsed Lab'],
  south: ['Dead Gateway', 'Abandoned Lab', 'Engine Room', 'Observation Dome'],
  east: ['Aerial Facility', 'Overgrown Ruins', 'Fuel Depot', 'Training Yard'],
  west: ['Quarry', 'Derelict Docking Bay', 'Echoing Halls', 'Bio-engine Vault'],
};

const DEAD_MOON_DIRECTION_CONTEXT = {
  north: 'Rough terrain and writhing netted tentacles under frequent violet lightning.',
  south: 'Burned plains around a twisted communications tower and shattered relics.',
  east: 'Monumental towers over bone-like terrain and scorched embankments.',
  west: 'Spare trees over broken ground and black water-fed shorelines.',
};

const DEAD_MOON_TRAVEL_EVENTS = {
  north: [
    'Purple lightning tears through the sky; Body save or suffer 2 stress.',
    'Skull shards crash from elevated ruins; Body vs DD6 or take d6 damage.',
    'Yellow hull fungus pulses in a black cloud; +1 Action cost for this leg.',
    'Insectoid swarm DD4 | 8 Health appears among twisted roots.',
  ],
  south: [
    'Slime-like moth swarm DD8 | 8 Health crawls from broken ducts.',
    'Chunks of metal rain down; Body save or struck for d10 damage.',
    'Echoing warning: execute lockdown. Automated wardens activate.',
    'Sire-Moths emerging from wreckage: DD8 | 8 Health.',
  ],
  east: [
    'Bone-shard winds strip exposed armor, movement slowed.',
    'Howl echoes in the distance: all gain +10 stress.',
    'Gaunt hounds descend from ribbed structures DD12 | 12 Health.',
    'Lifelike statues ignite with pale fire, forcing retreat lines.',
  ],
  west: [
    'Corpse of d10 grabber trees appears in the fog.',
    'Tirelike mutant striders and husked bodies block the path.',
    'Sonic-laced wind induces sudden fatigue for one phase.',
    'Insectoid tree colony DD10 | 20 Health stirs near black water.',
  ],
};

const DEAD_MOON_SITE_ENCOUNTERS = {
  north: ['Rusted sentry nest', 'Collapsed anti-orbital battery', 'Dormant cryo wing', 'Bone-stitched ward chamber'],
  south: ['Abandoned Lab', 'Armory', 'Living Quarters', 'Control Room', 'Research Station', 'Storage', 'Engine Room', 'Observation Dome', 'Security Checkpoint', 'Medical Bay'],
  east: ['Burning promenade', 'Fractured oracle hall', 'Ruined fuel catwalk', 'Collapsed defense chapel'],
  west: ['Quarry Loot Vault', 'Derelict Docking Ring', 'Echoing Hall of Masks', 'Bio-engine reliquary'],
};

const DEAD_MOON_LOOT = [
  'Biooculars', 'Camping Gear', 'Depressant', 'Water Filter', 'Fuel Tank (+3 Standard Fuel)', 'Antidote',
  'Laser Cutter (+d4 Shoot)', 'Data Crystals worth 50 credits', 'Pills (Heal d4)', 'Unknown geometric stack',
];

const DERELICT_SHIP_TYPES = ['Space Hub', 'Cruiser', 'Freighter', 'Frigate', 'Research Vessel', 'Shuttle', 'Troopship'];
const DERELICT_SHIP_STATUS = ['Habitable (Functioning)', 'Habitable (Non-Functioning)', 'Inhabitable (RadSuit Needed)'];
const DERELICT_ENGINE_STATUS = ['Unstable Core', 'Stable Engine', 'Thrusters', 'Jump Drive', 'Non-Functioning Engine'];
const DERELICT_MODULE_TABLE = [
  'COMMAND: single cockpit scarred by gunfire.',
  'LIFE SUPPORT: functional but unstable (all injuries/health/stress checks).',
  'COMPUTER: intact map of nearest random hexes.',
  'WEAPON: Laser Cutter (+d4 Shoot).',
  'WEAPON: Railgun (Ad6 Strike).',
  'JUMP DRIVE: salvageable (+3 Hub Jumps).',
  'HYPERDRIVE: salvageable (+3 random coordinate jumps).',
  'ENGINE: salvageable (+3 Standard Fuel).',
  'GALLEY: while here, find loot.',
  'BARRACKS: Traveling Wayfarer corpse and clues.',
  'MEDBAY: stocked but partially powered.',
  'LAB: quarantine zone, Body vs DD10 to enter safely.',
  'C-CHAMBER: filled with corpses. +10 Stress.',
  'CARGO HOLD: scavengers DD4 | 8 Health guarding cargo.',
  'ENGINE: d12 squatter cluster around warm conduits.',
];

const FACILITY_CHALLENGES = [
  'The site is in deep debt. Pay Debt: 2d6x10 Credits | Gain 1x Loot.',
  '1d6 Missing Person(s). 1-in-6 chance of encountering them in a Module.',
  '1 Grifter & d4 Goons (DD4 | 8 Health) seized resources and hide in a random Module.',
  'Acquire Resources. Gain credits based on the amount of Resources found.',
  'Eliminate Antagonist. A strange creature resides in a random Module.',
  'Find Missing Item. A Traveling Wayfarer lost a Random Item. 1-in-6 chance per Module.',
];

const FACILITY_CONNECTORS = ['service hatch', 'freight elevator', 'narrow gantry', 'maintenance corridor', 'sealed pressure door', 'spiral ramp'];
const FACILITY_MODULES = ['power core', 'research deck', 'cargo bay', 'hab quarter', 'reactor spine', 'data vault', 'observation deck', 'hydroponics'];
const FACILITY_ENCOUNTER_TYPES = ['Resource', 'Artifact', 'Hazard', 'Locked Access Point', 'Dread Event', 'Fixed Event', 'Discovery', 'Situation', 'Trigger/Obstacle', 'Antagonist'];
const FACILITY_DISPOSITIONS = ['wary', 'friendly', 'hostile', 'exhausted', 'silent', 'curious'];
const FACILITY_WORKERS = ['dockworkers', 'mechanics', 'scientists', 'traders', 'wardens', 'aug-techs'];
const FACILITY_ACTIONS = ['repairing', 'arguing over', 'cataloging', 'transporting', 'guarding', 'testing'];
const FACILITY_SUBJECTS = ['fuel tanks', 'data crates', 'damaged drones', 'sealed cargo', 'strange residue', 'navigation relays'];
const FACILITY_DREAD_EVENTS = [
  'There is nothing you can do. The darkness has come for you. Gain TAINT while at this site.',
  'What was that noise? All characters gain d4 Stress.',
  'A random character misplaces gear: Adventure Die vs DD6 or lose 1 Item.',
  'You are surrounded and alone. Any character that flees gains +d10 Stress.',
  'Paralyzing fear grips a random character; they cannot use Talents while at this site.',
  'All characters spend 1 Day Phase shooting at shadows.',
  'A random character hyperventilates, spending 1 Oxygen Pellet.',
  'A cosmic panic wave hits the crew. All characters gain +15 Stress.',
  'Shadows ambush the crew: d6 Shadows DD4 | 8 Health.',
  'Pain twists the soul. All characters take +1 Trauma.',
];
const FACILITY_TAINT = [
  'Max Health +5, but gain +1 Stress every module.',
  'Suffer +d4 when damaged, but permanently +2 Defend rolls.',
  'Weakened condition, but +5 to Defend rolls for the day.',
  '-2 all skill checks, but start each module with +1 to A.D. luck checks.',
  'Lose one Talent, gain +10 Path Tokens.',
  'Max Health steps down one die tier, but attacks deal +d10 damage.',
  'No Path Tokens while at site, but immune to Stress effects.',
  'Lose use of one arm (one-handed weapons only), but +10 Max Health.',
  '+1 Trauma every module, but advantage on non-combat checks.',
  'Blind, but immune to radiation.',
];
const FACILITY_FIXED_EVENTS = [
  'A random character sees impossible visions and gains d10 Stress; Mind check to avoid firing wildly.',
  'Corrosive moss-like growth threatens gear; Body/Agility check or lose random gear piece.',
  'A throne of bones stands in the center; Perception reveals a hidden skull-clue.',
  'Floor collapse opens into a deep shaft. No VaccSuit: d20 Stress per round.',
  'An insistent voice asks: "Why are you here?" Random character gains 5 Stress.',
  'Two crew feel followed. Gain 5 Stress.',
  'A figure is glimpsed leaving this room; pursuit finds nothing. Gain 5 Stress.',
  'Warm slime room with shivering eggs. Something is inside.',
  'All electronics and lights fail while inside this module.',
  'A random character is bitten by something unseen. +1 damage.',
];
const FACILITY_DISCOVERY = [
  'collapsed section with bodies beneath debris',
  'radiation leak',
  'bones scattered across the floor',
  'ruined science experiment',
  'dead creature torn apart',
  'holo-art projections on the wall',
  'murals of an ancient era',
  'towering statues',
  'unexpected fungal growth',
  'gravity shifting upside down',
  'magnetic force pulling you in',
  'magnetic force pushing you out',
  'teleport beacon to a random module',
  'tracks leading onward',
  'exit path toward landing pads',
  'pit leading to a lower module',
  'shaft rising to an upper module',
  'junk and debris everywhere',
  'strange atmospheric readings',
  'debris fields and fractured wiring',
];
const FACILITY_SITUATIONS = [
  'anxious crew hiding in a sealed alcove',
  'a medic triaging workers beside a coolant spill',
  'a prayer circle around a broken reactor idol',
  'traders refusing to move due to rumors of a beast',
  'two rival teams in a tense stand-off',
  'a survivor bargaining with hard drives and fuel rods',
  'a half-mad engineer mapping whispers in the walls',
  'security wardens guarding a blocked pressure gate',
  'a scavenger ring auctioning unknown artifacts',
  'a panicked convoy preparing immediate evacuation',
];
const FACILITY_TRIGGERS = [
  'narrow beam of intense light',
  'pressure plate hidden under dust',
  'motion detector tuned to vibration',
  'spherical microphone trap',
  'magnetic trigger coil',
  'heat detector tied to a charge line',
  'adrenaline sensor keyed to panic response',
  'metal detector sweeping for concealed gear',
];
const FACILITY_OBSTACLES = [
  'light refracts into lethal focus (d8 damage).',
  'memory-core dart trap deploys from nearby panel.',
  'auto-turret fires for one round before cooldown.',
  'short-burst EMP disables nearby electronics for d6 minutes.',
  'targeted explosion knocks the nearest character backward (d6 damage).',
  'hidden charge chain detonates (d12 damage to all nearby).',
  'security door lockout seals exits until bypassed.',
  'tracking darts mark all intruders for pursuit.',
];
const FACILITY_ROOM_TABLE = [
  'Docking Station', 'Security Station', 'Control Room', 'Living Quarters', 'Engine Room', 'Observation Dome',
  'Armory', 'Storage', 'Medical Bay', 'Research Station', 'Hydroponics', 'Maintenance Trench',
];
const FACILITY_SIZE_LABELS = {
  4: 'Small',
  6: 'Medium',
  8: 'Large',
};
const CREATURE_TYPES = ['Aberration', 'Synthetic', 'Local Fauna'];
const CREATURE_DRIVES = ['Territorial', 'Predation', 'Destructive', 'Parasitization'];
const CREATURE_ROLES = ['Brute', 'Lurker', 'Ranged', 'Swarm', 'Psychic'];
const CREATURE_INTELLIGENCE = ['Animal-like', 'Human-like', 'Above-human'];
const CREATURE_APPEARANCE = ['Avian', 'Arachnid', 'Insectoid', 'Apeish', 'Reptilian', 'Serpentine', 'Canine', 'Feline', 'Antilopine', 'Bovine', 'Cancrine', 'Chelonian', 'Amorphous', 'Ichthyic', 'Glirine', 'Octopine', 'Fungine', 'Plantlike', 'Petrous', 'Vermian'];
const CREATURE_COVERING = ['Scales', 'Feathered', 'Skin', 'Fur', 'Chitin', 'Crystals', 'Ooze', 'Stone'];
const CREATURE_FEATURE = ['Wings', 'Horns', 'Mane', 'Several mouths', 'Numerous limbs', 'Bright colors', 'Suckers', 'Tail', 'Tendrils', 'Translucent'];
const CREATURE_PSYCHIC_ABILITIES = ['Buffer', 'Control', 'Distressing', 'Dread', 'Inspire Terror', 'Mind Lash', 'Organize', 'Stun', 'Suffocate', 'Telekinetic Push'];
const CREATURE_ABILITIES = ['Acid Blood', 'Acid Spray', 'Carapace', 'Cleave/Spread Shot', 'Crawler', 'Dazzle', 'Drain', 'Entangle', 'Explosive', 'Flame Attack', 'Immune', 'Infectious', 'Metallic Claws', 'Paralyzing Bite/Shot', 'Putrid', 'Rebirth', 'Regenerate', 'Tough', 'Uncanny Speed', 'Vicious'];

function randomFacilityCode() {
  const a = ['Din', 'Tho', 'Kai', 'Vor', 'Hel', 'Ash', 'Nox', 'Ira'];
  const b = ['THo', 'VAR', 'ZEN', 'QAL', 'MIR', 'RON', 'PHA', 'UL'];
  return `${pick(a)}-${pick(b)} ${roll(999)}`;
}

function createFacilityChallengeState(sizeModules) {
  const rollResult = roll(6);
  const challenge = FACILITY_CHALLENGES[rollResult - 1];
  const targetLabelByRoll = {
    1: 'Debt cache / creditors',
    2: 'Missing person',
    3: 'Grifter and goons',
    4: 'Resource cache',
    5: 'Facility antagonist',
    6: 'Missing item',
  };
  return {
    roll: rollResult,
    text: challenge,
    specialRoomId: roll(sizeModules),
    targetLabel: targetLabelByRoll[rollResult] || 'Objective target',
    targetFound: false,
    resolved: false,
    debtCredits: (roll(6) + roll(6)) * 10,
    missingPeople: roll(6),
    resourceCredits: 0,
    modulesChecked: 0,
    itemFound: false,
  };
}

function createFacilityRoomEntry(challenge, roomId) {
  const encounterType = pick(FACILITY_ENCOUNTER_TYPES);
  const encounterState = createFacilityEncounterState(encounterType);
  const room = {
    id: roomId,
    connector: pick(FACILITY_CONNECTORS),
    module: FACILITY_ROOM_TABLE[roll(FACILITY_ROOM_TABLE.length) - 1],
    encounter: encounterType,
    result: encounterState.summary,
    encounterState,
    encounterLog: [],
    loot: rollGalaxyMerchantLoot(MYSTERY_TRADE),
    completed: false,
    revealed: false,
    specialTarget: roomId === challenge.specialRoomId,
    specialText: '',
  };
  if (room.specialTarget) {
    const specialByRoll = {
      1: 'Credit ledgers and the debt enforcer are here. Pay 2d6x10 Credits or seize 1 Loot and make enemies.',
      2: 'The missing person is here, shaken but alive. Escort them out to resolve the objective.',
      3: 'The grifter and d4 goons hold this room. Fight or bargain to reclaim the site.',
      4: 'A dense resource cache is here. Gain 2d6x10 Credits when secured.',
      5: `The site antagonist is here: ${generateFacilityAntagonist()}`,
      6: 'The missing item is here among the debris. Recover it to complete the job.',
    };
    room.specialText = specialByRoll[challenge.roll] || '';
  }
  if (challenge.roll === 2 || challenge.roll === 6) {
    room.perModuleChance = '1-in-6';
  }
  return room;
}

function createFacilityEncounterState(type) {
  if (type === 'Resource') {
    return {
      summary: 'Resource Node: crystalline seams hang from the ceiling.',
      actions: [
        { id: 'mine-resource', label: 'Mine Resource (Mind/Control DD8)', kind: 'check', statA: 'mind', statB: 'control', dd: 8, effect: 'resource-mine' },
      ],
    };
  }
  if (type === 'Artifact') {
    return {
      summary: `Artifact: ${pick(['a pre-collapse hololith', 'a quantum lockbox', 'a coded reliquary', 'a ceremonial exocore', 'an anthropological relic frame'])}.`,
      actions: [
        { id: 'analyze-artifact', label: 'Analyze Artifact (Control DD8)', kind: 'check', statA: 'control', statB: 'mind', dd: 8, effect: 'artifact-analyze' },
      ],
    };
  }
  if (type === 'Hazard') {
    return {
      summary: `Hazard: ${pick(['Psychic Disturbance', 'reactive gas leak', 'unstable flooring over a deep shaft', 'radiation-slick condensate'])}.`,
      actions: [
        { id: 'stabilize-hazard', label: 'Stabilize Hazard (Body/Control DD8)', kind: 'check', statA: 'body', statB: 'control', dd: 8, effect: 'hazard-stabilize' },
      ],
    };
  }
  if (type === 'Locked Access Point') {
    return {
      summary: 'Locked Access Point: hidden trigger and sealed entry controls.',
      actions: [
        { id: 'spot-trigger', label: 'Spot Trigger (Mind DD8)', kind: 'check', statA: 'mind', statB: 'lead', dd: 8, effect: 'lock-spot' },
        { id: 'disable-lock', label: 'Disable Lock (Control DD8)', kind: 'check', statA: 'control', statB: 'mind', dd: 8, effect: 'lock-disable' },
      ],
    };
  }
  if (type === 'Dread Event') {
    return {
      summary: 'Dread Event: unstable psychic echoes gather in this chamber.',
      actions: [
        { id: 'roll-dread', label: 'Roll Dread Event (d10)', kind: 'table', effect: 'dread-roll' },
      ],
    };
  }
  if (type === 'Fixed Event') {
    return {
      summary: 'Fixed Event node: deterministic weirdness with table-driven outcome.',
      actions: [
        { id: 'roll-fixed', label: 'Roll Fixed Event (d10)', kind: 'table', effect: 'fixed-roll' },
      ],
    };
  }
  if (type === 'Discovery') {
    return {
      summary: 'Discovery node: hidden structural or environmental reveal.',
      actions: [
        { id: 'roll-discovery', label: 'Roll Discovery (d20)', kind: 'table', effect: 'discovery-roll' },
      ],
    };
  }
  if (type === 'Situation') {
    return {
      summary: 'Situation: an active social or logistical problem in progress.',
      actions: [
        { id: 'resolve-situation', label: 'Resolve Situation (Lead/Spirit DD8)', kind: 'check', statA: 'lead', statB: 'spirit', dd: 8, effect: 'situation-resolve' },
      ],
    };
  }
  if (type === 'Trigger/Obstacle') {
    return {
      summary: 'Trigger/Obstacle: trap trigger linked to a hostile obstacle.',
      actions: [
        { id: 'detect-trigger', label: 'Detect Trigger (Mind DD8)', kind: 'check', statA: 'mind', statB: 'control', dd: 8, effect: 'trigger-detect' },
        { id: 'disarm-obstacle', label: 'Disarm Obstacle (Control DD8)', kind: 'check', statA: 'control', statB: 'mind', dd: 8, effect: 'trigger-disarm' },
      ],
    };
  }
  return {
    summary: `Antagonist: ${generateFacilityAntagonist()}`,
    actions: [
      { id: 'profile-antagonist', label: 'Profile Threat (Mind DD8)', kind: 'check', statA: 'mind', statB: 'lead', dd: 8, effect: 'antagonist-profile' },
      { id: 'engage-antagonist', label: 'Engage Antagonist', kind: 'combatcue', effect: 'antagonist-engage' },
    ],
  };
}

function resolveFacilityChallengeBranch(facility, module) {
  if (!facility || !facility.challenge || !module) return '';
  const c = facility.challenge;
  c.modulesChecked = (c.modulesChecked || 0) + 1;
  if (c.roll === 2) {
    const found = roll(6) === 1;
    if (found) c.targetFound = true;
    return found ? `Branch Check: Missing Person found in this module (1-in-6). Remaining missing count estimate: ${Math.max(0, c.missingPeople - 1)}.` : 'Branch Check: No missing person in this module (1-in-6 failed).';
  }
  if (c.roll === 4) {
    const credits = (roll(6) + roll(6)) * 10;
    c.resourceCredits = (c.resourceCredits || 0) + credits;
    return `Branch Check: Resource cache recovered (${credits} credits). Running total: ${c.resourceCredits}.`;
  }
  if (c.roll === 6) {
    const foundItem = roll(6) === 1;
    if (foundItem) {
      c.targetFound = true;
      c.itemFound = true;
      return 'Branch Check: Missing item located in this module (1-in-6).';
    }
    return 'Branch Check: Missing item not present in this module (1-in-6 failed).';
  }
  return module.specialTarget ? 'Branch Check: Objective target located in this module.' : '';
}

function createFacilityState() {
  const sizeTable = [
    { label: 'Small', modules: 4 },
    { label: 'Medium', modules: 6 },
    { label: 'Large', modules: 8 },
  ];
  const size = sizeTable[roll(sizeTable.length) - 1];
  const challenge = createFacilityChallengeState(size.modules);
  return {
    code: randomFacilityCode(),
    arrival: pick(['silent in low orbit', 'under sporadic weapons fire', 'half-powered and drifting', 'ringed by maintenance drones', 'flickering with unstable lights']),
    sizeLabel: size.label,
    sizeModules: size.modules,
    purpose: pick(['research', 'refining', 'military logistics', 'terraforming support', 'communications relay', 'bio-industrial']),
    description: pick(['a fractured moonlet', 'a drifting asteroid shard', 'an ion cloud', 'a ring of frozen debris', 'a dormant station skeleton']),
    structure: pick(['spindle-like', 'cathedral-like', 'radial', 'modular', 'terraced', 'fortified']),
    material: pick(['alloyed steel', 'carbon glass', 'ceramic composite', 'salvaged hull plating', 'reactive crystal']),
    quirk: pick(['Workers speak in coded chants.', 'Every hallway points toward a central shrine.', 'Gravity pulses unpredictably.', 'Doors only open in paired sequence.']),
    challenge,
    location: pick(['Docking Station', 'Maintenance Port', 'Habitat Spine', 'Cargo Airlock', 'Observation Concourse']),
    workersSeen: roll(6),
    leader: {
      name: pick(MYSTERY_CREW_NAMES),
      feature: pick(SPACE_HUB_FEATURES),
      job: pick(SPACE_HUB_JOBS),
    },
    modulesCompleted: 0,
    objectiveCompleted: false,
    moduleLog: Array.from({ length: size.modules }, (_, idx) => createFacilityRoomEntry(challenge, idx + 1)),
  };
}

function renderFacilityPanel() {
  const f = S.starSystem.activeFacility;
  const out = document.getElementById('starExplorationDetail');
  if (!f || !out) return;

  if (typeof f._currentModuleView !== 'number') f._currentModuleView = 0;

  const revealedModules = f.moduleLog.filter(module => module.revealed);
  const unrevealedCount = f.moduleLog.length - revealedModules.length;
  const currentIdx = revealedModules.length ? Math.min(f._currentModuleView, revealedModules.length - 1) : 0;
  const currentModule = revealedModules.length ? revealedModules[currentIdx] : null;

  const facilityDesc = `${f.sizeLabel} ${f.purpose} facility near ${f.description}. Challenge: ${f.challenge.text}. Find: ${f.challenge.targetLabel}.`;

  const moduleTabs = revealedModules.length
    ? `<div style="border:1px solid var(--border2);background:rgba(255,255,255,.02);padding:.35rem;margin-bottom:.25rem;">
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:.15rem;">Modules: ${revealedModules.length}/${f.moduleLog.length} explored</div>
        <div style="display:flex;gap:.15rem;flex-wrap:wrap;">${revealedModules.map((module, idx) => `<button class="btn btn-xs ${idx === currentIdx ? 'btn-teal' : ''}" style="padding:.15rem .25rem;font-size:.65rem;" onclick="S.starSystem.activeFacility._currentModuleView=${idx};renderFacilityPanel();">M${module.id}${module.completed ? '✓' : ''}</button>`).join('')}</div>
      </div>`
    : '';

  const moduleCard = currentModule
    ? `<div style="border:1px solid var(--border);background:rgba(255,255,255,.03);padding:.35rem;border-radius:2px;">
        <strong style="color:var(--gold2);">Module ${currentModule.id}: ${currentModule.module}</strong><br>
        <span style="font-size:.73rem;color:var(--muted2);">→ ${currentModule.connector} | ${currentModule.result}${currentModule.branchResult ? ' | ' + currentModule.branchResult : ''}</span>
        ${currentModule.specialText ? `<div style="font-size:.73rem;color:var(--gold2);margin-top:.15rem;"><strong>⊙ ${currentModule.specialText}</strong></div>` : ''}
        ${currentModule.encounterState && Array.isArray(currentModule.encounterState.actions) ? `<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.2rem;">${currentModule.encounterState.actions.map(action => `<button class="btn btn-xs ${action.resolved ? '' : 'btn-teal'}" onclick="resolveFacilityEncounterAction(${currentModule.id},'${action.id}')">${action.resolved ? '✓' : action.label}</button>`).join('')}</div>` : ''}
        ${Array.isArray(currentModule.encounterLog) && currentModule.encounterLog.length ? `<div style="font-size:.7rem;color:var(--muted2);margin-top:.15rem;line-height:1.3;">${currentModule.encounterLog.slice(0, 2).map(entry => `<div>• ${entry}</div>`).join('')}</div>` : ''}
        <div style="font-size:.73rem;color:var(--muted2);margin-top:.15rem;">Loot: <strong>${currentModule.loot}</strong></div>
        ${buildLootActions(currentModule.loot)}
        <div style="margin-top:.2rem;"><button class="btn btn-xs" onclick="completeFacilityModule(${currentModule.id})">${currentModule.completed ? '✓ Completed' : 'Mark Completed'}</button></div>
      </div>`
    : '<div style="font-size:.73rem;color:var(--muted2);">No modules explored yet.</div>';

  out.innerHTML = `
    <div style="font-size:.75rem;color:var(--gold2);margin-bottom:.3rem;">Galactic Facility ${f.code}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-bottom:.3rem;">${facilityDesc}</div>

    <div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-bottom:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="rollFacilityModule()">Explore Module</button>
      <button class="btn btn-xs" onclick="resolveFacilityObjective()">Complete Objective</button>
    </div>

    ${moduleTabs}
    ${moduleCard}
    <div style="font-size:.72rem;color:var(--muted2);margin-top:.25rem;">${unrevealedCount} module(s) remain.</div>
  `;
}

function completeFacilityModule(moduleId) {
  const f = S.starSystem.activeFacility;
  if (!f) return;
  const module = f.moduleLog.find(m => m.id === moduleId);
  if (!module) return;
  module.completed = true;
  if (module.specialTarget) f.challenge.targetFound = true;
  renderFacilityPanel();
}

function generateFacilityAntagonist() {
  const sizeRoll = roll(20);
  const typeRoll = roll(6);
  const intRoll = roll(10);
  const roleRoll = roll(10);
  let dread = 10;
  let hp = 20;
  let dmgMod = 0;
  let sizeLabel = 'Humanoid-sized';
  if (sizeRoll <= 3) { dread = 4; hp = 8; dmgMod = -2; sizeLabel = 'Rodent to Possum-sized'; }
  else if (sizeRoll <= 8) { dread = 6; hp = 12; dmgMod = -1; sizeLabel = 'Cat to Coyote-sized'; }
  else if (sizeRoll <= 16) { dread = 10; hp = 20; dmgMod = 0; sizeLabel = 'Humanoid-sized'; }
  else if (sizeRoll <= 18) { dread = 12; hp = 24; dmgMod = 1; sizeLabel = 'Gorilla-sized'; }
  else { dread = 20; hp = 40; dmgMod = 2; sizeLabel = 'Cow to Tiger-sized'; }

  const type = CREATURE_TYPES[typeRoll <= 2 ? 0 : typeRoll <= 4 ? 1 : 2];
  const drive = CREATURE_DRIVES[roll(4) - 1];
  const role = CREATURE_ROLES[Math.min(4, Math.floor((roleRoll - 1) / 2))];
  const intel = CREATURE_INTELLIGENCE[intRoll <= 7 ? 0 : intRoll <= 9 ? 1 : 2];
  const look = CREATURE_APPEARANCE[roll(20) - 1];
  const cover = CREATURE_COVERING[roll(8) - 1];
  const feature = CREATURE_FEATURE[roll(10) - 1];
  const ability = CREATURE_ABILITIES[roll(20) - 1];
  const psychic = role === 'Psychic' ? CREATURE_PSYCHIC_ABILITIES[roll(10) - 1] : null;

  return `${type} ${look} (${sizeLabel}) DD${dread} | ${hp} Health | Drive: ${drive} | Role: ${role} | Int: ${intel} | ${cover} hide, Feature: ${feature}, Ability: ${ability}${psychic ? ', Psychic: ' + psychic : ''}${dmgMod ? ', DMG Mod ' + (dmgMod > 0 ? '+' : '') + dmgMod : ''}.`;
}

function applyFacilityEncounterEffect(module, action, checkResult, success) {
  if (!module || !action) return 'No effect.';
  if (action.effect === 'resource-mine') {
    if (!success) return 'Mining failed. Crystal seam fractures and yields nothing.';
    const crystals = roll(6);
    const credits = crystals * 50;
    if (typeof changeCredits === 'function') changeCredits(credits);
    return `Mined ${crystals} Data Crystals (${credits} credits).`;
  }
  if (action.effect === 'artifact-analyze') {
    if (!success) {
      const outcome = pick(['dormant ward triggered', 'nearby sentinel awakened', 'comms scrambled for one phase', 'unstable pulse released']);
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      return `Artifact mishandled: ${outcome}. +1 Mental Stress.`;
    }
    const credits = (roll(6) + roll(6)) * 10;
    if (typeof changeCredits === 'function') changeCredits(credits);
    return `Artifact secured and sold for ${credits} credits.`;
  }
  if (action.effect === 'hazard-stabilize') {
    if (!success) {
      if (typeof changeStress === 'function') changeStress(1);
      return 'Hazard stabilization failed. +1 Health damage.';
    }
    return 'Hazard stabilized. Module safe for traversal.';
  }
  if (action.effect === 'lock-spot') {
    return success ? 'Trigger identified.' : 'Trigger remains hidden; obstacle stays armed.';
  }
  if (action.effect === 'lock-disable') {
    return success ? 'Access lock disabled. Module route opened.' : 'Disable attempt failed; local alarm escalates.';
  }
  if (action.effect === 'situation-resolve') {
    if (!success) return 'Situation worsens; negotiations collapse this phase.';
    if (typeof changeCounter === 'function') changeCounter('tmw', 1);
    return 'Situation resolved. +1 Teamwork Point.';
  }
  if (action.effect === 'trigger-detect') {
    return success ? 'Trigger detected and mapped.' : 'Trigger remains hidden.';
  }
  if (action.effect === 'trigger-disarm') {
    if (!success) {
      const obstacle = FACILITY_OBSTACLES[roll(8) - 1];
      return `Disarm failed: ${obstacle}`;
    }
    return 'Obstacle disarmed successfully.';
  }
  if (action.effect === 'antagonist-profile') {
    return success ? 'Threat profile completed; advantage on next engagement narrative.' : 'Threat profile failed; antagonist remains unpredictable.';
  }
  if (action.effect === 'antagonist-engage') {
    return 'Combat cue: engage antagonist on Combat/Ship pages.';
  }
  return success ? 'Success.' : 'Failure.';
}

function resolveFacilityEncounterAction(moduleId, actionId) {
  ensureStarsState();
  const f = S.starSystem.activeFacility;
  if (!f) return;
  const module = f.moduleLog.find(m => m.id === moduleId);
  if (!module || !module.encounterState || !Array.isArray(module.encounterState.actions)) return;
  const action = module.encounterState.actions.find(a => a.id === actionId);
  if (!action) return;
  if (!Array.isArray(module.encounterLog)) module.encounterLog = [];

  let log = '';
  if (action.kind === 'table') {
    if (action.effect === 'dread-roll') {
      const eventRoll = roll(10);
      const eventText = FACILITY_DREAD_EVENTS[eventRoll - 1];
      if (eventRoll === 1) {
        const taintRoll = roll(10);
        log = `Dread Event d10=${eventRoll}: ${eventText} TAINT d10=${taintRoll}: ${FACILITY_TAINT[taintRoll - 1]}`;
      } else {
        log = `Dread Event d10=${eventRoll}: ${eventText}`;
      }
    } else if (action.effect === 'fixed-roll') {
      const r = roll(10);
      log = `Fixed Event d10=${r}: ${FACILITY_FIXED_EVENTS[r - 1]}`;
    } else if (action.effect === 'discovery-roll') {
      const r = roll(20);
      log = `Discovery d20=${r}: ${FACILITY_DISCOVERY[r - 1]}`;
    }
  } else if (action.kind === 'combatcue') {
    log = applyFacilityEncounterEffect(module, action, null, true);
  } else {
    const statA = action.statA || 'mind';
    const statB = action.statB || null;
    const dd = action.dd || 8;
    const check = resolveGalaxySkillCheck(statA, statB, dd, action.label);
    const effectText = applyFacilityEncounterEffect(module, action, check, check.success);
    log = `${check.text}. ${check.success ? 'Success' : 'Failure'}: ${effectText}`;
  }

  module.encounterLog.push(log);
  action.resolved = true;
  renderFacilityPanel();
}

function rollFacilityModule() {
  ensureStarsState();
  const f = S.starSystem.activeFacility;
  const out = document.getElementById('starExplorationDetail');
  if (!f) {
    if (out) out.innerHTML = '<span style="color:var(--muted2);">No active facility. Roll Galactic Facility first.</span>';
    return;
  }
  if (f.modulesCompleted >= f.sizeModules) {
    if (out) out.innerHTML = '<span style="color:var(--gold2);">All modules explored. Resolve the site objective.</span>';
    return;
  }

  const nextRoom = f.moduleLog.find(module => !module.revealed);
  if (!nextRoom) return;
  f.modulesCompleted += 1;
  nextRoom.revealed = true;
  nextRoom.result = `You go through ${nextRoom.connector} and enter the ${nextRoom.module}. ${nextRoom.result}`;
  nextRoom.branchResult = resolveFacilityChallengeBranch(f, nextRoom);
  if (nextRoom.specialTarget) f.challenge.targetFound = true;
  renderFacilityPanel();
}

function resolveFacilityObjective() {
  ensureStarsState();
  const f = S.starSystem.activeFacility;
  const out = document.getElementById('starExplorationDetail');
  if (!f) return;
  if (f.objectiveCompleted) {
    if (out) out.innerHTML = '<span style="color:var(--muted2);">Objective already completed for this facility.</span>';
    return;
  }
  if (!f.challenge.targetFound && f.challenge.roll !== 1 && f.challenge.roll !== 4) {
    if (out) out.innerHTML = '<span style="color:var(--gold2);">The objective target has not been found yet. Explore more modules.</span>';
    return;
  }

  if (f.challenge.roll === 1) {
    if (typeof changeCredits === 'function') changeCredits(-f.challenge.debtCredits);
  }
  if (f.challenge.roll === 4 && f.challenge.resourceCredits > 0) {
    if (typeof changeCredits === 'function') changeCredits(f.challenge.resourceCredits);
  }

  f.objectiveCompleted = true;
  f.challenge.resolved = true;
  if (typeof changeCounter === 'function') changeCounter('renown', 1);
  showNotif('Facility objective completed: +1 Renown.', 'good');
  if (out) {
    out.innerHTML = `<div style="font-size:.75rem;color:var(--green2);">Objective completed for ${f.code}. +1 Renown granted.</div>`;
  }
}

function createDeadMoonState() {
  const direction = pick(Object.keys(DEAD_MOON_DIRECTIONS));
  const site = pick(DEAD_MOON_DIRECTIONS[direction]);
  return {
    direction,
    site,
    irradiated: roll(100) <= 25,
    exploredSteps: 0,
  };
}

function getDeadMoonDirectionProfile(direction) {
  const profiles = {
    north: { landing: '5-2', site: '0-2', title: 'North Approach', tableLabel: 'Tower / Wreckage / Forgotten Orchard / Collapsed Lab' },
    south: { landing: '0-2', site: '5-2', title: 'South Approach', tableLabel: 'Dead Gateway / Abandoned Lab / Engine Room / Observation Dome' },
    east: { landing: '2-0', site: '2-5', title: 'East Approach', tableLabel: 'Aerial Facility / Overgrown Ruins / Fuel Depot / Training Yard' },
    west: { landing: '2-5', site: '2-0', title: 'West Approach', tableLabel: 'Quarry / Derelict Docking Bay / Echoing Halls / Bio-engine Vault' },
  };
  return profiles[direction] || profiles.north;
}

function rollDeadMoonDirection() {
  ensureStarsState();
  const dm = S.starSystem.activeDeadMoon || createDeadMoonState();
  S.starSystem.activeDeadMoon = dm;
  dm.direction = pick(Object.keys(DEAD_MOON_DIRECTIONS));
  dm.site = pick(DEAD_MOON_DIRECTIONS[dm.direction]);
  S.starSystem.activeDeadMoonMap = createDeadMoonMapState(dm);
  const travel = pick(DEAD_MOON_TRAVEL_EVENTS[dm.direction]);
  const out = document.getElementById('starExplorationDetail');
  if (out) {
    out.innerHTML = `
      <div style="font-size:.75rem;color:var(--gold2);">Dead Moon Direction: ${dm.direction.toUpperCase()}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">${DEAD_MOON_DIRECTION_CONTEXT[dm.direction]}<br>d4 Travel Table: ${DEAD_MOON_TRAVEL_EVENTS[dm.direction].join(' | ')}<br>d4 Site Table: ${DEAD_MOON_DIRECTIONS[dm.direction].join(' | ')}<br>Rolled Travel Event: ${travel}<br>Site of Interest: <strong>${dm.site}</strong>${dm.irradiated ? '<br><span style="color:var(--red2);">Irradiated zone active: +d100 Rads/day without protection.</span>' : ''}</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
        <button class="btn btn-xs btn-teal" onclick="renderDeadMoonMapPanel()">Land & Explore 6x6 Map</button>
        <button class="btn btn-xs" onclick="rollDeadMoonDirection()">Roll New Direction</button>
      </div>`;
  }
}

function exploreDeadMoonSite() {
  ensureStarsState();
  const dm = S.starSystem.activeDeadMoon || createDeadMoonState();
  S.starSystem.activeDeadMoon = dm;
  dm.exploredSteps += 1;
  const direction = dm.direction || 'north';
  const room = pick(DEAD_MOON_SITE_ENCOUNTERS[direction]);
  const encounter = pick([
    'd10 Simiic Moths DD8 | 8 Health',
    'd6 Gaunt Hounds DD12 | 12 Health',
    'd10 Grabber Trees DD10 | 20 Health',
    'd4 Rust Sentinels DD12 | 24 Health',
    'No combat: echoes of the past (+5 Stress).',
    'A wandering Antagonist crosses the corridor.',
  ]);
  const loot = rollGalaxyMerchantLoot(DEAD_MOON_LOOT);
  const out = document.getElementById('starExplorationDetail');
  if (out) {
    out.innerHTML = `
      <div style="font-size:.75rem;color:var(--gold2);">Dead Moon Site Exploration ${dm.exploredSteps}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">Direction: <strong>${direction.toUpperCase()}</strong> · Site: <strong>${dm.site}</strong><br>Room/Event: ${room}<br>Encounter: ${encounter}<br>Loot: ${loot}</div>
      ${buildLootActions(loot)}
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
        <button class="btn btn-xs btn-teal" onclick="exploreDeadMoonSite()">Explore Next Room</button>
        <button class="btn btn-xs" onclick="rollDeadMoonDirection()">Change Direction</button>
      </div>`;
  }
}

function createDerelictShipState() {
  return {
    shipType: DERELICT_SHIP_TYPES[roll(7) - 1],
    status: DERELICT_SHIP_STATUS[Math.min(2, Math.floor((roll(10) - 1) / 4))],
    engine: DERELICT_ENGINE_STATUS[Math.min(4, Math.floor((roll(10) - 1) / 2))],
    survivorCount: roll(10) - 1,
    modules: Math.max(1, roll(8)),
    explored: 0,
    roomList: [],
    ruinCause: pick(['space debris', 'pirates', 'cannibalism', 'starvation', 'mob hit', 'system failure', 'loss of air', 'open hatch', 'uncontrollable fire']),
  };
}

function createSpaceHubState(ring) {
  const moduleCount = 4 + roll(3);
  const controller = pick((S.starSystem && Array.isArray(S.starSystem.majorPowers) && S.starSystem.majorPowers.length)
    ? S.starSystem.majorPowers
    : ['Unaligned Transit Authority']);
  return {
    code: randomFacilityCode(),
    ring: ring || 'middle',
    controller,
    stationType: pick(SPACE_HUB_STATIONS),
    modulesTotal: moduleCount,
    engine: pick(SPACE_HUB_ENGINE),
    crew: pick(SPACE_HUB_CREW),
    name: `${pick(['Eclipse', 'Tempest', 'Valefor', 'Murmur', 'Lago', 'Balam'])} Station`,
    crewCount: roll(10) * 10,
    workers: Array.from({ length: Math.max(1, roll(6)) }, () => ({
      disposition: pick(FACILITY_DISPOSITIONS),
      worker: pick(FACILITY_WORKERS),
      action: pick(FACILITY_ACTIONS),
      subject: pick(FACILITY_SUBJECTS),
    })),
    leader: {
      name: pick(MYSTERY_CREW_NAMES),
      feature: pick(SPACE_HUB_FEATURES),
      job: pick(SPACE_HUB_JOBS),
      want: pick(SPACE_HUB_WANTS),
      quirk: pick(MYSTERY_QUIRKS),
    },
    modules: [],
  };
}

function exploreSpaceHubModule() {
  ensureStarsState();
  const hub = S.starSystem.activeHub;
  if (!hub) return;
  if (hub.modules.length >= hub.modulesTotal) return renderSpaceHubPanel();
  const module = {
    id: hub.modules.length + 1,
    name: pick(SPACE_HUB_MODULES),
    event: pick([
      'Traveling Wayfarer seeks passage and offers local rumors.',
      'Black market exchange is underway behind sealed shutters.',
      'A patrol from the resident faction checks all cargo manifests.',
      'A crew dispute spills into the corridor.',
      'Maintenance alarms trigger a sudden lockdown.',
      'A merchant offers contraband refuel if paid in data crystals.',
    ]),
    loot: rollGalaxyMerchantLoot(MYSTERY_TRADE),
    completed: false,
  };
  hub.modules.push(module);
  renderSpaceHubPanel();
}

function completeSpaceHubModule(moduleId) {
  const hub = S.starSystem.activeHub;
  if (!hub) return;
  const module = hub.modules.find(m => m.id === moduleId);
  if (!module) return;
  module.completed = true;
  renderSpaceHubPanel();
}

function renderSpaceHubPanel() {
  const hub = S.starSystem.activeHub;
  const out = document.getElementById('starExplorationDetail');
  if (!hub || !out) return;
  if (typeof hub._currentModuleView !== 'number') hub._currentModuleView = 0;
  const moduleIdx = Math.max(0, Math.min(hub.modules.length - 1, hub._currentModuleView || 0));
  const currentModule = hub.modules[moduleIdx] || null;
  out.innerHTML = `
    <div style="font-size:.76rem;color:var(--gold2);margin-bottom:.2rem;">Space Hub: ${hub.name}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">
      Controlled By: <strong style="color:var(--teal);">${hub.controller}</strong><br>
      Station Type: <strong>${hub.stationType}</strong> · Engine: ${hub.engine} · Crew: ${hub.crew}<br>
      Leader: <strong>${hub.leader.name}</strong> (${hub.leader.feature}, ${hub.leader.quirk}) wants ${hub.leader.want} and offers job: ${hub.leader.job}.<br>
      Dockside: ${hub.workers.map(w => `${w.disposition} ${w.worker} ${w.action} ${w.subject}`).join(' · ')}
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="exploreSpaceHubModule()">Explore Hub Module</button>
      <button class="btn btn-xs" onclick="purchaseSpaceHubFuel('standard')">Refuel Standard +1 (200₵)</button>
      <button class="btn btn-xs" onclick="var task=createGalaxyTask('Space Hub',{title:'Hub Contract',text:'Carry a Holding-style contract package to the marked hex and report back through Space Hub channels.',reward:{renown:'corporations',globalRenown:1,lootFromMerchant:true}});if(task)showNotif('Galaxy task marker placed at Hex '+task.hexId+'.','good');">Generate Task</button>
    </div>
    <div style="margin-top:.35rem;display:grid;gap:.3rem;">
      ${hub.modules.length ? `<div style="display:flex;gap:.15rem;flex-wrap:wrap;">${hub.modules.map((module, idx) => `<button class="btn btn-xs ${idx === moduleIdx ? 'btn-teal' : ''}" style="padding:.15rem .3rem;font-size:.65rem;" onclick="S.starSystem.activeHub._currentModuleView=${idx};renderSpaceHubPanel();">M${module.id}${module.completed ? '✓' : ''}</button>`).join('')}</div>
      ${currentModule ? `<div style="padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
        <strong style="color:${currentModule.completed ? 'var(--green2)' : 'var(--gold2)'};">Module ${currentModule.id}: ${currentModule.name}</strong><br>
        ${currentModule.event}<br>
        Loot: ${currentModule.loot}
        ${buildLootActions(currentModule.loot)}
        <div style="margin-top:.2rem;"><button class="btn btn-xs" onclick="completeSpaceHubModule(${currentModule.id})">${currentModule.completed ? 'Completed' : 'Mark Completed'}</button></div>
      </div>` : ''}` : '<div style="font-size:.73rem;color:var(--muted2);">No modules explored yet.</div>'}
    </div>`;
}

function createGalaxyPerilState(ring) {
  const site = pick(STAR_PERIL_SITES);
  return {
    ring: ring || 'middle',
    title: site.title,
    text: site.text,
    check: site.check,
    dd: site.dd,
    success: site.success,
    cleared: false,
  };
}

function resolveGalaxyPerilTraversal() {
  ensureStarsState();
  const hex = getCurrentStarHex();
  const peril = (hex && getHexPersistentState(hex, 'peril', function() { return createGalaxyPerilState(hex.ring || 'middle'); })) || createGalaxyPerilState('middle');
  const check = resolveGalaxySkillCheck(peril.check[0], peril.check[1], peril.dd, 'Traversal Check');
  const out = document.getElementById('starExplorationDetail');
  if (check.success) {
    peril.cleared = true;
    S.starSystem.empoweredChecks = (S.starSystem.empoweredChecks || 0) + 1;
    setPositiveGalaxyCondition('empowered');
    applyGalaxyConditionText(peril.success);
    if (typeof addSuccessRoll === 'function') addSuccessRoll();
    if (out) {
      out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">⚠ ${peril.title}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.55;">${peril.text}<br>${check.text}<br><span style="color:var(--green2);">Success:</span> ${peril.success}</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;"><button class="btn btn-xs btn-teal" onclick="runGalaxyEncounterRoll()">Continue Exploring</button></div>`;
    }
    return;
  }

  const consequence = pick(STAR_PERIL_FAILURES);
  const consequenceText = consequence.apply(check.delta);
  loseGamePhases(1);
  if (typeof addTMWOnFail === 'function') addTMWOnFail();
  if (out) {
    out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">⚠ ${peril.title}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.55;">${peril.text}<br>${check.text}<br><span style="color:var(--red2);">Failure:</span> ${consequenceText} You cannot pass this phase.</div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;"><button class="btn btn-xs" onclick="resolveGalaxyPerilTraversal()">Retry Traversal</button></div>`;
  }
}

function createMysteryContactOptions(kind) {
  const found = STAR_CONTACT_ARCHETYPES.find(entry => entry.kind === kind);
  return (found ? found.options : STAR_CONTACT_ARCHETYPES[1].options).map((opt) => ({
    id: opt.id,
    label: opt.label,
    text: opt.text,
    check: opt.check || null,
    dd: opt.dd || 0,
    renown: opt.renown || null,
    trade: !!opt.trade,
    haggle: !!opt.haggle,
    steal: !!opt.steal,
    reveal: !!opt.reveal,
    contraband: !!opt.contraband,
    taskConfig: opt.taskConfig || null,
    payout: opt.payout || '',
    resolved: false,
  }));
}

function pickGalaxyContactArchetype(ring) {
  const weighted = [];
  STAR_CONTACT_ARCHETYPES.forEach((archetype) => {
    let weight = 1;
    if (archetype.kind === 'Royal Ship') weight = ring === 'inner' ? 3 : ring === 'middle' ? 2 : 1;
    if (archetype.kind === 'Merchant Ship') weight += 1;
    for (let index = 0; index < weight; index += 1) weighted.push(archetype);
  });
  return pick(weighted);
}

function buildMysteryMissionHookTask(mystery) {
  if (!mystery || !mystery.missionHook) return null;
  const taskMap = {
    'escort their convoy to a Space Hub': {
      title: 'Escort Convoy Route',
      text: 'Escort the convoy through the marked lane and report at the destination hub.',
      reward: { renown: 'corporations', globalRenown: 1, lootFromMerchant: true },
    },
    'hunt a pirate that has been shadowing them': {
      title: 'Shadow Pirate Hunt',
      text: 'Track the pirate shadowing this contact and break their pursuit route at the marked hex.',
      reward: { renown: 'military', globalRenown: 1, lootCategory: 'weapons' },
    },
    'recover a relic from a derelict they mapped': {
      title: 'Mapped Derelict Recovery',
      text: 'Travel to the marked derelict coordinates and recover the relic before scavengers arrive.',
      reward: { renown: 'religious', globalRenown: 1, lootCategory: 'cosmic' },
    },
    'deliver spare parts through a blockade': {
      title: 'Blockade Parts Run',
      text: 'Smuggle the requested parts through the marked route and complete the delivery intact.',
      reward: { renown: 'rebels', globalRenown: 1, lootCategory: 'toolkits' },
    },
  };
  return taskMap[mystery.missionHook] || null;
}

function mapMysteryMissionHook() {
  ensureStarsState();
  const mystery = S.starSystem.activeMystery;
  if (!mystery) return;
  const taskConfig = buildMysteryMissionHookTask(mystery);
  if (!taskConfig) return;
  if (mystery.missionTaskId && getGalaxyTaskById(mystery.missionTaskId)) {
    renderGalaxyTaskPanel(mystery.missionTaskId);
    return;
  }
  const task = createGalaxyTask(mystery.archetype, taskConfig);
  if (!task) return;
  mystery.missionTaskId = task.id;
  showNotif(`Mission hook mapped to Hex ${task.hexId}.`, 'good');
  renderGalaxyTaskPanel(task.id);
}

function createMysteryState(ring) {
  const archetype = pickGalaxyContactArchetype(ring);
  const disposition = pick(MYSTERY_DISPOSITION);
  return {
    ring: ring || 'middle',
    archetype: archetype.kind,
    archetypeSummary: archetype.summary,
    proximity: pick(MYSTERY_PROXIMITY),
    disposition,
    crewType: pick(MYSTERY_CREWS),
    shipType: pick(MYSTERY_SHIP_TYPES),
    shipName: `${pick(MYSTERY_CREW_NAMES)} ${pick(['Willow', 'Spark', 'Mourn', 'Drift', 'Halo'])}`,
    contacts: Array.from({ length: Math.max(1, roll(6)) }, () => ({
      name: pick(MYSTERY_CREW_NAMES),
      job: pick(MYSTERY_JOBS),
      want: pick(MYSTERY_WANTS),
      quirk: pick(MYSTERY_QUIRKS),
    })),
    trade: Array.from({ length: 3 }, () => rollGalaxyMerchantLoot(MYSTERY_TRADE)),
    offers: buildGalaxyMerchantOffers(archetype.kind),
    discountRate: isHexOnTradeRoute(S.starSystem.currentHexId) ? 0.1 : 0,
    options: createMysteryContactOptions(archetype.kind),
    missionHook: pick(['escort their convoy to a Space Hub', 'hunt a pirate that has been shadowing them', 'recover a relic from a derelict they mapped', 'deliver spare parts through a blockade']),
  };
}

function buyGalaxyMerchantOffer(index) {
  ensureStarsState();
  const mystery = S.starSystem.activeMystery;
  if (!mystery || !Array.isArray(mystery.offers)) return;
  const offer = mystery.offers[index];
  if (!offer) return;
  const cost = getOfferPrice(offer, mystery.discountRate || 0);
  if (typeof buyItem === 'function') {
    buyItem(cost, offer.name, offer.cat);
    return;
  }
  if ((S.credits || 0) < cost) {
    showNotif('Not enough credits!', 'warn');
    return;
  }
  const stored = addItemToBackpack(offer.name);
  if (!stored) {
    showNotif('Backpack full! Purchase cancelled.', 'warn');
    return;
  }
  if (typeof changeCredits === 'function') changeCredits(-cost);
  else S.credits = Math.max(0, (S.credits || 0) - cost);
  showNotif(offer.name + ' is now in Backpack (−' + cost + '₵)', 'good');
}

function resolveMysteryContactOption(optionId) {
  ensureStarsState();
  const mystery = S.starSystem.activeMystery;
  if (!mystery) return;
  const option = (mystery.options || []).find(o => o.id === optionId);
  if (!option || option.resolved) return;
  const out = document.getElementById('starExplorationDetail');

  function finishMysteryResolution(summary, tone) {
    option.resolved = true;
    mystery.resolved = true;
    S.starSystem.activeMystery = null;
    if (out) {
      out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">Encounter Resolved: ${mystery.archetype}</div><div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">Option: ${option.label}. ${summary}</div>`;
    }
    renderStarSystemMap();
    updateStarSystemReadouts();
    showNotif(summary, tone || 'good');
  }

  function getMysteryResolveRenownKey() {
    if (option.renown) return option.renown;
    if (option.taskConfig && option.taskConfig.reward && option.taskConfig.reward.renown) return option.taskConfig.reward.renown;
    if (mystery.archetype === 'Royal Ship') return 'political';
    if (mystery.archetype === 'Merchant Ship') return 'corporations';
    if (mystery.archetype === 'Black Market Ship' || mystery.archetype === 'Bandit Ship') return 'underworld';
    return '';
  }

  function awardMysteryResolveBonus() {
    const notes = [];
    const renownKey = getMysteryResolveRenownKey();
    if (renownKey) {
      changeFactionRenown(renownKey, 1);
      notes.push(`+1 ${(FACTION_NAMES && FACTION_NAMES[renownKey]) || renownKey} Renown`);
    }
    let loot = '';
    if (option.steal && mystery.offers && mystery.offers.length) {
      loot = pick(mystery.offers).name;
    } else if (option.taskConfig && option.taskConfig.reward && option.taskConfig.reward.lootCategory) {
      loot = rollGalaxyMerchantLootFromCategories([option.taskConfig.reward.lootCategory]);
    } else if (option.taskConfig && option.taskConfig.reward && option.taskConfig.reward.lootFromMerchant) {
      loot = rollGalaxyMerchantLoot();
    } else if (roll(6) >= 4) {
      const credits = roll(6) * 10;
      if (typeof changeCredits === 'function') changeCredits(credits);
      else S.credits = (S.credits || 0) + credits;
      notes.push(`+${credits} credits`);
    } else {
      loot = rollGalaxyMerchantLoot();
    }
    if (loot) {
      takeGalaxyLoot(loot, 'pack');
      notes.push(`Loot: ${loot}`);
    }
    return notes.join(' · ');
  }

  if (option.payout === 'creditsLoss') {
    const fee = (roll(6) + roll(6)) * 10;
    if ((S.credits || 0) < fee) {
      showNotif(`Not enough credits to pay ${fee}.`, 'warn');
      return;
    }
    if (typeof changeCredits === 'function') changeCredits(-fee);
    if (mystery.archetype === 'Royal Ship') {
      pushRoyalShipLogEntry('pay', `Paid ${fee} credits tariff. Passed peacefully.`);
    }
    finishMysteryResolution(`You pay ${fee} credits and continue safely.`, 'good');
    return;
  }
  if (option.payout === 'banditPay') {
    if ((S.credits || 0) < 100) {
      showNotif('Not enough credits to pay tribute.', 'warn');
      return;
    }
    if (typeof changeCredits === 'function') changeCredits(-100);
    finishMysteryResolution('You lose 100 credits but avoid escalation.', 'good');
    return;
  }
  if (option.trade) {
    const shopBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('shop'\"]");
    if (shopBtn && typeof switchTab === 'function') switchTab('shop', shopBtn);
    finishMysteryResolution('Trade concluded. Merchant inventory is now open in the Merchant tab.', 'good');
    return;
  }
  if (option.contraband) {
    const shopBtn = document.querySelector("nav .tab-btn[onclick*=\"switchTab('shop'\"]");
    if (shopBtn && typeof switchTab === 'function') switchTab('shop', shopBtn);
    finishMysteryResolution('Contraband deal concluded. Merchant inventory is now open in the Merchant tab.', 'good');
    return;
  }

  const check = option.check ? resolveGalaxySkillCheck(option.check, option.check === 'lead' ? 'mind' : 'lead', option.dd, option.label) : { success: true, text: option.label, delta: 1 };
  if (check.success) {
    let summary = `${check.text}. Success.`;
    if (option.reveal) {
      const hidden = (S.starSystem.hexes || []).find(h => h.hiddenOutcome && !h.scanned);
      if (hidden) {
        hidden.scanned = true;
        hidden.explored = true;
        hidden.type = convertOutcomeToHexType(hidden.hiddenOutcome);
        hidden.detail = `${hidden.hiddenOutcome} signature revealed through black market intelligence.`;
      }
      const task = option.taskConfig ? createGalaxyTask(mystery.archetype, option.taskConfig) : null;
      const bonus = awardMysteryResolveBonus();
      summary = `${check.text}. Hidden signature revealed.${task ? ` Galaxy task marker placed at Hex ${task.hexId}.` : ''}${bonus ? ` ${bonus}.` : ''}`;
    } else {
      const task = option.taskConfig ? createGalaxyTask(mystery.archetype, option.taskConfig) : null;
      if (mystery.archetype === 'Royal Ship' && option.id === 'charter') {
        pushRoyalShipLogEntry('charter', `${check.text}. Royal task issued.${task ? ` Marker at Hex ${task.hexId}.` : ''}`);
      }
      const bonus = awardMysteryResolveBonus();
      summary = `${check.text}. Success.${task ? ` Galaxy task marker placed at Hex ${task.hexId}.` : ''}${bonus ? ` ${bonus}.` : ''}`;
    }
    finishMysteryResolution(summary, 'good');
    return;
  }

  if (mystery.archetype === 'Royal Ship' && option.id === 'charter') {
    pushRoyalShipLogEntry('charter-fail', `${check.text}. Charter request refused.`);
  }
  finishMysteryResolution(`${check.text}. Failure. ${option.steal ? 'Hostiles respond; go to Combat/Ship pages to resolve.' : 'Negotiation collapses this phase.'}`, 'warn');
}

function resolveSpaceEncounterOption(optionId) {
  ensureStarsState();
  const encounter = S.starSystem.activeSpaceEncounter;
  if (!encounter || !Array.isArray(encounter.options)) return;
  const option = encounter.options.find(o => o.id === optionId);
  if (!option || option.resolved) return;
  const out = document.getElementById('starExplorationDetail');

  function getResolveRenownKey() {
    if (option.success && option.success.renown) return option.success.renown;
    const lower = String(encounter.title || '').toLowerCase();
    if (lower.indexOf('black market') >= 0 || lower.indexOf('pirate') >= 0) return 'underworld';
    if (lower.indexOf('merchant') >= 0 || lower.indexOf('distress beacon') >= 0) return 'corporations';
    if (lower.indexOf('ruins') >= 0 || lower.indexOf('anomaly') >= 0) return 'religious';
    return 'political';
  }

  function grantResolveOptionSuccessBonus() {
    const notes = [];
    if (!(option.success && option.success.renown)) {
      const renownKey = getResolveRenownKey();
      if (renownKey) {
        changeFactionRenown(renownKey, 1);
        notes.push(`+1 ${(FACTION_NAMES && FACTION_NAMES[renownKey]) || renownKey} Renown`);
      }
    }

    const hasRewardPayload = !!(option.success && (
      option.success.credits ||
      option.success.lootCategory ||
      option.success.lootFromMerchant ||
      (Array.isArray(option.success.loot) && option.success.loot.length)
    ));

    if (!hasRewardPayload) {
      if (roll(6) >= 4) {
        const credits = roll(6) * 10;
        if (typeof changeCredits === 'function') changeCredits(credits);
        else S.credits = (S.credits || 0) + credits;
        notes.push(`+${credits} credits`);
      } else {
        const loot = rollGalaxyMerchantLoot();
        if (loot) {
          takeGalaxyLoot(loot, 'pack');
          notes.push(`Loot: ${loot}`);
        }
      }
    }
    return notes.join(' · ');
  }

  if (option.type === 'cost') {
    const cost = option.credits || 0;
    if (cost > 0 && (S.credits || 0) < cost) {
      showNotif(`Not enough credits to pay ${cost}.`, 'warn');
      return;
    }
    if (cost > 0 && typeof changeCredits === 'function') changeCredits(-cost);
    option.resolved = true;
    encounter.resolved = true;
    S.starSystem.activeSpaceEncounter = null;
    let rewardText = '';
    try {
      rewardText = applyEncounterRewards(option.success);
    } catch (err) {
      rewardText = 'Rewards applied with warnings.';
    }
    if (out) out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">Encounter Resolved: ${encounter.title}</div><div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">Option: ${option.label}. ${cost ? `Cost paid: ${cost} credits.` : ''} ${rewardText}</div>`;
    renderStarSystemMap();
    updateStarSystemReadouts();
    showNotif(`Encounter resolved: ${encounter.title}`, 'good');
    return;
  }

  const check = resolveGalaxySkillCheck(option.stat || 'lead', option.stat === 'lead' ? 'mind' : 'lead', option.dd || 6, option.label);
  if (check.success) {
    option.resolved = true;
    encounter.resolved = true;
    S.starSystem.activeSpaceEncounter = null;
    let rewardText = '';
    try {
      rewardText = applyEncounterRewards(option.success);
    } catch (err) {
      rewardText = 'Encounter resolved, but reward text could not be fully rendered.';
    }
    const bonusText = grantResolveOptionSuccessBonus();
    if (out) out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">Encounter Resolved: ${encounter.title}</div><div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">${check.text}. Success. ${rewardText}${bonusText ? ` ${bonusText}.` : ''}</div>`;
    renderStarSystemMap();
    updateStarSystemReadouts();
    showNotif(`Encounter resolved: ${encounter.title}`, 'good');
    return;
  }

  if (option.failure && option.failure.text) {
    applyGalaxyFailureText(option.failure.text);
  }

  if (out) {
    option.resolved = true;
    encounter.resolved = true;
    S.starSystem.activeSpaceEncounter = null;
    out.innerHTML = `<div style="font-size:.75rem;color:var(--gold2);">Space Encounter: ${encounter.title}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">${check.text}. Failure. ${(option.failure && option.failure.combat) ? option.failure.combat + ' Resolve on Combat/Ship pages.' : (option.failure && option.failure.text) ? option.failure.text : 'The window closes.'}</div>`;
    renderStarSystemMap();
    updateStarSystemReadouts();
  }
  showNotif(`Encounter failed: ${encounter.title}`, 'warn');
}

function renderSpaceEncounterPanel() {
  const encounter = S.starSystem.activeSpaceEncounter;
  const out = document.getElementById('starExplorationDetail');
  if (!encounter || !out) return;
  out.innerHTML = `
    <div style="font-size:.75rem;color:var(--gold2);">Space Encounter: ${encounter.title}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.15rem;">${encounter.text}</div>
    <div style="display:grid;gap:.25rem;margin-top:.35rem;">${encounter.options.map(opt => `<div style="padding:.3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <strong style="color:var(--text);">${opt.label}</strong><br>
      <span style="font-size:.72rem;color:var(--muted2);">${opt.type === 'cost' ? `Pay ${opt.credits || 0} credits.` : `Check ${String(opt.stat || 'lead').toUpperCase()} vs DD${opt.dd || 6}.`} ${opt.failure && opt.failure.combat ? 'Failure may trigger combat.' : ''}</span><br>
      <button class="btn btn-xs ${opt.resolved ? '' : 'btn-teal'}" style="margin-top:.2rem;" onclick="resolveSpaceEncounterOption('${opt.id}')">${opt.resolved ? 'Resolved' : 'Resolve Option'}</button>
    </div>`).join('')}</div>`;
}

function renderMysteryPanel() {
  const mystery = S.starSystem.activeMystery;
  const out = document.getElementById('starExplorationDetail');
  if (!mystery || !out) return;
  if (!mystery.missionTaskId) {
    const missionTask = buildMysteryMissionHookTask(mystery);
    if (missionTask) {
      const task = createGalaxyTask(mystery.archetype, missionTask);
      if (task) mystery.missionTaskId = task.id;
    }
  }
  out.innerHTML = `
    <div style="font-size:.92rem;color:var(--gold2);margin-bottom:.2rem;">Mystery Contact: ${mystery.shipName}</div>
    <div style="font-size:.84rem;color:var(--muted2);line-height:1.6;">
      <strong>${mystery.archetype}</strong> · ${mystery.archetypeSummary}<br>
      ${mystery.crewType} ${mystery.shipType} at ${mystery.proximity} range. Disposition: <strong>${mystery.disposition}</strong>.<br>
      Mission Hook: ${mystery.missionHook}.
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.3rem;">
      <button class="btn btn-xs btn-teal" onclick="mapMysteryMissionHook()">Map Mission Hook</button>
      ${mystery.missionTaskId ? `<button class="btn btn-xs" onclick="renderGalaxyTaskPanel('${mystery.missionTaskId}')">Open Mission Task</button>` : ''}
    </div>
    <div style="margin-top:.35rem;display:grid;gap:.3rem;">
      ${mystery.contacts.map((contact, idx) => `<div style="padding:.3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
        <strong style="color:var(--teal);">${contact.name}</strong> · ${contact.job}<br>
        Wants: ${contact.want} · Quirk: ${contact.quirk}
      </div>`).join('')}
    </div>
    <div style="margin-top:.35rem;padding-top:.35rem;border-top:1px solid var(--border);">
      <div class="sub-label">Trade Items</div>
      ${mystery.offers && mystery.offers.length ? mystery.offers.map((offer, index) => `<div style="padding:.35rem 0;border-bottom:1px dotted var(--border2);display:grid;gap:.15rem;">
        <div><strong style="color:var(--text);">${offer.name}</strong> ${offer.stat ? `· ${offer.stat}` : ''}</div>
        <div style="font-size:.78rem;color:var(--muted2);line-height:1.45;">${offer.desc || 'Merchant-tab inventory item.'}</div>
        <div style="display:flex;gap:.25rem;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-xs btn-teal" onclick="buyGalaxyMerchantOffer(${index})">Buy ${getOfferPrice(offer, mystery.discountRate || 0)}₵</button>
          <span style="font-size:.74rem;color:${mystery.discountRate ? 'var(--green2)' : 'var(--muted2)'};">${mystery.discountRate ? 'Haggled price active' : `Base ${offer.cost || 0}₵`}</span>
        </div>
      </div>`).join('') : mystery.trade.map(item => `<div style="padding:.25rem 0;border-bottom:1px dotted var(--border2);">${item}${buildLootActions(item)}</div>`).join('')}
    </div>`;
  out.innerHTML += `<div style="margin-top:.35rem;padding-top:.35rem;border-top:1px solid var(--border);display:flex;gap:.25rem;flex-wrap:wrap;">${(mystery.options || []).map(opt => `<button class="btn btn-xs ${opt.resolved ? '' : 'btn-teal'}" ${opt.resolved ? 'disabled style="opacity:.55;cursor:default;"' : `onclick="resolveMysteryContactOption('${opt.id}')"`}>${opt.resolved ? 'Resolved' : opt.label}</button>`).join('')}</div>`;
}

function rollPlanetExploration() {
  ensureStarsState();
  const hex = getCurrentStarHex();
  if (!hex || hex.type !== 'planet' || !hex.scanned) {
    showNotif('Scan the planet before starting surface exploration.', 'warn');
    return;
  }
  const profile = ensurePlanetProfile(hex);
  S.starSystem.activePlanetHexId = hex.id;
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const d10 = roll(10);
  const outcome = PLANETSIDE_EXPLORATION_TABLE[Math.min(PLANETSIDE_EXPLORATION_TABLE.length - 1, d10 - 1)] || 'Find';
  let detail = '';
  let rewardItem = '';
  let affectedCell = null;

  const availableCells = state.cells.filter((cell) => cell.id !== state.landedCellId);
  const targetCell = availableCells.length ? pick(availableCells) : state.cells[0];

  if (outcome === 'Find') {
    rewardItem = rollGalaxyMerchantLoot();
    takeGalaxyLoot(rewardItem, 'pack');
    detail = `Recovered ${rewardItem} near the ${profile.wonder}.`;
  } else if (outcome === 'Hazard') {
    detail = `${profile.terrainEffect} Make an Action Die test vs DD8 before pushing deeper.`;
    if (targetCell) {
      targetCell.marker = 'hazard';
      targetCell.feature = targetCell.feature || 'Hazard line';
      targetCell.note = `Hazard sighted: ${profile.terrainEffect}`;
      affectedCell = targetCell;
    }
  } else if (outcome === 'Beast') {
    detail = `${profile.fauna} surge from cover. Action Die vs DD8 to outmaneuver them or take Stress.`;
    if (targetCell) {
      targetCell.marker = 'hazard';
      targetCell.feature = 'Fauna migration';
      targetCell.note = `Wildlife threat: ${profile.fauna}.`;
      affectedCell = targetCell;
    }
  } else if (outcome === 'Close Encounter') {
    const wayfarer = createPlanetWayfarer(state, targetCell, 'encounter');
    detail = `You meet ${wayfarer.name}, a roaming ${wayfarer.role}, near the ${profile.form}.`;
    affectedCell = targetCell;
  } else if (outcome === 'Pirate') {
    detail = `Pirate traces circle the landing zone. Expect tribute, pursuit, or an ambush.`;
  } else if (outcome === 'Empty Colony') {
    if (targetCell) {
      targetCell.marker = 'empty_colony';
      targetCell.feature = targetCell.feature || 'Silent colony quarter';
      targetCell.note = 'Abandoned colony sectors mapped. Functions like a Dwelling-style refuge once secured.';
      affectedCell = targetCell;
    }
    detail = 'An abandoned colony lies open. Salvage and unanswered records remain. It can become a Dwelling-style refuge once stabilized.';
  } else if (outcome === 'Merchant Colony') {
    if (targetCell) {
      targetCell.marker = 'merchant_colony';
      targetCell.feature = targetCell.feature || 'Merchant colony ring';
      targetCell.note = 'Merchant colony established. Functions like a Holding-style trade hub.';
      affectedCell = targetCell;
    }
    detail = 'A merchant colony is active here. It works like a Holding-style trade hub and can generate contracts.';
  } else if (outcome === 'Skirmish') {
    detail = `Two forces are already fighting over the surface route. Choose a side or stay low.`;
  } else {
    detail = `A galactic facility sits somewhere beyond the ${profile.terrain}. Secure access before entry.`;
  }
  state.lastEvent = {
    timestamp: Date.now(),
    d10,
    outcome,
    detail,
    rewardItem,
    cellId: affectedCell ? affectedCell.id : null,
  };
  state.eventLog = Array.isArray(state.eventLog) ? state.eventLog : [];
  state.eventLog.unshift(state.lastEvent);
  state.eventLog = state.eventLog.slice(0, 8);
  if (affectedCell) state.selectedCellId = affectedCell.id;
  computePlanetTradeRoutes(state);

  renderPlanetExplorationPanel();
  showNotif(`Planet exploration: ${outcome}.`, 'good');
}

const PLANET_SURFACE_TERRAINS = [
  'Crystal Flats', 'Ash Dunes', 'Frozen Barrens', 'Sulfur Cliffs', 'Glass Canyons',
  'Basalt Fields', 'Storm Jungle', 'Acid Marsh', 'Iridescent Ridge', 'Orbital Debris Plain'
];
const PLANET_SURFACE_FEATURES = [
  'Survey Beacon', 'Abandoned Relay', 'Collapsed Habitat', 'Pirate Cache', 'Ancient Vault',
  'Trade Outpost', 'Storm Shelter', 'Mining Camp', 'Signal Tower', 'Buried Monolith'
];
const PLANET_SURFACE_ROWS = 12;
const PLANET_SURFACE_COLS = 12;

const PLANET_SURFACE_WEATHER = {
  spring: [
    { label: 'Clear and Warm', rough: false, desc: 'Blue sky and steady visibility. Near-perfect for traversal.' },
    { label: 'Dust Crosswind', rough: true, desc: 'Dust sheets slash across the route and hide hazards.', check: 'lead', dd: 6, failure: '+1 Stress and lose route clarity.' },
    { label: 'Static Front', rough: true, desc: 'Ionized air causes sensor jitter and suit chatter.', check: 'control', dd: 8, failure: '+1 Mental Stress from comm noise.' },
  ],
  harvest: [
    { label: 'Scorch Light', rough: false, desc: 'Harsh bright conditions, but terrain reads cleanly.' },
    { label: 'Thermal Shear', rough: true, desc: 'Hot/cold pressure bands destabilize footing.', check: 'body', dd: 8, failure: '+1 Health damage from exposure.' },
    { label: 'Ash Veil', rough: true, desc: 'Microparticles obscure landmarks and clog vents.', check: 'lead', dd: 8, failure: '+1 Stress and lose a safe line.' },
  ],
  winter: [
    { label: 'Still Frost', rough: false, desc: 'Low turbulence. Movement is slow but predictable.' },
    { label: 'Whiteout Surge', rough: true, desc: 'Visibility collapses under intense weather bloom.', check: 'mind', dd: 8, failure: '+1 Mental Stress and backtrack.' },
    { label: 'Radiant Squall', rough: true, desc: 'An ion storm lashes the surface with charged debris.', check: 'control', dd: 10, failure: '+50 Radiation and +1 Stress.' },
  ],
};

const PLANET_ENCOUNTER_ARCHETYPES = {
  holding: ['Orbital Dockhold', 'Fuel Silo Bastion', 'Signal Keep', 'Transit Anchorage'],
  ruins: ['Collapsed Arcology', 'Broken Relay Spire', 'Ancient Terraform Vault', 'Submerged Colony Block'],
  monument: ['Gravity Obelisk', 'Prism Beacon', 'Echo Pillar', 'Sunline Array'],
  beast: ['Glass Serpents', 'Ash Hounds', 'Void Raptors', 'Spore Leviathans'],
  pirate: ['Corsair Skiff', 'Raid Camp', 'Tribute Gate', 'Black-Market Scouts'],
};

const PLANET_HOLDING_STRUCTURES = ['Fortress', 'Citadel', 'Sky Bastion', 'Dock Keep', 'Transit Stronghold'];
const PLANET_HOLDING_REST_BOONS = [
  'Resting here grants Protected (Defend ↑ one Step).',
  'Resting here grants Bolstered (Body ↑ one Step).',
  'Resting here grants Focused (Mind ↑ one Step).',
  'Resting here removes 1 Stress if the lane remains secure.',
];
const PLANET_HOLDING_MOODS = ['Distrust', 'Alert', 'Reverent', 'Pragmatic', 'Wary', 'Resolute'];
const PLANET_HOLDING_CRISES = [
  'Reinforce Loyalty',
  'Escort a Missing Envoy',
  'Break a Smuggler Ring',
  'Restore Route Beacons',
  'Settle Council Rivalry',
];
const PLANET_HOLDING_CRISES_TEXT = [
  'Earn trust within the council. A traitor is suspected.',
  'A messenger from the Seat vanished before reaching this lane.',
  'Contraband brokers are buying guards and rerouting supply crates.',
  'The weather ate the marker grid and cargo lanes keep drifting.',
  'Two wardens contest authority while raiders test the perimeter.',
];
const PLANET_HOLDING_CHARACTER = ['Industrious Tomb', 'Scarred Diplomat', 'Quiet Hawk', 'Iron Witness', 'Vigilant Broker'];
const PLANET_HOLDING_FOCUS = ['Trade and Bazaars', 'Military Drills', 'Pilgrim Traffic', 'Archive Stewardship', 'Engineering Guilds'];
const PLANET_HOLDING_FOOD = [
  'Hearty herbal stew and dark bread',
  'Spiced root broth and iron-grain cakes',
  'Salted fungus strips and citrus mash',
  'Hot ration wraps with smoked marrow',
];
const PLANET_HOLDING_GOODS = [
  'Pottery and carved bone ornaments',
  'Refined fuel cells and route beacons',
  'Ceramic armor plating and cloth seals',
  'Map tablets, relic fragments, and survival packs',
];
const PLANET_HOLDING_NEWS = [
  'A messenger from the Seat passed through but never arrived at their destination.',
  'A dead gate relay began transmitting old military ciphers at dusk.',
  'Merchant caravans report a beast corridor where no fauna should survive.',
  'A broker claims a Lost City district has reopened beneath the ash shelf.',
];
const PLANET_HOLDING_KNOWLEDGE = [
  'Lords grasp all Mysteries - their secrets, locations, vulnerabilities, and remedies. They know all Locations across the Province. Such knowledge is rarely given freely.',
  'The ruling council tracks every active Mystery and can mark one hidden route if you earn audience.',
  'The lord keeps sealed maps to peril lanes and only releases them to proven allies.',
];

function createPlanetHoldingDetail(profile, province, marker, localWeather, terrainName) {
  const clearWeather = !localWeather || !localWeather.rough;
  const weatherLabel = clearWeather
    ? 'Clear and Sunny'
    : ((localWeather && localWeather.label) ? localWeather.label : 'Unstable Conditions');
  const weatherDesc = clearWeather
    ? 'A bright morning. Good light for navigation.'
    : ((localWeather && localWeather.desc) ? localWeather.desc : 'Wind and static interfere with scouting reports.');
  const isMerchantColony = marker === 'merchant_colony';
  return {
    title: marker === 'merchant_colony' ? 'HOLDING' : 'HOLDING',
    structure: isMerchantColony ? 'Fortress' : pick(PLANET_HOLDING_STRUCTURES),
    terrain: terrainName || (profile && profile.terrain) || 'Unknown terrain',
    weatherLabel,
    weatherDesc,
    restBoon: isMerchantColony ? 'Resting here grants Protected (Defend ↑ one Step).' : pick(PLANET_HOLDING_REST_BOONS),
    mood: isMerchantColony ? 'Distrust' : pick(PLANET_HOLDING_MOODS),
    crisis: isMerchantColony ? 'Reinforce Loyalty' : pick(PLANET_HOLDING_CRISES),
    crisisText: isMerchantColony ? 'Earn trust within the council. A traitor is suspected.' : pick(PLANET_HOLDING_CRISES_TEXT),
    lordTitle: 'Lord',
    lordName: isMerchantColony ? 'High Merchant Orin' : `High Merchant ${pick(['Orin', 'Selka', 'Varo', 'Ithis', 'Mael'])}`,
    character: isMerchantColony ? 'Industrious Tomb' : pick(PLANET_HOLDING_CHARACTER),
    culturalFocus: isMerchantColony ? 'Trade and Bazaars' : pick(PLANET_HOLDING_FOCUS),
    food: isMerchantColony ? 'Hearty herbal stew and dark bread' : pick(PLANET_HOLDING_FOOD),
    goods: isMerchantColony ? 'Pottery and carved bone ornaments' : pick(PLANET_HOLDING_GOODS),
    news: isMerchantColony ? 'A messenger from the Seat passed through but never arrived at their destination.' : pick(PLANET_HOLDING_NEWS),
    knowledge: isMerchantColony
      ? 'Lords grasp all Mysteries - their secrets, locations, vulnerabilities, and remedies. They know all Locations across the Province. Such knowledge is rarely given freely.'
      : pick(PLANET_HOLDING_KNOWLEDGE),
    province: province || 'Unknown Province',
  };
}

function getPlanetAuthorityFactionKey(authorityName) {
  const lower = String(authorityName || '').toLowerCase();
  if (lower.indexOf('pirate') >= 0 || lower.indexOf('underworld') >= 0 || lower.indexOf('syndicate') >= 0) return 'underworld';
  if (lower.indexOf('corp') >= 0 || lower.indexOf('merchant') >= 0 || lower.indexOf('trade') >= 0) return 'corporations';
  if (lower.indexOf('church') >= 0 || lower.indexOf('temple') >= 0 || lower.indexOf('cult') >= 0 || lower.indexOf('relig') >= 0) return 'religious';
  return 'political';
}

function rollPlanetSurfaceWeather(profile) {
  const season = (S.currentSeason || 'spring').toLowerCase();
  const base = pick((PLANET_SURFACE_WEATHER[season] || PLANET_SURFACE_WEATHER.spring));
  const weatherName = String((profile && profile.weather) || '').toLowerCase();
  const boosted = Object.assign({}, base);
  if (weatherName.indexOf('storm') >= 0 || weatherName.indexOf('acid') >= 0 || weatherName.indexOf('heatwave') >= 0) {
    boosted.rough = true;
    boosted.dd = Math.max(8, boosted.dd || 6);
    if (!boosted.failure) boosted.failure = '+1 Stress.';
  }
  return boosted;
}

function createPlanetCellNarrative(state, theme, province) {
  const terrainRule = pick(PLANET_TERRAIN_TABLE);
  const localWeather = rollPlanetSurfaceWeather(state.profile);
  const localTerrain = pick(theme.terrains.concat(PLANET_SURFACE_TERRAINS));
  const localForm = pick(PLANET_FORM_TABLE);
  const localNature = pick(PLANET_NATURE_TABLE);
  const localFauna = pick(PLANET_FAUNA_TABLE);
  const localWonder = pick(PLANET_WONDER_TABLE);
  const localTone = pick(PLANET_TONE_TABLE);
  const localSkyWeather = pick(PLANET_WEATHER_TABLE);
  const localSights = pick(PLANET_SIGHTS_TABLE);
  return {
    terrain: localTerrain,
    terrainRule: terrainRule,
    localWeather: localWeather,
    localTone,
    localSkyWeather,
    localSights,
    land: `${localNature} ${localForm} of ${province}`,
    floraFauna: `${localNature} growth with ${localFauna}`,
    wonder: localWonder,
  };
}

function buildPlanetAtmosphereLine(state, selected) {
  if (!state) return '';
  const useHexData = !!(selected && selected.explored);
  const tone = (useHexData && selected.localTone) ? selected.localTone : state.profile.tone;
  const skyWeather = (useHexData && selected.localSkyWeather) ? selected.localSkyWeather : state.profile.weather;
  const sights = (useHexData && selected.localSights) ? selected.localSights : state.profile.sights;
  return `The sky today shows a/an ${tone} tone amidst ${skyWeather}. Beyond the horizon: ${sights}.`;
}

function applyPlanetTerrainSave(state, cell, cfg) {
  if (!state || !cell || !cfg) return '';
  const check = resolveGalaxySkillCheck(cfg.primary, cfg.secondary, cfg.dd, `${cfg.label} at Hex ${cell.id}`);
  if (check.success) {
    return `${check.text}. Success: ${cfg.onSuccess}`;
  }
  if (typeof cfg.onFailure === 'function') cfg.onFailure(check.delta);
  return `${check.text}. Failure: ${cfg.failText(check.delta)}`;
}

function getPlanetBeastEncounterText(state, selected) {
  const count = roll(4);
  const dread = 8;
  const hp = 16;
  const beastName = pick((PLANET_ENCOUNTER_ARCHETYPES.beast || ['Hostile Beasts'])).toLowerCase();
  return `${count} ${beastName} prowl this route. DD${dread} | ${hp} Health each.`;
}

function getPlanetPirateEncounterText() {
  const count = roll(4);
  const dread = 8;
  const hp = 16;
  return `${count} pirate raider${count !== 1 ? 's' : ''} lock this lane. DD${dread} | ${hp} Health each.`;
}

function hasAnyPlanetSuitProtection() {
  return hasPlanetProtection('vacuum') || hasPlanetProtection('heat') || hasPlanetProtection('cold') || hasPlanetProtection('radiation');
}

function getPlanetHazardProfile(profile) {
  const hazards = [];
  const temperature = String((profile && profile.temperature) || '').toLowerCase();
  const atmosphere = String((profile && profile.atmosphere) || '').toLowerCase();
  const biome = String((profile && profile.biome) || '').toLowerCase();
  if (atmosphere.indexOf('vacuum') >= 0 || atmosphere.indexOf('dense') >= 0 || atmosphere.indexOf('thick') >= 0) hazards.push('atmosphere');
  if (temperature.indexOf('frigid') >= 0 || temperature.indexOf('cold') >= 0 || temperature.indexOf('hot') >= 0 || temperature.indexOf('scorched') >= 0) hazards.push('temperature');
  if (biome.indexOf('irradiated') >= 0 || biome.indexOf('toxic') >= 0 || biome.indexOf('volcanic') >= 0 || biome.indexOf('exotic') >= 0) hazards.push('biome');
  if (biome.indexOf('irradiated') >= 0) hazards.push('radiation');
  hazards.push('terrain');
  return hazards;
}

function hasRelevantPlanetSuitProtection(profile) {
  const hazards = getPlanetHazardProfile(profile);
  if (hazards.indexOf('atmosphere') >= 0 && hasPlanetProtection('vacuum')) return true;
  if (hazards.indexOf('temperature') >= 0 && (hasPlanetProtection('heat') || hasPlanetProtection('cold'))) return true;
  if (hazards.indexOf('radiation') >= 0 && hasPlanetProtection('radiation')) return true;
  return false;
}

function isPlanetHazardBypassed(state) {
  if (!state) return false;
  const hasExocraft = !!(S.exocraftBay && Array.isArray(S.exocraftBay.owned) && S.exocraftBay.owned.length);
  if (state.traversalMode === 'exocraft' && hasExocraft) return true;
  return hasRelevantPlanetSuitProtection(state.profile);
}

function cyclePlanetTraversalMode() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const hasExocraft = !!(S.exocraftBay && Array.isArray(S.exocraftBay.owned) && S.exocraftBay.owned.length);
  if (!hasExocraft) {
    state.traversalMode = 'foot';
    showNotif('No exocraft owned. Traversal remains on foot.', 'warn');
    renderPlanetExplorationPanel();
    return;
  }
  state.traversalMode = state.traversalMode === 'exocraft' ? 'foot' : 'exocraft';
  showNotif(`Traversal mode: ${state.traversalMode === 'exocraft' ? 'Exocraft' : 'On Foot'}.`, 'good');
  renderPlanetExplorationPanel();
}

function applyPlanetHazardFailure(state, checkText) {
  if (!state) return;
  if (isPlanetHazardBypassed(state)) return;
  const severity = getPlanetSeverityProfile(state);
  const hazards = getPlanetHazardProfile(state.profile);
  if (hazards.indexOf('radiation') >= 0 && typeof changeRads === 'function') changeRads(50 * severity.mult);
  if (hazards.indexOf('temperature') >= 0 && typeof changeHealth === 'function') changeHealth(Math.max(1, severity.mult - 1));
  if (hazards.indexOf('atmosphere') >= 0 && typeof changeMentalStress === 'function') changeMentalStress(Math.max(1, severity.mult - 1));
  if (hazards.indexOf('biome') >= 0 && typeof changeStress === 'function') changeStress(Math.max(1, severity.mult - 1));
  if (severity.mult >= 3 && S.conditions && ('distracted' in S.conditions) && Math.random() < 0.35) {
    S.conditions.distracted = true;
    if (typeof updateConditionButtons === 'function') updateConditionButtons();
    if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  }
  showNotif(`${checkText} Environmental penalties applied (${severity.label}).`, 'warn');
}

function getPlanetSeverityProfile(state) {
  const profile = (state && state.profile) || {};
  const biome = String(profile.biome || '').toLowerCase();
  const temperature = String(profile.temperature || '').toLowerCase();
  const atmosphere = String(profile.atmosphere || '').toLowerCase();

  let score = 1;
  if (biome.indexOf('irradiated') >= 0 || biome.indexOf('toxic') >= 0 || biome.indexOf('volcanic') >= 0 || biome.indexOf('exotic') >= 0) score += 1;
  if (temperature.indexOf('frigid') >= 0 || temperature.indexOf('scorched') >= 0) score += 1;
  if (atmosphere.indexOf('vacuum') >= 0 || atmosphere.indexOf('dense') >= 0 || atmosphere.indexOf('thick') >= 0) score += 1;

  // Fair progression: as more of a planet is explored, penalty scaling eases slightly.
  const cells = Array.isArray(state && state.cells) ? state.cells : [];
  const explored = cells.filter((cell) => cell.explored).length;
  const exploredRatio = cells.length ? (explored / cells.length) : 0;
  if (exploredRatio >= 0.45) score -= 1;

  const mult = Math.max(1, Math.min(3, score));
  const label = mult === 1 ? 'Temperate Tier' : mult === 2 ? 'Harsh Tier' : 'Deadly Tier';
  return { mult, label };
}

function applyPlanetTraversalEffects(state, cell) {
  if (!state || !cell) return '';
  if (cell.localWeather) {
    state.currentWeather = Object.assign({}, cell.localWeather);
  }
  const terrainName = String(cell.terrainClass || '').toLowerCase();
  if (!terrainName) return '';

  if (terrainName === 'hazardous') {
    if (typeof loseGamePhases === 'function') loseGamePhases(1);
    return applyPlanetTerrainSave(state, cell, {
      label: 'Steep cliffs',
      primary: 'body',
      secondary: 'agility',
      dd: 20,
      onSuccess: 'cliffs crossed with +1 Phase travel cost.',
      onFailure: (delta) => {
        if (typeof changeHealth === 'function') changeHealth(Math.max(1, delta));
      },
      failText: (delta) => `take ${Math.max(1, delta)} Health damage and +1 Phase travel cost.`,
    });
  }
  if (terrainName === 'convoluted') {
    if (typeof loseGamePhases === 'function') loseGamePhases(1);
    return applyPlanetTerrainSave(state, cell, {
      label: 'Convoluted pathways',
      primary: 'lead',
      secondary: 'mind',
      dd: 8,
      onSuccess: 'you find a stable route with only +1 Phase travel cost.',
      onFailure: () => {
        if (typeof changeStress === 'function') changeStress(1);
      },
      failText: () => '+1 Stress and +1 Phase travel cost.',
    });
  }
  if (terrainName === 'biome-exotic') {
    if (typeof loseGamePhases === 'function') loseGamePhases(3);
    return applyPlanetTerrainSave(state, cell, {
      label: 'Hazardous river crossing',
      primary: 'body',
      secondary: 'agility',
      dd: 10,
      onSuccess: 'you cross with only the baseline +3 Phase detour.',
      onFailure: () => {
        if (typeof changeHealth === 'function') changeHealth(1);
        if (typeof changeStress === 'function') changeStress(1);
      },
      failText: () => '1 Health damage, +1 Stress, and +3 Phase travel cost.',
    });
  }
  if (terrainName === 'biome-irradiated') {
    if (!isPlanetHazardBypassed(state)) {
      return applyPlanetTerrainSave(state, cell, {
        label: 'Radiation storm',
        primary: 'control',
        secondary: 'mind',
        dd: 10,
        onSuccess: 'radiation exposure minimized.',
        onFailure: () => {
          if (typeof changeRads === 'function') changeRads(200);
        },
        failText: () => '+200 Rads.',
      });
    }
    return 'Radiation storm present, but current traversal protections bypassed the hazard.';
  }
  if (terrainName === 'biome-volcanic') {
    if (typeof loseGamePhases === 'function') loseGamePhases(3);
    return applyPlanetTerrainSave(state, cell, {
      label: 'Volcanic lava detour',
      primary: 'body',
      secondary: 'control',
      dd: 10,
      onSuccess: 'detour completed with +3 Phase travel cost.',
      onFailure: () => {
        if (typeof changeHealth === 'function') changeHealth(1);
      },
      failText: () => '1 Health damage and +3 Phase travel cost.',
    });
  }
  if (terrainName === 'inhabited') {
    const d4 = roll(4);
    const site = d4 === 1 ? 'Hunting Ground' : d4 === 2 ? 'Nest' : 'Oasis';
    return applyPlanetTerrainSave(state, cell, {
      label: 'Inhabited approach',
      primary: 'lead',
      secondary: 'spirit',
      dd: 6,
      onSuccess: `${site} discovered with stable contact lines.`,
      onFailure: () => {
        if (typeof changeStress === 'function') changeStress(1);
      },
      failText: () => `${site} discovered under pressure. +1 Stress.`,
    });
  }
  return applyPlanetTerrainSave(state, cell, {
    label: 'Easy-going route',
    primary: 'lead',
    secondary: 'mind',
    dd: 6,
    onSuccess: 'safe route confirmed, no additional penalty.',
    onFailure: () => {
      if (typeof changeStress === 'function') changeStress(1);
    },
    failText: () => '+1 Stress from navigation drift.',
  });
}

function applyPlanetWayfarerRequirementPenalty(state, contextLabel) {
  if (!state || isPlanetHazardBypassed(state)) return '';
  const severity = getPlanetSeverityProfile(state);
  const modePool = severity.mult >= 3
    ? ['radiation', 'stress', 'trauma', 'condition', 'health', 'radiation', 'stress']
    : severity.mult === 2
      ? ['radiation', 'stress', 'trauma', 'condition', 'health', 'stress']
      : ['radiation', 'stress', 'condition', 'health'];
  const mode = pick(modePool);
  if (mode === 'radiation') {
    const rads = 50 * (severity.mult + 1);
    if (typeof changeRads === 'function') changeRads(rads);
    return `${contextLabel}: requirements unmet, +${rads} Radiation (${severity.label}).`;
  }
  if (mode === 'stress') {
    const stress = Math.max(1, severity.mult);
    if (typeof changeStress === 'function') changeStress(stress);
    return `${contextLabel}: requirements unmet, +${stress} Stress (${severity.label}).`;
  }
  if (mode === 'trauma') {
    const trauma = severity.mult >= 3 ? 1 : 0;
    if (trauma && typeof changeTrauma === 'function') changeTrauma(trauma);
    if (trauma) return `${contextLabel}: requirements unmet, +${trauma} Trauma (${severity.label}).`;
    if (typeof changeStress === 'function') changeStress(1);
    return `${contextLabel}: requirements unmet, +1 Stress (${severity.label}).`;
  }
  if (mode === 'condition') {
    if (S.conditions && ('distracted' in S.conditions)) {
      S.conditions.distracted = true;
      if (typeof updateConditionButtons === 'function') updateConditionButtons();
      if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
    }
    return `${contextLabel}: requirements unmet, Distracted condition applied (${severity.label}).`;
  }
  const health = Math.max(1, severity.mult - 1);
  if (typeof changeHealth === 'function') changeHealth(health);
  return `${contextLabel}: requirements unmet, ${health} Health damage (${severity.label}).`;
}

function registerPlanetSurfaceTravel(state) {
  if (!state) return;
  if (state.traversalMode === 'exocraft') {
    state.exocraftClickCounter = (state.exocraftClickCounter || 0) + 1;
    if (state.exocraftClickCounter >= 2) {
      state.exocraftClickCounter = 0;
      if (typeof loseGamePhases === 'function') loseGamePhases(1);
      else if (typeof advanceDay === 'function') advanceDay(1);
    }
    return;
  }
  if (typeof advanceDay === 'function') advanceDay(1);
}

function getPlanetTerrainCheckConfig(cell) {
  const terrainName = String((cell && cell.terrainClass) || '').toLowerCase();
  if (terrainName === 'hazardous') return { label: 'Steep cliffs', dread: 20 };
  if (terrainName === 'convoluted') return { label: 'Convoluted pathways', dread: 8 };
  if (terrainName === 'biome-exotic') return { label: 'Hazardous river crossing', dread: 10 };
  if (terrainName === 'biome-irradiated') return { label: 'Radiation storm crossing', dread: 10 };
  if (terrainName === 'biome-volcanic') return { label: 'Lava lake detour', dread: 10 };
  if (terrainName === 'inhabited') return { label: 'Inhabited route pressure', dread: 6 };
  return { label: 'Terrain traversal', dread: 6 };
}

function rollPlanetTerrainEffectCheck() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected) return;
  const cfg = getPlanetTerrainCheckConfig(selected);
  const actionDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('adventure') : ((S.stats && S.stats.adventure) || 4);
  const action = explodingRoll(actionDie);
  const dread = explodingRoll(cfg.dread);
  const success = action.total >= dread.total;
  let summary = `Wayfarer Action Die d${actionDie}=${action.total} vs Dread d${cfg.dread}=${dread.total}`;
  if (!success) {
    if (typeof loseGamePhases === 'function') loseGamePhases(3);
    summary += ' — failed, +3 Phase of the Day.';
  } else {
    summary += ' — pass.';
  }
  state.lastEvent = {
    timestamp: Date.now(),
    d10: cfg.dread,
    outcome: `${cfg.label} Terrain Check`,
    detail: summary,
    rewardItem: '',
    cellId: selected.id,
    eventType: 'exploration',
  };
  showNotif(success ? `${cfg.label}: pass.` : `${cfg.label}: fail (+3 Phase).`, success ? 'good' : 'warn');
  renderPlanetExplorationPanel();
}

function rollPlanetTradeRouteEncounter() {
  const r = roll(10);
  let title = '';
  let text = '';
  if (r <= 2) {
    title = 'Safe Route';
    text = pick(['Convoy lanes are stable and guarded.', 'No threats: routine trade traffic only.']);
  } else if (r <= 4) {
    title = 'Profitable Route';
    text = pick(['Broker convoy shares a premium cargo tip.', 'Merchants offer favorable exchange rates this phase.']);
  } else if (r <= 6) {
    title = 'Aggressive/Illegal Route';
    text = pick(['Smugglers shadow your movement.', 'Illegal toll-runners demand route tribute.']);
  } else if (r <= 8) {
    title = 'Trade Obstacle';
    text = pick(['Pay 100 credits toll or lose 1 Phase rerouting.', 'Route blockade slows all movement.']);
  } else {
    title = 'Traveling Wayfarer';
    text = 'A wayfarer broker appears with route rumors and contract hooks.';
  }
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  state.lastEvent = {
    timestamp: Date.now(),
    d10: r,
    outcome: `Trade Route d10=${r} — ${title}`,
    detail: text,
    rewardItem: '',
    cellId: selected ? selected.id : null,
    eventType: 'encounter',
  };
  showNotif(`Trade Route: ${title}.`, 'good');
  renderPlanetExplorationPanel();
}

function showPlanetTradeGoods() {
  const goods = [rollGalaxyMerchantLoot(), rollGalaxyMerchantLoot(), rollGalaxyMerchantLoot()].filter(Boolean);
  if (typeof openModal !== 'function') return;
  openModal('Trade Goods', `<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">${goods.map((g) => `• ${g}`).join('<br>')}</div>`);
}

function openPlanetMerchantMarket() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected) return;
  const canTrade = selected.tradeRoute || selected.marker === 'merchant_colony' || selected.marker === 'holding';
  if (!canTrade) {
    showNotif('No merchant market is available on this hex.', 'warn');
    return;
  }
  const discountRate = selected.tradeRoute ? 0.15 : 0;
  const offers = buildGalaxyMerchantOffers('Merchant Ship');
  state.activeMerchantOffers = offers;
  state.activeMerchantDiscountRate = discountRate;
  if (typeof openModal === 'function') {
    openModal('Merchant Market', `<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">${offers.map((offer, idx) => {
      const cost = getOfferPrice(offer, discountRate);
      return `<div style="padding:.26rem .35rem;border:1px solid var(--border2);margin-bottom:.25rem;"><strong style="color:var(--gold2);">${offer.name}</strong> <span style="color:var(--muted2);">(${offer.cat})</span><br>${offer.desc || 'No description.'}<br><strong>Cost:</strong> ${cost}₵${discountRate ? ' (Trade Route discount applied)' : ''}<br><button class='btn btn-xs btn-teal' onclick='buyPlanetMerchantOffer(${idx})'>Buy</button></div>`;
    }).join('')}</div>`);
  }
}

function buyPlanetMerchantOffer(index) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state || !Array.isArray(state.activeMerchantOffers)) return;
  const offer = state.activeMerchantOffers[Number(index)];
  if (!offer) return;
  const discountRate = Number(state.activeMerchantDiscountRate) || 0;
  const cost = getOfferPrice(offer, discountRate);
  if (typeof buyItem === 'function') {
    buyItem(cost, offer.name, offer.cat);
  } else {
    if ((S.credits || 0) < cost) {
      showNotif(`Need ${cost} credits.`, 'warn');
      return;
    }
    if (typeof changeCredits === 'function') changeCredits(-cost);
    takeGalaxyLoot(offer.name, 'pack');
  }
  showNotif(`Purchased ${offer.name} for ${cost}₵.`, 'good');
}

function attemptPlanetHoldingSteal() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected || !(selected.marker === 'merchant_colony' || selected.marker === 'holding')) return;
  const controlDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('control') : ((S.stats && S.stats.control) || 4);
  const check = resolveGalaxySkillCheck('control', 'lead', 8, `Steal at Hex ${selected.id}`);
  if (check.success) {
    const loot = rollGalaxyMerchantLootFromCategories(['items', 'toolkits', 'tradegoods', 'weapon_mods', 'armor']);
    takeGalaxyLoot(loot, 'pack');
    state.lastEvent = {
      timestamp: Date.now(),
      d10: 8,
      outcome: 'Holding Theft Success',
      detail: `${check.text}. You steal ${loot} without raising the alarm.`,
      rewardItem: loot,
      cellId: selected.id,
      eventType: 'encounter',
    };
    showNotif(`Theft succeeded: ${loot}.`, 'good');
  } else {
    const authority = state.rulingPower || 'Unknown Authority';
    const renownKey = getPlanetAuthorityFactionKey(authority);
    changeFactionRenown(renownKey, -1);
    if (typeof changeStress === 'function') changeStress(1);
    state.lastEvent = {
      timestamp: Date.now(),
      d10: 8,
      outcome: 'Holding Theft Failed',
      detail: `${check.text}. You were caught stealing. -1 ${(FACTION_NAMES && FACTION_NAMES[renownKey]) || renownKey} Renown with ${authority}.`,
      rewardItem: '',
      cellId: selected.id,
      eventType: 'encounter',
    };
    showNotif(`Caught stealing. -1 ${(FACTION_NAMES && FACTION_NAMES[renownKey]) || renownKey} Renown.`, 'warn');
  }
  renderPlanetExplorationPanel();
}

function rollPlanetObstacleTraversal() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected || !(selected.marker === 'peril' || selected.marker === 'barrier')) return;
  const check = resolveGalaxySkillCheck('adventure', 'lead', 6, `${selected.marker === 'peril' ? 'Peril' : 'Barrier'} Traversal`);
  selected.data = selected.data || {};
  if (check.success) {
    selected.data.obstacleCleared = true;
    selected.note = `${selected.marker === 'peril' ? 'Peril route' : 'Barrier route'} cleared. Lost City style travel is now available from this hex.`;
    showNotif(`${selected.marker === 'peril' ? 'Peril' : 'Barrier'} cleared.`, 'good');
  } else {
    if (typeof changeStress === 'function') changeStress(1);
    if (typeof loseGamePhases === 'function') loseGamePhases(1);
    selected.note = `${selected.marker === 'peril' ? 'Peril' : 'Barrier'} traversal failed. +1 Stress, lose 1 Phase.`;
    showNotif(`${selected.marker === 'peril' ? 'Peril' : 'Barrier'} traversal failed.`, 'warn');
  }
  state.lastEvent = {
    timestamp: Date.now(),
    d10: 6,
    outcome: `${selected.marker === 'peril' ? 'Peril' : 'Barrier'} Traversal`,
    detail: `${check.text}. ${check.success ? 'Passage opened.' : 'Passage denied this phase.'}`,
    rewardItem: '',
    cellId: selected.id,
    eventType: 'encounter',
  };
  renderPlanetExplorationPanel();
}

function attemptPlanetBlackMarketAccess() {
  const controlDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('control') : ((S.stats && S.stats.control) || 4);
  const a = explodingRoll(controlDie);
  const d = explodingRoll(12);
  const success = a.total >= d.total;
  if (!success) {
    showNotif('Black Market access failed. You were thrown out.', 'warn');
    return;
  }
  const offers = [rollGalaxyMerchantLootFromCategories(['augmentations', 'toolkits']), rollGalaxyMerchantLootFromCategories(['services', 'scrolls'])].filter(Boolean);
  if (typeof openModal === 'function') {
    openModal('Black Market Access', `<div style="font-size:.82rem;color:var(--text2);line-height:1.6;"><strong style="color:var(--red2);">Black Market Dealer</strong><br>Control d${controlDie}=${a.total} vs DD12=${d.total}<br><br>${offers.map((o) => `• ${o}`).join('<br>')}</div>`);
  }
  showNotif('You gain access to the Black Market.', 'good');
}

function rollPlanetLostCityTravel() {
  const r = roll(6);
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  let text = '';
  if (r <= 2) text = 'Irradiated patrol encountered. DD4 | 8 Stress if you engage.';
  else if (r <= 4) text = 'Collapsed sector crossing. Control vs DD6 or lose 1 Phase.';
  else text = 'Safe district corridor found.';
  state.lastEvent = {
    timestamp: Date.now(),
    d10: r,
    outcome: `Lost City Travel d6=${r}`,
    detail: text,
    rewardItem: '',
    cellId: selected ? selected.id : null,
    eventType: 'encounter',
  };
  showNotif(`Lost City Travel: d6=${r}.`, 'good');
  renderPlanetExplorationPanel();
}

function generatePlanetRuinRooms(cellId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const cell = state.cells.find((entry) => entry.id === Number(cellId));
  if (!cell) return;
  cell.data = cell.data || {};
  const total = ((cell.data.ruin && cell.data.ruin.rooms) || (roll(4) + 2));
  if (!Array.isArray(cell.data.ruinRooms) || !cell.data.ruinRooms.length) {
    cell.data.ruinRooms = Array.from({ length: total }).map((_, i) => ({
      id: i + 1,
      cleared: false,
      dread: 6 + Math.min(4, Math.floor((i + 1) / 2)),
      loot: rollGalaxyMerchantLoot(),
    }));
  }
  const roomsHtml = cell.data.ruinRooms.map((room) => {
    return `<div style="padding:.28rem .35rem;border:1px solid var(--border2);margin-bottom:.25rem;">Room ${room.id} · DD${room.dread}${room.cleared ? ' · Cleared ✓' : ''}<br>${room.cleared ? `Loot: ${room.loot}` : `<button class='btn btn-xs btn-teal' onclick='resolvePlanetRuinRoom(${cell.id},${room.id})'>Roll Room</button>`}</div>`;
  }).join('');
  if (typeof openModal === 'function') {
    openModal('Ruin Rooms', `<div style="font-size:.82rem;color:var(--text2);line-height:1.5;">${roomsHtml}</div>`);
  }
}

function resolvePlanetRuinRoom(cellId, roomId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const cell = state.cells.find((entry) => entry.id === Number(cellId));
  if (!cell || !cell.data || !Array.isArray(cell.data.ruinRooms)) return;
  const room = cell.data.ruinRooms.find((entry) => entry.id === Number(roomId));
  if (!room || room.cleared) return;
  const adDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('adventure') : ((S.stats && S.stats.adventure) || 4);
  const a = explodingRoll(adDie);
  const d = explodingRoll(room.dread || 6);
  const success = a.total >= d.total;
  if (success) {
    room.cleared = true;
    takeGalaxyLoot(room.loot, 'pack');
    showNotif(`Room ${room.id} cleared. Loot secured: ${room.loot}`, 'good');
  } else {
    if (typeof changeStress === 'function') changeStress(Math.max(1, d.total - a.total));
    showNotif(`Room ${room.id} failed.`, 'warn');
  }
  generatePlanetRuinRooms(cellId);
}

function getPlanetCell(state, col, row) {
  if (!state || !Array.isArray(state.cells)) return null;
  return state.cells.find((cell) => cell.col === col && cell.row === row) || null;
}

function getPlanetNeighbors(state, cell) {
  if (!state || !cell) return [];
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ];
  return offsets
    .map(([dc, dr]) => getPlanetCell(state, cell.col + dc, cell.row + dr))
    .filter(Boolean);
}

function summarizePlanetCell(cell) {
  if (!cell) return 'Unknown hex.';
  if (cell.tradeRoute && (!cell.marker || cell.marker === 'none')) {
    return `Trade Route: ${cell.terrain}${cell.feature ? ` · ${cell.feature}` : ''}`;
  }
  const markerLabel = cell.marker === 'merchant_colony' ? 'Merchant Colony'
    : cell.marker === 'empty_colony' ? 'Empty Colony'
    : cell.marker === 'wayfarer' ? 'Wayfarer Contact'
    : cell.marker === 'ruins' ? 'Ruins'
    : cell.marker === 'holding' ? 'Space Holding'
    : cell.marker === 'monument' ? 'Wonder Landmark'
    : cell.marker === 'pirate' ? 'Pirate Presence'
    : cell.marker === 'beast' ? 'Beast Territory'
    : cell.marker === 'hazard' ? 'Hazard'
    : cell.marker === 'site' ? 'Site'
    : 'Wilderness';
  return `${markerLabel}: ${cell.terrain}${cell.feature ? ` · ${cell.feature}` : ''}`;
}

function getPlanetHexVisual(cell, isSelected, isLanding, isWayfarerContract, hasTask) {
  const base = {
    fill: '#1b2436',
    stroke: '#2f3d58',
    text: '#d5deee',
    tag: '#9bb0cf',
  };
  if (isLanding) {
    base.fill = '#214636';
    base.stroke = '#65c98d';
    base.tag = '#9cffc3';
  } else if (isWayfarerContract) {
    base.fill = '#6a5800';
    base.stroke = '#e8c050';
    base.tag = '#ffe58a';
  } else if (hasTask) {
    base.fill = '#3f88c5';
    base.stroke = '#7fb3df';
  } else if (cell.marker === 'merchant_colony') {
    base.fill = '#783820';
    base.stroke = '#f0a840';
  } else if (cell.marker === 'empty_colony') {
    base.fill = '#486734';
    base.stroke = '#98c074';
  } else if (cell.marker === 'holding') {
    base.fill = '#7b4c2a';
    base.stroke = '#c98f5f';
  } else if (cell.marker === 'wayfarer') {
    base.fill = '#502878';
    base.stroke = '#c092f0';
  } else if (cell.marker === 'ruins') {
    base.fill = '#3f3f3f';
    base.stroke = '#888';
  } else if (cell.marker === 'seat') {
    base.fill = '#8b3030';
    base.stroke = '#e8c050';
  } else if (cell.marker === 'dwelling') {
    base.fill = '#3a6820';
    base.stroke = '#6ed090';
  } else if (cell.marker === 'temple') {
    base.fill = '#502878';
    base.stroke = '#b060d0';
  } else if (cell.marker === 'monument') {
    base.fill = '#625179';
    base.stroke = '#b6a3da';
  } else if (cell.marker === 'peril') {
    base.fill = '#783820';
    base.stroke = '#e05050';
  } else if (cell.marker === 'gate') {
    base.fill = '#1a5048';
    base.stroke = '#2ec4b6';
  } else if (cell.marker === 'lostcity') {
    base.fill = '#5a1040';
    base.stroke = '#e080c0';
  } else if (cell.marker === 'barrier') {
    base.fill = '#282828';
    base.stroke = '#555555';
  } else if (cell.marker === 'beast') {
    base.fill = '#203b4a';
    base.stroke = '#5fa7c9';
  } else if (cell.marker === 'pirate') {
    base.fill = '#6b2020';
    base.stroke = '#cc6a6a';
  } else if (cell.marker === 'hazard') {
    base.fill = '#8b3030';
    base.stroke = '#df6f6f';
  } else if (cell.marker === 'site') {
    base.fill = '#3a2800';
    base.stroke = '#f0a840';
  } else if (cell.tradeRoute) {
    base.fill = '#3a2800';
    base.stroke = '#f0a840';
  }
  if (isSelected) {
    base.stroke = '#ffffff';
  }
  return base;
}

function renderPlanetSurfaceSvg(state, selected) {
  if (!state || !Array.isArray(state.cells) || !state.cells.length) return '';
  const size = 28;
  const rows = PLANET_SURFACE_ROWS;
  const cols = PLANET_SURFACE_COLS;
  const width = cols * size * 1.55 + size * 2.4;
  const height = rows * Math.sqrt(3) * size * 0.75 + size * 2.2;

  const posById = {};
  state.cells.forEach((cell) => {
    posById[cell.id] = {
      x: cell.col * size * 1.55 + (cell.row % 2 === 1 ? size * 0.78 : 0) + size + 6,
      y: cell.row * Math.sqrt(3) * size * 0.75 + size * 0.9 + 6,
    };
  });

  const gridSvg = state.cells.map((cell) => {
    const pos = posById[cell.id];
    const pts = hexPointsSVG(pos.x, pos.y, size - 1);
    return `<polygon class="planet-gridline" points="${pts}" />`;
  }).join('');

  const routeLinesSvg = state.cells
    .filter((cell) => cell.tradeRoute && cell.tradeRouteOwnerId != null)
    .map((routeCell) => {
      const owner = state.cells.find((entry) => entry.id === routeCell.tradeRouteOwnerId);
      if (!owner) return '';
      const a = posById[owner.id];
      const b = posById[routeCell.id];
      if (!a || !b) return '';
      return `<line class="planet-route-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
    })
    .filter(Boolean)
    .join('');

  const cellsSvg = state.cells.map((cell) => {
    const isLanding = cell.id === state.landedCellId;
    const isSelected = selected && cell.id === selected.id;
    const task = cell.taskId ? state.tasks.find((t) => t.id === cell.taskId) : null;
    const isWayfarerContract = !!(task && !task.resolved && task.source === 'wayfarer');
    const hasTask = !!(task && !task.resolved);
    const tag = isLanding ? 'L'
      : isWayfarerContract ? '✦'
      : hasTask ? 'T'
      : cell.marker === 'seat' ? '★'
      : cell.marker === 'holding' ? 'H'
      : cell.marker === 'dwelling' ? '◉'
      : cell.marker === 'temple' ? '✦'
      : cell.marker === 'ruins' ? 'R'
      : cell.marker === 'monument' ? '✧'
      : cell.marker === 'peril' ? '⚠'
      : cell.marker === 'gate' ? '◆'
      : cell.marker === 'lostcity' ? '⬡'
      : cell.marker === 'barrier' ? '▤'
      : cell.marker === 'beast' ? 'B'
      : cell.marker === 'pirate' ? 'P'
      : cell.marker === 'hazard' ? '!'
      : cell.marker === 'site' ? '◈'
      : cell.marker === 'merchant_colony' ? 'M'
      : cell.marker === 'empty_colony' ? 'E'
      : cell.tradeRoute ? '═'
      : cell.marker === 'wayfarer' ? 'W'
      : '';

    const pos = posById[cell.id];
    const x = pos.x;
    const y = pos.y;
    const pts = hexPointsSVG(x, y, size - 1);
    const visual = getPlanetHexVisual(cell, isSelected, isLanding, isWayfarerContract, hasTask);
    const strokeWidth = isSelected ? 2.4 : isWayfarerContract ? 2 : 1.2;

    return `<g class="planet-hex" onclick="explorePlanetCell(${cell.id})" style="cursor:pointer;">
      <polygon points="${pts}" fill="${visual.fill}" stroke="${visual.stroke}" stroke-width="${strokeWidth}" fill-opacity="${cell.explored ? 0.92 : 0.66}" />
      <text x="${x}" y="${y - 4}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="9.1" fill="${visual.text}">#${cell.id}</text>
      <text x="${x}" y="${y + 11}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="11" fill="${visual.tag}">${tag || '·'}</text>
    </g>`;
  }).join('');

  return `<div class="planet-svg-wrap"><svg class="planet-svg" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${gridSvg}${routeLinesSvg}${cellsSvg}</svg></div>`;
}

function getPlanetHexTypeLabel(cell) {
  if (!cell) return 'Wilderness';
  if (cell.marker === 'merchant_colony') return 'Merchant Colony';
  if (cell.marker === 'empty_colony') return 'Empty Colony';
  if (cell.marker === 'wayfarer' || cell.marker === 'wayfarer_task') return 'Wayfarer Route';
  if (cell.marker === 'seat') return 'Seat';
  if (cell.marker === 'holding') return 'Space Holding';
  if (cell.marker === 'dwelling') return 'Dwelling';
  if (cell.marker === 'temple') return 'Temple';
  if (cell.marker === 'ruins') return 'Ruins';
  if (cell.marker === 'monument') return 'Weird Landmark';
  if (cell.marker === 'peril') return 'Peril';
  if (cell.marker === 'gate') return 'Gate';
  if (cell.marker === 'lostcity') return 'Lost City';
  if (cell.marker === 'barrier') return 'Barrier';
  if (cell.marker === 'beast') return 'Beast Territory';
  if (cell.marker === 'pirate') return 'Pirate Territory';
  if (cell.marker === 'hazard') return 'Hazard Zone';
  if (cell.marker === 'site') return 'Site';
  if (cell.tradeRoute) return 'Trade Route';
  return 'Wilderness';
}

function isPlanetLocationHex(cell) {
  return !!(cell && cell.marker && cell.marker !== 'none' && cell.marker !== 'wayfarer_task');
}

function canUsePlanetWildernessActions(cell) {
  return !!(cell && !isPlanetLocationHex(cell) && !cell.tradeRoute);
}

function buildPlanetHoldingInfoHtml(state, selected) {
  if (!selected || !(selected.marker === 'merchant_colony' || selected.marker === 'holding')) return '';
  selected.data = selected.data || {};
  if (!selected.data.holding) {
    selected.data.holding = createPlanetHoldingDetail((state && state.profile) || {}, selected.province, selected.marker, selected.localWeather, selected.terrain);
  }
  const h = selected.data.holding;
  return `<div class="sea-site" style="margin-bottom:.45rem;">
    <div class="ss-title">${h.title}</div>
    <div class="ss-text" style="line-height:1.55;">
      <strong>${h.structure}</strong><br>
      ${h.terrain} terrain<br>
      🌦 ${(typeof capitalize === 'function' ? capitalize(S.currentSeason || 'spring') : (S.currentSeason || 'spring'))} Weather: ${h.weatherLabel}<br>
      ${h.weatherDesc}<br>
      🛡 <strong>Rest Boon</strong><br>
      ${h.restBoon}<br>
      <strong>Mood:</strong> ${h.mood}<br>
      <strong>Crisis:</strong> ${h.crisis}<br>
      ${h.crisisText}<br>
      <strong>${h.lordTitle}</strong><br>
      ${h.lordName}<br>
      <strong>Character</strong><br>
      ${h.character}<br>
      <strong>Cultural Focus</strong><br>
      ${h.culturalFocus}<br>
      <strong>Food</strong><br>
      ${h.food}<br>
      <strong>Goods</strong><br>
      ${h.goods}<br>
      📰 <strong>News & Hooks</strong><br>
      ${h.news}<br>
      🎯 <strong>Lord's Knowledge</strong><br>
      ${h.knowledge}<br>
      <button class="btn btn-xs btn-primary" onclick="createPlanetTask()">⚄ Generate Task</button>
    </div>
  </div>`;
}

function buildPlanetNarrativeLines(state, selected) {
  const profile = (state && state.profile) || {};
  const terrainLabel = selected && selected.terrain ? selected.terrain : 'Unknown';
  const markerLabel = getPlanetHexTypeLabel(selected);
  const landBase = (selected && selected.land) ? selected.land : state.observedSurface.land;
  const floraBase = (selected && selected.floraFauna) ? selected.floraFauna : state.observedSurface.floraFauna;
  const wonderBase = (selected && selected.wonder) ? selected.wonder : state.observedSurface.wonder;
  const terrainEffect = (selected && selected.terrainEffect) ? selected.terrainEffect : profile.terrainEffect;
  const weather = (selected && selected.localWeather) ? selected.localWeather : state.currentWeather;
  const land = `${landBase}. ${markerLabel} activity is strongest near ${selected && selected.province ? selected.province : 'this province'}.`;
  const floraFauna = `${floraBase}. ${profile.fauna || 'Local fauna'} track the safest paths before settlers do.`;
  const wonder = `${wonderBase}. It remains active enough to influence traffic, weather, or belief.`;

  let detailCardTitle = 'Frontier Report';
  let detailCardText = 'Unclaimed ground with shifting routes and partial scans.';
  if (selected && selected.marker === 'merchant_colony') {
    detailCardTitle = 'Merchant Colony';
    detailCardText = 'Trade quarter, broker stalls, and convoy logistics. This colony can anchor mission movement markers.';
  } else if (selected && selected.marker === 'empty_colony') {
    detailCardTitle = 'Lost City Colony';
    detailCardText = 'Collapsed city district with unstable sectors and hidden passageways. Treat this as Lost City style exploration.';
  } else if (selected && selected.marker === 'seat') {
    detailCardTitle = 'Seat';
    detailCardText = 'Planetary command center equivalent with strategic knowledge and route authority.';
  } else if (selected && selected.marker === 'holding') {
    detailCardTitle = 'Holding Complex';
    detailCardText = 'A fortified lane control point with clear command routes and protection infrastructure.';
  } else if (selected && selected.marker === 'dwelling') {
    detailCardTitle = 'Dwelling';
    detailCardText = 'A refuge waypoint where crews rest and gather rumors from passing wayfarers.';
  } else if (selected && selected.marker === 'temple') {
    detailCardTitle = 'Temple';
    detailCardText = 'A sanctuary node for focused rites, trauma recovery, and mystery hints.';
  } else if (selected && selected.marker === 'monument') {
    detailCardTitle = 'Temple/Wonder Site';
    detailCardText = 'A ritual-alignment landmark with focused readings and unusual atmospheric behavior.';
  } else if (selected && selected.marker === 'peril') {
    detailCardTitle = 'Peril';
    detailCardText = 'A high-risk corridor requiring traversal checks before safe passage.';
  } else if (selected && selected.marker === 'gate') {
    detailCardTitle = 'Gate';
    detailCardText = 'A transit gate with uncertain destination behavior and traversal side-effects.';
  } else if (selected && selected.marker === 'lostcity') {
    detailCardTitle = 'Lost City';
    detailCardText = 'A derelict urban maze with patrols, salvage pockets, and unstable routes.';
  } else if (selected && selected.marker === 'barrier') {
    detailCardTitle = 'Barrier';
    detailCardText = 'A movement obstacle that blocks direct progression until a check succeeds.';
  } else if (selected && selected.tradeRoute) {
    detailCardTitle = 'Trade Route';
    detailCardText = 'A merchant lane with route encounters and goods flow.';
  } else if (selected && selected.marker === 'site') {
    detailCardTitle = 'Survey Site';
    detailCardText = 'Straightforward exploration node: investigate, loot, or establish mission staging.';
  }

  return {
    terrainLabel,
    markerLabel,
    land,
    floraFauna,
    wonder,
    terrainEffect,
    weather,
    detailCardTitle,
    detailCardText,
  };
}

function observeAdjacentPlanetHexes() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected) return;
  const leadDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('lead') : ((S.stats && S.stats.lead) || 4);
  const player = explodingRoll(leadDie);
  const dread = explodingRoll(6);
  const success = player.total >= dread.total;
  const neighbors = getPlanetNeighbors(state, selected);

  let body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-bottom:.35rem;">
    <div class="info-cell"><span class="ic-label">Lead</span>d${leadDie} = ${player.total}</div>
    <div class="info-cell"><span class="ic-label">DD6</span>${dread.total}</div>
  </div>`;
  if (!success) {
    body += '<div style="font-size:.8rem;color:var(--red2);">Observation failed. The horizon blurs and no clear routes are revealed.</div>';
  } else {
    body += `<div style="display:grid;gap:.3rem;">${neighbors.slice(0, 4).map((cell) => `<div class="info-cell"><span class="ic-label">Hex #${cell.id}</span>${summarizePlanetCell(cell)}</div>`).join('')}</div>`;
  }
  if (typeof openModal === 'function') openModal('Observe Adjacent Hexes', body);
  selected.note = selected.note || '';
  selected.note = `${selected.note}${selected.note ? ' ' : ''}[Observe Adjacent] ${success ? 'Nearby routes identified.' : 'No clear routes found.'}`;
}

function setPlanetHexNote(cellId, value) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const cell = state.cells.find((entry) => entry.id === Number(cellId));
  if (!cell) return;
  cell.playerNote = String(value || '').trim();
}

function rollPlanetHexEncounter() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected) return;

  const d10 = roll(10);
  let title = '';
  let text = '';
  if (d10 <= 2) {
    selected.localWeather = rollPlanetSurfaceWeather(state.profile);
    state.currentWeather = Object.assign({}, selected.localWeather);
    title = 'Shift in Weather';
    text = `${selected.localWeather.label} — ${selected.localWeather.desc}`;
  } else if (d10 === 3) {
    const archetype = pick(PLANET_ENCOUNTER_ARCHETYPES.holding);
    title = `${archetype} (Space Holding)`;
    setPositiveGalaxyCondition('protected');
    text = 'Route marshals secure colony lanes and establish fallback points. Protected applied.';
  } else if (d10 === 4) {
    const archetype = pick(PLANET_ENCOUNTER_ARCHETYPES.ruins);
    title = archetype;
    setPositiveGalaxyCondition('empowered');
    text = 'Ancient salvage core recovered from ruins. Empowered applied.';
  } else if (d10 === 5) {
    const archetype = pick(PLANET_ENCOUNTER_ARCHETYPES.monument);
    title = archetype;
    setPositiveGalaxyCondition('focused');
    text = 'Navigational harmonics align with your route. Focused applied.';
  } else if (d10 === 6) {
    title = 'Merchant Caravan';
    if (typeof changeCredits === 'function') changeCredits(roll(6) * 10);
    text = 'A passing merchant caravan buys your survey intel and opens a temporary route market.';
  } else if (d10 === 7) {
    title = 'Royal Envoy';
    changeFactionRenown('political', 1);
    text = 'A royal envoy issues a sealed charter and recognizes your route authority. +1 Political Renown.';
  } else if (d10 === 8) {
    if (selected.tradeRoute) {
      title = 'Trade Auditors';
      text = 'Route auditors inspect manifests and enforce toll law. No contraband brokers operate in this lane.';
    } else {
      title = 'Black Market Broker';
      text = 'A hidden broker offers contraband access off-route. Use Black Market access from non-trade-route holdings or colonies.';
    }
  } else if (d10 === 9) {
    const archetype = pick(PLANET_ENCOUNTER_ARCHETYPES.beast);
    const response = resolveGalaxySkillCheck('adventure', 'lead', 8, `Beast encounter Hex ${selected.id}`);
    title = archetype;
    const beastLine = getPlanetBeastEncounterText(state, selected);
    text = `${beastLine} ${response.text}. ${response.success ? 'Route secured with no losses.' : 'Failure: +1 Stress.'}`;
    if (!response.success && typeof changeStress === 'function') changeStress(1);
  } else {
    const archetype = pick(PLANET_ENCOUNTER_ARCHETYPES.pirate);
    const response = resolveGalaxySkillCheck('adventure', 'lead', 8, `Pirate encounter Hex ${selected.id}`);
    title = archetype;
    const pirateLine = getPlanetPirateEncounterText();
    if (response.success) {
      if (typeof changeCredits === 'function') changeCredits(30);
      changeFactionRenown('underworld', 1);
      text = `${pirateLine} ${response.text}. Success: seize 30 credits and gain +1 Underworld Renown.`;
    } else {
      if ((S.credits || 0) >= 30 && typeof changeCredits === 'function') changeCredits(-30);
      if (typeof changeMentalStress === 'function') changeMentalStress(1);
      text = `${pirateLine} ${response.text}. Failure: lose 30 credits and suffer +1 Mental Stress.`;
    }
  }

  state.lastEvent = {
    timestamp: Date.now(),
    d10,
    outcome: `d10=${d10} — ${title}`,
    detail: `${title}: ${text}`,
    rewardItem: '',
    cellId: selected.id,
    eventType: 'encounter',
  };
  state.eventLog = Array.isArray(state.eventLog) ? state.eventLog : [];
  state.eventLog.unshift(state.lastEvent);
  state.eventLog = state.eventLog.slice(0, 8);
  showNotif(`Planet encounter: ${title}.`, 'good');
  renderPlanetExplorationPanel();
}

function resolvePlanetWeatherCheck() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state || !state.currentWeather || !state.currentWeather.rough) return;
  if (isPlanetHazardBypassed(state)) {
    showNotif('Traversal gear bypassed weather danger effects.', 'good');
    return;
  }
  const stat = state.currentWeather.check || 'lead';
  const dd = state.currentWeather.dd || 6;
  const result = resolveGalaxySkillCheck('adventure', stat, dd, `Planet Weather: ${state.currentWeather.label}`);
  if (!result.success) {
    applyPlanetHazardFailure(state, 'Weather check failed.');
  } else {
    showNotif('Weather check passed. Safe traversal window.', 'good');
  }
}

function computePlanetTradeRoutes(state) {
  if (!state || !Array.isArray(state.cells)) return;
  state.cells.forEach((cell) => {
    cell.tradeRoute = false;
    cell.tradeRouteOwnerId = null;
  });
  const merchants = state.cells.filter((cell) => cell.marker === 'merchant_colony');
  if (!merchants.length) return;
  const usedRouteIds = new Set();

  merchants.forEach((merchant) => {
    const neighbors = getPlanetNeighbors(state, merchant)
      .filter((cell) => cell.marker !== 'merchant_colony' && !usedRouteIds.has(cell.id));
    const preferred = neighbors.filter((cell) => !cell.marker || cell.marker === 'none' || cell.marker === 'hazard' || cell.marker === 'site');
    const routeCell = pick(preferred.length ? preferred : neighbors);
    if (!routeCell) return;
    routeCell.tradeRoute = true;
    routeCell.tradeRouteOwnerId = merchant.id;
    routeCell.note = routeCell.note || `Trade lane linked to Merchant Colony #${merchant.id}.`;
    usedRouteIds.add(routeCell.id);
  });
}

const PLANET_THEME_BY_BIOME = {
  barren: {
    terrains: ['Dust Shelf', 'Shard Wastes', 'Dry Faultline', 'Ruin Flats'],
    features: ['Collapsed Refinery', 'Silent Dig Site', 'Salt Relay', 'Broken Habitat'],
    roles: ['Scrap Broker', 'Surveyor', 'Outcast Ranger'],
    taskFocus: ['salvage', 'route marking', 'artifact recovery'],
  },
  water: {
    terrains: ['Flood Basin', 'Tidal Shelf', 'Mist Coast', 'Submerged Steps'],
    features: ['Tide Beacon', 'Drowned Archive', 'Float Dock', 'Reef Sensor'],
    roles: ['Navigator', 'Hydrologist', 'Ferry Keeper'],
    taskFocus: ['escort runs', 'water route scans', 'rescue ops'],
  },
  lush: {
    terrains: ['Canopy Run', 'Vine Trench', 'Spore Meadow', 'Green Ridge'],
    features: ['Root Shrine', 'Canopy Lift', 'Bio-Lab', 'Seed Cache'],
    roles: ['Pathfinder', 'Botanist', 'Caretaker'],
    taskFocus: ['flora samples', 'beast diversion', 'path security'],
  },
  volcanic: {
    terrains: ['Magma Shelf', 'Obsidian Flow', 'Smoke Ridge', 'Ash Basin'],
    features: ['Heat Tower', 'Sealed Forge', 'Cooled Vent', 'Lava Lift'],
    roles: ['Heatwright', 'Miner', 'Ash Scout'],
    taskFocus: ['heat shielding', 'ore retrieval', 'route venting'],
  },
  irradiated: {
    terrains: ['Rad Flats', 'Glass Trench', 'Static Ridge', 'Burn Field'],
    features: ['Shielded Vault', 'Rad Pump', 'Dosimeter Mast', 'Quarantine Gate'],
    roles: ['Rad Medic', 'Decontam Tech', 'Signal Keeper'],
    taskFocus: ['decon supply', 'evac escort', 'rad suppression'],
  },
  scorched: {
    terrains: ['Sunplate Expanse', 'Burn Scar', 'Thermal Rift', 'Molten Dune'],
    features: ['Cooling Node', 'Sun Shield', 'Heat Sink Yard', 'Cinder Relay'],
    roles: ['Heat Marshal', 'Shade Runner', 'Route Tuner'],
    taskFocus: ['cooling logistics', 'heat route mapping', 'shelter repairs'],
  },
  toxic: {
    terrains: ['Fume Marsh', 'Poison Flats', 'Acid Track', 'Sealed Ravine'],
    features: ['Filter Tower', 'Neutralizer Vat', 'Mask Depot', 'Hazmat Post'],
    roles: ['Filter Engineer', 'Chem Scout', 'Quarantine Warden'],
    taskFocus: ['filter upkeep', 'contamination control', 'supply drops'],
  },
  frozen: {
    terrains: ['Ice Shelf', 'Frost Rift', 'Blue Quarry', 'Snow Basin'],
    features: ['Thermal Node', 'Cryo Beacon', 'Snow Lock', 'Frozen Relay'],
    roles: ['Ice Runner', 'Thermal Engineer', 'Signal Trapper'],
    taskFocus: ['heat relay repair', 'cold rescue', 'supply hauling'],
  },
  urban: {
    terrains: ['Collapsed Avenue', 'Skybridge Rubble', 'Arcology Spine', 'Transit Pit'],
    features: ['Data Core', 'Transit Hub', 'Market Vault', 'Tower Shell'],
    roles: ['Archivist', 'Circuit Broker', 'Ward Captain'],
    taskFocus: ['records extraction', 'district recovery', 'security patrol'],
  },
  exotic: {
    terrains: ['Prism Field', 'Echo Ridge', 'Mirage Hollow', 'Fractal Steps'],
    features: ['Phase Anchor', 'Resonance Gate', 'Light Well', 'Pulse Observatory'],
    roles: ['Resonance Monk', 'Signal Oracle', 'Phase Surveyor'],
    taskFocus: ['anomaly mapping', 'signal tuning', 'artifact anchoring'],
  },
};

const PLANET_WAYFARER_NAME_FIRST = ['Ari', 'Vale', 'Kest', 'Rho', 'Nyx', 'Tal', 'Vero', 'Mira', 'Cael', 'Orin'];
const PLANET_WAYFARER_NAME_LAST = ['Quill', 'Drax', 'Sable', 'Rowe', 'Kade', 'Morrow', 'Zenith', 'Pyre', 'Voss', 'Halcyon'];

function getPlanetTheme(profile) {
  const biome = String((profile && profile.biome) || '').toLowerCase();
  if (biome.indexOf('urban') >= 0) return PLANET_THEME_BY_BIOME.urban;
  if (biome.indexOf('water') >= 0 || biome.indexOf('ocean') >= 0) return PLANET_THEME_BY_BIOME.water;
  if (biome.indexOf('lush') >= 0 || biome.indexOf('jungle') >= 0) return PLANET_THEME_BY_BIOME.lush;
  if (biome.indexOf('volcanic') >= 0) return PLANET_THEME_BY_BIOME.volcanic;
  if (biome.indexOf('irradiated') >= 0) return PLANET_THEME_BY_BIOME.irradiated;
  if (biome.indexOf('scorched') >= 0 || biome.indexOf('furnace') >= 0) return PLANET_THEME_BY_BIOME.scorched;
  if (biome.indexOf('toxic') >= 0 || biome.indexOf('tainted') >= 0) return PLANET_THEME_BY_BIOME.toxic;
  if (biome.indexOf('frozen') >= 0 || biome.indexOf('ice') >= 0) return PLANET_THEME_BY_BIOME.frozen;
  if (biome.indexOf('exotic') >= 0) return PLANET_THEME_BY_BIOME.exotic;
  if (biome.indexOf('barren') >= 0 || biome.indexOf('grave') >= 0) return PLANET_THEME_BY_BIOME.barren;
  return PLANET_THEME_BY_BIOME.barren;
}

function buildPlanetProvinceNames(profile) {
  const base = String((profile && profile.planetName) || 'Planet').split('(')[0].trim();
  return [`${base} North Reach`, `${base} Dawn Expanse`, `${base} Rift March`, `${base} Low Basin`];
}

function getProvinceForCell(cell, provinces) {
  const rowMid = Math.floor(PLANET_SURFACE_ROWS / 2);
  const colMid = Math.floor(PLANET_SURFACE_COLS / 2);
  const rowBand = cell.row < rowMid ? 0 : 2;
  const colBand = cell.col < colMid ? 0 : 1;
  const idx = rowBand + colBand;
  return provinces[idx] || provinces[0] || 'Unknown Province';
}

function weightedPickPlanetMarker(weights) {
  const entries = Object.entries(weights || {}).filter((entry) => Number(entry[1]) > 0);
  if (!entries.length) return 'none';
  const total = entries.reduce((sum, entry) => sum + Number(entry[1] || 0), 0);
  let cursor = Math.random() * total;
  for (let i = 0; i < entries.length; i += 1) {
    cursor -= Number(entries[i][1] || 0);
    if (cursor <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

function shufflePlanetMarkers(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function buildPlanetMarkerPlan(profile, totalCells) {
  const biome = String((profile && profile.biome) || '').toLowerCase();
  const temp = String((profile && profile.temperature) || '').toLowerCase();
  const guaranteed = {
    seat: 1,
    holding: 2,
    dwelling: 2,
    temple: 1,
    monument: 2,
    peril: 2,
    ruins: 3,
    gate: 1,
    lostcity: 1,
    barrier: 2,
    merchant_colony: 3,
    empty_colony: 3,
    wayfarer: 4,
  };
  const weights = {
    none: 28,
    hazard: 3,
    site: 4,
    task: 2,
    empty_colony: 4,
    merchant_colony: 4,
    wayfarer: 5,
    ruins: 5,
    holding: 4,
    monument: 4,
    seat: 2,
    dwelling: 4,
    temple: 3,
    peril: 4,
    gate: 2,
    lostcity: 2,
    barrier: 3,
    beast: 3,
    pirate: 2,
  };

  if (biome.indexOf('irradiated') >= 0 || biome.indexOf('toxic') >= 0) {
    weights.peril += 2; weights.ruins += 2; weights.barrier += 2; weights.lostcity += 1; weights.hazard += 1;
  }
  if (biome.indexOf('volcanic') >= 0 || temp.indexOf('scorched') >= 0) {
    weights.peril += 2; weights.barrier += 1; weights.hazard += 1; weights.temple = Math.max(1, weights.temple - 1);
  }
  if (biome.indexOf('lush') >= 0 || biome.indexOf('water') >= 0) {
    weights.dwelling += 2; weights.temple += 1; weights.wayfarer += 1; weights.barrier = Math.max(1, weights.barrier - 1);
  }
  if (biome.indexOf('barren') >= 0 || biome.indexOf('exotic') >= 0) {
    weights.ruins += 1; weights.lostcity += 1; weights.peril += 1; weights.merchant_colony += 1;
  }

  const plan = [];
  Object.keys(guaranteed).forEach((key) => {
    for (let i = 0; i < guaranteed[key]; i += 1) {
      if (plan.length < totalCells) plan.push(key);
    }
  });

  while (plan.length < totalCells) {
    plan.push(weightedPickPlanetMarker(weights));
  }
  return shufflePlanetMarkers(plan);
}

function createPlanetWayfarer(state, cell, source) {
  if (!state || !cell) return null;
  state.wayfarers = Array.isArray(state.wayfarers) ? state.wayfarers : [];
  const existing = state.wayfarers.find((entry) => entry.cellId === cell.id && !entry.retired);
  if (existing) return existing;
  const theme = getPlanetTheme(state.profile);
  const name = `${pick(PLANET_WAYFARER_NAME_FIRST)} ${pick(PLANET_WAYFARER_NAME_LAST)}`;
  const role = pick(theme.roles);
  const hook = pick(theme.taskFocus);
  const wayfarer = {
    id: `wayfarer-${state.hexId}-${Date.now()}-${roll(999)}`,
    name,
    role,
    hook,
    source: source || 'surface',
    cellId: cell.id,
    province: cell.province,
    acceptedTaskId: '',
    completedTaskCount: 0,
    dialogueSeed: pick(['urgent', 'measured', 'cryptic', 'direct']),
  };
  state.wayfarers.push(wayfarer);
  cell.marker = 'wayfarer';
  cell.feature = `${role} camp`;
  cell.note = `${name} (${role}) offers leads on ${hook}.`;
  return wayfarer;
}

function getPlanetPhaseStamp() {
  ensureStarsState();
  const gd = S.gameDate || {};
  return `${gd.year || 1}-${gd.month || 1}-${gd.day || 1}-${gd.phase || 0}`;
}

function getPlanetColonySummary(state) {
  if (!state || !Array.isArray(state.cells)) return { merchant: 0, empty: 0, exploredMerchant: 0, exploredEmpty: 0 };
  const merchantCells = state.cells.filter((cell) => cell.marker === 'merchant_colony');
  const emptyCells = state.cells.filter((cell) => cell.marker === 'empty_colony');
  return {
    merchant: merchantCells.length,
    empty: emptyCells.length,
    exploredMerchant: merchantCells.filter((cell) => cell.explored).length,
    exploredEmpty: emptyCells.filter((cell) => cell.explored).length,
  };
}

function getWayfarerDialogueLine(wayfarer, state) {
  if (!wayfarer || !state) return 'A traveler studies the horizon in silence.';
  const planetType = state.profile ? state.profile.planetType : 'frontier';
  const province = wayfarer.province || 'outer province';
  if (wayfarer.dialogueSeed === 'urgent') {
    return `"${planetType} routes are collapsing near ${province}. I need a capable hand before night phase."`;
  }
  if (wayfarer.dialogueSeed === 'cryptic') {
    return `"I mapped a pattern in ${province}. Follow it and the planet answers with salvage and favor."`;
  }
  if (wayfarer.dialogueSeed === 'direct') {
    return `"Take the contract. Hold this lane in ${province}, and I pay in hard credits."`;
  }
  return `"${province} still has survivors and signal ghosts. Help me stabilize this ${planetType} line."`;
}

function applyPlanetColonyPhaseOutput(state) {
  if (!state) return null;
  state.colonyLedger = state.colonyLedger || {
    lastPhaseStamp: '',
    totalCreditsEarned: 0,
    totalBoonTicks: 0,
  };
  const colonies = getPlanetColonySummary(state);
  if (!colonies.exploredMerchant && !colonies.exploredEmpty) return null;
  const phaseStamp = getPlanetPhaseStamp();
  if (state.colonyLedger.lastPhaseStamp === phaseStamp) return null;
  state.colonyLedger.lastPhaseStamp = phaseStamp;
  const credits = colonies.exploredMerchant * 12 + colonies.exploredEmpty * 4;
  if (credits > 0 && typeof changeCredits === 'function') changeCredits(credits);

  const boons = [];
  if (colonies.exploredMerchant > 0) {
    setPositiveGalaxyCondition('protected');
    boons.push('Protected');
  }
  if (colonies.exploredEmpty > 0) {
    setPositiveGalaxyCondition('bolstered');
    if (typeof changeStress === 'function') changeStress(-1);
    boons.push('Bolstered', 'Stress -1');
  }

  state.colonyLedger.totalCreditsEarned += credits;
  if (boons.length) state.colonyLedger.totalBoonTicks += 1;
  if (credits > 0 || boons.length) {
    showNotif(`Colony phase output: +${credits} credits${boons.length ? `, ${boons.join(', ')}` : ''}.`, 'good');
  }
  return { credits, boons, colonies };
}

function getPlanetWayfarerById(state, wayfarerId) {
  if (!state || !Array.isArray(state.wayfarers)) return null;
  return state.wayfarers.find((wf) => wf.id === wayfarerId) || null;
}

function acceptPlanetWayfarerTask(wayfarerId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const wayfarer = getPlanetWayfarerById(state, wayfarerId);
  if (!wayfarer) return;
  if (wayfarer.acceptedTaskId) {
    showNotif(`${wayfarer.name} already has an open contract.`, 'warn');
    return;
  }

  const task = createPlanetTask({
    source: 'wayfarer',
    title: `${wayfarer.name} Contract`,
    text: `${wayfarer.role} request in ${wayfarer.province}. Focus: ${wayfarer.hook}.`,
    reward: { credits: roll(6) * 30 },
    preferredCellId: wayfarer.cellId,
    wayfarerId: wayfarer.id,
  });
  if (!task) {
    showNotif('No available slot for this wayfarer contract.', 'warn');
    return;
  }
  wayfarer.acceptedTaskId = task.id;
  const penalty = applyPlanetWayfarerRequirementPenalty(state, `Wayfarer ${wayfarer.name}`);
  if (penalty) showNotif(penalty, 'warn');
  showNotif(`Accepted contract from ${wayfarer.name}.`, 'good');
  renderPlanetExplorationPanel();
}

function generatePlanetWayfarerTask(wayfarerId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const wayfarer = getPlanetWayfarerById(state, wayfarerId);
  if (!wayfarer) return;
  if (wayfarer.acceptedTaskId) {
    showNotif(`${wayfarer.name} already has an open contract.`, 'warn');
    return;
  }
  const task = createPlanetTask({
    source: 'wayfarer',
    wayfarerId: wayfarer.id,
    preferredCellId: wayfarer.cellId,
    title: `${wayfarer.name} Contract`,
    text: `${wayfarer.role} request in ${wayfarer.province}. Focus: ${wayfarer.hook}.`,
    reward: { credits: roll(6) * 30 },
  });
  if (!task) return;
  wayfarer.acceptedTaskId = task.id;
  const penalty = applyPlanetWayfarerRequirementPenalty(state, `Wayfarer ${wayfarer.name}`);
  if (penalty) showNotif(penalty, 'warn');
  showNotif(`Generated wayfarer task from ${wayfarer.name}.`, 'good');
  renderPlanetExplorationPanel();
}

function claimPlanetColonyRestBoon() {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const selected = state.cells.find((cell) => cell.id === state.selectedCellId);
  if (!selected || !selected.explored) {
    showNotif('Explore this hex first to claim colony boons.', 'warn');
    return;
  }
  if (selected.marker === 'merchant_colony') {
    setPositiveGalaxyCondition('protected');
    if (typeof changeCredits === 'function') changeCredits(8);
    showNotif('Merchant colony rest: Protected granted and +8 credits.', 'good');
  } else if (selected.marker === 'empty_colony') {
    setPositiveGalaxyCondition('bolstered');
    if (typeof changeStress === 'function') changeStress(-1);
    showNotif('Empty colony refuge: Bolstered granted and Stress -1.', 'good');
  } else {
    showNotif('No colony boon available on this hex.', 'warn');
  }
  renderPlanetExplorationPanel();
}

function getActivePlanetHex() {
  ensureStarsState();
  const current = getCurrentStarHex();
  if (current && current.type === 'planet') {
    S.starSystem.activePlanetHexId = current.id;
    return current;
  }
  const activeId = S.starSystem.activePlanetHexId;
  if (activeId == null) return null;
  return (S.starSystem.hexes || []).find((h) => h.id === activeId) || null;
}

function getPlanetSurfaceDifficulty(profile) {
  const t = String((profile && profile.temperature) || '').toLowerCase();
  const g = String((profile && profile.gravity) || '').toLowerCase();
  const a = String((profile && profile.atmosphere) || '').toLowerCase();
  let dd = 6;
  if (t.indexOf('frigid') >= 0 || t.indexOf('scorched') >= 0) dd += 2;
  else if (t.indexOf('hot') >= 0 || t.indexOf('cold') >= 0) dd += 1;
  if (g.indexOf('crushing') >= 0 || g.indexOf('high') >= 0 || g.indexOf('minimal') >= 0) dd += 1;
  if (a.indexOf('vacuum') >= 0 || a.indexOf('dense') >= 0 || a.indexOf('thick') >= 0) dd += 1;
  return Math.max(6, Math.min(12, dd));
}

function hasPlanetProtection(kind) {
  const armor = String((S.equipment && S.equipment.armor) || '').toLowerCase();
  const layers = (S.equipmentLayers || {});
  const suit = String(layers.suit || '').toLowerCase();
  const under = String(layers.under || '').toLowerCase();
  const over = String(layers.over || '').toLowerCase();
  if (kind === 'vacuum') return /vaccsuit|radsuit/.test(suit) || /vaccsuit|radsuit/.test(armor) || over.indexOf('exoskeleton layer') >= 0;
  if (kind === 'heat') return under.indexOf('coolant layer') >= 0;
  if (kind === 'cold') return under.indexOf('thermal layer') >= 0;
  if (kind === 'radiation') return /radsuit/.test(suit) || /radsuit/.test(armor) || over.indexOf('exoskeleton layer') >= 0;
  return false;
}

function buildPlanetRequirements(profile) {
  const req = [];
  const atmosphere = String((profile && profile.atmosphere) || '').toLowerCase();
  const temp = String((profile && profile.temperature) || '').toLowerCase();
  const hasExocraft = !!(S.exocraftBay && Array.isArray(S.exocraftBay.owned) && S.exocraftBay.owned.length);
  const activeExo = (S.exocraftBay && S.exocraftBay.active) ? S.exocraftBay.active : '';
  if (atmosphere.indexOf('vacuum') >= 0) {
    req.push(hasPlanetProtection('vacuum')
      ? 'Atmosphere: Vacuum handled (Suit/Exoskeleton equipped).'
      : 'Atmosphere: Vacuum risk. Equip VaccSuit, RadSuit, or Exoskeleton Layer.');
  } else if (atmosphere.indexOf('thick') >= 0 || atmosphere.indexOf('dense') >= 0) {
    req.push('Atmosphere: Dense/Thick. Suit filtration recommended for long traversals.');
  } else {
    req.push('Atmosphere: Traversable without sealed suit.');
  }

  if (temp.indexOf('frigid') >= 0 || temp.indexOf('cold') >= 0) {
    req.push(hasPlanetProtection('cold')
      ? 'Temperature: Cold/frigid mitigated by Thermal Layer.'
      : 'Temperature: Cold/frigid. Thermal Layer recommended.');
  } else if (temp.indexOf('hot') >= 0 || temp.indexOf('scorched') >= 0) {
    req.push(hasPlanetProtection('heat')
      ? 'Temperature: Hot/scorched mitigated by Coolant Layer.'
      : 'Temperature: Hot/scorched. Coolant Layer recommended.');
  } else {
    req.push('Temperature: Temperate window.');
  }

  req.push(hasExocraft
    ? `Exocraft: ${activeExo || 'Owned'} available for terrain traversal.`
    : 'Exocraft: None owned. Planet terrain checks are harsher without one.');
  req.push('Bypass Rule: Exocraft traversal or relevant suit protections ignore Radiation, Temperature, Atmosphere, Biome hazards, and Terrain difficulty penalties.');
  return req;
}

function createPlanetSurfaceState(hex) {
  const profile = ensurePlanetProfile(hex);
  const theme = getPlanetTheme(profile);
  const rows = PLANET_SURFACE_ROWS;
  const cols = PLANET_SURFACE_COLS;
  const markerPlan = buildPlanetMarkerPlan(profile, rows * cols);
  const cells = [];
  const provinces = buildPlanetProvinceNames(profile);
  let id = 1;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const marker = markerPlan[id - 1] || 'none';
      const province = getProvinceForCell({ row: r, col: c }, provinces);
      const localNarrative = createPlanetCellNarrative({ profile }, theme, province);
      const detailData = {
        holding: (marker === 'holding' || marker === 'merchant_colony')
          ? createPlanetHoldingDetail(profile, province, marker, localNarrative.localWeather, localNarrative.terrain)
          : null,
        ruin: marker === 'ruins' ? {
          builder: pick(['Miners', 'Pilgrims', 'Wardens', 'Corpo Engineers', 'Colonists']),
          builtFor: pick(['Prison for a cosmic beast', 'Signal observatory', 'Refuge bunker', 'Archive vault', 'War staging hub']),
          construction: pick(['Cracked Concrete and Iron', 'Basalt and alloy ribs', 'Ceramic shell and steel lattice']),
          entrance: pick(['Concealed at the base of an abandoned mineshaft', 'Collapsed cargo hatch', 'Sealed gate under ash']),
          rooms: roll(4) + 2,
          novelty: pick(['Floating hallucinogenic spores — Trauma Check required in Rooms 4-6', 'Zero-gravity pockets in collapsed halls', 'Predator spoor across the access corridor'])
        } : null,
        peril: marker === 'peril' ? { name: pick(['Storm Crater', 'Electro Rift', 'Acid Shelf']), desc: pick(['Lead or Survival vs DD6 to pass.', 'Control vs DD8 to avoid system strain.', 'Body vs DD8 or take stress from exposure.']) } : null,
        gate: marker === 'gate' ? { name: pick(['Transit Gate', 'Ancient Orbital Gate', 'Derelict Jump Gate']), leads: pick(['Dead Moon lanes', 'Outer colony routes', 'Unknown fringe corridor']) } : null,
        lostCity: (marker === 'lostcity' || marker === 'empty_colony') ? { watch: 'Irradiated Ones (DD4 | 8 Stress) patrol this district.' } : null,
      };
      cells.push({
        id,
        row: r,
        col: c,
        province,
        terrain: localNarrative.terrain,
        terrainClass: localNarrative.terrainRule.name,
        terrainEffect: localNarrative.terrainRule.effect,
        localWeather: localNarrative.localWeather,
        land: localNarrative.land,
        floraFauna: localNarrative.floraFauna,
        wonder: localNarrative.wonder,
        feature: marker === 'none' ? '' : pick(theme.features.concat(PLANET_SURFACE_FEATURES)),
        marker,
        data: detailData,
        tradeRoute: false,
        tradeRouteOwnerId: null,
        explored: false,
        note: '',
        playerNote: '',
      });
      id += 1;
    }
  }
  const landingCell = cells[Math.floor(cells.length / 2)];
  if (landingCell) {
    landingCell.explored = true;
    landingCell.note = 'Landing zone established.';
  }
  const draftState = { cells };
  computePlanetTradeRoutes(draftState);
  const weatherLine = `The sky today shows a/an ${profile.tone} tone amidst ${profile.weather}.`;
  const majorPowers = (S.starSystem && Array.isArray(S.starSystem.majorPowers) && S.starSystem.majorPowers.length)
    ? S.starSystem.majorPowers
    : ['Unknown Authority'];
  return {
    hexId: hex.id,
    planetName: profile.planetName,
    profile,
    rulingPower: pick(majorPowers),
    provinces,
    weatherLine,
    observedSurface: {
      observedFromSpace: profile.observedFromSpace,
      landingPad: profile.landingPad,
      land: hex.land || profile.form,
      floraFauna: hex.flora || `${profile.nature} ${profile.fauna}`,
      wonder: hex.wonder || profile.wonder,
    },
    difficulty: getPlanetSurfaceDifficulty(profile),
    traversalMode: (S.exocraftBay && Array.isArray(S.exocraftBay.owned) && S.exocraftBay.owned.length) ? 'exocraft' : 'foot',
    currentWeather: rollPlanetSurfaceWeather(profile),
    landedCellId: landingCell ? landingCell.id : 1,
    selectedCellId: landingCell ? landingCell.id : 1,
    cells,
    tasks: [],
    wayfarers: [],
    eventLog: [],
    lastEvent: null,
    colonyLedger: {
      lastPhaseStamp: '',
      totalCreditsEarned: 0,
      totalBoonTicks: 0,
    },
  };
}

function ensurePlanetSurfaceState(hex) {
  ensureStarsState();
  if (!hex || hex.type !== 'planet') return null;
  const key = String(hex.id);
  if (!S.starSystem.planetExplorationByHex[key]) {
    S.starSystem.planetExplorationByHex[key] = createPlanetSurfaceState(hex);
  }
  return S.starSystem.planetExplorationByHex[key];
}

function openActivePlanetMap() {
  const h = getCurrentStarHex();
  if (!h || h.type !== 'planet') {
    showNotif('Select a planet hex before opening planet exploration.', 'warn');
    return;
  }
  S.starSystem.activePlanetHexId = h.id;
  ensurePlanetSurfaceState(h);
  const b = document.querySelector('nav .tab-btn[onclick*="switchTab(\'planet\'"]');
  if (typeof switchTab === 'function' && b) switchTab('planet', b);
}

function createPlanetTask(options) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const cfg = options || {};
  const freeCells = state.cells.filter((c) => !c.taskId);
  if (!freeCells.length) return showNotif('No free cells for additional planet tasks.', 'warn');
  let cell = null;
  if (cfg.preferredCellId != null) {
    const preferred = state.cells.find((entry) => entry.id === Number(cfg.preferredCellId) && !entry.taskId);
    if (preferred) cell = preferred;
  }
  if (!cell) cell = pick(freeCells);
  const theme = getPlanetTheme(state.profile);
  const focus = pick(theme.taskFocus);
  const taskId = `planet-${state.hexId}-${Date.now()}`;
  const task = {
    id: taskId,
    source: cfg.source || 'surface',
    wayfarerId: cfg.wayfarerId || '',
    title: cfg.title || `${pick(['Survey', 'Secure', 'Recover', 'Escort', 'Stabilize'])} ${state.profile.planetType} ${pick(['Route', 'Colony', 'Outpost', 'Grid', 'Beacon'])}`,
    text: cfg.text || `Task Focus: ${focus}. Province: ${cell.province}. ${pick(['Hold the route against raiders.', 'Retrieve lost telemetry logs.', 'Calibrate the outpost scanner.', 'Extract survivors to landing zone.', 'Map a safe exocraft route.'])}`,
    reward: Object.assign({ credits: roll(6) * 20 }, cfg.reward || {}),
    resolved: false,
    cellId: cell.id,
  };
  state.tasks.push(task);
  cell.taskId = taskId;
  if (cfg.source === 'wayfarer') {
    cell.contractHostMarker = cell.marker === 'wayfarer' ? 'wayfarer' : (cell.contractHostMarker || 'none');
    cell.marker = 'wayfarer_task';
    cell.feature = cell.feature || 'Wayfarer contract site';
  } else {
    cell.marker = 'task';
  }
  showNotif(`Planet task generated at hex ${cell.id}.`, 'good');
  renderPlanetExplorationPanel();
  return task;
}

function resolvePlanetTask(taskId, success) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || task.resolved) return;
  task.resolved = true;
  const cell = state.cells.find((c) => c.id === task.cellId);
  if (cell) cell.note = success ? `Task completed: ${task.title}` : `Task failed: ${task.title}`;
  if (cell && cell.marker === 'wayfarer_task') {
    cell.marker = cell.contractHostMarker === 'wayfarer' ? 'wayfarer' : 'none';
    cell.contractHostMarker = '';
  }
  if (task.wayfarerId) {
    const wf = getPlanetWayfarerById(state, task.wayfarerId);
    if (wf) {
      wf.acceptedTaskId = '';
      if (success) wf.completedTaskCount = (wf.completedTaskCount || 0) + 1;
    }
  }
  if (success) {
    if (typeof changeCredits === 'function') changeCredits(task.reward.credits || 0);
    changeFactionRenown('political', 1);
    showNotif(`Planet task resolved: ${task.title}`, 'good');
  } else {
    if (typeof changeStress === 'function') changeStress(1);
    showNotif(`Planet task failed: ${task.title}`, 'warn');
  }
  renderPlanetExplorationPanel();
}

function rollPlanetTaskCheck(taskId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const task = state.tasks.find((entry) => entry.id === taskId && !entry.resolved);
  if (!task) return;
  const adDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('adventure') : ((S.stats && S.stats.adventure) || 4);
  const adRoll = explodingRoll(adDie);
  const dreadRoll = explodingRoll(6);
  const success = adRoll.total >= dreadRoll.total;
  const rollText = `Task roll: AD d${adDie}=${adRoll.total} vs Dread d6=${dreadRoll.total}`;
  task.lastRollText = rollText;
  if (typeof openModal === 'function') {
    openModal('Selected Hex Task', `<div style="font-size:.85rem;color:var(--text2);line-height:1.6;">${rollText}<br><strong style="color:${success ? 'var(--green2)' : 'var(--red2)'};">${success ? 'Success' : 'Failure'}</strong></div>`);
  }
  resolvePlanetTask(taskId, success);
}

function explorePlanetCell(cellId) {
  const hex = getActivePlanetHex();
  const state = ensurePlanetSurfaceState(hex);
  if (!state) return;
  const cell = state.cells.find((c) => c.id === Number(cellId));
  if (!cell) return;
  registerPlanetSurfaceTravel(state);
  state.selectedCellId = cell.id;
  const bypass = isPlanetHazardBypassed(state);
  const hazardCount = getPlanetHazardProfile(state.profile).length;
  const baseDd = bypass ? 6 : state.difficulty;
  const dd = Math.max(6, Math.min(12, baseDd + (bypass ? 0 : Math.min(2, Math.floor(hazardCount / 2)))));
  const check = resolveGalaxySkillCheck('adventure', 'lead', dd, `Planet Hex ${cell.id}`);
  if (check.success) {
    cell.explored = true;
    if (!cell.note) {
      if (cell.marker === 'site') {
        const loot = rollGalaxyMerchantLoot();
        takeGalaxyLoot(loot, 'pack');
        cell.note = `Recovered ${loot} from ${cell.feature}.`;
      } else if (cell.marker === 'hazard') {
        cell.note = `Hazard cleared near ${cell.feature || cell.terrain}.`;
      } else if (cell.marker === 'empty_colony') {
        if (!cell.taskId && roll(10) >= 5) {
          createPlanetTask();
        }
        setPositiveGalaxyCondition('bolstered');
        cell.note = `Empty colony secured in ${cell.province}. It now behaves like a Dwelling-style fallback site.`;
      } else if (cell.marker === 'merchant_colony') {
        if (!cell.taskId && roll(10) >= 4) createPlanetTask();
        setPositiveGalaxyCondition('protected');
        cell.note = `Merchant colony in ${cell.province} functioning like a Holding-style trade node.`;
      } else if (cell.marker === 'wayfarer') {
        const wf = createPlanetWayfarer(state, cell, 'cell-explore');
        const reqPenalty = applyPlanetWayfarerRequirementPenalty(state, `Wayfarer contact at Hex ${cell.id}`);
        if (wf && !cell.taskId && roll(10) >= 4) createPlanetTask();
        cell.note = `${wf ? wf.name : 'A wayfarer'} offers a contract thread tied to ${state.profile.planetType} routes.${reqPenalty ? ` ${reqPenalty}` : ''}`;
      } else if (cell.marker === 'ruins') {
        setPositiveGalaxyCondition('empowered');
        cell.note = `Ruin site mapped in ${cell.province}. Generate Rooms to delve this dungeon complex.`;
      } else if (cell.marker === 'lostcity' || cell.marker === 'empty_colony') {
        cell.note = `Lost city district charted in ${cell.province}. Travel Roll available for dynamic outcomes.`;
      } else if (cell.marker === 'seat') {
        setPositiveGalaxyCondition('protected');
        cell.note = `Seat stabilized in ${cell.province}. Command lanes and mission intelligence improve.`;
      } else if (cell.marker === 'holding') {
        setPositiveGalaxyCondition('protected');
        cell.note = `Space-themed Holding stabilized. Protected gained while routes remain secure.`;
      } else if (cell.marker === 'dwelling') {
        setPositiveGalaxyCondition('bolstered');
        cell.note = `Dwelling refuge established in ${cell.province}. Bolstered gained.`;
      } else if (cell.marker === 'temple') {
        setPositiveGalaxyCondition('focused');
        cell.note = `Temple signals aligned in ${cell.province}. Focused gained.`;
      } else if (cell.marker === 'monument') {
        setPositiveGalaxyCondition('focused');
        cell.note = `Weird landmark resonance observed. Focused gained from alignment data.`;
      } else if (cell.marker === 'peril') {
        cell.note = `Peril route active: roll traversal check before crossing.`;
      } else if (cell.marker === 'gate') {
        cell.note = `Gate waypoint found. Unknown destination routes available.`;
      } else if (cell.marker === 'barrier') {
        cell.note = `Barrier blocks direct crossing. Roll Domain/Skill style check to pass.`;
      } else if (cell.tradeRoute) {
        cell.note = `Trade Route lane connected to nearby Merchant Colony.`;
      } else if (cell.marker === 'beast') {
        cell.note = `Beast territory charted and bypass routes mapped.`;
      } else if (cell.marker === 'pirate') {
        cell.note = `Pirate patrol pattern identified near this corridor.`;
      } else {
        cell.note = `Traversed ${cell.terrain} successfully.`;
      }
    }
    computePlanetTradeRoutes(state);
    showNotif(`${check.text} Success.`, 'good');
  } else {
    cell.note = 'Failure — route remains dangerous.';
    if (typeof changeStress === 'function') changeStress(1);
    applyPlanetHazardFailure(state, check.text);
    showNotif(`${check.text} Failure.`, 'warn');
  }
  renderPlanetExplorationPanel();
}

function renderPlanetExplorationPanel() {
  ensureStarsState();
  const target = document.getElementById('tab-planet');
  if (!target) return;
  const planetHex = getActivePlanetHex();
  if (!planetHex || planetHex.type !== 'planet') {
    target.innerHTML = `<div style="padding:.85rem;"><div class="ship-banner"><h3>Planet Exploration</h3><p>Select a Planet hex in Galaxy to begin exploration mapping.</p></div></div>`;
    return;
  }
  const state = ensurePlanetSurfaceState(planetHex);
  if (!state) return;
  if (!state.currentWeather) state.currentWeather = rollPlanetSurfaceWeather(state.profile);
  if (!state.traversalMode) state.traversalMode = 'foot';
  if (Array.isArray(state.cells)) {
    state.cells.forEach((cell) => {
      if (typeof cell.tradeRoute !== 'boolean') cell.tradeRoute = false;
      if (typeof cell.playerNote !== 'string') cell.playerNote = '';
      if (cell.marker === 'event') cell.marker = 'site';
    });
  }
  computePlanetTradeRoutes(state);
  applyPlanetColonyPhaseOutput(state);
  const selected = state.cells.find((c) => c.id === state.selectedCellId) || state.cells[0];
  const requirements = buildPlanetRequirements(state.profile);
  const taskList = state.tasks.filter((t) => !t.resolved);
  const availableWayfarers = (state.wayfarers || []).filter((wf) => !wf.retired).slice(-6).reverse();
  const recentWayfarers = (state.wayfarers || []).slice(-4).reverse();
  const lastEvent = state.lastEvent;
  const selectedTask = selected && selected.taskId ? state.tasks.find((task) => task.id === selected.taskId && !task.resolved) : null;
  const planetMissionMarkers = (S.starSystem.taskMarkers || []).filter((task) => {
    return task && !task.resolved && task.source === 'Mission Board' && task.hexId === planetHex.id;
  });
  const activeContractCount = taskList.filter((task) => task.source === 'wayfarer').length;
  const availableContacts = availableWayfarers.filter((wf) => !wf.acceptedTaskId);
  const bypass = isPlanetHazardBypassed(state);
  const weather = (selected && selected.localWeather) ? selected.localWeather : state.currentWeather;
  const holdingInfoHtml = buildPlanetHoldingInfoHtml(state, selected);
  const canRollWildernessActions = canUsePlanetWildernessActions(selected);
  const canGenerateTask = !!(selected && (selected.marker === 'merchant_colony' || selected.marker === 'empty_colony' || selected.marker === 'holding'));
  const canUseBlackMarket = !!(selected && (selected.marker === 'merchant_colony' || selected.marker === 'holding' || selected.marker === 'dwelling' || selected.marker === 'seat' || selected.marker === 'wayfarer') && !selected.tradeRoute);
  const canUseMerchantMarket = !!(selected && (selected.marker === 'merchant_colony' || selected.marker === 'holding' || selected.tradeRoute));
  const canStealAtHolding = !!(selected && (selected.marker === 'merchant_colony' || selected.marker === 'holding'));
  const canTraverseObstacle = !!(selected && (selected.marker === 'peril' || selected.marker === 'barrier'));
  const canUseLostCityTravel = !!(selected && (selected.marker === 'lostcity' || selected.marker === 'empty_colony' || ((selected.marker === 'peril' || selected.marker === 'barrier') && selected.data && selected.data.obstacleCleared)));

  const observedCompact = `From orbit: ${state.observedSurface.observedFromSpace} | Landing: ${state.observedSurface.landingPad}`;
  const atmosphereCompact = buildPlanetAtmosphereLine(state, selected);
  const terrainCompact = `Land ${state.observedSurface.land} | Flora/Fauna ${state.observedSurface.floraFauna} | Wonder ${state.observedSurface.wonder}`;
  const narrative = buildPlanetNarrativeLines(state, selected);

  target.innerHTML = `<div style="max-width:1180px;padding:.85rem;display:grid;gap:.65rem;">
    <div class="ship-banner">
      <h3>Planet Exploration: ${state.profile.planetName}</h3>
      <p>Landed at hex ${state.landedCellId} · Surface DD${state.difficulty} · ${state.profile.planetType} (${state.profile.biome})</p>
    </div>
    <div class="sea-control-bar">
      <button class="btn btn-sm btn-teal" onclick="cyclePlanetTraversalMode()">Traversal: ${state.traversalMode === 'exocraft' ? 'Exocraft' : 'On Foot'}</button>
      <span style="color:var(--muted);font-size:.6rem;margin:0 .25rem;">|</span>
      <span style="font-family:'Rajdhani',sans-serif;font-size:.8rem;color:var(--gold2);">Open Tasks ${taskList.length}</span>
      <span style="font-family:'Rajdhani',sans-serif;font-size:.8rem;color:var(--teal);">Wayfarer Contracts ${activeContractCount}</span>
      <span style="font-family:'Rajdhani',sans-serif;font-size:.8rem;color:var(--muted2);">Contacts ${availableContacts.length}</span>
      <span style="font-family:'Rajdhani',sans-serif;font-size:.8rem;color:${bypass ? 'var(--green2)' : 'var(--red2)'};">Hazard Bypass: ${bypass ? 'Active' : 'No'}</span>
    </div>
    <div class="sea-summary">
      <div class="info-cell"><span class="ic-label">Observed Surface Data</span>${observedCompact}</div>
      <div class="info-cell"><span class="ic-label">Atmosphere + Skyline</span>${atmosphereCompact}</div>
      <div class="info-cell"><span class="ic-label">Land · Flora/Fauna · Wonder</span>${terrainCompact}</div>
      <div class="info-cell"><span class="ic-label">Terrain Effect</span>${(selected && selected.terrainEffect) ? selected.terrainEffect : state.profile.terrainEffect}</div>
    </div>
    <div class="sea-legend">
      <div class="sea-item"><div class="sea-dot" style="background:#214636;border-color:#65c98d;"></div>L Landing</div>
      <div class="sea-item"><div class="sea-dot" style="background:#3f88c5;border-color:#7fb3df;"></div>T Task</div>
      <div class="sea-item"><div class="sea-dot" style="background:#6a5800;border-color:#e8c050;"></div>✦ Wayfarer Contract</div>
      <div class="sea-item"><div class="sea-dot" style="background:#783820;border-color:#f0a840;"></div>M Merchant Colony</div>
      <div class="sea-item"><div class="sea-dot" style="background:#486734;border-color:#98c074;"></div>E Empty Colony</div>
      <div class="sea-item"><div class="sea-dot" style="background:#8b3030;border-color:#e8c050;"></div>★ Seat</div>
      <div class="sea-item"><div class="sea-dot" style="background:#3a6820;border-color:#6ed090;"></div>◉ Dwelling</div>
      <div class="sea-item"><div class="sea-dot" style="background:#502878;border-color:#b060d0;"></div>✦ Temple</div>
      <div class="sea-item"><div class="sea-dot" style="background:#502878;border-color:#c092f0;"></div>W Wayfarer</div>
      <div class="sea-item"><div class="sea-dot" style="background:#7b4c2a;border-color:#c98f5f;"></div>H Space Holding</div>
      <div class="sea-item"><div class="sea-dot" style="background:#3f3f3f;border-color:#888;"></div>R Ruins</div>
      <div class="sea-item"><div class="sea-dot" style="background:#625179;border-color:#b6a3da;"></div>✧ Weird Landmark</div>
      <div class="sea-item"><div class="sea-dot" style="background:#783820;border-color:#e05050;"></div>⚠ Peril</div>
      <div class="sea-item"><div class="sea-dot" style="background:#1a5048;border-color:#2ec4b6;"></div>◆ Gate</div>
      <div class="sea-item"><div class="sea-dot" style="background:#5a1040;border-color:#e080c0;"></div>⬡ Lost City</div>
      <div class="sea-item"><div class="sea-dot" style="background:#282828;border-color:#555555;"></div>▤ Barrier</div>
      <div class="sea-item"><div class="sea-dot" style="background:#203b4a;border-color:#5fa7c9;"></div>B Beast</div>
      <div class="sea-item"><div class="sea-dot" style="background:#6b2020;border-color:#cc6a6a;"></div>P Pirate</div>
      <div class="sea-item"><div class="sea-dot" style="background:#3a2800;border-color:#f0a840;"></div>═ Trade Route</div>
      <div class="sea-item"><div class="sea-dot" style="background:#8b3030;border-color:#df6f6f;"></div>! Hazard / ◈ Site</div>
      <div class="sea-item"><div class="sea-dot" style="background:#4b1e1e;border-color:#e05050;"></div>⚔ Missions</div>
    </div>
    <div class="planet-layout">
      <div class="planet-scroll">
        ${renderPlanetSurfaceSvg(state, selected)}
        <div class="sea-group-list" style="margin-top:.55rem;">
          ${(state.provinces || []).map((province) => {
            const provinceCells = state.cells.filter((cell) => cell.province === province);
            const explored = provinceCells.filter((cell) => cell.explored).length;
            const openTasks = provinceCells.filter((cell) => {
              if (!cell.taskId) return false;
              const task = state.tasks.find((t) => t.id === cell.taskId);
              return !!(task && !task.resolved);
            }).length;
            return `<span class="sea-chip">${province} · ${explored}/${provinceCells.length} explored · ${openTasks} open tasks</span>`;
          }).join('')}
        </div>
      </div>
      <div class="planet-info">
        <div class="sea-info-inner">
          <div class="hex-type-tag ${selected && selected.explored ? 'holding' : 'wilderness'}">${narrative.markerLabel}</div>
          <div class="hex-name">${narrative.terrainLabel}</div>
          <div class="hex-desc" style="margin-bottom:.2rem;">${narrative.terrainLabel} terrain · Hex #${selected ? selected.id : '-'} · ${selected ? selected.province : '-'}</div>

          <div class="info-cell" style="margin-bottom:.3rem;"><span class="ic-label">🌍 Land</span>${narrative.land}</div>
          <div class="info-cell" style="margin-bottom:.3rem;"><span class="ic-label">🌿 Flora & Fauna</span>${narrative.floraFauna}</div>
          <div class="info-cell" style="margin-bottom:.3rem;"><span class="ic-label">✦ Wonder</span>${narrative.wonder}</div>
          <div class="info-cell" style="margin-bottom:.3rem;"><span class="ic-label">Terrain Effect</span>${narrative.terrainEffect || state.profile.terrainEffect}</div>
          <div class="info-cell" style="margin-bottom:.3rem;"><span class="ic-label">Status</span>${selected && selected.explored ? 'Explored' : 'Unexplored'}</div>
          <div class="hex-desc" style="margin-bottom:.38rem;">${selected && selected.note ? selected.note : 'No report yet. Click a hex to explore and reveal outcomes.'}</div>
          <div style="margin-top:.15rem;"><button class="btn btn-xs btn-warn" onclick="rollPlanetTerrainEffectCheck()">⚄ Roll Terrain Effect (Wayfarer AD vs Dread)</button></div>

          <div class="sea-site" style="margin-bottom:.45rem;">
            <div class="ss-title">${narrative.detailCardTitle}</div>
            <div class="ss-text">${narrative.detailCardText}</div>
          </div>

          ${holdingInfoHtml}

          ${weather ? `<div class="weather-block ${weather.rough ? 'rough' : 'clear'}" style="margin-top:.45rem;">
            <div class="weather-label" style="color:${weather.rough ? 'var(--red2)' : 'var(--teal)'};">🌦 ${(typeof capitalize === 'function' ? capitalize(S.currentSeason || 'spring') : (S.currentSeason || 'spring'))} Weather: ${weather.label}</div>
            <div style="font-size:.81rem;color:var(--text2);">${weather.desc}</div>
            ${weather.rough ? `<div style="font-size:.76rem;color:var(--red2);margin-top:.2rem;">Dangerous weather: ${weather.check || 'lead'} vs DD${weather.dd || 6}. Failure: ${weather.failure || '+1 Stress'}</div><div style="margin-top:.25rem;"><button class="btn btn-xs btn-warn" onclick="resolvePlanetWeatherCheck()">⚄ Weather Check</button></div>` : ''}
          </div>` : ''}

          ${lastEvent && lastEvent.eventType === 'encounter' ? `<div class="sea-result" style="margin-top:.45rem;"><div class="sea-result-title">Encounter Card</div><div class="planet-micro"><strong style="color:var(--gold2);">${lastEvent.outcome}</strong><br>${lastEvent.detail}${lastEvent.cellId ? ` (Hex #${lastEvent.cellId})` : ''}</div></div>` : ''}

          <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.45rem;">
            ${canRollWildernessActions ? '<button class="btn btn-primary" onclick="rollPlanetHexEncounter()">⚄ Roll Encounter</button>' : ''}
            ${canRollWildernessActions ? '<button class="btn btn-teal btn-sm" onclick="observeAdjacentPlanetHexes()">🔍 Observe Adjacent (Lead vs DD6)</button>' : ''}
            ${canGenerateTask ? '<button class="btn btn-sm" onclick="createPlanetTask()">⚄ Generate Task</button>' : ''}
            ${canUseMerchantMarket ? '<button class="btn btn-sm btn-teal" onclick="openPlanetMerchantMarket()">🛒 Buy Goods</button>' : ''}
            ${canStealAtHolding ? '<button class="btn btn-sm btn-warn" onclick="attemptPlanetHoldingSteal()">🗡 Steal (Control vs DD8)</button>' : ''}
            ${canUseBlackMarket ? '<button class="btn btn-sm btn-dark" onclick="attemptPlanetBlackMarketAccess()">Black Market</button>' : ''}
            ${(selected && selected.marker === 'wayfarer') ? '<button class="btn btn-sm" onclick="createPlanetTask({ source: \'wayfarer\', preferredCellId: ' + selected.id + ' })">⚄ Generate Task (Wayfarer)</button>' : ''}
            ${(selected && selected.tradeRoute) ? '<button class="btn btn-sm" onclick="rollPlanetTradeRouteEncounter()">⚄ Trade Route Encounter</button><button class="btn btn-sm" onclick="showPlanetTradeGoods()">📦 Trade Goods</button>' : ''}
            ${canTraverseObstacle ? '<button class="btn btn-sm btn-primary" onclick="rollPlanetObstacleTraversal()">⚄ Traverse Obstacle (AD vs DD6)</button>' : ''}
            ${canUseLostCityTravel ? '<button class="btn btn-sm" onclick="rollPlanetLostCityTravel()">⚄ Lost City Travel (d6)</button>' : ''}
            ${(selected && selected.marker === 'ruins') ? '<button class="btn btn-sm" onclick="generatePlanetRuinRooms(' + selected.id + ')">⚄ Generate Rooms</button>' : ''}
          </div>

          ${(selected && selected.marker === 'ruins' && selected.data && selected.data.ruin) ? `<div class="sea-site" style="margin-top:.45rem;"><div class="ss-title">Ruin Details</div><div class="ss-text"><strong>Built by:</strong> ${selected.data.ruin.builder}<br><strong>Purpose:</strong> ${selected.data.ruin.builtFor}<br><strong>Construction:</strong> ${selected.data.ruin.construction}<br><strong>Entrance:</strong> ${selected.data.ruin.entrance}<br><strong>Rooms:</strong> ${selected.data.ruin.rooms} total<br><strong>Novelty:</strong> ${selected.data.ruin.novelty}</div></div>` : ''}

          <div class="sea-site" style="margin-top:.35rem;">
            <div class="ss-title">Requirements</div>
            <div class="planet-micro">${requirements.slice(0, 3).join(' · ')}<br><strong style="color:var(--gold2);">${requirements[requirements.length - 1] || ''}</strong></div>
          </div>

          ${planetMissionMarkers.length ? `<div class="sea-site" style="margin-top:.35rem;">
            <div class="ss-title">Planet Mission Markers</div>
            <div class="planet-micro">${planetMissionMarkers.map((task) => `${task.title} (${task.missionStep || 'site'})`).join(' · ')}</div>
          </div>` : ''}

          ${selectedTask ? `<div class="sea-result"><div class="sea-result-title">Selected Hex Task</div><div class="planet-micro"><strong style="color:var(--gold2);">${selectedTask.title}${selectedTask.source === 'wayfarer' ? ' ✦' : ''}</strong><br>${selectedTask.text}${selectedTask.lastRollText ? `<br><span style="color:var(--muted2);">${selectedTask.lastRollText}</span>` : ''}</div><div style="margin-top:.3rem;display:flex;gap:.25rem;flex-wrap:wrap;"><button class="btn btn-xs btn-teal" onclick="rollPlanetTaskCheck('${selectedTask.id}')">⚄ Roll to Succeed (AD vs Dread d6)</button></div></div>` : ''}

          <div style="margin-top:.55rem;border-top:1px solid var(--border);padding-top:.55rem;">
            <div class="sub-label">📝 Hex Notes</div>
            <textarea class="notes-area" placeholder="Add notes for this planet hex..." onchange="setPlanetHexNote(${selected ? selected.id : 0},this.value)">${selected && selected.playerNote ? selected.playerNote : ''}</textarea>
          </div>

          ${availableWayfarers.length ? `<div style="margin-top:.52rem;"><div class="sub-label">Wayfarer Contacts</div><div style="display:grid;gap:.3rem;">${availableWayfarers.slice(0, 3).map((wf) => {
            const hasOpenTask = !!wf.acceptedTaskId;
            return `<div class="npc-block" style="margin:0;">
              <div class="nb-label">${wf.name} · ${wf.role}</div>
              <div style="font-size:.78rem;color:var(--muted2);line-height:1.45;">${getWayfarerDialogueLine(wf, state)}</div>
              <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.2rem;">
                <button class="btn btn-xs" ${hasOpenTask ? 'disabled style="opacity:.6;cursor:default;"' : `onclick="generatePlanetWayfarerTask('${wf.id}')"`}>Generate Task</button>
                <button class="btn btn-xs btn-teal" ${hasOpenTask ? 'disabled style="opacity:.6;cursor:default;"' : `onclick="acceptPlanetWayfarerTask('${wf.id}')"`}>${hasOpenTask ? 'Contract Accepted' : 'Accept Task'}</button>
                <button class="btn btn-xs" onclick="explorePlanetCell(${wf.cellId})">Travel #${wf.cellId}</button>
              </div>
            </div>`;
          }).join('')}</div></div>` : ''}

          ${taskList.length ? `<div style="margin-top:.45rem;border-top:1px solid var(--border);padding-top:.45rem;"><div class="sub-label">Open Tasks</div><div class="planet-micro">${taskList.slice(0, 6).map((t) => `${t.source === 'wayfarer' ? '✦ ' : ''}${t.title} (#${t.cellId})`).join(' · ')}</div></div>` : ''}

          ${recentWayfarers.length ? `<div style="margin-top:.35rem;"><div class="sub-label">Recent Wayfarers</div><div class="planet-micro">${recentWayfarers.map((wf) => `${wf.name} (${wf.role})`).join(' · ')}</div></div>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function renderDerelictPanel() {
  const ds = S.starSystem.activeDerelict;
  const out = document.getElementById('starExplorationDetail');
  if (!ds || !out) return;
  if (typeof ds._currentRoomView !== 'number') ds._currentRoomView = 0;
  const roomIdx = Math.max(0, Math.min(ds.roomList.length - 1, ds._currentRoomView || 0));
  const currentRoom = ds.roomList[roomIdx] || null;
  out.innerHTML = `
    <div style="font-size:.75rem;color:var(--gold2);">Derelict Ship</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">Type: <strong>${ds.shipType}</strong> · Status: ${ds.status} · Engine: ${ds.engine} · Cause: ${ds.ruinCause}</div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="rollDerelictShipModule()">Explore Room</button>
    </div>
    <div style="margin-top:.35rem;display:grid;gap:.3rem;">${ds.roomList.length ? `<div style="display:flex;gap:.15rem;flex-wrap:wrap;">${ds.roomList.map((room, idx) => `<button class="btn btn-xs ${idx === roomIdx ? 'btn-teal' : ''}" style="padding:.15rem .3rem;font-size:.65rem;" onclick="S.starSystem.activeDerelict._currentRoomView=${idx};renderDerelictPanel();">R${room.id}${room.completed ? '✓' : ''}</button>`).join('')}</div>
    ${currentRoom ? `<div style="padding:.3rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <strong style="color:${currentRoom.completed ? 'var(--green2)' : 'var(--gold2)'};">Room ${currentRoom.id}: ${currentRoom.module}</strong><br>
      Encounter: ${currentRoom.encounter}<br>
      Trigger: ${currentRoom.trigger}<br>
      Obstacle: ${currentRoom.obstacle}<br>
      Loot: ${currentRoom.loot}
      ${buildLootActions(currentRoom.loot)}
      <div style="margin-top:.2rem;"><button class="btn btn-xs" onclick="completeDerelictRoom(${currentRoom.id})">${currentRoom.completed ? 'Completed' : 'Mark Completed'}</button></div>
    </div>` : ''}` : '<div style="font-size:.73rem;color:var(--muted2);">No rooms explored yet.</div>'}</div>`;
}

function completeDerelictRoom(roomId) {
  const ds = S.starSystem.activeDerelict;
  if (!ds) return;
  const room = ds.roomList.find(r => r.id === roomId);
  if (!room) return;
  room.completed = true;
  renderDerelictPanel();
}

function createDeadMoonMapState(deadMoonState) {
  const dm = deadMoonState || S.starSystem.activeDeadMoon || createDeadMoonState();
  const profile = getDeadMoonDirectionProfile(dm.direction);
  const cells = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      cells.push({
        id: `${row}-${col}`,
        row,
        col,
        marker: 'empty',
        visited: false,
        note: 'Ash and ruin-strewn regolith.',
      });
    }
  }
  const landing = cells.find(c => c.id === profile.landing) || cells[0];
  landing.marker = 'landing';
  landing.visited = true;
  landing.note = `Landing zone established. ${DEAD_MOON_DIRECTION_CONTEXT[dm.direction]}`;
  const site = cells.find(c => c.id === profile.site) || pick(cells.filter(c => c.id !== landing.id));
  site.marker = 'site';
  const [landingRow, landingCol] = landing.id.split('-').map(Number);
  const [siteRow, siteCol] = site.id.split('-').map(Number);
  let pathRow = landingRow;
  let pathCol = landingCol;
  while (pathRow !== siteRow || pathCol !== siteCol) {
    if (pathRow < siteRow) pathRow += 1;
    else if (pathRow > siteRow) pathRow -= 1;
    else if (pathCol < siteCol) pathCol += 1;
    else if (pathCol > siteCol) pathCol -= 1;
    const pathCell = cells.find(c => c.row === pathRow && c.col === pathCol);
    if (pathCell && pathCell.marker === 'empty') pathCell.marker = 'route';
  }
  pick(cells.filter(c => c.marker === 'empty')).marker = 'loot';
  pick(cells.filter(c => c.marker === 'empty')).marker = 'hazard';
  return { cells, selectedId: landing.id, currentId: landing.id, siteId: site.id, direction: dm.direction, profileTitle: profile.title, tableLabel: profile.tableLabel };
}

function areDeadMoonCellsAdjacent(a, b) {
  if (!a || !b) return false;
  const rowDelta = Math.abs(a.row - b.row);
  const colDelta = Math.abs(a.col - b.col);
  return rowDelta + colDelta === 1;
}

function buildDeadMoonSiteOptions() {
  return [
    {
      id: 'explore',
      label: 'Explore Site',
      stat: 'lead',
      dd: 10,
      successText: 'Success: gain random Scroll and +1 Religious Renown.',
      failText: 'Failure: trigger guardian combat on the combat pages.',
      renown: 'religious',
      reward: 'scroll',
    },
    {
      id: 'avoid',
      label: 'Avoid Traps',
      stat: 'control',
      dd: 8,
      successText: 'Success: gain 300 credits and +1 Underworld Renown.',
      failText: 'Failure: trigger guardians DD8|16 HP on combat pages.',
      renown: 'underworld',
      reward: 'credits',
    },
  ];
}

function createDeadMoonRoomChain() {
  const roomCount = 3 + roll(3);
  const rooms = [];
  let keyRoom = roll(roomCount);
  let lockRoom = roll(roomCount);
  if (lockRoom === keyRoom) lockRoom = lockRoom === roomCount ? lockRoom - 1 : lockRoom + 1;
  for (let i = 1; i <= roomCount; i++) {
    rooms.push({
      id: i,
      name: pick(['Collapsed Hall', 'Signal Vault', 'Observation Pit', 'Engine Niche', 'Broken Shrine', 'Cryo Gallery']),
      hazard: roll(4) === 1,
      locked: i === lockRoom,
      hasKey: i === keyRoom,
      explored: false,
      note: 'Unexplored room.',
    });
  }
  return { rooms, cursor: 1, keyFound: false, lockOpened: false };
}

function deadMoonAdvanceRoomChain(cell) {
  if (!cell || !cell.roomChain || !Array.isArray(cell.roomChain.rooms)) return;
  const chain = cell.roomChain;
  const room = chain.rooms.find(r => r.id === chain.cursor);
  if (!room) return;
  if (room.locked && !chain.keyFound && !chain.lockOpened) {
    room.note = 'Locked bulkhead blocks progress. Find the key first.';
    return;
  }
  room.explored = true;
  if (room.hazard) {
    room.note = 'Hazard triggered. Clear it with Control vs DD8 or take +1 Health damage.';
  } else {
    room.note = 'Room cleared.';
  }
  if (room.hasKey) {
    chain.keyFound = true;
    room.note += ' Keycard recovered.';
  }
  if (room.locked && chain.keyFound) {
    chain.lockOpened = true;
    room.note += ' Lock opened with recovered keycard.';
  }
  if (chain.cursor < chain.rooms.length) chain.cursor += 1;
}

function deadMoonAdvanceCurrentRoom() {
  const map = S.starSystem.activeDeadMoonMap;
  if (!map) return;
  const cell = (map.cells || []).find(c => c.id === map.currentId);
  if (!cell) return;
  deadMoonAdvanceRoomChain(cell);
  renderDeadMoonMapPanel();
}

function resolveDeadMoonHazard() {
  ensureStarsState();
  const map = S.starSystem.activeDeadMoonMap;
  if (!map) return;
  const cell = map.cells.find(c => c.id === map.currentId);
  if (!cell || !cell.roomChain) return;
  const room = cell.roomChain.rooms.find(r => r.id === Math.max(1, cell.roomChain.cursor - 1));
  if (!room || !room.hazard) return;
  const check = resolveGalaxySkillCheck('control', 'mind', 8, 'Hazard Clearance');
  if (check.success) {
    room.hazard = false;
    room.note = `${check.text}. Hazard cleared.`;
  } else {
    if (typeof changeStress === 'function') changeStress(1);
    room.note = `${check.text}. Failure: +1 Health damage.`;
  }
  renderDeadMoonMapPanel();
}

function resolveDeadMoonSiteOption(optionId) {
  ensureStarsState();
  const map = S.starSystem.activeDeadMoonMap;
  if (!map) return;
  const cell = map.cells.find(c => c.id === map.currentId);
  if (!cell || !Array.isArray(cell.siteOptions)) return;
  const option = cell.siteOptions.find(o => o.id === optionId);
  if (!option) return;
  const check = resolveGalaxySkillCheck(option.stat, option.stat === 'lead' ? 'mind' : 'lead', option.dd, option.label);
  if (check.success) {
    if (option.renown) changeFactionRenown(option.renown, 1);
    if (option.reward === 'credits' && typeof changeCredits === 'function') changeCredits(300);
    if (option.reward === 'scroll') {
      const loot = rollGalaxyMerchantLoot((SHOP_DATA && SHOP_DATA.scrolls) ? SHOP_DATA.scrolls.map(i => i.name) : ['Spell Scrolls']);
      cell.loot = loot;
      takeGalaxyLoot(loot, 'pack');
    }
    option.resolved = true;
    deadMoonAdvanceRoomChain(cell);
    cell.note = `${check.text}. ${option.successText}`;
  } else {
    cell.note = `${check.text}. ${option.failText}`;
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
  }
  renderDeadMoonMapPanel();
}

function checkDeadMoonGearWarnings(dm) {
  // Returns an array of warning strings about missing protective gear
  const warnings = [];
  const layers = (S.equipmentLayers) || (S.gearLayers) || {};
  const armorText = (S.equipment && S.equipment.armor) ? String(S.equipment.armor) : '';
  const suitText = layers.suit ? String(layers.suit) : '';
  const hasVaccSuit = /vaccsuit/i.test(suitText) || /vaccsuit/i.test(armorText);

  function consumeOxygenPellet() {
    if (typeof consumeBackpackItemByName === 'function') {
      return !!consumeBackpackItemByName('Oxygen Pellet');
    }
    if (!Array.isArray(S.backpack)) return false;
    for (let i = 0; i < S.backpack.length; i += 1) {
      const slot = String(S.backpack[i] || '').trim();
      if (!slot) continue;
      const m = slot.match(/^(.*?)(?:\s*x(\d+))?$/i);
      const base = (m && m[1]) ? m[1].trim() : slot;
      const count = (m && m[2]) ? Math.max(1, parseInt(m[2], 10) || 1) : 1;
      if (!/oxygen pellet/i.test(base)) continue;
      if (count > 1) S.backpack[i] = `${base} x${count - 1}`;
      else S.backpack[i] = '';
      const bpEl = document.getElementById('bp' + i);
      if (bpEl) bpEl.value = S.backpack[i];
      return true;
    }
    return false;
  }

  // Dead moons are always vacuum — check vaccsuit
  if (!hasVaccSuit) {
    warnings.push('No VaccSuit equipped — you are exposed to vacuum. Suffer 1 Health per phase.');
    if (typeof changeHealth === 'function') changeHealth(1);
  } else if (consumeOxygenPellet()) {
    warnings.push('VaccSuit consumed 1 Oxygen Pellet for breathable air.');
  } else {
    warnings.push('VaccSuit equipped but no Oxygen Pellets available — suffer 1 Health this phase.');
    if (typeof changeHealth === 'function') changeHealth(1);
  }
  // Irradiated dead moons need radsuit
  if (dm && dm.irradiated) {
    if (!layers.radsuit && !/radsuit/i.test(suitText) && !/radsuit/i.test(armorText)) {
      warnings.push('No RadSuit equipped — irradiated zone. Suffer +d100 Rads this exploration.');
      const rads = roll(100);
      if (typeof changeRads === 'function') changeRads(rads);
    } else if (layers.radsuit && /light/i.test(layers.radsuit)) {
      const rads = Math.floor(roll(100) / 2);
      if (typeof changeRads === 'function') changeRads(rads);
      warnings.push(`Light RadSuit reduces radiation to ${rads} Rads.`);
    }
  }
  return warnings;
}

function deadMoonCellClick(cellId) {
  const map = S.starSystem.activeDeadMoonMap;
  if (!map) return;
  const cell = map.cells.find(c => c.id === cellId);
  const current = map.cells.find(c => c.id === map.currentId);
  map.selectedId = cellId;
  if (cell && current && cell.id !== current.id && areDeadMoonCellsAdjacent(cell, current)) {
    map.currentId = cell.id;
    if (!cell.visited) registerStarshipTravelDays(1);
  }
  renderDeadMoonMapPanel();
}

function exploreDeadMoonMapCell() {
  ensureStarsState();
  if (!S.starSystem.activeDeadMoonMap) S.starSystem.activeDeadMoonMap = createDeadMoonMapState();
  const map = S.starSystem.activeDeadMoonMap;
  const dm = S.starSystem.activeDeadMoon || createDeadMoonState();
  const cell = map.cells.find(c => c.id === map.currentId);
  if (!cell) return;
  // Gear check on first exploration of any cell
  if (!cell.visited) {
    map.lastGearWarnings = checkDeadMoonGearWarnings(dm);
  }
  cell.visited = true;
  if (cell.marker === 'site') {
    const room = pick(DEAD_MOON_SITE_ENCOUNTERS[dm.direction]);
    const loot = rollGalaxyMerchantLoot(DEAD_MOON_LOOT);
    cell.loot = loot;
    cell.siteOptions = buildDeadMoonSiteOptions();
    if (!cell.roomChain) cell.roomChain = createDeadMoonRoomChain();
    cell.note = `Site of Interest: ${dm.site}. Room/Event: ${room}. Encounter: ${pick(DEAD_MOON_TRAVEL_EVENTS[dm.direction])}. Loot: ${loot}`;
  } else if (cell.marker === 'loot') {
    const loot = rollGalaxyMerchantLoot(DEAD_MOON_LOOT);
    cell.loot = loot;
    cell.note = `Loot cache discovered: ${loot}`;
  } else if (cell.marker === 'hazard') {
    if (!cell.hazardType) {
      const HAZARD_TYPES = [
        { type: 'Psychic Disturbance', stat: 'mind', dd: 6, failText: 'Suffer +2 Stress.', failFn: function() { if(typeof changeStress==='function') changeStress(2); } },
        { type: 'Radiation Leak', stat: 'body', dd: 8, failText: 'Suffer +100 Rads.', failFn: function() { if(typeof changeRads==='function') changeRads(100); } },
        { type: 'Unstable Flooring', stat: 'body', dd: 6, failText: 'Suffer 1 Health damage.', failFn: function() { if(typeof changeHealth==='function') changeHealth(1); } },
        { type: 'Reactive Gas', stat: 'body', dd: 8, failText: 'Suffer 1 Health damage and +1 Stress.', failFn: function() { if(typeof changeHealth==='function') changeHealth(1); if(typeof changeStress==='function') changeStress(1); } },
        { type: 'Electromagnetic Pulse', stat: 'craft', dd: 6, failText: 'Lose 1 Phase.', failFn: function() { if(typeof loseGamePhases==='function') loseGamePhases(1); } },
        { type: 'Bio-Toxin Spores', stat: 'body', dd: 10, failText: 'Suffer 2 Health damage and +100 Rads.', failFn: function() { if(typeof changeHealth==='function') changeHealth(2); if(typeof changeRads==='function') changeRads(100); } },
      ];
      cell.hazardType = pick(HAZARD_TYPES);
    }
    cell.note = `Hazard: ${cell.hazardType.type}. ${pick(DEAD_MOON_TRAVEL_EVENTS[dm.direction])} Face this hazard before moving on.`;
  } else if (cell.marker === 'route') {
    cell.note = `Approach route explored: ${pick(DEAD_MOON_TRAVEL_EVENTS[dm.direction])}`;
  } else {
    cell.note = 'The area is quiet but oppressive.';
  }
  renderDeadMoonMapPanel();
}

function renderDeadMoonMapPanel() {
  const map = S.starSystem.activeDeadMoonMap;
  const out = document.getElementById('starExplorationDetail');
  if (!map || !out) return;
  const selected = map.cells.find(c => c.id === map.selectedId);
  const current = map.cells.find(c => c.id === map.currentId);
  out.innerHTML = `
    <div style="font-size:.75rem;color:var(--gold2);margin-bottom:.25rem;">Dead Moon Landing Map (6x6) · ${map.profileTitle}</div>
    <div style="font-size:.72rem;color:var(--muted2);line-height:1.5;margin-bottom:.35rem;">Direction Table: ${map.tableLabel}<br>Click an adjacent cell to move 1 day. Current position is outlined in teal. Selected cell is outlined in gold.</div>
    ${Array.isArray(map.lastGearWarnings) && map.lastGearWarnings.length ? `<div style="padding:.3rem .5rem;margin-bottom:.3rem;background:rgba(180,30,30,.18);border:1px solid var(--red2);border-radius:.2rem;font-size:.72rem;color:var(--red2);">⚠ ${map.lastGearWarnings.join('<br>⚠ ')}</div>` : ''}
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:.2rem;">
      ${map.cells.map(cell => `<button class="btn btn-xs" style="padding:.45rem .2rem;background:${DEAD_MOON_MAP_MARKERS[cell.marker].color};color:#111;border:${cell.id === map.currentId ? '2px solid var(--teal)' : cell.id === map.selectedId ? '2px solid var(--gold2)' : '1px solid rgba(255,255,255,.08)'};box-shadow:${cell.visited ? 'inset 0 0 0 1px rgba(255,255,255,.35)' : 'none'};" onclick="deadMoonCellClick('${cell.id}')">${cell.id === map.currentId ? '◉' : cell.marker === 'site' ? '◆' : cell.marker === 'loot' ? '▣' : cell.marker === 'hazard' ? '!' : cell.marker === 'route' ? '·' : ' '}</button>`).join('')}
    </div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.35rem;">
      Current: <strong>${current.row + 1},${current.col + 1}</strong> · ${DEAD_MOON_MAP_MARKERS[current.marker].label}<br>
      Selected: <strong>${selected.row + 1},${selected.col + 1}</strong> · ${DEAD_MOON_MAP_MARKERS[selected.marker].label}<br>
      ${selected.note}
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.3rem;font-size:.68rem;color:var(--muted2);">
      ${Object.entries(DEAD_MOON_MAP_MARKERS).map(([, marker]) => `<span style="display:inline-flex;align-items:center;gap:.2rem;"><span style="display:inline-block;width:.65rem;height:.65rem;background:${marker.color};border:1px solid rgba(255,255,255,.12);"></span>${marker.label}</span>`).join('')}
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="exploreDeadMoonMapCell()">Explore Cell</button>
      ${current && current.marker === 'hazard' && current.hazardType && !current.hazardResolved ? `<button class="btn btn-xs btn-hazard" style="background:var(--red2);color:#fff;" onclick="rollDeadMoonHazardCheck()">⚠ Face Hazard (${current.hazardType.stat.toUpperCase()} DD${current.hazardType.dd})</button>` : ''}
      ${current && current.loot ? buildLootActions(current.loot) : ''}
      ${selected && selected.loot && selected.id !== current.id ? buildLootActions(selected.loot) : ''}
      <button class="btn btn-xs" onclick="rollDeadMoonDirection()">Roll New Direction</button>
    </div>`;
  if (current && Array.isArray(current.siteOptions) && current.siteOptions.length) {
    out.innerHTML += `<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">${current.siteOptions.map(opt => `<button class="btn btn-xs ${opt.resolved ? '' : 'btn-teal'}" onclick="resolveDeadMoonSiteOption('${opt.id}')">${opt.label}</button>`).join('')}</div>`;
  }
  if (current && current.roomChain && Array.isArray(current.roomChain.rooms)) {
    const chain = current.roomChain;
    out.innerHTML += `<div style="margin-top:.35rem;padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <div style="font-size:.72rem;color:var(--gold2);">Site Chain: Room ${chain.cursor}/${chain.rooms.length} · Key ${chain.keyFound ? 'Found' : 'Missing'} · Lock ${chain.lockOpened ? 'Opened' : 'Sealed'}</div>
      <div style="display:grid;gap:.2rem;margin-top:.25rem;">${chain.rooms.map(r => `<div style="font-size:.7rem;color:${r.explored ? 'var(--muted2)' : 'var(--text2)'};">${r.id}. ${r.name}${r.locked ? ' [Lock]' : ''}${r.hasKey ? ' [Key]' : ''}${r.hazard ? ' [Hazard]' : ''} — ${r.note}</div>`).join('')}</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.25rem;"><button class="btn btn-xs" onclick="deadMoonAdvanceCurrentRoom()">Advance Room</button><button class="btn btn-xs" onclick="resolveDeadMoonHazard()">Clear Hazard</button></div>
    </div>`;
  }
}

function rollDeadMoonHazardCheck() {
  ensureStarsState();
  const map = S.starSystem.activeDeadMoonMap;
  if (!map) return;
  const cell = map.cells.find(c => c.id === map.currentId);
  if (!cell || !cell.hazardType) return;
  const h = cell.hazardType;
  const advDie = (S.equipment && S.equipment.die) ? S.equipment.die : 'd6';
  const dreadRoll = roll(6);
  const advVal = roll(parseInt(advDie.replace('d','')) || 6);
  const succeeded = advVal >= dreadRoll;
  const stat = h.stat;
  let statBonus = 0;
  if (S.stats && S.stats[stat] != null) statBonus = S.stats[stat];
  const finalAdv = advVal + statBonus;
  const resultText = succeeded
    ? `<span style="color:var(--teal)">SUCCESS (Adv ${finalAdv} vs Dread ${dreadRoll})</span> — Hazard bypassed.`
    : `<span style="color:var(--red2)">FAILURE (Adv ${finalAdv} vs Dread ${dreadRoll})</span> — ${h.failText}`;
  if (!succeeded && typeof h.failFn === 'function') h.failFn();
  cell.hazardResolved = succeeded || undefined;
  if (succeeded) cell.hazardResolved = true;
  const out = document.getElementById('starExplorationDetail');
  if (out) {
    const existingResult = out.querySelector('#hazardCheckResult');
    if (existingResult) existingResult.remove();
    const div = document.createElement('div');
    div.id = 'hazardCheckResult';
    div.style.cssText = 'margin-top:.35rem;padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.75rem;line-height:1.5;';
    div.innerHTML = `<strong>Hazard Check (${stat.toUpperCase()} DD${h.dd}):</strong><br>${resultText}`;
    out.appendChild(div);
    if (succeeded) {
      const btns = out.querySelectorAll('.btn-hazard');
      btns.forEach(b => b.disabled = true);
    }
  }
}

function rollDerelictShipModule() {
  ensureStarsState();
  const ds = S.starSystem.activeDerelict || createDerelictShipState();
  S.starSystem.activeDerelict = ds;
  if (ds.explored >= ds.modules) {
    const outDone = document.getElementById('starExplorationDetail');
    if (outDone) outDone.innerHTML = '<span style="color:var(--gold2);">All derelict modules explored. Return to ship.</span>';
    return;
  }
  ds.explored += 1;
  const room = {
    id: ds.roomList.length + 1,
    module: DERELICT_MODULE_TABLE[roll(DERELICT_MODULE_TABLE.length) - 1],
    encounter: pick(['Skittering within the walls', 'Banging inside vents', 'Something crawls beneath the floor', 'Thumps in the ceiling', 'Death worm outlines under plating', 'Paralyzing crawlers DD4|8 Health', 'Toxic crawlers DD4|8 Health + d100 Rads', 'Nothing']),
    trigger: pick(FACILITY_TRIGGERS),
    obstacle: pick(FACILITY_OBSTACLES),
    loot: rollGalaxyMerchantLoot(['d6 Standard Fuel (+1 fuel slot)', 'd4 Hub Jumps', 'd4 Hyperdrives', 'First-Aid Kit', 'Toolkit', 'Hack Data Drive', 'Spell Scrolls', 'Exocraft', 'Vehicle Mod', 'Ranged Weapon', 'Melee Weapon', 'Armor']),
    completed: false,
  };
  ds.roomList.push(room);
  renderDerelictPanel();
}

function buildGalaxyLocationDetail(ring) {
  const entries = STAR_LOCATION_DETAILS[ring] || STAR_LOCATION_DETAILS.middle;
  const entry = entries[roll(entries.length) - 1];
  return `
    <div style="font-size:.75rem;color:var(--gold2);">Location: ${entry.name}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.15rem;">
      Services: ${entry.services}<br>
      Hook: ${entry.hook}<br>
      Landing at this location repairs hull stress and grants merchant access.
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="landAtGalaxyLocation()">Land (+1 Travel Day)</button>
    </div>`;
}

function landAtGalaxyLocation() {
  ensureStarsState();
  S.starship.shields = 0;
  updateStarshipUI();
  registerStarshipTravelDays(1);
  showNotif('Docked successfully: hull stress reset and travel day advanced.', 'good');
}

function buildGalaxySkirmishDetail() {
  const factions = (S.starSystem.factions || []).slice(0, 2);
  const left = factions[0] || pick(['Dustline Pirates', 'Vanta Runners', 'Frontier Militia']);
  const right = factions[1] || pick(['Crown Patrol', 'Null Saints', 'Free Orbit Assembly']);
  const cause = pick(STAR_SKIRMISH_CAUSES);
  const stakes = pick(STAR_SKIRMISH_STAKES);
  const zone = pick(COMBAT_ZONES_PRESETS);
  return `
    <div style="font-size:.75rem;color:var(--gold2);">Skirmish Contact</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.15rem;">
      Sides: <strong>${left}</strong> vs <strong>${right}</strong><br>
      Cause: ${cause}<br>
      Stakes: ${stakes}<br>
      Suggested battlefield: <strong>${zone.name}</strong> (${zone.desc})
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="switchTab('combat', document.querySelector(\".tab-btn[onclick*=\\\"combat\\\"]\"))">Go To Combat Tab</button>
    </div>`;
}

function buildUneventfulVoyageDetail() {
  return `
    <div style="font-size:.75rem;color:var(--gold2);">Uneventful Voyage</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.15rem;">
      No hostile contact. Crew may perform one downtime action while crossing this lane.
    </div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs" onclick="resolveGalaxyDowntimeAction('repairs')">Patch Ship Systems</button>
      <button class="btn btn-xs" onclick="resolveGalaxyDowntimeAction('drill')">Run Crew Drill</button>
      <button class="btn btn-xs" onclick="resolveGalaxyDowntimeAction('salvage')">Sweep Debris</button>
      <button class="btn btn-xs btn-teal" onclick="resolveGalaxyDowntimeAction('rest')">Quiet Rest</button>
    </div>
    <div style="font-size:.7rem;color:var(--muted2);margin-top:.25rem;">Each downtime action advances +1 Starship Travel Day.</div>`;
}

function resolveGalaxyDowntimeAction(actionId) {
  ensureStarsState();
  const action = STAR_DOWNTIME_ACTIONS[actionId];
  const out = document.getElementById('starExplorationDetail');
  if (!action || !out) return;

  let success = true;
  let actionResult = '';
  if (actionId === 'rest') {
    actionResult = action.success();
  } else {
    const statKey = actionId === 'repairs' ? 'control' : (actionId === 'drill' ? 'lead' : 'mind');
    const die = (typeof getEffectiveDie === 'function') ? getEffectiveDie(statKey) : ((S.stats && S.stats[statKey]) || 4);
    const actionRoll = explodingRoll(die);
    const dreadRoll = explodingRoll(actionId === 'salvage' ? 8 : 6);
    success = actionRoll.total >= dreadRoll.total;
    actionResult = success ? action.success() : action.failure();
    if (success && typeof addSuccessRoll === 'function') addSuccessRoll();
    if (!success && typeof addTMWOnFail === 'function') addTMWOnFail();
    actionResult = `${action.check}: d${die}=${actionRoll.total} vs DD${actionId === 'salvage' ? 8 : 6}=${dreadRoll.total}. ${actionResult}`;
  }

  registerStarshipTravelDays(1);
  out.innerHTML = `
    <div style="font-size:.75rem;color:${success ? 'var(--green2)' : 'var(--red2)'};">Downtime: ${action.label}</div>
    <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;margin-top:.15rem;">${actionResult}</div>
    <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
      <button class="btn btn-xs btn-teal" onclick="rollStarSystemExploration()">Continue Exploring</button>
      <button class="btn btn-xs" onclick="resolveGalaxyDowntimeAction('${actionId}')">Repeat Action</button>
    </div>`;
}

function buildStarExplorationDetail(ring, outcome) {
  if (outcome === 'Mystery') {
    const hex = getCurrentStarHex();
    S.starSystem.activeMystery = getHexPersistentState(hex, 'mystery', function() { return createMysteryState(ring); });
    setTimeout(renderMysteryPanel, 0);
    return `Mystery contact detected. Open channel and assess crew intentions.`;
  }
  if (outcome === 'Peril') {
    const hex = getCurrentStarHex();
    const peril = getHexPersistentState(hex, 'peril', function() { return createGalaxyPerilState(ring); });
    return `<div style="font-size:.75rem;color:var(--gold2);">⚠ ${peril.title}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.55;margin-top:.15rem;">${peril.text}<br><strong>⚔ Traversal Check</strong><br>Roll ${peril.check.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' or ')} vs DD${peril.dd}. Failure: Stress/Radiation/Health/Condition/Trauma risk and lose 1 Phase.</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;"><button class="btn btn-xs btn-teal" onclick="resolveGalaxyPerilTraversal()">Traverse Peril</button></div>`;
  }
  if (outcome === 'Galactic Facility') {
    const hex = getCurrentStarHex();
    const f = getHexPersistentState(hex, 'facility', createFacilityState);
    S.starSystem.activeFacility = f;
    setTimeout(renderFacilityPanel, 0);
    return `Galactic Facility ${f.code} identified. Docking and module exploration available.`;
  }
  if (outcome === 'Space Encounter') {
    const e = JSON.parse(JSON.stringify(STAR_SPACE_ENCOUNTERS[roll(10) - 1]));
    e.options = (e.options || []).map(opt => Object.assign({ resolved: false }, opt));
    S.starSystem.activeSpaceEncounter = e;
    setTimeout(renderSpaceEncounterPanel, 0);
    return 'Space encounter lock acquired. Choose an option below to resolve checks, combat cues, and rewards.';
  }
  if (outcome === 'Locations') {
    const current = getCurrentStarHex();
    if (current && current.type === 'hub') {
      S.starSystem.activeHub = getHexPersistentState(current, 'hub', function() { return createSpaceHubState(ring); });
      setTimeout(renderSpaceHubPanel, 0);
      return 'Space Hub acquired on scans. Docking protocols available.';
    }
    return buildGalaxyLocationDetail(ring);
  }
  if (outcome === 'Dead Moon') {
    const hex = getCurrentStarHex();
    const dm = getHexPersistentState(hex, 'deadMoon', createDeadMoonState);
    S.starSystem.activeDeadMoon = dm;
    S.starSystem.activeDeadMoonMap = getHexPersistentState(hex, 'deadMoonMap', createDeadMoonMapState);
    return `
      <div style="font-size:.75rem;color:var(--gold2);">Dead Moon</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">Dead Moons are unique to the Inner Rings and often desecrated by collapse-era hubris. VaccSuit recommended. ${dm.irradiated ? '<span style="color:var(--red2);">Irradiated: +d100 Rads/day.</span>' : 'No immediate radiation spike detected.'}<br>Initial Direction: <strong>${dm.direction.toUpperCase()}</strong> · Site: <strong>${dm.site}</strong></div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.35rem;">
        <button class="btn btn-xs btn-teal" onclick="renderDeadMoonMapPanel()">Land & Explore 6x6 Map</button>
        <button class="btn btn-xs" onclick="rollDeadMoonDirection()">Roll Direction Travel</button>
      </div>`;
  }
  if (outcome === 'Skirmish') {
    return buildGalaxySkirmishDetail();
  }
  if (outcome === 'Derelict Ship') {
    const hex = getCurrentStarHex();
    const ds = getHexPersistentState(hex, 'derelict', createDerelictShipState);
    S.starSystem.activeDerelict = ds;
    setTimeout(renderDerelictPanel, 0);
    return `Derelict contact acquired. Survivors: ${ds.survivorCount}. Rooms can now be explored.`;
  }
  return buildUneventfulVoyageDetail();
}

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
        scanned: dist === 0,
        hiddenOutcome: null,
        analysisDetail: '',
        land: dist === 0 ? 'Solar Crown' : pick(STAR_HEX_LAND),
        flora: dist === 0 ? 'Solar filaments' : pick(STAR_HEX_FLORA),
        wonder: dist === 0 ? 'Main sequence furnace' : pick(STAR_HEX_WONDER),
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
      hex.type = 'nothing';
      hex.hiddenOutcome = pickRingEncounterOutcome(ring);
      hex.detail = 'Unresolved signal. Run System Analysis to reveal signature.';
    });
  });

  const worldPool = [...byRing.middle].filter(h => h.type !== 'hub' && h.type !== 'planet');
  if (worldPool.length) {
    const target = worldPool[roll(worldPool.length) - 1];
    target.type = 'world_that_was';
    target.hiddenOutcome = null;
    target.scanned = true;
    target.explored = true;
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
  S.starSystem.generatedName = generateStarSystemName();
  S.starSystem.hexes = cells;
  S.starSystem.tradeRoutes = planetsByRing;
  S.starSystem.currentHexId = 0;
  S.starSystem.majorPowers = powerSet.majorPowers;
  S.starSystem.factions = powerSet.factions;
  S.starSystem.selectedRing = 'middle';
  S.starSystem.taskMarkers = [];
  S.starSystem.radioTaskMarkers = [];
  S.starSystem.currentWeather = null;
  S.starSystem.galaxyGenerated = true;
  window._lastGeneratedGalaxy = cloneStarsData(S.starSystem);
  clearActiveGalaxyPanels();

  renderStarSystemMap();
  rollStarSystemWeather();
  updateStarSystemReadouts();
  showNotif(`Generated ${S.starSystem.generatedName} (${type}) with 37 hexes.`, 'good');
}

function getStarHexGlyph(hex) {
  const map = {
    star: '☉',
    hub: '⌂',
    planet: '◍',
    world_that_was: '⛧',
    peril: '⚠',
    dead_moon: '☾',
    derelict_ship: '☠',
    mystery: '?',
    facility: '▣',
    skirmish: '✦',
    encounter: '✶',
    radio_task: '✉',
    location: '◈',
    nothing: '·',
  };
  return map[hex.type] || String(hex.id);
}

function renderStarSystemMap() {
  const host = document.getElementById('starSystemMap');
  if (!host) return;
  ensureStarsState();

  if (!S.starSystem.hexes.length) {
    host.innerHTML = '<div style="font-size:.76rem;color:var(--muted2);padding:.55rem;border:1px solid var(--border);background:rgba(6,8,16,.45);">No galaxy generated yet. Click <strong style="color:var(--gold2);">Generate Galaxy Map</strong>.</div>';
    return;
  }

  const size = 34;
  const cx = 500;
  const cy = 360;
  const scaleX = size * 1.7;
  const scaleY = size * 1.45;

  const positionForHex = (hex) => {
    const baseX = cx + hex.q * scaleX + hex.r * (scaleX * 0.5);
    const baseY = cy + hex.r * scaleY;
    const type = S.starSystem.galaxyType || 'cluster';
    const dist = Number(hex.dist) || 0;
    if (type === 'spiral') {
      const dx = baseX - cx;
      const dy = baseY - cy;
      const radius = Math.sqrt((dx * dx) + (dy * dy));
      const angle = Math.atan2(dy, dx);
      const swirl = dist * 0.5;
      const radialScale = 0.86 + (dist * 0.07);
      return {
        x: cx + Math.cos(angle + swirl) * radius * radialScale,
        y: cy + Math.sin(angle + swirl) * radius * (0.78 + (dist * 0.06)),
      };
    }
    if (type === 'elliptical') {
      return {
        x: cx + (baseX - cx) * 1.24,
        y: cy + (baseY - cy) * 0.68,
      };
    }
    // Cluster keeps the core shape but adds slight deterministic drift by distance.
    return {
      x: baseX + (hex.r * 3) + (dist * 2),
      y: baseY + (hex.q * 2) - (dist * 1.5),
    };
  };

  const hexPositions = {};
  S.starSystem.hexes.forEach((hex) => {
    hexPositions[hex.id] = positionForHex(hex);
  });

  const svgHexes = S.starSystem.hexes.map((hex) => {
    const pos = hexPositions[hex.id] || { x: cx, y: cy };
    const x = pos.x;
    const y = pos.y;
    const pts = hexPointsSVG(x, y, size - 2);
    const key = STAR_SIGHTING_COLORS[hex.type] ? hex.type : 'nothing';
    const fill = STAR_SIGHTING_COLORS[key].color;
    const hasTaskMarker = !!(hex.taskMarker && !hex.taskMarker.resolved);
    const border = hasTaskMarker ? '#f2d75a' : hex.id === S.starSystem.currentHexId ? '#ffffff' : '#2d3142';
    const opacity = hex.explored ? 0.9 : 0.55;
    const label = getStarHexGlyph(hex);
    const markerGlyph = hasTaskMarker ? '✦' : hex.type === 'radio_task' && !hex.radioTaskResolved ? '✉' : '';
    const onTradeRoute = (S.starSystem.tradeRoutes || []).some(([aId, bId]) => aId === hex.id || bId === hex.id);
    const routeBadge = onTradeRoute ? `<circle cx="${x - 13}" cy="${y - 10}" r="4" fill="rgba(214,176,70,.55)" stroke="#d6b046" stroke-width="1"/>` : '';
    return `
      <g onclick="selectStarSystemHex(${hex.id})" style="cursor:pointer;">
        <polygon points="${pts}" fill="${fill}" fill-opacity="${opacity}" stroke="${border}" stroke-width="${hasTaskMarker ? 3 : hex.id === S.starSystem.currentHexId ? 2 : 1}" />
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="11" fill="#0f111a">${label}</text>
        ${routeBadge}
        ${markerGlyph ? `<text x="${x + 13}" y="${y - 10}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="13" fill="${hasTaskMarker ? '#f2d75a' : '#9de7ff'}" onclick="event.stopPropagation(); ${hasTaskMarker ? `openGalaxyTaskFromMap(${hex.id})` : ''}" style="cursor:${hasTaskMarker ? 'zoom-in' : 'pointer'};">${markerGlyph}</text>` : ''}
      </g>`;
  }).join('');

  const routeLines = (S.starSystem.tradeRoutes || []).map(([aId, bId]) => {
    const a = hexPositions[aId];
    const b = hexPositions[bId];
    if (!a || !b) return '';
    const ax = a.x;
    const ay = a.y;
    const bx = b.x;
    const by = b.y;
    return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="rgba(214,176,70,.45)" stroke-width="1.3" />`;
  }).join('');

  host.innerHTML = `
    <svg width="1000" height="760" xmlns="http://www.w3.org/2000/svg" style="max-width:none;background:linear-gradient(180deg,rgba(5,8,18,.95),rgba(7,10,20,.72));border:1px solid var(--border);">
      ${routeLines}
      ${svgHexes}
    </svg>`;

  const fuel = document.getElementById('starFuelReadout');
  if (fuel) {
    fuel.textContent = `Fuel S/H/H: ${S.starship.fuel.standard || 0}/${S.starship.fuel.hubJump || 0}/${S.starship.fuel.hyperdrive || 0}`;
  }
  const coords = document.getElementById('starCoords');
  const cur = getCurrentStarHex();
  if (coords && cur) {
    coords.textContent = `Hex ${cur.id} (q:${cur.q}, r:${cur.r})`;
  }
}

function selectStarSystemHex(hexId) {
  ensureStarsState();
  const prevId = S.starSystem.currentHexId;
  const next = (S.starSystem.hexes || []).find(hx => hx.id === hexId);
  const prev = (S.starSystem.hexes || []).find(hx => hx.id === prevId);
  if (!next) return;

  if (prevId != null && prevId !== hexId && prev && next && next.ring !== 'core') {
    const distance = starHexDistance(prev, next);
    if (distance <= 1) {
      if ((S.starship.fuel.standard || 0) <= 0) {
        showNotif('No Standard Fuel available for adjacent travel.', 'warn');
        return;
      }
      S.starship.fuel.standard -= 1;
      if (isHexOnTradeRoute(hexId)) applyTradeRouteTravelBonus(hexId);
      registerStarshipTravelDays(DAYS_PER_WEEK);
      showNotif('Travel complete: adjacent hex, Standard Fuel -1.', 'good');
    } else {
      if ((S.starship.fuel.hyperdrive || 0) <= 0) {
        showNotif('No Hyperdrive fuel available for non-adjacent travel.', 'warn');
        return;
      }
      if (!canHyperdriveToHex(next)) {
        showNotif('Hyperdrive requires a known/scanned destination.', 'warn');
        return;
      }
      S.starship.fuel.hyperdrive -= 1;
      registerStarshipTravelDays(Math.max(1, Math.round(distance)) * DAYS_PER_WEEK);
      showNotif(`Hyperdrive engaged for ${Math.max(1, Math.round(distance))}-hex jump.`, 'good');
    }
  }
  S.starSystem.currentHexId = hexId;
  const h = getCurrentStarHex();
  if (h && h.type === 'planet') {
    S.starSystem.activePlanetHexId = h.id;
    ensurePlanetSurfaceState(h);
  }
  if (h && h.ring && h.ring !== 'core') S.starSystem.selectedRing = h.ring;
  const ringSel = document.getElementById('starRingSelect');
  if (ringSel && h && h.ring && h.ring !== 'core') ringSel.value = h.ring;
  clearActiveGalaxyPanels();
  renderStarSystemMap();
  rollStarSystemWeather();
  updateStarSystemReadouts();
}

function getCurrentStarHex() {
  ensureStarsState();
  return S.starSystem.hexes.find(h => h.id === S.starSystem.currentHexId) || S.starSystem.hexes[0] || null;
}

function getHexPersistentState(hex, key, factory) {
  if (!hex) return null;
  if (!hex.persistentState || typeof hex.persistentState !== 'object') hex.persistentState = {};
  if (!hex.persistentState[key] && typeof factory === 'function') hex.persistentState[key] = factory();
  return hex.persistentState[key] || null;
}

function getNearestHubHex(fromHex) {
  const hubs = (S.starSystem.hexes || []).filter(h => h.type === 'hub');
  if (!fromHex || !hubs.length) return null;
  return hubs.slice().sort((a, b) => starHexDistance(fromHex, a) - starHexDistance(fromHex, b))[0];
}

function canHyperdriveToHex(hex) {
  if (!hex) return false;
  if (hex.type === 'hub' || hex.type === 'planet' || hex.type === 'world_that_was' || hex.type === 'star') return true;
  return !!hex.scanned;
}

function travelToSelectedGalaxyHex() {
  ensureStarsState();
  const fromHex = getCurrentStarHex();
  const toHex = S.starSystem.hexes.find(h => h.id === Number(S.starSystem.currentHexId));
  const mode = (document.getElementById('starTravelMode') || {}).value || 'standard';
  if (!fromHex || !toHex) return;

  if (mode === 'hub') {
    if ((S.starship.fuel.hubJump || 0) <= 0) return showNotif('No Hub Jump fuel available.', 'warn');
    const nearest = getNearestHubHex(fromHex);
    if (!nearest) return showNotif('No Space Hub found in this sector.', 'warn');
    S.starship.fuel.hubJump -= 1;
    S.starSystem.currentHexId = nearest.id;
    registerStarshipTravelDays(DAYS_PER_WEEK * 3);
    updateStarshipUI();
    renderStarSystemMap();
    updateStarSystemReadouts();
    return showNotif('Hub Jump complete: arrived at nearest Space Hub (+3 weeks).', 'good');
  }

  const distance = starHexDistance(fromHex, toHex);
  if (distance <= 0) return showNotif('Select another hex to travel.', 'warn');

  if (mode === 'hyper') {
    if ((S.starship.fuel.hyperdrive || 0) <= 0) return showNotif('No Hyperdrive fuel available.', 'warn');
    if (!canHyperdriveToHex(toHex)) return showNotif('Hyperdrive requires a known/scanned destination.', 'warn');
    S.starship.fuel.hyperdrive -= 1;
    S.starSystem.currentHexId = toHex.id;
    registerStarshipTravelDays(Math.max(1, Math.round(distance)) * DAYS_PER_WEEK);
    updateStarshipUI();
    renderStarSystemMap();
    updateStarSystemReadouts();
    return showNotif(`Hyperdrive jump complete (${Math.max(1, Math.round(distance))} weeks).`, 'good');
  }

  if (distance > 1) {
    // Non-adjacent hex: check if Hyperdrive is available to auto-jump
    if ((S.starship.fuel.hyperdrive || 0) > 0 && canHyperdriveToHex(toHex)) {
      S.starship.fuel.hyperdrive -= 1;
      S.starSystem.currentHexId = toHex.id;
      registerStarshipTravelDays(Math.max(1, Math.round(distance)) * DAYS_PER_WEEK);
      updateStarshipUI();
      renderStarSystemMap();
      updateStarSystemReadouts();
      return showNotif(`Hyperdrive auto-engaged for non-adjacent hex jump (${Math.max(1, Math.round(distance))} weeks).`, 'good');
    }
    return showNotif('Standard travel moves 1 adjacent hex per week. Use Hyperdrive for longer jumps.', 'warn');
  }
  
  if ((S.starship.fuel.standard || 0) <= 0) return showNotif('No Standard Fuel available.', 'warn');
  S.starship.fuel.standard -= 1;
  S.starSystem.currentHexId = toHex.id;
  registerStarshipTravelDays(DAYS_PER_WEEK);
  updateStarshipUI();
  renderStarSystemMap();
  updateStarSystemReadouts();
  showNotif('Standard travel complete: 1 hex / 1 week, fuel -1.', 'good');
}

function runGalaxyEncounterRoll() {
  ensureStarsState();
  const hex = getCurrentStarHex();
  if (!hex) return;
  const ring = (hex.ring && hex.ring !== 'core') ? hex.ring : (S.starSystem.selectedRing || 'middle');
  let outcome = hex.hiddenOutcome || pickRingEncounterOutcome(ring);
  const tradeBonus = isHexOnTradeRoute(hex.id);
  // On a trade route, re-roll a non-encounter once to favour Merchant/Contact encounters
  if (tradeBonus && outcome !== 'Space Encounter' && roll(6) >= 4) {
    outcome = 'Space Encounter';
    if (!hex.hiddenOutcome) hex.hiddenOutcome = outcome;
  }
  const out = document.getElementById('starExplorationResult');
  if (out) out.innerHTML = `<span style="color:var(--gold2);">Encounter</span> -> ${ring.toUpperCase()} ring: <strong>${outcome}</strong>${tradeBonus ? ' <span style="color:var(--gold2);font-size:.7rem;">[Trade Route +]</span>' : ''}`;

  const detailEl = document.getElementById('starExplorationDetail');
  if (detailEl) {
    const detailText = buildStarExplorationDetail(ring, outcome);
    detailEl.innerHTML = `<div style="font-size:.74rem;color:var(--muted2);line-height:1.5;">${detailText}</div>`;
  }
}

function runFurtherSystemAnalysis() {
  ensureStarsState();
  const hex = getCurrentStarHex();
  const out = document.getElementById('starAnalysisResult');
  if (!hex) return;
  if (!hex.scanned) return out && (out.innerHTML = '<span style="color:var(--red2);">Run System Analysis first.</span>');

  const mindDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('mind') : ((S.stats && S.stats.mind) || 4);
  const techDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('control') : ((S.stats && S.stats.control) || 4);
  const die = Math.max(mindDie, techDie);
  const action = explodingRoll(die);
  const dread = explodingRoll(8);
  const success = action.total >= dread.total;
  registerStarshipTravelDays(1);

  if (success) {
    if (hex.type === 'planet') {
      const reveal = rollPlanetFurtherAnalysis(hex);
      hex.analysisDetail = reveal
        ? `Further analysis: ${reveal.title}. ${reveal.text}`
        : 'Further analysis completed with no additional signal.';
    } else {
      const sig = hex.hiddenOutcome || (hex.type === 'hub' ? 'Galactic Facility' : 'Uneventful Voyage');
      hex.analysisDetail = `Further analysis: ${sig}. ${sig === 'Space Encounter' ? 'Scanner identifies vessel class and likely crew disposition.' : 'Additional telemetry refines target details and approach risks.'}`;
    }
    setPositiveGalaxyCondition('focused');
    if (out) out.innerHTML = `<span style="color:var(--green2);">Further Analysis Success</span>: d${die}=${action.total} vs DD8=${dread.total}.`;
  } else {
    if (out) out.innerHTML = `<span style="color:var(--red2);">Further Analysis Failed</span>: d${die}=${action.total} vs DD8=${dread.total}. Day spent with noisy telemetry.`;
  }
  updateStarSystemReadouts();
}

function updateStarSystemReadouts() {
  const detail = document.getElementById('starSystemHexDetail');
  const panel = document.getElementById('starHexInfoBody');
  const powers = document.getElementById('starSystemPowers');
  const radio = document.getElementById('starSystemRadioLog');
  const current = getCurrentStarHex();

  if (detail) {
    if (!current) detail.textContent = 'No hex selected.';
    else {
      const sig = STAR_SIGHTING_COLORS[current.type] || STAR_SIGHTING_COLORS.nothing;
      detail.innerHTML = `Hex ${current.id} · ${current.ring.toUpperCase()} RING · <span style="color:${sig.color};">${sig.label}</span>${current.taskMarker && !current.taskMarker.resolved ? ' · <strong style="color:var(--gold2);">TASK MARKER</strong>' : ''}<br><span style="color:var(--muted2);">${current.detail || 'No detail yet.'}</span>`;
    }
  }
  if (panel) {
    if (!current) {
      panel.innerHTML = '<div style="font-size:.83rem;color:var(--muted2);">Select a hex to inspect.</div>';
    } else {
      const sig = STAR_SIGHTING_COLORS[current.type] || STAR_SIGHTING_COLORS.nothing;
      const actionButtons = [];
      const hubState = current.type === 'hub'
        ? getHexPersistentState(current, 'hub', function() { return createSpaceHubState(current.ring); })
        : null;
      if (current.type === 'hub') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="var h=getCurrentStarHex();S.starSystem.activeHub=getHexPersistentState(h,\'hub\',function(){return createSpaceHubState(h.ring);});renderSpaceHubPanel();">Open Space Hub</button>');
      if (current.type === 'planet' && current.scanned) {
        actionButtons.push('<button class="btn btn-xs btn-teal" onclick="rollPlanetExploration()">Planet Exploration</button>');
        actionButtons.push('<button class="btn btn-xs" onclick="openActivePlanetMap()">Open Planet Map</button>');
      }
      if (current.type === 'derelict_ship') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="var h=getCurrentStarHex();S.starSystem.activeDerelict=getHexPersistentState(h,\'derelict\',createDerelictShipState);renderDerelictPanel();">Explore Derelict</button>');
      if (current.type === 'dead_moon') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="var h=getCurrentStarHex();S.starSystem.activeDeadMoonMap=getHexPersistentState(h,\'deadMoonMap\',createDeadMoonMapState);renderDeadMoonMapPanel();">Land On Dead Moon</button>');
      if (current.type === 'mystery') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="var h=getCurrentStarHex();S.starSystem.activeMystery=getHexPersistentState(h,\'mystery\',function(){return createMysteryState(h.ring);});renderMysteryPanel();">Hail Mystery Contact</button>');
      if (current.type === 'facility') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="var h=getCurrentStarHex();S.starSystem.activeFacility=getHexPersistentState(h,\'facility\',createFacilityState);renderFacilityPanel();">Dock At Facility</button>');
      if (current.type === 'radio_task') actionButtons.push('<button class="btn btn-xs btn-teal" onclick="resolveGalaxyRadioTask()">Resolve Radio Task</button>');
      if (current.taskMarker && !current.taskMarker.resolved) actionButtons.push('<button class="btn btn-xs btn-teal" onclick="renderGalaxyTaskPanel(\'' + current.taskMarker.id + '\')">Open Galaxy Task</button>');
      panel.innerHTML = `
        <div style="display:grid;gap:.35rem;">
          ${S.starSystem.currentWeather ? `<div class="weather-block ${S.starSystem.currentWeather.rough ? 'rough' : 'clear'}" style="padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
            <div style="font-size:.9rem;color:${S.starSystem.currentWeather.rough ? 'var(--red2)' : 'var(--teal)'};"><strong>Weather:</strong> ${S.starSystem.currentWeather.name}</div>
            <div style="font-size:.82rem;color:var(--muted2);line-height:1.5;">${S.starSystem.currentWeather.desc}</div>
            <div style="font-size:.78rem;color:var(--muted2);margin-top:.2rem;">${S.starSystem.currentWeather.dd > 0 ? `⚠ ${S.starSystem.currentWeather.checkLabel} vs DD${S.starSystem.currentWeather.dd}. Failure: ${S.starSystem.currentWeather.failure}` : 'Clear travel lane. No traversal check required.'}</div>
            ${S.starSystem.currentWeather.dd > 0 ? '<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.25rem;"><button class="btn btn-xs" onclick="resolveGalaxyWeatherCheck()">Traverse Weather</button></div>' : ''}
          </div>` : ''}
          ${current.type === 'radio_task' && !current.radioTaskResolved ? `<div style="padding:.42rem;border:1px solid rgba(80,200,255,.7);background:rgba(80,200,255,.08);font-size:.84rem;color:#dff8ff;line-height:1.55;">Radio event marker active in this hex. Resolve it here before it goes cold.</div>` : ''}
          <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
            <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Land</div>
            <div style="font-size:.96rem;color:var(--text);margin-top:.08rem;">${current.land || 'Unknown'}</div>
          </div>
          <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
            <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Flora / Fauna</div>
            <div style="font-size:.96rem;color:var(--text);margin-top:.08rem;">${current.flora || 'Unknown'}</div>
          </div>
          <div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
            <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Wonder</div>
            <div style="font-size:.96rem;color:var(--text);margin-top:.08rem;">${current.wonder || 'Unknown'}</div>
          </div>
          ${(current.type === 'planet' && current.scanned) ? `<div style="padding:.42rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.82rem;color:var(--muted2);line-height:1.55;">Detailed planet surface data is available in the Planet Exploration tab.</div>` : ''}
          <div style="padding:.4rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);font-size:.88rem;color:var(--muted2);line-height:1.7;">
            <strong style="color:var(--text);">Signature:</strong> <span style="color:${sig.color};">${sig.label}</span><br>
            <strong style="color:var(--text);">Status:</strong> ${current.scanned ? 'System Analysis complete' : 'Unresolved'}<br>
            ${hubState ? `<strong style="color:var(--text);">Hub Control:</strong> ${hubState.controller}<br>` : ''}
            ${current.analysisDetail ? `<strong style="color:var(--text);">Further Analysis:</strong> ${current.analysisDetail}` : ''}
          </div>
          ${actionButtons.length ? `<div style="display:flex;gap:.25rem;flex-wrap:wrap;">${actionButtons.join('')}</div>` : ''}
        </div>`;
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
  runGalaxyEncounterRoll();
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
    hex.scanned = true;
    hex.explored = true;
    if (hex.type === 'planet') {
      const profile = ensurePlanetProfile(hex);
      hex.detail = `Planet ${profile.planetName} catalogued. ${profile.planetType} world with ${profile.biome} biome signatures.`;
    } else if (hex.hiddenOutcome) {
      hex.type = convertOutcomeToHexType(hex.hiddenOutcome);
      hex.detail = `${hex.hiddenOutcome} detected ahead.`;
    } else if (!hex.detail) {
      hex.detail = 'System Analysis confirms stable telemetry in this hex.';
    }
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
  ensureStarsState();
  const base = pick(STAR_WEATHER_FRONTS);
  const weather = {
    name: base.name,
    desc: base.desc,
    check: base.check,
    checkLabel: base.check.charAt(0).toUpperCase() + base.check.slice(1),
    dd: base.dd,
    failure: base.failure,
    rough: base.dd >= 8,
  };
  S.starSystem.currentWeather = weather;

  const el = document.getElementById('starWeatherResult');
  if (el) {
    el.innerHTML = `<div class="weather-block ${weather.rough ? 'rough' : 'clear'}" style="padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);">
      <div style="font-size:.78rem;color:${weather.rough ? 'var(--red2)' : 'var(--teal)'};">${weather.name}</div>
      <div style="font-size:.74rem;color:var(--muted2);line-height:1.45;">${weather.desc}</div>
      <div style="font-size:.72rem;color:var(--muted2);margin-top:.2rem;">${weather.dd > 0 ? `⚠ ${weather.checkLabel} vs DD${weather.dd} required. Failure: ${weather.failure}` : 'Clear travel lane. No traversal check required.'}</div>
    </div>`;
  }
  updateStarSystemReadouts();
}

function resolveGalaxyWeatherCheck() {
  ensureStarsState();
  const weather = S.starSystem.currentWeather || pick(STAR_WEATHER_FRONTS);
  if (!weather.dd) {
    const el = document.getElementById('starWeatherResult');
    if (el) el.innerHTML = `<span style="color:var(--green2);">${weather.name}. No traversal hazard in this hex.</span>`;
    return;
  }
  const check = resolveGalaxySkillCheck(weather.check, null, weather.dd, weather.name + ' Traversal');
  const el = document.getElementById('starWeatherResult');
  if (check.success) {
    S.starSystem.currentWeather = null;
    if (el) el.innerHTML = `<span style="color:var(--green2);">${check.text}. Success: weather lane cleared.</span>`;
    showNotif('Weather traversal succeeded.', 'good');
  } else {
    applyGalaxyFailureText(weather.failure);
    if (el) el.innerHTML = `<span style="color:var(--red2);">${check.text}. Failure: ${weather.failure}</span>`;
    showNotif(`Weather traversal failed: ${weather.failure}`, 'warn');
  }
  updateStarSystemReadouts();
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
    const candidates = (S.starSystem.hexes || []).filter(h => h.ring !== 'core' && h.type !== 'star');
    if (candidates.length) {
      const markerHex = pick(candidates);
      markerHex.type = 'radio_task';
      markerHex.scanned = true;
      markerHex.explored = true;
      markerHex.detail = `Radio Task ${d20}: ${STAR_RADIO_EVENTS[d20 - 1]}`;
      markerHex.radioTaskId = d20;
      markerHex.radioTaskResolved = false;
      if (!Array.isArray(S.starSystem.radioTaskMarkers)) S.starSystem.radioTaskMarkers = [];
      S.starSystem.radioTaskMarkers.push({ eventId: d20, hexId: markerHex.id, text: STAR_RADIO_EVENTS[d20 - 1], resolved: false });
      S.starSystem.lastRadioEvent = `Radio Event ${d20}: ${STAR_RADIO_EVENTS[d20 - 1]} (Marker at Hex ${markerHex.id}, Deadline: 10 Days)`;
      renderStarSystemMap();
    } else {
      S.starSystem.lastRadioEvent = `Radio Event ${d20}: ${STAR_RADIO_EVENTS[d20 - 1]} (No viable marker hex.)`;
    }
  }
  updateStarSystemReadouts();
}

function promptRadioTaskRoll() {
  ensureStarsState();
  const current = getCurrentStarHex();
  if (!current || current.type !== 'radio_task') {
    showNotif('No radio task marker in this hex.', 'warn');
    return;
  }
  
  const adventureDie = (S.stats && S.stats.adventure) ? S.stats.adventure : 4;
  let html = `<div style="font-size:.84rem;color:var(--text2);line-height:1.6;margin-bottom:.5rem;">
    <strong>Radio Task Challenge</strong><br>
    Roll your Adventure Die (${adventureDie}) vs Dread Die (d8)<br>
    Success = Complete the contract and gain rewards
  </div>`;
  html += `<div style="margin-top:.5rem;"><button class="btn btn-primary" onclick="resolveGalaxyRadioTaskWithRoll()">Roll for Success</button></div>`;
  
  openModal('Radio Task Resolution', html);
}

function resolveGalaxyRadioTaskWithRoll() {
  ensureStarsState();
  const current = getCurrentStarHex();
  if (!current || current.type !== 'radio_task') {
    showNotif('No radio task marker in this hex.', 'warn');
    return;
  }
  
  const adventureDie = (S.stats && S.stats.adventure) ? S.stats.adventure : 4;
  const adRoll = explodingRoll(adventureDie);
  const ddRoll = explodingRoll(8);
  const success = adRoll.total >= ddRoll.total;
  
  let resultHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.4rem;">
    <div style="text-align:center;">
      <div style="font-family:'Cinzel',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Ad${adventureDie}</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:2rem;font-weight:700;color:var(--gold);">${adRoll.total}</div>
    </div>
    <div style="text-align:center;">
      <div style="font-family:'Cinzel',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">DD8</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">${ddRoll.total}</div>
    </div>
  </div>`;
  
  if (success) {
    const rewardText = applyGalaxyRewardPackage({ globalRenown: 1, lootFromMerchant: true });
    current.radioTaskResolved = true;
    current.type = 'location';
    current.detail = 'Resolved radio contract. Local contacts leave a stable route and future work.';
    (S.starSystem.radioTaskMarkers || []).forEach((m) => {
      if (m.hexId === current.id) m.resolved = true;
    });
    showNotif('Radio task completed successfully!', 'good');
    resultHtml += `<div style="background:rgba(76,175,116,.08);border:1px solid rgba(76,175,116,.4);padding:.4rem;color:var(--green2);"><strong>✓ Success!</strong> ${rewardText || 'The crew finishes the assignment and secures local trust.'}</div>`;
  } else {
    current.radioTaskResolved = false;
    current.detail = 'Radio task failed - contract cancelled.';
    (S.starSystem.radioTaskMarkers || []).forEach((m) => {
      if (m.hexId === current.id) m.resolved = true;
    });
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
    showNotif('Radio task failed. Contacts disappointed.', 'warn');
    resultHtml += `<div style="background:rgba(201,64,64,.08);border:1px solid rgba(201,64,64,.4);padding:.4rem;color:var(--red2);"><strong>✗ Failed</strong> — Contract cancelled. Local reputation suffers.</div>`;
  }
  
  const out = document.getElementById('starExplorationDetail');
  if (out) out.innerHTML = resultHtml;
  renderStarSystemMap();
  updateStarSystemReadouts();
  closeModal();
}

function resolveGalaxyRadioTask() {
  ensureStarsState();
  const current = getCurrentStarHex();
  if (!current || current.type !== 'radio_task') {
    showNotif('No radio task marker in this hex.', 'warn');
    return;
  }
  promptRadioTaskRoll();
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
  const suit = (S.equipmentLayers && S.equipmentLayers.suit)
    ? String(S.equipmentLayers.suit)
    : ((S.equipment && S.equipment.armor) ? String(S.equipment.armor) : '');
  const suitLc = suit.toLowerCase();
  const hasHeavy = suitLc.indexOf('radsuit (heavy)') >= 0;
  const hasLight = suitLc.indexOf('radsuit (light)') >= 0;
  const hasVacc = suitLc.indexOf('vaccsuit') >= 0;
  const wearing = hasHeavy || hasLight || hasVacc || suitLc.indexOf('radsuit') >= 0;
  const airFilter = S.backpack && S.backpack.some && S.backpack.some(b => b && b.toLowerCase().includes('air filtration'));
  let gain = roll(100);
  if (airFilter) {
    gain = Math.floor(gain / 2);
  }
  if (hasHeavy) {
    gain = Math.max(0, gain - 100);
  } else if (hasLight) {
    gain = Math.max(0, gain - 50);
  } else if (hasVacc) {
    gain = Math.max(0, gain - 25);
  }
  if (wearing) {
    showNotif(`Suit mitigation applied: +${gain} Rads.`, gain > 0 ? 'warn' : 'good');
  } else if (airFilter) {
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
  let detail = entry.detail;
  
  if (r === 1) {
    detail = entry.detail + ' ' + pick(ORACLE_NEGATIVE_TURNS);
  } else if (r === 3) {
    detail = entry.detail + ' ' + pick(ORACLE_SILVER_LININGS);
  } else if (r === 4) {
    detail = entry.detail + ' ' + pick(ORACLE_COMPLICATIONS);
  } else if (r === 5 || r === 6) {
    detail = entry.detail + ' ' + pick(ORACLE_POSITIVE_TURNS);
  }
  
  const el  = document.getElementById('oracleYesNoResult');
  if (el) {
    el.innerHTML = `
      <div class="oracle-result">
        <div class="oracle-roll">d6 = ${r}</div>
        <div class="oracle-outcome" style="color:${r >= 4 ? 'var(--green2)' : r === 3 ? 'var(--gold)' : 'var(--red2)'};">${entry.result}</div>
        <div class="oracle-detail">${detail}</div>
      </div>`;
  }
}

function rollOracleOpenEnded() {
  try {
    const d1 = roll(6);
    const d2 = roll(6);
    const words = (typeof ORACLE_OPEN_WORDS !== 'undefined' && Array.isArray(ORACLE_OPEN_WORDS))
      ? ORACLE_OPEN_WORDS
      : [
        ['Abandon', 'Awaken', 'Alter', 'Assemble', 'Advance'],
        ['Battle', 'Bargain', 'Build', 'Break', 'Bind'],
        ['Chase', 'Chart', 'Cleanse', 'Conceal', 'Create'],
        ['Damage', 'Decode', 'Defend', 'Deliver', 'Discover'],
        ['Escape', 'Endure', 'Expose', 'Extract', 'Empower'],
        ['Force', 'Forge', 'Follow', 'Free', 'Fortify'],
      ];
    const subjects = (typeof ORACLE_OPEN_SUBJECTS !== 'undefined' && Array.isArray(ORACLE_OPEN_SUBJECTS))
      ? ORACLE_OPEN_SUBJECTS
      : [
        ['Agency', 'Ally', 'Artifact', 'Archive', 'Anomaly'],
        ['Bond', 'Beacon', 'Barrier', 'Broker', 'Blueprint'],
        ['Cipher', 'Caravan', 'Council', 'Core', 'Crew'],
        ['Domain', 'Derelict', 'Dock', 'Data', 'Debtor'],
        ['Entry', 'Engine', 'Envoy', 'Evidence', 'Expedition'],
        ['Faction', 'Fleet', 'Frontier', 'Fuel', 'Future'],
      ];
    const verb    = words[d1 - 1][Math.floor(Math.random() * words[d1 - 1].length)];
    const subject = subjects[d2 - 1][Math.floor(Math.random() * subjects[d2 - 1].length)];
    const el = document.getElementById('oracleOpenResult');
    if (el) {
      el.innerHTML = `
        <div class="oracle-result">
          <div class="oracle-roll">d6 = ${d1} &amp; ${d2}</div>
          <div class="oracle-outcome" style="color:var(--gold);">${verb} the ${subject}</div>
          <div class="oracle-detail">Interpret freely — what does this mean for your current scene?</div>
        </div>`;
    } else {
      showNotif('Oracle panel is not mounted yet. Open the Oracle tab first.', 'warn');
    }
  } catch (err) {
    showNotif('Oracle open-ended roll failed. Retry after reopening Oracle tab.', 'warn');
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
  const d = S.gameDate;
  ['gameDateDisplay', 'gameDateDisplayGalaxy'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `Month ${d.month}, Day ${d.day}, Year ${d.year} — ${getCurrentPhaseLabel()}`;
  });
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

function purchaseSpaceHubFuel(type) {
  ensureStarsState();
  const costs = { standard: 200, hubJump: 500, hyperdrive: 1000 };
  const cost = costs[type] || 200;
  
  if (S.credits < cost) {
    showNotif(`Not enough credits. Need ${cost}₵, have ${S.credits}₵.`, 'warn');
    return;
  }
  
  S.credits -= cost;
  S.starship.fuel[type] = (S.starship.fuel[type] || 0) + 1;
  updateCreditsUI();
  updateStarshipUI();
  
  const typeLabel = type === 'standard' ? 'Standard Fuel' : type === 'hubJump' ? 'Hub Jump Fuel' : 'Hyperdrive Core';
  showNotif(`${typeLabel} purchased: −${cost}₵`, 'good');
  if (typeof renderSpaceHubPanel === 'function') renderSpaceHubPanel();
}

function changeShields(delta) {
  ensureStarsState();
  const def = S.starship.defendDie || 6;
  const maxShields = def * 2;
  S.starship.shields = Math.max(0, Math.min(maxShields, (S.starship.shields || 0) + delta));
  syncNavalCombatStateFromStarship();
  updateStarshipUI();
}

function restoreShields() {
  ensureStarsState();
  const def = S.starship.defendDie || 6;
  S.starship.shields = 0;
  syncNavalCombatStateFromStarship();
  updateStarshipUI();
  showNotif('Shields restored at Landing Dock (−100₵).', 'good');
  changeCredits(-100);
}

function updateStarshipUI() {
  ensureStarsState();
  syncSpaceCombatStateFromNaval();
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
  applySpaceNavalPresentation();
}

function stepShipDefend(dir) {
  ensureStarsState();
  const cur = S.starship.defendDie || 6;
  S.starship.defendDie = dir > 0 ? stepUp(cur) : stepDown(cur);
  syncNavalCombatStateFromStarship();
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

  const baseSetContext = typeof setContext === 'function' ? setContext : null;
  if (baseSetContext && !window._starsSetContextPatched) {
    window._starsSetContextPatched = true;
    setContext = function(ctx, btn) {
      const out = baseSetContext.apply(this, arguments);
      syncNavalStateForContext(ctx);
      return out;
    };
  }

  const baseRenderNaval = typeof renderNaval === 'function' ? renderNaval : null;
  if (baseRenderNaval && !window._starsRenderNavalPatched) {
    window._starsRenderNavalPatched = true;
    renderNaval = function() {
      const out = baseRenderNaval.apply(this, arguments);
      syncSpaceCombatStateFromNaval();
      applySpaceNavalPresentation();
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

function getGalaxySystemPanelMarkup() {
  return `
<div class="map-controls">
  <select id="starGalaxyType" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.2rem .35rem;font-size:.75rem;">
    <option value="cluster">Cluster</option>
    <option value="spiral">Spiral</option>
    <option value="elliptical">Elliptical</option>
  </select>
  <button class="btn btn-primary" onclick="generateStarSystemMap((document.getElementById('starGalaxyType')||{}).value)">⚄ Generate Galaxy</button>
  <span style="color:var(--muted);font-size:.6rem;margin:0 .3rem;">|</span>
  <select id="starTravelMode" style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);padding:.2rem .35rem;font-size:.75rem;">
    <option value="standard">Standard</option>
    <option value="hub">Hub Jump</option>
    <option value="hyper">Hyperdrive</option>
  </select>
  <button class="btn btn-sm btn-teal" onclick="travelToSelectedGalaxyHex()">Travel To Selected</button>
  <span id="starFuelReadout" style="font-family:'Rajdhani',sans-serif;font-size:.78rem;color:var(--gold2);margin-left:.4rem;">Fuel S/H/H: 0/0/0</span>
  <span id="starCoords" style="font-family:'Rajdhani',sans-serif;font-size:.78rem;color:var(--muted2);margin-left:.4rem;"></span>
</div>

<div class="map-legend">
  ${Object.entries(STAR_SIGHTING_COLORS).filter(([k]) => k !== 'star').map(([k, v]) => `<div class="leg-item"><div class="leg-dot" style="background:${v.color};"></div>${v.label}</div>`).join('')}
  <div class="leg-item"><div class="leg-dot" style="background:var(--gold2);"></div>Galaxy Task</div>
</div>

<div class="map-layout">
  <div class="map-scroll" id="starMapScroll">
    <div id="starSystemMap"></div>
  </div>
  <div class="hex-info" id="starHexInfo">
    <div class="hex-info-inner">
      <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;">Galaxy Sector</div>
      <div id="starHexInfoBody" style="font-size:.83rem;color:var(--muted2);line-height:1.65;margin-top:.4rem;">Generate a galaxy, then click a hex to inspect.</div>

      <div style="padding-top:.45rem;border-top:1px solid var(--border);margin-top:.45rem;">
        <div class="sub-label">Observe Adjacent (System Analysis)</div>
        <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.25rem;">
          <button class="btn btn-xs btn-teal" onclick="runSystemAnalysisCheck()">Analyze Hex (DD8)</button>
          <button class="btn btn-xs" onclick="runFurtherSystemAnalysis()">Further Analysis (+1 Day)</button>
          <button class="btn btn-xs" onclick="renderRoyalShipLog()" title="View Royal Ship contact history">⚓ Royal Log</button>
        </div>
        <div id="starAnalysisResult" style="font-size:.74rem;color:var(--muted2);min-height:1rem;margin-top:.2rem;"></div>
      </div>

      <div style="padding-top:.45rem;border-top:1px solid var(--border);margin-top:.45rem;">
        <div class="sub-label">Explore</div>
        <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.25rem;">
          <button class="btn btn-xs btn-teal" onclick="runGalaxyEncounterRoll()">⚄ Roll Encounter</button>
          <button class="btn btn-xs" onclick="rollMonthlyStarRadioEvent()">Monthly Radio</button>
        </div>
        <div id="starExplorationResult" style="font-size:.75rem;color:var(--muted2);min-height:1rem;margin-top:.25rem;"></div>
        <div id="starExplorationDetail" style="font-size:.86rem;color:var(--muted2);line-height:1.55;min-height:4rem;padding:.5rem;border:1px solid var(--border);background:rgba(255,255,255,.01);margin-top:.25rem;"></div>
      </div>

      <div style="padding-top:.45rem;border-top:1px solid var(--border);margin-top:.45rem;">
        <div id="starSystemHexDetail" style="font-size:.74rem;color:var(--muted2);line-height:1.45;min-height:1.3rem;"></div>
        <div id="starSystemPowers" style="font-size:.74rem;color:var(--muted2);line-height:1.45;margin-top:.2rem;"></div>
        <div id="starSystemRadioLog" style="font-size:.74rem;color:var(--muted2);line-height:1.45;min-height:1rem;margin-top:.2rem;"></div>
      </div>
    </div>
  </div>
</div>`;
}

function normalizeExocraftName(nameText) {
  const raw = String(nameText || '').trim();
  if (!raw) return '';
  const noStack = raw.replace(/\s*x\d+$/i, '').trim();
  return noStack.replace(/^[^A-Za-z0-9]+\s*/, '').trim();
}

function addOwnedExocraftByName(nameText) {
  ensureStarsState();
  const normalized = normalizeExocraftName(nameText);
  if (!normalized) return false;
  const exo = EXOCRAFTS.find((entry) => normalized.toLowerCase().indexOf(entry.name.toLowerCase()) >= 0);
  if (!exo) return false;
  if (S.exocraftBay.owned.indexOf(exo.name) < 0) {
    S.exocraftBay.owned.push(exo.name);
  }
  if (!S.exocraftBay.active) S.exocraftBay.active = exo.name;
  if (typeof renderExocraftPanel === 'function') renderExocraftPanel();
  showNotif(`${exo.name} added to Exocraft Bay.`, 'good');
  return true;
}

function setActiveExocraft(name) {
  ensureStarsState();
  if (!name || S.exocraftBay.owned.indexOf(name) < 0) return;
  S.exocraftBay.active = name;
  renderExocraftPanel();
  showNotif(`Active Exocraft: ${name}`, 'good');
}

function loadExocraftFromBackpack(index) {
  ensureStarsState();
  if (!Array.isArray(S.backpack)) return;
  const raw = S.backpack[index] || '';
  if (!raw) return;
  const nameText = normalizeExocraftName(raw);
  const beforeOwned = (S.exocraftBay.owned || []).length;
  if (!addOwnedExocraftByName(nameText)) {
    showNotif('That backpack item is not an Exocraft.', 'warn');
    return;
  }
  if ((S.exocraftBay.owned || []).length <= beforeOwned) {
    showNotif('Exocraft already owned.', 'warn');
    return;
  }

  if (typeof parseBackpackStack === 'function' && typeof buildBackpackStack === 'function') {
    const parts = parseBackpackStack(raw);
    if (parts.count > 1) S.backpack[index] = buildBackpackStack(parts.name, parts.count - 1);
    else S.backpack[index] = '';
  } else {
    S.backpack[index] = '';
  }
  const bpEl = document.getElementById('bp' + index);
  if (bpEl) bpEl.value = S.backpack[index] || '';
  renderExocraftPanel();
}

function moveBackpackToExocraftCargo() {
  ensureStarsState();
  if (!Array.isArray(S.backpack)) return;
  if (!Array.isArray(S.exocraftBay.cargo)) S.exocraftBay.cargo = ['', '', '', '', '', ''];
  const lastIdx = (() => {
    for (let i = S.backpack.length - 1; i >= 0; i -= 1) {
      if (S.backpack[i]) return i;
    }
    return -1;
  })();
  if (lastIdx < 0) return showNotif('Backpack is empty!', 'warn');
  const cargoIdx = S.exocraftBay.cargo.indexOf('');
  if (cargoIdx < 0) return showNotif('Exocraft cargo full!', 'warn');
  S.exocraftBay.cargo[cargoIdx] = S.backpack[lastIdx];
  S.backpack[lastIdx] = '';
  const bpEl = document.getElementById('bp' + lastIdx);
  if (bpEl) bpEl.value = '';
  renderExocraftPanel();
  showNotif('Moved to Exocraft cargo.', 'good');
}

function moveExocraftCargoToBackpack(index) {
  ensureStarsState();
  if (!Array.isArray(S.exocraftBay.cargo)) return;
  const item = S.exocraftBay.cargo[index] || '';
  if (!item) return;
  if (typeof addToBackpack === 'function') {
    if (!addToBackpack(item)) return;
  } else {
    if (!Array.isArray(S.backpack)) S.backpack = ['', '', '', '', '', ''];
    const slotIdx = S.backpack.indexOf('');
    if (slotIdx < 0) return showNotif('Backpack full!', 'warn');
    S.backpack[slotIdx] = item;
    const bpEl = document.getElementById('bp' + slotIdx);
    if (bpEl) bpEl.value = item;
  }
  S.exocraftBay.cargo[index] = '';
  renderExocraftPanel();
  showNotif(`Moved to Backpack: ${item}`, 'good');
}

function renderExocraftPanel() {
  ensureStarsState();
  const target = document.getElementById('tab-exocrafts');
  if (!target) return;
  const active = S.exocraftBay.active || '';
  const owned = Array.isArray(S.exocraftBay.owned) ? S.exocraftBay.owned : [];
  const activeData = EXOCRAFTS.find((e) => e.name === active) || null;
  const cargo = Array.isArray(S.exocraftBay.cargo) ? S.exocraftBay.cargo : ['', '', '', '', '', ''];

  target.innerHTML = `<div style="max-width:1000px;padding:.85rem;display:grid;gap:.75rem;">
    <div class="ship-banner">
      <h3>Exocraft Bay</h3>
      <p>Manage owned Exocrafts and move gear between Backpack and Exocraft cargo, similar to Caravan flow.</p>
    </div>
    <div class="card">
      <div class="section-title">Owned Exocrafts</div>
      <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.45rem;">
        <button class="btn btn-xs btn-primary" onclick="moveBackpackToExocraftCargo()">Stow from Backpack</button>
      </div>
      ${owned.length ? owned.map((name) => {
        const info = EXOCRAFTS.find((entry) => entry.name === name);
        const isOn = active === name;
        return `<div style="padding:.35rem;border:1px solid var(--border2);background:rgba(255,255,255,.02);margin-bottom:.25rem;">
          <strong style="color:${isOn ? 'var(--gold2)' : 'var(--text)'};">${info ? info.logo + ' ' : ''}${name}</strong>
          <div style="font-size:.75rem;color:var(--muted2);line-height:1.45;">${info ? `${info.power} · ${info.mounts} mounts.` : 'Exocraft'} ${info ? info.desc : ''}</div>
          <div style="margin-top:.25rem;"><button class="btn btn-xs ${isOn ? '' : 'btn-teal'}" onclick="setActiveExocraft('${name.replace(/'/g, "\\'")}')">${isOn ? 'Active' : 'Set Active'}</button></div>
        </div>`;
      }).join('') : '<div style="font-size:.78rem;color:var(--muted2);">No Exocrafts owned yet. Buy one from Merchants or load one from Backpack.</div>'}
    </div>
    <div class="card">
      <div class="section-title">Active Exocraft Cargo</div>
      <div style="font-size:.78rem;color:var(--muted2);margin-bottom:.35rem;">${activeData ? `${activeData.logo} ${activeData.name} · ${activeData.power}` : 'No active Exocraft selected.'}</div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.25rem;">
        ${cargo.map((item, i) => `<div style="border:1px solid var(--border2);padding:.28rem;min-height:2.3rem;background:rgba(255,255,255,.02);font-size:.76rem;color:${item ? 'var(--text2)' : 'var(--muted)'};cursor:${item ? 'pointer' : 'default'};" ${item ? `onclick=\"moveExocraftCargoToBackpack(${i})\"` : ''}>${item || `Slot ${i + 1}`}</div>`).join('')}
      </div>
      <div style="font-size:.7rem;color:var(--muted2);margin-top:.3rem;">Click a filled slot to move that item to Backpack.</div>
    </div>
    <div class="card">
      <div class="section-title">Load Exocraft From Backpack</div>
      <div style="display:flex;gap:.25rem;flex-wrap:wrap;">
        ${(Array.isArray(S.backpack) ? S.backpack : []).map((item, i) => item ? `<button class="btn btn-xs" onclick="loadExocraftFromBackpack(${i})">BP${i + 1}: ${String(item).replace(/</g,'&lt;')}</button>` : '').join('') || '<span style="font-size:.75rem;color:var(--muted2);">No backpack items available.</span>'}
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

  if (!document.getElementById('starsGalaxyPanel')) {
    target.innerHTML += `<div style="margin-top:.75rem;">${getGalaxySystemPanelMarkup()}</div>`;
  }

  const mainStarEl = document.getElementById('starMainStar');
  if (mainStarEl) mainStarEl.textContent = S.starSystem && S.starSystem.mainStar ? S.starSystem.mainStar : 'Uncharted';
  renderStarSystemMap();
  updateStarSystemReadouts();
}

// ── Galaxy Task Map Click ─────────────────────────────────────────────────────
function openGalaxyTaskFromMap(hexId) {
  ensureStarsState();
  // Navigate to that hex if not already there
  if (S.starSystem.currentHexId !== hexId) {
    S.starSystem.currentHexId = hexId;
    renderStarSystemMap();
    updateStarSystemReadouts();
  }
  const hex = S.starSystem.hexes.find(h => h.id === hexId);
  if (!hex || !hex.taskMarker || hex.taskMarker.resolved) return;
  renderGalaxyTaskPanel(hex.taskMarker.id);
}

// ── Royal Ship Log ─────────────────────────────────────────────────────────────
function pushRoyalShipLogEntry(action, detail) {
  ensureStarsState();
  if (!Array.isArray(S.starSystem.royalShipLog)) S.starSystem.royalShipLog = [];
  const hexId = S.starSystem.currentHexId;
  S.starSystem.royalShipLog.unshift({ action, detail, hexId, date: getShortGameDate() });
  if (S.starSystem.royalShipLog.length > 20) S.starSystem.royalShipLog.length = 20;
}

function getShortGameDate() {
  if (!S.gameDate) return '?';
  return `Y${S.gameDate.year} M${S.gameDate.month} D${S.gameDate.day}`;
}

function renderRoyalShipLog() {
  ensureStarsState();
  const out = document.getElementById('starExplorationDetail');
  if (!out) return;
  const log = S.starSystem.royalShipLog || [];
  if (!log.length) {
    out.innerHTML = '<div style="font-size:.74rem;color:var(--muted2);">No Royal Ship contacts logged yet.</div>';
    return;
  }
  const rows = log.map(e => `<div style="padding:.25rem .3rem;border-bottom:1px solid var(--border);display:grid;grid-template-columns:auto 1fr auto;gap:.35rem;align-items:start;">
    <span style="font-size:.68rem;color:var(--muted);white-space:nowrap;">${e.date}<br>Hex ${e.hexId ?? '?'}</span>
    <span style="font-size:.74rem;color:var(--muted2);">${e.detail}</span>
    <span style="font-size:.74rem;font-weight:bold;color:${e.action === 'charter' ? 'var(--gold2)' : 'var(--red2)'};">${e.action === 'charter' ? 'TASK' : 'TARIFF'}</span>
  </div>`).join('');
  out.innerHTML = `
    <div style="font-size:.75rem;color:var(--gold2);margin-bottom:.3rem;">⚓ Royal Ship Contact Log</div>
    <div style="max-height:12rem;overflow-y:auto;">${rows}</div>`;
}

// ── Trade Route Gameplay Effects ───────────────────────────────────────────────
function isHexOnTradeRoute(hexId) {
  return (S.starSystem.tradeRoutes || []).some(([aId, bId]) => aId === hexId || bId === hexId);
}

function applyTradeRouteTravelBonus(hexId) {
  ensureStarsState();
  // Discount on merchant offers this hex
  S.starSystem.tradeRouteDiscount = true;
  // Small chance of finding a trade route merchant encounter (bonus offer)
  const bonusRoll = roll(6);
  let bonusText = '';
  if (bonusRoll >= 5) {
    // Bonus: free merchant contact spawns as mystery
    const offers = buildGalaxyMerchantOffers('merchant');
    S.starSystem.activeMystery = {
      archetype: 'Trade Route Merchant',
      kind: 'merchant',
      options: [
        { id: 'buy', label: 'Browse Goods', text: 'Trade route merchant offers discounted goods.', trade: true },
        { id: 'haggle', label: 'Negotiate', text: 'Lead vs DD6. Gain additional 20% route discount.', check: 'lead', dd: 6, haggle: true },
      ],
      offers,
      discountRate: 0.15,
    };
    bonusText = ' Trade route contact spawned — 15% route discount active.';
  } else {
    bonusText = ' Route lane passable without fuel cost.';
  }
  showNotif(`Trade Route: ${isHexOnTradeRoute(hexId) ? 'Lane active.' : ''}${bonusText}`, 'good');
}

function getTradeRouteModifiers() {
  // Returns modifier object for current hex's trade route status
  ensureStarsState();
  const onRoute = isHexOnTradeRoute(S.starSystem.currentHexId);
  const discount = (onRoute && S.starSystem.tradeRouteDiscount) ? 0.15 : 0;
  const encounterBonus = onRoute ? 1 : 0; // +1 to merchant encounter roll
  return { onRoute, discount, encounterBonus };
}

function buildGalaxyPanel() {
  ensureStarsState();
  const target = document.getElementById('starsGalaxyPanel');
  if (!target) return;
  target.innerHTML = getGalaxySystemPanelMarkup();

  const mainStarEl = document.getElementById('starMainStar');
  if (mainStarEl) {
    const systemName = (S.starSystem && S.starSystem.generatedName) ? S.starSystem.generatedName : 'Uncharted';
    const starName = S.starSystem && S.starSystem.mainStar ? S.starSystem.mainStar : 'Unknown Star';
    mainStarEl.textContent = `${systemName} · ${starName}`;
  }
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
  const targets = [
    { id: 'starsDatePanel', displayId: 'gameDateDisplay' },
    { id: 'starsDatePanelGalaxy', displayId: 'gameDateDisplayGalaxy' },
  ];

  targets.forEach(({ id, displayId }) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = `
<div class="card">
  <div class="section-title">📅 Date &amp; Time</div>
  <div style="font-size:.82rem;color:var(--muted3);margin-bottom:.5rem;" id="${displayId}">Day 1, Month 1, Year 1</div>
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
  });
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
  syncNavalStateForContext(window._activeContext || 'traveling');

  // Build panels
  buildStarsCharacterPanels();
  buildOraclePanel();
  buildStarshipPanel();
  buildGalaxyPanel();
  buildStarsCombatPanel();
  buildDateTimePanel();
  renderPlanetExplorationPanel();
  renderExocraftPanel();

  // Initial UI sync
  updateHealthUI();
  updateMentalStressUI();
  updateRadsUI();
  updateInjuriesUI();
  updateFactionRenownUI();
  updateStarshipUI();
  updateDateUI();
  removeLegacyHealthLabel();
  ensureStarsState();
  // Only auto-generate galaxy on first visit to Galaxy tab, not on subsequent tab switches
  if (!S.starSystem.galaxyGenerated && (!S.starSystem.hexes || !S.starSystem.hexes.length)) {
    generateStarSystemMap('cluster');
  } else if (S.starSystem.hexes && S.starSystem.hexes.length) {
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

  const tabHost = document.getElementById('tab-naval') ? document.getElementById('tab-naval').parentElement : null;
  if (tabHost && !document.getElementById('tab-planet')) {
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.id = 'tab-planet';
    tabHost.appendChild(panel);
  }
  if (tabHost && !document.getElementById('tab-exocrafts')) {
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.id = 'tab-exocrafts';
    tabHost.appendChild(panel);
  }
  if (nav && !document.querySelector('.tab-btn[onclick*="switchTab(\'planet\'"]')) {
    const planetBtn = document.createElement('button');
    planetBtn.className = 'tab-btn ctx-space';
    planetBtn.style.display = 'none';
    planetBtn.textContent = 'Planet Exploration';
    planetBtn.setAttribute('onclick', "switchTab('planet',this)");
    nav.appendChild(planetBtn);
  }
  if (nav && !document.querySelector('.tab-btn[onclick*="switchTab(\'exocrafts\'"]')) {
    const exoBtn = document.createElement('button');
    exoBtn.className = 'tab-btn ctx-space';
    exoBtn.style.display = 'none';
    exoBtn.textContent = 'Exocrafts';
    exoBtn.setAttribute('onclick', "switchTab('exocrafts',this)");
    nav.appendChild(exoBtn);
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
window.buildGalaxyPanel = buildGalaxyPanel;
window.clearActiveGalaxyPanels = clearActiveGalaxyPanels;
window.rollOracleYesNo = rollOracleYesNo;
window.rollOracleOpenEnded = rollOracleOpenEnded;
window.rollPlanetExploration = rollPlanetExploration;
window.renderPlanetExplorationPanel = renderPlanetExplorationPanel;
window.openActivePlanetMap = openActivePlanetMap;
window.explorePlanetCell = explorePlanetCell;
window.createPlanetTask = createPlanetTask;
window.resolvePlanetTask = resolvePlanetTask;
window.renderExocraftPanel = renderExocraftPanel;
window.addOwnedExocraftByName = addOwnedExocraftByName;
window.moveBackpackToExocraftCargo = moveBackpackToExocraftCargo;
window.moveExocraftCargoToBackpack = moveExocraftCargoToBackpack;
window.loadExocraftFromBackpack = loadExocraftFromBackpack;
window.setActiveExocraft = setActiveExocraft;
window.renderGalaxyTaskPanel = renderGalaxyTaskPanel;
window.resolveGalaxyTaskOutcome = resolveGalaxyTaskOutcome;
window.buyGalaxyMerchantOffer = buyGalaxyMerchantOffer;
window.openPlanetMerchantMarket = openPlanetMerchantMarket;
window.buyPlanetMerchantOffer = buyPlanetMerchantOffer;
window.attemptPlanetHoldingSteal = attemptPlanetHoldingSteal;
window.rollPlanetObstacleTraversal = rollPlanetObstacleTraversal;
window.resolveMysteryContactOption = resolveMysteryContactOption;
window.resolveSpaceEncounterOption = resolveSpaceEncounterOption;
window.resolveGalaxyPerilTraversal = resolveGalaxyPerilTraversal;
window.resolveGalaxyWeatherCheck = resolveGalaxyWeatherCheck;
window.resolveGalaxyRadioTask = resolveGalaxyRadioTask;
window.openGalaxyTaskFromMap = openGalaxyTaskFromMap;
window.mapMysteryMissionHook = mapMysteryMissionHook;
window.renderRoyalShipLog = renderRoyalShipLog;