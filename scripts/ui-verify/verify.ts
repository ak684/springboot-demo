#!/usr/bin/env bun
/**
 * UI self-verification harness (Playwright).
 *
 * Drives a headless Chromium against either a local dev server
 * (http://localhost:3010) or a Render PR-preview URL, captures screenshots +
 * video + console + network errors, and dumps everything to an out dir the
 * agent can Read later.
 *
 * Usage:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario smoke-login \
 *     [--base-url http://localhost:3010] \
 *     [--out /tmp/ui-verify/<ts>] \
 *     [--email alona@impactforesight.io] \
 *     [--password password123] \
 *     [--no-video] [--no-login] [--headed]
 *
 * Scenarios live in ./scenarios/*.ts and default-export an async function
 * receiving a ScenarioContext (see ./scenario.ts).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ScenarioContext, ScenarioFn, StepRecord } from "./scenario.ts";

type Args = {
  scenario: string;
  baseUrl: string;
  out: string;
  email: string;
  password: string;
  video: boolean;
  login: boolean;
  headed: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback?: string): string | undefined => {
    const i = argv.indexOf(flag);
    if (i === -1) return fallback;
    return argv[i + 1];
  };
  const has = (flag: string): boolean => argv.includes(flag);

  const scenario = get("--scenario");
  if (!scenario) {
    console.error("Error: --scenario <name> is required (file in scripts/ui-verify/scenarios/<name>.ts)");
    process.exit(1);
  }
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    scenario,
    baseUrl: get("--base-url", "http://localhost:3010")!,
    out: get("--out", `/tmp/ui-verify/${ts}-${scenario}`)!,
    email: get("--email", process.env.UI_VERIFY_EMAIL || "alona@impactforesight.io")!,
    password: get("--password", process.env.UI_VERIFY_PASSWORD || "password123")!,
    video: !has("--no-video"),
    login: !has("--no-login"),
    headed: has("--headed"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  await mkdir(args.out, { recursive: true });
  const screenshotsDir = join(args.out, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  const consoleLog: string[] = [];
  const networkErrors: string[] = [];
  const steps: StepRecord[] = [];
  const startedAt = Date.now();
  let pageError: string | null = null;

  const scenarioPath = resolve(
    import.meta.dir,
    "scenarios",
    args.scenario.endsWith(".ts") ? args.scenario : `${args.scenario}.ts`,
  );
  let scenarioFn: ScenarioFn;
  try {
    const mod = await import(scenarioPath);
    scenarioFn = mod.default;
    if (typeof scenarioFn !== "function") {
      throw new Error(`Scenario ${scenarioPath} must default-export an async function`);
    }
  } catch (e) {
    console.error(`Failed to load scenario: ${scenarioPath}`);
    console.error((e as Error).message);
    process.exit(1);
  }

  console.log(`[ui-verify] scenario=${args.scenario} baseUrl=${args.baseUrl} out=${args.out}`);

  // Sandboxes often run behind a corporate HTTP proxy (set via HTTPS_PROXY /
  // HTTP_PROXY). Chromium inherits those env vars at launch and ignores
  // --no-proxy-server when they're set. For localhost targets we need to
  // scrub them from the process env so the spawned Chromium sees none.
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(args.baseUrl);
  if (isLocal) {
    for (const k of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]) {
      delete process.env[k];
    }
    process.env.NO_PROXY = "*";
    process.env.no_proxy = "*";
  }
  const browser: Browser = await chromium.launch({
    headless: !args.headed,
    args: isLocal ? ["--no-proxy-server"] : [],
  });
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: args.video ? { dir: args.out, size: { width: 1440, height: 900 } } : undefined,
    ignoreHTTPSErrors: true,
  });
  const page: Page = await context.newPage();

  page.on("console", (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    consoleLog.push(line);
    if (msg.type() === "error") console.log(`  console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    pageError = err.message;
    consoleLog.push(`[pageerror] ${err.message}\n${err.stack ?? ""}`);
    console.log(`  pageerror: ${err.message}`);
  });
  page.on("response", (resp) => {
    const status = resp.status();
    if (status >= 400) {
      const line = `${status} ${resp.request().method()} ${resp.url()}`;
      networkErrors.push(line);
    }
  });
  page.on("requestfailed", (req) => {
    networkErrors.push(`FAILED ${req.method()} ${req.url()} - ${req.failure()?.errorText ?? "?"}`);
  });

  let shotCounter = 0;
  const ctx: ScenarioContext = {
    page,
    context,
    baseUrl: args.baseUrl.replace(/\/$/, ""),
    args: { email: args.email, password: args.password, shouldLogin: args.login },
    async screenshot(name: string) {
      shotCounter += 1;
      const fileName = `${String(shotCounter).padStart(3, "0")}-${name.replace(/[^a-z0-9_-]+/gi, "_")}.png`;
      const filePath = join(screenshotsDir, fileName);
      await page.screenshot({ path: filePath, fullPage: false });
      steps.push({ at: Date.now() - startedAt, kind: "screenshot", name, file: filePath });
      console.log(`  📸 ${fileName}`);
      return filePath;
    },
    note(message: string) {
      steps.push({ at: Date.now() - startedAt, kind: "note", message });
      console.log(`  · ${message}`);
    },
    async login(email?: string, password?: string) {
      const e = email ?? args.email;
      const p = password ?? args.password;
      this.note(`login as ${e}`);
      await page.goto(`${this.baseUrl}/login`, { waitUntil: "domcontentloaded" });
      await page.fill('input[name="email"]', e);
      await page.fill('input[name="password"]', p);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 }),
        page.click('button[type="submit"]'),
      ]);
      this.note("login submitted, navigated away from /login");
    },
    async waitForSelector(selector, options) {
      try {
        await page.waitForSelector(selector, {
          timeout: options?.timeout ?? 30000,
          state: options?.state,
        });
      } catch (e) {
        const slug = (options?.onTimeoutScreenshot ?? `wait-timeout-${selector}`)
          .replace(/[^a-z0-9_-]+/gi, "_")
          .slice(0, 80);
        try {
          await this.screenshot(slug);
        } catch {
          // ignore — better to surface the original error than mask it
        }
        throw e;
      }
    },
    async dumpInteractables(options) {
      const limit = options?.limit ?? 30;
      const within = options?.within ?? "body";
      const includeText = options?.includeText !== false;
      const root = page.locator(within);
      // Common interactable patterns: native form/click elements + MUI cards/list items + ARIA roles.
      const selectors = [
        "button",
        "a[href]",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[role="tab"]',
        ".MuiCard-root",
        ".MuiListItem-root",
        ".MuiMenuItem-root",
      ];
      const entries: string[] = [];
      let total = 0;
      for (const sel of selectors) {
        const loc = root.locator(sel);
        const count = await loc.count();
        for (let i = 0; i < count && entries.length < limit; i++) {
          const el = loc.nth(i);
          let tag = "?";
          let cls = "";
          let text = "";
          let visible = false;
          try {
            tag = await el.evaluate((e) => e.tagName.toLowerCase());
            cls = await el.evaluate((e) => (e.className && typeof e.className === "string" ? e.className : ""));
            visible = await el.isVisible();
            if (includeText) {
              text = (await el.innerText().catch(() => ""))?.replace(/\s+/g, " ").trim().slice(0, 60) ?? "";
            }
          } catch {
            // skip elements that detached during enumeration
            continue;
          }
          const clsStr = cls ? `.${cls.split(/\s+/).slice(0, 2).join(".")}` : "";
          const visMark = visible ? "" : " (hidden)";
          const textStr = text ? ` "${text}"` : "";
          entries.push(`  [${sel}] <${tag}${clsStr}>${textStr}${visMark}`);
          total += 1;
          if (entries.length >= limit) break;
        }
        if (entries.length >= limit) break;
      }
      const header = `[dumpInteractables] within=${within} matches=${total}${total >= limit ? " (truncated)" : ""}`;
      this.note(header);
      for (const line of entries) this.note(line);
    },
  };

  let failure: string | null = null;
  try {
    await scenarioFn(ctx);
  } catch (e) {
    failure = (e as Error).message;
    console.error(`[ui-verify] scenario threw: ${failure}`);
    try {
      await ctx.screenshot("FAILURE");
    } catch {
      // ignore screenshot failures on teardown
    }
  }

  await context.close();
  await browser.close();

  await writeFile(join(args.out, "console.log"), consoleLog.join("\n"), "utf8");
  await writeFile(join(args.out, "network-errors.log"), networkErrors.join("\n"), "utf8");

  const summary = {
    scenario: args.scenario,
    baseUrl: args.baseUrl,
    out: args.out,
    durationMs: Date.now() - startedAt,
    success: failure === null && pageError === null,
    failure,
    pageError,
    screenshotCount: shotCounter,
    consoleErrorCount: consoleLog.filter((l) => l.startsWith("[error]") || l.startsWith("[pageerror]")).length,
    networkErrorCount: networkErrors.length,
    steps,
  };
  await writeFile(join(args.out, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log("");
  console.log(`[ui-verify] done. success=${summary.success} screenshots=${shotCounter} consoleErrors=${summary.consoleErrorCount} networkErrors=${summary.networkErrorCount}`);
  console.log(`[ui-verify] artifacts: ${args.out}`);
  if (!summary.success) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
