import { SPLAT_RECORD_BYTES } from "../core/constants.js";
import { readF32, writeF32, clamp01 } from "../core/utils.js";

export function unpackSplatRecord(bytes, idx) {
  const base = idx * SPLAT_RECORD_BYTES;

  return {
    px: readF32(bytes, base + 0),
    py: -readF32(bytes, base + 4),
    pz: readF32(bytes, base + 8),

    sx: readF32(bytes, base + 12),
    sy: readF32(bytes, base + 16),
    sz: readF32(bytes, base + 20),

    r: bytes[base + 24],
    g: bytes[base + 25],
    b: bytes[base + 26],
    a: bytes[base + 27],

    q0: (bytes[base + 28] - 128) / 128,
    q1: -(bytes[base + 29] - 128) / 128,
    q2: (bytes[base + 30] - 128) / 128,
    q3: -(bytes[base + 31] - 128) / 128,
  };
}

export function packSplatRecord(bytes, idx, s) {
  const base = idx * SPLAT_RECORD_BYTES;

  writeF32(bytes, base + 0, s.px);
  writeF32(bytes, base + 4, -s.py);
  writeF32(bytes, base + 8, s.pz);

  writeF32(bytes, base + 12, s.sx);
  writeF32(bytes, base + 16, s.sy);
  writeF32(bytes, base + 20, s.sz);

  bytes[base + 24] = s.r & 255;
  bytes[base + 25] = s.g & 255;
  bytes[base + 26] = s.b & 255;
  bytes[base + 27] = s.a & 255;

  const q0 = clamp01(s.q0);
  const q1 = clamp01(-s.q1);
  const q2 = clamp01(s.q2);
  const q3 = clamp01(-s.q3);

  bytes[base + 28] = Math.round(q0 * 128 + 128);
  bytes[base + 29] = Math.round(q1 * 128 + 128);
  bytes[base + 30] = Math.round(q2 * 128 + 128);
  bytes[base + 31] = Math.round(q3 * 128 + 128);
}
