// js/UIManager.js
import { GameConfig } from './GameConfig.js';
import { UIConfig } from './UIConfig.js';
import { Button } from './Button.js';

export class UIManager {
    constructor(canvasWidth, canvasHeight, onPlay, onReplay) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.onPlay = onPlay;
        this.onReplay = onReplay;

        this.isTransitioning = false;
        this.transitionStartTime = 0;
        
        this.isOpening = false;
        this.openingStartTime = 0;

        // New: Game Over sequence tracking
        this.gameOverStartTime = 0;

        this.maxFillRadius = Math.sqrt(this.width ** 2 + this.height ** 2);

        this.initButtons();
    }

    initButtons() {
        const btnWidth = 400; 
        const btnHeight = GameConfig.FONT_SIZE_MD + 40;
        const btnX = this.width / 2 - btnWidth / 2;

        this.startButton = new Button('PLAY', btnX, this.height / 2, btnWidth, btnHeight, 'start', () => this.onPlay());

        // Button base Y is set dynamically during the slide animation
        this.replayButton = new Button('REPLAY', btnX, this.height * 0.60, btnWidth, btnHeight, 'restart', () => this.startTransition());
    }

    startOpening() {
        this.isOpening = true;
        this.openingStartTime = performance.now();
    }

    startTransition() {
        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
    }

    // New: Triggered by GameManager when player dies
    startGameOver() {
        this.gameOverStartTime = performance.now();
        // Reset button state
        this.replayButton.isHovered = false; 
        this.replayButton.isPressed = false;
    }

    // Easing functions for juice
    easeOutBounce(x) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) return n1 * x * x;
        else if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
        else if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
        else return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }

    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    update(mouseX, mouseY, isMouseDown, currentState) {
        if (this.isTransitioning) return;

        if (currentState === GameConfig.STATES.START) {
            this.startButton.update(mouseX, mouseY, isMouseDown);
        } else if (currentState === GameConfig.STATES.GAMEOVER) {
            // Only interact if button is fully visible
            const elapsed = performance.now() - this.gameOverStartTime;
            if (elapsed > UIConfig.GO_BTN_DELAY_MS) {
                this.replayButton.update(mouseX, mouseY, isMouseDown);
            }
        }
    }

    handleClick(mouseX, mouseY, currentState) {
        if (this.isTransitioning) return;

        if (currentState === GameConfig.STATES.START) {
            this.startButton.handleClick(mouseX, mouseY);
        } else if (currentState === GameConfig.STATES.GAMEOVER) {
            const elapsed = performance.now() - this.gameOverStartTime;
            if (elapsed > UIConfig.GO_BTN_DELAY_MS) {
                this.replayButton.handleClick(mouseX, mouseY);
            }
        }
    }

    drawStartScreen(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        this.startButton.draw(ctx);
    }

    drawOpeningTransition(ctx) {
        if (!this.isOpening) return;

        const elapsed = performance.now() - this.openingStartTime;
        const progress = Math.min(1, elapsed / UIConfig.ANIM_OPEN_DURATION_MS);
        const radius = this.maxFillRadius * progress;

        ctx.fillStyle = UIConfig.ANIM_FILL_CIRCLE_COLOR;
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        if (progress === 1) this.isOpening = false;
    }

    drawGameOverScreen(ctx) {
        const elapsed = performance.now() - this.gameOverStartTime;

        // 1. Gradual Fade to Dark
        const fadeProgress = Math.min(1, elapsed / UIConfig.GO_FADE_DURATION_MS);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * fadeProgress})`;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Bouncing "GAME OVER" Text
        const bounceProgress = Math.min(1, elapsed / UIConfig.GO_BOUNCE_DURATION_MS);
        const bounceEase = this.easeOutBounce(bounceProgress);
        
        const targetTextY = this.height * 0.25;
        const startTextY = -200; // Start off-screen
        const currentTextY = startTextY + (targetTextY - startTextY) * bounceEase;

        ctx.fillStyle = UIConfig.COLOR_TEXT_GAMEOVER;
        ctx.font = `bold 150px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(241, 196, 15, 0.5)';
        ctx.shadowBlur = 20 * bounceProgress; // Glow appears as it falls
        ctx.fillText('GAME OVER', this.width / 2, currentTextY);
        ctx.shadowBlur = 0;

        // 3. Sliding "REPLAY" Button
        if (elapsed > UIConfig.GO_BTN_DELAY_MS) {
            const btnElapsed = elapsed - UIConfig.GO_BTN_DELAY_MS;
            const btnProgress = Math.min(1, btnElapsed / UIConfig.GO_BTN_SLIDE_MS);
            const btnEase = this.easeOutCubic(btnProgress);

            const btnTargetY = this.height * 0.60;
            const btnStartY = btnTargetY + 50; // Slide up from 50px below

            // Apply calculated Y to button before drawing
            this.replayButton.baseY = btnStartY + (btnTargetY - btnStartY) * btnEase;

            // Fade in button
            ctx.globalAlpha = btnProgress;
            
            if (!this.isTransitioning || (performance.now() - this.transitionStartTime) < UIConfig.ANIM_CLICK_PAUSE_MS) {
                this.replayButton.draw(ctx);
            }
            ctx.globalAlpha = 1.0; // Reset alpha
        }

        // 4. Circular Outro Transition (if clicked)
        if (this.isTransitioning) {
            const transElapsed = performance.now() - this.transitionStartTime;
            if (transElapsed > UIConfig.ANIM_CLICK_PAUSE_MS) {
                const fillTime = transElapsed - UIConfig.ANIM_CLICK_PAUSE_MS;
                const progress = Math.min(1, fillTime / UIConfig.ANIM_CLICK_FILL_DURATION_MS);
                const radius = this.maxFillRadius * (1 - progress);

                ctx.fillStyle = UIConfig.ANIM_FILL_CIRCLE_COLOR;
                ctx.beginPath();
                ctx.rect(0, 0, this.width, this.height);
                ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.closePath();

                if (progress === 1) {
                    this.isTransitioning = false;
                    this.onReplay();
                }
            }
        }
    }
}