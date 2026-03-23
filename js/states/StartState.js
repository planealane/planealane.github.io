// js/states/StartState.js
import { State } from './State.js';
import { Button } from '../ui/Button.js';
import { UIConfig } from '../UIConfig.js';
import { GameConfig } from '../GameConfig.js';
import { ShipsAtlas } from '../utils/Atlas.js';
// Optional: import { gameEvents, EVENTS } from '../core/EventBus.js'; // To play a sound on takeoff

export class StartState extends State {
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    enter() {
        this.bgImage = this.gameManager.assets.getImage('plain-sky');
        this.titleImage = this.gameManager.assets.getImage('title');
        this.playerImage = this.gameManager.assets.getImage('ships');

        // Variables for the transition choreography
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        
        // Array to easily manage future multiple buttons
        this.buttons = [];
        this.initUI();
        this.gameManager.audioManager.playMusic('title-theme', 0.5, 1000);
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
            () => this.startTransition(),
            { 
                width: playWidth, 
                height: playHeight,
                fontSize: GameConfig.FONT_SIZE_MD * 1.5,
                sfxId: 'game_start' // [NOUVEAU] On écrase le son par défaut
            }
        );

        this.startButton.anchorY = playBtnY;
        this.buttons.push(this.startButton);
    }

    startTransition() {
        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
        
        // If you have a plane accelerating sound, now is the time to emit it!
        // gameEvents.emit(EVENTS.PLAY_SFX, { id: 'engine-rev', volume: 0.8 });
    }

    // ============================================================================
    // LOGIC & RENDERING
    // ============================================================================

    update(dt, pointer) {
        // If transitioning, stop calculating hovers and manage the timer
        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStartTime;
            if (elapsed >= UIConfig.ANIMATIONS.START_TRANSITION_MS) {
                this.gameManager.changeState('PLAY');
            }
            return; 
        }

        const time = performance.now();
        const anims = UIConfig.ANIMATIONS;

        // Standard update
        this.buttons.forEach(btn => {
            btn.baseY = btn.anchorY + Math.sin(time * anims.BTN_BREATH_SPEED) * anims.BTN_BREATH_AMPLITUDE;
            btn.update(pointer.x, pointer.y, pointer.isDown);
        });

        if (pointer.isDown && !this.wasPointerDown) {
            // Clone the array to avoid bugs if a button modifies the list during the loop
            [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
        }
        
        this.wasPointerDown = pointer.isDown;
    }

    draw(ctx) {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const time = performance.now();
        const layout = UIConfig.SCREENS.START;
        const anims = UIConfig.ANIMATIONS;

        // --- CALCULATING TRANSITION OFFSETS ---
        let titleOffsetY = 0;
        let buttonsOffsetY = 0;
        let planeOffsetY = 0;
        let fadeAlpha = 0;

        if (this.isTransitioning) {
            const elapsed = time - this.transitionStartTime;
            const progress = Math.min(1, elapsed / anims.START_TRANSITION_MS);

            // 1. Title moves up and Buttons move down (0% to 40%)
            const UIProgress = Math.min(1, progress / 0.40);
            const UIEase = UIProgress * UIProgress; // Exponential acceleration (EaseIn)
            titleOffsetY = -UIEase * (height * 0.5); // Moves up off-screen
            buttonsOffsetY = UIEase * (height * 0.5); // Moves down off-screen

            // 2. Plane builds momentum (0% to 40%) then shoots up (40% to 100%)
            if (progress < 0.40) {
                // Anticipation (Squat) downwards
                const squatProgress = progress / 0.40;
                planeOffsetY = Math.sin(squatProgress * Math.PI) * 60; // Dips by 60 pixels
            } else {
                // Shoots upwards
                const takeoffProgress = (progress - 0.40) / 0.60;
                const takeoffEase = Math.pow(takeoffProgress, 3); // Starts slowly, finishes very fast
                planeOffsetY = -takeoffEase * (height * 1.2); // Dashes off-screen
            }

            // 3. Fade to black at the end (60% to 100%)
            if (progress > 0.60) {
                fadeAlpha = (progress - 0.60) / 0.40;
            }
        }

        // --- SCENE DRAWING ---

        // 1. Background
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, width, height);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Title (With its offset)
        let staticTitleBottomY = height * layout.TITLE_Y_PERCENTAGE; 
        if (this.titleImage) {
            const maxWidth = width * 0.8;
            const scale = Math.min(maxWidth / this.titleImage.width, 1);
            const scaledWidth = this.titleImage.width * scale;
            const scaledHeight = this.titleImage.height * scale;
            
            const titleX = width / 2 - scaledWidth / 2;
            const baseBreathY = Math.sin(time * anims.TITLE_BREATH_SPEED) * anims.TITLE_BREATH_AMPLITUDE;
            
            // Add the transition offset
            const titleY = staticTitleBottomY + baseBreathY + titleOffsetY;
            
            ctx.drawImage(this.titleImage, titleX, titleY, scaledWidth, scaledHeight);
            staticTitleBottomY += scaledHeight; 
        }

        // 3. Plane and particles (With offset)
        if (this.playerImage) {
            const safeIndex = GameConfig.PLAYER_BASE_VARIANT % ShipsAtlas.PLAYER_VARIANTS;
            const frame = ShipsAtlas.getFrame(safeIndex, this.playerImage.width, this.playerImage.height);
            const displaySize = GameConfig.TITLE_PLAYER_SIZE; 
            
            const spriteX = width / 2 - displaySize / 2;
            // Add the transition offset
            const spriteY = staticTitleBottomY + (height * layout.PLAYER_Y_OFFSET_PERCENTAGE) + planeOffsetY; 

            const trailCount = anims.EXHAUST_PARTICLE_COUNT;
            for (let i = 0; i < trailCount; i++) {
                const t = (time + i * (1000 / trailCount)) % 1000;
                const p = t / 1000; 

                // If transitioning, lengthen the trail to simulate speed
                const speedMultiplier = this.isTransitioning ? 3 : 1;
                
                const size = anims.EXHAUST_BASE_SIZE * (1 - p); 
                const alpha = 1 - Math.pow(p, 2); 
                const pX = spriteX + displaySize / 2 - size / 2;
                const pY = spriteY + displaySize * 0.85 + (p * anims.EXHAUST_MAX_DROP * speedMultiplier); 

                ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
                ctx.fillRect(pX, pY, size, size);
            }
            
            ctx.drawImage(
                this.playerImage,
                frame.sx, frame.sy, frame.sWidth, frame.sHeight,
                spriteX, spriteY, displaySize, displaySize
            );
        }

        // 4. Buttons (With offset)
        this.buttons.forEach(btn => {
            // Save the actual state for drawing
            const originalY = btn.baseY;
            btn.baseY += buttonsOffsetY;
            btn.draw(ctx);
            btn.baseY = originalY; // Restore
        });

        // 5. Overlay fade to black
        if (fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, width, height);
        }
    }
}