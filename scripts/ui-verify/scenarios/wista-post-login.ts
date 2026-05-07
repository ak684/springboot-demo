/**
 * WISTA white-label post-login routing scenario.
 *
 * Verifies:
 *   1. ?brand=wista renders WISTA branding on the login page (teal background,
 *      WISTA greeting, no Stripe signup link).
 *   2. After login, a user with multiple portfolios lands on the /portfolios
 *      picker (not the legacy default route).
 *   3. Clicking a portfolio tile routes to the company URL extractor, not the
 *      legacy portfolio dashboard.
 *   4. The extractor page renders the global Header with the user-menu avatar
 *      visible top-right (regression check for the missing-Layout bug).
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-post-login
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  // 1. Visit /login with ?brand=wista. The frontend persists this in
  // localStorage and reloads /branding.js with the WISTA payload.
  ctx.note("loading /login?brand=wista");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  // The first load may render with default branding while branding.js is being
  // re-fetched after localStorage gets set. Reload once to guarantee we see the
  // WISTA payload.
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.screenshot("01-wista-login");

  // 2. Verify branding actually flipped: window.__BRANDING__.companyName === 'WISTA'
  // and whiteLabel.companyDashboardRouteTemplate is configured.
  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  ctx.note(`branding.companyName=${branding?.companyName}`);
  ctx.note(`branding.whiteLabel.enabled=${branding?.whiteLabel?.enabled}`);
  ctx.note(`branding.whiteLabel.companyDashboardRouteTemplate=${branding?.whiteLabel?.companyDashboardRouteTemplate}`);
  if (branding?.companyName !== "WISTA") {
    throw new Error(`expected WISTA branding, got companyName=${branding?.companyName}`);
  }
  if (branding?.whiteLabel?.enabled !== true) {
    throw new Error("expected whiteLabel.enabled=true");
  }
  if (branding?.whiteLabel?.companyDashboardRouteTemplate !== "/portfolios/:portfolioId/company-url-extractor") {
    throw new Error(
      `expected companyDashboardRouteTemplate=/portfolios/:portfolioId/company-url-extractor, got ${branding?.whiteLabel?.companyDashboardRouteTemplate}`,
    );
  }

  // 3. Verify the Stripe "Sign Up" link is NOT shown for WISTA.
  const signUpVisible = await ctx.page.locator('a:has-text("Sign Up")').isVisible().catch(() => false);
  if (signUpVisible) {
    throw new Error('"Sign Up" link should be hidden when whiteLabel.hideStripeSignup=true');
  }
  ctx.note('"Sign Up" link is hidden as expected');

  if (!ctx.args.shouldLogin) {
    ctx.note("skipping login (--no-login)");
    return;
  }

  // 4. Login.
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("02-post-login");

  // 5. Seed user `alona@impactforesight.io` has access to multiple portfolios,
  // so post-login should land on /portfolios (the picker), NOT directly on the
  // extractor.
  const url = new URL(ctx.page.url());
  ctx.note(`post-login url: ${url.pathname}`);
  if (url.pathname !== "/portfolios") {
    throw new Error(
      `expected post-login redirect to /portfolios for multi-portfolio user, got ${url.pathname}`,
    );
  }

  // 6. Click the first portfolio tile and verify it goes to the extractor, not
  // the legacy /portfolios/:id dashboard.
  // PortfolioCard renders each portfolio as an MUI Card; clicking it invokes
  // goToPortfolio(p) which (for WISTA) navigates to the extractor.
  const cards = ctx.page.locator(".MuiCard-root");
  await cards.first().waitFor({ state: "visible", timeout: 15000 });
  await ctx.screenshot("03-portfolio-picker");
  await cards.first().click();
  await ctx.page.waitForURL(/\/portfolios\/\d+\/company-url-extractor/, { timeout: 10000 }).catch(async (e) => {
    await ctx.screenshot("FAILURE-tile-click");
    throw new Error(`tile click did not navigate to extractor: ${(e as Error).message}; current url=${ctx.page.url()}`);
  });
  ctx.note(`navigated to extractor: ${ctx.page.url()}`);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("04-extractor-page");

  // 7. Verify the global Header is rendered (regression check for the
  // missing-Layout bug). The Header is an MUI AppBar with component='nav', so
  // it renders as a <nav class="MuiAppBar-root">.
  const header = ctx.page.locator("nav.MuiAppBar-root");
  if ((await header.count()) === 0) {
    throw new Error("expected global Header (MuiAppBar) to render on extractor page; not found");
  }
  ctx.note("Header is present on the extractor page");

  // The avatar acts as the user-menu trigger and lives inside the Header.
  const avatar = header.locator(".MuiAvatar-root");
  if ((await avatar.count()) === 0) {
    throw new Error("expected user-menu Avatar to render in the Header");
  }
  ctx.note("user-menu Avatar is present top-right");

  // 8. Open the user menu and screenshot.
  await avatar.first().click();
  await ctx.waitForSelector('[role="menu"]', { timeout: 5000 });
  await ctx.screenshot("05-user-menu-open");

  // 9. Navigate back to /portfolios and click "+ New portfolio" to verify
  // the new modal submission routes to the extractor for the newly-created
  // portfolio (and does not leave us on the picker page).
  ctx.note('navigating to /portfolios to exercise the new-portfolio flow');
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("New portfolio")', { timeout: 15000 });

  // Dismiss potential onboarding tooltip/snackbar that can overlay the button.
  const tooltipClose = ctx.page.locator('[data-testid="OnboardingTooltipClose"], .MuiSnackbar-root button:has(svg)');
  if (await tooltipClose.first().isVisible().catch(() => false)) {
    ctx.note("closing onboarding tooltip");
    await tooltipClose.first().click().catch(() => {});
  }

  // Open the simple modal (no navigation when opening).
  const beforeClickUrl = ctx.page.url();
  await ctx.page.locator('button:has-text("New portfolio")').first().click({ force: true });
  await ctx.waitForSelector('.MuiDialog-root h2:has-text("New portfolio")', { timeout: 10000 });
  await ctx.screenshot("06-new-portfolio-modal");
  const afterClickUrl = ctx.page.url();
  if (afterClickUrl !== beforeClickUrl) {
    throw new Error(`clicking "+ New portfolio" should open a modal without navigating; before=${beforeClickUrl} after=${afterClickUrl}`);
  }

  // Fill the required name and submit.
  const uniqueName = `UI Verify Portfolio ${Date.now()}`;
  await ctx.page.locator('input[data-testid="new-portfolio-name-input"]').fill(uniqueName);
  await ctx.page.locator('.MuiDialog-root button:has-text("Create")').click();

  // Expect navigation to the extractor for the new portfolio.
  await ctx.page.waitForURL(/\/portfolios\/[0-9]+\/company-url-extractor/, { timeout: 15000 }).catch(async (e) => {
    await ctx.screenshot("FAILURE-no-extractor-nav-after-create");
    throw new Error(`expected navigation to extractor after creating new portfolio; url=${ctx.page.url()}; ${(e as Error).message}`);
  });
  ctx.note(`created new portfolio and navigated to extractor: ${ctx.page.url()}`);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("07-new-portfolio-extractor");
};

export default scenario;
