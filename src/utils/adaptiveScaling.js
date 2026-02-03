import { state } from "../state/state.js";

export function updateAdaptiveScaling(engine, fps) {
  const cfg = state.adaptiveScaling;
  if (!cfg.enabled) return;

  let target;

  if (fps < cfg.targetFPS * 0.7) {
    target = cfg.maxScale;
  } else if (fps < cfg.targetFPS) {
    // interpolate between min & max
    const t = (cfg.targetFPS - fps) / (cfg.targetFPS * 0.3);
    target = cfg.minScale + t * (cfg.maxScale - cfg.minScale);
  } else {
    target = cfg.minScale;
  }

  // Smooth transition (prevents flicker)
  cfg.currentScale += (target - cfg.currentScale) * cfg.smoothing;

  engine.setHardwareScalingLevel(cfg.currentScale);
}
