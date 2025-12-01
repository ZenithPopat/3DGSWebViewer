export async function loadPlyFile(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const ab = await resp.arrayBuffer();
  return parsePlyBuffer(ab);
}

export function parsePlyBuffer(arrayBuffer) {
  const textDecoder = new TextDecoder("ascii");
  const u8 = new Uint8Array(arrayBuffer);

  // Header Parsing
  let header = "";
  let headerEnd = -1;
  for (let i = 0; i < u8.length - 10; i++) {
    if (
      // Looking for "end_header"
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
      inVertexElement = false; // leaving vertex section
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

  // --- 3. Extract data ---
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
//-------------------------------------------------------

// src/readers/PLYReader.js
export async function loadPLY(urlOrArrayBuffer) {
  // Accept either a URL (string) or an ArrayBuffer
  let arrayBuffer;
  if (typeof urlOrArrayBuffer === "string") {
    const resp = await fetch(urlOrArrayBuffer);
    if (!resp.ok) throw new Error("Failed to fetch PLY: " + resp.statusText);
    arrayBuffer = await resp.arrayBuffer();
  } else if (urlOrArrayBuffer instanceof ArrayBuffer) {
    arrayBuffer = urlOrArrayBuffer;
  } else if (ArrayBuffer.isView(urlOrArrayBuffer)) {
    arrayBuffer = urlOrArrayBuffer.buffer;
  } else {
    throw new Error("loadPLY expects URL or ArrayBuffer");
  }

  const u8 = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder("ascii");

  // find "end_header" byte index (and skip trailing newline(s))
  const needle = new TextEncoder().encode("end_header");
  let headerEndByte = -1;
  for (let i = 0; i <= u8.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (u8[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      headerEndByte = i + needle.length;
      break;
    }
  }
  if (headerEndByte === -1)
    throw new Error("PLY header not found (no end_header)");

  // skip newline(s) after end_header
  let bodyStart = headerEndByte;
  while (
    bodyStart < u8.length &&
    (u8[bodyStart] === 10 || u8[bodyStart] === 13)
  )
    bodyStart++;

  // decode header text
  const headerText = decoder.decode(u8.subarray(0, bodyStart));
  const headerLines = headerText.split(/\r?\n/).map((l) => l.trim());

  // parse header: format, vertex count, vertex properties (in order)
  let format = "ascii";
  let littleEndian = true;
  let vertexCount = 0;
  const vertexProps = []; // array of {name, type, isList, countType, itemType}

  let inVertexElement = false;
  for (const line of headerLines) {
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "format") {
      if (parts[1].includes("binary_little_endian")) format = "binary";
      else if (parts[1].includes("ascii")) format = "ascii";
      else if (parts[1].includes("binary_big_endian")) {
        // We only support little-endian in this reader
        throw new Error("binary_big_endian PLY not supported");
      }
    } else if (parts[0] === "element") {
      if (parts[1] === "vertex") {
        vertexCount = parseInt(parts[2]);
        inVertexElement = true;
      } else {
        inVertexElement = false;
      }
    } else if (inVertexElement && parts[0] === "property") {
      if (parts[1] === "list") {
        // list property (rare on vertex) - store but we will skip lists
        vertexProps.push({
          isList: true,
          countType: parts[2],
          itemType: parts[3],
          name: parts[4],
        });
      } else {
        vertexProps.push({ isList: false, type: parts[1], name: parts[2] });
      }
    }
  }

  if (!vertexCount) {
    throw new Error("PLY header contains no vertex count");
  }

  // helper: map PLY scalar type -> { size, getter (DataView) }
  const typeInfo = {
    char: { size: 1, get: (dv, o) => dv.getInt8(o) },
    int8: { size: 1, get: (dv, o) => dv.getInt8(o) },
    uchar: { size: 1, get: (dv, o) => dv.getUint8(o) },
    uint8: { size: 1, get: (dv, o) => dv.getUint8(o) },
    short: { size: 2, get: (dv, o) => dv.getInt16(o, true) },
    int16: { size: 2, get: (dv, o) => dv.getInt16(o, true) },
    ushort: { size: 2, get: (dv, o) => dv.getUint16(o, true) },
    uint16: { size: 2, get: (dv, o) => dv.getUint16(o, true) },
    int: { size: 4, get: (dv, o) => dv.getInt32(o, true) },
    int32: { size: 4, get: (dv, o) => dv.getInt32(o, true) },
    uint: { size: 4, get: (dv, o) => dv.getUint32(o, true) },
    uint32: { size: 4, get: (dv, o) => dv.getUint32(o, true) },
    float: { size: 4, get: (dv, o) => dv.getFloat32(o, true) },
    float32: { size: 4, get: (dv, o) => dv.getFloat32(o, true) },
    double: { size: 8, get: (dv, o) => dv.getFloat64(o, true) },
    float64: { size: 8, get: (dv, o) => dv.getFloat64(o, true) },
  };

  // utility: parse index suffix from names like "scale_0", "rot_2"
  function indexSuffix(name, prefix) {
    const m = name.match(new RegExp("^" + prefix + "[_]?([0-9]+)$"));
    return m ? parseInt(m[1], 10) : null;
  }

  // Prepare outputs with defaults
  const positions = new Float32Array(vertexCount * 3);
  const scales = new Float32Array(vertexCount * 3);
  const colors = new Uint8Array(vertexCount * 4); // 0..255
  const quaternions = new Float32Array(vertexCount * 4);

  // set defaults
  for (let i = 0; i < vertexCount; i++) {
    scales[i * 3 + 0] = 1.0;
    scales[i * 3 + 1] = 1.0;
    scales[i * 3 + 2] = 1.0;
    colors.set([255, 255, 255, 255], i * 4);
    quaternions.set([0, 0, 0, 1], i * 4);
  }

  // Helper to push numeric values depending on property names
  function assignValueForVertex(vIdx, propName, val) {
    if (propName === "x" || propName === "pos_x") positions[vIdx * 3 + 0] = val;
    else if (propName === "y" || propName === "pos_y")
      positions[vIdx * 3 + 1] = val;
    else if (propName === "z" || propName === "pos_z")
      positions[vIdx * 3 + 2] = val;
    else if (propName === "red" || propName === "r")
      colors[vIdx * 4 + 0] = Math.round(Math.max(0, Math.min(255, val)));
    else if (propName === "green" || propName === "g")
      colors[vIdx * 4 + 1] = Math.round(Math.max(0, Math.min(255, val)));
    else if (propName === "blue" || propName === "b")
      colors[vIdx * 4 + 2] = Math.round(Math.max(0, Math.min(255, val)));
    else if (
      propName === "alpha" ||
      propName === "a" ||
      propName === "opacity"
    ) {
      // val might be 0..1 or 0..255
      let a = val;
      if (a <= 1.001) a = Math.round(Math.max(0, Math.min(1, a)) * 255);
      else a = Math.round(Math.max(0, Math.min(255, a)));
      colors[vIdx * 4 + 3] = a;
    } else {
      // scale_x / scale_0 etc
      const scIdx =
        indexSuffix(propName, "scale") ?? indexSuffix(propName, "scaling");
      if (scIdx !== null && scIdx >= 0 && scIdx < 3) {
        scales[vIdx * 3 + scIdx] = val;
        return;
      }
      // rotation components rot_0..rot_3 or rotation_*
      const rIdx =
        indexSuffix(propName, "rot") ?? indexSuffix(propName, "rotation");
      if (rIdx !== null && rIdx >= 0 && rIdx < 4) {
        // order in file might be rot_0..rot_3; we keep mapping as read
        quaternions[vIdx * 4 + rIdx] = val;
        return;
      }
      // f_dc_* - treat as color DC if present (float)
      const m = propName.match(/^f_dc_([0-2])$/);
      if (m) {
        const channel = parseInt(m[1], 10);
        // previously Python used: cr = clamp_byte((0.5 + SH_C0 * val) * 255)
        const SH_C0 = 0.28209479177387814;
        const normalized = Math.max(0, Math.min(1, 0.5 + SH_C0 * val));
        colors[vIdx * 4 + channel] = Math.round(normalized * 255);
        return;
      }
      // fallback: ignore other props for now
    }
  }

  // If ASCII format: decode header-start..end as text and parse remainder as text lines
  if (format === "ascii") {
    const fullText = decoder.decode(u8);
    const lines = fullText.split(/\r?\n/);
    // find line index where data starts (count header lines)
    const headerLineCount = headerLines.length;
    let dataIdx = headerLineCount;
    let read = 0;
    for (; read < vertexCount && dataIdx < lines.length; dataIdx++) {
      const line = lines[dataIdx].trim();
      if (!line) continue;
      const tokens = line.split(/\s+/);
      if (tokens.length < vertexProps.length) {
        // malformed line — skip
        dataIdx++;
        continue;
      }
      // iterate properties in order and assign
      let tIdx = 0;
      for (let p = 0; p < vertexProps.length; p++) {
        const prop = vertexProps[p];
        if (prop.isList) {
          // lists unlikely in vertex - skip value(s) - not supported here
          // try to skip: count = parseInt(tokens[tIdx]); tIdx += 1 + count;
          const cnt = parseInt(tokens[tIdx]);
          tIdx += 1;
          const n = isNaN(cnt) ? 0 : cnt;
          tIdx += n;
          continue;
        }
        const raw = tokens[tIdx++];
        const pType = prop.type;
        let val;
        if (
          pType.startsWith("u") ||
          pType.startsWith("uint") ||
          pType === "uchar" ||
          pType === "uint8" ||
          pType === "ushort"
        ) {
          val = parseInt(raw);
        } else {
          val = parseFloat(raw);
        }
        assignValueForVertex(read, prop.name, val);
      }
      read++;
    }
    // done
  } else if (format === "binary") {
    // Binary little-endian parsing
    const dv = new DataView(arrayBuffer, bodyStart);
    // compute row size (sum property type sizes)
    let rowSize = 0;
    const propReaders = vertexProps.map((p) => {
      if (p.isList) {
        // don't support list in vertex; we'll return a reader that throws or tries to skip
        return {
          size: null,
          isList: true,
          countType: p.countType,
          itemType: p.itemType,
          name: p.name,
        };
      }
      const info = typeInfo[p.type];
      if (!info) {
        throw new Error("Unsupported PLY property type: " + p.type);
      }
      rowSize += info.size;
      return {
        size: info.size,
        get: info.get,
        name: p.name,
        isList: false,
        type: p.type,
      };
    });

    // check body length viability
    if (bodyStart + rowSize * vertexCount > u8.length + 1) {
      // Some PLY files include extra per-vertex padding or different layout,
      // but we can still try to parse until available bytes.
      // We'll proceed but warn.
      console.warn(
        "PLY binary block shorter than expected. Attempting graceful parse."
      );
    }

    let offset = 0;
    for (let vi = 0; vi < vertexCount; vi++) {
      for (let pi = 0; pi < propReaders.length; pi++) {
        const pr = propReaders[pi];
        if (pr.isList) {
          // try to skip list: read count as uint8/uint16/uint32 depending on countType
          const ct = p.countType;
          const countInfo = typeInfo[ct] || {
            size: 1,
            get: (dv, o) => dv.getUint8(o),
          };
          const cnt = countInfo.get(dv, offset);
          offset += countInfo.size;
          // skip that many items of itemType
          const itemInfo = typeInfo[p.itemType] || {
            size: 1,
            get: (dv, o) => dv.getUint8(o),
          };
          offset += itemInfo.size * cnt;
          continue;
        }
        const get = pr.get;
        const val = get(dv, offset);
        assignValueForVertex(vi, pr.name, val);
        offset += pr.size;
      }
    }
  } else {
    throw new Error("Unsupported PLY format: " + format);
  }

  // Ensure quaternion normalization fallback if necessary
  for (let i = 0; i < vertexCount; i++) {
    const qw = quaternions[i * 4 + 3];
    const qx = quaternions[i * 4 + 0];
    const qy = quaternions[i * 4 + 1];
    const qz = quaternions[i * 4 + 2];
    const len = Math.hypot(qw, qx, qy, qz);
    if (len < 1e-6) {
      // fallback: identity quaternion
      quaternions[i * 4 + 0] = 0;
      quaternions[i * 4 + 1] = 0;
      quaternions[i * 4 + 2] = 0;
      quaternions[i * 4 + 3] = 1;
    } else if (Math.abs(len - 1.0) > 1e-6) {
      quaternions[i * 4 + 0] /= len;
      quaternions[i * 4 + 1] /= len;
      quaternions[i * 4 + 2] /= len;
      quaternions[i * 4 + 3] /= len;
    }
  }

  // return typed arrays ready for packing
  return {
    count: vertexCount,
    positions, // Float32Array length = count*3
    scales, // Float32Array length = count*3
    colors, // Uint8Array  length = count*4
    quaternions, // Float32Array length = count*4 (order qx,qy,qz,qw)
  };
}

// export async function PLYReader(url) {
//   const response = await fetch(url);
//   if (!response.ok) {
//     throw new Error(`Failed to load PLY file: ${url}`);
//   }

//   const text = await response.text();
//   const lines = text.split(/\r?\n/); // handles both LF and CRLF

//   // --- Parse header ---
//   let vertexCount = 0;
//   let headerEnded = false;
//   let headerLines = 0;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i]?.trim(); // safe access
//     if (!line) continue; // skip empty

//     if (line.startsWith("element vertex")) {
//       const parts = line.split(/\s+/);
//       vertexCount = parseInt(parts[2]);
//     }

//     if (line === "end_header") {
//       headerEnded = true;
//       headerLines = i + 1; // data starts after this line
//       break;
//     }
//   }

//   if (!headerEnded) {
//     throw new Error("PLY header not properly terminated with 'end_header'");
//   }

//   // --- Parse vertices ---
//   const positions = [];
//   const colors = [];
//   const scales = [];
//   const quaternions = [];

//   for (let i = 0; i < vertexCount; i++) {
//     const line = lines[headerLines + i];
//     if (!line) continue; // skip empty
//     const parts = line.trim().split(/\s+/);

//     if (parts.length < 7) {
//       console.warn(`Skipping malformed vertex line: ${line}`);
//       continue;
//     }

//     // Example PLY format: x y z nx ny nz r g b a scale rot_x rot_y rot_z rot_w
//     const x = parseFloat(parts[0]);
//     const y = parseFloat(parts[1]);
//     const z = parseFloat(parts[2]);

//     const r = parseInt(parts[6]) / 255.0;
//     const g = parseInt(parts[7]) / 255.0;
//     const b = parseInt(parts[8]) / 255.0;
//     const a = parts.length > 9 ? parseInt(parts[9]) / 255.0 : 1.0;

//     const scale = parts.length > 10 ? parseFloat(parts[10]) : 0.01;

//     const qx = parts.length > 11 ? parseFloat(parts[11]) : 0;
//     const qy = parts.length > 12 ? parseFloat(parts[12]) : 0;
//     const qz = parts.length > 13 ? parseFloat(parts[13]) : 0;
//     const qw = parts.length > 14 ? parseFloat(parts[14]) : 1;

//     positions.push([x, y, z]);
//     colors.push([r, g, b, a]);
//     scales.push([scale, scale, scale]);
//     quaternions.push([qx, qy, qz, qw]);
//   }

//   return { positions, scales, colors, quaternions };
// }
//-------------------------------------------------------
