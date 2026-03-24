// js/utils/VFXUtils.js

/**
 * Renders an algorithmic exhaust trail for ships.
 * Stateless pure function.
 * * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - Top-left X position
 * @param {number} y - Top-left Y position
 * @param {number} width - Sprite width
 * @param {number} height - Sprite height
 * @param {number} time - Current timestamp
 * @param {boolean} isReversed - True if the exhaust should point upwards
 */
export function drawAlgorithmicTrail(ctx, x, y, width, height, time, isReversed = false, speedMultiplier = 1) {
    const trailCount = 8; 
    const maxDrop = height * 0.8;
    const baseSize = width * 0.15;

    for (let i = 0; i < trailCount; i++) {
        const t = (time + i * (1000 / trailCount)) % 1000;
        const p = t / 1000;

        const size = baseSize * (1 - p);
        const alpha = 1 - Math.pow(p, 2);
        const pX = x + width / 2 - size / 2;
        
        let pY;
        if (isReversed) {
            pY = y + height * 0.15 - (p * maxDrop * speedMultiplier);
        } else {
            pY = y + height * 0.85 + (p * maxDrop * speedMultiplier);
        }

        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.fillRect(pX, pY, size, size);
    }
}