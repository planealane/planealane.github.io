// js/ui/GameOverOverlay.js
import { Button } from './Button.js';
import { UIConfig } from '../UIConfig.js';
// 🗑️ GameConfig supprimé : 100% de l'UI est maintenant gérée par UIConfig !

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
        const config = UIConfig.SCREENS.GAMEOVER;
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;

        const btnWidth = Math.min(UIConfig.BUTTONS.DEFAULTS.width * config.LAYOUT.BTN_WIDTH_MULT, width * config.LAYOUT.BTN_MAX_WIDTH_PCT);
        const btnHeight = UIConfig.BUTTONS.DEFAULTS.height * config.LAYOUT.BTN_HEIGHT_MULT;
        const btnFontSize = UIConfig.TYPOGRAPHY.SIZE_MD * 1.2; 

        const replayBtnY = height * config.REPLAY_BTN_Y_PERCENTAGE;
        const marginY = height * config.LAYOUT.BTN_MARGIN_Y_PCT;
        const menuBtnY = replayBtnY + btnHeight + marginY;

        const replayButton = new Button(
            config.TEXT.REPLAY,
            centerX - btnWidth / 2,
            replayBtnY,
            'restart',
            () => this.triggerTransition('PLAY'),
            { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
        );
        replayButton.anchorY = replayBtnY;

        const menuButton = new Button(
            config.TEXT.MENU,
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
        if (this.gameManager.transitionManager.isActive) return;

        const tx = this.gameManager.canvas.width / 2;
        const ty = this.gameManager.canvas.height / 2;
        const config = UIConfig.SCREENS.GAMEOVER.TRANSITIONS;
        
        this.gameManager.hitStopTimer = 0;
        
        this.gameManager.requestTransition(targetState, config.TYPE, config.DURATION_MS, tx, ty);
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
        if (this.gameManager.transitionManager.isActive) return;

        const elapsed = performance.now() - this.startTime;
        const config = UIConfig.SCREENS.GAMEOVER;
        
        if (elapsed > config.BUTTON_APPEAR_DELAY_MS) {
            const btnElapsed = elapsed - config.BUTTON_APPEAR_DELAY_MS;
            const btnProgress = Math.min(1, Math.max(0, btnElapsed / config.BTN_SLIDE_MS));

            this.buttons.forEach((btn, index) => {
                const staggerDelay = index * config.TRANSITIONS.STAGGER_DELAY;
                let individualProgress = 0;

                if (btnProgress > staggerDelay) {
                    individualProgress = Math.min(1, (btnProgress - staggerDelay) / (1 - staggerDelay));
                }

                const btnEase = this.easeOutCubic(individualProgress);
                const btnStartY = btn.anchorY + config.LAYOUT.BTN_START_Y_OFFSET;

                btn.baseY = btnStartY + (btn.anchorY - btnStartY) * btnEase;
                btn.currentAlpha = individualProgress; 

                btn.update(pointer.x, pointer.y, pointer.isDown);
            });

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
        const config = UIConfig.SCREENS.GAMEOVER;

        // 1. Gradual Dark Fade
        const fadeProgress = Math.min(1, Math.max(0, elapsed / config.FADE_MS));
        ctx.globalAlpha = fadeProgress;
        ctx.fillStyle = config.COLORS.OVERLAY; 
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1.0; // Reset alpha

        // 2. Bouncing Text
        const bounceProgress = Math.min(1, Math.max(0, elapsed / config.BOUNCE_MS));
        const bounceEase = this.easeOutBounce(bounceProgress);

        const targetTextY = height * config.LAYOUT.TITLE_Y_PCT;
        const startTextY = config.LAYOUT.TITLE_START_Y;
        const currentTextY = startTextY + (targetTextY - startTextY) * bounceEase;

        ctx.fillStyle = config.COLORS.TITLE;
        // Utilisation de la typographie globale !
        ctx.font = `bold ${config.LAYOUT.TITLE_FONT_SIZE}px ${UIConfig.TYPOGRAPHY.FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = config.COLORS.TITLE_SHADOW;
        ctx.shadowBlur = Math.max(0, config.LAYOUT.TITLE_SHADOW_BLUR * bounceProgress);
        ctx.fillText(config.TEXT.TITLE, width / 2, currentTextY);
        ctx.shadowBlur = 0;

        // 3. Sliding Buttons
        if (elapsed > config.BUTTON_APPEAR_DELAY_MS) {
            if (!this.gameManager.transitionManager.isActive) {
                this.buttons.forEach((btn) => {
                    ctx.globalAlpha = btn.currentAlpha !== undefined ? btn.currentAlpha : 1.0;
                    btn.draw(ctx);
                    ctx.globalAlpha = 1.0;
                });
            }
        }
    }
}