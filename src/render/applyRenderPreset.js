import { state } from "../state/state.js";
import {
  setVisualHelpersEnabled,
  setSelectionHelperVisibility,
} from "../scene/helperVisibility.js";

export function applyRenderPreset(presetName, engine) {
  const preset = state.presets[presetName];
  if (!preset) return;

  state.renderPreset = presetName;

  // Resolution scaling
  engine.setHardwareScalingLevel(preset.hardwareScaling);

  // Visual helpers
  setVisualHelpersEnabled(preset.showBoundingBoxes);

  // Grid visibility
  if (state.editorGrid) {
    state.editorGrid.setEnabled(preset.showGrid);
  }

  // Selection helper visibility
  setSelectionHelperVisibility(preset.showSelectionHelper);

  // --- Render filters ---
  state.renderSettings.alphaThreshold = preset.alphaThreshold;
  state.renderSettings.maxViewDistance = preset.maxViewDistance;

  // Sync sliders
  state.renderSettings.pendingAlphaThreshold = preset.alphaThreshold;
  state.renderSettings.pendingMaxViewDistance = preset.maxViewDistance;
}
