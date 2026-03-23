// js/managers/UpgradeManager.js
import { GameConfig } from '../GameConfig.js';
import { PrimaryWeapon } from '../weapons/PrimaryWeapon.js';
import { SecondaryWeapon } from '../weapons/SecondaryWeapon.js';

export class UpgradeManager {
    /**
     * Applique une amélioration spécifique à l'entité cible (le joueur).
     * @param {Object} player - L'entité joueur
     * @param {string} upgradeType - La clé de l'amélioration (ex: 'PRIMARY_DAMAGE')
     * @param {number} tierIndex - Le niveau du bonus (0 à 2)
     */
    static apply(player, upgradeType, tierIndex = 0) {
        // Fallback sécurisé : si la clé n'existe pas, on log et on annule
        if (!GameConfig.UPGRADES[upgradeType]) {
            console.warn(`[UpgradeManager] Type d'amélioration inconnu ou obsolète : ${upgradeType}`);
            return;
        }

        const value = GameConfig.UPGRADES[upgradeType][tierIndex];
        console.log(`[Upgrade] Application de ${upgradeType} (Tier ${tierIndex}) : valeur = ${value}`);

        switch (upgradeType) {
            case 'HULL_REPAIR':
                player.stats.hp += value; 
                break;
            
            case 'PRIMARY_DAMAGE':
                player.getWeapon(PrimaryWeapon).stats.damage += value;
                break;
                
            case 'PRIMARY_FIRE_RATE':
                const primary = player.getWeapon(PrimaryWeapon);
                // On s'assure que le cooldown ne tombe jamais à 0 (cap à 50ms)
                primary.stats.cooldown = Math.max(50, primary.stats.cooldown - value);
                break;
                
            case 'PRIMARY_BULLET_SPEED':
                player.getWeapon(PrimaryWeapon).stats.projectileSpeed += value;
                break;

            case 'SECONDARY_DAMAGE':
                player.getWeapon(SecondaryWeapon).stats.damage += value;
                break;
                
            case 'SECONDARY_COUNT':
                player.getWeapon(SecondaryWeapon).stats.count += value;
                break;
                
            case 'SECONDARY_COOLDOWN':
                const secondary = player.getWeapon(SecondaryWeapon);
                // Réduction en pourcentage du cooldown actuel
                secondary.stats.cooldown = secondary.stats.cooldown * (1 - value);
                break;
                
            default:
                console.warn(`[UpgradeManager] Aucun comportement défini pour ${upgradeType}`);
        }
    }
}