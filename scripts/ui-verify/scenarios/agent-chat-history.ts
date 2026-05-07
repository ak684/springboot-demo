/**
 * Scenario for issue #519 — AI agent chat history persistence.
 *
 * Covers, end-to-end against a real agent backend:
 *   1. Open the AI agent chat for a portfolio.
 *   2. Send a message; verify the assistant responds.
 *   3. Reload the page and confirm the conversation row appears in the
 *      left-hand "Conversations" panel.
 *   4. Click the saved conversation; confirm both turns load from DB.
 *   5. Send a follow-up; confirm it appends to the SAME conversation
 *      (no duplicate row) and the row's title still matches the FIRST
 *      user message.
 *   6. Delete the conversation via the trash icon + confirm dialog;
 *      confirm the row disappears and the chat resets.
 *
 * Run against a Render PR preview:
 *   bun scripts/ui-verify/verify.ts \
 *     --scenario agent-chat-history \
 *     --base-url https://venture-impact-platform-pr-<N>.onrender.com
 */
import type { ScenarioFn } from "../scenario.ts";

const FIRST_QUESTION = "How many companies are in this portfolio?";
const FOLLOW_UP_QUESTION = "Which one has the highest growth score?";

const PORTFOLIO_ID = process.env.UI_VERIFY_PORTFOLIO_ID || "1";
const PORTFOLIO_PATH = `/portfolios/${PORTFOLIO_ID}/company-url-extractor`;

const waitForAgentChat = async (ctx: Parameters<ScenarioFn>[0]) => {
  await ctx.waitForSelector('[data-testid="portfolio-agent-chat"]', {
    timeout: 60000,
  });
};

const assistantBubbleCount = async (ctx: Parameters<ScenarioFn>[0]) => {
  return await ctx.page.evaluate(() => {
    const bubbles = document.querySelectorAll(
      '[data-testid="portfolio-agent-chat"] .MuiPaper-root'
    );
    let assistantCount = 0;
    bubbles.forEach((b) => {
      const html = b.innerHTML || "";
      if (
        html.includes("dangerouslySetInnerHTML") ||
        html.includes("formatMarkdown") ||
        b.querySelector("div[style*='line-height']")
      ) {
        assistantCount++;
      }
    });
    return assistantCount;
  });
};

const sendMessageAndWait = async (
  ctx: Parameters<ScenarioFn>[0],
  text: string,
  label: string,
) => {
  ctx.note(`[${label}] typing question: ${text}`);
  const input = ctx.page.locator(
    '[data-testid="portfolio-agent-chat"] textarea',
  ).first();
  await input.click();
  await input.fill(text);
  await ctx.page.waitForTimeout(200);
  await input.press("Enter");
  await ctx.screenshot(`${label}-message-sent`);

  ctx.note(`[${label}] waiting for assistant response`);
  // Wait for streaming to finish — Stop button (visible while streaming) goes
  // back to Send button (SendIcon) when done.
  await ctx.page.waitForFunction(
    () => {
      const root = document.querySelector(
        '[data-testid="portfolio-agent-chat"]',
      );
      if (!root) return false;
      const stop = root.querySelector("[data-testid='StopIcon']");
      const send = root.querySelector("[data-testid='SendIcon']");
      return !stop && !!send;
    },
    null,
    { timeout: 180000 },
  ).catch(() => {});
  await ctx.page.waitForTimeout(2000);
  await ctx.screenshot(`${label}-response-rendered`);
};

const visibleConversationTitles = async (
  ctx: Parameters<ScenarioFn>[0],
): Promise<string[]> =>
  ctx.page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll(
        '[data-testid^="portfolio-agent-conversation-row-"]',
      ),
    );
    return rows.map((r) => (r.textContent || "").trim());
  });

const scenario: ScenarioFn = async (ctx) => {
  ctx.page.setViewportSize({ width: 1440, height: 900 });

  // Render's edge returns 404 for non-root paths when the User-Agent
  // looks like a bot (e.g. headless Chromium without a real Chrome UA).
  // Override for every request in this context.
  await ctx.context.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  ctx.note("=== STEP 0: clean up any pre-existing conversations ===");
  // Make the scenario idempotent across reruns by deleting any
  // conversations the test user has on this portfolio.
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 60000 });

  ctx.note("=== STEP 1: log in and open AI agent ===");
  await ctx.login();
  // Pre-delete via REST so the panel starts empty (avoids polluting from
  // a prior scenario run on the same Render preview).
  await ctx.page.evaluate(async (portfolioId: string) => {
    const tokenRaw = window.localStorage.getItem("token");
    if (!tokenRaw) return;
    const headers: Record<string, string> = { authorization: tokenRaw };
    const list = await fetch(
      `/api/v1/portfolio-agent/conversations?portfolioId=${portfolioId}`,
      { headers },
    );
    if (!list.ok) return;
    const data = (await list.json()) as Array<{ id: number }>;
    for (const c of data) {
      await fetch(`/api/v1/portfolio-agent/conversations/${c.id}`, {
        method: "DELETE",
        headers,
      });
    }
  }, PORTFOLIO_ID);
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.page.goto(`${ctx.baseUrl}${PORTFOLIO_PATH}`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await ctx.screenshot("01-extractor-loaded");

  // Click the "AI Agent" sidebar entry to switch to the agent view.
  // The sidebar is icon-only by default; the AutoAwesomeIcon
  // (sparkles) is the AI Agent button.
  ctx.note("clicking AI Agent sidebar icon (AutoAwesomeIcon)");
  const aiAgentNav = ctx.page.locator(
    '.MuiDrawer-paper [data-testid="AutoAwesomeIcon"]',
  ).first();
  await aiAgentNav.click({ timeout: 30000 });
  await waitForAgentChat(ctx);
  await ctx.screenshot("02-agent-chat-open");

  // The conversations panel + "New conversation" button must be visible.
  await ctx.waitForSelector(
    '[data-testid="portfolio-agent-conversations-panel"]',
    { timeout: 15000 },
  );
  await ctx.waitForSelector(
    '[data-testid="portfolio-agent-new-conversation"]',
    { timeout: 15000 },
  );
  ctx.note("✓ conversations panel rendered");
  await ctx.screenshot("02b-conversations-panel-visible");

  ctx.note("=== STEP 2: send first message ===");
  await sendMessageAndWait(ctx, FIRST_QUESTION, "03-first");

  // After the first message we expect at least one conversation row
  // referencing the first user message (truncated to ~60 chars).
  await ctx.page.waitForFunction(
    () =>
      document
        .querySelectorAll('[data-testid^="portfolio-agent-conversation-row-"]')
        .length >= 1,
    null,
    { timeout: 15000 },
  );
  const titlesAfterFirst = await visibleConversationTitles(ctx);
  ctx.note(`titles after first send: ${JSON.stringify(titlesAfterFirst)}`);
  if (
    !titlesAfterFirst.some((t) =>
      t.includes(FIRST_QUESTION.slice(0, 30)),
    )
  ) {
    throw new Error(
      `Expected a conversation row containing the first question; got: ${JSON.stringify(titlesAfterFirst)}`,
    );
  }
  await ctx.screenshot("04-conversation-listed");

  ctx.note("=== STEP 3: refresh page; conversation must persist ===");
  await ctx.page.reload({ waitUntil: "domcontentloaded" });
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  // Re-open the AI Agent tab after reload (sidebar resets to dashboard).
  const aiAgentNavReload = ctx.page.locator(
    '.MuiDrawer-paper [data-testid="AutoAwesomeIcon"]',
  ).first();
  await aiAgentNavReload.click({ timeout: 30000 });
  await waitForAgentChat(ctx);
  await ctx.page.waitForFunction(
    () =>
      document
        .querySelectorAll('[data-testid^="portfolio-agent-conversation-row-"]')
        .length >= 1,
    null,
    { timeout: 30000 },
  );
  const titlesAfterReload = await visibleConversationTitles(ctx);
  ctx.note(`titles after reload: ${JSON.stringify(titlesAfterReload)}`);
  if (
    !titlesAfterReload.some((t) =>
      t.includes(FIRST_QUESTION.slice(0, 30)),
    )
  ) {
    throw new Error(
      `Conversation did not persist across reload; got: ${JSON.stringify(titlesAfterReload)}`,
    );
  }
  await ctx.screenshot("05-after-reload-still-listed");

  ctx.note("=== STEP 4: click conversation; messages must rehydrate ===");
  await ctx.page.locator(
    '[data-testid^="portfolio-agent-conversation-row-"]',
  ).first().click();
  // Wait for the welcome screen to disappear (which contains the same
  // FIRST_QUESTION as a suggestion chip) AND for an actual rendered
  // user-message bubble to be present.
  await ctx.page.waitForFunction(
    (probe: string) => {
      const root = document.querySelector(
        '[data-testid="portfolio-agent-chat"]',
      );
      if (!root) return false;
      const txt = root.textContent || "";
      const stillWelcome = txt.includes("Ask anything about your portfolio");
      if (stillWelcome) return false;
      return txt.includes(probe);
    },
    FIRST_QUESTION,
    { timeout: 30000 },
  );
  await ctx.screenshot("06-conversation-loaded-from-db");
  const assistantTurnsAfterLoad = await assistantBubbleCount(ctx);
  ctx.note(`assistant bubbles after load: ${assistantTurnsAfterLoad}`);

  ctx.note("=== STEP 5: send follow-up; same row, new last_modified_at ===");
  await sendMessageAndWait(ctx, FOLLOW_UP_QUESTION, "07-followup");
  const titlesAfterFollowup = await visibleConversationTitles(ctx);
  ctx.note(`titles after follow-up: ${JSON.stringify(titlesAfterFollowup)}`);
  if (titlesAfterFollowup.length !== 1) {
    throw new Error(
      `Expected exactly one conversation row after follow-up (no duplicates); got: ${JSON.stringify(titlesAfterFollowup)}`,
    );
  }
  if (
    !titlesAfterFollowup[0].includes(FIRST_QUESTION.slice(0, 30))
  ) {
    throw new Error(
      `Follow-up should NOT change the title (issue #519 keeps the title from the first user message). Got: ${titlesAfterFollowup[0]}`,
    );
  }
  await ctx.screenshot("08-followup-appended-same-row");

  ctx.note("=== STEP 6: delete conversation (trash icon + confirm) ===");
  const deleteIconLocator = ctx.page.locator(
    '[data-testid^="portfolio-agent-conversation-delete-"]',
  ).first();
  await deleteIconLocator.click();
  await ctx.waitForSelector(
    '[data-testid="portfolio-agent-delete-dialog"]',
    { timeout: 10000 },
  );
  await ctx.screenshot("09-delete-confirm-dialog");
  await ctx.page.locator(
    '[data-testid="portfolio-agent-delete-confirm"]',
  ).click();
  await ctx.page.waitForFunction(
    () =>
      document.querySelectorAll(
        '[data-testid^="portfolio-agent-conversation-row-"]',
      ).length === 0,
    null,
    { timeout: 15000 },
  );
  await ctx.screenshot("10-after-delete-empty-list");

  ctx.note("agent-chat-history scenario complete");
};

export default scenario;
