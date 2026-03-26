// js/managers/InputManager.js
import { GameConfig } from '../GameConfig.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Initialize pointer exactly in the center of the logical canvas
        this.pointer = { 
            x: GameConfig.CANVAS.WIDTH / 2, 
            y: GameConfig.CANVAS.HEIGHT / 2, 
            isDown: false 
        };
        this.keys = new Set();
        
        this.initListeners();
    }

    initListeners() {
        // Pointer events (Mouse + Touch)
        this.canvas.addEventListener('pointerdown', (e) => this.updatePointer(e, true));
        this.canvas.addEventListener('pointermove', (e) => this.updatePointer(e, this.pointer.isDown));
        this.canvas.addEventListener('pointerup', (e) => this.updatePointer(e, false));
        this.canvas.addEventListener('pointerleave', (e) => this.updatePointer(e, false)); // Safety fallback

        // Keyboard events
        window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    }

    updatePointer(event, isDown) {
        this.pointer.isDown = isDown;
        
        // Get the actual physical size of the canvas on the screen
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate the scale difference between logical resolution and physical size
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        // Apply the scale to get accurate in-game coordinates
        this.pointer.x = (event.clientX - rect.left) * scaleX;
        this.pointer.y = (event.clientY - rect.top) * scaleY;
    }

    // Encapsulation: cleanly expose the state
    getPointer() {
        return this.pointer;
    }

    isKeyDown(key) {
        return this.keys.has(key.toLowerCase());
    }
}