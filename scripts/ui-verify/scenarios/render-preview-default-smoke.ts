/**
 * Scenario: sanity-check the #509 changes against the DEFAULT
 * (non-WISTA) brand on the Render PR preview.
 *
 * Exists because the WISTA scenario caught a routing regression that
 * only fired under the WISTA `needsPortfoliosForRouting` code path —
 * which is exactly the kind of hidden asymmetry we want to catch on
 * the default brand too. This scenario verifies that the non-
 * whitelabel app behaves the same way as before our changes.
 *
 * Covers:
 *   1. Branding payload returns the DEFAULT brand (not WISTA).
 *   2. Founder-only user still correctly routes to /manage-public-profile.
 *   3. Superadmin/manager login does NOT get sent to the founder page.
 *   4. Superadmin avatar menu is NOT trimmed.
 *   5. /team still renders the Invite modal with the new "Companies"
 *      section.
 *
 * No `?brand=wista` param anywhere — the preview serves the default
 * brand by default.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario render-preview-default-smoke \
 *     --base-url https://venture-impact-platform-pr-509.onrender.com \
 *     --email testuser@impactforesight.io --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  // ===== STEP 1 — default brand is served =====
  ctx.note("step 1: default brand on /login (no brand override)");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 60000 });
  await ctx.screenshot("01-default-login-page");

  const brandingPayload = await ctx.page.evaluate(async () => {
    try {
      const r = await fetch("/api/v1/public/branding");
      return r.ok ? await r.json() : { error: r.status };
    } catch (e) {
      return { error: String(e) };
    }
  });
  ctx.note(`default branding payload: ${JSON.stringify(brandingPayload).slice(0, 300)}`);
  const brandingName = String(
    (brandingPayload as Record<string, unknown>)?.companyName || "",
  );
  if (brandingName.toLowerCase().includes("wista")) {
    throw new Error(
      `Default branding should NOT be WISTA; got companyName=${brandingName}`,
    );
  }
  ctx.note(`✓ default brand served (companyName=${brandingName})`);

  // ===== STEP 2 — founder-only user still routes to /manage-public-profile =====
  ctx.note(`step 2: founder login on default brand as ${ctx.args.email}`);
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.screenshot("02-founder-post-login");
  ctx.note(`founder URL: ${ctx.page.url()}`);
  if (!ctx.page.url().includes("/manage-public-profile")) {
    throw new Error(
      `Expected founder → /manage-public-profile on default brand; got: ${ctx.page.url()}`,
    );
  }

  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 30000,
  });
  const cards = ctx.page.locator(
    '[data-testid^="company-public-profile-card-"]',
  );
  const cardCount = await cards.count();
  if (cardCount < 1) {
    throw new Error("Expected ≥1 CompanyPublicProfileCard on default brand");
  }
  ctx.note(`✓ founder on default brand sees ${cardCount} card(s)`);
  await ctx.screenshot("03-founder-landing-default");

  // Trimmed avatar menu sanity check on default brand.
  const avatar = ctx.page.locator(".MuiAvatar-root").first();
  await avatar.click({ timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("04-founder-menu-default");
  const menuText = (await ctx.page.textContent("body")) || "";
  const leaked = [
    "My portfolios", "My ventures", "Manage team",
    "Edit venture profile", "Edit portfolio profile", "Book mentor session",
  ].filter((t) => menuText.includes(t));
  if (leaked.length > 0) {
    throw new Error(
      `Default-brand founder menu still shows: ${leaked.join(", ")}`,
    );
  }
  ctx.note("✓ founder menu trimmed on default brand");
  await ctx.page.keyboard.press("Escape").catch(() => {});
  await ctx.page.waitForTimeout(300);

  // ===== STEP 3 — logout, log in as superadmin/manager, no founder redirect =====
  ctx.note("step 3: logout + log back in as superadmin");
  // We're already on /manage-public-profile here (the scenario didn't
  // navigate to the editor in STEP 2), so the app Header avatar is
  // directly reachable.
  await ctx.page.locator(".MuiAvatar-root").first().click({ timeout: 15000 });
  await ctx.page.waitForTimeout(800);
  // logout thunk navigates to branding.marketingSiteUrl (external), so
  // just fire the click and hop back to /login manually.
  await ctx.page
    .locator('[role="menu"] >> text=Logout')
    .first()
    .click({ noWaitAfter: true, timeout: 10000 })
    .catch(() => {});
  await ctx.page.waitForTimeout(1000);
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 45000 });
  await ctx.screenshot("05-logged-out-default");

  const adminEmail = process.env.UI_VERIFY_SUPERADMIN_EMAIL
    || "alona@impactforesight.io";
  const adminPassword = process.env.UI_VERIFY_SUPERADMIN_PASSWORD
    || "password123";
  await ctx.login(adminEmail, adminPassword);
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.screenshot("06-superadmin-post-login-default");
  ctx.note(`superadmin URL: ${ctx.page.url()}`);
  if (ctx.page.url().includes("/manage-public-profile")) {
    throw new Error(
      `Superadmin was redirected to /manage-public-profile on default brand`,
    );
  }
  ctx.note("✓ superadmin NOT redirected to founder page");

  // Avatar menu on superadmin should NOT be trimmed (My portfolios shown).
  await ctx.page.locator(".MuiAvatar-root").first().click({ timeout: 15000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("07-superadmin-menu-default");
  const adminMenuText = (await ctx.page.textContent("body")) || "";
  if (!adminMenuText.includes("My portfolios")) {
    throw new Error(
      "Superadmin avatar menu is missing 'My portfolios' on default brand",
    );
  }
  ctx.note("✓ superadmin menu not trimmed");
  await ctx.page.keyboard.press("Escape").catch(() => {});
  await ctx.page.waitForTimeout(300);

  // ===== STEP 4 — /team invite modal still has Companies section =====
  ctx.note("step 4: /team invite modal on default brand");
  await ctx.page.goto(`${ctx.baseUrl}/team`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("Invite member")', { timeout: 30000 });
  await ctx.page.locator('button:has-text("Invite member")').first().click();
  await ctx.waitForSelector('input[name="email"]', { timeout: 10000 });
  await ctx.waitForSelector(
    'text=Grant the recipient editing access to one or more',
    { timeout: 10000 },
  );
  await ctx.screenshot("08-invite-modal-default");
  ctx.note("✓ Invite modal's Companies section renders on default brand");

  ctx.note("render-preview-default-smoke scenario complete");
};

export default scenario;
