import * as BABYLON from "@babylonjs/core";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
registerBuiltInLoaders();

function modifyMesh(gs) {
  const arrayBuffer = gs.splatsData;
  var positions = new Float32Array(arrayBuffer);
  for (let i = 0; i < 10000; i++) {
    positions[i * 8 + 1] -= 2.0;
  }
  gs.updateData(arrayBuffer);
}

const createScene = async function () {
  const scene = new BABYLON.Scene(engine);

  // scene.createDefaultCameraOrLight(true, false, true);

  const arcCamera = new BABYLON.ArcRotateCamera(
    "arcCamera",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );

  //Allowing user input
  // camera.attachControl();
  arcCamera.attachControl();

  const light = new BABYLON.DirectionalLight(
    "directionalLight",
    new BABYLON.Vector3(-2, -3, 0),
    scene
  );

  //SplatFiles
  const splatFiles = [
    "../tree_bench/splats/001_3DGS.splat",
    "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/StMartinsPlatz_noSH.ply",
    // "../tree_bench/splats/StMartinsPlatz3DGS.splat",
  ];

  // const gs1 = new BABYLON.GaussianSplattingMesh(
  //     "treeSplat",
  //     "../tree_bench/splats/001_3DGS.splat",
  //     scene,
  //     true
  //   );

  const meshes = await Promise.all(
    splatFiles.map((file, i) =>
      BABYLON.ImportMeshAsync(file, scene).then((result) => {
        const mesh = result.meshes[0];
        mesh.name = "splat_" + i;
        // modifyMesh(mesh);
        // All meshes into group
        // mesh.renderingGroupId = 1;
        return mesh;
      })
    )
  ).then((meshes) => {
    console.log("All meshes loaded: ", meshes);
    // console.log("Splats:", meshes[0]);
  });

  // scene.onReadyObservable.add(() => {
  //   modifyMesh(meshes[0]);
  // });

  scene.debugLayer.show();
  return scene;
};

const scene = await createScene();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

//-------------------------------------------------------
// import * as BABYLON from "@babylonjs/core";
// import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
// import * as GUI from "@babylonjs/gui";
// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

// const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true);
// registerBuiltInLoaders();
// const createScene = async function () {
//   const scene = new BABYLON.Scene(engine);

//   // scene.createDefaultCameraOrLight(true, false, true);

//   const arcCamera = new BABYLON.ArcRotateCamera(
//     "arcCamera",
//     0,
//     0,
//     10,
//     new BABYLON.Vector3(0, 0, 0),
//     scene
//   );

//   //Allowing user input
//   // camera.attachControl();
//   arcCamera.attachControl();

//   const light = new BABYLON.DirectionalLight(
//     "directionalLight",
//     new BABYLON.Vector3(-2, -3, 0),
//     scene
//   );

//   //3DGS - TreeBench
//   // BABYLON.ImportMeshAsync("../tree_bench/001_3DGS.ply", scene).then(
//   //   (result) => {
//   //     const gaussianSplattingMesh = result.meshes[0];
//   //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
//   //   }
//   // );

//   // BABYLON.ImportMeshAsync("../tree_bench/002_3DGS.ply", scene).then(
//   //   (result) => {
//   //     const gaussianSplattingMesh = result.meshes[0];
//   //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
//   //   }
//   // );

//   //SplatFiles
//   const splatFiles = [
//     "../tree_bench/splats/001_3DGS.splat",
//     "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/StMartinsPlatz3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//   ];

//   const meshes = await Promise.all(
//     splatFiles.map((file, i) =>
//       BABYLON.ImportMeshAsync(file, scene).then((result) => {
//         const mesh = result.meshes[0];
//         mesh.name = "splat_" + i;
//         // mesh.rotate(BABYLON.Axis.X, Math.PI); // flip if needed

//         // Put all meshes into same transparent rendering group
//         mesh.renderingGroupId = 1;
//         return mesh;
//       })
//     )
//   ).then((meshes) => {
//     console.log("All meshes loaded: ", meshes);
//     // meshes[0].position.y += 2;
//     // meshes[1].position.x += 3;

//     // const parent = new BABYLON.TransformNode("splatParent", scene);
//     // meshes.forEach((m) => (m.parent = parent));
//     // meshes.forEach((m) => {
//     //   m.renderingGroupId = 1; // put all in same group
//     // });
//   });

//   scene.debugLayer.show();
//   return scene;
// };

// const scene = await createScene();

// engine.runRenderLoop(function () {
//   scene.render();
// });

// window.addEventListener("resize", function () {
//   engine.resize();
// });
//-------------------------------------------------------

// import * as BABYLON from "@babylonjs/core";
// import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
// import * as GUI from "@babylonjs/gui";
// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

// const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true);
// registerBuiltInLoaders();
// const createScene = async function () {
//   const scene = new BABYLON.Scene(engine);

//   // scene.createDefaultCameraOrLight(true, false, true);

//   const arcCamera = new BABYLON.ArcRotateCamera(
//     "arcCamera",
//     0,
//     0,
//     10,
//     new BABYLON.Vector3(0, 0, 0),
//     scene
//   );

//   //Allowing user input
//   // camera.attachControl();
//   arcCamera.attachControl();

//   const light = new BABYLON.DirectionalLight(
//     "directionalLight",
//     new BABYLON.Vector3(-2, -3, 0),
//     scene
//   );

//   //3DGS - TreeBench
//   // BABYLON.ImportMeshAsync("../tree_bench/001_3DGS.ply", scene).then(
//   //   (result) => {
//   //     const gaussianSplattingMesh = result.meshes[0];
//   //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
//   //   }
//   // );

//   // BABYLON.ImportMeshAsync("../tree_bench/002_3DGS.ply", scene).then(
//   //   (result) => {
//   //     const gaussianSplattingMesh = result.meshes[0];
//   //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
//   //   }
//   // );

//   //SplatFiles
//   const splatFiles = [
//     "../tree_bench/splats/001_3DGS.splat",
//     "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/StMartinsPlatz3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//     // "../tree_bench/splats/001_3DGS.splat",
//     // "../tree_bench/splats/002_3DGS.splat",
//   ];

//   const meshes = await Promise.all(
//     splatFiles.map((file, i) =>
//       BABYLON.ImportMeshAsync(file, scene).then((result) => {
//         const mesh = result.meshes[0];
//         mesh.name = "splat_" + i;

//         // All meshes into group
//         mesh.renderingGroupId = 1;
//         return mesh;
//       })
//     )
//   ).then((meshes) => {
//     console.log("All meshes loaded: ", meshes);
//   });

//   scene.debugLayer.show();
//   return scene;
// };

// const scene = await createScene();

// engine.runRenderLoop(function () {
//   scene.render();
// });

// window.addEventListener("resize", function () {
//   engine.resize();
// });

//-------------------------------------------------------
// import * as BABYLON from "@babylonjs/core";
// import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
// import * as GUI from "@babylonjs/gui";
// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

// const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true);
// registerBuiltInLoaders();
// var createScene = function () {
//   // This creates a basic Babylon Scene object (non-mesh)
//   var scene = new BABYLON.Scene(engine);

//   // This creates and positions a free camera (non-mesh)
//   var camera = new BABYLON.ArcRotateCamera(
//     "camera1",
//     -1,
//     1,
//     15,
//     new BABYLON.Vector3(0, 0, 0),
//     scene
//   );

//   // This attaches the camera to the canvas
//   camera.attachControl(canvas, true);

//   // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
//   var light = new BABYLON.HemisphericLight(
//     "light",
//     new BABYLON.Vector3(0, 1, 0),
//     scene
//   );

//   // Default intensity is 1. Let's dim the light a small amount
//   light.intensity = 0.7;

//   // Our built-in 'sphere' shape.
//   var sphere = BABYLON.MeshBuilder.CreateSphere(
//     "sphere",
//     { diameter: 1, segments: 32 },
//     scene
//   );

//   // Move the sphere upward 1/2 its height
//   sphere.position.y = 0.5;
//   sphere.position.z = -1;

//   var gs = new BABYLON.GaussianSplattingMesh("GS", undefined, scene, true);

//   console.log("GS: ", gs);

//   var generateGS = function (time) {
//     // size of a single splat, int bytes
//     const rowLength = 3 * 4 + 3 * 4 + 4 + 4;

//     // chunck size of splats
//     const splatCount = 10000;

//     const uBuffer = new Uint8Array(splatCount * rowLength);
//     const fBuffer = new Float32Array(uBuffer.buffer);

//     for (let j = 0; j < 100; j++) {
//       for (let ji = 0; ji < 100; ji++) {
//         const i = ji + j * 100;
//         // position
//         let x = j * 0.1 - 5;
//         let y = -Math.sin(time + ji * 0.04 + j * 0.02) * 1 - 1;

//         fBuffer[8 * i + 0] = Math.cos(time) * x + Math.sin(time) * y;
//         fBuffer[8 * i + 1] = Math.sin(time) * x - Math.cos(time) * y;
//         fBuffer[8 * i + 2] = ji * 0.1 - 5;

//         // size
//         fBuffer[8 * i + 3 + 0] = 0.1;
//         fBuffer[8 * i + 3 + 1] = 0.1;
//         fBuffer[8 * i + 3 + 2] = 0.1;

//         // orientation
//         uBuffer[32 * i + 28 + 1] = 128;
//         uBuffer[32 * i + 28 + 2] = 128;
//         uBuffer[32 * i + 28 + 3] = 128;
//         uBuffer[32 * i + 28 + 0] = 255;

//         // color
//         uBuffer[32 * i + 24 + 0] = Math.cos((ji + time * 3) * 0.2) * 127 + 128;
//         uBuffer[32 * i + 24 + 1] = Math.cos((j + time * 4) * 0.3) * 127 + 128;
//         uBuffer[32 * i + 24 + 2] =
//           Math.sin((j + ji + time * 2) * 0.3) * 127 + 128;
//         uBuffer[32 * i + 24 + 3] = 255;
//       }
//     }
//     gs.updateData(uBuffer);
//   };

//   var time = 0;
//   scene.onBeforeRenderObservable.add(() => {
//     generateGS(time);
//     time += 0.01;
//   });

//   return scene;
// };

// const scene = createScene();

// engine.runRenderLoop(function () {
//   scene.render();
// });

// window.addEventListener("resize", function () {
//   engine.resize();
// });
