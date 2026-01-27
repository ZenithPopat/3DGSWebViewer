import { state } from "../state/state.js";

let INTERACTION_GRACE_MS = 200;

export function isEffectivelyInteracting() {
  const es = state.editorState;
  if (!es) return false;

  if (es.isInteracting) return true;
  return performance.now() - es.lastInteractionTime < INTERACTION_GRACE_MS;
}

export function getInteractionMode() {
  if (!isEffectivelyInteracting()) return "IDLE";
  return state.editorState.interactionMode || "IDLE";
}

export function markInteraction(mode) {
  state.editorState.isInteracting = true;
  state.editorState.interactionMode = mode;
  state.editorState.lastInteractionTime = performance.now();
}

export function endInteraction() {
  state.editorState.isInteracting = false;
  state.editorState.interactionMode = "IDLE";
  state.editorState.lastInteractionTime = performance.now();
}
