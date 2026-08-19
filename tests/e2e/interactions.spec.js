import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("mode switch, transcript rules, use cases, and bubble controls respond", async ({ page }) => {
  test.setTimeout(60_000);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await page.locator("#voice-tab").click();
  await expect(page.locator("#voice-tab")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#voice-panel")).toHaveClass(/is-active/);
  await expect(page.locator(".mode-voice-panel")).toContainText("Tap to dictate with Blabb");
  await expect(page.locator(".mode-voice-panel")).toContainText("Start speaking");

  await page.locator("#app-tab").click();
  await expect(page.locator("#app-tab")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#app-panel")).toHaveClass(/is-active/);
  await expect(page.locator(".mode-home-screen")).toContainText("You’re ready to Blabb");

  await page.locator('[data-bubble-state="listening"]').click();
  await expect(page.locator("#giant-bubble")).toHaveAttribute("data-state", "listening");
  await expect(page.locator("#lab-status")).toContainText("LISTENING");

  await page.locator("#filler-toggle").uncheck();
  await expect(page.locator("#transcript-result")).toContainText("um");

  await page.locator('[data-context="email"]').click();
  await expect(page.locator("#context-heading")).toContainText("first draft");
  await expect(page.locator('#context-tab-email')).toHaveAttribute("aria-selected", "true");
});

test("mobile menu is keyboard reachable and dismisses with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#menu-button").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#menu-button")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-button")).toHaveAttribute("aria-expanded", "false");
});

test("the snooze target follows the app's drag, capture, and release lifecycle", async ({ page }) => {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await page.locator("#controls").scrollIntoViewIfNeeded();
  await page.locator('[data-bubble-state="ready"]').click();

  const bubble = page.locator("#giant-bubble");
  const target = page.locator("#lab-snooze-target");
  await expect(target).not.toHaveClass(/is-visible/);

  const bubbleBox = await bubble.boundingBox();
  const targetBox = await target.boundingBox();
  expect(bubbleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  const startX = bubbleBox.x + bubbleBox.width / 2;
  const startY = bubbleBox.y + bubbleBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 20, { steps: 3 });
  await expect(target).toHaveClass(/is-visible/);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 }
  );
  await expect(target).toHaveClass(/is-captured/);
  await page.mouse.up();

  await expect(bubble).toHaveClass(/snoozed/);
  await expect(target).not.toHaveClass(/is-visible/);
  await expect(page.locator("#lab-status")).toContainText("SNOOZED");
});

test("paused waitlist exposes no submission endpoint", async ({ page }) => {
  await expect(page.locator(".waitlist-form")).toHaveAttribute("data-state", "paused");
  await expect(page.locator("#waitlist-email")).toBeDisabled();
  await expect(page.locator(".waitlist-form button")).toBeDisabled();
  await expect(page.locator(".waitlist-form")).toContainText("No email is collected");
  await expect(page.locator("form[data-waitlist-form]")).toHaveCount(0);
});

test("mobile content remains fully styled when JavaScript is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".phone-artifact")).toBeVisible();
  const presentation = await page.evaluate(() => {
    const mark = document.querySelector(".brand-mark").getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      markWidth: mark.width,
      bodyFont: getComputedStyle(document.body).fontFamily,
      heroSize: Number.parseFloat(getComputedStyle(document.querySelector("#hero-title")).fontSize)
    };
  });
  expect(presentation.overflow).toBeLessThanOrEqual(0);
  expect(presentation.markWidth).toBeLessThan(60);
  expect(presentation.bodyFont).toContain("Nunito");
  expect(presentation.heroSize).toBeGreaterThan(48);
  await context.close();
});
