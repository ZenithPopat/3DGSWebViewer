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
    previewHighlight: false,
    restrictToSelectedObject: false,
  },
  erase: {
    erasedSplatIndices: new Set(),
  },
  stats: {
    totalSplats: 0, // after load / merge
    visibleSplats: 0, // after erase / filtering
  },

  performance: {
    samples: [],
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
  },

  editorState: {
    isInteracting: false,
    interactionMode: "IDLE", // IDLE | TRANSFORM | SELECT
    lastInteractionTime: 0,
  },
  renderSettings: {
    // alphaThreshold: 0.01, // default alpha cutoff
    alphaThreshold: 0.1, // default alpha cutoff
    maxViewDistance: Infinity, // or null
    scenePruneRadius: null,
  },
  sceneStats: {
    // center: null,
    // maxSceneRadius: null,
    bounds: null,
  },
};

state.stats.totalSplats ??= 0;
state.stats.visibleSplats ??= 0;
