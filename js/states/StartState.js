// js/states/StartState.js
import { State } from './State.js';
import { Button } from '../Button.js';
import { UIConfig } from '../UIConfig.js';
import { GameConfig } from '../GameConfig.js';
import { ShipsAtlas } from '../Atlas.js';

export class StartState extends State {
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        // Pre-fetch assets to avoid requesting them every frame
        this.bgImage = this.gameManager.assets.getImage('plain-sky');
        this.titleImage = this.gameManager.assets.getImage('title');
        this.playerImage = this.gameManager.assets.getImage('ships');

        this.initUI();
    }

    initUI() {
        const layout = UIConfig.SCREENS.START;
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;

        const playWidth = Math.min(UIConfig.BUTTON_DEFAULTS.width * layout.PLAY_BTN_SCALE, width * 0.9);
        const playHeight = UIConfig.BUTTON_DEFAULTS.height * layout.PLAY_BTN_SCALE;
        const playBtnY = height * layout.PLAY_BTN_Y_PERCENTAGE;

        this.startButton = new Button(
            'PLAY', 
            centerX - playWidth / 2, 
            playBtnY, 
            'start', 
            // Callback triggers the transition to PlayState (handled by GameManager later)
            () => this.gameManager.changeState('PLAY'),
            { 
                width: playWidth, 
                height: playHeight,
                fontSize: GameConfig.FONT_SIZE_MD * 1.5 
            }
        );

        this.startButton.anchorY = playBtnY;
    }

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        const time = performance.now();
        const anims = UIConfig.ANIMATIONS;

        // Animate button breathing effect
        this.startButton.baseY = this.startButton.anchorY + Math.sin(time * anims.BTN_BREATH_SPEED) * anims.BTN_BREATH_AMPLITUDE;
        
        // Update hover/press state
        this.startButton.update(pointer.x, pointer.y, pointer.isDown);

        // Check for click. If clicked, the callback defined in initUI() will fire.
        if (pointer.isDown && !this.wasPointerDown) {
            this.startButton.handleClick(pointer.x, pointer.y);
        }
        
        // Track pointer state to prevent multiple rapid clicks holding down
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const time = performance.now();
        const layout = UIConfig.SCREENS.START;
        const anims = UIConfig.ANIMATIONS;

        // 1. Draw background
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, width, height);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw breathing title
        let staticTitleBottomY = 0; 
        if (this.titleImage) {
            const maxWidth = width * 0.8;
            const scale = Math.min(maxWidth / this.titleImage.width, 1);
            const scaledWidth = this.titleImage.width * scale;
            const scaledHeight = this.titleImage.height * scale;
            
            const titleX = width / 2 - scaledWidth / 2;
            const titleBaseY = height * layout.TITLE_Y_PERCENTAGE; 
            const titleY = titleBaseY + Math.sin(time * anims.TITLE_BREATH_SPEED) * anims.TITLE_BREATH_AMPLITUDE;
            
            ctx.drawImage(this.titleImage, titleX, titleY, scaledWidth, scaledHeight);
            staticTitleBottomY = titleBaseY + scaledHeight; 
        }

        // 3. Draw stationary player and animated exhaust trail
        if (this.playerImage) {
            const safeIndex = GameConfig.PLAYER_BASE_VARIANT % ShipsAtlas.PLAYER_VARIANTS;
            const frame = ShipsAtlas.getFrame(safeIndex, this.playerImage.width, this.playerImage.height);
            const displaySize = GameConfig.TITLE_PLAYER_SIZE; 
            
            const spriteX = width / 2 - displaySize / 2;
            const spriteY = staticTitleBottomY + (height * layout.PLAYER_Y_OFFSET_PERCENTAGE); 

            // Exhaust particles
            const trailCount = anims.EXHAUST_PARTICLE_COUNT;
            for (let i = 0; i < trailCount; i++) {
                const t = (time + i * (1000 / trailCount)) % 1000;
                const progress = t / 1000; 

                const size = anims.EXHAUST_BASE_SIZE * (1 - progress); 
                const alpha = 1 - Math.pow(progress, 2); 
                const pX = spriteX + displaySize / 2 - size / 2;
                const pY = spriteY + displaySize * 0.85 + (progress * anims.EXHAUST_MAX_DROP); 

                ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
                ctx.fillRect(pX, pY, size, size);
            }
            
            ctx.drawImage(
                this.playerImage,
                frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                spriteX, spriteY, displaySize, displaySize
            );
        }

        // 4. Draw Start Button
        this.startButton.draw(ctx);
    }
}