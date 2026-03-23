// js/weapons/PrimaryWeapon.js
import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js'; // Ton entité actuelle

export class PrimaryWeapon extends Weapon {
    constructor(baseStats) {
        super(baseStats);
    }

    fire(sourceEntity, entityManager) {
        const damage = this.stats.damage;
        const speed = this.stats.projectileSpeed;

        // Le projectile spawn juste à l'avant du vaisseau source
        const x = sourceEntity.x;
        const y = sourceEntity.y - (sourceEntity.height / 2);

        // On passe les stats buffées au projectile au moment de sa création
        const image = entityManager.assets.getImage('props');
        entityManager.addEntity(new Projectile(x, y, damage, speed, image));
    }
}