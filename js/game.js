// Ultimate 4K iPhone Slot Machine Game
class SlotMachine4K {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.spinButton = document.getElementById('spin-button');
        
        // Initialize systems
        this.display = new Display4K(this.canvas);
        this.ctx = this.display.getContext();
        this.assetManager = new AssetManager();
        this.effects = new EffectsSystem(this.ctx, this.canvas);
        
        // Game state
        this.symbols = ['bell', 'cherry', 'clover', 'diamond', 'jackpot', 'lemon', 'seven', 'star', 'wild'];
        this.reels = [[], [], []];
        this.score = 0;
        this.isSpinning = false;
        this.paylines = 3; // Start with 3 paylines
        this.bet = 10;
        
        // Visual settings
        this.reelWidth = 100;
        this.reelHeight = 100;
        this.reelSpacing = 125;
        this.startX = 50;
        this.startY = 200;
        
        // Animation state
        this.spinOffset = [0, 0, 0];
        this.targetSpinOffset = [0, 0, 0];
        this.spinSpeed = [0, 0, 0];
        
        this.init();
    }
    
    init() {
        console.log('Initializing Ultimate 4K iPhone Slot Machine...');
        
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
        
        // Background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
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
        
        // Loading bar fill
        const fillGradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGradient.addColorStop(0, '#ff6b6b');
        fillGradient.addColorStop(1, '#ee5a24');
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Loading text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Ultimate 4K Slot Machine...', dims.width / 2, barY - 30);
        
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
        this.spinButton.addEventListener('click', () => this.spin());
        
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
                this.spin();
                
                // Haptic feedback (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        });
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.effects.clear();
        
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
                const duration = 1000 + Math.random() * 500; // Random duration for each reel
                const startTime = Date.now();
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function for smooth stop
                    const easedProgress = this.effects.easeInOutQuart(progress);
                    
                    // Spin speed decreases over time
                    this.spinSpeed[reelIndex] = 20 * (1 - easedProgress);
                    this.spinOffset[reelIndex] += this.spinSpeed[reelIndex];
                    
                    if (progress >= 1) {
                        this.spinOffset[reelIndex] = 0;
                        this.spinSpeed[reelIndex] = 0;
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
            }
            
            // Diagonal top-right to bottom-left
            const diag2 = [this.reels[0][2], this.reels[1][1], this.reels[2][0]];
            const diag2Win = this.checkLineWin(diag2);
            if (diag2Win > 0) {
                winnings += diag2Win;
                winningLines.push({ line: 'diag2', symbols: diag2, amount: diag2Win });
            }
        }
        
        if (winnings > 0) {
            this.score += winnings;
            this.celebrateWin(winnings, winningLines);
        }
    }
    
    checkLineWin(symbols) {
        // Handle wild symbols
        const processedSymbols = symbols.map(s => s === 'wild' ? symbols.find(sym => sym !== 'wild') || 'wild' : s);
        
        // Check for three of a kind
        if (processedSymbols[0] === processedSymbols[1] && processedSymbols[1] === processedSymbols[2]) {
            switch (processedSymbols[0]) {
                case 'jackpot': return this.bet * 100;
                case 'seven': return this.bet * 50;
                case 'diamond': return this.bet * 25;
                case 'star': return this.bet * 20;
                case 'wild': return this.bet * 30;
                default: return this.bet * 10;
            }
        }
        
        // Two of a kind with wild
        if (symbols.includes('wild')) {
            const nonWildSymbols = symbols.filter(s => s !== 'wild');
            if (nonWildSymbols.length === 2 && nonWildSymbols[0] === nonWildSymbols[1]) {
                return this.bet * 5;
            }
        }
        
        return 0;
    }
    
    celebrateWin(amount, winningLines) {
        console.log(`Win! Amount: ${amount}`);
        
        // Create particle effects
        winningLines.forEach(line => {
            if (typeof line.line === 'number') {
                for (let reel = 0; reel < 3; reel++) {
                    const x = this.startX + reel * this.reelSpacing + this.reelWidth / 2;
                    const y = this.startY + line.line * this.reelHeight + this.reelHeight / 2;
                    
                    if (line.symbols[0] === 'jackpot') {
                        this.effects.createWinParticles(x, y, 'jackpot');
                    } else {
                        this.effects.createWinParticles(x, y, 'sparkle');
                    }
                }
            }
        });
        
        // Screen shake for big wins
        if (amount >= this.bet * 50) {
            this.effects.createScreenShake(8, 600);
        } else if (amount >= this.bet * 20) {
            this.effects.createScreenShake(4, 400);
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            if (amount >= this.bet * 50) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            } else {
                navigator.vibrate(100);
            }
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
        
        // Background with animated gradient
        const time = Date.now() * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, `hsl(${220 + Math.sin(time) * 10}, 30%, 20%)`);
        gradient.addColorStop(0.5, `hsl(${200 + Math.cos(time * 0.7) * 10}, 35%, 25%)`);
        gradient.addColorStop(1, `hsl(${240 + Math.sin(time * 0.5) * 10}, 25%, 15%)`);
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
        // Reel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(this.startX - 10, this.startY - 10, 3 * this.reelSpacing + 20, 3 * this.reelHeight + 20);
        
        // Render each reel
        for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
            const x = this.startX + reelIndex * this.reelSpacing;
            
            for (let symbolIndex = 0; symbolIndex < 3; symbolIndex++) {
                const y = this.startY + symbolIndex * this.reelHeight + this.spinOffset[reelIndex];
                const symbol = this.reels[reelIndex][symbolIndex];
                
                this.renderSymbol(symbol, x, y);
            }
            
            // Render spinning symbols during animation
            if (this.isSpinning && this.spinSpeed[reelIndex] > 0) {
                for (let i = -2; i < 5; i++) {
                    const extraY = this.startY + i * this.reelHeight + this.spinOffset[reelIndex];
                    const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                    this.renderSymbol(randomSymbol, x, extraY, 0.7); // Slightly transparent
                }
            }
        }
        
        // Payline indicators
        this.renderPaylines();
    }
    
    renderSymbol(symbol, x, y, alpha = 1) {
        const img = this.assetManager.getImage(symbol);
        
        if (img && this.assetManager.isLoaded(symbol)) {
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Add subtle shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.drawImage(img, x, y, this.reelWidth, this.reelHeight);
            this.ctx.restore();
        } else {
            // Fallback placeholder
            this.ctx.fillStyle = `hsl(${this.assetManager.hashCode(symbol) % 360}, 70%, 50%)`;
            this.ctx.fillRect(x, y, this.reelWidth, this.reelHeight);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(symbol.toUpperCase(), x + this.reelWidth / 2, y + this.reelHeight / 2);
        }
    }
    
    renderPaylines() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Horizontal paylines
        for (let i = 0; i < Math.min(this.paylines, 3); i++) {
            const y = this.startY + i * this.reelHeight + this.reelHeight / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, y);
            this.ctx.lineTo(this.startX + 3 * this.reelSpacing, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    renderUI() {
        const dims = this.display.getScaledDimensions();
        
        // Score display
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 50);
        
        // Bet display
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Bet: ${this.bet}`, 20, 80);
        
        // Paylines display
        this.ctx.fillText(`Paylines: ${this.paylines}`, 20, 110);
        
        // Title
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        const titleGradient = this.ctx.createLinearGradient(0, 0, dims.width, 0);
        titleGradient.addColorStop(0, '#ff6b6b');
        titleGradient.addColorStop(0.5, '#ffd700');
        titleGradient.addColorStop(1, '#ff6b6b');
        this.ctx.fillStyle = titleGradient;
        this.ctx.fillText('ULTIMATE 4K SLOT MACHINE', dims.width / 2, 40);
    }
}