import { createScene } from "./scene/setupScene.js";
import { setupKeyboardControls } from "./scene/keyboardControls.js";
import { state } from "./state/state.js";
import {
  isEffectivelyInteracting,
  getInteractionMode,
} from "./utils/interactionState.js";

BABYLON.Logger.LogLevels = BABYLON.Logger.ErrorLogging;

function formatCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

(async () => {
  const { engine } = await createScene();

  setupKeyboardControls();

  const interacting = isEffectivelyInteracting();
  let lastInteracting = null;
  const IDLE_SCALING = 1.0;
  const INTERACTION_SCALING = 1.5;
  let lastScalingLevel = IDLE_SCALING;

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
    Splats: ${formatCount(state.stats.visibleSplats)} / ${formatCount(state.stats.totalSplats)}<br/>
    Mode: ${getInteractionMode()}
  `;
  });

  engine.runRenderLoop(() => {
    if (!state.scene) return;

    const interacting = isEffectivelyInteracting();
    const targetScaling = interacting
      ? state.interactionQuality.interactionScaling
      : state.interactionQuality.idleScaling;

    if (targetScaling !== lastScalingLevel) {
      engine.setHardwareScalingLevel(targetScaling);
      lastScalingLevel = targetScaling;
    }

    state.scene.render();
  });

  // engine.runRenderLoop(() => {
  //   if (state.scene) {
  //     state.scene.render();
  //   }
  // });

  window.addEventListener("resize", () => engine.resize());
})();
