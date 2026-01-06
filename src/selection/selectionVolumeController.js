import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

/* ----------------------------------
   Public API
---------------------------------- */

export function enableSelectionVolume() {
  const scene = state.scene;
  const tool = state.selectionTool;

  if (!scene || tool.mesh) return;

  // Create sphere
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "selectionSphere",
    { diameter: tool.radius * 2, segments: 24 },
    scene
  );

  // Material
  const mat = new BABYLON.StandardMaterial("selectionSphereMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  mat.alpha = 0.2;
  mat.wireframe = true;

  sphere.material = mat;
  sphere.isPickable = false;
  sphere.position.set(0, 0, 0);

  // ✅ Correct gizmo setup
  const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
  const gizmo = new BABYLON.PositionGizmo(utilLayer);
  gizmo.attachedMesh = sphere;

  tool.mesh = sphere;
  tool.gizmo = gizmo;
  tool.utilLayer = utilLayer;
  tool.enabled = true;
}

export function disableSelectionVolume() {
  const tool = state.selectionTool;

  if (tool.gizmo) {
    tool.gizmo.dispose();
    tool.gizmo = null;
  }

  if (tool.utilLayer) {
    tool.utilLayer.dispose();
    tool.utilLayer = null;
  }

  if (tool.mesh) {
    tool.mesh.dispose();
    tool.mesh = null;
  }

  tool.enabled = false;
}

export function setSelectionVolumeRadius(radius) {
  const tool = state.selectionTool;
  tool.radius = radius;

  if (!tool.mesh) return;

  const d = radius * 2;
  tool.mesh.scaling.set(d, d, d);
}

export function isSelectionVolumeEnabled() {
  return state.selectionTool.enabled;
}
