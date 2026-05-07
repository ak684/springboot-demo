/**
 * Regression test for the ctx.waitForSelector + ctx.dumpInteractables helpers
 * added to verify.ts. Intentionally fails the wait so we can prove the
 * auto-screenshot fires; then dumps interactables on the login page to prove
 * that helper produces output too.
 *
 * Run:
 *   bun scripts/ui-verify/verify.ts --scenario helper-self-check --no-login
 *
 * Expected: scenario throws (success=false) but the artifact dir contains
 *   - a screenshot named *wait-timeout* (proof of auto-screenshot)
 *   - dumpInteractables notes in summary.json
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.screenshot("00-login-page");

  // Prove dumpInteractables works.
  ctx.note("--- about to call ctx.dumpInteractables() ---");
  await ctx.dumpInteractables({ within: "body", limit: 15 });

  // Prove waitForSelector auto-screenshots on timeout. We intentionally use a
  // selector that does NOT exist and expect a timeout, which should produce a
  // screenshot named "wait-timeout-..." before the error propagates.
  ctx.note("--- about to wait for a non-existent selector (expecting timeout) ---");
  await ctx.waitForSelector('button[data-this-does-not-exist="true"]', { timeout: 2000 });
};

export default scenario;
