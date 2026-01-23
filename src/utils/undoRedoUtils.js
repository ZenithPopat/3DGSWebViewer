export function pushUndoState(meta) {
  const { position, rotation, scale } = meta.localTransform;

  meta.undoStack.push({
    position: position.clone(),
    rotation: rotation.clone(),
    scale: scale.clone(),
  });

  meta.redoStack.length = 0;
}
