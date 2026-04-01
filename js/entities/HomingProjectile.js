// js/entities/HomingProjectile.js
import { GameConfig } from '../GameConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js'; 
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';
import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';

export class HomingProjectile extends SpriteEntity {
    constructor(x, y, damage, speed, turnFactor, image, initialAngle, spawnDelay = 0) {
        const frame = PropsAtlas.projectiles[4];
        const targetSize = EntityVisualsConfig.PROJECTILE.SIZE * 0.8;

        // [CORRECTION] Si on a un délai, on commence à 0. Sinon, on prend la taille normale !
        const startSize = spawnDelay > 0 ? 0 : targetSize;

        super(x, y, startSize, startSize, image, frame, 0, EntityVisualsConfig.Z_INDEX.PROJECTILE);

        this.targetSize = targetSize;
        this.damage = damage;
        this.speed = speed;

        this.vx = Math.cos(initialAngle) * this.speed;
        this.vy = Math.sin(initialAngle) * this.speed;

        this.hasAimed = false;
        this.spawnDelay = spawnDelay;
    }

    update(dt, playerX, entityManager) {
        if (this.spawnDelay > 0) {
            this.spawnDelay -= dt;

            if (this.spawnDelay <= 0) {
                // Le réveil : il prend sa vraie taille
                this.width = this.targetSize;
                this.height = this.targetSize;
            } else {
                return; 
            }
        }

        if (!this.hasAimed) {
            const target = this.getNearestTarget(entityManager.entities);
            
            if (target) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    this.vx = (dx / distance) * this.speed;
                    this.vy = (dy / distance) * this.speed;
                }
            }
            
            this.hasAimed = true;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.angle = Math.atan2(this.vy, this.vx) + (Math.PI / 2);

        if (this.y < -200 || this.y > GameConfig.CANVAS.HEIGHT + 200 ||
            this.x < -200 || this.x > GameConfig.CANVAS.WIDTH + 200) {
            this.markForDeletion = true;
        }
    }

    getNearestTarget(entities) {
        let nearest = null;
        let minDistance = Infinity;

        for (const entity of entities) {
            if (entity.markForDeletion) continue;
            
            if (entity instanceof Enemy || entity instanceof Boss) {
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
}