// js/core/GameManager.js
import { GameConfig } from '../GameConfig.js';
import { InputManager } from '../managers/InputManager.js';
import { TransitionManager } from '../managers/TransitionManager.js';
import { LoadState } from '../states/LoadState.js';
import { StartState } from '../states/StartState.js';
import { PlayState } from '../states/PlayState.js';
import { Background } from '../utils/Background.js';

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
        this.background = new Background(this.assets, this.canvas.width, this.canvas.height);
        this.transitionManager = new TransitionManager(this.canvas.width, this.canvas.height);

        // Will be instantiated dynamically by PlayState
        this.entityManager = null;

        // Initialize State Machine Dictionary
        this.states = {
            'LOAD': new LoadState(this),
            'START': new StartState(this),
            'PLAY': new PlayState(this)
        };
        this.currentState = null;
        
        // NOTE: Le GameManager n'écoute plus PLAYER_DEAD. 
        // C'est le PlayState qui gère sa propre séquence de mort avec GameOverOverlay.
    }

    // ============================================================================
    // 2. STATE MACHINE LOGIC
    // ============================================================================

    /**
     * Initiates a visual transition, then changes the state at the visual midpoint.
     */
    requestTransition(newStateKey, type = 'FADE', duration = 500, targetX = this.canvas.width / 2, targetY = this.canvas.height / 2) {
        // Prevent stacking transitions
        if (this.transitionManager.isActive) return;

        this.transitionManager.start(type, duration, () => {
            this.changeState(newStateKey);
        }, targetX, targetY);
    }

    /**
     * Handles the exact logic of swapping states.
     * Should generally be called via requestTransition now.
     */
    changeState(newStateKey) {
        if (this.currentState) {
            this.currentState.exit();
        }

        // Toujours remettre la vitesse normale au changement d'état
        this.timeScale = 1.0; 

        this.currentState = this.states[newStateKey];

        if (this.currentState) {
            this.currentState.enter();
        } else {
            console.error(`[GameManager] State '${newStateKey}' is undefined.`);
        }
    }

    start() {
        // First boot doesn't need a visual transition
        this.changeState('LOAD');
        requestAnimationFrame(this.loop.bind(this));
    }

    // ============================================================================
    // CORE GAME LOOP (TICK)
    // ============================================================================

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        
        // Séparation du temps réel et du temps de jeu (pour le slo-mo)
        const rawDt = timestamp - this.lastTime;
        const scaledDt = rawDt * this.timeScale;
        
        this.lastTime = timestamp;

        const pointer = this.inputManager.getPointer();

        // 1. Update and draw persistent background (Affected by slo-mo)
        if (this.background) {
            this.background.update(scaledDt);
            this.background.draw(this.ctx);
        }

        // 2. Delegate logic to the active state (Pass rawDt instead of scaledDt!)
        if (this.currentState) {
            this.currentState.update(rawDt, pointer);
            this.currentState.draw(this.ctx);
        }

        // 3. Update and draw transitions on top of everything else (Real time)
        this.transitionManager.update(rawDt);
        this.transitionManager.draw(this.ctx);

        requestAnimationFrame(this.loop.bind(this));
    }
}