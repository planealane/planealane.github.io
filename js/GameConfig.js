// js/GameConfig.js

export const GameConfig = {
    // ==========================================
    // ENGINE & GAME STATES
    // ==========================================
    STATES: {
        START: 0,
        PLAYING: 1,
        GAMEOVER: 2
    },

    // Typography
    FONT_FAMILY: "'GameFont', sans-serif",
    FONT_SIZE_SM: 40,
    FONT_SIZE_MD: 60, // Standard floating text (e.g., damage numbers)
    FONT_SIZE_LG: 80, // Big announcements or Gates UI

    // Resolution (Target aspect ratio: 9:16)
    GAME_WIDTH: 1080,
    GAME_HEIGHT: 1920,

    // Global downward scrolling speed for all entities (pixels per ms)
    SCROLL_SPEED: 0.3,

    // ==========================================
    // GRID & POSITIONING SYSTEM
    // ==========================================
    // Playable area margin (10% of width on each side)
    MARGIN_X: 108,

    // Lane centers for nested grids. 
    // These specific values evenly distribute entities across the remaining 80% of the screen.
    ENEMY_LANES: [216, 432, 648, 864], // 4 lanes for enemies
    GATE_LANES: [324, 756],            // 2 lanes for gates, sitting exactly between enemy lanes

    // ==========================================
    // ENTITY BASE SIZES (Pixels)
    // ==========================================
    // Note: Height is usually calculated dynamically in entities to lock the aspect ratio of the sprite.
    SHIP_SIZE: 200,         // Base width/height for player and standard enemies
    PROJECTILE_SIZE: 64,    // Standard bullet size
    BOSS_BASE_WIDTH: 300,   // The absolute base width for a boss before applying its specific 'scale' multiplier
    GATE_BASE_WIDTH: 280,   // Target physical width for the gate collision box

    // ==========================================
    // PLAYER & ENEMY STATS
    // ==========================================
    PLAYER_BASE_HP: 1,
    PLAYER_BASE_DMG: 10,
    ENEMY_BASE_HP: 20,

    // Default ship sprite index (0 to 11 for yellow ships from the atlas)
    PLAYER_BASE_VARIANT: 10,
    TITLE_PLAYER_SIZE: 450, // Visual size of the ship on the main menu

    // ==========================================
    // DIFFICULTY SCALING MULTIPLIERS
    // ==========================================
    ENEMY_HP_SCALING: 0.5,
    BOSS_HP_SCALING: 1.0,   // Multiplier to fine-tune boss health curves independently

    /**
     * Calculates standard enemy HP based on the current wave/difficulty level.
     */
    calculateEnemyHp: function (currentWave) {
        return Math.floor(this.ENEMY_BASE_HP + (currentWave * this.ENEMY_HP_SCALING));
    },

    /**
     * Calculates boss HP by taking its base config HP and applying the global boss scaling factor.
     */
    calculateBossHp: function (baseHp, difficultyLevel) {
        return Math.floor(baseHp * (1 + (difficultyLevel * this.BOSS_HP_SCALING)));
    },

    // ==========================================
    // BOSS CONFIGURATIONS
    // ==========================================
    BOSS_DEFINITIONS: {
        'miniboss': {
            assetKey: 'miniboss',
            baseHp: 25,
            // 'scale' is a multiplier applied to BOSS_BASE_WIDTH.
            // Example: A scale of 2.0 with a 300 base width means the miniboss will be 600px wide.
            // It also serves as the baseline for the "shrink on hit" visual juice effect.
            scale: 2.0 
        },
        'boss': {
            assetKey: 'boss',
            baseHp: 25, 
            scale: 3.0  // Will render at 900px wide (300 * 3)
        },
        'final_boss': {
            assetKey: 'finalboss', 
            baseHp: 50,
            scale: 4.0  // Will render at 1200px wide, intentionally overflowing the screen width
        }
    },

    /**
     * Helper function to map encounter data to the correct boss configuration.
     */
    getBossDef: function(encounterData) {
        if (encounterData.id === 'final_boss') return this.BOSS_DEFINITIONS['final_boss'];
        if (encounterData.type === 'MINIBOSS') return this.BOSS_DEFINITIONS['miniboss'];
        return this.BOSS_DEFINITIONS['boss']; // Default standard boss fallback
    },

    // ==========================================
    // WEAPONS BASE STATS
    // ==========================================
    WEAPONS: {
        PRIMARY: {
            damage: 10,
            cooldown: 200,       // Time in ms between shots
            projectileSpeed: 15  // Downward/Upward velocity
        },
        SECONDARY: {
            damage: 5,
            cooldown: 10000,     // 10 seconds default cooldown
            count: 3             // Number of homing instances spawned per burst
        }
    },

    // ==========================================
    // UPGRADE TIERS (Index 0 = Tier 1, Index 1 = Tier 2, Index 2 = Tier 3)
    // ==========================================
    UPGRADES: {
        // Primary Weapon
        PRIMARY_DAMAGE: [1, 2, 3],             // Flat addition
        PRIMARY_FIRE_RATE: [10, 20, 30],       // Flat ms reduction from cooldown
        PRIMARY_BULLET_SPEED: [1, 2, 3],       // Flat addition to projectile velocity

        // Secondary Weapon
        SECONDARY_DAMAGE: [1, 2, 3],           // Flat addition to each instance's damage
        SECONDARY_COUNT: [1, 2, 3],            // Flat addition to the number of instances spawned
        SECONDARY_COOLDOWN: [0.05, 0.10, 0.15], // Percentage reduction of current cooldown (5%, 10%, 15%)

        // Survival
        HULL_REPAIR: [10, 20, 30]                // Flat addition to the uncapped health pool
    },
};