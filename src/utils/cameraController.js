import { state } from "../state/state.js";

export function switchCamera(mode) {
  const scene = state.scene;
  if (!scene || !scene.activeCamera) return;

  const orbitCam = state.cameras.orbit;
  const flyCam = state.cameras.fly;

  if (!orbitCam || !flyCam) return;

  const canvas = scene.getEngine().getRenderingCanvas();
  const active = scene.activeCamera;

  // ----------- SWITCH TO FLY -----------
  if (mode === "fly" && state.camera.mode !== "fly") {
    flyCam.position.copyFrom(active.position);

    const forward = active.getForwardRay().direction;
    flyCam.setTarget(flyCam.position.add(forward));

    active.detachControl();
    flyCam.attachControl(canvas, true);

    scene.activeCamera = flyCam;
    state.camera.mode = "fly";
    return;
  }

  // ----------- SWITCH TO ORBIT ----------
  if (mode === "orbit" && state.camera.mode !== "orbit") {
    orbitCam.setPosition(active.position.clone());

    const forward = active.getForwardRay().direction;
    orbitCam.setTarget(active.position.add(forward));

    active.detachControl();
    orbitCam.attachControl(canvas, true);

    scene.activeCamera = orbitCam;
    state.camera.mode = "orbit";
  }
}
