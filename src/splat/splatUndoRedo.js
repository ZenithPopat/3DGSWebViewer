import { state } from "../state/state.js";
import { refreshSelectionBox } from "../splat/updateSelectionBox.js";

export function undoTransform() {
  const meta = state.selectedObject;
  if (!meta || !meta.undoStack.length) return;

  const prev = meta.undoStack.pop();

  meta.redoStack.push({
    position: meta.localTransform.position.clone(),
    rotation: meta.localTransform.rotation.clone(),
    scale: meta.localTransform.scale.clone(),
  });

  meta.localTransform.position.copyFrom(prev.position);
  meta.localTransform.rotation.copyFrom(prev.rotation);
  meta.localTransform.scale.copyFrom(prev.scale);
  refreshSelectionBox(meta);
}

export function redoTransform() {
  const meta = state.selectedObject;
  if (!meta || !meta.redoStack.length) return;

  const next = meta.redoStack.pop();

  meta.undoStack.push({
    position: meta.localTransform.position.clone(),
    rotation: meta.localTransform.rotation.clone(),
    scale: meta.localTransform.scale.clone(),
  });

  meta.localTransform.position.copyFrom(next.position);
  meta.localTransform.rotation.copyFrom(next.rotation);
  meta.localTransform.scale.copyFrom(next.scale);
  refreshSelectionBox(meta);
}
