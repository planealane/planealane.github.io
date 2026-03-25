// js/utils/VFXUtils.js

/**
 * Renders an algorithmic exhaust trail for ships.
 * Stateless pure function.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - Top-left X position
 * @param {number} y - Top-left Y position
 * @param {number} width - Sprite width
 * @param {number} height - Sprite height
 * @param {number} time - Current timestamp
 * @param {boolean} isReversed - True if the exhaust should point upwards
 * @param {number} speedMultiplier - Stretches the trail for speed effects
 */
export function drawAlgorithmicTrail(ctx, x, y, width, height, time, isReversed = false, speedMultiplier = 1) {
    const trailCount = 8; 
    const maxDrop = height * 0.8;
    
    // Reduced base size by 20% (0.15 * 0.8 = 0.12)
    const baseSize = width * 0.12; 

    for (let i = 0; i < trailCount; i++) {
        const t = (time + i * (1000 / trailCount)) % 1000;
        const p = t / 1000;

        const size = baseSize * (1 - p);
        
        // Added 30% transparency (max alpha capped at 0.7)
        const alpha = (1 - Math.pow(p, 2)) * 0.7; 
        
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

/**
 * Dessine un effet de lignes de vitesse style "Manga/Hyperespace"
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width - Largeur de l'écran
 * @param {number} height - Hauteur de l'écran
 * @param {number} time - Temps actuel pour l'animation
 */
export function drawMangaLines(ctx, width, height, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    const lineCount = 40;
    
    ctx.save();
    // On centre le contexte pour faciliter la rotation
    ctx.translate(centerX, centerY);
    
    for (let i = 0; i < lineCount; i++) {
        // Calcul d'un angle pour chaque ligne
        const angle = (Math.PI * 2 / lineCount) * i;
        
        // Ajoute un peu d'aléatoire basé sur l'index pour désynchroniser les lignes
        const offset = (time * 0.5 + i * 100) % 500;
        const lineLength = 100 + (Math.sin(time * 0.005 + i) * 50);
        
        ctx.rotate(angle);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (offset / 1000)})`;
        // Dessine la ligne (qui part du centre + offset vers l'extérieur)
        ctx.fillRect(offset, -1, lineLength, 2);
        
        // Annule la rotation pour la prochaine itération
        ctx.rotate(-angle);
    }
    
    ctx.restore();
}