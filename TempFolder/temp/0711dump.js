// Robust manual bbox compute: accepts Float32Array of floats and a worldMatrix.
// options: { stride, sampleEvery }.
// function computeBoundingBoxFromFloats(
//   floats,
//   worldMatrix = null,
//   options = {}
// ) {
//   const stride = options.stride || FLOATS_PER_SPLAT;
//   const sampleEvery = options.sampleEvery || 1;

//   const count = Math.floor(floats.length / stride);
//   const min = new BABYLON.Vector3(
//     Number.POSITIVE_INFINITY,
//     Number.POSITIVE_INFINITY,
//     Number.POSITIVE_INFINITY
//   );
//   const max = new BABYLON.Vector3(
//     Number.NEGATIVE_INFINITY,
//     Number.NEGATIVE_INFINITY,
//     Number.NEGATIVE_INFINITY
//   );

//   const pos = new BABYLON.Vector3();
//   const transformed = new BABYLON.Vector3();

//   // iterate by splat index, sampling if requested
//   for (let i = 0; i < count; i += sampleEvery) {
//     const base = i * stride;
//     pos.x = floats[base + 0];
//     pos.y = floats[base + 1];
//     pos.z = floats[base + 2];

//     if (worldMatrix) {
//       BABYLON.Vector3.TransformCoordinatesToRef(pos, worldMatrix, transformed);
//     } else {
//       transformed.copyFrom(pos);
//     }

//     // expand bounds
//     if (transformed.x < min.x) min.x = transformed.x;
//     if (transformed.y < min.y) min.y = transformed.y;
//     if (transformed.z < min.z) min.z = transformed.z;
//     if (transformed.x > max.x) max.x = transformed.x;
//     if (transformed.y > max.y) max.y = transformed.y;
//     if (transformed.z > max.z) max.z = transformed.z;
//   }

//   // Handle degenerate/no-sample case
//   if (!isFinite(min.x)) {
//     min.set(0, 0, 0);
//     max.set(0, 0, 0);
//   }

//   return { min, max };
// }

// function deleteObject(metaToDelete, scene) {
//   console.log("Deleting object:", metaToDelete.fileName);

//   // Remove it from the global list
//   objectMetadataList = objectMetadataList.filter(
//     (m) => m.id !== metaToDelete.id
//   );

//   if (objectMetadataList.length === 0) {
//     // Clear everything
//     if (mergedMeshGlobal) {
//       mergedMeshGlobal.dispose();
//       mergedMeshGlobal = null;
//     }
//     mergedFloats = null;
//     const sg = document.getElementById("sceneGraph");
//     if (sg) sg.remove();
//     createSceneGraphUI(scene, null);
//     console.log("All objects removed, scene cleared.");
//     return;
//   }

//   // Re-merge remaining splats
//   const mergeResult = mergeSplats(scene, objectMetadataList);
//   if (!mergeResult) {
//     console.error("Re-merging failed after deletion.");
//     return;
//   }

//   const { mergedMesh } = mergeResult;
//   mergedMeshGlobal = mergedMesh;

//   // Recreate UI
//   const sg = document.getElementById("sceneGraph");
//   if (sg) sg.remove();
//   createSceneGraphUI(scene, mergedMeshGlobal);

//   console.log("Object deleted and merged mesh updated.");
// }

// const deleteBtn = document.createElement("button");
//       deleteBtn.textContent = "✕";
//       deleteBtn.style.marginLeft = "8px";
//       deleteBtn.style.background = "none";
//       deleteBtn.style.color = "#f55";
//       deleteBtn.style.border = "none";
//       deleteBtn.style.cursor = "pointer";
//       deleteBtn.title = "Delete this object";
//       deleteBtn.onclick = (e) => {
//         e.stopPropagation(); // prevent selection click
//         deleteObject(meta, scene);
//       };

//       entry.appendChild(label);
//       entry.appendChild(deleteBtn);
//       container.appendChild(entry);
