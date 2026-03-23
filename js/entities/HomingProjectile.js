// js/entities/HomingProjectile.js
import { GameConfig } from '../GameConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';
import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';

export class HomingProjectile extends SpriteEntity {
    constructor(x, y, damage, speed, turnFactor, image, initialAngle, spawnDelay = 0) {
        const frame = PropsAtlas.projectiles[4];

        // 1. Calcul dans une constante locale (pas de 'this')
        const targetSize = GameConfig.PROJECTILE_SIZE * 0.8;

        // 2. Initialisation du parent avec 0, 0
        super(x, y, 0, 0, image, frame, 0, GameConfig.Z_INDEX.PROJECTILE);

        // 3. Maintenant on a le droit d'utiliser 'this'
        this.targetSize = targetSize;
        this.damage = damage;
        this.speed = speed;

        this.vx = Math.cos(initialAngle) * this.speed;
        this.vy = Math.sin(initialAngle) * this.speed;
        this.turnFactor = turnFactor;

        this.lockedTarget = null;
        this.hasLockedOn = false;

        this.spawnDelay = spawnDelay;
    }

    update(dt, playerX, entityManager) {
        // 1. Handle spawn delay
        if (this.spawnDelay > 0) {
            this.spawnDelay -= dt;

            // Activate physics and collisions once delay is over
            if (this.spawnDelay <= 0) {
                this.width = this.targetSize;
                this.height = this.targetSize;
            } else {
                return; // Stay dormant
            }
        }

        // 2. Target acquisition
        if (!this.hasLockedOn) {
            this.lockedTarget = this.getNearestTarget(entityManager.entities);
            if (this.lockedTarget) {
                this.hasLockedOn = true;
            }
        }

        // 3. Homing steering logic
        if (this.hasLockedOn && this.lockedTarget && !this.lockedTarget.markForDeletion) {
            const dx = this.lockedTarget.x - this.x;
            const dy = this.lockedTarget.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
                const desiredVx = (dx / distance) * this.speed;
                const desiredVy = (dy / distance) * this.speed;

                this.vx += (desiredVx - this.vx) * (this.turnFactor * dt);
                this.vy += (desiredVy - this.vy) * (this.turnFactor * dt);
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle = Math.atan2(this.vy, this.vx) + (Math.PI / 2);

        if (this.y < -200 || this.y > GameConfig.GAME_HEIGHT + 200 ||
            this.x < -200 || this.x > GameConfig.GAME_WIDTH + 200) {
            this.markForDeletion = true;
        }
    }

    getNearestTarget(entities) {
        let nearest = null;
        let minDistance = Infinity;

        for (const entity of entities) {
            if (entity.markForDeletion) continue;
            
            if (entity instanceof Enemy || entity instanceof Boss) {
                // Prevent targeting enemies that haven't entered the screen yet, 
                // or have already passed the bottom bounds.
                if (entity.y < 0 || entity.y > GameConfig.GAME_HEIGHT) continue;

                const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = entity;
                }
            }
        }

        return nearest;
    }

    draw(ctx) {
        // Do not render if still dormant
        if (this.spawnDelay > 0) return;

        super.draw(ctx);

        if (this.hasLockedOn && this.lockedTarget && !this.lockedTarget.markForDeletion) {
            const reticleFrame = PropsAtlas.target_reticle;
            const reticleSize = GameConfig.SHIP_SIZE;

            ctx.save();
            ctx.translate(this.lockedTarget.x, this.lockedTarget.y);

            ctx.drawImage(
                this.image,
                reticleFrame.sx, reticleFrame.sy, reticleFrame.sWidth, reticleFrame.sHeight,
                -reticleSize / 2, -reticleSize / 2,
                reticleSize, reticleSize
            );

            ctx.restore();
        }
    }
}