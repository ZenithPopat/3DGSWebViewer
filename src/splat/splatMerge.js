import { SPLAT_RECORD_BYTES } from "../core/constants.js";
import { packSplatRecord } from "./splatFormat.js";
import { state } from "../state/state.js";

export function buildMergedBytes(metadataList) {
  // Count splats excluding erased ones
  let totalSplats = 0;
  let globalIndex = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    for (let i = 0; i < meta.parsed.length; i++) {
      if (!state.erase?.erasedSplatIndices?.has(globalIndex)) {
        totalSplats++;
      }
      globalIndex++;
    }
  }

  // Allocate buffer
  const merged = new Uint8Array(totalSplats * SPLAT_RECORD_BYTES);

  let writeIndex = 0;
  globalIndex = 0;

  // Pack splats, skipping erased + applying highlight
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

      const isSelectedSplat = state.selection.splatIndices.has(globalIndex);
      const isSelectedObject =
        state.selectedObject && meta.id === state.selectedObject.id;

      if (isSelectedSplat) {
        tmp.r = 255;
        tmp.g = 255;
        tmp.b = 0;
      } else if (isSelectedObject) {
        tmp.r = Math.min(255, tmp.r + 30);
        tmp.g = Math.min(255, tmp.g + 60);
        tmp.b = Math.min(255, tmp.b + 80);
      }

      packSplatRecord(merged, writeIndex, tmp);

      writeIndex++;
      keptCount++;
      globalIndex++;
    }

    meta.splatCount = keptCount;
    meta.endIndex = meta.startIndex + keptCount;
  }

  return merged;
}
