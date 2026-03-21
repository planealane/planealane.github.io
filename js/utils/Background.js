// js/utils/Background.js
import { GameConfig } from '../GameConfig.js';
import { CloudAtlas } from './CloudAtlas.js';

class Cloud {
    constructor(image, canvasWidth, frame, isLeft) {
        this.image = image;
        this.frame = frame; 

        // Depth factor (Z-axis): 0.2 (far back) to 1.0 (foreground)
        this.depth = 0.2 + Math.random() * 0.8;
        
        // Massive scale to ensure bases are hidden and clouds look like giant walls
        // Base scale of 3.0, plus up to 4.0 based on depth
        this.scale = 3.0 + (this.depth * 4.0); 
        this.opacity = 0.6 + (this.depth * 0.4); 

        this.width = this.frame.sWidth * this.scale;
        this.height = this.frame.sHeight * this.scale;

        // --- POSITIONING & 90 DEGREE TILT LOGIC ---
        // Because of the 90 deg rotation, local 'height' becomes the visual horizontal width on screen.
        // The base of the cloud is at local +height/2. 
        // To hide the base completely, we push the anchor far outside the screen bounds.
        
        // We want the cloud to intrude about 15-25% into the screen
        const intrusion = canvasWidth * (0.15 + Math.random() * 0.10); 
        
        if (isLeft) {
            this.rotation = Math.PI / 2;
            // Push left so the base (left side) is off-screen, but the top reaches 'intrusion' pixels in
            this.x = intrusion - (this.height / 2); 
        } else {
            this.rotation = -Math.PI / 2;
            // Push right so the base (right side) is off-screen
            this.x = canvasWidth - intrusion + (this.height / 2);
        }

        // Spawn well above the visible screen area to prevent popping
        const maxDimension = Math.max(this.width, this.height);
        this.y = -maxDimension - 100;

        // Parallax speed
        const baseScrollSpeed = GameConfig.SCROLL_SPEED * 0.6;
        this.speedY = baseScrollSpeed * this.depth;
        
        this.markForDeletion = false;
    }

    update(dt) {
        this.y += this.speedY * dt;

        // Clean up when completely off the bottom
        if (this.y > GameConfig.GAME_HEIGHT + this.width + 100) { 
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.drawImage(
            this.image, 
            this.frame.sx,     this.frame.sy,     this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2, this.width,       this.height
        );
        
        ctx.restore();
    }
}

export class Background {
    constructor(assets, canvasWidth, canvasHeight) {
        this.bgImage = assets.getImage('plain-sky');
        this.cloudImage = assets.getImage('clouds'); 
        
        this.width = canvasWidth;
        this.height = canvasHeight;

        this.clouds = [];
        this.spawnTimer = 0;
        
        // Fast interval to ensure a thick, unbroken wall of clouds
        this.spawnInterval = 200; 
        
        this.preWarm();
    }

    preWarm() {
        // Reduced step to make the initial wall much denser
        const stepY = 100; 
        const startY = -this.height * 0.5;

        for (let y = startY; y < this.height + 300; y += stepY) {
            const cloudL = new Cloud(this.cloudImage, this.width, CloudAtlas.getRandomFrame(), true);
            cloudL.y = y + (Math.random() * 60 - 30);
            this.clouds.push(cloudL);

            const cloudR = new Cloud(this.cloudImage, this.width, CloudAtlas.getRandomFrame(), false);
            cloudR.y = y + (Math.random() * 60 - 30);
            this.clouds.push(cloudR);
        }
    }

    update(dt) {
        this.spawnTimer += dt;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            // Keep interval tight for high density
            this.spawnInterval = 150 + Math.random() * 150; 
            
            this.clouds.push(new Cloud(this.cloudImage, this.width, CloudAtlas.getRandomFrame(), true));
            this.clouds.push(new Cloud(this.cloudImage, this.width, CloudAtlas.getRandomFrame(), false));
        }

        this.clouds.forEach(cloud => cloud.update(dt));
        this.clouds = this.clouds.filter(cloud => !cloud.markForDeletion);
    }

    draw(ctx) {
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
        } else {
            ctx.fillStyle = '#87CEEB'; 
            ctx.fillRect(0, 0, this.width, this.height);
        }

        const sortedClouds = [...this.clouds].sort((a, b) => a.depth - b.depth);
        sortedClouds.forEach(cloud => cloud.draw(ctx));
    }
}