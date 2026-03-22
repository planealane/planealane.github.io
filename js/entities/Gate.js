// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity } from './Entity.js';

export class Gate extends SpriteEntity {
    constructor(x, y, image) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // Target physical width driven by GameConfig
        const targetWidth = GameConfig.GATE_BASE_WIDTH; 
        
        // Calculate height dynamically to lock the aspect ratio
        const targetHeight = targetWidth * (image.height / image.width);

        super(x, y, targetWidth, targetHeight, image, frame, 0, 0);
        
        this.speed = GameConfig.SCROLL_SPEED; 

        // Randomize the stat this specific gate will grant
        this.bonusType = Math.random() > 0.5 ? 'FIRE_RATE' : 'DAMAGE';
        this.bonusValue = this.bonusType === 'FIRE_RATE' ? 10 : 1; 

        this.pulseTime = 0;
    }

    update(dt) {
        this.y += this.speed * dt;
        this.pulseTime += dt * 0.005;

        if (this.y > GameConfig.GAME_HEIGHT + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Pulse scale
        const scale = 1.0 + (Math.sin(this.pulseTime) * 0.05);
        ctx.scale(scale, scale);

        // 1. Draw the Gate Sprite
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        // 2. Display the bonus text
        ctx.fillStyle = this.bonusType === 'FIRE_RATE' ? '#00e5ff' : '#ff4757';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.font = `bold ${GameConfig.FONT_SIZE_SM || 20}px ${GameConfig.FONT_FAMILY || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = this.bonusType === 'FIRE_RATE' ? `+${this.bonusValue}% RATE` : `+${this.bonusValue} DMG`;
        
        // Slightly offset the text upwards if your gate has a specific visual center
        ctx.fillText(text, 0, -10); 
        
        ctx.restore();
    }

    applyBonus(player) {
        if (this.bonusType === 'FIRE_RATE') {
            const minFireRate = 50; 
            player.stats.fireRate = Math.max(minFireRate, player.stats.fireRate * (1 - (this.bonusValue / 100))); 
        } else {
            player.stats.damage += this.bonusValue;
        }
    }
}