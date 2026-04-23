# Audio Integration Map — BEYOND: The Light

## Sound Assets Available

### Music Tracks (Tab-Based)
- **music-character**: Ambient character creation/menu music (110 Hz tone, calm)
- **music-map**: Exploration/map navigation (146.83 Hz, ethereal)
- **music-combat**: Combat scene (196 Hz, intense)
- **music-caravan**: Transporter/journey music (164.81 Hz, adventurous)
- **music-missions**: Missions/quests (130.81 Hz, focused)

### Sound Effects Library

#### Combat Sounds
- **sfx-combat-start** (220 Hz): Plays when combat begins
- **sfx-combat-hit** (noise): Sword/strike impact
- **sfx-combat-block** (440 Hz): Blocked/missed attack
- **sfx-enemy-defeat** (329.63 Hz, 0.2s): Enemy defeated!
- **sfx-damage-taken** (146.83 Hz): Player takes damage (warning tone)
- **sfx-trauma** (110 Hz): Trauma received (ominous)

#### Status Changes
- **sfx-stress-up** (197 Hz): Stress increased
- **sfx-condition** (277.18 Hz): Condition applied (Bolstered, Protected, etc.)
- **sfx-tmw-gain** (392 Hz): TMW gained (positive chime)

#### Outcomes
- **sfx-success** (349.23 Hz): Roll succeeded
- **sfx-failure** (164.81 Hz): Roll failed

#### Progression
- **sfx-mission-accept** (261.63 Hz): Mission accepted
- **sfx-mission-complete** (523.25 Hz, 0.3s): Mission completed!
- **sfx-loot** (392 Hz): Item obtained
- **sfx-chase-alert** (440 Hz): Chase/pursuit warning
- **sfx-caravan-damage** (noise): Caravan takes damage

#### UI
- **sfx-ui-click** (800 Hz): UI interaction

---

## Integration Points & Functions

### 1. TAB SWITCHING (MUSIC)
**Function**: `switchTab(tabId, btn)`  
**File**: index.html (line ~30)  
**Action**: Switch music based on active tab

**Current Code**:
```javascript
function switchTab(tabId, btn) {
  // ... existing tab logic ...
}
```

**Integration**:
```javascript
function switchTab(tabId, btn) {
  // ... existing tab logic ...
  
  // AUDIO: Switch music based on tab
  if (typeof window.AudioManager !== 'undefined') {
    window.AudioManager.switchTabMusic(tabId);
  }
}
```

---

### 2. COMBAT SYSTEM

#### 2a. Combat Start
**Function**: `startCombat()`  
**File**: index.html (line 1307)  
**Sound**: `sfx-combat-start`

**Integration**:
```javascript
function startCombat(){
  S.combat.active=true;
  S.combat.round=1;
  S.combat.actionsLeft=getMaxActions();
  S.combat.enemyDefendsThisTurn=0;
  updateCombatUI();
  // AUDIO: Combat started
  if (typeof window.AudioManager !== 'undefined') {
    window.AudioManager.combatStarted();
  }
}
```

#### 2b. Combat End
**Function**: `endCombat()`  
**File**: index.html (line 1309)  
**Sound**: `sfx-success`

**Integration**:
```javascript
function endCombat(){
  S.combat.active=false;
  S.combat.round=0;
  halfStress();
  clearAllConditions();
  updateCombatUI();
  showNotif('Scene ended — Recovery applied','good');
  // AUDIO: Combat ended
  if (typeof window.AudioManager !== 'undefined') {
    window.AudioManager.combatEnded();
  }
}
```

#### 2c. Attack Roll
**Function**: `rollAttack(type)`  
**File**: index.html (line 1580)  
**Sound**: `sfx-combat-hit` (hit) or `sfx-combat-block` (miss)

**Key Lines to Update**:
- Line ~1600: On hit → `AudioManager.combatHit()`
- Line ~1610: On miss → `AudioManager.combatMiss()`

#### 2d. Defend Roll
**Function**: `rollDefend(skipEnemyTurnTick)`  
**File**: index.html (line 1661)  
**Sound**: After determining hit/miss

#### 2e. Trauma Check
**Function**: `rollTraumaCheck()`  
**File**: index.html (line 1719)  
**Sound**: `sfx-trauma` on trauma received

**Integration**:
```javascript
function rollTraumaCheck(){
  const a=explodingRoll(S.stats.adventure);
  const d=explodingRoll(S.combat.enemyDread);
  const success=a.total>=d.total;
  // ... existing display logic ...
  if(success){
    addSuccessRoll();
  } else {
    changeTrauma(1);
    addTMWOnFail();
    // AUDIO: Trauma received
    if (typeof window.AudioManager !== 'undefined') {
      window.AudioManager.traumaReceived();
    }
  }
}
```

#### 2f. Enemy Defeated
**Function**: `enemyPip(id, i)`  
**File**: index.html (line 1747)  
**Sound**: `sfx-enemy-defeat`

**Integration**:
```javascript
function enemyPip(id,i){
  const e=S.enemies.find(x=>x.id===id);
  if(!e)return;
  e.stress=i<e.stress?i:i+1;
  if(e.stress>=e.maxStress){
    // AUDIO: Enemy defeated
    if (typeof window.AudioManager !== 'undefined') {
      window.AudioManager.enemyDefeated();
    }
    showNotif(`${e.name} defeated!`,'good');
    S.enemies=S.enemies.filter(x=>x.id!==id);
  }
  renderEnemies();
  if(typeof renderQP==='function')renderQP('combat');
}
```

#### 2g. Enemy Attacks Player
**Function**: `enemyAttack(id)`  
**File**: index.html (line 1749)  
**Sound**: Varies based on hit

**Integration**:
```javascript
function enemyAttack(id){
  const e=S.enemies.find(x=>x.id===id);
  if(!e)return;
  const atk=explodingRoll(e.dread);
  const def=explodingRoll(S.stats.defend);
  const hit=atk.total>def.total;
  const dmg=Math.max(1,atk.total-def.total);
  
  if(hit) {
    // AUDIO: Player took damage
    if (typeof window.AudioManager !== 'undefined') {
      window.AudioManager.damageTaken(dmg / 10); // Severity based on damage
    }
  } else {
    // AUDIO: Attack blocked
    if (typeof window.AudioManager !== 'undefined') {
      window.AudioManager.combatMiss();
    }
  }
  
  showNotif(`${e.name}: ${atk.total} vs your ${def.total} — ${hit?`Hit! ${dmg} Stress`:'Blocked!'}`,hit?'warn':'good');
  if(hit)changeStress(dmg);
}
```

---

### 3. STRESS & STATUS

#### 3a. Stress Increased
**Function**: `changeStress(n)` (needs to be located)  
**Sound**: `sfx-stress-up`
**File**: index.html (need to find)

**Integration**: Add audio call when stress > 0:
```javascript
if (n > 0) {
  if (typeof window.AudioManager !== 'undefined') {
    window.AudioManager.stressIncreased();
  }
}
```

#### 3b. Condition Applied
**Function**: Various condition setters (toggleCondition, etc.)  
**Sound**: `sfx-condition`

---

### 4. MISSIONS & QUESTS

#### 4a. Mission Accepted
**Functions**: Mission creation/acceptance functions  
**File**: missions-system.js  
**Sound**: `sfx-mission-accept`

#### 4b. Mission Completed
**Functions**: Quest completion handlers  
**File**: new-features.js (lines ~1570-1600)  
**Sound**: `sfx-mission-complete`

#### 4c. Loot Obtained
**Function**: When items added to backpack  
**Sound**: `sfx-loot`

---

### 5. CARAVAN SYSTEM

#### 5a. Chase Initiated
**Function**: Chase sequence start  
**File**: new-features.js (line ~938)  
**Sound**: `sfx-chase-alert`

#### 5b. Caravan Damage
**Function**: Caravan stress increase  
**File**: new-features.js (line ~678)  
**Sound**: `sfx-caravan-damage`

---

### 6. ROLL OUTCOMES

#### 6a. Generic Success
**Where**: After any successful roll  
**Sound**: `sfx-success`

#### 6b. Generic Failure
**Where**: After any failed roll  
**Sound**: `sfx-failure`

---

## Integration Checklist

- [ ] Audio manager loads and initializes
- [ ] Music switches on tab change
- [ ] Combat start plays sfx-combat-start
- [ ] Combat end plays sfx-success
- [ ] Damage taken plays sfx-damage-taken
- [ ] Enemy defeated plays sfx-enemy-defeat
- [ ] Trauma received plays sfx-trauma
- [ ] Stress increases play sfx-stress-up
- [ ] Conditions applied play sfx-condition
- [ ] TMW gained plays sfx-tmw-gain
- [ ] Mission accepted plays sfx-mission-accept
- [ ] Mission completed plays sfx-mission-complete
- [ ] Loot obtained plays sfx-loot
- [ ] Chase started plays sfx-chase-alert
- [ ] Caravan damaged plays sfx-caravan-damage
- [ ] UI clicks play sfx-ui-click (optional)

---

## Settings Panel Addition

Add audio controls to the Character tab header:

```html
<div class="audio-controls" style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
  <label style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em;">
    🔊 Audio:
    <select id="audioMasterVolume" onchange="if(window.AudioManager) window.AudioManager.setMasterVolume(this.value / 100)">
      <option value="0">Off</option>
      <option value="30">Low</option>
      <option value="60" selected>Medium</option>
      <option value="100">High</option>
    </select>
  </label>
</div>
```

---

## File Updates Required

1. **index.html**
   - Add audio-manager.js script (DONE)
   - Update switchTab() function
   - Update startCombat() function
   - Update endCombat() function
   - Update enemyPip() function
   - Update enemyAttack() function
   - Update rollTraumaCheck() function (if exists)

2. **new-features.js**
   - Update mission completion handlers
   - Update caravan damage handlers
   - Update chase sequence handlers

3. **missions-system.js**
   - Update mission acceptance handlers
   - Update loot distribution functions

---

## Volume Defaults

- Master Volume: 0.7 (70%)
- Music Volume: 0.5 (50%)
- SFX Volume: 0.6 (60%)

These can be adjusted via AudioManager methods:
- `AudioManager.setMasterVolume(value)` — 0-1
- `AudioManager.setMusicVolume(value)` — 0-1
- `AudioManager.setSFXVolume(value)` — 0-1
