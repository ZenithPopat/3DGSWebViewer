// utils/packToBuffer.js
export function packToBuffer(positions, scales, colors, quaternions) {
  const splatCount = positions.length;
  const rowLength = 32; // 32 bytes per splat
  const uBuffer = new Uint8Array(splatCount * rowLength);
  const fBuffer = new Float32Array(uBuffer.buffer);

  for (let i = 0; i < splatCount; i++) {
    const [px, py, pz] = positions[i];
    const [sx, sy, sz] = scales[i];
    const [cr, cg, cb, ca] = colors[i];
    const [rw, rx, ry, rz] = quaternions[i];

    const offsetF = i * 8;
    const offsetU = i * 32;

    // position
    fBuffer[offsetF + 0] = px;
    fBuffer[offsetF + 1] = py;
    fBuffer[offsetF + 2] = pz;

    // scale
    fBuffer[offsetF + 3] = sx;
    fBuffer[offsetF + 4] = sy;
    fBuffer[offsetF + 5] = sz;

    // color
    uBuffer[offsetU + 24] = cr;
    uBuffer[offsetU + 25] = cg;
    uBuffer[offsetU + 26] = cb;
    uBuffer[offsetU + 27] = ca;

    // quaternion
    uBuffer[offsetU + 28] = rw * 128 + 128;
    uBuffer[offsetU + 29] = rx * 128 + 128;
    uBuffer[offsetU + 30] = ry * 128 + 128;
    uBuffer[offsetU + 31] = rz * 128 + 128;
  }

  return { uBuffer, fBuffer };
}
