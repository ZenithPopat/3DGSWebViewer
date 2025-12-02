import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { unpackSplatRecord } from "../splat/splatFormat.js";
import { recomputeBoundingBoxForParsed } from "../splat/splatBounds.js";
import { buildMergedBytes } from "../splat/splatMerge.js";
import { createSceneGraphUI } from "../scene/createUI.js";
import { waitForGaussianMeshReady } from "../utils/waitReady.js";

export async function handleFileUpload(files) {
  const scene = state.scene;

  for (const file of files) {
    const url = URL.createObjectURL(file);

    // TEMP MESH (only used for loading splat data)
    const tempMesh = new BABYLON.GaussianSplattingMesh(
      file.name,
      url,
      scene,
      true
    );

    // SAFELY WAIT for the mesh to load in ANY Babylon version
    await waitForGaussianMeshReady(tempMesh);

    if (!tempMesh.splatsData) {
      console.error("❌ ERROR: tempMesh has no splatsData:", tempMesh);
      tempMesh.dispose();
      continue;
    }

    const rawBytes = new Uint8Array(tempMesh.splatsData);
    const splatCount = Math.floor(rawBytes.length / 32);

    // Build metadata object
    const meta = {
      id: crypto.randomUUID(), // unique ID
      fileName: file.name,
      parsed: [],
      splatCount,
      startIndex: 0,
      endIndex: 0,
      boundingBox: null,
    };

    // Parse every splat into JS objects
    for (let i = 0; i < splatCount; i++) {
      meta.parsed[i] = unpackSplatRecord(rawBytes, i);
    }

    // Compute bbox
    recomputeBoundingBoxForParsed(meta);

    // Add to global metadata list
    state.metadataList.push(meta);

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
      console.error("❌ mergedMesh.updateData failed → recreating mesh:", err);
      state.mergedMesh.dispose();
      state.mergedMesh = new BABYLON.GaussianSplattingMesh(
        "merged",
        undefined,
        scene
      );
      state.mergedMesh.updateData(state.mergedBytes.buffer);
    }

    state.mergedMesh.computeWorldMatrix(true);
    state.mergedMesh.refreshBoundingInfo();

    // Clean up temp mesh
    tempMesh.dispose();
  }

  // Refresh UI
  createSceneGraphUI();
}
