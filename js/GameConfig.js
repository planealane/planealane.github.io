// js/GameConfig.js

export const GameConfig = {
    // Game States
    STATES: {
        START: 0,
        PLAYING: 1,
        GAMEOVER: 2
    },

    FONT_FAMILY: "'GameFont', sans-serif",
    FONT_SIZE_SM: 40,
    FONT_SIZE_MD: 60, // Standard floating text
    FONT_SIZE_LG: 80, // Big announcements or Gates


    GAME_WIDTH: 1080,
    GAME_HEIGHT: 1920,

    // Global downward scrolling speed for all entities
    SCROLL_SPEED: 0.3,

    // Playable area margin (10% of width)
    MARGIN_X: 108,

    // Lane centers for nested grids

    //No margin
    //ENEMY_LANES: [135, 405, 675, 945]
    //GATE_LANES: [270, 810],


    //10%
    ENEMY_LANES: [216, 432, 648, 864],
    GATE_LANES: [324, 756],

    //15%
    // ENEMY_LANES: [256.5, 445.5, 634.5, 823.5]
    // GATE_LANES: [351, 729]

    //20%
    // ENEMY_LANES: [297, 459, 621, 783]
    // GATE_LANES: [378, 702]

    // Size of the player/ennemies/props
    SHIP_SIZE: 200,
    PROJECTILE_SIZE: 64,
    BOSS_BASE_WIDTH: 300,

    // Base stats
    PLAYER_BASE_HP: 1,
    PLAYER_BASE_DMG: 10,
    ENEMY_BASE_HP: 20,

    // Default ship sprite index (0 to 11 for yellow ships)
    PLAYER_BASE_VARIANT: 10,

    TITLE_PLAYER_SIZE: 450,

    // Scaling factors
    ENEMY_HP_SCALING: 0.5,

    // Helper method to calculate enemy HP based on wave/spawn count
    calculateEnemyHp: function (currentWave) {
        return Math.floor(this.ENEMY_BASE_HP + (currentWave * this.ENEMY_HP_SCALING));
    }
};