// js/ui/SuperUpgradeOverlay.js
import { UIConfig } from '../UIConfig.js';
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

        this.state = 'SELECTING'; 
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

        if (data.encounterType === 'TUTORIAL') {
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
        const layout = UIConfig.SCREENS.UPGRADE.LAYOUT;

        const cardWidth = width * layout.CARD_WIDTH_PCT;
        const cardHeight = height * layout.CARD_HEIGHT_PCT;
        const spacing = width * layout.CARD_SPACING_PCT;

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

    getTierColor(tierIndex) {
        const tiers = UIConfig.SCREENS.UPGRADE.COLORS.TIERS;
        return tiers[tierIndex] || tiers[3]; 
    }

    spawnParticles(cardBounds, color) {
        const config = UIConfig.SCREENS.UPGRADE.PARTICLES;
        
        for (let i = 0; i < config.COUNT; i++) {
            const edge = Math.floor(Math.random() * 4);

            let pX, pY, vX, vY;
            const speed = Math.random() * 3 + 2;
            const spread = (Math.random() - 0.5) * 2; 

            switch (edge) {
                case 0: // Top
                    pX = cardBounds.x + Math.random() * cardBounds.width;
                    pY = cardBounds.y;
                    vX = spread; vY = -speed; 
                    break;
                case 1: // Right
                    pX = cardBounds.x + cardBounds.width;
                    pY = cardBounds.y + Math.random() * cardBounds.height;
                    vX = speed; vY = spread;
                    break;
                case 2: // Bottom
                    pX = cardBounds.x + Math.random() * cardBounds.width;
                    pY = cardBounds.y + cardBounds.height;
                    vX = spread; vY = speed; 
                    break;
                case 3: // Left
                    pX = cardBounds.x;
                    pY = cardBounds.y + Math.random() * cardBounds.height;
                    vX = -speed; vY = spread;
                    break;
            }

            this.particles.push({
                x: pX, y: pY, vx: vX, vy: vY,
                size: config.BASE_SIZE,
                gravity: config.GRAVITY, 
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                color: color
            });
        }
    }

    selectUpgrade(index) {
        if (this.state !== 'SELECTING') return;

        this.state = 'ANIMATING';
        this.selectedCardIndex = index;
        const selectedCard = this.cards[index];
        const selected = selectedCard.choice;
        const color = this.getTierColor(selected.tierIndex);

        if (selected.config.onApply) {
            selected.config.onApply(this.playerRef, selected.tierIndex, this.currentWave);
        }

        if (selected.config.playerVariantIndex !== undefined) {
            if (this.playerRef.setVariant) {
                this.playerRef.setVariant(selected.config.playerVariantIndex);
            } else {
                this.playerRef.currentVariant = selected.config.playerVariantIndex;
                const img = this.gameManager.assets.getImage('ships');
                this.playerRef.frame = ShipsAtlas.getFrame(selected.config.playerVariantIndex, img.width, img.height);
            }
        }

        this.spawnParticles(selectedCard, color);
        this.animationTimer = UIConfig.SCREENS.UPGRADE.TIMING.ANIMATION_MS;
    }

    update(dt, pointer) {
        if (!this.isActive) return;

        const config = UIConfig.SCREENS.UPGRADE.TIMING;

        if (this.state === 'ANIMATING') {
            this.animationTimer -= dt;
            const timeFactor = dt * 0.06;

            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];

                p.x += p.vx * timeFactor;
                p.y += p.vy * timeFactor;
                p.vy += p.gravity * timeFactor; 
                p.life -= p.decay * timeFactor;

                if (p.life <= 0) this.particles.splice(i, 1);
            }

            if (this.animationTimer <= 0) {
                this.isActive = false;

                gameEvents.emit(EVENTS.SCREEN_FADE, {
                    duration: config.FADE_OUT_MS,
                    startAlpha: 0.85,
                    endAlpha: 0.0,
                    color: UIConfig.SCREENS.UPGRADE.COLORS.FADE_OUT
                });

                const selectedChoice = this.cards[this.selectedCardIndex].choice;
                const tierColor = this.getTierColor(selectedChoice.tierIndex);
                this.onComplete(tierColor);
            }
            return;
        }

        const elapsed = performance.now() - this.startTime;

        if (elapsed < config.CLICK_DELAY_MS) {
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
        if (!text) return; // Sécurité si le texte n'est pas défini
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
        const config = UIConfig.SCREENS.UPGRADE;
        const typo = UIConfig.TYPOGRAPHY;

        // Overlay
        ctx.fillStyle = config.COLORS.OVERLAY_BG;
        ctx.fillRect(0, 0, width, height);

        drawMangaLines(ctx, width, height, performance.now());

        // Header
        ctx.fillStyle = config.COLORS.TEXT_TITLE;
        ctx.font = `bold ${typo.SIZE_LG}px ${typo.FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.TEXT.TITLE, width / 2, height * config.LAYOUT.TITLE_Y_PCT);

        const playerImage = this.gameManager.assets.getImage('ships');
        const propsImage = this.gameManager.assets.getImage('props');

        this.cards.forEach((card, index) => {
            if (this.state === 'ANIMATING' && this.selectedCardIndex !== index) return;

            const isHovered = this.hoveredIndex === index;
            const cardConfig = card.choice.config;
            const tierIndex = card.choice.tierIndex;
            const tierColor = this.getTierColor(tierIndex);

            // =================================================================
            // [MODIFIÉ] EXTRACTION DES TEXTES DEPUIS UICONFIG
            // =================================================================
            let uiTextConfig = config.TEXT.ARCHETYPES[cardConfig.id] || config.TEXT.ENHANCEMENTS[cardConfig.id];
            
            // Fallback de sécurité au cas où l'ID n'est pas trouvé dans UIConfig
            let displayTitle = uiTextConfig ? uiTextConfig.TITLE : "UNKNOWN UPGRADE";
            let displayDesc = "No description available.";

            if (uiTextConfig && typeof uiTextConfig.DESC === 'function') {
                // On passe les paramètres nécessaires selon l'ID
                if (cardConfig.id.startsWith('CLASS_')) {
                    // Les archétypes ont besoin de bonus spécifiques
                    if (cardConfig.id === 'CLASS_GUNNER') displayDesc = uiTextConfig.DESC(cardConfig.hasteBonus, cardConfig.damagePenalty);
                    if (cardConfig.id === 'CLASS_CANNON') displayDesc = uiTextConfig.DESC(cardConfig.damageBonus, cardConfig.hastePenalty);
                    if (cardConfig.id === 'CLASS_SPREAD') displayDesc = uiTextConfig.DESC(cardConfig.projectileBonus, cardConfig.damagePenalty);
                } else {
                    // Les enhancements ont besoin de la valeur du tableau au bon tierIndex
                    let bonusValue = 0;
                    if (cardConfig.damageBonus) bonusValue = cardConfig.damageBonus[tierIndex];
                    else if (cardConfig.hasteBonus) bonusValue = cardConfig.hasteBonus[tierIndex];
                    else if (cardConfig.baseHpBonus) {
                        // Pour Heavy Armor, il faut calculer le HpScale
                        bonusValue = UpgradesConfig.COMPUTE.hpScale(cardConfig.baseHpBonus[tierIndex], this.currentWave);
                    }
                    else if (cardConfig.droneCountBonus) bonusValue = cardConfig.droneCountBonus;
                    
                    displayDesc = uiTextConfig.DESC(bonusValue);
                }
            }
            // =================================================================

            ctx.save();

            if (isHovered || (this.state === 'ANIMATING' && this.selectedCardIndex === index)) {
                ctx.shadowColor = tierColor;
                ctx.shadowBlur = config.LAYOUT.SHADOW_BLUR;
            }

            ctx.fillStyle = isHovered ? config.COLORS.CARD_BG_HOVER : config.COLORS.CARD_BG_NORMAL;
            ctx.strokeStyle = tierColor;
            ctx.lineWidth = isHovered ? config.LAYOUT.BORDER_HOVER : config.LAYOUT.BORDER_NORMAL;

            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.width, card.height, config.LAYOUT.CARD_RADIUS);
            ctx.fill();
            ctx.stroke();

            ctx.restore(); 

            const spriteSize = card.width * config.LAYOUT.SPRITE_SIZE_PCT;
            const spriteX = card.x + (card.width / 2) - (spriteSize / 2);
            const spriteY = card.y + (card.height * config.LAYOUT.SPRITE_Y_PCT);

            if (cardConfig.playerVariantIndex !== undefined && playerImage) {
                const safeIndex = cardConfig.playerVariantIndex % ShipsAtlas.PLAYER_VARIANTS;
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

            ctx.fillStyle = isHovered ? tierColor : config.COLORS.TEXT_TITLE;
            let titleFontSize = typo.SIZE_SM;
            ctx.font = `bold ${titleFontSize}px ${typo.FAMILY}`;

            let titleWidth = ctx.measureText(displayTitle).width;
            if (titleWidth > maxTextWidth) {
                titleFontSize = titleFontSize * (maxTextWidth / titleWidth);
                ctx.font = `bold ${titleFontSize}px ${typo.FAMILY}`;
            }

            ctx.textAlign = 'center';
            ctx.fillText(displayTitle, textCenterX, card.y + card.height * config.LAYOUT.CARD_TITLE_Y_PCT);

            ctx.fillStyle = config.COLORS.TEXT_DESC;
            const descFontSize = typo.SIZE_SM * 0.75;
            ctx.font = `normal ${descFontSize}px ${typo.FAMILY}`;

            const startDescY = card.y + card.height * config.LAYOUT.CARD_DESC_Y_PCT;
            const lineHeight = descFontSize * 1.4;

            // On utilise notre texte de description généré plus haut
            this.drawWrappedText(ctx, displayDesc, textCenterX, startDescY, maxTextWidth, lineHeight);
        });

        // Particules
        if (this.particles.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false; 

            this.particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;

                const currentSize = Math.max(1, p.size * (0.5 + p.life * 0.5));

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