import { Vector3 } from "@babylonjs/core";

export function computeSceneCenter(metadataList) {
  let sum = new Vector3(0, 0, 0);
  let count = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    for (const s of meta.parsed) {
      sum.x += s.x;
      sum.y += s.y;
      sum.z += s.z;
      count++;
    }
  }

  if (count === 0) return null;
  return sum.scale(1 / count);
}

export function computeSceneRadius(metadataList, center) {
  let maxDistSq = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    for (const s of meta.parsed) {
      const dx = s.x - center.x;
      const dy = s.y - center.y;
      const dz = s.z - center.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > maxDistSq) maxDistSq = d2;
    }
  }

  return Math.sqrt(maxDistSq);
}
