import { SPLAT_RECORD_BYTES } from "../core/constants.js";
import { packSplatRecord } from "./splatFormat.js";

export function buildMergedBytes(metadataList) {
  let totalSplats = metadataList.reduce(
    (sum, m) => sum + (m.parsed?.length || 0),
    0
  );

  const merged = new Uint8Array(totalSplats * SPLAT_RECORD_BYTES);

  let writeIndex = 0;

  for (const meta of metadataList) {
    if (!meta.parsed) continue;

    meta.startIndex = writeIndex;
    meta.splatCount = meta.parsed.length;

    for (let i = 0; i < meta.splatCount; i++)
      packSplatRecord(merged, writeIndex + i, meta.parsed[i]);

    writeIndex += meta.splatCount;
    meta.endIndex = meta.startIndex + meta.splatCount;
  }

  return merged;
}

export function commitMetaToMergedBytes(meta, mergedBytes) {
  for (let i = 0; i < meta.splatCount; i++) {
    packSplatRecord(mergedBytes, meta.startIndex + i, meta.parsed[i]);
  }
}
