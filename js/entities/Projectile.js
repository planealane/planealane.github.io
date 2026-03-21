// js/Projectile.js
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';

export class Projectile extends SpriteEntity {
    constructor(x, y, image, damage, size) {
        const frame = PropsAtlas.projectile;
        super(x, y, size, size, image, frame, 0, 10);

        this.speed = -0.8; // Moves UP the screen
        this.damage = damage;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y < -100) {
            this.markForDeletion = true;
        }
    }
}