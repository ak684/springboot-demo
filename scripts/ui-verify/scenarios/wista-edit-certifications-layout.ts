/**
 * Verifies the company public profile edit page has proper section titles
 * (matching the public read-only view) and that the certification card has
 * comfortable vertical padding.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-edit-certifications-layout
 */
import type { ScenarioFn } from "../scenario.ts";

const REQUIRED_TITLES = [
  "What we do",
  "Recent news",
  "How we contribute to a better world",
  "Sustainability certifications and awards",
  "How to interact with us",
];

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  await ctx.page.goto(`${ctx.baseUrl}/portfolios/1/company-url-extractor`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  const sidebarItems = ctx.page.locator(".MuiListItemButton-root");
  await sidebarItems.nth(4).click({ timeout: 10000 });
  await ctx.waitForSelector("table tbody tr", { timeout: 30000 });

  const firstRow = ctx.page.locator("table tbody tr").first();
  const tableContainer = ctx.page.locator(".MuiTableContainer-root").first();
  await tableContainer.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await ctx.page.waitForTimeout(400);

  const editBtn = firstRow.locator('span:has-text("Edit")').first();
  await editBtn.click({ timeout: 10000 });
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, { timeout: 15000 });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });
  await ctx.page.waitForTimeout(1500);

  // 1. Each section title from the public view must be present in edit mode.
  for (const title of REQUIRED_TITLES) {
    const count = await ctx.page.locator(`text="${title}"`).count();
    ctx.note(`title "${title}" occurrences: ${count}`);
    if (count < 1) {
      throw new Error(`section title missing in edit mode: "${title}"`);
    }
  }

  // 2. Scroll to the certifications section and screenshot it.
  const certTitle = ctx.page
    .locator('text="Sustainability certifications and awards"')
    .first();
  await certTitle.scrollIntoViewIfNeeded().catch(() => {});
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("01-certifications-with-title");

  // 3. Card vertical padding regression check. Start from the cert section
  // title, walk up to the section container, then find a grid whose first
  // card has substantial padding (= our CertificationCard).
  const metrics = await ctx.page.evaluate(() => {
    const titleEl = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .find((el) => el.textContent?.trim() === 'Sustainability certifications and awards');
    if (!titleEl) return { found: false as const };
    let node: HTMLElement | null = titleEl;
    while (node) {
      const grids = Array.from(node.querySelectorAll<HTMLElement>('div'))
        .filter((d) => getComputedStyle(d).display === 'grid');
      for (const g of grids) {
        const first = g.firstElementChild?.firstElementChild as HTMLElement | null;
        if (!first) continue;
        const cs = getComputedStyle(first);
        if (parseFloat(cs.paddingTop) >= 32 && parseFloat(cs.paddingBottom) >= 32) {
          const r = first.getBoundingClientRect();
          return {
            found: true as const,
            cardWidth: r.width,
            cardHeight: r.height,
            paddingTop: parseFloat(cs.paddingTop),
            paddingBottom: parseFloat(cs.paddingBottom),
          };
        }
      }
      node = node.parentElement;
    }
    return { found: false as const };
  });

  ctx.note(`cert card metrics: ${JSON.stringify(metrics)}`);
  if (!metrics.found) throw new Error("could not locate certifications grid");
  if (metrics.paddingTop < 40 || metrics.paddingBottom < 40) {
    throw new Error(
      `cert card vertical padding looks cramped: top=${metrics.paddingTop}px bottom=${metrics.paddingBottom}px`,
    );
  }
  if (metrics.cardHeight < 260) {
    throw new Error(`cert card height only ${metrics.cardHeight}px — expected >=260px`);
  }

  // 4. Walk down the page to capture section titles in context.
  for (const title of REQUIRED_TITLES) {
    const loc = ctx.page.locator(`text="${title}"`).first();
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await ctx.page.waitForTimeout(250);
    await ctx.screenshot(`section-${title.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // 5. "Coming soon" Add buttons should be gone.
  for (const label of ["Add Report", "Add Contributing Factor", "Add Certification"]) {
    const cnt = await ctx.page.locator(`button:has-text("${label}")`).count();
    ctx.note(`"${label}" button count (expect 0): ${cnt}`);
    if (cnt > 0) {
      throw new Error(`"${label}" button still present — should have been removed`);
    }
  }

  // 6. Section hide toggle: should be present for all SECTION_KEYS-backed
  // sections in edit mode. We count top-right section toggle buttons.
  const sectionToggleCount = await ctx.page
    .locator('button[aria-label="toggle-section-visibility"]')
    .count();
  ctx.note(`section-visibility toggles: ${sectionToggleCount}`);
  if (sectionToggleCount < 5) {
    throw new Error(
      `expected >=5 section-visibility toggles (one per section) but found ${sectionToggleCount}`,
    );
  }

  // 7. Click the Certifications section toggle and confirm the whole section
  // dims. The title + toggle live in a SectionTitleRow; walk up from there
  // to find the outer EditableSectionWrapper Box that has opacity applied.
  const clickRes = await ctx.page.evaluate(() => {
    const titleEl = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .find((el) => el.textContent?.trim() === 'Sustainability certifications and awards');
    if (!titleEl) return { ok: false as const, reason: 'title not found' };
    const row = titleEl.closest('div');
    const toggleBtn = row?.querySelector<HTMLElement>(
      'button[aria-label="toggle-section-visibility"]',
    );
    if (!toggleBtn) return { ok: false as const, reason: 'toggle not found' };
    toggleBtn.click();
    return { ok: true as const };
  });
  if (!clickRes.ok) throw new Error(`could not click cert toggle: ${clickRes.reason}`);
  await ctx.page.waitForTimeout(400);
  await ctx.screenshot("06-certifications-hidden");

  const dimmedOpacity = await ctx.page.evaluate(() => {
    const titleEl = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .find((el) => el.textContent?.trim() === 'Sustainability certifications and awards');
    if (!titleEl) return 1;
    // Walk up parents looking for the first ancestor with opacity < 1.
    let node: HTMLElement | null = titleEl;
    while (node) {
      const op = parseFloat(getComputedStyle(node).opacity);
      if (op < 1) return op;
      node = node.parentElement;
    }
    return 1;
  });
  ctx.note(`certifications section opacity after hide: ${dimmedOpacity}`);
  if (dimmedOpacity > 0.5) {
    throw new Error(
      `hiding certifications did not dim the section (opacity=${dimmedOpacity}, expected <=0.5)`,
    );
  }

  // Toggle back.
  await ctx.page.evaluate(() => {
    const titleEl = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .find((el) => el.textContent?.trim() === 'Sustainability certifications and awards');
    const row = titleEl?.closest('div');
    const btn = row?.querySelector<HTMLElement>('button[aria-label="toggle-section-visibility"]');
    btn?.click();
  });
  await ctx.page.waitForTimeout(300);

  ctx.note(
    `OK: ${REQUIRED_TITLES.length} section titles present, cert pad=${metrics.paddingTop}px height=${metrics.cardHeight}px, ${sectionToggleCount} section toggles, 0 "coming soon" buttons`,
  );
};

export default scenario;
