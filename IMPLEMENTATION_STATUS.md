# Future Implementation Status

## Completed in This Session
- [x] Event mystery system refactored to support 6 total mysteries per event
- [x] Dread die tracking and persistence across hexes
- [x] Stat-based approach system replacing generic approaches
- [x] Mystery completion tracking with failure threshold (4+ = no reward)
- [x] Event stat functions: getApproachForStat, generateEventCombatEnemies, getStatOptionsForMystery
- [x] Event mystery rolltracking and progress calculation

## Partially Completed  
- [x] equipBackpackItem function added
- [ ] Equip buttons added to backpack modals (still needs integration)
- [ ] Quick panel stat rolls with modifiers (still needs implementation)

## Still Needed
- [ ] Combat enemies display in event UI (use generateEventCombatEnemies)
- [ ] Merchant caravan generation on wilderness hexes (4-10 random shop items)
- [ ] Trade route popup with tradeable goods
- [ ] Black market dealer hex with 1-2 Master Hacks
- [ ] Thievery system: "Steal" option at Dread D12 vs Control
- [ ] Adventure Die bonus support for items with hoods/gear
- [ ] UI layout fix: reduce right-side empty space on hexes
- [ ] Quick panel modifier display when rolling stats (read Equipment tab modifiers)

## Implementation Notes

### For Combat Enemies in Events
When user chooses combat-related stat (strike/shoot/defend), call:
```javascript
const enemies = generateEventCombatEnemies(hex.data.challenge.dread);
// Display format: "Dread D8 | 16 Stress" with 1-4 enemies listed
```

### For Merchant Caravans
- Generate on random wilderness hexes
- Create modal with 4-10 random shop items
- Must allow purchase during Traversal phase only

### For Black Market  
- Random chance when visiting new hexes
- Popup with "Master Hacks Available" showing 1-2 hacks for purchase
- Only available from dealers, not regular shops

### For Thievery
- Add to hexes with NPCs (holdings, dwellings, temples)
- Roll: Player's d_control vs d12 (dread-based)
- If item has hood/Adventure Die bonus, roll Ad plus control die
- On success, sneak item to backpack
- On failure, alarm/encounter

### Quick Panel Modifiers
- When displaying stat roll options in combat/events
- Show: "Base Die + Weapon Mod + Armor/Readied Item Bonus"
- Example: "d6 (Body) + 1 (Sword) + Ad (Hood) = +1 total"
