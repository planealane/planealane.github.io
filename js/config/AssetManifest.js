// js/config/AssetManifest.js

/**
 * Centralized registry for all game images.
 */
export const ImageManifest = [
    { key: 'ships', path: 'assets/ships.png', isAtlas: true },
    { key: 'props', path: 'assets/props.png', isAtlas: true },
    { key: 'progress_spritesheet', path: 'assets/progress_spritesheet.png', isAtlas: false },
    { key: 'plain-sky', path: 'assets/plain-sky.jpg', isAtlas: false },
    { key: 'title', path: 'assets/title.png', isAtlas: false },
    { key: 'clouds', path: 'assets/clouds.png', isAtlas: false },
    { key: 'miniboss', path: 'assets/boss_01.png', isAtlas: false },
    { key: 'boss', path: 'assets/boss_01.png', isAtlas: false },
    { key: 'finalboss', path: 'assets/boss_01.png', isAtlas: false },
    { key: 'gate', path: 'assets/gate_01.png', isAtlas: false },
    { key: 'megabonus', path: 'assets/megabonus.png', isAtlas: false }

];

/**
 * Centralized registry for all game audio files.
 */
export const AudioManifest = [
    { key: 'bonus', path: 'assets/audio/powerup.mp3' },
    { key: 'explosion', path: 'assets/audio/explosion.mp3' },
    { key: 'player_hit', path: 'assets/audio/player_hurt.mp3' },
    { key: 'title-theme', path: 'assets/audio/title-theme_1.ogg' },
    { key: 'main-theme', path: 'assets/audio/main_theme_1.ogg' },
    { key: 'button_interact', path: 'assets/audio/button_click_sfx_1.mp3' },
    { key: 'game_start', path: 'assets/audio/game_start_sfx.mp3' },
    { key: 'impact', path: 'assets/audio/impact_sfx_1.ogg' },
    { key: 'form_change', path: 'assets/audio/form_change.mp3'},
];