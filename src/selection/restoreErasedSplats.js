import { state } from "../state/state.js";
import { rebuildMergedMeshFromData } from "./rebuildWithSelection.js";
import { recomputeBoundingBoxForParsed } from "../splat/splatBounds.js";

export function restoreLastErasedSplats() {
  if (!state.eraseBackup.length) return;

  const batch = state.eraseBackup.pop();

  // Restore splats to their original objects
  for (const { metaId, data } of batch) {
    const meta = state.metadataList.find((m) => m.id === metaId);
    if (!meta) continue;

    meta.parsed.push(data);
  }

  // Recompute bounds
  for (const meta of state.metadataList) {
    if (meta.parsed.length > 0) {
      recomputeBoundingBoxForParsed(meta);
    } else {
      meta.boundingBox = null;
    }
  }

  rebuildMergedMeshFromData();
}
