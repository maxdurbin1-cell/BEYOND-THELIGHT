function ensureSpaceShopCategories() {
  if (typeof SHOP_DATA !== "object" || !SHOP_DATA) return;

  if (!SHOP_DATA.space_armor && Array.isArray(window.SPACE_ARMOR)) {
    SHOP_DATA.space_armor = window.SPACE_ARMOR.slice();
  }
  if (!SHOP_DATA.cosmic && Array.isArray(window.COSMIC_ESSENTIALS)) {
    SHOP_DATA.cosmic = window.COSMIC_ESSENTIALS.slice();
  }
  if (!SHOP_DATA.starship_fuel && Array.isArray(window.STARSHIP_FUEL)) {
    SHOP_DATA.starship_fuel = window.STARSHIP_FUEL.slice();
  }

  var cats = document.querySelector('.shop-cats');
  if (!cats) return;

  var defs = [
    { id: 'cosmic', icon: '🌌', label: 'Cosmic' },
    { id: 'space_armor', icon: '🧑‍🚀', label: 'Space Armor' },
    { id: 'exocrafts', icon: '🤖', label: 'Exocrafts' },
    { id: 'starship_fuel', icon: '⛽', label: 'Starship Fuel' }
  ];

  defs.forEach(function(def) {
    if (cats.querySelector('.scat[onclick*="' + def.id + '"]')) return;
    var b = document.createElement('button');
    b.className = 'scat';
    b.setAttribute('onclick', "showShopCat('" + def.id + "',this)");
    b.textContent = def.icon + ' ' + def.label;
    cats.appendChild(b);
  });
}

const QUICK_ACCESS_MAX = 8;

function getTabLabelFromButton(btn, tabId) {
  if (!btn) return String(tabId || 'Tab');
  const txt = (btn.textContent || '').replace(/\s+/g, ' ').trim();
  return txt || String(tabId || 'Tab');
}

function getNavTabButton(tabId) {
  if (!tabId) return null;
  return document.querySelector("nav .tab-btn[onclick*=\"switchTab('" + tabId + "'\"]");
}

function getPreferredContextForTabButton(btn) {
  if (!btn) return null;
  if (btn.classList.contains('ctx-traveling')) return 'traveling';
  if (btn.classList.contains('ctx-holding')) return 'holding';
  if (btn.classList.contains('ctx-sea')) return 'sea';
  if (btn.classList.contains('ctx-space')) return 'space';
  return null;
}

function trackQuickAccessTab(tabId) {
  if (!tabId) return;
  window._quickAccessTabs = Array.isArray(window._quickAccessTabs) ? window._quickAccessTabs : [];
  const next = [tabId].concat(window._quickAccessTabs.filter(function(id) { return id !== tabId; }));
  window._quickAccessTabs = next.slice(0, QUICK_ACCESS_MAX);
}

function quickAccessGo(tabId) {
  if (!tabId) return;
  let btn = getNavTabButton(tabId);
  if (!btn) return;
  const hidden = (btn.style && btn.style.display === 'none');
  if (hidden && typeof setContext === 'function') {
    const ctx = getPreferredContextForTabButton(btn);
    if (ctx) {
      const ctxBtn = document.querySelector('.ctx-btn[data-ctx="' + ctx + '"]');
      setContext(ctx, ctxBtn || null);
      btn = getNavTabButton(tabId) || btn;
    }
  }
  switchTab(tabId, btn || null);
}

function renderGlobalQuickAccess() {
  const root = document.getElementById('globalQuickAccess');
  if (!root) return;
  const header = document.querySelector('header');
  if (header) {
    root.style.top = header.offsetHeight + 'px';
  }
  if (!Array.isArray(window._quickAccessTabs) || !window._quickAccessTabs.length) {
    const activePanel = document.querySelector('.tab-panel.active[id^="tab-"]');
    if (activePanel) {
      const id = activePanel.id.replace(/^tab-/, '');
      if (id) trackQuickAccessTab(id);
    }
  }
  const history = Array.isArray(window._quickAccessTabs) ? window._quickAccessTabs : [];
  let html = '<span class="qa-label">Quick Access</span>';
  if (!history.length) {
    html += '<span class="qa-empty">Visit tabs to pin your recent route.</span>';
    root.innerHTML = html;
    return;
  }

  history.forEach(function(tabId) {
    const btn = getNavTabButton(tabId);
    if (!btn) return;
    const label = getTabLabelFromButton(btn, tabId);
    html += '<button class="btn btn-sm" onclick="quickAccessGo(\'' + String(tabId).replace(/'/g, "&#39;") + '\')">' + label + '</button>';
  });
  root.innerHTML = html;
}

window.quickAccessGo = quickAccessGo;
window.renderGlobalQuickAccess = renderGlobalQuickAccess;

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll(".tab-btn[role='tab']").forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });

  const target = document.getElementById("tab-" + tabId);
  if (target) {
    target.classList.add("active");
    target.setAttribute("aria-hidden", "false");
    target.removeAttribute("aria-hidden");
  }
  if (btn) {
    btn.classList.add("active");
    if (btn.hasAttribute("aria-selected")) btn.setAttribute("aria-selected", "true");
  }
  trackQuickAccessTab(tabId);
  renderGlobalQuickAccess();
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
  if (tabId === "galaxy") {
    if (typeof window.buildGalaxyPanel === "function") {
      window.buildGalaxyPanel();
    }
    if (typeof window.renderStarSystemMap === "function") {
      setTimeout(function () { window.renderStarSystemMap(); }, 0);
    }
  }

  if (tabId === "combat") {
    if (typeof window.buildStarsCombatPanel === "function") {
      window.buildStarsCombatPanel();
    }
    if (typeof window.renderStarsCombatZone === "function") {
      setTimeout(function () { window.renderStarsCombatZone(1); }, 0);
    }
  }

  if (tabId === "naval") {
    if (typeof window.renderNaval === "function") {
      window.renderNaval();
    }
    if (typeof window.applySpaceNavalPresentation === "function") {
      window.applySpaceNavalPresentation();
    }
  }

  if (tabId === "planet") {
    if (typeof window.renderPlanetExplorationPanel === "function") {
      window.renderPlanetExplorationPanel();
    }
  }

  if (tabId === "exocrafts") {
    if (typeof window.renderExocraftPanel === "function") {
      window.renderExocraftPanel();
    }
  }

  if (tabId === "shop") {
    ensureSpaceShopCategories();
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    renderGlobalQuickAccess();
    window.addEventListener('resize', renderGlobalQuickAccess);
  });
} else {
  renderGlobalQuickAccess();
  window.addEventListener('resize', renderGlobalQuickAccess);
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
  const gearBonus = typeof getGearRollBonuses === 'function' ? getGearRollBonuses(key, value) : {advDice:[], flat:0, addDice:[]};
  if (gearBonus.advDice && gearBonus.advDice.length) displayText += '/Ad' + Math.max.apply(null, gearBonus.advDice);
  if (gearBonus.addDice && gearBonus.addDice.length) displayText += '+d' + gearBonus.addDice.join('+d');
  if (gearBonus.flat > 0) displayText += '+' + gearBonus.flat;
  const relicBonusCount = typeof getPermanentAdventureBonusCount === 'function' ? getPermanentAdventureBonusCount(key) : 0;
  if (relicBonusCount > 0) displayText += '+A.D.' + (relicBonusCount > 1 ? 'x' + relicBonusCount : '');

  el.textContent = displayText;
  el.className = dieClass(value);
  el.style.cursor = "pointer";
}

function updateMaxStressDisplay() {
  const bonus = Math.max(0, Number(S.tempStressCapacityBonus || 0));
  const maxStress = getEffectiveDie("defend") * 2 + bonus;
  const maxVal = document.getElementById("maxStressVal");
  const calc = document.getElementById("maxStressCalc");
  if (maxVal) {
    maxVal.textContent = maxStress;
  }
  if (calc) {
    calc.textContent = "Defend d" + getEffectiveDie("defend") + " -> " + maxStress + " max Stress" + (bonus ? " (" + bonus + " temporary)" : "");
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

  const gearBonus = typeof getGearRollBonuses === 'function' ? getGearRollBonuses(key, die) : {advDice:[], flat:0, addDice:[], notes:[]};
  advDiceArr = advDiceArr.concat(gearBonus.advDice || []);
  flatBonus += gearBonus.flat || 0;

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
  const gearAddRolls = (gearBonus.addDice || []).map(function(dieSize){ return explodingRoll(dieSize); });
  // Augmentation additive
  const augRoll = augDie > 0 ? explodingRoll(augDie) : null;
  const gearAddTotal = gearAddRolls.reduce(function(sum, roll){ return sum + roll.total; }, 0);
  const total = withAD + gearAddTotal + (augRoll ? augRoll.total : 0);
  const radPenalty = (typeof getRadPenaltyForStat === 'function') ? getRadPenaltyForStat(key) : 0;
  const finalTotal = Math.max(0, total - radPenalty);

  // Build detail breakdown
  const details = [];
  if (ra.advRolls.length) details.push(ra.breakdown.replace(/<[^>]+>/g, '').trim()); // plain-text from breakdown
  if (ra.advRolls.length === 0 && advDiceArr.length === 0) {} // no adv dice, no note needed
  if (flatBonus > 0) details.push('+' + flatBonus + ' (weapon/flavor/mutation/mod)');
  if (holyShieldRoll) details.push('Holy Shield +Spirit d' + (S.stats.spirit||4) + ' = ' + holyShieldRoll.total);
  if (adBonus) details.push('+A.D. d' + (S.stats.adventure || 4) + ' = ' + adBonus.total + ' (additive)');
  gearAddRolls.forEach(function(rollObj, idx){ details.push('+d' + gearBonus.addDice[idx] + ' gear = ' + rollObj.total); });
  if (augRoll) details.push('+d' + augDie + ' aug = ' + augRoll.total);
  if (radPenalty > 0) details.push('-' + radPenalty + ' Radiation penalty');
  if (gearBonus.notes && gearBonus.notes.length) details.push(gearBonus.notes.join(' · '));
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
  const maxStress = getEffectiveDie("defend") * 2 + Math.max(0, Number(S.tempStressCapacityBonus || 0));
  const oldStress = S.stress || 0;
  S.stress = Math.max(0, Math.min(value, maxStress));
  
  // AUDIO: Play sound if stress increased
  if (typeof window.AudioManager !== "undefined" && S.stress > oldStress) {
    window.AudioManager.stressIncreased();
  }
  
  updateStressUI();
}

function updateStressUI() {
  const maxStress = getEffectiveDie("defend") * 2 + Math.max(0, Number(S.tempStressCapacityBonus || 0));
  const bonus = Math.max(0, Number(S.tempStressCapacityBonus || 0));
  if (S.stress > maxStress) {
    S.stress = maxStress;
  }
  const stressVal = document.getElementById("stressVal");
  const bonusEl = document.getElementById("tempStressBonusVal");
  if (stressVal) {
    stressVal.textContent = S.stress || 0;
  }
  if (bonusEl) {
    if (bonus > 0) {
      bonusEl.style.display = "block";
      bonusEl.textContent = "Void Capacity Bonus: +" + bonus;
    } else {
      bonusEl.style.display = "none";
      bonusEl.textContent = "Void Capacity Bonus: +0";
    }
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
  if (S.tempStressCapacityBonus) {
    S.tempStressCapacityBonus = 0;
  }
  setStress(0);
}

function applyTemporaryStressCapacityBonus(amount, source) {
  var bonus = Math.max(0, Number(amount || 0));
  if (!bonus) return 0;
  S.tempStressCapacityBonus = Math.max(0, Number(S.tempStressCapacityBonus || 0)) + bonus;
  updateMaxStressDisplay();
  updateStressUI();
  if (typeof showNotif === "function") {
    showNotif("Void surge: +" + bonus + " temporary Stress capacity" + (source ? " (" + source + ")" : "") + ".", "good");
  }
  return bonus;
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
var _tmwFailGuard = { key: '', at: 0 };
var _tmwFailPromptGuard = { at: 0 };

function awardTeamworkOnFailure(reason, opts) {
  var key = String(reason || 'failed-roll');
  var cfg = opts && typeof opts === 'object' ? opts : {};
  var dedupeMs = Number(cfg.dedupeMs || 180);
  var now = Date.now();
  if (_tmwFailGuard.key === key && (now - Number(_tmwFailGuard.at || 0)) < dedupeMs) {
    return 0;
  }
  _tmwFailGuard = { key: key, at: now };
  var amt = (S.flavor || '').toLowerCase().indexOf('failed rolls grant +2') >= 0 ? 2 : 1;
  changeCounter('tmw', amt);
  return amt;
}

function openFailedRollFollowup(reason) {
  if (typeof openModal !== 'function' || typeof S === 'undefined' || !S) return;
  if (window._pendingStoryRoll || window._pendingWtwTaskRoll) return;
  var now = Date.now();
  if ((now - Number(_tmwFailPromptGuard.at || 0)) < 500) return;
  _tmwFailPromptGuard.at = now;

  var tmw = Math.max(0, Number(S.tmw || 0));
  var canBoost = tmw >= 1;
  var canPush = tmw >= 2;
  var why = String(reason || 'failed roll').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var html = ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + 'Failed roll detected (' + why + '). Use Teamwork to recover momentum:'
    + '<br><strong style="color:var(--teal);">Spend 1 Teamwork:</strong> +1 flat modifier on your next roll.'
    + '<br><strong style="color:var(--gold2);">Push Your Luck (2 Teamwork):</strong> gain one bonus Ad6 on your next roll.'
    + '</div>'
    + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.6rem;">'
    + '<button class="btn btn-sm" onclick="closeModal()">Keep Failure</button>'
    + '<button class="btn btn-sm btn-teal" ' + (canBoost ? '' : 'disabled title="Need 1 Teamwork"') + ' onclick="applyFailedRollRecovery(\'boost\')">Spend 1 Teamwork (+1 next roll)</button>'
    + '<button class="btn btn-sm btn-primary" ' + (canPush ? '' : 'disabled title="Need 2 Teamwork"') + ' onclick="applyFailedRollRecovery(\'push\')">Push Your Luck (2 Teamwork)</button>'
    + '</div>';
  openModal('Failed Roll Options', html);
}

function addTMWOnFail(reason, opts) {
  var gained = 0;
  var failureReason = String(reason || 'failed-roll');
  if (window.teamworkRulesSystem && typeof window.teamworkRulesSystem.onRollFailure === 'function') {
    var result = window.teamworkRulesSystem.onRollFailure('core-fail', {
      stat: 'adventure',
      roll: 0,
      difficulty: 0,
      description: failureReason,
      sessionContext: (window.campaignSystem && window.campaignSystem.getState && window.campaignSystem.getState().code) ? 'campaign' : 'solo'
    });
    gained = Number(result && result.awarded || 0);
  }
  if (!gained) {
    gained = awardTeamworkOnFailure(failureReason, opts);
  }
  var cfg = opts && typeof opts === 'object' ? opts : {};
  if (!cfg || !cfg.skipPrompt) openFailedRollFollowup(failureReason);
  return gained;
}

window.awardTeamworkOnFailure = awardTeamworkOnFailure;
window.applyTemporaryStressCapacityBonus = applyTemporaryStressCapacityBonus;

window.applyFailedRollRecovery = function(mode) {
  if (typeof S === 'undefined' || !S) return;
  if (!S.rollMod || typeof S.rollMod !== 'object') S.rollMod = { advDice: [], flat: 0 };
  if (!Array.isArray(S.rollMod.advDice)) S.rollMod.advDice = [];
  if (typeof S.rollMod.flat !== 'number') S.rollMod.flat = Number(S.rollMod.flat || 0) || 0;

  if (mode === 'boost') {
    if ((S.tmw || 0) < 1) {
      if (typeof showNotif === 'function') showNotif('Need 1 Teamwork Point.', 'warn');
      return;
    }
    changeCounter('tmw', -1);
    S.rollMod.flat += 1;
    if (typeof updateRollModDisplay === 'function') updateRollModDisplay();
    if (typeof showNotif === 'function') showNotif('Spent 1 Teamwork: +1 flat applied to next roll.', 'good');
  } else if (mode === 'push') {
    if ((S.tmw || 0) < 2) {
      if (typeof showNotif === 'function') showNotif('Need 2 Teamwork Points.', 'warn');
      return;
    }
    changeCounter('tmw', -2);
    S.rollMod.advDice.push(6);
    if (typeof updateRollModDisplay === 'function') updateRollModDisplay();
    if (typeof showNotif === 'function') showNotif('Push Your Luck: bonus Ad6 applied to next roll.', 'good');
  }
  if (typeof closeModal === 'function') closeModal();
};

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
  setInputValue("charCareer", S.career);
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
  var backgrounds = [
    'Street-raised scavenger',
    'Temple-taught acolyte',
    'Ex-militia survivor',
    'Refugee caravan drifter',
    'Dockside fixer',
    'Vault-born technician',
    'Ruin scholar apprentice',
    'Frontier homesteader',
    'Guild runaway',
    'Nomad clan scout'
  ];
  S.background = pick(backgrounds);
  setInputValue("charBackground", S.background);
}

function rollCareer() {
  S.career = pick(CAREERS);
  setInputValue("charCareer", S.career);
}

function workJobDay() {
  if (!S.career || !String(S.career).trim()) {
    rollCareer();
    showNotif('Career was empty, so a random Career was rolled first.', 'good');
  }

  var bodyDie = (typeof getEffectiveDie === 'function') ? getEffectiveDie('body') : ((S.stats && S.stats.body) || 4);
  var bodyRoll = explodingRoll(bodyDie);
  var dreadRoll = explodingRoll(6);
  var success = bodyRoll.total >= dreadRoll.total;
  var resultEl = document.getElementById('workJobResult');

  if (success) {
    var successBefore = S.successRolls || 0;
    var pathBefore = S.pathTokens || 0;

    if (typeof changeCredits === 'function') changeCredits(100);
    else {
      S.credits = (S.credits || 0) + 100;
      if (typeof updateCreditsUI === 'function') updateCreditsUI();
    }
    if (typeof advanceDay === 'function') advanceDay(1);
    if (typeof addSuccessRoll === 'function') addSuccessRoll();
    else {
      S.successRolls = (S.successRolls || 0) + 1;
      var sr = document.getElementById('successRollsVal');
      if (sr) sr.textContent = S.successRolls;
    }

    var successAfter = S.successRolls || 0;
    var pathAfter = S.pathTokens || 0;
    var rollover = pathAfter > pathBefore
      ? (' (3 successes converted to +1 Path Token: ' + pathBefore + ' -> ' + pathAfter + ')')
      : (' (Success Rolls: ' + successBefore + ' -> ' + successAfter + ')');

    if (resultEl) {
      resultEl.innerHTML = '<span style="color:var(--green2);font-weight:700;">SUCCESS ✓</span> Body d' + bodyDie + '=' + bodyRoll.total + ' vs Dread d6=' + dreadRoll.total + ' -> +100 Credits, +1 Day, +1 Successful Roll.' + rollover;
    }
    showNotif('Work complete: +100 Credits, +1 day, and +1 Successful Roll.', 'good');
  } else {
    if (resultEl) {
      resultEl.innerHTML = '<span style="color:var(--red2);font-weight:700;">FAILED ✗</span> Body d' + bodyDie + '=' + bodyRoll.total + ' vs Dread d6=' + dreadRoll.total + '. No pay.';
    }
    showNotif('Work failed: no Credits earned.', 'warn');
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
  }
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

function resetRunProgressState() {
  S.injuries = [];
  S.mentalStress = 0;
  S.rads = 0;
  S.radiationState = {
    gainTicks: 0,
    statPenalty: { body: 0, strike: 0, shoot: 0, mind: 0, spirit: 0, defend: 0, control: 0, lead: 0 },
    mutations: []
  };
  S.scarState = {
    avoidedDeaths: 0,
    results: [],
    tmwCostPenalty: 0,
    rollPenalty: 0,
    cannotEscapeCombat: false,
    loseHealthOnFailedRoll: false,
    baseTeamwork: 0,
    inProgress: false
  };

  S.activeMissions = [];
  S.completedMissions = [];
  S.availableJobs = [];
  S.missionTokens = {};

  if (S.lastSea) {
    S.lastSea.missionTokens = {};
  }

  S.storyline = {};
  S.worldThatWas = {};
  S.factionNarrative = {
    pathPoints: { heroic: 0, tyrant: 0, martyr: 0 },
    contracts: {},
    completedContracts: [],
    endingResult: { key: "", title: "", vibe: "" }
  };
  S.originMissionInitialized = false;
}

function generateCharacter() {
  resetRunProgressState();
  rollName();
  rollCareer();
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
  // Trigger origin mission after all character state is initialized
  if (typeof createOriginMissionFromReason === 'function') {
    try {
      createOriginMissionFromReason(true);
    } catch (err) {
      console.warn('Error creating origin mission:', err);
    }
  } else {
    console.warn('createOriginMissionFromReason not yet available - will be created on page load');
  }
}

function clearCharacter(options) {
  const opts = options || {};
  if (!opts.force && hasUnsavedSoloChanges()) {
    openClearCharacterConfirmModal();
    return;
  }
  resetRunProgressState();
  S.name = "";
  S.career = "";
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
  _lastSoloLoadedChecksum = computeSaveChecksum(JSON.stringify(S || {}));
}

const SOLO_SAVE_KEY = "beyond-light-character";
const SOLO_SAVE_BACKUP_KEY = "beyond-light-character-backup";
const SOLO_SAVE_CHECKPOINT_KEY = "beyond-light-character-checkpoint";
const SOLO_SAVE_CHECKPOINT_PREFIX = "beyond-light-character-checkpoint-";
const SOLO_SAVE_META_KEY = "beyond-light-character-meta";
const SOLO_SAVE_CORRUPT_PREFIX = "beyond-light-character-corrupt-";
const SOLO_SAVE_SCHEMA_VERSION = 2;
const SOLO_CHECKPOINT_HISTORY_LIMIT = 3;
let _lastSoloAutoSaveAt = 0;
let _lastSoloLoadedChecksum = null;

function computeSaveChecksum(text) {
  const src = String(text || "");
  let hash = 5381;
  for (let i = 0; i < src.length; i += 1) {
    hash = ((hash << 5) + hash) + src.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

function makeSoloSaveEnvelope(stateObj) {
  const data = JSON.parse(JSON.stringify(stateObj || S || {}));
  const payload = JSON.stringify(data);
  return {
    schema: SOLO_SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    checksum: computeSaveChecksum(payload),
    data: data
  };
}

function isValidSoloEnvelope(envelope) {
  if (!envelope || typeof envelope !== "object") return false;
  if (!envelope.data || typeof envelope.data !== "object") return false;
  const payload = JSON.stringify(envelope.data);
  return computeSaveChecksum(payload) === String(envelope.checksum || "");
}

function readSoloEnvelopeByKey(key) {
  const raw = localStorage.getItem(String(key || ""));
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_err) {
    return null;
  }
  if (parsed && parsed.data && typeof parsed.data === "object") {
    return parsed;
  }
  // Legacy save format fallback: raw state object.
  if (parsed && typeof parsed === "object") {
    const payload = JSON.stringify(parsed);
    return {
      schema: 1,
      savedAt: Date.now(),
      checksum: computeSaveChecksum(payload),
      data: parsed
    };
  }
  return null;
}

function writeSoloEnvelope(envelope) {
  const current = localStorage.getItem(SOLO_SAVE_KEY);
  if (current) {
    localStorage.setItem(SOLO_SAVE_BACKUP_KEY, current);
  }
  localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify(envelope));
  localStorage.setItem(SOLO_SAVE_META_KEY, JSON.stringify({
    lastSavedAt: envelope.savedAt,
    schema: envelope.schema,
    checksum: envelope.checksum
  }));
}

function writeSoloCheckpoint(envelope) {
  for (let i = SOLO_CHECKPOINT_HISTORY_LIMIT; i >= 2; i -= 1) {
    const prevRaw = localStorage.getItem(SOLO_SAVE_CHECKPOINT_PREFIX + (i - 1));
    if (prevRaw) {
      localStorage.setItem(SOLO_SAVE_CHECKPOINT_PREFIX + i, prevRaw);
    } else {
      localStorage.removeItem(SOLO_SAVE_CHECKPOINT_PREFIX + i);
    }
  }
  const serialized = JSON.stringify(envelope);
  localStorage.setItem(SOLO_SAVE_CHECKPOINT_PREFIX + "1", serialized);
  // Legacy alias retained for compatibility with older checkpoint readers.
  localStorage.setItem(SOLO_SAVE_CHECKPOINT_KEY, serialized);
}

function readSoloCheckpointHistory() {
  const history = [];
  for (let i = 1; i <= SOLO_CHECKPOINT_HISTORY_LIMIT; i += 1) {
    const key = SOLO_SAVE_CHECKPOINT_PREFIX + i;
    const envelope = readSoloEnvelopeByKey(key);
    if (envelope && isValidSoloEnvelope(envelope)) {
      history.push({ slot: i, key: key, envelope: envelope });
    }
  }
  if (!history.length) {
    const legacy = readSoloEnvelopeByKey(SOLO_SAVE_CHECKPOINT_KEY);
    if (legacy && isValidSoloEnvelope(legacy)) {
      history.push({ slot: 1, key: SOLO_SAVE_CHECKPOINT_KEY, envelope: legacy });
    }
  }
  return history;
}

function quarantineCorruptSave(raw, sourceKey) {
  if (!raw) return;
  const stamp = Date.now();
  localStorage.setItem(SOLO_SAVE_CORRUPT_PREFIX + stamp, JSON.stringify({
    source: String(sourceKey || "unknown"),
    quarantinedAt: stamp,
    raw: String(raw)
  }));
}

function getSoloEnvelopeStampText(envelope) {
  if (!envelope || !envelope.savedAt) return "-";
  try {
    return new Date(envelope.savedAt).toLocaleString();
  } catch (_err) {
    return "-";
  }
}

function hasMeaningfulCharacterState() {
  if (!S || typeof S !== "object") return false;
  if (S.name || S.career || S.background || S.reason) return true;
  if (Array.isArray(S.backpack) && S.backpack.some(Boolean)) return true;
  if (S.equipment && (S.equipment.weapon1 || S.equipment.weapon2 || S.equipment.armor || S.equipment.readied)) return true;
  return !!(S.renown || S.credits || S.stress || S.trauma || S.pathTokens || S.tmw || S.successRolls);
}

function hasUnsavedSoloChanges() {
  if (!hasMeaningfulCharacterState()) return false;
  let nowChecksum = "";
  try {
    nowChecksum = computeSaveChecksum(JSON.stringify(S || {}));
  } catch (_err) {
    return true;
  }
  if (_lastSoloLoadedChecksum) {
    return nowChecksum !== _lastSoloLoadedChecksum;
  }
  const primary = readSoloEnvelopeByKey(SOLO_SAVE_KEY);
  if (primary && isValidSoloEnvelope(primary) && primary.checksum) {
    return nowChecksum !== String(primary.checksum);
  }
  return true;
}

function openClearCharacterConfirmModal() {
  if (typeof openModal === "function") {
    openModal("Unsaved Changes", ''
      + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
      + '<div>Your current Wayfarer has unsaved changes. Clearing now will discard them.</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;flex-wrap:wrap;margin-top:.6rem;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
      + '<button class="btn btn-sm" onclick="saveCharacter(); closeModal();">Save Instead</button>'
      + '<button class="btn btn-sm btn-red" onclick="closeModal(); confirmClearCharacter()">Clear Anyway</button>'
      + '</div>'
      + '</div>');
    return;
  }
  if (confirm("Unsaved changes detected. Clear anyway?")) {
    confirmClearCharacter();
  }
}

function confirmClearCharacter() {
  clearCharacter({ force: true });
}

function applyLoadedCharacterState(saved) {
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
  if (typeof renderOSHacksPanel === 'function') { renderOSHacksPanel(); }
  if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
  if (typeof ensureStarsState === 'function') {
    ensureStarsState();
  }
  if (S.starSystem && Array.isArray(S.starSystem.hexes) && S.starSystem.hexes.length) {
    window._lastGeneratedGalaxy = (typeof cloneStarsData === 'function')
      ? cloneStarsData(S.starSystem)
      : JSON.parse(JSON.stringify(S.starSystem));
  }
  const galaxyTab = document.getElementById('tab-galaxy');
  const inSpaceCtx = window._activeContext === 'space';
  if ((inSpaceCtx || (galaxyTab && galaxyTab.classList.contains('active'))) && typeof buildGalaxyPanel === 'function') {
    buildGalaxyPanel();
    if (typeof renderStarSystemMap === 'function') {
      setTimeout(function(){ renderStarSystemMap(); }, 0);
    }
  }
}

function saveCharacter() {
  try {
    const envelope = makeSoloSaveEnvelope(S);
    writeSoloEnvelope(envelope);
    writeSoloCheckpoint(envelope);
    _lastSoloLoadedChecksum = envelope.checksum;
    _lastSoloAutoSaveAt = Date.now();
    showNotif("Character saved + checkpointed", "good");
  } catch (error) {
    showNotif("Could not save character", "warn");
  }
}

function loadCharacter() {
  try {
    let source = "primary";
    let envelope = readSoloEnvelopeByKey(SOLO_SAVE_KEY);
    if (!envelope || !isValidSoloEnvelope(envelope)) {
      const badPrimaryRaw = localStorage.getItem(SOLO_SAVE_KEY);
      if (badPrimaryRaw) {
        quarantineCorruptSave(badPrimaryRaw, SOLO_SAVE_KEY);
      }
      source = "backup";
      envelope = readSoloEnvelopeByKey(SOLO_SAVE_BACKUP_KEY);
    }
    if (!envelope || !isValidSoloEnvelope(envelope)) {
      showNotif("No saved character found", "warn");
      return;
    }
    applyLoadedCharacterState(envelope.data || {});
    _lastSoloLoadedChecksum = envelope.checksum || computeSaveChecksum(JSON.stringify(envelope.data || {}));
    showNotif(source === "backup" ? "Primary save was invalid. Loaded backup." : "Character loaded", source === "backup" ? "warn" : "good");
  } catch (error) {
    showNotif("Saved character is invalid", "warn");
  }
}

function loadCharacterCheckpoint() {
  try {
    const history = readSoloCheckpointHistory();
    const checkpoint = history.length ? history[0].envelope : null;
    if (!checkpoint || !isValidSoloEnvelope(checkpoint)) {
      showNotif("No valid checkpoint found", "warn");
      return;
    }
    applyLoadedCharacterState(checkpoint.data || {});
    _lastSoloLoadedChecksum = checkpoint.checksum || computeSaveChecksum(JSON.stringify(checkpoint.data || {}));
    showNotif("Checkpoint restored", "good");
  } catch (_err) {
    showNotif("Could not restore checkpoint", "warn");
  }
}

function loadCharacterCheckpointSlot(slot) {
  const idx = Math.max(1, Math.min(SOLO_CHECKPOINT_HISTORY_LIMIT, Number(slot) || 1));
  const checkpoint = readSoloEnvelopeByKey(SOLO_SAVE_CHECKPOINT_PREFIX + idx);
  if (!checkpoint || !isValidSoloEnvelope(checkpoint)) {
    showNotif("Checkpoint slot " + idx + " is unavailable", "warn");
    return;
  }
  applyLoadedCharacterState(checkpoint.data || {});
  _lastSoloLoadedChecksum = checkpoint.checksum || computeSaveChecksum(JSON.stringify(checkpoint.data || {}));
  showNotif("Checkpoint " + idx + " restored", "good");
}

function restoreBackupAsPrimary() {
  try {
    const backup = readSoloEnvelopeByKey(SOLO_SAVE_BACKUP_KEY);
    if (!backup || !isValidSoloEnvelope(backup)) {
      showNotif("No valid backup to restore", "warn");
      return;
    }
    localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify(backup));
    localStorage.setItem(SOLO_SAVE_META_KEY, JSON.stringify({
      lastSavedAt: backup.savedAt,
      schema: backup.schema,
      checksum: backup.checksum,
      restoredFrom: "backup",
      restoredAt: Date.now()
    }));
    showNotif("Backup promoted to primary", "good");
  } catch (_err) {
    showNotif("Backup restore failed", "warn");
  }
}

function exportCharacterSave() {
  try {
    const envelope = makeSoloSaveEnvelope(S);
    const payload = JSON.stringify(envelope, null, 2);
    const fileName = "beyond-light-solo-save-" + Date.now() + ".json";
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      try { URL.revokeObjectURL(url); } catch (_err) {}
      try { link.remove(); } catch (_err) {}
    }, 0);
    showNotif("Save exported", "good");
  } catch (_err) {
    showNotif("Could not export save", "warn");
  }
}

function importCharacterSavePrompt() {
  if (typeof openModal === "function") {
    openModal("Import Solo Save", ''
      + '<div style="font-size:.82rem;color:var(--muted2);margin-bottom:.45rem;">Paste a previously exported solo save JSON.</div>'
      + '<textarea id="soloImportSaveInput" style="width:100%;min-height:180px;background:#111723;border:1px solid #2a354a;color:var(--text);border-radius:.45rem;padding:.55rem;font-family:monospace;font-size:.75rem;"></textarea>'
      + '<div style="display:flex;justify-content:flex-end;gap:.35rem;margin-top:.55rem;">'
      + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
      + '<button class="btn btn-sm btn-teal" onclick="confirmImportCharacterSave()">Import Save</button>'
      + '</div>');
    return;
  }
  const raw = prompt("Paste exported save JSON:");
  if (!raw) return;
  confirmImportCharacterSave(raw);
}

function confirmImportCharacterSave(rawInput) {
  try {
    const raw = String(rawInput || (document.getElementById("soloImportSaveInput") || {}).value || "").trim();
    if (!raw) {
      showNotif("Paste save JSON first", "warn");
      return;
    }
    const parsed = JSON.parse(raw);
    const envelope = (parsed && parsed.data && typeof parsed.data === "object")
      ? parsed
      : makeSoloSaveEnvelope(parsed);
    if (!isValidSoloEnvelope(envelope)) {
      showNotif("Imported save failed integrity check", "warn");
      return;
    }
    writeSoloEnvelope(envelope);
    writeSoloCheckpoint(envelope);
    applyLoadedCharacterState(envelope.data || {});
    _lastSoloLoadedChecksum = envelope.checksum || computeSaveChecksum(JSON.stringify(envelope.data || {}));
    if (typeof closeModal === "function") closeModal();
    showNotif("Save imported and loaded", "good");
  } catch (_err) {
    showNotif("Save JSON is invalid", "warn");
  }
}

function verifySoloSaveHealth() {
  let primary = null;
  let backup = null;
  const history = readSoloCheckpointHistory();
  const checkpoint = history.length ? history[0].envelope : null;
  try { primary = readSoloEnvelopeByKey(SOLO_SAVE_KEY); } catch (_err) {}
  try { backup = readSoloEnvelopeByKey(SOLO_SAVE_BACKUP_KEY); } catch (_err) {}
  const primaryOk = !!(primary && isValidSoloEnvelope(primary));
  const backupOk = !!(backup && isValidSoloEnvelope(backup));
  const checkpointOk = !!(checkpoint && isValidSoloEnvelope(checkpoint));
  const primaryStamp = getSoloEnvelopeStampText(primary);
  const backupStamp = getSoloEnvelopeStampText(backup);
  const checkpointStamp = getSoloEnvelopeStampText(checkpoint);
  if (typeof openModal === "function") {
    openModal("Solo Save Health", ''
      + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
      + '<div><strong>Primary:</strong> ' + (primaryOk ? '<span style="color:var(--green2);">OK</span>' : '<span style="color:var(--red2);">Invalid/Missing</span>') + ' · ' + primaryStamp + '</div>'
      + '<div style="margin-top:.25rem;"><strong>Backup:</strong> ' + (backupOk ? '<span style="color:var(--green2);">OK</span>' : '<span style="color:var(--red2);">Invalid/Missing</span>') + ' · ' + backupStamp + '</div>'
      + '<div style="margin-top:.25rem;"><strong>Checkpoint:</strong> ' + (checkpointOk ? '<span style="color:var(--green2);">OK</span>' : '<span style="color:var(--red2);">Invalid/Missing</span>') + ' · ' + checkpointStamp + '</div>'
      + '<div style="margin-top:.2rem;"><strong>Checkpoint History:</strong> ' + history.length + ' / ' + SOLO_CHECKPOINT_HISTORY_LIMIT + '</div>'
      + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.5rem;">'
      + '<button class="btn btn-xs" onclick="restoreBackupAsPrimary()">Promote Backup</button>'
      + '<button class="btn btn-xs" onclick="loadCharacterCheckpoint()">Load Checkpoint</button>'
      + '<button class="btn btn-xs" onclick="openSoloRecoveryCenter()">Open Recovery Center</button>'
      + '</div>'
      + '<div style="margin-top:.45rem;color:var(--muted2);">If primary is corrupted, load uses backup automatically and quarantines the bad payload.</div>'
      + '</div>');
  }
  showNotif(primaryOk ? "Save health verified" : "Primary save issue detected", primaryOk ? "good" : "warn");
}

function openSoloRecoveryCenter() {
  const primary = readSoloEnvelopeByKey(SOLO_SAVE_KEY);
  const backup = readSoloEnvelopeByKey(SOLO_SAVE_BACKUP_KEY);
  const checkpointHistory = readSoloCheckpointHistory();
  const checkpoint = checkpointHistory.length ? checkpointHistory[0].envelope : null;
  const primaryOk = !!(primary && isValidSoloEnvelope(primary));
  const backupOk = !!(backup && isValidSoloEnvelope(backup));
  const checkpointOk = !!(checkpoint && isValidSoloEnvelope(checkpoint));
  let checkpointRows = '';
  for (let i = 1; i <= SOLO_CHECKPOINT_HISTORY_LIMIT; i += 1) {
    const slotEnvelope = readSoloEnvelopeByKey(SOLO_SAVE_CHECKPOINT_PREFIX + i);
    const slotOk = !!(slotEnvelope && isValidSoloEnvelope(slotEnvelope));
    checkpointRows += '<div style="display:flex;align-items:center;justify-content:space-between;gap:.35rem;">'
      + '<span>Checkpoint ' + i + ': ' + (slotOk ? '<span style="color:var(--green2);">Ready</span>' : '<span style="color:var(--red2);">Empty</span>') + ' · ' + getSoloEnvelopeStampText(slotEnvelope) + '</span>'
      + '<button class="btn btn-xs" ' + (slotOk ? '' : 'disabled style="opacity:.45;"') + ' onclick="loadCharacterCheckpointSlot(' + i + ')">Restore</button>'
      + '</div>';
  }

  const html = ''
    + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
    + '<div class="section-title" style="margin-bottom:.4rem;">Recovery Sources</div>'
    + '<div>Primary: ' + (primaryOk ? '<span style="color:var(--green2);">Ready</span>' : '<span style="color:var(--red2);">Unavailable</span>') + ' · ' + getSoloEnvelopeStampText(primary) + '</div>'
    + '<div>Backup: ' + (backupOk ? '<span style="color:var(--green2);">Ready</span>' : '<span style="color:var(--red2);">Unavailable</span>') + ' · ' + getSoloEnvelopeStampText(backup) + '</div>'
    + '<div>Checkpoint: ' + (checkpointOk ? '<span style="color:var(--green2);">Ready</span>' : '<span style="color:var(--red2);">Unavailable</span>') + ' · ' + getSoloEnvelopeStampText(checkpoint) + '</div>'
    + '<div style="margin-top:.35rem;border-top:1px solid var(--border);padding-top:.35rem;display:grid;gap:.25rem;">' + checkpointRows + '</div>'
    + '<div style="display:grid;gap:.35rem;margin-top:.55rem;">'
    + '<button class="btn btn-sm btn-teal" onclick="loadCharacter()">Load Best Available</button>'
    + '<button class="btn btn-sm" onclick="restoreBackupAsPrimary()">Promote Backup To Primary</button>'
    + '<button class="btn btn-sm" onclick="loadCharacterCheckpoint()">Restore Checkpoint</button>'
    + '<button class="btn btn-sm" onclick="saveCharacter()">Create Fresh Save + Checkpoint</button>'
    + '<button class="btn btn-sm" onclick="exportCharacterSave()">Export Current State</button>'
    + '</div>'
    + '<div style="margin-top:.45rem;color:var(--muted2);">Tip: use checkpoint before major branch choices to preserve a fallback branch.</div>'
    + '</div>';
  if (typeof openModal === "function") {
    openModal("Solo Recovery Center", html);
  }
}

function showSoloGuidance() {
  const html = ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + '<div class="section-title" style="margin-bottom:.45rem;">Solo Quickstart</div>'
    + '<ol style="padding-left:1.1rem;display:grid;gap:.25rem;">'
    + '<li>Generate or load your Wayfarer, then confirm stress/conditions.</li>'
    + '<li>Use Province for traversal, Missions for objectives, and Storyline for major forks.</li>'
    + '<li>Use Save before risky branches and Export for an external backup file.</li>'
    + '<li>Run Save Health occasionally to confirm primary + backup integrity.</li>'
    + '</ol>'
    + '<div style="font-size:.78rem;color:var(--muted2);margin-top:.35rem;">Suggested loop: Character → Province → Missions → Storyline → Save/Checkpoint.</div>'
    + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.55rem;">'
    + '<button class="btn btn-xs" onclick="window.soloReference && window.soloReference.open ? window.soloReference.open() : null;">Open Solo Reference</button>'
    + '<button class="btn btn-xs btn-teal" onclick="verifySoloSaveHealth()">Check Save Health</button>'
    + '<button class="btn btn-xs" onclick="exportCharacterSave()">Export Save</button>'
      + '<button class="btn btn-xs" onclick="openSoloRecoveryCenter()">Recovery Center</button>'
      + '<button class="btn btn-xs" onclick="if(typeof switchTab===\'function\'){switchTab(\'province\');}">Go Province</button>'
      + '<button class="btn btn-xs" onclick="if(typeof switchTab===\'function\'){switchTab(\'missions\');}">Go Missions</button>'
      + '<button class="btn btn-xs" onclick="if(typeof switchTab===\'function\'){switchTab(\'storyline\');}">Go Storyline</button>'
    + '</div>'
    + '</div>';
  if (typeof openModal === "function") {
    openModal("Solo Guidance", html);
  }
}

function maybePromptSoloGuidance() {
  try {
    const metaRaw = localStorage.getItem(SOLO_SAVE_META_KEY);
    const dismissed = localStorage.getItem("beyond-light-solo-guide-dismissed") === "1";
    const hasAnySave = !!(localStorage.getItem(SOLO_SAVE_KEY) || localStorage.getItem(SOLO_SAVE_BACKUP_KEY));
    if (dismissed || hasAnySave || metaRaw) return;
    if (typeof openModal === "function") {
      openModal("Welcome, Solo Wayfarer", ''
        + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
        + '<div style="margin-bottom:.4rem;">Need a quick launch path? Start with Character, then Province, Missions, and Storyline.</div>'
        + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;">'
        + '<button class="btn btn-sm" onclick="localStorage.setItem(\'beyond-light-solo-guide-dismissed\',\'1\'); closeModal();">Dismiss</button>'
        + '<button class="btn btn-sm btn-teal" onclick="localStorage.setItem(\'beyond-light-solo-guide-dismissed\',\'1\'); closeModal(); showSoloGuidance();">Open Solo Guide</button>'
        + '</div>'
        + '</div>');
    }
  } catch (_err) {
    // Ignore first-run guidance failures.
  }
}

setTimeout(function () {
  maybePromptSoloGuidance();
}, 1500);

setInterval(function () {
  if (!S) return;
  try {
    const nowChecksum = computeSaveChecksum(JSON.stringify(S));
    const hasBaseline = !!_lastSoloLoadedChecksum;
    if (hasBaseline && nowChecksum !== _lastSoloLoadedChecksum) {
      document.body.classList.add("solo-unsaved");
    } else {
      document.body.classList.remove("solo-unsaved");
    }
  } catch (_err) {
    document.body.classList.remove("solo-unsaved");
  }
}, 4000);

setInterval(function () {
  const now = Date.now();
  if (document.hidden) return;
  if (window.campaignSystem && window.campaignSystem.getState) {
    const cs = window.campaignSystem.getState();
    if (cs && cs.code) return;
  }
  if (!S || (!S.name && !S.reason && !S.career)) return;
  if (now - _lastSoloAutoSaveAt < 60000) return;
  try {
    const envelope = makeSoloSaveEnvelope(S);
    writeSoloEnvelope(envelope);
    _lastSoloLoadedChecksum = envelope.checksum;
    _lastSoloAutoSaveAt = now;
  } catch (_err) {
    // Silent autosave failures should not interrupt gameplay.
  }
}, 15000);

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
  const actionRoll = explodingRoll(actionDie, { type: "action", major: true, label: "Check Action" });
  const dreadRoll = explodingRoll(dreadDie, { type: "dread", major: true, label: "Check Dread" });
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
  const result = explodingRoll(die, { type: kind === "action" ? "action" : "dread", label: kind === "action" ? "Action" : "Dread" });
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
  const result = sides === 100 ? Math.floor(Math.random() * 100) + 1 : explodingRoll(sides, { type: "neutral", label: "Free d" + sides }).total;
  const el = document.getElementById("freeDiceResult");
  if (el) {
    el.textContent = "d" + sides + ": " + result;
  }
}
