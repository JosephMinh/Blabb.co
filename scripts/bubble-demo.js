const bubbleMessages = {
  ready: ["READY", "Tap to start. Drag to move.", "Blabb bubble: ready. Tap to start listening."],
  listening: ["LISTENING", "Tap to stop. No words appear yet.", "Blabb bubble: listening. Tap to stop recording."],
  processing: ["PROCESSING", "Full recording stays on this phone.", "Blabb bubble: processing the complete recording locally."],
  success: ["SUCCESS", "Tap to continue. Double-tap for exact undo.", "Blabb bubble: insertion verified. Tap to dictate again or double-tap to undo the latest insertion."],
  compatibility: ["COMPATIBILITY", "Optional Voice Input route available.", "Blabb bubble: compatibility route available for this custom text field."],
  attention: ["RECOVERY", "Tap for a safe recovery action.", "Blabb bubble: recovery or attention is needed. Tap for details."]
};

export function initBubbleExperiences() {
  initModeSwitch();
  initBubbleLab();
}

function initModeSwitch() {
  const demo = document.querySelector("#mode-demo");
  const tabs = [...document.querySelectorAll(".mode-switch [role='tab']")];
  const panels = [...document.querySelectorAll("[data-mode-panel]")];
  if (!demo || !tabs.length) return;

  function activate(mode, focus = false) {
    demo.dataset.mode = mode;
    tabs.forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.modePanel === mode;
      panel.classList.toggle("is-active", selected);
      panel.setAttribute("aria-hidden", String(!selected));
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab.dataset.mode));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      activate(tabs[next].dataset.mode, true);
    });
  });

  activate("bubble");
}

function initBubbleLab() {
  const stage = document.querySelector("#lab-stage");
  const bubble = document.querySelector("#giant-bubble");
  const status = document.querySelector("#lab-status");
  const stateButtons = [...document.querySelectorAll("[data-bubble-state]")];
  if (!stage || !bubble || !status || !stateButtons.length) return;

  let state = "ready";
  let stateTimer = 0;
  let holdTimer = 0;
  let pointerStart = null;
  let dragStart = { x: 0, y: 0 };
  let drag = { x: 0, y: 0 };
  let dragging = false;
  let held = false;
  let suppressClick = false;

  function updateDrag() {
    bubble.style.setProperty("--drag-x", `${drag.x}px`);
    bubble.style.setProperty("--drag-y", `${drag.y}px`);
  }

  function setState(next, customMessage = "") {
    window.clearTimeout(stateTimer);
    state = next;
    bubble.dataset.state = next;
    bubble.classList.remove("snoozed");
    const [label, message, ariaLabel] = bubbleMessages[next];
    status.innerHTML = `<span>${label}</span> ${customMessage || message}`;
    bubble.setAttribute("aria-label", customMessage ? `${label}. ${customMessage}` : ariaLabel);
    stateButtons.forEach((button) => {
      const active = button.dataset.bubbleState === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function finishProcessing() {
    setState("processing");
    stateTimer = window.setTimeout(() => setState("success"), 1200);
  }

  stateButtons.forEach((button) => button.addEventListener("click", () => setState(button.dataset.bubbleState)));

  bubble.addEventListener("click", () => {
    if (suppressClick) return;
    if (state === "ready" || state === "success" || state === "compatibility" || state === "attention") setState("listening");
    else if (state === "listening") finishProcessing();
  });

  bubble.addEventListener("dblclick", (event) => {
    event.preventDefault();
    suppressClick = true;
    setState("ready", "Latest Blabb insertion removed. Earlier text stays.");
    window.setTimeout(() => { suppressClick = false; }, 250);
  });

  bubble.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    dragStart = { ...drag };
    dragging = false;
    held = false;
    bubble.setPointerCapture?.(event.pointerId);
    holdTimer = window.setTimeout(() => {
      if (dragging) return;
      held = true;
      suppressClick = true;
      setState("listening", "Push-to-talk active. Release to process.");
    }, 520);
  });

  bubble.addEventListener("pointermove", (event) => {
    if (!pointerStart) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    if (Math.hypot(deltaX, deltaY) > 8) {
      dragging = true;
      window.clearTimeout(holdTimer);
    }
    if (!dragging) return;
    const maxX = Math.max(0, (stage.clientWidth - bubble.offsetWidth) / 2 - 14);
    const maxY = Math.max(0, (stage.clientHeight - bubble.offsetHeight) / 2 - 55);
    drag.x = Math.max(-maxX, Math.min(maxX, dragStart.x + deltaX));
    drag.y = Math.max(-maxY, Math.min(maxY, dragStart.y + deltaY));
    updateDrag();
  });

  function releasePointer(event) {
    if (!pointerStart) return;
    window.clearTimeout(holdTimer);
    bubble.releasePointerCapture?.(event.pointerId);

    if (held) {
      suppressClick = true;
      finishProcessing();
    } else if (dragging) {
      suppressClick = true;
      const maxX = Math.max(0, (stage.clientWidth - bubble.offsetWidth) / 2 - 14);
      const maxY = Math.max(0, (stage.clientHeight - bubble.offsetHeight) / 2 - 55);
      if (drag.y > maxY * 0.62) {
        bubble.classList.add("snoozed");
        status.innerHTML = "<span>SNOOZED</span> Returns automatically in 10 minutes. End snooze is always available.";
        bubble.setAttribute("aria-label", "Blabb bubble snoozed for ten minutes.");
        window.setTimeout(() => {
          drag = { x: 0, y: 0 };
          updateDrag();
          setState("ready", "Returned automatically. Ready beside the keyboard.");
        }, 1500);
      } else {
        drag.x = drag.x < 0 ? -maxX : maxX;
        drag.y = 0;
        updateDrag();
        setState("ready", "Docked neatly to the nearest side.");
      }
    }

    pointerStart = null;
    dragging = false;
    held = false;
    window.setTimeout(() => { suppressClick = false; }, 80);
  }

  bubble.addEventListener("pointerup", releasePointer);
  bubble.addEventListener("pointercancel", releasePointer);
  setState("ready");
}
