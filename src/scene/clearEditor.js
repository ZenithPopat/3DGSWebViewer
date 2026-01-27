import { state } from "../state/state.js";
import { createSceneGraphUI } from "./createUI.js";

export function clearEditor() {
  if (!confirm("Clear all loaded objects and reset the editor?")) return;

  if (state.mergedMesh) {
    state.mergedMesh.dispose();
    state.mergedMesh = null;
  }

  state.metadataList.length = 0;
  state.mergedBytes = null;
  state.mergeMap = [];

  state.selectedObject = null;
  state.selection.splatIndices.clear();
  state.selection.previewHighlight = false;

  state.stats.totalSplats = 0;
  state.stats.visibleSplats = 0;

  state.sceneStats.bounds = null;

  if (state.selectionTool.mesh) {
    state.selectionTool.mesh.dispose();
    state.selectionTool.mesh = null;
  }
  if (state.selectionTool.gizmo) {
    state.selectionTool.gizmo.dispose();
    state.selectionTool.gizmo = null;
  }

  createSceneGraphUI();
}
