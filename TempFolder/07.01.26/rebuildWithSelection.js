import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "../splat/splatMerge.js";

export function rebuildMergedMeshWithSelection() {
  const mergedBytes = buildMergedBytes(state.metadataList);

  if (state.mergedMesh) {
    state.mergedMesh.dispose();
  }

  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    state.scene
  );

  state.mergedMesh.updateData(mergedBytes.buffer);
}
