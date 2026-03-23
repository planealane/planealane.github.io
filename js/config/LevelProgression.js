// js/config/LevelProgression.js

export const ProgressionConfig = {
    WAVES_BEFORE_GATE: 1 
};

/**
 * Defines at which block index a specific encounter triggers.
 */
export const LevelProgression = [
    { blockIndex: 3,  type: 'TUTORIAL', id: 'tutorial_boss' },
    { blockIndex: 6,  type: 'MINIBOSS', id: 'miniboss_1' },
    { blockIndex: 9,  type: 'MINIBOSS', id: 'miniboss_2' },
    { blockIndex: 12, type: 'BOSS', id: 'boss_tier_1' },
    { blockIndex: 15, type: 'MINIBOSS', id: 'miniboss_3' },
    { blockIndex: 18, type: 'MINIBOSS', id: 'miniboss_4' },
    { blockIndex: 21, type: 'BOSS', id: 'boss_tier_2' },
    { blockIndex: 24, type: 'MINIBOSS', id: 'miniboss_5' },
    { blockIndex: 27, type: 'MINIBOSS', id: 'miniboss_6' },
    { blockIndex: 30, type: 'BOSS', id: 'boss_tier_3' },
    { blockIndex: 33, type: 'MINIBOSS', id: 'miniboss_7' },
    { blockIndex: 36, type: 'MINIBOSS', id: 'miniboss_8' },
    { blockIndex: 39, type: 'BOSS', id: 'final_boss' }
];