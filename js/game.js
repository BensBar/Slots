class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.spinButton = document.getElementById('spin-button');
        
        // Initialize systems
        this.display = new Display4K(this.canvas);
        this.ctx = this.display.getContext();
        this.assetManager = new AssetManager();
        this.effects = new EffectsSystem(this.ctx, this.canvas);
        this.audio = new AudioSystem();
        
        // Game state - NFL themed symbols
        this.symbols = ['football', 'helmet', 'trophy', 'goalpost', 'jersey', 'whistle', 'touchdown', 'fieldgoal', 'mvp'];
        this.reels = [[], [], []];
        this.score = 1000; // Start with some credits
        this.isSpinning = false;
        this.paylines = 5; // Start with 5 paylines
        this.bet = 10;
        this.maxPaylines = 25;
        this.bonusRounds = 0;
        this.multiplier = 1;
        
        // Visual settings - iPhone-optimized
        this.reelWidth = 90;  // Slightly smaller for better fit
        this.reelHeight = 90; // Smaller height for better proportions
        
        // Detect iPhone for positioning adjustments
        const isIPhone = /iPhone/i.test(navigator.userAgent);
        if (isIPhone) {
            // Optimized spacing and positioning for iPhone
            this.reelSpacing = 110;
            this.startX = 40;  // Further left positioning
            this.startY = 180; // Slightly higher
        } else {
            this.reelSpacing = 130;
            this.startX = 75;
            this.startY = 200;
        }
        
        // Animation state
        this.spinOffset = [0, 0, 0];
        this.targetSpinOffset = [0, 0, 0];
        this.spinSpeed = [0, 0, 0];
        
        this.init();
    }
    
    init() {
        console.log('Initializing NFL Touchdown Slots...');
        
        // Setup asset loading
        this.assetManager.onProgress((progress, symbol) => {
            this.renderLoadingScreen(progress);
        });
        
        this.assetManager.onComplete(() => {
            console.log('Assets loaded, starting game...');
            this.startGame();
        });
        
        // Load assets
        this.assetManager.loadAssets(this.symbols);
        
        // Setup controls
        this.setupControls();
        
        // Store reference for resize handling
        window.gameInstance = this;
    }
    
    renderLoadingScreen(progress) {
        const dims = this.display.getScaledDimensions();
        this.display.clear();
        
        // Background gradient - NFL colors
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, '#013369');
        gradient.addColorStop(0.5, '#002244');
        gradient.addColorStop(1, '#0B162A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Loading bar
        const barWidth = 300;
        const barHeight = 20;
        const barX = (dims.width - barWidth) / 2;
        const barY = dims.height / 2;
        
        // Loading bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Loading bar fill - NFL red
        const fillGradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGradient.addColorStop(0, '#D50A0A');
        fillGradient.addColorStop(1, '#B30000');
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Loading text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏈 Loading NFL Touchdown Slots... 🏈', dims.width / 2, barY - 30);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`${Math.round(progress * 100)}%`, dims.width / 2, barY + 50);
    }
    
    startGame() {
        this.generateInitialReels();
        this.render();
        this.spinButton.disabled = false;
        
        // Start animation loop
        this.animationLoop();
    }
    
    generateInitialReels() {
        for (let i = 0; i < 3; i++) {
            this.reels[i] = [];
            for (let j = 0; j < 3; j++) {
                this.reels[i].push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
        }
    }
    
    setupControls() {
        this.spinButton.addEventListener('click', () => {
            this.audio.play('button_click');
            this.spin();
        });
        
        // Touch controls for mobile
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndY = e.changedTouches[0].clientY;
            const swipeDistance = touchStartY - touchEndY;
            
            // Swipe up to spin
            if (swipeDistance > 50 && !this.isSpinning) {
                this.audio.play('button_click');
                this.spin();
                
                // Haptic feedback (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (!this.isSpinning) {
                        this.audio.play('button_click');
                        this.spin();
                    }
                    break;
                case 'KeyM':
                    // Toggle mute
                    this.audio.toggle();
                    break;
                case 'ArrowUp':
                    // Increase paylines
                    if (this.paylines < this.maxPaylines) {
                        this.paylines = Math.min(this.paylines + 2, this.maxPaylines);
                    }
                    break;
                case 'ArrowDown':
                    // Decrease paylines
                    if (this.paylines > 1) {
                        this.paylines = Math.max(this.paylines - 2, 1);
                    }
                    break;
            }
        });
    }
    
    spin() {
        if (this.isSpinning) return;
        
        // Check if it's a bonus round or regular spin
        if (this.bonusRounds > 0) {
            this.bonusRounds--;
            if (this.bonusRounds === 0) {
                this.multiplier = 1; // Reset multiplier when bonus ends
            }
        } else if (this.score < this.bet) {
            return; // Not enough credits
        } else {
            this.score -= this.bet; // Deduct bet for regular spins
        }
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.effects.clear();
        
        // Play spin sound
        this.audio.play('spin');
        
        // Generate new reel results
        const newReels = [];
        for (let i = 0; i < 3; i++) {
            newReels[i] = [];
            for (let j = 0; j < 3; j++) {
                newReels[i].push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
        }
        
        // Animate each reel with different delays
        const animationPromises = [];
        for (let i = 0; i < 3; i++) {
            const delay = i * 300; // Stagger reel stops
            const promise = this.animateReel(i, newReels[i], delay);
            animationPromises.push(promise);
        }
        
        // When all animations complete
        Promise.all(animationPromises).then(() => {
            this.reels = newReels;
            this.checkWin();
            this.isSpinning = false;
            this.spinButton.disabled = false;
        });
    }
    
    animateReel(reelIndex, newSymbols, delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const duration = 1000 + Math.random() * 500;
                const startTime = Date.now();
                
                // Reset offset at start to ensure clean animation
                this.spinOffset[reelIndex] = 0;
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function for smooth stop
                    const easedProgress = this.effects.easeInOutQuart(progress);
                    
                    // Calculate spin speed with better control for iPhone
                    const baseSpeed = 8; // Reduced from 15 for more control
                    this.spinSpeed[reelIndex] = baseSpeed * (1 - easedProgress);
                    
                    // Only update offset during spinning phase
                    if (progress < 0.95) {
                        this.spinOffset[reelIndex] += this.spinSpeed[reelIndex];
                        
                        // STRICT bounds management - wrap around properly
                        while (this.spinOffset[reelIndex] >= this.reelHeight) {
                            this.spinOffset[reelIndex] -= this.reelHeight;
                        }
                        while (this.spinOffset[reelIndex] < 0) {
                            this.spinOffset[reelIndex] += this.reelHeight;
                        }
                    } else {
                        // Final phase - ease to exact stop position
                        this.spinOffset[reelIndex] *= (1 - (progress - 0.95) * 20);
                    }
                    
                    if (progress >= 1) {
                        // Force exact stop position
                        this.spinOffset[reelIndex] = 0;
                        this.spinSpeed[reelIndex] = 0;
                        this.audio.play('reel_stop');
                        resolve();
                        return;
                    }
                    
                    requestAnimationFrame(animate);
                };
                
                animate();
            }, delay);
        });
    }
    
    checkWin() {
        let winnings = 0;
        const winningLines = [];
        
        // Check horizontal lines (paylines)
        for (let line = 0; line < Math.min(this.paylines, 3); line++) {
            const symbols = [this.reels[0][line], this.reels[1][line], this.reels[2][line]];
            const winAmount = this.checkLineWin(symbols);
            
            if (winAmount > 0) {
                winnings += winAmount;
                winningLines.push({ line, symbols, amount: winAmount });
                
                // Add glow effects to winning symbols
                for (let reel = 0; reel < 3; reel++) {
                    const x = this.startX + reel * this.reelSpacing;
                    const y = this.startY + line * this.reelHeight;
                    this.effects.addGlowEffect(x, y, this.reelWidth, this.reelHeight, '#ffd700', 1);
                }
            }
        }
        
        // Check diagonal lines (if more paylines)
        if (this.paylines >= 5) {
            // Diagonal top-left to bottom-right
            const diag1 = [this.reels[0][0], this.reels[1][1], this.reels[2][2]];
            const diag1Win = this.checkLineWin(diag1);
            if (diag1Win > 0) {
                winnings += diag1Win;
                winningLines.push({ line: 'diag1', symbols: diag1, amount: diag1Win });
                // Add diagonal glow effects
                this.effects.addGlowEffect(this.startX, this.startY, this.reelWidth, this.reelHeight, '#ffd700', 1);
                this.effects.addGlowEffect(this.startX + this.reelSpacing, this.startY + this.reelHeight, this.reelWidth, this.reelHeight, '#ffd700', 1);
                this.effects.addGlowEffect(this.startX + 2 * this.reelSpacing, this.startY + 2 * this.reelHeight, this.reelWidth, this.reelHeight, '#ffd700', 1);
            }
            
            // Diagonal top-right to bottom-left
            const diag2 = [this.reels[0][2], this.reels[1][1], this.reels[2][0]];
            const diag2Win = this.checkLineWin(diag2);
            if (diag2Win > 0) {
                winnings += diag2Win;
                winningLines.push({ line: 'diag2', symbols: diag2, amount: diag2Win });
                // Add diagonal glow effects
                this.effects.addGlowEffect(this.startX, this.startY + 2 * this.reelHeight, this.reelWidth, this.reelHeight, '#ffd700', 1);
                this.effects.addGlowEffect(this.startX + this.reelSpacing, this.startY + this.reelHeight, this.reelWidth, this.reelHeight, '#ffd700', 1);
                this.effects.addGlowEffect(this.startX + 2 * this.reelSpacing, this.startY, this.reelWidth, this.reelHeight, '#ffd700', 1);
            }
        }
        
        // Check V-shape and inverted V-shape (if 9+ paylines)
        if (this.paylines >= 9) {
            // V-shape (top corners to middle bottom)
            const vShape = [this.reels[0][0], this.reels[1][2], this.reels[2][0]];
            const vWin = this.checkLineWin(vShape);
            if (vWin > 0) {
                winnings += vWin;
                winningLines.push({ line: 'v', symbols: vShape, amount: vWin });
            }
            
            // Inverted V-shape (bottom corners to middle top)
            const invV = [this.reels[0][2], this.reels[1][0], this.reels[2][2]];
            const invVWin = this.checkLineWin(invV);
            if (invVWin > 0) {
                winnings += invVWin;
                winningLines.push({ line: 'invV', symbols: invV, amount: invVWin });
            }
        }
        
        // Apply multiplier
        winnings *= this.multiplier;
        
        if (winnings > 0) {
            this.score += winnings;
            this.celebrateWin(winnings, winningLines);
            
            // Check for bonus round triggers
            this.checkBonusRound(winningLines);
        }
    }
    
    checkLineWin(symbols) {
        // Handle mvp (wild) symbols
        const processedSymbols = symbols.map(s => s === 'mvp' ? symbols.find(sym => sym !== 'mvp') || 'mvp' : s);
        
        // Check for three of a kind
        if (processedSymbols[0] === processedSymbols[1] && processedSymbols[1] === processedSymbols[2]) {
            switch (processedSymbols[0]) {
                case 'trophy': return this.bet * 100;      // Trophy = Jackpot
                case 'touchdown': return this.bet * 50;   // Touchdown = Big win
                case 'helmet': return this.bet * 25;      // Helmet
                case 'football': return this.bet * 20;    // Football
                case 'mvp': return this.bet * 30;         // MVP = Wild
                case 'goalpost': return this.bet * 15;    // Goal post
                case 'jersey': return this.bet * 12;      // Jersey
                case 'whistle': return this.bet * 10;     // Whistle
                case 'fieldgoal': return this.bet * 10;   // Field goal
                default: return this.bet * 10;
            }
        }
        
        // Two of a kind with MVP (wild)
        if (symbols.includes('mvp')) {
            const nonWildSymbols = symbols.filter(s => s !== 'mvp');
            if (nonWildSymbols.length === 2 && nonWildSymbols[0] === nonWildSymbols[1]) {
                return this.bet * 5;
            }
        }
        
        return 0;
    }
    
    celebrateWin(amount, winningLines) {
        console.log(`Touchdown! Win Amount: ${amount}`);
        
        // Play appropriate sound
        const isTrophy = winningLines.some(line => 
            line.symbols.every(symbol => symbol === 'trophy')
        );
        
        if (isTrophy) {
            this.audio.play('jackpot');
        } else {
            this.audio.play('win');
        }
        
        // Enhanced particle effects based on win size
        winningLines.forEach(line => {
            if (typeof line.line === 'number') {
                const positions = [];
                for (let reel = 0; reel < 3; reel++) {
                    const x = this.startX + reel * this.reelSpacing + this.reelWidth / 2;
                    const y = this.startY + line.line * this.reelHeight + this.reelHeight / 2;
                    positions.push({ x, y, width: this.reelWidth, height: this.reelHeight });
                    
                    if (line.symbols[0] === 'trophy') {
                        this.effects.createWinParticles(x, y, 'jackpot');
                    } else {
                        this.effects.createWinParticles(x, y, 'sparkle');
                    }
                }
                
                // Add cascading glow effect for winning lines
                this.effects.addCascadingGlow(positions, line.symbols[0] === 'trophy' ? '#ffd700' : '#00ff00');
            }
        });
        
        // Special effects for big wins
        if (amount >= this.bet * 100) {
            // Massive jackpot - fireworks effect
            const centerX = this.startX + this.reelSpacing + this.reelWidth / 2;
            const centerY = this.startY + this.reelHeight * 1.5;
            this.effects.createFireworksEffect(centerX, centerY);
            this.effects.createScreenShake(12, 800);
        } else if (amount >= this.bet * 50) {
            // Big win - enhanced screen shake
            this.effects.createScreenShake(8, 600);
        } else if (amount >= this.bet * 20) {
            // Medium win - moderate screen shake
            this.effects.createScreenShake(4, 400);
        }
        
        // Enhanced haptic feedback
        if (navigator.vibrate) {
            if (amount >= this.bet * 100) {
                navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
            } else if (amount >= this.bet * 50) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            } else {
                navigator.vibrate(100);
            }
        }
    }
    
    checkBonusRound(winningLines) {
        // Trigger bonus round if three or more football symbols (scatter)
        const scatterCount = this.reels.flat().filter(symbol => symbol === 'football').length;
        
        if (scatterCount >= 3) {
            this.bonusRounds += 10; // Add 10 free spins
            this.multiplier = 2; // Double multiplier during bonus
            
            // Create special celebration
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    this.effects.createWinParticles(x, y, 'jackpot');
                }, i * 100);
            }
            
            console.log('🏈 BONUS ROUND! 10 Free Spins with 2x Multiplier! 🏈');
        }
    }
    
    animationLoop() {
        this.effects.update();
        this.render();
        requestAnimationFrame(() => this.animationLoop());
    }
    
    render() {
        const dims = this.display.getScaledDimensions();
        this.display.clear();
        
        // Background with animated gradient - NFL colors
        const time = Date.now() * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, `hsl(${215 + Math.sin(time) * 5}, 70%, 15%)`);
        gradient.addColorStop(0.5, `hsl(${215 + Math.cos(time * 0.7) * 5}, 60%, 12%)`);
        gradient.addColorStop(1, `hsl(${215 + Math.sin(time * 0.5) * 5}, 50%, 8%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Render reels
        this.renderReels();
        
        // Render UI
        this.renderUI();
        
        // Render effects
        this.effects.render();
    }
    
    renderReels() {
        // Enhanced slot machine frame - mobile-responsive
        const frameMargin = 15; // Reduced margin for more space
        const frameX = this.startX - frameMargin;
        const frameY = this.startY - frameMargin;
        
        // Calculate frame width dynamically based on actual reel layout
        const totalReelWidth = (2 * this.reelSpacing) + this.reelWidth;
        const frameWidth = totalReelWidth + 2 * frameMargin;
        const frameHeight = 3 * this.reelHeight + 2 * frameMargin;
        
        // Ensure frame fits within canvas bounds
        const dims = this.display.getScaledDimensions();
        const maxFrameWidth = dims.width - 10; // Leave minimal margin
        const actualFrameWidth = Math.min(frameWidth, maxFrameWidth);
        
        // Outer frame with gradient
        const frameGradient = this.ctx.createLinearGradient(frameX, frameY, frameX + actualFrameWidth, frameY + frameHeight);
        frameGradient.addColorStop(0, '#4a4a4a');
        frameGradient.addColorStop(0.5, '#2a2a2a');
        frameGradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = frameGradient;
        this.ctx.fillRect(frameX, frameY, actualFrameWidth, frameHeight);
        
        // Inner frame
        const innerFrameMargin = 5;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
            frameX + innerFrameMargin, 
            frameY + innerFrameMargin, 
            actualFrameWidth - 2 * innerFrameMargin, 
            frameHeight - 2 * innerFrameMargin
        );
        
        // Reel background with subtle gradient - responsive width
        const reelBgGradient = this.ctx.createLinearGradient(this.startX, this.startY, this.startX, this.startY + 3 * this.reelHeight);
        reelBgGradient.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
        reelBgGradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.95)');
        reelBgGradient.addColorStop(1, 'rgba(10, 10, 10, 0.9)');
        this.ctx.fillStyle = reelBgGradient;
        const bgWidth = Math.min(totalReelWidth + 20, maxFrameWidth - 20); // Responsive background width
        this.ctx.fillRect(this.startX - 10, this.startY - 10, bgWidth, 3 * this.reelHeight + 20);
        
        // Render each reel with STRICT clipping bounds
        for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
            const x = this.startX + reelIndex * this.reelSpacing;
            
            // Create VERY STRICT clipping region for this reel
            this.ctx.save();
            this.ctx.beginPath();
            // Clip with extra margin to ensure no overflow
            this.ctx.rect(x - 2, this.startY - 2, this.reelWidth + 4, 3 * this.reelHeight + 4);
            this.ctx.clip();
            
            // Individual reel border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x - 3, this.startY - 3, this.reelWidth + 6, 3 * this.reelHeight + 6);
            
            // Render static symbols with strict bounds checking
            for (let symbolIndex = 0; symbolIndex < 3; symbolIndex++) {
                let y = this.startY + symbolIndex * this.reelHeight;
                
                // Apply spin offset only during spinning, with VERY strict bounds
                if (this.isSpinning) {
                    y += this.spinOffset[reelIndex];
                }
                
                const symbol = this.reels[reelIndex][symbolIndex];
                // STRICT visibility check - only render if completely within bounds
                if (y >= this.startY - 5 && y <= this.startY + 3 * this.reelHeight - this.reelHeight + 5) {
                    this.renderSymbol(symbol, x, y);
                }
            }
            
            // Render additional spinning symbols during animation with strict bounds
            if (this.isSpinning && this.spinSpeed[reelIndex] > 0) {
                // Only add symbols that will be visible within the strict clipping area
                for (let i = -1; i <= 4; i++) {
                    let extraY = this.startY + i * this.reelHeight + this.spinOffset[reelIndex];
                    
                    // Ultra-strict visibility check for iPhone
                    const topBound = this.startY - 10;
                    const bottomBound = this.startY + 3 * this.reelHeight + 10;
                    
                    if (extraY >= topBound && extraY + this.reelHeight <= bottomBound) {
                        const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                        this.renderSymbol(randomSymbol, x, extraY, 0.8);
                    }
                }
            }
            
            // Restore clipping region
            this.ctx.restore();
            
            // Add subtle reel separator
            if (reelIndex < 2) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                const separatorX = x + this.reelWidth + (this.reelSpacing - this.reelWidth) / 2;
                this.ctx.moveTo(separatorX, this.startY);
                this.ctx.lineTo(separatorX, this.startY + 3 * this.reelHeight);
                this.ctx.stroke();
            }
        }
        
        // Add slot machine glass effect - responsive width
        const glassGradient = this.ctx.createLinearGradient(this.startX, this.startY, this.startX + totalReelWidth, this.startY + 3 * this.reelHeight);
        glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        glassGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        glassGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
        glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        this.ctx.fillStyle = glassGradient;
        const glassWidth = Math.min(totalReelWidth + 20, maxFrameWidth - 20); // Responsive glass width
        this.ctx.fillRect(this.startX - 10, this.startY - 10, glassWidth, 3 * this.reelHeight + 20);
        
        // Payline indicators
        this.renderPaylines();
    }
    
    renderSymbol(symbol, x, y, alpha = 1) {
    const img = this.assetManager.getImage(symbol);
    
    if (img && this.assetManager.isLoaded(symbol)) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Add subtle shadow behind symbols
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 6; // Reduced blur for iPhone
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Add symbol border for better definition
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.reelWidth, this.reelHeight);
        
        this.ctx.drawImage(img, x, y, this.reelWidth, this.reelHeight);
        this.ctx.restore();
    } else {
        // Enhanced fallback placeholder with smaller text for iPhone
        const hash = this.assetManager.hashCode(symbol);
        const hue = Math.abs(hash) % 360;
        
        // Gradient background for placeholder
        const gradient = this.ctx.createLinearGradient(x, y, x + this.reelWidth, y + this.reelHeight);
        gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, this.reelWidth, this.reelHeight);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.reelWidth, this.reelHeight);
        
        // Text - smaller for iPhone
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial'; // Smaller font
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(symbol.toUpperCase(), x + this.reelWidth / 2, y + this.reelHeight / 2 + 3);
        this.ctx.shadowBlur = 0;
    }
}

    renderUI() {
    const dims = this.display.getScaledDimensions();
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    
    // UI positioning - adjust for iPhone
    const uiY = isIPhone ? dims.height - 150 : dims.height - 120;
    const fontSize = isIPhone ? 16 : 20;
    
    // Background for UI
    const uiGradient = this.ctx.createLinearGradient(0, uiY - 20, 0, dims.height);
    uiGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    uiGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    this.ctx.fillStyle = uiGradient;
    this.ctx.fillRect(0, uiY - 20, dims.width, dims.height - uiY + 20);
    
    // Game stats with responsive positioning
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'left';
    
    const leftMargin = isIPhone ? 20 : 30;
    const statSpacing = isIPhone ? 25 : 30;
    
    // Score
    this.ctx.fillText(`Credits: ${this.score}`, leftMargin, uiY);
    
    // Bet
    this.ctx.fillText(`Bet: ${this.bet}`, leftMargin, uiY + statSpacing);
    
    // Paylines
    this.ctx.fillText(`Lines: ${this.paylines}`, leftMargin, uiY + statSpacing * 2);
    
    // Bonus info (if active)
    if (this.bonusRounds > 0) {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = `bold ${fontSize + 2}px Arial`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`FREE SPINS: ${this.bonusRounds}`, dims.width - leftMargin, uiY);
        this.ctx.fillText(`MULTIPLIER: ${this.multiplier}x`, dims.width - leftMargin, uiY + statSpacing);
    }
}

    renderPaylines() {
    if (this.paylines <= 0) return;
    
    const dims = this.display.getScaledDimensions();
    
    // Payline colors
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.lineWidth = 2;
    
    // Draw horizontal paylines
    for (let line = 0; line < Math.min(this.paylines, 3); line++) {
        this.ctx.strokeStyle = colors[line % colors.length];
        const y = this.startY + line * this.reelHeight + this.reelHeight / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, y);
        this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth, y);
        this.ctx.stroke();
    }
    
    // Draw diagonal paylines if applicable
    if (this.paylines >= 5) {
        // Diagonal 1 (top-left to bottom-right)
        this.ctx.strokeStyle = colors[3 % colors.length];
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX + this.reelWidth / 2, this.startY + this.reelHeight / 2);
        this.ctx.lineTo(this.startX + this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight + this.reelHeight / 2);
        this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth / 2, this.startY + 2 * this.reelHeight + this.reelHeight / 2);
        this.ctx.stroke();
        
        // Diagonal 2 (top-right to bottom-left)
        this.ctx.strokeStyle = colors[4 % colors.length];
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX + this.reelWidth / 2, this.startY + 2 * this.reelHeight + this.reelHeight / 2);
        this.ctx.lineTo(this.startX + this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight + this.reelHeight / 2);
        this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight / 2);
        this.ctx.stroke();
    }
    
    this.ctx.restore();
}
}

// Ensure the Game class is properly exposed globally
window.Game = Game;
console.log('Game class defined:', typeof Game);
