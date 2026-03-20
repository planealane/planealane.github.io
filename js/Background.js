// Background.js
import { GameConfig } from './GameConfig.js';

export class Background {
    constructor() {
        this.gridSize = 100;
        this.offsetY = 0;
        this.speed = 0.2; // pixels per ms
    }

    update(dt) {
        this.offsetY += this.speed * dt;
        if (this.offsetY >= this.gridSize) {
            this.offsetY %= this.gridSize;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        for (let x = 0; x <= GameConfig.GAME_WIDTH; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GameConfig.GAME_HEIGHT);
            ctx.stroke();
        }

        for (let y = this.offsetY - this.gridSize; y <= GameConfig.GAME_HEIGHT; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GameConfig.GAME_WIDTH, y);
            ctx.stroke();
        }
    }
}