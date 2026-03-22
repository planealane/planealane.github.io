// js/managers/TransitionManager.js

export class TransitionManager {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        this.isActive = false;
        this.type = 'FADE'; // 'FADE' or 'IRIS'
        this.phase = 'IDLE'; // 'IDLE', 'OUT' (covering screen), 'IN' (revealing screen)
        
        this.progress = 0;
        this.duration = 500;
        this.onMidpoint = null; 
        
        // Iris specific coordinates
        this.targetX = this.width / 2;
        this.targetY = this.height / 2;
        this.maxRadius = Math.hypot(this.width, this.height);
    }

    /**
     * Starts a new visual transition.
     * @param {string} type - 'FADE' or 'IRIS'
     * @param {number} duration - Total duration in ms
     * @param {Function} onMidpoint - Callback executed when screen is fully obscured
     * @param {number} targetX - X coordinate for Iris center
     * @param {number} targetY - Y coordinate for Iris center
     */
    start(type = 'FADE', duration = 500, onMidpoint = null, targetX = this.width / 2, targetY = this.height / 2) {
        if (this.isActive) return; // Prevent overlapping transitions

        this.type = type;
        this.duration = duration;
        this.onMidpoint = onMidpoint;
        this.targetX = targetX;
        this.targetY = targetY;
        
        this.isActive = true;
        this.phase = 'OUT';
        this.progress = 0;
    }

    update(dt) {
        if (!this.isActive) return;

        // Progress goes from 0.0 to 1.0 twice (once for OUT, once for IN)
        // Divide duration by 2 so each phase takes half the total time
        this.progress += dt / (this.duration / 2); 

        if (this.progress >= 1.0) {
            this.progress = 1.0;
            
            if (this.phase === 'OUT') {
                this.phase = 'IN';
                this.progress = 0;
                
                // Execute state change while screen is fully black
                if (this.onMidpoint) {
                    this.onMidpoint();
                    this.onMidpoint = null;
                }
            } else if (this.phase === 'IN') {
                this.isActive = false;
                this.phase = 'IDLE';
            }
        }
    }

    draw(ctx) {
        if (!this.isActive) return;

        ctx.save();
        ctx.fillStyle = '#000000';

        // Calculate transition ratio (0 = fully visible game, 1 = fully black screen)
        const t = this.phase === 'OUT' ? this.progress : 1 - this.progress;
        
        // Simple cubic easing for smoother Iris animation
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        if (this.type === 'FADE') {
            ctx.globalAlpha = t;
            ctx.fillRect(0, 0, this.width, this.height);
        } 
        else if (this.type === 'IRIS') {
            const currentRadius = this.maxRadius * (1 - ease);
            
            ctx.beginPath();
            // Draw outer rectangle clockwise
            ctx.rect(0, 0, this.width, this.height);
            // Draw inner circle counter-clockwise to create a cutout mask
            ctx.arc(this.targetX, this.targetY, Math.max(0, currentRadius), 0, Math.PI * 2, true);
            ctx.fill();
        }

        ctx.restore();
    }
}