// js/entities/Player.js
import { GameConfig } from '../GameConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { PrimaryWeapon } from '../weapons/PrimaryWeapon.js';
import { SecondaryWeapon } from '../weapons/SecondaryWeapon.js';
import { drawAlgorithmicTrail } from '../utils/VFXUtils.js';
import { WeaponConfig } from '../config/WeaponConfig.js';

export class Player extends SpriteEntity {
    constructor(image, variantIndex = GameConfig.PLAYER_BASE_VARIANT) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        // Spawn using GameConfig.CANVAS dimensions
        super(GameConfig.CANVAS.WIDTH / 2, GameConfig.CANVAS.HEIGHT - 300, GameConfig.SHIP_SIZE, GameConfig.SHIP_SIZE, image, frame, 0, GameConfig.Z_INDEX.PLAYER);
        this.currentVariant = safeIndex;

        // ==========================================
        // PLAYER STATS & MODIFIERS
        // Prepared for UpgradesConfig multipliers
        // ==========================================
        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP,

            // Core multipliers from Archetypes
            damageMultiplier: 1.0,
            hasteMultiplier: 0.0,

            // Flat accumulated bonuses from Gates
            flatPrimaryDamage: 0,
            flatHaste: 0,
            flatSecondaryHaste: 0,

            // Special mechanics
            droneCount: 0
        };

        // Weapon system initialization
        this.weapons = [
            new PrimaryWeapon(WeaponConfig.BASE.PRIMARY),
            new SecondaryWeapon(WeaponConfig.BASE.SECONDARY)
        ];
        // Physics for visual banking (tilting) when moving horizontally
        this.targetAngle = 0;
        this.maxTilt = 0.35;
        this.tiltResponsiveness = 0.15;

        // Transformation state
        this.isTransforming = false;
        this.transformDuration = 0;
        this.transformTimer = 0;
        this.blinkAccumulator = 0;
        this.previousVariant = 0;
        this.targetVariant = 0;
    }

    /**
         * Triggers the transformation sequence and plays the sound ONCE.
         */
    setVariant(variantIndex) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;

        // Prevent triggering if already in target form or currently transforming
        if (this.currentVariant === safeIndex && !this.isTransforming) return;

        this.previousVariant = this.currentVariant || 0;
        this.targetVariant = safeIndex;

        this.isTransforming = true;
        this.transformDuration = 1500;
        this.transformTimer = this.transformDuration;
        this.blinkAccumulator = 0;

        // Fire and forget: guarantees the sound plays exactly once per form change
        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'form_change', volume: 1.0 });
    }

    /**
     * Updates the sprite frame based on the Atlas.
     * Centralized to keep frame logic DRY.
     */
    _updateFrame(variantIndex) {
        if (this.image) {
            const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
            this.frame = ShipsAtlas.getFrame(safeIndex, this.image.width, this.image.height);
        }
    }

    update(dt, pointerX, entityManager) {
        // 1. Constrain to screen bounds
        const minX = GameConfig.MARGIN_X + (this.width / 2);
        const maxX = GameConfig.CANVAS.WIDTH - GameConfig.MARGIN_X - (this.width / 2);

        // 2. Calculate movement for visual tilt
        const dx = pointerX - this.x;
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        if (pointerX <= minX || pointerX >= maxX) {
            this.targetAngle = 0; // Flatten ship at edges
        }

        // 3. Apply physics
        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;
        this.x = Math.max(minX, Math.min(maxX, pointerX));

        // 4. Handle transformation animation (Visual only)
        if (this.isTransforming) {
            this.transformTimer -= dt;
            this.blinkAccumulator += dt;

            const progress = 1 - (this.transformTimer / this.transformDuration);
            const blinkRate = Math.max(50, 150 - (progress * 100));

            if (this.transformTimer <= 0) {
                // Sequence complete, lock to target
                this.isTransforming = false;
                this.currentVariant = this.targetVariant;
                this._updateFrame(this.currentVariant);
            } else if (this.blinkAccumulator >= blinkRate) {
                // Swap forms for the blinking effect
                this.blinkAccumulator = 0;
                this.currentVariant = (this.currentVariant === this.targetVariant) ? this.previousVariant : this.targetVariant;
                this._updateFrame(this.currentVariant);
            }
        }

        // 5. Handle Combat (Shooting)
        this.weapons.forEach(weapon => weapon.update(dt, this, entityManager));
    }

    draw(ctx) {
        drawAlgorithmicTrail(
            ctx,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
            performance.now(),
            false
        );

        super.draw(ctx);
        const textY = this.y + (this.height / 2) + 25;
        drawFloatingText(ctx, `${Math.floor(this.stats.hp)}`, this.x, textY, '#2ecc71');
    }

    /**
     * Utility to retrieve a specific weapon instance
     */
    getWeapon(weaponClass) {
        return this.weapons.find(w => w instanceof weaponClass);
    }

    // Direct accessors to maintain compatibility with UpgradesConfig.js logic
    get primaryWeapon() {
        return this.getWeapon(PrimaryWeapon);
    }

    get secondaryWeapon() {
        return this.getWeapon(SecondaryWeapon);
    }
}