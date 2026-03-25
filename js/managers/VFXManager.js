// js/managers/VFXManager.js
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { GameConfig } from '../GameConfig.js';
import { ExplosionEntity } from '../entities/Explosion.js';

export class VFXManager {
    /**
     * Initializes the VFX manager, sets up state for effects and screen shake, 
     * and binds event listeners to the global event bus.
     * @param {Object} assets - The game asset manager
     */
    constructor(assets) {
        this.assets = assets;
        this.effects = [];

        // Screen shake state
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.onEnemyDestroyed = this.onEnemyDestroyed.bind(this);
        this.onPlayerDead = this.onPlayerDead.bind(this);
        this.onDamageTaken = this.onDamageTaken.bind(this);

        gameEvents.on(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.on(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.on(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
    }

    /**
     * Cleans up event listeners and clears the effects array to prevent memory leaks.
     */
    destroy() {
        gameEvents.off(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.off(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.off(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
        this.effects = [];
    }

    /**
     * Triggers a screen shake effect. 
     * Overrides the current shake only if the new intensity is higher or the current shake is finished.
     * @param {number} intensity - The maximum pixel displacement
     * @param {number} duration - The duration of the shake in milliseconds
     */
    triggerShake(intensity, duration) {
        if (this.shakeTimer <= 0 || intensity >= this.shakeIntensity) {
            this.shakeIntensity = intensity;
            this.shakeTimer = duration;
        }
    }

    /**
     * Handles VFX for enemy destruction, including geometrically scaled explosions and screen shake.
     * @param {Object} payload - Event data containing position and dimensions
     */
    onEnemyDestroyed(payload) {
        if (!payload || payload.x === undefined || payload.y === undefined) return;

        const w = (payload.width > 0) ? payload.width : GameConfig.SHIP_SIZE;
        const h = (payload.height > 0) ? payload.height : GameConfig.SHIP_SIZE;

        // Geometric rule: If wider than tall, tile explosions horizontally
        if (w > h * 1.5) {
            const numExplosions = Math.max(2, Math.round(w / h));
            const explosionSize = w / numExplosions;
            const startX = payload.x - (w / 2) + (explosionSize / 2);

            for (let i = 0; i < numExplosions; i++) {
                this.addExplosion(startX + (i * explosionSize), payload.y, explosionSize, explosionSize);
            }
        } else {
            // Standard square/tall entity
            this.addExplosion(payload.x, payload.y, w, h);
        }

        // Light screen shake for standard enemies
        this.triggerShake(3, 150);
        // Freeze game loop for 40ms to emphasize the kill
        gameEvents.emit(EVENTS.HIT_STOP, 30);
    }

    /**
     * Handles VFX for player death, triggering a massive screen shake and explosion.
     * @param {Object} payload - Event data containing the player's position
     */
    onPlayerDead(payload) {
        if (payload && payload.x !== undefined && payload.y !== undefined) {
            this.addExplosion(payload.x, payload.y);
        }

        // Heavy, long shake for player death
        this.triggerShake(15, 600);
    }

    /**
     * Spawns floating damage text and triggers a screen shake if the player is hit.
     * @param {Object} payload - Event data containing position, damage amount, and hit details
     */
    onDamageTaken(payload) {
        if (payload && payload.x !== undefined && payload.y !== undefined) {
            const color = payload.isCritical ? '#ffcc00' : '#ffffff';
            this.addFloatingText(payload.x, payload.y, payload.amount, color);

            // Medium shake if the entity taking damage is the player
            if (payload.isPlayer) {
                this.triggerShake(8, 250);
            }
        }
    }

    /**
     * Helper method to instantiate and register a new explosion entity.
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Target width of the explosion
     * @param {number} height - Target height of the explosion
     */
    addExplosion(x, y, width = GameConfig.SHIP_SIZE, height = GameConfig.SHIP_SIZE) {
        const image = this.assets.getImage('props');
        this.effects.push(new ExplosionEntity(x, y, image, width, height));
    }

    /**
     * Helper method to instantiate and register new floating combat text.
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {string|number} text - The value to display
     * @param {string} color - The hex color code for the text
     */
    addFloatingText(x, y, text, color) {
        this.effects.push(new FloatingText(x, y, text, color));
    }

    /**
         * Updates all active visual effects and the camera shake state.
         * @param {number} scaledDt - Game time delta (affected by slow-mo and pauses)
         * @param {number} unscaledDt - Real time delta (used for UI and camera shake)
         */
    update(scaledDt, unscaledDt = scaledDt) {
        // Screen shake uses unscaled real time to prevent infinite loops when game is frozen
        if (this.shakeTimer > 0) {
            this.shakeTimer -= unscaledDt;
            if (this.shakeTimer < 0) this.shakeTimer = 0;
        }

        // Active effects use scaled game time (allows slow-mo explosions to freeze correctly)
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update(scaledDt);

            if (this.effects[i].markForDeletion || this.effects[i].isDead) {
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Calculates and returns the current X/Y camera translation for the shake effect.
     * @returns {Object} Object containing {x, y} translation values
     */
    getShakeOffset() {
        if (this.shakeTimer <= 0) return { x: 0, y: 0 };

        // Dampen the shake as the timer runs out for a smooth stop
        const dampen = Math.min(1, this.shakeTimer / 100);
        const currentIntensity = this.shakeIntensity * dampen;

        return {
            x: (Math.random() - 0.5) * 2 * currentIntensity,
            y: (Math.random() - 0.5) * 2 * currentIntensity
        };
    }

    /**
     * Renders all active visual effects to the canvas context.
     * @param {CanvasRenderingContext2D} ctx - The active canvas context
     */
    draw(ctx) {
        this.effects.forEach(fx => fx.draw(ctx));
    }
}

class FloatingText {
    /**
     * Initializes a floating text particle.
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {string|number} text - The text to display
     * @param {string} color - Text color
     */
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.isDead = false;
        this.duration = 800;
        this.elapsed = 0;
        this.floatSpeed = 0.05;
    }

    /**
     * Updates the text position and lifespan.
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt) {
        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.isDead = true;
            return;
        }
        this.y -= this.floatSpeed * dt;
    }

    /**
     * Renders the floating text with a fading opacity based on lifespan.
     * @param {CanvasRenderingContext2D} ctx - The active canvas context
     */
    draw(ctx) {
        const lifeRatio = 1 - (this.elapsed / this.duration);
        ctx.save();
        ctx.globalAlpha = lifeRatio;
        ctx.fillStyle = this.color;

        const fontSize = GameConfig.FONT_SIZE_SM || 20;
        const fontFamily = GameConfig.FONT_FAMILY || 'sans-serif';

        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}