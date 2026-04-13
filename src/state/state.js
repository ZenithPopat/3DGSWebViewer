export const state = {
  metadataList: [], // list of objects loaded
  selectedObject: null, // currently selected object
  onSelectionChanged: null, // callback function
  mergedBytes: null, // Uint8Array for all splats
  mergedMesh: null, // GaussianSplattingMesh
  mergeMap: [],
  selectionBox: null, // bounding box highlight mesh
  editorGrid: null, // grid helper mesh
  eraseBackup: [],
  selectionTool: {
    enabled: false,
    shape: "sphere", // "sphere" or "box"
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
    invert: false,
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

    lastRenderTime: 0,
    avgRenderTime: 0,
    renderSamples: [],

    loadTimes: [],
    mergeTimes: [],
    bakeTimes: [],
  },

  editorState: {
    isInteracting: false,
    interactionMode: "IDLE", // IDLE / TRANSFORM / SELECT
    lastInteractionTime: 0,
  },
  renderSettings: {
    alphaThreshold: 20,
    maxViewDistance: Infinity,
    pendingAlphaThreshold: 20,
    pendingMaxViewDistance: Infinity,
    interactionAlphaBoost: 255,
  },
  sceneStats: {
    bounds: null,
  },
  ui: {
    sections: {
      importExport: true,
      objects: true,
      render: false,
      selection: false,
      shortcuts: false,
    },
  },
  interactionQuality: {
    idleScaling: 1.0,
    interactionScaling: 1.5,
  },
  renderPreset: "normal", // "quality" / "balanced" / "performance"

  presets: {
    pro: {
      hardwareScaling: 1.0,
      showGrid: true,
      showBoundingBoxes: true,
      showSelectionHelper: true,
      alphaThreshold: 10,
      maxViewDistance: Infinity,
    },

    normal: {
      hardwareScaling: 1.0,
      showGrid: false,
      showBoundingBoxes: true,
      showSelectionHelper: true,
      alphaThreshold: 20,
      maxViewDistance: 500,
    },

    performance: {
      hardwareScaling: 1.5,
      showGrid: false,
      showBoundingBoxes: false,
      showSelectionHelper: false,
      alphaThreshold: 40,
      maxViewDistance: 250,
    },
  },
  adaptiveScaling: {
    enabled: true,
    minScale: 1.0,
    maxScale: 2.0,
    targetFPS: 30,
    smoothing: 0.1,
    currentScale: 1.0,
  },
  camera: {
    mode: "orbit", // "orbit" / "fly"
  },
  cameras: {
    orbit: null,
    fly: null,
  },
};
