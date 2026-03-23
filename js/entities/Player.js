// js/entities/Player.js
import { GameConfig } from '../GameConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { PrimaryWeapon } from '../weapons/PrimaryWeapon.js';
import { SecondaryWeapon } from '../weapons/SecondaryWeapon.js';

export class Player extends SpriteEntity {
    constructor(image, variantIndex = GameConfig.PLAYER_BASE_VARIANT) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        super(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT - 300, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, 0, GameConfig.Z_INDEX.PLAYER);

        this.currentVariant = safeIndex;

        // Les stats de combat (dégâts, cadence) sont maintenant gérées par les Armes.
        // On ne garde ici que ce qui est propre à la "coque" du joueur.
        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP // Conservé au cas où, mais hp peut le dépasser (uncap)
        };
        
        // Initialisation du système d'armement modulaire
        this.weapons = [
            new PrimaryWeapon(GameConfig.WEAPONS.PRIMARY),
            new SecondaryWeapon(GameConfig.WEAPONS.SECONDARY)
        ];
        
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
        // Les armes s'occupent de leur propre cooldown et spawn
        this.weapons.forEach(weapon => weapon.update(dt, this, entityManager));
    }

    /**
     * Utilitaire pour récupérer l'instance d'une arme précise
     */
    getWeapon(weaponClass) {
        return this.weapons.find(w => w instanceof weaponClass);
    }

    draw(ctx) {
        super.draw(ctx);
        const textY = this.y + (this.height / 2) + 25;
        drawFloatingText(ctx, `${Math.floor(this.stats.hp)}`, this.x, textY, '#2ecc71');
    }

    /**
     * Updates the player's visual sprite based on the variant index.
     * @param {number} variantIndex - The index from ShipsAtlas (e.g., 0 to 11)
     */
    setVariant(variantIndex) {
        this.currentVariant = variantIndex;
        if (this.image) {
            const safeIndex = this.currentVariant % ShipsAtlas.PLAYER_VARIANTS;
            this.frame = ShipsAtlas.getFrame(safeIndex, this.image.width, this.image.height);
        }
    }
}