// js/ui/TutorialOverlay.js
import { Button } from './Button.js';
import { UIConfig } from '../UIConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Gate } from '../entities/Gate.js';

// ============================================================================
// UTILITY: EASING FUNCTION
// ============================================================================
/**
 * Smooth ease-out function (Quartic). 
 * Starts fast, then smoothly decelerates to 0.
 */
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

export class TutorialOverlay {

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    constructor(gameManager, onComplete) {
        this.gameManager = gameManager;
        this.onComplete = onComplete;
        this.isActive = false;
        
        this.currentScreen = 1; 
        this.buttons = [];
        this.wasPointerDown = false;

        // --- ANIMATION STATE & CONFIGURATION ---
        this.animTimer = 0; 
        
        this.animConfig = {
            slideDuration: 1000,  
            bgFadeDuration: 800,  
            
            // Extended delays with clear pauses between elements
            delaysScreen1: {
                title: 400,       
                screen1: 900,     
                legend1: 1200,    
                screen2: 1700,    
                legend2: 2000,    
                button: 2600      
            },
            
            // Spaced out the Screen 2 choreography
            delaysScreen2: {
                title: 0,
                screen1: 400,
                legend1: 700,
                screen2: 1200,
                legend2: 1500,
                button: 2100
            }
        };

        // Holds the current calculated offsets updated every frame
        this.animState = {
            bgOpacity: 0,
            titleOffsetX: 0,
            screen1OffsetX: 0,
            legend1OffsetX: 0,
            screen2OffsetX: 0,
            legend2OffsetX: 0,
            buttonOpacity: 0
        };

        // State containers for the fake background simulations
        this.simulations = {
            primary: {
                player: null, enemies: [], projectiles: [],
                box: { x: 0, y: 0, w: 0, h: 0 } 
            },
            secondary: {
                player: null, enemies: [], projectiles: [],
                box: { x: 0, y: 0, w: 0, h: 0 }
            },
            gates: {
                primary: null, secondary: null
            }
        };
    }

    start() {
        this.isActive = true;
        this.currentScreen = 1;
        this.animTimer = 0; 
        this.initSimulations();
        this.initUI();
        
        // Force position calculation BEFORE the first draw() call to prevent the frame-1 flash
        this.updateAnimationChoreography(); 
    }

    initUI() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;
        const config = UIConfig.SCREENS.TUTORIAL;

        const btnWidth = Math.min(UIConfig.BUTTONS.DEFAULTS.width * config.LAYOUT.BTN_WIDTH_MULT, width * config.LAYOUT.BTN_MAX_WIDTH_PCT);
        const btnHeight = UIConfig.BUTTONS.DEFAULTS.height * config.LAYOUT.BTN_HEIGHT_MULT;
        const btnFontSize = UIConfig.TYPOGRAPHY.SIZE_MD * 1.2;
        const btnY = height * config.LAYOUT.BTN_Y_PCT;

        this.buttons = []; 

        if (this.currentScreen === 1) {
            this.buttons.push(new Button(
                config.TEXT.BTN_NEXT,
                centerX - btnWidth / 2, btnY, 'menu',
                () => {
                    this.currentScreen = 2;
                    this.animTimer = 0; 
                    this.initUI(); 
                    // Prevent the flash when switching to screen 2
                    this.updateAnimationChoreography(); 
                },
                { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
            ));
        } else if (this.currentScreen === 2) {
            this.buttons.push(new Button(
                config.TEXT.BTN_PLAY,
                centerX - btnWidth / 2, btnY, 'start',
                () => this.closeTutorial(),
                { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
            ));
        }
    }

    initSimulations() {
        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const layout = UIConfig.SCREENS.TUTORIAL.LAYOUT;

        const boxW = layout.BOX_WIDTH;
        const boxH = layout.BOX_HEIGHT; 
        const spacing = layout.BOX_SPACING;
        
        this.simulations.primary.box = { x: centerX - boxW - spacing, y: centerY - boxH / 2, w: boxW, h: boxH };
        this.simulations.secondary.box = { x: centerX + spacing, y: centerY - boxH / 2, w: boxW, h: boxH };

        const shipImage = this.gameManager.assets.getImage('ships');

        // Helper to strip HP drawing logic from tutorial enemies
        const hideEnemyHP = (enemy) => {
            const originalDraw = enemy.draw.bind(enemy);
            enemy.draw = (ctx) => {
                const ogFill = ctx.fillText;
                const ogStroke = ctx.strokeText;
                ctx.fillText = () => {};   
                ctx.strokeText = () => {}; 
                originalDraw(ctx);         
                ctx.fillText = ogFill;     
                ctx.strokeText = ogStroke;
            };
        };

        // ==========================================
        // SCREEN 1: WEAPONS SIMULATION
        // ==========================================

        const pBox = this.simulations.primary.box;
        const pPlayer = new Player(shipImage);
        pPlayer.x = pBox.x + pBox.w / 2;
        pPlayer.y = pBox.y + pBox.h - 80; 
        pPlayer.weapons = [pPlayer.primaryWeapon]; 
        this.simulations.primary.player = pPlayer;

        const pEnemy = new Enemy(pBox.x + pBox.w / 2, pBox.y - 50, shipImage, 1, 0);
        hideEnemyHP(pEnemy); 
        this.simulations.primary.enemies.push(pEnemy);

        const sBox = this.simulations.secondary.box;
        const sPlayer = new Player(shipImage);
        sPlayer.x = sBox.x + sBox.w / 2;
        sPlayer.y = sBox.y + sBox.h - 80;
        sPlayer.weapons = [sPlayer.secondaryWeapon]; 
        
        sPlayer.secondaryWeapon.stats.cooldown = pPlayer.primaryWeapon.stats.cooldown;

        this.simulations.secondary.player = sPlayer;

        const sEnemy1 = new Enemy(sBox.x + sBox.w * 0.5, sBox.y - 50, shipImage, 3, 1);
        hideEnemyHP(sEnemy1); 
        this.simulations.secondary.enemies.push(sEnemy1);

        // ==========================================
        // SCREEN 2: GATES SETUP (STACKED LAYOUT)
        // ==========================================
        
        const gateImage = this.gameManager.assets.getImage('gate'); 
        const configColors = UIConfig.SCREENS.TUTORIAL.COLORS;
        const gateSpacingY = layout.GATE_SPACING_Y;
        
        // Calculate the starting Y to ensure the two gates are perfectly centered
        const topGateY = centerY - (gateSpacingY / 2) - 50; 
        const bottomGateY = topGateY + gateSpacingY;

        const primaryGate = new Gate(centerX, topGateY, gateImage, 1);
        primaryGate.text = '+ PRIMARY DMG'; 
        primaryGate.color = configColors.GATE_PRIMARY;     
        this.simulations.gates.primary = primaryGate;

        const secondaryGate = new Gate(centerX, bottomGateY, gateImage, 1);
        secondaryGate.text = '+ SECONDARY HASTE'; 
        secondaryGate.color = configColors.GATE_SECONDARY;          
        this.simulations.gates.secondary = secondaryGate;
    }

    closeTutorial() {
        this.isActive = false;
        if (this.onComplete) {
            this.onComplete();
        }
    }

    // ============================================================================
    // LOGIC & UPDATES
    // ============================================================================

    update(dt, pointer) {
        if (!this.isActive) return;
        if (this.gameManager.transitionManager && this.gameManager.transitionManager.isActive) return;

        // --- 1. Update Animation Timeline ---
        this.animTimer += dt;
        this.updateAnimationChoreography();

        // --- 2. Update Inputs (Only if button is fully visible) ---
        if (this.animState.buttonOpacity > 0.8) {
            this.buttons.forEach(btn => btn.update(pointer.x, pointer.y, pointer.isDown));
            
            if (pointer.isDown && !this.wasPointerDown) {
                [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
            }
        }

        // --- 3. Update Fake Gameplay ---
        if (this.currentScreen === 1) {
            this.updateFakeGameplay(dt, this.simulations.primary);
            this.updateFakeGameplay(dt, this.simulations.secondary);
        }

        this.wasPointerDown = pointer.isDown;
    }

    /**
     * Calculates the current position/opacity of all elements based on the timer.
     */
    updateAnimationChoreography() {
        // Background Fade - Only calculate the fade on Screen 1.
        if (this.currentScreen === 1) {
            const fadeProgress = Math.min(1, this.animTimer / this.animConfig.bgFadeDuration);
            this.animState.bgOpacity = fadeProgress * 0.8; 
        } else {
            this.animState.bgOpacity = 0.8;
        }

        // Select the appropriate delays based on the current screen
        const activeDelays = this.currentScreen === 1 ? this.animConfig.delaysScreen1 : this.animConfig.delaysScreen2;

        // Dynamically use the full screen width to guarantee elements start off-screen
        const slideOffset = this.gameManager.canvas.width; 

        // Helper to calculate specific offset based on delay
        const getOffset = (delay, isFromLeft) => {
            if (this.animTimer < delay) {
                // Stay fully off-screen until delay is reached
                return isFromLeft ? -slideOffset : slideOffset;
            }
            const progress = Math.min(1, (this.animTimer - delay) / this.animConfig.slideDuration);
            const eased = easeOutQuart(progress);
            const startPos = isFromLeft ? -slideOffset : slideOffset;
            return startPos * (1 - eased); // Approaches 0 as eased approaches 1
        };

        // Apply Offsets (Title from left, everything else from right)
        this.animState.titleOffsetX = getOffset(activeDelays.title, true);
        this.animState.screen1OffsetX = getOffset(activeDelays.screen1, false);
        this.animState.legend1OffsetX = getOffset(activeDelays.legend1, false);
        this.animState.screen2OffsetX = getOffset(activeDelays.screen2, false);
        this.animState.legend2OffsetX = getOffset(activeDelays.legend2, false);

        // Fade in button at the very end
        const btnProgress = Math.max(0, Math.min(1, (this.animTimer - activeDelays.button) / 300));
        this.animState.buttonOpacity = btnProgress;
    }

    // [Fake Gameplay Logic Remains Unchanged]
    updateFakeGameplay(dt, simState) {
        const box = simState.box;

        const mockEntityManager = {
            assets: this.gameManager.assets,
            entities: simState.enemies, 
            addEntity: (entity) => {
                if (entity.constructor.name === 'HomingProjectile') {
                    entity.getNearestTarget = () => null;
                    entity.vx = 0;
                    entity.vy = -Math.abs(entity.speed);
                }
                simState.projectiles.push(entity);
            }
        };

        if (simState.player) {
            simState.player.update(dt, simState.player.x, mockEntityManager);
        }

        simState.enemies.forEach(enemy => {
            enemy.update(dt);
            if (enemy.y > box.y + box.h + 50) {
                enemy.y = box.y - 50;
                enemy.hp = enemy.maxHp;
                enemy.hitScale = 1.0;
                enemy.markForDeletion = false; 
            }
        });

        for (let i = simState.projectiles.length - 1; i >= 0; i--) {
            const proj = simState.projectiles[i];
            const playerX = simState.player ? simState.player.x : 0;
            
            proj.update(dt, playerX, mockEntityManager);

            simState.enemies.forEach(enemy => {
                if (!enemy.markForDeletion && (!proj.spawnDelay || proj.spawnDelay <= 0)) {
                    if (this.checkCollision(proj, enemy)) {
                        enemy.hp -= 1; 
                        enemy.onHit(); 
                        proj.markForDeletion = true;

                        if (enemy.hp <= 0) {
                            enemy.y = box.y - 50;
                            enemy.hp = enemy.maxHp;
                        }
                    }
                }
            });

            if (proj.markForDeletion || 
                proj.y < box.y - 50 || proj.y > box.y + box.h + 50 ||
                proj.x < box.x - 50 || proj.x > box.x + box.w + 50) {
                simState.projectiles.splice(i, 1);
            }
        }
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
            rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
            rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
            rect1.y + rect1.height/2 > rect2.y - rect2.height/2
        );
    }

    // ============================================================================
    // RENDERING
    // ============================================================================

    draw(ctx) {
        if (!this.isActive) return;

        const width = this.gameManager.canvas.width;
        const height = this.gameManager.canvas.height;
        const config = UIConfig.SCREENS.TUTORIAL;

        // 1. Draw animated background overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${this.animState.bgOpacity})`;
        ctx.fillRect(0, 0, width, height);

        if (this.currentScreen === 1) {
            // Draw Title (from left) using the new engine
            const titleX = (width / 2) + this.animState.titleOffsetX;
            UIConfig.drawText(ctx, config.TEXT.TITLE_SCREEN_1, titleX, height * config.LAYOUT.TITLE_Y_PCT, config.STYLES.MAIN_TITLE);

            // Draw Primary Simulation (from right)
            ctx.save();
            ctx.translate(this.animState.screen1OffsetX, 0);
            this.drawFakeGameplay(ctx, this.simulations.primary, config.TEXT.PRIMARY_TITLE, config.TEXT.PRIMARY_DESC, this.animState.legend1OffsetX);
            ctx.restore();

            // Draw Secondary Simulation (from right, slightly later)
            ctx.save();
            ctx.translate(this.animState.screen2OffsetX, 0);
            this.drawFakeGameplay(ctx, this.simulations.secondary, config.TEXT.SECONDARY_TITLE, config.TEXT.SECONDARY_DESC, this.animState.legend2OffsetX);
            ctx.restore();

        } else if (this.currentScreen === 2) {
            // Draw Title (from left)
            const titleX = (width / 2) + this.animState.titleOffsetX;
            UIConfig.drawText(ctx, config.TEXT.TITLE_SCREEN_2, titleX, height * config.LAYOUT.TITLE_SCREEN_2_Y_PCT, config.STYLES.MAIN_TITLE);

            // Draw Primary Gate (from right)
            ctx.save();
            ctx.translate(this.animState.screen1OffsetX, 0);
            this.simulations.gates.primary.draw(ctx);
            // Render gate description text using universal text engine
            UIConfig.drawText(ctx, config.TEXT.GATE_PRIMARY_DESC, this.simulations.gates.primary.x, this.simulations.gates.primary.y + config.LAYOUT.GATE_DESC_OFFSET_Y, config.STYLES.GATE_DESC_PRIMARY);
            ctx.restore();

            // Draw Secondary Gate (from right)
            ctx.save();
            ctx.translate(this.animState.screen2OffsetX, 0);
            this.simulations.gates.secondary.draw(ctx);
            // Render gate description text using universal text engine
            UIConfig.drawText(ctx, config.TEXT.GATE_SECONDARY_DESC, this.simulations.gates.secondary.x, this.simulations.gates.secondary.y + config.LAYOUT.GATE_DESC_OFFSET_Y, config.STYLES.GATE_DESC_SECONDARY);
            ctx.restore();
        }

        // Draw Buttons (fade in)
        if (this.animState.buttonOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = this.animState.buttonOpacity;
            this.buttons.forEach(btn => btn.draw(ctx));
            ctx.restore();
        }
    }

    drawFakeGameplay(ctx, simState, title, description, textOffset = 0) {
        const box = simState.box;
        const config = UIConfig.SCREENS.TUTORIAL;

        // Draw the simulation box
        ctx.strokeStyle = config.COLORS.BOX_BORDER;
        ctx.lineWidth = config.LAYOUT.BOX_BORDER_WIDTH;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        
        // Draw the text (legend) with an additional offset so it arrives *after* the box
        ctx.save();
        ctx.translate(textOffset, 0);
        
        const centerX = box.x + box.w / 2;
        const bottomY = box.y + box.h;

        // Using the new ultra-clean text engine
        UIConfig.drawText(ctx, title, centerX, bottomY + config.LAYOUT.DESC_OFFSET_Y_1, config.STYLES.SIM_TITLE);
        UIConfig.drawText(ctx, description, centerX, bottomY + config.LAYOUT.DESC_OFFSET_Y_2, config.STYLES.SIM_DESC);

        ctx.restore();

        // Clip and draw the simulation contents
        ctx.save(); 
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h); 
        ctx.clip(); 

        ctx.fillStyle = config.COLORS.BOX_BG;
        ctx.fillRect(box.x, box.y, box.w, box.h);

        if (simState.player) simState.player.draw(ctx);
        simState.enemies.forEach(e => e.draw(ctx));
        simState.projectiles.forEach(p => p.draw(ctx));

        ctx.restore(); 
    }
}