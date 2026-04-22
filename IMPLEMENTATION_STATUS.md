# Implementation Status - Event & Equipment Systems Update

**Session**: Comprehensive event system overhaul + equipment/backpack enhancements  
**Commits**: 415d5e3, efdd605, e489747, plus this final update

## Completed ✓

### Event System Refactor
- [x] Event mysteries changed from 3/3 progress track to 6-mystery completion model
- [x] Dread die tracking persists across wilderness hexes/leads
- [x] Mystery roll history stored per event (stat, success/failure, roll values)
- [x] Failure threshold: 4+ defeats = no event reward (even on 6 mystery completion)
- [x] Progress calculation: `getEventMysteryProgress(eventHex)` returns {completed, failures}
- [x] UI updated to show "Mysteries 3/6 solved · Defeats 2"

### Stat-Based Approach System
- [x] Eight stat options implemented: body, mind, control, lead, spirit, strike, shoot, defend
- [x] `getApproachForStat(stat)` maps stats to approach types (Power, Intellect, Combat, etc.)
- [x] `getStatOptionsForMystery()` provides dropdown options with descriptions
- [x] Event mystery rolls use selected stat, not generic approaches
- [x] Dread scaling: success lowers dread (d6→d4), failure raises (d6→d8)

### Combat Enemy Generation
- [x] `generateEventCombatEnemies(dreadDie)` creates 1-4 enemies
- [x] Enemy health = 2 × Dread Die value
- [x] Enemy templates: Corrupted Scout, Twisted Guard, Warped Sentinel, Blight Manifestation
- [x] Format ready for UI display: enemies with "Dread D8 | 16 Stress" health
- **Still needs**: UI integration in event hex panel when combat stat selected

### Backpack & Equipment
- [x] `equipBackpackItem(index, slot)` equips items to weapon1/weapon2/armor/readied
- [x] Equip buttons added to backpack item modals (? buttons)
- [x] Equipment slots auto-populate in Character Tab
- [x] `getStatModifiers(stat)` calculates total bonuses from equipped items
- [x] Modifier tracking: extracts +N from weapon/armor descriptions, detects Hood adventure die
- [x] `formatStatWithModifiers(stat, shortForm)` formats stat names with mod sources
- **Still needs**: Display modifiers in Quick Panel rolls and Event stat choices

### Merchant & Special Hexes Support
- [x] `generateMerchantCaravan()` creates 4-10 random shop items
- [x] `generateBlackMarketHacks()` selects 1-2 Master Hacks from service category
- **Still needs**: Hex integration, UI popups, purchase flow

### Thievery System
- [x] `attemptThievery(targetName)` implements Control D12 vs Player Die roll
- [x] Adventure Die bonus: Hoods grant +d6 roll  
- [x] Success: steal item to backpack with notification
- [x] Failure: +1 TMW (Terror, Misery, Worry), escape check triggers
- [x] Track in Quick Notes: shows roll totals and result
- **Still needs**: Hex NPC integration, "Steal" buttons in shop modals

### Record Keeping
- [x] `recordEventMysteryRoll(eventHex, stat, success, rollValue, dreadValue)` logs each mystery attempt
- [x] Roll history persists on event hex.data.challenge.mysteryRolls
- [x] Supports multi-session event tracking across map leads

## Partially Complete / In Progress

### Event UI Updates  
- [x] Event panel shows Progress/Dread/Defeats
- [ ] Combat enemies not yet displayed when strike/shoot/defend selected
- [ ] Stat modifiers not displayed inline in event stat dropdown options
- [ ] Combat approach not yet activating enemy modal/combat flow

### Quick Panel Integration
- [ ] Stat modifiers not shown when rolling from Quick Panel
- [ ] Merchant/Black Market popups not accessible during traversal
- [ ] Thievery buttons not available on NPCs in Quick Panel

## Still Needed for Full Feature Parity

### UI/UX Enhancements
- [ ] Display combat enemies when combat stat selected in event (use `generateEventCombatEnemies`)
- [ ] Show equipment modifiers inline: "Body d6 (+1 Armor) (+Ad6 Hood)" in stat choices
- [ ] Reduce empty space on right side of hex info panel (CSS layout fix)
- [ ] Hex info blocking Quick Panel (known limitation - by design)

### Hex Integration
- [ ] Merchant Caravan: Random wilderness hex, 4-10 items available during Traversal
  - Should show "Merchant Caravan at Hex" with purchase modal
  - Items must be purchased individually from shop-like interface
- [ ] Trade Route Enhancement: Populate with tradeable goods (raw materials, bulk items)
  - Simple modal with 2-5 trade goods + prices
- [ ] Black Market Dealer: Random hex with 1-2 Master Hacks
  - Popup: "Black Market - Master Hacks for Sale"
  - Hacks only available from this NPC, not regular shops

### Thievery Integration
- [ ] Add "Steal" button to Holdings/Dwellings/Temples NPC interfaces
- [ ] Steal success: Item to backpack, notify player
- [ ] Steal failure: +1 TMW, encounter starts or flee option
- [ ] Items with "Hood" get Adventure Die advantage

### Trade Route Specifics
- [ ] Define trade goods list (separate from regular shop items)
- [ ] Trade good pricing (typically bulk/cheaper)
- [ ] Create NPC flavor for caravan merchants

## Functions Available for Developer Use

```javascript
// Event System
ensureEventChallengeState(hex)                    // Initialize event challenge tracking
recordEventMysteryRoll(hex, stat, success, rollVal, dreadVal)
getEventMysteryProgress(hex)                      // {completed, failures}
shouldGrantEventReward(hex)                       // failures < 4?
getApproachForStat(stat)                          // Maps stat → approach
getStatOptionsForMystery()                        // Array of {stat, label}
generateEventCombatEnemies(dreadDie)              // {count, enemies[], totalStress}

// Equipment & Backpack
equipBackpackItem(index, slot)                    // weapon1/weapon2/armor/readied
getStatModifiers(stat)                            // {total, sources[]}
formatStatWithModifiers(stat, shortForm)          // Formatted string with bonuses

// Special Encounters
generateMerchantCaravan()                         // 4-10 shop items
generateBlackMarketHacks()                        // 1-2 Master Hacks
attemptThievery(targetName)                       // Control vs D12 roll

// Utility
appendHexNote(col, row, text)                     // Add to hex notes
appendQuickPanelNote(text)                        // Add to Quick Notes
showNotif(msg, type)                              // Toast notification
```

## Next Steps (Priority Order)

1. **HIGH**: Add combat enemies modal when strike/shoot/defend selected in event
   - Show 1-4 enemies with health format
   - Allow setup in Combat tab or quickpanel enemies  
2. **HIGH**: Display stat+modifiers inline in event UI stat choices
   - Use `formatStatWithModifiers()` to show "Lead d6 (+Ad6 Hood)"
3. **MEDIUM**: Implement Merchant Caravan hex encounters
   - Random spawn, purchasable items, traversal-only
4. **MEDIUM**: Implement Black Market Dealer hexes
   - 1-2 Master Hacks, unique NPC
5. **MEDIUM**: Add "Steal" buttons to NPC interactions
   - Holdings, Dwellings, Temples
   - Thievery check integration
6. **LOW**: Trade Route item customization
   - Define regional trade goods
7. **LOW**: UI polish - reduce hex panel right-side empty space

## Known Limitations

- Hex info blocked by Quick Panel is intentional design (toggleable panel)
- Adventure Die bonus currently only detected via "Hood" in equipment name
  - Could expand to regex for other item types
- Black Market provider selection not yet randomized
  - Should select random NPC when hex generated

## Testing Checklist

- [x] No errors on index.html (checked after each commit)
- [x] App serves on localhost:4173
- [x] Event challenge system persists data correctly
- [ ] Event mysteries complete at 6 solved (needs QA)
- [ ] Backpack equip updates character sheet modifiers (needs QA)
- [ ] Thievery roll calculates correctly with hood bonus (needs QA)
- [ ] Equipment modifiers extract from item names (needs QA)

