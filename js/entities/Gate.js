// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';

export class Gate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 140; 
        this.height = 60;
        
        // CRITICAL: Speed must match enemies to maintain block formation
        this.speed = GameConfig.SCROLL_SPEED; 
        
        this.markForDeletion = false;

        // Randomize the stat this specific gate will grant
        this.bonusType = Math.random() > 0.5 ? 'FIRE_RATE' : 'DAMAGE';
        this.bonusValue = this.bonusType === 'FIRE_RATE' ? 10 : 1; 
    }

    update(dt) {
        // Move downwards along with the wave
        this.y += this.speed * dt;

        // Cleanup if the player avoids all gates
        if (this.y > GameConfig.GAME_HEIGHT + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Temporary visuals: transparent green box
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Display the bonus text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = this.bonusType === 'FIRE_RATE' ? `+${this.bonusValue}% RATE` : `+${this.bonusValue} DMG`;
        ctx.fillText(text, 0, 0);
        
        ctx.restore();
    }

    /**
     * Applies the gate's specific modifier to the player entity.
     */
    applyBonus(player) {
        if (this.bonusType === 'FIRE_RATE') {
            // Assuming lower fireRate means faster shooting (cooldown reduction)
            player.stats.fireRate *= (1 - (this.bonusValue / 100)); 
        } else {
            player.stats.damage += this.bonusValue;
        }
    }
}