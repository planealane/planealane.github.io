// js/ui/GameOverOverlay.js
import { Button } from './Button.js';
import { UIConfig } from '../UIConfig.js';
import { GameConfig } from '../GameConfig.js';

export class GameOverOverlay {

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isActive = false;
        this.buttons = [];
        this.startTime = 0;
        this.wasPointerDown = false;
    }

    start() {
        this.isActive = true;
        this.startTime = performance.now();
        this.initUI();
    }

    initUI() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;

        const btnWidth = Math.min(UIConfig.BUTTON_DEFAULTS.width * 1.4, width * 0.8);
        const btnHeight = UIConfig.BUTTON_DEFAULTS.height * 1.5;
        const btnFontSize = GameConfig.FONT_SIZE_MD * 1.2;

        const replayBtnY = height * UIConfig.SCREENS.GAMEOVER.REPLAY_BTN_Y_PERCENTAGE;
        const marginY = height * 0.05;
        const menuBtnY = replayBtnY + btnHeight + marginY;

        const replayButton = new Button(
            'REPLAY',
            centerX - btnWidth / 2,
            replayBtnY,
            'restart',
            () => this.triggerTransition('PLAY'),
            { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
        );
        replayButton.anchorY = replayBtnY;

        const menuButton = new Button(
            'MAIN MENU',
            centerX - btnWidth / 2,
            menuBtnY,
            'menu',
            () => this.triggerTransition('START'),
            { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
        );
        menuButton.anchorY = menuBtnY;

        this.buttons = [replayButton, menuButton];
    }

    triggerTransition(targetState) {
        // Empêche le spam clic si la transition est déjà lancée
        if (this.gameManager.transitionManager.isActive) return;

        // [CORRECTION CRITIQUE] Le code était en dehors du bloc de la fonction !
        const tx = this.gameManager.canvas.width / 2;
        const ty = this.gameManager.canvas.height / 2;
        
        // On force la fin du hit stop pour être sûr que le GameManager n'est pas bloqué
        this.gameManager.hitStopTimer = 0;
        
        this.gameManager.requestTransition(targetState, 'IRIS', 1000, tx, ty);
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
    // LOGIC & UPDATES
    // ============================================================================

    update(dt, pointer) {
        if (!this.isActive) return;

        // Freeze UI if Iris Wipe transition is running
        if (this.gameManager.transitionManager.isActive) return;

        const elapsed = performance.now() - this.startTime;
        const anims = UIConfig.ANIMATIONS;
        const layout = UIConfig.SCREENS.GAMEOVER;
        
        if (elapsed > layout.BUTTON_APPEAR_DELAY_MS) {
            const btnElapsed = elapsed - layout.BUTTON_APPEAR_DELAY_MS;
            // Ensure positive progress clamped between 0 and 1
            const btnProgress = Math.min(1, Math.max(0, btnElapsed / anims.GAMEOVER_BTN_SLIDE_MS));

            this.buttons.forEach((btn, index) => {
                // 1. Calculate animation and mutate physical state here (SOLID Principle)
                const staggerDelay = index * 0.15;
                let individualProgress = 0;

                if (btnProgress > staggerDelay) {
                    individualProgress = Math.min(1, (btnProgress - staggerDelay) / (1 - staggerDelay));
                }

                const btnEase = this.easeOutCubic(individualProgress);
                const btnStartY = btn.anchorY + 50;

                // Update physical position BEFORE calculating pointer collisions
                btn.baseY = btnStartY + (btn.anchorY - btnStartY) * btnEase;
                
                // Store alpha state for the draw loop
                btn.currentAlpha = individualProgress; 

                // 2. Update button interactions with fresh, accurate coordinates
                btn.update(pointer.x, pointer.y, pointer.isDown);
            });

            // Handle clicks after all states are strictly updated
            if (pointer.isDown && !this.wasPointerDown) {
                [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
            }
        }

        this.wasPointerDown = pointer.isDown;
    }

    // ============================================================================
    // RENDERING
    // ============================================================================

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const elapsed = performance.now() - this.startTime;
        const anims = UIConfig.ANIMATIONS;
        const layout = UIConfig.SCREENS.GAMEOVER;

        // 1. Gradual Dark Fade
        const fadeProgress = Math.min(1, Math.max(0, elapsed / anims.GAMEOVER_FADE_MS));
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * fadeProgress})`;
        ctx.fillRect(0, 0, width, height);

        // 2. Bouncing Text
        const bounceProgress = Math.min(1, Math.max(0, elapsed / anims.GAMEOVER_BOUNCE_MS));
        const bounceEase = this.easeOutBounce(bounceProgress);

        const targetTextY = height * 0.25;
        const startTextY = -200;
        const currentTextY = startTextY + (targetTextY - startTextY) * bounceEase;

        ctx.fillStyle = layout.TEXT_COLOR;
        ctx.font = `bold 150px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(241, 196, 15, 0.5)';
        ctx.shadowBlur = Math.max(0, 20 * bounceProgress);
        ctx.fillText('GAME OVER', width / 2, currentTextY);
        ctx.shadowBlur = 0;

        // 3. Sliding Buttons (Rendering Only)
        if (elapsed > layout.BUTTON_APPEAR_DELAY_MS) {
            if (!this.gameManager.transitionManager.isActive) {
                this.buttons.forEach((btn) => {
                    // Read state strictly prepared by update()
                    ctx.globalAlpha = btn.currentAlpha !== undefined ? btn.currentAlpha : 1.0;
                    btn.draw(ctx);
                    ctx.globalAlpha = 1.0;
                });
            }
        }
    }
}