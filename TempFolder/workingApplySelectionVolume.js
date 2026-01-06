import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "./rebuildWithSelection.js";

export function applySelectionVolume() {
  const tool = state.selectionTool;
  const mesh = tool.mesh;

  if (!mesh || !state.mergedMesh) return;

  // Inverse world matrix of the selection volume
  const invWorld = mesh.getWorldMatrix().clone().invert();

  const radius = tool.radius;
  const radiusSq = radius * radius;
  const boxSize = tool.boxSize; // half extents

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

      // splat world position
      const worldPos = new BABYLON.Vector3(s.px, s.py, s.pz);

      const localPos = BABYLON.Vector3.TransformCoordinates(worldPos, invWorld);

      let inside = false;

      if (tool.shape === "sphere") {
        inside = localPos.lengthSquared() <= 0.25;
      } else if (tool.shape === "box") {
        inside =
          Math.abs(localPos.x) <= 0.5 &&
          Math.abs(localPos.y) <= 0.5 &&
          Math.abs(localPos.z) <= 0.5;
      }

      if (inside) {
        state.selection.splatIndices.add(globalIndex);
      }

      // transform into selection volume local space
      // const localPos = BABYLON.Vector3.TransformCoordinates(worldPos, invWorld);

      // let inside = false;

      // 🔵 Sphere selection
      // const UNIT_RADIUS_SQ = 0.25; // (0.5)^2
      // const UNIT_EXTENT = 0.5;

      // if (tool.shape === "sphere") {
      //   inside = localPos.lengthSquared() <= UNIT_RADIUS_SQ;
      // } else if (tool.shape === "box") {
      //   inside =
      //     Math.abs(localPos.x) <= UNIT_EXTENT &&
      //     Math.abs(localPos.y) <= UNIT_EXTENT &&
      //     Math.abs(localPos.z) <= UNIT_EXTENT;
      // }

      // if (inside) {
      //   state.selection.splatIndices.add(globalIndex);
      // }

      globalIndex++;
    }
  }

  rebuildMergedMeshWithSelection();
}
