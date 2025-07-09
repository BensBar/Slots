const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spin-button');
const symbols = ['bell', 'cherry', 'clover', 'diamond', 'jackpot', 'lemon', 'seven', 'star', 'wild'];
canvas.width = 375; // iPhone portrait width
canvas.height = 812; // iPhone portrait height

let reels = [[], [], []];
let score = 0;
let isSpinning = false;
const images = {};

// Preload images with error handling and fallback path
symbols.forEach(symbol => {
    images[symbol] = new Image();
    images[symbol].onload = () => console.log(`${symbol}.png loaded successfully`);
    images[symbol].onerror = () => {
        console.log(`${symbol}.png failed to load from ./assets/, trying /Slots/assets/`);
        images[symbol].src = `/Slots/assets/${symbol}.png`; // Fallback path
    };
    images[symbol].src = `./assets/${symbol}.png`; // Updated to .png
});

function initializeGame() {
    setTimeout(() => {
        if (Object.values(images).every(img => img.complete || img.error)) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawScore();
            spinReels();
        } else {
            console.error('Image loading issues detected, check console for details');
        }
    }, 1000); // Delay for loading
}

function drawReel(reel, x) {
    reel.forEach((symbol, index) => {
        if (images[symbol] && images[symbol].complete) {
            ctx.drawImage(images[symbol], x, index * 150 + 100, 100, 100);
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x, index * 150 + 100, 100, 100); // Red placeholder for missing images
        }
    });
}

function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 50);
}

function spinReels() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;

    let spinCount = 0;
    const spinDuration = 30;
    const interval = setInterval(() => {
        if (spinCount < spinDuration) {
            reels = symbols.map(() => symbols.sort(() => Math.random() - 0.5).slice(0, 3));
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 100, canvas.width, 450);
            reels.forEach((reel, index) => drawReel(reel, index * 125 + 50));
            spinCount++;
        } else {
            clearInterval(interval);
            checkWin();
            isSpinning = false;
            spinButton.disabled = false;
        }
    }, 100);
}

function checkWin() {
    const reel1 = reels[0][0];
    if (reels[0][0] === reels[1][0] && reels[1][0] === reels[2][0]) {
        score += reel1 === 'jackpot' ? 100 : 10;
    }
    drawScore();
}

window.onload = initializeGame;
spinButton.addEventListener('click', spinReels);