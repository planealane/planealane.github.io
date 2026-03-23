// js/entities/Projectile.js
import { GameConfig } from '../GameConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';

export class Projectile extends SpriteEntity {
    constructor(x, y, damage, speed, image) {
        // Fetch first projectile (row 1, col 1)
        const frame = PropsAtlas.projectiles[0]; 
        const size = GameConfig.PROJECTILE_SIZE;

        super(x, y, size, size, image, frame, 0, GameConfig.Z_INDEX.PROJECTILE);
        
        this.speed = -speed; 
        this.damage = damage;
    }

    update(dt) {
        this.y += this.speed * dt;
        
        if (this.y < -100) {
            this.markForDeletion = true;
        }
    }
}