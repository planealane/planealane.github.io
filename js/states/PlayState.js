// js/states/PlayState.js
import { State } from './State.js';
import { EntityManager } from '../managers/EntityManager.js';
import { Player } from '../entities/Player.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { GameOverOverlay } from '../ui/GameOverOverlay.js';
import { SuperUpgradeOverlay } from '../ui/SuperUpgradeOverlay.js';
import { TutorialOverlay } from '../ui/TutorialOverlay.js';
import { SettingsOverlay } from '../ui/SettingsOverlay.js'; // [NEW] Import de l'overlay de pause
import { VFXManager } from '../managers/VFXManager.js';
import { ProgressUI } from '../ui/ProgressUI.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
import { UIConfig } from '../UIConfig.js'; 

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
        const config = UIConfig.SCREENS.IN_GAME.TIMING; 

        this.phase = 'TUTORIAL_SEQUENCE';
        
        // [NEW] On garde en mémoire la phase d'avant la pause pour pouvoir y retourner
        this.prePausePhase = 'PLAYING'; 

        this.gameOverOverlay = new GameOverOverlay(this.gameManager);

        this.superUpgradeOverlay = new SuperUpgradeOverlay(this.gameManager, (upgradeColor) => {
            this.resumeGameplay(upgradeColor);
        });

        this.tutorialOverlay = new TutorialOverlay(this.gameManager, () => {
            this.phase = 'PLAYING'; 
        });
        
        // [NEW] Instanciation du menu de paramètres
        this.settingsOverlay = new SettingsOverlay(this.gameManager);

        // 3. Initialize the new game world
        this.gameManager.entityManager = new EntityManager(this.gameManager.assets);
        this.player = new Player(this.gameManager.assets.getImage('ships')); // [MODIFIED] On stocke le joueur
        this.gameManager.entityManager.addEntity(this.player);
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
        
        // [NEW] On écoute la touche Échap globalement
        this.onKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDown);

        // 7. Déclencher le fondu d'entrée
        gameEvents.emit(EVENTS.SCREEN_FADE, {
            duration: config.FADE_IN_DURATION, 
            startAlpha: 1.0,
            endAlpha: 0.0,
            color: config.FADE_IN_COLOR        
        });

        this.tutorialStartTimer = config.TUTORIAL_DELAY; 
    }

    exit() {
        gameEvents.off(EVENTS.PLAYER_DEAD, this.onPlayerDead);
        gameEvents.off(EVENTS.SUPER_LOOT_PICKUP, this.onSuperLootPickup);
        
        // [NEW] Important : retirer l'écouteur clavier
        window.removeEventListener('keydown', this.onKeyDown);

        if (this.vfxManager) {
            this.vfxManager.destroy();
        }
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    // [NEW] Gestionnaire de clavier pour la touche Échap
    onKeyDown(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            this.togglePause();
        }
    }

    // [NEW] Bascule entre la pause et le jeu
    togglePause() {
        // Ne pas autoriser la pause pendant le game over ou le tutoriel
        if (this.phase === 'GAMEOVER_SEQUENCE' || this.phase === 'TUTORIAL_SEQUENCE') return;

        if (this.phase === 'PAUSED') {
            // Un-pause
            this.settingsOverlay.hide();
            this.phase = this.prePausePhase; // Retourne à l'état d'avant la pause
        } else {
            // Pause
            this.prePausePhase = this.phase; // Sauvegarde l'état actuel (PLAYING ou UPGRADE)
            this.phase = 'PAUSED';
            this.settingsOverlay.show(this.player); // Passe le joueur pour afficher les stats
        }
    }

    onPlayerDead() {
        if (this.phase === 'GAMEOVER_SEQUENCE') return;
        this.phase = 'GAMEOVER_SEQUENCE';
        
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
                duration: UIConfig.SCREENS.IN_GAME.TIMING.SPEED_LINES_DURATION, 
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

        let shouldUpdateWorld = false;
        let currentScaledDt = 0;
        const timingConfig = UIConfig.SCREENS.IN_GAME.TIMING; 

        // [NEW] Gestion du clic sur le bouton d'engrenage (Top-Right)
        if (this.phase === 'PLAYING' && pointer.isDown && !this.wasPointerDown) {
            const config = UIConfig.SCREENS.SETTINGS.LAYOUT;
            const gearSize = config.GEAR_BTN_SIZE;
            const gearMargin = config.GEAR_BTN_MARGIN;
            const btnX = this.gameManager.canvas.width - gearSize - gearMargin;
            const btnY = gearMargin;

            // Simple "bounding box" check pour le clic
            if (pointer.x >= btnX && pointer.x <= btnX + gearSize &&
                pointer.y >= btnY && pointer.y <= btnY + gearSize) {
                this.togglePause();
            }
        }

        // --- Phase Management ---
        if (this.phase === 'PLAYING') {
            shouldUpdateWorld = true;
            currentScaledDt = dt * this.gameManager.timeScale;
        }
        else if (this.phase === 'PAUSED') {
            shouldUpdateWorld = false; // Le jeu est "gelé"
            currentScaledDt = 0;
            
            // Si le SettingsOverlay signale qu'il n'est plus actif (clic sur Resume), on dépile la pause
            if (!this.settingsOverlay.isActive) {
                this.togglePause();
            } else {
                this.settingsOverlay.update(dt, pointer);
            }
        }
        else if (this.phase === 'GAMEOVER_SEQUENCE') {
            const elapsed = performance.now() - this.gameOverOverlay.startTime;
            
            if (elapsed <= timingConfig.GAMEOVER_SLOWMO_DURATION) { 
                this.gameManager.timeScale = timingConfig.GAMEOVER_TIME_SCALE; 
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

        // --- World & Entities Execution ---
        if (shouldUpdateWorld) {
            const currentWave = this.spawner ? this.spawner.blocksSpawned : 1;

            this.gameManager.entityManager.update(currentScaledDt, pointer.x, currentWave);
            if (this.phase === 'PLAYING' && this.spawner) {
                this.spawner.update(currentScaledDt, this.gameManager.entityManager);
                const ratio = this.spawner.getProgressRatio();
                this.progressUI.updateRatio(ratio);
            }
        }

        // Les VFX continuent de s'animer (en utilisant dt réel pour les fondus)
        if (this.vfxManager) {
            this.vfxManager.update(currentScaledDt, dt);
        }

        if (this.progressUI) {
            this.progressUI.update(dt);
        }
        
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        ctx.save();

        if (this.vfxManager) {
            const shake = this.vfxManager.getShakeOffset();
            ctx.translate(shake.x, shake.y);
        }

        // 1. Dessin du monde "en dessous"
        if (this.gameManager.entityManager) {
            this.gameManager.entityManager.draw(ctx);
        }

        if (this.vfxManager) {
            this.vfxManager.draw(ctx);
        }

        ctx.restore();

        // 2. Dessin de l'UI
        if (this.phase === 'PLAYING' || this.phase === 'PAUSED') {
            // Dessin de l'engrenage "Pause" en haut à droite
            this.drawPauseButton(ctx);
            
            if (this.progressUI) {
                this.progressUI.draw(ctx);
            }
        }

        // 3. Dessin des Overlays par-dessus tout
        if (this.phase === 'GAMEOVER_SEQUENCE') {
            this.gameOverOverlay.draw(ctx);
        }

        if (this.phase === 'UPGRADE_SEQUENCE') {
            this.superUpgradeOverlay.draw(ctx);
        }

        if (this.phase === 'TUTORIAL_SEQUENCE') {
            this.tutorialOverlay.draw(ctx);
        }
        
        if (this.phase === 'PAUSED') {
            this.settingsOverlay.draw(ctx);
        }
    }

    // [NEW] Dessine un simple bouton d'engrenage en haut à droite
    drawPauseButton(ctx) {
        const config = UIConfig.SCREENS.SETTINGS.LAYOUT;
        const size = config.GEAR_BTN_SIZE;
        const margin = config.GEAR_BTN_MARGIN;
        const x = this.gameManager.canvas.width - size - margin;
        const y = margin;

        ctx.save();
        // Une boîte de fond subtile
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 10);
        ctx.fill();
        ctx.stroke();

        // L'icône (Engrenage ou Pause)
        UIConfig.drawText(ctx, '⚙️', x + size/2, y + size/2 + 2, { fontSize: size * 0.6 });
        ctx.restore();
    }
}