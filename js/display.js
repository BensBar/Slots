// 4K Display System for iPhone Slot Machine
class Display4K {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.baseWidth = 375;  // iPhone base width
        this.baseHeight = 812; // iPhone base height
        this.scale = 1;
        
        this.setupCanvas();
        this.setupResponsiveResizing();
    }
    
    setupCanvas() {
        // Get actual display size
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Calculate scale factor for 4K support
        this.scale = Math.min(
            window.innerWidth / this.baseWidth,
            window.innerHeight / this.baseHeight
        );
        
        // Set actual canvas size for 4K
        this.canvas.width = this.baseWidth * this.devicePixelRatio * this.scale;
        this.canvas.height = this.baseHeight * this.devicePixelRatio * this.scale;
        
        // Scale CSS size
        this.canvas.style.width = this.baseWidth * this.scale + 'px';
        this.canvas.style.height = this.baseHeight * this.scale + 'px';
        
        // Scale context for crisp rendering
        this.ctx.scale(this.devicePixelRatio * this.scale, this.devicePixelRatio * this.scale);
        
        // Enable image smoothing for high-quality scaling
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        console.log(`Display initialized: ${this.canvas.width}x${this.canvas.height} (scale: ${this.scale})`);
    }
    
    setupResponsiveResizing() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                // Trigger redraw
                if (window.gameInstance) {
                    window.gameInstance.render();
                }
            }, 100);
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupCanvas();
                if (window.gameInstance) {
                    window.gameInstance.render();
                }
            }, 500);
        });
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    }
    
    getContext() {
        return this.ctx;
    }
    
    getScaledDimensions() {
        return {
            width: this.baseWidth,
            height: this.baseHeight,
            scale: this.scale,
            devicePixelRatio: this.devicePixelRatio
        };
    }
}