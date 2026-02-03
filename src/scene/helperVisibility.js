import { state } from "../state/state.js";

export function setVisualHelpersEnabled(enabled) {
  if (state.editorGrid) {
    state.editorGrid.setEnabled(enabled);
  }

  if (state.selectionBox) {
    state.selectionBox.setEnabled(enabled);
  }
}

export function setSelectionHelperVisibility(visible) {
  const mesh = state.selectionTool?.mesh;
  if (!mesh) return;

  // IMPORTANT: visibility, not setEnabled
  mesh.visibility = visible ? 1 : 0;
}
