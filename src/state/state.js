export const state = {
  metadataList: [], // list of objects loaded
  selectedObject: null, // currently selected object
  onSelectionChanged: null, // callback function
  mergedBytes: null, // Uint8Array for all splats
  mergedMesh: null, // GaussianSplattingMesh
  selectionBox: null, // bounding box highlight mesh
  selectionTool: {
    enabled: false,
    shape: "sphere", // "sphere" | "box"
    mesh: null,
    gizmo: null,
    radius: 0.5,
    boxSize: { x: 1, y: 1, z: 1 }, // for box shape
    utilLayer: null,
  },
  selection: {
    splatIndices: new Set(), // merged splat indices
    objectId: null, // future: restrict to one object
    restrictToSelectedObject: false,
  },
  erase: {
    erasedSplatIndices: new Set(),
  },
};
