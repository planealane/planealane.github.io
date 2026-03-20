// js/entities.js
import { GameConfig } from './GameConfig.js';
import { PropsAtlas } from './Atlas.js';


console.log(GameConfig);
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

        this.stats = {
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
        // 1. Calculate movement delta
        const dx = pointerX - this.x;

        // 2. Map movement to a target angle and clamp it to maxTilt
        // Multiplying by 0.02 is a sensitivity factor to map pixels to radians smoothly
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        // 3. Interpolate current angle towards the target angle (Smoothness)
        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;

        // 4. Update physical position with screen bounds
        this.x = pointerX;
        this.x = Math.max(this.width / 2, Math.min(GameConfig.GAME_WIDTH - this.width / 2, this.x));

        // 5. Shooting logic
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
            entityManager.addEntity(new Projectile(projX, this.y - this.height / 2, entityManager.assets.getImage('props')));
        }
    }
}

// js/entities.js

export class Enemy extends SpriteEntity {
    constructor(x, y, image) {
        const sWidth = image.width / 4;
        const sHeight = image.height / 6;
        const frame = { sx: 0, sy: 3 * sHeight, sWidth, sHeight };

        super(x, y, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, Math.PI, 20);
        this.speed = 0.3;

        // Juice: Breathing properties with variance to break the clone effect
        this.aliveTime = Math.random() * Math.PI * 2;
        this.breathingSpeed = 0.0015 + (Math.random() - 0.5) * 0.0005; 
        this.breathingAmplitude = 0.02 + (Math.random() - 0.5) * 0.01;
        this.currentScale = 1.0;
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

        // 1. Apply Base rotation (facing down)
        ctx.rotate(this.angle);

        // 2. Apply Breathing Scale BEFORE drawing image
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
    }
}

export class Projectile extends SpriteEntity {
    constructor(x, y, image) {
        // Direct injection from the Atlas
        super(x, y, 40, 40, image, PropsAtlas.projectile, 0, 5);
        this.speed = 1.2;
    }

    update(dt) {
        this.y -= this.speed * dt;
        if (this.y < -50) this.markForDeletion = true;
    }
}

export class Gate extends Entity {
    constructor(x, y) {
        // Width 400 to fit well within the 540px lane, zIndex 5 (under everything)
        super(x, y, 400, 150, 0, 5);
        this.speed = 0.2;
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