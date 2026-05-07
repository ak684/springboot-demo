/**
 * Verify the report-icon-{1,2}.svg assets still load on the public
 * /company-overview/:id page after moving them from public/images/figma/
 * into public/images/icons/.
 *
 * Scrolls the page down to the "Blog Posts & ESG Report" section so the icons
 * are in-frame, then screenshots them full-page.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario report-icons-company-overview --no-login
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.setViewportSize({ width: 1440, height: 900 });

  const companyId = 5;
  ctx.note(`loading /company-overview/${companyId}`);
  await ctx.page.goto(`${ctx.baseUrl}/company-overview/${companyId}`, {
    waitUntil: "domcontentloaded",
  });

  await ctx.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await ctx.page.waitForTimeout(1500);

  await ctx.screenshot("01-top-of-page");

  const iconLocator = ctx.page.locator('img[src="/images/icons/report-icon-1.svg"]').first();
  await iconLocator.waitFor({ state: "attached", timeout: 15000 });
  await iconLocator.scrollIntoViewIfNeeded();
  await ctx.page.waitForTimeout(500);

  await ctx.screenshot("02-report-icons-in-view");

  const iconsInfo = await ctx.page.evaluate(() => {
    const imgs = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        'img[src^="/images/icons/report-icon-"]',
      ),
    );
    return imgs.map((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));
  });

  ctx.note(`found ${iconsInfo.length} report-icon img(s): ${JSON.stringify(iconsInfo)}`);

  if (iconsInfo.length === 0) {
    throw new Error("no report-icon-*.svg img tags found on the page");
  }
  for (const icon of iconsInfo) {
    if (!icon.complete || icon.naturalWidth === 0) {
      throw new Error(
        `report icon failed to load: ${icon.src} (complete=${icon.complete}, naturalWidth=${icon.naturalWidth})`,
      );
    }
  }

  await ctx.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("03-bottom-of-page");
};

export default scenario;
