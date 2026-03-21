// js/Player.js
import { GameConfig } from '../GameConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { Projectile } from './Projectile.js';

export class Player extends SpriteEntity {
    constructor(image, variantIndex = GameConfig.PLAYER_BASE_VARIANT) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        super(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT - 300, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, 0, 10);

        this.currentVariant = safeIndex;

        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP,
            damage: GameConfig.PLAYER_BASE_DMG,
            shootInterval: 1000,
            projectileCount: 1
        };
        
        this.shootTimer = 0;
        
        // Physics for visual banking (tilting) when moving horizontally
        this.targetAngle = 0;
        this.maxTilt = 0.35;
        this.tiltResponsiveness = 0.15;
    }

    setVariant(newVariantIndex) {
        this.currentVariant = newVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
        this.frame = ShipsAtlas.getFrame(this.currentVariant, this.image.width, this.image.height);
    }

    update(dt, pointerX, entityManager) {
        // 1. Constrain to screen bounds
        const minX = GameConfig.MARGIN_X + (this.width / 2);
        const maxX = GameConfig.GAME_WIDTH - GameConfig.MARGIN_X - (this.width / 2);

        // 2. Calculate movement for visual tilt
        const dx = pointerX - this.x;
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        if (pointerX <= minX || pointerX >= maxX) {
            this.targetAngle = 0; // Flatten ship at edges
        }

        // 3. Apply physics
        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;
        this.x = Math.max(minX, Math.min(maxX, pointerX));

        // 4. Handle Combat (Shooting)
        this.shootTimer += dt;
        if (this.shootTimer >= this.stats.shootInterval) {
            this.shootTimer = 0;
            this.fireProjectiles(entityManager);
        }
    }

    fireProjectiles(entityManager) {
        const spacing = 40;
        const count = this.stats.projectileCount;
        const startX = this.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            const projX = startX + (i * spacing);
            entityManager.addEntity(new Projectile(
                projX,
                this.y - this.height / 2,
                entityManager.assets.getImage('props'),
                this.stats.damage,
                GameConfig.PROJECTILE_SIZE
            ));
        }

        // [EVENT] Broadcast shooting sound
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'laser', volume: 0.4 });
    }

    draw(ctx) {
        super.draw(ctx);
        const textY = this.y + (this.height / 2) + 25;
        drawFloatingText(ctx, `${this.stats.hp}`, this.x, textY, '#2ecc71');
    }
}