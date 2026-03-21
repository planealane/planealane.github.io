// js/managers/Spawner.js
import { Enemy } from '../entities/Enemy.js';
import { Gate } from '../entities/Gate.js';
import { Boss } from '../entities/Boss.js';
import { Collectible } from '../entities/Collectible.js';
import { GameConfig } from '../GameConfig.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { getBossDef } from '../config/BossConfig.js';
import { LevelProgression } from '../config/LevelProgression.js';

export class Spawner {
    constructor() {
        // Distance in pixels between each row. Adjust to fit your screen height perfectly.
        this.rowSpacing = 300; 
        
        // A block consists of 5 rows (Row 0 to 4). To connect Block 1 to Block 2 smoothly, 
        // the trigger distance must be exactly 5 times the row spacing.
        this.blockHeight = 5 * this.rowSpacing; 

        // Initialize at max value to force an immediate spawn on the very first frame
        this.scrollAccumulator = this.blockHeight; 

        this.difficultyLevel = 1;
        this.pendingEncounters = [];

        // Progression tracking system
        this.blocksSpawned = 0;
        this.currentMilestoneIndex = 0;

        this.onEnemyDestroyed = this.onEnemyDestroyed.bind(this);
        gameEvents.on(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
    }

    destroy() {
        gameEvents.off(EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed);
    }

    queueEncounter(encounterData) {
        this.pendingEncounters.push(encounterData);
    }

    update(dt, entityManager) {
        // Calculate exact distance scrolled this frame rather than relying on an abstract timer
        const distanceScrolled = GameConfig.SCROLL_SPEED * dt;
        this.scrollAccumulator += distanceScrolled;

        if (this.scrollAccumulator >= this.blockHeight) {
            // Keep the remainder (overshoot) to guarantee pixel-perfect spacing across frames
            const overshoot = this.scrollAccumulator - this.blockHeight;
            this.scrollAccumulator = overshoot;
            
            // Track progression and queue bosses BEFORE generating the current block
            this.blocksSpawned++;
            this.checkProgression();
            
            this.spawnBlock(entityManager, overshoot);
            
            // Soft difficulty scaling per block
            this.difficultyLevel += 0.25; 
        }
    }

    /**
     * Checks if the current block matches a milestone in the progression data.
     * Enforces the macro-loop independently.
     */
    checkProgression() {
        if (this.currentMilestoneIndex >= LevelProgression.length) return;

        const nextMilestone = LevelProgression[this.currentMilestoneIndex];

        if (this.blocksSpawned === nextMilestone.blockIndex) {
            this.queueEncounter(nextMilestone);
            this.currentMilestoneIndex++;
        }
    }

    spawnBlock(entityManager, overshoot = 0) {
        // Offset startY by the overshoot to maintain the exact continuous spacing
        const startY = -150 - overshoot; 

        // Row 0: Always the Gate
        GameConfig.GATE_LANES.forEach(x => {
            entityManager.addEntity(new Gate(x, startY));
        });

        const hasBoss = this.pendingEncounters.length > 0;
        const encounter = hasBoss ? this.pendingEncounters.shift() : null;

        if (hasBoss) {
            // Boss Block: Rows 1 to 3 for standard enemies, Row 4 for the Boss
            this.spawnEnemiesInRows(entityManager, startY, this.rowSpacing, [1, 2, 3], 1, 3);
            this.spawnBoss(entityManager, encounter, startY - (4 * this.rowSpacing));
        } else {
            // Standard Block: Rows 1 to 4 for standard enemies
            this.spawnEnemiesInRows(entityManager, startY, this.rowSpacing, [1, 2, 3, 4], 2, 4);
        }
    }

    spawnEnemiesInRows(entityManager, startY, rowSpacing, availableRows, minEnemies, maxEnemies) {
        const enemyCount = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;
        
        const selectedRows = availableRows.sort(() => 0.5 - Math.random()).slice(0, enemyCount);

        selectedRows.forEach(rowIndex => {
            const randomLaneIndex = Math.floor(Math.random() * GameConfig.ENEMY_LANES.length);
            const x = GameConfig.ENEMY_LANES[randomLaneIndex];
            const y = startY - (rowIndex * rowSpacing);
            
            const scaledHp = GameConfig.calculateEnemyHp(Math.floor(this.difficultyLevel));
            entityManager.addEntity(new Enemy(x, y, entityManager.assets.getImage('ships'), scaledHp));
        });
    }

    spawnBoss(entityManager, encounterData, yPosition) {
        const x = GameConfig.GAME_WIDTH / 2;
        const bossDef = getBossDef(encounterData);
        const scaledHp = bossDef.baseHp * Math.floor(this.difficultyLevel);
        const bossImage = entityManager.assets.getImage(bossDef.assetKey);

        const boss = new Boss(x, yPosition, bossImage, scaledHp, bossDef);
        boss.encounterData = encounterData;

        entityManager.addEntity(boss);
    }

    onEnemyDestroyed(payload) {
        if (payload.entity && payload.entity.isBoss) return;
        this.spawnLoot(payload.entityManager, payload.x, payload.y);
    }

    spawnLoot(entityManager, x, y) {
        const availableStats = ['DAMAGE', 'FIRE_RATE'];
        const selectedStat = availableStats[Math.floor(Math.random() * availableStats.length)];
        const statValue = selectedStat === 'DAMAGE' ? 1 : 50;

        entityManager.addEntity(new Collectible(x, y, entityManager.assets.getImage('props'), selectedStat, statValue));
    }
}