// js/entities/HomingProjectile.js
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';
import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';
import { GameConfig } from '../GameConfig.js';

export class HomingProjectile extends SpriteEntity {
    constructor(x, y, damage, image, initialAngle) {
        const frame = PropsAtlas.projectile; // Placeholder frame
        const size = GameConfig.PROJECTILE_SIZE * 0.8; // Slightly smaller than primary

        super(x, y, size, size, image, frame, 0, 11);

        this.damage = damage;
        this.speed = 12; // Base speed (pixels per ms)
        
        // Initial velocity vector based on the firing angle
        this.vx = Math.cos(initialAngle) * this.speed;
        this.vy = Math.sin(initialAngle) * this.speed;

        // How fast the projectile can adjust its trajectory
        this.turnFactor = 0.008; 
    }

    update(dt, playerX, entityManager) {
        // 1. Find nearest valid target
        const target = this.getNearestTarget(entityManager.entities);

        // 2. Steer towards target if one exists
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.hypot(dx, dy);

            // Calculate desired velocity vector directly towards the target
            const desiredVx = (dx / distance) * this.speed;
            const desiredVy = (dy / distance) * this.speed;

            // Interpolate current velocity towards desired velocity for a smooth curve
            this.vx += (desiredVx - this.vx) * (this.turnFactor * dt);
            this.vy += (desiredVy - this.vy) * (this.turnFactor * dt);
        }

        // 3. Apply velocity to position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 4. Update visual rotation (Sprite naturally faces up, so add PI/2)
        this.angle = Math.atan2(this.vy, this.vx) + (Math.PI / 2);

        // Despawn bounds (wider bounds since homing missiles can loop around)
        if (this.y < -200 || this.y > GameConfig.GAME_HEIGHT + 200 || 
            this.x < -200 || this.x > GameConfig.GAME_WIDTH + 200) {
            this.markForDeletion = true;
        }
    }

    /**
     * Scans the entity pool to find the closest Enemy or Boss.
     */
    getNearestTarget(entities) {
        let nearest = null;
        let minDistance = Infinity;

        for (const entity of entities) {
            if (entity.markForDeletion) continue;
            
            if (entity instanceof Enemy || entity instanceof Boss) {
                const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = entity;
                }
            }
        }

        return nearest;
    }
}