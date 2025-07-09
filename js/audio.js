// Audio System for Premium Slot Machine Experience
class AudioSystem {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.volume = 0.5;
        this.isMuted = false;
        
        this.initAudioContext();
        this.loadSounds();
    }
    
    initAudioContext() {
        try {
            // Modern browsers
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    loadSounds() {
        // Create synthetic sounds since we don't have audio files
        this.createSynthSounds();
    }
    
    createSynthSounds() {
        // Create synthetic sound effects using Web Audio API
        this.sounds.spin = this.createSpinSound();
        this.sounds.win = this.createWinSound();
        this.sounds.jackpot = this.createJackpotSound();
        this.sounds.reel_stop = this.createReelStopSound();
        this.sounds.button_click = this.createButtonClickSound();
    }
    
    createSpinSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }
    
    createWinSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            // Create a celebratory chord
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + index * 0.1 + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.1 + 0.5);
                
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.5);
            });
        };
    }
    
    createJackpotSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            // Create an exciting jackpot fanfare
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
            
            notes.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sawtooth';
                
                const startTime = this.audioContext.currentTime + index * 0.15;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.8);
            });
        };
    }
    
    createReelStopSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.2);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    createButtonClickSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
            try {
                this.sounds[soundName]();
            } catch (e) {
                console.log('Error playing sound:', soundName, e);
            }
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    mute() {
        this.isMuted = true;
    }
    
    unmute() {
        this.isMuted = false;
    }
    
    toggle() {
        this.isMuted = !this.isMuted;
        return !this.isMuted;
    }
}