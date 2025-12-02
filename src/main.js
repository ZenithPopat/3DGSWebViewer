// Clean final viewer — starts empty, loads via UI only
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let currentScene = null;
let selectedObject = null;
const SPLAT_RECORD_BYTES = 32;
let objectMetadataList = [];
let mergedMeshGlobal = null;
let mergedBytes = null;
let selectionBox = null;

// =========================================================
// SECTION 1 — PACK / UNPACK FOR 32-BYTE SPLAT FORMAT
// =========================================================

function readF32(bytes, byteOffset) {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getFloat32(byteOffset, true);
}
function writeF32(bytes, byteOffset, val) {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).setFloat32(byteOffset, val, true);
}

function clamp01(x) {
  if (!isFinite(x)) return 0;
  return Math.max(-1, Math.min(1, x));
}

function unpackSplatRecord(rawBytes, recordIndex) {
  const base = recordIndex * SPLAT_RECORD_BYTES;

  if (base + SPLAT_RECORD_BYTES > rawBytes.length) {
    console.error(
      "unpackSplatRecord: out-of-bounds recordIndex",
      recordIndex,
      rawBytes.length
    );
    return null;
  }

  const px = readF32(rawBytes, base + 0);
  const py = -readF32(rawBytes, base + 4);
  const pz = readF32(rawBytes, base + 8);

  const sx = readF32(rawBytes, base + 12);
  const sy = readF32(rawBytes, base + 16);
  const sz = readF32(rawBytes, base + 20);

  const r = rawBytes[base + 24];
  const g = rawBytes[base + 25];
  const b = rawBytes[base + 26];
  const a = rawBytes[base + 27];

  let q0 = (rawBytes[base + 28] - 128) / 128.0;
  let q1 = (rawBytes[base + 29] - 128) / 128.0;
  let q2 = (rawBytes[base + 30] - 128) / 128.0;
  let q3 = (rawBytes[base + 31] - 128) / 128.0;

  if (isFinite(q0) && isFinite(q1) && isFinite(q2) && isFinite(q3)) {
    q1 = -q1;
    q3 = -q3;
  } else {
    console.warn(
      "unpackSplatRecord: quaternion contains non-finite values",
      recordIndex,
      q0,
      q1,
      q2,
      q3
    );
    q0 = 1;
    q1 = 0;
    q2 = 0;
    q3 = 0;
  }

  return { px, py, pz, sx, sy, sz, r, g, b, a, q0, q1, q2, q3 };
}

function packSplatRecord(rawBytes, recordIndex, s) {
  const base = recordIndex * SPLAT_RECORD_BYTES;

  if (base + SPLAT_RECORD_BYTES > rawBytes.length) {
    console.error(
      "packSplatRecord: out-of-bounds recordIndex",
      recordIndex,
      rawBytes.length
    );
    return;
  }

  const px = Number(s.px) || 0;
  const py = -Number(s.py) || 0; // undo flip here
  const pz = Number(s.pz) || 0;

  writeF32(rawBytes, base + 0, px);
  writeF32(rawBytes, base + 4, py);
  writeF32(rawBytes, base + 8, pz);

  writeF32(rawBytes, base + 12, Number(s.sx) || 0);
  writeF32(rawBytes, base + 16, Number(s.sy) || 0);
  writeF32(rawBytes, base + 20, Number(s.sz) || 0);

  rawBytes[base + 24] = s.r & 0xff || 0;
  rawBytes[base + 25] = s.g & 0xff || 0;
  rawBytes[base + 26] = s.b & 0xff || 0;
  rawBytes[base + 27] = s.a & 0xff || 0;

  let q0 = Number(s.q0);
  let q1 = Number(s.q1);
  let q2 = Number(s.q2);
  let q3 = Number(s.q3);

  if (!isFinite(q0) || !isFinite(q1) || !isFinite(q2) || !isFinite(q3)) {
    q0 = 1;
    q1 = 0;
    q2 = 0;
    q3 = 0;
  }

  const q0f = clamp01(q0);
  const q1f = clamp01(-q1);
  const q2f = clamp01(q2);
  const q3f = clamp01(-q3);

  rawBytes[base + 28] = Math.round(q0f * 128 + 128) & 0xff;
  rawBytes[base + 29] = Math.round(q1f * 128 + 128) & 0xff;
  rawBytes[base + 30] = Math.round(q2f * 128 + 128) & 0xff;
  rawBytes[base + 31] = Math.round(q3f * 128 + 128) & 0xff;
}

// =========================================================
// SECTION 2 — BUILD MERGED BYTE BUFFER FROM ALL OBJECTS
// =========================================================
function buildMergedBytes(metadataList) {
  let totalSplats = 0;
  for (const m of metadataList) {
    if (m && m.parsed) totalSplats += m.parsed.length;
  }

  const totalBytes = totalSplats * SPLAT_RECORD_BYTES;
  const merged = new Uint8Array(totalBytes);

  let writeRec = 0;
  for (const meta of metadataList) {
    if (!meta || !meta.parsed) continue;

    meta.startIndex = writeRec;
    meta.splatCount = meta.parsed.length;

    for (let i = 0; i < meta.splatCount; i++) {
      packSplatRecord(merged, meta.startIndex + i, meta.parsed[i]);
    }

    writeRec += meta.splatCount;
    meta.endIndex = meta.startIndex + meta.splatCount;
  }

  return merged;
}

// =========================================================
// SECTION 3 — Commit one object's parsed splats back into mergedBytes
// (partial update of mergedBytes)
// =========================================================
function commitMetaToMergedBytes(meta) {
  if (!mergedBytes || !meta || !meta.parsed) return;

  for (let i = 0; i < meta.splatCount; i++) {
    packSplatRecord(mergedBytes, meta.startIndex + i, meta.parsed[i]);
  }
}

// =========================================================
// SECTION 4 — Quaternion Math Helpers (for rotations)
// =========================================================
function quatMultiply(q1, q2) {
  // q = [w, x, y, z]
  const [w1, x1, y1, z1] = q1;
  const [w2, x2, y2, z2] = q2;
  return [
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
  ];
}
function quatNormalize(q) {
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  if (l < 1e-9) return [1, 0, 0, 0];
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}
function axisAngleToQuat(axis, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const half = angleRad / 2;
  const s = Math.sin(half);
  const c = Math.cos(half);
  switch (axis) {
    case "x":
      return [c, s, 0, 0];
    case "y":
      // return [c, 0, s, 0];
      return [c, 0, -s, 0];
    case "z":
      return [c, 0, 0, s];
    default:
      return [1, 0, 0, 0];
  }
}

// =========================================================
// UI: scene graph
// =========================================================
function createSceneGraphUI(scene, mergedMesh) {
  // remove old
  const old = document.getElementById("sceneGraph");
  if (old) old.remove();

  const container = document.createElement("div");
  container.id = "sceneGraph";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.width = "260px";
  container.style.maxHeight = "85%";
  container.style.overflowY = "auto";
  container.style.background = "rgba(25,25,25,0.9)";
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
  container.appendChild(uploadBtn);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".splat";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    await handleFileUpload(files, currentScene);
  });
  container.appendChild(fileInput);

  uploadBtn.onclick = () => fileInput.click();

  // list objects
  objectMetadataList.forEach((meta) => {
    const entry = document.createElement("div");
    entry.className = "scene-object";
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.marginBottom = "6px";
    entry.style.cursor = "pointer";

    const label = document.createElement("span");
    label.textContent = meta.fileName.split("/").pop();
    label.style.flex = "1";
    label.style.transition = "color 0.12s";

    label.addEventListener("click", () => {
      // reset colors
      document
        .querySelectorAll(".scene-object span")
        .forEach((l) => (l.style.color = "#ddd"));
      label.style.color = "#00ffff";
      selectObject(meta);
    });

    entry.appendChild(label);

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.title = "Delete";
    delBtn.style.marginLeft = "6px";
    delBtn.style.background = "transparent";
    delBtn.style.color = "#f88";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      deleteObject(meta, currentScene);
    });
    entry.appendChild(delBtn);

    container.appendChild(entry);
  });
}

// =========================================================
// Metadata generator (lightweight; splat counts set later)
// =========================================================
function generateMetadata(gsMesh, fileName, startIndex) {
  gsMesh.computeWorldMatrix(true);
  gsMesh.refreshBoundingInfo();

  const boundingInfo = gsMesh.getBoundingInfo();
  const boundingBox = {
    min: boundingInfo.minimum.clone(),
    max: boundingInfo.maximum.clone(),
  };

  return {
    id: gsMesh.name || BABYLON.Tools.RandomId(),
    fileName,
    startIndex,
    endIndex: startIndex,
    splatCount: 0,
    boundingBox,
    color: new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
    visible: true,
    gs: gsMesh,
  };
}

// =========================================================
// Deletion (rebuild mergedBytes from remaining objects)
// =========================================================
function deleteObject(meta, scene) {
  if (!meta) return;

  objectMetadataList = objectMetadataList.filter((m) => m.id !== meta.id);

  mergedBytes = buildMergedBytes(objectMetadataList);

  if (mergedMeshGlobal) mergedMeshGlobal.dispose();
  mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    scene
  );
  mergedMeshGlobal.updateData(mergedBytes.buffer);
  mergedMeshGlobal.computeWorldMatrix(true);
  mergedMeshGlobal.refreshBoundingInfo();

  if (selectedObject && selectedObject.id === meta.id) {
    selectedObject = null;
    if (selectionBox) {
      selectionBox.dispose();
      selectionBox = null;
    }
  }

  // refresh UI
  createSceneGraphUI(scene, mergedMeshGlobal);
}

// =========================================================
// TRANSFORMS: translate / scale / rotate (per-splat, safe)
// =========================================================
function translateObject(meta, dx, dy, dz) {
  if (!meta || !meta.parsed || !mergedBytes || !mergedMeshGlobal) return;

  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];
    s.px += dx;
    s.py += dy;
    s.pz += dz;
  }

  commitMetaToMergedBytes(meta);

  try {
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  } catch (e) {
    console.error("translateObject: update failed, recreating mesh:", e);
    mergedMeshGlobal.dispose();
    mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      currentScene
    );
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  }

  meta.boundingBox.min.addInPlace(new BABYLON.Vector3(dx, dy, dz));
  meta.boundingBox.max.addInPlace(new BABYLON.Vector3(dx, dy, dz));

  if (selectionBox)
    selectionBox.position.addInPlace(new BABYLON.Vector3(dx, dy, dz));
}

function scaleObjectPerSplat(meta, scaleFactor) {
  if (!meta || !meta.parsed || !mergedBytes || !mergedMeshGlobal) return;

  // centroid
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];
    cx += s.px;
    cy += s.py;
    cz += s.pz;
  }
  cx /= meta.splatCount;
  cy /= meta.splatCount;
  cz /= meta.splatCount;

  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];
    s.px = cx + (s.px - cx) * scaleFactor;
    s.py = cy + (s.py - cy) * scaleFactor;
    s.pz = cz + (s.pz - cz) * scaleFactor;
    s.sx *= scaleFactor;
    s.sy *= scaleFactor;
    s.sz *= scaleFactor;
  }

  commitMetaToMergedBytes(meta);
  try {
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  } catch (e) {
    console.error("scaleObjectPerSplat: update failed, recreating mesh:", e);
    mergedMeshGlobal.dispose();
    mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      currentScene
    );
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  }

  recomputeBoundingBoxForParsed(meta);
  if (selectionBox) {
    selectionBox.dispose();
    selectionBox = null;
    selectObject(meta);
  }
}

function rotateObjectPerSplat(meta, axis, angleDeg) {
  if (!meta || !meta.parsed || !mergedBytes || !mergedMeshGlobal) return;

  // centroid
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];
    cx += s.px;
    cy += s.py;
    cz += s.pz;
  }
  cx /= meta.splatCount;
  cy /= meta.splatCount;
  cz /= meta.splatCount;

  const qRot = axisAngleToQuat(axis, angleDeg);

  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];

    // rotate position using quaternion
    const x = s.px - cx,
      y = s.py - cy,
      z = s.pz - cz;
    const p = [0, x, y, z];
    const qp = quatMultiply(qRot, p);
    const qInv = [qRot[0], -qRot[1], -qRot[2], -qRot[3]];
    const rotated = quatMultiply(qp, qInv);
    s.px = cx + rotated[1];
    s.py = cy + rotated[2];
    s.pz = cz + rotated[3];

    // rotate orientation quaternion
    let qCur = [s.q0, s.q1, s.q2, s.q3];
    let qNew = quatMultiply(qRot, qCur);
    qNew = quatNormalize(qNew);
    s.q0 = qNew[0];
    s.q1 = qNew[1];
    s.q2 = qNew[2];
    s.q3 = qNew[3];
  }

  commitMetaToMergedBytes(meta);
  try {
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  } catch (e) {
    console.error("rotateObjectPerSplat: update failed, recreating mesh:", e);
    mergedMeshGlobal.dispose();
    mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      currentScene
    );
    mergedMeshGlobal.updateData(mergedBytes.buffer);
  }

  recomputeBoundingBoxForParsed(meta);
  if (selectionBox) {
    selectionBox.dispose();
    selectionBox = null;
    selectObject(meta);
  }
}

// recompute bounding box from parsed splats
function recomputeBoundingBoxForParsed(meta) {
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

  for (let i = 0; i < meta.splatCount; i++) {
    const s = meta.parsed[i];
    if (s.px < min.x) min.x = s.px;
    if (s.py < min.y) min.y = s.py;
    if (s.pz < min.z) min.z = s.pz;
    if (s.px > max.x) max.x = s.px;
    if (s.py > max.y) max.y = s.py;
    if (s.pz > max.z) max.z = s.pz;
  }

  meta.boundingBox = { min, max };
}

// =========================================================
// Selection visuals
// =========================================================
function selectObject(meta) {
  selectedObject = meta;

  if (selectionBox) {
    selectionBox.dispose();
    selectionBox = null;
  }

  if (!meta || !meta.boundingBox) return;

  const min = meta.boundingBox.min;
  const max = meta.boundingBox.max;
  const size = max.subtract(min);
  const center = min.add(size.scale(0.5));

  selectionBox = BABYLON.MeshBuilder.CreateBox(
    `${meta.id}_selectionBox`,
    {
      width: Math.max(1e-6, size.x),
      height: Math.max(1e-6, size.y),
      depth: Math.max(1e-6, size.z),
    },
    currentScene
  );

  selectionBox.position.copyFrom(center);
  selectionBox.isPickable = false;

  const mat = new BABYLON.StandardMaterial("selectionMat", currentScene);
  mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  mat.wireframe = true;
  selectionBox.material = mat;

  if (currentScene.activeCamera) currentScene.activeCamera.setTarget(center);
}

// =========================================================
// File upload handler (UI) — parses .splat bytes and merges
// =========================================================
async function handleFileUpload(files, scene) {
  if (!files || files.length === 0) return;

  for (const file of files) {
    const url = URL.createObjectURL(file);

    // Temporary mesh for loading raw splatsData only
    const newMesh = new BABYLON.GaussianSplattingMesh(
      file.name,
      url,
      scene,
      true
    );

    // Wait until mesh is ready
    await new Promise((resolve) => {
      if (newMesh.onReadyObservable?.addOnce) {
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

    // --- Create metadata container ---
    const meta = {
      id: newMesh.name || BABYLON.Tools.RandomId(),
      fileName: file.name,
      rawBytes: null,
      parsed: null,
      splatCount: 0,
      startIndex: 0,
      endIndex: 0,
      boundingBox: null,
      visible: true,
      gs: null, // (newMesh will be disposed after parsing)
    };

    // --- Extract raw bytes and parse splats ---
    if (newMesh.splatsData) {
      meta.rawBytes = new Uint8Array(newMesh.splatsData);
      meta.splatCount = Math.floor(meta.rawBytes.length / SPLAT_RECORD_BYTES);
      meta.parsed = new Array(meta.splatCount);

      for (let i = 0; i < meta.splatCount; i++) {
        meta.parsed[i] = unpackSplatRecord(meta.rawBytes, i);
      }
    } else {
      console.warn("handleFileUpload: no splatsData on newMesh", file.name);
      newMesh.dispose();
      continue;
    }

    recomputeBoundingBoxForParsed(meta);

    // Compare with temporary mesh bbox
    newMesh.computeWorldMatrix(true);
    newMesh.refreshBoundingInfo();
    console.log(
      "TEMP MESH BBOX:",
      newMesh.getBoundingInfo().minimum,
      newMesh.getBoundingInfo().maximum
    );

    // --- Now add to the metadata list ---
    objectMetadataList.push(meta);

    // --- Build merged bytes from ALL parsed objects ---
    mergedBytes = buildMergedBytes(objectMetadataList);

    // --- Rebuild the merged global mesh ---
    if (mergedMeshGlobal) mergedMeshGlobal.dispose();

    mergedMeshGlobal = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      scene
    );

    mergedMeshGlobal.updateData(mergedBytes.buffer);

    // Ensure transforms/BBox of merged mesh are correct
    mergedMeshGlobal.computeWorldMatrix(true);
    mergedMeshGlobal.refreshBoundingInfo();

    // --- Rebuild UI ---
    createSceneGraphUI(scene, mergedMeshGlobal);

    // Dispose temporary file-based GS mesh
    newMesh.dispose();
  }
}

// =========================================================
// Startup: create the scene, no automatic filePaths loading (Option B)
// =========================================================
const createScene = async function () {
  const scene = new BABYLON.Scene(engine);
  currentScene = scene;

  const arcCamera = new BABYLON.ArcRotateCamera(
    "arcCamera",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  arcCamera.attachControl();
  scene.activeCamera = arcCamera;

  const light = new BABYLON.DirectionalLight(
    "directionalLight",
    new BABYLON.Vector3(-2, -3, 0),
    scene
  );

  // Start UI (empty)
  createSceneGraphUI(scene, null);

  scene.debugLayer.show();

  return scene;
};

(async () => {
  const scene = await createScene();
  engine.runRenderLoop(() => {
    scene.render();
  });
})();

// =========================================================
// Keyboard controls (operate on selectedObject)
// =========================================================
window.addEventListener("keydown", (event) => {
  if (!selectedObject) return;
  const step = 0.1;

  switch (event.key.toLowerCase()) {
    case "w":
      translateObject(selectedObject, 0, step, 0);
      break;
    case "s":
      translateObject(selectedObject, 0, -step, 0);
      break;
    case "a":
      translateObject(selectedObject, -step, 0, 0);
      break;
    case "d":
      translateObject(selectedObject, step, 0, 0);
      break;
    case "q":
      translateObject(selectedObject, 0, 0, -step);
      break;
    case "e":
      translateObject(selectedObject, 0, 0, step);
      break;

    case "z":
      scaleObjectPerSplat(selectedObject, 1.05);
      break;
    case "x":
      scaleObjectPerSplat(selectedObject, 0.95);
      break;

    case "y":
      rotateObjectPerSplat(selectedObject, "z", -5);
      break;
    case "h":
      rotateObjectPerSplat(selectedObject, "z", 5);
      break;
    case "u":
      rotateObjectPerSplat(selectedObject, "y", -5);
      break;
    case "j":
      rotateObjectPerSplat(selectedObject, "y", 5);
      break;
    case "i":
      rotateObjectPerSplat(selectedObject, "x", -5);
      break;
    case "k":
      rotateObjectPerSplat(selectedObject, "x", 5);
      break;

    case "r":
      deleteObject(selectedObject, currentScene);
      break;
  }
});

window.addEventListener("resize", () => engine.resize());
