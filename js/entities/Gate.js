// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js';
import { BaseItem } from './BaseItem.js';
import { drawBonusText } from './Entity.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; // [MODIFIÉ] Nouvelle architecture

export class Gate extends BaseItem {
    constructor(x, y, image, currentWave = 1) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // Calculate dimensions based on config
        const targetWidth = GameConfig.GATE_BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        // Appelle BaseItem (z-index 0 par défaut pour les portails)
        super(x, y, targetWidth, targetHeight, image, frame, 0); 
        
        // Determine upgrade type
        const upgradeKeys = Object.keys(UpgradesConfig.PORTALS);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        // [NOUVEAU] Utilisation du tirage au sort pondéré (60% T1, 30% T2, 10% T3)
        this.tierIndex = UpgradesConfig.RANDOM.getWeightedTierIndex(); 
        this.bonusValue = UpgradesConfig.PORTALS[this.bonusType][this.tierIndex]; 
        
        // [NOUVEAU] On calcule la valeur réelle pour l'affichage si c'est du soin (Scaling)
        let displayValue = this.bonusValue;
        if (this.bonusType === 'HULL_REPAIR') {
            displayValue = UpgradesConfig.COMPUTE.hpScale(this.bonusValue, currentWave);
        }

        // Fetch UI formatting avec la valeur d'affichage calculée
        this.text = UIConfig.BONUS_VISUALS.getLabel(this.bonusType, displayValue);
        this.color = UIConfig.BONUS_VISUALS.getColor(this.bonusType);
    }

    update(dt) {
        super.update(dt); // Gère aliveTime et checkBoundaries()
        
        this.y += this.baseSpeed * dt;
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