// js/UIConfig.js

export const UIConfig = {
    BUTTON_DEFAULTS: {
        width: 400,
        height: 64, 
        cornerRadius: 15
    },

    BUTTON_THEMES: {
        primary: { normal: '#3498db', hover: '#2980b9', click: '#1f618d', border: '#21618c', text: '#ffffff' },
        start:   { normal: '#2ecc71', hover: '#27ae60', click: '#1d8348', border: '#196f3d', text: '#ffffff' },
        restart: { normal: '#e74c3c', hover: '#c0392b', click: '#943126', border: '#78281f', text: '#ffffff' }
    },

    ANIMATIONS: {
        BTN_HOVER_RISE: 5,
        BTN_INNER_SHIFT: 3,

        CLICK_PAUSE_MS: 250,
        CLICK_FILL_DURATION_MS: 1000,
        OPEN_DURATION_MS: 800,
        
        TITLE_BREATH_SPEED: 0.002,
        TITLE_BREATH_AMPLITUDE: 10,
        BTN_BREATH_SPEED: 0.0015,
        BTN_BREATH_AMPLITUDE: 8,

        EXHAUST_PARTICLE_COUNT: 5,
        EXHAUST_BASE_SIZE: 15,
        EXHAUST_MAX_DROP: 60,

        GAMEOVER_FADE_MS: 1500,
        GAMEOVER_BOUNCE_MS: 1750,
        GAMEOVER_BTN_SLIDE_MS: 1500,

        START_TRANSITION_MS: 1500 
    },

    SCREENS: {
        START: {
            TITLE_Y_PERCENTAGE: 0.10, 
            PLAYER_Y_OFFSET_PERCENTAGE: 0.10, 
            PLAY_BTN_Y_PERCENTAGE: 0.75, 
            PLAY_BTN_SCALE: 2 
        },
        GAMEOVER: {
            REPLAY_BTN_Y_PERCENTAGE: 0.60,
            BUTTON_APPEAR_DELAY_MS: 2000,
            // Added specific text color
            TEXT_COLOR: '#e74c3c' 
        }
    }
};