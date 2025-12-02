import * as BABYLON from "@babylonjs/core";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const FLOATS_PER_SPLAT = 8;
let objectMetadataList = [];
let mergedFloats = null;
let mergedMeshGlobal = null;

function createSceneGraphUI(scene, mergedMesh) {
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

  const header = document.createElement("div");
  header.textContent = "SCENE GRAPH";
  header.style.textAlign = "center";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "10px";
  header.style.color = "#fff";
  container.appendChild(header);

  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = "+ Add splat File";
  uploadBtn.style.width = "100%";
  uploadBtn.style.marginBottom = "10px";
  uploadBtn.style.padding = "6px";
  uploadBtn.style.background = "#444";
  uploadBtn.style.color = "#fff";
  uploadBtn.style.border = "none";
  uploadBtn.style.borderRadius = "4px";
  uploadBtn.style.cursor = "pointer";
  uploadBtn.onmouseenter = () => (uploadBtn.style.background = "#666");
  uploadBtn.onmouseleave = () => (uploadBtn.style.background = "#444");
  uploadBtn.onclick = () => fileInput.click();

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".splat";
  fileInput.multiple = true;
  fileInput.style.display = "none";

  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    await handleFileUpload(files, scene, mergedMesh);
  });

  container.appendChild(uploadBtn);
  container.appendChild(fileInput);

  objectMetadataList.forEach((meta, index) => {
    const entry = document.createElement("div");
    entry.className = "scene-object";
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.marginBottom = "6px";
    entry.style.cursor = "pointer";

    const label = document.createElement("span");
    label.textContent = meta.fileName.split("/").pop();
    label.style.flex = "1";
    label.style.transition = "color 0.2s ease";

    label.addEventListener("click", () => {
      selectObject(meta);
      document
        .querySelectorAll(".scene-object span")
        .forEach((l) => (l.style.color = "#ddd"));
      label.style.color = "#00ffff";
    });

    // entry.appendChild(checkbox);
    entry.appendChild(label);
    container.appendChild(entry);
  });
}

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
  const boundingInfo = gsMesh.getBoundingInfo();
  const boundingBox = {
    min: boundingInfo.minimum.clone(),
    max: boundingInfo.maximum.clone(),
  };

  const splatCount = floats.length / FLOATS_PER_SPLAT;
  const endIndex = startIndex + splatCount;

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
  const validMetas = metadataList.filter(
    (m) => m && m.splatsCopy && m.splatsCopy.length > 0
  );

  const totalFloats = validMetas.reduce(
    (sum, m) => sum + m.splatsCopy.length,
    0
  );
  console.log("Merging total floats:", totalFloats);

  const newMerged = new Float32Array(totalFloats);
  let offset = 0;
  for (const m of validMetas) {
    newMerged.set(m.splatsCopy, offset);
    offset += m.splatsCopy.length;
  }

  if (!mergedMeshGlobal) {
    mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      scene
    );
  }
  try {
    mergedMeshGlobal.updateData(newMerged.buffer);
  } catch (e) {
    console.error("mergeSplats: mergedMesh.updateData failed:", e);
    return null;
  }

  mergedFloats = newMerged;

  return { mergedMesh: mergedMeshGlobal, mergedFloats };
}

let selectionBox = null;

function selectObject(meta) {
  console.log(`Selected object: ${meta.fileName.split("/").pop()}`);
  console.log(`Selected splats range: ${meta.startIndex} - ${meta.endIndex}`);

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
  mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  mat.wireframe = true;
  selectionBox.material = mat;

  scene.activeCamera.setTarget(center);
}

async function handleFileUpload(files, scene) {
  for (const file of files) {
    console.log(`File: ${file.name}`);
    const url = URL.createObjectURL(file);
    const newMesh = new BABYLON.GaussianSplattingMesh(
      file.name,
      url,
      scene,
      true
    );

    await new Promise((resolve) => {
      if (newMesh.onReadyObservable && newMesh.onReadyObservable.addOnce) {
        newMesh.onReadyObservable.addOnce(() => resolve());
      } else {
        const check = () => {
          if (newMesh.splatsData && newMesh.splatsData.byteLength > 0)
            resolve();
          else requestAnimationFrame(check);
        };
        check();
      }
    });

    const startIndex =
      objectMetadataList.length > 0
        ? objectMetadataList[objectMetadataList.length - 1].endIndex
        : 0;

    const meta = generateMetadata(newMesh, file.name, startIndex);
    if (!meta) {
      console.warn("handleFileUpload: generateMetadata failed for", file.name);
      newMesh.dispose();
      continue;
    }

    if (newMesh.splatsData) {
      const original = new Float32Array(newMesh.splatsData);
      meta.splatsCopy = new Float32Array(original);
    } else {
      console.warn("handleFileUpload: no splatsData on newMesh", file.name);
      newMesh.dispose();
      continue;
    }

    objectMetadataList.push(meta);

    if (!mergedFloats) {
      mergedFloats = new Float32Array(meta.splatsCopy);
    } else {
      const total = mergedFloats.length + meta.splatsCopy.length;
      const combined = new Float32Array(total);
      combined.set(mergedFloats, 0);
      combined.set(meta.splatsCopy, mergedFloats.length);
      mergedFloats = combined;
    }

    if (!mergedMeshGlobal) {
      mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
        "merged",
        undefined,
        scene
      );
    }

    try {
      if (mergedMeshGlobal) mergedMeshGlobal.dispose();
      mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
        "merged",
        undefined,
        scene
      );
      mergedMeshGlobal.updateData(mergedFloats.buffer);
      console.log(
        "Merged mesh recreated with total splats:",
        mergedFloats.length / FLOATS_PER_SPLAT
      );
    } catch (e) {
      console.error("handleFileUpload: mergedMeshGlobal recreation failed:", e);
    }

    meta.startIndex = startIndex;
    meta.splatCount = meta.splatsCopy.length / FLOATS_PER_SPLAT;
    meta.endIndex = meta.startIndex + meta.splatCount;

    newMesh.dispose();
    console.log(`Appended splats: ${meta.splatCount}`);
  }

  const sg = document.getElementById("sceneGraph");
  if (sg) sg.remove();
  createSceneGraphUI(scene, mergedMeshGlobal);
}

const createScene = async function () {
  const scene = new BABYLON.Scene(engine);

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
    // "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/garden.splat",
    // "../tree_bench/splats/StMartinsPlatz3DGS.splat",
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
    // if (gsMeshes[2]) modifyMesh(gsMeshes[2]);
    scene.meshes.forEach((m) => {
      if (m.refreshBoundingInfo) m.refreshBoundingInfo();
    });
    gsMeshes.forEach((gs) => gs.computeWorldMatrix(true));

    for (let i = 0; i < gsMeshes.length; i++) {
      const meta = generateMetadata(gsMeshes[i], filePaths[i], currentStart);
      if (gsMeshes[i].splatsData) {
        const original = new Float32Array(gsMeshes[i].splatsData);
        meta.splatsCopy = new Float32Array(original);
      }
      objectMetadataList.push(meta);
      currentStart = meta.endIndex;
    }
    console.log(objectMetadataList);
    const mergeResult = mergeSplats(scene, objectMetadataList);
    if (!mergeResult) {
      console.error("Merging failed. Falling back to per-file meshes.");
    } else {
      const { mergedMesh, mergedFloats } = mergeResult;
      createSceneGraphUI(scene, mergedMesh, mergedFloats);
    }

    gsMeshes.forEach((gs) => gs.dispose());
  });

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
