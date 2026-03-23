// js/config/UpgradesConfig.js

/**
 * Centralized configuration for all Super Upgrades (Boss drops).
 * Each upgrade defines its UI texts, the visual variant it assigns to the player,
 * and a custom function 'onApply' to execute complex gameplay logic.
 */
export const UpgradesConfig = {
    
    SUPER_UPGRADES: {
        'JUGGERNAUT': {
            id: 'JUGGERNAUT',
            title: 'JUGGERNAUT',
            description: 'Massive Hull integrity.\nWeapons deal +200% damage.',
            playerVariantIndex: 1, // The specific sprite index to use in ShipsAtlas
            onApply: (player, entityManager) => {               
                // Multiply primary weapon damage
                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.damage *= 3;
                }
            }
        },

        'SWARM_COMMANDER': {
            id: 'SWARM_COMMANDER',
            title: 'SWARM COMMANDER',
            description: 'Fires a relentless barrage\nof homing missiles.',
            playerVariantIndex: 5,
            onApply: (player, entityManager) => {
                // Example of complex logic: Drastically reduce missile cooldown, increase count
                if (player.secondaryWeapon) {
                    player.secondaryWeapon.stats.cooldown /= 3; // 3x faster
                    player.secondaryWeapon.stats.count += 4;    // +4 missiles per burst
                }
            }
        },

        'PHANTOM_STRIKE': {
            id: 'PHANTOM_STRIKE',
            title: 'PHANTOM STRIKE',
            description: 'Insane primary fire rate.\nProjectiles travel faster.',
            playerVariantIndex: 8,
            onApply: (player, entityManager) => {
                // Example of complex logic: Machine gun mode
                if (player.primaryWeapon) {
                    player.primaryWeapon.stats.cooldown = Math.max(50, player.primaryWeapon.stats.cooldown / 4);
                    player.primaryWeapon.stats.projectileSpeed *= 2;
                }
            }
        }
    },

    /**
     * Helper to randomly select 'count' unique super upgrades from the pool.
     */
    getRandomSuperUpgrades(count = 3) {
        const keys = Object.keys(this.SUPER_UPGRADES);
        
        // Shuffle array (Fisher-Yates algorithm)
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        
        // Pick the requested number of unique upgrades
        const selectedKeys = keys.slice(0, count);
        return selectedKeys.map(key => this.SUPER_UPGRADES[key]);
    }
};