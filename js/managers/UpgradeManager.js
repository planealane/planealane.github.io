// js/managers/UpgradeManager.js
import { WeaponConfig } from '../config/WeaponConfig.js';

export class UpgradeManager {
    /**
     * Applies a specific upgrade to the target entity (player).
     * @param {Object} player - The player entity
     * @param {string} upgradeType - The upgrade key (e.g., 'PRIMARY_DAMAGE')
     * @param {number} tierIndex - The bonus level (0 to 2)
     */
    static apply(player, upgradeType, tierIndex = 0) {
        // 1. Validate the upgrade exists in the config
        if (!WeaponConfig.UPGRADES[upgradeType]) {
            console.warn(`[UpgradeManager] Unknown or deprecated upgrade type: ${upgradeType}`);
            return;
        }

        // 2. Validate the application logic exists
        if (!WeaponConfig.LOGIC[upgradeType]) {
             console.warn(`[UpgradeManager] Missing application logic for: ${upgradeType}`);
             return;
        }

        // 3. Extract the value and apply via the centralized logic
        const value = WeaponConfig.UPGRADES[upgradeType][tierIndex];
        
        // Debug
        // console.log(`[Upgrade] Applying ${upgradeType} (Tier ${tierIndex}) : value = ${value}`);

        WeaponConfig.LOGIC[upgradeType](player, value);
    }
}