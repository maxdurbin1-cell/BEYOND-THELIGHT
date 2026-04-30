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
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height || 0) : 0;
  root.style.top = headerHeight ? (headerHeight + 'px') : '';
  if (document.documentElement) {
    document.documentElement.style.setProperty('--quick-access-top', (headerHeight || 0) + 'px');
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

function syncTabAccessibility() {
  var tablist = document.getElementById('mainNavTablist');
  if (tablist) {
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', 'horizontal');
  }

  document.querySelectorAll("#mainNavTablist .tab-btn[role='tab'][aria-controls]").forEach(function (tab) {
    var panelId = tab.getAttribute('aria-controls');
    var panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    panel.setAttribute('role', 'tabpanel');
    if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
    var active = panel.classList.contains('active');
    panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    panel.setAttribute('tabindex', active ? '0' : '-1');
  });
}

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll(".tab-btn[role='tab']").forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });

  const target = document.getElementById("tab-" + tabId);
  if (target) {
    target.classList.add("active");
    target.setAttribute("aria-hidden", "false");
    target.setAttribute('tabindex', '0');
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

  if (tabId === "map") {
    var provinceState = (typeof window.getProvinceMapState === "function") ? window.getProvinceMapState() : null;
    var hasProvinceMap = !!(provinceState && Array.isArray(provinceState.mapData) && provinceState.mapData.length);
    if (typeof window.generateMap === "function" && !hasProvinceMap) {
      window.generateMap();
    } else if (typeof window.renderHexMap === "function") {
      window.renderHexMap();
    }
  }

  if (tabId === "lastsea") {
    if (typeof window.S !== "undefined" && window.S && window.S.lastSea && (!window.S.lastSea.map || !window.S.lastSea.map.length)) {
      if (typeof window.generateLastSea === "function") {
        window.generateLastSea();
      }
    } else if (typeof window.renderLastSeaMap === "function") {
      window.renderLastSeaMap();
    }
  }

  syncTabAccessibility();

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    syncTabAccessibility();
    renderGlobalQuickAccess();
    window.addEventListener('resize', renderGlobalQuickAccess);
  });
} else {
  syncTabAccessibility();
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
  var syncState = window.__renownFactionSyncState || { active: false, source: "" };
  var previous = Number(window.__lastRenownSeen || 0);
  var delta = current - previous;
  if (!syncState.active && delta !== 0 && typeof window.changeFactionRenown === "function") {
    var fr = (S && S.factionRenown && typeof S.factionRenown === "object") ? S.factionRenown : null;
    var key = "political";
    if (fr) {
      Object.keys(fr).forEach(function (id) {
        if (typeof fr[id] !== "number") return;
        if (typeof fr[key] !== "number" || fr[id] > fr[key]) key = id;
      });
    }
    window.__renownFactionSyncState = { active: true, source: "renown" };
    try {
      window.changeFactionRenown(key, delta);
    } catch (_err) {}
    window.__renownFactionSyncState = { active: false, source: "" };
  }
  window.__lastRenownSeen = current;
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
var _failedRollContext = null;

function normalizeFailedRollContext(reason, opts) {
  var cfg = opts && typeof opts === 'object' ? opts : {};
  var failedBy = Math.max(0, Number(cfg.failedBy || cfg.margin || 0));
  var dreadDie = Math.max(4, Number(cfg.dreadDie || cfg.dread || 6));
  var actionDie = Math.max(4, Number(cfg.actionDie || cfg.statDie || cfg.die || 6));
  return {
    reason: String(reason || 'failed-roll'),
    failedBy: failedBy,
    dreadDie: dreadDie,
    actionDie: actionDie,
    at: Date.now()
  };
}

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
  var ctx = _failedRollContext || normalizeFailedRollContext(reason, {});
  var needed = Math.max(1, Number(ctx.failedBy || 1));
  var canBoost = tmw >= needed;
  var canPush = tmw >= 2;
  var why = String(reason || 'failed roll').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var baseDread = Math.max(4, Number(ctx.dreadDie || 6));
  var actionDie = Math.max(4, Number(ctx.actionDie || 6));
  var html = ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + 'Failed roll detected (' + why + '). You can spend Teamwork directly on this failed roll:'
    + '<br><strong style="color:var(--teal);">Spend to Succeed:</strong> spend Teamwork equal to failure gap.'
    + '<br><strong style="color:var(--gold2);">Push Your Luck (2 Teamwork):</strong> reroll now at stepped-up Dread.'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-top:.45rem;">'
    + '<label style="font-size:.74rem;color:var(--muted2);">Failed By<input id="failRecoveryGap" type="number" min="1" max="20" value="' + needed + '" style="width:100%;"></label>'
    + '<label style="font-size:.74rem;color:var(--muted2);">Spend Teamwork<input id="failRecoverySpend" type="number" min="1" max="' + tmw + '" value="' + Math.min(tmw, needed) + '" style="width:100%;"></label>'
    + '<label style="font-size:.74rem;color:var(--muted2);">Action Die<input id="failRecoveryActionDie" type="number" min="4" max="20" step="2" value="' + actionDie + '" style="width:100%;"></label>'
    + '<label style="font-size:.74rem;color:var(--muted2);">Current Dread Die<input id="failRecoveryDreadDie" type="number" min="4" max="20" step="2" value="' + baseDread + '" style="width:100%;"></label>'
    + '</div>'
    + '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;margin-top:.6rem;">'
    + '<button class="btn btn-sm" onclick="closeModal()">Keep Failure</button>'
    + '<button class="btn btn-sm btn-teal" ' + (canBoost ? '' : 'disabled title="Need enough Teamwork to cover the gap"') + ' onclick="applyFailedRollRecovery(\'convert\')">Spend Teamwork to Succeed</button>'
    + '<button class="btn btn-sm btn-primary" ' + (canPush ? '' : 'disabled title="Need 2 Teamwork"') + ' onclick="applyFailedRollRecovery(\'reroll\')">Push Your Luck Reroll</button>'
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
  _failedRollContext = normalizeFailedRollContext(failureReason, cfg);
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

  var gapEl = document.getElementById('failRecoveryGap');
  var spendEl = document.getElementById('failRecoverySpend');
  var actionEl = document.getElementById('failRecoveryActionDie');
  var dreadEl = document.getElementById('failRecoveryDreadDie');
  var failedBy = Math.max(1, parseInt(gapEl && gapEl.value, 10) || Math.max(1, Number((_failedRollContext && _failedRollContext.failedBy) || 1)));
  var spend = Math.max(1, parseInt(spendEl && spendEl.value, 10) || failedBy);
  var actionDie = Math.max(4, parseInt(actionEl && actionEl.value, 10) || Number((_failedRollContext && _failedRollContext.actionDie) || 6));
  var dreadDie = Math.max(4, parseInt(dreadEl && dreadEl.value, 10) || Number((_failedRollContext && _failedRollContext.dreadDie) || 6));

  if (mode === 'convert') {
    if ((S.tmw || 0) < spend) {
      if (typeof showNotif === 'function') showNotif('Not enough Teamwork Points.', 'warn');
      return;
    }
    changeCounter('tmw', -spend);
    if (spend >= failedBy) {
      if (typeof showNotif === 'function') showNotif('Spent ' + spend + ' Teamwork: failure converted to success.', 'good');
    } else {
      if (typeof showNotif === 'function') showNotif('Spent ' + spend + ' Teamwork, but you still need +' + (failedBy - spend) + ' to convert this fail.', 'warn');
    }
    _failedRollContext = null;
    if (typeof closeModal === 'function') closeModal();
    return;
  }

  if (mode === 'reroll') {
    if ((S.tmw || 0) < 2) {
      if (typeof showNotif === 'function') showNotif('Need 2 Teamwork Points.', 'warn');
      return;
    }
    changeCounter('tmw', -2);
    var nextDread = (typeof stepUp === 'function') ? stepUp(dreadDie) : Math.min(20, dreadDie === 4 ? 6 : dreadDie === 6 ? 8 : dreadDie === 8 ? 10 : dreadDie === 10 ? 12 : 20);
    var actionRoll = explodingRoll(actionDie, { type: 'action', major: true, label: 'Push Luck Action' });
    var dreadRoll = explodingRoll(nextDread, { type: 'dread', major: true, label: 'Push Luck Dread' });
    var success = actionRoll.total >= dreadRoll.total;
    var html = ''
      + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
      + 'Push Your Luck reroll resolved.<br>Dread stepped up: <strong style="color:var(--red2);">d' + dreadDie + ' → d' + nextDread + '</strong>'
      + '</div>'
      + '<div style="display:flex;gap:.8rem;align-items:center;margin-top:.45rem;">'
      + '<div><div style="font-size:.68rem;color:var(--muted2);">Action</div><div style="font-size:1.35rem;color:var(--teal);font-family:Rajdhani,sans-serif;font-weight:700;">' + actionRoll.total + '</div></div>'
      + '<div style="font-size:.9rem;color:var(--muted2);">vs</div>'
      + '<div><div style="font-size:.68rem;color:var(--muted2);">Dread</div><div style="font-size:1.35rem;color:var(--red2);font-family:Rajdhani,sans-serif;font-weight:700;">' + dreadRoll.total + '</div></div>'
      + '</div>'
      + '<div style="margin-top:.4rem;font-size:.9rem;font-weight:700;color:' + (success ? 'var(--green2)' : 'var(--red2)') + ';">' + (success ? 'Success' : 'Failure') + '</div>';
    if (typeof openModal === 'function') openModal('Push Your Luck Result', html);
    if (!success && typeof addTMWOnFail === 'function') addTMWOnFail('push-luck-failure', { skipPrompt: true });
    _failedRollContext = null;
    return;
  }

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

function applyFallbackAriaLabels() {
  const controls = document.querySelectorAll('input,select,textarea');
  controls.forEach(function (el) {
    if (!el || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
    const explicit = el.getAttribute('placeholder') || el.getAttribute('name') || '';
    const id = el.id || '';
    let inferred = explicit;
    if (!inferred && id) {
      inferred = id
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\d+/g, ' $& ')
        .trim();
    }
    if (inferred) {
      el.setAttribute('aria-label', inferred);
    }
  });
}

setTimeout(function () {
  try { applyFallbackAriaLabels(); } catch (_err) {}
}, 400);

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
  var nextFlavor = pick(PERSONAL_FLAVORS);
  if (typeof setFlavor === 'function') {
    setFlavor(nextFlavor);
  } else {
    S.flavor = nextFlavor;
    setInputValue("charFlavor", S.flavor);
  }
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

  var cap = (typeof getBackpackCapacity === 'function') ? getBackpackCapacity() : 6;
  S.backpack = Array(Math.max(6, cap)).fill('');
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
  S.health = 0;
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
  if (typeof updateHealthUI === 'function') updateHealthUI();
  if (typeof updateInjuriesUI === 'function') updateInjuriesUI();
  if (typeof updateScarUI === 'function') updateScarUI();
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
  S.health = 0;
  S.stress = 0;
  S.trauma = 0;
  S.mentalStress = 0;
  S.rads = 0;
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
  if (typeof updateHealthUI === 'function') updateHealthUI();
  if (typeof updateMentalStressUI === 'function') updateMentalStressUI();
  if (typeof updateRadsUI === 'function') updateRadsUI();
  renderTraits();
  updateTMWPool();
  if (typeof renderOSHacksPanel   === 'function') { renderOSHacksPanel(); }
  if (typeof renderWeaponModsPanel === 'function') { renderWeaponModsPanel(); }
  if (typeof updateInjuriesUI === 'function') updateInjuriesUI();
  if (typeof updateScarUI === 'function') updateScarUI();
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
      + '<button class="btn btn-sm btn-red" onclick="closeModal(); clearCharacter({force:true})">Clear Anyway</button>'
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

window.confirmClearCharacter = confirmClearCharacter;

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

function exportWayfarerSheetPDF(options) {
  try {
    const opts = options || {};
    const compact = !!opts.compact;
    const gameSheet = !!opts.gameSheet;
    const node = document.getElementById('tab-character');
    if (!node) {
      showNotif('Wayfarer tab not found', 'warn');
      return;
    }
    const w = window.open('', '_blank', 'width=1080,height=900');
    if (!w) {
      showNotif('Popup blocked. Allow popups to export PDF.', 'warn');
      return;
    }
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(function(link) {
      return '<link rel="stylesheet" href="' + link.href + '">';
    }).join('');
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Wayfarer Sheet</title>'
      + cssLinks
      + '<style>body{background:' + (gameSheet ? '#f6f1e7' : '#fff') + ';color:#111;padding:' + (compact ? '6px' : '12px') + ';font-size:' + (compact ? '13px' : '15px') + ';font-family:' + (gameSheet ? '"Crimson Pro",Georgia,serif' : 'inherit') + ';} header,#globalQuickAccess,.ctx-bar,.quick-nav{display:none!important;} .tab-panel{display:block!important;min-height:auto!important;} button{display:none!important;} '
      + (gameSheet ? '.card{border:1px solid #5b4a2b;background:#fffaf1;box-shadow:none;} .section-title{color:#5b4a2b;border-bottom:1px solid #c9b58a;} .char-grid{grid-template-columns:1fr 1fr!important;gap:.6rem;}' : '')
      + '@media print{body{padding:0;} .card{break-inside:avoid; margin-bottom:' + (compact ? '4px' : '8px') + ';} .char-grid{gap:' + (compact ? '.35rem' : '.75rem') + ';}}</style>'
      + '</head><body>'
      + '<h1 style="font:700 ' + (compact ? '16px' : '20px') + ' Cinzel,serif;margin:0 0 8px;">Wayfarer Sheet' + (gameSheet ? ' (Game Sheet)' : (compact ? ' (Compact)' : '')) + '</h1>'
      + node.outerHTML
      + '<script>setTimeout(function(){window.print();},220);</script>'
      + '</body></html>');
    w.document.close();
    showNotif('Wayfarer PDF print view opened', 'good');
  } catch (_err) {
    showNotif('Could not prepare Wayfarer PDF export', 'warn');
  }
}

function openWayfarerExportModal() {
  if (typeof openModal !== 'function') return;
  openModal('Export Wayfarer Sheet', ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + '<div style="margin-bottom:.45rem;">Choose an export format for the Character (Wayfarer) page only.</div>'
    + '<div style="display:grid;gap:.3rem;">'
    + '<button class="btn btn-sm btn-teal" onclick="closeModal(); exportWayfarerSheetPDF({gameSheet:true,compact:false});">PDF (Game Sheet Layout)</button>'
    + '<button class="btn btn-sm btn-teal" onclick="closeModal(); exportWayfarerSheetPDF({compact:false});">PDF (Standard Print Layout)</button>'
    + '<button class="btn btn-sm" onclick="closeModal(); exportWayfarerSheetPDF({compact:true});">PDF (Compact Print Layout)</button>'
    + '<button class="btn btn-sm" onclick="closeModal(); exportWayfarerSheetImage();">PNG Image</button>'
    + '</div>'
    + '</div>');
}

function loadScriptOnce(url, globalName, cb) {
  if (globalName && window[globalName]) {
    cb(true);
    return;
  }
  const existing = document.querySelector('script[data-lib="' + url + '"]');
  if (existing) {
    existing.addEventListener('load', function () { cb(!!(globalName ? window[globalName] : true)); }, { once: true });
    existing.addEventListener('error', function () { cb(false); }, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = url;
  script.async = true;
  script.dataset.lib = url;
  script.onload = function () { cb(!!(globalName ? window[globalName] : true)); };
  script.onerror = function () { cb(false); };
  document.head.appendChild(script);
}

function exportWayfarerSheetImage() {
  const node = document.getElementById('tab-character');
  if (!node) {
    showNotif('Wayfarer tab not found', 'warn');
    return;
  }
  loadScriptOnce('https://unpkg.com/dom-to-image-more@3.3.0/dist/dom-to-image-more.min.js', 'domtoimage', function (ok) {
    if (!ok || !window.domtoimage) {
      showNotif('Image export library failed to load', 'warn');
      return;
    }
    window.domtoimage.toPng(node, {
      bgcolor: '#0b0c1a',
      quality: 1,
      width: node.scrollWidth,
      height: node.scrollHeight,
      style: { transform: 'scale(1)', transformOrigin: 'top left' }
    }).then(function (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'wayfarer-sheet-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotif('Wayfarer image downloaded', 'good');
    }).catch(function () {
      showNotif('Could not export Wayfarer image', 'warn');
    });
  });
}

function ensureGMStoryState() {
  if (!S.gmStoryState || typeof S.gmStoryState !== 'object') {
    S.gmStoryState = { nodes: [] };
  }
  if (!Array.isArray(S.gmStoryState.nodes)) S.gmStoryState.nodes = [];
}

function getGMStoryTriggerLabel(triggerType, triggerValue) {
  const type = String(triggerType || 'manual');
  const value = String(triggerValue || '').trim();
  if (type === 'hex') return value ? ('Hex: ' + value) : 'Hex trigger';
  if (type === 'mission') return value ? ('Mission: ' + value) : 'Mission trigger';
  return 'Manual trigger';
}

function openGMStoryComposer() {
  ensureGMStoryState();
  if (typeof openModal !== 'function') return;
  openModal('GM Story Composer', ''
    + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
    + '<div style="margin-bottom:.35rem;">Create a scene node with up to 3 dialogue choices.</div>'
    + '<input id="gmStoryTitle" placeholder="Scene title" style="margin-bottom:.25rem;" />'
    + '<textarea id="gmStoryPrompt" placeholder="Scene prompt / narration" style="min-height:90px;margin-bottom:.25rem;"></textarea>'
    + '<input id="gmChoice1" placeholder="Choice 1 text" style="margin-bottom:.2rem;" />'
    + '<input id="gmOutcome1" placeholder="Choice 1 outcome" style="margin-bottom:.2rem;" />'
    + '<input id="gmChoice2" placeholder="Choice 2 text" style="margin-bottom:.2rem;" />'
    + '<input id="gmOutcome2" placeholder="Choice 2 outcome" style="margin-bottom:.2rem;" />'
    + '<input id="gmChoice3" placeholder="Choice 3 text" style="margin-bottom:.2rem;" />'
    + '<input id="gmOutcome3" placeholder="Choice 3 outcome" style="margin-bottom:.2rem;" />'
    + '<div style="display:flex;gap:.35rem;align-items:center;margin:.3rem 0;flex-wrap:wrap;">'
    + '<label style="font-size:.74rem;color:var(--muted2);">Trigger</label>'
    + '<select id="gmStoryTriggerType"><option value="manual">Manual</option><option value="hex">Hex</option><option value="mission">Mission</option></select>'
    + '<input id="gmStoryTriggerValue" placeholder="Hex [x,y] or mission id" style="flex:1;min-width:180px;" />'
    + '</div>'
    + '<div style="display:flex;gap:.35rem;align-items:center;margin:.3rem 0;">'
    + '<label style="font-size:.74rem;color:var(--muted2);">Dread Override</label>'
    + '<select id="gmStoryDread"><option value="">None</option><option>4</option><option>6</option><option>8</option><option>10</option><option>12</option></select>'
    + '</div>'
    + '<div style="display:flex;gap:.35rem;justify-content:flex-end;">'
    + '<button class="btn btn-sm" onclick="openGMStoryGraph()">Graph</button>'
    + '<button class="btn btn-sm" onclick="openGMStoryLibrary()">Library</button>'
    + '<button class="btn btn-sm btn-teal" onclick="saveGMStoryNode()">Save Scene</button>'
    + '</div>'
    + '</div>');
}

function saveGMStoryNode() {
  ensureGMStoryState();
  const title = String((document.getElementById('gmStoryTitle') || {}).value || '').trim();
  const prompt = String((document.getElementById('gmStoryPrompt') || {}).value || '').trim();
  if (!title || !prompt) {
    showNotif('Scene title and prompt are required', 'warn');
    return;
  }
  const mkChoice = function (idx) {
    const text = String((document.getElementById('gmChoice' + idx) || {}).value || '').trim();
    const outcome = String((document.getElementById('gmOutcome' + idx) || {}).value || '').trim();
    return text ? { text: text, outcome: outcome || 'No immediate outcome.' } : null;
  };
  const choices = [mkChoice(1), mkChoice(2), mkChoice(3)].filter(Boolean);
  const triggerType = String((document.getElementById('gmStoryTriggerType') || {}).value || 'manual');
  const triggerValue = String((document.getElementById('gmStoryTriggerValue') || {}).value || '').trim();
  const dreadRaw = String((document.getElementById('gmStoryDread') || {}).value || '').trim();
  const dreadOverride = dreadRaw ? parseInt(dreadRaw, 10) : null;
  S.gmStoryState.nodes.push({
    id: Date.now(),
    title: title,
    prompt: prompt,
    choices: choices,
    triggerType: triggerType,
    triggerValue: triggerValue,
    dreadOverride: Number.isFinite(dreadOverride) ? dreadOverride : null,
    createdAt: Date.now()
  });
  showNotif('GM scene saved', 'good');
  openGMStoryLibrary();
}

function openGMStoryLibrary() {
  ensureGMStoryState();
  if (typeof openModal !== 'function') return;
  const nodes = S.gmStoryState.nodes || [];
  const rows = nodes.length
    ? nodes.map(function (node, idx) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:.3rem;padding:.25rem 0;border-bottom:1px solid var(--border);">'
        + '<div style="font-size:.78rem;color:var(--text2);">' + node.title + '<div style="font-size:.68rem;color:var(--muted2);">' + getGMStoryTriggerLabel(node.triggerType, node.triggerValue) + '</div></div>'
        + '<button class="btn btn-xs btn-teal" onclick="runGMStoryNode(' + idx + ')">Run</button>'
        + '</div>';
    }).join('')
    : '<div style="font-size:.78rem;color:var(--muted2);">No saved GM scenes yet.</div>';
  openModal('GM Story Library', ''
    + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
    + rows
    + '<div style="margin-top:.45rem;display:flex;justify-content:flex-end;">'
    + '<button class="btn btn-sm" onclick="openGMStoryGraph()">Open Graph</button>'
    + '<button class="btn btn-sm" onclick="openGMStoryComposer()">Back To Composer</button>'
    + '</div></div>');
}

function openGMStoryGraph() {
  ensureGMStoryState();
  const nodes = S.gmStoryState.nodes || [];
  if (!nodes.length) {
    openModal('GM Story Graph', '<div style="font-size:.82rem;color:var(--muted2);">No story nodes yet. Save at least one scene first.</div>');
    return;
  }
  const width = 860;
  const lane = 120;
  const nodeW = 180;
  const nodeH = 64;
  const padX = 34;
  const padY = 34;
  const positions = nodes.map(function (node, idx) {
    const x = padX + idx * (nodeW + 38);
    const y = padY + (idx % 3) * lane;
    return { x: x, y: y, idx: idx, node: node };
  });
  const maxX = Math.max.apply(null, positions.map(function (p) { return p.x; })) + nodeW + padX;
  const maxY = Math.max.apply(null, positions.map(function (p) { return p.y; })) + nodeH + padY;
  const viewW = Math.max(width, maxX);
  const viewH = Math.max(320, maxY);

  const edges = positions.slice(1).map(function (p) {
    const prev = positions[p.idx - 1];
    return '<line x1="' + (prev.x + nodeW) + '" y1="' + (prev.y + (nodeH / 2)) + '" x2="' + p.x + '" y2="' + (p.y + (nodeH / 2)) + '" stroke="var(--border2)" stroke-width="2" marker-end="url(#gmArrow)" />';
  }).join('');

  const boxes = positions.map(function (p) {
    const trigger = getGMStoryTriggerLabel(p.node.triggerType, p.node.triggerValue);
    const safeTitle = String(p.node.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeTrigger = String(trigger || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return ''
      + '<g>'
      + '<rect x="' + p.x + '" y="' + p.y + '" width="' + nodeW + '" height="' + nodeH + '" rx="8" fill="rgba(15,16,32,.95)" stroke="var(--gold)" stroke-width="1.2" />'
      + '<text x="' + (p.x + 8) + '" y="' + (p.y + 22) + '" fill="var(--gold2)" font-size="12" font-family="Cinzel, serif">' + safeTitle + '</text>'
      + '<text x="' + (p.x + 8) + '" y="' + (p.y + 40) + '" fill="var(--muted2)" font-size="10" font-family="Rajdhani, sans-serif">' + safeTrigger + '</text>'
      + '<foreignObject x="' + (p.x + nodeW - 64) + '" y="' + (p.y + nodeH - 24) + '" width="58" height="20">'
      + '<button xmlns="http://www.w3.org/1999/xhtml" class="btn btn-xs btn-teal" style="padding:.1rem .3rem;font-size:.62rem;min-height:1.2rem;" onclick="runGMStoryNode(' + p.idx + ')">Run</button>'
      + '</foreignObject>'
      + '</g>';
  }).join('');

  openModal('GM Story Graph', ''
    + '<div style="font-size:.8rem;color:var(--muted2);margin-bottom:.35rem;">Visual flow of authored scenes. Triggers are shown on each node.</div>'
    + '<div style="overflow:auto;border:1px solid var(--border2);background:#0b0f1a;">'
    + '<svg width="' + viewW + '" height="' + viewH + '" viewBox="0 0 ' + viewW + ' ' + viewH + '">'
    + '<defs><marker id="gmArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="var(--border2)" /></marker></defs>'
    + edges
    + boxes
    + '</svg>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:.3rem;margin-top:.45rem;">'
    + '<button class="btn btn-sm" onclick="openGMStoryLibrary()">Open Library</button>'
    + '<button class="btn btn-sm btn-teal" onclick="openGMStoryComposer()">Add Node</button>'
    + '</div>');
}

function runGMStoryByTrigger(triggerType, triggerValue, options) {
  ensureGMStoryState();
  const opts = options && typeof options === 'object' ? options : {};
  const type = String(triggerType || '').trim();
  const value = String(triggerValue || '').trim();
  const nodes = S.gmStoryState.nodes || [];
  const idx = nodes.findIndex(function (node) {
    return String(node.triggerType || 'manual') === type && String(node.triggerValue || '').trim() === value;
  });
  if (idx < 0) {
    if (!opts.silentNoMatch) showNotif('No GM story node matched trigger ' + type + ':' + value, 'warn');
    return false;
  }
  const node = nodes[idx] || null;
  window._gmStoryLastMatch = {
    type: type,
    value: value,
    index: idx,
    nodeId: node ? node.id : null,
    title: node ? String(node.title || '') : '',
    at: Date.now()
  };
  runGMStoryNode(idx);
  return true;
}

function tryRunGMStoryTriggerValues(triggerType, values) {
  const list = Array.isArray(values) ? values : [values];
  const seen = {};
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    const key = String(raw == null ? '' : raw).trim();
    if (!key || seen[key]) continue;
    seen[key] = true;
    if (runGMStoryByTrigger(triggerType, key, { silentNoMatch: true })) {
      return { matched: true, triggerType: triggerType, triggerValue: key };
    }
  }
  return { matched: false, triggerType: triggerType, triggerValue: '' };
}

function isGMModeForDebugPanel() {
  if (window.Settings && String(window.Settings.gameMode || '') === 'gm') return true;
  if (document && document.body && document.body.classList && document.body.classList.contains('gm-mode')) return true;
  return false;
}

function ensureGMStoryDebugState() {
  if (!window._gmStoryDebugState || typeof window._gmStoryDebugState !== 'object') {
    window._gmStoryDebugState = {
      event: 'none',
      triggerType: '',
      triggerValue: '',
      matched: false,
      matchedNodeId: null,
      matchedTitle: '',
      at: 0
    };
  }
}

function renderGMStoryTriggerDebugPanel() {
  ensureGMStoryDebugState();
  let panel = document.getElementById('gmStoryTriggerDebug');
  if (!isGMModeForDebugPanel()) {
    if (panel) panel.style.display = 'none';
    return;
  }
  const cs = (window.campaignSystem && typeof window.campaignSystem.getState === 'function')
    ? window.campaignSystem.getState()
    : null;
  if (cs && cs.code) {
    if (panel) panel.style.display = 'none';
    return;
  }
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'gmStoryTriggerDebug';
    panel.setAttribute('aria-live', 'polite');
    panel.style.position = 'fixed';
    panel.style.left = '12px';
    panel.style.bottom = '12px';
    panel.style.zIndex = '1300';
    panel.style.maxWidth = '280px';
    panel.style.pointerEvents = 'none';
    panel.style.padding = '.45rem .55rem';
    panel.style.border = '1px solid rgba(176,96,208,.42)';
    panel.style.background = 'rgba(12,12,22,.92)';
    panel.style.boxShadow = '0 10px 26px rgba(0,0,0,.45)';
    panel.style.borderRadius = '.35rem';
    panel.style.fontSize = '.68rem';
    panel.style.lineHeight = '1.35';
    panel.style.color = 'var(--muted2)';
    document.body.appendChild(panel);
  }
  const dbg = window._gmStoryDebugState;
  const stamp = dbg.at ? new Date(dbg.at).toLocaleTimeString() : '-';
  panel.style.display = 'block';
  panel.innerHTML = ''
    + '<div style="font-family:Rajdhani,sans-serif;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);margin-bottom:.18rem;">GM Trigger Debug</div>'
    + '<div>Event: <strong style="color:var(--text2);">' + String(dbg.event || 'none') + '</strong></div>'
    + '<div>Trigger: <span style="color:var(--gold2);">' + String(dbg.triggerType || '-') + '</span> · <span style="color:var(--teal);">' + String(dbg.triggerValue || '-') + '</span></div>'
    + '<div>Matched Node: <strong style="color:' + (dbg.matched ? 'var(--green2)' : 'var(--red2)') + ';">' + (dbg.matched ? String(dbg.matchedNodeId || 'index-only') : 'none') + '</strong></div>'
    + (dbg.matchedTitle ? ('<div style="color:var(--muted2);">' + String(dbg.matchedTitle) + '</div>') : '')
    + '<div style="margin-top:.15rem;color:var(--muted);">' + stamp + '</div>';
}

function recordGMStoryTriggerDebug(eventName, triggerType, triggerValue, matched) {
  ensureGMStoryDebugState();
  const last = window._gmStoryLastMatch || null;
  window._gmStoryDebugState = {
    event: String(eventName || 'manual'),
    triggerType: String(triggerType || ''),
    triggerValue: String(triggerValue || ''),
    matched: !!matched,
    matchedNodeId: matched && last ? (last.nodeId || null) : null,
    matchedTitle: matched && last ? String(last.title || '') : '',
    at: Date.now()
  };
  renderGMStoryTriggerDebugPanel();
}

function installGMStoryRuntimeHooks() {
  if (window._gmStoryRuntimeHooksInstalled) return true;
  if (typeof window.renderHexInfo !== 'function' || typeof window.resolveMission !== 'function') return false;

  window._gmStoryRuntimeHooksInstalled = true;
  window._gmStoryTriggerState = window._gmStoryTriggerState || {
    lastHexKey: '',
    acceptedById: {},
    completedById: {}
  };
  ensureGMStoryDebugState();
  renderGMStoryTriggerDebugPanel();

  const baseRenderHexInfo = window.renderHexInfo;
  window.renderHexInfo = function (hex) {
    const out = baseRenderHexInfo.apply(this, arguments);
    try {
      if (!hex || typeof hex.col !== 'number' || typeof hex.row !== 'number') return out;
      const state = window._gmStoryTriggerState;
      const zeroKey = String(hex.col) + ',' + String(hex.row);
      if (state.lastHexKey === zeroKey) return out;
      state.lastHexKey = zeroKey;
      const result = tryRunGMStoryTriggerValues('hex', [
        '[' + String(hex.col + 1) + ',' + String(hex.row + 1) + ']',
        String(hex.col + 1) + ',' + String(hex.row + 1),
        '[' + zeroKey + ']',
        zeroKey
      ]);
      recordGMStoryTriggerDebug('hex-enter', 'hex', result.matched ? result.triggerValue : '[' + String(hex.col + 1) + ',' + String(hex.row + 1) + ']', result.matched);
    } catch (err) {}
    return out;
  };

  if (typeof window.acceptJob === 'function') {
    const baseAcceptJob = window.acceptJob;
    window.acceptJob = function (jobId) {
      const beforeIds = Array.isArray(S && S.activeMissions)
        ? S.activeMissions.map(function (m) { return String(m && m.id); })
        : [];
      const out = baseAcceptJob.apply(this, arguments);
      try {
        const missions = Array.isArray(S && S.activeMissions) ? S.activeMissions : [];
        const accepted = missions.find(function (m) { return beforeIds.indexOf(String(m && m.id)) < 0; }) || null;
        if (!accepted) return out;
        const idKey = String(accepted.id || '');
        const state = window._gmStoryTriggerState;
        if (idKey && state.acceptedById[idKey]) return out;
        if (idKey) state.acceptedById[idKey] = true;
        const result = tryRunGMStoryTriggerValues('mission', [accepted.id, accepted.title, 'accepted:' + accepted.id, 'accepted:' + accepted.title]);
        recordGMStoryTriggerDebug('mission-accept', 'mission', result.matched ? result.triggerValue : String(accepted.id || accepted.title || ''), result.matched);
      } catch (err) {}
      return out;
    };
  }

  if (typeof window.createMission === 'function') {
    const baseCreateMission = window.createMission;
    window.createMission = function () {
      const out = baseCreateMission.apply(this, arguments);
      try {
        const mission = out && typeof out === 'object' ? out : null;
        if (!mission) return out;
        const idKey = String(mission.id || '');
        const state = window._gmStoryTriggerState;
        if (idKey && state.acceptedById[idKey]) return out;
        if (idKey) state.acceptedById[idKey] = true;
        const result = tryRunGMStoryTriggerValues('mission', [mission.id, mission.title, 'accepted:' + mission.id, 'accepted:' + mission.title]);
        recordGMStoryTriggerDebug('mission-create', 'mission', result.matched ? result.triggerValue : String(mission.id || mission.title || ''), result.matched);
      } catch (err) {}
      return out;
    };
  }

  const baseResolveMission = window.resolveMission;
  window.resolveMission = function (missionId, success) {
    let snapshot = null;
    try {
      const list = Array.isArray(S && S.activeMissions) ? S.activeMissions : [];
      snapshot = list.find(function (m) { return String(m && m.id) === String(missionId); }) || null;
    } catch (err) {}
    const out = baseResolveMission.apply(this, arguments);
    try {
      if (!snapshot) return out;
      const idKey = String(snapshot.id || missionId || '');
      const outcome = success ? 'success' : 'failure';
      const completeKey = idKey + ':' + outcome;
      const state = window._gmStoryTriggerState;
      if (state.completedById[completeKey]) return out;
      state.completedById[completeKey] = true;
      const result = tryRunGMStoryTriggerValues('mission', [
        snapshot.id,
        snapshot.title,
        'completed:' + snapshot.id,
        'completed:' + snapshot.title,
        snapshot.id + ':' + outcome,
        snapshot.title + ':' + outcome
      ]);
      recordGMStoryTriggerDebug('mission-complete-' + outcome, 'mission', result.matched ? result.triggerValue : String(snapshot.id || snapshot.title || ''), result.matched);
    } catch (err) {}
    return out;
  };

  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    if (installGMStoryRuntimeHooks()) return;
    let tries = 0;
    const maxTries = 80;
    const timer = window.setInterval(function () {
      tries += 1;
      if (installGMStoryRuntimeHooks() || tries >= maxTries) {
        window.clearInterval(timer);
      }
    }, 150);
  }, { once: true });
} else {
  if (!installGMStoryRuntimeHooks()) {
    let tries = 0;
    const maxTries = 80;
    const timer = window.setInterval(function () {
      tries += 1;
      if (installGMStoryRuntimeHooks() || tries >= maxTries) {
        window.clearInterval(timer);
      }
    }, 150);
  }
}

function runGMStoryNode(index) {
  ensureGMStoryState();
  const node = (S.gmStoryState.nodes || [])[Number(index) || 0];
  if (!node) {
    showNotif('Story scene not found', 'warn');
    return;
  }
  const choices = (node.choices || []).slice(0, 3);
  const choiceBtns = choices.length
    ? choices.map(function (choice, idx) {
      return '<button class="btn btn-xs btn-teal" style="width:100%;text-align:left;" onclick="resolveGMStoryChoice(' + Number(index) + ',' + idx + ')">' + choice.text + '</button>';
    }).join('')
    : '<div style="font-size:.76rem;color:var(--muted2);">No choices configured for this scene.</div>';
  openModal('GM Scene: ' + node.title, ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + '<div style="margin-bottom:.45rem;">' + node.prompt + '</div>'
    + '<div style="display:grid;gap:.25rem;">' + choiceBtns + '</div>'
    + '</div>');
}

function resolveGMStoryChoice(nodeIndex, choiceIndex) {
  ensureGMStoryState();
  const node = (S.gmStoryState.nodes || [])[Number(nodeIndex) || 0];
  if (!node) return;
  const choice = (node.choices || [])[Number(choiceIndex) || 0];
  if (!choice) return;
  if (node.dreadOverride && typeof setEnemyDread === 'function') {
    setEnemyDread(node.dreadOverride);
  }
  showNotif('GM choice resolved: ' + choice.text, 'good');
  if (typeof openModal === 'function') {
    openModal('Scene Outcome', '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
      + '<div style="margin-bottom:.35rem;"><strong>' + choice.text + '</strong></div>'
      + '<div>' + choice.outcome + '</div>'
      + (node.dreadOverride ? '<div style="margin-top:.35rem;color:var(--gold2);">Enemy Dread set to d' + node.dreadOverride + '.</div>' : '')
      + '</div>');
  }
}

function openGMHexMarkerEditor() {
  if (!window.selectedHex) {
    showNotif('Select a hex first on the map', 'warn');
    return;
  }
  if (typeof openModal !== 'function') return;
  const existing = (window.selectedHex.data && window.selectedHex.data.gmMarker) ? String(window.selectedHex.data.gmMarker) : '';
  openModal('GM Hex Marker', ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + '<div style="margin-bottom:.35rem;">Add a GM-only marker note for Hex [' + (window.selectedHex.col + 1) + ',' + (window.selectedHex.row + 1) + '].</div>'
    + '<input id="gmHexMarkerInput" placeholder="Hidden cache, ambush trigger, clue..." value="' + existing.replace(/"/g, '&quot;') + '" />'
    + '<div style="display:flex;justify-content:flex-end;gap:.35rem;margin-top:.5rem;">'
    + '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>'
    + '<button class="btn btn-sm btn-teal" onclick="saveGMHexMarker()">Save Marker</button>'
    + '</div></div>');
}

function saveGMHexMarker() {
  if (!window.selectedHex) return;
  window.selectedHex.data = window.selectedHex.data || {};
  const marker = String((document.getElementById('gmHexMarkerInput') || {}).value || '').trim();
  if (marker) {
    window.selectedHex.data.gmMarker = marker;
  } else {
    delete window.selectedHex.data.gmMarker;
  }
  if (typeof renderHexInfo === 'function') renderHexInfo(window.selectedHex);
  if (typeof closeModal === 'function') closeModal();
  showNotif(marker ? 'GM marker saved on selected hex' : 'GM marker cleared', 'good');
}

function openGMDreadDirector() {
  if (typeof openModal !== 'function') return;
  const current = S && S.combat && S.combat.enemyDread ? S.combat.enemyDread : 8;
  openModal('GM Dread Director', ''
    + '<div style="font-size:.84rem;color:var(--text2);line-height:1.6;">'
    + '<div style="margin-bottom:.35rem;">Set global enemy dread pressure for the current scene.</div>'
    + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'
    + [4,6,8,10,12].map(function (d) {
      const active = d === current;
      return '<button class="btn btn-xs ' + (active ? 'btn-teal' : '') + '" onclick="if(typeof setEnemyDread===\'function\'){setEnemyDread(' + d + ');} showNotif(\'Enemy Dread set to d' + d + '\',\'good\'); if(typeof openGMDreadDirector===\'function\'){openGMDreadDirector();}">d' + d + '</button>';
    }).join('')
    + '</div>'
    + '</div>');
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
    + '<button class="btn btn-xs" onclick="window.openSoloReference ? window.openSoloReference() : null;">Open Solo Reference</button>'
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
