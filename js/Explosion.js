// js/Explosion.js
import { SpriteEntity } from './Entities.js';
import { PropsAtlas } from './Atlas.js';
import { GameConfig } from './GameConfig.js';

export class ExplosionEntity extends SpriteEntity {
    constructor(x, y, image) {
        // Initialize with the first frame of the explosion array
        super(x, y, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, PropsAtlas.explosion[0], 0, 30); // zIndex 30 (on top of enemies)
        
        this.frames = PropsAtlas.explosion;
        this.currentFrameIndex = 0;
        this.timeSinceLastFrame = 0;
        this.frameDuration = 80; // ms per frame
    }

    update(dt) {
        this.timeSinceLastFrame += dt;
        if (this.timeSinceLastFrame >= this.frameDuration) {
            this.timeSinceLastFrame = 0;
            this.currentFrameIndex++;
            
            if (this.currentFrameIndex >= this.frames.length) {
                this.markForDeletion = true;
            } else {
                // Point to the next frame object in the Atlas
                this.frame = this.frames[this.currentFrameIndex];
                console.log("Frame actuelle :", this.frame);
            }
        }
    }
}