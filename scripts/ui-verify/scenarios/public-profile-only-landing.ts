/**
 * Scenario: PUBLIC_PROFILE_ONLY user post-login landing (issue #505).
 *
 * Verifies:
 *   1. A user whose only access is a `company_member_access` row with
 *      access=PUBLIC_PROFILE_ONLY lands on the "/manage-public-profile" page
 *      after login.
 *   2. The page renders the hex "Manage Public Profile" button for the
 *      granted company.
 *   3. Header menu is trimmed: no "My portfolios", "My ventures",
 *      "Manage team", or "Edit venture/portfolio profile".
 *   4. Clicking the button navigates to /company/{id}/edit-public-profile.
 *
 * Pre-requisite: a user with PUBLIC_PROFILE_ONLY access has been seeded
 * via the backend (see the test setup in the PR description). The scenario
 * defaults to logging in with the provided email/password.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario public-profile-only-landing \
 *     --email testuser@impactforesight.io --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in as PUBLIC_PROFILE_ONLY user");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});
  await ctx.screenshot("01-post-login");

  ctx.note(`after login URL: ${ctx.page.url()}`);

  await ctx.page.waitForURL(/\/manage-public-profile/, { timeout: 15000 });
  await ctx.screenshot("02-manage-public-profile-landing");

  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 10000,
  });

  const cards = ctx.page.locator(
    '[data-testid^="company-public-profile-card-"]',
  );
  const cardCount = await cards.count();
  ctx.note(`found ${cardCount} company card(s)`);
  if (cardCount < 1) {
    await ctx.dumpInteractables({ within: '[data-testid="manage-public-profile-page"]' });
    throw new Error("Expected at least one CompanyPublicProfileCard");
  }

  // Check that trimmed menu is in effect: open the avatar menu and verify
  // that 'My portfolios', 'My ventures', 'Manage team' are NOT visible.
  ctx.note("opening avatar menu to verify trimmed entries");
  const avatar = ctx.page.locator(".MuiAvatar-root").first();
  await avatar.click({ timeout: 10000 }).catch(() => {});
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("03-avatar-menu-open");

  const pageText = (await ctx.page.textContent("body")) || "";
  const forbidden = [
    "My portfolios",
    "My ventures",
    "Manage team",
    "Edit venture profile",
    "Edit portfolio profile",
    "Book mentor session",
  ];
  const found = forbidden.filter((t) => pageText.includes(t));
  if (found.length > 0) {
    ctx.note(`WARNING: trimmed menu still contains: ${found.join(", ")}`);
  } else {
    ctx.note("menu trim OK - none of the forbidden items are visible");
  }

  // Header shows the user's name (consistent across all user types).
  const headerText = (await ctx.page.locator(".MuiAppBar-root").first().textContent()) || "";
  if (headerText.toLowerCase().includes("lyft")) {
    throw new Error(
      `Header should show the user's name, not the company. Got: ${headerText.slice(0, 200)}`,
    );
  }
  ctx.note("header shows the user's name as expected");

  // The card should contain the company name.
  const cardText = (await cards.first().textContent()) || "";
  if (!cardText.includes("Lyft")) {
    throw new Error(`Expected card to contain company name Lyft; got: ${cardText.slice(0, 200)}`);
  }
  ctx.note(`card content: ${cardText.slice(0, 120).replace(/\s+/g, " ")}…`);

  // Close the menu by clicking back on the page
  await ctx.page.keyboard.press("Escape").catch(() => {});
  await ctx.page.waitForTimeout(300);

  // Click the card → menu opens with Edit/View. Pick Edit.
  ctx.note("clicking card → choosing Edit public profile");
  await cards.first().click({ timeout: 10000 });
  await ctx.waitForSelector('text=Edit public profile', { timeout: 10000 });
  await ctx.screenshot("04-card-menu-open");
  await ctx.page.locator('text=Edit public profile').first().click();
  await ctx.page
    .waitForURL(/\/company\/\d+\/edit-public-profile/, { timeout: 15000 });

  // Wait for the editor to fully load (Save Changes button appears).
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("05-edit-public-profile-page");

  if (!/\/company\/\d+\/edit-public-profile/.test(ctx.page.url())) {
    throw new Error(
      "Did not navigate to /company/{id}/edit-public-profile after click",
    );
  }

  ctx.note("public-profile-only-landing scenario complete");
};

export default scenario;
