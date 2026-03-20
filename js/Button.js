// js/Button.js
import { UIConfig } from './UIConfig.js';
import { GameConfig } from './GameConfig.js';

export class Button {
    // Added themeKey parameter
    constructor(text, x, y, width, height, themeKey, onClickCallback) {
        this.text = text;
        this.baseX = x;
        this.baseY = y;
        this.width = width;
        this.height = height;
        this.onClick = onClickCallback;

        // Fetch the specific theme from config, fallback to primary if not found
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
        // Use theme colors dynamically
        let innerColor = this.theme.normal;
        let innerYOffset = UIConfig.BTN_INNER_SHIFT; 
        let currentY = this.baseY;

        if (this.isPressed) {
            innerColor = this.theme.click;
            innerYOffset = -UIConfig.BTN_INNER_SHIFT; 
        } else if (this.isHovered) {
            innerColor = this.theme.hover;
            currentY -= UIConfig.BTN_HOVER_RISE; 
        }

        ctx.save();

        // 1. Outer Chrome Border
        ctx.fillStyle = this.theme.border;
        ctx.beginPath();
        ctx.roundRect(this.baseX, currentY, this.width, this.height, 15);
        ctx.fill();

        // 2. Inner Button Background
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.roundRect(this.baseX, currentY + innerYOffset, this.width, this.height, 15);
        ctx.fill();

        // 3. Hover Glow Highlight
        if (this.isHovered && !this.isPressed) {
            // Optional: You could also put the glow color in the theme if needed
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'; 
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }

        // 4. Button Text
        ctx.fillStyle = this.theme.text;
        ctx.font = `bold ${GameConfig.FONT_SIZE_MD}px ${GameConfig.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = this.baseX + this.width / 2;
        const textY = currentY + this.height / 2 + innerYOffset + 5; 
        ctx.fillText(this.text, textX, textY);

        ctx.restore();
    }
}