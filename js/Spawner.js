// js/Spawner.js
import { Enemy } from './Enemy.js';
import { Gate } from './Gate.js';
import { Collectible } from './Collectible.js';
import { GameConfig } from './GameConfig.js';
import { gameEvents, EVENTS } from './EventBus.js'; // Import EventBus

export class Spawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 1200; 
        this.spawnCount = 0;       
        this.gateFrequency = 5;    

        // Listen for enemy deaths to spawn loot dynamically
        gameEvents.on(EVENTS.ENEMY_DESTROYED, (payload) => {
            this.spawnLoot(payload.entityManager, payload.x, payload.y);
        });
    }

    update(dt, entityManager) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCount++;

            if (this.spawnCount % this.gateFrequency === 0) {
                this.spawnGates(entityManager);
            } else {
                this.spawnEnemy(entityManager);
            }
        }
    }

    spawnEnemy(entityManager) {
        const randomLaneIndex = Math.floor(Math.random() * GameConfig.ENEMY_LANES.length);
        const x = GameConfig.ENEMY_LANES[randomLaneIndex];
        const scaledHp = GameConfig.calculateEnemyHp(this.spawnCount);
        entityManager.addEntity(new Enemy(x, -200, entityManager.assets.getImage('ships'), scaledHp));
    }

    spawnGates(entityManager) {
        GameConfig.GATE_LANES.forEach(x => {
            entityManager.addEntity(new Gate(x, -200));
        });
    }

    spawnLoot(entityManager, x, y) {
        const availableStats = ['DAMAGE', 'FIRE_RATE'];
        const selectedStat = availableStats[Math.floor(Math.random() * availableStats.length)];
        const statValue = selectedStat === 'DAMAGE' ? 1 : 50;

        entityManager.addEntity(new Collectible(x, y, entityManager.assets.getImage('props'), selectedStat, statValue));
    }
}