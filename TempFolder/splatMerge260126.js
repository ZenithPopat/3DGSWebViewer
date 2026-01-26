import { SPLAT_RECORD_BYTES } from "../core/constants.js";
import { packSplatRecord } from "./splatFormat.js";
import { state } from "../state/state.js";

export function buildMergedBytes(metadataList) {
  let totalSplats = 0;
  let globalIndex = 0;
  let visibleSplats = 0;
  // state.stats.totalSplats ??= 0;
  // state.stats.visibleSplats ??= 0;

  // Count splats
  // for (const meta of metadataList) {
  //   if (!meta.parsed) continue;

  //   for (let i = 0; i < meta.parsed.length; i++) {
  //     if (!state.erase?.erasedSplatIndices?.has(globalIndex)) {
  //       totalSplats++;
  //     }
  //     globalIndex++;
  //   }
  // }

  const merged = new Uint8Array(totalSplats * SPLAT_RECORD_BYTES);

  let writeIndex = 0;
  globalIndex = 0;

  let culledByAlpha = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    meta.startIndex = writeIndex;
    let keptCount = 0;

    for (let i = 0; i < meta.parsed.length; i++) {
      if (state.erase?.erasedSplatIndices?.has(globalIndex)) {
        globalIndex++;
        continue;
      }

      const s = meta.parsed[i];
      const tmp = { ...s };

      // For optional alpha field handling eg. opacity, alpha, a, etc.

      // const alpha = tmp.a ?? tmp.alpha ?? tmp.opacity ?? 1.0;

      // if (alpha < alphaThreshold) {
      //   globalIndex++;
      //   continue;
      // }

      const alphaThreshold = state.renderSettings.alphaThreshold;

      // ---- ALPHA-BASED SPLAT FILTERING ----
      if (tmp.a !== undefined && tmp.a < alphaThreshold) {
        globalIndex++;
        culledByAlpha++;
        continue;
      }

      if (state.selection.previewHighlight) {
        if (state.selection.splatIndices.has(globalIndex)) {
          tmp.r = 255;
          tmp.g = 255;
          tmp.b = 0;
        }
      }

      const center = state.sceneStats.center;
      const pruneRadius =
        state.renderSettings.scenePruneRadius ??
        state.sceneStats.maxSceneRadius * 1.2; // safe default

      const dx = s.x - center.x;
      const dy = s.y - center.y;
      const dz = s.z - center.z;

      if (dx * dx + dy * dy + dz * dz > pruneRadius * pruneRadius) {
        globalIndex++;
        continue; // OUTLIER PRUNED
      }

      const cam = state.scene.activeCamera;
      const maxViewDist = state.renderSettings.maxViewDistance;

      if (cam && isFinite(maxViewDist)) {
        const dx = s.x - cam.position.x;
        const dy = s.y - cam.position.y;
        const dz = s.z - cam.position.z;

        if (dx * dx + dy * dy + dz * dz > maxViewDist * maxViewDist) {
          globalIndex++;
          continue; // VIEW DISTANCE CULLED
        }
      }

      packSplatRecord(merged, writeIndex, tmp);

      writeIndex++;
      keptCount++;
      globalIndex++;
    }

    meta.splatCount = keptCount;
    meta.endIndex = meta.startIndex + keptCount;
  }
  // state.stats.totalSplats = totalSplats;
  state.stats.visibleSplats = totalSplats;
  console.log("Alpha-culled splats:", culledByAlpha);
  return merged;
}
