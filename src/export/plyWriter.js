export function convertSplatsToPLY(mergedBytes) {
  const dv = new DataView(mergedBytes.buffer);
  const RECORD = 32;

  const count = mergedBytes.length / RECORD;

  let header = `ply
format ascii 1.0
element vertex ${count}
property float x
property float y
property float z
property float qx
property float qy
property float qz
property float qw
property float sx
property float sy
property float sz
property uchar red
property uchar green
property uchar blue
property uchar alpha
end_header
`;

  let body = "";

  for (let i = 0; i < count; i++) {
    const off = i * RECORD;

    const px = dv.getFloat32(off, true);
    const py = -dv.getFloat32(off + 4, true);
    const pz = dv.getFloat32(off + 8, true);

    const sx = dv.getFloat32(off + 12, true);
    const sy = dv.getFloat32(off + 16, true);
    const sz = dv.getFloat32(off + 20, true);

    const r = mergedBytes[off + 24];
    const g = mergedBytes[off + 25];
    const b = mergedBytes[off + 26];
    const a = mergedBytes[off + 27];

    const q0 = (mergedBytes[off + 28] - 128) / 128;
    const q1 = -(mergedBytes[off + 29] - 128) / 128;
    const q2 = (mergedBytes[off + 30] - 128) / 128;
    const q3 = -(mergedBytes[off + 31] - 128) / 128;

    body += `${px} ${py} ${pz} ${q1} ${q2} ${q3} ${q0} ${sx} ${sy} ${sz} ${r} ${g} ${b} ${a}\n`;
  }

  return header + body;
}
