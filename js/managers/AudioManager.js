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

// ============================================================================
    // 3. PLAYBACK CONTROL (MUSIC & SFX)
    // ============================================================================

    /**
     * Plays looping background music with an optional crossfade.
     * Handles browser autoplay restrictions gracefully.
     */
    playMusic(key, targetVolume = 0.5, fadeDuration = 1000) {
        if (this.isMuted || !this.sounds[key]) return;

        const newMusic = this.sounds[key];

        // Prevent restarting the track if it's already playing
        if (this.currentMusic === newMusic) return;

        const oldMusic = this.currentMusic;
        this.currentMusic = newMusic;

        // Initialize new music at volume 0 for fade-in
        newMusic.loop = true;
        newMusic.volume = 0;

        const playPromise = newMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("[AudioManager] Autoplay blocked. Waiting for interaction.");
                const startOnInteract = () => {
                    this.currentMusic.play();
                    document.removeEventListener('click', startOnInteract);
                };
                document.addEventListener('click', startOnInteract);
            });
        }

        // Crossfade logic
        this.crossfade(oldMusic, newMusic, targetVolume, fadeDuration);
    }

    /**
     * Executes the volume transition smoothly.
     */
    crossfade(oldMusic, newMusic, targetVolume, duration) {
        const steps = 20; // Number of volume updates
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;

        let currentStep = 0;

        // Clear any existing fade interval to prevent erratic volume jumping
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        this.fadeInterval = setInterval(() => {
            currentStep++;

            // Fade in new music
            if (newMusic.volume + volumeStep <= targetVolume) {
                newMusic.volume += volumeStep;
            }

            // Fade out old music
            if (oldMusic) {
                if (oldMusic.volume - volumeStep >= 0) {
                    oldMusic.volume -= volumeStep;
                } else {
                    oldMusic.volume = 0;
                }
            }

            // Cleanup when transition completes
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                newMusic.volume = targetVolume;
                
                if (oldMusic) {
                    oldMusic.pause();
                    oldMusic.currentTime = 0;
                }
            }
        }, stepTime);
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