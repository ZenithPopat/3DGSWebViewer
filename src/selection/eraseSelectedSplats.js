import { state } from "../state/state.js";
import { rebuildMergedMeshFromData } from "./rebuildWithSelection.js";

export function eraseSelectedSplats() {
  if (state.selection.splatIndices.size === 0) return;

  const ok = confirm(
    `Erase ${state.selection.splatIndices.size} splats?\nThis action cannot be undone.`,
  );

  if (!ok) return;

  for (const meta of state.metadataList) {
    if (!meta.parsed) continue;

    const newParsed = [];
    let globalIndex = meta.startIndex;

    for (let i = 0; i < meta.parsed.length; i++, globalIndex++) {
      if (!state.selection.splatIndices.has(globalIndex)) {
        newParsed.push(meta.parsed[i]);
      }
    }

    meta.parsed = newParsed;
  }

  state.selection.splatIndices.clear();

  rebuildMergedMeshFromData();
}

// export function eraseSelectedSplats() {
//   const selected = state.selection.splatIndices;
//   if (selected.size === 0) return;

//   for (const index of selected) {
//     state.erase.erasedSplatIndices.add(index);
//   }

//   selected.clear();
//   state.selection.previewHighlight = false;

//   rebuildMergedMeshFromData();
// }
