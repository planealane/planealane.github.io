// js/entities/Collectible.js
import { UIConfig } from '../UIConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { BaseItem } from './BaseItem.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 

export class Collectible extends BaseItem {
    constructor(x, y, image, type, tierIndex = 0) {
        const frame = PropsAtlas.bonus;
        
        // Taille basée sur le joueur
        const itemSize = EntityVisualsConfig.PLAYER.SIZE / 2;

        super(x, y, itemSize, itemSize, image, frame, EntityVisualsConfig.Z_INDEX.COLLECTIBLE);
        
        // C'est `this.type` ici, pas `this.bonusType` !
        this.type = type;
        this.tierIndex = tierIndex;
        
        // Protection anti-crash : on vérifie que l'upgrade existe bien dans PORTALS avant de lire son Tier
        if (UpgradesConfig.PORTALS[this.type]) {
            this.bonusValue = UpgradesConfig.PORTALS[this.type][this.tierIndex];
        } else {
            this.bonusValue = 0; // Sécurité si c'est un autre type de loot
        }
        
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        
        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        
        this.text = visualConfig.getLabel(this.type, this.tierIndex);
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

        // [NOUVEAU] Utilisation de notre moteur de texte pour gérer les \n nativement !
        UIConfig.drawText(ctx, this.text, 0, textY, {
            fontSize: fontSize,
            color: this.color,
            weight: '900' // Typographie bien grasse pour un loot
        });

        ctx.restore();
    }
}