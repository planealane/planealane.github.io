// js/entities/Player.js
import { GameConfig } from '../GameConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';
import { SpriteEntity, drawFloatingText } from './Entity.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { PrimaryWeapon } from '../weapons/PrimaryWeapon.js';
import { SecondaryWeapon } from '../weapons/SecondaryWeapon.js';
import { drawAlgorithmicTrail } from '../utils/VFXUtils.js';
import { WeaponConfig } from '../config/WeaponConfig.js';
import { Drone } from './Drone.js'; // [NOUVEAU] On importe le familier !

export class Player extends SpriteEntity {
    constructor(image, variantIndex = EntityVisualsConfig.PLAYER.BASE_VARIANT) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, image.width, image.height);

        super(GameConfig.CANVAS.WIDTH / 2, GameConfig.CANVAS.HEIGHT - 300, EntityVisualsConfig.PLAYER.SIZE, EntityVisualsConfig.PLAYER.SIZE, image, frame, 0, EntityVisualsConfig.Z_INDEX.PLAYER);
        this.currentVariant = safeIndex;

        this.stats = {
            hp: GameConfig.PLAYER_BASE_HP,
            maxHp: GameConfig.PLAYER_BASE_HP,

            damageMultiplier: 1.0,
            hasteMultiplier: 0.0,

            flatPrimaryDamage: 0,
            flatHaste: 0,
            flatSecondaryHaste: 0,

            // [NOUVEAU] Le compteur officiel de drones
            droneCount: 0
        };

        // Liste des familiers actifs
        this.drones = []; // [NOUVEAU]

        this.weapons = [
            new PrimaryWeapon(WeaponConfig.BASE.PRIMARY),
            new SecondaryWeapon(WeaponConfig.BASE.SECONDARY)
        ];

        this.targetAngle = 0;
        this.maxTilt = 0.35;
        this.tiltResponsiveness = 0.15;

        this.isTransforming = false;
        this.transformDuration = 0;
        this.transformTimer = 0;
        this.blinkAccumulator = 0;
        this.previousVariant = 0;
        this.targetVariant = 0;
    }

    setVariant(variantIndex) {
        const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;

        if (this.currentVariant === safeIndex && !this.isTransforming) return;

        this.previousVariant = this.currentVariant || 0;
        this.targetVariant = safeIndex;

        this.isTransforming = true;
        this.transformDuration = 1500;
        this.transformTimer = this.transformDuration;
        this.blinkAccumulator = 0;

        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'form_change', volume: 1.0 });
    }

    _updateFrame(variantIndex) {
        if (this.image) {
            const safeIndex = variantIndex % ShipsAtlas.PLAYER_VARIANTS;
            this.frame = ShipsAtlas.getFrame(safeIndex, this.image.width, this.image.height);
        }
    }

    update(dt, pointerX, entityManager) {
        const minX = GameConfig.MARGIN_X + (this.width / 2);
        const maxX = GameConfig.CANVAS.WIDTH - GameConfig.MARGIN_X - (this.width / 2);

        const dx = pointerX - this.x;
        this.targetAngle = Math.max(-this.maxTilt, Math.min(this.maxTilt, dx * 0.02));

        if (pointerX <= minX || pointerX >= maxX) {
            this.targetAngle = 0;
        }

        this.angle += (this.targetAngle - this.angle) * this.tiltResponsiveness;
        this.x = Math.max(minX, Math.min(maxX, pointerX));

        if (this.isTransforming) {
            this.transformTimer -= dt;
            this.blinkAccumulator += dt;

            const progress = 1 - (this.transformTimer / this.transformDuration);
            const blinkRate = Math.max(50, 150 - (progress * 100));

            if (this.transformTimer <= 0) {
                this.isTransforming = false;
                this.currentVariant = this.targetVariant;
                this._updateFrame(this.currentVariant);
            } else if (this.blinkAccumulator >= blinkRate) {
                this.blinkAccumulator = 0;
                this.currentVariant = (this.currentVariant === this.targetVariant) ? this.previousVariant : this.targetVariant;
                this._updateFrame(this.currentVariant);
            }
        }

        // ==========================================
        // [NOUVEAU] SYSTÈME DE FUSION DES DRONES
        // ==========================================
        const DRONES_PER_MERGE = 5;
        const totalDroneStat = this.stats.droneCount || 0;

        // Calcul du nombre de drones "Super" (Niveau 2) et "Normaux" (Niveau 1)
        const bigDronesCount = Math.floor(totalDroneStat / DRONES_PER_MERGE);
        const smallDronesCount = totalDroneStat % DRONES_PER_MERGE;
        const targetFleetSize = bigDronesCount + smallDronesCount;

        // 1. Ajouter les drones manquants à la flotte
        while (this.drones.length < targetFleetSize) {
            const droneImage = entityManager.assets.getImage('drone');
            const newDrone = new Drone(this, 0, WeaponConfig.BASE.DRONE, droneImage, entityManager); // Index sera mis à jour juste en dessous
            this.drones.push(newDrone);
            entityManager.addEntity(newDrone);
        }

        // 2. Retirer les drones en trop (L'instant magique de la fusion !)
        while (this.drones.length > targetFleetSize) {
            const removedDrone = this.drones.pop();
            removedDrone.markForDeletion = true; // Le moteur va le détruire
        }

        // 3. Mettre à jour l'index et la puissance de chaque drone survivant
        this.drones.forEach((drone, index) => {
            drone.droneIndex = index + 1; // 1, 2, 3...

            // Les premiers drones de la liste deviennent les gros drones !
            if (index < bigDronesCount) {
                drone.powerMultiplier = DRONES_PER_MERGE;
            } else {
                drone.powerMultiplier = 1;
            }
        });

        // ==========================================

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
        const textY = this.y + (this.height / 2) + EntityVisualsConfig.PLAYER.HP_OFFSET_Y;
        drawFloatingText(ctx, `${Math.floor(this.stats.hp)}`, this.x, textY, '#2ecc71');
    }

    getWeapon(weaponClass) {
        return this.weapons.find(w => w instanceof weaponClass);
    }

    get primaryWeapon() { return this.getWeapon(PrimaryWeapon); }
    get secondaryWeapon() { return this.getWeapon(SecondaryWeapon); }
}