// js/entities/Boss.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class Boss extends SpriteEntity {
    constructor(x, y, image, maxHp, bossDef) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // 1. Calculate base dimensions using the logical game configuration
        const baseWidth = bossDef.width || GameConfig.BOSS_BASE_WIDTH; 
        const baseHeight = baseWidth * (image.height / image.width);

        // 2. Apply scale to LOGICAL dimensions so the physics engine reads them correctly
        const scale = bossDef.scale || 1.0;
        const physicalWidth = baseWidth * scale;
        const physicalHeight = baseHeight * scale;

        // Initialize SpriteEntity with the correct Z-Index layer
        super(x, y, physicalWidth, physicalHeight, image, frame, Math.PI, GameConfig.Z_INDEX.BOSS);

        this.speed = GameConfig.SCROLL_SPEED;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.isBoss = true;
        
        // 3. CRUCIAL: Identify the entity for the collision manager
        // Add the tags your EntityManager typically looks for
        this.isEnemy = true; 
        this.type = 'enemy'; 
        
        // The animation "Juice" scale starts at 1.0 because the physical size is already scaled
        this.baseScale = 1.0;
        this.currentScale = this.baseScale;
    }

    onHit() {
        // Juice effect: slight shrink on impact
        this.currentScale = this.baseScale * 0.95; 
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'hit', volume: 0.8 });
    }

    update(dt) {
        // Smooth return to normal size (Lerp)
        if (this.currentScale < this.baseScale) {
            this.currentScale += (this.baseScale - this.currentScale) * 0.1;
        }

        // Move downward
        this.y += this.speed * dt;
        
        // [CRITICAL FIX] Use GAME_HEIGHT to properly despawn the boss if it leaves the screen
        if (this.y > GameConfig.GAME_HEIGHT + 300) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Apply the animation scale (close to 1.0)
        ctx.scale(this.currentScale, this.currentScale);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();

        // Render HP above the boss
        const textY = this.y - (this.height / 2) - 40;
        drawFloatingText(ctx, Math.ceil(this.hp).toString(), this.x, textY, '#8e44ad');
    }
}