// js/GameConfig.js

export const GameConfig = {
    // ==========================================
    // ENGINE & GAME STATES
    // ==========================================
    STATES: {
        START: 0,       // Initial menu state
        PLAYING: 1,     // Active gameplay loop
        GAMEOVER: 2     // Post-death screen
    },

    // ==========================================
    // RENDER LAYERS (Z-INDEX)
    // ==========================================
    Z_INDEX: {
        BACKGROUND: 0,  // Parallax scrolling background
        ENEMY: 10,      // Standard mobs
        BOSS: 15,       // Large entities (rendered under player)
        PLAYER: 20,     // The user's ship
        COLLECTIBLE: 25,// Loot drops (rendered above player)
        PROJECTILE: 30, // Bullets and missiles (rendered above ships)
        VFX: 40,        // Visual effects (explosions, reticles)
        UI: 50          // Heads-up display (health, score, prompts)
    },

    // ==========================================
    // TYPOGRAPHY & RESOLUTION
    // ==========================================
    FONT_FAMILY: "'GameFont', sans-serif", // Primary font stack
    FONT_SIZE_SM: 40,                      // Small UI text
    FONT_SIZE_MD: 60,                      // Standard floating combat text
    FONT_SIZE_LG: 80,                      // Screen announcements

    GAME_WIDTH: 1080,                      // Logical canvas width (9:16 ratio)
    GAME_HEIGHT: 1920,                     // Logical canvas height (9:16 ratio)

    SCROLL_SPEED: 0.3,                     // Downward velocity for environment/entities (px/ms)

    // ==========================================
    // GRID & POSITIONING SYSTEM
    // ==========================================
    MARGIN_X: 108,                         // 10% horizontal safe zone margin

    ENEMY_LANES: [216, 432, 648, 864],     // X-coordinates for 4 distinct enemy spawn columns
    GATE_LANES: [324, 756],                // X-coordinates for gate spawns (centered between enemy lanes)

    // ==========================================
    // ENTITY BASE SIZES (Pixels)
    // ==========================================
    SHIP_SIZE: 200,                        // Hitbox/sprite dimension for standard ships
    PROJECTILE_SIZE: 64,                   // Hitbox/sprite dimension for bullets
    BOSS_BASE_WIDTH: 300,                  // Baseline width for boss scaling calculations
    GATE_BASE_WIDTH: 280,                  // Hitbox width for upgrade gates

    // ==========================================
    // PLAYER CONFIGURATION
    // ==========================================
    PLAYER_BASE_HP: 100,                     // Initial health points
    PLAYER_BASE_DMG: 10,                   // Legacy config, currently unused as weapon stats take over
    PLAYER_BASE_VARIANT: 10,               // Initial sprite index for the player ship
    TITLE_PLAYER_SIZE: 450,                // Sprite dimension for the ship on the start menu

    // ==========================================
    // BALANCE & SCALING (HP Formulas)
    // ==========================================

    /**
     * Calculates normal enemy HP based on progression index (x).
     * Formula: 10 + 0.2x^2 + 0.03x^3
     */
    calculateEnemyHp: function (x) {
        const index = Math.max(1, x);
        return Math.floor(10 + (0.2 * Math.pow(index, 2)) + (0.03 * Math.pow(index, 3)));
    },

    /**
     * Calculates Boss / Miniboss HP based on progression index and type.
     */
    calculateBossHp: function (x, encounterType = 'BOSS') {
        const index = Math.max(1, x);

        if (encounterType === 'TUTORIAL') return 50;     // Fixed HP for tutorial
        if (encounterType === 'FINAL') return 50000;      // Fixed HP for the final encounter

        if (encounterType === 'MINIBOSS') {
            // HP scaling reduced by a factor of 10 (Formula: x^2 + 10x)
            return Math.floor(Math.pow(index, 2) + (10 * index));
        }

        return Math.floor(3.3 * Math.pow(index, 2));       // 33x^2 (Standard Bosses)
    },

    // ==========================================
    // BOSS CONFIGURATIONS
    // ==========================================
    BOSS_DEFINITIONS: {
        'miniboss': {
            assetKey: 'miniboss', // Sprite atlas key
            scale: 2.0            // Visual/hitbox multiplier applied to BOSS_BASE_WIDTH
        },
        'boss': {
            assetKey: 'boss',
            scale: 3.0            // Renders at 900px
        },
        'final_boss': {
            assetKey: 'finalboss',
            scale: 4.0            // Renders at 1200px (intentional screen overflow)
        }
    },

    /**
     * Helper function to map encounter data to the correct boss configuration.
     */
    getBossDef: function (encounterData) {
        if (encounterData.id === 'final_boss') return this.BOSS_DEFINITIONS['final_boss'];
        if (encounterData.type === 'MINIBOSS') return this.BOSS_DEFINITIONS['miniboss'];
        return this.BOSS_DEFINITIONS['boss']; // Fallback
    },
};