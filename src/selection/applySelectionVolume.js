import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "./rebuildWithSelection.js";

export function applySelectionVolume() {
  const tool = state.selectionTool;
  const mesh = tool.mesh;

  if (!mesh || !state.mergedMesh) return;

  const radius = tool.radius;
  const radiusSq = radius * radius;
  const sphereWorld = mesh.getAbsolutePosition();

  state.selection.splatIndices.clear();

  let globalIndex = 0;

  for (const meta of state.metadataList) {
    // 🔒 Restrict selection to selected object if enabled
    if (
      state.selection.restrictToSelectedObject &&
      state.selectedObject &&
      meta.id !== state.selectedObject.id
    ) {
      globalIndex += meta.parsed.length;
      continue;
    }

    for (let i = 0; i < meta.parsed.length; i++) {
      const s = meta.parsed[i];

      const dx = s.px - sphereWorld.x;
      const dy = s.py - sphereWorld.y;
      const dz = s.pz - sphereWorld.z;

      if (dx * dx + dy * dy + dz * dz <= radiusSq) {
        state.selection.splatIndices.add(globalIndex);
      }

      globalIndex++;
    }
  }

  console.log(
    `Selected ${state.selection.splatIndices.size} splats` +
      (state.selection.restrictToSelectedObject ? " (restricted)" : "")
  );

  rebuildMergedMeshWithSelection();
}
