// js/entities/Collectible.js
import { UIConfig } from '../UIConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js'; // [NEW] Import des visuels
import { PropsAtlas } from '../utils/Atlas.js';
import { drawBonusText } from './Entity.js';
import { BaseItem } from './BaseItem.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 

export class Collectible extends BaseItem {
    constructor(x, y, image, type, tierIndex = 0) {
        const frame = PropsAtlas.bonus;
        
        // [MODIFIÉ] On récupère la taille depuis la nouvelle config visuelle (moitié du joueur)
        const itemSize = EntityVisualsConfig.PLAYER.SIZE / 2;

        // [MODIFIÉ] On utilise le Z-Index depuis EntityVisualsConfig
        super(x, y, itemSize, itemSize, image, frame, EntityVisualsConfig.Z_INDEX.COLLECTIBLE);
        
        this.type = type;
        this.tierIndex = tierIndex;
        
        this.bonusValue = UpgradesConfig.PORTALS[this.type] ? UpgradesConfig.PORTALS[this.type][this.tierIndex] : 0;
        
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        
        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        this.text = visualConfig.getLabel(this.type, this.bonusValue);
        this.color = visualConfig.getColor(this.type);
    }

    update(dt) {
        super.update(dt); 

        // Simple straight downward movement
        this.y += this.baseSpeed * dt;
    }

    draw(ctx) {
        // Applique l'effet de flottaison uniquement pour le rendu
        const floatOffset = Math.sin(this.aliveTime * this.floatSpeed) * this.floatAmplitude;
        const originalY = this.y;
        this.y += floatOffset;

        // Render the sprite
        super.draw(ctx);

        this.y = originalY;

        // Render the text
        ctx.save();
        ctx.translate(this.x, this.y);

        const fontSize = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS.FONT_SIZE_DROP;
        const textY = -this.height / 2 - (fontSize / 2);

        drawBonusText(ctx, this.text, 0, textY, this.color, fontSize);

        ctx.restore();
    }
}