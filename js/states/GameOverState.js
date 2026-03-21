// js/states/GameOverState.js
import { State } from './State.js';
import { Button } from '../Button.js';
import { UIConfig } from '../UIConfig.js';
import { GameConfig } from '../GameConfig.js';

export class GameOverState extends State {
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        this.startTime = performance.now();
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.maxFillRadius = Math.sqrt(this.gameManager.canvas.width ** 2 + this.gameManager.canvas.height ** 2);

        this.initUI();
    }

    initUI() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;

        const replayBtnY = height * UIConfig.SCREENS.GAMEOVER.REPLAY_BTN_Y_PERCENTAGE;

        this.replayButton = new Button(
            'REPLAY', 
            centerX - UIConfig.BUTTON_DEFAULTS.width / 2, 
            replayBtnY, 
            'restart', 
            () => this.startTransition()
        );
    }

    startTransition() {
        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
    }

    // Easing functions for juice
    easeOutBounce(x) {
        const n1 = 7.5625; const d1 = 2.75;
        if (x < 1 / d1) return n1 * x * x;
        else if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
        else if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
        else return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }

    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        // 1. Handle slow-motion effect on the background game
        this.gameManager.timeScale = Math.max(0, this.gameManager.timeScale - dt * 0.0005);
        
        if (this.gameManager.timeScale > 0 && dt < 100) {
            // Keep updating entities with shrinking timeScale
            this.gameManager.entityManager.update(dt * this.gameManager.timeScale, pointer.x);
        }

        // 2. Handle UI updates
        if (this.isTransitioning) return;

        const elapsed = performance.now() - this.startTime;
        if (elapsed > UIConfig.SCREENS.GAMEOVER.BUTTON_APPEAR_DELAY_MS) {
            this.replayButton.update(pointer.x, pointer.y, pointer.isDown);
            
            // Execute click action
            if (pointer.isDown && !this.wasPointerDown) {
                this.replayButton.handleClick(pointer.x, pointer.y);
            }
        }
        
        // Track pointer state for debouncing
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;

        // 1. Draw the frozen/slowing game world in the background
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        const elapsed = performance.now() - this.startTime;
        const anims = UIConfig.ANIMATIONS;
        const layout = UIConfig.SCREENS.GAMEOVER;

        // 2. Gradual Dark Fade
        const fadeProgress = Math.min(1, elapsed / anims.GAMEOVER_FADE_MS);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * fadeProgress})`;
        ctx.fillRect(0, 0, width, height);

        // 3. Bouncing Text
        const bounceProgress = Math.min(1, elapsed / anims.GAMEOVER_BOUNCE_MS);
        const bounceEase = this.easeOutBounce(bounceProgress);

        const targetTextY = height * 0.25;
        const startTextY = -200; 
        const currentTextY = startTextY + (targetTextY - startTextY) * bounceEase;

        ctx.fillStyle = layout.TEXT_COLOR;
        ctx.font = `bold 150px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(241, 196, 15, 0.5)';
        ctx.shadowBlur = 20 * bounceProgress; 
        ctx.fillText('GAME OVER', width / 2, currentTextY);
        ctx.shadowBlur = 0;

        // 4. Sliding Button
        if (elapsed > layout.BUTTON_APPEAR_DELAY_MS) {
            const btnElapsed = elapsed - layout.BUTTON_APPEAR_DELAY_MS;
            const btnProgress = Math.min(1, btnElapsed / anims.GAMEOVER_BTN_SLIDE_MS);
            const btnEase = this.easeOutCubic(btnProgress);

            const btnTargetY = height * layout.REPLAY_BTN_Y_PERCENTAGE;
            const btnStartY = btnTargetY + 50; 

            this.replayButton.baseY = btnStartY + (btnTargetY - btnStartY) * btnEase;

            ctx.globalAlpha = btnProgress;
            if (!this.isTransitioning || (performance.now() - this.transitionStartTime) < anims.CLICK_PAUSE_MS) {
                this.replayButton.draw(ctx);
            }
            ctx.globalAlpha = 1.0; 
        }

        // 5. Circular Outro Transition
        if (this.isTransitioning) {
            const transElapsed = performance.now() - this.transitionStartTime;
            const pauseMs = anims.CLICK_PAUSE_MS;
            const fillMs = anims.CLICK_FILL_DURATION_MS;

            if (transElapsed > pauseMs) {
                const fillTime = transElapsed - pauseMs;
                const progress = Math.min(1, fillTime / fillMs);
                const radius = this.maxFillRadius * (1 - progress);

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.rect(0, 0, width, height);
                ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.closePath();

                if (progress === 1) {
                    this.isTransitioning = false;
                    // Switch state back to playing
                    this.gameManager.changeState('PLAY'); 
                }
            }
        }
    }
}