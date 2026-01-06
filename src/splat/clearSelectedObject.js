export function deselectObject() {
  if (!state.selectedObject) return;

  state.selectedObject = null;

  // Remove bounding box if present
  if (state.selectionBox) {
    state.selectionBox.dispose();
    state.selectionBox = null;
  }

  // Update visuals (remove object highlight)
  rebuildMergedMeshWithSelection();
}
