// js/ui/GameOverOverlay.js
import { Button } from './Button.js';
import { UIConfig } from './UIConfig.js';
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

        // On délègue l'effet circulaire au TransitionManager !
        const tx = this.gameManager.canvas.width / 2;
        const ty = this.gameManager.canvas.height / 2;
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
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        if (!this.isActive) return;

        // On gèle l'UI si l'Iris Wipe est en cours
        if (this.gameManager.transitionManager.isActive) return;

        const elapsed = performance.now() - this.startTime;
        if (elapsed > UIConfig.SCREENS.GAMEOVER.BUTTON_APPEAR_DELAY_MS) {
            this.buttons.forEach(btn => btn.update(pointer.x, pointer.y, pointer.isDown));

            if (pointer.isDown && !this.wasPointerDown) {
                [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
            }
        }

        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const elapsed = performance.now() - this.startTime;
        const anims = UIConfig.ANIMATIONS;
        const layout = UIConfig.SCREENS.GAMEOVER;

        // 1. Gradual Dark Fade (sur l'écran de jeu dessiné par PlayState en dessous)
        const fadeProgress = Math.min(1, elapsed / anims.GAMEOVER_FADE_MS);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * fadeProgress})`;
        ctx.fillRect(0, 0, width, height);

        // 2. Bouncing Text
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

        // 3. Sliding Buttons (with a slight stagger effect for juice)
        if (elapsed > layout.BUTTON_APPEAR_DELAY_MS) {
            const btnElapsed = elapsed - layout.BUTTON_APPEAR_DELAY_MS;
            const btnProgress = Math.min(1, btnElapsed / anims.GAMEOVER_BTN_SLIDE_MS);

            if (!this.gameManager.transitionManager.isActive) {
                this.buttons.forEach((btn, index) => {
                    const staggerDelay = index * 0.15;
                    let individualProgress = 0;

                    if (btnProgress > staggerDelay) {
                        individualProgress = Math.min(1, (btnProgress - staggerDelay) / (1 - staggerDelay));
                    }

                    const btnEase = this.easeOutCubic(individualProgress);
                    const btnStartY = btn.anchorY + 50;

                    btn.baseY = btnStartY + (btn.anchorY - btnStartY) * btnEase;

                    ctx.globalAlpha = individualProgress;
                    btn.draw(ctx);
                });
                ctx.globalAlpha = 1.0;
            }
        }
    }
}