import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "./splatMerge.js";
import { createSceneGraphUI } from "../scene/createUI.js";

export function removeObject(meta) {
  const scene = state.scene;

  // 1. Remove from metadata list
  state.metadataList = state.metadataList.filter((m) => m.id !== meta.id);

  // 2. Clear selection if needed
  if (state.selectedObject?.id === meta.id) {
    state.selectedObject = null;

    if (state.selectionBox) {
      state.selectionBox.dispose();
      state.selectionBox = null;
    }
  }

  // 3. Rebuild merged splats from remaining objects
  state.mergedBytes = buildMergedBytes(state.metadataList);

  // 4. Rebuild merged mesh
  if (state.mergedMesh) {
    state.mergedMesh.dispose();
  }

  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    scene
  );

  try {
    state.mergedMesh.updateData(state.mergedBytes.buffer);
  } catch (err) {
    console.error("❌ mergedMesh.updateData failed while removing:", err);
    state.mergedMesh.dispose();
    state.mergedMesh = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      scene
    );
    state.mergedMesh.updateData(state.mergedBytes.buffer);
  }

  state.mergedMesh.computeWorldMatrix(true);
  state.mergedMesh.refreshBoundingInfo();

  // 5. Refresh UI
  createSceneGraphUI();
}
