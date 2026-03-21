// js/EntityManager.js
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Gate } from '../entities/Gate.js';
import { Collectible } from '../entities/Collectible.js';
import { ExplosionEntity } from '../entities/Explosion.js';
import { checkAABB, checkExtendedAABB } from '../core/Physics.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { Boss } from '../entities/Boss.js';

export class EntityManager {
    constructor(assets) {
        this.assets = assets;
        this.entities = [];
        // LIGNE SUPPRIMÉE: this.spawner = new Spawner();
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    update(dt, playerX) {
        this.entities.forEach(entity => entity.update(dt, playerX, this));
        // LIGNE SUPPRIMÉE: this.spawner.update(dt, this);
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

// ============================================================================
    // COLLISION DETECTION (Decoupled via EventBus)
    // ============================================================================

    handleCollisions() {
        const projectiles = this.entities.filter(e => e instanceof Projectile);
        // Include both standard enemies and bosses in the collision pool
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
                    
                    if (enemy.onHit) enemy.onHit(); // Specific juice (like Boss scale)

                    if (enemy.hp <= 0) {
                        enemy.markForDeletion = true;
                        this.addEntity(new ExplosionEntity(enemy.x, enemy.y, this.assets.getImage('props')));

                        // [EVENT] Play explosion sound
                        gameEvents.emit(EVENTS.PLAY_SFX, { id: 'explosion', volume: 0.6 });
                        
                        // [EVENT] Notify the game that an enemy died
                        gameEvents.emit(EVENTS.ENEMY_DESTROYED, { x: enemy.x, y: enemy.y, entityManager: this });
                    }
                }
            });
        });

        // B. Enemies vs Player
        enemies.forEach(enemy => {
            if (enemy.markForDeletion) return;

            if (checkAABB(player, enemy)) {
                enemy.markForDeletion = true;
                this.addEntity(new ExplosionEntity(enemy.x, enemy.y, this.assets.getImage('props')));

                // L'ennemi meurt, on notifie le jeu (pour le score/loot) mais ON NE JOUE PAS son son d'explosion
                gameEvents.emit(EVENTS.ENEMY_DESTROYED, { x: enemy.x, y: enemy.y, entityManager: this });

                player.stats.hp -= enemy.hp;

                // [PRIORITÉ AUDIO] On joue uniquement le son de dégât du joueur
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'player_hit', volume: 0.8 });

                if (player.stats.hp <= 0) {
                    this.addEntity(new ExplosionEntity(player.x, player.y, this.assets.getImage('props')));
                    player.markForDeletion = true;

                    // Notifier le GameManager de la mort
                    gameEvents.emit(EVENTS.PLAYER_DEAD);
                }
            }
        });

        // C. Player vs Collectibles
        collectibles.forEach(collectible => {
            if (collectible.markForDeletion || collectible.pickupDelay > 0) return;

            if (checkExtendedAABB(player, collectible, 60)) {
                collectible.markForDeletion = true;
                collectible.effectDef.apply(player, collectible.value);
                
                // [EVENT] Play bonus sound
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.7 });
            }
        });

        // D. Player vs Gates
        gates.forEach(gate => {
            if (gate.markForDeletion) return;

            if (checkAABB(player, gate)) {
                // 1. Apply bonus
                gate.applyBonus(player);

                // [EVENT] Play bonus sound for gate
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.8 });

                // 2. Destroy sibling gates
                gates.forEach(g => {
                    if (Math.abs(g.y - gate.y) < 20) {
                        g.markForDeletion = true;
                    }
                });
            }
        });
    }
    /**
     * Cleans up child managers and prevents lingering event subscriptions.
     */
    destroy() {
        this.entities = [];
    }
}