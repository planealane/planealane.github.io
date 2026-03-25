// js/managers/VFXManager.js
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { GameConfig } from '../GameConfig.js';
import { ExplosionEntity } from '../entities/Explosion.js';

export class VFXManager {
    /**
     * Initializes the VFX manager, sets up state for effects, screen shake, 
     * screen fades, and binds event listeners to the global event bus.
     * @param {Object} assets - The game asset manager
     */
    constructor(assets) {
        this.assets = assets;
        this.effects = [];

        // Screen shake state
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Screen fade state
        this.fadeTimer = 0;
        this.fadeDuration = 0;
        this.fadeStartAlpha = 0;
        this.fadeEndAlpha = 0;
        this.fadeColor = '#000000';

        this.onEnemyDestroyed = this.onEnemyDestroyed.bind(this);
        this.onPlayerDead = this.onPlayerDead.bind(this);
        this.onDamageTaken = this.onDamageTaken.bind(this);
        this.onScreenFade = this.onScreenFade.bind(this);
        this.onSpeedLines = this.onSpeedLines.bind(this);

        gameEvents.on(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.on(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.on(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
        gameEvents.on(EVENTS.SCREEN_FADE, this.onScreenFade);
        gameEvents.on(EVENTS.SPEED_LINES, this.onSpeedLines);
    }

    /**
     * Cleans up event listeners and clears the effects array to prevent memory leaks.
     */
    destroy() {
        gameEvents.off(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
        gameEvents.off(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.off(EVENTS.DAMAGE_TAKEN, this.onDamageTaken);
        gameEvents.off(EVENTS.SCREEN_FADE, this.onScreenFade);
        gameEvents.off(EVENTS.SPEED_LINES, this.onSpeedLines);
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
     * Handles the SCREEN_FADE event, initializing a global screen fade transition.
     * @param {Object} payload - Event data containing duration, startAlpha, endAlpha, and color
     */
    onScreenFade(payload) {
        this.fadeDuration = payload.duration || 400;
        this.fadeTimer = this.fadeDuration;
        this.fadeStartAlpha = payload.startAlpha !== undefined ? payload.startAlpha : 1.0;
        this.fadeEndAlpha = payload.endAlpha !== undefined ? payload.endAlpha : 0.0;
        this.fadeColor = payload.color || '#000000';
    }

    /**
         * Handles the SPEED_LINES event, spawning the hyper-speed edge lines effect.
         * @param {Object} payload - Event data containing duration and color
         */
    onSpeedLines(payload) {
        // On passe la couleur à notre effet (blanc par défaut si non fourni)
        this.effects.push(new SpeedLinesEffect(payload.duration || 2000, payload.color || '#ffffff'));
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
     * Updates all active visual effects, the camera shake state, and screen fade.
     * @param {number} scaledDt - Game time delta (affected by slow-mo and pauses)
     * @param {number} unscaledDt - Real time delta (used for UI and camera shake)
     */
    update(scaledDt, unscaledDt = scaledDt) {
        // Screen shake uses unscaled real time to prevent infinite loops when game is frozen
        if (this.shakeTimer > 0) {
            this.shakeTimer -= unscaledDt;
            if (this.shakeTimer < 0) this.shakeTimer = 0;
        }

        // Screen fade also uses unscaled time so it continues smoothly during pauses
        if (this.fadeTimer > 0) {
            this.fadeTimer -= unscaledDt;
            if (this.fadeTimer < 0) this.fadeTimer = 0;
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
     * Renders all active visual effects and full-screen overlays to the canvas context.
     * @param {CanvasRenderingContext2D} ctx - The active canvas context
     */
    draw(ctx) {
        // 1. Draw individual entities (explosions, text, speed lines)
        this.effects.forEach(fx => fx.draw(ctx));

        // 2. Draw global screen fade overlay on top
        if (this.fadeTimer > 0) {
            // Calculate progress (0.0 to 1.0)
            const progress = 1 - (this.fadeTimer / this.fadeDuration);
            const currentAlpha = this.fadeStartAlpha + (this.fadeEndAlpha - this.fadeStartAlpha) * progress;

            ctx.save();
            // Clamp alpha to ensure it strictly stays between 0 and 1
            ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
            ctx.fillStyle = this.fadeColor;

            // Draw rectangle over the entire screen using canvas bounds
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
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

class SpeedLinesEffect {
    /**
     * Initializes a warp-speed lines effect on the vertical edges of the screen.
     * @param {number} duration - Lifespan of the effect in milliseconds
     * @param {string} color - Hex color code for the lines
     */
    constructor(duration = 2000, color = '#ffffff') {
        this.duration = duration;
        this.color = color; // On stocke la couleur
        this.elapsed = 0;
        this.isDead = false;
        this.lines = [];

        for (let i = 0; i < 30; i++) {
            this.lines.push(this.createLine(true));
        }
    }

    createLine(randomY = false) {
        const isLeft = Math.random() > 0.5;
        const xPct = isLeft ? (Math.random() * 0.15) : (0.85 + Math.random() * 0.15);

        return {
            xPct: xPct,
            // CHANGEMENT DIRECTION : Si on recycle la ligne, on la place AU-DESSUS de l'écran (ex: -0.5)
            yPct: randomY ? Math.random() : -0.5,
            lengthPct: 0.1 + Math.random() * 0.4,
            speed: 2.0 + Math.random() * 3.0,
            alpha: 0.1 + Math.random() * 0.4,

            // ---> C'EST ICI POUR L'ÉPAISSEUR <---
            // Math.random() > 0.8 veut dire "20% de chances d'être plus épaisse".
            // Tu peux changer les valeurs (ex: 4 et 2 au lieu de 3 et 1) pour des lignes plus grosses en pixel art.
            width: Math.random() > 0.8 ? 8 : 4
        };
    }

    update(dt) {
        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.isDead = true;
            return;
        }

        const dtSec = dt / 1000;
        for (let i = 0; i < this.lines.length; i++) {
            let l = this.lines[i];

            // CHANGEMENT DIRECTION : On AJOUTE la vitesse pour descendre (de haut en bas)
            l.yPct += l.speed * dtSec;

            // CHANGEMENT DIRECTION : Si la ligne sort par le BAS (> 1.0), on la recycle en haut
            if (l.yPct > 1.0) {
                this.lines[i] = this.createLine(false);
            }
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        const lifeRatio = 1 - (this.elapsed / this.duration);
        const fadeAlpha = Math.min(1, lifeRatio * 3);

        ctx.save();
        // CHANGEMENT COULEUR : On utilise la couleur reçue lors de la création
        ctx.fillStyle = this.color;

        for (let i = 0; i < this.lines.length; i++) {
            let l = this.lines[i];
            ctx.globalAlpha = fadeAlpha * l.alpha;
            // On utilise Math.floor pour rester net (style Pixel Art)
            ctx.fillRect(Math.floor(l.xPct * w), Math.floor(l.yPct * h), l.width, Math.floor(l.lengthPct * h));
        }

        ctx.restore();
    }
}