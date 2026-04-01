// js/config/UpgradesConfig.js

// ==========================================
// 1. LOCAL CONSTANTS (Safe internal scope)
// ==========================================

import { WeaponConfig } from './WeaponConfig.js';

const COMPUTE = {
    damage: (base, flatBonus, multiplier) => {
        return Math.max(1, Math.round((base + flatBonus) * multiplier));
    },
    cooldown: (base, haste) => {
        return Math.max(50, Math.round(base / Math.max(0.1, 1 + haste)));
    },
    hpScale: (base, wave) => {
        return Math.floor(base * (1 + (Math.max(1, wave) / 20)));
    }
};

const LOGIC = {
    'HULL_REPAIR': (player, value, currentWave = 1) => {
        const scaledHp = COMPUTE.hpScale(value, currentWave);
        player.stats.maxHp = (player.stats.maxHp || 100) + scaledHp;
        player.stats.hp += scaledHp;
    },
    'PRIMARY_DAMAGE': (player, value) => {
        player.stats.flatPrimaryDamage = (player.stats.flatPrimaryDamage || 0) + value;
        const mult = player.stats.damageMultiplier || 1.0;
        player.primaryWeapon.stats.damage = COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage, mult);
    },
    'PRIMARY_FIRE_RATE': (player, value) => {
        player.stats.flatHaste = (player.stats.flatHaste || 0) + value;
        const mult = player.stats.hasteMultiplier || 0;
        player.primaryWeapon.stats.cooldown = COMPUTE.cooldown(WeaponConfig.BASE.PRIMARY.cooldown, player.stats.flatHaste + mult);
    },
    'PRIMARY_BULLET_SPEED': (player, value) => {
        player.primaryWeapon.stats.projectileSpeed += value;
    },
    'SECONDARY_DAMAGE': (player, value) => {
        player.stats.flatSecondaryDamage = (player.stats.flatSecondaryDamage || 0) + value;
        const baseDamage = WeaponConfig.BASE.SECONDARY ? WeaponConfig.BASE.SECONDARY.damage : 10;
        player.secondaryWeapon.stats.damage = COMPUTE.damage(baseDamage, player.stats.flatSecondaryDamage, 1.0);
    },
    'SECONDARY_COUNT': (player, value) => {
        const baseCount = WeaponConfig.BASE.SECONDARY ? WeaponConfig.BASE.SECONDARY.count : 1;
        player.secondaryWeapon.stats.count = (player.secondaryWeapon.stats.count || baseCount) + value;
    },
    'SECONDARY_COOLDOWN': (player, value) => {
        player.stats.flatSecondaryHaste = (player.stats.flatSecondaryHaste || 0) + value;
        const baseCd = WeaponConfig.BASE.SECONDARY ? WeaponConfig.BASE.SECONDARY.cooldown : 1500;
        player.secondaryWeapon.stats.cooldown = COMPUTE.cooldown(baseCd, player.stats.flatSecondaryHaste);
    },
    'DRONE_COUNT': (player, value) => {
        const safeValue = (value === undefined || isNaN(value)) ? 0 : value;
        player.stats.droneCount = (player.stats.droneCount || 0) + safeValue;
    }
};

// ==========================================
// 2. EXPORTED CONFIGURATION
// ==========================================

export const UpgradesConfig = {
    COMPUTE, 
    LOGIC,

    PORTALS: {
        PRIMARY_DAMAGE: [1, 2, 3],              
        PRIMARY_FIRE_RATE: [0.05, 0.10, 0.15],
        PRIMARY_BULLET_SPEED: [1, 2, 3],        
        SECONDARY_DAMAGE: [1, 2, 3],            
        SECONDARY_COUNT: [1, 2, 3],             
        SECONDARY_COOLDOWN: [0.05, 0.10, 0.15], 
        HULL_REPAIR: [10, 20, 30],
        DRONE_COUNT: [1, 1, 1] 
    },

    ARCHETYPES: {
        'CLASS_GUNNER': {
            id: 'CLASS_GUNNER',
            playerVariantIndex: 2,
            hasteBonus: 1.0,
            damagePenalty: -0.4,
            onApply: (player) => {
                player.stats.hasteMultiplier = (player.stats.hasteMultiplier || 0) + 1.0;
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) - 0.4;
                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.cooldown = COMPUTE.cooldown(WeaponConfig.BASE.PRIMARY.cooldown, (player.stats.flatHaste || 0) + player.stats.hasteMultiplier);
                    player.primaryWeapon.stats.damage = COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                }
            }
        },
        'CLASS_CANNON': {
            id: 'CLASS_CANNON',
            playerVariantIndex: 3,
            damageBonus: 1.0,
            hastePenalty: -0.5,
            onApply: (player) => {
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) + 1.0;
                player.stats.hasteMultiplier = (player.stats.hasteMultiplier || 0) - 0.5;
                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.damage = COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                    player.primaryWeapon.stats.cooldown = COMPUTE.cooldown(WeaponConfig.BASE.PRIMARY.cooldown, (player.stats.flatHaste || 0) + player.stats.hasteMultiplier);
                }
            }
        },
        'CLASS_SPREAD': {
            id: 'CLASS_SPREAD',
            playerVariantIndex: 4,
            projectileBonus: 2,
            damagePenalty: -0.3,
            onApply: (player) => {
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) - 0.3;
                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.count = (player.primaryWeapon.stats.count || 1) + 2;
                    player.primaryWeapon.stats.damage = COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                }
            }
        }
    },

    ENHANCEMENTS: {
        'OVERCHARGE_PRIMARY': {
            id: 'OVERCHARGE_PRIMARY',
            weight: 100,
            hasTiers: true,
            damageBonus: [4, 7, 10], 
            onApply: function (player, tierIndex = 0) {
                LOGIC.PRIMARY_DAMAGE(player, this.damageBonus[tierIndex]);
            }
        },
        'OVERCHARGE_HASTE': {
            id: 'OVERCHARGE_HASTE',
            weight: 100,
            hasTiers: true,
            hasteBonus: [0.16, 0.31, 0.46], 
            onApply: function (player, tierIndex = 0) {
                LOGIC.PRIMARY_FIRE_RATE(player, this.hasteBonus[tierIndex]);
            }
        },
        'HEAVY_ARMOR': {
            id: 'HEAVY_ARMOR',
            weight: 100,
            hasTiers: true,
            baseHpBonus: [31, 61, 91], 
            onApply: function (player, tierIndex = 0, currentWave = 1) {
                LOGIC.HULL_REPAIR(player, this.baseHpBonus[tierIndex], currentWave);
            }
        },
        'ASSAULT_DRONE': {
            id: 'ASSAULT_DRONE',
            weight: 100, 
            hasTiers: false,
            droneCountBonus: 1,
            onApply: function (player) {
                LOGIC.DRONE_COUNT(player, this.droneCountBonus);
            }
        }
    },

    RANDOM: {
        getWeightedTierIndex: () => {
            const rand = Math.random();
            if (rand < 0.60) return 0;  
            if (rand < 0.90) return 1;  
            return 2;                   
        },

        getWeightedSuperUpgrades: (pool, count = 3, excludeIds = []) => {
            const selected = [];
            const availableKeys = Object.keys(pool).filter(key => !excludeIds.includes(key));

            for (let i = 0; i < count; i++) {
                if (availableKeys.length === 0) break;

                const totalWeight = availableKeys.reduce((sum, key) => sum + (pool[key].weight || 100), 0);
                let threshold = Math.random() * totalWeight;

                for (let j = 0; j < availableKeys.length; j++) {
                    const key = availableKeys[j];
                    const weight = pool[key].weight || 100;

                    threshold -= weight;

                    if (threshold <= 0) {
                        const upgradeConfig = pool[key];
                        const rolledTier = upgradeConfig.hasTiers ? UpgradesConfig.RANDOM.getWeightedTierIndex() : 0;

                        selected.push({
                            config: upgradeConfig,
                            tierIndex: rolledTier
                        });

                        availableKeys.splice(j, 1);
                        break;
                    }
                }
            }
            return selected;
        }
    }
};