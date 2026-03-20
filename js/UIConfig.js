// js/UIConfig.js

export const UIConfig = {
    // General Colors
    COLOR_BG_OVERLAY: 'rgba(0, 0, 0, 0.75)',
    COLOR_TEXT_GAMEOVER: '#f1c40f', // Yellow
    COLOR_TEXT_PRIMARY: '#fff',

    // Button Themes Dictionary
    BUTTON_THEMES: {
        start: {
            normal: '#e74c3c',
            hover: '#ff6b5b',
            click: '#c0392b',
            border: '#777777',
            text: '#fff'
        },
        restart: {
            normal: '#00d4ff', // Electric Blue
            hover: '#5ce1ff',  // Lighter hover
            click: '#00a3cc',  // Darker press
            border: '#777777',
            text: '#000'
        }
    },

    // Shared Button Metrics
    BTN_INNER_SHIFT: 5,
    BTN_HOVER_RISE: 10,

    // Animations
    ANIM_CLICK_PAUSE_MS: 250,
    ANIM_CLICK_FILL_DURATION_MS: 1000,
    ANIM_OPEN_DURATION_MS: 800, // New: Duration for the opening wipe
    ANIM_FILL_CIRCLE_COLOR: '#000000',

    // Breathing animations for Title Screen
    TITLE_BREATH_SPEED: 0.002,
    TITLE_BREATH_AMP: 10,
    BTN_BREATH_SPEED: 0.0015,
    BTN_BREATH_AMP: 8,

    // Game Over Sequence Timings
    GO_FADE_DURATION_MS: 1500,    // Slow background darkening
    GO_BOUNCE_DURATION_MS: 1500,  // Text falling and bouncing
    GO_BTN_DELAY_MS: 1200,        // Wait before showing button
    GO_BTN_SLIDE_MS: 600          // Button sliding duration


};