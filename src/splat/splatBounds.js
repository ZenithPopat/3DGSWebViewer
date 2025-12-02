import * as BABYLON from "@babylonjs/core";

export function recomputeBoundingBoxForParsed(meta) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (const s of meta.parsed) {
    if (s.px < minX) minX = s.px;
    if (s.py < minY) minY = s.py;
    if (s.pz < minZ) minZ = s.pz;

    if (s.px > maxX) maxX = s.px;
    if (s.py > maxY) maxY = s.py;
    if (s.pz > maxZ) maxZ = s.pz;
  }

  meta.boundingBox = {
    min: new BABYLON.Vector3(minX, minY, minZ),
    max: new BABYLON.Vector3(maxX, maxY, maxZ),
  };
}
