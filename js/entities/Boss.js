// js/entities/Boss.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class Boss extends SpriteEntity {
    constructor(x, y, image, maxHp, bossDef) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // 1. Calcul des dimensions de base
        const baseWidth = bossDef.width || GameConfig.BOSS_BASE_WIDTH; 
        const baseHeight = baseWidth * (image.height / image.width);

        // 2. Application du scale sur les dimensions LOGIQUES pour que Physics.js les lise
        const scale = bossDef.scale || 1.0;
        const physicalWidth = baseWidth * scale;
        const physicalHeight = baseHeight * scale;

        super(x, y, physicalWidth, physicalHeight, image, frame, Math.PI, 0);

        this.speed = GameConfig.SCROLL_SPEED;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.isBoss = true;
        
        // 3. CRUCIAL : Identifier l'entité pour le gestionnaire de collisions
        // Ajoute les tags que ton EntityManager recherche habituellement
        this.isEnemy = true; 
        this.type = 'enemy'; // (ou 'ENEMY' selon tes conventions)
        
        // Le scale d'animation "Juice" part de 1.0 car la taille physique est déjà agrandie
        this.baseScale = 1.0;
        this.currentScale = this.baseScale;
    }

    onHit() {
        // Effet de jus : rétrécissement léger à l'impact
        this.currentScale = this.baseScale * 0.95; 
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'hit', volume: 0.8 });
    }

    update(dt) {
        // Retour progressif à la taille normale
        if (this.currentScale < this.baseScale) {
            this.currentScale += (this.baseScale - this.currentScale) * 0.1;
        }

        this.y += this.speed * dt;
        
        if (this.y > GameConfig.GAME_HEIGHT + 300) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // On applique le scale d'animation (proche de 1.0)
        ctx.scale(this.currentScale, this.currentScale);

        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();

        // Render HP
        const textY = this.y - (this.height / 2) - 40;
        drawFloatingText(ctx, Math.ceil(this.hp).toString(), this.x, textY, '#8e44ad');
    }
}