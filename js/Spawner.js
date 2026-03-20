// js/Spawner.js
import { Enemy, Gate } from './entities.js';
import { GameConfig } from './GameConfig.js';

export class Spawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 1200; // 1 tick toutes les 1.2 secondes

        this.spawnCount = 0;
        this.gateFrequency = 5; // Toutes les 5 rangées, on fait spawn des portes
    }

    update(dt, entityManager) {
        this.spawnTimer += dt;

        // Le "Tick" global
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCount++;

            // Logique exclusive : soit des portes, soit un ennemi
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

        // Calculate HP based on current spawn count
        const scaledHp = GameConfig.calculateEnemyHp(this.spawnCount);

        entityManager.addEntity(new Enemy(x, -200, entityManager.assets.getImage('ships'), scaledHp));
    }

    spawnGates(entityManager) {
        GameConfig.GATE_LANES.forEach(x => {
            // Spawn exactement à la même hauteur initiale que les ennemis
            entityManager.addEntity(new Gate(x, -200));
        });
    }
}