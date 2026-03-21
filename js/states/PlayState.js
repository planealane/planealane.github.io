// js/states/PlayState.js
import { State } from './State.js';
import { GameConfig } from '../GameConfig.js';
import { EntityManager } from '../managers/EntityManager.js';
import { Player } from '../entities/Player.js';
import { UIConfig } from '../ui/UIConfig.js';

export class PlayState extends State {
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        // 1. Clean up the previous game world to prevent EventBus memory leaks
        // This is done here instead of exit() so GameOverState can still render the dying world
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.destroy();
        }

        // 2. Initialize the new game world
        this.gameManager.entityManager = new EntityManager(this.gameManager.assets);
        this.gameManager.entityManager.addEntity(new Player(this.gameManager.assets.getImage('ships')));
        
        // 3. Reset global time scale
        this.gameManager.timeScale = 1.0;
        
        // 4. Setup opening transition animation
        this.isOpening = true;
        this.openingStartTime = performance.now();
        this.maxFillRadius = Math.sqrt(this.gameManager.canvas.width ** 2 + this.gameManager.canvas.height ** 2);
    }

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        // Debug: Cycle player plane variant with 'C' key
        if (this.gameManager.inputManager.isKeyDown('c')) {
            const player = this.gameManager.entityManager.entities.find(ent => ent instanceof Player);
            if (player) {
                player.setVariant(player.currentVariant + 1);
            }
        }

        // Update core game logic (Entities, Physics)
        if (dt < 100) {
            this.gameManager.entityManager.update(dt * this.gameManager.timeScale, pointer.x);
        }
    }

    draw(ctx) {
        // 1. Draw the game world
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        // 2. Draw opening transition overlay
        if (this.isOpening) {
            const elapsed = performance.now() - this.openingStartTime;
            const progress = Math.min(1, Math.max(0, elapsed / UIConfig.ANIMATIONS.OPEN_DURATION_MS));
            const radius = this.maxFillRadius * progress;

            const width = this.gameManager.canvas.width;
            const height = this.gameManager.canvas.height;

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();

            if (progress === 1) this.isOpening = false;
        }
    }
}