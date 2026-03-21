// js/Button.js
import { UIConfig } from './UIConfig.js';
import { GameConfig } from '../GameConfig.js';

export class Button {
    // 1. Signature updated to use an optional config object
    constructor(text, x, y, themeKey, onClickCallback, options = {}) {
        this.text = text;
        this.baseX = x;
        this.baseY = y;
        this.anchorY = y; // Absolute origin for external animations (like breathing)
        this.onClick = onClickCallback;

        // 2. Default dimensions with optional overrides
        const defaults = UIConfig.BUTTON_DEFAULTS;
        this.width = options.width || defaults.width;
        this.height = options.height || defaults.height;
        this.fontSize = options.fontSize || GameConfig.FONT_SIZE_MD;

        // 3. Theme selection
        this.theme = UIConfig.BUTTON_THEMES[themeKey] || UIConfig.BUTTON_THEMES.primary;

        this.isHovered = false;
        this.isPressed = false;
    }

    update(pointerX, pointerY, isMouseDown) {
        // Check AABB collision
        this.isHovered = (
            pointerX >= this.baseX && 
            pointerX <= this.baseX + this.width &&
            pointerY >= this.baseY && 
            pointerY <= this.baseY + this.height
        );

        this.isPressed = this.isHovered && isMouseDown;
    }

    handleClick(pointerX, pointerY) {
        if (this.isHovered) {
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

        if (this.isPressed) {
            innerColor = this.theme.click;
            innerYOffset = -anims.BTN_INNER_SHIFT; 
        } else if (this.isHovered) {
            innerColor = this.theme.hover;
            currentY -= anims.BTN_HOVER_RISE; 
        }

        ctx.save();

        const radius = UIConfig.BUTTON_DEFAULTS.cornerRadius;

        // 1. Outer Chrome Border
        ctx.fillStyle = this.theme.border;
        ctx.beginPath();
        ctx.roundRect(this.baseX, currentY, this.width, this.height, radius);
        ctx.fill();

        // 2. Inner Button Background
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

        // 4. Button Text
        ctx.fillStyle = this.theme.text;
        ctx.font = `bold ${this.fontSize}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = this.baseX + this.width / 2;
        const textY = currentY + this.height / 2 + innerYOffset + 5; 
        ctx.fillText(this.text, textX, textY);

        ctx.restore();
    }
}