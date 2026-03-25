import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "../splat/splatMerge.js";

export function rebuildMergedMeshFromData() {
  state.mergedBytes = buildMergedBytes(state.metadataList);

  let total = 0;
  for (const meta of state.metadataList) {
    total += meta.parsed.length;
  }
  state.stats.totalSplats = total;

  state.stats.visibleSplats = state.mergeMap.length;

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
