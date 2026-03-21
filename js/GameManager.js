// js/GameManager.js
import { GameConfig } from './GameConfig.js';
import { InputManager } from './InputManager.js';
import { gameEvents, EVENTS } from './EventBus.js';
import { StartState } from './states/StartState.js';
import { PlayState } from './states/PlayState.js';
import { GameOverState } from './states/GameOverState.js';

export class GameManager {

    // ============================================================================
    // 1. CONSTRUCTOR & DEPENDENCY INJECTION
    // ============================================================================
    
    constructor(canvasId, assets, audioManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.assets = assets;
        this.audioManager = audioManager; 

        this.canvas.width = GameConfig.GAME_WIDTH;
        this.canvas.height = GameConfig.GAME_HEIGHT;
        this.ctx.imageSmoothingEnabled = false; 

        this.lastTime = 0;
        this.timeScale = 1.0; 

        this.inputManager = new InputManager(this.canvas);
        
        // Will be instantiated dynamically by PlayState
        this.entityManager = null;

        // Initialize State Machine Dictionary
        this.states = {
            'START': new StartState(this),
            'PLAY': new PlayState(this),
            'GAMEOVER': new GameOverState(this)
        };
        this.currentState = null;

        // ==========================================
        // EVENT BUS SUBSCRIPTIONS
        // ==========================================
        
        // Global listener for player death
        gameEvents.on(EVENTS.PLAYER_DEAD, () => {
            // Prevent re-triggering if already in GAMEOVER state
            if (this.currentState === this.states['PLAY']) {
                this.changeState('GAMEOVER');
            }
        });
    }

    // ============================================================================
    // 2. STATE MACHINE LOGIC
    // ============================================================================

    /**
     * Handles the transition between different game states safely.
     * @param {string} newStateKey - Must match a key in this.states
     */
    changeState(newStateKey) {
        if (this.currentState) {
            this.currentState.exit();
        }

        this.currentState = this.states[newStateKey];
        
        if (this.currentState) {
            this.currentState.enter();
        } else {
            console.error(`[GameManager] State '${newStateKey}' is undefined.`);
        }
    }

    /**
     * Bootstraps the game loop. Called once from main.js.
     */
    start() {
        this.audioManager.playMusic('title-theme');
        this.changeState('START');
        requestAnimationFrame(this.loop.bind(this));
    }

    // ============================================================================
    // 3. CORE GAME LOOP (TICK)
    // ============================================================================

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        const pointer = this.inputManager.getPointer();

        // Base clear screen (states draw on top of this)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Delegate entire update and draw logic to the active state
        if (this.currentState) {
            this.currentState.update(dt, pointer);
            this.currentState.draw(this.ctx);
        }

        requestAnimationFrame(this.loop.bind(this));
    }
}