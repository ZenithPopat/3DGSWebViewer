import { state } from "../src/state/state.js";

export function applyInteractionAlphaBoost() {
  const mesh = state.mergedMesh;
  if (!mesh || !mesh.material) return;

  const material = mesh.material;
  const ub = material._uniformBuffer;
  if (!ub) return;

  const base = state.renderSettings.alphaThreshold;
  const boost = state.renderSettings.interactionAlphaBoost || 0;

  const effective = Math.min(255, base + boost);

  // 🔹 Inject a custom uniform (safe, no rebuild)
  if (!ub._valueCache.interactionAlphaThreshold) {
    ub.addUniform("interactionAlphaThreshold", 1);
  }

  ub.updateFloat("interactionAlphaThreshold", effective);
}
