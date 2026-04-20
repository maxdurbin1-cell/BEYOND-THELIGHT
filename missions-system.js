// missions-system.js

/**
 * Mission System for BEYOND-THELIGHT
 * This file contains the complete mission system structured into a three-step framework,
 * including challenge tiers, loot tables, mission progression logic, and auto-loot population.
 */

// Step 1: Define Challenge Tiers
const challengeTiers = {
    easy: {
        difficulty: 1,
        lootTable: 'easyLoot',
        rewards: { experience: 100, loot: 10 }
    },
    medium: {
        difficulty: 2,
        lootTable: 'mediumLoot',
        rewards: { experience: 200, loot: 20 }
    },
    hard: {
        difficulty: 3,
        lootTable: 'hardLoot',
        rewards: { experience: 300, loot: 30 }
    }
};

// Step 2: Define Loot Tables
const lootTables = {
    easyLoot: ['smallPotion', 'woodenSword', 'basicShield'],
    mediumLoot: ['healingHerb', 'ironSword', 'sturdyShield'],
    hardLoot: ['magicPotion', 'goldenSword', 'enchantedShield']
};

// Step 3: Mission Progression Logic
class Mission {
    constructor(name, tier) {
        this.name = name;
        this.tier = challengeTiers[tier];
        this.isCompleted = false;
    }

    completeMission() {
        if (!this.isCompleted) {
            this.isCompleted = true;
            this.populateLoot();
            console.log(`Mission ${this.name} completed!`);
        }
    }

    populateLoot() {
        const loot = this.getLoot();
        console.log(`Loot produced: ${loot.join(', ')}`);
    }

    getLoot() {
        const loot = this.tier.lootTable;
        return lootTables[loot];
    }
}

// Example of creating a mission and completing it
const mission1 = new Mission('Rescue the Villager', 'easy');
mission1.completeMission();

// Exporting the Mission class for external use
module.exports = Mission;