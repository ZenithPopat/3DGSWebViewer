import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

export function refreshSelectionBox(meta) {
  if (state.selectedObject?.id !== meta.id) return;
  if (!state.selectionBox) return;

  const box = state.selectionBox;
  const { min, max } = meta.boundingBox;

  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  // HARD RESET (every time)
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

// import { selectObject } from "./splatSelection.js";

// export function refreshSelectionBox(meta) {
//   if (state.selectedObject?.id !== meta.id) return;

//   // Delete old selection mesh
//   if (state.selectionBox) {
//     state.selectionBox.dispose();
//     state.selectionBox = null;
//   }

//   // Recreate selection box with updated bounding box
//   selectObject(meta, state.scene);
// }

// export function refreshSelectionBox(meta) {
//   if (state.selectedObject?.id !== meta.id) return;
//   if (!state.selectionBox) return;

//   const box = state.selectionBox;

//   const { min, max } = meta.boundingBox;

//   // base size & center in object-local space
//   const size = max.subtract(min);
//   const center = min.add(size.scale(0.5));

//   // reset first (important!)
//   box.rotationQuaternion ??= BABYLON.Quaternion.Identity();
//   box.scaling.set(1, 1, 1);

//   // apply local transform
//   box.position.copyFrom(center);
//   box.position.addInPlace(meta.localTransform.position);

//   box.rotationQuaternion.copyFrom(meta.localTransform.rotation);

//   box.scaling.copyFrom(size);
//   box.scaling.multiplyInPlace(meta.localTransform.scale);
// }
