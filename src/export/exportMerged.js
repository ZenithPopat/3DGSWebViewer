import { state } from "../state/state.js";
import { downloadBlob } from "../utils/download.js";
import { convertSplatsToPLY } from "./plyWriter.js";

export function exportMerged(as = "splat") {
  if (!state.mergedBytes) {
    alert("No splats loaded.");
    return;
  }

  if (as === "splat") {
    downloadBlob(state.mergedBytes, "merged.splat");
  } else if (as === "ply") {
    const plyText = convertSplatsToPLY(state.mergedBytes);
    downloadBlob(plyText, "merged.ply", "text/plain");
  }
}
