/**
 * Captures the three auth screens (/login, /forgot, /reset/:token) under
 * both brandings:
 *   1. default  — ImpactForesight layout (classic margin-based form, no wave)
 *   2. ?brand=wista — WISTA Figma layout (top-right logo, wave overlay,
 *      centered form column)
 *
 * Proves PR gating on isWhiteLabelEnabled() correctly keeps the two brands
 * separate.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario auth-brand-compare --no-login
 */
import type { ScenarioFn } from "../scenario.ts";

const captureAuthScreens = async (
  ctx: Parameters<ScenarioFn>[0],
  prefix: string,
  expectWhiteLabel: boolean,
) => {
  ctx.note(`[${prefix}] capturing /login`);
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot(`${prefix}-01-login`);

  ctx.note(`[${prefix}] capturing /forgot`);
  await ctx.page.goto(`${ctx.baseUrl}/forgot`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot(`${prefix}-02-forgot`);

  ctx.note(`[${prefix}] capturing /reset/dummy-token`);
  await ctx.page.goto(`${ctx.baseUrl}/reset/dummy-token`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="password"]', { timeout: 30000 });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot(`${prefix}-03-reset`);

  const branding = await ctx.page.evaluate(() => (window as any).__BRANDING__);
  const wlEnabled = Boolean(branding?.whiteLabel?.enabled);
  ctx.note(`[${prefix}] companyName=${branding?.companyName} whiteLabel.enabled=${wlEnabled}`);
  if (expectWhiteLabel !== wlEnabled) {
    throw new Error(
      `[${prefix}] expected whiteLabel.enabled=${expectWhiteLabel}, got ${wlEnabled}`,
    );
  }
};

const scenario: ScenarioFn = async (ctx) => {
  ctx.page.setViewportSize({ width: 1440, height: 900 });

  ctx.note("=== Pass 1: default (ImpactForesight) branding ===");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=default`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await captureAuthScreens(ctx, "if", false);

  ctx.note("=== Pass 2: ?brand=wista branding ===");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await captureAuthScreens(ctx, "wista", true);

  ctx.note("=== Cleanup: flip branding back to default ===");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=default`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  ctx.note("captured six screenshots: 3 IF + 3 WISTA");
};

export default scenario;
