// InputManager.js
import { GameConfig } from './GameConfig.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pointer = { x: GameConfig.GAME_WIDTH / 2, y: GameConfig.GAME_HEIGHT / 2, isDown: false };
        this.initListeners();
    }

    initListeners() {
        this.canvas.addEventListener('pointerdown', (e) => this.updatePointer(e, true));
        this.canvas.addEventListener('pointermove', (e) => this.updatePointer(e, this.pointer.isDown));
        this.canvas.addEventListener('pointerup', (e) => this.updatePointer(e, false));
    }

    updatePointer(event, isDown) {
        this.pointer.isDown = isDown;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GameConfig.GAME_WIDTH / rect.width;
        const scaleY = GameConfig.GAME_HEIGHT / rect.height;
        this.pointer.x = (event.clientX - rect.left) * scaleX;
        this.pointer.y = (event.clientY - rect.top) * scaleY;
    }
}