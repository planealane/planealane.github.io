// js/Collectible.js
import { GameConfig } from './GameConfig.js';
import { PropsAtlas } from './Atlas.js';
import { BonusEffects } from './Effects.js';
import { SpriteEntity } from './Entity.js';

export class Collectible extends SpriteEntity {
    constructor(x, y, image, type, value) {
        const frame = PropsAtlas.bonus;
        const itemSize = GameConfig.SHIP_SIZE / 2;

        super(x, y, itemSize, itemSize, image, frame, 0, 15);
        
        this.type = type;
        this.value = value;
        this.effectDef = BonusEffects[this.type];
        
        this.speed = GameConfig.SCROLL_SPEED;
        this.aliveTime = 0;
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        
        // I-frames to prevent accidental immediate pickup upon spawning
        this.pickupDelay = 300; 
    }

    update(dt) {
        this.aliveTime += dt;

        if (this.pickupDelay > 0) {
            this.pickupDelay -= dt;
        }

        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 100) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        // Calculate vertical offset using Sine wave
        const floatOffset = Math.sin(this.aliveTime * this.floatSpeed) * this.floatAmplitude;

        // Temporarily shift physical Y for the sprite render
        const originalY = this.y;
        this.y += floatOffset;

        super.draw(ctx);

        // Restore actual Y position immediately
        this.y = originalY;

        ctx.save();
        ctx.translate(this.x, this.y);

        const fontSize = GameConfig.FONT_SIZE_MD;
        const textY = -this.height / 2 - (fontSize / 2);

        ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = fontSize * 0.1;
        ctx.strokeText(`+${this.value}`, 0, textY);

        ctx.fillStyle = this.effectDef.color;
        ctx.fillText(`+${this.value}`, 0, textY);

        ctx.restore();
    }
}