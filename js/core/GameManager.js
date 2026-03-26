// js/core/GameManager.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js'; // [NEW] Added UIConfig import
import { InputManager } from '../managers/InputManager.js';
import { TransitionManager } from '../managers/TransitionManager.js';
import { LoadState } from '../states/LoadState.js';
import { StartState } from '../states/StartState.js';
import { PlayState } from '../states/PlayState.js';
import { Background } from '../utils/Background.js';
import { gameEvents, EVENTS } from './EventBus.js';

export class GameManager {

    // ============================================================================
    // 1. CONSTRUCTOR & DEPENDENCY INJECTION
    // ============================================================================

    constructor(canvasId, assets, audioManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.assets = assets;
        this.audioManager = audioManager;

        // [FIXED] Using UIConfig instead of GameConfig for canvas dimensions
        this.canvas.width = GameConfig.CANVAS.WIDTH;
        this.canvas.height = GameConfig.CANVAS.HEIGHT;
        this.ctx.imageSmoothingEnabled = false; // Essential for pixel art aesthetics

        // --- Time Management (Fixed Timestep) ---
        this.lastTime = 0;
        this.timeScale = 1.0;
        this.accumulator = 0;
        this.FIXED_TIME_STEP = 1000 / 60; // ~16.66ms per logic tick (target 60fps)
        this.MAX_FRAME_TIME = 250; // Cap to prevent death spiral on tab resume

        // --- Hit Stop State ---
        this.hitStopTimer = 0;
        gameEvents.on(EVENTS.HIT_STOP, (duration) => {
            // Only override if the new freeze is longer than the remaining one
            if (duration > this.hitStopTimer) {
                this.hitStopTimer = duration;
            }
        });

        this.inputManager = new InputManager(this.canvas);
        
        // Background requires explicit width/height parameters
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
        
        // NOTE: The GameManager no longer listens to PLAYER_DEAD. 
        // The PlayState handles its own death sequence via GameOverOverlay.
    }

    // ============================================================================
    // 2. STATE MACHINE LOGIC
    // ============================================================================

    /**
     * Initiates a visual transition, then changes the state at the visual midpoint.
     * @param {string} newStateKey - The dictionary key of the target state
     * @param {string} type - Transition type (e.g., 'FADE', 'IRIS')
     * @param {number} duration - Total duration of the transition in ms
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
     * Should generally be called via requestTransition now to ensure visual smoothness.
     * @param {string} newStateKey - The dictionary key of the target state
     */
    changeState(newStateKey) {
        if (this.currentState) {
            this.currentState.exit();
        }

        // Always reset time scale and hit stops when changing states
        this.timeScale = 1.0; 
        this.hitStopTimer = 0; 

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
        // Initialize lastTime on the very first frame
        if (!this.lastTime) this.lastTime = timestamp;
        
        let rawDt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 1. Prevent "Spiral of Death" if the user switches browser tabs
        if (rawDt > this.MAX_FRAME_TIME) {
            rawDt = this.MAX_FRAME_TIME;
        }

        // ==========================================
        // TIME FREEZE (HIT STOP)
        // ==========================================
        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= rawDt;
            
            // Keep drawing the frozen frame to prevent visual flickering
            if (this.background) this.background.draw(this.ctx);
            if (this.currentState) this.currentState.draw(this.ctx);
            this.transitionManager.draw(this.ctx);
            
            requestAnimationFrame(this.loop.bind(this));
            return; // Skip all physics and logic updates this frame
        }

        // ==========================================
        // NORMAL LOOP
        // ==========================================
        const scaledDt = rawDt * this.timeScale;
        this.accumulator += scaledDt;

        const pointer = this.inputManager.getPointer();

        // 2. UPDATE LOGIC (Fixed Timestep Integration)
        // Consume the accumulator in discrete, predictable chunks
        while (this.accumulator >= this.FIXED_TIME_STEP) {
            if (this.background) {
                this.background.update(this.FIXED_TIME_STEP);
            }

            if (this.currentState) {
                // Pass the fixed timestep to the state logic ensuring deterministic behavior
                this.currentState.update(this.FIXED_TIME_STEP, pointer);
            }

            this.accumulator -= this.FIXED_TIME_STEP;
        }

        // 3. VISUAL LOGIC & UI (Variable Timestep)
        // Transitions are purely visual, they use raw real-time to remain perfectly smooth
        this.transitionManager.update(rawDt);

        // 4. RENDER (Once per frame)
        if (this.background) {
            this.background.draw(this.ctx);
        }

        if (this.currentState) {
            this.currentState.draw(this.ctx);
        }

        // The transition overlay is drawn last so it sits on top of everything
        this.transitionManager.draw(this.ctx);

        // Loop recursively
        requestAnimationFrame(this.loop.bind(this));
    }
}