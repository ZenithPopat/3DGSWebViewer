import { state } from "../state/state.js";
import { handleFileUpload } from "../upload/uploadHandler.js";
import { selectObject } from "../splat/splatSelection.js";
import { focusCameraOn } from "../utils/focusCamera.js";

export function createSceneGraphUI() {
  // Remove old UI
  const old = document.getElementById("sceneGraph");
  if (old) old.remove();

  // Container
  const container = document.createElement("div");
  container.id = "sceneGraph";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.width = "260px";
  container.style.maxHeight = "80%";
  container.style.overflowY = "auto";
  container.style.background = "rgba(20,20,20,0.9)";
  container.style.border = "1px solid #444";
  container.style.borderRadius = "6px";
  container.style.padding = "10px";
  container.style.color = "#fff";
  container.style.zIndex = "1000";
  container.style.fontFamily = "monospace";

  // Header
  const header = document.createElement("div");
  header.textContent = "SCENE GRAPH";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "10px";
  header.style.textAlign = "center";
  container.appendChild(header);

  // Upload button
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Splat File";
  addBtn.style.width = "100%";
  addBtn.style.padding = "6px";
  addBtn.style.marginBottom = "10px";
  addBtn.style.background = "#444";
  addBtn.style.color = "#fff";
  addBtn.style.border = "none";
  addBtn.style.borderRadius = "4px";
  addBtn.style.cursor = "pointer";
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
    const entry = document.createElement("div");
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.justifyContent = "space-between";
    entry.style.padding = "6px";
    entry.style.borderBottom = "1px solid #555";

    // File label (select object)
    const label = document.createElement("span");
    label.textContent = meta.fileName;
    label.style.cursor = "pointer";
    label.onclick = () => selectObject(meta, state.scene);

    // TOOLBAR container
    const tools = document.createElement("div");
    tools.style.display = "flex";
    tools.style.gap = "6px";

    // Focus camera button
    const focusBtn = document.createElement("button");
    focusBtn.textContent = "🎯"; // or use 📷
    focusBtn.title = "Focus Camera";
    focusBtn.style.background = "transparent";
    focusBtn.style.color = "#0bf";
    focusBtn.style.border = "none";
    focusBtn.style.cursor = "pointer";
    focusBtn.onclick = (ev) => {
      ev.stopPropagation();
      focusCameraOn(meta);
    };

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.title = "Delete";
    delBtn.style.background = "transparent";
    delBtn.style.color = "#f55";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.onclick = (ev) => {
      ev.stopPropagation();
      import("../splat/removeObject.js").then(({ removeObject }) =>
        removeObject(meta)
      );
    };

    // Append toolbar items
    tools.appendChild(focusBtn);
    tools.appendChild(delBtn);

    entry.appendChild(label);
    entry.appendChild(tools);

    container.appendChild(entry);
  });

  document.body.appendChild(container);
}
