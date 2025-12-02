import { state } from "../state/state.js";
import {
  translateObject,
  scaleObjectPerSplat,
  rotateObjectPerSplat,
} from "../splat/splatTransforms.js";
import { removeObject } from "../splat/removeObject.js";

export function setupKeyboardControls() {
  window.addEventListener("keydown", (event) => {
    const meta = state.selectedObject;
    if (!meta) return;

    const step = 0.1;

    switch (event.key.toLowerCase()) {
      case "w":
        translateObject(meta, 0, step, 0);
        break;
      case "s":
        translateObject(meta, 0, -step, 0);
        break;
      case "a":
        translateObject(meta, -step, 0, 0);
        break;
      case "d":
        translateObject(meta, step, 0, 0);
        break;
      case "q":
        translateObject(meta, 0, 0, -step);
        break;
      case "e":
        translateObject(meta, 0, 0, step);
        break;

      case "z":
        scaleObjectPerSplat(meta, 1.05);
        break;
      case "x":
        scaleObjectPerSplat(meta, 0.95);
        break;

      case "i":
        rotateObjectPerSplat(meta, "x", -5);
        break;
      case "k":
        rotateObjectPerSplat(meta, "x", 5);
        break;
      case "u":
        rotateObjectPerSplat(meta, "y", -5);
        break;
      case "j":
        rotateObjectPerSplat(meta, "y", 5);
        break;
      case "y":
        rotateObjectPerSplat(meta, "z", -5);
        break;
      case "h":
        rotateObjectPerSplat(meta, "z", 5);
        break;

      case "r":
        if (state.selectedObject) removeObject(state.selectedObject);
        break;
    }
  });
}
