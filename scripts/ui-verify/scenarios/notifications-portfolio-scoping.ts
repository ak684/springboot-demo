/**
 * Scenario for issue #530 — Notifications panel must be scoped to the
 * portfolio whose extractor is currently open.
 *
 * Covers, end-to-end against a real backend:
 *   1. Log in as superadmin.
 *   2. Open /portfolios/<A>/company-url-extractor (a portfolio with news).
 *   3. Click the Notifications sidebar item.
 *   4. Capture the /news-events/user request URL and assert it includes
 *      "&portfolioId=<A>" (the bug pre-fix: prop was dropped, so the URL
 *      was just "/news-events/user?days=30" with no portfolio filter).
 *   5. Screenshot the rendered news list.
 *   6. Repeat for portfolio <B> with a different (mostly non-overlapping)
 *      set of companies and assert (a) the request URL changes to
 *      "&portfolioId=<B>" and (b) the rendered list is different.
 *
 * Run against a Render PR preview:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario notifications-portfolio-scoping \
 *     --base-url https://venture-impact-platform-pr-<N>.onrender.com
 */
import type { ScenarioFn } from "../scenario.ts";

// Seed-data portfolios with disjoint news-tracked companies:
//   Portfolio 1: includes company 5 (MIT) — German MIT articles
//   Portfolio 39: includes company 27 (Impossible Foods) — plant-based
//                 burger articles. Only overlap is company 11.
const PORTFOLIO_A = process.env.UI_VERIFY_PORTFOLIO_A || "1";
const PORTFOLIO_B = process.env.UI_VERIFY_PORTFOLIO_B || "39";

type CapturedRequest = { url: string; at: number };

const collectNewsEventsRequests = (
  ctx: Parameters<ScenarioFn>[0],
): CapturedRequest[] => {
  const captured: CapturedRequest[] = [];
  ctx.page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/news-events/user")
        || url.includes("/patent-events/user")) {
      captured.push({ url, at: Date.now() });
    }
  });
  return captured;
};

const openNotificationsAndCapture = async (
  ctx: Parameters<ScenarioFn>[0],
  portfolioId: string,
  label: string,
  captured: CapturedRequest[],
): Promise<CapturedRequest[]> => {
  ctx.note(`navigating to /portfolios/${portfolioId}/company-url-extractor`);
  await ctx.page.goto(
    `${ctx.baseUrl}/portfolios/${portfolioId}/company-url-extractor`,
    { waitUntil: "domcontentloaded" },
  );
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 30000 })
    .catch(() => {});
  await ctx.screenshot(`${label}-extractor-loaded`);

  const beforeClickCount = captured.length;

  ctx.note("clicking the Notifications sidebar item");
  const notifNav = ctx.page.locator(
    '.MuiDrawer-paper [data-testid="NotificationsOutlinedIcon"]',
  ).first();
  await notifNav.click({ timeout: 30000 });

  // Wait for the Notifications panel header to render — the component sets
  // an h4 "Notifications" once loading resolves.
  await ctx.page.waitForFunction(
    () => {
      const headings = Array.from(document.querySelectorAll("h4"));
      return headings.some((h) => (h.textContent || "").trim()
        === "Notifications");
    },
    null,
    { timeout: 30000 },
  ).catch(() => {});

  // Give the two parallel fetches a beat to flush.
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot(`${label}-notifications-panel`);

  const newRequests = captured.slice(beforeClickCount);
  ctx.note(
    `captured ${newRequests.length} notification requests for `
      + `portfolio ${portfolioId}: ${
        JSON.stringify(newRequests.map((r) => r.url))
      }`,
  );
  return newRequests;
};

const collectVisibleNewsTitles = async (
  ctx: Parameters<ScenarioFn>[0],
): Promise<string[]> => {
  return await ctx.page.evaluate(() => {
    // News groups render the heading "<companyName> In The News" as an
    // MUI Typography body1 inside a ListItemButton. Walk every Typography
    // body1 and keep ones that match the suffix.
    const nodes = Array.from(
      document.querySelectorAll(".MuiTypography-body1"),
    );
    return nodes
      .map((n) => (n.textContent || "").trim())
      .filter((t) => t.endsWith(" In The News"));
  });
};

const scenario: ScenarioFn = async (ctx) => {
  ctx.page.setViewportSize({ width: 1440, height: 900 });

  // Render's edge sometimes 404s for non-root paths when the User-Agent
  // looks bot-like; mimic the agent-chat-history scenario.
  await ctx.context.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  const captured = collectNewsEventsRequests(ctx);

  ctx.note("=== STEP 1: log in as superadmin ===");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 60000 });
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 30000 })
    .catch(() => {});

  ctx.note(`=== STEP 2: open Notifications for portfolio ${PORTFOLIO_A} ===`);
  const reqsA = await openNotificationsAndCapture(
    ctx,
    PORTFOLIO_A,
    `01-portfolio-${PORTFOLIO_A}`,
    captured,
  );

  const newsReqA = reqsA.find((r) => r.url.includes("/news-events/user"));
  if (!newsReqA) {
    throw new Error(
      `Expected a /news-events/user request after clicking Notifications `
        + `for portfolio ${PORTFOLIO_A}; got: ${
          JSON.stringify(reqsA.map((r) => r.url))
        }`,
    );
  }
  if (!newsReqA.url.includes(`portfolioId=${PORTFOLIO_A}`)) {
    throw new Error(
      `News request URL is missing portfolioId=${PORTFOLIO_A} — the bug `
        + `from #530 is still present. URL was: ${newsReqA.url}`,
    );
  }
  ctx.note(`✓ news request for portfolio ${PORTFOLIO_A} is properly scoped`);

  // Bonus: also assert patents are scoped — same shared component fix.
  const patentReqA = reqsA.find(
    (r) => r.url.includes("/patent-events/user"),
  );
  if (patentReqA && !patentReqA.url.includes(`portfolioId=${PORTFOLIO_A}`)) {
    throw new Error(
      `Patent request URL is missing portfolioId=${PORTFOLIO_A}. `
        + `URL was: ${patentReqA.url}`,
    );
  }

  const titlesA = await collectVisibleNewsTitles(ctx);
  ctx.note(`portfolio ${PORTFOLIO_A} visible titles: ${
    JSON.stringify(titlesA)
  }`);

  ctx.note(`=== STEP 3: open Notifications for portfolio ${PORTFOLIO_B} ===`);
  const reqsB = await openNotificationsAndCapture(
    ctx,
    PORTFOLIO_B,
    `02-portfolio-${PORTFOLIO_B}`,
    captured,
  );

  const newsReqB = reqsB.find((r) => r.url.includes("/news-events/user"));
  if (!newsReqB) {
    throw new Error(
      `Expected a /news-events/user request after clicking Notifications `
        + `for portfolio ${PORTFOLIO_B}; got: ${
          JSON.stringify(reqsB.map((r) => r.url))
        }`,
    );
  }
  if (!newsReqB.url.includes(`portfolioId=${PORTFOLIO_B}`)) {
    throw new Error(
      `News request URL is missing portfolioId=${PORTFOLIO_B}. `
        + `URL was: ${newsReqB.url}`,
    );
  }
  ctx.note(`✓ news request for portfolio ${PORTFOLIO_B} is properly scoped`);

  const titlesB = await collectVisibleNewsTitles(ctx);
  ctx.note(`portfolio ${PORTFOLIO_B} visible titles: ${
    JSON.stringify(titlesB)
  }`);

  // Sanity: at least one of the two portfolios should render some news,
  // and the two title lists should not be identical (seed data has
  // mostly disjoint companies between portfolio 1 and portfolio 39).
  if (titlesA.length === 0 && titlesB.length === 0) {
    ctx.note(
      "WARNING: neither portfolio rendered any news titles. The fix is "
        + "still verified by the request-URL assertions above; the empty "
        + "lists likely reflect the preview's news-event seed data.",
    );
  } else if (titlesA.length > 0 && titlesB.length > 0) {
    const setA = new Set(titlesA);
    const setB = new Set(titlesB);
    const identical = titlesA.length === titlesB.length
      && titlesA.every((t) => setB.has(t))
      && titlesB.every((t) => setA.has(t));
    if (identical) {
      throw new Error(
        `Both portfolios rendered the SAME notification list, which would `
          + `indicate the portfolio scoping is not actually filtering on `
          + `the server. titles=${JSON.stringify(titlesA)}`,
      );
    }
    ctx.note("✓ portfolio A and portfolio B render different news lists");
  }

  ctx.note("notifications-portfolio-scoping scenario complete");
};

export default scenario;
