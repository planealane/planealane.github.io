// js/entities/Collectible.js
import { GameConfig } from '../GameConfig.js';
import { PropsAtlas } from '../utils/Atlas.js';
import { SpriteEntity } from './Entity.js';

export class Collectible extends SpriteEntity {
    // Remplacement de 'value' par 'tierIndex' pour coller à la nouvelle archi
    constructor(x, y, image, type, tierIndex = 0) {
        const frame = PropsAtlas.bonus;
        const itemSize = GameConfig.SHIP_SIZE / 2;

        super(x, y, itemSize, itemSize, image, frame, 0, 15);
        
        this.type = type;
        this.tierIndex = tierIndex;
        
        // Sécurité au cas où on passerait un type invalide
        this.bonusValue = GameConfig.UPGRADES[this.type] ? GameConfig.UPGRADES[this.type][this.tierIndex] : 0;
        
        this.speed = GameConfig.SCROLL_SPEED;
        this.aliveTime = 0;
        this.floatSpeed = 0.004;
        this.floatAmplitude = 8;
        
        this.pickupDelay = 300; 
        
        this.setupVisuals();
    }

    setupVisuals() {
        switch (this.type) {
            case 'HULL_REPAIR': this.text = `+${this.bonusValue} HP`; this.color = '#2ecc71'; break;
            case 'PRIMARY_DAMAGE': this.text = `+${this.bonusValue} DMG`; this.color = '#ff4757'; break;
            case 'PRIMARY_FIRE_RATE': this.text = `-${this.bonusValue}ms CD`; this.color = '#00e5ff'; break;
            case 'PRIMARY_BULLET_SPEED': this.text = `+${this.bonusValue} VEL`; this.color = '#f1c40f'; break;
            case 'SECONDARY_DAMAGE': this.text = `+${this.bonusValue} BURST DMG`; this.color = '#e67e22'; break;
            case 'SECONDARY_COUNT': this.text = `+${this.bonusValue} PROJ`; this.color = '#e84393'; break;
            case 'SECONDARY_COOLDOWN': this.text = `-${Math.round(this.bonusValue * 100)}% CD`; this.color = '#9b59b6'; break;
            default: this.text = `+UPGRADE`; this.color = '#ffffff';
        }
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

        const fontSize = GameConfig.FONT_SIZE_MD;
        const textY = -this.height / 2 - (fontSize / 2);

        ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Affichage du texte pré-formaté
        ctx.strokeStyle = '#000';
        ctx.lineWidth = fontSize * 0.1;
        ctx.strokeText(this.text, 0, textY);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, textY);

        ctx.restore();
    }
}