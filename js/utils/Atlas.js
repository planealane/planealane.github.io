// js/Atlas.js

// Helper function to keep the props atlas DRY (Based on a 16x16 grid)
const getPropFrame = (col, row) => ({
    sx: col * 16,
    sy: row * 16,
    sWidth: 16,
    sHeight: 16
});

export const PropsAtlas = {
    // Array grouping all 8 projectiles for easy dynamic assignment later
    projectiles: [
        // Row 1 (y index 0)
        getPropFrame(0, 0),
        getPropFrame(1, 0),
        getPropFrame(2, 0),
        getPropFrame(3, 0),
        // Row 2 (y index 1)
        getPropFrame(0, 1),
        getPropFrame(1, 1),
        getPropFrame(2, 1),
        getPropFrame(3, 1)
    ],

    // Kept for backward compatibility with your current Projectile/HomingProjectile entities
    projectile: getPropFrame(0, 0),

    // Explosion animation frames (Row 1, columns 4 to 8)
    explosion: [
        getPropFrame(4, 0),
        getPropFrame(5, 0),
        getPropFrame(6, 0),
        getPropFrame(7, 0),
        getPropFrame(8, 0)
    ],

    // Row 3 (y index 2), 2nd sprite (x index 1)
    bonus: getPropFrame(1, 2),

    // Row 3 (y index 2), 4th sprite (x index 3)
    target_reticle: getPropFrame(3, 2)
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

// Based on a 32x32 grid inside a 96x96 image
export const ProgressAtlas = {
    // Centralized size property to avoid magic numbers
    SIZE: 32,

    // Row 1
    pipe: {
        empty: { sx: 0, sy: 0, sWidth: 32, sHeight: 32 },
        full: { sx: 32, sy: 0, sWidth: 32, sHeight: 32 }
    },

    // Row 1 & 2
    boss: {
        empty: { sx: 64, sy: 0, sWidth: 32, sHeight: 32 },
        full: { sx: 0, sy: 32, sWidth: 32, sHeight: 32 }
    },

    // Row 2 & 3
    header: {
        full: { sx: 64, sy: 32, sWidth: 32, sHeight: 32 },
        empty: { sx: 0, sy: 64, sWidth: 32, sHeight: 32 }
    },

    // Row 3
    footer: {
        full: { sx: 32, sy: 64, sWidth: 32, sHeight: 32 },
        empty: { sx: 64, sy: 64, sWidth: 32, sHeight: 32 }
    }
};
