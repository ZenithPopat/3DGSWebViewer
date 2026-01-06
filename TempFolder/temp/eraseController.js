import * as BABYLON from "@babylonjs/core";
// import { state } from "../state/state.js";
// import { packSplatRecord } from "../splat/splatPacking.js";

// export function toggleEraseMode() {
//   state.erase.enabled = !state.erase.enabled;

//   if (state.erase.enabled) {
//     createEraseSphere();
//     // hookEraseMouse(state.scene);
//     enableEraseMouseFollow();
//     updateEraseSphereRadius(state.erase.radius);
//     console.log("Erase mode: ON");
//   } else {
//     destroyEraseSphere();

//     console.log("Erase mode: OFF");
//   }
// }

// export function isEraseModeEnabled() {
//   return state.erase.enabled;
// }

// /* ----------------------------------
//    Sphere lifecycle
// ---------------------------------- */

// function createEraseSphere() {
//   if (state.erase.sphere) return;

//   const scene = state.scene;
//   if (!scene) {
//     console.warn("Scene not ready yet");
//     return;
//   }

//   const sphere = BABYLON.MeshBuilder.CreateSphere(
//     "eraseSphere",
//     { diameter: state.erase.radius * 2 },
//     scene
//   );

//   const mat = new BABYLON.StandardMaterial("eraseSphereMat", scene);
//   mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
//   mat.alpha = 0.25;

//   sphere.material = mat;
//   sphere.isPickable = false;

//   // fixed position for now
//   sphere.position.set(0, 0.5, 0);
//   state.erase.center = new BABYLON.Vector3(0, 0.5, 0);

//   state.erase.sphere = sphere;
// }

// export function enableEraseMouseFollow() {
//   const scene = state.scene;

//   scene.onPointerMove = () => {
//     if (!state.erase.enabled) return;
//     if (!state.erase.sphere) return;
//     if (!state.ground) return;

//     const pick = scene.pick(
//       scene.pointerX,
//       scene.pointerY,
//       (mesh) => mesh === state.ground
//     );

//     if (!pick || !pick.hit || !pick.pickedPoint) return;

//     // move sphere
//     // state.erase.center.copyFrom(pick.pickedPoint);
//     // state.erase.sphere.position.copyFrom(pick.pickedPoint);
//     state.erase.center.x = pick.pickedPoint.x;
//     state.erase.center.z = pick.pickedPoint.z;

//     state.erase.sphere.position.x = pick.pickedPoint.x;
//     state.erase.sphere.position.z = pick.pickedPoint.z;

//     // STEP 4: selection + highlight
//     const selected = computeSplatsInsideSphere();
//     state.erase.selectedSplats = selected;
//     updateHighlightMesh(selected);
//   };
// }

// export function updateEraseSphereRadius(newRadius) {
//   state.erase.radius = newRadius;

//   if (!state.erase.sphere || !state.scene) return;

//   const scene = state.scene;

//   // Preserve material
//   const oldSphere = state.erase.sphere;
//   const material = oldSphere.material;

//   oldSphere.dispose();

//   const newSphere = BABYLON.MeshBuilder.CreateSphere(
//     "eraseSphere",
//     { diameter: state.erase.radius * 2 },
//     scene
//   );

//   newSphere.material = material;
//   newSphere.isPickable = false;

//   // Keep position
//   if (state.erase.center) {
//     newSphere.position.copyFrom(state.erase.center);
//   }

//   state.erase.sphere = newSphere;
// }

// function computeSplatsInsideSphere() {
//   if (!state.erase.center) return [];
//   if (!state.mergedMesh) return [];

//   const center = state.erase.center;
//   const r2 = state.erase.radius * state.erase.radius;

//   const world = new BABYLON.Vector3();
//   const local = new BABYLON.Vector3();
//   const wm = state.mergedMesh.getWorldMatrix();

//   const selected = [];

//   for (const meta of state.metadataList) {
//     for (const s of meta.parsed) {
//       // splat LOCAL position
//       local.set(s.px, s.py, s.pz);

//       // convert to WORLD
//       BABYLON.Vector3.TransformCoordinatesToRef(local, wm, world);

//       const dx = world.x - center.x;
//       const dy = world.y - center.y;
//       const dz = world.z - center.z;

//       if (dx * dx + dy * dy + dz * dz <= r2) {
//         selected.push(s);
//       }
//       if (meta === state.metadataList[0] && s === meta.parsed[0]) {
//         console.log("First splat px:", s.px, s.py, s.pz);
//         console.log("Merged mesh pos:", state.mergedMesh.position.toString());
//       }
//     }
//   }

//   return selected;
// }

// function updateHighlightMesh(selectedSplats) {
//   // Remove old highlight mesh
//   if (state.erase.highlightMesh) {
//     state.erase.highlightMesh.dispose();
//     state.erase.highlightMesh = null;
//   }

//   if (selectedSplats.length === 0) return;

//   const RECORD_BYTES = 32;
//   const buf = new Uint8Array(selectedSplats.length * RECORD_BYTES);

//   for (let i = 0; i < selectedSplats.length; i++) {
//     const s = selectedSplats[i];

//     // Make a visual copy (brighter + slightly larger)
//     const highlightSplat = {
//       ...s,
//       r: 255,
//       g: 255,
//       b: 0,
//       a: 200,
//       sx: s.sx * 1.2,
//       sy: s.sy * 1.2,
//       sz: s.sz * 1.2,
//     };

//     packSplatRecord(buf, i, highlightSplat);
//   }

//   const mesh = new BABYLON.GaussianSplattingMesh(
//     "eraseHighlight",
//     undefined,
//     state.scene
//   );

//   mesh.updateData(buf.buffer);
//   mesh.isPickable = false;

//   mesh.position.copyFrom(state.mergedMesh.position);
//   mesh.scaling.copyFrom(state.mergedMesh.scaling);
//   mesh.rotationQuaternion = state.mergedMesh.rotationQuaternion;

//   state.erase.highlightMesh = mesh;
// }

// function destroyEraseSphere() {
//   if (state.erase.sphere) {
//     state.erase.sphere.dispose();
//     state.erase.sphere = null;
//   }

//   if (state.erase.highlightMesh) {
//     state.erase.highlightMesh.dispose();
//     state.erase.highlightMesh = null;
//   }

//   state.erase.selectedSplats = [];
//   state.erase.center = null;

//   // IMPORTANT: remove pointer handler
//   const scene = state.scene;
//   if (scene) {
//     scene.onPointerMove = null;
//   }
// }

// // export function hookEraseMouse(scene) {
// //   scene.onPointerMove = () => {
// //     if (!state.erase.enabled || !state.erase.sphere) return;

// //     const ray = scene.createPickingRay(
// //       scene.pointerX,
// //       scene.pointerY,
// //       BABYLON.Matrix.Identity(),
// //       scene.activeCamera
// //     );

// //     const hit = ray.intersectsPlane(state.erase.plane);
// //     // if (!hit) return;
// //     if (!hit || !hit.pickedPoint) return;

// //     state.erase.center.copyFrom(hit.pickedPoint);
// //     state.erase.sphere.position.copyFrom(hit.pickedPoint);
// //   };
// // }

// // function destroyEraseSphere() {
// //   if (!state.erase.sphere) return;

// //   state.erase.sphere.dispose();
// //   state.erase.sphere = null;
// // }
