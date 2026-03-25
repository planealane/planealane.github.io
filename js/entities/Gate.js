// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';
import { WeaponConfig } from '../config/WeaponConfig.js';
import { UIConfig } from '../UIConfig.js';
import { SpriteEntity, drawBonusText } from './Entity.js';

export class Gate extends SpriteEntity {
    constructor(x, y, image) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // Calculate dimensions based on config
        const targetWidth = GameConfig.GATE_BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        super(x, y, targetWidth, targetHeight, image, frame, 0, 0);
        
        this.speed = GameConfig.SCROLL_SPEED; 

        // Determine upgrade type and tier
        const upgradeKeys = Object.keys(WeaponConfig.UPGRADES);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        this.tierIndex = Math.floor(Math.random() * 3); 
        this.bonusValue = WeaponConfig.UPGRADES[this.bonusType][this.tierIndex]; 
        
        // Fetch UI formatting
        this.text = UIConfig.BONUS_VISUALS.getLabel(this.bonusType, this.bonusValue);
        this.color = UIConfig.BONUS_VISUALS.getColor(this.bonusType);
    }

    update(dt) {
        this.y += this.speed * dt;

        // Despawn when off-screen
        if (this.y > GameConfig.GAME_HEIGHT + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw gate sprite
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        // Render standardized text
        drawBonusText(ctx, this.text, 0, -10, this.color, UIConfig.BONUS_VISUALS.FONT_SIZE_GATE);
        
        ctx.restore();
    }
}