// js/Physics.js

// ============================================================================
// CORE PHYSICS & COLLISION DETECTION
// ============================================================================

/**
 * Checks for standard AABB (Axis-Aligned Bounding Box) collision between two entities 
 * using their center coordinates (x, y).
 * * @param {Object} entityA - First entity (must have x, y, width, height)
 * @param {Object} entityB - Second entity
 * @param {number} hitboxTolerance - Scales the bounding box (e.g., 0.8 means 80% of original size)
 * @returns {boolean} True if intersecting
 */
export function checkAABB(entityA, entityB, hitboxTolerance = 0.8) {
    const halfWidthA = (entityA.width / 2) * hitboxTolerance;
    const halfHeightA = (entityA.height / 2) * hitboxTolerance;
    const halfWidthB = (entityB.width / 2) * hitboxTolerance;
    const halfHeightB = (entityB.height / 2) * hitboxTolerance;

    const distanceX = Math.abs(entityA.x - entityB.x);
    const distanceY = Math.abs(entityA.y - entityB.y);

    return distanceX < (halfWidthA + halfWidthB) && 
           distanceY < (halfHeightA + halfHeightB);
}

/**
 * Checks AABB collision but extends the hitbox of the second entity in a specific direction.
 * Highly useful for "forgiving" mechanics like picking up loot that is slightly above the player.
 * * @param {Object} entityA - The dynamic entity (e.g., Player)
 * @param {Object} entityB - The target entity (e.g., Collectible)
 * @param {number} extendTop - Amount of pixels to virtually extend entityB's top hitbox
 * @returns {boolean} True if intersecting within the extended bounds
 */
export function checkExtendedAABB(entityA, entityB, extendTop = 0) {
    // Standard boundaries for Entity A
    const aLeft = entityA.x - entityA.width / 2;
    const aRight = entityA.x + entityA.width / 2;
    const aTop = entityA.y - entityA.height / 2;
    const aBottom = entityA.y + entityA.height / 2;

    // Extended boundaries for Entity B
    const bLeft = entityB.x - entityB.width / 2;
    const bRight = entityB.x + entityB.width / 2;
    
    // Extend the top boundary (subtracting because Y goes down in Canvas)
    const bTop = (entityB.y - entityB.height / 2) - extendTop;
    const bBottom = entityB.y + entityB.height / 2;

    // Check overlap
    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}