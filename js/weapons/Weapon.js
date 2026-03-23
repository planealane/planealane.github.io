// js/weapons/Weapon.js

export class Weapon {
    constructor(baseStats) {
        // Clone base stats to allow applying buffs to this.stats 
        // without mutating the global GameConfig.WEAPONS template.
        this.stats = { ...baseStats }; 
        this.currentCooldown = 0;
    }

    update(dt, sourceEntity, entityManager) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt; // dt is in milliseconds
        }

        // Auto-fire as soon as the cooldown reaches 0 or below
        if (this.currentCooldown <= 0) {
            // Execute fire and capture the result
            const didFire = this.fire(sourceEntity, entityManager);
            
            // Reset cooldown based on the CURRENT (potentially buffed) stat 
            // ONLY if the weapon successfully fired
            if (didFire !== false) {
                this.currentCooldown = this.stats.cooldown;
            }
        }
    }

    /**
     * Abstract method. MUST be overridden by the child class.
     * @returns {boolean} Should return false if firing conditions (like target availability) are not met.
     */
    fire(sourceEntity, entityManager) {
        console.warn("The fire() method must be implemented by the child class.");
        return true; // Fallback
    }
}