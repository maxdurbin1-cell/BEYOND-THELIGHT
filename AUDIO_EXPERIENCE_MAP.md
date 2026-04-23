# 🎵 Audio Experience Map — When You'll Hear Sounds

## Opening the App

### 1. Page Load
```
✓ "🔊 Audio Manager initialized" (console)
✓ Music-character starts (warm ambient tone, loops)
```

---

## Tab Navigation

### Character Tab
```
🎵 Music: music-character (110 Hz ambient)
   └─ Warm, introspective tone
   └─ Perfect for character creation and stat management
```

### Map Tab
```
🎵 Music: music-map (146.83 Hz ethereal)
   └─ Exploration-themed
   └─ Changes to ambient exploration tone
```

### Combat Tab
```
🎵 Music: music-combat (196 Hz intense)
   └─ Tense, ready-for-battle atmosphere
```

### Caravan/Holding Tabs
```
🎵 Music: music-caravan (164.81 Hz adventure)
   └─ Journey/movement themed
```

### Missions/Jobs Tabs
```
🎵 Music: music-missions (130.81 Hz focused)
   └─ Quest-oriented, purposeful tone
```

---

## Combat Sequence

```
┌─────────────────────────────────────────────┐
│          STARTING COMBAT                    │
└─────────────────────────────────────────────┘

1. Click "Start Combat" or initiate combat
   └─→ 🔊 sfx-combat-start (220 Hz alert)
   └─→ 🎵 music-combat begins (fades in over 2 seconds)
   
   Your Turn / Enemy's Turn sequence begins...

┌─────────────────────────────────────────────┐
│          DURING COMBAT                      │
└─────────────────────────────────────────────┘

2a. You attack and HIT
    └─→ 🔊 sfx-combat-hit (whoosh/impact sound)
    └─→ Damage shows on screen

2b. You attack and MISS
    └─→ 🔊 sfx-combat-block (high tone - blocked!)

2c. Enemy attacks and HITS YOU
    └─→ 🔊 sfx-damage-taken (warning tone)
    └─→ Stress increases
    └─→ 🔊 sfx-stress-up (alert beep)

2d. Enemy attacks and MISSES
    └─→ 🔊 sfx-combat-block (block sound)

3. Enemy takes so much damage it's defeated
   └─→ 🔊 sfx-enemy-defeat (celebration tone!)
   └─→ Enemy removed from combat

4. Making a Trauma Check
   └─ If you succeed: Quiet (no trauma)
   └─ If you fail:    🔊 sfx-trauma (ominous low tone)
                      └─→ Trauma gained
                      └─→ 🔊 sfx-trauma plays again

┌─────────────────────────────────────────────┐
│          ENDING COMBAT                      │
└─────────────────────────────────────────────┘

5. Click "End Scene" to end combat
   └─→ 🔊 sfx-success (victory chime!)
   └─→ Stress halved, conditions cleared
   └─→ 🎵 music-combat fades out
   └─→ 🎵 music returns to previous tab (fades in)
```

---

## Status Changes (Any Time)

### Stress Growing
```
Every time your Stress increases:
   └─→ 🔊 sfx-stress-up (197 Hz alert)
       "Your stress is mounting..."
```

### Trauma Received
```
When you fail a Trauma Check:
   └─→ 🔊 sfx-trauma (110 Hz deep, ominous tone)
       "You've been traumatized..."
```

### TMW (Terror, Misery, Worry) Gained
```
When you fail a roll:
   └─→ +1 TMW awarded
   └─→ 🔊 sfx-tmw-gain (392 Hz positive chime)
       "You gain 1 TMW to spend next turn"
```

### Conditions Applied
```
When you gain Bolstered, Protected, etc.:
   └─→ 🔊 sfx-condition (277 Hz tone)
       "A condition has been applied"
```

---

## Mission Progression

```
┌─────────────────────────────────────────────┐
│          ACCEPTING A MISSION                │
└─────────────────────────────────────────────┘

1. Click "Accept" on a mission
   └─→ Mission added to Active Missions
   └─→ 🔊 sfx-mission-accept (261.63 Hz cheerful)
       "New mission started!"

┌─────────────────────────────────────────────┐
│          COMPLETING A MISSION               │
└─────────────────────────────────────────────┘

2. Complete all mission steps successfully
   └─→ 🔊 sfx-mission-complete (523.25 Hz triumph!)
       "Mission Complete!"
       "You gain +1 Renown"
       "You gain 150₵"
       "Loot: Sword, Shield, Scroll"

Your backpack fills with loot...
```

---

## Holding Quest (Special Multi-Step Mission)

```
┌─────────────────────────────────────────────┐
│          ESTABLISHING YOUR HOLDING          │
└─────────────────────────────────────────────┘

Step 1: Gather information about a site
        (quiet, narrative-driven)

Step 2: Explore the site and complete objectives
        (various combat/exploration sounds)

Step 3: Confront the site's danger
        (combat music and effects)

Final: Establish the Holding
   └─→ 🔊 sfx-mission-complete (523.25 Hz grand celebration!)
       "Holding established!"
       "Your domain in the Province is now real"
       "Map updated with your Holding"
```

---

## Items & Resources

### Getting Loot
```
When you acquire an item:
   └─→ 🔊 sfx-loot (392 Hz pickup sound)
       "Added to backpack: Iron Sword"
```

### Using Resources
```
When you spend TMW or Path Tokens:
   (No sound - visual feedback only)
```

---

## Caravan/Chase Scenes

```
┌─────────────────────────────────────────────┐
│          CHASE SEQUENCES                    │
└─────────────────────────────────────────────┘

When a chase begins:
   └─→ 🎵 music-caravan continues
   └─→ 🔊 sfx-chase-alert (440 Hz urgent tone)
       "You're being pursued!"

During chase Drive rolls:
   (Various success/failure sounds possible)

If your Transporter takes damage:
   └─→ 🔊 sfx-caravan-damage (noise impact)
       "Your Transporter took damage!"
       "Lose 2 cargo items from storage"
```

---

## Quick Sound Reference Card

### Combat Sounds
| Sound | When | Response |
|-------|------|----------|
| 🔊 Combat Start | Combat begins | Alert, get ready |
| 💥 Hit/Impact | Successful strike | Satisfying impact |
| 🛡️ Block | Blocked attack | Solid clang |
| 💀 Enemy Defeated | Enemy destroyed | Celebration! |
| ⚠️ Damage Taken | You're hit | Warning alert |
| 🖤 Trauma | Trauma received | Ominous dread |

### Status Sounds
| Sound | When | Response |
|-------|------|----------|
| ⚠️ Stress Up | Stress increases | Alert tone |
| 🎭 Condition | Condition applied | Status change |
| 💜 TMW Gained | Roll failed | Resource reward |

### Progress Sounds
| Sound | When | Response |
|-------|------|----------|
| ✓ Success | Roll succeeds | Positive chime |
| ✗ Failure | Roll fails | Negative tone |
| 🎖️ Mission Complete | Quest finished | Triumphant! |
| 🏰 Holding Complete | Domain established | Grand celebration! |

---

## Immersion Tips

### Best Experience
1. **Keep volume moderately loud** (50-80% master volume)
2. **Keep music at 40-60%** so you can hear SFX clearly
3. **Adjust SFX to 70-80%** for good notification feedback
4. **Use headphones** for full immersion
5. **Play slower** to appreciate the ambient music

### Gameplay Tips
- **Listen for warnings**: Damage/Stress sounds mean you're in trouble
- **Celebrate victories**: Defeat sounds signify progress
- **Tab music sets mood**: Let the music guide your focus
- **Mission sounds reward completion**: Hear your accomplishment!

---

## Silent Mode

If you want to disable audio:
```javascript
// In browser console:
window.AudioManager.toggleAudio(false)

// To re-enable:
window.AudioManager.toggleAudio(true)
```

Or adjust individual volumes:
```javascript
window.AudioManager.setMasterVolume(0)   // Silent
window.AudioManager.setMusicVolume(0)    // Music off
window.AudioManager.setSFXVolume(1.0)    // SFX full
```

---

## Common Audio Sequences

### Epic Combat Victory
```
1. 🔊 sfx-combat-start (beginning)
2. 🎵 music-combat (loops)
3. 🔊 [attack sounds] (during)
4. 🔊 sfx-enemy-defeat (final blow!)
5. 🔊 sfx-success (victory!)
6. 🔊 sfx-mission-complete (if mission related)
7. 🎵 [music fades, returns to previous]
```

### Dangerous Moment
```
1. 🔊 sfx-damage-taken (hit!)
2. 🔊 sfx-stress-up (getting stressed)
3. 🔊 sfx-stress-up (more stress!)
4. ⚠️ [combat continues]
5. 🎵 [music maintains tension]
```

### Major Achievement
```
1. ✓ Action succeeds
2. 🔊 sfx-loot (item acquired)
3. 🔊 sfx-mission-complete (mission finishes)
4. 🔊 sfx-loot (loot awarded)
5. 🎖️ Celebration confirmed
```

---

## Troubleshooting Audio

### I Don't Hear Combat Start Sound
1. Make sure volume is up (50%+)
2. Try clicking "Start Combat" again
3. Check browser audio permissions
4. Check if muted in browser tab

### Music Suddenly Stops
1. That's normal when switching tabs
2. Music fades out and new music fades in
3. New music should start within 2 seconds

### Sounds Are Too Quiet
1. Increase master volume: `window.AudioManager.setMasterVolume(1.0)`
2. Increase SFX volume: `window.AudioManager.setSFXVolume(1.0)`
3. Check system volume levels

### Sounds Are Too Loud
1. Decrease master volume: `window.AudioManager.setMasterVolume(0.5)`
2. Or decrease individual volumes

### Audio Disabled on Mobile?
1. iOS/Android may require user interaction first
2. Try clicking a button first, then playing audio
3. Mobile browsers sometimes restrict audio autoplay

---

Generated: 2026-04-23
Status: ✅ Complete Audio System
