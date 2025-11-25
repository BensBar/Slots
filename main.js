// NFL Touchdown Slots - Main Entry Point
console.log('🏈 Starting NFL Touchdown Slots...');

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for Game class...');
    console.log('Game class exists:', typeof Game !== 'undefined');
    console.log('Display4K class exists:', typeof Display4K !== 'undefined');
    console.log('AssetManager class exists:', typeof AssetManager !== 'undefined');
    console.log('EffectsSystem class exists:', typeof EffectsSystem !== 'undefined');
    console.log('AudioSystem class exists:', typeof AudioSystem !== 'undefined');
    
    try {
        // Create game instance
        const game = new Game();
        
        // Store global reference
        window.slotMachine = game;
        
        console.log('✅ NFL Touchdown Slots initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize NFL Touchdown Slots:', error);
        
        // Fallback error display
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 375;
        canvas.height = 200;
        
        ctx.fillStyle = '#D50A0A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading game', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 10);
    }
});

// Service Worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('❌ SW registration failed: ', registrationError);
            });
    });
}
