export function canRunArtifact() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (typeof WebGLRenderingContext === "undefined") return false;
  // Four-gigabyte Android phones can run the single bounded showcase model.
  // Reserve the semantic fallback for genuinely constrained devices.
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return false;

  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

export function artifactPixelRatio() {
  const compact = window.matchMedia("(max-width: 1180px)").matches;
  return Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5);
}
