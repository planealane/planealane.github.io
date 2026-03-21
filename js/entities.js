// js/Entities.js
import { GameConfig } from './GameConfig.js';
import { PropsAtlas, ShipsAtlas } from './Atlas.js';
import { BonusEffects } from './Effects.js';
import { gameEvents, EVENTS } from './EventBus.js'; // Integration de l'EventBus

// ============================================================================
// 1. UTILITIES & HELPERS
// ============================================================================

/**
 * Draws text with a black outline for better readability against varied backgrounds.
 * Used for HP bars, damage numbers, and loot values.
 */
function drawFloatingText(ctx, text, x, y, color, fontSize = GameConfig.FONT_SIZE_MD) {
    ctx.save();

    ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.1;
    ctx.strokeText(text, x, y);

    // Inner text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
}

// ============================================================================
// 2. BASE CLASSES (ARCHITECTURE)
// ============================================================================

/**
 * Absolute base class for anything that exists in the game world.
 * Handles pure logical coordinates, dimensions, and lifecycle state.
 */
export class Entity {
    constructor(x, y, width, height, angle = 0, zIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle;
        this.zIndex = zIndex;
        
        // When true, the EntityManager will delete this object on the next frame
        this.markForDeletion = false; 
    }
}

/**
 * Base class for entities that render a portion of a spritesheet (Atlas).
 */
export class SpriteEntity extends Entity {
    constructor(x, y, width, height, image, frame, angle = 0, zIndex = 0) {
        super(x, y, width, height, angle, zIndex);
        this.image = image;
        this.frame = frame; // Expected format: {sx, sy, sWidth, sHeight}
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();
    }
}

// ============================================================================
// 3. ACTORS (PLAYER & ENEMIES)
// ============================================================================

export class Player extends SpriteEntity {
    constructor(image, variantIndex = GameConfig.PLAYER_BASE_VARIANT) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        super(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT - 300, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, 0, 10);

        this.currentVariant = safeIndex;

        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP,
            damage: GameConfig.PLAYER_BASE_DMG,
            shootInterval: 1000,
            projectileCount: 1
        };
        
        this.shootTimer = 0;
        
        // Physics for visual banking (tilting) when moving horizontally
        this.targetAngle = 0;
        this.maxTilt = 0.35;
        this.tiltResponsiveness = 0.15;
    }

    setVariant(newVariantIndex) {
        this.currentVariant = newVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
        this.frame = ShipsAtlas.getFrame(this.currentVariant, this.image.width, this.image.height);
    }

    update(dt, pointerX, entityManager) {
        // 1. Constrain to screen bounds
        const minX = GameConfig.MARGIN_X + (this.width / 2);
        const maxX = GameConfig.GAME_WIDTH - GameConfig.MARGIN_X - (this.width / 2);

        // 2. Calculate movement for visual tilt
        const dx = pointerX - this.x;
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        if (pointerX <= minX || pointerX >= maxX) {
            this.targetAngle = 0; // Flatten ship at edges
        }

        // 3. Apply physics
        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;
        this.x = Math.max(minX, Math.min(maxX, pointerX));

        // 4. Handle Combat (Shooting)
        this.shootTimer += dt;
        if (this.shootTimer >= this.stats.shootInterval) {
            this.shootTimer = 0;
            this.fireProjectiles(entityManager);
        }
    }

    fireProjectiles(entityManager) {
        const spacing = 40;
        const count = this.stats.projectileCount;
        const startX = this.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            const projX = startX + (i * spacing);
            entityManager.addEntity(new Projectile(
                projX,
                this.y - this.height / 2,
                entityManager.assets.getImage('props'),
                this.stats.damage,
                GameConfig.PROJECTILE_SIZE
            ));
        }

        // [EVENT] Broadcast shooting sound. AudioManager will catch this.
        // Assuming you have a 'laser' sound key in your assets.
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'laser', volume: 0.4 });
    }

    draw(ctx) {
        super.draw(ctx);
        const textY = this.y + (this.height / 2) + 25;
        drawFloatingText(ctx, `${this.stats.hp}`, this.x, textY, '#2ecc71');
    }
}

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

        // [EVENT] Broadcast hit sound.
        // Replace 'hit' with your actual sound key if different.
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

// ============================================================================
// 4. COMBAT & EFFECTS
// ============================================================================

export class Projectile extends SpriteEntity {
    constructor(x, y, image, damage, size) {
        const frame = PropsAtlas.projectile;
        super(x, y, size, size, image, frame, 0, 10);

        this.speed = -0.8; // Moves UP the screen
        this.damage = damage;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y < -100) this.markForDeletion = true;
    }
}

// ============================================================================
// 5. ENVIRONMENT & LOOT
// ============================================================================

export class Gate extends Entity {
    constructor(x, y) {
        super(x, y, 400, 150, 0, 5); // Width 400, rendered below ships
        this.speed = GameConfig.SCROLL_SPEED;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 200) this.markForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 15);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

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
        if (this.y > GameConfig.GAME_HEIGHT + 100) this.markForDeletion = true;
    }

    draw(ctx) {
        const floatOffset = Math.sin(this.aliveTime * this.floatSpeed) * this.floatAmplitude;

        // Apply visual float without affecting logical physical Y
        const originalY = this.y;
        this.y += floatOffset;

        super.draw(ctx);

        this.y = originalY;

        ctx.save();
        ctx.translate(this.x, this.y);

        const textY = -this.height / 2 - (GameConfig.FONT_SIZE_MD / 2);

        ctx.font = `bold ${GameConfig.FONT_SIZE_MD}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text using effect specific color
        ctx.strokeStyle = '#000';
        ctx.lineWidth = GameConfig.FONT_SIZE_MD * 0.1;
        ctx.strokeText(`+${this.value}`, 0, textY);

        ctx.fillStyle = this.effectDef.color;
        ctx.fillText(`+${this.value}`, 0, textY);

        ctx.restore();
    }
}