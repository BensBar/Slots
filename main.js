// Ultimate 4K iPhone Slot Machine - Main Entry Point
console.log('🎰 Starting Ultimate 4K iPhone Slot Machine...');

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create game instance
        const game = new SlotMachine4K();
        
        // Store global reference
        window.slotMachine = game;
        
        console.log('✅ 4K Slot Machine initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize 4K Slot Machine:', error);
        
        // Fallback error display
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 375;
        canvas.height = 200;
        
        ctx.fillStyle = '#ff0000';
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