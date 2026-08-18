import "./styles/artifact.scss";

import { initShell } from "../scripts/main.js";
import { initPhoneStory } from "../scripts/phone-story.js";
import { initBubbleExperiences } from "../scripts/bubble-demo.js";
import { initTranscriptDemo } from "../scripts/transcript-demo.js";
import { initUseCases } from "../scripts/use-cases.js";
import { initWaitlist } from "../scripts/waitlist.js";

document.documentElement.classList.add("enhanced");

initShell();
initBubbleExperiences();
initTranscriptDemo();
initUseCases();
initWaitlist();

const artifactModule = import("./scene/renderer.js");

requestAnimationFrame(async () => {
  try {
    const { initArtifact } = await artifactModule;
    const mounted = await initArtifact();
    if (!mounted) initPhoneStory();
  } catch (error) {
    console.warn("Blabb 3D artifact unavailable; using the semantic fallback.", error);
    document.documentElement.classList.add("artifact-fallback-active");
    initPhoneStory();
  }
});
