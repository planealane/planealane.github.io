// js/states/PlayState.js
import { State } from './State.js';
import { EntityManager } from '../managers/EntityManager.js';
import { Player } from '../entities/Player.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { GameOverOverlay } from '../ui/GameOverOverlay.js';
import { SuperUpgradeOverlay } from '../ui/SuperUpgradeOverlay.js';
import { TutorialOverlay } from '../ui/TutorialOverlay.js'; // [NOUVEAU] Import du tuto
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
        // [NOUVEAU] On démarre directement dans la séquence de tutoriel
        this.phase = 'TUTORIAL_SEQUENCE';
        this.gameOverOverlay = new GameOverOverlay(this.gameManager);

        // Initialize the Super Upgrade Overlay
        this.superUpgradeOverlay = new SuperUpgradeOverlay(this.gameManager, (upgradeColor) => {
            this.resumeGameplay(upgradeColor);
        });

        this.tutorialOverlay = new TutorialOverlay(this.gameManager, () => {
            this.phase = 'PLAYING'; // Démarre la vraie partie quand on ferme le tuto
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

        // 7. Déclencher le fondu d'entrée
        gameEvents.emit(EVENTS.SCREEN_FADE, {
            duration: 600,
            startAlpha: 1.0,
            endAlpha: 0.0,
            color: '#000000'
        });

        this.tutorialStartTimer = 600;
    }

    exit() {
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
        this.gameManager.timeScale = 0.25;
        this.gameOverOverlay.start();
    }

    onSuperLootPickup(data) {
        if (this.phase !== 'PLAYING') return;
        this.phase = 'UPGRADE_SEQUENCE';
        this.superUpgradeOverlay.start(data);
    }

    resumeGameplay(upgradeColor = '#ffffff') {
        if (this.phase === 'UPGRADE_SEQUENCE') {
            gameEvents.emit(EVENTS.SPEED_LINES, {
                duration: 2500,
                color: upgradeColor
            });
        }
        this.phase = 'PLAYING';
    }

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
        let currentScaledDt = 0;

        // Phase Management
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
                currentScaledDt = 0;
            }
            this.gameOverOverlay.update(dt, pointer);
        }
        else if (this.phase === 'UPGRADE_SEQUENCE') {
            shouldUpdateWorld = false;
            currentScaledDt = 0;
            this.superUpgradeOverlay.update(dt, pointer);
        }
        // Gestion de la phase de tutoriel
        else if (this.phase === 'TUTORIAL_SEQUENCE') {
            shouldUpdateWorld = false;
            currentScaledDt = 0;

            // 1. Gérer le délai avant l'affichage
            if (this.tutorialStartTimer > 0) {
                this.tutorialStartTimer -= dt;

                // Quand le timer atteint 0, on lance enfin le tutoriel
                if (this.tutorialStartTimer <= 0) {
                    this.tutorialOverlay.start();
                }
            }
            // 2. Mettre à jour le tutoriel s'il est actif
            else {
                this.tutorialOverlay.update(dt, pointer);
            }
        }
        // World & Entities Execution
        if (shouldUpdateWorld) {
            const currentWave = this.spawner ? this.spawner.blocksSpawned : 1;

            this.gameManager.entityManager.update(currentScaledDt, pointer.x, currentWave);
            if (this.phase === 'PLAYING' && this.spawner) {
                this.spawner.update(currentScaledDt, this.gameManager.entityManager);
                const ratio = this.spawner.getProgressRatio();
                this.progressUI.updateRatio(ratio);
            }
        }

        if (this.vfxManager) {
            this.vfxManager.update(currentScaledDt, dt);
        }

        if (this.progressUI) {
            this.progressUI.update(dt);
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.vfxManager) {
            const shake = this.vfxManager.getShakeOffset();
            ctx.translate(shake.x, shake.y);
        }

        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        if (this.vfxManager) {
            this.vfxManager.draw(ctx);
        }

        ctx.restore();

        if (this.phase === 'PLAYING' && this.progressUI) {
            this.progressUI.draw(ctx);
        }

        if (this.phase === 'GAMEOVER_SEQUENCE') {
            this.gameOverOverlay.draw(ctx);
        }

        if (this.phase === 'UPGRADE_SEQUENCE') {
            this.superUpgradeOverlay.draw(ctx);
        }

        if (this.phase === 'TUTORIAL_SEQUENCE') {
            this.tutorialOverlay.draw(ctx);
        }
    }
}