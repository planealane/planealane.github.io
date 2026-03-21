// js/Effects.js

export const BonusEffects = {
    DAMAGE: {
        color: '#e74c3c', // Red for damage
        text: 'DMG',
        apply: (player, value) => {
            player.stats.damage += value;
        }
    },
    FIRE_RATE: {
        color: '#2ecc71', // Green for fire rate
        text: 'RATE',
        apply: (player, value) => {
            // Cap minimum interval to 100ms
            player.stats.shootInterval = Math.max(100, player.stats.shootInterval - value);
        }
    }
};                                          