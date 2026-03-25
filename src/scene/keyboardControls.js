import { state } from "../state/state.js";
import {
  moveObject,
  rotateObject,
  scaleObject,
} from "../splat/splatLogicalTransform.js";
import { removeObject } from "../splat/removeObject.js";

export function setupKeyboardControls() {
  window.addEventListener("keydown", (event) => {
    const meta = state.selectedObject;
    if (!meta) return;

    state.editorState.isInteracting = true;
    state.editorState.interactionMode = "TRANSFORM";
    state.editorState.lastInteractionTime = performance.now();

    const step = 0.1;

    switch (event.key.toLowerCase()) {
      case "w":
        moveObject(meta, 0, step, 0);
        break;
      case "s":
        moveObject(meta, 0, -step, 0);
        break;
      case "a":
        moveObject(meta, -step, 0, 0);
        break;
      case "d":
        moveObject(meta, step, 0, 0);
        break;
      case "q":
        moveObject(meta, 0, 0, -step);
        break;
      case "e":
        moveObject(meta, 0, 0, step);
        break;

      case "z":
        scaleObject(meta, 1.05);
        break;
      case "x":
        scaleObject(meta, 0.95);
        break;

      case "i":
        // rotateObject(meta, "x", -5);
        rotateObject(meta, BABYLON.Axis.X, -5);
        break;
      case "k":
        // rotateObject(meta, "x", 5);
        rotateObject(meta, BABYLON.Axis.X, 5);
        break;
      case "u":
        rotateObject(meta, BABYLON.Axis.Y, -5);
        break;
      case "j":
        rotateObject(meta, BABYLON.Axis.Y, 5);
        break;
      case "y":
        rotateObject(meta, BABYLON.Axis.Z, -5);
        break;
      case "h":
        rotateObject(meta, BABYLON.Axis.Z, 5);
        break;

      case "r":
        if (state.selectedObject) removeObject(state.selectedObject);
        break;
    }
  });
  window.addEventListener("keyup", () => {
    state.editorState.isInteracting = false;
    // state.editorState.interactionMode = "IDLE";
  });
}
