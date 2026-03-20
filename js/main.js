// js/main.js
import { AssetManager } from './AssetManager.js';
import { GameManager } from './GameManager.js';

const init = async () => {
    const assets = new AssetManager();
    // Load with black background removal enabled for both ships and props
    await assets.loadImage('ships', 'assets/ships.png', true); 
    await assets.loadImage('props', 'assets/props.png', true); // New asset
    
    const game = new GameManager('gameCanvas', assets);
    game.start();
};

init();