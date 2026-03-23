// js/weapons/SecondaryWeapon.js
import { Weapon } from './Weapon.js';
import { HomingProjectile } from '../entities/HomingProjectile.js';

export class SecondaryWeapon extends Weapon {
    constructor(baseStats) {
        super(baseStats);
    }

    fire(sourceEntity, entityManager) {
        const damage = this.stats.damage;
        const count = this.stats.count;
        const image = entityManager.assets.getImage('props'); // Placeholder
        
        // Define the total arc width for the burst (e.g., 90 degrees)
        const spreadAngle = Math.PI / 2; 
        
        // Base direction is straight up (-90 degrees in radians)
        const baseAngle = -Math.PI / 2;

        // Start angle for the leftmost projectile
        const startAngle = baseAngle - (spreadAngle / 2);
        
        // Distance in radians between each projectile
        const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

        for (let i = 0; i < count; i++) {
            // If count is 1, fire straight up. Otherwise, distribute evenly.
            const currentAngle = count === 1 ? baseAngle : startAngle + (i * angleStep);
            
            entityManager.addEntity(new HomingProjectile(
                sourceEntity.x, 
                sourceEntity.y, 
                damage, 
                image, 
                currentAngle
            ));
        }
        
        console.log(`[Weapon] Secondary fired ${count} homing projectiles.`);
    }
}