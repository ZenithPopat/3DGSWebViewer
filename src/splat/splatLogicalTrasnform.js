// splat/logicalTransforms.js
import * as BABYLON from "@babylonjs/core";
import { refreshSelectionBox } from "./updateSelectionBox.js";

export function moveObject(meta, dx, dy, dz) {
  meta.localTransform.position.addInPlaceFromFloats(dx, dy, dz);
  refreshSelectionBox(meta);
}

export function scaleObject(meta, factor) {
  meta.localTransform.scale.scaleInPlace(factor);
  refreshSelectionBox(meta);
}

export function rotateObject(meta, axis, angleDeg) {
  const q = BABYLON.Quaternion.RotationAxis(
    axis,
    BABYLON.Tools.ToRadians(angleDeg),
  );
  meta.localTransform.rotation = q
    .multiply(meta.localTransform.rotation)
    .normalize();

  refreshSelectionBox(meta);
}
