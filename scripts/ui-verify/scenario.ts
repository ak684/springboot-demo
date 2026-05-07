/**
 * Contract for UI verification scenarios.
 *
 * A scenario is a TS file in ./scenarios/ that default-exports an async
 * function receiving a ScenarioContext. Scenarios should:
 *   - optionally ctx.login() if they need an authenticated session
 *   - ctx.page.goto() and interact via Playwright's page API
 *   - call ctx.screenshot('name') at meaningful checkpoints
 *   - call ctx.note('...') to annotate the timeline
 *   - prefer ctx.waitForSelector(...) over ctx.page.waitForSelector(...) — it
 *     auto-screenshots the live DOM if the wait times out, which makes
 *     iterating on selectors significantly faster
 *   - call ctx.dumpInteractables(...) when a selector is failing in mysterious
 *     ways to print a compact list of likely click targets on the current page
 *
 * Throw to fail the scenario; verify.ts will capture a FAILURE screenshot
 * and exit non-zero.
 */
import type { BrowserContext, Page } from "playwright";

export type WaitForSelectorOptions = {
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
  /** Screenshot label written if the wait times out. Default: "wait-timeout-<selector>". */
  onTimeoutScreenshot?: string;
};

export type DumpInteractablesOptions = {
  /** Limit the number of elements printed. Default 30. */
  limit?: number;
  /** Restrict to a sub-tree (CSS selector). Default: whole page. */
  within?: string;
  /** Include the visible text of each match (truncated). Default true. */
  includeText?: boolean;
};

export type ScenarioContext = {
  page: Page;
  context: BrowserContext;
  baseUrl: string;
  args: {
    email: string;
    password: string;
    shouldLogin: boolean;
  };
  screenshot: (name: string) => Promise<string>;
  note: (message: string) => void;
  login: (email?: string, password?: string) => Promise<void>;
  /**
   * Wraps page.waitForSelector. On timeout, captures a screenshot of the live
   * DOM (named by `onTimeoutScreenshot` or derived from the selector) and
   * re-throws the original error. Use this in place of page.waitForSelector to
   * get diagnostics on the FIRST failed iteration instead of having to add a
   * manual screenshot before every wait.
   */
  waitForSelector: (selector: string, options?: WaitForSelectorOptions) => Promise<void>;
  /**
   * Print a compact debug listing to stdout (and to console.log via ctx.note)
   * of likely interactable elements on the current page: buttons, links,
   * inputs, MUI cards, MUI list items, role=button. Useful when a selector
   * fails and you want to know what's actually on the page without re-running.
   */
  dumpInteractables: (options?: DumpInteractablesOptions) => Promise<void>;
};

export type ScenarioFn = (ctx: ScenarioContext) => Promise<void>;

export type StepRecord =
  | { at: number; kind: "screenshot"; name: string; file: string }
  | { at: number; kind: "note"; message: string };
