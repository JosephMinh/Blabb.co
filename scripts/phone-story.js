const stateCopy = {
  hero: ["00", "EXPLODED VIEW", "Exploded phone showing Blabb beside an Android keyboard."],
  focus: ["01", "READY", "Step 1. A compatible text field is focused and the Blabb bubble is ready."],
  dictate: ["02", "LISTENING", "Step 2. Blabb is listening. No transcript is shown while recording."],
  process: ["03", "PROCESSING LOCALLY", "Step 3. The complete recording is processed by the local voice engine."],
  insert: ["04", "INSERT + VERIFY", "Step 4. Final text is inserted at the cursor and verified."],
  continue: ["05", "CONTINUE + EXACT UNDO", "Step 5. A second dictation is inserted, then only that latest insertion is removed."],
  snooze: ["06", "MOVE + SNOOZE", "Step 6. The bubble docks, snoozes for ten minutes, and returns automatically."]
};

export function initPhoneStory() {
  const phone = document.querySelector("#story-phone");
  const hero = document.querySelector(".hero");
  const journey = document.querySelector(".journey");
  const chapters = [...document.querySelectorAll("[data-phone-state]")];
  const stepReadout = document.querySelector("#active-step");
  const liveRegion = document.querySelector("#phone-live");
  const replayButtons = [...document.querySelectorAll("[data-replay]")];
  if (!phone || !hero || !journey || !chapters.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targets = [hero, ...chapters];
  let activeChapter = "";
  let frame = 0;
  let timers = [];

  function later(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  }

  function clearTimeline() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  }

  function setVisualState(state, phase = phone.dataset.phase || "idle") {
    phone.dataset.state = state;
    phone.dataset.phase = phase;
  }

  function playContinueTimeline() {
    clearTimeline();
    phone.dataset.chapter = "continue";
    setVisualState("success", "first");
    if (reduceMotion.matches) return;

    later(() => setVisualState("listening", "listening"), 850);
    later(() => setVisualState("processing", "processing"), 1650);
    later(() => setVisualState("success", "inserted"), 2550);
    later(() => setVisualState("success", "undo-highlight"), 3900);
    later(() => setVisualState("success", "undone"), 4750);
    later(() => {
      if (activeChapter === "continue") playContinueTimeline();
    }, 6500);
  }

  function playSnoozeTimeline() {
    clearTimeline();
    phone.dataset.chapter = "snooze";
    setVisualState("ready", "idle");
    if (reduceMotion.matches) return;

    later(() => setVisualState("ready", "dock-left"), 850);
    later(() => setVisualState("ready", "target"), 1750);
    later(() => setVisualState("ready", "snoozed"), 2750);
    later(() => setVisualState("ready", "returned"), 4550);
    later(() => {
      if (activeChapter === "snooze") playSnoozeTimeline();
    }, 6500);
  }

  function activate(chapter) {
    if (chapter === activeChapter) return;
    activeChapter = chapter;
    clearTimeline();
    phone.dataset.chapter = chapter;
    phone.dataset.phase = "idle";

    const [step, , announcement] = stateCopy[chapter];
    if (stepReadout) stepReadout.textContent = step;
    if (liveRegion) liveRegion.textContent = announcement;

    if (chapter === "dictate") setVisualState("listening");
    else if (chapter === "process") setVisualState("processing");
    else if (chapter === "insert") {
      setVisualState("inserting");
      if (!reduceMotion.matches) later(() => {
        if (activeChapter === "insert") setVisualState("success");
      }, 800);
      else setVisualState("success");
    } else if (chapter === "continue") playContinueTimeline();
    else if (chapter === "snooze") playSnoozeTimeline();
    else setVisualState("ready");
  }

  function updateFromScroll() {
    frame = 0;
    const journeyBounds = journey.getBoundingClientRect();
    if (journeyBounds.bottom <= 0 || journeyBounds.top >= window.innerHeight) {
      clearTimeline();
      activeChapter = "";
      return;
    }
    const marker = window.innerHeight * 0.5;
    let current = targets[0];
    let shortestDistance = Infinity;

    targets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom >= marker) {
        current = target;
        shortestDistance = 0;
        return;
      }
      if (shortestDistance === 0) return;
      const distance = Math.min(Math.abs(rect.top - marker), Math.abs(rect.bottom - marker));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        current = target;
      }
    });

    activate(current === hero ? "hero" : current.dataset.phoneState);
  }

  function requestUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateFromScroll);
  }

  replayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const demo = button.dataset.replay;
      activeChapter = demo;
      if (demo === "continue") playContinueTimeline();
      if (demo === "snooze") playSnoozeTimeline();
    });
  });

  reduceMotion.addEventListener?.("change", () => {
    const chapter = activeChapter;
    activeChapter = "";
    activate(chapter || "hero");
  });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeline();
    else requestUpdate();
  });
  updateFromScroll();
}
