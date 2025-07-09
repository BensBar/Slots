// Asset Manager for 4K Multi-Resolution Loading
class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.loadingCallbacks = [];
        this.completedCallbacks = [];
    }
    
    getOptimalResolution() {
        // Determine best resolution based on device pixel ratio and screen size
        const ratio = this.devicePixelRatio;
        const screenWidth = window.screen.width * ratio;
        
        if (screenWidth >= 3840) return '4x'; // 4K displays
        if (screenWidth >= 1920) return '3x'; // High-DPI displays
        if (screenWidth >= 1080) return '2x'; // Retina displays
        return '1x'; // Standard displays
    }
    
    loadAssets(symbols, basePath = './assets/') {
        this.totalCount = symbols.length;
        this.loadedCount = 0;
        
        const resolution = this.getOptimalResolution();
        console.log(`Loading assets at ${resolution} resolution for device pixel ratio: ${this.devicePixelRatio}`);
        
        symbols.forEach(symbol => {
            this.loadImageWithFallback(symbol, basePath, resolution);
        });
    }
    
    loadImageWithFallback(symbol, basePath, resolution) {
        const img = new Image();
        this.images[symbol] = img;
        
        // Try high-resolution first, fallback to lower resolutions
        const resolutions = ['4x', '3x', '2x', '1x'];
        const startIndex = resolutions.indexOf(resolution);
        const fallbackResolutions = startIndex >= 0 ? resolutions.slice(startIndex) : ['1x'];
        
        this.tryLoadWithFallback(img, symbol, basePath, fallbackResolutions, 0);
    }
    
    tryLoadWithFallback(img, symbol, basePath, resolutions, index) {
        if (index >= resolutions.length) {
            // All resolutions failed, use placeholder
            console.error(`Failed to load ${symbol} at any resolution`);
            this.createPlaceholder(img, symbol);
            this.onImageLoaded(symbol);
            return;
        }
        
        const resolution = resolutions[index];
        const suffix = resolution === '1x' ? '' : `@${resolution}`;
        const imagePath = `${basePath}${symbol}${suffix}.png`;
        
        img.onload = () => {
            console.log(`✓ Loaded ${symbol} at ${resolution} resolution`);
            this.onImageLoaded(symbol);
        };
        
        img.onerror = () => {
            console.log(`✗ Failed to load ${symbol} at ${resolution}, trying lower resolution...`);
            this.tryLoadWithFallback(img, symbol, basePath, resolutions, index + 1);
        };
        
        img.src = imagePath;
    }
    
    createPlaceholder(img, symbol) {
        // Create a colored placeholder canvas
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Generate a unique color based on symbol name
        const hash = this.hashCode(symbol);
        const hue = Math.abs(hash) % 360;
        
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(symbol.toUpperCase(), 100, 100);
        
        img.src = canvas.toDataURL();
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    
    onImageLoaded(symbol) {
        this.loadedCount++;
        const progress = this.loadedCount / this.totalCount;
        
        // Notify progress callbacks
        this.loadingCallbacks.forEach(callback => callback(progress, symbol));
        
        if (this.loadedCount === this.totalCount) {
            console.log('✓ All assets loaded successfully');
            this.completedCallbacks.forEach(callback => callback());
        }
    }
    
    onProgress(callback) {
        this.loadingCallbacks.push(callback);
    }
    
    onComplete(callback) {
        this.completedCallbacks.push(callback);
    }
    
    getImage(symbol) {
        return this.images[symbol];
    }
    
    isLoaded(symbol) {
        const img = this.images[symbol];
        return img && (img.complete || img.naturalWidth > 0);
    }
    
    areAllLoaded() {
        return this.loadedCount === this.totalCount;
    }
}