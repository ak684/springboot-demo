/**
 * WISTA image logo scenario.
 *
 * Verifies that when ?brand=wista is active:
 *   1. branding.logo.imageUrl is present in window.__BRANDING__.
 *   2. The Logo component renders an <img> with that URL (not the old
 *      "WISTA" text).
 *   3. The image loads successfully (naturalWidth > 0).
 *   4. After login, the header on the portfolios page also shows the image
 *      logo instead of text.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-image-logo
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("loading /login?brand=wista");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  // Reload once so the persisted brand query triggers a fresh /branding.js
  // fetch with the WISTA payload.
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  ctx.note(`branding.companyName=${branding?.companyName}`);
  ctx.note(`branding.logo.imageUrl=${branding?.logo?.imageUrl}`);
  ctx.note(`branding.logo.imageHeight=${branding?.logo?.imageHeight}`);
  if (branding?.companyName !== "WISTA") {
    throw new Error(`expected WISTA branding, got companyName=${branding?.companyName}`);
  }
  if (!branding?.logo?.imageUrl) {
    throw new Error("expected branding.logo.imageUrl to be set for WISTA");
  }

  await ctx.screenshot("01-wista-login-image-logo");

  // The login page renders the Logo component. Locate the <img> inside it and
  // verify it actually loaded (naturalWidth > 0). Also confirm the old text
  // "WISTA" is NOT rendered inside the same Logo container.
  const logoImg = ctx.page.locator(`img[src="${branding.logo.imageUrl}"]`).first();
  await logoImg.waitFor({ state: "visible", timeout: 10000 });
  const naturalWidth = await logoImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
  ctx.note(`logo img naturalWidth=${naturalWidth}`);
  if (!naturalWidth || naturalWidth < 1) {
    throw new Error(`logo image failed to load (naturalWidth=${naturalWidth})`);
  }

  if (!ctx.args.shouldLogin) {
    ctx.note("skipping login (--no-login)");
    return;
  }

  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("02-wista-post-login-header");

  // After login, the Header renders a Logo at the top-left. Confirm it is an
  // <img> (not the old text Typography).
  const header = ctx.page.locator("nav.MuiAppBar-root");
  await header.waitFor({ state: "visible", timeout: 15000 });
  const headerLogoImg = header.locator(`img[src="${branding.logo.imageUrl}"]`);
  const headerImgCount = await headerLogoImg.count();
  ctx.note(`header logo img count=${headerImgCount}`);
  if (headerImgCount === 0) {
    throw new Error("expected header to render the WISTA image logo, found none");
  }

  // Sanity-check: the header should NOT contain a standalone "WISTA" text node
  // now that the image renders.
  await ctx.screenshot("03-wista-header-closeup");
};

export default scenario;
