// js/entities/Drone.js
import { Entity } from './Entity.js';
import { HomingProjectile } from './HomingProjectile.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js';

export class Drone extends Entity {
    constructor(owner, droneIndex, stats, image, entityManager) {
        const size = EntityVisualsConfig.DRONE.SIZE;
        super(owner.x, owner.y, size, size); 
        
        this.baseSize = size;
        this.width = size;
        this.height = size;
        this.image = image;
        this.zIndex = EntityVisualsConfig.Z_INDEX.DRONE;
        
        this.owner = owner;
        this.droneIndex = droneIndex; // Sera mis à jour par le joueur
        this.stats = stats;
        this.entityManager = entityManager;

        this.state = 'FOLLOW'; 
        this.target = null;
        this.fireTimer = 0;
        
        // [NOUVEAU] Le multiplicateur de fusion !
        this.powerMultiplier = 1; 
    }

    update(dt) {
        this.fireTimer += dt;

        // --- 1. GESTION DE LA TAILLE ET DE L'ESPACEMENT (FUSION) ---
        // Si le drone est fusionné (puissance 5), il grossit de 30%
        const scale = this.powerMultiplier >= 5 ? 1.3 : 1.0;
        const targetSize = this.baseSize * scale;

        // Animation douce (Lerp) de la taille du sprite (Effet de "gonflement")
        this.width += (targetSize - this.width) * 0.1;
        this.height += (targetSize - this.height) * 0.1;

        // Recalcul de l'offset dynamique (On écarte un peu plus les gros drones)
        const sideMultiplier = this.droneIndex % 2 === 0 ? -1 : 1;
        this.offsetX = EntityVisualsConfig.DRONE.FORMATION_OFFSET_X * Math.ceil(this.droneIndex / 2) * sideMultiplier * scale;
        this.offsetY = EntityVisualsConfig.DRONE.FORMATION_OFFSET_Y;

        // --- 2. ACQUISITION DE CIBLE ET DÉPLACEMENT ---
        this.findTarget();
        let targetX, targetY;

        if (this.target && !this.target.markForDeletion && !this.target.isDead && this.target.y > 0) {
            this.state = 'ATTACK';
            targetX = this.target.x + this.offsetX;
            targetY = this.owner.y + this.offsetY; 
            
            this.tryFire();
        } else {
            this.state = 'FOLLOW';
            this.target = null; 
            
            targetX = this.owner.x + this.offsetX;
            targetY = this.owner.y + this.offsetY;
        }

        const lerpFactor = EntityVisualsConfig.DRONE.LERP_FACTOR; 
        this.x += (targetX - this.x) * lerpFactor;
        this.y += (targetY - this.y) * lerpFactor;
    }

    findTarget() {
        if (this.target && !this.target.markForDeletion && !this.target.isDead && this.target.y > 0) return;

        let closestEnemy = null;
        let closestDist = Infinity;

        for (const entity of this.entityManager.entities) {
            if ((entity.constructor.name === 'Enemy' || entity.isBoss) && !entity.markForDeletion && !entity.isDead && entity.y > 0) {
                const dx = entity.x - this.owner.x;
                const dy = entity.y - this.owner.y;
                const dist = dx * dx + dy * dy;

                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = entity;
                }
            }
        }
        this.target = closestEnemy;
    }

    tryFire() {
        if (this.fireTimer >= this.stats.cooldown) {
            const distanceToTargetX = Math.abs(this.x - (this.target.x + this.offsetX));
            
            if (distanceToTargetX < 40) { 
                this.fireTimer = 0;
                
                // [NOUVEAU] On regroupe les dégâts grâce au multiplicateur
                const totalDamage = this.stats.damage * this.powerMultiplier;

                const projImage = this.entityManager.assets.getImage('props');
                const projectile = new HomingProjectile(
                    this.x, 
                    this.y - 20, 
                    totalDamage, // Dégâts x5 pour le gros drone !
                    this.stats.projectileSpeed, 
                    0, 
                    projImage, 
                    -Math.PI / 2, 
                    0 
                );
                
                this.entityManager.addEntity(projectile);
            }
        }
    }

    draw(ctx) {
        if (this.image) {
            const time = performance.now();
            const bobbing = Math.sin(time * EntityVisualsConfig.DRONE.BOB_SPEED + this.droneIndex) * EntityVisualsConfig.DRONE.BOB_AMPLITUDE;
            
            ctx.drawImage(
                this.image, 
                this.x - (this.width / 2), 
                this.y - (this.height / 2) + bobbing,
                this.width,
                this.height
            );
        }
    }
}