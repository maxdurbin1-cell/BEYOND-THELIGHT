# Guild System Spec

## 1. Product Intent

This spec replaces the current presentation of Factions with Guilds while preserving the existing save-safe faction IDs, mission engine, renown hooks, merchant hooks, and campaign sync model.

The new Guild system has two loops:

1. Guild Campaigns: authored 7-quest arcs with recurring NPCs, dialogue, map travel, escalation, and a final boss.
2. Guild Contracts: repeatable procedural jobs that behave like the current Missions board, but are flavored per guild and always include preparation hooks.

The design goal is to increase longevity, make each guild feel worth joining, and push a "learn the enemy, gather the right tools, then strike" loop without adding math that breaks the rest of the site.

## 2. Non-Negotiable Design Rules

1. Keep the current internal faction IDs for implementation safety:
   - `corporations`
   - `religious`
   - `military`
   - `underworld`
   - `rebels`
   - `scholars`
2. Re-present them in UI as Guilds, Orders, Companies, or Houses.
3. Do not add new core combat stats.
4. Preparation must only apply through existing math patterns:
   - `+5` to a specific roll or phase
   - one enemy Dread step down
   - gain an existing Condition like `Protected`, `Bolstered`, or `Empowered`
   - suppress one boss signature move once
   - grant one reroll or one auto-success on a narrow prep gate
5. Final bosses are always `Dread d20`, `40 HP`, and have 2 to 3 signature abilities plus explicit counterplay.
6. Every guild campaign must travel across at least four of these surfaces:
   - Province
   - Sea Region
   - World That Was
   - Galaxy
   - Planet

## 3. Core Guild Loop

### 3.1 Join Flow

1. Player visits a guild base.
2. Player signs the charter or oath.
3. Guild board unlocks:
   - one active campaign quest at a time
   - 2 to 4 rotating quick contracts
   - guild shop inventory
   - prep board entries tied to the current campaign target or active contract

### 3.2 Campaign Quest Structure

Each guild arc has seven quests:

1. Oath or Initiation
2. First field assignment
3. Investigation and lead-gathering
4. Cross-region escalation
5. Targeted preparation or weakness hunt
6. Lieutenant fight or crisis breach
7. Final hunt against the guild boss target

### 3.3 Quick Contract Structure

Each contract should expose three phases in the existing mission flow:

1. Gather Information
2. Secure Prep or Access
3. Confrontation

Quick contracts remain procedural, but each guild gets distinct templates.

## 4. Preparation System

### 4.1 Player-Facing Rule

Before a guild contract or campaign confrontation, the player may secure up to 3 Preparation Boons. Each boon must come from one of these sources:

1. Intel: interviews, dossiers, maps, witness leads
2. Materials: flowers, reagents, warding salts, sabotaged munitions, forged papers
3. Location control: sealed exits, collapsed portals, poison vents, ambush routes

### 4.2 Exact Mechanical Outputs

Preparation Boons may only do the following:

| Prep Output | Effect |
| --- | --- |
| Tactical Edge | `+5` on one named roll or one mission step |
| Dread Step Down | Enemy Dread steps down once for one check or one round |
| Signature Lock | Boss cannot use one named ability once |
| Starting Condition | Gain `Protected`, `Bolstered`, or `Empowered` at combat start |
| Weakness Strike | First successful hit deals `+5 damage` |
| Escape Cutoff | Enemy loses one reposition, summon, or retreat behavior |

### 4.3 Prep Limits

1. Maximum 3 active prep boons per mission.
2. No more than 1 Dread Step Down effect can apply to the same boss at a time.
3. Signature Lock never deletes an ability permanently; it disables one use.
4. Weakness Strike applies once per confrontation.

## 5. Recommended State Shape

Add this under `S.factionNarrative.guildCampaigns[factionId]`:

```js
{
  joined: false,
  guildName: '',
  currentArcStage: 0,
  activeCampaignMissionId: null,
  completedQuestIds: [],
  knownWeaknesses: [],
  earnedPrepOptions: [],
  purchasedPrepOptions: [],
  bossUnlocked: false,
  bossDefeated: false,
  contractBoardSeed: '',
  shopTier: 0,
  notableChoices: [],
  relationshipMap: {
    patron: 0,
    rival: 0,
    handler: 0
  }
}
```

Use mission types:

1. `guild_campaign`
2. `guild_contract`
3. `guild_boss_hunt`

## 6. Guild Content Matrix

| Faction ID | Guild Presentation | Contract Flavor | Shop Identity | Boss Theme |
| --- | --- | --- | --- | --- |
| `corporations` | The Gilded Ledger | asset seizures, debt enforcement, recovery warrants | contracts, gadgets, market tools | predatory finance engine |
| `religious` | The Sacred Choir | monster hunts, shrine cleansings, relic recoveries | spell scrolls, wards, sanctified reagents | extradimensional saint-beast |
| `military` | The Iron Cohort | bounty hunts, deserter dragnets, high-risk raids | weapon mods, armor plates, tactical kits | warlord executioner |
| `underworld` | The Underground Crown | smuggling, extraction, blackmail, forgery | toxins, stealth gear, lock tools | whisper-king parasite |
| `rebels` | The Ember Union | sabotage, liberation, convoy hits, jailbreaks | explosives, field aid, insurgent tech | regime breaker mech-tyrant |
| `scholars` | The Archive Keepers | investigations, relic recovery, truth raids | codices, lenses, analyzers, mnemonic tools | knowledge-devouring archive horror |

## 7. Shared Campaign Patterns

Each guild campaign should include:

1. One patron NPC who recruits the player.
2. One field handler who grows to trust or resent the player.
3. One rival or skeptic inside the guild.
4. One recurring civilian or witness whose fate colors the finale.
5. One lieutenant before the boss.

Each quest must define:

1. Region and map surface.
2. What information can be learned.
3. What prep reward can be earned.
4. What failure costs without hard-locking the campaign.

## 8. Guild 1: The Gilded Ledger

### 8.1 Identity

The Gilded Ledger is the corporate guild face of finance, logistics, bonded recovery, and controlled civilization. Joining them means becoming a licensed problem-solver with access to contracts, debt archives, and private transit lanes.

### 8.2 Core NPCs

1. Patron: Auditor Prime Seline Voss
2. Handler: Broker-Captain Jun Mercer
3. Internal Rival: Dividend Clerk Oren Vale
4. Civilian Thread: Tamsin Reed, a debtor-harbormaster protecting her district
5. Lieutenant: The Reclamation Hound

### 8.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | Sign the Golden Writ | Province | Seline Voss recruits the player into a charter dispute over seized farmland and teaches the guild's logic of value above sentiment. | Ledger access: reveal one extra clue during intel steps |
| 2 | The Harbor of Red Ink | Sea Region | Track a smuggled debt-ledger vessel and decide whether to secure the books, the captain, or the families tied to the cargo. | Bribed Dockhands: `+5` on one social or infiltration check |
| 3 | Witness Against the Balance | Province | Protect or pressure Tamsin Reed, who knows which guild director is fabricating shortages. | False Shipping Route: one encounter can be bypassed |
| 4 | Dead Planet, Live Assets | Planet | Recover a vault core from a ruined trade moon where mercenary salvagers are selling guild property. | Salvage Override Key: first vault or security obstacle auto-opens |
| 5 | The Quiet Auction | Galaxy | Attend a covert auction aboard an orbital exchange where a fugitive broker sells access to famine markets. | Market Sabotage: boss loses one defensive reaction once |
| 6 | Bite of the Reclamation Hound | World That Was | Hunt the Reclamation Hound through a dead financial district where it executes debtors turned insurgents. | Bondbreaker Charge: first hit vs lieutenant or boss deals `+5 damage` |
| 7 | The Counting House Below | World That Was | Descend into the subterranean counting engine where an ancient profit AI has merged with enforcers and turned debt into biological predation. | Final prep comes from prior choices only |

### 8.4 Quick Contract Types

1. Asset Recovery
2. Bounty Foreclosure
3. Anti-smuggling Inspection
4. Executive Escort
5. Debt Archive Retrieval

### 8.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Contract Tools | Seal-breaker, charter stamp, audit lens | intel and bypass tools |
| Market Tech | credit siphon, vault spike, route beacon | control, stealth, access |
| Executive Defenses | shock cuff, panic veil, plated vest | defensive utility |
| Rare Stock | sovereign key, bonded servo, legal immunity writ | high-tier prep unlocks |

### 8.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Debt Dossier | Pay credits or win an intel scene | Reveal target trait and gain `+5` on first social check |
| Dock Bribe Network | Complete a harbor lead | Skip one checkpoint step |
| Counterfeit Warrant | Crafted from stolen forms | Lock one enemy support ability once |
| Asset Tracker Pin | Bought in guild shop | Reroll one pursuit or locate roll |
| Bondbreaker Charge | Quest reward | First successful hit deals `+5 damage` |
| Liquidation Field Note | Investigate archives | Step down one enemy Dread roll once |

### 8.7 Final Boss

**The Golden Comptroller**

- Dread: `d20`
- HP: `40`
- Theme: a subterranean finance-engine covered in gold filaments and human debt-tags

**Abilities**

1. Margin Call: forces a high-DD control check or the player loses their next item use.
2. Asset Seizure: on hit, steals one active positive condition.
3. Liquidation Swarm: summons debt-drones unless the player sealed the feeder vents.

**Weaknesses**

1. Counterfeit Warrant locks `Asset Seizure` once.
2. Liquidation Field Note steps down `Margin Call` once.
3. Bondbreaker Charge shatters its first armor threshold for `+5 damage`.

**Boss Reward Themes**

1. Ledger-brand weapon mod
2. Elite market pass
3. Permanent guild discount tier

## 9. Guild 2: The Sacred Choir

### 9.1 Identity

The Sacred Choir is a hunt-order, miracle court, and ritual logistics body. Its guild play focuses on monsters, curses, shrines, portal breaches, and ritual preparation.

### 9.2 Core NPCs

1. Patron: Canon-Militant Seraphine Vale
2. Handler: Cantor Yselle Marr
3. Internal Rival: Deacon-Examiner Pell
4. Civilian Thread: Ivo, a child marked by a portal bloom
5. Lieutenant: The Reliquary Beast

### 9.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | Oath at the Ashen Nave | Province | Join the Choir by surviving a controlled haunting and deciding whether doctrine or compassion matters more in your first cleansing. | Blessed Ash: start one combat `Protected` |
| 2 | Flowers for the Hollowing | Province | Gather moon-bloom flowers in plague marsh ruins while learning they can neutralize a monster's breath. | Moon-Bloom Poultice: lock one poison or curse effect once |
| 3 | Bells Beneath the Tides | Sea Region | Investigate drowned bells calling monsters ashore and decide whether to save pilgrims or preserve relics. | Tide Bell Chart: `+5` on tracking or notice checks against rift creatures |
| 4 | Choir of Red Stars | Galaxy | Pursue a false miracle broadcast through an orbital shrine station infested with echo-entities. | Null Hymnal: step down one extradimensional Dread roll once |
| 5 | The Child and the Gate | Planet | Escort Ivo to a planetary scar where his mark can close a portal, if the player trusts him enough to bring him near it. | Gate Salt: prevents one summon or reinforcement event |
| 6 | Hunt of the Reliquary Beast | World That Was | Face the Reliquary Beast in a chapel-city fused to bone glass and learn the final saint-beast's feeding ritual. | Saintsbane Oil: first hit vs sanctified monsters deals `+5 damage` |
| 7 | The Choir Below Flesh | World That Was | Enter the skin-wrapped reliquary under the old basilica and stop a saint-beast trying to incarnate through choir bodies and portal light. | Final prep comes from prior choices only |

### 9.4 Quick Contract Types

1. Monster Extermination
2. Relic Recovery
3. Shrine Cleansing
4. Possession Investigation
5. Portal Seal Duty

### 9.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Spell Scrolls | severance scroll, warding hymn, hush litany | direct anti-monster tech |
| Sanctified Reagents | moon-bloom, grave salt, chrism oil | weakness exploitation |
| Ritual Tools | censor chain, silver bells, prayer nails | prep and seal effects |
| Rare Stock | portal key, saintsbane manuscript, absolution brand | boss-tier counters |

### 9.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Moon-Bloom Poultice | Harvest contract or buy from Choir shop | Cancel one poison, rot, or curse move once |
| Grave Salt Circle | Complete shrine contract | Stop one summon or gate-birth event |
| Null Hymnal | Decode false miracle broadcast | Step down one portal-linked Dread check |
| Saintsbane Oil | Crafted from lieutenant trophy | First hit vs sanctified horror deals `+5 damage` |
| Pilgrim Testimony | Talk to survivors | `+5` on first hunt or tracking step |
| Bell-Silence Nails | Recover drowned bell fragments | Lock one scream, shriek, or song-based ability once |

### 9.7 Final Boss

**The Halo Devourer**

- Dread: `d20`
- HP: `40`
- Theme: a many-limbed saint-beast with a halo of active portal teeth

**Abilities**

1. Choir of Teeth: summons rift-mouths around the arena.
2. Radiant Molting: sheds status effects and gains a defensive pulse.
3. Beatific Rupture: area attack that inflicts curse pressure.

**Weaknesses**

1. Grave Salt Circle stops `Choir of Teeth` once.
2. Bell-Silence Nails lock `Beatific Rupture` once.
3. Saintsbane Oil turns the first successful strike into `+5 damage`.

**Boss Reward Themes**

1. Legendary spell scroll
2. Choir relic charm
3. Shrine access discounts

## 10. Guild 3: The Iron Cohort

### 10.1 Identity

The Iron Cohort is a martial guild-state, bounty office, and campaign machine. Its guild play is centered on warrants, tactical preparation, live capture versus kill, and disciplined assault.

### 10.2 Core NPCs

1. Patron: Marshal Adrienne Korr
2. Handler: Sergeant-Tracker Bel Thorne
3. Internal Rival: Quartermaster Hask Rul
4. Civilian Thread: Kezz, a deserter's sister running a safehouse
5. Lieutenant: Captain Veyr, the Iron Hound

### 10.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | Take the Cohort Oath | Province | Join the Cohort through a bounty hearing where the player chooses how much mercy still fits inside military law. | Warrant Seal: `+5` on one arrest, intimidate, or command roll |
| 2 | Board of the Wanted | Province | Hunt a gang captain through three provincial leads while deciding whether the bounty board tells the whole truth. | Suspect Dossier: reveal target location or combat trait |
| 3 | Dead or Breathing | Sea Region | Pursue a pirate deserter across storm piers where the alive-versus-dead reward changes the tactical objective. | Shock Manacles: lock one escape or dash move once |
| 4 | The Planetary Redlist | Planet | Track a war criminal on a frontier colony and prepare anti-armor munitions from old battleground wreckage. | Breach Load: first hit vs armored targets deals `+5 damage` |
| 5 | Orbit of the Hunted | Galaxy | Infiltrate a military relay where bounty data is being sold to mercenaries and discover a Cohort officer is feeding targets into a private war. | Signal Jammer: step down one ranged or command-based Dread roll |
| 6 | Bring Down the Iron Hound | World That Was | Face Captain Veyr in a siege-zone full of kill corridors, mine maps, and false surrender traps. | Minefield Schematic: bypass one hazard room or checkpoint |
| 7 | The Gallows Engine | World That Was | Storm the blacksite execution engine where a rogue warlord has turned the bounty office into a mechanized slaughter doctrine. | Final prep comes from prior choices only |

### 10.4 Quick Contract Types

1. Bounty Hunt
2. Deserter Recovery
3. Supply Route Security
4. Raid and Seizure
5. High-Value Prisoner Transfer

### 10.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Weapon Mods | recoil brace, breach muzzle, shock mag | direct offensive upgrades |
| Armor Kits | plated inserts, trauma weave, command visor | defense and action economy |
| Tactical Tools | signal jammer, field beacon, mine probe | prep and encounter control |
| Rare Stock | execution warrant, siege charge, veteran servo harness | boss-tier counters |

### 10.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Suspect Dossier | Gather leads before the strike | Reveal target weakness and gain `+5` on first locate roll |
| Shock Manacles | Buy from Cohort quartermaster | Lock one escape move once |
| Breach Load | Recover munitions cache | First hit vs armored or plated target deals `+5 damage` |
| Signal Jammer | Side objective in relay mission | Step down one command or ranged Dread check |
| Killbox Blueprint | Talk to veteran witness | Bypass one ambush or hazard checkpoint |
| Powdered Wakeleaf | Gather field stimulant herbs | Gain `Empowered` at combat start |

### 10.7 Final Boss

**The Warrant Tyrant**

- Dread: `d20`
- HP: `40`
- Theme: an executioner-warlord in black iron rigging supported by automated gallows arms

**Abilities**

1. Sentence of Iron: command burst that raises pressure on all direct approaches.
2. Hook and Drag: pulls the player into a lethal close-range zone.
3. Exemplary Violence: once bloodied, gains bonus damage unless its command relay is jammed.

**Weaknesses**

1. Signal Jammer locks `Sentence of Iron` once.
2. Shock Manacles interrupt `Hook and Drag` once.
3. Breach Load strips armor for `+5 damage` on the first solid hit.

**Boss Reward Themes**

1. Legendary weapon mod
2. Cohort rank privilege
3. elite bounty board tier

## 11. Guild 4: The Underground Crown

### 11.1 Identity

The Underground Crown is a guild of smugglers, fixers, fences, whisper-brokers, and quiet loyalists. Its play loop is all about access, leverage, silence, and extracting people or goods through impossible spaces.

### 11.2 Core NPCs

1. Patron: Velvet-Mask Rhea Thorn
2. Handler: Cutter Jori Fen
3. Internal Rival: Whisper Scribe Malrec
4. Civilian Thread: Anja Pike, a refugee courier with half a route map
5. Lieutenant: The Velvet Knife

### 11.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | The Oath in the Cellar Court | Province | Join the Crown by proving you can keep a secret while choosing whether to protect a witness or profit from them. | Forged Seal: bypass one access gate |
| 2 | Smoke Over the Docks | Sea Region | Smuggle medicine through a cordon and learn a rival broker is selling refugee names to bounty hunters. | Harbor Veil: lock one search or scan effect once |
| 3 | A Name Written Backwards | Province | Decode a dead drop chain to identify which guild cell is compromised from inside. | Cipher Slips: `+5` on one stealth or decode check |
| 4 | Quiet Planet, Loud Grave | Planet | Extract a trapped fence from a colony mine while deciding whether to save the cargo, the contact, or the incriminating books. | Tunnel Resin: bypass one trap or collapse event |
| 5 | The Empty Chair Market | Galaxy | Attend a floating black market with no fixed coordinates and steal an audience list before the Crown is auctioned out. | Ghost Ledger: step down one detection or pursuit Dread roll |
| 6 | Cut Down the Velvet Knife | World That Was | Track the lieutenant through a ruin-city of mirrored alleys where every ally may be bait. | Widow Toxin: first successful hit deals `+5 damage` to living targets |
| 7 | Throne Under the Transit Line | World That Was | Descend into the parasite court beneath abandoned transit rails where a whisper-king entity is feeding on memory, names, and loyalty. | Final prep comes from prior choices only |

### 11.4 Quick Contract Types

1. Smuggling Run
2. Witness Extraction
3. Forgery Delivery
4. Blackmail Recovery
5. Quiet Elimination

### 11.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Stealth Gear | soot cloak, mute soles, mirror veil | approach and bypass |
| Toxins | widow toxin, dream rot, hush dart | narrow offensive edges |
| Lock Tools | marrow pick, wire bloom, ghost seal | doors, traps, entry |
| Rare Stock | nameless pass, dead-route key, royal counterfeit set | major prep unlocks |

### 11.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Forged Seal | Joining reward or shop buy | Skip one access or checkpoint gate |
| Harbor Veil | Complete dock-side side lead | Lock one scan or pursuit effect once |
| Ghost Ledger | Steal market documents | Step down one detection Dread roll |
| Widow Toxin | Distill from lieutenant remains | First hit vs living boss deals `+5 damage` |
| Refugee Testimony | Protect Anja Pike | `+5` on first social or witness scene |
| Mute Wire | Salvage transit snare | Lock one scream, alarm, or summons trigger once |

### 11.7 Final Boss

**The Nameless Regent**

- Dread: `d20`
- HP: `40`
- Theme: a whisper-parasite wearing the identities of dead brokers

**Abilities**

1. Borrowed Face: copies a helpful effect or strips trust from one ally scene.
2. Name-Snare: locks movement and pressures the next action.
3. Court of Echoes: creates false doubles unless the arena routes are sealed.

**Weaknesses**

1. Mute Wire locks `Court of Echoes` once.
2. Ghost Ledger steps down `Borrowed Face` once.
3. Widow Toxin makes the first clean strike deal `+5 damage`.

**Boss Reward Themes**

1. Legendary stealth tool
2. underworld route privileges
3. black market shop expansion

## 12. Guild 5: The Ember Union

### 12.1 Identity

The Ember Union is the rebel guild face of sabotage, liberation, worker uprisings, convoy hits, and tactical hope under pressure. It should feel scrappier than the Cohort and more openly political than the Crown.

### 12.2 Core NPCs

1. Patron: Firebrand Nyra Quell
2. Handler: Scout-Medic Tom Arlen
3. Internal Rival: Cell Leader Vexa Dane
4. Civilian Thread: Mara Pell, a strike organizer with a family in custody
5. Lieutenant: The Black Relay Keeper

### 12.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | Swear to the Ember | Province | Join during a workers' standoff and choose whether your first loyalty is to liberation, survival, or spectacle. | Strike Map: reveal one alternate route in a mission |
| 2 | Burn the Ration Chain | Province | Sabotage a supply network without starving the district you claim to defend. | Smuggled Charges: lock one barricade, turret, or door once |
| 3 | The Prison Ferry | Sea Region | Free prisoners from a transfer barge while deciding whether to rescue leaders, families, or the evidence they carry. | Harbor Uprising Signal: `+5` on one rally or lead roll |
| 4 | Red Dust Broadcast | Planet | Hijack a colonial transmitter and broadcast proof of atrocity before military censors erase the dead. | Rebel Broadcaster: step down one morale or command Dread roll |
| 5 | Orbit Strike Window | Galaxy | Intercept a weapon convoy in orbit and learn the regime is feeding both the rebels and their execution squads. | EMP Spiker: disables one machine ability once |
| 6 | Silence the Black Relay Keeper | World That Was | Break into a relay fortress where the lieutenant turns captured names into kill lists. | Martyr's Bandolier: first explosive or opening strike deals `+5 damage` |
| 7 | Dawn at Furnace Zero | World That Was | Lead the final assault on a war furnace that converts prisoners into powered armor and propaganda. | Final prep comes from prior choices only |

### 12.4 Quick Contract Types

1. Sabotage Run
2. Jailbreak
3. Convoy Intercept
4. Smuggle Civilians
5. Propaganda Recovery

### 12.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Insurgent Tech | signal flare, EMP spiker, burst charge | disruption tools |
| Field Aid | trauma wraps, stim packs, ration gel | survival and tempo |
| Demolitions | pipe suncharge, rail spike bomb, breach tape | aggressive prep |
| Rare Stock | martyr's bandolier, union cipher, furnace-break core | boss counters |

### 12.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Strike Map | Win local organizer trust | Reveal one alternate approach and bypass one patrol |
| Smuggled Charges | Finish sabotage side task | Lock one machine barrier or turret once |
| Rebel Broadcaster | Capture relay equipment | Step down one enemy morale or command Dread check |
| EMP Spiker | Buy or salvage from convoy | Disable one machine ability once |
| Martyr's Bandolier | Reward from lieutenant mission | First opening attack deals `+5 damage` |
| Crowd Testimony | Save prisoners during ferry mission | `+5` on first rally, persuade, or social pressure step |

### 12.7 Final Boss

**The Furnace Marshal**

- Dread: `d20`
- HP: `40`
- Theme: a regime-breaker commander fused into a mobile furnace exosuit

**Abilities**

1. Furnace Vent: area fire burst that punishes clustering.
2. Command Override: buffs nearby machine support.
3. Example of Ash: if a prisoner battery remains active, the boss gains bonus pressure and recovery.

**Weaknesses**

1. EMP Spiker locks `Command Override` once.
2. Smuggled Charges can destroy the prisoner battery support node.
3. Martyr's Bandolier turns the first opening attack into `+5 damage`.

**Boss Reward Themes**

1. Legendary insurgent gadget
2. union-safe travel network
3. rebel merchant tier expansion

## 13. Guild 6: The Archive Keepers

### 13.1 Identity

The Archive Keepers are a guild of hidden librarians, forensic scholars, codex runners, and truth custodians. Their loop is investigation-heavy and should feel the most "learn before you cut" of all six guilds.

### 13.2 Core NPCs

1. Patron: Curator Elowen Vey
2. Handler: Field Scholar Bram Sive
3. Internal Rival: Recorder Talan Myr
4. Civilian Thread: Nia Sol, a novice archivist who keeps finding the wrong truths
5. Lieutenant: The Erasure Custodian

### 13.3 Campaign Arc

| # | Quest | Region | Summary | Primary Prep Unlock |
| --- | --- | --- | --- | --- |
| 1 | Enter the Quiet Stack | Province | Join the Keepers by recovering a censored local court record and choosing who deserves the truth inside it. | Truth Index: reveal one hidden objective or clue |
| 2 | The Salt Library | Sea Region | Search a drowned archive where tides reorder shelves and a stolen plague log can implicate a living power. | Tideproof Folio: ignore one environmental failure or clue loss |
| 3 | The Witness Machine | Province | Interrogate a broken memory engine that may convict the wrong people if reassembled carelessly. | Mnemonic Lattice: `+5` on one investigate or decode roll |
| 4 | Planet of Glass Notes | Planet | Retrieve a shard-codex from a wind-flayed observatory and decide whether to preserve it whole or expose it in pieces. | Prism Lens: step down one illusion or concealment Dread roll |
| 5 | The Silent Catalog Relay | Galaxy | Infiltrate a data relay cataloging forbidden names and discover the Archives have hidden one apocalyptic truth on purpose. | Blackout Glyph: lock one scan, read, or prediction ability once |
| 6 | Unmake the Erasure Custodian | World That Was | Fight the lieutenant in a data mausoleum where rooms are being deleted from reality as you move. | Index Spike: first strike against knowledge entities deals `+5 damage` |
| 7 | Vault of the Consumed Future | World That Was | Enter the final archive vault where a truth-devouring horror feeds on memory, history, and unrecorded worlds. | Final prep comes from prior choices only |

### 13.4 Quick Contract Types

1. Evidence Recovery
2. Forbidden Text Retrieval
3. Truth Raid
4. Witness Protection
5. Ruin Investigation

### 13.5 Shop Inventory Identity

| Item Family | Examples | Gameplay Use |
| --- | --- | --- |
| Research Tools | prism lens, mnemonic wire, spectral chalk | clue and weakness discovery |
| Codices | plague codex, route index, null lexicon | special prep items |
| Field Instruments | recorder drone, sample latch, hush filter | survival and scene control |
| Rare Stock | truth spike, black archive seal, memory coffin key | boss counters |

### 13.6 Prep Table

| Prep Option | How To Get It | Effect |
| --- | --- | --- |
| Truth Index | Intro quest reward | Reveal one hidden clue or target trait |
| Mnemonic Lattice | Repair witness machine | `+5` on first investigate or decode step |
| Prism Lens | Observatory salvage | Step down one illusion, concealment, or false-image Dread roll |
| Blackout Glyph | Relay infiltration reward | Lock one scan or foresight ability once |
| Index Spike | Craft from erased fragments | First hit on archive-born horrors deals `+5 damage` |
| Verified Testimony | Protect Nia Sol and witnesses | Gain reroll on one social truth scene |

### 13.7 Final Boss

**The Pale Index**

- Dread: `d20`
- HP: `40`
- Theme: a living archive predator made of paper bone, lens eyes, and swallowed memories

**Abilities**

1. Redact Reality: deletes one safe route, clue, or environmental aid.
2. Footnote Swarm: sends parasitic fragments that apply pressure over time.
3. Unauthorized Truth: punishes incorrect assumptions unless the player secured verified evidence.

**Weaknesses**

1. Blackout Glyph locks `Redact Reality` once.
2. Prism Lens steps down one false-image roll once.
3. Index Spike makes the first successful strike deal `+5 damage`.

**Boss Reward Themes**

1. Legendary codex item
2. archive access tier
3. rare investigation contract pool

## 14. Contract Generator Requirements

Every guild contract should procedurally generate:

1. A target type
2. A location surface
3. One clue source
4. One prep source
5. One confrontation modifier

### 14.1 Shared Contract Template

```js
{
  missionType: 'guild_contract',
  guildId: 'military',
  contractType: 'bounty_hunt',
  targetName: 'Rell Vane',
  targetTag: 'deserter captain',
  region: 'sea',
  location: 'Storm Anchorage',
  clueSource: 'dock surgeon testimony',
  prepSource: 'shock manacles',
  prepEffect: 'lock escape once',
  confrontationTwist: 'alive payout doubled',
  rewardCredits: 220
}
```

## 15. UI Requirements

### 15.1 Guild Tab Presentation

Each guild card should show:

1. Guild name and visual identity
2. Membership status
3. Campaign progress `0/7`
4. Active campaign quest
5. Quick contracts available
6. Prep options unlocked
7. Shop specialty

### 15.2 Base Hub Sections

Each guild base modal should contain:

1. Join or Oath block
2. Campaign quest block
3. Contracts board block
4. Prep board block
5. Merchant stock block
6. Contacts and rumors block

## 16. Implementation Notes

1. Reuse `createMission(...)` for all campaign and contract postings.
2. Keep guild campaign progression under faction-owned state to preserve campaign sync.
3. Keep current renown as the unlock currency for guild tiers.
4. Merchant generation should become guild-tagged rather than purely generic.
5. Boss hunts should still resolve through the existing combat scene, not a second combat engine.

## 17. Acceptance Criteria

1. All six guilds have a complete 7-quest authored arc.
2. All six guilds have distinct contract flavors, shop identities, prep tables, and bosses.
3. Every guild campaign includes travel across multiple map surfaces.
4. Every boss has explicit counterplay derived from preparation content.
5. No new core stats are added.
6. All prep effects map to existing math and conditions.
7. The design can be implemented incrementally per guild without save breakage.

## 18. Recommended Build Order

1. Convert faction UI copy to guild terminology.
2. Add per-guild campaign state under `S.factionNarrative.guildCampaigns`.
3. Implement one full pilot guild: `military` or `religious`.
4. Add shared prep plumbing.
5. Add guild-tagged merchant stock.
6. Roll out the remaining five guild arcs.
