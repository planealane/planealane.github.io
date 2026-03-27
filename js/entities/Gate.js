// js/entities/Gate.js
import { UIConfig } from '../UIConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js';
import { BaseItem } from './BaseItem.js';
import { drawBonusText } from './Entity.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 

export class Gate extends BaseItem {
    constructor(x, y, image, currentWave = 1) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        const targetWidth = EntityVisualsConfig.GATE.BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        super(x, y, targetWidth, targetHeight, image, frame, EntityVisualsConfig.Z_INDEX.BACKGROUND); 
        
        const upgradeKeys = Object.keys(UpgradesConfig.PORTALS);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        this.tierIndex = UpgradesConfig.RANDOM.getWeightedTierIndex(); 
        this.bonusValue = UpgradesConfig.PORTALS[this.bonusType][this.tierIndex];
        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        this.text = visualConfig.getLabel(this.bonusType, this.tierIndex);
        this.color = visualConfig.getColor(this.bonusType);

        // --- [NOUVEAU] Propriétés visuelles ---
        this.flipX = false; // Définit si le sprite doit être en miroir
        this.isDespawning = false;
        this.despawnTimer = 0;
    }

    /**
     * [NOUVEAU] Déclenche l'animation de disparition (clignotement)
     * @param {number} duration - Durée en millisecondes avant destruction
     */
    startDespawn(duration = 2000) {
        if (this.isDespawning) return; // Évite de relancer le timer
        this.isDespawning = true;
        this.despawnTimer = duration;
        
        // Optionnel: on peut aussi stopper la porte en modifiant this.baseSpeed = 0
    }

    update(dt) {
        super.update(dt); 
        
        // [NOUVEAU] Gestion du timer de disparition
        if (this.isDespawning) {
            this.despawnTimer -= dt;
            if (this.despawnTimer <= 0) {
                this.markForDeletion = true;
            }
        }

        this.y += this.baseSpeed * dt;
    }

    draw(ctx) {
        // [NOUVEAU] Logique de clignotement (Blink)
        // Math.floor(timer / vitesse) % 2 permet d'alterner vrai/faux toutes les X ms
        if (this.isDespawning) {
            const isVisible = Math.floor(this.despawnTimer / 150) % 2 === 0;
            if (!isVisible) return; // On saute le rendu cette frame pour créer le clignotement
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // --- 1. DESSIN DU SPRITE (Isolé pour gérer le miroir) ---
        ctx.save(); 
        if (this.flipX) {
            ctx.scale(-1, 1); // Inverse l'axe X (miroir horizontal / autour de l'axe Y)
        }
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore(); // On annule le miroir pour ne pas retourner le texte !

        // --- 2. DESSIN DU TEXTE ---
        const fontSize = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS.FONT_SIZE_GATE;
        const textY = EntityVisualsConfig.GATE.TEXT_OFFSET_Y;
        
        drawBonusText(ctx, this.text, 0, textY, this.color, fontSize);
        
        ctx.restore();
    }
}