import * as BABYLON from "@babylonjs/core";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

registerBuiltInLoaders();

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// ==== Config ====
const splatFiles = [
  "../tree_bench/splats/001_3DGS.splat", // adjust to your public path
  "../tree_bench/splats/002_3DGS.splat",
];

// Maximum object count supported by the uniform array in the shader.
// Increase if you load more files (up to driver/uniform limits).
const MAX_OBJECTS = 16;

// ==== GLSL shaders registration (ShaderMaterial uses these names) ====
// Vertex shader
BABYLON.Effect.ShadersStore["splatVertexShader"] = `
precision highp float;

attribute vec3 position;
attribute vec4 color;
attribute float radius;
attribute float objectId;

uniform mat4 worldViewProjection;
uniform mat4 objectMatrices[${MAX_OBJECTS}];

varying vec4 vColor;
varying float vRadius;

void main(void) {
    int id = int(objectId);
    mat4 M = objectMatrices[id];
    vec4 worldPos = M * vec4(position, 1.0);
    gl_Position = worldViewProjection * worldPos;
    vColor = color;
    vRadius = radius;

    // Size in pixels — you might want to scale by camera distance in a more advanced version
    gl_PointSize = radius;
}
`;

// Fragment shader
BABYLON.Effect.ShadersStore["splatFragmentShader"] = `
precision highp float;

varying vec4 vColor;
varying float vRadius;

void main(void) {
    // gl_PointCoord goes 0..1 across the point sprite
    vec2 xy = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(xy, xy);
    // simple gaussian-like falloff
    float alpha = exp(-r2 * 4.0);
    if (r2 > 1.0) discard; // outside circle
    gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
}
`;

// ==== Utility: read binary splat file and parse with stride detection ====
async function loadSplatFileAsFloats(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Float32Array(buf);
}

// Try to parse given float array with the assumed stride mapping.
// Assumes stride=8: [x,y,z, radius, r, g, b, unused]
// Returns arrays: positions(..3), colors(..4), radii(..1)
function parseFloatSplatArray(arr, stride = 8) {
  if (arr.length % stride !== 0) {
    throw new Error(
      `Array length ${arr.length} not divisible by stride ${stride}`
    );
  }
  const count = arr.length / stride;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const radii = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const base = i * stride;
    // mapping (adjust if your file uses different layout)
    const x = arr[base + 0];
    const y = arr[base + 1];
    const z = arr[base + 2];
    const radius = arr[base + 3];

    // color floats (some files might store 0..1 floats here)
    let r = arr[base + 4];
    let g = arr[base + 5];
    let b = arr[base + 6];

    // Basic sanity fix if color values > 1 (interpreted as 0..255 ints)
    if (r > 1.5 || g > 1.5 || b > 1.5) {
      r = Math.min(1.0, r / 255.0);
      g = Math.min(1.0, g / 255.0);
      b = Math.min(1.0, b / 255.0);
    }

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 4 + 0] = r;
    colors[i * 4 + 1] = g;
    colors[i * 4 + 2] = b;
    colors[i * 4 + 3] = 1.0;

    radii[i] = Math.max(1.0, radius * 100.0); // heuristic: scale radius to pixels (adjust as needed)
  }

  return { positions, colors, radii, count };
}

// ==== Main: load, merge, create mesh & material ====
async function createScene() {
  const scene = new BABYLON.Scene(engine);

  // basic camera + light
  const camera = new BABYLON.ArcRotateCamera(
    "cam",
    Math.PI / 2,
    Math.PI / 3,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("h", new BABYLON.Vector3(0, 1, 0), scene);

  // 1) load both files as float arrays
  const floatArrays = [];
  for (let url of splatFiles) {
    const arr = await loadSplatFileAsFloats(url);
    floatArrays.push(arr);
    console.log(`Loaded ${url}: ${arr.length} floats`);
  }

  // 2) prefer stride 8 if possible, otherwise try stride 4
  let stride = 8;
  const okAll = floatArrays.every((a) => a.length % stride === 0);
  if (!okAll) {
    stride = 4;
    if (!floatArrays.every((a) => a.length % stride === 0)) {
      console.warn(
        "Formats not divisible by 8 or 4 — proceeding with stride=8 and truncation where necessary."
      );
      stride = 8;
    }
  }

  // 3) parse each with chosen stride and accumulate
  const positionsList = [];
  const colorsList = [];
  const radiiList = [];
  const objectIdList = [];
  let totalCount = 0;

  for (let i = 0; i < floatArrays.length; i++) {
    const arr = floatArrays[i];
    // if arr length not divisible by stride, ignore trailing floats
    const usableLen = Math.floor(arr.length / stride) * stride;
    const sub = arr.subarray(0, usableLen);
    const parsed = parseFloatSplatArray(sub, stride);
    console.log(`Parsed file ${i}: ${parsed.count} splats`);
    positionsList.push(parsed.positions);
    colorsList.push(parsed.colors);
    radiiList.push(parsed.radii);
    // objectId for each splat
    const objIds = new Float32Array(parsed.count);
    objIds.fill(i);
    objectIdList.push(objIds);
    totalCount += parsed.count;
  }

  console.log("Total splats:", totalCount);

  // 4) create large combined buffers
  const combinedPositions = new Float32Array(totalCount * 3);
  const combinedColors = new Float32Array(totalCount * 4);
  const combinedRadii = new Float32Array(totalCount);
  const combinedObjectIds = new Float32Array(totalCount);

  let offset = 0;
  for (let i = 0; i < positionsList.length; i++) {
    const p = positionsList[i];
    const c = colorsList[i];
    const r = radiiList[i];
    const ids = objectIdList[i];
    const cnt = ids.length;

    combinedPositions.set(p, offset * 3);
    combinedColors.set(c, offset * 4);
    combinedRadii.set(r, offset);
    combinedObjectIds.set(ids, offset);

    offset += cnt;
  }

  // 5) create a mesh with these vertex buffers
  const combinedMesh = new BABYLON.Mesh("combinedSplats", scene);

  combinedMesh.setVerticesData("position", combinedPositions, false, 3);
  combinedMesh.setVerticesData("color", combinedColors, false, 4);
  combinedMesh.setVerticesData("radius", combinedRadii, false, 1);
  combinedMesh.setVerticesData("objectId", combinedObjectIds, false, 1);

  // Important: this mesh contains only points; we want it to be rendered as points.
  // Shader will use gl_PointSize + discard outside circle; ensure material sets pointsCloud = true.
  const shaderMaterial = new BABYLON.ShaderMaterial(
    "splatMat",
    scene,
    {
      vertex: "splat",
      fragment: "splat",
    },
    {
      attributes: ["position", "color", "radius", "objectId"],
      uniforms: ["worldViewProjection", "objectMatrices"],
      needAlphaBlending: true,
      needAlphaTesting: false,
    }
  );

  // enable points cloud rendering on the material
  shaderMaterial.pointsCloud = true;
  shaderMaterial.backFaceCulling = false;
  shaderMaterial.alpha = 1.0;

  // initial object matrices (identity)
  const objectMatrices = [];
  for (let i = 0; i < splatFiles.length; i++) {
    objectMatrices.push(BABYLON.Matrix.Identity());
  }
  shaderMaterial.setMatrices("objectMatrices", objectMatrices);

  combinedMesh.material = shaderMaterial;

  // Important: mark the mesh as unindexed, single-vertex-per-point. Babylon will draw points if pointsCloud true.
  combinedMesh.setIndices([]); // empty indices acceptable for point rendering

  // Optional: scale so splats visible (tweak as needed)
  combinedMesh.scaling = new BABYLON.Vector3(1, 1, 1);

  // show inspector for debugging
  scene.debugLayer.show();

  return { scene, combinedMesh, objectMatrices, shaderMaterial };
}

// Run
(async () => {
  const { scene, combinedMesh, objectMatrices, shaderMaterial } =
    await createScene();

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());

  // Example: move object 0 up after 2s
  setTimeout(() => {
    objectMatrices[0] = BABYLON.Matrix.Translation(0, 1.5, 0);
    shaderMaterial.setMatrices("objectMatrices", objectMatrices);
  }, 2000);
})();
