/**
 * WISTA auth Figma comparison scenario.
 *
 * Captures screenshots of the four WISTA auth screens:
 *   - /login (with ?brand=wista to flip the branding payload)
 *   - /forgot
 *   - /reset/:token
 *   - /welcome
 *
 * Compare the output screenshots to docs/wista-whitelabel/figma-designs/*.png
 * after running.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-auth-figma-compare --no-login
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.page.setViewportSize({ width: 1440, height: 900 });

  ctx.note("loading /login?brand=wista to flip branding into WISTA mode");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  ctx.note(`branding.companyName=${branding?.companyName}`);
  if (branding?.companyName !== "WISTA") {
    throw new Error(`expected WISTA branding, got companyName=${branding?.companyName}`);
  }
  const wl = branding?.whiteLabel || {};
  ctx.note(`authQuote=${wl.authQuote}`);
  ctx.note(`authQuoteAttribution=${wl.authQuoteAttribution}`);
  ctx.note(`authBackgroundColor=${wl.authBackgroundColor}`);
  ctx.note(`authBackgroundGradientEnd=${wl.authBackgroundGradientEnd}`);
  ctx.note(`authShowBackLink=${wl.authShowBackLink}`);

  if (!wl.authQuote) {
    throw new Error("expected whiteLabel.authQuote to be set for WISTA");
  }
  if (!wl.authBackgroundGradientEnd) {
    throw new Error("expected whiteLabel.authBackgroundGradientEnd to be set for WISTA");
  }

  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("01-login-page");

  ctx.note("loading /forgot");
  await ctx.page.goto(`${ctx.baseUrl}/forgot`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("02-forgot-password-page");

  ctx.note("loading /reset/dummy-token");
  await ctx.page.goto(`${ctx.baseUrl}/reset/dummy-token`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="password"]', { timeout: 30000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("03-reset-password-page");

  ctx.note("loading /welcome");
  await ctx.page.goto(`${ctx.baseUrl}/welcome`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('a.MuiButton-root', { timeout: 30000 });
  await ctx.page.waitForTimeout(800);
  await ctx.screenshot("04-welcome-page");

  ctx.note("captured all four Figma-reference screens");
};

export default scenario;
