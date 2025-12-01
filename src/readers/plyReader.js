export async function loadPlyFile(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const ab = await resp.arrayBuffer();
  return parsePlyBuffer(ab);
}

export function parsePlyBuffer(arrayBuffer) {
  const textDecoder = new TextDecoder("ascii");
  const u8 = new Uint8Array(arrayBuffer);

  let header = "";
  let headerEnd = -1;
  for (let i = 0; i < u8.length - 10; i++) {
    if (
      u8[i] === 101 &&
      u8[i + 1] === 110 &&
      u8[i + 2] === 100 &&
      u8[i + 3] === 95 &&
      u8[i + 4] === 104 &&
      u8[i + 5] === 101 &&
      u8[i + 6] === 97 &&
      u8[i + 7] === 100 &&
      u8[i + 8] === 101 &&
      u8[i + 9] === 114
    ) {
      headerEnd = i + 10;
      break;
    }
  }
  if (headerEnd === -1) throw new Error("No end_header found in PLY file");

  header = textDecoder.decode(u8.subarray(0, headerEnd));
  const lines = header.split("\n");

  let vertexCount = 0;
  const props = [];
  let inVertexElement = false;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "element" && parts[1] === "vertex") {
      vertexCount = parseInt(parts[2]);
      inVertexElement = true;
    } else if (parts[0] === "element" && inVertexElement) {
      inVertexElement = false;
    } else if (inVertexElement && parts[0] === "property") {
      props.push({ type: parts[1], name: parts[2] });
    }
  }

  // Prop type mapping
  const typeMap = {
    float: { size: 4, getter: (dv, o) => dv.getFloat32(o, true) },
    float32: { size: 4, getter: (dv, o) => dv.getFloat32(o, true) },
    double: { size: 8, getter: (dv, o) => dv.getFloat64(o, true) },
    float64: { size: 8, getter: (dv, o) => dv.getFloat64(o, true) },
    int: { size: 4, getter: (dv, o) => dv.getInt32(o, true) },
    int32: { size: 4, getter: (dv, o) => dv.getInt32(o, true) },
    uchar: { size: 1, getter: (dv, o) => dv.getUint8(o) },
    uint8: { size: 1, getter: (dv, o) => dv.getUint8(o) },
  };

  let rowSize = 0;
  for (const p of props) {
    if (!typeMap[p.type])
      throw new Error(`Unsupported property type ${p.type}`);
    p.size = typeMap[p.type].size;
    p.getter = typeMap[p.type].getter;
    p.offset = rowSize;
    rowSize += p.size;
  }

  const positions = new Float32Array(vertexCount * 3);
  const scales = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 4);
  const rotations = new Float32Array(vertexCount * 4);

  const dv = new DataView(arrayBuffer, headerEnd);

  for (let i = 0; i < vertexCount; i++) {
    const rowOffset = i * rowSize;

    let x = 0,
      y = 0,
      z = 0;
    let sx = 1,
      sy = 1,
      sz = 1;
    let r = 1,
      g = 1,
      b = 1,
      a = 1;
    let qw = 1,
      qx = 0,
      qy = 0,
      qz = 0;

    for (const p of props) {
      const val = p.getter(dv, rowOffset + p.offset);

      switch (p.name) {
        case "x":
          x = val;
          break;
        case "y":
          y = val;
          break;
        case "z":
          z = val;
          break;

        case "red":
        case "r":
          r = val / 255.0;
          break;
        case "green":
        case "g":
          g = val / 255.0;
          break;
        case "blue":
        case "b":
          b = val / 255.0;
          break;
        case "alpha":
        case "a":
          a = val / 255.0;
          break;

        case "scale_0":
          sx = Math.exp(val);
          break;
        case "scale_1":
          sy = Math.exp(val);
          break;
        case "scale_2":
          sz = Math.exp(val);
          break;

        case "opacity":
          a = 1 / (1 + Math.exp(-val));
          break;

        case "rot_0":
          qw = val;
          break;
        case "rot_1":
          qx = val;
          break;
        case "rot_2":
          qy = val;
          break;
        case "rot_3":
          qz = val;
          break;

        // spherical harmonics (needed?)
      }
    }

    // Normalizing
    const len = Math.hypot(qw, qx, qy, qz);
    if (len > 1e-9) {
      qw /= len;
      qx /= len;
      qy /= len;
      qz /= len;
    }

    positions.set([x, y, z], i * 3);
    scales.set([sx, sy, sz], i * 3);
    colors.set([r, g, b, a], i * 4);
    rotations.set([qw, qx, qy, qz], i * 4);
  }

  return {
    count: vertexCount,
    positions,
    scales,
    colors,
    rotations,
  };
}
