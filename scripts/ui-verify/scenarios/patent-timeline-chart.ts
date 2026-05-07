/**
 * Patent activity timeline chart on the internal company profile modal.
 *
 * Verifies that:
 *   1. We can find a portfolio with at least one company that has patents.
 *   2. Opening that company's profile modal renders the new patent timeline
 *      chart (recharts ComposedChart) at the top of PatentInformationSection.
 *   3. At least one bar (recharts-bar-rectangle SVG element) is drawn.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario patent-timeline-chart
 */
import type { ScenarioFn } from "../scenario.ts";

type LiteCompany = {
  id: number;
  company_name: string;
  total_patents?: number;
};

const PORTFOLIO_CANDIDATES = [1, 39];

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.setViewportSize({ width: 1440, height: 1000 });

  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  let target: { portfolioId: number; company: LiteCompany } | null = null;
  for (const portfolioId of PORTFOLIO_CANDIDATES) {
    const url = `/api/v1/companies/lite?portfolioId=${portfolioId}`;
    ctx.note(`probing ${url} for a company with patents`);
    const companies = await ctx.page.evaluate(async (apiUrl) => {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl, {
        headers: token ? { authorization: token } : {}
      });
      if (!res.ok) return [];
      const body = await res.json();
      if (Array.isArray(body)) return body;
      if (Array.isArray(body?.content)) return body.content;
      return [];
    }, url);
    const candidates: LiteCompany[] = companies as LiteCompany[];
    ctx.note(`portfolio ${portfolioId}: ${candidates.length} companies`);
    const withPatents = candidates.find(
      (c) => typeof c.total_patents === "number" && c.total_patents > 0
    );
    if (withPatents) {
      target = { portfolioId, company: withPatents };
      break;
    }
  }
  if (!target) {
    throw new Error(
      "No portfolio found with a company that has patents — seed data may be missing patent rows"
    );
  }
  ctx.note(
    `using portfolio ${target.portfolioId}, company id=${target.company.id} ` +
      `name="${target.company.company_name}" total_patents=${target.company.total_patents}`
  );

  // Force the sidebar open so the "Database" nav label is visible.
  await ctx.page.evaluate(() => {
    localStorage.setItem("companyExtractor.sidebarCollapsed", "false");
  });

  const extractorUrl = `${ctx.baseUrl}/portfolios/${target.portfolioId}/company-url-extractor`;
  ctx.note(`navigating to ${extractorUrl}`);
  await ctx.page.goto(extractorUrl, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  ctx.note("clicking 'Database' section in sidebar to reveal the company table");
  const databaseNav = ctx.page.locator('[role="button"]:has-text("Database")').first();
  await databaseNav.waitFor({ state: "visible", timeout: 20000 });
  await databaseNav.click();
  await ctx.page.waitForTimeout(1000);

  const searchBox = ctx.page.locator('label:has-text("Search company name")');
  await searchBox.waitFor({ state: "visible", timeout: 20000 });
  const searchInput = ctx.page
    .locator('label:has-text("Search company name") + div input')
    .first();
  await searchInput.fill(target.company.company_name);
  ctx.note("typed company name into search box; waiting for filtered table");
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot("01-database-search");

  const companyRow = ctx.page.locator("tr", {
    hasText: target.company.company_name
  });
  await companyRow.first().waitFor({ state: "visible", timeout: 20000 });
  ctx.note("clicking 'Open company profile' icon in matched row");
  await companyRow.first().locator("button").first().click();

  ctx.note("waiting for company profile modal to open");
  const modal = ctx.page.locator('[role="dialog"]').first();
  await modal.waitFor({ state: "visible", timeout: 30000 });
  await ctx.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await ctx.screenshot("02-profile-modal-open");

  const chart = ctx.page.locator('[data-testid="patent-timeline-chart"]');
  await chart.waitFor({ state: "attached", timeout: 30000 });
  await chart.scrollIntoViewIfNeeded();
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("03-patent-timeline-chart");

  const barCount = await ctx.page
    .locator('[data-testid="patent-timeline-chart"] .recharts-bar-rectangle')
    .count();
  ctx.note(`recharts-bar-rectangle count: ${barCount}`);
  if (barCount < 1) {
    throw new Error(
      `expected at least one rendered bar in patent timeline chart, got ${barCount}`
    );
  }

  const lineCount = await ctx.page
    .locator('[data-testid="patent-timeline-chart"] .recharts-line-curve')
    .count();
  ctx.note(`recharts-line-curve count (cumulative line): ${lineCount}`);

  // Capture the rest of the patent section (stats row + family list) to
  // confirm the original UI is still intact below the chart.
  const detailsHeading = ctx.page.locator("text=Patent Details").first();
  await detailsHeading.waitFor({ state: "visible", timeout: 15000 });
  await detailsHeading.scrollIntoViewIfNeeded();
  await ctx.page.waitForTimeout(800);
  await ctx.screenshot("04-patent-list-below-chart");

  ctx.note("patent-timeline-chart scenario complete");
};

export default scenario;
