import { createScene } from "./scene/setupScene.js";
import { setupKeyboardControls } from "./scene/keyboardControls.js";
import { state } from "./state/state.js";
import {
  isEffectivelyInteracting,
  getInteractionMode,
} from "./utils/interactionState.js";
import { updateAdaptiveScaling } from "./utils/adaptiveScaling.js";

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

  const fps = engine.getFps();
  updateAdaptiveScaling(engine, fps);

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
    let ram = "N/A";
    if (performance.memory) {
      ram = (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + " MB";
    }

    // GPU estimate
    const bytesPerSplat = 32;
    const gpuMB = (state.stats.totalSplats * bytesPerSplat) / (1024 * 1024);
    const lastBake = state.performance.bakeTimes?.slice(-1)[0] ?? 0;
    const lastLoad = state.performance.loadTimes?.slice(-1)[0] ?? 0;

    const lastMerge = state.performance.mergeTimes?.slice(-1)[0] ?? 0;

    fpsDiv.innerHTML = `
    FPS: ${engine.getFps().toFixed(1)}<br/>
    AVG: ${state.performance.avgFps.toFixed(1)}<br/>
    MIN: ${state.performance.minFps.toFixed(1)}<br/>
    MAX: ${state.performance.maxFps.toFixed(1)}<br/>

    Frame: ${state.performance.lastRenderTime.toFixed(2)} ms<br/>
    Avg Frame: ${state.performance.avgRenderTime.toFixed(2)} ms<br/>

    Load: ${lastLoad.toFixed(2)} ms<br/>
    Merge: ${lastMerge.toFixed(2)} ms<br/>
    Bake: ${lastBake ? lastBake.toFixed(2) + " ms" : "—"}<br/>

    RAM: ${ram}<br/>
    GPU (est): ${gpuMB.toFixed(2)} MB<br/>

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

    const start = performance.now();

    state.scene.render();

    const end = performance.now();
    const renderTime = end - start;

    const p = state.performance;

    p.lastRenderTime = renderTime;

    p.renderSamples.push(renderTime);
    if (p.renderSamples.length > 120) p.renderSamples.shift();

    let sum = 0;
    for (let i = 0; i < p.renderSamples.length; i++) {
      sum += p.renderSamples[i];
    }

    p.avgRenderTime = sum / p.renderSamples.length;

    // state.scene.render();
  });

  // engine.runRenderLoop(() => {
  //   if (state.scene) {
  //     state.scene.render();
  //   }
  // });

  window.addEventListener("resize", () => engine.resize());
})();

window.captureMetrics = () => {
  const p = state.performance;

  const snapshot = {
    splatsVisible: state.stats.visibleSplats,
    splatsTotal: state.stats.totalSplats,

    fps: p.avgFps,
    minFps: p.minFps,
    maxFps: p.maxFps,

    frameTime: p.avgRenderTime,

    loadTime: p.loadTimes?.slice(-1)[0] || 0,
    mergeTime: p.mergeTimes?.slice(-1)[0] || 0,
    bakeTime: p.bakeTimes?.slice(-1)[0] || 0,

    ram: performance.memory
      ? performance.memory.usedJSHeapSize / 1048576
      : null,
  };

  console.table(snapshot);
  return snapshot;
};
