// js/Atlas.js

// Based on a 16x16 pixel grid mapping
export const PropsAtlas = {
    // 1st element: sx = 0 * 16
    projectile: { sx: 0, sy: 0, sWidth: 16, sHeight: 16 }, 
    
    // Elements 5 to 9 (Indices 4 to 8)
    explosion: [
        { sx: 64,  sy: 0, sWidth: 16, sHeight: 16 }, // Frame 1
        { sx: 80,  sy: 0, sWidth: 16, sHeight: 16 }, // Frame 2
        { sx: 96,  sy: 0, sWidth: 16, sHeight: 16 }, // Frame 3
        { sx: 112, sy: 0, sWidth: 16, sHeight: 16 }, // Frame 4
        { sx: 128, sy: 0, sWidth: 16, sHeight: 16 }  // Frame 5
    ],

    bonus: { sx: 16, sy: 32, sWidth: 16, sHeight: 16 }
};

// Dynamic grid mapping for ships (4 columns, 6 rows)
export const ShipsAtlas = {
    PLAYER_VARIANTS: 12,
    ENEMY_VARIANTS: 12,
    
    // Helper function built into the atlas to get any ship frame
    getFrame: (index, imageWidth, imageHeight) => {
        const cols = 4;
        const rows = 6;
        const sw = imageWidth / cols;
        const sh = imageHeight / rows;
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        return { sx: col * sw, sy: row * sh, sWidth: sw, sHeight: sh };
    }
};