/**
 * Verifies the social media URL inputs in edit mode have comfortable vertical
 * padding (not cramped with size="small").
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-edit-social-padding
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  await ctx.page.goto(`${ctx.baseUrl}/portfolios/1/company-url-extractor`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  const sidebarItems = ctx.page.locator(".MuiListItemButton-root");
  await sidebarItems.nth(4).click({ timeout: 10000 });
  await ctx.waitForSelector("table tbody tr", { timeout: 30000 });

  const firstRow = ctx.page.locator("table tbody tr").first();
  const tableContainer = ctx.page.locator(".MuiTableContainer-root").first();
  await tableContainer.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await ctx.page.waitForTimeout(400);

  const editBtn = firstRow.locator('span:has-text("Edit")').first();
  await editBtn.click({ timeout: 10000 });
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, { timeout: 15000 });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });

  // Scroll to Facebook URL input
  const fbInput = ctx.page.locator('label:has-text("Facebook URL")').locator('..').locator('input');
  await fbInput.scrollIntoViewIfNeeded().catch(() => {});
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("01-social-padding");

  // Measure input height — should be taller than the old size="small" (~32px).
  const heightPx = await fbInput.evaluate((el: HTMLInputElement) => el.getBoundingClientRect().height);
  ctx.note(`Facebook URL input height=${heightPx}px`);
  if (heightPx < 34) {
    throw new Error(`social input looks cramped (height=${heightPx}px); expected at least ~40px`);
  }

  ctx.note("wista-edit-social-padding scenario complete");
};

export default scenario;
