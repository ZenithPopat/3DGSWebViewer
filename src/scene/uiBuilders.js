import { recenterObjectToCamera } from "../splat/recenterToCamera";
import { state } from "../state/state.js";

export function createFloatingPanel(id, title) {
  const container = document.createElement("div");
  container.id = id;

  Object.assign(container.style, {
    position: "absolute",
    top: "10px",
    left: "10px",
    width: "250px",
    maxHeight: "calc(100vh - 20px)",
    background: "rgba(30, 30, 30, 0.95)",
    border: "1px solid #444",
    borderRadius: "8px",
    padding: "10px",
    fontFamily: "Inter, Roboto, sans-serif",
    color: "#e5e5e5",
    fontSize: "13px",
    zIndex: "1100",
    overflowY: "auto",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  });

  // Header
  const header = document.createElement("div");
  header.textContent = title;
  Object.assign(header.style, {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "10px",
    textAlign: "center",
    letterSpacing: "0.5px",
    cursor: "move",
    userSelect: "none",
  });

  container.appendChild(header);
  return { container, header };
}

export function createSoftDivider(margin = "12px 0") {
  const d = document.createElement("div");
  d.style.height = "1px";
  d.style.margin = margin;
  d.style.background =
    "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)";
  return d;
}

export function createButton({
  label,
  onClick,
  variant = "default",
  fullWidth = true,
  disabled = false,
  active = false,
  tooltip = "",
}) {
  const btn = document.createElement("button");

  const colors = {
    default: "#444",
    primary: "#2d8dff",
    danger: "#555",
  };

  const activeColor = "#2d8dff";

  btn.textContent = label;
  btn.title = tooltip;
  btn.style.position = "relative";

  Object.assign(btn.style, {
    width: fullWidth ? "100%" : "auto",
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    background: disabled
      ? "rgba(255,255,255,0.12)"
      : active
        ? activeColor
        : colors[variant],
    color: disabled ? "rgba(255,255,255,0.5)" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    margin: "4px 0",
    opacity: disabled ? "0.6" : "1",
    transition: "background 0.15s ease, opacity 0.15s ease",
  });

  btn.disabled = disabled;
  if (!disabled) btn.onclick = onClick;
  return btn;
}

export function createSubHeading(text) {
  const h = document.createElement("div");
  h.textContent = text;
  h.style.margin = "8px 0 4px";
  h.style.fontSize = "11px";
  h.style.fontWeight = "600";
  h.style.opacity = "0.7";
  h.style.textTransform = "uppercase";
  h.style.textAlign = "center";
  return h;
}

export function createButtonRow(buttons, gap = "6px") {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = gap;

  buttons.forEach((btn) => {
    btn.style.flex = "1";
    row.appendChild(btn);
  });

  return row;
}

export function createCollapsibleSection(
  title,
  icon = "",
  sectionKey,
  initiallyOpen = true
) {
  let isOpen = state.ui?.sections?.[sectionKey] ?? initiallyOpen;

  const section = document.createElement("div");

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    margin: "10px 0 6px",
    padding: "4px 6px",
    borderRadius: "4px",
    userSelect: "none",
  });

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "6px";

  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;

  const label = document.createElement("div");
  label.textContent = title;
  label.style.fontWeight = "600";
  label.style.opacity = "0.85";

  left.appendChild(iconSpan);
  left.appendChild(label);

  const arrow = document.createElement("span");

  const content = document.createElement("div");

  function update() {
    content.style.display = isOpen ? "block" : "none";
    arrow.textContent = isOpen ? "▾" : "▸";
    state.ui.sections[sectionKey] = isOpen;
  }

  header.onclick = () => {
    isOpen = !isOpen;
    update();
  };

  update();

  header.appendChild(left);
  header.appendChild(arrow);

  section.appendChild(header);
  section.appendChild(content);

  return { section, header, content };
}

export function createObjectRow(
  meta,
  { onSelect, onFocus, onDelete, onToggleVisibility, isSelected }
) {
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

  if (isSelected) {
    row.style.background = "rgba(50,150,255,0.25)";
  }

  row.onmouseenter = () => (row.style.background = "rgba(255,255,255,0.06)");
  row.onmouseleave = () => {
    if (!isSelected) row.style.background = "transparent";
  };

  const name = document.createElement("div");
  name.textContent =
    meta.fileName.replace(/\.(splat)$/, "") +
    (meta.hasUnbakedTransform ? " *" : "");
  Object.assign(name.style, {
    flex: "1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });
  name.onclick = onSelect;

  if (meta.hasUnbakedTransform) {
    name.title = "Unbaked changes";
    name.style.opacity = "0.9";
  }

  const tools = document.createElement("div");
  tools.style.display = "flex";
  tools.style.gap = "10px";

  const camBtn = document.createElement("span");
  camBtn.textContent = "🎯";
  camBtn.onclick = (e) => {
    e.stopPropagation();
    onFocus();
  };

  const recenterBtn = document.createElement("span");
  recenterBtn.textContent = "📍";
  recenterBtn.title = "Recenter to Camera";
  recenterBtn.onclick = (e) => {
    e.stopPropagation();
    recenterObjectToCamera(meta);
  };

  const delBtn = document.createElement("span");
  delBtn.textContent = "✕";
  delBtn.style.color = "#ff6b6b";
  delBtn.onclick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const eyeBtn = document.createElement("span");
  eyeBtn.textContent = meta.visible ? "👁️" : "🙈";
  eyeBtn.onclick = (e) => {
    e.stopPropagation();
    onToggleVisibility();
  };

  tools.append(camBtn, recenterBtn, delBtn, eyeBtn);
  row.append(name, tools);

  return row;
}

export function enableDragAndResize(container, header) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let isResizing = false;
  let startWidth = 0;
  let startHeight = 0;
  let startX = 0;
  let startY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      container.style.left = e.clientX - offsetX + "px";
      container.style.top = e.clientY - offsetY + "px";
    }
    if (isResizing) {
      container.style.width =
        Math.max(180, startWidth + (e.clientX - startX)) + "px";
      container.style.height =
        Math.max(150, startHeight + (e.clientY - startY)) + "px";
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    isResizing = false;
    document.body.style.userSelect = "auto";
  });
}

export function createKeyRow(key, description) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.justifyContent = "space-between";
  row.style.fontSize = "12px";
  row.style.opacity = "0.85";
  row.style.margin = "2px 0";

  const keyEl = document.createElement("span");
  keyEl.textContent = key;
  keyEl.style.fontFamily = "monospace";
  keyEl.style.background = "rgba(255,255,255,0.08)";
  keyEl.style.padding = "2px 6px";
  keyEl.style.borderRadius = "4px";

  const descEl = document.createElement("span");
  descEl.textContent = description;
  descEl.style.textAlign = "right";

  row.appendChild(keyEl);
  row.appendChild(descEl);
  return row;
}

export function createSlider({ label, min, max, step, value, onChange }) {
  const wrapper = document.createElement("div");

  const l = document.createElement("div");
  l.textContent = `${label}: ${value}`;
  l.style.fontSize = "12px";
  l.style.opacity = "0.8";

  const input = document.createElement("input");
  input.type = "range";
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.style.width = "100%";

  input.oninput = (e) => {
    const v = Number(e.target.value);
    l.textContent = `${label}: ${v}`;
    onChange(v);
  };

  wrapper.append(l, input);
  return wrapper;
}
