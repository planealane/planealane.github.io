// js/EntityManager.js
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Gate } from '../entities/Gate.js';
import { Collectible } from '../entities/Collectible.js';
import { checkAABB, checkExtendedAABB } from '../core/Physics.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { Boss } from '../entities/Boss.js';

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
        this.entities = this.entities.filter(entity => !entity.markForDeletion);
    }

    draw(ctx) {
        const sortedEntities = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
        sortedEntities.forEach(entity => entity.draw(ctx));
    }

    // ============================================================================
    // COLLISION DETECTION (Decoupled via EventBus)
    // ============================================================================

    handleCollisions() {
        const projectiles = this.entities.filter(e => e instanceof Projectile);
        const enemies = this.entities.filter(e => e instanceof Enemy || e instanceof Boss);
        const collectibles = this.entities.filter(e => e instanceof Collectible);
        const gates = this.entities.filter(e => e instanceof Gate);
        const player = this.entities.find(e => e instanceof Player);

        if (!player) return;

        // A. Projectiles vs Enemies
        projectiles.forEach(projectile => {
            if (projectile.markForDeletion) return;

            enemies.forEach(enemy => {
                if (enemy.markForDeletion) return;

                if (checkAABB(projectile, enemy)) {
                    projectile.markForDeletion = true;
                    enemy.hp -= projectile.damage;
                    gameEvents.emit(EVENTS.PLAY_SFX, { id: 'impact', volume: 0.5 });
                    
                    // Emit event for floating damage text (Enemies only)
                    gameEvents.emit(EVENTS.DAMAGE_TAKEN, {
                        x: enemy.x,
                        y: enemy.y - 20,
                        amount: projectile.damage,
                        isCritical: false
                    });

                    if (enemy.onHit) enemy.onHit(); // Specific juice (like Boss scale)

                    if (enemy.hp <= 0) {
                        enemy.markForDeletion = true;

                        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'explosion', volume: 0.6 });

                        // [MODIFIED] Passing physical dimensions to VFXManager
                        gameEvents.emit(EVENTS.ENEMY_DESTROYED, { 
                            x: enemy.x, 
                            y: enemy.y, 
                            width: enemy.width, 
                            height: enemy.height,
                            entityManager: this 
                        });
                    }
                }
            });
        });

        // B. Enemies vs Player
        enemies.forEach(enemy => {
            if (enemy.markForDeletion) return;

            if (checkAABB(player, enemy)) {
                enemy.markForDeletion = true;

                // [MODIFIED] Passing physical dimensions
                gameEvents.emit(EVENTS.ENEMY_DESTROYED, { 
                    x: enemy.x, 
                    y: enemy.y, 
                    width: enemy.width, 
                    height: enemy.height,
                    entityManager: this 
                });

                player.stats.hp -= enemy.hp;

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
                collectible.effectDef.apply(player, collectible.value);
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.7 });
            }
        });

        // D. Player vs Gates
        gates.forEach(gate => {
            if (gate.markForDeletion) return;

            if (checkAABB(player, gate)) {
                gate.applyBonus(player);
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.8 });

                gates.forEach(g => {
                    if (Math.abs(g.y - gate.y) < 20) {
                        g.markForDeletion = true;
                    }
                });
            }
        });
    }

    destroy() {
        this.entities = [];
    }
}