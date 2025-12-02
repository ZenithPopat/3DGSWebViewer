export function clamp01(x) {
  if (!isFinite(x)) return 0;
  return Math.max(-1, Math.min(1, x));
}

export function readF32(bytes, offset) {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getFloat32(offset, true);
}

export function writeF32(bytes, offset, val) {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setFloat32(
    offset,
    val,
    true
  );
}
