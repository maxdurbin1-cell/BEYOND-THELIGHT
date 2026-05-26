# BEYOND: AN EXPANSION
## Draft Manuscript for TTRPG Book
### Archivist Edition

> "I crossed the Province in three seasons and one bad omen. I watched gates open where roads should be, and I watched seasoned hunters become prayerful children the first time a Raid Lord spoke their name. These notes are not theory. They are field work, paid for in ink, blood, and borrowed courage."  
> - Archivist Sel Varo, Ninth Stack of the Infinite Library

---

## Build Order (Editorial)

This draft is written in production stages. Steps 1-3 are now codified in manuscript form from live website behavior.

- Step 1 (complete): Expedition Raids, encounter tables, loot architecture, and printable reference packets.
- Step 2 (complete): Spellcasting overhaul and GM Circumstance Questions.
- Step 3 (complete): Monster Hunting and Bounty Protocols with zero-ambiguity rule blocks.
- Step 4 (complete): Gate Wars (Mephisto/Azrael lanes), puzzle population, and realm escalation.
- Step 5 (complete): Colosseum mode, Soul Forge progression, and affix economy.
- Step 6 (complete): Solo Challenge frame: 100 Days until the Old Sun Dies.
- Step 7 (pending transfer): Character generator and progression updates (professions, subclass roots, hunt specializations).

---

## Expansion Purpose and Transfer Charter

Purpose of this expansion:

- Translate website systems into print-ready, table-executable rules without mechanical drift.
- Expand play space by adding operational depth, not replacing core identity.
- Preserve the base tone: grim, high-pressure, consequence-led progression.

Scope law:

- New content: classes/profession paths, hunt/gate/colosseum encounters, spell scroll catalogs, affix economies.
- New rules: optional and advanced procedures must remain module-safe with core play.
- Setting material: regions, factions, gate lanes, world-state consequences, and campaign hooks.
- Campaign continuity: each new chapter must chain to prior systems with explicit state handoffs.

---

## Completeness Audit (Website -> Book)

Current status:

- Complete in manuscript: Step 1, Step 2, Step 3, Step 4, Step 5, Step 6.
- Remaining for full transfer: Step 7.

Remaining transfer queue by system source:

- Step 7 source cluster: character generation/state bootstrap, backstory/faction hooks, profession/subclass progression wiring, and onboarding prompts.

Definition of complete:

- Every major website loop has a chapter procedure, reference sheet, and read-aloud support.
- Every chapter includes code-truth notes for deterministic mechanics.
- Every new rule has trigger, inputs, resolution, and consequences in print language.

---

## Seven-Layer Production Framework (Applied to This Book)

### 1) Define Expansion Purpose

- Treat this expansion as a full systems translation plus advanced play continuation.
- Add possibility space while keeping core action economy, dread math, and consequence cadence intact.

### 2) Align Tone and Mechanics

- Keep balance parity with base game dice ladders and stress/condition throughput.
- Preserve archival grim voice and avoid tonal genre break unless chapter fiction justifies it.
- Keep naming and formatting consistent with established terminology.

### 3) Build Content in Layers

- Lore first: why each system exists in-world and what faction pressure it represents.
- Mechanics second: explicit procedure blocks and deterministic mappings.
- Play examples third: short table examples for each advanced subsystem.

### 4) Keep It Playable and Tested

- Validate each chapter with short scenario loops (fast pass, stress pass, edge-case pass).
- Trim complexity where procedure count exceeds table utility.

### 5) Structure the Book Clearly

- Introduction: what this expansion adds and integration boundaries.
- Lore and setting: region/faction/gate-state context.
- Player options: professions, subclass roots, spells, gear.
- GM tools: monsters, hazards, random tables, contract engines.
- Campaign content: hunt arcs, gate wars, colosseum/soul forge tracks.
- Appendices: one-page packets, token standards, quick references.

### 6) Presentation and Layout

- Keep production tags consistent: boxed callout, sidebar, read aloud, printer note.
- Use table-first formatting for at-table speed and grayscale-safe print.

### 7) Publishing and Distribution

- Prepare both digital and print-safe layout versions.
- Include a short free sample packet with one complete loop from each major mode.

> [SIDEBAR]
> North-star rule for this manuscript: unlock new possibilities without displacing core play.

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

## STEP 2 - SPELL CIRCUMSTANCE ENGINE AND ARCANE FAILURE LAW

### I. Archivist Warning: Spells Are Judged, Not Cast

In this system, a spell is not one roll.

A spell is a negotiated event between:

- the caster's Mind,
- the current field conditions,
- the caster's Spirit stability,
- and the resisting Valor track.

The table asks questions first. The questions change the numbers. The numbers decide whether the spell arrives as a blessing or a wound.

---

### II. Spell Cast Sequence (Exact Procedure)

Use this exact sequence for every scroll cast in Step 2 play.

1. Identify spell and load its circumstance profile.
2. Ask the four circumstance questions (Major, Minor, Tertiary, Quaternary).
3. Resolve Yes/No answers into modifiers.
4. Apply any stored backlash from previous cast failure.
5. Roll Mind side and Valor side with all circumstance modifiers.
6. Determine success/failure and margin.
7. Apply manifestation tier text.
8. If failure: apply failure band and backlash effects.
9. If success and spell has AOE: choose Focused, Standard, or Expanded mode.

> [BOXED CALLOUT]
> Core spell comparison: Final Mind total >= Final Valor total succeeds.

> [CODE-TRUTH NOTE]
> Runtime path: circumstance prompt -> evaluate modifiers -> consume stored backlash step -> roll Mind/Spirit math -> stepped Valor roll -> compare -> resolve manifestation/failure band.

---

### III. Four-Tier Circumstance Architecture

Each spell cast asks exactly four Yes/No questions.

Tier structure:

1. Major
2. Minor
3. Tertiary
4. Quaternary

Each tier has a question pool. One question from each pool is selected for the cast profile.

#### A. Modifier Types Generated by Answers

Each Yes/No answer can apply one or more of these effects:

- Mind flat modifier (example: +2 Mind total or -1 Mind total)
- Valor die step change (step up or step down)
- Mind Step Up Advantage
- Mind Step Down Disadvantage
- Add Spirit die to Mind total (one or more times)
- Subtract Spirit die from Mind total (one or more times)
- Narrative trigger note

#### B. Cancellation Rule

If both of these are present in the same cast:

- Mind Step Up Advantage
- Mind Step Down Disadvantage

They cancel each other. Neither applies.

#### C. Spirit Count Rule

Spirit modifiers are counted.

- If two separate answers grant Add Spirit, you roll/add Spirit twice.
- If two separate answers grant Subtract Spirit, you roll/subtract Spirit twice.

> [CODE-TRUTH NOTE]
> Advantage and disadvantage hard-cancel when both are present. Spirit add/subtract effects are counted, not boolean.

---

### IV. Dice Ladder and Step Rules (Exact)

Step ladder for spell die stepping:

- d4 -> d6 -> d8 -> d10 -> d12 -> d20

Step up:

- Move one rung right per step.

Step down:

- Move one rung left per step.

Special floor rule at d4:

- If additional step-downs remain while already at d4, do not go below d4.
- Instead, roll d4 multiple times and keep the lowest result.
- Rolls required = 1 + number of extra floor step-downs.

This floor rule is critical for severe spell instability.

> [CODE-TRUTH NOTE]
> At d4 floor with extra step-downs, runtime rolls d4 multiple times and keeps the lowest result.

---

### V. Full Cast Math (Tabletop Translation)

#### A. Inputs

- Mind Die: caster Mind die.
- Valor Die: caster Valor/Adventure die used as resisting dread-side die.
- Spirit Die: caster Spirit die.
- Circumstance result packet from four questions.

#### B. Mind Total Construction

1. Roll base Mind.
2. If Step Up Advantage is active:
   - roll a step-up Mind die,
   - keep the higher of base and step-up rolls.
3. Else if Step Down Disadvantage is active:
   - roll a step-down Mind die,
   - keep the lower of base and step-down rolls.
4. Roll and add Spirit for each Add Spirit count.
5. Roll and subtract Spirit for each Subtract Spirit count.
6. Apply total Mind flat modifier.
7. Minimum final Mind total is 1.

#### C. Valor Total Construction

1. Start from base Valor die.
2. Apply total Valor step modifier from circumstances.
3. Apply carried backlash step-up if present.
4. Resolve stepped die roll using floor-step-down rule.

#### D. Success, Failure, Margin

- Success: Mind total >= Valor total
- Failure: Mind total < Valor total
- Margin: |Mind total - Valor total| (minimum 1)

> [CODE-TRUTH NOTE]
> Mind total is clamped to minimum 1 after all additions/subtractions.

---

### VI. Manifestation Tier Mapping (Margin Bands)

Both success and failure text use an 8-tier margin index:

| Margin | Tier Index |
|---|---|
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 |
| 5 | 4 |
| 6 | 5 |
| 7 | 6 |
| 8+ | 7 |

Use the matching tier text from the spell profile:

- Success tier text for successful cast.
- Failure tier text for failed cast.

Each tier provides:

- Effect description,
- Cast look,
- Field look.

> [CODE-TRUTH NOTE]
> Tier index mapping is fixed at 8 bands: margin 1..7 map to index 0..6, margin 8+ maps to index 7.

---

### VII. Failure Bands and Backlash Ladder (Exact)

Failure bands by margin:

| Margin Band | Failure Band Text |
|---|---|
| 1-2 | Something may notice the unlocked threshold. |
| 3-4 | Nearby locks may never function again. |
| 5-6 | Shadows near the doorway deepen permanently. |
| 7-8 | Increase Dread next time you cast. |
| 9-10 | Hallucinatory feedback overwhelms your senses. |
| 11+ | Arcane rupture; apply a severe consequence and lasting scar. |

Backlash effects by margin:

| Margin Band | Mechanical Backlash |
|---|---|
| 1-2 | Narrative omen only. |
| 3-4 | Nearby lockwork glitches; can remain unreliable. |
| 5-6 | Apply Shaken condition. |
| 7-8 | Store backlash: next spell cast gets +1 Valor step-up pressure. |
| 9-10 | Apply mental stress (minimum 1; scales by margin). |
| 11+ | Severe rupture: high mental stress and possible trauma. |

> [SIDEBAR]
> Stored backlash is consumed on the next cast before rolling and then removed.

> [CODE-TRUTH NOTE]
> Backlash outcomes are margin-gated at 1-2, 3-4, 5-6, 7-8, 9-10, and 11+ with explicit effects in code (including Shaken, stress, and possible trauma).

---

### VIII. AOE Mode Law (Focused, Standard, Expanded)

If a cast succeeds and the spell has an AOE profile, choose one mode:

| Mode | Target Cap | Status Cap | Availability |
|---|---|---|---|
| Focused | 1 | 1 | Always |
| Standard | 2 | 2 | Always |
| Expanded | 3 | 3 | Requires success margin 4+ |

Base AOE damage rule:

- Each affected hostile takes stress damage equal to success margin.

Status spread rule:

- Status effects only apply up to Status Cap for the selected mode.

Expanded lock rule:

- If success margin is below 4, Expanded is unavailable.

#### A. Support-Only AOE Spells

Support-oriented spells can skip direct enemy damage and instead:

- apply caster condition,
- clear one negative player condition,
- grant action boost.

#### B. Starwell Pull Behavior

Starwell-type pull effects move Far enemies to Engaged before detonation resolution.

> [CODE-TRUTH NOTE]
> Expanded AOE is locked unless success margin is 4+. Target/status caps are fixed: Focused 1/1, Standard 2/2, Expanded 3/3.

---

### IX. Manual Mode Translation

If your table uses manual entry mode:

1. Ask and resolve circumstance questions the same way.
2. Build modifier list openly.
3. Roll physical dice.
4. Enter totals.
5. Resolve success/failure and margin normally.

Manual mode still uses:

- four-tier circumstances,
- step logic,
- margin tiering,
- AOE gating.

> [CODE-TRUTH NOTE]
> Manual mode preserves the same modifier engine and outcome mapping; only dice entry method changes.

---

## STEP 2 REFERENCE PACKET (PRINTABLE)

All sheets follow the same one-page frame.

---

### Reference Sheet S2-A - Spell Cast Operations

#### Header

Player-facing spell sequence sheet.

#### Rules Core

- Ask four questions before every cast.
- Apply all modifiers before rolling final totals.
- Tie succeeds.

> [CODE-TRUTH NOTE]
> Cast success is computed as final Mind total >= final Valor total.

#### Procedure

1. Identify spell and profile.
2. Ask Major, Minor, Tertiary, Quaternary question.
3. Record Yes/No for each.
4. Build modifiers.
5. Roll Mind and Valor sides.
6. Resolve margin, tier text, and aftermath.

#### Roll Tables

| Check | Success | Failure |
|---|---|---|
| Mind vs Valor | Spell manifests | Spell fails and enters failure band |

#### Read Aloud

> [READ ALOUD]
> "Answer what the world is doing first. Then we ask whether your spell belongs in it."

#### Margin Notes

> [SIDEBAR]
> Spell casting is a procedure, not a shortcut. Skipping question tiers changes outcomes.

---

### Reference Sheet S2-B - Circumstance Modifier Matrix

#### Header

Quick sheet for translating Yes/No answers into math.

#### Rules Core

- Every answer applies its listed effect.
- Advantage and disadvantage can cancel.
- Spirit add/subtract counts stack.

> [CODE-TRUTH NOTE]
> Modifier aggregation is additive for Mind flat/Valor step and counted for Spirit add/subtract.

#### Procedure

1. Mark each answer Yes or No.
2. Add Mind flat changes.
3. Sum Valor step changes.
4. Mark Advantage/Disadvantage flags.
5. Count Spirit add/subtract instances.

#### Roll Tables

| Effect Type | Resolution Rule |
|---|---|
| Mind flat | Add or subtract from final Mind total |
| Valor step | Step Valor die along ladder |
| Step Up Advantage | Roll step-up Mind and keep higher |
| Step Down Disadvantage | Roll step-down Mind and keep lower |
| Add Spirit | Roll Spirit and add; repeat per count |
| Subtract Spirit | Roll Spirit and subtract; repeat per count |

#### Read Aloud

> [READ ALOUD]
> "The answers are not flavor. The answers are the spell's geometry."

#### Margin Notes

> [SIDEBAR]
> If both Step Up and Step Down appear, remove both and continue.

---

### Reference Sheet S2-C - Failure and Backlash Ladder

#### Header

Failure severity and automatic backlash outcomes.

#### Rules Core

- Failed casts always produce a failure band.
- Backlash severity tracks failure margin.
- Stored backlash carries to next cast and is consumed.

> [CODE-TRUTH NOTE]
> Stored backlash applies as +1 Valor step pressure on the next cast before rolling, then decrements.

#### Procedure

1. Determine failure margin.
2. Read matching failure band.
3. Apply backlash effect immediately.
4. If backlash stores a future step-up, mark it now.

#### Roll Tables

| Margin | Band | Backlash |
|---|---|---|
| 1-2 | Notice event | Narrative omen only |
| 3-4 | Lock instability | Nearby lockwork unreliability |
| 5-6 | Deepening shadows | Apply Shaken |
| 7-8 | Dread rises | Store next-cast Valor step-up |
| 9-10 | Hallucinatory feedback | Apply mental stress |
| 11+ | Arcane rupture | Severe stress and possible trauma |

#### Read Aloud

> [READ ALOUD]
> "Failure is not empty. Failure leaves a mark, and the mark remembers you."

#### Margin Notes

> [SIDEBAR]
> Keep a visible marker for stored backlash so the next cast cannot forget it.

---

### Reference Sheet S2-D - AOE Mode Resolution

#### Header

Combat resolution sheet for successful AOE casts.

#### Rules Core

- Damage per target equals success margin.
- Mode sets target and status caps.
- Expanded mode requires margin 4+.

> [CODE-TRUTH NOTE]
> AOE resolution consumes pending spell state and marks it resolved after a single mode choice.

#### Procedure

1. Confirm successful cast and margin.
2. Choose Focused, Standard, or Expanded.
3. Select targets in legal order.
4. Apply margin damage to affected hostiles.
5. Apply status effects up to status cap.

#### Roll Tables

| Mode | Target Cap | Status Cap | Expanded Gate |
|---|---|---|---|
| Focused | 1 | 1 | N/A |
| Standard | 2 | 2 | N/A |
| Expanded | 3 | 3 | Margin 4+ only |

#### Read Aloud

> [READ ALOUD]
> "Choose your shape: needle, standard line, or hunger made wide."

#### Margin Notes

> [SIDEBAR]
> If no hostile targets are legal, the AOE combat resolution does not apply.

---

### Reference Sheet S2-E - Spell Roll Worksheet

#### Header

Fill-in worksheet for table use.

#### Rules Core

- Always calculate final Mind and final Valor explicitly.
- Do not skip Spirit add/subtract rolls.

> [CODE-TRUTH NOTE]
> Keep worksheet numbers in order to preserve deterministic replay of cast outcomes.

#### Procedure

1. Base Mind roll: ____
2. Advantage/Disadvantage adjustment: ____
3. Spirit adds total: ____
4. Spirit subtract total: ____
5. Mind flat total: ____
6. Final Mind total: ____
7. Final Valor total: ____
8. Margin: ____
9. Result: Success / Failure

#### Roll Tables

| Value | Entry |
|---|---|
| Mind die size | ____ |
| Valor die size | ____ |
| Spirit die size | ____ |
| Valor step total | ____ |
| Stored backlash used | Yes / No |

#### Read Aloud

> [READ ALOUD]
> "Write every number. If you hide the math, the spell will lie to you."

#### Margin Notes

> [SIDEBAR]
> Minimum final Mind total is 1 after all adds/subtracts.

---

### Reference Sheet S2-F - GM Spell Script

#### Header

Spoken pacing script for running casts cleanly under pressure.

#### Rules Core

- One question per tier.
- One resolution pass.
- One consequence pass.

> [CODE-TRUTH NOTE]
> Lock answers before rolling; do not retroactively edit circumstance inputs after dice are cast.

#### Procedure

1. "State spell name, intended target, and range context."
2. "Ask exactly four questions in order: Major, Minor, Tertiary, Quaternary."
3. "Lock answers and read every modifier aloud before dice."
4. "Roll Mind side and Valor side using full modifier math."
5. "Declare success/failure and exact margin."
6. "Apply manifestation tier or failure band immediately."
7. "If AOE succeeded, choose mode and resolve targets/status caps now."

#### Roll Tables

| Prompt | Use |
|---|---|
| "What changed in the field?" | Before question phase |
| "What is your final math?" | Before result declaration |
| "What does the spell leave behind?" | After resolution |

#### Read Aloud

> [READ ALOUD]
> "Major. Minor. Tertiary. Quaternary. Then the cast. Then the cost."

#### Margin Notes

> [SIDEBAR]
> If players debate after answers are locked, do not reopen circumstance answers mid-cast.

---

### X. Spell Scroll Question Index (Website Deterministic)

Each row below is generated from website logic in `getSpellCircumstanceProfile(scrollName, scrollDesc)`.

> [CODE-TRUTH NOTE]
> Question selection is deterministic by hash seed of `lowercase(scroll name) + '|' + scroll description`, then one pick from each pool at offsets 1, 3, 5, and 7.

#### Base Scroll Questions

| Spell Scroll | Major | Minor | Tertiary | Quaternary |
|---|---|---|---|---|
| Speak with Animals | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Invisibility | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Levitate Object | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Reveal Traps | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Night Vision | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Create Light | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Silent Steps | Is this cast near funeral grounds, divine festival ground, or cataclysm weather? | Are you standing on grave soil, salt air, or charged earth? | Is the moon phase favorable for this spell family? | Did a witness omen occur (crow, bells, child present, shoes removed)? |
| Create Portal | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Fly | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Repair Object | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Plant Growth | Is this cast near funeral grounds, divine festival ground, or cataclysm weather? | Are you standing on grave soil, salt air, or charged earth? | Is the moon phase favorable for this spell family? | Did a witness omen occur (crow, bells, child present, shoes removed)? |
| None Can Lie | Is this cast near funeral grounds, divine festival ground, or cataclysm weather? | Are you standing on grave soil, salt air, or charged earth? | Is the moon phase favorable for this spell family? | Did a witness omen occur (crow, bells, child present, shoes removed)? |
| Empower | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Ward of Steel | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Sight Beyond | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Battle Hymn | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Speak with the Dead | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Mark of Passage | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Memory of Stone | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Warding Sigil | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Bind Oath | Is this cast near funeral grounds, divine festival ground, or cataclysm weather? | Are you standing on grave soil, salt air, or charged earth? | Is the moon phase favorable for this spell family? | Did a witness omen occur (crow, bells, child present, shoes removed)? |
| Shroud of Forgetting | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Summon Familiar | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| True Name Revealed | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |

#### Expanded Scroll Questions

| Spell Scroll | Major | Minor | Tertiary | Quaternary |
|---|---|---|---|---|
| Thunder Lattice | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Ashfall Ring | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Gravitic Fold | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Glass Rain | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Bastion Bloom | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Null Choir | Is this cast near funeral grounds, divine festival ground, or cataclysm weather? | Are you standing on grave soil, salt air, or charged earth? | Is the moon phase favorable for this spell family? | Did a witness omen occur (crow, bells, child present, shoes removed)? |
| Hexfire Fan | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |
| Tide of Needles | Is the spell cast under a sky your tradition reveres? | Are you near iron structures or dense machinery? | Is the caster emotionally steady for this cast? | Was a lie spoken in earshot moments before casting? |
| Veilstep Chorus | Did a cosmic event begin this same scene? | Is it raining right now? | Did the caster speak in their ritual language? | Did anyone speak a true name tied to this threshold/object? |
| Starwell Collapse | Is a major omen active (eclipse, blood moon, solstice, ley surge)? | Is there fog, smoke, or dust in the air? | Are you facing your tradition's favored direction? | Is copper touching the caster's skin right now? |

---

## STEP 3 - MONSTER HUNTING AND BOUNTY PROTOCOLS (ZERO AMBIGUITY PASS)

This chapter is the executable hunt loop for guild contracts and guild campaign boss hunts.
Every rule block uses this schema:

- Trigger
- Input Dice
- Resolution
- Consequence
- Log Line format

> [BOXED CALLOUT]
> Campaign journal token standard for Step 3:
> - Use lowercase kebab-case event tokens.
> - Use colon-delimited segments only.
> - Use this shape: `event[:id][:field:value...]`.
> - Runtime-authentic `lastOutcome` tokens are: `joined`, `posted:<questId>`, `failed:<questId>`, `completed:<questId>`, `contract-posted:<contractId>`, `contract-completed:<contractId>`, `contract-failed:<contractId>`.

> [CODE-TRUTH NOTE]
> Hunt posting and progression here are mapped to guild systems in faction and mission logic: `ensureGuildContractBoard`, `postGuildContract`, `startGuildCampaignQuest`, `applyGuildPrepToMission`, `resolveGuildCampaignProgress`, `onMissionResolved`, and mission Step 3 confrontation handling.

---

### I. Hunt Board Lifecycle

#### Rule Block S3-1: Generate Contract Board

- Trigger: The table opens a faction base hub and no valid 3-row contract board exists, or the board is refreshed.
- Input Dice: None (state gate and procedural generation).
- Resolution:
   1. Build exactly 3 contract rows.
   2. Assign row difficulty in order: `medium`, `hard`, `challenging/very_hard` track.
   3. Generate title, lore hook, region, and location from guild flavor pools.
   4. Persist board to guild state with new seed and refresh timestamp.
- Consequence:
   1. A new hunting slate exists for posting.
   2. Old board identity is replaced when refresh is forced.
- Log Line format: `board-generated:<factionId>:<seed>`

#### Rule Block S3-2: Refresh Contract Board

- Trigger: Players press `Refresh Board` in guild contract UI.
- Input Dice: None.
- Resolution: Force board regeneration regardless of existing rows.
- Consequence: Available prey contracts rotate; unposted rows are lost.
- Log Line format: `board-refreshed:<factionId>`

#### Rule Block S3-3: Post Contract

- Trigger: Players press `Post` on one contract row.
- Input Dice: None.
- Resolution:
   1. Abort if another guild contract mission is already active.
   2. Abort if chosen contract id is missing.
   3. Create mission packet with `missionType='guild_contract'` and embedded `guildContract` metadata.
   4. Copy up to 3 active prep ids into mission packet.
   5. Apply prep effects to mission bonus and/or dread override.
   6. Bind mission id as active contract mission id.
- Consequence:
   1. Contract enters Missions tab as live hunt.
   2. Guild state marks contract as posted.
- Log Line format: `contract-posted:<contractId>`

---

### II. Campaign Hunt Arc (Story Hunts and Boss Hunt)

#### Rule Block S3-4: Join Guild Campaign

- Trigger: Player selects `Join <GuildName>`.
- Input Dice: None.
- Resolution:
   1. Initialize or reset campaign progression fields.
   2. Set `joined=true`, stage index to 0, clear active campaign mission id.
   3. Reset completion flags and prep selection state.
- Consequence: Campaign hunt chain is unlocked for posting.
- Log Line format: `joined`

#### Rule Block S3-5: Post Campaign Hunt Quest

- Trigger: Player selects `Post Campaign Quest`.
- Input Dice: None.
- Resolution:
   1. Abort if campaign config missing.
   2. Abort if guild not joined.
   3. Abort if another campaign mission is already active.
   4. Pull quest by current stage index.
   5. Create mission with `missionType='guild_campaign'` or `guild_boss_hunt` when `isBoss=true`.
   6. Attach quest metadata, step labels, checkpoint text, lore, prep ids, and optional boss-layer lock map.
   7. Apply prep modifiers to mission bonus and dread.
- Consequence: Campaign prey objective becomes a live mission contract.
- Log Line format: `posted:<questId>`

#### Rule Block S3-6: Resolve Campaign Hunt Progress

- Trigger: Mission system resolves a guild campaign or guild boss hunt mission.
- Input Dice: Mission resolution dice from Step 3 confrontation (see Section IV).
- Resolution:
   1. Ignore if mission id does not match active campaign mission id.
   2. On failure: clear active campaign mission id and keep stage unchanged.
   3. On success: append quest id to completed list, increment stage, clear active mission id.
   4. If quest grants prep unlock id, add it to earned prep options.
   5. If quest is boss hunt, set boss defeated flag.
   6. If stage reaches final threshold (`>= total quests - 1`), set boss unlocked flag.
- Consequence:
   1. Failure creates repost loop with no stage advance.
   2. Success advances hunt arc and expands prep toolkit.
- Log Line format:
   1. Failure: `failed:<questId>`
   2. Success: `completed:<questId>`

---

### III. Weakness and Prep Discovery Loop

#### Rule Block S3-7: Unlock Prep Countermeasure

- Trigger: Campaign quest with `prepUnlockId` is completed successfully.
- Input Dice: None (already resolved by mission success).
- Resolution: Add prep id to guild state `earnedPrepOptions` if not already present.
- Consequence: New weakness countermeasure can be slotted into active prep loadout.
- Log Line format: `prep-unlocked:<prepId>`

#### Rule Block S3-8: Toggle Active Prep Loadout

- Trigger: Player presses `Set Prep` or `Unset` on prep board.
- Input Dice: None.
- Resolution:
   1. Validate prep is owned (earned or purchased).
   2. If already active, remove it.
   3. If inactive, add it only when active count is below 3.
   4. Reject activation when active count is already 3.
- Consequence:
   1. Active prep loadout updates immediately.
   2. Future posted hunts inherit this loadout snapshot.
- Log Line format: `prep-active:<prepId1|prepId2|prepId3>`

#### Rule Block S3-9: Apply Prep to Posted Hunt

- Trigger: A guild contract or campaign quest is posted while active prep ids exist.
- Input Dice: None.
- Resolution:
   1. For each prep with `effectType='bonus'`, add prep bonus to mission `bonus`.
   2. For each prep with `effectType='dread_down'`, step mission dread die downward by configured steps.
   3. Clamp mission bonus to [0..20] and dread floor to d4.
- Consequence: Hunt confrontation math is materially changed before first roll.
- Log Line format: `prep-applied:<missionId>:bonus:<n>:dread:d<die>`

> [SIDEBAR]
> In fiction, treat prep as known weakness exploitation. In mechanics, it is explicit bonus and/or dread suppression.

---

### IV. Confrontation Roll Law (Mission Step 3)

#### Rule Block S3-10: Core Hunt Confrontation Check

- Trigger: Players enter Step 3 Confrontation for posted hunt mission.
- Input Dice:
   1. Action side: Valor die (`d<Valor>`), plus mission bonus.
   2. Opposition side: mission dread die, or GM override dread die.
- Resolution:
   1. Roll action total and dread total.
   2. Compare `action + bonus` against `dread`.
   3. If action total is greater than or equal to dread total, mark success path.
   4. Otherwise open failure consequence modal (accept failure or push luck).
- Consequence:
   1. Success path can resolve mission as completed.
   2. Failure path applies consequence package before mission fail resolution.
- Log Line format: `check:<missionId>:<success|failure>:action:<actionPlusBonus>:dread:<dread>`

#### Rule Block S3-11: Failure Consequence Package

- Trigger: Confrontation check fails and players accept failure (or fail push-luck reroll).
- Input Dice:
   1. Action total and dread total from check pair.
   2. Margin = `max(1, dread - action)`.
- Resolution:
   1. Compute margin.
   2. Apply margin as damage/stress.
   3. Apply +1 Mental Stress.
   4. Apply Radiation +1.
   5. Apply one negative condition keyed to failed stat axis (Valor defaults to `distracted`).
   6. Add +1 Teamwork meter.
   7. If boss-layer ability locks are active, reduce margin and suppress specific lines per lock map.
- Consequence: Hunt failure has guaranteed attrition even before mission outcome renown/faction fallout.
- Log Line format: `fail-package:<missionId>:margin:<k>:mental:1:radiation:1:condition:<key>:tmw:1`

#### Rule Block S3-12: Push Luck Protocol

- Trigger: Failure modal appears and players choose `Push Luck`.
- Input Dice:
   1. Spend gate: 2 Teamwork required.
   2. Reroll at stepped-up dread die (`next dread tier`).
- Resolution:
   1. Spend 2 Teamwork immediately.
   2. Reroll confrontation at higher dread.
   3. On reroll success: grant positive condition mapped from Valor axis and resolve mission as success.
   4. On reroll failure: apply failure consequence package and resolve mission as failure.
- Consequence: High-risk recovery lane that can flip a lost hunt into success.
- Log Line format: `push-luck:<missionId>:spent-tmw:2:dread:d<newDread>:<success|failure>`

---

### V. Boss Hunt Layering (Known Weakness Enforcement)

#### Rule Block S3-13: Build Boss Ability Lock Layer

- Trigger: Posting a quest flagged `isBoss=true`.
- Input Dice: None.
- Resolution:
   1. Load boss profile for faction (`bossId`, `bossName`, ability list).
   2. Cross-reference selected prep ids against boss `prepLocks` map.
   3. Mark each matching ability with `lockedByPrepIds`.
- Consequence: Prepared weaknesses hard-disable or soften named boss abilities.
- Log Line format: `boss-layer:<missionId>:locked:<abilityId-list>`

#### Rule Block S3-14: Boss Lock Mitigation in Failure Math

- Trigger: Failure consequence package executes for boss-hunt mission with locked abilities.
- Input Dice: Margin from failed confrontation.
- Resolution:
   1. Reduce margin by up to 2 based on lock count.
   2. Suppress Mental Stress line when specific locked ability ids match mitigation map.
   3. Suppress Condition line when specific locked ability ids match mitigation map.
- Consequence: Proper weakness prep converts lethal boss attrition into survivable failure.
- Log Line format: `boss-mitigation:<missionId>:margin-reduce:<n>:suppress:<mental|condition|none>`

---

### VI. Contract and Campaign Outcome Settlement

#### Rule Block S3-15: Guild Contract Resolution Hook

- Trigger: Mission system resolves `missionType='guild_contract'`.
- Input Dice: Upstream confrontation and mission success boolean.
- Resolution:
   1. If resolved mission id matches active contract mission id, clear active id.
   2. On success, increment contract run count.
   3. Write last outcome as completed or failed contract token.
   4. On success, force contract board refresh for new work.
- Consequence:
   1. Contract slot reopens for repost.
   2. Success increments repeat-hunt progress metric.
- Log Line format:
   1. Success: `contract-completed:<contractId>`
   2. Failure: `contract-failed:<contractId>`

#### Rule Block S3-16: Mission Reward and Penalty Settlement

- Trigger: Any hunt mission resolves through mission resolver.
- Input Dice: None at settlement stage.
- Resolution:
   1. On success: +credits, +1 renown, loot roll, faction delta gain/lose update.
   2. On failure: -1 renown, inverse faction pressure delta.
   3. Record completed mission entry with mission type, success flag, timestamps, and loot.
   4. Fire faction hook `onMissionResolved(mission, success)`.
- Consequence:
   1. Hunt outcomes alter economy, standing, and world pressure.
   2. Guild campaign and contract state machines advance or stall from same hook.
- Log Line format: `settlement:<missionId>:<success|failure>:renown:<delta>:credits:<delta>`

---

### VII. One-Page Reference Frame - Step 3 Hunt Sheet

> [REFERENCE SHEET: S3-A HUNT LOOP]

| Phase | Trigger | Input Dice | Resolution | Consequence | Log Line format |
|---|---|---|---|---|---|
| Board Generate | Open guild base or refresh | None | Build 3-row contract board | New bounty slate exists | `board-generated:<factionId>:<seed>` |
| Contract Post | Press `Post` | None | Create guild contract mission; apply active prep | Active contract mission id set | `contract-posted:<contractId>` |
| Campaign Post | Press `Post Campaign Quest` | None | Create campaign/boss mission from stage | Active campaign mission id set | `posted:<questId>` |
| Prep Toggle | Press `Set Prep` / `Unset` | None | Validate owned prep; max 3 active | Loadout snapshot changes | `prep-active:<prepId1|prepId2|prepId3>` |
| Confrontation | Enter Step 3 | Valor + bonus vs Dread | Compare totals; success/failure branch | Mission success path or failure modal | `check:<missionId>:<result>:action:<n>:dread:<n>` |
| Failure Accept | Choose failure | Margin from failed check | Apply damage/stress, mental, radiation, condition, teamwork | Attrition package applied | `fail-package:<missionId>:...` |
| Push Luck | Spend 2 Teamwork | Reroll at higher dread | Success flips to win; failure applies package | Salvage or collapse | `push-luck:<missionId>:...` |
| Contract Resolve | Mission resolves | Upstream success bool | Clear active contract; update runs/outcome | Board reopens; runs advance on success | `contract-completed|contract-failed:<id>` |
| Campaign Resolve | Mission resolves | Upstream success bool | Advance stage on success; stall on failure | Prep unlocks, boss gating progression | `completed|failed:<questId>` |

#### Read Aloud

> [READ ALOUD]
> "Name the prey. Mark the weakness. Spend the prep. Roll the confrontation. Pay the blood cost if you fail."

#### Margin Notes

> [SIDEBAR]
> If players ask whether a hunt failed "softly," answer from the failure package first. In this system, failure always writes attrition before mission-level penalties.

> [CODE-TRUTH NOTE]
> Guild state fields to track in campaign journals: `currentArcStage`, `activeCampaignMissionId`, `activeContractMissionId`, `completedQuestIds`, `earnedPrepOptions`, `activePrepIds`, `contractRuns`, `bossUnlocked`, `bossDefeated`, `lastOutcome`.
> Canonical runtime `lastOutcome` tokens: `joined`, `posted:<questId>`, `failed:<questId>`, `completed:<questId>`, `contract-posted:<contractId>`, `contract-completed:<contractId>`, `contract-failed:<contractId>`.

---

## STEP 4 - GATE WARS, PUZZLE ESCALATION, AND REALM PRESSURE (ZERO AMBIGUITY PASS)

This chapter codifies post-storyline Gate War operations, Heaven/Hell closure races, pinnacle teleporter unlocks, and consequence spread pressure.
Every rule block uses this schema:

- Trigger
- Input Dice
- Resolution
- Consequence
- Log Line format

> [BOXED CALLOUT]
> Step 4 journal token standard follows Step 3 grammar: lowercase event token + colon segments.
> Runtime-authentic state anchors: `closedHellscape`, `closedCelestial`, `pinnacleUnlocked`, `pinnacleBoss`, `pinnacleRetries`, `kickoutPending`, `portalAttempts`, `teleporterHexKey`, `teleporterTheme`.

> [CODE-TRUTH NOTE]
> Core Step 4 code path: `spawnRandomGateWarMissionEvent` -> Gate War mission resolve -> `maybeUnlockPinnacleMegadungeonFromGateWar` -> pinnacle teleporter assignment -> mission/world consequence propagation.

---

### I. Gate War Activation and Spawn Law

#### Rule Block S4-1: Gate War Eligibility Gate

- Trigger: Endgame mission spawner tick runs.
- Input Dice:
   1. Storyline state gate (post-ending or forced spawn).
   2. Spawn chance roll from seeded value (`<=24` out of 100 band).
   3. Day-stamp cadence check (`lastRollDayStamp` and `nextEligibleDayStamp`).
- Resolution:
   1. Abort if storyline not post-ending and not forced.
   2. Abort if a Gate War mission is already active.
   3. Abort if same day already rolled or next eligible day not reached.
   4. Roll seeded chance; spawn only in allowed band.
- Consequence: Gate War mission appears only on legal cadence and probability.
- Log Line format: `gate-war-roll:<dayStamp>:<spawn|no-spawn>`

#### Rule Block S4-2: Gate Side Selection

- Trigger: Gate War spawn is approved.
- Input Dice:
   1. Remaining closure gaps: `10-closedHellscape` and `10-closedCelestial`.
   2. Seeded tiebreak when both gaps equal.
- Resolution:
   1. Choose `hellscape` when Hell gap is larger.
   2. Choose `celestial` when Celestial gap is larger.
   3. If tied, break by deterministic seed parity.
- Consequence: Warfront side is selected for this operation.
- Log Line format: `gate-war-side:<hellscape|celestial>`

#### Rule Block S4-3: Create Gate War Mission Packet

- Trigger: Side is selected.
- Input Dice: None beyond prior selection.
- Resolution:
   1. Create mission type `gate_war`.
   2. Assign side-specific profile:
       - Celestial: 1 Angel (DD12, 24 HP), difficulty `very_hard`.
       - Hellscape: 3 Demons (DD4, 8 HP each), difficulty `hard`.
   3. Assign fixed step names:
       - Locate Warring Gate
       - Defeat Gate Hostiles
       - Solve Gate Seal Puzzle
   4. Write checkpoint line for 10-gate closure race unlock.
   5. Stamp gate icon and set next eligible day to +2.
- Consequence: Active Gate War mission enters mission board and map token flow.
- Log Line format: `gate-war-posted:<gateType>:<missionId>`

#### Read Aloud

> [READ ALOUD]
> "The sky has split into two verdicts. One is fire in chains. One is law with a blade. Pick which gate bleeds first."

---

### II. Puzzle Escalation Protocol

#### Rule Block S4-4: Side-Specific Seal Puzzle Directive

- Trigger: Step 3 of a Gate War mission begins (`Solve Gate Seal Puzzle`).
- Input Dice:
   1. Side selection (`hellscape` or `celestial`).
   2. Scene challenge roll(s) selected by table procedure.
- Resolution:
   1. Celestial directive: seal sigil lattice before reinforcement breach.
   2. Hellscape directive: collapse chain-runes before abyssal overflow.
   3. Resolve puzzle outcome per table method (shared puzzle frame or equivalent check flow).
- Consequence:
   1. Success closes one gate on selected side.
   2. Failure leaves closure race unchanged and raises failure pressure downstream.
- Log Line format: `gate-seal-attempt:<gateType>:<success|failure>`

#### Rule Block S4-5: Closure Counter Update

- Trigger: `gate_war` mission resolves successfully.
- Input Dice: Mission success boolean.
- Resolution:
   1. If side is `hellscape`, increment `closedHellscape` by 1.
   2. If side is `celestial`, increment `closedCelestial` by 1.
   3. Keep counters bounded to [0..10] in practice UI displays.
- Consequence: Closure race advances toward portal unlock threshold.
- Log Line format: `gate-closed:<gateType>:hell:<h>/10:cel:<c>/10`

#### Rule Block S4-6: Failure and Expiration Escalation

- Trigger: Gate War mission fails or expires.
- Input Dice: None at settlement stage.
- Resolution:
   1. Apply standard failed mission penalty flow.
   2. Emit world consequence packet with failure tags and pressure deltas.
   3. Allow future Gate War spawns by cadence gate.
- Consequence: Realm pressure increases without closure progress.
- Log Line format: `gate-war-failed:<missionId>`

---

### III. Pinnacle Teleporter Unlock Chain

#### Rule Block S4-7: Unlock Threshold Test

- Trigger: Gate closure counters change.
- Input Dice: Counter state only.
- Resolution:
   1. If both closure counters are below 10, abort unlock.
   2. If either side reaches 10 and no pinnacle is unlocked, continue.
   3. Determine theme from source side (`hellscape` => Mephisto, `celestial` => Azrael).
- Consequence: Unlock precondition passes and pinnacle mission generation starts.
- Log Line format: `pinnacle-threshold:<locked|ready>:hell:<h>:cel:<c>`

#### Rule Block S4-8: Spawn Pinnacle Megadungeon Mission

- Trigger: Unlock threshold test passes.
- Input Dice:
   1. Side theme (`hellscape` or `celestial`).
   2. Random map-theme pick from side-specific pools.
- Resolution:
   1. Create `pinnacle_megadungeon` mission at `Random Province Teleporter`.
   2. Assign boss:
       - Hellscape theme -> Mephisto
       - Celestial theme -> Azrael
   3. Set fixed checkpoint laws:
       - Opened by 10 side-closures.
       - Random province teleporter is active.
       - Boss profile d20/40 with two phases.
       - Failure eject resets both closure counters to 0/10.
   4. Set gate-war state flags:
       - `pinnacleUnlocked=true`
       - `pinnacleBoss=<boss>`
       - `kickoutPending=false`
       - `portalAttempts += 1`
       - `teleporterTheme=<gateType>`
- Consequence: Endgame teleporter operation is live and map-bound.
- Log Line format: `pinnacle-opened:<boss>:theme:<gateType>:attempt:<n>`

#### Rule Block S4-9: Teleporter Placement

- Trigger: Pinnacle mission token is assigned to province map.
- Input Dice: Random wilderness candidate selection.
- Resolution:
   1. Choose one province wilderness hex.
   2. Mark mission token type `pinnacle_portal`.
   3. Persist `pinnacleTeleporterHexKey` and mirror into gate state `teleporterHexKey`.
- Consequence: Exactly one live province teleporter entry point is exposed.
- Log Line format: `teleporter-bound:<hexKey>:theme:<gateType>`

---

### IV. Kickout, Retry, and Counter Reset Law

#### Rule Block S4-10: Pinnacle Failure Kickout

- Trigger: Pinnacle mission resolves as failure.
- Input Dice: Mission outcome boolean.
- Resolution:
   1. Increment `pinnacleRetries`.
   2. Set `kickoutPending=true`.
   3. Reset unlock state and boss binding.
   4. Reset both closure counters to 0.
   5. Clear teleporter bindings and mark run not cleared.
   6. Stamp `lastKickoutAt`.
- Consequence: Players are ejected and must rebuild one side from zero closures.
- Log Line format: `pinnacle-kickout:retry:<n>:hell:0:cel:0`

#### Rule Block S4-11: Pinnacle Success Finalization

- Trigger: Pinnacle mission resolves as success.
- Input Dice: Mission outcome boolean.
- Resolution:
   1. Mark `pinnacleCleared=true`.
   2. Clear `kickoutPending`.
   3. Clear live teleporter key for this run path.
- Consequence: Endgame portal arc is marked cleared for current progression state.
- Log Line format: `pinnacle-cleared:<boss>:attempt:<n>`

---

### V. Realm Pressure and Propagation Layer

#### Rule Block S4-12: Mission Consequence Emission

- Trigger: Any Gate War or related mission resolves (success, failure, expiration).
- Input Dice: None at emission stage.
- Resolution:
   1. Emit consequence entry with region, location key, severity, deltas, and tags.
   2. Success trend defaults: +stability, -scarcity, +witness, -factionHeat.
   3. Failure trend defaults: -stability, +scarcity, +rumor, -witness, +factionHeat.
   4. Expiration trend defaults: failure plus corruption pressure.
- Consequence: World-state feed and downstream propagation receive deterministic pressure data.
- Log Line format: `realm-consequence:<missionId>:<success|failure|expired>:sev:<level>`

#### Rule Block S4-13: World State Pressure Application

- Trigger: `recordWorldConsequence` receives event packet.
- Input Dice: None.
- Resolution:
   1. Update hex state safety/tension from deltas.
   2. Update faction region heat/control where faction id exists.
   3. Update economy scarcity and price multiplier.
   4. Append consequence feed entry.
   5. Add active crisis entries for high-severity or crisis-tagged events.
   6. Run propagation plan and inject rumor diffusion per spread event.
- Consequence: Realm pressure persists across map, economy, and faction layers.
- Log Line format: `world-pressure:<locationKey>:stability:<d>:scarcity:<d>:heat:<d>`

#### Rule Block S4-14: Autonomous Faction Turn Pressure

- Trigger: Faction turn simulator executes.
- Input Dice:
   1. Random faction pick from live faction set.
   2. Posture-weighted operation pick (`expand`, `retaliate`, `secure`, `destabilize`, `negotiate`, `weaken`).
- Resolution:
   1. Choose operation by posture.
   2. Choose operation-compatible province location.
   3. Emit world consequence packet with operation deltas and tags.
   4. For high-severity operations, emit warning notification.
- Consequence: Independent geopolitical pressure continues between player missions.
- Log Line format: `faction-op:<factionId>:<op>:<locationKey>`

---

### VI. One-Page Reference Frame - Step 4 Gate War Sheet

> [REFERENCE SHEET: S4-A GATE WAR LOOP]

| Phase | Trigger | Input Dice | Resolution | Consequence | Log Line format |
|---|---|---|---|---|---|
| Spawn Check | Endgame tick | Storyline gate + chance band + cadence | Decide spawn/no-spawn | Gate War may appear | `gate-war-roll:<day>:<result>` |
| Side Select | Spawn approved | Remaining closure gaps + tiebreak | Choose hellscape/celestial | Mission side locked | `gate-war-side:<type>` |
| Mission Post | Side locked | None | Create `gate_war` packet and +2 day cooldown | Active warfront mission | `gate-war-posted:<type>:<missionId>` |
| Seal Puzzle | Step 3 entered | Side directive + puzzle/check outcome | Resolve gate seal action | Closure gain or stall | `gate-seal-attempt:<type>:<result>` |
| Counter Update | Mission success | Success boolean | Increment side closure counter | Progress toward 10/10 | `gate-closed:<type>:hell:<h>:cel:<c>` |
| Threshold Test | Counter changed | Counter state | Check 10/10 side unlock | Portal unlock ready or locked | `pinnacle-threshold:<state>:hell:<h>:cel:<c>` |
| Pinnacle Open | Threshold ready | Side theme + map theme pick | Create `pinnacle_megadungeon` | Teleporter era begins | `pinnacle-opened:<boss>:theme:<type>:attempt:<n>` |
| Teleporter Bind | Portal token assignment | Random wilderness hex | Bind `teleporterHexKey` | One live province teleporter | `teleporter-bound:<hexKey>:theme:<type>` |
| Pinnacle Fail | Pinnacle mission fails | Mission outcome | Retry++, kickout, reset both counters | Rebuild from 0/10 | `pinnacle-kickout:retry:<n>:hell:0:cel:0` |
| Pinnacle Clear | Pinnacle mission wins | Mission outcome | Mark cleared and remove live teleporter | Arc completion state | `pinnacle-cleared:<boss>:attempt:<n>` |
| Realm Pressure | Any mission/faction event | Consequence packet | Apply map/faction/economy propagation | Persistent world escalation | `world-pressure:<locationKey>:...` |

#### Read Aloud

> [READ ALOUD]
> "Close ten gates on one side and the Province answers with a single door. Fail that door, and both heavens go dark again."

#### Margin Notes

> [SIDEBAR]
> Gate War is not only an encounter ladder. It is also a pressure engine: every miss alters scarcity, tension, and rumor spread.

> [CODE-TRUTH NOTE]
> Step 4 canonical state keys for table tracking: `closedHellscape`, `closedCelestial`, `pinnacleUnlocked`, `pinnacleBoss`, `pinnacleRetries`, `kickoutPending`, `pinnacleCleared`, `portalAttempts`, `teleporterHexKey`, `teleporterTheme`, `consequenceFeed`, `activeCrises`, `economy.scarcity`, `economy.priceMultiplier`.

---

## STEP 5 - COLOSSEUM ENDLESS CIRCUIT, SOUL FORGE PROGRESSION, AND AFFIX ECONOMY (ZERO AMBIGUITY PASS)

This chapter codifies the endgame arena loop, Soul Mission-to-Forge conversion, affix lifecycle economy, and tracker coupling.
Every rule block uses this schema:

- Trigger
- Input Dice
- Resolution
- Consequence
- Log Line format

> [BOXED CALLOUT]
> Step 5 journal token standard follows prior chapters: lowercase event token + colon segments.
> Runtime anchors: `endgame.colosseum.{lastRollDayStamp,nextEligibleDayStamp,counter,history,bestClearDie,clears}` and `soulForge.{unlocked,inventory,equipped,lastRewardAt}`.

> [CODE-TRUTH NOTE]
> Core Step 5 flow: random endgame sync -> post `colosseum_endless` / `soul_mission` -> resolve encounter -> update endgame state -> apply loot/affix economy through Soul Forge vendor.

---

### I. Colosseum Endless Circuit

#### Rule Block S5-1: Colosseum Spawn Eligibility

- Trigger: Endgame spawn sync evaluates Colosseum events.
- Input Dice:
   1. Storyline post-ending gate (unless forced spawn).
   2. Per-day cadence gate (`lastRollDayStamp`, `nextEligibleDayStamp`).
   3. Seeded chance roll (`<=30` on 0-99 band).
- Resolution:
   1. Abort if storyline is not post-ending and spawn is not forced.
   2. Abort if active unfinished `colosseum_endless` mission already exists.
   3. Abort if same day already rolled or cooldown day not reached.
   4. Roll seeded chance and spawn only in allowed band.
- Consequence: Colosseum contracts appear as periodic endgame broadcasts, not constant spam.
- Log Line format: `colosseum-roll:<dayStamp>:<spawn|no-spawn>`

#### Rule Block S5-2: Tier Die and Rank Assignment

- Trigger: Colosseum spawn passes eligibility.
- Input Dice: Seeded tier selection from `[d4,d6,d8,d10,d12,d20]`.
- Resolution:
   1. Select one tier die.
   2. Map die to rank and difficulty:
      - d4 Easy / `easy`
      - d6 Rising / `medium`
      - d8 Veteran / `hard`
      - d10 Brutal / `hard`
      - d12 Apex / `very_hard`
      - d20 Mythic / `impossible`
   3. Select enemy title, signature move, and unique reward string.
- Consequence: Arena contract tier has explicit threat rank and reward identity.
- Log Line format: `colosseum-tier:<missionId>:d<tierDie>:<rank>`

#### Rule Block S5-3: Post Colosseum Mission Packet

- Trigger: Tier and enemy profile are finalized.
- Input Dice: None beyond prior selections.
- Resolution:
   1. Create mission type `colosseum_endless`.
   2. Assign fixed step names:
      - Accept Arena Contract
      - Survive Wave Bracket
      - Defeat Arena Champion
   3. Write checkpoints including bracket die, champion move, and unique reward.
   4. Persist mission fields `colosseumTierDie`, `colosseumEnemyName`, `colosseumEnemySkill`, `colosseumUniqueReward`.
   5. Set next eligible day to `+3` and increment spawn counter.
- Consequence: Endless Sea receives a live arena contract with deterministic metadata.
- Log Line format: `colosseum-posted:<missionId>:d<tierDie>:reward:<tag>`

#### Rule Block S5-4: Colosseum Mission Resolution (Board Contract)

- Trigger: `colosseum_endless` mission resolves.
- Input Dice: Mission success boolean from confrontation flow.
- Resolution:
   1. On success:
      - Increment `clears`.
      - Update `bestClearDie = max(bestClearDie, mission tier die)`.
      - Push success record into `history` (trim to 12).
      - Add `colosseumUniqueReward` into mission loot packet.
   2. On failure:
      - Push failure record into `history` (trim to 12).
- Consequence: Arena progression preserves best-tier evidence and run ledger.
- Log Line format: `colosseum-resolve:<missionId>:<success|failure>:d<tierDie>`

#### Rule Block S5-5: Sea Hex Quick Bout Resolution

- Trigger: Players run direct Sea Colosseum bout from sea hex interaction.
- Input Dice:
   1. Action side: Valor die.
   2. Opposition side: `getSeaColosseumTierDie()` threshold from clears/best history.
- Resolution:
   1. Compute dynamic tier gate from progression:
      - d8 unlocked at best>=8 or clears>=3
      - d10 unlocked at best>=10 or clears>=5
      - d12 unlocked at best>=12 or clears>=8
      - d20 unlocked at best>=20 or clears>=12
      - otherwise d6 baseline
   2. Roll action vs dread.
   3. On success:
      - Credits reward = `50 + (tierDie * 15)`.
      - Increment clears and best die.
      - Roll one loot entry by difficulty derived from tier.
   4. Always append result into history (trim to 12).
- Consequence: Fast arena mode feeds same progression ledger as mission-board mode.
- Log Line format: `colosseum-bout:<hexKey>:d<tierDie>:<success|failure>:credits:<n>`

#### Read Aloud

> [READ ALOUD]
> "The sea ring remembers your best day and your worst one. It only honors the first if you survive enough of the second."

---

### II. Soul Mission to Forge Conversion

#### Rule Block S5-6: Soul Mission Spawn Eligibility

- Trigger: Endgame spawn sync evaluates Soul Mission events.
- Input Dice:
   1. Soul-offer gate (`shouldOfferSoulMission`) unless forced.
   2. Per-day cadence gate (`lastRollDayStamp`, `nextEligibleDayStamp`).
   3. Seeded chance roll with renown influence.
- Resolution:
   1. Abort when Soul-offer gate fails and spawn is not forced.
   2. Abort if unfinished `soul_mission` already exists.
   3. Abort for same-day duplicate roll.
   4. Roll seeded chance; threshold is looser after ending (`<=97`) than pre-ending (`<=92`).
   5. Restrict preferred spawn regions to Province/Sea when available.
- Consequence: Soul Mission cadence remains sparse, high-value, and endgame-weighted.
- Log Line format: `soul-roll:<dayStamp>:<spawn|no-spawn>`

#### Rule Block S5-7: Post Soul Mission Packet

- Trigger: Soul spawn passes eligibility.
- Input Dice: Seeded boss and icon pick from Soul pools.
- Resolution:
   1. Create mission type `soul_mission` with label `Soul Mission`.
   2. Assign fixed step names:
      - Track Soul Echo
      - Breach the Hollow Site
      - Take the Soul
   3. Persist `soulBoss`, `soulIcon`, and endgame lore lock.
   4. Emit notifications for map marker routing and challenge intent.
   5. Emit mission consequence entry tagged `soul-mission` and `endgame`.
- Consequence: A single soul target is published as forge progression content.
- Log Line format: `soul-posted:<missionId>:boss:<bossName>`

#### Rule Block S5-8: Soul Token Encounter Gate

- Trigger: Players interact with Soul token/site marker.
- Input Dice: None.
- Resolution:
   1. If Step 2 is incomplete, force Step 2 progression first.
   2. If Step 3 already completed, reject duplicate encounter.
   3. Otherwise open Soul Forge encounter modal with explicit fight profile.
- Consequence: Soul boss combat can only start from legal mission phase.
- Log Line format: `soul-token-open:<missionId>:<allowed|blocked>`

#### Rule Block S5-9: Soul Popup Combat Profile

- Trigger: Players press `Fight` from Soul encounter modal.
- Input Dice: Combat rolls inside arena engine.
- Resolution:
   1. Seed arena flow mode `soul` with mission binding.
   2. Force enemy profile to:
      - Dread d12
      - 24 HP / 24 max stress
      - Special action `Soul Rend`
   3. Open arena popup and run combat to hostile elimination.
   4. On unresolved hostiles, deny reward claim.
- Consequence: Soul rewards are gated behind completed popup boss kill.
- Log Line format: `soul-combat:<missionId>:<opened|blocked|won>`

#### Rule Block S5-10: Award Soul Affix Reward

- Trigger: Soul encounter resolves as victory and mission resolves success.
- Input Dice:
   1. Deterministic hash from mission id length, boss string length, and mission reward.
   2. Affix pool and tier pool indexing from hash.
- Resolution:
   1. Force `soulForge.unlocked=true`.
   2. Determine target slot (`weapon` or `armor`) by hash parity.
   3. Select affix name from Soul Forge pool.
   4. Select tier from weighted pool (`rare`, `legendary`, `mythic`).
   5. Set sale value by tier (`80/140/220`).
   6. Append affix entry to forge inventory with source boss and timestamp.
   7. Return reward label string and surface vendor UI.
- Consequence: Soul victory converts directly into persistent affix capital.
- Log Line format: `soul-affix-awarded:<missionId>:<affix>:<tier>:<target>`

---

### III. Soul Forge Vendor Economy

#### Rule Block S5-11: Forge State Normalization

- Trigger: Any Soul Forge operation opens vendor or mutates inventory.
- Input Dice: None.
- Resolution:
   1. Ensure forge schema exists:
      - `unlocked`
      - `inventory[]`
      - `equipped.weapon[]`
      - `equipped.armor[]`
      - `lastRewardAt`
   2. Normalize each inventory entry fields:
      - id, name, target, tier, sourceBoss, saleValue, equipped, slot
   3. Enforce minimum sale value floor 20.
- Consequence: Vendor operations remain safe across save migrations and partial data.
- Log Line format: `soulforge-normalize:entries:<count>`

#### Rule Block S5-12: Install and Remove Affix Operations

- Trigger: Player clicks install/remove in Soul Forge vendor.
- Input Dice: None.
- Resolution:
   1. Install validation:
      - Affix record must exist.
      - Slot must match affix target law (`weapon`, `armor`, or `either`).
      - Required equipment piece must be equipped.
   2. On install: set `equipped=true`, write `slot`, resync equipped arrays.
   3. On remove: set `equipped=false`, clear slot, resync arrays.
   4. Refresh vendor panels and combat stat displays after any success.
- Consequence: Affix buildouts can be changed live with immediate rules effect.
- Log Line format: `soulforge-install:<affixId>:<weapon|armor>|soulforge-remove:<affixId>`

#### Rule Block S5-13: Sell Affix for Credits

- Trigger: Player clicks `Sell` on an affix entry.
- Input Dice: None.
- Resolution:
   1. Validate affix record exists.
   2. Remove entry from inventory.
   3. Credit payout = entry `saleValue` (minimum 20).
   4. Add credits and refresh vendor/tracker UI.
- Consequence: Soul rewards can be converted into direct economy liquidity.
- Log Line format: `soulforge-sell:<affixId>:credits:<n>`

---

### IV. Progression Coupling and Runtime Surface

#### Rule Block S5-14: Endgame Tracker Surface Sync

- Trigger: Missions tab/endgame tracker renders.
- Input Dice: None.
- Resolution:
   1. Render Gate War seals, Colosseum clears/best die, Soul Forge unlock state.
   2. Render affix inventory count and active soul hunt count.
   3. Render operations card from recent endgame history.
- Consequence: Tables receive one-screen proof of cross-system endgame progression.
- Log Line format: `endgame-tracker-sync:col-clears:<n>:soul-affixes:<n>`

#### Rule Block S5-15: Endgame Daily Sync Loop

- Trigger: Mission init/load cycle runs spawn synchronizer.
- Input Dice: Day stamp plus seeded entropy.
- Resolution:
   1. Attempt Soul Mission spawn.
   2. Attempt Colosseum spawn.
   3. Attempt Gate War spawn.
   4. Return created mission list for this tick.
- Consequence: Step 4 and Step 5 systems co-propagate from one deterministic scheduler.
- Log Line format: `endgame-sync:<dayStamp>:created:<count>`

---

### V. One-Page Reference Frame - Step 5 Endgame Economy Sheet

> [REFERENCE SHEET: S5-A COLOSSEUM + SOUL FORGE LOOP]

| Phase | Trigger | Input Dice | Resolution | Consequence | Log Line format |
|---|---|---|---|---|---|
| Colosseum Roll | Endgame sync tick | Post-ending gate + cadence + chance | Decide arena spawn | Trial posted or skipped | `colosseum-roll:<day>:<result>` |
| Tier Assign | Spawn approved | Tier set `[d4..d20]` | Rank/difficulty/enemy/reward assigned | Bracket identity fixed | `colosseum-tier:<id>:d<tier>:<rank>` |
| Arena Resolve | Mission resolves | Success boolean | Update clears, best die, history, unique reward | Endless progression advances | `colosseum-resolve:<id>:<result>:d<tier>` |
| Sea Quick Bout | Sea hex challenge | Valor vs dynamic tier die | Win credits+loot or log loss | Same ledger progression | `colosseum-bout:<hex>:d<tier>:<result>` |
| Soul Roll | Endgame sync tick | Soul gate + cadence + chance | Decide soul spawn | Soul hunt posted or skipped | `soul-roll:<day>:<result>` |
| Soul Encounter | Token interact + fight | Popup combat d12/24 | Kill soul boss and resolve mission | Affix reward unlocks forge | `soul-combat:<id>:<state>` |
| Affix Award | Soul victory | Hashed affix/tier/target | Add affix entry; unlock forge | Persistent affix capital created | `soul-affix-awarded:<id>:<affix>:<tier>:<target>` |
| Install/Remove | Vendor click | Validation gates | Toggle equipped+slot, sync arrays | Live build tuning | `soulforge-install|soulforge-remove:<affixId>` |
| Sell | Vendor click | Sale value | Remove affix; add credits | Liquidity from soul stock | `soulforge-sell:<affixId>:credits:<n>` |
| Tracker Sync | UI render | None | Surface seals/clears/forge inventory | Unified endgame visibility | `endgame-tracker-sync:...` |

#### Read Aloud

> [READ ALOUD]
> "Win the ring for proof. Hunt the soul for power. Then decide if power belongs on your steel or on the market."

#### Margin Notes

> [SIDEBAR]
> Colosseum tracks endurance. Soul Forge tracks conversion. Together they define whether endgame momentum is combat-first or economy-first.

> [CODE-TRUTH NOTE]
> Canonical Step 5 keys to track in campaign journals: `endgame.colosseum.history`, `endgame.colosseum.bestClearDie`, `endgame.colosseum.clears`, `soulForge.unlocked`, `soulForge.inventory[]`, `soulForge.equipped.weapon[]`, `soulForge.equipped.armor[]`, `soulForge.lastRewardAt`.

---

## STEP 6 - SOLO CHALLENGE: 100 DAYS UNTIL THE OLD SUN DIES (ZERO AMBIGUITY PASS)

This chapter codifies solo challenge mode, New Sun day-pressure operations, solo oracle/console procedures, and solo save/recovery law.
Every rule block uses this schema:

- Trigger
- Input Dice
- Resolution
- Consequence
- Log Line format

> [BOXED CALLOUT]
> Step 6 journal token standard follows prior chapters: lowercase event token + colon segments.
> Runtime anchors: `solarCycle`, `soloGM`, and solo save envelope/checkpoint keys.

> [CODE-TRUTH NOTE]
> Core Step 6 runtime chain: toggle solo-only New Sun mode -> start 100-day run -> day advancement hooks into `advanceDay` and starship travel -> threshold/finale pressure -> Day 100 forced ending lock; in parallel, solo GM/oracle and save recovery tools remain available.

---

### I. Solo Challenge Enablement and Run Bootstrap

#### Rule Block S6-1: Solo-Only Mode Gate

- Trigger: Player attempts to enable New Sun Solo Challenge mode.
- Input Dice: None.
- Resolution:
   1. Read campaign connection state.
   2. If active campaign room/role exists and settings are not solo, deny enable.
   3. If solo context is legal, allow mode toggle.
- Consequence: New Sun run cannot be activated in active campaign context unless solo mode is explicitly honored.
- Log Line format: `new-sun-gate:<allowed|blocked>:campaign:<yes|no>`

#### Rule Block S6-2: Start New Sun Run

- Trigger: Solo story mode toggled ON, or explicit start command is issued.
- Input Dice:
   1. Arc seed pick from `relic`, `herald`, `loop` (random when auto-started).
   2. Current game date key for run stamp.
- Resolution:
   1. Set `storyModeEnabled=true` and `enabled=true`.
   2. Set `startDayKey` and reset day clock to `0/100`.
   3. Initialize key state blocks:
      - `worldTilt`, `prophecyTrack`, `resolvedMarkers`, `endingFlags`
      - `timeFracture` (charges/max/scars/rewinds)
      - `arcProgress` (stage state + marker state)
      - `questScheduler` and playstyle counters
   4. Seed omen/tier state and echo seed.
   5. Sync province markers, post next arc mission, and sync scheduler.
- Consequence: A fresh 100-day collapse run is live.
- Log Line format: `new-sun-start:<arc>:day:0:remaining:100`

#### Rule Block S6-3: Stop Run and Return to Legacy Flow

- Trigger: Player disables New Sun mode.
- Input Dice: None.
- Resolution:
   1. Set `enabled=false`.
   2. Clear pending markers and active marker bindings.
   3. Clear New Sun quest marker surfaces.
   4. Refresh map/storyline/new-sun panels.
- Consequence: Solo challenge pressure loop halts and legacy flow resumes.
- Log Line format: `new-sun-stop:state-cleared`

---

### II. Day Pressure Engine (100-Day Doom Clock)

#### Rule Block S6-4: Day Progress Hook

- Trigger: Day advances through calendar systems (`advanceDay` and starship travel day registration).
- Input Dice: Positive day delta.
- Resolution:
   1. Ignore if New Sun run is not active.
   2. Add day delta to `daysElapsed` with clamp to `[0..100]`.
   3. Compute `daysRemaining = 100 - daysElapsed`.
   4. Recompute `worldTilt` from day quartiles, then raise by paradox strain pressure when higher.
   5. Recompute tier band and current omen text.
   6. If rewinds were used, replace omen text with fracture marker text.
- Consequence: Every travel/time advancement pushes deterministic solo apocalypse pressure.
- Log Line format: `new-sun-day:<elapsed>:remaining:<left>:tier:<tier>`

#### Rule Block S6-5: Tier Band and Threshold Notifications

- Trigger: Day state updates after progression.
- Input Dice: Day count only.
- Resolution:
   1. Tier mapping:
      - `early`: Day 1-34
      - `mid`: Day 35-69
      - `late`: Day 70-89
      - `terminal`: Day 90-100
   2. Push threshold notice exactly once each at days `25`, `50`, `75`, `90`, `100`.
   3. Add prophecy log line when tier changes.
- Consequence: Omen cadence escalates on fixed milestones with no ambiguity.
- Log Line format: `new-sun-threshold:day:<n>:<info|warn>`

#### Rule Block S6-6: Day 100 Forced Finale Lock

- Trigger: `daysElapsed >= 100` during active run.
- Input Dice: None.
- Resolution:
   1. If finale already forced, do nothing.
   2. Set `endingFlags.forcedFinaleTriggered=true`.
   3. Emit Day 100 warning notification.
   4. Append prophecy line for auto-trigger source.
   5. Call ending resolver with force override.
- Consequence: Day 100 always hard-locks into ending resolution.
- Log Line format: `new-sun-finale-lock:day:100:auto`

#### Read Aloud

> [READ ALOUD]
> "The clock does not care what you meant to do tomorrow. On Day 100, intention expires."

---

### III. Arc Mission and Branch Control Law

#### Rule Block S6-7: Arc Mission Posting Gate

- Trigger: Player syncs/posts next New Sun arc mission.
- Input Dice: None.
- Resolution:
   1. Abort if run inactive.
   2. Sync completed arc missions into `arcProgress`.
   3. Abort when pending branch choice is unresolved.
   4. Abort when all stages are complete.
   5. If current stage mission already active, bind to active id and return it.
   6. Else create mission type `solar_cycle_arc` for current stage and mark posted.
- Consequence: Arc progression posts one legal stage at a time and enforces branch order.
- Log Line format: `new-sun-arc-posted:<stageId>:index:<n>`

#### Rule Block S6-8: Branch Choice Resolution

- Trigger: Player picks branch choice on pending branch point.
- Input Dice: None.
- Resolution:
   1. Validate branch id and choice id.
   2. Reject out-of-sequence branch resolution.
   3. Persist choice in `arcProgress.branchChoices`.
   4. Apply deltas:
      - `worldTiltDelta`
      - paradox strain delta
      - optional Teamwork meter delta
      - prophecy insertion
   5. Emit world consequence packet tied to branch route.
   6. Stamp irreversible tags for canonical branch outcomes.
- Consequence: Branch decisions permanently alter pressure vectors and ending math.
- Log Line format: `new-sun-branch:<branchId>:choice:<choiceId>`

#### Rule Block S6-9: Ending Resolution Gate and Override

- Trigger: Player resolves ending or forced finale state executes.
- Input Dice: None.
- Resolution:
   1. Allow resolution only if:
      - all stages complete, or
      - forced finale lock is active.
   2. If branch is pending and no deadline override, block resolution.
   3. If Day 100/forced override exists, lock pending branch and continue.
   4. Choose ending key from current profile and apply ending rewards.
   5. Mark run ended (`enabled=false`) and persist finale fields.
- Consequence: Endings cannot be claimed early, but Day 100 always breaks deadlocks.
- Log Line format: `new-sun-ending:<endingKey>:forced:<yes|no>`

---

### IV. Time Fracture (Limited Rewind with Persistent Scars)

#### Rule Block S6-10: Rewind Eligibility Gate

- Trigger: Player invokes Time Fracture.
- Input Dice: None.
- Resolution:
   1. Reject if no active New Sun run.
   2. Reject if fracture charges are `<=0`.
   3. Reject if elapsed days are below 7.
   4. Enforce fixed rewind option: full 7 days only.
- Consequence: Rewind is a scarce, constrained emergency tool.
- Log Line format: `fracture-gate:<allowed|blocked>:charges:<n>:day:<d>`

#### Rule Block S6-11: Rewind Execution and Scar Persistence

- Trigger: Rewind gate passes.
- Input Dice: None.
- Resolution:
   1. Rewind calendar state by 7 days (clamped).
   2. Decrement fracture charges; increment rewinds used.
   3. Add paradox scars:
      - `paradoxStrain += 7`
      - `lastRewindDays = 7`
      - `tmwBurnTotal += 1`
      - rotate fracture echo arc marker
   4. Consume 1 Teamwork meter.
   5. Increment storyline paradox marks.
   6. Seed pending echo marker for near-future day.
   7. Resync markers/UI and stamp irreversible tag `fracture_used`.
- Consequence: Rewind reopens time but never removes meta-cost.
- Log Line format: `fracture-used:rewind:7:strain:<n>:charges:<n>`

---

### V. Solo GM Console and Oracle Procedures

#### Rule Block S6-12: Solo GM Console Loop

- Trigger: Player opens Solo GM console.
- Input Dice:
   1. Choice risk check gate (risky choice or forced risky cadence).
   2. Stat die vs dynamic dread for risky choice.
- Resolution:
   1. Maintain loop state: arc beat, objective, tab visit counters.
   2. On risky choice: roll selected stat die vs dread `6 + floor(weirdness/2)` (capped by implementation math).
   3. On success: increase rumor/weirdness track and advance beat.
   4. On failure: apply failure consequence package and increase heat.
   5. Rotate arc every five interactions.
- Consequence: Solo play gets deterministic micro-scene generation with escalating tone.
- Log Line format: `solo-gm-choice:<choiceId>:<success|failure>:weird:<n>:heat:<n>`

#### Rule Block S6-13: Objective Completion and Reward

- Trigger: Solo GM objective check resolves as complete.
- Input Dice: None.
- Resolution:
   1. Validate objective from runtime counters/tab states.
   2. Grant reward package:
      - Credits `25 + (weirdness*5)`
      - +1 renown
   3. Rotate objective.
   4. Every fourth interaction threshold, allow arc rotation behavior.
- Consequence: Solo objective loop gives steady economy/renown pressure relief.
- Log Line format: `solo-objective-complete:<objectiveId>:credits:<n>:renown:+1`

#### Rule Block S6-14: Oracle Query Procedure

- Trigger: Player runs oracle action (`yesno`, `twist`, `prompt`, `pressure`, `consequence`).
- Input Dice: d6 tables (single or paired depending on oracle type).
- Resolution:
   1. Roll on selected oracle table.
   2. Persist last question, kind, and result.
   3. Push result into oracle history (max 8 records).
   4. Re-render oracle panel with current and recent outputs.
- Consequence: Solo adjudication prompts stay consistent and replayable.
- Log Line format: `solo-oracle:<kind>:roll:<d6...>:result:<token>`

---

### VI. Solo Save, Checkpoint, and Recovery Law

#### Rule Block S6-15: Save Envelope + Checkpoint Write

- Trigger: Player executes save command.
- Input Dice: None.
- Resolution:
   1. Sync character state from current fields.
   2. Build save envelope with schema/checksum/data.
   3. Detach large media payloads into media envelope key.
   4. Write primary save and backup mirror.
   5. Write rotating checkpoint history (up to configured limit).
   6. Stamp last-loaded checksum for dirty-state detection.
- Consequence: Solo progression has integrity checks with rolling recovery points.
- Log Line format: `solo-save:primary:ok:checkpoint:<ok|warn>`

#### Rule Block S6-16: Load Fallback and Recovery Center

- Trigger: Player executes load or recovery action.
- Input Dice: None.
- Resolution:
   1. Attempt primary envelope and checksum validation.
   2. If invalid, quarantine corrupt payload and load backup.
   3. Expose checkpoint slot restore options and backup promotion.
   4. Support import/export envelope flow with integrity checks.
   5. Save health panel reports primary/backup/checkpoint validity and timestamps.
- Consequence: Corruption or bad imports fail safely with operational recovery tools.
- Log Line format: `solo-load:<primary|backup|checkpoint|import>:<success|fail>`

---

### VII. One-Page Reference Frame - Step 6 Solo Challenge Sheet

> [REFERENCE SHEET: S6-A SOLO CHALLENGE + 100-DAY CLOCK]

| Phase | Trigger | Input Dice | Resolution | Consequence | Log Line format |
|---|---|---|---|---|---|
| Mode Gate | Toggle New Sun | Campaign/solo state | Allow or block solo challenge | Valid solo-only activation | `new-sun-gate:<state>` |
| Run Start | Enable New Sun | Arc seed + day key | Initialize run state blocks | 100-day run begins | `new-sun-start:<arc>:day:0` |
| Day Tick | `advanceDay`/travel days | Day delta | Update elapsed/remaining/tier/omen | Doom clock advances | `new-sun-day:<d>:remaining:<r>` |
| Threshold Hit | Day >= 25/50/75/90/100 | Day count | One-time threshold notice and prophecy updates | Escalation warnings | `new-sun-threshold:day:<n>` |
| Day 100 Lock | Day reaches 100 | None | Force finale trigger and resolve ending | No further delay possible | `new-sun-finale-lock:day:100` |
| Arc Post | Sync marker mission | None | Post next legal stage mission | Arc route continues | `new-sun-arc-posted:<stageId>` |
| Branch Choice | Branch selection | None | Persist choice + apply deltas + tags | Route and ending weights shift | `new-sun-branch:<id>:choice:<id>` |
| Time Fracture | Rewind request | Eligibility gates | Rewind 7 days + add paradox scars | Limited redo with permanent cost | `fracture-used:rewind:7:...` |
| Solo GM Loop | Console choice | Stat die vs dynamic dread | Resolve beat success/failure | Rumor/heat/weirdness evolve | `solo-gm-choice:<id>:<result>` |
| Oracle Pull | Oracle action | d6 table roll(s) | Produce/adopt oracle prompt | Deterministic solo adjudication | `solo-oracle:<kind>:...` |
| Save Recovery | Save/load/recovery action | None | Envelope checks, backup fallback, checkpoints | Integrity-preserving persistence | `solo-save|solo-load:...` |

#### Read Aloud

> [READ ALOUD]
> "You are not racing to victory. You are racing a dying sky, a fragile ledger, and the parts of yourself that remember other timelines."

#### Margin Notes

> [SIDEBAR]
> Step 6 has two linked loops: narrative pressure (100-day New Sun) and operator reliability (save/checkpoint/recovery discipline). Ignoring either one shortens the run.

> [CODE-TRUTH NOTE]
> Canonical Step 6 keys for campaign journals: `solarCycle.storyModeEnabled`, `solarCycle.enabled`, `solarCycle.daysElapsed`, `solarCycle.daysRemaining`, `solarCycle.worldTilt`, `solarCycle.currentTier`, `solarCycle.currentOmen`, `solarCycle.thresholdNotifs[]`, `solarCycle.endingFlags`, `solarCycle.timeFracture`, `solarCycle.arcProgress`, `solarCycle.questScheduler`, `soloGM.*`, and solo save envelope/checkpoint metadata keys.

