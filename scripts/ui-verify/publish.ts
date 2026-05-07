#!/usr/bin/env bun
/**
 * Publish ui-verify artifacts to the `ui-verify-artifacts` orphan branch
 * and emit a markdown block ready to paste into a PR description.
 *
 * This script does the heavy lifting that Claude can't do via MCP alone:
 *   1. Converts the scenario video (.webm) to an inline-renderable GIF.
 *   2. Force-writes the artifacts to pr-<N>/ on the orphan branch via git.
 *   3. Prints a <!-- ui-verify:start --> ... <!-- ui-verify:end --> block to
 *      stdout. The caller (Claude) then substitutes that block into the PR
 *      description via mcp__github__update_pull_request.
 *
 * Usage:
 *   bun scripts/ui-verify/publish.ts --pr <number> --dir <artifact-dir>
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

type Args = { pr: number; dir: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const prRaw = get("--pr");
  const dir = get("--dir");
  if (!prRaw || !dir) {
    console.error("Usage: bun scripts/ui-verify/publish.ts --pr <number> --dir <artifact-dir>");
    process.exit(1);
  }
  const pr = Number(prRaw);
  if (!Number.isInteger(pr) || pr <= 0) {
    console.error(`--pr must be a positive integer (got: ${prRaw})`);
    process.exit(1);
  }
  const resolvedDir = resolve(dir);
  if (!existsSync(resolvedDir) || !statSync(resolvedDir).isDirectory()) {
    console.error(`--dir must be an existing directory (got: ${resolvedDir})`);
    process.exit(1);
  }
  return { pr, dir: resolvedDir };
}

function findWebm(dir: string): string | null {
  const entries = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  return entries.length > 0 ? join(dir, entries[0]) : null;
}

function listScreenshots(dir: string): string[] {
  const shotsDir = join(dir, "screenshots");
  if (!existsSync(shotsDir)) return [];
  return readdirSync(shotsDir)
    .filter((f) => f.endsWith(".png"))
    .sort();
}

const ARTIFACTS_BRANCH = "ui-verify-artifacts";
const REPO_OWNER = "LaunchForce-AI";
const REPO_NAME = "venture-impact-platform";

function repoBlobUrl(branch: string, path: string): string {
  // Absolute URL to the github.com HTML viewer for a file. Works for private
  // repos when the viewer is logged in (the github.com HTML page renders PNG
  // and GIF previews inline). Inline image embeds via ?raw=true do NOT work
  // for private repos because the redirect to raw.githubusercontent.com is
  // cross-origin and drops github.com session cookies — see
  // LaunchForce-AI/venture-impact-platform#463.
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${branch}/${path}`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const prFolder = `pr-${args.pr}`;

  const headSha = (await $`git rev-parse HEAD`.text()).trim();
  const shortSha = headSha.slice(0, 7);
  const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();

  const webm = findWebm(args.dir);
  const screenshots = listScreenshots(args.dir);
  if (screenshots.length === 0) {
    console.error(`No screenshots found in ${args.dir}/screenshots/`);
    process.exit(1);
  }

  const summaryPath = join(args.dir, "summary.json");
  if (!existsSync(summaryPath)) {
    console.error(`summary.json not found at ${summaryPath}`);
    process.exit(1);
  }
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as {
    scenario: string;
    success: boolean;
    consoleErrorCount: number;
    networkErrorCount: number;
    durationMs: number;
    failure: string | null;
    pageError: string | null;
  };

  // Annotate the summary we upload with SHA + branch + PR, so reviewers can
  // confirm which commit each proof bundle was captured for.
  const annotatedSummary = {
    ...summary,
    commitSha: headSha,
    commitShortSha: shortSha,
    branch,
    pr: args.pr,
    publishedAt: new Date().toISOString(),
  };

  // 1. Convert .webm to .gif so GitHub renders it inline in the PR description.
  let gifPath: string | null = null;
  if (webm) {
    gifPath = join(args.dir, "verification.gif");
    console.error(`[publish] converting ${webm} → ${gifPath}`);
    // 15 fps, cap width to 1200px, preserve aspect ratio with even height.
    // No time cap — prioritize correctness per user direction.
    await $`ffmpeg -y -i ${webm} -vf "fps=15,scale='min(1200,iw)':-2:flags=lanczos" -loop 0 ${gifPath}`.quiet();
  } else {
    console.error("[publish] no .webm found in artifact dir; skipping GIF conversion");
  }

  // 2. Push artifacts to the orphan branch via a temp worktree.
  const tempWorktree = mkdtempSync(join(tmpdir(), "ui-verify-wt-"));
  try {
    // Ensure we have the latest view of the branch on origin.
    const branchExists = (await $`git ls-remote --heads origin ${ARTIFACTS_BRANCH}`.text()).trim().length > 0;

    if (branchExists) {
      console.error(`[publish] fetching existing ${ARTIFACTS_BRANCH}`);
      await $`git fetch origin ${ARTIFACTS_BRANCH}:refs/remotes/origin/${ARTIFACTS_BRANCH}`.quiet();
      await $`git worktree add ${tempWorktree} origin/${ARTIFACTS_BRANCH}`.quiet();
      await $`git -C ${tempWorktree} checkout -B ${ARTIFACTS_BRANCH}`.quiet();
    } else {
      console.error(`[publish] creating orphan ${ARTIFACTS_BRANCH}`);
      await $`git worktree add --detach ${tempWorktree} HEAD`.quiet();
      await $`git -C ${tempWorktree} checkout --orphan ${ARTIFACTS_BRANCH}`.quiet();
      await $`git -C ${tempWorktree} rm -rf .`.quiet().nothrow();
      // Write a tiny README so the branch isn't empty.
      await Bun.write(
        join(tempWorktree, "README.md"),
        "# ui-verify artifacts\n\nThis branch is auto-managed. Do not commit to it manually.\nArtifacts for each open PR live under `pr-<number>/`.\nA weekly GitHub Actions cron cleans up folders for closed PRs.\n",
      );
    }

    // Wipe any prior artifacts for this PR and copy fresh ones in.
    const prFolderAbs = join(tempWorktree, prFolder);
    await $`rm -rf ${prFolderAbs}`.quiet();
    await $`mkdir -p ${join(prFolderAbs, "screenshots")}`.quiet();

    for (const shot of screenshots) {
      await $`cp ${join(args.dir, "screenshots", shot)} ${join(prFolderAbs, "screenshots", shot)}`.quiet();
    }
    if (gifPath && existsSync(gifPath)) {
      await $`cp ${gifPath} ${join(prFolderAbs, "verification.gif")}`.quiet();
    }
    if (webm) {
      await $`cp ${webm} ${join(prFolderAbs, "video.webm")}`.quiet();
    }
    // Write the ANNOTATED summary (with SHA etc.) to the artifacts branch,
    // not the raw one — reviewers should see which commit this belongs to.
    await Bun.write(join(prFolderAbs, "summary.json"), JSON.stringify(annotatedSummary, null, 2));

    const consoleLog = join(args.dir, "console.log");
    const networkLog = join(args.dir, "network-errors.log");
    if (existsSync(consoleLog)) await $`cp ${consoleLog} ${join(prFolderAbs, "console.log")}`.quiet();
    if (existsSync(networkLog)) await $`cp ${networkLog} ${join(prFolderAbs, "network-errors.log")}`.quiet();

    await $`git -C ${tempWorktree} add -A`.quiet();
    // No-op safeguard: skip commit if nothing changed.
    const status = (await $`git -C ${tempWorktree} status --porcelain`.text()).trim();
    if (status.length === 0) {
      console.error("[publish] no artifact changes to commit; proceeding to description update");
    } else {
      await $`git -C ${tempWorktree} -c user.name=ui-verify-bot -c user.email=ui-verify-bot@users.noreply.github.com commit -m ${`pr-${args.pr}: update ui-verify artifacts`}`.quiet();
      console.error(`[publish] pushing ${ARTIFACTS_BRANCH}`);
      await $`git -C ${tempWorktree} push -u origin ${ARTIFACTS_BRANCH}`.quiet();
    }

    // Write a local marker so the PostToolUse hook can skip the reminder
    // when proof has already been published for this exact SHA.
    const gitDir = (await $`git rev-parse --git-dir`.text()).trim();
    await Bun.write(
      join(gitDir, "ui-verify-last-published"),
      JSON.stringify({ sha: headSha, branch, pr: args.pr, at: new Date().toISOString() }, null, 2),
    );
  } finally {
    try {
      await $`git worktree remove --force ${tempWorktree}`.quiet().nothrow();
    } catch {}
    try {
      rmSync(tempWorktree, { recursive: true, force: true });
    } catch {}
  }

  // 3. Print the ready-to-paste markdown block to stdout.
  // We default to a plain-link table format because inline image embeds via
  // ?raw=true do NOT render in private-repo PR descriptions (cookie domain
  // mismatch — see LaunchForce-AI/venture-impact-platform#463). Reviewers
  // click each link and the github.com HTML viewer previews the PNG/GIF.
  const statusEmoji = summary.success ? "✅" : "❌";
  const statusWord = summary.success ? "Success" : "Failed";
  const durationSec = (summary.durationMs / 1000).toFixed(1);
  const headLine = `${statusEmoji} **${statusWord}** — scenario \`${summary.scenario}\` · ${screenshots.length} screenshot${screenshots.length === 1 ? "" : "s"} · ${summary.consoleErrorCount} console error${summary.consoleErrorCount === 1 ? "" : "s"} · ${summary.networkErrorCount} network error${summary.networkErrorCount === 1 ? "" : "s"} · ${durationSec}s`;

  const lines: string[] = [];
  lines.push("<!-- ui-verify:start -->");
  // Machine-parseable SHA marker used by the PostToolUse hook to decide
  // whether proof is already up to date for the current commit.
  lines.push(`<!-- ui-verify:sha=${headSha} -->`);
  lines.push("## 🧪 UI Verification");
  lines.push("");
  lines.push(headLine);
  if (summary.failure) lines.push(`> **Failure:** ${summary.failure}`);
  if (summary.pageError) lines.push(`> **Page error:** ${summary.pageError}`);
  lines.push(
    `*Captured ${new Date().toISOString()} for commit [\`${shortSha}\`](https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${args.pr}/commits/${headSha})*`,
  );
  lines.push("");
  lines.push(
    `> **Note:** This is a private repo. Click each link below to view the screenshot/GIF in the github.com file viewer (inline image embeds do not work for private repos — see LaunchForce-AI/venture-impact-platform#463).`,
  );
  lines.push("");

  lines.push("### Screenshots — click each to view");
  lines.push("");
  lines.push("| # | Screenshot |");
  lines.push("|---|------------|");
  screenshots.forEach((shot, i) => {
    const link = repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/screenshots/${shot}`);
    lines.push(`| ${i + 1} | [\`${shot}\`](${link}) |`);
  });
  lines.push("");

  if (gifPath) {
    lines.push("### Recording");
    lines.push("");
    lines.push(`- [\`verification.gif\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/verification.gif`)}) — full scenario as an animated GIF`);
    if (webm) lines.push(`- [\`video.webm\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/video.webm`)}) — raw Playwright recording`);
    lines.push("");
  } else if (webm) {
    lines.push("### Recording");
    lines.push("");
    lines.push(`- [\`video.webm\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/video.webm`)}) — raw Playwright recording`);
    lines.push("");
  }

  lines.push("### Raw logs");
  lines.push("");
  lines.push(`- [\`summary.json\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/summary.json`)})`);
  lines.push(`- [\`console.log\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/console.log`)})`);
  lines.push(`- [\`network-errors.log\`](${repoBlobUrl(ARTIFACTS_BRANCH, `${prFolder}/network-errors.log`)})`);
  lines.push("<!-- ui-verify:end -->");

  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
