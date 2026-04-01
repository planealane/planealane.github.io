// js/states/StartState.js
import { State } from './State.js';
import { Button } from '../ui/Button.js';
import { UIConfig } from '../UIConfig.js';
import { EntityVisualsConfig } from '../config/EntityVisualsConfig.js'; 
import { ShipsAtlas } from '../utils/Atlas.js';
import { drawAlgorithmicTrail } from '../utils/VFXUtils.js';
import { SettingsOverlay } from '../ui/SettingsOverlay.js'; // [NEW] Import

export class StartState extends State {
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        this.bgImage = this.gameManager.assets.getImage('plain-sky');
        this.titleImage = this.gameManager.assets.getImage('title');
        this.playerImage = this.gameManager.assets.getImage('ships');

        // Variables for transition choreography
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        
        // [NEW] On instancie notre overlay de paramètres
        this.settingsOverlay = new SettingsOverlay(this.gameManager);
        this.isSettingsOpen = false;
        
        this.buttons = [];
        this.initUI();
        this.gameManager.audioManager.playMusic('title-theme', 0.5, 1000);
    }

    initUI() {
        const layout = UIConfig.SCREENS.START;
        const typo = UIConfig.TYPOGRAPHY; 
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;

        const playWidth = Math.min(UIConfig.BUTTONS.DEFAULTS.width * layout.PLAY_BTN_SCALE, width * 0.9);
        const playHeight = UIConfig.BUTTONS.DEFAULTS.height * layout.PLAY_BTN_SCALE;
        const playBtnY = height * layout.PLAY_BTN_Y_PERCENTAGE;

        this.startButton = new Button(
            layout.TEXT.PLAY_BTN, 
            centerX - playWidth / 2, 
            playBtnY, 
            'start', 
            () => this.startTransition(),
            { 
                width: playWidth, 
                height: playHeight,
                fontSize: typo.SIZE_MD * 1.5, 
                sfxId: 'game_start'
            }
        );
        this.startButton.anchorY = playBtnY;
        this.buttons.push(this.startButton);

        // [NEW] Création du bouton Settings juste en dessous
        // On le fait un peu plus petit (SCALE de 1.5 au lieu de 2 par exemple)
        const settingsWidth = Math.min(UIConfig.BUTTONS.DEFAULTS.width * 1.5, width * 0.8);
        const settingsHeight = UIConfig.BUTTONS.DEFAULTS.height * 1.5;
        // On le place avec une marge (ex: 40px) sous le bouton Play
        const settingsBtnY = playBtnY + playHeight + 40; 

        this.settingsButton = new Button(
            'SETTINGS', // Texte en dur pour l'instant, tu peux le mettre dans UIConfig
            centerX - settingsWidth / 2, 
            settingsBtnY, 
            'primary', 
            () => this.openSettings(),
            { 
                width: settingsWidth, 
                height: settingsHeight,
                fontSize: typo.SIZE_MD * 1.2
            }
        );
        this.settingsButton.anchorY = settingsBtnY;
        this.buttons.push(this.settingsButton);
    }

    startTransition() {
        if (this.isSettingsOpen) return; // Sécurité
        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
    }

    // [NEW] Ouvre le menu des paramètres
    openSettings() {
        this.isSettingsOpen = true;
        // On passe 'null' pour le joueur, car le vaisseau n'existe pas encore !
        // Le SettingsOverlay ignorera simplement la boîte de statistiques.
        this.settingsOverlay.show(null);
    }

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        // [NEW] Si les paramètres sont ouverts, on redirige l'update vers l'overlay
        if (this.isSettingsOpen) {
            this.settingsOverlay.update(dt, pointer);
            
            // Si l'overlay n'est plus actif (le joueur a cliqué sur 'RESUME' ou 'ABORT MISSION')
            if (!this.settingsOverlay.isActive) {
                this.isSettingsOpen = false;
            }
            return; // On bloque le reste de la logique du menu démarrer
        }

        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStartTime;
            if (elapsed >= UIConfig.SCREENS.START.TRANSITION_MS) { 
                this.gameManager.changeState('PLAY');
            }
            return; 
        }

        const time = performance.now();
        const anims = UIConfig.ANIMATIONS;

        this.buttons.forEach((btn, index) => {
            // [MODIFIED] On décale légèrement l'animation de souffle du 2ème bouton
            // en ajoutant un offset basé sur l'index du bouton
            const delayOffset = index * 1000; 
            btn.baseY = btn.anchorY + Math.sin((time + delayOffset) * anims.BTN_BREATH_SPEED) * anims.BTN_BREATH_AMPLITUDE;
            btn.update(pointer.x, pointer.y, pointer.isDown);
        });

        if (pointer.isDown && !this.wasPointerDown) {
            [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
        }
        
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const time = performance.now();
        const layout = UIConfig.SCREENS.START;
        const anims = UIConfig.ANIMATIONS;

        // --- TRANSITION OFFSETS CALCULATION ---
        let titleOffsetY = 0;
        let buttonsOffsetY = 0;
        let planeOffsetY = 0;
        let fadeAlpha = 0;

        if (this.isTransitioning) {
            const elapsed = time - this.transitionStartTime;
            const progress = Math.min(1, elapsed / layout.TRANSITION_MS);

            // 1. Title goes up and buttons go down
            const UIProgress = Math.min(1, progress / 0.40);
            const UIEase = UIProgress * UIProgress; 
            titleOffsetY = -UIEase * (height * 0.5); 
            buttonsOffsetY = UIEase * (height * 0.5); 

            // 2. Plane gathers momentum (squats) then takes off
            if (progress < 0.40) {
                const squatProgress = progress / 0.40;
                planeOffsetY = Math.sin(squatProgress * Math.PI) * layout.LAYOUT.SQUAT_AMPLITUDE; 
            } else {
                const takeoffProgress = (progress - 0.40) / 0.60;
                const takeoffEase = Math.pow(takeoffProgress, 3); 
                planeOffsetY = -takeoffEase * (height * 1.2); 
            }

            // 3. Fade to black
            if (progress > 0.60) {
                fadeAlpha = (progress - 0.60) / 0.40;
            }
        }

        // --- SCENE DRAWING ---

        // 1. Background
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, width, height);
        } else {
            ctx.fillStyle = layout.COLORS.FALLBACK_BG; 
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Title
        let staticTitleBottomY = height * layout.TITLE_Y_PERCENTAGE; 
        if (this.titleImage) {
            const maxWidth = width * layout.LAYOUT.TITLE_MAX_WIDTH_PCT; 
            const scale = Math.min(maxWidth / this.titleImage.width, 1);
            const scaledWidth = this.titleImage.width * scale;
            const scaledHeight = this.titleImage.height * scale;
            
            const titleX = width / 2 - scaledWidth / 2;
            const baseBreathY = Math.sin(time * anims.TITLE_BREATH_SPEED) * anims.TITLE_BREATH_AMPLITUDE;
            const titleY = staticTitleBottomY + baseBreathY + titleOffsetY;
            
            ctx.drawImage(this.titleImage, titleX, titleY, scaledWidth, scaledHeight);
            staticTitleBottomY += scaledHeight; 
        }

        // 3. Plane and particles
        if (this.playerImage) {
            const safeIndex = EntityVisualsConfig.PLAYER.BASE_VARIANT % ShipsAtlas.PLAYER_VARIANTS;
            const frame = ShipsAtlas.getFrame(safeIndex, this.playerImage.width, this.playerImage.height);
            
            const displaySize = layout.TITLE_PLAYER_SIZE; 
            
            const spriteX = width / 2 - displaySize / 2;
            const spriteY = staticTitleBottomY + (height * layout.PLAYER_Y_OFFSET_PERCENTAGE) + planeOffsetY; 

            const speedMultiplier = this.isTransitioning ? layout.LAYOUT.TRAIL_SPEED_MULT : 1;
            drawAlgorithmicTrail(ctx, spriteX, spriteY, displaySize, displaySize, time, false, speedMultiplier);
            
            ctx.drawImage(
                this.playerImage,
                frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                spriteX, spriteY, displaySize, displaySize
            );
        }

        // 4. Buttons
        this.buttons.forEach((btn, index) => {
            const originalY = btn.baseY;
            // On peut aussi rajouter un léger décalage dans la chute des boutons lors de la transition
            btn.baseY += buttonsOffsetY * (1 + (index * 0.2)); 
            btn.draw(ctx);
            btn.baseY = originalY; 
        });

        // 5. Final fade
        if (fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, width, height);
        }
        
        // [NEW] 6. Dessin de l'overlay des paramètres par-dessus la scène
        if (this.isSettingsOpen) {
            this.settingsOverlay.draw(ctx);
        }
    }
}