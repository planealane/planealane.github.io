// js/entities/Gate.js
import { UIConfig } from '../UIConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js';
import { BaseItem } from './BaseItem.js';
import { drawBonusText } from './Entity.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 
// 🗑️ GameConfig n'est plus importé ici, car tout le visuel a été extrait !

export class Gate extends BaseItem {
    constructor(x, y, image, currentWave = 1) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // [MODIFIÉ] On récupère la taille depuis la configuration visuelle
        const targetWidth = EntityVisualsConfig.GATE.BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        // [MODIFIÉ] On utilise le Z-Index du Background depuis la config visuelle
        super(x, y, targetWidth, targetHeight, image, frame, EntityVisualsConfig.Z_INDEX.BACKGROUND); 
        
        const upgradeKeys = Object.keys(UpgradesConfig.PORTALS);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        this.tierIndex = UpgradesConfig.RANDOM.getWeightedTierIndex(); 
        this.bonusValue = UpgradesConfig.PORTALS[this.bonusType][this.tierIndex]; 
        
        let displayValue = this.bonusValue;
        if (this.bonusType === 'HULL_REPAIR') {
            displayValue = UpgradesConfig.COMPUTE.hpScale(this.bonusValue, currentWave);
        }

        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        
        this.text = visualConfig.getLabel(this.bonusType, displayValue);
        this.color = visualConfig.getColor(this.bonusType);
    }

    update(dt) {
        super.update(dt); 
        this.y += this.baseSpeed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        const fontSize = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS.FONT_SIZE_GATE;
        const textY = EntityVisualsConfig.GATE.TEXT_OFFSET_Y;
        
        drawBonusText(ctx, this.text, 0, textY, this.color, fontSize);
        
        ctx.restore();
    }
}