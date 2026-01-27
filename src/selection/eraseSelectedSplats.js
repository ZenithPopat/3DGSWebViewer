import { state } from "../state/state.js";
import { rebuildMergedMeshFromData } from "./rebuildWithSelection.js";
import { recomputeBoundingBoxForParsed } from "../splat/splatBounds.js";

export function eraseSelectedSplats() {
  if (state.selection.splatIndices.size === 0) return;

  const ok = confirm(
    `Erase ${state.selection.splatIndices.size} splats?\nThis action cannot be undone.`,
  );

  if (!ok) return;

  const backupBatch = [];

  // for (const meta of state.metadataList) {
  //   if (!meta.parsed) continue;

  //   const newParsed = [];
  //   let globalIndex = meta.startIndex;

  //   for (let i = 0; i < meta.parsed.length; i++, globalIndex++) {
  //     if (!state.selection.splatIndices.has(globalIndex)) {
  //       newParsed.push(meta.parsed[i]);
  //     }
  //   }

  //   meta.parsed = newParsed;
  // }

  for (const mergedIndex of state.selection.splatIndices) {
    const entry = state.mergeMap[mergedIndex];
    if (!entry) continue;

    const { meta, parsedIndex } = entry;
    const splat = meta.parsed[parsedIndex];
    if (!splat) continue;

    backupBatch.push({
      metaId: meta.id,
      data: splat,
    });
  }

  // 🔹 Store backup (only if something was erased)
  if (backupBatch.length > 0) {
    state.eraseBackup.push(backupBatch);
  }

  // 🔹 PERFORM ERASE (unchanged logic)
  for (const mergedIndex of state.selection.splatIndices) {
    const entry = state.mergeMap[mergedIndex];
    if (!entry) continue;

    const { meta, parsedIndex } = entry;
    meta.parsed[parsedIndex] = null;
  }

  // Compact arrays
  for (const meta of state.metadataList) {
    meta.parsed = meta.parsed.filter(Boolean);
  }

  // Recompute bounds
  for (const meta of state.metadataList) {
    if (meta.parsed.length > 0) {
      recomputeBoundingBoxForParsed(meta);
    } else {
      meta.boundingBox = null;
    }
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
