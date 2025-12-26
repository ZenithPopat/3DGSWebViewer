export function downloadBlob(
  buffer,
  filename,
  mime = "application/octet-stream"
) {
  const blob = new Blob([buffer], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
