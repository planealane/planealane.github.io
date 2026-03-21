// js/InputManager.js
import { GameConfig } from './GameConfig.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pointer = { 
            x: GameConfig.GAME_WIDTH / 2, 
            y: GameConfig.GAME_HEIGHT / 2, 
            isDown: false 
        };
        this.keys = new Set();
        
        this.initListeners();
    }

    initListeners() {
        // Pointer events (Souris + Tactile)
        this.canvas.addEventListener('pointerdown', (e) => this.updatePointer(e, true));
        this.canvas.addEventListener('pointermove', (e) => this.updatePointer(e, this.pointer.isDown));
        this.canvas.addEventListener('pointerup', (e) => this.updatePointer(e, false));
        this.canvas.addEventListener('pointerleave', (e) => this.updatePointer(e, false)); // Sécurité

        // Keyboard events
        window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    }

    updatePointer(event, isDown) {
        this.pointer.isDown = isDown;
        const rect = this.canvas.getBoundingClientRect();
        
        const scaleX = GameConfig.GAME_WIDTH / rect.width;
        const scaleY = GameConfig.GAME_HEIGHT / rect.height;
        
        this.pointer.x = (event.clientX - rect.left) * scaleX;
        this.pointer.y = (event.clientY - rect.top) * scaleY;
    }

    // Encapsulation: exposition propre de l'état
    getPointer() {
        return this.pointer;
    }

    isKeyDown(key) {
        return this.keys.has(key.toLowerCase());
    }
}