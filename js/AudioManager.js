// js/AudioManager.js

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        this.isMuted = false;
    }

    // Load an audio file and store it in the dictionary
    async loadSound(key, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            // oncanplaythrough ensures the browser has buffered enough to play
            audio.oncanplaythrough = () => {
                this.sounds[key] = audio;
                resolve(audio);
            };
            audio.onerror = () => reject(new Error(`Failed to load audio: ${path}`));
            audio.src = path;
        });
    }

    // Play looping background music
    playMusic(key, volume = 0.5) {
        if (this.isMuted || !this.sounds[key]) return;

        // Stop current music if switching tracks
        if (this.currentMusic && this.currentMusic !== this.sounds[key]) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        this.currentMusic = this.sounds[key];
        this.currentMusic.loop = true;
        this.currentMusic.volume = volume;

        // Handle browser autoplay restrictions
        const playPromise = this.currentMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Autoplay blocked. Waiting for user interaction to start music.");
                
                // Fallback: start music on the very first user click
                const startOnInteract = () => {
                    this.currentMusic.play();
                    document.removeEventListener('click', startOnInteract);
                };
                document.addEventListener('click', startOnInteract);
            });
        }
    }

    // Play one-shot sound effects
    playSound(key, volume = 1.0) {
        if (this.isMuted || !this.sounds[key]) return;
        
        // Clone the node so the same sound can overlap (e.g., multiple lasers)
        const soundClone = this.sounds[key].cloneNode();
        soundClone.volume = volume;
        soundClone.play().catch(e => console.warn("SFX play failed:", e));
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.currentMusic) {
            this.currentMusic.pause();
        } else if (!this.isMuted && this.currentMusic) {
            this.currentMusic.play();
        }
    }
}