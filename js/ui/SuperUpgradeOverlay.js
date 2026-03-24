// js/ui/SuperUpgradeOverlay.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';

export class SuperUpgradeOverlay {
    constructor(gameManager, onCompleteCallback) {
        this.gameManager = gameManager;
        this.onComplete = onCompleteCallback;

        this.isActive = false;
        this.playerRef = null;
        this.choices = [];
        this.cards = [];

        this.wasPointerDown = false;
        this.hoveredIndex = -1;
    }

    start(player) {
        this.isActive = true;
        this.playerRef = player;
        this.wasPointerDown = true; // Prevent instant clicking if holding input

        // Fetch 3 unique upgrades from the config
        this.choices = UpgradesConfig.getRandomSuperUpgrades(3);
        this.buildLayout();
        
        // Record start time for the safety click delay
        this.startTime = performance.now();
    }

    buildLayout() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        
        // 1. Define card dimensions
        const cardWidth = width * 0.28;
        const cardHeight = height * 0.60; 
        
        // Horizontal spacing between cards
        const spacing = width * 0.04;
        
        // 2. Calculate horizontal centering
        const totalWidth = (cardWidth * 3) + (spacing * 2);
        const startX = (width - totalWidth) / 2;
        
        // 3. Calculate vertical centering
        const startY = (height - cardHeight) / 2;

        // 4. Build layout data for each card
        this.cards = this.choices.map((choice, index) => {
            return {
                choice: choice,
                x: startX + (index * (cardWidth + spacing)),
                y: startY,
                width: cardWidth,
                height: cardHeight
            };
        });
    }

    selectUpgrade(index) {
        const selected = this.cards[index].choice;

        // 1. Apply logic defined in config
        selected.onApply(this.playerRef, this.gameManager.entityManager);

        // 2. Update player sprite
        if (this.playerRef.setVariant) {
            this.playerRef.setVariant(selected.playerVariantIndex);
        } else {
            // Fallback if setVariant doesn't exist yet
            this.playerRef.currentVariant = selected.playerVariantIndex;
            const img = this.gameManager.assets.getImage('ships');
            this.playerRef.frame = ShipsAtlas.getFrame(selected.playerVariantIndex, img.width, img.height);
        }

        // 3. Close overlay and resume gameplay
        this.isActive = false;
        this.onComplete();
    }

    update(dt, pointer) {
        if (!this.isActive) return;

        const elapsed = performance.now() - this.startTime;
        
        // 1. Safety delay (500ms) to prevent accidental clicks upon opening
        if (elapsed < 500) {
            this.wasPointerDown = pointer.isDown;
            return;
        }

        // 2. Handle clicks
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

        // 3. Update hover state
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

    // ============================================================================
    // RENDERING & TEXT FORMATTING
    // ============================================================================

    /**
     * Draws text that automatically wraps to the next line if it exceeds maxWidth.
     */
    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        // Clean up any manual line breaks from the config to let the engine handle it
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
        // Draw the remaining text
        ctx.fillText(line.trim(), x, currentY);
    }

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;

        // 1. Dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        // 2. Main Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${GameConfig.FONT_SIZE_LG}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EVOLUTION READY', width / 2, height * 0.15);

        // 3. Draw Cards
        const playerImage = this.gameManager.assets.getImage('ships');

        this.cards.forEach((card, index) => {
            const isHovered = this.hoveredIndex === index;

            // Card Background
            ctx.fillStyle = isHovered ? '#2c3e50' : '#1a252f';
            ctx.strokeStyle = isHovered ? '#f1c40f' : '#34495e';
            ctx.lineWidth = isHovered ? 6 : 3;

            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.width, card.height, 15);
            ctx.fill();
            ctx.stroke();

            // Ship Sprite rendering
            if (playerImage) {
                const safeIndex = card.choice.playerVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
                const frame = ShipsAtlas.getFrame(safeIndex, playerImage.width, playerImage.height);
                const spriteSize = card.width * 0.6;
                const spriteX = card.x + (card.width / 2) - (spriteSize / 2);
                const spriteY = card.y + (card.height * 0.15);

                ctx.drawImage(
                    playerImage,
                    frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                    spriteX, spriteY, spriteSize, spriteSize
                );
            }

            // Layout definitions
            const maxTextWidth = card.width * 0.90; // 5% margin on each side (100 - 10)
            const textCenterX = card.x + (card.width / 2);

            // ==========================================
            // Title (Auto-scale to fit single line)
            // ==========================================
            ctx.fillStyle = isHovered ? '#f1c40f' : '#ffffff';
            let titleFontSize = GameConfig.FONT_SIZE_SM;
            ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;

            let titleWidth = ctx.measureText(card.choice.title).width;
            if (titleWidth > maxTextWidth) {
                // Downscale font size proportionally
                titleFontSize = titleFontSize * (maxTextWidth / titleWidth);
                ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;
            }

            ctx.textAlign = 'center';
            ctx.fillText(card.choice.title, textCenterX, card.y + card.height * 0.6);

            // ==========================================
            // Description (Word wrap, multiline)
            // ==========================================
            ctx.fillStyle = '#bdc3c7';
            const descFontSize = GameConfig.FONT_SIZE_SM * 0.75;
            ctx.font = `normal ${descFontSize}px ${GameConfig.FONT_FAMILY}`;

            const startDescY = card.y + card.height * 0.75;
            const lineHeight = descFontSize * 1.4;

            this.drawWrappedText(
                ctx,
                card.choice.description,
                textCenterX,
                startDescY,
                maxTextWidth,
                lineHeight
            );
        });
    }
}