import { state } from "../state/state.js";

export function updateSelectionSphereRadius(radius) {
  const tool = state.selectionTool;
  tool.radius = radius;

  if (!tool.mesh) return;

  tool.mesh.scaling.set(radius * 2, radius * 2, radius * 2);
}
