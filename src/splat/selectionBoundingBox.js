import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

export function showSelectionBoundingBox(meta) {
  const scene = state.scene;
  if (!scene || !meta.boundingBox) return;

  // Remove old box, if any
  hideSelectionBoundingBox();

  const { min, max } = meta.boundingBox;

  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  const box = BABYLON.MeshBuilder.CreateBox(
    "selectionBBox",
    {
      width: size.x,
      height: size.y,
      depth: size.z,
    },
    scene,
  );

  box.position.copyFrom(center);
  box.isPickable = false;

  const mat = new BABYLON.StandardMaterial("selectionBBoxMat", scene);
  mat.wireframe = true;
  mat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  mat.alpha = 0.6;

  box.material = mat;

  state.selectionBox = box;
}

export function hideSelectionBoundingBox() {
  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }
}
