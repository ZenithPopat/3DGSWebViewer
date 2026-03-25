import * as BABYLON from "@babylonjs/core";
import { refreshSelectionBox } from "./updateSelectionBox.js";
import { createSceneGraphUI } from "../scene/createUI.js";
import { pushUndoState } from "../utils/undoRedoUtils.js";

export function moveObject(meta, dx, dy, dz) {
  pushUndoState(meta);
  meta.hasUnbakedTransform = true;
  createSceneGraphUI();
  meta.localTransform.position.addInPlaceFromFloats(dx, dy, dz);
  refreshSelectionBox(meta);
}

export function scaleObject(meta, factor) {
  pushUndoState(meta);
  meta.hasUnbakedTransform = true;
  createSceneGraphUI();
  meta.localTransform.scale.scaleInPlace(factor);
  refreshSelectionBox(meta);
}

export function rotateObject(meta, axis, angleDeg) {
  pushUndoState(meta);
  meta.hasUnbakedTransform = true;
  createSceneGraphUI();
  const q = BABYLON.Quaternion.RotationAxis(
    axis,
    BABYLON.Tools.ToRadians(angleDeg),
  );
  meta.localTransform.rotation = q
    .multiply(meta.localTransform.rotation)
    .normalize();

  refreshSelectionBox(meta);
}
