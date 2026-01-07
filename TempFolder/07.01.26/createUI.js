import { state } from "../state/state.js";
import { handleFileUpload } from "../upload/uploadHandler.js";
import { focusCameraOn } from "../utils/focusCamera.js";
import { toggleVisibility } from "../splat/toggleVisibility.js";
import { exportMerged } from "../export/exportMerged.js";
import { exportIndividually } from "../export/exportEach.js";
import { removeObject } from "../splat/removeObject.js";
import {
  enableSelectionVolume,
  disableSelectionVolume,
  setSelectionVolumeRadius,
  setSelectionBoxSize,
  isSelectionVolumeEnabled,
  setSelectionShape,
} from "../selection/selectionVolumeController.js";
import { applySelectionVolume } from "../selection/applySelectionVolume.js";
import { clearSelection } from "../selection/clearSelection.js";
import { selectObject, deselectObject } from "../splat/splatSelection.js";
import { eraseSelectedSplats } from "../selection/eraseSelectedSplats.js";

import {
  createSoftDivider,
  createButton,
  createButtonRow,
  createCollapsibleSection,
  createFloatingPanel,
  enableDragAndResize,
  createObjectRow,
  createKeyRow,
} from "./uiBuilders.js";

export function createSceneGraphUI() {
  // Remove old UI
  const old = document.getElementById("sceneGraph");
  if (old) old.remove();

  const { container, header, resizeHandle } = createFloatingPanel(
    "sceneGraph",
    "Editor Panel"
  );

  // --- Import / Export ---
  const importExport = createCollapsibleSection(
    "Import / Export Files",
    "📁",
    true
  );
  container.appendChild(importExport.section);

  // Hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".splat";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  container.appendChild(fileInput);

  fileInput.onchange = (e) => handleFileUpload(Array.from(e.target.files));

  // Add button
  importExport.content.appendChild(
    createButton({
      label: "+ Add .splat files",
      onClick: () => fileInput.click(),
    })
  );

  // Export buttons
  importExport.content.appendChild(
    createButtonRow([
      createButton({
        label: "⬇ Export All (World Space)",
        variant: "primary",
        onClick: () => exportMerged("splat"),
      }),
      createButton({
        label: "⬇ Export Each (Local Space)",
        onClick: () => exportIndividually("splat"),
      }),
    ])
  );

  importExport.content.appendChild(createSoftDivider("8px 0"));

  const convertHint = document.createElement("div");
  convertHint.textContent =
    "Have .PLY files? Convert them to .SPLAT before importing.";
  convertHint.style.fontSize = "12px";
  convertHint.style.opacity = "0.7";
  convertHint.style.margin = "4px 0 6px";

  importExport.content.appendChild(convertHint);

  // importExport.content.appendChild(
  //   createButton({
  //     label: "🔁 Convert .PLY → .SPLAT (Online)",
  //     onClick: () => {
  //       window.open(
  //         "https://YOUR-CONVERTER-URL-HERE",
  //         "_blank",
  //         "noopener,noreferrer"
  //       );
  //     },
  //   })
  // );

  const convertBtn = createButton({
    label: "🔁 Convert .PLY → .SPLAT (Online)",
    onClick: () => {
      window.open(
        "https://huggingface.co/spaces/dylanebert/ply-to-splat",
        "_blank"
      );
    },
  });

  convertBtn.style.background = "#333";
  convertBtn.style.border = "1px dashed rgba(255,255,255,0.25)";
  importExport.content.appendChild(convertBtn);

  container.appendChild(createSoftDivider());

  // --- Objects in Scene ---
  const hasObjects = state.metadataList.length > 0;

  const objectsSection = createCollapsibleSection(
    "Objects in Scene",
    "🧩",
    hasObjects
  );
  container.appendChild(objectsSection.section);

  if (!hasObjects) {
    const hint = document.createElement("div");
    hint.textContent = "No objects loaded";
    hint.style.fontSize = "12px";
    hint.style.opacity = "0.6";
    hint.style.padding = "4px 0";
    objectsSection.content.appendChild(hint);
  }

  // Object rows
  state.metadataList.forEach((meta) => {
    const row = createObjectRow(meta, {
      isSelected: state.selectedObject?.id === meta.id,
      onSelect: () => selectObject(meta, state.scene),
      onFocus: () => focusCameraOn(meta),
      onDelete: () => removeObject(meta),
      onToggleVisibility: () => toggleVisibility(meta),
    });

    objectsSection.content.appendChild(row);
  });

  // Deselect button (only if objects exist)
  if (hasObjects) {
    objectsSection.content.appendChild(
      createButton({
        label: "⬜ Deselect Object",
        onClick: deselectObject,
      })
    );
  }

  container.appendChild(createSoftDivider());

  // --- Selection Tool ---
  // const selectionSection = createCollapsibleSection(
  //   "Selection Tool",
  //   "🎯",
  //   false
  // );
  // container.appendChild(selectionSection.section);

  // // Toggle selection volume
  // // const selectionBtn = createButton({
  // //   label: "🟦 Toggle Splat Selection Sphere",
  // //   onClick: () => {
  // //     if (isSelectionVolumeEnabled()) {
  // //       disableSelectionVolume();
  // //       selectionBtn.style.background = "#444";
  // //     } else {
  // //       enableSelectionVolume();
  // //       selectionBtn.style.background = "#2d8dff";
  // //     }
  // //   },
  // // });
  // // selectionSection.content.appendChild(selectionBtn);

  // const selectionBtn = createButton({
  //   label: "🎯 Enable Selection Tool",
  //   onClick: () => {
  //     const enabled = isSelectionVolumeEnabled();
  //     if (enabled) {
  //       disableSelectionVolume();
  //       selectionBtn.textContent = "🎯 Enable Selection Tool";
  //       selectionBtn.style.background = "#444";
  //     } else {
  //       enableSelectionVolume();
  //       selectionBtn.textContent = "🎯 Disable Selection Tool";
  //       selectionBtn.style.background = "#2d8dff";
  //     }
  //   },
  // });
  // selectionSection.content.appendChild(selectionBtn);

  // const shapeLabel = document.createElement("div");
  // shapeLabel.textContent = "Selection Shape";
  // shapeLabel.style.fontSize = "12px";
  // shapeLabel.style.opacity = "0.8";
  // shapeLabel.style.margin = "6px 0 2px";

  // selectionSection.content.appendChild(shapeLabel);
  // // selectionSection.content.appendChild(shapeSelect);

  // const shapeSelect = document.createElement("select");

  // Object.assign(shapeSelect.style, {
  //   width: "100%",
  //   padding: "8px",
  //   marginBottom: "6px",
  //   borderRadius: "6px",
  //   border: "1px solid #444",
  //   background: "#333",
  //   color: "#e5e5e5",
  //   fontSize: "13px",
  //   cursor: "pointer",
  //   outline: "none",
  // });

  // shapeSelect.onmouseenter = () => {
  //   shapeSelect.style.borderColor = "#555";
  // };
  // shapeSelect.onmouseleave = () => {
  //   shapeSelect.style.borderColor = "#444";
  // };
  // shapeSelect.onfocus = () => {
  //   shapeSelect.style.borderColor = "#2d8dff";
  // };
  // shapeSelect.onblur = () => {
  //   shapeSelect.style.borderColor = "#444";
  // };

  // ["sphere", "box"].forEach((s) => {
  //   const opt = document.createElement("option");
  //   opt.value = s;
  //   opt.textContent = s === "sphere" ? "Sphere Selection" : "Box Selection";
  //   shapeSelect.appendChild(opt);
  // });

  // shapeSelect.value = state.selectionTool.shape;

  // shapeSelect.onchange = (e) => {
  //   setSelectionShape(e.target.value);
  //   syncSelectionSizeSlider();
  // };

  // selectionSection.content.appendChild(shapeSelect);

  // // const shapeSelect = document.createElement("select");
  // // shapeSelect.style.width = "100%";
  // // shapeSelect.style.marginBottom = "6px";

  // // ["sphere", "box"].forEach((s) => {
  // //   const opt = document.createElement("option");
  // //   opt.value = s;
  // //   opt.textContent = s === "sphere" ? "Sphere Selection" : "Box Selection";
  // //   shapeSelect.appendChild(opt);
  // // });

  // // shapeSelect.value = state.selectionTool.shape;

  // // shapeSelect.onchange = (e) => {
  // //   setSelectionShape(e.target.value);
  // //   syncSelectionSizeSlider();
  // // };

  // // selectionSection.content.appendChild(shapeSelect);

  // // Radius label
  // const radiusLabel = document.createElement("div");
  // radiusLabel.textContent = "Sphere Radius";
  // radiusLabel.style.fontSize = "12px";
  // radiusLabel.style.opacity = "0.8";
  // radiusLabel.style.margin = "6px 0 2px";
  // selectionSection.content.appendChild(radiusLabel);

  // // Radius slider
  // const radiusSlider = document.createElement("input");
  // radiusSlider.type = "range";
  // radiusSlider.min = "0.05";
  // radiusSlider.max = "5";
  // radiusSlider.step = "0.05";
  // radiusSlider.value = state.selectionTool.radius;
  // radiusSlider.style.width = "100%";
  // function syncSelectionSizeSlider() {
  //   if (state.selectionTool.shape === "sphere") {
  //     radiusLabel.textContent = "Sphere Radius";
  //     radiusSlider.value = state.selectionTool.radius;
  //   } else if (state.selectionTool.shape === "box") {
  //     radiusLabel.textContent = "Box Size";
  //     radiusSlider.value = state.selectionTool.boxSize.x;
  //   }
  // }
  // radiusSlider.oninput = (e) => {
  //   const value = Number(e.target.value);

  //   if (state.selectionTool.shape === "sphere") {
  //     setSelectionVolumeRadius(value);
  //   } else if (state.selectionTool.shape === "box") {
  //     setSelectionBoxSize(value, value, value);
  //   }
  // };
  // selectionSection.content.appendChild(radiusSlider);
  // syncSelectionSizeSlider();

  // // Restrict checkbox
  // const restrictWrapper = document.createElement("label");
  // restrictWrapper.style.display = "flex";
  // restrictWrapper.style.gap = "6px";
  // restrictWrapper.style.marginTop = "6px";

  // const restrictCheckbox = document.createElement("input");
  // restrictCheckbox.type = "checkbox";
  // restrictCheckbox.checked = state.selection.restrictToSelectedObject;
  // restrictCheckbox.onchange = () => {
  //   state.selection.restrictToSelectedObject = restrictCheckbox.checked;
  // };

  // const restrictText = document.createElement("span");
  // restrictText.textContent = "Restrict to selected object";

  // restrictWrapper.append(restrictCheckbox, restrictText);
  // selectionSection.content.appendChild(restrictWrapper);

  // // Action buttons
  // selectionSection.content.appendChild(
  //   createButtonRow([
  //     createButton({
  //       label: "✅ Set",
  //       variant: "primary",
  //       onClick: applySelectionVolume,
  //     }),
  //     createButton({
  //       label: "❌ Clear",
  //       onClick: clearSelection,
  //     }),
  //     createButton({
  //       label: "🗑️ Erase",
  //       variant: "danger",
  //       onClick: eraseSelectedSplats,
  //     }),
  //   ])
  // );

  // container.appendChild(createSoftDivider());

  // --- Keyboard Shortcuts ---
  const shortcutsSection = createCollapsibleSection(
    "Keyboard Shortcuts",
    "⌨️",
    false
  );
  container.appendChild(shortcutsSection.section);

  // function updateSelectionDependentUI() {
  //   shortcutsSection.section.style.opacity = state.selectedObject ? "1" : "0.6";
  // }

  shortcutsSection.section.style.opacity = state.selectedObject ? "1" : "0.6";

  state.onSelectionChanged = () => {
    // updateSelectionDependentUI();
    createSceneGraphUI();
  };
  // updateSelectionDependentUI();

  shortcutsSection.content.appendChild(createKeyRow("A / D", "Move X"));
  shortcutsSection.content.appendChild(createKeyRow("W / S ", "Move Y"));
  shortcutsSection.content.appendChild(createKeyRow("Q / E", "Move Z"));
  shortcutsSection.content.appendChild(createKeyRow("Z / X", "Scale ±"));
  shortcutsSection.content.appendChild(createKeyRow("I / K", "Rotate X"));
  shortcutsSection.content.appendChild(createKeyRow("U / J", "Rotate Y"));
  shortcutsSection.content.appendChild(createKeyRow("Y / H", "Rotate Z"));
  shortcutsSection.content.appendChild(createKeyRow("R", "Delete Object"));

  // --- Drag & Resize Logic ---

  enableDragAndResize(container, header, resizeHandle);

  document.body.appendChild(container);
}
