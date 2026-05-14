# Arcboard One-Page Design Spec

## 1) Product Intent
Arcboard is a fast tactical skirmish minigame ("magic chess" feel) that uses existing Beyond mechanics:
- Action Die vs Dread Die resolution
- AP economy
- Advantage and flat modifiers
- Affix and flavor effects

Target session length: 8 to 15 minutes.
Mode: solo first, campaign-ready by reusing campaign shared patch patterns.

## 2) Core Match Loop
1. Draft loadout (2 Affix Runes + 1 Tactic Rune).
2. Spawn 4 units per side on a 7x7 hex board.
3. Alternate turns by side. On your side turn, each living unit acts once.
4. Spend AP to Move, Strike, Shoot, Cast, Guard, or Channel.
5. Win by either:
   - Capturing 2 of 3 Arc Nodes for 2 rounds, or
   - Defeating enemy Archon.

## 3) Exact Dice Math
Use existing roller helpers:
- explodingRoll(die, meta)
- rollWithAdvantage(baseDie, advDiceArr, meta)

### 3.1 Action Check
For every offensive or control action:
A = rollWithAdvantage(actionDie, advantageDice).total
D = explodingRoll(targetDreadDie).total
finalA = max(0, A + flatBonus + addDiceTotal - radPenalty)
Success if finalA >= D
Margin M = max(1, abs(finalA - D))

### 3.2 Damage
On success:
baseDamage = 1 + floor(M / 3)
critBonus = exploded ? 1 : 0
affixBonusDamage = sum(active rune bonuses)
finalDamage = max(1, baseDamage + critBonus + affixBonusDamage)

### 3.3 Node Capture Check
When a unit is on an Arc Node at end of side turn:
nodeAction = explodingRoll(unit.controlDie).total
nodeDread = explodingRoll(6).total
Capture progress +1 if nodeAction >= nodeDread
Lose 1 progress if failed while contested
Node locks at progress 3

### 3.4 Guard Reaction
When a guarding unit is attacked:
guardA = rollWithAdvantage(defendDie, guardAdvDice).total
guardD = explodingRoll(incomingAttackDie).total
If guardA >= guardD, reduce incoming damage by 2 (min 0)

## 4) AP Flow
Per unit each round:
- Base AP = 2
- Light chassis = +1 AP
- Heavy chassis = -1 AP (min 1)
- Swift rune = +1 AP once per round

Action costs:
- Move 1 hex: 1 AP
- Strike (range 1): 1 AP
- Shoot (range up to 3): 1 AP
- Cast (range up to 2): 2 AP
- Guard: 1 AP
- Channel node: 1 AP

Turn rules:
- Side turn ends when all friendly units have either acted or have 0 AP.
- At round start, AP resets and one-turn buffs clear.

## 5) UI Panel Layout (Plug-in Ready)
Mount under tab-minigames and modal usage patterns already in repo.

### 5.1 Main Arcboard Panel
Container ID:
- arcboardRoot

Header row:
- arcboardRound
- arcboardTurnSide
- arcboardVictoryTrack

Board + side panels:
- Left: arcboardUnitListAlly
- Center: arcboardHexBoard
- Right: arcboardUnitListEnemy

Bottom action strip:
- arcboardSelectedUnit
- arcboardActionSelect
- arcboardTargetSelect
- arcboardExecuteBtn
- arcboardEndTurnBtn

Log and hints:
- arcboardLog
- arcboardRuleHint

### 5.2 Setup Modal
Use openModal:
- Title: Arcboard Loadout
- Body IDs:
  - arcboardRuneSelectA
  - arcboardRuneSelectB
  - arcboardTacticSelect
  - arcboardStartBtn

## 6) State Shape
Store under S.holding.minigames.arcboard

Recommended schema:
- mode: "solo" | "campaign"
- active: boolean
- round: number
- turnSide: "ally" | "enemy"
- selectedUnitId: string
- board: { radius: 3, hexes: { "q,r": { terrain, nodeId, blocked } } }
- allies: [ { id, name, hp, maxHp, ap, maxAp, actionDie, defendDie, controlDie, position, flags } ]
- enemies: [ same shape ]
- nodeControl: { A: { owner, progress }, B: { owner, progress }, C: { owner, progress } }
- runes: { affixA, affixB, tactic }
- log: string[]
- result: null | { winner, reason }

## 7) Integration Hooks
Implement these globals in new-features.js style:
- ensureArcboardState()
- openArcboardSetup()
- startArcboardMatch(config)
- renderArcboardUI()
- arcboardExecuteAction()
- arcboardEndSideTurn()
- resetArcboardMatch()

Reuse existing helpers where possible:
- getEquippedAffixCombatBonuses
- rollWithAdvantage
- explodingRoll
- isManualRollModeEnabled
- showDccSuccessOutcome / showDccFailureOutcome

## 8) Balance Defaults (v1)
- Unit HP: 8
- Unit actionDie: d8
- Unit defendDie: d6
- Unit controlDie: d6
- Archon HP: 14
- Enemy AI: nearest valid target, prefer node contest if behind on nodes

## 9) Acceptance Criteria
- Average solo match completes in <= 15 minutes.
- No dead-turns: each side has at least one AP spend option every round.
- Manual Roll Mode works for all offensive and node checks.
- Match state survives save/load and tab switch.
