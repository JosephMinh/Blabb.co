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
  await page.mouse.move(1000, 465, { steps: 8 });
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-interaction", "dragging");
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-rotation", /,/);
  await page.mouse.up();
  await expect(page.locator("#artifact-stage")).toHaveAttribute("data-interaction", "ready");

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
});
