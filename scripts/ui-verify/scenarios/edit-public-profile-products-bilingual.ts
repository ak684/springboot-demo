/**
 * Scenario: Bilingual public profile editor + auto-translation
 * extended to product item titles/descriptions (issue #524,
 * builds on #523).
 *
 * Verifies:
 *   1. Login and open the public profile editor for a seed
 *      company.
 *   2. EN tab: edit company description AND a product item
 *      description, save.
 *   3. Switch to DE tab — the same single save fires the
 *      translation worker, which translates both
 *      company_description AND product items in one OpenAI
 *      call. Both should land within ~20s (or show
 *      "Translating…" / the manual-translate fallback).
 *   4. "Auto-translated" badge appears for the company
 *      description (page-level badge is sufficient per #524
 *      out-of-scope).
 *   5. Edit a product DE description manually, save in DE.
 *   6. Re-save EN with new content. The user-edited DE product
 *      description must NOT be overwritten — same per-field
 *      CAS protection #523 introduced, applied at item
 *      granularity.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario edit-public-profile-products-bilingual
 */
import type { ScenarioFn } from "../scenario.ts";

const COMPANY_ID = 5;

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', {
    timeout: 30000,
  });
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

  const enToggle = ctx.page.locator(
    'button[aria-label="language-en"]',
  );
  const deToggle = ctx.page.locator(
    'button[aria-label="language-de"]',
  );
  const enVisible = await enToggle.isVisible().catch(() => false);
  const deVisible = await deToggle.isVisible().catch(() => false);
  ctx.note(`EN toggle: ${enVisible}, DE toggle: ${deVisible}`);
  if (!enVisible || !deVisible) {
    await ctx.dumpInteractables({ within: "header" });
    throw new Error("Language toggle (EN/DE) not visible");
  }

  // Make sure we start on EN.
  if (!(await enToggle.evaluate((el) =>
    el.classList.contains("Mui-selected"),
  ))) {
    await enToggle.click();
    await ctx.page.waitForTimeout(500);
  }

  // 2. Edit EN company description.
  const EN_DESCRIPTION =
    "Bilingual products scenario: a sustainable solar"
    + " manufacturer building monocrystalline panels for"
    + " European utility-scale projects.";
  const enDesc = ctx.page.locator(
    'textarea[placeholder^="Company description"]',
  ).first();
  await enDesc.waitFor({ timeout: 10000 });
  await enDesc.fill(EN_DESCRIPTION);

  // Edit at least one product description in EN. Find the
  // "Product description" placeholder textareas. If there are
  // no products yet, click "Add Core Product" first.
  let productDescBoxes = ctx.page.locator(
    'textarea[placeholder="Product description"]',
  );
  let productCount = await productDescBoxes.count();
  if (productCount === 0) {
    ctx.note("no products visible, adding one");
    await ctx.page
      .locator('button:has-text("Add Core Product")')
      .click();
    await ctx.page.waitForTimeout(500);
    productDescBoxes = ctx.page.locator(
      'textarea[placeholder="Product description"]',
    );
    productCount = await productDescBoxes.count();
  }
  if (productCount === 0) {
    throw new Error("Could not find or add any product rows");
  }
  ctx.note(`found ${productCount} product description boxes`);

  const productTitleBoxes = ctx.page.locator(
    'textarea[placeholder="Product name"]',
  );
  const EN_PRODUCT_TITLE =
    "Solar Panel Module";
  const EN_PRODUCT_DESC =
    "High-efficiency monocrystalline silicon module"
    + " engineered for European grid-scale installations.";
  await productTitleBoxes.first().fill(EN_PRODUCT_TITLE);
  await productDescBoxes.first().fill(EN_PRODUCT_DESC);
  await ctx.screenshot("03-en-edited");

  ctx.note("saving EN");
  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector(
      '.Toastify__toast--success, [class*="toast"]',
      { timeout: 15000 },
    )
    .catch(() => {});
  await ctx.screenshot("04-en-saved");

  // 3. Switch to DE: the editor either shows "Translating…"
  // while the worker runs, or "Auto-translated" + content if
  // the translation has already landed.
  ctx.note("switching to DE tab");
  await deToggle.click();
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("05-de-tab-after-en-save");

  // Wait up to ~25s for the auto-translation pipeline to land
  // content into BOTH the DE company description column AND
  // the DE product description column.
  const startWait = Date.now();
  let descLanded = false;
  let productLanded = false;
  while (Date.now() - startWait < 25000) {
    const deDescValue = await ctx.page
      .locator(
        'textarea[placeholder^="Unternehmensbeschreibung"]',
      )
      .first()
      .inputValue()
      .catch(() => "");
    const deProductDesc = await ctx.page
      .locator(
        'textarea[placeholder="Produktbeschreibung"]',
      )
      .first()
      .inputValue()
      .catch(() => "");
    descLanded = !!(deDescValue && deDescValue.trim().length > 0);
    productLanded = !!(deProductDesc
      && deProductDesc.trim().length > 0);
    if (descLanded && productLanded) {
      ctx.note(
        `DE landed after ${Date.now() - startWait}ms`
        + ` (descLen=${deDescValue.length},`
        + ` productLen=${deProductDesc.length})`,
      );
      break;
    }
    await ctx.page.waitForTimeout(1500);
  }
  await ctx.screenshot("06-de-after-translation-wait");

  if (!descLanded) {
    throw new Error(
      "DE company description did not auto-translate within 25s",
    );
  }
  if (!productLanded) {
    throw new Error(
      "DE product description did not auto-translate within 25s",
    );
  }

  // 4. AUTO-TRANSLATED badge should be visible (top-level —
  // page-level badge is sufficient per #524 out-of-scope).
  const badgeVisible = await ctx.page
    .locator("text=AUTO-TRANSLATED")
    .first()
    .isVisible()
    .catch(() => false);
  ctx.note(`AUTO-TRANSLATED badge visible: ${badgeVisible}`);
  if (!badgeVisible) {
    throw new Error(
      "Expected AUTO-TRANSLATED badge to be visible after"
      + " auto-translation landed",
    );
  }

  // 5. Edit DE product description manually and save.
  const MANUAL_DE_PRODUCT_DESC =
    "Manuell editierte deutsche Produktbeschreibung — sollte"
    + " nicht durch eine spätere englische Speicherung"
    + " überschrieben werden.";
  const deProductDescBox = ctx.page.locator(
    'textarea[placeholder="Produktbeschreibung"]',
  ).first();
  await deProductDescBox.waitFor({ timeout: 5000 });
  await deProductDescBox.fill(MANUAL_DE_PRODUCT_DESC);
  await ctx.screenshot("07-de-product-manually-edited");

  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector(
      '.Toastify__toast--success, [class*="toast"]',
      { timeout: 15000 },
    )
    .catch(() => {});
  await ctx.screenshot("08-de-product-saved");

  // 6. Re-save EN with new content. DE product description
  // must remain the manually-edited text (per-field CAS).
  await enToggle.click();
  await ctx.page.waitForTimeout(1000);

  const REVISED_EN_DESCRIPTION =
    "Bilingual products scenario (revised): a sustainable"
    + " solar manufacturer.";
  const REVISED_EN_PRODUCT_DESC =
    "Revised English product description for the per-item"
    + " CAS-protection check.";
  const enEdit2 = ctx.page.locator(
    'textarea[placeholder^="Company description"]',
  ).first();
  await enEdit2.fill(REVISED_EN_DESCRIPTION);
  const enProductDescBox = ctx.page.locator(
    'textarea[placeholder="Product description"]',
  ).first();
  await enProductDescBox.fill(REVISED_EN_PRODUCT_DESC);

  await ctx.page
    .locator('button:has-text("Save Changes")')
    .first()
    .click();
  await ctx.page
    .waitForSelector(
      '.Toastify__toast--success, [class*="toast"]',
      { timeout: 15000 },
    )
    .catch(() => {});
  // Give the async translator a beat to (incorrectly) attempt
  // a write — it should be skipped by the per-field CAS check.
  await ctx.page.waitForTimeout(8000);
  await ctx.screenshot("09-en-resaved");

  await deToggle.click();
  await ctx.page.waitForTimeout(1500);
  const finalDeProductDesc = await ctx.page
    .locator(
      'textarea[placeholder="Produktbeschreibung"]',
    )
    .first()
    .inputValue()
    .catch(() => "");
  ctx.note(
    `DE product desc after EN re-save:`
    + ` "${finalDeProductDesc.slice(0, 80)}"`,
  );
  await ctx.screenshot("10-de-product-after-en-resave");
  if (!finalDeProductDesc.includes(
    "Manuell editierte deutsche Produktbeschreibung",
  )) {
    throw new Error(
      "DE product description was overwritten by EN re-save"
      + " even though DE was user-owned (per-item auto flag"
      + " should have prevented this).",
    );
  }

  // 7. Public-read fallback chain: ?language=de should render
  // DE product content; default (en) should render EN.
  ctx.note("verifying public read fallback chain");
  const deRead = await ctx.page
    .request
    .get(
      `${ctx.baseUrl}/api/v1/public/companies/${COMPANY_ID}/profile`
      + `?language=de`,
    );
  const deBody = await deRead.json().catch(() => ({}));
  const deItems =
    deBody?.core_products_services?.items || [];
  const deFirstDesc = (deItems[0]?.description || "");
  ctx.note(
    `public DE first product desc: "${deFirstDesc.slice(0, 80)}"`,
  );
  if (!deFirstDesc.includes(
    "Manuell editierte deutsche Produktbeschreibung",
  )) {
    throw new Error(
      "Public ?language=de did not return the user-owned DE"
      + " product description",
    );
  }

  const enRead = await ctx.page
    .request
    .get(
      `${ctx.baseUrl}/api/v1/public/companies/${COMPANY_ID}/profile`
      + `?language=en`,
    );
  const enBody = await enRead.json().catch(() => ({}));
  const enItems =
    enBody?.core_products_services?.items || [];
  const enFirstDesc = (enItems[0]?.description || "");
  ctx.note(
    `public EN first product desc: "${enFirstDesc.slice(0, 80)}"`,
  );
  if (!enFirstDesc.includes(
    "Revised English product description",
  )) {
    throw new Error(
      "Public ?language=en did not return the revised EN"
      + " product description",
    );
  }

  ctx.note("bilingual product items scenario complete");
};

export default scenario;
