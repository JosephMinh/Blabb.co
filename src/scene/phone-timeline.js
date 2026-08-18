import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, CustomEase, Flip, SplitText);
CustomEase.create("blabbEase", "M0,0 C0.16,1 0.3,1 1,1");

const labels = ["hero", "focus", "dictate", "process", "insert", "undo", "snooze"];

export function createPhoneTimeline(controller, stage) {
  const journey = document.querySelector(".journey");
  const finalCta = document.querySelector(".final-cta");
  if (!journey) return { destroy() {} };

  const proxy = { progress: 0 };
  const storySections = [document.querySelector(".hero"), ...document.querySelectorAll(".story-chapter")].filter(Boolean);
  const master = gsap.timeline({ paused: true });
  labels.forEach((label, index) => {
    master.addLabel(label, index);
    master.to(proxy, { progress: (index + 1) / labels.length, duration: 1, ease: "none" });
  });

  const storyTrigger = ScrollTrigger.create({
    trigger: journey,
    start: "top top",
    end: "bottom top",
    scrub: 0.35,
    invalidateOnRefresh: true,
    onEnter: () => stage.classList.add("is-visible"),
    onEnterBack: () => stage.classList.add("is-visible"),
    onLeave: () => stage.classList.remove("is-visible"),
    onLeaveBack: () => stage.classList.remove("is-visible"),
    onUpdate: () => {
      const marker = window.scrollY + window.innerHeight * 0.5;
      let activeIndex = storySections.length - 1;
      let localProgress = 1;
      for (let index = 0; index < storySections.length; index += 1) {
        const section = storySections[index];
        const bounds = section.getBoundingClientRect();
        const top = bounds.top + window.scrollY;
        const bottom = top + bounds.height;
        if (marker <= bottom) {
          activeIndex = index;
          localProgress = gsap.utils.clamp(0, 0.999, (marker - top) / bounds.height);
          break;
        }
      }
      const measuredProgress = (activeIndex + localProgress) / storySections.length;
      master.progress(measuredProgress);
      if (!stage.classList.contains("is-final")) controller.setProgress(proxy.progress);
    }
  });

  let finalActive = false;
  const finalObserver = finalCta ? new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      finalActive = true;
      stage.classList.add("is-visible", "is-final");
      controller.setFinal(true);
      return;
    }
    if (!finalActive) return;
    finalActive = false;
    stage.classList.remove("is-final");
    if (!storyTrigger.isActive) stage.classList.remove("is-visible");
  }, { threshold: 0.08 }) : null;
  if (finalCta) finalObserver.observe(finalCta);

  const replayButtons = document.querySelectorAll("[data-replay]");
  replayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.closest(".story-chapter");
      if (!section) return;
      const top = section.offsetTop + section.offsetHeight * 0.16;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  let lenis = null;
  const smoothQuery = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (smoothQuery.matches && !navigator.webdriver) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const title = document.querySelector("#hero-title");
  title?.setAttribute("aria-label", "Speak. It types.");

  ScrollTrigger.refresh();
  return {
    refresh: () => ScrollTrigger.refresh(),
    destroy() {
      storyTrigger.kill();
      finalObserver?.disconnect();
      lenis?.destroy();
    }
  };
}
