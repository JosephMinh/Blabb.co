import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
});

test("mode switch, transcript rules, use cases, and bubble controls respond", async ({ page }) => {
  await page.locator("#voice-tab").click();
  await expect(page.locator("#voice-tab")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#voice-panel")).toHaveClass(/is-active/);

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
