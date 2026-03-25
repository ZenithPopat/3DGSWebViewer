import * as BABYLON from "@babylonjs/core";
import { state } from "../state/state.js";
import { recenterParsedSplats } from "./recenterSplats.js";
import { bakeTranslateParsed } from "../utils/bakeTransformUtils.js";
import { recomputeBoundingBoxForParsed } from "./splatBounds.js";
import { rebuildMergedMeshFromData } from "../selection/rebuildWithSelection.js";
import { refreshSelectionBox } from "./updateSelectionBox.js";

export function recenterObjectToCamera(meta) {
  const camera = state.scene?.activeCamera;
  if (!meta || !camera) return;

  const target =
    camera.getTarget?.() ?? camera.target ?? BABYLON.Vector3.Zero();

  bakeTranslateParsed(meta, target.x, target.y, target.z);

  recomputeBoundingBoxForParsed(meta);
  rebuildMergedMeshFromData();

  if (state.selectedObject?.id === meta.id) {
    refreshSelectionBox(meta);
  }
}
