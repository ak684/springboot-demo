/**
 * Smoke scenario: login + home page loads.
 *
 * Use as a template for new scenarios. Run with:
 *   bun scripts/ui-verify/verify.ts --scenario smoke-login
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.screenshot("login-page");

  if (ctx.args.shouldLogin) {
    await ctx.login();
    await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await ctx.screenshot("post-login-home");
  }
};

export default scenario;
