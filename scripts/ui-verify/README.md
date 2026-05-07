# UI Self-Verification Harness

Thin Playwright wrapper so the agent (or a human) can drive the admin-app UI
headlessly, capture screenshots + video + console + network errors, dump the
artifacts to a directory that can be read back, AND publish them as visible
proof on the PR.

## Why it exists

Frontend PRs are easy to approve on vibes ("looks fine in the diff"). This
harness makes you (or Claude) actually run the changed UI, capture what
happens, and attach that to the PR so reviewers see it without cloning and
running anything. Keyed by commit SHA, so stale proof is detectable.

## When to use

On any frontend PR. After every commit that touches the UI. The
`PostToolUse` hook in `.claude/settings.json` will nudge you if you pushed
frontend changes without up-to-date proof for the current HEAD SHA.

Two target modes:
- **Local** (default): drive `http://localhost:3010` (`craco start`)
- **Remote**: drive a Render PR-preview (`--base-url https://<pr-preview>.onrender.com`)

## Prereqs

Playwright + Chromium are preinstalled on Claude Code Web sandboxes
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Locally, run once:

```bash
npm i -D playwright
npx playwright install chromium
```

> **Note for first-time setup**: this repo uses **npm workspaces** (see the
> root `package.json` `"workspaces": ["frontend/*"]`). All node deps install
> at the **repo root** with `npm install` — running it from
> `frontend/admin-app` is a no-op. If `craco`, `react-scripts`, or `playwright`
> is missing, run `npm install` from the repo root, not from the admin-app
> subdirectory.

The admin-app dev server must be running if you're targeting localhost. The
default login uses the seeded test user `alona@impactforesight.io / password123`
(override with `--email` / `--password` or `UI_VERIFY_EMAIL` / `UI_VERIFY_PASSWORD`).

To start the dev stack from a fresh clone:

```bash
# 1. Backend (embedded postgres) — wait ~2-3 min for "Started Application"
SYSADMIN_API_KEY=$SYSADMIN_API_KEY mvn spring-boot:run \
  -Dmaven.repo.local=./.m2-cache --offline \
  -Dskip.npm \
  -Dspring-boot.run.profiles=embedded-postgres &

# 2. Frontend (port 3010)
cd frontend/admin-app && BROWSER=none PORT=3010 npm start &
```

## Running a scenario

```bash
bun scripts/ui-verify/verify.ts --scenario smoke-login
# → artifacts land in /tmp/ui-verify/<timestamp>-smoke-login/
#   ├── screenshots/001-login-page.png, 002-post-login-home.png, ...
#   ├── <video>.webm
#   ├── console.log
#   ├── network-errors.log
#   └── summary.json
```

Common flags:

| flag | default | purpose |
|---|---|---|
| `--scenario <name>` | required | file in `scenarios/<name>.ts` |
| `--base-url <url>` | `http://localhost:3010` | target app |
| `--out <dir>` | `/tmp/ui-verify/<ts>-<scenario>` | artifact dir |
| `--email` / `--password` | seeded test user | login credentials |
| `--no-login` | off | skip default login helper |
| `--no-video` | off | skip video recording |
| `--headed` | off | run with head (requires Xvfb) |

Exit code is non-zero if the scenario threw or a page error fired, which makes
it easy to pipe through `&& echo OK`.

## Writing a new scenario

Drop a file at `scripts/ui-verify/scenarios/<name>.ts`:

```ts
import type { ScenarioFn } from "../scenario.ts";

const scenario: ScenarioFn = async (ctx) => {
  await ctx.login();
  await ctx.page.goto(`${ctx.baseUrl}/portfolios`);
  await ctx.page.waitForSelector("h1:has-text('Portfolios')");
  await ctx.screenshot("portfolios-list");
  await ctx.page.getByRole("button", { name: /new portfolio/i }).click();
  await ctx.screenshot("new-portfolio-dialog");
};

export default scenario;
```

The `ctx` exposes:
- `page`, `context` — Playwright objects (full API)
- `baseUrl` — the resolved target URL
- `login(email?, pw?)` — UI login via the `/login` form
- `screenshot(name)` — numbered PNG in the artifact dir
- `note(msg)` — append a line to `summary.json` steps
- `waitForSelector(selector, opts?)` — preferred over `ctx.page.waitForSelector`. On timeout it auto-screenshots the live DOM (named `wait-timeout-<selector>` by default) before re-throwing, so you get diagnostics on the FIRST failed iteration without manually adding a screenshot before every wait.
- `dumpInteractables(opts?)` — prints a compact list of likely click targets (buttons, links, inputs, MUI cards / list items / menu items, ARIA roles) within `body` (or `opts.within` selector). Useful when a selector is failing in mysterious ways and you want to know what's actually on the page without re-running the scenario. Output goes to both stdout and `summary.json` steps.

Throw to fail the scenario; a `FAILURE` screenshot is captured automatically.

### Iterating on selectors fast

The most common failure mode is a wrong selector. Two patterns make iteration tight:

```ts
// Bad: when this times out, the FAILURE screenshot fires AFTER your throw,
// which captures a state different from what was on screen at the failure.
await ctx.page.waitForSelector("button:has-text('New portfolio')", { timeout: 10000 });

// Good: ctx.waitForSelector auto-screenshots the live DOM on timeout.
await ctx.waitForSelector("button:has-text('New portfolio')", { timeout: 10000 });
```

If you're stuck on "selector matches nothing but I can see the element in the screenshot," dump what's actually clickable:

```ts
await ctx.dumpInteractables({ within: "header", limit: 20 });
// → printed to stdout AND saved in summary.json:
//   [dumpInteractables] within=header matches=8
//     [button] <button.MuiIconButton-root> "menu"
//     [.MuiAvatar-root] <div.MuiAvatar-root> "AK"
//     ...
```

Common foot-guns I've personally hit:
- `<AppBar component='nav'>` from MUI renders as `<nav class="MuiAppBar-root">`, not `<header>`. Use `nav.MuiAppBar-root`.
- `<Typography variant='h4'>Foo</Typography>` does render as `<h4>Foo</h4>`, but if a `<Loader>` is still mounting you may be too early — wait for a more deterministic anchor.
- Buttons with onboarding tooltips overlaid (e.g. `OnboardingTooltip` in `Portfolios.js`) sometimes report `isVisible() === true` but don't accept clicks until the tooltip closes.

## Reading results back

The agent should read `summary.json` first (contains success flag + counts +
step timeline), then selected screenshots. `console.log` and
`network-errors.log` are small text files safe to read whole.

## Publishing proof to a PR

The publishing path depends on **where you're running** Claude Code. Pick one:

### Path A — Local Claude Code (CLI / desktop / IDE)

After a successful run:

```bash
bun scripts/ui-verify/publish.ts --pr <N> --dir /tmp/ui-verify/<ts>-<scenario>
```

What this does:
1. Converts `<uuid>.webm` → `verification.gif` via ffmpeg. GitHub renders GIFs
   inline in markdown; it doesn't render `.webm`. Raw `.webm` is uploaded too
   for full-fidelity download.
2. Pushes screenshots + GIF + webm + annotated `summary.json` (includes commit
   SHA, branch, PR number) to the `ui-verify-artifacts` orphan branch under
   `pr-<N>/`, wiping any prior iteration's files for that PR.
3. Writes `.git/ui-verify-last-published` so the PostToolUse hook knows proof
   is up-to-date for the current HEAD SHA and won't nudge again.
4. Emits a `<!-- ui-verify:start --> ... <!-- ui-verify:end -->` markdown block
   to stdout containing a **plain-link table** of artifacts. This format works
   for **private repos** because reviewers click into the github.com HTML
   viewer (which has their session cookie). Inline `?raw=true` image embeds do
   NOT work for private repos — the redirect to `raw.githubusercontent.com` is
   cross-origin and drops the session cookie. Tracked in
   LaunchForce-AI/venture-impact-platform#463.

Then paste the printed block into the PR description with `gh pr edit` (or via
`mcp__github__update_pull_request` if you're an agent).

### Path B — Claude Code Web (REQUIRED, not optional)

`bun scripts/ui-verify/publish.ts` **will fail** in Claude Code Web. The
sandbox's git-commit signing infrastructure returns HTTP 400 ("missing
source") on every commit attempt, so the local commit + push to
`ui-verify-artifacts` cannot complete. This is not intermittent — it is the
default state of every Web sandbox.

**The required workflow in Claude Code Web is to publish through the sysadmin
`/exec` endpoint on the prod droplet**, which has working `git` + authenticated
`gh` and bypasses the sandbox signing layer entirely. The pattern (verified
end-to-end in PR #462):

1. **Convert webm → gif locally in the sandbox** (ffmpeg works fine):
   ```bash
   ffmpeg -y -i /tmp/ui-verify/<ts>/<uuid>.webm \
     -vf "fps=15,scale='min(1200,iw)':-2:flags=lanczos" -loop 0 \
     /tmp/ui-verify/<ts>/verification.gif
   ```

2. **Tar + base64 the artifact bundle locally**:
   ```bash
   cd /tmp/ui-verify/<ts>
   tar czf /tmp/ui-verify-pr-<N>.tar.gz \
     screenshots verification.gif <uuid>.webm summary.json console.log network-errors.log
   base64 -w0 /tmp/ui-verify-pr-<N>.tar.gz > /tmp/ui-verify-pr-<N>.tar.gz.b64
   ```

3. **Chunk the base64 to ~50KB pieces** to fit under the sysadmin endpoint's
   limits (nginx default `client_max_body_size = 1MB`, plus Linux `ARG_MAX`
   limits how big a single shell command can be):
   ```bash
   split -b 50000 /tmp/ui-verify-pr-<N>.tar.gz.b64 /tmp/uvchunk-
   ```

4. **Upload each chunk** via `POST /sysadmin/exec` using `printf '%s' '<chunk>' >> /tmp/...b64`. Use `>` for the first chunk, `>>` for the rest. A typical
   2.4MB base64 payload needs ~49 chunks. Use a `node` script — shell
   variable expansion will hit ARG_MAX with chunks much above 50KB. Reference
   implementation pattern is preserved in the PR #462 commit history.

5. **From the droplet** (one final `/sysadmin/exec` call), decode + extract +
   `git clone --depth 1 --branch ui-verify-artifacts` + copy artifacts to
   `pr-<N>/` + commit as `ui-verify-bot` + `git push`. The droplet's `gh` CLI
   is logged in as `aking13` (per `gh auth status`) so the push works without
   any extra setup.

6. **Build the `<!-- ui-verify:start --> ... <!-- ui-verify:end -->` markdown
   block manually** (since `publish.ts` couldn't print it). Use the format
   from `publish.ts` lines 200-260 — plain-link table referencing
   `https://github.com/<owner>/<repo>/blob/ui-verify-artifacts/pr-<N>/<file>`
   URLs. Splice the block into the PR description with
   `mcp__github__update_pull_request` (replace any prior block with the same
   markers; leave the rest of the description alone).

7. **Make sure the PR body contains the current `<!-- ui-verify:sha=<SHA> -->`
   marker.** The PostToolUse hook reads that marker on subsequent pushes and
   backfills the local `.git/ui-verify-last-published` file, so future hook
   runs stay quiet.

If you find yourself running into the chunking limits frequently, the
long-term fix is to bump `client_max_body_size` in the sysadmin nginx server
block (currently inherits the default 1 MB) and/or build a streaming-upload
variant of the sysadmin endpoint. Until that lands, the chunked-upload pattern
above is the canonical Claude Code Web workflow — not a fallback.

The caller (Claude) then pastes that block into the PR description with `gh`.
Read the current body with `gh pr view <N> --json body --jq .body`, replace the
existing block between those delimiters if present (or append it if not), then
write it back with `gh pr edit <N> --body-file <file>`. Leave the rest of the
description alone.

The block includes a machine-parseable `<!-- ui-verify:sha=<full-sha> -->`
comment so reviewers (and the hook) can see exactly which commit the proof
was captured for.

## Orphan branch

Artifacts live on `ui-verify-artifacts` — an orphan branch that shares no
history with `main` and is never merged anywhere. `pr-<N>/` folders are kept
indefinitely; there is no scheduled cleanup. `main` stays clean forever.

## The nudge hook

> **Status (2026-04-15): not currently wired up.** The `posttool-hook.sh` script is preserved on disk but its `PostToolUse` registration was removed from `.claude/settings.json` while we evaluate whether it adds value in real Claude Code Web sessions vs the CLAUDE.md guidance + active human steering. Tracking + the verbatim re-enable snippet are in LaunchForce-AI/venture-impact-platform#469.

When wired up, `posttool-hook.sh` sits as a `PostToolUse` hook on `Bash`
(the script itself filters for `git push` commands internally). After any
`git push`, it checks:
- Is the current branch a PR branch (not `main`/`master`)?
- Did the last commit touch `frontend/**`?
- Does the local marker match the current HEAD SHA?
- If not, does the open PR body already contain `<!-- ui-verify:sha=<HEAD> -->`?

If frontend changed and proof is stale (or missing), the hook prints a
reminder telling you to run the harness and publish. If the PR body is already
fresh, it silently backfills the local marker so future pushes stay quiet.
It's advisory — it never blocks the push.

If there is no open PR for the current branch yet, the reminder stops at
"verify locally now" and tells you to publish later after opening the PR.
