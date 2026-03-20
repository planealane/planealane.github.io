// js/main.js
import { AssetManager } from './AssetManager.js';
import { AudioManager } from './AudioManager.js';
import { GameManager } from './GameManager.js';

const init = async () => {
    const assets = new AssetManager();
    const audio = new AudioManager(); // Instantiate audio manager
    
    // Load images, audio, and wait for CSS fonts concurrently
    await Promise.all([
        assets.loadImage('ships', 'assets/ships.png', true),
        assets.loadImage('props', 'assets/props.png', true),
        assets.loadImage('plain-sky', 'assets/plain-sky.jpg'),
        assets.loadImage('title', 'assets/title.png'),
        
        // Add your audio file here (adjust extension if needed)
        audio.loadSound('title-theme', 'assets/audio/title_theme_1.ogg'),
        
        document.fonts.ready 
    ]);
    
    // Inject both dependencies into the game engine
    const game = new GameManager('gameCanvas', assets, audio);
    game.start();
};

init();