import { state } from "../../src/state/state.js";
import { isEffectivelyInteracting } from "../../src/utils/interactionState.js";
import { applyInteractionAlphaBoost } from "../gaussianRenderTuning.js";

let qualityApplied = "idle";
let restoreTimeout = null;

export function updateInteractionQuality(engine) {
  const interacting = isEffectivelyInteracting();
  const now = performance.now();

  // --- Interaction START ---
  if (interacting && qualityApplied !== "interaction") {
    applyInteractionQuality(engine);
    qualityApplied = "interaction";
    state.interaction.active = true;
    state.interaction.lastChangeTime = now;

    if (restoreTimeout) {
      clearTimeout(restoreTimeout);
      restoreTimeout = null;
    }
    return;
  }

  // --- Interaction END (debounced restore) ---
  if (!interacting && qualityApplied === "interaction") {
    if (!restoreTimeout) {
      restoreTimeout = setTimeout(() => {
        applyIdleQuality(engine);
        qualityApplied = "idle";
        state.interaction.active = false;
        state.interaction.lastChangeTime = performance.now();
        restoreTimeout = null;
      }, state.interactionQuality.restoreDelayMs);
    }
  }
}

// ----------------------------

function applyInteractionQuality(engine) {
  // 🔹 Lower render resolution
  engine.setHardwareScalingLevel(state.interactionQuality.interactionScaling);

  // 🔹 Interaction alpha boost (shader-level)
  state.renderSettings.interactionAlphaBoost =
    state.interactionQuality.alphaBoost;

  applyInteractionAlphaBoost();

  // 🔹 Disable helpers
  if (state.selectionBox) state.selectionBox.setEnabled(false);
}

// ----------------------------

function applyIdleQuality(engine) {
  // 🔹 Restore resolution
  engine.setHardwareScalingLevel(state.interactionQuality.idleScaling);

  // 🔹 Restore alpha threshold
  state.renderSettings.interactionAlphaBoost = 0;

  applyInteractionAlphaBoost();

  // 🔹 Re-enable helpers
  if (state.selectionBox) state.selectionBox.setEnabled(true);
}
