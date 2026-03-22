// js/ui/ProgressUI.js
import { GameConfig } from '../GameConfig.js';
import { ProgressAtlas, ShipsAtlas } from '../utils/Atlas.js';
import { LevelProgression } from '../config/LevelProgression.js';

export class ProgressUI {
    constructor(canvasHeight, assets) {
        this.assets = assets;

        this.targetRatio = 0;
        this.currentRatio = 0;

        // --- SCALING (Le secret est ici) ---
        // On passe de 1.5 à 3.0 pour doubler la largeur et la hauteur des tuiles
        this.scale = 3.0; 
        this.tileSize = ProgressAtlas.SIZE * this.scale;
        
        // Cible : ~75% de la hauteur de l'écran
        const targetHeight = canvasHeight * 0.75;
        
        // Le code calcule dynamiquement combien de "LEGO" il faut empiler.
        // Avec des tuiles 2x plus grosses, il mettra 2x moins de segments intermédiaires !
        this.totalTiles = Math.max(3, Math.floor(targetHeight / this.tileSize));
        
        this.width = this.tileSize;
        this.height = this.totalTiles * this.tileSize;
        
        // On la décale un peu plus (30 au lieu de 20) car elle est plus large
        this.x = 30; 
        this.y = (canvasHeight - this.height) / 2;

        this.layout = this.buildLayout();
    }

    buildLayout() {
        const layout = new Array(this.totalTiles).fill('pipe');
        
        layout[0] = 'footer';
        layout[this.totalTiles - 1] = 'header';

        if (!LevelProgression || LevelProgression.length === 0) return layout;

        const finalMilestone = LevelProgression[LevelProgression.length - 1];
        const totalGameDistance = Math.max(1, (finalMilestone.blockIndex - 1) * 300);

        LevelProgression.forEach(milestone => {
            if (milestone.type !== 'BOSS') return;
            
            const milestoneDistance = (milestone.blockIndex - 1) * 300;
            const ratio = milestoneDistance / totalGameDistance;
            
            let tileIndex = Math.round(ratio * (this.totalTiles - 1));
            tileIndex = Math.max(1, Math.min(this.totalTiles - 2, tileIndex));
            
            layout[tileIndex] = 'boss';
        });

        return layout;
    }

    updateRatio(ratio) {
        this.targetRatio = Math.max(0, Math.min(1, ratio));
    }

    update(dt) {
        if (this.currentRatio < this.targetRatio) {
            this.currentRatio += 0.0005 * dt;
            if (this.currentRatio > this.targetRatio) {
                this.currentRatio = this.targetRatio;
            }
        } else if (this.targetRatio === 0 && this.currentRatio > 0) {
            this.currentRatio = 0;
        }
    }

    draw(ctx) {
        const sheet = this.assets.getImage('progress_spritesheet');
        if (!sheet) return;

        ctx.save();

        const fillLevel = this.currentRatio * this.totalTiles;

        for (let i = 0; i < this.totalTiles; i++) {
            const type = this.layout[i];
            const atlasData = ProgressAtlas[type];
            
            const drawY = this.y + this.height - ((i + 1) * this.tileSize);

            if (i < Math.floor(fillLevel)) {
                this.drawTile(ctx, sheet, atlasData.full, this.x, drawY, this.tileSize, this.tileSize);
            } 
            else if (i > Math.floor(fillLevel)) {
                this.drawTile(ctx, sheet, atlasData.empty, this.x, drawY, this.tileSize, this.tileSize);
            } 
            else {
                this.drawTile(ctx, sheet, atlasData.empty, this.x, drawY, this.tileSize, this.tileSize);
                
                const fraction = fillLevel - i;
                if (fraction > 0) {
                    const cropHeight = fraction * ProgressAtlas.SIZE;
                    const drawCropHeight = fraction * this.tileSize;
                    
                    const partialFrame = {
                        sx: atlasData.full.sx,
                        sy: atlasData.full.sy + (ProgressAtlas.SIZE - cropHeight),
                        sWidth: ProgressAtlas.SIZE,
                        sHeight: cropHeight
                    };
                    
                    const partialDrawY = drawY + this.tileSize - drawCropHeight;
                    
                    this.drawTile(ctx, sheet, partialFrame, this.x, partialDrawY, this.tileSize, drawCropHeight);
                }
            }
        }

        if (this.currentRatio > 0) {
            const playerY = this.y + this.height - (this.height * this.currentRatio);
            this.drawPlayerIcon(ctx, this.x + (this.tileSize / 2), playerY);
        }

        ctx.restore();
    }

    drawTile(ctx, image, frame, dx, dy, dw, dh) {
        ctx.drawImage(
            image,
            frame.sx, frame.sy, frame.sWidth, frame.sHeight,
            dx, dy, dw, dh
        );
    }

drawPlayerIcon(ctx, x, y) {
        const playerImage = this.assets.getImage('ships');
        if (!playerImage) return;

        ctx.save();
        
        // Apply heavy shadow to make the large icon pop against the background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 6;

        const safeIndex = GameConfig.PLAYER_BASE_VARIANT % ShipsAtlas.PLAYER_VARIANTS;
        const frame = ShipsAtlas.getFrame(safeIndex, playerImage.width, playerImage.height);
        
        // Icon size multiplied by 3 (48 * 3 = 144)
        const iconSize = 144; 
        
        ctx.drawImage(
            playerImage,
            frame.sx, frame.sy, frame.sWidth, frame.sHeight,
            x - iconSize / 2, y - iconSize / 2, 
            iconSize, iconSize
        );
        
        ctx.restore();
    }
}