// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity } from './Entity.js';

export class Gate extends SpriteEntity {
    constructor(x, y, image) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        const targetWidth = GameConfig.GATE_BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        super(x, y, targetWidth, targetHeight, image, frame, 0, 0);
        
        this.speed = GameConfig.SCROLL_SPEED; 

        // 1. Tirage au sort du type de bonus parmi toutes les clés de UPGRADES
        const upgradeKeys = Object.keys(GameConfig.UPGRADES);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        // 2. Tirage au sort du niveau (Tier 0, 1, ou 2)
        this.tierIndex = Math.floor(Math.random() * 3); 
        this.bonusValue = GameConfig.UPGRADES[this.bonusType][this.tierIndex]; 

        this.pulseTime = 0;
        this.setupVisuals();
    }

    setupVisuals() {
        switch (this.bonusType) {
            case 'HULL_REPAIR': this.text = `+${this.bonusValue} HP`; this.color = '#2ecc71'; break;
            case 'PRIMARY_DAMAGE': this.text = `+${this.bonusValue} DMG`; this.color = '#ff4757'; break;
            case 'PRIMARY_FIRE_RATE': this.text = `-${this.bonusValue}ms CD`; this.color = '#00e5ff'; break;
            case 'PRIMARY_BULLET_SPEED': this.text = `+${this.bonusValue} VELOCITY`; this.color = '#f1c40f'; break;
            case 'SECONDARY_DAMAGE': this.text = `+${this.bonusValue} BURST DMG`; this.color = '#e67e22'; break;
            case 'SECONDARY_COUNT': this.text = `+${this.bonusValue} PROJ`; this.color = '#e84393'; break;
            case 'SECONDARY_COOLDOWN': this.text = `-${Math.round(this.bonusValue * 100)}% CD`; this.color = '#9b59b6'; break;
            default: this.text = `UPGRADE`; this.color = '#ffffff';
        }
    }

    update(dt) {
        this.y += this.speed * dt;
        this.pulseTime += dt * 0.005;

        if (this.y > GameConfig.GAME_HEIGHT + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const scale = 1.0 + (Math.sin(this.pulseTime) * 0.05);
        ctx.scale(scale, scale);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        ctx.fillStyle = this.color;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.font = `bold ${GameConfig.FONT_SIZE_SM || 20}px ${GameConfig.FONT_FAMILY || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(this.text, 0, -10); 
        
        ctx.restore();
    }
}