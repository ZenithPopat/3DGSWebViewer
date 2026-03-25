export function waitForGaussianMeshReady(mesh) {
  return new Promise((resolve) => {
    if (mesh.onReadyObservable && mesh.onReadyObservable.addOnce) {
      mesh.onReadyObservable.addOnce(() => resolve());
      return;
    }

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
