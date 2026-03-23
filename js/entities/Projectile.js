// js/entities/Projectile.js
import { GameConfig } from '../GameConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';

export class Projectile extends SpriteEntity {
    constructor(x, y, damage, speed, image) {
        const frame = PropsAtlas.projectile;
        const size = GameConfig.PROJECTILE_SIZE;

        super(x, y, size, size, image, frame, 0, 10);

        // Speed is negated to move UP the screen
        this.speed = -speed; 
        this.damage = damage;
    }

    update(dt) {
        this.y += this.speed * dt;
        
        // Despawn when it leaves the top of the screen
        if (this.y < -100) {
            this.markForDeletion = true;
        }
    }
}