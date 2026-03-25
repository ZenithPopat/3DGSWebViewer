import * as BABYLON from "@babylonjs/core";
import { state } from "../src/state/state.js";

function rayIntersectsAABB(ray, min, max) {
  let tmin = (min.x - ray.origin.x) / ray.direction.x;
  let tmax = (max.x - ray.origin.x) / ray.direction.x;

  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (min.y - ray.origin.y) / ray.direction.y;
  let tymax = (max.y - ray.origin.y) / ray.direction.y;

  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if (tmin > tymax || tymin > tmax) return false;

  tmin = Math.max(tmin, tymin);
  tmax = Math.min(tmax, tymax);

  let tzmin = (min.z - ray.origin.z) / ray.direction.z;
  let tzmax = (max.z - ray.origin.z) / ray.direction.z;

  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if (tmin > tzmax || tzmin > tmax) return false;

  return true;
}

export function enableObjectPicking(scene) {
  scene.onPointerObservable.add((pointerInfo) => {
    console.log("POINTER EVENT", pointerInfo.type);
    if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;

    const evt = pointerInfo.event;
    if (evt.target && evt.target.id !== "renderCanvas") return;

    const ray = scene.createPickingRay(
      scene.pointerX,
      scene.pointerY,
      BABYLON.Matrix.Identity(),
      scene.activeCamera,
    );

    let picked = null;

    for (const meta of state.metadataList) {
      const box = meta.boundingBox;
      if (!box || !box.min || !box.max) continue;

      if (rayIntersectsAABB(ray, box.min, box.max)) {
        picked = meta;
        break;
      }
    }

    if (picked) {
      state.selectedObject = picked;
    } else {
      state.selectedObject = null;
      state.selection.splatIndices.clear();
      state.selection.previewHighlight = false;
    }

    if (state.onSelectionChanged) {
      state.onSelectionChanged();
    }
  });
}
