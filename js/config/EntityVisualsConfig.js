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
    }
};