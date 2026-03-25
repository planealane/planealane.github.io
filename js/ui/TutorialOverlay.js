// js/ui/TutorialOverlay.js
import { Button } from './Button.js';
import { UIConfig } from '../UIConfig.js';
import { GameConfig } from '../GameConfig.js';
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
                player: null,
                enemies: [],
                projectiles: [],
                box: { x: 0, y: 0, w: 0, h: 0 } 
            },
            secondary: {
                player: null,
                enemies: [],
                projectiles: [],
                box: { x: 0, y: 0, w: 0, h: 0 }
            },
            gates: {
                primary: null,
                secondary: null
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

        const btnWidth = Math.min(UIConfig.BUTTON_DEFAULTS.width * 1.4, width * 0.8);
        const btnHeight = UIConfig.BUTTON_DEFAULTS.height * 1.5;
        const btnFontSize = GameConfig.FONT_SIZE_MD * 1.2;
        const btnY = height * 0.85;

        this.buttons = []; 

        if (this.currentScreen === 1) {
            this.buttons.push(new Button(
                'NEXT',
                centerX - btnWidth / 2,
                btnY,
                'menu',
                () => {
                    this.currentScreen = 2;
                    this.initUI(); 
                },
                { width: btnWidth, height: btnHeight, fontSize: btnFontSize }
            ));
        } else if (this.currentScreen === 2) {
            this.buttons.push(new Button(
                'PLAY NOW',
                centerX - btnWidth / 2,
                btnY,
                'start',
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

        const boxW = 300;
        const boxH = 800; 
        
        this.simulations.primary.box = { x: centerX - boxW - 20, y: centerY - boxH / 2, w: boxW, h: boxH };
        this.simulations.secondary.box = { x: centerX + 20, y: centerY - boxH / 2, w: boxW, h: boxH };

        const shipImage = this.gameManager.assets.getImage('ships');

        // Utility to temporarily strip text rendering from the canvas 
        // specifically to hide the floating HP numbers for tutorial enemies.
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

        // Primary Weapon Setup
        const pBox = this.simulations.primary.box;
        const pPlayer = new Player(shipImage);
        pPlayer.x = pBox.x + pBox.w / 2;
        pPlayer.y = pBox.y + pBox.h - 80; 
        pPlayer.weapons = [pPlayer.primaryWeapon]; 
        this.simulations.primary.player = pPlayer;

        // Enemy dies in 1 hit
        const pEnemy = new Enemy(pBox.x + pBox.w / 2, pBox.y - 50, shipImage, 1, 0);
        hideEnemyHP(pEnemy); 
        this.simulations.primary.enemies.push(pEnemy);

        // Secondary Weapon Setup
        const sBox = this.simulations.secondary.box;
        const sPlayer = new Player(shipImage);
        sPlayer.x = sBox.x + sBox.w / 2;
        sPlayer.y = sBox.y + sBox.h - 80;
        sPlayer.weapons = [sPlayer.secondaryWeapon]; 
        this.simulations.secondary.player = sPlayer;

        // Enemy dies in 3 hits
        const sEnemy1 = new Enemy(sBox.x + sBox.w * 0.5, sBox.y - 50, shipImage, 3, 1);
        hideEnemyHP(sEnemy1); 
        this.simulations.secondary.enemies.push(sEnemy1);

        // ==========================================
        // SCREEN 2: GATES SETUP
        // ==========================================
        
        // Make sure 'gate' matches the exact key used in your AssetManager
        const gateImage = this.gameManager.assets.getImage('props'); 

        const primaryGate = new Gate(centerX - 200, centerY - 50, gateImage, 1);
        primaryGate.text = '+ PRIMARY DMG'; 
        primaryGate.color = '#ff9900';     
        this.simulations.gates.primary = primaryGate;

        const secondaryGate = new Gate(centerX + 200, centerY - 50, gateImage, 1);
        secondaryGate.text = '+ SECONDARY HASTE'; 
        secondaryGate.color = '#00ccff';          
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
                // Intercept HomingProjectile to force it to fly straight for visual clarity
                if (entity.constructor.name === 'HomingProjectile') {
                    entity.getNearestTarget = () => null;
                }
                simState.projectiles.push(entity);
            }
        };

        if (simState.player) {
            simState.player.update(dt, simState.player.x, mockEntityManager);
        }

        simState.enemies.forEach(enemy => {
            enemy.update(dt);
            
            // Loop enemy back to the top to keep the video running
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
                        
                        // Enforce exactly 1 damage per hit for tutorial pacing
                        enemy.hp -= 1; 
                        
                        enemy.onHit(); 
                        proj.markForDeletion = true;

                        // Fake death: respawn immediately at the top
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

        ctx.fillStyle = `rgba(0, 0, 0, 0.9)`;
        ctx.fillRect(0, 0, width, height);

        if (this.currentScreen === 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 40px ${GameConfig.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('WEAPON SYSTEMS', width / 2, height * 0.10);

            this.drawFakeGameplay(ctx, this.simulations.primary, "PRIMARY WEAPON", "Direct physical damage.");
            this.drawFakeGameplay(ctx, this.simulations.secondary, "SECONDARY WEAPON", "Homing explosive ordinance.");
        } 
        else if (this.currentScreen === 2) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 40px ${GameConfig.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('UPGRADE PORTALS', width / 2, height * 0.15);

            this.simulations.gates.primary.draw(ctx);
            this.simulations.gates.secondary.draw(ctx);

            ctx.font = `bold 24px ${GameConfig.FONT_FAMILY}`;
            
            ctx.fillStyle = this.simulations.gates.primary.color;
            ctx.fillText("Orange upgrades the primary weapon...", this.simulations.gates.primary.x, this.simulations.gates.primary.y + 120);

            ctx.fillStyle = this.simulations.gates.secondary.color;
            ctx.fillText("...and Blue upgrades the secondary !", this.simulations.gates.secondary.x, this.simulations.gates.secondary.y + 120);
        }

        this.buttons.forEach(btn => btn.draw(ctx));
    }

    drawFakeGameplay(ctx, simState, title, description) {
        const box = simState.box;

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 44px ${GameConfig.FONT_FAMILY}`;
        ctx.fillText(title, box.x + box.w / 2, box.y + box.h + 60);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = `32px ${GameConfig.FONT_FAMILY}`;
        ctx.fillText(description, box.x + box.w / 2, box.y + box.h + 110);

        ctx.save(); 
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h); 
        ctx.clip(); 

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(box.x, box.y, box.w, box.h);

        if (simState.player) simState.player.draw(ctx);
        simState.enemies.forEach(e => e.draw(ctx));
        simState.projectiles.forEach(p => p.draw(ctx));

        ctx.restore(); 
    }
}