/**
 * Self-test: render inline HTML via setContent so the harness can be
 * verified without any backend or network.
 */
import type { ScenarioFn } from "../scenario.ts";

const HTML = `<!doctype html>
<html><body style="font-family:sans-serif;padding:40px;background:#f5f5f5">
<h1 style="color:#203E5C">ui-verify self-test</h1>
<p>If you can read this screenshot, the harness works.</p>
<button id="btn">Click me</button>
<p id="status">not clicked</p>
<script>
  document.getElementById('btn').addEventListener('click', () => {
    document.getElementById('status').textContent = 'clicked!';
  });
</script>
</body></html>`;

const scenario: ScenarioFn = async (ctx) => {
  ctx.note("rendering inline HTML");
  await ctx.page.setContent(HTML, { waitUntil: "domcontentloaded" });
  await ctx.screenshot("inline-html");
  await ctx.page.click("#btn");
  await ctx.page.waitForFunction(() => document.getElementById("status")?.textContent === "clicked!");
  await ctx.screenshot("after-click");
};

export default scenario;
