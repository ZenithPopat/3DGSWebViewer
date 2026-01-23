import { state } from "../src/state/state.js";

export function getFilteredParsedSplats(meta) {
  const filtered = [];

  for (let i = 0; i < meta.parsed.length; i++) {
    const globalIndex = meta.startIndex + i;

    if (state.erase.erasedSplatIndices.has(globalIndex)) {
      continue;
    }

    filtered.push(meta.parsed[i]);
  }

  return filtered;
}
