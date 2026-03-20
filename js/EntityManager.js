// js/EntityManager.js
import { Player, Enemy, Projectile, Gate } from './entities.js'; // Import Gate
import { ExplosionEntity } from './Explosion.js';
import { checkAABB } from './physics.js';
import { GameConfig } from './GameConfig.js';
import { Spawner } from './Spawner.js'; // Import Spawner

export class EntityManager {
    constructor(assets) {
        this.entities = [];
        this.assets = assets;
        
        // Initialize the new Spawner, remove old spawn timers
        this.spawner = new Spawner();
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    update(dt, playerX) {
        this.entities.forEach(entity => entity.update(dt, playerX, this));

        // Delegate spawning responsibility
        this.spawner.update(dt, this);

        // Resolve Collisions
        const projectiles = this.entities.filter(e => e instanceof Projectile);
        const enemies = this.entities.filter(e => e instanceof Enemy);
        const gates = this.entities.filter(e => e instanceof Gate);
        const player = this.entities.find(e => e instanceof Player);

        // Projectiles vs Enemies
        projectiles.forEach(projectile => {
            enemies.forEach(enemy => {
                if (projectile.markForDeletion || enemy.markForDeletion) return;
                
                if (checkAABB(projectile, enemy)) {
                    projectile.markForDeletion = true;
                    enemy.markForDeletion = true;
                    this.addEntity(new ExplosionEntity(enemy.x, enemy.y, this.assets.getImage('props')));
                }
            });
        });

        // Player vs Gates (Disappear on touch, simulating the "choice")
        if (player) {
            gates.forEach(gate => {
                if (gate.markForDeletion) return;

                if (checkAABB(player, gate)) {
                    // When touching one gate, mark all currently visible gates for deletion
                    gates.forEach(g => g.markForDeletion = true);
                }
            });
        }

        this.entities = this.entities.filter(entity => !entity.markForDeletion);
    }

    draw(ctx) {
        const sortedEntities = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
        sortedEntities.forEach(entity => entity.draw(ctx));
    }
}