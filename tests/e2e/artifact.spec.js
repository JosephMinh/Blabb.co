import { test, expect } from "@playwright/test";

const steps = ["01", "02", "03", "04", "05", "06"];

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

  for (const step of steps) {
    const section = page.locator(`.story-chapter[data-step="${step}"]`);
    await section.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      scrollTo(0, bounds.top + scrollY + bounds.height * 0.12);
    });
    await expect(page.locator("#active-step")).toHaveText(step);
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
    if (viewport.width > 880) {
      const phoneScale = Number(await page.locator("#artifact-stage").getAttribute("data-phone-scale"));
      expect(phoneScale).toBeGreaterThanOrEqual(0.85);
      expect(phoneScale).toBeLessThanOrEqual(0.92);
      const layout = await page.locator('.story-chapter[data-step="02"]').evaluate((element) => {
        const title = element.querySelector(".chapter-left").getBoundingClientRect();
        const supportingCopy = element.querySelector(".chapter-right").getBoundingClientRect();
        const storyIndex = document.querySelector(".story-index").getBoundingClientRect();
        return {
          titleTop: title.top,
          supportingBottom: supportingCopy.bottom,
          supportingRight: supportingCopy.right,
          storyIndexLeft: storyIndex.left,
          artifactCenter: innerWidth * 0.58
        };
      });
      expect(layout.supportingRight).toBeLessThan(layout.artifactCenter);
      expect(layout.supportingRight).toBeLessThan(layout.storyIndexLeft);
      expect(layout.supportingBottom).toBeLessThan(layout.titleTop);
    }
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
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-mobile-mode", "peek");
  await expect(page.locator(".phone-artifact")).toHaveCSS("opacity", "0");
  const heroPhoneScale = Number(await page.locator("#artifact-stage").getAttribute("data-phone-scale"));
  expect(heroPhoneScale).toBeGreaterThan(0.5);

  await page.locator("[data-mobile-showcase]").click();
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-mobile-mode", "showcase");
  await expect(page.locator(".artifact-drag-hint")).toHaveCSS("opacity", "0.76");
  const showcasePhoneScale = Number(await page.locator("#artifact-stage").getAttribute("data-phone-scale"));
  expect(showcasePhoneScale).toBeGreaterThanOrEqual(0.8);
  expect(showcasePhoneScale).toBeLessThanOrEqual(0.82);

  await page.locator('.story-chapter[data-step="02"]').evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    const bounds = element.getBoundingClientRect();
    scrollTo(0, bounds.top + scrollY + bounds.height * 0.12);
  });
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "1");
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-screen-state", "dictate");
  const storyPhoneScale = Number(await page.locator("#artifact-stage").getAttribute("data-phone-scale"));
  expect(storyPhoneScale).toBeGreaterThanOrEqual(0.74);
  const storyPhoneY = Number(await page.locator("#artifact-stage").getAttribute("data-phone-y"));
  expect(storyPhoneY).toBeLessThanOrEqual(0.56);
  const storyPhoneX = Number(await page.locator("#artifact-stage").getAttribute("data-phone-x"));
  expect(storyPhoneX).toBeGreaterThan(0);
  await expect(page.locator('.story-chapter[data-step="02"] .chapter-copy')).toHaveCount(2);
  await expect(page.locator('.story-chapter[data-step="02"] .chapter-copy').first()).toHaveCSS("opacity", "1");
  await expect(page.locator('.story-chapter[data-step="02"] .mobile-chapter-summary')).toBeVisible();
  await expect(page.locator('.story-chapter[data-step="02"] .desktop-chapter-summary')).toBeHidden();
  const storyType = await page.locator('.story-chapter[data-step="02"]').evaluate((element) => ({
    summary: Number.parseFloat(getComputedStyle(element.querySelector(".chapter-right > p")).fontSize),
    spec: Number.parseFloat(getComputedStyle(document.querySelector(".chapter-specs dd")).fontSize)
  }));
  expect(storyType.summary).toBeGreaterThanOrEqual(14);
  expect(storyType.spec).toBeGreaterThanOrEqual(11.5);
  const posterLayout = await page.locator('.story-chapter[data-step="02"]').evaluate((element) => {
    const title = element.querySelector(".chapter-left").getBoundingClientRect();
    const panel = element.querySelector(".chapter-right").getBoundingClientRect();
    return {
      titleTop: title.top,
      titleBottom: title.bottom,
      panelTop: panel.top,
      panelBottom: panel.bottom,
      viewportHeight: innerHeight
    };
  });
  expect(posterLayout.titleTop).toBeGreaterThanOrEqual(0);
  expect(posterLayout.panelTop).toBeGreaterThan(posterLayout.titleBottom);
  expect(posterLayout.panelBottom).toBeLessThanOrEqual(posterLayout.viewportHeight);

  await page.locator('.story-chapter[data-step="06"]').evaluate((element) => {
    scrollTo(0, element.offsetTop);
  });
  await expect(page.locator("#artifact-stage")).toHaveClass(/is-visible/);
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-screen-state", /snooz(?:e|ed)/);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('.story-chapter[data-step="06"]').evaluate((element) => {
    scrollTo(0, element.offsetTop);
  });
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-mobile-mode", "story");
  await expect(page.locator("#artifact-stage")).toHaveClass(/is-visible/);
  await expect(page.locator("#artifact-stage")).toHaveCSS("opacity", "1");
  const shortPhoneScale = Number(await page.locator("#artifact-stage").getAttribute("data-phone-scale"));
  expect(shortPhoneScale).toBeGreaterThanOrEqual(0.74);
  const shortPhoneY = Number(await page.locator("#artifact-stage").getAttribute("data-phone-y"));
  expect(shortPhoneY).toBeLessThanOrEqual(0.56);
  await expect(page.locator('.story-chapter[data-step="06"] .mobile-chapter-summary')).toBeVisible();
  await expect(page.locator('.story-chapter[data-step="06"] .chapter-state-card')).toBeHidden();
  const shortStoryType = await page.locator('.story-chapter[data-step="06"]').evaluate((element) => ({
    summary: Number.parseFloat(getComputedStyle(element.querySelector(".chapter-right > p")).fontSize),
    spec: Number.parseFloat(getComputedStyle(element.querySelector(".chapter-specs dd")).fontSize)
  }));
  expect(shortStoryType.summary).toBeGreaterThanOrEqual(12);
  expect(shortStoryType.spec).toBeGreaterThanOrEqual(10);
});

test("desktop rotation hint stays beside the phone and inside the viewport", async ({ page }) => {
  await page.goto("/");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 }
  ]) {
    await page.setViewportSize(viewport);
    const hint = await page.locator(".artifact-drag-hint").boundingBox();
    expect(hint).not.toBeNull();

    const phoneCenter = viewport.width * (viewport.width <= 1180 ? 0.58 : 0.59);
    const minimumSideOffset = Math.min(viewport.width * 0.195, 285);
    expect(hint.x).toBeGreaterThanOrEqual(phoneCenter + minimumSideOffset);
    expect(hint.x + hint.width).toBeLessThanOrEqual(viewport.width);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const mobileHint = await page.locator(".artifact-drag-hint").boundingBox();
  expect(mobileHint).not.toBeNull();
  expect(mobileHint.x + mobileHint.width / 2).toBeCloseTo(195, 0);

  const mobileIcon = await page.locator(".artifact-drag-icon").boundingBox();
  expect(mobileIcon).not.toBeNull();
  expect(mobileIcon.width).toBeCloseTo(30, 1);
  expect(mobileIcon.height).toBeCloseTo(30, 1);
});

test("dense phone displays receive a crisp adaptive framebuffer", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();
  await page.goto("/");
  const ratio = await page.evaluate(async () => {
    const { artifactPixelRatio } = await import("/src/scene/capability-policy.js");
    return artifactPixelRatio();
  });
  expect(ratio).toBeGreaterThanOrEqual(1.75);
  expect(ratio).toBeLessThanOrEqual(2);
  await context.close();
});

test("snooze gesture reaches and dwells over the app-accurate target", async ({ page }) => {
  await page.goto("/");
  const frames = await page.evaluate(async () => {
    const { appSnoozeTargetMetrics, snoozeStoryFrame } = await import("/src/scene/phone-scene.js");
    return {
      metrics: appSnoozeTargetMetrics,
      approaching: snoozeStoryFrame(0.47),
      captured: snoozeStoryFrame(0.65),
      snoozed: snoozeStoryFrame(0.8),
      returning: snoozeStoryFrame(0.95)
    };
  });

  expect(frames.approaching.targetVisible).toBe(true);
  expect(frames.approaching.bubbleVisible).toBe(true);
  expect(frames.metrics).toMatchObject({
    widthDp: 176,
    heightDp: 78,
    cornerRadiusDp: 28,
    bottomMarginDp: 22,
    restingStrokeDp: 2,
    capturedStrokeDp: 3,
    textSizeSp: 14,
    elevationDp: 12,
    capturedScale: 1.06,
    bubbleSizeDp: 48
  });
  expect(frames.metrics.bubbleScale).toBeCloseTo(0.65, 2);
  expect(frames.captured).toMatchObject({
    bubbleX: 0,
    bubbleVisible: true,
    targetVisible: true,
    captured: true,
    snoozed: false
  });
  expect(frames.captured.bubbleY).toBeCloseTo(frames.metrics.centerYWorld, 5);
  expect(frames.snoozed).toMatchObject({
    bubbleX: 0,
    bubbleVisible: false,
    targetVisible: false,
    snoozed: true
  });
  expect(frames.snoozed.bubbleY).toBeCloseTo(frames.metrics.centerYWorld, 5);
  expect(frames.returning.bubbleVisible).toBe(true);
  expect(frames.returning.bubbleX).toBeGreaterThan(0);
  expect(frames.returning.bubbleY).toBeGreaterThan(-2.99);
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
