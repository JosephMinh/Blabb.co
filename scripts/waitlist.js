const SUCCESS_MESSAGE = "Request received. Check your inbox if confirmation is needed.";
const ERROR_MESSAGE = "That didn’t go through. Please try again in a moment.";

const PLATFORM_LABELS = {
  android: "Android",
  ios: "iPhone"
};

export function initWaitlist() {
  document.querySelectorAll("[data-waitlist-form]").forEach((form) => {
    const status = form.querySelector("[data-waitlist-status]");
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button?.querySelector("span");
    const emailInput = form.querySelector('input[name="email"]');

    function selectedPlatform() {
      return form.querySelector('input[name="platform"]:checked')?.value || "android";
    }

    function resetState() {
      if (form.dataset.state === "submitting") return;
      const label = PLATFORM_LABELS[selectedPlatform()] || "Blabb";
      form.dataset.state = "idle";
      if (button) button.disabled = false;
      if (buttonLabel) buttonLabel.textContent = `Join ${label} waitlist`;
      if (status) status.textContent = "";
    }

    form.querySelectorAll('input[name="platform"]').forEach((input) => input.addEventListener("change", resetState));
    emailInput?.addEventListener("input", () => {
      if (form.dataset.state === "success" || form.dataset.state === "error") resetState();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (form.elements.website?.value) return;

      const formData = new FormData(form);
      const payload = {
        email: String(formData.get("email") || ""),
        platform: String(formData.get("platform") || "android"),
        website: String(formData.get("website") || "")
      };
      form.dataset.state = "submitting";
      button.disabled = true;
      if (buttonLabel) buttonLabel.textContent = "Joining…";
      if (status) status.textContent = "Sending your request securely…";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`Waitlist request failed (${response.status})`);
        }
        await response.json();
        const label = PLATFORM_LABELS[payload.platform] || "Blabb";
        form.dataset.state = "success";
        if (status) status.textContent = `${SUCCESS_MESSAGE} Your ${label} preference is saved.`;
        if (buttonLabel) buttonLabel.textContent = "Request received";
      } catch (error) {
        console.warn("Waitlist signup failed.", error);
        form.dataset.state = "error";
        if (status) status.textContent = ERROR_MESSAGE;
        button.disabled = false;
        const label = PLATFORM_LABELS[selectedPlatform()] || "Blabb";
        if (buttonLabel) buttonLabel.textContent = `Try ${label} again`;
      }
    });
  });
}
