import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "./rebuildWithSelection.js";
import { recomputeBoundingBoxForParsed } from "../splat/splatBounds.js";
import { refreshSelectionBox } from "../splat/updateSelectionBox.js";

export function translateSelectedSplats(dx, dy, dz) {
  if (state.selection.splatIndices.size === 0) return;

  let globalIndex = 0;

  for (const meta of state.metadataList) {
    for (const s of meta.parsed) {
      if (state.selection.splatIndices.has(globalIndex)) {
        s.px += dx;
        s.py += dy;
        s.pz += dz;
      }
      globalIndex++;
    }

    recomputeBoundingBoxForParsed(meta);
    refreshSelectionBox(meta);
  }

  rebuildMergedMeshWithSelection();
}
