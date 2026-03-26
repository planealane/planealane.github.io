// js/entities/Entity.js
import { UIConfig } from '../UIConfig.js';
// 🗑️ GameConfig removed! Fonts are now globally handled by UIConfig.

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Draws text with a black outline for better readability against varied backgrounds.
 * Exported so individual entity classes can use it for HP, Loot, etc.
 */
export function drawFloatingText(ctx, text, x, y, color, fontSize = UIConfig.TYPOGRAPHY.SIZE_MD) {
    ctx.save();

    ctx.font = `bold ${fontSize}px ${UIConfig.TYPOGRAPHY.FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.1;
    ctx.strokeText(text, x, y);

    // Inner text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
}

/**
 * Standardized rendering for all bonus texts (Gates, Collectibles)
 */
export function drawBonusText(ctx, text, x, y, color, fontSize) {
    // Point to the newly nested structure in UIConfig
    const visuals = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;

    // Use the global typography settings
    ctx.font = `bold ${fontSize}px ${UIConfig.TYPOGRAPHY.FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Setup Drop Shadow
    ctx.shadowColor = visuals.SHADOW_COLOR;
    ctx.shadowBlur = visuals.SHADOW_BLUR;
    ctx.shadowOffsetY = visuals.SHADOW_OFFSET_Y;

    // 2. Draw Outline (Stroke)
    ctx.strokeStyle = visuals.OUTLINE_COLOR;
    ctx.lineWidth = visuals.OUTLINE_WIDTH;
    ctx.strokeText(text, x, y);

    // 3. Draw Fill (Disable shadow to prevent muddying the core color)
    ctx.shadowColor = 'transparent'; 
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ============================================================================
// BASE CLASSES
// ============================================================================

/**
 * Absolute base class for anything that exists in the game world.
 * Handles pure logical coordinates, dimensions, and lifecycle state.
 */
export class Entity {
    constructor(x, y, width, height, angle = 0, zIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle;
        this.zIndex = zIndex;
        
        // When true, the EntityManager will delete this object on the next frame
        this.markForDeletion = false; 
    }
}

/**
 * Base class for entities that render a portion of a spritesheet (Atlas).
 */
export class SpriteEntity extends Entity {
    constructor(x, y, width, height, image, frame, angle = 0, zIndex = 0) {
        super(x, y, width, height, angle, zIndex);
        this.image = image;
        this.frame = frame; // Expected format: {sx, sy, sWidth, sHeight}
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();
    }
}