import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { buildMergedBytes } from "../splat/splatMerge.js";

export function rebuildMergedMeshWithSelection() {
  const mergedBytes = buildMergedBytes(state.metadataList);
  const view = new DataView(mergedBytes.buffer);

  let globalIndex = 0;

  for (const meta of state.metadataList) {
    const isObjectSelected =
      state.selectedObject && meta.id === state.selectedObject.id;

    for (let i = 0; i < meta.parsed.length; i++) {
      const base = globalIndex * 32;

      // Default color (already in buffer)
      let r = view.getUint8(base + 24);
      let g = view.getUint8(base + 25);
      let b = view.getUint8(base + 26);

      // 🟡 Strong highlight: selected splats
      if (state.selection.splatIndices.has(globalIndex)) {
        r = 255;
        g = 255;
        b = 0;
      }
      // 🔵 Subtle highlight: selected object
      else if (isObjectSelected) {
        r = Math.min(255, r + 30);
        g = Math.min(255, g + 60);
        b = Math.min(255, b + 80);
      }

      view.setUint8(base + 24, r);
      view.setUint8(base + 25, g);
      view.setUint8(base + 26, b);

      globalIndex++;
    }
  }

  state.mergedMesh.dispose();
  state.mergedMesh = new BABYLON.GaussianSplattingMesh(
    "merged",
    undefined,
    state.scene
  );

  state.mergedMesh.updateData(mergedBytes.buffer);
}

// export function rebuildMergedMeshWithSelection() {
//   // rebuild bytes (buildMergedBytes MUST use meta.parsed)
//   const mergedBytes = buildMergedBytes(state.metadataList);

//   // modify colors for selected splats
//   const view = new DataView(mergedBytes.buffer);

//   let index = 0;
//   for (const meta of state.metadataList) {
//     for (let i = 0; i < meta.parsed.length; i++) {
//       const base = index * 32;

//       if (state.selection.splatIndices.has(index)) {
//         // highlight color (yellow)
//         view.setUint8(base + 24, 255); // r
//         view.setUint8(base + 25, 255); // g
//         view.setUint8(base + 26, 0); // b
//       }

//       index++;
//     }
//   }

//   state.mergedMesh.dispose();
//   state.mergedMesh = new BABYLON.GaussianSplattingMesh(
//     "merged",
//     undefined,
//     state.scene
//   );

//   state.mergedMesh.updateData(mergedBytes.buffer);
// }
