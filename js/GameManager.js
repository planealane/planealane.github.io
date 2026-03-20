// Game.js
import { InputManager } from './InputManager.js';
import { Background } from './Background.js';
import { EntityManager } from './EntityManager.js';
import { Player } from './entities.js';
import { GameConfig } from './GameConfig.js';

export class GameManager {
    constructor(canvasId, assets) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GameConfig.GAME_WIDTH;
        this.canvas.height = GameConfig.GAME_HEIGHT;

        this.input = new InputManager(this.canvas);
        this.background = new Background(); // Re-enabled background
        this.entityManager = new EntityManager(assets);
        
        this.entityManager.addEntity(new Player(assets.getImage('ships')));

        this.lastTime = 0;
        this.isRunning = true;
    }

    start() {
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (deltaTime > 100) deltaTime = 100;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        this.background.update(dt);
        this.entityManager.update(dt, this.input.pointer.x);
    }

    draw() {
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);
        this.background.draw(this.ctx);
        this.entityManager.draw(this.ctx);
    }
}