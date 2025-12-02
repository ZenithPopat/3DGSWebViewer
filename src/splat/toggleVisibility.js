import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "./splatMerge.js";
import { createSceneGraphUI } from "../scene/createUI.js";

export function toggleVisibility(meta) {
  const scene = state.scene;

  // Flip flag
  meta.visible = !meta.visible;

  // Rebuild merged bytes using only visible objects
  const visibleObjects = state.metadataList.filter((m) => m.visible);

  state.mergedBytes = buildMergedBytes(visibleObjects);

  // Rebuild merged mesh
  if (state.mergedMesh) state.mergedMesh.dispose();

  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    scene
  );

  try {
    state.mergedMesh.updateData(state.mergedBytes.buffer);
  } catch (err) {
    console.error("Error updating mesh on visibility toggle:", err);
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

  // Clear selection if hidden
  if (!meta.visible && state.selectedObject?.id === meta.id) {
    if (state.selectionBox) {
      state.selectionBox.dispose();
      state.selectionBox = null;
    }
    state.selectedObject = null;
  }

  // Refresh UI so button shows correct eye icon
  createSceneGraphUI();
}
