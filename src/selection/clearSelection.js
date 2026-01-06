import { state } from "../state/state.js";
import { rebuildMergedMeshWithSelection } from "./rebuildWithSelection.js";

export function clearSelection() {
  if (state.selection.splatIndices.size === 0) return;

  state.selection.splatIndices.clear();

  rebuildMergedMeshWithSelection();

  console.log("Selection cleared");
}
