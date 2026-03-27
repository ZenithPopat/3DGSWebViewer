import { state } from "../state/state.js";
import { downloadBlob } from "../utils/download.js";
import {
  convertParsedToSplat,
  convertParsedToPLY,
} from "./formatConverters.js";

export function exportIndividually(as = "splat") {
  state.metadataList.forEach((meta) => {
    if (!meta || !meta.parsed) return;

    if (as === "splat") {
      const fileBytes = convertParsedToSplat(meta.parsed);
      downloadBlob(fileBytes, meta.fileName.replace(".splat", "_export.splat"));
    } else if (as === "ply") {
      const plyText = convertParsedToPLY(meta.parsed);
      downloadBlob(
        plyText,
        meta.fileName.replace(".splat", "_export.ply"),
        "text/plain"
      );
    }
  });
}
