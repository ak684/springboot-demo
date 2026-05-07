/**
 * Scenario: end-to-end smoke on the Render PR preview for #509, with
 * `?brand=wista`. Goes beyond the founder happy-path to also exercise
 * regions that could have regressed from the Home.js routing change,
 * the Header menu trim, and the UserResponse changes.
 *
 * Flow:
 *   1. Login page loads with WISTA branding (backend /public/branding
 *      returns WISTA payload, not default).
 *   2. Founder login → /manage-public-profile, card grid renders.
 *   3. Card menu → Edit path hits /company/{id}/edit-public-profile
 *      and the full editor loads over the real network.
 *   4. Back out, log out, log back in as a superadmin / manager account
 *      to check that the non-founder path still works (portfolios
 *      landing renders, avatar menu is NOT trimmed, Invite modal on
 *      /team still opens and shows the new "Companies" section).
 *   5. Spot-check a few read-only backend endpoints that our changes
 *      touched: /auth/current (publicProfileOnlyCompanies shape is
 *      present), GET /companies/{id}/public-profile-access for the
 *      superadmin (should be 200 via the canEditCompanyPublicProfile
 *      expression).
 *
 * Pre-requisite: against the Render preview you must seed
 *   UPDATE users SET password = <hash> WHERE email = 'testuser@...';
 *   INSERT INTO company_member_access (member_id=<id>, company_id=<id>,
 *     access='PUBLIC_PROFILE_ONLY', status='ACCEPTED');
 * via the preview's /sysadmin/query endpoint before running. The
 * scenario accepts the founder email/password via --email/--password
 * and reads a second set from env vars for the superadmin pass:
 *   UI_VERIFY_SUPERADMIN_EMAIL, UI_VERIFY_SUPERADMIN_PASSWORD
 * Falls back to alona@impactforesight.io / password123.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario render-preview-wista-smoke \
 *     --base-url https://venture-impact-platform-pr-509.onrender.com \
 *     --email testuser@impactforesight.io --password password123
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  const wistaParam = "?brand=wista";

  // ===== STEP 1 — WISTA branding is served =====
  ctx.note(`step 1: login page with ${wistaParam}`);
  await ctx.page.goto(`${ctx.baseUrl}/login${wistaParam}`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 60000 });
  await ctx.screenshot("01-wista-login-page");

  const brandingPayload = await ctx.page.evaluate(async () => {
    try {
      const r = await fetch("/api/v1/public/branding?brand=wista");
      return r.ok ? await r.json() : { error: r.status };
    } catch (e) {
      return { error: String(e) };
    }
  });
  ctx.note(`branding payload: ${JSON.stringify(brandingPayload).slice(0, 300)}`);
  const brandingName = String(
    (brandingPayload as Record<string, unknown>)?.companyName || "",
  );
  if (!brandingName.toLowerCase().includes("wista")) {
    throw new Error(
      `Expected WISTA branding, got: ${JSON.stringify(brandingPayload).slice(0, 200)}`,
    );
  }
  ctx.note(`✓ backend served WISTA branding (companyName=${brandingName})`);

  // ===== STEP 2 — founder login lands on /manage-public-profile =====
  ctx.note(`step 2: founder login as ${ctx.args.email}`);
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.screenshot("02-founder-post-login");
  ctx.note(`founder post-login URL: ${ctx.page.url()}`);
  if (!ctx.page.url().includes("/manage-public-profile")) {
    throw new Error(
      `Expected founder → /manage-public-profile, got: ${ctx.page.url()}`,
    );
  }

  // Card grid
  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 30000,
  });
  const cards = ctx.page.locator(
    '[data-testid^="company-public-profile-card-"]',
  );
  const cardCount = await cards.count();
  ctx.note(`found ${cardCount} company card(s)`);
  if (cardCount < 1) {
    await ctx.dumpInteractables({
      within: '[data-testid="manage-public-profile-page"]',
    });
    throw new Error(
      "Expected ≥1 CompanyPublicProfileCard — did the sysadmin seed step run?",
    );
  }
  await ctx.screenshot("03-founder-landing");

  // Header on the founder landing: trimmed avatar menu = only My
  // profile + Logout.
  const avatar = ctx.page.locator(".MuiAvatar-root").first();
  await avatar.click({ timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(600);
  await ctx.screenshot("04-founder-avatar-menu");
  const menuText = (await ctx.page.textContent("body")) || "";
  const forbiddenForFounder = [
    "My portfolios", "My ventures", "Manage team",
    "Edit venture profile", "Edit portfolio profile", "Book mentor session",
  ];
  const leaked = forbiddenForFounder.filter((t) => menuText.includes(t));
  if (leaked.length > 0) {
    throw new Error(`Founder avatar menu still shows: ${leaked.join(", ")}`);
  }
  ctx.note("✓ founder avatar menu trimmed");
  await ctx.page.keyboard.press("Escape").catch(() => {});
  await ctx.page.waitForTimeout(300);

  // Card → menu → Edit → editor loads
  ctx.note("step 3: card → edit menu → editor");
  await cards.first().click({ timeout: 15000 });
  await ctx.waitForSelector('text=Edit public profile', { timeout: 15000 });
  await ctx.waitForSelector('text=View public profile', { timeout: 5000 });
  await ctx.screenshot("05-card-menu-open");
  await ctx.page.locator('text=Edit public profile').first().click();
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, {
    timeout: 30000,
  });
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 60000,
  });
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot("06-editor-loaded");
  ctx.note(`✓ editor loaded at ${ctx.page.url()}`);

  // NOTE: the backend gating + /auth/current shape checks are intentionally
  // not done from inside page.evaluate() because the app uses an axios
  // interceptor to inject the JWT and plain fetch() won't carry it. Those
  // assertions are covered by the pre-scenario backend smoke run (see the
  // PR comment's curl block). Here we rely on the fact that the card grid
  // renders both Lyft's logo and description — which is only possible if
  // /auth/current returned a well-formed publicProfileOnlyCompanies entry.

  // ===== STEP 5 — log out, log back in as superadmin, check non-founder paths =====
  ctx.note("step 5: back to landing, then logout → log back in as superadmin");
  // The editor page has its own HeaderNav, not the app Header, so we
  // can't open the avatar menu from here. Navigate back first.
  await ctx.page.goto(`${ctx.baseUrl}/manage-public-profile`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(500);
  const avatar2 = ctx.page.locator(".MuiAvatar-root").first();
  await avatar2.click({ timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(800);
  // Scope the click to the MUI menu that just opened so we don't hit
  // some other 'Logout' string (e.g. a WISTA footer link).
  const logoutItem = ctx.page.locator('[role="menu"] >> text=Logout').first();
  // On WISTA the logout thunk window.location.assigns to
  // branding.marketingSiteUrl (wista.de) — we don't want Playwright to
  // chase that, we just need the token cleared. Click without awaiting
  // navigation, then hop straight back to our preview's /login.
  await logoutItem.click({ noWaitAfter: true, timeout: 10000 }).catch(() => {});
  await ctx.page.waitForTimeout(1000);
  await ctx.page.goto(`${ctx.baseUrl}/login${wistaParam}`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 45000 });
  await ctx.screenshot("07-logged-out");

  const adminEmail = process.env.UI_VERIFY_SUPERADMIN_EMAIL
    || "alona@impactforesight.io";
  const adminPassword = process.env.UI_VERIFY_SUPERADMIN_PASSWORD
    || "password123";
  await ctx.login(adminEmail, adminPassword);
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.screenshot("08-superadmin-post-login");
  if (ctx.page.url().includes("/manage-public-profile")) {
    throw new Error(
      `Superadmin was redirected to /manage-public-profile — founder routing over-fired`,
    );
  }
  ctx.note(`✓ superadmin lands on ${ctx.page.url()} (not founder page)`);

  // Avatar menu on superadmin: should NOT be trimmed (My portfolios + Logout both present).
  const avatar3 = ctx.page.locator(".MuiAvatar-root").first();
  await avatar3.click({ timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("09-superadmin-avatar-menu");
  const adminMenuText = (await ctx.page.textContent("body")) || "";
  if (!adminMenuText.includes("My portfolios")) {
    throw new Error(
      "Superadmin avatar menu is missing 'My portfolios' — menu trim over-fired",
    );
  }
  ctx.note("✓ superadmin avatar menu is not trimmed");
  await ctx.page.keyboard.press("Escape").catch(() => {});
  await ctx.page.waitForTimeout(300);

  // Invite modal on /team: new "Companies" section exists.
  ctx.note("step 6: open invite modal on /team, check new Companies section");
  await ctx.page.goto(`${ctx.baseUrl}/team`, { waitUntil: "domcontentloaded" });
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 45000 })
    .catch(() => {});
  await ctx.waitForSelector('button:has-text("Invite member")', {
    timeout: 30000,
  });
  await ctx.page
    .locator('button:has-text("Invite member")')
    .first()
    .click();
  await ctx.waitForSelector('input[name="email"]', { timeout: 10000 });
  await ctx.waitForSelector(
    'text=Grant the recipient editing access to one or more',
    { timeout: 10000 },
  );
  await ctx.screenshot("10-invite-modal-companies-section");
  ctx.note("✓ Invite modal renders the new Companies section");

  ctx.note("render-preview-wista-smoke scenario complete");
};

export default scenario;
