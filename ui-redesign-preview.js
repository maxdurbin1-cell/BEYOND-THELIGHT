const state = {
  health: 5, maxHealth: 8,
  stress: 2, maxStress: 8,
  credits: 1250, renown: 4,
  pathTokens: 7, teamwork: 2,
  trauma: 1, turn: 3,
  rollHistory: []
};

const STATS = [
  { key: 'body', label: 'Body', sub: 'Melee and endurance', die: 'd8' },
  { key: 'strike', label: 'Strike', sub: 'Attack accuracy', die: 'd8' },
  { key: 'shoot', label: 'Shoot', sub: 'Ranged attack', die: 'd6' },
  { key: 'defend', label: 'Defend', sub: 'Armor and parry', die: 'd6' },
  { key: 'mind', label: 'Mind', sub: 'Intelligence and lore', die: 'd10' },
  { key: 'control', label: 'Control', sub: 'Piloting and finesse', die: 'd6' },
  { key: 'spirit', label: 'Spirit', sub: 'Will and magic', die: 'd4' },
  { key: 'lead', label: 'Lead', sub: 'Charisma and command', die: 'd6' },
  { key: 'valor', label: 'Valor', sub: 'Trauma and peril', die: 'd8' }
];

const DIE_ORDER = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const RENOWN_TIERS = [
  [0, 'Unknown', 'Nobody knows your name'],
  [2, 'Wanderer', 'Known in a handful of settlements'],
  [5, 'Rising', 'Reputation spreading across the region'],
  [10, 'Notable', 'Sought out by factions and merchants'],
  [20, 'Renowned', 'Legends told in taverns and courts'],
  [40, 'Legendary', 'Your deeds shape the world itself']
];

const liveBridge = {
  enabled: true,
  sourceLabel: 'local preview',
  lastSyncAt: 0,
  timer: null
};

function init() {
  renderStats();
  renderHealthPips();
  updateVitalsHeader();
  updateRenown();
  syncFromExistingAppState();
  if (liveBridge.enabled) {
    liveBridge.timer = window.setInterval(syncFromExistingAppState, 1000);
  }
}

function readLiveSObject() {
  try {
    if (window.S && typeof window.S === 'object') {
      return { source: 'window.S', S: window.S };
    }
  } catch (_err) {}
  try {
    if (window.parent && window.parent !== window && window.parent.S && typeof window.parent.S === 'object') {
      return { source: 'parent.S', S: window.parent.S };
    }
  } catch (_err2) {}
  try {
    if (window.opener && window.opener.S && typeof window.opener.S === 'object') {
      return { source: 'opener.S', S: window.opener.S };
    }
  } catch (_err3) {}
  return null;
}

function derivePreviewStateFromS(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const ad = Math.max(1, Number(raw && raw.stats && raw.stats.adventure || raw.maxStress || 8));
  const stress = Math.max(0, Number(raw.stress || 0));
  const currentHealth = Math.max(0, ad - stress);
  const combat = raw.combat && typeof raw.combat === 'object' ? raw.combat : {};
  const enemies = Array.isArray(raw.enemies) ? raw.enemies : [];

  return {
    name: String(raw.name || 'Wayfarer') || 'Wayfarer',
    health: currentHealth,
    maxHealth: ad,
    stress: stress,
    maxStress: ad,
    credits: Math.max(0, Number(raw.credits || 0)),
    renown: Math.max(0, Number(raw.renown || 0)),
    trauma: Math.max(0, Number(raw.trauma || 0)),
    pathTokens: Math.max(0, Number(raw.pathTokens || 0)),
    teamwork: Math.max(0, Number(raw.tmw || 0)),
    turn: Math.max(1, Number(combat.round || 1)),
    actionsLeft: Math.max(0, Number(combat.actionsLeft || 0)),
    combatActive: !!combat.active,
    enemies: enemies
  };
}

function applyLivePreviewState(next) {
  if (!next) return;
  state.health = next.health;
  state.maxHealth = next.maxHealth;
  state.stress = next.stress;
  state.maxStress = next.maxStress;
  state.credits = next.credits;
  state.renown = next.renown;
  state.trauma = next.trauma;
  state.pathTokens = next.pathTokens;
  state.teamwork = next.teamwork;
  state.turn = next.turn;

  const healthVal = document.getElementById('healthVal');
  const creditsVal = document.getElementById('creditsVal');
  const headerCredits = document.getElementById('headerCredits');
  const traumaVal = document.getElementById('traumaVal');
  const turnNum = document.getElementById('turnNum');
  const turnPhase = document.getElementById('turnPhase');

  if (healthVal) healthVal.textContent = String(state.health);
  if (creditsVal) creditsVal.textContent = state.credits.toLocaleString();
  if (headerCredits) headerCredits.textContent = state.credits.toLocaleString();
  if (traumaVal) traumaVal.textContent = String(state.trauma);
  if (turnNum) turnNum.textContent = String(state.turn);
  if (turnPhase) {
    turnPhase.textContent = next.combatActive
      ? ('Player Phase · ' + next.actionsLeft + ' Actions Left')
      : 'Out of Combat';
  }

  updateRenown();
  updateVitalsHeader();
  renderHealthPips();
  renderCombatants(next);
}

function renderCombatants(snapshot) {
  const list = document.getElementById('combatantList');
  if (!list || !snapshot) return;
  const playerInitials = snapshot.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'WF';
  const playerRow = '<div class="combatant-row active">'
    + '<div class="combatant-avatar">' + playerInitials + '</div>'
    + '<div class="combatant-name">' + snapshot.name + '</div>'
    + '<div class="combatant-hp">HP ' + snapshot.health + '/' + snapshot.maxHealth + '</div>'
    + '<div class="initiative-badge">P</div>'
    + '</div>';

  const hostileRows = (snapshot.enemies || [])
    .filter((enemy) => enemy && !enemy.ally)
    .slice(0, 5)
    .map((enemy, idx) => {
      const stress = Math.max(0, Number(enemy.stress || 0));
      const maxStress = Math.max(stress, Number(enemy.maxStress || enemy.health || 0) || stress);
      const initials = String(enemy.name || 'EN').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'EN';
      return '<div class="combatant-row">'
        + '<div class="combatant-avatar">' + initials + '</div>'
        + '<div class="combatant-name">' + String(enemy.name || ('Enemy ' + (idx + 1))) + '</div>'
        + '<div class="combatant-hp">Stress ' + stress + '/' + maxStress + '</div>'
        + '<div class="initiative-badge">E</div>'
        + '</div>';
    }).join('');

  list.innerHTML = playerRow + (hostileRows || '<div class="combatant-row"><div class="combatant-avatar">--</div><div class="combatant-name">No hostiles tracked</div><div class="combatant-hp">Stress 0/0</div><div class="initiative-badge">-</div></div>');
}

function setLiveBridgeMeta(text, isLive) {
  const syncText = document.getElementById('syncText');
  const syncDot = document.getElementById('syncDot');
  const bridgeMeta = document.getElementById('liveBridgeMeta');
  if (syncText) syncText.textContent = text;
  if (bridgeMeta) bridgeMeta.textContent = 'Live bridge: ' + text;
  if (syncDot) syncDot.style.background = isLive ? 'var(--green)' : 'var(--gold2)';
}

function syncFromExistingAppState() {
  const live = readLiveSObject();
  if (!live || !live.S) {
    setLiveBridgeMeta('local preview values', false);
    return;
  }
  const mapped = derivePreviewStateFromS(live.S);
  if (!mapped) {
    setLiveBridgeMeta('local preview values', false);
    return;
  }
  liveBridge.sourceLabel = live.source;
  liveBridge.lastSyncAt = Date.now();
  applyLivePreviewState(mapped);
  setLiveBridgeMeta('live from ' + live.source, true);
}

function renderStats() {
  const grid = document.getElementById('statGrid');
  if (!grid) return;
  grid.innerHTML = STATS.map((s) => `
    <div class="stat-row" onclick="quickRoll('${s.key}')">
      <div class="stat-die-display die-${s.die}">${s.die}</div>
      <div class="stat-info">
        <div class="stat-name">${s.label}</div>
        <div class="stat-desc">${s.sub}</div>
      </div>
      <div class="counter-controls">
        <button class="step-btn" onclick="event.stopPropagation();stepDie('${s.key}',-1)">-</button>
        <button class="step-btn" onclick="event.stopPropagation();stepDie('${s.key}',1)">+</button>
      </div>
    </div>
  `).join('');
}

function stepDie(key, dir) {
  const stat = STATS.find((x) => x.key === key);
  if (!stat) return;
  const idx = DIE_ORDER.indexOf(stat.die);
  const nextIdx = Math.max(0, Math.min(DIE_ORDER.length - 1, idx + dir));
  stat.die = DIE_ORDER[nextIdx];
  renderStats();
}

function quickRoll(key) {
  const stat = STATS.find((x) => x.key === key);
  if (!stat) return;
  const sides = parseInt(stat.die.slice(1), 10);
  const result = Math.ceil(Math.random() * sides);
  showDiceResult(result, stat.die, `${stat.label} Roll`);
  addRollHistory(result, stat.die);
}

function renderHealthPips() {
  const track = document.getElementById('healthPips');
  if (!track) return;
  track.innerHTML = '';
  for (let i = 0; i < state.maxHealth; i += 1) {
    const pip = document.createElement('div');
    pip.className = `pip${i < state.health ? ' filled' : ''}`;
    pip.onclick = () => {
      state.health = (i < state.health) ? i : i + 1;
      renderHealthPips();
      updateVitals();
    };
    track.appendChild(pip);
  }
}

function adjustHealth(delta) {
  state.health = Math.max(0, Math.min(state.maxHealth, state.health + delta));
  renderHealthPips();
  updateVitals();
}

function updateVitals() {
  const healthVal = document.getElementById('healthVal');
  if (healthVal) healthVal.textContent = state.health;
  const hpCur = document.getElementById('hpCur');
  if (hpCur) hpCur.textContent = state.health;
  updateVitalsHeader();
}

function updateVitalsHeader() {
  const hpBar = document.getElementById('hpBar');
  const stressBar = document.getElementById('stressBar');
  const hpCur = document.getElementById('hpCur');
  const hpMax = document.getElementById('hpMax');
  const stressCur = document.getElementById('stressCur');
  const stressMax = document.getElementById('stressMax');

  if (hpBar) hpBar.style.width = `${(state.health / state.maxHealth) * 100}%`;
  if (stressBar) stressBar.style.width = `${(state.stress / state.maxStress) * 100}%`;
  if (hpCur) hpCur.textContent = state.health;
  if (hpMax) hpMax.textContent = state.maxHealth;
  if (stressCur) stressCur.textContent = state.stress;
  if (stressMax) stressMax.textContent = state.maxStress;
}

function updateRenown() {
  const renownVal = document.getElementById('renownVal');
  if (renownVal) renownVal.textContent = state.renown;
  const tier = [...RENOWN_TIERS].reverse().find((t) => state.renown >= t[0]) || RENOWN_TIERS[0];
  const renownTier = document.getElementById('renownTier');
  const renownDesc = document.getElementById('renownDesc');
  if (renownTier) renownTier.textContent = tier[1];
  if (renownDesc) renownDesc.textContent = tier[2];
}

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  const panel = document.getElementById(`tab-${name}`);
  if (panel) panel.classList.add('active');
  const navItem = document.querySelector(`[data-tab="${name}"]`);
  if (navItem) navItem.classList.add('active');
  window.scrollTo(0, 0);
}

function setCtx(btn) {
  document.querySelectorAll('.ctx-btn').forEach((b) => b.classList.remove('on'));
  btn.classList.add('on');
}

function toggleCond(btn) {
  btn.classList.toggle('on');
}

function delta(key, amount) {
  if (key === 'renown') {
    state.renown = Math.max(0, state.renown + amount);
    updateRenown();
    return;
  }
  if (key === 'credits') {
    state.credits = Math.max(0, state.credits + amount);
    const creditsVal = document.getElementById('creditsVal');
    const headerCredits = document.getElementById('headerCredits');
    if (creditsVal) creditsVal.textContent = state.credits.toLocaleString();
    if (headerCredits) headerCredits.textContent = state.credits.toLocaleString();
    return;
  }
  if (key === 'trauma') {
    state.trauma = Math.max(0, state.trauma + amount);
    const traumaVal = document.getElementById('traumaVal');
    if (traumaVal) traumaVal.textContent = state.trauma;
    return;
  }
  if (key === 'turn') {
    state.turn = Math.max(1, state.turn + amount);
    const turnNum = document.getElementById('turnNum');
    if (turnNum) turnNum.textContent = state.turn;
  }
}

function rollDie(sides) {
  const result = Math.ceil(Math.random() * sides);
  showDiceResult(result, `d${sides}`, `d${sides} Roll`);
  addRollHistory(result, `d${sides}`);
}

function showDiceResult(result, dieType, label) {
  const area = document.getElementById('diceResultArea');
  if (!area) return;
  area.innerHTML = `
    <div class="dice-result-num">${result}</div>
    <div class="dice-result-label">${label}</div>
  `;
}

function addRollHistory(result, die) {
  state.rollHistory.unshift({ result, die });
  if (state.rollHistory.length > 8) state.rollHistory.pop();
  const history = document.getElementById('rollHistory');
  if (!history) return;
  history.innerHTML = state.rollHistory.map((row) => (
    `<span style="padding:0.2rem 0.45rem;border:1px solid var(--border-strong);border-radius:5px;font-size:0.7rem;color:var(--text2);">${row.die}: <strong style="color:var(--text);">${row.result}</strong></span>`
  )).join('');
}

function rollAllStats() {
  const pick = ['d4', 'd6', 'd6', 'd8', 'd8', 'd10'];
  STATS.forEach((s) => {
    s.die = pick[Math.floor(Math.random() * pick.length)];
  });
  renderStats();
}

init();
