import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

export function createSelectionSphere() {
  const scene = state.scene;
  if (!scene || state.selectionTool.mesh) return;

  const radius = state.selectionTool.radius;

  // Create sphere
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "selectionSphere",
    { diameter: radius * 2, segments: 24 },
    scene
  );

  // Transparent material
  const mat = new BABYLON.StandardMaterial("selectionSphereMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  mat.alpha = 0.2;
  mat.wireframe = true;

  sphere.material = mat;
  sphere.isPickable = false;
  sphere.position.set(0, 0, 0);

  // Attach position gizmo
  const gizmo = new BABYLON.PositionGizmo(scene);
  gizmo.attachedMesh = sphere;

  state.selectionTool.mesh = sphere;
  state.selectionTool.gizmo = gizmo;
  state.selectionTool.enabled = true;
}
