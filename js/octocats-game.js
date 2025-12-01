// Octocat Slots - GitHub Universe Game Engine
// Uses Octocat images from images/octocats/
// Tech/Developer themed with playful GitHub aesthetic

class OctocatGame {
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
        
        // Octocat symbols - using PNG files
        this.symbols = [
            'original',           // Classic Octocat - Jackpot
            'Robotocat',          // High value
            'dinotocat',          // High value
            'spidertocat',        // Medium value
            'droidtocat',         // Medium value
            'jetpacktocat',       // Medium value
            'adventure-cat',      // Medium value
            'class-act',          // Wild card
            'spocktocat'          // Bonus scatter
        ];
        
        // Symbol images
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
        this.reelWidth = 95;
        this.reelHeight = 95;
        
        // Detect device for positioning
        const isIPhone = /iPhone/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isIPhone) {
            this.reelSpacing = 110;
            this.startX = 40;
            this.startY = 200;
        } else if (isMobile) {
            this.reelSpacing = 115;
            this.startX = 45;
            this.startY = 200;
        } else {
            this.reelSpacing = 135;
            this.startX = 65;
            this.startY = 220;
        }
        
        // Animation state
        this.spinOffset = [0, 0, 0];
        this.spinSpeed = [0, 0, 0];
        
        // GitHub theme colors
        this.colors = {
            primary: '#58a6ff',
            secondary: '#a371f7',
            success: '#3fb950',
            warning: '#d29922',
            danger: '#f85149',
            bg: '#0d1117',
            surface: '#161b22',
            border: '#30363d',
            text: '#c9d1d9'
        };
        
        this.init();
    }
    
    init() {
        console.log('🐙 Initializing Octocat Slots...');
        this.loadOctocats();
        this.setupControls();
        window.gameInstance = this;
    }
    
    loadOctocats() {
        this.symbols.forEach(symbol => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.loadedCount++;
                this.renderLoadingScreen(this.loadedCount / this.symbols.length);
                
                if (this.loadedCount === this.symbols.length) {
                    console.log('✅ All Octocats loaded!');
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
            
            img.src = `./images/octocats/${symbol}.png`;
            this.symbolImages[symbol] = img;
        });
    }
    
    renderLoadingScreen(progress) {
        const dims = this.display.getScaledDimensions();
        this.display.clear();
        
        // GitHub dark gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, '#0d1117');
        gradient.addColorStop(0.5, '#161b22');
        gradient.addColorStop(1, '#0d1117');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Loading bar
        const barWidth = Math.min(300, dims.width - 40);
        const barHeight = 8;
        const barX = (dims.width - barWidth) / 2;
        const barY = dims.height / 2;
        
        // Bar background
        this.ctx.fillStyle = '#30363d';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Bar fill - GitHub gradient
        const fillGradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGradient.addColorStop(0, '#3fb950');
        fillGradient.addColorStop(0.5, '#58a6ff');
        fillGradient.addColorStop(1, '#a371f7');
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Loading text
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.font = 'bold 24px "SF Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐙 Loading Octocats...', dims.width / 2, barY - 40);
        
        // Progress text
        this.ctx.fillStyle = '#8b949e';
        this.ctx.font = '14px "SF Mono", monospace';
        this.ctx.fillText(`[${Math.round(progress * 100)}%] git clone octocats`, dims.width / 2, barY + 35);
        
        // Commit-style messages
        if (progress > 0.3) {
            this.ctx.fillStyle = '#3fb950';
            this.ctx.fillText('✓ Fetching origin...', dims.width / 2, barY + 55);
        }
        if (progress > 0.6) {
            this.ctx.fillStyle = '#3fb950';
            this.ctx.fillText('✓ Resolving deltas...', dims.width / 2, barY + 75);
        }
        if (progress > 0.9) {
            this.ctx.fillStyle = '#3fb950';
            this.ctx.fillText('✓ Almost ready!', dims.width / 2, barY + 95);
        }
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
            const delay = i * 350;
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
                const duration = 1200 + Math.random() * 400;
                const startTime = Date.now();
                this.spinOffset[reelIndex] = 0;
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = this.effects.easeInOutQuart(progress);
                    
                    const baseSpeed = 7;
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
                    this.effects.addGlowEffect(x, y, this.reelWidth, this.reelHeight, '#3fb950', 1);
                }
            }
        }
        
        // Check diagonals
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
            this.checkBonusRound(winningLines);
        }
    }
    
    checkLineWin(symbols) {
        // Handle class-act as wild
        const processedSymbols = symbols.map(s => 
            s === 'class-act' ? symbols.find(sym => sym !== 'class-act') || 'class-act' : s
        );
        
        if (processedSymbols[0] === processedSymbols[1] && processedSymbols[1] === processedSymbols[2]) {
            switch (processedSymbols[0]) {
                case 'original': return this.bet * 100;      // Jackpot!
                case 'Robotocat': return this.bet * 75;
                case 'dinotocat': return this.bet * 50;
                case 'spidertocat': return this.bet * 30;
                case 'droidtocat': return this.bet * 25;
                case 'jetpacktocat': return this.bet * 25;
                case 'adventure-cat': return this.bet * 20;
                case 'class-act': return this.bet * 40;      // Wild
                case 'spocktocat': return 0;                 // Scatter - triggers bonus
                default: return this.bet * 10;
            }
        }
        
        // Two of a kind with wild
        if (symbols.includes('class-act')) {
            const nonWild = symbols.filter(s => s !== 'class-act');
            if (nonWild.length === 2 && nonWild[0] === nonWild[1]) {
                return this.bet * 5;
            }
        }
        
        return 0;
    }
    
    checkBonusRound(winningLines) {
        // Check for scatter symbols (spocktocat)
        const scatterCount = this.reels.flat().filter(s => s === 'spocktocat').length;
        
        if (scatterCount >= 3) {
            this.bonusRounds += 10;
            this.multiplier = 2;
            
            // Create special celebration
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    this.effects.createWinParticles(x, y, 'jackpot');
                }, i * 100);
            }
            
            console.log('🐙 BONUS ROUND! 10 Free Pushes with 2x Multiplier!');
        }
    }
    
    celebrateWin(amount, winningLines) {
        console.log(`🐙 MERGED! Won: ${amount} stars!`);
        
        const isJackpot = winningLines.some(line => 
            line.symbols.every(s => s === 'original')
        );
        
        if (isJackpot) {
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
                    this.effects.createWinParticles(x, y, isJackpot ? 'jackpot' : 'sparkle');
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
        
        // Animated GitHub-style background
        const time = Date.now() * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, dims.height);
        gradient.addColorStop(0, '#0d1117');
        gradient.addColorStop(0.3, `rgba(22, 27, 34, ${0.9 + Math.sin(time * 0.5) * 0.1})`);
        gradient.addColorStop(0.7, `rgba(33, 38, 45, ${0.8 + Math.cos(time * 0.3) * 0.1})`);
        gradient.addColorStop(1, '#0d1117');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dims.width, dims.height);
        
        // Draw decorative elements
        this.drawCodeLines(dims);
        
        // Draw title
        this.drawTitle(dims);
        
        // Render reels
        this.renderReels(dims);
        
        // Render UI
        this.renderUI(dims);
        
        // Render effects
        this.effects.render();
    }
    
    drawCodeLines(dims) {
        // Decorative code-like background elements
        this.ctx.save();
        this.ctx.globalAlpha = 0.03;
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.font = '10px "SF Mono", monospace';
        
        const codeSnippets = [
            'const octocat = new Octocat();',
            'git push origin main',
            'npm install luck',
            'import { win } from "slots"',
            '// TODO: get jackpot',
            'while(spinning) { await luck; }'
        ];
        
        for (let i = 0; i < 6; i++) {
            this.ctx.fillText(codeSnippets[i], 10, 50 + i * 120);
            this.ctx.fillText(codeSnippets[(i + 3) % 6], dims.width - 200, 80 + i * 130);
        }
        
        this.ctx.restore();
    }
    
    drawTitle(dims) {
        this.ctx.save();
        this.ctx.font = 'bold 28px "SF Mono", monospace';
        this.ctx.textAlign = 'center';
        
        // Title with GitHub blue
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.shadowColor = 'rgba(88, 166, 255, 0.5)';
        this.ctx.shadowBlur = 15;
        
        this.ctx.fillText('🐙 OCTOCAT SLOTS 🐙', dims.width / 2, 55);
        
        // Subtitle
        this.ctx.font = '12px "SF Mono", monospace';
        this.ctx.fillStyle = '#8b949e';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('GitHub Universe Edition', dims.width / 2, 75);
        
        this.ctx.restore();
    }
    
    renderReels(dims) {
        // Slot machine frame - GitHub panel style
        const frameMargin = 18;
        const frameX = this.startX - frameMargin;
        const frameY = this.startY - frameMargin;
        const totalReelWidth = (2 * this.reelSpacing) + this.reelWidth;
        const frameWidth = totalReelWidth + 2 * frameMargin;
        const frameHeight = 3 * this.reelHeight + 2 * frameMargin;
        
        // Outer frame - dark panel
        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
        
        // Border
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
        
        // Inner background - darker
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fillRect(frameX + 6, frameY + 6, frameWidth - 12, frameHeight - 12);
        
        // Accent line at top (like GitHub's colored line)
        const accentGradient = this.ctx.createLinearGradient(frameX, 0, frameX + frameWidth, 0);
        accentGradient.addColorStop(0, '#3fb950');
        accentGradient.addColorStop(0.5, '#58a6ff');
        accentGradient.addColorStop(1, '#a371f7');
        this.ctx.fillStyle = accentGradient;
        this.ctx.fillRect(frameX, frameY, frameWidth, 3);
        
        // Reel background
        const reelBgGradient = this.ctx.createLinearGradient(this.startX, this.startY, this.startX, this.startY + 3 * this.reelHeight);
        reelBgGradient.addColorStop(0, 'rgba(13, 17, 23, 0.95)');
        reelBgGradient.addColorStop(0.5, 'rgba(22, 27, 34, 0.9)');
        reelBgGradient.addColorStop(1, 'rgba(13, 17, 23, 0.95)');
        this.ctx.fillStyle = reelBgGradient;
        this.ctx.fillRect(this.startX - 8, this.startY - 8, totalReelWidth + 16, 3 * this.reelHeight + 16);
        
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
            
            // Reel separator - dotted line like GitHub
            if (reelIndex < 2) {
                this.ctx.strokeStyle = '#30363d';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                const separatorX = x + this.reelWidth + (this.reelSpacing - this.reelWidth) / 2;
                this.ctx.moveTo(separatorX, this.startY);
                this.ctx.lineTo(separatorX, this.startY + 3 * this.reelHeight);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
        
        // Paylines
        this.renderPaylines();
    }
    
    renderSymbol(symbol, x, y, alpha = 1) {
        const img = this.symbolImages[symbol];
        
        if (img && img.complete && img.naturalWidth > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Rounded rectangle background - like GitHub avatar
            const radius = 12;
            const padding = 4;
            
            // Background - using cross-browser compatible rounded rect
            this.ctx.fillStyle = '#161b22';
            this.drawRoundedRect(x + padding, y + padding, this.reelWidth - padding * 2, this.reelHeight - padding * 2, radius);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#30363d';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Draw octocat
            const imgPadding = 8;
            this.ctx.drawImage(
                img, 
                x + imgPadding, 
                y + imgPadding, 
                this.reelWidth - imgPadding * 2, 
                this.reelHeight - imgPadding * 2
            );
            
            this.ctx.restore();
        } else {
            // Fallback placeholder
            const radius = 12;
            const padding = 4;
            
            this.ctx.fillStyle = '#21262d';
            this.drawRoundedRect(x + padding, y + padding, this.reelWidth - padding * 2, this.reelHeight - padding * 2, radius);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#30363d';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Octocat emoji placeholder
            this.ctx.fillStyle = '#8b949e';
            this.ctx.font = 'bold 10px "SF Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🐙', x + this.reelWidth / 2, y + this.reelHeight / 2 - 8);
            this.ctx.fillText(symbol.slice(0, 8), x + this.reelWidth / 2, y + this.reelHeight / 2 + 8);
        }
    }
    
    renderUI(dims) {
        const uiY = dims.height - 125;
        
        // UI panel background
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.fillRect(0, uiY - 15, dims.width, dims.height - uiY + 15);
        
        // Border line
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, uiY - 15);
        this.ctx.lineTo(dims.width, uiY - 15);
        this.ctx.stroke();
        
        // Stats
        this.ctx.font = '14px "SF Mono", monospace';
        this.ctx.textAlign = 'left';
        
        // Stars (credits)
        this.ctx.fillStyle = '#d29922';
        this.ctx.fillText(`⭐ ${this.score}`, 20, uiY + 5);
        
        // Forks (bet)
        this.ctx.fillStyle = '#8b949e';
        this.ctx.fillText(`🍴 ${this.bet}`, 20, uiY + 25);
        
        // Branches (paylines)
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillText(`🔀 ${this.paylines} branches`, 20, uiY + 45);
        
        // Bonus info
        if (this.bonusRounds > 0) {
            this.ctx.fillStyle = '#3fb950';
            this.ctx.font = 'bold 16px "SF Mono", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🎁 FREE: ${this.bonusRounds}`, dims.width - 20, uiY + 5);
            this.ctx.fillText(`${this.multiplier}x MULTI`, dims.width - 20, uiY + 25);
        }
    }
    
    renderPaylines() {
        if (this.paylines <= 0) return;
        
        // GitHub-themed colors
        const colors = ['#3fb950', '#58a6ff', '#a371f7', '#d29922', '#f85149'];
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.35;
        this.ctx.lineWidth = 2;
        
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
    
    // Helper method for cross-browser rounded rectangles
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐙 Starting Octocat Slots...');
    
    try {
        const game = new OctocatGame();
        window.octocatSlots = game;
        console.log('✅ Octocat Slots initialized!');
    } catch (error) {
        console.error('❌ Failed to initialize Octocat Slots:', error);
        
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f85149';
        ctx.font = '16px "SF Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Error: Failed to initialize', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 10);
    }
});
