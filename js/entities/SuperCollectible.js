// js/entities/SuperCollectible.js
import { GameConfig } from '../GameConfig.js';
import { Player } from './Player.js';
import { BaseItem } from './BaseItem.js';

export class SuperCollectible extends BaseItem {
    constructor(x, y) {
        const size = GameConfig.SHIP_SIZE * 0.8;
        // image and frame are null because this entity uses procedural rendering
        super(x, y, size, size, null, null, GameConfig.Z_INDEX.COLLECTIBLE + 1);
        
        this.magnetSpeed = 0.8; 
        
        // Initial outward pop velocity
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = -0.2; 

        this.particles = [];
        this.logicalRadius = 10;
        this.renderScale = (this.width / 2) / this.logicalRadius;
    }

    update(dt, playerX, entityManager) {
        super.update(dt); // Handle aliveTime, pickupDelay, boundaries

        // 1. Particle Trail Generation
        const trailHue = ((this.y / this.renderScale) * 4 + this.aliveTime * 0.05) % 360;
        
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
            p.life -= 0.015 * (dt / 16); 
            p.y += p.vy * dt;
            
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 2. Magnetic steering logic
        const player = entityManager.entities.find(e => e instanceof Player);

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
            // Gravity fallback
            this.vy += 0.002 * dt; 
            if (this.vy > this.baseSpeed * 2) this.vy = this.baseSpeed * 2;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
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