import {
  quatMultiply,
  quatNormalize,
  axisAngleToQuat,
} from "../core/quatMath.js";

export function bakeTranslateParsed(meta, dx, dy, dz) {
  for (const s of meta.parsed) {
    s.px += dx;
    s.py += dy;
    s.pz += dz;
  }
}

export function bakeRotateParsedQuat(meta, rotationQuat) {
  // 1️⃣ Compute centroid (pivot)
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const s of meta.parsed) {
    cx += s.px;
    cy += s.py;
    cz += s.pz;
  }
  cx /= meta.splatCount;
  cy /= meta.splatCount;
  cz /= meta.splatCount;

  // 2️⃣ Build rotation matrix ONCE
  const rotMat = new BABYLON.Matrix();
  rotationQuat.toRotationMatrix(rotMat);

  // 3️⃣ Rotate positions + orientations
  for (const s of meta.parsed) {
    // --- rotate position around centroid ---
    const localPos = new BABYLON.Vector3(s.px - cx, s.py - cy, s.pz - cz);

    const rotated = BABYLON.Vector3.TransformCoordinates(localPos, rotMat);

    s.px = cx + rotated.x;
    s.py = cy + rotated.y;
    s.pz = cz + rotated.z;

    // --- rotate splat orientation ---
    const sq = new BABYLON.Quaternion(s.q1, s.q2, s.q3, s.q0);
    const out = rotationQuat.multiply(sq).normalize();

    s.q0 = out.w;
    s.q1 = out.x;
    s.q2 = out.y;
    s.q3 = out.z;
  }
}

export function bakeScaleParsed(meta, factor) {
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const s of meta.parsed) {
    cx += s.px;
    cy += s.py;
    cz += s.pz;
  }
  cx /= meta.splatCount;
  cy /= meta.splatCount;
  cz /= meta.splatCount;

  for (const s of meta.parsed) {
    s.px = cx + (s.px - cx) * factor;
    s.py = cy + (s.py - cy) * factor;
    s.pz = cz + (s.pz - cz) * factor;

    s.sx *= factor;
    s.sy *= factor;
    s.sz *= factor;
  }
}

export function bakeRotateParsed(meta, axis, angleDeg) {
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const s of meta.parsed) {
    cx += s.px;
    cy += s.py;
    cz += s.pz;
  }
  cx /= meta.splatCount;
  cy /= meta.splatCount;
  cz /= meta.splatCount;

  const qRot = axisAngleToQuat(axis, angleDeg);
  const qInv = [qRot[0], -qRot[1], -qRot[2], -qRot[3]];

  for (const s of meta.parsed) {
    const local = [0, s.px - cx, s.py - cy, s.pz - cz];
    const q1 = quatMultiply(qRot, local);
    const res = quatMultiply(q1, qInv);

    s.px = cx + res[1];
    s.py = cy + res[2];
    s.pz = cz + res[3];

    let q = quatMultiply(qRot, [s.q0, s.q1, s.q2, s.q3]);
    q = quatNormalize(q);
    [s.q0, s.q1, s.q2, s.q3] = q;
  }
}
