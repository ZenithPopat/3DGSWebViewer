import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { selectObject } from "../splat/splatSelection.js";

export function focusCameraOn(meta) {
  const scene = state.scene;
  const camera = scene.activeCamera;

  if (!camera) return;

  // Convert bbox to Vector3
  const min = new BABYLON.Vector3(
    meta.boundingBox.min.x,
    meta.boundingBox.min.y,
    meta.boundingBox.min.z
  );

  const max = new BABYLON.Vector3(
    meta.boundingBox.max.x,
    meta.boundingBox.max.y,
    meta.boundingBox.max.z
  );

  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  // Compute framing radius
  const radius = size.length() * 1.4; // slightly larger for padding

  // Smooth animate radius
  BABYLON.Animation.CreateAndStartAnimation(
    "camRadius",
    camera,
    "radius",
    60, // FPS
    30, // frames
    camera.radius,
    radius,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  // Smooth animate camera target
  BABYLON.Animation.CreateAndStartAnimation(
    "camTarget",
    camera,
    "target",
    60,
    30,
    camera.target.clone(),
    center,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  // Delete previous box
  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  // Mark as selected
  state.selectedObject = meta;

  // Create fresh selection box
  selectObject(meta, scene);
}
