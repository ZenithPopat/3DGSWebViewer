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
} from "./uiBuilders.js";

// function createSoftDivider(margin = "12px 0") {
//   const d = document.createElement("div");
//   d.style.height = "1px";
//   d.style.margin = margin;
//   d.style.background =
//     "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)";
//   return d;
// }

// function createCollapsibleSection(title, icon = "", initiallyOpen = true) {
//   const section = document.createElement("div");

//   // Header row
//   const header = document.createElement("div");
//   header.style.display = "flex";
//   header.style.alignItems = "center";
//   header.style.justifyContent = "space-between";
//   header.style.cursor = "pointer";
//   header.style.margin = "10px 0 6px";
//   header.style.userSelect = "none";

//   const left = document.createElement("div");
//   left.style.display = "flex";
//   left.style.alignItems = "center";
//   left.style.gap = "6px";

//   const iconSpan = document.createElement("span");
//   iconSpan.textContent = icon;
//   iconSpan.style.fontSize = "14px";
//   iconSpan.style.opacity = "0.9";

//   const label = document.createElement("div");
//   label.textContent = title;
//   label.style.fontWeight = "600";
//   label.style.fontSize = "13px";
//   label.style.opacity = "0.85";

//   left.appendChild(iconSpan);
//   left.appendChild(label);

//   const arrow = document.createElement("span");
//   arrow.textContent = initiallyOpen ? "▾" : "▸";
//   arrow.style.fontSize = "14px";
//   arrow.style.opacity = "0.7";

//   header.appendChild(left);
//   header.appendChild(arrow);

//   // Content wrapper
//   const content = document.createElement("div");
//   content.style.display = initiallyOpen ? "block" : "none";

//   header.style.padding = "4px 6px";
//   header.style.borderRadius = "4px";

//   header.onmouseenter = () => {
//     header.style.background = "rgba(255,255,255,0.05)";
//   };
//   header.onmouseleave = () => {
//     header.style.background = "transparent";
//   };

//   header.onclick = () => {
//     const open = content.style.display !== "none";
//     content.style.display = open ? "none" : "block";
//     arrow.textContent = open ? "▸" : "▾";
//   };

//   section.appendChild(header);
//   section.appendChild(content);

//   return { section, content };
// }

export function createSceneGraphUI() {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  let isResizing = false;
  let startWidth = 0;
  let startHeight = 0;
  let startX = 0;
  let startY = 0;

  // Remove old UI
  const old = document.getElementById("sceneGraph");
  if (old) old.remove();

  // Container
  const container = document.createElement("div");
  container.id = "sceneGraph";

  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "10px";
  container.style.width = "240px";
  container.style.maxHeight = "85%";

  container.style.background = "rgba(30, 30, 30, 0.95)";
  container.style.border = "1px solid #444";
  container.style.borderRadius = "8px";
  container.style.padding = "10px";
  container.style.fontFamily = "Inter, Roboto, sans-serif";
  container.style.color = "#e5e5e5";
  container.style.fontSize = "13px";
  container.style.zIndex = "1100";
  container.style.overflowY = "auto";
  container.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";

  // Header
  const header = document.createElement("div");
  header.textContent = "Editor Panel";
  header.style.fontWeight = "600";
  header.style.fontSize = "14px";
  header.style.marginBottom = "10px";
  header.style.textAlign = "center";
  header.style.letterSpacing = "0.5px";
  header.style.cursor = "move";
  header.style.userSelect = "none";
  container.appendChild(header);

  const resizeHandle = document.createElement("div");
  resizeHandle.style.padding = "1px";
  resizeHandle.style.width = "14px";
  resizeHandle.style.height = "14px";
  resizeHandle.style.position = "absolute";
  resizeHandle.style.right = "2px";
  resizeHandle.style.bottom = "2px";
  resizeHandle.style.cursor = "nwse-resize";
  resizeHandle.style.background = "rgba(255,255,255,0.15)";
  resizeHandle.style.borderRadius = "3px";
  container.appendChild(resizeHandle);

  // const importExport = createCollapsibleSection(
  //   "Import / Export Files",
  //   "📁",
  //   true
  // );
  // container.appendChild(importExport.section);

  // const addBtn = document.createElement("button");
  // addBtn.textContent = "+ Add .splat files";
  // addBtn.style.width = "100%";
  // addBtn.style.padding = "8px";
  // addBtn.style.marginBottom = "12px";
  // addBtn.style.marginTop = "5px";
  // addBtn.style.border = "none";
  // addBtn.style.borderRadius = "6px";
  // addBtn.style.background = "#444";
  // addBtn.style.color = "white";
  // addBtn.style.cursor = "pointer";
  // addBtn.style.fontSize = "13px";
  // addBtn.style.fontWeight = "500";
  // addBtn.onmouseenter = () => (addBtn.style.background = "#444");
  // addBtn.onmouseleave = () => (addBtn.style.background = "#333");

  // // Hidden file input
  // const fileInput = document.createElement("input");
  // fileInput.type = "file";
  // fileInput.accept = ".splat";
  // fileInput.multiple = true;
  // fileInput.style.display = "none";
  // container.appendChild(fileInput);

  // addBtn.onclick = () => fileInput.click();
  // fileInput.onchange = (e) => handleFileUpload(Array.from(e.target.files));

  // // Wrapper for the buttons
  // const exportRow = document.createElement("div");
  // exportRow.style.display = "flex";
  // exportRow.style.gap = "6px";
  // exportRow.style.marginBottom = "12px";

  // // --- Export merged splats ---
  // const exportAllSplatBtn = document.createElement("button");
  // exportAllSplatBtn.textContent = "⬇ Export Merged";
  // exportAllSplatBtn.style.flex = "1";
  // exportAllSplatBtn.style.padding = "8px";
  // exportAllSplatBtn.style.border = "none";
  // exportAllSplatBtn.style.borderRadius = "6px";
  // exportAllSplatBtn.style.background = "#2d8dff";
  // exportAllSplatBtn.style.color = "white";
  // exportAllSplatBtn.style.cursor = "pointer";
  // exportAllSplatBtn.onclick = () => exportMerged("splat");

  // // --- Export each file ---
  // const exportEachSplatBtn = document.createElement("button");
  // exportEachSplatBtn.textContent = "⬇ Export Each";
  // exportEachSplatBtn.style.flex = "1";
  // exportEachSplatBtn.style.padding = "8px";
  // exportEachSplatBtn.style.border = "none";
  // exportEachSplatBtn.style.borderRadius = "6px";
  // exportEachSplatBtn.style.background = "#555";
  // exportEachSplatBtn.style.color = "white";
  // exportEachSplatBtn.style.cursor = "pointer";
  // exportEachSplatBtn.onclick = () => exportIndividually("splat");

  // // Append buttons to row
  // exportRow.appendChild(exportAllSplatBtn);
  // exportRow.appendChild(exportEachSplatBtn);

  // // Append row to container
  // importExport.content.appendChild(addBtn);
  // importExport.content.appendChild(exportRow);

  // container.appendChild(createSoftDivider());

  // const importExport = createCollapsibleSection("Import / Export", "📁", true);

  // container.appendChild(importExport.section);

  // importExport.content.appendChild(
  //   createButton({
  //     label: "+ Add .splat files",
  //     onClick: () => fileInput.click(),
  //   })
  // );

  // importExport.content.appendChild(
  //   createButtonRow([
  //     createButton({
  //       label: "⬇ Export Merged",
  //       variant: "primary",
  //       onClick: () => exportMerged("splat"),
  //     }),
  //     createButton({
  //       label: "⬇ Export Each",
  //       onClick: () => exportIndividually("splat"),
  //     }),
  //   ])
  // );

  // container.appendChild(createSoftDivider());

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
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 4px",
      marginBottom: "4px",
      borderRadius: "4px",
      cursor: "pointer",
    });

    row.onmouseenter = () => (row.style.background = "rgba(255,255,255,0.06)");
    row.onmouseleave = () => {
      if (state.selectedObject?.id !== meta.id)
        row.style.background = "transparent";
    };

    const name = document.createElement("div");
    name.textContent = meta.fileName.replace(/\.(splat)$/, "");
    Object.assign(name.style, {
      flex: "1",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
    name.onclick = () => selectObject(meta, state.scene);

    const tools = document.createElement("div");
    tools.style.display = "flex";
    tools.style.gap = "10px";

    const camBtn = document.createElement("span");
    camBtn.textContent = "🎯";
    camBtn.onclick = (e) => {
      e.stopPropagation();
      focusCameraOn(meta);
    };

    const delBtn = document.createElement("span");
    delBtn.textContent = "✕";
    delBtn.style.color = "#ff6b6b";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeObject(meta);
    };

    const eyeBtn = document.createElement("span");
    eyeBtn.textContent = meta.visible ? "👁️" : "🙈";
    eyeBtn.onclick = (e) => {
      e.stopPropagation();
      toggleVisibility(meta);
    };

    tools.append(camBtn, delBtn, eyeBtn);
    row.append(name, tools);
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
  const selectionSection = createCollapsibleSection(
    "Selection Tool",
    "🎯",
    false
  );
  container.appendChild(selectionSection.section);

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

  // const objectsSection = createCollapsibleSection(
  //   "Objects in Scene",
  //   "🧩",
  //   hasObjects
  // );
  // container.appendChild(objectsSection.section);

  // if (!hasObjects) {
  //   const hint = document.createElement("div");
  //   hint.textContent = "No objects loaded";
  //   hint.style.fontSize = "12px";
  //   hint.style.opacity = "0.6";
  //   hint.style.padding = "4px 0";
  //   objectsSection.content.appendChild(hint);
  // }

  // // Add objects
  // state.metadataList.forEach((meta) => {
  //   const row = document.createElement("div");
  //   row.style.display = "flex";
  //   row.style.alignItems = "center";
  //   row.style.justifyContent = "space-between";
  //   row.style.padding = "6px 4px";
  //   row.style.marginBottom = "4px";
  //   row.style.borderRadius = "4px";
  //   row.style.cursor = "pointer";
  //   row.style.transition = "0.15s background";

  //   row.onmouseenter = () => (row.style.background = "rgba(255,255,255,0.06)");
  //   row.onmouseleave = () => {
  //     if (state.selectedObject?.id !== meta.id)
  //       row.style.background = "transparent";
  //   };

  //   // File label (select object)
  //   const label = document.createElement("span");
  //   label.textContent = meta.fileName;
  //   label.style.cursor = "pointer";
  //   label.onclick = () => selectObject(meta, state.scene);
  //   if (state.selectedObject?.id === meta.id) {
  //     row.style.background = "rgba(50,150,255,0.25)";
  //   }

  //   const name = document.createElement("div");
  //   name.textContent = meta.fileName.replace(/\.(splat)$/, "");
  //   name.style.flex = "1";
  //   name.style.whiteSpace = "nowrap";
  //   name.style.overflow = "hidden";
  //   name.style.textOverflow = "ellipsis";
  //   name.onclick = () => selectObject(meta, state.scene);
  //   row.appendChild(name);

  //   const tools = document.createElement("div");
  //   tools.style.display = "flex";
  //   tools.style.alignItems = "center";
  //   tools.style.gap = "10px";

  //   // Focus camera button
  //   const camBtn = document.createElement("span");
  //   camBtn.textContent = "🎯";
  //   camBtn.style.cursor = "pointer";
  //   camBtn.style.fontSize = "18px";
  //   camBtn.title = "Focus camera";
  //   camBtn.onclick = (ev) => {
  //     ev.stopPropagation();
  //     focusCameraOn(meta);
  //   };

  //   // Delete button
  //   const delBtn = document.createElement("span");
  //   delBtn.textContent = "✕";
  //   delBtn.style.cursor = "pointer";
  //   delBtn.style.fontWeight = "600";
  //   delBtn.style.color = "#ff6b6b";
  //   delBtn.style.fontSize = "18px";
  //   delBtn.title = "Delete object";
  //   delBtn.onclick = (ev) => {
  //     ev.stopPropagation();
  //     removeObject(meta);
  //   };
  //   tools.appendChild(delBtn);

  //   const eyeBtn = document.createElement("span");
  //   eyeBtn.textContent = meta.visible ? "👁️" : "🙈";
  //   eyeBtn.style.cursor = "pointer";
  //   eyeBtn.style.fontSize = "18px";
  //   eyeBtn.title = "Toggle visibility";
  //   eyeBtn.onclick = (ev) => {
  //     ev.stopPropagation();
  //     toggleVisibility(meta);
  //   };

  //   // Append toolbar items
  //   tools.appendChild(camBtn);
  //   tools.appendChild(delBtn);
  //   tools.appendChild(eyeBtn);

  //   row.appendChild(tools);
  //   objectsSection.content.appendChild(row);
  // });

  // const deselectBtn = document.createElement("button");
  // deselectBtn.textContent = "⬜ Deselect Object";
  // deselectBtn.style.width = "100%";
  // deselectBtn.style.padding = "8px";
  // deselectBtn.style.marginTop = "6px";
  // deselectBtn.style.border = "none";
  // deselectBtn.style.borderRadius = "6px";
  // deselectBtn.style.background = "#555";
  // deselectBtn.style.color = "white";
  // deselectBtn.style.cursor = "pointer";

  // deselectBtn.onclick = () => deselectObject();

  // objectsSection.content.appendChild(deselectBtn);

  // container.appendChild(createSoftDivider());

  // Selection Tool UI

  // const selectionSection = createCollapsibleSection(
  //   "Selection Tool",
  //   "🎯",
  //   false
  // );
  // container.appendChild(selectionSection.section);

  // const selectionBtn = document.createElement("button");
  // selectionBtn.textContent = "🟦 Toggle Selection Sphere";
  // selectionBtn.style.width = "100%";
  // selectionBtn.style.padding = "8px";
  // selectionBtn.style.marginBottom = "6px";
  // selectionBtn.style.border = "none";
  // selectionBtn.style.borderRadius = "6px";
  // selectionBtn.style.background = "#444";
  // selectionBtn.style.color = "white";
  // selectionBtn.style.cursor = "pointer";

  // selectionBtn.onclick = () => {
  //   if (isSelectionVolumeEnabled()) {
  //     disableSelectionVolume();
  //     selectionBtn.style.background = "#444";
  //   } else {
  //     enableSelectionVolume();
  //     selectionBtn.style.background = "#2d8dff";
  //   }
  // };

  // const radiusLabel = document.createElement("div");
  // radiusLabel.textContent = "Sphere Radius";
  // radiusLabel.style.fontSize = "12px";
  // radiusLabel.style.opacity = "0.8";
  // radiusLabel.style.marginBottom = "2px";
  // container.appendChild(radiusLabel);

  // const radiusSlider = document.createElement("input");
  // radiusSlider.type = "range";
  // radiusSlider.min = "0.05";
  // radiusSlider.max = "5";
  // radiusSlider.step = "0.05";
  // radiusSlider.value = state.selectionTool.radius;
  // radiusSlider.style.width = "100%";

  // radiusSlider.oninput = (e) => {
  //   setSelectionVolumeRadius(Number(e.target.value));
  // };

  // const restrictWrapper = document.createElement("label");
  // restrictWrapper.style.display = "flex";
  // restrictWrapper.style.alignItems = "center";
  // restrictWrapper.style.gap = "6px";
  // restrictWrapper.style.fontSize = "12px";
  // restrictWrapper.style.marginTop = "6px";
  // restrictWrapper.style.cursor = "pointer";

  // const restrictCheckbox = document.createElement("input");
  // restrictCheckbox.type = "checkbox";
  // restrictCheckbox.checked = state.selection.restrictToSelectedObject;

  // restrictCheckbox.onchange = () => {
  //   state.selection.restrictToSelectedObject = restrictCheckbox.checked;
  // };

  // const restrictText = document.createElement("span");
  // restrictText.textContent = "Restrict to selected object";

  // restrictWrapper.appendChild(restrictCheckbox);
  // restrictWrapper.appendChild(restrictText);

  // // Selection action buttons row
  // const selectionActionRow = document.createElement("div");
  // selectionActionRow.style.display = "flex";
  // selectionActionRow.style.gap = "6px";
  // selectionActionRow.style.marginTop = "8px";

  // // --- Set Selection ---
  // const setSelectionBtn = document.createElement("button");
  // setSelectionBtn.textContent = "✅ Set";
  // setSelectionBtn.style.flex = "1";
  // setSelectionBtn.style.padding = "8px";
  // setSelectionBtn.style.border = "none";
  // setSelectionBtn.style.borderRadius = "6px";
  // setSelectionBtn.style.background = "#2d8dff";
  // setSelectionBtn.style.color = "white";
  // setSelectionBtn.style.cursor = "pointer";

  // setSelectionBtn.onclick = () => {
  //   applySelectionVolume();
  // };

  // // --- Clear Selection ---
  // const clearSelectionBtn = document.createElement("button");
  // clearSelectionBtn.textContent = "❌ Clear";
  // clearSelectionBtn.style.flex = "1";
  // clearSelectionBtn.style.padding = "8px";
  // clearSelectionBtn.style.border = "none";
  // clearSelectionBtn.style.borderRadius = "6px";
  // clearSelectionBtn.style.background = "#555";
  // clearSelectionBtn.style.color = "white";
  // clearSelectionBtn.style.cursor = "pointer";

  // clearSelectionBtn.onclick = () => {
  //   clearSelection();
  // };

  // // Append buttons to row
  // selectionActionRow.appendChild(setSelectionBtn);
  // selectionActionRow.appendChild(clearSelectionBtn);

  // // Append row to container
  // selectionSection.content.appendChild(selectionBtn);
  // selectionSection.content.appendChild(radiusLabel);
  // selectionSection.content.appendChild(radiusSlider);
  // selectionSection.content.appendChild(restrictWrapper);
  // selectionSection.content.appendChild(selectionActionRow);

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    document.body.style.userSelect = "none"; // prevent text select
  });

  header.addEventListener("touchstart", (e) => {
    isDragging = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - container.offsetLeft;
    offsetY = touch.clientY - container.offsetTop;
    document.body.style.userSelect = "none";
  });

  // Move panel
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    container.style.left = e.clientX - offsetX + "px";
    container.style.top = e.clientY - offsetY + "px";
  });

  window.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    container.style.left = touch.clientX - offsetX + "px";
    container.style.top = touch.clientY - offsetY + "px";
  });

  // Stop drag
  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });

  window.addEventListener("touchend", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });

  resizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;

    startWidth = container.offsetWidth;
    startHeight = container.offsetHeight;
    startX = e.clientX;
    startY = e.clientY;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);

    // enforce minimum size
    container.style.width = Math.max(180, newWidth) + "px";
    container.style.height = Math.max(150, newHeight) + "px";
  });

  window.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "auto";
  });

  document.body.appendChild(container);
}
