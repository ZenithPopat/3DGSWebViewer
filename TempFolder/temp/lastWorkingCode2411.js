import * as BABYLON from "@babylonjs/core";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let selectedObject = null;
const MOVE_STEP = 0.05; // base move step
const FLOATS_PER_SPLAT = 8;
let objectMetadataList = [];
let mergedFloats = null;
let mergedMeshGlobal = null;
let selectionBox = null;

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

    entry.appendChild(label);
    container.appendChild(entry);
  });
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

function translateObject(meta, dx, dy, dz) {
  if (!mergedFloats || !mergedMeshGlobal) return;
  if (!meta) return;

  const start = meta.startIndex * FLOATS_PER_SPLAT;
  const end = meta.endIndex * FLOATS_PER_SPLAT;

  // Directly modify position values (x, y, z)
  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    mergedFloats[i + 0] += dx;
    mergedFloats[i + 1] += dy;
    mergedFloats[i + 2] += dz;
  }

  // Push updated buffer to GPU
  mergedMeshGlobal.updateData(mergedFloats.buffer);

  // Update bounding box for selection box
  meta.boundingBox.min.addInPlace(new BABYLON.Vector3(dx, dy, dz));
  meta.boundingBox.max.addInPlace(new BABYLON.Vector3(dx, dy, dz));

  if (selectionBox)
    selectionBox.position.addInPlace(new BABYLON.Vector3(dx, dy, dz));
}

function scaleObjectPerSplat(meta, scaleFactor) {
  if (!meta || !mergedFloats || !mergedMeshGlobal) return;

  const start = meta.startIndex * FLOATS_PER_SPLAT;
  const end = meta.endIndex * FLOATS_PER_SPLAT;
  const count = meta.endIndex - meta.startIndex;

  if (count <= 0) return;

  // ---- 1. Compute centroid ----
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    cx += mergedFloats[i + 0];
    cy += mergedFloats[i + 1];
    cz += mergedFloats[i + 2];
  }
  cx /= count;
  cy /= count;
  cz /= count;

  // ---- 2. Per-splat scaling ----
  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    // position
    mergedFloats[i + 0] = cx + (mergedFloats[i + 0] - cx) * scaleFactor;
    mergedFloats[i + 1] = cy + (mergedFloats[i + 1] - cy) * scaleFactor;
    mergedFloats[i + 2] = cz + (mergedFloats[i + 2] - cz) * scaleFactor;

    // radius / size (if present)
    // Most 8-float splats store radius or sigma in index 6
    mergedFloats[i + 6] *= scaleFactor;

    // NOTE: If your format stores 3x sigma or covariance,
    // we repeat scaling for all fields here.
  }

  // ---- 3. Push to GPU ----
  mergedMeshGlobal.updateData(mergedFloats.buffer);

  // ---- 4. Update bounding box ----
  meta.boundingBox.min.scaleInPlace(scaleFactor);
  meta.boundingBox.max.scaleInPlace(scaleFactor);

  // Better recalc exact bounds:
  recomputeBoundingBox(meta);

  // ---- 5. Selection box update ----
  if (selectionBox) {
    selectionBox.dispose();
    selectionBox = null;
    selectObject(meta);
  }
}

function recomputeBoundingBox(meta) {
  const start = meta.startIndex * FLOATS_PER_SPLAT;
  const end = meta.endIndex * FLOATS_PER_SPLAT;

  const min = new BABYLON.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY
  );
  const max = new BABYLON.Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  );

  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    const x = mergedFloats[i + 0];
    const y = mergedFloats[i + 1];
    const z = mergedFloats[i + 2];

    if (x < min.x) min.x = x;
    if (y < min.y) min.y = y;
    if (z < min.z) min.z = z;

    if (x > max.x) max.x = x;
    if (y > max.y) max.y = y;
    if (z > max.z) max.z = z;
  }

  meta.boundingBox = { min, max };
}

function rotateObject(target, axis, angleDeg) {
  if (!target || target.startIndex == null || target.endIndex == null) {
    console.warn("rotateObject: invalid target", target);
    return;
  }
  if (!mergedFloats || !mergedMeshGlobal) {
    console.warn("rotateObject: missing merged data/mesh");
    return;
  }

  const start = target.startIndex * FLOATS_PER_SPLAT;
  const end = target.endIndex * FLOATS_PER_SPLAT;

  let cx = 0,
    cy = 0,
    cz = 0;
  const splatCount = target.endIndex - target.startIndex;
  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    cx += mergedFloats[i];
    cy += mergedFloats[i + 1];
    cz += mergedFloats[i + 2];
  }
  cx /= splatCount;
  cy /= splatCount;
  cz /= splatCount;

  const angle = (angleDeg * Math.PI) / 180;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  for (let i = start; i < end; i += FLOATS_PER_SPLAT) {
    let x = mergedFloats[i] - cx;
    let y = mergedFloats[i + 1] - cy;
    let z = mergedFloats[i + 2] - cz;

    let nx = x,
      ny = y,
      nz = z;

    switch (axis) {
      case "x": // rotate around X-axis
        ny = y * cosA - z * sinA;
        nz = y * sinA + z * cosA;
        break;
      case "y": // rotate around Y-axis
        nx = x * cosA + z * sinA;
        nz = -x * sinA + z * cosA;
        break;
      case "z": // rotate around Z-axis
        nx = x * cosA - y * sinA;
        ny = x * sinA + y * cosA;
        break;
    }

    mergedFloats[i] = cx + nx;
    mergedFloats[i + 1] = cy + ny;
    mergedFloats[i + 2] = cz + nz;
  }

  mergedMeshGlobal.updateData(mergedFloats.buffer);
}

function selectObject(meta) {
  selectedObject = meta;

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

function deleteObject(meta, scene) {
  if (!meta || !mergedFloats) return;

  const startFloat = meta.startIndex * FLOATS_PER_SPLAT;
  const endFloat = meta.endIndex * FLOATS_PER_SPLAT;

  const before = mergedFloats.slice(0, startFloat);
  const after = mergedFloats.slice(endFloat);

  mergedFloats = new Float32Array(before.length + after.length);
  mergedFloats.set(before, 0);
  mergedFloats.set(after, before.length);

  // Remove metadata
  const removedCount = meta.endIndex - meta.startIndex;
  objectMetadataList = objectMetadataList.filter((m) => m.id !== meta.id);

  // Re-index remaining objects
  for (const m of objectMetadataList) {
    if (m.startIndex > meta.startIndex) {
      m.startIndex -= removedCount;
      m.endIndex -= removedCount;
    }
  }

  // Dispose old mesh COMPLETELY
  if (mergedMeshGlobal) {
    mergedMeshGlobal.dispose();
    mergedMeshGlobal = null;
  }

  // Create NEW merged mesh and upload NEW data
  mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    scene
  );
  mergedMeshGlobal.updateData(mergedFloats.buffer);

  // Force refresh (important)
  mergedMeshGlobal.computeWorldMatrix(true);
  mergedMeshGlobal.refreshBoundingInfo();

  // Clear selection
  if (selectedObject && selectedObject.id === meta.id) {
    selectedObject = null;
    if (selectionBox) {
      selectionBox.dispose();
      selectionBox = null;
    }
  }

  // Refresh UI
  const sg = document.getElementById("sceneGraph");
  if (sg) sg.remove();
  requestAnimationFrame(() => createSceneGraphUI(scene, mergedMeshGlobal));

  console.log("Deletion complete. New merged count:", mergedFloats.length);
}

async function handleFileUpload(files, scene) {
  for (const file of files) {
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

    console.log(
      "SPLAT FORMAT:",
      Array.from(new Float32Array(meta.splatsCopy).slice(0, 32))
    );

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

      scene.onAfterRenderObservable.addOnce(() => {
        if (mergedMeshGlobal.refreshBoundingInfo) {
          mergedMeshGlobal.computeWorldMatrix(true);
          mergedMeshGlobal.refreshBoundingInfo();
        }
      });
    } catch (e) {
      console.error("handleFileUpload: mergedMeshGlobal recreation failed:", e);
    }

    meta.startIndex = startIndex;
    meta.splatCount = meta.splatsCopy.length / FLOATS_PER_SPLAT;
    meta.endIndex = meta.startIndex + meta.splatCount;

    newMesh.dispose();
  }

  const sg = document.getElementById("sceneGraph");
  if (sg) sg.remove();
  requestAnimationFrame(() => createSceneGraphUI(scene, mergedMeshGlobal));
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

window.addEventListener("keydown", (event) => {
  if (!selectedObject) return;

  const step = 0.1; // movement step size (adjust as needed)

  switch (event.key.toLowerCase()) {
    // translation controls (fixed orientation)
    case "w":
      translateObject(selectedObject, 0, -step, 0);
      break; // up
    case "s":
      translateObject(selectedObject, 0, step, 0);
      break; // down
    case "a":
      translateObject(selectedObject, -step, 0, 0);
      break; // left
    case "d":
      translateObject(selectedObject, step, 0, 0);
      break; // right
    case "q":
      translateObject(selectedObject, 0, 0, -step);
      break; // forward (into screen)
    case "e":
      translateObject(selectedObject, 0, 0, step);
      break; // backward (toward camera)

    case "z":
      scaleObjectPerSplat(selectedObject, 1.05);
      break;

    case "x":
      scaleObjectPerSplat(selectedObject, 0.95);
      break;

    case "y":
      rotateObject(selectedObject, "z", -5);
      break; // roll left
    case "h":
      rotateObject(selectedObject, "z", 5);
      break; // roll right
    case "u":
      rotateObject(selectedObject, "y", -5);
      break; // yaw left
    case "j":
      rotateObject(selectedObject, "y", 5);
      break; // yaw right
    case "i":
      rotateObject(selectedObject, "x", -5);
      break; // pitch down
    case "k":
      rotateObject(selectedObject, "x", 5);
      break; // pitch up
    case "r":
      deleteObject(selectedObject, scene);
      break; // delete selected object
  }
});

window.addEventListener("resize", function () {
  engine.resize();
});
