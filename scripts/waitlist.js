const SUCCESS_MESSAGE = "Request received. Check your inbox if confirmation is needed.";
const ERROR_MESSAGE = "That didn’t go through. Please try again in a moment.";

const PLATFORM_COPY = {
  android: {
    label: "Android",
    button: "Request Android access",
    promise: "Android private beta updates"
  },
  ios: {
    label: "iPhone",
    button: "Join the iPhone interest list",
    promise: "iPhone planning and availability updates"
  }
};

export function initWaitlist() {
  document.querySelectorAll("[data-waitlist-form]").forEach((form) => {
    const status = form.querySelector("[data-waitlist-status]");
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button?.querySelector("span");
    const emailInput = form.querySelector('input[name="email"]');
    const section = form.closest(".final-cta");
    const platformPromise = form.querySelector("[data-platform-promise]");

    function selectedPlatform() {
      return form.querySelector('input[name="platform"]:checked')?.value || "android";
    }

    function resetState() {
      if (form.dataset.state === "submitting") return;
      const platform = selectedPlatform();
      const copy = PLATFORM_COPY[platform] || PLATFORM_COPY.android;
      form.dataset.state = "idle";
      if (section) section.dataset.waitlistPlatform = platform;
      if (button) button.disabled = false;
      if (buttonLabel) buttonLabel.textContent = copy.button;
      if (platformPromise) platformPromise.textContent = copy.promise;
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
        const label = PLATFORM_COPY[payload.platform]?.label || "Blabb";
        form.dataset.state = "success";
        if (status) status.textContent = `${SUCCESS_MESSAGE} Your ${label} preference is saved.`;
        if (buttonLabel) buttonLabel.textContent = "Request received";
      } catch (error) {
        console.warn("Waitlist signup failed.", error);
        form.dataset.state = "error";
        if (status) status.textContent = ERROR_MESSAGE;
        button.disabled = false;
        const label = PLATFORM_COPY[selectedPlatform()]?.label || "Blabb";
        if (buttonLabel) buttonLabel.textContent = `Try ${label} again`;
      }
    });

    resetState();
  });
}
