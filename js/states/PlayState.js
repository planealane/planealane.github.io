// js/states/PlayState.js
import { State } from './State.js';
import { EntityManager } from '../managers/EntityManager.js';
import { Player } from '../entities/Player.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { GameOverOverlay } from '../ui/GameOverOverlay.js';
import { SuperUpgradeOverlay } from '../ui/SuperUpgradeOverlay.js';
import { TutorialOverlay } from '../ui/TutorialOverlay.js'; 
import { VFXManager } from '../managers/VFXManager.js';
import { ProgressUI } from '../ui/ProgressUI.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { UIConfig } from '../UIConfig.js'; // 🔄 Ajout de l'import

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
        const config = UIConfig.SCREENS.IN_GAME.TIMING; // 🔄 Raccourci de config

        this.phase = 'TUTORIAL_SEQUENCE';
        this.gameOverOverlay = new GameOverOverlay(this.gameManager);

        this.superUpgradeOverlay = new SuperUpgradeOverlay(this.gameManager, (upgradeColor) => {
            this.resumeGameplay(upgradeColor);
        });

        this.tutorialOverlay = new TutorialOverlay(this.gameManager, () => {
            this.phase = 'PLAYING'; 
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
            duration: config.FADE_IN_DURATION, // 🔄 Centralisé
            startAlpha: 1.0,
            endAlpha: 0.0,
            color: config.FADE_IN_COLOR        // 🔄 Centralisé
        });

        this.tutorialStartTimer = config.TUTORIAL_DELAY; // 🔄 Centralisé
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
        
        // 🔄 Centralisation du facteur de ralenti
        this.gameManager.timeScale = UIConfig.SCREENS.IN_GAME.TIMING.GAMEOVER_TIME_SCALE; 
        
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
                duration: UIConfig.SCREENS.IN_GAME.TIMING.SPEED_LINES_DURATION, // 🔄 Centralisé
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

        // Code de triche pour changer de vaisseau (peut rester tel quel, utile pour le debug)
        if (this.gameManager.inputManager.isKeyDown('c')) {
            const player = this.gameManager.entityManager.entities.find(ent => ent.constructor.name === 'Player');
            if (player) player.setVariant(player.currentVariant + 1);
        }

        let shouldUpdateWorld = false;
        let currentScaledDt = 0;
        const timingConfig = UIConfig.SCREENS.IN_GAME.TIMING; // 🔄 Raccourci

        // Phase Management
        if (this.phase === 'PLAYING') {
            shouldUpdateWorld = true;
            currentScaledDt = dt * this.gameManager.timeScale;
        }
        else if (this.phase === 'GAMEOVER_SEQUENCE') {
            const elapsed = performance.now() - this.gameOverOverlay.startTime;
            
            // 🔄 Durée du ralenti centralisée
            if (elapsed <= timingConfig.GAMEOVER_SLOWMO_DURATION) { 
                this.gameManager.timeScale = timingConfig.GAMEOVER_TIME_SCALE; // 🔄 Centralisé
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

            if (this.tutorialStartTimer > 0) {
                this.tutorialStartTimer -= dt;

                if (this.tutorialStartTimer <= 0) {
                    this.tutorialOverlay.start();
                }
            }
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