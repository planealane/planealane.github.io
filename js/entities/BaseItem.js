// js/entities/BaseItem.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity } from './Entity.js';

export class BaseItem extends SpriteEntity {
    constructor(x, y, width, height, image, frame, zIndex) {
        super(x, y, width, height, image, frame, 0, zIndex);
        
        this.aliveTime = 0;
        this.pickupDelay = 300; // Time in ms before the player can pick it up
        this.baseSpeed = GameConfig.SCROLL_SPEED;
    }

    update(dt) {
        this.aliveTime += dt;

        if (this.pickupDelay > 0) {
            this.pickupDelay -= dt;
        }

        // Child classes will handle their own movement logic (this.y += ...)
        // We only enforce the boundary check here
        this.checkBoundaries();
    }

    checkBoundaries() {
        if (this.y > GameConfig.GAME_HEIGHT + 200 || 
            this.x < -200 || 
            this.x > GameConfig.GAME_WIDTH + 200) {
            this.markForDeletion = true;
        }
    }
}