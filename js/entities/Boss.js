// js/entities/Boss.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class Boss extends SpriteEntity {
    constructor(x, y, image, maxHp, bossDef) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        super(x, y, 640, 240, image, frame, Math.PI, 10);

        this.speed = GameConfig.SCROLL_SPEED;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.isBoss = true;
        
        // Store base scale to compute the hit animation properly
        this.baseScale = bossDef.scale || 1.0;
        this.currentScale = this.baseScale;
    }

    onHit() {
        // Shrink slightly relative to the base scale
        this.currentScale = this.baseScale * 0.95; 
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'hit', volume: 0.8 });
    }

    update(dt) {
        // Smoothly recover to base scale
        if (this.currentScale < this.baseScale) {
            this.currentScale += (this.baseScale - this.currentScale) * 0.1;
        }

        this.y += this.speed * dt;
        
        if (this.y > GameConfig.GAME_HEIGHT + 300) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Apply dynamic scale
        ctx.scale(this.currentScale, this.currentScale);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();

        // Render HP
        // Text position scales dynamically with the boss size
        const textY = this.y - ((this.height * this.baseScale) / 2) - 40;
        drawFloatingText(ctx, Math.ceil(this.hp).toString(), this.x, textY, '#8e44ad');
    }
}