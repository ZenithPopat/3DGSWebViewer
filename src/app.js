import { createScene } from "./scene/setupScene.js";
import { setupKeyboardControls } from "./scene/keyboardControls.js";
import { state } from "./state/state.js";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

(async () => {
  const { engine } = await createScene();

  setupKeyboardControls();

  engine.runRenderLoop(() => {
    if (state.scene) {
      state.scene.render();
    }
  });

  const fpsDiv = document.createElement("div");
  fpsDiv.style.position = "fixed";
  fpsDiv.style.top = "8px";
  fpsDiv.style.right = "8px";
  fpsDiv.style.color = "#0f0";
  fpsDiv.style.fontFamily = "monospace";
  fpsDiv.style.zIndex = 9999;
  fpsDiv.style.pointerEvents = "none";
  document.body.appendChild(fpsDiv);

  state.scene.onBeforeRenderObservable.add(() => {
    fpsDiv.textContent = `FPS: ${engine.getFps().toFixed(1)}`;
  });

  window.addEventListener("resize", () => engine.resize());
})();
