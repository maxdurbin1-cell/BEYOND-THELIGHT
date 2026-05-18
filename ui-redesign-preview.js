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

function init() {
  renderStats();
  renderHealthPips();
  updateVitalsHeader();
  updateRenown();
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
