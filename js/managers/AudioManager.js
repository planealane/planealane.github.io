// js/AudioManager.js
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class AudioManager {

    // ============================================================================
    // 1. INITIALIZATION & SUBSCRIPTIONS
    // ============================================================================

    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        this.isMuted = false;

        this.initListeners();
    }

    /**
     * Subscribes to global game events to play sounds decoupled from game logic.
     */
    initListeners() {
        // Listen for requests to play one-shot sound effects
        // Expected payload: { id: 'soundKey', volume: 0.8 }
        gameEvents.on(EVENTS.PLAY_SFX, (payload) => {
            this.playSound(payload.id, payload.volume);
        });

        // Example of future-proofing: you could listen to game over to stop music
        gameEvents.on(EVENTS.PLAYER_DEAD, () => {
            // this.stopMusic();
            // this.playSound('explosion-huge', 1.0);
        });
    }

    // ============================================================================
    // 2. ASSET LOADING
    // ============================================================================

    /**
     * Loads an audio file gracefully without breaking the Promise chain.
     */
    async loadSound(key, path) {
        return new Promise((resolve) => {
            const audio = new Audio();

            audio.oncanplaythrough = () => {
                this.sounds[key] = audio;
                resolve(audio);
            };

            // If it fails, log a warning but RESOLVE anyway so the game boots
            audio.onerror = () => {
                console.warn(`[AudioManager] Missing or unreadable audio file: ${path}. Proceeding without it.`);
                resolve(null);
            };

            audio.src = path;
        });
    }

    // ============================================================================
    // 3. PLAYBACK CONTROL (MUSIC & SFX)
    // ============================================================================

    /**
     * Plays looping background music, handling browser autoplay restrictions.
     */
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

        // Handle browser autoplay restrictions safely
        const playPromise = this.currentMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("[AudioManager] Autoplay blocked. Waiting for user interaction to start music.");

                // Fallback: start music on the very first user click
                const startOnInteract = () => {
                    this.currentMusic.play();
                    document.removeEventListener('click', startOnInteract);
                };
                document.addEventListener('click', startOnInteract);
            });
        }
    }

    /**
     * Plays a one-shot sound effect. Clones the node to allow overlapping sounds.
     */
    playSound(key, volume = 1.0) {
        if (this.isMuted || !this.sounds[key]) return;

        // Clone the node so the same sound can overlap (e.g., rapid laser fire)
        const soundClone = this.sounds[key].cloneNode();
        soundClone.volume = volume;
        soundClone.play().catch(e => console.warn("[AudioManager] SFX play failed:", e));
    }

    // ============================================================================
    // 4. GLOBAL CONTROLS
    // ============================================================================

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