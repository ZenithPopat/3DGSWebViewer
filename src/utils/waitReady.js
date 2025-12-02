export function waitForGaussianMeshReady(mesh) {
  return new Promise((resolve) => {
    // Newer versions: onReadyObservable exists
    if (mesh.onReadyObservable && mesh.onReadyObservable.addOnce) {
      mesh.onReadyObservable.addOnce(() => resolve());
      return;
    }

    // Fallback: poll splatsData
    const check = () => {
      if (mesh.splatsData && mesh.splatsData.byteLength > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });
}
