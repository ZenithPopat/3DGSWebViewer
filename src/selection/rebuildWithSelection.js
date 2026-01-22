import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "../splat/splatMerge.js";

export function rebuildMergedMeshFromData() {
  state.mergedBytes = buildMergedBytes(state.metadataList);

  if (state.mergedMesh) {
    state.mergedMesh.dispose();
  }

  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    state.scene,
  );

  state.mergedMesh.updateData(state.mergedBytes.buffer);
}
