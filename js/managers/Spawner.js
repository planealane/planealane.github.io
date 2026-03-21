// js/managers/Spawner.js
import { Enemy } from '../entities/Enemy.js';
import { Gate } from '../entities/Gate.js';
import { Collectible } from '../entities/Collectible.js';
import { GameConfig } from '../GameConfig.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class Spawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 1200; 
        this.spawnCount = 0;       
        this.gateFrequency = 5;    

        // Bind the method to maintain a stable reference for the EventBus
        this.onEnemyDestroyed = this.onEnemyDestroyed.bind(this);
        gameEvents.on(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
    }

    // Callback method
    onEnemyDestroyed(payload) {
        this.spawnLoot(payload.entityManager, payload.x, payload.y);
    }

    /**
     * Cleans up event listeners to prevent memory leaks and duplicate triggers.
     */
    destroy() {
        gameEvents.off(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
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