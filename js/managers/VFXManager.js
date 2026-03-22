// js/managers/VFXManager.js
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { GameConfig } from '../GameConfig.js';
import { ExplosionEntity } from '../entities/Explosion.js';

export class VFXManager {
    constructor(assets) {
        this.assets = assets; 
        this.effects = [];

        this.onEnemyDestroyed = this.onEnemyDestroyed.bind(this);
        this.onPlayerDead = this.onPlayerDead.bind(this);
        this.onDamageTaken = this.onDamageTaken.bind(this);

        gameEvents.on(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.on(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.on(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
    }

    destroy() {
        gameEvents.off(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.off(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.off(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
        this.effects = [];
    }

    onEnemyDestroyed(payload) {
        if (!payload || payload.x === undefined || payload.y === undefined) return;

        const w = payload.width || GameConfig.SHIP_SIZE;
        const h = payload.height || GameConfig.SHIP_SIZE;

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
    }

    onPlayerDead(payload) {
        if (payload && payload.x !== undefined && payload.y !== undefined) {
            this.addExplosion(payload.x, payload.y);
        }
    }

    onDamageTaken(payload) {
        if (payload && payload.x !== undefined && payload.y !== undefined) {
            const color = payload.isCritical ? '#ffcc00' : '#ffffff';
            this.addFloatingText(payload.x, payload.y, payload.amount, color);
        }
    }

    addExplosion(x, y, width = GameConfig.SHIP_SIZE, height = GameConfig.SHIP_SIZE) {
        const image = this.assets.getImage('props');
        this.effects.push(new ExplosionEntity(x, y, image, width, height));
    }

    addFloatingText(x, y, text, color) {
        this.effects.push(new FloatingText(x, y, text, color));
    }

    update(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update(dt);
            
            if (this.effects[i].markForDeletion || this.effects[i].isDead) {
                this.effects.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.effects.forEach(fx => fx.draw(ctx));
    }
}

class FloatingText {
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

    update(dt) {
        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.isDead = true;
            return;
        }
        this.y -= this.floatSpeed * dt;
    }

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