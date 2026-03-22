// js/config/AssetManifest.js

/**
 * Centralized registry for all game images.
 */
export const ImageManifest = [
    { key: 'ships',      path: 'assets/ships.png',              isAtlas: true },
    { key: 'props',      path: 'assets/props.png',              isAtlas: true },
    { key: 'plain-sky',  path: 'assets/plain-sky.jpg',          isAtlas: false },
    { key: 'title',      path: 'assets/title.png',              isAtlas: false },
    { key: 'clouds',     path: 'assets/clouds.png',             isAtlas: false },
    { key: 'miniboss',   path: 'assets/placeholder_boss.png',   isAtlas: false },
    { key: 'boss',       path: 'assets/placeholder_boss.png',   isAtlas: false },
    { key: 'finalboss',  path: 'assets/placeholder_boss.png',   isAtlas: false }
];

/**
 * Centralized registry for all game audio files.
 */
export const AudioManifest = [
    { key: 'bonus',       path: 'assets/audio/powerup.mp3' },
    { key: 'explosion',   path: 'assets/audio/explosion.mp3' },
    { key: 'player_hit',  path: 'assets/audio/player_hurt.mp3' },
    { key: 'title-theme', path: 'assets/audio/title-theme_1.ogg' },
    { key: 'main-theme', path: 'assets/audio/main_theme_1.ogg' }
];