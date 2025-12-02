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

  window.addEventListener("resize", () => engine.resize());
})();
