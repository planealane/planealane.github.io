// js/config/WeaponConfig.js

export const WeaponConfig = {
    // ==========================================
    // BASE STATS
    // ==========================================
    BASE: {
        PRIMARY: {
            damage: 10,
            cooldown: 1000, 
            projectileSpeed: 1
        },
        SECONDARY: {
            damage: 5,
            cooldown: 10000,
            count: 3,
            projectileSpeed: 1,
            turnFactor: 0.008,
            staggerMs: 120
        }
    },

    // ==========================================
    // UPGRADE VALUES (Index 0 = Tier 1, Index 1 = Tier 2, Index 2 = Tier 3)
    // ==========================================
    UPGRADES: {
        PRIMARY_DAMAGE: [1, 2, 3],              
        PRIMARY_FIRE_RATE: [10, 20, 30],        
        PRIMARY_BULLET_SPEED: [1, 2, 3],        
        SECONDARY_DAMAGE: [1, 2, 3],            
        SECONDARY_COUNT: [1, 2, 3],             
        SECONDARY_COOLDOWN: [0.05, 0.10, 0.15], 
        HULL_REPAIR: [10, 20, 30] // Added back for centralized logic
    },

    // ==========================================
    // UPGRADE APPLICATION LOGIC
    // Centralized formulas for modifying stats
    // ==========================================
    LOGIC: {
        'HULL_REPAIR': (player, value) => {
            player.stats.hp += value;
        },
        'PRIMARY_DAMAGE': (player, value) => {
            player.primaryWeapon.stats.damage += value;
        },
        'PRIMARY_FIRE_RATE': (player, value) => {
            const w = player.primaryWeapon;
            w.stats.cooldown = Math.max(50, w.stats.cooldown - value);
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
            const w = player.secondaryWeapon;
            w.stats.cooldown = w.stats.cooldown * (1 - value);
        }
    }
};