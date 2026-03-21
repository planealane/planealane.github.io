// js/utils/Background.js

export class Background {
    constructor(assets, canvasWidth, canvasHeight) {
        this.bgImage = assets.getImage('plain-sky');
        
        this.width = canvasWidth;
        this.height = canvasHeight;
    }

    update(dt) {
        // No animated background elements for now.
        // Ready for future implementations (e.g., subtle scrolling).
    }

    draw(ctx) {
        // Draw static background
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
        } else {
            ctx.fillStyle = '#87CEEB'; // Fallback sky blue
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}