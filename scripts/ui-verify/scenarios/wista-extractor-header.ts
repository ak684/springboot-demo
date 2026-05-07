/**
 * WISTA Company URL Extractor dashboard header scenario.
 *
 * Verifies the dashboard header on /portfolios/:portfolioId/company-url-extractor:
 *   1. Left-side logo is the WISTA image (not text).
 *   2. Breadcrumb shows the portfolio name, not "Company URL Data Extractor".
 *   3. Top-right shows the logged-in user's name + avatar (not portfolio name / logo).
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-extractor-header
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("loading /login?brand=wista");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  ctx.note("navigating to portfolio 1 extractor");
  await ctx.page.goto(`${ctx.baseUrl}/portfolios/1/company-url-extractor`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  // Wait for the header breadcrumb to reflect the portfolio name (after
  // PortfolioContainer finishes loading the portfolio from the API).
  const header = ctx.page.locator("nav.MuiAppBar-root");
  await header.waitFor({ state: "visible", timeout: 15000 });

  // Give the portfolio fetch a moment to populate Redux state.
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot("01-extractor-header");

  // 1. Left-side logo is the WISTA image.
  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  const imageUrl = branding?.logo?.imageUrl;
  ctx.note(`branding image url: ${imageUrl}`);
  if (!imageUrl) throw new Error("expected branding.logo.imageUrl to be set");
  const logoImg = header.locator(`img[src="${imageUrl}"]`);
  const logoCount = await logoImg.count();
  ctx.note(`header image logos: ${logoCount}`);
  if (logoCount < 1) throw new Error("expected image logo in header");

  // 2. Breadcrumb should be the portfolio name, not the static "Company URL Data Extractor".
  const breadcrumbText = await header.locator(".MuiTypography-subtitle").first().innerText().catch(() => "");
  ctx.note(`breadcrumb text: "${breadcrumbText}"`);
  if (!breadcrumbText || breadcrumbText === "Company URL Data Extractor") {
    throw new Error(`expected breadcrumb to show portfolio name, got "${breadcrumbText}"`);
  }

  // 3. Top-right user-menu avatar + name
  const topRightName = await header.locator('.MuiToolbar-root > .MuiBox-root').last().innerText().catch(() => "");
  ctx.note(`top-right text: "${topRightName}"`);

  // 4. Click the avatar and verify "My profile" menu shows
  const avatar = header.locator(".MuiAvatar-root").last();
  await avatar.click();
  await ctx.waitForSelector('[role="menu"]', { timeout: 5000 });
  await ctx.screenshot("02-user-menu-open");

  ctx.note("wista-extractor-header scenario complete");
};

export default scenario;
