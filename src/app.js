import { createScene } from "./scene/setupScene.js";
import { setupKeyboardControls } from "./scene/keyboardControls.js";
import { state } from "./state/state.js";
import {
  isEffectivelyInteracting,
  getEffectiveInteractionMode,
} from "./utils/interactionState.js";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

(async () => {
  const { engine } = await createScene();

  setupKeyboardControls();

  const interacting = isEffectivelyInteracting();
  let lastInteracting = null;

  const fpsDiv = document.createElement("div");
  fpsDiv.style.position = "fixed";
  fpsDiv.style.top = "8px";
  fpsDiv.style.right = "8px";
  fpsDiv.style.color = "#0f0";
  fpsDiv.style.fontFamily = "monospace";
  fpsDiv.style.zIndex = 9999;
  fpsDiv.style.pointerEvents = "none";
  document.body.appendChild(fpsDiv);

  setInterval(() => {
    if (!state.scene) return;

    const fps = engine.getFps();
    const p = state.performance;

    p.samples.push(fps);
    if (p.samples.length > 120) p.samples.shift(); // ~1 min window

    let sum = 0;
    for (let i = 0; i < p.samples.length; i++) {
      sum += p.samples[i];
    }

    p.avgFps = sum / p.samples.length;
    p.minFps = Math.min(p.minFps, fps);
    p.maxFps = Math.max(p.maxFps, fps);
  }, 400);

  state.scene.onBeforeRenderObservable.add(() => {
    fpsDiv.innerHTML = `
    FPS: ${engine.getFps().toFixed(1)}<br/>
    AVG: ${state.performance.avgFps.toFixed(1)}<br/>
    MIN: ${state.performance.minFps.toFixed(1)}<br/>
    MAX: ${state.performance.maxFps.toFixed(1)}<br/>
    Splats: ${state.stats.visibleSplats.toLocaleString()}<br/>
    Mode: ${getEffectiveInteractionMode()}
  `;
  });

  engine.runRenderLoop(() => {
    if (state.scene) {
      state.scene.render();
    }
  });

  // engine.runRenderLoop(() => {
  //   if (!state.scene) return;

  //   const interacting = isEffectivelyInteracting();

  //   if (interacting !== lastInteracting) {
  //     console.log("Effective interaction:", interacting);
  //     lastInteracting = interacting;
  //   }

  //   state.scene.render();
  // });

  window.addEventListener("resize", () => engine.resize());
})();
