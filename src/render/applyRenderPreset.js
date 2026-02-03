import { state } from "../state/state.js";
import {
  setVisualHelpersEnabled,
  setSelectionHelperVisibility,
} from "../scene/helperVisibility.js";

export function applyRenderPreset(presetName, engine) {
  const preset = state.presets[presetName];
  if (!preset) return;

  state.renderPreset = presetName;

  // 🔹 Resolution scaling (fast, no rebuild)
  engine.setHardwareScalingLevel(preset.hardwareScaling);

  // 🔹 Visual helpers
  setVisualHelpersEnabled(preset.showBoundingBoxes);

  // 🔹 Grid (explicit)
  if (state.editorGrid) {
    state.editorGrid.setEnabled(preset.showGrid);
  }

  // 🔹 Selection helper visibility (still interactive)
  setSelectionHelperVisibility(preset.showSelectionHelper);
}
