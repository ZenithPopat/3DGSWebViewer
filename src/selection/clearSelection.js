import { state } from "../state/state.js";
import { rebuildMergedMeshFromData } from "./rebuildWithSelection.js";

export function clearSelection() {
  if (state.selection.splatIndices.size === 0) return;

  state.selection.splatIndices.clear();

  if (state.selection.previewHighlight) {
    state.selection.previewHighlight = false;
    rebuildMergedMeshFromData(); // restore original colors
  }

  // rebuildMergedMeshWithSelection();

  // console.log("Selection cleared");
}
