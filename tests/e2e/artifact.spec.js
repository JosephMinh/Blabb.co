import { test, expect } from "@playwright/test";

const states = [
  ["01", "READY"],
  ["02", "LISTENING"],
  ["03", "PROCESSING LOCALLY"],
  ["04", "INSERT + VERIFY"],
  ["05", "CONTINUE + EXACT UNDO"],
  ["06", "MOVE + SNOOZE"]
];

test("desktop uses one persistent 3D phone through the six product states", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/webgl-ready/, { timeout: 30_000 });
  await expect(page.locator("#artifact-webgl")).toBeVisible();
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-model-ready", "true");
  await expect(page.locator("#artifact-webgl")).toHaveAttribute("data-renderer", "threejs-gltf");
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });

  await page.mouse.move(820, 500);
  await page.mouse.down();
  const nativeDrag = await page.evaluate(() => {
    const target = document.elementFromPoint(820, 500);
    return {
      selectionAllowed: target.dispatchEvent(new Event("selectstart", { bubbles: true, cancelable: true })),
      dragAllowed: target.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true })),
      userSelect: getComputedStyle(document.body).userSelect
    };
  });
  expect(nativeDrag).toEqual({ selectionAllowed: false, dragAllowed: false, userSelect: "none" });
  await page.mouse.move(1000, 465, { steps: 24 });
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-interaction", "dragging");
  await page.mouse.up();
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-interaction", "ready");
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-rotation", /,/);

  for (const [step, expectedState] of states) {
    const section = page.locator(`.story-chapter[data-step="${step}"]`);
    await section.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      scrollTo(0, bounds.top + scrollY + bounds.height * 0.12);
    });
    await expect(page.locator("#state-readout span")).toHaveText(expectedState);
  }

  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-screen-state", /snooz(?:e|ed)/);
  await page.locator("#artifact-stage").evaluate((element) => { element.dataset.renderPaused = "true"; });

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 1366 },
    { width: 390, height: 844 },
    { width: 320, height: 568 }
  ]) {
    await page.setViewportSize(viewport);
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".final-cta").scrollIntoViewIfNeeded();
  await expect(page.locator("#artifact-stage")).toHaveClass(/is-final/);
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "0");
  await expect(page.locator(".cta-art")).toHaveCSS("opacity", "1");
  await expect(page.locator("#waitlist-email")).toBeVisible();
});

test("mobile loads the 3D hero and hands the same phone through the story", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/webgl-ready/, { timeout: 30_000 });
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "1");
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-model-ready", "true");
  await expect(page.locator(".phone-artifact")).toHaveCSS("opacity", "0");

  await page.locator('.story-chapter[data-step="02"]').evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    const bounds = element.getBoundingClientRect();
    scrollTo(0, bounds.top + scrollY + bounds.height * 0.12);
  });
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "1");
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-screen-state", "dictate");
  await expect(page.locator('.story-chapter[data-step="02"] .chapter-copy')).toHaveCount(2);
  await expect(page.locator('.story-chapter[data-step="02"] .chapter-copy').first()).toHaveCSS("opacity", "1");

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "0");
  await expect(page.locator('.story-chapter[data-step="02"] .chapter-state-card')).toBeVisible();
});

test("a WebGL reset restores the interactive artifact without a page refresh", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/webgl-ready/, { timeout: 30_000 });

  const canReset = await page.evaluate(() => {
    const canvas = document.querySelector("#artifact-webgl");
    const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
    window.__blabbContextReset = gl?.getExtension("WEBGL_lose_context") || null;
    window.__blabbContextReset?.loseContext();
    return Boolean(window.__blabbContextReset);
  });
  expect(canReset).toBe(true);
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-render-state", "recovering");
  await page.evaluate(() => window.__blabbContextReset.restoreContext());
  await expect(page.locator("html")).toHaveClass(/webgl-ready/, { timeout: 15_000 });
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-render-state", "ready");
});

test("reduced motion and unavailable WebGL keep the semantic fallback", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto("/");
  await expect(reducedPage.locator("html")).not.toHaveClass(/webgl-ready/);
  await expect(reducedPage.locator(".chapter-state-card")).toHaveCount(6);
  await reduced.close();

  const noWebgl = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await noWebgl.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  const noWebglPage = await noWebgl.newPage();
  await noWebglPage.goto("/");
  await expect(noWebglPage.locator("html")).toHaveClass(/artifact-fallback-active/);
  await expect(noWebglPage.locator(".phone-artifact")).toBeVisible();
  await noWebgl.close();

  const softwareWebgl = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await softwareWebgl.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => false });
  });
  const softwarePage = await softwareWebgl.newPage();
  await softwarePage.goto("/");
  await expect(softwarePage.locator("#artifact-stage")).toHaveAttribute("data-renderer-mode", "fallback");
  await expect(softwarePage.locator("html")).not.toHaveClass(/webgl-ready/);
  await expect(softwarePage.locator(".phone-artifact")).toBeVisible();
  await expect(softwarePage.locator(".device-layer").first()).toHaveCSS("display", "none");
  await softwareWebgl.close();
});
