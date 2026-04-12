import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { unpackSplatRecord } from "../splat/splatFormat.js";
import { recomputeBoundingBoxForParsed } from "../splat/splatBounds.js";
import { buildMergedBytes } from "../splat/splatMerge.js";
import { createSceneGraphUI } from "../scene/createUI.js";
import { waitForGaussianMeshReady } from "../utils/waitReady.js";
import { computeSceneBounds } from "../utils/computeSceneBounds.js";

export async function handleFileUpload(files) {
  const scene = state.scene;

  for (const file of files) {
    const loadStart = performance.now();
    const url = URL.createObjectURL(file);

    const tempMesh = new BABYLON.GaussianSplattingMesh(
      file.name,
      url,
      scene,
      true
    );

    await waitForGaussianMeshReady(tempMesh);

    if (!tempMesh.splatsData) {
      console.error("❌ ERROR: tempMesh has no splatsData:", tempMesh);
      tempMesh.dispose();
      continue;
    }

    const rawBytes = new Uint8Array(tempMesh.splatsData);
    const splatCount = Math.floor(rawBytes.length / 32);

    state.stats.totalSplats += splatCount;

    const meta = {
      id: crypto.randomUUID(), // unique ID
      fileName: file.name,
      parsed: [],
      splatCount,
      startIndex: 0,
      endIndex: 0,
      boundingBox: null,
      visible: true,
      hasUnbakedTransform: false,
      localTransform: {
        position: new BABYLON.Vector3(0, 0, 0),
        rotation: new BABYLON.Quaternion(0, 0, 0, 1),
        scale: new BABYLON.Vector3(1, 1, 1),
      },
      undoStack: [],
      redoStack: [],
    };

    // Parse every splat into JS objects
    for (let i = 0; i < splatCount; i++) {
      meta.parsed[i] = unpackSplatRecord(rawBytes, i);
    }

    // Compute bbox
    recomputeBoundingBoxForParsed(meta);

    // Add to global metadata list
    state.metadataList.push(meta);

    state.sceneStats.bounds = computeSceneBounds(state.metadataList);

    // Rebuild merged splats
    state.mergedBytes = buildMergedBytes(state.metadataList);

    // Rebuild merged GaussianSplattingMesh
    if (state.mergedMesh) {
      state.mergedMesh.dispose();
    }

    state.mergedMesh = new BABYLON.GaussianSplattingMesh(
      "merged",
      undefined,
      scene
    );

    try {
      state.mergedMesh.updateData(state.mergedBytes.buffer);
    } catch (err) {
      console.error("mergedMesh.updateData failed → recreating mesh:", err);
      state.mergedMesh.dispose();
      state.mergedMesh = new BABYLON.GaussianSplattingMesh(
        "merged",
        undefined,
        scene
      );
      state.mergedMesh.updateData(state.mergedBytes.buffer);
    }

    state.mergedMesh.position.set(0, 0, 0);
    state.mergedMesh.rotationQuaternion = null;
    state.mergedMesh.rotation.set(0, 0, 0);

    state.mergedMesh.computeWorldMatrix(true);
    state.mergedMesh.refreshBoundingInfo();

    const loadEnd = performance.now();
    const loadTime = loadEnd - loadStart;

    state.performance.loadTimes = state.performance.loadTimes || [];
    state.performance.loadTimes.push(loadTime);

    tempMesh.dispose();
  }

  // Refresh UI
  createSceneGraphUI();
}
