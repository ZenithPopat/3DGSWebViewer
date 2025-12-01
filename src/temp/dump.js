// function appendMeshData(gsTarget, gsAppend) {
//   const data1 = new Float32Array(gsTarget.splatsData);
//   const data2 = new Float32Array(gsAppend.splatsData);
//   const stride = 8;

//   // Compute bounding boxes before merging
//   const bbox1 = computeBoundingBoxFromSplats(data1);
//   const bbox2 = computeBoundingBoxFromSplats(data2);

//   const merged = new Float32Array(data1.length + data2.length);
//   merged.set(data1);
//   merged.set(data2, data1.length);

//   // Update the target mesh with new merged data
//   const mergedMesh = new BABYLON.GaussianSplattingMesh(
//     "merged",
//     undefined,
//     scene
//   );
//   mergedMesh.updateData(merged.buffer);

//   objectRanges["tree"] = { start: 0, end: data1.length / stride, bbox: bbox1 };
//   objectRanges["bench"] = {
//     start: data1.length / stride,
//     end: merged.length / stride,
//     bbox: bbox2,
//   };

//   for (const [name, info] of Object.entries(objectRanges)) {
//     const size = info.bbox.max.subtract(info.bbox.min);
//     const center = info.bbox.min.add(size.scale(0.5));
//     const box = BABYLON.MeshBuilder.CreateBox(
//       `${name}_bbox`,
//       { width: size.x, height: size.y, depth: size.z },
//       scene
//     );
//     box.position.copyFrom(center);
//     box.isPickable = false;

//     // Wireframe look
//     const mat = new BABYLON.StandardMaterial(`${name}_mat`, scene);
//     mat.emissiveColor = new BABYLON.Color3(
//       Math.random(),
//       Math.random(),
//       Math.random()
//     );

//     mat.wireframe = true;
//     box.material = mat;

//     info.box = box;
//   }

//   gsTarget.dispose();
//   gsAppend.dispose();

//   return mergedMesh;
// }

// function computeBoundingBoxFromSplats(splatsData) {
//   const floats = new Float32Array(splatsData);
//   const stride = 8;
//   const count = floats.length / stride;

//   let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
//   let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

//   for (let i = 0; i < count; i++) {
//     const x = floats[i * stride + 0];
//     const y = floats[i * stride + 1];
//     const z = floats[i * stride + 2];

//     if (x < min.x) min.x = x;
//     if (y < min.y) min.y = y;
//     if (z < min.z) min.z = z;
//     if (x > max.x) max.x = x;
//     if (y > max.y) max.y = y;
//     if (z > max.z) max.z = z;
//   }

//   // Local-space bounding box
//   const size = max.subtract(min);
//   const center = min.add(size.scale(0.5));

//   // Convert to world space using mesh transform
//   const worldMatrix = splatsData.getWorldMatrix();
//   const worldCenter = BABYLON.Vector3.TransformCoordinates(center, worldMatrix);

//   // Scale the size by world scaling factors
//   const scaling = splatsData.scaling.clone();
//   const worldSize = new BABYLON.Vector3(
//     size.x * scaling.x,
//     size.y * scaling.y,
//     size.z * scaling.z
//   );

//   return { center: worldCenter, size: worldSize };
// }

// Click picking (basic test)
// scene.onPointerObservable.add((pointerInfo) => {
//   if (pointerInfo.pickInfo?.pickedMesh === merged) {
//     const index = Math.floor(Math.random() * objectRanges.bench.end); // placeholder
//     let selected = null;

//     for (const [name, range] of Object.entries(objectRanges)) {
//       if (index >= range.start && index < range.end) {
//         selected = name;
//         break;
//       }
//     }

//     if (selected) {
//       console.log("Selected object:", selected);
//     }
//   }
// });

/*

  //SplatFiles
  // const splatFiles = [
  //   "../tree_bench/splats/001_3DGS.splat",
  //   "../tree_bench/splats/002_3DGS.splat",
  // ];

  // const meshes = await Promise.all(
  //   splatFiles.map((file, i) =>
  //     BABYLON.ImportMeshAsync(file, scene).then((result) => {
  //       const mesh = result.meshes[0];
  //       mesh.name = "splat_" + i;
  //       const vertexData = mesh.getVerticesData(
  //         BABYLON.VertexBuffer.PositionKind
  //       );
  //       const vertexBuffer = mesh.getVertexBuffer(
  //         BABYLON.VertexBuffer.PositionKind
  //       );
  //       console.log("VertexData: ", vertexData);
  //       console.log("VertexBuffer: ", vertexBuffer);
  //       console.log("Loaded mesh:", mesh);
  //       console.log(mesh.getVerticesDataKinds());

  //       return mesh;
  //     })
  //   )
  // ).then((meshes) => {
  //   console.log("All meshes loaded: ", meshes);
  // });

*/

/*

  // const mesh1 = file1.meshes[0];
  // const mesh2 = file2.meshes[0];

  // console.log("mesh1: ", mesh1);
  // console.log("mesh2: ", mesh2);

  // const data1 = mesh1._splatData; // Float32Array of all splats
  // const data2 = mesh2._splatData;

  // console.log("splatData1: ", data1);
  // console.log("splatData2: ", data2);

  // console.log(mesh1._splatPositions.length, mesh2._splatPositions.length);
  // console.log(mesh1._splatIndex.length, mesh2._splatIndex.length);

  // const mergedPositions = new Float32Array(
  //   mesh1._splatPositions.length + mesh2._splatPositions.length
  // );
  // mergedPositions.set(mesh1._splatPositions, 0);
  // mergedPositions.set(mesh2._splatPositions, mesh1._splatPositions.length);

  // const mergedIndices = new Float32Array(
  //   mesh1._splatIndex.length + mesh2._splatIndex.length
  // );
  // mergedIndices.set(mesh1._splatIndex, 0);
  // mergedIndices.set(mesh2._splatIndex, mesh1._splatIndex.length);

  // const mergedMesh = new BABYLON.GaussianSplattingMesh("merged", scene);
  // mergedMesh._splatPositions = mergedPositions;
  // mergedMesh._splatIndex = mergedIndices;

  // // Copy textures (colors, covariances, etc.) from one of the meshes
  // mergedMesh._colorsTexture = mesh1._colorsTexture;
  // mergedMesh._covariancesATexture = mesh1._covariancesATexture;
  // mergedMesh._covariancesBTexture = mesh1._covariancesBTexture;
  // mergedMesh.material = mesh1.material;

  // // Re-upload data to GPU
  // mergedMesh._updateMaterial();
  // mergedMesh._createVertexBuffers();

  // scene.addMesh(mergedMesh);
  // camera.target = mergedMesh.position;

*/

// import * as BABYLON from "@babylonjs/core";
// import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
// import * as GUI from "@babylonjs/gui";
// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";
// import { loadPLY } from "./readers/plyReader.js";
// import { loadPlyFile } from "./readers/plyReader.js";
// // import { packToBuffer } from "./utils/packToBuffer.js";

// const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true);
// registerBuiltInLoaders();

// function modifyMesh(gs) {
//   const arrayBuffer = gs.splatsData;
//   var positions = new Float32Array(arrayBuffer);
//   for (let i = 0; i < 10000; i++) {
//     positions[i * 8 + 1] -= 2.0;
//   }
//   gs.updateData(arrayBuffer);
// }

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

//   // const plyData = await loadPLY("../tree_bench/001_3DGS.ply");
//   // const plyData = await loadPlyFile("../tree_bench/001_3DGS.ply");
//   // const splatData1 = await SplatReader.load(
//   //   "../tree_bench/splats/001_3DGS.splat"
//   // );

//   // console.log(plyData);
//   // const { uBuffer } = packToBuffer(
//   //   plyData.positions,
//   //   plyData.scales,
//   //   plyData.colors,
//   //   plyData.quaternions
//   // );

//   // const gs = new BABYLON.GaussianSplattingMesh(
//   //   "plyMesh",
//   //   undefined,
//   //   scene,
//   //   true
//   // );
//   // gs.updateData(uBuffer);
//   // console.log(splatData1);
//   return scene;
// };

// const scene = await createScene();

// engine.runRenderLoop(function () {
//   scene.render();
// });

// window.addEventListener("resize", function () {
//   engine.resize();
// });

// Compute bounding box from splat data
// export function computeBoundingBoxFromSplats(splatsData, transformMatrix) {
//   const floats = new Float32Array(splatsData);
//   const stride = 8;
//   const count = floats.length / stride;

//   let minX = Infinity,
//     minY = Infinity,
//     minZ = Infinity;
//   let maxX = -Infinity,
//     maxY = -Infinity,
//     maxZ = -Infinity;

//   const temp = new BABYLON.Vector3();

//   for (let i = 0; i < count; i++) {
//     temp.set(
//       floats[i * stride + 0],
//       floats[i * stride + 1],
//       floats[i * stride + 2]
//     );

//     // Transform by world matrix
//     BABYLON.Vector3.TransformCoordinatesToRef(temp, transformMatrix, temp);

//     if (temp.x < minX) minX = temp.x;
//     if (temp.y < minY) minY = temp.y;
//     if (temp.z < minZ) minZ = temp.z;
//     if (temp.x > maxX) maxX = temp.x;
//     if (temp.y > maxY) maxY = temp.y;
//     if (temp.z > maxZ) maxZ = temp.z;
//   }

//   // for (let i = 0; i < count; i++) {
//   //   const x = floats[i * stride + 0];
//   //   const y = floats[i * stride + 1];
//   //   const z = floats[i * stride + 2];

//   //   if (x < minX) minX = x;
//   //   if (y < minY) minY = y;
//   //   if (z < minZ) minZ = z;
//   //   if (x > maxX) maxX = x;
//   //   if (y > maxY) maxY = y;
//   //   if (z > maxZ) maxZ = z;
//   // }

//   return {
//     min: new BABYLON.Vector3(minX, minY, minZ),
//     max: new BABYLON.Vector3(maxX, maxY, maxZ),
//   };
// }

// const boundingBox = computeBoundingBoxFromSplats(
//   gsMesh.splatsData,
//   gsMesh.getWorldMatrix(true)
// );
