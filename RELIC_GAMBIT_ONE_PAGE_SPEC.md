# Relic Gambit One-Page Design Spec

## 1) Product Intent
Relic Gambit is a lane-control tactical card minigame using existing Beyond roll logic.
It plays like a compact strategy duel with Action economy, Dread checks, and Affix synergies.

Target session length: 10 to 18 minutes.
Format: 1v1 PvE first, then campaign PvP.

## 2) Core Match Loop
1. Both sides start with 20 Nexus HP and 3 lanes.
2. Each round has 3 phases:
   - Draw phase
   - Command phase (play relics, cast lane actions)
   - Clash phase (lane checks resolve)
3. Reduce enemy Nexus to 0 or lead on score when round limit is reached.

## 3) Exact Dice Math
All lane clashes use Action vs Dread check math.

### 3.1 Lane Clash Roll
For each occupied lane:
A = rollWithAdvantage(laneActionDie, laneAdvDice).total
D = explodingRoll(laneDreadDie).total
Afinal = max(0, A + laneFlat + relicFlat + laneAddDice)
Success if Afinal >= D
Margin M = max(1, abs(Afinal - D))

### 3.2 Nexus Damage on Clash Win
If clash success:
laneDamage = 1 + floor(M / 2)
if critExplode then laneDamage += 1
if lane has "Pierce" tag then ignore first enemy guard point
Apply damage to enemy lane guard first, then Nexus

### 3.3 Relic Cast Check
For spell-like relics:
CastA = explodingRoll(casterControlDie).total + castFlat
CastD = explodingRoll(spellDreadDie).total
if CastA >= CastD, effect applies
else effect fizzles and gain +1 Teamwork (solo mode)

### 3.4 Resource Dice
Command Points (CP) per round:
baseCP = 3
bonusCP = floor(explodingRoll(6).total / 6)
roundCP = min(6, baseCP + bonusCP + cpModifiers)

## 4) AP / CP Flow
Relic Gambit uses CP as AP equivalent.

Round sequence:
1. Set CP = roundCP
2. Draw 1 card (or 2 if behind by >= 5 Nexus HP)
3. Spend CP during Command phase
4. Resolve all lanes in Clash phase
5. End round and clear temporary buffs

Costs:
- Play Unit Relic: 1 to 3 CP
- Play Guard Relic: 1 CP
- Play Spell Relic: 2 CP
- Shift lane focus token: 1 CP
- Mulligan 1 card: 1 CP (once per round)

## 5) UI Panel Layout (Plug-in Ready)
Mount in tab-minigames with the same panel pattern as current minigame UIs.

### 5.1 Main Relic Gambit Panel
Container ID:
- relicGambitRoot

Top HUD:
- relicGambitRound
- relicGambitCP
- relicGambitNexusAlly
- relicGambitNexusEnemy

Lane board:
- relicLaneTopA, relicLaneTopB, relicLaneTopC
- relicLaneBottomA, relicLaneBottomB, relicLaneBottomC
- relicLaneResolvePreview

Hand + controls:
- relicHandPanel
- relicSelectedCard
- relicTargetLaneSelect
- relicPlayCardBtn
- relicEndCommandBtn

Right rail:
- relicDeckCount
- relicDiscardCount
- relicStatusEffects
- relicCombatLog

### 5.2 Setup Modal
Use openModal:
- Title: Relic Gambit Draft
- Body IDs:
  - relicDraftAffixA
  - relicDraftAffixB
  - relicDraftDeckPreset
  - relicDraftStartBtn

## 6) State Shape
Store under S.holding.minigames.relicGambit

Schema:
- active: boolean
- mode: "solo" | "campaign"
- round: number
- phase: "draw" | "command" | "clash"
- cp: number
- nexus: { ally: number, enemy: number }
- decks: { ally: card[], enemy: card[] }
- hands: { ally: card[], enemy: card[] }
- discard: { ally: card[], enemy: card[] }
- lanes: {
    A: { ally: laneState, enemy: laneState },
    B: { ally: laneState, enemy: laneState },
    C: { ally: laneState, enemy: laneState }
  }
- runes: { affixA, affixB }
- log: string[]
- result: null | { winner, reason }

laneState:
- unitCardId
- guard
- actionDie
- dreadDie
- advDice: number[]
- flatBonus
- tags: string[]

## 7) Integration Hooks
Implement globals aligned with existing architecture:
- ensureRelicGambitState()
- openRelicGambitDraft()
- startRelicGambitMatch(config)
- renderRelicGambitUI()
- relicGambitPlayCard()
- relicGambitResolveClashPhase()
- relicGambitAdvanceRound()

Reuse existing systems:
- explodingRoll
- rollWithAdvantage
- addTMWOnFail (optional solo fallback)
- getEquippedAffixCombatBonuses (for draft rune translation)
- showNotif, openModal, closeModal

## 8) Deck and Card Defaults (v1)
- Deck size: 20
- Starting hand: 4
- Max hand: 7
- Round cap: 12
- Card rarity weights: Common 65%, Rare 25%, Mythic 10%

Starter archetypes:
- Ember Battery: strong spells, weaker guards
- Iron Choir: high guard, slow burst
- Hollow Circuit: high advantage generation

## 9) Acceptance Criteria
- Match resolves in <= 18 minutes average.
- Every round offers >= 2 viable command choices.
- Clash math logs are visible and auditable in panel log.
- Manual Roll Mode can override lane clash totals.
- Save/load restores hand, deck, lanes, CP, and phase safely.
