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

update(dt, pointer) {
        // Debug: Cycle player plane variant with 'C' key
        if (this.gameManager.inputManager.isKeyDown('c')) {
            const player = this.gameManager.entityManager.entities.find(ent => ent.constructor.name === 'Player');
            if (player) {
                player.setVariant(player.currentVariant + 1);
            }
        }

        // Phase: Game Over Sequence
        if (this.phase === 'GAMEOVER_SEQUENCE') {
            const elapsed = performance.now() - this.gameOverOverlay.startTime;

            if (elapsed > 2000) {
                // Drain timescale using real time (dt). Will reach 0 smoothly.
                this.gameManager.timeScale = Math.max(0, this.gameManager.timeScale - dt * 0.001);
            } else {
                // Lock at 25% speed for exactly 2 seconds. Explosions will finish normally.
                this.gameManager.timeScale = 0.25;
            }

            this.gameOverOverlay.update(dt, pointer);
        }

        // Phase: Upgrade Sequence
        if (this.phase === 'UPGRADE_SEQUENCE') {
            // Update the overlay logic (clicks, animations) using real time (dt)
            this.superUpgradeOverlay.update(dt, pointer);
        }

        // Apply timescale to delta time ONLY ONCE
        if (dt < 100) {
            const scaledDt = dt * this.gameManager.timeScale;

            // Only update game entities and spawner if we are actively playing
            if (this.phase === 'PLAYING') {
                if (this.gameManager.timeScale > 0) {
                    this.gameManager.entityManager.update(scaledDt, pointer.x);
                    this.vfxManager.update(scaledDt); // Updates particles with slow-motion
                }

                if (this.spawner) {
                    this.spawner.update(scaledDt, this.gameManager.entityManager);
                    const ratio = this.spawner.getProgressRatio();
                    this.progressUI.updateRatio(ratio);
                }
            }

            // Progress UI smooth animation updates using scaledDt
            if (this.progressUI) {
                this.progressUI.update(scaledDt);
            }
        }
    }
    draw(ctx) {
        // 1. Draw the game world (Stays rendered in background even if frozen)
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        // 2. Draw VFX on top of entities
        if (this.vfxManager) {
            this.vfxManager.draw(ctx);
        }

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