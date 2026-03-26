// js/states/LoadState.js
import { State } from './State.js';
import { UIConfig } from '../UIConfig.js'; // 🔄 Changement de l'import

export class LoadState extends State {
    constructor(gameManager) {
        super(gameManager);
        
        // On récupère la config spécifique à cet écran pour simplifier la lecture
        this.config = UIConfig.SCREENS.LOAD; 
        
        this.phase = 'LOADING'; 
        this.fakeLoadTimer = 0;
        this.fakeLoadDuration = this.config.DURATION_MS; // 🔄 Valeur centralisée
    }

    enter() {
        this.phase = 'LOADING';
        this.fakeLoadTimer = 0;
    }

    update(dt, pointer) {
        if (this.phase === 'LOADING') {
            this.fakeLoadTimer += dt;
            if (this.fakeLoadTimer >= this.fakeLoadDuration) {
                this.phase = 'READY';
            }
            return; 
        }

        if (this.phase === 'READY') {
            if (pointer.isDown) {
                // Déblocage de l'audio et transition vers le menu principal
                this.gameManager.audioManager.playMusic('title-theme', 0.5, 1000);
                // 🔄 Utilisation de la durée de transition de la config
                this.gameManager.requestTransition('START', 'FADE', this.config.TRANSITION_MS); 
            }
        }
    }

    draw(ctx) {
        const centerX = this.gameManager.canvas.width / 2;
        const centerY = this.gameManager.canvas.height / 2;
        
        // Raccourcis pour rendre le code de dessin plus lisible
        const typo = UIConfig.TYPOGRAPHY;
        const layout = this.config.LAYOUT;
        const colors = this.config.COLORS;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.phase === 'LOADING') {
            // 1. Texte de chargement
            ctx.fillStyle = colors.TEXT;
            ctx.font = `${typo.SIZE_SM}px ${typo.FAMILY}`;
            ctx.fillText(this.config.TEXT.LOADING, centerX, centerY + layout.LOADING_TEXT_OFFSET_Y);

            // 2. Fond de la barre
            const barX = centerX - layout.BAR_WIDTH / 2;
            const barY = centerY + layout.BAR_OFFSET_Y;

            ctx.fillStyle = colors.BAR_BG;
            ctx.fillRect(barX, barY, layout.BAR_WIDTH, layout.BAR_HEIGHT);

            // 3. Remplissage de la barre (progression)
            const progress = Math.min(this.fakeLoadTimer / this.fakeLoadDuration, 1);
            ctx.fillStyle = colors.BAR_FILL; 
            ctx.fillRect(barX, barY, layout.BAR_WIDTH * progress, layout.BAR_HEIGHT);

            // 4. Contour de la barre
            ctx.strokeStyle = colors.BAR_BORDER;
            ctx.lineWidth = layout.BAR_BORDER_WIDTH;
            ctx.strokeRect(barX, barY, layout.BAR_WIDTH, layout.BAR_HEIGHT);

        } else if (this.phase === 'READY') {
            // 1. Texte "Terminé"
            ctx.fillStyle = colors.TEXT;
            ctx.font = `${typo.SIZE_MD}px ${typo.FAMILY}`;
            ctx.fillText(this.config.TEXT.READY, centerX, centerY + layout.READY_TEXT_OFFSET_Y);

            // 2. Texte clignotant "Appuyez pour commencer"
            const alpha = 0.5 + 0.5 * Math.sin(Date.now() * UIConfig.ANIMATIONS.TEXT_PULSE_SPEED);
            
            // Astuce : on utilise replace() pour injecter l'alpha dynamiquement si on avait une couleur rgba dans la config, 
            // ou on l'applique directement avec globalAlpha pour simplifier.
            ctx.globalAlpha = alpha; 
            ctx.fillStyle = colors.TEXT;
            ctx.font = `${typo.SIZE_SM}px ${typo.FAMILY}`;
            ctx.fillText(this.config.TEXT.PROMPT, centerX, centerY + layout.PROMPT_TEXT_OFFSET_Y);
            
            // On réinitialise l'alpha pour ne pas affecter les autres dessins
            ctx.globalAlpha = 1.0; 
        }
    }
}