/**
 * Load the admin-app login page and screenshot it. Doesn't submit,
 * so it works without the backend running.
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.screenshot("login-empty");
  await ctx.page.fill('input[name="email"]', ctx.args.email);
  await ctx.page.fill('input[name="password"]', ctx.args.password);
  await ctx.screenshot("login-filled");
  ctx.note("form rendered and accepts input; skipped submit (no backend needed)");
};

export default scenario;
