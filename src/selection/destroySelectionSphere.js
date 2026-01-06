import { state } from "../state/state.js";

export function destroySelectionSphere() {
  const tool = state.selectionTool;

  if (tool.gizmo) {
    tool.gizmo.dispose();
    tool.gizmo = null;
  }

  if (tool.mesh) {
    tool.mesh.dispose();
    tool.mesh = null;
  }

  tool.enabled = false;
}
