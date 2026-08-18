const contexts = [
  {
    id: "messages",
    number: "01 / 05",
    kind: "MESSAGES",
    toolbar: "Conversation",
    overline: "QUICK REPLY",
    heading: "Make the reply sound like you.",
    text: "I’ll be there just after six.",
    description: "Reply without squeezing a full thought through two thumbs."
  },
  {
    id: "notes",
    number: "02 / 05",
    kind: "NOTES",
    toolbar: "New note",
    overline: "CAPTURE THE THOUGHT",
    heading: "Catch the idea before it moves on.",
    text: "Outline the opening, then add the examples.",
    description: "Turn a passing thought into text while it is still fresh."
  },
  {
    id: "email",
    number: "03 / 05",
    kind: "EMAIL",
    toolbar: "Draft",
    overline: "LONGER FORM",
    heading: "Let the first draft arrive in one breath.",
    text: "Thanks for the thoughtful notes. I’ll send a revision tomorrow.",
    description: "Get the full sentence down, then edit with your usual keyboard."
  },
  {
    id: "search",
    number: "04 / 05",
    kind: "SEARCH",
    toolbar: "Search",
    overline: "FIND IT FAST",
    heading: "Ask for the exact thing you mean.",
    text: "Quiet lunch spots open near me tomorrow",
    description: "Use natural phrasing in compatible search fields."
  },
  {
    id: "forms",
    number: "05 / 05",
    kind: "FORMS",
    toolbar: "Details",
    overline: "FILL THE FIELD",
    heading: "Give the answer more room to breathe.",
    text: "Please leave the package with the front desk.",
    description: "Dictate longer answers when a compatible form field is active."
  }
];

export function initUseCases() {
  const stage = document.querySelector("#context-stage");
  const tabs = [...document.querySelectorAll(".carousel-controls [role='tab']")];
  const previous = document.querySelector("#context-prev");
  const next = document.querySelector("#context-next");
  if (!stage || !tabs.length || !previous || !next) return;

  const fields = {
    number: document.querySelector("#context-number"),
    kind: document.querySelector("#context-kind"),
    toolbar: document.querySelector("#context-toolbar-title"),
    overline: document.querySelector("#context-overline"),
    heading: document.querySelector("#context-heading"),
    text: document.querySelector("#context-text"),
    description: document.querySelector("#context-description")
  };
  let activeIndex = 0;
  let animationTimer = 0;

  function render(index, focus = false) {
    activeIndex = (index + contexts.length) % contexts.length;
    const context = contexts[activeIndex];
    stage.dataset.context = context.id;
    Object.entries(fields).forEach(([key, element]) => {
      if (element) element.textContent = context[key];
    });
    tabs.forEach((tab) => {
      const selected = tab.dataset.context === context.id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        stage.setAttribute("aria-labelledby", tab.id);
        if (focus) tab.focus();
      }
    });
    stage.classList.remove("is-changing");
    window.requestAnimationFrame(() => stage.classList.add("is-changing"));
    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(() => stage.classList.remove("is-changing"), 500);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => render(index));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let target = index;
      if (event.key === "ArrowRight") target = index + 1;
      if (event.key === "ArrowLeft") target = index - 1;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = contexts.length - 1;
      render(target, true);
    });
  });
  previous.addEventListener("click", () => render(activeIndex - 1));
  next.addEventListener("click", () => render(activeIndex + 1));
  render(0);
}
