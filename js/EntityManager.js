// js/EntityManager.js
import { Player, Enemy, Projectile, Gate, Collectible } from './entities.js';
import { ExplosionEntity } from './Explosion.js';
import { checkAABB } from './physics.js';
import { Spawner } from './Spawner.js';

export class EntityManager {
    constructor(assets) {
        this.entities = [];
        this.assets = assets;
        this.spawner = new Spawner();
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    update(dt, playerX) {
        this.entities.forEach(entity => entity.update(dt, playerX, this));
        this.spawner.update(dt, this);

        this.handleCollisions();

        // Cleanup deleted entities
        this.entities = this.entities.filter(entity => !entity.markForDeletion);
    }

    // Helper method to keep code DRY
    spawnLoot(x, y) {
        const availableStats = ['DAMAGE', 'FIRE_RATE'];
        const selectedStat = availableStats[Math.floor(Math.random() * availableStats.length)];
        const statValue = selectedStat === 'DAMAGE' ? 1 : 50;

        this.addEntity(new Collectible(x, y, this.assets.getImage('props'), selectedStat, statValue));
    }

    // Custom AABB check to extend the hitbox in a specific direction (upwards for forgiving pickups)
    checkExtendedCollision(player, entity, extendTop) {
        const pLeft = player.x - player.width / 2;
        const pRight = player.x + player.width / 2;
        const pTop = player.y - player.height / 2;
        const pBottom = player.y + player.height / 2;

        const eLeft = entity.x - entity.width / 2;
        const eRight = entity.x + entity.width / 2;
        // Extend the top boundary (smaller Y value in Canvas)
        const eTop = (entity.y - entity.height / 2) - extendTop;
        const eBottom = entity.y + entity.height / 2;

        return pLeft < eRight && pRight > eLeft && pTop < eBottom && pBottom > eTop;
    }

    handleCollisions() {
        const projectiles = this.entities.filter(e => e instanceof Projectile);
        const enemies = this.entities.filter(e => e instanceof Enemy);
        const collectibles = this.entities.filter(e => e instanceof Collectible);
        const gates = this.entities.filter(e => e instanceof Gate);
        const player = this.entities.find(e => e instanceof Player);

        if (!player) return;

        // 1. Projectiles vs Enemies
        projectiles.forEach(projectile => {
            if (projectile.markForDeletion) return;

            enemies.forEach(enemy => {
                if (enemy.markForDeletion) return;

                if (checkAABB(projectile, enemy)) {
                    projectile.markForDeletion = true;
                    enemy.hp -= projectile.damage;

                    if (enemy.hp <= 0) {
                        enemy.markForDeletion = true;
                        this.addEntity(new ExplosionEntity(enemy.x, enemy.y, this.assets.getImage('props')));

                        // 100% drop rate via DRY method
                        this.spawnLoot(enemy.x, enemy.y);
                    }
                }
            });
        });

        // 2. Enemy vs Player
        enemies.forEach(enemy => {
            if (enemy.markForDeletion) return;

            if (checkAABB(player, enemy)) {
                enemy.markForDeletion = true;
                this.addEntity(new ExplosionEntity(enemy.x, enemy.y, this.assets.getImage('props')));

                // Spawn drop even on physical collision
                this.spawnLoot(enemy.x, enemy.y);

                player.stats.hp -= enemy.hp;

                if (player.stats.hp <= 0) {
                    console.log("GAME OVER - Player HP reached 0");
                    player.markForDeletion = true;
                }
            }
        });

        // 3. Player vs Collectibles
        collectibles.forEach(collectible => {
            if (collectible.markForDeletion) return;

            // Ignore collision if the item is in its immunity frame
            if (collectible.pickupDelay > 0) return;

            // Use extended collision : adds 60px of invisible hitbox upwards
            if (this.checkExtendedCollision(player, collectible, 60)) {
                collectible.markForDeletion = true;
                collectible.effectDef.apply(player, collectible.value);
            }
        });

        // 4. Player vs Gates
        gates.forEach(gate => {
            if (gate.markForDeletion) return;

            if (checkAABB(player, gate)) {
                // Destroy all gates from this row
                gates.forEach(g => g.markForDeletion = true);
            }
        });
    }

    draw(ctx) {
        const sortedEntities = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
        sortedEntities.forEach(entity => entity.draw(ctx));
    }
}