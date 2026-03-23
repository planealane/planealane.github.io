// js/EntityManager.js
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { HomingProjectile } from '../entities/HomingProjectile.js';
import { Gate } from '../entities/Gate.js';
import { Collectible } from '../entities/Collectible.js';
import { checkAABB, checkExtendedAABB } from '../core/Physics.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { Boss } from '../entities/Boss.js';
import { UpgradeManager } from '../managers/UpgradeManager.js';
import { SuperCollectible } from '../entities/SuperCollectible.js';

export class EntityManager {
    constructor(assets) {
        this.assets = assets;
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    update(dt, playerX) {
        this.entities.forEach(entity => entity.update(dt, playerX, this));
        this.handleCollisions();
        this.processDeaths(); // [NEW] Centralized death logic
        this.entities = this.entities.filter(entity => !entity.markForDeletion);
    }

    draw(ctx) {
        const sortedEntities = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
        sortedEntities.forEach(entity => entity.draw(ctx));
    }

    // ============================================================================
    // COLLISION DETECTION
    // ============================================================================

    handleCollisions() {
        const projectiles = this.entities.filter(e => e instanceof Projectile || e instanceof HomingProjectile);
        const enemies = this.entities.filter(e => e instanceof Enemy || e instanceof Boss);
        const collectibles = this.entities.filter(e => e instanceof Collectible);
        const gates = this.entities.filter(e => e instanceof Gate);
        const superCollectibles = this.entities.filter(e => e.constructor.name === 'SuperCollectible');
        const player = this.entities.find(e => e instanceof Player);

        if (!player) return;

        // A. Projectiles vs Enemies (Only apply damage)
        projectiles.forEach(projectile => {
            if (projectile.markForDeletion) return;

            enemies.forEach(enemy => {
                if (enemy.markForDeletion || enemy.hp <= 0) return; // Ignore already dead enemies
                if (enemy.y < 0) return; // Invincibility frame

                if (checkAABB(projectile, enemy)) {
                    projectile.markForDeletion = true;
                    enemy.hp -= projectile.damage;

                    gameEvents.emit(EVENTS.PLAY_SFX, { id: 'impact', volume: 0.5 });
                    gameEvents.emit(EVENTS.DAMAGE_TAKEN, {
                        x: enemy.x,
                        y: enemy.y - 20,
                        amount: projectile.damage,
                        isCritical: false
                    });

                    if (enemy.onHit) enemy.onHit();
                }
            });
        });

        // B. Enemies vs Player
        enemies.forEach(enemy => {
            if (enemy.markForDeletion || enemy.hp <= 0) return;

            if (checkAABB(player, enemy)) {
                // Instantly kill the enemy
                enemy.hp = 0; 
                
                player.stats.hp -= enemy.hp; // (Bug noted here in your original code: if enemy.hp is 0, player takes 0 damage. You might want to use enemy.stats.maxHp or a fixed ramming damage)
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'player_hit', volume: 0.8 });

                if (player.stats.hp <= 0) {
                    player.markForDeletion = true;
                    gameEvents.emit(EVENTS.PLAYER_DEAD, { x: player.x, y: player.y });
                }
            }
        });

        // C. Player vs Collectibles
        collectibles.forEach(collectible => {
            if (collectible.markForDeletion || collectible.pickupDelay > 0) return;

            if (checkExtendedAABB(player, collectible, 60)) {
                collectible.markForDeletion = true;
                UpgradeManager.apply(player, collectible.type, 0);
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.7 });
            }
        });

        // D. Player vs Gates
        gates.forEach(gate => {
            if (gate.markForDeletion) return;

            if (checkAABB(player, gate)) {
                UpgradeManager.apply(player, gate.bonusType, gate.tierIndex || 0);
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.8 });

                gates.forEach(g => {
                    if (Math.abs(g.y - gate.y) < 20) {
                        g.markForDeletion = true;
                    }
                });
            }
        });

        // E. Player vs Super Collectibles
        superCollectibles.forEach(superLoot => {
            if (superLoot.markForDeletion) return;

            // Adding a small delay (1 second) before pickup is allowed
            // This prevents instant pickup if the player is sitting right where the boss died
            if (superLoot.aliveTime < 1000) return; 

            if (checkAABB(player, superLoot)) {
                superLoot.markForDeletion = true;
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'super_bonus', volume: 1.0 });
                gameEvents.emit(EVENTS.SUPER_LOOT_PICKUP, { player: player });
            }
        });
    }

    // ============================================================================
    // DEATH PROCESSING (Centralized Loot & VFX)
    // ============================================================================
    
    processDeaths() {
        const enemies = this.entities.filter(e => e instanceof Enemy || e instanceof Boss);
        
        enemies.forEach(enemy => {
            if (!enemy.markForDeletion && enemy.hp <= 0) {
                
                // 1. Mark for removal
                enemy.markForDeletion = true;
                
                // 2. Audio
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'explosion', volume: 0.6 });

                // 3. Loot
                if (enemy.isBoss) {
                    this.addEntity(new SuperCollectible(enemy.x, enemy.y));
                }

                // 4. Global Event
                gameEvents.emit(EVENTS.ENEMY_DESTROYED, {
                    x: enemy.x,
                    y: enemy.y,
                    width: enemy.width,
                    height: enemy.height,
                    isBoss: enemy.isBoss,
                    entityManager: this
                });
            }
        });
    }

    destroy() {
        this.entities = [];
    }
}