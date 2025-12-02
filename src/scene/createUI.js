import { state } from "../state/state.js";
import { handleFileUpload } from "../upload/uploadHandler.js";
import { selectObject } from "../splat/splatSelection.js";
import { focusCameraOn } from "../utils/focusCamera.js";
import { toggleVisibility } from "../splat/toggleVisibility.js";

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
  header.textContent = "Scene Graph";
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

  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add .splat files";
  addBtn.style.width = "100%";
  addBtn.style.padding = "8px";
  addBtn.style.marginBottom = "12px";
  addBtn.style.border = "none";
  addBtn.style.borderRadius = "6px";
  addBtn.style.background = "#444";
  addBtn.style.color = "white";
  addBtn.style.cursor = "pointer";
  addBtn.style.fontSize = "13px";
  addBtn.style.fontWeight = "500";
  addBtn.onmouseenter = () => (addBtn.style.background = "#444");
  addBtn.onmouseleave = () => (addBtn.style.background = "#333");
  container.appendChild(addBtn);

  // Hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".splat";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  container.appendChild(fileInput);

  addBtn.onclick = () => fileInput.click();
  fileInput.onchange = (e) => handleFileUpload(Array.from(e.target.files));

  // Add objects
  state.metadataList.forEach((meta) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.padding = "6px 4px";
    row.style.marginBottom = "4px";
    row.style.borderRadius = "4px";
    row.style.cursor = "pointer";
    row.style.transition = "0.15s background";

    row.onmouseenter = () => (row.style.background = "rgba(255,255,255,0.06)");
    row.onmouseleave = () => {
      if (state.selectedObject?.id !== meta.id)
        row.style.background = "transparent";
    };

    // File label (select object)
    const label = document.createElement("span");
    label.textContent = meta.fileName;
    label.style.cursor = "pointer";
    label.onclick = () => selectObject(meta, state.scene);
    if (state.selectedObject?.id === meta.id) {
      row.style.background = "rgba(50,150,255,0.25)";
    }

    const name = document.createElement("div");
    name.textContent = meta.fileName.replace(/\.(splat)$/, "");
    name.style.flex = "1";
    name.style.whiteSpace = "nowrap";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    name.onclick = () => selectObject(meta, state.scene);
    row.appendChild(name);

    const tools = document.createElement("div");
    tools.style.display = "flex";
    tools.style.alignItems = "center";
    tools.style.gap = "10px";

    // TOOLBAR container
    // const tools = document.createElement("div");
    // tools.style.display = "flex";
    // tools.style.gap = "6px";

    // Focus camera button
    const camBtn = document.createElement("span");
    camBtn.textContent = "🎯";
    camBtn.style.cursor = "pointer";
    camBtn.style.fontSize = "18px";
    camBtn.title = "Focus camera";
    camBtn.onclick = (ev) => {
      ev.stopPropagation();
      focusCameraOn(meta);
    };

    // Delete button
    const delBtn = document.createElement("span");
    delBtn.textContent = "✕";
    delBtn.style.cursor = "pointer";
    delBtn.style.fontWeight = "600";
    delBtn.style.color = "#ff6b6b";
    delBtn.style.fontSize = "18px";
    delBtn.title = "Delete object";
    delBtn.onclick = (ev) => {
      ev.stopPropagation();
      removeObject(meta);
    };
    tools.appendChild(delBtn);

    const eyeBtn = document.createElement("span");
    eyeBtn.textContent = meta.visible ? "👁️" : "🙈";
    eyeBtn.style.cursor = "pointer";
    eyeBtn.style.fontSize = "18px";
    eyeBtn.title = "Toggle visibility";
    eyeBtn.onclick = (ev) => {
      ev.stopPropagation();
      toggleVisibility(meta);
    };

    // Append toolbar items
    tools.appendChild(camBtn);
    tools.appendChild(delBtn);
    tools.appendChild(eyeBtn);

    row.appendChild(tools);
    container.appendChild(row);

    // container.appendChild(entry);
  });
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
