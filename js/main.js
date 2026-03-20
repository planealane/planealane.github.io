// js/main.js
import { AssetManager } from './AssetManager.js';
import { GameManager } from './GameManager.js';

const init = async () => {
    const assets = new AssetManager();
    
    // Load images and wait for CSS fonts concurrently
    await Promise.all([
        // Load with black background removal enabled for both ships and props
        assets.loadImage('ships', 'assets/ships.png', true),
        assets.loadImage('props', 'assets/props.png', true),
        // Wait for custom fonts to prevent Canvas text rendering issues
        document.fonts.ready 
    ]);
    
    const game = new GameManager('gameCanvas', assets);
    game.start();
};

init();