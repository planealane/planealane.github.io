// js/entities/SuperCollectible.js
import { GameConfig } from '../GameConfig.js';
import { SpriteEntity } from './Entity.js';
import { Player } from './Player.js';

export class SuperCollectible extends SpriteEntity {
    constructor(x, y) {
        // Size is slightly larger than standard drops for visual importance
        const size = GameConfig.SHIP_SIZE * 0.8;
        super(x, y, size, size, null, null, 0, GameConfig.Z_INDEX.COLLECTIBLE + 1);
        
        this.baseSpeed = GameConfig.SCROLL_SPEED;
        this.magnetSpeed = 0.8; 
        this.aliveTime = 0;
        
        // Initial velocity (slight pop outward before falling)
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = -0.2; 

        // [NEW] Array to store the trail particles
        this.particles = [];
        
        // The logical radius used in the pixel-art loop (matches your demo)
        this.logicalRadius = 10;
        // The scale factor to stretch the 10px radius to the actual physical hitbox size
        this.renderScale = (this.width / 2) / this.logicalRadius;
    }

    update(dt, playerX, entityManager) {
        this.aliveTime += dt;

        // 1. Particle Trail Generation
        const trailHue = ((this.y / this.renderScale) * 4 + this.aliveTime * 0.05) % 360;
        
        // Spawn 3 particles per frame (adjusted for dt delta)
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * (this.width * 0.5),
                y: this.y + (Math.random() - 0.5) * (this.height * 0.5),
                hue: trailHue,
                life: 1.0,
                vy: Math.random() * 0.1
            });
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.015 * (dt / 16); // Normalize fading to 60fps equivalent
            p.y += p.vy * dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 2. Find the player to track
        const player = entityManager.entities.find(e => e instanceof Player);

        // 3. Magnetic steering logic (activates after a short delay)
        if (player && !player.markForDeletion && this.aliveTime > 500) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                this.vx += (dirX * this.magnetSpeed - this.vx) * 0.05 * dt;
                this.vy += (dirY * this.magnetSpeed - this.vy) * 0.05 * dt;
            }
        } else {
            // Standard falling behavior
            this.vy += 0.002 * dt; // Gravity
            if (this.vy > this.baseSpeed * 2) this.vy = this.baseSpeed * 2;
        }

        // 4. Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 5. Boundary check
        if (this.y > GameConfig.GAME_HEIGHT + 200 || 
            this.x < -200 || this.x > GameConfig.GAME_WIDTH + 200) {
            this.markForDeletion = true;
        }
    }

    draw(ctx) {
        // ==========================================
        // 1. DRAW PARTICLES (WORLD SPACE)
        // Drawn before translating so they trail behind the entity
        // ==========================================
        const particleSize = 2 * this.renderScale; // Match the chunky pixel scale

        this.particles.forEach((p) => {
            ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life})`;
            ctx.fillRect(
                Math.floor(p.x - particleSize / 2), 
                Math.floor(p.y - particleSize / 2), 
                particleSize, 
                particleSize
            );
        });

        // ==========================================
        // 2. DRAW PIXEL ORB (LOCAL SPACE)
        // ==========================================
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Scale the context to make the 10px logical loop fit the large hitbox
        ctx.scale(this.renderScale, this.renderScale);

        const r = this.logicalRadius;
        const start = -r - 2;
        const end = r + 2;

        for (let y = start; y < end; y += 2) {
            for (let x = start; x < end; x += 2) {
                const dist = Math.hypot(x, y);

                if (dist < r) {
                    // Fluid plasma math
                    const flow = y * 4 + this.aliveTime * 0.05 + Math.sin(x * 0.2 + this.aliveTime * 0.005) * 10;
                    const hue = flow % 360;
                    const brightness = 60 - (dist / r) * 20;
                    
                    ctx.fillStyle = `hsl(${hue}, 100%, ${brightness}%)`;
                    
                    // Reflection
                    if (x < -3 && y < -3 && dist < r - 2) {
                        ctx.fillStyle = `white`;
                    }
                    ctx.fillRect(x, y, 2, 2);
                } 
                else if (dist >= r && dist < r + 1.5) {
                    // Black Outline
                    ctx.fillStyle = 'black';
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }

        ctx.restore();
    }
}