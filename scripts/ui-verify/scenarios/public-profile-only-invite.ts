/**
 * Scenario: portfolio manager invites a founder with PUBLIC_PROFILE_ONLY
 * access (issue #505).
 *
 * Verifies:
 *   1. Portfolio manager lands on /team and opens "Invite member".
 *   2. The new "Companies (public profile only)" section is visible.
 *   3. A company can be picked from the autocomplete and the new row
 *      renders with the "Public profile only" dropdown.
 *   4. Submitting the form results in a successful POST /ventures/invite
 *      carrying the `companies` array.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario public-profile-only-invite \
 *     --email alona@impactforesight.io --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  // Capture the POST /ventures/invite payload for later verification.
  let invitePostStatus: number | null = null;
  let invitePostBody: string | null = null;
  ctx.page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/ventures/invite") && response.request().method() === "POST") {
      invitePostStatus = response.status();
      try {
        invitePostBody = response.request().postData();
      } catch {
        // ignore
      }
    }
  });

  ctx.note("logging in as portfolio manager");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  ctx.note("navigating directly to /team");
  await ctx.page.goto(`${ctx.baseUrl}/team`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("Invite member")', { timeout: 30000 });
  await ctx.screenshot("01-team-page");

  ctx.note("clicking Invite member");
  await ctx.page.locator('button:has-text("Invite member")').first().click();
  await ctx.waitForSelector('input[name="email"]', { timeout: 10000 });
  // Wait for the Companies section heading + the inline helper text to render.
  await ctx.waitForSelector(
    'text=Grant the recipient editing access to one or more',
    { timeout: 10000 },
  );
  await ctx.screenshot("02-invite-modal-open");

  const founderEmail = `founder-uiverify-${Date.now()}@example.com`;
  ctx.note(`filling email: ${founderEmail}`);
  await ctx.page.locator('input[name="name"]').fill("Founder");
  await ctx.page.locator('input[name="lastName"]').fill("TestUser");
  await ctx.page.locator('input[name="email"]').fill(founderEmail);
  await ctx.screenshot("03-invite-modal-filled");

  // Scroll the modal down to find the "Companies (public profile only)"
  // section (it's the last of ventures/portfolios/companies).
  ctx.note("scrolling to Companies section + opening its autocomplete");
  const companiesHeading = ctx.page.locator(
    'text=Grant the recipient editing access to one or more',
  ).first();
  await companiesHeading.scrollIntoViewIfNeeded();

  // The "Grant access to:" autocomplete in the companies section is the
  // last such row. Its placeholder starts with "Company name".
  const companyPicker = ctx.page.locator(
    'input[placeholder*="Company name"]',
  ).first();
  await companyPicker.waitFor({ state: "visible", timeout: 10000 });
  await companyPicker.click();
  // Type a couple letters so the options list shows up.
  await companyPicker.fill("L");
  await ctx.page.waitForTimeout(800);
  await ctx.screenshot("04-companies-autocomplete-open");

  // Select the first option from the popper.
  const firstOption = ctx.page.locator('[role="listbox"] [role="option"]').first();
  const optionVisible = await firstOption.isVisible().catch(() => false);
  if (!optionVisible) {
    ctx.note("No autocomplete options visible; dumping interactables");
    await ctx.dumpInteractables({ limit: 40 });
    throw new Error("Company autocomplete returned no options for the portfolio manager");
  }
  const optionText = (await firstOption.textContent()) || "";
  ctx.note(`picking company: ${optionText.trim().slice(0, 60)}`);
  await firstOption.click();
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("05-company-row-added");

  // Verify a "Public profile only" dropdown is visible.
  const ppoDropdown = ctx.page.locator('text=Public profile only').first();
  const ppoVisible = await ppoDropdown.isVisible().catch(() => false);
  ctx.note(`"Public profile only" dropdown visible: ${ppoVisible}`);
  if (!ppoVisible) {
    throw new Error(
      "Expected a 'Public profile only' dropdown after picking a company",
    );
  }

  ctx.note("submitting invite");
  await ctx.page.locator('button:has-text("(Re)Send invitation")').first().click();
  // Wait for the response to come back.
  await ctx.page.waitForTimeout(4000);
  await ctx.screenshot("06-post-invite");

  ctx.note(`POST /ventures/invite status: ${invitePostStatus}`);
  ctx.note(`POST /ventures/invite body: ${invitePostBody?.slice(0, 500)}`);
  if (invitePostStatus !== 200) {
    throw new Error(
      `Expected POST /ventures/invite to return 200; got ${invitePostStatus}`,
    );
  }
  if (!invitePostBody || !invitePostBody.includes('"companies"')) {
    throw new Error(
      `POST /ventures/invite body did not include a companies array: ${invitePostBody}`,
    );
  }
  if (!invitePostBody.includes("PUBLIC_PROFILE_ONLY")) {
    throw new Error(
      `POST /ventures/invite body did not carry PUBLIC_PROFILE_ONLY access: ${invitePostBody}`,
    );
  }

  ctx.note("public-profile-only-invite scenario complete");
};

export default scenario;
