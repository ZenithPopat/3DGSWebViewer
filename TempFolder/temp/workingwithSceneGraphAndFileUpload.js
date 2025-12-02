import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const FLOATS_PER_SPLAT = 8;
let objectMetadataList = [];
let mergedFloats = null; // Float32Array that we manage in JS
let mergedMeshGlobal = null; // the single GaussianSplattingMesh we render

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

// function mergeSplats(scene, metadataList) {
//   const mergedData = metadataList.reduce((acc, meta) => {
//     const floats = new Float32Array(meta.gs.splatsData);
//     const newArray = new Float32Array(acc.length + floats.length);
//     newArray.set(acc);
//     newArray.set(floats, acc.length);
//     return newArray;
//   }, new Float32Array(0));

//   const mergedMesh = new BABYLON.GaussianSplattingMesh(
//     "merged",
//     undefined,
//     scene
//   );
//   mergedMesh.updateData(mergedData.buffer);
//   return mergedMesh;
// }
function mergeSplats(scene, metadataList) {
  // Build merged floats from metadataList (each meta must have meta.splatsCopy)
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

  // create or update the merged mesh
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

  // store the authoritative JS buffer
  mergedFloats = newMerged;

  return { mergedMesh: mergedMeshGlobal, mergedFloats };
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

  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = "➕ Add 3DGS File";
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

// async function handleFileUpload(files, scene, mergedMesh) {
//   for (const file of files) {
//     console.log(`📂 Loading new file: ${file.name}`);

//     // Create a blob URL to load through BabylonJS
//     const url = URL.createObjectURL(file);
//     console.log(url);
//     const newMesh = new BABYLON.GaussianSplattingMesh(
//       file.name,
//       url,
//       scene,
//       true
//     );
//     console.log(newMesh);

//     await new Promise((resolve) => {
//       // Check if observable exists
//       if (newMesh.onReadyObservable && newMesh.onReadyObservable.addOnce) {
//         newMesh.onReadyObservable.addOnce(() => {
//           console.log(`✅ ${file.name} loaded`);
//           finalizeMeshLoad(scene, newMesh, file.name);
//           resolve();
//         });
//       } else {
//         // Fallback: wait until splatsData appears
//         const checkReady = () => {
//           if (newMesh.splatsData && newMesh.splatsData.length > 0) {
//             console.log(`✅ ${file.name} ready (fallback)`);
//             finalizeMeshLoad(scene, newMesh, file.name);
//             resolve();
//           } else {
//             requestAnimationFrame(checkReady);
//           }
//         };
//         checkReady();
//       }
//     });
//   }

//   // Rebuild merged mesh
//   console.log("🔁 Merging all splats again...");
//   const mergeResult = mergeSplats(scene, objectMetadataList);
//   if (mergeResult) {
//     mergedMesh.dispose();
//     mergedMesh = mergeResult.mergedMesh;
//     console.log("✅ Merge complete with new data");
//   } else {
//     console.error("❌ Failed to merge new splats");
//   }
//   appendSplatsToMergedMesh(mergedMesh, newMesh, file.name);
//   newMesh.dispose();

//   // Refresh the UI list
//   document.getElementById("sceneGraph").remove();
//   createSceneGraphUI(scene, mergedMesh);
// }

async function handleFileUpload(files, scene) {
  // keep a reference to the merged mesh and floats
  // mergedMeshGlobal and mergedFloats are globals
  for (const file of files) {
    console.log(`📂 Loading new file: ${file.name}`);
    const url = URL.createObjectURL(file);
    const newMesh = new BABYLON.GaussianSplattingMesh(
      file.name,
      url,
      scene,
      true
    );

    // Wait until mesh.splatsData populates (works with or without onReadyObservable)
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

    // create metadata for this new mesh and keep a stable copy of its floats
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

    // stable copy of floats
    if (newMesh.splatsData) {
      const original = new Float32Array(newMesh.splatsData);
      meta.splatsCopy = new Float32Array(original); // deep copy
    } else {
      console.warn("handleFileUpload: no splatsData on newMesh", file.name);
      newMesh.dispose();
      continue;
    }

    // Append meta and update mergedFloats / mergedMeshGlobal
    objectMetadataList.push(meta);

    // If mergedFloats doesn't exist yet (first time), set it to meta.splatsCopy
    if (!mergedFloats) {
      mergedFloats = new Float32Array(meta.splatsCopy); // copy
    } else {
      // create a new Float32Array with old + new
      const total = mergedFloats.length + meta.splatsCopy.length;
      const combined = new Float32Array(total);
      combined.set(mergedFloats, 0);
      combined.set(meta.splatsCopy, mergedFloats.length);
      mergedFloats = combined;
    }

    // update merged mesh (create if needed)
    if (!mergedMeshGlobal) {
      mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
        "merged",
        undefined,
        scene
      );
    }
    try {
      mergedMeshGlobal.updateData(mergedFloats.buffer);
    } catch (e) {
      console.error("handleFileUpload: mergedMeshGlobal.updateData failed:", e);
    }

    // update meta indices: recompute start/end for this meta (we used startIndex earlier)
    meta.startIndex = startIndex;
    meta.splatCount = meta.splatsCopy.length / FLOATS_PER_SPLAT;
    meta.endIndex = meta.startIndex + meta.splatCount;

    // draw bbox and dispose temporary newMesh
    // drawBoundingBox(scene, meta);
    newMesh.dispose();
    console.log(`✅ Appended ${file.name} — splats: ${meta.splatCount}`);
  }

  // Refresh UI list: remove old UI and recreate with reference to mergedMeshGlobal
  const sg = document.getElementById("sceneGraph");
  if (sg) sg.remove();
  createSceneGraphUI(scene, mergedMeshGlobal);
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
