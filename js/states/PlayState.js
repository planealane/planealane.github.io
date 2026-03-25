// js/states/PlayState.js
import { State } from './State.js';
import { EntityManager } from '../managers/EntityManager.js';
import { Player } from '../entities/Player.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { GameOverOverlay } from '../ui/GameOverOverlay.js';
import { SuperUpgradeOverlay } from '../ui/SuperUpgradeOverlay.js';
import { VFXManager } from '../managers/VFXManager.js';
import { ProgressUI } from '../ui/ProgressUI.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class PlayState extends State {

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        // 1. Clean up previous instances to prevent memory leaks
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.destroy();
        }
        if (this.spawner) {
            this.spawner.destroy();
        }
        if (this.vfxManager) {
            this.vfxManager.destroy();
        }

        // 2. State configuration
        this.phase = 'PLAYING'; // 'PLAYING' | 'GAMEOVER_SEQUENCE' | 'UPGRADE_SEQUENCE'
        this.gameOverOverlay = new GameOverOverlay(this.gameManager);

        // Initialize the Super Upgrade Overlay with a callback to resume the game
        this.superUpgradeOverlay = new SuperUpgradeOverlay(this.gameManager, () => {
            this.resumeGameplay();
        });

        // 3. Initialize the new game world
        this.gameManager.entityManager = new EntityManager(this.gameManager.assets);
        this.gameManager.entityManager.addEntity(new Player(this.gameManager.assets.getImage('ships')));
        this.spawner = new SpawnManager();
        this.vfxManager = new VFXManager(this.gameManager.assets);
        this.progressUI = new ProgressUI(this.gameManager.canvas.height, this.gameManager.assets);

        // 4. Reset global time scale
        this.gameManager.timeScale = 1.0;

        // 5. Audio
        this.gameManager.audioManager.playMusic('main-theme', 0.4, 2000);

        // 6. Bind events
        this.onPlayerDead = this.onPlayerDead.bind(this);
        gameEvents.on(EVENTS.PLAYER_DEAD, this.onPlayerDead);

        this.onSuperLootPickup = this.onSuperLootPickup.bind(this);
        gameEvents.on(EVENTS.SUPER_LOOT_PICKUP, this.onSuperLootPickup);
    }

    exit() {
        // Unbind to prevent zombie listeners if state is destroyed
        gameEvents.off(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.off(EVENTS.SUPER_LOOT_PICKUP, this.onSuperLootPickup);

        if (this.vfxManager) {
            this.vfxManager.destroy();
        }
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    onPlayerDead() {
        if (this.phase === 'GAMEOVER_SEQUENCE') return;

        this.phase = 'GAMEOVER_SEQUENCE';
        this.gameManager.timeScale = 0.25; // Initial slow-mo hit
        this.gameOverOverlay.start();
    }

    onSuperLootPickup(data) {
        if (this.phase !== 'PLAYING') return;

        this.phase = 'UPGRADE_SEQUENCE';

        // ON NE TOUCHE PLUS AU timeScale ICI !
        // On lance juste l'overlay.
        this.superUpgradeOverlay.start(data.player);
    }

    resumeGameplay() {
        this.phase = 'PLAYING';
        // Plus besoin de restaurer le timeScale non plus
    }
    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        if (dt > 100) return;

        if (this.gameManager.inputManager.isKeyDown('c')) {
            const player = this.gameManager.entityManager.entities.find(ent => ent.constructor.name === 'Player');
            if (player) player.setVariant(player.currentVariant + 1);
        }

        let shouldUpdateWorld = false;
        let currentScaledDt = 0; // Default to 0

        // 2. Phase Management
        if (this.phase === 'PLAYING') {
            shouldUpdateWorld = true;
            currentScaledDt = dt * this.gameManager.timeScale;
        }
        else if (this.phase === 'GAMEOVER_SEQUENCE') {
            const elapsed = performance.now() - this.gameOverOverlay.startTime;

            if (elapsed <= 2000) {
                this.gameManager.timeScale = 0.25;
                shouldUpdateWorld = true;
                currentScaledDt = dt * this.gameManager.timeScale;
            } else {
                shouldUpdateWorld = false;
                currentScaledDt = 0; // Explicitly freeze time
            }

            this.gameOverOverlay.update(dt, pointer);
        }
        else if (this.phase === 'UPGRADE_SEQUENCE') {
            shouldUpdateWorld = false;
            currentScaledDt = 0;
            this.superUpgradeOverlay.update(dt, pointer);
        }

        // 3. World & Entities Execution
        if (shouldUpdateWorld) {
            this.gameManager.entityManager.update(currentScaledDt, pointer.x);

            if (this.phase === 'PLAYING' && this.spawner) {
                this.spawner.update(currentScaledDt, this.gameManager.entityManager);
                const ratio = this.spawner.getProgressRatio();
                this.progressUI.updateRatio(ratio);
            }
        }

        // 4. VFX Execution (Outside the freeze block)
        if (this.vfxManager) {
            // Passes 0 for particles (they freeze), but raw dt for camera shake (it dissipates)
            this.vfxManager.update(currentScaledDt, dt);
        }

        if (this.progressUI) {
            this.progressUI.update(dt);
        }
    }

    draw(ctx) {
        // ==========================================
        // CAMERA SHAKE BLOCK (World only)
        // ==========================================
        ctx.save();

        if (this.vfxManager) {
            const shake = this.vfxManager.getShakeOffset();
            ctx.translate(shake.x, shake.y);
        }

        // 1. Draw the game world (Stays rendered in background even if frozen)
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        // 2. Draw VFX on top of entities
        if (this.vfxManager) {
            this.vfxManager.draw(ctx);
        }

        ctx.restore();
        // ==========================================
        // END CAMERA SHAKE
        // ==========================================

        // 3. Draw Persistent Game UI
        if (this.phase === 'PLAYING' && this.progressUI) {
            this.progressUI.draw(ctx);
        }

        // 4. Draw Game Over UI on top of everything
        if (this.phase === 'GAMEOVER_SEQUENCE') {
            this.gameOverOverlay.draw(ctx);
        }

        // 5. Draw Super Upgrade Overlay on top of everything
        if (this.phase === 'UPGRADE_SEQUENCE') {
            this.superUpgradeOverlay.draw(ctx);
        }
    }
}