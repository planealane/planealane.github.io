// js/weapons/DroneWeapon.js

import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js'; 

export class DroneWeapon extends Weapon {
    /**
     * @param {Object} baseStats - Stats from WeaponConfig
     * @param {number} droneIndex - Determines the offset position (1st drone right, 2nd left, etc.)
     */
    constructor(baseStats, droneIndex = 1) {
        super(baseStats);
        this.droneIndex = droneIndex;
    }

    fire(sourceEntity, entityManager) {
        const damage = this.stats.damage;
        const speed = this.stats.projectileSpeed;

        // Calcul de l'écartement (Formation en V ou en ligne)
        // Drone 1: Droite (+), Drone 2: Gauche (-), Drone 3: Plus à droite, etc.
        const sideMultiplier = this.droneIndex % 2 === 0 ? -1 : 1;
        
        // 60 pixels d'écart par paire de drones (à ajuster selon la taille de ton vaisseau)
        const offsetAmount = 60 * Math.ceil(this.droneIndex / 2); 
        
        const x = sourceEntity.x + (sideMultiplier * offsetAmount);
        
        // Légèrement en retrait par rapport au nez du vaisseau principal
        const y = sourceEntity.y + 20; 

        // Création du projectile
        const image = entityManager.assets.getImage('props');
        entityManager.addEntity(new Projectile(x, y, damage, speed, image));
        
        return true; 
    }
}