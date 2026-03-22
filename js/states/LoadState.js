// js/states/LoadState.js
import { State } from './State.js';
import { GameConfig } from '../GameConfig.js';

export class LoadState extends State {
    constructor(gameManager) {
        super(gameManager);
        
        this.phase = 'LOADING'; 
        this.fakeLoadTimer = 0;
        this.fakeLoadDuration = 1500; // 1.5 seconds delay
    }

    enter() {
        this.phase = 'LOADING';
        this.fakeLoadTimer = 0;
    }

    update(dt, pointer) {
        if (this.phase === 'LOADING') {
            this.fakeLoadTimer += dt;
            if (this.fakeLoadTimer >= this.fakeLoadDuration) {
                this.phase = 'READY';
            }
            return; 
        }

        if (this.phase === 'READY') {
            if (pointer.isDown) {
                // Unlock audio and transition to the actual main menu
                this.gameManager.audioManager.playMusic('title-theme', 0.5, 1000);
                this.gameManager.requestTransition('START', 'FADE', 500);            }
        }
    }

    draw(ctx) {
        const centerX = this.gameManager.canvas.width / 2;
        const centerY = this.gameManager.canvas.height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.phase === 'LOADING') {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${GameConfig.FONT_SIZE_SM}px ${GameConfig.FONT_FAMILY}`;
            ctx.fillText('LOADING SYSTEM...', centerX, centerY - 60);

            // Draw loading bar background
            const barWidth = 400;
            const barHeight = 30;
            const barX = centerX - barWidth / 2;
            const barY = centerY + 20;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Draw loading bar foreground (progress)
            const progress = Math.min(this.fakeLoadTimer / this.fakeLoadDuration, 1);
            ctx.fillStyle = '#2ecc71'; 
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);

            // Draw loading bar border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

        } else if (this.phase === 'READY') {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${GameConfig.FONT_SIZE_MD}px ${GameConfig.FONT_FAMILY}`;
            ctx.fillText('LOADING FINISHED', centerX, centerY - 40);

            // Pulsing effect for the prompt
            const alpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = `${GameConfig.FONT_SIZE_SM}px ${GameConfig.FONT_FAMILY}`;
            ctx.fillText('TAP TO START', centerX, centerY + 60);
        }
    }
}