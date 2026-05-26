# BEYOND: AN EXPANSION
## Draft Manuscript for TTRPG Book
### Archivist Edition

> "I crossed the Province in three seasons and one bad omen. I watched gates open where roads should be, and I watched seasoned hunters become prayerful children the first time a Raid Lord spoke their name. These notes are not theory. They are field work, paid for in ink, blood, and borrowed courage."  
> - Archivist Sel Varo, Ninth Stack of the Infinite Library

---

## Build Order (Editorial)

This draft is still written in production stages, but Step 1 has now been expanded for publication depth.

- Step 1 (expanded in this file): Expedition Raids, encounter tables, loot architecture, and printable reference packets.
- Step 2 (next): Spellcasting overhaul and GM Circumstance Questions.
- Step 3: Monster Hunting and Bounty Protocols (Witcher-style prep loop).
- Step 4: Gate Wars (Mephisto/Azrael lanes), puzzle population, and realm escalation.
- Step 5: Colosseum mode, Soul Forge progression, and affix economy.
- Step 6: Solo Challenge frame: 100 Days until the Old Sun Dies.
- Step 7: Character generator and progression updates (professions, subclass roots, hunt specializations).

---

## Print Layout Conventions (Production Notes)

Use these labels consistently during page layout so the manuscript is template-ready.

> [BOXED CALLOUT]
> Use for critical rules that must be visible at a glance. Keep to 2-6 lines.

> [SIDEBAR]
> Use for design intent, table culture notes, and optional guidance. Do not hide required mechanics in sidebars.

> [READ ALOUD]
> Use for spoken GM text. Keep sentence rhythm strong and under 90 words when possible.

> [PRINTER NOTE]
> Use for grayscale-safe formatting, line-break policy, and table fit guidance.

---

## STEP 1 - RAID EXPEDITIONS OF THE COLLAPSING PROVINCE (EXPANDED)

### I. Archivist Field Warning

A Raid Expedition is not a hero story. It is a pressure chamber.

The Province does not test whether your party is brave. It tests whether you can make correct choices while your resources are bleeding out one decision at a time.

In this mode, players are balancing all of the following at once:

- Combat escalation across three boss phases.
- Portal closure objective that changes the final boss profile.
- Random encounter attrition between major fights.
- Tactical movement pressure from gates, barriers, weather, and collapse.
- Loot timing decisions that matter before the run is over.

If your table understands this loop, Raid mode sings. If your table treats it like a single combat map, it punishes them quickly.

---

### II. Core Mechanic Primer: Dread vs Action Dice

This section must be clear enough that no table needs to guess how the system resolves.

> [BOXED CALLOUT]
> Core resolution: Action total >= Dread total succeeds. Ties succeed.

#### A. Action Dice in This Expansion

All expedition checks resolve with one Action Die from this family:

- Lead
- Control
- Body
- Spirit
- Mind
- Strike
- Shoot
- Defend
- Valor

#### B. Resolution Rule

Whenever a check is called:

1. Identify the Action Die used by the move, event, or combat action.
2. Roll the opposing Dread Die (DD).
3. Compare totals.

Success condition:

- Action total >= Dread total

Failure condition:

- Action total < Dread total

Default margin formula:

- Margin = |Action total - Dread total|

Margin is used in many subsystems to scale damage, backlash, stress, and side effects.

> [SIDEBAR]
> Margin should always be recorded, even when no immediate effect is applied. Later systems can reference stored margin outcomes.

#### C. Exploding Dice and Manual Entry

Digital play supports exploding rolls where available. Manual mode supports physical rolling with direct value entry.

When running manual mode in Raid operations, the UI supports:

- Compare
- Force Success
- Force Failure
- Push Luck (costs Teamwork, steps up Dread)

Push Luck pattern (if used):

- Cost: 2 Teamwork
- Dread die step chain: d4 -> d6 -> d8 -> d10 -> d12 -> d20

Use this exactly when emulating website behavior at the table.

> [PRINTER NOTE]
> Keep the Push Luck die chain on a single line in print proofs: d4 -> d6 -> d8 -> d10 -> d12 -> d20.

---

### III. Raid Structure and Boss Path

Raid runs are three-act boss ladders layered over dynamic province exploration.

Default boss progression:

- Day 1 Boss: d8 Dread, 16 HP
- Day 2 Boss: d10 Dread, 20 HP
- Day 3 Raid Boss: d20 Dread, 40 HP

Portal objective:

- Close 5 portals before Day 3

If objective is met:

- Raid Boss is weakened to d12 Dread, 24 HP

This weakening is not cosmetic. It is the key payoff of strong routing and puzzle execution.

---

### IV. Raid Setup Protocol (GM Exact Procedure)

Run setup in this exact sequence.

1. Generate expedition province map.
2. Stamp barriers and province features.
3. Set expedition day to 1 and phase to explore.
4. Initialize flask economy: 3 current flasks, 7 max.
5. Initialize objective counters:
   - Portals closed = 0
   - Gates closed = 0
   - Portal objective target = 5
6. Seed mini-boss hexes.
7. Seed boss ladder profiles.
8. Roll/select Raid Lord identity.

Raid Lord pool (website-aligned):

- Azrael
- Mephisto
- The Hollow Saint
- The Bone Regent
- The Blackened Throne
- The Rift Shepherd

Table opening script (grim format):

> [READ ALOUD]
> "Choose your armor. Choose your weapon. Choose your flavor blessing. The Province has already chosen how it wants to kill you."

---

### V. Threat Taxonomy and Enemy Profile Tables

#### A. Mechanical Tiers

| Threat Tier | Dread Profile | HP Profile | Notes |
|---|---|---|---|
| Field Enemy | d4 | 4 | Baseline attrition unit |
| Portal Guard | d4 | 4 | Spawned during portal breach |
| Mini Boss | d6 | 12 | Mid-run pressure spike |
| Day 1 Boss | d8 | 16 | First ladder gatekeeper |
| Day 2 Boss | d10 | 20 | Second ladder gatekeeper |
| Raid Boss | d20 (or d12 weakened) | 40 (or 24 weakened) | Final encounter identity |

> [PRINTER NOTE]
> Keep this table in landscape-friendly width and avoid merged cells for home printing.

#### B. Field Enemy Table (Roll or Select)

| d4 | Field Enemy | Tactical Identity |
|---|---|---|
| 1 | Mire Hound | Hunts by sound; punishes noisy armor routes |
| 2 | Lantern Wretch | Shadow field distorts safe lines |
| 3 | Ash Drifter | Creates false movement trails |
| 4 | Bone Orchard Stalker | Precision hunter with lane pressure |

#### C. Mini Boss Table

| d4 | Mini Boss | Tactical Identity |
|---|---|---|
| 1 | The Gallow-Archivist | Control pressure; punishes stalled parties |
| 2 | Salt Widow | Attrition duelist; strips frontliner confidence |
| 3 | Basilica Warden | Greed punisher for loot-lure routes |
| 4 | Hollow Harbormaster | Storm pressure; thrives in rough weather |

#### D. Field Boss Table

| d2 | Field Boss | Tactical Identity |
|---|---|---|
| 1 | Ruin Butcher | Bannered execution profile before Day 1 climax |
| 2 | Gate Devourer | Gate-line predator and transit disruptor |

#### E. Portal Spawn Table

| d2 | Portal Spawn | Tactical Identity |
|---|---|---|
| 1 | Portal Thrall | Breach loyalist that stabilizes local danger |
| 2 | Rift Whelp | Fast pressure piece that punishes indecision |

#### F. Day Boss Suggestions

Day 1:

- The Iron Chancel
- Crown of Thorns

Day 2:

- The Drowned Regent
- Moonchain Colossus

Raid Tier:

- Azrael
- Mephisto
- The Blackened Throne

---

### VI. Exploration Attrition Rules (System Truth)

Raid mode is not only combat. Attrition is delivered between combats through environmental and random checks.

#### A. Rough Weather Resolution

Trigger:

- Rough weather event in the current cell/season state.

Check:

- Lead vs DD6

On failure:

- Mental Stress increases by failure difference.

On success:

- No stress penalty.

#### B. Peril Hex Save

Trigger:

- Entering or resolving a peril-marked hex.

Check:

- Control vs DD4

On failure:

- Mental Stress by difference.
- Time/collapse tick pressure advances.

#### C. Barrier Crossing

Trigger:

- Attempting to cross closed barrier terrain.

Check:

- Body vs DD6

On success:

- Barrier pass token granted (next move crosses).

On failure:

- Tick pressure advances.

#### D. Portal Puzzle Fallback

Trigger:

- Puzzle framework unavailable or manually simplified.

Check:

- Mind vs DD8

On success:

- Portal closes, objective progress increases.

On failure:

- Backlash, additional pressure consequences.

---

### VII. Random Encounter Table (Complete d9 Table)

When a wilderness search triggers random encounter resolution, roll d9:

| d9 | Encounter | Resolution |
|---|---|---|
| 1 | Shifting Weather | Lead vs DD6; failure adds stress pressure |
| 2 | Peril Event | Control vs DD6; failure deals damage/stress by margin |
| 3 | Barrier Event | Body vs DD6; failure blocks route progress |
| 4 | Roaming Enemy Pack | Spawn 1-4 field enemies (DD4, 4 HP each); bounty baseline 60 credits per unit |
| 5 | Loot Cache | Grant field-tier loot roll; may be empty |
| 6 | Roaming Mini Boss | Spawn mini boss (DD6, 12 HP); force combat phase |
| 7 | Roaming Merchant | Generate temporary stock (usually 6-10 items) |
| 8 | Radiation Surge (Valor Check) | Resolve Spirit vs DD6; failure adds Radiation by margin |
| 9 | Portal Surge Teleport | Relocate to valid open hex; fizzle if no legal anchor |

GM running note:

Entries 4 and 6 are combat spikes. Entries 1, 2, 3, and 8 are attrition spikes. Entries 5 and 7 are recovery/tempo pivots. Entry 9 is board-state chaos.

> [SIDEBAR]
> If your table is new to raids, announce category before rolling: "Attrition check," "Combat spike," or "Tempo pivot."

---

### VIII. Portal and Gate Operations (Deep Procedure)

#### A. Gate Seal Procedure

Requirement:

- Player stands on active unsealed gate hex.

Action:

- Seal gate.

Outcome:

- Gates Closed +1
- Gate marked closed and used
- Player forced into transit jump to random open hex (if available)

Practical use:

- Emergency extraction
- Collapse routing
- Position reset before boss lines

#### B. Portal Breach Procedure

Requirement:

- Player stands on active portal
- No unresolved combat lock

Action:

- Breach portal

Outcome:

- Spawn 1-4 portal guards
- Enter combat phase
- Portal event is marked for post-combat puzzle closure

#### C. Portal Puzzle Procedure

Primary mode:

- Shared puzzle challenge (pipe-flow seal style)

Fallback mode:

- Mind vs DD8

On success:

- Portal closes
- Portals Closed +1
- Check if raid boss weakening threshold is reached

On failure:

- Expedition backlash and collapse pressure escalation

---

### IX. Loot Architecture (Detailed Print Format)

Raid loot is run-based and split into tactical classes.

#### A. Boss-Class Loot Rule

Defeating any of the following combat types:

- fieldboss
- miniboss
- boss1
- boss2
- raidboss

Triggers:

- Weapons/armor-weighted loot category preference
- Guaranteed affix application

Affix table:

1. Ashbound
2. Moonchained
3. Thornwake
4. Hollowglass
5. Dreadforged
6. Graven
7. Saltfire
8. Umbral

#### B. Utility Bonus Rule

For selected utility categories (scroll/item/mod/essential style):

- 35% chance to append [AD+1]

#### C. Sample Print Entries

- Saltfire Halberd [Umbral]
- Basilica Plate [Graven]
- Pilgrim Scroll [AD+1]
- Warden Tonic [AD+1]

#### D. Run-Scoped Cache Rule

Run loot remains in expedition cache flow unless moved by explicit post-run economy systems.

This preserves raid identity as a high-pressure, tactical run layer rather than a pure permanent progression fountain.

---

### X. Rewards, Legacy, and Boss Clear Output

On Raid Boss defeat:

- Run marked clear
- Legacy result updated
- Raid Points +3

Use Raid Points in later chapters to drive endgame hooks, gate war readiness, and account-level raid prestige.

---

### XI. GM Pacing Matrix (Grim Structure)

Run the raid in three grim acts.

Act I - The False Mercy

- Let them win one thing early.
- Let them think they are ahead.
- Apply first real attrition event before Day 1 boss.

Act II - The Price Ledger

- Make every route cost something.
- Use portal timing to split party priorities.
- Push mini boss and barrier checks to tax flasks and confidence.

Act III - The Named Hunger

- Reveal raid lord consequences from portal progress.
- Describe boss entrance like a verdict, not a monster reveal.
- End with cost ledger, not victory pose.

Archivist line for Act III opening:

> [READ ALOUD]
> "When the Lord arrived, the bells in our camp rang with no one touching them."

---

## RAID REFERENCE PACKET (PRINTABLE)

These sheets are intentionally written long-form for zero ambiguity. Trim for layout later if needed.

---

### Reference Sheet A - Player Raid Operations

#### Header

Player-facing raid sheet for round-to-round decisions.

#### Rules Core

- Core comparison rule: Action >= Dread succeeds.
- Main objective: close 5 portals before Day 3.
- Boss ladder: d8/16 -> d10/20 -> d20/40.
- Weakened final boss after portal objective: d12/24.
- Gate sealing gives objective progress and forced reposition.

#### Procedure

1. Check current objective counters (portals, gates, day).
2. Choose route based on nearest useful objective, not nearest fight.
3. Resolve movement checks and environmental checks before searching.
4. If portal is reached: breach combat first, then puzzle closure.
5. Log stress, radiation, HP loss, and loot immediately.

#### Roll Tables

| Situation | Roll | Success | Failure |
|---|---|---|---|
| Rough weather | Lead vs DD6 | No penalty | Mental Stress by margin |
| Peril hex | Control vs DD4 | No penalty | +1 Tick and Mental Stress by margin |
| Barrier crossing | Body vs DD6 | Gain pass token; cross on next move | +1 Tick; route stalls |
| Radiation surge | Spirit vs DD6 | No radiation gain | Radiation by margin |

#### Read Aloud

> [READ ALOUD]
> "Your mission is not to win every fight. Your mission is to arrive at Day 3 with enough of yourselves left to matter."

#### Margin Notes

> [SIDEBAR]
> Player decision hierarchy:
> 1. Can we close this portal safely now?
> 2. If no, can we improve position with a gate action?
> 3. If no, do we take controlled attrition to avoid catastrophic attrition?

---

### Reference Sheet B - GM Raid Operations

#### Header

GM operations sheet for setup, flow control, and adjudication order.

#### Rules Core

- Resolve checks in strict order: movement -> environmental -> encounter -> objective update.
- Never skip portal combat before portal puzzle.
- Objective threshold check happens immediately after every portal closure.
- Raid boss clear awards +3 Raid Points.

#### Procedure

1. Pre-run:
   - Seed map and features.
   - Set counters (portals 0/5, gates 0, flasks 3/7).
   - Seed mini bosses and assign raid lord.
2. During-run:
   - Maintain day/phase state at all times.
   - Apply weather/peril/barrier checks as written.
   - Resolve random encounter outcome fully before next action.
   - Update objective counters and weakened-boss state immediately.
3. Post-run:
   - Record result, loot highlights, and resource losses.
   - Award +3 Raid Points on raid boss victory.

#### Roll Tables

| Boss Stage | Dread | HP | Trigger |
|---|---|---|---|
| Day 1 Boss | d8 | 16 | First ladder gate |
| Day 2 Boss | d10 | 20 | Second ladder gate |
| Day 3 Raid Boss | d20 | 40 | Final encounter |
| Day 3 Weakened | d12 | 24 | 5 portals closed before Day 3 |

#### Read Aloud

> [READ ALOUD]
> "Mark your counters in ink. The Province is patient, and it wins when your table forgets one number."

#### Margin Notes

> [SIDEBAR]
> Adjudication order prevents drift. If a turn is unclear, restart at movement and resolve each layer once.

---

### Reference Sheet C - Dread vs Action Matrix

#### Header

Unified check-resolution sheet for all core raid saves.

#### Rules Core

- Compare Action total to Dread total.
- Tie is success.
- Margin = |Action total - Dread total|.
- Record margin even when there is no immediate penalty.

#### Procedure

1. Announce Action stat and Dread die before rolling.
2. Roll Action and Dread.
3. Apply legal bonuses and penalties.
4. Determine success/failure.
5. Apply exact consequence line.
6. Log outcome in raid notes.

#### Roll Tables

| Situation | Action Die | Dread Die | On Success | On Failure |
|---|---|---|---|---|
| Rough weather check | Lead | DD6 | No penalty | Mental Stress by margin |
| Peril hex save | Control | DD4 | No penalty | +1 Tick and Mental Stress by margin |
| Random peril event | Control | DD6 | No damage | HP damage by margin (minimum 1) |
| Barrier crossing | Body | DD6 | Gain pass token; cross next move | +1 Tick; route stalls |
| Valor/radiation encounter | Spirit | DD6 | No radiation gain | Radiation by margin (minimum 1) |
| Portal fallback puzzle | Mind | DD8 | Portal closes; objective +1 | Portal remains dangerous; backlash |
| Combat lane action | Strike/Shoot/Defend/Valor | Enemy Dread | Resolve attack/effect | Resolve enemy pressure and losses |

> [PRINTER NOTE]
> Freeze this table width to one page. If needed, abbreviate the last row to "Combat lane" for narrow formats.

#### Read Aloud

> [READ ALOUD]
> "Call your die. Call the dread. Then let the numbers judge you."

#### Margin Notes

> [SIDEBAR]
> Manual mode options are Compare, Success, Failure, Push Luck + Success, and Push Luck + Failure.
> Push Luck costs 2 Teamwork and raises Dread one step: d4 -> d6 -> d8 -> d10 -> d12 -> d20.

---

### Reference Sheet D - Encounter Tables Packet

#### Header

Exact random encounter execution sheet for wilderness search resolution.

#### Rules Core

- Each Search Hex action generates one wilderness read and one d9 encounter roll.
- Resolve the encounter fully before any further movement.
- If combat is spawned, open combat immediately.

#### Procedure

1. Read one wilderness line (table below).
2. Roll d9 on the encounter table.
3. Execute the listed roll/spawn exactly.
4. Apply consequence lines immediately.
5. Log the result with encounter number.

#### Roll Tables

#### Wilderness Read Table (d5 flavor line)

| d5 | Read Text |
|---|---|
| 1 | Sky: a castle hangs in chains from the moonlit cloudline. |
| 2 | Flora and Fauna: pale reeds and kneeling skeletons line the route. |
| 3 | Wonder: a submerged throne room still burns in silence. |
| 4 | Aftermath: impossible architecture intersects with ruined roads. |
| 5 | Archaeology: statues watch from angles no mason could set. |

#### d9 Random Encounter Table (full resolution)

| d9 | Encounter | How It Works | GM Read Text |
|---|---|---|---|
| 1 | Shifting Weather | Run Dangerous Weather from current hex and season. If weather is rough: Lead vs DD6. Success: no penalty. Failure: Mental Stress by margin (minimum 1). If weather is not rough: no mechanical penalty. | "The weather turns hostile. Check your Lead against DD6." |
| 2 | Peril Event | Roll Control vs DD6. Success: peril cleared. Failure: take HP damage equal to margin (minimum 1). | "The route itself lashes back. Roll Control vs DD6." |
| 3 | Barrier Event | Roll Body vs DD6. Success: barrier crossed. Failure: route blocked; no crossing this resolution. | "A barrier seals the route. Roll Body vs DD6 to force passage." |
| 4 | Roaming Enemy Pack | Spawn 1-4 field enemies. Each enemy profile is DD4 and 4 HP. Enter combat immediately. Bounty baseline: 60 Credits per enemy count. | "Movement in the ashline. A roaming pack converges on your position." |
| 5 | Loot Cache | Roll field-tier loot grant. Outcome can be item found or empty cache. | "A hidden cache surface-breaks under the dust." |
| 6 | Roaming Mini Boss | Spawn one mini boss at DD6 and 12 HP. Enter combat immediately. | "Something larger has marked your route. Mini boss engaged." |
| 7 | Roaming Merchant | Generate temporary merchant stock (6-10 items), each with listed credit cost. Party may buy directly from encounter stock. | "A caravan breaks through the dust. Temporary stock is available now." |
| 8 | Radiation Surge | Roll Spirit vs DD6 (Valor context). Success: no radiation gain. Failure: Radiation increases by margin (minimum 1). | "The air burns blue. Roll Spirit vs DD6 to endure the surge." |
| 9 | Portal Surge Teleport | Attempt random relocation to a valid open hex different from current position. If no anchor is found, surge fails and position stays. | "Space folds. A portal surge tries to throw you across the Province." |

#### Enemy/Profile Tables

| d4 | Field Enemy |
|---|---|
| 1 | Mire Hound |
| 2 | Lantern Wretch |
| 3 | Ash Drifter |
| 4 | Bone Orchard Stalker |

| d4 | Mini Boss |
|---|---|
| 1 | Gallow-Archivist |
| 2 | Salt Widow |
| 3 | Basilica Warden |
| 4 | Hollow Harbormaster |

| d2 | Portal Guard |
|---|---|
| 1 | Portal Thrall |
| 2 | Rift Whelp |

| d6 | Raid Lord |
|---|---|
| 1 | Azrael |
| 2 | Mephisto |
| 3 | The Hollow Saint |
| 4 | The Bone Regent |
| 5 | The Blackened Throne |
| 6 | The Rift Shepherd |

#### Read Aloud

> [READ ALOUD]
> "Search complete. One truth from the wilderness, then one judgment from the encounter die."

#### Margin Notes

> [SIDEBAR]
> Recommended logging format:
> Encounter X/9: [Result].
> Example: Encounter 2/9: Peril failed, took 3 damage.

---

### Reference Sheet E - Loot and Affix Packet

#### Header

Loot execution sheet for encounter rewards and boss trophies.

#### Rules Core

- Boss-type victories prioritize weapons and armor in loot selection.
- Boss-type loot receives an affix tag.
- Eligible utility categories have a 35% chance to gain [AD+1].

#### Procedure

1. Identify loot source (field, miniboss, boss tier, raid boss, cache).
2. Roll/select item from correct pool.
3. If boss-class source, apply one affix.
4. If utility category is eligible, roll 35% chance for [AD+1].
5. Record full item string in run log.

#### Roll Tables

| d8 | Affix |
|---|---|
| 1 | Ashbound |
| 2 | Moonchained |
| 3 | Thornwake |
| 4 | Hollowglass |
| 5 | Dreadforged |
| 6 | Graven |
| 7 | Saltfire |
| 8 | Umbral |

| Utility Bonus Check | Result |
|---|---|
| 1-65 on d100 | No modifier |
| 66-100 on d100 | Append [AD+1] |

#### Read Aloud

> [READ ALOUD]
> "The dead rarely leave gifts. What they leave are obligations with sharp edges."

#### Margin Notes

> [SIDEBAR]
> Print examples:
> Saltfire Halberd [Umbral]
> Basilica Plate [Graven]
> Pilgrim Scroll [AD+1]

---

### Reference Sheet F - Raid Turn Script (At-Table Read Aloud)

#### Header

One-turn pacing script to keep raids fast, grim, and rules-accurate.

#### Rules Core

- Do not skip sequence.
- Do not resolve encounters out of order.
- Do not defer counter updates.

#### Procedure

1. State objective counters and current day.
2. Declare intended route and priority target.
3. Resolve movement-linked checks (weather/peril/barrier).
4. Resolve search/encounter result.
5. If portal triggered: combat first, puzzle second, update portal counter.
6. Log losses, gains, and positional changes.
7. Hand initiative to next decision point.

#### Roll Tables

| Stalled Table Prompt | Use When |
|---|---|
| Run | Players are drifting and need objective focus |
| Objective | Players are fighting without portal/gate progress |
| Survival | Players are overextending into attrition collapse |

#### Read Aloud

> [READ ALOUD]
> 1. "State objective and current counters."
> 2. "Declare route and why."
> 3. "Resolve movement checks and environmental checks."
> 4. "Resolve encounter if triggered."
> 5. "If portal: fight, then puzzle, then update counters."
> 6. "Log attrition and loot openly."
> 7. "Advance to next decision point immediately."

> [READ ALOUD]
> "What are you protecting right now: the run, the objective, or yourselves?"

#### Margin Notes

> [SIDEBAR]
> If a turn becomes unclear, rewind to Step 1 and re-run the sequence in order.

---

### XII. Archivist Closing Passage (Grim Revision)

> [READ ALOUD]
> "Most novices believe raids are won when the Lord falls. Veterans know the Lord is only the receipt. The bill arrives earlier: in the barrier you failed, the flask you burned, the portal you postponed, the ally you left one hex too far from rescue. The Province remembers all of it. It remembers better than we do."

---

## Next Writing Target (Step 2)

Step 2 remains spell system conversion, but this Step 1 tone and format are now aligned to the grimmer manuscript voice.

Step 2 will include:

- Four-tier Circumstance Question architecture.
- Yes/No modifier logic and exactly how it modifies cast rolls.
- Failure bands and backlash ladders.
- AOE mode behavior (focused, standard, expanded) with margin gates.

