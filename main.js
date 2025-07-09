const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spin-button');
const symbols = ['bell', 'cherry', 'clover', 'diamond', 'jackpot', 'lemon', 'seven', 'star', 'wild'];
canvas.width = 375;
canvas.height = 812;

let reels = [[], [], []];
let score = 0;
let isSpinning = false;
const images = {};

symbols.forEach(symbol => {
    images[symbol] = new Image();
    images[symbol].onload = () => console.log(`${symbol} loaded`);
    images[symbol].onerror = () => console.log(`${symbol} failed to load`);
    images[symbol].src = `./assets/${symbol}.png`; // Adjusted path
});

function initializeGame() {
    setTimeout(() => {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawScore();
        spinReels();
    }, 1000); // Delay for image loading
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

spinButton.addEventListener('click', spinReels);