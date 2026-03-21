// js/Gate.js
import { GameConfig } from './GameConfig.js';
import { Entity } from './Entity.js';

export class Gate extends Entity {
    constructor(x, y) {
        super(x, y, 400, 150, 0, 5); // Width 400, rendered below ships
        this.speed = GameConfig.SCROLL_SPEED;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 15);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}