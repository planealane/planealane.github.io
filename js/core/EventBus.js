// js/EventBus.js

export class EventBus {
    
    // ============================================================================
    // 1. INITIALIZATION
    // ============================================================================
    
    constructor() {
        // Stores arrays of callback functions mapped to event names
        this.listeners = {};
    }

    // ============================================================================
    // 2. SUBSCRIPTION MANAGEMENT
    // ============================================================================

    /**
     * Subscribe to a specific event.
     * @param {string} eventName - The identifier of the event
     * @param {Function} callback - The function to execute when the event fires
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * Unsubscribe from a specific event.
     * @param {string} eventName 
     * @param {Function} callback - The exact function reference used in 'on()'
     */
    off(eventName, callback) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }

    // ============================================================================
    // 3. EVENT EMISSION
    // ============================================================================

    /**
     * Broadcast an event to all subscribers.
     * @param {string} eventName 
     * @param {Object} [payload] - Optional data passed to the callbacks (e.g., coordinates)
     */
    emit(eventName, payload) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach(callback => callback(payload));
    }
}

// Export a singleton instance. 
// The entire game will import this single constant to communicate.
export const gameEvents = new EventBus();

// ============================================================================
// 4. EVENT DICTIONARY
// ============================================================================
// Constants to prevent silent failures from typos when emitting/listening

export const EVENTS = {
    PLAYER_HIT: 'PLAYER_HIT',
    PLAYER_DEAD: 'PLAYER_DEAD',
    ENEMY_DESTROYED: 'ENEMY_DESTROYED',
    PLAY_SFX: 'PLAY_SFX',
    SCORE_UPDATED: 'SCORE_UPDATED',
    SUPER_LOOT_PICKUP: 'SUPER_LOOT_PICKUP',
    HIT_STOP: 'HIT_STOP',
    SCREEN_FADE: 'SCREEN_FADE'
};