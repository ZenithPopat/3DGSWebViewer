import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { refreshSelectionBox } from "./updateSelectionBox.js";
// import { rebuildMergedMeshWithSelection } from "../selection/rebuildWithSelection.js";

export function selectObject(meta, scene) {
  state.selectedObject = meta;
  state.onSelectionChanged?.(meta);

  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  const { min, max } = meta.boundingBox;
  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  // state.selectionBox = BABYLON.MeshBuilder.CreateBox(
  //   "selBox",
  //   {
  //     width: size.x,
  //     height: size.y,
  //     depth: size.z,
  //   },
  //   scene,
  // );

  state.selectionBox = BABYLON.MeshBuilder.CreateBox(
    "selBox",
    { size: 1 },
    scene,
  );

  state.selectionBox.position.copyFrom(center);
  state.selectionBox.rotationQuaternion = BABYLON.Quaternion.Identity();

  const mat = new BABYLON.StandardMaterial("selMat", scene);
  mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  mat.wireframe = true;
  mat.disableLighting = true;

  state.selectionBox.material = mat;

  // Apply logical transform
  refreshSelectionBox(meta);
}

export function deselectObject() {
  state.selectedObject = null;
  state.onSelectionChanged?.(null);

  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }
}
