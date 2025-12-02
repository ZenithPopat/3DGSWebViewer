import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const FLOATS_PER_SPLAT = 8;
let objectMetadataList = [];

// Modify the mesh
function modifyMesh(gs) {
  const arrayBuffer = gs.splatsData;
  var positions = new Float32Array(arrayBuffer);
  // const theta = Math.PI / 2;
  // const cosTheta = Math.cos(theta);
  // const sinTheta = Math.sin(theta);
  // for (let i = 0; i < 30000; i++) {
  // let x = positions[i * 8 + 0];
  // let y = positions[i * 8 + 1];
  // let z = positions[i * 8 + 2];
  // positions[i * 8 + 1] = y * cosTheta - z * sinTheta;
  // positions[i * 8 + 2] = y * sinTheta + z * cosTheta;
  // // Normals
  // let nx = positions[i * 8 + 3];
  // let ny = positions[i * 8 + 4];
  // let nz = positions[i * 8 + 5];
  // positions[i * 8 + 4] = ny * cosTheta - nz * sinTheta;
  // positions[i * 8 + 5] = ny * sinTheta + nz * cosTheta;
  // }
  for (let i = 0; i < 33946; i++) {
    // positions[i * 8 + 1] *= 2.0;
    // positions[i * 8 + 2] *= 2.0;
    // positions[i * 8 + 0] *= 2.0;
    positions[i * 8 + 1] -= 2.0;
    // positions[i * 8 + 2] -= 2.0;
    // positions[i * 8 + 0] -= 2.0;
  }
  gs.updateData(arrayBuffer);
}

// Generate metadata

function generateMetadata(gsMesh, fileName, startIndex) {
  gsMesh.computeWorldMatrix(true);
  gsMesh.refreshBoundingInfo();
  const floats = new Float32Array(gsMesh.splatsData);
  const splatCount = floats.length / FLOATS_PER_SPLAT;
  const endIndex = startIndex + splatCount;
  const boundingInfo = gsMesh.getBoundingInfo();
  const boundingBox = {
    min: boundingInfo.minimum.clone(),
    max: boundingInfo.maximum.clone(),
  };
  // const transform = gsMesh.getWorldMatrix(true).clone();

  const debugColor = new BABYLON.Color3(
    Math.random(),
    Math.random(),
    Math.random()
  );

  return {
    id: gsMesh.name || BABYLON.Tools.RandomId(),
    fileName,
    startIndex,
    endIndex,
    splatCount,
    boundingBox,
    // transform,
    color: debugColor,
    visible: true,
    gs: gsMesh,
    // splatsData: gsMesh.splatsData,
  };
}

// Draw Bounding Box
function drawBoundingBox(scene, metadata) {
  const size = metadata.boundingBox.max.subtract(metadata.boundingBox.min);
  const center = metadata.boundingBox.min.add(size.scale(0.5));

  const box = BABYLON.MeshBuilder.CreateBox(
    `${metadata.id}_bbox`,
    { width: size.x, height: size.y, depth: size.z },
    scene
  );
  box.position.copyFrom(center);
  box.isPickable = false;

  const mat = new BABYLON.StandardMaterial(`${metadata.id}_mat`, scene);
  mat.emissiveColor = metadata.color;
  mat.wireframe = true;
  box.material = mat;

  metadata.box = box;
}

function mergeSplats(scene, metadataList) {
  const mergedData = metadataList.reduce((acc, meta) => {
    const floats = new Float32Array(meta.gs.splatsData);
    const newArray = new Float32Array(acc.length + floats.length);
    newArray.set(acc);
    newArray.set(floats, acc.length);
    return newArray;
  }, new Float32Array(0));

  const mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    scene
  );
  mergedMesh.updateData(mergedData.buffer);
  return mergedMesh;
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

  arcCamera.attachControl();

  const light = new BABYLON.DirectionalLight(
    "directionalLight",
    new BABYLON.Vector3(-2, -3, 0),
    scene
  );

  const filePaths = [
    "../tree_bench/splats/001_3DGS.splat",
    "../tree_bench/splats/002_3DGS.splat",
    "../tree_bench/splats/002_3DGS.splat",
  ];

  const gsMeshes = [];
  for (let i = 0; i < filePaths.length; i++) {
    const mesh = new BABYLON.GaussianSplattingMesh(
      `splat_${i}`,
      filePaths[i],
      scene,
      true
    );
    gsMeshes.push(mesh);
  }

  let currentStart = 0;
  scene.onReadyObservable.add(() => {
    modifyMesh(gsMeshes[2]);
    scene.meshes.forEach((m) => {
      if (m.refreshBoundingInfo) m.refreshBoundingInfo();
    });
    gsMeshes.forEach((gs) => gs.computeWorldMatrix(true));

    for (let i = 0; i < gsMeshes.length; i++) {
      const meta = generateMetadata(gsMeshes[i], filePaths[i], currentStart);
      // console.log(meta);
      objectMetadataList.push(meta);
      currentStart = meta.endIndex;
    }
    console.log(objectMetadataList);
    const mergedMesh = mergeSplats(scene, objectMetadataList);

    gsMeshes.forEach((gs) => gs.dispose());

    objectMetadataList.forEach((meta) => drawBoundingBox(scene, meta));
  });

  // Debug
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
