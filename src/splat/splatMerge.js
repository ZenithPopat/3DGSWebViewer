import { SPLAT_RECORD_BYTES } from "../core/constants.js";
import { packSplatRecord } from "./splatFormat.js";
import { state } from "../state/state.js";

export function buildMergedBytes(metadataList) {
  const mergeStart = performance.now();
  const { alphaThreshold, maxViewDistance } = state.renderSettings;
  const bounds = state.sceneStats.bounds;

  const cam = state.scene?.activeCamera;
  const camPos = cam?.position;

  // COUNT visible splats after filtering to allocate exact buffer size
  let visibleSplats = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    for (const s of meta.parsed) {
      // ---- Alpha filtering ----
      const alpha = s.a ?? 1.0;
      if (alpha < alphaThreshold) continue;

      // Bounding-box pruning
      if (bounds) {
        if (
          s.px < bounds.min.x ||
          s.py < bounds.min.y ||
          s.pz < bounds.min.z ||
          s.px > bounds.max.x ||
          s.py > bounds.max.y ||
          s.pz > bounds.max.z
        ) {
          continue;
        }
      }

      // View-distance culling
      if (camPos && isFinite(maxViewDistance)) {
        const dx = s.px - camPos.x;
        const dy = s.py - camPos.y;
        const dz = s.pz - camPos.z;
        if (dx * dx + dy * dy + dz * dz > maxViewDistance * maxViewDistance) {
          continue;
        }
      }

      visibleSplats++;
    }
  }

  // Allocate exact-sized GPU buffer
  const merged = new Uint8Array(visibleSplats * SPLAT_RECORD_BYTES);

  state.mergeMap = [];

  // PACK splats and build mergeMap

  let writeIndex = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    let keptCount = 0;

    for (let i = 0; i < meta.parsed.length; i++) {
      const s = meta.parsed[i];

      // Alpha filtering
      const alpha = s.a ?? 1.0;
      if (alpha < alphaThreshold) continue;

      // Bounding-box pruning
      if (bounds) {
        if (
          s.px < bounds.min.x ||
          s.py < bounds.min.y ||
          s.pz < bounds.min.z ||
          s.px > bounds.max.x ||
          s.py > bounds.max.y ||
          s.pz > bounds.max.z
        ) {
          continue;
        }
      }

      if (s.scale !== undefined && s.scale < 0.01) continue;
      if (s.sigma !== undefined && s.sigma < threshold) continue;

      // View-distance culling
      if (camPos && isFinite(maxViewDistance)) {
        const dx = s.px - camPos.x;
        const dy = s.py - camPos.y;
        const dz = s.pz - camPos.z;
        if (dx * dx + dy * dy + dz * dz > maxViewDistance * maxViewDistance) {
          continue;
        }
      }

      // Copy splat so color edits are safe
      const tmp = { ...s };

      // Selection preview highlight
      if (
        state.selection.previewHighlight &&
        state.selection.splatIndices.has(writeIndex)
      ) {
        tmp.r = 255;
        tmp.g = 255;
        tmp.b = 0;
      }

      packSplatRecord(merged, writeIndex, tmp);

      // Mapping for destructive erase
      state.mergeMap[writeIndex] = {
        meta,
        parsedIndex: i,
      };

      writeIndex++;
      keptCount++;
    }

    meta.splatCount = keptCount;
  }

  // Final stats
  state.stats.visibleSplats = visibleSplats;

  const mergeEnd = performance.now();

  state.performance.mergeTimes = state.performance.mergeTimes || [];
  state.performance.mergeTimes.push(mergeEnd - mergeStart);
  return merged;
}
