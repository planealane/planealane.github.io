// js/entities/Enemy.js
import { GameConfig } from '../GameConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js'; // [NEW] Import visuals config
import { ShipsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { drawAlgorithmicTrail } from '../utils/VFXUtils.js';

export class Enemy extends SpriteEntity {
    constructor(x, y, image, maxHp, variantIndex = 0) {
        const safeIndex = ShipsAtlas.PLAYER_VARIANTS + (variantIndex % ShipsAtlas.ENEMY_VARIANTS);
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        // Enemies face downward (Math.PI). Uses visual config for size and z-index.
        super(x, y, EntityVisualsConfig.ENEMY.SIZE, EntityVisualsConfig.ENEMY.SIZE, image, frame, Math.PI, EntityVisualsConfig.Z_INDEX.ENEMY);
        
        this.speed = GameConfig.SCROLL_SPEED;

        // Juice: Breathing properties (idle animation)
        this.aliveTime = Math.random() * Math.PI * 2;
        this.breathingSpeed = 0.0015 + (Math.random() - 0.5) * 0.0005;
        this.breathingAmplitude = 0.02 + (Math.random() - 0.5) * 0.01;
        
        // Hit feedback properties
        this.currentScale = 1.0;
        this.hitScale = 1.0;
        this.hitFlashTimer = 0;
        this.hitFlashDuration = 60; // Flash duration in milliseconds

        this.hp = maxHp;
        this.maxHp = maxHp;
    }

    /**
     * Triggered by EntityManager when a projectile AABB intersects this enemy.
     */
    onHit() {
        // Visual Juice: instant shrink and white flash
        this.hitScale = 0.9; 
        this.hitFlashTimer = this.hitFlashDuration;

        // Broadcast hit sound
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'hit', volume: 0.5 });
    }

    update(dt) {
        this.aliveTime += dt;

        // Animate idle breathing
        this.currentScale = 1.0 + Math.cos(this.aliveTime * this.breathingSpeed) * this.breathingAmplitude;

        // Recover from hit scale smoothly
        if (this.hitScale < 1.0) {
            this.hitScale += (1.0 - this.hitScale) * 0.15; 
        }

        // Decrement flash timer
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        // Movement
        this.y += this.speed * dt;
        if (this.y > GameConfig.CANVAS.HEIGHT + 200) this.markForDeletion = true;
    }

    draw(ctx) {
        // Draw the trail behind the enemy
        drawAlgorithmicTrail(
            ctx, 
            this.x - this.width / 2, 
            this.y - this.height / 2, 
            this.width, 
            this.height, 
            performance.now(), 
            true
        );

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Combine base scale (breathing) and hit scale (shrinking)
        const finalScale = this.currentScale * this.hitScale;
        ctx.scale(finalScale, finalScale);

        // Apply white flash filter if the timer is active
        // brightness(0) makes visible pixels black, invert(1) turns them pure white
        if (this.hitFlashTimer > 0) {
            ctx.filter = 'brightness(0) invert(1)';
        }

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        // Reset filter
        if (this.hitFlashTimer > 0) {
            ctx.filter = 'none';
        }

        ctx.restore();

        // Draw HP text. Using standard offset calculation as there is no specific visual config yet.
        const textY = this.y - (this.height / 2) - 25;
        drawFloatingText(ctx, Math.ceil(this.hp).toString(), this.x, textY, '#e74c3c');
    }
}