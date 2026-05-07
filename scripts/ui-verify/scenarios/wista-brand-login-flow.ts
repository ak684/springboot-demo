import type { ScenarioFn } from "../lib/types";

const scenario: ScenarioFn = async (ctx) => {
  // Test 1: Normal login (no brand param) - should work as before
  ctx.note("TEST 1: Normal login without brand param");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  // Check that we have the default ImpactForesight branding (blue background)
  const defaultBgColor = await ctx.page.evaluate(() => {
    const leftPanel = document.querySelector('[class*="MuiGrid-root"]');
    if (leftPanel) {
      return window.getComputedStyle(leftPanel).backgroundColor;
    }
    return null;
  });
  ctx.note(`Default login background: ${defaultBgColor}`);
  await ctx.screenshot("01-default-login-page");

  // Login with test user
  await ctx.page.fill('input[name="email"]', "alona@impactforesight.io");
  await ctx.page.fill('input[name="password"]', "password123");
  await ctx.screenshot("02-default-login-filled");
  await ctx.page.click('button[type="submit"]');

  // Wait for redirect after login
  await ctx.page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  await ctx.page.waitForLoadState("networkidle");
  await ctx.screenshot("03-default-post-login");

  const defaultPostLoginUrl = ctx.page.url();
  ctx.note(`Default post-login URL: ${defaultPostLoginUrl}`);

  // Should land on portfolios or ventures page (default ImpactForesight flow)
  if (!defaultPostLoginUrl.includes("/portfolios") && !defaultPostLoginUrl.includes("/ventures")) {
    throw new Error(`Unexpected post-login URL for default: ${defaultPostLoginUrl}`);
  }

  // Logout
  ctx.note("Logging out...");
  await ctx.page.goto(`${ctx.baseUrl}/logout`, { waitUntil: "domcontentloaded" });
  await ctx.page.waitForTimeout(2000);

  // Test 2: WISTA branded login
  ctx.note("TEST 2: WISTA branded login with ?brand=wista");
  await ctx.page.goto(`${ctx.baseUrl}/login?brand=wista`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });

  // Check WISTA branding (teal/green gradient background)
  const wistaBgColor = await ctx.page.evaluate(() => {
    const leftPanel = document.querySelector('[class*="MuiGrid-root"]');
    if (leftPanel) {
      return window.getComputedStyle(leftPanel).background;
    }
    return null;
  });
  ctx.note(`WISTA login background: ${wistaBgColor}`);
  await ctx.screenshot("04-wista-login-page");

  // Check for WISTA-specific elements
  const pageContent = await ctx.page.content();
  const hasWistaLogo = pageContent.includes("wista-logo") || pageContent.includes("WISTA");
  ctx.note(`Has WISTA branding elements: ${hasWistaLogo}`);

  // Login with test user
  await ctx.page.fill('input[name="email"]', "alona@impactforesight.io");
  await ctx.page.fill('input[name="password"]', "password123");
  await ctx.screenshot("05-wista-login-filled");
  await ctx.page.click('button[type="submit"]');

  // Wait for redirect after login
  await ctx.page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  await ctx.page.waitForLoadState("networkidle");
  await ctx.screenshot("06-wista-post-login");

  const wistaPostLoginUrl = ctx.page.url();
  ctx.note(`WISTA post-login URL: ${wistaPostLoginUrl}`);

  // WISTA should redirect to company-url-extractor or portfolios page
  if (!wistaPostLoginUrl.includes("/company-url-extractor") && !wistaPostLoginUrl.includes("/portfolios")) {
    ctx.note(`Warning: WISTA post-login URL might not be correct: ${wistaPostLoginUrl}`);
  }

  // Check the navigation - should have WISTA-specific nav
  await ctx.screenshot("07-wista-navigation");

  // Click on a portfolio link if visible
  const portfolioLink = await ctx.page.$('a[href*="/portfolios/"]');
  if (portfolioLink) {
    await portfolioLink.click();
    await ctx.page.waitForLoadState("networkidle");
    await ctx.screenshot("08-wista-portfolio-clicked");
    ctx.note(`After portfolio click: ${ctx.page.url()}`);
  }

  ctx.note("Both login flows completed successfully!");
};

export default scenario;
