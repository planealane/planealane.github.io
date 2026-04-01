// js/ui/SettingsOverlay.js
import { UIConfig } from '../UIConfig.js';
import { Button } from './Button.js';

export class SettingsOverlay {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isActive = false;
        
        // [NOUVEAU] On sépare les boutons en deux listes
        this.mainButtons = [];
        this.confirmButtons = [];
        
        // [NOUVEAU] État du menu ('MAIN' ou 'CONFIRM')
        this.menuState = 'MAIN'; 
        
        this.wasPointerDown = false;
        this.playerSnapshot = null;
    }

    show(player) {
        this.isActive = true;
        this.playerSnapshot = player;
        this.menuState = 'MAIN'; // On remet toujours le menu à zéro quand on l'ouvre
        this.initUI();
    }

    hide() {
        this.isActive = false;
        this.playerSnapshot = null;
        this.menuState = 'MAIN';
    }

    initUI() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const config = UIConfig.SCREENS.SETTINGS;

        const btnWidth = UIConfig.BUTTONS.DEFAULTS.width;
        const btnHeight = UIConfig.BUTTONS.DEFAULTS.height;
        
        const squareBtnSize = btnHeight; 
        const gaugeWidth = 200; 
        const halfSpacing = (gaugeWidth / 2) + 20; 

        this.mainButtons = [];
        this.confirmButtons = [];

        // ==========================================
        // 1. BOUTONS DU MENU PRINCIPAL
        // ==========================================

        this.mainButtons.push(new Button(
            config.TEXT.RESUME,
            centerX - btnWidth / 2, height * 0.35, 'start',
            () => this.hide(),
            { width: btnWidth, height: btnHeight }
        ));

        const musicY = height * 0.52;
        const sfxY = height * 0.65;

        this.mainButtons.push(new Button('-', centerX - halfSpacing - squareBtnSize, musicY, 'primary', () => {
            const currentVol = this.gameManager.audioManager.musicVolume;
            this.gameManager.audioManager.setMusicVolume(Math.round((currentVol - 0.1) * 10) / 10);
        }, { width: squareBtnSize, height: squareBtnSize }));

        this.mainButtons.push(new Button('+', centerX + halfSpacing, musicY, 'primary', () => {
            const currentVol = this.gameManager.audioManager.musicVolume;
            this.gameManager.audioManager.setMusicVolume(Math.round((currentVol + 0.1) * 10) / 10);
        }, { width: squareBtnSize, height: squareBtnSize }));

        this.mainButtons.push(new Button('-', centerX - halfSpacing - squareBtnSize, sfxY, 'primary', () => {
            const currentVol = this.gameManager.audioManager.sfxVolume;
            this.gameManager.audioManager.setSfxVolume(Math.round((currentVol - 0.1) * 10) / 10);
        }, { width: squareBtnSize, height: squareBtnSize }));

        this.mainButtons.push(new Button('+', centerX + halfSpacing, sfxY, 'primary', () => {
            const currentVol = this.gameManager.audioManager.sfxVolume;
            this.gameManager.audioManager.setSfxVolume(Math.round((currentVol + 0.1) * 10) / 10);
        }, { width: squareBtnSize, height: squareBtnSize }));


        if (this.playerSnapshot) {
            this.mainButtons.push(new Button(
                config.TEXT.MENU,
                centerX - btnWidth / 2, height * config.LAYOUT.BTN_MENU_Y_PCT, 'restart',
                () => {
                    // [MODIFIÉ] Au lieu de quitter direct, on passe dans l'état CONFIRM
                    this.menuState = 'CONFIRM';
                },
                { width: btnWidth, height: btnHeight }
            ));
        }

        // ==========================================
        // 2. BOUTONS DE LA BOÎTE DE CONFIRMATION
        // ==========================================
        
        const confirmBtnWidth = 160;
        const confirmBtnY = centerY + 30; // Juste en dessous du texte "ARE YOU SURE?"

        // Bouton YES (Rouge)
        this.confirmButtons.push(new Button(
            'YES',
            centerX - confirmBtnWidth - 10, confirmBtnY, 'restart',
            () => {
                this.hide();
                this.gameManager.changeState('START');
            },
            { width: confirmBtnWidth, height: btnHeight }
        ));

        // Bouton NO (Bleu)
        this.confirmButtons.push(new Button(
            'NO',
            centerX + 10, confirmBtnY, 'primary',
            () => {
                // On annule et on retourne au menu principal
                this.menuState = 'MAIN';
            },
            { width: confirmBtnWidth, height: btnHeight }
        ));
    }

    update(dt, pointer) {
        if (!this.isActive) return;

        // [NOUVEAU] On met à jour uniquement la liste de boutons correspondant à l'état actuel
        const activeButtons = this.menuState === 'MAIN' ? this.mainButtons : this.confirmButtons;

        activeButtons.forEach(btn => btn.update(pointer.x, pointer.y, pointer.isDown));

        if (pointer.isDown && !this.wasPointerDown) {
            [...activeButtons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
        }
        
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const config = UIConfig.SCREENS.SETTINGS;

        // --- 1. DESSIN DU MENU DE BASE (Toujours visible en fond) ---
        ctx.fillStyle = config.COLORS.OVERLAY;
        ctx.fillRect(0, 0, width, height);

        UIConfig.drawText(ctx, config.TEXT.TITLE, centerX, height * config.LAYOUT.TITLE_Y_PCT, config.STYLES.TITLE);

        const musicY = height * 0.52;
        const sfxY = height * 0.65;
        const btnHeight = UIConfig.BUTTONS.DEFAULTS.height;

        this.drawVolumeControl(ctx, "MUSIC", centerX, musicY + (btnHeight / 2), this.gameManager.audioManager.musicVolume);
        this.drawVolumeControl(ctx, "SFX", centerX, sfxY + (btnHeight / 2), this.gameManager.audioManager.sfxVolume);

        this.mainButtons.forEach(btn => btn.draw(ctx));

        if (this.playerSnapshot) {
            this.drawStatsPanel(ctx, width, height, centerX, config);
        }

        // --- 2. DESSIN DE LA BOÎTE DE CONFIRMATION (Par-dessus) ---
        if (this.menuState === 'CONFIRM') {
            // Assombrir un peu plus le menu derrière
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, width, height);

            // Dessiner la boîte popup
            const boxWidth = 400;
            const boxHeight = 200;
            const boxX = centerX - boxWidth / 2;
            const boxY = centerY - boxHeight / 2;

            ctx.fillStyle = config.COLORS.PANEL_BG;
            ctx.strokeStyle = '#e74c3c'; // Bordure rouge pour marquer l'avertissement
            ctx.lineWidth = 4;
            
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
            ctx.fill();
            ctx.stroke();

            // Texte de la boîte
            UIConfig.drawText(ctx, "ABORT MISSION ?", centerX, centerY - 40, {
                fontSize: 40,
                weight: 'bold',
                color: '#ffffff'
            });

            // Les boutons YES et NO
            this.confirmButtons.forEach(btn => btn.draw(ctx));
        }
    }

    drawVolumeControl(ctx, label, x, y, volume) {
        const segments = 10;
        const gaugeWidth = 200;
        const segmentWidth = (gaugeWidth / segments) - 4; 
        const gaugeHeight = 24;
        
        const startX = x - (gaugeWidth / 2);
        const startY = y - (gaugeHeight / 2);

        UIConfig.drawText(ctx, label, x, y - 35, UIConfig.SCREENS.SETTINGS.STYLES.STAT_ICON);

        for (let i = 0; i < segments; i++) {
            const segX = startX + i * (segmentWidth + 4);
            const isFilled = i < Math.round(volume * 10);
            
            ctx.fillStyle = isFilled ? '#2ecc71' : '#333333';
            ctx.fillRect(segX, startY, segmentWidth, gaugeHeight);
        }
    }

    drawStatsPanel(ctx, screenWidth, screenHeight, centerX, config) {
        const panelWidth = screenWidth * config.LAYOUT.PANEL_WIDTH_PCT;
        const panelHeight = config.LAYOUT.PANEL_HEIGHT;
        const startX = centerX - panelWidth / 2;
        const startY = (screenHeight / 2) + config.LAYOUT.PANEL_OFFSET_Y - (panelHeight / 2);

        ctx.fillStyle = config.COLORS.PANEL_BG;
        ctx.strokeStyle = config.COLORS.PANEL_BORDER;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(startX, startY, panelWidth, panelHeight, config.LAYOUT.PANEL_RADIUS);
        ctx.fill();
        ctx.stroke();

        const pWeapon = this.playerSnapshot.primaryWeapon?.stats || { damage: 0, cooldown: 0, projectileSpeed: 0 };
        const sWeapon = this.playerSnapshot.secondaryWeapon?.stats || { damage: 0, cooldown: 0, count: 0 };

        const primaryY = startY + 50;
        const secondaryY = startY + 130;
        
        UIConfig.drawText(ctx, "PRIMARY", centerX, startY + 20, config.STYLES.STAT_LABEL);
        UIConfig.drawText(ctx, "SECONDARY", centerX, startY + 100, config.STYLES.STAT_LABEL);

        const col1 = startX + panelWidth * 0.2; 
        const col2 = startX + panelWidth * 0.5; 
        const col3 = startX + panelWidth * 0.8; 

        UIConfig.drawText(ctx, `⚔️ ${pWeapon.damage}`, col1, primaryY, config.STYLES.STAT_VALUE);
        UIConfig.drawText(ctx, `⚡ ${pWeapon.cooldown}ms`, col2, primaryY, config.STYLES.STAT_VALUE);
        UIConfig.drawText(ctx, `💨 ${pWeapon.projectileSpeed}`, col3, primaryY, config.STYLES.STAT_VALUE);

        UIConfig.drawText(ctx, `🚀 ${sWeapon.damage}`, col1, secondaryY, config.STYLES.STAT_VALUE);
        UIConfig.drawText(ctx, `⏱️ ${sWeapon.cooldown}ms`, col2, secondaryY, config.STYLES.STAT_VALUE);
        UIConfig.drawText(ctx, `🔢 x${sWeapon.count}`, col3, secondaryY, config.STYLES.STAT_VALUE);
    }
}