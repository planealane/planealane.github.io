// js/config/EntityVisualsConfig.js

export const EntityVisualsConfig = {
    // ==========================================
    // COUCHES DE RENDU (Z-INDEX)
    // ==========================================
    Z_INDEX: {
        BACKGROUND: 0,
        ENEMY: 10,
        BOSS: 15,
        PLAYER: 20,
        COLLECTIBLE: 25,
        PROJECTILE: 30,
        VFX: 40,
        UI: 50
    },

    // ==========================================
    // TAILLES DE BASE (Hitboxes alignées sur Sprites)
    // ==========================================
    PLAYER: {
        SIZE: 200,
        BASE_VARIANT: 10,
        TRAIL_LENGTH: 15,
        HP_OFFSET_Y: 25
    },
    
    ENEMY: {
        SIZE: 200
    },

    BOSS: {
        BASE_WIDTH: 320,
        HP_OFFSET_Y: -40
    },

    GATE: {
        BASE_WIDTH: 400,
        TEXT_OFFSET_Y: 30
    },

    PROJECTILE: {
        SIZE: 64
    },

    // ==========================================
    // VISUAL EFFECTS (VFX) SETTINGS
    // ==========================================
    VFX: {
        SHAKE: {
            // Default intensities and durations for different events
            ENEMY_KILL: { intensity: 3, duration: 150 },
            PLAYER_HIT: { intensity: 8, duration: 250 },
            PLAYER_DEATH: { intensity: 15, duration: 600 }
        },
        HIT_STOP: {
            ENEMY_KILL: 30 // Milliseconds to freeze the frame on kill
        },
        FLOATING_TEXT: {
            DURATION: 800,
            FLOAT_SPEED: 0.05
        },
        SPEED_LINES: {
            LINE_COUNT: 30,
            WIDTH_THIN: 4,
            WIDTH_THICK: 8,
            THICK_CHANCE: 0.8 // 20% chance to be thick (Math.random() > 0.8)
        }
    }
};