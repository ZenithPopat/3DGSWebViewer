import { state } from "../state/state.js";
import { selectObject } from "./splatSelection.js";

export function refreshSelectionBox(meta) {
  if (state.selectedObject?.id !== meta.id) return;

  // Delete old selection mesh
  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  // Recreate selection box with updated bounding box
  selectObject(meta, state.scene);
}
