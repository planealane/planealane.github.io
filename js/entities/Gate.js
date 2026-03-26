// js/entities/Gate.js
import { GameConfig } from '../GameConfig.js';
import { UIConfig } from '../UIConfig.js';
import { BaseItem } from './BaseItem.js';
import { drawBonusText } from './Entity.js';
import { UpgradesConfig } from '../config/UpgradesConfig.js'; 

export class Gate extends BaseItem {
    constructor(x, y, image, currentWave = 1) {
        const frame = { sx: 0, sy: 0, sWidth: image.width, sHeight: image.height };
        
        // Calculate dimensions based on the core logical configuration
        const targetWidth = GameConfig.GATE_BASE_WIDTH; 
        const targetHeight = targetWidth * (image.height / image.width);

        // Call BaseItem constructor. Default Z-Index for gates is 0 (Background layer)
        super(x, y, targetWidth, targetHeight, image, frame, 0); 
        
        // Determine upgrade type dynamically from the configuration keys
        const upgradeKeys = Object.keys(UpgradesConfig.PORTALS);
        this.bonusType = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        
        // [NEW] Use weighted random drawing to determine upgrade rarity (e.g., 60% T1, 30% T2, 10% T3)
        this.tierIndex = UpgradesConfig.RANDOM.getWeightedTierIndex(); 
        this.bonusValue = UpgradesConfig.PORTALS[this.bonusType][this.tierIndex]; 
        
        // [NEW] Calculate the actual value for display if the upgrade scales (like Hull Repair)
        let displayValue = this.bonusValue;
        if (this.bonusType === 'HULL_REPAIR') {
            displayValue = UpgradesConfig.COMPUTE.hpScale(this.bonusValue, currentWave);
        }

        // --- UI CONFIG UPDATE ---
        // Fetch UI formatting using the updated, nested UIConfig paths
        const visualConfig = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS;
        
        this.text = visualConfig.getLabel(this.bonusType, displayValue);
        this.color = visualConfig.getColor(this.bonusType);
    }

    update(dt) {
        super.update(dt); // Handles aliveTime and boundary checking
        
        // Move the gate down the screen based on the global scroll speed
        this.y += this.baseSpeed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw the gate sprite centered on its coordinates
        ctx.drawImage(
            this.image,
            this.frame.sx, this.frame.sy, this.frame.sWidth, this.frame.sHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        // Render standardized text using the shared utility and the correct UIConfig path
        const fontSize = UIConfig.SCREENS.IN_GAME.BONUS_VISUALS.FONT_SIZE_GATE;
        drawBonusText(ctx, this.text, 0, -10, this.color, fontSize);
        
        ctx.restore();
    }
}