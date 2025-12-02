import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

export function selectObject(meta, scene) {
  state.selectedObject = meta;

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
