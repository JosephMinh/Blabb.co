import { initShell } from "./scripts/main.js";
import { initPhoneStory } from "./scripts/phone-story.js";
import { initBubbleExperiences } from "./scripts/bubble-demo.js";
import { initTranscriptDemo } from "./scripts/transcript-demo.js";
import { initUseCases } from "./scripts/use-cases.js";

document.documentElement.classList.add("enhanced");

initShell();
initPhoneStory();
initBubbleExperiences();
initTranscriptDemo();
initUseCases();
