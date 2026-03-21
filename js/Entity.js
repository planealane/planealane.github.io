// js/Entity.js
import { GameConfig } from './GameConfig.js';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Draws text with a black outline for better readability against varied backgrounds.
 * Exported so individual entity classes can use it for HP, Loot, etc.
 */
export function drawFloatingText(ctx, text, x, y, color, fontSize = GameConfig.FONT_SIZE_MD) {
    ctx.save();

    ctx.font = `bold ${fontSize}px ${GameConfig.FONT_FAMILY}`;
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