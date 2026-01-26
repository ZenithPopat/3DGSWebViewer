import { state } from "../state/state.js";

const INTERACTION_GRACE_MS = 200;

export function isEffectivelyInteracting() {
  const es = state.editorState;

  if (es.isInteracting) return true;

  return performance.now() - es.lastInteractionTime < INTERACTION_GRACE_MS;
}

export function getEffectiveInteractionMode() {
  if (!isEffectivelyInteracting()) return "IDLE";

  // During grace window, preserve last non-idle mode
  return state.editorState.interactionMode || "INTERACTING";
}

export function setInteractionGrace(ms) {
  INTERACTION_GRACE_MS = ms;
}
