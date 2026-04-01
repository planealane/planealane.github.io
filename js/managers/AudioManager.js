// js/AudioManager.js
import { gameEvents, EVENTS } from '../core/EventBus.js';

export class AudioManager {

    // ============================================================================
    // 1. INITIALIZATION & SUBSCRIPTIONS
    // ============================================================================

    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        
        // [NOUVEAU] Volumes globaux par défaut (50%)
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;
        
        // [NOUVEAU] On garde en mémoire le volume de base de la piste actuelle
        this.currentTrackBaseVolume = 1.0;

        this.initListeners();
    }

    initListeners() {
        gameEvents.on(EVENTS.PLAY_SFX, (payload) => {
            this.playSound(payload.id, payload.volume);
        });

        gameEvents.on(EVENTS.PLAYER_DEAD, () => {
            // this.stopMusic();
        });
    }

    // ============================================================================
    // 2. ASSET LOADING
    // ============================================================================

    async loadSound(key, path) {
        return new Promise((resolve) => {
            const audio = new Audio();

            audio.oncanplaythrough = () => {
                this.sounds[key] = audio;
                resolve(audio);
            };

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

    playMusic(key, targetVolume = 0.5, fadeDuration = 1000) {
        if (!this.sounds[key]) return;

        const newMusic = this.sounds[key];

        if (this.currentMusic === newMusic) return;

        const oldMusic = this.currentMusic;
        this.currentMusic = newMusic;
        this.currentTrackBaseVolume = targetVolume;

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

        // Le volume cible final est le volume de la piste multiplié par le volume global
        const finalTargetVolume = this.currentTrackBaseVolume * this.musicVolume;
        this.crossfade(oldMusic, newMusic, finalTargetVolume, fadeDuration);
    }

    crossfade(oldMusic, newMusic, targetVolume, duration) {
        const steps = 20; 
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;

        let currentStep = 0;

        if (this.fadeInterval) clearInterval(this.fadeInterval);

        this.fadeInterval = setInterval(() => {
            currentStep++;

            // Fade in
            if (newMusic.volume + volumeStep <= targetVolume) {
                newMusic.volume += volumeStep;
            }

            // Fade out
            if (oldMusic) {
                if (oldMusic.volume - (oldMusic.volume / (steps - currentStep + 1)) >= 0) {
                    oldMusic.volume -= (oldMusic.volume / (steps - currentStep + 1));
                } else {
                    oldMusic.volume = 0;
                }
            }

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

    playSound(key, volume = 1.0) {
        if (!this.sounds[key] || this.sfxVolume <= 0) return;

        const soundClone = this.sounds[key].cloneNode();
        // [MODIFIÉ] On applique le volume global des SFX
        soundClone.volume = Math.max(0, Math.min(1, volume * this.sfxVolume));
        soundClone.play().catch(e => console.warn("[AudioManager] SFX play failed:", e));
    }

    // ============================================================================
    // 4. GLOBAL CONTROLS (Utilisés par le Menu Settings)
    // ============================================================================

    setMusicVolume(vol) {
        // Clamp entre 0 et 1
        this.musicVolume = Math.max(0, Math.min(1, vol));
        
        // Met à jour la musique en cours de lecture en temps réel
        if (this.currentMusic) {
            this.currentMusic.volume = this.currentTrackBaseVolume * this.musicVolume;
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        // Petit feedback audio quand on change le son !
        if (vol > 0) this.playSound('game_start', 0.5); 
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
    }
}