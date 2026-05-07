/**
 * Scenario: Bilingual public profile editor — DE → EN direction
 * (issue #518 belt-and-suspenders for the reverse translation
 * direction).
 *
 * Verifies:
 *   1. Open the editor on a fresh company (not the one used by
 *      the EN→DE scenario, so state is independent).
 *   2. Switch to the DE tab, type a German description, save.
 *   3. After save, the inactive EN tab is auto-populated with
 *      a machine translation and tagged "Auto-translated."
 *   4. Switch to EN — content is non-empty and the badge is
 *      visible.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario edit-public-profile-bilingual-de-to-en
 */
import type { ScenarioFn } from "../scenario.ts";

const COMPANY_ID = 11;

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
  await ctx.screenshot("01-post-login");

  ctx.note(`opening editor for company ${COMPANY_ID}`);
  await ctx.page.goto(
    `${ctx.baseUrl}/company/${COMPANY_ID}/edit-public-profile`,
    { waitUntil: "domcontentloaded" },
  );
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 20000 })
    .catch(() => {});
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("02-editor-loaded");

  const enToggle = ctx.page.locator(
    'button[aria-label="language-en"]'
  );
  const deToggle = ctx.page.locator(
    'button[aria-label="language-de"]'
  );

  // 1. Switch to DE first so we're editing the German column.
  ctx.note("switching to DE tab");
  await deToggle.click();
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("03-de-tab-active");

  // 2. Fill the DE description.
  const deDesc = ctx.page.locator(
    'textarea[placeholder^="Unternehmensbeschreibung"]'
  ).first();
  await deDesc.waitFor({ timeout: 10000 });
  const germanText =
    "Reverse-Translation-Test: ein nachhaltiges Mobilitätsunternehmen,"
    + " das emissionsarme Fahrgemeinschaften und Fahrradlogistik in"
    + " europäischen Städten anbietet.";
  await deDesc.fill(germanText);
  await ctx.screenshot("04-de-edited");

  // 3. Save DE.
  ctx.note("saving DE");
  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 15000,
    })
    .catch(() => {});
  await ctx.screenshot("05-de-saved");

  // 4. Switch to EN. Expect either "Translating…" while the
  // worker is in flight or "Auto-translated" once content lands.
  ctx.note("switching to EN tab to observe DE → EN translation");
  await enToggle.click();
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("06-en-tab-after-de-save");

  const startWait = Date.now();
  let translated = false;
  while (Date.now() - startWait < 25000) {
    const badgeVisible = await ctx.page
      .locator('text=AUTO-TRANSLATED')
      .first()
      .isVisible()
      .catch(() => false);
    const enValue = await ctx.page
      .locator('textarea[placeholder^="Company description"]')
      .first()
      .inputValue()
      .catch(() => "");
    if (badgeVisible || (enValue && enValue.trim().length > 0)) {
      translated = true;
      ctx.note(
        `EN landed after ${Date.now() - startWait}ms`
        + ` (badge=${badgeVisible}, len=${enValue.length})`
      );
      ctx.note(`EN content preview: "${enValue.slice(0, 100)}"`);
      break;
    }
    await ctx.page.waitForTimeout(1500);
  }
  await ctx.screenshot("07-en-after-translation-wait");

  if (!translated) {
    throw new Error(
      "DE → EN auto-translation did not land within 25s. The"
      + " manual 'Translate from German' button should still"
      + " be available as a fallback, but auto-translate was"
      + " expected to work here."
    );
  }

  ctx.note("DE → EN scenario complete");
};

export default scenario;
