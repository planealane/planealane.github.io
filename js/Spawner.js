// js/Spawner.js
import { Enemy, Gate } from './entities.js';
import { GameConfig } from './GameConfig.js';

export class Spawner {
    constructor() {
        this.enemyTimer = 0;
        this.enemyInterval = 1000; // Spawn 1 enemy every second for testing

        this.gateTimer = 0;
        this.gateInterval = 6000; // Spawn gates every 6 seconds
    }

    update(dt, entityManager) {
        // Enemy spawning logic
        this.enemyTimer += dt;
        if (this.enemyTimer >= this.enemyInterval) {
            this.enemyTimer = 0;
            this.spawnEnemy(entityManager);
        }

        // Gate spawning logic
        this.gateTimer += dt;
        if (this.gateTimer >= this.gateInterval) {
            this.gateTimer = 0;
            this.spawnGates(entityManager);
        }
    }

    spawnEnemy(entityManager) {
        // Pick a random lane from the 4 available
        const randomLaneIndex = Math.floor(Math.random() * GameConfig.ENEMY_LANES.length);
        const x = GameConfig.ENEMY_LANES[randomLaneIndex];
        
        entityManager.addEntity(new Enemy(x, -100, entityManager.assets.getImage('ships')));
    }

    spawnGates(entityManager) {
        // Spawn a gate on both lanes simultaneously
        GameConfig.GATE_LANES.forEach(x => {
            entityManager.addEntity(new Gate(x, -200));
        });
    }
}