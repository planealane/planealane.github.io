// js/entities/Collectible.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { drawBonusText } from './Entity.js';
import { BaseItem } from './BaseItem.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 

export class Collectible extends BaseItem {
    constructor(x, y, image, type, tierIndex = 0) {
        const frame = PropsAtlas.bonus;
        const itemSize = GameConfig.SHIP_SIZE / 2;

        // Uses GameConfig for logical sizing and Z-Index layering
        super(x, y, itemSize, itemSize, image, frame, GameConfig.Z_INDEX.COLLECTIBLE);
        
        this.type = type;
        this.tierIndex = tierIndex;
        
        // [MODIFIED] Now pointing to UpgradesConfig.PORTALS
        this.bonusValue = UpgradesConfig.PORTALS[this.type] ? UpgradesConfig.PORTALS[this.type][this.tierIndex] : 0;
        
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        
        // Retrieve visual data from the newly nested UIConfig
        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        this.text = visualConfig.getLabel(this.type, this.bonusValue);
        this.color = visualConfig.getColor(this.type);
    }

    update(dt) {
        super.update(dt); // Handles aliveTime, pickupDelay, and boundary checks

        // Simple straight downward movement
        this.y += this.baseSpeed * dt;
    }

    draw(ctx) {
        // Apply floating effect only for rendering (not for the physical hitbox)
        const floatOffset = Math.sin(this.aliveTime * this.floatSpeed) * this.floatAmplitude;
        const originalY = this.y;
        this.y += floatOffset;

        // Render the base sprite
        super.draw(ctx);

        // Reset the Y position so the physical hitbox remains unaffected
        this.y = originalY;

        // Render the text
        ctx.save();
        ctx.translate(this.x, this.y);

        // [CRITICAL FIX] Pointed to the correct nested path for the font size
        const fontSize = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS.FONT_SIZE_DROP;
        const textY = -this.height / 2 - (fontSize / 2);

        drawBonusText(ctx, this.text, 0, textY, this.color, fontSize);

        ctx.restore();
    }
}