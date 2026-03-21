// js/utils/CloudAtlas.js

/**
 * Atlas definitions for 'clouds.png'.
 * Maps frame names to their precise source coordinates and dimensions.
 */
export const CloudAtlas = {
    // Array of cloud frame definitions mapped from the provided sprite sheet
    frames: [
        // Cloud 1 (Top-Left)
        { sx: 76,  sy: 68,  sWidth: 156, sHeight: 62 }, 
        
        // Cloud 2 (Top-Right)
        { sx: 382, sy: 49,  sWidth: 159, sHeight: 98 }, 
        
        // Cloud 3 (Center)
        { sx: 239, sy: 164, sWidth: 120, sHeight: 72 }, 
        
        // Cloud 4 (Bottom-Left)
        { sx: 73,  sy: 260, sWidth: 80,  sHeight: 38 },
        
        // Cloud 5 (Bottom-Middle)
        { sx: 241, sy: 273, sWidth: 117, sHeight: 22 },

        // Cloud 6 (Bottom-Right)
        { sx: 470, sy: 259, sWidth: 92,  sHeight: 29 }
    ],

    /**
     * Helper to get a random cloud frame definition.
     * @returns {Object} A random frame object { sx, sy, sWidth, sHeight }
     */
    getRandomFrame() {
        return this.frames[Math.floor(Math.random() * this.frames.length)];
    }
};