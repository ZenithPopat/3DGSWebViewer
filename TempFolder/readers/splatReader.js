export class SplatReader {
  static async load(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);

    const count = view.getUint32(0, true);
    let offset = 4;

    const positions = [];
    const scales = [];
    const colors = [];
    const quaternions = [];

    for (let i = 0; i < count; i++) {
      const x = view.getFloat32(offset, true);
      offset += 4;
      const y = view.getFloat32(offset, true);
      offset += 4;
      const z = view.getFloat32(offset, true);
      offset += 4;
      positions.push(x, y, z);

      const sx = Math.max(0.0001, view.getFloat32(offset, true));
      offset += 4;
      const sy = Math.max(0.0001, view.getFloat32(offset, true));
      offset += 4;
      const sz = Math.max(0.0001, view.getFloat32(offset, true));
      offset += 4;
      scales.push(sx, sy, sz);

      const r = view.getUint8(offset++) / 255;
      const g = view.getUint8(offset++) / 255;
      const b = view.getUint8(offset++) / 255;
      const a = view.getUint8(offset++) / 255;
      colors.push(r, g, b, a);

      const qx = view.getFloat32(offset, true);
      offset += 4;
      const qy = view.getFloat32(offset, true);
      offset += 4;
      const qz = view.getFloat32(offset, true);
      offset += 4;
      const qw = view.getFloat32(offset, true);
      offset += 4;
      quaternions.push(qx, qy, qz, qw);
    }

    return { positions, scales, colors, quaternions };
  }
}
