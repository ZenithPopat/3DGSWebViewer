import * as BABYLON from "@babylonjs/core";
window.BABYLON = BABYLON;

import { GridMaterial } from "@babylonjs/materials";
import "@babylonjs/core/Debug/debugLayer.js";
import "@babylonjs/inspector/dist/babylon.inspector.bundle.js";
import { state } from "../state/state.js";
import { createSceneGraphUI } from "./createUI.js";

export async function createScene() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  state.scene = scene;

  const ground = BABYLON.MeshBuilder.CreateGround(
    "editorGrid",
    { width: 2000, height: 2000 },
    scene,
  );

  const gridMat = new GridMaterial("gridMat", scene);
  gridMat.majorUnitFrequency = 5;
  gridMat.minorUnitVisibility = 0.4;
  gridMat.gridRatio = 1;
  gridMat.backFaceCulling = false;
  gridMat.opacity = 0.8;

  ground.material = gridMat;
  ground.isPickable = false;
  ground.position.y = -0.001;

  ground.setEnabled(false);

  state.editorGrid = ground;

  const orbitCam = new BABYLON.ArcRotateCamera(
    "orbitCam",
    Math.PI / 2,
    Math.PI / 3,
    10,
    BABYLON.Vector3.Zero(),
    scene,
  );

  // Prevent inversion
  orbitCam.lowerRadiusLimit = 1.0;
  orbitCam.lowerBetaLimit = 0.01;
  orbitCam.upperBetaLimit = Math.PI * 0.99;
  orbitCam.attachControl(canvas, true);

  const flyCam = new BABYLON.UniversalCamera(
    "flyCam",
    new BABYLON.Vector3(0, 0, -10),
    scene,
  );

  flyCam.speed = 0.3;
  flyCam.angularSensibility = 3000;
  flyCam.detachControl(); // start disabled

  flyCam.speed = 0.5;
  flyCam.angularSensibility = 4000;
  flyCam.inertia = 0.7;
  flyCam.minZ = 0.01;

  flyCam.keysUpward = [33]; // PageUp
  flyCam.keysDownward = [34]; // PageDown

  scene.onKeyboardObservable.add((kbInfo) => {
    if (state.camera.mode !== "fly") return;

    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      if (kbInfo.event.key === "Shift") {
        flyCam.speed = 1.5;
      }
    }

    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
      if (kbInfo.event.key === "Shift") {
        flyCam.speed = 0.5;
      }
    }
  });

  state.cameras.orbit = orbitCam;
  state.cameras.fly = flyCam;
  scene.activeCamera = orbitCam;

  new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-1, -2, 1), scene);

  createSceneGraphUI();

  return { scene, engine };
}
