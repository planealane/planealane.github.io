// js/entities/Collectible.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawBonusText } from './Entity.js';

export class Collectible extends SpriteEntity {
    constructor(x, y, image, type, tierIndex = 0) {
        const frame = PropsAtlas.bonus;
        const itemSize = GameConfig.SHIP_SIZE / 2;

        super(x, y, itemSize, itemSize, image, frame, 0, GameConfig.Z_INDEX.COLLECTIBLE);
        
        this.type = type;
        this.tierIndex = tierIndex;
        this.bonusValue = GameConfig.UPGRADES[this.type] ? GameConfig.UPGRADES[this.type][this.tierIndex] : 0;
        
        this.speed = GameConfig.SCROLL_SPEED;
        this.aliveTime = 0;
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        this.pickupDelay = 300; 
        
        // [MODIFIÉ] Appel à UIConfig
        this.text = UIConfig.BONUS_VISUALS.getLabel(this.type, this.bonusValue);
        this.color = UIConfig.BONUS_VISUALS.getColor(this.type);
    }

    update(dt) {
        this.aliveTime += dt;

        if (this.pickupDelay > 0) {
            this.pickupDelay -= dt;
        }

        this.y += this.speed * dt;
        if (this.y > GameConfig.GAME_HEIGHT + 100) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        const floatOffset = Math.sin(this.aliveTime * this.floatSpeed) * this.floatAmplitude;

        const originalY = this.y;
        this.y += floatOffset;

        super.draw(ctx);

        this.y = originalY;

        ctx.save();
        ctx.translate(this.x, this.y);

        // [MODIFIÉ] Appel à UIConfig
        const fontSize = UIConfig.BONUS_VISUALS.FONT_SIZE_DROP;
        const textY = -this.height / 2 - (fontSize / 2);

        drawBonusText(ctx, this.text, 0, textY, this.color, fontSize);

        ctx.restore();
    }
}