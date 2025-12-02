export const state = {
  metadataList: [], // list of objects loaded
  selectedObject: null, // currently selected object
  mergedBytes: null, // Uint8Array for all splats
  mergedMesh: null, // GaussianSplattingMesh
  selectionBox: null, // bounding box highlight mesh
};
