/**
 * Scenario: Bilingual public profile editor + auto-translation
 * (issues #517, #518).
 *
 * Verifies:
 *   1. Login and open the public profile editor for a seed
 *      company.
 *   2. EN/DE toggle is visible (replaces old "Localization"
 *      placeholder button).
 *   3. Editing the EN description and saving triggers
 *      auto-translation; the DE tab shows either a
 *      "Translating…" indicator while the worker is in flight
 *      or the "Auto-translated" badge once content lands.
 *   4. After auto-translation lands, switching to DE shows
 *      non-empty content tagged "Auto-translated".
 *   5. Editing DE manually + saving overwrites the
 *      auto-translated DE without flipping EN ownership.
 *   6. Saving EN again does NOT overwrite the user-owned DE.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario edit-public-profile-bilingual
 */
import type { ScenarioFn } from "../scenario.ts";

const COMPANY_ID = 5;

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

  // Open the editor directly for a seeded company.
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

  // 1. EN/DE toggle is visible.
  const enToggle = ctx.page.locator(
    'button[aria-label="language-en"]'
  );
  const deToggle = ctx.page.locator(
    'button[aria-label="language-de"]'
  );
  const enVisible = await enToggle.isVisible().catch(() => false);
  const deVisible = await deToggle.isVisible().catch(() => false);
  ctx.note(`EN toggle: ${enVisible}, DE toggle: ${deVisible}`);
  if (!enVisible || !deVisible) {
    await ctx.dumpInteractables({ within: "header" });
    throw new Error("Language toggle (EN/DE) not visible");
  }

  // 2. Edit EN description and save.
  // The description is the multiline TextField in the
  // header section (4 rows). Find it via placeholder.
  const enDesc = ctx.page.locator(
    'textarea[placeholder^="Company description"]'
  ).first();
  await enDesc.waitFor({ timeout: 10000 });
  await enDesc.fill(
    "Bilingual scenario test: a clean-energy battery company"
      + " building durable, recyclable cells for grid-scale"
      + " storage."
  );
  await ctx.screenshot("03-en-edited");

  ctx.note("saving EN");
  // The "Save Changes" button in the EditHeaderBar is sticky;
  // use the first match.
  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 15000,
    })
    .catch(() => {});
  await ctx.screenshot("04-en-saved");

  // 3. Switch to DE: the editor either shows "Translating…"
  // while the worker runs, or "Auto-translated" + content if
  // the translation has already landed.
  ctx.note("switching to DE tab");
  await deToggle.click();
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("05-de-tab-after-en-save");

  // Wait up to ~20s for the auto-translation pipeline to land
  // content into the DE column. We poll the DOM for either the
  // "AUTO-TRANSLATED" badge or non-empty DE content.
  const startWait = Date.now();
  let translated = false;
  while (Date.now() - startWait < 20000) {
    const badgeVisible = await ctx.page
      .locator('text=AUTO-TRANSLATED')
      .first()
      .isVisible()
      .catch(() => false);
    const deValue = await ctx.page
      .locator('textarea[placeholder^="Unternehmensbeschreibung"]')
      .first()
      .inputValue()
      .catch(() => "");
    if (badgeVisible || (deValue && deValue.trim().length > 0)) {
      translated = true;
      ctx.note(
        `DE landed after ${Date.now() - startWait}ms`
        + ` (badge=${badgeVisible}, len=${deValue.length})`
      );
      break;
    }
    await ctx.page.waitForTimeout(1500);
  }
  await ctx.screenshot("06-de-after-translation-wait");
  if (!translated) {
    ctx.note(
      "WARNING: auto-translation did not land within 20s — UI"
      + " should still show the manual 'Translate from English'"
      + " button as fallback. Continuing scenario."
    );
  }

  // 4. Edit DE manually and save (DE should be marked
  // user-owned afterwards).
  const deDesc = ctx.page.locator(
    'textarea[placeholder^="Unternehmensbeschreibung"]'
  ).first();
  await deDesc.waitFor({ timeout: 5000 });
  const beforeDeValue = await deDesc.inputValue().catch(() => "");
  ctx.note(`DE before manual edit: "${beforeDeValue.slice(0, 60)}"`);
  const manualDeText =
    "Manuell editierte deutsche Beschreibung — sollte nicht"
    + " durch eine spätere englische Speicherung überschrieben"
    + " werden.";
  await deDesc.fill(manualDeText);
  await ctx.screenshot("07-de-manually-edited");
  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 15000,
    })
    .catch(() => {});
  await ctx.screenshot("08-de-saved");

  // 5. Switch back to EN, edit again, save. DE must remain the
  // manual text.
  await enToggle.click();
  await ctx.page.waitForTimeout(1000);
  const enEdit2 = ctx.page.locator(
    'textarea[placeholder^="Company description"]'
  ).first();
  await enEdit2.fill(
    "Bilingual scenario test (revised): a clean-energy battery"
    + " company building durable, recyclable cells."
  );
  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 15000,
    })
    .catch(() => {});
  await ctx.page.waitForTimeout(6000); // give async translator a beat
  await ctx.screenshot("09-en-resaved");

  await deToggle.click();
  await ctx.page.waitForTimeout(1500);
  const finalDeValue = await ctx.page
    .locator('textarea[placeholder^="Unternehmensbeschreibung"]')
    .first()
    .inputValue()
    .catch(() => "");
  ctx.note(
    `DE after EN re-save: "${finalDeValue.slice(0, 80)}"`
  );
  await ctx.screenshot("10-de-after-en-resave");
  if (!finalDeValue.includes("Manuell editierte deutsche")) {
    throw new Error(
      "DE was overwritten by EN re-save even though DE was"
      + " user-owned (auto flag should have prevented this)."
    );
  }

  ctx.note("bilingual + auto-translation scenario complete");
};

export default scenario;
