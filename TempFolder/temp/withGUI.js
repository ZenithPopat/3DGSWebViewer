import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders";

// --------------------------------------------------------
// Setup Scene
// --------------------------------------------------------
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);

const camera = new BABYLON.ArcRotateCamera(
  "camera",
  Math.PI / 2,
  Math.PI / 3,
  6,
  BABYLON.Vector3.Zero(),
  scene
);
camera.attachControl(canvas, true);
new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

// --------------------------------------------------------
// GUI: Upload Button
// --------------------------------------------------------
const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

const UiPanel = new GUI.StackPanel();
UiPanel.width = "220px";
UiPanel.fontSize = "14px";
UiPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
UiPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
advancedTexture.addControl(UiPanel);

const uploadBtn = GUI.Button.CreateSimpleButton("uploadBtn", "Upload Files");
uploadBtn.paddingTop = "10px";
uploadBtn.width = "120px";
uploadBtn.height = "50px";
uploadBtn.color = "white";
uploadBtn.background = "#0078d7";
uploadBtn.cornerRadius = 8;
UiPanel.addControl(uploadBtn);

// --------------------------------------------------------
// Input Element (hidden)
// --------------------------------------------------------
const input = document.createElement("input");
input.type = "file";
input.multiple = true;
input.accept = ".ply,.splat";
input.style.display = "none";
document.body.appendChild(input);

// --------------------------------------------------------
// Core Data
// --------------------------------------------------------
let metadataList = [];
let mergedBuffers = [];

// --------------------------------------------------------
// Button Event
// --------------------------------------------------------
uploadBtn.onPointerDownObservable.add(() => {
  input.click();
});

input.onchange = async () => {
  const files = Array.from(input.files);
  if (!files.length) return;

  console.log(
    "📂 Files selected:",
    files.map((f) => f.name)
  );

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = await file.arrayBuffer();

    // Create GaussianSplattingMesh for preview & metadata
    const mesh = new BABYLON.GaussianSplattingMesh(
      `gs_${i}`,
      undefined,
      scene,
      true
    );
    mesh.updateData(buffer);

    const bbox = mesh.getBoundingInfo().boundingBox;
    const meta = {
      id: i,
      fileName: file.name,
      splatCount: mesh.splatCount || 0,
      boundingBox: {
        min: bbox.minimumWorld.asArray(),
        max: bbox.maximumWorld.asArray(),
      },
      transform: mesh.getWorldMatrix().asArray(),
      visible: true,
    };

    metadataList.push(meta);
    mergedBuffers.push(buffer);
  }

  // Merge into single mesh
  const merged = new BABYLON.GaussianSplattingMesh("merged", undefined, scene);
  merged.updateData(await mergeBuffers(mergedBuffers));

  console.log("✅ Merged scene created");
  console.log("📦 Metadata:", metadataList);
};

// --------------------------------------------------------
// Helper: Merge Buffers
// --------------------------------------------------------
async function mergeBuffers(buffers) {
  const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return merged.buffer;
}

// --------------------------------------------------------
// Render Loop
// --------------------------------------------------------
engine.runRenderLoop(() => {
  scene.render();
});
window.addEventListener("resize", () => engine.resize());
