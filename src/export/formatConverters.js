const RECORD_BYTES = 32;

// export function convertParsedToSplat(parsed) {
//   const buf = new Uint8Array(parsed.length * RECORD_BYTES);

//   parsed.forEach((s, i) => {
//     const base = i * RECORD_BYTES;
//     const view = new DataView(buf.buffer);

//     view.setFloat32(base + 0, s.px, true);
//     view.setFloat32(base + 4, -s.py, true);
//     view.setFloat32(base + 8, s.pz, true);

//     view.setFloat32(base + 12, s.sx, true);
//     view.setFloat32(base + 16, s.sy, true);
//     view.setFloat32(base + 20, s.sz, true);

//     buf[base + 24] = s.r;
//     buf[base + 25] = s.g;
//     buf[base + 26] = s.b;
//     buf[base + 27] = s.a;

//     buf[base + 28] = Math.round(s.q0 * 128 + 128);
//     buf[base + 29] = Math.round(-s.q1 * 128 + 128);
//     buf[base + 30] = Math.round(s.q2 * 128 + 128);
//     buf[base + 31] = Math.round(-s.q3 * 128 + 128);
//   });

//   return buf;
// }

/* ---------------------------------------------
   parsed[] → .splat (binary)
--------------------------------------------- */
export function convertParsedToSplat(parsed) {
  const buf = new Uint8Array(parsed.length * RECORD_BYTES);
  const view = new DataView(buf.buffer);

  parsed.forEach((s, i) => {
    const base = i * RECORD_BYTES;

    view.setFloat32(base + 0, s.px, true);
    view.setFloat32(base + 4, -s.py, true);
    view.setFloat32(base + 8, s.pz, true);

    view.setFloat32(base + 12, s.sx, true);
    view.setFloat32(base + 16, s.sy, true);
    view.setFloat32(base + 20, s.sz, true);

    buf[base + 24] = s.r;
    buf[base + 25] = s.g;
    buf[base + 26] = s.b;
    buf[base + 27] = s.a;

    buf[base + 28] = Math.round(s.q0 * 128 + 128);
    buf[base + 29] = Math.round(-s.q1 * 128 + 128);
    buf[base + 30] = Math.round(s.q2 * 128 + 128);
    buf[base + 31] = Math.round(-s.q3 * 128 + 128);
  });

  return buf;
}

/* ---------------------------------------------
   parsed[] → .ply (ASCII)
--------------------------------------------- */
export function convertParsedToPLY(parsed) {
  let header = `ply
format ascii 1.0
element vertex ${parsed.length}
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

  for (const s of parsed) {
    body +=
      `${s.px} ${s.py} ${s.pz} ` +
      `${s.q1} ${s.q2} ${s.q3} ${s.q0} ` +
      `${s.sx} ${s.sy} ${s.sz} ` +
      `${s.r} ${s.g} ${s.b} ${s.a}\n`;
  }

  return header + body;
}
