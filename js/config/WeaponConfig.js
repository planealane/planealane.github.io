/**
 * Single Responsibility: Defines the base parameters of weapons.
 */
export const WeaponConfig = {
    BASE: {
        PRIMARY: {
            damage: 10,
            cooldown: 1000, 
            projectileSpeed: 1,
            count: 1
        },
        SECONDARY: {
            damage: 5,
            cooldown: 10000,
            count: 3,
            projectileSpeed: 1,
            turnFactor: 0.008,
            staggerMs: 120
        },
        DRONE: {
            damage: 20,
            cooldown: 1000, // 2 tirs par seconde
            projectileSpeed: 1,
            count: 1
        },
    }
};