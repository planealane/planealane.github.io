// js/main.js
import { AssetManager } from './managers/AssetManager.js';
import { AudioManager } from './managers/AudioManager.js';
import { GameManager } from './core/GameManager.js';
import { ImageManifest, AudioManifest } from './config/AssetManifest.js';

const init = async () => {
    const assets = new AssetManager();
    const audio = new AudioManager(); 

    // 1. Map configuration data to loading promises
    const imagePromises = ImageManifest.map(img => 
        assets.loadImage(img.key, img.path, img.isAtlas || false)
    );

    const audioPromises = AudioManifest.map(snd => 
        audio.loadSound(snd.key, snd.path)
    );

    // 2. Await all assets and CSS fonts concurrently
    await Promise.all([
        ...imagePromises,
        ...audioPromises,
        document.fonts.ready
    ]);

    // 3. Inject dependencies into the engine and boot
    const game = new GameManager('gameCanvas', assets, audio);
    game.start();
};

init();