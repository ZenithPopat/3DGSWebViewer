import * as BABYLON from "@babylonjs/core";
window.BABYLON = BABYLON;

import { GridMaterial } from "@babylonjs/materials";
import "@babylonjs/core/Debug/debugLayer.js";
import "@babylonjs/inspector/dist/babylon.inspector.bundle.js";
import { state } from "../state/state.js";
import { createSceneGraphUI } from "./createUI.js";
// import { enableObjectPicking } from "./objectPicking.js";

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

  const camera = new BABYLON.ArcRotateCamera(
    "cam",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene,
  );
  // camera.attachControl();
  camera.attachControl(true);
  scene.activeCamera = camera;

  new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-1, -2, 1), scene);

  // scene.onPointerObservable.add((pointerInfo) => {
  //   if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;

  //   // Click on empty space → deselect
  //   const pick = scene.pick(scene.pointerX, scene.pointerY);

  //   if (!pick.hit) {
  //     // IMPORTANT: only deselect, do NOT select anything
  //     if (state.selectedObject) {
  //       state.selectedObject = null;

  //       if (state.selectionBox) {
  //         state.selectionBox.dispose();
  //         state.selectionBox = null;
  //       }

  //       state.onSelectionChanged?.(null);
  //     }
  //   }
  // });
  createSceneGraphUI();

  // scene.debugLayer.show();

  return { scene, engine };
}
