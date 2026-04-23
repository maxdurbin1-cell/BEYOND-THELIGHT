function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((tab) => tab.classList.remove("active"));

  const target = document.getElementById("tab-" + tabId);
  if (target) {
    target.classList.add("active");
  }
  if (btn) {
    btn.classList.add("active");
  }
  // AUDIO: Switch music based on tab
  if (typeof window.AudioManager !== "undefined") {
    window.AudioManager.switchTabMusic(tabId);
  }
  // Lazily mount feature panels on first visit
  if (tabId === "holding" && typeof window.mountHoldingPanel === "function") {
    window.mountHoldingPanel();
  }
  if (tabId === "holding" && typeof window.renderHoldingUI === "function") {
    window.renderHoldingUI();
  }
  if (tabId === "caravan" && typeof window.mountCaravanPanel === "function") {
    window.mountCaravanPanel();
  }
  if (tabId === "caravan" && typeof window.renderCaravanUI === "function") {
    window.renderCaravanUI();
  }
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value ?? "";
  }
}

function dieClass(value) {
  return "stat-die d" + value;
}

function applyDieSteps(baseDie, steps) {
  let result = baseDie;
  let remaining = steps;
  while (remaining > 0) {
    result = stepUp(result);
    remaining -= 1;
  }
  while (remaining < 0) {
    result = stepDown(result);
    remaining += 1;
  }
  return result;
}

function getConditionStep(key) {
  const tc = S.traumaConditions || {};
  if (["body", "strike", "shoot"].includes(key)) {
    return (S.conditions.empowered ? 1 : 0) - (S.conditions.weakened ? 1 : 0) - (tc.weakened ? 1 : 0);
  }
  if (key === "defend") {
    return (S.conditions.protected ? 1 : 0) - (S.conditions.vulnerable ? 1 : 0) - (tc.vulnerable ? 1 : 0);
  }
  if (["mind", "control"].includes(key)) {
    return (S.conditions.focused ? 1 : 0) - (S.conditions.distracted ? 1 : 0) - (tc.distracted ? 1 : 0);
  }
  if (["spirit", "lead"].includes(key)) {
    return (S.conditions.bolstered ? 1 : 0) - (S.conditions.shaken ? 1 : 0) - (tc.shaken ? 1 : 0);
  }
  return 0;
}

function getEffectiveDie(key) {
  const base = S.stats[key] || 4;
  return applyDieSteps(base, getConditionStep(key));
}

function updateDieDisplay(key) {
  const el = document.getElementById("die-" + key);
  if (!el) {
    return;
  }
  const value = key === "adventure" ? (S.stats.adventure || 4) : getEffectiveDie(key);
  let displayText = "d" + value;

  // Append weapon/armor bonus hints so the player can see what will be rolled
  if ((key === 'strike' || key === 'shoot') && typeof parseWeaponBonuses === 'function') {
    const wb = parseWeaponBonuses(key);
    if (wb.advDie > 0) displayText += '/Ad' + wb.advDie;
    else if (wb.flat > 0) displayText += '+' + wb.flat;
    if (wb.addAdvDie) displayText += '+A.D.';
  } else if (key === 'defend') {
    const armorAdv = typeof parseArmorAdvDie === 'function' ? parseArmorAdvDie() : 0;
    const wpDef = typeof parseWeaponBonuses === 'function' ? parseWeaponBonuses('defend') : {flat:0, advDie:0, addAdvDie:false};
    const advDie = Math.max(armorAdv, wpDef.advDie);
    if (advDie > 0) displayText += '/Ad' + advDie;
    if (wpDef.flat > 0) displayText += '+' + wpDef.flat;
    if (wpDef.addAdvDie) displayText += '+A.D.';
  }
  // Flavor / Mutation advantage hints for all stats
  const flB = typeof getFlavorBonus === 'function' ? getFlavorBonus(key) : {advDie:0};
  const mtB = typeof getMutationBonus === 'function' ? getMutationBonus(key) : {advDie:0};
  const flMtAdv = Math.max(flB.advDie || 0, mtB.advDie || 0);
  if (flMtAdv > 0) displayText += '/Ad' + flMtAdv;
  // Augmentation additive bonus hint
  const augDie = typeof getAugBonus === 'function' ? getAugBonus(key) : 0;
  if (augDie > 0) displayText += '+d' + augDie;

  el.textContent = displayText;
  el.className = dieClass(value);
  el.style.cursor = "pointer";
}

function updateMaxStressDisplay() {
  const maxStress = getEffectiveDie("defend") * 2;
  const maxVal = document.getElementById("maxStressVal");
  const calc = document.getElementById("maxStressCalc");
  if (maxVal) {
    maxVal.textContent = maxStress;
  }
  if (calc) {
    calc.textContent = "Defend d" + getEffectiveDie("defend") + " -> " + maxStress + " max Stress";
  }
  if (S.stress > maxStress) {
    S.stress = maxStress;
  }
}

function updateAllStatDisplays() {
  STAT_KEYS.forEach(updateDieDisplay);
  updateDieDisplay("adventure");
  updateMaxStressDisplay();
  updateStressUI();
}

function buildStatRows() {
  const container = document.getElementById("statRows");
  if (!container) {
    return;
  }

  container.innerHTML = STAT_KEYS.map((key, index) => {
    return `
      <div class="stat-row">
        <div>
          <div class="stat-label">${STAT_NAMES[index]}</div>
          <div class="stat-sub">${STAT_SUBS[index]}</div>
        </div>
        <div class="stat-controls">
          <button class="step-btn" onclick="stepDie('${key}',-1)">-</button>
          <span class="stat-die" id="die-${key}" onclick="quickRollStat('${key}')">d4</span>
          <button class="step-btn" onclick="stepDie('${key}',1)">+</button>
        </div>
      </div>`;
  }).join("");

  updateAllStatDisplays();
}

function stepDie(key, delta) {
  if (!(key in S.stats)) {
    return;
  }
  S.stats[key] = delta > 0 ? stepUp(S.stats[key]) : stepDown(S.stats[key]);
  updateAllStatDisplays();
}

function quickRollStat(key) {
  const die = key === "adventure" ? (S.stats.adventure || 4) : getEffectiveDie(key);
  const label = key.charAt(0).toUpperCase() + key.slice(1);

  // Collect advantage dice from weapons/armor, flavor, mutation, and manual rollMod
  let advDiceArr = [], flatBonus = 0, addAdvDie = false;
  if ((key === 'strike' || key === 'shoot') && typeof parseWeaponBonuses === 'function') {
    const wb = parseWeaponBonuses(key);
    if (wb.advDie > 0) advDiceArr.push(wb.advDie);
    flatBonus = wb.flat;
    addAdvDie = wb.addAdvDie;
  } else if (key === 'defend') {
    const armorAdv = typeof parseArmorAdvDie === 'function' ? parseArmorAdvDie() : 0;
    const wpDef = typeof parseWeaponBonuses === 'function' ? parseWeaponBonuses('defend') : {flat:0, advDie:0, addAdvDie:false};
    if (armorAdv > 0) advDiceArr.push(armorAdv);
    if (wpDef.advDie > 0) advDiceArr.push(wpDef.advDie);
    flatBonus = wpDef.flat;
    addAdvDie = wpDef.addAdvDie;
  }

  // Personal Flavor / Mutation bonuses — collect their advDice arrays
  const flB = typeof getFlavorBonus === 'function' ? getFlavorBonus(key) : {flat:0, advDie:0, advDice:[], holyShield:false};
  const mtB = typeof getMutationBonus === 'function' ? getMutationBonus(key) : {flat:0, advDie:0, advDice:[]};
  advDiceArr = advDiceArr.concat(flB.advDice || []).concat(mtB.advDice || []);
  flatBonus += flB.flat + mtB.flat;

  // Manual rollMod
  const mod = S && S.rollMod ? S.rollMod : {advDice:[], flat:0};
  if (Array.isArray(mod.advDice)) advDiceArr = advDiceArr.concat(mod.advDice);
  flatBonus += mod.flat || 0;

  // Augmentation additive bonus
  const augDie = typeof getAugBonus === 'function' ? getAugBonus(key) : 0;

  // Roll base die + ALL advantage dice, take highest
  const ra = typeof rollWithAdvantage === 'function'
    ? rollWithAdvantage(die, advDiceArr)
    : {total: explodingRoll(die).total, base: explodingRoll(die), advRolls: [], breakdown: '', exploded: false};
  const a = ra.base;

  // +N flat bonus
  let withFlat = ra.total + flatBonus;
  // Holy Shield: add spirit die (Flavor)
  const holyShieldRoll = flB.holyShield ? explodingRoll(S.stats.spirit || 4) : null;
  if (holyShieldRoll) withFlat += holyShieldRoll.total;
  // +A.D. additive adventure die
  const adBonus = addAdvDie ? explodingRoll(S.stats.adventure || 4) : null;
  const withAD = withFlat + (adBonus ? adBonus.total : 0);
  // Augmentation additive
  const augRoll = augDie > 0 ? explodingRoll(augDie) : null;
  const total = withAD + (augRoll ? augRoll.total : 0);
  const radPenalty = (typeof getRadPenaltyForStat === 'function') ? getRadPenaltyForStat(key) : 0;
  const finalTotal = Math.max(0, total - radPenalty);

  // Build detail breakdown
  const details = [];
  if (ra.advRolls.length) details.push(ra.breakdown.replace(/<[^>]+>/g, '').trim()); // plain-text from breakdown
  if (ra.advRolls.length === 0 && advDiceArr.length === 0) {} // no adv dice, no note needed
  if (flatBonus > 0) details.push('+' + flatBonus + ' (weapon/flavor/mutation/mod)');
  if (holyShieldRoll) details.push('Holy Shield +Spirit d' + (S.stats.spirit||4) + ' = ' + holyShieldRoll.total);
  if (adBonus) details.push('+A.D. d' + (S.stats.adventure || 4) + ' = ' + adBonus.total + ' (additive)');
  if (augRoll) details.push('+d' + augDie + ' aug = ' + augRoll.total);
  if (radPenalty > 0) details.push('-' + radPenalty + ' Radiation penalty');
  if (mod.advDice.length || mod.flat) details.push('Manual modifier active');

  const detailHtml = (ra.breakdown || details.length)
    ? '<div style="font-size:.8rem;color:var(--muted2);margin-top:.3rem;">' + (ra.breakdown || '') + (details.slice(1).length ? '<br>' + details.slice(1).join('<br>') : '') + '</div>'
    : '';

  openModal(
    label + " Roll",
    '<div style="font-size:.95rem;color:var(--text2);line-height:1.7;">' +
      '<strong style="color:var(--teal);">' + label + ' d' + die + '</strong>' +
      (ra.exploded ? ' <span style="color:var(--gold);">✦ Critical!</span>' : '') +
      '<br>Result: <strong style="color:var(--gold2);">' + finalTotal + '</strong>' +
      detailHtml +
      "</div>"
  );

  // Clear positive condition on use (one-shot mechanic)
  if (typeof clearConditionOnUse === 'function') clearConditionOnUse(key);
}

function updateRenown() {
  const current = S.renown || 0;
  const band = RENOWN_TITLES.find((item) => current >= item.min && current <= item.max) || RENOWN_TITLES[0];
  const val = document.getElementById("renownVal");
  const badge = document.getElementById("renownBadge");
  const desc = document.getElementById("renownDesc");
  if (val) {
    val.textContent = current;
  }
  if (badge) {
    badge.textContent = band.title;
  }
  if (desc) {
    desc.textContent = band.desc;
  }
}

function updateCreditsUI() {
  const amount = (S.credits || 0) + " \u20b5";
  const ids = ["creditsVal", "headerCredits", "shopCredits"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = amount;
    }
  });
}

function setStress(value) {
  const maxStress = getEffectiveDie("defend") * 2;
  const oldStress = S.stress || 0;
  S.stress = Math.max(0, Math.min(value, maxStress));
  
  // AUDIO: Play sound if stress increased
  if (typeof window.AudioManager !== "undefined" && S.stress > oldStress) {
    window.AudioManager.stressIncreased();
  }
  
  updateStressUI();
}

function updateStressUI() {
  const maxStress = getEffectiveDie("defend") * 2;
  if (S.stress > maxStress) {
    S.stress = maxStress;
  }
  const stressVal = document.getElementById("stressVal");
  if (stressVal) {
    stressVal.textContent = S.stress || 0;
  }

  const track = document.getElementById("stressPips");
  if (!track) {
    return;
  }

  track.innerHTML = Array.from({ length: maxStress }, (_, index) => {
    const filled = index < (S.stress || 0) ? " filled" : "";
    return '<div class="s-pip' + filled + '" onclick="setStress(' + (index + 1) + ')"></div>';
  }).join("");
}

function changeStress(delta) {
  setStress((S.stress || 0) + delta);
}

function halfStress() {
  setStress(Math.floor((S.stress || 0) / 2));
}

function clearStress() {
  setStress(0);
}

function updateTrauma() {
  const trauma = S.trauma || 0;
  const val = document.getElementById("traumaVal");
  const effect = document.getElementById("traumaEffect");
  if (val) {
    val.textContent = trauma;
  }

  // Sync permanent trauma conditions (cumulative, cleared only by Sage).
  if (!S.traumaConditions) {
    S.traumaConditions = { weakened: false, distracted: false, shaken: false, vulnerable: false };
  }
  S.traumaConditions.weakened    = trauma >= 1;
  S.traumaConditions.distracted  = trauma >= 3;
  S.traumaConditions.shaken      = trauma >= 5;
  S.traumaConditions.vulnerable  = trauma >= 6;

  // Update stat dice immediately so the die steps are reflected everywhere.
  if (typeof updateAllStatDisplays === 'function') updateAllStatDisplays();
  if (typeof updateConditionButtons === 'function') updateConditionButtons();

  if (!effect) { return; }

  if (trauma === 0) {
    effect.textContent = "No current Trauma effects.";
  } else {
    const active = [];
    if (S.traumaConditions.weakened)   active.push("Weakened (Body/Strike/Shoot ↓)");
    if (S.traumaConditions.distracted) active.push("Distracted (Mind/Control ↓)");
    if (S.traumaConditions.shaken)     active.push("Shaken (Spirit/Lead ↓)");
    if (S.traumaConditions.vulnerable) active.push("Vulnerable (Defend ↓)");
    effect.textContent = "Trauma: " + active.join(" · ");
  }
}

function changeTrauma(delta) {
  if (delta > 0) {
    // AUDIO: Trauma received
    if (typeof window.AudioManager !== "undefined") {
      window.AudioManager.traumaReceived();
    }
  }
  S.trauma = Math.max(0, (S.trauma || 0) + delta);
  updateTrauma();
}

function updateTMWPool() {
  const value = S.tmw || 0;
  const pool = document.getElementById("tmwPoolDisplay");
  const dice = document.getElementById("tmwDiceDisplay");
  const val = document.getElementById("tmwVal");

  if (val) {
    val.textContent = value;
  }
  if (dice) {
    dice.textContent = value;
  }
  if (pool) {
    pool.innerHTML = Array.from({ length: value }, () => '<div class="tmw-pip"></div>').join("");
  }
}

function changeCounter(key, delta) {
  if (!(key in S)) {
    return;
  }
  S[key] = Math.max(0, (S[key] || 0) + delta);

  if (key === "renown") {
    updateRenown();
    return;
  }
  if (key === "tmw") {
    // AUDIO: TMW gained
    if (typeof window.AudioManager !== "undefined" && delta > 0) {
      window.AudioManager.tmwGained();
    }
    updateTMWPool();
    return;
  }

  const el = document.getElementById(key + "Val");
  if (el) {
    el.textContent = S[key];
  }
}

function addSuccessRoll() {
  S.successRolls = (S.successRolls || 0) + 1;
  var srEl = document.getElementById("successRollsVal");
  if (srEl) { srEl.textContent = S.successRolls; }
  if (S.successRolls >= 3) {
    S.successRolls = 0;
    if (srEl) { srEl.textContent = "0"; }
    changeCounter("pathTokens", 1);
    showNotif("3 successful rolls — +1 Path Token!", "good");
  }
}

// Every failed roll grants +1 TMW (or +2 if the "Failed rolls grant +2" flavor is active).
function addTMWOnFail() {
  var amt = (S.flavor || '').toLowerCase().indexOf('failed rolls grant +2') >= 0 ? 2 : 1;
  changeCounter('tmw', amt);
}

function updateConditionButtons() {
  Object.entries(S.conditions || {}).forEach(([key, on]) => {
    const el = document.getElementById("cond-" + key);
    if (el) {
      el.classList.toggle("on", !!on);
    }
  });
  // Show trauma-locked negative conditions with a distinct style.
  const tc = S.traumaConditions || {};
  ['weakened','distracted','shaken','vulnerable'].forEach(function(key) {
    const el = document.getElementById("cond-" + key);
    if (el) {
      el.classList.toggle("trauma-on", !!tc[key]);
    }
  });
}

function toggleCond(key) {
  if (!(key in S.conditions)) {
    return;
  }
  S.conditions[key] = !S.conditions[key];
  updateConditionButtons();
  updateAllStatDisplays();
}

function clearAllConditions() {
  // Only clear temporary combat conditions; trauma conditions are permanent.
  Object.keys(S.conditions).forEach((key) => {
    S.conditions[key] = false;
  });
  const result = document.getElementById("passionResult");
  if (result) {
    result.textContent = "";
  }
  updateConditionButtons();
  updateAllStatDisplays();
}

function rollPassion() {
  clearAllConditions();
  const rolled = roll(8);
  let condition;
  if (rolled <= 2) {
    condition = "empowered";
  } else if (rolled <= 4) {
    condition = "protected";
  } else if (rolled <= 6) {
    condition = "focused";
  } else {
    condition = "bolstered";
  }
  S.conditions[condition] = true;
  updateConditionButtons();
  updateAllStatDisplays();

  const el = document.getElementById("passionResult");
  if (el) {
    el.textContent = "Passion d8 = " + rolled + ". Gained " + condition.charAt(0).toUpperCase() + condition.slice(1) + ".";
  }
}

function renderTraits() {
  const container = document.getElementById("traitsDisplay");
  if (!container) {
    return;
  }
  const keys = Object.keys(TRAITS);
  if (!keys.some((key) => S.traits && S.traits[key])) {
    container.innerHTML = '<div style="font-size:.8rem;color:var(--muted2);">No traits rolled yet.</div>';
    return;
  }

  container.innerHTML = keys.map((key) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const value = (S.traits && S.traits[key]) || "-";
    return (
      '<div class="stat-row">' +
      '<div class="stat-label">' + label + "</div>" +
      '<div style="font-size:.84rem;color:var(--text2);">' + value + "</div>" +
      "</div>"
    );
  }).join("");
}

function rollAllTraits() {
  S.traits = {};
  Object.entries(TRAITS).forEach(([key, values]) => {
    S.traits[key] = pick(values);
  });
  renderTraits();
}

function syncCharacterFields() {
  setInputValue("charName", S.name);
  setInputValue("charBackground", S.background);
  setInputValue("charAge", S.age);
  setInputValue("charOmen", S.omen);
  setInputValue("charReason", S.reason);
  setInputValue("charFlavor", S.flavor);
  setInputValue("charMutation", S.mutation);
  setInputValue("charItem", S.randomItem);
  setInputValue("eqWeapon1", S.equipment.weapon1);
  setInputValue("eqWeapon2", S.equipment.weapon2);
  setInputValue("eqArmor", S.equipment.armor);
  setInputValue("eqReadied", S.equipment.readied);
  S.backpack.forEach((item, index) => setInputValue("bp" + index, item));
}

function rollName() {
  S.name = pick(Math.random() < 0.5 ? NAMES.f : NAMES.m) + " " + pick(NAMES.l);
  setInputValue("charName", S.name);
}

function rollBackground() {
  S.background = pick(CAREERS);
  setInputValue("charBackground", S.background);
}

function rollOmen() {
  S.omen = pick(OMENS);
  setInputValue("charOmen", S.omen);
}

function rollReason() {
  S.reason = pick(REASONS);
  setInputValue("charReason", S.reason);
}

function rollFlavor() {
  S.flavor = pick(PERSONAL_FLAVORS);
  setInputValue("charFlavor", S.flavor);
}

function rollMutation() {
  S.mutation = pick(MUTATIONS);
  setInputValue("charMutation", S.mutation);
}

function rollRandomItem() {
  S.randomItem = pick(RANDOM_ITEMS);
  setInputValue("charItem", S.randomItem);
}

function rollArmor() {
  S.equipment.armor = pick(SHOP_DATA.armor).name;
  setInputValue("eqArmor", S.equipment.armor);
}

function rollBackpack() {
  // Pull starting gear from any shop category (the Merchant is fair game).
  var weapons = [].concat(SHOP_DATA.weapons || [], SHOP_DATA.melee_exp || [], SHOP_DATA.ranged_exp || []);
  var armors  = [].concat(SHOP_DATA.armor   || [], SHOP_DATA.armor_exp  || []);
  var bonusPool = [].concat(
    SHOP_DATA.scrolls   || [],
    SHOP_DATA.items     || [],
    SHOP_DATA.toolkits  || [],
    SHOP_DATA.essentials || [],
    SHOP_DATA.remedies  || []
  );

  var weapon = pick(weapons);
  var armor  = pick(armors);
  var bonus  = pick(bonusPool);

  // Format weapon for the equipment slot (stat needed for roll parsing).
  var wpStat = (weapon.stat || '').split('|')[0].trim();
  S.equipment.weapon1 = wpStat ? weapon.name + ' (' + wpStat + ')' : weapon.name;

  // Format armor for the equipment slot — include both the die AND actions so parsers work.
  var arStat = (armor.stat || '').replace(/\s*\|\s*/, ', ');
  S.equipment.armor = arStat ? armor.name + ' (' + arStat + ')' : armor.name;

  S.backpack = ['', '', '', '', '', ''];
  // Store bonus item by name only (findShopItem will locate its full data when used).
  S.backpack[0] = bonus.name;

  syncCharacterFields();
}

function randomStatDie() {
  return pick([4, 4, 6, 6, 6, 8, 8, 10]);
}

function rollSoulArray() {
  S.soulArray = [...pick(SOUL_ARRAYS)];
  const display = document.getElementById("soulArrayDisplay");
  if (display) {
    display.textContent = "Rolled array: " + S.soulArray.join(", ");
  }
}

function assignArray() {
  if (!S.soulArray || !S.soulArray.length) {
    rollSoulArray();
  }
  const sorted = [...S.soulArray].sort((a, b) => b - a);
  STAT_KEYS.forEach((key, index) => {
    S.stats[key] = sorted[index] || 4;
  });
  updateAllStatDisplays();
}

function rollAllStats() {
  STAT_KEYS.forEach((key) => {
    S.stats[key] = randomStatDie();
  });
  updateAllStatDisplays();
}

function generateCharacter() {
  rollName();
  rollBackground();
  S.age = pick(["Youth (0-29)", "Endeavor (30-59)", "Twilight (60-100)"]);
  rollOmen();
  rollReason();
  rollFlavor();
  rollMutation();
  rollRandomItem();
  rollSoulArray();
  assignArray();
  rollBackpack();
  rollAllTraits();
  S.stats.adventure = pick([4, 6, 8]);
  S.credits = rollMulti(6, 2) * 10;
  S.renown = 0;
  S.stress = 0;
  S.trauma = 0;
  S.pathTokens = 0;
  S.tmw = 0;
  S.successRolls = 0;
  S.traumaConditions = { weakened: false, distracted: false, shaken: false, vulnerable: false };
  clearAllConditions();
  syncCharacterFields();
  updateAllStatDisplays();
  updateCreditsUI();
  updateRenown();
  updateTrauma();
  updateTMWPool();
  changeCounter("pathTokens", 0);
  changeCounter("successRolls", 0);
  showNotif("Wayfarer generated", "good");
}

function clearCharacter() {
  S.name = "";
  S.background = "";
  S.age = "";
  S.omen = "";
  S.reason = "";
  S.renown = 0;
  S.credits = 0;
  S.stress = 0;
  S.trauma = 0;
  S.pathTokens = 0;
  S.tmw = 0;
  S.successRolls = 0;
  S.flavor = "";
  S.mutation = "";
  S.randomItem = "";
  S.equipment = { weapon1: "", weapon2: "", armor: "", readied: "" };
  S.backpack = ["", "", "", "", "", ""];
  S.soulArray = [];
  S.stats = { body: 4, strike: 4, shoot: 4, mind: 4, spirit: 4, defend: 4, control: 4, lead: 4, adventure: 4 };
  S.traits = {};
  S.augmentations = [];
  S.ownedHacks    = [];
  S.weaponMods    = [];
  S.hackRoller    = { dreadDie: 6, guess: null, selectedHack: null };
  S.traumaConditions = { weakened: false, distracted: false, shaken: false, vulnerable: false };
  clearAllConditions();
  syncCharacterFields();
  buildStatRows();
  updateRenown();
  updateCreditsUI();
  updateStressUI();
  updateTrauma();
  renderTraits();
  updateTMWPool();
  if (typeof renderOSHacksPanel   === 'function') { renderOSHacksPanel(); }
  if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
}

function saveCharacter() {
  try {
    localStorage.setItem("beyond-light-character", JSON.stringify(S));
    showNotif("Character saved", "good");
  } catch (error) {
    showNotif("Could not save character", "warn");
  }
}

function loadCharacter() {
  try {
    const raw = localStorage.getItem("beyond-light-character");
    if (!raw) {
      showNotif("No saved character found", "warn");
      return;
    }
    const saved = JSON.parse(raw);
    S = {
      ...S,
      ...saved,
      equipment: { ...S.equipment, ...(saved.equipment || {}) },
      backpack: Array.isArray(saved.backpack) ? saved.backpack.slice(0, 6) : S.backpack,
      conditions: { ...S.conditions, ...(saved.conditions || {}) },
      stats: { ...S.stats, ...(saved.stats || {}) },
      traits: { ...(saved.traits || {}) },
      combat: {
        ...S.combat,
        ...(saved.combat || {}),
        armyA: { ...S.combat.armyA, ...((saved.combat && saved.combat.armyA) || {}) },
        armyB: { ...S.combat.armyB, ...((saved.combat && saved.combat.armyB) || {}) }
      }
    };
    syncCharacterFields();
    buildStatRows();
    updateRenown();
    updateCreditsUI();
    updateStressUI();
    updateTrauma();
    renderTraits();
    updateTMWPool();
    updateConditionButtons();
    renderEnemies();
    updateCombatUI();
    if (typeof renderOSHacksPanel   === 'function') { renderOSHacksPanel(); }
    if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
    showNotif("Character loaded", "good");
  } catch (error) {
    showNotif("Saved character is invalid", "warn");
  }
}

function promptCredits() {
  const response = prompt("Set credits:", String(S.credits || 0));
  if (response === null) {
    return;
  }
  const value = Number.parseInt(response, 10);
  if (Number.isNaN(value)) {
    showNotif("Credits must be a number", "warn");
    return;
  }
  S.credits = Math.max(0, value);
  updateCreditsUI();
}

function changeCredits(delta) {
  S.credits = Math.max(0, (S.credits || 0) + delta);
  updateCreditsUI();
}

function rollCredits() {
  S.credits = rollMulti(6, 2) * 10;
  updateCreditsUI();
}

window.selectedDice = window.selectedDice || { action: 4, dread: 6 };

function selectDie(kind, value) {
  window.selectedDice[kind] = value;
  const containerId = kind === "action" ? "actionDiceOpts" : "dreadDiceOpts";
  const selectedClass = kind === "action" ? "sel" : "dread-sel";
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.querySelectorAll(".d-opt").forEach((opt) => {
    opt.classList.remove("sel", "dread-sel");
    if (Number.parseInt(opt.dataset.v, 10) === value) {
      opt.classList.add(selectedClass);
    }
  });
}

function renderCheckResult(actionDie, dreadDie, actionRoll, dreadRoll, success) {
  const dice = document.getElementById("resDice");
  const outcome = document.getElementById("resOutcome");
  const stress = document.getElementById("resStress");
  const note = document.getElementById("resNote");

  if (dice) {
    dice.innerHTML =
      '<div class="res-die"><span class="res-val" style="color:var(--teal);">' + actionRoll.total +
      '</span><span class="res-lbl">Action d' + actionDie + '</span></div>' +
      '<div style="font-family:\'Rajdhani\',sans-serif;font-size:1.5rem;color:var(--border2);">vs</div>' +
      '<div class="res-die"><span class="res-val" style="color:var(--red);">' + dreadRoll.total +
      '</span><span class="res-lbl">Dread d' + dreadDie + "</span></div>";
  }
  if (outcome) {
    outcome.textContent = success ? "Success" : "Failure";
    outcome.className = "res-outcome " + (success ? (actionRoll.exploded ? "crit" : "success") : "fail");
  }
  if (stress) {
    const delta = Math.max(1, dreadRoll.total - actionRoll.total);
    stress.textContent = success ? "" : "Failure cost: +" + delta + " Stress";
  }
  if (note) {
    const extra = [];
    if (actionRoll.exploded) {
      extra.push("Action die exploded.");
    }
    if (dreadRoll.exploded) {
      extra.push("Dread die exploded.");
    }
    note.textContent = extra.join(" ");
  }
}

function rollCheck() {
  const actionDie = window.selectedDice.action;
  const dreadDie = window.selectedDice.dread;
  const actionRoll = explodingRoll(actionDie);
  const dreadRoll = explodingRoll(dreadDie);
  const success = actionRoll.total >= dreadRoll.total;

  renderCheckResult(actionDie, dreadDie, actionRoll, dreadRoll, success);
  if (!success) {
    addTMWOnFail();
    changeStress(Math.max(1, dreadRoll.total - actionRoll.total));
  } else {
    addSuccessRoll();
  }
}

function rollSingle(kind) {
  const die = window.selectedDice[kind];
  const result = explodingRoll(die);
  showNotif((kind === "action" ? "Action" : "Dread") + " d" + die + ": " + result.total, result.exploded ? "good" : "");
}

function rollWilderness() {
  const result = roll(6);
  let text = "";
  if (result === 1) {
    text = "Random Event";
  } else if (result <= 3) {
    text = "Nearest Event";
  } else {
    text = "All Clear";
  }
  const el = document.getElementById("wildResult");
  if (el) {
    el.style.display = "block";
    el.innerHTML =
      '<div class="wild-roll-output"><div class="wild-section" style="border-bottom:none;">' +
      '<div class="wild-section-label">Quick Wilderness Roll</div>' +
      '<div class="wild-section-text">d6=' + result + " - " + text + "</div></div></div>";
  }
}

function rollFreedie(sides) {
  const result = sides === 100 ? Math.floor(Math.random() * 100) + 1 : explodingRoll(sides).total;
  const el = document.getElementById("freeDiceResult");
  if (el) {
    el.textContent = "d" + sides + ": " + result;
  }
}
