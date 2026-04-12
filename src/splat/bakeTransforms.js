import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "./splatMerge.js";
import { recomputeBoundingBoxForParsed } from "./splatBounds.js";
import {
  bakeTranslateParsed,
  bakeScaleParsed,
  bakeRotateParsed,
  bakeRotateParsedQuat,
} from "../utils/bakeTransformUtils.js";
import { computeSceneBounds } from "../utils/computeSceneBounds.js";

export function bakeAllTransforms() {
  const bakeStart = performance.now();
  for (const meta of state.metadataList) {
    meta.hasUnbakedTransform = false;
    meta.undoStack.length = 0;
    meta.redoStack.length = 0;
    const T = meta.localTransform;

    const isIdentity =
      T.position.lengthSquared() === 0 &&
      T.scale.x === 1 &&
      T.scale.y === 1 &&
      T.scale.z === 1 &&
      T.rotation.equals(BABYLON.Quaternion.Identity());

    if (isIdentity) continue;

    bakeTranslateParsed(meta, T.position.x, T.position.y, T.position.z);

    if (T.scale.x !== 1) {
      bakeScaleParsed(meta, T.scale.x);
    }

    if (!T.rotation.equals(BABYLON.Quaternion.Identity())) {
      bakeRotateParsedQuat(meta, T.rotation);
    }

    // reset logical transform
    T.position.set(0, 0, 0);
    T.scale.set(1, 1, 1);
    T.rotation.copyFrom(BABYLON.Quaternion.Identity());

    recomputeBoundingBoxForParsed(meta);
  }

  // Recompute scene bounds after baking transforms
  state.sceneStats.bounds = computeSceneBounds(state.metadataList);

  // Rebuild merged data
  state.mergedBytes = buildMergedBytes(state.metadataList);

  // HARD RESET merged mesh
  if (state.mergedMesh) {
    state.mergedMesh.dispose();
  }

  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    state.scene
  );

  state.mergedMesh.updateData(state.mergedBytes.buffer);

  // Reset transforms
  state.mergedMesh.position.set(0, 0, 0);
  state.mergedMesh.rotationQuaternion = null;
  state.mergedMesh.rotation.set(0, 0, 0);

  state.mergedMesh.computeWorldMatrix(true);
  state.mergedMesh.refreshBoundingInfo(true);
  state.mergedMesh.freezeWorldMatrix();
  const bakeEnd = performance.now();

  state.performance.bakeTimes = state.performance.bakeTimes || [];
  state.performance.bakeTimes.push(bakeEnd - bakeStart);
}
