import * as BABYLON from "@babylonjs/core";
import { state } from "../src/state/state.js";

export function updateCameraClipPlane() {
  const scene = state.scene;
  const cam = scene?.activeCamera;
  if (!scene || !cam) return;

  scene.clipPlane = new BABYLON.Plane(0, 0, 1, 0);

  //   console.log("✂️ HARD clip plane active");
  //   const settings = state.renderSettings.dynamicCulling;
  //   if (!settings?.enabled) {
  //     scene.clipPlane = null;
  //     return;
  //   }

  //   const camPos = cam.position;
  //   const forward = cam.getForwardRay().direction.normalize();

  //   // Plane position = camera + forward * distance
  //   const planePoint = camPos.add(forward.scale(settings.maxDistance));

  //   // Plane normal = forward
  //   const plane = BABYLON.Plane.FromPositionAndNormal(
  //     planePoint,
  //     forward.negate(), // important: plane faces camera
  //   );

  //   scene.clipPlane = plane;
}
