import * as BABYLON from "@babylonjs/core";
import { state } from "../src/state/state.js";

export function updateCameraClipPlane() {
  const scene = state.scene;
  const cam = scene?.activeCamera;
  if (!scene || !cam) return;

  scene.clipPlane = new BABYLON.Plane(0, 0, 1, 0);
}
