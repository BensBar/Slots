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

// Preload images with error handling
symbols.forEach(symbol => {
    images[symbol] = new Image();
    images[symbol].onload = () => console.log(`${symbol}.PNG loaded`);
    images[symbol].onerror = () => console.log(`${symbol}.PNG failed to load`);
    images[symbol].src = `./assets/${symbol}.PNG`; // Updated to .PNG
});

function initializeGame() {
    // Delay to allow image loading
    setTimeout(() => {
        if (Object.values(images).every(img => img.complete || img.error)) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawScore();
            spinReels();
        } else {
            console.log('Some images failed to load, check console for details');
        }
    }, 1000);
}

function drawReel(reel, x) {
    reel.forEach((symbol, index) => {
        if (images[symbol] && images[symbol].complete) {
            ctx.drawImage(images[symbol], x, index * 150 + 100, 100, 100);
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
