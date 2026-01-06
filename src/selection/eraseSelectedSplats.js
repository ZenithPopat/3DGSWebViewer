import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "./rebuildWithSelection.js";

export function eraseSelectedSplats() {
  const selected = state.selection.splatIndices;

  if (selected.size === 0) {
    console.warn("No splats selected to erase");
    return;
  }

  for (const index of selected) {
    state.erase.erasedSplatIndices.add(index);
  }

  // Clear selection after erase
  selected.clear();

  rebuildMergedMeshWithSelection();

  console.log(`Erased ${state.erase.erasedSplatIndices.size} splats`);
}
