// js/GameManager.js
import { GameConfig } from './GameConfig.js';
import { EntityManager } from './EntityManager.js';
import { Player } from './entities.js';
import { UIManager } from './UIManager.js';

export class GameManager {
    // Add audioManager to constructor parameters
    constructor(canvasId, assets, audioManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.assets = assets;
        this.audioManager = audioManager; // Store reference

        this.canvas.width = GameConfig.GAME_WIDTH;
        this.canvas.height = GameConfig.GAME_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;

        this.state = GameConfig.STATES.START;
        this.lastTime = 0;

        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        this.isMouseDown = false;

        this.uiManager = new UIManager(
            this.canvas.width,
            this.canvas.height,
            () => this.initGame(),
            () => this.initGame()
        );

        this.setupInputs();
    }
    setupInputs() {
        const updatePointer = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;

            this.mouseX = (clientX - rect.left) * scaleX;
            this.mouseY = (clientY - rect.top) * scaleY;
        };

        // Pointer movement
        this.canvas.addEventListener('mousemove', updatePointer);
        this.canvas.addEventListener('touchmove', updatePointer, { passive: true });

        // Pointer state (down/up) for button press visuals
        this.canvas.addEventListener('mousedown', () => this.isMouseDown = true);
        this.canvas.addEventListener('mouseup', () => this.isMouseDown = false);
        this.canvas.addEventListener('touchstart', () => this.isMouseDown = true, { passive: true });
        this.canvas.addEventListener('touchend', () => this.isMouseDown = false);

        // Click events handled by UI Manager based on current state
        this.canvas.addEventListener('click', () => {
            this.uiManager.handleClick(this.mouseX, this.mouseY, this.state);
        });
    }

    initGame() {
        this.entityManager = new EntityManager(this.assets);
        this.entityManager.addEntity(new Player(this.assets.getImage('ships')));

        this.mouseX = this.canvas.width / 2;
        this.lastTime = performance.now();

        // New: Time scale for slow motion effect
        this.timeScale = 1.0;
        this.state = GameConfig.STATES.PLAYING;

        this.uiManager.startOpening();
    }

    start() {
        // Start title screen music. Might pend until user clicks anywhere.
        this.audioManager.playMusic('title-theme');
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === GameConfig.STATES.START || this.state === GameConfig.STATES.GAMEOVER) {
            this.uiManager.update(this.mouseX, this.mouseY, this.isMouseDown, this.state);
        }

        // Slow motion logic: gradually decrease timeScale if dead
        if (this.state === GameConfig.STATES.GAMEOVER) {
            // Reaches 0 in ~2 seconds (dt * 0.0005)
            this.timeScale = Math.max(0, this.timeScale - dt * 0.0005);
        }

        // Keep updating the game world even in GAMEOVER as long as timeScale > 0
        if ((this.state === GameConfig.STATES.PLAYING || (this.state === GameConfig.STATES.GAMEOVER && this.timeScale > 0)) && dt < 100) {
            // Pass scaled dt
            this.updateGame(dt * this.timeScale);
        }

        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateGame(dt) {
        this.entityManager.update(dt, this.mouseX);

        // Check death condition only if we are currently PLAYING
        if (this.state === GameConfig.STATES.PLAYING) {
            const playerAlive = this.entityManager.entities.some(e => e instanceof Player);
            if (!playerAlive) {
                // IMPORTANT: Ensure your EntityManager spawns an ExplosionEntity 
                // where the Player died in its collision logic!

                this.state = GameConfig.STATES.GAMEOVER;
                this.uiManager.startGameOver(); // Trigger the UI animations
            }
        }
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === GameConfig.STATES.START) {
            // Fetch images and pass them to the UI manager (Dependency Injection)
            const bgImage = this.assets.getImage('plain-sky');
            const titleImage = this.assets.getImage('title');
            this.uiManager.drawStartScreen(this.ctx, bgImage, titleImage);
        } else {
            // Draw game entities (visible during PLAYING and frozen during GAMEOVER)
            if (this.entityManager) {
                this.entityManager.draw(this.ctx);
            }

            // Overlay game over menu
            if (this.state === GameConfig.STATES.GAMEOVER) {
                this.uiManager.drawGameOverScreen(this.ctx);
            }
            // Overlay the opening transition if we just started playing
            else if (this.state === GameConfig.STATES.PLAYING) {
                this.uiManager.drawOpeningTransition(this.ctx);
            }
        }
    }
}