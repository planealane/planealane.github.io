// js/ui/SuperUpgradeOverlay.js
import { GameConfig } from '../GameConfig.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js';
import { ShipsAtlas, PropsAtlas } from '../utils/Atlas.js'; // Ajout de PropsAtlas pour le visuel par défaut

export class SuperUpgradeOverlay {
    constructor(gameManager, onCompleteCallback) {
        this.gameManager = gameManager;
        this.onComplete = onCompleteCallback;

        this.isActive = false;
        this.playerRef = null;
        this.currentWave = 1;
        this.choices = [];
        this.cards = [];

        this.wasPointerDown = false;
        this.hoveredIndex = -1;
    }

    start(data) {
        this.isActive = true;
        this.playerRef = data.player;
        this.currentWave = data.wave || 1;
        this.wasPointerDown = true; 

        // 1. Détermination du Pool selon la progression (Boss Tuto = blockIndex 3)
        if (this.currentWave <= 3) {
            this.choices = [
                { config: UpgradesConfig.ARCHETYPES['CLASS_GUNNER'], tierIndex: 0 },
                { config: UpgradesConfig.ARCHETYPES['CLASS_CANNON'], tierIndex: 0 },
                { config: UpgradesConfig.ARCHETYPES['CLASS_SPREAD'], tierIndex: 0 }
            ];
        } else {
            this.choices = UpgradesConfig.RANDOM.getWeightedSuperUpgrades(UpgradesConfig.ENHANCEMENTS, 3);
        }

        this.buildLayout();
        this.startTime = performance.now();
    }

    buildLayout() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        
        const cardWidth = width * 0.28;
        const cardHeight = height * 0.60; 
        const spacing = width * 0.04;
        
        const totalWidth = (cardWidth * 3) + (spacing * 2);
        const startX = (width - totalWidth) / 2;
        const startY = (height - cardHeight) / 2;

        this.cards = this.choices.map((choice, index) => {
            return {
                choice: choice, // Format: { config, tierIndex }
                x: startX + (index * (cardWidth + spacing)),
                y: startY,
                width: cardWidth,
                height: cardHeight
            };
        });
    }

    selectUpgrade(index) {
        const selected = this.cards[index].choice;

        // 1. Appliquer la logique métier centralisée
        if (selected.config.onApply) {
            selected.config.onApply(this.playerRef, selected.tierIndex, this.currentWave);
        }

        // 2. Mettre à jour le sprite SI c'est un Archétype (qui possède un playerVariantIndex)
        if (selected.config.playerVariantIndex !== undefined) {
            if (this.playerRef.setVariant) {
                this.playerRef.setVariant(selected.config.playerVariantIndex);
            } else {
                this.playerRef.currentVariant = selected.config.playerVariantIndex;
                const img = this.gameManager.assets.getImage('ships');
                this.playerRef.frame = ShipsAtlas.getFrame(selected.config.playerVariantIndex, img.width, img.height);
            }
        }

        // 3. Fermer et relancer
        this.isActive = false;
        this.onComplete();
    }

    update(dt, pointer) {
        if (!this.isActive) return;

        const elapsed = performance.now() - this.startTime;
        
        if (elapsed < 500) {
            this.wasPointerDown = pointer.isDown;
            return;
        }

        if (pointer.isDown && !this.wasPointerDown) {
            for (let i = 0; i < this.cards.length; i++) {
                const card = this.cards[i];
                if (pointer.x >= card.x && pointer.x <= card.x + card.width &&
                    pointer.y >= card.y && pointer.y <= card.y + card.height) {

                    this.selectUpgrade(i);
                    return;
                }
            }
        }

        this.hoveredIndex = -1;
        if (pointer.x !== undefined && pointer.y !== undefined) {
            for (let i = 0; i < this.cards.length; i++) {
                const card = this.cards[i];
                if (pointer.x >= card.x && pointer.x <= card.x + card.width &&
                    pointer.y >= card.y && pointer.y <= card.y + card.height) {
                    this.hoveredIndex = i;
                }
            }
        }

        this.wasPointerDown = pointer.isDown;
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.replace(/\n/g, ' ').split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
    }

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${GameConfig.FONT_SIZE_LG}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EVOLUTION READY', width / 2, height * 0.15);

        const playerImage = this.gameManager.assets.getImage('ships');
        const propsImage = this.gameManager.assets.getImage('props'); // Pour les Enhancements

        this.cards.forEach((card, index) => {
            const isHovered = this.hoveredIndex === index;
            const config = card.choice.config; // Extraction directe pour raccourcir le code

            // Card Background
            ctx.fillStyle = isHovered ? '#2c3e50' : '#1a252f';
            ctx.strokeStyle = isHovered ? '#f1c40f' : '#34495e';
            ctx.lineWidth = isHovered ? 6 : 3;

            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.width, card.height, 15);
            ctx.fill();
            ctx.stroke();

            // Rendu visuel (Sprite du vaisseau ou icône d'amélioration)
            const spriteSize = card.width * 0.6;
            const spriteX = card.x + (card.width / 2) - (spriteSize / 2);
            const spriteY = card.y + (card.height * 0.15);

            if (config.playerVariantIndex !== undefined && playerImage) {
                // Phase 1 : Dessine le vaisseau
                const safeIndex = config.playerVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
                const frame = ShipsAtlas.getFrame(safeIndex, playerImage.width, playerImage.height);
                
                ctx.drawImage(
                    playerImage,
                    frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                    spriteX, spriteY, spriteSize, spriteSize
                );
            } else if (propsImage && PropsAtlas && PropsAtlas.bonus) {
                // Phase 2 : Dessine une icône générique de loot (à remplacer par tes icônes si besoin)
                const frame = PropsAtlas.bonus;
                const iconSize = spriteSize * 0.5; // Un peu plus petit que le vaisseau
                const iconX = card.x + (card.width / 2) - (iconSize / 2);
                const iconY = card.y + (card.height * 0.20);

                ctx.drawImage(
                    propsImage,
                    frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                    iconX, iconY, iconSize, iconSize
                );
            }

            const maxTextWidth = card.width * 0.90; 
            const textCenterX = card.x + (card.width / 2);

            // Title
            ctx.fillStyle = isHovered ? '#f1c40f' : '#ffffff';
            let titleFontSize = GameConfig.FONT_SIZE_SM;
            ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;

            let titleWidth = ctx.measureText(config.title).width;
            if (titleWidth > maxTextWidth) {
                titleFontSize = titleFontSize * (maxTextWidth / titleWidth);
                ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;
            }

            ctx.textAlign = 'center';
            ctx.fillText(config.title, textCenterX, card.y + card.height * 0.6);

            // Description Dynamique
            ctx.fillStyle = '#bdc3c7';
            const descFontSize = GameConfig.FONT_SIZE_SM * 0.75;
            ctx.font = `normal ${descFontSize}px ${GameConfig.FONT_FAMILY}`;

            const startDescY = card.y + card.height * 0.75;
            const lineHeight = descFontSize * 1.4;

            // Appel dynamique : génère le texte selon le tier tiré et la vague actuelle
            const descriptionText = config.getDescription(card.choice.tierIndex, this.currentWave);

            this.drawWrappedText(
                ctx,
                descriptionText,
                textCenterX,
                startDescY,
                maxTextWidth,
                lineHeight
            );
        });
    }
}