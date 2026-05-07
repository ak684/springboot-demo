/**
 * Bundle scenario covering #495 + #501 + #511.
 *
 *   #495: Section-level hide control switched from VisibilityOffOutlined
 *         icon button to an MUI Switch ("Section visible" / "Section
 *         hidden"). Per-item eye icon stays.
 *   #501: The three href="#" placeholder links on CompanyOverviewV2
 *         (Portfolio Highlight "View details", "View ESG report", cert
 *         link) — bind to real extracted URLs (esg_report_link,
 *         certification_link, prize_award_link_*) with target="_blank";
 *         suppress link / containing card entirely when URL absent.
 *   #511: CompanyPublicProfileCard header treatment reconciled between
 *         /manage-public-profile and /portfolios — same h4 + subtitle, no
 *         gradient.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-editor-polish-bundle
 */
import type { ScenarioFn } from "../scenario.ts";

type ProfileLite = {
  id: number;
  esg_impact_report?: boolean;
  esg_report_link?: string | null;
  certification_link?: string | null;
  prize_award_link_1?: string | null;
  prize_award_link_2?: string | null;
};

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in (default user — superadmin or hybrid)");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("01-post-login");

  // ── #495 + #501 (editor) ───────────────────────────────────────────────
  ctx.note("opening editor for company 5");
  await ctx.page.goto(`${ctx.baseUrl}/company/5/edit-public-profile`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot("02-editor-loaded");

  // #495 — the section-level toggle is now an MUI Switch (input[role=switch])
  // rather than the old icon button.
  const oldIconToggleCount = await ctx.page
    .locator('button[aria-label="toggle-section-visibility"]')
    .count();
  ctx.note(`legacy icon toggle count (expect 0): ${oldIconToggleCount}`);
  if (oldIconToggleCount > 0) {
    throw new Error("Legacy icon-button section toggle still present; expected MUI Switch");
  }

  const sectionSwitches = ctx.page.locator('.MuiSwitch-root input[aria-label="toggle-section-visibility"]');
  const switchCount = await sectionSwitches.count();
  ctx.note(`section switches on page: ${switchCount}`);
  if (switchCount < 5) {
    await ctx.dumpInteractables({ limit: 40 });
    throw new Error(
      `Expected >=5 section toggle Switches (one per section), got ${switchCount}`,
    );
  }

  // Per-item eye icon must still exist (regression guard for #495 — only
  // section toggle changed).
  const itemHideCount = await ctx.page.locator('button[aria-label="hide"]').count();
  ctx.note(`per-item hide icon buttons (expect >0): ${itemHideCount}`);
  if (itemHideCount < 1) {
    throw new Error("Per-item hide eye icon should still exist on items");
  }

  // Switch label: should read "Section visible" or "Section hidden" near it.
  const labelHits = await ctx.page
    .locator('text=/Section (visible|hidden)/i')
    .count();
  ctx.note(`Section visible/hidden label occurrences: ${labelHits}`);
  if (labelHits < 5) {
    throw new Error(`Expected >=5 "Section visible/hidden" labels, got ${labelHits}`);
  }

  // Persistence regression: flip the LAST section switch, save, reload,
  // confirm the section is dimmed.
  const lastSwitch = sectionSwitches.last();
  const wasOnBefore = await lastSwitch.isChecked();
  ctx.note(`last switch state before toggle: ${wasOnBefore}`);
  await lastSwitch.click({ force: true, timeout: 10000 });
  await ctx.page.waitForTimeout(400);
  await ctx.screenshot("03-section-toggled");

  const isOnAfter = await lastSwitch.isChecked();
  ctx.note(`last switch state after toggle: ${isOnAfter}`);
  if (isOnAfter === wasOnBefore) {
    throw new Error("Switch did not change state on click");
  }

  ctx.note("saving");
  const saveBtn = ctx.page.locator('button:has-text("Save Changes")').first();
  await saveBtn.click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', { timeout: 10000 })
    .catch(() => {});
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("04-after-save");

  ctx.note("reloading editor to verify persistence");
  await ctx.page.reload({ waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });
  await ctx.page.waitForTimeout(2000);
  const switchesAfterReload = ctx.page.locator(
    '.MuiSwitch-root input[aria-label="toggle-section-visibility"]',
  );
  const reloadedState = await switchesAfterReload.last().isChecked();
  ctx.note(`last switch state after reload: ${reloadedState}`);
  if (reloadedState !== isOnAfter) {
    throw new Error(
      `Section toggle state did not persist (after toggle=${isOnAfter}, after reload=${reloadedState})`,
    );
  }
  await ctx.screenshot("05-editor-reloaded-persisted");

  // Restore so subsequent runs start from a clean state.
  ctx.note("flipping back to clean up");
  await switchesAfterReload.last().click({ force: true, timeout: 10000 });
  await ctx.page.waitForTimeout(300);
  await ctx.page.locator('button:has-text("Save Changes")').first().click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', { timeout: 10000 })
    .catch(() => {});
  await ctx.page.waitForTimeout(800);

  // ── #501 (public view) ─────────────────────────────────────────────────
  ctx.note("scanning companies for one with extracted URLs and one without");
  type ScanResult = { withUrls?: number; withoutUrls?: number };
  const scan: ScanResult = await ctx.page.evaluate(async () => {
    const out: { withUrls?: number; withoutUrls?: number } = {};
    for (let id = 1; id <= 30 && (!out.withUrls || !out.withoutUrls); id += 1) {
      try {
        const r = await fetch(`/api/v1/public/companies/${id}/profile`);
        if (!r.ok) continue;
        const p = (await r.json()) as ProfileLite;
        const hasEsg = !!(p.esg_impact_report && p.esg_report_link);
        const hasAnyCertUrl = !!(
          p.certification_link
          || p.prize_award_link_1
          || p.prize_award_link_2
        );
        if ((hasEsg || hasAnyCertUrl) && !out.withUrls) out.withUrls = id;
        if (!hasEsg && !hasAnyCertUrl && !out.withoutUrls) out.withoutUrls = id;
      } catch { /* ignore */ }
    }
    return out;
  });
  ctx.note(`scan result: ${JSON.stringify(scan)}`);

  const assertNoPlaceholderHrefs = async () => {
    const placeholderHrefCount = await ctx.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
      return anchors.filter((a) => {
        const h = a.getAttribute("href");
        return h === "#" || h === "" || h?.trim() === "#";
      }).length;
    });
    ctx.note(`placeholder href="#" count (expect 0): ${placeholderHrefCount}`);
    if (placeholderHrefCount > 0) {
      throw new Error(
        `Found ${placeholderHrefCount} placeholder href="#" anchor(s) — should have been wired or suppressed`,
      );
    }
  };

  if (scan.withUrls != null) {
    ctx.note(`opening public view for company ${scan.withUrls} (has URLs)`);
    await ctx.page.goto(`${ctx.baseUrl}/company-overview/${scan.withUrls}`, {
      waitUntil: "domcontentloaded",
    });
    await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await ctx.page.waitForTimeout(1500);
    await ctx.screenshot("06-public-view-top");

    await assertNoPlaceholderHrefs();

    // ESG link, when present, must be a real URL with target=_blank + safe rel.
    const esgLink = ctx.page.locator('a:has-text("View ESG report")').first();
    const esgExists = (await esgLink.count()) > 0;
    if (esgExists) {
      const esgHref = await esgLink.getAttribute("href");
      const esgTarget = await esgLink.getAttribute("target");
      const esgRel = await esgLink.getAttribute("rel");
      ctx.note(`ESG link: href=${esgHref} target=${esgTarget} rel=${esgRel}`);
      if (!esgHref || esgHref === "#" || !/^https?:\/\//i.test(esgHref)) {
        throw new Error(`ESG link href is not a real URL: ${esgHref}`);
      }
      if (esgTarget !== "_blank") {
        throw new Error(`ESG link should target=_blank, got: ${esgTarget}`);
      }
      if (!/noopener/i.test(esgRel || "") || !/noreferrer/i.test(esgRel || "")) {
        throw new Error(`ESG link rel should include noopener+noreferrer, got: ${esgRel}`);
      }
      await esgLink.scrollIntoViewIfNeeded().catch(() => {});
      await ctx.page.waitForTimeout(400);
      await ctx.screenshot("07-public-esg-card-with-real-link");
    } else {
      ctx.note("no ESG link rendered for this company (no esg_report_link)");
    }

    // Cert links — those that render must be real and target=_blank.
    const certLinks = ctx.page.locator('a:has-text("View certificate"), a:has-text("View award")');
    const certCount = await certLinks.count();
    ctx.note(`cert/award links rendered: ${certCount}`);
    for (let i = 0; i < certCount; i += 1) {
      const link = certLinks.nth(i);
      const href = await link.getAttribute("href");
      const target = await link.getAttribute("target");
      const rel = await link.getAttribute("rel");
      ctx.note(`cert link[${i}]: href=${href} target=${target} rel=${rel}`);
      if (!href || href === "#" || !/^https?:\/\//i.test(href)) {
        throw new Error(`Cert link href is not a real URL: ${href}`);
      }
      if (target !== "_blank") {
        throw new Error(`Cert link should target=_blank, got: ${target}`);
      }
      if (!/noopener/i.test(rel || "") || !/noreferrer/i.test(rel || "")) {
        throw new Error(`Cert link rel should include noopener+noreferrer, got: ${rel}`);
      }
    }
    if (certCount > 0) {
      const certSectionTitle = ctx.page
        .locator('text="Sustainability certifications and awards"')
        .first();
      await certSectionTitle.scrollIntoViewIfNeeded().catch(() => {});
      await ctx.page.waitForTimeout(400);
      await ctx.screenshot("08-public-cert-section-with-real-links");
    }

    // The Portfolio Highlight stub card was dropped — its "View details"
    // text should not appear on the public view.
    const viewDetailsHits = await ctx.page.locator('text="View details"').count();
    ctx.note(`"View details" occurrences (expect 0): ${viewDetailsHits}`);
    if (viewDetailsHits > 0) {
      throw new Error(
        `"View details" still rendered on public view — Portfolio Highlight stub should be suppressed`,
      );
    }
  } else {
    ctx.note("no company with extracted URLs found via API scan; skipping with-URL assertions");
  }

  if (scan.withoutUrls != null) {
    ctx.note(`opening public view for company ${scan.withoutUrls} (no URLs)`);
    await ctx.page.goto(`${ctx.baseUrl}/company-overview/${scan.withoutUrls}`, {
      waitUntil: "domcontentloaded",
    });
    await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await ctx.page.waitForTimeout(1500);

    // Scroll to the "Reports" section title so the suppressed-card area
    // is visible in the proof screenshot.
    const reportsTitle = ctx.page.locator('text="Reports"').first();
    await reportsTitle.scrollIntoViewIfNeeded().catch(() => {});
    await ctx.page.waitForTimeout(300);
    await ctx.screenshot("09-public-view-no-urls-reports-area");

    await assertNoPlaceholderHrefs();

    const esgCount = await ctx.page.locator('a:has-text("View ESG report")').count();
    ctx.note(`ESG link count for no-URL company (expect 0): ${esgCount}`);
    if (esgCount > 0) {
      throw new Error("ESG link rendered for company without esg_report_link — should be suppressed");
    }
  } else {
    ctx.note("no company without URLs found via API scan; skipping no-URL assertions");
  }

  // ── #511 (CompanyPublicProfileCard surfaces) ───────────────────────────
  ctx.note("checking /portfolios surface");
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(1000);
  await ctx.screenshot("10-portfolios-page-top");

  const portfoliosPubAccessLabel = await ctx.page
    .locator('text="Public Profile Access"')
    .count();
  ctx.note(`/portfolios "Public Profile Access" header count: ${portfoliosPubAccessLabel}`);
  if (portfoliosPubAccessLabel > 0) {
    const sectionHeader = ctx.page
      .locator('text="Public Profile Access"').first();
    await sectionHeader.scrollIntoViewIfNeeded().catch(() => {});
    await ctx.page.waitForTimeout(400);
    await ctx.screenshot("11-portfolios-public-profile-access-section");
  } else {
    ctx.note("default user has no PUBLIC_PROFILE_ONLY grants; section not rendered on /portfolios — captured top of page only");
  }

  ctx.note("checking /manage-public-profile surface");
  await ctx.page.goto(`${ctx.baseUrl}/manage-public-profile`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.page.waitForTimeout(800);
  await ctx.screenshot("12-manage-public-profile-page");

  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', { timeout: 10000 });

  // Header must be a Typography variant=h4 with the same text used on
  // /portfolios.
  const mppHeaderHits = await ctx.page.locator('text="Public Profile Access"').count();
  ctx.note(`/manage-public-profile "Public Profile Access" header count: ${mppHeaderHits}`);
  if (mppHeaderHits < 1) {
    throw new Error('/manage-public-profile is missing "Public Profile Access" header');
  }

  // Subtitle must be present (#511 reconciliation).
  const subtitleHits = await ctx.page
    .locator('text="Companies you can edit the public profile of."')
    .count();
  ctx.note(`subtitle occurrences on /manage-public-profile (expect >=1): ${subtitleHits}`);
  if (subtitleHits < 1) {
    throw new Error("/manage-public-profile is missing the reconciled subtitle");
  }

  // Gradient must be gone — read computed background of the page wrapper
  // and ensure it does not contain a gradient image.
  const mppBackground = await ctx.page.evaluate(() => {
    const el = document.querySelector('[data-testid="manage-public-profile-page"]') as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { backgroundImage: cs.backgroundImage, background: cs.background };
  });
  ctx.note(`/manage-public-profile background: ${JSON.stringify(mppBackground)}`);
  if (
    mppBackground
    && /gradient/i.test(mppBackground.backgroundImage)
  ) {
    throw new Error(
      `Gradient still present on /manage-public-profile (#511): ${mppBackground.backgroundImage}`,
    );
  }

  // ── #511 (real CompanyPublicProfileCard contexts) ──────────────────────
  // The default test user has no PUBLIC_PROFILE_ONLY grants, so the cards
  // never render in #10. Seed a founder-only user and a hybrid user via
  // the public /auth/register + alona-authenticated /ventures/invite
  // endpoints, then log in as each to screenshot the actual surfaces.
  ctx.note("seeding founder + hybrid test users for the two card surfaces");
  const tag = Date.now();
  const founderEmail = `founder-uiverify-${tag}@example.com`;
  const hybridEmail = `hybrid-uiverify-${tag}@example.com`;
  const seedPassword = "Password123!";

  const registerResult = await ctx.page.evaluate(async (args: {
    founderEmail: string; hybridEmail: string; password: string;
  }) => {
    const reg = (email: string, name: string, lastName: string) => fetch(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, lastName, password: args.password }),
      },
    ).then((r) => r.status);
    return {
      f: await reg(args.founderEmail, "Founder", "Uiverify"),
      h: await reg(args.hybridEmail, "Hybrid", "Uiverify"),
    };
  }, { founderEmail, hybridEmail, password: seedPassword });
  ctx.note(`register status: founder=${registerResult.f} hybrid=${registerResult.h}`);

  // Re-establish alona's session — /register flips the active session to
  // the hybrid user (the last-registered).
  await ctx.context.clearCookies();
  await ctx.page.evaluate(() => localStorage.clear());
  await ctx.login(ctx.args.email, ctx.args.password);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const adminToken = await ctx.page.evaluate(() => localStorage.getItem("token"));
  if (!adminToken) {
    throw new Error("could not read admin auth token from localStorage after re-login");
  }

  const grantResult = await ctx.page.evaluate(async (args: {
    token: string; founderEmail: string; hybridEmail: string;
  }) => {
    // The frontend stores the FULL Authorization header value
    // ("Bearer eyJ...") in localStorage, so reuse it as-is — do NOT prepend
    // another "Bearer " or the server will 401 the doubled prefix.
    const invite = (body: unknown) => fetch("/api/v1/ventures/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: args.token,
      },
      body: JSON.stringify(body),
    }).then((r) => r.status);
    return {
      f: await invite({
        email: args.founderEmail,
        name: "Founder",
        lastName: "Uiverify",
        ventures: [], portfolios: [],
        companies: [{ companyId: 11, access: "PUBLIC_PROFILE_ONLY" }],
      }),
      h: await invite({
        email: args.hybridEmail,
        name: "Hybrid",
        lastName: "Uiverify",
        ventures: [],
        portfolios: [{ portfolio: { id: 1 }, access: "EDIT" }],
        companies: [{ companyId: 16, access: "PUBLIC_PROFILE_ONLY" }],
      }),
    };
  }, { token: adminToken, founderEmail, hybridEmail });
  ctx.note(`invite status: founder=${grantResult.f} hybrid=${grantResult.h}`);
  if (grantResult.f >= 400 || grantResult.h >= 400) {
    throw new Error(
      `invite grant failed: founder=${grantResult.f} hybrid=${grantResult.h}`,
    );
  }

  // 11: Founder-only (PUBLIC_PROFILE_ONLY) user lands on /manage-public-profile
  // and sees a real CompanyPublicProfileCard rendered with the reconciled
  // header + subtitle + no gradient.
  ctx.note("logging in as founder-only user");
  await ctx.context.clearCookies();
  await ctx.page.evaluate(() => localStorage.clear());
  await ctx.login(founderEmail, seedPassword);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.page
    .waitForURL(/\/manage-public-profile/, { timeout: 15000 })
    .catch(() => {});
  await ctx.waitForSelector('[data-testid="manage-public-profile-page"]', {
    timeout: 15000,
  });
  await ctx.page.waitForTimeout(800);
  await ctx.screenshot("13-founder-only-manage-public-profile-with-card");

  const founderCardCount = await ctx.page
    .locator('[data-testid^="company-public-profile-card-"]').count();
  ctx.note(`founder card count: ${founderCardCount}`);
  if (founderCardCount < 1) {
    throw new Error("Founder-only user should see >=1 CompanyPublicProfileCard");
  }

  // 12: Hybrid user — both portfolio access and PUBLIC_PROFILE_ONLY access.
  // /portfolios should render the portfolios grid AND the "Public Profile
  // Access" section with a card below it.
  ctx.note("logging in as hybrid user");
  await ctx.context.clearCookies();
  await ctx.page.evaluate(() => localStorage.clear());
  await ctx.login(hybridEmail, seedPassword);
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.waitForSelector('text="Portfolios"', { timeout: 15000 });
  await ctx.waitForSelector('text="Public Profile Access"', { timeout: 15000 });
  const ppaHeader = ctx.page.locator('text="Public Profile Access"').first();
  await ppaHeader.scrollIntoViewIfNeeded();
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("14-hybrid-portfolios-with-public-profile-access");

  const hybridCardCount = await ctx.page
    .locator('[data-testid^="company-public-profile-card-"]').count();
  ctx.note(`hybrid card count on /portfolios: ${hybridCardCount}`);
  if (hybridCardCount < 1) {
    throw new Error("Hybrid user should see >=1 CompanyPublicProfileCard on /portfolios");
  }

  ctx.note("wista-editor-polish-bundle scenario complete");
};

export default scenario;
