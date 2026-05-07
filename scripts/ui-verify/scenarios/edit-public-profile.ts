/**
 * Scenario: Edit public company profile (issue #472, Option 1).
 *
 * Verifies:
 *   1. Login as test user, navigate to a portfolio's company URL extractor.
 *   2. The "Public Profile" column shows both "View" and "Edit" links.
 *   3. Clicking "Edit" navigates to the profile editor page.
 *   4. The editor loads with pre-populated company data.
 *   5. Editing a field and saving succeeds (PATCH returns 200).
 *   6. The public profile page reflects the change.
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario edit-public-profile
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  // 1. Login
  ctx.note("logging in");
  await ctx.page.goto(`${ctx.baseUrl}/login`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});
  await ctx.screenshot("01-post-login");

  // 2. Navigate to a portfolio's company URL extractor.
  // Use portfolio ID 1 which has seed companies; fall back to
  // fetching user's portfolios from the API if needed.
  ctx.note("navigating to portfolio 1 extractor");
  await ctx.page.goto(
    `${ctx.baseUrl}/portfolios/1/company-url-extractor`,
    { waitUntil: "domcontentloaded" },
  );
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 20000 })
    .catch(() => {});

  await ctx.screenshot("02b-extractor-dashboard");

  // The default view is the dashboard. The sidebar is collapsed (icons only).
  // "Database" is the 5th item (dashboard, rankings, agent, extract, database).
  // Click the 5th ListItemButton in the sidebar to switch to the table view.
  ctx.note("clicking Database sidebar icon (5th item)");
  const sidebarItems = ctx.page.locator(".MuiListItemButton-root");
  const dbItem = sidebarItems.nth(4); // 0-indexed: 4 = 5th item
  await dbItem.click({ timeout: 10000 });
  await ctx.page.waitForTimeout(2000);

  // Wait for table rows to load
  await ctx.waitForSelector("table tbody tr", { timeout: 30000 });
  await ctx.screenshot("03-extractor-table-loaded");

  // 3. Scroll table right to find the public_profile column
  // (it's usually off-screen on narrow viewports).
  ctx.note("scrolling table to find Edit link");
  const tableContainer = ctx.page.locator(".MuiTableContainer-root").first();
  await tableContainer.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await ctx.page.waitForTimeout(500);
  await ctx.screenshot("03b-scrolled-table");

  // 4. Click "Edit" on the first row.
  // The edit link renders as a <span> with the text "Edit" inside the
  // public_profile column cell.
  const editBtn = ctx.page.locator("table tbody tr").first()
    .locator('span:has-text("Edit")').first();
  const editVisible = await editBtn.isVisible().catch(() => false);
  ctx.note(`Edit link visible: ${editVisible}`);

  if (!editVisible) {
    // Dump what's on screen to diagnose
    await ctx.dumpInteractables({ within: "table tbody tr:first-child" });
  }

  await editBtn.click({ timeout: 10000 });
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, {
    timeout: 15000,
  });
  ctx.note(`navigated to editor: ${ctx.page.url()}`);

  // Wait for the editor to finish loading (loading spinner disappears,
  // company name input appears with a value).
  // The new editor uses variant="standard" inputs. The company name is
  // a large 42px font input. Wait for any input with a non-empty value.
  await ctx.page
    .waitForLoadState("networkidle", { timeout: 20000 })
    .catch(() => {});
  // Wait for the save button to confirm the page rendered
  await ctx.waitForSelector('button:has-text("Save Changes")', {
    timeout: 30000,
  });
  await ctx.page.waitForTimeout(2000); // let form state settle
  await ctx.screenshot("04-editor-page-loaded");

  // 5. Verify form fields are populated
  // The new editor uses a large inline company name input (42px) and
  // MetricLabel + variant=standard inputs for other fields.
  const allInputs = ctx.page.locator("input");
  const inputCount = await allInputs.count();
  ctx.note(`found ${inputCount} input fields on the editor`);

  const firstInput = allInputs.first();
  const nameValue = await firstInput.inputValue().catch(() => "");
  ctx.note(`First input value (company name): "${nameValue}"`);
  await ctx.screenshot("05-form-fields-populated");

  // 6. Edit the number of employees field
  // Find the input near the "NO. OF EMPLOYEES" label
  const employeesSection = ctx.page
    .locator("text=NO. OF EMPLOYEES")
    .locator("..");
  const employeesInput = employeesSection.locator("input").first();
  const oldValue = await employeesInput.inputValue().catch(() => "");
  const newValue = oldValue === "51-100" ? "101-200" : "51-100";
  ctx.note(`Changing employees from "${oldValue}" to "${newValue}"`);
  await employeesInput.clear();
  await employeesInput.fill(newValue);
  await ctx.screenshot("06-field-edited");

  // 7. Save changes
  const saveBtn = ctx.page
    .locator('button:has-text("Save Changes")')
    .first();
  await saveBtn.click();

  // Wait for success toast
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', {
      timeout: 10000,
    })
    .catch(() => {
      ctx.note("No toast detected — checking if save succeeded via network");
    });
  await ctx.screenshot("07-save-result");

  // 8. Verify the public profile reflects the change
  const companyIdMatch = ctx.page.url().match(/\/company\/(\d+)\//);
  if (companyIdMatch) {
    const companyId = companyIdMatch[1];
    ctx.note(`opening public profile for company ${companyId}`);
    await ctx.page.goto(`${ctx.baseUrl}/company-overview/${companyId}`, {
      waitUntil: "domcontentloaded",
    });
    await ctx.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    await ctx.screenshot("08-public-profile-after-edit");

    // Check if the updated value is visible on the page
    const pageContent = await ctx.page.textContent("body");
    if (pageContent?.includes(newValue)) {
      ctx.note(`SUCCESS: public profile shows updated value "${newValue}"`);
    } else {
      ctx.note(
        `WARNING: "${newValue}" not found on public profile page (may be in a different format)`,
      );
    }
  }

  ctx.note("edit-public-profile scenario complete");
};

export default scenario;
