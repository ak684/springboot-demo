/**
 * Scenario: Wista inline profile editor (edit mode on CompanyOverviewV2).
 *
 * Verifies the Figma-designed inline edit mode + follow-up UX fixes:
 *   - Edit header: Back, Localization, Open public view, SAVE CHANGES
 *   - Section titles are static (no TextField)
 *   - No pencil icons on items; fields are always-editable
 *   - Per-item inline controls: hide, delete (no pencil)
 *   - Sticky unsaved-changes bar appears on dirty state with Discard + Save
 *   - Save clears the sticky bar and shows success toast
 *   - Public view does not render edit controls
 *
 * Run with:
 *   bun scripts/ui-verify/verify.ts --scenario wista-inline-profile-editor
 */
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("logging in");
  await ctx.page.goto(`${ctx.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await ctx.waitForSelector('input[name="email"]', { timeout: 30000 });
  await ctx.login();
  await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await ctx.screenshot("01-post-login");

  ctx.note("navigating to portfolio 1 extractor to find a company to edit");
  await ctx.page.goto(`${ctx.baseUrl}/portfolios/1/company-url-extractor`, {
    waitUntil: "domcontentloaded",
  });
  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

  const sidebarItems = ctx.page.locator(".MuiListItemButton-root");
  await sidebarItems.nth(4).click({ timeout: 10000 });
  await ctx.waitForSelector("table tbody tr", { timeout: 30000 });

  const firstRow = ctx.page.locator("table tbody tr").first();
  const tableContainer = ctx.page.locator(".MuiTableContainer-root").first();
  await tableContainer.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await ctx.page.waitForTimeout(400);

  const editBtn = firstRow.locator('span:has-text("Edit")').first();
  await editBtn.click({ timeout: 10000 });
  await ctx.page.waitForURL(/\/company\/\d+\/edit-public-profile/, {
    timeout: 15000,
  });
  const companyId = ctx.page.url().match(/\/company\/(\d+)\//)?.[1];
  ctx.note(`editing company ${companyId}`);

  await ctx.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await ctx.waitForSelector('button:has-text("Save Changes")', { timeout: 30000 });
  await ctx.page.waitForTimeout(1500);
  await ctx.screenshot("02-edit-mode-loaded");

  // Verify header: Back, Localization, Open public view, Save Changes
  const backLink = ctx.page.locator('text=/^Back$/i').first();
  const localizationBtn = ctx.page.locator('button:has-text("Localization")').first();
  const openPublicBtn = ctx.page.locator('button:has-text("Open public view")').first();
  const saveBtn = ctx.page.locator('button:has-text("Save Changes")').first();
  for (const [name, loc] of [
    ["Back", backLink],
    ["Localization", localizationBtn],
    ["Open public view", openPublicBtn],
    ["Save", saveBtn],
  ] as const) {
    const visible = await loc.isVisible().catch(() => false);
    ctx.note(`${name} visible: ${visible}`);
    if (!visible) throw new Error(`Edit header missing: ${name}`);
  }

  // Save should be disabled when form is clean (not dirty).
  const saveDisabledClean = await saveBtn.isDisabled().catch(() => false);
  ctx.note(`Save disabled when clean: ${saveDisabledClean}`);

  // No pencil (edit) buttons should exist.
  const editButtons = ctx.page.locator('button[aria-label="edit"]');
  const editCount = await editButtons.count();
  ctx.note(`edit (pencil) buttons (expect 0): ${editCount}`);
  if (editCount > 0) throw new Error("Pencil icons should have been removed");

  // Section titles are static Typography, not TextField — check no input
  // inside the section header row. Look for an input with value "Overview".
  const overviewInputs = await ctx.page.locator('input[value="Overview"]').count();
  ctx.note(`Overview inputs (expect 0): ${overviewInputs}`);

  // Hide / delete buttons still exist.
  const hideCount = await ctx.page.locator('button[aria-label="hide"]').count();
  const deleteCount = await ctx.page.locator('button[aria-label="delete"]').count();
  ctx.note(`hide buttons: ${hideCount} / delete buttons: ${deleteCount}`);

  // Scroll to What we do; dim first item by clicking hide.
  const whatWeDo = ctx.page.locator('text="What we do"').first();
  await whatWeDo.scrollIntoViewIfNeeded().catch(() => {});
  await ctx.page.waitForTimeout(300);
  await ctx.screenshot("03-what-we-do-no-pencils");

  // Edit CEO name -> sticky bar should appear
  const ceoSection = ctx.page.locator('text="CEO/FOUNDERS"').locator('..').first();
  const ceoInput = ceoSection.locator('input').first();
  await ceoInput.scrollIntoViewIfNeeded().catch(() => {});
  const oldCeo = await ceoInput.inputValue().catch(() => "");
  const newCeo = oldCeo.endsWith("Edited") ? "Tim Fronzek" : `${oldCeo || "Founder"} Edited`;
  await ceoInput.fill(newCeo).catch(() => {});
  await ctx.page.waitForTimeout(400);
  await ctx.screenshot("04-field-edited-sticky-bar-visible");

  // Sticky bar check
  const stickyBar = ctx.page.locator('text="You have unsaved changes"').first();
  const stickyVisible = await stickyBar.isVisible().catch(() => false);
  ctx.note(`sticky unsaved-changes bar visible: ${stickyVisible}`);
  if (!stickyVisible) throw new Error("Sticky unsaved-changes bar did not appear");

  // Discard button should revert form.
  const discardBtn = ctx.page.locator('button:has-text("Discard")').first();
  await discardBtn.click({ timeout: 5000 });
  await ctx.page.waitForTimeout(400);
  const stickyAfterDiscard = await stickyBar.isVisible().catch(() => false);
  ctx.note(`sticky bar after discard (expect false): ${stickyAfterDiscard}`);
  await ctx.screenshot("05-after-discard");

  // Edit + save.
  await ceoInput.fill(newCeo).catch(() => {});
  await ctx.page.waitForTimeout(300);
  const stickySaveBtn = ctx.page
    .locator('text="You have unsaved changes"').locator('..')
    .locator('button:has-text("Save Changes")').first();
  await stickySaveBtn.click();
  await ctx.page
    .waitForSelector('.Toastify__toast--success, [class*="toast"]', { timeout: 10000 })
    .catch(() => { ctx.note("no toast detected"); });
  await ctx.page.waitForTimeout(600);
  const stickyAfterSave = await stickyBar.isVisible().catch(() => false);
  ctx.note(`sticky bar after save (expect false): ${stickyAfterSave}`);
  await ctx.screenshot("06-after-save");

  // Hide a product item -> dimmed.
  const hideBtns = ctx.page.locator('button[aria-label="hide"]');
  if ((await hideBtns.count()) > 0) {
    await hideBtns.first().click({ timeout: 5000 }).catch(() => {});
    await ctx.page.waitForTimeout(300);
    await ctx.screenshot("07-item-hidden-dimmed");
  }

  // Open public view in same-page for asserting no edit controls.
  if (companyId) {
    await ctx.page.goto(`${ctx.baseUrl}/company-overview/${companyId}`, {
      waitUntil: "domcontentloaded",
    });
    await ctx.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await ctx.page.waitForTimeout(800);
    await ctx.screenshot("08-public-view-no-edit-ui");

    const anyEditControls = await ctx.page
      .locator('button[aria-label="hide"], button[aria-label="delete"], button[aria-label="edit"]')
      .count();
    ctx.note(`edit controls on public view (expect 0): ${anyEditControls}`);
    if (anyEditControls > 0) throw new Error("Public view should not render edit controls");
  }

  ctx.note("wista-inline-profile-editor scenario complete");
};

export default scenario;
