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
  for (let i = 0; i < 33946; i++) {
    positions[i * 8 + 1] -= 2.0;
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
  const parentNode = new BABYLON.TransformNode(metadata.fileName, scene);

  // const size = metadata.boundingBox.max.subtract(metadata.boundingBox.min);
  // const center = metadata.boundingBox.min.add(size.scale(0.5));

  // const box = BABYLON.MeshBuilder.CreateBox(
  //   `${metadata.id}_bbox`,
  //   { width: size.x, height: size.y, depth: size.z },
  //   scene
  // );
  // box.position.copyFrom(center);
  // box.isPickable = false;
  // box.parent = parentNode;

  // const mat = new BABYLON.StandardMaterial(`${metadata.id}_mat`, scene);
  // mat.emissiveColor = metadata.color;
  // mat.wireframe = true;
  // box.material = mat;

  // metadata.box = box;
  metadata.parentNode = parentNode;
}

// highlight selected logical object
// function setupSelection(scene, metadataList, mergedMesh) {
//   scene.onPointerObservable.add((pointerInfo) => {
//     if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
//       const picked = pointerInfo.pickInfo.pickedMesh;
//       if (!picked) return;

//       // For now, simulate picking logical nodes directly
//       // (Later you can integrate this with GUI selection)
//       const meta = metadataList.find((m) => m.node.name === picked.name);
//       if (meta) {
//         console.log(`Selected object: ${meta.fileName}`);
//         console.log("Splat range:", meta.startIndex, meta.endIndex);

//         // Example visual feedback:
//         mergedMesh.material.emissiveColor = meta.color;
//       }
//     }
//   });
// }

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

// After your scene is ready, create a side panel
// const createSceneGraphUI = () => {
//   // Create a basic HTML container
//   const container = document.createElement("div");
//   container.style.position = "absolute";
//   container.style.top = "10px";
//   container.style.right = "10px";
//   container.style.width = "220px";
//   container.style.maxHeight = "90%";
//   container.style.overflowY = "auto";
//   container.style.backgroundColor = "rgba(30,30,30,0.9)";
//   container.style.color = "white";
//   container.style.fontFamily = "monospace";
//   container.style.padding = "10px";
//   container.style.borderRadius = "6px";
//   container.style.zIndex = "200";
//   container.innerHTML = "<b>Scene Graph</b><br><br>";
//   document.body.appendChild(container);

//   objectMetadataList.forEach((meta) => {
//     const row = document.createElement("div");
//     row.style.marginBottom = "5px";
//     row.style.cursor = "pointer";

//     // checkbox for visibility
//     const checkbox = document.createElement("input");
//     checkbox.type = "checkbox";
//     checkbox.checked = meta.visible;
//     checkbox.style.marginRight = "5px";

//     checkbox.addEventListener("change", () => {
//       meta.visible = checkbox.checked;
//       if (meta.gs) meta.gs.isVisible = meta.visible;
//       if (meta.box) meta.box.isVisible = meta.visible;
//     });

//     row.appendChild(checkbox);

//     // label
//     const label = document.createElement("span");
//     label.textContent = meta.fileName;
//     label.addEventListener("click", () => {
//       // Focus camera on this mesh
//       const target = meta.gs ? meta.gs.position : new BABYLON.Vector3(0, 0, 0);
//       scene.activeCamera.setTarget(target);
//     });
//     row.appendChild(label);

//     container.appendChild(row);
//   });
// };

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
    // createSceneGraphUI();

    gsMeshes.forEach((gs) => gs.dispose());

    // Create logical nodes that represent individual objects in the scene
    // drawBoundingBox(scene, objectMetadataList);

    // Optional: Setup picking/selection
    // setupSelection(scene, objectMetadataList, mergedMesh);

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
