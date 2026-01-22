import { state } from "../state/state.js";
import { rebuildMergedMeshFromData } from "./rebuildWithSelection.js";

export function eraseSelectedSplats() {
  const selected = state.selection.splatIndices;
  if (selected.size === 0) return;

  for (const index of selected) {
    state.erase.erasedSplatIndices.add(index);
  }

  selected.clear();
  state.selection.previewHighlight = false;

  rebuildMergedMeshFromData();
}
