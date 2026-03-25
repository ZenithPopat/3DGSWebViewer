import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

export function refreshSelectionBox(meta) {
  if (state.selectedObject?.id !== meta.id) return;
  if (!state.selectionBox) return;

  const box = state.selectionBox;
  const { min, max } = meta.boundingBox;

  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  // HARD RESET
  box.position.set(0, 0, 0);
  box.scaling.set(1, 1, 1);
  box.rotationQuaternion ??= BABYLON.Quaternion.Identity();
  box.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());

  // Apply logical transform
  box.scaling.copyFrom(size);
  box.scaling.multiplyInPlace(meta.localTransform.scale);

  box.position.copyFrom(center);
  box.position.addInPlace(meta.localTransform.position);

  box.rotationQuaternion.copyFrom(meta.localTransform.rotation);
}
