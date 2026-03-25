// js/ui/SuperUpgradeOverlay.js
import { GameConfig } from '../GameConfig.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js';
import { ShipsAtlas, PropsAtlas } from '../utils/Atlas.js';
import { drawMangaLines } from '../utils/VFXUtils.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';

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

        // States managing the collection animation and delay
        this.state = 'SELECTING'; // 'SELECTING' or 'ANIMATING'
        this.particles = [];
        this.selectedCardIndex = -1;
        this.animationTimer = 0;
    }

    start(data) {
        this.isActive = true;
        this.state = 'SELECTING';
        this.particles = [];
        this.selectedCardIndex = -1;
        this.playerRef = data.player;
        this.currentWave = data.wave || 1;
        this.wasPointerDown = true;

        // Determine the available upgrade pool based on current wave progression
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
                choice: choice,
                x: startX + (index * (cardWidth + spacing)),
                y: startY,
                width: cardWidth,
                height: cardHeight
            };
        });
    }

    /**
     * Returns a specific color hex code based on the upgrade tier level.
     * @param {number} tierIndex - The rarity tier index
     * @returns {string} Hex color code
     */
    getTierColor(tierIndex) {
        switch (tierIndex) {
            case 0: return '#3498db'; // Basic (Blue)
            case 1: return '#9b59b6'; // Rare (Purple)
            case 2: return '#f1c40f'; // Legendary (Gold)
            default: return '#ffffff';
        }
    }

    /**
     * Generates square particles bursting outward from the card's edges.
     * @param {Object} cardBounds - Object containing x, y, width, and height of the card
     * @param {string} color - The particle color (hex code)
     */
    spawnParticles(cardBounds, color) {
        const particleCount = 40;
        const baseSize = 20; // Represents a solid pixel block size

        for (let i = 0; i < particleCount; i++) {
            // Select a random edge (0: Top, 1: Right, 2: Bottom, 3: Left)
            const edge = Math.floor(Math.random() * 4);

            let pX, pY, vX, vY;
            const speed = Math.random() * 3 + 2;
            const spread = (Math.random() - 0.5) * 2; // Tangential scatter

            switch (edge) {
                case 0: // Top edge
                    pX = cardBounds.x + Math.random() * cardBounds.width;
                    pY = cardBounds.y;
                    vX = spread;
                    vY = -speed; // Push upward
                    break;
                case 1: // Right edge
                    pX = cardBounds.x + cardBounds.width;
                    pY = cardBounds.y + Math.random() * cardBounds.height;
                    vX = speed;  // Push rightward
                    vY = spread;
                    break;
                case 2: // Bottom edge
                    pX = cardBounds.x + Math.random() * cardBounds.width;
                    pY = cardBounds.y + cardBounds.height;
                    vX = spread;
                    vY = speed;  // Push downward
                    break;
                case 3: // Left edge
                    pX = cardBounds.x;
                    pY = cardBounds.y + Math.random() * cardBounds.height;
                    vX = -speed; // Push leftward
                    vY = spread;
                    break;
            }

            this.particles.push({
                x: pX,
                y: pY,
                vx: vX,
                vy: vY,
                size: baseSize,
                gravity: 0.15, // Downward pull over time
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                color: color
            });
        }
    }

    selectUpgrade(index) {
        // Prevent multiple selections during the animation phase
        if (this.state !== 'SELECTING') return;

        this.state = 'ANIMATING';
        this.selectedCardIndex = index;
        const selectedCard = this.cards[index];
        const selected = selectedCard.choice;
        const color = this.getTierColor(selected.tierIndex);

        // Apply the upgrade logic to the player data immediately
        if (selected.config.onApply) {
            selected.config.onApply(this.playerRef, selected.tierIndex, this.currentWave);
        }

        // Update the player sprite if the upgrade is an archetype variant
        if (selected.config.playerVariantIndex !== undefined) {
            if (this.playerRef.setVariant) {
                this.playerRef.setVariant(selected.config.playerVariantIndex);
            } else {
                this.playerRef.currentVariant = selected.config.playerVariantIndex;
                const img = this.gameManager.assets.getImage('ships');
                this.playerRef.frame = ShipsAtlas.getFrame(selected.config.playerVariantIndex, img.width, img.height);
            }
        }

        // Trigger the visual burst using the card's full geometry
        this.spawnParticles(selectedCard, color);

        // Keep the overlay open temporarily to display the visual effects
        this.animationTimer = 600;
    }

    update(dt, pointer) {
        if (!this.isActive) return;

        // Process particle physics and animation timer while in ANIMATING state
        if (this.state === 'ANIMATING') {
            this.animationTimer -= dt;
            const timeFactor = dt * 0.06;

            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                
                p.x += p.vx * timeFactor;
                p.y += p.vy * timeFactor;
                p.vy += p.gravity * timeFactor; // Apply gravity for an arc trajectory
                p.life -= p.decay * timeFactor;
                
                if (p.life <= 0) this.particles.splice(i, 1);
            }

            // Close the overlay once the animation completes and trigger screen fade
            if (this.animationTimer <= 0) {
                this.isActive = false;
                
                gameEvents.emit(EVENTS.SCREEN_FADE, {
                    duration: 400,
                    startAlpha: 0.85,
                    endAlpha: 0.0,
                    color: '#000000'
                });

                this.onComplete();
            }
            return;
        }

        // Standard selection logic
        const elapsed = performance.now() - this.startTime;
        
        // Prevent accidental clicks immediately upon opening
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
            } else { line = testLine; }
        }
        ctx.fillText(line.trim(), x, currentY);
    }

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;

        // Draw dark background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        // Render continuous speed lines in the background
        drawMangaLines(ctx, width, height, performance.now());

        // Header Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${GameConfig.FONT_SIZE_LG}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EVOLUTION READY', width / 2, height * 0.15);

        const playerImage = this.gameManager.assets.getImage('ships');
        const propsImage = this.gameManager.assets.getImage('props');

        this.cards.forEach((card, index) => {
            // Hide unselected cards during the collection animation
            if (this.state === 'ANIMATING' && this.selectedCardIndex !== index) {
                return;
            }

            const isHovered = this.hoveredIndex === index;
            const config = card.choice.config;
            const tierColor = this.getTierColor(card.choice.tierIndex);

            ctx.save();

            // Apply glow effect for hovered or actively animating cards
            if (isHovered || (this.state === 'ANIMATING' && this.selectedCardIndex === index)) {
                ctx.shadowColor = tierColor;
                ctx.shadowBlur = 20;
            }

            ctx.fillStyle = isHovered ? '#2c3e50' : '#1a252f';
            ctx.strokeStyle = tierColor;
            ctx.lineWidth = isHovered ? 6 : 3;

            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.width, card.height, 15);
            ctx.fill();
            ctx.stroke();

            ctx.restore(); // Remove shadow glow before drawing internal text/sprites

            const spriteSize = card.width * 0.6;
            const spriteX = card.x + (card.width / 2) - (spriteSize / 2);
            const spriteY = card.y + (card.height * 0.15);

            // Draw either the player ship variant or a generic props icon
            if (config.playerVariantIndex !== undefined && playerImage) {
                const safeIndex = config.playerVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
                const frame = ShipsAtlas.getFrame(safeIndex, playerImage.width, playerImage.height);
                ctx.drawImage(
                    playerImage,
                    frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                    spriteX, spriteY, spriteSize, spriteSize
                );
            } else if (propsImage && PropsAtlas && PropsAtlas.bonus) {
                const frame = PropsAtlas.bonus;
                const iconSize = spriteSize * 0.5;
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

            // Dynamically scale card title to prevent overflow
            ctx.fillStyle = isHovered ? tierColor : '#ffffff';
            let titleFontSize = GameConfig.FONT_SIZE_SM;
            ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;

            let titleWidth = ctx.measureText(config.title).width;
            if (titleWidth > maxTextWidth) {
                titleFontSize = titleFontSize * (maxTextWidth / titleWidth);
                ctx.font = `bold ${titleFontSize}px ${GameConfig.FONT_FAMILY}`;
            }

            ctx.textAlign = 'center';
            ctx.fillText(config.title, textCenterX, card.y + card.height * 0.6);

            ctx.fillStyle = '#bdc3c7';
            const descFontSize = GameConfig.FONT_SIZE_SM * 0.75;
            ctx.font = `normal ${descFontSize}px ${GameConfig.FONT_FAMILY}`;

            const startDescY = card.y + card.height * 0.75;
            const lineHeight = descFontSize * 1.4;
            const descriptionText = config.getDescription(card.choice.tierIndex, this.currentWave);

            this.drawWrappedText(ctx, descriptionText, textCenterX, startDescY, maxTextWidth, lineHeight);
        });

        // Render collection particles on top of everything
        if (this.particles.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false; // Ensures crisp edges for pixel art styling

            this.particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                
                const currentSize = Math.max(1, p.size * (0.5 + p.life * 0.5));
                
                // Use Math.floor on fillRect coordinates to align strictly to the pixel grid
                ctx.fillRect(
                    Math.floor(p.x - currentSize / 2),
                    Math.floor(p.y - currentSize / 2),
                    Math.floor(currentSize),
                    Math.floor(currentSize)
                );
            });
            ctx.restore();
        }
    }
}