// js/ui/Button.js
import { UIConfig } from '../UIConfig.js';
import { gameEvents, EVENTS } from '../core/EventBus.js';
// 🗑️ GameConfig has been completely removed!

export class Button {
    constructor(text, x, y, themeKey, onClickCallback, options = {}) {
        this.text = text;
        this.baseX = x;
        this.baseY = y;
        this.anchorY = y; 
        this.onClick = onClickCallback;

        // Default dimensions with optional overrides mapped to our new UIConfig structure
        const defaults = UIConfig.BUTTONS.DEFAULTS;
        this.width = options.width || defaults.width;
        this.height = options.height || defaults.height;
        this.fontSize = options.fontSize || UIConfig.TYPOGRAPHY.SIZE_MD;

        // Audio config
        this.sfxId = options.sfxId || 'button_interact';

        // Theme selection with fallback to primary
        const themes = UIConfig.BUTTONS.THEMES;
        this.theme = themes[themeKey] || themes.primary;

        this.isHovered = false;
        this.isPressed = false;
    }

    update(pointerX, pointerY, isMouseDown) {
        // [CRITICAL FIX] Extend the hitbox upwards if the button is visually lifted.
        // This prevents the hover state from flickering if the player moves the mouse up to follow the button.
        const hoverRiseOffset = this.isHovered ? UIConfig.ANIMATIONS.BTN_HOVER_RISE : 0;

        this.isHovered = (
            pointerX >= this.baseX && 
            pointerX <= this.baseX + this.width &&
            pointerY >= this.baseY - hoverRiseOffset && 
            pointerY <= this.baseY + this.height
        );

        this.isPressed = this.isHovered && isMouseDown;
    }

    handleClick(pointerX, pointerY) {
        if (this.isHovered) {
            gameEvents.emit(EVENTS.PLAY_SFX, { id: this.sfxId, volume: 0.8 });
            this.onClick();
            return true;
        }
        return false;
    }

    draw(ctx) {
        const anims = UIConfig.ANIMATIONS;
        let innerColor = this.theme.normal;
        let innerYOffset = anims.BTN_INNER_SHIFT; 
        let currentY = this.baseY;

        // Handle visual states (Pressed vs Hovered)
        if (this.isPressed) {
            innerColor = this.theme.click;
            innerYOffset = -anims.BTN_INNER_SHIFT; 
        } else if (this.isHovered) {
            innerColor = this.theme.hover;
            currentY -= anims.BTN_HOVER_RISE; 
        }

        ctx.save();

        const radius = UIConfig.BUTTONS.DEFAULTS.cornerRadius;

        // 1. Outer Chrome Border (Acts as the shadow/base)
        ctx.fillStyle = this.theme.border;
        ctx.beginPath();
        ctx.roundRect(this.baseX, currentY, this.width, this.height, radius);
        ctx.fill();

        // 2. Inner Button Background (The clickable surface)
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.roundRect(this.baseX, currentY + innerYOffset, this.width, this.height, radius);
        ctx.fill();

        // 3. Hover Glow Highlight
        if (this.isHovered && !this.isPressed) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'; 
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }

        // 4. Button Text Rendering
        ctx.fillStyle = this.theme.text;
        ctx.font = `bold ${this.fontSize}px ${UIConfig.TYPOGRAPHY.FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Vertically center the text considering the inner Y shift
        const textX = this.baseX + this.width / 2;
        const textY = currentY + this.height / 2 + innerYOffset + 5; 
        ctx.fillText(this.text, textX, textY);

        ctx.restore();
    }
}