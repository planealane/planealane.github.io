// js/config/BossConfig.js

/**
 * Centralized configuration for boss stats and assets.
 * Decouples game balancing from the Spawner logic.
 */
export const BossConfig = {
    'miniboss': {
        assetKey: 'miniboss',
        baseHp: 600,
        scale: 2.0
    },
    'boss': {
        assetKey: 'boss',
        baseHp: 1500,
        scale: 3.0
    },
    'final_boss': {
        assetKey: 'finalboss', // Matches your loaded asset
        baseHp: 5000,
        scale: 4.0
    }
};

/**
 * Helper function to map encounter data to the correct boss configuration.
 */
export function getBossDef(encounterData) {
    if (encounterData.id === 'final_boss') return BossConfig['final_boss'];
    if (encounterData.type === 'MINIBOSS') return BossConfig['miniboss'];
    return BossConfig['boss']; // Default standard boss fallback
}