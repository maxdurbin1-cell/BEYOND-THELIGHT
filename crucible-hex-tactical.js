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

// ============================================================================
// HEX MAP GENERATION
// ============================================================================

function generateCrucibleHexMap(seed, size) {
  var mapSize = Math.max(7, Math.min(11, Number(size || 9)));
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
  return dist > 0 && dist <= 1; // Engaged or Close range
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

  var oldDist = getUnitDistance(unit, { position: hex });
  if (oldDist !== 1) {
    if (log) log.push(unit.name + ' is too far away.');
    return false;
  }

  var cost = 1; // 1 AP per hex
  if (Number(unit.ap || 0) < cost) {
    if (log) log.push(unit.name + ' has no AP remaining.');
    return false;
  }

  unit.ap = Math.max(0, Number(unit.ap) - cost);
  unit.position = { q: hex.q, r: hex.r };

  if (log) log.push(unit.name + ' moved to [' + hex.q + ',' + hex.r + '].');

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
    if (cell.loot.type === 'weapon') {
      unit.equipment.weapon = { affinity: cell.loot.bonus, roll: 'D' + (8 + cell.loot.bonus * 2) };
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
  
  unit.defendBuff = Math.max(0, Number(unit.defendBuff || 0) + 3);
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

  // Only Engaged and Close allowed for attack
  if (dist > 2) {
    if (log) log.push(attacker.name + ' cannot reach ' + defender.name + ' (' + range + ').');
    return false;
  }

  var attackRoll = Math.floor(Math.random() * attacker.attackDie) + 1;
  var defendRoll = Math.floor(Math.random() * defender.defendDie) + 1 + Number(defender.defendBuff || 0);
  
  // Add equipment bonuses
  if (attacker.equipment && attacker.equipment.weapon) {
    attackRoll += attacker.equipment.weapon.affinity || 0;
  }
  if (defender.equipment && defender.equipment.armor) {
    defendRoll += defender.equipment.armor.defense || 0;
  }

  var damage = Math.max(0, attackRoll - defendRoll);
  
  if (damage > 0) {
    defender.hp = Math.max(0, Number(defender.hp) - damage);
    if (log) log.push('💥 ' + attacker.name + ' attacked ' + defender.name + ' [' + attackRoll + ' vs ' + defendRoll + '] = ' + damage + ' damage.');
  } else {
    if (log) log.push(attacker.name + ' attacked but ' + defender.name + ' defended.');
  }

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

function executePersonalFlavor(unit, cooldownStamp, map, log) {
  if (!unit || !unit.personalFlavor) return false;
  
  if (!canUsePersonalFlavor(unit, cooldownStamp)) {
    if (log) log.push(unit.name + ' ' + (unit.personalFlavor.name || 'flavor') + ' is on cooldown.');
    return false;
  }

  unit.personalFlavor.used = true;
  unit.personalFlavor.cooldownStamp = cooldownStamp;
  
  // Let combat system handle flavor effects
  if (log) log.push('✨ ' + unit.name + ' used Personal Flavor: ' + (unit.personalFlavor.name || 'Unknown') + '.');
  
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

function renderCrucibleHexMap(map, units, selectedUnitId) {
  if (!map || !map.hexes) return '<div>No map data.</div>';

  var maxRadius = 5;
  var hexSize = 32;
  var hexHTML = '<svg width="600" height="600" viewBox="0 0 600 600" style="border:1px solid var(--border2);background:rgba(0,0,0,.3);border-radius:4px;margin-bottom:.25rem;">';
  
  function pixelCoord(hex, size, originX, originY) {
    var x = size * (3/2 * hex.q);
    var y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return {
      x: originX + x,
      y: originY + y
    };
  }

  var originX = 300;
  var originY = 300;

  // Draw hexagon backgrounds
  Object.keys(map.hexes).forEach(function(key) {
    var cell = map.hexes[key];
    if (!cell) return;

    var pix = pixelCoord(cell, hexSize, originX, originY);
    var color = 'var(--surface)';
    var opacity = 0.5;

    if (cell.obstacle) {
      color = 'var(--red2)';
      opacity = 0.7;
    } else if (cell.trap) {
      color = 'var(--orange)';
      opacity = 0.6;
    } else if (cell.loot) {
      color = 'var(--gold2)';
      opacity = 0.6;
    } else if (cell.zone) {
      color = 'var(--teal)';
      opacity = 0.5;
    } else if (cell.terrain === 'spawn') {
      color = 'var(--green2)';
      opacity = 0.4;
    }

    // Simple hex outline
    hexHTML += '<circle cx="' + pix.x + '" cy="' + pix.y + '" r="' + (hexSize * 0.6) + '" fill="' + color + '" opacity="' + opacity + '" stroke="var(--border)" stroke-width="1"/>';
    
    // Terrain icon
    if (cell.obstacle) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="14" fill="var(--text)">■</text>';
    } else if (cell.trap) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="14" fill="var(--text)">⚠</text>';
    } else if (cell.loot) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="var(--text)">' + (cell.loot.type === 'weapon' ? '⚔' : (cell.loot.type === 'armor' ? '🛡' : '❤')) + '</text>';
    } else if (cell.zone) {
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="12" fill="var(--text)" font-weight="bold">' + cell.zone.id.charAt(5) + '</text>';
    }
  });

  // Draw units
  if (units && units.length) {
    units.forEach(function(unit) {
      if (!unit || !unit.position) return;

      var pix = pixelCoord(unit.position, hexSize, originX, originY);
      var unitColor = unit.side === 'ally' ? 'var(--green2)' : 'var(--red2)';
      var isSelected = String(unit.id) === String(selectedUnitId);
      var stroke = isSelected ? 2 : 1;

      hexHTML += '<circle cx="' + pix.x + '" cy="' + pix.y + '" r="' + (hexSize * 0.4) + '" fill="' + unitColor + '" stroke="' + (isSelected ? 'var(--gold2)' : 'var(--text)') + '" stroke-width="' + stroke + '"/>';
      hexHTML += '<text x="' + pix.x + '" y="' + pix.y + '" text-anchor="middle" dy=".3em" font-size="10" fill="var(--surface)" font-weight="bold">' + (unit.name.charAt(0) || 'U') + '</text>';
    });
  }

  hexHTML += '</svg>';
  
  return hexHTML;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function getHexMovementButtonsHtml(unit, match) {
  if (!unit || !unit.position || !match || !match.hexMap || Number(unit.ap || 0) === 0) {
    return '<div style="font-size:.7rem;color:var(--muted2);">No AP remaining.</div>';
  }

  var reachable = [];
  
  // Generate adjacent hexes (1 hex away = 1 AP cost)
  var adjacentOffsets = [
    { q: 1, r: 0 }, { q: -1, r: 0 },
    { q: 0, r: 1 }, { q: 0, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 }
  ];

  adjacentOffsets.forEach(function(offset) {
    var hexKey = (unit.position.q + offset.q) + ',' + (unit.position.r + offset.r);
    var cell = match.hexMap.hexes[hexKey];
    
    if (cell && !cell.obstacle && !cell.door) {
      // Check if hex is occupied
      var occupied = false;
      (match.allies || []).concat(match.enemies || []).forEach(function(u) {
        if (u && u.position && u.position.q === (unit.position.q + offset.q) && 
            u.position.r === (unit.position.r + offset.r) && u.id !== unit.id) {
          occupied = true;
        }
      });
      
      if (!occupied) {
        reachable.push({
          q: unit.position.q + offset.q,
          r: unit.position.r + offset.r,
          cell: cell
        });
      }
    }
  });

  if (reachable.length === 0) {
    return '<div style="font-size:.7rem;color:var(--muted2);">No adjacent movement options.</div>';
  }

  var buttons = reachable.map(function(hex) {
    var label = '[' + hex.q + ',' + hex.r + ']';
    var terrain = hex.cell.terrain || 'open';
    var icon = terrain === 'trap' ? '⚠' : (terrain === 'loot' ? '⚔' : (terrain === 'cover' ? '🛡' : '⬡'));
    
    return '<button class="btn btn-xs" onclick="holdingCrucibleMoveSelected(' + hex.q + ',' + hex.r + ');" style="font-size:.7rem;">' 
      + icon + ' ' + label 
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
