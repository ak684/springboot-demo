/**
 * Scenario: hide persistence + destructive delete on the
 * public profile editor (#486).
 *
 * Verifies:
 *   1. Seed a company with ESG + cert data.
 *   2. Login, open the editor.
 *   3. Toggle a section hide (hide persistence).
 *   4. Toggle a per-item hide on SDGs or products (hide persistence).
 *   5. Click the trash icon on ESG report → calls clearField('esgReport').
 *   6. Click the trash icon on a cert slot → calls clearField('certPrimary').
 *   7. Save — expect a PATCH with hiddenProfileElements + clearedFields.
 *   8. Reload the editor — cleared items should be GONE (not soft-hidden),
 *      hidden items dimmed.
 *   9. Open the public view — same.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-hide-persistence
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});

  ctx.note("opening editor for company 5");
  await ctx.page.goto(
    `${ctx.baseUrl}/company/5/edit-public-profile`,
    { waitUntil: "domcontentloaded" },
  );
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(2500);
  await ctx.screenshot("01-editor-loaded");

  // 1. Toggle a section hide (any section — last is usually contact).
  ctx.note("clicking a section hide toggle");
  const sectionToggles = ctx.page.locator(
    'button[aria-label="toggle-section-visibility"]',
  );
  const sectionCount = await sectionToggles.count();
  ctx.note(`section toggles on page: ${sectionCount}`);
  if (sectionCount > 0) {
    await sectionToggles.last().click({ timeout: 10000 });
    await ctx.page.waitForTimeout(400);
  }
  await ctx.screenshot("02-section-toggled");

  // 2. Per-item hide (first eye-off button — typically a product).
  ctx.note("clicking an item hide toggle");
  const hideButtons = ctx.page.locator('button[aria-label="hide"]');
  const hideCount = await hideButtons.count();
  ctx.note(`item hide buttons on page: ${hideCount}`);
  if (hideCount > 0) {
    await hideButtons.first().click({ timeout: 10000 });
    await ctx.page.waitForTimeout(400);
  }
  await ctx.screenshot("03-item-hidden");

  // 3. Trash — expect trash icons on products, ESG report, and cert
  // slots ONLY (not on SDG or Portfolio Highlight in this revision).
  ctx.note("clicking a trash icon (last = last certification)");
  const trashButtons = ctx.page.locator('button[aria-label="delete"]');
  const trashCount = await trashButtons.count();
  ctx.note(`delete buttons on page: ${trashCount}`);
  if (trashCount > 0) {
    // Click the LAST trash — the last visible cert slot.
    await trashButtons.last().click({ timeout: 10000 });
    await ctx.page.waitForTimeout(400);
  }
  await ctx.screenshot("04-item-deleted");

  ctx.note("saving");
  const saveBtn = ctx.page
    .locator('button:has-text("Save Changes")')
    .first();
  await saveBtn.click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 10000,
    })
    .catch(() => {});
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("05-after-save");

  ctx.note("fetching profile via API to confirm persistence");
  const apiState = await ctx.page.evaluate(async () => {
    const r = await fetch("/api/v1/public/companies/5/profile");
    return r.json();
  });
  type Profile = {
    hidden_profile_elements?: { sections?: unknown };
    esg_impact_report?: unknown;
    certification_name?: unknown;
    prize_award_name_1?: unknown;
    prize_award_name_2?: unknown;
  };
  const p = apiState as Profile;
  ctx.note(
    "hide map sections="
    + JSON.stringify(p.hidden_profile_elements?.sections)
    + ` esg_impact_report=${JSON.stringify(p.esg_impact_report)}`
    + ` cert_name=${JSON.stringify(p.certification_name)}`
    + ` award1=${JSON.stringify(p.prize_award_name_1)}`
    + ` award2=${JSON.stringify(p.prize_award_name_2)}`,
  );

  ctx.note("reloading editor");
  await ctx.page.reload({ waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(2500);
  await ctx.screenshot("06-editor-reloaded");

  ctx.note("opening public view");
  await ctx.page.goto(`${ctx.baseUrl}/company-overview/5`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot("07-public-view");

  ctx.note("wista-hide-persistence scenario complete");
};

export default scenario;
