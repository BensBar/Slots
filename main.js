const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spin-button');
const symbols = ['bell', 'cherry', 'clover', 'diamond', 'jackpot', 'lemon', 'seven', 'star', 'wild'];
canvas.width = 375;
canvas.height = 812;

let reels = [[], [], []];
const images = {};

// Preload images
symbols.forEach(symbol => {
    images[symbol] = new Image();
    images[symbol].src = `/assets/${symbol}.PNG`;
});

function drawReel(reel, x) {
    reel.forEach((symbol, index) => {
        ctx.drawImage(images[symbol], x, index * 100, 100, 100);
    });
}

function spinReels() {
    reels = symbols.map(() => symbols.sort(() => Math.random() - 0.5).slice(0, 3));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    reels.forEach((reel, index) => drawReel(reel, index * 125 + 50));
}

spinButton.addEventListener('click', spinReels);
spinReels(); // Initial draw
