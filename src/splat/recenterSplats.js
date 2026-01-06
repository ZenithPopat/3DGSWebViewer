import * as BABYLON from "@babylonjs/core";

export function recenterParsedSplats(parsedSplats) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  // 1️⃣ Compute bounds using px/py/pz
  for (const s of parsedSplats) {
    const x = s.px;
    const y = s.py;
    const z = s.pz;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);

    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  // 2️⃣ Shift splats so center becomes origin
  for (const s of parsedSplats) {
    s.px -= cx;
    s.py -= cy;
    s.pz -= cz;
  }

  return new BABYLON.Vector3(cx, cy, cz);
}
