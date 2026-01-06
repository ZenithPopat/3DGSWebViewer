import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "../selection/rebuildWithSelection.js";

export function selectObject(meta, scene) {
  state.selectedObject = meta;
  rebuildMergedMeshWithSelection();

  state.onSelectionChanged?.(meta);

  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  const { min, max } = meta.boundingBox;
  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  state.selectionBox = BABYLON.MeshBuilder.CreateBox(
    "selBox",
    {
      width: size.x,
      height: size.y,
      depth: size.z,
    },
    scene
  );

  state.selectionBox.position.copyFrom(center);

  const mat = new BABYLON.StandardMaterial("selMat", scene);
  mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  mat.wireframe = true;

  state.selectionBox.material = mat;

  // scene.activeCamera?.setTarget(center);
}

export function deselectObject() {
  if (!state.selectedObject) return;

  state.selectedObject = null;

  state.onSelectionChanged?.(null);

  // Remove bounding box if present
  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  // Update visuals (remove object highlight)
  rebuildMergedMeshWithSelection();
}
