// js/config/UpgradesConfig.js

import { WeaponConfig } from './WeaponConfig.js';

export const UpgradesConfig = {
    // ==========================================
    // DRY COMPUTATION HELPERS
    // ==========================================
    COMPUTE: {
        damage: (base, flatBonus, multiplier) => Math.max(1, (base + flatBonus) * multiplier),
        cooldown: (base, haste) => Math.max(50, base / Math.max(0.1, 1 + haste)),
        hpScale: (base, wave) => Math.floor(base * (1 + (Math.max(1, wave) / 20)))
    },

    // ==========================================
    // NORMAL UPGRADES (Portals)
    // ==========================================
    PORTALS: {
        PRIMARY_DAMAGE: [1, 2, 3],
        PRIMARY_FIRE_RATE: [0.05, 0.10, 0.15],
        PRIMARY_BULLET_SPEED: [1, 2, 3],
        SECONDARY_DAMAGE: [1, 2, 3],
        SECONDARY_COUNT: [1, 2, 3],
        SECONDARY_COOLDOWN: [0.05, 0.10, 0.15],
        HULL_REPAIR: [10, 20, 30]
    },

    // ==========================================
    // PORTAL APPLICATION LOGIC
    // ==========================================
    LOGIC: {
        'HULL_REPAIR': (player, value, currentWave = 1) => {
            const scaledHp = UpgradesConfig.COMPUTE.hpScale(value, currentWave);
            player.stats.maxHp = (player.stats.maxHp || 100) + scaledHp;
            player.stats.hp += scaledHp;
        },
        'PRIMARY_DAMAGE': (player, value) => {
            player.stats.flatPrimaryDamage = (player.stats.flatPrimaryDamage || 0) + value;
            const mult = player.stats.damageMultiplier || 1.0;

            player.primaryWeapon.stats.damage = UpgradesConfig.COMPUTE.damage(
                WeaponConfig.BASE.PRIMARY.damage,
                player.stats.flatPrimaryDamage,
                mult
            );
        },
        'PRIMARY_FIRE_RATE': (player, value) => {
            player.stats.flatHaste = (player.stats.flatHaste || 0) + value;
            const mult = player.stats.hasteMultiplier || 0;

            player.primaryWeapon.stats.cooldown = UpgradesConfig.COMPUTE.cooldown(
                WeaponConfig.BASE.PRIMARY.cooldown,
                player.stats.flatHaste + mult
            );
        },
        'PRIMARY_BULLET_SPEED': (player, value) => {
            player.primaryWeapon.stats.projectileSpeed += value;
        },
        'SECONDARY_DAMAGE': (player, value) => {
            player.secondaryWeapon.stats.damage += value;
        },
        'SECONDARY_COUNT': (player, value) => {
            player.secondaryWeapon.stats.count += value;
        },
        'SECONDARY_COOLDOWN': (player, value) => {
            player.stats.flatSecondaryHaste = (player.stats.flatSecondaryHaste || 0) + value;
            player.secondaryWeapon.stats.cooldown = UpgradesConfig.COMPUTE.cooldown(
                WeaponConfig.BASE.SECONDARY.cooldown,
                player.stats.flatSecondaryHaste
            );
        }
    },

    // ==========================================
    // BOSS UPGRADES (Archetypes & Enhancements)
    // ==========================================
    ARCHETYPES: {
        'CLASS_GUNNER': {
            id: 'CLASS_GUNNER',
            title: 'THE GUNNER',
            playerVariantIndex: 2,
            hasteBonus: 1.0,
            damagePenalty: -0.4,
            getDescription: function () {
                return `Attack Speed: +${this.hasteBonus * 100}%\nDamage: ${this.damagePenalty * 100}%\n\n* Applies permanently to base stats and future upgrades.`;
            },
            onApply: (player) => {
                player.stats.hasteMultiplier = (player.stats.hasteMultiplier || 0) + 1.0;
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) - 0.4;

                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.cooldown = UpgradesConfig.COMPUTE.cooldown(WeaponConfig.BASE.PRIMARY.cooldown, (player.stats.flatHaste || 0) + player.stats.hasteMultiplier);
                    player.primaryWeapon.stats.damage = UpgradesConfig.COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                }
            }
        },
        'CLASS_CANNON': {
            id: 'CLASS_CANNON',
            title: 'HEAVY ARTILLERY',
            playerVariantIndex: 3,
            damageBonus: 1.0,
            hastePenalty: -0.5,
            getDescription: function () {
                return `Damage: +${this.damageBonus * 100}%\nAttack Speed: ${this.hastePenalty * 100}%\n\n* Applies permanently to base stats and future upgrades.`;
            },
            onApply: (player) => {
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) + 1.0;
                player.stats.hasteMultiplier = (player.stats.hasteMultiplier || 0) - 0.5;

                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.damage = WeaponConfig.COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                    player.primaryWeapon.stats.cooldown = WeaponConfig.COMPUTE.cooldown(WeaponConfig.BASE.PRIMARY.cooldown, (player.stats.flatHaste || 0) + player.stats.hasteMultiplier);
                }
            }
        },
        'CLASS_SPREAD': {
            id: 'CLASS_SPREAD',
            title: 'SPREAD PATTERN',
            playerVariantIndex: 4,
            projectileBonus: 2,
            damagePenalty: -0.3,
            getDescription: function () {
                return `Fires ${this.projectileBonus} extra projectiles.\nDamage per projectile: ${this.damagePenalty * 100}%\n\n* Applies permanently to base stats and future upgrades.`;
            },
            onApply: (player) => {
                player.stats.damageMultiplier = (player.stats.damageMultiplier || 1.0) - 0.3;

                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.count = (player.primaryWeapon.stats.count || 1) + 2;
                    player.primaryWeapon.stats.damage = WeaponConfig.COMPUTE.damage(WeaponConfig.BASE.PRIMARY.damage, player.stats.flatPrimaryDamage || 0, player.stats.damageMultiplier);
                }
            }
        }
    },

    // ==========================================
    // POOL 2: ENHANCEMENTS (Generic Pool)
    // Formula for stats: (Base Portal Value * 3) + 1
    // ==========================================
    ENHANCEMENTS: {
        'OVERCHARGE_PRIMARY': {
            id: 'OVERCHARGE_PRIMARY',
            title: 'PRIMARY OVERCHARGE',
            weight: 100,
            hasTiers: true,
            damageBonus: [4, 7, 10], // T1: 1*3+1, T2: 2*3+1, T3: 3*3+1
            getDescription: function (tierIndex = 0) {
                return `+${this.damageBonus[tierIndex]} Primary Damage.`;
            },
            onApply: function (player, tierIndex = 0) {
                UpgradesConfig.LOGIC.PRIMARY_DAMAGE(player, this.damageBonus[tierIndex]);
            }
        },
        'OVERCHARGE_HASTE': {
            id: 'OVERCHARGE_HASTE',
            title: 'HASTE OVERCHARGE',
            weight: 100,
            hasTiers: true,
            hasteBonus: [0.16, 0.31, 0.46], // T1: 0.05*3+0.01, T2: 0.10*3+0.01, T3: 0.15*3+0.01
            getDescription: function (tierIndex = 0) {
                return `+${Math.round(this.hasteBonus[tierIndex] * 100)}% Attack Speed.`;
            },
            onApply: function (player, tierIndex = 0) {
                UpgradesConfig.LOGIC.PRIMARY_FIRE_RATE(player, this.hasteBonus[tierIndex]);
            }
        },
        'HEAVY_ARMOR': {
            id: 'HEAVY_ARMOR',
            title: 'HEAVY ARMOR',
            weight: 100,
            hasTiers: true,
            baseHpBonus: [31, 61, 91], // T1: 10*3+1, T2: 20*3+1, T3: 30*3+1
            getDescription: function (tierIndex = 0, currentWave = 1) {
                const scaledHp = UpgradesConfig.COMPUTE.hpScale(this.baseHpBonus[tierIndex], currentWave);
                return `+${scaledHp} Max Hull Integrity.`;
            },
            onApply: function (player, tierIndex = 0, currentWave = 1) {
                UpgradesConfig.LOGIC.HULL_REPAIR(player, this.baseHpBonus[tierIndex], currentWave);
            }
        },
        'ASSAULT_DRONE': {
            id: 'ASSAULT_DRONE',
            title: 'ASSAULT DRONE',
            weight: 100, // Equal weight as stats for now
            hasTiers: false,
            droneCountBonus: 1,
            getDescription: function () {
                return `Deploys an autonomous combat drone.`;
            },
            onApply: function (player) {
                player.stats.droneCount = (player.stats.droneCount || 0) + this.droneCountBonus;
                // Note: The DroneWeapon instantiation is handled here or via event
            }
        }
    },

    // ==========================================
    // RANDOM GENERATION UTILS (DRY)
    // ==========================================
    RANDOM: {
        getWeightedTierIndex: () => {
            const rand = Math.random();
            if (rand < 0.60) return 0;  // 60% Tier 1
            if (rand < 0.90) return 1;  // 30% Tier 2
            return 2;                   // 10% Tier 3
        },

        /**
         * Selects unique upgrades and pre-rolls their tiers if applicable.
         * @returns {Array<{config: Object, tierIndex: number}>} Array of packaged upgrade choices
         */
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
                        // Roll the tier now to ensure UI and logic are perfectly synced
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