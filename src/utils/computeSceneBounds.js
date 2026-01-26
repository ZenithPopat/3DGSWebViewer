import { Vector3 } from "@babylonjs/core";

export function computeSceneBounds(metadataList) {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);

  let hasValidBounds = false;

  for (const meta of metadataList) {
    const b = meta.boundingBox;
    if (!b || !b.min || !b.max) continue;

    // Ensure these are actually Vector3
    if (!(b.min instanceof Vector3) || !(b.max instanceof Vector3)) continue;

    min.x = Math.min(min.x, b.min.x);
    min.y = Math.min(min.y, b.min.y);
    min.z = Math.min(min.z, b.min.z);

    max.x = Math.max(max.x, b.max.x);
    max.y = Math.max(max.y, b.max.y);
    max.z = Math.max(max.z, b.max.z);

    hasValidBounds = true;
  }

  if (!hasValidBounds) return null;

  return { min, max };
}
