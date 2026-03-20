// js/entities.js
import { GameConfig } from './GameConfig.js';
import { PropsAtlas } from './Atlas.js';
// js/entities.js
import { BonusEffects } from './Effects.js';


// Helper function to draw static text relative to an entity
function drawFloatingText(ctx, text, x, y, color, fontSize = GameConfig.FONT_SIZE_MD) {
    ctx.save();

    // Inject the dynamic font size
    ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline width scaled slightly with font size for better readability
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.1;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}


export class Entity {
    constructor(x, y, width, height, angle = 0, zIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle;
        this.zIndex = zIndex;
        this.markForDeletion = false;
    }
}

export class SpriteEntity extends Entity {
    // Replaced col/row logic with a generic 'frame' object {sx, sy, sWidth, sHeight}
    constructor(x, y, width, height, image, frame, angle = 0, zIndex = 0) {
        super(x, y, width, height, angle, zIndex);
        this.image = image;
        this.frame = frame;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.image,
            this.frame.sx,
            this.frame.sy,
            this.frame.sWidth,
            this.frame.sHeight,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();
    }
}

export class Player extends SpriteEntity {

    constructor(image) {
        const sWidth = image.width / 4;
        const sHeight = image.height / 6;
        const frame = { sx: 0, sy: 0, sWidth, sHeight };

        super(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT - 300, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, 0, 10);

        // In Player constructor:
        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP,
            damage: GameConfig.PLAYER_BASE_DMG,
            shootInterval: 1000,
            projectileCount: 1
        };
        this.shootTimer = 0;

        // Juice: Tilt properties
        this.targetAngle = 0;
        this.maxTilt = 0.35; // Maximum rotation in radians (~20 degrees)
        this.tiltResponsiveness = 0.15; // Interpolation speed (0 to 1)
    }

    update(dt, pointerX, entityManager) {
        // 1. Calcul des limites de l'écran avec la marge
        const minX = GameConfig.MARGIN_X + (this.width / 2);
        const maxX = GameConfig.GAME_WIDTH - GameConfig.MARGIN_X - (this.width / 2);

        // 2. Calcul du delta de mouvement
        const dx = pointerX - this.x;

        // 3. Détermination de l'angle cible
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        // NOUVEAU : Si on touche (ou dépasse) les marges, on force l'angle cible à 0 (à plat)
        if (pointerX <= minX || pointerX >= maxX) {
            this.targetAngle = 0;
        }

        // 4. Interpolation douce vers l'angle cible (gère automatiquement la transition)
        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;

        // 5. Application de la position physique contrainte
        this.x = Math.max(minX, Math.min(maxX, pointerX));

        // 6. Logique de tir
        this.shootTimer += dt;
        if (this.shootTimer >= this.stats.shootInterval) {
            this.shootTimer = 0;
            this.fireProjectiles(entityManager);
        }
    }

    // Inside Player class
    fireProjectiles(entityManager) {
        const spacing = 40;
        const count = this.stats.projectileCount;
        const startX = this.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            const projX = startX + (i * spacing);
            // Pass player's current damage to the projectile
            entityManager.addEntity(new Projectile(projX, this.y - this.height / 2, entityManager.assets.getImage('props'), this.stats.damage));
        }
    }

    draw(ctx) {
        // 1. Draw the sprite with its transformations (tilt) handled by parent
        super.draw(ctx);

        // 2. Draw static HP text below the player
        const textY = this.y + (this.height / 2) + 25;

        // Make sure drawFloatingText is accessible in this file
        drawFloatingText(ctx, `${this.stats.hp} HP`, this.x, textY, '#2ecc71'); // Green
    }
}

// js/entities.js

export class Enemy extends SpriteEntity {
    constructor(x, y, image, maxHp) {
        const sWidth = image.width / 4;
        const sHeight = image.height / 6;
        const frame = { sx: 0, sy: 3 * sHeight, sWidth, sHeight };



        super(x, y, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, Math.PI, 20);
        // Inside Enemy and Gate constructors
        this.speed = GameConfig.SCROLL_SPEED;

        // Juice: Breathing properties with variance to break the clone effect
        this.aliveTime = Math.random() * Math.PI * 2;
        this.breathingSpeed = 0.0015 + (Math.random() - 0.5) * 0.0005;
        this.breathingAmplitude = 0.02 + (Math.random() - 0.5) * 0.01;
        this.currentScale = 1.0;

        this.hp = maxHp;
        this.maxHp = maxHp;
    }

    update(dt) {
        this.aliveTime += dt;

        // 1. Calculate breathing scale using Cosine
        // This creates a cycle around 1.0 (e.g., 1.0 - 0.05 to 1.0 + 0.05)
        this.currentScale = 1.0 + Math.cos(this.aliveTime * this.breathingSpeed) * this.breathingAmplitude;

        // 2. Normal vertical movement
        this.y += this.speed * dt;

        if (this.y > GameConfig.GAME_HEIGHT + 200) this.markForDeletion = true;
    }

    // We override draw to inject the scaling transformation
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.scale(this.currentScale, this.currentScale);

        ctx.drawImage(
            this.image,
            this.frame.sx,
            this.frame.sy,
            this.frame.sWidth,
            this.frame.sHeight,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();

        // Draw static HP text above the enemy
        const textY = this.y - (this.height / 2) - 25;
        drawFloatingText(ctx, this.hp.toString(), this.x, textY, '#e74c3c'); // Red
    }
}

export class Projectile extends Entity {
    constructor(x, y, image, damage) {
        super(x, y, 40, 40, 0, 10);
        this.image = image;
        this.speed = -0.8; // Vitesse vers le haut
        this.damage = damage; // Les fameux dégâts transmis par le joueur
    }

    update(dt) {
        // Le projectile doit monter
        this.y += this.speed * dt;

        // Nettoyage quand il sort de l'écran par le haut
        if (this.y < -100) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        // Ta logique d'affichage ici (drawImage ou simple rectangle)
        // Si ton image est un spritesheet "props", assure-toi de dessiner la bonne frame
        ctx.save();
        ctx.translate(this.x, this.y);

        // Exemple basique si tu as perdu ta méthode draw() :
        ctx.fillStyle = '#f1c40f'; // Laser jaune
        ctx.fillRect(-this.width / 4, -this.height / 2, this.width / 2, this.height);

        ctx.restore();
    }
}

export class Gate extends Entity {
    constructor(x, y) {
        // Width 400 to fit well within the 540px lane, zIndex 5 (under everything)
        super(x, y, 400, 150, 0, 5);
        // Inside Enemy and Gate constructors
        this.speed = GameConfig.SCROLL_SPEED;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 200) this.markForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Simple translucent placeholder rectangle
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
        this.pickupDelay = 300;
    }

    update(dt) {
        this.aliveTime += dt;

        // Decrease immunity timer
        if (this.pickupDelay > 0) {
            this.pickupDelay -= dt;
        }

        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 100) this.markForDeletion = true;
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

        // Fetch dynamic font size from config
        const fontSize = GameConfig.FONT_SIZE_MD;

        ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Position text above the item's true logical top
        const textY = -this.height / 2 - (fontSize / 2);

        // Outline for readability
        ctx.strokeStyle = '#000';
        ctx.lineWidth = fontSize * 0.1;
        ctx.strokeText(`+${this.value}`, 0, textY);

        // Inner text
        ctx.fillStyle = this.effectDef.color;
        ctx.fillText(`+${this.value}`, 0, textY);

        ctx.restore();
    }
}