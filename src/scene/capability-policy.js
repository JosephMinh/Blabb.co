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
  const deviceRatio = window.devicePixelRatio || 1;
  const phone = window.matchMedia("(max-width: 880px)").matches;
  const tablet = window.matchMedia("(max-width: 1180px)").matches;
  const memory = navigator.deviceMemory || 4;

  // The model is small enough for a dense phone framebuffer. Keep a modest
  // guardrail for lower-memory devices, but do not turn 2x/3x phone screens
  // into a visibly soft 1.25x canvas.
  if (phone) return Math.min(deviceRatio, memory <= 4 ? 1.75 : 2);
  return Math.min(deviceRatio, tablet ? 1.5 : 1.75);
}
