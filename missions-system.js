// missions-system.js - COMPLETE REPLACEMENT

/**
 * Mission System for BEYOND-THELIGHT
 * Three-step mission framework with full integration
 * 1. Acquiring Information (optional)
 * 2. Go to Site (required)
 * 3. Confrontation (required)
 */

// Initialize mission storage if needed
if (typeof S === 'undefined') {
  window.S = {};
}

S.activeMissions = S.activeMissions || [];
S.completedMissions = S.completedMissions || [];
S.missionTokens = S.missionTokens || {}; // Store tokens for map display

// ==================== MISSION STEP DEFINITIONS ====================

const MISSION_STEPS = {
  ACQUIRE_INFO: { id: 1, name: 'Acquiring Information', required: false },
  GO_TO_SITE: { id: 2, name: 'Go to Site', required: true },
  CONFRONTATION: { id: 3, name: 'Confrontation', required: true }
};

// ==================== CHALLENGE RATINGS ====================

const CHALLENGE_RATINGS = {
  easy: { dieType: 'd4', hp: 8, dread: 'd4', name: 'Easy', lootDice: 1 },
  medium: { dieType: 'd6', hp: 12, dread: 'd6', name: 'Medium', lootDice: 2 },
  hard: { dieType: 'd8', hp: 16, dread: 'd8', name: 'Hard', lootDice: 3 },
  challenging: { dieType: 'd10', hp: 20, dread: 'd10', name: 'Challenging', lootDice: 4 },
  impossible: { dieType: 'd20', hp: 40, dread: 'd20', name: 'Impossible', lootDice: 5, bonusD6: true }
};

// ==================== LOOT TABLES ====================

const LOOT_TABLES = {
  easy: ['Healing Potion', 'Rope', 'Torches', 'Bread Rations'],
  medium: ['Healing Herb', 'Iron Tools', 'Leather Armor', 'Dagger'],
  hard: ['Magical Scroll', 'Silver Ring', 'Enchanted Dagger', 'Gemstone', 'Spiced Wine'],
  challenging: ['Cursed Amulet', 'Rare Book', 'Gold Coins', 'Ancient Artifact', 'Perfume'],
  impossible: ['Legendary Weapon', 'Crown of Kings', 'Ancient Relic', 'Treasure Chest', 'Dragon Scale']
};

// ==================== CREATE MISSION ====================

/**
 * Creates a mission from an accepted job
 * @param {string} npcName - Name of NPC giving mission
 * @param {string} title - Mission title
 * @param {string} difficulty - Difficulty level (easy, medium, hard, challenging, impossible)
 * @param {string} location - Location name
 * @param {string} region - 'province' or 'lastsea'
 * @returns {object} Mission object
 */
function createMission(npcName, title, difficulty, location, region = 'province') {
  const diffLower = difficulty.toLowerCase();
  const challengeData = CHALLENGE_RATINGS[diffLower] || CHALLENGE_RATINGS.easy;

  const mission = {
    id: Date.now() + Math.random(),
    npcName: npcName,
    title: title,
    difficulty: diffLower,
    location: location,
    region: region,
    currentStep: 1,
    createdAt: new Date().toISOString(),
    completedAt: null,
    success: null,
    
    // Step tracking
    steps: {
      1: {
        id: 1,
        name: MISSION_STEPS.ACQUIRE_INFO.name,
        required: MISSION_STEPS.ACQUIRE_INFO.required,
        completed: false,
        rollResult: null,
        notes: ''
      },
      2: {
        id: 2,
        name: MISSION_STEPS.GO_TO_SITE.name,
        required: MISSION_STEPS.GO_TO_SITE.required,
        completed: false,
        rollResult: null,
        siteLocation: null,
        notes: ''
      },
      3: {
        id: 3,
        name: MISSION_STEPS.CONFRONTATION.name,
        required: MISSION_STEPS.CONFRONTATION.required,
        completed: false,
        rollResult: null,
        security: Math.max(1, Math.floor(Math.random() * 4) + 1), // d4 security (1-4)
        hp: challengeData.hp,
        dread: challengeData.dread,
        notes: ''
      }
    },
    
    // Rewards and loot
    rewards: {
      renown: 1,
      credits: 100,
      loot: []
    },
    
    // Map tokens
    tokens: {
      informant: null,
      site: null,
      encounter: null
    }
  };

  S.activeMissions.push(mission);
  console.log('✓ Mission created:', mission.title);
  renderMissionTracker();
  return mission;
}

// ==================== COMPLETE MISSION STEP ====================

/**
 * Completes a step of the mission
 * @param {number} missionId - Mission ID
 * @param {number} stepId - Step number (1, 2, or 3)
 * @param {number} rollResult - Optional roll result
 */
function completeMissionStep(missionId, stepId, rollResult = null) {
  const mission = S.activeMissions.find(m => m.id === missionId);
  if (!mission) {
    console.error('Mission not found:', missionId);
    return false;
  }

  const step = mission.steps[stepId];
  if (!step) {
    console.error('Step not found:', stepId);
    return false;
  }

  // Mark step as complete
  step.completed = true;
  if (rollResult !== null) step.rollResult = rollResult;

  // Move to next step
  if (stepId < 3) {
    mission.currentStep = stepId + 1;
  } else {
    // Final step completed - mission success
    completeMission(missionId, true);
    return true;
  }

  console.log(`✓ Step ${stepId} complete: ${step.name}`);
  renderMissionTracker();
  return true;
}

// ==================== FAIL MISSION STEP ====================

/**
 * Fails a specific step
 * @param {number} missionId
 * @param {number} stepId
 */
function failMissionStep(missionId, stepId) {
  const mission = S.activeMissions.find(m => m.id === missionId);
  if (!mission) return false;

  const step = mission.steps[stepId];
  if (!step) return false;

  // Mark as failed
  step.completed = false;
  console.log(`✗ Step ${stepId} failed: ${step.name}`);
  renderMissionTracker();
  return true;
}

// ==================== ROLL FOR LOOT ====================

/**
 * Rolls for loot based on difficulty
 * @param {string} difficulty
 * @returns {object} Loot info
 */
function rollForLoot(difficulty) {
  const diffLower = difficulty.toLowerCase();
  const challengeData = CHALLENGE_RATINGS[diffLower] || CHALLENGE_RATINGS.easy;
  const lootTable = LOOT_TABLES[diffLower] || LOOT_TABLES.easy;
  
  const loot = [];
  const numRolls = challengeData.lootDice;

  // Roll d4s based on challenge level
  for (let i = 0; i < numRolls; i++) {
    const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)];
    loot.push(randomItem);
  }

  // Bonus d6 for Impossible
  if (challengeData.bonusD6) {
    const bossItem = lootTable[Math.floor(Math.random() * lootTable.length)];
    loot.push(`${bossItem} (Boss Loot - d6)`);
  }

  return { loot, numRolls, totalRolls: numRolls + (challengeData.bonusD6 ? 1 : 0) };
}

// ==================== COMPLETE MISSION ====================

/**
 * Completes an entire mission
 * @param {number} missionId
 * @param {boolean} success
 */
function completeMission(missionId, success = true) {
  const missionIndex = S.activeMissions.findIndex(m => m.id === missionId);
  if (missionIndex === -1) {
    console.error('Mission not found');
    return false;
  }

  const mission = S.activeMissions[missionIndex];
  mission.completedAt = new Date().toISOString();
  mission.success = success;

  if (success) {
    const lootInfo = rollForLoot(mission.difficulty);
    mission.rewards.loot = lootInfo.loot;
    mission.rewards.renown = 1;
    
    // Update character
    if (typeof S.renown !== 'undefined') {
      S.renown = (S.renown || 0) + 1;
      updateRenown();
    }

    showNotif(`✓ Mission Complete! +1 Renown. Loot: ${lootInfo.loot.join(', ')}`, 'good');
  } else {
    mission.rewards.renown = -1;
    
    if (typeof S.renown !== 'undefined') {
      S.renown = Math.max(0, (S.renown || 0) - 1);
      updateRenown();
    }

    showNotif(`✗ Mission Failed. Lost 1 Renown.`, 'warn');
  }

  // Move to completed
  S.completedMissions.push(mission);
  S.activeMissions.splice(missionIndex, 1);

  console.log('✓ Mission completed:', mission.title, success ? 'SUCCESS' : 'FAILED');
  renderMissionTracker();
  renderCompletedMissions();
  return true;
}

// ==================== ABANDON MISSION ====================

/**
 * Abandons a mission
 * @param {number} missionId
 */
function abandonMission(missionId) {
  completeMission(missionId, false);
}

// ==================== RENDER MISSION TRACKER ====================

/**
 * Renders the mission tracker UI
 */
function renderMissionTracker() {
  const container = document.getElementById('missionTrackerContainer');
  if (!container) return;

  const missions = S.activeMissions || [];

  if (missions.length === 0) {
    container.innerHTML = `
      <div style="font-size:.85rem;color:var(--muted2);padding:1rem;text-align:center;">
        No active missions. Accept a job to begin!
      </div>
    `;
    return;
  }

  container.innerHTML = missions.map(mission => `
    <div class="mission-card" style="background:var(--surface);border:1px solid var(--border2);padding:.7rem;margin-bottom:.7rem;border-radius:2px;">
      <!-- Mission Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem;">
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-size:.85rem;color:var(--gold2);margin-bottom:.15rem;">
            ${mission.title}
          </div>
          <div style="font-size:.7rem;color:var(--teal);font-family:'Rajdhani',sans-serif;">
            ${mission.difficulty.toUpperCase()} • ${mission.location} • ${mission.npcName}
          </div>
        </div>
        <button class="btn btn-xs btn-red" onclick="abandonMission(${mission.id})">Abandon</button>
      </div>

      <!-- Mission Steps -->
      <div style="margin-top:.6rem;border-top:1px solid var(--border);padding-top:.5rem;">
        <div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);margin-bottom:.4rem;">
          Mission Progress
        </div>
        ${renderMissionSteps(mission)}
      </div>

      <!-- Action Buttons -->
      <div style="margin-top:.5rem;display:flex;gap:.25rem;flex-wrap:wrap;">
        ${mission.steps[1].completed ? 
          `<button class="btn btn-xs" style="opacity:.5;">✓ Info</button>` :
          `<button class="btn btn-xs btn-teal" onclick="completeMissionStep(${mission.id}, 1)">▶ Info</button>`
        }
        ${mission.steps[2].completed ? 
          `<button class="btn btn-xs" style="opacity:.5;">✓ Site</button>` :
          `<button class="btn btn-xs btn-teal" onclick="completeMissionStep(${mission.id}, 2)">▶ Site</button>`
        }
        ${mission.steps[3].completed ? 
          `<button class="btn btn-xs" style="opacity:.5;">✓ Confront</button>` :
          `<button class="btn btn-xs btn-green" onclick="completeMissionStep(${mission.id}, 3)">▶ Confront</button>`
        }
      </div>
    </div>
  `).join('');
}

// ==================== RENDER MISSION STEPS ====================

/**
 * Renders individual steps within a mission
 */
function renderMissionSteps(mission) {
  return Object.values(mission.steps).map(step => {
    const isActive = mission.currentStep === step.id;
    const isCompleted = step.completed;

    return `
      <div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.35rem;padding:.25rem;background:${isActive ? 'rgba(46,196,182,.08)' : ''};border-left:2px solid ${isCompleted ? 'var(--green)' : isActive ? 'var(--teal)' : 'var(--border)'};">
        <div style="width:1.4rem;height:1.4rem;border-radius:50%;border:1.5px solid ${isCompleted ? 'var(--green)' : isActive ? 'var(--teal)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:.7rem;color:${isCompleted ? 'var(--green)' : isActive ? 'var(--teal)' : 'var(--muted)'};">
          ${isCompleted ? '✓' : step.id}
        </div>
        <div style="flex:1;">
          <div style="font-size:.78rem;font-family:'Cinzel',serif;color:${isCompleted ? 'var(--green)' : isActive ? 'var(--teal)' : 'var(--text2)'};">
            ${step.name}
            ${!step.required ? '<span style="color:var(--muted);"> [Optional]</span>' : ''}
          </div>
          ${step.rollResult !== null ? 
            `<div style="font-size:.65rem;color:var(--muted);margin-top:.05rem;">Roll: ${step.rollResult}</div>` : 
            ''
          }
        </div>
      </div>
    `;
  }).join('');
}

// ==================== RENDER COMPLETED MISSIONS ====================

/**
 * Renders recently completed missions
 */
function renderCompletedMissions() {
  const container = document.getElementById('completedMissionsContainer');
  if (!container) return;

  const missions = (S.completedMissions || []).slice(-5);

  if (missions.length === 0) {
    container.innerHTML = `
      <div style="font-size:.8rem;color:var(--muted2);padding:.5rem;">No completed missions yet.</div>
    `;
    return;
  }

  container.innerHTML = missions.map(mission => `
    <div style="background:var(--surface);border:1px solid var(--border2);padding:.5rem;margin-bottom:.4rem;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.25rem;">
        <div style="flex:1;">
          <div style="font-size:.78rem;font-family:'Cinzel',serif;color:${mission.success ? 'var(--green)' : 'var(--red)'};">
            ${mission.title}
          </div>
          <div style="font-size:.7rem;color:var(--muted2);margin-top:.1rem;">
            ${mission.success ? '✓ SUCCESS' : '✗ FAILED'} • ${mission.npcName}
          </div>
        </div>
      </div>
      <div style="font-size:.72rem;color:var(--gold);margin-top:.25rem;">
        Rewards: ${mission.success ? `+${mission.rewards.renown} Renown` : `${mission.rewards.renown} Renown`}
      </div>
      ${mission.rewards.loot && mission.rewards.loot.length ? 
        `<div style="font-size:.72rem;color:var(--teal);margin-top:.15rem;">
          Loot: ${mission.rewards.loot.join(', ')}
        </div>` : 
        ''
      }
    </div>
  `).join('');
}

// ==================== EXPORT TO WINDOW ====================

window.createMission = createMission;
window.completeMissionStep = completeMissionStep;
window.failMissionStep = failMissionStep;
window.completeMission = completeMission;
window.abandonMission = abandonMission;
window.rollForLoot = rollForLoot;
window.renderMissionTracker = renderMissionTracker;
window.renderCompletedMissions = renderCompletedMissions;

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof S !== 'undefined') {
    renderMissionTracker();
    renderCompletedMissions();
  }
});
