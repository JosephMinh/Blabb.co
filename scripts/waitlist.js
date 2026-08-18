const SUCCESS_MESSAGE = "You’re on the list. Watch your inbox for Blabb updates.";
const ERROR_MESSAGE = "That didn’t go through. Please try again in a moment.";

export function initWaitlist() {
  document.querySelectorAll("[data-waitlist-form]").forEach((form) => {
    const status = form.querySelector("[data-waitlist-status]");
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button?.querySelector("span");
    const idleLabel = buttonLabel?.textContent || "Join the waitlist";

    form.addEventListener("submit", async (event) => {
      if (!form.reportValidity()) return;
      event.preventDefault();
      if (form.elements._honey?.value) return;

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const endpoint = form.action.replace("formsubmit.co/", "formsubmit.co/ajax/");
      form.dataset.state = "submitting";
      button.disabled = true;
      if (buttonLabel) buttonLabel.textContent = "Joining…";
      status.textContent = "Adding your email…";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false || result.success === "false") {
          throw new Error(result.message || `Waitlist request failed (${response.status})`);
        }
        form.reset();
        form.dataset.state = "success";
        status.textContent = SUCCESS_MESSAGE;
        if (buttonLabel) buttonLabel.textContent = "You’re on the list";
      } catch (error) {
        console.warn("Waitlist signup failed.", error);
        form.dataset.state = "error";
        status.textContent = ERROR_MESSAGE;
        button.disabled = false;
        if (buttonLabel) buttonLabel.textContent = idleLabel;
      }
    });
  });
}
