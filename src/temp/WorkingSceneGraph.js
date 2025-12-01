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

function createSceneGraphUI(scene, mergedMesh) {
  // 1️⃣ Create the main container
  const container = document.createElement("div");
  container.id = "sceneGraph";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.width = "240px";
  container.style.maxHeight = "85%";
  container.style.overflowY = "auto";
  container.style.background = "rgba(25, 25, 25, 0.9)";
  container.style.border = "1px solid #444";
  container.style.borderRadius = "8px";
  container.style.padding = "10px";
  container.style.fontFamily = "monospace";
  container.style.color = "#ddd";
  container.style.fontSize = "13px";
  container.style.zIndex = "100";
  document.body.appendChild(container);

  // 2️⃣ Header
  const header = document.createElement("div");
  header.textContent = "📂 Scene Graph";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "10px";
  header.style.color = "#fff";
  container.appendChild(header);

  // 3️⃣ List all objects
  objectMetadataList.forEach((meta, index) => {
    const entry = document.createElement("div");
    entry.className = "scene-object";
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.marginBottom = "6px";
    entry.style.cursor = "pointer";

    // Checkbox for visibility
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = meta.visible;
    checkbox.style.marginRight = "6px";
    checkbox.addEventListener("change", () => {
      meta.visible = checkbox.checked;
      meta.gs.isVisible = meta.visible;
      if (meta.box) meta.box.isVisible = meta.visible;
    });

    // Label for name
    const label = document.createElement("span");
    label.textContent = meta.fileName.split("/").pop();
    label.style.flex = "1";
    label.style.transition = "color 0.2s ease";

    // On click: select and highlight
    label.addEventListener("click", () => {
      selectObject(meta, mergedMesh);
      // update UI highlight
      document
        .querySelectorAll(".scene-object span")
        .forEach((l) => (l.style.color = "#ddd"));
      label.style.color = "#00ffff";
    });

    entry.appendChild(checkbox);
    entry.appendChild(label);
    container.appendChild(entry);
  });
}

let selectionBox = null;

function selectObject(meta, mergedMesh) {
  console.log(`Selected object: ${meta.fileName}`);
  console.log(`Splats range: ${meta.startIndex} → ${meta.endIndex}`);

  if (selectionBox) {
    selectionBox.dispose();
    selectionBox = null;
  }

  const min = meta.boundingBox.min;
  const max = meta.boundingBox.max;
  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  selectionBox = BABYLON.MeshBuilder.CreateBox(
    `${meta.id}_selectionBox`,
    {
      width: size.x,
      height: size.y,
      depth: size.z,
    },
    scene
  );

  selectionBox.position.copyFrom(center);
  selectionBox.isPickable = false;

  const mat = new BABYLON.StandardMaterial("selectionMat", scene);
  mat.emissiveColor = new BABYLON.Color3(1, 1, 0); // yellow outline
  mat.wireframe = true;
  selectionBox.material = mat;

  const target = meta.boundingBox.min.add(
    meta.boundingBox.max.subtract(meta.boundingBox.min).scale(0.5)
  );
  scene.activeCamera.setTarget(center);
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
      if (gsMeshes[i].splatsData) {
        const original = new Float32Array(gsMeshes[i].splatsData);
        meta.splatsCopy = new Float32Array(original); // deep copy
      } else {
        console.warn(`⚠️ ${filePaths[i]} has no splatsData yet`);
      }
      objectMetadataList.push(meta);
      currentStart = meta.endIndex;
    }
    console.log(objectMetadataList);
    console.table(
      objectMetadataList.map((o) => ({
        name: o.fileName,
        hasData: !!o.gs?.splatsData,
        length: o.gs?.splatsData ? new Float32Array(o.gs.splatsData).length : 0,
      }))
    );
    const mergeResult = mergeSplats(scene, objectMetadataList);
    // mergeResult may be null if merge failed
    if (!mergeResult) {
      console.error("Merging failed. Falling back to per-file meshes.");
    } else {
      const { mergedMesh, mergedFloats } = mergeResult;
      // pass both mergedMesh and mergedFloats into UI / selection
      createSceneGraphUI(scene, mergedMesh, mergedFloats);
    }

    gsMeshes.forEach((gs) => gs.dispose());
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
