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
- Log Line format: `contract-board-generated:<factionId>:<seed>`

#### Rule Block S3-2: Refresh Contract Board

- Trigger: Players press `Refresh Board` in guild contract UI.
- Input Dice: None.
- Resolution: Force board regeneration regardless of existing rows.
- Consequence: Available prey contracts rotate; unposted rows are lost.
- Log Line format: `contract-board-refreshed:<factionId>`

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
- Log Line format: `prep-unlocked:<factionId>:<prepId>`

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
- Log Line format: `prep-active:<factionId>:[prepId1,prepId2,prepId3]`

#### Rule Block S3-9: Apply Prep to Posted Hunt

- Trigger: A guild contract or campaign quest is posted while active prep ids exist.
- Input Dice: None.
- Resolution:
   1. For each prep with `effectType='bonus'`, add prep bonus to mission `bonus`.
   2. For each prep with `effectType='dread_down'`, step mission dread die downward by configured steps.
   3. Clamp mission bonus to [0..20] and dread floor to d4.
- Consequence: Hunt confrontation math is materially changed before first roll.
- Log Line format: `prep-applied:<missionId>:bonus+<n>:dread->d<die>`

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
- Log Line format: `hunt-check:<missionId>:A<actionPlusBonus>-D<dread>=<success|failure>`

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
- Log Line format: `hunt-fail-consequence:<missionId>:margin<k>:mental+1:rad+1:cond=<key>:tmw+1`

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
- Log Line format: `hunt-push-luck:<missionId>:spent2tmw:d<newDread>:<success|failure>`

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
- Log Line format: `boss-layer:<missionId>:locked=[abilityId...]`

#### Rule Block S3-14: Boss Lock Mitigation in Failure Math

- Trigger: Failure consequence package executes for boss-hunt mission with locked abilities.
- Input Dice: Margin from failed confrontation.
- Resolution:
   1. Reduce margin by up to 2 based on lock count.
   2. Suppress Mental Stress line when specific locked ability ids match mitigation map.
   3. Suppress Condition line when specific locked ability ids match mitigation map.
- Consequence: Proper weakness prep converts lethal boss attrition into survivable failure.
- Log Line format: `boss-mitigation:<missionId>:margin-<n>:suppress=[mental|condition|none]`

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
- Log Line format: `hunt-settlement:<missionId>:<success|failure>:renown<delta>:credits<delta>`

---

### VII. One-Page Reference Frame - Step 3 Hunt Sheet

> [REFERENCE SHEET: S3-A HUNT LOOP]

| Phase | Trigger | Input Dice | Resolution | Consequence | Log Line format |
|---|---|---|---|---|---|
| Board Generate | Open guild base or refresh | None | Build 3-row contract board | New bounty slate exists | `contract-board-generated:<factionId>:<seed>` |
| Contract Post | Press `Post` | None | Create guild contract mission; apply active prep | Active contract mission id set | `contract-posted:<contractId>` |
| Campaign Post | Press `Post Campaign Quest` | None | Create campaign/boss mission from stage | Active campaign mission id set | `posted:<questId>` |
| Prep Toggle | Press `Set Prep` / `Unset` | None | Validate owned prep; max 3 active | Loadout snapshot changes | `prep-active:<factionId>:[...]` |
| Confrontation | Enter Step 3 | Valor + bonus vs Dread | Compare totals; success/failure branch | Mission success path or failure modal | `hunt-check:<missionId>:A-D=<result>` |
| Failure Accept | Choose failure | Margin from failed check | Apply damage/stress, mental, radiation, condition, teamwork | Attrition package applied | `hunt-fail-consequence:<missionId>:...` |
| Push Luck | Spend 2 Teamwork | Reroll at higher dread | Success flips to win; failure applies package | Salvage or collapse | `hunt-push-luck:<missionId>:...` |
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

