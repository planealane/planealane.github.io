// js/states/State.js

/**
 * Abstract base class for all game states.
 * Enforces the contract (interface) that the GameManager expects.
 */
export class State {
    constructor(gameManager) {
        this.gameManager = gameManager;
    }

    /**
     * Called once when the state becomes active.
     * Ideal for initializing UI elements or resetting timers.
     */
    enter() {}

    /**
     * Called every frame to process logic and physics.
     * @param {number} dt - Delta time
     * @param {Object} pointer - Input manager pointer state {x, y, isDown}
     */
    update(dt, pointer) {}

    /**
     * Called every frame to render the state.
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {}

    /**
     * Called once when transitioning to another state.
     * Ideal for cleanup (removing event listeners, stopping specific sounds).
     */
    exit() {}
}