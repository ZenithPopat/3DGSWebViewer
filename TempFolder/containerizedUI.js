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
  isSelectionVolumeEnabled,
} from "../selection/selectionVolumeController.js";
import { applySelectionVolume } from "../selection/applySelectionVolume.js";
import { clearSelection } from "../selection/clearSelection.js";
import { selectObject, deselectObject } from "../splat/splatSelection.js";
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

  // const { container, header, resizeHandle } = createFloatingPanel(
  //   "sceneGraph",
  //   "Editor Panel"
  // );

  const projectPanel = createFloatingPanel("project", "📁 Project");

  // --- Import / Export ---
  const importExport = createCollapsibleSection(
    "Import / Export Files",
    "📁",
    true
  );
  projectPanel.container.appendChild(importExport.section);

  // Hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".splat";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  projectPanel.container.appendChild(fileInput);

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
        label: "⬇ Export Merged",
        variant: "primary",
        onClick: () => exportMerged("splat"),
      }),
      createButton({
        label: "⬇ Export Each",
        onClick: () => exportIndividually("splat"),
      }),
    ])
  );

  projectPanel.container.appendChild(importExport.section);

  projectPanel.container.appendChild(createSoftDivider());

  // --- Keyboard Shortcuts ---
  const shortcutsSection = createCollapsibleSection(
    "Keyboard Shortcuts",
    "⌨️",
    false
  );
  projectPanel.container.appendChild(shortcutsSection.section);

  function updateSelectionDependentUI() {
    shortcutsSection.section.style.opacity = state.selectedObject ? "1" : "0.6";
  }

  state.onSelectionChanged = () => {
    updateSelectionDependentUI();
  };
  updateSelectionDependentUI();

  shortcutsSection.content.appendChild(createKeyRow("A / D", "Move X"));
  shortcutsSection.content.appendChild(createKeyRow("W / S ", "Move Y"));
  shortcutsSection.content.appendChild(createKeyRow("Q / E", "Move Z"));
  shortcutsSection.content.appendChild(createKeyRow("Z / X", "Scale ±"));
  shortcutsSection.content.appendChild(createKeyRow("I / K", "Rotate X"));
  shortcutsSection.content.appendChild(createKeyRow("U / J", "Rotate Y"));
  shortcutsSection.content.appendChild(createKeyRow("Y / H", "Rotate Z"));
  shortcutsSection.content.appendChild(createKeyRow("R", "Delete Object"));

  // container.appendChild(createSoftDivider());

  // --- Objects in Scene ---
  const hasObjects = state.metadataList.length > 0;

  const sceneGraphPanel = createFloatingPanel("sceneGraph", "🧩 Scene Graph");

  const objectsSection = createCollapsibleSection(
    "Objects in Scene",
    "🧩",
    hasObjects
  );
  sceneGraphPanel.container.appendChild(objectsSection.section);

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

  // container.appendChild(createSoftDivider());

  // --- Selection Tool ---

  const toolsPanel = createFloatingPanel("tools", "🎯 Selection & Transform");

  const selectionSection = createCollapsibleSection(
    "Selection Tool",
    "🎯",
    false
  );
  toolsPanel.container.appendChild(selectionSection.section);

  // Toggle selection volume
  const selectionBtn = createButton({
    label: "🟦 Toggle Selection Sphere",
    onClick: () => {
      if (isSelectionVolumeEnabled()) {
        disableSelectionVolume();
        selectionBtn.style.background = "#444";
      } else {
        enableSelectionVolume();
        selectionBtn.style.background = "#2d8dff";
      }
    },
  });
  selectionSection.content.appendChild(selectionBtn);

  // Radius label
  const radiusLabel = document.createElement("div");
  radiusLabel.textContent = "Sphere Radius";
  radiusLabel.style.fontSize = "12px";
  radiusLabel.style.opacity = "0.8";
  radiusLabel.style.margin = "6px 0 2px";
  selectionSection.content.appendChild(radiusLabel);

  // Radius slider
  const radiusSlider = document.createElement("input");
  radiusSlider.type = "range";
  radiusSlider.min = "0.05";
  radiusSlider.max = "5";
  radiusSlider.step = "0.05";
  radiusSlider.value = state.selectionTool.radius;
  radiusSlider.style.width = "100%";
  radiusSlider.oninput = (e) =>
    setSelectionVolumeRadius(Number(e.target.value));
  selectionSection.content.appendChild(radiusSlider);

  // Restrict checkbox
  const restrictWrapper = document.createElement("label");
  restrictWrapper.style.display = "flex";
  restrictWrapper.style.gap = "6px";
  restrictWrapper.style.marginTop = "6px";

  const restrictCheckbox = document.createElement("input");
  restrictCheckbox.type = "checkbox";
  restrictCheckbox.checked = state.selection.restrictToSelectedObject;
  restrictCheckbox.onchange = () => {
    state.selection.restrictToSelectedObject = restrictCheckbox.checked;
  };

  const restrictText = document.createElement("span");
  restrictText.textContent = "Restrict to selected object";

  restrictWrapper.append(restrictCheckbox, restrictText);
  selectionSection.content.appendChild(restrictWrapper);

  // Action buttons
  selectionSection.content.appendChild(
    createButtonRow([
      createButton({
        label: "✅ Set",
        variant: "primary",
        onClick: applySelectionVolume,
      }),
      createButton({
        label: "❌ Clear",
        onClick: clearSelection,
      }),
    ])
  );

  sceneGraphPanel.container.style.left = "10px";
  sceneGraphPanel.container.style.top = "10px";

  toolsPanel.container.style.left = "270px";
  toolsPanel.container.style.top = "10px";

  projectPanel.container.style.left = "10px";
  projectPanel.container.style.top = "300px";

  // --- Drag & Resize Logic ---

  enableDragAndResize(
    sceneGraphPanel.container,
    sceneGraphPanel.header,
    sceneGraphPanel.resizeHandle
  );

  enableDragAndResize(
    toolsPanel.container,
    toolsPanel.header,
    toolsPanel.resizeHandle
  );

  enableDragAndResize(
    projectPanel.container,
    projectPanel.header,
    projectPanel.resizeHandle
  );

  // document.body.appendChild(container);
  document.body.appendChild(projectPanel.container);
  document.body.appendChild(sceneGraphPanel.container);
  document.body.appendChild(toolsPanel.container);
}
