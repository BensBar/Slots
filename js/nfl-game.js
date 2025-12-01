// NFL Touchdown Slots - Game Engine
// Uses real NFL team logos from images/nfl-logos/

class NFLGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.spinButton = document.getElementById('spin-button');
        this.creditsDisplay = document.getElementById('credits');
        this.betDisplay = document.getElementById('bet-display');
        this.scoreDisplay = document.getElementById('score-display');
        
        // Initialize systems
        this.display = new Display4K(this.canvas);
        this.ctx = this.display.getContext();
        this.effects = new EffectsSystem(this.ctx, this.canvas);
        this.audio = new AudioSystem();
        
        // NFL Team Logos as symbols - using actual file names
        this.symbols = [
            'chiefs',     // Super Bowl champions - highest value
            'eagles',     // High value
            'cowboys',    // High value (popular team)
            '49ers',      // High value
            'bills',      // Medium value
            'dolphins',   // Medium value
            'ravens',     // Medium value
            'lions',      // Medium value
            'packers'     // Wild card
        ];
        
        // Symbol images loaded directly
        this.symbolImages = {};
        this.loadedCount = 0;
        
        // Game state
        this.reels = [[], [], []];
        this.score = 1000;
        this.isSpinning = false;
        this.paylines = 5;
        this.bet = 10;
        this.maxPaylines = 25;
        this.bonusRounds = 0;
        this.multiplier = 1;
        
        // Visual settings - optimized for 4K and mobile
        this.reelWidth = 100;
        this.reelHeight = 100;
        
        // Detect device for positioning
        const isIPhone = /iPhone/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isIPhone) {
            this.reelSpacing = 115;
            this.startX = 35;
            this.startY = 200;
        } else if (isMobile) {
            this.reelSpacing = 120;
            this.startX = 40;
            this.startY = 200;
        } else {
            this.reelSpacing = 140;
            this.startX = 60;
            this.startY = 220;
        }
        
        // Animation state
        this.spinOffset = [0, 0, 0];
        this.spinSpeed = [0, 0, 0];
        
        this.init();
    }
    
    init() {
        console.log('🏈 Initializing NFL Touchdown Slots...');
        this.loadNFLLogos();
        this.setupControls();
        window.gameInstance = this;
    }
    
    loadNFLLogos() {
        this.symbols.forEach(symbol => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.loadedCount++;
                this.renderLoadingScreen(this.loadedCount / this.symbols.length);
                
                if (this.loadedCount === this.symbols.length) {
                    console.log('✅ All NFL logos loaded!');
                    this.startGame();
                }
            };
            
            img.onerror = () => {
                console.error(`Failed to load: ${symbol}`);
                this.loadedCount++;
                if (this.loadedCount === this.symbols.length) {
                    this.startGame();
                }
            };
            
            img.src = `./images/nfl-logos/${symbol}.png`;
            this.symbolImages[symbol] = img;
        });
    }
    
    renderLoadingScreen(progress) {
        const dims = this.display.getScaledDimensions();
        this.display.clear();
        
        // NFL Navy blue gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, '#013369');
        gradient.addColorStop(0.5, '#002244');
        gradient.addColorStop(1, '#0B162A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Loading bar
        const barWidth = Math.min(300, dims.width - 40);
        const barHeight = 25;
        const barX = (dims.width - barWidth) / 2;
        const barY = dims.height / 2;
        
        // Bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Bar fill - NFL Red gradient
        const fillGradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGradient.addColorStop(0, '#D50A0A');
        fillGradient.addColorStop(0.5, '#FF1A1A');
        fillGradient.addColorStop(1, '#D50A0A');
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Loading text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏈 LOADING NFL LOGOS 🏈', dims.width / 2, barY - 40);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`${Math.round(progress * 100)}%`, dims.width / 2, barY + 55);
    }
    
    startGame() {
        this.generateInitialReels();
        this.render();
        this.spinButton.disabled = false;
        this.animationLoop();
        this.updateDisplays();
    }
    
    generateInitialReels() {
        for (let i = 0; i < 3; i++) {
            this.reels[i] = [];
            for (let j = 0; j < 3; j++) {
                this.reels[i].push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
        }
    }
    
    updateDisplays() {
        if (this.creditsDisplay) this.creditsDisplay.textContent = this.score;
        if (this.betDisplay) this.betDisplay.textContent = this.bet;
        if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
    }
    
    setupControls() {
        this.spinButton.addEventListener('click', () => {
            this.audio.play('button_click');
            this.spin();
        });
        
        // Touch controls
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndY = e.changedTouches[0].clientY;
            const swipeDistance = touchStartY - touchEndY;
            
            if (swipeDistance > 50 && !this.isSpinning) {
                this.audio.play('button_click');
                this.spin();
                if (navigator.vibrate) navigator.vibrate(50);
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
                    this.audio.toggle();
                    break;
                case 'ArrowUp':
                    this.paylines = Math.min(this.paylines + 2, this.maxPaylines);
                    break;
                case 'ArrowDown':
                    this.paylines = Math.max(this.paylines - 2, 1);
                    break;
            }
        });
    }
    
    spin() {
        if (this.isSpinning) return;
        
        if (this.bonusRounds > 0) {
            this.bonusRounds--;
            if (this.bonusRounds === 0) this.multiplier = 1;
        } else if (this.score < this.bet) {
            return;
        } else {
            this.score -= this.bet;
        }
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.effects.clear();
        this.updateDisplays();
        
        this.audio.play('spin');
        
        // Generate new results
        const newReels = [];
        for (let i = 0; i < 3; i++) {
            newReels[i] = [];
            for (let j = 0; j < 3; j++) {
                newReels[i].push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
        }
        
        // Animate reels
        const promises = [];
        for (let i = 0; i < 3; i++) {
            const delay = i * 300;
            promises.push(this.animateReel(i, newReels[i], delay));
        }
        
        Promise.all(promises).then(() => {
            this.reels = newReels;
            this.checkWin();
            this.isSpinning = false;
            this.spinButton.disabled = false;
            this.updateDisplays();
        });
    }
    
    animateReel(reelIndex, newSymbols, delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const duration = 1000 + Math.random() * 500;
                const startTime = Date.now();
                this.spinOffset[reelIndex] = 0;
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = this.effects.easeInOutQuart(progress);
                    
                    const baseSpeed = 8;
                    this.spinSpeed[reelIndex] = baseSpeed * (1 - easedProgress);
                    
                    if (progress < 0.95) {
                        this.spinOffset[reelIndex] += this.spinSpeed[reelIndex];
                        while (this.spinOffset[reelIndex] >= this.reelHeight) {
                            this.spinOffset[reelIndex] -= this.reelHeight;
                        }
                    } else {
                        this.spinOffset[reelIndex] *= (1 - (progress - 0.95) * 20);
                    }
                    
                    if (progress >= 1) {
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
        
        // Check horizontal lines
        for (let line = 0; line < Math.min(this.paylines, 3); line++) {
            const symbols = [this.reels[0][line], this.reels[1][line], this.reels[2][line]];
            const winAmount = this.checkLineWin(symbols);
            
            if (winAmount > 0) {
                winnings += winAmount;
                winningLines.push({ line, symbols, amount: winAmount });
                
                for (let reel = 0; reel < 3; reel++) {
                    const x = this.startX + reel * this.reelSpacing;
                    const y = this.startY + line * this.reelHeight;
                    this.effects.addGlowEffect(x, y, this.reelWidth, this.reelHeight, '#FFD700', 1);
                }
            }
        }
        
        // Check diagonals (if paylines >= 5)
        if (this.paylines >= 5) {
            const diag1 = [this.reels[0][0], this.reels[1][1], this.reels[2][2]];
            const diag1Win = this.checkLineWin(diag1);
            if (diag1Win > 0) {
                winnings += diag1Win;
                winningLines.push({ line: 'diag1', symbols: diag1, amount: diag1Win });
            }
            
            const diag2 = [this.reels[0][2], this.reels[1][1], this.reels[2][0]];
            const diag2Win = this.checkLineWin(diag2);
            if (diag2Win > 0) {
                winnings += diag2Win;
                winningLines.push({ line: 'diag2', symbols: diag2, amount: diag2Win });
            }
        }
        
        winnings *= this.multiplier;
        
        if (winnings > 0) {
            this.score += winnings;
            this.celebrateWin(winnings, winningLines);
        }
    }
    
    checkLineWin(symbols) {
        // Handle packers as wild
        const processedSymbols = symbols.map(s => 
            s === 'packers' ? symbols.find(sym => sym !== 'packers') || 'packers' : s
        );
        
        if (processedSymbols[0] === processedSymbols[1] && processedSymbols[1] === processedSymbols[2]) {
            switch (processedSymbols[0]) {
                case 'chiefs': return this.bet * 100;    // Super Bowl Champs
                case 'eagles': return this.bet * 75;
                case 'cowboys': return this.bet * 50;
                case '49ers': return this.bet * 50;
                case 'bills': return this.bet * 25;
                case 'dolphins': return this.bet * 25;
                case 'ravens': return this.bet * 20;
                case 'lions': return this.bet * 20;
                case 'packers': return this.bet * 30;    // Wild
                default: return this.bet * 10;
            }
        }
        
        // Two of a kind with wild
        if (symbols.includes('packers')) {
            const nonWild = symbols.filter(s => s !== 'packers');
            if (nonWild.length === 2 && nonWild[0] === nonWild[1]) {
                return this.bet * 5;
            }
        }
        
        return 0;
    }
    
    celebrateWin(amount, winningLines) {
        console.log(`🏈 TOUCHDOWN! Won: ${amount} credits!`);
        
        const isBigWin = winningLines.some(line => 
            line.symbols.every(s => s === 'chiefs')
        );
        
        if (isBigWin) {
            this.audio.play('jackpot');
        } else {
            this.audio.play('win');
        }
        
        // Create particles
        winningLines.forEach(line => {
            if (typeof line.line === 'number') {
                for (let reel = 0; reel < 3; reel++) {
                    const x = this.startX + reel * this.reelSpacing + this.reelWidth / 2;
                    const y = this.startY + line.line * this.reelHeight + this.reelHeight / 2;
                    this.effects.createWinParticles(x, y, isBigWin ? 'jackpot' : 'sparkle');
                }
            }
        });
        
        // Screen shake for big wins
        if (amount >= this.bet * 100) {
            this.effects.createFireworksEffect(
                this.startX + this.reelSpacing + this.reelWidth / 2,
                this.startY + this.reelHeight * 1.5
            );
            this.effects.createScreenShake(12, 800);
        } else if (amount >= this.bet * 50) {
            this.effects.createScreenShake(8, 600);
        } else if (amount >= this.bet * 20) {
            this.effects.createScreenShake(4, 400);
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            if (amount >= this.bet * 100) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            } else if (amount >= this.bet * 50) {
                navigator.vibrate([100, 50, 100]);
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
        
        // Animated NFL background
        const time = Date.now() * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, `hsl(${215 + Math.sin(time) * 3}, 75%, 15%)`);
        gradient.addColorStop(0.5, `hsl(${215 + Math.cos(time * 0.7) * 3}, 65%, 12%)`);
        gradient.addColorStop(1, `hsl(${215 + Math.sin(time * 0.5) * 3}, 55%, 8%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Draw title
        this.drawTitle(dims);
        
        // Render reels
        this.renderReels(dims);
        
        // Render UI
        this.renderUI(dims);
        
        // Render effects
        this.effects.render();
    }
    
    drawTitle(dims) {
        this.ctx.save();
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        
        // Title with gold gradient
        const titleGradient = this.ctx.createLinearGradient(0, 40, 0, 80);
        titleGradient.addColorStop(0, '#FFD700');
        titleGradient.addColorStop(0.5, '#FFA500');
        titleGradient.addColorStop(1, '#FFD700');
        this.ctx.fillStyle = titleGradient;
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillText('🏈 NFL TOUCHDOWN SLOTS 🏈', dims.width / 2, 60);
        this.ctx.restore();
    }
    
    renderReels(dims) {
        // Slot machine frame
        const frameMargin = 20;
        const frameX = this.startX - frameMargin;
        const frameY = this.startY - frameMargin;
        const totalReelWidth = (2 * this.reelSpacing) + this.reelWidth;
        const frameWidth = totalReelWidth + 2 * frameMargin;
        const frameHeight = 3 * this.reelHeight + 2 * frameMargin;
        
        // Outer frame with NFL red accent
        const frameGradient = this.ctx.createLinearGradient(frameX, frameY, frameX + frameWidth, frameY + frameHeight);
        frameGradient.addColorStop(0, '#3a3a3a');
        frameGradient.addColorStop(0.5, '#1a1a1a');
        frameGradient.addColorStop(1, '#3a3a3a');
        this.ctx.fillStyle = frameGradient;
        this.ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
        
        // Red accent border
        this.ctx.strokeStyle = '#D50A0A';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
        
        // Inner background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(frameX + 8, frameY + 8, frameWidth - 16, frameHeight - 16);
        
        // Reel background
        const reelBgGradient = this.ctx.createLinearGradient(this.startX, this.startY, this.startX, this.startY + 3 * this.reelHeight);
        reelBgGradient.addColorStop(0, 'rgba(20, 40, 80, 0.9)');
        reelBgGradient.addColorStop(0.5, 'rgba(10, 20, 40, 0.95)');
        reelBgGradient.addColorStop(1, 'rgba(20, 40, 80, 0.9)');
        this.ctx.fillStyle = reelBgGradient;
        this.ctx.fillRect(this.startX - 10, this.startY - 10, totalReelWidth + 20, 3 * this.reelHeight + 20);
        
        // Render each reel
        for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
            const x = this.startX + reelIndex * this.reelSpacing;
            
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(x - 2, this.startY - 2, this.reelWidth + 4, 3 * this.reelHeight + 4);
            this.ctx.clip();
            
            // Render symbols
            for (let symbolIndex = 0; symbolIndex < 3; symbolIndex++) {
                let y = this.startY + symbolIndex * this.reelHeight;
                
                if (this.isSpinning) {
                    y += this.spinOffset[reelIndex];
                }
                
                const symbol = this.reels[reelIndex][symbolIndex];
                
                if (y >= this.startY - 5 && y <= this.startY + 3 * this.reelHeight - this.reelHeight + 5) {
                    this.renderSymbol(symbol, x, y);
                }
            }
            
            // Extra symbols during spin
            if (this.isSpinning && this.spinSpeed[reelIndex] > 0) {
                for (let i = -1; i <= 4; i++) {
                    let extraY = this.startY + i * this.reelHeight + this.spinOffset[reelIndex];
                    
                    if (extraY >= this.startY - 10 && extraY + this.reelHeight <= this.startY + 3 * this.reelHeight + 10) {
                        const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                        this.renderSymbol(randomSymbol, x, extraY, 0.8);
                    }
                }
            }
            
            this.ctx.restore();
            
            // Reel separator
            if (reelIndex < 2) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                const separatorX = x + this.reelWidth + (this.reelSpacing - this.reelWidth) / 2;
                this.ctx.moveTo(separatorX, this.startY);
                this.ctx.lineTo(separatorX, this.startY + 3 * this.reelHeight);
                this.ctx.stroke();
            }
        }
        
        // Glass reflection effect
        const glassGradient = this.ctx.createLinearGradient(this.startX, this.startY, this.startX + totalReelWidth, this.startY + 3 * this.reelHeight);
        glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        glassGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
        glassGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.01)');
        glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        this.ctx.fillStyle = glassGradient;
        this.ctx.fillRect(this.startX - 10, this.startY - 10, totalReelWidth + 20, 3 * this.reelHeight + 20);
        
        // Paylines
        this.renderPaylines();
    }
    
    renderSymbol(symbol, x, y, alpha = 1) {
        const img = this.symbolImages[symbol];
        
        if (img && img.complete && img.naturalWidth > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Symbol shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
            
            // Draw white background circle for logo
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(x + this.reelWidth / 2, y + this.reelHeight / 2, this.reelWidth / 2 - 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw logo
            const padding = 8;
            this.ctx.drawImage(img, x + padding, y + padding, this.reelWidth - padding * 2, this.reelHeight - padding * 2);
            
            // Border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x + this.reelWidth / 2, y + this.reelHeight / 2, this.reelWidth / 2 - 5, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        } else {
            // Fallback placeholder
            const gradient = this.ctx.createLinearGradient(x, y, x + this.reelWidth, y + this.reelHeight);
            gradient.addColorStop(0, '#D50A0A');
            gradient.addColorStop(1, '#8B0000');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.reelWidth / 2, y + this.reelHeight / 2, this.reelWidth / 2 - 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(symbol.toUpperCase(), x + this.reelWidth / 2, y + this.reelHeight / 2 + 4);
        }
    }
    
    renderUI(dims) {
        const uiY = dims.height - 130;
        
        // UI background
        const uiGradient = this.ctx.createLinearGradient(0, uiY - 20, 0, dims.height);
        uiGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        uiGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = uiGradient;
        this.ctx.fillRect(0, uiY - 20, dims.width, dims.height - uiY + 20);
        
        // Stats
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Credits: ${this.score}`, 25, uiY);
        this.ctx.fillText(`Bet: ${this.bet}`, 25, uiY + 25);
        this.ctx.fillText(`Lines: ${this.paylines}`, 25, uiY + 50);
        
        // Bonus info
        if (this.bonusRounds > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`FREE SPINS: ${this.bonusRounds}`, dims.width - 25, uiY);
            this.ctx.fillText(`${this.multiplier}x MULTIPLIER`, dims.width - 25, uiY + 25);
        }
    }
    
    renderPaylines() {
        if (this.paylines <= 0) return;
        
        const colors = ['#D50A0A', '#FFD700', '#00FF00', '#FF6600', '#FF00FF'];
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 3;
        
        // Horizontal paylines
        for (let line = 0; line < Math.min(this.paylines, 3); line++) {
            this.ctx.strokeStyle = colors[line % colors.length];
            const y = this.startY + line * this.reelHeight + this.reelHeight / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, y);
            this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth, y);
            this.ctx.stroke();
        }
        
        // Diagonal paylines
        if (this.paylines >= 5) {
            // Diagonal 1
            this.ctx.strokeStyle = colors[3];
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX + this.reelWidth / 2, this.startY + this.reelHeight / 2);
            this.ctx.lineTo(this.startX + this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight + this.reelHeight / 2);
            this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth / 2, this.startY + 2 * this.reelHeight + this.reelHeight / 2);
            this.ctx.stroke();
            
            // Diagonal 2
            this.ctx.strokeStyle = colors[4];
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX + this.reelWidth / 2, this.startY + 2 * this.reelHeight + this.reelHeight / 2);
            this.ctx.lineTo(this.startX + this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight + this.reelHeight / 2);
            this.ctx.lineTo(this.startX + 2 * this.reelSpacing + this.reelWidth / 2, this.startY + this.reelHeight / 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏈 Starting NFL Touchdown Slots...');
    
    try {
        const game = new NFLGame();
        window.nflSlots = game;
        console.log('✅ NFL Touchdown Slots initialized!');
    } catch (error) {
        console.error('❌ Failed to initialize NFL Slots:', error);
        
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
        ctx.fillStyle = '#D50A0A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading NFL Slots', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 10);
    }
});
