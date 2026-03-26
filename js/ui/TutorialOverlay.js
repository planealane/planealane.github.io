// js/ui/TutorialOverlay.js
import { Button } from './Button.js';
import { UIConfig } from '../UIConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Gate } from '../entities/Gate.js';

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
        this.initSimulations();
        this.initUI();
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
                    this.initUI(); 
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
        // SCREEN 2: GATES SETUP
        // ==========================================
        
        const gateImage = this.gameManager.assets.getImage('props'); 
        const configText = UIConfig.SCREENS.TUTORIAL.TEXT;
        const configColors = UIConfig.SCREENS.TUTORIAL.COLORS;

        const primaryGate = new Gate(centerX - 200, centerY - 50, gateImage, 1);
        primaryGate.text = '+ PRIMARY DMG'; 
        primaryGate.color = configColors.GATE_PRIMARY;     
        this.simulations.gates.primary = primaryGate;

        const secondaryGate = new Gate(centerX + 200, centerY - 50, gateImage, 1);
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

        this.buttons.forEach(btn => btn.update(pointer.x, pointer.y, pointer.isDown));
        
        if (pointer.isDown && !this.wasPointerDown) {
            [...this.buttons].forEach(btn => btn.handleClick(pointer.x, pointer.y));
        }

        if (this.currentScreen === 1) {
            this.updateFakeGameplay(dt, this.simulations.primary);
            this.updateFakeGameplay(dt, this.simulations.secondary);
        }

        this.wasPointerDown = pointer.isDown;
    }

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
        const typo = UIConfig.TYPOGRAPHY;

        ctx.fillStyle = config.COLORS.OVERLAY;
        ctx.fillRect(0, 0, width, height);

        if (this.currentScreen === 1) {
            ctx.fillStyle = config.COLORS.TEXT_MAIN;
            ctx.font = `bold ${typo.SIZE_SM}px ${typo.FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.TEXT.TITLE_SCREEN_1, width / 2, height * config.LAYOUT.TITLE_Y_PCT);

            this.drawFakeGameplay(ctx, this.simulations.primary, config.TEXT.PRIMARY_TITLE, config.TEXT.PRIMARY_DESC);
            this.drawFakeGameplay(ctx, this.simulations.secondary, config.TEXT.SECONDARY_TITLE, config.TEXT.SECONDARY_DESC);
        } 
        else if (this.currentScreen === 2) {
            ctx.fillStyle = config.COLORS.TEXT_MAIN;
            ctx.font = `bold ${typo.SIZE_SM}px ${typo.FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.TEXT.TITLE_SCREEN_2, width / 2, height * config.LAYOUT.TITLE_SCREEN_2_Y_PCT);

            this.simulations.gates.primary.draw(ctx);
            this.simulations.gates.secondary.draw(ctx);

            ctx.font = `bold ${typo.SIZE_SM * 0.6}px ${typo.FAMILY}`;
            
            ctx.fillStyle = this.simulations.gates.primary.color;
            ctx.fillText(config.TEXT.GATE_PRIMARY_DESC, this.simulations.gates.primary.x, this.simulations.gates.primary.y + config.LAYOUT.GATE_DESC_OFFSET_Y);

            ctx.fillStyle = this.simulations.gates.secondary.color;
            ctx.fillText(config.TEXT.GATE_SECONDARY_DESC, this.simulations.gates.secondary.x, this.simulations.gates.secondary.y + config.LAYOUT.GATE_DESC_OFFSET_Y);
        }

        this.buttons.forEach(btn => btn.draw(ctx));
    }

    drawFakeGameplay(ctx, simState, title, description) {
        const box = simState.box;
        const config = UIConfig.SCREENS.TUTORIAL;
        const typo = UIConfig.TYPOGRAPHY;

        ctx.strokeStyle = config.COLORS.BOX_BORDER;
        ctx.lineWidth = config.LAYOUT.BOX_BORDER_WIDTH;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = config.COLORS.TEXT_MAIN;
        ctx.font = `bold ${typo.SIZE_SM * 1.1}px ${typo.FAMILY}`;
        ctx.fillText(title, box.x + box.w / 2, box.y + box.h + config.LAYOUT.DESC_OFFSET_Y_1);

        ctx.fillStyle = config.COLORS.TEXT_DESC;
        ctx.font = `${typo.SIZE_SM * 0.8}px ${typo.FAMILY}`;
        ctx.fillText(description, box.x + box.w / 2, box.y + box.h + config.LAYOUT.DESC_OFFSET_Y_2);

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