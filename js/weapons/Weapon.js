// js/weapons/Weapon.js

export class Weapon {
    constructor(baseStats) {
        // On clone les stats de base. 
        // Crucial : cela permet d'appliquer des bonus sur this.stats sans modifier GameConfig.WEAPONS !
        this.stats = { ...baseStats }; 
        this.currentCooldown = 0;
    }

    update(dt, sourceEntity, entityManager) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt; // dt est en millisecondes
        }

        // Tir automatique dès que le cooldown est à 0 (ou en dessous)
        if (this.currentCooldown <= 0) {
            this.fire(sourceEntity, entityManager);
            
            // On reset le cooldown basé sur la stat ACTUELLE (potentiellement buffée)
            this.currentCooldown = this.stats.cooldown;
        }
    }

    /**
     * Méthode abstraite. DOIT être réécrite par l'arme enfant.
     */
    fire(sourceEntity, entityManager) {
        console.warn("La méthode fire() doit être implémentée par la classe enfant.");
    }
}