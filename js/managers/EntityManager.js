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
import { SuperCollectible } from '../entities/SuperCollectible.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js';

export class EntityManager {
    constructor(assets) {
        this.assets = assets;
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * Updates all entities and processes interactions.
     * @param {number} dt - Delta time
     * @param {number} playerX - Current pointer/player X position
     * @param {number} currentWave - Current game wave for dynamic scaling
     */
    update(dt, playerX, currentWave = 1) {
        this.entities.forEach(entity => entity.update(dt, playerX, this));
        this.handleCollisions(currentWave);
        this.processDeaths(); 
        this.entities = this.entities.filter(entity => !entity.markForDeletion);
    }

    draw(ctx) {
        const sortedEntities = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
        sortedEntities.forEach(entity => entity.draw(ctx));
    }

    // ============================================================================
    // COLLISION DETECTION
    // ============================================================================

    handleCollisions(currentWave) {
        const projectiles = this.entities.filter(e => e instanceof Projectile || e instanceof HomingProjectile);
        const enemies = this.entities.filter(e => e instanceof Enemy || e instanceof Boss);
        const collectibles = this.entities.filter(e => e instanceof Collectible);
        const gates = this.entities.filter(e => e instanceof Gate);
        const superCollectibles = this.entities.filter(e => e instanceof SuperCollectible);
        const player = this.entities.find(e => e instanceof Player);

        if (!player) return;

        // A. Projectiles vs Enemies (Damage application)
        projectiles.forEach(projectile => {
            if (projectile.markForDeletion) return;

            enemies.forEach(enemy => {
                if (enemy.markForDeletion || enemy.hp <= 0) return; 
                if (enemy.y < 0) return; // Invincibility frame while entering screen

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

        // B. Enemies vs Player (Ramming damage)
        enemies.forEach(enemy => {
            if (enemy.markForDeletion || enemy.hp <= 0) return;

            if (checkAABB(player, enemy)) {
                // 1. Save remaining HP as ramming damage before killing the enemy
                const rammingDamage = enemy.hp;
                
                // 2. Set to 0 to trigger explosion and loot in processDeaths()
                enemy.hp = 0; 
                
                // 3. Apply damage to player
                player.stats.hp -= rammingDamage; 
                
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'player_hit', volume: 0.8 });

                if (player.stats.hp <= 0) {
                    player.markForDeletion = true;
                    gameEvents.emit(EVENTS.PLAYER_DEAD, { x: player.x, y: player.y });
                }
            }
        });

        // C. Player vs Collectibles (Standard drops)
        collectibles.forEach(collectible => {
            if (collectible.markForDeletion || collectible.pickupDelay > 0) return;

            if (checkExtendedAABB(player, collectible, 60)) {
                collectible.markForDeletion = true;
                
                // Apply logic dynamically from centralized config
                if (UpgradesConfig.LOGIC[collectible.type]) {
                    UpgradesConfig.LOGIC[collectible.type](player, collectible.bonusValue, currentWave);
                }
                
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.7 });
            }
        });

        // D. Player vs Gates (Portal upgrades)
        gates.forEach(gate => {
            if (gate.markForDeletion) return;

            if (checkAABB(player, gate)) {
                
                // Apply logic dynamically from centralized config
                if (UpgradesConfig.LOGIC[gate.bonusType]) {
                    UpgradesConfig.LOGIC[gate.bonusType](player, gate.bonusValue, currentWave);
                }

                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'bonus', volume: 0.8 });

                // Destroy adjacent gates on the same Y axis
                gates.forEach(g => {
                    if (Math.abs(g.y - gate.y) < 20) {
                        g.markForDeletion = true;
                    }
                });
            }
        });

        // E. Player vs Super Collectibles (Boss drops)
        superCollectibles.forEach(superLoot => {
            if (superLoot.markForDeletion) return;

            // Small delay to prevent instant pickup
            if (superLoot.aliveTime < 1000) return; 

            if (checkAABB(player, superLoot)) {
                superLoot.markForDeletion = true;
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'super_bonus', volume: 1.0 });
                
                // Pass currentWave to UI to determine which upgrade pool to draw from (Archetypes vs Enhancements)
                gameEvents.emit(EVENTS.SUPER_LOOT_PICKUP, { 
                    player: player,
                    wave: currentWave
                });
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
                
                enemy.markForDeletion = true;
                
                gameEvents.emit(EVENTS.PLAY_SFX, { id: 'explosion', volume: 0.6 });

                // Spawn boss loot
                if (enemy.isBoss) {
                    this.addEntity(new SuperCollectible(enemy.x, enemy.y));
                }

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