// js/main.js
import { AssetManager } from './managers/AssetManager.js';
import { AudioManager } from './managers/AudioManager.js';
import { GameManager } from './core/GameManager.js';

const init = async () => {
    const assets = new AssetManager();
    const audio = new AudioManager(); // Instantiate audio manager

    // Load images, audio, and wait for CSS fonts concurrently
    await Promise.all([
        assets.loadImage('ships', 'assets/ships.png', true),
        assets.loadImage('props', 'assets/props.png', true),
        assets.loadImage('plain-sky', 'assets/plain-sky.jpg'),
        assets.loadImage('title', 'assets/title.png'),
        assets.loadImage('clouds', 'assets/clouds.png'),
        assets.loadImage('miniboss', 'assets/placeholder_boss.png'),
        assets.loadImage('boss', 'assets/placeholder_boss.png'),
        assets.loadImage('finalboss', 'assets/placeholder_boss.png'),
        audio.loadSound('bonus', 'assets/audio/powerup.mp3'),
        audio.loadSound('explosion', 'assets/audio/explosion.mp3'),
        audio.loadSound('player_hit', 'assets/audio/player_hurt.mp3'),

        // Add your audio file here (adjust extension if needed)
        audio.loadSound('title-theme', 'assets/audio/title-theme_1.ogg'),

        document.fonts.ready
    ]);

    // Inject both dependencies into the game engine
    const game = new GameManager('gameCanvas', assets, audio);
    game.start();
};

init();