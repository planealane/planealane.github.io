// js/entities/HomingProjectile.js
import { GameConfig } from '../GameConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js'; // [NEW] Import the visual config
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';
import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';

export class HomingProjectile extends SpriteEntity {
    constructor(x, y, damage, speed, turnFactor, image, initialAngle, spawnDelay = 0) {
        const frame = PropsAtlas.projectiles[4];

        // 1. Calculate local constant using EntityVisualsConfig instead of GameConfig
        const targetSize = EntityVisualsConfig.PROJECTILE.SIZE * 0.8;

        // 2. Initialize the parent with 0, 0 width/height, and the correct Z_INDEX from visual config
        super(x, y, 0, 0, image, frame, 0, EntityVisualsConfig.Z_INDEX.PROJECTILE);

        // 3. Setup core physics and stats
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
        // 1. Handle spawn delay (dormant state)
        if (this.spawnDelay > 0) {
            this.spawnDelay -= dt;

            // Activate physics and collisions once delay is over
            if (this.spawnDelay <= 0) {
                this.width = this.targetSize;
                this.height = this.targetSize;
            } else {
                return; // Stay dormant, skip the rest of the update
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

        // Apply velocities to position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Orient the sprite towards its movement vector
        this.angle = Math.atan2(this.vy, this.vx) + (Math.PI / 2);

        // Boundary check using GameConfig.CANVAS for despawning
        if (this.y < -200 || this.y > GameConfig.CANVAS.HEIGHT + 200 ||
            this.x < -200 || this.x > GameConfig.CANVAS.WIDTH + 200) {
            this.markForDeletion = true;
        }
    }

    /**
     * Finds the closest valid enemy target within screen boundaries.
     */
    getNearestTarget(entities) {
        let nearest = null;
        let minDistance = Infinity;

        for (const entity of entities) {
            if (entity.markForDeletion) continue;
            
            if (entity instanceof Enemy || entity instanceof Boss) {
                // Prevent targeting enemies that haven't entered the screen yet, 
                // or have already passed the bottom bounds.
                if (entity.y < 0 || entity.y > GameConfig.CANVAS.HEIGHT) continue;

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

        // Render the projectile sprite
        super.draw(ctx);

        // Draw the target reticle overlay on the locked enemy
        if (this.hasLockedOn && this.lockedTarget && !this.lockedTarget.markForDeletion) {
            const reticleFrame = PropsAtlas.target_reticle;
            
            // Use EntityVisualsConfig to determine the size of the reticle (matches ship size)
            const reticleSize = EntityVisualsConfig.PLAYER.SIZE; 

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