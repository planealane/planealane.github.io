// js/Enemy.js
import { GameConfig } from './GameConfig.js';
import { ShipsAtlas } from './Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from './EventBus.js';

export class Enemy extends SpriteEntity {
    constructor(x, y, image, maxHp, variantIndex = 0) {
        const safeIndex = ShipsAtlas.PLAYER_VARIANTS + (variantIndex % ShipsAtlas.ENEMY_VARIANTS);
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        // Enemies face downward (Math.PI)
        super(x, y, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, Math.PI, 20);
        
        this.speed = GameConfig.SCROLL_SPEED;

        // Juice: Breathing properties (idle animation)
        this.aliveTime = Math.random() * Math.PI * 2;
        this.breathingSpeed = 0.0015 + (Math.random() - 0.5) * 0.0005;
        this.breathingAmplitude = 0.02 + (Math.random() - 0.5) * 0.01;
        this.currentScale = 1.0;
        this.hitScale = 1.0;

        this.hp = maxHp;
        this.maxHp = maxHp;
    }

    /**
     * Triggered by EntityManager when a projectile AABB intersects this enemy.
     */
    onHit() {
        // Visual Juice: instant shrink
        this.hitScale = 0.9; 

        // [EVENT] Broadcast hit sound
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

        // Movement
        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 200) this.markForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Combine base scale (breathing) and hit scale (shrinking)
        const finalScale = this.currentScale * this.hitScale;
        ctx.scale(finalScale, finalScale);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();

        const textY = this.y - (this.height / 2) - 25;
        drawFloatingText(ctx, Math.ceil(this.hp).toString(), this.x, textY, '#e74c3c');
    }
}