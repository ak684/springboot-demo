/**
 * WISTA name-only "New portfolio" modal scenario (issue #471).
 *
 * Verifies:
 *   1. ?brand=wista is active and whiteLabel.companyDashboardRouteTemplate is set.
 *   2. After login, clicking "+ New portfolio" on /portfolios opens the new
 *      name-only modal (NOT the multi-step profile-wizard).
 *   3. Entering a name and clicking Create posts the portfolio and routes the
 *      user to the company URL extractor for the newly-created portfolio.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-new-portfolio-modal
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("loading /login?brand=wista");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  // Re-load once so branding.js is re-fetched with the WISTA payload.
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.screenshot("01-wista-login");

  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  ctx.note(`branding.companyName=${branding?.companyName}`);
  ctx.note(`branding.whiteLabel.companyDashboardRouteTemplate=${branding?.whiteLabel?.companyDashboardRouteTemplate}`);
  if (branding?.whiteLabel?.companyDashboardRouteTemplate !== "/portfolios/:portfolioId/company-url-extractor") {
    throw new Error(
      `expected WISTA companyDashboardRouteTemplate, got ${branding?.whiteLabel?.companyDashboardRouteTemplate}`,
    );
  }

  if (!ctx.args.shouldLogin) {
    ctx.note("skipping login (--no-login)");
    return;
  }

  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // Multi-portfolio seed user lands on /portfolios (the picker). If post-login
  // routing sent the user elsewhere (single-portfolio user would go straight to
  // the extractor), explicitly navigate to /portfolios so we can exercise the
  // new modal.
  if (!/\/portfolios(\?|#|$)/.test(ctx.page.url())) {
    ctx.note(`post-login url=${ctx.page.url()}; navigating to /portfolios`);
    await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  }
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("New portfolio")', { timeout: 15000 });
  await ctx.screenshot("02-portfolios-page");

  // Dismiss the onboarding tooltip if it's overlaid on the button — it can
  // intercept the click otherwise.
  const tooltipClose = ctx.page.locator('[data-testid="OnboardingTooltipClose"], .MuiSnackbar-root button:has(svg)');
  if (await tooltipClose.first().isVisible().catch(() => false)) {
    ctx.note("closing onboarding tooltip");
    await tooltipClose.first().click().catch(() => {});
  }

  // 2. Click "+ New portfolio" — should open the simple modal, NOT navigate.
  const beforeClickUrl = ctx.page.url();
  await ctx.page.locator('button:has-text("New portfolio")').first().click({ force: true });
  // The simple modal is an MUI Dialog with the heading "New portfolio".
  await ctx.waitForSelector('.MuiDialog-root h2:has-text("New portfolio")', { timeout: 10000 });
  await ctx.screenshot("03-new-portfolio-modal-open");

  const afterClickUrl = ctx.page.url();
  if (afterClickUrl !== beforeClickUrl) {
    throw new Error(
      `clicking "+ New portfolio" should open a modal without navigating (WISTA brand); ` +
      `url before=${beforeClickUrl} after=${afterClickUrl}`,
    );
  }
  ctx.note("modal opened without navigation");

  // 3. Fill in the name + optional description and submit.
  const uniqueName = `UI Verify Portfolio ${Date.now()}`;
  await ctx.page.locator('input[data-testid="new-portfolio-name-input"]').fill(uniqueName);
  await ctx.page.locator('textarea[data-testid="new-portfolio-description-input"]').fill(
    "Short description entered via the new-portfolio modal (optional field).",
  );
  await ctx.screenshot("04-name-and-description-entered");

  await ctx.page.locator('.MuiDialog-root button:has-text("Create")').click();

  // 4. Expect navigation to the company URL extractor for the new portfolio.
  await ctx.page.waitForURL(/\/portfolios\/\d+\/company-url-extractor/, { timeout: 15000 }).catch(async (e) => {
    await ctx.screenshot("FAILURE-no-extractor-nav");
    throw new Error(`expected navigation to extractor after Create; current url=${ctx.page.url()}; ${(e as Error).message}`);
  });
  ctx.note(`navigated to ${ctx.page.url()}`);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("05-extractor-page-for-new-portfolio");

  // 5. Navigate back to /portfolios and confirm the new tile is present.
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector(`text=${uniqueName}`, { timeout: 15000 });
  await ctx.screenshot("06-new-portfolio-visible-in-picker");
  ctx.note(`new portfolio "${uniqueName}" is visible in picker`);
};

export default scenario;
