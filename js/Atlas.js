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
    ]
};