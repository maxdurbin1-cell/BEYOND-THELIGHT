/**
 * CRUCIBLE HEX TACTICAL SYSTEM
 * 
 * Replaces distance rings with proper tactical hex map combat
 * - Real 2D hex positioning with obstacles, terrain, loot, traps
 * - Movement costs 1 AP per hex
 * - Distance based on hex count (1 hex = Engaged, 2 = Close, 3 = Nearby, 4 = Far, 5+ = Out of Reach)
 * - Personal Flavors for allies and enemies (Wayfarers)
 * - Puzzle-locked zone objectives
 */

// ============================================================================
// HEX COORDINATE & DISTANCE UTILITIES
// ============================================================================

function createHexCoord(q, r) {
  return { q, r };
}

function hexDistance(a, b) {
  if (!a || !b) return 0;
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function getHexesWithinDistance(center, distance) {
  if (!center) return [];
  var hexes = [];
  for (var q = center.q - distance; q <= center.q + distance; q++) {
    for (var r = Math.max(center.r - distance, -q - distance); r <= Math.min(center.r + distance, -q + distance); r++) {
      if (hexDistance(center, createHexCoord(q, r)) <= distance) {
        hexes.push(createHexCoord(q, r));
      }
    }
  }
  return hexes;
}

function hexToKey(hex) {
  if (!hex) return '';
  return hex.q + ',' + hex.r;
}

function keyToHex(key) {
  if (!key) return null;
  var parts = String(key).split(',');
  if (parts.length !== 2) return null;
  return createHexCoord(Number(parts[0]), Number(parts[1]));
}

function getRangeCategory(distance) {
  if (distance <= 1) return 'Engaged';
  if (distance <= 2) return 'Close';
  if (distance <= 3) return 'Nearby';
  if (distance <= 4) return 'Far';
  return 'Out of Reach';
}

function getCrucibleWeaponRangeFromStatText(statText) {
  var text = String(statText || '').toLowerCase();
  if (!text) return 2;
  if (text.indexOf('engaged') >= 0) return 1;
  if (text.indexOf('close') >= 0) return 2;
  if (text.indexOf('nearby') >= 0) return 3;
  if (text.indexOf('far') >= 0) return 4;
  return 2;
}

function canUseCrucibleAttackRange(distance) {
  return Number(distance || 0) > 0 && Number(distance || 0) <= 2;
}

function canUseCruciblePersonalFlavorRange(distance) {
  return Number(distance || 0) > 0 && Number(distance || 0) <= 2;
}

function getCrucibleOpenHexes(unit, match, maxDistance) {
  if (!unit || !unit.position || !match || !match.hexMap || !match.hexMap.hexes) return [];
  var collapsed = (match.expedition && match.expedition.collapsed) ? match.expedition.collapsed : {};
  var apLimit = Math.max(0, Number(maxDistance != null ? maxDistance : unit.ap || 0));
  if (apLimit <= 0) return [];
  var occupied = {};
  (match.allies || []).concat(match.enemies || []).forEach(function (other) {
    if (other && other.position && String(other.id || '') !== String(unit.id || '')) {
      occupied[hexToKey(other.position)] = true;
    }
  });
  return Object.keys(match.hexMap.hexes).map(function (key) {
    var cell = match.hexMap.hexes[key];
    var hex = keyToHex(key);
    return { key: key, cell: cell, hex: hex };
  }).filter(function (entry) {
    if (!entry || !entry.hex || !entry.cell) return false;
    if (collapsed[entry.key]) return false;
    if (entry.cell.obstacle || entry.cell.door) return false;
    if (occupied[entry.key]) return false;
    return hexDistance(unit.position, entry.hex) <= apLimit;
  }).map(function (entry) {
    return {
      q: entry.hex.q,
      r: entry.hex.r,
      cell: entry.cell,
      distance: hexDistance(unit.position, entry.hex)
    };
  });
}

function getCrucibleRandomOpenHex(unit, match, maxDistance) {
  var options = getCrucibleOpenHexes(unit, match, maxDistance).filter(function (hex) {
    return !unit || !unit.position || hex.q !== unit.position.q || hex.r !== unit.position.r;
  });
  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)] || null;
}

// ============================================================================
// HEX MAP GENERATION
// ============================================================================

function generateCrucibleHexMap(seed, size) {
  var mapSize = Math.max(7, Math.min(12, Number(size || 9)));
  var useSeed = Math.max(1, Number(seed || 1));
  
  // Seed-based pseudo-random
  function seededRandom(index) {
    var x = Math.sin(useSeed + index) * 10000;
    return x - Math.floor(x);
  }

  var map = {
    seed: useSeed,
    size: mapSize,
    hexes: {},
    objectives: [],
    spawns: { ally: null, enemy: null }
  };

  // Generate respawn zones
  var allySpawn = createHexCoord(-Math.floor(mapSize / 2) + 1, -Math.floor(mapSize / 2) + 1);
  var enemySpawn = createHexCoord(Math.floor(mapSize / 2) - 1, Math.floor(mapSize / 2) - 1);
  
  map.spawns.ally = allySpawn;
  map.spawns.enemy = enemySpawn;

  // Generate control zones at center + flanks
  var center = createHexCoord(0, 0);
  var flank1 = createHexCoord(-2, 0);
  var flank2 = createHexCoord(2, 0);

  // Populate all hexes
  for (var q = -Math.floor(mapSize / 2); q <= Math.floor(mapSize / 2); q++) {
    for (var r = -Math.floor(mapSize / 2); r <= Math.floor(mapSize / 2); r++) {
      if (Math.abs(q + r) > Math.floor(mapSize / 2)) continue;
      
      var hex = createHexCoord(q, r);
      var key = hexToKey(hex);
      var randIdx = q * 997 + r * 991 + useSeed * 1009;
      var rand = seededRandom(randIdx);
      
      map.hexes[key] = {
        q: hex.q,
        r: hex.r,
        terrain: 'open',
        obstacle: false,
        trap: null,
        loot: null,
        zone: null,
        hideSpot: false,
        door: false
      };

      var cell = map.hexes[key];
      
      // Spawn zones are clear
      if (hexDistance(hex, allySpawn) <= 1 || hexDistance(hex, enemySpawn) <= 1) {
        cell.terrain = 'spawn';
        cell.obstacle = false;
        continue;
      }

      // Determine terrain features
      // Walls/obstacles (~15% chance, avoiding critical paths)
      if (rand < 0.12 && hexDistance(hex, center) > 1) {
        cell.obstacle = true;
        cell.terrain = 'wall';
      }
      
      // Doors between sectors (~8% chance)
      if (rand > 0.88 && rand < 0.95 && hexDistance(hex, center) <= 3) {
        cell.door = true;
        cell.terrain = 'door';
      }
      
      // Hide spots (~10% chance)
      if (rand > 0.75 && rand < 0.85 && !cell.obstacle && !cell.door) {
        cell.hideSpot = true;
        cell.terrain = 'cover';
      }
      
      // Traps (~8% chance) - Body save vs DD6
      if (rand > 0.28 && rand < 0.35 && !cell.obstacle && !cell.door) {
        cell.trap = {
          type: 'spiked_floor',
          damageOnTrigger: Math.floor(1 + seededRandom(randIdx + 100) * 4) // 1-4 damage
        };
        cell.terrain = 'trap';
      }
      
      // Loot spawns (~6% chance) - weapons/armor/HP vials
      if (rand > 0.18 && rand < 0.23 && !cell.obstacle && !cell.door && !cell.trap) {
        var lootType = seededRandom(randIdx * 1.5) < 0.5 ? 'weapon' : (seededRandom(randIdx * 2) < 0.6 ? 'armor' : 'hp_vial');
        cell.loot = {
          type: lootType,
          bonus: 1 + Math.floor(seededRandom(randIdx + 500) * 3) // 1-3 bonus
        };
        cell.terrain = 'loot';
      }
    };
  }

  // Add control zones (require puzzle to unlock)
  var zones = [
    { hex: center, id: 'zone_a', name: 'Center Objective' },
    { hex: flank1, id: 'zone_b', name: 'Left Flank' },
    { hex: flank2, id: 'zone_c', name: 'Right Flank' }
  ];

  zones.forEach(function(zone) {
    var key = hexToKey(zone.hex);
    if (map.hexes[key]) {
      map.hexes[key].zone = {
        id: zone.id,
        name: zone.name,
        controlled: '', // 'ally', 'enemy', or ''
        puzzle: null // Will store puzzle state { solved: bool, team: 'ally'|'enemy' }
      };
      map.objectives.push(zone.id);
    }
  });

  return map;
}

// ============================================================================
// HEX-BASED UNIT POSITIONING
// ============================================================================

function createHexUnit(name, side, role, hex, character) {
  var safeRole = String(role || 'assault').toLowerCase();
  
  // Base stats
  var baseAttack = safeRole === 'sniper' ? 10 : (safeRole === 'support' ? 8 : 8);
  var baseDefend = safeRole === 'tank' ? 10 : 8;
  var hp = safeRole === 'tank' ? 8 : 6; // Reduced from before
  var isAlly = side === 'ally';

  var unit = {
    id: String(side) + '-' + String(Date.now() + Math.random()),
    name: String(name),
    side: String(side),
    role: safeRole,
    position: hex ? { q: hex.q, r: hex.r } : null,
    hp: hp,
    maxHp: hp,
    attackDie: baseAttack,
    defendDie: baseDefend,
    ap: 2,
    isPlayer: false,
    personalFlavor: null, // Will be assigned from PERSONAL_FLAVOR_AUTHORED_TABLE
    conditions: {},
    equipment: { weapon: null, armor: null },
    character: character || null
  };

  return unit;
}

function getUnitDistance(unit1, unit2) {
  if (!unit1 || !unit2 || !unit1.position || !unit2.position) return 999;
  return hexDistance(unit1.position, unit2.position);
}

function canUnitReach(attacker, defender) {
  var dist = getUnitDistance(attacker, defender);
  return canUseCrucibleAttackRange(dist);
}

function getUnitsInHex(team, hexCoord, map) {
  var key = hexToKey(hexCoord);
  return (team || []).filter(function(u) {
    return u && u.position && hexToKey(u.position) === key;
  });
}

// ============================================================================
// MOVEMENT & PATHFINDING
// ============================================================================

function isHexWalkable(hex, map) {
  if (!hex || !map || !map.hexes) return false;
  var key = hexToKey(hex);
  var cell = map.hexes[key];
  if (!cell) return false;
  
  // Can't walk through obstacles or doors (doors require interaction)
  if (cell.obstacle || cell.door) return false;
  
  return true;
}

function canMoveToHex(unit, targetHex, map) {
  if (!unit || !targetHex || !map) return false;
  if (map.expeditionCollapsed && map.expeditionCollapsed[hexToKey(targetHex)]) return false;
  if (!isHexWalkable(targetHex, map)) return false;
  
  // Check trap proximity (can enter, but triggers trap)
  // Check for other units in target hex (can't move to occupied hex)
  return true;
}

function getMoveableMexes(unit, map) {
  if (!unit || !unit.position || !map) return [];
  
  // Units with AP can move horizontally (same cost per hex)
  var distance = 1; // Each AP allows 1 hex of movement
  var reachable = getHexesWithinDistance(unit.position, distance);
  
  return reachable.filter(function(hex) {
    return canMoveToHex(unit, hex, map);
  });
}

function moveUnitToHex(unit, hex, map, log) {
  if (!unit || !hex) {
    if (log) log.push('Invalid move attempted.');
    return false;
  }

  if (!canMoveToHex(unit, hex, map)) {
    if (log) log.push(unit.name + ' cannot move there.');
    return false;
  }

  var cost = getUnitDistance(unit, { position: hex });
  if (cost <= 0) {
    if (log) log.push(unit.name + ' is already there.');
    return false;
  }
  if (Number(unit.ap || 0) < cost) {
    if (log) log.push(unit.name + ' is too far away.');
    return false;
  }

  unit.ap = Math.max(0, Number(unit.ap) - cost);
  unit.position = { q: hex.q, r: hex.r };

  if (log) log.push(unit.name + ' moved to [' + hex.q + ',' + hex.r + '] (' + cost + ' AP).');

  // Trigger terrain effects
  triggerHexTerrainEffects(unit, hex, map, log);

  return true;
}

function triggerHexTerrainEffects(unit, hex, map, log) {
  if (!hex || !map || !map.hexes) return;
  var key = hexToKey(hex);
  var cell = map.hexes[key];
  if (!cell) return;

  // Trap trigger
  if (cell.trap && !unit.trapTriggered) {
    unit.trapTriggered = true;
    var trapDamage = cell.trap.damageOnTrigger || 1;
    // Body save vs DD6
    var bodyDie = (typeof getEffectiveDie === 'function' && unit.character)
      ? getEffectiveDie('body')
      : 6;
    var bodyRoll = Math.floor(Math.random() * bodyDie) + 1;
    var trapRoll = Math.floor(Math.random() * 6) + 1;
    var finalDamage = Math.max(0, Math.abs(trapRoll - bodyRoll));
    
    if (finalDamage > 0) {
      unit.hp = Math.max(0, Number(unit.hp) - finalDamage);
      if (log) log.push('⚠ ' + unit.name + ' triggered a ' + cell.trap.type + ' trap! Save: ' + bodyRoll + ' vs DD6 (' + trapRoll + ') → ' + finalDamage + ' damage.');
    } else {
      if (log) log.push('✓ ' + unit.name + ' avoided the ' + cell.trap.type + ' trap.');
    }
  }

  // Loot pickup
  if (cell.loot && cell.loot.available !== false) {
    cell.loot.available = false;
    if (cell.loot.item) {
      var item = cell.loot.item;
      var itemStat = String(item.stat || '');
      var itemCat = String(item.cat || '').toLowerCase();
      if (itemCat === 'weapons' || itemCat === 'melee_exp' || itemCat === 'ranged_exp') {
        var weaponBonus = Math.max(1, Number((itemStat.match(/\+(\d+)/) || [0, 1])[1] || 1));
        unit.equipment.weapon = {
          name: String(item.name || 'Weapon'),
          affinity: weaponBonus,
          roll: 'D' + (8 + weaponBonus * 2),
          statText: itemStat,
          range: getCrucibleWeaponRangeFromStatText(itemStat)
        };
        if (log) log.push('⚔ ' + unit.name + ' found ' + String(item.name || 'a weapon') + ' (' + itemStat + ').');
      } else if (itemCat === 'armor' || itemCat === 'armor_exp' || itemCat === 'space_armor') {
        var armorBonus = Math.max(1, Number((itemStat.match(/ad(\d+)/i) || [0, 4])[1] || 4) / 2);
        unit.equipment.armor = {
          name: String(item.name || 'Armor'),
          affinity: armorBonus,
          defense: armorBonus,
          statText: itemStat
        };
        if (log) log.push('🛡 ' + unit.name + ' found ' + String(item.name || 'armor') + ' (' + itemStat + ').');
      } else {
        var heal = Math.max(1, Number(cell.loot.bonus || 1));
        unit.hp = Math.min(Number(unit.hp || 0) + heal, Number(unit.maxHp || unit.hp || 0));
        if (log) log.push('✦ ' + unit.name + ' found ' + String(item.name || 'supplies') + ' and recovered ' + heal + ' HP.');
      }
    } else if (cell.loot.type === 'weapon') {
      unit.equipment.weapon = { affinity: cell.loot.bonus, roll: 'D' + (8 + cell.loot.bonus * 2), statText: '+1 Shoot | Nearby', range: 3 };
      if (log) log.push('⚔ ' + unit.name + ' found a weapon (+' + cell.loot.bonus + ' attack).');
    } else if (cell.loot.type === 'armor') {
      unit.equipment.armor = { affinity: cell.loot.bonus, defense: cell.loot.bonus };
      if (log) log.push('🛡 ' + unit.name + ' found armor (+' + cell.loot.bonus + ' defend).');
    } else if (cell.loot.type === 'hp_vial') {
      var healed = Math.min(cell.loot.bonus * 2, Number(unit.maxHp) - Number(unit.hp));
      unit.hp = Math.min(Number(unit.hp) + healed, Number(unit.maxHp));
      if (log) log.push('❤ ' + unit.name + ' found an HP vial (+' + healed + ' HP).');
    }
  }
}

// ============================================================================
// COMBAT ACTIONS
// ============================================================================

function executeDefendAction(unit, targetUnit, log) {
  if (!unit || !targetUnit) return false;
  
  targetUnit.defendBuff = Math.max(0, Number(targetUnit.defendBuff || 0) + 3);
  if (log) log.push('🛡 ' + unit.name + ' defended ' + targetUnit.name + ' (+3 to next defend roll).');
  
  return true;
}

function executeSupportAction(unit, targetUnit, log) {
  if (!unit || !targetUnit) return false;
  
  targetUnit.strikeBonus = Math.max(0, Number(targetUnit.strikeBonus || 0) + 3);
  if (log) log.push('✦ ' + unit.name + ' supported ' + targetUnit.name + ' (+3 to next Strike/Shoot).');
  
  return true;
}

function executeAttackAction(attacker, defender, map, log) {
  if (!attacker || !defender) return false;
  
  var dist = getUnitDistance(attacker, defender);
  var range = getRangeCategory(dist);

  var maxRange = 2;
  if (attacker && attacker.equipment && attacker.equipment.weapon) {
    var statText = String(attacker.equipment.weapon.statText || attacker.equipment.weapon.roll || '');
    maxRange = Number(attacker.equipment.weapon.range || getCrucibleWeaponRangeFromStatText(statText) || 2);
  }
  if (dist <= 0 || dist > maxRange) {
    if (log) log.push(attacker.name + ' cannot reach ' + defender.name + ' (' + range + ').');
    return false;
  }

  var attackDie = Math.max(4, Number(attacker.attackDie || 6));
  if (attacker.equipment && attacker.equipment.weapon) {
    attackDie += Number(attacker.equipment.weapon.affinity || 0);
  }
  var defendDie = Math.max(4, Number(defender.defendDie || 6) + Number(defender.defendBuff || 0));
  if (defender.equipment && defender.equipment.armor) {
    defendDie += Number(defender.equipment.armor.defense || 0);
  }

  var attackRoll = (typeof explodingRoll === 'function')
    ? explodingRoll(attackDie)
    : { total: (Math.floor(Math.random() * attackDie) + 1) };
  var defendRoll = (typeof explodingRoll === 'function')
    ? explodingRoll(defendDie)
    : { total: (Math.floor(Math.random() * defendDie) + 1) };
  var strikeBonus = Math.max(0, Number(attacker.strikeBonus || 0));
  if (strikeBonus > 0) {
    attackRoll.total = Number(attackRoll.total || 0) + strikeBonus;
    if (log) log.push(attacker.name + ' consumed support bonus (+' + strikeBonus + ').');
  }

  var damage = Math.max(0, Number(attackRoll.total || 0) - Number(defendRoll.total || 0));
  
  if (damage > 0) {
    defender.hp = Math.max(0, Number(defender.hp) - damage);
    if (log) log.push('💥 ' + attacker.name + ' attacked ' + defender.name + ' [' + Number(attackRoll.total || 0) + ' vs ' + Number(defendRoll.total || 0) + '] = ' + damage + ' damage.');
  } else {
    if (log) log.push(attacker.name + ' attacked but ' + defender.name + ' defended.');
  }

  attacker.strikeBonus = 0;
  attacker.defendBuff = 0;
  return damage > 0;
}

// ============================================================================
// PERSONAL FLAVOR INTEGRATION
// ============================================================================

function assignRandomPersonalFlavor(unit) {
  if (!unit || typeof window === 'undefined') return null;
  
  try {
    var flavorTable = window.PERSONAL_FLAVOR_AUTHORED_TABLE || {};
    var keys = Object.keys(flavorTable).filter(function(k) {
      var entry = flavorTable[k];
      return entry && entry.archetype && entry.mechanicMode !== 'passive';
    });
    
    if (keys.length === 0) return null;
    
    var chosen = keys[Math.floor(Math.random() * keys.length)];
    var entry = flavorTable[chosen];
    
    unit.personalFlavor = {
      key: chosen,
      name: entry.name || chosen,
      cooldown: entry.cooldownType || 'encounter',
      cooldownStamp: null,
      used: false
    };
    
    return unit.personalFlavor;
  } catch (err) {
    return null;
  }
}

function canUsePersonalFlavor(unit, currentStamp) {
  if (!unit || !unit.personalFlavor) return false;
  
  var lastStamp = unit.personalFlavor.cooldownStamp;
  
  if (unit.personalFlavor.cooldown === 'day') {
    return lastStamp !== currentStamp;
  }
  if (unit.personalFlavor.cooldown === 'phase') {
    return true; // Can use multiple times per phase
  }
  if (unit.personalFlavor.cooldown === 'encounter') {
    return !unit.personalFlavor.used;
  }
  
  return true;
}

function getPersonalFlavorBaseKey(unit) {
  if (!unit || !unit.personalFlavor) return '';
  var raw = String(unit.personalFlavor.full || unit.personalFlavor.name || '').trim().toLowerCase();
  if (!raw) return '';
  var cut = raw.indexOf(':');
  return (cut >= 0 ? raw.slice(0, cut) : raw).trim();
}

function getPersonalFlavorTargetDistance(actor, target) {
  if (!actor || !target || !actor.position || !target.position || typeof getUnitDistance !== 'function') return 99;
  return Number(getUnitDistance(actor, target) || 99);
}

function tryRelocateFlavorUser(unit, match, log) {
  if (!unit || !match || typeof getCrucibleRandomOpenHex !== 'function') return false;
  var destination = getCrucibleRandomOpenHex(unit, match, 3);
  if (!destination) return false;
  unit.position = { q: Number(destination.q || 0), r: Number(destination.r || 0) };
  if (log) log.push(unit.name + ' blinked to [' + Number(destination.q || 0) + ',' + Number(destination.r || 0) + '].');
  return true;
}

function damageFlavorTarget(unit, target, amount, log, text) {
  if (!unit || !target || Number(target.hp || 0) <= 0) return 0;
  var dealt = Math.max(0, Math.min(Number(target.hp || 0), Number(amount || 0)));
  if (dealt <= 0) return 0;
  target.hp = Math.max(0, Number(target.hp || 0) - dealt);
  if (log) log.push(text || (unit.name + ' hit ' + target.name + ' for ' + dealt + ' extra damage.'));
  return dealt;
}

function executePersonalFlavor(unit, cooldownStamp, map, log, options) {
  if (!unit || !unit.personalFlavor) return false;
  var opts = options || {};
  var target = opts.target || null;
  var match = opts.match || null;
  var targetDistance = getPersonalFlavorTargetDistance(unit, target);
  var base = getPersonalFlavorBaseKey(unit);
  
  if (!canUsePersonalFlavor(unit, cooldownStamp)) {
    if (log) log.push(unit.name + ' ' + (unit.personalFlavor.name || 'flavor') + ' is on cooldown.');
    return false;
  }

  unit.personalFlavor.used = true;
  unit.personalFlavor.cooldownStamp = cooldownStamp;
  if (log) log.push('✨ ' + unit.name + ' used Personal Flavor: ' + (unit.personalFlavor.name || 'Unknown') + '.');

  if (base.indexOf('holy shield') >= 0 || base.indexOf('psychic dome') >= 0 || base.indexOf('mercy hand') >= 0 || base.indexOf('grim resolve') >= 0 || base.indexOf('quick stitch') >= 0) {
    unit.defendBuff = Math.max(0, Number(unit.defendBuff || 0) + 3);
    unit.hp = Math.min(Number(unit.maxHp || unit.hp || 0), Number(unit.hp || 0) + 1);
    if (log) log.push(unit.name + ' raised a ward: +3 Defend and restored 1 HP.');
    return true;
  }

  if (base.indexOf('teleportation') >= 0 || base.indexOf('phase walker') >= 0 || base.indexOf('night courier') >= 0 || base.indexOf('pathfinder') >= 0) {
    tryRelocateFlavorUser(unit, match, log);
    unit.strikeBonus = Math.max(0, Number(unit.strikeBonus || 0) + 2);
    if (log) log.push(unit.name + ' lined up the next strike from a new angle (+2 attack).');
    return true;
  }

  if (base.indexOf('vampire') >= 0 || base.indexOf('siphon energy') >= 0) {
    var drain = damageFlavorTarget(unit, target, 2, log, unit.name + ' drained 2 HP from ' + (target ? target.name : 'the air') + '.');
    if (drain > 0) {
      unit.hp = Math.min(Number(unit.maxHp || unit.hp || 0), Number(unit.hp || 0) + drain);
      if (log) log.push(unit.name + ' recovered ' + drain + ' HP.');
    }
    return true;
  }

  if (base.indexOf('quick draw') >= 0 || base.indexOf('silent knife') >= 0 || base.indexOf('hunt rhythm') >= 0 || base.indexOf('beast call') >= 0 || base.indexOf('wild empathy') >= 0) {
    damageFlavorTarget(unit, target, 2, log, unit.name + ' opened a clean line on ' + (target ? target.name : 'the target') + ' for 2 bonus damage.');
    unit.strikeBonus = Math.max(0, Number(unit.strikeBonus || 0) + 1);
    return true;
  }

  if (base.indexOf('runesmith') >= 0 || base.indexOf('scrap alchemist') >= 0 || base.indexOf('enhance abilities') >= 0 || base.indexOf('cloning') >= 0) {
    unit.strikeBonus = Math.max(0, Number(unit.strikeBonus || 0) + 3);
    unit.defendBuff = Math.max(0, Number(unit.defendBuff || 0) + 1);
    if (log) log.push(unit.name + ' forged a combat edge: +3 attack and +1 defend.');
    return true;
  }

  if (base.indexOf('reverse time') >= 0 || base.indexOf('time traveler') >= 0 || base.indexOf('relive last moments') >= 0 || base.indexOf('shed skin') >= 0 || base.indexOf('undying') >= 0) {
    unit.hp = Math.min(Number(unit.maxHp || unit.hp || 0), Number(unit.hp || 0) + 2);
    unit.defendBuff = Math.max(0, Number(unit.defendBuff || 0) + 2);
    if (log) log.push(unit.name + ' rewound the worst of the exchange: +2 HP and +2 Defend.');
    return true;
  }

  if (base.indexOf('stop time') >= 0 || base.indexOf('slow time') >= 0 || base.indexOf('increase gravity') >= 0 || base.indexOf('tremor pulse') >= 0) {
    if (target && targetDistance <= 2) {
      target.ap = Math.max(0, Number(target.ap || 0) - 1);
      damageFlavorTarget(unit, target, 1, log, unit.name + ' locked ' + target.name + ' in place for 1 damage and stole 1 AP.');
    } else if (log) {
      log.push(unit.name + ' warped the tempo of the fight, but no close target was in reach.');
    }
    return true;
  }

  if (base.indexOf('ruin scholar') >= 0 || base.indexOf('vault memory') >= 0 || base.indexOf('moon listener') >= 0 || base.indexOf('void gazer') >= 0 || base.indexOf('cold reader') >= 0 || base.indexOf('dust prophet') >= 0 || base.indexOf('faultline sense') >= 0) {
    if (target && targetDistance <= 2) {
      target.defendBuff = Math.min(0, Number(target.defendBuff || 0) - 2);
      damageFlavorTarget(unit, target, 1, log, unit.name + ' exposed ' + target.name + ' for 1 damage and -2 defend.');
    } else if (log) {
      log.push(unit.name + ' read the scene and marked the next opening.');
      unit.strikeBonus = Math.max(0, Number(unit.strikeBonus || 0) + 2);
    }
    return true;
  }

  if (target && targetDistance <= 2) {
    damageFlavorTarget(unit, target, 1, log, unit.name + ' pressed a small opening on ' + target.name + ' for 1 damage.');
  } else {
    unit.strikeBonus = Math.max(0, Number(unit.strikeBonus || 0) + 2);
    if (log) log.push(unit.name + ' banked momentum for the next attack (+2 attack).');
  }
  
  return true;
}

// ============================================================================
// ZONE CONTROL & PUZZLES
// ============================================================================

function getControlledZones(team, map) {
  if (!team || !map || !map.hexes) return [];
  
  var controlled = [];
  map.objectives.forEach(function(zoneId) {
    Object.keys(map.hexes).forEach(function(key) {
      var cell = map.hexes[key];
      if (!cell || !cell.zone || cell.zone.id !== zoneId) return;
      
      var unitsHere = team.filter(function(u) { return u && hexToKey(u.position) === key; });
      if (unitsHere.length > 0) {
        if (!controlled.includes(zoneId)) {
          controlled.push(zoneId);
        }
      }
    });
  });
  
  return controlled;
}

function assignZonePuzzle(map, zoneId, puzzleType) {
  if (!map || !map.hexes) return null;
  
  Object.keys(map.hexes).forEach(function(key) {
    var cell = map.hexes[key];
    if (cell && cell.zone && cell.zone.id === zoneId) {
      cell.zone.puzzle = {
        type: puzzleType || 'chess_puzzle',
        solved: false,
        solvedBy: ''
      };
    }
  });
  
  return true;
}

// ============================================================================
// HEX MAP RENDERING
// ============================================================================

function renderCrucibleHexMap(map, units, selectedUnitId, options) {
  if (!map || !map.hexes) return '<div>No map data.</div>';
  var opts = options || {};
  var activeSide = String(opts.turnSide || 'ally');
  var collapsedLookup = {};
  (Array.isArray(opts.collapsedHexKeys) ? opts.collapsedHexKeys : []).forEach(function (key) {
    collapsedLookup[String(key || '')] = true;
  });
  var reachableLookup = {};
  (Array.isArray(opts.reachableHexKeys) ? opts.reachableHexKeys : []).forEach(function (key) {
    reachableLookup[String(key || '')] = true;
  });

  var hexSize = 28;
  var hexHTML = '<svg width="640" height="620" viewBox="0 0 640 620" style="border:1px solid var(--border2);background:radial-gradient(circle at 50% 45%, rgba(70,196,182,.12), rgba(6,8,12,.95));border-radius:8px;margin-bottom:.2rem;">';
  
  function pixelCoord(hex, size, originX, originY) {
    var x = size * (3/2 * hex.q);
    var y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return {
      x: originX + x,
      y: originY + y
    };
  }

  function hexPolygonPoints(cx, cy, size) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 180 * (60 * i - 30);
      var px = cx + size * Math.cos(angle);
      var py = cy + size * Math.sin(angle);
      pts.push(px.toFixed(2) + ',' + py.toFixed(2));
    }
    return pts.join(' ');
  }

  var originX = 320;
  var originY = 305;

  // Draw hexagon backgrounds
  Object.keys(map.hexes).forEach(function(key) {
    var cell = map.hexes[key];
    if (!cell) return;
    var cellKey = hexToKey(cell);
    var isCollapsed = !!collapsedLookup[cellKey];

    var pix = pixelCoord(cell, hexSize, originX, originY);
    var color = '#1c2430';
    var opacity = 0.9;
    var strokeColor = 'rgba(255,255,255,.26)';
    var strokeWidth = 1.1;

    if (isCollapsed) {
      color = 'rgba(28,28,34,.95)';
      strokeColor = 'rgba(160,70,70,.6)';
      strokeWidth = 1.4;
      opacity = 0.8;
    }

    if (cell.obstacle) {
      color = 'rgba(200,80,80,.55)';
      strokeColor = 'rgba(255,130,130,.8)';
      strokeWidth = 1.4;
    } else if (cell.trap) {
      color = 'rgba(232,153,64,.45)';
      strokeColor = 'rgba(255,204,120,.8)';
    } else if (cell.loot) {
      color = 'rgba(220,184,74,.45)';
      strokeColor = 'rgba(255,230,150,.8)';
    } else if (cell.zone) {
      color = 'rgba(70,196,182,.38)';
      strokeColor = 'rgba(112,235,215,.8)';
    } else if (cell.terrain === 'spawn') {
      color = 'rgba(86,189,109,.35)';
      strokeColor = 'rgba(145,240,170,.75)';
    } else if (cell.terrain === 'temple') {
      color = 'rgba(120,162,242,.35)';
      strokeColor = 'rgba(175,205,255,.8)';
    } else if (cell.terrain === 'ruin') {
      color = 'rgba(158,134,95,.34)';
      strokeColor = 'rgba(214,190,142,.8)';
    } else if (cell.terrain === 'gate') {
      color = 'rgba(92,132,194,.36)';
      strokeColor = 'rgba(160,202,255,.85)';
    } else if (cell.terrain === 'portal') {
      color = 'rgba(147,90,214,.34)';
      strokeColor = 'rgba(210,168,255,.86)';
    }

    var isReachable = !!reachableLookup[cellKey];
    var clickAttr = (isReachable && !isCollapsed)
      ? ' style="cursor:pointer;" onclick="holdingCrucibleHandleBoardHexClick(' + Number(cell.q) + ',' + Number(cell.r) + ')" ondragover="holdingCrucibleHandleHexDragOver(event,' + Number(cell.q) + ',' + Number(cell.r) + ')" ondrop="return holdingCrucibleDropOnHex(' + Number(cell.q) + ',' + Number(cell.r) + ')"'
      : '';
    if (isReachable && !isCollapsed) {
      strokeColor = 'rgba(255,220,120,.95)';
      strokeWidth = 2.1;
    }

    hexHTML += '<polygon points="' + hexPolygonPoints(pix.x, pix.y, hexSize * 0.64) + '" fill="' + color + '" opacity="' + opacity + '" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '"' + clickAttr + '/>';
    hexHTML += '<text x="' + pix.x + '" y="' + (pix.y + hexSize * 0.5) + '" text-anchor="middle" font-size="7" fill="rgba(255,255,255,.45)">' + cell.q + ',' + cell.r + '</text>';
    
    // Terrain icon
    if (isCollapsed) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(240,110,110,.95)">✖</text>';
    } else if (cell.obstacle) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="14" fill="rgba(255,255,255,.95)">■</text>';
    } else if (cell.trap) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="14" fill="rgba(255,238,182,.95)">⚠</text>';
    } else if (cell.loot) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(255,255,230,.95)">' + (cell.loot.type === 'weapon' ? '⚔' : (cell.loot.type === 'armor' ? '🛡' : '❤')) + '</text>';
    } else if (cell.terrain === 'temple') {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(225,236,255,.95)">⛩</text>';
    } else if (cell.terrain === 'ruin') {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(255,236,190,.95)">🏚</text>';
    } else if (cell.terrain === 'gate') {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(218,232,255,.95)">🜂</text>';
    } else if (cell.terrain === 'portal') {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(238,217,255,.95)">◉</text>';
    } else if (cell.zone) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="rgba(210,255,247,.95)" font-weight="bold">' + cell.zone.id.charAt(5) + '</text>';
    }
  });

  // Draw units
  if (units && units.length) {
    units.forEach(function(unit) {
      if (!unit || !unit.position) return;

      var pix = pixelCoord(unit.position, hexSize, originX, originY);
      var unitColor = unit.side === 'ally' ? 'rgba(78,222,150,.95)' : 'rgba(235,98,110,.95)';
      var isSelected = String(unit.id) === String(selectedUnitId);
      var isTarget = String(unit.id) === String(opts.selectedTargetId || '');
      var stroke = isSelected ? 3 : 1.2;
      var clickAttr = ' style="cursor:pointer;" onclick="holdingCrucibleHandleBoardUnitClick(\'' + String(unit.side || 'ally').replace(/'/g, '&#39;') + '\',\'' + String(unit.id || '').replace(/'/g, '&#39;') + '\')"';
      var canDrag = String(unit.side || 'ally') === activeSide && Number(unit.ap || 0) > 0 && Number(unit.hp || 0) > 0;
      var dragAttr = canDrag
        ? (' draggable="true" ondragstart="return holdingCrucibleStartDrag(\'' + String(unit.side || 'ally').replace(/'/g, '&#39;') + '\',\'' + String(unit.id || '').replace(/'/g, '&#39;') + '\')" ondragend="holdingCrucibleEndDrag()"')
        : '';

      hexHTML += '<circle cx="' + pix.x + '" cy="' + pix.y + '" r="' + (hexSize * 0.38) + '" fill="' + unitColor + '" stroke="' + (isSelected ? 'rgba(255,220,120,.95)' : 'rgba(255,255,255,.82)') + '" stroke-width="' + stroke + '"' + clickAttr + dragAttr + '/>';
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="10" fill="#111822" font-weight="bold">' + (unit.name.charAt(0) || 'U') + '</text>';
      if (isSelected) {
        hexHTML += '<circle cx="' + pix.x + '" cy="' + pix.y + '" r="' + (hexSize * 0.5) + '" fill="none" stroke="rgba(255,220,120,.45)" stroke-width="2"/>';
      } else if (isTarget) {
        hexHTML += '<circle cx="' + pix.x + '" cy="' + pix.y + '" r="' + (hexSize * 0.47) + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-dasharray="4 3" stroke-width="1.6"/>';
      }
    });
  }

  hexHTML += '</svg>';
  hexHTML += '<div style="display:flex;gap:.16rem;flex-wrap:wrap;font-size:.66rem;color:var(--muted2);line-height:1.35;margin-top:.04rem;">'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">Green token = Ally</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">Red token = Enemy</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">Token letter = unit initial</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">■ Obstacle (blocked)</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">⚠ Trap</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">⚔/🛡/❤ Loot</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">⛩ Temple (flask refill)</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">🏚 Ruins</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">🜂 Gate</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">◉ Portal</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">A/B/C Objective zones</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">✖ Collapsed hex (void)</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">Gold ring = selected unit</span>'
    + '<span style="border:1px solid var(--border2);padding:.08rem .18rem;">Drag active-side token onto glowing hex to move</span>'
  + '</div>';
  
  return hexHTML;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function getHexMovementButtonsHtml(unit, match) {
  if (!unit || !unit.position || !match || !match.hexMap || Number(unit.ap || 0) === 0) {
    return '<div style="font-size:.7rem;color:var(--muted2);">No AP remaining.</div>';
  }

  var reachable = getCrucibleOpenHexes(unit, match, Number(unit.ap || 0)).filter(function (hex) {
    return !unit.position || hex.q !== unit.position.q || hex.r !== unit.position.r;
  });

  if (reachable.length === 0) {
    return '<div style="font-size:.7rem;color:var(--muted2);">No reachable movement options.</div>';
  }

  var buttons = reachable.sort(function (a, b) { return Number(a.distance || 0) - Number(b.distance || 0); }).map(function(hex) {
    var label = '[' + hex.q + ',' + hex.r + ']';
    var terrain = hex.cell.terrain || 'open';
    var icon = terrain === 'trap' ? '⚠' : (terrain === 'loot' ? '⚔' : (terrain === 'cover' ? '🛡' : '⬡'));
    
    return '<button class="btn btn-xs" onclick="holdingCrucibleMoveSelected(' + hex.q + ',' + hex.r + ');" style="font-size:.7rem;">' 
      + icon + ' ' + label + ' · ' + Number(hex.distance || 0)
      + '</button>';
  }).join('');

  return '<div style="display:flex;gap:.15rem;flex-wrap:wrap;">' + buttons + '</div>';
}

function getHexUnitDetailsHtml(unit) {
  if (!unit) return '';
  
  var hp = Number(unit.hp || 0);
  var maxHp = Number(unit.maxHp || 0);
  var hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0;
  
  var equipment = '';
  if (unit.equipment && unit.equipment.weapon) {
    equipment += '⚔ Weapon +' + (unit.equipment.weapon.affinity || 0) + ' ';
  }
  if (unit.equipment && unit.equipment.armor) {
    equipment += '🛡 Armor +' + (unit.equipment.armor.defense || 0);
  }
  
  var flavor = '';
  if (unit.personalFlavor) {
    var flavorUsed = unit.personalFlavor.used ? ' (cooldown)' : '';
    flavor = '<div style="font-size:.68rem;color:var(--teal);margin-top:.15rem;">✨ ' + (unit.personalFlavor.name || 'Flavor') + flavorUsed + '</div>';
  }

  return '<div style="font-size:.68rem;line-height:1.45;">'
    + '<strong>' + unit.name + '</strong> · ' + unit.role + '<br>'
    + 'HP: ' + hp + '/' + maxHp + ' (' + hpPercent + '%) · Pos [' + unit.position.q + ',' + unit.position.r + ']<br>'
    + 'AP: ' + (unit.ap || 0) + ' · Atk D' + (unit.attackDie || 6) + ' / Def D' + (unit.defendDie || 6) + '<br>'
    + (equipment ? (equipment + '<br>') : '')
    + flavor
    + '</div>';
}

// ============================================================================
// ENVIRONMENTAL COMBAT — INTERACTABLES, VERTICALITY, SHOVE, EXPLOSIONS
// ============================================================================

var ENVIRONMENTAL_INTERACTABLE_TABLE = [
  { id:'explosive_rune',     name:'Explosive Rune',         icon:'💥', category:'explosive',    elevation:0, flavor:'Arcane glyphs carved into the stone pulse with unstable energy.', effect:'Any unit ending movement here triggers a d6 explosion (2-hex radius, Body save vs d6 or take damage).', triggerVerb:'Detonate Rune', triggerCost:1, triggerFn:'triggerInteractableExplosion', radius:2, active:true, hexOffset:{q:1,r:-2}  },
  { id:'powder_keg',         name:'Powder Keg',             icon:'🛢', category:'explosive',    elevation:0, flavor:'A barrel of volatile black powder, left from a previous raid.', effect:'Strike it to detonate: 3-hex radius explosion, d8+2 damage. Destroys surrounding terrain.', triggerVerb:'Strike Keg',    triggerCost:1, triggerFn:'triggerInteractableExplosion', radius:3, active:true, hexOffset:{q:-2,r:1}  },
  { id:'fire_brazier',       name:'Fire Brazier',           icon:'🔥', category:'explosive',    elevation:0, flavor:'A standing iron brazier heaped with burning coals.', effect:'Shove an enemy into it: d4 fire damage + Burning condition (−1 Defend until extinguished).', triggerVerb:'Shove Into',     triggerCost:1, triggerFn:'triggerInteractableShoveInto',  radius:0, active:true, hexOffset:{q:2,r:0}   },
  { id:'gas_vent',           name:'Gas Vent',               icon:'🌫', category:'explosive',    elevation:0, flavor:'Steam and foul gas seep through cracks in the floor.', effect:'Igniting deals 1 damage per turn to all units in 1-hex radius for 2 rounds.', triggerVerb:'Ignite Vent',   triggerCost:1, triggerFn:'triggerInteractableExplosion', radius:1, active:true, hexOffset:{q:0,r:2}   },
  { id:'unstable_platform',  name:'Unstable Platform',      icon:'🪨', category:'verticality',  elevation:1, flavor:'A wooden scaffolding platform bolted to the wall — visibly cracking.', effect:'Moving onto it costs +1 AP. Each turn: Body save vs d6 or platform collapses (fall 1 tier, d4 fall damage).', triggerVerb:'Cut Support', triggerCost:1, triggerFn:'triggerInteractableCollapse', radius:1, active:true, hexOffset:{q:-1,r:-2} },
  { id:'rooftop_archer',     name:'Rooftop Archer (NPC)',   icon:'🏹', category:'npc',          elevation:2, flavor:'A bowman perches on the rooftop above, watching the chaos below.', effect:'Signal them (1 AP) for a free d8 ranged shot on any target at Close/Nearby range. Enemies can shove them off for d6 fall damage.', triggerVerb:'Signal Archer', triggerCost:1, triggerFn:'triggerInteractableNpcAssist',  radius:0, active:true, hexOffset:{q:2,r:-2}  },
  { id:'collapsing_bridge',  name:'Collapsing Bridge',      icon:'🌉', category:'verticality',  elevation:1, flavor:'A rope-and-plank bridge spans a pit. The ropes are fraying fast.', effect:'Cut the rope (1 AP): any unit on the bridge falls (d6 damage). Blocks the gap but double-serves as a ramp.', triggerVerb:'Cut Rope',      triggerCost:1, triggerFn:'triggerInteractableCollapse', radius:1, active:true, hexOffset:{q:0,r:-2}  },
  { id:'hanging_chandelier', name:'Hanging Chandelier',     icon:'🕯', category:'verticality',  elevation:2, flavor:'A heavy iron chandelier swings on a chain above the battlefield.', effect:'Shoot the chain (Shoot vs d8) to drop it: d6 damage to all units in a 2-hex column below. Lights any oil slick beneath.', triggerVerb:'Shoot Chain',   triggerCost:1, triggerFn:'triggerInteractableCollapse', radius:2, active:true, hexOffset:{q:-1,r:2}  },
  { id:'high_ground_pillar', name:'High Ground Pillar',     icon:'🗿', category:'verticality',  elevation:1, flavor:'A crumbling stone pillar rises from the arena floor.', effect:'Climbing costs 2 AP. While on it: +1 to Shoot attacks. Being shoved off deals +1 fall damage per elevation tier.', triggerVerb:'Climb Pillar',  triggerCost:2, triggerFn:'triggerInteractableClimb',    radius:0, active:true, hexOffset:{q:1,r:1}   },
  { id:'stone_wall_section', name:'Stone Wall Section',     icon:'🧱', category:'destructible', elevation:0, flavor:'A section of crumbling ancient wall, weakened by prior battles.', effect:'Destroy with 4+ damage: opens a new movement path. Provides Cover (+2 Defend) to adjacent allies while intact.', triggerVerb:'Smash Wall',    triggerCost:1, triggerFn:'triggerInteractableDestroy',  radius:0, active:true, hexOffset:{q:-2,r:-1} },
  { id:'oil_slick',          name:'Oil Slick',              icon:'🫧', category:'hazard',       elevation:0, flavor:'Spilled alchemical oil coats the floor in a slippery sheen.', effect:'Moving through costs +1 AP and triggers Body save vs d6 (fail = prone, −1 AP next turn). Ignite to create 1-hex fire: d4/turn for 2 rounds.', triggerVerb:'Ignite Oil',    triggerCost:1, triggerFn:'triggerInteractableExplosion', radius:1, active:true, hexOffset:{q:0,r:-1}  },
  { id:'sewer_grate',        name:'Sewer Grate',            icon:'⬛', category:'destructible', elevation:0, flavor:'A heavy iron grate covers a passage into the sewers below.', effect:'Pry it open (1 AP + check vs d6): creates an underground bypass crossing 2 hexes of terrain.', triggerVerb:'Pry Open',      triggerCost:1, triggerFn:'triggerInteractableDestroy',  radius:0, active:true, hexOffset:{q:2,r:2}   },
  { id:'trapped_civilian',   name:'Trapped Civilian',       icon:'🧑', category:'npc',          elevation:0, flavor:'A terrified civilian is pinned under rubble in the middle of the fight.', effect:'Free them (1 AP): earn 1 Luck Token (reroll any one die this combat). Enemies near them deal +1 morale damage.', triggerVerb:'Free Civilian', triggerCost:1, triggerFn:'triggerInteractableNpcAssist',  radius:0, active:true, hexOffset:{q:-1,r:1}  },
  { id:'lever_mechanism',    name:'Lever Mechanism',        icon:'🔧', category:'destructible', elevation:0, flavor:'A rusted lever connected to something deeper in the structure.', effect:'Pull it (1 AP): randomly opens a door or drops a wall-trap on the nearest enemy in range.', triggerVerb:'Pull Lever',    triggerCost:1, triggerFn:'triggerInteractableDestroy',  radius:2, active:true, hexOffset:{q:-2,r:2}  },
  { id:'crumbling_ceiling',  name:'Crumbling Ceiling',      icon:'⛰', category:'hazard',       elevation:0, flavor:'Deep cracks run across the ceiling — it groans with every strike.', effect:'Start of each round: 1-in-6 chance it collapses (d6 damage in 1-hex radius, creates impassable Rubble).', triggerVerb:'Brace Ceiling', triggerCost:1, triggerFn:'triggerInteractableCollapse', radius:1, active:true, hexOffset:{q:1,r:-1}  }
];

function generateCombatInteractables(seed, mapSize, count) {
  var seedNum = Math.max(1, Number(seed || Date.now()));
  var targetCount = Math.max(2, Math.min(3, Number(count || 2)));
  var halfMap = Math.floor(Math.max(3, Number(mapSize || 7)) / 2);
  var pool = ENVIRONMENTAL_INTERACTABLE_TABLE.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.abs(Math.sin(seedNum + i) * 10000) % (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  var chosen = [];
  var usedCategories = {};
  for (var pi = 0; pi < pool.length && chosen.length < targetCount; pi++) {
    var entry = pool[pi];
    if (!entry) continue;
    if (chosen.length < targetCount - 1 && usedCategories[entry.category]) continue;
    usedCategories[entry.category] = true;
    var offset = entry.hexOffset || {q:0, r:0};
    var q = Math.max(-halfMap + 1, Math.min(halfMap - 1, Number(offset.q)));
    var r = Math.max(-halfMap + 1, Math.min(halfMap - 1, Number(offset.r)));
    chosen.push({
      id:          entry.id + '_' + String(seedNum % 9999),
      templateId:  entry.id,
      name:        entry.name,
      icon:        entry.icon,
      category:    entry.category,
      elevation:   Number(entry.elevation || 0),
      flavor:      entry.flavor,
      effect:      entry.effect,
      triggerVerb: entry.triggerVerb,
      triggerCost: Number(entry.triggerCost || 1),
      triggerFn:   entry.triggerFn,
      radius:      Number(entry.radius || 0),
      active:      true,
      triggered:   false,
      position:    { q: q, r: r }
    });
  }
  return chosen;
}

function installInteractablesOnMap(map, interactables) {
  if (!map || !map.hexes || !Array.isArray(interactables)) return;
  interactables.forEach(function(item) {
    if (!item || !item.position) return;
    var key = hexToKey(item.position);
    var cell = map.hexes[key];
    if (!cell || cell.obstacle) return;
    cell.interactable = item.id;
    cell.interactableRef = item;
    cell.elevation = item.elevation;
    if (item.elevation > 0) cell.terrain = 'elevated';
    else if (item.category === 'explosive') cell.terrain = 'explosive';
    else if (item.category === 'hazard') cell.terrain = 'hazard';
    else if (item.category === 'npc') cell.terrain = 'npc_present';
    else cell.terrain = 'destructible';
  });
}

// ── SHOVE ──────────────────────────────────────────────────────────────────
function executeShovePush(shover, target, map, allUnits, log) {
  if (!shover || !target || !map) { if (log) log.push('Shove failed: missing context.'); return false; }
  if (getUnitDistance(shover, target) > 1) { if (log) log.push(shover.name + ' cannot shove — must be Engaged.'); return false; }
  if (Number(shover.ap || 0) < 1) { if (log) log.push(shover.name + ' has no AP to shove.'); return false; }
  var dq = Number(target.position.q) - Number(shover.position.q);
  var dr = Number(target.position.r) - Number(shover.position.r);
  var landQ = Number(target.position.q) + dq;
  var landR = Number(target.position.r) + dr;
  var landKey = landQ + ',' + landR;
  var landCell = map.hexes[landKey];
  shover.ap = Math.max(0, Number(shover.ap) - 1);
  var shoverDie = 6, targetDie = 6;
  if (shover.character && typeof getEffectiveDie === 'function') shoverDie = getEffectiveDie('body') || 6;
  if (target.character && typeof getEffectiveDie === 'function') targetDie = getEffectiveDie('body') || 6;
  var shoveRoll = Math.floor(Math.random() * shoverDie) + 1;
  var resistRoll = Math.floor(Math.random() * targetDie) + 1;
  if (shoveRoll <= resistRoll) {
    if (log) log.push('💪 ' + shover.name + ' shove resisted by ' + target.name + ' [' + shoveRoll + ' vs ' + resistRoll + ']!');
    return false;
  }
  if (log) log.push('💪 ' + shover.name + ' shoved ' + target.name + ' [' + shoveRoll + ' vs ' + resistRoll + ']!');
  if (!landCell || landCell.obstacle) {
    target.hp = Math.max(0, Number(target.hp) - 2);
    if (log) log.push('🧱 ' + target.name + ' slammed into a wall! 2 impact damage (HP: ' + target.hp + ').');
    return true;
  }
  var fromCell = map.hexes[hexToKey(target.position)];
  var fromElevation = fromCell ? Number(fromCell.elevation || 0) : 0;
  var elevDrop = fromElevation - Number(landCell.elevation || 0);
  if (elevDrop > 0) {
    var fallDamage = elevDrop * 2;
    target.hp = Math.max(0, Number(target.hp) - fallDamage);
    if (log) log.push('⬇ ' + target.name + ' fell ' + elevDrop + ' tier(s)! ' + fallDamage + ' fall damage (HP: ' + target.hp + ').');
  }
  var blocked = Array.isArray(allUnits) && allUnits.some(function(u) {
    return u && u.id !== target.id && u.position && u.position.q === landQ && u.position.r === landR;
  });
  if (blocked) { target.hp = Math.max(0, Number(target.hp) - 1); if (log) log.push('💥 ' + target.name + ' collided with another unit! 1 collision damage.'); return true; }
  target.position = { q: landQ, r: landR };
  if (log) log.push('➡ ' + target.name + ' pushed to [' + landQ + ',' + landR + '].');
  if (landCell.interactableRef && landCell.interactableRef.active) {
    triggerInteractableOnStep(target, landCell.interactableRef, map, allUnits, log);
  }
  return true;
}

// ── EXPLOSIONS ─────────────────────────────────────────────────────────────
function resolveExplosionAt(centerHex, radius, damageDie, allUnits, map, log) {
  var die = Math.max(4, Number(damageDie || 6));
  var rad = Math.max(0, Number(radius || 1));
  var center = centerHex || { q: 0, r: 0 };
  var hit = 0;
  (Array.isArray(allUnits) ? allUnits : []).forEach(function(unit) {
    if (!unit || !unit.position || Number(unit.hp || 0) <= 0) return;
    if (hexDistance(center, unit.position) > rad) return;
    var rawDmg = Math.floor(Math.random() * die) + 1;
    var saveRoll = Math.floor(Math.random() * 6) + 1;
    var expRoll  = Math.floor(Math.random() * die) + 1;
    var finalDmg = saveRoll >= expRoll ? Math.ceil(rawDmg / 2) : rawDmg;
    unit.hp = Math.max(0, Number(unit.hp) - finalDmg);
    hit++;
    if (log) log.push('💥 Explosion hit ' + unit.name + ': d' + die + '=' + rawDmg + (saveRoll >= expRoll ? ' (half-saved)' : '') + ' → ' + finalDmg + ' dmg (HP: ' + unit.hp + ').');
  });
  if (map && map.hexes) {
    getHexesWithinDistance(center, rad).forEach(function(h) {
      var cell = map.hexes[hexToKey(h)];
      if (!cell) return;
      if (cell.interactableRef) { cell.interactableRef.active = false; cell.interactableRef.triggered = true; }
      if (cell.terrain === 'explosive' || cell.terrain === 'hazard') cell.terrain = 'rubble';
    });
  }
  if (log && hit === 0) log.push('💥 Explosion at [' + center.q + ',' + center.r + '] — no units in blast radius.');
  return hit;
}

// ── AUTO-STEP TRIGGER ──────────────────────────────────────────────────────
function triggerInteractableOnStep(unit, item, map, allUnits, log) {
  if (!item || !item.active) return;
  if ((item.templateId === 'explosive_rune' || item.templateId === 'gas_vent') && item.category === 'explosive') {
    item.active = false; item.triggered = true;
    if (log) log.push('⚡ ' + unit.name + ' stepped on ' + item.name + '!');
    resolveExplosionAt(item.position, item.radius, 6, allUnits, map, log);
  } else if (item.templateId === 'oil_slick') {
    var bodyDie = 6;
    if (unit.character && typeof getEffectiveDie === 'function') bodyDie = getEffectiveDie('body') || 6;
    var roll = Math.floor(Math.random() * bodyDie) + 1;
    var dc   = Math.floor(Math.random() * 6) + 1;
    if (roll < dc) {
      unit.conditions = unit.conditions || {};
      unit.conditions.prone = 1;
      if (log) log.push('🫧 ' + unit.name + ' slipped on oil! Prone: −1 AP next turn [' + roll + ' vs ' + dc + '].');
    } else {
      if (log) log.push('🫧 ' + unit.name + ' kept footing on oil slick [' + roll + ' vs ' + dc + '].');
    }
  }
}

// ── NAMED TRIGGER FUNCTIONS ────────────────────────────────────────────────
function triggerInteractableExplosion(item, triggeringUnit, allUnits, map, log) {
  if (!item || !item.active) { if (log) log.push((item && item.name || 'Item') + ' is no longer active.'); return false; }
  if (triggeringUnit && Number(triggeringUnit.ap || 0) < Number(item.triggerCost || 1)) { if (log) log.push('Not enough AP (' + item.triggerCost + ' needed).'); return false; }
  if (triggeringUnit) triggeringUnit.ap = Math.max(0, Number(triggeringUnit.ap) - Number(item.triggerCost || 1));
  item.active = false; item.triggered = true;
  if (log) log.push('💥 ' + (triggeringUnit ? triggeringUnit.name + ' triggered ' : 'Auto: ') + item.name + '!');
  resolveExplosionAt(item.position, item.radius, 6, allUnits, map, log);
  return true;
}

function triggerInteractableCollapse(item, triggeringUnit, allUnits, map, log) {
  if (!item || !item.active) { if (log) log.push((item && item.name || 'Item') + ' is no longer active.'); return false; }
  if (triggeringUnit && Number(triggeringUnit.ap || 0) < Number(item.triggerCost || 1)) { if (log) log.push('Not enough AP (' + item.triggerCost + ' needed).'); return false; }
  if (triggeringUnit) triggeringUnit.ap = Math.max(0, Number(triggeringUnit.ap) - Number(item.triggerCost || 1));
  item.active = false; item.triggered = true;
  if (log) log.push('🪨 ' + (triggeringUnit ? triggeringUnit.name + ' collapsed ' : 'Collapse: ') + item.name + '!');
  var elevBonus = (item.elevation || 0) * 2;
  (Array.isArray(allUnits) ? allUnits : []).forEach(function(unit) {
    if (!unit || !unit.position || Number(unit.hp || 0) <= 0) return;
    if (hexDistance(item.position, unit.position) > item.radius) return;
    var raw = Math.floor(Math.random() * 6) + 1;
    var total = raw + elevBonus;
    unit.hp = Math.max(0, Number(unit.hp) - total);
    if (log) log.push('⬇ ' + unit.name + ' caught in collapse! d6=' + raw + (elevBonus ? '+' + elevBonus + ' fall' : '') + ' = ' + total + ' dmg (HP: ' + unit.hp + ').');
  });
  if (map && map.hexes) {
    getHexesWithinDistance(item.position, item.radius).forEach(function(h) {
      var cell = map.hexes[hexToKey(h)];
      if (cell) { cell.elevation = 0; cell.terrain = 'rubble'; cell.obstacle = true; }
    });
  }
  return true;
}

function triggerInteractableNpcAssist(item, triggeringUnit, allUnits, map, log) {
  if (!item || !item.active) { if (log) log.push((item && item.name || 'Item') + ' already resolved.'); return false; }
  if (triggeringUnit && Number(triggeringUnit.ap || 0) < Number(item.triggerCost || 1)) { if (log) log.push('Not enough AP (' + item.triggerCost + ' needed).'); return false; }
  if (triggeringUnit) triggeringUnit.ap = Math.max(0, Number(triggeringUnit.ap) - Number(item.triggerCost || 1));
  item.active = false; item.triggered = true;
  if (item.templateId === 'rooftop_archer') {
    var enemies = (Array.isArray(allUnits) ? allUnits : []).filter(function(u) { return u && u.side === 'enemy' && Number(u.hp || 0) > 0; });
    if (enemies.length) {
      var tgt = enemies[Math.floor(Math.random() * enemies.length)];
      var shot = Math.floor(Math.random() * 8) + 1, def = Math.floor(Math.random() * 6) + 1;
      var dmg = Math.max(0, shot - def);
      if (dmg > 0) tgt.hp = Math.max(0, Number(tgt.hp) - dmg);
      if (log) log.push('🏹 Rooftop archer shot ' + tgt.name + ' [d8=' + shot + ' vs d6=' + def + '] → ' + (dmg > 0 ? dmg + ' dmg' : 'deflected') + ' (HP: ' + tgt.hp + ').');
    } else { if (log) log.push('🏹 Rooftop archer signalled — no valid targets.'); }
  } else if (item.templateId === 'trapped_civilian') {
    if (triggeringUnit) {
      triggeringUnit.luckTokens = Math.min(3, Number(triggeringUnit.luckTokens || 0) + 1);
      if (log) log.push('🧑 ' + triggeringUnit.name + ' freed the civilian! Gained 1 Luck Token. Tokens: ' + triggeringUnit.luckTokens + '.');
    }
  } else { if (log) log.push('✦ ' + (triggeringUnit ? triggeringUnit.name : 'Ally') + ' resolved ' + item.name + '.'); }
  return true;
}

function triggerInteractableDestroy(item, triggeringUnit, allUnits, map, log) {
  if (!item || !item.active) { if (log) log.push((item && item.name || 'Item') + ' already resolved.'); return false; }
  if (triggeringUnit && Number(triggeringUnit.ap || 0) < Number(item.triggerCost || 1)) { if (log) log.push('Not enough AP (' + item.triggerCost + ' needed).'); return false; }
  if (triggeringUnit) triggeringUnit.ap = Math.max(0, Number(triggeringUnit.ap) - Number(item.triggerCost || 1));
  item.active = false; item.triggered = true;
  if (map && map.hexes) {
    var cell = map.hexes[hexToKey(item.position)];
    if (cell) { cell.obstacle = false; cell.terrain = 'open'; cell.interactable = null; cell.interactableRef = null; }
    if (item.templateId === 'lever_mechanism') {
      var nearest = null, nearDist = 999;
      (Array.isArray(allUnits) ? allUnits : []).forEach(function(u) {
        if (!u || u.side !== 'enemy' || !u.position || Number(u.hp || 0) <= 0) return;
        var d = hexDistance(item.position, u.position);
        if (d <= item.radius && d < nearDist) { nearest = u; nearDist = d; }
      });
      if (nearest) {
        var trapDmg = Math.floor(Math.random() * 6) + 1;
        nearest.hp = Math.max(0, Number(nearest.hp) - trapDmg);
        if (log) log.push('🔧 Lever triggered! Wall-trap hit ' + nearest.name + ' for ' + trapDmg + ' dmg (HP: ' + nearest.hp + ').');
      } else { if (log) log.push('🔧 Lever pulled — a hidden passage opens nearby.'); }
    } else { if (log) log.push('🔨 ' + (triggeringUnit ? triggeringUnit.name : 'A unit') + ' destroyed ' + item.name + ' — path opened.'); }
  }
  return true;
}

function triggerInteractableClimb(item, triggeringUnit, allUnits, map, log) {
  if (!item || !item.active) return false;
  if (triggeringUnit && Number(triggeringUnit.ap || 0) < Number(item.triggerCost || 1)) { if (log) log.push('Not enough AP (' + item.triggerCost + ' needed).'); return false; }
  if (triggeringUnit) {
    triggeringUnit.ap = Math.max(0, Number(triggeringUnit.ap) - Number(item.triggerCost || 1));
    triggeringUnit.position = { q: item.position.q, r: item.position.r };
    triggeringUnit.elevationBonus = Number(item.elevation || 1);
    if (log) log.push('🗿 ' + triggeringUnit.name + ' climbed ' + item.name + '! Elevation ' + item.elevation + ': +' + item.elevation + ' Shoot bonus.');
  }
  return true;
}

function dispatchInteractableTrigger(item, triggeringUnit, allUnits, map, log) {
  if (!item) return false;
  var fn = String(item.triggerFn || '');
  if (fn === 'triggerInteractableExplosion')  return triggerInteractableExplosion(item, triggeringUnit, allUnits, map, log);
  if (fn === 'triggerInteractableCollapse')   return triggerInteractableCollapse(item, triggeringUnit, allUnits, map, log);
  if (fn === 'triggerInteractableNpcAssist')  return triggerInteractableNpcAssist(item, triggeringUnit, allUnits, map, log);
  if (fn === 'triggerInteractableDestroy')    return triggerInteractableDestroy(item, triggeringUnit, allUnits, map, log);
  if (fn === 'triggerInteractableClimb')      return triggerInteractableClimb(item, triggeringUnit, allUnits, map, log);
  if (fn === 'triggerInteractableShoveInto') {
    var nearest = null, nearDist = 999;
    var oppSide = triggeringUnit ? (triggeringUnit.side === 'ally' ? 'enemy' : 'ally') : 'enemy';
    (Array.isArray(allUnits) ? allUnits : []).forEach(function(u) {
      if (!u || !u.position || u.side !== oppSide || Number(u.hp || 0) <= 0) return;
      var d = hexDistance(item.position, u.position);
      if (d < nearDist) { nearest = u; nearDist = d; }
    });
    if (nearest && triggeringUnit) return executeShovePush(triggeringUnit, nearest, map, allUnits, log);
    if (log) log.push('No valid shove target near ' + item.name + '.');
    return false;
  }
  if (log) log.push('Unknown trigger: ' + fn);
  return false;
}

// ── ROUND START AUTO-CHECKS ────────────────────────────────────────────────
function processInteractableRoundStart(interactables, allUnits, map, log) {
  if (!Array.isArray(interactables)) return;
  interactables.forEach(function(item) {
    if (!item || !item.active || item.templateId !== 'crumbling_ceiling') return;
    var roll = Math.floor(Math.random() * 6) + 1;
    if (roll === 1) { if (log) log.push('🪨 Crumbling ceiling collapses! (rolled 1/6)'); triggerInteractableCollapse(item, null, allUnits, map, log); }
    else if (log) log.push('🪨 Crumbling ceiling groans... (' + roll + '/6, safe this round)');
  });
}

// ── INTERACTABLE PANEL HTML ────────────────────────────────────────────────
function buildInteractablePanelHtml(interactables, selectedUnit) {
  if (!Array.isArray(interactables) || !interactables.length) return '';
  var activeItems = interactables.filter(function(i) { return i && i.active; });
  if (!activeItems.length) return '<div style="font-size:.7rem;color:var(--muted2);margin-top:.22rem;">All battlefield interactables have been resolved.</div>';
  var unitAp = selectedUnit ? Number(selectedUnit.ap || 0) : 0;
  var catColor = function(cat) {
    return cat === 'explosive' ? 'var(--red2)' : cat === 'verticality' ? 'var(--teal)' : cat === 'npc' ? 'var(--gold2)' : cat === 'destructible' ? '#c8a0ff' : 'var(--muted2)';
  };
  var cards = activeItems.map(function(item) {
    var cc = catColor(item.category);
    var elevLabel = item.elevation > 0 ? (' · Elevation ' + item.elevation) : '';
    var canAfford = unitAp >= item.triggerCost;
    var unitIdArg = selectedUnit ? '"' + String(selectedUnit.id || '').replace(/"/g, '') + '"' : 'null';
    return '<div style="border:1px solid var(--border2);border-left:2px solid ' + cc + ';padding:.32rem .4rem;margin-bottom:.2rem;background:rgba(255,255,255,.025);">'
      + '<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.12rem;">'
        + '<span style="font-size:.95rem;">' + item.icon + '</span>'
        + '<div><div style="font-size:.74rem;color:var(--text);font-weight:600;">' + item.name + '</div>'
        + '<div style="font-size:.61rem;color:' + cc + ';text-transform:uppercase;letter-spacing:.06em;">' + item.category + elevLabel + '</div></div>'
      + '</div>'
      + '<div style="font-size:.71rem;color:var(--muted2);line-height:1.44;margin-bottom:.1rem;font-style:italic;">' + item.flavor + '</div>'
      + '<div style="font-size:.69rem;color:var(--text2);line-height:1.44;margin-bottom:.14rem;"><strong style="color:var(--gold2);">Effect:</strong> ' + item.effect + '</div>'
      + '<div style="display:flex;gap:.16rem;flex-wrap:wrap;align-items:center;">'
        + '<button class="btn btn-xs btn-primary"' + (canAfford ? '' : ' disabled style="opacity:.45;" title="Need ' + item.triggerCost + ' AP"') + ' onclick="crucibleTriggerInteractable(\'' + item.id + '\',' + unitIdArg + ')">'
          + item.triggerVerb + ' (' + item.triggerCost + ' AP)'
        + '</button>'
        + '<span style="font-size:.61rem;color:var(--muted2);">Hex [' + item.position.q + ',' + item.position.r + ']' + (item.radius > 0 ? ' · Radius ' + item.radius : '') + '</span>'
      + '</div>'
    + '</div>';
  }).join('');
  return '<div style="margin-top:.3rem;">'
    + '<div style="font-family:\'Cinzel\',serif;font-size:.65rem;letter-spacing:.09em;color:var(--gold2);text-transform:uppercase;margin-bottom:.18rem;">⚔ Battlefield Interactables (' + activeItems.length + ' active)</div>'
    + cards
  + '</div>';
}

function injectInteractablesIntoSvg(hexSvg, interactables, toPixelFn, hexSize) {
  if (!Array.isArray(interactables) || !interactables.length) return hexSvg;
  var size = Number(hexSize || 28);
  var pixelFn = (typeof toPixelFn === 'function')
    ? toPixelFn
    : function(q, r) {
        var x = size * (3 / 2 * Number(q || 0));
        var y = size * (Math.sqrt(3) / 2 * Number(q || 0) + Math.sqrt(3) * Number(r || 0));
        return { x: 320 + x, y: 305 + y };
      };
  var inserts = interactables.filter(function(i) { return i && i.active && i.position; }).map(function(item) {
    var p = pixelFn(item.position.q, item.position.r);
    var elevRing = item.elevation > 0
      ? '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="' + ((size || 22) * 0.62).toFixed(2) + '" fill="none" stroke="rgba(255,220,80,.55)" stroke-width="1.5" stroke-dasharray="4 3"/>'
      : '';
    return elevRing + '<text x="' + p.x.toFixed(2) + '" y="' + (p.y + 5).toFixed(2) + '" text-anchor="middle" font-size="14" opacity=".9">' + item.icon + '</text>';
  }).join('');
  return hexSvg.replace('</svg>', inserts + '</svg>');
}

// ── EXPORTS ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.generateCombatInteractables       = generateCombatInteractables;
  window.installInteractablesOnMap         = installInteractablesOnMap;
  window.buildInteractablePanelHtml        = buildInteractablePanelHtml;
  window.injectInteractablesIntoSvg        = injectInteractablesIntoSvg;
  window.dispatchInteractableTrigger       = dispatchInteractableTrigger;
  window.executeShovePush                  = executeShovePush;
  window.resolveExplosionAt                = resolveExplosionAt;
  window.processInteractableRoundStart     = processInteractableRoundStart;
  window.triggerInteractableOnStep         = triggerInteractableOnStep;
  window.ENVIRONMENTAL_INTERACTABLE_TABLE  = ENVIRONMENTAL_INTERACTABLE_TABLE;

  window.crucibleTriggerInteractable = function(itemId, selectedUnitId) {
    if (typeof S === 'undefined' || !S) return;
    var match = (S.holding && S.holding.crucible)
      ? (S.holding.crucible.currentMatch || S.holding.crucible.match || null)
      : null;
    if (!match) { if (typeof showNotif === 'function') showNotif('No active combat match.', 'warn'); return; }
    var interactables = match.interactables;
    if (!Array.isArray(interactables)) { if (typeof showNotif === 'function') showNotif('No interactables in this fight.', 'info'); return; }
    var item = null;
    for (var ii = 0; ii < interactables.length; ii++) {
      if (String(interactables[ii] && interactables[ii].id || '') === String(itemId || '')) { item = interactables[ii]; break; }
    }
    if (!item) { if (typeof showNotif === 'function') showNotif('Interactable not found.', 'warn'); return; }
    if (!item.active) { if (typeof showNotif === 'function') showNotif(item.name + ' has already been triggered.', 'info'); return; }
    var allUnits = [].concat(match.allies || [], match.enemies || []);
    var triggeringUnit = null;
    if (selectedUnitId) {
      for (var jj = 0; jj < allUnits.length; jj++) {
        if (String(allUnits[jj] && allUnits[jj].id || '') === String(selectedUnitId || '')) { triggeringUnit = allUnits[jj]; break; }
      }
    }
    var log = match.log = match.log || [];
    var ok = dispatchInteractableTrigger(item, triggeringUnit, allUnits, match.hexMap, log);
    if (ok && typeof showNotif === 'function') showNotif(item.name + ' triggered!', 'good');
    if (typeof window.renderHoldingCruciblePopup === 'function') window.renderHoldingCruciblePopup();
    if (typeof window.renderHoldingUI === 'function') window.renderHoldingUI();
  };
}
