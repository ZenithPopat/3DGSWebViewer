import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";

function createSelectionMesh(scene, tool) {
  if (tool.shape === "sphere") {
    return BABYLON.MeshBuilder.CreateSphere(
      "selectionSphere",
      { diameter: tool.radius * 2, segments: 24 },
      scene
    );
  }

  // box
  return BABYLON.MeshBuilder.CreateBox(
    "selectionBox",
    {
      width: tool.boxSize.x * 2,
      height: tool.boxSize.y * 2,
      depth: tool.boxSize.z * 2,
    },
    scene
  );
}

function applySelectionVolumeScale() {
  const tool = state.selectionTool;
  if (!tool.mesh) return;

  if (tool.shape === "sphere") {
    const d = tool.radius * 2;
    tool.mesh.scaling.set(d, d, d);
  } else if (tool.shape === "box") {
    tool.mesh.scaling.set(
      tool.boxSize.x * 2,
      tool.boxSize.y * 2,
      tool.boxSize.z * 2
    );
  }
}

export function enableSelectionVolume() {
  const scene = state.scene;
  const tool = state.selectionTool;

  if (!scene || tool.mesh) return;

  const mesh =
    tool.shape === "sphere"
      ? BABYLON.MeshBuilder.CreateSphere(
          "selectionSphere",
          { diameter: 1 },
          scene
        )
      : BABYLON.MeshBuilder.CreateBox(
          "selectionBox",
          { width: 1, height: 1, depth: 1 },
          scene
        );

  // Material
  const mat = new BABYLON.StandardMaterial("selectionVolumeMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  mat.alpha = 0.2;
  mat.wireframe = true;

  mesh.material = mat;
  mesh.isPickable = false;
  mesh.position.set(0, 0, 0);

  // Gizmo setup
  const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
  const gizmo = new BABYLON.PositionGizmo(utilLayer);
  gizmo.attachedMesh = mesh;

  tool.mesh = mesh;
  tool.gizmo = gizmo;
  tool.utilLayer = utilLayer;
  tool.enabled = true;

  applySelectionVolumeScale();
}

export function setSelectionBoxSize(x, y, z) {
  const tool = state.selectionTool;
  tool.boxSize = { x, y, z };
  applySelectionVolumeScale();
}

export function setSelectionVolumeRadius(radius) {
  const tool = state.selectionTool;
  tool.radius = radius;
  applySelectionVolumeScale();
}

export function setSelectionShape(shape) {
  const tool = state.selectionTool;
  if (tool.shape === shape) return;

  tool.shape = shape;

  // recreate volume if enabled
  if (tool.enabled) {
    disableSelectionVolume();
    enableSelectionVolume();
  }
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

export function isSelectionVolumeEnabled() {
  return state.selectionTool.enabled;
}
