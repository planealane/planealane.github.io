// physics.js

/**
 * Checks for AABB collision between two entities with centered coordinates.
 * @param {Object} entityA 
 * @param {Object} entityB 
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