// Visual Effects System for Premium Slot Machine
class EffectsSystem {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.particles = [];
        this.animations = [];
        this.glowEffects = [];
    }
    
    // Particle system for win celebrations
    createWinParticles(x, y, type = 'sparkle') {
        const particleCount = type === 'jackpot' ? 50 : 20;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02,
                size: Math.random() * 4 + 2,
                color: type === 'jackpot' ? `hsl(${Math.random() * 60 + 40}, 100%, 60%)` : `hsl(${Math.random() * 360}, 70%, 60%)`,
                type: type
            });
        }
    }
    
    // Screen shake effect for big wins
    createScreenShake(intensity = 5, duration = 500) {
        const startTime = Date.now();
        const originalTransform = this.ctx.getTransform();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.ctx.setTransform(originalTransform);
                return;
            }
            
            const currentIntensity = intensity * (1 - progress);
            const shakeX = (Math.random() - 0.5) * currentIntensity;
            const shakeY = (Math.random() - 0.5) * currentIntensity;
            
            this.ctx.setTransform(
                originalTransform.a,
                originalTransform.b,
                originalTransform.c,
                originalTransform.d,
                originalTransform.e + shakeX,
                originalTransform.f + shakeY
            );
            
            requestAnimationFrame(shake);
        };
        
        shake();
    }
    
    // Glow effect for winning symbols
    addGlowEffect(x, y, width, height, color = '#ffd700', intensity = 1) {
        this.glowEffects.push({
            x: x,
            y: y,
            width: width,
            height: height,
            color: color,
            intensity: intensity,
            pulsePhase: 0,
            life: 1.0
        });
    }
    
    // Smooth easing functions for reel animation
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
    
    // Animated reel spinning with easing
    animateReelSpin(reelIndex, startY, endY, duration, callback) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeInOutQuart(progress);
            
            const currentY = startY + (endY - startY) * easedProgress;
            
            if (progress >= 1) {
                callback && callback();
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Update and render all effects
    update() {
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98; // Air resistance
            particle.vy += 0.1; // Gravity
            particle.life -= particle.decay;
            
            return particle.life > 0;
        });
        
        // Update glow effects
        this.glowEffects = this.glowEffects.filter(glow => {
            glow.pulsePhase += 0.1;
            glow.life -= 0.01;
            return glow.life > 0;
        });
    }
    
    render() {
        // Render glow effects
        this.glowEffects.forEach(glow => {
            const pulse = 0.5 + 0.5 * Math.sin(glow.pulsePhase);
            const alpha = glow.life * glow.intensity * pulse;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.shadowColor = glow.color;
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = glow.color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(glow.x - 5, glow.y - 5, glow.width + 10, glow.height + 10);
            this.ctx.restore();
        });
        
        // Render particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'sparkle') {
                // Draw sparkle shape
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.life * Math.PI * 4);
                this.ctx.fillRect(-particle.size/2, -1, particle.size, 2);
                this.ctx.fillRect(-1, -particle.size/2, 2, particle.size);
                this.ctx.restore();
            } else {
                // Draw circle
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    // Clear all effects
    clear() {
        this.particles = [];
        this.animations = [];
        this.glowEffects = [];
    }
}