/**
 * Scenario: hybrid user with BOTH portfolio EDIT access AND
 * PUBLIC_PROFILE_ONLY access on a separate company (issue #505).
 *
 * Verifies:
 *   1. A user with portfolio-member access + a company_member_access row
 *      lands on `/portfolios` (normal portfolio-manager home), not
 *      `/manage-public-profile`.
 *   2. The portfolios page shows the "Portfolios" grid as usual AND a
 *      new "Public Profile Access" section with a CompanyPublicProfileCard
 *      per PUBLIC_PROFILE_ONLY grant.
 *   3. Clicking a company card opens the view/edit menu and routing
 *      works for both options.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario public-profile-hybrid-access \
 *     --email <hybrid-user> --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in as hybrid-access user");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("01-post-login");
  ctx.note(`post-login URL: ${ctx.page.url()}`);

  // Hybrid user should NOT be redirected to /manage-public-profile since
  // they have portfolio/venture access. They should hit the normal
  // portfolios landing.
  if (ctx.page.url().includes("/manage-public-profile")) {
    throw new Error(
      "Hybrid user was incorrectly redirected to /manage-public-profile",
    );
  }
  // Navigate explicitly to /portfolios to normalize regardless of the
  // default post-login route branch the user has.
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('text=Portfolios', { timeout: 15000 });
  await ctx.screenshot("02-portfolios-page");

  // Expect the new "Public Profile Access" section with at least one
  // company card.
  await ctx.waitForSelector('text=Public Profile Access', { timeout: 10000 });
  const cards = ctx.page.locator('[data-testid^="company-public-profile-card-"]');
  const cardCount = await cards.count();
  ctx.note(`found ${cardCount} Public Profile Access card(s)`);
  if (cardCount < 1) {
    throw new Error("Expected at least 1 CompanyPublicProfileCard on /portfolios");
  }
  await ctx.screenshot("03-portfolios-with-public-profile-section");

  // Click the card body — it should open the View/Edit popup menu.
  ctx.note("clicking first company card to open menu");
  await cards.first().click({ timeout: 10000 });
  await ctx.waitForSelector('text=Edit public profile', { timeout: 10000 });
  await ctx.waitForSelector('text=View public profile', { timeout: 10000 });
  await ctx.screenshot("04-card-menu-open");

  // Choose "Edit public profile" and verify navigation.
  await ctx.page.locator('text=Edit public profile').first().click();
  await ctx.page
    .waitForURL(/\/company\/\d+\/edit-public-profile/, { timeout: 15000 });
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("05-edit-public-profile");

  // Go back to /portfolios and exercise the View path too.
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('[data-testid^="company-public-profile-card-"]', { timeout: 10000 });
  await ctx.page.locator('[data-testid^="company-public-profile-card-"]').first().click();
  await ctx.waitForSelector('text=View public profile', { timeout: 10000 });
  await ctx.page.locator('text=View public profile').first().click();
  await ctx.page.waitForURL(/\/company-overview\/\d+/, { timeout: 15000 });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("06-view-public-profile");

  ctx.note("public-profile-hybrid-access scenario complete");
};

export default scenario;
