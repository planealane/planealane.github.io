import { Weapon } from './Weapon.js';
import { HomingProjectile } from '../entities/HomingProjectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { GameConfig } from '../GameConfig.js';

export class SecondaryWeapon extends Weapon {
    constructor(baseStats) {
        super(baseStats);
    }

    /**
     * Checks if there is at least one valid target on screen.
     */
    hasValidTarget(entities) {
        for (const entity of entities) {
            if (entity.markForDeletion) continue;
            
            if (entity instanceof Enemy || entity instanceof Boss) {
                // Must be fully entered on screen and not passed the bottom
                if (entity.y > 0 && entity.y < GameConfig.GAME_HEIGHT) {
                    return true;
                }
            }
        }
        return false;
    }

    fire(sourceEntity, entityManager) {
        // Abort firing if there are no targets available
        if (!this.hasValidTarget(entityManager.entities)) {
            return false; 
        }

        const damage = this.stats.damage;
        const count = this.stats.count;
        const speed = this.stats.projectileSpeed;
        const turnFactor = this.stats.turnFactor;
        const staggerMs = this.stats.staggerMs || 0;
        
        const image = entityManager.assets.getImage('props'); 
        
        const spreadAngle = Math.PI / 2; 
        const baseAngle = -Math.PI / 2;
        const startAngle = baseAngle - (spreadAngle / 2);
        const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

        for (let i = 0; i < count; i++) {
            const currentAngle = count === 1 ? baseAngle : startAngle + (i * angleStep);
            const spawnDelay = (i * staggerMs) + (Math.random() * (staggerMs * 0.4));

            entityManager.addEntity(new HomingProjectile(
                sourceEntity.x, 
                sourceEntity.y, 
                damage, 
                speed, 
                turnFactor, 
                image, 
                currentAngle,
                spawnDelay
            ));
        }

        // Successfully fired
        return true; 
    }
}