import * as BABYLON from "@babylonjs/core";
window.BABYLON = BABYLON;

import "@babylonjs/core/Debug/debugLayer.js";
import "@babylonjs/inspector/dist/babylon.inspector.bundle.js";
import { state } from "../state/state.js";
import { createSceneGraphUI } from "./createUI.js";

export async function createScene() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  state.scene = scene;

  const camera = new BABYLON.ArcRotateCamera(
    "cam",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl();
  scene.activeCamera = camera;

  new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-1, -2, 1), scene);

  createSceneGraphUI();

  // scene.debugLayer.show();

  return { scene, engine };
}
