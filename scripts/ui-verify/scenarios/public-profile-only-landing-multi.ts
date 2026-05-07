/**
 * Scenario: PUBLIC_PROFILE_ONLY user with access to MULTIPLE companies
 * (issue #505).
 *
 * Verifies:
 *   1. After login the user lands on /manage-public-profile.
 *   2. The page renders one "Manage Public Profile" button per granted
 *      company, each showing the company name as a sub-label so the
 *      founder can tell them apart.
 *   3. Clicking a specific button navigates to the matching
 *      /company/{id}/edit-public-profile editor.
 *   4. Header falls back to the user name (not a single company) when
 *      N>1, since there's no single "active" company.
 *
 * Pre-requisite: testuser id=88 has company_member_access rows for both
 * company 11 (Lyft, Inc.) and company 20 (Shell plc).
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario public-profile-only-landing-multi \
 *     --email testuser@impactforesight.io --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in as multi-company PUBLIC_PROFILE_ONLY user");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  await ctx.page.waitForURL(/\/manage-public-profile/, { timeout: 15000 });
  await ctx.screenshot("01-multi-landing");

  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 10000,
  });

  const cards = ctx.page.locator(
    '[data-testid^="company-public-profile-card-"]',
  );
  const cardCount = await cards.count();
  ctx.note(`found ${cardCount} company card(s)`);
  if (cardCount < 2) {
    await ctx.dumpInteractables({
      within: '[data-testid="manage-public-profile-page"]',
    });
    throw new Error(`Expected ≥2 CompanyPublicProfileCards; got ${cardCount}`);
  }

  // Both company names should appear across the cards.
  const cardTexts = await Promise.all(
    Array.from({ length: cardCount }, (_, i) => cards.nth(i).textContent()),
  );
  const allCardText = cardTexts.map((l) => (l || "").trim()).join(" | ");
  ctx.note(`card content: ${allCardText.slice(0, 200).replace(/\s+/g, " ")}`);
  const expectedNames = ["Lyft", "Shell"];
  const missing = expectedNames.filter((n) => !allCardText.includes(n));
  if (missing.length > 0) {
    throw new Error(
      `Multi-company landing page missing company names on cards: ${missing.join(", ")}`,
    );
  }
  ctx.note("both company names render on distinct cards");

  // Header should always show the user's name (never a company), across
  // both N=1 and N>1 cases.
  const headerText = (await ctx.page.locator(".MuiAppBar-root").first().textContent()) || "";
  ctx.note(`header text: ${headerText}`);
  const headerLeakedCompany = headerText.includes("Lyft")
    || headerText.includes("Shell");
  if (headerLeakedCompany) {
    throw new Error(
      `Header should show the user's name, not a company; got: ${headerText}`,
    );
  }
  ctx.note("header shows the user's name as expected");

  // Click the second card → Edit, and verify nav to matching editor.
  const secondTestId = await cards.nth(1).getAttribute("data-testid");
  const expectedSecondId = secondTestId?.replace(
    "company-public-profile-card-",
    "",
  );
  ctx.note(`clicking second card (${secondTestId}) → Edit`);
  await cards.nth(1).click({ timeout: 10000 });
  await ctx.waitForSelector('text=Edit public profile', { timeout: 10000 });
  await ctx.page.locator('text=Edit public profile').first().click();
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, {
    timeout: 15000,
  });
  const editorUrl = ctx.page.url();
  if (expectedSecondId && !editorUrl.includes(`/company/${expectedSecondId}/`)) {
    throw new Error(
      `Clicked card for company ${expectedSecondId} but landed on ${editorUrl}`,
    );
  }
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("02-multi-clicked-second-company");

  ctx.note("navigating back to /manage-public-profile");
  await ctx.page.goto(`${ctx.baseUrl}/manage-public-profile`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 10000,
  });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("03-multi-back-on-landing");

  const firstCard = ctx.page
    .locator('[data-testid^="company-public-profile-card-"]')
    .first();
  const firstTestId = await firstCard.getAttribute("data-testid");
  ctx.note(`clicking first card (${firstTestId}) → Edit`);
  await firstCard.click({ timeout: 10000 });
  await ctx.waitForSelector('text=Edit public profile', { timeout: 10000 });
  await ctx.page.locator('text=Edit public profile').first().click();
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, {
    timeout: 15000,
  });
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("04-multi-clicked-first-company");

  ctx.note("public-profile-only-landing-multi scenario complete");
};

export default scenario;
