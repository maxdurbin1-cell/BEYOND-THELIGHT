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

Purpose:

- What players need in front of them during the run.

1. Core comparison rule: Action >= Dread succeeds.
2. Main objective: close 5 portals before Day 3.
3. Boss ladder: d8/16 -> d10/20 -> d20/40.
4. Weakened final boss after portal objective: d12/24.
5. Gate sealing gives progress and forced reposition.
6. Random encounter table is dangerous, not flavor-only.
7. Preserve flasks and action economy for Day 2 and Day 3 spikes.

Player decision hierarchy:

1. Can we close this portal safely now?
2. If no, can we improve position with a gate action?
3. If no, do we take controlled attrition to avoid catastrophic attrition?

---

### Reference Sheet B - GM Raid Operations

Purpose:

- Exact operations order and ruling defaults.

Pre-run checklist:

1. Seed map and features.
2. Set counters (portals 0/5, gates 0, flasks 3/7).
3. Seed mini bosses.
4. Assign raid lord.

During-run checklist:

1. Maintain day/phase state.
2. Apply weather/peril/barrier checks exactly.
3. Resolve portal fights before portal puzzles.
4. Update objective counters immediately after closure.
5. Recompute raid boss weakened state after each portal closure.

Post-run checklist:

1. Record run result.
2. Award +3 Raid Points on raid boss clear.
3. Log named loot outcomes.

---

### Reference Sheet C - Dread vs Action Matrix

Purpose:

- Fast lookup for what die is rolled against what DD in Step 1 systems.

| Situation | Action Die | Dread Die | Failure Consequence |
|---|---|---|---|
| Rough weather check | Lead | DD6 | Mental Stress by difference |
| Peril hex save | Control | DD4 | Mental Stress + pressure tick |
| Random peril event | Control | DD6 | Damage/stress by difference |
| Barrier crossing | Body | DD6 | Blocked crossing + pressure tick |
| Valor/radiation encounter | Spirit (Valor context) | DD6 | Radiation by difference |
| Portal fallback puzzle | Mind | DD8 | Portal backlash and pressure |
| Combat strike lane | Strike/Shoot/etc. | Enemy Dread profile | Stress/HP loss, status pressure |

> [PRINTER NOTE]
> Freeze this table width to one page. If needed, abbreviate the last row to "Combat lane" for narrow formats.

Notes:

- Use action totals after all valid bonuses/penalties.
- Tie is success.
- Margin drives severity in many outcomes.

---

### Reference Sheet D - Encounter Tables Packet

Purpose:

- One source for all random and profile tables in Step 1.

#### d9 Random Encounter Table

| d9 | Encounter |
|---|---|
| 1 | Weather event |
| 2 | Peril event |
| 3 | Barrier event |
| 4 | Roaming enemy pack |
| 5 | Loot cache |
| 6 | Roaming mini boss |
| 7 | Roaming merchant |
| 8 | Radiation surge |
| 9 | Portal surge teleport |

#### Field Enemy Table

| d4 | Field Enemy |
|---|---|
| 1 | Mire Hound |
| 2 | Lantern Wretch |
| 3 | Ash Drifter |
| 4 | Bone Orchard Stalker |

#### Mini Boss Table

| d4 | Mini Boss |
|---|---|
| 1 | Gallow-Archivist |
| 2 | Salt Widow |
| 3 | Basilica Warden |
| 4 | Hollow Harbormaster |

#### Portal Guard Table

| d2 | Portal Guard |
|---|---|
| 1 | Portal Thrall |
| 2 | Rift Whelp |

#### Raid Lord Table

| d6 | Raid Lord |
|---|---|
| 1 | Azrael |
| 2 | Mephisto |
| 3 | The Hollow Saint |
| 4 | The Bone Regent |
| 5 | The Blackened Throne |
| 6 | The Rift Shepherd |

---

### Reference Sheet E - Loot and Affix Packet

Purpose:

- Clarify loot generation and trophy expectations.

Boss loot behavior:

- Boss-type victories prioritize weapons/armor categories.
- Affix always appended.

Affix table:

1. Ashbound
2. Moonchained
3. Thornwake
4. Hollowglass
5. Dreadforged
6. Graven
7. Saltfire
8. Umbral

Utility modifier rule:

- 35% chance on eligible utility items to add [AD+1]

Examples:

- Dreadforged Blade [Ashbound]
- Reliquary Mail [Hollowglass]
- Cauterize Scroll [AD+1]

---

### Reference Sheet F - Raid Turn Script (At-Table Read Aloud)

Use this script to keep pacing brutal and clear.

> [READ ALOUD]
> 1. "State objective and current counters."
> 2. "Declare route and why."
> 3. "Resolve movement checks and environmental checks."
> 4. "Resolve encounter if triggered."
> 5. "If portal: fight, then puzzle, then update counters."
> 6. "Log attrition and loot openly."
> 7. "Advance to next decision point immediately."

If table stalls, ask:

> [READ ALOUD]
> "What are you protecting right now: the run, the objective, or yourselves?"

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

