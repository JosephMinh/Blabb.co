export function initShell() {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  const revealItems = [...document.querySelectorAll(".reveal")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionSections = [...document.querySelectorAll(".journey, .mode-section, .bubble-lab, .tools-section, .use-cases, .final-cta")];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    motionSections.forEach((section) => section.classList.add("is-in-view"));
  } else {
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-in-view", entry.isIntersecting));
    }, { rootMargin: "180px 0px" });
    motionSections.forEach((section) => motionObserver.observe(section));
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -9%", threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const header = document.querySelector("#site-header");
  const themedSections = [...document.querySelectorAll("[data-header-theme]")];
  let themeFrame = 0;

  function updateHeader() {
    themeFrame = 0;
    if (!header) return;
    const marker = Math.min(105, window.innerHeight * 0.16);
    const current = themedSections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom > marker;
    });
    header.dataset.theme = current?.dataset.headerTheme || "dark";
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  function requestHeaderUpdate() {
    if (themeFrame) return;
    themeFrame = window.requestAnimationFrame(updateHeader);
  }

  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderUpdate, { passive: true });
  updateHeader();

  const menuButton = document.querySelector("#menu-button");
  const mobileMenu = document.querySelector("#mobile-menu");

  function closeMenu() {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  menuButton?.addEventListener("click", () => {
    const opening = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(opening));
    mobileMenu?.classList.toggle("is-open", opening);
    document.body.classList.toggle("menu-open", opening);
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}
