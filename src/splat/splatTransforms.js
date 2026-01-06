import { state } from "../state/state.js";
// import { commitMetaToMergedBytes } from "./splatMerge.js";
import { recomputeBoundingBoxForParsed } from "./splatBounds.js";
import {
  quatMultiply,
  quatNormalize,
  axisAngleToQuat,
} from "../core/quatMath.js";
import { refreshSelectionBox } from "./updateSelectionBox.js";
import { rebuildMergedMeshWithSelection } from "../selection/rebuildWithSelection.js";

function safeUpdateMesh() {
  try {
    state.mergedMesh.updateData(state.mergedBytes.buffer);
  } catch (err) {
    state.mergedMesh.dispose();
    state.mergedMesh = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      state.scene
    );
    state.mergedMesh.updateData(state.mergedBytes.buffer);
  }
}

export function translateObject(meta, dx, dy, dz) {
  for (const s of meta.parsed) {
    s.px += dx;
    s.py += dy;
    s.pz += dz;
  }

  rebuildMergedMeshWithSelection();

  recomputeBoundingBoxForParsed(meta);
  refreshSelectionBox(meta);
}

export function scaleObjectPerSplat(meta, factor) {
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

  rebuildMergedMeshWithSelection();

  recomputeBoundingBoxForParsed(meta);
  refreshSelectionBox(meta);
}

export function rotateObjectPerSplat(meta, axis, angleDeg) {
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

    let newQ = quatMultiply(qRot, [s.q0, s.q1, s.q2, s.q3]);
    newQ = quatNormalize(newQ);

    [s.q0, s.q1, s.q2, s.q3] = newQ;
  }

  rebuildMergedMeshWithSelection();

  recomputeBoundingBoxForParsed(meta);
  refreshSelectionBox(meta);
}
