// Visual Effects System for Premium Slot Machine
class EffectsSystem {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.particles = [];
        this.animations = [];
        this.glowEffects = [];
    }
    
    // Enhanced particle system for win celebrations
    createWinParticles(x, y, type = 'sparkle') {
        const particleCount = type === 'jackpot' ? 100 : 50; // More particles for better effect
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12, // Increased velocity range
                vy: (Math.random() - 0.5) * 12,
                life: 1.0,
                decay: 0.015, // Slower decay for longer-lasting effect
                size: Math.random() * 6 + 3, // Larger particles
                color: type === 'jackpot' ? 
                    `hsl(${Math.random() * 60 + 40}, 100%, ${60 + Math.random() * 40}%)` : 
                    `hsl(${Math.random() * 360}, 80%, ${50 + Math.random() * 40}%)`,
                type: type,
                rotation: Math.random() * Math.PI * 2, // Add rotation
                rotationSpeed: (Math.random() - 0.5) * 0.3 // Rotation speed
            });
        }
    }
    
    // Create fireworks effect for big wins
    createFireworksEffect(x, y) {
        const burstCount = 5;
        for (let burst = 0; burst < burstCount; burst++) {
            setTimeout(() => {
                this.createWinParticles(
                    x + (Math.random() - 0.5) * 200,
                    y + (Math.random() - 0.5) * 200,
                    'jackpot'
                );
            }, burst * 200);
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
    
    // Enhanced glow effect for winning symbols
    addGlowEffect(x, y, width, height, color = '#ffd700', intensity = 1) {
        this.glowEffects.push({
            x: x,
            y: y,
            width: width,
            height: height,
            color: color,
            intensity: intensity,
            pulsePhase: 0,
            life: 2.0, // Longer lasting glow
            glowRadius: 0,
            maxGlowRadius: 30
        });
    }
    
    // Add cascading glow effect for multiple wins
    addCascadingGlow(positions, color = '#ffd700') {
        positions.forEach((pos, index) => {
            setTimeout(() => {
                this.addGlowEffect(pos.x, pos.y, pos.width, pos.height, color, 1.5);
            }, index * 100);
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
        // Update particles with enhanced physics
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98; // Air resistance
            particle.vy += 0.1; // Gravity
            particle.life -= particle.decay;
            
            // Update rotation
            if (particle.rotation !== undefined) {
                particle.rotation += particle.rotationSpeed;
            }
            
            return particle.life > 0;
        });
        
        // Update glow effects with enhanced animation
        this.glowEffects = this.glowEffects.filter(glow => {
            glow.pulsePhase += 0.15; // Faster pulse
            glow.life -= 0.005; // Slower fade
            
            // Animate glow radius
            if (glow.glowRadius < glow.maxGlowRadius) {
                glow.glowRadius += 1;
            }
            
            return glow.life > 0;
        });
    }
    
    render() {
        // Render enhanced glow effects
        this.glowEffects.forEach(glow => {
            const pulse = 0.6 + 0.4 * Math.sin(glow.pulsePhase);
            const alpha = glow.life * glow.intensity * pulse;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Multiple glow layers for better effect
            for (let i = 0; i < 3; i++) {
                this.ctx.shadowColor = glow.color;
                this.ctx.shadowBlur = 15 + i * 10;
                this.ctx.strokeStyle = glow.color;
                this.ctx.lineWidth = 3 - i;
                this.ctx.strokeRect(
                    glow.x - 5 - i * 2, 
                    glow.y - 5 - i * 2, 
                    glow.width + 10 + i * 4, 
                    glow.height + 10 + i * 4
                );
            }
            
            this.ctx.restore();
        });
        
        // Render enhanced particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'sparkle') {
                // Enhanced sparkle with rotation
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation || 0);
                
                // Draw multiple sparkle rays
                for (let i = 0; i < 4; i++) {
                    this.ctx.rotate(Math.PI / 2);
                    this.ctx.fillRect(-particle.size/2, -1, particle.size, 2);
                }
                
                this.ctx.restore();
            } else {
                // Enhanced circle with glow
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = particle.size;
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